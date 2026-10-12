/* OSC Academy v4.0.0-rc.1.24 · Evaluaciones de interpretación de tramas (grupo técnico).
   Etapas: inicial (diagnóstico), intermedia y final.
   - Cada alumno y cada intento reciben tramas propias, generadas en el servidor (las respuestas nunca viajan al navegador).
   - Inicial e intermedia: un intento; cada respuesta se guarda en firme y al guardar la última se valida (0 a 100).
   - Final: 30 minutos, aprueba con 70/100, hasta 5 intentos; se guardan todos y se informa en qué intento aprobó.
   - Dos puntajes: Decodificar (fin de MTI, nibbles → bits, extracción de campos) e Interpretar (DE 3). */

export const STAGES = {
  inicial: { label: 'Evaluación inicial', maxAttempts: 1, minutes: 0, pass: null },
  intermedia: { label: 'Evaluación intermedia', maxAttempts: 1, minutes: 0, pass: null },
  final: { label: 'Evaluación final', maxAttempts: 5, minutes: 30, pass: 70 }
};

const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const digits = n => Array.from({ length: n }, () => rnd(10)).join('');
const hex = n => Array.from({ length: n }, () => '0123456789ABCDEF'[rnd(16)]).join('');
const pad = (v, n) => String(v).slice(0, n).padEnd(n, ' ');
const p2 = n => String(n).padStart(2, '0');
function luhn(base) { let t = 0; [...base].reverse().forEach((d, i) => { d = +d; if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; } t += d; }); return base + ((10 - (t % 10)) % 10); }

