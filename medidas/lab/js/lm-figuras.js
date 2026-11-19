// ============================================================
// Medidas Eléctricas · Examen de laboratorio (19/11/2026) — diagramas de cada pregunta (SVG con los datos del carnet)
// RC.FIG.<pregunta>(d) devuelve el SVG. Colores claros; nada de lo que se pregunta aparece resuelto en el dibujo.
// ============================================================
(function () {
  const RC = (window.RC = window.RC || {});
  const C = { t: '#1f2a3d', l: '#2b3a55', a: '#1d5fb4', m: '#c0392b', ok: '#2e7d32', s: '#eef3fb', g: '#8a96a8', tierra: '#a0794d', f: '#ffffff' };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const hh = (x) => String(x).replace('.', ',');
  const S = (w, h, body) => `<svg viewBox="0 0 ${w} ${h}" class="lm-svg" role="img" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif">${body}</svg>`;
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.fs || 13}" fill="${o.c || C.t}" text-anchor="${o.a || 'middle'}"${o.b ? ' font-weight="700"' : ''}>${esc(s)}</text>`;
  const L = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || C.l}" stroke-width="${o.w || 2}"${o.d ? ' stroke-dasharray="5 4"' : ''} stroke-linecap="round"/>`;
  const PL = (pts, o = {}) => `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${o.c || C.l}" stroke-width="${o.w || 2}" stroke-linejoin="round" stroke-linecap="round"${o.d ? ' stroke-dasharray="5 4"' : ''}/>`;
  const R = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx == null ? 6 : o.rx}" fill="${o.f || C.f}" stroke="${o.c || C.l}" stroke-width="${o.w || 2}"/>`;
  const CI = (x, y, r, o = {}) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${o.f || C.f}" stroke="${o.c || C.l}" stroke-width="${o.w || 2}"/>`;
  const P = (dd, o = {}) => `<path d="${dd}" fill="${o.f || 'none'}" stroke="${o.c || C.l}" stroke-width="${o.w || 2}" stroke-linecap="round" stroke-linejoin="round"${o.d ? ' stroke-dasharray="5 4"' : ''}/>`;
  const punto = (x, y, c) => `<circle cx="${x}" cy="${y}" r="3.5" fill="${c || C.l}"/>`;
  // resistencia en zigzag (horizontal o vertical) de largo fijo, centrada
  const resH = (x1, x2, y, o = {}) => { const m = (x1 + x2) / 2, a = 22; let p = `M${x1},${y} L${m - a},${y}`; for (let i = 0; i < 6; i++) p += ` L${m - a + (i + 0.5) * ((2 * a) / 6)},${y + (i % 2 ? 7 : -7)}`; p += ` L${m + a},${y} L${x2},${y}`; return P(p, o); };
  const resV = (x, y1, y2, o = {}) => { const m = (y1 + y2) / 2, a = 22; let p = `M${x},${y1} L${x},${m - a}`; for (let i = 0; i < 6; i++) p += ` L${x + (i % 2 ? 7 : -7)},${m - a + (i + 0.5) * ((2 * a) / 6)}`; p += ` L${x},${m + a} L${x},${y2}`; return P(p, o); };
  const medidor = (x, y, r, letra, o = {}) => CI(x, y, r, { f: o.f || C.s, c: o.c || C.a }) + T(x, y + 5, letra, { fs: o.fs || 15, b: true, c: o.c || C.a });
  const flecha = (x1, y1, x2, y2, c) => { const a = Math.atan2(y2 - y1, x2 - x1), k = 8; return L(x1, y1, x2, y2, { c, w: 2 }) + `<polygon points="${x2},${y2} ${x2 - k * Math.cos(a - 0.4)},${y2 - k * Math.sin(a - 0.4)} ${x2 - k * Math.cos(a + 0.4)},${y2 - k * Math.sin(a + 0.4)}" fill="${c || C.l}"/>`; };
  const tierraS = (x, y) => L(x - 10, y, x + 10, y) + L(x - 6, y + 4, x + 6, y + 4) + L(x - 2, y + 8, x + 2, y + 8);
  // bobina dibujada como rizos (gruesa = corriente; fina = tensión)
  const bobH = (x1, x2, y, o = {}) => { const n = 4, w = (x2 - x1) / n; let p = `M${x1},${y}`; for (let i = 0; i < n; i++) p += ` a${w / 2},${w / 2} 0 0 1 ${w},0`; return P(p, o); };
  const bobV = (x, y1, y2, o = {}) => { const n = 4, h = (y2 - y1) / n; let p = `M${x},${y1}`; for (let i = 0; i < n; i++) p += ` a${h / 2},${h / 2} 0 0 1 0,${h}`; return P(p, o); };
  // carátula analógica: escala de 0 a máx, aguja en «frac» (puede ser negativa)
  const dial = (cx, cy, r, frac, o = {}) => {
    const a0 = Math.PI * 1.15, a1 = Math.PI * -0.15;
    const ang = (f) => a0 + (a1 - a0) * f;
    let s = P(`M${cx + r * Math.cos(a0)},${cy - r * Math.sin(a0)} A${r},${r} 0 0 1 ${cx + r * Math.cos(a1)},${cy - r * Math.sin(a1)}`, { c: C.g, w: 2 });
    const n = o.marcas || 10;
    for (let i = 0; i <= n; i++) { const a = ang(i / n), r2 = i % 5 === 0 ? r - 9 : r - 5; s += L(cx + r * Math.cos(a), cy - r * Math.sin(a), cx + r2 * Math.cos(a), cy - r2 * Math.sin(a), { c: C.g, w: 1.5 }); }
    if (o.etq) o.etq.forEach(([f, txt]) => { const a = ang(f); s += T(cx + (r - 20) * Math.cos(a), cy - (r - 20) * Math.sin(a) + 4, txt, { fs: 11, c: C.g }); });
    const a = ang(frac);
    s += L(cx, cy, cx + (r - 6) * Math.cos(a), cy - (r - 6) * Math.sin(a), { c: o.cAguja || C.m, w: 2.5 }) + punto(cx, cy, C.l);
    return s;
  };
  const F = {};

  // ---------- A1: amperímetro tocando el tomacorriente ----------
  F.a1 = (d) => S(340, 215,
    R(30, 40, 76, 96, { rx: 10, f: C.s }) + R(50, 62, 7, 22, { rx: 2, f: C.l }) + R(79, 62, 7, 22, { rx: 2, f: C.l }) +
    T(62, 194, 'Tomacorriente', { fs: 12, b: true }) + T(62, 209, '220 V', { fs: 12 }) +
    PL([[60, 40], [60, 18], [250, 18], [250, 34]]) + PL([[76, 40], [76, 26], [244, 26], [244, 34]]) +
    R(214, 34, 72, 26, { f: C.s }) + T(250, 52, 'Ducha', { fs: 12 }) + [0, 1, 2, 3].map((i) => L(224 + i * 18, 64, 220 + i * 18, 80, { c: C.a, w: 1.5, d: true })).join('') +
    T(250, 98, hh(d.a1.P) + ' W', { b: true }) +
    R(150, 112, 140, 94, { f: '#fff8e6', c: '#b7791f' }) + R(214, 120, 68, 24, { rx: 3, f: '#e9f1df', c: C.g, w: 1 }) + T(248, 137, '- - - -', { fs: 13 }) +
    CI(166, 140, 5, { f: C.m, c: C.m }) + T(176, 144, '10 A', { fs: 11, a: 'start' }) + CI(166, 178, 5, { f: C.l }) + T(176, 182, 'COM', { fs: 11, a: 'start' }) +
    T(250, 168, 'perilla: 10 A', { fs: 11 }) + T(250, 186, 'fusible 10 A', { fs: 11, c: '#b7791f' }) +
    P('M166,140 C120,140 70,130 53,86', { c: C.m, w: 2.5 }) + P('M166,178 C110,178 92,130 82,86', { c: C.l, w: 2.5 }));

  // ---------- A2: óhmetro sobre R1 en la placa ----------
  F.a2 = (d) => S(340, 200,
    R(20, 40, 260, 140, { rx: 12, f: '#f3f8ef', c: C.ok }) + T(32, 58, 'Placa', { fs: 12, c: C.ok, a: 'start' }) +
    resH(70, 230, 80) + resH(70, 230, 135) + L(70, 80, 70, 135) + L(230, 80, 230, 135) + punto(70, 80) + punto(230, 80) +
    T(150, 66, 'R1 = ' + d.a2.R1 + ' Ω', { b: true }) + T(150, 160, 'R2 = ' + d.a2.R2 + ' Ω', { b: true }) +
    medidor(150, 22, 16, 'Ω') + PL([[134, 22], [70, 22], [70, 80]], { c: C.m }) + PL([[166, 22], [230, 22], [230, 80]], { c: C.l }) +
    L(230, 110, 300, 110) + R(300, 98, 26, 24, { rx: 4, f: C.s }) + T(313, 140, 'enchufe', { fs: 11 }) + T(313, 155, '220 V', { fs: 11 }));

  // ---------- A3: miliamperímetro con shunt ----------
  F.a3 = (d) => S(340, 190,
    flecha(14, 100, 62, 100, C.a) + T(36, 90, 'I = ' + d.a3.I + ' A', { fs: 12, b: true, c: C.a }) + L(62, 100, 80, 100) + punto(80, 100) +
    PL([[80, 100], [80, 60], [140, 60]]) + CI(170, 60, 30, { f: C.s, c: C.a }) + dial(170, 70, 24, 0.0, { marcas: 5 }) + T(170, 102, 'mA', { fs: 11, c: C.a }) +
    PL([[200, 60], [260, 60], [260, 100]]) + punto(260, 100) + L(260, 100, 300, 100) + flecha(300, 100, 330, 100, C.a) +
    PL([[80, 100], [80, 150], [125, 150]]) + resH(125, 215, 150, { c: C.m }) + PL([[215, 150], [260, 150], [260, 100]]) +
    T(170, 135, 'shunt Rsh = ?', { fs: 12, c: C.m, b: true }) +
    T(170, 20, 'Im = ' + hh(d.a3.Im) + ' mA (fondo de escala)', { fs: 12 }) + T(170, 182, 'Rm = ' + d.a3.Rm + ' Ω (bobina del instrumento)', { fs: 12 }));

  // ---------- A4: divisor de tensión y voltímetro analógico ----------
  F.a4 = (d) => S(340, 200,
    CI(70, 100, 20, { f: C.s }) + T(70, 96, '+', { fs: 13, b: true }) + T(70, 112, '−', { fs: 13, b: true }) + T(24, 96, 'E =', { fs: 12, b: true }) + T(24, 112, d.a4.E + ' V', { fs: 12, b: true }) +
    PL([[70, 80], [70, 20], [190, 20], [190, 30]]) + resV(190, 30, 95) + punto(190, 100) + resV(190, 105, 170) + PL([[190, 170], [190, 185], [70, 185], [70, 120]]) + L(190, 95, 190, 105) +
    T(150, 65, 'R1', { fs: 12, b: true }) + T(150, 80, d.a4.R + ' kΩ', { fs: 12 }) + T(150, 140, 'R2', { fs: 12, b: true }) + T(150, 155, d.a4.R + ' kΩ', { fs: 12 }) +
    PL([[190, 100], [270, 100], [270, 116]], { c: C.a }) + medidor(270, 136, 20, 'V') + PL([[270, 156], [270, 185], [190, 185]], { c: C.a }) +
    T(270, 74, '20 kΩ/V', { fs: 12, c: C.a }) + T(270, 88, 'escala ' + d.a4.esc + ' V', { fs: 12, c: C.a }));

  // ---------- A5: pinza alrededor del cable completo ----------
  F.a5 = (d) => S(340, 170,
    T(28, 52, '220 V', { fs: 12, b: true }) + R(14, 62, 300, 46, { rx: 22, f: '#f6f1ea', c: C.g }) +
    L(20, 76, 280, 76, { c: C.m, w: 3 }) + L(20, 94, 280, 94, { c: C.a, w: 3 }) + T(60, 72, 'fase', { fs: 11, c: C.m }) + T(60, 118, 'neutro', { fs: 11, c: C.a }) +
    flecha(90, 76, 130, 76, C.m) + flecha(130, 94, 90, 94, C.a) +
    CI(300, 85, 22, { f: C.s }) + T(300, 90, 'M', { fs: 15, b: true }) + T(300, 128, 'I = ' + hh(d.a5.I) + ' A', { fs: 12 }) +
    P('M175,40 C150,40 145,130 175,130 C205,130 205,40 180,40', { c: '#b7791f', w: 6 }) + R(150, 132, 56, 26, { rx: 4, f: '#fff8e6', c: '#b7791f' }) + T(178, 150, '? A', { fs: 13, b: true }) +
    T(178, 28, 'pinza', { fs: 12, c: '#b7791f' }));

  // ---------- B1: vatímetro con las bobinas intercambiadas ----------
  F.b1 = () => S(340, 200,
    CI(36, 100, 20, { f: C.s }) + P('M24,100 q6,-10 12,0 t12,0') + T(46, 140, '220 V', { fs: 12, a: 'start' }) +
    PL([[36, 80], [36, 40], [110, 40]]) + bobH(110, 190, 40, { c: C.a, w: 1.5 }) + PL([[190, 40], [300, 40], [300, 70]]) +
    R(280, 70, 40, 60, { f: C.s }) + T(300, 105, 'carga', { fs: 11 }) + PL([[300, 130], [300, 165], [36, 165], [36, 120]]) +
    punto(240, 40) + punto(240, 165) + L(240, 40, 240, 70, { c: C.m, w: 3 }) + bobV(240, 70, 135, { c: C.m, w: 3.5 }) + L(240, 135, 240, 165, { c: C.m, w: 3 }) +
    T(150, 24, 'bobina de tensión (en serie)', { fs: 12, c: C.a }) + T(196, 104, 'bobina de', { fs: 12, c: C.m, a: 'end' }) + T(196, 119, 'corriente', { fs: 12, c: C.m, a: 'end' }) + T(196, 134, '(en paralelo)', { fs: 12, c: C.m, a: 'end' }) +
    T(170, 190, 'Así lo conectó el practicante', { fs: 12, b: true }));

  // ---------- B2: vatímetro que marca poco en un motor en vacío ----------
  F.b2 = (d) => S(340, 185,
    R(14, 18, 150, 150, { rx: 10, f: '#fbfbfd' }) + dial(89, 110, 62, (d.b2.P) / (d.b2.Vn * d.b2.In), { marcas: 10, etq: [[0, '0'], [1, 'máx']] }) +
    T(89, 140, 'W', { fs: 15, b: true, c: C.a }) + T(89, 160, d.b2.Vn + ' V; ' + hh(d.b2.In) + ' A', { fs: 12, b: true }) +
    L(164, 90, 230, 90) + CI(270, 90, 30, { f: C.s }) + T(270, 96, 'M', { fs: 17, b: true }) +
    T(270, 140, 'en vacío', { fs: 12 }) + T(270, 156, 'P = ' + d.b2.P + ' W', { fs: 12, b: true }) + T(270, 172, 'FP = ' + hh(d.b2.fp), { fs: 12, b: true }));

  // ---------- B3: carátula del vatímetro ----------
  F.b3 = (d) => S(340, 212,
    R(10, 8, 320, 200, { rx: 12, f: '#fbfbfd' }) + dial(170, 120, 92, d.b3.alfa / d.b3.amax, { marcas: 20, etq: [[0, '0'], [0.5, String(d.b3.amax / 2)], [1, String(d.b3.amax)]] }) +
    T(170, 102, 'W', { fs: 16, b: true, c: C.a }) + T(170, 182, d.b3.Vn + ' V; ' + hh(d.b3.In) + ' A; cos φn = ' + hh(d.b3.cosn) + '; ' + d.b3.amax + ' div', { fs: 12, b: true }) +
    T(170, 200, 'La aguja marca ' + d.b3.alfa + ' divisiones', { fs: 12, c: C.m }));

  // ---------- B4: conexiones A y B ----------
  const esquema = (x0, tipo) => {
    let s = T(x0 + 75, 18, 'Conexión ' + tipo, { fs: 13, b: true }) + CI(x0 + 14, 90, 13, { f: C.s }) + P(`M${x0 + 6},90 q4,-7 8,0 t8,0`) +
      PL([[x0 + 14, 77], [x0 + 14, 40], [x0 + 60, 40]]) + bobH(x0 + 60, x0 + 100, 40, { c: C.m, w: 3 }) + PL([[x0 + 100, 40], [x0 + 140, 40], [x0 + 140, 70]]) +
      R(x0 + 128, 70, 24, 40, { f: C.s }) + PL([[x0 + 140, 110], [x0 + 140, 140], [x0 + 14, 140], [x0 + 14, 103]]);
    const xv = tipo === 'A' ? x0 + 44 : x0 + 116;
    s += punto(xv, 40) + punto(xv, 140) + bobV(xv, 70, 110, { c: C.a, w: 1.5 }) + L(xv, 40, xv, 70, { c: C.a, w: 1.5 }) + L(xv, 110, xv, 140, { c: C.a, w: 1.5 });
    return s;
  };
  F.b4 = (d) => S(340, 185, esquema(6, 'A') + esquema(178, 'B') +
    T(170, 162, 'rojo: bobina de corriente (Rc = 0,05 Ω); azul: de tensión (Rp = ' + d.b4.Rp + ' kΩ)', { fs: 10.5 }) +
    T(170, 179, 'Carga: ' + (d.b4.chica ? 'lámpara de ' + d.b4.carga + ' W' : 'motor de ' + hh(d.b4.carga) + ' kW, FP 0,8'), { fs: 12, b: true }));

  // ---------- C1: dos vatímetros con la aguja de W1 hacia atrás ----------
  F.c1 = (d) => S(340, 222,
    ['L1', 'L2', 'L3'].map((n, i) => T(14, 44 + i * 50, n, { fs: 12, b: true }) + L(30, 40 + i * 50, 270, 40 + i * 50)).join('') +
    R(270, 25, 56, 130, { f: C.s }) + T(298, 85, 'compre-', { fs: 11 }) + T(298, 99, 'sor', { fs: 11 }) +
    R(90, 28, 64, 24, { f: '#fff', c: C.m }) + T(122, 45, 'W1', { fs: 13, b: true, c: C.m }) + R(90, 128, 64, 24, { f: '#fff', c: C.a }) + T(122, 145, 'W2', { fs: 13, b: true, c: C.a }) +
    L(122, 52, 122, 90, { c: C.m, w: 1.5, d: true }) + punto(122, 90) + L(122, 128, 122, 90, { c: C.a, w: 1.5, d: true }) +
    T(212, 186, 'W1 = ' + hh(Math.abs(d.c1.W1)) + ' kW (leído tras invertir)', { fs: 12, b: true, c: C.m }) + T(212, 204, 'W2 = ' + hh(d.c1.W2) + ' kW', { fs: 12, b: true, c: C.a }) +
    T(48, 172, 'W1 al energizar', { fs: 10, c: C.m }) + dial(48, 206, 22, -0.18, { marcas: 4 }));

  // ---------- C2: tablero con banco automático ----------
  F.c2 = (d) => {
    let s = T(8, 20, 'Red 380 V; 50 Hz', { fs: 12, b: true, a: 'start' }) + L(10, 30, 330, 30, { w: 4 }) + T(332, 20, 'Planta ' + d.c2.P + ' kW; FP ' + hh(d.c2.fp1), { fs: 12, b: true, a: 'end' }) +
      R(14, 70, 82, 46, { f: C.s }) + T(55, 90, 'Regulador', { fs: 12 }) + T(55, 106, 'de FP', { fs: 12 }) + L(55, 30, 55, 70, { w: 1.5 });
    for (let i = 0; i < 5; i++) {
      const x = 120 + i * 42;
      s += L(x, 30, x, 66, { w: 1.5 }) + R(x - 9, 66, 18, 14, { rx: 2, f: '#fff' }) + L(x, 80, x, 104, { w: 1.5 }) + L(x - 11, 104, x + 11, 104, { w: 2.5 }) + L(x - 11, 111, x + 11, 111, { w: 2.5 }) + L(x, 111, x, 124, { w: 1.5 });
    }
    s += T(330, 110, '…', { fs: 18, a: 'end' }) + L(120, 124, 288, 124, { w: 1.5, d: true }) +
      T(205, 150, 'Banco automático en triángulo', { fs: 12, b: true }) + T(205, 168, 'pasos de ' + d.c2.Qp + ' kVAR (contactor + capacitores)', { fs: 12 }) +
      T(205, 190, '¿Cuántos pasos instalas?', { fs: 12, c: C.m });
    return S(340, 200, s);
  };

  // ---------- C3: triángulo de potencias de la noche ----------
  F.c3 = (d) => {
    const k = 130 / d.c3.Qb, x0 = 24, y0 = 60;
    const xp = x0 + Math.max(50, d.c3.P * k * 1.6), yq = y0 - d.c3.Qn * k, yb = yq + d.c3.Qb * k, xb = xp + 16;
    const c = RC.P.C.c3(d);
    return S(340, 224,
      flecha(x0, y0, xp, y0, C.l) + T((x0 + xp) / 2, y0 + 16, 'P = ' + d.c3.P + ' kW', { fs: 11 }) +
      flecha(xp, y0, xp, yq, C.a) + T(xb + 10, yq + 4, 'Q carga ' + hh(d.c3.Qn) + ' kVAR', { fs: 11, a: 'start', c: C.a }) +
      flecha(xb, yq, xb, yb, C.m) + T(xb + 10, (yq + yb) / 2, 'Q banco', { fs: 11, a: 'start', c: C.m }) + T(xb + 10, (yq + yb) / 2 + 14, d.c3.Qb + ' kVAR', { fs: 11, a: 'start', c: C.m }) +
      R(214, 112, 116, 104, { rx: 10, f: '#fbfbfd' }) + T(272, 130, 'cosfímetro', { fs: 11 }) + T(272, 147, String(Math.round(c.fp * 100) / 100).replace('.', ',') + ' cap', { fs: 13, b: true, c: C.m }) +
      dial(272, 196, 34, 0.86, { marcas: 6 }) + T(236, 211, 'ind', { fs: 10, c: C.g }) + T(308, 211, 'cap', { fs: 10, c: C.g }) +
      T(24, 198, 'De noche:', { fs: 12, b: true, a: 'start' }) + T(24, 214, 'solo cámaras de frío', { fs: 12, b: true, a: 'start' }));
  };

  // ---------- C4: motor poco cargado ----------
  F.c4 = (d) => S(340, 172,
    CI(80, 80, 44, { f: C.s }) + T(80, 86, 'M', { fs: 22, b: true }) + R(20, 134, 120, 30, { rx: 4, f: '#fff' }) + T(80, 154, 'placa: ' + d.c4.Pm + ' kW', { fs: 12, b: true }) +
    L(124, 80, 156, 80, { w: 1.5 }) + L(156, 80, 156, 108, { w: 1.5 }) + L(144, 108, 168, 108, { w: 2.5 }) + L(144, 115, 168, 115, { w: 2.5 }) + L(156, 115, 156, 130, { w: 1.5 }) +
    R(182, 24, 140, 16, { rx: 8, f: '#fff', c: C.g }) + R(182, 24, 140 / 3, 16, { rx: 8, f: C.a, c: C.a }) + T(182, 60, 'trabaja a un tercio', { fs: 12, a: 'start' }) + T(182, 76, '≈ ' + Math.round(d.c4.Pm / 3) + ' kW', { fs: 12, b: true, a: 'start' }) +
    T(182, 104, 'Q en vacío: Q0 = ' + d.c4.Q0 + ' kVAR', { fs: 12, b: true, c: C.a, a: 'start' }) + T(182, 128, 'capacitor junto al', { fs: 12, c: C.m, a: 'start' }) + T(182, 144, 'motor: ¿cuántos kVAR?', { fs: 12, c: C.m, a: 'start' }));

  // ---------- D1: factura ----------
  F.d1 = (d) => S(340, 200,
    R(30, 10, 280, 182, { rx: 6, f: '#fffdf7', c: C.g }) + T(170, 34, 'FACTURA DE ELECTRICIDAD', { fs: 13, b: true }) + T(170, 50, 'Cliente industrial; mes de noviembre', { fs: 11, c: C.g }) +
    L(44, 60, 296, 60, { c: C.g, w: 1 }) +
    T(50, 82, 'Energía activa', { fs: 12, a: 'start' }) + T(290, 82, d.d1.kWh + ' kWh', { fs: 12, a: 'end', b: true }) +
    T(50, 104, 'Energía reactiva', { fs: 12, a: 'start' }) + T(290, 104, d.d1.kVARh + ' kVARh', { fs: 12, a: 'end', b: true }) +
    T(50, 126, 'Cargo por energía', { fs: 12, a: 'start' }) + T(290, 126, d.d1.cargo + ' Bs', { fs: 12, a: 'end', b: true }) +
    T(50, 148, 'Recargo por bajo FP (mín. 0,85)', { fs: 12, a: 'start', c: C.m }) + T(290, 148, '? Bs', { fs: 12, a: 'end', b: true, c: C.m }) +
    L(44, 160, 296, 160, { c: C.g, w: 1 }) + T(170, 180, 'Regla: recargo = cargo × (0,85 / FP − 1)', { fs: 11, c: C.g }));

  // ---------- D2: tensión senoidal y corriente en pulsos ----------
  F.d2 = (d) => {
    const x0 = 14, w = 210, y0 = 80, A = 50;
    let v = '', i = '';
    for (let k = 0; k <= 200; k++) {
      const t = k / 200, x = x0 + t * w, th = t * 4 * Math.PI;
      v += (k ? ' L' : 'M') + x.toFixed(1) + ',' + (y0 - A * Math.sin(th)).toFixed(1);
      const pulso = Math.sign(Math.sin(th)) * Math.max(0, Math.abs(Math.sin(th)) - 0.82) * 5.2;
      i += (k ? ' L' : 'M') + x.toFixed(1) + ',' + (y0 - A * 0.95 * pulso).toFixed(1);
    }
    return S(340, 170, L(x0, y0, x0 + w, y0, { c: C.g, w: 1 }) + P(v, { c: C.a, w: 2 }) + P(i, { c: C.m, w: 2.5 }) +
      T(x0 + 4, 150, 'azul: tensión; rojo: corriente', { fs: 11, a: 'start' }) +
      R(236, 18, 96, 54, { f: C.s }) + T(284, 38, 'cosfímetro', { fs: 11 }) + T(284, 60, 'cos φ = ' + hh(d.d2.cosf), { fs: 12, b: true }) +
      R(236, 86, 96, 54, { f: '#fff8e6', c: '#b7791f' }) + T(284, 106, 'analizador', { fs: 11 }) + T(284, 128, 'THD I = ' + d.d2.thd + ' %', { fs: 12, b: true }));
  };

  // ---------- E1: falla a la carcasa de la lavadora ----------
  F.e1 = (d) => S(340, 230,
    CI(36, 60, 18, { f: C.s }) + CI(56, 60, 18, { f: C.s }) + T(46, 30, 'Transformador', { fs: 11 }) +
    PL([[74, 50], [110, 50]], { c: C.m }) + R(110, 40, 46, 20, { rx: 3, f: '#fff' }) + T(133, 54, '16 A', { fs: 11, b: true }) + PL([[156, 50], [236, 50], [236, 70]], { c: C.m }) + T(196, 44, 'fase 220 V', { fs: 11, c: C.m }) +
    PL([[74, 70], [96, 70], [96, 95]], { c: C.a }) + resV(96, 95, 150, { c: C.a }) + PL([[96, 150], [96, 176]], { c: C.a }) + T(70, 128, 'RB', { fs: 12, b: true, c: C.a }) + T(70, 143, d.e1.RB + ' Ω', { fs: 12, c: C.a }) +
    R(214, 70, 74, 70, { rx: 8, f: C.s }) + T(251, 128, 'Lavadora', { fs: 12 }) + P('M236,70 l6,10 l-10,6 l8,10', { c: C.m, w: 2.5 }) + T(250, 90, 'falla', { fs: 11, c: C.m, a: 'start' }) +
    PL([[288, 120], [306, 120], [306, 130]]) + resV(306, 130, 170) + L(306, 170, 306, 176) + T(294, 152, 'RA', { fs: 12, b: true, a: 'end' }) + T(294, 167, d.e1.RA + ' Ω', { fs: 11, a: 'end' }) +
    L(10, 178, 330, 178, { c: C.tierra, w: 3 }) + T(200, 196, 'suelo', { fs: 11, c: C.tierra }) + flecha(290, 188, 112, 188, C.m) + T(200, 214, 'camino de la corriente de falla', { fs: 11, c: C.m }) +
    CI(184, 98, 7) + L(184, 105, 184, 140) + L(184, 115, 214, 108) + L(184, 140, 176, 172) + L(184, 140, 192, 172) + T(168, 92, 'persona', { fs: 10, a: 'end' }));

  // ---------- E2: telurómetro con las tres lecturas ----------
  F.e2 = (d) => {
    const x0 = 30, xH = 310, k = (xH - x0) / d.e2.D, xS = x0 + d.e2.x * k, y0 = 90;
    const r = d.e2.lec.map((v) => hh(v.toFixed(2)));
    return S(340, 235,
      L(10, y0, 330, y0, { c: C.tierra, w: 3 }) + `<rect x="10" y="${y0}" width="320" height="34" fill="#f3ebe0"/>` +
      L(x0, y0 - 6, x0, y0 + 30, { w: 5, c: '#b07a3a' }) + T(x0, y0 - 12, 'E', { b: true }) +
      L(xS, y0 - 6, xS, y0 + 16, { w: 3 }) + T(xS, y0 - 12, 'S', { b: true }) + L(xH, y0 - 6, xH, y0 + 16, { w: 3 }) + T(xH, y0 - 12, 'H', { b: true }) +
      R(140, 8, 70, 34, { f: C.s }) + T(175, 30, 'telurómetro', { fs: 11 }) + PL([[150, 42], [x0, 62], [x0, y0 - 8]], { c: C.g, w: 1.2 }) + PL([[175, 42], [xS, 62], [xS, y0 - 8]], { c: C.g, w: 1.2 }) + PL([[200, 42], [xH, 62], [xH, y0 - 8]], { c: C.g, w: 1.2 }) +
      flecha(x0, 140, xH, 140, C.l) + T((x0 + xH) / 2, 154, 'D = ' + d.e2.D + ' m (jabalina de ' + hh(d.e2.L) + ' m)', { fs: 12 }) +
      R(30, 166, 280, 64, { rx: 6, f: '#fff' }) + T(170, 184, 'Lecturas', { fs: 12, b: true }) +
      T(46, 204, 'S a ' + hh((d.e2.x - 1).toFixed(1)) + ' m', { fs: 12, a: 'start' }) + T(170, 204, 'S a ' + hh(d.e2.x.toFixed(1)) + ' m', { fs: 12 }) + T(294, 204, 'S a ' + hh((d.e2.x + 1).toFixed(1)) + ' m', { fs: 12, a: 'end' }) +
      T(46, 222, r[0] + ' Ω', { fs: 13, b: true, a: 'start' }) + T(170, 222, r[1] + ' Ω', { fs: 13, b: true }) + T(294, 222, r[2] + ' Ω', { fs: 13, b: true, a: 'end' }));
  };

  // ---------- E3: jabalina en el suelo ----------
  F.e3 = (d) => S(340, 190,
    `<rect x="10" y="40" width="320" height="140" fill="#f3ebe0"/>` + L(10, 40, 330, 40, { c: C.tierra, w: 3 }) + T(260, 70, 'suelo', { fs: 12, c: C.tierra }) + T(260, 88, 'ρ = ' + d.e3.rho + ' Ω·m', { fs: 13, b: true }) +
    R(104, 22, 12, 150, { rx: 3, f: '#d08a3c', c: '#a0601e' }) + L(124, 40, 124, 172, { c: C.l, w: 1.5 }) + L(119, 40, 129, 40, { w: 1.5 }) + L(119, 172, 129, 172, { w: 1.5 }) +
    T(136, 112, 'L = ' + hh(d.e3.L) + ' m', { fs: 13, b: true, a: 'start' }) + T(110, 14, 'radio a = 8 mm', { fs: 12 }) + T(260, 140, 'máximo pedido: 25 Ω', { fs: 12, c: C.m }));

  RC.FIG = F;
})();
