/* OSC Payment Academy v4.0.0-rc.1.49 · TestLab · núcleo (OSCTestLab)
   Pruebas contra el ambiente de DESARROLLO del banco: la plataforma arma la trama, el Agente la envía a la IP/puerto
   del perfil, la respuesta del banco se interpreta y se valida campo por campo.
   - Capas: adaptador de red (arma / codifica / decodifica) → agente (transporte) → validador común → resultado.
   - Esta versión trae el adaptador de la Red LINK (Host to Host, BASE24). Visa / Mastercard / Amex se suman como
     adaptadores nuevos sin tocar el validador ni las pantallas.
   - Nunca se usa la respuesta simulada: en el TestLab la respuesta es siempre la del banco.
   - Evidencia enmascarada: PAN 6+4, vencimiento y PIN block nunca se guardan ni se muestran completos. */
(() => {
  const RULES_VERSION = 'TL-1.0';
  const DISCLAIMER = (manual) => `Resultado de pruebas en ambiente de desarrollo según las reglas de OSC TestLab (versión de reglas ${RULES_VERSION}, manual de referencia: ${manual}). No reemplaza ni anticipa la certificación de la red.`;
  const VERDICT_TEXT = { APROBADA: 'Aprobada', FALLIDA: 'Fallida', ERROR_COMUNICACION: 'Error de comunicación' };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  // ---------------- Contexto (tenant, usuario, perfil, tarjetas) ----------------
  let CTX = null, CTX_P = null;
  async function context(force) {
    if (CTX && !force) return CTX;
    if (!CTX_P || force) {
      CTX_P = fetch('/api/testlab/context', { credentials: 'same-origin', cache: 'no-store' })
        .then(async (r) => (r.ok ? r.json() : { error: (await r.json().catch(() => ({}))).error || 'HTTP_' + r.status }))
        .catch(() => ({ error: 'NETWORK' }));
    }
    const d = await CTX_P;
    CTX = d && !d.error ? d : null;
    return CTX || d;
  }
  // Claves locales con tenant y usuario: una PC compartida no mezcla configuraciones.
  const lsKey = (name) => (CTX ? `osc_testlab_${name}:${CTX.tenant.id}:${CTX.user.id}` : null);
  function local(name, def, store = localStorage) { try { const k = lsKey(name); if (!k) return def; const v = store.getItem(k); return v == null ? def : JSON.parse(v); } catch (_) { return def; } }
  function setLocal(name, val, store = localStorage) { try { const k = lsKey(name); if (k) store.setItem(k, JSON.stringify(val)); } catch (_) {} }
  // URL del agente: es de cada usuario (corre en su PC, dentro de la red del banco).
  const agentUrl = () => String(local('agent', 'http://localhost:8082') || 'http://localhost:8082').replace(/\/$/, '');
  const setAgentUrl = (u) => setLocal('agent', String(u || '').trim().replace(/\/$/, '') || 'http://localhost:8082');
  // Estado del Modo Laboratorio en POS / ATM: encendido solo durante la sesión del navegador.
  function labState() { return { on: false, network: 'link', cardId: '', version: '', expected: '00', ...local('lab', {}, sessionStorage), ...pick(local('labprefs', {}), ['cardId', 'version', 'expected']) }; }
  function setLabState(patch) {
    const cur = labState(), next = { ...cur, ...patch };
    setLocal('lab', { on: !!next.on, network: next.network }, sessionStorage);
    setLocal('labprefs', { cardId: next.cardId, version: next.version, expected: next.expected });
    window.dispatchEvent(new CustomEvent('osc-testlab-state', { detail: next }));
    return next;
  }
  function pick(o, keys) { const r = {}; keys.forEach((k) => { if (o && o[k] !== undefined && o[k] !== '') r[k] = o[k]; }); return r; }
  const labOn = (network) => { const s = labState(); return !!(CTX && s.on && (!network || s.network === network)); };

  async function cardSecret(cardId) {
    const r = await fetch('/api/testlab/cards/' + encodeURIComponent(cardId) + '/secret', { credentials: 'same-origin', cache: 'no-store' });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.message || 'No se pudo leer la tarjeta de prueba.');
    return d;
  }

  // ---------------- Enmascarado ----------------
  const maskPan = (p) => { p = String(p || ''); return p.length < 10 ? '*'.repeat(p.length) : p.slice(0, 6) + '*'.repeat(p.length - 10) + p.slice(-4); };
  function maskText(text, card) {
    let v = String(text ?? '');
    if (!card) return v;
    if (card.pan && String(card.pan).length >= 10) {
      const m = maskPan(card.pan);
      v = v.split(String(card.pan)).join(m);
      // Track 2: vencimiento + service code después del separador.
      v = v.split(m + '=').map((part, i) => (i === 0 ? part : part.replace(/^\d{7}/, '*******'))).join(m + '=');
    }
    if (card.pinBlock && !/^F{16}$/i.test(card.pinBlock)) v = v.split(String(card.pinBlock)).join('*'.repeat(16));
    if (card.pinOffset) v = v.split(String(card.pinOffset)).join('*'.repeat(String(card.pinOffset).length));
    return v;
  }
  function maskMessage(msg, card) {
    if (!msg) return msg;
    return { ...msg, raw: maskText(msg.raw, card), fields: (msg.fields || []).map((f) => ({ ...f, value: maskText(f.value, card) })) };
  }

  // ---------------- Adaptador LINK (Host to Host · BASE24) ----------------
  // Manual de referencia de las reglas: C-X-4-03 Mensaje 0210 Input (respuesta del host a LINK).
  const LINK_REQ_FIELDS_0210 = [3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 39, 41, 42, 44, 49, 54, 60, 61, 100, 102, 103, 122, 123, 124, 125, 127];
  const LINK_KEY_ECHO = [3, 4, 7, 11, 37, 41];
  const LINK_SOFT_ECHO = [12, 13, 15, 17, 32, 35, 42, 49, 100, 102, 103];
  const LINK_FICHA = {
    3: 'C-X-4-03 · Campo 3: ver tabla de códigos (C-X-5).',
    4: 'C-X-4-03 · Campo 4: 9(12).', 7: 'C-X-4-03 · Campo 7: mmddhhmmss 9(10).', 11: 'C-X-4-03 · Campo 11: 9(6).',
    12: 'C-X-4-03 · Campo 12: hhmmss 9(6).', 13: 'C-X-4-03 · Campo 13: 9(4).', 15: 'C-X-4-03 · Campo 15: mmdd 9(4).', 17: 'C-X-4-03 · Campo 17: mmdd 9(4).',
    32: 'C-X-4-03 · Campo 32: indicador de longitud "11" + valor (11).', 35: 'C-X-4-03 · Campo 35: indicador de longitud "37" + valor (37).',
    37: 'C-X-4-03 · Campo 37: X(12).', 39: 'C-X-4-03 · Campo 39: ver tabla de códigos de resultado (C-X-6).', 41: 'C-X-4-03 · Campo 41: X(16).', 42: 'C-X-4-03 · Campo 42: X(15).',
    44: 'C-X-4-03 · Campo 44: longitud "25" + "2" + saldo de apertura 9(10)v99 + saldo disponible 9(10)v99.',
    49: 'C-X-4-03 · Campo 49: 032 pesos · 076 reales · 840 dólares · 858 pesos uruguayos.',
    54: 'C-X-4-03 · Campo 54: según el código de movimiento (general: longitud "100").', 55: 'C-X-4-03 · Campo 55: en transacciones interbancarias.',
    60: 'C-X-4-03 · Campo 60: longitud "012" + institución dueña del ATM (4) + red (4) + diferencia horaria "+000".',
    61: 'C-X-4-03 · Campo 61: longitud "013" + institución emisora (4) + red "PRO1" + tipos de cuenta (4) + "P".',
    100: 'C-X-4-03 · Campo 100: longitud "11" + valor alineado a izquierda con blancos.', 102: 'C-X-4-03 · Campo 102: longitud "28" + cuenta alineada a izquierda con blancos.',
    103: 'C-X-4-03 · Campo 103: longitud "28" + cuenta alineada a izquierda con blancos.', 122: 'C-X-4-03 · Campo 122: longitud "011" + valor alineado a izquierda con blancos.',
    123: 'C-X-4-03 · Campo 123: longitud "012" + valor 9(10)v99.', 124: 'C-X-4-03 · Campo 124: longitud "001" + "0" (cero) o blanco.',
    125: 'C-X-4-03 · Campo 125: longitud "001" + blanco, 0, 1 o 2; o la información del ticket / últimos movimientos.',
    127: 'C-X-4-03 · Campo 127: longitud "043" + tipo de cambio aplicado y cotizaciones (excepto asignación de usuario Home Banking).',
    header: 'C-X-4-03 · BASE24-HEADER: respuesta a requerimiento originado en ATM = 014000015; originado en HOST = 014000055.',
    mti: 'C-X-4-03 · MESSAGE-TYPE-IDENTIFIER: el valor a informar es 0210.',
    bitmap: 'C-X-4-03 · Bitmap primario: 1, 3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 39, 41, 42, 44, 49, 54, 60, 61 (+55 interbancarias) · Secundario: 100, 102, 103, 122, 123, 124, 125, 127.'
  };
  const LINK_POS_KINDS = ['purchase', 'void', 'pos_balance', 'refund', 'refund_void', 'cashback', 'cashback_void', 'preauth', 'preauth_complete'];
  const LINK_MULTI_LEG = ['transfer', 'debin']; // varios mensajes por operación: fuera del alcance de esta versión

  const LinkAdapter = {
    network: 'link', label: 'Red LINK', manual: 'LINK Host to Host · C-X-4-03 Mensaje 0210 Input',
    ready: () => !!window.OSCLinkHth,
    kinds(terminal) {
      const T = window.OSCLinkHth; if (!T) return [];
      const all = ['withdrawal', 'balance', ...Object.keys(T.OPS)].filter((k, i, a) => a.indexOf(k) === i && !LINK_MULTI_LEG.includes(k));
      return terminal === 'POS' ? all.filter((k) => LINK_POS_KINDS.includes(k)) : all.filter((k) => !LINK_POS_KINDS.includes(k));
    },
    label4: (k) => window.OSCLinkHth?.TX[k]?.label || k,
    supports: (kind) => !LINK_MULTI_LEG.includes(kind),
    // Arma la 0200 con la tarjeta y los parámetros del perfil (no con los valores de práctica). No toca saldos simulados.
    build(kind, ctx, profile, card) {
      const T = window.OSCLinkHth, L = T.LINK;
      const inst = profile?.networks?.link?.inst || {};
      const keys = ['issuerFiid', 'atmFiid', 'atmOwnerName', 'posAcquirerFiid', 'acquirerId', 'receivingId', 'network', 'serviceCode', 'pinOffset', 'locality', 'province', 'country'];
      const saved = {}; keys.forEach((k) => { saved[k] = L[k]; });
      const savedAccounts = JSON.stringify(L.accounts);
      const BAL = 'oscLinkBalances.v1'; let bal = null; try { bal = localStorage.getItem(BAL); } catch (_) {}
      try {
        keys.forEach((k) => { if (inst[k]) L[k] = String(inst[k]); });
        if (card.serviceCode) L.serviceCode = card.serviceCode;
        if (card.pinOffset) L.pinOffset = String(card.pinOffset).padEnd(16, 'F').slice(0, 16);
        Object.entries(card.accounts || {}).forEach(([t, n]) => { if (L.accounts[t]) L.accounts[t] = { ...L.accounts[t], number: String(n) }; });
        const c = { ...ctx, pan: card.pan, expiry: card.expiry, pinBlock: card.pinBlock || 'FFFFFFFFFFFFFFFF', scenario: '00', after: 'none', pinOk: true };
        if (c.terminal === 'ATM' && inst.termAtm) c.termId = inst.termAtm;
        if (c.terminal === 'POS' && inst.termPos) c.termId = inst.termPos;
        if (c.terminal === 'POS' && inst.merchantName) c.merchantName = inst.merchantName;
        return T.build(kind, c);
      } finally {
        keys.forEach((k) => { L[k] = saved[k]; });
        L.accounts = JSON.parse(savedAccounts);
        try { if (bal == null) localStorage.removeItem(BAL); else localStorage.setItem(BAL, bal); } catch (_) {}
      }
    },
    request(out) {
      const reqs = (out.messages || []).filter((m) => m.direction === 'SALIENTE' && /00$/.test(m.mti));
      return reqs.length === 1 ? reqs[0] : null;
    },
    payload: (req) => ({ trama: req.raw }),
    // Respuesta del banco → mensaje con el mismo formato que usan POS / ATM (valores con su indicador de longitud).
    decode(raw) {
      const T = window.OSCLinkHth, p = T.parse(String(raw || ''));
      const fields = (p.fields || []).map((f) => ({ de: f.num, name: f.name, value: (f.prefixDisplay && f.prefixDisplay !== '—' ? f.prefixDisplay : '') + f.value, attr: f.fmt, ref: 'Respuesta del banco (ambiente de desarrollo)' }));
      const code = ((p.fields || []).find((f) => f.num === 39)?.value || '').trim();
      return {
        parsed: p,
        message: { mti: p.mti || '', header: p.linkHeader || '', label: `${p.mti || '????'} · RESPUESTA DEL BANCO (desarrollo)`, leg: 'Respuesta del banco', direction: 'ENTRANTE', responseCode: code, bitmap: (p.primaryHex || '') + (p.secondaryHex || ''), primaryBitmap: p.primaryHex || '', fields, raw: String(raw || ''), network: 'link', lab: true }
      };
    },
    codeText: (c) => window.OSCLinkHth?.RESULT[c] || '',
    // ---- Reglas (validador común) ----
    rules({ req, reqParsed, res, terminal, kind, expectedCode }) {
      const checks = [];
      const add = (grupo, de, nombre, regla, esperado, recibido, ok, sev = 'bloqueante', ficha = '') => checks.push({ grupo, de, nombre, regla, esperado: String(esperado ?? ''), recibido: String(recibido ?? ''), ok: !!ok, sev, ficha });
      const p = res.parsed;
      (p.errors || []).forEach((e) => add('Estructura', null, 'Lectura de la trama', 'La trama tiene que poder leerse completa según el formato LINK', 'sin errores', e, false, 'bloqueante', LINK_FICHA.bitmap));
      (p.warnings || []).forEach((w) => add('Estructura', null, 'Lectura de la trama', 'Sin datos sobrantes ni encabezados faltantes', 'sin observaciones', w, false, 'advertencia'));
      const hdr = terminal === 'ATM' ? '014000015' : '014000055';
      add('Estructura', null, 'Header BASE24', 'Header de respuesta según el origen del requerimiento', hdr, p.linkHeader || '(ausente)', p.linkHeader === hdr, 'bloqueante', LINK_FICHA.header);
      add('Estructura', null, 'MTI', 'Respuesta a la 0200', '0210', p.mti || '(ausente)', p.mti === '0210', 'bloqueante', LINK_FICHA.mti);
      const M = {}; (p.fields || []).forEach((f) => { M[f.num] = f; });
      const R = {}; (reqParsed.fields || []).forEach((f) => { R[f.num] = f; });
      const RES_NAMES = { 44: 'Saldos (apertura y disponible)', 54: 'Montos adicionales', 55: 'Datos interbancarios', 122: 'Institución emisora', 123: 'Monto de depósito', 124: 'Tipo de depositorio', 125: 'Indicador / ticket', 126: 'Datos adicionales', 127: 'Tipos de cambio' };
      const name = (n) => { const x = (p.fields || []).find((f) => f.num === n)?.name || (reqParsed.fields || []).find((f) => f.num === n)?.name; return x && !/^Campo \d+$/.test(x) ? x : RES_NAMES[n] || 'Campo ' + n; };
      // Presencia (bitmap del manual)
      LINK_REQ_FIELDS_0210.forEach((n) => add('Presencia', n, name(n), 'Campo obligatorio en la 0210', 'presente', M[n] ? 'presente' : 'ausente', !!M[n], 'bloqueante', LINK_FICHA[n] || LINK_FICHA.bitmap));
      if (R[55]) add('Presencia', 55, name(55), 'En interbancarias la 0210 agrega el campo 55', 'presente', M[55] ? 'presente' : 'ausente', !!M[55], 'advertencia', LINK_FICHA[55]);
      Object.keys(M).map(Number).filter((n) => n !== 1 && n !== 55 && n !== 126 && !LINK_REQ_FIELDS_0210.includes(n))
        .forEach((n) => add('Presencia', n, name(n), 'Campo no previsto en la 0210', 'ausente', 'presente', false, 'advertencia', LINK_FICHA.bitmap));
      // Coherencia con la solicitud (clave de la transacción)
      const eq = (n, sev) => { if (!R[n] || !M[n]) return; add('Coherencia', n, name(n), 'Igual al valor enviado en la 0200', R[n].value, M[n].value, R[n].value === M[n].value, sev, LINK_FICHA[n] || ''); };
      LINK_KEY_ECHO.forEach((n) => eq(n, 'bloqueante'));
      LINK_SOFT_ECHO.forEach((n) => eq(n, 'advertencia'));
      // Formato (C-X-4-03)
      const fmt = (n, ok, esperado, sev = 'bloqueante') => { if (!M[n]) return; const f = M[n]; const rec = (f.prefixDisplay && f.prefixDisplay !== '—' ? f.prefixDisplay + ' + ' : '') + JSON.stringify(f.value); add('Formato', n, name(n), 'Formato del manual', esperado, rec, ok(f), sev, LINK_FICHA[n] || ''); };
      const dig = (len) => (f) => new RegExp('^\\d{' + len + '}$').test(f.value);
      fmt(4, dig(12), '9(12)'); fmt(7, dig(10), '9(10)'); fmt(11, dig(6), '9(6)'); fmt(12, dig(6), '9(6)'); fmt(13, dig(4), '9(4)'); fmt(15, dig(4), '9(4)'); fmt(17, dig(4), '9(4)');
      fmt(32, (f) => f.prefixDisplay === '11', 'longitud 11');
      fmt(35, (f) => f.prefixDisplay === '37', 'longitud 37');
      fmt(37, (f) => f.value.length === 12, 'X(12)'); fmt(41, (f) => f.value.length === 16, 'X(16)'); fmt(42, (f) => f.value.length === 15, 'X(15)');
      fmt(39, (f) => f.value.length === 2, 'X(2)');
      fmt(44, (f) => f.prefixDisplay === '25' && f.value[0] === '2' && /^\d{24}$/.test(f.value.slice(1)), 'longitud 25 · "2" + 2 saldos 9(10)v99');
      fmt(49, (f) => ['032', '076', '840', '858'].includes(f.value), '032 / 076 / 840 / 858');
      fmt(54, (f) => /^\d{3}$/.test(f.prefixDisplay), 'LLLVAR (longitud numérica de 3)');
      if (M[54] && !['service_inquiry', 'service_pay', 'service_codes', 'service_last', 'service_pending', 'service_unlink', 'service_quick', 'service_cash', 'card_payment_pas', 'pas_inquiry', 'pf_rates', 'pf_invest', 'pf_balance', 'pf_account', 'pf_renewal'].includes(kind)) fmt(54, (f) => f.prefixDisplay === '100', 'longitud 100 (formato general)', 'advertencia');
      fmt(60, (f) => f.prefixDisplay === '012', 'longitud 012');
      fmt(60, (f) => f.value.slice(8, 12) === '+000', 'diferencia horaria "+000"', 'advertencia');
      fmt(61, (f) => f.prefixDisplay === '013' && f.value.slice(4, 8) === 'PRO1' && f.value.slice(12, 13) === 'P', 'longitud 013 · red PRO1 · "P" final');
      fmt(100, (f) => f.prefixDisplay === '11', 'longitud 11');
      fmt(102, (f) => f.prefixDisplay === '28', 'longitud 28'); fmt(103, (f) => f.prefixDisplay === '28', 'longitud 28');
      fmt(122, (f) => f.prefixDisplay === '011', 'longitud 011');
      fmt(123, (f) => f.prefixDisplay === '012' && /^\d{12}$/.test(f.value), 'longitud 012 · 9(10)v99');
      fmt(124, (f) => f.prefixDisplay === '001' && ['0', ' '].includes(f.value), 'longitud 001 · "0" o blanco');
      fmt(125, (f) => f.prefixDisplay !== '001' || [' ', '0', '1', '2'].includes(f.value), 'longitud 001 · blanco, 0, 1 o 2 (o ticket)');
      if (kind !== 'homebanking') fmt(127, (f) => f.prefixDisplay === '043', 'longitud 043');
      // Negocio
      const code = (M[39]?.value || '').trim();
      add('Negocio', 39, name(39), 'Código de resultado esperado para este escenario', expectedCode, code ? `${code}${LinkAdapter.codeText(code) ? ' · ' + LinkAdapter.codeText(code) : ''}` : '(ausente)', code === expectedCode, 'bloqueante', LINK_FICHA[39]);
      return { checks, code };
    }
  };
  const ADAPTERS = { link: LinkAdapter };

  // ---------------- Validador común ----------------
  function summarize(checks, commError) {
    if (commError) return { verdict: 'ERROR_COMUNICACION', conformity: null, blocking: 0, warnings: 0 };
    const evaluated = checks.filter((c) => c.sev !== 'info');
    const ok = evaluated.filter((c) => c.ok).length;
    const blocking = checks.filter((c) => c.sev === 'bloqueante' && !c.ok).length;
    const warnings = checks.filter((c) => c.sev === 'advertencia' && !c.ok).length;
    return { verdict: blocking ? 'FALLIDA' : 'APROBADA', conformity: evaluated.length ? Math.round((ok / evaluated.length) * 100) : null, blocking, warnings };
  }

  // ---------------- Envío por el agente ----------------
  async function send(network, payload, profile) {
    const n = profile?.networks?.[network] || {};
    if (!n.host || !n.port) return { ok: false, error: 'El perfil del ambiente no tiene IP y puerto para esta red. Pedile al administrador del TestLab que los cargue.' };
    const t0 = Date.now();
    try {
      const r = await fetch(agentUrl() + '/api/qa/enviar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: n.host, puerto: Number(n.port), ...payload, framing: n.framing || 'none', timeout_ms: Number(n.timeout || 8000), ambiente: 'DESARROLLO', red: network, tenant: CTX?.tenant?.id })
      });
      const d = await r.json().catch(() => ({}));
      if (!d.ok || !d.respuesta) return { ok: false, error: d.error || 'El banco no respondió (sin respuesta del host).', ms: d.ms || Date.now() - t0 };
      return { ok: true, respuesta: d.respuesta, ms: d.ms || Date.now() - t0 };
    } catch (e) {
      return { ok: false, error: `No se pudo hablar con el agente (${agentUrl()}). Verificá que esté corriendo en tu PC.`, ms: Date.now() - t0 };
    }
  }
  async function pingAgent() {
    try { const r = await fetch(agentUrl() + '/api/qa/ping', { cache: 'no-store' }); const d = await r.json(); return { ok: !!d.ok, version: d.version || '' }; } catch (_) { return { ok: false }; }
  }

  // ---------------- Ejecución de una prueba ----------------
  // opts: { network, kind, terminal, ctx (datos de la operación), cardId, version, expectedCode, scenario }
  async function run(opts) {
    const c = await context();
    if (!CTX) throw new Error('TestLab no está habilitado para tu usuario.');
    const network = opts.network || 'link', A = ADAPTERS[network];
    if (!A) throw new Error('Esta versión del TestLab trabaja con la Red LINK.');
    if (!A.ready()) throw new Error('Falta el módulo de mensajería de ' + network.toUpperCase() + '.');
    if (!A.supports(opts.kind)) throw new Error('Esta operación usa varios mensajes y todavía no está disponible en el TestLab.');
    const version = String(opts.version || '').trim(); if (!version) throw new Error('Indicá la versión del desarrollo que estás probando.');
    if (!opts.cardId) throw new Error('Elegí una tarjeta de prueba del banco.');
    const card = await cardSecret(opts.cardId);
    const expectedCode = String(opts.expectedCode || '00').trim();
    const out = A.build(opts.kind, { terminal: opts.terminal, ...(opts.ctx || {}) }, c.profile, card);
    const req = A.request(out);
    if (!req) throw new Error('Esta operación no genera una única solicitud 0200: todavía no está disponible en el TestLab.');
    const sent = await send(network, A.payload(req), c.profile);
    let res = null, checks = [], code = '';
    if (sent.ok) {
      res = A.decode(sent.respuesta);
      const reqParsed = window.OSCLinkHth.parse(req.raw);
      ({ checks, code } = A.rules({ req, reqParsed, res, terminal: opts.terminal, kind: opts.kind, expectedCode }));
    } else {
      checks = [{ grupo: 'Comunicación', de: null, nombre: 'Respuesta del banco', regla: 'El ambiente de desarrollo tiene que responder dentro del tiempo configurado', esperado: 'respuesta', recibido: sent.error, ok: false, sev: 'bloqueante', ficha: 'Error de comunicación: no hay respuesta para evaluar campos.' }];
    }
    const sum = summarize(checks, !sent.ok);
    const record = {
      network, channel: opts.terminal, kind: opts.kind, scenario: opts.scenario || A.label4(opts.kind), devVersion: version,
      expectedCode, receivedCode: code, verdict: sum.verdict, conformity: sum.conformity, ms: sent.ms || 0, manualRef: A.manual, cardAlias: card.alias,
      request: maskText(req.raw, card), response: res ? maskText(res.message.raw, card) : '',
      checks: checks.map((x) => ({ ...x, esperado: maskText(x.esperado, card), recibido: maskText(x.recibido, card) }))
    };
    let saved = null;
    try {
      const r = await fetch('/api/testlab/runs', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(record) });
      saved = await r.json().catch(() => null);
      if (!r.ok) saved = { error: saved?.message || 'No se pudo guardar el resultado.' };
    } catch (_) { saved = { error: 'No se pudo guardar el resultado.' }; }
    // Salida compatible con los simuladores (POS / ATM): solicitud y respuesta enmascaradas, sin respuesta simulada.
    const maskedReq = maskMessage(req, card);
    const resMsg = res ? maskMessage(res.message, card) : null;
    const de44 = res?.parsed?.fields?.find((f) => f.num === 44)?.value || '';
    const labOut = {
      ...out, ctx: { ...out.ctx, pan: maskPan(card.pan) }, messages: resMsg ? [maskedReq, resMsg] : [maskedReq],
      code: sent.ok ? code || '--' : 'ER', resultText: sent.ok ? (A.codeText(code) || (code === '00' ? 'APROBADA' : 'RECHAZADA')) : 'SIN RESPUESTA DEL BANCO',
      summary: sent.ok ? `TestLab · ${VERDICT_TEXT[sum.verdict]} · conformidad ${sum.conformity ?? '—'}%` : 'TestLab · ' + sent.error,
      balanceCents: /^2\d{24}$/.test(de44) ? Number(de44.slice(13, 25)) : 0, auth: '', reversal: null, timeout: false, saf: null, statement: [], ticket: null,
      lab: { ...sum, runId: saved?.id || null, saveError: saved?.error || null, commError: sent.ok ? null : sent.error, version, expectedCode, cardAlias: card.alias, network }
    };
    return { out: labOut, record: { ...record, id: saved?.id || null }, summary: sum };
  }

  // ---------------- Reporte ----------------
  function reportText(r) {
    const L = [];
    L.push('OSC TESTLAB — REPORTE DE PRUEBA');
    L.push('AMBIENTE: DESARROLLO');
    L.push('='.repeat(64));
    L.push(`Empresa        : ${CTX?.tenant?.name || ''}`);
    L.push(`Usuario        : ${CTX?.user?.name || ''}`);
    L.push(`Fecha          : ${new Date(r.created_at || Date.now()).toLocaleString('es-AR')}`);
    L.push(`Red            : ${String(r.network || '').toUpperCase()}   Canal: ${r.channel || ''}`);
    L.push(`Operación      : ${r.scenario || r.kind || ''}`);
    L.push(`Versión desarr.: ${r.dev_version || r.devVersion || ''}`);
    L.push(`Tarjeta        : ${r.card_alias || r.cardAlias || ''}`);
    L.push(`Resultado      : ${VERDICT_TEXT[r.verdict] || r.verdict}`);
    L.push(`Conformidad    : ${r.conformity == null ? '—' : r.conformity + '%'}`);
    L.push(`Código esperado: ${r.expected_code ?? r.expectedCode ?? ''}   Recibido: ${r.received_code ?? r.receivedCode ?? ''}`);
    L.push(`Tiempo         : ${r.ms ?? 0} ms`);
    L.push('');
    L.push('VALIDACIÓN CAMPO A CAMPO');
    (r.checks || []).forEach((x) => L.push(`${x.ok ? '[OK]  ' : x.sev === 'bloqueante' ? '[ERR] ' : '[ADV] '} ${x.de ? 'DE' + x.de + ' ' : ''}${x.nombre} · ${x.regla} · esperado: ${x.esperado} · recibido: ${x.recibido}`));
    L.push('');
    L.push('TRAMA ENVIADA (enmascarada)');
    L.push(r.request_masked || r.request || '');
    L.push('');
    L.push('TRAMA RECIBIDA (enmascarada)');
    L.push(r.response_masked || r.response || '(sin respuesta)');
    L.push('');
    L.push(DISCLAIMER(r.manual_ref || r.manualRef || ''));
    return L.join('\n');
  }

  window.OSCTestLab = { RULES_VERSION, DISCLAIMER, VERDICT_TEXT, ADAPTERS, context, labState, setLabState, labOn, agentUrl, setAgentUrl, pingAgent, run, summarize, maskPan, maskText, reportText, esc, get ctx() { return CTX; } };
})();
