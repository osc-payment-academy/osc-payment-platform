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

// rc.1.22 · Módulos habilitables (por edición de curso y por consultora).
//   ebook · banco_simulado (Clientes, Pasivas, Solicitudes, Cuenta del Cliente) · switch_adquirente (Switch + Compensación Visa/Mastercard)
//   parser = Parser ISO8583 + Parser Guiado.
const LEARNING_MODULES=['course_iso8583','ebook','banco_simulado','constructor','pos','atm','wallet','ecommerce','switch_adquirente','switch_emisor','parser'];
const DAY1_MODULES=['course_iso8583','pos','parser','constructor'];
// Módulos que antes de rc.1.22 estaban siempre visibles: en las ediciones se siembran habilitados para no cambiar nada sin aviso.
const DEFAULT_ON_MODULES=['ebook','banco_simulado','switch_adquirente'];
const PRODUCT_PAYMENT='product_payment',PRODUCT_DAILY='product_authorization_analytics',PRODUCT_LIVE='product_live_monitoring';
const PAGE_MODULES={
  'curso_interactivo.html':'course_iso8583','ebook.html':'ebook',
  'clientes.html':'banco_simulado','pasivas.html':'banco_simulado','solicitudes.html':'banco_simulado','cuenta_cliente.html':'banco_simulado',
  'constructor.html':'constructor','pos.html':'pos','atm.html':'atm','wallet.html':'wallet','ecommerce.html':'ecommerce',
  'switch.html':'switch_adquirente','compensacion.html':'switch_adquirente','compensacion_mastercard.html':'switch_adquirente',
  'switch_emisor.html':'switch_emisor','parser.html':'parser','parser_guiado.html':'parser'
};
const MODULE_DAY={course_iso8583:1,pos:1,parser:1,constructor:1,atm:2,ecommerce:3,wallet:4,switch_emisor:5};
// Solo administración (rc.1.22): Documentación Técnica (los alumnos llegan a los PDF desde la manito) e Investigación.
const ADMIN_ONLY_PAGES=new Set(['documentacion.html','research.html']);
const ACTIVITY_PAGES={'index.html':'dashboard','account.html':'cuenta','authorization-analytics.html':'analisis_diario','monitoreo-vivo.html':'monitoreo_vivo'};
const TUTOR_MODULES=['course_iso8583','pos','atm','constructor','wallet','ecommerce'];
const TUTOR_SEED=[
  ['mti-0200','0200 mti mensaje financiero solicitud compra','El MTI 0200 identifica una solicitud de transacción financiera. En los laboratorios de POS y Wallet se utiliza para iniciar una compra; la respuesta asociada normalmente es 0210.','Curso interactivo · Lámina 13: MTI 0200','EXPLICAR'],
  ['de39','de39 campo 39 response code codigo respuesta','El DE39 contiene el código de respuesta informado por el receptor. Permite saber si la operación fue aprobada o por qué fue rechazada. Por ejemplo, 00 indica aprobación y 51 fondos insuficientes en los escenarios didácticos aprobados.','Curso interactivo · Lámina 17: Respuesta 0210','EXPLICAR'],
  ['tokenizacion','tokenizacion token dpan fpan wallet','La tokenización reemplaza el número real de la tarjeta (FPAN) por un token de pago (DPAN). La Wallet utiliza ese token para reducir la exposición del dato real durante el pago.','Wallet · Flujo aprobado: Agregar tarjeta y Pago NFC','EXPLICAR'],
  ['bitmap','bitmap campos presentes trama','El bitmap es el mapa que indica qué Data Elements están presentes en el mensaje. Cada bit activado corresponde a un campo ISO 8583.','Curso interactivo · Láminas 10 y 11: Bitmaps','EXPLICAR'],
  ['guia-trama','no entiendo trama analizar mensaje identificar','Vamos paso a paso: 1) identifica los cuatro dígitos del MTI; 2) localiza el bitmap; 3) determina qué bits están activos; 4) recorre los Data Elements presentes; 5) relaciona solicitud y respuesta usando MTI, STAN y código DE39. No compartas PAN completo, PIN, CVV ni documentación interna.','Curso interactivo · Lámina 12: Estructura general de una trama','GUIAR'],
  ['mti-0210','0210 mti respuesta','El MTI 0210 es la respuesta a una solicitud financiera 0200. Su DE39 informa el resultado de la operación.','Curso interactivo · Lámina 17: Respuesta 0210','EXPLICAR'],
  ['de55','de55 emv chip contactless','El DE55 transporta datos EMV generados durante operaciones con chip o contactless. Su contenido es compuesto y debe interpretarse según la especificación aprobada de la marca y el perfil de la operación.','Wallet/E-commerce · Material aprobado DE55; consultar manual de la marca aplicable','REFERENCIAR'],
  ['constructor','constructor validar trama boton validar','El botón Validar del Constructor comprueba que la trama cumpla la estructura configurada. No envía la operación a una marca ni simula por sí solo una respuesta del switch.','Constructor ISO 8583 · Ayuda técnica aprobada','EXPLICAR']
];
async function ensureTutorSchema(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS tutor_knowledge (
    id TEXT PRIMARY KEY,title TEXT NOT NULL,keywords TEXT NOT NULL,answer TEXT NOT NULL,reference TEXT,module_key TEXT NOT NULL DEFAULT 'ALL',behavior TEXT NOT NULL DEFAULT 'EXPLICAR',status TEXT NOT NULL DEFAULT 'APPROVED',approved_by TEXT,approved_at TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS tutor_pending (
    id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,module_key TEXT NOT NULL,question TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'PENDING',review_note TEXT,answer TEXT,knowledge_id TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`).run();
  const ts=now();
  await env.DB.batch(TUTOR_SEED.map(([key,keywords,answer,reference,behavior])=>env.DB.prepare(`INSERT OR IGNORE INTO tutor_knowledge(id,title,keywords,answer,reference,module_key,behavior,status,approved_by,approved_at,created_at,updated_at) VALUES(?,?,?,?,?,'ALL',?,'APPROVED','OSC',?,?,?)`).bind(`tk_${key}`,key,keywords,answer,reference,behavior,ts,ts,ts)));
}
const normalizeTutorText=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
const consultationQuestion=q=>/(implementar|disenar|diseñar|arquitectura|interfaz|integrar|adaptar|migrar|documentacion interna|documentación interna|produccion|producción|banco|procesador).*(propio|particular|interno|mi |nuestra |especifico|específico)|(?:mi banco|nuestro banco|mi empresa|nuestra mensajeria|nuestra mensajería)/i.test(q);
const DE_NAMES={1:'Bitmap secundario',2:'Primary Account Number (PAN)',3:'Processing Code',4:'Importe de la transacción',5:'Importe de conciliación',6:'Importe de facturación',7:'Fecha y hora de transmisión',8:'Importe de facturación del titular',9:'Tipo de cambio de conciliación',10:'Tipo de cambio de facturación',11:'STAN',12:'Hora local de la transacción',13:'Fecha local de la transacción',14:'Fecha de vencimiento',15:'Fecha de conciliación',16:'Fecha de conversión',17:'Fecha de captura',18:'Merchant Category Code',19:'País de la institución adquirente',20:'País asociado al PAN',21:'País de la institución reenviadora',22:'POS Entry Mode',23:'Número de secuencia de tarjeta',24:'Network International Identifier',25:'POS Condition Code',26:'POS PIN Capture Code',27:'Longitud del código de respuesta de autorización',28:'Importe de comisión de transacción',29:'Importe de comisión de conciliación',30:'Importe de comisión de procesamiento',31:'Importe de comisión de conciliación de procesamiento',32:'Identificación de la institución adquirente',33:'Identificación de la institución reenviadora',34:'PAN extendido',35:'Track 2',36:'Track 3',37:'Retrieval Reference Number',38:'Código de autorización',39:'Código de respuesta',40:'Código de restricción de servicio',41:'Terminal ID',42:'Merchant ID',43:'Nombre y ubicación del comercio',44:'Datos adicionales de respuesta',45:'Track 1',46:'Datos adicionales ISO',47:'Datos adicionales nacionales',48:'Datos adicionales privados',49:'Código de moneda de la transacción',50:'Código de moneda de conciliación',51:'Código de moneda de facturación',52:'PIN Data',53:'Información de control de seguridad',54:'Importes adicionales',55:'Datos EMV',56:'Datos reservados ISO',57:'Datos reservados nacionales',58:'Datos reservados nacionales',59:'Datos reservados nacionales',60:'Datos reservados privados',61:'Datos reservados privados',62:'Datos reservados privados',63:'Datos reservados privados',64:'MAC',65:'Indicador de bitmap terciario',66:'Código de conciliación',67:'Código de pago extendido',68:'País de la institución receptora',69:'País de la institución de conciliación',70:'Network Management Information Code',71:'Número de mensaje',72:'Último número de mensaje',73:'Fecha de acción',74:'Cantidad de créditos',75:'Cantidad de reversas de crédito',76:'Cantidad de débitos',77:'Cantidad de reversas de débito',78:'Cantidad de transferencias',79:'Cantidad de reversas de transferencia',80:'Cantidad de consultas',81:'Cantidad de autorizaciones',82:'Importe de comisión de créditos',83:'Importe de comisión de créditos de transacción',84:'Importe de comisión de débitos',85:'Importe de comisión de débitos de transacción',86:'Importe total de créditos',87:'Importe total de reversas de crédito',88:'Importe total de débitos',89:'Importe total de reversas de débito',90:'Datos de la transacción original',91:'Código de actualización de archivo',92:'Código de seguridad de archivo',93:'Indicador de respuesta',94:'Indicador de servicio',95:'Importes de reemplazo',96:'Código de seguridad del mensaje',97:'Importe neto de conciliación',98:'Beneficiario',99:'Identificación de institución de conciliación',100:'Identificación de institución receptora',101:'Nombre de archivo',102:'Identificación de cuenta 1',103:'Identificación de cuenta 2',104:'Descripción de transacción',105:'Datos reservados ISO',106:'Datos reservados ISO',107:'Datos reservados ISO',108:'Datos reservados ISO',109:'Datos reservados ISO',110:'Datos reservados ISO',111:'Datos reservados ISO',112:'Datos reservados nacionales',113:'Datos reservados nacionales',114:'Datos reservados nacionales',115:'Datos reservados nacionales',116:'Datos reservados nacionales',117:'Datos reservados nacionales',118:'Datos reservados nacionales',119:'Datos reservados nacionales',120:'Datos reservados privados',121:'Datos reservados privados',122:'Datos reservados privados',123:'Datos reservados privados',124:'Datos reservados privados',125:'Datos reservados privados',126:'Datos reservados privados',127:'Datos reservados privados',128:'MAC secundario'};
const MTI_DIGITS={version:{'0':'ISO 8583:1987','1':'ISO 8583:1993','2':'ISO 8583:2003','8':'Uso nacional','9':'Uso privado'},class:{'1':'Autorización','2':'Financiero','3':'Acciones de archivo','4':'Reversa o chargeback','5':'Conciliación','6':'Administrativo','7':'Cobro de comisión','8':'Gestión de red','9':'Uso reservado'},fn:{'0':'Solicitud','1':'Respuesta a solicitud','2':'Aviso','3':'Respuesta a aviso','4':'Notificación','5':'Respuesta a notificación','6':'Instrucción','7':'Respuesta a instrucción'},origin:{'0':'Adquirente','1':'Repetición del adquirente','2':'Emisor','3':'Repetición del emisor','4':'Otro','5':'Repetición de otro'}};
const tutorDEAnswer=n=>`El DE${n} se identifica de forma general como “${DE_NAMES[n]}”. Su formato, longitud, obligatoriedad y valores permitidos pueden cambiar según la versión ISO, la marca, el canal y la interfaz. Por eso, para una regla específica Tutor OSC debe remitirte al manual aprobado correspondiente.`;
const tutorMTIAnswer=mti=>{const d=mti.split('');return `El MTI ${mti} se interpreta por sus cuatro posiciones: 1) versión: ${MTI_DIGITS.version[d[0]]||'valor reservado o específico'}; 2) clase: ${MTI_DIGITS.class[d[1]]||'valor reservado o específico'}; 3) función: ${MTI_DIGITS.fn[d[2]]||'valor reservado o específico'}; 4) origen: ${MTI_DIGITS.origin[d[3]]||'valor reservado o específico'}. La utilización exacta debe confirmarse en el manual aprobado de la marca o interfaz.`};
const VISA_POS_FIELD_PAGES={2:173,3:177,4:186,5:201,6:203,7:206,9:208,10:210,11:212,12:215,13:217,14:219,15:222,16:224,17:226,18:227,19:231,20:233,22:235,23:241,25:244,26:249,28:250,32:255,33:258,34:261,35:279,37:284,38:288,39:292,41:310,42:313,43:318,45:364,46:369,48:374,49:445,50:448,51:450,52:452,53:455,54:464,55:480,56:491,59:500,60:510,61:525,62:530,63:601,66:676,68:678,69:679,70:680,73:685,74:688,75:689,76:690,77:691,86:692,87:693,88:694,89:695,90:696,91:699,92:702,95:704,96:706,97:707,99:708,100:710,101:713,102:716,103:719,104:721,105:823,108:824,110:827,111:832,114:844,115:853,116:855,117:862,118:872,119:890,120:912,121:919,125:946,126:966,127:1013};
const MASTERCARD_MDS_FIELD_PAGES={1:201,2:202,3:203,4:206,5:207,6:209,7:210,8:211,9:212,10:213,11:214,12:215,13:216,14:217,15:218,16:219,17:220,18:221,19:223,20:224,21:225,22:226,23:228,24:229,25:230,26:231,27:232,28:233,29:234,30:235,31:236,32:237,33:238,34:239,35:240,36:242,37:243,38:244,39:245,40:250,41:251,42:252,43:253,44:255,45:257,46:259,47:260,48:261,49:273,50:274,51:275,52:276,53:277,54:278,55:280,56:284,57:285,58:286,59:287,60:288,61:295,62:298,63:299,64:302,65:303,66:304,67:305,68:306,69:307,70:308,71:309,72:310,73:311,74:312,75:313,76:314,77:315,78:316,79:317,80:318,81:319,82:320,83:321,84:322,85:323,86:324,87:325,88:326,89:327,90:328,91:329,92:331,93:332,94:333,95:334,96:336,97:337,98:339,99:340,100:341,101:342,102:343,103:344,104:345,112:347,120:353,121:359,122:360,126:362,127:363,128:364};
const tutorManualReference=(brand,de,channel='POS')=>{
  const fieldName=DE_NAMES[de]||`Data Element ${de}`;
  if(brand==='VISA'){
    if(String(channel).toUpperCase()==='ATM'){
      return {fieldName,answer:`Voy a estudiar DE${de} en el contexto Visa ATM. La definición, presencia, formato y valores deben verificarse en el manual Full Service ATM Online Messages; no voy a reutilizar automáticamente la regla de Visa POS.`,reference:`Visa Full Service ATM Online Messages – Technical Specifications · consultar Field ${de} en la edición disponible`,manualUrl:`/manuals/full-service-atm-online-messages-tech-specs.pdf#page=1&zoom=page-width`,manualLabel:`Abrir manual Visa ATM · buscar Field ${de}`};
    }
    const page=VISA_POS_FIELD_PAGES[de]||151;
    return {fieldName,answer:VISA_POS_FIELD_PAGES[de]?`DE${de} — ${fieldName} está documentado en la especificación Visa POS disponible. Abrí el manual oficial para revisar Attributes, Description, Usage, edits y valid values cuando correspondan.`:`No encontré DE${de} listado individualmente en el índice mapeado de esta interfaz Visa POS. Abrí el capítulo oficial de Fields para verificar su tratamiento sin trasladar otra especificación.`,reference:`Visa Full Service POS Online Messages – Technical Specifications · Field ${de} · page ${page}`,manualUrl:`/manuals/full-service-pos-online-messages-tech-specs.pdf#page=${page}&zoom=page-width`,manualLabel:`Abrir manual Visa POS · Field ${de}`};
  }
  if(brand==='MASTERCARD'){
    const page=MASTERCARD_MDS_FIELD_PAGES[de]||199;
    return {fieldName,answer:MASTERCARD_MDS_FIELD_PAGES[de]?`DE${de} — ${fieldName} está documentado en la especificación Mastercard MDS disponible. Abrí el manual original para revisar attributes, description, usage y valid values.`:`No encontré DE${de} listado individualmente en el índice mapeado de Mastercard MDS. Abrí el capítulo Data Elements para verificar su tratamiento.`,reference:`Mastercard Debit Switch Online Specifications · June 2003 · DE ${de} · page ${page}`,manualUrl:`/manuals/mastercard-debit-switch-online-specifications-jun03.pdf#page=${page}&zoom=page-width`,manualLabel:`Abrir manual Mastercard · DE ${de}`};
  }
  if(brand==='AMEX')return {fieldName,answer:`Bit ${de} debe verificarse en American Express GNS Network Specifications – Authorization. OSC no va a traducir ni inferir reglas específicas de marca sin ese documento técnico.`,reference:`American Express GNS Network Specifications – Authorization · Bit ${de}`,manualRequired:'amex-authorization'};
  return {fieldName,answer:`No encontré una especificación técnica aprobada para consultar DE${de} en el contexto ${brand||'actual'}. No voy a completar la definición utilizando automáticamente otra marca o canal.`,reference:`Contexto ${brand||'sin marca'} · ${channel||'sin canal'} · documentación insuficiente`};
};
async function ensureModuleAccessSchema(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS cohort_module_access (
    cohort_id TEXT NOT NULL,module_key TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 0,enabled_at TEXT,updated_by TEXT,updated_at TEXT NOT NULL,
    PRIMARY KEY(cohort_id,module_key),FOREIGN KEY(cohort_id) REFERENCES cohorts(id),FOREIGN KEY(updated_by) REFERENCES users(id))`).run();
}
async function seedCohortModules(env,cohortId,actorId=null){
  await ensureModuleAccessSchema(env); const ts=now();
  const on=k=>DAY1_MODULES.includes(k)||DEFAULT_ON_MODULES.includes(k);
  await env.DB.batch(LEARNING_MODULES.map(k=>env.DB.prepare(`INSERT OR IGNORE INTO cohort_module_access(cohort_id,module_key,enabled,enabled_at,updated_by,updated_at) VALUES(?,?,?,?,?,?)`).bind(cohortId,k,on(k)?1:0,on(k)?ts:null,actorId,ts)));
}
async function ensureTenantModuleSchema(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS tenant_module_access (
    tenant_id TEXT NOT NULL,module_key TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 0,updated_by TEXT,updated_at TEXT NOT NULL,
    PRIMARY KEY(tenant_id,module_key),FOREIGN KEY(tenant_id) REFERENCES tenants(id))`).run();
}
async function ensureLiveMonitoringProduct(env){
  await env.DB.prepare("INSERT OR IGNORE INTO products(id,name,slug,core_enabled,status,created_at,updated_at) VALUES(?,?,?,0,'ACTIVE',?,?)").bind(PRODUCT_LIVE,'OSC Monitoreo en Vivo de Autorizaciones','live-monitoring',now(),now()).run();
  await env.DB.prepare("INSERT OR IGNORE INTO products(id,name,slug,core_enabled,status,created_at,updated_at) VALUES(?,?,?,0,'ACTIVE',?,?)").bind(PRODUCT_DAILY,'OSC Authorization Analytics','authorization-analytics',now(),now()).run();
}
/* rc.1.22 · Acceso por módulo.
   - Admin OSC: todo.
   - Consultora con licencia Payment Academy: los módulos marcados en su ficha (tenant_module_access). Sin ficha = todos (consultoras anteriores).
   - Edición de curso: habilitación progresiva (cohort_module_access). Lo no habilitado se muestra con candado ("locked").
   - Lo que no está en la licencia de una consultora queda oculto ("hidden"). */
