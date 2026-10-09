/* OSC Payment Academy v4.0.0-rc.1.22 · Mensajes ISO de Wallet (NFC con token) y E-commerce (3-D Secure)
   por red, según los manuales cargados (ver js/iso-network-spec.js). Reemplaza los mensajes fijos Visa-only. */
(function () {
  const spec = () => window.OSCIsoSpec;
  const pad2 = (n) => String(n).padStart(2, "0");
  const now = () => new Date();
  const luhn = (base) => {
    let sum = 0, alt = true;
    for (let i = base.length - 1; i >= 0; i--) { let n = +base[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; alt = !alt; }
    return base + ((10 - (sum % 10)) % 10);
  };
  const CRED = {
    visa: { token: luhn("489537001234781"), pan: luhn("411111111111111"), expiry: "2912", label: "Visa" },
    mastercard: { token: luhn("520473001234541"), pan: luhn("555555555555444"), expiry: "2912", label: "Mastercard" },
    amex: { token: luhn("37424500100100"), pan: luhn("37144963539843"), expiry: "2912", label: "American Express" },
  };
  const hex = (n) => Array.from({ length: n * 2 }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join("");
  const b64 = (bytes) => btoa(String.fromCharCode(...Array.from({ length: bytes }, () => Math.floor(Math.random() * 256))));
  const de7 = () => { const d = now(); return pad2(d.getMonth() + 1) + pad2(d.getDate()) + pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds()); };
  const amexLocal = () => { const d = now(); return String(d.getFullYear()).slice(-2) + pad2(d.getMonth() + 1) + pad2(d.getDate()) + pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds()); };
  const yymmdd = () => { const d = now(); return String(d.getFullYear()).slice(-2) + pad2(d.getMonth() + 1) + pad2(d.getDate()); };
  const tlvLen = (v) => (v.length / 2).toString(16).toUpperCase().padStart(2, "0");

  function emv(network, pan, amount12, currency) {
    const C = window.OSCEmvCrypto;
    const iad = network === "mastercard" ? "0110A00003220000000000000000000000" : "06011203A0B800";
    const un = hex(4), atc = "00" + hex(1), date = yymmdd(), aip = network === "mastercard" ? "1980" : "2000";
    let arqc = "A1B2C3D4E5F60708", trace = null;
    if (C) {
      trace = C.computeArqc({ pan, psn: "00", atc, scheme: network === "visa" ? "UDK" : "CSK", tags: { "9F02": amount12, "9F03": "000000000000", "9F1A": "0032", "95": "0000000000", "5F2A": currency, "9A": date, "9C": "00", "9F37": un, "82": aip, cvr: network === "mastercard" ? iad.slice(4, 16) : iad.slice(6) } });
      arqc = trace.arqc;
    }
    const tags = [["9F26", arqc], ["9F27", "80"], ["9F10", iad], ["9F37", un], ["9F36", atc], ["95", "0000000000"], ["9A", date], ["9F02", amount12], ["9F03", "000000000000"], ["9C", "00"], ["5F2A", currency], ["82", aip], ["9F1A", "0032"], ["9F34", "1F0302"], ["9F6E", network === "visa" ? "20700000" : "0000"], ["5F34", "00"]];
    const tlv = tags.map(([t, v]) => t + tlvLen(v) + v).join("");
    const value = network === "visa" ? "01" + (tlv.length / 2).toString(16).toUpperCase().padStart(4, "0") + tlv : tlv;
    const arpc = trace && C ? C.computeArpc(trace.key, arqc, "3030") : null;
    return { value, trace: trace ? { ...trace, pan, psn: "00", atc, network } : null, arpc };
  }

  function build(channel, network, amountCents, code = "00") {
    const S = spec();
    const r = S.row;
    const cred = CRED[network] || CRED.visa;
    const wallet = channel === "WALLET";
    const pan = wallet ? cred.token : cred.pan;
    const currency = wallet ? "032" : "840";
    const amount12 = String(Math.round(amountCents)).padStart(12, "0");
    const stan = String(Math.floor(100000 + Math.random() * 900000));
    const auth = String(Math.floor(100000 + Math.random() * 900000));
    const approved = network === "amex" ? code === "000" || code === "00" : code === "00";
    const notes = [];
    let req = [], res = [], mtiReq, mtiRes, emvData = null, threeDs = null;

    if (network === "amex") {
      mtiReq = "1100"; mtiRes = "1110";
      // Bit 22 (12 posiciones, Codes Reference Guide): wallet contactless → pos.6 "Y"; e-commerce → pos.4 "S" y pos.5 "S".
      const pdc = wallet ? "5" + "6" + "1" + "1" + "0" + "Y" + "5" + "0" + "0" + "1" + "4" + "0" : "6" + "0" + "0" + "S" + "S" + "0" + "6" + "0" + "0" + "1" + "1" + "0";
      req = [
        r(2, "Primary Account Number (PAN)", pan, String(pan.length), "LLVAR", wallet ? "Token de la wallet (D-PAN)" : "Tarjeta ingresada en el checkout"),
        r(3, "Processing Code", "004000", "6", "FIXED", "Card Authorization Request"),
        r(4, "Amount, Transaction", amount12, "12", "FIXED", "Importe"),
        r(7, "Date and Time, Transmission", de7(), "10", "FIXED", "MMDDhhmmss"),
        r(11, "Systems Trace Audit Number", stan, "6", "FIXED", "STAN del adquirente"),
        r(12, "Date and Time, Local Transaction", amexLocal(), "12", "FIXED", "YYMMDDhhmmss"),
        r(14, "Card Expiration Date", cred.expiry, "4", "FIXED", "YYMM"),
        r(19, "Country Code, Acquiring Institution", "032", "3", "FIXED", "Argentina"),
        r(22, "Point of Service Data Code", pdc, "12", "FIXED", wallet ? "Pos. 6 = Y · Digital Wallet - Contactless Initiated (Codes Reference Guide)" : "Pos. 4 = S entrega electrónica · pos. 5 = S titular no presente, Internet (Codes Reference Guide)"),
        r(24, "Function Code", "100", "3", "FIXED", "Original authorization · amount accurate"),
        r(26, "Card Acceptor Business Code", S.ACQ.mcc, "4", "FIXED", "MCC"),
        r(32, "Acquiring Institution Identification (AIN) Code", "12345678901", "11", "LLVAR", "AIN del adquirente"),
        r(37, "Acquirer Reference Number (ARN)", S.julianRrn(stan), "12", "FIXED", "Referencia del adquirente"),
        r(41, "Card Acceptor Terminal Identification", wallet ? "POSNFC01" : "ECOM0001", "8", "FIXED", "Terminal"),
        r(42, "Card Acceptor Identification Code", "1234567890     ", "15", "FIXED", "Número de establecimiento (S/E)"),
        r(49, "Currency Code, Transaction", currency, "3", "FIXED", wallet ? "ARS" : "USD"),
      ];
      if (wallet) {
        emvData = emv("amex", pan, amount12, "0" + currency);
        req.push(r(55, "ICC System Related Data", emvData.value, `${emvData.value.length / 2} bytes`, "LLLVAR", "Expresspay desde el teléfono · ARQC calculado"));
      } else {
        const aevv = "0" + hex(20).slice(1); // sub-subcampo 1 = 0 (Authenticate Successful)
        threeDs = { eci: "05", aevv };
        req.push(r(61, "National Use Data · American Express SafeKey", "AX" + "ASK" + "05" + "AEVV" + `[${aevv}]`, "Variable", "LLLVAR", "Primary ID AX · Secondary ID ASK · ECI 05 (autenticado con AEVV) · AEVV de 20 bytes binarios mostrado en hex (Network Spec. Authorization, Tabla 5-1)"));
      }
      const tid = String(Date.now()).slice(-15);
      res = [2, 3, 4, 7, 11, 12, 24, 32, 37, 41, 42, 49].map((de) => req.find((x) => x[0] === String(de))).filter(Boolean).map((x) => { const c = x.slice(); c[5] = "Eco"; return c; });
      res.push(r(31, "Acquirer Reference Data · Transaction Identifier (TID)", tid, String(tid.length), "LLVAR", "Generado por American Express Network"));
      res.push(r(39, "Action Code", approved ? "000" : code, "3", "FIXED", approved ? "Approved" : "Rechazo del emisor"));
      if (approved) res.push(r(38, "Approval Code", auth, "6", "FIXED", "Código de aprobación"));
      if (approved && emvData?.arpc) res.push(r(55, "ICC System Related Data", "910A" + emvData.arpc.arpc + "3030", "12 bytes", "LLLVAR", "Tag 91 · ARPC Método 1 + ARC"));
      res.sort((a, b) => Number(a[0]) - Number(b[0]));
    } else {
      mtiReq = "0100"; mtiRes = "0110";
      req = [
        r(2, "Primary Account Number (PAN)", pan, String(pan.length), "LLVAR", wallet ? "Token de pago (D-PAN) de la wallet" : "PAN ingresado en el checkout"),
        r(3, "Processing Code", "000000", "6", "FIXED", "Compra"),
        r(4, "Amount, Transaction", amount12, "12", "FIXED", "Importe"),
        r(7, "Transmission Date and Time", de7(), "10", "FIXED", "MMDDhhmmss"),
        r(11, "Systems Trace Audit Number (STAN)", stan, "6", "FIXED", "STAN"),
        r(14, "Date, Expiration", cred.expiry, "4", "FIXED", wallet ? "Vencimiento del token" : "Vencimiento ingresado"),
        r(41, wallet ? "Card Acceptor Terminal ID" : "Card Acceptor Terminal ID", wallet ? "POSNFC01" : "ECOM0001", "8", "FIXED", wallet ? "POS contactless" : "Terminal virtual del comercio"),
        r(42, "Card Acceptor ID Code", "OSCSTORE0100001", "15", "FIXED", "Comercio"),
        r(49, "Currency Code, Transaction", currency, "3", "FIXED", wallet ? "ARS" : "USD"),
      ];
      if (network === "visa") {
        req.push(r(22, "POS Entry Mode Code", wallet ? "0710" : "0120", "4", "FIXED", wallet ? "07 contactless qVSDC (Visa Token Service) · 1 acepta PIN · 0" : "01 key entry (e-commerce) · 2 no acepta PIN · 0 (Visa Field 22)"));
        req.push(r(25, "POS Condition Code", wallet ? "00" : "59", "2", "FIXED", wallet ? "Operación normal" : "59 = E-commerce request by public network (Visa Field 25)"));
        req = S.merge(req, S.visaRequestAdditions({ stan, channel: wallet ? "card" : "cnp" }));
        if (wallet) {
          emvData = emv("visa", pan, amount12, "0" + currency);
          req = S.merge(req, [r(23, "Card Sequence Number", "000", "3", "FIXED", "PSN del token"), r(55, "ICC-Related Data · Usage 1 · Dataset 01", emvData.value, `${emvData.value.length / 2} bytes`, "LLLVAR", "qVSDC desde el teléfono · ARQC calculado (CVN 10)")]);
        } else {
          const cavv = hex(20);
          threeDs = { eci: "05", cavv };
          req = S.merge(req, [
            r(60, "Additional POS Information · 60.8 MOTO/ECI Indicator", "00000000" + "05", "10", "LLVAR", "Posiciones 9-10 = 05: comercio seguro con CAVV (Visa Field 22 · E-Commerce)"),
            r(126, "Visa Private-Use Fields · 126.0 bitmap + 126.9 CAVV", "0080000000000000" + cavv, "28 bytes", "LLVAR", "126.9 Usage 2: 3-D Secure CAVV (20 bytes) generado por el ACS del emisor", 29),
          ]);
        }
        res = S.merge([
          r(2, "Primary Account Number (PAN)", pan, String(pan.length), "LLVAR", "Eco"),
          r(3, "Processing Code", "000000", "6", "FIXED", "Eco"), r(4, "Amount, Transaction", amount12, "12", "FIXED", "Eco"),
          r(7, "Transmission Date and Time", req.find((x) => x[0] === "7")[2], "10", "FIXED", "Eco"), r(11, "STAN", stan, "6", "FIXED", "Eco"),
          r(39, "Response Code", code, "2", "FIXED", "Emisor"), r(41, "Terminal ID", req.find((x) => x[0] === "41")[2], "8", "FIXED", "Eco"),
          r(49, "Currency Code", currency, "3", "FIXED", "Eco"),
        ], S.visaResponseAdditions({ request: req }));
      } else {
        // Mastercard Customer Interface Specification
        const ecommerce = wallet ? null : { sli: "212", aav: b64(20) };
        if (ecommerce) threeDs = { eci: "212", aav: ecommerce.aav };
        req.push(r(22, "POS Entry Mode", wallet ? "071" : "812", "3", "FIXED", wallet ? "07 contactless M/Chip · 1 acepta PIN (CIS DE 22)" : "81 e-commerce con AAV en DE 48 SE 43 · 2 sin PIN (CIS DE 22)"));
        req = S.merge(req, S.mcRequestAdditions({ stan, channel: wallet ? "card" : "cnp", chip: wallet, ecommerce }));
        if (wallet) {
          emvData = emv("mastercard", pan, amount12, "0" + currency);
          req = S.merge(req, [r(55, "ICC System-Related Data", emvData.value, `${emvData.value.length / 2} bytes`, "LLLVAR", "M/Chip desde el teléfono (MDES) · ARQC calculado (EMV CSK)")]);
        }
        res = S.merge([
          r(2, "Primary Account Number (PAN)", pan, String(pan.length), "LLVAR", "Eco"),
          r(3, "Processing Code", "000000", "6", "FIXED", "Eco"), r(4, "Amount, Transaction", amount12, "12", "FIXED", "Eco"),
          r(7, "Transmission Date and Time", req.find((x) => x[0] === "7")[2], "10", "FIXED", "Eco"), r(11, "STAN", stan, "6", "FIXED", "Eco"),
          r(39, "Response Code", code, "2", "FIXED", "Emisor"), r(41, "Acceptor Terminal ID", req.find((x) => x[0] === "41")[2], "8", "FIXED", "Eco"),
          r(49, "Currency Code", currency, "3", "FIXED", "Eco"),
        ], S.mcResponseAdditions({ request: req }));
      }
      if (approved) res = S.merge(res, [r(38, "Authorization ID Response", auth, "6", "FIXED", "Código de autorización del emisor")]);
      if (approved && emvData?.arpc) {
        const tlv = "910A" + emvData.arpc.arpc + "3030";
        const v = network === "visa" ? "01" + (tlv.length / 2).toString(16).toUpperCase().padStart(4, "0") + tlv : tlv;
        res = S.merge(res, [r(55, "ICC Data · Issuer Authentication Data (tag 91)", v, `${v.length / 2} bytes`, "LLLVAR", "ARPC Método 1 + ARC 3030")]);
      }
    }
    notes.push(S.MANUALS[network]?.label || "");
    return {
      channel, network, pan, panLast4: pan.slice(-4), stan, auth: approved ? auth : "", approved, code, currency, amountCents,
      request: { mti: mtiReq, fields: req, bitmap: S.bitmapHex(req) },
      response: { mti: mtiRes, fields: res, bitmap: S.bitmapHex(res) },
      arqcTrace: emvData?.trace ? { ...emvData.trace, validation: { ok: true, recomputed: emvData.trace.arqc }, arpc: approved ? emvData.arpc : null } : null,
      threeDs, manual: notes[0],
    };
  }

  function render(panel, tx, title) {
    if (!panel || !tx) return;
    let side = "request";
    const draw = () => {
      const m = tx[side];
      const bits = new Set(m.fields.map((f) => Number(f[0])));
      const sec = [...bits].some((b) => b > 64);
      if (sec) bits.add(1);
      const grid = (from) => Array.from({ length: 64 }, (_, i) => `<span class="bit${bits.has(from + i) ? " on" : ""}">${from + i}</span>`).join("");
      panel.innerHTML = `<h2>3 · Mensaje ISO8583</h2>
        <div class="sub">${esc(title)} · ${esc(tx.manual)}</div>
        <div class="iso-side-tabs" style="display:flex;gap:6px;margin:8px 0"><button type="button" data-side="request" class="scenario${side === "request" ? " active" : ""}">Solicitud ${tx.request.mti}</button><button type="button" data-side="response" class="scenario${side === "response" ? " active" : ""}">Respuesta ${tx.response.mti}</button></div>
        ${tx.arqcTrace ? `<div style="margin:6px 0"><button type="button" class="scenario" data-edu="arqc">🔐 Ver ARQC / ARPC de esta compra</button></div>` : ""}
        <div class="metrics"><div class="metric"><small>MTI</small><b>${m.mti}</b></div><div class="metric"><small>BITMAP (Hex)</small><b style="word-break:break-all">${m.bitmap}</b></div><div class="metric"><small>CAMPOS</small><b>${m.fields.length}</b></div></div>
        <div class="bitmapbox"><h3>BITMAP ISO8583 (1–64)</h3><div class="bitgrid">${grid(1)}</div></div>
        ${sec ? `<div class="bitmapbox"><h3>BITMAP ISO8583 (65–128)</h3><div class="bitgrid">${grid(65)}</div></div>` : ""}
        <div class="debox"><h3>DATA ELEMENTS</h3><table><thead><tr><th>DE</th><th>Nombre</th><th>Valor</th></tr></thead><tbody>
        ${m.fields.map((f) => `<tr><td>${esc(f[0])}</td><td>${esc(f[1])}<br><small style="color:#8fb0c6">${esc(f[5] || "")}</small></td><td style="font-family:Consolas,monospace;word-break:break-all">${esc(f[2])}</td></tr>`).join("")}
        </tbody></table></div>`;
      panel.querySelectorAll("[data-side]").forEach((b) => (b.onclick = () => { side = b.dataset.side; draw(); }));
      const edu = panel.querySelector("[data-edu]");
      if (edu) edu.onclick = () => window.OSCSecurityEdu?.open("arqc", tx.arqcTrace, "trace");
    };
    draw();
  }
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const toObj = (fields) => Object.fromEntries(fields.map((f) => [f[0], f[2]]));

  window.OSCModernIso = { CRED, build, render, toObj };
})();
