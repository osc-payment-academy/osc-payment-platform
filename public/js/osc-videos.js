/* rc.1.61 · Videos de ayuda. rc.1.62 · Listas por pantalla (POS).
   Para sumar un video: agregar una entrada a OSC_VIDEOS, copiar los archivos a public/media/videos/
   y agregar el id en VIDEO_IDS de src/index.js (el servidor solo acepta ids conocidos).
   grupo     → "inicio" (botón del banner del Dashboard) o el nombre de una lista (p. ej. "pos").
               En la página, la lista aparece donde haya un elemento <span data-osc-videos="pos"></span>.
   bienvenida:true → se abre solo en el primer ingreso al Dashboard (uno solo a la vez).
   El orden de la lista es el orden de este arreglo. */
const OSC_VIDEOS = [
  { id: "plataforma", grupo: "inicio", titulo: "Recorrido de la plataforma", duracion: "1:50",
    src: "/media/videos/plataforma.mp4", poster: "/media/videos/plataforma-poster.jpg",
    subtitulos: null, bienvenida: true, boton: "▶ Ver recorrido de la plataforma" },
  { id: "pos-pantalla", grupo: "pos", titulo: "La pantalla del POS", duracion: "3:27",
    src: "/media/videos/pos-pantalla.mp4", poster: "/media/videos/pos-pantalla-poster.jpg", subtitulos: null },
  { id: "pos-credito-chip", grupo: "pos", titulo: "Compra de crédito con chip", duracion: "2:44",
    src: "/media/videos/pos-credito-chip.mp4", poster: "/media/videos/pos-credito-chip-poster.jpg", subtitulos: null },
  { id: "pos-credito-chip-rechazada", grupo: "pos", titulo: "Compra de crédito con chip · rechazada", duracion: "2:21",
    src: "/media/videos/pos-credito-chip-rechazada.mp4", poster: "/media/videos/pos-credito-chip-rechazada-poster.jpg", subtitulos: null },
  { id: "pos-qr", grupo: "pos", titulo: "Compra con QR", duracion: "2:06",
    src: "/media/videos/pos-qr.mp4", poster: "/media/videos/pos-qr-poster.jpg", subtitulos: null }
];
const OSC_VIDEO_GROUPS = { pos: "Videos del POS" };

