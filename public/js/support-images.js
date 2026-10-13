/* OSC Academy v4.0.0-rc.1.27 · Capturas de pantalla en Soporte Online.
   Pegar (Ctrl+V) o adjuntar hasta 3 imágenes por mensaje. Se achican en el navegador (máx. 1600 px, JPEG) antes de enviarse. */
(() => {
  const MAX = 3, MAX_SIDE = 1600, MAX_BYTES = 850 * 1024;
  const css = `.sup-att{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}
.sup-att .sup-thumb{position:relative;width:110px;height:76px;border:1px solid #2b4a66;border-radius:8px;overflow:hidden;background:#06111d}
.sup-att .sup-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.sup-att .sup-thumb button{position:absolute;top:3px;right:3px;border:0;border-radius:50%;width:22px;height:22px;background:rgba(0,0,0,.7);color:#fff;cursor:pointer;line-height:22px;padding:0}
.sup-att .sup-hint{font-size:12px;color:#8fa8bd}
.sup-imgs{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0}
.sup-imgs a{display:block;border:1px solid #2b4a66;border-radius:8px;overflow:hidden;max-width:320px}
.sup-imgs img{display:block;max-width:320px;max-height:220px;object-fit:contain;background:#06111d}`;
  function style() { if (document.getElementById('supImgCss')) return; const s = document.createElement('style'); s.id = 'supImgCss'; s.textContent = css; document.head.appendChild(s); }
  const dataUrlBytes = (u) => Math.floor((u.length - u.indexOf(',') - 1) * 3 / 4);
  function shrink(file) {
    return new Promise((resolve, reject) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let w = img.naturalWidth, h = img.naturalHeight; const k = Math.min(1, MAX_SIDE / Math.max(w, h)); w = Math.round(w * k); h = Math.round(h * k);
        const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(img, 0, 0, w, h);
        let q = 0.85, out = c.toDataURL('image/jpeg', q);
        while (dataUrlBytes(out) > MAX_BYTES && q > 0.4) { q -= 0.1; out = c.toDataURL('image/jpeg', q); }
        if (dataUrlBytes(out) > MAX_BYTES) return reject(new Error('La imagen es demasiado grande.'));
        resolve(out);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen.')); };
      img.src = url;
    });
  }
  // Conecta un textarea: pegar imágenes + botón adjuntar + miniaturas. Devuelve { list(), clear() }.
  function attach(textarea) {
    style();
    const list = [];
    const box = document.createElement('div'); box.className = 'sup-att';
    const pick = document.createElement('input'); pick.type = 'file'; pick.accept = 'image/*'; pick.multiple = true; pick.hidden = true;
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn'; btn.textContent = '📎 Adjuntar captura';
    const hint = document.createElement('span'); hint.className = 'sup-hint'; hint.textContent = `También podés pegar una captura con Ctrl+V dentro del texto (hasta ${MAX}).`;
    textarea.insertAdjacentElement('afterend', box); box.append(btn, pick, hint);
    const render = () => {
      box.querySelectorAll('.sup-thumb').forEach((n) => n.remove());
      list.forEach((u, i) => { const d = document.createElement('div'); d.className = 'sup-thumb'; d.innerHTML = `<img alt="Captura ${i + 1}"><button type="button" aria-label="Quitar">×</button>`; d.querySelector('img').src = u; d.querySelector('button').onclick = () => { list.splice(i, 1); render(); }; box.insertBefore(d, btn); });
      btn.disabled = list.length >= MAX;
    };
    const add = async (files) => {
      for (const f of files) {
        if (!/^image\//.test(f.type)) continue;
        if (list.length >= MAX) { hint.textContent = `Máximo ${MAX} capturas por mensaje.`; break; }
        try { list.push(await shrink(f)); } catch (e) { hint.textContent = e.message; }
      }
      render();
    };
    btn.onclick = () => pick.click();
    pick.onchange = () => { add([...pick.files]); pick.value = ''; };
    textarea.addEventListener('paste', (e) => { const files = [...(e.clipboardData?.files || [])].filter((f) => /^image\//.test(f.type)); if (files.length) { e.preventDefault(); add(files); } });
    return { list: () => list.slice(), clear: () => { list.length = 0; render(); } };
  }
  // Muestra las imágenes de un mensaje (ids de /api/support/images/:id).
  function gallery(ids) {
    style();
    if (!ids || !ids.length) return '';
    return `<div class="sup-imgs">${ids.map((id) => `<a href="/api/support/images/${encodeURIComponent(id)}" target="_blank" rel="noopener"><img loading="lazy" alt="Captura adjunta" src="/api/support/images/${encodeURIComponent(id)}"></a>`).join('')}</div>`;
  }
  window.OSCSupportImages = { attach, gallery };
})();
