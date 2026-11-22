// ============================================================
// Cápsula «Circuitos magnéticos: toroide con dos materiales e imán en anillo» (22/11/2026).
// Basada en los ejemplos 4-2 y 4-4 de J. C. Fernández (Facultad de Ingeniería, UBA), con datos numéricos
// propuestos y aprobados por el docente. Convención de la figura: el material 1 ocupa el sector α.
// Usa las piezas comunes de em-capsula.js (EM.barras, EM.orden, EM.tex, EM.esc, EM.f, EM.sig).
// ============================================================
(function () {
  'use strict';
  const EM = window.EM;
  const MG = window.MG = {};
  const MU0 = 4e-7 * Math.PI, X = String.raw;
  const f = EM.f, sig = EM.sig, esc = EM.esc;
  MG.titulo = 'Circuitos magnéticos: toroide e imán';
  window.CAPSULAS = window.CAPSULAS || {};
  window.CAPSULAS.magneticos = MG;

  // ---------------- formato LaTeX ----------------
  const NB = '\u202f';
  const aTex = (s) => s.replace(/,/g, '{,}').split(NB).join('\\,').replace('−', '-');
  const tf = (x, d) => aTex(f(x, d)), tsig = (x, n) => aTex(sig(x, n));
  function tsci(x, n) { n = n || 3; const e = Math.floor(Math.log10(Math.abs(x))); return tf(x / Math.pow(10, e), n - 1) + '\\cdot 10^{' + e + '}'; }
  function sci(x, n) { n = n || 3; if (x === 0) return '0'; const e = Math.floor(Math.log10(Math.abs(x))); const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }; return f(x / Math.pow(10, e), n - 1) + '×10' + String(e).split('').map((c) => SUP[c] || c).join(''); }

  // ---------------- física ----------------
  // Toroide: radios a y b (cm), sección cuadrada de lado b − a, sector α (grados) de material 1, resto de material 2.
  MG.TD = { a: 8, b: 12, al: 30, m1: 100, m2: 2000, N: 200, I: 2 };
  function tor(P) {
    const a = P.a / 100, b = Math.max(P.b, P.a + 0.2) / 100, al = P.al * Math.PI / 180;
    const s = al / P.m1 + (2 * Math.PI - al) / P.m2, NI = P.N * P.I, K = MU0 * NI / s; // B(r) = K / r
    const rm = (a + b) / 2, h = b - a, S = h * h, Phi = h * K * Math.log(b / a), Phia = K / rm * S;
    return { a, b, al, s, NI, K, rm, h, S, Ba: K / a, Bm: K / rm, Bb: K / b, Phi, Phia,
      err: Phi ? (Phi - Phia) / Phi * 100 : 0, R: s / (MU0 * h * Math.log(b / a)), sh1: (al / P.m1) / s * 100,
      H1: K / rm / (MU0 * P.m1), H2: K / rm / (MU0 * P.m2), l1: al * rm, l2: (2 * Math.PI - al) * rm };
  }
  MG.tor = tor;
  // Imán en anillo: M (×10⁵ A/m), radio medio r (cm), entrehierro h (mm). Sin bobina.
  MG.ID = { M: 3, r: 5, h: 5 };
  function iman(P) {
    const M = P.M * 1e5, r = P.r / 100, L = 2 * Math.PI * r, h = Math.min(P.h / 1000, 0.95 * L), k = h / L;
    const H0 = (1 - k) * M, H = -k * M;
    return { M, r, L, h, k, H0, H, B: MU0 * H0, Bmax: MU0 * M, frac: (1 - k) * 100 };
  }
  MG.iman = iman;
  const T0 = tor(MG.TD), I0 = iman(MG.ID);

  // ---------------- dibujos ----------------
  function arrow(x1, y1, x2, y2, col, w, hs) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L; hs = hs || 9;
    const bx = x2 - ux * hs, by = y2 - uy * hs;
    return `<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${col}" stroke-width="${w || 3}" stroke-linecap="round"/>` +
      `<polygon points="${x2},${y2} ${bx - uy * hs * 0.6},${by + ux * hs * 0.6} ${bx + uy * hs * 0.6},${by - ux * hs * 0.6}" fill="${col}"/>`;
  }
  const pt = (cx, cy, r, t) => [cx + r * Math.cos(t), cy + r * Math.sin(t)];
  function sector(cx, cy, ri, ro, t1, t2) {
    if (t2 - t1 >= 2 * Math.PI - 1e-6) return `M${cx + ro},${cy} A${ro},${ro} 0 1 1 ${cx - ro},${cy} A${ro},${ro} 0 1 1 ${cx + ro},${cy} Z M${cx + ri},${cy} A${ri},${ri} 0 1 0 ${cx - ri},${cy} A${ri},${ri} 0 1 0 ${cx + ri},${cy} Z`;
    const lg = t2 - t1 > Math.PI ? 1 : 0, [x1, y1] = pt(cx, cy, ro, t1), [x2, y2] = pt(cx, cy, ro, t2), [x3, y3] = pt(cx, cy, ri, t2), [x4, y4] = pt(cx, cy, ri, t1);
    return `M${x1},${y1} A${ro},${ro} 0 ${lg} 1 ${x2},${y2} L${x3},${y3} A${ri},${ri} 0 ${lg} 0 ${x4},${y4} Z`;
  }
  function arco(cx, cy, r, t1, t2) { const [x1, y1] = pt(cx, cy, r, t1), [x2, y2] = pt(cx, cy, r, t2); return `M${x1},${y1} A${r},${r} 0 ${t2 - t1 > Math.PI ? 1 : 0} 1 ${x2},${y2}`; }
  const C1 = '#f2a65a', C1b = '#b4691f', C2 = '#f6dc6b', C2b = '#a8891a', AZ = '#1c7ed6', RO = '#c92a2a';

  // Toroide visto de frente, con la sección a la derecha. hl: camino, cara, sector, flujo, seccion, bobina
  const VBT = '-14 -14 404 318';
  function toroide(P, o) {
    o = o || {}; const hl = o.hl || [], q = tor(P);
    const cx = 145, cy = 145, Ro = 122, Ri = Ro * q.a / q.b, al = q.al, t1 = -Math.PI / 2 - al / 2, t2 = -Math.PI / 2 + al / 2;
    let s = '';
    s += `<path d="${sector(cx, cy, Ri, Ro, t2, t1 + 2 * Math.PI)}" fill="${C2}" stroke="${C2b}" stroke-width="2" fill-rule="evenodd"/>`;
    if (al > 0.005) s += `<path d="${sector(cx, cy, Ri, Ro, t1, t2)}" fill="${C1}" stroke="${C1b}" stroke-width="2"/>`;
    // líneas de flujo: más juntas cerca del borde interior (B ∝ 1/r)
    const nl = 5, fuerte = hl.indexOf('flujo') >= 0;
    for (let i = 0; i < nl; i++) {
      const r = Ri * Math.pow(Ro / Ri, (i + 0.5) / nl);
      s += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" class="flux${o.I === 0 ? ' off' : ''}" style="opacity:${fuerte ? 1 : 0.45};stroke-width:${fuerte ? 3 : 2}"/>`;
    }
    // bobina abajo (material 2)
    const cb = hl.indexOf('bobina') >= 0 ? RO : '#b45309';
    for (let g = -36; g <= 36; g += 12) {
      const t = Math.PI / 2 + g * Math.PI / 180, [xa, ya] = pt(cx, cy, Ri - 9, t), [xb, yb] = pt(cx, cy, Ro + 9, t);
      s += `<line x1="${xa}" y1="${ya}" x2="${xb}" y2="${yb}" stroke="${cb}" stroke-width="6" stroke-linecap="round"/>`;
    }
    { const [xa, ya] = pt(cx, cy, Ro + 9, Math.PI / 2 + 0.63); s += arrow(xa - 26, ya + 14, xa - 4, ya + 2, '#1f2633', 2.4) + `<text class="st" x="${xa - 44}" y="${ya + 24}">I</text>`;
      const [xn, yn] = pt(cx, cy, Ro + 14, Math.PI / 2 - 0.5); s += `<text class="st" x="${xn + 4}" y="${yn + 14}">N</text>`; }
    // etiquetas de materiales
    { const [x, y] = pt(cx, cy, (Ri + Ro) / 2, -Math.PI / 2); s += `<text class="st" x="${x}" y="${y + 6}" text-anchor="middle">μ₁</text>`; }
    { const [x, y] = pt(cx, cy, (Ri + Ro) / 2, Math.PI * 0.95); s += `<text class="st" x="${x}" y="${y + 6}" text-anchor="middle">μ₂</text>`; }
    // ángulo α
    if (al > 0.005) {
      s += `<path d="${arco(cx, cy, 34, t1, t2)}" fill="none" stroke="#1f2633" stroke-width="1.6"/>`;
      [t1, t2].forEach((t) => { const [x, y] = pt(cx, cy, Ri, t); s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#1f2633" stroke-width="1.2" stroke-dasharray="4 3"/>`; });
      s += `<text class="st" x="${cx}" y="${cy - 40}" text-anchor="middle">α</text>`;
    }
    // caras entre materiales
    if (al > 0.005) {
      const fc = hl.indexOf('cara') >= 0;
      [t1, t2].forEach((t) => { const [xa, ya] = pt(cx, cy, Ri, t), [xb, yb] = pt(cx, cy, Ro, t); s += `<line x1="${xa}" y1="${ya}" x2="${xb}" y2="${yb}" stroke="${fc ? RO : '#5d4a1a'}" stroke-width="${fc ? 5 : 2.4}"/>`; });
      if (fc) { const [x, y] = pt(cx, cy, Ro + 6, t2); s += arrow(x + 6, y - 22, x + 20, y - 20, AZ, 3) + `<text class="st" x="${x + 24}" y="${y - 16}" style="fill:${RO}">cara</text>`; }
    }
    if (hl.indexOf('sector') >= 0 && al > 0.005) s += `<path d="${sector(cx, cy, Ri, Ro, t1, t2)}" fill="none" stroke="${RO}" stroke-width="4"/>`;
    // radios a y b
    { const t = Math.PI * 0.78, [xa, ya] = pt(cx, cy, Ri, t), [xb, yb] = pt(cx, cy, Ro, t);
      s += `<line x1="${cx}" y1="${cy}" x2="${xb}" y2="${yb}" stroke="#1f2633" stroke-width="1.4"/><circle cx="${xa}" cy="${ya}" r="3" fill="#1f2633"/>`;
      s += `<text class="st2" x="${(cx + xa) / 2 - 2}" y="${(cy + ya) / 2 - 6}" text-anchor="end">a</text><text class="st2" x="${xb - 6}" y="${yb + 4}" text-anchor="end">b</text>`; }
    // camino C de radio r
    if (hl.indexOf('camino') >= 0) {
      const r = (Ri + Ro) / 2; s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${RO}" stroke-width="3" stroke-dasharray="8 5"/>`;
      s += `<text class="st" x="${cx}" y="${cy + 34}" text-anchor="middle" style="fill:${RO}">C (radio r)</text>`;
    }
    // sección cuadrada a la derecha
    const sx = 300, sy = 112, L = 66, fs = hl.indexOf('seccion') >= 0;
    s += `<rect x="${sx}" y="${sy}" width="${L}" height="${L}" fill="${C2}" stroke="${C2b}" stroke-width="2"/>`;
    s += `<text class="st2" x="${sx + L / 2}" y="${sy - 8}" text-anchor="middle">sección</text><text class="st2" x="${sx + L / 2}" y="${sy + L + 18}" text-anchor="middle">b − a</text>`;
    if (fs) {
      s += `<rect x="${sx + 18}" y="${sy}" width="9" height="${L}" fill="${AZ}" opacity=".55"/><text class="st" x="${sx + 22}" y="${sy + L + 38}" text-anchor="middle" style="fill:${AZ}">dr</text>`;
      s += `<text class="st2" x="${sx - 2}" y="${sy + L / 2 + 5}" text-anchor="end">a</text><text class="st2" x="${sx + L + 4}" y="${sy + L / 2 + 5}">b</text>`;
    }
    if (o.nota) s += `<text class="st" x="${cx}" y="${cy + 6}" text-anchor="middle" style="fill:${AZ}">${o.nota}</text>`;
    return s;
  }

  // Imán en anillo con entrehierro a la derecha. Muestra M (negro), B (azul) y H (rojo).
  const VBI = '-14 -14 404 318';
  function anillo(P, o) {
    o = o || {}; const hl = o.hl || [], q = iman(P);
    const cx = 145, cy = 145, Ri = 82, Ro = 124, Rm = (Ri + Ro) / 2;
    const cerrado = q.h <= 0;
    const tg = cerrado ? 0 : Math.max(0.07, q.h / q.r) / 2; // medio ángulo del entrehierro (se exagera si es muy fino)
    let s = `<path d="${cerrado ? sector(cx, cy, Ri, Ro, 0, 2 * Math.PI) : sector(cx, cy, Ri, Ro, tg, 2 * Math.PI - tg)}" fill="#d9a066" stroke="#8a5a2b" stroke-width="2.2" fill-rule="evenodd"/>`;
    // B: círculo continuo (azul), también en el aire
    const vB = hl.indexOf('B') >= 0 || !hl.length;
    s += `<circle cx="${cx}" cy="${cy}" r="${Rm}" class="flux" style="opacity:${vB ? 1 : 0.35}"/>`;
    // M: flechas negras a lo largo del anillo (sentido horario)
    const vM = hl.indexOf('M') >= 0 || !hl.length;
    for (let k = 1; k < 8; k++) {
      const t = k * Math.PI / 4, [x1, y1] = pt(cx, cy, Rm + 10, t - 0.17), [x2, y2] = pt(cx, cy, Rm + 10, t + 0.17);
      if (t - 0.2 < tg || t + 0.2 > 2 * Math.PI - tg) continue;
      s += `<g opacity="${vM ? 1 : 0.35}">${arrow(x1, y1, x2, y2, '#1f2633', 3)}</g>`;
    }
    { const [x, y] = pt(cx, cy, Ro + 14, Math.PI * 1.25); s += `<text class="st" x="${x}" y="${y}" text-anchor="middle" opacity="${vM ? 1 : 0.35}">M</text>`; }
    // H: en el aire, a favor (grande); dentro del imán, en contra (corto)
    const vH = hl.indexOf('H') >= 0 || !hl.length;
    if (q.h > 0) {
      const [xa, ya] = pt(cx, cy, Rm - 8, -tg - 0.02), [xb, yb] = pt(cx, cy, Rm - 8, tg + 0.06);
      s += `<g opacity="${vH ? 1 : 0.3}">${arrow(xa - 2, ya - 6, xb - 2, yb + 4, RO, 4)}<text class="st" x="${cx + Rm - 30}" y="${cy + 6}" text-anchor="end" style="fill:${RO}">H₀</text></g>`;
      const lr = Math.max(0.22, Math.min(0.5, Math.abs(q.H) / q.H0 * 8));
      [0.25, 0.5, 0.75].map((fr) => tg + (2 * Math.PI - 2 * tg) * fr).forEach((t) => {
        const [x1, y1] = pt(cx, cy, Rm - 12, t + lr / 2), [x2, y2] = pt(cx, cy, Rm - 12, t - lr / 2);
        s += `<g opacity="${vH ? 1 : 0.3}">${arrow(x1, y1, x2, y2, RO, 3, 7)}</g>`;
      });
      const [xh, yh] = pt(cx, cy, Rm - 32, Math.PI); s += `<text class="st" x="${xh}" y="${yh + 6}" text-anchor="start" style="fill:${RO};opacity:${vH ? 1 : 0.3}">H</text>`;
    }
    if (cerrado) s += `<text class="st" x="${cx}" y="${cy + 48}" text-anchor="middle" style="fill:${RO}">cerrado: H = 0</text>`;
    // entrehierro h
    if (!cerrado) { const [x1, y1] = pt(cx, cy, Ro + 6, -tg), [x2, y2] = pt(cx, cy, Ro + 6, tg); const fh = hl.indexOf('cara') >= 0;
      s += `<line x1="${x1}" y1="${y1}" x2="${x1 + 16}" y2="${y1}" stroke="#1f2633" stroke-width="1.4"/><line x1="${x2}" y1="${y2}" x2="${x2 + 16}" y2="${y2}" stroke="#1f2633" stroke-width="1.4"/>`;
      s += `<text class="st" x="${x2 + 22}" y="${(y1 + y2) / 2 + 6}">h</text>`;
      if (fh) [-tg, tg].forEach((t) => { const [xa, ya] = pt(cx, cy, Ri, t), [xb, yb] = pt(cx, cy, Ro, t); s += `<line x1="${xa}" y1="${ya}" x2="${xb}" y2="${yb}" stroke="${RO}" stroke-width="5"/>`; }); }
    if (hl.indexOf('camino') >= 0) {
      s += `<circle cx="${cx}" cy="${cy}" r="${Rm}" fill="none" stroke="${RO}" stroke-width="3" stroke-dasharray="8 5"/>`;
      s += `<text class="st" x="${cx}" y="${cy + 6}" text-anchor="middle" style="fill:${RO}">C (radio r)</text>`;
    } else s += `<line x1="${cx}" y1="${cy}" x2="${pt(cx, cy, Rm, Math.PI * 0.75)[0]}" y2="${pt(cx, cy, Rm, Math.PI * 0.75)[1]}" stroke="#1f2633" stroke-width="1.4" stroke-dasharray="4 3"/><text class="st2" x="${cx - 30}" y="${cy + 20}">r</text>`;
    // leyenda
    s += `<g transform="translate(296,40)"><line x1="0" y1="0" x2="26" y2="0" class="flux"/><text class="st2" x="32" y="5">B</text>`;
    s += arrow(0, 30, 26, 30, RO, 3) + `<text class="st2" x="32" y="35">H</text>` + arrow(0, 60, 26, 60, '#1f2633', 3) + `<text class="st2" x="32" y="65">M</text></g>`;
    if (o.nota) s += `<text class="st" x="${cx}" y="${cy + 6}" text-anchor="middle" style="fill:${AZ}">${o.nota}</text>`;
    return s;
  }

  // Gráfica B(r) del toroide
  function grafBr(P, o) {
    o = o || {}; const q = tor(P);
    const W = 360, H = 240, m = { l: 56, r: 16, t: 16, b: 46 }, pw = W - m.l - m.r, ph = H - m.t - m.b;
    const x0 = q.a * 100, x1 = q.b * 100, y1 = Math.max(0.2, Math.ceil(q.Ba * 1.3 * 10) / 10);
    const X2 = (x) => m.l + (x - x0) / (x1 - x0) * pw, Y = (y) => m.t + ph - y / y1 * ph;
    let s = '';
    for (let i = 0; i <= 4; i++) { const y = y1 * i / 4; s += `<line class="ax" x1="${m.l}" x2="${W - m.r}" y1="${Y(y)}" y2="${Y(y)}"/><text class="tk" x="${m.l - 6}" y="${Y(y) + 5}" text-anchor="end">${f(y, y1 < 1 ? 2 : 1)}</text>`; }
    let d = '', area = `M${X2(x0)},${Y(0)}`;
    for (let i = 0; i <= 60; i++) { const x = x0 + (x1 - x0) * i / 60, y = q.K / (x / 100); d += (i ? ' L' : 'M') + X2(x).toFixed(1) + ',' + Y(y).toFixed(1); area += ' L' + X2(x).toFixed(1) + ',' + Y(y).toFixed(1); }
    area += ` L${X2(x1)},${Y(0)} Z`;
    if (o.area) s += `<path d="${area}" fill="${AZ}" opacity=".15"/>`;
    s += `<path class="ln" d="${d}"/>`;
    [[x0, q.Ba, 'a'], [q.rm * 100, q.Bm, 'r medio'], [x1, q.Bb, 'b']].forEach(([x, y, l]) => {
      s += `<circle cx="${X2(x)}" cy="${Y(y)}" r="6" fill="${AZ}" stroke="#fff" stroke-width="2"/><text class="tk" x="${X2(x)}" y="${Y(y) - 12}" text-anchor="middle" style="fill:#1f2633;font-weight:700">${f(y, 2)} T</text>`;
      s += `<text class="tk" x="${X2(x)}" y="${H - m.b + 20}" text-anchor="middle">${l === 'r medio' ? f(x, 0) : l + ' = ' + f(x, 0)}</text>`;
    });
    s += `<text class="tk" x="${m.l + pw / 2}" y="${H - 4}" text-anchor="middle">radio r (cm)</text><text class="tk" x="14" y="${m.t + ph / 2}" transform="rotate(-90 14 ${m.t + ph / 2})" text-anchor="middle">B (T)</text>`;
    if (q.Ba > 1.6) s += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(1.6)}" y2="${Y(1.6)}" stroke="${RO}" stroke-dasharray="5 4"/><text class="tk" x="${W - m.r}" y="${Y(1.6) - 5}" text-anchor="end" style="fill:${RO}">1,6 T</text>`;
    return `<svg viewBox="0 0 ${W} ${H}">${s}</svg>`;
  }

  // ---------------- leyes ----------------
  const LT = [
    { c: 'Ampère', n: 'Ley de Ampère', f: X`\(\oint \vec H\cdot d\vec l = N\,I\)`, hl: ['camino', 'bobina'],
      d: X`En el camino circular de radio r: \(H_1\,\alpha r + H_2\,(2\pi-\alpha)\,r = NI\).`, w: 'Un tramo de largo αr en el material 1 y el resto en el material 2.' },
    { c: 'Continuidad', n: 'Continuidad de B', f: X`\(\nabla\cdot\vec B = 0\)`, hl: ['cara'],
      d: 'En la cara que separa los dos materiales, el campo la cruza de frente: es perpendicular a la cara.', w: '¿Qué magnitud pasa igual de un lado al otro?' },
    { c: 'Material', n: 'El material', f: X`\(H = \dfrac{B}{\mu_0\,\mu_r}\)`, hl: ['sector'],
      d: 'En cada material, H depende de su μr. Material 1 (sector α): μr₁ = 100. Material 2: μr₂ = 2000.', w: 'Con el mismo B, ¿dónde hace falta más H?' },
    { c: 'B(r)', n: 'B depende del radio', f: X`\(B(r) = \dfrac{\mu_0 NI}{r\left[\alpha/\mu_{r1} + (2\pi-\alpha)/\mu_{r2}\right]}\)`, hl: ['flujo'],
      d: 'Cuanto mayor es r, más largo es el camino para la misma NI. Las líneas de flujo se juntan cerca del borde interior.', w: '¿Cómo cambia B entre el borde interior y el exterior?' },
    { c: 'Flujo', n: 'Flujo y reluctancia', f: X`\(\Phi = \int B\,dS = (b-a)\int_a^b B(r)\,dr\)`, hl: ['seccion'],
      d: 'El flujo se suma por franjas de ancho dr dentro de la sección cuadrada de lado b − a.', w: X`La reluctancia total es \(\mathcal R = NI/\Phi\).` }
  ];
  const LI = [
    { c: 'Ampère', n: 'Ampère sin corriente', f: X`\(\oint \vec H\cdot d\vec l = I_{\text{libre}}\)`, hl: ['camino'],
      d: 'La circulación de H solo depende de la corriente que atraviesa el camino. Aquí no hay bobina: el campo lo crea la magnetización M del imán.', w: '¿Cuánto vale entonces la circulación de H?' },
    { c: 'B, H y M', n: 'B, H y M', f: X`\(\vec B = \mu_0(\vec H + \vec M)\)`, hl: ['M', 'H'],
      d: X`Dentro del imán, B depende de H y de la magnetización M. En el aire no hay M: \(B = \mu_0 H_0\).`, w: 'M es fija: la da el material (imán ideal).' },
    { c: 'Continuidad', n: 'Continuidad de B', f: X`\(\nabla\cdot\vec B = 0\)`, hl: ['cara', 'B'],
      d: 'En las caras del entrehierro, el campo pasa del imán al aire de frente.', w: '¿Qué magnitud se conserva al pasar del imán al aire?' }
  ];

  // ---------------- encuestas (la correcta primero) ----------------
  const q = T0, m = I0;
  const ENC = {
    'T-E1': { pred: true, q: 'El sector de 30° es apenas el 8 % del camino, pero su material es 20 veces peor (μr = 100 frente a 2000). ¿Qué parte de la NI se lleva ese sector?', o: ['≈ 65 %', '≈ 8 %', '≈ 50 %', '≈ 95 %'], por: 'Lo vemos al final de la solución.' },
    'T-C1': { q: 'En la cara que separa los dos materiales, ¿qué es igual a ambos lados?', o: ['B', 'H', 'μ', 'La energía'],
      por: 'B cruza la cara de frente y sus líneas no se cortan (∇·B = 0): la componente normal de B es la misma a ambos lados. H cambia porque cambia μ.' },
    'T-C2': { q: 'Con el mismo B, ¿en qué material es mayor H?', o: ['En el de μr = 100: unas 20 veces mayor', 'En el de μr = 2000', 'Es igual en los dos', 'Depende de la corriente'],
      por: X`\(H = B/(\mu_0\mu_r)\): con μr 20 veces menor, H es 20 veces mayor. Por eso el sector «malo» pide mucha NI.` },
    'T-C3': { q: 'Dentro del toroide, B cambia con el radio como…', o: [X`\(1/r\)`, 'Es constante', X`\(r\)`, X`\(1/r^2\)`],
      por: X`De Ampère: \(B\,r\,[\alpha/\mu_{r1} + (2\pi-\alpha)/\mu_{r2}] = \mu_0 NI\), entonces \(B \propto 1/r\).` },
    'T-C4': { q: '¿Por qué el flujo exacto necesita una integral?', o: ['Porque B cambia de un radio a otro dentro de la sección', 'Porque hay dos materiales', 'Porque la sección es cuadrada', 'Porque μ cambia con el radio'],
      por: X`\(\Phi = B\cdot S\) solo vale si B es igual en toda la sección. Aquí \(B \propto 1/r\): hay que sumar franjas, \(\Phi = (b-a)\int_a^b B\,dr\).` },
    'T-S1': { q: 'Calcula la longitud del sector de 30° en el radio medio (r = 10 cm).', o: ['≈ 5,2 cm', '≈ 30 cm', '≈ 3,0 cm', '≈ 52 cm'],
      por: X`\(l_1 = \alpha\,r = \tfrac{\pi}{6}\cdot 10 = 5{,}24\ \text{cm}\). El ángulo va en radianes.` },
    'T-S2': { q: 'Calcula B en el radio medio (N = 200; I = 2 A).', o: ['≈ 0,62 T', '≈ 1,6 T', '≈ 0,08 T', '≈ 0,8 mT'],
      por: X`\(B = \dfrac{\mu_0\cdot 400}{0{,}10\cdot(0{,}005236 + 0{,}002880)} = ${tsig(q.Bm, 3)}\ \text{T}\). 1,6 T sería todo de material 2; 0,08 T, todo de material 1; 0,8 mT, como si fuera aire.` },
    'T-S3': { q: 'B en el borde interior (a = 8 cm) y en el exterior (b = 12 cm):', o: ['0,77 T y 0,52 T', '0,62 T en ambos', '0,52 T y 0,77 T', '0,97 T y 0,43 T'],
      por: X`\(B \propto 1/r\): \(B(a) = 0{,}0619/0{,}08 = ${tsig(q.Ba, 3)}\ \text{T}\) y \(B(b) = 0{,}0619/0{,}12 = ${tsig(q.Bb, 3)}\ \text{T}\). 0,97 y 0,43 salen con \(1/r^2\).` },
    'T-S4': { q: 'Flujo aproximado con el radio medio (Φ ≈ B·S):', o: ['≈ 0,99 mWb', '≈ 0,25 mWb', '≈ 2,5 mWb', '≈ 0,62 mWb'],
      por: X`\(S = (b-a)^2 = 0{,}04^2 = 0{,}0016\ \text{m}^2\); \(\Phi \approx ${tsig(q.Bm, 3)}\cdot 0{,}0016 = ${tsci(q.Phia, 3)}\ \text{Wb}\). 0,25 mWb sale con S = 4 cm².` },
    'T-S5': { q: 'Con la integral sale Φ = 1,005 mWb. ¿Cuánto se equivocó el radio medio?', o: ['≈ 1,3 %', '≈ 13 %', '≈ 0,1 %', '≈ 40 %'],
      por: X`\(\Phi = (b-a)\,K\ln(b/a) = 0{,}04\cdot 0{,}0619\cdot\ln 1{,}5 = ${tsci(q.Phi, 4)}\ \text{Wb}\). El radio medio da ${f(q.err, 1)} % menos: poco, porque b/a = 1,5.` },
    'T-S6': { q: 'Reluctancia total ℛ = NI/Φ:', o: [X`\(\approx 4{,}0\cdot 10^{5}\ \text{A}\cdot\text{v/Wb}\)`, X`\(\approx 2{,}5\cdot 10^{-6}\ \text{A}\cdot\text{v/Wb}\)`, X`\(\approx 4{,}0\cdot 10^{-5}\ \text{A}\cdot\text{v/Wb}\)`, X`\(\approx 8{,}0\cdot 10^{5}\ \text{A}\cdot\text{v/Wb}\)`],
      por: X`\(\mathcal R = 400/${tsci(q.Phi, 4)} = ${tsci(q.R, 3)}\ \text{A}\cdot\text{v/Wb}\). 2,5·10⁻⁶ es Φ/NI, al revés.` },
    'T-S7': { q: '¿Qué parte de la NI se lleva el sector de 30°?', o: ['≈ 65 %', '≈ 8 %', '≈ 35 %', '≈ 50 %'],
      por: X`\(H_1 l_1 = ${tf(q.H1, 0)}\cdot 0{,}0524 = ${tf(q.H1 * q.l1, 0)}\ \text{A}\cdot\text{v}\) de 400: el ${f(q.sh1, 0)} %. El resto (${f(q.H2 * q.l2, 0)} A·v) va al material 2.` },
    'T-W1': { q: 'Si el sector se rellena con material 2 (sin material 1), el flujo…', o: ['Sube ≈ 2,6 veces', 'No cambia', 'Sube 20 veces', 'Sube 1,1 veces'],
      por: X`El denominador baja de \(0{,}00812\) a \(2\pi/2000 = 0{,}00314\): el flujo sube 2,58 veces (modelo lineal; con 2 A el borde interior pasaría de 1,6 T). Un tramo corto y «malo» manda.` },
    'T-W2': { q: 'Si se duplica μr₂ (de 2000 a 4000), el flujo…', o: ['Sube solo ≈ 22 %', 'Se duplica', 'No cambia', 'Baja'],
      por: 'El material 2 solo aportaba el 35 % de la reluctancia: mejorarlo ayuda poco (×1,22).' },
    'T-W3': { q: 'Si se duplica μr₁ (de 100 a 200), el flujo…', o: ['Sube ≈ 48 %', 'Se duplica', 'Sube ≈ 5 %', 'No cambia'],
      por: 'El sector aportaba el 65 % de la reluctancia: mejorarlo rinde más (×1,48). Conviene mejorar el tramo malo.' },
    'T-W4': { q: 'Con un toroide delgado (a = 9,8 cm; b = 10,2 cm), el error del radio medio…', o: ['Es casi 0', 'Sigue en 1,3 %', 'Crece', 'Llega al 50 %'],
      por: 'Si b/a ≈ 1, B casi no cambia en la sección y Φ ≈ B·S es muy buena (error de 0,01 %).' },
    'T-W5': { q: '¿Con qué corriente el borde interior llega a 1,6 T (empieza la saturación)?', o: ['≈ 4,1 A', '≈ 5,2 A', '≈ 6,2 A', '≈ 2 A'],
      por: X`B es proporcional a I y el máximo está en \(r = a\): \(I = 2\cdot 1{,}6/0{,}774 \approx 4{,}1\ \text{A}\). Con el radio medio saldría 5,2 A: el borde interior se satura antes.` },
    'T-G1': { q: '¿Qué forma tiene la curva B(r) dentro del núcleo?', o: ['Una hipérbola (1/r)', 'Una recta', 'Una parábola', 'Una recta horizontal'],
      por: X`\(B = K/r\): una hipérbola. El área bajo la curva, por \((b-a)\), es el flujo.` },
    'I-E1': { pred: true, q: 'Si el entrehierro del imán se agranda, B en el aire…', o: ['Baja', 'Sube', 'No cambia', 'Se hace cero'], por: 'Lo vemos al final de la solución.' },
    'I-C1': { q: 'Sin bobina, ¿cuánto vale ∮H·dl alrededor del anillo?', o: ['0', X`\(M\cdot 2\pi r\)`, X`\(\mu_0 M\)`, X`\(H_0\cdot h\)`],
      por: 'La circulación de H es igual a la corriente libre encerrada. Sin bobina, es cero.' },
    'I-C2': { q: 'En el aire, H va en el mismo sentido que B. Dentro del imán, H…', o: ['Va al revés', 'Va en el mismo sentido', 'Es cero', 'Es perpendicular al anillo'],
      por: X`Para que \(H(2\pi r - h) + H_0 h = 0\) con \(H_0 > 0\), H dentro del imán tiene que ser negativo: va contra M (campo desmagnetizante).` },
    'I-C3': { q: 'Dentro del imán, la relación correcta es…', o: [X`\(B = \mu_0(H + M)\)`, X`\(B = \mu_0 H\)`, X`\(B = \mu_0\mu_r H\)`, X`\(B = M\)`],
      por: X`En un material magnetizado, \(B = \mu_0(H + M)\). En el aire no hay M y queda \(B = \mu_0 H_0\).` },
    'I-C4': { q: 'En las caras del entrehierro, ¿qué se conserva?', o: ['B', 'H', 'M', 'Nada'],
      por: X`B cruza la cara de frente: \(\mu_0(H + M) = \mu_0 H_0\). H y M cambian de golpe.` },
    'I-S1': { q: 'Calcula h/(2πr) con h = 5 mm y r = 5 cm.', o: ['≈ 0,016', '≈ 0,1', '≈ 0,0016', '≈ 0,032'],
      por: X`\(h/(2\pi r) = 0{,}005/(2\pi\cdot 0{,}05) = ${tf(m.k, 4)}\): el aire es el 1,6 % del camino.` },
    'I-S2': { q: 'H₀ en el aire (M = 3,0·10⁵ A/m):', o: [X`\(\approx 2{,}95\cdot 10^5\ \text{A/m}\)`, X`\(\approx 3{,}05\cdot 10^5\ \text{A/m}\)`, X`\(\approx 4{,}8\cdot 10^3\ \text{A/m}\)`, '0'],
      por: X`\(H_0 = \left(1 - \tfrac{h}{2\pi r}\right)M = 0{,}984\cdot 3\cdot 10^5 = ${tsci(m.H0, 3)}\ \text{A/m}\).` },
    'I-S3': { q: 'H dentro del imán:', o: [X`\(\approx -4\,800\ \text{A/m}\)`, X`\(\approx +4\,800\ \text{A/m}\)`, X`\(\approx -2{,}95\cdot 10^5\ \text{A/m}\)`, '0'],
      por: X`\(H = -\tfrac{h}{2\pi r}M = -0{,}0159\cdot 3\cdot 10^5 = ${tf(m.H, 0)}\ \text{A/m}\). Negativo: va contra M.` },
    'I-S4': { q: 'B en el entrehierro:', o: ['≈ 0,371 T', '≈ 0,377 T', '≈ 0,006 T', '≈ 0,742 T'],
      por: X`\(B = \mu_0 H_0 = 4\pi\cdot 10^{-7}\cdot ${tsci(m.H0, 3)} = ${tsig(m.B, 3)}\ \text{T}\). 0,377 T sería \(\mu_0 M\), sin entrehierro.` },
    'I-S5': { q: 'Comprobación: ¿cuánto da H·(2πr − h) + H₀·h?', o: ['0', 'M·h', '2πr·M', 'H₀·2πr'],
      por: X`\(${tf(m.H, 0)}\cdot 0{,}309 + ${tf(m.H0, 0)}\cdot 0{,}005 \approx -1476 + 1476 = 0\). Se cumple Ampère sin corriente.` },
    'I-W1': { q: 'Si h se duplica (10 mm), H dentro del imán…', o: ['Se duplica (≈ −9 500 A/m)', 'Baja a la mitad', 'No cambia', 'Se cuadruplica'],
      por: X`\(H = -\tfrac{h}{2\pi r}M\): es proporcional a h.` },
    'I-W2': { q: 'Si h → 0 (anillo cerrado):', o: [X`\(H = 0\) y \(B = \mu_0 M\)`, X`\(H = M\)`, X`\(B = 0\)`, 'H se hace muy grande'],
      por: 'Sin entrehierro no hay campo desmagnetizante: H = 0 y B = μ₀M ≈ 0,377 T.' },
    'I-W3': { q: 'Si el radio del anillo se duplica (10 cm), la desmagnetización…', o: ['Baja a la mitad', 'Se duplica', 'No cambia', 'Desaparece'],
      por: 'El mismo entrehierro es una parte más pequeña del camino: h/(2πr) baja a la mitad.' },
    'I-W4': { q: 'Con un imán de neodimio (M ≈ 9,5·10⁵ A/m), B en el aire es…', o: ['≈ 1,17 T', '≈ 0,37 T', '≈ 3,7 T', '≈ 0,12 T'],
      por: X`\(B = \mu_0 M(1 - 0{,}0159) = 4\pi\cdot 10^{-7}\cdot 9{,}5\cdot 10^5\cdot 0{,}984 \approx 1{,}17\ \text{T}\).` },
    'I-W5': { q: 'Si el entrehierro es medio anillo (h = πr), B en el aire es…', o: [X`\(\mu_0 M/2\)`, X`\(\mu_0 M\)`, '0', X`\(2\mu_0 M\)`],
      por: X`\(h/(2\pi r) = 1/2\): \(H_0 = M/2\) y \(B = \mu_0 M/2 \approx 0{,}19\ \text{T}\).` },
    'I-Z1': { q: '¿Por qué un imán de herradura se guarda con una barra de hierro entre sus polos?', o: ['Para cerrar el entrehierro y que H no lo desmagnetice', 'Para que no atraiga polvo', 'Para aumentar M', 'Para descargarlo'],
      por: 'Con el «guardián» el entrehierro casi desaparece: H dentro del imán se acerca a cero y el imán no pierde magnetización con el tiempo.' }
  };

  // ---------------- soluciones paso a paso ----------------
  const SOLT = [
    { t: 'Longitudes en el radio medio', e: [X`l_1 = \alpha\,r = \tfrac{\pi}{6}\cdot 0{,}10 = 0{,}0524\ \text{m}`, X`l_2 = (2\pi-\alpha)\,r = 0{,}576\ \text{m}`], w: 'El sector es solo el 8 % del camino.', fig: { hl: ['camino', 'sector'] } },
    { t: 'B en el radio medio', e: [X`B = \dfrac{\mu_0 NI}{r\,[\alpha/\mu_{r1} + (2\pi-\alpha)/\mu_{r2}]}`, X`B = \dfrac{4\pi\cdot 10^{-7}\cdot 400}{0{,}10\cdot(0{,}005236 + 0{,}002880)}`, X`B = ${tsig(q.Bm, 3)}\ \text{T}`], w: 'El denominador suma la «dificultad» de cada material.', fig: { hl: ['flujo'], nota: f(q.Bm, 2) + ' T' } },
    { t: 'B en los bordes', e: [X`B(a) = \dfrac{0{,}0619}{0{,}08} = ${tsig(q.Ba, 3)}\ \text{T}`, X`B(b) = \dfrac{0{,}0619}{0{,}12} = ${tsig(q.Bb, 3)}\ \text{T}`], w: 'B ∝ 1/r: el borde interior trabaja más.', graf: true },
    { t: 'Flujo aproximado', e: [X`S = (b-a)^2 = 0{,}0016\ \text{m}^2`, X`\Phi \approx B(r_m)\,S = ${tsig(q.Bm, 3)}\cdot 0{,}0016 = ${tsci(q.Phia, 3)}\ \text{Wb}`], w: 'Supone que B es igual en toda la sección.', fig: { hl: ['seccion'] } },
    { t: 'Flujo exacto', e: [X`\Phi = (b-a)\int_a^b \dfrac{K}{r}\,dr = (b-a)\,K\,\ln\dfrac{b}{a}`, X`\Phi = 0{,}04\cdot 0{,}0619\cdot\ln 1{,}5 = ${tsci(q.Phi, 4)}\ \text{Wb}`], w: `El radio medio se equivocó en ${f(q.err, 1)} %.`, graf: true, area: true },
    { t: 'Reluctancia', e: [X`\mathcal R = \dfrac{NI}{\Phi} = \dfrac{400}{${tsci(q.Phi, 4)}}`, X`\mathcal R = ${tsci(q.R, 3)}\ \text{A}\cdot\text{v/Wb}`, X`\mathcal R = \dfrac{\alpha/\mu_1 + (2\pi-\alpha)/\mu_2}{(b-a)\ln(b/a)}`], w: 'Con μ = μ₀μr de cada material.', fig: { hl: ['camino'] } },
    { t: 'Reparto de la NI', e: [X`H_1 l_1 = ${tf(q.H1, 0)}\cdot 0{,}0524 = ${tf(q.H1 * q.l1, 0)}\ \text{A}\cdot\text{v}`, X`H_2 l_2 = ${tf(q.H2, 0)}\cdot 0{,}576 = ${tf(q.H2 * q.l2, 0)}\ \text{A}\cdot\text{v}`], w: `El sector se lleva el ${f(q.sh1, 0)} % de la NI.`, fig: { hl: ['sector'] }, reparto: true }
  ];
  const SOLI = [
    { t: 'Qué parte del camino es aire', e: [X`\dfrac{h}{2\pi r} = \dfrac{0{,}005}{2\pi\cdot 0{,}05} = ${tf(m.k, 4)}`], w: 'El entrehierro es el 1,6 % del camino.', hl: ['cara'] },
    { t: 'H₀ en el aire', e: [X`H(2\pi r - h) + H_0\,h = 0 \quad\text{y}\quad H + M = H_0`, X`H_0 = \left(1 - \dfrac{h}{2\pi r}\right)M = ${tsci(m.H0, 3)}\ \text{A/m}`], w: 'Ampère sin corriente y continuidad de B en las caras.', hl: ['H', 'B'] },
    { t: 'H dentro del imán', e: [X`H = -\dfrac{h}{2\pi r}\,M = ${tf(m.H, 0)}\ \text{A/m}`], w: 'Negativo: va contra M. Es el campo desmagnetizante.', hl: ['H', 'M'] },
    { t: 'B en el aire y en el imán', e: [X`B = \mu_0 H_0 = ${tsig(m.B, 3)}\ \text{T}`, X`B = \mu_0(H + M) = \mu_0(${tf(m.H, 0)} + 300\,000)`, X`B = ${tsig(m.B, 3)}\ \text{T}`], w: 'El mismo B en los dos: 1,6 % menos que μ₀M = 0,377 T.', hl: ['B'] },
    { t: 'Comprobación', e: [X`H(2\pi r - h) = ${tf(m.H, 0)}\cdot 0{,}309 = -1476`, X`H_0\,h = ${tf(m.H0, 0)}\cdot 0{,}005 = +1476`, X`\text{Suma} \approx 0`], w: 'Se cumple Ampère: la circulación de H es cero.', hl: ['camino'] }
  ];

  // ---------------- pantallas ----------------
  MG.ETAPAS = ['Toroide', 'Toroide: cálculo', 'Toroide: ¿y si…?', 'Imán', 'Imán: cálculo', 'Imán: ¿y si…?'];
  const enc = (id, et) => Object.assign({ id, et, tipo: 'enc', c: 0, t: 'Encuesta ' + id }, ENC[id]);
  const chkT = (id, t, P, nota) => ({ id, et: 2, tipo: 'panelT', t: 'Compruébalo: ' + t, P, nota });
  const chkI = (id, t, P, nota) => ({ id, et: 5, tipo: 'panelI', t: 'Compruébalo: ' + t, P, nota });
  MG.PASOS = [
    { id: 't-enun', et: 0, tipo: 'enunT', t: 'Toroide con dos materiales' },
    enc('T-E1', 0),
    { id: 't-ley1', et: 0, tipo: 'leyT', k: 0, t: 'Toroide: ley de Ampère' },
    { id: 't-ley2', et: 0, tipo: 'leyT', k: 1, t: 'Toroide: continuidad de B' },
    enc('T-C1', 0),
    { id: 't-ley3', et: 0, tipo: 'leyT', k: 2, t: 'Toroide: el material' },
    enc('T-C2', 0),
    { id: 't-ley4', et: 0, tipo: 'leyT', k: 3, t: 'Toroide: B depende del radio' },
    enc('T-C3', 0),
    { id: 't-ley5', et: 0, tipo: 'leyT', k: 4, t: 'Toroide: flujo y reluctancia' },
    enc('T-C4', 0),
    enc('T-S1', 1), { id: 't-sol1', et: 1, tipo: 'solT', k: 0 },
    enc('T-S2', 1), { id: 't-sol2', et: 1, tipo: 'solT', k: 1 },
    enc('T-S3', 1), { id: 't-sol3', et: 1, tipo: 'solT', k: 2 },
    enc('T-S4', 1), { id: 't-sol4', et: 1, tipo: 'solT', k: 3 },
    enc('T-S5', 1), { id: 't-sol5', et: 1, tipo: 'solT', k: 4 },
    enc('T-S6', 1), { id: 't-sol6', et: 1, tipo: 'solT', k: 5 },
    enc('T-S7', 1), { id: 't-sol7', et: 1, tipo: 'solT', k: 6 },
    { id: 't-pred', et: 1, tipo: 'pred', ref: 'T-E1', t: 'Toroide: ¿cuánto predijeron?', res: `El sector se lleva el ${f(q.sh1, 0)} % de la NI.` },
    { id: 't-panel', et: 2, tipo: 'panelT', t: 'Toroide: ¿qué pasa si cambiamos un valor?', P: {}, nota: 'Mueve un control y mira B, el flujo y el reparto de la NI.' },
    enc('T-W1', 2), chkT('t-cW1', 'sin el sector', { al: 0 }, 'Sin el tramo malo, el flujo sube 2,6 veces y el borde interior llega a 2 T: se saturaría.'),
    enc('T-W2', 2), chkT('t-cW2', 'μr₂ = 4000', { m2: 4000 }, 'Mejorar el material bueno rinde poco.'),
    enc('T-W3', 2), chkT('t-cW3', 'μr₁ = 200', { m1: 200 }, 'Mejorar el tramo malo rinde más.'),
    enc('T-W4', 2), chkT('t-cW4', 'toroide delgado', { a: 9.8, b: 10.2 }, 'Con b/a ≈ 1, el radio medio es casi exacto.'),
    enc('T-W5', 2), chkT('t-cW5', 'I = 4,13 A', { I: 4.13 }, 'El borde interior llega a 1,6 T.'),
    enc('T-G1', 2), { id: 't-graf', et: 2, tipo: 'grafT', t: 'Toroide: B según el radio' },
    { id: 'i-enun', et: 3, tipo: 'enunI', t: 'Imán en anillo con entrehierro' },
    enc('I-E1', 3),
    { id: 'i-ley1', et: 3, tipo: 'leyI', k: 0, t: 'Imán: Ampère sin corriente' },
    enc('I-C1', 3), enc('I-C2', 3),
    { id: 'i-ley2', et: 3, tipo: 'leyI', k: 1, t: 'Imán: B, H y M' },
    enc('I-C3', 3),
    { id: 'i-ley3', et: 3, tipo: 'leyI', k: 2, t: 'Imán: continuidad de B' },
    enc('I-C4', 3),
    enc('I-S1', 4), { id: 'i-sol1', et: 4, tipo: 'solI', k: 0 },
    enc('I-S2', 4), { id: 'i-sol2', et: 4, tipo: 'solI', k: 1 },
    enc('I-S3', 4), { id: 'i-sol3', et: 4, tipo: 'solI', k: 2 },
    enc('I-S4', 4), { id: 'i-sol4', et: 4, tipo: 'solI', k: 3 },
    enc('I-S5', 4), { id: 'i-sol5', et: 4, tipo: 'solI', k: 4 },
    { id: 'i-pred', et: 4, tipo: 'pred', ref: 'I-E1', t: 'Imán: ¿cuánto predijeron?', res: 'B baja: B = μ₀M·(1 − h/2πr).' },
    { id: 'i-panel', et: 5, tipo: 'panelI', t: 'Imán: ¿qué pasa si cambiamos un valor?', P: {}, nota: 'Mueve un control y mira H dentro del imán y B en el aire.' },
    enc('I-W1', 5), chkI('i-cW1', 'h = 10 mm', { h: 10 }, 'H dentro del imán se duplica.'),
    enc('I-W2', 5), chkI('i-cW2', 'anillo cerrado', { h: 0 }, 'Sin entrehierro: H = 0 y B = μ₀M.'),
    enc('I-W3', 5), chkI('i-cW3', 'r = 10 cm', { r: 10 }, 'La desmagnetización baja a la mitad.'),
    enc('I-W4', 5), chkI('i-cW4', 'neodimio', { M: 9.5 }, 'Mismo anillo, imán más fuerte.'),
    enc('I-W5', 5), chkI('i-cW5', 'medio anillo de aire', { h: 157 }, 'h = πr: B baja a la mitad.'),
    enc('I-Z1', 5), { id: 'cierre', et: 5, tipo: 'cierre', t: 'Cierre' }
  ];
  MG.PASOS.forEach((p, i) => {
    p.n = i;
    if (p.tipo === 'solT') p.t = 'Toroide, paso ' + (p.k + 1) + ' de 7: ' + SOLT[p.k].t;
    if (p.tipo === 'solI') p.t = 'Imán, paso ' + (p.k + 1) + ' de 5: ' + SOLI[p.k].t;
  });
  MG.ENC = ENC; MG.LT = LT; MG.LI = LI; MG.SOLT = SOLT; MG.SOLI = SOLI;

  // ---------------- vistas ----------------
  function vEnunT(cont) {
    const C = [['a', '8 cm'], ['b', '12 cm'], ['sección', '4 × 4 cm'], ['α', '30°'], ['μr₁ (sector)', '100'], ['μr₂', '2000'], ['N', '200'], ['I', '2 A']];
    cont.innerHTML = `<div class="vista"><div class="txt">
      <p>Un toroide de sección cuadrada (radios <i>a</i> y <i>b</i>) tiene un sector de ángulo α hecho de un material 1 y el resto de un material 2. Una bobina de N espiras lleva una corriente I. Hallar B, el flujo Φ y la reluctancia.</p>
      <div class="chips">${C.map((x) => `<div class="chip"><small>${x[0]}</small>${x[1]}</div>`).join('')}</div>
      <p class="lbl">Basado en el Ejemplo 4-2 de J. C. Fernández (Facultad de Ingeniería, UBA). Datos numéricos propios.</p>
    </div><div class="fig"><svg viewBox="${VBT}">${toroide(MG.TD)}</svg></div></div>`;
    return {};
  }
  function vEnunI(cont) {
    const C = [['M', '3,0·10⁵ A/m'], ['μ₀M', '0,377 T'], ['radio medio', '5 cm'], ['h', '5 mm']];
    cont.innerHTML = `<div class="vista"><div class="txt">
      <p>Un anillo de ferrita está magnetizado de forma uniforme a lo largo del anillo (M). Tiene un entrehierro de espesor <i>h</i> y <b>no tiene bobina</b>. Hallar H y B en el imán y en el aire.</p>
      <div class="chips">${C.map((x) => `<div class="chip"><small>${x[0]}</small>${x[1]}</div>`).join('')}</div>
      <p class="lbl">Basado en el Ejemplo 4-4 de J. C. Fernández (Facultad de Ingeniería, UBA). Datos numéricos propios.</p>
    </div><div class="fig"><svg viewBox="${VBI}">${anillo(MG.ID)}</svg></div></div>`;
    return {};
  }
  function vLey(cont, p, v, cambio, leyes, dib, P0, vb) {
    let k = v && v.ley !== undefined ? v.ley : p.k;
    cont.innerHTML = `<div class="vista leyv"><div class="txt"><div class="leyes">${leyes.map((L, i) => `<button class="ley" data-i="${i}"><span class="n">${i + 1}</span>${L.c}</button>`).join('')}</div><div class="ley-det card"></div></div><div class="fig"><svg viewBox="${vb}"></svg></div></div>`;
    const lista = cont.querySelector('.leyes');
    lista.onclick = (e) => { const b = e.target.closest('.ley'); if (!b) return; k = +b.dataset.i; pintar(); cambio && cambio({ ley: k }); };
    function pintar() {
      const L = leyes[k];
      lista.querySelectorAll('.ley').forEach((b, i) => b.classList.toggle('sel', i === k));
      cont.querySelector('.ley-det').innerHTML = `<p class="ley-n">${L.n}</p><div class="ley-f">${L.f.replace('\\(', '\\[').replace('\\)', '\\]')}</div><p>${L.d}</p><p class="lbl">${L.w}</p>`;
      cont.querySelector('svg').innerHTML = dib(P0, { hl: L.hl });
      EM.tex(cont);
    }
    pintar();
    return { act(v2) { if (v2 && v2.ley !== undefined && v2.ley !== k) { k = v2.ley; pintar(); } } };
  }
  function cardSol(S, n, tot, last) {
    return `<div class="stp${last ? ' last' : ''}"><span class="t">Paso ${n} de ${tot}: ${S.t}</span>${S.e.map((x) => `<div class="e">\\[${x}\\]</div>`).join('')}<span class="why">${S.w}</span></div>`;
  }
  function vSolT(cont, p) {
    const S = SOLT[p.k];
    let fig;
    if (S.graf) fig = grafBr(MG.TD, { area: S.area });
    else {
      fig = `<svg viewBox="${VBT}">${toroide(MG.TD, S.fig)}</svg>`;
      if (S.reparto) {
        const a = q.sh1, b2 = 100 - a;
        fig += `<div class="share" style="width:100%"><div style="flex:${a} 1 0;background:${C1}">sector ${f(a, 0)} %</div><div style="flex:${b2} 1 0;background:${C2}">material 2 ${f(b2, 0)} %</div></div>`;
      }
    }
    cont.innerHTML = `<div class="vista sol"><div class="fig ancha">${fig}</div><div class="txt">${cardSol(S, p.k + 1, 7, p.k === 6)}</div></div>`;
    EM.tex(cont);
    return {};
  }
  function vSolI(cont, p) {
    const S = SOLI[p.k];
    cont.innerHTML = `<div class="vista sol"><div class="fig ancha"><svg viewBox="${VBI}">${anillo(MG.ID, { hl: S.hl })}</svg></div><div class="txt">${cardSol(S, p.k + 1, 5, p.k === 4)}</div></div>`;
    EM.tex(cont);
    return {};
  }
  function vGrafT(cont) {
    cont.innerHTML = `<div class="vista graf"><div class="fig"><p class="lbl tc">B (T) según el radio, con los datos del problema</p>${grafBr(MG.TD, { area: true })}</div>
      <div class="txt"><p>\\(B = K/r\\): una hipérbola. El borde interior trabaja más y se satura primero.</p><p>Área sombreada × (b − a) = flujo.</p></div></div>`;
    EM.tex(cont);
    return {};
  }

  // Panel genérico con controles (toroide e imán)
  const CTT = [
    { k: 'al', l: 'Ángulo α', u: '°', min: 0, max: 180, st: 5, d: 0 },
    { k: 'm1', l: 'μr₁ (sector)', u: '', min: 10, max: 5000, st: 10, d: 0 },
    { k: 'm2', l: 'μr₂', u: '', min: 100, max: 5000, st: 50, d: 0 },
    { k: 'I', l: 'Corriente I', u: 'A', min: 0, max: 10, st: 0.01, d: 2 },
    { k: 'a', l: 'Radio a', u: 'cm', min: 4, max: 15, st: 0.1, d: 1 },
    { k: 'b', l: 'Radio b', u: 'cm', min: 5, max: 20, st: 0.1, d: 1 },
    { k: 'N', l: 'Espiras N', u: '', min: 50, max: 600, st: 10, d: 0 }
  ];
  const CTI = [
    { k: 'h', l: 'Entrehierro h', u: 'mm', min: 0, max: 160, st: 0.5, d: 1 },
    { k: 'r', l: 'Radio medio r', u: 'cm', min: 2, max: 15, st: 0.5, d: 1 },
    { k: 'M', l: 'M (×10⁵ A/m)', u: '', min: 0.5, max: 10, st: 0.1, d: 1 }
  ];
  function lecturasT(P) {
    const r = tor(P), sat = r.Ba > 1.605;
    return `<div class="badge ${sat ? 'no' : 'ok'}">${sat ? '⚠ El borde interior se satura' : 'Φ = ' + sig(r.Phi * 1000, 3) + ' mWb'}</div>
      <div class="c${sat ? ' alerta' : ''}"><small>B en el borde interior</small><b>${sig(r.Ba, 3)} T</b></div>
      <div class="c"><small>B en el borde exterior</small><b>${sig(r.Bb, 3)} T</b></div>
      <div class="c"><small>Φ con el radio medio</small><b>${sig(r.Phia * 1000, 3)} mWb</b></div>
      <div class="c"><small>Error del radio medio</small><b>${f(r.err, 2)} %</b></div>
      <div class="c"><small>Reluctancia</small><b>${sci(r.R, 3)}</b></div>
      <div class="c"><small>NI que se lleva el sector</small><b>${f(r.sh1, 1)} %</b></div>
      ${sat ? '<div class="alert">⚠ B &gt; 1,6 T en el borde interior: el hierro real se satura y este modelo ya no vale.</div>' : ''}`;
  }
  function lecturasI(P) {
    const r = iman(P), lim = P.h / 1000 > 0.95 * r.L;
    return `<div class="badge ok">B = ${sig(r.B, 3)} T</div>
      <div class="c"><small>h/(2πr)</small><b>${f(r.k, 4)}</b></div>
      <div class="c"><small>B / (μ₀M)</small><b>${f(r.frac, 1)} %</b></div>
      <div class="c"><small>H₀ en el aire</small><b>${sci(r.H0, 3)} A/m</b></div>
      <div class="c alerta"><small>H dentro del imán</small><b>${r.H === 0 ? '0' : '−' + sci(-r.H, 3)} A/m</b></div>
      ${lim ? '<div class="alert">El entrehierro no puede ser mayor que el anillo: se limita al 95 %.</div>' : ''}`;
  }
  function vPanelGen(cont, p, v, cambio, DEF0, CT, dib, vb, lect) {
    const ini = () => Object.assign({}, DEF0, p.P || {});
    let P = v && v.P ? Object.assign({}, v.P) : ini();
    cont.innerHTML = `<div class="vista panel"><div class="txt ctl-col"><div class="ctl"></div>
      <div class="row"><button class="btn sm rst">Valores de esta pantalla</button></div>
      ${p.nota ? `<p class="lbl nota">${esc(p.nota)}</p>` : ''}</div>
      <div class="fig"><svg viewBox="${vb}"></svg></div><div class="txt rd"></div></div>`;
    const ctl = cont.querySelector('.ctl');
    ctl.innerHTML = CT.map((c) => `<div><label><span>${c.l}</span><b data-v="${c.k}"></b></label><input type="range" data-k="${c.k}" min="${c.min}" max="${c.max}" step="${c.st}"></div>`).join('');
    function sync() {
      CT.forEach((c) => {
        const inp = ctl.querySelector(`input[data-k="${c.k}"]`);
        if (document.activeElement !== inp) inp.value = P[c.k];
        ctl.querySelector(`b[data-v="${c.k}"]`).textContent = f(P[c.k], c.d) + (c.u ? ' ' + c.u : '');
      });
    }
    function dibujar() { cont.querySelector('svg').innerHTML = dib(P); cont.querySelector('.rd').innerHTML = lect(P); }
    ctl.oninput = (e) => { const k = e.target.dataset.k; if (!k) return; P[k] = +e.target.value; sync(); dibujar(); cambio && cambio({ P: Object.assign({}, P) }); };
    cont.querySelector('.rst').onclick = () => { P = ini(); sync(); dibujar(); cambio && cambio({ P: Object.assign({}, P) }); };
    sync(); dibujar();
    return { act(v2) { if (!v2 || !v2.P) return; P = Object.assign({}, v2.P); sync(); dibujar(); } };
  }
  function vPred(cont, p, v) {
    const e1 = MG.PASOS.find((x) => x.id === p.ref);
    function pintar(v2) {
      const pr = (v2 && v2.pred) || null;
      cont.innerHTML = `<div class="vista"><div class="txt"><p class="big">Resultado: <b class="on-t">${esc(p.res)}</b></p>
        <p>Lo que votaron antes de calcular:</p>${EM.barras(e1, pr ? pr.c : null, { correcta: true })}
        ${pr ? `<p class="lbl">${pr.n} votos.</p>` : '<p class="lbl">No hubo votos en la predicción.</p>'}</div>
        <div class="fig"><svg viewBox="${p.ref === 'T-E1' ? VBT : VBI}">${p.ref === 'T-E1' ? toroide(MG.TD, { hl: ['sector'] }) : anillo(MG.ID)}</svg></div></div>`;
      EM.tex(cont);
    }
    pintar(v);
    return { act(v2) { pintar(v2); } };
  }
  function vCierre(cont) {
    cont.innerHTML = `<div class="vista"><div class="txt"><ul class="sum">
      <li><b>Toroide:</b> B es continuo entre materiales y \\(B \\propto 1/r\\); un tramo corto de μ baja puede llevarse la mayor parte de la NI.</li>
      <li>El flujo exacto es \\((b-a)\\,K\\ln(b/a)\\); el radio medio sirve si b/a está cerca de 1. El borde interior se satura primero.</li>
      <li><b>Imán:</b> sin corriente, \\(\\oint H\\,dl = 0\\); dentro del imán H va contra M y \\(B = \\mu_0 M(1 - h/2\\pi r)\\).</li>
      <li>Más entrehierro, más desmagnetización. El «guardián» cierra el entrehierro.</li></ul></div>
      <div class="txt"><div class="card"><b>Supuestos y límites</b><ul class="sum lbl">
      <li>Sin dispersión: todo el flujo queda en el núcleo o cruza el entrehierro.</li>
      <li>Toroide: μr constantes, sección cuadrada de lado b − a, material 1 en el sector α (como en la figura).</li>
      <li>Imán ideal: M uniforme y fija. Un imán real pierde algo de M cuando H va en contra.</li>
      <li>Ejemplos 4-2 y 4-4 de J. C. Fernández (FIUBA), con datos numéricos propios.</li></ul></div></div></div>`;
    EM.tex(cont);
    return {};
  }

  MG.vista = function (cont, p, v, modo, cambio) {
    cont.classList.add('modo-' + modo);
    switch (p.tipo) {
      case 'enunT': return vEnunT(cont);
      case 'enunI': return vEnunI(cont);
      case 'leyT': return vLey(cont, p, v, cambio, LT, toroide, MG.TD, VBT);
      case 'leyI': return vLey(cont, p, v, cambio, LI, anillo, MG.ID, VBI);
      case 'solT': return vSolT(cont, p);
      case 'solI': return vSolI(cont, p);
      case 'grafT': return vGrafT(cont);
      case 'panelT': return vPanelGen(cont, p, v, cambio, MG.TD, CTT, (P) => toroide(P), VBT, lecturasT);
      case 'panelI': return vPanelGen(cont, p, v, cambio, MG.ID, CTI, (P) => anillo(P), VBI, lecturasI);
      case 'pred': return vPred(cont, p, v);
      case 'cierre': return vCierre(cont);
      default: cont.innerHTML = ''; return {};
    }
  };
  MG._toroide = toroide; MG._anillo = anillo; MG._grafBr = grafBr;
})();
