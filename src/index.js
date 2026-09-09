const enc = new TextEncoder();
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json; charset=utf-8',...headers}});
const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${crypto.randomUUID()}`;
const b64 = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const randomToken = () => b64(crypto.getRandomValues(new Uint8Array(32)));
const sha256 = async value => b64(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(value))));
const passwordHash = async (password, salt) => {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return b64(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'}, key, 256)));
};
const cookie = request => Object.fromEntries((request.headers.get('cookie')||'').split(';').map(x=>x.trim().split('=').map(decodeURIComponent)).filter(x=>x.length===2));
const sessionCookie = (token, maxAge=28800) => `osc_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
const readBody = async request => { try { return await request.json(); } catch { return {}; } };

const LEARNING_MODULES=['course_iso8583','pos','parser','constructor','atm','ecommerce','wallet','switch_emisor'];
const DAY1_MODULES=['course_iso8583','pos','parser','constructor'];
async function ensureModuleAccessSchema(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS cohort_module_access (
    cohort_id TEXT NOT NULL,module_key TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 0,enabled_at TEXT,updated_by TEXT,updated_at TEXT NOT NULL,
    PRIMARY KEY(cohort_id,module_key),FOREIGN KEY(cohort_id) REFERENCES cohorts(id),FOREIGN KEY(updated_by) REFERENCES users(id))`).run();
}
async function seedCohortModules(env,cohortId,actorId=null){
  await ensureModuleAccessSchema(env); const ts=now();
  await env.DB.batch(LEARNING_MODULES.map(k=>env.DB.prepare(`INSERT OR IGNORE INTO cohort_module_access(cohort_id,module_key,enabled,enabled_at,updated_by,updated_at) VALUES(?,?,?,?,?,?)`).bind(cohortId,k,DAY1_MODULES.includes(k)?1:0,DAY1_MODULES.includes(k)?ts:null,actorId,ts)));
}
async function learningAccess(env,user){
  if(user.platform_role==='OSC_ADMIN')return {progressive:false,enabled:[...LEARNING_MODULES]};
  const consultancy=await env.DB.prepare(`SELECT 1 ok FROM memberships m JOIN tenants t ON t.id=m.tenant_id JOIN licenses l ON l.tenant_id=t.id WHERE m.user_id=? AND m.status='ACTIVE' AND t.tenant_type='CONSULTANCY' AND l.product_id='product_payment' AND l.status='ACTIVE' AND (l.expires_at IS NULL OR l.expires_at>?) LIMIT 1`).bind(user.id,now()).first();
  if(consultancy)return {progressive:false,enabled:[...LEARNING_MODULES]};
  await ensureModuleAccessSchema(env);
  const cohorts=(await env.DB.prepare(`SELECT c.id FROM cohort_enrollments e JOIN cohorts c ON c.id=e.cohort_id JOIN licenses l ON l.cohort_id=c.id WHERE e.user_id=? AND e.status='ACTIVE' AND c.status='ACTIVE' AND l.product_id='product_payment' AND l.status='ACTIVE' AND l.starts_at<=? AND (l.expires_at IS NULL OR l.expires_at>?)`).bind(user.id,now(),now()).all()).results;
  if(!cohorts.length)return {progressive:false,enabled:[...LEARNING_MODULES]};
  for(const c of cohorts)await seedCohortModules(env,c.id);
  const marks=cohorts.map(()=>'?').join(',');
  const rows=(await env.DB.prepare(`SELECT DISTINCT module_key FROM cohort_module_access WHERE cohort_id IN (${marks}) AND enabled=1`).bind(...cohorts.map(c=>c.id)).all()).results;
  return {progressive:true,enabled:rows.map(r=>r.module_key)};
}


async function currentUser(request, env){
  const token=cookie(request).osc_session;
  if(!token)return null;
  const hash=await sha256(token);
  return env.DB.prepare(`SELECT u.id,u.email,u.full_name,u.platform_role,u.status
    FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>? AND u.status='ACTIVE'`).bind(hash,now()).first();
}

async function hasActiveLicense(env,user){
  if(user.platform_role==='OSC_ADMIN')return true;
  const ts=now();
  const row=await env.DB.prepare(`SELECT 1 ok FROM licenses l
    JOIN memberships m ON m.tenant_id=l.tenant_id AND m.user_id=? AND m.status='ACTIVE'
    WHERE l.status='ACTIVE' AND l.starts_at<=? AND (l.expires_at IS NULL OR l.expires_at>?)
    UNION SELECT 1 ok FROM licenses l JOIN cohort_enrollments e ON e.cohort_id=l.cohort_id AND e.user_id=? AND e.status='ACTIVE'
    WHERE l.status='ACTIVE' AND l.starts_at<=? AND (l.expires_at IS NULL OR l.expires_at>?) LIMIT 1`).bind(user.id,ts,ts,user.id,ts,ts).first();
  return !!row;
}

async function productAccess(env,user,productId){
  if(user.platform_role==='OSC_ADMIN')return {tenantId:'tenant_osc',role:'OSC_ADMIN'};
  const ts=now();
  const row=await env.DB.prepare(`SELECT l.tenant_id tenant_id,m.role role FROM licenses l
    JOIN memberships m ON m.tenant_id=l.tenant_id AND m.user_id=? AND m.status='ACTIVE'
    WHERE l.product_id=? AND l.status='ACTIVE' AND l.starts_at<=? AND (l.expires_at IS NULL OR l.expires_at>?)
    ORDER BY l.expires_at DESC LIMIT 1`).bind(user.id,productId,ts,ts).first();
  return row?{tenantId:row.tenant_id,role:row.role}:null;
}

async function paymentWorkspace(env,user){
  const productId='product_payment';
  const access=await productAccess(env,user,productId);
  if(!access)return null;
  let workspace=await env.DB.prepare(`SELECT id,tenant_id,user_id,product_id,status,updated_at FROM workspaces_v4
    WHERE user_id=? AND product_id=? AND tenant_id=? AND status='ACTIVE' LIMIT 1`)
    .bind(user.id,productId,access.tenantId).first();
  if(!workspace){
    const ts=now(),workspaceId=id('ws');
    await env.DB.prepare(`INSERT INTO workspaces_v4(id,user_id,product_id,tenant_id,status,created_at,updated_at)
      VALUES(?,?,?,?,'ACTIVE',?,?) ON CONFLICT(user_id,product_id) DO UPDATE SET tenant_id=excluded.tenant_id,status='ACTIVE',updated_at=excluded.updated_at`)
      .bind(workspaceId,user.id,productId,access.tenantId,ts,ts).run();
    workspace=await env.DB.prepare(`SELECT id,tenant_id,user_id,product_id,status,updated_at FROM workspaces_v4
      WHERE user_id=? AND product_id=? LIMIT 1`).bind(user.id,productId).first();
  }
  return workspace;
}

const validWorkspacePayload=payload=>{
  if(!payload||typeof payload!=='object'||Array.isArray(payload))return false;
  const allowed=['version','studentId','ownerUserId','ownerTenantId','createdAt','updatedAt','retention','transactions','batches','artifacts','events','atmMessages','lastAtmReconciliation','constructorPractices'];
  if(Object.keys(payload).some(key=>!allowed.includes(key)))return false;
  return ['transactions','batches','artifacts','events','atmMessages','constructorPractices'].every(key=>payload[key]===undefined||Array.isArray(payload[key]));
};

const hasSensitiveAnalyticsKey=value=>{
  const blocked=/(^|_)(pan|track1|track2|pin|pin_block|cvv|cvc|raw|trama|message_raw)($|_)/i;
  const visit=node=>{
    if(!node||typeof node!=='object')return false;
    if(Array.isArray(node))return node.some(visit);
    return Object.entries(node).some(([key,item])=>blocked.test(key)||visit(item));
  };
  return visit(value);
};

const validAnalyticsPayload=payload=>payload&&/^\d{4}-\d{2}-\d{2}$/.test(String(payload.fecha||''))&&
  payload.resumen&&Array.isArray(payload.horas)&&payload.horas.length===24&&
  Array.isArray(payload.intervalos_15_minutos)&&payload.intervalos_15_minutos.length===96&&
  Array.isArray(payload.codigos)&&!hasSensitiveAnalyticsKey(payload);

async function requireUser(request,env,roles){
  const user=await currentUser(request,env);
  if(!user)return {error:json({error:'AUTH_REQUIRED'},401)};
  if(roles&&!roles.includes(user.platform_role))return {error:json({error:'FORBIDDEN'},403)};
  return {user};
}

async function audit(env,userId,action,type,entityId,detail={}){
  await env.DB.prepare('INSERT INTO audit_log(id,actor_user_id,action,entity_type,entity_id,detail_json,created_at) VALUES(?,?,?,?,?,?,?)')
    .bind(id('aud'),userId||null,action,type,entityId||null,JSON.stringify(detail),now()).run();
}

async function ensureBankCustomerSchema(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS bank_customers (
    id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,owner_user_id TEXT NOT NULL,customer_number TEXT NOT NULL,
    person_type TEXT NOT NULL DEFAULT 'FISICA',document_type TEXT NOT NULL,document_number TEXT NOT NULL,first_name TEXT NOT NULL DEFAULT '',last_name TEXT NOT NULL DEFAULT '',
    legal_name TEXT,trade_name TEXT,incorporation_date TEXT,economic_activity TEXT,birth_date TEXT,nationality TEXT,marital_status TEXT,occupation TEXT,email TEXT,phone TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',created_at TEXT NOT NULL,updated_at TEXT NOT NULL,
    UNIQUE(tenant_id,customer_number),UNIQUE(tenant_id,document_type,document_number))`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS bank_customer_addresses (
    id TEXT PRIMARY KEY,customer_id TEXT NOT NULL,address_type TEXT NOT NULL DEFAULT 'DOMICILIO',street TEXT NOT NULL,
    number TEXT,floor_unit TEXT,city TEXT,province TEXT,postal_code TEXT,country TEXT NOT NULL DEFAULT 'Argentina',
    is_primary INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`).run();
  // Migraciones compatibles con clientes creados por versiones anteriores.
  for(const ddl of [
    "ALTER TABLE bank_customers ADD COLUMN person_type TEXT NOT NULL DEFAULT 'FISICA'",
    "ALTER TABLE bank_customers ADD COLUMN legal_name TEXT",
    "ALTER TABLE bank_customers ADD COLUMN trade_name TEXT",
    "ALTER TABLE bank_customers ADD COLUMN incorporation_date TEXT",
    "ALTER TABLE bank_customers ADD COLUMN economic_activity TEXT"
  ]){try{await env.DB.prepare(ddl).run();}catch(e){/* columna ya existente */}}
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_bank_customers_owner ON bank_customers(tenant_id,owner_user_id,created_at DESC)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_bank_addresses_customer ON bank_customer_addresses(customer_id)`).run();
}
async function bankTenant(env,user){
  if(user.platform_role==='OSC_ADMIN')return 'tenant_osc';
  const row=await env.DB.prepare(`SELECT tenant_id FROM memberships WHERE user_id=? AND status='ACTIVE' ORDER BY created_at LIMIT 1`).bind(user.id).first();
  return row?.tenant_id||`personal_${user.id}`;
}
async function ensureBankPassiveSchema(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS bank_accounts (
    id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,owner_user_id TEXT NOT NULL,customer_id TEXT NOT NULL,account_number TEXT NOT NULL,
    account_type TEXT NOT NULL,currency TEXT NOT NULL DEFAULT 'ARS',status TEXT NOT NULL DEFAULT 'ACTIVE',balance REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(tenant_id,account_number))`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS bank_account_movements (
    id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,owner_user_id TEXT NOT NULL,account_id TEXT NOT NULL,movement_type TEXT NOT NULL,
    description TEXT NOT NULL,amount REAL NOT NULL,balance_after REAL NOT NULL,reference TEXT,created_at TEXT NOT NULL)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_bank_accounts_customer ON bank_accounts(tenant_id,owner_user_id,customer_id,created_at DESC)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_bank_movements_account ON bank_account_movements(account_id,created_at DESC)`).run();
}
async function ensureBankCardSchema(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS bank_cards (
    id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,owner_user_id TEXT NOT NULL,customer_id TEXT NOT NULL,linked_account_id TEXT NOT NULL,
    card_number TEXT NOT NULL,card_type TEXT NOT NULL DEFAULT 'DEBITO',brand TEXT NOT NULL DEFAULT 'OSC DOMESTICA',status TEXT NOT NULL DEFAULT 'ACTIVE',
    issued_at TEXT NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,
    UNIQUE(tenant_id,card_number))`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_bank_cards_customer ON bank_cards(tenant_id,owner_user_id,customer_id,created_at DESC)`).run();
}
const luhnCheckDigit=base=>{let sum=0,alt=true;for(let i=base.length-1;i>=0;i--){let n=Number(base[i]);if(alt){n*=2;if(n>9)n-=9}sum+=n;alt=!alt}return String((10-(sum%10))%10)};
const maskCard=pan=>`${pan.slice(0,6)}******${pan.slice(-4)}`;
async function api(request,env,path){
  if(path==='/api/bank/customers'&&(request.method==='GET'||request.method==='POST')){
    const auth=await requireUser(request,env); if(auth.error)return auth.error; const user=auth.user;
    await ensureBankCustomerSchema(env); const tenantId=await bankTenant(env,user);
    if(request.method==='GET'){
      const rows=(await env.DB.prepare(`SELECT id,customer_number,person_type,document_type,document_number,first_name,last_name,legal_name,trade_name,birth_date,nationality,email,phone,status,created_at FROM bank_customers WHERE tenant_id=? AND owner_user_id=? ORDER BY created_at DESC`).bind(tenantId,user.id).all()).results;
      return json({customers:rows});
    }
    const b=await readBody(request),personType=String(b.personType||'FISICA').toUpperCase(),first=String(b.firstName||'').trim(),last=String(b.lastName||'').trim(),legal=String(b.legalName||'').trim(),doc=String(b.documentNumber||'').trim();
    if(!['FISICA','JURIDICA'].includes(personType))return json({error:'INVALID_PERSON_TYPE',message:'Tipo de persona inválido.'},400);
    if(!doc||(personType==='FISICA'&&(!first||!last))||(personType==='JURIDICA'&&!legal))return json({error:'REQUIRED_FIELDS',message:personType==='JURIDICA'?'Razón social e identificación fiscal son obligatorias.':'Nombre, apellido y documento son obligatorios.'},400);
    const ts=now(),customerId=id('cli'),count=await env.DB.prepare(`SELECT COUNT(*) total FROM bank_customers WHERE tenant_id=?`).bind(tenantId).first();
    const customerNumber=`CLI-${String((count?.total||0)+1).padStart(6,'0')}`;
    try{
      await env.DB.prepare(`INSERT INTO bank_customers(id,tenant_id,owner_user_id,customer_number,person_type,document_type,document_number,first_name,last_name,legal_name,trade_name,incorporation_date,economic_activity,birth_date,nationality,marital_status,occupation,email,phone,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'ACTIVE',?,?)`).bind(customerId,tenantId,user.id,customerNumber,personType,String(b.documentType||(personType==='JURIDICA'?'CUIT/RUC':'DNI')),doc,first,last,legal,String(b.tradeName||''),String(b.incorporationDate||''),String(b.economicActivity||''),String(b.birthDate||''),String(b.nationality||''),String(b.maritalStatus||''),String(b.occupation||''),String(b.email||''),String(b.phone||''),ts,ts).run();
      const a=b.address||{}; if(String(a.street||'').trim())await env.DB.prepare(`INSERT INTO bank_customer_addresses(id,customer_id,address_type,street,number,floor_unit,city,province,postal_code,country,is_primary,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,1,?,?)`).bind(id('adr'),customerId,String(a.type||'DOMICILIO'),String(a.street||''),String(a.number||''),String(a.floorUnit||''),String(a.city||''),String(a.province||''),String(a.postalCode||''),String(a.country||'Argentina'),ts,ts).run();
      await audit(env,user.id,'BANK_CUSTOMER_CREATE','BANK_CUSTOMER',customerId,{customerNumber}); return json({ok:true,id:customerId,customerNumber},201);
    }catch(e){return json({error:'CUSTOMER_EXISTS',message:'Ya existe un cliente con ese documento en este banco virtual.'},409);}
  }
  const bankCustomerMatch=path.match(/^\/api\/bank\/customers\/([^/]+)$/);
  if(bankCustomerMatch&&request.method==='GET'){
    const auth=await requireUser(request,env);if(auth.error)return auth.error;await ensureBankCustomerSchema(env);const tenantId=await bankTenant(env,auth.user);
    const customer=await env.DB.prepare(`SELECT * FROM bank_customers WHERE id=? AND tenant_id=? AND owner_user_id=?`).bind(bankCustomerMatch[1],tenantId,auth.user.id).first();if(!customer)return json({error:'NOT_FOUND'},404);
    const addresses=(await env.DB.prepare(`SELECT * FROM bank_customer_addresses WHERE customer_id=? ORDER BY is_primary DESC,created_at`).bind(customer.id).all()).results;return json({customer,addresses});
  }
  if(path==='/api/bank/accounts'&&(request.method==='GET'||request.method==='POST')){
    const auth=await requireUser(request,env);if(auth.error)return auth.error;const user=auth.user;await ensureBankCustomerSchema(env);await ensureBankPassiveSchema(env);const tenantId=await bankTenant(env,user);
    if(request.method==='GET'){
      const rows=(await env.DB.prepare(`SELECT a.*,c.customer_number,c.person_type,c.first_name,c.last_name,c.legal_name,c.trade_name FROM bank_accounts a JOIN bank_customers c ON c.id=a.customer_id WHERE a.tenant_id=? AND a.owner_user_id=? ORDER BY a.created_at DESC`).bind(tenantId,user.id).all()).results;
      return json({accounts:rows});
    }
    const b=await readBody(request),customerId=String(b.customerId||''),type=String(b.accountType||'').toUpperCase(),currency=String(b.currency||'ARS').toUpperCase();
    if(!customerId||!['CA','CC'].includes(type)||!['ARS','USD'].includes(currency))return json({error:'INVALID_DATA',message:'Cliente, tipo de cuenta y moneda son obligatorios.'},400);
    const customer=await env.DB.prepare(`SELECT id FROM bank_customers WHERE id=? AND tenant_id=? AND owner_user_id=? AND status='ACTIVE'`).bind(customerId,tenantId,user.id).first();if(!customer)return json({error:'CUSTOMER_NOT_FOUND',message:'Cliente no encontrado.'},404);
    const ts=now(),count=await env.DB.prepare(`SELECT COUNT(*) total FROM bank_accounts WHERE tenant_id=?`).bind(tenantId).first(),seq=String((count?.total||0)+1).padStart(6,'0'),accountNumber=`${type}-${seq}`;
    const accountId=id('acc');await env.DB.prepare(`INSERT INTO bank_accounts(id,tenant_id,owner_user_id,customer_id,account_number,account_type,currency,status,balance,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'ACTIVE',0,?,?)`).bind(accountId,tenantId,user.id,customerId,accountNumber,type,currency,ts,ts).run();
    await audit(env,user.id,'BANK_ACCOUNT_CREATE','BANK_ACCOUNT',accountId,{accountNumber,type,currency,customerId});return json({ok:true,id:accountId,accountNumber},201);
  }
  const bankAccountMatch=path.match(/^\/api\/bank\/accounts\/([^/]+)$/);
  if(bankAccountMatch&&request.method==='GET'){
    const auth=await requireUser(request,env);if(auth.error)return auth.error;await ensureBankPassiveSchema(env);const tenantId=await bankTenant(env,auth.user);
    const account=await env.DB.prepare(`SELECT a.*,c.customer_number,c.person_type,c.first_name,c.last_name,c.legal_name,c.trade_name FROM bank_accounts a JOIN bank_customers c ON c.id=a.customer_id WHERE a.id=? AND a.tenant_id=? AND a.owner_user_id=?`).bind(bankAccountMatch[1],tenantId,auth.user.id).first();if(!account)return json({error:'NOT_FOUND'},404);
    const movements=(await env.DB.prepare(`SELECT * FROM bank_account_movements WHERE account_id=? ORDER BY created_at DESC LIMIT 100`).bind(account.id).all()).results;return json({account,movements});
  }
  const depositMatch=path.match(/^\/api\/bank\/accounts\/([^/]+)\/deposit$/);
  if(depositMatch&&request.method==='POST'){
    const auth=await requireUser(request,env);if(auth.error)return auth.error;await ensureBankPassiveSchema(env);const tenantId=await bankTenant(env,auth.user),b=await readBody(request),amount=Number(b.amount);
    if(!Number.isFinite(amount)||amount<=0)return json({error:'INVALID_AMOUNT',message:'El importe debe ser mayor a cero.'},400);
    const account=await env.DB.prepare(`SELECT * FROM bank_accounts WHERE id=? AND tenant_id=? AND owner_user_id=? AND status='ACTIVE'`).bind(depositMatch[1],tenantId,auth.user.id).first();if(!account)return json({error:'NOT_FOUND'},404);
    const ts=now(),newBalance=Number(account.balance||0)+amount,movementId=id('mov'),reference=`CAJA-${Date.now()}`;
    await env.DB.batch([env.DB.prepare(`UPDATE bank_accounts SET balance=?,updated_at=? WHERE id=?`).bind(newBalance,ts,account.id),env.DB.prepare(`INSERT INTO bank_account_movements(id,tenant_id,owner_user_id,account_id,movement_type,description,amount,balance_after,reference,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(movementId,tenantId,auth.user.id,account.id,'DEPOSITO_CAJA','Depósito por Caja',amount,newBalance,reference,ts)]);
    await audit(env,auth.user.id,'BANK_CASH_DEPOSIT','BANK_ACCOUNT',account.id,{amount,newBalance,reference});return json({ok:true,newBalance,reference},201);
  }
  if(path==='/api/bank/cards'&&(request.method==='GET'||request.method==='POST')){
    const auth=await requireUser(request,env);if(auth.error)return auth.error;const user=auth.user;
    await ensureBankCustomerSchema(env);await ensureBankPassiveSchema(env);await ensureBankCardSchema(env);const tenantId=await bankTenant(env,user);
    if(request.method==='GET'){
      const rows=(await env.DB.prepare(`SELECT k.*,a.account_number,a.account_type,a.currency,c.customer_number,c.person_type,c.first_name,c.last_name,c.legal_name,c.trade_name FROM bank_cards k JOIN bank_accounts a ON a.id=k.linked_account_id JOIN bank_customers c ON c.id=k.customer_id WHERE k.tenant_id=? AND k.owner_user_id=? ORDER BY k.created_at DESC`).bind(tenantId,user.id).all()).results;
      return json({cards:rows.map(x=>({...x,masked_card_number:maskCard(x.card_number),card_number:undefined}))});
    }
    const b=await readBody(request),customerId=String(b.customerId||''),accountId=String(b.accountId||''),cardType=String(b.cardType||'DEBITO').toUpperCase();
    if(!customerId||!accountId||cardType!=='DEBITO')return json({error:'INVALID_DATA',message:'Cliente, cuenta vinculada y tipo de tarjeta son obligatorios.'},400);
    const customer=await env.DB.prepare(`SELECT * FROM bank_customers WHERE id=? AND tenant_id=? AND owner_user_id=? AND status='ACTIVE'`).bind(customerId,tenantId,user.id).first();if(!customer)return json({error:'CUSTOMER_NOT_FOUND',message:'Cliente no encontrado.'},404);
    const account=await env.DB.prepare(`SELECT * FROM bank_accounts WHERE id=? AND customer_id=? AND tenant_id=? AND owner_user_id=? AND status='ACTIVE'`).bind(accountId,customerId,tenantId,user.id).first();if(!account)return json({error:'ACCOUNT_NOT_FOUND',message:'La cuenta seleccionada no pertenece al cliente o no está activa.'},404);
    const existing=await env.DB.prepare(`SELECT id FROM bank_cards WHERE linked_account_id=? AND tenant_id=? AND owner_user_id=? AND card_type='DEBITO' AND status='ACTIVE'`).bind(accountId,tenantId,user.id).first();if(existing)return json({error:'ACTIVE_CARD_EXISTS',message:'Esta cuenta ya tiene una tarjeta de débito activa.'},409);
    const ts=now(),cardId=id('card'),count=await env.DB.prepare(`SELECT COUNT(*) total FROM bank_cards WHERE tenant_id=?`).bind(tenantId).first(),seq=String((count?.total||0)+1).padStart(9,'0');
    const base=`990001${seq}`.slice(0,15),pan=base+luhnCheckDigit(base),d=new Date(),expires=new Date(Date.UTC(d.getUTCFullYear()+5,d.getUTCMonth(),1)).toISOString().slice(0,10);
    await env.DB.prepare(`INSERT INTO bank_cards(id,tenant_id,owner_user_id,customer_id,linked_account_id,card_number,card_type,brand,status,issued_at,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'OSC DOMESTICA','ACTIVE',?,?,?,?)`).bind(cardId,tenantId,user.id,customerId,accountId,pan,cardType,ts.slice(0,10),expires,ts,ts).run();
    await audit(env,user.id,'BANK_DEBIT_CARD_ISSUE','BANK_CARD',cardId,{customerId,accountId,maskedCard:maskCard(pan)});return json({ok:true,id:cardId,maskedCardNumber:maskCard(pan),expiresAt:expires},201);
  }
  if(path==='/api/bootstrap'&&request.method==='POST'){
    if(!env.BOOTSTRAP_KEY||request.headers.get('x-bootstrap-key')!==env.BOOTSTRAP_KEY)return json({error:'FORBIDDEN'},403);
    const body=await readBody(request),email=String(body.email||'').trim().toLowerCase(),name=String(body.fullName||'').trim(),password=String(body.password||'');
    if(!email||!name||password.length<10)return json({error:'INVALID_DATA'},400);
    const existing=await env.DB.prepare('SELECT id FROM users WHERE email=?').bind(email).first();
    if(existing)return json({error:'USER_EXISTS'},409);
    const userId=id('usr'),salt=randomToken(),hash=await passwordHash(password,salt),ts=now();
    await env.DB.batch([
      env.DB.prepare('INSERT INTO users(id,email,full_name,password_hash,password_salt,platform_role,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(userId,email,name,hash,salt,'OSC_ADMIN','ACTIVE',ts,ts),
      env.DB.prepare("INSERT OR IGNORE INTO tenants(id,name,slug,tenant_type,status,created_at,updated_at) VALUES('tenant_osc','OSC Academy','osc-academy','OSC','ACTIVE',?,?)").bind(ts,ts),
      env.DB.prepare("INSERT OR IGNORE INTO products(id,name,slug,core_enabled,status,created_at,updated_at) VALUES('product_payment','OSC Payment Academy','payment-academy',1,'ACTIVE',?,?)").bind(ts,ts),
      env.DB.prepare('INSERT INTO memberships(id,tenant_id,user_id,role,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(id('mem'),'tenant_osc',userId,'OSC_ADMIN','ACTIVE',ts,ts)
    ]);
    await audit(env,userId,'BOOTSTRAP','USER',userId);
    return json({ok:true});
  }

  if(path==='/api/auth/login'&&request.method==='POST'){
    const body=await readBody(request),email=String(body.email||'').trim().toLowerCase(),password=String(body.password||'');
    const user=await env.DB.prepare('SELECT * FROM users WHERE email=?').bind(email).first();
    if(!user||user.status!=='ACTIVE'||await passwordHash(password,user.password_salt)!==user.password_hash)return json({error:'INVALID_CREDENTIALS'},401);
    const token=randomToken(),ts=now(),expires=new Date(Date.now()+8*3600e3).toISOString();
    await env.DB.batch([
      env.DB.prepare('INSERT INTO sessions(id,user_id,token_hash,expires_at,created_at) VALUES(?,?,?,?,?)').bind(id('ses'),user.id,await sha256(token),expires,ts),
      env.DB.prepare('UPDATE users SET last_login_at=?,updated_at=? WHERE id=?').bind(ts,ts,user.id)
    ]);
    return json({ok:true,user:{id:user.id,email:user.email,fullName:user.full_name,role:user.platform_role}},200,{'set-cookie':sessionCookie(token)});
  }

  if(path==='/api/auth/logout'&&request.method==='POST'){
    const token=cookie(request).osc_session;
    if(token)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha256(token)).run();
    return json({ok:true},200,{'set-cookie':sessionCookie('',0)});
  }

  if(path==='/api/auth/change-password'&&request.method==='POST'){
    const auth=await requireUser(request,env); if(auth.error)return auth.error;
    const body=await readBody(request),currentPassword=String(body.currentPassword||''),newPassword=String(body.newPassword||'');
    if(newPassword.length<10)return json({error:'WEAK_PASSWORD'},400);
    const user=await env.DB.prepare('SELECT password_hash,password_salt FROM users WHERE id=?').bind(auth.user.id).first();
    if(!user||await passwordHash(currentPassword,user.password_salt)!==user.password_hash)return json({error:'INVALID_CURRENT_PASSWORD'},400);
    const salt=randomToken(),hash=await passwordHash(newPassword,salt),ts=now(),currentToken=cookie(request).osc_session,currentHash=currentToken?await sha256(currentToken):'';
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET password_hash=?,password_salt=?,updated_at=? WHERE id=?').bind(hash,salt,ts,auth.user.id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash<>?').bind(auth.user.id,currentHash)
    ]);
    await audit(env,auth.user.id,'CHANGE_PASSWORD','USER',auth.user.id);
    return json({ok:true});
  }

  if(path==='/api/auth/me'&&request.method==='GET'){
    const auth=await requireUser(request,env); if(auth.error)return auth.error;
    const memberships=(await env.DB.prepare(`SELECT m.role,m.status,t.id tenant_id,t.name tenant_name,t.tenant_type
      FROM memberships m JOIN tenants t ON t.id=m.tenant_id WHERE m.user_id=? AND m.status='ACTIVE'`).bind(auth.user.id).all()).results;
    const cohorts=(await env.DB.prepare(`SELECT c.id,c.name,c.starts_at,c.expires_at,c.forum_status,co.name course_name
      FROM cohort_enrollments e JOIN cohorts c ON c.id=e.cohort_id JOIN courses co ON co.id=c.course_id
      WHERE e.user_id=? AND e.status='ACTIVE' ORDER BY c.starts_at DESC`).bind(auth.user.id).all()).results;
    const analytics=await productAccess(env,auth.user,'product_authorization_analytics');
    const modules=await learningAccess(env,auth.user);
    return json({user:auth.user,memberships,cohorts,entitlements:{authorizationAnalytics:!!analytics},moduleAccess:modules});
  }

  if(path==='/api/workspace/payment'){
    const auth=await requireUser(request,env); if(auth.error)return auth.error;
    const workspace=await paymentWorkspace(env,auth.user);
    if(!workspace)return json({error:'PRODUCT_LICENSE_REQUIRED'},403);
    if(request.method==='GET'){
      const stored=await env.DB.prepare('SELECT payload_json,revision,updated_at FROM workspace_data WHERE workspace_id=? AND tenant_id=? AND user_id=?')
        .bind(workspace.id,workspace.tenant_id,auth.user.id).first();
      return json({workspace:{id:workspace.id,tenantId:workspace.tenant_id,userId:auth.user.id,productId:workspace.product_id},data:stored?JSON.parse(stored.payload_json):null,revision:Number(stored?.revision||0),updatedAt:stored?.updated_at||null});
    }
    if(request.method==='PUT'){
      const body=await readBody(request),payload=body.data;
      if(!validWorkspacePayload(payload))return json({error:'INVALID_WORKSPACE_PAYLOAD'},400);
      if(payload.ownerUserId!==auth.user.id||payload.ownerTenantId!==workspace.tenant_id)return json({error:'WORKSPACE_OWNER_MISMATCH'},403);
      const serialized=JSON.stringify(payload);
      if(serialized.length>2500000)return json({error:'WORKSPACE_TOO_LARGE'},413);
      const ts=now();
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO workspace_data(workspace_id,tenant_id,user_id,product_id,payload_json,revision,created_at,updated_at)
          VALUES(?,?,?,?,?,1,?,?) ON CONFLICT(workspace_id) DO UPDATE SET tenant_id=excluded.tenant_id,user_id=excluded.user_id,product_id=excluded.product_id,payload_json=excluded.payload_json,revision=workspace_data.revision+1,updated_at=excluded.updated_at`)
          .bind(workspace.id,workspace.tenant_id,auth.user.id,workspace.product_id,serialized,ts,ts),
        env.DB.prepare('UPDATE workspaces_v4 SET updated_at=? WHERE id=? AND user_id=? AND tenant_id=?').bind(ts,workspace.id,auth.user.id,workspace.tenant_id)
      ]);
      return json({ok:true,workspaceId:workspace.id,updatedAt:ts});
    }
  }

  if(path==='/api/authorization-analytics'&&request.method==='GET'){
    const auth=await requireUser(request,env); if(auth.error)return auth.error;
    const access=await productAccess(env,auth.user,'product_authorization_analytics');
    if(!access)return json({error:'PRODUCT_LICENSE_REQUIRED'},403);
    const requestedTenant=new URL(request.url).searchParams.get('tenantId');
    const tenantId=auth.user.platform_role==='OSC_ADMIN'&&requestedTenant?requestedTenant:access.tenantId;
    const rows=(await env.DB.prepare(`SELECT id,analysis_date,source_name,created_at,updated_at FROM authorization_analyses
      WHERE tenant_id=? AND status='READY' ORDER BY analysis_date DESC`).bind(tenantId).all()).results;
    if(!rows.length)return json({analyses:[],tenantId});
    const requestedDate=new URL(request.url).searchParams.get('date');
    const selected=requestedDate?rows.find(x=>x.analysis_date===requestedDate):rows[0];
    if(!selected)return json({error:'ANALYSIS_NOT_FOUND'},404);
    const stored=await env.DB.prepare('SELECT payload_json FROM authorization_analyses WHERE id=?').bind(selected.id).first();
    return json({analyses:rows,tenantId,data:JSON.parse(stored.payload_json)});
  }

  if(path==='/api/admin/authorization-analytics'&&request.method==='POST'){
    const auth=await requireUser(request,env,['OSC_ADMIN']); if(auth.error)return auth.error;
    const b=await readBody(request),tenantId=String(b.tenantId||'tenant_osc'),payload=b.payload;
    if(!validAnalyticsPayload(payload))return json({error:'INVALID_OR_UNSAFE_ANALYTICS_PAYLOAD'},400);
    const tenant=await env.DB.prepare("SELECT id FROM tenants WHERE id=? AND status='ACTIVE'").bind(tenantId).first();
    if(!tenant)return json({error:'TENANT_NOT_FOUND'},404);
    const serialized=JSON.stringify(payload);
    if(serialized.length>1500000)return json({error:'PAYLOAD_TOO_LARGE'},413);
    const ts=now(),analysisId=id('ana');
    await env.DB.prepare(`INSERT INTO authorization_analyses(id,tenant_id,analysis_date,source_name,payload_json,status,created_by,created_at,updated_at)
      VALUES(?,?,?,?,?,'READY',?,?,?) ON CONFLICT(tenant_id,analysis_date) DO UPDATE SET source_name=excluded.source_name,payload_json=excluded.payload_json,status='READY',created_by=excluded.created_by,updated_at=excluded.updated_at`)
      .bind(analysisId,tenantId,String(payload.fecha),String(payload.fuente||'TCPHandler'),serialized,auth.user.id,ts,ts).run();
    await audit(env,auth.user.id,'UPSERT_AUTHORIZATION_ANALYSIS','TENANT',tenantId,{analysisDate:payload.fecha,source:payload.fuente||'TCPHandler'});
    return json({ok:true,tenantId,analysisDate:payload.fecha});
  }

  if(path==='/api/auth/forgot'&&request.method==='POST'){
    const body=await readBody(request),email=String(body.email||'').trim().toLowerCase();
    const user=await env.DB.prepare("SELECT id FROM users WHERE email=? AND status='ACTIVE'").bind(email).first();
    if(user){
      const token=randomToken(),expires=new Date(Date.now()+30*60e3).toISOString();
      await env.DB.prepare('INSERT INTO password_reset_tokens(id,user_id,token_hash,expires_at,created_at) VALUES(?,?,?,?,?)').bind(id('rst'),user.id,await sha256(token),expires,now()).run();
      if(env.RESET_WEBHOOK_URL)await fetch(env.RESET_WEBHOOK_URL,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${env.RESET_WEBHOOK_TOKEN||''}`},body:JSON.stringify({email,resetUrl:`${new URL(request.url).origin}/reset.html?token=${token}`})});
    }
    return json({ok:true,message:'Si el correo está registrado, recibirá instrucciones.'});
  }

  if(path==='/api/auth/reset'&&request.method==='POST'){
    const body=await readBody(request),token=String(body.token||''),password=String(body.password||'');
    if(password.length<10)return json({error:'WEAK_PASSWORD'},400);
    const row=await env.DB.prepare('SELECT id,user_id FROM password_reset_tokens WHERE token_hash=? AND used_at IS NULL AND expires_at>?').bind(await sha256(token),now()).first();
    if(!row)return json({error:'INVALID_OR_EXPIRED_TOKEN'},400);
    const salt=randomToken(),hash=await passwordHash(password,salt),ts=now();
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET password_hash=?,password_salt=?,updated_at=? WHERE id=?').bind(hash,salt,ts,row.user_id),
      env.DB.prepare('UPDATE password_reset_tokens SET used_at=? WHERE id=?').bind(ts,row.id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(row.user_id)
    ]);
    return json({ok:true});
  }

  if(path==='/api/admin/overview'&&request.method==='GET'){
    const auth=await requireUser(request,env,['OSC_ADMIN']); if(auth.error)return auth.error;
    const [users,tenants,cohorts,licenses]=await Promise.all(['users','tenants','cohorts','licenses'].map(t=>env.DB.prepare(`SELECT COUNT(*) total FROM ${t}`).first()));
    const recentCohorts=(await env.DB.prepare('SELECT c.id,c.name,c.expires_at,co.name course_name FROM cohorts c JOIN courses co ON co.id=c.course_id ORDER BY c.created_at DESC LIMIT 25').all()).results;
    return json({users:users.total,tenants:tenants.total,cohorts:cohorts.total,licenses:licenses.total,recentCohorts});
  }

  if(path==='/api/admin/users/reset-password'&&request.method==='POST'){
    const auth=await requireUser(request,env,['OSC_ADMIN']); if(auth.error)return auth.error;
    const body=await readBody(request),email=String(body.email||'').trim().toLowerCase();
    if(!email)return json({error:'INVALID_EMAIL'},400);
    const user=await env.DB.prepare("SELECT id,email FROM users WHERE email=? AND status='ACTIVE'").bind(email).first();
    if(!user)return json({error:'USER_NOT_FOUND'},404);
    const temporaryPassword=randomToken().slice(0,14),salt=randomToken(),hash=await passwordHash(temporaryPassword,salt),ts=now();
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET password_hash=?,password_salt=?,updated_at=? WHERE id=?').bind(hash,salt,ts,user.id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id),
      env.DB.prepare('UPDATE password_reset_tokens SET used_at=? WHERE user_id=? AND used_at IS NULL').bind(ts,user.id)
    ]);
    await audit(env,auth.user.id,'ADMIN_RESET_PASSWORD','USER',user.id,{email:user.email});
    return json({ok:true,email:user.email,temporaryPassword,mustChange:true});
  }

  if(path==='/api/admin/products'){
    const auth=await requireUser(request,env,['OSC_ADMIN']); if(auth.error)return auth.error;
    if(request.method==='GET')return json({products:(await env.DB.prepare('SELECT * FROM products ORDER BY name').all()).results});
    if(request.method==='POST'){
      const b=await readBody(request);if(!b.name)return json({error:'INVALID_DATA'},400);
      const productId=id('product'),ts=now(),slug=String(b.slug||b.name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+Date.now();
      await env.DB.prepare('INSERT INTO products(id,name,slug,core_enabled,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(productId,b.name,slug,b.coreEnabled?1:0,'ACTIVE',ts,ts).run();
      await audit(env,auth.user.id,'CREATE_PRODUCT','PRODUCT',productId,{coreEnabled:!!b.coreEnabled});
      return json({ok:true,productId,mode:b.coreEnabled?'PAYMENT_CORE':'EMPTY_SAAS'});
    }
  }

  if(path==='/api/admin/course-package'&&request.method==='POST'){
    const auth=await requireUser(request,env,['OSC_ADMIN']); if(auth.error)return auth.error;
    const b=await readBody(request),ts=now(),courseId=id('course'),tenantId=id('tenant'),cohortId=id('cohort'),licenseId=id('lic');
    const starts=new Date(b.startsAt||Date.now()),expires=new Date(starts.getTime()+30*86400e3);
    await env.DB.batch([
      env.DB.prepare('INSERT INTO tenants(id,name,slug,tenant_type,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(tenantId,b.groupName,String(b.groupName||'curso').toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+Date.now(),'COURSE','ACTIVE',ts,ts),
      env.DB.prepare('INSERT INTO courses(id,product_id,name,live_duration_minutes,practice_days,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').bind(courseId,b.productId||'product_payment',b.courseName,120,30,'ACTIVE',ts,ts),
      env.DB.prepare('INSERT INTO cohorts(id,course_id,tenant_id,name,live_at,starts_at,expires_at,forum_status,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(cohortId,courseId,tenantId,b.groupName,b.liveAt||null,starts.toISOString(),expires.toISOString(),'OPEN','ACTIVE',ts,ts),
      env.DB.prepare('INSERT INTO licenses(id,tenant_id,product_id,cohort_id,license_type,starts_at,expires_at,seat_limit,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(licenseId,tenantId,b.productId||'product_payment',cohortId,'COURSE_30_DAYS',starts.toISOString(),expires.toISOString(),Number(b.seatLimit||12),'ACTIVE',ts,ts)
    ]);
    await seedCohortModules(env,cohortId,auth.user.id);
    await audit(env,auth.user.id,'CREATE_COURSE_PACKAGE','COHORT',cohortId,{seatLimit:b.seatLimit||12});
    return json({ok:true,courseId,cohortId,expiresAt:expires.toISOString()});
  }

  if(path==='/api/admin/convert-consultancy'&&request.method==='POST'){
    const auth=await requireUser(request,env,['OSC_ADMIN']); if(auth.error)return auth.error;
    const b=await readBody(request),userIds=Array.isArray(b.userIds)?b.userIds:[];
    if(!b.name||!userIds.length||!b.adminUserId)return json({error:'INVALID_DATA'},400);
    const ts=now(),tenantId=id('tenant'),licenseId=id('lic'),seatLimit=Number(b.seatLimit||userIds.length);
    const statements=[
      env.DB.prepare('INSERT INTO tenants(id,name,slug,tenant_type,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(tenantId,b.name,String(b.name).toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+Date.now(),'CONSULTANCY','ACTIVE',ts,ts),
      env.DB.prepare('INSERT INTO licenses(id,tenant_id,product_id,license_type,starts_at,expires_at,seat_limit,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(licenseId,tenantId,b.productId||'product_payment','CONSULTANCY',ts,b.expiresAt||null,seatLimit,'ACTIVE',ts,ts)
    ];
    userIds.forEach(userId=>{
      statements.push(env.DB.prepare('INSERT INTO memberships(id,tenant_id,user_id,role,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(id('mem'),tenantId,userId,userId===b.adminUserId?'TENANT_ADMIN':'STUDENT','ACTIVE',ts,ts));
      statements.push(env.DB.prepare('UPDATE workspaces_v4 SET tenant_id=?,updated_at=? WHERE user_id=? AND product_id=?').bind(tenantId,ts,userId,b.productId||'product_payment'));
    });
    await env.DB.batch(statements);
    await audit(env,auth.user.id,'CONVERT_TO_CONSULTANCY','TENANT',tenantId,{userIds});
    return json({ok:true,tenantId,licenseId,migratedUsers:userIds.length});
  }


  const moduleMatch=path.match(/^\/api\/admin\/cohorts\/([^/]+)\/modules$/);
  if(moduleMatch){
    const auth=await requireUser(request,env,['OSC_ADMIN']); if(auth.error)return auth.error;
    const cohortId=moduleMatch[1];
    const cohort=await env.DB.prepare('SELECT id,name FROM cohorts WHERE id=?').bind(cohortId).first();
    if(!cohort)return json({error:'COHORT_NOT_FOUND'},404);
    await seedCohortModules(env,cohortId,auth.user.id);
    if(request.method==='GET'){
      const rows=(await env.DB.prepare('SELECT module_key,enabled,enabled_at,updated_at FROM cohort_module_access WHERE cohort_id=? ORDER BY rowid').bind(cohortId).all()).results;
      return json({cohort,modules:rows});
    }
    if(request.method==='PUT'){
      const b=await readBody(request),enabled=Array.isArray(b.enabled)?b.enabled.filter(k=>LEARNING_MODULES.includes(k)):[];
      const ts=now();
      await env.DB.batch(LEARNING_MODULES.map(k=>env.DB.prepare('UPDATE cohort_module_access SET enabled=?,enabled_at=CASE WHEN ?=1 AND enabled=0 THEN ? WHEN ?=0 THEN NULL ELSE enabled_at END,updated_by=?,updated_at=? WHERE cohort_id=? AND module_key=?').bind(enabled.includes(k)?1:0,enabled.includes(k)?1:0,ts,enabled.includes(k)?1:0,auth.user.id,ts,cohortId,k)));
      await audit(env,auth.user.id,'UPDATE_COHORT_MODULES','COHORT',cohortId,{enabled});
      return json({ok:true,enabled});
    }
  }

  const enrollMatch=path.match(/^\/api\/admin\/cohorts\/([^/]+)\/enroll$/);
  if(enrollMatch&&request.method==='POST'){
    const auth=await requireUser(request,env,['OSC_ADMIN']); if(auth.error)return auth.error;
    const cohortId=enrollMatch[1],b=await readBody(request),students=Array.isArray(b.students)?b.students:[];
    const cohort=await env.DB.prepare('SELECT c.*,l.seat_limit FROM cohorts c JOIN licenses l ON l.cohort_id=c.id WHERE c.id=?').bind(cohortId).first();
    if(!cohort)return json({error:'COHORT_NOT_FOUND'},404);
    const count=await env.DB.prepare("SELECT COUNT(*) total FROM cohort_enrollments WHERE cohort_id=? AND status='ACTIVE'").bind(cohortId).first();
    if(count.total+students.length>cohort.seat_limit)return json({error:'SEAT_LIMIT_EXCEEDED'},409);
    const created=[],ts=now();
    for(const student of students){
      const email=String(student.email||'').trim().toLowerCase(),fullName=String(student.fullName||'').trim();
      if(!email||!fullName)continue;
      let user=await env.DB.prepare('SELECT id FROM users WHERE email=?').bind(email).first(),temporaryPassword=null;
      if(!user){
        temporaryPassword=randomToken().slice(0,14),user={id:id('usr')};
        const salt=randomToken(),hash=await passwordHash(temporaryPassword,salt);
        await env.DB.prepare('INSERT INTO users(id,email,full_name,password_hash,password_salt,platform_role,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(user.id,email,fullName,hash,salt,'USER','ACTIVE',ts,ts).run();
      }
      await env.DB.batch([
        env.DB.prepare('INSERT OR IGNORE INTO memberships(id,tenant_id,user_id,role,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(id('mem'),cohort.tenant_id,user.id,'STUDENT','ACTIVE',ts,ts),
        env.DB.prepare('INSERT OR IGNORE INTO cohort_enrollments(id,cohort_id,user_id,status,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(id('enr'),cohortId,user.id,'ACTIVE',ts,ts),
        env.DB.prepare('INSERT OR IGNORE INTO workspaces_v4(id,user_id,product_id,tenant_id,status,created_at,updated_at) SELECT ?,?,?,?,'+'\'ACTIVE\''+',?,? FROM courses WHERE id=?').bind(id('ws'),user.id,'product_payment',cohort.tenant_id,ts,ts,cohort.course_id)
      ]);
      created.push({userId:user.id,email,temporaryPassword});
    }
    await audit(env,auth.user.id,'ENROLL_STUDENTS','COHORT',cohortId,{count:created.length});
    return json({ok:true,students:created});
  }

  const replyMatch=path.match(/^\/api\/topics\/([^/]+)\/replies$/);
  if(replyMatch){
    const auth=await requireUser(request,env); if(auth.error)return auth.error;
    const topic=await env.DB.prepare(`SELECT t.id,t.cohort_id,c.expires_at,c.forum_status,e.status enrollment_status
      FROM forum_topics t JOIN cohorts c ON c.id=t.cohort_id LEFT JOIN cohort_enrollments e ON e.cohort_id=c.id AND e.user_id=? WHERE t.id=?`).bind(auth.user.id,replyMatch[1]).first();
    if(!topic||(auth.user.platform_role!=='OSC_ADMIN'&&topic.enrollment_status!=='ACTIVE'))return json({error:'FORBIDDEN'},403);
    if(request.method==='GET'){
      const rows=(await env.DB.prepare(`SELECT r.*,u.full_name author_name FROM forum_replies r JOIN users u ON u.id=r.author_user_id WHERE r.topic_id=? ORDER BY r.created_at`).bind(topic.id).all()).results;
      return json({replies:rows});
    }
    if(request.method==='POST'){
      if(topic.forum_status!=='OPEN'||topic.expires_at<=now())return json({error:'FORUM_CLOSED'},403);
      const b=await readBody(request);if(!b.body)return json({error:'INVALID_DATA'},400);
      const ts=now(),replyId=id('reply'),instructor=auth.user.platform_role==='OSC_ADMIN'?1:0;
      await env.DB.prepare('INSERT INTO forum_replies(id,topic_id,author_user_id,body,instructor_answer,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(replyId,topic.id,auth.user.id,b.body,instructor,ts,ts).run();
      if(instructor)await env.DB.prepare("UPDATE forum_topics SET status='ANSWERED',updated_at=? WHERE id=?").bind(ts,topic.id).run();
      return json({ok:true,replyId,instructorAnswer:!!instructor});
    }
  }

  const forumMatch=path.match(/^\/api\/cohorts\/([^/]+)\/topics$/);
  if(forumMatch){
    const auth=await requireUser(request,env); if(auth.error)return auth.error;
    const cohortId=forumMatch[1];
    const access=await env.DB.prepare(`SELECT c.*,e.status enrollment_status FROM cohorts c LEFT JOIN cohort_enrollments e ON e.cohort_id=c.id AND e.user_id=? WHERE c.id=?`).bind(auth.user.id,cohortId).first();
    if(!access||(auth.user.platform_role!=='OSC_ADMIN'&&access.enrollment_status!=='ACTIVE'))return json({error:'FORBIDDEN'},403);
    if(request.method==='GET'){
      const rows=(await env.DB.prepare(`SELECT t.*,u.full_name author_name,(SELECT COUNT(*) FROM forum_replies r WHERE r.topic_id=t.id) reply_count FROM forum_topics t JOIN users u ON u.id=t.author_user_id WHERE t.cohort_id=? ORDER BY t.pinned DESC,t.created_at DESC`).bind(cohortId).all()).results;
      return json({cohort:{id:access.id,name:access.name,expiresAt:access.expires_at,forumStatus:access.forum_status},topics:rows});
    }
    if(request.method==='POST'){
      if(access.forum_status!=='OPEN'||access.expires_at<=now())return json({error:'FORUM_CLOSED'},403);
      const b=await readBody(request); if(!b.title||!b.body)return json({error:'INVALID_DATA'},400);
      const topicId=id('topic'),ts=now();
      await env.DB.prepare('INSERT INTO forum_topics(id,cohort_id,author_user_id,module_key,title,body,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(topicId,cohortId,auth.user.id,b.moduleKey||'GENERAL',b.title,b.body,'OPEN',ts,ts).run();
      return json({ok:true,topicId});
    }
  }
  return json({error:'NOT_FOUND'},404);
}

export default {async fetch(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(url.hostname==='www.oscpaymentacademy.com'){
    url.hostname='oscpaymentacademy.com';
    return Response.redirect(url.toString(),308);
  }
  if(path.startsWith('/api/'))return api(request,env,path);
  const publicPaths=new Set(['/login','/login.html','/reset','/reset.html','/styles.css','/favicon.ico','/favicon.svg']);
  const assetLike=/\.(css|js|png|jpg|jpeg|svg|webp|ico|woff2)$/i.test(path);
  if(!publicPaths.has(path)&&!assetLike){
    const user=await currentUser(request,env);
    if(!user)return Response.redirect(`${url.origin}/login?next=${encodeURIComponent(path+url.search)}`,302);
    if((path==='/authorization-analytics'||path==='/authorization-analytics.html')&&!(await productAccess(env,user,'product_authorization_analytics')))return Response.redirect(`${url.origin}/expired?product=authorization-analytics`,302);
    if(path!=='/expired'&&path!=='/expired.html'&&!(await hasActiveLicense(env,user)))return Response.redirect(`${url.origin}/expired`,302);
  }
  return env.ASSETS.fetch(request);
}};
