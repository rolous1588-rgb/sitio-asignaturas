// ============================================================
// Electrónica Digital 2 · examen por celular (12/11/2026): contadores síncronos no secuenciales con JK
// Mismo espacio RC que el parcial de Digital 1 (digital1/parcial/js/pd-motor.js, copiado; este archivo es propio),
// con 5 problemas sobre UN contador por carnet (3 bits, 5 estados, 3 sin usar), 100 pts:
//   P1 datos y transición (15); P2 tabla de excitación J y K (25); P3 expresiones mínimas de J y K (25);
//   P4 circuito: contar compuertas (15); P5 estados no usados y autocorrección (20)
// Cada problema parte de datos correctos (no arrastra errores del anterior). Sin pistas ni segundo intento.
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
  const QN = ['Q_{2}', 'Q_{1}', 'Q_{0}'];
  const EXTEX = { 2: 'X' };

  // ---------- el contador de cada carnet ----------
  // sec = secuencia (5 estados de 3 bits); no usados = 3; diseño con X en los no usados (como en la práctica)
  function generar(r) {
    for (let t = 0; t < 300; t++) {
      const seq = CT.azar(3, 5, r);
      const d = CT.datos({ n: 3, seq });
      const filas = Array.from({ length: 8 }, (_, s) => (d.usado(s) ? CT.filaJK(3, s, CT.bits(d.sig[s], 3)) : Array(6).fill(2)));
      const ents = CT.entradas(3).map((x) => CT.deCubos(3, K.resolver(3, CT.columna(filas, x.e)).cubos));
      const sim = CT.simular(3, ents, seq);
      if (!sim.cicloOK) continue;
      const mapas = CT.entradas(3).map((x) => CT.columna(filas, x.e));
      const op = ents.map((e, i) => distractores(r, e, mapas[i]));
      if (op.some((o) => !o)) continue;
      const cnt = CT.cuentaCompuertas(3, ents);
      const constantes = ents.filter((e) => e.c === 0 || e.c === 1).length;
      const noUs = d.noUsados.map((s, i) => ({ s, sig: sim.tabla[s], camino: sim.noUsados[i].camino, entra: sim.noUsados[i].entra, pulsos: sim.noUsados[i].pulsos }));
      const atrapa = !sim.autocorregible;
      const pulsos = atrapa ? 0 : Math.max(...noUs.map((u) => u.pulsos));
      return { n: 3, seq, d, filas, mapas, ents, sim, op, cnt, constantes, noUs, atrapa, pulsos };
    }
    return null;
  }

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
  function distractores(r, correcta, mapa) {
    const vistos = new Set([clave(correcta)]), out = [];
    for (let t = 0; t < 400 && out.length < 3; t++) {
      const e = mutar(r, correcta);
      const k = clave(e);
      if (vistos.has(k) || CT.entCumple(3, e, mapa)) continue;
      vistos.add(k);
      out.push(e);
    }
    return out.length === 3 ? [correcta].concat(out) : null;
  }

  // ---------- piezas de texto ----------
  const secTex = (d) => M(d.seq.concat(d.seq[0]).map(String).join(' \\to '));
  const secBin = (d) => d.seq.map((s) => bits(bin(s))).join('; ');
  function bits(s) { return '<b class="mono pd-bits">' + s + '</b>'; }
  const eqTex = (d) => CT.entradas(3).map((x, i) => x.tex + ' = ' + CT.texEnt(3, d.ents[i])).join(' \\qquad ');
  const eqLineas = (d) => CT.entradas(3).map((x, i) => M(x.tex + ' = ' + CT.texEnt(3, d.ents[i])));
  const celda = (v) => (v === 2 ? 'X' : String(v));
  const tablaHTML = (d, conSig, conJK) => {
    const cab = ['Estado'].concat(conSig ? ['Siguiente'] : [], conJK ? ['J<sub>2</sub>', 'K<sub>2</sub>', 'J<sub>1</sub>', 'K<sub>1</sub>', 'J<sub>0</sub>', 'K<sub>0</sub>'] : []);
    let h = '<table class="tt tight pd-tt pd-multi"><tr>' + cab.map((c) => `<th>${c}</th>`).join('') + '</tr>';
    for (let s = 0; s < 8; s++) {
      const u = d.d.usado(s);
      h += `<tr><td class="mono">${bin(s)}</td>` + (conSig ? `<td class="mono">${u ? bin(d.d.sig[s]) : 'XXX'}</td>` : '') +
        (conJK ? d.filas[s].map((v) => `<td>${celda(v)}</td>`).join('') : '') + '</tr>';
    }
    return h + '</table>';
  };
  const camino = (u) => u.camino.map((x) => bin(x)).join(' → ');

  const P = {};

  // ===== P1: datos y transición (15) =====
  P.p1 = {
    titulo: 'Datos y transición', max: 15,
    gen: generar,
    enunciado: (d) => `<p>Se quiere un contador <b>síncrono</b> con flip-flops JK que cuente, en este orden, los estados (en decimal) y luego repita:</p>
      <div class="ex-func">${secTex(d)}</div>
      <p>El estado es ${M('Q_{2}Q_{1}Q_{0}')}, con ${M('Q_{2}')} como bit más alto (por ejemplo, 5 es ${bits('101')}). Los estados que no están en la lista no se usan. Los números en binario se escriben tal cual, sin espacios.</p>`,
    pasos: (d) => [
      { t: 'Datos', items: [{ id: 'n', h: 'Cantidad mínima de flip-flops', pts: 2, tol: EX }, { id: 'nu', h: 'Cantidad de estados sin usar', pts: 2, tol: EX }] },
      { t: 'Estado siguiente (en binario, 3 dígitos)', html: 'Escribe el estado al que pasa el contador en el próximo pulso de reloj.',
        items: (d && d.seq ? d.seq : [0, 0, 0, 0, 0]).map((s, i) => ({ id: 's' + i, h: `Desde ${bits(bin(s))}`, pts: 11 / 5, tol: EX })) }
    ],
    esperado: (d) => { const o = { n: [3], nu: [3] }; d.seq.forEach((s, i) => { o['s' + i] = [Number(bin(d.d.sig[s]))]; }); return o; },
    final: (d) => [
      `<p><b>Flip-flops:</b> hay ${d.seq.length} estados, pero el mayor es ${Math.max(...d.seq)} (${bits(bin(Math.max(...d.seq)))}), que necesita 3 bits: <b>3</b>. Con 3 flip-flops hay 8 estados, así que quedan <b>3 sin usar</b>: ${d.d.noUsados.map((s) => bits(bin(s))).join('; ')}.</p>`,
      `<p><b>Estado siguiente:</b> es el que sigue en la lista; el último vuelve al primero.</p>`,
      `<p>${d.seq.map((s) => bits(bin(s)) + ' → ' + bits(bin(d.d.sig[s]))).join('; ')}</p>`]
  };

  // ===== P2: tabla de excitación (25) =====
  const COLS2 = ['J_{2}', 'K_{2}', 'J_{1}', 'K_{1}', 'J_{0}', 'K_{0}'];
  P.p2 = {
    titulo: 'Tabla de excitación J y K', max: 25, casillas: 30,
    gen: generar,
    enunciado: (d) => `<p>Para el contador ${secTex(d)} ya está hecha la tabla de transición (abajo). Completa las entradas <b>J y K</b> de cada flip-flop en los estados usados.</p>
      <p>Recuerda: si el bit pasa de 0 a 0 → ${M('J=0;\\; K=X')}; de 0 a 1 → ${M('J=1;\\; K=X')}; de 1 a 0 → ${M('J=X;\\; K=1')}; de 1 a 1 → ${M('J=X;\\; K=0')}. Los estados sin usar ya están en X (no importa).</p>`,
    pasos: (d) => [{
      t: 'Tabla de J y K',
      multi: { cols: ['Estado → siguiente', 'J<sub>2</sub>', 'K<sub>2</sub>', 'J<sub>1</sub>', 'K<sub>1</sub>', 'J<sub>0</sub>', 'K<sub>0</sub>'] },
      items: (() => {
        const o = [];
        for (let s = 0; s < 8; s++) {
          const u = !d || !d.d ? true : d.d.usado(s);
          for (let e = 0; e < 6; e++) o.push({ id: 'j' + s + '_' + e, tipo: 'bit', fila: s, col: e, fijo: !u, pts: u ? 25 / 30 : 0, h: 'Estado ' + bin(s) + ', ' + ['J<sub>2</sub>', 'K<sub>2</sub>', 'J<sub>1</sub>', 'K<sub>1</sub>', 'J<sub>0</sub>', 'K<sub>0</sub>'][e], bits: bin(s), sig: !d || !d.d ? '' : (u ? bin(d.d.sig[s]) : 'XXX') });
        }
        return o;
      })()
    }],
    esperado: (d) => { const o = {}; for (let s = 0; s < 8; s++) for (let e = 0; e < 6; e++) o['j' + s + '_' + e] = celda(d.filas[s][e]); return o; },
    final: (d) => [`<p>Cada bit se compara con su siguiente: de 0 a 0 da J = 0 y K = X, de 0 a 1 da J = 1 y K = X, de 1 a 0 da J = X y K = 1, y de 1 a 1 da J = X y K = 0.</p>`, tablaHTML(d, true, true)]
  };

  // ===== P3: expresiones mínimas (25) =====
  const PTS3 = [4, 4, 4, 4, 4, 5];
  P.p3 = {
    titulo: 'Expresiones mínimas', max: 25,
    gen: generar,
    enunciado: (d) => `<p>Esta es la tabla de J y K del contador ${secTex(d)} (los estados sin usar están en X):</p><div class="pd-fig">${tablaHTML(d, true, true)}</div>
      <p>Cada entrada es una función de ${M('Q_{2}, Q_{1}, Q_{0}')}. Haz su mapa de Karnaugh de 3 variables (puedes usar tu papel de borrador, no se presenta) y elige la <b>expresión mínima</b> de cada una, tomando las X como convenga. Las X sin usar pueden valer 1 o 0.</p>`,
    pasos: (d) => [{ t: 'Elige la expresión mínima', items: CT.entradas(3).map((x, i) => ({ id: 'e' + i, h: M(x.tex + ' ='), pts: PTS3[i], tipo: 'op' })) }],
    ops: (d, id) => d.op[Number(id.slice(1))].map((e) => ({ t: CT.texEnt(3, e) })),
    esperado: () => ({}),
    final: (d) => [`<p>Se agrupan los 1 y las X (solo cuando agrandan un grupo); cada grupo es un producto de las variables que no cambian dentro de él.</p>`].concat(eqLineas(d).map((l) => '<p class="mono">' + l + '</p>'))
  };

  // ===== P4: circuito (15) =====
  P.p4 = {
    titulo: 'Circuito', max: 15,
    gen: generar,
    enunciado: (d) => `<p>El contador ${secTex(d)} quedó con estas entradas:</p><div class="pd-fig">${eqLineas(d).map((l) => `<div>${l}</div>`).join('')}</div>
      <p>Se arma con compuertas AND de 2 o 3 entradas y OR. Cada término de más de una variable lleva su propia compuerta AND y varios términos se unen en una OR; <b>no se comparte</b> ninguna compuerta entre entradas. Una entrada que vale 0 o 1 no lleva compuerta. Las variables negadas salen de un inversor por variable, <b>compartido</b> en todo el circuito.</p>`,
    pasos: () => [{ t: 'Cuenta', items: [
      { id: 'and', h: 'Compuertas AND (de 2 o más entradas)', pts: 4, tol: EX },
      { id: 'or', h: 'Compuertas OR (de 2 o más entradas)', pts: 4, tol: EX },
      { id: 'neg', h: 'Inversores (uno por variable negada)', pts: 4, tol: EX },
      { id: 'cte', h: 'Entradas J o K fijas en 0 o en 1', pts: 3, tol: EX }] }],
    esperado: (d) => ({ and: [d.cnt.and], or: [d.cnt.or], neg: [d.cnt.neg], cte: [d.constantes] }),
    final: (d) => [`<p>Una AND por cada término con 2 o más variables: <b>${d.cnt.and}</b>. Una OR por cada entrada con 2 o más términos: <b>${d.cnt.or}</b>. Un inversor por cada variable que aparece negada: <b>${d.cnt.neg}</b>. Entradas fijas en 0 o 1: <b>${d.constantes}</b>.</p>`]
  };

  // ===== P5: estados sin usar (20) =====
  P.p5 = {
    titulo: 'Estados sin usar', max: 20,
    gen: generar,
    enunciado: (d) => `<p>El contador ${secTex(d)} se armó con estas entradas (en los estados sin usar se tomó X):</p><div class="pd-fig">${eqLineas(d).map((l) => `<div>${l}</div>`).join('')}</div>
      <p>Al conectar la alimentación el contador puede arrancar en un estado sin usar. Calcula qué hace el circuito: para cada estado, evalúa J y K y aplica la ecuación del JK (${M('Q^{+}=J\\overline{Q}+\\overline{K}Q')}). Los números en binario se escriben tal cual.</p>`,
    pasos: (d) => [
      { t: 'Estado siguiente de cada estado sin usar', items: (d && d.noUs ? d.noUs : [{ s: 0 }, { s: 0 }, { s: 0 }]).map((u, i) => ({ id: 'u' + i, h: `Desde ${bits(bin(u.s))}`, pts: 10 / 3, tol: EX })) },
      { t: '¿Se corrige solo?', items: [{ id: 'auto', h: 'Si arranca en un estado sin usar', pts: 5, tipo: 'op' }, { id: 'pul', h: 'Máximo de pulsos para entrar a la secuencia (0 si alguno nunca entra)', pts: 5, tol: EX }] }
    ],
    esperado: (d) => { const o = { pul: [d.pulsos] }; d.noUs.forEach((u, i) => { o['u' + i] = [Number(bin(u.sig))]; }); return o; },
    // la opción correcta es la primera en «ops»: aquí depende del carnet
    opsDe: (d) => (d.atrapa ? [{ h: 'Alguno queda dando vueltas fuera de la secuencia' }, { h: 'Siempre termina entrando a la secuencia' }] : [{ h: 'Siempre termina entrando a la secuencia' }, { h: 'Alguno queda dando vueltas fuera de la secuencia' }]),
    final: (d) => [`<p>${d.noUs.map((u) => bits(bin(u.s)) + ' → ' + bits(bin(u.sig))).join('; ')}</p>`,
      `<p>Caminos: ${d.noUs.map((u) => bits(camino(u))).join('; ')}.</p>`,
      d.atrapa ? '<p>Hay un estado sin usar que no vuelve a la secuencia: el contador queda atrapado en un ciclo y hay que agregarle una corrección (por ejemplo, otra forma de llenar las X). Por eso el máximo de pulsos es <b>0</b>.</p>' : `<p>Todos entran a la secuencia: el peor necesita <b>${d.pulsos}</b> pulso(s). El diseño es autocorregible.</p>`]
  };

  RC.P = P;
  RC.PROB = ['p1', 'p2', 'p3', 'p4', 'p5'];
  RC.MAX = Object.fromEntries(RC.PROB.map((k) => [k, P[k].max]));
  RC.TITULO = Object.fromEntries(RC.PROB.map((k, i) => [k, 'P' + (i + 1)]));
  RC.NOMBRE = Object.fromEntries(RC.PROB.map((k) => [k, P[k].titulo]));

  // datos de un problema para un carnet (es el mismo contador en los 5 problemas)
  const cache = {};
  RC.datos = (k, carnet) => {
    const clave = 'c|' + carnet;
    if (!cache[clave]) {
      let d = null;
      for (let i = 0; !d && i < 20; i++) d = generar(RC.rng(String(carnet) + '|' + SID + '|c' + (i ? '|' + i : '')));
      cache[clave] = d;
    }
    const base = cache[clave];
    if (base[k]) return base[k];
    const d = Object.assign({}, base, { prob: k, op: {} });
    P[k].pasos(d).forEach((ps) => ps.items.forEach((it) => {
      if (it.tipo !== 'op') return;
      let lista;
      if (k === 'p3') lista = P.p3.ops(Object.assign({}, d, { op: base.op }), it.id);
      else lista = (P[k].opsDe ? P[k].opsDe(d) : P[k].ops(d, it.id));
      lista = lista.map((o, i) => ({ ...o, ok: i === 0 }));
      d.op[it.id] = RC.mezclar(RC.rng(String(carnet) + '|' + SID + '|' + k + '|' + it.id), lista);
    }));
    base[k] = d;
    return d;
  };
  RC.items = (k, d) => P[k].pasos(d).reduce((a, ps) => a.concat(ps.items), []);
  RC.casillas = (k) => P[k].casillas || P[k].pasos({}).reduce((s, ps) => s + ps.items.length, 0);
  RC.TOTAL_CASILLAS = RC.PROB.reduce((s, k) => s + RC.casillas(k), 0);

  RC.calificar = (k, d, vals) => {
    vals = vals || {};
    const items = RC.items(k, d);
    const esp = P[k].esperado(d);
    const cel = {};
    let pts = 0;
    items.forEach((it) => {
      if (it.fijo) return;
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
    return Math.min(100, Math.round((100 * n) / RC.TOTAL_CASILLAS));
  };
  RC.firma = (est) => {
    const s = JSON.stringify(RC.PROB.map((k) => (est && est[k] && est[k].vals) || {}));
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  };
})();