/* ---------- Perfiles de trama ---------- */
// Tarjetas (Visa / Mastercard / Amex en representación texto/ASCII con bitmap en hex, como el Parser de la plataforma).
const CARD_DEF = {
  2: { t: 'LL', name: 'Primary Account Number (PAN)' }, 3: { t: 'F', len: 6, name: 'Processing Code' }, 4: { t: 'F', len: 12, name: 'Amount, Transaction' },
  7: { t: 'F', len: 10, name: 'Transmission Date and Time' }, 11: { t: 'F', len: 6, name: 'System Trace Audit Number (STAN)' }, 12: { t: 'F', len: 6, name: 'Local Transaction Time' },
  13: { t: 'F', len: 4, name: 'Local Transaction Date' }, 14: { t: 'F', len: 4, name: 'Expiration Date' }, 18: { t: 'F', len: 4, name: 'Merchant Category Code' },
  22: { t: 'F', len: 3, name: 'POS Entry Mode' }, 25: { t: 'F', len: 2, name: 'POS Condition Code' }, 32: { t: 'LL', name: 'Acquiring Institution ID' },
  35: { t: 'LL', name: 'Track 2 Data' }, 37: { t: 'F', len: 12, name: 'Retrieval Reference Number' }, 38: { t: 'F', len: 6, name: 'Authorization ID Response' },
  39: { t: 'F', len: 2, name: 'Response Code' }, 41: { t: 'F', len: 8, name: 'Card Acceptor Terminal ID' }, 42: { t: 'F', len: 15, name: 'Card Acceptor ID Code' },
  43: { t: 'F', len: 40, name: 'Card Acceptor Name/Location' }, 49: { t: 'F', len: 3, name: 'Currency Code, Transaction' }, 52: { t: 'F', len: 16, name: 'PIN Data' },
  55: { t: 'LLL', name: 'ICC Data (EMV)' }, 100: { t: 'LL', name: 'Receiving Institution ID' }, 102: { t: 'LL', name: 'Account Identification 1' }, 103: { t: 'LL', name: 'Account Identification 2' }
};
// American Express (Network Specifications · Authorization, Oct 2023): 1100/1110, Bit 12 de 12 posiciones, Bit 22 POS Data Code (12), Bit 24 Function Code, Bit 39 Action Code (3).
const AMEX_DEF = {
  2: { t: 'LL', name: 'Primary Account Number' }, 3: { t: 'F', len: 6, name: 'Processing Code' }, 4: { t: 'F', len: 12, name: 'Amount, Transaction' },
  7: { t: 'F', len: 10, name: 'Date and Time, Transmission' }, 11: { t: 'F', len: 6, name: 'Systems Trace Audit Number' }, 12: { t: 'F', len: 12, name: 'Date and Time, Local Transaction' },
  14: { t: 'F', len: 4, name: 'Date, Expiration' }, 19: { t: 'F', len: 3, name: 'Country Code, Acquiring Institution' }, 22: { t: 'F', len: 12, name: 'Point of Service Data Code' },
  24: { t: 'F', len: 3, name: 'Function Code' }, 26: { t: 'F', len: 4, name: 'Card Acceptor Business Code' }, 32: { t: 'LL', name: 'Acquiring Institution Identification Code' },
  35: { t: 'LL', name: 'Track 2 Data' }, 37: { t: 'F', len: 12, name: 'Acquirer Reference Number' }, 38: { t: 'F', len: 6, name: 'Approval Code' }, 39: { t: 'F', len: 3, name: 'Action Code' },
  41: { t: 'F', len: 8, name: 'Card Acceptor Terminal Identification' }, 42: { t: 'F', len: 15, name: 'Card Acceptor Identification Code' }, 49: { t: 'F', len: 3, name: 'Currency Code, Transaction' },
  52: { t: 'F', len: 16, name: 'Personal Identification Number (PIN) Data' }, 55: { t: 'LLL', name: 'ICC System Related Data' }
};
// Red LINK (BASE24 Host to Host: "ISO" + header + MTI + bitmap). Anchos según C-X-1-2-3.
const LINK_DEF = {
  3: { t: 'F', len: 6, name: 'proc-cde' }, 4: { t: 'F', len: 12, name: 'tran-amt' }, 7: { t: 'F', len: 10, name: 'xmit-dat-tim' }, 11: { t: 'F', len: 6, name: 'trace-num' },
  12: { t: 'F', len: 6, name: 'tran-tim' }, 13: { t: 'F', len: 4, name: 'tran-dat' }, 15: { t: 'F', len: 4, name: 'setl-dat' }, 17: { t: 'F', len: 4, name: 'cap-dat' },
  32: { t: 'LL', name: 'acq-inst-id' }, 35: { t: 'LL', name: 'track 2' }, 37: { t: 'F', len: 12, name: 'retrvl-ref-num' }, 38: { t: 'F', len: 6, name: 'auth-id-resp' },
  39: { t: 'F', len: 2, name: 'resp-cde' }, 41: { t: 'F', len: 16, name: 'term-id' }, 42: { t: 'F', len: 15, name: 'crd-accpt-id-cde' }, 43: { t: 'F', len: 40, name: 'crd-accpt-name-loc' },
  44: { t: 'LL', name: 'resp-data' }, 49: { t: 'F', len: 3, name: 'crncy-cde' }, 52: { t: 'F', len: 16, name: 'pin' }, 54: { t: 'LLL', name: 'add-amts' },
  60: { t: 'LLL', name: 'pri-rsrvd1-prvt' }, 61: { t: 'LLL', name: 'pri-rsrvd2-prvt' }, 100: { t: 'LL', name: 'rcv-inst' }, 102: { t: 'LL', name: 'acct1' }, 103: { t: 'LL', name: 'acct2' }
};