(function () {
  const css = `
.osc-video-btn{display:inline-flex;flex-direction:column;justify-content:center;gap:2px;padding:10px 16px;border:1px solid #2f83ff;border-radius:12px;background:#04214acc;color:#fff;font:inherit;cursor:pointer;min-width:240px;text-align:left}
.osc-video-btn:hover{background:#12355a}.osc-video-btn small{color:#9fd0ff;font-size:.58rem;letter-spacing:.06em;text-transform:uppercase}.osc-video-btn b{font-size:.95rem}.osc-video-btn em{font-style:normal;color:#8fb0c6;font-size:.6rem}
button.osc-video-list-btn.osc-video-list-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid #2f6f9f;background:#0d2a44;color:#e6f2fb;border-radius:10px;padding:8px 14px;font-family:inherit;font-size:1rem;font-weight:700;line-height:1.2;cursor:pointer;white-space:nowrap;margin:0}
button.osc-video-list-btn.osc-video-list-btn:hover{background:#12355a}.osc-video-list-btn span{background:#2f83ff;border-radius:99px;padding:1px 7px;font-size:.72em}
.osc-video-modal{position:fixed;inset:0;z-index:100001;background:#020913e6;display:grid;place-items:center;padding:20px}
.osc-video-dialog{width:min(960px,100%);max-height:calc(100vh - 40px);overflow:auto;border:1px solid #2a5fa8;border-radius:16px;background:#06111d;padding:16px;box-shadow:0 30px 90px #000b;font-family:Inter,Segoe UI,Arial,sans-serif;color:#f5f8fc}
.osc-video-dialog.playlist{width:min(1240px,100%)}
.osc-video-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.osc-video-head h2{margin:0;font-size:1rem}.osc-video-head p{margin:3px 0 0;color:#9dafc2;font-size:.7rem}
.osc-video-close{border:1px solid #2d699b;background:#123d62;color:#fff;border-radius:8px;width:36px;height:36px;cursor:pointer;font-size:1rem;flex:0 0 auto}
.osc-video-dialog video{width:100%;aspect-ratio:16/9;background:#000;border-radius:10px;display:block}
.osc-video-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:10px;font-size:.72rem;color:#c0cedc;flex-wrap:wrap}
.osc-video-foot label{display:inline-flex;gap:8px;align-items:center;cursor:pointer}.osc-video-err{color:#f0d36b}
.osc-video-body{display:grid;grid-template-columns:1fr 300px;gap:14px;align-items:start}
.osc-video-items{display:flex;flex-direction:column;gap:8px}
.osc-video-item{display:grid;grid-template-columns:96px 1fr;gap:10px;align-items:center;padding:7px;border:1px solid #173149;border-radius:10px;background:#0b1827;color:#f5f8fc;cursor:pointer;text-align:left;font:inherit}
.osc-video-item:hover{border-color:#2f6f9f}.osc-video-item.on{border-color:#2f83ff;background:#0d2a44}
.osc-video-item img{width:96px;aspect-ratio:16/9;object-fit:cover;border-radius:6px;background:#000}
.osc-video-item b{display:block;font-size:.74rem;line-height:1.3}.osc-video-item small{display:block;color:#9dafc2;font-size:.64rem;margin-top:3px}.osc-video-item i{font-style:normal;color:#54e4a0}
@media(max-width:900px){.osc-video-body{grid-template-columns:1fr}}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const post = (videoId, action) =>
    fetch("/api/videos/event", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ videoId, action }) }).catch(() => {});
  let stateCache = null;
  const getState = () => stateCache || (stateCache = fetch("/api/videos/state", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null));

  function videoTag(v) {
    return `<video controls playsinline preload="metadata" controlslist="nodownload" poster="${v.poster}">
      <source src="${v.src}" type="video/mp4">${v.subtitulos ? `<track kind="subtitles" srclang="es" label="Español" src="${v.subtitulos}" default>` : ""}</video>`;
  }
  function track(video, getV, onDone) {
    const sent = {};
    video.addEventListener("play", () => { const v = getV(); if (!sent["p" + v.id]) { sent["p" + v.id] = 1; post(v.id, "play"); } });
    video.addEventListener("timeupdate", () => {
      const v = getV();
      if (!sent["w" + v.id] && video.duration && video.currentTime / video.duration >= 0.9) { sent["w" + v.id] = 1; post(v.id, "watched90"); if (onDone) onDone(v); }
    });
  }
  function shell(m, close) {
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    m.querySelector(".osc-video-close").onclick = close;
    m.addEventListener("click", (e) => { if (e.target === m) close(); });
    m.querySelector(".osc-video-close").focus();
    return () => document.removeEventListener("keydown", onKey);
  }
  function errorHandler(m, video) {
    video.addEventListener("error", () => {
      const f = m.querySelector(".osc-video-msg");
      if (f) { f.className = "osc-video-msg osc-video-err"; f.textContent = "No se pudo cargar el video. Si tu sesión venció, volvé a iniciar sesión."; }
    }, true);
  }

  // Video suelto (Dashboard).
  function open(v, opts) {
    const welcome = !!(opts && opts.welcome);
    const m = document.createElement("div");
    m.className = "osc-video-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", v.titulo);
    m.innerHTML = `<div class="osc-video-dialog">
      <div class="osc-video-head"><div><h2>${welcome ? "Bienvenido a OSC Payment Academy" : v.titulo}</h2><p>${welcome ? "Mirá este recorrido de " + v.duracion + " para conocer la plataforma." : "Duración " + v.duracion}</p></div>
      <button class="osc-video-close" type="button" aria-label="Cerrar">✕</button></div>
      ${videoTag(v)}
      <div class="osc-video-foot">${welcome ? `<label><input type="checkbox" class="osc-video-dont"> No volver a mostrar</label>` : "<span></span>"}
      <span class="osc-video-msg">Lo podés volver a ver desde el botón del inicio.</span></div></div>`;
    document.body.appendChild(m);
    const video = m.querySelector("video");
    track(video, () => v); errorHandler(m, video);
    const dont = m.querySelector(".osc-video-dont");
    if (dont) dont.addEventListener("change", () => post(v.id, dont.checked ? "dont_show" : "show_again"));
    let off = () => {};
    const close = () => { try { video.pause(); } catch (_) {} m.remove(); off(); };
    off = shell(m, close);
  }

  // Lista de videos de una pantalla (p. ej. POS): lista a la derecha, reproductor a la izquierda.
  function openList(grupo, startId) {
    const vids = OSC_VIDEOS.filter((x) => x.grupo === grupo);
    if (!vids.length) return;
    let cur = vids.find((x) => x.id === startId) || vids[0];
    const m = document.createElement("div");
    m.className = "osc-video-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", OSC_VIDEO_GROUPS[grupo] || "Videos");
    m.innerHTML = `<div class="osc-video-dialog playlist">
      <div class="osc-video-head"><div><h2>${OSC_VIDEO_GROUPS[grupo] || "Videos"}</h2><p class="osc-video-now"></p></div>
      <button class="osc-video-close" type="button" aria-label="Cerrar">✕</button></div>
      <div class="osc-video-body"><div>${videoTag(cur)}<div class="osc-video-foot"><span class="osc-video-msg">Al terminar, sigue el próximo video de la lista.</span></div></div>
      <div class="osc-video-items">${vids.map((v, i) => `<button type="button" class="osc-video-item" data-id="${v.id}"><img src="${v.poster}" alt="" loading="lazy"><span><b>${i + 1}. ${v.titulo}</b><small>${v.duracion} <i data-seen="${v.id}"></i></small></span></button>`).join("")}</div></div></div>`;
    document.body.appendChild(m);
    const video = m.querySelector("video");
    const mark = (id) => { const el = m.querySelector(`[data-seen="${id}"]`); if (el) el.textContent = "· ✓ visto"; };
    const show = (v, autoplay) => {
      cur = v;
      m.querySelectorAll(".osc-video-item").forEach((b) => b.classList.toggle("on", b.dataset.id === v.id));
      m.querySelector(".osc-video-now").textContent = `${vids.indexOf(v) + 1} de ${vids.length} · ${v.titulo} · ${v.duracion}`;
      if (video.getAttribute("data-cur") !== v.id) {
        video.setAttribute("data-cur", v.id);
        video.poster = v.poster;
        video.querySelectorAll("source,track").forEach((n) => n.remove());
        video.insertAdjacentHTML("beforeend", `<source src="${v.src}" type="video/mp4">${v.subtitulos ? `<track kind="subtitles" srclang="es" label="Español" src="${v.subtitulos}" default>` : ""}`);
        video.load();
      }
      if (autoplay) video.play().catch(() => {});
    };
    m.querySelectorAll(".osc-video-item").forEach((b) => (b.onclick = () => show(vids.find((x) => x.id === b.dataset.id), true)));
    track(video, () => cur, (v) => mark(v.id));
    video.addEventListener("ended", () => { const i = vids.indexOf(cur); if (i < vids.length - 1) show(vids[i + 1], true); });
    errorHandler(m, video);
    getState().then((d) => { if (d && d.views) vids.forEach((v) => { if (d.views[v.id] && d.views[v.id].watched90) mark(v.id); }); });
    video.setAttribute("data-cur", cur.id);
    show(cur, false);
    let off = () => {};
    const close = () => { try { video.pause(); } catch (_) {} m.remove(); off(); stateCache = null; };
    off = shell(m, close);
  }

  function renderButtons() {
    const slot = document.getElementById("videoSlot");
    if (slot) OSC_VIDEOS.filter((v) => v.grupo === "inicio" && v.boton).forEach((v) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "osc-video-btn";
      b.innerHTML = `<small>Video de ayuda</small><b>${v.boton}</b><em>${v.duracion}</em>`;
      b.onclick = () => open(v);
      slot.appendChild(b);
    });
    document.querySelectorAll("[data-osc-videos]").forEach((el) => {
      const g = el.dataset.oscVideos, n = OSC_VIDEOS.filter((v) => v.grupo === g).length;
      if (!n) return;
      const b = document.createElement("button");
      b.type = "button"; b.className = "osc-video-list-btn";
      b.innerHTML = `🎬 ${OSC_VIDEO_GROUPS[g] || "Videos"} <span>${n}</span>`;
      b.onclick = () => openList(g);
      el.appendChild(b);
    });
  }

  async function welcome() {
    if (!document.getElementById("videoSlot")) return; // solo en el Dashboard
    const v = OSC_VIDEOS.find((x) => x.bienvenida);
    if (!v) return;
    const d = await getState();
    stateCache = null;
    if (!d || d.admin) return; // la administración OSC no recibe la bienvenida automática
    const s = (d.views || {})[v.id];
    if (s && (s.dontShow || s.watched90)) return;
    open(v, { welcome: true });
  }

  window.OSCVideos = { list: OSC_VIDEOS, open: (id) => { const v = OSC_VIDEOS.find((x) => x.id === id); if (!v) return; v.grupo === "inicio" ? open(v) : openList(v.grupo, id); } };
  const start = () => { renderButtons(); welcome(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
