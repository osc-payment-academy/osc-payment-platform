/* OSC Payment Academy · rc.1.63 · Fundamentos y Arquitectura
   Motor de escenas: un mismo estado (actores, paquetes, cámara) y dos formas de dibujarlo:
   - 3D con Three.js (js/vendor/three.module.min.js), carga diferida.
   - 2D en canvas, para equipos sin WebGL o lentos (misma secuencia y misma narración). */

export const ACTORS = {
  cliente:      { n: "Tarjetahabiente", k: "person", p: [-10, 5.2], c: 0x9fd0ff },
  comercio:     { n: "Comercio", k: "shop", p: [-13, 1.2], c: 0x2fd3c4 },
  pos:          { n: "POS", k: "device", p: [-10.6, 1.8], c: 0x39a9ff },
  atm:          { n: "ATM", k: "atm", p: [-13, -2.6], c: 0x2fd3c4 },
  ecom:         { n: "Tienda online", k: "laptop", p: [-13, -6.2], c: 0xa78bfa },
  wallet:       { n: "Celular / Wallet", k: "phone", p: [-8.6, 7.4], c: 0xf472b6 },
  qr:           { n: "Cartel QR", k: "sign", p: [-13, 5.4], c: 0xfbbf24 },
  adquirente:   { n: "Adquirente", k: "bank", p: [-6, 0], c: 0x39a9ff },
  proc_adq:     { n: "Procesador (adquirente)", k: "server", p: [-6, -4.4], c: 0x7c93b5 },
  marca:        { n: "Marca / Red", k: "tower", p: [0, 0], c: 0xfbbf24 },
  visa:         { n: "Visa", k: "tower2", p: [-2, -2.6], c: 0x2a5bd7 },
  mc:           { n: "Mastercard", k: "tower2", p: [2, -2.6], c: 0xeb5a2b },
  switch_nac:   { n: "Switch nacional", k: "hub", p: [0, 5.6], c: 0x34d399 },
  emisor:       { n: "Emisor", k: "bank", p: [6, 0], c: 0x18d17e },
  proc_emi:     { n: "Procesador (emisor)", k: "server", p: [6, -4.4], c: 0x7c93b5 },
  hsm_adq:      { n: "HSM del adquirente", k: "safe", p: [-4, 3.6], c: 0xaab4c0 },
  hsm_red:      { n: "HSM de la red", k: "safe", p: [0, 3.4], c: 0xaab4c0 },
  hsm_emi:      { n: "HSM del emisor", k: "safe", p: [8.6, 2.8], c: 0xaab4c0 },
  compensacion: { n: "Cámara de compensación", k: "hub", p: [0, -7.4], c: 0x2f83ff },
  liquidador:   { n: "Banco liquidador", k: "bank-s", p: [4.4, -8.2], c: 0xd4af37 },
  conciliacion: { n: "Mesa de conciliación", k: "desk", p: [8.6, -6.6], c: 0x9fd0ff },
  gateway:      { n: "Gateway", k: "server", p: [-10.2, -9], c: 0x8b5cf6 },
  psp:          { n: "PSP", k: "server", p: [-7.4, -9], c: 0x60a5fa },
  payfac:       { n: "PayFac", k: "bank-s", p: [-10.4, 10], c: 0xfb923c },
  fintech:      { n: "Fintech", k: "bank-s", p: [10.4, -2.6], c: 0x22d3ee },
  server3ds:    { n: "Servidor 3DS", k: "server", p: [-9.6, -4.6], c: 0xa78bfa },
  ds:           { n: "Directory Server", k: "server", p: [0, -3.6], c: 0xfbbf24 },
  acs:          { n: "ACS del emisor", k: "server", p: [9.4, -3.6], c: 0x18d17e },
  libro:        { n: "Libro de reglas", k: "book", p: [2.8, 2.6], c: 0xf5f8fc },
  auditor:      { n: "Auditor (QSA)", k: "person", p: [3, 7.4], c: 0xf7b51c },
  regulador:    { n: "Regulador", k: "person", p: [0, 2.8], c: 0xff9fb0 },
  atacante:     { n: "Atacante", k: "person", p: [-4, 8], c: 0xff667d },
  custodio1:    { n: "Custodio 1", k: "person", p: [-5.4, 5.4], c: 0xf5f8fc },
  custodio2:    { n: "Custodio 2", k: "person", p: [-2.6, 5.4], c: 0xf5f8fc },
  boveda:       { n: "Bóveda de datos", k: "safe", p: [6, 4.2], c: 0x9b8cff },
  app:          { n: "App del banco", k: "phone", p: [9.2, 5.2], c: 0x18d17e },
  motor:        { n: "Motor de riesgo", k: "server", p: [9, 2.4], c: 0xff9f43 },
  dev:          { n: "Ambiente de desarrollo", k: "server", p: [9.4, 4.6], c: 0x60a5fa },
  qa:           { n: "Ambiente de QA", k: "server", p: [9.4, 7.4], c: 0xa78bfa },
  lab_marca:    { n: "Entorno de pruebas de la marca", k: "server", p: [2.6, 4.4], c: 0xfbbf24 },
  lab_term:     { n: "Laboratorio de terminales", k: "server", p: [-9.6, -4.6], c: 0x39a9ff },
};

