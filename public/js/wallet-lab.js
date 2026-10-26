/* OSC Payment Academy v4.0.0-rc.1.32 · Simulador Wallet
   - Alta de la tarjeta (provisioning, pasos 1-3) separada del pago (pasos 4-8).
   - Detokenización visible en Marca / Red y resultado en el teléfono.
   - Modo paso a paso: el paso 4 muestra la solicitud y el 7 la respuesta, con los DE de wallet resaltados.
   - Monto incremental: se aplica al iniciar la nueva compra, no al terminar la anterior.
   - Perfil de comercio (Buenos Aires · ARS / Guayaquil · USD) y "Reiniciar demo" (no borra datos del Switch). */
(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const store = {
    get(k, d) { try { const v = sessionStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (_) {} },
  };
  const BASE_AMOUNT = 250000, AMOUNT_STEP = 5000, AUTO_DELAY = 700;
  const K = { amount: "osc_wallet_next_amount", prov: "osc_wallet_provisioned", since: "osc_wallet_hist_since", profile: "osc_wallet_profile", stepMode: "osc_wallet_step_mode" };
  const NAMES = { visa: "VISA", mastercard: "Mastercard", amex: "AMEX" };
  const TSP = { visa: "Visa Token Service (VTS)", mastercard: "Mastercard Digital Enablement Service (MDES)", amex: "American Express Token Service" };
  // Escenarios: código ISO (Visa/Mastercard) y Action Code Amex (mismo mapeo que rc.1.22).
  const SCN = {
    "00": { text: "Aprobada", amex: "000" },
    "51": { text: "Fondos insuficientes", amex: "116" },
    "05": { text: "No honrar", amex: "100" },
    "14": { text: "Tarjeta inválida", amex: "111" },
  };
  const AMEX_TEXT = { "000": "Aprobada", "116": "Fondos insuficientes", "100": "Denegada", "111": "Cuenta inválida" };
  const HL = { request: [2, 22, 55], response: [38, 39, 55] };

  const steps = $$(".flow .step");
  const pay = $("#pay"), prov = $("#provision"), hist = $("#hist"), nextBtn = $("#nextStep");
  const isoPanel = $(".workspace .panel:nth-child(3)");
  steps.forEach((s) => { const sm = s.querySelector("small"); if (sm) sm.dataset.orig = sm.textContent; });

  let currentAmount = Number(store.get(K.amount, BASE_AMOUNT)) || BASE_AMOUNT;
  let amountUsed = false;
  let provisioned = {};
  try { provisioned = JSON.parse(store.get(K.prov, "{}")) || {}; } catch (_) { provisioned = {}; }
  let busy = false, currentTutorTransaction = null;

  const CRED = () => window.OSCModernIso.CRED;
  const network = () => {
    const n = ($(".wallet-card:not([hidden])")?.dataset.network || "VISA").toLowerCase();
    return n.startsWith("master") ? "mastercard" : n === "amex" ? "amex" : "visa";
  };
  const last4 = (n) => { const c = CRED()[n]; return { fpan: c.pan.slice(-4), dpan: c.token.slice(-4) }; };
  const profileKey = () => $("#merchantProfile")?.value || "AR";
  const profile = () => window.OSCIsoSpec?.ACQ_PROFILES?.[profileKey()] || { currencyAlpha: "ARS", cityLabel: "Buenos Aires, ARG" };
  const money = (c) => (c / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const stepMode = () => !!$("#stepMode")?.checked;

  window.OSCTutorContext = () => ({ module: "wallet", channel: "WALLET", brand: network().toUpperCase(), transaction: currentTutorTransaction });

  /* ---------- Teléfono ---------- */
  function renderCards() {
    $$(".wallet-card").forEach((card) => {
      const raw = (card.dataset.network || "").toLowerCase();
      const n = raw.startsWith("master") ? "mastercard" : raw === "amex" ? "amex" : "visa";
      const l = last4(n), ok = !!provisioned[n];
      card.innerHTML = `<b>${NAMES[n]}</b><div>•••• &nbsp;•••• &nbsp;${l.fpan}</div><small>${ok ? "✓ Token •••• " + l.dpan + " (DPAN)" : "Sin token · agregala a la wallet"}</small>`;
      card.classList.toggle("no-token", !ok);
    });
  }
  function renderPhone() {
    const n = network(), l = last4(n), ok = !!provisioned[n], p = profile();
    renderCards();
    const merchant = $(".merchant small"); if (merchant) merchant.textContent = p.cityLabel;
    const amt = $(".amount strong"); if (amt) amt.textContent = (p.currencyAlpha === "USD" ? "US$ " : "$ ") + money(currentAmount);
    const cur = $$(".amount small")[1]; if (cur) cur.textContent = p.currencyAlpha + " · Compra presencial";
    pay.hidden = !ok; prov.hidden = ok;
    const hint = $(".phone .hint"); if (hint) hint.textContent = ok ? "Acercá tu teléfono al POS" : "Primero se genera el token (pasos 1-3)";
    $(".device-status").innerHTML = `Dispositivo: OSC-PHONE-01 &nbsp;|&nbsp; Tarjeta: •••• ${l.fpan} &nbsp;|&nbsp; Token: ${ok ? "•••• " + l.dpan : "—"}<br>` +
      (ok ? "<b>✓ Token activo (DPAN) · Listo para pagar con NFC</b>" : '<b class="warn">Sin token en este dispositivo · tocá «Agregar a la wallet»</b>');
    const phaseA = $('.phase[data-phase="A"]');
    if (phaseA) phaseA.innerHTML = "A · Alta de la tarjeta <small>(una sola vez)</small>" + (ok ? ' <span class="ok">✓ hecha</span>' : "");
  }
  function paintIdle() {
    const ok = !!provisioned[network()];
    steps.forEach((s, i) => {
      s.classList.remove("run", "done");
      s.classList.toggle("past", i < 3 && ok);
      const sm = s.querySelector("small"); if (sm && sm.dataset.orig) sm.textContent = sm.dataset.orig;
      const em = s.querySelector("em"); if (em) em.textContent = i < 3 && ok ? "✓" : "○";
    });
  }
  function clearResult() { const r = $("#phoneResult"); if (r) { r.hidden = true; r.innerHTML = ""; } }
  function showResult(tx, n) {
    const r = $("#phoneResult"); if (!r) return;
    const okTx = tx.approved;
    const code = n === "amex" ? (okTx ? "000" : tx.code) : (okTx ? "00" : tx.code);
    const label = n === "amex" ? (AMEX_TEXT[code] || "Rechazada") : (SCN[code]?.text || "Rechazada");
    r.className = "phone-result " + (okTx ? "ok" : "ko");
    r.innerHTML = `<div class="ico">${okTx ? "✓" : "✗"}</div><b>${okTx ? "Pago aprobado" : "Pago rechazado"}</b>` +
      `<span>${(profile().currencyAlpha === "USD" ? "US$ " : "$ ") + money(tx.amountCents)}</span>` +
      `<small>${n === "amex" ? "Action Code" : "DE 39"} ${code} · ${label}${okTx && tx.auth ? " · Aut. " + tx.auth : ""}</small>` +
      `<button type="button" id="closeResult">Nueva compra</button>`;
    r.hidden = false;
    $("#closeResult").onclick = () => { clearResult(); if (amountUsed) { currentAmount += AMOUNT_STEP; amountUsed = false; renderPhone(); } };
  }

  /* ---------- Escenarios ---------- */
  $$(".scenarios .scenario").forEach((b) => {
    b.dataset.code = b.dataset.code || b.textContent.trim().slice(0, 2);
    b.addEventListener("click", () => { if (busy) return; $$(".scenarios .scenario").forEach((x) => x.classList.remove("active")); b.classList.add("active"); });
  });
  function renderScenarios() {
    const amex = network() === "amex";
    $$(".scenarios .scenario").forEach((b) => {
      const k = b.dataset.code;
      b.innerHTML = `${k} · ${SCN[k].text}` + (amex ? ` <span class="amex-code">Amex ${SCN[k].amex}</span>` : "");
    });
  }
  function scenarioCode(n) {
    const k = $(".scenarios .scenario.active")?.dataset.code || "00";
    return n === "amex" ? SCN[k].amex : k;
  }

  /* ---------- Panel 3 ---------- */
  function clearIso(msg) {
    if (!isoPanel) return;
    isoPanel.innerHTML = `<h2>3 · Mensaje ISO8583</h2><div class="sub">Esperando una nueva operación.</div><div class="iso-empty">${msg || "Realizá una operación para visualizar MTI, Bitmap y Data Elements."}</div>`;
  }
  function showProvisionInfo(n, stage) {
    if (!isoPanel) return;
    const l = last4(n);
    const rows = [
      ["Wallet / Token Requestor", `El teléfono envía la tarjeta •••• ${l.fpan} (FPAN) y los datos del dispositivo OSC-PHONE-01 al TSP.`],
      [`TSP · ${TSP[n]}`, `Genera el token •••• ${l.dpan} (DPAN) y guarda en su bóveda el vínculo DPAN ↔ FPAN ↔ dispositivo.`],
      ["Emisor · Verificación", "Aprueba el alta (ID&V). Puede pedir un código por SMS o la app del banco."],
      ["Resultado", "Token activo en el teléfono. Desde ahora cada compra viaja con el DPAN; el FPAN queda en la bóveda del TSP y en el emisor."],
    ];
    isoPanel.innerHTML = `<h2>3 · Alta del token (provisioning)</h2>
      <div class="sub">${NAMES[n]} · ${TSP[n]} · el alta no genera un mensaje de compra ISO 8583</div>
      <div class="prov-map"><div class="cred fpan"><small>Tarjeta real (FPAN)</small><b>•••• ${l.fpan}</b></div><span class="arrow">→</span>
      <div class="cred dpan${stage >= 1 ? " on" : ""}"><small>Token del teléfono (DPAN)</small><b>${stage >= 1 ? "•••• " + l.dpan : "…"}</b></div></div>
      <ol class="prov-steps">${rows.map((r, i) => `<li class="${i <= stage ? "on" : ""}"><b>${r[0]}</b><span>${r[1]}</span></li>`).join("")}</ol>`;
  }

  /* ---------- Motor de pasos ---------- */
  function wait(label) {
    if (!stepMode()) return new Promise((r) => setTimeout(r, AUTO_DELAY));
    return new Promise((r) => {
      nextBtn.hidden = false; nextBtn.disabled = false; nextBtn.textContent = "Siguiente › " + label;
      nextBtn.onclick = () => { nextBtn.disabled = true; r(); };
    });
  }
  async function runSteps(indexes, onEnter) {
    for (let k = 0; k < indexes.length; k++) {
      const i = indexes[k];
      steps[i].classList.remove("past");
      steps[i].classList.add("run");
      await onEnter?.(i);
      const next = indexes[k + 1];
      await wait(next != null ? "(paso " + (next + 1) + ")" : "(terminar)");
      steps[i].classList.remove("run");
      steps[i].classList.add("done");
      const em = steps[i].querySelector("em"); if (em) em.textContent = "✓";
    }
    nextBtn.hidden = true;
  }
  function lock(on) {
    busy = on; pay.disabled = on; prov.disabled = on;
    $$(".card-arrow, #merchantProfile, #resetDemo").forEach((b) => (b.disabled = on));
  }

  /* ---------- Alta (pasos 1-3) ---------- */
  async function runProvision() {
    if (busy) return;
    const n = network();
    lock(true); clearResult();
    steps.forEach((s) => s.classList.remove("run", "done", "past"));
    await runSteps([0, 1, 2], (i) => showProvisionInfo(n, i));
    provisioned[n] = true;
    store.set(K.prov, JSON.stringify(provisioned));
    showProvisionInfo(n, 3);
    lock(false);
    renderPhone();
    steps.forEach((s, i) => { if (i < 3) { s.classList.remove("done"); s.classList.add("past"); const em = s.querySelector("em"); if (em) em.textContent = "✓"; } });
  }

  /* ---------- Pago (pasos 4-8) ---------- */
  async function runPay() {
    if (busy) return;
    const n = network();
    if (!provisioned[n]) return;
    if (amountUsed) { currentAmount += AMOUNT_STEP; amountUsed = false; }
    lock(true); clearResult(); paintIdle(); renderPhone();
    const tx = window.OSCModernIso.build("WALLET", n, currentAmount, scenarioCode(n), { profile: profileKey() });
    window.OSCModernLastTx = tx;
    clearIso("Procesando el pago…");
    let view = null;
    await runSteps([3, 4, 5, 6, 7], (i) => {
      if (i === 3) view = window.OSCModernIso.render(isoPanel, tx, "Compra Wallet NFC con token", { side: "request", highlight: HL });
      if (i === 5) { const sm = steps[5].querySelector("small"); if (sm) sm.textContent = `Detokeniza: token •••• ${tx.tokenLast4} → tarjeta •••• ${tx.fpanLast4}`; }
      if (i === 6) view?.show("response");
      if (i === 7) showResult(tx, n);
    });
    amountUsed = true;
    store.set(K.amount, String(currentAmount + AMOUNT_STEP)); // al recargar, la próxima prueba arranca con otro monto
    await persist(tx, n);
    lock(false);
  }

  async function persist(tx, n) {
    const label = "Compra Wallet NFC con token";
    const S = window.OSCSwitchStore;
    if (S) {
      try {
        await S.ready;
        const createdAt = new Date().toISOString();
        S.addTransaction({
          id: "wallet-" + Date.now(), channel: "WALLET", network: n.toUpperCase(), type: "purchase", amountCents: tx.amountCents,
          currency: tx.currency === "840" ? "USD" : "ARS", status: tx.approved ? "APPROVED" : "DECLINED",
          responseCode: tx.approved ? (n === "amex" ? "000" : "00") : tx.code, stan: tx.stan,
          rrn: (tx.request.fields.find((f) => f[0] === "37") || [])[2] || String(Date.now()).slice(-12), auth: tx.auth || "",
          closed: false, clearingStatus: tx.approved ? "PENDING" : "NOT_APPLICABLE", onlineStatus: "ROUTED",
          mtiRequest: tx.request.mti, mtiResponse: tx.response.mti, panLast4: tx.tokenLast4,
          cardId: "WALLET_" + n.toUpperCase(), product: label, raw: tx.request.mti + tx.request.bitmap,
          requestFields: window.OSCModernIso.toObj(tx.request.fields), responseFields: window.OSCModernIso.toObj(tx.response.fields),
          operationLabel: label, dateTime: createdAt, createdAt,
        });
        await S.flush();
      } catch (e) { console.warn("Switch store", e); }
    }
    currentTutorTransaction = {
      operation: label, amountCents: tx.amountCents, result: tx.approved ? "Aprobada" : "Rechazada", scenario: tx.code, eventType: "TRANSACTION_RESPONSE",
      stagesReached: steps.map((s) => s.querySelector("b")?.textContent || ""),
      token: { dpanLast4: tx.tokenLast4, fpanLast4: tx.fpanLast4 },
      request: { mti: tx.request.mti, bitmap: tx.request.bitmap, fields: tx.request.fields.map((f) => [f[0], f[1], f[2]]) },
      response: { mti: tx.response.mti, bitmap: tx.response.bitmap, fields: tx.response.fields.map((f) => [f[0], f[1], f[2]]) },
    };
    restoreHistory();
  }

  /* ---------- Historial ---------- */
  function txRow(tx, selected) {
    const d = new Date(tx.createdAt || tx.dateTime || Date.now());
    const t = Number.isNaN(d.getTime()) ? new Date() : d;
    const token = tx.tokenLast4 || tx.panLast4 || "—";
    const netKey = String(tx.network || "").toLowerCase().startsWith("master") ? "mastercard" : String(tx.network || "").toLowerCase();
    if (!tx.fpanLast4 && CRED()[netKey]) tx = { ...tx, fpanLast4: CRED()[netKey].pan.slice(-4) };
    const detail = `${tx.network || "VISA"} · token •••• ${token}${tx.fpanLast4 ? " (tarjeta •••• " + tx.fpanLast4 + ")" : ""}`;
    const amount = (tx.currency === "USD" ? "USD " : "ARS ") + (Number(tx.amountCents || 0) / 100).toLocaleString("es-AR", { minimumFractionDigits: 2 });
    const declined = tx.status === "DECLINED";
    return `<tr${selected ? ' class="selected"' : ""}><td>${t.toLocaleDateString("es-AR")}</td><td>${t.toLocaleTimeString("es-AR", { hour12: false })}</td><td>${tx.operationLabel || tx.type}</td><td>${detail}</td><td>${amount}</td><td>${tx.mtiRequest} / ${tx.mtiResponse}</td><td class="${declined ? "" : "ok"}">${declined ? "✗ Rechazada " + (tx.responseCode || "") : "✓ Aprobada"}</td></tr>`;
  }
  function restoreHistory() {
    const since = store.get(K.since, "");
    const db = window.OSCSwitchStore?.read?.();
    const rows = (db?.transactions || []).filter((t) => t.channel === "WALLET" && (!since || String(t.createdAt || t.dateTime || "") >= since)).slice(0, 20);
    hist.innerHTML = rows.length ? rows.map((t, i) => txRow(t, i === 0)).join("") : '<tr><td colspan="7" class="sub">Sin operaciones nuevas.</td></tr>';
    const c = $("#histCount"); if (c) c.textContent = rows.length ? `(${rows.length})` : "";
  }

  /* ---------- Reinicio y eventos ---------- */
  function resetDemo() {
    if (busy) return;
    provisioned = {}; store.set(K.prov, "{}");
    currentAmount = BASE_AMOUNT; amountUsed = false; store.set(K.amount, String(BASE_AMOUNT));
    store.set(K.since, new Date().toISOString());
    $$(".scenarios .scenario").forEach((x) => x.classList.toggle("active", x.dataset.code === "00"));
    currentTutorTransaction = null;
    const ev = $("#techEvents"); if (ev) ev.innerHTML = "";
    clearResult(); clearIso(); renderPhone(); paintIdle(); restoreHistory();
  }
  function onCardChange() { if (busy) return; clearResult(); clearIso(); renderPhone(); renderScenarios(); paintIdle(); }

  const profSel = $("#merchantProfile");
  if (profSel) {
    profSel.value = store.get(K.profile, "AR");
    profSel.addEventListener("change", () => { store.set(K.profile, profSel.value); clearResult(); clearIso(); renderPhone(); });
  }
  const sm = $("#stepMode");
  if (sm) { sm.checked = store.get(K.stepMode, "0") === "1"; sm.addEventListener("change", () => store.set(K.stepMode, sm.checked ? "1" : "0")); }
  prov.addEventListener("click", runProvision);
  pay.addEventListener("click", runPay);
  $("#resetDemo")?.addEventListener("click", resetDemo);
  new MutationObserver(onCardChange).observe($(".card-carousel"), { attributes: true, attributeFilter: ["hidden"], subtree: true });

  clearIso(); renderPhone(); renderScenarios(); paintIdle();
  (window.OSCSwitchStore?.ready || Promise.resolve()).then(restoreHistory, restoreHistory);
})();
