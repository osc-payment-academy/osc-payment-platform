/* OSC Payment Academy v4.0.0-rc.1.49 · TestLab · Modo Laboratorio en POS / ATM.
   - Solo aparece si la empresa tiene TestLab (entitlement testLab).
   - Capacitación: el simulador funciona como siempre (respuesta simulada).
   - Laboratorio: las operaciones de la Red LINK salen al ambiente de DESARROLLO del banco por el agente y la respuesta
     que se muestra es la del banco. Las demás redes siguen simuladas en esta versión.
   - El simulador llama a OSCTestLabMode.runFromSimulator(...) en lugar de OSCLinkHth.build(...) cuando el modo está activo. */
(() => {
  const TL = () => window.OSCTestLab;
  let bar = null, pill = null, toastBox = null, CTX = null;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const css = `
  .tl-pill{position:fixed;right:14px;bottom:14px;z-index:9998;background:#1b1230;border:1px solid #5b3f91;color:#eadcff;border-radius:999px;padding:8px 14px;font:700 12px Inter,Segoe UI,Arial,sans-serif;cursor:pointer;box-shadow:0 6px 18px #0008}
  .tl-pill:hover{background:#2b1d47}
  .tl-bar{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:linear-gradient(90deg,#2b1250,#3a1d63);border-top:2px solid #b98cff;color:#f3eaff;font:13px Inter,Segoe UI,Arial,sans-serif;padding:8px 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;box-shadow:0 -4px 16px #0009}
  .tl-bar b.tl-t{letter-spacing:.06em}
  .tl-bar select,.tl-bar input{background:#170c2b;border:1px solid #6d4fa8;color:#fff;border-radius:7px;padding:5px 8px;font:12px Inter,Segoe UI,Arial,sans-serif}
  .tl-bar input.tl-v{width:170px}.tl-bar input.tl-e{width:54px}
  .tl-bar label{display:flex;gap:5px;align-items:center;font-size:12px;color:#d7c6f5}
  .tl-bar button,.tl-bar a{background:#170c2b;border:1px solid #6d4fa8;color:#fff;border-radius:7px;padding:5px 10px;font:12px Inter,Segoe UI,Arial,sans-serif;cursor:pointer;text-decoration:none}
  .tl-bar .tl-dot{width:9px;height:9px;border-radius:50%;background:#ff5d6c;display:inline-block}
  .tl-bar .tl-dot.on{background:#18d17e}
  .tl-bar .tl-note{font-size:11px;color:#cdb8f1;flex-basis:100%}
  body.tl-on{padding-bottom:var(--tl-h,64px)!important}
  .tl-toast{position:fixed;right:14px;bottom:calc(var(--tl-h,64px) + 10px);z-index:9999;max-width:380px;background:#0b1827;border:1px solid #5b3f91;border-left:4px solid #b98cff;border-radius:10px;padding:12px 14px;color:#f5f8fc;font:13px Inter,Segoe UI,Arial,sans-serif;box-shadow:0 8px 24px #000a}
  .tl-toast a{color:#9fd8ff}
  .tl-toast .ok{color:#18d17e}.tl-toast .bad{color:#ff5d6c}.tl-toast .warn{color:#f7b51c}`;

  function ensureCss() { if (document.getElementById('tl-mode-css')) return; const s = document.createElement('style'); s.id = 'tl-mode-css'; s.textContent = css; document.head.appendChild(s); }
  const cards = () => (CTX?.cards || []).filter((c) => c.network === 'link');

  function render() {
    const st = TL().labState();
    document.body.classList.toggle('tl-on', !!st.on);
    if (!st.on) { if (bar) bar.remove(); bar = null; if (!pill) { pill = document.createElement('div'); pill.className = 'tl-pill'; pill.textContent = '🔬 TestLab · Capacitación → pasar a Laboratorio'; pill.onclick = () => { TL().setLabState({ on: true, network: 'link' }); render(); }; document.body.appendChild(pill); } return; }
    if (pill) { pill.remove(); pill = null; }
    if (!bar) { bar = document.createElement('div'); bar.className = 'tl-bar'; document.body.appendChild(bar); }
    const list = cards();
    bar.innerHTML = `<b class="tl-t">🔬 MODO LABORATORIO · LINK · AMBIENTE: DESARROLLO · ${esc(CTX.tenant.name)}</b>
      <label>Tarjeta <select class="tl-c">${list.length ? list.map((c) => `<option value="${c.id}" ${c.id === st.cardId ? 'selected' : ''}>${esc(c.alias)} · ${esc(c.maskedPan)}</option>`).join('') : '<option value="">Sin tarjetas: cargalas en TestLab</option>'}</select></label>
      <label>Versión <input class="tl-v" value="${esc(st.version || '')}" placeholder="versión del desarrollo *"></label>
      <label>Esperado <input class="tl-e" value="${esc(st.expected || '00')}" maxlength="3"></label>
      <span style="display:flex;gap:5px;align-items:center"><span class="tl-dot"></span><span class="tl-a" style="font-size:12px">agente…</span></span>
      <a href="testlab.html" target="_blank" rel="noopener">Mis resultados ↗</a>
      <button class="tl-off">Volver a Capacitación</button>
      <span class="tl-note">Salen al banco solo las operaciones con la tarjeta LINK del simulador; las demás redes siguen simuladas. El DE52 sale de la tarjeta del perfil: el PIN que tipeás no viaja.</span>`;
    const sel = bar.querySelector('.tl-c'); if (sel && !st.cardId && sel.value) TL().setLabState({ cardId: sel.value });
    bar.querySelector('.tl-c').onchange = (e) => TL().setLabState({ cardId: e.target.value });
    bar.querySelector('.tl-v').oninput = (e) => TL().setLabState({ version: e.target.value });
    bar.querySelector('.tl-e').oninput = (e) => TL().setLabState({ expected: e.target.value.trim() });
    bar.querySelector('.tl-off').onclick = () => { TL().setLabState({ on: false }); render(); };
    document.body.style.setProperty('--tl-h', bar.offsetHeight + 'px');
    TL().pingAgent().then((r) => { if (!bar) return; bar.querySelector('.tl-dot').classList.toggle('on', r.ok); bar.querySelector('.tl-a').textContent = r.ok ? 'agente OK' : 'agente no responde'; });
  }

  function toast(html, ms = 12000) {
    if (toastBox) toastBox.remove();
    toastBox = document.createElement('div'); toastBox.className = 'tl-toast'; toastBox.innerHTML = html + '<div style="text-align:right;margin-top:6px"><a href="#" class="tl-x">cerrar</a></div>';
    toastBox.querySelector('.tl-x').onclick = (e) => { e.preventDefault(); toastBox.remove(); toastBox = null; };
    document.body.appendChild(toastBox);
    if (ms) setTimeout(() => { if (toastBox) { toastBox.remove(); toastBox = null; } }, ms);
  }

  // Lo llaman POS / ATM. Devuelve la salida compatible con el simulador (solicitud + respuesta del banco).
  async function runFromSimulator({ kind, terminal, ctx }) {
    const st = TL().labState();
    if (!st.cardId) throw new Error('Elegí una tarjeta de prueba en la barra del Modo Laboratorio.');
    if (!String(st.version || '').trim()) throw new Error('Indicá la versión del desarrollo en la barra del Modo Laboratorio.');
    const r = await TL().run({ network: 'link', kind, terminal, ctx, cardId: st.cardId, version: st.version, expectedCode: st.expected || '00' });
    const s = r.summary, rec = r.record;
    const cls = s.verdict === 'APROBADA' ? 'ok' : s.verdict === 'FALLIDA' ? 'bad' : 'warn';
    const bad = (rec.checks || []).filter((c) => !c.ok);
    toast(`<b class="${cls}">TestLab · ${esc(TL().VERDICT_TEXT[s.verdict])}</b> · ${esc(rec.scenario)}<br><span style="color:#9dafc2">Versión ${esc(rec.devVersion)} · esperado ${esc(rec.expectedCode)} · recibido ${esc(rec.receivedCode || '—')} · conformidad ${s.conformity == null ? '—' : s.conformity + '%'}</span>
      ${bad.length ? '<div style="margin-top:6px">' + bad.slice(0, 4).map((c) => `<div class="${c.sev === 'bloqueante' ? 'bad' : 'warn'}">${c.sev === 'bloqueante' ? '✖' : '⚠'} ${c.de ? 'DE' + c.de + ' · ' : ''}${esc(c.nombre)}: ${esc(c.recibido)}</div>`).join('') + (bad.length > 4 ? `<div style="color:#9dafc2">… y ${bad.length - 4} más</div>` : '') + '</div>' : ''}
      ${rec.id ? `<div style="margin-top:6px"><a href="testlab.html#run=${encodeURIComponent(rec.id)}" target="_blank" rel="noopener">Ver validación completa ↗</a></div>` : `<div class="warn" style="margin-top:6px">${esc(r.out.lab.saveError || '')}</div>`}`, 0);
    return r.out;
  }
  function errorToast(msg) { toast(`<b class="bad">TestLab</b><br>${esc(msg)}`); }

  async function init() {
    if (!TL()) return;
    let me = null;
    try { me = window.OSCGetMe ? await window.OSCGetMe() : await fetch('/api/auth/me', { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : null)); } catch (_) {}
    if (!me?.entitlements?.testLab && me?.user?.platform_role !== 'OSC_ADMIN') return;
    await TL().context(); CTX = TL().ctx; if (!CTX) return;
    ensureCss(); render();
    window.addEventListener('resize', () => bar && document.body.style.setProperty('--tl-h', bar.offsetHeight + 'px'));
  }
  window.OSCTestLabMode = { runFromSimulator, errorToast, active: () => !!(CTX && TL()?.labOn('link')) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
