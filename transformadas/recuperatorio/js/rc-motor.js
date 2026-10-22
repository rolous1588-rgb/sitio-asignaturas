// ============================================================
// Transformadas · Recuperatorio del 1.er parcial (Laplace, 22/10/2026) — problemas y calificación
// 5 problemas con datos propios por carnet, resueltos por pasos (casillas):
//   P1 polo repetido (15) · P2 raíces complejas (15) · P3 convolución (20)
//   P4 sistema de dos EDO (25) · P5 EDO con un pulso (25)
// Casillas numéricas: entero, decimal con punto o coma, o fracción a/b. Tolerancia ±2 % (mínimo 0,01).
// Cada casilla se califica con los números del propio estudiante (el error no se arrastra):
//   bien = puntaje completo; mal o vacía = 0.
// ============================================================
(function () {
  const RC = (window.RC = window.RC || {});

  // ---------- azar reproducible por carnet ----------
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  RC.rng = (semilla) => {
    let a = hash(String(semilla));
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  const elegir = (r, arr) => arr[Math.floor(r() * arr.length)];
  RC.mezclar = (r, arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------- lo que escribe el estudiante ----------
  // acepta 3; -2; 0,4; 0.4; 2/5; -3/4; 1,5/2 (y el signo − del teclado)
  RC.leer = (s) => {
    if (s == null) return { vacio: true };
    const t = String(s).trim().replace(/\s+/g, '').replace(/[−–—‒]/g, '-').replace(/^\+/, '').replace(/,/g, '.');
    if (t === '') return { vacio: true };
    const num = /^-?(\d+\.?\d*|\.\d+)$/;
    if (num.test(t)) return { v: Number(t) || 0 };
    const p = t.split('/');
    if (p.length === 2 && num.test(p[0]) && /^-?(\d+\.?\d*|\.\d+)$/.test(p[1]) && Number(p[1]) !== 0) return { v: Number(p[0]) / Number(p[1]) || 0 };
    return { invalido: true };
  };
  RC.TOL_REL = 0.02;
  RC.TOL_ABS = 0.01;
  RC.cerca = (v, e) => isFinite(v) && isFinite(e) && Math.abs(v - e) <= Math.max(RC.TOL_REL * Math.abs(e), RC.TOL_ABS) + 1e-12;

  // ---------- números para mostrar ----------
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  // fracción exacta si el denominador es chico; si no, 4 decimales
  RC.frac = (x) => {
    if (!isFinite(x)) return null;
    for (let q = 1; q <= 400; q++) {
      const p = Math.round(x * q);
      if (Math.abs(p / q - x) < 1e-9) { const g = gcd(p, q); return { p: p / g, q: q / g }; }
    }
    return null;
  };
  RC.txt = (x) => { const f = RC.frac(x); if (!f) return (Math.round(x * 1e4) / 1e4).toString().replace('.', ',').replace('-', '−'); return (f.p < 0 ? '−' : '') + Math.abs(f.p) + (f.q === 1 ? '' : '/' + f.q); };
  RC.tex = (x) => { const f = RC.frac(x); if (!f) return String(Math.round(x * 1e4) / 1e4).replace('.', '{,}'); return f.q === 1 ? String(f.p) : (f.p < 0 ? '-' : '') + '\\tfrac{' + Math.abs(f.p) + '}{' + f.q + '}'; };
  // términos con signo para LaTeX: «+ 3», «- 2s», coeficiente 1 omitido
  const sg = (c, v = '', primero = false) => {
    if (c === 0) return '';
    const abs = Math.abs(c);
    const co = v && abs === 1 ? '' : String(abs);
    return (c < 0 ? (primero ? '-' : ' - ') : primero ? '' : ' + ') + co + v;
  };
  const caja = (n) => '\\boxed{' + n + '}';
  const sen = (b, extra = '') => (b === 1 ? '\\sen(t)' : '\\sen(' + b + 't)') + extra;
  const cos = (b) => (b === 1 ? '\\cos(t)' : '\\cos(' + b + 't)');
  const expn = (a) => (a === 1 ? 'e^{-t}' : 'e^{-' + a + 't}');
  const spl = (a) => 's + ' + a;

  // ---------- los 5 problemas ----------
  // cada problema: gen(r) → datos; enunciado(d) (HTML con LaTeX); pasos(d) → [{ t, tex, items: [{ id, et, pts, tipo, ops? }] }];
  // esperado(d, u) → { id: valor } con u(id) = número del estudiante (o undefined)
  const P = {};

  P.p1 = {
    titulo: 'Polo repetido', max: 15,
    gen(r) { const a = elegir(r, [1, 2, 3, 4]); const c = elegir(r, [1, 2, 3, 4, 5, 6]); return { a, c }; },
    enunciado: (d) => `<p>Halla la transformada inversa de</p>\\[F(s) = \\dfrac{s^{2} + ${d.c}}{(${spl(d.a)})^{3}}\\]`,
    pasos: (d) => [
      { t: 'Paso 1: fracciones parciales', tex: `F(s) = \\dfrac{A}{${spl(d.a)}} + \\dfrac{B}{(${spl(d.a)})^{2}} + \\dfrac{C}{(${spl(d.a)})^{3}}`,
        items: [{ id: 'A', et: 'A', pts: 3 }, { id: 'B', et: 'B', pts: 3 }, { id: 'C', et: 'C', pts: 3 }] },
      { t: 'Paso 2: la función en el tiempo', tex: `f(t) = e^{-${caja(1)}\\,t}\\left(${caja(2)} + ${caja(3)}\\,t + ${caja(4)}\\,t^{2}\\right)`,
        items: [{ id: 'k1', et: caja(1), pts: 1.5 }, { id: 'k2', et: caja(2), pts: 1.5 }, { id: 'k3', et: caja(3), pts: 1.5 }, { id: 'k4', et: caja(4), pts: 1.5 }] }
    ],
    esperado(d, u) {
      const A = 1, B = -2 * d.a, C = d.a * d.a + d.c;
      const g = (id, def) => (u(id) == null ? def : u(id));
      return { A, B, C, k1: d.a, k2: g('A', A), k3: g('B', B), k4: g('C', C) / 2 };
    },
    final: (d) => `f(t) = ${expn(d.a)}\\left(1 ${sg(-2 * d.a, 't')} + ${RC.tex((d.a * d.a + d.c) / 2)}\\,t^{2}\\right)`
  };

  P.p2 = {
    titulo: 'Raíces complejas', max: 15,
    gen(r) {
      for (;;) {
        const al = elegir(r, [1, 2, 3]), be = elegir(r, [2, 3, 4]), p = elegir(r, [1, 2, 3]), m = elegir(r, [-2, -1, 1, 2]);
        const q = p * al + m * be;
        if (q !== 0) return { al, be, p, m, q, K: al * al + be * be };
      }
    },
    enunciado: (d) => `<p>Halla la transformada inversa de</p>\\[F(s) = \\dfrac{${sg(d.p, 's', true)}${sg(d.q)}}{s^{2} + ${2 * d.al}s + ${d.K}}\\]`,
    pasos: (d) => [
      { t: 'Paso 1: completa el cuadrado', tex: `s^{2} + ${2 * d.al}s + ${d.K} = \\left(s + ${caja(1)}\\right)^{2} + ${caja(2)}^{2}`,
        items: [{ id: 'k1', et: caja(1), pts: 3 }, { id: 'k2', et: caja(2) + '\\ (positivo)', pts: 3 }] },
      { t: 'Paso 2: la función en el tiempo', tex: `f(t) = e^{-${caja(3)}\\,t}\\left[${caja(4)}\\cos(${caja(5)}\\,t) + ${caja(6)}\\sen(${caja(5)}\\,t)\\right]`,
        items: [{ id: 'k3', et: caja(3), pts: 2 }, { id: 'k4', et: caja(4), pts: 2 }, { id: 'k5', et: caja(5), pts: 2 }, { id: 'k6', et: caja(6), pts: 3 }] }
    ],
    esperado(d, u) {
      const g = (id, def) => (u(id) == null ? def : u(id));
      const al = g('k1', d.al);
      let be = g('k2', d.be);
      if (!be) be = d.be;
      return { k1: d.al, k2: d.be, k3: al, k4: d.p, k5: be, k6: (d.q - d.p * al) / be };
    },
    final: (d) => `f(t) = ${expn(d.al)}\\left[${d.p === 1 ? '' : d.p}${cos(d.be)} ${d.m < 0 ? '-' : '+'} ${Math.abs(d.m) === 1 ? '' : Math.abs(d.m)}${sen(d.be)}\\right]`
  };

  P.p3 = {
    titulo: 'Convolución', max: 20,
    gen(r) { const a = elegir(r, [1, 2, 3]); const b = elegir(r, [1, 2, 3]); return { a, b, N: a * a + b * b }; },
    enunciado: (d) => `<p>Usa el <b>teorema de convolución</b> para hallar, para \\(t \\ge 0\\),</p>\\[y(t) = ${expn(d.a)} * ${sen(d.b)}\\]`,
    ops: (d) => [
      `\\dfrac{${d.b}}{(${spl(d.a)})(s^{2} + ${d.b * d.b})}`,
      `\\dfrac{1}{${spl(d.a)}} + \\dfrac{${d.b}}{s^{2} + ${d.b * d.b}}`,
      `\\dfrac{s}{(${spl(d.a)})(s^{2} + ${d.b * d.b})}`,
      `\\dfrac{${d.b}}{(s - ${d.a})(s^{2} + ${d.b * d.b})}`
    ],
    pasos: (d) => [
      { t: 'Paso 1: la transformada de la convolución', tex: 'Y(s) = \\;?', items: [{ id: 'Y', et: 'Y(s)', pts: 4, tipo: 'op' }] },
      { t: 'Paso 2: fracciones parciales', tex: `\\dfrac{${d.b}}{(${spl(d.a)})(s^{2} + ${d.b * d.b})} = \\dfrac{A}{${spl(d.a)}} + \\dfrac{Bs + C}{s^{2} + ${d.b * d.b}}`,
        items: [{ id: 'A', et: 'A', pts: 3 }, { id: 'B', et: 'B', pts: 3 }, { id: 'C', et: 'C', pts: 3 }] },
      { t: 'Paso 3: la función en el tiempo', tex: `y(t) = ${caja(1)}\\,e^{-${caja(2)}\\,t} + ${caja(3)}\\cos(${caja(4)}\\,t) + ${caja(5)}\\sen(${caja(4)}\\,t)`,
        items: [{ id: 'k1', et: caja(1), pts: 1.5 }, { id: 'k2', et: caja(2), pts: 1 }, { id: 'k3', et: caja(3), pts: 1.5 }, { id: 'k4', et: caja(4), pts: 1 }, { id: 'k5', et: caja(5), pts: 2 }] }
    ],
    esperado(d, u) {
      const A = d.b / d.N, B = -d.b / d.N, C = (d.a * d.b) / d.N;
      const g = (id, def) => (u(id) == null ? def : u(id));
      return { Y: 0, A, B, C, k1: g('A', A), k2: d.a, k3: g('B', B), k4: d.b, k5: g('C', C) / d.b };
    },
    final: (d) => `y(t) = ${RC.tex(d.b / d.N)}\\,${expn(d.a)} - ${RC.tex(d.b / d.N)}\\,${cos(d.b)} + ${RC.tex(d.a / d.N)}\\,${sen(d.b)}`
  };

  // sistema x' = p x + q y, y' = r x + p y (q·r = k², raíces p ± k distintas de 0)
  const SIS = [];
  [-3, -2, 2, 3].forEach((p) => [[1, 1], [1, 4], [4, 1], [2, 2], [1, 9], [9, 1]].forEach(([q, r]) => {
    const k = Math.round(Math.sqrt(q * r));
    if (p + k === 0 || p - k === 0) return;
    [-2, -1, 1, 2, 3].forEach((x0) => [-2, -1, 1, 2, 3].forEach((y0) => {
      const l1 = p + k, l2 = p - k;
      const nx = (s) => x0 * s + (q * y0 - p * x0), ny = (s) => y0 * s + (r * x0 - p * y0);
      const c = [nx(l1), nx(l2), ny(l1), ny(l2)];
      if (c.some((v) => v === 0)) return;
      SIS.push({ p, q, r, k, x0, y0, l1, l2 });
    }));
  }));
  P.p4 = {
    titulo: 'Sistema de EDO', max: 25,
    gen: (r) => ({ ...elegir(r, SIS) }),
    enunciado: (d) => `<p>Resuelve con la transformada de Laplace:</p>
      \\[\\begin{cases} x'(t) = ${sg(d.p, 'x', true)}${sg(d.q, 'y')} \\\\ y'(t) = ${sg(d.r, 'x', true)}${sg(d.p, 'y')} \\end{cases}\\]
      \\[x(0) = ${d.x0};\\quad y(0) = ${d.y0}\\]`,
    pasos: (d) => [
      { t: 'Paso 1: el denominador', nota: 'Transforma el sistema y despeja \\(X(s)\\) y \\(Y(s)\\) (por ejemplo, con Cramer). Las dos tienen el mismo denominador: factorízalo.',
        tex: `(s - ${caja(1)})(s - ${caja(2)})\\qquad ${caja(1)} > ${caja(2)}`,
        items: [{ id: 'k1', et: caja(1), pts: 3 }, { id: 'k2', et: caja(2), pts: 3 }] },
      { t: 'Paso 2: el numerador de X(s)', tex: `X(s) = \\dfrac{${caja(3)}\\,s + ${caja(4)}}{(s - ${caja(1)})(s - ${caja(2)})}`,
        items: [{ id: 'k3', et: caja(3), pts: 2 }, { id: 'k4', et: caja(4), pts: 2 }] },
      { t: 'Paso 3: x(t)', tex: `x(t) = ${caja(5)}\\,e^{${caja(1)}\\,t} + ${caja(6)}\\,e^{${caja(2)}\\,t}`,
        items: [{ id: 'k5', et: caja(5), pts: 3 }, { id: 'k6', et: caja(6), pts: 3 }] },
      { t: 'Paso 4: el numerador de Y(s)', tex: `Y(s) = \\dfrac{${caja(7)}\\,s + ${caja(8)}}{(s - ${caja(1)})(s - ${caja(2)})}`,
        items: [{ id: 'k7', et: caja(7), pts: 1.5 }, { id: 'k8', et: caja(8), pts: 1.5 }] },
      { t: 'Paso 5: y(t)', tex: `y(t) = ${caja(9)}\\,e^{${caja(1)}\\,t} + ${caja(10)}\\,e^{${caja(2)}\\,t}`,
        items: [{ id: 'k9', et: caja(9), pts: 3 }, { id: 'k10', et: caja(10), pts: 3 }] }
    ],
    esperado(d, u) {
      const g = (id, def) => (u(id) == null ? def : u(id));
      let L1 = g('k1', d.l1), L2 = g('k2', d.l2);
      if (Math.abs(L1 - L2) < 1e-9) { L1 = d.l1; L2 = d.l2; }
      const n3 = g('k3', d.x0), n4 = g('k4', d.q * d.y0 - d.p * d.x0);
      const n7 = g('k7', d.y0), n8 = g('k8', d.r * d.x0 - d.p * d.y0);
      return {
        k1: d.l1, k2: d.l2, k3: d.x0, k4: d.q * d.y0 - d.p * d.x0,
        k5: (n3 * L1 + n4) / (L1 - L2), k6: (n3 * L2 + n4) / (L2 - L1),
        k7: d.y0, k8: d.r * d.x0 - d.p * d.y0,
        k9: (n7 * L1 + n8) / (L1 - L2), k10: (n7 * L2 + n8) / (L2 - L1)
      };
    },
    final(d) {
      const e = this.esperado(d, () => undefined);
      const ex = (l) => (l === 1 ? 'e^{t}' : l === -1 ? 'e^{-t}' : 'e^{' + l + 't}');
      const comb = (c1, c2) => `${RC.tex(c1)}\\,${ex(d.l1)} ${c2 < 0 ? '-' : '+'} ${RC.tex(Math.abs(c2))}\\,${ex(d.l2)}`;
      return `x(t) = ${comb(e.k5, e.k6)};\\quad y(t) = ${comb(e.k9, e.k10)}`;
    }
  };

  P.p5 = {
    titulo: 'EDO con un pulso', max: 25,
    gen(r) {
      const [l1, l2] = elegir(r, [[1, 3], [2, 3], [1, 4], [2, 4], [3, 4], [1, 5]]);
      return { l1, l2, sig: l1 + l2, pi: l1 * l2, y0: elegir(r, [1, 2, 3]), K: elegir(r, [2, 3, 4, 6]), T: elegir(r, [1, 2, 3]) };
    },
    enunciado: (d) => `<p>Resuelve con la transformada de Laplace:</p>
      \\[y'' + ${d.sig}y' + ${d.pi}y = f(t),\\qquad y(0) = ${d.y0};\\; y'(0) = 0\\]
      \\[f(t) = \\begin{cases} ${d.K}, & 0 \\le t \\lt ${d.T} \\\\ 0, & t \\ge ${d.T} \\end{cases}\\]`,
    ops1: (d) => [
      `${d.K}\\left[u(t) - u(t - ${d.T})\\right]`,
      `${d.K}\\,u(t - ${d.T})`,
      `${d.K}\\left[u(t) + u(t - ${d.T})\\right]`,
      `${d.K}\\,u(t) - u(t - ${d.T})`
    ],
    ops2: (d) => [
      `\\dfrac{${d.K}\\left(1 - e^{-${d.T === 1 ? '' : d.T}s}\\right)}{s}`,
      `\\dfrac{${d.K}\\,e^{-${d.T === 1 ? '' : d.T}s}}{s}`,
      `\\dfrac{${d.K}\\left(1 + e^{-${d.T === 1 ? '' : d.T}s}\\right)}{s}`,
      `\\dfrac{${d.K}\\left(1 - e^{-${d.T === 1 ? '' : d.T}s}\\right)}{s^{2}}`
    ],
    pasos: (d) => [
      { t: 'Paso 1: f(t) con escalones', tex: 'f(t) = \\;?', items: [{ id: 'f', et: 'f(t)', pts: 5, tipo: 'op', ops: 'ops1' }] },
      { t: 'Paso 2: su transformada', tex: 'F(s) = \\;?', items: [{ id: 'F', et: 'F(s)', pts: 5, tipo: 'op', ops: 'ops2' }] },
      { t: 'Paso 3: la respuesta libre (solo las condiciones iniciales)', nota: 'Es la parte de \\(Y(s)\\) que no depende de \\(F(s)\\).',
        tex: `Y_{\\text{libre}}(s) = \\dfrac{${caja(1)}\\,s + ${caja(2)}}{(${spl(d.l1)})(${spl(d.l2)})} = \\dfrac{${caja(3)}}{${spl(d.l1)}} + \\dfrac{${caja(4)}}{${spl(d.l2)}}`,
        items: [{ id: 'k1', et: caja(1), pts: 1.5 }, { id: 'k2', et: caja(2), pts: 1.5 }, { id: 'k3', et: caja(3), pts: 1.5 }, { id: 'k4', et: caja(4), pts: 1.5 }] },
      { t: 'Paso 4: fracciones parciales de la entrada', tex: `\\dfrac{${d.K}}{s(${spl(d.l1)})(${spl(d.l2)})} = \\dfrac{${caja(5)}}{s} + \\dfrac{${caja(6)}}{${spl(d.l1)}} + \\dfrac{${caja(7)}}{${spl(d.l2)}}`,
        items: [{ id: 'k5', et: caja(5), pts: 3 }, { id: 'k6', et: caja(6), pts: 3 }, { id: 'k7', et: caja(7), pts: 3 }] }
    ],
    esperado(d, u) {
      const g = (id, def) => (u(id) == null ? def : u(id));
      const n1 = g('k1', d.y0), n2 = g('k2', d.sig * d.y0);
      return {
        f: 0, F: 0, k1: d.y0, k2: d.sig * d.y0,
        k3: (-d.l1 * n1 + n2) / (d.l2 - d.l1), k4: (-d.l2 * n1 + n2) / (d.l1 - d.l2),
        k5: d.K / d.pi, k6: d.K / (d.l1 * (d.l1 - d.l2)), k7: d.K / (d.l2 * (d.l2 - d.l1))
      };
    },
    final(d) {
      const e = this.esperado(d, () => undefined);
      const g = `g(\\tau) = ${RC.tex(e.k5)} ${e.k6 < 0 ? '-' : '+'} ${RC.tex(Math.abs(e.k6))}\\,e^{-${d.l1 === 1 ? '' : d.l1}\\tau} ${e.k7 < 0 ? '-' : '+'} ${RC.tex(Math.abs(e.k7))}\\,e^{-${d.l2}\\tau}`;
      return `y(t) = ${RC.tex(e.k3)}\\,${expn(d.l1)} ${e.k4 < 0 ? '-' : '+'} ${RC.tex(Math.abs(e.k4))}\\,${expn(d.l2)} + g(t) - g(t - ${d.T})\\,u(t - ${d.T});\\quad ${g}`;
    }
  };

  RC.P = P;
  RC.PROB = ['p1', 'p2', 'p3', 'p4', 'p5'];
  RC.MAX = { p1: 15, p2: 15, p3: 20, p4: 25, p5: 25 };
  RC.TITULO = { p1: 'P1', p2: 'P2', p3: 'P3', p4: 'P4', p5: 'P5' };
  RC.NOMBRE = Object.fromEntries(RC.PROB.map((k) => [k, P[k].titulo]));

  // datos de un problema para un carnet (siempre los mismos)
  RC.datos = (k, carnet) => {
    const r = RC.rng(String(carnet) + '|tf-rec1|' + k);
    const d = P[k].gen(r);
    d.prob = k;
    // opciones mezcladas por carnet: d.op[id] = [{ t, ok }]
    d.op = {};
    P[k].pasos(d).forEach((ps) => ps.items.forEach((it) => {
      if (it.tipo !== 'op') return;
      const lista = (P[k][it.ops || 'ops'])(d).map((t, i) => ({ t, ok: i === 0 }));
      d.op[it.id] = RC.mezclar(RC.rng(String(carnet) + '|tf-rec1|' + k + '|' + it.id), lista);
    }));
    return d;
  };
  RC.items = (k, d) => P[k].pasos(d).reduce((a, ps) => a.concat(ps.items), []);
  RC.casillas = (k) => RC.items(k, RC.datos(k, 'x')).length;
  RC.TOTAL_CASILLAS = RC.PROB.reduce((s, k) => s + RC.casillas(k), 0);

  // calificación de un problema: vals = { id: texto | índice de opción }
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

  // nota (sobre 100): est = { p1: { vals }, … }
  RC.nota = (carnet, est) => {
    const res = {};
    let total = 0;
    RC.PROB.forEach((k) => {
      res[k] = RC.calificar(k, RC.datos(k, carnet), (est && est[k] && est[k].vals) || {});
      total += res[k].pts;
    });
    return { total: Math.round(total * 100) / 100, res };
  };

  // avance: casillas con algo escrito o elegido, sobre el total
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
