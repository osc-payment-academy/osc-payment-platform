/* OSC Payment Academy · rc.1.63 · Fundamentos y Arquitectura — pantalla (Ciudad + Lección). */
import { World, ACTORS, PACKET } from "./engine.js?v=4.0.0-rc1.63";
import { BLOQUES, INDICE, LECCIONES } from "./lecciones.js?v=4.0.0-rc1.63";

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CITY = ["marca", "emisor", "adquirente", "comercio", "pos", "atm", "ecom", "compensacion", "liquidador", "switch_nac", "cliente", "wallet", "qr", "proc_adq", "proc_emi"];
const TOTAL = Object.keys(INDICE).length;

const ui = {
  stage: $("#stage"), panel: $("#side"), overlay: $("#overlay"), clock: $("#clock"), ficha: $("#ficha"),
  mode: $("#modeBtn"), prog: $("#progLabel"), crumb: $("#crumb"), note: $("#modeNote"),
};
let me = null, progress = {}, world, current = null, gen = 0, playing = false, stepMode = false, idx = 0, waitNext = null, quizState = null, speed = 1;

/* ---------- Datos del usuario ---------- */
async function loadMe() {
  try { me = window.OSCGetMe ? await window.OSCGetMe() : await fetch("/api/auth/me", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)); } catch (_) { me = null; }
}
const isAdmin = () => !me || me.user?.platform_role === "OSC_ADMIN";
function allowed(v) {
  if (isAdmin()) return true;
  if (v.product) return !!(me?.entitlements || {})[v.product];
  if (v.key) return (me?.moduleAccess?.enabled || []).includes(v.key);
  return true;
}
async function loadProgress() {
  try { const r = await fetch("/api/fundamentos/progress", { cache: "no-store" }); if (r.ok) progress = (await r.json()).lessons || {}; } catch (_) {}
}
function save(lesson, action, score) {
  const p = progress[lesson] || (progress[lesson] = {});
  if (action === "viewed") p.viewed = true;
  if (action === "quiz") { p.viewed = true; p.score = Math.max(p.score || 0, score); }
  renderProgress();
  fetch("/api/fundamentos/progress", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lesson, action, score }) }).catch(() => {});
}
const statusOf = (id) => { const p = progress[id]; if (!LECCIONES[id]) return "prep"; if (p && p.score != null) return "eval"; if (p && p.viewed) return "seen"; return "new"; };
const ICON = { new: "○", seen: "◐", eval: "✓", prep: "…" };
function renderProgress() {
  const done = Object.keys(INDICE).filter((id) => statusOf(id) === "eval").length;
  ui.prog.textContent = `${done} de ${TOTAL} lecciones evaluadas`;
}

