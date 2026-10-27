/* OSC Academy v4.0.0-rc.1.24 · Redes habilitadas por consultora.
   Lee /api/auth/me (networks.allowed) y deja visibles en cada simulador solo las redes de la licencia.
   Administración OSC, ediciones del curso y licencias directas: todas las redes. */
(() => {
  const ALL = ['visa', 'mastercard', 'amex', 'link', 'domestic'];
  const LABEL = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express', link: 'Red LINK', domestic: 'Doméstica' };
  // rc.1.43 · /api/auth/me cacheado en la pestaña (sessionStorage): al entrar a un módulo se usa la respuesta anterior y se confirma en segundo plano.
  window.OSCGetMe = window.OSCGetMe || function () { if (window.OSCMePromise) return window.OSCMePromise; const fresh = fetch('/api/auth/me', { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : null)).catch(() => null).then((d) => { try { if (d) sessionStorage.setItem('oscMeV1', JSON.stringify(d)); else sessionStorage.removeItem('oscMeV1'); } catch (_) {} return d; }); window.OSCMeFresh = fresh; let c = null; try { c = JSON.parse(sessionStorage.getItem('oscMeV1') || 'null'); } catch (_) {} return (window.OSCMePromise = c ? Promise.resolve(c) : fresh); };
  const me = window.OSCGetMe();
  const ready = me.then(d => {
    const allowed = new Set(d?.networks?.allowed || ALL);
    return { allowed, restricted: !!d?.networks?.restricted };
  });
  const state = { allowed: new Set(ALL), restricted: false };
  const allows = n => state.allowed.has(n);

  // Clave de red de cada tarjeta de prueba del POS y del ATM.
  function cardNetwork(key) {
    key = String(key || '');
    if (key.startsWith('visa')) return 'visa';
    if (key.startsWith('mc-') || key.startsWith('mastercard')) return 'mastercard';
    if (key.startsWith('amex')) return 'amex';
    if (key.startsWith('link')) return 'link';
    if (key.includes('domestic')) return 'domestic';
    return null;
  }
  function hide(el, off) { if (!el) return; el.hidden = off; el.style.display = off ? 'none' : ''; el.dataset.netOff = off ? '1' : ''; }
  function banner(text) {
    if (document.getElementById('oscNetworkBanner')) return;
    const b = document.createElement('div');
    b.id = 'oscNetworkBanner';
    b.style.cssText = 'margin:10px 16px;padding:12px 14px;border:1px solid #6b5520;border-radius:10px;background:#2a2108;color:#ffe3a3;font:13px Inter,Segoe UI,Arial,sans-serif';
    b.textContent = text;
    const main = document.querySelector('main') || document.body;
    main.prepend(b);
  }
  const allowedText = () => [...state.allowed].map(n => LABEL[n]).join(', ');

  function filterSelect(sel, onlyNetworkValues = true) {
    if (!sel) return 0;
    let visible = 0;
    [...sel.options].forEach(o => {
      const n = ALL.includes(o.value) ? o.value : (o.value.endsWith('-qr') ? o.value.replace('-qr', '') : null);
      if (!n) { if (!onlyNetworkValues) visible++; return; }
      const off = !allows(n);
      o.hidden = off; o.disabled = off;
      if (!off) visible++;
    });
    const cur = sel.options[sel.selectedIndex];
    if (cur && cur.disabled) {
      const first = [...sel.options].find(o => !o.disabled && ALL.includes(o.value.replace('-qr', '')));
      if (first) { sel.value = first.value; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    return visible;
  }

  function apply() {
    // POS · tarjetas de prueba y QR
    const posCards = [...document.querySelectorAll('[data-test-card]')];
    if (posCards.length) {
      posCards.forEach(b => { const n = cardNetwork(b.dataset.testCard); if (n) hide(b, !allows(n)); });
      const active = posCards.find(b => b.classList.contains('active'));
      if (!active || active.dataset.netOff === '1') {
        const first = posCards.find(b => b.dataset.netOff !== '1' && !(b.dataset.testCard === 'domestic' && b.classList.contains('no-card'))) || posCards.find(b => b.dataset.netOff !== '1');
        if (first && window.OSCSelectTestCard) window.OSCSelectTestCard(first.dataset.testCard);
      }
      const qrSel = document.getElementById('qrTypeSelect');
      const qrVisible = filterSelect(qrSel);
      const qrTab = document.querySelector('[data-payment-method="qr"]');
      if (qrTab && !qrVisible) hide(qrTab.closest('.qr-method-wrap') || qrTab, true);
    }
    // ATM · tarjetas de prueba
    const atmCards = [...document.querySelectorAll('[data-atm-card]')];
    if (atmCards.length) {
      atmCards.forEach(b => { const n = cardNetwork(b.dataset.atmCard); if (n) hide(b, !allows(n)); });
      const active = atmCards.find(b => b.classList.contains('active'));
      const needs = !active || active.dataset.netOff === '1' || (!active && !allows('visa'));
      if (needs) {
        const first = atmCards.find(b => b.dataset.netOff !== '1' && !b.classList.contains('no-card')) || atmCards.find(b => b.dataset.netOff !== '1');
        if (first && window.OSCSelectATMCard) window.OSCSelectATMCard(first.dataset.atmCard);
      }
    }
    // Wallet · tarjetas tokenizadas
    const walletCards = [...document.querySelectorAll('.wallet-card[data-network]')];
    if (walletCards.length) {
      walletCards.forEach(c => { const n = String(c.dataset.network).toLowerCase(); if (!allows(n)) c.remove(); });
      window.OSCWalletShowCard?.(0);
    }
    // E-commerce, Constructor y Parser · selector de red
    filterSelect(document.getElementById('ecomNetwork'));
    const cons = document.getElementById('constructorNetworkSelect');
    if (cons && !filterSelect(cons)) banner(`Tu licencia incluye: ${allowedText()}. El Constructor trabaja con Visa, Mastercard y American Express, así que acá queda en modo automático por DE2.`);
    filterSelect(document.getElementById('parserNetworkSelect'));
    // Switch del adquirente · tarjetas por red
    document.querySelectorAll('.network-card[data-network]').forEach(c => hide(c, !allows(String(c.dataset.network).toLowerCase())));
    const netCards = [...document.querySelectorAll('.network-card[data-network]')];
    if (netCards.length && netCards.every(c => c.dataset.netOff === '1')) banner(`Tu licencia incluye: ${allowedText()}. Los lotes y la compensación de este Switch son de Visa, Mastercard y American Express.`);
    document.dispatchEvent(new CustomEvent('osc-networks-ready', { detail: { allowed: [...state.allowed], restricted: state.restricted } }));
  }

  // rc.1.26 · Las páginas arrancan con html.osc-net-pending (tarjetas ocultas) y se liberan recién con las redes resueltas.
  const release = () => document.documentElement.classList.remove('osc-net-pending');
  ready.then(r => {
    state.allowed = r.allowed; state.restricted = r.restricted;
    if (!r.restricted) return release();
    const first = () => { try { apply(); } finally { release(); } };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(first, 0));
    else setTimeout(first, 0);
    // Las tarjetas Doméstica se completan después de consultar el Banco simulado: se reaplica una vez más.
    setTimeout(apply, 1500);
  }, release);
  // Si la respuesta fresca cambia las redes respecto de la cacheada, se vuelve a aplicar.
  (window.OSCMeFresh || Promise.resolve(null)).then((d) => {
    if (!d) return;
    const allowed = new Set(d?.networks?.allowed || ALL), restricted = !!d?.networks?.restricted;
    const same = restricted === state.restricted && allowed.size === state.allowed.size && [...allowed].every((n) => state.allowed.has(n));
    if (same) return;
    state.allowed = allowed; state.restricted = restricted;
    const go = () => { try { apply(); } catch (_) {} };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  });

  window.OSCNetworkAccess = { ready, allows, apply, label: n => LABEL[n] || n, get allowed() { return [...state.allowed]; } };
})();