const KIND_GLYPH = { person: "🧑", shop: "🏪", device: "▣", atm: "🏧", laptop: "💻", phone: "📱", sign: "▦", bank: "🏦", "bank-s": "🏢", server: "🖥️", tower: "🗼", tower2: "🗼", hub: "⇄", safe: "🔒", book: "📕", desk: "🗂️" };
export const PACKET = {
  req: { c: 0x2f83ff, css: "#2f83ff", g: "●", t: "Solicitud" },
  ok: { c: 0x18d17e, css: "#18d17e", g: "●", t: "Aprobada" },
  ko: { c: 0xff667d, css: "#ff667d", g: "●", t: "Rechazada" },
  dispute: { c: 0xff9f43, css: "#ff9f43", g: "◆", t: "Disputa / reverso" },
  money: { c: 0xf7d21c, css: "#f7d21c", g: "$", t: "Dinero" },
  file: { c: 0xdfe8f2, css: "#dfe8f2", g: "📄", t: "Archivo" },
  token: { c: 0xc084fc, css: "#c084fc", g: "◈", t: "Token" },
  key: { c: 0xaab4c0, css: "#aab4c0", g: "🔑", t: "Llave" },
};
const HOP_S = 0.95;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* Estado compartido por los dos dibujos. */
class State {
  constructor() {
    this.pos = {}; this.visible = new Set(); this.hl = null; this.tags = {}; this.packets = []; this.tweens = [];
    this.cam = { x: 0, z: 0, d: 30, yaw: -0.5, pitch: 0.95 };
    Object.entries(ACTORS).forEach(([id, a]) => (this.pos[id] = [a.p[0], a.p[1]]));
  }
  reset(visible) {
    Object.entries(ACTORS).forEach(([id, a]) => (this.pos[id] = [a.p[0], a.p[1]]));
    this.visible = new Set(visible); this.hl = null; this.tags = {}; this.packets = []; this.tweens = [];
  }
  bbox(ids) {
    const list = (ids && ids.length ? ids : [...this.visible]).filter((id) => this.pos[id]);
    if (!list.length) return { cx: 0, cz: 0, ext: 12 };
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    list.forEach((id) => { const [x, z] = this.pos[id]; x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); });
    return { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, ext: Math.max(x1 - x0, z1 - z0, 4) };
  }
  tween(dur, fn) { return new Promise((res) => this.tweens.push({ t: 0, dur, fn, res })); }
  update(dt) {
    this.tweens = this.tweens.filter((tw) => {
      tw.t = Math.min(tw.dur, tw.t + dt); tw.fn(ease(tw.t / tw.dur));
      if (tw.t >= tw.dur) { tw.res(); return false; }
      return true;
    });
  }
}

