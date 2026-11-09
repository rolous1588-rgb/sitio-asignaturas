// ============================================================
// Electrónica Digital 1 · parcial por celular (09/11/2026) — problemas y calificación
// Mismo espacio RC que el 2.º parcial de Medidas (medidas/parcial2/js/pm-motor.js), con otros problemas.
// 6 problemas con datos propios por carnet (100 pts):
//   P1 conversiones (10); P2 simplificación con Boole y De Morgan (15); P3 circuito, tabla y NAND (20);
//   P4 diseño de dos aplicaciones, de 3 y 4 variables (20); P5 tres mapas de Karnaugh (25); P6 XOR y paridad (10)
// Tablas de verdad y mapas: casillas tipo 'bit' (el estudiante toca: 1, 0 o X), calificadas exactas.
// Regla del docente: toda cantidad en ceros y unos va junta (sin separar de 4 en 4) y el enunciado
// dice en qué código está. Las casillas aceptan solo el valor exacto (0 y 1 se escriben tal cual).
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

  // ===== P1: conversiones (10) =====
  // En d) y e) el BCD se da con 6 bits (sin los ceros de la izquierda): el estudiante debe agrupar desde la derecha y completar.
  const sinCeros = (s) => s.replace(/^0+/, '');
  P.p1 = {
    titulo: 'Conversiones', max: 10,
    gen(r) {
      let a; do { a = ent(r, 37, 250); } while (unos(bin(a)) < 3);
      let b; do { b = ent(r, 41, 250); } while (b === a || unos(bin(b)) < 3);
      let c; do { c = ent(r, 13, 98); } while (c % 11 === 0);
      let dd; do { dd = ent(r, 21, 39); } while (dd % 10 === 0 || dd % 11 === 0);
      let e; do { e = ent(r, 21, 39); } while (e % 10 === 0 || e === dd);
      return { a, b, c, dd, e };
    },
    enunciado: () => '<p>Resuelve cada inciso en tu hoja auxiliar y escribe la respuesta en su casilla, <b>solo con ceros y unos</b> (o el número decimal), sin espacios.</p>',
    pasos: (d) => { const v = d && d.a != null; return [
      { t: 'a) Decimal → binario', html: v ? `La siguiente cantidad está en <b>decimal</b>: <b class="pd-dato">${d.a}</b>. Conviértela a <b>binario</b>.` : '', items: [{ id: 'a', h: 'a) En binario', pts: 2, tol: EX, txt: v ? bin(d.a) : null }] },
      { t: 'b) Binario → decimal', html: v ? `La siguiente cantidad está en <b>binario</b>: ${bits(bin(d.b, 8))}. Conviértela a <b>decimal</b>.` : '', items: [{ id: 'b', h: 'b) En decimal', pts: 2, tol: EX }] },
      { t: 'c) Decimal → BCD', html: v ? `La siguiente cantidad está en <b>decimal</b>: <b class="pd-dato">${d.c}</b>. Conviértela a <b>BCD</b>.` : '', items: [{ id: 'c', h: 'c) En BCD', pts: 2, tol: EX, txt: v ? bcd(d.c) : null }] },
      { t: 'd) BCD → decimal', html: v ? `La siguiente cantidad está en <b>BCD</b>: ${bits(sinCeros(bcd(d.dd)))}. Conviértela a <b>decimal</b>.` : '', items: [{ id: 'd', h: 'd) En decimal', pts: 2, tol: EX }] },
      { t: 'e) BCD → binario', html: v ? `La siguiente cantidad está en <b>BCD</b>: ${bits(sinCeros(bcd(d.e)))}. Conviértela a <b>binario</b>.` : '', items: [{ id: 'e', h: 'e) En binario', pts: 2, tol: EX, txt: v ? bin(d.e) : null }] }]; },
    ops: () => [],
    esperado: (d) => ({ a: [Number(bin(d.a))], b: [d.b], c: [Number(bcd(d.c))], d: [d.dd], e: [Number(bin(d.e))] }),
    final(d) {
      const dig = (n) => String(n).split('').map((c) => c + ' → ' + bin(+c, 4)).join('; ');
      const g = (s) => s.match(/.{4}/g).join(' | ');
      const corto = (n) => { const s = sinCeros(bcd(n)); return s.slice(0, s.length - 4) + ' | ' + s.slice(-4); };
      return [
        `<p><b>a)</b> Se restan los pesos que caben: ${d.a} = ${pesos(d.a).join(' + ')} → ${bits(bin(d.a))}</p>`,
        `<p><b>b)</b> Se suman los pesos de los unos: ${bits(bin(d.b, 8))} = ${pesos(d.b).join(' + ')} = <b>${d.b}</b></p>`,
        `<p><b>c)</b> Cada dígito con sus 4 bits: ${dig(d.c)} → ${bits(bcd(d.c))}</p>`,
        `<p><b>d)</b> Se agrupa de 4 en 4 <b>desde la derecha</b> y se completa con ceros a la izquierda: ${corto(d.dd)} → ${g(bcd(d.dd))} → <b>${d.dd}</b></p>`,
        `<p><b>e)</b> Primero a decimal (agrupando desde la derecha): ${corto(d.e)} → ${g(bcd(d.e))} → ${d.e}; después a binario: ${d.e} = ${pesos(d.e).join(' + ')} → ${bits(bin(d.e))}</p>`];
    }
  };

  // ===== P2: simplificación con álgebra de Boole y De Morgan (15) =====
  // Tres funciones de 3 variables, de tipos distintos: suma de mintérminos, suma negada (De Morgan),
  // producto de sumas o suma con términos que sobran (consenso). Se elige la forma mínima.
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
  P.p2 = {
    titulo: 'Álgebra de Boole y De Morgan', max: 15,
    gen(r) {
      const tipos = RC.mezclar(r, ['dm', RC.mezclar(r, ['can', 'red'])[0], 'pos']);
      const q = tipos.map((t) => simp(r, t));
      return q.every(Boolean) ? { q } : null;
    },
    enunciado: () => '<p>Simplifica cada función en tu hoja auxiliar (álgebra de Boole, De Morgan o mapa de Karnaugh) y elige su <b>forma mínima</b> como suma de productos.</p>',
    pasos: (d) => [0, 1, 2].map((i) => {
      const q = d && d.q ? d.q[i] : null, nm = NOMS[i];
      return { t: (i + 1) + ') Simplifica ' + nm, tex: q ? (q.tipo === 'can' ? lineas(nm, q.ex, 3) : nm + ' = ' + q.ex) : null,
        items: [{ id: 's' + (i + 1), h: 'Forma mínima de ' + nm, pts: 5, tipo: 'op' }] };
    }),
    ops: (d, id) => { const q = d.q[+id.slice(1) - 1]; return [q.mi].concat(q.dis).map((p) => ({ t: sopT(p, N3) })); },
    esperado: () => ({}),
    final: (d) => d.q.reduce((o, q, i) => {
      const nm = NOMS[i];
      if (q.tipo === 'can') o.push(`<p><b>${i + 1})</b> Cada término es una fila donde ${nm} = 1 (mintérminos ${q.ms.join('; ')}). En el mapa se agrupan:</p>`);
      if (q.tipo === 'dm') {
        o.push(`<p><b>${i + 1})</b> De Morgan: la barra larga se rompe, la suma pasa a producto y cada término queda negado (y cada producto negado pasa a suma):</p>`);
        o.push(nm + ' = ' + q.base.map((g) => '\\overline{' + sopT([g], N3) + '}').join('\\cdot ') + ' = ' + posT(q.base.map((g) => g.map((c) => c ^ 1)), N3));
        o.push('<p>Se multiplica (o se lleva al mapa) y se agrupa:</p>');
      }
      if (q.tipo === 'pos') o.push(`<p><b>${i + 1})</b> Se multiplica término a término (una variable por su negada da 0) o se lleva al mapa: cada paréntesis vale 0 solo en las filas donde todos sus literales valen 0.</p>`);
      if (q.tipo === 'red') o.push(`<p><b>${i + 1})</b> Hay términos que sobran (consenso o absorción). En el mapa se ve:</p>`);
      o.push(mapaSol(3, q.f, N3), nm + ' = ' + sopT(q.mi, N3));
      return o;
    }, [])
  };

  // ===== P3: circuito → tabla → función → NAND (20) =====
  P.p3 = {
    titulo: 'Circuito, tabla y NAND', max: 20,
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
        const f = evalSOP(pu, 3), u = f.filter(Boolean).length;
        if (u < 2 || u > 6) continue;
        const sol = K.resolver(3, f);
        if (sol.cubos.length !== 2 || K.lits(sol.cubos) !== 4) continue;
        const dis = distractores(r, pu, f, 3, 3);
        if (dis.length < 3) continue;
        return { pu, f, dis, nneg: 1 };
      }
      return null;
    },
    enunciado: (d) => `<p>Analiza este circuito:</p><div class="pd-circ">${CI.svg(3, d.pu, N3, { mono: true, salida: 'Y' })}</div>`,
    pasos: (d) => [
      { t: 'a) Tabla de verdad del circuito', tabla: { cols: N3, x: false }, items: celdas('y', 3, d && d.f, 1, N3) },
      { t: 'b) Función', html: '¿Qué función implementa el circuito?', items: [{ id: 'fn', h: 'Y =', pts: 6, tipo: 'op' }] },
      { t: 'c) Solo con NAND', html: 'Si armas este mismo circuito solo con NAND de 2 entradas (método NAND → NAND; cada inversor es una NAND con sus entradas unidas), ¿cuántas compuertas NAND hacen falta?',
        items: [{ id: 'nn', h: 'Cantidad de NAND', pts: 6, tol: EX }] }
    ],
    ops: (d) => [d.pu].concat(d.dis).map((p) => ({ t: sopT(p, N3) })),
    esperado: (d) => espBits('y', d.f, { nn: [3 + d.nneg] }),
    final: (d) => [
      `<div class="pd-fig">${K.tablaHTML(3, d.f, { salida: 'Y' })}</div>`,
      `Y = ${sopT(d.pu, N3)}`,
      `<p>Solo con NAND: una NAND por cada producto (2), una NAND como inversor para la variable negada (1) y la NAND de salida (1): <b>${3 + d.nneg} compuertas</b>.</p>`]
  };

  // ===== P4: diseño de dos aplicaciones (20): una de 3 variables y otra de 4 (con X cuando hay combinaciones que no llegan) =====
  const APL = [
    { t: 'Ascensor', v: [['P', 'puerta cerrada'], ['S', 'sobrepeso'], ['B', 'botón de piso presionado']], y: 'el motor arranca',
      regla: 'El motor arranca si la puerta está cerrada, no hay sobrepeso y alguien presionó un piso.', f: (a, b, c) => a && !b && c },
    { t: 'Ventilador de invernadero', v: [['T', 'temperatura alta'], ['H', 'humedad alta'], ['N', 'es de noche']], y: 'el ventilador se enciende',
      regla: 'El ventilador se enciende si la temperatura es alta, o si hay humedad alta y no es de noche.', f: (a, b, c) => a || (b && !c) },
    { t: 'Control de calidad', v: [['A', 'tamaño correcto'], ['B', 'color correcto'], ['P', 'hay pieza en el sensor']], y: 'el pistón expulsa la pieza',
      regla: 'El pistón expulsa la pieza si hay una pieza en el sensor y su tamaño no es correcto o su color no es correcto.', f: (a, b, c) => c && (!a || !b) },
    { t: 'Luz del pasillo', v: [['I', 'interruptor manual activado'], ['M', 'movimiento detectado'], ['O', 'está oscuro']], y: 'la luz se enciende',
      regla: 'La luz se enciende si el interruptor manual está activado, o si hay movimiento y está oscuro.', f: (a, b, c) => a || (b && c) },
    { t: 'Votación de detectores de gas', v: [['A', 'detector A activado'], ['B', 'detector B activado'], ['C', 'detector C activado']], y: 'la válvula se cierra',
      regla: 'La válvula se cierra si al menos dos de los tres detectores están activados.', f: (a, b, c) => (a && b) || (a && c) || (b && c) },
    { t: 'Alarma de puerta', v: [['A', 'alarma activada'], ['P', 'puerta abierta'], ['V', 'ventana abierta']], y: 'suena la sirena',
      regla: 'La sirena suena si la alarma está activada y la puerta o la ventana están abiertas.', f: (a, b, c) => a && (b || c) },
    { t: 'Bomba de pozo', v: [['N', 'nivel del tanque bajo'], ['P', 'agua en el pozo'], ['M', 'modo manual activado']], y: 'la bomba arranca',
      regla: 'La bomba arranca si hay agua en el pozo y el nivel del tanque está bajo o el modo manual está activado.', f: (a, b, c) => b && (a || c) },
    { t: 'Prensa con dos manos', v: [['I', 'botón izquierdo presionado'], ['D', 'botón derecho presionado'], ['G', 'guarda de seguridad abierta']], y: 'la prensa baja',
      regla: 'La prensa baja solo si los dos botones están presionados y la guarda no está abierta; también baja si la guarda está abierta pero no hay ningún botón presionado (prueba de mantenimiento).', f: (a, b, c) => (a && b && !c) || (!a && !b && c) }
  ];
  const BCDV = [['A', 'bit de peso 8 (el de mayor peso)'], ['B', 'bit de peso 4'], ['C', 'bit de peso 2'], ['D', 'bit de peso 1']];
  const bcdX = (lista) => (a, b, c, d) => { const n = 8 * a + 4 * b + 2 * c + d; return n > 9 ? 2 : lista.includes(n) ? 1 : 0; };
  const NOBCD = ' Las combinaciones 10 a 15 no son BCD y nunca llegan: en la tabla van con <b>X</b>.';
  const APL4 = [
    { t: 'Detector de dígitos', v: BCDV, y: 'el dígito es mayor o igual a 5', regla: 'La entrada ABCD es un dígito en BCD.' + NOBCD, f: bcdX([5, 6, 7, 8, 9]) },
    { t: 'Detector de primos', v: BCDV, y: 'el dígito es primo (2, 3, 5 o 7)', regla: 'La entrada ABCD es un dígito en BCD.' + NOBCD, f: bcdX([2, 3, 5, 7]) },
    { t: 'Múltiplos de 3', v: BCDV, y: 'el dígito es 3, 6 o 9', regla: 'La entrada ABCD es un dígito en BCD.' + NOBCD, f: bcdX([3, 6, 9]) },
    { t: 'Display de 7 segmentos (segmento e)', v: BCDV, y: 'el segmento e se enciende', regla: 'ABCD es un dígito en BCD que se muestra en un display. El segmento e se enciende para los dígitos 0, 2, 6 y 8.' + NOBCD, f: bcdX([0, 2, 6, 8]) },
    { t: 'Display de 7 segmentos (segmento f)', v: BCDV, y: 'el segmento f se enciende', regla: 'ABCD es un dígito en BCD que se muestra en un display. El segmento f se enciende para los dígitos 0, 4, 5, 6, 8 y 9.' + NOBCD, f: bcdX([0, 4, 5, 6, 8, 9]) },
    { t: 'Display de 7 segmentos (segmento g)', v: BCDV, y: 'el segmento g se enciende', regla: 'ABCD es un dígito en BCD que se muestra en un display. El segmento g se enciende para los dígitos 2, 3, 4, 5, 6, 8 y 9.' + NOBCD, f: bcdX([2, 3, 4, 5, 6, 8, 9]) },
    { t: 'Tanque con tres sensores de nivel', v: [['M', 'modo manual activado'], ['B', 'el agua cubre el sensor bajo'], ['I', 'el agua cubre el sensor intermedio'], ['S', 'el agua cubre el sensor superior']], y: 'la bomba funciona',
      regla: 'En automático (M = 0) la bomba funciona si el agua no llega al sensor intermedio. En manual (M = 1) la bomba funciona mientras el agua no llegue al sensor superior. Es imposible que un sensor esté cubierto y otro más bajo esté seco: esas combinaciones van con <b>X</b>.',
      f: (m, b, i, s) => ((i && !b) || (s && !i) ? 2 : (!m && !i) || (m && !s) ? 1 : 0) },
    { t: 'Alarma del auto', v: [['L', 'llave puesta'], ['P', 'puerta abierta'], ['C', 'cinturón abrochado'], ['M', 'motor en marcha']], y: 'suena el zumbador',
      regla: 'El zumbador suena si la llave está puesta y la puerta está abierta, o si el motor está en marcha y el cinturón no está abrochado. El motor no puede estar en marcha sin la llave: esas combinaciones van con <b>X</b>.',
      f: (l, p, c, m) => (m && !l ? 2 : (l && p) || (m && !c) ? 1 : 0) },
    { t: 'Comité con presidente', v: [['P', 'el presidente vota sí'], ['A', 'el miembro A vota sí'], ['B', 'el miembro B vota sí'], ['C', 'el miembro C vota sí']], y: 'se aprueba',
      regla: 'Se aprueba si votan sí al menos tres personas, o si votan sí exactamente dos y una de ellas es el presidente.', f: (p, a, b, c) => { const n = p + a + b + c; return n >= 3 || (n === 2 && p) ? 1 : 0; } },
    { t: 'Comparador de 2 bits', v: [['A', 'bit de mayor peso de N1'], ['B', 'bit de menor peso de N1'], ['C', 'bit de mayor peso de N2'], ['D', 'bit de menor peso de N2']], y: 'N1 es mayor que N2',
      regla: 'N1 = AB y N2 = CD son dos números de 2 bits.', f: (a, b, c, d) => (2 * a + b > 2 * c + d ? 1 : 0) },
    { t: 'Acarreo de una suma', v: [['A', 'bit de mayor peso de N1'], ['B', 'bit de menor peso de N1'], ['C', 'bit de mayor peso de N2'], ['D', 'bit de menor peso de N2']], y: 'N1 + N2 vale 4 o más',
      regla: 'N1 = AB y N2 = CD son dos números de 2 bits que se suman.', f: (a, b, c, d) => (2 * a + b + 2 * c + d >= 4 ? 1 : 0) }
  ];
  const enunApl = (A, n) => `<p><b>${A.t}.</b> ${A.regla}</p><ul class="pm-datos">${A.v.map((x) => `<li><b>${x[0]}</b> = 1 si ${x[1]}</li>`).join('')}<li><b>Y</b> = 1 si ${A.y}</li></ul><p class="mp-nota">Orden de la tabla: ${n.join(' ')}.</p>`;
  P.p4 = {
    titulo: 'Diseño de dos aplicaciones', max: 20,
    gen(r) {
      for (let t = 0; t < 80; t++) {
        const k = Math.floor(r() * APL.length), A = APL[k];
        const f = Array.from({ length: 8 }, (_, m) => (A.f(!!(m & 4), !!(m & 2), !!(m & 1)) ? 1 : 0));
        const n = A.v.map((x) => x[0]);
        const mi = deCubos(3, K.resolver(3, f).cubos), dis = distractores(r, mi, f, 3, 3);
        const k4 = Math.floor(r() * APL4.length), B = APL4[k4];
        const f4 = Array.from({ length: 16 }, (_, m) => +B.f((m >> 3) & 1, (m >> 2) & 1, (m >> 1) & 1, m & 1));
        const n4 = B.v.map((x) => x[0]);
        const mi4 = deCubos(4, K.resolver(4, f4).cubos), dis4 = distractores(r, mi4, f4, 4, 3);
        if (dis.length === 3 && dis4.length === 3 && unica(3, f) && unica(4, f4)) return { k, f, n, mi, dis, k4, f4, n4, mi4, dis4 };
      }
      return null;
    },
    enunciado: () => '<p>Diseña los dos sistemas. Para cada uno: llena la <b>tabla de verdad completa</b> (toca cada casilla de Y: 1, 0 o X) y, con el mapa de Karnaugh en tu hoja, elige la <b>expresión mínima</b>.</p>',
    pasos: (d) => { const v = d && d.f; return [
      { t: 'a) Primer sistema: tabla de verdad', html: v ? enunApl(APL[d.k], d.n) : '', tabla: { cols: v ? d.n : N3, x: true }, items: celdas('y', 3, v && d.f, 0.5, v ? d.n : N3) },
      { t: 'b) Primer sistema: expresión mínima', items: [{ id: 'mi', h: 'Y =', pts: 3, tipo: 'op' }] },
      { t: 'c) Segundo sistema: tabla de verdad', html: v ? enunApl(APL4[d.k4], d.n4) : '', tabla: { cols: v ? d.n4 : N4, x: true }, items: celdas('z', 4, v && d.f4, 0.5, v ? d.n4 : N4) },
      { t: 'd) Segundo sistema: expresión mínima', items: [{ id: 'mj', h: 'Y =', pts: 5, tipo: 'op' }] }]; },
    ops: (d, id) => (id === 'mi' ? [d.mi].concat(d.dis).map((p) => ({ t: sopT(p, d.n) })) : [d.mi4].concat(d.dis4).map((p) => ({ t: sopT(p, d.n4) }))),
    esperado: (d) => espBits('z', d.f4, espBits('y', d.f, {})),
    final: (d) => [`<p><b>Primer sistema (${APL[d.k].t})</b></p>`, `<div class="pd-fig">${K.tablaHTML(3, d.f, { nombres: d.n, salida: 'Y' })}</div>`, mapaSol(3, d.f, d.n), `Y = ${sopT(d.mi, d.n)}`,
      `<p><b>Segundo sistema (${APL4[d.k4].t})</b></p>`, `<div class="pd-fig">${K.tablaHTML(4, d.f4, { nombres: d.n4, salida: 'Y' })}</div>`, mapaSol(4, d.f4, d.n4), `Y = ${sopT(d.mi4, d.n4)}`,
      '<p>Las X se toman como 1 solo donde agrandan un grupo.</p>']
  };

  // ===== P5: tres mapas de Karnaugh de 4 variables (25) =====
  // a) mapa dado con X; b) de una función (suma no mínima) al mapa; c) de un circuito al mapa.
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
  function deFuncion(r) {
    for (let t = 0; t < 4000; t++) {
      const pu = [];
      while (pu.length < 4) { const g = prodR(r, 4, r() < 0.5 ? 3 : 4); if (!pu.some((h) => igualG(g, h))) pu.push(g); }
      const f = evalSOP(pu, 4), u = cuenta1(f);
      if (u < 5 || u > 10) continue;
      const sol = K.resolver(4, f);
      if (sol.cubos.length < 2 || sol.cubos.length > 3 || K.lits(sol.cubos) > nLits(pu) - 6) continue;
      if (!unica(4, f)) continue;
      const mi = deCubos(4, sol.cubos), dis = distractores(r, mi, f, 4, 3);
      if (dis.length < 3) continue;
      return { pu, f, mi, dis };
    }
    return null;
  }
  function deCircuito(r) {
    for (let t = 0; t < 4000; t++) {
      const pu = [];
      while (pu.length < 3) { const g = prodR(r, 4, pu.length ? 3 : elegir(r, [2, 3])); if (!pu.some((h) => igualG(g, h))) pu.push(g); }
      const f = evalSOP(pu, 4), u = cuenta1(f);
      if (u < 4 || u > 10) continue;
      const sol = K.resolver(4, f);
      if (sol.cubos.length < 2 || sol.cubos.length > 3 || K.lits(sol.cubos) > nLits(pu) - 2) continue;
      if (!unica(4, f)) continue;
      const mi = deCubos(4, sol.cubos), dis = distractores(r, mi, f, 4, 3);
      if (dis.length < 3) continue;
      return { pu, f, mi, dis };
    }
    return null;
  }
  P.p5 = {
    titulo: 'Mapas de Karnaugh', max: 25,
    gen(r) { const a = mapaConX(r), b = deFuncion(r), c = deCircuito(r); return a && b && c ? { a, b, c } : null; },
    enunciado: () => '<p>Tres mapas de Karnaugh de 4 variables (filas AB, columnas CD). En b) y c) primero <b>llenas el mapa</b> (toca cada casilla: 1 o 0) y después eliges la expresión mínima.</p>',
    pasos: (d) => { const v = d && d.a; return [
      { t: 'a) Mapa con X', html: v ? `<p>Simplifica este mapa. Las <b>X</b> son condiciones que no importan.</p><div class="pd-fig">${K.estatico(4, d.a.f, {})}</div>` : '',
        items: [{ id: 'ma', h: 'Expresión mínima de F', pts: 7, tipo: 'op' }, { id: 'nt', h: 'Cantidad de términos (grupos)', pts: 1, tol: EX }, { id: 'nl', h: 'Cantidad total de literales', pts: 1, tol: EX }] },
      { t: 'b) De la función al mapa', html: 'Lleva esta función al mapa:', tex: v ? lineas('G', terminos(d.b.pu, N4), 2) : null, mapa: true, items: celdas('g', 4, v && d.b.f, 0.25, N4) },
      { t: 'b) Expresión mínima de G', items: [{ id: 'mb', h: 'G =', pts: 4, tipo: 'op' }] },
      { t: 'c) Del circuito al mapa', html: v ? `Lleva al mapa la función H de este circuito:<div class="pd-circ">${CI.svg(4, d.c.pu, N4, { mono: true, salida: 'H' })}</div>` : '', mapa: true, items: celdas('h', 4, v && d.c.f, 0.25, N4) },
      { t: 'c) Expresión mínima de H', items: [{ id: 'mc', h: 'H =', pts: 4, tipo: 'op' }] }]; },
    ops: (d, id) => { const q = id === 'ma' ? d.a : id === 'mb' ? d.b : d.c; return [q.mi].concat(q.dis).map((p) => ({ t: sopT(p, N4) })); },
    esperado: (d) => espBits('h', d.c.f, espBits('g', d.b.f, { nt: [d.a.nt], nl: [d.a.nl] })),
    final: (d) => ['<p><b>a)</b></p>', mapaSol(4, d.a.f, N4), `F = ${sopT(d.a.mi, N4)}`, `<p>${d.a.nt} grupos y ${d.a.nl} literales. Las X se toman como 1 solo donde agrandan un grupo.</p>`,
      '<p><b>b)</b> Cada producto de 4 literales es una casilla; uno de 3 literales ocupa dos casillas vecinas.</p>', mapaSol(4, d.b.f, N4), `G = ${sopT(d.b.mi, N4)}`,
      `<p><b>c)</b> El circuito da ${M('H = ' + sopT(d.c.pu, N4))}. Llevado al mapa y agrupado:</p>`, mapaSol(4, d.c.f, N4), `H = ${sopT(d.c.mi, N4)}`]
  };

  // ===== P6: XOR y paridad (10) =====
  const xorDe = (s) => s.split('').reduce((a, c) => a ^ +c, 0);
  P.p6 = {
    titulo: 'XOR y paridad', max: 10,
    gen(r) {
      const dato = (n) => Array.from({ length: n }, () => (r() < 0.5 ? '1' : '0')).join('');
      const x5 = dato(5), d7 = dato(7);
      const s3 = dato(7), envio = s3 + xorDe(s3), nErr = elegir(r, [0, 1, 1, 2]);
      const ll = envio.split('');
      RC.mezclar(r, [0, 1, 2, 3, 4, 5, 6, 7]).slice(0, nErr).forEach((i) => { ll[i] = ll[i] === '1' ? '0' : '1'; });
      return { x5, d7, llega: ll.join(''), nErr };
    },
    enunciado: (d) => `<ol class="pd-lista" type="a">
      <li>Calcula ${M(d.x5.split('').join(' \\oplus '))}.</li>
      <li>Paridad <b>par</b>. ¿Qué bit de paridad P se agrega al dato ${bits(d.d7)}?</li>
      <li>Paridad <b>par</b>. Llegó el dato ${bits(d.llega.slice(0, 7))} con el bit de paridad P = ${d.llega[7]}. ¿Cuánto vale la salida E del comprobador?</li>
      <li>Con un solo bit de paridad, ¿qué errores detecta siempre el receptor?</li></ol>`,
    pasos: () => [
      { t: 'Respuestas (escribe 0 o 1)', tex: null, items: [{ id: 'x', h: 'a) Resultado de la XOR', pts: 3, tol: EX }, { id: 'p', h: 'b) Bit de paridad P', pts: 3, tol: EX }, { id: 'e', h: 'c) Salida E del comprobador', pts: 2, tol: EX }] },
      { t: 'd) Elige', tex: null, items: [{ id: 'op', h: 'Detecta siempre', pts: 2, tipo: 'op' }] }
    ],
    ops: () => [{ h: 'Una cantidad impar de bits dañados (1, 3, 5…)' }, { h: 'Cualquier cantidad de bits dañados' }, { h: 'Solo cuando fallan 2 bits' }, { h: 'Ninguno: solo los corrige' }],
    esperado: (d) => ({ x: [xorDe(d.x5)], p: [xorDe(d.d7)], e: [xorDe(d.llega)] }),
    final: (d) => [
      `<p><b>a)</b> La XOR vale 1 si la cantidad de unos es impar: hay ${unos(d.x5)} unos → <b>${xorDe(d.x5)}</b>.</p>`,
      `<p><b>b)</b> El dato tiene ${unos(d.d7)} unos; con paridad par el total debe quedar par: P = <b>${xorDe(d.d7)}</b>.</p>`,
      `<p><b>c)</b> E es la XOR de todo lo recibido (datos y P): llegaron ${unos(d.llega)} unos → E = <b>${xorDe(d.llega)}</b>.${d.nErr === 2 ? ' En realidad fallaron 2 bits: se tapan y la paridad no lo detecta.' : d.nErr === 1 ? ' En realidad falló 1 bit.' : ' Llegó bien.'}</p>`,
      `<p><b>d)</b> Cada bit dañado cambia la paridad: detecta 1, 3, 5… errores; con 2 o 4 los cambios se tapan.</p>`]
  };

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
    for (let i = 0; !d && i < 20; i++) d = P[k].gen(RC.rng(String(carnet) + '|d1-ex1|' + k + (i ? '|' + i : '')));
    d.prob = k;
    d.op = {};
    P[k].pasos(d).forEach((ps) => ps.items.forEach((it) => {
      if (it.tipo !== 'op') return;
      const lista = P[k].ops(d, it.id).map((o, i) => ({ ...o, ok: i === 0 }));
      d.op[it.id] = RC.mezclar(RC.rng(String(carnet) + '|d1-ex1|' + k + '|' + it.id), lista);
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
    const esp = P[k].esperado(d);
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
        const e = String(esp[it.id]);
        const s = v == null ? '' : String(v).trim().toUpperCase();
        r = s === '' ? 'vacio' : s === e ? 'ok' : 'mal';
        cel[it.id] = { r, exp: e, pts: r === 'ok' ? it.pts : 0, max: it.pts };
      } else {
        const lista = [].concat(esp[it.id]);
        const q = RC.leer(v);
        r = q.vacio ? 'vacio' : q.invalido ? 'mal' : lista.some((e) => RC.cerca(q.v, e, it.tol)) ? 'ok' : 'mal';
        cel[it.id] = { r, exp: lista[0], pts: r === 'ok' ? it.pts : 0, max: it.pts };
      }
      pts += cel[it.id].pts;
    });
    return { pts: Math.round(pts * 100) / 100, max: RC.MAX[k], cel };
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