export const DE3_OPTIONS = {
  card: {
    tx: { '00': 'Compra de bienes y servicios', '01': 'Retiro de efectivo / extracción', '09': 'Compra con cashback', '20': 'Devolución', '30': 'Consulta de saldo', '40': 'Transferencia' },
    acct: { '00': 'Sin especificar / por defecto', '10': 'Caja de ahorro', '20': 'Cuenta corriente', '30': 'Cuenta de crédito' },
    combos: ['000000', '001000', '002000', '003000', '010000', '011000', '012000', '090000', '200000', '201000', '202000', '300000', '301000', '302000', '401020', '402010']
  },
  // Amex: el Processing Code se interpreta como código completo (Codes Reference Guide, Processing Codes · Authorizations).
  amex: {
    codes: { '004000': 'Card Authorization Request (compra)', '004800': 'Purchase Authorization and Address Verification Request', '014000': 'Cash Request / Cash Advance', '014008': 'Cash Disbursement Debit', '024000': 'Merchant Initiated Reversal', '174800': 'Address Verification Request Only', '200000': 'Credit / Returns', '200800': 'Credit/Return Authorization and Address Verification', '204000': 'Credit / Refund', '220000': 'Authorization Adjustment' },
    combos: ['004000', '004800', '014000', '174800', '200000', '200800', '204000']
  },
  link: {
    tx: { '01': 'Extracción', '09': 'Débito por transferencia interbancaria', '29': 'Orden de acreditación por transferencia', '31': 'Consulta de saldos', '71': 'Compra con débito (Maestro)', '74': 'Devolución de compra' },
    acct: { '00': 'Sin cuenta', '10': 'Caja de ahorros en pesos', '20': 'Cuenta corriente en pesos', '15': 'Caja de ahorros en dólares', '07': 'Cuenta corriente en dólares', '30': 'Cuenta tarjeta de crédito en pesos' },
    combos: ['011000', '012000', '011500', '311000', '312000', '091000', '092000', '290010', '290020', '711000', '712000', '741000']
  }
};

