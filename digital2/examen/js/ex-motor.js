// ============================================================
// Electrónica Digital 2 · examen por celular (12/11/2026): contadores síncronos no secuenciales con JK
// Mismo espacio RC que el parcial de Digital 1 (digital1/parcial/js/pd-motor.js, copiado; este archivo es propio),
// con 4 problemas sobre UN contador por carnet (3 bits, 5 estados, 3 sin usar), 100 pts. REDISEÑO 12/11: cada
// problema parte de LO QUE EL ESTUDIANTE RESPONDIÓ en el anterior (se copia solo) y se califica con sus números:
//   P1 tabla de transición (20); P2 tabla de J y K a partir de SU tabla (25); P3 seis mapas de Karnaugh en blanco: llenar,
//   agrupar sin restricciones y escribir la ecuación (30). El circuito se dibuja a mano en papel (sin paso en la plataforma)
// Lo que deja en blanco NO se completa: se queda con «?»; para los cálculos se usa lo correcto o X, pero no suma puntos.
// Usa CT (../contadores/js/ct-motor.js: secuencias, excitación, simulación) y D2.k (../base/kmap.js: mínima).
// Casillas: 'bit' (se toca: ? → 1 → 0 → X), 'op' (opciones, la correcta va primero y se mezcla) o numéricas.
// Los números en binario se escriben tal cual (101) y se comparan como número.
// ============================================================
(function () {
  const RC = (window.RCA = window.RCA || {});
  const CT = window.CT, K = window.D2.k;
  const SID = 'd2-ex1';

  // ---------- azar reproducible por carnet ----------
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  RC.rng = (semilla) => {
    let a = hash(String(semilla));
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  RC.mezclar = (r, arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const ent = (r, a, b) => a + Math.floor(r() * (b - a + 1));

  // ---------- lo que escribe el estudiante ----------
  RC.leer = (s) => {
    if (s == null) return { vacio: true };
    const t = String(s).trim().replace(/\s+/g, '').replace(/[−–—‒]/g, '-').replace(/^\+/, '').replace(/,/g, '.');
    if (t === '') return { vacio: true };
    if (/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return { v: Number(t) || 0 };
    return { invalido: true };
  };
  RC.cerca = (v, e, tol) => {
    const rel = tol && tol.rel != null ? tol.rel : 0, abs = tol && tol.abs != null ? tol.abs : 0.01;
    return isFinite(v) && isFinite(e) && Math.abs(v - e) <= Math.max(rel * Math.abs(e), abs) + 1e-9;
  };
  const EX = { rel: 0, abs: 0.01 };
  RC.txt = (x) => String(x).replace('.', ',');
  RC.tex = (x) => String(x).replace('.', '{,}');
  RC.opTxt = (o) => (o.h != null ? o.h : '\\(' + o.t + '\\)');
  RC.etTxt = (it) => (it.h != null ? it.h : '\\(' + it.et + '\\)');
  const M = (s) => '\\(' + s + '\\)';
  const bin = (s) => s.toString(2).padStart(3, '0');
  const bits = (s) => '<b class="mono pd-bits">' + s + '</b>';
  const SUBS = ['J<sub>2</sub>', 'K<sub>2</sub>', 'J<sub>1</sub>', 'K<sub>1</sub>', 'J<sub>0</sub>', 'K<sub>0</sub>'];
  const celda = (v) => (v === 2 ? 'X' : v === 0 || v === 1 ? String(v) : '?');
  const deTxt = (s) => (s === '1' ? 1 : s === '0' ? 0 : s === 'X' ? 2 : -1);

  // ---------- distractores de una expresión (fallan en alguna casilla que sí importa) ----------
  const clave = (e) => (e.c === 0 || e.c === 1 ? 'c' + e.c : (e.p || []).map((g) => g.slice().sort((a, b) => a - b).join('.')).sort().join('+'));
  function mutar(r, e) {
    const L = () => ent(r, 0, 5);
    const nuevoTermino = () => { const k = ent(r, 1, 2), g = []; while (g.length < k) { const v = ent(r, 0, 2); if (!g.some((c) => c >> 1 === v)) g.push(2 * v + ent(r, 0, 1)); } return g; };
    if (e.c === 0 || e.c === 1) {
      const o = ent(r, 0, 2);
      if (o === 0) return { c: 1 - e.c, p: [] };
      return { c: null, p: [o === 1 ? [L()] : nuevoTermino()] };
    }
    const p = e.p.map((g) => g.slice());
    const op = ent(r, 0, 6), i = ent(r, 0, p.length - 1), g = p[i];
    if (op === 0) { const j = ent(r, 0, g.length - 1); g[j] ^= 1; }
    else if (op === 1) { if (g.length > 1) g.splice(ent(r, 0, g.length - 1), 1); else g[0] ^= 1; }
    else if (op === 2) { const j = ent(r, 0, g.length - 1), v = ent(r, 0, 2); if (!g.some((c) => c >> 1 === v)) g[j] = 2 * v + (g[j] & 1); else g[j] ^= 1; }
    else if (op === 3) { if (g.length < 3) { const v = ent(r, 0, 2); if (!g.some((c) => c >> 1 === v)) g.push(2 * v + ent(r, 0, 1)); else g[0] ^= 1; } else g[0] ^= 1; }
    else if (op === 4) { if (p.length > 1) p.splice(i, 1); else p.push(nuevoTermino()); }
    else if (op === 5) p.push(nuevoTermino());
    else return { c: ent(r, 0, 1), p: [] };
    return { c: null, p };
  }
  function opciones(r, correcta, mapa) {
    const vistos = new Set([clave(correcta)]), out = [];
    for (let t = 0; t < 600 && out.length < 3; t++) {
      const e = mutar(r, correcta);
      const k = clave(e);
      if (vistos.has(k) || CT.entCumple(3, e, mapa)) continue;
      vistos.add(k);
      out.push(e);
    }
    return [correcta].concat(out);
  }

  // ---------- el contador de cada carnet (lo que no depende de lo que responda) ----------
  const bases = {};
  function baseDe(carnet) {
    if (bases[carnet]) return bases[carnet];
    const r = RC.rng(String(carnet) + '|' + SID + '|c');
    const seq = CT.azar(3, 5, r);
    const d = CT.datos({ n: 3, seq });
    return (bases[carnet] = { n: 3, seq, d, sigOk: Array.from({ length: 8 }, (_, s) => (d.usado(s) ? CT.bits(d.sig[s], 3) : [2, 2, 2])) });
  }

  // ---------- lo que sale de las respuestas del propio estudiante (cadena P1 → P2 → P3) ----------
  const vv = (est, k) => (est && est[k] && est[k].vals) || {};
  // grupos de un mapa «mask:val,mask:val» y entradas del circuito «k0», «k1» o «2.5|0» (términos con literales 2·i + negada)
  RC.decG = (s) => (s ? String(s).split(',').filter(Boolean).map((x) => { const [a, b] = x.split(':'); return { mask: +a, val: +b }; }) : []);
  RC.encG = (g) => g.map((x) => x.mask + ':' + x.val).join(',');
  RC.decMapa = (s) => (s ? String(s).split('').map((c) => (c === '1' ? 1 : c === 'X' ? 2 : 0)) : null);
  RC.encMapa = (v) => v.map((x) => (x === 1 ? '1' : x === 2 ? 'X' : '0')).join('');
  RC.decEnt = (s) => (s == null || s === '' ? null : s === 'k0' ? { c: 0, p: [] } : s === 'k1' ? { c: 1, p: [] } : { c: null, p: s === '-' ? [[]] : String(s).split('|').map((t) => (t === '' ? [] : t.split('.').map(Number))) });
  RC.encEnt = (e) => (e.c === 0 ? 'k0' : e.c === 1 ? 'k1' : e.p.length ? e.p.map((g) => g.join('.')).join('|') : '-');
  // grupos que marcó el estudiante (listas de celdas): los que forman un rectángulo válido se dibujan con su contorno
  RC.cuboDe = (cells) => {
    const n = cells.length;
    if (!n || (n & (n - 1))) return null;
    let y = 7, o = 0;
    cells.forEach((m) => { y &= m; o |= m; });
    const mask = 7 & ~(y ^ o), val = y & mask;
    const pc = (mask & 1) + ((mask >> 1) & 1) + ((mask >> 2) & 1);
    return 1 << (3 - pc) === n ? { mask, val } : null;
  };
  RC.vistaGrupos = (grupos) => { let vi = 0; return grupos.map((c) => { const cubo = RC.cuboDe(c); return { cells: c, cubo, vi: cubo ? vi++ : -1 }; }); };
  const memo = {};
  function derivar(carnet, est) {
    const b = baseDe(carnet), v1 = vv(est, 'p1'), v2 = vv(est, 'p2'), v3 = vv(est, 'p3');
    const llave = carnet + '|' + JSON.stringify([v1, v2, v3]);
    if (memo[llave]) return memo[llave];
    const m = {};
    // P1 → su tabla de transición (en blanco se muestra «?»; para seguir calculando se usa lo correcto)
    m.sig = []; m.sigTxt = [];
    for (let s = 0; s < 8; s++) {
      const fila = [], txt = [];
      for (let j = 0; j < 3; j++) {
        const x = deTxt(String(v1['t' + s + '_' + j] || '').toUpperCase());
        txt.push(x === -1 ? '?' : celda(x));
        fila.push(x === -1 ? b.sigOk[s][j] : x);
      }
      m.sig.push(fila); m.sigTxt.push(txt.join(''));
    }
    m.filasOk = Array.from({ length: 8 }, (_, s) => CT.filaJK(3, s, m.sig[s]));
    // P2 → su tabla de J y K (en blanco: «?», y X en los mapas)
    const fx = (s, e) => deTxt(String(v2['j' + s + '_' + e] || '').toUpperCase());
    m.filas = Array.from({ length: 8 }, (_, s) => Array.from({ length: 6 }, (_, e) => (fx(s, e) === -1 ? 2 : fx(s, e))));
    m.filasTxt = Array.from({ length: 8 }, (_, s) => Array.from({ length: 6 }, (_, e) => (fx(s, e) === -1 ? '?' : celda(fx(s, e)))));
    m.mapas = CT.entradas(3).map((x) => CT.columna(m.filas, x.e));
    m.min3 = m.mapas.map((col) => K.resolver(3, col));
    m.ok3 = m.min3.map((r) => CT.deCubos(3, r.cubos));
    // P3 → la ecuación que escribió el estudiante en cada mapa (null = sin escribir)
    m.entsP3 = CT.entradas(3).map((x, i) => RC.decEnt(v3['q' + i]));
    if (Object.keys(memo).length > 200) for (const k in memo) delete memo[k];
    return (memo[llave] = m);
  }

  // ---------- piezas de texto ----------
  const secTex = (d) => M(d.seq.concat(d.seq[0]).map(String).join(' \\to '));
  const eqLineas = (ents) => CT.entradas(3).map((x, i) => M(x.tex + ' = ' + CT.texEnt(3, ents[i])));
  function tablaTuya(m, conSig, conJK) {
    const cab = ['Estado'].concat(conSig ? ['Siguiente'] : [], conJK ? SUBS : []);
    let h = '<table class="tt tight pd-tt pd-multi"><tr>' + cab.map((c) => `<th>${c}</th>`).join('') + '</tr>';
    for (let s = 0; s < 8; s++) h += `<tr><td class="mono">${bin(s)}</td>` + (conSig ? `<td class="mono">${m.sigTxt[s]}</td>` : '') + (conJK ? m.filasTxt[s].map((x) => `<td>${x}</td>`).join('') : '') + '</tr>';
    return h + '</table>';
  }
  const camino = (u) => u.camino.map((x) => bin(x)).join(' → ');
  const tablaJKformal = '<table class="tt pd-tt pd-act"><tr><th>Q</th><th>Q<sup>+</sup></th><th>J</th><th>K</th></tr><tr><td>0</td><td>0</td><td>0</td><td>X</td></tr><tr><td>0</td><td>1</td><td>1</td><td>X</td></tr><tr><td>1</td><td>0</td><td>X</td><td>1</td></tr><tr><td>1</td><td>1</td><td>X</td><td>0</td></tr></table>';
  const textoEnt = (m, i) => M(CT.entradas(3)[i].tex + ' = ' + CT.texEnt(3, m.entsP3[i]));

  const P = {};

  // ===== P1: tabla de transición (20) =====
  P.p1 = {
    titulo: 'Tabla de transición', max: 20, casillas: 24,
    enunciado: (d) => `<p>Diseña un contador <b>síncrono</b> con flip-flops JK que cuente, en este orden, los estados (en decimal) y luego repita:</p>
      <div class="ex-func">${secTex(d)}</div>
      <p>Lo que completes aquí se copia solo al paso siguiente.</p>`,
    pasos: (d) => [
      { t: 'Tabla de transición', nota: 'Escribe el estado siguiente de cada fila bit por bit.',
        multi: { cols: ['Estado', 'Q<sub>2</sub><sup>+</sup>', 'Q<sub>1</sub><sup>+</sup>', 'Q<sub>0</sub><sup>+</sup>'] },
        items: (() => { const o = []; for (let s = 0; s < 8; s++) for (let j = 0; j < 3; j++) o.push({ id: 't' + s + '_' + j, h: `Estado ${bin(s)}, Q<sub>${2 - j}</sub><sup>+</sup>`, tipo: 'bit', fila: s, col: j, bits: bin(s), sig: '', pts: d.d.usado(s) ? 0.8 : 8 / 9, x: true }); return o; })() }
    ],
    esperado: (d, vals) => {
      const o = {};
      vals = vals || {};
      for (let s = 0; s < 8; s++) {
        const usado = d.d.usado(s);
        const fila = [0, 1, 2].map((j) => String(vals['t' + s + '_' + j] || '').toUpperCase());
        const okF = fila.every((x) => x === 'X') || (fila.every((x) => x === '0' || x === '1') && d.seq.includes(parseInt(fila.join(''), 2)));
        for (let j = 0; j < 3; j++) {
          const id = 't' + s + '_' + j;
          o[id] = usado ? String((d.d.sig[s] >> (2 - j)) & 1) : { ok: () => okF, txt: 'XXX, o un estado de la secuencia' };
        }
      }
      return o;
    },
    final: (d) => [
      `<p><b>Siguiente:</b> es el que sigue en la lista; el último vuelve al primero. ${d.seq.map((s) => bits(bin(s)) + ' → ' + bits(bin(d.d.sig[s]))).join('; ')}.</p>`,
      `<p><b>Sin usar</b> (${d.d.noUsados.map((s) => bits(bin(s))).join('; ')}): se pueden dejar en X (los mapas se simplifican más, pero hay que comprobar que no se atrapen) o forzar cada uno a un estado de la secuencia (sin X). Ambas son válidas.</p>`]
  };

  // ===== P2: tabla de J y K con SU tabla de transición (25) =====
  P.p2 = {
    titulo: 'Tabla de excitación J y K', max: 25, casillas: 48,
    enunciado: () => `<p>Aquí está <b>tu tabla de transición</b> del paso anterior (lo que dejaste en blanco sigue con «?»). Completa J y K de cada flip-flop en las 8 filas con esta tabla de excitación:</p><div class="pd-tabla">${tablaJKformal}</div>`,
    pasos: (d, m) => [{
      t: 'Tabla de J y K', multi: { cols: ['Estado → siguiente'].concat(SUBS) },
      items: (() => { const o = []; for (let s = 0; s < 8; s++) for (let e = 0; e < 6; e++) o.push({ id: 'j' + s + '_' + e, tipo: 'bit', fila: s, col: e, pts: d.d.usado(s) ? 0.6 : 7 / 18, x: true, h: `Estado ${bin(s)}, ${SUBS[e]}`, bits: bin(s), sig: m.sigTxt[s] }); return o; })()
    }],
    esperado: (d, vals, m) => { const o = {}; for (let s = 0; s < 8; s++) for (let e = 0; e < 6; e++) o['j' + s + '_' + e] = celda(m.filasOk[s][e]); return o; },
    final: (d, m) => [`<p>Con tu tabla de transición, usando la tabla de excitación del JK. Un siguiente en X da X en J y K.</p>`,
      tablaTuya(Object.assign({}, m, { filasTxt: m.filasOk.map((f) => f.map(celda)) }), true, true)]
  };

  // ===== P3: seis mapas de Karnaugh (30). Agrupa libremente (sin restricciones) y escribe la ecuación =====
  const PM = [1.25, 2.5, 1.25];
  P.p3 = {
    titulo: 'Mapas de Karnaugh', max: 30, casillas: 18,
    enunciado: (d, m) => `<p>Esta es <b>tu tabla de J y K</b> del paso anterior (lo que dejaste en blanco sigue con «?»; en el mapa cuenta como X):</p><div class="pd-tabla">${tablaTuya(m, true, true)}</div>
      <p>Para cada entrada (J<sub>2</sub>, K<sub>2</sub>, J<sub>1</sub>, K<sub>1</sub>, J<sub>0</sub>, K<sub>0</sub>):</p>
      <p>1) llena su mapa de Karnaugh con su columna;<br>2) marca tus grupos;<br>3) escribe la ecuación lógica que corresponde a tus marcas.</p>
      <p><b>Al terminar el examen:</b> dibuja a mano alzada, en papel, el circuito del contador con flip-flops JK y compuertas lógicas, según tus ecuaciones, y entrégalo al docente.</p>`,
    pasos: (d, m) => [{ t: 'Mapas de J y K', mapas: true,
      items: [].concat(...CT.entradas(3).map((x, i) => ['L', 'E', 'M'].map((q, k) => ({
        id: q + i, tipo: 'mapa', sub: q, i, pts: PM[k], h: `${x.nom}: ${q === 'L' ? 'mapa lleno' : q === 'E' ? 'ecuación correcta' : 'ecuación mínima'}`,
        txt: q === 'L' ? m.mapas[i].map(celda).join('') : M(x.tex + ' = ' + CT.texEnt(3, m.ok3[i])),
        mostrar: (v) => (q === 'L' ? (v['m' + i] || '—') : v['q' + i] ? M(x.tex + ' = ' + CT.texEnt(3, RC.decEnt(v['q' + i]))) : '—')
      })))) }],
    esperado: () => ({}),
    final: (d, m) => [`<p>Se llena cada mapa con su columna; se agrupan los 1 (y las X solo si agrandan un grupo) en rectángulos de 1, 2, 4 u 8 celdas, y cada grupo es el producto de las variables que no cambian dentro de él. Con tu tabla:</p>`].concat(CT.entradas(3).map((x, i) => '<p class="mono">' + M(x.tex + ' = ' + CT.texEnt(3, m.ok3[i])) + '</p>'))
  };

  Object.keys(P).forEach((k) => ['pasos', 'enunciado', 'final'].forEach((f) => { const g = P[k][f]; P[k][f] = (d, m) => g(d, m || d.mio); }));

  RC.P = P;
  RC.PROB = ['p1', 'p2', 'p3'];
  RC.MAX = Object.fromEntries(RC.PROB.map((k) => [k, P[k].max]));
  RC.TITULO = Object.fromEntries(RC.PROB.map((k, i) => [k, 'P' + (i + 1)]));
  RC.NOMBRE = Object.fromEntries(RC.PROB.map((k) => [k, P[k].titulo]));

  RC.datos = (k, carnet, car, est) => {
    const b = baseDe(carnet), m = derivar(carnet, est);
    const d = Object.assign({}, b, { prob: k, mio: m, op: {} });
    P[k].pasos(d, m).forEach((ps) => ps.items.forEach((it) => {
      if (it.tipo !== 'op') return;
      d.op[it.id] = P[k].opsDe(d, it.id).map((o, i) => ({ ...o, ok: o.ok != null ? o.ok : i === 0 }));
    }));
    return d;
  };
  RC.items = (k, d) => P[k].pasos(d, d.mio).reduce((a, ps) => a.concat(ps.items), []);
  RC.casillas = (k) => P[k].casillas;
  RC.TOTAL_CASILLAS = RC.PROB.reduce((s, k) => s + RC.casillas(k), 0);

  RC.calificar = (k, d, vals) => {
    vals = vals || {};
    const items = RC.items(k, d), esp = P[k].esperado(d, vals, d.mio), m = d.mio, cel = {};
    let pts = 0;
    items.forEach((it) => {
      const v = vals[it.id], vacio = v == null || String(v).trim() === '';
      let r, exp;
      if (it.tipo === 'op') {
        exp = d.op[it.id].findIndex((o) => o.ok);
        r = vacio ? 'vacio' : it.libre ? 'ok' : Number(v) === exp ? 'ok' : 'mal';
        if (it.libre) exp = vacio ? 0 : Number(v);
      } else if (it.tipo === 'mapa') {
        const mv = vals['m' + it.i], qv = vals['q' + it.i], col = m.mapas[it.i], e = RC.decEnt(qv);
        exp = it.txt;
        const tam = (x) => (x.c === 0 || x.c === 1 ? [0, x.c] : [x.p.filter((g) => g.length).length, x.p.reduce((a, g) => a + g.length, 0)]);
        const mn = tam(m.ok3[it.i]);
        if (it.sub === 'L') r = mv == null ? 'vacio' : RC.decMapa(mv).every((x, s2) => x === col[s2]) ? 'ok' : 'mal';
        else if (!e) r = 'vacio';
        else if (!CT.entCumple(3, e, col)) r = 'mal';
        else if (it.sub === 'E') r = 'ok';
        else { const t = tam(e); r = t[0] === mn[0] && t[1] === mn[1] ? 'ok' : 'mal'; }
      } else if (it.tipo === 'bit') {
        const eo = esp[it.id], s = vacio ? '' : String(v).trim().toUpperCase();
        if (eo && typeof eo === 'object') { exp = eo.txt; r = vacio ? 'vacio' : eo.ok() ? 'ok' : 'mal'; }
        else { exp = String(eo); r = vacio ? 'vacio' : s === exp ? 'ok' : 'mal'; }
      } else {
        const lista = [].concat(esp[it.id]), q = RC.leer(v);
        exp = lista[0];
        r = q.vacio ? 'vacio' : q.invalido ? 'mal' : lista.some((e) => RC.cerca(q.v, e, it.tol)) ? 'ok' : 'mal';
      }
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