/* ---------- Dibujo 3D ---------- */
class Renderer3D {
  constructor(THREE, host, state, labels) {
    this.T = THREE; this.host = host; this.s = state; this.labels = labels;
    const T = THREE;
    this.renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setClearColor(0x06111d);
    host.appendChild(this.renderer.domElement);
    this.scene = new T.Scene();
    this.scene.fog = new T.Fog(0x06111d, 45, 90);
    this.camera = new T.PerspectiveCamera(38, 1, 0.1, 200);
    this.scene.add(new T.HemisphereLight(0xbcd7ff, 0x0b1827, 1.1));
    const sun = new T.DirectionalLight(0xffffff, 1.4); sun.position.set(-12, 22, 14); this.scene.add(sun);
    const ground = new T.Mesh(new T.PlaneGeometry(80, 60), new T.MeshStandardMaterial({ color: 0x0a1a2b, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; this.scene.add(ground);
    const grid = new T.GridHelper(80, 40, 0x173149, 0x10243a); grid.position.y = 0.01; this.scene.add(grid);
    // Calles: líneas entre los puntos principales de la ciudad.
    const roadMat = new T.MeshStandardMaterial({ color: 0x14304d, roughness: 1 });
    [[-13, 0, 6, 0], [-6, -9, -6, 9], [6, -9, 6, 9], [0, -8, 0, 6], [-13, -7, -13, 7], [-13, 0, 13, 0]].forEach(([x0, z0, x1, z1]) => {
      const len = Math.hypot(x1 - x0, z1 - z0) || 1, m = new T.Mesh(new T.BoxGeometry(len, 0.02, 0.7), roadMat);
      m.position.set((x0 + x1) / 2, 0.02, (z0 + z1) / 2); m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); this.scene.add(m);
    });
    this.groups = {};
    Object.entries(ACTORS).forEach(([id, a]) => { const g = this.build(a); g.userData.actor = id; this.groups[id] = g; this.scene.add(g); });
    this.pk = {};
    this.ray = new T.Raycaster();
    this.resize();
  }
  mat(color, extra) {
    return new this.T.MeshStandardMaterial(Object.assign({ color, roughness: 0.55, metalness: 0.15, transparent: true, opacity: 1 }, extra || {}));
  }
  build(a) {
    const T = this.T, g = new T.Group(), c = a.c, box = (w, h, d, col, y, x, z, extra) => {
      const m = new T.Mesh(new T.BoxGeometry(w, h, d), this.mat(col, extra)); m.position.set(x || 0, y, z || 0); g.add(m); return m;
    };
    const win = 0x0d2a44;
    switch (a.k) {
      case "bank": box(2.4, 1.7, 2, 0x16324f, 0.85); box(2.6, 0.25, 2.2, c, 1.82); box(1.9, 0.5, 1.4, c, 2.2, 0, 0, { emissive: c, emissiveIntensity: 0.25 });
        [-0.8, -0.27, 0.27, 0.8].forEach((x) => box(0.16, 1.3, 0.16, 0xdfe8f2, 0.75, x, 1.06)); g.userData.h = 2.9; break;
      case "bank-s": box(1.5, 1.4, 1.3, 0x16324f, 0.7); box(1.6, 0.22, 1.4, c, 1.5, 0, 0, { emissive: c, emissiveIntensity: 0.3 }); g.userData.h = 2; break;
      case "tower": box(1.3, 4.6, 1.3, 0x16324f, 2.3); box(1.42, 0.3, 1.42, c, 4.7, 0, 0, { emissive: c, emissiveIntensity: 0.5 });
        [1, 2, 3, 4].forEach((y) => box(1.34, 0.08, 1.34, c, y, 0, 0, { emissive: c, emissiveIntensity: 0.4 })); g.userData.h = 5.3; break;
      case "tower2": box(1, 3.4, 1, c, 1.7, 0, 0, { emissive: c, emissiveIntensity: 0.2 }); box(1.1, 0.2, 1.1, 0xdfe8f2, 3.5); g.userData.h = 4; break;
      case "shop": box(1.9, 1.1, 1.5, 0x173b5c, 0.55); box(2.1, 0.12, 0.7, c, 1.1, 0, 0.9, { emissive: c, emissiveIntensity: 0.3 }); box(1.2, 0.6, 0.05, win, 0.5, 0, 0.76); g.userData.h = 1.7; break;
      case "device": box(0.45, 0.16, 0.7, 0x1b2a3a, 0.08); box(0.36, 0.02, 0.26, c, 0.17, 0, -0.14, { emissive: c, emissiveIntensity: 0.6 }); g.userData.h = 0.8; break;
      case "atm": box(0.8, 1.6, 0.6, 0x1b3550, 0.8); box(0.5, 0.35, 0.04, c, 1.15, 0, 0.31, { emissive: c, emissiveIntensity: 0.6 }); g.userData.h = 2; break;
      case "laptop": box(1, 0.06, 0.7, 0x2a3a4d, 0.03); { const s = box(1, 0.66, 0.05, c, 0.36, 0, -0.33, { emissive: c, emissiveIntensity: 0.45 }); s.rotation.x = -0.2; } g.userData.h = 1.1; break;
      case "phone": box(0.42, 0.8, 0.08, 0x1b2a3a, 0.42); box(0.34, 0.66, 0.02, c, 0.42, 0, 0.05, { emissive: c, emissiveIntensity: 0.6 }); g.userData.h = 1.2; break;
      case "sign": box(0.08, 1.2, 0.08, 0x9dafc2, 0.6); box(0.9, 0.9, 0.06, 0xf5f8fc, 1.55); box(0.5, 0.5, 0.07, 0x06111d, 1.55); g.userData.h = 2.2; break;
      case "person": { const b = new T.Mesh(new T.CylinderGeometry(0.22, 0.3, 0.9, 12), this.mat(c)); b.position.y = 0.45; g.add(b);
        const h = new T.Mesh(new T.SphereGeometry(0.22, 16, 12), this.mat(0xf1d3b3)); h.position.y = 1.1; g.add(h); g.userData.h = 1.5; break; }
      case "server": box(0.9, 1.7, 0.9, 0x2b4d70, 0.85); [0.5, 0.9, 1.3].forEach((y) => box(0.92, 0.08, 0.92, c, y, 0, 0, { emissive: c, emissiveIntensity: 0.6 })); g.userData.h = 2.1; break;
      case "safe": box(1, 1, 1, c, 0.5, 0, 0, { metalness: 0.7, roughness: 0.3 }); { const d = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.06, 16), this.mat(0x2f83ff, { emissive: 0x2f83ff, emissiveIntensity: 0.6 })); d.rotation.x = Math.PI / 2; d.position.set(0, 0.55, 0.52); g.add(d); } g.userData.h = 1.4; break;
      case "hub": { const b = new T.Mesh(new T.CylinderGeometry(1.5, 1.7, 0.6, 24), this.mat(0x16324f)); b.position.y = 0.3; g.add(b);
        const d = new T.Mesh(new T.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), this.mat(c, { emissive: c, emissiveIntensity: 0.35 })); d.position.y = 0.6; g.add(d); g.userData.h = 1.8; break; }
      case "book": box(1, 0.25, 0.75, 0x7a1f2b, 0.13); box(0.92, 0.18, 0.68, c, 0.3); g.userData.h = 0.8; break;
      case "desk": box(1.8, 0.1, 0.9, 0x5b6b7c, 0.75); [-0.8, 0.8].forEach((x) => box(0.08, 0.75, 0.8, 0x3b4b5c, 0.37, x)); [-0.5, 0, 0.5].forEach((x) => box(0.4, 0.3, 0.05, c, 1, x, -0.2, { emissive: c, emissiveIntensity: 0.4 })); g.userData.h = 1.4; break;
    }
    if (["device", "phone", "laptop", "atm", "sign", "book"].includes(a.k)) { g.scale.setScalar(1.7); g.userData.h *= 1.7; }
    g.traverse((o) => { if (o.material) o.userData.baseEm = o.material.emissiveIntensity || 0; });
    return g;
  }
  resize() {
    const w = this.host.clientWidth || 800, h = this.host.clientHeight || 500;
    this.renderer.setSize(w, h, false); this.renderer.domElement.style.width = w + "px"; this.renderer.domElement.style.height = h + "px";
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.w = w; this.h = h;
  }
  packetMesh(kind) {
    const T = this.T, p = PACKET[kind] || PACKET.req;
    let m;
    if (kind === "file") m = new T.Mesh(new T.BoxGeometry(0.9, 0.6, 0.6), this.mat(p.c, { emissive: p.c, emissiveIntensity: 0.25 }));
    else if (kind === "money") m = new T.Mesh(new T.CylinderGeometry(0.35, 0.35, 0.12, 20), this.mat(p.c, { metalness: 0.8, roughness: 0.25, emissive: p.c, emissiveIntensity: 0.3 }));
    else if (kind === "dispute" || kind === "token" || kind === "key") m = new T.Mesh(new T.OctahedronGeometry(0.34), this.mat(p.c, { emissive: p.c, emissiveIntensity: 0.6 }));
    else m = new T.Mesh(new T.SphereGeometry(0.3, 18, 12), this.mat(p.c, { emissive: p.c, emissiveIntensity: 0.8 }));
    this.scene.add(m); return m;
  }
  frame(t) {
    const s = this.s;
    Object.entries(this.groups).forEach(([id, g]) => {
      const vis = s.visible.has(id); g.visible = vis; if (!vis) return;
      g.position.set(s.pos[id][0], 0, s.pos[id][1]);
      const dim = s.hl && !s.hl.includes(id), on = s.hl && s.hl.includes(id);
      g.traverse((o) => { if (o.material) { o.material.opacity = dim ? 0.3 : 1; o.material.depthWrite = !dim; if ("emissiveIntensity" in o.material) o.material.emissiveIntensity = (o.userData.baseEm || 0) + (on ? 0.25 + 0.15 * Math.sin(t * 4) : 0); } });
    });
    const live = new Set();
    s.packets.forEach((p) => {
      live.add(p.id);
      let m = this.pk[p.id]; if (!m) m = this.pk[p.id] = this.packetMesh(p.kind);
      m.position.set(p.x, 1.4 + 0.15 * Math.sin(t * 6 + p.id), p.z); m.rotation.y = t * 2;
    });
    Object.keys(this.pk).forEach((id) => { if (!live.has(+id)) { this.scene.remove(this.pk[id]); delete this.pk[id]; } });
    const c = s.cam, cp = Math.cos(c.pitch);
    this.camera.position.set(c.x + c.d * cp * Math.sin(c.yaw), c.d * Math.sin(c.pitch), c.z + c.d * cp * Math.cos(c.yaw));
    this.camera.lookAt(c.x, 0.6, c.z);
    this.renderer.render(this.scene, this.camera);
  }
  project(x, y, z) {
    const v = new this.T.Vector3(x, y, z).project(this.camera);
    return { x: (v.x + 1) / 2 * this.w, y: (1 - v.y) / 2 * this.h, behind: v.z > 1 };
  }
  actorHeight(id) { return (this.groups[id] && this.groups[id].userData.h) || 1.5; }
  pick(px, py) {
    const T = this.T, v = new T.Vector2(px / this.w * 2 - 1, -(py / this.h) * 2 + 1);
    this.ray.setFromCamera(v, this.camera);
    const hits = this.ray.intersectObjects(Object.values(this.groups).filter((g) => g.visible), true);
    for (const h of hits) { let o = h.object; while (o && !o.userData.actor) o = o.parent; if (o) return o.userData.actor; }
    return null;
  }
  dispose() { try { this.renderer.dispose(); this.renderer.domElement.remove(); } catch (_) {} }
}