function cardValues(network) {
  const panByNet = { visa: ['4111111111111111', '4000000000000002', luhn('476173' + digits(9))], mastercard: ['5555555555554444', '2223000048408210', luhn('545454' + digits(9))], amex: ['371449635398431', '341234567890127'] };
  const d = new Date(Date.now() - rnd(5 * 86400e3));
  const pan = pick(panByNet[network] || panByNet.visa);
  return {
    2: pan, 4: String(1000 + rnd(9999000)).padStart(12, '0'), 7: p2(d.getMonth() + 1) + p2(d.getDate()) + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds()),
    11: digits(6), 12: p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds()), 13: p2(d.getMonth() + 1) + p2(d.getDate()), 14: pick(['2712', '2812', '2912', '3005']),
    18: pick(['5411', '5812', '5999', '5541', '6011']), 22: pick(['051', '071', '901', '011']), 25: '00', 32: digits(6 + rnd(6)), 35: `${pan}=${pick(['2912', '2812'])}201${digits(8)}`,
    37: digits(12), 38: digits(6), 39: pick(['00', '00', '51', '05', '55']), 41: 'TERM' + digits(4), 42: pad('COM' + digits(8), 15),
    43: pad(pick(['SUPERMERCADO OSC', 'FARMACIA CENTRAL', 'ESTACION RUTA 9', 'LIBRERIA DEL SOL']), 25) + pad('BUENOS AIRES', 13) + 'AR', 49: pick(['032', '032', '840']),
    52: hex(16), 55: '9F2608' + hex(16) + '9F2701809F10' + '12' + hex(36) + '9F3704' + hex(8) + '9F3602' + hex(4) + '950500000' + hex(5) + '9A03' + p2(d.getFullYear() % 100) + p2(d.getMonth() + 1) + p2(d.getDate()) + '9C0100',
    100: digits(6 + rnd(5)), 102: digits(10 + rnd(9)), 103: digits(10 + rnd(9))
  };
}
function amexValues() {
  const d = new Date(Date.now() - rnd(5 * 86400e3));
  const pan = pick(['371449635398431', '341234567890127', luhn('37828224631' + digits(3))]);
  const yy = p2(d.getFullYear() % 100), mm = p2(d.getMonth() + 1), dd = p2(d.getDate()), hh = p2(d.getHours()), mi = p2(d.getMinutes()), ss = p2(d.getSeconds());
  return {
    2: pan, 4: String(1000 + rnd(9999000)).padStart(12, '0'), 7: mm + dd + hh + mi + ss, 11: digits(6), 12: yy + mm + dd + hh + mi + ss, 14: pick(['2712', '2812', '2912', '3005']),
    19: '032', 22: pick(['561101500340', '56110X500140', '261101200120']), 24: '100', 26: pick(['5812', '5411', '5999', '4722']), 32: digits(11),
    35: `${pan}=${pick(['2912', '2812'])}${digits(10)}`, 37: digits(12), 38: digits(6), 39: pick(['000', '000', '100', '116']), 41: 'TERM' + digits(4),
    42: digits(10) + '     ', 49: '032', 52: hex(16),
    55: 'AGNS0001' + '9F2608' + hex(16) + '9F2701809F10' + '07' + hex(14) + '9F3704' + hex(8) + '9F3602' + hex(4) + '9A03' + yy + mm + dd + '9C0100'
  };
}
function linkValues() {
  const d = new Date(Date.now() - rnd(5 * 86400e3));
  const pan = luhn('990002' + digits(9));
  return {
    4: String(1000 + rnd(9999000)).padStart(12, '0'), 7: p2(d.getMonth() + 1) + p2(d.getDate()) + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds()),
    11: digits(6), 12: p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds()), 13: p2(d.getMonth() + 1) + p2(d.getDate()), 15: '0000', 17: p2(d.getMonth() + 1) + p2(d.getDate()),
    32: '000000' + digits(5), 35: pad(`${pan}=2912120${digits(10)}`, 37), 37: digits(12), 38: digits(6), 39: pick(['00', '00', '51', '55', '61']),
    41: pad('S1AX' + digits(4), 16), 42: pad('', 15), 43: pad(pick(['BANCO DIDACTICO ATM', 'BANCO OSC SUC 12', 'CAJERO RED LINK']), 22) + pad('CAP. FED.', 13) + 'BUE' + 'AR',
    44: '2' + digits(12) + digits(12), 49: '032', 52: hex(16), 54: pad('', 23), 60: '0' + digits(3) + 'PRO1+000', 61: '0' + digits(3) + 'PRO11000P',
    100: '000000' + digits(5), 102: pad('0000003' + digits(12), 28), 103: pad('', 28)
  };
}

function encodeField(def, value) {
  const v = String(value);
  if (def.t === 'LL') return String(v.length).padStart(2, '0') + v;
  if (def.t === 'LLL') return String(v.length).padStart(3, '0') + v;
  return v.padEnd(def.len, ' ').slice(0, def.len);
}
function bitmapOf(list) {
  const bits = new Set(list);
  if (list.some(n => n > 64)) bits.add(1);
  const h = from => { let s = ''; for (let i = from; i < from + 64; i++) s += bits.has(i) ? '1' : '0'; return s.match(/.{4}/g).map(x => parseInt(x, 2).toString(16).toUpperCase()).join(''); };
  return { primary: h(1), secondary: bits.has(1) ? h(65) : null };
}
// Arma la trama y registra la posición de cada parte (para corregir).
function buildTrama({ profile, network, mti, fields, de3 }) {
  const DEF = profile === 'link' ? LINK_DEF : profile === 'amex' ? AMEX_DEF : CARD_DEF;
  const values = profile === 'link' ? linkValues() : profile === 'amex' ? amexValues() : cardValues(network);
  values[3] = de3;
  if (mti.endsWith('10')) values[39] = values[39] || (profile === 'amex' ? '000' : '00');
  const list = [...fields].sort((a, b) => a - b);
  const bm = bitmapOf(list);
  let raw = profile === 'link' ? 'ISO014000010' : '';
  const mtiStart = raw.length;
  raw += mti;
  const bitmapStart = raw.length;
  raw += bm.primary;
  const parts = {};
  if (bm.secondary) { parts[1] = { start: raw.length, prefix: '', value: bm.secondary }; raw += bm.secondary; }
  for (const n of list) {
    const def = DEF[n];
    const enc = encodeField(def, values[n]);
    const prefixLen = def.t === 'LL' ? 2 : def.t === 'LLL' ? 3 : 0;
    parts[n] = { start: raw.length, prefix: enc.slice(0, prefixLen), value: enc.slice(prefixLen), type: def.t, name: def.name };
    raw += enc;
  }
  return { raw, mti, mtiStart, mtiEnd: mtiStart + 3, bitmapStart, primary: bm.primary, secondary: bm.secondary, parts, profile, network };
}

