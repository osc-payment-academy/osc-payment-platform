/* OSC Payment Academy v4.0.0-rc.1.39 (pestañas del panel Data Elements) · v4.0.0-rc.1.22 · Mensajes ISO de Wallet (NFC con token) y E-commerce (3-D Secure)
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

  function emv(network, pan, amount12, currency, country = "032", sentAmount12 = null) {
    const C = window.OSCEmvCrypto;
    const iad = network === "mastercard" ? "0110A00003220000000000000000000000" : "06011203A0B800";
    const un = hex(4), atc = "00" + hex(1), date = yymmdd(), aip = network === "mastercard" ? "1980" : "2000";
    let arqc = "A1B2C3D4E5F60708", trace = null;
    if (C) {
      trace = C.computeArqc({ pan, psn: "00", atc, scheme: network === "visa" ? "UDK" : "CSK", tags: { "9F02": amount12, "9F03": "000000000000", "9F1A": "0" + country, "95": "0000000000", "5F2A": currency, "9A": date, "9C": "00", "9F37": un, "82": aip, cvr: network === "mastercard" ? iad.slice(4, 16) : iad.slice(6) } });
      arqc = trace.arqc;
    }
    // rc.1.33 · "Importe alterado en tránsito": el teléfono firmó amount12, pero viaja sentAmount12. El emisor recalcula con lo recibido.
    let validation = trace ? { ok: true, recomputed: trace.arqc } : null;
    if (C && trace && sentAmount12 && sentAmount12 !== amount12) {
      const again = C.computeArqc({ pan, psn: "00", atc, scheme: network === "visa" ? "UDK" : "CSK", tags: { "9F02": sentAmount12, "9F03": "000000000000", "9F1A": "0" + country, "95": "0000000000", "5F2A": currency, "9A": date, "9C": "00", "9F37": un, "82": aip, cvr: network === "mastercard" ? iad.slice(4, 16) : iad.slice(6) } });
      validation = { ok: false, recomputed: again.arqc, reason: "el importe (9F02 / DE 4) cambió después de que el teléfono firmó" };
    }
    const tags = [["9F26", arqc], ["9F27", "80"], ["9F10", iad], ["9F37", un], ["9F36", atc], ["95", "0000000000"], ["9A", date], ["9F02", sentAmount12 || amount12], ["9F03", "000000000000"], ["9C", "00"], ["5F2A", currency], ["82", aip], ["9F1A", "0" + country], ["9F34", "1F0302"], ["9F6E", network === "visa" ? "20700000" : "0000"], ["5F34", "00"]];
    const tlv = tags.map(([t, v]) => t + tlvLen(v) + v).join("");
    const value = network === "visa" ? "01" + (tlv.length / 2).toString(16).toUpperCase().padStart(4, "0") + tlv : tlv;
    const arpc = trace && C && validation?.ok ? C.computeArpc(trace.key, arqc, "3030") : null;
    return { value, trace: trace ? { ...trace, pan, psn: "00", atc, network } : null, arpc, validation };
  }

  // rc.1.32 · opts.profile = "AR" (default) | "EC" (Guayaquil, USD). Solo cambia moneda/país del canal Wallet.
  function build(channel, network, amountCents, code = "00", opts = {}) {
    const S = spec();
    if (!S.withAcquirer) return buildCore(channel, network, amountCents, code, null);
    return S.withAcquirer(opts.profile || "AR", (prof) => buildCore(channel, network, amountCents, code, opts.profile ? prof : null, !!opts.tamper && channel === "WALLET", opts));
  }
  const CUR_ALPHA = { "032": "ARS", "840": "USD" };

  // rc.1.35 · E-commerce: opts.threeDs = "full" | "attempt" | "none" (resultado de la autenticación) y opts.cvc (código de seguridad).
  const ECI = {
    visa: { full: "05", attempt: "06", none: "07" },
    mastercard: { full: "212", attempt: "211", none: "210" },
    amex: { full: "05", attempt: "06", none: "07" },
  };
  function buildCore(channel, network, amountCents, code, prof, tamper = false, opts = {}) {
    const tds = opts.threeDs || "full";
    const cvc = opts.cvc || null;
    const S = spec();
    const r = S.row;
    const cred = CRED[network] || CRED.visa;
    const wallet = channel === "WALLET";
    const pan = wallet ? cred.token : cred.pan;
    const currency = wallet ? (prof?.currency || "032") : "840";
    const country = S.ACQ.country || "032";
    const signed12 = String(Math.round(amountCents)).padStart(12, "0");
    // Con tamper, el importe que viaja (DE 4 y 9F02) es +1.000,00 respecto del firmado; el emisor rechaza por criptograma.
    const amount12 = tamper ? String(Math.round(amountCents) + 100000).padStart(12, "0") : signed12;
    if (tamper) code = network === "amex" ? "100" : network === "visa" ? "82" : "88";
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
        r(19, "Country Code, Acquiring Institution", country, "3", "FIXED", S.ACQ.countryName || "Argentina"),
        r(22, "Point of Service Data Code", pdc, "12", "FIXED", wallet ? "Pos. 6 = Y · Digital Wallet - Contactless Initiated (Codes Reference Guide)" : "Pos. 4 = S entrega electrónica · pos. 5 = S titular no presente, Internet (Codes Reference Guide)"),
        r(24, "Function Code", "100", "3", "FIXED", "Original authorization · amount accurate"),
        r(26, "Card Acceptor Business Code", S.ACQ.mcc, "4", "FIXED", "MCC"),
        r(32, "Acquiring Institution Identification (AIN) Code", "12345678901", "11", "LLVAR", "AIN del adquirente"),
        r(37, "Acquirer Reference Number (ARN)", S.julianRrn(stan), "12", "FIXED", "Referencia del adquirente"),
        r(41, "Card Acceptor Terminal Identification", wallet ? "POSNFC01" : "ECOM0001", "8", "FIXED", "Terminal"),
        r(42, "Card Acceptor Identification Code", "1234567890     ", "15", "FIXED", "Número de establecimiento (S/E)"),
        r(49, "Currency Code, Transaction", currency, "3", "FIXED", CUR_ALPHA[currency] || currency),
      ];
      if (wallet) {
        emvData = emv("amex", pan, signed12, "0" + currency, country, amount12);
        req.push(r(55, "ICC System Related Data", emvData.value, `${emvData.value.length / 2} bytes`, "LLLVAR", "Expresspay desde el teléfono · ARQC calculado"));
      } else {
        // Bit 61 SafeKey (Tabla 5-1): ECI 05 autenticado con AEVV · 06 intento con AEVV · 07 no autenticado (sin AEVV).
        // AEVV sub-subcampo 1: 0 = Authenticate Successful · 8 = Attempt, ACS no disponible.
        const eci = ECI.amex[tds];
        const aevv = tds === "none" ? null : (tds === "attempt" ? "8" : "0") + hex(20).slice(1);
        threeDs = { network, mode: tds, eci, value: aevv, valueName: "AEVV", field: "Bit 61" };
        req.push(r(61, "National Use Data · American Express SafeKey", "AX" + "ASK" + eci + (aevv ? "AEVV" + `[${aevv}]` : ""), "Variable", "LLLVAR",
          `Primary ID AX · Secondary ID ASK · ECI ${eci} (${tds === "full" ? "autenticado con AEVV" : tds === "attempt" ? "intento con AEVV" : "no autenticado, sin AEVV"})${aevv ? " · AEVV de 20 bytes binarios mostrado en hex" : ""} (Network Spec. Authorization, Tabla 5-1)`));
        if (cvc) req.push(r(53, "Security Related Control Information", "04" + cvc, "6", "LLVAR", "04 = largo · CSC de 4 dígitos (4DBC/4CSC) ingresado por el titular (Network Spec. Authorization, Bit 53)"));
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
        r(49, "Currency Code, Transaction", currency, "3", "FIXED", CUR_ALPHA[currency] || currency),
      ];
      if (network === "visa") {
        req.push(r(22, "POS Entry Mode Code", wallet ? "0710" : "0120", "4", "FIXED", wallet ? "07 contactless qVSDC (Visa Token Service) · 1 acepta PIN · 0" : "01 key entry (e-commerce) · 2 no acepta PIN · 0 (Visa Field 22)"));
        req.push(r(25, "POS Condition Code", wallet ? "00" : "59", "2", "FIXED", wallet ? "Operación normal" : "59 = E-commerce request by public network (Visa Field 25)"));
        req = S.merge(req, S.visaRequestAdditions({ stan, channel: wallet ? "card" : "cnp" }));
        if (wallet) {
          emvData = emv("visa", pan, signed12, "0" + currency, country, amount12);
          req = S.merge(req, [r(23, "Card Sequence Number", "000", "3", "FIXED", "PSN del token"), r(55, "ICC-Related Data · Usage 1 · Dataset 01", emvData.value, `${emvData.value.length / 2} bytes`, "LLLVAR", "qVSDC desde el teléfono · ARQC calculado (CVN 10)")]);
        } else {
          // 60.8 (Tabla posiciones 9-10): 05 secure e-commerce · 06 intento en comercio 3-D Secure · 07 non-authenticated security.
          const eci = ECI.visa[tds];
          const cavv = tds === "none" ? null : hex(20);
          threeDs = { network, mode: tds, eci, value: cavv, valueName: "CAVV", field: "60.8 + 126.9" };
          // 126.0 bitmap: bit 9 (CAVV) = 0x0080…, bit 10 (CVV2) = 0x0040…
          const bm126 = cavv && cvc ? "00C0000000000000" : cavv ? "0080000000000000" : "0040000000000000";
          const cvv2 = cvc ? "1" + "1" + cvc.padStart(4, " ") : ""; // 126.10: presente · pedir resultado en 44.10 · valor justificado a derecha
          const subs = [cavv ? "126.9 CAVV (20 bytes, " + (tds === "attempt" ? "CAVV de intento" : "autenticación completa") + ")" : null, cvc ? "126.10 CVV2 = «11 " + cvc + "» (presente · resultado en 44.10)" : null].filter(Boolean).join(" · ");
          req = S.merge(req, [
            r(60, "Additional POS Information · 60.8 MOTO/ECI Indicator", "00000000" + eci, "10", "LLVAR", `Posiciones 9-10 = ${eci}: ${tds === "full" ? "secure electronic commerce (autenticado)" : tds === "attempt" ? "intento de autenticación en comercio 3-D Secure" : "non-authenticated security transaction"} (Visa Field 60.8)`),
            r(126, "Visa Private-Use Fields · 126.0 bitmap" + (cavv ? " + 126.9 CAVV" : "") + (cvc ? " + 126.10 CVV2" : ""), bm126 + (cavv || "") + cvv2, `${8 + (cavv ? 20 : 0) + (cvc ? 6 : 0)} bytes`, "LLVAR", subs, 9 + (cavv ? 20 : 0) + (cvc ? 6 : 0)),
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
        // DE 48 SE 42 (Tabla 418): 212 AAV autenticado · 211 AAV de intento · 210 sin autenticar (sin SE 43).
        const ecommerce = wallet ? null : { sli: ECI.mastercard[tds], aav: tds === "none" ? null : b64(20), cvc };
        if (ecommerce) threeDs = { network, mode: tds, eci: ecommerce.sli, value: ecommerce.aav, valueName: "AAV", field: "DE 48 SE 42 + SE 43" };
        req.push(r(22, "POS Entry Mode", wallet ? "071" : "812", "3", "FIXED", wallet ? "07 contactless M/Chip · 1 acepta PIN (CIS DE 22)" : "81 e-commerce con AAV en DE 48 SE 43 · 2 sin PIN (CIS DE 22)"));
        req = S.merge(req, S.mcRequestAdditions({ stan, channel: wallet ? "card" : "cnp", chip: wallet, ecommerce }));
        if (wallet) {
          emvData = emv("mastercard", pan, signed12, "0" + currency, country, amount12);
          req = S.merge(req, [r(55, "ICC System-Related Data", emvData.value, `${emvData.value.length / 2} bytes`, "LLLVAR", "M/Chip desde el teléfono (MDES) · ARQC calculado (EMV CSK)")]);
        }
        res = S.merge([
          r(2, "Primary Account Number (PAN)", pan, String(pan.length), "LLVAR", "Eco"),
          r(3, "Processing Code", "000000", "6", "FIXED", "Eco"), r(4, "Amount, Transaction", amount12, "12", "FIXED", "Eco"),
          r(7, "Transmission Date and Time", req.find((x) => x[0] === "7")[2], "10", "FIXED", "Eco"), r(11, "STAN", stan, "6", "FIXED", "Eco"),
          r(39, "Response Code", code, "2", "FIXED", "Emisor"), r(41, "Acceptor Terminal ID", req.find((x) => x[0] === "41")[2], "8", "FIXED", "Eco"),
          r(49, "Currency Code", currency, "3", "FIXED", "Eco"),
        ], S.mcResponseAdditions({ request: req }));
        // El CVC 2 (SE 92) no vuelve en la respuesta.
        if (cvc) res = res.map((x) => (x[0] === "48" ? Object.assign(x.slice(), { 2: x[2].replace("9203" + cvc, "") }) : x));
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
      channel, network, pan, panLast4: pan.slice(-4), fpanLast4: cred.pan.slice(-4), tokenLast4: cred.token.slice(-4), profile: prof ? (prof.currencyAlpha === "USD" ? "EC" : "AR") : "AR", stan, auth: approved ? auth : "", approved, code, currency, amountCents,
      request: { mti: mtiReq, fields: req, bitmap: S.bitmapHex(req) },
      response: { mti: mtiRes, fields: res, bitmap: S.bitmapHex(res) },
      arqcTrace: emvData?.trace ? { ...emvData.trace, channel, fpanLast4: cred.pan.slice(-4), validation: emvData.validation || { ok: true, recomputed: emvData.trace.arqc }, arpc: approved ? emvData.arpc : null } : null,
      tamper,
      threeDs, manual: notes[0],
    };
  }

  // rc.1.32 · opts.side = "request" | "response"; opts.highlight = { request: [DE...], response: [DE...] }.
  function render(panel, tx, title, opts = {}) {
    if (!panel || !tx) return;
    let side = opts.side === "response" ? "response" : "request";
    const hl = opts.highlight || {};
    const T = window.OSCDeTabs, ch = tx.channel === "ECOMMERCE" ? "ecommerce" : "wallet";
    let tab = lastTab[ch] || 0;
    const norm = (m, s) => m && { id: `${ch}-${tx.stan}-${s}`, mti: m.mti, side: s, fields: m.fields.map((f) => [f[0], f[1], f[2], f[5]]) };
    const ctx = () => ({ channel: ch, network: tx.network, message: norm(tx[side], side), req: norm(tx.request, "request"), res: norm(tx.response, "response"), threeDs: tx.threeDs, threeDsAuth: tx.threeDsAuth, operation: title });
    const draw = () => {
      const m = tx[side];
      const bits = new Set(m.fields.map((f) => Number(f[0])));
      const sec = [...bits].some((b) => b > 64);
      if (sec) bits.add(1);
      const grid = (from) => Array.from({ length: 64 }, (_, i) => `<span class="bit${bits.has(from + i) ? " on" : ""}">${from + i}</span>`).join("");
      panel.innerHTML = `<h2>3 · Mensaje ISO8583</h2>
        <div class="sub">${esc(title)} · ${esc(tx.manual)}</div>
        <div class="iso-side-tabs" style="display:flex;gap:6px;margin:8px 0"><button type="button" data-side="request" class="scenario${side === "request" ? " active" : ""}">Solicitud ${tx.request.mti}</button><button type="button" data-side="response" class="scenario${side === "response" ? " active" : ""}">Respuesta ${tx.response.mti}</button></div>
        <div class="metrics"><div class="metric"><small>MTI</small><b>${m.mti}</b></div><div class="metric"><small>BITMAP (Hex)</small><b style="word-break:break-all">${m.bitmap}</b></div><div class="metric"><small>CAMPOS</small><b>${m.fields.length}</b></div></div>
        <div class="bitmapbox"><h3>BITMAP ISO8583 (1–64)</h3><div class="bitgrid">${grid(1)}</div></div>
        ${sec ? `<div class="bitmapbox"><h3>BITMAP ISO8583 (65–128)</h3><div class="bitgrid">${grid(65)}</div></div>` : ""}
        <div class="debox"><h3>DATA ELEMENTS</h3>${T ? T.tabsHtml(ch, tab) : ""}${tab && T ? `<div class="pv-view">${T.viewHtml(tab, ctx())}</div>` : ""}<table${tab && T ? " hidden" : ""}><thead><tr><th>DE</th><th>Nombre</th><th>Valor</th></tr></thead><tbody>
        ${m.fields.map((f) => `<tr${(hl[side] || []).includes(Number(f[0])) ? ' class="de-hl"' : ""}><td>${esc(f[0])}</td><td>${esc(f[1])}<br><small style="color:#8fb0c6">${esc(f[5] || "")}</small>${tx.arqcTrace && (f[0] === "55" || f[0] === "23") ? ` <button type="button" class="de-edu-chip" data-edu="arqc">🔐 ARQC / ARPC</button>` : ""}${tx.threeDs && TDS_DE[tx.network] === f[0] ? ` <button type="button" class="de-edu-chip" data-edu="threeds">🛡️ 3-D Secure</button>` : ""}</td><td style="font-family:Consolas,monospace;word-break:break-all">${esc(f[2])}</td></tr>`).join("")}
        </tbody></table></div>`;
      panel.querySelectorAll("[data-side]").forEach((b) => (b.onclick = () => { side = b.dataset.side; draw(); }));
      // rc.1.39 · pestañas Data Elements / Vista TLV (Autenticación 3DS en E-Commerce) / Explicación / Validaciones (js/de-tabs.js).
      if (T) {
        panel.querySelectorAll("[data-dt-tab]").forEach((b) => (b.onclick = () => { tab = lastTab[ch] = Number(b.dataset.dtTab); draw(); }));
        T.wire(panel, ctx(), draw);
        T.colorBitmap(ctx(), tab === 3, [...panel.querySelectorAll(".bitgrid .bit")]);
      }
      panel.querySelectorAll("[data-edu]").forEach((edu) => (edu.onclick = (e) => { e.stopPropagation(); const k = edu.dataset.edu; window.OSCSecurityEdu?.open(k, k === "threeds" ? { ...tx.threeDs, ...(tx.threeDsAuth || {}) } : tx.arqcTrace, "trace"); }));
      const box = panel.querySelector(".debox"), first = box?.querySelector(".de-hl"); if (box && first && !tab) box.scrollTop += first.getBoundingClientRect().top - box.getBoundingClientRect().top - 40;
    };
    draw();
    return { show: (s) => { side = s === "response" ? "response" : "request"; draw(); } };
  }
  const TDS_DE = { visa: "126", mastercard: "48", amex: "61" };
  const lastTab = {}; // la pestaña elegida se mantiene entre operaciones
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const toObj = (fields) => Object.fromEntries(fields.map((f) => [f[0], f[2]]));

  window.OSCModernIso = { CRED, build, render, toObj };
})();
