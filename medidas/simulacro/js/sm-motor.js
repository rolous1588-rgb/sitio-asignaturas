// ============================================================
// Medidas Eléctricas: simulacro del examen final (25/11/2026), preguntas, calificación y figuras.
// Decisiones del docente (25/11): se practica en casa con un enlace, sin reloj, sin fórmulas en los enunciados
// (como el examen) y con registro de quién practicó. Parte A: voltímetro, valor medio y eficaz, resistencia con
// voltímetro y amperímetro (y el shunt del amperímetro). B: potencia, FP y corrección. C: puesta a tierra.
// D: laboratorio. E: interpretación de valores y resultados. 100 puntos: 20, 35, 10, 15 y 20.
// Cada simulacro tiene sus datos (semilla = carnet + número de simulacro).
// Tipos de casilla:
//   num  → número con coma o punto; ±2 % (FP ±0,01); si depende de otra casilla, vale con los números del estudiante
//   op   → una opción (la correcta va primero en ops() y se mezcla con la semilla)
//   ord  → ordenar pasos; puntaje por pasos en su lugar (vale el mejor de los órdenes aceptados), de a medio punto
// ============================================================
(function () {
  'use strict';
  const SM = (window.SM = {});
  const PI = Math.PI, R3 = Math.sqrt(3), GRAD = 180 / PI;

  // ---------- azar reproducible ----------
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  SM.rng = (semilla) => {
    let a = hash(String(semilla));
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  const elegir = (r, arr) => arr[Math.floor(r() * arr.length)];
  const entre = (r, a, b, paso) => Math.round((a + paso * Math.floor(r() * (Math.round((b - a) / paso) + 1))) * 1e6) / 1e6;
  SM.mezclar = (r, arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------- lo que escribe el estudiante ----------
  SM.leer = (s) => {
    if (s == null) return { vacio: true };
    const t = String(s).trim().replace(/\s+/g, '').replace(/[−–—‒]/g, '-').replace(/^\+/, '').replace(/,/g, '.');
    if (t === '') return { vacio: true };
    if (/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return { v: Number(t) || 0 };
    return { invalido: true };
  };
  SM.cerca = (v, e, tol) => {
    const rel = tol && tol.rel != null ? tol.rel : 0.02, abs = tol && tol.abs != null ? tol.abs : 0.01;
    return isFinite(v) && isFinite(e) && Math.abs(v - e) <= Math.max(rel * Math.abs(e), abs) + 1e-9;
  };
  const TOL_FP = { rel: 0, abs: 0.01 };
  const TOL_ENT = { rel: 0, abs: 0.01 };
  const TOL_PCT = { rel: 0.03, abs: 0.5 };

  // ---------- números para mostrar ----------
  const decs = (x) => { const a = Math.abs(x); if (!isFinite(a) || a === 0) return 0; return Math.max(0, Math.min(4, 3 - Math.floor(Math.log10(a)))); };
  const redo = (x, d) => { const v = Math.round(x * 10 ** d) / 10 ** d; return Object.is(v, -0) ? 0 : v; };
  SM.txt = (x, d) => String(redo(x, d == null ? decs(x) : d)).replace('.', ',').replace('-', '−');
  SM.tex = (x, d) => String(redo(x, d == null ? decs(x) : d)).replace('.', '{,}');
  const tx = SM.tex, ht = SM.txt;
  const nh = (x) => String(x).replace('.', '{,}');
  const M = (s) => '\\(' + s + '\\)';
  const UNI = { 'Ω': '\\Omega', 'Ω·m': '{\\Omega\\cdot\\text{m}}', 'µF': '\\mu\\text{F}', 'kΩ': '\\text{k}\\Omega', 'mΩ': '\\text{m}\\Omega', 'µA': '\\mu\\text{A}' };
  const u_ = (s) => '\\ ' + (UNI[s] || '\\text{' + s + '}');
  const datos = (lista) => '<ul class="sm-datos">' + lista.map((x) => '<li>' + x + '</li>').join('') + '</ul>';
  const dos = (propio, exacto) => (isFinite(propio) ? [propio, exacto] : [exacto]);
  const usar = (u, id, exacto) => { const v = u(id); return v == null || !isFinite(v) ? exacto : v; };
  const acosS = (x) => Math.acos(Math.max(-1, Math.min(1, x)));
  const ops = (lista) => lista.map((h) => ({ h }));
  const dwight = (rho, L) => (rho / (2 * PI * L)) * (Math.log((4 * L) / 0.008) - 1);

  // ============================================================
  // FIGURAS (SVG claros, sin fórmulas)
  // ============================================================
  const F = (SM.FIG = {});
  const svg = (vb, s, alto) => `<svg viewBox="${vb}" role="img"${alto ? ` style="max-height:${alto}px"` : ''}>${s}</svg>`;
  const T = (x, y, s, o) => `<text x="${x}" y="${y}"${o && o.a ? ` text-anchor="${o.a}"` : ''}${o && o.c ? ` class="${o.c}"` : ''}>${s}</text>`;
  const L = (x1, y1, x2, y2, c) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${c ? ` class="${c}"` : ''}/>`;
  const caja = (x, y, w, h, et, o) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" class="${(o && o.c) || 'r'}"/>` + (et ? T(x + w / 2, y + h / 2 + 5, et, { a: 'middle', c: (o && o.tc) || '' }) : '');
  const med = (x, y, l, c) => `<circle cx="${x}" cy="${y}" r="17" class="${c || 'med'}"/>` + T(x, y + 6, l, { a: 'middle', c: 'ml' });
  const punto = (x, y) => `<circle cx="${x}" cy="${y}" r="3.5" class="nodo"/>`;
  const flecha = (x1, y1, x2, y2, c) => {
    const dx = x2 - x1, dy = y2 - y1, Ln = Math.hypot(dx, dy) || 1, ux = dx / Ln, uy = dy / Ln, hs = 8, bx = x2 - ux * hs, by = y2 - uy * hs;
    return `<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" class="${c || 'fl'}"/><polygon points="${x2},${y2} ${bx - uy * 5},${by + ux * 5} ${bx + uy * 5},${by - ux * 5}" class="${(c || 'fl') + 'p'}"/>`;
  };
  const fuente = (x, y, et) => `<circle cx="${x}" cy="${y}" r="16" class="r"/><path d="M${x - 8},${y} q4,-8 8,0 t8,0" class="w"/>` + (et ? T(x - 24, y + 5, et, { a: 'end' }) : '');
  const bateria = (x, y, et) => L(x - 12, y - 4, x + 12, y - 4, 'w2') + L(x - 7, y + 4, x + 7, y + 4, 'w3') + (et ? T(x - 18, y + 5, et, { a: 'end' }) : '');

  // A1: amperímetro con shunt
  const sb = (a, b) => a + '<tspan dy="4" class="sub">' + b + '</tspan>';
  F.shunt = () => svg('0 0 360 190', L(20, 95, 80, 95, 'w') + flecha(28, 80, 62, 80) + T(44, 72, 'I', { a: 'middle', c: 'it' }) + punto(80, 95) +
    L(80, 95, 80, 45, 'w') + L(80, 45, 155, 45, 'w') + med(172, 45, 'G') + L(189, 45, 280, 45, 'w') + L(280, 45, 280, 95, 'w') + T(172, 84, 'bobina: ' + sb('R', 'm'), { a: 'middle', c: 'pq' }) +
    flecha(106, 28, 140, 28) + T(123, 20, sb('I', 'm'), { a: 'middle', c: 'it' }) +
    L(80, 95, 80, 145, 'w') + L(80, 145, 145, 145, 'w') + caja(145, 133, 54, 24, sb('R', 'sh'), { tc: 'it' }) + L(199, 145, 280, 145, 'w') + L(280, 145, 280, 95, 'w') + T(172, 124, 'shunt', { a: 'middle', c: 'pq' }) +
    flecha(214, 165, 250, 165) + T(232, 184, sb('I', 'sh'), { a: 'middle', c: 'it' }) + punto(280, 95) + L(280, 95, 340, 95, 'w') + flecha(300, 80, 334, 80) + T(318, 72, 'I', { a: 'middle', c: 'it' }), 190);

  // A2: divisor con voltímetro sobre R2
  F.divisor = () => svg('0 0 360 210', L(50, 40, 50, 92, 'w') + bateria(50, 100, 'E') + L(50, 108, 50, 170, 'w') + L(50, 40, 120, 40, 'w') + caja(120, 28, 70, 24, 'R1') +
    L(190, 40, 230, 40, 'w') + punto(230, 40) + L(230, 40, 230, 72, 'w') + caja(218, 72, 24, 56, '') + T(206, 105, 'R2', { a: 'end' }) + L(230, 128, 230, 170, 'w') + punto(230, 170) + L(50, 170, 230, 170, 'w') +
    L(230, 40, 300, 40, 'w') + L(300, 40, 300, 83, 'w') + med(300, 100, 'V') + L(300, 117, 300, 170, 'w') + L(230, 170, 300, 170, 'w') + T(300, 196, 'voltímetro', { a: 'middle', c: 'pq' }), 210);

  // A3 y A4: formas de onda
  function onda(tipo) {
    const x0 = 40, x1 = 340, y0 = 110, A = 60, n = 120;
    let p = '';
    for (let i = 0; i <= n; i++) {
      const t = i / n * 2, x = x0 + (x1 - x0) * i / n; let v;
      if (tipo === 'media') v = Math.max(0, Math.sin(PI * t));
      else if (tipo === 'completa') v = Math.abs(Math.sin(PI * t));
      else if (tipo === 'cuadrada') v = (t % 1) < 0.5 ? 1 : -1;
      else { const f = t % 1; v = f < 0.25 ? 4 * f : f < 0.75 ? 2 - 4 * f : 4 * f - 4; }
      p += (i ? 'L' : 'M') + x.toFixed(1) + ',' + (y0 - A * v).toFixed(1);
    }
    const neg = tipo === 'cuadrada' || tipo === 'triangular';
    return svg('0 0 360 ' + (neg ? 200 : 140), L(x0, y0, x1 + 8, y0, 'eje') + L(x0, y0 - A - 15, x0, neg ? y0 + A + 12 : y0 + 8, 'eje') + T(x1 + 6, y0 + 18, 't', { a: 'end', c: 'it' }) +
      T(x0 + 8, y0 - A - 16, 'v', { c: 'it' }) + L(x0 - 5, y0 - A, x1, y0 - A, 'ref') + T(x0 - 8, y0 - A + 3, sb('V', 'p'), { a: 'end', c: 'it' }) +
      (neg ? L(x0 - 5, y0 + A, x1, y0 + A, 'ref') + T(x0 - 8, y0 + A + 3, '−' + sb('V', 'p'), { a: 'end', c: 'it' }) : '') +
      `<path d="${p}" class="onda"/>`, neg ? 200 : 140);
  }
  F.onda = (d) => onda(d.tipo);

  // A5: resistencia con voltímetro y amperímetro
  F.va = (d) => {
    let s = L(40, 50, 40, 92, 'w') + bateria(40, 100, '') + L(40, 108, 40, 170, 'w') + L(40, 50, 80, 50, 'w');
    if (d.caso === 'v') {
      s += med(97, 50, 'A') + L(114, 50, 200, 50, 'w') + punto(200, 50) + L(200, 50, 200, 82, 'w') + caja(188, 82, 24, 56, '') + T(176, 115, 'R', { a: 'end', c: 'it' }) + L(200, 138, 200, 170, 'w') + punto(200, 170) +
        L(200, 50, 290, 50, 'w') + L(290, 50, 290, 93, 'w') + med(290, 110, 'V') + L(290, 127, 290, 170, 'w') + L(40, 170, 290, 170, 'w') + T(245, 200, 'el voltímetro está conectado directo a R', { a: 'middle', c: 'pq' });
    } else {
      s += L(80, 50, 120, 50, 'w') + punto(120, 50) + L(120, 50, 165, 50, 'w') + med(182, 50, 'A') + L(199, 50, 240, 50, 'w') + L(240, 50, 240, 82, 'w') + caja(228, 82, 24, 56, '') + T(262, 115, 'R', { c: 'it' }) + L(240, 138, 240, 170, 'w') +
        L(120, 50, 120, 93, 'w') + med(120, 110, 'V') + L(120, 127, 120, 170, 'w') + punto(120, 170) + L(40, 170, 240, 170, 'w') + T(190, 200, 'el amperímetro está conectado directo a R', { a: 'middle', c: 'pq' });
    }
    return svg('0 0 360 210', s, 210);
  };

  // B2 y E3: dos vatímetros (conexión Aron)
  F.aron = () => svg('0 0 360 200', ['L1', 'L2', 'L3'].map((n, i) => T(18, 47 + i * 55, n, { a: 'middle', c: 'pq' })).join('') +
    L(34, 42, 110, 42, 'w') + caja(110, 30, 56, 24, 'W1') + L(166, 42, 290, 42, 'w') + L(34, 97, 290, 97, 'w') + L(34, 152, 110, 152, 'w') + caja(110, 140, 56, 24, 'W2') + L(166, 152, 290, 152, 'w') +
    L(138, 54, 138, 97, 'tr') + punto(138, 97) + L(138, 140, 138, 97, 'tr') + caja(290, 30, 54, 134, 'carga', { c: 'carga' }) + T(200, 125, 'bobinas de tensión', { a: 'middle', c: 'pq' }) + T(200, 140, 'a la línea 2', { a: 'middle', c: 'pq' }), 200);

  // C1 y E4: método de caída de potencial
  F.telur = (d) => {
    const x0 = 40, x1 = 330, xs = x0 + (x1 - x0) * 0.618;
    let s = L(15, 120, 345, 120, 'suelo') + `<rect x="${x0 - 4}" y="104" width="8" height="70" class="jab"/>` + T(x0 + 10, 112, 'E', { c: 'it' }) +
      `<rect x="${xs - 3}" y="108" width="6" height="32" class="pica"/>` + T(xs + 9, 112, 'S', { c: 'it' }) + `<rect x="${x1 - 3}" y="108" width="6" height="32" class="pica"/>` + T(x1 + 9, 112, 'H', { c: 'it' }) +
      caja(145, 18, 80, 30, 'telurómetro', { tc: 'pq' }) + `<path d="M145,33 Q${x0},36 ${x0},104" class="cab"/><path d="M185,48 Q${xs},60 ${xs},108" class="cab"/><path d="M225,33 Q${x1},36 ${x1},108" class="cab"/>`;
    s += flecha(x0 + 6, 158, x1 - 6, 158, 'cota') + flecha(x1 - 6, 158, x0 + 6, 158, 'cota') + T((x0 + x1) / 2, 176, d && d.D ? `${d.D} m` : 'D', { a: 'middle' });
    if (d && d.marcas) s += [-1, 1].map((k) => L(xs + k * 14, 112, xs + k * 14, 128, 'marca')).join('') + T(xs, 196, '1 m antes y 1 m después', { a: 'middle', c: 'pq' });
    else s += flecha(x0 + 6, 140, xs - 4, 140, 'cota') + T((x0 + xs) / 2, 136, 'x', { a: 'middle', c: 'it' });
    return svg('0 0 360 200', s, 200);
  };

  // D1: vatímetro en conexión A y B
  F.vatAB = () => {
    const una = (ox, et, A) => {
      let s = T(ox + 80, 16, 'Conexión ' + et, { a: 'middle', c: 'tt' }) + fuente(ox + 22, 95, '') + L(ox + 22, 79, ox + 22, 40, 'w') + L(ox + 22, 111, ox + 22, 160, 'w') +
        L(ox + 22, 40, ox + 60, 40, 'w') + caja(ox + 60, 30, 40, 20, '', { c: 'bc' }) + L(ox + 100, 40, ox + 140, 40, 'w') + caja(ox + 130, 75, 26, 50, '', { c: 'carga' }) + L(ox + 143, 40, ox + 143, 75, 'w') + L(ox + 143, 125, ox + 143, 160, 'w') + L(ox + 22, 160, ox + 143, 160, 'w');
      const xb = A ? ox + 48 : ox + 115;
      s += punto(xb, 40) + L(xb, 40, xb, 82, 'w') + caja(xb - 9, 82, 18, 40, '', { c: 'bt' }) + L(xb, 122, xb, 160, 'w') + punto(xb, 160);
      s += T(ox + 80, 66, 'corriente', { a: 'middle', c: 'pq' }) + T(xb + (A ? 14 : -14), 106, 'tensión', { a: A ? 'start' : 'end', c: 'pq' }) + T(ox + 143, 180, 'carga', { a: 'middle', c: 'pq' });
      return s;
    };
    return svg('0 0 360 190', una(0, 'A', true) + una(185, 'B', false), 190);
  };

  // E4: lecturas del telurómetro
  F.lecturas = (d) => {
    const xs = [70, 180, 290], vals = d.R, mn = Math.min(...vals), mx = Math.max(...vals), lo = mn - (mx - mn) * 0.6 - 0.5, hi = mx + (mx - mn) * 0.6 + 0.5;
    const y = (v) => 150 - (v - lo) / (hi - lo) * 110;
    let s = L(30, 160, 340, 160, 'eje') + L(30, 160, 30, 26, 'eje') + T(36, 22, 'R leída (Ω)', { c: 'pq' });
    s += `<polyline points="${xs.map((x, i) => x + ',' + y(vals[i]).toFixed(1)).join(' ')}" class="onda"/>`;
    xs.forEach((x, i) => { s += `<circle cx="${x}" cy="${y(vals[i]).toFixed(1)}" r="5" class="pt"/>` + T(x, y(vals[i]) - 10, ht(vals[i], 1), { a: 'middle' }) + T(x, 180, ['S − 1 m', 'S al 62 %', 'S + 1 m'][i], { a: 'middle', c: 'pq' }); });
    return svg('0 0 360 190', s, 190);
  };

  // ============================================================
  // PREGUNTAS
  // ============================================================
  const Q = [];
  const preg = (o) => { o.pts = o.items.reduce((a, it) => a + it.pts, 0); Q.push(o); };

  // ---------------------------------------------------------------- Parte A (20)
  preg({
    id: 'A1', parte: 'A', t: 'Ampliar la escala de un amperímetro',
    gen: (r) => ({ Im: elegir(r, [1, 2, 5, 10]), Rm: entre(r, 10, 100, 5), I: elegir(r, [1, 2, 5, 10, 20]) }),
    enun: (d) => `<p>Un miliamperímetro de cuadro móvil llega al final de su escala con ${M('I_m = ' + d.Im + u_('mA'))} y su bobina tiene ${M('R_m = ' + d.Rm + u_('Ω'))}. Se quiere usar en un tablero para medir hasta ${M('I = ' + d.I + u_('A'))}, conectándole una resistencia en paralelo (shunt).</p>`,
    fig: () => F.shunt(),
    items: [{ id: 'Rsh', et: 'Resistencia del shunt (mΩ)', pts: 3 }, { id: 'Psh', et: 'Potencia que disipa el shunt con la aguja al final de la escala (W)', pts: 1 }],
    esperado(d, u) {
      const Im = d.Im / 1000, Rsh = (Im * d.Rm) / (d.I - Im), Ru = usar(u, 'Rsh', Rsh * 1000) / 1000;
      return { Rsh: [Rsh * 1000], Psh: dos((d.I - Im) ** 2 * Ru, (d.I - Im) ** 2 * Rsh) };
    },
    sol(d) {
      const Im = d.Im / 1000, Rsh = (Im * d.Rm) / (d.I - Im);
      return [`I_{sh} = I - I_m = ${d.I} - ${nh(Im)} = ${tx(d.I - Im)}${u_('A')}`, `R_{sh} = \\dfrac{I_m\\cdot R_m}{I_{sh}} = \\dfrac{${nh(Im)}\\cdot ${d.Rm}}{${tx(d.I - Im)}} = ${tx(Rsh * 1000)}${u_('mΩ')}`,
        `P_{sh} = I_{sh}^2\\cdot R_{sh} = ${tx((d.I - Im) ** 2 * Rsh)}${u_('W')}`, '<p>El shunt va en paralelo con la bobina: los dos tienen la misma tensión. Su potencia sirve para elegir una resistencia que no se caliente.</p>'];
    }
  });

  preg({
    id: 'A2', parte: 'A', t: 'El voltímetro que cambia lo que mide',
    gen(r) {
      for (;;) {
        const Ig = elegir(r, [50, 100]), Rg = entre(r, 500, 2000, 100), Vf = elegir(r, [10, 20, 50]), R = elegir(r, [47, 68, 100, 150]), E = elegir(r, [12, 15, 18, 24, 30]);
        if (E / 2 > Vf * 0.95 || E / 2 < Vf * 0.2) continue;
        return { Ig, Rg, Vf, R, E };
      }
    },
    enun: (d) => `<p>Con un galvanómetro de ${M('I_g = ' + d.Ig + u_('µA'))} a fondo de escala y bobina de ${M('R_g = ' + d.Rg + u_('Ω'))} se arma un voltímetro de ${M(d.Vf + u_('V'))} a fondo de escala, con una resistencia en serie (multiplicadora).</p>
      <p>Después, con ese voltímetro se mide la tensión en ${M('R_2')} del circuito de la figura.</p>${datos([M('E = ' + d.E + u_('V')), M('R_1 = R_2 = ' + d.R + u_('kΩ'))])}`,
    fig: () => F.divisor(),
    items: [{ id: 'Rs', et: 'Resistencia multiplicadora (kΩ)', pts: 2 }, { id: 'Vl', et: 'Lo que marca el voltímetro en R₂ (V)', pts: 2 },
      { id: 'err', et: 'Error de la lectura respecto de la tensión que había sin el voltímetro (%)', pts: 1, tol: TOL_PCT }],
    rv: (d) => d.Vf / (d.Ig * 1e-6) / 1000,
    esperado(d, u) {
      const Rv = this.rv(d), Rp = (d.R * Rv) / (d.R + Rv), V = (d.E * Rp) / (d.R + Rp), V0 = d.E / 2, e = ((V - V0) / V0) * 100;
      const Vu = usar(u, 'Vl', V), eu = ((Vu - V0) / V0) * 100;
      return { Rs: [Rv - d.Rg / 1000], Vl: [V], err: [...dos(eu, e), Math.abs(eu), Math.abs(e)] };
    },
    sol(d) {
      const Rv = this.rv(d), Rp = (d.R * Rv) / (d.R + Rv), V = (d.E * Rp) / (d.R + Rp), V0 = d.E / 2;
      return [`R_V = \\dfrac{V_{fe}}{I_g} = \\dfrac{${d.Vf}}{${d.Ig}\\cdot 10^{-6}} = ${tx(Rv)}${u_('kΩ')}`, `R_s = R_V - R_g = ${tx(Rv)} - ${nh(d.Rg / 1000)} = ${tx(Rv - d.Rg / 1000)}${u_('kΩ')}`,
        `R_2 \\parallel R_V = \\dfrac{${d.R}\\cdot ${tx(Rv)}}{${d.R} + ${tx(Rv)}} = ${tx(Rp)}${u_('kΩ')}`, `V = E\\cdot\\dfrac{R_2 \\parallel R_V}{R_1 + R_2 \\parallel R_V} = ${tx(V)}${u_('V')}`,
        `\\text{Sin voltímetro: } V_0 = \\dfrac{E}{2} = ${tx(V0)}${u_('V')}`,
        `\\text{error} = \\dfrac{V - V_0}{V_0} = ${tx(((V - V0) / V0) * 100, 1)}\\ \\%`,
        '<p>El voltímetro se pone en paralelo con R₂ y baja la resistencia de ese tramo: marca menos de lo que había. Cuanto mayor es su resistencia (sus Ω/V), menos carga el circuito.</p>'];
    }
  });

  preg({
    id: 'A3', parte: 'A', t: 'Valor medio y valor eficaz',
    gen: (r) => ({ tipo: elegir(r, ['media', 'completa']), Vp: entre(r, 12, 36, 1) }),
    enun: (d) => `<p>La salida de un rectificador de ${d.tipo === 'media' ? '<b>media onda</b>' : '<b>onda completa</b>'}, sin filtro, es la señal de la figura, con un valor de pico ${M('V_p = ' + d.Vp + u_('V'))}.</p>
      <p>¿Cuál es su valor medio (lo que marca un voltímetro de continua) y su valor eficaz (el de toda la señal)?</p>`,
    fig: (d) => F.onda(d),
    items: [{ id: 'Vm', et: 'Valor medio (V)', pts: 2 }, { id: 'Ve', et: 'Valor eficaz (V)', pts: 2 }],
    esperado: (d) => (d.tipo === 'media' ? { Vm: [d.Vp / PI], Ve: [d.Vp / 2] } : { Vm: [(2 * d.Vp) / PI], Ve: [d.Vp / Math.SQRT2] }),
    sol: (d) => (d.tipo === 'media'
      ? [`V_{med} = \\dfrac{V_p}{\\pi} = \\dfrac{${d.Vp}}{\\pi} = ${tx(d.Vp / PI)}${u_('V')}`, `V_{ef} = \\dfrac{V_p}{2} = ${tx(d.Vp / 2)}${u_('V')}`, '<p>En media onda, el semiciclo negativo vale cero: el promedio es la mitad del de onda completa, y la potencia (el cuadrado) también es la mitad.</p>']
      : [`V_{med} = \\dfrac{2\\cdot V_p}{\\pi} = ${tx((2 * d.Vp) / PI)}${u_('V')}`, `V_{ef} = \\dfrac{V_p}{\\sqrt{2}} = ${tx(d.Vp / Math.SQRT2)}${u_('V')}`, '<p>En onda completa los dos semiciclos son positivos: el valor eficaz es el mismo de la senoidal original.</p>'])
  });

  preg({
    id: 'A4', parte: 'A', t: 'El multímetro que no es «true RMS»',
    gen: (r) => ({ tipo: elegir(r, ['cuadrada', 'triangular']), Vp: entre(r, 4, 20, 1) }),
    enun: (d) => `<p>Un multímetro económico (que <b>no</b> es true RMS) mide el valor medio de la señal rectificada y lo multiplica por ${M('1{,}11')}, el factor de forma de una senoidal. Con él se mide una señal <b>${d.tipo}</b> simétrica de ${M('\\pm ' + d.Vp + u_('V'))} y 50 Hz.</p>`,
    fig: (d) => F.onda(d),
    items: [{ id: 'Vl', et: 'Lo que marca el multímetro económico (V)', pts: 2 }, { id: 'op', et: '¿Qué marca un multímetro true RMS?', pts: 1, tipo: 'op' }],
    vals: (d) => (d.tipo === 'cuadrada' ? { med: d.Vp, ef: d.Vp, otros: [d.Vp / Math.SQRT2, (2 * d.Vp) / PI] } : { med: d.Vp / 2, ef: d.Vp / R3, otros: [d.Vp / Math.SQRT2, d.Vp / 2] }),
    ops(d) { const v = this.vals(d); return ops([v.ef, 1.11 * v.med, ...v.otros].map((x) => ht(x, 2) + ' V')); },
    esperado(d) { return { Vl: [1.11 * this.vals(d).med], op: 0 }; },
    sol(d) {
      const v = this.vals(d);
      return d.tipo === 'cuadrada'
        ? [`\\text{Valor medio rectificado} = V_p = ${d.Vp}${u_('V')}`, `\\text{Marca el económico: } 1{,}11\\cdot ${d.Vp} = ${tx(1.11 * v.med)}${u_('V')}`, `\\text{Valor eficaz real: } V_{ef} = V_p = ${d.Vp}${u_('V')}`, '<p>Con una onda cuadrada el multímetro económico marca 11 % de más: su factor 1,11 solo vale para la senoidal.</p>']
        : [`\\text{Valor medio rectificado} = \\dfrac{V_p}{2} = ${tx(v.med)}${u_('V')}`, `\\text{Marca el económico: } 1{,}11\\cdot ${tx(v.med)} = ${tx(1.11 * v.med)}${u_('V')}`, `\\text{Valor eficaz real: } V_{ef} = \\dfrac{V_p}{\\sqrt{3}} = ${tx(v.ef)}${u_('V')}`, '<p>Con una onda triangular el multímetro económico marca casi 4 % de menos. El true RMS mide el valor eficaz de cualquier forma de onda.</p>'];
    }
  });

  preg({
    id: 'A5', parte: 'A', t: 'Resistencia con voltímetro y amperímetro',
    gen(r) {
      const caso = elegir(r, ['v', 'a']), Ra = elegir(r, [0.5, 1, 2]), Rv = elegir(r, [100, 200, 500]);
      if (caso === 'v') {
        const R = elegir(r, [2.2, 4.7, 10, 22]), V = elegir(r, [10, 12, 15]), I = Math.round((V / R + V / Rv) * 1000) / 1000;
        return { caso, Ra, Rv, R, V, I, uR: 'kΩ', uI: 'mA' };
      }
      const R = elegir(r, [4.7, 10, 22]), I = elegir(r, [0.2, 0.25, 0.5]), V = Math.round(I * (R + Ra) * 1000) / 1000;
      return { caso, Ra, Rv, R, V, I, uR: 'Ω', uI: 'A' };
    },
    enun: (d) => `<p>Se mide una resistencia con un voltímetro y un amperímetro conectados como en la figura.</p>${datos([`Voltímetro: ${M('V = ' + nh(d.V) + u_('V'))}; su resistencia interna es ${M('R_V = ' + d.Rv + u_('kΩ'))}`,
      `Amperímetro: ${M('I = ' + nh(d.I) + u_(d.uI))}; su resistencia interna es ${M('R_A = ' + nh(d.Ra) + u_('Ω'))}`])}`,
    fig: (d) => F.va(d),
    items: [{ id: 'Rap', et: (d) => `Resistencia que da el cociente V/I (${d && d.uR ? d.uR : 'kΩ o Ω'})`, pts: 1 }, { id: 'Rre', et: (d) => `Resistencia verdadera, corregida por el instrumento (${d && d.uR ? d.uR : 'kΩ o Ω'})`, pts: 2 },
      { id: 'op', et: '¿Con qué conexión el error habría sido menor para esta resistencia?', pts: 1, tipo: 'op' }],
    calc(d) {
      if (d.caso === 'v') { const Rap = d.V / d.I, Rre = d.V / (d.I - d.V / d.Rv); return { Rap, Rre }; }
      const Rap = d.V / d.I; return { Rap, Rre: Rap - d.Ra };
    },
    mejor(d) { const Rohm = d.caso === 'v' ? d.R * 1000 : d.R, eV = Rohm / (Rohm + d.Rv * 1000), eA = d.Ra / Rohm; return eA < eV ? 'a' : 'v'; },
    ops(d) {
      const A = 'Con el amperímetro conectado directo a la resistencia', V = 'Con el voltímetro conectado directo a la resistencia';
      return ops([...(this.mejor(d) === 'a' ? [A, V] : [V, A]), 'Las dos conexiones dan el mismo error', 'Depende de la tensión de la fuente']);
    },
    esperado(d, u) { const c = this.calc(d), Rapu = usar(u, 'Rap', c.Rap); return { Rap: [c.Rap], Rre: dos(d.caso === 'v' ? d.V / (d.I - d.V / d.Rv) : Rapu - d.Ra, c.Rre), op: 0 }; },
    sol(d) {
      const c = this.calc(d), m = this.mejor(d) === 'a' ? 'con el amperímetro conectado directo a la resistencia' : 'con el voltímetro conectado directo a la resistencia';
      return d.caso === 'v'
        ? [`\\dfrac{V}{I} = \\dfrac{${nh(d.V)}}{${nh(d.I)}} = ${tx(c.Rap)}${u_('kΩ')}`, `I_V = \\dfrac{V}{R_V} = \\dfrac{${nh(d.V)}}{${d.Rv}} = ${tx(d.V / d.Rv)}${u_('mA')}`,
          `R = \\dfrac{V}{I - I_V} = \\dfrac{${nh(d.V)}}{${nh(d.I)} - ${tx(d.V / d.Rv)}} = ${tx(c.Rre)}${u_('kΩ')}`, `<p>El amperímetro también mide la corriente que se va por el voltímetro: V/I sale menor que R. Para esta resistencia, el error es menor ${m}.</p>`]
        : [`\\dfrac{V}{I} = \\dfrac{${nh(d.V)}}{${nh(d.I)}} = ${tx(c.Rap)}${u_('Ω')}`, `R = \\dfrac{V}{I} - R_A = ${tx(c.Rap)} - ${nh(d.Ra)} = ${tx(c.Rre)}${u_('Ω')}`,
          `<p>El voltímetro también mide la caída en el amperímetro: V/I sale mayor que R. Para esta resistencia, el error es menor ${m}.</p>`];
    }
  });

  // ---------------------------------------------------------------- Parte B (35)
  const USO_B1 = ['una bomba de agua potable', 'un compresor de aire', 'la mezcladora de una planta de hormigón', 'un ventilador industrial', 'la cinta transportadora de una mina', 'el molino de una planta de alimentos'];
  preg({
    id: 'B1', parte: 'B', t: 'Un motor trifásico con tres instrumentos',
    gen(r) { const I = entre(r, 12, 60, 1), fp = entre(r, 0.68, 0.86, 0.01), P = Math.round((R3 * 380 * I * fp) / 100) / 10; return { uso: elegir(r, USO_B1), I, P }; },
    enun: (d) => `<p>El motor trifásico de ${d.uso} se mide con un voltímetro (tensión de línea), un amperímetro (corriente de línea) y un vatímetro trifásico.</p>
      ${datos([M('V_L = 380' + u_('V')), M('I_L = ' + nh(d.I) + u_('A')), M('P = ' + nh(d.P) + u_('kW'))])}<p>Al final: si se corrige el FP a ${M('0{,}95')} sin cambiar la potencia activa, ¿qué corriente toma el motor de la red?</p>`,
    items: [{ id: 'S', et: 'Potencia aparente S (kVA)', pts: 2 }, { id: 'fp', et: 'Factor de potencia', pts: 2, tol: TOL_FP }, { id: 'Q', et: 'Potencia reactiva Q (kVAR)', pts: 2 }, { id: 'I2', et: 'Corriente con FP 0,95 (A)', pts: 2 }],
    esperado(d, u) {
      const S = (R3 * 380 * d.I) / 1000, Su = usar(u, 'S', S);
      return { S: [S], fp: dos(d.P / Su, d.P / S), Q: dos(Math.sqrt(Math.max(0, Su * Su - d.P * d.P)), Math.sqrt(S * S - d.P * d.P)), I2: [(d.P * 1000) / (R3 * 380 * 0.95)] };
    },
    sol(d) {
      const S = (R3 * 380 * d.I) / 1000, fp = d.P / S;
      return [`S = \\sqrt{3}\\cdot V_L\\cdot I_L = \\sqrt{3}\\cdot 380\\cdot ${nh(d.I)} = ${tx(S)}${u_('kVA')}`, `\\text{FP} = \\dfrac{P}{S} = \\dfrac{${nh(d.P)}}{${tx(S)}} = ${tx(fp, 3)}`, `Q = \\sqrt{S^2 - P^2} = ${tx(Math.sqrt(S * S - d.P * d.P))}${u_('kVAR')}`,
        `I_2 = \\dfrac{P}{\\sqrt{3}\\cdot V_L\\cdot 0{,}95} = \\dfrac{${tx(d.P * 1000)}}{\\sqrt{3}\\cdot 380\\cdot 0{,}95} = ${tx((d.P * 1000) / (R3 * 380 * 0.95))}${u_('A')}`];
    }
  });

  const OP_B2 = [
    { q: 'Con otra carga, uno de los dos vatímetros marca cero. ¿Cuál es el FP de esa carga?', o: ['0,5', '0', '1', '0,866'] },
    { q: 'Con otra carga, los dos vatímetros marcan lo mismo. ¿Cuál es el FP de esa carga?', o: ['1', '0,5', '0', '0,707'] }
  ];
  preg({
    id: 'B2', parte: 'B', t: 'Dos vatímetros',
    gen(r) {
      for (;;) {
        const Pt = entre(r, 8, 30, 0.5), fp = entre(r, 0.6, 0.95, 0.01), Qv = Pt * Math.tan(acosS(fp));
        const W1 = Math.round(((Pt - Qv / R3) / 2) * 100) / 100, W2 = Math.round(((Pt + Qv / R3) / 2) * 100) / 100;
        if (W1 < 0.4) continue;
        return { W1, W2, v: Math.floor(r() * OP_B2.length) };
      }
    },
    enun: (d) => `<p>Una carga trifásica equilibrada e inductiva, alimentada con ${M('V_L = 380' + u_('V'))}, se mide con el método de los dos vatímetros.</p>${datos([M('W_1 = ' + nh(d.W1) + u_('kW')), M('W_2 = ' + nh(d.W2) + u_('kW'))])}`,
    fig: () => F.aron(),
    items: [{ id: 'P', et: 'Potencia activa P (kW)', pts: 2 }, { id: 'Q', et: 'Potencia reactiva Q (kVAR)', pts: 2 }, { id: 'fp', et: 'Factor de potencia', pts: 2, tol: TOL_FP }, { id: 'I', et: 'Corriente de línea (A)', pts: 2 },
      { id: 'op', et: (d) => OP_B2[(d && d.v) || 0].q, pts: 1, tipo: 'op' }],
    ops: (d) => ops(OP_B2[d.v].o),
    esperado(d, u) {
      const P = d.W1 + d.W2, Qv = R3 * (d.W2 - d.W1), Pu = usar(u, 'P', P), Qu = usar(u, 'Q', Qv);
      const fp = P / Math.hypot(P, Qv), I = (Math.hypot(P, Qv) * 1000) / (R3 * 380);
      return { P: [P], Q: [Qv], fp: dos(Pu / Math.hypot(Pu, Qu), fp), I: dos((Math.hypot(Pu, Qu) * 1000) / (R3 * 380), I), op: 0 };
    },
    sol(d) {
      const P = d.W1 + d.W2, Qv = R3 * (d.W2 - d.W1), S = Math.hypot(P, Qv);
      return [`P = W_1 + W_2 = ${tx(P)}${u_('kW')}`, `Q = \\sqrt{3}\\cdot (W_2 - W_1) = ${tx(Qv)}${u_('kVAR')}`, `\\text{FP} = \\dfrac{P}{\\sqrt{P^2 + Q^2}} = ${tx(P / S, 3)}`,
        `I = \\dfrac{S}{\\sqrt{3}\\cdot V_L} = \\dfrac{${tx(S * 1000)}}{\\sqrt{3}\\cdot 380} = ${tx((S * 1000) / (R3 * 380))}${u_('A')}`];
    }
  });

  const USO_B3 = ['un hotel', 'una planta embotelladora', 'un supermercado', 'un taller de carpintería', 'una planta de alimentos balanceados'];
  preg({
    id: 'B3', parte: 'B', t: 'Corrección del FP con banco por pasos',
    gen(r) {
      for (;;) {
        const P = entre(r, 40, 200, 5), fp1 = entre(r, 0.62, 0.84, 0.01), Qp = elegir(r, [5, 10, 12.5, 15, 20]);
        const Qc = P * (Math.tan(acosS(fp1)) - Math.tan(acosS(0.95))), x = Qc / Qp, fr = x - Math.floor(x), n = Math.ceil(x);
        if (fr < 0.12 || fr > 0.88 || n < 2 || n > 15) continue;
        return { uso: elegir(r, USO_B3), P, fp1, Qp };
      }
    },
    enun: (d) => `<p>La instalación trifásica de ${d.uso}, a ${M('380' + u_('V'))} y ${M('50' + u_('Hz'))}, quiere llevar su FP a ${M('0{,}95')} con un banco automático de capacitores en triángulo, armado con pasos iguales.</p>
      ${datos([M('P = ' + nh(d.P) + u_('kW')), M('\\text{FP}_1 = ' + nh(d.fp1)), `Cada paso: ${M(nh(d.Qp) + u_('kVAR'))}`])}<p>Se instala el menor número de pasos que alcance el FP deseado. Los µF y la corriente son del <b>banco instalado</b> (todos sus pasos).</p>`,
    items: [{ id: 'Qc', et: 'Potencia reactiva necesaria Qc (kVAR)', pts: 3 }, { id: 'n', et: 'Número de pasos instalados', pts: 2, tol: TOL_ENT }, { id: 'C', et: 'Capacidad por fase en triángulo (µF)', pts: 3 }, { id: 'Ic', et: 'Corriente de línea del banco (A)', pts: 2 }],
    calc: (d, n) => { const Qb = n * d.Qp * 1000; return { C: (Qb / (3 * 2 * PI * 50 * 380 * 380)) * 1e6, Ic: Qb / (R3 * 380) }; },
    esperado(d, u) {
      const Qc = d.P * (Math.tan(acosS(d.fp1)) - Math.tan(acosS(0.95))), n = Math.ceil(Qc / d.Qp), Qcu = usar(u, 'Qc', Qc), nP = Math.ceil(Qcu / d.Qp - 1e-9);
      const nu = usar(u, 'n', n), ok = nu > 0 && nu < 100, a = this.calc(d, n), b = ok ? this.calc(d, nu) : { C: NaN, Ic: NaN };
      return { Qc: [Qc], n: dos(nP, n), C: dos(b.C, a.C), Ic: dos(b.Ic, a.Ic) };
    },
    sol(d) {
      const Qc = d.P * (Math.tan(acosS(d.fp1)) - Math.tan(acosS(0.95))), n = Math.ceil(Qc / d.Qp), c = this.calc(d, n);
      return [`Q_c = P\\cdot(\\tan\\varphi_1 - \\tan\\varphi_2) = ${nh(d.P)}\\cdot(${tx(Math.tan(acosS(d.fp1)), 3)} - ${tx(Math.tan(acosS(0.95)), 3)}) = ${tx(Qc)}${u_('kVAR')}`,
        `n = \\dfrac{${tx(Qc)}}{${nh(d.Qp)}} = ${tx(Qc / d.Qp, 2)} \\to ${n}\\ \\text{pasos} = ${tx(n * d.Qp)}${u_('kVAR')}`,
        `C_\\Delta = \\dfrac{Q}{3\\cdot\\omega\\cdot V_L^2} = \\dfrac{${tx(n * d.Qp * 1000)}}{3\\cdot 314{,}16\\cdot 380^2} = ${tx(c.C)}${u_('µF')}`, `I_c = \\dfrac{Q}{\\sqrt{3}\\cdot V_L} = ${tx(c.Ic)}${u_('A')}`];
    }
  });

  preg({
    id: 'B4', parte: 'B', t: 'La factura del mes',
    gen(r) {
      const kWh = entre(r, 8000, 40000, 500), fpf = entre(r, 0.68, 0.82, 0.01), kVARh = Math.round((kWh * Math.tan(acosS(fpf))) / 10) * 10;
      const cargo = Math.round((kWh * elegir(r, [0.55, 0.6, 0.65, 0.7, 0.75])) / 10) * 10;
      return { kWh, kVARh, cargo };
    },
    enun: (d) => `<p>Factura del mes de una industria. La distribuidora cobra un recargo cuando el FP del mes es menor que ${M('0{,}85')} (la regla vista en clase).</p>
      ${datos([`Energía activa: ${M(d.kWh + u_('kWh'))}`, `Energía reactiva: ${M(d.kVARh + u_('kVARh'))}`, `Cargo por energía: ${M(d.cargo + u_('Bs'))}`])}`,
    items: [{ id: 'fp', et: 'FP del mes', pts: 2, tol: TOL_FP }, { id: 'rec', et: 'Recargo (Bs)', pts: 3 }, { id: 'red', et: 'kVARh que habría que dejar de consumir en el mes para no pagar recargo', pts: 3 }],
    esperado(d, u) {
      const fp = d.kWh / Math.hypot(d.kWh, d.kVARh), fpu = usar(u, 'fp', fp), rec = (x) => (x > 0 && x < 0.85 ? d.cargo * (0.85 / x - 1) : 0);
      return { fp: [fp], rec: dos(rec(fpu), rec(fp)), red: [d.kVARh - d.kWh * Math.tan(acosS(0.85))] };
    },
    sol(d) {
      const fp = d.kWh / Math.hypot(d.kWh, d.kVARh), qmax = d.kWh * Math.tan(acosS(0.85));
      return [`\\text{FP} = \\dfrac{\\text{kWh}}{\\sqrt{\\text{kWh}^2 + \\text{kVARh}^2}} = ${tx(fp, 3)}`, `\\text{Recargo} = ${d.cargo}\\cdot\\left(\\dfrac{0{,}85}{${tx(fp, 3)}} - 1\\right) = ${tx(d.cargo * (0.85 / fp - 1), 1)}${u_('Bs')}`,
        `\\text{kVARh}_{\\text{máx}} = \\text{kWh}\\cdot\\tan(\\arccos 0{,}85) = ${tx(qmax)}`, `\\text{A reducir: } ${d.kVARh} - ${tx(qmax)} = ${tx(d.kVARh - qmax)}\\ \\text{kVARh}`];
    }
  });

  // ---------------------------------------------------------------- Parte C (10)
  preg({
    id: 'C1', parte: 'C', t: 'La jabalina de una bomba',
    gen: (r) => ({ rho: entre(r, 40, 300, 10), L: elegir(r, [1.5, 2.4, 3]), D: elegir(r, [20, 25, 30, 40]), RB: elegir(r, [5, 8, 10]) }),
    enun: (d) => `<p>La carcasa de una bomba (220 V) se conecta a una jabalina de cobre clavada en un suelo parejo.</p>
      ${datos([`Resistividad del suelo: ${M('\\rho = ' + d.rho + u_('Ω·m'))}`, `Jabalina: ${M('L = ' + nh(d.L) + u_('m'))}; radio ${M('a = 8' + u_('mm'))}`, `Puesta a tierra del neutro en el transformador: ${M('R_B = ' + d.RB + u_('Ω'))}`])}
      <p>La jabalina se mide con el método de caída de potencial, con la pica de corriente H a ${M(d.D + u_('m'))}. Después, la fase toca la carcasa de la bomba.</p>`,
    fig: (d) => F.telur({ D: d.D }),
    items: [{ id: 'R', et: 'Resistencia de la jabalina (Ω)', pts: 3 }, { id: 'x', et: 'Distancia de la pica S a la jabalina, x (m)', pts: 2 }, { id: 'op', et: '¿Cumple con los 25 Ω que se exigen?', pts: 1, tipo: 'op' },
      { id: 'If', et: 'Corriente de falla (A)', pts: 2 }, { id: 'Vc', et: 'Tensión de la carcasa respecto de la tierra lejana (V)', pts: 2 }],
    ops: (d) => { const si = 'Sí: es menor que 25 Ω', no = 'No: es mayor que 25 Ω; hay que agregar jabalinas o mejorar el suelo'; return ops([...(dwight(d.rho, d.L) <= 25 ? [si, no] : [no, si]), 'No se puede saber sin medirla en época de lluvias']); },
    esperado(d, u) {
      const R = dwight(d.rho, d.L), Ru = usar(u, 'R', R), If = 220 / (R + d.RB), Ifu = 220 / (Ru + d.RB);
      return { R: [R], x: [0.618 * d.D, 0.62 * d.D], op: 0, If: dos(Ifu, If), Vc: dos(usar(u, 'If', Ifu) * Ru, If * R) };
    },
    sol(d) {
      const R = dwight(d.rho, d.L), If = 220 / (R + d.RB);
      return [`R = \\dfrac{\\rho}{2\\pi L}\\left(\\ln\\dfrac{4L}{a} - 1\\right) = \\dfrac{${d.rho}}{2\\pi\\cdot ${nh(d.L)}}\\left(\\ln\\dfrac{4\\cdot ${nh(d.L)}}{0{,}008} - 1\\right) = ${tx(R)}${u_('Ω')}`,
        `x = 0{,}618\\cdot D = 0{,}618\\cdot ${d.D} = ${tx(0.618 * d.D)}${u_('m')}`, `I_f = \\dfrac{220}{R + R_B} = \\dfrac{220}{${tx(R)} + ${d.RB}} = ${tx(If)}${u_('A')}`, `V_c = I_f\\cdot R = ${tx(If * R)}${u_('V')}`,
        '<p>La carcasa queda a una tensión peligrosa y esa corriente no alcanza para que salte un disyuntor común: por eso hace falta un interruptor diferencial.</p>'];
    }
  });

  // ---------------------------------------------------------------- Parte D (15)
  const CARGAS_D1 = [{ n: 'una lámpara incandescente de 100 W', P: 100, fp: 1 }, { n: 'un motor de 4 kW con FP 0,8', P: 4000, fp: 0.8 }, { n: 'un horno eléctrico de 2 kW', P: 2000, fp: 1 }, { n: 'un cargador de 60 W con FP 1', P: 60, fp: 1 }, { n: 'una bomba de 1,5 kW con FP 0,75', P: 1500, fp: 0.75 }];
  preg({
    id: 'D1', parte: 'D', t: 'Dónde va la bobina de tensión del vatímetro',
    gen(r) {
      for (;;) {
        const d = { Rc: elegir(r, [0.02, 0.05, 0.1]), Rp: elegir(r, [5, 8, 10]), c: Math.floor(r() * CARGAS_D1.length) }, c = CARGAS_D1[d.c], I = c.P / (220 * c.fp), eA = I * I * d.Rc, eB = (220 * 220) / (d.Rp * 1000);
        if (Math.max(eA, eB) / Math.min(eA, eB) >= 1.5) return d;
      }
    },
    enun: (d) => { const c = CARGAS_D1[d.c]; return `<p>Con un vatímetro se mide la potencia de ${c.n}, a ${M('220' + u_('V'))}. La figura muestra las dos formas de conectarlo.</p>${datos([`Bobina de corriente: ${M('R_c = ' + nh(d.Rc) + u_('Ω'))}`, `Bobina de tensión: ${M('R_p = ' + d.Rp + u_('kΩ'))}`])}<p>¿Cuántos vatios de más marca el vatímetro en cada conexión?</p>`; },
    fig: () => F.vatAB(),
    items: [{ id: 'eA', et: 'Error con la conexión A (W)', pts: 2 }, { id: 'eB', et: 'Error con la conexión B (W)', pts: 2 }, { id: 'op', et: '¿Qué conexión conviene para esta carga?', pts: 1, tipo: 'op' }],
    calc(d) { const c = CARGAS_D1[d.c], I = c.P / (220 * c.fp); return { I, eA: I * I * d.Rc, eB: (220 * 220) / (d.Rp * 1000) }; },
    ops(d) { const k = this.calc(d), A = 'La A (bobina de tensión del lado de la fuente)', B = 'La B (bobina de tensión del lado de la carga)'; return ops([...(k.eA < k.eB ? [A, B] : [B, A]), 'Da lo mismo: el error no depende de la conexión']); },
    esperado(d) { const k = this.calc(d); return { eA: [k.eA], eB: [k.eB], op: 0 }; },
    sol(d) {
      const k = this.calc(d), A = k.eA < k.eB;
      return [`I = \\dfrac{P}{V\\cdot\\text{FP}} = ${tx(k.I)}${u_('A')}`, `\\text{A: el vatímetro suma } I^2\\cdot R_c = ${tx(k.eA)}${u_('W')}`, `\\text{B: el vatímetro suma } \\dfrac{V^2}{R_p} = \\dfrac{220^2}{${d.Rp * 1000}} = ${tx(k.eB)}${u_('W')}`,
        `<p>Conviene la conexión ${A ? 'A' : 'B'}, la que suma menos. ${A ? 'Con poca corriente, lo que se pierde en la bobina de corriente es casi nada.' : 'Con mucha corriente, la bobina de corriente sumaría más que la de tensión.'}</p>`];
    }
  });


  const PROC = [
    { t: 'Medir la resistencia de una puesta a tierra con el telurómetro', pasos: ['Desconectar el conductor de tierra de la instalación, para medir la jabalina sola', 'Clavar la pica de corriente H lejos de la jabalina (varias veces su largo)',
      'Clavar la pica de tensión S en línea con E y H, al 62 % de la distancia', 'Conectar los cables E, S y H al telurómetro', 'Medir y anotar la lectura', 'Mover S un metro hacia adelante y hacia atrás y comparar las lecturas', 'Volver a conectar el conductor de tierra'],
      alt: [[0, 2, 1, 3, 4, 5, 6]] },
    { t: 'Medir la corriente de un motor con un amperímetro en serie', pasos: ['Bajar el disyuntor y comprobar que no hay tensión', 'Poner el multímetro en corriente alterna, en la escala más alta, con la punta roja en el borne de corriente',
      'Abrir el circuito en el punto donde se va a medir', 'Conectar el amperímetro en serie con el motor', 'Subir el disyuntor, arrancar el motor y leer', 'Bajar el disyuntor, retirar el amperímetro y volver a cerrar el circuito'],
      alt: [[0, 2, 1, 3, 4, 5], [1, 0, 2, 3, 4, 5]] }
  ];
  preg({
    id: 'D2', parte: 'D', t: 'El procedimiento en orden',
    gen: (r) => ({ p: Math.floor(r() * PROC.length) }),
    enun: (d) => `<p>Ordena los pasos para <b>${PROC[d.p].t.charAt(0).toLowerCase() + PROC[d.p].t.slice(1)}</b>. Usa las flechas para subir o bajar cada paso.</p>`,
    items: [{ id: 'ord', et: 'Orden de los pasos', pts: 6, tipo: 'ord' }],
    pasos: (d) => PROC[d.p].pasos,
    aceptados: (d) => [PROC[d.p].pasos.map((_, i) => i), ...PROC[d.p].alt],
    esperado: () => ({}),
    sol: (d) => ['<ol class="sm-ol">' + PROC[d.p].pasos.map((p) => '<li>' + p + '</li>').join('') + '</ol>',
      d.p === 0 ? '<p>La jabalina se mide sola (si no, se mide en paralelo con otras tierras), se comprueba moviendo S y al final se reconecta: la instalación no puede quedar sin tierra.</p>'
        : '<p>Se conecta sin tensión, en serie y empezando por la escala más alta; al final se cierra el circuito otra vez.</p>']
  });

  const MAL_USO = [
    { s: 'Para medir la tensión de un tomacorriente, alguien deja la punta roja en el borne de corriente (10 A) del multímetro.', o: ['Cortocircuito a través del multímetro: se funde su fusible y puede saltar el disyuntor', 'Marca la tensión del tomacorriente', 'Marca cero y no pasa nada', 'Marca la corriente que consume la casa'] },
    { s: 'Para medir la corriente de un motor, se abraza con la pinza el cable entero (fase y neutro juntos).', o: ['Marca casi 0 A: las dos corrientes son iguales y opuestas', 'Marca la corriente del motor', 'Marca el doble de la corriente del motor', 'Marca la tensión de la red'] },
    { s: 'Se mide con el óhmetro una resistencia de una placa que sigue enchufada a la red.', o: ['La lectura no sirve y el multímetro puede dañarse: el óhmetro mide con su propia corriente', 'Marca bien: el óhmetro se protege solo', 'Marca el doble del valor real', 'Marca la tensión de la red'] },
    { s: 'Un voltímetro se conecta en serie con una lámpara de 220 V.', o: ['La lámpara no enciende y el voltímetro marca casi 220 V', 'La lámpara enciende normal y el voltímetro marca su tensión', 'Se funde el fusible del voltímetro', 'El voltímetro marca cero'] },
    { s: 'Un amperímetro se conecta en paralelo con una lámpara encendida.', o: ['Cortocircuito: pasa una corriente muy grande por el amperímetro y se funde su fusible', 'Marca la corriente de la lámpara', 'La lámpara brilla más', 'Marca cero y no pasa nada'] },
    { s: 'La bobina de corriente de un vatímetro se conecta en paralelo con la red, como si fuera la de tensión.', o: ['La bobina de corriente (pocos miliohmios) es casi un cortocircuito: se quema', 'Marca la potencia de la red', 'Marca cero porque no hay carga', 'Marca negativo y no pasa nada'] }
  ];
  preg({
    id: 'D3', parte: 'D', t: 'El instrumento mal usado',
    gen(r) { const a = Math.floor(r() * MAL_USO.length); let b = Math.floor(r() * (MAL_USO.length - 1)); if (b >= a) b++; return { s: [a, b] }; },
    enun: () => '<p>Dos situaciones de taller. ¿Qué pasa en cada una?</p>',
    items: [{ id: 'a', et: (d) => (d ? MAL_USO[d.s[0]].s : 'Situación 1'), pts: 2, tipo: 'op' }, { id: 'b', et: (d) => (d ? MAL_USO[d.s[1]].s : 'Situación 2'), pts: 2, tipo: 'op' }],
    ops: (d, id) => ops(MAL_USO[d.s[id === 'a' ? 0 : 1]].o),
    esperado: () => ({ a: 0, b: 0 }),
    sol: (d) => d.s.map((k) => '<p><b>' + MAL_USO[k].s + '</b> ' + MAL_USO[k].o[0] + '.</p>')
  });

  // ---------------------------------------------------------------- Parte E (20): interpretación
  const LUG_E1 = ['un laboratorio de computadoras', 'una oficina con muchas impresoras y computadoras', 'un taller con cargadores de baterías', 'una sala con luminarias LED y fuentes conmutadas'];
  preg({
    id: 'E1', parte: 'E', t: '¿Le creo al cosfímetro?',
    gen(r) {
      const V = elegir(r, [220, 230]), cos = entre(r, 0.95, 0.99, 0.01), thd = entre(r, 50, 110, 5), I = entre(r, 10, 30, 0.5);
      const P = Math.round((V * I * (cos / Math.sqrt(1 + (thd / 100) ** 2))) / 10) * 10;
      return { lug: elegir(r, LUG_E1), V, cos, I, P };
    },
    enun: (d) => `<p>En la alimentación monofásica de ${d.lug} se mide con instrumentos true RMS:</p>${datos([`Voltímetro: ${M(d.V + u_('V'))}`, `Amperímetro: ${M(nh(d.I) + u_('A'))}`, `Vatímetro: ${M(d.P + u_('W'))}`, `Cosfímetro: ${M(nh(d.cos))}`])}
      <p>El encargado dice: «el FP es ${ht(d.cos)}, está muy bien». ¿Qué te dicen los números?</p>`,
    items: [{ id: 'fp', et: 'FP verdadero', pts: 2, tol: TOL_FP }, { id: 'thd', et: 'Distorsión armónica de la corriente que explica la diferencia, THD (%)', pts: 1, tol: { rel: 0.05, abs: 3 } },
      { id: 'op', et: '¿Qué le recomiendas?', pts: 2, tipo: 'op' }],
    ops: () => ops(['Un filtro de armónicos: los capacitores comunes no corrigen esto', 'Un banco de capacitores común, para subir el FP a 0,98', 'Cambiar el cosfímetro, porque está descalibrado', 'Nada: el FP de la instalación es el que marca el cosfímetro']),
    raz: true,
    esperado(d, u) {
      const fp = d.P / (d.V * d.I), fpu = usar(u, 'fp', fp), th = (x) => (x > 0 && x < d.cos ? Math.sqrt((d.cos / x) ** 2 - 1) * 100 : NaN);
      return { fp: [fp], thd: dos(th(fpu), th(fp)), op: 0 };
    },
    sol(d) {
      const fp = d.P / (d.V * d.I);
      return [`\\text{FP} = \\dfrac{P}{V\\cdot I} = \\dfrac{${d.P}}{${d.V}\\cdot ${nh(d.I)}} = ${tx(fp, 3)}`, `\\text{FP} = \\dfrac{\\cos\\varphi}{\\sqrt{1 + \\text{THD}^2}} \\;\\Rightarrow\\; \\text{THD} = \\sqrt{\\left(\\dfrac{${nh(d.cos)}}{${tx(fp, 3)}}\\right)^2 - 1} = ${tx(Math.sqrt((d.cos / fp) ** 2 - 1) * 100, 0)}\\ \\%`];
    },
    modelo: (d) => `El cosfímetro solo ve el desfase de la componente de 50 Hz (${ht(d.cos)}). El FP verdadero sale de P/(V·I) = ${ht(d.P / (d.V * d.I), 3)}: la corriente eficaz es mayor por los armónicos, que no aportan potencia. Capacitores comunes no corrigen la distorsión; hace falta un filtro.`
  });

  preg({
    id: 'E2', parte: 'E', t: 'El motor y su placa',
    gen(r) {
      const Pn = elegir(r, [11, 15, 18.5, 22]), sobre = r() < 0.3, c = sobre ? entre(r, 1.1, 1.25, 0.01) : entre(r, 0.25, 0.4, 0.01);
      const fp = sobre ? entre(r, 0.86, 0.89, 0.01) : entre(r, 0.45, 0.6, 0.01), Pin = Math.round(((c * Pn) / 0.9) * 10) / 10;
      const I = Math.round(((Pin * 1000) / (R3 * 380 * fp)) * 10) / 10;
      return { Pn, sobre, Pin, I };
    },
    enun: (d) => `<p>La placa de un motor trifásico dice:</p>${datos([`Potencia mecánica: ${M('P_n = ' + nh(d.Pn) + u_('kW'))}`, M('\\cos\\varphi_n = 0{,}86'), `Rendimiento: ${M('\\eta = 0{,}90')}`])}<p>Trabajando, se mide:</p>${datos([M('V_L = 380' + u_('V')), M('I_L = ' + nh(d.I) + u_('A')), `Potencia eléctrica que toma: ${M('P = ' + nh(d.Pin) + u_('kW'))}`])}`,
    items: [{ id: 'fp', et: 'FP con el que trabaja', pts: 2, tol: TOL_FP }, { id: 'c', et: 'Carga del motor respecto de su potencia nominal (%)', pts: 1, tol: { rel: 0.03, abs: 1.5 } }, { id: 'op', et: '¿Qué indican estos números?', pts: 2, tipo: 'op' }],
    ops(d) {
      const poco = 'Está poco cargado: por eso su FP es bajo; conviene un motor más chico o compensar junto al motor', sobre = 'Está sobrecargado: trabaja por encima de su potencia nominal y se calentará; hay que bajar la carga o usar un motor más grande';
      return ops([...(d.sobre ? [sobre, poco] : [poco, sobre]), 'Está bien: el FP de un motor es siempre el de su placa', 'El amperímetro mide mal: con esa potencia la corriente debería ser la nominal']);
    },
    raz: true,
    esperado(d) { const fp = (d.Pin * 1000) / (R3 * 380 * d.I); return { fp: [fp], c: [((0.9 * d.Pin) / d.Pn) * 100], op: 0 }; },
    sol(d) {
      const fp = (d.Pin * 1000) / (R3 * 380 * d.I);
      return [`\\text{FP} = \\dfrac{P}{\\sqrt{3}\\cdot V_L\\cdot I_L} = \\dfrac{${tx(d.Pin * 1000)}}{\\sqrt{3}\\cdot 380\\cdot ${nh(d.I)}} = ${tx(fp, 3)}`, `P_{\\text{mec}} \\approx \\eta\\cdot P = 0{,}9\\cdot ${nh(d.Pin)} = ${tx(0.9 * d.Pin)}${u_('kW')}`,
        `\\text{Carga} = \\dfrac{${tx(0.9 * d.Pin)}}{${nh(d.Pn)}} = ${tx(((0.9 * d.Pin) / d.Pn) * 100, 0)}\\ \\%`];
    },
    modelo: (d) => (d.sobre ? `Toma más potencia que la nominal (${ht(((0.9 * d.Pin) / d.Pn) * 100, 0)} % de carga): su FP es bueno, pero se calienta y se acorta su vida. Hay que bajar la carga o cambiarlo por uno más grande.`
      : `Trabaja a ${ht(((0.9 * d.Pin) / d.Pn) * 100, 0)} % de su potencia: un motor poco cargado sigue tomando casi la misma reactiva para su campo magnético, y su FP cae a ${ht((d.Pin * 1000) / (R3 * 380 * d.I), 2)}. Conviene un motor más chico o un capacitor junto al motor.`)
  });

  preg({
    id: 'E3', parte: 'E', t: 'Un vatímetro que marca negativo',
    gen(r) {
      for (;;) {
        const P = entre(r, 3, 15, 0.5), fp = entre(r, 0.3, 0.45, 0.01), Qv = P * Math.tan(acosS(fp));
        const W1 = Math.round(((P - Qv / R3) / 2) * 100) / 100, W2 = Math.round(((P + Qv / R3) / 2) * 100) / 100;
        if (W1 > -0.2) continue;
        return { W1, W2 };
      }
    },
    enun: (d) => `<p>En un motor trifásico que trabaja en vacío se usa el método de los dos vatímetros. El vatímetro 1 movía la aguja hacia atrás: se invirtió su bobina de tensión y entonces marcó ${M(nh(-d.W1) + u_('kW'))}. El vatímetro 2 marca ${M(nh(d.W2) + u_('kW'))}.</p>`,
    fig: () => F.aron(),
    items: [{ id: 'P', et: 'Potencia activa del motor (kW)', pts: 2 }, { id: 'fp', et: 'Factor de potencia', pts: 1, tol: TOL_FP }, { id: 'op', et: '¿Qué significa que un vatímetro marque negativo?', pts: 2, tipo: 'op' }],
    ops: () => ops(['Nada está mal: el FP es menor que 0,5 y esa lectura se resta', 'Está mal conectado: hay que sumar las dos lecturas como positivas', 'El motor está devolviendo potencia a la red', 'El FP es mayor que 0,5']),
    raz: true,
    esperado(d, u) {
      const P = d.W1 + d.W2, Qv = R3 * (d.W2 - d.W1), Pu = usar(u, 'P', P);
      return { P: [P], fp: dos(Pu / Math.hypot(Pu, Qv), P / Math.hypot(P, Qv)), op: 0 };
    },
    sol(d) {
      const P = d.W1 + d.W2, Qv = R3 * (d.W2 - d.W1);
      return [`P = W_1 + W_2 = (${tx(d.W1)}) + ${tx(d.W2)} = ${tx(P)}${u_('kW')}`, `Q = \\sqrt{3}\\cdot (W_2 - W_1) = \\sqrt{3}\\cdot (${tx(d.W2)} - (${tx(d.W1)})) = ${tx(Qv)}${u_('kVAR')}`,
        `\\text{FP} = \\dfrac{P}{\\sqrt{P^2 + Q^2}} = ${tx(P / Math.hypot(P, Qv), 3)}`];
    },
    modelo: () => 'Con FP menor que 0,5 el desfase pasa de 60° y uno de los vatímetros da negativo. No está mal conectado: su lectura se toma con signo menos. Un motor en vacío toma poca potencia activa y mucha reactiva, por eso su FP es tan bajo.'
  });

  preg({
    id: 'E4', parte: 'E', t: '¿Le creo al telurómetro?',
    gen(r) {
      const R0 = entre(r, 8, 40, 0.1), ok = r() < 0.45;
      const a = ok ? entre(r, 0.01, 0.035, 0.005) : entre(r, 0.08, 0.15, 0.01), b = ok ? entre(r, 0.01, 0.04, 0.005) : entre(r, 0.1, 0.22, 0.01);
      const R = [Math.round(R0 * (1 - a) * 10) / 10, R0, Math.round(R0 * (1 + b) * 10) / 10];
      return { R, D: elegir(r, [15, 20, 25]) };
    },
    enun: (d) => `<p>Se mide una jabalina con el telurómetro, con la pica H a ${M(d.D + u_('m'))}. Para comprobar, se toman tres lecturas: con S al 62 % y moviendo S un metro antes y un metro después.</p>
      ${datos([`S un metro antes: ${M(nh(d.R[0]) + u_('Ω'))}`, `S al 62 %: ${M(nh(d.R[1]) + u_('Ω'))}`, `S un metro después: ${M(nh(d.R[2]) + u_('Ω'))}`])}`,
    fig: (d) => F.lecturas(d),
    items: [{ id: 'var', et: 'Mayor diferencia respecto de la lectura al 62 % (%)', pts: 2, tol: { rel: 0.03, abs: 0.5 } }, { id: 'op', et: '¿Qué haces con la medición?', pts: 3, tipo: 'op' }],
    vari: (d) => (Math.max(Math.abs(d.R[0] - d.R[1]), Math.abs(d.R[2] - d.R[1])) / d.R[1]) * 100,
    ops(d) {
      const si = `Anotar ${ht(d.R[1])} Ω como resistencia de la jabalina y volver a conectar la tierra`, no = 'Alejar la pica H y repetir las tres lecturas';
      return ops([...(this.vari(d) <= 5 ? [si, no] : [no, si]), 'Tomar el promedio de las tres lecturas', 'Acercar S a la jabalina y medir otra vez']);
    },
    raz: true,
    esperado(d) { return { var: [this.vari(d)], op: 0 }; },
    sol(d) {
      const v = this.vari(d);
      return [`\\dfrac{|${nh(d.R[0])} - ${nh(d.R[1])}|}{${nh(d.R[1])}} = ${tx((Math.abs(d.R[0] - d.R[1]) / d.R[1]) * 100, 1)}\\ \\%;\\;\\; \\dfrac{|${nh(d.R[2])} - ${nh(d.R[1])}|}{${nh(d.R[1])}} = ${tx((Math.abs(d.R[2] - d.R[1]) / d.R[1]) * 100, 1)}\\ \\%`,
        v <= 5 ? '<p>Las lecturas cambian menos del 5 %: S está en la zona plana y la lectura del 62 % es confiable.</p>' : '<p>Las lecturas cambian más del 5 %: no hay zona plana porque las zonas de influencia de E y H se tocan. Hay que alejar H y repetir.</p>'];
    },
    modelo: (d) => (Math.max(Math.abs(d.R[0] - d.R[1]), Math.abs(d.R[2] - d.R[1])) / d.R[1] * 100 <= 5
      ? 'Las tres lecturas casi no cambian (menos del 5 %): S está en la zona plana de la curva y la lectura del 62 % es la resistencia de la jabalina.'
      : 'Las lecturas crecen al mover S: no hay zona plana, porque la pica H está muy cerca y su zona de influencia toca la de la jabalina. Promediar no sirve; hay que alejar H y medir otra vez.')
  });

  // ============================================================
  // API
  // ============================================================
  SM.PREG = Q;
  SM.PARTES = [
    { id: 'A', t: 'Multímetros y amperímetros' }, { id: 'B', t: 'Potencia, FP y corrección' }, { id: 'C', t: 'Puesta a tierra' },
    { id: 'D', t: 'Laboratorio' }, { id: 'E', t: 'Interpretación de resultados' }
  ].map((p) => Object.assign(p, { max: Q.filter((q) => q.parte === p.id).reduce((a, q) => a + q.pts, 0), preg: Q.filter((q) => q.parte === p.id).map((q) => q.id) }));
  SM.porId = Object.fromEntries(Q.map((q) => [q.id, q]));
  SM.MAX = Q.reduce((a, q) => a + q.pts, 0);
  SM.etq = (it, d) => (typeof it.et === 'function' ? it.et(d) : it.et);

  // datos de un simulacro: { q: { A1: d, ... } }
  SM.datos = (semilla) => { const out = {}; Q.forEach((q) => { out[q.id] = q.gen(SM.rng(semilla + '|' + q.id)); }); return out; };
  // orden en pantalla de las opciones (índices originales) y orden inicial de los pasos
  SM.orden = (semilla, q, it, n) => SM.mezclar(SM.rng(semilla + '|' + q.id + '|' + it.id), [...Array(n).keys()]);
  SM.opciones = (q, d, it) => q.ops(d, it.id);
  SM.ordenInicial = (semilla, q, d) => {
    const n = q.pasos(d).length; let o = SM.orden(semilla, q, { id: 'ord' }, n), k = 0;
    while (q.aceptados(d).some((a) => a.join() === o.join()) && k++ < 20) o = SM.mezclar(SM.rng(semilla + '|' + q.id + '|ord|' + k), o);
    return o;
  };
  SM.casillas = () => Q.reduce((a, q) => a + q.items.length, 0);

  // ---------- calificar ----------
  // resp: { A1: { Rsh: '5,0', ... }, D2: { ord: [3,1,...] }, ... } ; devuelve detalle por casilla
  SM.calificarPreg = (q, d, r) => {
    r = r || {};
    const u = (id) => { const x = SM.leer(r[id]); return x.v != null ? x.v : null; };
    const esp = q.esperado(d, u) || {};
    let pts = 0; const det = {};
    q.items.forEach((it) => {
      let ok = false, p = 0;
      if (it.tipo === 'op') { ok = r[it.id] != null && r[it.id] !== '' && Number(r[it.id]) === 0; p = ok ? it.pts : 0; }
      else if (it.tipo === 'ord') {
        const o = Array.isArray(r[it.id]) ? r[it.id] : null, ac = q.aceptados(d), n = q.pasos(d).length;
        if (o && o.length === n) { const best = Math.max(...ac.map((a) => a.reduce((s, x, i) => s + (o[i] === x ? 1 : 0), 0))); p = Math.round(((it.pts * best) / n) * 2) / 2; ok = best === n; }
      } else {
        const x = SM.leer(r[it.id]), lista = esp[it.id] || [];
        ok = x.v != null && lista.some((e) => SM.cerca(x.v, e, it.tol)); p = ok ? it.pts : 0;
      }
      pts += p; det[it.id] = { ok, p, esp: esp[it.id] };
    });
    return { pts: Math.round(pts * 2) / 2, det };
  };
  SM.calificar = (semilla, resp) => {
    const D = SM.datos(semilla), partes = {}, preg = {};
    let total = 0, vacias = 0;
    SM.PARTES.forEach((p) => (partes[p.id] = 0));
    Q.forEach((q) => {
      const r = (resp && resp[q.id]) || {}, c = SM.calificarPreg(q, D[q.id], r);
      q.items.forEach((it) => { const v = r[it.id]; if (v == null || v === '' || (Array.isArray(v) && !v.length)) vacias++; });
      preg[q.id] = c; partes[q.parte] += c.pts; total += c.pts;
    });
    return { nota: Math.round(total * 2) / 2, partes, preg, vacias, D };
  };
  // respuestas perfectas (para las pruebas)
  SM.perfectas = (semilla) => {
    const D = SM.datos(semilla), out = {};
    Q.forEach((q) => {
      const d = D[q.id], r = {}, esp = q.esperado(d, () => null) || {};
      q.items.forEach((it) => {
        if (it.tipo === 'op') r[it.id] = 0;
        else if (it.tipo === 'ord') r[it.id] = q.aceptados(d)[0].slice();
        else r[it.id] = String(Math.round(esp[it.id][0] * 1e4) / 1e4).replace('.', ',');
      });
      out[q.id] = r;
    });
    return out;
  };
  // número esperado para mostrar en la revisión
  SM.mostrarEsp = (q, d, it, det) => {
    if (it.tipo === 'op') return { exacto: SM.opciones(q, d, it)[0].h };
    if (it.tipo === 'ord') return {};
    const ex = (q.esperado(d, () => null) || {})[it.id], e = ex && ex.length ? ex[0] : null;
    const fmt = (v) => (it.tol === TOL_FP ? ht(v, 3) : it.tol === TOL_ENT ? ht(v, 0) : ht(v));
    if (e == null || !isFinite(e)) return {};
    const propio = det && det.esp && det.esp.length > 1 && isFinite(det.esp[0]) && !SM.cerca(det.esp[0], e, it.tol) ? fmt(det.esp[0]) : null;
    return { exacto: fmt(e), propio };
  };
})();
