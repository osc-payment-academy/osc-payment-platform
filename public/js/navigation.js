/* OSC Academy v4.0.0-rc.1.22 - navegación por licencia.
   - Cada opción del menú depende de un módulo habilitable (licencia de la consultora o edición del curso).
   - Edición de curso: lo no habilitado se muestra con candado (Día N). Consultora: lo no incluido no se muestra.
   - Análisis Diario y Monitoreo en Vivo: licencias separadas.
   - Documentación Técnica e Investigación: solo administración OSC.
   El servidor (src/index.js) aplica las mismas reglas aunque se escriba la URL a mano. */
(async () => {
  const modules = [
    { href: "index.html", icon: "⌂", label: "Dashboard" },
    { section: "Aprendizaje" },
    { href: "curso_interactivo.html", icon: "🎓", label: "Curso Interactivo", key: "course_iso8583", day: 1 },
    { href: "ebook.html", icon: "📖", label: "eBook ISO 8583", key: "ebook", version: "4.0.0-rc1.12" },
    { section: "Banco simulado" },
    { href: "clientes.html", icon: "👤", label: "CLIENTES", key: "banco_simulado" },
    { href: "pasivas.html", icon: "🏦", label: "PASIVAS", key: "banco_simulado" },
    { href: "solicitudes.html", icon: "💳", label: "SOLICITUDES", key: "banco_simulado" },
    { href: "cuenta_cliente.html", icon: "💳", label: "Cuenta del Cliente", key: "banco_simulado", visible: false },
    { section: "Laboratorios" },
    { href: "constructor.html", icon: "⌘", label: "Constructor ISO8583", key: "constructor", day: 1 },
    { href: "pos.html", icon: "▣", label: "POS Virtual", key: "pos", day: 1 },
    { href: "atm.html", icon: "🏧", label: "ATM Virtual", key: "atm", day: 2 },
    { href: "wallet.html", icon: "📱", label: "Wallet / Tokenización", key: "wallet", day: 4 },
    { href: "ecommerce.html", icon: "🛒", label: "E-Commerce / 3DS", key: "ecommerce", day: 3 },
    { href: "switch.html", icon: "🏦", label: "Switch del Adquirente", key: "switch_adquirente" },
    { href: "compensacion.html", icon: "⇄", label: "Compensación", key: "switch_adquirente", visible: false },
    { href: "compensacion_mastercard.html", icon: "⇄", label: "Compensación Mastercard", key: "switch_adquirente", visible: false },
    { href: "switch_emisor.html", icon: "🌎", label: "Switch Emisor", key: "switch_emisor", day: 5 },
    { href: "parser.html", icon: "◉", label: "Parser ISO8583", key: "parser", day: 1 },
    { href: "parser_guiado.html", icon: "🧩", label: "Parser Guiado", key: "parser", day: 1 },
    { section: "Soluciones profesionales" },
    { href: "authorization-analytics.html", icon: "📊", label: "Análisis Diario de Autorizaciones", product: "authorizationAnalytics" },
    { href: "monitoreo-vivo.html", icon: "🔴", label: "Monitoreo en Vivo de Autorizaciones", product: "liveMonitoring" },
    { section: "Administración", adminSection: true },
    { href: "uso-licencias.html", icon: "📈", label: "Uso de licencias", usage: true },
    { href: "documentacion.html", icon: "📚", label: "Documentación Técnica", adminOnly: true },
    { href: "research.html", icon: "🧪", label: "Investigación", adminOnly: true },
    { section: "Cuenta" },
    { href: "account.html", icon: "🔐", label: "Mi cuenta" },
    { href: "mastercard_iso.html", icon: "◉", label: "Mastercard ISO", visible: false },
    { href: "ondemand_lab.html", icon: "🧩", label: "Laboratorio de Nuevas Funcionalidades", visible: false },
    { href: "production_diagnostic.html", icon: "🔎", label: "Diagnóstico de Procesos Productivos", visible: false },
  ];
  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase().replace(/^([^.]+)$/, "$1.html");
  let me = null;
  try {
    const r = await fetch("/api/auth/me", { credentials: "same-origin" });
    if (r.ok) me = await r.json();
  } catch (_) {}
  // Sin sesión (vista previa local): se muestra todo, como antes.
  const isAdmin = !me || me.user?.platform_role === "OSC_ADMIN";
  const access = me?.moduleAccess || { progressive: false, enabled: [], locked: [], hidden: [] };
  const ent = me?.entitlements || {};
  const enabled = new Set(access.enabled || []), locked = new Set(access.locked || []);
  const stateOf = (item) => {
    if (item.section) return "section";
    if (item.visible === false) return "hidden";
    if (item.adminOnly) return isAdmin ? "on" : "hidden";
    if (item.usage) return isAdmin || ent.usagePanel ? "on" : "hidden";
    if (item.product) return isAdmin || ent[item.product] ? "on" : "hidden";
    if (!item.key || isAdmin) return "on";
    if (enabled.has(item.key)) return "on";
    if (locked.has(item.key)) return "locked";
    return "hidden";
  };
  const currentModule = modules.find((m) => m.href && m.href.toLowerCase() === current);
  if (currentModule && me) {
    const st = stateOf(currentModule);
    if (st === "locked" || (st === "hidden" && currentModule.visible !== false)) {
      const msg = st === "locked"
        ? `Este módulo forma parte del programa progresivo y estará disponible después de la clase${currentModule.day ? " del Día " + currentModule.day : ""}.`
        : "Este módulo no está incluido en tu licencia. Consultá con tu administrador.";
      document.body.innerHTML = `<main style="min-height:100vh;display:grid;place-items:center;background:#06111d;color:#f5f8fc;font-family:Inter,Segoe UI,Arial,sans-serif;padding:16px"><section style="max-width:560px;text-align:center;border:1px solid #1d405c;border-radius:16px;padding:36px;background:#0a1928"><div style="font-size:42px">🔒</div><h1>${currentModule.label}</h1><p style="color:#9cb2c6">${msg}</p><a href="index.html" style="display:inline-block;margin-top:14px;padding:11px 18px;border-radius:9px;background:#0875dc;color:white;text-decoration:none">← Volver a la plataforma</a></section></main>`;
      return;
    }
  }
  // Fuera del menú (tarjetas del dashboard, accesos rápidos): se ocultan los accesos a lo que no está habilitado.
  if (me) {
    document.querySelectorAll("main a[href], section a[href]").forEach((a) => {
      const href = (a.getAttribute("href") || "").split(/[?#]/)[0].split("/").pop().toLowerCase();
      const item = modules.find((m) => m.href && m.href.toLowerCase() === href);
      if (!item || a.closest("aside")) return;
      if (stateOf({ ...item, visible: true }) === "hidden") {
        const box = a.closest(".heading, article.card") || a;
        box.style.display = "none";
      }
    });
  }
  // Bloque del eBook en el Dashboard (usa un botón, no un enlace).
  if (me && stateOf({ key: "ebook" }) === "hidden") {
    const eb = document.querySelector("section.ebook");
    if (eb) { eb.style.display = "none"; const h = eb.previousElementSibling; if (h?.classList.contains("heading")) h.style.display = "none"; }
  }
  const sidebar = document.querySelector("aside.side, aside.sidebar, aside.osc-sidebar");
  if (!sidebar) return;
  const managed = new Set(modules.filter((m) => m.href).map((item) => item.href));
  const style = document.createElement("style");
  style.textContent = `.osc-primary-navigation{display:grid!important;gap:4px!important;margin:14px 0 16px!important}.osc-primary-navigation .nav{display:block!important;position:static!important;margin:0!important;padding:10px 12px!important;text-decoration:none!important;color:#c7d2df!important}.osc-primary-navigation .nav:visited{color:#c7d2df!important}.osc-primary-navigation .nav:hover{color:#ffffff!important;background:rgba(255,255,255,.06)!important}.osc-primary-navigation .nav.active{color:#ffffff!important;background:rgba(47,131,255,.16)!important;border-radius:8px!important}.osc-primary-navigation .nav.locked{opacity:.52}.osc-primary-navigation .osc-nav-section{margin:12px 12px 2px;color:#6f8ba3;font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}.future-resources{display:none!important}aside a[href="mastercard_iso.html"],aside a[href="cuenta_cliente.html"],aside a[href="ondemand_lab.html"],aside a[href="production_diagnostic.html"]{display:none!important}`;
  document.head.appendChild(style);
  sidebar.querySelectorAll("a[href]").forEach((link) => {
    const href = (link.getAttribute("href") || "").split(/[?#]/)[0].split("/").pop();
    if (managed.has(href)) link.remove();
  });
  sidebar.querySelectorAll("nav").forEach((nav) => {
    if (!nav.querySelector("a,button,[data-op],[data-section]")) nav.remove();
  });
  sidebar.querySelectorAll(":scope > .section:not(.instructor)").forEach((section) => section.remove());
  const nav = document.createElement("nav");
  nav.className = "osc-primary-navigation";
  nav.setAttribute("aria-label", "Navegación principal");
  // Solo se muestran los títulos de sección que tienen al menos una opción visible.
  const visibleItems = [];
  let pendingSection = null;
  modules.forEach((item) => {
    if (item.section) { pendingSection = item; return; }
    const st = stateOf(item);
    if (st === "hidden") return;
    if (pendingSection) { visibleItems.push(pendingSection); pendingSection = null; }
    visibleItems.push({ ...item, st });
  });
  visibleItems.forEach((item) => {
    if (item.section) {
      const h = document.createElement("div");
      h.className = "osc-nav-section";
      h.textContent = item.section;
      nav.appendChild(h);
      return;
    }
    const isLocked = item.st === "locked";
    const link = document.createElement("a");
    const target = new URL(item.href, location.origin + "/");
    if (item.version) target.searchParams.set("v", item.version);
    link.className = "nav" + (current === item.href.toLowerCase() ? " active" : "") + (isLocked ? " locked" : "");
    link.href = target.href;
    link.textContent = `${isLocked ? "🔒" : item.icon} ${item.label}${isLocked && item.day ? ` · Día ${item.day}` : ""}`;
    nav.appendChild(link);
  });
  const brand = sidebar.querySelector(".brand,.osc-brand");
  if (brand) brand.insertAdjacentElement("afterend", nav);
  else sidebar.prepend(nav);
})();
