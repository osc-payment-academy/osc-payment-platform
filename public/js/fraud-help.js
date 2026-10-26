/* OSC Payment Academy v4.0.0-rc.1.38 · Ayudas del Monitoreo en Vivo de Fraude
   - "🧭 Cómo funciona": diagrama Log ISO 8583 → Agente → Normalizador → Motor antifraude → Alertas.
   - "📋 Reglas": catálogo F01–F12 con explicación breve, score y estado (Habilitada / Pendiente + motivo).
     Marca "Disparando ahora" las reglas que aparecen en "Reglas activas" del panel en vivo.
   El catálogo vive en window.OSC_FRAUD_RULES (abajo): para cambiar un estado o un texto se edita solo esa lista. */
(function () {
  // Catálogo tomado de los agentes (OSC_Monitoreo_Fraude fraude-v1.8 · agentes-analisis-fraude analisis-fraude-v1.0)
  // y de config-fraude.txt. "param" = umbrales del en vivo (config-fraude.txt); el análisis diario usa los defaults del motor
  // salvo lo que fije config-analisis-fraude.txt.
  window.OSC_FRAUD_RULES = window.OSC_FRAUD_RULES || [
    { codigo: "F01", nombre: "Alta velocidad", que: "Muchas operaciones de la misma tarjeta en pocos minutos. Las consultas (DE3) no cuentan.", param: "5 operaciones en 2 min (FraudeVelOps / FraudeVelMin)", estado: "habilitada" },
    { codigo: "F02", nombre: "Rechazos consecutivos", que: "Varios rechazos seguidos: alguien prueba la tarjeta o el PIN.", param: "4 rechazos seguidos en 5 min (FraudeRechConsec / FraudeRechMin)", estado: "habilitada" },
    { codigo: "F03", nombre: "Rechazos → aprobación", que: "Una racha de rechazos que termina en una aprobación: probó hasta que pasó.", param: "3 rechazos y luego aprobación en 5 min (FraudeRechAprobRun / FraudeRechAprobMin)", estado: "habilitada" },
    { codigo: "F04", nombre: "Extracciones ATM consecutivas", que: "Extracciones de cajero una detrás de otra.", param: "3 extracciones en 10 min (FraudeATMConsec / FraudeATMMin)", estado: "habilitada" },
    { codigo: "F05", nombre: "Acumulación de efectivo ATM", que: "El efectivo retirado en la ventana supera el monto configurado.", param: "Monto ATM acumulado en 30 min > FraudeATMMontoUmbral (unidades del DE4)", estado: "habilitada" },
    { codigo: "F06", nombre: "Card testing / importes chicos", que: "Varias operaciones de importe bajo seguidas: típico de validar una tarjeta robada antes de usarla.", param: "5 operaciones bajo FraudeImporteBajo en 3 min (FraudeCardTestOps / FraudeCardTestMin)", estado: "habilitada" },
    { codigo: "F07", nombre: "Cambio de modo de entrada", que: "La misma tarjeta opera con modos de lectura distintos (chip, banda, manual, contactless) en poco tiempo (DE22).", param: "Ventana de 10 min (FraudeEntryMin)", estado: "habilitada" },
    { codigo: "F08", nombre: "Velocidad geográfica", que: "Operaciones presenciales en ciudades o países distintos en poco tiempo (DE43): un viaje imposible.", param: "Ventana y cantidad de ciudades/países: FraudeGeoVentanaMin · FraudeGeoCiudadesN · FraudeGeoPaisesN", diario: "En el análisis diario: 2+ ciudades dentro de la ventana = Medio; 2+ países en el día = Crítico.", estado: "habilitada" },
    { codigo: "F09", nombre: "Reservada", que: "Número reservado para una regla futura.", estado: "pendiente", motivo: "todavía no está implementada en el agente (fraude-v1.8 / analisis-fraude-v1.0)." },
    { codigo: "F10", nombre: "Consumo acelerado", que: "El monto de consumos en la ventana supera el umbral configurado.", param: "Monto en 15 min > FraudeConsumoUmbral (FraudeConsumoMin)", estado: "habilitada" },
    { codigo: "F11", nombre: "Intentos fallidos de PIN", que: "Rechazos por PIN repetidos (DE39 24, 38, 48, 55, 75).", param: "3 fallos en 10 min (FraudePinFallosN / FraudePinFallosMin)", estado: "habilitada" },
    { codigo: "F12", nombre: "Devoluciones sospechosas", que: "Muchas devoluciones o anulaciones de compra (74 / 72), o varias desde la misma terminal. No compara contra la compra original, que puede ser de días previos.", param: "3 en 30 min, o 2 de la misma terminal (FraudeDevolN / FraudeDevolMismoTerminal / FraudeDevolMin)", estado: "habilitada" },
  ];
  const MODE = (document.currentScript?.dataset?.mode || "live");

  const css = `
  .fh-overlay{position:fixed;inset:0;z-index:100000;display:none;place-items:center;background:rgba(3,10,20,.72);padding:18px}
  .fh-overlay.show{display:grid}
  .fh-modal{width:min(820px,100%);max-height:90vh;overflow:auto;background:#0b1a2b;border:1px solid #2a5a85;border-radius:16px;box-shadow:0 24px 70px #000a;color:#e8f1f8}
  .fh-head{position:sticky;top:0;display:flex;justify-content:space-between;align-items:center;padding:14px 18px;background:#0d2238;border-bottom:1px solid #22496c;z-index:1}
  .fh-head h3{margin:0;font-size:17px}.fh-x{border:0;background:transparent;color:#9fb6c8;font-size:24px;cursor:pointer}
  .fh-body{padding:16px 18px 20px}
  .fh-flow{display:grid;gap:0;max-width:560px;margin:0 auto}
  .fh-box{border-radius:14px;padding:14px 16px;text-align:center;color:#fff}
  .fh-box b{display:block;font-size:17px;letter-spacing:.02em}.fh-box span{display:block;font-size:13px;opacity:.92;margin-top:4px}
  .fh-box small{display:block;font-size:11.5px;opacity:.85;margin-top:6px;line-height:1.4}
  .fh-arrow{height:26px;display:grid;place-items:center;color:#7fb2d9;font-size:20px;line-height:1}
  .b1{background:#1a3d70}.b2{background:#2563a6}.b3{background:#2a6db5}.b4{background:#b8892a}.b5{background:#18705f}
  .fh-note{margin-top:14px;border:1px solid #2a5a85;background:#0f2a44;border-radius:10px;padding:10px 12px;font-size:12.5px;color:#cfe0ee}
  .fh-sum{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
  .fh-chip{border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;border:1px solid}
  .fh-chip.on{border-color:#1bbd74;color:#28e28d;background:#0b3a28}.fh-chip.pend{border-color:#d6a21e;color:#ffd166;background:#3a2f0b}.fh-chip.live{border-color:#e05a4c;color:#ff8a7d;background:#3a1410}
  .fh-rules{display:grid;gap:8px}
  .fh-rule{display:grid;grid-template-columns:62px 1fr auto;gap:12px;align-items:start;border:1px solid #22496c;border-radius:12px;padding:10px 12px;background:#0d2033}
  .fh-rule.pend{opacity:.72;border-style:dashed}
  .fh-code{font:800 15px Consolas,monospace;color:#7fd3ff}
  .fh-rule h4{margin:0;font-size:14px}.fh-rule p{margin:4px 0 0;font-size:12.5px;color:#c4d6e4;line-height:1.45}
  .fh-rule .prm{color:#9fc4e0;font-size:11.5px}.fh-rule .why{margin-top:5px;font-size:12px;color:#ffd166}
  .fh-tags{display:flex;flex-direction:column;gap:5px;align-items:flex-end}
  .fh-score{font:800 12px Consolas,monospace;border-radius:7px;padding:2px 8px;color:#071420}
  .sc-m{background:#f5b82e}.sc-a{background:#ff8c3a}.sc-c{background:#ff5d6c}.sc-v{background:#5d7a93;color:#fff}
  @media(max-width:640px){.fh-rule{grid-template-columns:1fr}.fh-tags{align-items:flex-start;flex-direction:row}}`;

  function ensure() {
    if (document.getElementById("fhOverlay")) return;
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    const o = document.createElement("div"); o.id = "fhOverlay"; o.className = "fh-overlay";
    o.innerHTML = `<section class="fh-modal" role="dialog" aria-modal="true" aria-labelledby="fhTitle"><div class="fh-head"><h3 id="fhTitle"></h3><button class="fh-x" type="button" aria-label="Cerrar">×</button></div><div class="fh-body" id="fhBody"></div></section>`;
    document.body.appendChild(o);
    o.querySelector(".fh-x").onclick = () => o.classList.remove("show");
    o.addEventListener("click", (e) => { if (e.target === o) o.classList.remove("show"); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") o.classList.remove("show"); });
  }
  function open(title, html) { ensure(); document.getElementById("fhTitle").textContent = title; document.getElementById("fhBody").innerHTML = html; document.getElementById("fhOverlay").classList.add("show"); }

  function flowHtml() {
    if (MODE === "daily") return dailyFlowHtml();
    const box = (cls, t, s, d) => `<div class="fh-box ${cls}"><b>${t}</b><span>${s}</span><small>${d}</small></div>`;
    const arrow = '<div class="fh-arrow">↓</div>';
    return `<div class="fh-flow">
      ${box("b1", "LOG ISO 8583", "Switch Emisor / Adquiriente", "El switch del banco escribe cada mensaje que procesa. El monitoreo no toca el switch: solo lee su log.")}${arrow}
      ${box("b2", "AGENTE", "Lectura incremental · demora ~3 s", "Programa instalado en el banco (OSC_Monitoreo_Fraude) que lee solo lo nuevo del log, casi en tiempo real.")}${arrow}
      ${box("b3", "NORMALIZADOR ISO 8583", "MTI · DE2 · DE3 · DE4 · DE39 · …", "Convierte cada trama en una operación: tarjeta enmascarada, tipo, importe, respuesta, canal y lugar.")}${arrow}
      ${box("b4", "MOTOR ANTIFRAUDE", "Reglas F01–F12 · ventanas temporales", "Evalúa cada tarjeta contra las reglas dentro de una ventana de tiempo y le asigna un Risk Score de 0 a 100.")}${arrow}
      ${box("b5", "ALERTAS Y DASHBOARD", "Riesgo · Evidencia · Transacciones", "Esta pantalla: semáforo por tarjeta, reglas que dispararon y las operaciones que lo justifican.")}
    </div>
    <div class="fh-note"><b>No bloquea operaciones.</b> El motor alerta y prioriza; la decisión la toma el analista. Las tarjetas se muestran siempre enmascaradas, nunca con el PAN completo.</div>`;
  }

  function dailyFlowHtml() {
    const box = (cls, t, s, d) => `<div class="fh-box ${cls}"><b>${t}</b><span>${s}</span><small>${d}</small></div>`;
    const arrow = '<div class="fh-arrow">↓</div>';
    return `<div class="fh-flow">
      ${box("b1", "LOG ISO 8583 DEL DÍA", "Switch Emisor / Adquiriente", "El archivo completo de la fecha elegida (por ejemplo TCPHandler.log.AAAA-MM-DD).")}${arrow}
      ${box("b2", "AGENTE DE ANÁLISIS", "Lectura completa · una sola pasada", "Programa instalado en el banco (OSC_Analisis_Fraude) que lee todo el día de una vez. El resultado queda guardado; «Reprocesar» lo vuelve a leer.")}${arrow}
      ${box("b3", "NORMALIZADOR ISO 8583", "MTI · DE2 · DE3 · DE4 · DE22 · DE39 · DE43 · …", "Convierte cada trama en una operación: tarjeta enmascarada, tipo, importe, modo de entrada, respuesta, canal y lugar.")}${arrow}
      ${box("b4", "MOTOR ANTIFRAUDE", "Mismas reglas que el en vivo · pico por tarjeta", "Evalúa cada tarjeta a lo largo del día y guarda su Risk Score más alto, aunque después se haya calmado.")}${arrow}
      ${box("b5", "DASHBOARD DIARIO", "Actividad por hora · reglas · tarjetas", "Esta pantalla: horas con picos de alerta, reglas disparadas en el día y detalle de cada tarjeta.")}
    </div>
    <div class="fh-note"><b>En vivo vs. diario:</b> el monitoreo en vivo mira una ventana móvil y avisa en el momento; el análisis diario revisa el día cerrado y no pierde lo que pasó aunque se haya calmado. Las tarjetas siempre se muestran enmascaradas.</div>`;
  }

  function liveCodes() {
    const txt = document.getElementById("reglas")?.innerText || "";
    return new Set((txt.match(/F\d{2}/g) || []));
  }
  function rulesHtml() {
    const R = window.OSC_FRAUD_RULES, live = liveCodes();
    const on = R.filter((r) => r.estado === "habilitada").length, pend = R.length - on;
    const scoreCls = (s) => (s >= 80 ? "sc-c" : s >= 60 ? "sc-a" : s >= 30 ? "sc-m" : "sc-v");
    return `<div class="fh-sum"><span class="fh-chip on">✓ ${on} habilitadas</span><span class="fh-chip pend">⏳ ${pend} ${pend === 1 ? "pendiente" : "pendientes"}</span>${live.size ? `<span class="fh-chip live">● ${live.size} ${MODE === "daily" ? "disparadas en el día" : "disparando ahora"}</span>` : ""}</div>
      <div class="fh-rules">${R.map((r) => `<div class="fh-rule${r.estado === "habilitada" ? "" : " pend"}">
        <div class="fh-code">${r.codigo}</div>
        <div><h4>${r.nombre}</h4><p>${r.que}</p>${MODE === "live" && r.param ? `<p class="prm">⚙ ${r.param}</p>` : ""}${MODE === "daily" && r.diario ? `<p class="prm">📅 ${r.diario}</p>` : ""}${r.estado !== "habilitada" && r.motivo ? `<div class="why">⏳ Pendiente: ${r.motivo}</div>` : ""}</div>
        <div class="fh-tags">${r.estado === "habilitada" ? '<span class="fh-chip on">Habilitada</span>' : '<span class="fh-chip pend">Pendiente</span>'}${live.has(r.codigo) ? '<span class="fh-chip live">' + (MODE === "daily" ? "● Disparó en el día" : "● Disparando") + '</span>' : ""}${r.score != null ? `<span class="fh-score ${scoreCls(r.score)}">score ${r.score}</span>` : ""}</div>
      </div>`).join("")}</div>
      <div class="fh-note">${MODE === "live" ? "Los umbrales (⚙) son los de <b>config-fraude.txt</b> del agente en vivo; se calibran con datos reales del banco." : "El análisis diario aplica las mismas reglas sobre el log completo del día y conserva el <b>pico de riesgo</b> de cada tarjeta. Sus umbrales salen de <b>config-analisis-fraude.txt</b> (y, si no están, de los valores por defecto del motor)."}</div>`;
  }

  function mount() {
    const tabs = document.getElementById("tabHist")?.parentElement || document.getElementById("btnCargar")?.parentElement;
    if (!tabs || document.getElementById("fhFlowBtn")) return;
    const mk = (id, label, fn) => { const b = document.createElement("button"); b.className = "btn"; b.id = id; b.type = "button"; b.textContent = label; b.onclick = fn; tabs.appendChild(b); };
    mk("fhFlowBtn", "🧭 Cómo funciona", () => open(MODE === "daily" ? "Cómo funciona el Análisis Diario de Fraude" : "Cómo funciona el Monitoreo en Vivo de Fraude", flowHtml()));
    mk("fhRulesBtn", "📋 Reglas", () => open("Reglas del motor antifraude", rulesHtml()));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
  window.OSCFraudHelp = { openFlow: () => open("Cómo funciona el Monitoreo en Vivo de Fraude", flowHtml()), openRules: () => open("Reglas del motor antifraude", rulesHtml()) };
})();
