/* OSC Academy v4.0.0-rc.1.25 · Red LINK · Mensajería Host to Host ISO 8583 (BASE24).
   Fuentes (manuales LINK cargados en la plataforma, acceso solo administración OSC):
   - C-X-1-2-3 Tipo y formato de mensajes · C-X-4-01 0200 Output · C-X-4-03 0210 Input
   - C-X-5 Códigos de transacciones · C-X-6 Códigos de resultado · C-X-7 Tipos de cuenta
   - Anexo Nuevo Esquema de Transferencias (vigente 22/06/2026): campo 55 y tokens PE / Q7 del campo 126
   - Anexo Técnico II · Adaptación en la mensajería de DEBIN (vigente 29/06/2026): F3XX00 / F400XX, campo 55 (247) y token QS
   Perspectiva: LINK (BASE24) → Host de la institución (0200 OUTPUT B24) y respuesta del host (0210 INPUT B24).
   Todos los datos son de práctica (PAN, CBU, CUIT y cuentas didácticos). */
(() => {
  const pad = (v, n, ch = ' ') => String(v ?? '').slice(0, n).padEnd(n, ch);
  const num = (v, n) => String(v ?? '').replace(/\D/g, '').slice(-n).padStart(n, '0');
  const amt12 = cents => num(Math.round(Number(cents || 0)), 12);
  const llvar = (v, n = 2) => String(String(v).length).padStart(n, '0') + String(v);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const LINK = {
    network: 'PRO1',
    issuerFiid: '0311',            // Institución emisora de la tarjeta (didáctica)
    issuerName: 'OSC BANK',
    atmFiid: '0270',               // Institución dueña del ATM (didáctica)
    atmOwnerName: 'BANCO DIDACTICO ATM',
    posAcquirerFiid: '0311',       // Host adquirente del comercio (didáctico)
    acquirerId: '00000000270',     // Campo 32 · 9(11)
    receivingId: '00000000311',    // Campo 100 · RCV-INST
    banelcoFiid: '5892',
    pan: '9900020000000018',
    expiry: '2912',
    serviceCode: '120',
    locality: 'CAP. FED.',          // rc.1.49 · DE43 localidad 13 (parametrizable por el TestLab)
    province: 'BUE',                // rc.1.49 · DE43 provincia 3
    country: 'AR',                  // rc.1.49 · DE43 país 2
    pinOffset: '8352FFFFFFFFFFFF',
    buyerCuit: '20304050607',
    buyerName: 'ALUMNO OSC ACADEMY',
    accounts: {
      '10': { label: 'Caja de ahorros en pesos', number: '0000003110012345678', currency: '032' },
      '20': { label: 'Cuenta corriente en pesos', number: '0000003120087654321', currency: '032' },
      '15': { label: 'Caja de ahorros en dólares', number: '0000003115055512345', currency: '840' },
      '07': { label: 'Cuenta corriente en dólares', number: '0000003107044412345', currency: '840' },
      '30': { label: 'Cuenta tarjeta de crédito en pesos', number: '0000003130099912345', currency: '032' }
    }
  };
  const TX = {
    withdrawal: { code: '01', label: 'Extracción', short: 'EXTRACCIÓN' },
    balance: { code: '31', label: 'Consulta de saldo', short: 'CONSULTA DE SALDO' },
    transfer: { code: '09', label: 'Transferencia interbancaria (09 / 29)', short: 'TRANSFERENCIA' },
    debin: { code: 'F3', label: 'DEBIN (F3 / F4)', short: 'DEBIN' }
  };
  const RESULT = {
    '00': 'TRANSACCIÓN APROBADA', '05': 'DECLINACIÓN EXTERNA', '12': 'TRANSACCIÓN INVÁLIDA', '13': 'MONTO INVÁLIDO',
    '14': 'TARJETA INVÁLIDA', '51': 'FONDOS INSUFICIENTES', '53': 'SIN CAJA DE AHORROS', '52': 'SIN CUENTA CORRIENTE',
    '54': 'TARJETA VENCIDA', '55': 'PIN INCORRECTO', '57': 'TRANSACCIÓN INVÁLIDA PARA LA TARJETA', '61': 'EXCEDE EL MONTO MÁXIMO DE EXTRACCIÓN DIARIO',
    '65': 'EXCEDE LA CANTIDAD MÁXIMA DE EXTRACCIONES DIARIAS', '76': 'CUENTA INVÁLIDA', '91': 'PROCESO AUTORIZADOR NO DISPONIBLE', '96': 'FALLA DEL SISTEMA',
    '01': 'REFERIRSE A EMISOR DE TARJETA', '46': 'PLAZO FIJO: RANGO HORARIO NO PERMITIDO / SISTEMA DE INVERSIONES NO ACTIVO', '68': 'EL PLAZO EN DÍAS PARA EL PLAZO FIJO ES INVÁLIDO', '74': 'NO SE ENCONTRÓ LA TRANSACCIÓN ORIGINAL (CONSULTA DE PAGO ON LINE)', '80': 'CÓDIGO DE SERVICIO / NÚMERO DE USUARIO INVÁLIDO', '81': 'PARTIDA YA PAGADA, DEUDA YA CANCELADA EN PAS', '82': 'USUARIO NO ENCONTRADO EN PAS', '83': 'DATOS INVÁLIDOS EN INPUT', '86': 'SIN INFORMACIÓN PARA LA DEUDA / CUENTA SOLICITADA', '89': 'PROBLEMAS EN LA BASE DE DATOS (OPERACIÓN NO HABILITADA / SIN ADHESIÓN EN PAS)'
  };
  const SCENARIOS = ['00', '51', '55', '61', '65', '76', '91', '80', '81', '82', '86', '68'];
  const MOTIVOS = { VAR: 'Varios', ALQ: 'Alquileres', CUO: 'Cuotas', EXP: 'Expensas', FAC: 'Facturas', HAB: 'Haberes', HON: 'Honorarios', PRE: 'Préstamos', SEG: 'Seguros' };
  // Tipo de cuenta destino del token PE (codificación propia del anexo: 01 CC$, 07 CCU$S, 11 CA$, 15 CAU$S).
  const PE_TYP = { '10': '11', '20': '01', '15': '15', '07': '07' };

  const NAMES = {
    1: 'secndry-bit-map · Bitmap secundario', 2: 'pan · Número de tarjeta', 3: 'proc-cde · Código de transacción', 4: 'tran-amt · Monto de la transacción',
    7: 'xmit-dat-tim · Fecha y hora de transmisión', 11: 'trace-num · Número de traza', 12: 'tran-tim · Hora local', 13: 'tran-dat · Fecha local',
    15: 'setl-dat · Fecha de negocio otra red', 17: 'cap-dat · Fecha de negocio', 22: 'entry-mde · Modo de ingreso', 32: 'acq-inst-id · Institución pagadora',
    35: 'track 2', 37: 'retrvl-ref-num · Número de recibo', 38: 'auth-id-resp · Código de autorización', 39: 'resp-cde · Código de respuesta',
    41: 'term-id · Terminal', 42: 'crd-accpt-id-cde', 43: 'crd-accpt-name-loc · Dueño y localidad', 44: 'resp-data · Saldos',
    45: 'track 1', 48: 'add-data-prvt · Datos POS', 49: 'crncy-cde · Moneda', 52: 'pin · PIN cifrado', 54: 'add-amts · Montos adicionales',
    55: 'pri-rsrvd1-iso · Datos interbancarios', 60: 'pri-rsrvd1-prvt · Datos de la terminal', 61: 'pri-rsrvd2-prvt · Datos del emisor',
    62: 'pri-rsrvd3-prvt · Tipo de terminal', 63: 'pri-rsrvd4-prvt · PIN offset', 70: 'netw-mgmt-cde · Código de gestión de red', 90: 'orig-info · Datos originales', 95: 'replacement · Monto real (reversa parcial)', 100: 'rcv-inst · Institución receptora', 102: 'acct1 · Cuenta desde',
    103: 'acct2 · Cuenta hacia', 120: 'secndry-rsrvd1-prvt · Dirección del ATM', 122: 'secndry-rsrvd3-prvt · Código institución emisora',
    123: 'secndry-rsrvd4-prvt · Monto de depósito', 124: 'secndry-rsrvd5-prvt · Tipo de depositorio', 125: 'secndry-rsrvd6-prvt · Indicador de cuenta',
    126: 'secndry-rsrvd7-prvt · Área de tokens', 127: 'secndry-rsrvd8-prvt · Datos adicionales'
  };

  // Saldos simulados del host emisor (persisten en el navegador del alumno).
  const BAL_KEY = 'oscLinkBalances.v1';
  function balances() {
    const base = { '10': 50000000, '20': 120000000, '15': 250000, '07': 500000, '30': 80000000, cardDebt: 15000000, holds: 0, history: [], withdrawalsToday: 0, withdrawnToday: 0, day: '' };
    try { const b = JSON.parse(localStorage.getItem(BAL_KEY) || 'null'); if (b && b['10'] != null) return { ...base, ...b }; } catch (_) {}
    return base;
  }
  function saveBalances(b) { try { localStorage.setItem(BAL_KEY, JSON.stringify(b)); } catch (_) {} }

  function clock(d = new Date()) {
    const p = n => String(n).padStart(2, '0');
    return { mmdd: p(d.getMonth() + 1) + p(d.getDate()), hhmmss: p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()), yymmdd: String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) };
  }
  function cbuParts(cbu) {
    const c = num(cbu, 22);
    return { cbu: c, bank: c.slice(0, 3), branch: c.slice(3, 7), account: c.slice(8, 21), fiid: '0' + c.slice(0, 3) };
  }
  function track2(ctx) { return `${ctx.pan}=${ctx.expiry || LINK.expiry}${LINK.serviceCode}0000000000`.slice(0, 37); }

  function tokens(list) {
    // Header de tokens: "& " + cantidad (incluye el header) X(5) + longitud total X(5). Cada token: "! " + ID + longitud 9(5) + " " + datos.
    const body = list.map(t => '! ' + t.id + num(t.data.length, 5) + ' ' + t.data).join('');
    const total = 12 + body.length;
    return '& ' + num(list.length + 1, 5) + num(total, 5) + body;
  }

  function f(de, value, attr, ref, data) { return { de, name: NAMES[de] || ('Campo ' + de), value: String(value), attr, ref, data: data ?? null }; }

  function commonRequest(ctx, proc) {
    const c = ctx.clock;
    const isAtm = ctx.terminal === 'ATM';
    const termId = pad(ctx.termId || (isAtm ? 'S1AXOSC0001' : 'POSOSC0001'), 16);
    const owner = isAtm ? LINK.atmFiid : LINK.posAcquirerFiid;
    const loc = pad(isAtm ? LINK.atmOwnerName : (ctx.merchantName || 'COMERCIO OSC'), 22) + pad(LINK.locality, 13) + pad(LINK.province, 3) + pad(LINK.country, 2);
    return {
      3: f(3, proc, 'g 9(6)', 'C-X-5 · nnXXYY: transacción + cuenta desde + cuenta hacia'),
      4: f(4, amt12(ctx.amountCents), '9(12)', '10 enteros + 2 decimales'),
      7: f(7, c.mmdd + c.hhmmss, 'mmddhhmmss 9(10)', 'C-X-4-01'),
      11: f(11, num(ctx.stan, 6), '9(6)', 'C-X-4-01'),
      12: f(12, c.hhmmss, 'hhmmss 9(6)', 'Hora local en que comenzó la transacción'),
      13: f(13, c.mmdd, 'mmdd 9(4)', 'Fecha local en que comenzó la transacción'),
      15: f(15, '0000', 'mmdd 9(4)', 'Ceros: la transacción no se realizó en otra red'),
      17: f(17, c.mmdd, 'mmdd 9(4)', 'Fecha de negocios de la transacción'),
      32: f(32, llvar(LINK.acquirerId), 'LLVAR ..9(11)', 'Código interno de la institución pagadora'),
      35: f(35, '37' + pad(track2(ctx), 37), 'LLVAR ..X(37)', 'Track 2 alineado a izquierda y relleno con blancos'),
      37: f(37, pad(ctx.rrn, 12), 'X(12)', 'Número de recibo'),
      41: f(41, termId, 'X(16)', 'Terminal alineada a izquierda con blancos'),
      42: f(42, pad('', 15), 'X(15)', 'Siempre blancos para ATM y POS'),
      43: f(43, loc, 'g X(40)', 'Nombre 22 + localidad 13 + provincia 3 + país 2'),
      49: f(49, '032', '9(3)', '032 = Pesos'),
      52: f(52, pad(ctx.pinBlock || 'FFFFFFFFFFFFFFFF', 16).slice(0, 16), 'X(16)', 'PIN cifrado (PIN Block ISO 9564 formato 0 con ZPK de práctica)'),
      54: f(54, '023' + pad('', 23), 'LLLVAR g..120', 'Restantes códigos: longitud 023 + blancos'),
      60: f(60, '012' + owner + LINK.network + '+000', 'LLLVAR g..100', 'Longitud 012 + institución dueña de la terminal + red + diferencia horaria'),
      61: f(61, '013' + LINK.issuerFiid + LINK.network + proc.slice(2, 6) + 'P', 'LLLVAR g..100', 'Longitud 013 + emisor + red PRO1 + tipos de cuenta + P'),
      63: f(63, '016' + LINK.pinOffset, 'LLLVAR g..597', 'Longitud 016 + PIN offset'),
      100: f(100, '11' + pad(LINK.receivingId, 11), 'LLVAR ..9(11)', 'Institución emisora (receptora)'),
      120: f(120, '033' + pad(isAtm ? 'SUIPACHA 815' : 'AV. CORRIENTES 1234', 25) + '0001' + '0000', 'LLLVAR g..150', 'Longitud 033 + dirección 25 + sucursal 4 + región 4'),
      124: f(124, '001' + ' ', 'LLLVAR g..684', 'Tipo de depositorio: blanco'),
      125: f(125, '001' + '0', 'LLLVAR g..680', 'Indicador de cuenta: 0'),
      127: f(127, '043' + '0000' + '0'.repeat(32) + '0'.repeat(7), 'LLLVAR g..X(200)', 'Región 0000 (Capital y GBA) + tipos de cambio en ceros')
    };
  }
  function posField48(ctx, original) {
    const cuotas = num(ctx.installments || 1, 2);
    const origNum = original ? num(String(original.rrn || '').replace(/\D/g, ''), 4) : '0000';
    const origDate = original ? num(original.mmdd || '', 4) : '0000';
    const data = pad(ctx.merchantId || '000000000012345', 19) + cuotas + pad('', 2) + '0000' + pad('1', 24) + '0' + '00' + '000' + '000' + '00000000000' + origNum + origDate;
    return f(48, '079' + data, 'LLLVAR g..100', `POS: RETL-ID + cuotas ${cuotas} + región + sharing group + ORIG-NUM ${origNum} / ORIG-DATE ${origDate}${original ? ' (devolución: datos de la compra original)' : ''}`);
  }
  function field55Transfer(ctx, dest, fromTyp, toTyp) {
    const data = pad(track2(ctx), 40) + pad(dest.mismoTitular || 'N', 1) + ' ' +
      LINK.issuerFiid + fromTyp + pad(LINK.accounts[fromTyp].number, 19) +
      dest.fiid + toTyp + pad(dest.account, 19) + pad(dest.bankName, 13) +
      ' ' + ' ' + ' ' + pad(dest.motivo || 'VAR', 3) + pad('', 9);
    return f(55, '120' + data, 'LLLVAR g..360', 'Anexo Transferencias 3.2: TRACK2 40 + MARCA-TIT 2 + FR-ACCT 25 + TO-ACCT 25 + FIID-DESC 13 + tipos + MOTIVO 3 + FILLER 9');
  }
  function tokenPE(ctx, dest, fromTyp, toTyp) {
    return pad(dest.motivo || 'VAR', 3) + pad(dest.reference || 'OSC ACADEMY', 12) + pad(PE_TYP[toTyp] || '11', 2) + num(LINK.buyerCuit, 11) + num(dest.cuit, 11) +
      pad(dest.mismoTitular || 'N', 1) + pad(dest.name, 22) + pad(track2(ctx), 40) + LINK.issuerFiid + fromTyp + pad(LINK.accounts[fromTyp].number, 19) +
      dest.fiid + dest.fiid + toTyp + pad(dest.account, 19);
  }
  function tokenQ7(dest) {
    return num(dest.cbu, 22) + 'F' + num(dest.cuit, 11) + pad(dest.name, 40) + pad('', 11) + pad('', 40) + pad('', 11) + pad('', 40) + pad('', 19) +
      (dest.network === 'BANELCO' ? 'B' : 'L') + pad(dest.bankName, 22) + pad(LINK.buyerName, 22);
  }
  function field55Debin(ctx, d) {
    const data = pad(d.id, 32) + pad(d.concepto || 'VAR', 3) + LINK.issuerFiid + num(LINK.buyerCuit, 11) + num(d.buyerCbu, 22) + pad(LINK.accounts[d.fromTyp].number, 19) +
      d.seller.fiid + num(d.sellerCuit, 11) + num(d.seller.cbu, 22) + pad(d.seller.account, 19) + pad(ctx.pan, 19) + pad(LINK.buyerName, 40) +
      'N' + 'N' + 'D' + '000' + pad('', 32) + pad('', 3);
    return f(55, '247' + data, 'LLLVAR X(363)', 'Anexo DEBIN 3.4: ID 32 + CONCEPTO + comprador (FIID/CUIT/CBU/cuenta) + vendedor + PAN + PAGADOR + MISMO-TITULAR + PREAUT + ORIGEN D + SCORING + contracargo');
  }
  function tokenQS(ctx, d) {
    return pad(d.id, 32) + pad(d.concepto || 'VAR', 3) + LINK.issuerFiid + num(LINK.buyerCuit, 11) + num(d.buyerCbu, 22) + pad(LINK.accounts[d.fromTyp].number, 19) +
      d.seller.fiid + num(d.sellerCuit, 11) + num(d.seller.cbu, 22) + pad(d.seller.account, 19) + pad(ctx.pan, 19) + pad(LINK.buyerName, 40) +
      'N' + 'N' + 'D' + '000' + pad('', 32) + pad('', 3) + 'N' + 'DEBIN' + pad('', 22) + pad('', 11) + pad('', 40) + pad('', 22) + pad('', 11) + pad('', 40) + pad('', 21);
  }

  function bitmaps(rows) {
    const bits = new Set(rows.map(r => r.de));
    if ([...bits].some(b => b > 64)) bits.add(1);
    const hex = (from) => { let s = ''; for (let i = from; i < from + 64; i++) s += bits.has(i) ? '1' : '0'; return s.match(/.{4}/g).map(n => parseInt(n, 2).toString(16).toUpperCase()).join(''); };
    return { primary: hex(1), secondary: bits.has(1) ? hex(65) : null };
  }
  function message({ mti, header, rows, label, leg, direction, responseCode }) {
    const bm = bitmaps(rows);
    const all = bm.secondary ? [f(1, bm.secondary, 'X(16)', 'Bitmap secundario (campos 65 a 128)'), ...rows] : rows;
    all.sort((a, b) => a.de - b.de);
    const raw = 'ISO' + header + mti + bm.primary + all.map(r => r.value).join('');
    return { mti, header, label, leg, direction, responseCode: responseCode || '', bitmap: bm.primary + (bm.secondary || ''), primaryBitmap: bm.primary, secondaryBitmap: bm.secondary, fields: all, raw, network: 'link' };
  }
  function pick(map, list) { return list.map(de => map[de]).filter(Boolean); }

  function decide(ctx, kind, b) {
    let code = SCENARIOS.includes(ctx.scenario) ? ctx.scenario : '00';
    if (ctx.pinOk === false && code === '00') code = '55';
    const today = clock().yymmdd;
    if (b.day !== today) { b.day = today; b.withdrawalsToday = 0; b.withdrawnToday = 0; }
    if (code === '00' && ['withdrawal', 'transfer', 'debin'].includes(kind) && Number(ctx.amountCents) > Number(b[ctx.accountType] || 0)) code = '51';
    if (code === '00' && kind === 'withdrawal' && b.withdrawnToday + Number(ctx.amountCents) > 20000000) code = '61';
    return code;
  }

  function response0210(req, ctx, code, extra = {}) {
    const header = ctx.terminal === 'ATM' ? '014000015' : '014000055';
    const map = Object.fromEntries(req.fields.filter(r => r.de !== 1).map(r => [r.de, { ...r, ref: 'Eco del 0200' }]));
    return { header, map };
  }

  function buildSimple(kind, ctx, b) {
    const t = ctx.accountType;
    const proc = (kind === 'withdrawal' ? '01' : '31') + t + '00';
    const reqHeader = ctx.terminal === 'ATM' ? '014000010' : '014000050';
    const m = commonRequest(ctx, proc);
    m[102] = f(102, '28' + pad(LINK.accounts[t].number, 28), 'LLVAR ..X(28)', 'Cuenta desde, alineada a izquierda con blancos');
    m[103] = f(103, '28' + pad('', 28), 'LLVAR ..X(28)', 'Sin cuenta hacia');
    if (kind === 'balance') m[4] = f(4, amt12(0), '9(12)', 'Consulta: importe en ceros');
    const list = [3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 41, 42, 43, 49, 52, 54, 60, 61, 63, 100, 102, 103, 120, 124, 125, 127];
    if (ctx.terminal === 'POS') { m[48] = posField48(ctx); list.push(48); }
    const req = message({ mti: '0200', header: reqHeader, rows: pick(m, list), label: `0200 ${TX[kind].short} · LINK → Host emisor`, leg: 'Requerimiento (0200 OUTPUT B24)', direction: 'SALIENTE' });
    const code = decide(ctx, kind, b);
    if (code === '00' && kind === 'withdrawal') { b[t] -= Number(ctx.amountCents); b.withdrawalsToday++; b.withdrawnToday += Number(ctx.amountCents); addHistory(b, t, 'EXTRACCION', Number(ctx.amountCents), -1); }
    const bal = Number(b[t] || 0);
    const { header, map } = response0210(req, ctx, code);
    map[39] = f(39, code, 'X(2)', 'C-X-6 · ' + (RESULT[code] || ''));
    map[44] = f(44, '25' + '2' + amt12(bal) + amt12(bal), 'LLVAR ..X(25)', 'Longitud 25 + "2" + saldo de apertura 9(10)v99 + saldo disponible 9(10)v99');
    const cashAvail = code === '00' ? amt12(Math.max(0, 20000000 - b.withdrawnToday)) : amt12(0);
    map[54] = f(54, '100' + pad('', 12) + num(Math.max(0, 6 - b.withdrawalsToday), 2) + amt12(bal) + cashAvail + amt12(0) + clock().yymmdd + '000000' + num(0, 10) + num(0, 10) + num(0, 10) + num(0, 8), 'LLLVAR g..120', 'Longitud 100: extracciones disponibles, disponible compras, efectivo disponible, fecha, etc.');
    map[61] = { ...map[61], ref: 'Eco: emisor + PRO1 + tipos de cuenta + P' };
    map[122] = f(122, '011' + pad(LINK.issuerFiid, 11), 'LLLVAR g..150', 'Código interno de la institución emisora');
    map[123] = f(123, '012' + amt12(0), 'LLLVAR g..455', 'Monto de depósito sumado al disponible: ceros');
    map[127] = f(127, '043' + '0' + '0'.repeat(32) + pad('', 10), 'LLLVAR g..X(200)', 'Tipo de cambio aplicado + tipos de cambio + blancos');
    const resList = [3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 39, 41, 42, 44, 49, 54, 60, 61, 100, 102, 103, 122, 123, 124, 125, 127];
    const res = message({ mti: '0210', header, rows: pick(map, resList), label: `0210 ${TX[kind].short} · Host emisor → LINK`, leg: 'Respuesta (0210 INPUT B24)', direction: 'ENTRANTE', responseCode: code });
    return { messages: [req, res], code, balanceCents: bal, summary: kind === 'balance' ? 'Saldo disponible informado en el campo 44' : 'Débito en la cuenta y efectivo entregado' };
  }

  function destination(ctx) {
    const d = ctx.destination || {};
    const p = cbuParts(d.cbu || '0140999901000012345678');
    const banelco = d.network === 'BANELCO';
    return { ...d, cbu: p.cbu, fiid: banelco ? LINK.banelcoFiid : p.fiid, account: num(p.account, 13).padStart(19, '0'), bankName: d.bankName || (banelco ? 'BANELCO' : 'BANCO DESTINO'), name: d.name || 'TITULAR DESTINO', cuit: d.cuit || '27111222333', motivo: d.motivo || 'VAR', mismoTitular: d.mismoTitular || 'N', network: banelco ? 'BANELCO' : 'LINK', toTyp: d.toTyp || '10' };
  }

  function buildTransfer(ctx, b) {
    const fromTyp = ctx.accountType, dest = destination(ctx), toTyp = dest.toTyp;
    const reqHeader = ctx.terminal === 'ATM' ? '014000010' : '014000050';
    const legs = [];
    const code = decide(ctx, 'transfer', b);
    const auth = code === '00' ? num(Math.floor(100000 + Math.random() * 899999), 6) : '000000';
    const mk = (proc, legLabel, accountRole) => {
      const m = commonRequest(ctx, proc);
      m[55] = field55Transfer(ctx, dest, fromTyp, toTyp);
      m[102] = f(102, '28' + pad(LINK.accounts[fromTyp].number, 28), 'LLVAR ..X(28)', 'Cuenta origen (formato PBF)');
      m[103] = f(103, '28' + pad(dest.account, 28), 'LLVAR ..X(28)', 'Cuenta de acreditación (formato PBF)');
      m[126] = f(126, llvar(tokens([{ id: 'PE', data: tokenPE(ctx, dest, fromTyp, toTyp) }, { id: 'Q7', data: tokenQ7(dest) }]), 3), 'LLLVAR X(998)', 'Área de tokens: header "& " + token PE (156) + token Q7 (240)');
      if (accountRole === 'credit') {
        m[60] = f(60, '012' + (ctx.terminal === 'ATM' ? LINK.atmFiid : LINK.posAcquirerFiid) + LINK.network + '+000', 'LLLVAR g..100', 'Institución dueña de la terminal + red (5892/BANE si el origen es Banelco)');
        m[100] = f(100, '11' + pad(dest.fiid.padStart(11, '0'), 11), 'LLVAR ..9(11)', 'Institución receptora del crédito');
      }
      const list = [3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 41, 42, 43, 49, 52, 54, 55, 60, 61, 63, 100, 102, 103, 120, 124, 125, 126, 127];
      const req = message({ mti: '0200', header: reqHeader, rows: pick(m, list), label: `0200 ${proc.slice(0, 2)} · ${legLabel}`, leg: 'Requerimiento (0200 OUTPUT B24)', direction: 'SALIENTE' });
      const { header, map } = response0210(req, ctx, code);
      map[38] = f(38, auth, 'X(6)', 'Código de autorización del host');
      map[39] = f(39, code, 'X(2)', 'C-X-6 · ' + (RESULT[code] || ''));
      map[54] = f(54, '023' + pad('', 23), 'LLLVAR g..120', 'Anexo Transferencias: longitud 023 + blancos');
      map[90] = f(90, '0200' + pad(ctx.rrn, 12) + ctx.clock.mmdd + ctx.clock.hhmmss + '00' + ctx.clock.mmdd + pad('', 10), 'g 42', 'ORIG-TYP + ORIG-SEQ-NUM (campo 37) + fecha + hora + fecha de negocio + reservado');
      const resList = [3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 38, 39, 41, 43, 49, 54, 55, 60, 61, 90, 100, 102, 103, 127];
      const res = message({ mti: '0210', header, rows: pick(map, resList), label: `0210 ${proc.slice(0, 2)} · Respuesta ${accountRole === 'debit' ? 'banco origen' : 'banco destino'}`, leg: 'Respuesta (0210 INPUT B24)', direction: 'ENTRANTE', responseCode: code });
      return [req, res];
    };
    legs.push(...mk('09' + fromTyp + '00', 'Débito por transferencia · LINK → Banco origen', 'debit'));
    let note = '';
    if (code === '00' && dest.network === 'LINK') legs.push(...mk('2900' + toTyp, 'Orden de acreditación · LINK → Banco destino', 'credit'));
    else if (code === '00') note = 'Destino en red BANELCO (FIID 5892): el crédito lo cursa la otra red; el banco origen solo recibe el 09.';
    if (code === '00') { b[fromTyp] -= Number(ctx.amountCents); addHistory(b, fromTyp, 'TRANSF. ' + dest.network, Number(ctx.amountCents), -1); }
    return { messages: legs, code, auth, balanceCents: b[fromTyp], summary: code === '00' ? (note || 'Débito 09 en el banco origen y crédito 29 en el banco destino') : 'El banco origen rechazó el débito: no se envía la orden de acreditación 29' };
  }

  function buildDebin(ctx, b) {
    const fromTyp = ctx.accountType;
    const d = ctx.debin || {};
    const seller = cbuParts(d.sellerCbu || '0720999988000098765432');
    const data = { id: d.id || ('OSC' + Date.now().toString(36).toUpperCase()).padEnd(32, '0').slice(0, 32), concepto: d.concepto || 'VAR', fromTyp, buyerCbu: '311' + '0001' + '1' + num(LINK.accounts[fromTyp].number, 13) + '1', sellerCuit: d.sellerCuit || '30712345679', seller: { cbu: seller.cbu, fiid: seller.fiid, account: num(seller.account, 13).padStart(19, '0') } };
    const code = decide(ctx, 'debin', b);
    const c = ctx.clock;
    const base = (proc, role) => {
      const m = {
        2: f(2, llvar(ctx.pan), 'LLVAR ..9(19)', 'Número de tarjeta'),
        3: f(3, proc, 'X(6)', role === 'debit' ? 'F3XX00: débito DEBIN desde la cuenta XX' : 'F400XX: crédito DEBIN hacia la cuenta XX'),
        4: f(4, amt12(ctx.amountCents), '9(12)', 'Monto de la operación'),
        7: f(7, c.mmdd + c.hhmmss, '9(10)', 'Sin cambios'), 11: f(11, num(ctx.stan, 6), '9(6)', 'Sin cambios'),
        12: f(12, c.hhmmss, '9(6)', 'Sin cambios'), 13: f(13, c.mmdd, '9(4)', 'Sin cambios'), 15: f(15, c.mmdd, 'mmdd 9(4)', 'Fecha de negocio'),
        17: f(17, c.mmdd, '9(4)', 'Sin cambios'), 22: f(22, '000', '9(3)', 'Sin captura de tarjeta en terminal: el DEBIN lo cursa COELSA'),
        32: f(32, llvar(LINK.acquirerId), 'LLVAR 9(11)', 'Sin cambios'), 35: f(35, '37' + pad(track2(ctx), 37), 'X(37)', 'Sin cambios'),
        37: f(37, pad(ctx.rrn, 12), 'X(12)', 'Sin cambios'), 41: f(41, pad(ctx.termId || 'DEBINOSC', 16), 'X(16)', 'Sin cambios'),
        43: f(43, pad('COELSA DEBIN', 22) + pad('CAP. FED.', 13) + 'BUE' + 'AR', 'X(40)', 'Sin cambios'), 49: f(49, '032', '9(3)', '032 = Pesos'),
        52: f(52, 'FFFFFFFFFFFFFFFF', 'X(16)', 'Se envían 16 "F" (opcional por entidad)'),
        54: f(54, '023' + pad('', 12) + ' ' + pad('', 10), 'X(023)', 'AMT sin uso + TIPO-DEP blanco (con "B" sería Cobro de préstamo con transferencia)'),
        55: field55Debin(ctx, data),
        60: f(60, '012' + LINK.issuerFiid + LINK.network + '+000', 'X(15)', 'Sin cambios'),
        61: f(61, '013' + LINK.issuerFiid + LINK.network + proc.slice(2, 6) + 'P', 'X(16)', 'Sin cambios'),
        102: f(102, llvar(LINK.accounts[fromTyp].number), 'LLVAR X(28)', 'Cuenta desde donde se debitan los fondos (PBF)'),
        103: f(103, llvar(data.seller.account), 'LLVAR X(28)', 'Cuenta de acreditación del vendedor (PBF)'),
        126: f(126, llvar(tokens([{ id: 'QS', data: tokenQS(ctx, data) }]), 3), 'LLLVAR X(998)', 'Área de tokens: header + token QS (420)')
      };
      const list = [2, 3, 4, 7, 11, 12, 13, 15, 17, 22, 32, 35, 37, 41, 43, 49, 52, 54, 55, 60, 61, role === 'debit' ? 102 : 103, 126];
      const req = message({ mti: '0200', header: '014000050', rows: pick(m, list), label: `0200 ${proc.slice(0, 2)} · ${role === 'debit' ? 'Débito DEBIN · LINK → Banco comprador' : 'Crédito DEBIN · LINK → Banco vendedor'}`, leg: 'Requerimiento (0200)', direction: 'SALIENTE' });
      const map = Object.fromEntries(req.fields.filter(r => r.de !== 1).map(r => [r.de, { ...r, ref: 'Eco del 0200' }]));
      map[39] = f(39, code, '9(2)', 'C-X-6 · ' + (RESULT[code] || ''));
      map[45] = f(45, '76' + pad('SINTRACK1', 76), 'LLVAR X(76)', 'Sin Track 1: "SINTRACK1" + blancos');
      map[49] = f(49, code === '00' ? '032' : '000', '9(3)', 'Moneda de la cuenta, o ceros si es rechazo');
      map[54] = f(54, '023' + pad('', 23), 'X(023)', 'Longitud + blancos');
      const resList = [2, 3, 4, 7, 11, 12, 13, 15, 17, 22, 32, 35, 37, 39, 41, 45, 49, 54, 55, 60, 61, role === 'debit' ? 102 : 103];
      const res = message({ mti: '0210', header: '014000055', rows: pick(map, resList), label: `0210 ${proc.slice(0, 2)} · Respuesta ${role === 'debit' ? 'banco comprador' : 'banco vendedor'}`, leg: 'Respuesta (0210)', direction: 'ENTRANTE', responseCode: code });
      return [req, res];
    };
    const msgs = base('F3' + fromTyp + '00', 'debit');
    if (code === '00') { msgs.push(...base('F400' + '10', 'credit')); b[fromTyp] -= Number(ctx.amountCents); addHistory(b, fromTyp, 'DEBIN', Number(ctx.amountCents), -1); }
    return { messages: msgs, code, balanceCents: b[fromTyp], debinId: data.id, summary: code === '00' ? 'Débito F3 en el banco del comprador y crédito F4 en el banco del vendedor' : 'El banco del comprador rechazó el débito F3: no se envía el crédito F4' };
  }

  /* ===================== rc.1.25 · Operaciones ATM, compras Maestro (POS) y reversas 0420/0430 ===================== */
  // Cada operación: código C-X-5, cuenta desde / hacia, efecto en saldos y campos propios (54, 48, 103, 123, 125, 127).
  const OPS = {
    withdrawal_usd: { label: 'Extracción en dólares', short: 'EXTRACCIÓN U$S', proc: c => '01' + c.accountType + '02', currency: '840', debit: true, accounts: ['15', '07'] },
    cash_advance: { label: 'Adelanto de efectivo (tarjeta de crédito)', short: 'ADELANTO DE EFECTIVO', proc: () => '013000', debit: true, fixedAccount: '30' },
    movements: { label: 'Últimos movimientos', short: 'ÚLTIMOS MOVIMIENTOS', proc: c => '94' + c.accountType + '00', noAmount: true },
    own_transfer: { label: 'Transferencia entre cuentas propias', short: 'TRANSFERENCIA PROPIA', proc: c => '40' + c.accountType + c.toAccount, debit: true },
    deposit: { label: 'Depósito en cuenta propia', short: 'DEPÓSITO', proc: c => '2100' + c.accountType, deposit: true },
    deposit_third: { label: 'Depósito a cuenta de terceros', short: 'DEPÓSITO A TERCEROS', proc: c => '2200' + (c.destination?.toTyp || '10'), deposit: true, third: true },
    card_payment: { label: 'Pago de resumen de tarjeta con débito en cuenta', short: 'PAGO DE RESUMEN', proc: c => '50' + c.accountType + '30', debit: true, card: true },
    card_payment_cash: { label: 'Pago de resumen de tarjeta en efectivo', short: 'PAGO DE RESUMEN (EFECTIVO)', proc: () => '500030', deposit: true, card: true },
    fx_rate: { label: 'Consulta de tipo de cambio', short: 'TIPO DE CAMBIO', proc: () => '350000', noAmount: true, noAccount: true },
    pin_change: { label: 'Cambio de PIN', short: 'CAMBIO DE PIN', proc: () => '320000', noAmount: true, noAccount: true },
    purchase: { label: 'Compra con débito (Maestro)', short: 'COMPRA MAESTRO', proc: c => '71' + c.accountType + '00', debit: true, pos: true },
    void: { label: 'Anulación de compra', short: 'ANULACIÓN', proc: c => '72' + c.accountType + '00', credit: true, pos: true, original: 'purchase' },
    pos_balance: { label: 'Consulta de saldo (Maestro)', short: 'CONSULTA MAESTRO', proc: c => '73' + c.accountType + '00', noAmount: true, pos: true },
    refund: { label: 'Devolución de compra', short: 'DEVOLUCIÓN', proc: c => '74' + c.accountType + '00', credit: true, pos: true, original: 'purchase', origRef: true },
    refund_void: { label: 'Anulación de devolución', short: 'ANULACIÓN DE DEVOLUCIÓN', proc: c => '75' + c.accountType + '00', debit: true, pos: true, original: 'refund' },
    cashback: { label: 'Compra con cash-back', short: 'COMPRA + CASH-BACK', proc: c => '76' + c.accountType + '00', debit: true, pos: true, cashback: true },
    cashback_void: { label: 'Anulación de compra con cash-back', short: 'ANULACIÓN CASH-BACK', proc: c => '77' + c.accountType + '00', credit: true, pos: true, original: 'cashback', cashback: true },
    preauth: { label: 'Preautorización', short: 'PREAUTORIZACIÓN', proc: c => '78' + c.accountType + '00', hold: true, pos: true },
    preauth_complete: { label: 'Preautorización finalizada', short: 'PREAUTORIZACIÓN FINALIZADA', proc: c => '79' + c.accountType + '00', complete: true, pos: true, original: 'preauth' }
  };
  /* ===================== rc.1.27 · Pago de servicios (PAS), plazo fijo, gestiones y mensajes a la institución ===================== */
  // Campo 54 de PAS (C-X-4-01): longitud 023 + CDE-ENTE X(3) + CDE-CUSTOM X(19) + NRO-OPC 9(1).
  const pas54 = c => f(54, '023' + pad(c.pas?.ente || '002', 3) + pad(c.pas?.cliente || '0001234567', 19) + num(c.pas?.opcion || 1, 1), 'LLLVAR g..120', 'Pago automático de servicios: longitud 023 + código de ente 3 + código de cliente 19 + opción de la deuda 1');
  // Respuesta PAS (C-X-4-03): longitud 100 + ente + cliente (iguales al 0200) + CTA-ANIO 9(5) + blancos 73.
  const pas54res = c => f(54, '100' + pad(c.pas?.ente || '002', 3) + pad(c.pas?.cliente || '0001234567', 19) + num((new Date().getMonth() + 1) * 1000 + new Date().getFullYear() % 100, 5) + pad('', 73), 'LLLVAR g..120', 'PAS: longitud 100 + ente + cliente (iguales al 0200) + cuota y año 9(5) + blancos');
  // Plazo fijo (C-X-4-01 campo 55 / C-X-4-03 campo 54): longitud 120 + plazo 3 + importe 10 + renovación 1 + auto-renovación 1 + tipo 1 + opción 28 + blancos 76.
  const pfData = (c, withAmountDecimals) => pad(num(c.pf?.plazo || 30, 3), 3) + num(withAmountDecimals ? Number(c.amountCents || 0) : Math.floor(Number(c.amountCents || 0) / 100), 10) + pad(c.pf?.renovacion || 'N', 1) + pad(c.pf?.auto || ' ', 1) + pad(c.pf?.tipo || 'T', 1) + pad(c.pf?.opcion || '', 28) + pad('', 76);
  const pf55 = c => f(55, '120' + pfData(c, false), 'LLLVAR g..360', 'Plazo fijo: longitud 120 + plazo en días 3 + importe sin decimales 10 + forma de renovación (N/T/P) + auto-renovación (S/A) + tipo (T/P/V/B/C) + opción 28 + blancos');
  const pf54res = c => f(54, '120' + pfData(c, true), 'LLLVAR g..120', 'Plazo fijo: longitud 120 + plazo + importe (con 2 decimales) + renovación + auto-renovación + tipo + opción + blancos');
  // Pay Key / compra en ATM (código 17): longitud 038 + empresa 3 + producto 3 + artículo 32.
  const payKey55 = c => f(55, '038' + pad(c.payKey?.empresa || '001', 3) + pad(c.payKey?.producto || '001', 3) + pad(c.payKey?.articulo || 'RECARGA CELULAR', 32), 'LLLVAR g..360', 'Pay Key (17): longitud 038 + código de empresa 3 + producto 3 + artículo 32');
  // Consulta de pago on line (69): longitud 199 + DATA-TYPE 01 + datos generales de la transacción original.
  const online69 = c => { const k = c.clock, o = c.original || {}; return f(55, '199' + '01' + pad(LINK.network, 4) + LINK.atmFiid + pad(c.termId || 'S1AXOSC0001', 16) + LINK.issuerFiid + pad(c.pan, 19) + num(String(o.rrn || c.rrn).replace(/\D/g, ''), 12) + k.yymmdd + k.hhmmss + '00' + k.yymmdd + pad(o.proc || '01' + (c.accountType || '10') + '00', 6) + num(LINK.accounts[c.accountType || '10'].number, 19) + amt12(o.amountCents || 0) + pad('', 2) + pad('', 79), 'LLLVAR g..360', 'Consulta de pago on line: longitud 199 + DATA-TYPE 01 + línea, FIID y terminal + FIID emisor + PAN + secuencia + fecha/hora/fecha de negocio + código + cuenta + importe + tipo de terminal + datos específicos'); };
  // Ticket (campo 125 de la 0210): misma estructura que Últimos movimientos (C-X-4-03).
  const ticket125 = (c, lines) => { const body = lines.map(l => pad(l, 40)).join('').padEnd(360, ' ').slice(0, 360); return f(125, '372' + '1P' + c.clock.yymmdd + '02' + '40' + body, 'LLLVAR', 'Información para imprimir en el ticket: misma estructura que Últimos movimientos (página + fecha + cabecera + líneas de 40)'); };
  const ENTES = { '002': 'EDENOR', '003': 'METROGAS', '004': 'AYSA', '005': 'TELECOM', '006': 'ABL CABA' };
  const pasLines = c => { const e = c.pas?.ente || '002'; return [`SERVICIO ${e} ${ENTES[e] || 'ENTE ' + e}`, `CLIENTE ${c.pas?.cliente || '0001234567'}`]; };
  Object.assign(OPS, {
    // Pago de servicios (C-X-5: 80 a 90, 8K a 8P)
    service_inquiry: { group: 'services', label: 'Consulta / adhesión de vencimiento de servicio', short: 'CONSULTA DE SERVICIO', proc: () => '800000', noAmount: true, noAccount: true, req54: pas54, res54: pas54res, res125: c => [...pasLines(c), 'VENCIMIENTO 1: 10/11  $   18.540,00', 'VENCIMIENTO 2: 20/11  $   19.467,00', 'ADHESION REGISTRADA'] },
    service_pay: { group: 'services', label: 'Pago de servicio con consulta previa (débito en cuenta)', short: 'PAGO DE SERVICIO', proc: c => '81' + c.accountType + '00', debit: true, req54: pas54, res54: pas54res, res125: c => [...pasLines(c), `PAGADO $ ${(Number(c.amountCents) / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 'GUARDE ESTE COMPROBANTE'] },
    service_codes: { group: 'services', label: 'Consulta de códigos abreviados de la tarjeta', short: 'CÓDIGOS ABREVIADOS', proc: () => '820000', noAmount: true, noAccount: true, req54: pas54, res54: pas54res, res125: () => ['CODIGOS ABREVIADOS ASOCIADOS', '01 EDENOR      0001234567', '02 METROGAS    0009876543', '03 TELECOM     0005551234'] },
    service_last: { group: 'services', label: 'Consulta de últimos pagos de un servicio', short: 'ÚLTIMOS PAGOS', proc: () => '830000', noAmount: true, noAccount: true, req54: pas54, res54: pas54res, res125: c => [...pasLines(c), '10/09  $   17.320,00', '10/08  $   16.904,00', '10/07  $   15.880,00'] },
    service_pending: { group: 'services', label: 'Consulta de vencimientos pendientes', short: 'VENCIMIENTOS PENDIENTES', proc: () => '840000', noAmount: true, noAccount: true, req54: pas54, res54: pas54res, res125: () => ['VENCIMIENTOS PENDIENTES', 'EDENOR    10/11  $   18.540,00', 'METROGAS  15/11  $    9.210,00'] },
    service_unlink: { group: 'services', label: 'Baja de asociación del servicio a la tarjeta', short: 'BAJA DE SERVICIO', proc: () => '850000', noAmount: true, noAccount: true, req54: pas54, res54: pas54res, res125: c => [...pasLines(c), 'BAJA DE ASOCIACION REGISTRADA'] },
    service_quick: { group: 'services', label: 'Pago rápido sin consulta previa (86)', short: 'PAGO RÁPIDO', proc: () => '860000', debit: true, req54: pas54, res54: pas54res, res125: c => [...pasLines(c), 'PAGO RAPIDO REGISTRADO'] },
    service_cash: { group: 'services', label: 'Pago de servicio en efectivo (87)', short: 'PAGO EN EFECTIVO', proc: () => '870000', cashIn: true, noAccount: true, req54: pas54, res54: pas54res, res125: c => [...pasLines(c), 'PAGO EN EFECTIVO REGISTRADO'] },
    card_payment_pas: { group: 'services', label: 'Pago de resumen de tarjeta con débito (88)', short: 'PAGO DE RESUMEN PAS', proc: c => '88' + c.accountType + '00', debit: true, card: true, req54: pas54, res54: pas54res, res125: () => ['PAGO DE RESUMEN DE TARJETA', 'IMPUTADO EN LA CUENTA TARJETA'] },
    pas_inquiry: { group: 'services', label: 'Consulta / adhesión de vencimiento (solo PAS · 89)', short: 'CONSULTA PAS', proc: () => '890000', noAmount: true, noAccount: true, req54: pas54, res54: pas54res, res125: c => [...pasLines(c), 'VENCIMIENTO 10/11  $   18.540,00'] },
    pas_categories: { group: 'services', label: 'Consulta de rubros (8K)', short: 'CONSULTA DE RUBROS', proc: () => '8K0000', noAmount: true, noAccount: true, res125: () => ['RUBROS', '01 ELECTRICIDAD', '02 GAS', '03 AGUA', '04 TELEFONIA', '05 IMPUESTOS'] },
    pas_companies: { group: 'services', label: 'Consulta de empresas (8L)', short: 'CONSULTA DE EMPRESAS', proc: () => '8L0000', noAmount: true, noAccount: true, res125: () => ['EMPRESAS DEL RUBRO', '002 EDENOR', '003 METROGAS', '004 AYSA', '005 TELECOM'] },
    pas_adhesions: { group: 'services', label: 'Consulta de adhesiones (8M)', short: 'CONSULTA DE ADHESIONES', proc: () => '8M0000', noAmount: true, noAccount: true, res125: () => ['ADHESIONES VIGENTES', '002 EDENOR    0001234567', '003 METROGAS  0009876543'] },
    pas_unsubscribe: { group: 'services', label: 'Baja de adhesión (8P)', short: 'BAJA DE ADHESIÓN', proc: () => '8P0000', noAmount: true, noAccount: true, req54: pas54, res125: c => [...pasLines(c), 'BAJA DE ADHESION REGISTRADA'] },
    service_check: { group: 'services', label: 'Pago de servicios con cheque (90)', short: 'PAGO CON CHEQUE', proc: () => '900000', cashIn: true, noAccount: true, res125: () => ['PAGO DE SERVICIOS CON CHEQUE', 'SUJETO A ACREDITACION DEL CHEQUE'] },
    service_debit: { group: 'services', label: 'Pago de servicios con débito en cuenta (90XX20)', short: 'PAGO CON DÉBITO', proc: c => '90' + c.accountType + '20', debit: true, res125: () => ['PAGO DE SERVICIOS CON DEBITO'] },
    service_order: { group: 'services', label: 'Pago de servicios con orden de débito (90XX00)', short: 'ORDEN DE DÉBITO', proc: c => '90' + c.accountType + '00', debit: true, req54: c => f(54, '023' + pad('', 13) + num(c.pas?.comprobantes || 1, 2) + pad('', 8), 'LLLVAR g..120', 'Orden de débito: longitud 023 + blancos 13 + cantidad de comprobantes 9(2) + blancos 8'), res125: () => ['ORDEN DE DEBITO REGISTRADA'] },
    // Plazo fijo (C-X-5: 18, 37, 38, 63, 68)
    pf_rates: { group: 'investments', label: 'Consulta publicitaria de plazos y tasas (37)', short: 'PLAZOS Y TASAS', proc: () => '370000', noAmount: true, noAccount: true, req55: pf55, res54: pf54res, res125: () => ['PLAZO FIJO TRADICIONAL', ' 30 DIAS  TNA 32,00%', ' 60 DIAS  TNA 33,50%', ' 90 DIAS  TNA 34,00%', '180 DIAS  TNA 35,25%'] },
    pf_invest: { group: 'investments', label: 'Constitución de plazo fijo (18)', short: 'PLAZO FIJO', proc: c => '18' + c.accountType + '00', debit: true, req55: pf55, res54: pf54res, res125: c => ['CONSTITUCION DE PLAZO FIJO', `CAPITAL $ ${(Number(c.amountCents) / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, `PLAZO ${c.pf?.plazo || 30} DIAS  TNA 32,00%`, `RENOVACION ${{ N: 'NO RENOVABLE', T: 'TOTAL', P: 'PARCIAL' }[c.pf?.renovacion || 'N']}`, 'CERTIFICADO 000123456'] },
    pf_balance: { group: 'investments', label: 'Consulta de saldo de plazo fijo (38)', short: 'SALDO PLAZO FIJO', proc: c => '38' + c.accountType + '00', noAmount: true, req55: pf55, res54: pf54res, res125: () => ['PLAZOS FIJOS VIGENTES', 'CERT 000123456  VTO 12/11', 'CAPITAL $   500.000,00', 'INTERES $    13.150,68'] },
    pf_account: { group: 'investments', label: 'Cambio de cuenta asociada al plazo fijo (63)', short: 'CUENTA DEL PLAZO FIJO', proc: c => '63' + c.accountType + (c.accountType === '10' ? '20' : '10'), noAmount: true, req55: pf55, res54: pf54res, res125: () => ['CAMBIO DE CUENTA ASOCIADA', 'REGISTRADO PARA EL VENCIMIENTO'] },
    pf_renewal: { group: 'investments', label: 'Suspensión / activación de renovación automática (68)', short: 'RENOVACIÓN AUTOMÁTICA', proc: c => '68' + c.accountType + '00', noAmount: true, req55: pf55, res54: pf54res, res125: c => [c.pf?.auto === 'S' ? 'RENOVACION AUTOMATICA SUSPENDIDA' : 'RENOVACION AUTOMATICA ACTIVADA'] },
    // Gestiones y mensajes a la institución
    covisur: { group: 'admin', label: 'Efectivo rápido COVISUR (11)', short: 'EFECTIVO RÁPIDO', proc: c => '11' + c.accountType + '00', debit: true },
    atm_purchase: { group: 'admin', label: 'Compra en ATM · Pay Key (17)', short: 'COMPRA EN ATM', proc: c => '17' + c.accountType + '00', debit: true, req55: payKey55, res125: c => ['COMPRA EN ATM', `ARTICULO ${c.payKey?.articulo || 'RECARGA CELULAR'}`] },
    top_up: { group: 'admin', label: 'Carga (1C)', short: 'CARGA', proc: () => '1C0000', debit: true },
    cit_change: { group: 'admin', label: 'Cambio de CIT · clave telefónica (33)', short: 'CAMBIO DE CIT', proc: () => '330000', noAmount: true, noAccount: true, req54: () => f(54, '023' + (num(Math.floor(Math.random() * 9999), 4) + 'FFFFFFFFFFFF') + pad('', 7), 'LLLVAR g..120', 'Cambio de CIT: nuevo PIN offset X(16) + blancos (formato de cambio de PIN / CIT del registro 0220)') },
    homebanking: { group: 'admin', label: 'Asignación de usuario, clave y PIN de Home Banking (34)', short: 'HOME BANKING', proc: () => '340000', noAmount: true, noAccount: true, res127: () => f(127, '043' + pad('HBNET/0001234', 28) + pad('K7M2Q9X4', 8) + num(Math.floor(100000 + Math.random() * 899999), 6) + ' ', 'LLLVAR g..X(200)', 'Asignación de usuario Home Banking: usuario de acceso 28 + clave de ingreso 8 + PIN de Home Banking 9(6) + blanco') },
    verify_credit: { group: 'admin', label: 'Verificación de cuenta de crédito por transferencia (39)', short: 'VERIFICACIÓN DE CUENTA', proc: c => '39' + c.accountType + '00', noAmount: true, transfer55: true, res125: () => ['CUENTA DE CREDITO VERIFICADA'] },
    status_inquiry: { group: 'admin', label: 'Consulta de estado (3A)', short: 'CONSULTA DE ESTADO', proc: () => '3A0000', noAmount: true, noAccount: true, res125: () => ['CONSULTA DE ESTADO', 'SIN NOVEDADES'] },
    prizes: { group: 'admin', label: 'Consulta de premios (3B)', short: 'CONSULTA DE PREMIOS', proc: () => '3B0000', noAmount: true, noAccount: true, res125: () => ['PUNTOS ACUMULADOS 1.250'] },
    certificates: { group: 'admin', label: 'Emisión de certificados (3C)', short: 'CERTIFICADOS', proc: () => '3C0000', noAmount: true, noAccount: true, res125: () => ['CERTIFICADO EMITIDO', 'RETIRAR EN SUCURSAL'] },
    base_change: { group: 'admin', label: 'Cambio de número de base (3D)', short: 'CAMBIO DE BASE', proc: () => '3D0000', noAmount: true, noAccount: true, res125: () => ['CAMBIO DE NUMERO DE BASE REGISTRADO'] },
    checkbook_usd: { group: 'requests', label: 'Solicitud de chequera cta. cte. U$S (610207)', short: 'CHEQUERA U$S', proc: () => '610207', noAmount: true, noAccount: true, res125: () => ['SOLICITUD DE CHEQUERA REGISTRADA'] },
    checkbook_deferred: { group: 'requests', label: 'Solicitud de chequera de pago diferido (610210)', short: 'CHEQUERA DIFERIDA', proc: () => '610210', noAmount: true, noAccount: true, res125: () => ['SOLICITUD DE CHEQUERA REGISTRADA'] },
    deposit_slips: { group: 'requests', label: 'Solicitud de boletas de depósito CA $ (610310)', short: 'BOLETAS DE DEPÓSITO', proc: () => '610310', noAmount: true, noAccount: true, res125: () => ['SOLICITUD DE BOLETAS REGISTRADA'] },
    insurance_params: { group: 'requests', label: 'Consulta de seguro contra robo en ATM (62)', short: 'SEGURO ATM', proc: () => '620000', noAmount: true, noAccount: true, res125: () => ['SEGURO CONTRA ROBO EN ATM', 'COBERTURA $ 300.000', 'COSTO MENSUAL $ 1.200,00'] },
    insurance_join: { group: 'requests', label: 'Adhesión al seguro contra robo en ATM (64)', short: 'ADHESIÓN SEGURO', proc: c => '64' + c.accountType + '00', noAmount: true, res125: () => ['ADHESION AL SEGURO REGISTRADA'] },
    auto_debits: { group: 'requests', label: 'Consulta de últimos débitos automáticos (66)', short: 'DÉBITOS AUTOMÁTICOS', proc: () => '660000', noAmount: true, noAccount: true, res125: () => ['ULTIMOS DEBITOS AUTOMATICOS', '05/10 TELECOM   $  12.400,00', '03/10 SEGURO    $   1.200,00'] },
    online_payment_inquiry: { group: 'requests', label: 'Consulta de pago on line (69)', short: 'CONSULTA PAGO ON LINE', proc: c => '69' + c.accountType + '00', noAmount: true, req55: online69, res55: online69 },
    other_requests: { group: 'requests', label: 'Mensajes a la institución · otras solicitudes (91)', short: 'OTRAS SOLICITUDES', proc: () => '910000', noAmount: true, noAccount: true, res125: () => ['SOLICITUD RECIBIDA POR LA INSTITUCION'] },
    address_change: { group: 'requests', label: 'Mensajes a la institución · cambio de domicilio (912000)', short: 'CAMBIO DE DOMICILIO', proc: () => '912000', noAmount: true, noAccount: true, res125: () => ['CAMBIO DE DOMICILIO SOLICITADO'] },
    statement_request: { group: 'requests', label: 'Solicitud de extracto (93)', short: 'SOLICITUD DE EXTRACTO', proc: c => '9301' + ({ '20': '01', '10': '11', '07': '07', '15': '15' }[c.accountType] || '11'), noAmount: true, res125: () => ['SOLICITUD DE EXTRACTO REGISTRADA'] }
  });
  Object.entries(OPS).forEach(([k, o]) => { TX[k] = { code: o.proc({ accountType: 'XX', toAccount: 'YY', destination: { toTyp: 'YY' } }).slice(0, 2), label: o.label, short: o.short }; });
  const REVERSAL = { '17': 'REVERSADA POR TRANSACCIÓN CANCELADA', '32': 'REVERSADA POR PAGO PARCIAL', '68': 'REVERSADA POR TIMEOUT', '21': 'REVERSADA POR ERROR DE HARDWARE', '20': 'REVERSADA POR COMANDO RECHAZADO', '22': 'REVERSADA POR TRANSACCIÓN SOSPECHOSA', '82': 'REVERSADA POR DESTINO NO DISPONIBLE' };
  const money = (cents, cur = '032') => (Number(cents || 0) / 100).toLocaleString('es-AR', { style: 'currency', currency: cur === '840' ? 'USD' : 'ARS' });

  function fxField127Request(b) {
    // Si la consulta de tipo de cambio fue la transacción anterior y dentro del último minuto, se informan sus valores (C-X-4-01 campo 127).
    const fx = b.fx && Date.now() - b.fx.at < 60000 ? b.fx : null;
    const r = v => num(Math.round(v * 1000), 8);
    return f(127, '043' + '0000' + (fx ? r(fx.buy) + r(fx.sell) + r(fx.sell) + r(1) : '0'.repeat(32)) + '0'.repeat(7), 'LLLVAR g..X(200)', fx ? 'Región 0000 + tipos de cambio de la consulta 35 hecha en el último minuto' : 'Región 0000 (Capital y GBA) + tipos de cambio en ceros');
  }
  function statement125(ctx, b, t) {
    // 125 · Statement print data: longitud 372 + indicador de página (1P) + fecha AAMMDD + líneas de cabecera + caracteres por línea + 360 de líneas.
    const hist = (b.history || []).filter(h => h.acct === t).slice(-7).reverse();
    const lines = [pad('FECHA  CONCEPTO              IMPORTE', 40), pad('-'.repeat(38), 40)];
    hist.forEach(h => lines.push(pad(`${h.date} ${pad(h.concept, 19)}${(h.sign < 0 ? '-' : '+') + num(h.cents / 100 | 0, 9)}`, 40)));
    if (!hist.length) lines.push(pad('SIN MOVIMIENTOS EN EL PERIODO', 40));
    const body = lines.map(l => pad(l, 40)).join('').padEnd(360, ' ').slice(0, 360);
    return f(125, '372' + '1P' + ctx.clock.yymmdd + '02' + '40' + body, 'LLLVAR', 'Statement print data: 372 = indicador de página 1P + fecha AAMMDD + 02 líneas de cabecera + 40 caracteres por línea + 360 de líneas');
  }
  function addHistory(b, acct, concept, cents, sign) {
    b.history = b.history || [];
    const d = new Date(), p = n => String(n).padStart(2, '0');
    b.history.push({ acct, concept, cents: Math.round(cents), sign, date: p(d.getDate()) + '/' + p(d.getMonth() + 1) });
    if (b.history.length > 60) b.history = b.history.slice(-60);
  }

  function buildOp(kind, ctx, b) {
    const o = OPS[kind];
    if (o.fixedAccount) ctx.accountType = o.fixedAccount;
    if (o.accounts && !o.accounts.includes(ctx.accountType)) ctx.accountType = o.accounts[0];
    if (kind === 'own_transfer') {
      const pair = { '10': '20', '20': '10', '15': '07', '07': '15' };
      if (!ctx.toAccount || ctx.toAccount === ctx.accountType || !LINK.accounts[ctx.toAccount] || LINK.accounts[ctx.toAccount].currency !== LINK.accounts[ctx.accountType].currency) ctx.toAccount = pair[ctx.accountType];
    }
    const t = ctx.accountType, acct = LINK.accounts[t] || LINK.accounts['10'];
    const cur = o.currency || acct.currency || '032';
    const proc = o.proc(ctx);
    const reqHeader = ctx.terminal === 'ATM' ? '014000010' : '014000050';
    const m = commonRequest(ctx, proc);
    const cash = Number(ctx.cashbackCents || 0);
    const amount = o.noAmount ? 0 : Number(ctx.amountCents || 0) + (o.cashback ? cash : 0);
    m[4] = f(4, amt12(amount), '9(12)', o.noAmount ? 'Sin importe: en ceros' : o.cashback ? 'Compra + efectivo (el efectivo viaja también en el campo 54)' : '10 enteros + 2 decimales');
    m[49] = f(49, cur, '9(3)', cur === '840' ? '840 = Dólares' : '032 = Pesos');
    m[102] = f(102, '28' + pad(o.noAccount ? '' : acct.number, 28), 'LLVAR ..X(28)', o.noAccount ? 'Sin cuenta' : 'Cuenta desde (' + acct.label + ')');
    let toNumber = '', toLabel = 'Sin cuenta hacia';
    if (kind === 'own_transfer') { toNumber = LINK.accounts[ctx.toAccount].number; toLabel = 'Cuenta hacia (' + LINK.accounts[ctx.toAccount].label + ')'; }
    if (o.deposit && !o.third && !o.card) { toNumber = acct.number; toLabel = 'Cuenta donde se acredita el depósito'; m[102] = f(102, '28' + pad('', 28), 'LLVAR ..X(28)', 'Sin cuenta desde (depósito)'); }
    if (o.third) { const d = cbuParts(ctx.destination?.cbu || '0140999901000012345678'); toNumber = num(d.account, 19); toLabel = 'Cuenta de terceros donde se acredita'; m[102] = f(102, '28' + pad('', 28), 'LLVAR ..X(28)', 'Sin cuenta desde (depósito)'); }
    if (o.card) { toNumber = LINK.accounts['30'].number; toLabel = 'Cuenta tarjeta de crédito (30)'; if (kind === 'card_payment_cash') m[102] = f(102, '28' + pad('', 28), 'LLVAR ..X(28)', 'Sin cuenta desde (pago en efectivo)'); }
    m[103] = f(103, '28' + pad(toNumber, 28), 'LLVAR ..X(28)', toLabel);
    if (o.deposit) { const ty = ctx.depositType === 'C' ? (cur === '840' ? 'W' : 'C') : (cur === '840' ? 'U' : 'E'); m[54] = f(54, '023' + pad('', 12) + ty + pad('', 10), 'LLLVAR g..120', `Depósitos: blancos + TIPO-DEP "${ty}" (${ty === 'E' || ty === 'U' ? 'efectivo' : 'cheque'}) + blancos`); }
    if (kind === 'pin_change') { const off = (num(Math.floor(Math.random() * 9999), 4) + 'FFFFFFFFFFFF'); m[54] = f(54, '023' + off + pad('', 7), 'LLLVAR g..120', 'Cambio de PIN encriptado: nuevo PIN offset X(16) + blancos (el PIN nunca viaja en claro)'); ctx.newPinOffset = off; }
    if (o.cashback) m[54] = f(54, '023' + num(cash, 12) + pad('', 11), 'LLLVAR g..120', 'Cash-back: importe del retiro en efectivo 9(10)v99 + blancos');
    if (['withdrawal_usd', 'own_transfer'].includes(kind) || cur === '840') m[127] = fxField127Request(b);
    const list = [3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 41, 42, 43, 49, 52, 54, 60, 61, 63, 100, 102, 103, 120, 124, 125, 127];
    // rc.1.27 · Campos propios de PAS / plazo fijo / Pay Key / consulta de pago on line (C-X-4-01).
    if (o.req54) m[54] = o.req54(ctx);
    if (o.req55) { m[55] = o.req55(ctx); list.push(55); }
    if (o.transfer55) { const dest = destination(ctx); m[55] = field55Transfer(ctx, dest, t, dest.toTyp); m[103] = f(103, '28' + pad(dest.account, 28), 'LLVAR ..X(28)', 'Cuenta de crédito a verificar'); list.push(55); }
    if (ctx.terminal === 'POS') { m[48] = posField48(ctx, o.origRef ? ctx.original : null); list.push(48); }
    const req = message({ mti: '0200', header: reqHeader, rows: pick(m, list), label: `0200 ${o.short} · LINK → Host emisor`, leg: 'Requerimiento (0200 OUTPUT B24)', direction: 'SALIENTE' });

    // Decisión del host emisor
    let code = SCENARIOS.includes(ctx.scenario) ? ctx.scenario : '00';
    if (ctx.pinOk === false && code === '00') code = '55';
    if (code === '00' && (o.debit || o.hold) && amount > Number(b[t] || 0)) code = '51';
    if (['80', '81', '82', '86'].includes(code) && o.group !== 'services') code = '00';
    if (code === '68' && o.group !== 'investments') code = '00';
    if (code === '00' && o.original && !ctx.original) code = '12';
    if (code === '00' && o.complete && ctx.original && amount > Number(ctx.original.amountCents || 0) * 1.2) code = '13';
    // Efecto en saldos
    let note = '';
    if (code === '00') {
      if (o.debit) { b[t] -= amount; addHistory(b, t, o.short, amount, -1); }
      if (o.credit) { b[t] += amount; addHistory(b, t, o.short, amount, 1); }
      if (kind === 'own_transfer') { b[ctx.toAccount] += amount; addHistory(b, ctx.toAccount, 'TRANSF. PROPIA', amount, 1); }
      if (kind === 'deposit' && ctx.depositType !== 'C') { b[t] += amount; addHistory(b, t, 'DEPOSITO EFECTIVO', amount, 1); }
      if (kind === 'deposit' && ctx.depositType === 'C') note = 'Depósito con cheque: se acredita cuando el cheque se compensa (campo 123 en ceros).';
      if (o.card) { b.cardDebt = Math.max(0, Number(b.cardDebt || 0) - amount); b['30'] += amount; }
      if (o.hold) { b[t] -= amount; b.holds = (b.holds || 0) + amount; addHistory(b, t, 'PREAUTORIZACION', amount, -1); }
      if (o.complete) { const held = Number(ctx.original?.amountCents || 0); b[t] += held; b.holds = Math.max(0, (b.holds || 0) - held); b[t] -= amount; addHistory(b, t, 'PREAUT. FINALIZADA', amount, -1); note = `Se libera la retención de ${money(held)} y se debita el importe final ${money(amount)}.`; }
      if (kind === 'fx_rate') { const buy = 1180 + Math.round(Math.random() * 40), sell = buy + 40 + Math.round(Math.random() * 10); b.fx = { buy, sell, at: Date.now() }; note = `Comprador ${buy.toLocaleString('es-AR')} / vendedor ${sell.toLocaleString('es-AR')}. Si en el próximo minuto se opera en dólares, el 0200 lleva estos valores en el campo 127.`; }
      if (kind === 'pin_change') note = 'El host guarda el nuevo PIN offset recibido en el campo 54.';
      if (o.card && kind === 'card_payment_pas') note = 'Pago de resumen 88: débito en la cuenta e imputación en la cuenta tarjeta.';
      if (o.res125) note = note || (o.label + ' aprobada · el ticket viaja en el campo 125');
    }
    const bal = Number(b[t] || 0);
    const { header, map } = response0210(req, ctx, code);
    map[39] = f(39, code, 'X(2)', 'C-X-6 · ' + (RESULT[code] || ''));
    map[44] = f(44, '25' + '2' + amt12(o.noAccount ? 0 : bal) + amt12(o.noAccount ? 0 : bal), 'LLVAR ..X(25)', 'Longitud 25 + "2" + saldo de apertura + saldo disponible');
    map[54] = f(54, '100' + pad('', 12) + num(Math.max(0, 6 - (b.withdrawalsToday || 0)), 2) + amt12(bal) + amt12(t === '30' ? bal : 0) + amt12(0) + clock().yymmdd + '000000' + num(0, 10) + num(0, 10) + num(0, 10) + num(0, 8), 'LLLVAR g..120', 'Longitud 100: extracciones disponibles, disponible compras, efectivo disponible, fecha, etc.');
    map[122] = f(122, '011' + pad(LINK.issuerFiid, 11), 'LLLVAR g..150', 'Código interno de la institución emisora');
    map[123] = f(123, '012' + amt12(code === '00' && kind === 'deposit' && ctx.depositType !== 'C' ? amount : 0), 'LLLVAR g..455', kind === 'deposit' ? 'Monto del depósito que se suma al disponible (efectivo; con cheque queda en ceros)' : 'Monto de depósito: ceros');
    map[125] = kind === 'movements' && code === '00' ? statement125(ctx, b, t) : f(125, '001' + '0', 'LLLVAR g..680', 'Indicador de cuenta: 0');
    const fx = b.fx; const r8 = v => num(Math.round(v * 1000), 8);
    map[127] = f(127, '043' + (kind === 'fx_rate' && code === '00' ? '1' + r8(fx.buy) + r8(fx.sell) + r8(fx.sell) + r8(1) : '0' + '0'.repeat(32)) + pad('', 10), 'LLLVAR g..X(200)', kind === 'fx_rate' ? 'Tipo de cambio aplicado + comprador + vendedor (9(05)v999) + blancos' : 'Tipo de cambio aplicado + tipos de cambio + blancos');
    const resList = [3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 39, 41, 42, 44, 49, 54, 60, 61, 100, 102, 103, 122, 123, 124, 125, 127];
    if (o.res54) map[54] = o.res54(ctx, code, b);
    if (o.res55 || o.transfer55) { map[55] = o.res55 ? o.res55(ctx) : { ...m[55], ref: 'Eco del 0200' }; resList.push(55); resList.sort((a, b2) => a - b2); }
    if (o.res125 && code === '00') map[125] = ticket125(ctx, o.res125(ctx));
    if (o.res127 && code === '00') map[127] = o.res127(ctx);
    const res = message({ mti: '0210', header, rows: pick(map, resList), label: `0210 ${o.short} · Host emisor → LINK`, leg: 'Respuesta (0210 INPUT B24)', direction: 'ENTRANTE', responseCode: code });
    const summaries = { movements: 'Movimientos impresos desde el campo 125 (statement print data)', fx_rate: note, pin_change: note, deposit: note || 'Depósito acreditado (campo 123)', preauth: `Se retienen ${money(amount)} hasta la finalización (79)`, preauth_complete: note, own_transfer: `${money(amount, cur)} de ${LINK.accounts[t].label} a ${LINK.accounts[ctx.toAccount]?.label || ''}` };
    return { messages: [req, res], code, balanceCents: bal, currency: cur, amountCents: amount, summary: code === '00' ? (summaries[kind] || o.label + ' aprobada') : 'Rechazada por el host emisor', statement: kind === 'movements' ? (b.history || []).filter(h => h.acct === t).slice(-7).reverse() : null, fx: kind === 'fx_rate' ? b.fx : null, debitAccount: t, ticket: o.res125 && code === '00' ? o.res125(ctx) : null };
  }

  // Reversas: 0420 OUTPUT B24 (C-X-4-11) y 0430 INPUT B24 (C-X-4-12). Clave: terminal + fecha + hora + secuencia (campo 90).
  function buildReversal(ctx, req, reason, actualCents) {
    const get = de => req.fields.find(r => r.de === de);
    const map = Object.fromEntries(req.fields.filter(r => r.de !== 1).map(r => [r.de, { ...r, ref: 'Igual al 0200 original' }]));
    map[39] = f(39, reason, 'X(2)', 'C-X-8 · ' + (REVERSAL[reason] || 'Código de reverso'));
    if (reason === '68') map[43] = f(43, pad('** REVERSAL FOR LATE/UNSOL RESPONSE **', 40), 'g X(40)', 'Timeout: los primeros 38 bytes llevan la leyenda fija del manual');
    const c = ctx.clock;
    map[90] = f(90, '0200' + num(String(ctx.rrn).replace(/\D/g, ''), 12) + c.mmdd + pad(c.hhmmss, 8) + c.mmdd + '0'.repeat(10), 'g 42', 'Tipo de mensaje original 0200 + secuencia original (37) + fecha (13) + hora (12) + fecha de negocio (17) + ceros');
    map[95] = f(95, amt12(actualCents || 0) + '0'.repeat(30), 'g 42', reason === '32' ? 'Monto realmente dispensado 9(10)v99 + ceros' : 'Reversa total: monto real en ceros');
    if (!map[122]) map[122] = f(122, '011' + pad(LINK.issuerFiid, 11), 'LLLVAR g..150', 'Código interno de la institución emisora');
    if (!map[123]) map[123] = f(123, '012' + amt12(0), 'LLLVAR g..455', 'Monto de depósito: ceros');
    const isDebin = /^F[34]/.test(get(3)?.value || '');
    const list = isDebin ? [2, 3, 4, 7, 11, 12, 13, 17, 22, 32, 35, 37, 39, 41, 43, 49, 54, 55, 60, 61, 90, 102, 103, 126] : [3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 39, 41, 42, 43, 48, 49, 54, 55, 60, 61, 90, 95, 100, 102, 103, 122, 123, 124, 125, 127];
    const r0420 = message({ mti: '0420', header: '014000005', rows: pick(map, list), label: `0420 REVERSA · ${REVERSAL[reason] || reason}`, leg: 'Reversa (0420 OUTPUT B24)', direction: 'SALIENTE', responseCode: reason });
    const m2 = Object.fromEntries(['3', '4', '7', '11', '32', '35', '37', '41', '49'].map(n => [n, { ...map[n], ref: 'Eco del 0420' }]));
    m2[39] = f(39, reason, 'X(2)', 'Eco del código de reverso');
    m2[90] = { ...map[90], ref: 'Eco del 0420 (clave de la transacción original)' };
    const r0430 = message({ mti: '0430', header: '014000005', rows: pick(m2, [3, 4, 7, 11, 32, 35, 37, 39, 41, 49, 90]), label: '0430 · Host emisor confirma la reversa', leg: 'Respuesta a la reversa (0430 INPUT B24)', direction: 'ENTRANTE', responseCode: reason });
    return [r0420, r0430];
  }
  // Aplica el evento posterior (cancelación 17, entrega parcial 32, timeout 68, retracto de billetes) y devuelve el saldo a su lugar.
  // rc.1.26 · La entrega parcial paga el 80% (redondeado a billetes enteros) y reversa el 20% restante.
  const CASH_KINDS = ['withdrawal', 'withdrawal_usd', 'cash_advance'];
  function partialCents(amount) { return Math.floor((amount * 0.8) / 100) * 100; }
  function reverseOut(out, ctx, b, ev) {
    const reversible = out.code === '00' && out.messages.length >= 2 && !out.reversal;
    if (!ev || ev === 'none' || !reversible) return null;
    const kind = out.kind, o = OPS[kind] || {};
    if ((ev === 'partial' || ev === 'retract') && !CASH_KINDS.includes(kind)) return null;
    const req = out.messages[0];
    const amount = Number(out.amountCents ?? ctx.amountCents ?? 0);
    const dispensed = ev === 'partial' ? partialCents(amount) : 0;
    // El C-X-8 no tiene un código propio para billetes no retirados: se informa como transacción cancelada (17).
    const reason = ev === 'partial' ? '32' : ev === 'timeout' ? '68' : '17';
    const rev = buildReversal(ctx, req, reason, dispensed);
    const t = out.debitAccount || ctx.accountType;
    const back = amount - dispensed;
    const debitLike = o.debit || o.hold || ['withdrawal', 'transfer', 'debin'].includes(kind);
    if (debitLike && b[t] != null) { b[t] += back; addHistory(b, t, 'REVERSA ' + reason, back, 1); if (['withdrawal'].includes(kind)) b.withdrawnToday = Math.max(0, (b.withdrawnToday || 0) - back); }
    if (o.credit && b[t] != null) { b[t] -= back; addHistory(b, t, 'REVERSA ' + reason, back, -1); }
    if (kind === 'deposit' && ctx.depositType !== 'C') b[t] -= back;
    out.balanceCents = Number(b[t] || 0);
    out.reversal = { reason, event: ev, text: REVERSAL[reason], dispensedCents: dispensed, returnedCents: back };
    out.summary = ev === 'timeout' ? 'El host no respondió a tiempo: LINK envió la reversa 0420 (68) y el host la confirmó con 0430.'
      : ev === 'partial' ? `El cajero entregó ${money(dispensed, out.currency)} de ${money(amount, out.currency)} (80%): reversa parcial 0420 (32) por ${money(back, out.currency)}, con el monto realmente entregado en el campo 95.`
      : ev === 'retract' ? `El cliente no retiró los billetes y el cajero los retractó: reversa total 0420 (17 · el C-X-8 no tiene un código propio para retracto) y confirmación 0430. Vuelven ${money(back, out.currency)} a la cuenta.`
      : 'El cliente canceló después de la aprobación: reversa total 0420 (17) y confirmación 0430.';
    return rev;
  }
  // rc.1.27 · Store-and-forward (C-X-1-2-3): el host no está disponible, BASE24 autoriza en STAND-IN y después envía la 0220 (C-X-4-08); el host contesta 0230 (C-X-4-09).
  function storeAndForward(out, ctx) {
    const req = out.messages[0];
    const map = Object.fromEntries(req.fields.filter(r => r.de !== 1).map(r => [r.de, { ...r, ref: 'Igual al 0200 original' }]));
    map[39] = f(39, '00', 'X(2)', 'Autorizada por BASE24 en STAND-IN (host inoperable)');
    const c = ctx.clock;
    map[90] = f(90, '0200' + num(String(ctx.rrn).replace(/\D/g, ''), 12) + c.mmdd + pad(c.hhmmss, 8) + c.mmdd + '0'.repeat(10), 'g 42', 'Datos de la transacción original: 0200 + secuencia + fecha + hora + fecha de negocio + ceros');
    if (!map[122]) map[122] = f(122, '011' + pad(LINK.issuerFiid, 11), 'LLLVAR g..150', 'Código interno de la institución emisora');
    if (!map[123]) map[123] = f(123, '012' + amt12(0), 'LLLVAR g..455', 'Monto de depósito: ceros');
    const has = de => !!map[de];
    const list = [3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 39, 41, 42, 43, 48, 49, 54, 55, 60, 61, 62, 63, 90, 100, 102, 103, 122, 123, 124, 125, 127].filter(has);
    const header = ctx.terminal === 'ATM' ? '014000015' : '014000055';
    const r0220 = message({ mti: '0220', header, rows: pick(map, list), label: '0220 FORZADA · BASE24 informa la transacción autorizada en STAND-IN', leg: 'Transacción forzada (0220 OUTPUT B24)', direction: 'SALIENTE', responseCode: '00' });
    const m2 = Object.fromEntries([3, 4, 7, 11, 32, 35, 37, 41, 49, 102, 103].filter(has).map(n => [n, { ...map[n], ref: 'Eco del 0220' }]));
    m2[39] = f(39, '00', 'X(2)', 'El host registró la forzada');
    if (!m2[102]) m2[102] = f(102, '28' + pad('', 28), 'LLVAR ..X(28)', 'Cuenta desde');
    if (!m2[103]) m2[103] = f(103, '28' + pad('', 28), 'LLVAR ..X(28)', 'Cuenta hacia');
    const r0230 = message({ mti: '0230', header: '014000005', rows: pick(m2, [3, 4, 7, 11, 32, 35, 37, 39, 41, 49, 102, 103]), label: '0230 · El host confirma la forzada', leg: 'Respuesta a la forzada (0230)', direction: 'ENTRANTE', responseCode: '00' });
    out.messages = [req, r0220, r0230];
    out.saf = true;
    out.summary = 'Host no disponible: BASE24 autorizó en STAND-IN, guardó la transacción en el archivo STORE-AND-FORWARD y, cuando el host volvió, la informó con 0220. El host la registró con 0230.';
    return out;
  }
  function applyAfter(out, ctx, b) {
    const ev = ctx.after;
    if (ev === 'saf') return out.code === '00' && out.messages.length >= 2 ? storeAndForward(out, ctx) : out;
    if (ev === 'retract') return out; // el retracto lo decide el dispensador del ATM después de presentar los billetes
    const rev = reverseOut(out, ctx, b, ev);
    if (!rev) return out;
    if (ev === 'timeout') { out.messages = [out.messages[0], ...rev]; out.timeout = true; }
    else out.messages = [...out.messages, ...rev];
    return out;
  }
  // rc.1.27 · Mensajes de control 0800 / 0810 (C-X-4-14 / C-X-4-15): LOGON 001, LOGOFF 002, ECHO-TEST 301. Header 004000040.
  const NET_FN = { '001': 'LOGON', '002': 'LOGOFF', '301': 'ECHO-TEST' };
  function buildNetwork(fn = '301', result = '00') {
    const c = clock(), stan = num(Math.floor(100000 + Math.random() * 899999), 6);
    fn = NET_FN[fn] ? fn : '301';
    const req = message({ mti: '0800', header: '004000040', rows: [f(7, c.mmdd + c.hhmmss, 'mmddhhmmss 9(10)', 'C-X-4-14'), f(11, stan, '9(6)', 'Número de traza'), f(70, fn, '9(3)', `Código de gestión de red: ${fn} = ${NET_FN[fn]}`)], label: `0800 ${NET_FN[fn]} · Mensaje de control`, leg: 'Requerimiento de control (0800)', direction: 'SALIENTE' });
    const res = message({ mti: '0810', header: '004000040', rows: [f(7, c.mmdd + c.hhmmss, 'mmddhhmmss 9(10)', 'Eco del 0800'), f(11, stan, '9(6)', 'Eco del 0800'), f(39, result, 'X(2)', { '00': '00 · APROBADO', '01': '01 · DENEGADO', '91': '91 · HOST DOWN' }[result] || result), f(70, fn, '9(3)', 'Eco del código de gestión de red')], label: `0810 ${NET_FN[fn]} · Respuesta de control`, leg: 'Respuesta de control (0810)', direction: 'ENTRANTE', responseCode: result });
    return { kind: 'network', messages: [req, res], code: result, summary: `${NET_FN[fn]}: ${result === '00' ? 'el host respondió APROBADO' : result === '91' ? 'HOST DOWN' : 'DENEGADO'} (0810, campo 39 = ${result}).` };
  }
  // rc.1.26 · Reversa decidida en el dispositivo (ATM): billetes no retirados o entrega parcial. Devuelve solo el 0420 / 0430.
  function reverseLater(out, ev) {
    const b = balances();
    const rev = reverseOut(out, out.ctx, b, ev);
    if (!rev) return [];
    saveBalances(b);
    out.messages = [...out.messages, ...rev];
    out.resultText = `APROBADA Y REVERSADA (${out.reversal.reason})`;
    return rev;
  }

  function build(kind, ctx) {
    const c = { terminal: 'ATM', accountType: '10', amountCents: 0, stan: String(Math.floor(100000 + Math.random() * 899999)), pan: LINK.pan, expiry: LINK.expiry, ...ctx };
    if (!LINK.accounts[c.accountType]) c.accountType = '10';
    c.clock = clock();
    c.rrn = c.rrn || (c.clock.mmdd + c.stan + '00').slice(0, 12);
    const b = balances();
    let out = kind === 'transfer' ? buildTransfer(c, b) : kind === 'debin' ? buildDebin(c, b) : OPS[kind] ? buildOp(kind, c, b) : buildSimple(kind, c, b);
    out.kind = kind; out.ctx = c;
    if (out.amountCents == null) out.amountCents = kind === 'balance' ? 0 : Number(c.amountCents || 0);
    if (!out.debitAccount) out.debitAccount = c.accountType;
    out = applyAfter(out, c, b);
    saveBalances(b);
    out.resultText = out.timeout ? 'SIN RESPUESTA · REVERSADA' : out.reversal ? `APROBADA Y REVERSADA (${out.reversal.reason})` : (RESULT[out.code] || 'RECHAZADA');
    if (out.timeout) out.code = '68';
    return out;
  }

  // Valor para mostrar en tabla: blancos visibles.
  function displayValue(v) { return esc(v).replace(/ /g, '<i class="lk-sp">·</i>'); }
  function annotated(msg) { return `ISO|${msg.header}|${msg.mti}|${msg.primaryBitmap}|` + msg.fields.map(r => `${r.de}=${r.value}`).join('|'); }

  function css() {
    if (document.getElementById('osc-link-css')) return;
    const s = document.createElement('style'); s.id = 'osc-link-css';
    s.textContent = `.lk-sp{color:#4f6b85;font-style:normal;opacity:.7}.link-net{margin:6px 0;border:1px solid #23415c;border-radius:8px;padding:6px 8px}.link-net summary{font-size:12px!important;font-weight:700;cursor:pointer;color:#9fd8ff;list-style-position:inside}.link-net .btn{margin-top:6px;font-size:12px}
.test-card.link .card-network,.test-card.domestic .card-network{font-size:0!important;color:transparent!important}
.test-card.link .card-network::before{content:"";display:block;width:30px;height:30px;border-radius:50%;background:url('assets/brand-link.png?v=4.0.0-rc1.26') center/contain no-repeat;box-shadow:0 0 0 1.5px #fff}
.test-card.link.active{border-color:#9fd18b!important;box-shadow:0 0 0 3px rgba(159,209,139,.22)!important}
.test-card.domestic .card-network::before{content:"DOMÉSTICA";display:block;font-size:.62rem;font-weight:900;letter-spacing:.08em;color:#55e6ae;line-height:20px}
.test-card.domestic.no-card{opacity:.6}
.link-panel{margin-top:10px;border:1px solid #31506b;border-radius:10px;padding:10px;background:#0a1b2b;display:grid;gap:8px}
.link-panel.hidden{display:none}
.link-panel h4{margin:0;font-size:.62rem;letter-spacing:.08em;color:#9fc2e0;text-transform:uppercase;display:flex;align-items:center;gap:8px}
.link-panel h4 img{width:18px;height:18px;border-radius:50%;box-shadow:0 0 0 1px #fff}
.link-tx{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.link-tx button{border:1px solid #2a4964;background:#0e2539;color:#eef7ff;border-radius:8px;padding:7px 6px;font-size:.62rem;cursor:pointer;text-align:left}
.link-tx button b{display:block;font-size:.66rem}.link-tx button small{color:#9eb3c6}
.link-tx button.active{border-color:#e9eef5;background:#143551}
.link-row{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.link-panel label{display:grid;gap:3px;font-size:.58rem;color:#9eb3c6}
.link-panel select,.link-panel input{width:100%;box-sizing:border-box;background:#06121e;border:1px solid #2a4964;color:#eef7ff;border-radius:7px;padding:6px;font-size:.66rem}
.link-panel .link-note{font-size:.56rem;color:#8fa9bf;line-height:1.35}
.link-legs{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0}
.link-legs button{border:1px solid #2a4964;background:#0e2539;color:#cfe3f5;border-radius:999px;padding:4px 9px;font-size:.62rem;cursor:pointer}
.link-legs button.active{background:#e9eef5;color:#0b1b2b;border-color:#e9eef5}
.link-raw{font-family:ui-monospace,Consolas,monospace;font-size:.62rem;word-break:break-all;white-space:pre-wrap;background:#06121e;border:1px dashed #2f6a93;border-radius:8px;padding:8px;color:#cfe3f5;max-height:120px;overflow:auto}`;
    document.head.appendChild(s);
  }

  // Panel de parámetros LINK (común a POS y ATM).
  // Panel de parámetros LINK. POS: elige la operación (incluye compras Maestro). ATM: la operación se elige en la pantalla del cajero.
  const POS_GROUPS = [
    ['Compras con débito (Maestro)', ['purchase', 'cashback', 'pos_balance', 'preauth', 'preauth_complete']],
    ['Anulaciones y devoluciones', ['void', 'refund', 'refund_void', 'cashback_void']],
    ['Operaciones de cuenta', ['withdrawal', 'balance', 'transfer', 'debin']]
  ];
  function panelHtml(opts = {}) {
    const pos = opts.mode === 'pos' || opts.withTxButtons;
    const code = k => (OPS[k] ? OPS[k].proc({ accountType: 'XX', toAccount: 'YY', destination: { toTyp: 'YY' } }) : { withdrawal: '01XX00', balance: '31XX00', transfer: '09XX00 + 2900YY', debin: 'F3XX00 + F400XX' }[k]);
    // rc.1.27 · ATM: el alumno elige primero la operación (igual que en el POS) y el panel muestra solo los datos que esa operación usa.
    const ATM_GROUPS = [['Cuenta', ['withdrawal', 'withdrawal_usd', 'cash_advance', 'balance', 'movements', 'deposit', 'deposit_third', 'card_payment', 'card_payment_cash', 'fx_rate', 'pin_change']], ['Transferencias', ['own_transfer', 'transfer', 'debin']], ['Pago de servicios', Object.keys(OPS).filter(k => OPS[k].group === 'services')], ['Plazo fijo', Object.keys(OPS).filter(k => OPS[k].group === 'investments')], ['Gestiones', Object.keys(OPS).filter(k => OPS[k].group === 'admin')], ['Solicitudes a la institución', Object.keys(OPS).filter(k => OPS[k].group === 'requests')]];
    const atmSel = pos ? '' : `<label>Operación LINK<select id="linkAtmTxSelect"><option value="">— Elegir en la pantalla del cajero —</option>${ATM_GROUPS.map(([g, ks]) => `<optgroup label="${g}">${ks.filter(k => TX[k]).map(k => `<option value="${k}">${TX[k].label} · ${code(k)}</option>`).join('')}</optgroup>`).join('')}</select></label>`;
    const txSel = pos ? `<label>Operación LINK<select id="linkTxSelect">${POS_GROUPS.map(([g, ks]) => `<optgroup label="${g}">${ks.map(k => `<option value="${k}">${TX[k].label} · ${code(k)}</option>`).join('')}</optgroup>`).join('')}</select></label>
<div id="linkOriginalBox" style="display:none"><label>Operación original<select id="linkOriginal"><option value="">— No hay operaciones aprobadas para referenciar —</option></select></label></div>
<div id="linkCashbackBox" style="display:none"><label>Efectivo a retirar (cash-back)<input id="linkCashback" inputmode="numeric" value="5000" placeholder="Importe en pesos"></label></div>
<div id="linkCuotasBox" style="display:none"><label>Cuotas (Maestro · campo 48)<select id="linkCuotas"><option value="1">1 pago</option><option value="3">3 cuotas</option><option value="6">6 cuotas</option></select></label></div>` : '';
    const afterOpts = pos ? [['none', 'Ninguno'], ['cancel', 'Reversa total · 17 · el cliente cancela'], ['timeout', 'Reversa por timeout · 68 · el host no responde'], ['saf', 'Host no disponible · STAND-IN + forzada 0220 / 0230']] : [['none', 'Ninguno'], ['cancel', 'Reversa total · 17 · el cliente cancela'], ['partial', 'Reversa parcial · 32 · el cajero entrega el 80% (solo extracción)'], ['timeout', 'Reversa por timeout · 68 · el host no responde'], ['saf', 'Host no disponible · STAND-IN + forzada 0220 / 0230']];
    return `<h4><img src="assets/brand-link.png?v=4.0.0-rc1.26" alt="">Red LINK · Host to Host ISO 8583</h4>${txSel}${atmSel}
<div class="link-row" style="grid-template-columns:1fr"><label>Cuenta<select id="linkAccountType"><option value="10">Caja de ahorros $ (10)</option><option value="20">Cuenta corriente $ (20)</option>${pos ? '' : '<option value="15">Caja de ahorros U$S (15)</option><option value="07">Cuenta corriente U$S (07)</option>'}</select></label>
</div>
<label>Escenario de prueba<select id="linkScenario"><optgroup label="Respuesta del host (0210)">${SCENARIOS.map(c => `<option value="${c}">${c} · ${RESULT[c].toLowerCase()}</option>`).join('')}</optgroup><optgroup label="Aprobada y luego reversada (0420 / 0430)">${afterOpts.filter(([v]) => v !== 'none').map(([v, l]) => `<option value="00|${v}">${l}</option>`).join('')}</optgroup></select></label>
<div id="linkTransferBox" class="hidden" style="display:grid;gap:6px">
<label>CBU destino (22 dígitos)<input id="linkCbu" inputmode="numeric" maxlength="22" value="0140999901000012345678"></label>
<div class="link-row"><label>Red del banco destino<select id="linkDestNetwork"><option value="LINK">LINK</option><option value="BANELCO">BANELCO (FIID 5892)</option></select></label>
<label>Cuenta destino<select id="linkToTyp"><option value="10">Caja de ahorros $ (10)</option><option value="20">Cuenta corriente $ (20)</option></select></label></div>
<div class="link-row"><label>Titularidad<select id="linkMismoTitular"><option value="N">N · Cuenta de terceros</option><option value="S">S · Cuenta propia</option><option value="C">C · Propia compartida</option></select></label>
<label>Motivo (BCRA)<select id="linkMotivo">${Object.entries(MOTIVOS).map(([k, v]) => `<option value="${k}">${k} · ${v}</option>`).join('')}</select></label></div>
<label>Titular destino<input id="linkDestName" maxlength="22" value="TITULAR DESTINO"></label></div>
<div id="linkDebinBox" class="hidden" style="display:grid;gap:6px">
<div class="link-row"><label>CUIT vendedor<input id="linkSellerCuit" inputmode="numeric" maxlength="11" value="30712345679"></label>
<label>Concepto<select id="linkDebinConcepto">${Object.entries(MOTIVOS).map(([k, v]) => `<option value="${k}">${k} · ${v}</option>`).join('')}</select></label></div>
<label>CBU vendedor (22 dígitos)<input id="linkSellerCbu" inputmode="numeric" maxlength="22" value="0720999988000098765432"></label></div>
<div id="linkPasBox" style="display:none"><div class="link-row"><label>Ente (PAS)<select id="linkPasEnte">${Object.entries(ENTES).map(([k, v]) => `<option value="${k}">${k} · ${v}</option>`).join('')}</select></label>
<label>Código de cliente<input id="linkPasCliente" maxlength="19" value="0001234567"></label></div></div>
<div id="linkPfBox" style="display:none"><div class="link-row"><label>Plazo (días)<select id="linkPfPlazo"><option>30</option><option>60</option><option>90</option><option>180</option><option>365</option></select></label>
<label>Tipo de plazo fijo<select id="linkPfTipo"><option value="T">T · Tradicional</option><option value="P">P · Precancelable</option><option value="V">V · Tasa variable encuesta</option><option value="B">B · Tasa variable BAIBOR</option><option value="C">C · Ajustable por CER</option></select></label></div>
<div class="link-row"><label>Renovación<select id="linkPfRen"><option value="N">N · No renovable</option><option value="T">T · Renovación total</option><option value="P">P · Renovación parcial</option></select></label>
<label>Renovación automática (68)<select id="linkPfAuto"><option value="A">A · Activar</option><option value="S">S · Suspender</option></select></label></div></div>
${pos ? '' : `<details class="link-net"><summary>Gestión de red · 0800 / 0810</summary><div class="link-row"><label>Mensaje de control<select id="linkNetFn"><option value="001">001 · LOGON</option><option value="002">002 · LOGOFF</option><option value="301" selected>301 · ECHO-TEST</option></select></label>
<label>Respuesta del host<select id="linkNetRes"><option value="00">00 · Aprobado</option><option value="01">01 · Denegado</option><option value="91">91 · Host down</option></select></label></div><button type="button" class="btn" id="linkNetSend">Enviar 0800</button></details>`}
<div class="link-note" id="linkNote"></div>`;
  }
  function readPanel() {
    const v = id => document.getElementById(id)?.value || '';
    return {
      accountType: v('linkAccountType') || '10', scenario: (v('linkScenario') || '00').split('|')[0], after: (v('linkScenario') || '').split('|')[1] || 'none',
      cashbackCents: Math.round(Number(String(v('linkCashback')).replace(/\./g, '').replace(',', '.')) * 100) || 0,
      installments: Number(v('linkCuotas') || 1), originalId: v('linkOriginal'),
      destination: { cbu: v('linkCbu'), network: v('linkDestNetwork'), toTyp: v('linkToTyp'), mismoTitular: v('linkMismoTitular'), motivo: v('linkMotivo'), name: v('linkDestName') },
      debin: { sellerCuit: v('linkSellerCuit'), sellerCbu: v('linkSellerCbu'), concepto: v('linkDebinConcepto') },
      pas: { ente: v('linkPasEnte') || '002', cliente: v('linkPasCliente') || '0001234567', opcion: 1 },
      pf: { plazo: Number(v('linkPfPlazo') || 30), tipo: v('linkPfTipo') || 'T', renovacion: v('linkPfRen') || 'N', auto: v('linkPfAuto') || 'A' }
    };
  }
  const NOTES = {
    withdrawal: 'Extracción 01XX00: LINK envía el 0200 al host emisor; el 0210 trae saldos en el campo 44 y disponibles en el 54.',
    balance: 'Consulta 31XX00: importe en ceros; el saldo vuelve en el campo 44 (apertura y disponible).',
    transfer: 'Transferencia: primero el débito 09XX00 al banco origen; si aprueba, LINK envía la orden de acreditación 2900YY al banco destino. Campo 55 (120) y tokens PE/Q7 en el 126 según el Anexo de Transferencias.',
    debin: 'DEBIN: lo cursa COELSA, no se captura la tarjeta. LINK envía F3XX00 (débito) al banco del comprador y, si aprueba, F400XX (crédito) al banco del vendedor. Campo 55 (247) y token QS según el Anexo Técnico II.',
    purchase: 'Compra Maestro 71XX00: el campo 48 (POS, longitud 079) lleva el comercio y la cantidad de cuotas.',
    cashback: 'Compra con cash-back 76XX00: el campo 4 lleva compra + efectivo y el campo 54 el importe del retiro en efectivo.',
    pos_balance: 'Consulta de saldo Maestro 73XX00: importe en ceros; saldo en el campo 44.',
    preauth: 'Preautorización 78XX00: el emisor retiene el importe hasta la finalización.',
    preauth_complete: 'Preautorización finalizada 79XX00: libera la retención y debita el importe final (elegí la preautorización original).',
    void: 'Anulación 72XX00: devuelve el importe de una compra aprobada (elegí la compra original).',
    refund: 'Devolución 74XX00: crédito total o parcial. En el campo 48 viajan ORIG-NUM y ORIG-DATE de la compra original.',
    refund_void: 'Anulación de devolución 75XX00: vuelve a debitar una devolución.',
    cashback_void: 'Anulación de cash-back 77XX00: devuelve compra + efectivo (campo 54 con el efectivo).'
  };
  function syncPanel(kind) {
    const show = (id, on) => { const e = document.getElementById(id); if (e) { e.classList.toggle('hidden', !on); e.style.display = on ? (id === 'linkTransferBox' || id === 'linkDebinBox' ? 'grid' : '') : 'none'; } };
    show('linkTransferBox', kind === 'transfer' || kind === 'deposit_third' || kind === 'verify_credit');
    show('linkDebinBox', kind === 'debin');
    show('linkOriginalBox', !!OPS[kind]?.original);
    show('linkCashbackBox', !!OPS[kind]?.cashback && kind === 'cashback');
    show('linkCuotasBox', kind === 'purchase');
    show('linkPasBox', !!OPS[kind]?.req54 && OPS[kind]?.group === 'services' && kind !== 'service_order');
    show('linkPfBox', OPS[kind]?.group === 'investments');
    const GROUP_NOTES = { services: 'Pago de servicios (PAS): el campo 54 del 0200 lleva ente (3) + código de cliente (19) + opción de deuda; la 0210 repite ente y cliente y suma cuota/año. El ticket vuelve en el campo 125.', investments: 'Plazo fijo: el 0200 lleva en el campo 55 (120) plazo, importe, renovación, auto-renovación y tipo; la 0210 los devuelve en el campo 54 (120) y el comprobante en el 125.', admin: 'Gestión: código C-X-5 en el campo 3; la respuesta trae lo que se imprime en el ticket (campo 125).', requests: 'Mensaje a la institución: código C-X-5 en el campo 3; la confirmación viaja en el campo 125.' };
    const n = document.getElementById('linkNote'); if (n) n.textContent = NOTES[kind] || GROUP_NOTES[OPS[kind]?.group] || '';
  }



  /* ---------- Parser LINK: "ISO" + header 9(9) + MTI + bitmap primario + campos (C-X-1-2-3) ---------- */
  const DEF = (() => {
    const d = {};
    const fx = (n, len) => (d[n] = { t: 'F', len });
    const ll = n => (d[n] = { t: 'LL' }); const lll = n => (d[n] = { t: 'LLL' });
    fx(1, 16); ll(2); fx(3, 6); fx(4, 12); fx(5, 12); fx(6, 12); fx(7, 10); fx(8, 8); fx(9, 8); fx(10, 8); fx(11, 6); fx(12, 6); fx(13, 4); fx(14, 4);
    fx(15, 4); fx(16, 4); fx(17, 4); fx(18, 4); fx(19, 3); fx(20, 3); fx(21, 3); fx(22, 3); fx(23, 3); fx(24, 3); fx(25, 2); fx(26, 2); fx(27, 1);
    fx(28, 9); fx(29, 9); fx(30, 9); fx(31, 9); ll(32); ll(33); ll(34); ll(35); lll(36); fx(37, 12); fx(38, 6); fx(39, 2); fx(40, 3); fx(41, 16);
    fx(42, 15); fx(43, 40); ll(44); ll(45); lll(46); lll(47); lll(48); fx(49, 3); fx(50, 3); fx(51, 3); fx(52, 16); fx(53, 16);
    for (let n = 54; n <= 63; n++) lll(n);
    fx(64, 16); fx(65, 16); fx(66, 1); fx(67, 2); fx(68, 3); fx(69, 3); fx(70, 3); fx(71, 4); fx(72, 4); fx(73, 6);
    for (let n = 74; n <= 81; n++) fx(n, 10); for (let n = 82; n <= 85; n++) fx(n, 12); for (let n = 86; n <= 89; n++) fx(n, 16);
    fx(90, 42); fx(91, 1); fx(92, 2); fx(93, 5); fx(94, 7); fx(95, 42); fx(96, 16); fx(97, 17); fx(98, 25); ll(99); ll(100); ll(101); ll(102); ll(103);
    for (let n = 104; n <= 127; n++) lll(n); fx(128, 16);
    return d;
  })();
  const HEADERS = { '004000040': 'Mensaje de control (0800 / 0810)', '014000005': 'Reversa / forzada (0420 / 0430 / 0230)', '014000010': 'Requerimiento originado en ATM (0200 OUTPUT B24)', '014000050': 'Requerimiento originado en HOST', '014000070': 'Requerimiento originado en INTERCHANGE', '014000015': 'Respuesta del host a requerimiento de ATM', '014000055': 'Respuesta del host a requerimiento de HOST', '014000075': 'Respuesta del host a requerimiento de INTERCHANGE' };
  const TCODE = { '11': 'Efectivo rápido COVISUR', '17': 'Compra en ATM (Pay Key)', '18': 'Inversión en plazo fijo', '1C': 'Carga', '21': 'Depósito', '22': 'Depósito a terceros', '33': 'Cambio de CIT', '34': 'Asignación de usuario Home Banking', '35': 'Consulta de tipo de cambio', '37': 'Consulta publicitaria de plazos y tasas', '38': 'Consulta de saldo de plazo fijo', '3A': 'Consulta de estado', '3B': 'Consulta de premios', '3C': 'Emisión de certificados', '3D': 'Cambio de número de base', '50': 'Pago de resumen de tarjeta', '61': 'Mensaje a la institución (solicitudes)', '62': 'Consulta de seguro contra robo en ATM', '63': 'Cambio de cuenta asociada al plazo fijo', '64': 'Adhesión al seguro contra robo en ATM', '66': 'Consulta de últimos débitos automáticos', '68': 'Suspensión / activación de renovación automática', '69': 'Consulta de pago on line', '74': 'Devolución de compra', '75': 'Anulación de devolución', '77': 'Anulación de cash-back', '78': 'Preautorización', '79': 'Preautorización finalizada', '80': 'Consulta / adhesión de vencimiento de servicio', '81': 'Pago automático de servicios con consulta previa', '82': 'Consulta de códigos abreviados', '83': 'Consulta de últimos pagos', '84': 'Consulta de vencimientos pendientes', '85': 'Baja de asociación del servicio', '86': 'Pago rápido sin consulta previa', '87': 'Pago automático de servicios en efectivo', '88': 'Pago de resumen de tarjeta (PAS)', '89': 'Consulta / adhesión de vencimiento (PAS)', '8K': 'Consulta de rubros', '8L': 'Consulta de empresas', '8M': 'Consulta de adhesiones', '8P': 'Baja de adhesión', '90': 'Pago de servicios', '91': 'Mensajes a la institución', '93': 'Mensaje a la institución (extractos, chequeras, boletas)', '01': 'Extracción', '09': 'Débito por transferencia interbancaria', '29': 'Orden de acreditación por transferencia interbancaria', '31': 'Consulta de saldos', '39': 'Verificación de cuenta crédito (transferencias)', '40': 'Transferencia entre cuentas', '71': 'Compra con débito (Maestro)', '72': 'Anulación de compra', '73': 'Consulta de saldos (Maestro)', '76': 'Compra con cash-back', 'F3': 'Débito DEBIN', 'F4': 'Crédito DEBIN', '32': 'Cambio de PIN', '94': 'Últimos movimientos' };
  const ACCT = { '00': 'sin cuenta', '07': 'Cuenta corriente U$S', '10': 'Caja de ahorros $', '15': 'Caja de ahorros U$S', '20': 'Cuenta corriente $', '30': 'Cuenta tarjeta de crédito $' };
  function parts(v, spec) { let i = 0; return spec.map(([name, n]) => { const x = v.slice(i, i + n); i += n; return [name, x]; }); }
  function partsHtml(list) { return '<div style="margin-top:4px;font-size:11px;line-height:1.5;color:#9fb6cb">' + list.map(([k, v]) => `<div><b style="color:#cfe3f5">${esc(k)}</b> ${displayValue(v)}</div>`).join('') + '</div>'; }
  function explain(de, data, raw, proc = '') {
    const money = v => (Number(v || 0) / 100).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    switch (de) {
      case 3: return { text: `${TCODE[data.slice(0, 2)] || 'Código ' + data.slice(0, 2)} · desde ${ACCT[data.slice(2, 4)] || data.slice(2, 4)} · hacia ${ACCT[data.slice(4, 6)] || data.slice(4, 6)}` };
      case 4: return { text: money(data) };
      case 39: if (proc === 'REV') return { text: REVERSAL[data] ? `${data} · ${REVERSAL[data]} (C-X-8)` : `Código de reverso ${data}` }; return { text: RESULT[data] ? `${data} · ${RESULT[data]}` : `Código ${data} (ver C-X-6)` };
      case 43: return { html: partsHtml(parts(data, [['Dueño', 22], ['Localidad', 13], ['Provincia', 3], ['País', 2]])) };
      case 44: return { html: partsHtml([['Indicador', data.slice(0, 1)], ['Saldo apertura', money(data.slice(1, 13))], ['Saldo disponible', money(data.slice(13, 25))]]) };
      case 49: return { text: { '032': 'Pesos', '840': 'Dólares', '076': 'Reales', '858': 'Pesos uruguayos', '000': 'Rechazo' }[data] || data };
      case 60: return { html: partsHtml(parts(data, [['Institución dueña de la terminal', 4], ['Red', 4], ['Diferencia horaria', 4]])) };
      case 61: return { html: partsHtml(parts(data, [['Institución emisora', 4], ['Red', 4], ['Tipos de cuenta', 4], ['Indicador', 1]])) };
      case 70: return { text: { '001': 'LOGON', '002': 'LOGOFF', '301': 'ECHO-TEST' }[data] || 'Código de gestión de red' };
      case 55:
        if (data.length === 120 && /^(18|37|38|63|68)/.test(proc)) return { html: partsHtml(parts(data, [['Plazo (días)', 3], ['Importe', 10], ['Forma de renovación (N/T/P)', 1], ['Auto-renovación (S/A)', 1], ['Tipo de plazo fijo', 1], ['Opción', 28], ['Filler', 76]])) };
        if (data.length === 38) return { html: partsHtml(parts(data, [['Código de empresa', 3], ['Código de producto', 3], ['Código de artículo', 32]])) };
        if (data.length === 199) return { html: partsHtml(parts(data, [['DATA-TYPE', 2], ['Línea de la terminal', 4], ['FIID de la terminal', 4], ['Terminal', 16], ['FIID de la tarjeta', 4], ['PAN', 19], ['Secuencia', 12], ['Fecha AAMMDD', 6], ['Hora hhmmssll', 8], ['Fecha de negocio', 6], ['Código de transacción', 6], ['Cuenta', 19], ['Importe', 12], ['Tipo de terminal', 2], ['Datos específicos', 79]])) };
        if (data.length === 120) return { html: partsHtml(parts(data, [['TRACK2', 40], ['MISMO-TITULAR', 1], ['FILLER', 1], ['FR FIID', 4], ['FR TYP', 2], ['FR ACCT', 19], ['TO FIID', 4], ['TO TYP', 2], ['TO ACCT', 19], ['FIID-DESC', 13], ['FR-ACCT-TYP', 1], ['TO-ACCT-TYP', 1], ['TIPO-TRAN', 1], ['MOTIVO', 3], ['FILLER', 9]])) };
        if (data.length === 247) return { html: partsHtml(parts(data, [['ID DEBIN', 32], ['CONCEPTO', 3], ['FIID-C', 4], ['CUIT-C', 11], ['CBU-C', 22], ['NRO-CTA-C', 19], ['FIID-V', 4], ['CUIT-V', 11], ['CBU-V', 22], ['NRO-CTA-V', 19], ['PAN', 19], ['PAGADOR', 40], ['MISMO-TITULAR', 1], ['PREAUTORIZACIÓN', 1], ['ORIGEN', 1], ['SCORING', 3], ['ID-CONTRACARGO', 32], ['MOTIVO', 3]])) };
        return null;
      case 126: {
        if (!data.startsWith('& ')) return null;
        const out = [['Header', `${data.slice(0, 2)} cantidad ${data.slice(2, 7)} · longitud ${data.slice(7, 12)}`]];
        let i = 12;
        while (i < data.length && data.slice(i, i + 2) === '! ') { const id = data.slice(i + 2, i + 4), n = Number(data.slice(i + 4, i + 9)); out.push([`Token ${id} (${n})`, data.slice(i + 10, i + 10 + n)]); i += 10 + n; }
        return { html: partsHtml(out) };
      }
      case 90: return { html: partsHtml(parts(data, [['Tipo de mensaje original', 4], ['Número de secuencia original', 12], ['Fecha de la transacción original (mmdd)', 4], ['Hora de la transacción original', 8], ['Fecha de negocios original (mmdd)', 4], ['Ceros', 10]])) };
      case 95: return { html: partsHtml([['Monto real', money(data.slice(0, 12))], ['Ceros', data.slice(12)]]) };
      case 125: if (data.length !== 372) return null; return { html: partsHtml([['Página', data.slice(0, 2)], ['Fecha AAMMDD', data.slice(2, 8)], ['Líneas de cabecera', data.slice(8, 10)], ['Caracteres por línea', data.slice(10, 12)], ...(data.slice(12).match(/.{1,40}/g) || []).filter(l => l.trim()).map((l, i) => ['Línea ' + (i + 1), l])]) };
      case 54:
        if (/^(8[0-9])/.test(proc) && data.length === 23) return { html: partsHtml(parts(data, [['Código de ente', 3], ['Código de cliente', 19], ['Opción de la deuda', 1]])) };
        if (/^(8[0-9])/.test(proc) && data.length === 100) return { html: partsHtml(parts(data, [['Código de ente', 3], ['Código de cliente', 19], ['Cuota y año', 5], ['Filler', 73]])) };
        if (/^(18|37|38|63|68)/.test(proc) && data.length === 120) return { html: partsHtml(parts(data, [['Plazo (días)', 3], ['Importe (2 decimales)', 10], ['Forma de renovación', 1], ['Auto-renovación', 1], ['Tipo de plazo fijo', 1], ['Opción', 28], ['Filler', 76]])) };
        if (/^90/.test(proc) && data.length === 23) return { html: partsHtml(parts(data, [['Filler', 13], ['Cantidad de comprobantes', 2], ['Filler', 8]])) };
        if (data.length === 100) return { html: partsHtml(parts(data, [['Filler', 12], ['Extracciones disponibles', 2], ['Disponible compras', 12], ['Efectivo disponible', 12], ['Pago mínimo', 12], ['Fecha AAMMDD', 6], ['Tasa', 6], ['Saldo U$S', 10], ['Pago mínimo U$S', 10], ['Compras U$S', 10], ['Arancel', 8]])) };
        if (/^(21|22|50)/.test(proc)) return { text: `TIPO-DEP "${data.slice(12, 13)}" · ${({ E: 'efectivo en $', U: 'efectivo en U$S', C: 'cheque en $', W: 'cheque en U$S' })[data.slice(12, 13)] || ''}` };
        if (/^(76|77)/.test(proc)) return { text: `Efectivo (cash-back): ${money(data.slice(0, 12))}` };
        if (/^32/.test(proc)) return { text: `Nuevo PIN offset: ${data.slice(0, 16)}` };
        return null;
      case 127: if (/^34/.test(proc) && raw === 'res') return { html: partsHtml(parts(data, [['Usuario de acceso', 28], ['Clave de ingreso', 8], ['PIN de Home Banking', 6], ['Blanco', 1]])) }; return raw === 'req' ? { html: partsHtml(parts(data, [['Región', 4], ['TC comprador', 8], ['TC vendedor', 8], ['TC moneda/$', 8], ['TC moneda/U$S', 8], ['Ceros', 7]])) } : null;
      default: return null;
    }
  }
  // rc.1.26 · Quita el HTML de visualización (blancos marcados con ·) y devuelve el texto real de la trama.
  function unhtml(v) {
    return String(v ?? '').replace(/<i class="lk-sp">[^<]*<\/i>/g, ' ').replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  }
  // Reconstruye la trama LINK desde las filas [de, nombre, valorHTML, ...] (mensajes de historial viejos sin raw).
  function rawFromRows(message) {
    const rows = (message.fields || []).map(r => [Number(r[0]), unhtml(r[2])]).filter(r => r[0] > 1).sort((a, b) => a[0] - b[0]);
    const mti = String(message.mti || '');
    const header = /^04/.test(mti) ? '014000005' : (mti.endsWith('10') || mti.endsWith('30')) ? '014000015' : '014000010';
    const hasSec = rows.some(r => r[0] > 64);
    const bits = new Array(hasSec ? 128 : 64).fill(0); if (hasSec) bits[0] = 1;
    rows.forEach(([n]) => { bits[n - 1] = 1; });
    const hex = b => b.join('').match(/.{4}/g).map(x => parseInt(x, 2).toString(16).toUpperCase()).join('');
    // Los valores de las filas LINK ya incluyen el indicador de longitud de los campos LLVAR / LLLVAR.
    const body = rows.map(([, v]) => v).join('');
    return 'ISO' + header + mti + hex(bits.slice(0, 64)) + (hasSec ? hex(bits.slice(64)) : '') + body;
  }
  function parse(input) {
    let raw = unhtml(input).replace(/[\r\n]+/g, '');
    const errors = [], warnings = [], fields = [];
    let start = raw.indexOf('ISO');
    if (start < 0 || !/^ISO\d{9}\d{4}[0-9A-Fa-f]{16}/.test(raw.slice(start))) {
      // Tolerancia: trama pegada sin el encabezado "ISO" + header (arranca en el
      // MTI + bitmap primario, como suele copiarse del log). Se sintetiza un
      // encabezado para interpretarla igual.
      const mm = raw.match(/\d{4}[0-9A-Fa-f]{16}/);
      if (mm && /^\d{4}[0-9A-Fa-f]{16}/.test(raw.slice(raw.indexOf(mm[0])))) {
        raw = 'ISO014000053' + raw.slice(raw.indexOf(mm[0]));
        start = 0;
        warnings.push('La trama no incluía el encabezado "ISO" + header de 9 dígitos; se interpretó desde el MTI.');
      } else {
        return { errors: ['No se reconoce el formato LINK: se espera "ISO" + header de 9 dígitos + MTI + bitmap.'], warnings, fields };
      }
    }
    let pos = start + 3;
    const header = raw.slice(pos, pos + 9); pos += 9;
    const mti = raw.slice(pos, pos + 4); pos += 4;
    const primaryHex = raw.slice(pos, pos + 16).toUpperCase(); pos += 16;
    const bits = h => h.split('').flatMap(c => parseInt(c, 16).toString(2).padStart(4, '0').split('').map(Number));
    let allBits = bits(primaryHex), secondaryHex = null;
    const kind = mti.endsWith('10') || mti.endsWith('30') ? 'res' : 'req';
    for (let n = 1; n <= allBits.length; n++) {
      if (!allBits[n - 1]) continue;
      const d = DEF[n];
      if (!d) { errors.push(`Campo ${n} sin definición en el manual LINK.`); break; }
      let prefix = '', len = d.len;
      if (d.t !== 'F') { const k = d.t === 'LL' ? 2 : 3; prefix = raw.slice(pos, pos + k); len = Number(prefix); if (!/^\d+$/.test(prefix)) { errors.push(`Campo ${n}: indicador de longitud inválido "${prefix}".`); break; } pos += k; }
      const value = raw.slice(pos, pos + len);
      if (value.length < len) { errors.push(`Campo ${n}: la trama termina antes de tiempo (faltan ${len - value.length} caracteres).`); }
      pos += len;
      if (n === 1) { secondaryHex = value.toUpperCase(); allBits = allBits.concat(bits(secondaryHex)); }
      const ex = explain(n, value, kind, n === 39 && /^04/.test(mti) ? 'REV' : (fields.find(x => x.num === 3) || {}).value || '');
      fields.push({ num: n, name: NAMES[n] || ('Campo ' + n), fmt: d.t === 'F' ? `X(${d.len})` : d.t === 'LL' ? 'LLVAR' : 'LLLVAR', len: value.length, prefixDisplay: prefix || '—', value, valueHtml: displayValue(value) + (ex?.html || ''), desc: ex?.text || '' });
    }
    if (pos < raw.length) warnings.push(`Quedan ${raw.length - pos} caracteres sin interpretar al final de la trama.`);
    return { mti, primaryHex, secondaryHex, allBits, fields, errors, warnings, consumed: pos, total: raw.length, linkHeader: header, linkHeaderText: HEADERS[header] || 'Header no reconocido', link: true };
  }
  if (document.readyState !== 'loading') css(); else document.addEventListener('DOMContentLoaded', css);
  window.OSCLinkHth = { LINK, TX, RESULT, SCENARIOS, build, balances, displayValue, annotated, css, panelHtml, readPanel, syncPanel, accountLabel: t => LINK.accounts[t]?.label || t, parse, OPS, REVERSAL, money, unhtml, rawFromRows, reverseLater, partialCents, CASH_KINDS, buildNetwork, NET_FN,
    // rc.1.26 · Desglose de un campo LINK (lo usa el Tutor): mismo criterio que el Parser.
    explainField: (de, value, mti = '', proc = '') => explain(Number(de), unhtml(value), /10$|30$/.test(String(mti)) ? 'res' : 'req', Number(de) === 39 && /^04/.test(String(mti)) ? 'REV' : proc) };
})();