/* ---------- Preguntas ---------- */
function nibbleQuestion(id, t, which, avoid = []) {
  const bm = which === 'secondary' ? t.secondary : t.primary;
  const offset = which === 'secondary' ? 64 : 0;
  // Elige un par con al menos 2 bits encendidos y que no se haya usado.
  const candidates = [];
  for (let k = 0; k < 8; k++) {
    const pair = bm.slice(2 * k, 2 * k + 2);
    const bits = parseInt(pair, 16).toString(2).padStart(8, '0');
    if ((bits.match(/1/g) || []).length >= 2 && !avoid.includes(which + k)) candidates.push(k);
  }
  const k = candidates.length ? pick(candidates) : 0;
  const pair = bm.slice(2 * k, 2 * k + 2);
  const bits = parseInt(pair, 16).toString(2).padStart(8, '0');
  const fields = [...bits].map((b, i) => (b === '1' ? offset + 8 * k + i + 1 : null)).filter(Boolean);
  const label = which === 'secondary' ? 'bitmap secundario' : 'bitmap primario';
  return {
    id, kind: 'decode', type: 'nibbles', tramaId: t.id, key: which + k,
    prompt: `En el ${label}, tomá el par de caracteres N° ${k + 1} (caracteres ${2 * k + 1} y ${2 * k + 2} del ${label}). Convertí esos 2 nibbles a 8 bits y marcá qué campos quedan activos.`,
    positions: Array.from({ length: 8 }, (_, i) => offset + 8 * k + i + 1),
    answer: { bits, fields }
  };
}
function extractQuestion(id, t, de) {
  const p = t.parts[de];
  const varLen = p.type === 'LL' || p.type === 'LLL';
  return {
    id, kind: 'decode', type: 'extract', tramaId: t.id, de,
    prompt: varLen
      ? `Extraé el DE ${de} (${p.name}). Es de longitud variable (${p.type === 'LL' ? 'LLVAR: 2 dígitos' : 'LLLVAR: 3 dígitos'} de longitud): indicá el prefijo y el valor.`
      : `Extraé el valor del DE ${de} (${p.name}).`,
    varLen, prefixDigits: p.type === 'LL' ? 2 : p.type === 'LLL' ? 3 : 0,
    answer: { prefix: p.prefix, value: p.value }
  };
}
function de3Question(id, t) {
  const v = t.parts[3].value;
  if (t.profile === 'amex') return { id, kind: 'interpret', type: 'de3', tramaId: t.id, prompt: `Interpretá el Bit 3 (Processing Code) de la trama ${t.label}: ubicalo y elegí qué significa ese código.`, profile: 'amex', answer: { code: v } };
  return { id, kind: 'interpret', type: 'de3', tramaId: t.id, prompt: `Interpretá el DE 3 (Processing Code) de la trama ${t.label}: ubicalo y elegí qué significa cada par de dígitos.`, profile: t.profile, answer: { tx: v.slice(0, 2), from: v.slice(2, 4), to: v.slice(4, 6) } };
}