function stepLabel(t) {
  const c = t.indexOf(":"); if (c > 0 && c <= 48) return t.slice(0, c);
  const d = t.search(/[.,;]/); if (d > 0 && d <= 60) return t.slice(0, d);
  return t.length <= 58 ? t : t.slice(0, t.lastIndexOf(" ", 56)) + "…";
}
/* ---------- Ciudad ---------- */
function cityView(blockId) {
  stop(); current = null; quizState = null; hideOverlay(); ui.clock.hidden = true; ui.ficha.hidden = true;
  world.reset(CITY);
  const tags = {};
  BLOQUES.forEach((b) => {
    const ready = b.lecciones.filter((id) => LECCIONES[id]).length, done = b.lecciones.filter((id) => statusOf(id) === "eval").length;
    tags[b.edificio] = `Bloque ${b.id} · ${done}/${b.lecciones.length}${ready && done === ready && ready === b.lecciones.length ? " · ✓ completo" : ready ? "" : " · próximamente"}`;
  });
  world.tag(tags);
  world.highlight(blockId ? [BLOQUES.find((b) => b.id === blockId).edificio] : BLOQUES.map((b) => b.edificio));
  world.camTo(blockId ? BLOQUES.find((b) => b.id === blockId).edificio : "overview");
  world.onPick = (id) => { const b = BLOQUES.find((x) => x.edificio === id); if (b) cityView(b.id); else showFicha(id, "Tocá un edificio iluminado para ver sus lecciones."); };
  ui.crumb.textContent = "Ciudad de Pagos";
  const blocks = blockId ? BLOQUES.filter((b) => b.id === blockId) : BLOQUES;
  ui.panel.innerHTML = `<div class="sec"><h2>${blockId ? "Bloque " + blockId : "Ciudad de Pagos"}</h2><p class="muted">${blockId ? "Elegí una lección." : "Cada edificio es un bloque del temario. Tocalo en la ciudad o elegí una lección de la lista."}</p>
    ${blockId ? `<button class="link" data-act="all">← Ver todos los bloques</button>` : ""}</div>
    ${blocks.map((b) => `<div class="sec blk"><h3><span class="bn">${b.id}</span>${esc(b.titulo)}</h3><ul class="lessons">${b.lecciones.map((id) => {
      const st = statusOf(id), i = INDICE[id];
      return `<li><button class="les ${st}" data-les="${id}" ${st === "prep" ? "disabled" : ""}><span class="st" title="${{ new: "No vista", seen: "Vista", eval: "Evaluada", prep: "En preparación" }[st]}">${ICON[st]}</span><span class="num">${id}</span><span class="tt">${esc(i.t)}${st === "prep" ? '<small>En preparación</small>' : i.tipo === "plataforma" ? '<small>Se practica en la plataforma</small>' : ""}</span></button></li>`;
    }).join("")}</ul></div>`).join("")}
    <div class="sec legend muted">○ no vista · ◐ vista · ✓ evaluada · … en preparación</div>`;
  ui.panel.querySelectorAll("[data-les]").forEach((b) => (b.onclick = () => openLesson(b.dataset.les)));
  const all = ui.panel.querySelector('[data-act="all"]'); if (all) all.onclick = () => cityView();
}

