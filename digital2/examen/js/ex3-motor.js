// ============================================================
// Electrónica Digital 2 · examen por celular · PROBLEMA 3 (12/11/2026): sumador de 4 bits (74283), resta y suma BCD
// Pieza aparte (se une a los problemas 1 y 2 más adelante). Mismo espacio RC; números propios por carnet.
//   1 suma binaria; 2 resta con complemento a 2; 3 suma BCD: suma binaria y ¿necesita corrección?; 4 suma BCD: corrección.
// El paso 4 parte de lo que el estudiante respondió en el 3 (en blanco: se usa lo correcto). Puntajes provisionales.
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
  const bitDe = (s) => (s === '1' ? 1 : s === '0' ? 0 : -1);

  // ---------- los números de cada carnet ----------
  const bases = {};
  function baseDe(carnet) {
    if (bases[carnet]) return bases[carnet];
    const r = RC.rng(String(carnet) + '|' + SID + '|c');
    let A, B, A2, B2, a, b;
    const carry = r() < 0.6;
    do { A = ent(r, 3, 15); B = ent(r, 3, 15); } while (A === B || (A + B > 15) !== carry);
    const neg = r() < 0.5;
    do { A2 = ent(r, 2, 15); B2 = ent(r, 2, 15); } while (A2 === B2 || (A2 < B2) !== neg);
    const c = r(), lo = c < 0.25 ? 4 : c < 0.6 ? 10 : 16, hi = c < 0.25 ? 9 : c < 0.6 ? 15 : 18;
    do { a = ent(r, 2, 9); b = ent(r, 2, 9); } while (a + b < lo || a + b > hi);
    return (bases[carnet] = { A, B, A2, B2, a, b });
  }
  // lo que sale de lo que el estudiante respondió en el paso 3
  const memo = {};
  function derivar(carnet, est) {
    const b = baseDe(carnet), v3 = vv(est, 'p3');
    const llave = carnet + '|' + JSON.stringify(v3);
    if (memo[llave]) return memo[llave];
    const t = b.a + b.b, ok = { c: t >> 4, S: t & 15 };
    const x = (id, e) => { const q = bitDe(String(v3[id] || '')); return q < 0 ? { t: '?', v: e } : { t: String(q), v: q }; };
    const c = x('c', ok.c);
    const s = [3, 2, 1, 0].map((i) => x('s' + i, (ok.S >> i) & 1));
    const S = s.reduce((acc, q) => acc * 2 + q.v, 0);
    const need = c.v === 1 || S > 9;
    const tot = S + (need ? 6 : 0);
    const m = { cTxt: c.t, sTxt: s.map((q) => q.t).join(''), need, corr: need ? 6 : 0, res: tot & 15, dec: c.v === 1 || tot > 15 ? 1 : 0 };
    if (Object.keys(memo).length > 200) for (const k in memo) delete memo[k];
    return (memo[llave] = m);
  }

  const P = {};
  const itB = (id, h, pts, extra) => Object.assign({ id, h, tipo: 'bit', pts, x: false }, extra || {});
  const fila4 = (n) => b4(n).split('');
  const CAB = ['Acarreo', 'Bit\u00a03', 'Bit\u00a02', 'Bit\u00a01', 'Bit\u00a00'];
  const fijo = (etq, n) => ({ etq, cel: [''].concat(fila4(n)) });
  const sal = (pref, h, pts) => [3, 2, 1, 0].map((i) => itB(pref + i, `${h} ${i}`, pts));

  // ===== Paso 1: suma binaria =====
  P.p1 = {
    titulo: 'Suma binaria', max: 15, casillas: 5,
    enunciado: (d) => `<p>Un sumador binario de 4 bits (74283) recibe los números sin signo <b>A</b> y <b>B</b> de la tabla, con acarreo de entrada Cin = 0.</p><p>Completa la suma S = A + B y el acarreo de salida.</p>`,
    pasos: (d) => {
      const s = sal('s', 'Bit', 2.5), c = itB('c', 'Acarreo de salida', 5);
      s.forEach((it, i) => { it.h = `S, bit ${3 - i}`; });
      return [{ t: 'Suma binaria', grid: { cab: CAB, filas: [fijo('A', d.b.A), fijo('B', d.b.B), { etq: 'S = A + B', cel: [c].concat(s) }] }, items: [c].concat(s) }];
    },
    esperado: (d) => { const t = d.b.A + d.b.B, o = { c: String(t >> 4) }; [3, 2, 1, 0].forEach((i) => { o['s' + i] = String((t >> i) & 1); }); return o; },
    final: (d) => { const t = d.b.A + d.b.B; return [`<p>Se suma bit a bit desde el bit 0, llevando el acarreo: ${bits(b4(d.b.A))} + ${bits(b4(d.b.B))} = ${bits(b4(t))} con acarreo de salida ${t >> 4}. ${t > 15 ? 'El resultado no cabe en 4 bits: el acarreo de salida es el quinto bit.' : 'El resultado cabe en 4 bits: el acarreo de salida es 0.'}</p>`]; }
  };

  // ===== Paso 2: resta con complemento a 2 =====
  P.p2 = {
    titulo: 'Resta con complemento a 2', max: 25, casillas: 11,
    enunciado: () => `<p>Con el mismo 74283 se resta A − B así: se <b>invierte cada bit de B</b> y se pone <b>Cin = 1</b> (A + B̄ + 1 = A − B en complemento a 2).</p><p>Completa la tabla. Si el acarreo de salida es 1, A ≥ B; si es 0, A &lt; B y el resultado es negativo (queda en complemento a 2).</p>`,
    pasos: (d) => {
      const bn = [3, 2, 1, 0].map((i) => itB('n' + i, `B invertido, bit ${i}`, 1.5));
      const cin = itB('ci', 'Cin', 3), co = itB('co', 'Acarreo de salida', 3), ng = itB('ng', '¿El resultado es negativo? (1 = sí, 0 = no)', 5);
      const s = [3, 2, 1, 0].map((i) => itB('s' + i, `S, bit ${i}`, 2));
      return [{ t: 'Resta A − B', grid: { cab: CAB, filas: [fijo('A', d.b.A2), fijo('B', d.b.B2), { etq: 'B invertido', cel: [''].concat(bn) }, { etq: 'Cin', cel: [cin, { t: 'para restar', span: 4 }] }, { etq: 'S = A + B̄ + Cin', cel: [co].concat(s) }, { etq: '¿Negativo?', cel: [ng, { t: '1 = sí; 0 = no', span: 4 }] }] }, items: bn.concat([cin, co]).concat(s).concat([ng]) }];
    },
    esperado: (d) => {
      const { A2, B2 } = d.b, bn = ~B2 & 15, t = A2 + bn + 1, o = { ci: '1', co: String(t >> 4), ng: A2 < B2 ? '1' : '0' };
      [3, 2, 1, 0].forEach((i) => { o['n' + i] = String((bn >> i) & 1); o['s' + i] = String(((t & 15) >> i) & 1); });
      return o;
    },
    final: (d) => {
      const { A2, B2 } = d.b, bn = ~B2 & 15, t = A2 + bn + 1;
      return [`<p>B = ${bits(b4(B2))} invertido es ${bits(b4(bn))}; Cin = 1. Suma: ${bits(b4(A2))} + ${bits(b4(bn))} + 1 = ${bits(b4(t))} con acarreo de salida ${t >> 4}.</p>`,
        `<p>${A2 < B2 ? `El acarreo de salida es 0: A &lt; B, el resultado es negativo y ${bits(b4(t))} es −${B2 - A2} en complemento a 2.` : `El acarreo de salida es 1: A ≥ B y el resultado es ${A2 - B2}.`}</p>`];
    }
  };

  // ===== Paso 3: suma BCD, parte 1 (suma binaria) =====
  P.p3 = {
    titulo: 'Suma BCD: suma binaria', max: 20, casillas: 6,
    enunciado: (d) => `<p>Se suman dos dígitos decimales en código <b>BCD</b>: A = ${d.b.a} y B = ${d.b.b}. Primero un 74283 los suma como si fueran binarios (Cin = 0).</p><p>Completa la suma binaria y marca si el resultado <b>necesita corrección</b> (cuando es mayor que 9 o hay acarreo de salida).</p>`,
    pasos: (d) => {
      const c = itB('c', 'Acarreo de salida', 4), s = [3, 2, 1, 0].map((i) => itB('s' + i, `S, bit ${i}`, 2)), f = itB('f', '¿Necesita corrección? (1 = sí, 0 = no)', 8);
      return [{ t: 'Suma binaria de los dos dígitos BCD', grid: { cab: CAB, filas: [fijo('A = ' + d.b.a, d.b.a), fijo('B = ' + d.b.b, d.b.b), { etq: 'A + B', cel: [c].concat(s) }, { etq: '¿Corrección?', cel: [f, { t: '1 = sí; 0 = no', span: 4 }] }] }, items: [c].concat(s).concat([f]) }];
    },
    esperado: (d) => { const t = d.b.a + d.b.b, o = { c: String(t >> 4), f: t > 9 ? '1' : '0' }; [3, 2, 1, 0].forEach((i) => { o['s' + i] = String(((t & 15) >> i) & 1); }); return o; },
    final: (d) => { const t = d.b.a + d.b.b; return [`<p>${bits(b4(d.b.a))} + ${bits(b4(d.b.b))} = ${bits(b4(t))} con acarreo de salida ${t >> 4} (suma ${t}).</p>`, `<p>${t > 9 ? `Como ${t > 15 ? 'hay acarreo de salida' : 'el resultado es mayor que 9'}, no es un dígito BCD válido: hay que corregir sumando 0110.` : 'El resultado es 9 o menos y no hay acarreo: ya es un dígito BCD y no necesita corrección.'}</p>`]; }
  };

  // ===== Paso 4: suma BCD, parte 2 (corrección), a partir de SU paso 3 =====
  P.p4 = {
    titulo: 'Suma BCD: corrección', max: 20, casillas: 9,
    enunciado: (d, m) => `<p>Aquí está <b>tu suma binaria</b> del paso anterior (lo que dejaste en blanco sigue con «?»). Un segundo 74283 le suma la corrección: <b>0110</b> si hace falta y <b>0000</b> si no.</p><p>Completa el sumando de corrección y el resultado BCD final: el dígito de las unidades y el de las decenas (0 o 1).</p>`,
    pasos: (d, m) => {
      const co = [3, 2, 1, 0].map((i) => itB('k' + i, `Corrección, bit ${i}`, 1.5));
      const re = [3, 2, 1, 0].map((i) => itB('r' + i, `Unidades, bit ${i}`, 2.5));
      const de = itB('d', 'Decenas (0 o 1)', 4);
      return [{ t: 'Corrección y resultado', grid: { cab: CAB, filas: [{ etq: 'Tu suma', cel: [m.cTxt].concat(m.sTxt.split('')) }, { etq: 'Corrección', cel: [''].concat(co) }, { etq: 'Resultado', cel: [de].concat(re) }] }, items: co.concat(re).concat([de]) }];
    },
    esperado: (d, vals, m) => { const o = { d: String(m.dec) }; [3, 2, 1, 0].forEach((i) => { o['k' + i] = String((m.corr >> i) & 1); o['r' + i] = String((m.res >> i) & 1); }); return o; },
    final: (d, m) => { const t = d.b.a + d.b.b, n = t > 9, tot = t + (n ? 6 : 0); return [`<p>${n ? 'Se suma 0110' : 'Se suma 0000'} a la suma binaria: ${bits(b4(t))} + ${bits(n ? '0110' : '0000')} = ${bits(b4(tot))}${tot > 15 ? ' (y el acarreo pasa a las decenas)' : ''}.</p>`, `<p>Resultado BCD: decenas = ${tot > 15 || t > 15 ? 1 : 0}, unidades = ${bits(b4(tot))} (${d.b.a} + ${d.b.b} = ${t}).</p>`]; }
  };

  Object.keys(P).forEach((k) => ['pasos', 'enunciado', 'final'].forEach((f) => { const g = P[k][f]; P[k][f] = (d, m) => g(d, m || d.mio); }));
  RC.P = P;
  RC.PROB = ['p1', 'p2', 'p3', 'p4'];
  RC.MAX = Object.fromEntries(RC.PROB.map((k) => [k, P[k].max]));
  RC.TITULO = Object.fromEntries(RC.PROB.map((k, i) => [k, 'Paso ' + (i + 1)]));
  RC.NOMBRE = Object.fromEntries(RC.PROB.map((k) => [k, P[k].titulo]));
  RC.ENT = [];

  RC.datos = (k, carnet, car, est) => ({ b: baseDe(carnet), prob: k, mio: derivar(carnet, est), op: {} });
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
