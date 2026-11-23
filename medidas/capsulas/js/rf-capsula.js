// ============================================================
// Cápsula «Refrigeración magnética» (23/11/2026), ?c=refrigeracion.
// Basada en J. C. Fernández, Electromagnetismo (FIUBA, 2004), pp. 4-34 a 4-36, y en la descripción de la
// simulación que recibió el docente: bloque de gadolinio con espines, imán, termómetro e interior que se enfría.
// Tres etapas (el efecto; el ciclo y la máquina; materiales y eficiencia) y 13 encuestas, aprobadas el 23/11.
// Datos: Gd de 1,5 kg a 21 °C; 2 T (6,4 K por pasada); ciclo de 6 s; refrigerador a 4 °C con descarga a 30 °C.
// Usa las piezas comunes de em-capsula.js (EM.barras, EM.orden, EM.tex, EM.esc, EM.f, EM.sig).
// ============================================================
(function () {
  'use strict';
  const EM = window.EM;
  const RF = window.RF = {};
  const X = String.raw;
  const f = EM.f, sig = EM.sig, esc = EM.esc;
  RF.titulo = 'Refrigeración magnética';
  window.CAPSULAS = window.CAPSULAS || {};
  window.CAPSULAS.refrigeracion = RF;

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const svg = (vb, s) => `<svg viewBox="${vb}">${s}</svg>`;

  // ============================================================
  // FÍSICA
  // ============================================================
  const TA = 21, CGD = 235, MGD = 1.5, CB = MGD * CGD, CI = 2 * CB;
  RF.TA = TA; RF.CGD = CGD; RF.CB = CB; RF.CI = CI;
  // Salto adiabático del Gd cerca de TC (medido): 3 K con 1 T; 6,4 K con 2 T; 11,6 K con 5 T. Entre puntos, recta.
  const GPTS = [[0, 0], [1, 3.0], [2, 6.4], [5, 11.6]];
  function dTad(B) {
    B = clamp(+B || 0, 0, 5);
    for (let i = 1; i < GPTS.length; i++) {
      const [b0, t0] = GPTS[i - 1], [b1, t1] = GPTS[i];
      if (B <= b1) return t0 + (t1 - t0) * (B - b0) / (b1 - b0);
    }
    return GPTS[GPTS.length - 1][1];
  }
  RF.dTad = dTad;
  const orden = (B) => Math.tanh(clamp(+B || 0, 0, 5) / 1.5);
  RF.orden = orden;
  const r2 = (x) => Math.round(x * 1e6) / 1e6;

  // Bloque de gadolinio (estado completo en P; lo mismo en la TV y en los celulares)
  function cambiaB(P, viejo) { P.T = P.T + dTad(P.B) - dTad(viejo); P.u = 'B'; }
  function accion(P, id) {
    if (id === 'dis') {
      const q = CB * (P.T - TA);
      P.Qa = r2(P.Qa + q); P.T = TA; P.u = q >= 0 ? 'dis' : 'disr'; P.dq = r2(q);
    } else if (id === 'abs') {
      const Teq = (CI * P.Ti + CB * P.T) / (CI + CB), q = CB * (Teq - P.T);
      P.Qi = r2(P.Qi + q); P.T = r2(Teq); P.Ti = r2(Teq); P.u = q >= 0 ? 'abs' : 'cal'; P.dq = r2(q);
      if (q > 1) P.n = (P.n || 0) + 1;
    }
    return P;
  }
  RF.cambiaB = cambiaB; RF.accion = accion;

  // Rueda: frío ideal por vuelta y potencia (sin diferencia de temperatura con el interior)
  function rueda0(P) { const g = dTad(P.B), Q = P.m * CGD * g; return { g, Q, W: Q / P.t, rpm: 60 / P.t }; }
  RF.rueda = rueda0;

  // Eficiencia frente a Carnot (100 W de frío continuos; 720 h al mes)
  function efic(P) {
    const Tf = P.Ti + 273.15, Tc = P.Ta + 273.15, C = Tf / (Tc - Tf), cg = C * P.pg / 100, cm = C * P.pm / 100;
    return { C, cg, cm, Wc: 100 / C, Wg: 100 / cg, Wm: 100 / cm, kg: 100 / cg * 0.72, km: 100 / cm * 0.72, ah: 1 - P.pg / P.pm };
  }
  RF.efic = efic;

  // ============================================================
  // DIBUJOS
  // ============================================================
  const AZ = '#1c7ed6', RO = '#c92a2a', TX = '#1f2633', VE = '#2f9e44', NA = '#e8590c', MO = '#845ef7';
  function arrow(x1, y1, x2, y2, col, w, hs) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L; hs = hs || 9;
    const bx = x2 - ux * hs, by = y2 - uy * hs;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${col}" stroke-width="${w || 3}" stroke-linecap="round"/>` +
      `<polygon points="${x2.toFixed(1)},${y2.toFixed(1)} ${(bx - uy * hs * 0.6).toFixed(1)},${(by + ux * hs * 0.6).toFixed(1)} ${(bx + uy * hs * 0.6).toFixed(1)},${(by - ux * hs * 0.6).toFixed(1)}" fill="${col}"/>`;
  }
  function cabeza(x1, y1, x2, y2, col, hs) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L; hs = hs || 11;
    const bx = x2 - ux * hs, by = y2 - uy * hs;
    return `<polygon points="${x2.toFixed(1)},${y2.toFixed(1)} ${(bx - uy * hs * 0.55).toFixed(1)},${(by + ux * hs * 0.55).toFixed(1)} ${(bx + uy * hs * 0.55).toFixed(1)},${(by - ux * hs * 0.55).toFixed(1)}" fill="${col}"/>`;
  }
  const pt = (cx, cy, r, t) => [cx + r * Math.cos(t), cy + r * Math.sin(t)];
  const halo = 'paint-order:stroke;stroke:#fff;stroke-width:5px;stroke-linejoin:round';
  function rnd(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function mezcla(a, b, t) {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return '#' + pa.map((x, i) => Math.round(x + (pb[i] - x) * t).toString(16).padStart(2, '0')).join('');
  }
  // Color de la temperatura: azul (≤ 12 °C), gris (21 °C), rojo (≥ 30 °C)
  function colT(T) { const t = clamp((T - TA) / 9, -1, 1); return t >= 0 ? mezcla('#d5d9df', '#f28b82', t) : mezcla('#d5d9df', '#7db7ef', -t); }
  const colTx = (T) => T > TA + 0.05 ? RO : T < TA - 0.05 ? AZ : TX;
  RF.colT = colT;

  // Rejilla de átomos con su espín. a = orden (0 desorden, 1 todos hacia arriba). La red vibra más cuanto más caliente.
  function espines(x, y, w, h, nx, ny, a, T, seed, anim, L) {
    const r = rnd(seed); let s = '';
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const cx = x + w * (i + 0.5) / nx, cy = y + h * (j + 0.5) / ny;
      const base = (r() * 2 - 1) * 180, ang = -90 + base * (1 - a), wob = 5 + 30 * (1 - a);
      const A = clamp(0.4 + 0.14 * (T - 8), 0.3, 4), d1 = (0.22 + r() * 0.2).toFixed(2), d2 = (0.5 + r() * 0.5).toFixed(2);
      const dx = (r() < 0.5 ? -1 : 1) * A, dy = (r() < 0.5 ? -1 : 1) * A * 0.8;
      s += `<g transform="translate(${cx.toFixed(1)},${cy.toFixed(1)})">`;
      if (anim) s += `<animateTransform attributeName="transform" type="translate" additive="sum" values="0,0;${dx.toFixed(2)},${dy.toFixed(2)};0,0;${(-dx).toFixed(2)},${(-dy * 0.6).toFixed(2)};0,0" dur="${d1}s" repeatCount="indefinite"/>`;
      s += `<circle r="${(L * 0.2).toFixed(1)}" fill="#6b7480"/><g transform="rotate(${ang.toFixed(1)})">`;
      if (anim) s += `<animateTransform attributeName="transform" type="rotate" values="${(ang - wob).toFixed(1)};${(ang + wob).toFixed(1)};${(ang - wob).toFixed(1)}" dur="${d2}s" repeatCount="indefinite"/>`;
      s += arrow(-L / 2, 0, L / 2, 0, TX, 2.4, L * 0.42) + '</g></g>';
    }
    return s;
  }

  // ---- Etapa 1: el bloque de Gd entre los polos, con el agua, el interior y el termómetro ----
  function bloqueFig(P, o) {
    o = o || {}; const B = +P.B || 0, T = P.T === undefined ? TA : P.T, Ti = P.Ti === undefined ? TA : P.Ti, u = P.u || '';
    const a = orden(B), gap = 10 + 58 * (1 - clamp(B, 0, 5) / 5), op = (0.3 + 0.7 * clamp(B / 2, 0, 1)).toFixed(2);
    const bx = 150, by = 112, bw = 112, bh = 84;
    let s = '';
    // agua (ambiente) e interior
    s += `<rect x="8" y="14" width="100" height="90" rx="8" fill="#eef1f5" stroke="#9aa5b4" stroke-width="1.6"/><text class="st" x="58" y="52" text-anchor="middle">agua</text><text class="st2" x="58" y="78" text-anchor="middle">21 °C</text>`;
    s += `<rect x="8" y="190" width="100" height="100" rx="8" fill="${colT(Ti)}" stroke="#6b7480" stroke-width="1.6"/><text class="st" x="58" y="228" text-anchor="middle">interior</text><text class="st" x="58" y="260" text-anchor="middle" style="fill:${colTx(Ti)}">${f(Ti, 1)} °C</text>`;
    // flechas de calor (activa la de la última acción)
    const via = (on, col, d) => on ? `<path class="flux" style="stroke:${col}" d="${d}"/>` : `<path d="${d}" fill="none" stroke="#cbd3dd" stroke-width="2" stroke-dasharray="5 5"/>`;
    const dA = 'M150,124 Q126,118 114,96', dAr = 'M114,96 Q126,118 150,124';
    const dI = 'M114,214 Q128,198 150,186', dIr = 'M150,186 Q128,198 114,214';
    if (u === 'dis') s += via(true, RO, dA) + cabeza(119, 106, 114, 96, RO, 12) + `<text class="st2" x="112" y="140" text-anchor="end" style="fill:${RO}">calor</text>`;
    else if (u === 'disr') s += via(true, AZ, dAr) + cabeza(140, 123, 150, 124, AZ, 12);
    else s += via(false, '', dA);
    if (u === 'abs') s += via(true, AZ, dI) + cabeza(141, 190, 150, 186, AZ, 12) + `<text class="st2" x="112" y="180" text-anchor="end" style="fill:${AZ}">calor</text>`;
    else if (u === 'cal') s += via(true, RO, dIr) + cabeza(119, 207, 114, 214, RO, 12) + `<text class="st2" x="112" y="180" text-anchor="end" style="fill:${RO}">calor</text>`;
    else s += via(false, '', dI);
    // líneas de campo (hacia arriba: de N, abajo, a S, arriba)
    if (B > 0.04) {
      const opl = (0.25 + 0.55 * clamp(B / 2, 0, 1)).toFixed(2);
      for (const x of [160, 184, 206, 228, 252]) {
        s += `<line x1="${x}" y1="${(by - gap).toFixed(1)}" x2="${x}" y2="${(by + bh + gap).toFixed(1)}" stroke="${AZ}" stroke-width="2" opacity="${opl}"/>`;
        if (gap > 18) s += `<g opacity="${opl}">${cabeza(x, by - gap / 2 + 5, x, by - gap / 2 - 5, AZ, 9)}</g>`;
      }
    }
    // polos del imán (se acercan al subir B)
    s += `<g opacity="${op}"><rect x="128" y="${(by - gap - 28).toFixed(1)}" width="156" height="28" rx="4" fill="#c5dbf5" stroke="${AZ}" stroke-width="2"/><text class="st" x="206" y="${(by - gap - 8).toFixed(1)}" text-anchor="middle" style="fill:${AZ}">S</text>` +
      `<rect x="128" y="${(by + bh + gap).toFixed(1)}" width="156" height="28" rx="4" fill="#f3c4c4" stroke="${RO}" stroke-width="2"/><text class="st" x="206" y="${(by + bh + gap + 20).toFixed(1)}" text-anchor="middle" style="fill:${RO}">N</text></g>`;
    // bloque con sus espines
    s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="${colT(T)}" stroke="#6b7480" stroke-width="2"/>`;
    s += espines(bx, by, bw, bh, 5, 3, a, T, 11, o.anim !== false, 18);
    // termómetro del Gd (5 a 35 °C)
    const yT = (t) => 240 - (clamp(t, 5, 35) - 5) / 30 * 190;
    s += `<rect x="345" y="44" width="14" height="208" rx="7" fill="#fff" stroke="#6b7480" stroke-width="1.6"/>`;
    s += `<rect x="349" y="${yT(T).toFixed(1)}" width="6" height="${(254 - yT(T)).toFixed(1)}" fill="${RO}"/><circle cx="352" cy="262" r="14" fill="${RO}" stroke="#6b7480" stroke-width="1.6"/>`;
    [10, 20, 30].forEach((t) => { s += `<line x1="337" y1="${yT(t).toFixed(1)}" x2="345" y2="${yT(t).toFixed(1)}" stroke="#6b7480" stroke-width="1.4"/><text class="tk" x="333" y="${(yT(t) + 5).toFixed(1)}" text-anchor="end">${t}</text>`; });
    s += `<text class="st" x="352" y="30" text-anchor="middle" style="fill:${colTx(T)}">${f(T, 1)} °C</text>`;
    return svg('0 0 400 300', s);
  }

  // ---- Idea 1: espines sin campo y con campo ----
  function espines2() {
    let s = '';
    // polos alrededor del bloque de la derecha
    s += `<rect x="215" y="44" width="170" height="20" rx="4" fill="#c5dbf5" stroke="${AZ}" stroke-width="2"/><text class="st2" x="300" y="59" text-anchor="middle" style="fill:${AZ}">S</text>`;
    s += `<rect x="215" y="186" width="170" height="20" rx="4" fill="#f3c4c4" stroke="${RO}" stroke-width="2"/><text class="st2" x="300" y="201" text-anchor="middle" style="fill:${RO}">N</text>`;
    const caja = (x, B, t1, t2) => {
      s += `<rect x="${x}" y="70" width="150" height="110" rx="6" fill="${colT(TA)}" stroke="#6b7480" stroke-width="1.6"/>` + espines(x, 70, 150, 110, 5, 4, orden(B), TA, 21, true, 18);
      s += `<text class="st" x="${x + 75}" y="234" text-anchor="middle">${t1}</text><text class="st2" x="${x + 75}" y="256" text-anchor="middle">${t2}</text>`;
    };
    caja(25, 0, 'sin campo', 'S magnética alta');
    caja(225, 2, 'con campo', 'S magnética baja');
    s += `<text class="st2" x="200" y="290" text-anchor="middle">Los dos a la misma temperatura</text>`;
    return svg('0 0 400 300', s);
  }

  // ---- Curva del salto adiabático y de M cerca de TC ----
  function ejes(X0, X1, Y0, Y1, xt, yt, xs, ys, xl, yl) {
    let s = `<line class="ax" x1="${X0}" y1="${Y0}" x2="${X1}" y2="${Y0}" stroke-width="1.6" style="stroke:#6b7480"/><line class="ax" x1="${X0}" y1="${Y0}" x2="${X0}" y2="${Y1}" stroke-width="1.6" style="stroke:#6b7480"/>`;
    xt.forEach((v) => { const x = xs(v); s += `<line x1="${x.toFixed(1)}" y1="${Y0}" x2="${x.toFixed(1)}" y2="${Y0 + 5}" stroke="#6b7480"/><text class="tk" x="${x.toFixed(1)}" y="${Y0 + 20}" text-anchor="middle">${String(v).replace('.', ',')}</text>`; });
    yt.forEach((v) => { const y = ys(v); s += `<line x1="${X0 - 5}" y1="${y.toFixed(1)}" x2="${X0}" y2="${y.toFixed(1)}" stroke="#6b7480"/><text class="tk" x="${X0 - 8}" y="${(y + 5).toFixed(1)}" text-anchor="end">${v}</text>`; });
    s += `<text class="tk" x="${X1}" y="${Y0 + 40}" text-anchor="end">${xl}</text><text class="tk" x="${X0 + 6}" y="${Y1 - 10}">${yl}</text>`;
    return s;
  }
  const poli = (pts) => pts.map(([x, y]) => x.toFixed(1) + ',' + y.toFixed(1)).join(' ');
  function curvaTC(o) {
    o = o || {}; const X0 = 56, X1 = 380, Y0 = 240, Y1 = 34, T0 = 240, T1 = 350;
    const xs = (T) => X0 + (X1 - X0) * (T - T0) / (T1 - T0), ys = (v) => Y0 - (Y0 - Y1) * v / 8;
    const dT = (T) => 6.4 * Math.exp(-Math.pow((T - 294) / (T < 294 ? 40 : 45), 2));
    let s = ejes(X0, X1, Y0, Y1, [250, 275, 300, 325, 350], [0, 2, 4, 6, 8], xs, ys, 'T (K)', 'ΔT (K)');
    s += `<line x1="${xs(294).toFixed(1)}" y1="${Y0}" x2="${xs(294).toFixed(1)}" y2="${Y1 - 4}" class="ref" style="stroke:${MO}"/><text class="st2" x="${xs(294).toFixed(1)}" y="${Y1 - 10}" text-anchor="middle" style="fill:${MO}">TC = 294 K</text>`;
    if (o.M) {
      const M = (T) => 7.2 * (1 - 1 / (1 + Math.exp(-(T - 294) / 10))) + 0.4, pts = [];
      for (let T = T0; T <= T1; T += 1) pts.push([xs(T), ys(M(T))]);
      s += `<polyline points="${poli(pts)}" fill="none" stroke="#868e96" stroke-width="2.6" stroke-dasharray="7 5"/>`;
      s += `<text class="st2" x="${xs(246).toFixed(1)}" y="${ys(6.3).toFixed(1)}" style="fill:#5c636d">M (con 2 T)</text>`;
    }
    const pts = []; for (let T = T0; T <= T1; T += 1) pts.push([xs(T), ys(dT(T))]);
    s += `<polyline class="ln" points="${poli(pts)}"/>`;
    s += `<text class="st" x="${(xs(294) + 10).toFixed(1)}" y="${(ys(6.4) + 2).toFixed(1)}" style="fill:#2a78d6;${halo}">ΔT (2 T)</text>`;
    return svg('0 0 400 300', s);
  }
  function curvaB() {
    const X0 = 56, X1 = 380, Y0 = 240, Y1 = 34, xs = (b) => X0 + (X1 - X0) * b / 5, ys = (t) => Y0 - (Y0 - Y1) * t / 16;
    let s = ejes(X0, X1, Y0, Y1, [0, 1, 2, 3, 4, 5], [0, 4, 8, 12, 16], xs, ys, 'B (T)', 'ΔT (K)');
    s += `<line class="ref" x1="${xs(0)}" y1="${ys(0)}" x2="${xs(5)}" y2="${ys(16)}"/><text class="st2" x="${(xs(4.1)).toFixed(1)}" y="${(ys(14.6) - 6).toFixed(1)}" text-anchor="end" style="fill:#eb6834;${halo}">si fuera proporcional</text>`;
    const pts = []; for (let b = 0; b <= 5.001; b += 0.05) pts.push([xs(b), ys(dTad(b))]);
    s += `<polyline class="ln" points="${poli(pts)}"/>`;
    [[1, '3 K'], [2, '6,4 K'], [5, '11,6 K']].forEach(([b, t]) => { s += `<circle cx="${xs(b).toFixed(1)}" cy="${ys(dTad(b)).toFixed(1)}" r="5.5" fill="#2a78d6"/><text class="st" x="${(xs(b) + (b === 5 ? -4 : 10)).toFixed(1)}" y="${(ys(dTad(b)) + (b === 5 ? 28 : 20)).toFixed(1)}" text-anchor="${b === 5 ? 'end' : 'start'}" style="${halo}">${t}</text>`; });
    s += `<text class="st2" x="${xs(3.2).toFixed(1)}" y="${(ys(dTad(3.2)) + 30).toFixed(1)}" style="fill:#2a78d6">Gd medido</text>`;
    return svg('0 0 400 300', s);
  }

  // ---- Historia ----
  function historia() {
    let s = `<line x1="20" y1="150" x2="384" y2="150" stroke="#6b7480" stroke-width="3"/>` + cabeza(370, 150, 392, 150, '#6b7480', 14);
    const hito = (x, an, txt, arriba, l1, l2) => {
      s += `<circle cx="${x}" cy="150" r="9" fill="${AZ}" stroke="#fff" stroke-width="2"/>`;
      const y0 = arriba ? 126 : 182;
      s += `<text class="st" x="${x}" y="${arriba ? 126 : 184}" text-anchor="${an}" style="fill:${AZ}">${txt}</text>`;
      s += `<text class="st2" x="${x}" y="${arriba ? y0 - 24 : y0 + 26}" text-anchor="${an}">${arriba ? l2 : l1}</text>`;
      s += `<text class="st2" x="${x}" y="${arriba ? y0 - 46 : y0 + 48}" text-anchor="${an}">${arriba ? l1 : l2}</text>`;
    };
    hito(40, 'start', '1917', true, 'Weiss y Piccard:', 'efecto en níquel');
    hito(140, 'middle', '1933', false, 'Giauque:', 'menos de 1 K');
    hito(250, 'middle', '1976', true, 'Brown (NASA):', 'Gd con 7 T');
    hito(360, 'end', '1997', false, 'Ames y Astronautics:', '600 W con 5 T');
    return svg('0 0 400 300', s);
  }

  // ---- Etapa 2: ciclo de cuatro etapas, como el de gas ----
  function ciclo4(P) {
    const g = dTad(P.B === undefined ? 2 : P.B), e = +P.e || 1, T = [TA + g, TA, TA - g, TA];
    const cajas = [[8, 8, '1 Magnetizar', 'gas: comprimir'], [212, 8, '2 Botar calor', 'gas: condensador'], [212, 158, '3 Desmagnetizar', 'gas: expandir'], [8, 158, '4 Absorber calor', 'gas: evaporador']];
    let s = '';
    cajas.forEach(([x, y, tit, gas], i) => {
      const on = i + 1 === e, conB = i < 2;
      s += `<rect x="${x}" y="${y}" width="180" height="134" rx="10" fill="#fff" stroke="${on ? AZ : '#cbd3dd'}" stroke-width="${on ? 4 : 1.6}"/>`;
      s += `<text class="st" x="${x + 10}" y="${y + 23}">${tit}</text><text class="tk" x="${x + 10}" y="${y + 42}">${gas}</text>`;
      s += `<rect x="${x + 12}" y="${y + 52}" width="62" height="50" rx="5" fill="${colT(T[i])}" stroke="#6b7480" stroke-width="1.6"/>` + espines(x + 12, y + 52, 62, 50, 3, 2, conB ? orden(2) : 0, T[i], 5 + i, false, 15);
      s += `<text class="st2" x="${x + 86}" y="${y + 66}" style="fill:${conB ? AZ : '#7a8596'}">${conB ? 'con B' : 'B = 0'}</text>`;
      s += `<text class="st" x="${x + 86}" y="${y + 92}" style="fill:${colTx(T[i])}">${f(T[i], 1)} °C</text>`;
      if (i === 1) s += arrow(x + 86, y + 110, x + 168, y + 110, RO, 3, 9) + `<text class="tk" x="${x + 86}" y="${y + 128}">al ambiente</text>`;
      if (i === 3) s += arrow(x + 168, y + 110, x + 86, y + 110, AZ, 3, 9) + `<text class="tk" x="${x + 86}" y="${y + 128}">del interior</text>`;
    });
    s += arrow(190, 70, 210, 70, TX, 3, 9) + arrow(302, 144, 302, 156, TX, 3, 8) + arrow(210, 226, 190, 226, TX, 3, 9) + arrow(98, 156, 98, 144, TX, 3, 8);
    return svg('0 0 400 300', s);
  }

  // ---- Etapa 2: el fluido lleva el calor (dos sentidos) ----
  function fluido() {
    let s = '';
    const fila = (y, con, txt) => {
      const d = con ? `M96,${y} L304,${y}` : `M304,${y} L96,${y}`, col = con ? RO : AZ;
      s += `<path class="flux" style="stroke:${col}" d="${d}"/>` + (con ? cabeza(290, y, 306, y, col, 14) : cabeza(110, y, 94, y, col, 14));
      s += `<rect x="6" y="${y - 30}" width="88" height="60" rx="8" fill="#d6e8fb" stroke="${AZ}" stroke-width="1.6"/><text class="st2" x="50" y="${y + 5}" text-anchor="middle">interior</text>`;
      s += `<rect x="306" y="${y - 30}" width="88" height="60" rx="8" fill="#fbdcdc" stroke="${RO}" stroke-width="1.6"/><text class="st2" x="350" y="${y + 5}" text-anchor="middle">ambiente</text>`;
      if (con) s += `<rect x="146" y="${y - 44}" width="108" height="11" rx="3" fill="#c5dbf5" stroke="${AZ}" stroke-width="1.6"/><rect x="146" y="${y + 33}" width="108" height="11" rx="3" fill="#f3c4c4" stroke="${RO}" stroke-width="1.6"/>`;
      s += `<rect x="150" y="${y - 30}" width="100" height="60" rx="6" fill="${colT(con ? TA + 6.4 : TA - 6.4)}" stroke="#6b7480" stroke-width="1.6"/>`;
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) s += `<circle cx="${158 + i * 16.8}" cy="${y - 22 + j * 14.7}" r="6.2" fill="#fff" fill-opacity=".55" stroke="#6b7480" stroke-width="1.1"/>`;
      s += `<text class="st2" x="200" y="${y - (con ? 54 : 42)}" text-anchor="middle" style="fill:${col}">${txt}</text>`;
    };
    fila(88, true, '2 con imán: el fluido lleva el calor al ambiente');
    fila(232, false, '4 sin imán: el fluido enfría el interior');
    return svg('0 0 400 300', s);
  }

  // ---- Etapa 2: regenerador (los saltos se suman) ----
  function regenerador() {
    let s = `<defs><linearGradient id="rf-grad" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#7db7ef"/><stop offset="1" stop-color="#f28b82"/></linearGradient></defs>`;
    s += `<rect x="40" y="214" width="320" height="36" rx="6" fill="url(#rf-grad)" stroke="#6b7480" stroke-width="1.6"/>`;
    s += arrow(150, 232, 250, 232, TX, 2.6, 9) + arrow(250, 232, 150, 232, TX, 2.6, 9);
    s += `<text class="st2" x="40" y="274">extremo frío</text><text class="st2" x="360" y="274" text-anchor="end">extremo caliente</text><text class="tk" x="200" y="294" text-anchor="middle">lecho de Gd: el fluido va y viene</text>`;
    s += `<path d="M40,190 H104 V162 H168 V134 H232 V106 H296 V78 H360" fill="none" stroke="${NA}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<line x1="112" y1="190" x2="112" y2="162" stroke="${TX}" stroke-width="2"/><line x1="108" y1="190" x2="116" y2="190" stroke="${TX}" stroke-width="2"/><line x1="108" y1="162" x2="116" y2="162" stroke="${TX}" stroke-width="2"/>`;
    s += `<text class="st2" x="120" y="186">un salto: ΔT de una pasada</text>`;
    s += `<line x1="28" y1="190" x2="28" y2="78" stroke="${NA}" stroke-width="2.4"/><line x1="22" y1="190" x2="34" y2="190" stroke="${NA}" stroke-width="2.4"/><line x1="22" y1="78" x2="34" y2="78" stroke="${NA}" stroke-width="2.4"/>`;
    s += `<text class="st2" transform="rotate(-90 16 134)" x="16" y="134" text-anchor="middle" style="fill:${NA}">diferencia total</text>`;
    s += `<text class="st" x="200" y="40" text-anchor="middle">Temperatura a lo largo del lecho</text>`;
    return svg('0 0 400 300', s);
  }

  // ---- Etapa 2: la rueda que gira por el imán ----
  function ruedaFig(P, o) {
    o = o || {}; const g = dTad(P.B), cx = 200, cy = 150, Ro = 92, Ri = 54, R = Math.PI / 180;
    const Tz = (th) => {
      const t = ((th + 80) % 360 + 360) % 360 - 80;
      if (t < -40) return TA + g * (t + 80) / 40;
      if (t < 80) return TA + g * (1 - (t + 40) / 120);
      if (t < 120) return TA - g * (t - 80) / 40;
      return TA - g * (1 - (t - 120) / 160);
    };
    const Q = (r, th) => pt(cx, cy, r, th * R).map((v) => +v.toFixed(1));
    const sector = (a0, a1, r0, r1) => { const A = Q(r1, a0), B2 = Q(r1, a1), C = Q(r0, a1), D = Q(r0, a0), big = a1 - a0 > 180 ? 1 : 0;
      return `M${A} A${r1},${r1} 0 ${big} 1 ${B2} L${C} A${r0},${r0} 0 ${big} 0 ${D}Z`; };
    let s = `<path d="${sector(-80, 80, Ri - 10, Ro + 14)}" fill="#ede7fb" stroke="${MO}" stroke-width="2"/>`;
    for (let k = 0; k < 36; k++) { const a0 = -80 + k * 10; s += `<path d="${sector(a0, a0 + 10, Ri, Ro)}" fill="${colT(Tz(a0 + 5))}"/>`; }
    s += `<circle cx="${cx}" cy="${cy}" r="${Ro}" fill="none" stroke="#6b7480" stroke-width="1.6"/><circle cx="${cx}" cy="${cy}" r="${Ri}" fill="none" stroke="#6b7480" stroke-width="1.6"/>`;
    let sp = '';
    for (let k = 0; k < 12; k++) { const A = Q(Ri, k * 30), B2 = Q(Ro, k * 30); sp += `<line x1="${A[0]}" y1="${A[1]}" x2="${B2[0]}" y2="${B2[1]}" stroke="#fff" stroke-width="2.4"/>`; }
    s += `<g>${o.anim === false ? '' : `<animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="${f(P.t, 1).replace(',', '.')}s" repeatCount="indefinite"/>`}${sp}</g>`;
    // sentido de giro y rótulos
    const a = Q(38, -150), b = Q(38, -34);
    s += `<path d="M${a} A38,38 0 0 1 ${b}" fill="none" stroke="${TX}" stroke-width="2.4"/>` + cabeza(...Q(38, -48), ...Q(38, -26), TX, 11);
    s += `<text class="st2" x="200" y="156" text-anchor="middle">rueda</text><text class="st2" x="200" y="174" text-anchor="middle">de Gd</text>`;
    s += `<text class="st" x="307" y="111" style="fill:${MO}">imán ${f(P.B, 1)} T</text>`;
    s += `<text class="st2" x="256" y="40">1 se calienta</text>`;
    s += `<path class="flux" style="stroke:${RO}" d="M${Q(80, 35)} L352,246"/>` + cabeza(340, 239, 354, 247, RO, 13);
    s += `<text class="st2" x="396" y="272" text-anchor="end" style="fill:${RO}">2 bota calor</text><text class="st2" x="396" y="290" text-anchor="end" style="fill:${RO}">al ambiente</text>`;
    s += `<text class="st2" x="190" y="280" text-anchor="middle">3 sale del imán: se enfría</text>`;
    s += `<path class="flux" style="stroke:${AZ}" d="M44,78 L${Q(80, 215)}"/>` + cabeza(...Q(104, 215), ...Q(80, 215), AZ, 13);
    s += `<text class="st2" x="6" y="30" style="fill:${AZ}">4 saca calor</text><text class="st2" x="6" y="50" style="fill:${AZ}">del interior</text>`;
    return svg('0 0 400 300', s);
  }

  // ---- Etapa 3: |ΔS| de cada material frente a T ----
  RF.MATS = [
    { n: 'Gd', TC: 294, pico: 9.5, wb: 35, wa: 40, col: AZ },
    { n: 'Gd₅Si₂Ge₂', TC: 276, pico: 18, wb: 8, wa: 3, col: VE },
    { n: 'MnFePAs', TC: 300, pico: 18, wb: 9, wa: 9, col: NA }
  ];
  function materiales() {
    const X0 = 56, X1 = 380, Y0 = 240, Y1 = 34, T0 = 240, T1 = 320;
    const xs = (T) => X0 + (X1 - X0) * (T - T0) / (T1 - T0), ys = (v) => Y0 - (Y0 - Y1) * v / 20;
    let s = ejes(X0, X1, Y0, Y1, [240, 260, 280, 300, 320], [0, 5, 10, 15, 20], xs, ys, 'T (K)', '');
    s += `<text class="tk" transform="rotate(-90 14 137)" x="14" y="137" text-anchor="middle">|ΔS| con 5 T, J/(kg·K)</text>`;
    [[253, '−20 °C'], [277, '4 °C']].forEach(([T, t]) => { s += `<line class="ref" x1="${xs(T).toFixed(1)}" y1="${Y0}" x2="${xs(T).toFixed(1)}" y2="${Y1 - 6}" style="stroke:#7a8596"/><text class="st2" x="${xs(T).toFixed(1)}" y="${Y1 - 12}" text-anchor="middle">${t}</text>`; });
    RF.MATS.forEach((m) => {
      const pts = []; for (let T = T0; T <= T1; T += 0.5) pts.push([xs(T), ys(m.pico * Math.exp(-Math.pow((T - m.TC) / (T < m.TC ? m.wb : m.wa), 2)))]);
      s += `<polyline points="${poli(pts)}" fill="none" stroke="${m.col}" stroke-width="3.2" stroke-linejoin="round"/>`;
    });
    s += `<text class="st" x="${(xs(318)).toFixed(1)}" y="${(ys(9.5 * Math.exp(-Math.pow(24 / 40, 2))) - 10).toFixed(1)}" text-anchor="end" style="fill:${AZ};${halo}">Gd</text>`;
    s += `<text class="st" x="${(xs(274) - 6).toFixed(1)}" y="${(ys(18) + 4).toFixed(1)}" text-anchor="end" style="fill:${VE};${halo}">Gd₅Si₂Ge₂</text>`;
    s += `<text class="st" x="${(xs(303) + 4).toFixed(1)}" y="${(ys(18) + 4).toFixed(1)}" style="fill:${NA};${halo}">MnFePAs</text>`;
    return svg('0 0 400 300', s);
  }

  // ---- Etapa 3: el refrigerador como bomba de calor y la potencia eléctrica para 100 W de frío ----
  const EF0 = { Ti: 4, Ta: 30, pg: 40, pm: 60 };
  function eficFig(P) {
    const q = efic(P);
    let s = `<rect x="30" y="14" width="140" height="52" rx="8" fill="#fbdcdc" stroke="${RO}" stroke-width="1.6"/><text class="st2" x="100" y="35" text-anchor="middle">ambiente</text><text class="st" x="100" y="57" text-anchor="middle">${f(P.Ta, 0)} °C</text>`;
    s += `<rect x="30" y="234" width="140" height="52" rx="8" fill="#d6e8fb" stroke="${AZ}" stroke-width="1.6"/><text class="st2" x="100" y="255" text-anchor="middle">interior</text><text class="st" x="100" y="277" text-anchor="middle">${f(P.Ti, 0)} °C</text>`;
    s += `<circle cx="100" cy="150" r="36" fill="#fff" stroke="${TX}" stroke-width="2"/><text class="st2" x="100" y="155" text-anchor="middle">máquina</text>`;
    s += arrow(100, 232, 100, 188, AZ, 3.4, 11) + `<text class="st2" x="110" y="216" style="fill:${AZ}">Q = 100 W</text>`;
    s += arrow(100, 112, 100, 68, RO, 3.4, 11) + `<text class="st2" x="110" y="96" style="fill:${RO}">Q + W</text>`;
    s += arrow(18, 150, 62, 150, NA, 3.4, 11) + `<text class="st" x="20" y="138" style="fill:${NA}">W</text>`;
    // barras
    const top = Math.max(q.Wg, q.Wm), h = (w) => 180 * w / top, yb = 250;
    s += `<text class="tk" x="206" y="24">potencia eléctrica</text><text class="tk" x="206" y="42">para 100 W de frío</text>`;
    [[214, q.Wg, 'gas', '#adb5bd'], [282, q.Wm, 'magnético', MO]].forEach(([x, w, t, col]) => {
      s += `<rect x="${x}" y="${(yb - h(w)).toFixed(1)}" width="48" height="${h(w).toFixed(1)}" rx="3" fill="${col}" fill-opacity=".75"/>`;
      s += `<text class="st" x="${x + 24}" y="${(yb - h(w) - 6).toFixed(1)}" text-anchor="middle">${sig(w, 3)} W</text><text class="st2" x="${x + 24}" y="${yb + 20}" text-anchor="middle">${t}</text>`;
    });
    s += `<line x1="206" y1="${yb}" x2="340" y2="${yb}" stroke="#6b7480" stroke-width="1.6"/>`;
    const yc = yb - h(q.Wc);
    s += `<line class="ref" x1="206" y1="${yc.toFixed(1)}" x2="340" y2="${yc.toFixed(1)}"/><text class="st2" x="344" y="${(yc + 5).toFixed(1)}" style="fill:#eb6834">Carnot</text>`;
    return svg('0 0 400 300', s);
  }
  RF._dib = { bloqueFig, espines2, curvaTC, curvaB, historia, ciclo4, fluido, regenerador, ruedaFig, materiales, eficFig };

  // ============================================================
  // IDEAS (leyes) de cada etapa
  // ============================================================
  const LEYES = [
    [
      { c: 'Entropía', n: 'Espines y entropía', f: X`\(S = S_{\text{mag}} + S_{\text{red}}\)`,
        d: 'Cada átomo de gadolinio tiene un espín grande (siete electrones 4f desapareados). Desordenados, los espines tienen mucha entropía magnética; un campo los ordena y la baja. La red (los átomos que vibran) guarda la otra parte: es el calor del material.', w: 'La entropía mide de cuántas formas puede el material repartir su energía: más desorden, más entropía.', fig: espines2 },
      { c: 'Aislado', n: 'Proceso aislado', f: X`\(\Delta S_{\text{mag}} + \Delta S_{\text{red}} = 0 \;\Rightarrow\; \Delta T_{ad} \approx \dfrac{T\,|\Delta S_M|}{c}\)`,
        d: 'Aislado (proceso adiabático), la entropía total no cambia: lo que pierden los espines al ordenarse lo gana la red, que vibra más y se calienta. Al quitar el campo, los espines toman entropía de la red, que se enfría.', w: 'La simulación dice que los espines «liberan energía»; lo exacto es que pasan entropía a la red. T en kelvin.', fig: () => bloqueFig({ B: 2, T: TA + 6.4 }) },
      { c: 'Fórmula', n: 'La fórmula del texto', f: X`\(\left(\dfrac{\partial T}{\partial H}\right)_S = -\dfrac{\mu_0\,T}{C_H}\left(\dfrac{\partial M}{\partial T}\right)_H\)`,
        d: X`El texto la escribe sin \(\mu_0\) (sistema CGS); \(C_H\): capacidad calorífica por volumen. El efecto crece con T, es mayor si \(C_H\) es pequeña y, sobre todo, si M cambia mucho con T: cerca de la temperatura de Curie.`, w: X`M baja al calentar (\(\partial M/\partial T < 0\)): al subir H, sube T.`, fig: () => curvaTC({ M: true }) },
      { c: 'Historia', n: 'Un poco de historia', f: X`\(1917 \to 1933 \to 1976 \to 1997\)`,
        d: 'Weiss y Piccard descubrieron el efecto en 1917, en níquel (a veces se le atribuye a Warburg, 1881, que estudió el calor de la histéresis). Debye (1926) y Giauque (1927) propusieron desmagnetizar sales paramagnéticas para enfriar; en 1933 Giauque y MacDougall bajaron de 1 K. En 1976, Brown (NASA) usó gadolinio con 7 T.', w: 'Giauque recibió el premio Nobel de Química en 1949, en parte por este trabajo.', fig: historia }
    ],
    [
      { c: 'Ciclo', n: 'Cuatro etapas, como un gas', f: X`\(\begin{gathered} \text{magnetizar} \leftrightarrow \text{comprimir} \\ \text{desmagnetizar} \leftrightarrow \text{expandir} \end{gathered}\)`,
        d: '1 Magnetizar: se calienta, como un gas comprimido. 2 Con el campo puesto, el fluido le quita ese calor. 3 Desmagnetizar: queda más frío que el ambiente, como un gas que se expande. 4 Saca calor del interior.', w: 'Es un ciclo de Brayton magnético.', fig: () => ciclo4({ e: 1, B: 2 }) },
      { c: 'Fluido', n: 'El fluido y los intercambiadores', f: X`\(Q = m\,c\,\Delta T\)`,
        d: 'El calor viaja con un fluido (agua con anticongelante, o helio) que pasa por el material. Con el imán puesto, lo lleva al intercambiador caliente, que lo bota al ambiente. Sin imán, el fluido se enfría en el Gd y enfría el intercambiador del interior. El Gd va en esferas o láminas finas para que el contacto sea rápido.', w: 'Más área de contacto permite ciclos más rápidos: más potencia con la misma masa.', fig: fluido },
      { c: 'Regenerador', n: 'Regenerador activo y rueda', f: X`\(\Delta T_{\text{total}} \gg \Delta T_{ad}\)`,
        d: 'Una pasada da pocos grados. En un regenerador magnético activo, el fluido va y viene por un lecho largo de Gd: cada tramo hace su pequeño ciclo a su propia temperatura y los saltos se suman en serie, como una escalera. En la rueda, el material gira y entra y sale del imán sin parar.', w: 'Brown (NASA) propuso la regeneración en 1976; así la máquina de 1997 logró 38 K de diferencia con pasadas de unos 12 K.', fig: regenerador }
    ],
    [
      { c: 'TC', n: 'Cerca de la temperatura de Curie', f: X`\(|\Delta S_M|\ \text{máximo en}\ T \approx T_C\)`,
        d: 'El efecto es grande donde M cambia más rápido con T: alrededor de la temperatura de Curie. Lejos de ella casi desaparece. Por eso cada material sirve solo en un rango de temperaturas.', w: 'La TC del hierro es 770 °C: serviría para un horno, no para una cocina.', fig: () => curvaTC({ M: true }) },
      { c: 'Materiales', n: 'Materiales', f: X`\(\text{Gd} \qquad \text{Gd}_5\text{Si}_2\text{Ge}_2 \qquad \text{MnFeP}_{0{,}45}\text{As}_{0{,}55}\)`,
        d: 'Gd: TC = 294 K (21 °C); 5,1 J/(kg·K) con 2 T. Gd₅Si₂Ge₂ (Ames, 1997): TC = 276 K y al menos el doble de efecto; con otra proporción de Si y Ge, TC va de unos 30 a 290 K. MnFeP₀,₄₅As₀,₅₅ (2002): TC ≈ 300 K y 14,5 J/(kg·K) con 2 T, pero con arsénico, que es tóxico.', w: 'Los «gigantes» cambian de estructura cristalina: más efecto, pero con histéresis.', fig: materiales },
      { c: 'Eficiencia', n: 'Eficiencia y ambiente', f: X`\(\text{COP} = \dfrac{Q_f}{W} \qquad \text{COP}_C = \dfrac{T_f}{T_c - T_f}\)`,
        d: 'El COP es el calor sacado por cada joule eléctrico; ninguno supera el de Carnot (T en kelvin). Uno de gas doméstico llega a ≈ 40 % del de Carnot; el magnético de 1997, con 5 T, a ≈ 60 %. Y no usa gases que dañan el ozono o calientan el planeta.', w: 'Son fracciones del COP de Carnot; con imanes permanentes aún cuesta llegar al 60 %.', fig: () => eficFig(EF0) }
    ]
  ];
  RF.LEYES = LEYES;

  // ============================================================
  // ENCUESTAS (la correcta primero)
  // ============================================================
  const ENC = {
    'R-E1': { pred: true, q: 'Acercas un imán fuerte (2 T) a un bloque de gadolinio aislado, a 21 °C. ¿Qué pasa con su temperatura?', o: ['Sube unos grados', 'Baja unos grados', 'No cambia: un imán no da calor', 'Sube solo si el bloque conduce electricidad (Foucault)'], por: 'Lo vemos al final del cálculo.' },
    'R-C1': { q: 'El bloque aislado se calienta al ponerle el campo. ¿De dónde sale ese calor?', o: ['Los espines se ordenan: la entropía que pierden la gana la red, que vibra más', 'El imán le transfiere calor a través del aire que los separa', 'Las corrientes de Foucault que el campo induce en el metal', 'El rozamiento de los espines al girar calienta el metal'],
      por: X`Aislado, la entropía total no cambia. El campo ordena los espines (baja \(S_{\text{mag}}\)); esa entropía pasa a la red, que vibra más: la temperatura sube. El imán no entrega calor, y un imán que se acerca despacio casi no induce corrientes en el metal.` },
    'R-S1': { q: X`Gd a 21 °C (294 K), \(|\Delta S_M| = 5{,}1\) J/(kg·K) con 2 T y \(c = 235\) J/(kg·K). ¿Cuánto sube su temperatura?`, o: ['6,4 K', '0,46 K', '0,022 K', '1500 K'],
      por: X`\(\Delta T = \dfrac{294\cdot 5{,}1}{235} = 6{,}4\ \text{K}\). 0,46 K usa T en °C (21); 0,022 K olvida T; 1500 K olvida c.` },
    'R-W1': { q: 'Con el imán puesto, el bloque ya botó su calor al agua y está a 21 °C. Si ahora retiras el imán, ¿a qué temperatura queda?', o: ['≈ 14,6 °C', '21 °C', '27,4 °C', '8,2 °C'],
      por: 'Al retirar el imán, los espines se desordenan tomando entropía de la red: baja 6,4 K, a 14,6 °C. Si no hubiera botado antes el calor, volvería a 21 °C y no enfriaría nada. 8,2 °C resta dos veces 6,4 K.' },
    'R-C3': { q: 'En el ciclo de un refrigerador de gas, ¿a qué equivale «desmagnetizar el gadolinio»?', o: ['A expandir el gas', 'A comprimir el gas', 'A quitarle calor con el fluido', 'A absorber calor del interior'],
      por: 'Al desmagnetizar, los espines ganan entropía y la red se enfría, como un gas que se expande. Magnetizar equivale a comprimir; botar y absorber calor son las otras dos etapas.' },
    'R-S2': { q: 'Un lecho de 1,5 kg de Gd (c = 235 J/(kg·K)) con 6,4 K por pasada. ¿Cuánto calor puede sacar del interior en un ciclo?', o: ['≈ 2,3 kJ', '≈ 1,5 kJ', '≈ 0,35 kJ', '≈ 4,5 kJ'],
      por: X`\(Q = m\,c\,\Delta T = 1{,}5\cdot 235\cdot 6{,}4 = 2256\ \text{J}\). 1,5 kJ olvida la masa; 0,35 kJ olvida ΔT; 4,5 kJ usa el doble de ΔT.` },
    'R-S3': { q: 'Si el lecho hace un ciclo cada 6 s, ¿cuánta potencia de frío da, como máximo?', o: ['≈ 380 W', '≈ 2,3 kW', '≈ 13,5 kW', '≈ 190 W'],
      por: X`\(P = Q/t = 2256/6 = 376\ \text{W}\). 2,3 kW sería un ciclo por segundo; 13,5 kW multiplica por t; 190 W divide entre 12 s.` },
    'R-C4': { q: 'Con 5 T, una pasada da unos 12 K. ¿Cómo logró la máquina de 1997 una diferencia de 38 K?', o: ['Con un regenerador: el fluido suma muchos saltos pequeños en serie', 'Con un imán de 15 T, que da tres veces más salto', 'Con más gadolinio en el mismo lecho, que enfría más', 'Enfriando el imán con helio líquido a −269 °C'],
      por: 'En un regenerador magnético activo, el fluido va y viene por un lecho largo: cada tramo hace su pequeño ciclo a su propia temperatura y los saltos se suman. Más masa da más potencia, no más diferencia; el imán ya era de 5 T, y el helio solo lo mantiene superconductor.' },
    'R-C5': { q: '¿Por qué se usa gadolinio y no hierro?', o: ['Su temperatura de Curie está cerca de la ambiente (la del hierro, 770 °C)', 'Es más barato y fácil de conseguir que el hierro', 'Es diamagnético: el campo lo repele', 'Tiene mayor remanencia Br que el hierro'],
      por: 'El efecto es grande solo cerca de la temperatura de Curie, donde M cambia rápido con T. La del Gd es 21 °C; la del hierro, 770 °C. El Gd es caro y ferromagnético; la remanencia no importa aquí.' },
    'R-C6': { q: '¿Qué material elegirías para un congelador a −20 °C (253 K)?', o: ['Gd₅(SiₓGe₁₋ₓ)₄ con la proporción que ponga su TC cerca de 253 K', 'Gd puro, el de la máquina de 1997', 'MnFeP₀,₄₅As₀,₅₅, que da más efecto que el Gd', 'El de temperatura de Curie más alta posible'],
      por: 'Hay que poner TC cerca de la temperatura de trabajo. En Gd₅(SiₓGe₁₋ₓ)₄, la proporción de silicio y germanio mueve TC entre unos 30 y 290 K: se elige la que da unos 253 K. El Gd puro (294 K) y el MnFePAs (≈ 300 K) dan poco efecto a −20 °C.' },
    'R-S4': { q: 'Un refrigerador saca calor de un interior a 4 °C y lo bota a 30 °C. ¿Cuánto vale su COP de Carnot?', o: ['10,7', '0,09', '1,09', '0,15'],
      por: X`\(\text{COP}_C = \dfrac{277}{303 - 277} = 10{,}7\). 0,09 está invertido; 1,09 es \(T_c/T_f\); 0,15 usa °C.` },
    'R-S5': { q: 'Para el mismo frío, ¿cuánta energía ahorra un refrigerador magnético al 60 % de Carnot frente a uno de gas al 40 %?', o: ['33 %', '20 %', '50 %', '67 %'],
      por: X`\(W = Q/\text{COP}\), y el COP es proporcional al porcentaje: \(1 - \dfrac{40}{60} = 0{,}33\). 20 % resta los porcentajes; 50 % divide la diferencia entre 40; 67 % es la razón, no el ahorro.` },
    'Z1': { q: '¿Por qué los refrigeradores magnéticos todavía no están en todas las cocinas?', o: ['Cada pasada da pocos grados: necesitan imanes de tierras raras y regeneradores', 'No pueden enfriar por debajo de 21 °C, la TC del gadolinio', 'Usan gases que dañan la capa de ozono, como los antiguos', 'El gadolinio es radiactivo y no se puede usar en una casa'],
      por: 'Cada pasada da pocos grados, así que hace falta un regenerador; los imanes de NdFeB son caros y usan tierras raras; y con imanes permanentes todavía cuesta lograr a la vez potencia, diferencia de temperatura y buen COP. El Gd no es radiactivo y no hay gases refrigerantes.' }
  };

  // ============================================================
  // PROBLEMAS PASO A PASO
  // ============================================================
  const SOL = [
    [
      { t: 'Calentamiento con 2 T', e: [X`\Delta T_{ad} \approx \dfrac{T\,|\Delta S_M|}{c} = \dfrac{294\cdot 5{,}1}{235}`, X`\Delta T_{ad} = 6{,}4\ \text{K}`, X`T = 21 + 6{,}4 = 27{,}4\ ^\circ\text{C}`], w: 'T va en kelvin (21 °C = 294 K). Coincide con lo medido en el gadolinio con 2 T.', fig: () => bloqueFig({ B: 2, T: TA + 6.4 }) },
      { t: 'Con 5 T y con 1 T', e: [X`5\ \text{T}:\ \dfrac{294\cdot 9{,}5}{235} = 11{,}9\ \text{K}`, X`\text{medido: } 11{,}6\ \text{K}\qquad 1\ \text{T}:\ \approx 3\ \text{K}`], w: X`No es proporcional al campo: cerca de TC crece como \(B^{2/3}\). Con 2,5 veces más campo da 1,8 veces más ΔT.`, fig: curvaB },
      { t: 'Botar el calor con el imán puesto', e: [X`B = 2\ \text{T}:\quad 27{,}4\ ^\circ\text{C} \to 21\ ^\circ\text{C}`, X`S_{\text{mag}}\ \text{sigue baja: espines ordenados}`], w: 'El agua a 21 °C le quita el calor. ¿Qué pasará al retirar el imán? Lo votamos después del panel.', fig: () => bloqueFig({ B: 2, T: TA, u: 'dis' }) }
    ],
    [
      { t: 'Calor por ciclo', e: [X`Q = m\,c\,\Delta T = 1{,}5\cdot 235\cdot 6{,}4`, X`Q = 2256\ \text{J} \approx 2{,}3\ \text{kJ}`, X`m\,T\,|\Delta S_M| = 1{,}5\cdot 294\cdot 5{,}1 = 2249\ \text{J}`], w: 'Es el calor que el Gd saca del interior en la etapa 4, si el interior está a 21 °C. Por las dos vías da casi lo mismo.', fig: () => ciclo4({ e: 4, B: 2 }) },
      { t: 'Potencia con un ciclo cada 6 s', e: [X`P = \dfrac{Q}{t} = \dfrac{2256}{6}`, X`P = 376\ \text{W} \approx 380\ \text{W}`], w: 'Es un techo ideal: el intercambio de calor nunca es perfecto y el interior está más frío que el ambiente.', fig: () => ruedaFig({ m: 1.5, B: 2, t: 6 }) },
      { t: 'La máquina real de 1997', e: [X`5\ \text{T};\; 2\times 1{,}5\ \text{kg de Gd}`, X`P_{max} = 600\ \text{W}\qquad \Delta T_{max} = 38\ \text{K}`, X`\text{COP hasta} \approx 15`], w: 'No todo a la vez: los 600 W con poca diferencia de temperatura y los 38 K con poca potencia. El imán superconductor necesita helio líquido; en 2001 Astronautics probó una rueda con un imán permanente de tierras raras y polvo de gadolinio.', fig: regenerador }
    ],
    [
      { t: 'COP de Carnot', e: [X`T_f = 4 + 273 = 277\ \text{K}\qquad T_c = 30 + 273 = 303\ \text{K}`, X`\text{COP}_C = \dfrac{T_f}{T_c - T_f} = \dfrac{277}{26} = 10{,}65`], w: 'Es el máximo teórico: entre 4 y 30 °C, ningún refrigerador saca más de 10,65 J de calor por cada joule eléctrico. Con °C saldría 4/26 = 0,15: sin sentido.', fig: () => eficFig(EF0) },
      { t: 'COP de cada refrigerador', e: [X`\text{gas}:\ 0{,}40\cdot 10{,}65 = 4{,}26`, X`\text{magnético}:\ 0{,}60\cdot 10{,}65 = 6{,}39`], w: 'El 60 % se midió en la máquina de 1997, con 5 T; con imanes permanentes todavía cuesta llegar.', fig: () => eficFig(EF0) },
      { t: 'Energía para el mismo frío', e: [X`W_{gas} = \dfrac{100}{4{,}26} = 23{,}5\ \text{W}`, X`W_{mag} = \dfrac{100}{6{,}39} = 15{,}6\ \text{W}`, X`\text{ahorro} = 1 - \dfrac{0{,}40}{0{,}60} = 33\ \%`], w: 'Sacando 100 W de calor todo el mes (720 h): 16,9 kWh frente a 11,3 kWh. El ahorro no depende de las temperaturas: solo de 40 % frente a 60 %.', fig: () => eficFig(EF0) }
    ]
  ];
  RF.SOL = SOL;

  // ============================================================
  // PANELES «¿qué pasa si…?»
  // ============================================================
  function pista(P) {
    const B = P.B, T = P.T;
    if (P.u === 'cal') return 'El Gd estaba más caliente que el interior: lo calentaste. Primero bota el calor con el imán puesto y luego retira el imán.';
    if (B > 0.04) return T > TA + 0.05 ? 'Siguiente: bota el calor al agua con el imán puesto.' : 'Siguiente: retira el imán (B = 0).';
    if (T < Math.min(TA, P.Ti) - 0.05) return 'Siguiente: saca calor del interior.';
    if (T > TA + 0.05) return 'Siguiente: bota el calor al agua.';
    if (P.n >= 3) return 'Repite el ciclo. Con 2 T, el interior no baja de 14,6 °C (21 − 6,4): es el límite de una sola pasada.';
    return 'Siguiente: acerca el imán (sube B).';
  }
  RF.pista = pista;
  const PANEL = {
    bloque: { fg: true, rst: 'Reiniciar', def: { B: 0, T: TA, Ti: TA, Qa: 0, Qi: 0, n: 0, u: '' }, dib: (P) => bloqueFig(P),
      ctl: [{ k: 'B', l: 'Campo del imán B', u: 'T', min: 0, max: 5, st: 0.1, d: 1, full: true }],
      acc: [['dis', 'Botar calor al agua (21 °C)', 'ca'], ['abs', 'Sacar calor del interior', 'fr']],
      al(P, k, viejo) { if (k === 'B') cambiaB(P, viejo); },
      accion,
      lect(P) {
        const g = dTad(P.B), T = P.T, cls = T > TA + 0.05 ? 'no' : T < TA - 0.05 ? 'az' : 'neu';
        return `<div class="badge ${cls}">Gd: ${f(T, 1)} °C</div>
          <div class="c"><small>ΔT por pasada con este B</small><b>${f(g, 1)} K</b></div>
          <div class="c"><small>Orden de los espines</small><b>${f(orden(P.B) * 100, 0)} %</b></div>
          <div class="c"><small>Interior</small><b style="color:${colTx(P.Ti)}">${f(P.Ti, 1)} °C</b></div>
          <div class="c"><small>Ciclos</small><b>${P.n || 0}</b></div>
          <div class="c"><small>Calor botado al agua</small><b>${f(P.Qa / 1000, 2)} kJ</b></div>
          <div class="c"><small>Calor sacado del interior</small><b>${f(P.Qi / 1000, 2)} kJ</b></div>
          ${P.B > 2 ? '<div class="alert">Más de 2 T: hace falta un imán superconductor.</div>' : ''}
          <div class="alert pista">${pista(P)}</div>`;
      } },
    rueda: { fg: true, def: { m: 1.5, B: 2, t: 6 }, dib: (P) => ruedaFig(P),
      ctl: [{ k: 'm', l: 'Masa de Gd', u: 'kg', min: 0.5, max: 5, st: 0.1, d: 1, full: true }, { k: 'B', l: 'Campo B', u: 'T', min: 0, max: 5, st: 0.1, d: 1, full: true }, { k: 't', l: 'Tiempo por vuelta', u: 's', min: 2, max: 20, st: 1, d: 0, full: true }],
      lect(P) {
        const q = rueda0(P);
        return `<div class="badge ${q.W > 0 ? 'ok' : 'neu'}">Frío ideal: ${q.W >= 1000 ? f(q.W / 1000, 2) + ' kW' : f(q.W, 0) + ' W'}</div>
          <div class="c"><small>ΔT por pasada</small><b>${f(q.g, 1)} K</b></div>
          <div class="c"><small>Calor por vuelta</small><b>${f(q.Q / 1000, 2)} kJ</b></div>
          <div class="c"><small>Vueltas por minuto</small><b>${f(q.rpm, q.rpm < 10 ? 1 : 0)}</b></div>
          <div class="c"><small>Capacidad térmica m·c</small><b>${f(P.m * CGD, 0)} J/K</b></div>
          <div class="c" style="grid-column:1/3"><small>Máquina de 1997 (real, 5 T y 3 kg)</small><b>600 W</b></div>
          ${P.B > 2 ? '<div class="alert">Más de 2 T pide un imán superconductor, enfriado con helio líquido.</div>' : ''}
          ${P.B < 0.05 ? '<div class="alert">Sin campo no hay efecto: el Gd entra y sale igual.</div>' : ''}`;
      } },
    efic: { fg: true, def: Object.assign({}, EF0), dib: (P) => eficFig(P),
      ctl: [{ k: 'Ti', l: 'Interior', u: '°C', min: -20, max: 15, st: 1, d: 0, full: true }, { k: 'Ta', l: 'Ambiente', u: '°C', min: 20, max: 40, st: 1, d: 0, full: true },
        { k: 'pg', l: 'Gas: % de Carnot', u: '%', min: 20, max: 60, st: 5, d: 0, full: true }, { k: 'pm', l: 'Magnético: % de Carnot', u: '%', min: 30, max: 70, st: 5, d: 0, full: true }],
      lect(P) {
        const q = efic(P), b = P.pm > P.pg ? `<div class="badge ok">Ahorro: ${f(q.ah * 100, 0)} %</div>` : P.pm === P.pg ? '<div class="badge neu">Gastan lo mismo</div>' : `<div class="badge no">Gasta ${f((P.pg / P.pm - 1) * 100, 0)} % más</div>`;
        return `${b}
          <div class="c" style="grid-column:1/3"><small>COP de Carnot</small><b>${sig(q.C, 3)}</b></div>
          <div class="c"><small>COP del de gas</small><b>${sig(q.cg, 3)}</b></div>
          <div class="c"><small>COP del magnético</small><b>${sig(q.cm, 3)}</b></div>
          <div class="c"><small>W del de gas</small><b>${sig(q.Wg, 3)} W</b></div>
          <div class="c"><small>W del magnético</small><b>${sig(q.Wm, 3)} W</b></div>
          <div class="c" style="grid-column:1/3"><small>kWh al mes (gas y magnético)</small><b>${sig(q.kg, 3)} y ${sig(q.km, 3)}</b></div>`;
      } }
  };
  RF.PANEL = PANEL;

  // ============================================================
  // PANTALLAS
  // ============================================================
  RF.ETAPAS = ['El efecto', 'El ciclo y la máquina', 'Materiales y eficiencia'];
  const PREF = ['Gadolinio', 'Máquina', 'Eficiencia'];
  const enc = (id, et) => Object.assign({ id, et, tipo: 'enc', c: 0, t: 'Encuesta ' + id }, ENC[id]);
  const ley = (id, et, k) => ({ id, et, tipo: 'ley', k, t: 'Ideas: ' + LEYES[et][k].n.charAt(0).toLowerCase() + LEYES[et][k].n.slice(1) });
  const sol = (id, et, k) => ({ id, et, tipo: 'sol', k });
  const panel = (id, et, D, t, nota, P) => ({ id, et, tipo: 'panel', D, t, nota, P: P || {} });
  const chk = (id, et, D, t, P, nota) => ({ id, et, tipo: 'panel', D, t: 'Compruébalo: ' + t, P, nota });

  RF.PASOS = [
    { id: 'r-enun', et: 0, tipo: 'info', t: 'Enfriar con imanes',
      txt: 'Un bloque de gadolinio (Gd) aislado, a 21 °C, entre los polos de un imán que puede llegar a 2 T. El Gd es un metal de tierras raras cuya temperatura de Curie está justo a temperatura ambiente. ¿Qué le pasa al acercar el imán? ¿Y al retirarlo?',
      chips: [['m', '1,5 kg'], ['c', '235 J/(kg·K)'], ['T inicial', '21 °C'], ['TC del Gd', '294 K'], ['B', '0 → 2 T'], ['ΔS magn. (2 T)', '−5,1 J/(kg·K)'], ['ΔS magn. (5 T)', '−9,5 J/(kg·K)'], ['agua', '21 °C']],
      nota: 'Basado en J. C. Fernández, Electromagnetismo (FIUBA, 2004), pp. 4-34 a 4-36, con datos medidos del gadolinio.', fig: () => bloqueFig({ B: 0, T: TA }) },
    enc('R-E1', 0),
    ley('r-ley1', 0, 0), enc('R-C1', 0), ley('r-ley2', 0, 1), ley('r-ley3', 0, 2), ley('r-ley4', 0, 3),
    enc('R-S1', 0), sol('r-sol1', 0, 0), sol('r-sol2', 0, 1), sol('r-sol3', 0, 2),
    { id: 'r-pred', et: 0, tipo: 'pred', ref: 'R-E1', t: 'Gadolinio: ¿cuánto predijeron?', res: 'Sube: con 2 T, de 21 a 27,4 °C.', fig: () => bloqueFig({ B: 2, T: TA + 6.4 }) },
    panel('r-panel', 0, 'bloque', 'Bloque de gadolinio: la simulación', 'Mueve B (el imán) y usa los botones. Repite el ciclo y mira cómo se enfría el interior.'),
    enc('R-W1', 0), chk('r-chk1', 0, 'bloque', 'retira el imán', { B: 2, T: TA, Ti: TA, Qa: CB * 6.4, Qi: 0, n: 0, u: 'dis' }, 'Ya botó el calor con el imán puesto. Baja B a cero.'),

    { id: 'm-enun', et: 1, tipo: 'info', t: 'Un refrigerador que repite el ciclo',
      txt: 'El bloque enfría una sola vez. Para enfriar sin parar hay que repetir cuatro etapas y mover el calor con un fluido. Calculamos cuánto saca un lecho de 1,5 kg de Gd con 2 T y un ciclo cada 6 s, y lo comparamos con la máquina que Ames Laboratory y Astronautics probaron en 1997.',
      chips: [['m', '1,5 kg'], ['c', '235 J/(kg·K)'], ['ΔT (2 T)', '6,4 K'], ['ciclo', '6 s'], ['1997: imán', '5 T'], ['1997: Gd', '2 × 1,5 kg'], ['1997: frío', 'hasta 600 W'], ['1997: ΔT', 'hasta 38 K']], fig: () => ciclo4({ e: 1, B: 2 }) },
    ley('m-ley1', 1, 0), enc('R-C3', 1), ley('m-ley2', 1, 1),
    enc('R-S2', 1), sol('m-sol1', 1, 0), enc('R-S3', 1), sol('m-sol2', 1, 1),
    enc('R-C4', 1), ley('m-ley3', 1, 2), sol('m-sol3', 1, 2),
    panel('m-panel', 1, 'rueda', 'La rueda: ¿qué pasa si cambiamos un valor?', 'Cambia la masa de Gd, el campo o el tiempo por vuelta.'),

    { id: 'e-enun', et: 2, tipo: 'info', t: 'Materiales y eficiencia',
      txt: '¿Por qué gadolinio? ¿Hay algo mejor? ¿Y gasta menos que un refrigerador de gas? Lo comparamos con un refrigerador doméstico: interior a 4 °C y calor botado a 30 °C. Los porcentajes son fracciones del COP de Carnot.',
      chips: [['Gd: TC', '294 K'], ['Gd₅Si₂Ge₂: TC', '276 K'], ['MnFePAs: TC', '≈ 300 K'], ['hierro: TC', '1043 K'], ['interior', '4 °C'], ['descarga', '30 °C'], ['gas', '40 %'], ['magnético', '60 %']], fig: materiales },
    ley('e-ley1', 2, 0), enc('R-C5', 2), ley('e-ley2', 2, 1), enc('R-C6', 2), ley('e-ley3', 2, 2),
    enc('R-S4', 2), sol('e-sol1', 2, 0), sol('e-sol2', 2, 1), enc('R-S5', 2), sol('e-sol3', 2, 2),
    panel('e-panel', 2, 'efic', 'Eficiencia: ¿qué pasa si cambiamos un valor?', 'Cambia las temperaturas o el % de Carnot de cada refrigerador.'),
    enc('Z1', 2),
    { id: 'cierre', et: 2, tipo: 'cierre', t: 'Cierre' }
  ];
  RF.PASOS.forEach((p, i) => {
    p.n = i;
    if (p.tipo === 'sol') { const tot = SOL[p.et].length; p.t = PREF[p.et] + ', paso ' + (p.k + 1) + ' de ' + tot + ': ' + SOL[p.et][p.k].t; p.tot = tot; }
  });
  RF.ENC = ENC;

  // ============================================================
  // VISTAS
  // ============================================================
  const chipsHtml = (C) => `<div class="chips">${C.map((x) => `<div class="chip"><small>${x[0]}</small>${x[1]}</div>`).join('')}</div>`;
  function vInfo(cont, p) {
    cont.innerHTML = `<div class="vista"><div class="txt"><p>${p.txt}</p>${chipsHtml(p.chips)}${p.nota ? `<p class="lbl">${p.nota}</p>` : ''}</div><div class="fig">${p.fig()}</div></div>`;
    EM.tex(cont); return {};
  }
  function vLey(cont, p, v, cambio) {
    const leyes = LEYES[p.et]; let k = v && v.ley !== undefined && leyes[v.ley] ? v.ley : p.k;
    cont.innerHTML = `<div class="vista leyv"><div class="txt"><div class="leyes">${leyes.map((L, i) => `<button class="ley" data-i="${i}"><span class="n">${i + 1}</span>${L.c}</button>`).join('')}</div><div class="ley-det card"></div></div><div class="fig"></div></div>`;
    const lista = cont.querySelector('.leyes');
    lista.onclick = (e) => { const b = e.target.closest('.ley'); if (!b) return; k = +b.dataset.i; pintar(); cambio && cambio({ ley: k }); };
    function pintar() {
      const L = leyes[k];
      lista.querySelectorAll('.ley').forEach((b, i) => b.classList.toggle('sel', i === k));
      cont.querySelector('.ley-det').innerHTML = `<p class="ley-n">${L.n}</p><div class="ley-f">${L.f.replace('\\(', '\\[').replace(/\\\)$/, '\\]')}</div><p>${L.d}</p><p class="lbl">${L.w}</p>`;
      cont.querySelector('.fig').innerHTML = L.fig();
      EM.tex(cont);
    }
    pintar();
    return { act(v2) { if (v2 && v2.ley !== undefined && v2.ley !== k && leyes[v2.ley]) { k = v2.ley; pintar(); } } };
  }
  function vSol(cont, p) {
    const S = SOL[p.et][p.k];
    cont.innerHTML = `<div class="vista sol"><div class="fig ancha">${S.fig()}</div><div class="txt"><div class="stp${p.k === p.tot - 1 ? ' last' : ''}"><span class="t">Paso ${p.k + 1} de ${p.tot}: ${S.t}</span>${S.e.map((x) => `<div class="e">\\[${x}\\]</div>`).join('')}<span class="why">${S.w}</span></div></div></div>`;
    EM.tex(cont); return {};
  }
  // Panel con deslizadores, selectores y botones de acción (los botones cambian el estado y lo envían)
  function vPanel(cont, p, v, cambio) {
    const D = PANEL[p.D]; const ini = () => Object.assign({}, D.def, p.P || {});
    let P = v && v.P ? Object.assign({}, D.def, v.P) : ini();
    cont.innerHTML = `<div class="vista panel${D.fg ? ' fg' : ''}"><div class="txt ctl-col"><div class="ctl"></div>
      ${D.acc ? `<div class="acc">${D.acc.map(([id, et, cl]) => `<button class="btn ${cl || ''}" data-acc="${id}">${et}</button>`).join('')}</div>` : ''}
      <div class="row"><button class="btn sm rst">${D.rst || 'Valores de esta pantalla'}</button></div>
      ${p.nota ? `<p class="lbl nota">${esc(p.nota)}</p>` : ''}</div>
      <div class="fig"></div><div class="txt rd"></div></div>`;
    const ctl = cont.querySelector('.ctl');
    ctl.innerHTML = D.ctl.map((c) => c.sel ? `<div class="selg"><span class="sl">${c.l}</span><div class="opts">${c.sel.map(([val, et]) => `<button data-k="${c.k}" data-val="${val}">${et}</button>`).join('')}</div></div>`
      : `<div${c.full ? ' style="grid-column:1/3"' : ''}><label><span>${c.l}</span><b data-v="${c.k}"></b></label><input type="range" data-k="${c.k}" min="${c.min}" max="${c.max}" step="${c.st}"></div>`).join('');
    function sync() {
      D.ctl.forEach((c) => {
        if (c.sel) { ctl.querySelectorAll(`button[data-k="${c.k}"]`).forEach((b) => b.classList.toggle('on', b.dataset.val === String(P[c.k]))); return; }
        const inp = ctl.querySelector(`input[data-k="${c.k}"]`);
        if (document.activeElement !== inp) inp.value = P[c.k];
        ctl.querySelector(`b[data-v="${c.k}"]`).textContent = f(P[c.k], c.d) + (c.u ? ' ' + c.u : '');
      });
    }
    function dibujar() { cont.querySelector('.fig').innerHTML = D.dib(P); cont.querySelector('.rd').innerHTML = D.lect(P); }
    const avisar = () => cambio && cambio({ P: Object.assign({}, P) });
    ctl.oninput = (e) => {
      const k = e.target.dataset.k; if (!k || e.target.tagName !== 'INPUT') return;
      const viejo = P[k]; P[k] = +e.target.value; if (D.al) D.al(P, k, viejo);
      sync(); dibujar(); avisar();
    };
    ctl.onclick = (e) => {
      const b = e.target.closest('button[data-val]'); if (!b) return;
      const c = D.ctl.find((x) => x.k === b.dataset.k), it = c.sel.find(([val]) => String(val) === b.dataset.val);
      const viejo = P[c.k]; P[c.k] = it[0]; if (D.al) D.al(P, c.k, viejo);
      sync(); dibujar(); avisar();
    };
    const acc = cont.querySelector('.acc');
    if (acc) acc.onclick = (e) => { const b = e.target.closest('button[data-acc]'); if (!b) return; D.accion(P, b.dataset.acc); sync(); dibujar(); avisar(); };
    cont.querySelector('.rst').onclick = () => { P = ini(); sync(); dibujar(); avisar(); };
    sync(); dibujar();
    return { act(v2) { if (!v2 || !v2.P) return; P = Object.assign({}, D.def, v2.P); sync(); dibujar(); } };
  }
  function vPred(cont, p, v) {
    const e1 = RF.PASOS.find((x) => x.id === p.ref);
    function pintar(v2) {
      const pr = (v2 && v2.pred) || null;
      cont.innerHTML = `<div class="vista predv"><div class="txt"><p class="big">Resultado: <b class="on-t">${esc(p.res)}</b></p>
        <p>Lo que votaron antes de calcular:</p>${EM.barras(e1, pr ? pr.c : null, { correcta: true })}
        ${pr ? `<p class="lbl">${pr.n} votos.</p>` : '<p class="lbl">No hubo votos en la predicción.</p>'}</div>
        <div class="fig">${p.fig()}</div></div>`;
      EM.tex(cont);
    }
    pintar(v);
    return { act(v2) { pintar(v2); } };
  }
  function vCierre(cont) {
    cont.innerHTML = `<div class="vista"><div class="txt"><ul class="sum">
      <li>Magnetizar ordena los espines y el material aislado se calienta; desmagnetizar lo enfría.</li>
      <li>Gd con 2 T: 6,4 K por pasada. Ciclo: magnetizar, botar calor, desmagnetizar, absorber calor.</li>
      <li>El regenerador suma pasadas. 1,5 kg y un ciclo cada 6 s: ≈ 380 W ideales.</li>
      <li>Solo cerca de TC hay efecto grande: cada material sirve en su rango.</li>
      <li>Sin gases dañinos; al 60 % de Carnot gastaría 33 % menos que uno de gas al 40 %.</li></ul></div>
      <div class="txt"><div class="card"><b>Supuestos y límites</b><ul class="sum lbl">
      <li>Modelo simple: ΔT por pasada fijo (el medido cerca de TC) e intercambio de calor perfecto.</li>
      <li>La fórmula del texto está en CGS (sin \\(\\mu_0\\)); el efecto lo descubrieron Weiss y Piccard (1917).</li>
      <li>«Liberan energía»: lo exacto es que el orden pasa entropía a la red; el imán no entrega calor.</li>
      <li>40 % y 60 % son fracciones del COP de Carnot; el 60 % se midió con 5 T.</li>
      <li>Basado en J. C. Fernández (FIUBA, 2004), pp. 4-34 a 4-36; datos de Ames Laboratory, Zimm (1998) y Tegus (2002).</li></ul></div></div></div>`;
    EM.tex(cont);
    return {};
  }

  RF.vista = function (cont, p, v, modo, cambio) {
    cont.classList.add('modo-' + modo);
    switch (p.tipo) {
      case 'info': return vInfo(cont, p);
      case 'ley': return vLey(cont, p, v, cambio);
      case 'sol': return vSol(cont, p);
      case 'panel': return vPanel(cont, p, v, cambio);
      case 'pred': return vPred(cont, p, v);
      case 'cierre': return vCierre(cont);
      default: cont.innerHTML = ''; return {};
    }
  };
})();