/* ---------- Lección ---------- */
function openLesson(id) {
  const L = LECCIONES[id]; if (!L) return;
  stop(); current = { id, L }; quizState = null; idx = 0; ui.ficha.hidden = true;
  world.onPick = (aid) => { if (quizState && quizState.tap) return answerTap(aid); showFicha(aid); };
  ui.crumb.innerHTML = `<button class="link" id="backCity">Ciudad de Pagos</button> › ${id}`;
  $("#backCity").onclick = () => cityView(BLOQUES.find((b) => b.lecciones.includes(id)).id);
  const I = INDICE[id], n = L.pasos.length;
  ui.panel.innerHTML = `<div class="sec"><div class="eyebrow">Lección ${id} · ${esc(L.dur)}</div><h2>${esc(I.t)}</h2><p class="muted">${esc(L.objetivo)}</p></div>
    <div class="sec ctrl">
      <div class="btns"><button id="bPlay" class="primary">▶ Reproducir</button><button id="bNext">Siguiente ›</button><button id="bRe" title="Repetir">↺</button></div>
      <label class="chk"><input type="checkbox" id="bStep"> Paso a paso</label>
      <label class="chk">Velocidad <select id="bSpeed"><option value="0.75">Lenta</option><option value="1" selected>Normal</option><option value="1.4">Rápida</option></select></label>
    </div>
    <div class="sec narr"><div class="stepno" id="stepNo">Paso 0 de ${n}</div><p id="narr">Tocá ▶ Reproducir. Podés tocar cualquier edificio para ver su ficha.</p></div>
    <div class="sec"><ol class="steps" id="steps">${L.pasos.map((p, i) => `<li><button data-step="${i}">${esc(stepLabel(p.n))}</button></li>`).join("")}</ol></div>
    <div id="after"></div>`;
  $("#bPlay").onclick = () => (playing ? pause() : play());
  $("#bNext").onclick = () => { if (waitNext) { const w = waitNext; waitNext = null; w(); } else if (!playing) { playFrom(Math.min(idx, n - 1), true); } };
  $("#bRe").onclick = () => playFrom(0, false);
  $("#bStep").onchange = (e) => (stepMode = e.target.checked);
  $("#bSpeed").onchange = (e) => { speed = +e.target.value; world.speed = speed; };
  $("#steps").querySelectorAll("[data-step]").forEach((b) => (b.onclick = () => playFrom(+b.dataset.step, !playing)));
  stepMode = false; speed = 1; world.speed = 1;
  prepare(0);
  world.camTo("overview", true);
  renderAfter(false);
}
function prepare(upto) {
  // Reconstruye la escena hasta antes del paso `upto` (actores visibles y posiciones), sin animar.
  const L = current.L;
  world.clearPackets(); world.reset(L.actores);
  for (let i = 0; i < upto; i++) {
    const p = L.pasos[i];
    if (p.s) world.show(p.s); if (p.x) world.hide(p.x);
    if (p.m) p.m.forEach(([id, to]) => (world.s.pos[id] = to.slice()));
  }
  world.highlight(null); world.tag({}); hideOverlay(); ui.clock.hidden = true;
}
function stop() { gen++; playing = false; if (waitNext) { const w = waitNext; waitNext = null; w(); } if (world) world.clearPackets(); setPlayBtn(); }
function pause() { gen++; playing = false; world.clearPackets(); setPlayBtn(); }
function play() { const n = current.L.pasos.length; playFrom(idx >= n ? 0 : idx, false); }
function setPlayBtn() { const b = $("#bPlay"); if (b) b.textContent = playing ? "⏸ Pausa" : idx > 0 && idx < (current?.L.pasos.length || 0) ? "▶ Continuar" : "▶ Reproducir"; }
async function playFrom(start, single) {
  const g = ++gen; if (waitNext) { const w = waitNext; waitNext = null; w(); }
  prepare(start); playing = !single; setPlayBtn();
  const L = current.L;
  for (let i = start; i < L.pasos.length; i++) {
    if (g !== gen) return;
    idx = i; await runStep(L.pasos[i], i, g);
    if (g !== gen) return;
    idx = i + 1;
    if (i === L.pasos.length - 1) { finish(); return; }
    if (single) { playing = false; setPlayBtn(); return; }
    if (stepMode) { await new Promise((r) => (waitNext = r)); if (g !== gen) return; }
  }
}
async function runStep(p, i, g) {
  const L = current.L;
  $("#stepNo").textContent = `Paso ${i + 1} de ${L.pasos.length}`;
  $("#narr").textContent = p.n;
  document.querySelectorAll("#steps button").forEach((b, j) => { b.classList.toggle("on", j === i); b.classList.toggle("done", j < i); });
  const cur = document.querySelector("#steps button.on"); if (cur) cur.scrollIntoView({ block: "nearest" });
  if (p.s) world.show(p.s); if (p.x) world.hide(p.x);
  world.highlight(p.h && p.h.length ? p.h : null); world.tag(p.t || {});
  if (p.k) { ui.clock.hidden = false; ui.clock.textContent = "🕒 " + p.k; } else ui.clock.hidden = true;
  if (p.panel) showOverlay(p.panel); else hideOverlay();
  const t0 = performance.now();
  const moves = (p.m || []).map(([id, to]) => world.move(id, to));
  const cam = typeof p.c === "string" && p.c !== "overview" && p.h && p.h.length > 1 && p.h.includes(p.c) ? p.h : p.c || "overview";
  await Promise.all([world.camTo(cam), ...moves]);
  if (g !== gen) return;
  if (p.p) await world.packet(p.p[0], p.p[1]);
  if (p.pp) for (const [r, k] of p.pp) { if (g !== gen) return; await world.packet(r, k); }
  if (p.pa) await Promise.all(p.pa.map(([r, k]) => world.packet(r, k)));
  if (g !== gen) return;
  const words = p.n.split(/\s+/).length, read = Math.max(3200, words * 290 + (p.panel ? 2500 : 0)) / speed;
  const left = read - (performance.now() - t0);
  if (left > 0 && !stepMode) await sleep(left);
}
function finish() {
  playing = false; setPlayBtn();
  document.querySelectorAll("#steps button").forEach((b) => { b.classList.remove("on"); b.classList.add("done"); });
  if (!progress[current.id]?.viewed) save(current.id, "viewed");
  renderAfter(true);
}
function renderAfter(open) {
  const L = current.L, box = $("#after"); if (!box) return;
  const velo = (L.velo || []).filter(allowed);
  box.innerHTML = `<details class="sec" ${open ? "open" : ""}><summary>Decisiones para Tecnología</summary><ul class="dec">${L.decisiones.map((d) => `<li>${esc(d)}</li>`).join("")}</ul></details>
    <div class="sec"><button class="primary wide" id="bQuiz">📝 Autoevaluación (${L.quiz.length} preguntas)</button>${progress[current.id]?.score != null ? `<p class="muted small">Tu mejor resultado: ${progress[current.id].score} de ${L.quiz.length}</p>` : ""}</div>
    ${velo.length ? `<div class="sec"><h3>Velo en la plataforma</h3>${velo.map((v) => `<a class="velo" href="${v.href}">${esc(v.t)} →</a>${v.nota ? `<p class="muted small">${esc(v.nota)}</p>` : ""}`).join("")}</div>` : ""}
    ${L.verificar && isAdmin() ? `<div class="sec warn small">⚠ Solo administración · verificar antes de publicar: ${esc(L.verificar)}</div>` : ""}`;
  $("#bQuiz").onclick = startQuiz;
}

