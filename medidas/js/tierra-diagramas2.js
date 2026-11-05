// ============================================================
// Medidas Eléctricas · Diagramas explicativos de puesta a tierra (05/11/2026)
//   FP.diagramas.campoTierra     Cómo mide el telurómetro: corriente en el suelo,
//                                tensión con colores y curva de tensión en la superficie
//   FP.diagramas.formasTierra    ¿Qué forma conviene? jabalina; varias; horizontal; malla
//   FP.diagramas.prepararTierra  Suelo y relleno: de dónde sale R (parte cercana + lejana)
//   FP.diagramas.instalarTierra  Instalación paso a paso (8 pasos con qué y por qué)
// Fórmulas: Dwight (jabalina); resistencias mutuas por potencial medio (varias jabalinas);
//   Sunde (conductor horizontal); Sverak, IEEE 80 (malla); electrodo con relleno:
//   R = [ρ_relleno·ln(D_pozo/d) + ρ_suelo·(ln(8L/D_pozo) − 1)] / (2πL)
// Modelo: jabalina E de largo L (fuente de línea con su imagen) y pica H de 0,4 m.
//   u(r, z) = ρ/(4πL)·ln[(L − z + √(r² + (L − z)²)) / (−L − z + √(r² + (L + z)²))]
//   en la superficie (z = 0) queda ρ/(2πL)·asinh(L/r), igual que en tierra-diagramas.js.
// Requiere fp-diagramas.js y tierra-diagramas.js (FP.tierra y sus utilidades FP.tierra._h).
// ============================================================
(function () {
  const FP = (window.FP = window.FP || {});
  const D = FP.diagramas;
  const COL = FP.COL;
  const { f } = FP.fmt;
  const M = FP.tierra;
  const { base, api, txt, lin, ini, par, marcar, fR, TG, TS, L_H } = M._h;

  // ---------- utilidades ----------
  // parte un texto en renglones de hasta n caracteres
  const renglones = (s, n) => {
    const out = []; let r = '';
    s.split(' ').forEach((w) => { if ((r + ' ' + w).trim().length > n) { out.push(r.trim()); r = w; } else r += ' ' + w; });
    if (r.trim()) out.push(r.trim());
    return out;
  };
  // franja de explicación arriba del dibujo
  const franja = (lineas, y0 = 8) => {
    let s = `<rect x="8" y="${y0}" width="984" height="${lineas.length * 46 + 18}" rx="18" fill="#eaf1fb"/>`;
    lineas.forEach((l, k) => { s += txt(28, y0 + 46 + k * 46, l, { tam: TS, col: '#123f7a', anc: 'start', peso: k === 0 ? 700 : 600, halo: false }); });
    return s;
  };
  // flechas ◀ Paso n de N ▶ en la columna lateral
  const pasos = (b, total, e, alCambiar) => {
    const fila = b.botones([
      { texto: '◀', accion: () => { if (e.etapa > 1) { e.etapa--; alCambiar(); } } },
      { texto: '', accion: () => {} },
      { texto: '▶', accion: () => { if (e.etapa < total) { e.etapa++; alCambiar(); } } }
    ]);
    fila.classList.add('stepper');
    const [a, c, z] = fila.querySelectorAll('button');
    a.classList.add('grande'); z.classList.add('grande'); c.classList.add('contador');
    return () => {
      c.innerHTML = `${e.etapa}<small>de ${total}</small>`;
      a.disabled = e.etapa <= 1; z.disabled = e.etapa >= total;
    };
  };
  const cajaEquipo = (x, y, w, h, lineas) => {
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#fff" stroke="${COL.texto}" stroke-width="4"/>`;
    lineas.forEach((l, k) => { s += txt(x + w / 2, y + 36 + k * 40, l.t, { tam: l.tam || TS - 6, col: l.col || COL.texto, mono: !!l.mono, peso: l.peso || 700 }); });
    return s;
  };

  // potencial en el suelo por amperio de una varilla vertical de largo L (con su imagen)
  const uRod = (rho, L, r, z) => {
    r = Math.max(r, 0.12);
    const n = L - z + Math.sqrt(r * r + (L - z) * (L - z));
    const d = -L - z + Math.sqrt(r * r + (L + z) * (L + z));
    return (rho / (4 * Math.PI * L)) * Math.log(n / d);
  };
  M.uRod = uRod;

  // ============================================================
  // Cómo mide el telurómetro: corriente, tensión y zona plana
  // ============================================================
  D.campoTierra = (cont, opc) => {
    const b = base(cont, opc);
    const p = { rho: par(opc, 'rho', 100), L: par(opc, 'L', 2.4), I: par(opc, 'I', 0.02) };
    const e = { D: ini(opc, 'D', 25), x: ini(opc, 'x', 15.5), etapa: ini(opc, 'etapa', 1) };
    const xMax = () => e.D - 0.5;
    b.tile('V', 'Tensión entre E y S');
    b.tile('R', 'R = V / I', true);
    b.slider({
      id: 'D', etiqueta: 'Pica H a', min: 6, max: 40, paso: 1, valor: e.D, formato: (v) => f(v, 0) + ' m',
      alMover: (v) => { e.D = v; b.sliders.x.input.max = xMax(); if (e.x > xMax()) e.x = xMax(); b.sliders.x.fijar(e.x); lineas = null; }
    });
    b.slider({ id: 'x', etiqueta: 'Pica S a', min: 0.5, max: xMax(), paso: 0.5, valor: e.x, formato: (v) => f(v, 1) + ' m', alMover: (v) => { e.x = Math.min(v, xMax()); } });
    const sincronizar = () => {
      b.sliders.D.fijar(e.D);
      b.sliders.x.input.max = xMax();
      b.sliders.x.fijar(e.x);
      lineas = null;
    };
    const verPaso = pasos(b, 4, e, () => {
      if (e.etapa === 4) { e.D = 8; e.x = 5; }
      else if (e.D === 8 && e.x === 5) { e.D = 25; e.x = 15.5; }
      sincronizar();
    });

    const RE = () => M.re(p.rho, p.L);
    const VE = () => RE() - M.uH(p.rho, e.D);                     // potencial de E por amperio
    const V = (x, z) => uRod(p.rho, p.L, Math.abs(x), z) - uRod(p.rho, L_H, Math.abs(x - e.D), z);
    const vSup = (x) => M.uE(p.rho, p.L, Math.abs(x)) - M.uH(p.rho, Math.abs(e.D - x));

    // líneas de corriente: se siguen desde la jabalina en el sentido de −∇V hasta llegar a H
    let lineas = null;
    const trazar = () => {
      const L = p.L, Dd = e.D, h = 0.004;
      const inicios = [[0.15, 0.12 * L], [0.15, 0.38 * L], [0.15, 0.64 * L], [0.15, 0.88 * L], [0.1, L + 0.12], [0, L + 0.15],
        [-0.1, L + 0.12], [-0.15, 0.8 * L], [-0.15, 0.45 * L], [-0.15, 0.15 * L]];
      return inicios.map(([x, z]) => {
        const pts = [[0, Math.min(z, L)], [x, z]];
        let largo = 0;
        for (let k = 0; k < 4000; k++) {
          const gx = (V(x + h, z) - V(x - h, z)) / (2 * h);
          const gz = (V(x, z + h) - V(x, Math.max(z - h, 0)) ) / (z > h ? 2 * h : h + z);
          const g = Math.hypot(gx, gz) || 1;
          const dE = z < L ? Math.abs(x) : Math.hypot(x, z - L);
          const dH = Math.hypot(x - Dd, z - 0.2);
          if (dH < 0.3) { pts.push([Dd, 0.25]); break; }
          const ds = Math.min(Math.max(0.07 * Math.min(dE, dH), 0.03), 0.9);
          x -= (gx / g) * ds; z -= (gz / g) * ds;
          if (z < 0.002) z = 0.002;
          largo += ds;
          if (k % 3 === 0) pts.push([x, z]);
          if (largo > 12 * Dd || Math.abs(x) > 5 * Dd || z > 4 * Dd) break;
        }
        return pts;
      });
    };

    b.pintar = () => {
      verPaso();
      const k = 880 / (e.D + 4);                  // píxeles por metro (la misma escala en x y en z)
      const X = (m) => 60 + (m + 2) * k;
      const gy = 214, fondo = 436;
      const Z = (z) => gy + z * k;
      const ve = VE(), I = p.I;
      let s = '';
      // explicación del paso
      const sv = vSup(e.x);
      const rel = sv / ve;
      const textos = {
        1: '1. El equipo inyecta corriente alterna entre E y H: en el suelo se abre y vuelve a H.',
        2: '2. Naranja: tensión alta (cerca de E). Azul: negativa (cerca de H). Crema: casi 0 V.',
        3: '3. Con S en la zona plana (0 V) se mide toda la tensión de E. Entonces R = V / I.',
        4: '4. Con H cerca no hay zona plana: la lectura cambia al mover S. H debe ir lejos.'
      };
      s += franja(renglones(textos[e.etapa], 45));

      // suelo con la tensión en colores (desde el paso 2)
      s += `<defs><clipPath id="cl-suelo"><rect x="0" y="${gy}" width="1000" height="${fondo - gy}"/></clipPath></defs>`;
      s += `<rect x="0" y="${gy}" width="1000" height="${fondo - gy}" fill="#fbf8f1"/>`;
      if (e.etapa >= 2) {
        const cols = 64, filas = 18;
        const x0 = -2, x1 = e.D + 2, zMax = (fondo - gy) / k;
        const dx = (x1 - x0) / cols, dz = zMax / filas;
        const um = [0.04, 0.12, 0.25, 0.45, 0.7];
        const calido = ['#fbf8f1', '#fdecd9', '#f9d3ad', '#f4b47b', '#ec9150', '#e0782b'];
        const frio = ['#fbf8f1', '#e6eff9', '#cbdcf2', '#a8c4e9', '#82a9de', '#5b8fd6'];
        for (let i = 0; i < cols; i++) for (let j = 0; j < filas; j++) {
          const xm = x0 + (i + 0.5) * dx, zm = (j + 0.5) * dz;
          const t = V(xm, zm) / ve;
          let n = 0; while (n < 5 && Math.abs(t) >= um[n]) n++;
          if (!n) continue;
          s += `<rect x="${X(x0 + i * dx).toFixed(1)}" y="${Z(j * dz).toFixed(1)}" width="${(dx * k + 0.8).toFixed(1)}" height="${(dz * k + 0.8).toFixed(1)}" fill="${t > 0 ? calido[n] : frio[n]}"/>`;
        }
      }
      // líneas de corriente con puntos que se mueven
      if (!lineas) lineas = trazar();
      s += `<g clip-path="url(#cl-suelo)">`;
      lineas.forEach((pts, n) => {
        const d = 'M' + pts.map(([x, z]) => X(x).toFixed(1) + ',' + Z(z).toFixed(1)).join(' L');
        let largo = 0;
        for (let q = 1; q < pts.length; q++) largo += Math.hypot((pts[q][0] - pts[q - 1][0]) * k, (pts[q][1] - pts[q - 1][1]) * k);
        s += `<path d="${d}" fill="none" stroke="#5c6878" stroke-width="2.5" stroke-opacity=".55"/>`;
        const dur = Math.max(2, largo / 140);
        for (let q = 0; q < 3; q++) {
          s += `<circle r="7" fill="#16202c" stroke="#fff" stroke-width="2"><animateMotion dur="${dur.toFixed(1)}s" repeatCount="indefinite" begin="${(-(q / 3) * dur - n * 0.37).toFixed(2)}s" path="${d}"/></circle>`;
        }
      });
      s += `</g>`;
      s += lin(0, gy, 1000, gy, COL.t2, 4);

      // equipo y cables
      const eqW = 230, eqY = 128, eqX = Math.min(Math.max(X(e.D / 2) - eqW / 2, X(0) + 40), X(e.D) - eqW - 40);
      s += cajaEquipo(eqX, eqY, eqW, 60, [{ t: 'I = ' + f(I * 1000, 0) + ' mA', mono: true, col: COL.i, tam: TS - 4 }]);
      s += `<path d="M${eqX},${eqY + 30} H${X(0)} V${gy}" fill="none" stroke="${COL.texto}" stroke-width="4"/>`;
      s += `<path d="M${eqX + eqW},${eqY + 30} H${X(e.D)} V${gy}" fill="none" stroke="${COL.i}" stroke-width="4"/>`;
      if (e.etapa >= 3) s += `<path d="M${eqX + eqW / 2},${eqY + 60} V${gy - 16} H${X(e.x)} V${gy}" fill="none" stroke="${COL.v}" stroke-width="4"/>`;
      // electrodo y picas
      s += `<rect x="${X(0) - 6}" y="${gy}" width="12" height="${(p.L * k).toFixed(1)}" fill="${COL.texto}"/>`;
      s += `<rect x="${X(e.D) - 5}" y="${gy}" width="10" height="${Math.max(14, L_H * k).toFixed(1)}" fill="${COL.i}"/>`;
      s += txt(X(0) - 14, gy - 10, 'E', { tam: TS, col: COL.texto, peso: 800, anc: 'end' });
      s += txt(X(e.D) + 14, gy - 10, 'H', { tam: TS, col: COL.i, peso: 800, anc: 'start' });
      if (e.etapa >= 3) {
        s += `<rect x="${X(e.x) - 5}" y="${gy}" width="10" height="${Math.max(14, 0.4 * k).toFixed(1)}" fill="${COL.v}"/>`;
        s += txt(X(e.x) + 12, gy - 24, 'S', { tam: TS, col: COL.v, peso: 800, anc: 'start' });
      }

      // curva de tensión en la superficie (desde el paso 2)
      const y0 = 452, y1 = 594, vTop = 1.15, vBot = -1.25;
      const Y = (t) => y0 + ((vTop - Math.max(vBot, Math.min(vTop, t))) / (vTop - vBot)) * (y1 - y0);
      let plana = null;
      if (e.etapa >= 2) {
        // zona plana: donde la tensión del suelo es menor que el 5 % de la de E
        let zi = null, zf = null;
        for (let xm = 0.5; xm <= e.D - 0.5; xm += 0.1) { if (Math.abs(vSup(xm) / ve) < 0.05) { if (zi == null) zi = xm; zf = xm; } }
        plana = zi != null && zf - zi >= 2 ? [zi, zf] : null;
        if (plana) {
          s += `<rect x="${X(zi).toFixed(1)}" y="${y0}" width="${(X(zf) - X(zi)).toFixed(1)}" height="${y1 - y0}" fill="#e3f4ea"/>`;
          s += txt((X(zi) + X(zf)) / 2, Y(0) + 38, 'zona plana', { tam: TS - 6, col: COL.ok, peso: 700 });
        } else {
          s += txt(X(e.D / 2), Y(0) + 38, 'sin zona plana', { tam: TS - 6, col: COL.mal, peso: 800 });
        }
        s += lin(X(-2), Y(0), X(e.D + 2), Y(0), COL.t3, 2.5, 'stroke-dasharray="10 8"');
        s += txt(X(e.D + 2) - 4, Y(0) - 10, '0 V', { tam: TS - 8, col: COL.t3, anc: 'end' });
        const pts = [];
        for (let q = 0; q <= 160; q++) { const xm = 0.25 + (q / 160) * (e.D - 0.5); pts.push(X(xm).toFixed(1) + ',' + Y(vSup(xm) / ve).toFixed(1)); }
        s += `<polyline points="${pts.join(' ')}" fill="none" stroke="${COL.texto}" stroke-width="4"/>`;
        s += lin(X(-2), Y(1), X(1.2), Y(1), COL.i, 4);
        s += txt(X(-2), Y(1) - 10, 'V de E', { tam: TS - 8, col: COL.i, anc: 'start' });
        s += txt(X(-2), y1 - 6, 'Tensión en la superficie', { tam: TS - 10, col: COL.t3, anc: 'start', peso: 600 });
      }
      if (e.etapa >= 3) {
        const yS = Y(rel);
        s += lin(X(e.x), Y(1), X(e.x), yS, COL.v, 5);
        s += lin(X(e.x) - 14, Y(1), X(e.x) + 14, Y(1), COL.v, 5);
        s += `<circle cx="${X(e.x).toFixed(1)}" cy="${yS.toFixed(1)}" r="10" fill="#fff" stroke="${COL.v}" stroke-width="4"/>`;
        s += lin(X(1.2), Y(1), X(e.x), Y(1), COL.i, 2, 'stroke-dasharray="6 8"');
        s += txt(X(e.x) + 18, (Y(1) + yS) / 2 + 12, 'V medido', { tam: TS - 8, col: COL.v, anc: X(e.x) > 760 ? 'end' : 'start' });
      }
      b.svg.innerHTML = s;

      if (e.etapa >= 3) {
        const Vm = (ve - sv) * I;
        b.set('V', f(Vm, 2) + ' V');
        b.set('R', fR(ve - sv) + ' Ω', plana && e.x >= plana[0] && e.x <= plana[1] ? 'ok' : 'duda');
      } else { b.set('V', '—'); b.set('R', '—'); }
    };
    b.pintar();
    return api(b, e, sincronizar);
  };

  // ---------- resistencia de distintas formas de electrodo (suelo homogéneo) ----------
  const DIAM = 0.016;                                   // jabalina de 16 mm
  M.rJab = (rho, L, d) => (rho / (2 * Math.PI * L)) * (Math.log((8 * L) / (d || DIAM)) - 1);          // Dwight
  // resistencia mutua entre dos jabalinas de largo L separadas s: potencial medio sobre la otra
  M.rMutua = (rho, L, s) => { let t = 0; const n = 24; for (let i = 0; i < n; i++) t += uRod(rho, L, s, ((i + 0.5) / n) * L); return t / n; };
  // n jabalinas iguales en línea, separadas s, unidas: todas al mismo potencial
  M.rVarias = (rho, L, n, s) => {
    if (n <= 1) return M.rJab(rho, L);
    const A = [];
    for (let i = 0; i < n; i++) { A.push([]); for (let j = 0; j < n; j++) A[i].push(i === j ? M.rJab(rho, L) : M.rMutua(rho, L, Math.abs(i - j) * s)); }
    const x = new Array(n).fill(1);                    // resolver A·I = 1 (potencial unitario)
    for (let c = 0; c < n; c++) {
      for (let r = c + 1; r < n; r++) { const m = A[r][c] / A[c][c]; for (let k = c; k < n; k++) A[r][k] -= m * A[c][k]; x[r] -= m * x[c]; }
    }
    const I = new Array(n).fill(0);
    for (let r = n - 1; r >= 0; r--) { let t = x[r]; for (let k = r + 1; k < n; k++) t -= A[r][k] * I[k]; I[r] = t / A[r][r]; }
    return 1 / I.reduce((a, c) => a + c, 0);
  };
  // conductor horizontal de largo l enterrado a h (Sunde), cable de 35 mm²
  M.rHoriz = (rho, l, h) => (rho / (Math.PI * l)) * (Math.log((2 * l) / Math.sqrt(2 * 0.0033 * h)) - 1);
  // malla cuadrada de lado l con cuadrícula s a 0,5 m (Sverak, IEEE 80)
  M.rMalla = (rho, l, s, h = 0.5) => {
    const nc = Math.floor(l / s + 1e-9) + 1, LT = 2 * nc * l, A = l * l;
    return rho * (1 / LT + (1 / Math.sqrt(20 * A)) * (1 + 1 / (1 + h * Math.sqrt(20 / A))));
  };

  // barras horizontales de comparación
  const barras = (y0, filas, max) => {
    let s = '';
    filas.forEach((q, k) => {
      const y = y0 + k * 62, w = Math.max(6, (Math.min(q.v, max) / max) * 560);
      s += txt(30, y + 34, q.t, { tam: TS - 8, col: COL.t2, anc: 'start', peso: 600 });
      s += `<rect x="330" y="${y + 6}" width="${w.toFixed(1)}" height="40" rx="8" fill="${q.col}"/>`;
      s += txt(340 + w, y + 38, fR(q.v) + ' Ω', { tam: TS - 4, col: q.col, anc: 'start', peso: 800, mono: true });
    });
    return s;
  };

  // ============================================================
  // ¿Qué forma conviene? Una jabalina; varias; conductor horizontal; malla
  // ============================================================
  D.formasTierra = (cont, opc) => {
    const b = base(cont, opc);
    const rho = par(opc, 'rho', 100);
    const e = { etapa: ini(opc, 'etapa', 1), v: Object.assign({ L: 2.4, d: 16, n: 3, s: 1, lw: 10, h: 0.6, lm: 10, sm: 5 }, ini(opc, 'v', {})) };
    const CFG = {
      1: { A: ['L', 'Largo de la jabalina', 1, 6, 0.1, (v) => f(v, 1) + ' m'], B: ['d', 'Grosor de la jabalina', 10, 25, 1, (v) => f(v, 0) + ' mm'] },
      2: { A: ['n', 'Número de jabalinas', 1, 6, 1, (v) => f(v, 0)], B: ['s', 'Separación entre ellas', 0.3, 8, 0.1, (v) => f(v, 1) + ' m'] },
      3: { A: ['lw', 'Largo del conductor', 2, 40, 1, (v) => f(v, 0) + ' m'], B: ['h', 'Profundidad', 0.3, 1.5, 0.1, (v) => f(v, 1) + ' m'] },
      4: { A: ['lm', 'Lado de la malla', 4, 30, 1, (v) => f(v, 0) + ' m'], B: ['sm', 'Cuadrícula cada', 2, 10, 1, (v) => f(v, 0) + ' m'] }
    };
    b.tile('R', 'Resistencia', true);
    b.tile('cmp', 'Frente a 1 jabalina');
    const sl = {};
    ['A', 'B'].forEach((q) => {
      sl[q] = b.slider({ id: q, etiqueta: '', min: 0, max: 1, paso: 1, valor: 0, formato: (v) => CFG[e.etapa][q][5](v), alMover: (v) => { e.v[CFG[e.etapa][q][0]] = v; } });
    });
    const ajustar = () => {
      ['A', 'B'].forEach((q) => {
        const [key, et, mn, mx, ps] = CFG[e.etapa][q];
        const s0 = sl[q];
        s0.el.querySelector('.et').textContent = et;
        s0.input.min = mn; s0.input.max = mx; s0.input.step = ps;
        s0.fijar(e.v[key]);
      });
    };
    const verPaso = pasos(b, 4, e, ajustar);
    ajustar();
    const TXT = {
      1: 'Una jabalina: lo más simple. Vertical, llega a capas más húmedas y estables. Más larga baja R; más gruesa casi no la cambia.',
      2: 'Varias jabalinas unidas bajan R, pero solo si están separadas: si las zonas se tocan, comparten el mismo suelo y casi no ayudan.',
      3: 'Conductor horizontal: para suelo rocoso donde no entra una jabalina. Rinde por su largo; la profundidad casi no cambia R.',
      4: 'Malla: para subestaciones. Baja R y además empareja la tensión del suelo: protege a las personas (tensión de paso y de contacto).'
    };
    b.pintar = () => {
      verPaso();
      const v = e.v, R1 = M.rJab(rho, 2.4);
      const lineas = renglones(TXT[e.etapa], 45);
      let s = franja(lineas);
      const gy = 8 + lineas.length * 46 + 18 + 56, fondo = 440;
      let R, extX, extZ;
      if (e.etapa === 1) { R = M.rJab(rho, v.L, v.d / 1000); extX = 2 * v.L + 2; extZ = v.L * 1.3 + 0.4; }
      else if (e.etapa === 2) { R = M.rVarias(rho, 2.4, v.n, v.s); extX = (v.n - 1) * v.s + 2 * 2.4 + 1; extZ = 2.4 * 1.3 + 0.4; }
      else if (e.etapa === 3) { R = M.rHoriz(rho, v.lw, v.h); extX = v.lw + 4; extZ = v.h + 2.2; }
      else { R = M.rMalla(rho, v.lm, v.sm); extX = v.lm + 6; extZ = 3; }
      const k = Math.min(900 / extX, (fondo - gy) / extZ);
      const cx = 500;
      const X = (m) => cx + m * k, Z = (z) => gy + z * k;
      s += `<rect x="0" y="${gy}" width="1000" height="${fondo - gy}" fill="#f6f1e7"/>`;
      s += `<defs><clipPath id="cl-formas"><rect x="0" y="${gy}" width="1000" height="${fondo - gy}"/></clipPath></defs><g clip-path="url(#cl-formas)">`;
      const zona = (xc, rx, ry, col) => `<ellipse cx="${X(xc).toFixed(1)}" cy="${gy}" rx="${(rx * k).toFixed(1)}" ry="${(ry * k).toFixed(1)}" fill="${col}" fill-opacity=".16" stroke="${col}" stroke-width="3" stroke-dasharray="10 8"/>`;
      let aprov = 1;
      if (e.etapa === 1) {
        s += zona(0, v.L, v.L * 1.25, COL.v);
        s += `<rect x="${(X(0) - Math.max(5, (v.d / 1000) * k * 6) / 2).toFixed(1)}" y="${gy}" width="${Math.max(5, (v.d / 1000) * k * 6).toFixed(1)}" height="${(v.L * k).toFixed(1)}" fill="${COL.texto}"/>`;
      } else if (e.etapa === 2) {
        aprov = R1 / (v.n * R);
        const col = aprov < 0.6 ? COL.mal : aprov < 0.8 ? COL.duda : COL.v;
        const x0 = -((v.n - 1) * v.s) / 2;
        for (let i = 0; i < v.n; i++) s += zona(x0 + i * v.s, 2.4, 3, col);
        for (let i = 0; i < v.n; i++) s += `<rect x="${(X(x0 + i * v.s) - 5).toFixed(1)}" y="${gy}" width="10" height="${(2.4 * k).toFixed(1)}" fill="${COL.texto}"/>`;
        if (v.n > 1) s += `<path d="M${X(x0).toFixed(1)},${gy - 4} H${X(x0 + (v.n - 1) * v.s).toFixed(1)}" stroke="${COL.i}" stroke-width="6"/>`;
      } else if (e.etapa === 3) {
        s += `<ellipse cx="${X(0)}" cy="${Z(v.h).toFixed(1)}" rx="${((v.lw / 2 + 1.5) * k).toFixed(1)}" ry="${(1.6 * k).toFixed(1)}" fill="${COL.v}" fill-opacity=".14" stroke="${COL.v}" stroke-width="3" stroke-dasharray="10 8"/>`;
        s += lin(X(-v.lw / 2), Z(v.h), X(v.lw / 2), Z(v.h), COL.i, 8);
        s += lin(X(-v.lw / 2), gy, X(-v.lw / 2), Z(v.h), COL.i, 4, 'stroke-dasharray="6 6"');
      } else {
        s += zona(0, v.lm / 2 + 2, 2.6, COL.v);
        const nc = Math.floor(v.lm / v.sm + 1e-9) + 1;
        for (let i = 0; i < nc; i++) s += `<circle cx="${X(-v.lm / 2 + i * v.sm).toFixed(1)}" cy="${Z(0.5).toFixed(1)}" r="8" fill="${COL.i}"/>`;
        s += lin(X(-v.lm / 2), Z(0.5), X(v.lm / 2), Z(0.5), COL.i, 5);
      }
      s += `</g>`;
      s += lin(0, gy, 1000, gy, COL.t2, 4);
      // escala
      const paso = extX > 30 ? 10 : extX > 12 ? 5 : extX > 6 ? 2 : 1;
      s += lin(X(-extX / 2 + 0.5), gy - 30, X(-extX / 2 + 0.5 + paso), gy - 30, COL.t2, 4);
      s += txt(X(-extX / 2 + 0.5 + paso) + 12, gy - 20, paso + ' m', { tam: TS - 8, col: COL.t2, anc: 'start' });
      if (e.etapa === 4) {                               // vista de planta de la malla
        const nc = Math.floor(v.lm / v.sm + 1e-9) + 1, w = 112, x0 = 872, y0 = gy + 34;
        {
          s += `<rect x="${x0}" y="${y0}" width="${w}" height="${w}" fill="#fff" stroke="${COL.t3}" stroke-width="2"/>`;
          for (let i = 0; i < nc; i++) { const t = (i * v.sm / v.lm) * w; s += lin(x0 + t, y0, x0 + t, y0 + w, COL.i, 3) + lin(x0, y0 + t, x0 + w, y0 + t, COL.i, 3); }
          s += txt(x0 + w / 2, y0 - 8, 'desde arriba', { tam: TS - 14, col: COL.t2 });
        }
      }
      if (e.etapa === 2 && v.n > 1) {
        const t = aprov < 0.6 ? 'las zonas se tocan mucho' : aprov < 0.8 ? 'las zonas se tocan un poco' : 'zonas bien separadas';
        s += txt(500, fondo - 14, t, { tam: TS - 4, col: aprov < 0.6 ? COL.mal : aprov < 0.8 ? COL.duda : COL.ok, peso: 800 });
      }
      // barras de comparación (ρ = 100 Ω·m)
      s += barras(452, [{ t: '1 jabalina de 2,4 m', v: R1, col: COL.t3 }, { t: 'Esta forma', v: R, col: COL.v }], Math.max(R1, R) * 1.25);
      s += txt(990, 594, 'suelo de ' + rho + ' Ω·m', { tam: TS - 12, col: COL.t3, anc: 'end', peso: 600 });
      b.svg.innerHTML = s;
      b.set('R', fR(R) + ' Ω');
      b.set('cmp', R <= R1 ? '÷ ' + f(R1 / R, 1) : '× ' + f(R / R1, 1), R < R1 * 0.98 ? 'ok' : R > R1 * 1.02 ? 'mal' : '');
    };
    b.pintar();
    return api(b, e, ajustar);
  };

  // ============================================================
  // Cómo se prepara el terreno: suelo, relleno, época y años
  // ============================================================
  const SUELOS = [
    { t: 'Arcilla húmeda', rho: 40, col: '#c9b59a' },
    { t: 'Tierra común', rho: 100, col: '#b89a74' },
    { t: 'Arena o grava', rho: 600, col: '#e2cf9f' },
    { t: 'Roca', rho: 2000, col: '#b9b4ab' }
  ];
  const RELLENOS = [
    { t: 'Ninguno', rho: null, seca: 3, col: null, nota: 'La jabalina se clava en el suelo natural. Sirve si el suelo es húmedo y blando.' },
    { t: 'Tierra cernida', rho: 50, seca: 3, col: '#8a6a4a', nota: 'Tierra fina sin piedras, compactada y regada por capas: mejora el contacto.' },
    { t: 'Bentonita', rho: 2.5, seca: 10, col: '#9aa7b8', nota: 'Arcilla que retiene agua: muy conductora húmeda; seca, su resistividad sube unas 10 veces.' },
    { t: 'Sal y carbón', rho: 1, seca: 1, sal: true, col: '#d8d8d8', nota: 'Al inicio baja R, pero la lluvia la lava en pocos años y corroe la jabalina.' },
    { t: 'Cemento', rho: 0.02, seca: 1, col: '#5f6670', nota: 'Cemento conductivo: no depende del agua ni pide mantenimiento. Es el más caro.' }
  ];
  D.prepararTierra = (cont, opc) => {
    const b = base(cont, opc);
    const L = 2.4;
    const e = { suelo: ini(opc, 'suelo', 2), relleno: ini(opc, 'relleno', 0), dp: ini(opc, 'dp', 0.8), seca: ini(opc, 'seca', false), anos: ini(opc, 'anos', 0) };
    b.tile('R', 'Resistencia', true);
    b.tile('sin', 'Sin relleno');
    b.slider({ id: 'dp', etiqueta: 'Diámetro del pozo', min: 0.1, max: 1.5, paso: 0.1, valor: e.dp, formato: (v) => f(v, 1) + ' m', alMover: (v) => { e.dp = v; } });
    b.slider({ id: 'anos', etiqueta: 'Años después', min: 0, max: 10, paso: 1, valor: e.anos, formato: (v) => f(v, 0), alMover: (v) => { e.anos = v; } });
    const ep = [
      { texto: 'Época de lluvias', accion: () => { e.seca = false; } },
      { texto: 'Época seca', accion: () => { e.seca = true; } }
    ];
    b.botones(ep);
    b.svg.addEventListener('click', (ev) => {
      const g = ev.target.closest('[data-chip]');
      if (!g) return;
      const [q, n] = g.getAttribute('data-chip').split(':');
      e[q] = Number(n); b.pintar(); b.mov++; b.avisar();
    });
    const calc = () => {
      const su = SUELOS[e.suelo], re = RELLENOS[e.relleno];
      const rs = su.rho * (e.seca ? 3 : 1);
      let rr;
      if (re.rho == null) rr = rs;
      else if (re.sal) rr = rs - (rs - re.rho) * Math.exp(-e.anos / 1.5);      // la lluvia lava la sal
      else rr = re.rho * (e.seca ? re.seca : 1);
      const pre = rr * Math.log(e.dp / DIAM) / (2 * Math.PI * L);             // parte cercana: el relleno
      const lej = rs * (Math.log((8 * L) / e.dp) - 1) / (2 * Math.PI * L);    // parte lejana: el suelo
      return { rs, rr, pre, lej, R: pre + lej, sin: M.rJab(rs, L) };
    };
    const chip = (x, y, w, t, sel, id) => `<g data-chip="${id}" style="cursor:pointer"><rect x="${x}" y="${y}" width="${w}" height="52" rx="26" fill="${sel ? '#1d5fb4' : '#fff'}" stroke="${sel ? '#1d5fb4' : COL.borde}" stroke-width="3"/>` +
      txt(x + w / 2, y + 36, t, { tam: TS - 10, col: sel ? '#fff' : COL.texto, peso: 700, halo: false }) + '</g>';
    b.pintar = () => {
      const c = calc(), su = SUELOS[e.suelo], re = RELLENOS[e.relleno];
      let s = '';
      s += txt(14, 42, 'Suelo', { tam: TS - 12, col: COL.t2, anc: 'start', peso: 700 });
      let x = 124;
      SUELOS.forEach((q, i) => { const w = 15 * q.t.length + 34; s += chip(x, 8, w, q.t, i === e.suelo, 'suelo:' + i); x += w + 10; });
      s += txt(14, 108, 'Relleno', { tam: TS - 12, col: COL.t2, anc: 'start', peso: 700 });
      x = 124;
      RELLENOS.forEach((q, i) => { const w = 14.5 * q.t.length + 30; s += chip(x, 74, w, q.t, i === e.relleno, 'relleno:' + i); x += w + 8; });
      // nota del relleno elegido (máximo 2 renglones)
      const nota = renglones(re.nota + (re.sal && e.anos > 0 ? ' Ya pasaron ' + e.anos + ' años.' : ''), 52).slice(0, 2);
      nota.forEach((l, k) => { s += txt(14, 160 + k * 38, l, { tam: TS - 6, col: '#123f7a', anc: 'start', peso: 600, halo: false }); });
      // corte del pozo
      const gy = 252, fondo = 440, kz = (fondo - gy - 8) / (L + 0.3), kx = 150;
      const cx = 290;
      s += `<rect x="0" y="${gy}" width="600" height="${fondo - gy}" fill="${su.col}"/>`;
      for (let i = 0; i < 40; i++) { const px = (i * 137) % 600, py = gy + 12 + ((i * 71) % (fondo - gy - 20)); s += `<circle cx="${px}" cy="${py}" r="${2 + (i % 3)}" fill="#00000018"/>`; }
      const w = Math.max(e.dp * kx, 14);
      if (re.col) {
        const lav = re.sal ? Math.min(1, e.anos / 4) : 0;
        s += `<rect x="${cx - w / 2}" y="${gy}" width="${w}" height="${((L + 0.3) * kz).toFixed(1)}" fill="${re.col}" fill-opacity="${(1 - 0.7 * lav).toFixed(2)}" stroke="#00000030" stroke-width="2"/>`;
        if (re.sal && lav > 0) s += txt(cx, gy + (L + 0.3) * kz + 2, 'la sal se lava', { tam: TS - 12, col: COL.mal, peso: 700 });
      }
      if (!re.col) s += `<rect x="${cx - w / 2}" y="${gy}" width="${w}" height="${((L + 0.3) * kz).toFixed(1)}" fill="none" stroke="${COL.t2}" stroke-width="3" stroke-dasharray="8 8"/>`;
      s += `<rect x="${cx - 5}" y="${gy - 14}" width="10" height="${(L * kz + 14).toFixed(1)}" fill="${COL.texto}"/>`;
      s += lin(0, gy, 600, gy, COL.t2, 4);
      s += txt(14, gy + 38, 'suelo: ' + fR(c.rs) + ' Ω·m', { tam: TS - 12, col: COL.texto, anc: 'start', peso: 700 });
      s += txt(14, fondo - 14, re.col ? 'relleno: ' + fR(c.rr) + ' Ω·m' : 'zona cercana', { tam: TS - 12, col: COL.texto, anc: 'start', peso: 700 });
      if (re.col) {
        s += lin(cx - w / 2, gy - 22, cx + w / 2, gy - 22, COL.t2, 3);
        s += txt(cx, gy - 30, 'Ø ' + f(e.dp, 1) + ' m', { tam: TS - 12, col: COL.t2 });
      }
      if (e.seca) s += txt(560, gy + 40, 'suelo seco', { tam: TS - 10, col: COL.duda, anc: 'end', peso: 800 });
      // barra: R = parte cercana (relleno) + parte lejana (suelo)
      const bx = 630, bw = 350, by = gy, bh = fondo - gy;
      const tot = Math.max(c.sin, c.R);
      const hP = (c.pre / tot) * (bh - 50), hL = (c.lej / tot) * (bh - 50);
      s += txt(bx + bw / 2, by + 26, 'De dónde sale R', { tam: TS - 10, col: COL.t2, peso: 700 });
      s += `<rect x="${bx + 30}" y="${fondo - hL}" width="120" height="${hL.toFixed(1)}" fill="${su.col}" stroke="${COL.t2}" stroke-width="2"/>`;
      s += `<rect x="${bx + 30}" y="${fondo - hL - hP}" width="120" height="${Math.max(hP, 2).toFixed(1)}" fill="${re.col || su.col}" stroke="${COL.t2}" stroke-width="2"/>`;
      s += txt(bx + 165, fondo - hL / 2 + 10, 'suelo ' + fR(c.lej), { tam: TS - 12, col: COL.texto, anc: 'start' });
      s += txt(bx + 165, fondo - hL - hP / 2 + 10, 'cerca ' + fR(c.pre), { tam: TS - 12, col: COL.texto, anc: 'start' });
      // fórmula y comparación
      s += txt(500, 486, 'R = (parte cercana, en el relleno) + (parte lejana, en el suelo)', { tam: TS - 10, col: COL.t2, peso: 700 });
      s += txt(500, 532, 'El relleno solo mejora la parte cercana: la lejana depende del suelo.', { tam: TS - 8, col: COL.v, peso: 700 });
      s += txt(500, 584, 'Jabalina de 2,4 m. Resistividades típicas; los cambios con la época y los años son ilustrativos.', { tam: TS - 16, col: COL.t3, peso: 500 });
      b.svg.innerHTML = s;
      b.set('R', fR(c.R) + ' Ω', c.R < c.sin * 0.95 ? 'ok' : '');
      b.set('sin', fR(c.sin) + ' Ω');
      marcar(ep[0].el, !e.seca); marcar(ep[1].el, e.seca);
    };
    b.pintar();
    return api(b, e, () => { b.sliders.dp.fijar(e.dp); b.sliders.anos.fijar(e.anos); });
  };

  // ============================================================
  // Cómo se instala una puesta a tierra, paso a paso
  // ============================================================
  const ETAPAS_INST = [
    { t: 'Medir el suelo', q: 'Con el método de Wenner se mide la resistividad del terreno.', p: 'Decide cuántas jabalinas hacen falta y si conviene un relleno.' },
    { t: 'Excavar el pozo', q: 'Un pozo de unos 0,8 a 1 m de diámetro y unos 3 m de hondo (práctica común).', p: 'Junto a la jabalina está casi toda la resistencia: ahí se cambia el suelo malo.' },
    { t: 'Asentar el fondo', q: 'Una primera capa de unos 30 cm de relleno, compactada y regada.', p: 'La punta de la jabalina queda firme y en buen contacto.' },
    { t: 'Colocar la jabalina', q: 'Jabalina de cobre o acero con cobre de al menos 2,4 m, vertical y al centro.', p: 'Vertical llega a capas más húmedas y estables; al centro aprovecha todo el relleno.' },
    { t: 'Rellenar por capas', q: 'Capas de unos 30 cm de relleno: compactar y regar cada una.', p: 'Sin aire ni piedras: el contacto entre el suelo y la jabalina es lo que baja R.' },
    { t: 'Conectar el cable', q: 'Cable de cobre desnudo unido con conector o soldadura exotérmica.', p: 'Una unión floja o corroída suma resistencia y puede abrirse con los años.' },
    { t: 'Caja de registro', q: 'Caja con tapa sobre la jabalina; la unión queda a la vista.', p: 'Permite revisar, desconectar y medir sin excavar.' },
    { t: 'Al tablero y medir', q: 'El cable va a la barra de tierra del tablero. Se mide y se anota la fecha.', p: 'Se comprueba que cumple; se repite cada año, mejor en época seca.' }
  ];
  D.instalarTierra = (cont, opc) => {
    const b = base(cont, opc);
    const N = ETAPAS_INST.length;
    const e = { etapa: ini(opc, 'etapa', 1) };
    const lado = b.raiz.querySelector('.dg-lado');
    const lista = document.createElement('ol');
    lista.className = 'lista-dg';
    lista.innerHTML = ETAPAS_INST.map((q) => `<li>${q.t}</li>`).join('');
    lado.insertBefore(lista, lado.firstChild);
    b.lect.remove();
    const verPaso = pasos(b, N, e, () => {});
    b.pintar = () => {
      verPaso();
      lista.querySelectorAll('li').forEach((li, i) => { li.className = i + 1 < e.etapa ? 'hecho' : i + 1 === e.etapa ? 'actual' : ''; });
      const et = ETAPAS_INST[e.etapa - 1], n = e.etapa;
      let s = '';
      const lq = renglones(et.q, 46), lp = renglones('Por qué: ' + et.p, 46);
      s += `<rect x="8" y="8" width="984" height="${(lq.length + lp.length) * 42 + 22}" rx="18" fill="#eaf1fb"/>`;
      lq.forEach((l, k) => { s += txt(28, 50 + k * 42, l, { tam: TS - 2, col: '#123f7a', anc: 'start', peso: 700, halo: false }); });
      lp.forEach((l, k) => { s += txt(28, 50 + (lq.length + k) * 42, l, { tam: TS - 4, col: COL.ok, anc: 'start', peso: 600, halo: false }); });
      // corte del terreno
      const gy = 262, fondo = 592, cx = 360;
      const kz = (fondo - gy - 10) / 3.1;               // 3,1 m de hondo
      const Zp = (z) => gy + z * kz;
      const wp = 0.9 * kz;                               // pozo de 0,9 m (misma escala)
      s += `<rect x="0" y="${gy}" width="1000" height="${fondo - gy}" fill="#c9ad86"/>`;
      for (let i = 0; i < 60; i++) { const px = (i * 157) % 1000, py = gy + 10 + ((i * 89) % (fondo - gy - 16)); s += `<circle cx="${px}" cy="${py}" r="${2 + (i % 4)}" fill="#00000020"/>`; }
      s += `<rect x="0" y="${gy - 60}" width="1000" height="60" fill="#fff"/>`;
      const anim = (attr, de, a) => `<animate attributeName="${attr}" from="${de}" to="${a}" dur="1.2s" fill="freeze"/>`;
      if (n === 1) {
        // método de Wenner: cuatro picas a la misma distancia
        [-1.5, -0.5, 0.5, 1.5].forEach((m, i) => {
          const x = 500 + m * 190;
          s += `<rect x="${x - 5}" y="${gy - 10}" width="10" height="46" fill="${i === 0 || i === 3 ? COL.i : COL.v}"/>`;
          s += txt(x, gy - 22, i === 0 || i === 3 ? 'I' : 'V', { tam: TS - 8, col: i === 0 || i === 3 ? COL.i : COL.v, peso: 800 });
        });
        [-1, 0, 1].forEach((m) => { s += txt(500 + m * 190, gy + 76, 'a', { tam: TS - 4, col: COL.t2, peso: 800 }); });
        s += txt(500, gy + 150, 'ρ = 2π · a · R', { tam: TG, col: COL.v, peso: 800, mono: true });
      }
      if (n >= 2) {
        s += `<rect x="${cx - wp / 2}" y="${gy}" width="${wp}" height="${(3 * kz).toFixed(1)}" fill="#fff8ee" stroke="#8a6a4a" stroke-width="3">${n === 2 ? anim('height', 0, (3 * kz).toFixed(1)) : ''}</rect>`;
        s += lin(cx + wp / 2 + 30, gy, cx + wp / 2 + 30, Zp(3), COL.t2, 3);
        s += txt(cx + wp / 2 + 44, Zp(1.6), '≈ 3 m', { tam: TS - 6, col: COL.t2, anc: 'start', peso: 700 });
        s += lin(cx - wp / 2, gy - 16, cx + wp / 2, gy - 16, COL.t2, 3);
        s += txt(cx, gy - 26, 'Ø ≈ 0,9 m', { tam: TS - 8, col: COL.t2 });
        if (n === 2) s += `<path d="M${cx + wp},${gy} l60,-30 l50,0" fill="none" stroke="#8a6a4a" stroke-width="18" stroke-linecap="round"/>`;
      }
      // capas de relleno (de 30 cm)
      const capas = n < 3 ? 0 : n === 3 || n === 4 ? 1 : 10;
      for (let c = 0; c < capas; c++) {
        const z1 = 3 - c * 0.3, z0 = Math.max(0.15, z1 - 0.3);
        if (z0 >= z1) break;
        const y = Zp(z0), h = (z1 - z0) * kz;
        const nueva = (n === 3 && c === 0) || (n === 5 && c > 0);
        s += `<rect x="${cx - wp / 2 + 2}" y="${y.toFixed(1)}" width="${wp - 4}" height="${h.toFixed(1)}" fill="${c % 2 ? '#8f6e4d' : '#9c7a57'}" opacity="${nueva ? 0 : 1}">${nueva ? `<animate attributeName="opacity" from="0" to="1" begin="${(0.25 * c).toFixed(2)}s" dur="0.3s" fill="freeze"/>` : ''}</rect>`;
      }
      if (n === 3 || n === 5) {
        // agua al regar
        for (let i = 0; i < 6; i++) s += `<circle cx="${cx - wp / 2 + 12 + i * (wp - 24) / 5}" cy="${gy - 40}" r="6" fill="#5b8fd6"><animate attributeName="cy" from="${gy - 50}" to="${Zp(n === 3 ? 2.7 : 0.4)}" dur="1.1s" begin="${(i * 0.17).toFixed(2)}s" repeatCount="indefinite"/></circle>`;
        s += txt(cx + wp / 2 + 44, Zp(0.4), n === 3 ? 'compactar y regar' : 'cada 30 cm: compactar y regar', { tam: TS - 10, col: '#1d5fb4', anc: 'start', peso: 700 });
      }
      // jabalina
      if (n >= 4) {
        const yTop = Zp(0.15), hJ = 2.4 * kz;
        s += `<rect x="${cx - 6}" y="${yTop.toFixed(1)}" width="12" height="${hJ.toFixed(1)}" fill="${COL.texto}">${n === 4 ? anim('y', (yTop - hJ).toFixed(1), yTop.toFixed(1)) : ''}</rect>`;
        s += txt(cx - wp / 2 - 18, Zp(1.4), 'jabalina 2,4 m', { tam: TS - 10, col: COL.texto, anc: 'end', peso: 700 });
      }
      // cable y unión
      if (n >= 6) {
        s += `<path d="M${cx},${Zp(0.2)} q 40,10 120,0 H${n >= 8 ? 880 : 600}${n >= 8 ? ' V' + (gy - 22) : ''}" fill="none" stroke="#c46a2b" stroke-width="7"/>`;
        s += `<circle cx="${cx}" cy="${Zp(0.2)}" r="14" fill="#f2c14e" stroke="#8a5a10" stroke-width="3"/>`;
        s += txt(cx + 140, Zp(0.2) - 14, 'unión', { tam: TS - 10, col: '#8a5a10', anc: 'start', peso: 800 });
      }
      if (n >= 7) {
        s += `<rect x="${cx - 70}" y="${gy - 14}" width="140" height="${(0.45 * kz + 14).toFixed(1)}" fill="none" stroke="#7a8596" stroke-width="10"/>`;
        s += `<rect x="${cx - 80}" y="${gy - 24}" width="160" height="14" fill="#7a8596"/>`;
        s += txt(cx - 92, gy - 12, 'caja con tapa', { tam: TS - 10, col: COL.t2, anc: 'end', peso: 700 });
      }
      if (n >= 8) {
        s += `<rect x="800" y="${gy - 56}" width="170" height="52" rx="8" fill="#fff" stroke="${COL.texto}" stroke-width="4"/>`;
        s += txt(885, gy - 20, 'tablero', { tam: TS - 10, col: COL.texto, peso: 700 });
        s += lin(830, gy - 22, 940, gy - 22, '#c46a2b', 0);
        s += txt(885, gy + 40, 'a la barra de tierra', { tam: TS - 12, col: '#c46a2b', peso: 700 });
        s += `<rect x="560" y="${gy - 56}" width="200" height="52" rx="10" fill="#fff" stroke="${COL.v}" stroke-width="4"/>`;
        s += txt(660, gy - 20, 'telurómetro', { tam: TS - 10, col: COL.v, peso: 700 });
      }
      b.svg.innerHTML = s;
    };
    b.pintar();
    return api(b, e, () => {});
  };
})();
