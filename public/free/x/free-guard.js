/* OSC Payment Academy · v4.0.0-rc.1.58 · Guardia de la versión gratuita.
   Se carga PRIMERO en cada página de /free/. Aísla la versión gratuita de la plataforma:
   1) localStorage / sessionStorage con prefijo propio (no lee ni pisa datos de la plataforma paga).
   2) Bloquea en el navegador toda llamada a /api/* que no sea /api/free/*.
   3) Redes habilitadas fijas (sin consultar /api/auth/me).
   4) Menú lateral, barra superior y avisos de la versión gratuita. */
(function () {
  "use strict";
  const script = document.currentScript;
  const PAGE = (script && script.dataset.page) || "";
  const NETWORKS = ((script && script.dataset.networks) || "visa").split(",").map((s) => s.trim()).filter(Boolean);
  const WHATSAPP = "5491132318122";
  const PREFIX = "oscFree:";
  document.documentElement.dataset.freePage = PAGE;

  // ---------- 1) Almacenamiento aislado ----------
  function namespaced(real) {
    const keys = () => { const out = []; for (let i = 0; i < real.length; i++) { const k = real.key(i); if (k && k.startsWith(PREFIX)) out.push(k.slice(PREFIX.length)); } return out; };
    const api = {
      getItem: (k) => real.getItem(PREFIX + k),
      setItem: (k, v) => real.setItem(PREFIX + k, String(v)),
      removeItem: (k) => real.removeItem(PREFIX + k),
      clear: () => keys().forEach((k) => real.removeItem(PREFIX + k)),
      key: (i) => keys()[i] ?? null,
      get length() { return keys().length; },
    };
    return new Proxy(api, {
      get(t, p) { if (p in t) return typeof t[p] === "function" ? t[p] : t[p]; if (typeof p === "symbol") return undefined; const v = real.getItem(PREFIX + p); return v === null ? undefined : v; },
      set(t, p, v) { if (p in t) return false; real.setItem(PREFIX + String(p), String(v)); return true; },
      deleteProperty(t, p) { real.removeItem(PREFIX + String(p)); return true; },
      has(t, p) { return p in t || real.getItem(PREFIX + String(p)) !== null; },
    });
  }
  for (const name of ["localStorage", "sessionStorage"]) {
    try { const ns = namespaced(window[name]); Object.defineProperty(window, name, { configurable: true, enumerable: true, get: () => ns }); }
    catch (e) { console.warn("[OSC Free] no se pudo aislar " + name, e); }
  }

  // ---------- 2) Solo /api/free/* ----------
  const blocked = (u) => { try { const x = new URL(u, location.href); return x.origin === location.origin && x.pathname.startsWith("/api/") && !x.pathname.startsWith("/api/free/"); } catch (_) { return false; } };
  const realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    const u = typeof input === "string" ? input : input && input.url;
    if (blocked(u)) return Promise.resolve(new Response(JSON.stringify({ error: "FREE_PLAN", message: "No disponible en la versión gratuita." }), { status: 403, headers: { "content-type": "application/json" } }));
    return realFetch(input, init);
  };
  const xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u, ...rest) { return xhrOpen.call(this, m, blocked(u) ? "/api/free/blocked" : u, ...rest); };
  if (navigator.sendBeacon) { const sb = navigator.sendBeacon.bind(navigator); navigator.sendBeacon = (u, d) => (blocked(u) ? false : sb(u, d)); }

  // ---------- 3) Redes habilitadas ----------
  const fakeMe = { user: { platform_role: "FREE" }, networks: { allowed: NETWORKS, restricted: true }, moduleAccess: { progressive: false, enabled: [], locked: [], hidden: [] }, entitlements: {} };
  window.OSCMePromise = Promise.resolve(fakeMe);
  window.OSCMeFresh = Promise.resolve(null);
  window.OSCGetMe = () => window.OSCMePromise;

  // ---------- 4) API de la versión gratuita ----------
  const wa = (text) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
  let mePromise = null;
  function me(force) {
    if (!mePromise || force) mePromise = realFetch("/api/free/me", { credentials: "same-origin", headers: { accept: "application/json" } }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    return mePromise;
  }
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function modal(html) {
    document.getElementById("oscFreeModal")?.remove();
    const m = document.createElement("div");
    m.id = "oscFreeModal";
    m.className = "oscfree-modal";
    m.innerHTML = `<div class="oscfree-card" role="dialog" aria-modal="true">${html}</div>`;
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest("[data-free-close]")) m.remove(); });
    document.body.appendChild(m);
    return m;
  }
  function lock(title, text, waText) {
    modal(`<div class="oscfree-icon">🔒</div><h2>${esc(title)}</h2><p>${esc(text)}</p>
      <div class="oscfree-actions"><a class="oscfree-btn wa" target="_blank" rel="noopener" href="${esc(wa(waText || "Hola Oscar, estoy usando la cuenta gratuita de OSC Payment Academy y quiero una demo de la plataforma completa para mi empresa."))}">💬 Solicitar demo por WhatsApp</a>
      <button type="button" class="oscfree-btn ghost" data-free-close>Cerrar</button></div>`);
  }
  async function consume(module) {
    try {
      const r = await realFetch("/api/free/consume", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ module }) });
      if (r.status === 401) { location.href = "/free/registro.html?next=" + encodeURIComponent(location.pathname); return false; }
      if (r.ok) { me(true); return true; }
      const label = module === "pos" ? "Ya hiciste tu compra de prueba" : "Ya hiciste tu extracción de prueba";
      lock(label, "La cuenta gratuita incluye una operación de prueba. Para seguir practicando con todas las operaciones, marcas y escenarios, solicitá una demo de la plataforma completa.",
        `Hola Oscar, ya probé el ${module === "pos" ? "POS" : "ATM"} en la cuenta gratuita de OSC Payment Academy y quiero una demo de la plataforma completa.`);
      return false;
    } catch (e) {
      lock("Sin conexión", "No pudimos validar tu operación de prueba. Revisá tu conexión e intentá de nuevo.");
      return false;
    }
  }
  async function logout() {
    await realFetch("/api/free/logout", { method: "POST", credentials: "same-origin" }).catch(() => null);
    location.href = "/free/parser.html";
  }
  window.OSCFree = { page: PAGE, me, consume, lock, modal, wa, logout, WHATSAPP };

  // ---------- 5) Menú y barra de la versión gratuita ----------
  const MENU = [
    ["", "⌂", "Inicio", "/free/index.html", "inicio"],
    ["APRENDIZAJE"],
    ["", "🎓", "Curso Interactivo", "/free/curso.html", "curso", "Láminas 2 y 3"],
    ["lock", "📖", "eBook ISO 8583", "/free/ebook.html"],
    ["lock", "📝", "Evaluaciones", "/free/evaluacion.html"],
    ["OPERAR TRANSACCIONES"],
    ["", "▣", "POS Virtual", "/free/pos.html", "pos", "1 compra Visa"],
    ["", "🏧", "ATM Virtual", "/free/atm.html", "atm", "1 extracción"],
    ["lock", "🛒", "E-Commerce / 3DS", "/free/ecommerce.html"],
    ["lock", "📱", "Wallet / Tokenización", "/free/wallet.html"],
    ["MENSAJES ISO 8583"],
    ["lock", "⌘", "Constructor ISO 8583", "/free/constructor.html"],
    ["", "◉", "Parser ISO 8583", "/free/parser.html", "parser"],
    ["", "🧩", "Parser Guiado", "/free/parser_guiado.html", "parser_guiado", "Nivel 1"],
    ["BACK OFFICE"],
    ["lock", "🏦", "Switch del Adquirente", "/free/switch.html"],
  ];
  function menuHtml() {
    return MENU.map((it) => {
      if (it.length === 1) return `<div class="oscfree-section">${it[0]}</div>`;
      const [kind, icon, label, href, key, note] = it;
      const active = key && key === PAGE ? " active" : "";
      return `<a class="nav oscfree-item${active}${kind === "lock" ? " locked" : ""}" href="${href}">${icon} <span>${label}${note ? `<small>${note}</small>` : ""}</span>${kind === "lock" ? '<em aria-label="Bloqueado">🔒</em>' : ""}</a>`;
    }).join("") + `<a class="oscfree-demo" target="_blank" rel="noopener" href="${wa("Hola Oscar, estoy usando la versión gratuita de OSC Payment Academy y quiero una demo de la plataforma completa para mi empresa.")}">💬 Solicitar demo</a>`;
  }
  function decorate() {
    const aside = document.querySelector("aside");
    if (aside) {
      const navs = [...aside.querySelectorAll("nav")];
      if (navs.length) {
        navs[0].innerHTML = menuHtml();
        navs[0].classList.add("oscfree-nav");
        navs[0].hidden = false; navs[0].removeAttribute("aria-hidden");
        navs.slice(1).forEach((n) => (n.style.display = "none"));
      }
      // Se ocultan (no se eliminan): los scripts de la página pueden seguir actualizando esos elementos.
      aside.querySelectorAll(".section, .sidebar-bottom, .osc-tip, .tip, .future-resources").forEach((el) => (el.style.display = "none"));
    }
    const bar = document.createElement("div");
    bar.className = "oscfree-bar";
    bar.innerHTML = `<a class="oscfree-home" href="/free/index.html" id="oscFreeHome">⌂ Inicio</a><span class="oscfree-tag">VERSIÓN GRATUITA</span><span class="oscfree-who" id="oscFreeWho"></span>
      <a class="oscfree-cta" target="_blank" rel="noopener" href="${wa("Hola Oscar, estoy usando la versión gratuita de OSC Payment Academy y quiero una demo de la plataforma completa para mi empresa.")}">💬 Solicitar demo</a>
      <span id="oscFreeAuth"></span>`;
    document.body.prepend(bar);
    me().then((d) => {
      const who = document.getElementById("oscFreeWho"), auth = document.getElementById("oscFreeAuth");
      if (d && d.user) {
        who.textContent = d.user.fullName + (d.user.company ? " · " + d.user.company : "");
        auth.innerHTML = '<button type="button" class="oscfree-link" id="oscFreeLogout">Salir</button>';
        document.getElementById("oscFreeLogout").onclick = logout;
      } else {
        const home = document.getElementById("oscFreeHome"); if (home) { home.href = "/free/parser.html"; home.textContent = "◉ Parser gratuito"; }
        auth.innerHTML = '<a class="oscfree-link" href="/free/registro.html?modo=ingresar">Ingresar</a><a class="oscfree-cta alt" href="/free/registro.html">Crear cuenta gratis</a>';
      }
      document.dispatchEvent(new CustomEvent("osc-free-ready", { detail: d }));
    });
  }
  // rc.1.58 · Fichas didácticas de ARQC/ARPC (DE 55) y PIN Block/HSM (DE 52): no incluidas en la versión gratuita.
  function lockSecurityEdu() {
    const edu = window.OSCSecurityEdu;
    if (!edu || edu.__free) return;
    edu.open = () => lock("Ficha no incluida", "Las fichas didácticas de cada campo (ARQC/ARPC del DE 55, PIN Block y HSM del DE 52 y los manuales por campo) forman parte de la plataforma completa.");
    edu.__free = true;
  }
  document.addEventListener("DOMContentLoaded", lockSecurityEdu);
  window.addEventListener("load", lockSecurityEdu);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", decorate); else decorate();
})();
