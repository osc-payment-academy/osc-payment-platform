/* OSC Payment Academy v4.0.0-rc.1.39 · Pestañas del panel "Data Elements" para ATM, Wallet y E-Commerce
   (el POS sigue con js/pos-validations.js). Mismo criterio que el POS:
   DATA ELEMENTS (tabla) · VISTA TLV (DE 55) o AUTENTICACIÓN 3DS (E-Commerce) · EXPLICACIÓN · VALIDACIONES.
   Casos de uso C08 (Wallet), C09 (E-Commerce), C17–C19 (ATM) de claude/bateria_escenarios_v1.json (borrador).

   Contexto que recibe cada vista (lo arma cada simulador):
   { channel: "atm"|"wallet"|"ecommerce", network: "visa"|"mastercard"|"amex"|"link",
     message: { id, mti, side: "request"|"response", fields: [[de, nombre, valor, origen], ...] },
     req, res, reversal (mismo formato, opcionales), threeDs, threeDsAuth (E-Commerce), operation } */
(() => {
  // ---------- Casos de uso (subset de bateria_escenarios_v1.json) ----------
  const AMEX_NOTE = "Bits y Action Codes a completar con Network Specifications Authorization (oct 2023)";
  const ATM_AMEX = { mti: null, de3: null, obligatorios: null, condicionales: {}, prohibidos: [], respuesta: "aprobada", estado: "borrador", nota: "El ATM Amex usa 1200 / 1210 (Cash Disbursement) · " + AMEX_NOTE };
  const CASES = {
    C08: {
      nombre: "Compra wallet NFC", canal: "wallet", objetivo: "Pago con token desde billetera.",
      visa: { mti: "0100", de3: "000000", de22: "07", obligatorios: null, condicionales: {}, prohibidos: [], respuesta: "00", estado: "verificado", nota: "DE 22 0710, DE 55 Dataset 01, ARPC en la respuesta", chip: true },
      mastercard: { mti: "0100", de3: "000000", de22: "07", obligatorios: null, condicionales: {}, prohibidos: [25], respuesta: "00", estado: "verificado", nota: "DE 22 071, DE 61 con capacidad contactless", chip: true },
      amex: { mti: "1100", de3: null, bit22: { 6: "Y" }, obligatorios: null, condicionales: {}, prohibidos: [], respuesta: "aprobada", estado: "borrador", nota: AMEX_NOTE, chip: true },
    },
    C09: {
      nombre: "Compra e-commerce 3DS", canal: "ecommerce", objetivo: "Compra no presente autenticada con 3-D Secure.",
      visa: { mti: "0100", de3: "000000", de22: "01", obligatorios: null, condicionales: { 25: "= 59", "60.8": "ECI", "126.9": "CAVV" }, prohibidos: [], respuesta: "00", estado: "verificado" },
      mastercard: { mti: "0100", de3: "000000", de22: "81", obligatorios: null, condicionales: { 48: "TCC T + SE 42 + SE 43 AAV", 61: "comercio electrónico" }, prohibidos: [25], respuesta: "00", estado: "verificado" },
      amex: { mti: "1100", de3: null, bit22: { 4: "S", 5: "S" }, obligatorios: null, condicionales: { 61: "SafeKey AX / ASK / ECI / AEVV" }, prohibidos: [], respuesta: "aprobada", estado: "borrador", nota: AMEX_NOTE },
    },
    C17: {
      nombre: "Extracción ATM chip", canal: "atm", objetivo: "Extracción de efectivo con PIN.",
      visa: { mti: null, de3: "010000", de22: "05", obligatorios: null, condicionales: { 52: "obligatorio", 18: "= 6011" }, prohibidos: [], respuesta: "00", estado: "borrador" },
      mastercard: { mti: null, de3: "010000", de22: "05", obligatorios: null, condicionales: { 52: "obligatorio", 18: "= 6011" }, prohibidos: [25], respuesta: "00", estado: "borrador", nota: "ATM Mastercard no envía DE 53" },
      amex: ATM_AMEX,
    },
    C18: {
      nombre: "Dispensación parcial", canal: "atm", objetivo: "El cajero entrega una parte: reverso parcial por la diferencia.",
      visa: { mti: null, de3: "010000", de22: "05", obligatorios: null, condicionales: {}, prohibidos: [], respuesta: "00", estado: "borrador", reverso: { tipo: "parcial", campos: [90, 95] } },
      mastercard: { mti: null, de3: "010000", de22: "05", obligatorios: null, condicionales: {}, prohibidos: [25], respuesta: "00", estado: "borrador", reverso: { tipo: "parcial", campos: [90, 95] } },
      amex: { ...ATM_AMEX, reverso: { tipo: "parcial", campos: [] } },
    },
    C19: {
      nombre: "Consulta de saldo ATM", canal: "atm", objetivo: "Consulta sin monto; los saldos vuelven en la respuesta.",
      visa: { mti: null, de3: null, de3Tipo: ["30", "31"], de22: "05", obligatorios: null, condicionales: {}, respuesta: "00", prohibidos: [], estado: "borrador", saldos: 54, nota: "DE 3: confirmar 30 o 31 con el manual (el simulador envía 31)" },
      mastercard: { mti: null, de3: null, de3Tipo: ["30", "31"], de22: "05", obligatorios: null, condicionales: {}, respuesta: "00", prohibidos: [25], estado: "borrador", saldos: 54, nota: "DE 3: confirmar 30 o 31 con el manual (el simulador envía 31)" },
      amex: ATM_AMEX,
    },
  };

  // ---------- Utilidades ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const plain = (v) => String(v ?? "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
  const key = (de) => String(de).replace(/^DE\s*/i, "").replace(/^0+(?=\d)/, "");
  const fmap = (m) => new Map((m?.fields || []).map((r) => [key(r[0]), r]));
  const val = (m, de) => plain(fmap(m).get(String(de))?.[2] || "");
  const has = (m, de) => fmap(m).has(String(de));
  const BRAND = { visa: "Visa", mastercard: "Mastercard", amex: "American Express", link: "Red LINK" };
  const isApproved = (code, net) => (net === "amex" ? /^0{2,3}$/.test(code) : code === "00");

  // Mastercard DE 48: TCC (1) + subelementos SE(2) LL(2) valor.
  function mcDe48(v) {
    const out = { tcc: v.slice(0, 1), se: {} };
    let i = 1;
    while (i + 4 <= v.length) { const se = v.substr(i, 2), len = Number(v.substr(i + 2, 2)); if (!Number.isFinite(len)) break; out.se[se] = v.substr(i + 4, len); i += 4 + len; }
    return out;
  }
  // Amex Bit 61 SafeKey (como lo arma el simulador): AX + ASK + ECI(2) + "AEVV[valor]".
  function amexBit61(v) {
    const m = /^AXASK(\d{2})(?:AEVV\[([^\]]*)\])?/.exec(v || "");
    return m ? { eci: m[1], aevv: m[2] || null } : null;
  }
  // ECI / indicador según la red y el campo donde viaja.
  function eciOf(net, req) {
    if (net === "visa") { const v = val(req, 60); return v ? v.slice(-2) : ""; }
    if (net === "mastercard") { const d = mcDe48(val(req, 48)); const s = d.se["42"] || ""; return s.length >= 7 ? s.slice(4, 7) : ""; }
    if (net === "amex") return amexBit61(val(req, 61))?.eci || "";
    return "";
  }
  const ECI_EXPECTED = { visa: { full: "05", attempt: "06", none: "07" }, mastercard: { full: "212", attempt: "211", none: "210" }, amex: { full: "05", attempt: "06", none: "07" } };
  const ECI_TXT = { "05": "autenticado por el emisor", "06": "intento: el ACS no estaba disponible y la red respondió por el emisor", "07": "sin autenticar (el comercio no usó 3-D Secure)", "212": "autenticado por el emisor (AAV completo)", "211": "intento: AAV de intento", "210": "sin autenticar (sin AAV)" };

  // ---------- VISTA TLV (DE 55) ----------
  const TAGS = { "4F": "AID", "50": "Application Label", "57": "Track 2 Equivalent", "5A": "PAN", "5F24": "Fecha de vencimiento", "5F2A": "Moneda de la transacción", "5F34": "PAN Sequence Number", "82": "Application Interchange Profile (AIP)", "84": "Dedicated File Name", "91": "Issuer Authentication Data (ARPC + ARC)", "95": "Terminal Verification Results (TVR)", "9A": "Fecha de la transacción", "9C": "Tipo de transacción", "9F02": "Importe autorizado", "9F03": "Otro importe", "9F09": "Versión de aplicación", "9F10": "Issuer Application Data (CVN, CVR)", "9F1A": "País de la terminal", "9F1E": "Serie del IFD", "9F26": "Criptograma (ARQC)", "9F27": "Cryptogram Information Data", "9F33": "Terminal Capabilities", "9F34": "CVM Results", "9F35": "Tipo de terminal", "9F36": "ATC (contador de la aplicación)", "9F37": "Unpredictable Number", "9F41": "Secuencia de la transacción", "9F6E": "Form Factor / datos del dispositivo", "71": "Issuer Script 1", "72": "Issuer Script 2", "8A": "Authorization Response Code" };
  function parseTlv(hex) {
    const out = []; let i = 0; hex = hex.replace(/[^0-9A-F]/gi, "").toUpperCase();
    while (i + 4 <= hex.length && out.length < 60) {
      let tag = hex.substr(i, 2); i += 2;
      if ((parseInt(tag, 16) & 0x1f) === 0x1f) { do { tag += hex.substr(i, 2); i += 2; } while (i <= hex.length && (parseInt(tag.slice(-2), 16) & 0x80)); }
      let len = parseInt(hex.substr(i, 2), 16); i += 2;
      if (len & 0x80) { const n = len & 0x7f; len = parseInt(hex.substr(i, n * 2), 16); i += n * 2; }
      if (!Number.isFinite(len) || i + len * 2 > hex.length) { out.push({ tag, len: NaN, value: hex.slice(i), error: true }); break; }
      out.push({ tag, len, value: hex.substr(i, len * 2) }); i += len * 2;
    }
    return out;
  }
  function tlvHtml(c) {
    const m = c?.message; if (!m) return '<p class="pv-muted">Seleccioná un mensaje.</p>';
    if (c.network === "link") return '<p class="pv-muted">En la Red LINK (Host to Host BASE24) el campo 55 no lleva datos del chip en TLV: es un campo de datos de la operación (ver la pestaña Explicación y el Parser LINK).</p>';
    const pick = (m.side === "request" ? [m, c.req, c.res] : [m, c.res, c.req]).filter(Boolean).find((x) => has(x, 55));
    if (!pick) return `<p class="pv-muted">El mensaje no tiene DE 55 (datos del chip). ${c.channel === "atm" ? "En el ATM aparece con lectura chip o contactless; con banda magnética no viaja." : "La vista TLV aplica a lecturas chip, contactless y wallet."}</p>`;
    let hex = val(pick, 55).replace(/[^0-9A-F]/gi, "").toUpperCase(), head = "";
    if (/^01/.test(hex) && parseInt(hex.substr(2, 4), 16) * 2 === hex.length - 6) { head = `Visa Dataset ID <b>01</b> · longitud <b>0x${hex.substr(2, 4)}</b> (${parseInt(hex.substr(2, 4), 16)} bytes) · `; hex = hex.slice(6); }
    const tl = parseTlv(hex);
    if (!tl.length) return '<p class="pv-muted">No se pudo decodificar el DE 55.</p>';
    const who = c.channel === "wallet" ? "Los datos los genera el teléfono con la clave del token (no la tarjeta física)." : "";
    return `<p class="pv-obj">DE 55 de <b>${esc(pick.mti)}</b> · ${head}${tl.length} tags EMV (Tag · Longitud · Valor). Las longitudes van en hexadecimal. ${who}</p><table class="pv-table"><thead><tr><th>Tag</th><th>Nombre</th><th>Long.</th><th>Valor</th></tr></thead><tbody>${tl.map((t) => `<tr${t.error ? ' class="pv-bad"' : ""}><td><b>${t.tag}</b></td><td>${esc(TAGS[t.tag] || "—")}</td><td>${Number.isFinite(t.len) ? `${t.len} (0x${t.len.toString(16).toUpperCase().padStart(2, "0")})` : "?"}</td><td><code>${esc(t.value)}</code></td></tr>`).join("")}</tbody></table>`;
  }

  // ---------- AUTENTICACIÓN 3DS (E-Commerce) ----------
  function threeDsHtml(c) {
    const req = c?.req;
    if (!req) return '<p class="pv-muted">Hacé una compra para ver los datos de autenticación.</p>';
    const net = c.network, t = c.threeDs || {}, a = c.threeDsAuth || {};
    const mode = t.mode || (eciOf(net, req) && Object.entries(ECI_EXPECTED[net] || {}).find(([, v]) => v === eciOf(net, req))?.[0]) || "full";
    const eci = eciOf(net, req);
    const rows = [];
    const add = (dato, campo, valor, txt, st = "") => rows.push(`<tr${st ? ` class="pv-${st}"` : ""}><td><b>${esc(dato)}</b></td><td>${esc(campo)}</td><td>${valor ? `<code>${esc(valor)}</code>` : '<span class="pv-muted">no viaja</span>'}</td><td>${esc(txt)}</td></tr>`);
    if (net === "visa") {
      add("Modo de ingreso", "DE 22", val(req, 22), "01 = datos digitados (compra no presente)");
      add("Condición del POS", "DE 25", val(req, 25), "59 = comercio electrónico por red pública");
      add("ECI", "DE 60 · 60.8 (posiciones 9-10)", eci, ECI_TXT[eci] || "a revisar en el manual");
      add("CAVV", "DE 126 · 126.9", t.value || "", t.value ? "Valor de autenticación que generó el ACS del emisor (20 bytes)" : "Sin autenticación no hay CAVV", mode === "none" ? "" : t.value ? "" : "miss");
      if (parseInt(val(req, 126).slice(2, 4) || "0", 16) & 0x40) add("CVV2", "DE 126 · 126.10", "(enmascarado)", "Código de seguridad que ingresó el comprador; el resultado vuelve en 44.10");
    } else if (net === "mastercard") {
      const d = mcDe48(val(req, 48));
      add("Modo de ingreso", "DE 22", val(req, 22), "81 = comercio electrónico");
      add("Categoría (TCC)", "DE 48 · posición 1", d.tcc, "T = orden electrónica");
      add("Indicador de seguridad (SLI)", "DE 48 · SE 42", d.se["42"] || "", `Subcampo 01 = ${eci || "—"}: ${ECI_TXT[eci] || "a revisar"}`);
      add("AAV (UCAF)", "DE 48 · SE 43", d.se["43"] || "", d.se["43"] ? "Valor de autenticación que generó el ACS del emisor" : "Sin autenticación no viaja el SE 43", mode !== "none" && !d.se["43"] ? "miss" : "");
      if (d.se["92"]) add("CVC 2", "DE 48 · SE 92", "(enmascarado)", "Código de seguridad que ingresó el comprador");
    } else if (net === "amex") {
      const b = amexBit61(val(req, 61)) || {};
      const b22 = val(req, 22);
      add("Point of Service Data Code", "Bit 22 · posiciones 4 y 5", b22 ? `${b22[3] || ""}${b22[4] || ""}` : "", "S + S = entrega electrónica, titular no presente (Internet)");
      add("ECI", "Bit 61 · SafeKey", b.eci || "", ECI_TXT[b.eci] || "a revisar en el manual");
      add("AEVV", "Bit 61 · SafeKey", b.aevv || "", b.aevv ? "Valor de autenticación de SafeKey (20 bytes, en hex)" : "Sin autenticación no hay AEVV", mode !== "none" && !b.aevv ? "miss" : "");
      if (has(req, 53)) add("CSC", "Bit 53", "(enmascarado)", "Código de seguridad que ingresó el comprador");
    } else return '<p class="pv-muted">Sin datos de autenticación para esta red.</p>';
    const modeTxt = { full: "Autenticado", attempt: "Intento (attempts)", none: "Sin 3-D Secure" }[mode] || mode;
    const status = a.finalStatus ? ` · resultado ARes/RReq <b>${esc(a.finalStatus)}</b>` : "";
    const chal = a.challenge ? ` · challenge: ${esc(a.challenge)}` : "";
    const ver = a.version && mode !== "none" ? ` · EMV 3DS ${esc(a.version)}` : "";
    const where = { visa: "DE 60.8 + DE 126.9", mastercard: "DE 48 SE 42 + SE 43", amex: "Bit 61 SafeKey" }[net];
    return `<div class="pv-obj"><p style="margin:4px 0">La autenticación 3-D Secure pasa <b>antes</b> de la autorización, entre el comercio, el Directory Server y el ACS del emisor (mensajes AReq/ARes, que <b>no son ISO 8583</b>). Su resultado viaja dentro del mensaje ISO 8583 de <b>${esc(BRAND[net])}</b> en <b>${esc(where)}</b>.</p><p style="margin:4px 0">Escenario: <b>${esc(modeTxt)}</b>${ver}${status}${chal}.</p></div>
      <table class="pv-table"><thead><tr><th>Dato</th><th>Campo ISO 8583</th><th>Valor en la ${esc(req.mti)}</th><th>Qué significa</th></tr></thead><tbody>${rows.join("")}</tbody></table>
      <p class="pv-muted">El emisor valida el ${esc(t.valueName || "valor de autenticación")} con su clave y contesta en el ${net === "amex" ? "Bit 39 (Action Code)" : "DE 39"}. Si el comprador no se autenticó, la responsabilidad por fraude queda del lado del comercio.</p>`;
  }

  // ---------- EXPLICACIÓN ----------
  const MTI_TXT = { "0100": "Solicitud de autorización (dual message)", "0110": "Respuesta a la autorización", "0200": "Solicitud financiera (single message)", "0210": "Respuesta financiera", "0400": "Reversa", "0410": "Respuesta a la reversa", "0420": "Aviso de reversa", "0430": "Respuesta al aviso de reversa", "0220": "Aviso de transacción forzada (store-and-forward)", "0230": "Respuesta al aviso 0220", "0800": "Mensaje de gestión de red", "0810": "Respuesta de gestión de red", "1100": "Solicitud de autorización (American Express, ISO 1993)", "1110": "Respuesta de autorización (American Express)", "1200": "Solicitud financiera · Cash Disbursement (American Express)", "1210": "Respuesta financiera (American Express)", "1420": "Reversa (American Express)", "1430": "Respuesta a la reversa (American Express)" };
  const DE3_TXT = { "00": "compra", "01": "retiro de efectivo", "09": "compra con cashback", "20": "devolución", "30": "consulta de saldo", "31": "consulta de saldo", "40": "transferencia" };
  const DE22_TXT = { "05": "chip EMV", "07": "contactless / wallet NFC", "90": "banda magnética (pista completa)", "02": "banda magnética", "01": "datos digitados (compra no presente)", "81": "comercio electrónico" };
  function explainHtml(c) {
    const m = c?.message; if (!m) return '<p class="pv-muted">Seleccioná un mensaje.</p>';
    const net = c.network, out = m.side === "request";
    const from = { atm: out ? "sale del cajero hacia el adquirente" : "vuelve del emisor hacia el cajero", wallet: out ? "sale del POS (pagaste con el teléfono) hacia el adquirente" : "vuelve del emisor hacia el POS", ecommerce: out ? "sale del comercio online hacia el adquirente" : "vuelve del emisor hacia el comercio" }[c.channel] || "";
    const lines = [`<b>${esc(m.mti)}</b> — ${esc(MTI_TXT[m.mti] || "Mensaje ISO 8583")} · ${from}.`];
    const de3 = val(m, 3), de4 = val(m, 4), de22 = val(m, 22), de39 = val(m, 39);
    if (net === "link") lines.push("Red LINK (Host to Host BASE24): el formato y los campos 54, 55, 90 y 125–127 siguen el manual de LINK. Para el desglose posición por posición usá el Parser LINK.");
    if (de3) lines.push(`<b>DE 3 = ${esc(de3)}</b>: operación ${esc(de3.slice(0, 2))} (${DE3_TXT[de3.slice(0, 2)] || "según la marca"}), cuenta desde ${esc(de3.slice(2, 4))} y hacia ${esc(de3.slice(4, 6))}.`);
    if (de4) lines.push(`<b>DE 4 = ${esc(de4)}</b>: importe con 2 decimales implícitos → ${(Number(de4) / 100).toLocaleString("es-AR", { minimumFractionDigits: 2 })}.`);
    if (de22 && net !== "amex") lines.push(`<b>DE 22 = ${esc(de22)}</b>: ${esc(DE22_TXT[de22.slice(0, 2)] || "modo de ingreso a revisar en el manual")}.`);
    if (de22 && net === "amex") lines.push(`<b>Bit 22 = ${esc(de22)}</b>: Point of Service Data Code de 12 posiciones; cada posición describe una característica de la terminal y de la lectura (Codes Reference Guide).`);
    if (c.channel === "wallet" && out) lines.push("<b>DE 2</b>: viaja el <b>token</b> (DPAN) de la billetera, no el número de la tarjeta física. La red (TSP) lo traduce antes de llegar al emisor.");
    if (has(m, 18) && val(m, 18) === "6011") lines.push("<b>DE 18 = 6011</b>: MCC de cajero automático (entrega de efectivo).");
    if (has(m, 52)) lines.push("<b>DE 52</b>: viaja el PIN cifrado (PIN Block). El emisor lo verifica en su HSM.");
    if (has(m, 55) && net !== "link") lines.push("<b>DE 55</b>: datos del chip en formato TLV (mirá la pestaña Vista TLV).");
    if (c.channel === "ecommerce" && out) lines.push(`El resultado de 3-D Secure viaja en <b>${esc({ visa: "DE 60.8 (ECI) y DE 126.9 (CAVV)", mastercard: "DE 48 SE 42 (SLI) y SE 43 (AAV)", amex: "Bit 61 SafeKey (ECI y AEVV)" }[net] || "—")}</b> (mirá la pestaña Autenticación 3DS).`);
    if (has(m, 54) && !out) lines.push("<b>DE 54</b>: importes adicionales; en una consulta de saldo traen los saldos de la cuenta.");
    if (has(m, 90)) lines.push("<b>DE 90</b>: datos de la operación original que se reversa (MTI, STAN, fecha y hora).");
    if (has(m, 95)) lines.push("<b>DE 95</b>: importes de reemplazo; en una reversa parcial indica lo que realmente se entregó.");
    if (has(m, 38)) lines.push(`<b>DE 38 = ${esc(val(m, 38))}</b>: código de autorización del emisor.`);
    if (de39) lines.push(`<b>${net === "amex" ? "Bit" : "DE"} 39 = ${esc(de39)}</b>: ${net === "amex" ? "Action Code" : "código de respuesta"} del emisor${isApproved(de39, net) ? " (aprobada)" : ""}.`);
    const rows = (m.fields || []).map((r) => `<tr><td><b>${esc(key(r[0]))}</b></td><td>${esc(plain(r[1]))}</td><td><code>${esc(plain(r[2]).slice(0, 60))}${plain(r[2]).length > 60 ? "…" : ""}</code></td><td>${esc(plain(r[3] || ""))}</td></tr>`).join("");
    return `<div class="pv-obj">${lines.map((l) => `<p style="margin:4px 0">${l}</p>`).join("")}</div><table class="pv-table"><thead><tr><th>DE</th><th>Qué es</th><th>Valor</th><th>Origen</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  // ---------- VALIDACIONES ----------
  function detect(c) {
    if (!c?.req) return null;
    if (c.channel === "wallet") return "C08";
    if (c.channel === "ecommerce") return "C09";
    if (c.channel === "atm") {
      const t = val(c.req, 3).slice(0, 2);
      if (t === "30" || t === "31") return "C19";
      if (t === "01" || c.network === "amex") return c.reversal && (has(c.reversal, 95) || /parcial/i.test(c.reversal.operation || "")) ? "C18" : "C17";
    }
    return null;
  }
  function validationRows(c, id) {
    const exp = CASES[id]?.[c.network];
    if (!exp) return { exp: null, rows: [], score: null };
    const req = c.req, present = fmap(req), rows = [];
    const add = (st, what, detail) => rows.push({ st, what, detail });
    if (exp.mti) add(req.mti === exp.mti ? "ok" : "bad", `MTI ${exp.mti}`, req.mti === exp.mti ? `El mensaje es ${req.mti}` : `Se envió ${req.mti}`);
    else add("todo", "MTI", `Se envió ${req.mti} · a validar con el manual`);
    if (exp.de3) add(val(req, 3) === exp.de3 ? "ok" : "bad", `DE 3 = ${exp.de3}`, `Valor: ${val(req, 3) || "—"}`);
    else if (exp.de3Tipo) add("todo", `DE 3 empieza con ${exp.de3Tipo.join(" o ")}`, `Valor: ${val(req, 3) || "—"} · a validar con el manual`);
    const de22 = val(req, 22);
    if (exp.de22) add(de22.startsWith(exp.de22) ? "ok" : "bad", `DE 22 empieza con ${exp.de22}`, `Valor: ${de22 || "—"}${de22.startsWith(exp.de22) ? "" : ` · el caso es ${DE22_TXT[exp.de22] || exp.de22}`}`);
    if (exp.bit22) Object.entries(exp.bit22).forEach(([pos, ch]) => add(de22[Number(pos) - 1] === ch ? "ok" : "bad", `Bit 22 · posición ${pos} = ${ch}`, `Valor: ${de22 || "—"}`));
    if (Array.isArray(exp.obligatorios)) exp.obligatorios.forEach((n) => add(present.has(String(n)) ? "ok" : "miss", `DE ${n} · obligatorio`, present.has(String(n)) ? plain(present.get(String(n))[1]) : "Falta en el mensaje"));
    else add("todo", "Campos obligatorios", "Lista a completar con el manual de la marca");
    // Condicionales con regla evaluable.
    const tds = c.threeDs?.mode || "full";
    Object.entries(exp.condicionales || {}).forEach(([k, rule]) => {
      const base = String(k).split(".")[0], v = val(req, base), here = present.has(base);
      if (k === "60.8") { const e = eciOf(c.network, req), want = ECI_EXPECTED.visa[tds]; return add(e === want ? "ok" : "bad", "DE 60.8 · ECI", `Valor ${e || "—"} · con este escenario (${tds === "full" ? "autenticado" : tds === "attempt" ? "intento" : "sin 3DS"}) corresponde ${want}`); }
      if (k === "126.9") { const cavv = !!c.threeDs?.value; return add(tds === "none" ? (cavv ? "bad" : "ok") : cavv && here ? "ok" : "miss", "DE 126.9 · CAVV", tds === "none" ? (cavv ? "Viaja CAVV sin autenticación" : "Sin 3DS: el CAVV no viaja") : cavv ? "Presente" : "Falta el CAVV"); }
      if (c.network === "mastercard" && k === "48") {
        const d = mcDe48(v), want = ECI_EXPECTED.mastercard[tds], sli = eciOf("mastercard", req);
        add(d.tcc === "T" ? "ok" : "bad", "DE 48 · TCC = T", `Valor: ${d.tcc || "—"}`);
        add(sli === want ? "ok" : "bad", "DE 48 · SE 42 (SLI)", `Valor ${sli || "—"} · con este escenario corresponde ${want}`);
        return add(tds === "none" ? (d.se["43"] ? "bad" : "ok") : d.se["43"] ? "ok" : "miss", "DE 48 · SE 43 (AAV)", tds === "none" ? (d.se["43"] ? "Viaja AAV sin autenticación" : "Sin 3DS: el SE 43 no viaja") : d.se["43"] ? "Presente" : "Falta el AAV");
      }
      if (c.network === "amex" && k === "61") {
        const b = amexBit61(v), want = ECI_EXPECTED.amex[tds];
        if (!b) return add("miss", "Bit 61 · SafeKey", "No se encontró SafeKey en el Bit 61");
        add(b.eci === want ? "ok" : "bad", "Bit 61 · ECI", `Valor ${b.eci} · con este escenario corresponde ${want}`);
        return add(tds === "none" ? (b.aevv ? "bad" : "ok") : b.aevv ? "ok" : "miss", "Bit 61 · AEVV", tds === "none" ? (b.aevv ? "Viaja AEVV sin autenticación" : "Sin 3DS: el AEVV no viaja") : b.aevv ? "Presente" : "Falta el AEVV");
      }
      const m = /^=\s*(\S+)/.exec(rule);
      if (m) return add(!here ? "miss" : v === m[1] ? "ok" : "bad", `DE ${k} = ${m[1]}`, here ? `Valor: ${v}` : "Falta en el mensaje");
      if (/obligatorio/i.test(rule)) return add(here ? "ok" : "miss", `DE ${k} · obligatorio en este caso`, here ? plain(present.get(base)[1]) : "Falta en el mensaje");
      add(here ? "ok" : "cond", `DE ${k} · ${rule}`, here ? "Presente" : "No presente");
    });
    (exp.prohibidos || []).forEach((n) => add(present.has(String(n)) ? "bad" : "ok", `DE ${n} · no lo usa la marca`, present.has(String(n)) ? "Está presente y no debería" : "No está"));
    if (exp.chip) add(present.has("55") ? "ok" : "miss", "DE 55 · datos del chip (generados por el teléfono)", present.has("55") ? "Presente" : "Falta en el mensaje");
    // Respuesta.
    const code = c.res ? val(c.res, 39) : "";
    if (/^\d+$/.test(String(exp.respuesta))) add(!c.res ? "todo" : code === exp.respuesta ? "ok" : "bad", `Respuesta ${exp.respuesta}`, c.res ? `DE 39 = ${code || "—"}` : "Todavía no hay respuesta");
    else if (exp.respuesta === "aprobada") add(!c.res ? "todo" : isApproved(code, c.network) ? "ok" : "bad", "Respuesta aprobada", c.res ? `${c.network === "amex" ? "Bit" : "DE"} 39 = ${code || "—"}` : "Todavía no hay respuesta");
    if (exp.chip && c.res && isApproved(code, c.network)) add(has(c.res, 55) ? "ok" : "miss", "DE 55 en la respuesta · ARPC (tag 91)", has(c.res, 55) ? "Presente" : "Falta");
    if (exp.saldos && c.res) add(has(c.res, exp.saldos) ? "ok" : "miss", `DE ${exp.saldos} en la respuesta · saldos`, has(c.res, exp.saldos) ? "Presente" : "Falta");
    if (exp.reverso) {
      const rv = c.reversal;
      if (!rv) add("miss", `Reverso ${exp.reverso.tipo}`, "No hay reversa asociada a esta operación");
      else {
        add("ok", `Reverso ${exp.reverso.tipo} · ${rv.mti}`, rv.operation || "Presente");
        exp.reverso.campos.forEach((n) => add(has(rv, n) ? "ok" : "miss", `DE ${n} en la reversa`, has(rv, n) ? (n === 95 ? `Importe entregado: ${val(rv, 95).slice(0, 12)}` : "Presente") : "Falta"));
      }
    }
    const graded = rows.filter((r) => ["ok", "bad", "miss"].includes(r.st));
    const score = graded.length ? Math.round((graded.filter((r) => r.st === "ok").length / graded.length) * 100) : null;
    return { exp, rows, score };
  }
  const ICON = { ok: "✅", miss: "❌", bad: "❌", cond: "⚠️", todo: "❔", info: "ℹ️" };
  const manual = new Map(); // caso elegido a mano por mensaje
  function caseFor(c) { const k = c?.req?.id || c?.message?.id; return (k && manual.get(k)) || detect(c); }
  function validationsHtml(c) {
    if (!c?.req) return '<p class="pv-muted">Hacé una operación (o seleccioná un mensaje del historial) para validar el caso de uso.</p>';
    if (c.network === "link") return '<p class="pv-muted">La batería de escenarios v1 no tiene casos de la Red LINK. Las validaciones de LINK se agregan cuando se definan sus casos de uso.</p>';
    const auto = detect(c), id = caseFor(c);
    const list = Object.entries(CASES).filter(([, v]) => v.canal === c.channel);
    const opts = list.map(([k, v]) => `<option value="${k}" ${k === id ? "selected" : ""}>${k} · ${esc(v.nombre)}${k === auto ? " (detectado)" : ""}</option>`).join("");
    const head = (badge) => `<div class="pv-head"><label>Caso de uso <select data-dt-case>${id ? "" : '<option value="" selected>— sin caso detectado —</option>'}${opts}</select></label>${badge}</div>`;
    if (!id) return head("") + `<p class="pv-obj">La operación <b>${esc(c.operation || val(c.req, 3))}</b> no tiene un caso de uso en la batería v1. Podés elegir uno de la lista para comparar.</p>`;
    const { exp, rows, score } = validationRows(c, id);
    const badge = `<span class="pv-badge ${exp?.estado === "verificado" ? "ok" : "draft"}">${exp ? (exp.estado === "verificado" ? "Verificado contra el manual" : "Borrador · a cruzar con la marca") : "Sin datos para esta red"}</span>`;
    let html = head(badge) + `<p class="pv-obj"><b>${esc(id)} · ${esc(CASES[id].nombre)} · ${esc(BRAND[c.network] || c.network)}</b> — ${esc(CASES[id].objetivo)}${exp?.nota ? `<br><span class="pv-muted">${esc(exp.nota)}</span>` : ""}</p>`;
    if (!exp) return html + '<p class="pv-muted">La batería no tiene este caso para la red de la tarjeta.</p>';
    if (score != null) html += `<div class="pv-score"><b>${score}%</b> de los puntos evaluables cumplen · ✅ ok · ❌ falta o no corresponde · ⚠️ condicional · ❔ a validar</div>`;
    html += `<table class="pv-table"><thead><tr><th></th><th>Regla</th><th>Resultado</th></tr></thead><tbody>${rows.map((r) => `<tr class="pv-${r.st}"><td>${ICON[r.st]}</td><td>${esc(r.what)}</td><td>${esc(r.detail)}</td></tr>`).join("")}</tbody></table>`;
    html += '<p class="pv-muted">Fuente: batería de escenarios v1 (borrador) construida desde los manuales cargados y las pruebas del simulador. Se completará con los casos de uso oficiales de la marca.</p>';
    return html;
  }
  // Colorea el bitmap: rojo = obligatorio faltante, amarillo = condicional, rojo con borde = no lo usa la marca.
  function colorBitmap(c, on, cells) {
    cells.forEach((el) => el.classList.remove("val-miss", "val-cond", "val-bad"));
    if (!on || !c?.req || c.network === "link") return;
    const id = caseFor(c), exp = CASES[id]?.[c.network]; if (!exp) return;
    const byBit = new Map(cells.map((el) => [String(el.dataset.bit || el.textContent).trim(), el])), present = fmap(c.req);
    (exp.obligatorios || []).forEach((n) => { if (!present.has(String(n))) byBit.get(String(n))?.classList.add("val-miss"); });
    Object.keys(exp.condicionales || {}).forEach((k) => byBit.get(String(k).split(".")[0])?.classList.add("val-cond"));
    (exp.prohibidos || []).forEach((n) => { if (present.has(String(n))) byBit.get(String(n))?.classList.add("val-bad"); });
  }

  // ---------- Estilos y montaje ----------
  function styles() {
    if (document.getElementById("osc-de-tabs-css")) return;
    const st = document.createElement("style"); st.id = "osc-de-tabs-css";
    st.textContent = `.dt-tabs{display:flex;flex-wrap:wrap;gap:4px 18px;border-bottom:1px solid #1d3a54;margin:6px 0 4px}.debox .dt-tabs{position:sticky;top:-1px;z-index:3;background:#0a1928;padding-top:2px}.dt-tabs button{background:none;border:0;border-bottom:2px solid transparent;color:#c9d6e2;font:inherit;font-size:12.5px;letter-spacing:.02em;padding:7px 0;cursor:pointer}.dt-tabs button.active{color:#39a9ff;border-bottom-color:#39a9ff}.dt-tabs button:hover{color:#fff}
.pv-view{padding:10px 2px;font-size:13px;color:#d7e3ee;text-align:left}.pv-muted{color:#8fa8bd;font-size:12px}.pv-head{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:8px}.pv-head select{margin-left:6px;background:#0b1d2e;color:#e6f2fb;border:1px solid #2b4a66;border-radius:8px;padding:6px 8px}.pv-badge{font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px}.pv-badge.ok{background:#123d29;color:#7ef0b2}.pv-badge.draft{background:#4a3a0e;color:#ffd77a}.pv-obj{margin:6px 0 10px;line-height:1.5}.pv-view .pv-obj,.pv-view p.pv-obj{font-size:13px;color:#d7e3ee}.pv-view .pv-muted,.pv-view p.pv-muted{font-size:12px;color:#8fa8bd}.pv-score{margin:6px 0;padding:8px 10px;border:1px solid #23415c;border-radius:8px;background:#0b1d2e}.pv-table{width:100%;border-collapse:collapse;font-size:12.5px}.pv-table th,.pv-table td{border-bottom:1px solid #1d3a54;padding:6px;text-align:left;vertical-align:top}.pv-table th{color:#9fb6cb;font-weight:700}.pv-table code{font-family:Consolas,Menlo,monospace;word-break:break-all;color:#bfe3ff}.pv-miss td,.pv-bad td{color:#ffb4b4}.pv-cond td{color:#ffe08a}.pv-todo td{color:#b9c7d4}
.val-miss{background:#7a1f1f!important;outline:1px solid #ff6b6b;color:#fff!important}.val-cond{outline:2px solid #ffd34d}.val-bad{background:#7a1f1f!important;outline:2px solid #ff6b6b;color:#fff!important}`;
    document.head.appendChild(st);
  }
  const LABELS = (channel) => ["DATA ELEMENTS", channel === "ecommerce" ? "AUTENTICACIÓN 3DS" : "VISTA TLV", "EXPLICACIÓN", "VALIDACIONES"];
  function tabsHtml(channel, active) { styles(); return `<div class="dt-tabs" role="tablist">${LABELS(channel).map((l, i) => `<button type="button" role="tab" data-dt-tab="${i}" class="${i === active ? "active" : ""}">${l}</button>`).join("")}</div>`; }
  function viewHtml(i, c) {
    if (i === 1) return c?.channel === "ecommerce" ? threeDsHtml(c) : tlvHtml(c);
    if (i === 2) return explainHtml(c);
    if (i === 3) return validationsHtml(c);
    return "";
  }
  // Conecta selector de caso manual dentro de un contenedor ya pintado.
  function wire(root, c, rerender) {
    const sel = root.querySelector("[data-dt-case]");
    if (sel) sel.onchange = () => { const k = c?.req?.id || c?.message?.id; if (k) { if (sel.value) manual.set(k, sel.value); else manual.delete(k); } rerender(); };
  }

  window.OSCDeTabs = { CASES, LABELS, tabsHtml, viewHtml, wire, colorBitmap, detect, parseTlv, styles };
})();
