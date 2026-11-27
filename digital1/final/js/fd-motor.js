// ============================================================
// Electrónica Digital 1 · examen final por celular (27/11/2026) — problemas y calificación
// Copia del motor del parcial (digital1/parcial/js/pd-motor.js), mismo espacio RC, con otros problemas.
// 6 problemas con datos propios por carnet (100 pts):
//   P1 conversiones y De Morgan (10); P2 del circuito a la función y NAND–NAND (15); P3 mapa con X (10);
//   P4 nudo de tuberías: tabla de 4 válvulas con X, formas mínimas y SB con NAND (25; adaptado del ejercicio 19);
//   P5 contador con flip-flops T (20; ejercicio 32); P6 contador con flip-flops JK (20; ejercicio 29).
// Tablas, mapas y cronograma: casillas tipo 'bit' (el estudiante toca: 1, 0 o X).
// P5 y P6 se califican con los números del estudiante: el estado siguiente con sus propias entradas,
// la secuencia con su tabla y el cronograma con su secuencia (también vale el valor exacto).
// Opciones: la correcta va primero en ops(d, id) y se mezcla por carnet. o.h = texto HTML; o.t = LaTeX.
// Usa D1.k (mapas y tablas) y D1.circ (dibujo del circuito) de ../js/.
// ============================================================
(function () {
  const RC = (window.RC = window.RC || {});
  const K = window.D1.k, CI = window.D1.circ;

  // ---------- azar reproducible por carnet ----------
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  RC.rng = (semilla) => {
    let a = hash(String(semilla));
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  const elegir = (r, arr) => arr[Math.floor(r() * arr.length)];
  const ent = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  RC.mezclar = (r, arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------- lo que escribe el estudiante ----------
  RC.leer = (s) => {
    if (s == null) return { vacio: true };
    const t = String(s).trim().replace(/\s+/g, '').replace(/[−–—‒]/g, '-').replace(/^\+/, '').replace(/,/g, '.');
    if (t === '') return { vacio: true };
    const num = /^-?(\d+\.?\d*|\.\d+)$/;
    if (num.test(t)) return { v: Number(t) || 0 };
    return { invalido: true };
  };
  RC.TOL_REL = 0.02;
  RC.TOL_ABS = 0.01;
  RC.cerca = (v, e, tol) => {
    const rel = tol && tol.rel != null ? tol.rel : RC.TOL_REL, abs = tol && tol.abs != null ? tol.abs : RC.TOL_ABS;
    return isFinite(v) && isFinite(e) && Math.abs(v - e) <= Math.max(rel * Math.abs(e), abs) + 1e-9;
  };
  const EX = { rel: 0, abs: 0.01 }; // exacto

  // ---------- números para mostrar ----------
  const decs = (x) => { const a = Math.abs(x); if (!isFinite(a) || a === 0) return 0; return Math.max(0, Math.min(4, 3 - Math.floor(Math.log10(a)))); };
  const redo = (x, d) => { const v = Math.round(x * 10 ** d) / 10 ** d; return Object.is(v, -0) ? 0 : v; };
  RC.txt = (x, d) => String(redo(x, d == null ? decs(x) : d)).replace('.', ',').replace('-', '−');
  RC.tex = (x, d) => String(redo(x, d == null ? decs(x) : d)).replace('.', '{,}');
  RC.opTxt = (o) => (o.h != null ? o.h : '\\(' + o.t + '\\)');
  RC.etTxt = (it) => (it.h != null ? it.h : '\\(' + it.et + '\\)');
  const M = (s) => '\\(' + s + '\\)';
  const bits = (s) => '<b class="mono pd-bits">' + s + '</b>';
  const bin = (n, k) => { const s = n.toString(2); return k ? s.padStart(k, '0') : s; };
  const bcd = (n) => String(n).split('').map((c) => bin(+c, 4)).join('');
  const pesos = (n) => { const o = []; for (let p = 128; p >= 1; p /= 2) if (n & p) o.push(p); return o; };
  const unos = (s) => s.split('').filter((c) => c === '1').length;

  // ---------- funciones lógicas: suma de productos (literal = 2·variable + negada) ----------
  const evalSOP = (pu, nv) => Array.from({ length: 1 << nv }, (_, m) => (pu.some((g) => g.every((c) => (((m >> (nv - 1 - (c >> 1))) & 1) ^ (c & 1)) === 1)) ? 1 : 0));
  const ordenar = (g) => g.slice().sort((a, b) => a - b);
  const litT = (c, n) => (c & 1 ? '\\overline{' + n[c >> 1] + '}' : n[c >> 1]);
  const sopT = (pu, n) => (pu.length ? pu.map((g) => ordenar(g).map((c) => litT(c, n)).join('\\cdot ')).join(' + ') : '0');
  const deCubos = (nv, cubos) => cubos.map((cb) => { const g = []; for (let i = 0; i < nv; i++) { const b = 1 << (nv - 1 - i); if (cb.mask & b) g.push(2 * i + (cb.val & b ? 0 : 1)); } return g; });
  const distintaEnCuidado = (g, f) => f.some((v, m) => v !== 2 && v !== g[m]);
  // variantes equivocadas de una suma de productos: funciones distintas entre sí y de la correcta (en las celdas que importan)
  function distractores(r, pu, f, nv, k) {
    const cand = [];
    pu.forEach((g, j) => {
      g.forEach((c, i) => { const h = g.slice(); h[i] = c ^ 1; cand.push(pu.map((x, z) => (z === j ? h : x))); });
      if (pu.length > 1) cand.push(pu.filter((_, z) => z !== j));
      g.forEach((c, i) => {
        for (let v = 0; v < nv; v++) {
          if (g.some((cc) => cc >> 1 === v)) continue;
          const h = g.slice(); h[i] = 2 * v + (c & 1); cand.push(pu.map((x, z) => (z === j ? h : x)));
          if (g.length < nv) cand.push(pu.map((x, z) => (z === j ? g.concat([2 * v + (r() < 0.5 ? 1 : 0)]) : x)));
        }
      });
    });
    const vistos = [], out = [];
    RC.mezclar(r, cand).forEach((p) => {
      if (out.length >= k || !p.length || p.some((g) => !g.length)) return;
      const gg = evalSOP(p, nv);
      if (!distintaEnCuidado(gg, f) || gg.every((x) => x === 0) || gg.every((x) => x === 1)) return;
      const kk = gg.join('');
      if (vistos.includes(kk)) return;
      vistos.push(kk); out.push(p);
    });
    return out;
  }
  const N3 = ['A', 'B', 'C'], N4 = ['A', 'B', 'C', 'D'];
  // ¿la expresión mínima es única? (si hay dos soluciones mínimas, el estudiante podría hallar la que no está en las opciones)
  const pc = (x) => { let n = 0; while (x) { n += x & 1; x >>= 1; } return n; };
  function unica(nv, f) {
    const N = 1 << nv, ok = (mask, val) => { for (let m = 0; m < N; m++) if ((m & mask) === val && f[m] === 0) return false; return true; };
    const unosM = []; for (let m = 0; m < N; m++) if (f[m] === 1) unosM.push(m);
    const pr = [];
    for (let mask = 0; mask < N; mask++) for (let val = 0; val < N; val++) {
      if ((val & ~mask) || !ok(mask, val)) continue;
      let primo = true;
      for (let b = 1; b < N; b <<= 1) if ((mask & b) && ok(mask & ~b, val & ~b)) { primo = false; break; }
      if (primo && unosM.some((m) => (m & mask) === val)) pr.push({ mask, val, l: pc(mask) });
    }
    const sol = K.resolver(nv, f), k = sol.cubos.length, L = K.lits(sol.cubos);
    let n = 0;
    (function rec(i, el, l) {
      if (n > 1 || l > L) return;
      if (el.length === k) { if (l === L && unosM.every((m) => el.some((c) => (m & c.mask) === c.val))) n++; return; }
      for (let j = i; j < pr.length; j++) rec(j + 1, el.concat([pr[j]]), l + pr[j].l);
    })(0, [], 0);
    return n === 1;
  }

  const evalPOS = (su, nv) => Array.from({ length: 1 << nv }, (_, m) => (su.every((g) => g.some((c) => (((m >> (nv - 1 - (c >> 1))) & 1) ^ (c & 1)) === 1)) ? 1 : 0));
  const posT = (su, n) => su.map((g) => '(' + ordenar(g).map((c) => litT(c, n)).join(' + ') + ')').join('\\cdot ');
  const prodR = (r, nv, k) => RC.mezclar(r, Array.from({ length: nv }, (_, i) => i)).slice(0, k).sort((a, b) => a - b).map((v) => 2 * v + (r() < 0.5 ? 1 : 0));
  const nLits = (pu) => pu.reduce((s, g) => s + g.length, 0);
  const igualG = (a, b) => ordenar(a).join() === ordenar(b).join();
  const distintos = (pu) => pu.every((g, i) => pu.every((h, j) => j <= i || !igualG(g, h)));
  const cuenta1 = (f) => f.filter((v) => v === 1).length;
  // suma larga en varias líneas (para que entre en el celular)
  const lineas = (nombre, terms, k) => {
    if (terms.length <= k) return nombre + ' = ' + terms.join(' + ');
    const l = []; for (let i = 0; i < terms.length; i += k) l.push(terms.slice(i, i + k).join(' + '));
    return '\\begin{aligned}' + nombre + ' &= ' + l.join(' \\\\ &\\quad + ') + '\\end{aligned}';
  };
  const terminos = (pu, n) => pu.map((g) => sopT([g], n));
  const mint = (m, nv) => Array.from({ length: nv }, (_, v) => 2 * v + ((m >> (nv - 1 - v)) & 1 ? 0 : 1));
  // casillas de una tabla o de un mapa (tipo 'bit': se toca y cambia ? → 1 → 0 → X)
  const celdas = (pre, nv, f, pts, nombres) => Array.from({ length: 1 << nv }, (_, m) => ({
    id: pre + m, m, tipo: 'bit', bits: bin(m, nv), pts, h: nombres.join('') + ' = ' + bin(m, nv), txt: f ? (f[m] === 2 ? 'X' : String(f[m])) : null }));
  const espBits = (pre, f, e) => { f.forEach((v, m) => { e[pre + m] = v === 2 ? 'X' : String(v); }); return e; };
  const mapaSol = (nv, f, n) => `<div class="pd-fig">${K.estatico(nv, f, { nombres: n, grupos: K.resolver(nv, f).cubos })}</div>`;

  const P = {};
  const sinCeros = (s) => s.replace(/^0+/, '');
  const NOMS = ['F', 'G', 'H'];

  function simp(r, tipo) {
    for (let t = 0; t < 600; t++) {
      let f, ex, base = null, ms = null;
      if (tipo === 'can') {
        ms = RC.mezclar(r, [0, 1, 2, 3, 4, 5, 6, 7]).slice(0, ent(r, 4, 5)).sort((a, b) => a - b);
        f = Array(8).fill(0); ms.forEach((m) => { f[m] = 1; });
        ex = ms.map((m) => sopT([mint(m, 3)], N3));
      } else if (tipo === 'dm') {
        base = [prodR(r, 3, 2), prodR(r, 3, 2)];
        if (!distintos(base)) continue;
        f = evalSOP(base, 3).map((v) => 1 - v);
        ex = '\\overline{' + sopT(base, N3) + '}';
      } else if (tipo === 'pos') {
        base = [prodR(r, 3, 2), prodR(r, 3, 2), prodR(r, 3, 2)].slice(0, r() < 0.5 ? 2 : 3);
        if (!distintos(base)) continue;
        f = evalPOS(base, 3);
        ex = posT(base, N3);
      } else {
        base = [prodR(r, 3, 2), prodR(r, 3, 2), prodR(r, 3, r() < 0.5 ? 2 : 3)];
        if (!distintos(base)) continue;
        f = evalSOP(base, 3);
        ex = sopT(base, N3);
      }
      const u = cuenta1(f);
      if (u < 2 || u > 6) continue;
      const sol = K.resolver(3, f), L = K.lits(sol.cubos);
      if (!sol.cubos.length || sol.cubos.length > 3) continue;
      if (tipo === 'can' && (L > 4 || sol.cubos.length > 2)) continue;
      if ((tipo === 'dm' || tipo === 'pos') && (sol.cubos.length < 2 || L < 3)) continue;
      if (tipo === 'red' && L > nLits(base) - 2) continue;
      if (!unica(3, f)) continue;
      const mi = deCubos(3, sol.cubos), dis = distractores(r, mi, f, 3, 3);
      if (dis.length < 3) continue;
      return { tipo, f, ex, base, ms, mi, dis };
    }
    return null;
  }

  function mapaConX(r) {
    for (let t = 0; t < 3000; t++) {
      const f = Array(16).fill(0);
      const nc = 2 + (r() < 0.6 ? 1 : 0);
      for (let j = 0; j < nc; j++) {
        const fijas = r() < 0.5 ? 2 : 3, vars = RC.mezclar(r, [0, 1, 2, 3]).slice(0, fijas);
        let mask = 0, val = 0;
        vars.forEach((v) => { const b = 1 << (3 - v); mask |= b; if (r() < 0.5) val |= b; });
        for (let m = 0; m < 16; m++) if ((m & mask) === val) f[m] = 1;
      }
      const unosM = f.map((v, m) => (v ? m : -1)).filter((m) => m >= 0);
      if (unosM.length < 6 || unosM.length > 11) continue;
      RC.mezclar(r, unosM).slice(0, 2 + (r() < 0.6 ? 1 : 0)).forEach((m) => { f[m] = 2; });
      const conX = K.resolver(4, f), sinX = K.resolver(4, f.map((v) => (v === 2 ? 0 : v)));
      if (!f.includes(1)) continue;
      if (conX.cubos.length !== 3) continue;
      if (K.lits(conX.cubos) >= K.lits(sinX.cubos)) continue; // las X tienen que servir
      if (!unica(4, f)) continue;
      const mi = deCubos(4, conX.cubos), dis = distractores(r, mi, f, 4, 3);
      if (dis.length < 3) continue;
      return { f, mi, dis, nt: conX.cubos.length, nl: K.lits(conX.cubos) };
    }
    return null;
  }

  // ===== P1: conversiones y De Morgan (10) =====
  P.p1 = {
    titulo: 'Conversiones y De Morgan', max: 10,
    gen(r) {
      let a; do { a = ent(r, 37, 250); } while (unos(bin(a)) < 3);
      let dd; do { dd = ent(r, 21, 39); } while (dd % 10 === 0 || dd % 11 === 0);
      const q = simp(r, 'dm');
      return q ? { a, dd, q } : null;
    },
    enunciado: () => '<p>Resuelve cada inciso en tu hoja auxiliar y escribe o elige la respuesta debajo de su enunciado. Los números en ceros y unos van juntos, sin espacios.</p>',
    pasos: (d) => { const v = d && d.a != null; return [
      { t: 'a) Decimal → binario', html: v ? `La siguiente cantidad está en <b>decimal</b>: <b class="pd-dato">${d.a}</b>. Conviértela a <b>binario</b>.` : '', items: [{ id: 'a', h: 'a) En binario', pts: 3, tol: EX, txt: v ? bin(d.a) : null }] },
      { t: 'b) BCD → decimal', html: v ? `La siguiente cantidad está en <b>BCD</b>: ${bits(sinCeros(bcd(d.dd)))}. Conviértela a <b>decimal</b>.` : '', items: [{ id: 'b', h: 'b) En decimal', pts: 3, tol: EX }] },
      { t: 'c) De Morgan', html: 'Simplifica la función y elige su forma mínima como <b>suma de productos</b>.', tex: v ? 'F = ' + d.q.ex : null, items: [{ id: 'c', h: 'Forma mínima de F (suma de productos)', pts: 4, tipo: 'op' }] }]; },
    ops: (d) => [d.q.mi].concat(d.q.dis).map((p) => ({ t: sopT(p, N3) })),
    esperado: (d) => ({ a: [Number(bin(d.a))], b: [d.dd] }),
    final(d) {
      const g = (s) => s.match(/.{4}/g).join(' | ');
      const s6 = sinCeros(bcd(d.dd)), q = d.q;
      return [
        `<p><b>a)</b> Se restan los pesos que caben: ${d.a} = ${pesos(d.a).join(' + ')} → ${bits(bin(d.a))}</p>`,
        `<p><b>b)</b> Se agrupa de 4 en 4 <b>desde la derecha</b> y se completa con ceros a la izquierda: ${s6.slice(0, s6.length - 4)} | ${s6.slice(-4)} → ${g(bcd(d.dd))} → <b>${d.dd}</b></p>`,
        '<p><b>c)</b> De Morgan: la barra larga se rompe, la suma pasa a producto y cada producto negado pasa a suma:</p>',
        'F = ' + q.base.map((t) => '\\overline{' + sopT([t], N3) + '}').join('\\cdot ') + ' = ' + posT(q.base.map((t) => t.map((c) => c ^ 1)), N3),
        '<p>Todavía es un producto de sumas: se multiplica (una variable por su negada da 0) y se simplifica, o se lleva al mapa:</p>',
        mapaSol(3, q.f, N3), 'F = ' + sopT(q.mi, N3)];
    }
  };

  // ===== P2: circuito → tabla → función → NAND (15) =====
  P.p2 = {
    titulo: 'Del circuito a la función', max: 15,
    gen(r) {
      for (let t = 0; t < 500; t++) {
        const pu = [], ids = [];
        while (pu.length < 2) {
          const vars = RC.mezclar(r, [0, 1, 2]).slice(0, 2).sort();
          const g = vars.map((v) => 2 * v);
          if (!ids.includes(g.join())) { ids.push(g.join()); pu.push(g); }
        }
        const vn = elegir(r, [0, 1, 2]);
        let neg = 0;
        pu.forEach((g) => g.forEach((c, i) => { if (c >> 1 === vn && r() < 0.75) { g[i] = c | 1; neg++; } }));
        if (!neg) continue;
        const f = evalSOP(pu, 3), u = cuenta1(f);
        if (u < 2 || u > 6) continue;
        const sol = K.resolver(3, f);
        if (sol.cubos.length !== 2 || K.lits(sol.cubos) !== 4) continue;
        const dis = distractores(r, pu, f, 3, 3);
        if (dis.length < 3) continue;
        return { pu, f, dis };
      }
      return null;
    },
    enunciado: (d) => `<p>Analiza este circuito:</p><div class="pd-circ">${CI.svg(3, d.pu, N3, { mono: true, salida: 'Y' })}</div>`,
    pasos: (d) => [
      { t: 'a) Tabla de verdad del circuito', tabla: { cols: N3, x: false }, items: celdas('y', 3, d && d.f, 0.5, N3) },
      { t: 'b) Función', html: '¿Qué función implementa el circuito?', items: [{ id: 'fn', h: 'Y =', pts: 5, tipo: 'op' }] },
      { t: 'c) Solo con NAND', html: 'Armas este mismo circuito solo con NAND de 2 entradas, con el <b>método NAND–NAND de dos niveles</b>: cada AND y la OR se cambian por una NAND, y cada inversor es una NAND con sus dos entradas unidas. ¿Cuántas compuertas NAND hacen falta en total?',
        items: [{ id: 'nn', h: 'Cantidad de NAND', pts: 6, tol: EX }] }
    ],
    ops: (d) => [d.pu].concat(d.dis).map((p) => ({ t: sopT(p, N3) })),
    esperado: (d) => espBits('y', d.f, { nn: [4] }),
    final: (d) => [
      `<div class="pd-fig">${K.tablaHTML(3, d.f, { salida: 'Y' })}</div>`,
      `Y = ${sopT(d.pu, N3)}`,
      '<p>NAND–NAND: una NAND por cada producto (2), una NAND como inversor para la variable negada (1) y la NAND de salida en lugar de la OR (1): <b>4 compuertas</b>. Los dos inversores que aparecen entre los dos niveles se cancelan; por eso no se cuentan.</p>']
  };

  // ===== P3: mapa de Karnaugh de 4 variables con X (10) =====
  P.p3 = {
    titulo: 'Mapa de Karnaugh con X', max: 10,
    gen: (r) => mapaConX(r),
    enunciado: (d) => `<p>Simplifica este mapa. Las <b>X</b> son condiciones que no importan.</p><div class="pd-fig">${K.estatico(4, d.f, {})}</div>`,
    pasos: () => [{ t: 'Expresión mínima', items: [{ id: 'ma', h: 'Expresión mínima de F (suma de productos)', pts: 8, tipo: 'op' }, { id: 'nt', h: 'Cantidad de términos (grupos)', pts: 2, tol: EX }] }],
    ops: (d) => [d.mi].concat(d.dis).map((p) => ({ t: sopT(p, N4) })),
    esperado: (d) => ({ nt: [d.nt] }),
    final: (d) => [mapaSol(4, d.f, N4), 'F = ' + sopT(d.mi, N4), `<p>${d.nt} grupos. Las X se toman como 1 solo donde agrandan un grupo.</p>`]
  };

  // ===== P4: nudo de tuberías (25), adaptado del ejercicio 19 =====
  // Entradas A, B, C, D con caudales propios (múltiplos de 5); salidas SA, SB, SC, SD de 5, 10, 20 y 40 L/min.
  // Nunca hay agua en más de dos entradas a la vez (3 o 4 sensores = X). Sale lo mismo que entra: caudal/5 en binario = SD SC SB SA.
  const SALT = ['SA', 'SB', 'SC', 'SD'], SALH = ['S<sub>A</sub>', 'S<sub>B</sub>', 'S<sub>C</sub>', 'S<sub>D</sub>'];
  const STX = ['S_A', 'S_B', 'S_C', 'S_D'];
  const funcionesTub = (q) => [0, 1, 2, 3].map((b) => Array.from({ length: 16 }, (_, m) => {
    const on = [0, 1, 2, 3].filter((i) => (m >> (3 - i)) & 1);
    if (on.length > 2) return 2;
    const t = on.reduce((s, i) => s + q[i], 0) / 5;
    return (t >> b) & 1;
  }));
  const nandT = (pu, n) => '\\overline{' + pu.map((g) => '\\overline{' + sopT([g], n) + '}').join('\\cdot ') + '}';
  P.p4 = {
    titulo: 'Nudo de tuberías', max: 25,
    gen(r) {
      for (let t = 0; t < 300; t++) {
        const q = RC.mezclar(r, [5, 10, 15, 20, 25, 30, 35, 40]).slice(0, 4);
        if (q.filter((x) => [5, 10, 20, 40].includes(x)).length > 2) continue;
        const f = funcionesTub(q);
        if (f.some((g) => !g.includes(1) || !g.includes(0))) continue;
        if (!f.every((g) => unica(4, g))) continue;
        const mi = f.map((g) => deCubos(4, K.resolver(4, g).cubos));
        const dis = f.map((g, i) => distractores(r, mi[i], g, 4, 3));
        if (dis.some((x) => x.length < 3)) continue;
        if (mi[1].length < 2) continue;
        return { q, f, mi, dis };
      }
      return null;
    },
    figura: (d) => {
      const xs = [52, 127, 202, 277], N = ['A', 'B', 'C', 'D'];
      let s = '<svg class="pd-tub" viewBox="0 0 330 250">';
      xs.forEach((x, i) => {
        s += `<text x="${x}" y="9" text-anchor="middle" class="pt-t">${N[i]}</text><text x="${x}" y="21" text-anchor="middle" class="pt-n">${d.q[i]} L/min</text>`;
        s += `<path d="M${x - 9},24 V82 M${x + 9},24 V82" class="pt-tubo"/><path d="M${x},28 V70" class="pt-flecha" marker-end="url(#pt-fl)"/>`;
        s += `<circle cx="${x + 9}" cy="58" r="5" class="pt-sensor"/>`;
      });
      s += '<defs><marker id="pt-fl" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#1d4f86"/></marker></defs>';
      s += '<rect x="30" y="82" width="270" height="44" rx="10" class="pt-nudo"/><text x="165" y="109" text-anchor="middle" class="pt-t">nudo</text>';
      xs.forEach((x, i) => {
        s += `<path d="M${x - 9},126 V196 M${x + 9},126 V196" class="pt-tubo"/><path d="M${x},176 V214" class="pt-flecha" marker-end="url(#pt-fl)"/>`;
        s += `<path d="M${x - 9},146 L${x + 9},162 V146 L${x - 9},162 Z" class="pt-valv"/>`;
        s += `<text x="${x}" y="230" text-anchor="middle" class="pt-t">S<tspan dy="3" class="pt-sub">${'ABCD'[i]}</tspan></text><text x="${x}" y="244" text-anchor="middle" class="pt-n">${[5, 10, 20, 40][i]} L/min</text>`;
      });
      return s + '</svg>';
    },
    enunciado: (d) => `<p>En un nudo de tuberías entran 4 tuberías y salen 4. Las de entrada aportan <b>A: ${d.q[0]}</b>, <b>B: ${d.q[1]}</b>, <b>C: ${d.q[2]}</b> y <b>D: ${d.q[3]}</b> litros por minuto; cada una tiene un sensor que vale 1 cuando por ella circula agua. Las de salida S<sub>A</sub>, S<sub>B</sub>, S<sub>C</sub> y S<sub>D</sub> pueden recoger 5, 10, 20 y 40 litros por minuto; cada una tiene una válvula que solo puede estar cerrada (0) o abierta (1).</p>
      <p>Nunca circula agua por más de dos tuberías de entrada a la vez. Hay que abrir las válvulas necesarias para que salga tanto caudal como entra.</p>
      <div class="pd-fig">${P.p4.figura(d)}</div><p class="mp-nota">En la figura, los puntos rojos son los sensores y los símbolos azules de las salidas son las válvulas.</p>`,
    pasos: (d) => {
      const v = d && d.f, it = [];
      for (let m = 0; m < 16; m++) for (let s = 0; s < 4; s++) it.push({ id: 's' + 'abcd'[s] + m, m, s, tipo: 'bit', bits: bin(m, 4), pts: 0.125, h: SALT[s] + ' (ABCD = ' + bin(m, 4) + ')', txt: v ? (d.f[s][m] === 2 ? 'X' : String(d.f[s][m])) : null });
      return [
        { t: 'a) Tabla de verdad de las cuatro válvulas', html: 'Las combinaciones que nunca ocurren van con <b>X</b>. Toca cada casilla: ? → 1 → 0 → X.', tabla: { cols: N4, salidas: SALH, x: true }, items: it },
        { t: 'b) Funciones simplificadas', html: 'Elige la forma mínima (suma de productos) de cada válvula.', items: SALT.map((n, s) => ({ id: 'm' + s, h: SALH[s] + ' =', pts: 3, tipo: 'op' })) },
        { t: 'c) La válvula SB solo con NAND', html: 'Implementas la válvula S<sub>B</sub> solo con compuertas NAND, en dos niveles. ¿Qué expresión corresponde a ese circuito?', items: [{ id: 'nd', h: 'S<sub>B</sub> =', pts: 5, tipo: 'op' }] }];
    },
    ops(d, id) {
      if (id === 'nd') {
        const m = d.mi[1];
        const c = [nandT(m, N4), m.map((g) => '\\overline{' + sopT([g], N4) + '}').join('\\cdot '), '\\overline{' + m.map((g) => '\\overline{' + sopT([g], N4) + '}').join(' + ') + '}', nandT(d.dis[1][0], N4)];
        return c.map((t) => ({ t }));
      }
      const s = +id.slice(1);
      return [d.mi[s]].concat(d.dis[s]).map((p) => ({ t: sopT(p, N4) }));
    },
    esperado(d) { const e = {}; for (let s = 0; s < 4; s++) d.f[s].forEach((v, m) => { e['s' + 'abcd'[s] + m] = v === 2 ? 'X' : String(v); }); return e; },
    final(d) {
      const fila = (m) => { const on = [0, 1, 2, 3].filter((i) => (m >> (3 - i)) & 1); if (on.length > 2) return '<td>—</td><td>X</td><td>X</td><td>X</td><td>X</td>';
        const t = on.reduce((s, i) => s + d.q[i], 0); return `<td>${t}</td>` + [0, 1, 2, 3].map((b) => `<td>${((t / 5) >> b) & 1}</td>`).join(''); };
      const tabla = '<div class="mp-tabla-scroll"><table class="tt tight"><tr><th>A</th><th>B</th><th>C</th><th>D</th><th>L/min</th>' + SALH.map((h) => `<th>${h}</th>`).join('') + '</tr>' +
        Array.from({ length: 16 }, (_, m) => '<tr>' + bin(m, 4).split('').map((x) => `<td>${x}</td>`).join('') + fila(m) + '</tr>').join('') + '</table></div>';
      return ['<p><b>a)</b> Como las salidas valen 5, 10, 20 y 40, el caudal dividido entre 5 escrito en binario da directamente S<sub>D</sub> S<sub>C</sub> S<sub>B</sub> S<sub>A</sub>. Con 3 o 4 entradas a la vez es X.</p>', tabla,
        '<p><b>b)</b></p>'].concat(...[0, 1, 2, 3].map((s) => [mapaSol(4, d.f[s], N4), STX[s] + ' = ' + sopT(d.mi[s], N4)]))
        .concat(['<p><b>c)</b> Se niega dos veces la suma de productos y se aplica De Morgan: cada producto pasa a una NAND y la OR de salida pasa a otra NAND.</p>', 'S_B = ' + nandT(d.mi[1], N4)]);
    }
  };

  // ===== P5 y P6: análisis de contadores síncronos de 3 bits (T y JK), adaptados de los ejercicios 32 y 29 =====
  // Estado m = Q2 Q1 Q0 (Q2 vale 4, Q1 vale 2, Q0 vale 1). Literal c = 2·i + negada (Qi o Q̄i).
  // Expresión de una entrada: { k: '1' } | { k: 'l', c } | { k: 'g', g, a, b } (compuerta de dos literales).
  const valL = (c, m) => ((m >> (c >> 1)) & 1) ^ (c & 1);
  const valE = (e, m) => {
    if (e.k === '1') return 1;
    if (e.k === 'l') return valL(e.c, m);
    const a = valL(e.a, m), b = valL(e.b, m);
    return { and: a & b, or: a | b, xor: a ^ b, xnor: 1 - (a ^ b), nand: 1 - (a & b), nor: 1 - (a | b) }[e.g];
  };
  const litQ = (c) => (c & 1 ? '\\overline{Q_' + (c >> 1) + '}' : 'Q_' + (c >> 1));
  const texE = (e) => {
    if (e.k === '1') return '1';
    if (e.k === 'l') return litQ(e.c);
    const a = litQ(e.a), b = litQ(e.b);
    return { and: a + '\\cdot ' + b, or: a + ' + ' + b, xor: a + '\\oplus ' + b, xnor: '\\overline{' + a + '\\oplus ' + b + '}', nand: '\\overline{' + a + '\\cdot ' + b + '}', nor: '\\overline{' + a + ' + ' + b + '}' }[e.g];
  };
  const b3 = (m) => bin(m, 3);
  const ESTADOS = [0, 1, 2, 3, 4, 5, 6, 7];
  // recorrido desde 000: estados distintos, ciclo y los que nunca aparecen
  function recorrer(sig) {
    const seq = [0], vis = new Set([0]);
    let s = 0;
    for (;;) { s = sig[s]; seq.push(s); if (vis.has(s)) break; vis.add(s); }
    const i0 = seq.indexOf(s);
    return { seq, ciclo: seq.slice(i0, seq.length - 1), libres: ESTADOS.filter((m) => !vis.has(m)), vis };
  }
  const camino = (sig, n) => { const o = []; let s = 0; for (let k = 0; k < n; k++) { s = sig[s]; o.push(s); } return o; };
  // qué pasa con un estado que no está en la secuencia
  const DESTINO = {
    E: 'Entra a la secuencia y sigue contando normalmente',
    F: 'Se queda en ese estado para siempre: el contador se traba',
    O: 'Pasa a otro estado que no está en la secuencia y se traba ahí',
    C: 'Da vueltas en otro ciclo, fuera de la secuencia'
  };
  function destino(sig, u, vis) {
    const visto = [u];
    let s = u;
    for (;;) { s = sig[s]; if (vis.has(s)) return { tipo: 'E', ruta: visto.concat([s]) }; if (visto.includes(s)) break; visto.push(s); }
    const lazo = visto.slice(visto.indexOf(s));
    const ruta = visto.concat([s]);
    if (lazo.length === 1) return { tipo: lazo[0] === u ? 'F' : 'O', ruta };
    return { tipo: 'C', ruta };
  }
  // elige una expresión al azar para una entrada
  const exprAzar = (r, i, puedeG) => {
    const x = r();
    if (puedeG && x < 0.35) {
      const par = RC.mezclar(r, [0, 1, 2]).slice(0, 2).sort();
      return { k: 'g', g: elegir(r, ['and', 'or', 'xor', 'xor', 'xnor', 'nand', 'nor']), a: 2 * par[0] + (r() < 0.2 ? 1 : 0), b: 2 * par[1] + (r() < 0.2 ? 1 : 0) };
    }
    if (x < 0.5) return { k: '1' };
    const j = elegir(r, [0, 1, 2].filter((z) => z !== i));
    return { k: 'l', c: 2 * j + (r() < 0.45 ? 1 : 0) };
  };
  const nGates = (L) => L.filter((e) => e.k === 'g').length;
  function genContador(r, tipo) {
    for (let t = 0; t < 4000; t++) {
      let ent0, sig;
      if (tipo === 'T') {
        ent0 = { T: [0, 1, 2].map((i) => exprAzar(r, i, true)) };
        const L = ent0.T;
        if (nGates(L) !== 1 || L.filter((e) => e.k === '1').length > 1) continue;
        sig = ESTADOS.map((m) => m ^ (valE(L[0], m) | (valE(L[1], m) << 1) | (valE(L[2], m) << 2)));
      } else {
        ent0 = { J: [0, 1, 2].map((i) => exprAzar(r, i, true)), K: [0, 1, 2].map((i) => exprAzar(r, i, true)) };
        const L = ent0.J.concat(ent0.K);
        if (nGates(L) < 1 || nGates(L) > 2 || L.filter((e) => e.k === '1').length > 2) continue;
        sig = ESTADOS.map((m) => { let n = 0; for (let i = 0; i < 3; i++) { const q = (m >> i) & 1, j = valE(ent0.J[i], m), k = valE(ent0.K[i], m); n |= ((j & (1 - q)) | ((1 - k) & q)) << i; } return n; });
      }
      const rec = recorrer(sig);
      if (rec.vis.size < 5 || rec.ciclo.length < 4 || !rec.libres.length) continue;
      const des = rec.libres.map((u) => ({ u, ...destino(sig, u, rec.vis) }));
      const raros = des.filter((x) => x.tipo !== 'E');
      const tr = raros.length && r() < 0.7 ? elegir(r, raros) : elegir(r, des);
      return { tipo, ent: ent0, sig, rec, tr, cam: camino(sig, 8) };
    }
    return null;
  }

  // ---------- dibujo del contador (flip-flops uno debajo del otro; entradas con etiquetas de red) ----------
  function compuerta(g, x, y) {
    // compuerta de 2 entradas con salida en (x + 30…37, y); entradas en (x, y ± 10)
    const y0 = y - 17, y1 = y + 17;
    let s = '';
    const bur = (xx) => `<circle cx="${xx + 3.5}" cy="${y}" r="3.5" class="cg"/>`;
    if (g === 'and' || g === 'nand') { s += `<path d="M${x},${y0} H${x + 12} A17,17 0 0 1 ${x + 12},${y1} H${x} Z" class="cg"/>`; if (g === 'nand') s += bur(x + 29); }
    else {
      const ox = g === 'xor' || g === 'xnor' ? x + 5 : x;
      if (ox !== x) s += `<path d="M${x - 1},${y0} Q${x + 9},${y} ${x - 1},${y1}" class="cw" fill="none"/>`;
      s += `<path d="M${ox},${y0} Q${ox + 10},${y} ${ox},${y1} Q${ox + 20},${y1} ${ox + 30},${y} Q${ox + 20},${y0} ${ox},${y0} Z" class="cg"/>`;
      if (ox !== x) s += `<line x1="${x - 1}" y1="${y - 10}" x2="${x + 6}" y2="${y - 10}" class="cw"/><line x1="${x - 1}" y1="${y + 10}" x2="${x + 6}" y2="${y + 10}" class="cw"/>`;
      else s += `<line x1="${x}" y1="${y - 10}" x2="${x + 5}" y2="${y - 10}" class="cw"/><line x1="${x}" y1="${y + 10}" x2="${x + 5}" y2="${y + 10}" class="cw"/>`;
      if (g === 'nor' || g === 'xnor') s += bur(ox + 30);
    }
    return s;
  }
  function etiquetaQ(x, y, c) {
    // etiqueta de red «Qj» con inversor si el literal es negado; termina en x + 64
    let s = `<rect x="${x}" y="${y - 9}" width="28" height="18" rx="5" class="ct-red"/><text x="${x + 14}" y="${y + 4}" text-anchor="middle" class="ct-t">Q${c >> 1}</text>`;
    if (c & 1) s += `<line x1="${x + 28}" y1="${y}" x2="${x + 34}" y2="${y}" class="cw"/><path d="M${x + 34},${y - 7} L${x + 48},${y} L${x + 34},${y + 7} Z" class="cg"/><circle cx="${x + 51}" cy="${y}" r="3" class="cg"/><line x1="${x + 54}" y1="${y}" x2="${x + 64}" y2="${y}" class="cw"/>`;
    else s += `<line x1="${x + 28}" y1="${y}" x2="${x + 64}" y2="${y}" class="cw"/>`;
    return s;
  }
  function entrada(e, xp, y) {
    // dibuja lo que llega a un pin en (xp, y)
    if (e.k === '1') return `<text x="${xp - 46}" y="${y + 4}" class="ct-t">Vcc</text><line x1="${xp - 18}" y1="${y}" x2="${xp}" y2="${y}" class="cw"/><line x1="${xp - 18}" y1="${y - 6}" x2="${xp - 18}" y2="${y + 6}" class="cw"/>`;
    if (e.k === 'l') return etiquetaQ(xp - 64, y, e.c);
    const gx = xp - 54;
    return etiquetaQ(gx - 64, y - 10, e.a) + etiquetaQ(gx - 64, y + 10, e.b) + compuerta(e.g, gx, y) + `<line x1="${gx + (e.g === 'and' ? 29 : e.g === 'nand' ? 36 : e.g === 'or' ? 30 : e.g === 'nor' ? 37 : e.g === 'xor' ? 35 : 42)}" y1="${y}" x2="${xp}" y2="${y}" class="cw"/>`;
  }
  RC.svgContador = (d) => {
    const jk = d.tipo === 'JK', H = jk ? 118 : 78, BX = 190, BW = 66;
    let s = '';
    for (let i = 0; i < 3; i++) {
      const y0 = 14 + i * H, yc = y0 + (jk ? 42 : 26);
      const bh = jk ? 96 : 54;
      s += `<rect x="${BX}" y="${y0}" width="${BW}" height="${bh}" class="ct-ff"/>`;
      if (jk) {
        s += `<text x="${BX + 5}" y="${yc - 14}" class="ct-p">J${i}</text><text x="${BX + 5}" y="${yc + 23}" class="ct-p">K${i}</text>`;
        s += entrada(d.ent.J[i], BX, yc - 18) + entrada(d.ent.K[i], BX, yc + 19);
      } else {
        s += `<text x="${BX + 5}" y="${yc - 4}" class="ct-p">T${i}</text>` + entrada(d.ent.T[i], BX, yc - 8);
      }
      const yck = y0 + bh - 10;
      s += `<path d="M${BX},${yck - 7} L${BX + 9},${yck} L${BX},${yck + 7}" class="cw" fill="none"/><text x="${BX + 12}" y="${yck + 4}" class="ct-c">CLK</text>`;
      s += `<text x="${BX + BW - 5}" y="${y0 + 18}" text-anchor="end" class="ct-p">Q${i}</text><line x1="${BX + BW}" y1="${y0 + 14}" x2="${BX + BW + 22}" y2="${y0 + 14}" class="cw"/>`;
      s += `<rect x="${BX + BW + 22}" y="${y0 + 5}" width="28" height="18" rx="5" class="ct-red ct-sal"/><text x="${BX + BW + 36}" y="${y0 + 18}" text-anchor="middle" class="ct-t">Q${i}</text>`;
    }
    return `<svg class="circ ct-svg" viewBox="0 0 352 ${14 + 3 * H}">${s}</svg>`;
  };

  // tabla de estados para la solución
  function tablaSol(d) {
    const cab = d.tipo === 'T' ? '<th>T<sub>2</sub></th><th>T<sub>1</sub></th><th>T<sub>0</sub></th>' : [2, 1, 0].map((i) => `<th>J<sub>${i}</sub></th><th>K<sub>${i}</sub></th>`).join('');
    return '<div class="mp-tabla-scroll"><table class="tt tight"><tr><th>Q<sub>2</sub>Q<sub>1</sub>Q<sub>0</sub></th>' + cab + '<th>siguiente</th></tr>' +
      ESTADOS.map((m) => `<tr><td>${b3(m)} (${m})</td>` + (d.tipo === 'T' ? [2, 1, 0].map((i) => `<td>${valE(d.ent.T[i], m)}</td>`).join('') : [2, 1, 0].map((i) => `<td>${valE(d.ent.J[i], m)}</td><td>${valE(d.ent.K[i], m)}</td>`).join('')) + `<td>${b3(d.sig[m])} (${d.sig[m]})</td></tr>`).join('') + '</table></div>';
  }
  const QH = (i, mas) => 'Q<sub>' + i + '</sub>' + (mas ? '<sup>+</sup>' : '');
  function contador(tipo, max) {
    const jk = tipo === 'JK';
    const pIn = jk ? 0.125 : 0.25;
    return {
      titulo: jk ? 'Contador con flip-flops JK' : 'Contador con flip-flops T', max,
      gen: (r) => genContador(r, tipo),
      enunciado: (d) => `<p>El contador de la figura tiene tres flip-flops ${jk ? 'JK' : 'T'} que cambian con el <b>flanco de subida</b> del mismo reloj CLK. El estado inicial es <b>000</b> (Q<sub>2</sub> = Q<sub>1</sub> = Q<sub>0</sub> = 0). Cada estado se escribe Q<sub>2</sub>Q<sub>1</sub>Q<sub>0</sub>; en decimal, Q<sub>2</sub> vale 4, Q<sub>1</sub> vale 2 y Q<sub>0</sub> vale 1.</p>
        <p class="mp-nota">Cada entrada lleva el nombre de la salida a la que está conectada.</p><div class="pd-fig ct-fig">${RC.svgContador(d)}</div>
`,
      pasos(d) {
        const v = d && d.sig, IN = [], NX = [], SQ = [], CR = [];
        ESTADOS.forEach((m) => {
          (jk ? [[2, 'j'], [2, 'k'], [1, 'j'], [1, 'k'], [0, 'j'], [0, 'k']] : [[2, 't'], [1, 't'], [0, 't']]).forEach(([i, l], s) => {
            const e = v ? valE(jk ? d.ent[l.toUpperCase()][i] : d.ent.T[i], m) : null;
            IN.push({ id: l + i + '_' + m, m, s, tipo: 'bit', bits: b3(m), pts: pIn, h: l.toUpperCase() + i + ' (Q2Q1Q0 = ' + b3(m) + ')', txt: v ? String(e) : null });
          });
          [2, 1, 0].forEach((i, s) => NX.push({ id: 'n' + i + '_' + m, m, s, tipo: 'bit', bits: b3(m), pts: 0.25, h: 'Q' + i + '⁺ (Q2Q1Q0 = ' + b3(m) + ')', txt: v ? String((d.sig[m] >> i) & 1) : null }));
        });
        for (let k = 1; k <= 8; k++) SQ.push({ id: 's' + k, h: 'Pulso ' + k, pts: 0.375, tol: EX });
        [0, 1, 2].forEach((i) => { for (let k = 1; k <= 8; k++) CR.push({ id: 'w' + i + '_' + k, sg: i, k, tipo: 'bit', pts: 0.125, h: 'Q' + i + ' después del pulso ' + k, txt: v ? String((d.cam[k - 1] >> i) & 1) : null }); });
        const colsIn = jk ? [2, 1, 0].reduce((a, i) => a.concat(['J<sub>' + i + '</sub>', 'K<sub>' + i + '</sub>']), []) : [2, 1, 0].map((i) => 'T<sub>' + i + '</sub>');
        return [
          { t: 'a) Entradas de los flip-flops', html: 'Para cada estado presente, el valor de cada entrada.', tabla: { cols: [QH(2) + QH(1) + QH(0)], junto: true, salidas: colsIn, x: false }, items: IN },
          { t: 'b) Estado siguiente', html: 'Para cada estado presente, el estado después del flanco de reloj.', tabla: { cols: [QH(2) + QH(1) + QH(0)], junto: true, salidas: [QH(2, 1), QH(1, 1), QH(0, 1)], x: false }, items: NX },
          { t: 'c) Secuencia desde 000', html: 'Escribe, en decimal, el estado después de cada pulso de reloj.', items: SQ },
          { t: 'd) Cronograma', html: 'Marca Q<sub>0</sub>, Q<sub>1</sub> y Q<sub>2</sub> después de cada pulso: toca cada casilla (arriba = 1; abajo = 0).', crono: { sen: [0, 1, 2].map((i) => ({ i, h: QH(i) })), n: 8 }, items: CR },
          { t: 'e) Un estado que no está en la secuencia', html: v ? `Si al encender el contador aparece el estado <b>${d.tr.u}</b> (${b3(d.tr.u)}), ¿qué pasa después?` : '', items: [{ id: 'tr', h: 'Después de encender', pts: 2, tipo: 'op', fila: true }] }];
      },
      ops: (d) => { const c = d.tr.tipo; return [DESTINO[c]].concat(Object.keys(DESTINO).filter((k) => k !== c).map((k) => DESTINO[k])).map((h) => ({ h })); },
      // con los números del estudiante: el siguiente se revisa con sus propias entradas; la secuencia, con su tabla; el cronograma, con su secuencia
      esperado(d, vals) {
        vals = vals || {};
        const e = {}, vb = (id) => (vals[id] === '0' || vals[id] === '1' ? +vals[id] : null);
        const propio = [];
        ESTADOS.forEach((m) => {
          let sp = 0;
          for (let i = 0; i < 3; i++) {
            const q = (m >> i) & 1, cor = (d.sig[m] >> i) & 1;
            if (!jk) e['t' + i + '_' + m] = String(valE(d.ent.T[i], m));
            if (jk) { e['j' + i + '_' + m] = String(valE(d.ent.J[i], m)); e['k' + i + '_' + m] = String(valE(d.ent.K[i], m)); }
            let suyo = null;
            if (jk) { const J = vb('j' + i + '_' + m), Kk = vb('k' + i + '_' + m); if (J != null && Kk != null) suyo = (J & (1 - q)) | ((1 - Kk) & q); }
            else { const T = vb('t' + i + '_' + m); if (T != null) suyo = q ^ T; }
            e['n' + i + '_' + m] = suyo == null || suyo === cor ? [String(cor)] : [String(suyo), String(cor)];
            const nx = vb('n' + i + '_' + m);
            sp |= (nx == null ? cor : nx) << i;
          }
          propio[m] = sp;
        });
        const suyoCam = camino(propio, 8);
        const sec = [];
        for (let k = 1; k <= 8; k++) {
          e['s' + k] = suyoCam[k - 1] === d.cam[k - 1] ? [d.cam[k - 1]] : [suyoCam[k - 1], d.cam[k - 1]];
          const q = RC.leer(vals['s' + k]);
          sec.push(!q.vacio && !q.invalido && Number.isInteger(q.v) && q.v >= 0 && q.v <= 7 ? q.v : suyoCam[k - 1]);
        }
        for (let i = 0; i < 3; i++) for (let k = 1; k <= 8; k++) {
          const a = String((sec[k - 1] >> i) & 1), b = String((d.cam[k - 1] >> i) & 1);
          e['w' + i + '_' + k] = a === b ? [b] : [a, b];
        }
        return e;
      },
      final(d) {
        const r = d.rec, cam = [0].concat(d.cam);
        const ondas = '<div class="mp-tabla-scroll"><table class="tt tight"><tr><th>pulso</th>' + cam.map((_, k) => `<th>${k === 0 ? 'inicio' : k}</th>`).join('') + '</tr>' +
          [0, 1, 2].map((i) => `<tr><th>${QH(i)}</th>` + cam.map((m) => `<td>${(m >> i) & 1}</td>`).join('') + '</tr>').join('') + '</table></div>';
        const t = d.tr;
        return [`<p><b>a) y b)</b> Se evalúa cada entrada en cada estado presente y se aplica el flip-flop ${jk ? 'JK (J = 1, K = 0 pone 1; J = 0, K = 1 pone 0; J = K = 1 cambia; J = K = 0 mantiene)' : 'T (T = 1 cambia; T = 0 mantiene)'}:</p>`, tablaSol(d),
          `<p><b>c)</b> Desde 000: ${r.seq.map((m) => `${m}`).join(' → ')}. El ciclo es ${r.ciclo.join(' → ')} → ${r.ciclo[0]} (${r.ciclo.length} estados)${r.ciclo.includes(0) ? '' : '; el 000 no se repite'}. Estados que nunca aparecen: ${r.libres.join('; ')}.</p>`,
          '<p><b>d)</b> El cronograma son los bits de cada estado de la secuencia:</p>', ondas,
          `<p><b>e)</b> Desde ${t.u}: ${t.ruta.join(' → ')}. ${DESTINO[t.tipo]}.</p>`];
      }
    };
  }
  P.p5 = contador('T', 20);
  P.p6 = contador('JK', 20);

  RC.P = P;
  RC.PROB = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
  RC.MAX = Object.fromEntries(RC.PROB.map((k) => [k, P[k].max]));
  RC.TITULO = Object.fromEntries(RC.PROB.map((k, i) => [k, 'P' + (i + 1)]));
  RC.NOMBRE = Object.fromEntries(RC.PROB.map((k) => [k, P[k].titulo]));

  // datos de un problema para un carnet
  const cache = {};
  RC.datos = (k, carnet) => {
    const clave = k + '|' + carnet;
    if (cache[clave]) return cache[clave];
    let d = null;
    for (let i = 0; !d && i < 20; i++) d = P[k].gen(RC.rng(String(carnet) + '|d1-ex2|' + k + (i ? '|' + i : '')));
    d.prob = k;
    d.op = {};
    P[k].pasos(d).forEach((ps) => ps.items.forEach((it) => {
      if (it.tipo !== 'op') return;
      const lista = P[k].ops(d, it.id).map((o, i) => ({ ...o, ok: i === 0 }));
      d.op[it.id] = RC.mezclar(RC.rng(String(carnet) + '|d1-ex2|' + k + '|' + it.id), lista);
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
    const esp = P[k].esperado(d, vals);
    const cel = {};
    let pts = 0;
    items.forEach((it) => {
      const v = vals[it.id];
      let r;
      if (it.tipo === 'op') {
        const ok = d.op[it.id].findIndex((o) => o.ok);
        r = v == null || v === '' ? 'vacio' : Number(v) === ok ? 'ok' : 'mal';
        cel[it.id] = { r, exp: ok, pts: r === 'ok' ? it.pts : 0, max: it.pts };
      } else if (it.tipo === 'bit') {
        const lista = [].concat(esp[it.id]).map(String);
        const s = v == null ? '' : String(v).trim().toUpperCase();
        r = s === '' ? 'vacio' : lista.includes(s) ? 'ok' : 'mal';
        cel[it.id] = { r, exp: lista[0], pts: r === 'ok' ? it.pts : 0, max: it.pts };
      } else {
        const lista = [].concat(esp[it.id]);
        const q = RC.leer(v);
        r = q.vacio ? 'vacio' : q.invalido ? 'mal' : lista.some((e) => RC.cerca(q.v, e, it.tol)) ? 'ok' : 'mal';
        cel[it.id] = { r, exp: lista[0], pts: r === 'ok' || it.anulada ? it.pts : 0, max: it.pts, anulada: !!it.anulada };
      }
      pts += cel[it.id].pts;
    });
    return { pts: Math.round(pts * 1000) / 1000, max: RC.MAX[k], cel }; // casillas de 0,125: se guardan los 3 decimales
  };

  RC.nota = (carnet, est) => {
    const res = {};
    let total = 0;
    RC.PROB.forEach((k) => { res[k] = RC.calificar(k, RC.datos(k, carnet), (est && est[k] && est[k].vals) || {}); total += res[k].pts; });
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
