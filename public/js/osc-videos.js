/* rc.1.61 · Videos de ayuda del Dashboard.
   Para sumar un video: agregar una entrada a OSC_VIDEOS, subir los archivos a public/media/videos/
   y agregar el id en VIDEO_IDS de src/index.js (el servidor solo acepta ids conocidos).
   bienvenida:true → se abre solo en el primer ingreso (uno solo a la vez). */
const OSC_VIDEOS = [
  { id: "plataforma", titulo: "Recorrido de la plataforma", duracion: "1:50",
    src: "/media/videos/plataforma.mp4", poster: "/media/videos/plataforma-poster.jpg",
    subtitulos: null, // "/media/videos/plataforma.es.vtt" cuando esté el archivo
    bienvenida: true, boton: "▶ Ver recorrido de la plataforma" }
];

(function () {
  const css = `
.osc-video-btn{display:inline-flex;flex-direction:column;justify-content:center;gap:2px;padding:10px 16px;border:1px solid #2f83ff;border-radius:12px;background:#04214acc;color:#fff;font:inherit;cursor:pointer;min-width:240px;text-align:left}
.osc-video-btn:hover{background:#12355a}.osc-video-btn small{color:#9fd0ff;font-size:.58rem;letter-spacing:.06em;text-transform:uppercase}.osc-video-btn b{font-size:.95rem}.osc-video-btn em{font-style:normal;color:#8fb0c6;font-size:.6rem}
.osc-video-modal{position:fixed;inset:0;z-index:100001;background:#020913e6;display:grid;place-items:center;padding:20px}
.osc-video-dialog{width:min(960px,100%);border:1px solid #2a5fa8;border-radius:16px;background:#06111d;padding:16px;box-shadow:0 30px 90px #000b;font-family:Inter,Segoe UI,Arial,sans-serif;color:#f5f8fc}
.osc-video-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.osc-video-head h2{margin:0;font-size:1rem}.osc-video-head p{margin:3px 0 0;color:#9dafc2;font-size:.7rem}
.osc-video-close{border:1px solid #2d699b;background:#123d62;color:#fff;border-radius:8px;width:36px;height:36px;cursor:pointer;font-size:1rem;flex:0 0 auto}
.osc-video-dialog video{width:100%;aspect-ratio:16/9;background:#000;border-radius:10px;display:block}
.osc-video-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:10px;font-size:.72rem;color:#c0cedc;flex-wrap:wrap}
.osc-video-foot label{display:inline-flex;gap:8px;align-items:center;cursor:pointer}.osc-video-err{color:#f0d36b}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const post = (videoId, action) =>
    fetch("/api/videos/event", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ videoId, action }) }).catch(() => {});

  function open(v, opts) {
    const welcome = !!(opts && opts.welcome);
    const m = document.createElement("div");
    m.className = "osc-video-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", v.titulo);
    m.innerHTML = `<div class="osc-video-dialog">
      <div class="osc-video-head"><div><h2>${welcome ? "Bienvenido a OSC Payment Academy" : v.titulo}</h2><p>${welcome ? "Mirá este recorrido de " + v.duracion + " para conocer la plataforma." : "Duración " + v.duracion}</p></div>
      <button class="osc-video-close" type="button" aria-label="Cerrar">✕</button></div>
      <video controls playsinline preload="metadata" controlslist="nodownload" poster="${v.poster}">
        <source src="${v.src}" type="video/mp4">${v.subtitulos ? `<track kind="subtitles" srclang="es" label="Español" src="${v.subtitulos}" default>` : ""}
      </video>
      <div class="osc-video-foot">${welcome ? `<label><input type="checkbox" class="osc-video-dont"> No volver a mostrar</label>` : "<span></span>"}
      <span>Lo podés volver a ver desde el botón del inicio.</span></div></div>`;
    document.body.appendChild(m);
    const video = m.querySelector("video");
    let played = false, done90 = false;
    video.addEventListener("play", () => { if (!played) { played = true; post(v.id, "play"); } });
    video.addEventListener("timeupdate", () => {
      if (!done90 && video.duration && video.currentTime / video.duration >= 0.9) { done90 = true; post(v.id, "watched90"); }
    });
    video.addEventListener("error", () => {
      const f = m.querySelector(".osc-video-foot span:last-child");
      if (f) { f.className = "osc-video-err"; f.textContent = "No se pudo cargar el video. Si tu sesión venció, volvé a iniciar sesión."; }
    }, true);
    const dont = m.querySelector(".osc-video-dont");
    if (dont) dont.addEventListener("change", () => post(v.id, dont.checked ? "dont_show" : "show_again"));
    const close = () => { try { video.pause(); } catch (_) {} m.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    m.querySelector(".osc-video-close").onclick = close;
    m.addEventListener("click", (e) => { if (e.target === m) close(); });
    m.querySelector(".osc-video-close").focus();
  }

  function renderButtons() {
    const slot = document.getElementById("videoSlot");
    if (!slot) return;
    OSC_VIDEOS.filter((v) => v.boton).forEach((v) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "osc-video-btn";
      b.innerHTML = `<small>Video de ayuda</small><b>${v.boton}</b><em>${v.duracion}</em>`;
      b.onclick = () => open(v);
      slot.appendChild(b);
    });
  }

  async function welcome() {
    const v = OSC_VIDEOS.find((x) => x.bienvenida);
    if (!v) return;
    try {
      const r = await fetch("/api/videos/state", { cache: "no-store" });
      if (!r.ok) return;
      const d = await r.json();
      if (d.admin) return; // la administración OSC no recibe la bienvenida automática
      const s = (d.views || {})[v.id];
      if (s && (s.dontShow || s.watched90)) return;
      open(v, { welcome: true });
    } catch (_) {}
  }

  window.OSCVideos = { list: OSC_VIDEOS, open: (id) => { const v = OSC_VIDEOS.find((x) => x.id === id); if (v) open(v); } };
  const start = () => { renderButtons(); welcome(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