/* ---------- Autoevaluación ---------- */
function startQuiz() {
  stop(); prepare(current.L.pasos.length); world.camTo("overview");
  quizState = { i: 0, ok: 0 }; askQuestion();
}
function askQuestion() {
  const L = current.L, q = L.quiz[quizState.i], box = $("#after");
  quizState.tap = q.tap || null; world.highlight(null); world.tag({});
  const opts = q.tap ? [...world.s.visible].map((id) => [id, ACTORS[id].n]) : q.o.map((o, j) => [j, o]);
  box.innerHTML = `<div class="sec quiz"><div class="eyebrow">Pregunta ${quizState.i + 1} de ${L.quiz.length}</div><p class="q">${esc(q.q)}</p>
    ${q.tap ? `<p class="muted small">Tocalo en la escena o elegilo de la lista:</p>` : ""}
    <div class="opts">${opts.map(([v, t]) => `<button data-v="${v}">${esc(t)}</button>`).join("")}</div><div id="fb"></div></div>`;
  box.querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => (q.tap ? answerTap(b.dataset.v) : answer(+b.dataset.v))));
  box.scrollIntoView({ block: "nearest" });
}
function grade(ok, correctText) {
  const box = $("#after"); if (ok) quizState.ok++;
  box.querySelectorAll(".opts button").forEach((b) => (b.disabled = true));
  $("#fb").innerHTML = `<p class="${ok ? "good" : "bad"}">${ok ? "¡Correcto!" : "No es esa. La respuesta es: " + esc(correctText)}</p><button class="primary" id="bQn">${quizState.i + 1 < current.L.quiz.length ? "Siguiente pregunta ›" : "Ver resultado"}</button>`;
  $("#bQn").onclick = () => { quizState.i++; if (quizState.i < current.L.quiz.length) askQuestion(); else endQuiz(); };
}
function answer(j) { const q = current.L.quiz[quizState.i]; const b = $(`#after [data-v="${j}"]`); if (b) b.classList.add(j === q.a ? "ok" : "ko"); grade(j === q.a, q.o[q.a]); }
function answerTap(id) {
  if (!quizState || !quizState.tap || $("#fb").innerHTML) return;
  const want = quizState.tap; world.highlight([want]); world.tag({ [want]: "✓ respuesta" });
  const b = $(`#after [data-v="${id}"]`); if (b) b.classList.add(id === want ? "ok" : "ko");
  quizState.tap = null; grade(id === want, ACTORS[want].n);
}
function endQuiz() {
  const L = current.L, n = L.quiz.length, ok = quizState.ok; quizState = null;
  save(current.id, "quiz", ok);
  const next = nextLesson(current.id);
  $("#after").innerHTML = `<div class="sec quiz"><h3>Resultado: ${ok} de ${n}</h3><p class="muted">${ok === n ? "¡Excelente! Lección evaluada." : "Lección evaluada. Podés repetir la escena o la autoevaluación cuando quieras."}</p>
    <div class="btns">${next ? `<button class="primary" id="bNextL">Siguiente lección: ${next} ›</button>` : ""}<button id="bAgain">Repetir autoevaluación</button><button id="bCity">Volver a la ciudad</button></div></div>`;
  if (next) $("#bNextL").onclick = () => openLesson(next);
  $("#bAgain").onclick = startQuiz;
  $("#bCity").onclick = () => cityView(BLOQUES.find((b) => b.lecciones.includes(current.id)).id);
}
function nextLesson(id) { const all = BLOQUES.flatMap((b) => b.lecciones).filter((x) => LECCIONES[x]); const i = all.indexOf(id); return all[i + 1] || null; }

