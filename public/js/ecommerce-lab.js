/* OSC Payment Academy v4.0.0-rc.1.35 · Simulador E-Commerce / 3-D Secure
   - Fase A: autenticación EMV 3DS 2.x (AReq/ARes, challenge con código, RReq) · no es ISO 8583.
   - Fase B: autorización ISO 8583 con el resultado 3DS (Visa 60.8/126.9 · MC DE 48 SE 42/43 · Amex Bit 61) y el código de seguridad
     (Visa 126.10 · MC DE 48 SE 92 · Amex Bit 53).
   - Escenarios de autenticación: challenge, frictionless, intento, sin 3DS, challenge fallido.
   - Monto: arranca en el último importe de E-commerce + 20 y se ve antes de pagar (producto = total).
   - Modo paso a paso, barra de etapas que avanza, historial con red y ECI. */
(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const store = {
    get(k, d) { try { const v = sessionStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (_) {} },
  };
  const BASE_AMOUNT = 12000, AMOUNT_STEP = 2000, AUTO_DELAY = 700, OTP = "123456";
  const K = { amount: "osc_ecommerce_next_amount", stepMode: "osc_ecommerce_step_mode" };
  const NAMES = { visa: "VISA", mastercard: "MASTERCARD", amex: "AMEX" };
  const PROGRAM = { visa: "Visa Secure", mastercard: "Mastercard Identity Check", amex: "American Express SafeKey" };
  const CVC = { visa: "123", mastercard: "123", amex: "1234" };
  const CVC_FIELD = { visa: "Visa 126.10 CVV2", mastercard: "DE 48 SE 92 CVC 2", amex: "Bit 53 CSC" };
  const SCN = {
    "00": { text: "Aprobada", amex: "000" }, "51": { text: "Fondos insuficientes", amex: "116" },
    "05": { text: "No honrar", amex: "100" }, "14": { text: "Tarjeta inválida", amex: "111" },
  };
  const AMEX_TEXT = { "000": "Aprobada", "116": "Fondos insuficientes", "100": "Denegada", "111": "Cuenta inválida" };
  // Resultado 3DS por escenario: ARes, resultado final, modo para la autorización, ECI del mensaje 3DS por red.
  const TDS = {
    challenge: { label: "Challenge con código", ares: "C", mode: "full" },
    frictionless: { label: "Frictionless", ares: "Y", mode: "full" },
    attempt: { label: "Intento · ACS no disponible", ares: "A", mode: "attempt" },
    none: { label: "Sin 3-D Secure", ares: null, mode: "none" },
    fail: { label: "Challenge fallido", ares: "C", mode: "full" },
  };
  const DS_ECI = { visa: { full: "05", attempt: "06" }, mastercard: { full: "02", attempt: "01" }, amex: { full: "05", attempt: "06" } };
  const HL_REQ = { visa: [22, 25, 60, 126], mastercard: [22, 48, 61], amex: [22, 53, 61] };

  const steps = $$(".flow .step");
  const pay = $("#pay"), hist = $("#hist"), nextBtn = $("#nextStep"), sel = $("#ecomNetwork");
  const isoPanel = $(".workspace .panel:nth-child(3)");
  steps.forEach((s) => { const sm = s.querySelector("small"); if (sm) sm.dataset.orig = sm.textContent; });

  let currentAmount = Number(store.get(K.amount, BASE_AMOUNT)) || BASE_AMOUNT;
  let amountUsed = false, busy = false, currentTutorTransaction = null;

  const network = () => sel?.value || "visa";
  const money = (c) => "USD " + (c / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const stepMode = () => !!$("#stepMode")?.checked;
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/x/g, () => Math.floor(Math.random() * 16).toString(16)));
  const CRED = () => window.OSCModernIso.CRED;
  const log = (t) => { const b = $("#techEvents"); if (!b) return; const d = document.createElement("div"); d.className = "osc-event step"; d.textContent = t; b.appendChild(d); b.scrollTop = b.scrollHeight; };

  window.OSCTutorContext = () => ({ module: "ecommerce", channel: "ECOMMERCE", brand: network().toUpperCase(), transaction: currentTutorTransaction });

  /* ---------- Checkout ---------- */
  function renderCheckout() {
    const n = network(), pan = CRED()[n].pan;
    const v = money(currentAmount);
    ["#ecProdPrice", "#ecSumProd", "#ecSumTotal"].forEach((id) => { const el = $(id); if (el) el.textContent = v; });
    pay.textContent = "🔒 Pagar " + v;
    $("#ecPan").textContent = n === "amex" ? `${pan.slice(0, 4)} •••••• •${pan.slice(-4)}` : `${pan.slice(0, 4)} •••• •••• ${pan.slice(-4)}`;
    $("#ecCvc").textContent = "•".repeat(CVC[n].length);
    $("#ecProgram").innerHTML = tdsKey() === "none" ? "Este comercio no usa 3-D Secure" : `Protegido por <b>${PROGRAM[n]}</b>`;
  }
  // La ventana del banco se abre sobre el checkout, como un challenge real.
  function view(id) { ["vwCheckout", "vwBank", "vwWait", "vwResult"].forEach((v) => ($("#" + v).hidden = !(v === id || (id === "vwBank" && v === "vwCheckout")))); }
  function waitView(t, sub) { $("#ecWaitTxt").textContent = t; $("#ecWaitSub").textContent = sub || ""; view("vwWait"); }
  function stage(k, cls) {
    const order = ["checkout", "auth", "authz", "result"];
    $$("#ecStages li").forEach((li) => {
      const i = order.indexOf(li.dataset.k), j = order.indexOf(k);
      li.classList.remove("run", "done", "skip", "ko");
      if (k === null) return;
      if (i < j) li.classList.add("done"); else if (i === j) li.classList.add(cls || "run");
    });
  }
  function skipStage(k) { $(`#ecStages li[data-k="${k}"]`)?.classList.add("skip"); }

  /* ---------- Escenarios ---------- */
  const tdsKey = () => $("#tdsScenarios .scenario.active")?.dataset.tds || "challenge";
  const authKey = () => $("#authScenarios .scenario.active")?.dataset.code || "00";
  function bindGroup(id, after) {
    $$(`#${id} .scenario`).forEach((b) => b.addEventListener("click", () => {
      if (busy) return; $$(`#${id} .scenario`).forEach((x) => x.classList.remove("active")); b.classList.add("active"); after?.();
    }));
  }
  bindGroup("tdsScenarios", renderCheckout);
  bindGroup("authScenarios");
  function renderScenarios() {
    const amex = network() === "amex";
    $$("#authScenarios .scenario").forEach((b) => { const k = b.dataset.code; b.innerHTML = `${k} · ${SCN[k].text}` + (amex ? ` <span class="amex-code">Amex ${SCN[k].amex}</span>` : ""); });
  }

  /* ---------- Motor de pasos ---------- */
  function waitStep(label) {
    if (!stepMode()) return new Promise((r) => setTimeout(r, AUTO_DELAY));
    return new Promise((r) => { nextBtn.hidden = false; nextBtn.disabled = false; nextBtn.textContent = "Siguiente › " + label; nextBtn.onclick = () => { nextBtn.disabled = true; r(); }; });
  }
  async function runStep(i, label, onEnter) {
    steps[i].classList.add("run");
    const r = await onEnter?.();
    await waitStep(label);
    steps[i].classList.remove("run");
    if (r === "ko") { steps[i].classList.add("ko"); const em = steps[i].querySelector("em"); if (em) em.textContent = "✗"; return r; }
    steps[i].classList.add("done"); const em = steps[i].querySelector("em"); if (em) em.textContent = "✓";
    return r;
  }
  function paintIdle() {
    steps.forEach((s) => {
      s.classList.remove("run", "done", "skip", "ko");
      const sm = s.querySelector("small"); if (sm?.dataset.orig) sm.textContent = sm.dataset.orig;
      const em = s.querySelector("em"); if (em) em.textContent = "○";
    });
    nextBtn.hidden = true;
  }
  function note(i, text) { const sm = steps[i].querySelector("small"); if (sm) sm.textContent = text; }
  function lock(on) {
    busy = on; pay.disabled = on;
    $$("#ecomNetwork, #resetDemo, #tdsScenarios .scenario, #authScenarios .scenario").forEach((b) => (b.disabled = on));
  }

  /* ---------- Panel 3 · mensajes 3DS ---------- */
  function tdsPanel(ctx, upto) {
    if (!isoPanel) return;
    const n = ctx.network;
    const card = (title, sub, rows, hl) => `<div class="tds-msg${hl ? " hl" : ""}"><h4>${title}<small>${sub}</small></h4><table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}</table></div>`;
    const msgs = [];
    msgs.push(card("AReq · Authentication Request", "3DS Server → Directory Server → ACS", [
      ["messageVersion", ctx.version], ["threeDSServerTransID", ctx.threeDSServerTransID], ["deviceChannel", "02 (navegador)"], ["messageCategory", "01 (pago)"],
      ["acctNumber", ctx.panMasked], ["purchaseAmount", String(ctx.amountCents)], ["purchaseCurrency", "840 (USD)"], ["purchaseExponent", "2"], ["merchantName", "OSC STORE"],
    ], upto === "areq"));
    if (upto !== "areq") {
      msgs.push(card("ARes · Authentication Response", `ACS de ${PROGRAM[n]}`, [
        ["transStatus", `${ctx.aresStatus} · ${{ Y: "autenticado sin fricción", C: "challenge requerido", A: "intento (ACS no disponible)" }[ctx.aresStatus]}`],
        ["acsTransID", ctx.acsTransID], ["dsTransID", ctx.dsTransID],
        ...(ctx.aresStatus !== "C" ? [["eci", ctx.dsEci], ["authenticationValue", ctx.value ? ctx.value.slice(0, 28) + "…" : "—"]] : []),
      ], upto === "ares"));
    }
    if (ctx.aresStatus === "C" && (upto === "challenge" || upto === "result")) {
      msgs.push(card("CReq / CRes · Challenge", "Navegador ↔ ACS", [
        ["challengeWindow", "pantalla del banco en el checkout"], ["código ingresado", ctx.otpOk == null ? "(esperando)" : "••••••"],
        ...(ctx.otpOk != null ? [["transStatus (CRes)", ctx.otpOk ? "Y · código correcto" : "N · código incorrecto"]] : []),
      ], upto === "challenge"));
    }
    if (upto === "result") {
      msgs.push(card("RReq · Resultado de la autenticación", "ACS → DS → 3DS Server", ctx.finalStatus === "N"
        ? [["transStatus", "N · no autenticado"], ["Consecuencia", "El comercio no envía la autorización"]]
        : [["transStatus", ctx.finalStatus], ["eci", ctx.dsEci], ["authenticationValue", ctx.value]], true));
    }
    const map = upto === "result" && ctx.finalStatus !== "N"
      ? `<div class="tds-map">Para la autorización: <b>${n === "visa" ? `60.8 = ${ctx.eci}${ctx.value ? " · 126.9 CAVV" : ""}` : n === "mastercard" ? `DE 48 SE 42 = ${ctx.eci}${ctx.value ? " · SE 43 AAV" : ""}` : `Bit 61 = AX ASK ${ctx.eci}${ctx.value ? " AEVV" : ""}`}</b>${n === "mastercard" && ctx.value ? ` (el ECI ${ctx.dsEci} del 3DS se traduce al SLI ${ctx.eci})` : ""} · código de seguridad en <b>${CVC_FIELD[n]}</b>.</div>` : "";
    isoPanel.innerHTML = `<h2>3 · Autenticación 3-D Secure</h2><div class="sub">${PROGRAM[n]} · EMV 3DS ${ctx.version} · estos mensajes no son ISO 8583</div><div class="tds-msgs">${msgs.join("")}</div>${map}`;
  }
  function noTdsPanel(ctx) {
    isoPanel.innerHTML = `<h2>3 · Sin 3-D Secure</h2><div class="sub">El comercio no autenticó al comprador</div><div class="tds-map">No hay AReq/ARes. La autorización viaja como no autenticada: <b>${ctx.network === "visa" ? "60.8 = 07, sin CAVV" : ctx.network === "mastercard" ? "DE 48 SE 42 = 210, sin SE 43" : "Bit 61 ECI 07, sin AEVV"}</b>. Si hay fraude, la responsabilidad queda del lado del comercio.</div>`;
  }

  /* ---------- Challenge: pantalla del banco ---------- */
  function bankChallenge(ctx, prefill) {
    const n = ctx.network;
    return new Promise((resolve) => {
      $("#vwBank").innerHTML = `<div class="bk"><div class="bk-card"><div class="bk-head ${n}"><span>${PROGRAM[n]}</span><span>Banco Emisor OSC</span></div>
        <div class="bk-body"><b>Confirmá tu compra</b><span>OSC STORE · ${money(ctx.amountCents)} · tarjeta •••• ${ctx.panMasked.slice(-4)}</span>
        <span>Te enviamos un código por SMS al celular terminado en 4567.</span>
        <div class="bk-otp"><input id="bkOtp" maxlength="6" inputmode="numeric" value="${prefill}" aria-label="Código de verificación"><button type="button" id="bkOk">Confirmar</button></div>
        <span class="bk-hint">Código de prueba: <b>${OTP}</b> · cualquier otro falla</span><span class="bk-err" id="bkErr"></span></div></div></div>`;
      view("vwBank");
      const input = $("#bkOtp"); input.focus(); input.select();
      const done = () => { const ok = input.value.trim() === OTP; resolve(ok); };
      $("#bkOk").onclick = done;
      input.onkeydown = (e) => { if (e.key === "Enter") done(); };
    });
  }

  /* ---------- Compra ---------- */
  async function runPurchase() {
    if (busy) return;
    if (amountUsed) { currentAmount += AMOUNT_STEP; amountUsed = false; }
    const n = network(), key = tdsKey(), t = TDS[key];
    lock(true); paintIdle(); renderCheckout(); stage("checkout");
    const pan = CRED()[n].pan;
    const ctx = {
      network: n, scenario: key, scenarioLabel: t.label, version: "2.2.0", amountCents: currentAmount,
      threeDSServerTransID: uuid(), acsTransID: uuid(), dsTransID: uuid(), panMasked: pan.slice(0, 6) + "••••••" + pan.slice(-4),
      aresStatus: t.ares, mode: t.mode, otpOk: null,
    };
    log(`Checkout · ${NAMES[n]} · ${money(currentAmount)} · 3DS: ${t.label}`);

    // Fase A · autenticación
    await runStep(0, "(paso 2)", () => { waitView("Confirmando tu compra…", "Checkout"); });
    if (key === "none") {
      ["2", "3", "4"].forEach((k) => { const s = $(`.flow .step[data-step="${k}"]`); s.classList.add("skip"); note(+k - 1, "Omitido: el comercio no usa 3-D Secure"); });
      skipStage("auth"); noTdsPanel(ctx); ctx.finalStatus = null; ctx.eci = n === "mastercard" ? "210" : "07";
      await waitStep("(paso 5)");
    } else {
      stage("auth");
      await runStep(1, "(paso 3)", () => { waitView("Verificando con tu banco…", PROGRAM[n]); tdsPanel(ctx, "areq"); });
      await runStep(2, key === "challenge" || key === "fail" ? "(challenge)" : "(paso 4)", () => {
        if (t.ares !== "C") { ctx.dsEci = DS_ECI[n][t.mode]; ctx.value = authValue(n, t.mode); }
        tdsPanel(ctx, "ares");
        note(2, t.ares === "C" ? "ARes C · el banco pide un código" : t.ares === "Y" ? "ARes Y · sin fricción" : "ARes A · intento");
      });
      if (t.ares === "C") {
        tdsPanel(ctx, "challenge");
        ctx.otpOk = await bankChallenge(ctx, key === "fail" ? "111111" : OTP);
        ctx.challenge = ctx.otpOk ? "Código correcto" : "Código incorrecto";
        log(`Challenge · ${ctx.challenge}`);
        tdsPanel(ctx, "challenge");
        if (ctx.otpOk) { ctx.dsEci = DS_ECI[n].full; ctx.value = authValue(n, "full"); }
      }
      ctx.finalStatus = t.ares === "C" ? (ctx.otpOk ? "Y" : "N") : t.ares;
      const r4 = await runStep(3, ctx.finalStatus === "N" ? "(terminar)" : "(paso 5)", () => {
        tdsPanel(ctx, "result");
        note(3, ctx.finalStatus === "N" ? "No autenticado · se corta la compra" : `ECI ${ctx.dsEci} · ${n === "visa" ? "CAVV" : n === "mastercard" ? "AAV" : "AEVV"}`);
        return ctx.finalStatus === "N" ? "ko" : "ok";
      });
      if (r4 === "ko") {
        steps.slice(4).forEach((s) => s.classList.add("skip"));
        stage("auth", "ko"); skipStage("authz");
        showResult({ kind: "authFail", ctx });
        currentTutorTransaction = { operation: "Compra E-Commerce con 3-D Secure", amountCents: currentAmount, result: "Autenticación fallida", scenario: "3DS N", eventType: "AUTHENTICATION_FAILED", stagesReached: steps.slice(0, 4).map((s) => s.querySelector("b").textContent) };
        amountUsed = true; store.set(K.amount, String(currentAmount + AMOUNT_STEP));
        lock(false); return;
      }
    }

    // Fase B · autorización ISO 8583
    stage("authz"); waitView("Autorizando el pago…", "Tu banco está aprobando la compra");
    const code = n === "amex" ? SCN[authKey()].amex : authKey();
    const tx = window.OSCModernIso.build("ECOMMERCE", n, currentAmount, code, { threeDs: t.mode, cvc: CVC[n] });
    if (tx.threeDs?.value && ctx.value) syncValue(tx, n, ctx.value);
    tx.threeDsAuth = { ...ctx, eci: tx.threeDs?.eci, value: tx.threeDs?.value || null, valueName: tx.threeDs?.valueName, cvcField: CVC_FIELD[n], cvcLength: CVC[n].length };
    window.OSCModernLastTx = tx;
    let view3 = null;
    await runStep(4, "(paso 6)", () => { view3 = window.OSCModernIso.render(isoPanel, tx, "Compra E-Commerce con 3-D Secure", { side: "request", highlight: { request: HL_REQ[n], response: [38, 39] } }); });
    await runStep(5, "(paso 7)", () => note(5, `${NAMES[n]} · ${n === "amex" ? "1100" : "0100"} enrutada al emisor`));
    await runStep(6, "(paso 8)", () => note(6, tx.approved ? "Valor 3DS verificado · aprobada" : `Rechazo ${tx.code}`));
    await runStep(7, "(paso 9)", () => view3?.show("response"));
    await runStep(8, "(terminar)", () => { stage("result", tx.approved ? "done" : "ko"); showResult({ kind: "authz", ctx, tx }); });
    amountUsed = true; store.set(K.amount, String(currentAmount + AMOUNT_STEP));
    await persist(tx, n, ctx);
    lock(false);
  }
  // CAVV (Visa) y AEVV (Amex) en hex · AAV (Mastercard) en base64. AEVV: 1.er dígito 0 = autenticado, 8 = intento (Tabla 5-1).
  function authValue(n, mode) {
    const bytes = [...crypto.getRandomValues(new Uint8Array(20))];
    if (n === "mastercard") return btoa(String.fromCharCode(...bytes));
    const hx = bytes.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    return n === "amex" ? (mode === "attempt" ? "8" : "0") + hx.slice(1) : hx;
  }
  // El CAVV/AAV/AEVV que vuelve del ACS es el mismo que viaja en la autorización.
  function syncValue(tx, n, value) {
    const f = tx.request.fields;
    if (n === "visa") { const r = f.find((x) => x[0] === "126"); if (r && tx.threeDs.value) r[2] = r[2].replace(tx.threeDs.value, value); }
    if (n === "amex") { const r = f.find((x) => x[0] === "61"); if (r) r[2] = r[2].replace(`[${tx.threeDs.value}]`, `[${value}]`); }
    if (n === "mastercard") [f, tx.response.fields].forEach((fs) => { const r = fs.find((x) => x[0] === "48"); if (r && tx.threeDs.value) r[2] = r[2].replace("43" + String(tx.threeDs.value.length).padStart(2, "0") + tx.threeDs.value, "43" + String(value.length).padStart(2, "0") + value); });
    tx.threeDs.value = value;
  }

  function showResult({ kind, ctx, tx }) {
    const r = $("#vwResult"), n = ctx.network;
    if (kind === "authFail") {
      r.innerHTML = `<div class="rs-ico warn">!</div><b>No pudimos verificar tu identidad</b><span>${money(ctx.amountCents)}</span><small>3-D Secure: transStatus N (código incorrecto). La compra se canceló y <b>no se envió la autorización</b> al banco.</small><button type="button" id="ecAgain">Volver a la tienda</button>`;
    } else {
      const ok = tx.approved, code = ok ? (n === "amex" ? "000" : "00") : tx.code;
      const label = n === "amex" ? (AMEX_TEXT[code] || "Rechazada") : (SCN[code]?.text || "Rechazada");
      r.innerHTML = `<div class="rs-ico ${ok ? "ok" : "ko"}">${ok ? "✓" : "✗"}</div><b>${ok ? "¡Gracias por tu compra!" : "Pago rechazado"}</b><span>${money(tx.amountCents)}</span>
        <small>${ok ? `Pedido #OSC-${tx.stan} · autorización ${tx.auth}<br>` : ""}${n === "amex" ? "Action Code" : "DE 39"} ${code} · ${label}<br>3DS: ${ctx.scenarioLabel}${tx.threeDs ? ` · ${n === "mastercard" ? "SLI" : "ECI"} ${tx.threeDs.eci}` : ""}</small><button type="button" id="ecAgain">Nueva compra</button>`;
    }
    view("vwResult");
    $("#ecAgain").onclick = () => { if (busy) return; if (amountUsed) { currentAmount += AMOUNT_STEP; amountUsed = false; } view("vwCheckout"); stage(null); paintIdle(); renderCheckout(); };
  }

  async function persist(tx, n, ctx) {
    const label = "Compra E-Commerce con 3-D Secure";
    const S = window.OSCSwitchStore;
    if (S) {
      try {
        await S.ready;
        const createdAt = new Date().toISOString();
        S.addTransaction({
          id: "ecommerce-" + Date.now(), channel: "ECOMMERCE", network: n.toUpperCase(), type: "purchase", amountCents: tx.amountCents, currency: "USD",
          status: tx.approved ? "APPROVED" : "DECLINED", responseCode: tx.approved ? (n === "amex" ? "000" : "00") : tx.code, stan: tx.stan,
          rrn: (tx.request.fields.find((f) => f[0] === "37") || [])[2] || String(Date.now()).slice(-12), auth: tx.auth || "", closed: false,
          clearingStatus: tx.approved ? "PENDING" : "NOT_APPLICABLE", onlineStatus: "ROUTED", mtiRequest: tx.request.mti, mtiResponse: tx.response.mti,
          panLast4: tx.panLast4, cardId: "ECOMMERCE_" + n.toUpperCase(), product: label, raw: tx.request.mti + tx.request.bitmap,
          requestFields: window.OSCModernIso.toObj(tx.request.fields), responseFields: window.OSCModernIso.toObj(tx.response.fields),
          operationLabel: label, dateTime: createdAt, createdAt,
        });
        await S.flush();
      } catch (e) { console.warn("Switch store", e); }
      if (!tx.recorded) window.OSCModernMessages?.record?.("ECOMMERCE");
    }
    currentTutorTransaction = {
      operation: label, amountCents: tx.amountCents, result: tx.approved ? "Aprobada" : "Rechazada", scenario: tx.code, eventType: "TRANSACTION_RESPONSE",
      stagesReached: steps.filter((s) => s.classList.contains("done")).map((s) => s.querySelector("b")?.textContent || ""),
      threeDS: { scenario: ctx.scenarioLabel, transStatus: ctx.finalStatus, eci: tx.threeDs?.eci },
      request: { mti: tx.request.mti, bitmap: tx.request.bitmap, fields: tx.request.fields.map((f) => [f[0], f[1], f[2]]) },
      response: { mti: tx.response.mti, bitmap: tx.response.bitmap, fields: tx.response.fields.map((f) => [f[0], f[1], f[2]]) },
    };
    restoreHistory();
  }

  /* ---------- Historial ---------- */
  function eciOf(t) {
    const f = t.requestFields || {}, net = String(t.network || "").toLowerCase();
    if (net === "visa" && f["60"]) return "ECI " + String(f["60"]).slice(8, 10);
    if (net.startsWith("master") && f["48"]) { const m = String(f["48"]).match(/4207\d{2}03(\d{3})/); return m ? "SLI " + m[1] : ""; }
    if (net === "amex" && f["61"]) return "ECI " + String(f["61"]).slice(5, 7);
    return "";
  }
  function txRow(t, selected) {
    const d = new Date(t.createdAt || t.dateTime || Date.now()), dt = Number.isNaN(d.getTime()) ? new Date() : d;
    const declined = t.status === "DECLINED";
    return `<tr${selected ? ' class="selected"' : ""}><td>${dt.toLocaleDateString("es-AR")}</td><td>${dt.toLocaleTimeString("es-AR", { hour12: false })}</td><td>${t.operationLabel || t.type}</td><td>${t.network || "—"}${t.panLast4 ? " · •••• " + t.panLast4 : ""}</td><td>${eciOf(t) || "—"}</td><td>${t.currency || "USD"} ${(Number(t.amountCents || 0) / 100).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td><td>${t.mtiRequest} / ${t.mtiResponse}</td><td class="${declined ? "" : "ok"}">${declined ? "✗ Rechazada " + (t.responseCode || "") : "✓ Aprobada"}</td></tr>`;
  }
  function restoreHistory() {
    const rows = (window.OSCSwitchStore?.read?.()?.transactions || []).filter((t) => t.channel === "ECOMMERCE").slice(0, 50);
    hist.innerHTML = rows.length ? rows.map((t, i) => txRow(t, i === 0)).join("") : '<tr><td colspan="8" class="sub">Sin operaciones nuevas.</td></tr>';
    const c = $("#histCount"); if (c) c.textContent = rows.length ? `(${rows.length})` : "";
  }
  // El monto nunca se repite: último importe de E-commerce + 20 (o 120,00 si no hay operaciones).
  function syncAmountWithHistory() {
    if (amountUsed || busy) return;
    const last = (window.OSCSwitchStore?.read?.()?.transactions || []).find((t) => t.channel === "ECOMMERCE");
    const next = last ? Number(last.amountCents || 0) + AMOUNT_STEP : BASE_AMOUNT;
    if (next > currentAmount) { currentAmount = next; store.set(K.amount, String(currentAmount)); renderCheckout(); }
  }

  function clearIso() { if (isoPanel) isoPanel.innerHTML = `<h2>3 · Mensaje ISO8583</h2><div class="sub">Esperando una nueva operación.</div><div class="iso-empty">Realizá una compra para ver la autenticación 3-D Secure y el mensaje ISO 8583.</div>`; }
  function resetDemo() {
    if (busy) return;
    $$("#tdsScenarios .scenario").forEach((x) => x.classList.toggle("active", x.dataset.tds === "challenge"));
    $$("#authScenarios .scenario").forEach((x) => x.classList.toggle("active", x.dataset.code === "00"));
    amountUsed = false; currentTutorTransaction = null;
    const ev = $("#techEvents"); if (ev) ev.innerHTML = "";
    view("vwCheckout"); stage(null); paintIdle(); clearIso(); syncAmountWithHistory(); renderCheckout(); restoreHistory();
  }

  const sm = $("#stepMode");
  if (sm) { sm.checked = store.get(K.stepMode, "0") === "1"; sm.addEventListener("change", () => store.set(K.stepMode, sm.checked ? "1" : "0")); }
  sel?.addEventListener("change", () => { if (busy) return; view("vwCheckout"); stage(null); paintIdle(); clearIso(); renderCheckout(); renderScenarios(); });
  pay.addEventListener("click", runPurchase);
  $("#resetDemo")?.addEventListener("click", resetDemo);

  renderCheckout(); renderScenarios(); stage(null);
  const afterReady = () => { restoreHistory(); syncAmountWithHistory(); };
  (window.OSCSwitchStore?.ready || Promise.resolve()).then(afterReady, afterReady);
  window.addEventListener("osc-switch-updated", () => { if (!busy) restoreHistory(); });
})();
