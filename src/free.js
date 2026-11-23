// OSC Payment Academy · v4.0.0-rc.1.58 · Versión gratuita (Parser libre + cuenta gratis).
// Módulo AISLADO: atiende solo /free/* y /api/free/*. No lee ni escribe las tablas de la plataforma
// (users, sessions, licencias, workspace). Sesión propia (cookie osc_free_session) y tablas propias free_*.

const enc = new TextEncoder();
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
const now = () => new Date().toISOString();
const id = (p) => `${p}_${crypto.randomUUID()}`;
const b64 = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const randomToken = () => b64(crypto.getRandomValues(new Uint8Array(32)));
const sha256 = async (v) => b64(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(v))));
const passwordHash = async (password, salt) => {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return b64(new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256)));
};
const cookies = (request) => Object.fromEntries((request.headers.get('cookie') || '').split(';').map((x) => x.trim().split('=').map((v) => { try { return decodeURIComponent(v); } catch { return v; } })).filter((x) => x.length === 2));
const SESSION_DAYS = 30;
const freeCookie = (token, maxAge = SESSION_DAYS * 86400) => `osc_free_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
const readBody = async (request) => { try { return await request.json(); } catch { return {}; } };
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const SITE = 'https://oscpaymentacademy.com';
const ROBOTS = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /free/
Allow: /free/x/
Allow: /free/js/
Allow: /free/css/
Allow: /free/assets/
Disallow: /login
Disallow: /reset
Disallow: /expired

Sitemap: ${SITE}/sitemap.xml
`;
const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>
  <url><loc>${SITE}/parser-iso8583</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>
</urlset>
`;

export const FREE_WHATSAPP = '5491132318122';
const waLink = (text) => `https://wa.me/${FREE_WHATSAPP}?text=${encodeURIComponent(text)}`;

// Cupos de la cuenta gratuita (por usuario, de por vida).
const LIMITS = { pos: 1, atm: 1 };

// Páginas de /free/. public = sin login · account = requiere cuenta gratuita.
const PAGES = Object.assign(Object.create(null), {
  'parser': { file: '/free/parser', access: 'public' },
  'registro': { file: '/free/registro', access: 'public' },
  'index': { file: '/free/inicio', access: 'account' },
  'inicio': { file: '/free/inicio', access: 'account' },
  'pos': { file: '/free/pos', access: 'account' },
  'atm': { file: '/free/atm', access: 'account' },
  'parser_guiado': { file: '/free/parser_guiado', access: 'account' },
  'curso': { file: '/free/curso', access: 'account' },
  'curso/slide-02': { file: '/free/curso/slide-02', access: 'account' },
  'curso/slide-03': { file: '/free/curso/slide-03', access: 'account' },
});

// Nombre visible de los módulos que NO forman parte de la versión gratuita.
const LOCKED_LABELS = Object.assign(Object.create(null), {
  constructor: 'Constructor ISO 8583', ecommerce: 'E-Commerce / 3DS', wallet: 'Wallet / Tokenización', ebook: 'eBook ISO 8583',
  evaluacion: 'Evaluaciones', switch: 'Switch del Adquirente', switch_emisor: 'Switch Emisor', compensacion: 'Compensación Visa',
  compensacion_mastercard: 'Compensación Mastercard', mastercard_iso: 'Mastercard ISO', documentacion: 'Documentación Técnica',
  clientes: 'Banco simulado', pasivas: 'Banco simulado', solicitudes: 'Banco simulado', cuenta_cliente: 'Banco simulado',
  monitoreo: 'Monitoreo', testlab: 'TestLab', curso_interactivo: 'Curso Interactivo completo',
});

let schemaReady = false;
async function ensureFreeSchema(env) {
  if (schemaReady) return;
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS free_users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, full_name TEXT NOT NULL, company TEXT, job_role TEXT, country TEXT, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING', verify_token_hash TEXT, verify_expires_at TEXT, created_at TEXT NOT NULL, verified_at TEXT, last_login_at TEXT)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS free_sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS free_usage (user_id TEXT NOT NULL, module TEXT NOT NULL, used INTEGER NOT NULL DEFAULT 0, first_at TEXT, last_at TEXT, PRIMARY KEY (user_id, module))`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_free_sessions_user ON free_sessions(user_id)`),
  ]);
  schemaReady = true;
}