/* ---------- Paneles ---------- */
function showOverlay(p) { ui.overlay.innerHTML = `<button class="ov-x" aria-label="Ocultar">✕</button><h3>${esc(p.t)}</h3>${p.h}`; ui.overlay.hidden = false; ui.overlay.querySelector(".ov-x").onclick = hideOverlay; }
function hideOverlay() { ui.overlay.hidden = true; ui.overlay.innerHTML = ""; }
function showFicha(id, extra) {
  const a = ACTORS[id]; if (!a) return;
  const txt = (current && current.L.fichas && current.L.fichas[id]) || extra || "";
  ui.ficha.innerHTML = `<button class="ov-x" aria-label="Cerrar">✕</button><b>${esc(a.n)}</b>${txt ? `<p>${esc(txt)}</p>` : ""}`;
  ui.ficha.hidden = false; ui.ficha.querySelector(".ov-x").onclick = () => (ui.ficha.hidden = true);
  clearTimeout(showFicha.t); showFicha.t = setTimeout(() => (ui.ficha.hidden = true), 7000);
}

/* ---------- Modo 3D / 2D ---------- */
async function setMode(m) {
  const got = await world.setMode(m);
  try { localStorage.setItem("oscFundMode", got); } catch (_) {}
  ui.mode.textContent = got === "3d" ? "Ver en 2D" : "Ver en 3D";
  ui.note.hidden = !(m === "3d" && got === "2d");
  if (m === "3d" && got === "2d") ui.note.textContent = "Tu equipo no admite 3D: se muestra la versión 2D, con la misma secuencia y narración.";
  return got;
}

/* ---------- Inicio ---------- */
(async function init() {
  world = new World(ui.stage);
  world.onSlow = () => { if (world.mode === "3d") { setMode("2d"); ui.note.hidden = false; ui.note.textContent = "El 3D iba lento en este equipo: pasamos a la versión 2D. Podés volver con «Ver en 3D»."; } };
  let pref = "3d"; try { pref = localStorage.getItem("oscFundMode") || "3d"; } catch (_) {}
  await setMode(pref);
  ui.mode.onclick = () => setMode(world.mode === "3d" ? "2d" : "3d");
  await Promise.all([loadMe(), loadProgress()]);
  renderProgress();
  const q = new URLSearchParams(location.search).get("leccion");
  if (q && LECCIONES[q]) openLesson(q); else cityView();
  ui.legend && (ui.legend.innerHTML = Object.values(PACKET).map((p) => `<span><i style="background:${p.css}"></i>${p.t}</span>`).join(""));
})();
