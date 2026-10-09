/* OSC Payment Academy v4.0.0-rc.1.22 · Campos por red según manual
   -----------------------------------------------------------------
   Fuentes (carpeta public/manuals):
   - Visa: Full Service POS Online Messages Technical Specifications (14 abr 2025)
       Tabla 289 (card-present 0100/0110), Tabla 290 (card-not-present), Field 53, Field 104 Usage 2 Dataset 5D,
       Field 126.13, Field 25, Field 60.8, Field 63.1, Field 126.9.
   - Mastercard: Customer Interface Specification (25 feb 2025)
       Tabla 14 (0100), layout 0110, DE 22, DE 43, DE 48 (TCC, SE 42, SE 43, SE 95), DE 53, DE 61,
       DE 112 "Cuotas: Payment Transactions" (Argentina/Uruguay).
   - American Express: Network Specifications Authorization (oct 2023)
       Bit 48 Deferred Payment Plan (1100/1110), Bit 61 SafeKey y Digital Wallet; Codes Reference Guide (Bit 22).
   Cada fila respeta el formato de los simuladores: [DE, nombre, valor, longitud, formato, origen, bytesReales?]
*/
(function () {
  const ACQ = {
    visaAcquirerBin: "412345",
    mcAcquirerId: "012345",
    mcc: "5812",
    country: "032",
    merchantName: "OSC PAYMENT ACADEMY",
    city: "BUENOS AIRES",
    postal: "C1043AAZ",
    terminal: "TERMID01",
    merchantId: "MERCHANT01     ",
  };
  const MANUALS = {
    visa: { label: "Visa · Full Service POS Online Messages (abr 2025)", file: "manuals/full-service-pos-online-messages-tech-specs.pdf" },
    mastercard: { label: "Mastercard · Customer Interface Specification (feb 2025)", file: "manuals/mastercard-customer-interface-specification-feb2025.pdf" },
    amex: { label: "American Express · Network Specifications Authorization (oct 2023)", file: "manuals/amex-network-specifications-authorization-oct2023.pdf" },
  };
  const row = (de, name, value, length, format, origin, bytes) => {
    const r = [String(de), name, String(value), String(length), format, origin];
    if (bytes != null) r.push(bytes);
    return r;
  };
  const pad2 = (n) => String(n).padStart(2, "0");
  const now = () => new Date();
  const de12 = (d = now()) => pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds());
  const de13 = (d = now()) => pad2(d.getMonth() + 1) + pad2(d.getDate());
  const julianRrn = (stan, d = now()) => {
    const start = new Date(d.getFullYear(), 0, 0);
    const day = Math.floor((d - start) / 86400000);
    return (String(d.getFullYear()).slice(-1) + String(day).padStart(3, "0") + pad2(d.getHours()) + String(stan || "000000").padStart(6, "0")).slice(0, 12);
  };
  const fit = (text, len) => String(text).toUpperCase().slice(0, len).padEnd(len, " ");
  const de43Visa = () => fit(ACQ.merchantName, 25) + fit(ACQ.city, 13) + "AR";
  const de43Mc = () => fit(ACQ.merchantName, 22) + " " + fit(ACQ.city, 13) + " " + "ARG";
  const bcd = (n, digits) => String(Math.max(0, Math.round(Number(n) || 0))).padStart(digits, "0").slice(-digits);
  const hexLen = (hex, bytes = 1) => (hex.length / 2).toString(16).toUpperCase().padStart(bytes * 2, "0");

  /* ---------- VISA ---------- */
  // Field 53 (Visa): 20 = Zone Encryption · 01 = algoritmo DES · 01 = PIN block ISO formato 0 · 01 = zone key index · ceros.
  const VISA_DE53 = "2001010100000000";
  // DE 53 (Mastercard): 97 = múltiples claves indexadas · 01 = DES · 10 = ISO formato 0 · 0001 = índice de clave · ceros.
  const MC_DE53 = "9701100001000000";

  function visaRequestAdditions({ stan, channel = "card" }) {
    const rows = [
      row(12, "Time, Local Transaction", de12(), "6", "FIXED", "Hora local del comercio (hhmmss) · Visa Tabla 289: M"),
      row(13, "Date, Local Transaction", de13(), "4", "FIXED", "Fecha local (MMDD) · Visa Tabla 289: M"),
      row(18, "Merchant Type (MCC)", ACQ.mcc, "4", "FIXED", "Rubro del comercio · Visa Tabla 289: M"),
      row(19, "Acquiring Institution Country Code", ACQ.country, "3", "FIXED", "Argentina (032) · Visa Tabla 289: M"),
      row(32, "Acquiring Institution ID Code", ACQ.visaAcquirerBin, String(ACQ.visaAcquirerBin.length), "LLVAR", "BIN del adquirente · Visa Tabla 289: M"),
      row(37, "Retrieval Reference Number", julianRrn(stan), "12", "FIXED", "Referencia del adquirente (YDDDhh + STAN) · Visa Tabla 289: M"),
      row(43, "Card Acceptor Name/Location", de43Visa(), "40", "FIXED", "Nombre 25 + ciudad 13 + país 2 · Visa Tabla 289: M"),
      row(63, "V.I.P. Private-Use Fields · 63.0 bitmap + 63.1 Network ID", "800000" + "0002", "5 bytes", "LLVAR", "63.1 = 0002 (programas Visa) · Visa Field 63.1", 6),
    ];
    if (channel === "cnp") {
      rows.push(row(25, "Point-of-Service Condition Code", "59", "2", "FIXED", "59 = E-commerce request by public network · Visa Field 25"));
    }
    return rows;
  }
  function visaResponseAdditions({ request }) {
    const pick = (de) => request.find((r) => r[0] === String(de));
    return [19, 25, 32, 37, 42, 63].map((de) => pick(de)).filter(Boolean).map((r) => {
      const c = r.slice();
      c[5] = "Eco de la solicitud · Visa Tabla 289 (0110: M)";
      return c;
    });
  }
  // Field 104 Usage 2 · Dataset ID 5D (Installment Payment Data) · TLV con valores BCD.
  function visaInstallmentF104(inst) {
    const tlv = (tag, valueHex) => tag + hexLen(valueHex) + valueHex;
    const body =
      tlv("01", bcd(inst.totalCents, 12)) +
      tlv("02", bcd(ACQ.country, 4)) +
      tlv("03", bcd(inst.count, 4)) +
      tlv("04", bcd(inst.installmentCents, 12)) +
      tlv("17", bcd(inst.interest ? 2 : 1, 2)) +
      tlv("80", bcd(inst.interest ? 1 : 3, 2));
    const dataset = "5D" + hexLen(body, 2) + body;
    const value = hexLen(dataset) + dataset;
    return row(104, "Transaction-Specific Data · Usage 2 · Dataset ID 5D (Installment Payment Data)", value, `${value.length / 2} bytes`, "BINARY",
      `Tags 01 total · 02 moneda · 03 cantidad · 04 cuota · 17 tipo (${inst.interest ? "2 = con interés" : "1 = sin interés"}) · 80 dueño del plan (${inst.interest ? "01 emisor" : "03 comercio"})`, value.length / 2);
  }
  function visaInstallment126() {
    // 126.0 bitmap de 8 bytes con el bit 13 encendido + 126.13 = "I" (Installment payment).
    return row(126, "Visa Private-Use Fields · 126.0 bitmap + 126.13 POS Environment", "0008000000000000" + "I", "9 bytes", "LLVAR", "126.13 = I (installment payment) · Visa Field 126.13", 10);
  }

  /* ---------- MASTERCARD ---------- */
  function mcDe61({ channel = "card" } = {}) {
    if (channel === "cnp") {
      // 1 desatendido (PC/celular) · 0 · 2 terminal del titular · 5 orden electrónica · 1 tarjeta no presente · 0 · 0 · 0 · 0 · 6 CAT nivel 6 e-commerce · 0
      return "1025100006" + "0" + "00" + ACQ.country + ACQ.postal;
    }
    // 0 atendida · 0 · 0 en el comercio · 0 titular presente · 0 tarjeta presente · 0 · 0 normal · 0 · 0 · 0 no CAT · 3 terminal contactless EMV
    return "0000000000" + "3" + "00" + ACQ.country + ACQ.postal;
  }
  function mcDe48({ tcc = "R", installments = null, ecommerce = null } = {}) {
    let v = tcc;
    if (ecommerce) {
      v += "42" + "07" + "01" + "03" + ecommerce.sli; // SE 42 · subfield 01 · n-3
      if (ecommerce.aav) v += "43" + pad2(ecommerce.aav.length) + ecommerce.aav; // SE 43 UCAF/AAV
    }
    if (installments) v += "95" + "06" + "ARGCTA"; // SE 95 Mastercard Promotion Code
    return v;
  }
  function mcRequestAdditions({ stan, channel = "card", chip = false, installments = null, ecommerce = null }) {
    const rows = [
      row(18, "Merchant Type (MCC)", ACQ.mcc, "4", "FIXED", "Rubro del comercio · CIS Tabla 14: M"),
      row(32, "Acquiring Institution ID Code", ACQ.mcAcquirerId, String(ACQ.mcAcquirerId.length), "LLVAR", "Identificación del adquirente · CIS Tabla 14: M"),
      row(48, "Additional Data: Private Use", mcDe48({ tcc: channel === "cnp" ? "T" : "R", installments, ecommerce }), "Variable", "LLLVAR",
        `TCC ${channel === "cnp" ? "T (orden electrónica)" : "R (venta minorista)"}${ecommerce ? " · SE 42 Electronic Commerce Indicators" + (ecommerce.aav ? " · SE 43 UCAF" : "") : ""}${installments ? " · SE 95 = ARGCTA (cuotas Argentina)" : ""} · CIS DE 48`),
      row(61, "Point-of-Service (POS) Data", mcDe61({ channel }), "Variable", "LLLVAR", `${channel === "cnp" ? "Titular y tarjeta no presentes · CAT 6 e-commerce" : "Terminal atendida · titular y tarjeta presentes · capacidad contactless EMV"} · país 032 · CP · CIS DE 61: M`),
    ];
    if (channel === "card") {
      rows.push(row(37, "Retrieval Reference Number", julianRrn(stan), "12", "FIXED", "Requerido en chip y lectura de tarjeta · CIS Tabla 14"));
      rows.push(row(43, "Acceptor Name and Location", de43Mc(), "40", "FIXED", "Nombre 22 + espacio + ciudad 13 + espacio + país 3 · CIS DE 43"));
    } else {
      rows.push(row(43, "Acceptor Name and Location", de43Mc(), "40", "FIXED", "Nombre 22 + espacio + ciudad 13 + espacio + país 3 · CIS DE 43"));
    }
    if (chip) rows.push(row(23, "Card Sequence Number", "000", "3", "FIXED", "PAN Sequence Number del chip (5F34 = 00) · CIS Tabla 14: requerido con DE 55"));
    if (installments) rows.push(mcInstallmentDe112(installments));
    return rows;
  }
  function mcPlanType(inst) {
    return inst.interest ? "20" : "21"; // 20 = Issuer-financed · 21 = Merchant-financed
  }
  function mcInstallmentDe112(inst) {
    const data = mcPlanType(inst) + pad2(inst.count);
    return row(112, "Additional Data (National Use) · Cuotas · SE 001 Installment Payment Data", "001" + "004" + data, "Variable", "LLLVAR",
      `SE 001 = ${mcPlanType(inst)} (${inst.interest ? "financiado por el emisor" : "financiado por el comercio"}) + ${pad2(inst.count)} cuotas · CIS DE 112 Cuotas`);
  }
  function mcResponseAdditions({ request, installments = null }) {
    const pick = (de) => request.find((r) => r[0] === String(de));
    const out = [32, 37, 48].map(pick).filter(Boolean).map((r) => {
      const c = r.slice();
      c[5] = "Eco de la solicitud · CIS layout 0110 (ME/CE)";
      return c;
    });
    out.push(row(15, "Date, Settlement", de13(), "4", "FIXED", "Fecha de liquidación que inserta la red · CIS 0110: M al destino"));
    out.push(row(63, "Network Data", "MCC" + "OSC" + String(Date.now()).slice(-6), "Variable", "LLLVAR", "Código de red + referencia (Banknet) · CIS 0110: ME"));
    if (installments) {
      out.push(row(112, "Additional Data (National Use) · Cuotas · SE 001", "001" + "004" + mcPlanType(installments) + pad2(installments.count), "Variable", "LLLVAR",
        "El emisor confirma tipo de plan y cantidad de cuotas · CIS Tabla 1282"));
    }
    return out;
  }

  /* ---------- AMERICAN EXPRESS · Bit 48 DPP ---------- */
  // Las capas DP03/DP05 llevan un bitmap BINARIO de 4 bytes: se muestra en hex entre corchetes.
  function amexDpp({ kind, inst }) {
    const n4 = bcd(inst.count, 4), amt12 = bcd(inst.installmentCents, 12);
    if (kind === "issuer-preauth-request")
      return { vli: "024", value: `DP05[30000000]${n4}${amt12}`, bytes: 24, note: "Issuer DPP Pre-Authorization · Bit 24 = 108 · subcampos 3 (cuotas) y 4 (importe de cuota)" };
    if (kind === "issuer-auth-request")
      return { vli: "016", value: `DP05[60000000]0005${n4}`, bytes: 16, note: "Issuer DPP Authorization · Bit 24 = 100 · Plan Type 0005 (plan del emisor) + cuotas" };
    if (kind === "acquirer-auth-request")
      return { vli: "028", value: `DP03[70000000]0003${n4}${amt12}`, bytes: 28, note: "Acquirer DPP Authorization · Plan Type 0003 (plan del adquirente) + cuotas + importe de cuota" };
    if (kind === "issuer-preauth-response") {
      const plan = (count) => {
        const each = Math.round(inst.totalCents * (1 + inst.rate * count / 100) / count);
        const fin = each * count - inst.totalCents;
        return bcd(Math.round(inst.rate * 100), 10) + bcd(count, 4) + bcd(each, 12) + bcd(fin, 12) + bcd(each * count, 12);
      };
      const zeros = "0".repeat(50);
      const c = inst.count;
      const d = new Date(); d.setMonth(d.getMonth() + 1);
      const first = d.getFullYear() + pad2(d.getMonth() + 1) + "10";
      return { vli: "270", value: `DP05[401F8000]0005${plan(c)}${c + 1 <= 99 ? plan(c + 1) : zeros}${c + 2 <= 99 ? plan(c + 2) : zeros}${c - 1 >= 2 ? plan(c - 1) : zeros}${c - 2 >= 2 ? plan(c - 2) : zeros}${first}`, bytes: 270,
        note: "Issuer DPP Pre-Authorization Response · plan pedido + 2 opciones arriba + 2 abajo (tasa, cuotas, cuota, financiación, total) + fecha de la 1ª cuota" };
    }
    if (kind === "issuer-auth-response") {
      const each = Math.round(inst.totalCents * (1 + inst.rate * inst.count / 100) / inst.count);
      const fin = each * inst.count - inst.totalCents;
      return { vli: "116", value: `DP05[7FE00000]0005${n4}${bcd(each, 12)}${fit("PLAN EMISOR " + inst.count + " CUOTAS", 20)}${bcd(Math.round(inst.rate * 100), 10)}${bcd(Math.round(inst.rate * 1200), 10)}${bcd(0, 12)}${bcd(0, 12)}${bcd(fin, 12)}${bcd(each * inst.count, 12)}`, bytes: 116,
        note: "Issuer DPP Authorization Response · plan, cuotas, cuota, descripción, tasas mensual/anual, propina, recargos, financiación y total" };
    }
    if (kind === "acquirer-auth-response")
      return { vli: "048", value: `DP03[78000000]0003${n4}${amt12}${fit("PLAN COMERCIO " + inst.count + " CTAS", 20)}`, bytes: 48, note: "Acquirer DPP Authorization Response · plan 0003 + cuotas + cuota + descripción" };
    return null;
  }
  function amexBit48Row(kind, inst) {
    const d = amexDpp({ kind, inst });
    return row(48, "Deferred Payment Plan (DPP)", d.value, `${d.vli} (bitmap binario de 4 bytes mostrado en hex)`, "LLLVAR", d.note + " · Amex Network Spec. Authorization, Bit 48", d.bytes);
  }

  /* ---------- Cuotas: cálculo didáctico ---------- */
  function installmentPlan({ totalCents, count, interest, monthlyRate = 3.5 }) {
    const rate = interest ? monthlyRate : 0;
    const each = Math.round(totalCents * (1 + rate * count / 100) / count);
    return { totalCents, count, interest, rate, installmentCents: interest ? each : Math.round(totalCents / count), financedCents: interest ? each * count : totalCents };
  }

  /* ---------- Utilidades ---------- */
  function merge(rows, additions = [], remove = []) {
    const map = new Map(rows.map((r) => [r[0], r]));
    remove.forEach((de) => map.delete(String(de)));
    additions.forEach((r) => { if (!map.has(r[0]) || r.override !== false) map.set(r[0], r); });
    return [...map.values()].sort((a, b) => Number(a[0]) - Number(b[0]));
  }
  function bitmapHex(rows) {
    const bits = new Set(rows.map((r) => Number(r[0])));
    const secondary = [...bits].some((b) => b > 64);
    if (secondary) bits.add(1);
    let bin = "";
    for (let i = 1; i <= (secondary ? 128 : 64); i++) bin += bits.has(i) ? "1" : "0";
    return bin.match(/.{4}/g).map((n) => parseInt(n, 2).toString(16).toUpperCase()).join("");
  }

  window.OSCIsoSpec = {
    ACQ, MANUALS, row, de12, de13, julianRrn, de43Visa, de43Mc, VISA_DE53, MC_DE53,
    visaRequestAdditions, visaResponseAdditions, visaInstallmentF104, visaInstallment126,
    mcRequestAdditions, mcResponseAdditions, mcDe61, mcDe48, mcInstallmentDe112, mcPlanType,
    amexDpp, amexBit48Row, installmentPlan, merge, bitmapHex,
  };
})();