const TEMPLATES = {
  card: {
    inicial: [3, 4, 7, 11, 12, 13, 18, 22, 25, 37, 41, 42, 49],
    intermedia: [2, 3, 4, 7, 11, 12, 13, 22, 25, 32, 35, 37, 41, 42, 49, 102],
    final: [2, 3, 4, 7, 11, 12, 13, 14, 22, 25, 32, 35, 37, 41, 42, 43, 49, 52, 55, 100, 102],
    response: [2, 3, 4, 7, 11, 12, 13, 37, 38, 39, 41, 49],
    simple: [2, 3, 4, 7, 11, 12, 13, 22, 37, 41, 49]
  },
  amex: {
    inicial: [3, 4, 7, 11, 12, 14, 19, 22, 24, 26, 37, 41, 42, 49],
    intermedia: [2, 3, 4, 7, 11, 12, 14, 19, 22, 24, 26, 32, 35, 37, 41, 42, 49],
    final: [2, 3, 4, 7, 11, 12, 14, 19, 22, 24, 26, 32, 35, 37, 41, 42, 49, 52, 55],
    response: [2, 3, 4, 7, 11, 12, 32, 37, 38, 39, 41, 49],
    simple: [2, 3, 4, 7, 11, 12, 19, 22, 24, 37, 41, 49]
  },
  link: {
    inicial: [3, 4, 7, 11, 12, 13, 15, 17, 37, 41, 42, 43, 49, 52],
    intermedia: [3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 41, 42, 43, 49, 52, 100, 102],
    final: [3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 41, 42, 43, 49, 52, 54, 60, 61, 100, 102, 103],
    response: [3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 38, 39, 41, 44, 49, 61, 100, 102],
    simple: [3, 4, 7, 11, 12, 13, 17, 32, 35, 37, 41, 49]
  }
};

export function generateExam(stage, networks) {
  const cardNets = ['visa', 'mastercard', 'amex'].filter(n => networks.includes(n));
  const network = cardNets.length ? pick(cardNets) : 'link';
  const profile = network === 'link' ? 'link' : network === 'amex' ? 'amex' : 'card';
  const T = TEMPLATES[profile];
  const combos = [...DE3_OPTIONS[profile].combos].sort(() => Math.random() - 0.5);
  const reqMti = profile === 'link' ? '0200' : profile === 'amex' ? '1100' : pick(['0100', '0200']);
  const mk = (id, label, mti, fields) => ({ id, label, ...buildTrama({ profile, network, mti, fields, de3: combos.shift() }) });
  const tramas = [], q = [];
  const main = mk('A', 'A', reqMti, T[stage]);
  tramas.push(main);
  q.push({ id: 'q1', kind: 'decode', type: 'mti', tramaId: 'A', prompt: 'Hacé clic sobre el ÚLTIMO carácter del MTI de la trama A.', answer: { index: main.mtiEnd } });
  const fixedCandidates = Object.keys(main.parts).map(Number).filter(n => n > 1 && n !== 3 && main.parts[n].type === 'F' && /\S/.test(main.parts[n].value) && main.parts[n].value.trim().length >= 3);
  const shuffled = fixedCandidates.sort(() => Math.random() - 0.5);
  const varCandidates = Object.keys(main.parts).map(Number).filter(n => ['LL', 'LLL'].includes(main.parts[n].type) && n !== 54);
  if (stage === 'inicial') {
    q.push(nibbleQuestion('q2', main, 'primary'));
    q.push(extractQuestion('q3', main, shuffled[0]), extractQuestion('q4', main, shuffled[1]));
    q.push(de3Question('q5', main));
  } else if (stage === 'intermedia') {
    const n1 = nibbleQuestion('q2', main, 'primary');
    q.push(n1, nibbleQuestion('q3', main, main.secondary ? 'secondary' : 'primary', [n1.key]));
    const ll = varCandidates.filter(n => main.parts[n].type === 'LL');
    q.push(extractQuestion('q4', main, shuffled[0]), extractQuestion('q5', main, shuffled[1]), extractQuestion('q6', main, pick(ll.length ? ll : varCandidates)));
    const b = mk('B', 'B', reqMti, T.simple); tramas.push(b);
    q.push(de3Question('q7', main), de3Question('q8', b));
  } else {
    const n1 = nibbleQuestion('q2', main, 'primary');
    const n2 = nibbleQuestion('q3', main, 'primary', [n1.key]);
    q.push(n1, n2, nibbleQuestion('q4', main, main.secondary ? 'secondary' : 'primary', [n1.key, n2.key]));
    const ll = varCandidates.filter(n => main.parts[n].type === 'LL'), lll = varCandidates.filter(n => main.parts[n].type === 'LLL');
    q.push(extractQuestion('q5', main, shuffled[0]), extractQuestion('q6', main, shuffled[1]), extractQuestion('q7', main, pick(ll)), extractQuestion('q8', main, pick(lll.length ? lll : ll)));
    const b = mk('B', 'B', reqMti, T.simple); tramas.push(b);
    const c = mk('C', 'C (respuesta)', reqMti === '0100' ? '0110' : reqMti === '1100' ? '1110' : '0210', T.response); tramas.push(c);
    q.push(de3Question('q9', main), de3Question('q10', b), de3Question('q11', c));
  }
  return { stage, profile, network, tramas: tramas.map(t => ({ id: t.id, label: t.label, raw: t.raw, mti: t.mti, profile: t.profile, network: t.network, mtiStart: t.mtiStart, bitmapStart: t.bitmapStart })), questions: q, createdAt: new Date().toISOString() };
}
export function publicExam(exam) {
  return { ...exam, questions: exam.questions.map(({ answer, key, ...rest }) => rest), de3Options: exam.profile === 'amex' ? { codes: DE3_OPTIONS.amex.codes } : DE3_OPTIONS[exam.profile] ? { tx: DE3_OPTIONS[exam.profile].tx, acct: DE3_OPTIONS[exam.profile].acct } : null };
}

