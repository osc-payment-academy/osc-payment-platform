/* OSC Academy v4.0.0-rc.1.27 · POS · Pestañas del panel "Data Elements":
   DATA ELEMENTS (tabla) · VISTA TLV (DE 55 decodificado) · EXPLICACIÓN (lectura del mensaje) · VALIDACIONES (checklist del caso de uso).
   El caso de uso se detecta solo (marca, DE 22, producto, cuotas, DE 3 y DE 39) y se compara contra la batería de escenarios
   (claude/bateria_escenarios_v1.json · borrador). "verificado" = revisado contra el manual; "borrador" = falta cruzar con la marca. */
(() => {
  // ---------- Batería de escenarios (subset POS de bateria_escenarios_v1.json) ----------
  const VISA_CHIP = [2, 3, 4, 7, 11, 12, 13, 14, 18, 19, 22, 23, 25, 32, 35, 37, 41, 42, 43, 49, 55, 63];
  const VISA_MAG = [2, 3, 4, 7, 11, 12, 13, 14, 18, 19, 22, 25, 32, 35, 37, 41, 42, 43, 49, 63];
  const VISA_MANUAL = [2, 3, 4, 7, 11, 12, 13, 14, 18, 19, 22, 25, 32, 37, 41, 42, 43, 49, 63];
  const MC_CHIP = [2, 3, 4, 7, 11, 18, 22, 23, 32, 35, 37, 41, 42, 43, 48, 49, 55, 61];
  const MC_MAG = [2, 3, 4, 7, 11, 18, 22, 23, 32, 35, 37, 41, 42, 43, 48, 49, 61];
  const MC_MANUAL = [2, 3, 4, 7, 11, 18, 22, 32, 41, 42, 48, 49, 61];
  const PIN = { 52: 'si CVM = PIN online', 53: 'cuando se envía 52' };
  const VISA_CUOTAS = { ...PIN, 104: 'Usage 2, Dataset 5D', '126.13': '= I' };
  const MC_CUOTAS = { ...PIN, '48.95': 'ARGCTA', '112.001': '20 emisor / 21 comercio + cantidad' };
  const AMEX = (respuesta = 'aprobada', estado = 'borrador', extra = {}) => ({ mti: '1100', de3: null, de22: null, obligatorios: null, condicionales: {}, prohibidos: [], respuesta, estado, nota: 'Bits y Action Codes a completar con Network Specifications Authorization (oct 2023)', ...extra });
  const V = (o) => ({ mti: '0100', de3: '000000', de22: '05', obligatorios: VISA_CHIP, condicionales: PIN, prohibidos: [], respuesta: '00', estado: 'borrador', ...o });
  const M = (o) => ({ mti: '0100', de3: '000000', de22: '05', obligatorios: MC_CHIP, condicionales: PIN, prohibidos: [25], respuesta: '00', estado: 'borrador', ...o });
  const CASES = {
    C01: { nombre: 'Compra crédito chip', objetivo: 'Compra presencial con chip EMV y PIN online, aprobada.', visa: V({ estado: 'verificado' }), mastercard: M({}), amex: AMEX() },
    C02: { nombre: 'Compra débito chip', objetivo: 'Igual que C01 con tarjeta de débito.', visa: V({ mti: null, nota: 'Confirmar MTI 0100 o 0200 en débito' }), mastercard: M({ mti: null, obligatorios: null, nota: 'Débito sigue el MDS (2003): campos a validar' }), amex: AMEX() },
    C03: { nombre: 'Compra contactless', objetivo: 'Compra sin contacto; PIN solo si supera el límite.', visa: V({ de22: '07' }), mastercard: M({ de22: '07' }), amex: AMEX() },
    C04: { nombre: 'Compra con banda', objetivo: 'Lectura de banda magnética con pista completa.', visa: V({ de22: '90', obligatorios: VISA_MAG, estado: 'verificado', nota: 'DE22 = 90 pista completa (rc.1.22)' }), mastercard: M({ de22: '90', obligatorios: MC_MAG }), amex: AMEX() },
    C05: { nombre: 'Compra manual', objetivo: 'PAN y vencimiento digitados.', visa: V({ de22: '01', obligatorios: VISA_MANUAL, condicionales: {} }), mastercard: M({ de22: '01', obligatorios: MC_MANUAL, condicionales: {} }), amex: AMEX() },
    C06: { nombre: 'Compra en cuotas sin interés', objetivo: 'Cuotas financiadas por el comercio.', visa: V({ obligatorios: [...VISA_CHIP, 104], condicionales: VISA_CUOTAS, estado: 'verificado' }), mastercard: M({ obligatorios: [...MC_CHIP, 112], condicionales: MC_CUOTAS, estado: 'verificado' }), amex: AMEX('aprobada', 'borrador', { bit48: 'DPP · plan del comercio DP03' }) },
    C07: { nombre: 'Compra en cuotas con interés', objetivo: 'Cuotas financiadas por el emisor.', visa: V({ obligatorios: [...VISA_CHIP, 104], condicionales: VISA_CUOTAS, estado: 'verificado' }), mastercard: M({ obligatorios: [...MC_CHIP, 112], condicionales: MC_CUOTAS, estado: 'verificado' }), amex: AMEX('aprobada', 'borrador', { bit48: 'DPP · plan del emisor DP05 en dos pasos (función 108 → 100)' }) },
    C10: { nombre: 'Devolución', objetivo: 'Devolución de una compra C01 aprobada.', visa: V({ mti: null, de3: '200000', obligatorios: null, condicionales: {} }), mastercard: M({ mti: null, de3: '200000', obligatorios: null, condicionales: {} }), amex: AMEX() },
    C11: { nombre: 'PIN incorrecto', objetivo: 'El alumno tipea un PIN distinto de 1234; el HSM del emisor lo rechaza.', visa: V({ mti: null, respuesta: '55', estado: 'verificado' }), mastercard: M({ mti: null, obligatorios: null, respuesta: '55', estado: 'verificado' }), amex: AMEX('117', 'verificado') },
    C12: { nombre: 'Fondos insuficientes', objetivo: 'Rechazo por saldo.', visa: V({ respuesta: '51', estado: 'verificado' }), mastercard: M({ respuesta: '51' }), amex: AMEX('equivalente a 51') },
    C13: { nombre: 'Tarjeta vencida', objetivo: 'Rechazo por vencimiento.', visa: V({ respuesta: '54', estado: 'verificado' }), mastercard: M({ respuesta: '54' }), amex: AMEX('equivalente a 54') },
    C14: { nombre: 'Criptograma alterado', objetivo: 'El importe cambia después de que la tarjeta firmó el ARQC; el emisor no lo valida.', visa: V({ respuesta: '82', estado: 'verificado' }), mastercard: M({ respuesta: '88', estado: 'verificado' }), amex: AMEX('100', 'verificado') },
    C15: { nombre: 'Emisor no disponible', objetivo: 'Emisor fuera de línea.', visa: V({ respuesta: '91', estado: 'verificado' }), mastercard: M({ respuesta: '91' }), amex: AMEX('equivalente a 91') },
    C20: { nombre: 'Cuotas no permitidas', objetivo: 'El emisor rechaza el plan de cuotas.', visa: V({ obligatorios: [...VISA_CHIP, 104], condicionales: VISA_CUOTAS, respuesta: '57', estado: 'verificado' }), mastercard: M({ obligatorios: [...MC_CHIP, 112], condicionales: MC_CUOTAS, respuesta: '57' }), amex: AMEX('115', 'verificado') },
  };

  // ---------- Utilidades ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const plain = (v) => String(v ?? '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
  const fmap = (m) => new Map((m?.fields || []).map((r) => [String(r[0]).replace(/^DE/i, ''), r]));
  const val = (m, de) => plain(fmap(m).get(String(de))?.[2] || '');

  function context() {
    const i = window.OSCPosInspect?.();
    if (!i) return null;
    const chrono = [...i.related].reverse();
    const reqs = chrono.filter((m) => m.direction === 'SALIENTE' && /^(0100|0200|1100)$/.test(m.mti));
    const req = reqs[reqs.length - 1] || (i.message.direction === 'SALIENTE' ? i.message : null);
    const respMti = req ? req.mti.slice(0, 2) + '1' + req.mti.slice(3) : '';
    const res = chrono.filter((m) => m.direction === 'ENTRANTE' && m.mti === respMti).pop() || null;
    const network = String(i.card?.network || i.op?.network || '').toLowerCase();
    return { ...i, req, res, network, product: String(i.card?.product || '').toLowerCase() };
  }

  function detect(c) {
    if (!c?.req) return null;
    const de3 = val(c.req, 3), de22 = val(c.req, 22), code = c.res ? val(c.res, 39) : '';
    const cuotas = Number(c.installments?.count || 1) > 1 || fmap(c.req).has('104') || fmap(c.req).has('112');
    const amexMap = { '117': 'C11', '100': 'C14', '115': 'C20' };
    if (/^20/.test(de3)) return 'C10';
    if (c.network === 'amex' && amexMap[code]) return amexMap[code];
    const byCode = { 55: 'C11', 51: 'C12', 54: 'C13', 82: 'C14', 88: 'C14', 91: 'C15', 57: 'C20' };
    if (byCode[code]) return byCode[code];
    if (cuotas) return c.installments?.interest ? 'C07' : 'C06';
    if (/^07/.test(de22)) return 'C03';
    if (/^90|^02/.test(de22)) return 'C04';
    if (/^01/.test(de22)) return 'C05';
    return c.product.includes('déb') || c.product.includes('deb') ? 'C02' : 'C01';
  }

  // ---------- VALIDACIONES ----------
  let manualCase = null;
  function validationRows(c, id) {
    const exp = CASES[id]?.[c.network];
    if (!exp) return { exp: null, rows: [], score: null };
    const present = fmap(c.req), rows = [];
    const add = (st, what, detail) => rows.push({ st, what, detail });
    if (exp.mti) add(c.req.mti === exp.mti ? 'ok' : 'bad', `MTI ${exp.mti}`, c.req.mti === exp.mti ? `El mensaje es ${c.req.mti}` : `Se envió ${c.req.mti}`);
    else add('todo', 'MTI', `Se envió ${c.req.mti} · a validar con el manual`);
    if (exp.de3) add(val(c.req, 3) === exp.de3 ? 'ok' : 'bad', `DE 3 = ${exp.de3}`, `Valor: ${val(c.req, 3) || '—'}`);
    const de22 = val(c.req, 22);
    if (exp.de22) add(de22.startsWith(exp.de22) ? 'ok' : 'bad', `DE 22 empieza con ${exp.de22}`, `Valor: ${de22 || '—'}`);
    if (Array.isArray(exp.obligatorios)) exp.obligatorios.forEach((n) => add(present.has(String(n)) ? 'ok' : 'miss', `DE ${n} · obligatorio`, present.has(String(n)) ? (fmap(c.req).get(String(n))?.[1] || '') : 'Falta en el mensaje'));
    else add('todo', 'Campos obligatorios', 'Lista a completar con el manual de la marca');
    Object.entries(exp.condicionales || {}).forEach(([k, rule]) => {
      const base = String(k).split('.')[0], has = present.has(base);
      let st = 'cond', detail = `${rule} · ${has ? 'presente' : 'no presente'}`;
      if (k === '53' && present.has('52')) { st = has ? 'ok' : 'miss'; detail = has ? 'Presente junto con el 52' : 'Falta: se envió el 52 y la regla pide el 53'; }
      add(st, `DE ${k} · condicional`, detail);
    });
    (exp.prohibidos || []).forEach((n) => add(present.has(String(n)) ? 'bad' : 'ok', `DE ${n} · no lo usa la marca`, present.has(String(n)) ? 'Está presente y no debería' : 'No está'));
    const listed = new Set([...(exp.obligatorios || []), ...Object.keys(exp.condicionales || {}).map((k) => Number(String(k).split('.')[0])), ...(exp.prohibidos || [])].map(String));
    const extra = [...present.keys()].filter((k) => k !== '1' && !listed.has(k));
    if (extra.length && Array.isArray(exp.obligatorios)) add('info', 'Otros campos presentes', `DE ${extra.join(', ')} · no figuran en el caso (no se evalúan)`);
    const code = c.res ? val(c.res, 39) : '';
    if (/^\d+$/.test(String(exp.respuesta))) add(!c.res ? 'todo' : code === exp.respuesta ? 'ok' : 'bad', `Respuesta ${exp.respuesta}`, c.res ? `DE 39 = ${code || '—'}` : 'Todavía no hay respuesta');
    else add('todo', `Respuesta: ${exp.respuesta}`, c.res ? `DE 39 = ${code || '—'}` : 'Todavía no hay respuesta');
    const graded = rows.filter((r) => ['ok', 'bad', 'miss'].includes(r.st));
    const score = graded.length ? Math.round((graded.filter((r) => r.st === 'ok').length / graded.length) * 100) : null;
    return { exp, rows, score };
  }
  const ICON = { ok: '✅', miss: '❌', bad: '❌', cond: '⚠️', todo: '❔', info: 'ℹ️' };
  function validationsHtml(c) {
    if (!c?.req) return '<p class="pv-muted">Hacé una compra (o seleccioná un mensaje del historial) para validar el caso de uso.</p>';
    const auto = detect(c), id = manualCase && CASES[manualCase] ? manualCase : auto;
    const { exp, rows, score } = validationRows(c, id);
    const opts = Object.entries(CASES).map(([k, v]) => `<option value="${k}" ${k === id ? 'selected' : ''}>${k} · ${esc(v.nombre)}${k === auto ? ' (detectado)' : ''}</option>`).join('');
    const brand = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express' }[c.network] || c.network;
    let html = `<div class="pv-head"><label>Caso de uso <select id="posValCase">${opts}</select></label><span class="pv-badge ${exp?.estado === 'verificado' ? 'ok' : 'draft'}">${exp ? (exp.estado === 'verificado' ? 'Verificado contra el manual' : 'Borrador · a cruzar con la marca') : 'Sin datos para esta red'}</span></div>`;
    html += `<p class="pv-obj"><b>${esc(id)} · ${esc(CASES[id].nombre)} · ${esc(brand)}</b> — ${esc(CASES[id].objetivo)}${exp?.nota ? `<br><span class="pv-muted">${esc(exp.nota)}</span>` : ''}${exp?.bit48 ? `<br><span class="pv-muted">Bit 48: ${esc(exp.bit48)}</span>` : ''}</p>`;
    if (!exp) return html + '<p class="pv-muted">La batería no tiene este caso para la red de la tarjeta.</p>';
    if (score != null) html += `<div class="pv-score"><b>${score}%</b> de los puntos evaluables cumplen · ✅ ok · ❌ falta o no corresponde · ⚠️ condicional · ❔ a validar</div>`;
    html += `<table class="pv-table"><thead><tr><th></th><th>Regla</th><th>Resultado</th></tr></thead><tbody>${rows.map((r) => `<tr class="pv-${r.st}"><td>${ICON[r.st]}</td><td>${esc(r.what)}</td><td>${esc(r.detail)}</td></tr>`).join('')}</tbody></table>`;
    html += '<p class="pv-muted">Fuente: batería de escenarios v1 (borrador) construida desde los manuales cargados y las pruebas del simulador. Se completará con los casos de uso oficiales de la marca.</p>';
    return html;
  }
  function colorBitmap(c, on) {
    document.querySelectorAll('#selectedBitmapPrimaryBits i, #selectedBitmapSecondaryBits i').forEach((i) => i.classList.remove('val-miss', 'val-cond', 'val-bad'));
    if (!on || !c?.req) return;
    const id = manualCase && CASES[manualCase] ? manualCase : detect(c), exp = CASES[id]?.[c.network];
    if (!exp) return;
    const present = fmap(c.req), cell = (n) => document.querySelector(`#selectedBitmapPrimaryBits i[data-bit="${n}"], #selectedBitmapSecondaryBits i[data-bit="${n}"]`);
    (exp.obligatorios || []).forEach((n) => { if (!present.has(String(n))) cell(n)?.classList.add('val-miss'); });
    Object.keys(exp.condicionales || {}).forEach((k) => cell(String(k).split('.')[0])?.classList.add('val-cond'));
    (exp.prohibidos || []).forEach((n) => { if (present.has(String(n))) cell(n)?.classList.add('val-bad'); });
  }

  // ---------- VISTA TLV (DE 55) ----------
  const TAGS = { '4F': 'AID', '50': 'Application Label', '57': 'Track 2 Equivalent', '5A': 'PAN', '5F24': 'Fecha de vencimiento', '5F2A': 'Moneda de la transacción', '5F34': 'PAN Sequence Number', '82': 'Application Interchange Profile (AIP)', '84': 'Dedicated File Name', '91': 'Issuer Authentication Data (ARPC + ARC)', '95': 'Terminal Verification Results (TVR)', '9A': 'Fecha de la transacción', '9C': 'Tipo de transacción', '9F02': 'Importe autorizado', '9F03': 'Otro importe', '9F09': 'Versión de aplicación', '9F10': 'Issuer Application Data (CVN, CVR)', '9F1A': 'País de la terminal', '9F1E': 'Serie del IFD', '9F26': 'Criptograma (ARQC)', '9F27': 'Cryptogram Information Data', '9F33': 'Terminal Capabilities', '9F34': 'CVM Results', '9F35': 'Tipo de terminal', '9F36': 'ATC (contador de la aplicación)', '9F37': 'Unpredictable Number', '9F41': 'Secuencia de la transacción', '9F6E': 'Form Factor / datos del dispositivo', '71': 'Issuer Script 1', '72': 'Issuer Script 2', '8A': 'Authorization Response Code' };
  function parseTlv(hex) {
    const out = []; let i = 0; hex = hex.replace(/[^0-9A-F]/gi, '').toUpperCase();
    while (i + 4 <= hex.length && out.length < 60) {
      let tag = hex.substr(i, 2); i += 2;
      if ((parseInt(tag, 16) & 0x1F) === 0x1F) { do { tag += hex.substr(i, 2); i += 2; } while (i <= hex.length && (parseInt(tag.slice(-2), 16) & 0x80)); }
      let len = parseInt(hex.substr(i, 2), 16); i += 2;
      if (len & 0x80) { const n = len & 0x7F; len = parseInt(hex.substr(i, n * 2), 16); i += n * 2; }
      if (!Number.isFinite(len) || i + len * 2 > hex.length) { out.push({ tag, len: NaN, value: hex.slice(i), error: true }); break; }
      out.push({ tag, len, value: hex.substr(i, len * 2) }); i += len * 2;
    }
    return out;
  }
  function tlvHtml(c) {
    const m = c?.message; if (!m) return '<p class="pv-muted">Seleccioná un mensaje.</p>';
    const pick = (m.direction === 'SALIENTE' ? [m, c.req, c.res] : [m, c.res, c.req]).filter(Boolean).find((x) => fmap(x).has('55'));
    if (!pick) return '<p class="pv-muted">El mensaje no tiene DE 55 (datos del chip). La vista TLV aplica a lecturas chip, contactless y wallet.</p>';
    let hex = val(pick, 55).replace(/[^0-9A-F]/gi, '').toUpperCase(), head = '';
    // Visa: el DE 55 lleva Dataset ID (01) + longitud de 2 bytes antes de los tags EMV.
    if (/^01/.test(hex) && parseInt(hex.substr(2, 4), 16) * 2 === hex.length - 6) { head = `Visa Dataset ID <b>01</b> · longitud <b>0x${hex.substr(2, 4)}</b> (${parseInt(hex.substr(2, 4), 16)} bytes) · `; hex = hex.slice(6); }
    const tl = parseTlv(hex);
    if (!tl.length) return '<p class="pv-muted">No se pudo decodificar el DE 55.</p>';
    return `<p class="pv-obj">DE 55 de <b>${esc(pick.mti)}</b> · ${head}${tl.length} tags EMV (Tag · Longitud · Valor). Las longitudes van en hexadecimal.</p><table class="pv-table"><thead><tr><th>Tag</th><th>Nombre</th><th>Long.</th><th>Valor</th></tr></thead><tbody>${tl.map((t) => `<tr${t.error ? ' class="pv-bad"' : ''}><td><b>${t.tag}</b></td><td>${esc(TAGS[t.tag] || '—')}</td><td>${Number.isFinite(t.len) ? `${t.len} (0x${t.len.toString(16).toUpperCase().padStart(2, '0')})` : '?'}</td><td><code>${esc(t.value)}</code></td></tr>`).join('')}</tbody></table>`;
  }

  // ---------- EXPLICACIÓN ----------
  const MTI_TXT = { '0100': 'Solicitud de autorización (crédito, BASE I / dual message)', '0110': 'Respuesta a la autorización', '0200': 'Solicitud financiera (débito / single message)', '0210': 'Respuesta financiera', '0400': 'Reversa', '0410': 'Respuesta a la reversa', '0420': 'Aviso de reversa', '0430': 'Respuesta al aviso de reversa', '1100': 'Solicitud de autorización (American Express, ISO 1993)', '1110': 'Respuesta de autorización (American Express)', '1420': 'Reversa (American Express)', '1430': 'Respuesta a la reversa (American Express)' };
  const DE22 = { '05': 'chip EMV', '07': 'contactless', '90': 'banda magnética (pista completa)', '02': 'banda magnética', '01': 'ingreso manual', '81': 'comercio electrónico' };
  function explainHtml(c) {
    const m = c?.message; if (!m) return '<p class="pv-muted">Seleccioná un mensaje.</p>';
    const de3 = val(m, 3), de22 = val(m, 22), de39 = val(m, 39), de4 = val(m, 4);
    const lines = [`<b>${esc(m.mti)}</b> — ${esc(MTI_TXT[m.mti] || 'Mensaje ISO 8583')} · ${m.direction === 'SALIENTE' ? 'sale del POS hacia el adquirente' : 'vuelve del emisor hacia el POS'}.`];
    if (de3) lines.push(`<b>DE 3 = ${esc(de3)}</b>: tipo de operación ${esc(de3.slice(0, 2))} (${{ '00': 'compra', '01': 'retiro de efectivo', '09': 'compra con cashback', '20': 'devolución', '30': 'consulta de saldo' }[de3.slice(0, 2)] || 'según la marca'}), cuenta desde ${esc(de3.slice(2, 4))} y hacia ${esc(de3.slice(4, 6))}.`);
    if (de4) lines.push(`<b>DE 4 = ${esc(de4)}</b>: importe con 2 decimales implícitos → ${(Number(de4) / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}.`);
    if (de22) lines.push(`<b>DE 22 = ${esc(de22)}</b>: la tarjeta se leyó por ${esc(DE22[de22.slice(0, 2)] || 'un modo a revisar en el manual')}.`);
    if (fmap(m).has('52')) lines.push('<b>DE 52</b>: viaja el PIN cifrado (PIN Block). El emisor lo verifica en su HSM.');
    if (fmap(m).has('55')) lines.push('<b>DE 55</b>: datos del chip en formato TLV (mirá la pestaña Vista TLV).');
    if (de39) lines.push(`<b>DE 39 = ${esc(de39)}</b>: código de respuesta del emisor${de39 === '00' || de39 === '000' ? ' (aprobada)' : ''}.`);
    const rows = (m.fields || []).map((r) => `<tr><td><b>${esc(String(r[0]).replace(/^DE/i, ''))}</b></td><td>${esc(plain(r[1]))}</td><td><code>${esc(plain(r[2]).slice(0, 60))}</code></td><td>${esc(plain(r[5] || ''))}</td></tr>`).join('');
    return `<div class="pv-obj">${lines.map((l) => `<p style="margin:4px 0">${l}</p>`).join('')}</div><table class="pv-table"><thead><tr><th>DE</th><th>Qué es</th><th>Valor</th><th>Origen</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  // ---------- Pestañas ----------
  let current = 0;
  function ensure() {
    const tabs = document.querySelector('.iso-panel .tabs'); if (!tabs || tabs.dataset.wired) return tabs;
    tabs.dataset.wired = '1';
    const st = document.createElement('style');
    st.textContent = `.pv-view{padding:10px 2px;font-size:13px;color:#d7e3ee}.pv-muted{color:#8fa8bd;font-size:12px}.pv-head{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:8px}.pv-head select{margin-left:6px;background:#0b1d2e;color:#e6f2fb;border:1px solid #2b4a66;border-radius:8px;padding:6px 8px}.pv-badge{font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px}.pv-badge.ok{background:#123d29;color:#7ef0b2}.pv-badge.draft{background:#4a3a0e;color:#ffd77a}.pv-obj{margin:6px 0 10px;line-height:1.5}.pv-score{margin:6px 0;padding:8px 10px;border:1px solid #23415c;border-radius:8px;background:#0b1d2e}.pv-table{width:100%;border-collapse:collapse;font-size:12.5px}.pv-table th,.pv-table td{border-bottom:1px solid #1d3a54;padding:6px;text-align:left;vertical-align:top}.pv-table th{color:#9fb6cb;font-weight:700}.pv-table code{font-family:Consolas,Menlo,monospace;word-break:break-all;color:#bfe3ff}.pv-miss td,.pv-bad td{color:#ffb4b4}.pv-cond td{color:#ffe08a}.pv-todo td{color:#b9c7d4}
#selectedBitmapPrimaryBits i.val-miss,#selectedBitmapSecondaryBits i.val-miss{background:#7a1f1f!important;outline:1px solid #ff6b6b}#selectedBitmapPrimaryBits i.val-cond,#selectedBitmapSecondaryBits i.val-cond{outline:2px solid #ffd34d}#selectedBitmapPrimaryBits i.val-bad,#selectedBitmapSecondaryBits i.val-bad{background:#7a1f1f!important;outline:2px solid #ff6b6b}`;
    document.head.appendChild(st);
    const wrap = document.querySelector('.iso-panel .table-wrap');
    const view = document.createElement('div'); view.id = 'posAltView'; view.className = 'pv-view'; view.hidden = true;
    wrap.insertAdjacentElement('afterend', view);
    [...tabs.querySelectorAll('button')].forEach((b, i) => { b.type = 'button'; b.onclick = () => { current = i; tabs.querySelectorAll('button').forEach((x, j) => x.classList.toggle('active', j === i)); refresh(); }; });
    return tabs;
  }
  function refresh() {
    if (!ensure()) return;
    const wrap = document.querySelector('.iso-panel .table-wrap'), view = document.getElementById('posAltView');
    const c = context();
    wrap.hidden = current !== 0; view.hidden = current === 0;
    if (current === 1) view.innerHTML = tlvHtml(c);
    if (current === 2) view.innerHTML = explainHtml(c);
    if (current === 3) { view.innerHTML = validationsHtml(c); const sel = document.getElementById('posValCase'); if (sel) sel.onchange = () => { manualCase = sel.value; refresh(); }; }
    colorBitmap(c, current === 3);
  }
  // Al cambiar de mensaje vuelve a la detección automática del caso.
  let lastMsg = null;
  const api = { refresh: () => { const c = window.OSCPosInspect?.(); if (c?.message?.id !== lastMsg) { lastMsg = c?.message?.id; manualCase = null; } refresh(); }, CASES, detect: () => detect(context()) };
  window.OSCPosTabs = api;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => ensure()); else ensure();
})();
