// ============================================================
// Electrónica Digital 2 · examen por celular (12/11/2026): contadores síncronos no secuenciales con JK
// Mismo espacio RC que el parcial de Digital 1 (digital1/parcial/js/pd-motor.js, copiado; este archivo es propio),
// con 5 problemas sobre UN contador por carnet (3 bits, 5 estados, 3 sin usar), 100 pts. REDISEÑO 12/11: cada
// problema parte de LO QUE EL ESTUDIANTE RESPONDIÓ en el anterior (se copia solo) y se califica con sus números:
//   P1 datos, método para los sin usar (X o forzar: lo elige él) y tabla de transición (20)
//   P2 tabla de J y K a partir de su tabla de transición (25); P3 expresión mínima de cada J y K de SU tabla (25)
//   P4 circuito: contar compuertas de las expresiones que eligió (15); P5 estados sin usar con su circuito (15)
// Lo que deja en blanco se completa con el valor correcto para poder seguir (y no suma puntos). Sin pistas.
// Usa CT (../contadores/js/ct-motor.js: secuencias, excitación, simulación) y D2.k (../base/kmap.js: mínima).
// Casillas: 'bit' (se toca: ? → 1 → 0 → X), 'op' (opciones, la correcta va primero y se mezcla) o numéricas.
// Los números en binario se escriben tal cual (101) y se comparan como número.
// ============================================================
(function () {
  const RC = (window.RC = window.RC || {});
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

  // ---------- lo que sale de las respuestas del propio estudiante (cadena P1 → P2 → P3 → P4 → P5) ----------
  const vv = (est, k) => (est && est[k] && est[k].vals) || {};
  const memo = {};
  function derivar(carnet, est) {
    const b = baseDe(carnet), v1 = vv(est, 'p1'), v2 = vv(est, 'p2'), v3 = vv(est, 'p3');
    const llave = carnet + '|' + JSON.stringify([v1, v2, v3]);
    if (memo[llave]) return memo[llave];
    const m = { forzar: v1.met === '1' };
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
    const fx = (s, e) => deTxt(String(v2['j' + s + '_' + e] || '').toUpperCase());
    m.filas = Array.from({ length: 8 }, (_, s) => Array.from({ length: 6 }, (_, e) => (fx(s, e) === -1 ? 2 : fx(s, e))));
    m.filasTxt = Array.from({ length: 8 }, (_, s) => Array.from({ length: 6 }, (_, e) => (fx(s, e) === -1 ? '?' : celda(fx(s, e)))));
    m.mapas = CT.entradas(3).map((x) => CT.columna(m.filas, x.e));
    m.ok3 = m.mapas.map((col) => CT.deCubos(3, K.resolver(3, col).cubos));
    m.opt3 = m.mapas.map((col, i) => {
      const r = RC.rng(String(carnet) + '|' + SID + '|p3|e' + i + '|' + col.join(''));
      const lista = opciones(r, m.ok3[i], col).map((e, k) => ({ t: CT.texEnt(3, e), e, ok: k === 0 }));
      return RC.mezclar(RC.rng(String(carnet) + '|' + SID + '|p3o|' + i + '|' + col.join('')), lista);
    });
    m.ents = m.opt3.map((lista, i) => { const q = v3['e' + i]; return q != null && q !== '' && lista[Number(q)] ? lista[Number(q)].e : m.ok3[i]; });
    m.cnt = CT.cuentaCompuertas(3, m.ents);
    m.constantes = m.ents.filter((e) => e.c === 0 || e.c === 1).length;
    m.sim = CT.simular(3, m.ents, b.seq);
    m.noUs = b.d.noUsados.map((s, i) => ({ s, sig: m.sim.tabla[s], camino: m.sim.noUsados[i].camino, entra: m.sim.noUsados[i].entra, pulsos: m.sim.noUsados[i].pulsos }));
    m.atrapa = !m.sim.autocorregible;
    m.pulsos = m.atrapa ? 0 : Math.max(...m.noUs.map((u) => u.pulsos));
    m.cicloOK = m.sim.cicloOK;
    if (Object.keys(memo).length > 200) for (const k in memo) delete memo[k];
    return (memo[llave] = m);
  }

  // ---------- piezas de texto ----------
  const secTex = (d) => M(d.seq.concat(d.seq[0]).map(String).join(' \\to '));
  const eqLineas = (m) => CT.entradas(3).map((x, i) => M(x.tex + ' = ' + CT.texEnt(3, m.ents[i])));
  function tablaTuya(m, conSig, conJK) {
    const cab = ['Estado'].concat(conSig ? ['Siguiente'] : [], conJK ? SUBS : []);
    let h = '<table class="tt tight pd-tt pd-multi"><tr>' + cab.map((c) => `<th>${c}</th>`).join('') + '</tr>';
    for (let s = 0; s < 8; s++) h += `<tr><td class="mono">${bin(s)}</td>` + (conSig ? `<td class="mono">${m.sigTxt[s]}</td>` : '') + (conJK ? m.filasTxt[s].map((x) => `<td>${x}</td>`).join('') : '') + '</tr>';
    return h + '</table>';
  }
  const camino = (u) => u.camino.map((x) => bin(x)).join(' → ');
  const filasTrans = (d) => { const o = []; for (let s = 0; s < 8; s++) for (let j = 0; j < 3; j++) o.push({ id: 't' + s + '_' + j, h: `Estado ${bin(s)}, Q<sub>${2 - j}</sub><sup>+</sup>`, tipo: 'bit', fila: s, col: j, bits: bin(s), sig: '', pts: d.d.usado(s) ? 0.6 : 5 / 9, x: true }); return o; };

  const P = {};
  const OPC_MET = [{ h: 'Poner X en todos los estados sin usar (después compruebo si el contador se atrapa)' }, { h: 'Forzar cada estado sin usar a un estado de la secuencia (así siempre se corrige solo)' }];

  // ===== P1: datos, método y tabla de transición (20) =====
  P.p1 = {
    titulo: 'Datos y tabla de transición', max: 20, casillas: 27,
    enunciado: (d) => `<p>Diseña un contador <b>síncrono</b> con flip-flops JK que cuente, en este orden, los estados (en decimal) y luego repita:</p>
      <div class="ex-func">${secTex(d)}</div>
      <p>El estado es ${M('Q_{2}Q_{1}Q_{0}')} con ${M('Q_{2}')} como bit más alto (5 es ${bits('101')}). Los estados que no están en la lista no se usan. Hay <b>dos métodos</b> para tratarlos: dejarlos en X, o forzar cada uno a un estado de la secuencia. <b>Tú eliges</b>; los dos son válidos. Lo que completes aquí se copia solo al problema siguiente.</p>`,
    pasos: (d) => [
      { t: 'Datos y método', items: [{ id: 'n', h: 'Cantidad mínima de flip-flops', pts: 2, tol: EX }, { id: 'nu', h: 'Cantidad de estados sin usar', pts: 2, tol: EX }, { id: 'met', h: 'Método que usarás para los estados sin usar', pts: 2, tipo: 'op', libre: true, ordenFijo: true }] },
      { t: 'Tabla de transición', nota: 'Escribe el estado siguiente de cada fila, bit por bit. En los estados sin usar pon X o un estado de la secuencia (3 bits sin X), según el método que elegiste.',
        multi: { cols: ['Estado', 'Q<sub>2</sub><sup>+</sup>', 'Q<sub>1</sub><sup>+</sup>', 'Q<sub>0</sub><sup>+</sup>'] }, items: filasTrans(d) }
    ],
    opsDe: () => OPC_MET,
    esperado: (d, vals) => {
      const o = { n: [3], nu: [3] };
      vals = vals || {};
      const forzar = vals.met === '1';
      for (let s = 0; s < 8; s++) {
        const usado = d.d.usado(s);
        const fila = [0, 1, 2].map((j) => String(vals['t' + s + '_' + j] || '').toUpperCase());
        const okF = fila.every((x) => x === '0' || x === '1') && d.seq.includes(parseInt(fila.join(''), 2));
        for (let j = 0; j < 3; j++) {
          const id = 't' + s + '_' + j;
          if (usado) o[id] = String((d.d.sig[s] >> (2 - j)) & 1);
          else if (!forzar) o[id] = 'X';
          else o[id] = { ok: () => okF, txt: 'un estado de la secuencia (sin X)' };
        }
      }
      return o;
    },
    final: (d) => [
      `<p><b>Flip-flops:</b> el mayor estado es ${Math.max(...d.seq)} (${bits(bin(Math.max(...d.seq)))}) y necesita 3 bits: <b>3</b>. Con 3 flip-flops hay 8 estados, así que quedan <b>3 sin usar</b>: ${d.d.noUsados.map((s) => bits(bin(s))).join('; ')}.</p>`,
      `<p><b>Siguiente:</b> es el que sigue en la lista; el último vuelve al primero. ${d.seq.map((s) => bits(bin(s)) + ' → ' + bits(bin(d.d.sig[s]))).join('; ')}.</p>`,
      `<p><b>Sin usar:</b> con X los mapas se simplifican más, pero hay que comprobar que ninguno se atrape. Forzando, cada uno apunta a un estado de la secuencia: el circuito crece un poco, pero siempre se corrige solo. Ambos métodos se califican como válidos.</p>`]
  };

  // ===== P2: tabla de J y K con SU tabla de transición (25) =====
  P.p2 = {
    titulo: 'Tabla de excitación J y K', max: 25, casillas: 48,
    enunciado: () => `<p>Aquí está <b>tu tabla de transición</b> (la del problema anterior, copiada; lo que dejaste en blanco se completó con lo correcto). Completa las entradas <b>J y K</b> de cada flip-flop en las 8 filas.</p>
      <p>Si el bit pasa de 0 a 0: ${M('J=0;\; K=X')}; de 0 a 1: ${M('J=1;\; K=X')}; de 1 a 0: ${M('J=X;\; K=1')}; de 1 a 1: ${M('J=X;\; K=0')}. Si el siguiente es X, J y K también son X.</p>`,
    pasos: (d, m) => [{
      t: 'Tabla de J y K', multi: { cols: ['Estado → siguiente'].concat(SUBS) },
      items: (() => { const o = []; for (let s = 0; s < 8; s++) for (let e = 0; e < 6; e++) o.push({ id: 'j' + s + '_' + e, tipo: 'bit', fila: s, col: e, pts: d.d.usado(s) ? 0.6 : 7 / 18, x: true, h: `Estado ${bin(s)}, ${SUBS[e]}`, bits: bin(s), sig: m.sigTxt[s] }); return o; })()
    }],
    esperado: (d, vals, m) => { const o = {}; for (let s = 0; s < 8; s++) for (let e = 0; e < 6; e++) o['j' + s + '_' + e] = celda(m.filasOk[s][e]); return o; },
    final: (d, m) => [`<p>Con tu tabla de transición: 0→0 da J = 0 y K = X; 0→1 da J = 1 y K = X; 1→0 da J = X y K = 1; 1→1 da J = X y K = 0. Un siguiente en X da X en J y K.</p>`,
      tablaTuya(Object.assign({}, m, { filasTxt: m.filasOk.map((f) => f.map(celda)) }), true, true)]
  };

  // ===== P3: expresiones mínimas de SU tabla de J y K (25) =====
  const PTS3 = [4, 4, 4, 4, 4, 5];
  P.p3 = {
    titulo: 'Expresiones mínimas', max: 25, casillas: 6,
    enunciado: (d, m) => `<p>Esta es <b>tu tabla de J y K</b> (copiada del problema anterior; las casillas en blanco se toman como X):</p><div class="pd-tabla">${tablaTuya(m, true, true)}</div>
      <p>Cada entrada es una función de ${M('Q_{2}, Q_{1}, Q_{0}')}. Haz su mapa de Karnaugh de 3 variables en tu papel de borrador y elige la <b>expresión mínima</b> de cada una, tomando las X como convenga.</p>`,
    pasos: () => [{ t: 'Elige la expresión mínima', items: CT.entradas(3).map((x, i) => ({ id: 'e' + i, h: M(x.tex + ' ='), pts: PTS3[i], tipo: 'op' })) }],
    opsDe: (d, id) => (d.mio.opt3[Number(id.slice(1))] || []).map((o) => ({ t: o.t, ok: o.ok })),
    esperado: () => ({}),
    final: (d, m) => [`<p>Se agrupan los 1 y las X (solo cuando agrandan un grupo); cada grupo es el producto de las variables que no cambian dentro de él. Con tu tabla:</p>`].concat(CT.entradas(3).map((x, i) => '<p class="mono">' + M(x.tex + ' = ' + CT.texEnt(3, m.ok3[i])) + '</p>'))
  };

  // ===== P4: circuito con las expresiones que eligió (15) =====
  P.p4 = {
    titulo: 'Circuito', max: 15, casillas: 4,
    enunciado: (d, m) => `<p>Con las expresiones que elegiste, el contador queda así:</p><div class="pd-fig">${eqLineas(m).map((l) => `<div>${l}</div>`).join('')}</div>
      <p>Cada término de más de una variable lleva su propia compuerta AND y varios términos se unen en una OR; <b>no se comparte</b> ninguna compuerta entre entradas. Una entrada que vale 0 o 1 no lleva compuerta. Las variables negadas salen de un inversor por variable, <b>compartido</b> en todo el circuito.</p>`,
    pasos: () => [{ t: 'Cuenta de compuertas', items: [
      { id: 'and', h: 'Compuertas AND (de 2 o más entradas)', pts: 4, tol: EX },
      { id: 'or', h: 'Compuertas OR (de 2 o más entradas)', pts: 4, tol: EX },
      { id: 'neg', h: 'Inversores (uno por variable negada)', pts: 4, tol: EX },
      { id: 'cte', h: 'Entradas J o K fijas en 0 o en 1', pts: 3, tol: EX }] }],
    esperado: (d, vals, m) => ({ and: [m.cnt.and], or: [m.cnt.or], neg: [m.cnt.neg], cte: [m.constantes] }),
    final: (d, m) => [`<p>Una AND por cada término con 2 o más variables: <b>${m.cnt.and}</b>. Una OR por cada entrada con 2 o más términos: <b>${m.cnt.or}</b>. Un inversor por cada variable que aparece negada: <b>${m.cnt.neg}</b>. Entradas fijas en 0 o 1: <b>${m.constantes}</b>.</p>`]
  };

  // ===== P5: estados sin usar con el circuito que armó (15) =====
  P.p5 = {
    titulo: 'Estados sin usar', max: 15, casillas: 5,
    enunciado: (d, m) => `<p>Tu contador ${secTex(d)} quedó con estas entradas:</p><div class="pd-fig">${eqLineas(m).map((l) => `<div>${l}</div>`).join('')}</div>
      <p>Al conectar la alimentación puede arrancar en un estado sin usar. Para cada uno, evalúa J y K con <b>tu circuito</b> y aplica ${M('Q^{+}=J\\overline{Q}+\\overline{K}Q')}. Los números en binario se escriben tal cual.</p>`,
    pasos: (d, m) => [
      { t: 'Estado siguiente de cada estado sin usar', items: m.noUs.map((u, i) => ({ id: 'u' + i, h: `Desde ${bits(bin(u.s))}`, pts: 3, tol: EX })) },
      { t: '¿Se corrige solo?', items: [{ id: 'auto', h: 'Si arranca en un estado sin usar', pts: 3, tipo: 'op' }, { id: 'pul', h: 'Máximo de pulsos para entrar a la secuencia (0 si alguno nunca entra)', pts: 3, tol: EX }] }
    ],
    opsDe: (d) => (d.mio.atrapa ? [{ h: 'Alguno queda dando vueltas fuera de la secuencia' }, { h: 'Siempre termina entrando a la secuencia' }] : [{ h: 'Siempre termina entrando a la secuencia' }, { h: 'Alguno queda dando vueltas fuera de la secuencia' }]),
    esperado: (d, vals, m) => { const o = { pul: [m.pulsos] }; m.noUs.forEach((u, i) => { o['u' + i] = [Number(bin(u.sig))]; }); return o; },
    final: (d, m) => [`<p>${m.noUs.map((u) => bits(bin(u.s)) + ' → ' + bits(bin(u.sig))).join('; ')}</p>`,
      `<p>Caminos: ${m.noUs.map((u) => bits(camino(u))).join('; ')}.</p>`,
      m.atrapa ? '<p>Con tu circuito hay un estado sin usar que no vuelve a la secuencia: el contador queda atrapado. Por eso el máximo de pulsos es <b>0</b>. Se corrige forzando ese estado a uno de la secuencia.</p>' : `<p>Todos entran a la secuencia: el peor necesita <b>${m.pulsos}</b> pulso(s). Tu diseño se corrige solo.</p>`,
      m.cicloOK ? '' : '<p>Además, con tus expresiones el ciclo principal no se cumple: revisa los mapas del problema 3.</p>']
  };

  // las funciones de cada problema reciben (d) y toman lo derivado de las respuestas del estudiante en d.mio
  Object.keys(P).forEach((k) => ['pasos', 'enunciado', 'final'].forEach((f) => { const g = P[k][f]; P[k][f] = (d, m) => g(d, m || d.mio); }));

  RC.P = P;
  RC.PROB = ['p1', 'p2', 'p3', 'p4', 'p5'];
  RC.MAX = Object.fromEntries(RC.PROB.map((k) => [k, P[k].max]));
  RC.TITULO = Object.fromEntries(RC.PROB.map((k, i) => [k, 'P' + (i + 1)]));
  RC.NOMBRE = Object.fromEntries(RC.PROB.map((k) => [k, P[k].titulo]));

  RC.datos = (k, carnet, car, est) => {
    const b = baseDe(carnet), m = derivar(carnet, est);
    const d = Object.assign({}, b, { prob: k, mio: m, op: {} });
    P[k].pasos(d, m).forEach((ps) => ps.items.forEach((it) => {
      if (it.tipo !== 'op') return;
      const lista = P[k].opsDe(d, it.id).map((o, i) => ({ ...o, ok: o.ok != null ? o.ok : i === 0 }));
      d.op[it.id] = k === 'p3' || it.ordenFijo ? lista : RC.mezclar(RC.rng(String(carnet) + '|' + SID + '|' + k + '|' + it.id), lista);
    }));
    return d;
  };
  RC.items = (k, d) => P[k].pasos(d, d.mio).reduce((a, ps) => a.concat(ps.items), []);
  RC.casillas = (k) => P[k].casillas;
  RC.TOTAL_CASILLAS = RC.PROB.reduce((s, k) => s + RC.casillas(k), 0);

  RC.calificar = (k, d, vals) => {
    vals = vals || {};
    const items = RC.items(k, d), esp = P[k].esperado(d, vals, d.mio), cel = {};
    let pts = 0;
    items.forEach((it) => {
      const v = vals[it.id], vacio = v == null || String(v).trim() === '';
      let r, exp;
      if (it.tipo === 'op') {
        exp = d.op[it.id].findIndex((o) => o.ok);
        r = vacio ? 'vacio' : it.libre ? 'ok' : Number(v) === exp ? 'ok' : 'mal';
        if (it.libre) exp = vacio ? 0 : Number(v);
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