/* ---------- Dibujo 2D (canvas) ---------- */
class Renderer2D {
  constructor(host, state) {
    this.host = host; this.s = state;
    this.cv = document.createElement("canvas"); host.appendChild(this.cv);
    this.ctx = this.cv.getContext("2d"); this.resize();
  }
  resize() {
    const r = Math.min(window.devicePixelRatio || 1, 2), w = this.host.clientWidth || 800, h = this.host.clientHeight || 500;
    this.cv.width = w * r; this.cv.height = h * r; this.cv.style.width = w + "px"; this.cv.style.height = h + "px";
    this.ctx.setTransform(r, 0, 0, r, 0, 0); this.w = w; this.h = h;
  }
  scale() { return Math.min(this.w, this.h * 1.4) / (this.s.cam.d * 1.05); }
  toScreen(x, z) { const k = this.scale(); return { x: this.w / 2 + (x - this.s.cam.x) * k, y: this.h / 2 + (z - this.s.cam.z) * k * 0.78 }; }
  frame(t) {
    const g = this.ctx, s = this.s, k = this.scale();
    g.fillStyle = "#06111d"; g.fillRect(0, 0, this.w, this.h);
    g.strokeStyle = "#10243a"; g.lineWidth = 1;
    for (let i = -40; i <= 40; i += 2) { const a = this.toScreen(i, -30), b = this.toScreen(i, 30); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); const c = this.toScreen(-40, i), d = this.toScreen(40, i); g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(d.x, d.y); g.stroke(); }
    g.strokeStyle = "#14304d"; g.lineWidth = Math.max(4, k * 0.6);
    [[-13, 0, 6, 0], [-6, -9, -6, 9], [6, -9, 6, 9], [0, -8, 0, 6], [-13, -7, -13, 7], [-13, 0, 13, 0]].forEach(([x0, z0, x1, z1]) => { const a = this.toScreen(x0, z0), b = this.toScreen(x1, z1); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); });
    const size = Math.max(26, Math.min(58, k * 1.6));
    [...s.visible].forEach((id) => {
      const a = ACTORS[id], p = this.toScreen(...s.pos[id]), dim = s.hl && !s.hl.includes(id), on = s.hl && s.hl.includes(id);
      g.globalAlpha = dim ? 0.25 : 1;
      const col = "#" + a.c.toString(16).padStart(6, "0");
      g.fillStyle = "#0d2135"; g.strokeStyle = col; g.lineWidth = on ? 3 + Math.sin(t * 4) : 2;
      const r = size / 2; g.beginPath(); g.roundRect(p.x - r, p.y - r, size, size, 10); g.fill(); g.stroke();
      g.font = `${Math.round(size * 0.5)}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#f5f8fc";
      g.fillText(KIND_GLYPH[a.k] || "■", p.x, p.y + 1);
      g.globalAlpha = 1;
    });
    s.packets.forEach((pk) => {
      const p = this.toScreen(pk.x, pk.z), d = PACKET[pk.kind] || PACKET.req;
      g.fillStyle = d.css; g.beginPath(); g.arc(p.x, p.y - size * 0.15, Math.max(7, size * 0.2), 0, Math.PI * 2); g.fill();
      if (pk.kind === "file" || pk.kind === "money" || pk.kind === "key") { g.font = `${Math.round(size * 0.32)}px sans-serif`; g.fillStyle = "#06111d"; g.fillText(d.g === "📄" ? "≡" : d.g === "🔑" ? "k" : "$", p.x, p.y - size * 0.15); }
    });
  }
  project(x, y, z) { const p = this.toScreen(x, z); return { x: p.x, y: p.y - Math.max(26, Math.min(58, this.scale() * 1.6)) * 0.5 - 4 - (y > 0 ? 0 : 0), behind: false }; }
  actorHeight() { return 0; }
  pick(px, py) {
    let best = null, bd = 1e9; const size = Math.max(26, Math.min(58, this.scale() * 1.6));
    [...this.s.visible].forEach((id) => { const p = this.toScreen(...this.s.pos[id]), d = Math.hypot(p.x - px, p.y - py); if (d < size * 0.75 && d < bd) { bd = d; best = id; } });
    return best;
  }
  dispose() { this.cv.remove(); }
}

/* ---------- Mundo: API usada por la lección ---------- */
export class World {
  constructor(host) {
    this.host = host; this.s = new State(); this.mode = null; this.r = null; this.pid = 1; this.epoch = 0; this.onPick = null; this.speed = 1;
    this.layer = document.createElement("div"); this.layer.className = "fx-labels"; host.appendChild(this.layer);
    this.lbl = {};
    Object.entries(ACTORS).forEach(([id, a]) => {
      const el = document.createElement("div"); el.className = "fx-lbl"; el.dataset.id = id; el.innerHTML = `<b>${a.n}</b><i></i>`;
      el.onclick = (e) => { e.stopPropagation(); if (this.onPick) this.onPick(id); };
      this.layer.appendChild(el); this.lbl[id] = el;
    });
    this.frameTimes = []; this.slow = false;
    this._loop = this._loop.bind(this); this.last = performance.now(); this.t = 0;
    this._bindInput();
    new ResizeObserver(() => this.r && this.r.resize()).observe(host);
  }
  static webglOk() {
    try { const c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); } catch (_) { return false; }
  }
  async setMode(mode) {
    if (mode === "3d" && !World.webglOk()) mode = "2d";
    if (this.r) this.r.dispose();
    this.r = null;
    if (mode === "3d") {
      try { const THREE = await import("/js/vendor/three.module.min.js"); this.r = new Renderer3D(THREE, this.host, this.s, this.layer); }
      catch (e) { console.warn("3D no disponible", e); mode = "2d"; }
    }
    if (!this.r) this.r = new Renderer2D(this.host, this.s);
    this.host.insertBefore(this.r.renderer ? this.r.renderer.domElement : this.r.cv, this.layer);
    this.mode = mode; this.frameTimes = [];
    if (!this.running) { this.running = true; requestAnimationFrame(this._loop); }
    return mode;
  }
  _loop(now) {
    const dt = Math.min(0.1, (now - this.last) / 1000); this.last = now; this.t += dt;
    if (this.mode === "3d" && this.frameTimes.length < 90) { this.frameTimes.push(dt); if (this.frameTimes.length === 90) { const avg = this.frameTimes.slice(20).reduce((a, b) => a + b, 0) / 70; if (avg > 0.06 && this.onSlow) this.onSlow(avg); } }
    this.s.update(dt * this.speed);
    if (this.r) { this.r.frame(this.t); this._labels(); }
    requestAnimationFrame(this._loop);
  }
  _labels() {
    const s = this.s;
    Object.entries(this.lbl).forEach(([id, el]) => {
      if (!s.visible.has(id)) { el.style.display = "none"; return; }
      const [x, z] = s.pos[id], p = this.r.project(x, this.r.actorHeight(id) + 0.35, z);
      if (p.behind || p.x < -80 || p.y < -40 || p.x > this.r.w + 80 || p.y > this.r.h + 40) { el.style.display = "none"; return; }
      el.style.display = ""; el.style.transform = `translate(${Math.round(p.x)}px,${Math.round(p.y)}px) translate(-50%,-100%)`;
      el.classList.toggle("dim", !!(s.hl && !s.hl.includes(id))); el.classList.toggle("on", !!(s.hl && s.hl.includes(id)));
      const tag = s.tags[id] || ""; const i = el.querySelector("i"); if (i.textContent !== tag) i.textContent = tag; el.classList.toggle("tagged", !!tag);
    });
  }
  _bindInput() {
    let drag = null;
    this.host.addEventListener("pointerdown", (e) => { if (e.target.closest(".fx-lbl")) return; drag = { x: e.clientX, y: e.clientY, yaw: this.s.cam.yaw, pitch: this.s.cam.pitch, moved: false }; });
    window.addEventListener("pointermove", (e) => {
      if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      if (this.mode === "3d" && drag.moved) { this.s.cam.yaw = drag.yaw - dx * 0.006; this.s.cam.pitch = Math.max(0.45, Math.min(1.35, drag.pitch + dy * 0.004)); }
    });
    window.addEventListener("pointerup", (e) => {
      if (!drag) return; const wasDrag = drag.moved; drag = null; if (wasDrag || !this.r) return;
      const rc = this.host.getBoundingClientRect(); if (e.clientX < rc.left || e.clientX > rc.right || e.clientY < rc.top || e.clientY > rc.bottom) return;
      const id = this.r.pick(e.clientX - rc.left, e.clientY - rc.top); if (id && this.onPick) this.onPick(id);
    });
    this.host.addEventListener("wheel", (e) => { e.preventDefault(); this.s.cam.d = Math.max(8, Math.min(60, this.s.cam.d * (e.deltaY > 0 ? 1.08 : 0.93))); }, { passive: false });
  }
  /* ---- Acciones de guion ---- */
  reset(visible) { this.s.reset(visible); }
  show(ids) { ids.forEach((id) => this.s.visible.add(id)); }
  hide(ids) { ids.forEach((id) => this.s.visible.delete(id)); }
  highlight(ids) { this.s.hl = ids && ids.length ? ids.slice() : null; }
  tag(map) { this.s.tags = Object.assign({}, map || {}); }
  camTo(target, instant) {
    const s = this.s, c = s.cam, from = Object.assign({}, c);
    let to;
    if (!target || target === "overview") { const b = s.bbox(); to = { x: b.cx, z: b.cz, d: Math.max(14, b.ext * 1.35 + 6) }; }
    else if (Array.isArray(target)) { const b = s.bbox(target); to = { x: b.cx, z: b.cz, d: Math.max(10, b.ext * 1.4 + 6) }; }
    else { const p = s.pos[target] || [0, 0]; to = { x: p[0], z: p[1], d: 15 }; }
    const asp = (this.host.clientWidth || 800) / (this.host.clientHeight || 500);
    if (asp < 1.2) to.d *= Math.pow(1.2 / asp, 0.85);
    if (instant) { Object.assign(c, to); return Promise.resolve(); }
    return s.tween(0.9, (k) => { c.x = from.x + (to.x - from.x) * k; c.z = from.z + (to.z - from.z) * k; c.d = from.d + (to.d - from.d) * k; });
  }
  move(id, to) { const s = this.s, from = s.pos[id].slice(); return s.tween(1.2, (k) => { s.pos[id] = [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k]; }); }
  async packet(route, kind) {
    const s = this.s, pk = { id: this.pid++, kind: kind || "req", x: 0, z: 0 }, ep = this.epoch;
    const pts = route.map((id) => s.pos[id]).filter(Boolean);
    if (pts.length < 2) return;
    pk.x = pts[0][0]; pk.z = pts[0][1]; s.packets.push(pk);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      await s.tween(HOP_S, (k) => { pk.x = a[0] + (b[0] - a[0]) * k; pk.z = a[1] + (b[1] - a[1]) * k; });
      if (ep !== this.epoch) return;
    }
    await s.tween(0.25, () => {});
    s.packets = s.packets.filter((p) => p !== pk);
  }
  clearPackets() { this.epoch++; const tw = this.s.tweens; this.s.tweens = []; this.s.packets = []; tw.forEach((t) => t.res()); }
}
