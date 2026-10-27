/* OSC Payment Academy v4.0.0-rc.1.42 · Íconos propios de los simuladores y herramientas de mensajes (opción C: color por módulo).
   SVG de trazo (viewBox 48×48, stroke = currentColor). Los usan el Dashboard (tarjetas y "Continuar donde quedaste") y el menú lateral.
   Para cambiar un color o un dibujo se edita solo este archivo. */
(() => {
  const P = {
    pos: '<rect x="13" y="6" width="22" height="36" rx="4"/><rect x="17" y="10" width="14" height="9" rx="1.5"/><path d="M19 15h6"/><circle cx="19" cy="25" r="1.2"/><circle cx="24" cy="25" r="1.2"/><circle cx="29" cy="25" r="1.2"/><circle cx="19" cy="30" r="1.2"/><circle cx="24" cy="30" r="1.2"/><circle cx="29" cy="30" r="1.2"/><circle cx="19" cy="35" r="1.2"/><circle cx="24" cy="35" r="1.2"/><circle cx="29" cy="35" r="1.2"/><path d="M18 6V2h12v4"/>',
    atm: '<rect x="8" y="5" width="32" height="38" rx="3"/><rect x="13" y="10" width="22" height="13" rx="1.5"/><path d="M17 16h8M17 19h12"/><path d="M14 29h20"/><path d="M18 29v9h12v-9"/><path d="M21 38v6h6v-6"/>',
    ecom: '<rect x="7" y="9" width="34" height="22" rx="2"/><path d="M3 35h42l-3 4H6z"/><path d="M15 15h3l2.5 9h9.5l2-6.5H19.2"/><circle cx="21.5" cy="27" r="1.3"/><circle cx="29" cy="27" r="1.3"/>',
    wallet: '<rect x="12" y="4" width="20" height="40" rx="4"/><path d="M19 8h6"/><rect x="15.5" y="14" width="13" height="8.5" rx="1.5"/><path d="M15.5 17.5h13"/><path d="M36 17c2.2 2.1 2.2 6.9 0 9M39.5 14c4 4 4 11 0 15"/><circle cx="22" cy="38" r="1.3"/>',
    constructor: '<rect x="6" y="30" width="16" height="10" rx="1.5"/><rect x="26" y="30" width="16" height="10" rx="1.5"/><rect x="16" y="18" width="16" height="10" rx="1.5"/><path d="M24 4v9M19.5 8.5h9"/>',
    parser: '<path d="M7 9h22M7 15h16M7 21h12M7 27h9"/><circle cx="30" cy="27" r="8"/><path d="M36 33l7 7"/><path d="M26.5 27h7"/>',
    guiado: '<path d="M7 9h22M7 15h18M7 21h10M7 27h8"/><path d="M33 13l7 7-14 14H19v-7z"/><path d="M29 17l7 7"/><path d="M8 38l4 4 8-8"/>',
  };
  const COLOR = { pos: "#39a9ff", atm: "#2fd3c4", ecom: "#a78bfa", wallet: "#f472b6", constructor: "#fbbf24", parser: "#34d399", guiado: "#fb923c" };
  const BY_HREF = { "pos.html": "pos", "atm.html": "atm", "ecommerce.html": "ecom", "wallet.html": "wallet", "constructor.html": "constructor", "parser.html": "parser", "parser_guiado.html": "guiado" };
  const svg = (k, sw = 2.4) => `<svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k]}</svg>`;
  const forHref = (href) => BY_HREF[String(href || "").split("?")[0].split("/").pop().toLowerCase()] || null;
  // Mosaico de la tarjeta: fondo suave + borde del color del módulo.
  const tile = (k, size = 54) => `<span class="osc-icon-tile" style="--c:${COLOR[k]};width:${size}px;height:${size}px">${svg(k)}</span>`;
  // Ícono chico para el menú y "Continuar donde quedaste".
  const inline = (k, size = 16) => `<span class="osc-icon-inline" style="color:${COLOR[k]};width:${size}px;height:${size}px">${svg(k, 3)}</span>`;
  if (!document.getElementById("osc-icons-css")) {
    const st = document.createElement("style"); st.id = "osc-icons-css";
    st.textContent = ".osc-icon-tile{display:inline-block;box-sizing:border-box;padding:9px;border-radius:12px;color:var(--c);background:color-mix(in srgb,var(--c) 14%,transparent);border:1px solid color-mix(in srgb,var(--c) 45%,transparent)}.osc-icon-tile svg,.osc-icon-inline svg{display:block}.osc-icon-inline{display:inline-block;vertical-align:-3px;flex:0 0 auto}";
    document.head.appendChild(st);
  }
  window.OSCIcons = { svg, tile, inline, forHref, COLOR };
})();
