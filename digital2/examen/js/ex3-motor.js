// ============================================================
// Electrónica Digital 2 · examen por celular · PROBLEMA 3 (12/11/2026): diseño de un sumador/restador de 4 bits con el 74283
// Pieza aparte (se une a los problemas 1 y 2 más adelante). Mismo espacio RC; números propios por carnet.
//   1 la XOR como inversor controlado por M; 2 conexión del 74283 (opciones); 3 comprobación restando con sus números (M = 1);
//   4 los mismos números sumando (M = 0), ¿negativo? y qué indica el acarreo. El circuito se dibuja a mano. Puntajes provisionales.
// ============================================================
(function () {
  const RC = (window.RC = window.RC || {});
  const SID = 'd2-ex3';

  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  RC.rng = (semilla) => {
    let a = hash(String(semilla));
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  RC.mezclar = (r, arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  RC.tex = (x) => String(x).replace('.', '{,}');
  RC.opTxt = (o) => (o.h != null ? o.h : '\\(' + o.t + '\\)');
  RC.etTxt = (it) => (it.h != null ? it.h : '\\(' + it.et + '\\)');
  const ent = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const b4 = (n) => (n & 15).toString(2).padStart(4, '0');
  const bits = (s) => '<b class="mono pd-bits">' + s + '</b>';
  const vv = (est, k) => (est && est[k] && est[k].vals) || {};
  

  // ---------- los números y las opciones de cada carnet ----------
  const bases = {};
  function baseDe(carnet) {
    if (bases[carnet]) return bases[carnet];
    const r = RC.rng(String(carnet) + '|' + SID + '|c');
    const neg = r() < 0.5;
    let A, B;
    do { A = ent(r, 2, 15); B = ent(r, 2, 15); } while (A === B || (A < B) !== neg);
    // preguntas de opción: la correcta va primero y se mezcla por carnet; el valor guardado es la posición elegida
    const op = {}, ex = {};
    const Q = {
      qa: ['A<sub>3</sub>…A<sub>0</sub> directamente', ['A<sub>3</sub>…A<sub>0</sub> pasando por una XOR con M', 'A<sub>3</sub>…A<sub>0</sub> invertidas', 'B<sub>3</sub>…B<sub>0</sub>']],
      qb: ['B<sub>3</sub>…B<sub>0</sub> a través de una XOR con M (B ⊕ M)', ['B<sub>3</sub>…B<sub>0</sub> directamente', 'B<sub>3</sub>…B<sub>0</sub> invertidas siempre, con inversores', 'A<sub>3</sub>…A<sub>0</sub>']],
      qc: ['la línea M', ['0 (a tierra) siempre', '1 (a +5 V) siempre', 'el acarreo de salida Cout']],
      qm: ['A − B', ['B − A', 'A + B', 'A + B + 1']],
      qz: ['A ≥ B: el resultado no es negativo', ['A &lt; B: el resultado es negativo', 'hubo desborde y el resultado es incorrecto', 'B vale cero']]
    };
    Object.keys(Q).forEach((id) => {
      const l = RC.mezclar(r, [0, 1, 2, 3]), todas = [Q[id][0]].concat(Q[id][1]);
      op[id] = l.map((i) => ({ h: todas[i] }));
      ex[id] = l.indexOf(0);
    });
    return (bases[carnet] = { A, B, op, ex });
  }

  const P = {};
  const itB = (id, h, pts) => ({ id, h, tipo: 'bit', pts, x: false });
  const itO = (id, h, pts) => ({ id, h, tipo: 'op', pts });
  const fijo = (etq, n) => ({ etq, cel: [''].concat(b4(n).split('')) });
  const CAB = ['Acarreo', 'Bit\u00a03', 'Bit\u00a02', 'Bit\u00a01', 'Bit\u00a00'];
  const bs = (pref, h, pts) => [3, 2, 1, 0].map((i) => itB(pref + i, `${h}, bit ${i}`, pts));

  // ===== Paso 1: la XOR como inversor controlado por M =====
  const XR = [[0, 0], [0, 1], [1, 0], [1, 1]];
  P.p1 = {
    titulo: 'La XOR y la línea de control M', max: 12, casillas: 4,
    enunciado: () => `<p>Vas a diseñar un <b>sumador/restador de 4 bits</b> con un 74283 (sumador de 4 bits con acarreo de entrada Cin). Para restar se usa A − B = A + B̄ + 1: hay que invertir B. Para poder elegir, cada bit de B pasa por una compuerta <b>XOR</b> con una línea de control <b>M</b>.</p><p>La XOR vale 1 cuando sus dos entradas son distintas. Completa su salida B ⊕ M.</p>`,
    pasos: () => {
      const its = XR.map((x, i) => itB('x' + i, `B = ${x[0]}, M = ${x[1]}: B ⊕ M`, 3));
      return [{ t: 'Tabla de la XOR', grid: { sinEtq: true, cab: ['B', 'M', 'B ⊕ M'], filas: XR.map((x, i) => ({ cel: [String(x[0]), String(x[1]), its[i]] })) }, items: its }];
    },
    esperado: () => Object.fromEntries(XR.map((x, i) => ['x' + i, String(x[0] ^ x[1])])),
    final: () => ['<p>Con M = 0 la XOR deja pasar B sin cambio (B ⊕ 0 = B). Con M = 1 la XOR invierte B (B ⊕ 1 = B̄). M decide si el circuito suma o resta.</p>']
  };

  // ===== Paso 2: conexión del 74283 =====
  P.p2 = {
    titulo: 'Conexión del 74283', max: 24, casillas: 4,
    enunciado: () => `<p>Ahora conecta el 74283: sus entradas A₃…A₀, B₃…B₀ y Cin, y la línea de control M. Elige en cada caso la conexión correcta para que el circuito <b>reste cuando M = 1</b> y <b>sume cuando M = 0</b>.</p>`,
    pasos: () => [{ t: 'Entradas del 74283', items: [itO('qa', 'Las entradas A₃…A₀ del 74283 reciben', 6), itO('qb', 'Las entradas B₃…B₀ del 74283 reciben', 6), itO('qc', 'La entrada Cin del 74283 se conecta a', 6), itO('qm', 'Con M = 1 el circuito calcula', 6)] }],
    esperado: (d) => Object.fromEntries(['qa', 'qb', 'qc', 'qm'].map((k) => [k, d.b.ex[k]])),
    final: () => ['<p>A entra directo a las entradas A. B pasa por cuatro XOR con M, y M también va a Cin: con M = 0 el sumador calcula A + B + 0; con M = 1 calcula A + B̄ + 1 = A − B.</p>']
  };

  // ===== Paso 3: comprobación restando (M = 1) =====
  P.p3 = {
    titulo: 'Comprobación restando (M = 1)', max: 20, casillas: 10,
    enunciado: (d) => `<p>Pon M = 1 y prueba tu circuito con los números sin signo A = ${d.b.A} y B = ${d.b.B} (aparecen en binario en la tabla).</p><p>Completa lo que sale de las XOR, el Cin y el resultado del 74283.</p>`,
    pasos: (d) => {
      const n = bs('n', 'B ⊕ M', 1.5), ci = itB('ci', 'Cin', 3), co = itB('co', 'Acarreo de salida', 3), s = bs('s', 'S', 2);
      return [{ t: 'Resta A − B con M = 1', grid: { cab: CAB, filas: [fijo('A = ' + d.b.A, d.b.A), fijo('B = ' + d.b.B, d.b.B), { etq: 'B ⊕ M', cel: [''].concat(n) }, { etq: 'Cin', cel: [ci, { t: 'conectado a M', span: 4 }] }, { etq: 'S', cel: [co].concat(s) }] }, items: n.concat([ci, co]).concat(s) }];
    },
    esperado: (d) => {
      const { A, B } = d.b, bn = ~B & 15, t = A + bn + 1, o = { ci: '1', co: String(t >> 4) };
      [3, 2, 1, 0].forEach((i) => { o['n' + i] = String((bn >> i) & 1); o['s' + i] = String(((t & 15) >> i) & 1); });
      return o;
    },
    final: (d) => { const { A, B } = d.b, bn = ~B & 15, t = A + bn + 1; return [`<p>Con M = 1: B = ${bits(b4(B))} sale de las XOR como ${bits(b4(bn))} y Cin = 1. Suma: ${bits(b4(A))} + ${bits(b4(bn))} + 1 = ${bits(b4(t))} con acarreo de salida ${t >> 4}.</p>`]; }
  };

  // ===== Paso 4: los mismos números sumando (M = 0), ¿negativo? y qué indica el acarreo =====
  P.p4 = {
    titulo: 'Suma, signo y acarreo', max: 20, casillas: 7,
    enunciado: (d) => `<p>Ahora el mismo circuito con M = 0 y los mismos números (A = ${d.b.A} y B = ${d.b.B}). Completa la suma.</p><p>Después, marca si la <b>resta</b> A − B del paso anterior dio un resultado negativo y elige qué indica el acarreo de salida en la resta.</p>`,
    pasos: (d) => {
      const s = bs('s', 'S', 2), co = itB('co', 'Acarreo de salida', 2), ng = itB('ng', '¿A − B es negativo? (1 = sí, 0 = no)', 5);
      return [{ t: 'Suma con M = 0 y lectura de la resta', grid: { cab: CAB, filas: [fijo('A = ' + d.b.A, d.b.A), fijo('B ⊕ M = B', d.b.B), { etq: 'A + B', cel: [co].concat(s) }, { etq: '¿A − B negativo?', cel: [ng, { t: '1 = sí; 0 = no', span: 4 }] }] }, items: s.concat([co, ng, itO('qz', 'En la resta, un acarreo de salida igual a 1 indica', 5)]) }];
    },
    esperado: (d) => { const { A, B } = d.b, t = A + B, o = { co: String(t >> 4), ng: A < B ? '1' : '0', qz: d.b.ex.qz }; [3, 2, 1, 0].forEach((i) => { o['s' + i] = String(((t & 15) >> i) & 1); }); return o; },
    final: (d) => { const { A, B } = d.b, t = A + B; return [`<p>Con M = 0 las XOR dejan pasar B y Cin = 0: ${bits(b4(A))} + ${bits(b4(B))} = ${bits(b4(t))} con acarreo de salida ${t >> 4}${t > 15 ? ' (la suma no cabe en 4 bits)' : ''}.</p>`, `<p>${A < B ? `A &lt; B: la resta da negativo (acarreo de salida 0 y resultado en complemento a 2).` : `A ≥ B: la resta da ${A - B} (acarreo de salida 1).`} En la resta, un acarreo de salida igual a 1 significa A ≥ B (no hay préstamo); igual a 0 significa A &lt; B.</p>`]; }
  };

  Object.keys(P).forEach((k) => ['pasos', 'enunciado', 'final'].forEach((f) => { const g = P[k][f]; P[k][f] = (d, m) => g(d, m || d.mio); }));
  RC.P = P;
  RC.PROB = ['p1', 'p2', 'p3', 'p4'];
  RC.MAX = Object.fromEntries(RC.PROB.map((k) => [k, P[k].max]));
  RC.TITULO = Object.fromEntries(RC.PROB.map((k, i) => [k, 'Paso ' + (i + 1)]));
  RC.NOMBRE = Object.fromEntries(RC.PROB.map((k) => [k, P[k].titulo]));
  RC.ENT = [];

  RC.datos = (k, carnet, car, est) => { const b = baseDe(carnet); return { b, prob: k, mio: {}, op: b.op }; };
  RC.items = (k, d) => P[k].pasos(d, d.mio).reduce((a, ps) => a.concat(ps.items), []);
  RC.casillas = (k) => P[k].casillas;
  RC.TOTAL_CASILLAS = RC.PROB.reduce((s, k) => s + RC.casillas(k), 0);

  RC.calificar = (k, d, vals) => {
    vals = vals || {};
    const items = RC.items(k, d), esp = P[k].esperado(d, vals, d.mio), cel = {};
    let pts = 0;
    items.forEach((it) => {
      const v = vals[it.id], vacio = v == null || String(v).trim() === '';
      const exp = String(esp[it.id]);
      const r = vacio ? 'vacio' : String(v).trim() === exp ? 'ok' : 'mal';
      cel[it.id] = { r, exp, pts: r === 'ok' ? it.pts : 0, max: it.pts };
      pts += cel[it.id].pts;
    });
    return { pts: Math.round(pts * 100) / 100, max: RC.MAX[k], cel };
  };
  RC.nota = (carnet, est) => {
    const res = {};
    let total = 0;
    RC.PROB.forEach((k) => { res[k] = RC.calificar(k, RC.datos(k, carnet, '', est), vv(est, k)); total += res[k].pts; });
    return { total: Math.round(total * 100) / 100, res };
  };
  RC.avance = (est) => {
    let n = 0;
    RC.PROB.forEach((k) => { const v = vv(est, k); n += Object.keys(v).filter((id) => v[id] !== '' && v[id] != null).length; });
    return Math.min(100, Math.round((100 * n) / RC.TOTAL_CASILLAS));
  };
  RC.firma = (est) => {
    const s = JSON.stringify(RC.PROB.map((k) => vv(est, k)));
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  };
})();
