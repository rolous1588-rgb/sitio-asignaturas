// ============================================================
// Medidas Eléctricas · Diagramas explicativos de puesta a tierra (05/11/2026)
//   FP.diagramas.campoTierra  Cómo mide el telurómetro: corriente en el suelo,
//                             tensión con colores y curva de tensión en la superficie
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
  const { base, api, txt, lin, ini, par, fR, TG, TS, L_H } = M._h;

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
})();