async function freeUser(request, env) {
  const token = cookies(request).osc_free_session;
  if (!token) return null;
  const row = await env.DB.prepare(`SELECT u.* FROM free_sessions s JOIN free_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.status='ACTIVE'`).bind(await sha256(token), now()).first();
  return row || null;
}

async function createSession(env, userId) {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86400e3).toISOString();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO free_sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').bind(await sha256(token), userId, expires, now()),
    env.DB.prepare('UPDATE free_users SET last_login_at=? WHERE id=?').bind(now(), userId),
  ]);
  return token;
}

async function usageOf(env, userId) {
  const rows = (await env.DB.prepare('SELECT module,used FROM free_usage WHERE user_id=?').bind(userId).all()).results || [];
  const out = {};
  for (const [m, limit] of Object.entries(LIMITS)) {
    const used = Number(rows.find((r) => r.module === m)?.used || 0);
    out[m] = { used, limit, remaining: Math.max(0, limit - used) };
  }
  return out;
}

// El webhook de email es opcional. FREE_VERIFY_WEBHOOK_URL tiene prioridad; si no existe se usa el de reseteo de clave
// con type:"free_verify" para que el flujo de envío pueda distinguir la plantilla.
function emailWebhook(env) {
  if (env.FREE_VERIFY_WEBHOOK_URL) return { url: env.FREE_VERIFY_WEBHOOK_URL, token: env.FREE_VERIFY_WEBHOOK_TOKEN || env.RESET_WEBHOOK_TOKEN || '' };
  if (env.RESET_WEBHOOK_URL) return { url: env.RESET_WEBHOOK_URL, token: env.RESET_WEBHOOK_TOKEN || '' };
  return null;
}
async function sendVerification(env, origin, email, fullName, token) {
  const hook = emailWebhook(env);
  if (!hook) return false;
  const verifyUrl = `${origin}/api/free/verify?token=${encodeURIComponent(token)}`;
  await fetch(hook.url, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${hook.token}` }, body: JSON.stringify({ type: 'free_verify', email, fullName, verifyUrl, resetUrl: verifyUrl, subject: 'Confirmá tu cuenta gratuita · OSC Payment Academy' }) });
  return true;
}

const validEmail = (e) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e);
const clip = (v, n) => String(v ?? '').trim().slice(0, n);

async function api(request, env, path, url) {
  await ensureFreeSchema(env);
  const method = request.method;

  if (path === '/api/free/register' && method === 'POST') {
    const b = await readBody(request);
    const email = clip(b.email, 254).toLowerCase(), fullName = clip(b.fullName, 120), company = clip(b.company, 120), jobRole = clip(b.role, 80), country = clip(b.country, 60), password = String(b.password || '');
    if (!fullName || !validEmail(email) || !company || !jobRole || !country) return json({ error: 'INVALID_DATA', message: 'Completá nombre, email, empresa, rol y país.' }, 400);
    if (password.length < 8) return json({ error: 'WEAK_PASSWORD', message: 'La contraseña debe tener al menos 8 caracteres.' }, 400);
    const existing = await env.DB.prepare('SELECT id,status FROM free_users WHERE email=?').bind(email).first();
    if (existing && existing.status === 'ACTIVE') return json({ error: 'EMAIL_EXISTS', message: 'Ese email ya tiene una cuenta gratuita. Ingresá con tu contraseña.' }, 409);
    const salt = randomToken(), hash = await passwordHash(password, salt), token = randomToken(), ts = now();
    const verifyExpires = new Date(Date.now() + 48 * 3600e3).toISOString();
    const hook = emailWebhook(env);
    const status = hook ? 'PENDING' : 'ACTIVE';
    let userId = existing?.id;
    if (existing) {
      await env.DB.prepare('UPDATE free_users SET full_name=?,company=?,job_role=?,country=?,password_hash=?,password_salt=?,status=?,verify_token_hash=?,verify_expires_at=? WHERE id=?')
        .bind(fullName, company, jobRole, country, hash, salt, status, await sha256(token), verifyExpires, existing.id).run();
    } else {
      userId = id('fu');
      await env.DB.prepare('INSERT INTO free_users(id,email,full_name,company,job_role,country,password_hash,password_salt,status,verify_token_hash,verify_expires_at,created_at,verified_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)')
        .bind(userId, email, fullName, company, jobRole, country, hash, salt, status, await sha256(token), verifyExpires, ts, hook ? null : ts).run();
    }
    if (hook) {
      try { await sendVerification(env, url.origin, email, fullName, token); }
      catch (e) { return json({ error: 'EMAIL_FAILED', message: 'No pudimos enviar el email de confirmación. Probá de nuevo en unos minutos.' }, 502); }
      return json({ ok: true, verificationRequired: true, message: `Te enviamos un email a ${email} para confirmar la cuenta.` });
    }
    // Sin webhook de email configurado: la cuenta queda activa de inmediato.
    const session = await createSession(env, userId);
    return json({ ok: true, verificationRequired: false }, 200, { 'set-cookie': freeCookie(session) });
  }

  if (path === '/api/free/verify' && method === 'GET') {
    const token = String(url.searchParams.get('token') || '');
    const row = token ? await env.DB.prepare('SELECT id FROM free_users WHERE verify_token_hash=? AND verify_expires_at>?').bind(await sha256(token), now()).first() : null;
    if (!row) return Response.redirect(`${url.origin}/free/registro.html?verificacion=invalida`, 302);
    await env.DB.prepare("UPDATE free_users SET status='ACTIVE',verified_at=?,verify_token_hash=NULL,verify_expires_at=NULL WHERE id=?").bind(now(), row.id).run();
    const session = await createSession(env, row.id);
    return new Response(null, { status: 302, headers: { location: `${url.origin}/free/index.html?bienvenido=1`, 'set-cookie': freeCookie(session), 'cache-control': 'no-store' } });
  }

  if (path === '/api/free/resend' && method === 'POST') {
    const b = await readBody(request), email = clip(b.email, 254).toLowerCase();
    const row = await env.DB.prepare("SELECT id,full_name FROM free_users WHERE email=? AND status='PENDING'").bind(email).first();
    if (row && emailWebhook(env)) {
      const token = randomToken();
      await env.DB.prepare('UPDATE free_users SET verify_token_hash=?,verify_expires_at=? WHERE id=?').bind(await sha256(token), new Date(Date.now() + 48 * 3600e3).toISOString(), row.id).run();
      try { await sendVerification(env, url.origin, email, row.full_name, token); } catch (_) {}
    }
    return json({ ok: true, message: 'Si el email tiene una cuenta pendiente, te reenviamos la confirmación.' });
  }

  if (path === '/api/free/login' && method === 'POST') {
    const b = await readBody(request), email = clip(b.email, 254).toLowerCase(), password = String(b.password || '');
    const row = await env.DB.prepare('SELECT * FROM free_users WHERE email=?').bind(email).first();
    if (!row || (await passwordHash(password, row.password_salt)) !== row.password_hash) return json({ error: 'INVALID_LOGIN', message: 'Email o contraseña incorrectos.' }, 401);
    if (row.status !== 'ACTIVE') return json({ error: 'EMAIL_NOT_VERIFIED', message: 'Todavía no confirmaste tu email. Revisá tu bandeja de entrada (y spam).' }, 403);
    const session = await createSession(env, row.id);
    return json({ ok: true }, 200, { 'set-cookie': freeCookie(session) });
  }

  if (path === '/api/free/logout' && method === 'POST') {
    const token = cookies(request).osc_free_session;
    if (token) await env.DB.prepare('DELETE FROM free_sessions WHERE token_hash=?').bind(await sha256(token)).run();
    return json({ ok: true }, 200, { 'set-cookie': freeCookie('', 0) });
  }

  if (path === '/api/free/me' && method === 'GET') {
    const user = await freeUser(request, env);
    if (!user) return json({ error: 'NO_SESSION' }, 401);
    return json({ ok: true, user: { email: user.email, fullName: user.full_name, company: user.company }, usage: await usageOf(env, user.id), whatsapp: FREE_WHATSAPP });
  }

  if (path === '/api/free/consume' && method === 'POST') {
    const user = await freeUser(request, env);
    if (!user) return json({ error: 'NO_SESSION', message: 'Ingresá con tu cuenta gratuita.' }, 401);
    const b = await readBody(request), module = String(b.module || '');
    if (!Object.prototype.hasOwnProperty.call(LIMITS, module)) return json({ error: 'BAD_MODULE' }, 400);
    const ts = now();
    // Atómico: inserta la primera vez o incrementa solo si todavía hay cupo.
    const r = await env.DB.prepare(`INSERT INTO free_usage(user_id,module,used,first_at,last_at) VALUES(?,?,1,?,?)
      ON CONFLICT(user_id,module) DO UPDATE SET used=used+1,last_at=excluded.last_at WHERE free_usage.used<?`).bind(user.id, module, ts, ts, LIMITS[module]).run();
    if (!r.meta?.changes) return json({ error: 'FREE_LIMIT', message: 'Ya usaste la operación de prueba incluida en la cuenta gratuita.', usage: await usageOf(env, user.id) }, 403);
    return json({ ok: true, usage: await usageOf(env, user.id) });
  }

  return json({ error: 'NOT_FOUND' }, 404);
}

function lockedPage(label, origin) {
  const wa = waLink(`Hola Oscar, estoy usando la cuenta gratuita de OSC Payment Academy y quiero una demo de ${label} para mi empresa.`);
  return new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(label)} · OSC Payment Academy</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#06111d;color:#f5f8fc;font-family:Inter,Segoe UI,Arial,sans-serif}.c{max-width:520px;margin:20px;background:#0b1827;border:1px solid #173149;border-radius:16px;padding:32px;text-align:center}.i{font-size:44px}h1{font-size:1.35rem;margin:10px 0}p{color:#9dafc2;line-height:1.6}a{display:inline-block;margin:8px 6px 0;padding:11px 18px;border-radius:9px;text-decoration:none;font-weight:700}.wa{background:#18b65a;color:#fff}.bk{border:1px solid #2a5a86;color:#cfe3f7}</style></head>
<body><div class="c"><div class="i">🔒</div><h1>${esc(label)}</h1><p>Este módulo no está incluido en la cuenta gratuita. Forma parte de la plataforma completa de OSC Payment Academy.</p>
<a class="wa" href="${esc(wa)}" target="_blank" rel="noopener">💬 Solicitar demo por WhatsApp</a><a class="bk" href="/free/index.html">← Volver</a></div></body></html>`, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
}

export async function handleFree(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  // rc.1.60 · SEO: dirección pública del Parser gratuito, robots.txt y sitemap.xml.
  if (path === '/parser-iso8583' || path === '/parser-iso8583/') {
    const res = await env.ASSETS.fetch(new Request(new URL('/free/parser', url.origin), request));
    const headers = new Headers(res.headers);
    headers.set('cache-control', 'public, max-age=300');
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  }
  if (path === '/robots.txt') return new Response(ROBOTS, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
  if (path === '/sitemap.xml') return new Response(SITEMAP, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
  if (path.startsWith('/api/free/')) {
    try { return await api(request, env, path, url); }
    catch (e) { console.error('free api', e); return json({ error: 'SERVER_ERROR', message: 'Error interno.' }, 500); }
  }
  if (path === '/free' || path === '/free/') return Response.redirect(`${url.origin}/free/index.html`, 302);

  // Archivos propios de la versión gratuita.
  if (path.startsWith('/free/x/')) return env.ASSETS.fetch(request);

  let rel = path.slice('/free/'.length).replace(/\/+$/, '');
  const ext = (rel.match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase();

  // Recursos compartidos (js, css, imágenes, etc.): se sirven desde la ruta original de la plataforma.
  // Solo lectura de archivos públicos (los mismos que hoy son públicos por extensión).
  if (ext && ext !== 'html') {
    if (!/^(css|js|png|jpg|jpeg|svg|webp|ico|woff2|gif)$/.test(ext)) return new Response('Not found', { status: 404 });
    return env.ASSETS.fetch(new Request(new URL('/' + rel + url.search, url.origin), request));
  }

  const key = rel.replace(/\.html$/i, '') || 'index';
  const page = PAGES[key];
  if (!page) {
    const base = key.split('/').pop();
    const label = LOCKED_LABELS[base] || (key.startsWith('curso/') ? 'Curso Interactivo completo' : 'Módulo de la plataforma');
    return lockedPage(label, url.origin);
  }
  if (page.access === 'account') {
    await ensureFreeSchema(env);
    const user = await freeUser(request, env);
    if (!user) return Response.redirect(`${url.origin}/free/registro.html?next=${encodeURIComponent(path + url.search)}`, 302);
  }
  const res = await env.ASSETS.fetch(new Request(new URL(page.file, url.origin), request));
  const headers = new Headers(res.headers);
  headers.set('cache-control', 'no-store');
  if (page.access === 'account') headers.set('x-robots-tag', 'noindex');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
