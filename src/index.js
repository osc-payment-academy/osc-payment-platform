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
  const allowed=['version','studentId','createdAt','updatedAt','retention','transactions','batches','artifacts','events','atmMessages','lastAtmReconciliation','constructorPractices'];
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

async function api(request,env,path){
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

  if(path==='/api/auth/me'&&request.method==='GET'){
    const auth=await requireUser(request,env); if(auth.error)return auth.error;
    const memberships=(await env.DB.prepare(`SELECT m.role,m.status,t.id tenant_id,t.name tenant_name,t.tenant_type
      FROM memberships m JOIN tenants t ON t.id=m.tenant_id WHERE m.user_id=? AND m.status='ACTIVE'`).bind(auth.user.id).all()).results;
    const cohorts=(await env.DB.prepare(`SELECT c.id,c.name,c.starts_at,c.expires_at,c.forum_status,co.name course_name
      FROM cohort_enrollments e JOIN cohorts c ON c.id=e.cohort_id JOIN courses co ON co.id=c.course_id
      WHERE e.user_id=? AND e.status='ACTIVE' ORDER BY c.starts_at DESC`).bind(auth.user.id).all()).results;
    const analytics=await productAccess(env,auth.user,'product_authorization_analytics');
    return json({user:auth.user,memberships,cohorts,entitlements:{authorizationAnalytics:!!analytics}});
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
