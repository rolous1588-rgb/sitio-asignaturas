// ============================================================
// Electrónica Digital 2 · Práctica de contadores síncronos no secuenciales con JK — motor
// (sin pantalla: lo usan la página del estudiante, el panel docente y las pruebas con Node)
//
//   Datos de cada estudiante: { n: 3 | 4 bits, seq: [estados en orden] } (lo asigna el docente)
//   Procedimiento: 1 Datos → 2 Transición → 3 J y K → 4 Mapas → 5 Circuito → 6 Verificar
//   Puntos (20): 3 + 4 + 4 + 5 + 2 + 2. Cada respuesta tiene 2 intentos:
//   bien al 1.º = completo; bien al 2.º = mitad; si falla los dos se muestra la respuesta (0).
//
//   Convenciones:
//   · Estado s = número con Q(n−1) como bit más alto. Los bits se guardan en arreglos con el más alto primero.
//   · 0, 1 y 2 (= X, «no importa»); −1 = sin llenar («?»).
//   · Entradas en el orden J(n−1), K(n−1), …, J0, K0 (índice e; el flip-flop es b = n − 1 − ⌊e/2⌋).
//   · Circuito de cada entrada: { c: null | 0 | 1, p: [[literal, …], …] } (suma de productos).
//     Literal = 2·i + negada, con i = índice de variable (0 = Q(n−1)). c = 1 o 0: conectada a 1 o a 0.
// Requiere base/kmap.js (D2.k).
// ============================================================
(function () {
  const CT = (window.CT = {});
  const Kmap = () => window.D2.k;

  CT.PTS = { p1: 3, p2: 4, p3: 4, p4: 5, p5: 2, p6: 2 };
  CT.TOTAL = 20;
  CT.PASOS = ['Datos', 'Transición', 'J y K', 'Mapas', 'Circuito', 'Verificar'];
  CT.RANGO_K = { 3: [4, 7], 4: [5, 10] };
  CT.K_DEF = { 3: 5, 4: 6 };

  const SUB = ['₀', '₁', '₂', '₃'];
  CT.sub = (b) => SUB[b];
  CT.nombres = (n) => Array.from({ length: n }, (_, i) => 'Q' + SUB[n - 1 - i]);
  CT.entradas = (n) => {
    const r = [];
    for (let b = n - 1; b >= 0; b--) {
      r.push({ e: r.length, b, tipo: 'J', nom: 'J' + SUB[b], tex: 'J_{' + b + '}' });
      r.push({ e: r.length, b, tipo: 'K', nom: 'K' + SUB[b], tex: 'K_{' + b + '}' });
    }
    return r;
  };
  CT.bin = (x, n) => x.toString(2).padStart(n, '0');
  CT.bits = (x, n) => Array.from({ length: n }, (_, j) => (x >> (n - 1 - j)) & 1);
  CT.deBits = (arr) => arr.reduce((a, v) => a * 2 + v, 0);
  CT.txtBit = (v) => (v === 2 ? 'X' : v === 0 || v === 1 ? String(v) : '?');

  // ---------------- secuencias ----------------
  CT.parsear = (texto) => String(texto || '').split(/[^0-9]+/).filter((x) => x !== '').map(Number);
  CT.validar = function (n, seq) {
    const N = 1 << n;
    if (!Array.isArray(seq) || seq.length < 3) return { ok: false, motivo: 'Escribe al menos 3 estados.' };
    if (seq.length > N - 1) return { ok: false, motivo: 'Con ' + n + ' bits caben como máximo ' + (N - 1) + ' estados (debe quedar al menos uno sin usar).' };
    if (seq.some((s) => !Number.isInteger(s) || s < 0 || s >= N)) return { ok: false, motivo: 'Con ' + n + ' bits los estados van de 0 a ' + (N - 1) + '.' };
    if (new Set(seq).size !== seq.length) return { ok: false, motivo: 'Hay un estado repetido: para repetir estados haría falta otro flip-flop.' };
    if (Math.max(...seq) < N / 2) return { ok: false, motivo: 'Todos los estados son menores que ' + N / 2 + ': alcanzarían ' + (n - 1) + ' bits. Usa al menos un estado de ' + N / 2 + ' o más.' };
    return { ok: true };
  };
  // ¿cuenta seguida hacia arriba o hacia abajo? (no sirve: es un contador común)
  CT.trivial = function (n, seq) {
    const N = 1 << n;
    const sube = seq.every((s, i) => i === 0 || s === (seq[i - 1] + 1) % N);
    const baja = seq.every((s, i) => i === 0 || s === (seq[i - 1] - 1 + N) % N);
    return sube || baja;
  };
  CT.azar = function (n, k, r) {
    r = r || Math.random;
    const N = 1 << n;
    for (let t = 0; t < 400; t++) {
      const pool = Array.from({ length: N }, (_, i) => i);
      for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const x = pool[i]; pool[i] = pool[j]; pool[j] = x; }
      const s = pool.slice(0, k);
      if (!CT.trivial(n, s) && CT.validar(n, s).ok) return s;
    }
    return Array.from({ length: k }, (_, i) => (i * 3) % N);
  };

  CT.datos = function (asig) {
    const n = asig.n, seq = asig.seq.slice(), N = 1 << n, sig = {};
    seq.forEach((s, i) => { sig[s] = seq[(i + 1) % seq.length]; });
    const noUsados = [];
    for (let s = 0; s < N; s++) if (!(s in sig)) noUsados.push(s);
    return { n, N, k: seq.length, seq, sig, noUsados, usado: (s) => s in sig };
  };

  // ---------------- excitación del JK ----------------
  // q = bit actual (0 / 1); q1 = bit siguiente (0 / 1 / 2 = X) → [J, K] con 2 = X
  CT.exc = (q, q1) => (q1 === 2 ? [2, 2] : q === 0 ? [q1, 2] : [2, 1 - q1]);
  // fila de J y K del estado s, con su siguiente en bits (más alto primero)
  CT.filaJK = function (n, s, sigBits) {
    const out = [];
    for (let j = 0; j < n; j++) out.push(...CT.exc((s >> (n - 1 - j)) & 1, sigBits[j]));
    return out;
  };
  // tabla de transición «correcta» de un estudiante: los usados vienen de la secuencia y los no usados de su decisión
  CT.transEsperada = function (d, s, decision) {
    if (d.usado(s)) return CT.bits(d.sig[s], d.n);
    return decision;
  };
  // valores del mapa de la entrada e a partir de la tabla de J y K (filas[s] = 2n valores)
  CT.columna = (filas, e) => filas.map((f) => f[e]);

  // ---------------- circuito ----------------
  const valLit = (n, m, c) => (((m >> (n - 1 - (c >> 1))) & 1) ^ (c & 1)) === 1;
  CT.evalEnt = function (n, ent, m) {
    if (!ent) return 0;
    if (ent.c === 1) return 1;
    if (ent.c === 0) return 0;
    return (ent.p || []).some((g) => g.length && g.every((c) => valLit(n, m, c))) ? 1 : 0;
  };
  CT.fnEnt = (n, ent) => Array.from({ length: 1 << n }, (_, m) => CT.evalEnt(n, ent, m));
  CT.entVacia = (ent) => !ent || (ent.c !== 0 && ent.c !== 1 && !(ent.p || []).some((g) => g.length));
  CT.deCubos = function (n, cubos) {
    if (!cubos || !cubos.length) return { c: 0, p: [] };
    if (cubos.some((cb) => !cb.mask)) return { c: 1, p: [] };
    return {
      c: null,
      p: cubos.map((cb) => {
        const g = [];
        for (let i = 0; i < n; i++) { const b = 1 << (n - 1 - i); if (cb.mask & b) g.push(2 * i + (cb.val & b ? 0 : 1)); }
        return g;
      })
    };
  };
  // ¿el circuito hace lo que pide el mapa? (las X no importan)
  CT.entCumple = (n, ent, vals) => { const f = CT.fnEnt(n, ent); return vals.every((v, m) => v === 2 || f[m] === v); };
  CT.cuentaCompuertas = function (n, ents) {
    let and = 0, or = 0;
    const neg = new Set();
    ents.forEach((ent) => {
      if (!ent || ent.c === 0 || ent.c === 1) return;
      const g = (ent.p || []).filter((x) => x.length);
      g.forEach((x) => { if (x.length > 1) and++; x.forEach((c) => { if (c & 1) neg.add(c >> 1); }); });
      if (g.length > 1) or++;
    });
    return { and, or, neg: neg.size };
  };

  // ---------------- simulación del contador armado ----------------
  CT.siguiente = function (n, ents, s) {
    let r = 0;
    for (let j = 0; j < n; j++) {
      const b = n - 1 - j, q = (s >> b) & 1;
      const J = CT.evalEnt(n, ents[2 * j], s), K = CT.evalEnt(n, ents[2 * j + 1], s);
      const q1 = q ? (K ? 0 : 1) : J ? 1 : 0;
      r |= q1 << b;
    }
    return r;
  };
  CT.simular = function (n, ents, seq) {
    const N = 1 << n, enSeq = new Set(seq);
    const tabla = Array.from({ length: N }, (_, s) => CT.siguiente(n, ents, s));
    const recorrido = [seq[0]];
    let s = seq[0];
    for (let i = 0; i < seq.length; i++) { s = tabla[s]; recorrido.push(s); }
    const cicloOK = seq.every((x, i) => tabla[x] === seq[(i + 1) % seq.length]);
    const noUsados = [];
    for (let u = 0; u < N; u++) {
      if (enSeq.has(u)) continue;
      const camino = [u], vistos = new Set([u]);
      let x = u, entra = null;
      for (let p = 0; p < N + 1; p++) {
        x = tabla[x];
        camino.push(x);
        if (enSeq.has(x)) { entra = x; break; }
        if (vistos.has(x)) break;
        vistos.add(x);
      }
      noUsados.push({ s: u, camino, entra, pulsos: entra === null ? null : camino.length - 1 });
    }
    return { tabla, recorrido, cicloOK, noUsados, autocorregible: noUsados.every((x) => x.entra !== null) };
  };

  // diseño de referencia: no usados con X y la mínima de cada mapa (para el aviso «tiene trampa» del panel)
  CT.disenoX = function (n, seq) {
    const d = CT.datos({ n, seq });
    const filas = Array.from({ length: d.N }, (_, s) => (d.usado(s) ? CT.filaJK(n, s, CT.bits(d.sig[s], n)) : Array(2 * n).fill(2)));
    const ents = CT.entradas(n).map((x) => CT.deCubos(n, Kmap().resolver(n, CT.columna(filas, x.e)).cubos));
    return { d, filas, ents, sim: CT.simular(n, ents, seq) };
  };
  CT.trampa = function (n, seq) {
    const r = CT.disenoX(n, seq);
    return { atrapados: r.sim.noUsados.filter((u) => u.entra === null).map((u) => u.s), sim: r.sim, ents: r.ents, filas: r.filas };
  };

  // ---------------- intentos y puntos ----------------
  // ítem = { int: intentos usados, est: '' | 'mal' | 'ok' | 'mos' (mostrado) }
  CT.valor = (it) => (it && it.est === 'ok' ? (it.int <= 1 ? 1 : 0.5) : 0);
  CT.intentar = function (it, bien) {
    it.int = (it.int || 0) + 1;
    if (bien) it.est = 'ok';
    else it.est = it.int >= 2 ? 'mos' : 'mal';
    return it.est;
  };
  CT.cerrado = (it) => it && (it.est === 'ok' || it.est === 'mos');

  // E = estado del estudiante (ver ct-estudiante.js)
  CT.puntos = function (E) {
    const P = { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0 };
    if (!E || !E.n) return Object.assign(P, { total: 0 });
    const d = CT.datos(E), n = E.n, N = 1 << n, ne = 2 * n;
    if (E.p1) P.p1 = ['k', 'n', 'nu'].reduce((a, x) => a + CT.valor(E.p1[x]), 0);
    if (E.p2) P.p2 = d.seq.reduce((a, s) => a + CT.valor(E.p2.f[s]), 0) * (CT.PTS.p2 / d.k);
    if (E.p3) P.p3 = E.p3.f.reduce((a, f) => a + CT.valor(f), 0) * (CT.PTS.p3 / N);
    if (E.p4) {
      const w = CT.PTS.p4 / ne;
      P.p4 = E.p4.m.reduce((a, m) => {
        const ex = m.ex || {};
        const corr = ex.ok1 === 1 ? 1 : ex.ok1 === 2 ? 0.5 : 0;
        const min = ex.est === 'ok' && ex.min ? (ex.int <= 1 ? 1 : 0.5) : 0;
        return a + w * (0.25 * CT.valor(m.fill) + 0.5 * corr + 0.25 * min);
      }, 0);
    }
    if (E.p5) P.p5 = E.p5.e.reduce((a, x) => a + CT.valor(x), 0) * (CT.PTS.p5 / ne);
    if (E.p6) P.p6 = (E.p6.pred && E.p6.pred.ok ? 1 : 0) + (E.p6.atr && E.p6.atr.ok ? 1 : 0);
    Object.keys(P).forEach((k) => { P[k] = Math.round(P[k] * 100) / 100; });
    P.total = Math.round((P.p1 + P.p2 + P.p3 + P.p4 + P.p5 + P.p6) * 100) / 100;
    return P;
  };
  // errores = intentos fallidos (para el panel)
  CT.errores = function (E) {
    let e = 0;
    const cuenta = (it) => { if (!it) return; if (it.est === 'mos') e += 2; else if (it.int >= 2 || it.est === 'mal') e += 1; };
    if (!E || !E.n) return 0;
    if (E.p1) ['k', 'n', 'nu'].forEach((x) => cuenta(E.p1[x]));
    if (E.p2) E.p2.f.forEach(cuenta);
    if (E.p3) E.p3.f.forEach(cuenta);
    if (E.p4) E.p4.m.forEach((m) => { cuenta(m.fill); cuenta(m.ex); });
    if (E.p5) E.p5.e.forEach(cuenta);
    return e;
  };
  // fórmulas en LaTeX
  CT.texTermino = function (g, n) {
    const nom = (i) => 'Q_{' + (n - 1 - i) + '}';
    return g.slice().sort((a, b) => a - b).map((c) => (c & 1 ? '\\overline{' + nom(c >> 1) + '}' : nom(c >> 1))).join('\\cdot ');
  };
  CT.texEnt = function (n, ent) {
    if (!ent || ent.c === 0) return '0';
    if (ent.c === 1) return '1';
    const g = (ent.p || []).filter((x) => x.length);
    return g.length ? g.map((x) => CT.texTermino(x, n)).join(' + ') : '0';
  };
  // texto con barra (HTML) para chips y tablas
  CT.htmlTermino = function (g, n) {
    const nm = CT.nombres(n);
    return g.slice().sort((a, b) => a - b).map((c) => (c & 1 ? '<span class="ov">' + nm[c >> 1] + '</span>' : nm[c >> 1])).join('·');
  };
  CT.htmlEnt = function (n, ent) {
    if (!ent || ent.c === 0) return '0';
    if (ent.c === 1) return '1';
    const g = (ent.p || []).filter((x) => x.length);
    return g.length ? g.map((x) => CT.htmlTermino(x, n)).join(' + ') : '?';
  };
})();
