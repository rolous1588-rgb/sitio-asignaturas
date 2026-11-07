// ============================================================
// Lápiz fugaz (06/11/2026): rayas que se desvanecen solas a los ~2,5 s para señalar algo en la pantalla compartida.
// Botón ✏ abajo a la izquierda, o tecla L para activar/desactivar; Esc lo apaga. Colores: rojo, amarillo, azul, verde.
// Con el lápiz activo, el ratón o el dedo dibujan sobre la página; apagado, la página se usa normal.
// ============================================================
(function () {
  if (window.__lapiz) return;
  window.__lapiz = true;
  const DUR = 2500, DESV = 700, COL = ['#E24B4A', '#FFC400', '#378ADD', '#2BD65B'];
  let activo = false, col = 0, trazos = [], actual = null, raf = 0;
  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:9998;pointer-events:none;touch-action:none;cursor:crosshair';
  const ctx = cv.getContext('2d');
  const barra = document.createElement('div');
  barra.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:9999;display:flex;gap:6px;align-items:center;background:rgba(255,255,255,.92);border:1px solid #cfd6df;border-radius:999px;padding:4px 8px;opacity:.55;font:14px system-ui,sans-serif';
  const bt = document.createElement('button');
  bt.type = 'button'; bt.textContent = '✏'; bt.title = 'Lápiz fugaz (tecla L)';
  bt.style.cssText = 'border:0;background:transparent;font-size:18px;cursor:pointer;padding:2px 6px;border-radius:999px';
  barra.appendChild(bt);
  const pts = COL.map((c, i) => { const d = document.createElement('button'); d.type = 'button'; d.title = 'Color'; d.style.cssText = `width:18px;height:18px;border-radius:50%;border:2px solid ${i === 0 ? '#222' : 'transparent'};background:${c};cursor:pointer;padding:0;display:none`; d.onclick = () => { col = i; pts.forEach((x, j) => (x.style.borderColor = j === i ? '#222' : 'transparent')); }; barra.appendChild(d); return d; });
  const tam = () => { const r = window.devicePixelRatio || 1; cv.width = innerWidth * r; cv.height = innerHeight * r; ctx.setTransform(r, 0, 0, r, 0, 0); };
  const pon = (v) => {
    activo = v; cv.style.pointerEvents = v ? 'auto' : 'none';
    bt.style.background = v ? '#2BD65B' : 'transparent'; barra.style.opacity = v ? '1' : '.55';
    pts.forEach((d) => (d.style.display = v ? 'inline-block' : 'none'));
  };
  const pinta = (ahora) => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    trazos = trazos.filter((t) => ahora - t.p[t.p.length - 1].t < DUR + (t === actual ? 1e9 : 0));
    trazos.forEach((t) => {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = t.c;
      for (let i = 1; i < t.p.length; i++) {
        const a = t.p[i - 1], b = t.p[i], edad = ahora - b.t;
        const al = t === actual && actual.vivo ? 1 : Math.max(0, Math.min(1, (DUR - edad) / DESV));
        if (al <= 0) continue;
        ctx.globalAlpha = al; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
    if (trazos.length) raf = requestAnimationFrame((t) => pinta(performance.now())); else raf = 0;
  };
  const arranca = () => { if (!raf) raf = requestAnimationFrame(() => pinta(performance.now())); };
  cv.addEventListener('pointerdown', (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); actual = { c: COL[col], p: [{ x: e.clientX, y: e.clientY, t: performance.now() }], vivo: true }; trazos.push(actual); arranca(); });
  cv.addEventListener('pointermove', (e) => { if (actual && actual.vivo) { actual.p.push({ x: e.clientX, y: e.clientY, t: performance.now() }); arranca(); } });
  const fin = () => { if (actual) { actual.vivo = false; actual.p.forEach((q) => (q.t = performance.now())); actual = null; arranca(); } };
  cv.addEventListener('pointerup', fin); cv.addEventListener('pointercancel', fin);
  bt.onclick = () => pon(!activo);
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.matches && e.target.matches('input,select,textarea')) return;
    if (e.key === 'l' || e.key === 'L') pon(!activo);
    if (e.key === 'Escape' && activo) pon(false);
  });
  addEventListener('resize', tam);
  const montar = () => { tam(); document.body.appendChild(cv); document.body.appendChild(barra); };
  if (document.body) montar(); else document.addEventListener('DOMContentLoaded', montar);
})();
