/* OSC Academy · Parser Guiado — núcleo (tabla de campos, decodificador de referencia y banco de tramas).
 * Perfil de campos VISA. Longitudes/formatos verificados contra el manual oficial
 * "Full Service POS Online Messages – Technical Specifications" (Visa, 14 April 2025), sección Data Field Descriptions.
 * Nota: el manual define el prefijo de longitud de los campos variables como 1 byte binario en la trama de red;
 * en este módulo se usa la convención didáctica de la plataforma (prefijo decimal ASCII, igual que Constructor y Parser).
 * Convención LLVAR/LLLVAR: prefijo decimal ASCII (2/3 dígitos) = cantidad de CARACTERES del valor.
 */
(function (root) {
  "use strict";

  // kind: FIX (longitud fija) | LLVAR | LLLVAR
  const FIELDS = {
    2: { name: "Primary Account Number", kind: "LLVAR", type: "N", max: 19, note: "Número de tarjeta. En la práctica se usan PAN de prueba." },
    3: { name: "Processing Code", kind: "FIX", type: "N", len: 6, note: "Tipo de transacción y cuentas origen/destino." },
    4: { name: "Amount, Transaction", kind: "FIX", type: "N", len: 12, note: "Importe sin separador decimal." },
    7: { name: "Transmission Date and Time", kind: "FIX", type: "N", len: 10, note: "MMDDhhmmss (GMT)." },
    11: { name: "System Trace Audit Number", kind: "FIX", type: "N", len: 6, note: "STAN: número de seguimiento del mensaje." },
    12: { name: "Time, Local Transaction", kind: "FIX", type: "N", len: 6, note: "Hora local hhmmss." },
    13: { name: "Date, Local Transaction", kind: "FIX", type: "N", len: 4, note: "Fecha local MMDD." },
    14: { name: "Date, Expiration", kind: "FIX", type: "N", len: 4, note: "Vencimiento de la tarjeta AAMM." },
    18: { name: "Merchant Type", kind: "FIX", type: "N", len: 4, note: "MCC del comercio." },
    22: { name: "Point-of-Service Entry Mode Code", kind: "FIX", type: "N", len: 4, note: "Pos. 1-2 modo de ingreso del PAN (05 chip, 02 banda, 07 contactless), pos. 3 capacidad de PIN, pos. 4 relleno en cero." },
    25: { name: "Point-of-Service Condition Code", kind: "FIX", type: "N", len: 2, note: "Condición del punto de servicio (2 dígitos)." },
    32: { name: "Acquiring Institution Identification Code", kind: "LLVAR", type: "N", max: 11, note: "Identificador del adquirente." },
    37: { name: "Retrieval Reference Number", kind: "FIX", type: "AN", len: 12, note: "RRN: referencia de recuperación." },
    38: { name: "Authorization Identification Response", kind: "FIX", type: "AN", len: 6, note: "Código de autorización asignado por el emisor." },
    39: { name: "Response Code", kind: "FIX", type: "AN", len: 2, note: "Resultado de la operación." },
    41: { name: "Card Acceptor Terminal Identification", kind: "FIX", type: "ANS", len: 8, note: "Identificador de terminal." },
    42: { name: "Card Acceptor Identification Code", kind: "FIX", type: "ANS", len: 15, note: "Identificador del comercio." },
    43: { name: "Card Acceptor Name/Location", kind: "FIX", type: "ANS", len: 40, note: "Nombre (25), ciudad (13) y país (2)." },
    49: { name: "Currency Code, Transaction", kind: "FIX", type: "N", len: 3, note: "Moneda ISO 4217 numérica." },
    54: { name: "Additional Amounts", kind: "LLLVAR", type: "ANS", max: 120, note: "Importes adicionales: 20 caracteres por importe (tipo de cuenta, tipo de importe, moneda, signo, monto); el manual admite 20, 40, 60, 80, 100 ó 120." },
    55: { name: "Integrated Circuit Card (ICC)-Related Data", kind: "LLLVAR", type: "B", max: 510, note: "Datos EMV (TLV) en hexadecimal." },
    60: { name: "Additional POS Information", kind: "LLLVAR", type: "N", max: 12, note: "Pos. 1 tipo de terminal, pos. 2 capacidad de lectura, pos. 3 condición de chip, pos. 4 condición especial." },
    90: { name: "Original Data Elements", kind: "FIX", type: "N", len: 42, note: "Datos del mensaje original (MTI, STAN, fecha, adquirente, forwarding)." },
    100: { name: "Receiving Institution Identification Code", kind: "LLVAR", type: "N", max: 11, note: "Identificador de la institución receptora." },
  };

  const prefixLen = (f) => (f.kind === "LLLVAR" ? 3 : f.kind === "LLVAR" ? 2 : 0);
  const kindLabel = (f) => (f.kind === "FIX" ? `${f.type}${f.len}` : `${f.kind} ${f.type}`);

  const hexToBits = (hex) =>
    hex.split("").map((c) => parseInt(c, 16).toString(2).padStart(4, "0")).join("");

  /** Decodifica una trama ASCII (MTI + bitmap hex + campos). Devuelve posiciones para poder resaltar. */
  function decode(raw) {
    const out = { raw, mti: raw.slice(0, 4), errors: [], fields: [] };
    let pos = 4;
    const primary = raw.slice(pos, pos + 16).toUpperCase();
    if (!/^[0-9A-F]{16}$/.test(primary)) { out.errors.push("Bitmap primario inválido."); return out; }
    let bitmap = primary; pos += 16;
    let bits = hexToBits(primary);
    if (bits[0] === "1") {
      const sec = raw.slice(pos, pos + 16).toUpperCase();
      if (!/^[0-9A-F]{16}$/.test(sec)) { out.errors.push("Bitmap secundario inválido."); return out; }
      bitmap += sec; pos += 16; bits += hexToBits(sec);
    }
    out.bitmapHex = bitmap; out.bitmapStart = 4; out.bitmapEnd = pos - 1; // índice inclusivo del último char
    out.bits = bits;
    out.present = [];
    for (let i = 1; i < bits.length; i++) if (bits[i] === "1" && i + 1 !== 65) out.present.push(i + 1);
    for (const de of out.present) {
      const f = FIELDS[de];
      if (!f) { out.errors.push(`DE${de} no está definido en el perfil.`); break; }
      const start = pos; let prefix = "", len;
      const pl = prefixLen(f);
      if (pl) {
        prefix = raw.substr(pos, pl);
        if (!/^\d+$/.test(prefix)) { out.errors.push(`DE${de}: prefijo de longitud inválido.`); break; }
        len = parseInt(prefix, 10); pos += pl;
      } else len = f.len;
      const value = raw.substr(pos, len);
      if (value.length !== len) { out.errors.push(`DE${de}: trama incompleta.`); break; }
      pos += len;
      out.fields.push({ de, prefix, value, len, start, valueStart: start + pl, end: pos - 1, def: f });
    }
    if (pos !== raw.length) out.errors.push(`Sobran ${raw.length - pos} caracteres al final de la trama.`);
    return out;
  }

  /** Arma una trama a partir de MTI + {de: valor}. Útil para que el instructor agregue tramas al banco. */
  function buildFrame(mti, values) {
    const des = Object.keys(values).map(Number).sort((a, b) => a - b);
    const bits = new Array(128).fill(0);
    des.forEach((d) => (bits[d - 1] = 1));
    if (des.some((d) => d > 64)) bits[0] = 1;
    const n = bits[0] ? 128 : 64;
    let hex = "";
    for (let i = 0; i < n; i += 4) hex += parseInt(bits.slice(i, i + 4).join(""), 2).toString(16).toUpperCase();
    let body = "";
    for (const d of des) {
      const f = FIELDS[d]; const v = String(values[d]);
      if (f.kind === "FIX" && v.length !== f.len) throw new Error(`DE${d}: longitud ${v.length}, esperada ${f.len}`);
      if (f.kind !== "FIX" && f.max && v.length > f.max) throw new Error(`DE${d}: supera máximo ${f.max}`);
      body += (prefixLen(f) ? String(v.length).padStart(prefixLen(f), "0") : "") + v;
    }
    return mti + hex + body;
  }

  // ---------- Banco de tramas de práctica ----------
  const tlv = (tag, val) => tag + (val.length / 2).toString(16).toUpperCase().padStart(2, "0") + val;
  const emv = (o) =>
    [tlv("9F26", o.arqc), tlv("9F27", "80"), tlv("9F10", o.iad), tlv("9F37", o.un), tlv("9F36", o.atc),
     tlv("95", "0000008001"), tlv("9A", o.date), tlv("9C", "00"), tlv("9F02", o.amt), tlv("5F2A", "0032"),
     tlv("82", "1980"), tlv("9F1A", "0032"), tlv("9F33", "E0F8C8"), tlv("9F34", "1E0300"), tlv("9F35", "22")].join("");
  const loc = (name, city) => name.padEnd(25) + city.padEnd(13) + "AR";
  const orig = (mti, stan, dt, acq) => mti + stan + dt + acq.padStart(11, "0") + "".padStart(11, "0");

  const BANK = [
    // ---- Nivel 1: bitmap primario, solo campos de longitud fija ----
    { id: "L1-01", level: 1, title: "Respuesta de compra aprobada", mti: "0210",
      spec: { 3: "000000", 4: "000000150000", 7: "0918143022", 11: "004512", 12: "113022", 13: "0918", 37: "626110004512", 38: "A1B2C3", 39: "00", 41: "POS00417", 42: "COMER0000012345", 43: loc("LIBRERIA EL ATENEO", "BUENOS AIRES"), 49: "032" } },
    { id: "L1-02", level: 1, title: "Respuesta de compra rechazada (fondos insuficientes)", mti: "0210",
      spec: { 3: "000000", 4: "000000420000", 7: "0918151207", 11: "004518", 12: "121207", 13: "0918", 37: "626112004518", 39: "51", 41: "POS00233", 42: "COMER0000098765", 43: loc("FARMACIA DEL PUEBLO", "ROSARIO"), 49: "032" } },
    { id: "L1-03", level: 1, title: "Respuesta de reversa", mti: "0410",
      spec: { 3: "000000", 4: "000000089900", 7: "0918162545", 11: "004530", 37: "626113004530", 39: "00", 41: "POS00417", 49: "032" } },
    // ---- Nivel 2: bitmap primario + secundario, fijos y LLVAR ----
    { id: "L2-01", level: 2, title: "Reversa de compra (0400)", mti: "0400",
      spec: { 2: "4111111111111111", 3: "000000", 4: "000000150000", 7: "0918143511", 11: "004533", 12: "113511", 13: "0918", 14: "2812", 18: "5942", 22: "0510", 25: "00", 32: "460001", 37: "626110004512", 41: "POS00417", 42: "COMER0000012345", 43: loc("LIBRERIA EL ATENEO", "BUENOS AIRES"), 49: "032", 90: orig("0200", "004512", "0918143022", "460001") } },
    { id: "L2-02", level: 2, title: "Aviso de reversa por timeout (0420)", mti: "0420",
      spec: { 2: "4012888888881881", 3: "000000", 4: "000000275050", 7: "0918171404", 11: "004561", 12: "141404", 13: "0918", 18: "5411", 22: "0210", 25: "00", 32: "460001", 37: "626114004561", 41: "POS00871", 42: "COMER0000045678", 43: loc("SUPERMERCADO LA ESQUINA", "CORDOBA"), 49: "032", 90: orig("0200", "004559", "0918171310", "460001"), 100: "482900" } },
    { id: "L2-03", level: 2, title: "Reversa de retiro de efectivo (0400)", mti: "0400",
      spec: { 2: "4917610000000000", 3: "010000", 4: "000000500000", 7: "0918184920", 11: "004602", 12: "154920", 13: "0918", 14: "2711", 18: "6011", 22: "0510", 32: "460077", 37: "626115004602", 41: "ATM00012", 42: "BANCO0000000012", 43: loc("CAJERO SUCURSAL CENTRO", "MENDOZA"), 49: "032", 90: orig("0200", "004598", "0918184802", "460077"), 100: "482900" } },
    // ---- Nivel 3: trama completa con LLLVAR (ICC/EMV, importes adicionales) ----
    { id: "L3-01", level: 3, title: "Compra con chip (0200)", mti: "0200",
      spec: { 2: "4111111111111111", 3: "000000", 4: "000000150000", 7: "0918143022", 11: "004512", 12: "113022", 13: "0918", 14: "2812", 18: "5942", 22: "0510", 25: "00", 32: "460001", 37: "626110004512", 41: "POS00417", 42: "COMER0000012345", 43: loc("LIBRERIA EL ATENEO", "BUENOS AIRES"), 49: "032", 54: "0034032C000000015000", 55: emv({ arqc: "A1B2C3D4E5F60718", iad: "06010A03A0B000", un: "4A1B2C3D", atc: "0012", date: "260918", amt: "000000150000" }), 60: "4500" } },
    { id: "L3-02", level: 3, title: "Autorización contactless (0100)", mti: "0100",
      spec: { 2: "4012888888881881", 3: "000000", 4: "000000098000", 7: "0918161233", 11: "004571", 12: "131233", 13: "0918", 14: "2909", 18: "5814", 22: "0710", 25: "00", 32: "460014", 37: "626113004571", 41: "POS00902", 42: "COMER0000077001", 43: loc("CAFE MARTINEZ", "LA PLATA"), 49: "032", 55: emv({ arqc: "0F1E2D3C4B5A6978", iad: "0110A00003220000", un: "9B8C7D6E", atc: "01A4", date: "260918", amt: "000000098000" }), 60: "4800" } },
    { id: "L3-03", level: 3, title: "Aviso de reversa con datos EMV (0420)", mti: "0420",
      spec: { 2: "4917610000000000", 3: "000000", 4: "000000320000", 7: "0918193355", 11: "004640", 12: "163355", 13: "0918", 14: "2610", 18: "5651", 22: "0510", 25: "00", 32: "460001", 37: "626116004640", 41: "POS00553", 42: "COMER0000031415", 43: loc("TIENDA MODA URBANA", "SALTA"), 49: "032", 54: "0034032C000000032000", 55: emv({ arqc: "C0FFEE1234567890", iad: "06010A03A4B000", un: "1F2E3D4C", atc: "0027", date: "260918", amt: "000000320000" }), 60: "4500", 90: orig("0200", "004637", "0918193210", "460001"), 100: "482900" } },
  ];
  BANK.forEach((b) => (b.raw = b.raw || buildFrame(b.mti, b.spec)));

  const api = { FIELDS, prefixLen, kindLabel, hexToBits, decode, buildFrame, BANK };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.OSCGuidedParser = api;
})(typeof window !== "undefined" ? window : globalThis);
