// ============================================================
// Transformadas · 2.º parcial: Series de Fourier (09/11/2026) — problemas y calificación
// Con formulario. 4 problemas con datos propios por carnet (P1 y P4 según la carrera):
//   P1 lee tu señal (20) · P2 triangular con alturas propias (30)
//   P3 reconocer sin integrar, con todo tipo de onda (25) · P4 leer un espectro (25)
// Casillas numéricas: entero, decimal con punto o coma, o fracción a/b. Tolerancia ±2 % (mínimo 0,01).
// Cada casilla se califica con los números del propio estudiante cuando depende de otra (P1: f con su T, ω₀ con su f).
// Mismo motor (RC) que el recuperatorio de Laplace (transformadas/recuperatorio/), con otros problemas.
// ============================================================
(function () {
  const RC = (window.RC = window.RC || {});
  const PI = Math.PI;

  // ---------- azar reproducible por carnet ----------
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  RC.rng = (semilla) => {
    let a = hash(String(semilla));
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  const elegir = (r, arr) => arr[Math.floor(r() * arr.length)];
  RC.mezclar = (r, arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------- lo que escribe el estudiante ----------
  RC.leer = (s) => {
    if (s == null) return { vacio: true };
    const t = String(s).trim().replace(/\s+/g, '').replace(/[−–—‒]/g, '-').replace(/^\+/, '').replace(/,/g, '.');
    if (t === '') return { vacio: true };
    const num = /^-?(\d+\.?\d*|\.\d+)$/;
    if (num.test(t)) return { v: Number(t) || 0 };
    const p = t.split('/');
    if (p.length === 2 && num.test(p[0]) && num.test(p[1]) && Number(p[1]) !== 0) return { v: Number(p[0]) / Number(p[1]) || 0 };
    return { invalido: true };
  };
  RC.TOL_REL = 0.02;
  RC.TOL_ABS = 0.01;
  RC.cerca = (v, e) => isFinite(v) && isFinite(e) && Math.abs(v - e) <= Math.max(RC.TOL_REL * Math.abs(e), RC.TOL_ABS) + 1e-12;

  // ---------- números para mostrar ----------
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  RC.frac = (x) => {
    if (!isFinite(x)) return null;
    for (let q = 1; q <= 400; q++) { const p = Math.round(x * q); if (Math.abs(p / q - x) < 1e-9) { const g = gcd(p, q); return { p: p / g, q: q / g }; } }
    return null;
  };
  const r4 = (x) => Math.round(x * 1e4) / 1e4;
  RC.txt = (x) => { const f = RC.frac(x); if (!f) return String(r4(x)).replace('.', ',').replace('-', '−'); return (f.p < 0 ? '−' : '') + Math.abs(f.p) + (f.q === 1 ? '' : '/' + f.q); };
  RC.tex = (x) => { const f = RC.frac(x); if (!f) return String(r4(x)).replace('.', '{,}'); return f.q === 1 ? String(f.p) : (f.p < 0 ? '-' : '') + '\\tfrac{' + Math.abs(f.p) + '}{' + f.q + '}'; };
  const dec = (x) => String(x).replace('.', '{,}');

  // ---------- ondas y gráfico ----------
  const frac1 = (x) => x - Math.floor(x);
  const u0 = (x) => frac1(x + 0.5) - 0.5; // fase en [−0,5; 0,5)
  RC.BASE = {
    cuadrada: { n: 'cuadrada', g: (x) => (frac1(x) < 0.5 ? 1 : -1) },
    triangular: { n: 'triangular', g: (x) => 1 - 4 * Math.abs(u0(x)) },
    diente: { n: 'diente de sierra', g: (x) => 2 * u0(x) },
    rmedia: { n: 'rectificada de media onda', g: (x) => Math.max(Math.sin(2 * PI * x), 0) },
    rcompleta: { n: 'rectificada de onda completa', g: (x) => Math.abs(Math.sin(PI * x)) },
    pulso: { n: 'pulso rectangular (un cuarto del período)', g: (x) => (frac1(x) < 0.25 ? 1 : 0) }
  };
  // coeficientes numéricos (x = t/T en un período)
  RC.coef = (f, N = 8, M = 4000) => {
    const a = new Array(N + 1).fill(0), b = new Array(N + 1).fill(0);
    for (let i = 0; i < M; i++) {
      const x = (i + 0.5) / M, v = f(x);
      a[0] += v / M;
      for (let n = 1; n <= N; n++) { a[n] += (2 * v * Math.cos(2 * PI * n * x)) / M; b[n] += (2 * v * Math.sin(2 * PI * n * x)) / M; }
    }
    return { a, b };
  };
  // gráfico SVG de dos períodos (de −T a T), con eje en t = 0
  RC.grafico = (f, opts = {}) => {
    const W = 340, H = 190, ml = 44, mr = 10, mt = 14, mb = 30;
    const xs = [], ys = [];
    for (let i = 0; i <= 800; i++) { const x = -1 + (2 * i) / 800; xs.push(x); ys.push(f(x)); }
    const vmax = opts.max != null ? opts.max : Math.max(...ys), vmin = opts.min != null ? opts.min : Math.min(...ys);
    const lo = Math.min(vmin, 0), hi = Math.max(vmax, 0), pad = (hi - lo || 1) * 0.12;
    const Y = (v) => mt + ((hi + pad - v) / (hi - lo + 2 * pad)) * (H - mt - mb);
    const X = (x) => ml + ((x + 1) / 2) * (W - ml - mr);
    const pts = xs.map((x, i) => `${X(x).toFixed(1)},${Y(ys[i]).toFixed(1)}`).join(' ');
    const marcas = [[-1, '−T'], [-0.5, '−T/2'], [0.5, 'T/2'], [1, 'T']].map(([x, t]) => `<line x1="${X(x)}" y1="${mt}" x2="${X(x)}" y2="${H - mb}" stroke="#d5dde8" stroke-width="1"/><text x="${X(x)}" y="${H - 10}" font-size="12" text-anchor="middle" fill="#5b6b7f">${t}</text>`).join('');
    const nivel = (v, col) => `<line x1="${ml}" y1="${Y(v)}" x2="${W - mr}" y2="${Y(v)}" stroke="${col}" stroke-width="1" stroke-dasharray="4 3"/><text x="${ml - 5}" y="${Y(v) + 4}" font-size="12" text-anchor="end" fill="#33475b">${String(Math.round(v * 100) / 100).replace('.', ',').replace('-', '−')}</text>`;
    const etiquetas = [...new Set([vmax, vmin, 0].map((v) => Math.round(v * 100) / 100))].map((v) => nivel(v, v === 0 ? '#9aa8b8' : '#c9d3df')).join('');
    return `<svg class="rc-graf" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de la señal">${marcas}${etiquetas}
      <line x1="${X(0)}" y1="${mt - 4}" x2="${X(0)}" y2="${H - mb}" stroke="#16202c" stroke-width="2"/><text x="${X(0)}" y="${H - 10}" font-size="12" text-anchor="middle" font-weight="700" fill="#16202c">0</text>
      <polyline points="${pts}" fill="none" stroke="#1d5fb4" stroke-width="3" stroke-linejoin="round"/></svg>`;
  };

  const caja = (n) => '\\boxed{' + n + '}';
  const P = {};

  // ===== P1: lee tu señal (por carrera) =====
  P.p1 = {
    titulo: 'Lee tu señal', max: 20,
    gen(r, car) {
      const bio = /biom/i.test(car || '');
      if (bio) {
        const lpm = elegir(r, [60, 66, 72, 75, 80, 90, 96, 100, 120]);
        const vmax = elegir(r, [2.4, 2.8, 3.2, 3.6]), vmin = elegir(r, [0.4, 0.8, 1.2]);
        return { bio, lpm, vmax, vmin, T: 60 / lpm };
      }
      const Tms = elegir(r, [8, 10, 12.5, 16, 20, 25, 32, 40]);
      const vmax = elegir(r, [2.5, 3, 3.5, 4, 5]), vmin = elegir(r, [-1, -0.5, 0.5, 1]);
      return { bio, Tms, vmax, vmin, T: Tms / 1000 };
    },
    enunciado: (d) => d.bio
      ? `<p><b>Oxímetro de pulso.</b> La señal de un dedo late a <b>${d.lpm} latidos por minuto</b>. Es aproximadamente senoidal y oscila entre <b>${dec(d.vmin)}</b> y <b>${dec(d.vmax)}</b> (unidades del sensor).</p>`
      : `<p><b>Vibración de un motor.</b> Un acelerómetro entrega una señal senoidal con nivel. Un período dura <b>${dec(d.Tms)}&nbsp;ms</b> y la señal oscila entre <b>${dec(d.vmin)}&nbsp;V</b> y <b>${dec(d.vmax)}&nbsp;V</b>.</p>`,
    pasos: () => [
      { t: 'Halla', tex: 'T\\ (\\text{s});\\quad f\\ (\\text{Hz});\\quad \\omega_0\\ (\\text{rad/s});\\quad a_0',
        items: [{ id: 'T', et: 'T\\ (\\text{s})', pts: 5 }, { id: 'f', et: 'f\\ (\\text{Hz})', pts: 5 }, { id: 'w', et: '\\omega_0\\ (\\text{rad/s})', pts: 5 }, { id: 'a0', et: 'a_0\\ (\\text{valor medio})', pts: 5 }] }
    ],
    esperado(d, u) {
      const g = (id, def) => (u(id) == null || u(id) === 0 ? def : u(id));
      const T = g('T', d.T), f = g('f', 1 / T);
      return { T: d.T, f: 1 / T, w: 2 * PI * f, a0: (d.vmax + d.vmin) / 2 };
    },
    final: (d) => `T = ${RC.tex(d.T)}\\ \\text{s};\\quad f = ${RC.tex(1 / d.T)}\\ \\text{Hz};\\quad \\omega_0 = 2\\pi f = ${dec(r4(2 * PI / d.T))}\\ \\text{rad/s};\\quad a_0 = ${RC.tex((d.vmax + d.vmin) / 2)}`
  };

  // ===== P2: triangular par con alturas propias =====
  P.p2 = {
    titulo: 'Triangular', max: 30,
    gen(r) {
      for (;;) {
        const alto = elegir(r, [2, 3, 4, 5, 6, 8]), bajo = elegir(r, [-3, -2, -1, 0, 1]);
        if (alto - bajo < 2) continue;
        const pico = r() < 0.5;
        return { alto, bajo, pico, c0: pico ? alto : bajo, c1: pico ? bajo : alto };
      }
    },
    f: (d) => (x) => d.c0 + (d.c1 - d.c0) * 2 * Math.abs(u0(x)),
    enunciado(d) {
      return `<p>Señal triangular de período \\(T\\): ${d.pico ? 'tiene su <b>pico</b>' : 'tiene su <b>valle</b>'} en \\(t = 0\\).</p>
        ${RC.grafico(this.f(d))}
        \\[f(t) = ${d.c0} ${d.c1 - d.c0 < 0 ? '-' : '+'} ${Math.abs(d.c1 - d.c0)}\\cdot\\dfrac{2|t|}{T},\\qquad |t| \\le \\dfrac{T}{2}\\]
        <p class="mp-nota">Se repite con período \\(T\\). Serie: \\(f(t) = a_0 + \\sum_{n \\ge 1}\\left[a_n\\cos(n\\omega_0 t) + b_n\\sen(n\\omega_0 t)\\right]\\).</p>`;
    },
    pasos: () => [
      { t: 'Halla los coeficientes', tex: 'a_0;\\quad a_1;\\quad a_2;\\quad a_3;\\quad b_1',
        items: [{ id: 'a0', et: 'a_0', pts: 6 }, { id: 'a1', et: 'a_1', pts: 6 }, { id: 'a2', et: 'a_2', pts: 6 }, { id: 'a3', et: 'a_3', pts: 6 }, { id: 'b1', et: 'b_1', pts: 6 }] }
    ],
    esperado(d) {
      const A = (d.alto - d.bajo) / 2, s = d.pico ? 1 : -1;
      const an = (n) => (n % 2 ? (s * 8 * A) / (PI * PI * n * n) : 0);
      return { a0: (d.alto + d.bajo) / 2, a1: an(1), a2: 0, a3: an(3), b1: 0 };
    },
    final(d) {
      const A = (d.alto - d.bajo) / 2;
      return `a_0 = ${RC.tex((d.alto + d.bajo) / 2)};\\quad a_n = ${d.pico ? '' : '-'}\\dfrac{8\\cdot ${RC.tex(A)}}{\\pi^{2}n^{2}}\\ (n\\ \\text{impar}),\\ a_n = 0\\ (n\\ \\text{par});\\quad b_n = 0`;
    }
  };

  // ===== P3: reconocer sin integrar (todo tipo de onda) =====
  const TIPOS3 = ['cuadrada', 'triangular', 'diente', 'rmedia', 'rcompleta', 'pulso'];
  P.p3 = {
    titulo: 'Reconocer', max: 25,
    gen(r) {
      const tipo = elegir(r, TIPOS3);
      const A = elegir(r, [1, 2, 3, 4]);
      const d0 = elegir(r, [0, 0.25]);
      const V0 = elegir(r, [0, 0, 1, -1, 2]);
      const s = elegir(r, [1, -1]);
      const d = { tipo, A, d0, V0, s };
      const f = P.p3.f(d);
      const c = RC.coef(f, 8);
      const eps = 0.003 * A;
      const ns = [1, 2, 3, 4, 5, 6];
      const par = ns.every((n) => Math.abs(c.b[n]) < eps);
      const impar = Math.abs(c.a[0]) < eps && ns.every((n) => Math.abs(c.a[n]) < eps);
      const cosT = ns.some((n) => Math.abs(c.a[n]) >= eps);
      const senT = ns.some((n) => Math.abs(c.b[n]) >= eps);
      const cn = (n) => Math.hypot(c.a[n], c.b[n]);
      const pares = [2, 4, 6].some((n) => cn(n) >= eps), impares = [1, 3, 5].some((n) => cn(n) >= eps);
      d.res = { sim: par ? 0 : impar ? 1 : 2, cos: cosT ? 0 : 1, sen: senT ? 0 : 1, arm: !pares ? 0 : !impares ? 1 : 2, a0: Math.round(c.a[0] * 1e6) / 1e6 };
      return d;
    },
    f: (d) => (x) => d.V0 + d.s * d.A * RC.BASE[d.tipo].g(x - d.d0),
    enunciado(d) {
      return `<p>Esta es tu señal (dos períodos, el eje vertical está en \\(t = 0\\)). Responde <b>sin integrar</b>.</p>${RC.grafico(this.f(d))}`;
    },
    opsFijas: (d) => ({
      sim: ['Par', 'Impar', 'Ni par ni impar'].map((t, i) => ({ t: '\\text{' + t + '}', ok: i === d.res.sim })),
      cos: ['Sí', 'No'].map((t, i) => ({ t: '\\text{' + t + '}', ok: i === d.res.cos })),
      sen: ['Sí', 'No'].map((t, i) => ({ t: '\\text{' + t + '}', ok: i === d.res.sen })),
      arm: ['Solo impares', 'Solo pares', 'Pares e impares'].map((t, i) => ({ t: '\\text{' + t + '}', ok: i === d.res.arm }))
    }),
    pasos: () => [
      { t: '1. Simetría', tex: '\\text{¿La señal es par, impar o ninguna?}', items: [{ id: 'sim', et: '\\text{simetría}', pts: 5, tipo: 'op' }] },
      { t: '2. Cosenos', tex: '\\text{¿Tiene algún } a_n \\text{ distinto de } 0\\ (n \\ge 1)?', items: [{ id: 'cos', et: 'a_n', pts: 5, tipo: 'op' }] },
      { t: '3. Senos', tex: '\\text{¿Tiene algún } b_n \\text{ distinto de } 0?', items: [{ id: 'sen', et: 'b_n', pts: 5, tipo: 'op' }] },
      { t: '4. Armónicos', tex: '\\text{¿Qué armónicos contiene?}', items: [{ id: 'arm', et: '\\text{armónicos}', pts: 5, tipo: 'op' }] },
      { t: '5. Valor medio', tex: 'a_0 = \\;?', items: [{ id: 'a0', et: 'a_0', pts: 5 }] }
    ],
    esperado: (d) => ({ sim: 0, cos: 0, sen: 0, arm: 0, a0: d.res.a0 }),
    final(d) {
      const t = ['par', 'impar', 'ni par ni impar'][d.res.sim];
      return `\\text{${RC.BASE[d.tipo].n}${d.d0 ? ', corrida } T/4\\text{' : ''}${d.s < 0 ? ', invertida' : ''}${d.V0 ? ', con nivel' : ''}: ${t}; ${['solo impares', 'solo pares', 'pares e impares'][d.res.arm]}};\\quad a_0 = ${RC.tex(d.res.a0)}`;
    }
  };

  // ===== P4: leer un espectro (por carrera) =====
  const PARES = [[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5]];
  P.p4 = {
    titulo: 'Espectro', max: 25,
    gen(r, car) {
      const bio = /biom/i.test(car || '');
      const f0 = bio ? elegir(r, [60, 72, 75, 90]) / 60 : 50;
      const k = elegir(r, [1, 0.5, 2]);
      const [p1, q1] = elegir(r, PARES.filter(([p, q]) => Math.hypot(p, q) >= 10));
      const [p3, q3] = elegir(r, [[3, 4], [4, 3], [0.6, 0.8], [0.8, 0.6]]);
      const sg = () => (r() < 0.5 ? -1 : 1);
      const a0 = elegir(r, [0, 1, 2, 3, 5]) * k;
      return { bio, f0, a0, a1: sg() * p1 * k, b1: sg() * q1 * k, a3: sg() * p3 * k, b3: sg() * q3 * k, a5: sg() * 0.6 * k, b5: sg() * 0.8 * k };
    },
    enunciado(d) {
      const fila = (n, a, b) => `<tr><td>${n}</td><td class="mono">${dec(a).replace('{,}', ',').replace('-', '−')}</td><td class="mono">${dec(b).replace('{,}', ',').replace('-', '−')}</td></tr>`;
      return `<p>${d.bio ? `<b>Pulso de un paciente</b>: frecuencia fundamental \\(f_0 = ${dec(r4(d.f0))}\\ \\text{Hz}\\) (${Math.round(d.f0 * 60)} latidos por minuto).` : '<b>Corriente de una carga no lineal</b> conectada a la red: \\(f_0 = 50\\ \\text{Hz}\\).'}
        Su serie de Fourier tiene estos coeficientes (los que no aparecen valen 0):</p>
        <table class="mp-tabla rc-tabla"><tr><th>\\(n\\)</th><th>\\(a_n\\)</th><th>\\(b_n\\)</th></tr>${fila(0, d.a0, '—')}${fila(1, d.a1, d.b1)}${fila(3, d.a3, d.b3)}${fila(5, d.a5, d.b5)}</table>
        <p class="mp-nota">\\(a_0\\) es el valor medio. Los armónicos 2, 4 y 6 valen 0.</p>`;
    },
    ops: () => ['\\text{Media onda: } f(t + T/2) = -f(t)', '\\text{Es par}', '\\text{Es impar}', '\\text{Tiene nivel de continua}'],
    pasos: () => [
      { t: '1. Amplitudes', tex: 'c_n = \\sqrt{a_n^{2} + b_n^{2}}', items: [{ id: 'c1', et: 'c_1', pts: 5 }, { id: 'c3', et: 'c_3', pts: 5 }] },
      { t: '2. Frecuencia y valor medio', tex: 'f_3\\ (\\text{Hz});\\quad \\text{valor medio}', items: [{ id: 'f3', et: 'f_3\\ (\\text{Hz})', pts: 5 }, { id: 'vm', et: '\\text{valor medio}', pts: 5 }] },
      { t: '3. ¿Por qué faltan los pares?', tex: '\\text{Faltan los armónicos pares porque…}', items: [{ id: 'sim', et: '\\text{razón}', pts: 5, tipo: 'op' }] }
    ],
    esperado: (d) => ({ c1: Math.hypot(d.a1, d.b1), c3: Math.hypot(d.a3, d.b3), f3: 3 * d.f0, vm: d.a0, sim: 0 }),
    final: (d) => `c_1 = ${RC.tex(Math.hypot(d.a1, d.b1))};\\quad c_3 = ${RC.tex(Math.hypot(d.a3, d.b3))};\\quad f_3 = 3f_0 = ${dec(r4(3 * d.f0))}\\ \\text{Hz};\\quad a_0 = ${RC.tex(d.a0)};\\quad \\text{media onda}`
  };

  RC.P = P;
  RC.PROB = ['p1', 'p2', 'p3', 'p4'];
  RC.MAX = { p1: 20, p2: 30, p3: 25, p4: 25 };
  RC.TITULO = { p1: 'P1', p2: 'P2', p3: 'P3', p4: 'P4' };
  RC.NOMBRE = Object.fromEntries(RC.PROB.map((k) => [k, P[k].titulo]));

  // datos de un problema para un carnet (y su carrera, para P1 y P4)
  const cache = {};
  RC.datos = (k, carnet, car) => {
    const clave = k + '|' + carnet + '|' + (/biom/i.test(car || '') ? 'b' : 'e');
    if (cache[clave]) return cache[clave];
    const r = RC.rng(String(carnet) + '|tf-ex2|' + k);
    const d = P[k].gen(r, car);
    d.prob = k;
    d.op = {};
    const fijas = P[k].opsFijas ? P[k].opsFijas(d) : null;
    P[k].pasos(d).forEach((ps) => ps.items.forEach((it) => {
      if (it.tipo !== 'op') return;
      if (fijas) { d.op[it.id] = fijas[it.id]; return; }
      const lista = P[k].ops(d).map((t, i) => ({ t, ok: i === 0 }));
      d.op[it.id] = RC.mezclar(RC.rng(String(carnet) + '|tf-ex2|' + k + '|' + it.id), lista);
    }));
    cache[clave] = d;
    return d;
  };
  RC.items = (k, d) => P[k].pasos(d).reduce((a, ps) => a.concat(ps.items), []);
  RC.casillas = (k) => P[k].pasos({}).reduce((s, ps) => s + ps.items.length, 0);
  RC.TOTAL_CASILLAS = RC.PROB.reduce((s, k) => s + RC.casillas(k), 0);

  RC.calificar = (k, d, vals) => {
    vals = vals || {};
    const items = RC.items(k, d);
    const u = (id) => { const it = items.find((x) => x.id === id); if (!it || it.tipo === 'op') return undefined; const q = RC.leer(vals[id]); return q.vacio || q.invalido ? undefined : q.v; };
    const esp = P[k].esperado(d, u);
    const cel = {};
    let pts = 0;
    items.forEach((it) => {
      const v = vals[it.id];
      let r;
      if (it.tipo === 'op') {
        const ok = d.op[it.id].findIndex((o) => o.ok);
        r = v == null || v === '' ? 'vacio' : Number(v) === ok ? 'ok' : 'mal';
        cel[it.id] = { r, exp: ok, pts: r === 'ok' ? it.pts : 0, max: it.pts };
      } else {
        const q = RC.leer(v);
        r = q.vacio ? 'vacio' : q.invalido ? 'mal' : RC.cerca(q.v, esp[it.id]) ? 'ok' : 'mal';
        cel[it.id] = { r, exp: esp[it.id], pts: r === 'ok' ? it.pts : 0, max: it.pts };
      }
      pts += cel[it.id].pts;
    });
    return { pts: Math.round(pts * 100) / 100, max: RC.MAX[k], cel };
  };

  RC.nota = (carnet, est, car) => {
    const res = {};
    let total = 0;
    RC.PROB.forEach((k) => { res[k] = RC.calificar(k, RC.datos(k, carnet, car), (est && est[k] && est[k].vals) || {}); total += res[k].pts; });
    return { total: Math.round(total * 100) / 100, res };
  };

  RC.avance = (est) => {
    let n = 0;
    RC.PROB.forEach((k) => { const v = (est && est[k] && est[k].vals) || {}; n += Object.keys(v).filter((id) => v[id] !== '' && v[id] != null).length; });
    return Math.round((100 * n) / RC.TOTAL_CASILLAS);
  };

  RC.firma = (est) => {
    const s = JSON.stringify(RC.PROB.map((k) => (est && est[k] && est[k].vals) || {}));
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  };
})();