async function learningAccess(env,user){
  if(user.platform_role==='OSC_ADMIN')return {progressive:false,enabled:[...LEARNING_MODULES],locked:[],hidden:[],admin:true};
  const ts=now();
  await ensureTenantModuleSchema(env);
  const consultancies=(await env.DB.prepare(`SELECT DISTINCT t.id FROM memberships m JOIN tenants t ON t.id=m.tenant_id JOIN licenses l ON l.tenant_id=t.id WHERE m.user_id=? AND m.status='ACTIVE' AND t.tenant_type='CONSULTANCY' AND l.product_id='product_payment' AND l.status='ACTIVE' AND l.starts_at<=? AND (l.expires_at IS NULL OR l.expires_at>?)`).bind(user.id,ts,ts).all()).results;
  const enabled=new Set();
  for(const c of consultancies){
    const rows=(await env.DB.prepare('SELECT module_key,enabled FROM tenant_module_access WHERE tenant_id=?').bind(c.id).all()).results;
    if(!rows.length) LEARNING_MODULES.forEach(k=>enabled.add(k));
    else rows.filter(r=>r.enabled).forEach(r=>enabled.add(r.module_key));
  }
  await ensureModuleAccessSchema(env);
  const cohorts=(await env.DB.prepare(`SELECT c.id FROM cohort_enrollments e JOIN cohorts c ON c.id=e.cohort_id JOIN licenses l ON l.cohort_id=c.id WHERE e.user_id=? AND e.status='ACTIVE' AND c.status='ACTIVE' AND l.product_id='product_payment' AND l.status='ACTIVE' AND l.starts_at<=? AND (l.expires_at IS NULL OR l.expires_at>?)`).bind(user.id,ts,ts).all()).results;
  const cohortEnabled=new Set();
  if(cohorts.length){
    for(const c of cohorts)await seedCohortModules(env,c.id);
    const marks=cohorts.map(()=>'?').join(',');
    (await env.DB.prepare(`SELECT DISTINCT module_key FROM cohort_module_access WHERE cohort_id IN (${marks}) AND enabled=1`).bind(...cohorts.map(c=>c.id)).all()).results.forEach(r=>{cohortEnabled.add(r.module_key);enabled.add(r.module_key);});
  }
  if(!consultancies.length&&!cohorts.length){
    // Sin edición ni consultora: licencia Payment Academy directa = todo; sin licencia Payment Academy = nada.
    if(await hasPaymentAcademyLicense(env,user)) LEARNING_MODULES.forEach(k=>enabled.add(k));
  }
  const locked=cohorts.length?LEARNING_MODULES.filter(k=>!enabled.has(k)):[];
  const hidden=LEARNING_MODULES.filter(k=>!enabled.has(k)&&!locked.includes(k));
  return {progressive:cohorts.length>0,enabled:[...enabled],locked,hidden,admin:false};
}
async function tenantAdminTenants(env,user){
  if(user.platform_role==='OSC_ADMIN')return null; // null = todas
  return (await env.DB.prepare(`SELECT t.id,t.name FROM memberships m JOIN tenants t ON t.id=m.tenant_id WHERE m.user_id=? AND m.status='ACTIVE' AND m.role='TENANT_ADMIN' AND t.tenant_type='CONSULTANCY' AND t.status='ACTIVE'`).bind(user.id).all()).results;
}
async function ensureActivitySchema(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS user_activity (
    user_id TEXT NOT NULL,day TEXT NOT NULL,module_key TEXT NOT NULL,hits INTEGER NOT NULL DEFAULT 0,first_at TEXT NOT NULL,last_at TEXT NOT NULL,
    PRIMARY KEY(user_id,day,module_key),FOREIGN KEY(user_id) REFERENCES users(id))`).run();
}
// Día calendario en hora de Argentina (UTC-3) para contar "días de uso".
const activityDay=()=>new Date(Date.now()-3*3600e3).toISOString().slice(0,10);
async function trackActivity(env,user,moduleKey){
  try{
    if(!user||user.platform_role==='OSC_ADMIN'||!moduleKey)return;
    await ensureActivitySchema(env);
    const ts=now();
    await env.DB.prepare(`INSERT INTO user_activity(user_id,day,module_key,hits,first_at,last_at) VALUES(?,?,?,1,?,?)
      ON CONFLICT(user_id,day,module_key) DO UPDATE SET hits=hits+1,last_at=excluded.last_at`).bind(user.id,activityDay(),moduleKey,ts,ts).run();
  }catch(e){/* el registro de actividad nunca debe bloquear la navegación */}
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

async function hasPaymentAcademyLicense(env,user){
  if(user.platform_role==='OSC_ADMIN')return true;
  const ts=now();
  const row=await env.DB.prepare(`SELECT 1 ok FROM licenses l
    JOIN memberships m ON m.tenant_id=l.tenant_id AND m.user_id=? AND m.status='ACTIVE'
    WHERE l.product_id='product_payment' AND l.status='ACTIVE' AND l.starts_at<=? AND (l.expires_at IS NULL OR l.expires_at>?)
    UNION SELECT 1 ok FROM licenses l JOIN cohort_enrollments e ON e.cohort_id=l.cohort_id AND e.user_id=? AND e.status='ACTIVE'
    WHERE l.product_id='product_payment' AND l.status='ACTIVE' AND l.starts_at<=? AND (l.expires_at IS NULL OR l.expires_at>?) LIMIT 1`).bind(user.id,ts,ts,user.id,ts,ts).first();
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
  const allowed=['version','studentId','ownerUserId','ownerTenantId','createdAt','updatedAt','retention','transactions','batches','artifacts','events','atmMessages','lastAtmReconciliation','constructorPractices','isoMessages'];
  if(Object.keys(payload).some(key=>!allowed.includes(key)))return false;
  return ['transactions','batches','artifacts','events','atmMessages','constructorPractices','isoMessages'].every(key=>payload[key]===undefined||Array.isArray(payload[key]));
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
  if(path==='/api/tutor/query'&&request.method==='POST'){
    const auth=await requireUser(request,env); if(auth.error)return auth.error;
    await ensureTutorSchema(env);
    const b=await readBody(request),moduleKey=String(b.moduleKey||''),question=String(b.question||'').trim().slice(0,1200),brand=String(b.context?.brand||'').toUpperCase(),channel=String(b.context?.channel||'').toUpperCase();
    if(!TUTOR_MODULES.includes(moduleKey)||question.length<3)return json({error:'INVALID_TUTOR_QUERY'},400);
    const access=await learningAccess(env,auth.user);
    if(!access.enabled.includes(moduleKey))return json({error:'MODULE_NOT_ENABLED'},403);
    if(consultationQuestion(question))return json({kind:'CONSULTORIA',answer:'Puedo explicarte el concepto general, pero el análisis o diseño de una solución para una institución específica requiere revisar sus reglas, documentación y arquitectura. Este caso corresponde a Consultoría OSC.',reference:'Derivación a Consultoría OSC',moduleKey});
    const normalized=normalizeTutorText(question),words=new Set(normalized.split(' ').filter(x=>x.length>2));
    if(normalized.startsWith('buscar data element por nombre')){
      const term=normalized.replace('buscar data element por nombre','').trim();
      const matches=Object.entries(DE_NAMES).filter(([n,name])=>normalizeTutorText(name).includes(term)||term.split(' ').filter(Boolean).some(w=>normalizeTutorText(name).includes(w))).slice(0,12);
      if(!matches.length)return json({kind:'REFERENCIAR',answer:`No encontré coincidencias documentadas suficientes para “${term}” en el catálogo de nombres disponible. Ingresá el número del DE o probá otro término.`,moduleKey});
      return json({kind:'REFERENCIAR',answer:`Coincidencias encontradas para “${term}” en el contexto ${brand||'actual'} ${channel||''}:\n\n${matches.map(([n,name])=>`DE${n} — ${name}`).join('\n')}`,matches:matches.map(([n,name])=>({deNumber:Number(n),name})),moduleKey});
    }
    const deMatch=normalized.match(/\b(?:de|campo|data element)\s*0*(\d{1,3})\b/),deNumber=deMatch?Number(deMatch[1]):0;
    if(deNumber>=1&&deNumber<=128&&!brand)return json({kind:'NEED_BRAND',answer:`Para estudiar DE${deNumber} necesito primero la marca. No voy a completar la definición con un catálogo ISO genérico porque puede variar según la implementación.`,deNumber,brands:['VISA','MASTERCARD','AMEX'],moduleKey});
    if(deNumber>=1&&deNumber<=128&&brand){
      const manual=tutorManualReference(brand,deNumber,channel);
      return json({kind:'REFERENCIAR',...manual,deNumber,brand,moduleKey});
    }
    const mtiMatch=normalized.match(/\bmti\s*([0-9]{4})\b/);
    if(mtiMatch&&!['0200','0210'].includes(mtiMatch[1]))return json({kind:'REFERENCIAR',answer:tutorMTIAnswer(mtiMatch[1]),reference:'Estructura general del MTI ISO 8583; confirmar manual aprobado de la marca',moduleKey});
    const rows=(await env.DB.prepare(`SELECT id,title,keywords,answer,reference,module_key,behavior FROM tutor_knowledge WHERE status='APPROVED' AND (module_key='ALL' OR module_key=?)`).bind(moduleKey).all()).results;
    let best=null,bestScore=0;
    for(const row of rows){const keys=normalizeTutorText(`${row.title} ${row.keywords}`).split(' ');let score=0;for(const key of keys)if(words.has(key))score+=key.length>4?2:1;if(score>bestScore){best=row;bestScore=score;}}
    if(best&&bestScore>=2)return json({kind:best.behavior,answer:best.answer,reference:best.reference,knowledgeId:best.id,moduleKey});
    if(deNumber>=1&&deNumber<=128)return json({kind:'REFERENCIAR',answer:tutorDEAnswer(deNumber),reference:`Catálogo general ISO 8583 · DE${deNumber}; confirmar manual aprobado de la marca`,moduleKey});
    if(mtiMatch)return json({kind:'REFERENCIAR',answer:tutorMTIAnswer(mtiMatch[1]),reference:'Estructura general del MTI ISO 8583; confirmar manual aprobado de la marca',moduleKey});
    const tenantId=await bankTenant(env,auth.user),ts=now(),pendingId=id('tp');
    await env.DB.prepare(`INSERT INTO tutor_pending(id,tenant_id,user_id,module_key,question,status,created_at,updated_at) VALUES(?,?,?,?,?,'PENDING',?,?)`).bind(pendingId,tenantId,auth.user.id,moduleKey,question,ts,ts).run();
    return json({kind:'PENDIENTE',answer:'Esta consulta todavía no cuenta con una respuesta aprobada por OSC. La guardé en la Bandeja de conocimiento pendiente para su revisión.',pendingId,moduleKey});
  }

  if(path==='/api/admin/tutor/pending'&&request.method==='GET'){
    const auth=await requireUser(request,env,['OSC_ADMIN']); if(auth.error)return auth.error;
    await ensureTutorSchema(env);
    const rows=(await env.DB.prepare(`SELECT p.*,u.full_name,u.email,t.name tenant_name FROM tutor_pending p JOIN users u ON u.id=p.user_id LEFT JOIN tenants t ON t.id=p.tenant_id ORDER BY CASE p.status WHEN 'PENDING' THEN 0 WHEN 'IN_REVIEW' THEN 1 ELSE 2 END,p.created_at DESC LIMIT 500`).all()).results;
    return json({pending:rows});
  }

  const tutorReview=path.match(/^\/api\/admin\/tutor\/pending\/([^/]+)$/);
  if(tutorReview&&request.method==='PUT'){
    const auth=await requireUser(request,env,['OSC_ADMIN']); if(auth.error)return auth.error;
    await ensureTutorSchema(env); const b=await readBody(request),status=String(b.status||'IN_REVIEW');
    if(!['PENDING','IN_REVIEW','APPROVED','CONSULTORIA','OUT_OF_SCOPE','RETIRED'].includes(status))return json({error:'INVALID_STATUS'},400);
    const pending=await env.DB.prepare('SELECT * FROM tutor_pending WHERE id=?').bind(tutorReview[1]).first(); if(!pending)return json({error:'NOT_FOUND'},404);
    const ts=now(); let knowledgeId=null;
    if(status==='APPROVED'){
      const answer=String(b.answer||'').trim(),keywords=String(b.keywords||pending.question).trim(),reference=String(b.reference||'').trim();
      if(!answer||!reference)return json({error:'ANSWER_AND_REFERENCE_REQUIRED'},400);
      knowledgeId=id('tk');
      await env.DB.prepare(`INSERT INTO tutor_knowledge(id,title,keywords,answer,reference,module_key,behavior,status,approved_by,approved_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'APPROVED',?,?,?,?)`).bind(knowledgeId,String(b.title||pending.question).slice(0,180),keywords,answer,reference,String(b.moduleKey||pending.module_key),String(b.behavior||'EXPLICAR'),auth.user.id,ts,ts,ts).run();
    }
    await env.DB.prepare(`UPDATE tutor_pending SET status=?,review_note=?,answer=?,knowledge_id=?,updated_at=? WHERE id=?`).bind(status,String(b.reviewNote||''),String(b.answer||''),knowledgeId,ts,pending.id).run();
    await audit(env,auth.user.id,'REVIEW_TUTOR_QUESTION','TUTOR_PENDING',pending.id,{status,knowledgeId});
    return json({ok:true,status,knowledgeId});
  }

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
  if(path==='/api/bank/pos/cards'&&request.method==='GET'){
    const auth=await requireUser(request,env);if(auth.error)return auth.error;const user=auth.user;
    await ensureBankCustomerSchema(env);await ensureBankPassiveSchema(env);await ensureBankCardSchema(env);const tenantId=await bankTenant(env,user);
    const rows=(await env.DB.prepare(`SELECT k.id,k.card_number,k.expires_at,k.customer_id,k.linked_account_id,a.account_number,a.account_type,a.currency,a.balance,c.customer_number,c.first_name,c.last_name,c.legal_name FROM bank_cards k JOIN bank_accounts a ON a.id=k.linked_account_id JOIN bank_customers c ON c.id=k.customer_id WHERE k.tenant_id=? AND k.owner_user_id=? AND k.card_type='DEBITO' AND k.status='ACTIVE' AND a.status='ACTIVE' ORDER BY k.created_at DESC`).bind(tenantId,user.id).all()).results;
    return json({cards:rows.map(x=>({...x,masked_card_number:maskCard(x.card_number)}))});
  }
  if(path==='/api/bank/atm/cards'&&request.method==='GET'){
    const auth=await requireUser(request,env);if(auth.error)return auth.error;const user=auth.user;
    await ensureBankCustomerSchema(env);await ensureBankPassiveSchema(env);await ensureBankCardSchema(env);const tenantId=await bankTenant(env,user);
    const rows=(await env.DB.prepare(`SELECT k.id,k.card_number,k.expires_at,k.customer_id,k.linked_account_id,a.account_number,a.account_type,a.currency,a.balance,c.customer_number,c.first_name,c.last_name,c.legal_name FROM bank_cards k JOIN bank_accounts a ON a.id=k.linked_account_id JOIN bank_customers c ON c.id=k.customer_id WHERE k.tenant_id=? AND k.owner_user_id=? AND k.card_type='DEBITO' AND k.status='ACTIVE' AND a.status='ACTIVE' ORDER BY k.created_at DESC`).bind(tenantId,user.id).all()).results;
    return json({cards:rows});
  }
  if(path==='/api/bank/atm/authorize'&&request.method==='POST'){
    const auth=await requireUser(request,env);if(auth.error)return auth.error;const user=auth.user;
    await ensureBankCustomerSchema(env);await ensureBankPassiveSchema(env);await ensureBankCardSchema(env);const tenantId=await bankTenant(env,user),b=await readBody(request),cardId=String(b.cardId||''),amountCents=Number(b.amountCents),operation=String(b.operation||'withdrawal');
    if(!cardId||!Number.isFinite(amountCents)||amountCents<0)return json({error:'BAD_REQUEST',message:'Datos ATM inválidos.'},400);
    const row=await env.DB.prepare(`SELECT k.*,a.account_number,a.currency,a.balance,a.status account_status,c.customer_number,c.first_name,c.last_name,c.legal_name FROM bank_cards k JOIN bank_accounts a ON a.id=k.linked_account_id JOIN bank_customers c ON c.id=k.customer_id WHERE k.id=? AND k.tenant_id=? AND k.owner_user_id=? AND k.status='ACTIVE'`).bind(cardId,tenantId,user.id).first();
    if(!row)return json({error:'CARD_NOT_FOUND',message:'Tarjeta doméstica no encontrada.'},404);
    if(operation==='balance')return json({approved:true,responseCode:'00',balance:Number(row.balance||0),accountNumber:row.account_number,cardId:row.id});
    const amount=amountCents/100,balance=Number(row.balance||0);if(amount<=0)return json({error:'BAD_AMOUNT',message:'Importe inválido.'},400);
    if(balance<amount)return json({approved:false,responseCode:'51',message:'Fondos insuficientes',balance,accountNumber:row.account_number});
    const newBalance=balance-amount,ts=now(),movementId=id('mov'),reference=`ATM-${Date.now()}`;
    await env.DB.batch([
      env.DB.prepare(`UPDATE bank_accounts SET balance=?,updated_at=? WHERE id=? AND tenant_id=? AND owner_user_id=?`).bind(newBalance,ts,row.linked_account_id,tenantId,user.id),
      env.DB.prepare(`INSERT INTO bank_account_movements(id,tenant_id,owner_user_id,account_id,movement_type,description,amount,balance_after,reference,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(movementId,tenantId,user.id,row.linked_account_id,'EXTRACCION_ATM','Extracción ATM doméstica',-amount,newBalance,reference,ts)
    ]);
    return json({approved:true,responseCode:'00',message:'Aprobada',balance:newBalance,previousBalance:balance,accountNumber:row.account_number,reference,cardId:row.id});
  }
  if(path==='/api/bank/atm/transfer'&&request.method==='POST'){
    const auth=await requireUser(request,env);if(auth.error)return auth.error;const user=auth.user;
    await ensureBankCustomerSchema(env);await ensureBankPassiveSchema(env);await ensureBankCardSchema(env);const tenantId=await bankTenant(env,user),b=await readBody(request),cardId=String(b.cardId||''),destinationAccountId=String(b.destinationAccountId||''),amountCents=Number(b.amountCents);
    if(!cardId||!destinationAccountId||!Number.isFinite(amountCents)||amountCents<=0)return json({error:'BAD_REQUEST',message:'Datos de transferencia inválidos.'},400);
    const src=await env.DB.prepare(`SELECT k.linked_account_id,a.account_number,a.currency,a.balance FROM bank_cards k JOIN bank_accounts a ON a.id=k.linked_account_id WHERE k.id=? AND k.tenant_id=? AND k.owner_user_id=? AND k.status='ACTIVE' AND a.status='ACTIVE'`).bind(cardId,tenantId,user.id).first();
    const dst=await env.DB.prepare(`SELECT id,account_number,currency,balance FROM bank_accounts WHERE id=? AND tenant_id=? AND owner_user_id=? AND status='ACTIVE'`).bind(destinationAccountId,tenantId,user.id).first();
    if(!src||!dst)return json({approved:false,responseCode:'14',message:'Cuenta origen o destino no encontrada.'},404);if(src.linked_account_id===dst.id)return json({approved:false,responseCode:'57',message:'Origen y destino deben ser diferentes.'},400);if(src.currency!==dst.currency)return json({approved:false,responseCode:'57',message:'Las cuentas deben tener la misma moneda.'},400);
    const amount=amountCents/100,srcBal=Number(src.balance||0),dstBal=Number(dst.balance||0);if(srcBal<amount)return json({approved:false,responseCode:'51',message:'Fondos insuficientes',balance:srcBal,accountNumber:src.account_number});
    const ts=now(),newSrc=srcBal-amount,newDst=dstBal+amount,ref=`TRF-${Date.now()}`;
    await env.DB.batch([env.DB.prepare(`UPDATE bank_accounts SET balance=?,updated_at=? WHERE id=?`).bind(newSrc,ts,src.linked_account_id),env.DB.prepare(`UPDATE bank_accounts SET balance=?,updated_at=? WHERE id=?`).bind(newDst,ts,dst.id),env.DB.prepare(`INSERT INTO bank_account_movements(id,tenant_id,owner_user_id,account_id,movement_type,description,amount,balance_after,reference,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(id('mov'),tenantId,user.id,src.linked_account_id,'TRANSFERENCIA_SALIDA',`Transferencia ATM a ${dst.account_number}`,-amount,newSrc,ref,ts),env.DB.prepare(`INSERT INTO bank_account_movements(id,tenant_id,owner_user_id,account_id,movement_type,description,amount,balance_after,reference,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(id('mov'),tenantId,user.id,dst.id,'TRANSFERENCIA_ENTRADA',`Transferencia ATM desde ${src.account_number}`,amount,newDst,ref,ts)]);
    return json({approved:true,responseCode:'00',message:'Transferencia aprobada',balance:newSrc,accountNumber:src.account_number,destinationAccountNumber:dst.account_number,reference:ref});
  }
  if(path==='/api/bank/atm/pin'&&request.method==='POST'){
    const auth=await requireUser(request,env);if(auth.error)return auth.error;const user=auth.user;await ensureBankCardSchema(env);const tenantId=await bankTenant(env,user),b=await readBody(request),cardId=String(b.cardId||''),newPin=String(b.newPin||'');
    if(!cardId||!/^[0-9]{4}$/.test(newPin))return json({error:'BAD_PIN',message:'El PIN debe tener 4 dígitos.'},400);const card=await env.DB.prepare(`SELECT id FROM bank_cards WHERE id=? AND tenant_id=? AND owner_user_id=? AND status='ACTIVE'`).bind(cardId,tenantId,user.id).first();if(!card)return json({error:'CARD_NOT_FOUND'},404);
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS bank_card_pins(card_id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,owner_user_id TEXT NOT NULL,pin_hash TEXT NOT NULL,updated_at TEXT NOT NULL)`).run();const ts=now(),pinHash=await sha256(newPin);await env.DB.prepare(`INSERT INTO bank_card_pins(card_id,tenant_id,owner_user_id,pin_hash,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(card_id) DO UPDATE SET pin_hash=excluded.pin_hash,updated_at=excluded.updated_at`).bind(cardId,tenantId,user.id,pinHash,ts).run();return json({ok:true});
  }
  if(path==='/api/bank/atm/reverse'&&request.method==='POST'){
    const auth=await requireUser(request,env);if(auth.error)return auth.error;const user=auth.user;
    await ensureBankPassiveSchema(env);const tenantId=await bankTenant(env,user),b=await readBody(request),cardId=String(b.cardId||''),amountCents=Number(b.amountCents),originalReference=String(b.originalReference||'');
    if(!cardId||!Number.isFinite(amountCents)||amountCents<=0)return json({error:'BAD_REQUEST',message:'Datos de reversa inválidos.'},400);
    const row=await env.DB.prepare(`SELECT k.linked_account_id,a.account_number,a.balance FROM bank_cards k JOIN bank_accounts a ON a.id=k.linked_account_id WHERE k.id=? AND k.tenant_id=? AND k.owner_user_id=?`).bind(cardId,tenantId,user.id).first();if(!row)return json({error:'CARD_NOT_FOUND'},404);
    if(originalReference){const prior=await env.DB.prepare(`SELECT id FROM bank_account_movements WHERE account_id=? AND movement_type='REVERSA_ATM' AND reference=?`).bind(row.linked_account_id,originalReference).first();if(prior)return json({approved:true,responseCode:'00',balance:Number(row.balance||0),alreadyReversed:true});}
    const amount=amountCents/100,balance=Number(row.balance||0),newBalance=balance+amount,ts=now(),ref=originalReference||`ATM-REV-${Date.now()}`;
    await env.DB.batch([env.DB.prepare(`UPDATE bank_accounts SET balance=?,updated_at=? WHERE id=?`).bind(newBalance,ts,row.linked_account_id),env.DB.prepare(`INSERT INTO bank_account_movements(id,tenant_id,owner_user_id,account_id,movement_type,description,amount,balance_after,reference,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(id('mov'),tenantId,user.id,row.linked_account_id,'REVERSA_ATM','Reversa ATM doméstica',amount,newBalance,ref,ts)]);
    return json({approved:true,responseCode:'00',balance:newBalance,accountNumber:row.account_number});
  }
  if(path==='/api/bank/pos/authorize'&&request.method==='POST'){
    const auth=await requireUser(request,env);if(auth.error)return auth.error;const user=auth.user;
    await ensureBankCustomerSchema(env);await ensureBankPassiveSchema(env);await ensureBankCardSchema(env);const tenantId=await bankTenant(env,user),b=await readBody(request),cardId=String(b.cardId||''),amountCents=Number(b.amountCents);
    if(!cardId||!Number.isInteger(amountCents)||amountCents<=0)return json({error:'INVALID_DATA',message:'Tarjeta e importe son obligatorios.'},400);
    const row=await env.DB.prepare(`SELECT k.*,a.account_number,a.currency,a.balance,a.status account_status,c.customer_number,c.first_name,c.last_name,c.legal_name FROM bank_cards k JOIN bank_accounts a ON a.id=k.linked_account_id JOIN bank_customers c ON c.id=k.customer_id WHERE k.id=? AND k.tenant_id=? AND k.owner_user_id=? AND k.status='ACTIVE'`).bind(cardId,tenantId,user.id).first();
    if(!row||row.account_status!=='ACTIVE')return json({ok:true,responseCode:'05',approved:false,message:'Tarjeta o cuenta no disponible.'});
    const amount=amountCents/100,previousBalance=Number(row.balance||0);
    if(previousBalance<amount)return json({ok:true,responseCode:'51',approved:false,previousBalance,balance:previousBalance,accountNumber:row.account_number,message:'Fondos insuficientes.'});
    const ts=now(),newBalance=previousBalance-amount,reference=`POS-${Date.now()}`,movementId=id('mov');
    await env.DB.batch([
      env.DB.prepare(`UPDATE bank_accounts SET balance=?,updated_at=? WHERE id=? AND tenant_id=? AND owner_user_id=?`).bind(newBalance,ts,row.linked_account_id,tenantId,user.id),
      env.DB.prepare(`INSERT INTO bank_account_movements(id,tenant_id,owner_user_id,account_id,movement_type,description,amount,balance_after,reference,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(movementId,tenantId,user.id,row.linked_account_id,'COMPRA_POS','Compra POS doméstica',-amount,newBalance,reference,ts)
    ]);
    await audit(env,user.id,'BANK_POS_PURCHASE','BANK_ACCOUNT',row.linked_account_id,{cardId,amount,previousBalance,newBalance,reference});
    return json({ok:true,responseCode:'00',approved:true,previousBalance,balance:newBalance,accountNumber:row.account_number,reference,message:'Aprobada por Banco Virtual OSC.'});
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
    const analytics=await productAccess(env,auth.user,PRODUCT_DAILY);
    const live=await productAccess(env,auth.user,PRODUCT_LIVE);
    const modules=await learningAccess(env,auth.user);
    const adminTenants=await tenantAdminTenants(env,auth.user);
    return json({user:auth.user,memberships,cohorts,
      entitlements:{authorizationAnalytics:!!analytics,liveMonitoring:!!live,usagePanel:auth.user.platform_role==='OSC_ADMIN'||!!adminTenants?.length},
      moduleAccess:modules});
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


  /* ===================== rc.1.22 · Consultoras: módulos y productos ===================== */
  async function resolveUsers(list,ts){
    const out=[],created=[];
    for(const raw of (Array.isArray(list)?list:[])){
      const v=String(raw||'').trim(); if(!v) continue;
      let u=await env.DB.prepare('SELECT id,email,full_name FROM users WHERE id=? OR lower(email)=lower(?)').bind(v,v).first();
      if(!u&&/@/.test(v)){
        const temp=randomToken().slice(0,14),salt=randomToken(),hash=await passwordHash(temp,salt),uid=id('usr');
        await env.DB.prepare("INSERT INTO users(id,email,full_name,password_hash,password_salt,platform_role,status,created_at,updated_at) VALUES(?,?,?,?,?,'USER','ACTIVE',?,?)").bind(uid,v.toLowerCase(),v.split('@')[0],hash,salt,ts,ts).run();
        u={id:uid,email:v.toLowerCase(),full_name:v.split('@')[0]};created.push({userId:uid,email:u.email,temporaryPassword:temp});
      }
      if(u&&!out.find(x=>x.id===u.id))out.push(u);
      if(!u)return {error:`No existe el usuario ${v}`};
    }
    return {users:out,created};
  }
  async function upsertProductLicense(tenantId,productId,on,seats,expiresAt,ts){
    const lic=await env.DB.prepare("SELECT id FROM licenses WHERE tenant_id=? AND product_id=? ORDER BY created_at DESC LIMIT 1").bind(tenantId,productId).first();
    if(lic) await env.DB.prepare("UPDATE licenses SET status=?,seat_limit=?,expires_at=?,updated_at=? WHERE id=?").bind(on?'ACTIVE':'INACTIVE',seats,expiresAt,ts,lic.id).run();
    else if(on) await env.DB.prepare("INSERT INTO licenses(id,tenant_id,product_id,license_type,starts_at,expires_at,seat_limit,status,created_at,updated_at) VALUES(?,?,?,'CONSULTANCY',?,?,?,'ACTIVE',?,?)").bind(id('lic'),tenantId,productId,ts,expiresAt,seats,ts,ts).run();
  }
  async function saveTenantModules(tenantId,modules,actorId,ts){
    await ensureTenantModuleSchema(env);
    const on=new Set((Array.isArray(modules)?modules:[]).filter(k=>LEARNING_MODULES.includes(k)));
    await env.DB.batch(LEARNING_MODULES.map(k=>env.DB.prepare(`INSERT INTO tenant_module_access(tenant_id,module_key,enabled,updated_by,updated_at) VALUES(?,?,?,?,?)
      ON CONFLICT(tenant_id,module_key) DO UPDATE SET enabled=excluded.enabled,updated_by=excluded.updated_by,updated_at=excluded.updated_at`).bind(tenantId,k,on.has(k)?1:0,actorId,ts)));
  }
  async function consultancyDetail(tenantId){
    await ensureTenantModuleSchema(env);
    const t=await env.DB.prepare("SELECT id,name,status,created_at FROM tenants WHERE id=? AND tenant_type='CONSULTANCY'").bind(tenantId).first();
    if(!t)return null;
    const licenses=(await env.DB.prepare("SELECT id,product_id,seat_limit,starts_at,expires_at,status FROM licenses WHERE tenant_id=? ORDER BY created_at").bind(tenantId).all()).results;
    const members=(await env.DB.prepare("SELECT u.id,u.email,u.full_name,m.role,u.last_login_at FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.tenant_id=? AND m.status='ACTIVE' ORDER BY u.full_name").bind(tenantId).all()).results;
    const mods=(await env.DB.prepare("SELECT module_key,enabled FROM tenant_module_access WHERE tenant_id=?").bind(tenantId).all()).results;
    const active=p=>licenses.some(l=>l.product_id===p&&l.status==='ACTIVE');
    const pay=licenses.filter(l=>l.status==='ACTIVE').sort((a,b)=>String(b.expires_at||'9').localeCompare(String(a.expires_at||'9')))[0];
    return {...t,licenses,members,
      modules:mods.length?mods.filter(m=>m.enabled).map(m=>m.module_key):(active(PRODUCT_PAYMENT)?[...LEARNING_MODULES]:[]),
      modulesConfigured:mods.length>0,
      products:{payment:active(PRODUCT_PAYMENT),daily:active(PRODUCT_DAILY),live:active(PRODUCT_LIVE)},
      seats:pay?.seat_limit||members.length,expiresAt:pay?.expires_at||null};
  }
  if(path==='/api/admin/consultancies'&&request.method==='GET'){
    const auth=await requireUser(request,env,['OSC_ADMIN']); if(auth.error)return auth.error;
    const ids=(await env.DB.prepare("SELECT id FROM tenants WHERE tenant_type='CONSULTANCY' ORDER BY created_at DESC").all()).results;
    const out=[];for(const r of ids)out.push(await consultancyDetail(r.id));
    return json({consultancies:out,modules:LEARNING_MODULES.map(k=>({key:k,label:MODULE_LABELS[k]}))});
  }
  if(path==='/api/admin/consultancies'&&request.method==='POST'){
    const auth=await requireUser(request,env,['OSC_ADMIN']); if(auth.error)return auth.error;
    await ensureLiveMonitoringProduct(env);
    const b=await readBody(request),ts=now();
    const name=String(b.name||'').trim(); if(!name)return json({error:'INVALID_DATA',message:'Falta el nombre de la consultora.'},400);
    const r=await resolveUsers(b.users,ts); if(r.error)return json({error:'USER_NOT_FOUND',message:r.error},400);
    if(!r.users.length)return json({error:'INVALID_DATA',message:'Indicá al menos un usuario (correo o ID).'},400);
    const admin=await resolveUsers([b.adminUser||r.users[0].id],ts); if(admin.error)return json({error:'USER_NOT_FOUND',message:admin.error},400);
    const adminId=admin.users[0].id;
    const seats=Math.max(Number(b.seats||r.users.length),r.users.length),expiresAt=b.expiresAt||null;
    const tenantId=id('tenant');
    await env.DB.prepare("INSERT INTO tenants(id,name,slug,tenant_type,status,created_at,updated_at) VALUES(?,?,?,'CONSULTANCY','ACTIVE',?,?)").bind(tenantId,name,name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+Date.now(),ts,ts).run();
    const modules=(Array.isArray(b.modules)?b.modules:[]).filter(k=>LEARNING_MODULES.includes(k));
    const products={payment:modules.length>0,daily:!!b.products?.daily,live:!!b.products?.live};
    await upsertProductLicense(tenantId,PRODUCT_PAYMENT,products.payment,seats,expiresAt,ts);
    await upsertProductLicense(tenantId,PRODUCT_DAILY,products.daily,seats,expiresAt,ts);
    await upsertProductLicense(tenantId,PRODUCT_LIVE,products.live,seats,expiresAt,ts);
    await saveTenantModules(tenantId,modules,auth.user.id,ts);
    const all=[...r.users];if(!all.find(u=>u.id===adminId))all.push(admin.users[0]);
    for(const u of all){
      await env.DB.prepare("INSERT OR IGNORE INTO memberships(id,tenant_id,user_id,role,status,created_at,updated_at) VALUES(?,?,?,?,'ACTIVE',?,?)").bind(id('mem'),tenantId,u.id,u.id===adminId?'TENANT_ADMIN':'STUDENT',ts,ts).run();
      if(products.payment)await env.DB.prepare('UPDATE workspaces_v4 SET tenant_id=?,updated_at=? WHERE user_id=? AND product_id=?').bind(tenantId,ts,u.id,PRODUCT_PAYMENT).run();
    }
    await audit(env,auth.user.id,'CREATE_CONSULTANCY','TENANT',tenantId,{modules,products,seats,expiresAt,users:all.map(u=>u.id)});
    return json({ok:true,tenantId,created:[...r.created,...admin.created],consultancy:await consultancyDetail(tenantId)},201);
  }
  const consultancyMatch=path.match(/^\/api\/admin\/consultancies\/([^/]+)$/);
  if(consultancyMatch&&request.method==='PUT'){
    const auth=await requireUser(request,env,['OSC_ADMIN']); if(auth.error)return auth.error;
    await ensureLiveMonitoringProduct(env);
    const tenantId=consultancyMatch[1],b=await readBody(request),ts=now();
    const current=await consultancyDetail(tenantId); if(!current)return json({error:'TENANT_NOT_FOUND'},404);
    const add=await resolveUsers(b.addUsers,ts); if(add.error)return json({error:'USER_NOT_FOUND',message:add.error},400);
    const seats=Number(b.seats||current.seats||1),expiresAt=b.expiresAt===undefined?current.expiresAt:(b.expiresAt||null);
    if(current.members.length+add.users.filter(u=>!current.members.find(m=>m.id===u.id)).length>seats)return json({error:'SEAT_LIMIT_EXCEEDED',message:'Superás la cantidad de licencias. Aumentá las licencias o quitá usuarios.'},409);
    const modules=(Array.isArray(b.modules)?b.modules:current.modules).filter(k=>LEARNING_MODULES.includes(k));
    const products={payment:modules.length>0,daily:b.products?.daily??current.products.daily,live:b.products?.live??current.products.live};
    await upsertProductLicense(tenantId,PRODUCT_PAYMENT,products.payment,seats,expiresAt,ts);
    await upsertProductLicense(tenantId,PRODUCT_DAILY,!!products.daily,seats,expiresAt,ts);
    await upsertProductLicense(tenantId,PRODUCT_LIVE,!!products.live,seats,expiresAt,ts);
    await saveTenantModules(tenantId,modules,auth.user.id,ts);
    for(const u of add.users){
      await env.DB.prepare("INSERT OR IGNORE INTO memberships(id,tenant_id,user_id,role,status,created_at,updated_at) VALUES(?,?,?,'STUDENT','ACTIVE',?,?)").bind(id('mem'),tenantId,u.id,ts,ts).run();
      await env.DB.prepare("UPDATE memberships SET status='ACTIVE',updated_at=? WHERE tenant_id=? AND user_id=?").bind(ts,tenantId,u.id).run();
    }
    if(b.adminUser){
      const a=await resolveUsers([b.adminUser],ts);
      if(!a.error&&a.users[0]){
        await env.DB.prepare("UPDATE memberships SET role='STUDENT',updated_at=? WHERE tenant_id=? AND role='TENANT_ADMIN'").bind(ts,tenantId).run();
        await env.DB.prepare("INSERT OR IGNORE INTO memberships(id,tenant_id,user_id,role,status,created_at,updated_at) VALUES(?,?,?,'TENANT_ADMIN','ACTIVE',?,?)").bind(id('mem'),tenantId,a.users[0].id,ts,ts).run();
        await env.DB.prepare("UPDATE memberships SET role='TENANT_ADMIN',status='ACTIVE',updated_at=? WHERE tenant_id=? AND user_id=?").bind(ts,tenantId,a.users[0].id).run();
      }
    }
    for(const uid of (Array.isArray(b.removeUsers)?b.removeUsers:[]))await env.DB.prepare("UPDATE memberships SET status='INACTIVE',updated_at=? WHERE tenant_id=? AND user_id=? AND role<>'TENANT_ADMIN'").bind(ts,tenantId,uid).run();
    await audit(env,auth.user.id,'UPDATE_CONSULTANCY','TENANT',tenantId,{modules,products,seats,expiresAt,added:add.users.map(u=>u.id)});
    return json({ok:true,created:add.created,consultancy:await consultancyDetail(tenantId)});
  }

  /* ===================== rc.1.22 · Uso de licencias ===================== */
  async function usageScope(user,url){
    const adminTenants=await tenantAdminTenants(env,user);
    if(adminTenants!==null&&!adminTenants.length)return {error:json({error:'FORBIDDEN'},403)};
    const groups=adminTenants===null
      ? (await env.DB.prepare(`SELECT t.id,t.name,t.tenant_type type,(SELECT MAX(l.expires_at) FROM licenses l WHERE l.tenant_id=t.id AND l.status='ACTIVE') expires_at,
          (SELECT MIN(l.starts_at) FROM licenses l WHERE l.tenant_id=t.id) starts_at FROM tenants t WHERE t.tenant_type IN ('COURSE','CONSULTANCY') AND t.status='ACTIVE' ORDER BY t.created_at DESC`).all()).results
      : (await Promise.all(adminTenants.map(t=>env.DB.prepare(`SELECT t.id,t.name,t.tenant_type type,(SELECT MAX(l.expires_at) FROM licenses l WHERE l.tenant_id=t.id AND l.status='ACTIVE') expires_at,(SELECT MIN(l.starts_at) FROM licenses l WHERE l.tenant_id=t.id) starts_at FROM tenants t WHERE t.id=?`).bind(t.id).first())));
    const requested=url.searchParams.get('tenantId');
    const selected=requested?groups.filter(g=>g.id===requested):groups;
    if(requested&&!selected.length)return {error:json({error:'FORBIDDEN'},403)};
    return {groups,selected,isAdmin:adminTenants===null};
  }
  async function usageRows(tenants){
    await ensureActivitySchema(env); await ensureTutorSchema(env);
    const rows=[];
    for(const t of tenants){
      const members=(await env.DB.prepare(`SELECT u.id,u.email,u.full_name,u.created_at,u.last_login_at,m.role,
          (SELECT MAX(a.last_at) FROM user_activity a WHERE a.user_id=u.id) last_activity_at,
          (SELECT COUNT(DISTINCT a.day) FROM user_activity a WHERE a.user_id=u.id AND a.day>=substr(COALESCE(?, u.created_at),1,10)) active_days,
          (SELECT GROUP_CONCAT(DISTINCT a.module_key) FROM user_activity a WHERE a.user_id=u.id) modules,
          (SELECT MAX(w.updated_at) FROM workspace_data w WHERE w.user_id=u.id) workspace_saved_at,
          (SELECT COUNT(*) FROM tutor_pending q WHERE q.user_id=u.id) tutor_questions,
          (SELECT COUNT(*) FROM forum_topics f WHERE f.author_user_id=u.id)+(SELECT COUNT(*) FROM forum_replies r WHERE r.author_user_id=u.id) forum_posts,
          (SELECT MAX(x.created_at) FROM audit_log x WHERE x.action='USAGE_REMINDER' AND x.entity_id=u.id) last_reminder_at
        FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.tenant_id=? AND m.status='ACTIVE' AND u.platform_role<>'OSC_ADMIN' ORDER BY u.full_name`).bind(t.starts_at||null,t.id).all().catch(()=>
          // Base sin alguna tabla opcional (workspace_data / foro): se informa con los datos básicos.
          env.DB.prepare(`SELECT u.id,u.email,u.full_name,u.created_at,u.last_login_at,m.role,
            (SELECT MAX(a.last_at) FROM user_activity a WHERE a.user_id=u.id) last_activity_at,
            (SELECT COUNT(DISTINCT a.day) FROM user_activity a WHERE a.user_id=u.id) active_days,
            (SELECT GROUP_CONCAT(DISTINCT a.module_key) FROM user_activity a WHERE a.user_id=u.id) modules,
            NULL workspace_saved_at,0 tutor_questions,0 forum_posts,
            (SELECT MAX(x.created_at) FROM audit_log x WHERE x.action='USAGE_REMINDER' AND x.entity_id=u.id) last_reminder_at
            FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.tenant_id=? AND m.status='ACTIVE' AND u.platform_role<>'OSC_ADMIN' ORDER BY u.full_name`).bind(t.id).all())).results;
      for(const m of members){
        const last=[m.last_login_at,m.last_activity_at,m.workspace_saved_at].filter(Boolean).sort().pop()||null;
        const days=last?Math.floor((Date.now()-new Date(last).getTime())/86400e3):null;
        rows.push({...m,tenant_id:t.id,tenant_name:t.name,tenant_type:t.type,license_expires_at:t.expires_at,
          last_seen_at:last,days_since:days,status:last==null?'never':days<=7?'active':days<=14?'warning':'inactive',
          modules:m.modules?String(m.modules).split(','):[]});
      }
    }
    return rows;
  }
  if(path==='/api/usage/overview'&&request.method==='GET'){
    const auth=await requireUser(request,env); if(auth.error)return auth.error;
    const scope=await usageScope(auth.user,new URL(request.url)); if(scope.error)return scope.error;
    const rows=await usageRows(scope.selected);
    const order={never:0,inactive:1,warning:2,active:3};
    rows.sort((a,b)=>order[a.status]-order[b.status]||((b.days_since??-1)-(a.days_since??-1))||String(a.full_name).localeCompare(String(b.full_name)));
    const summary={assigned:rows.length,never:rows.filter(r=>r.status==='never').length,active7:rows.filter(r=>r.status==='active').length,inactive:rows.filter(r=>r.status==='warning'||r.status==='inactive').length};
    return json({isAdmin:scope.isAdmin,groups:scope.groups,summary,users:rows,moduleLabels:{...MODULE_LABELS,dashboard:'Inicio',cuenta:'Mi cuenta',analisis_diario:'Análisis Diario',monitoreo_vivo:'Monitoreo en Vivo'}});
  }
  const usageUserMatch=path.match(/^\/api\/usage\/users\/([^/]+)$/);
  if(usageUserMatch&&request.method==='GET'){
    const auth=await requireUser(request,env); if(auth.error)return auth.error;
    const targetId=usageUserMatch[1];
    const adminTenants=await tenantAdminTenants(env,auth.user);
    if(adminTenants!==null){
      const ok=adminTenants.length&&await env.DB.prepare(`SELECT 1 ok FROM memberships WHERE user_id=? AND status='ACTIVE' AND tenant_id IN (${adminTenants.map(()=>'?').join(',')})`).bind(targetId,...adminTenants.map(t=>t.id)).first();
      if(!ok)return json({error:'FORBIDDEN'},403);
    }
    await ensureActivitySchema(env);
    const since=new Date(Date.now()-90*86400e3).toISOString().slice(0,10);
    const days=(await env.DB.prepare(`SELECT day,GROUP_CONCAT(module_key) modules,SUM(hits) hits,MIN(first_at) first_at,MAX(last_at) last_at FROM user_activity WHERE user_id=? AND day>=? GROUP BY day ORDER BY day DESC`).bind(targetId,since).all()).results;
    const user=await env.DB.prepare('SELECT id,email,full_name,last_login_at,created_at FROM users WHERE id=?').bind(targetId).first();
    return json({user,days:days.map(d=>({...d,modules:String(d.modules||'').split(',').filter(Boolean)}))});
  }
  if(path==='/api/usage/reminder'&&request.method==='POST'){
    const auth=await requireUser(request,env); if(auth.error)return auth.error;
    const b=await readBody(request),targetId=String(b.userId||'');
    const adminTenants=await tenantAdminTenants(env,auth.user);
    if(adminTenants!==null){
      const ok=adminTenants.length&&await env.DB.prepare(`SELECT 1 ok FROM memberships WHERE user_id=? AND status='ACTIVE' AND tenant_id IN (${adminTenants.map(()=>'?').join(',')})`).bind(targetId,...adminTenants.map(t=>t.id)).first();
      if(!ok)return json({error:'FORBIDDEN'},403);
    }
    const user=await env.DB.prepare('SELECT id,email,full_name FROM users WHERE id=?').bind(targetId).first();
    if(!user)return json({error:'USER_NOT_FOUND'},404);
    await audit(env,auth.user.id,'USAGE_REMINDER','USER',user.id,{email:user.email,channel:'mailto'});
    return json({ok:true,email:user.email,fullName:user.full_name,remindedAt:now()});
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

/* rc.1.22 · Página de "módulo no disponible" (bloqueo del lado servidor, además del menú). */
function moduleBlockedPage(title,message,status=403){
  const esc=v=>String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
  return new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · OSC Payment Academy</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"></head><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#06111d;color:#f5f8fc;font-family:Inter,Segoe UI,Arial,sans-serif;padding:16px"><main style="max-width:560px;text-align:center;border:1px solid #1d405c;border-radius:16px;padding:36px;background:#0a1928"><div style="font-size:42px">🔒</div><h1 style="font-size:24px">${esc(title)}</h1><p style="color:#9cb2c6;line-height:1.55">${esc(message)}</p><a href="/" style="display:inline-block;margin-top:14px;padding:11px 18px;border-radius:9px;background:#0875dc;color:white;text-decoration:none">← Volver a la plataforma</a></main></body></html>`,{status,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
}
const MODULE_LABELS={course_iso8583:'Curso Interactivo',ebook:'eBook ISO 8583',banco_simulado:'Banco simulado',constructor:'Constructor ISO8583',pos:'POS Virtual',atm:'ATM Virtual',wallet:'Wallet / Tokenización',ecommerce:'E-Commerce / 3DS',switch_adquirente:'Switch del Adquirente',switch_emisor:'Switch Emisor',parser:'Parser ISO8583'};

export default {async fetch(request,env,ctx){
  const url=new URL(request.url),path=url.pathname;
  if(url.hostname==='www.oscpaymentacademy.com'){
    url.hostname='oscpaymentacademy.com';
    return Response.redirect(url.toString(),308);
  }
  if(path.startsWith('/api/'))return api(request,env,path);
  // rc.1.21 · Manuales LINK: CONFIDENCIALES. Solo OSC_ADMIN; nunca listados en Documentación Técnica.
  let linkProbe=path;try{linkProbe=decodeURIComponent(path);}catch(e){}
  if(/^\/+manuals\/+link(\/|$)/i.test(linkProbe.replace(/\\/g,'/'))){
    const user=await currentUser(request,env);
    if(!user||user.platform_role!=='OSC_ADMIN')return new Response('Not found',{status:404,headers:{'cache-control':'no-store','x-robots-tag':'noindex, nofollow'}});
    const response=await env.ASSETS.fetch(request);
    const headers=new Headers(response.headers);
    headers.set('cache-control','private, no-store');
    headers.set('x-robots-tag','noindex, nofollow');
    headers.set('content-disposition','inline');
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
  }
  if(path==='/ebooks/ISO_8583_Desde_Cero_Oscar_Sanchez_Castro.epub'){
    const user=await currentUser(request,env);
    if(!user)return Response.redirect(`${url.origin}/login?next=${encodeURIComponent(path)}`,302);
    if(!(await hasPaymentAcademyLicense(env,user)))return Response.redirect(`${url.origin}/expired?product=payment-academy`,302);
    const access=await learningAccess(env,user);
    if(!access.enabled.includes('ebook'))return moduleBlockedPage('eBook ISO 8583','El eBook no está incluido en tu licencia. Consultá con tu administrador.');
    const response=await env.ASSETS.fetch(request);
    const headers=new Headers(response.headers);
    headers.set('content-disposition','attachment; filename="ISO_8583_Desde_Cero_Oscar_Sanchez_Castro.epub"');
    headers.set('cache-control','private, no-store');
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
  }
  if(path==='/'||path==='/index.html'){
    const visitor=await currentUser(request,env);
    if(!visitor){
      const r=await env.ASSETS.fetch(new Request(new URL('/landing',url.origin),request));
      const h=new Headers(r.headers);h.set('cache-control','no-store');
      return new Response(r.body,{status:r.status,statusText:r.statusText,headers:h});
    }
  }
  const publicPaths=new Set(['/landing','/landing.html','/login','/login.html','/reset','/reset.html','/styles.css','/favicon.ico','/favicon.svg']);
  const assetLike=/\.(css|js|png|jpg|jpeg|svg|webp|ico|woff2)$/i.test(path);
  if(!publicPaths.has(path)&&!assetLike){
    const user=await currentUser(request,env);
    if(!user)return Response.redirect(`${url.origin}/login?next=${encodeURIComponent(path+url.search)}`,302);
    // rc.1.22 · Análisis Diario y Monitoreo en Vivo se habilitan con licencias SEPARADAS.
    if((path==='/authorization-analytics'||path==='/authorization-analytics.html')&&!(await productAccess(env,user,PRODUCT_DAILY)))return Response.redirect(`${url.origin}/expired?product=authorization-analytics`,302);
    if((path==='/monitoreo-vivo'||path==='/monitoreo-vivo.html')&&!(await productAccess(env,user,PRODUCT_LIVE)))return Response.redirect(`${url.origin}/expired?product=live-monitoring`,302);
    if(path!=='/expired'&&path!=='/expired.html'&&!(await hasActiveLicense(env,user)))return Response.redirect(`${url.origin}/expired`,302);
    // rc.1.22 · Páginas por módulo, solo administración y registro de actividad.
    let page=(path.split('/').pop()||'index.html').toLowerCase();
    if(!page.includes('.'))page+='.html';
    if(ADMIN_ONLY_PAGES.has(page)&&user.platform_role!=='OSC_ADMIN')
      return moduleBlockedPage(page==='research.html'?'Investigación':'Documentación Técnica','Esta sección es solo para la administración de OSC. Los manuales se abren desde la manito ☝ de cada campo en el Parser y el Constructor.');
    const moduleKey=PAGE_MODULES[page];
    if(moduleKey&&user.platform_role!=='OSC_ADMIN'){
      const access=await learningAccess(env,user);
      if(!access.enabled.includes(moduleKey)){
        const label=MODULE_LABELS[moduleKey]||'Módulo';
        if(access.locked.includes(moduleKey))return moduleBlockedPage(label,`Este módulo forma parte del programa progresivo y estará disponible después de la clase${MODULE_DAY[moduleKey]?' del Día '+MODULE_DAY[moduleKey]:''}.`);
        return moduleBlockedPage(label,'Este módulo no está incluido en la licencia de tu empresa. Consultá con tu administrador.');
      }
    }
    const activityKey=/\.html$/.test(page)?(moduleKey||ACTIVITY_PAGES[page]||null):null;
    if(activityKey){
      // Se registra solo la página efectivamente servida (no las redirecciones /pos.html → /pos).
      const response=await env.ASSETS.fetch(request);
      if(response.status===200){
        if(ctx?.waitUntil)ctx.waitUntil(trackActivity(env,user,activityKey));
        else await trackActivity(env,user,activityKey);
      }
      return response;
    }
    if(/^\/+manuals\//i.test(path)){
      const response=await env.ASSETS.fetch(request);
      const headers=new Headers(response.headers);
      headers.set('cache-control','private, no-store');
      headers.set('x-robots-tag','noindex, nofollow');
      return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
    }
  }
  return env.ASSETS.fetch(request);
}};
