// ============================================================
// Electrónica Digital 2 · examen por celular (12/11/2026): une el PROBLEMA 1 (contador JK, 5 estados) y el PROBLEMA 2 (contador con flip-flops D, 6 estados)
// Cada problema conserva su motor (ex-motor.js = RCA, ex2-motor.js = RCB); este archivo arma el espacio RC que usan el estudiante y el panel.
// Pasos: p1, p2, p3 (problema 1) y q1, q2, q3, q4 (problema 2). Cada problema vale 50; el peso de cada paso es provisional (editable en PESO).
// ============================================================
(function () {
  const A = window.RCA, B = window.RCB, CT = window.CT;
  const RC = (window.RC = window.RC || {});
  ['rng', 'mezclar', 'leer', 'cerca', 'txt', 'tex', 'opTxt', 'etTxt', 'decMapa', 'encMapa', 'decEnt', 'encEnt', 'cuboDe', 'vistaGrupos'].forEach((k) => { RC[k] = A[k]; });
  const MB = { q1: 'p1', q2: 'p2', q3: 'p3', q4: 'p4' };
  const PESO = { p1: 15, p2: 15, p3: 20, q1: 5, q2: 10, q3: 15, q4: 20 };
  RC.PROB = ['p1', 'p2', 'p3', 'q1', 'q2', 'q3', 'q4'];
  RC.MAX = Object.assign({}, PESO);
  const sub = (k) => (MB[k] ? [B, MB[k]] : [A, k]);
  const subEst = (k, est) => {
    est = est || {};
    return MB[k] ? { p1: est.q1, p2: est.q2, p3: est.q3, p4: est.q4 } : { p1: est.p1, p2: est.p2, p3: est.p3 };
  };
  const vals = (est, k) => (est && est[k] && est[k].vals) || {};
  const f = (k) => { const [M, s] = sub(k); return PESO[k] / M.MAX[s]; };
  const esc = (k, it) => Object.assign({}, it, { pts: it.pts * f(k) });
  RC.GRUPOS = [{ t: 'Problema 1: contador con flip-flops JK', ks: ['p1', 'p2', 'p3'] }, { t: 'Problema 2: contador con flip-flops D', ks: ['q1', 'q2', 'q3', 'q4'] }];
  RC.TAB = { p1: 'Paso 1', p2: 'Paso 2', p3: 'Paso 3', q1: 'Paso 1', q2: 'Paso 2', q3: 'Paso 3', q4: 'Paso 4' };
  RC.TITULO = Object.fromEntries(RC.PROB.map((k) => [k, (MB[k] ? 'Problema 2, paso ' : 'Problema 1, paso ') + RC.TAB[k].slice(5)]));
  RC.NOMBRE = Object.fromEntries(RC.PROB.map((k) => { const [M, s] = sub(k); return [k, M.P[s].titulo]; }));
  RC.ENTS = { p3: CT.entradas(3), q4: B.ENT };
  RC.P = {};
  RC.PROB.forEach((k) => {
    const [M, s] = sub(k), P0 = M.P[s];
    RC.P[k] = {
      titulo: P0.titulo, max: PESO[k], casillas: P0.casillas,
      enunciado: (d) => P0.enunciado(d),
      final: (d) => P0.final(d),
      pasos: (d) => P0.pasos(d).map((ps) => Object.assign({}, ps, { items: ps.items.map((it) => esc(k, it)) })),
      esperado: (d, v) => P0.esperado(d, v, d.mio)
    };
  });
  RC.datos = (k, carnet, car, est) => { const [M, s] = sub(k); return Object.assign(M.datos(s, carnet, car, subEst(k, est)), { prob: k }); };
  RC.items = (k, d) => { const [M, s] = sub(k); return M.items(s, d).map((it) => esc(k, it)); };
  RC.casillas = (k) => { const [M, s] = sub(k); return M.casillas(s); };
  RC.TOTAL_CASILLAS = RC.PROB.reduce((n, k) => n + RC.casillas(k), 0);
  RC.calificar = (k, d, v) => {
    const [M, s] = sub(k), r = M.calificar(s, d, v), fk = f(k), cel = {};
    Object.keys(r.cel).forEach((id) => { const c = r.cel[id]; cel[id] = Object.assign({}, c, { pts: c.pts * fk, max: c.max * fk }); });
    return { pts: Math.round(r.pts * fk * 100) / 100, max: PESO[k], cel };
  };
  RC.nota = (carnet, est) => {
    const res = {};
    let total = 0;
    RC.PROB.forEach((k) => { res[k] = RC.calificar(k, RC.datos(k, carnet, '', est), vals(est, k)); total += res[k].pts; });
    return { total: Math.round(total * 100) / 100, res };
  };
  RC.avance = (est) => {
    let n = 0;
    RC.PROB.forEach((k) => { const v = vals(est, k); n += Object.keys(v).filter((id) => v[id] !== '' && v[id] != null).length; });
    return Math.min(100, Math.round((100 * n) / RC.TOTAL_CASILLAS));
  };
  RC.firma = (est) => {
    const s = JSON.stringify(RC.PROB.map((k) => vals(est, k)));
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  };
})();