/* ---------- Corrección (crédito 0 a 1 por pregunta) ---------- */
const norm = v => String(v ?? '').trim().toUpperCase();
export function gradeAnswer(q, a) {
  if (!a) return 0;
  switch (q.type) {
    case 'mti': return Number(a.index) === q.answer.index ? 1 : 0;
    case 'nibbles': {
      const bitsOk = String(a.bits || '').replace(/\s/g, '') === q.answer.bits ? 0.5 : 0;
      const got = [...new Set((a.fields || []).map(Number))].sort((x, y) => x - y).join(',');
      const want = [...q.answer.fields].sort((x, y) => x - y).join(',');
      return bitsOk + (got === want ? 0.5 : 0);
    }
    case 'extract': {
      const valueOk = norm(a.value) === norm(q.answer.value);
      if (!q.varLen) return valueOk ? 1 : 0;
      return (norm(a.prefix) === norm(q.answer.prefix) ? 0.5 : 0) + (valueOk ? 0.5 : 0);
    }
    case 'de3': if (q.answer.code) return a.code === q.answer.code ? 1 : 0; return ((a.tx === q.answer.tx) + (a.from === q.answer.from) + (a.to === q.answer.to)) / 3;
    default: return 0;
  }
}
export function scoreAttempt(exam, answers) {
  let total = 0, dec = 0, decN = 0, int = 0, intN = 0;
  const detail = exam.questions.map(q => {
    const credit = gradeAnswer(q, answers[q.id]);
    total += credit;
    if (q.kind === 'decode') { dec += credit; decN++; } else { int += credit; intN++; }
    return { id: q.id, kind: q.kind, type: q.type, credit: Math.round(credit * 100) / 100 };
  });
  const pct = (x, n) => (n ? Math.round((x / n) * 100) : null);
  return { score: pct(total, exam.questions.length), decode: pct(dec, decN), interpret: pct(int, intN), detail };
}
