// ============================================================
// Métodos Numéricos · Práctica autónoma de raíces (ensayo del examen, 16/10/2026)
// Motor: funciones por carnet, casillas de cada fila, revisión, redondeo y puntaje.
// No toca la pantalla: lo usan mp-estudiante.js y mp-panel.js (y las pruebas con Node).
//
// Regla de redondeo (la misma del examen):
//   · 4 decimales, al más cercano (si la 5.ª cifra es 5 o más, sube la 4.ª).
//   · Solo se redondea el valor que se anota en la tabla; los cálculos intermedios no.
//   · La fila siguiente usa el valor anotado (redondeado), no el de la memoria.
//
// Revisión de una casilla (comparando con el valor que sale de SUS propios números):
//   ok  = coincide en los 4 decimales
//   red = difiere hasta 0,0005 (error de redondeo) → en el examen vale la mitad
//   mal = más diferencia → 0
// ============================================================
(function () {
  const MP = (window.MP = window.MP || {});

  // ---------- números ----------
  // redondeo a 4 decimales, al más cercano (la mitad se aleja del cero)
  MP.r4 = (x) => {
    if (!isFinite(x)) return NaN;
    const v = Math.floor(Math.abs(x) * 1e4 + 0.5 + 1e-7) / 1e4;
    return v === 0 ? 0 : x < 0 ? -v : v;
  };
  // 4 decimales con coma
  MP.d4 = (x) => (isFinite(x) ? MP.r4(x).toFixed(4).replace('.', ',') : '—');
  // parámetro de una función (2,5 · 3)
  MP.np = (x) => String(x).replace('.', ',');
  // lo que escribió el estudiante: acepta coma o punto decimal y el signo − del teclado
  MP.leer = (s) => {
    if (s == null) return { vacio: true };
    let t = String(s).trim().replace(/\s+/g, '').replace(/[−–—‒]/g, '-').replace(/^\+/, '');
    if (t === '') return { vacio: true };
    if ((t.match(/[.,]/g) || []).length > 1) return { sep: true };
    t = t.replace(',', '.');
    if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return { invalido: true };
    const dec = t.includes('.') ? t.split('.')[1].length : 0;
    const v = Number(t);
    return { v: v === 0 ? 0 : v, dec };
  };
  MP.esNumero = (s) => { const p = MP.leer(s); return !p.vacio && !p.sep && !p.invalido; };

  // compara lo escrito (ya leído) con el valor esperado
  MP.juzgar = (p, esp) => {
    if (!isFinite(esp)) return { r: 'mal' };
    const e = MP.r4(esp);
    const d = Math.abs(p.v - e);
    if (p.dec <= 4) {
      const ti = Math.round(p.v * 1e4), ei = Math.round(e * 1e4);
      if (ti === ei) return { r: 'ok' };
      if (Math.abs(ti - ei) <= 5) return { r: 'red', msg: 'Casi: revisa el redondeo (4 decimales, al más cercano).' };
      if (p.dec >= 2 && d < 0.5 * Math.pow(10, -p.dec) + 1e-9) return { r: 'red', msg: 'Casi: anota el resultado con 4 decimales.' };
      return { r: 'mal' };
    }
    if (d <= 0.0005 + 1e-9) return { r: 'red', msg: 'Anota solo 4 decimales, redondeando al más cercano.' };
    return { r: 'mal' };
  };

  // ---------- azar reproducible por carnet ----------
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  MP.rng = (semilla) => {
    if (window.II && II.rng) return II.rng(semilla);
    let a = hash(String(semilla));
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  MP.mezclar = (r, arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------- familias de funciones ----------
  // sus(x): la función con el número reemplazado (para las pistas)
  const P = (x) => '(' + MP.d4(x) + ')';
  const coef = (a) => (a === 1 ? '' : MP.np(a) + '·');
  const FAM = {
    B1: { txt: (p) => `x² + ln(x) − ${MP.np(p.a)}`, f: (p) => (x) => x * x + Math.log(x) - p.a, sus: (p, x) => `${P(x)}² + ln${P(x)} − ${MP.np(p.a)}` },
    B2: { txt: (p) => `eˣ − x − ${MP.np(p.a)}`, f: (p) => (x) => Math.exp(x) - x - p.a, sus: (p, x) => `e^${P(x)} − ${P(x)} − ${MP.np(p.a)}` },
    F1: { txt: (p) => `eˣ + x − ${MP.np(p.a)}`, f: (p) => (x) => Math.exp(x) + x - p.a, sus: (p, x) => `e^${P(x)} + ${P(x)} − ${MP.np(p.a)}` },
    F2: { txt: (p) => `2·sen(x) + x − ${MP.np(p.a)}`, rad: true, f: (p) => (x) => 2 * Math.sin(x) + x - p.a, sus: (p, x) => `2·sen${P(x)} + ${P(x)} − ${MP.np(p.a)}` },
    N1: {
      txt: (p) => `x² − ${coef(p.a)}cos(x)`, rad: true,
      f: (p) => (x) => x * x - p.a * Math.cos(x), df: (p) => (x) => 2 * x + p.a * Math.sin(x),
      sus: (p, x) => `${P(x)}² − ${coef(p.a)}cos${P(x)}`, dsus: (p, x) => `2·${P(x)} + ${coef(p.a)}sen${P(x)}`,
      // la correcta primero; las otras son errores típicos
      der: (p) => [`2x + ${coef(p.a)}sen(x)`, `2x − ${coef(p.a)}sen(x)`, `2x + ${coef(p.a)}cos(x)`, `x² + ${coef(p.a)}sen(x)`],
      porDer: (p) => `La derivada de x² es 2x. La de cos(x) es −sen(x); con el signo − de adelante queda −${coef(p.a)}(−sen(x)) = +${coef(p.a)}sen(x).`
    },
    N2: {
      txt: (p) => `eˣ + ${coef(p.a)}x − ${MP.np(p.b)}`,
      f: (p) => (x) => Math.exp(x) + p.a * x - p.b, df: (p) => (x) => Math.exp(x) + p.a,
      sus: (p, x) => `e^${P(x)} + ${coef(p.a)}${P(x)} − ${MP.np(p.b)}`, dsus: (p, x) => `e^${P(x)} + ${MP.np(p.a)}`,
      der: (p) => [`eˣ + ${MP.np(p.a)}`, `eˣ + ${coef(p.a)}x`, `x·eˣ⁻¹ + ${MP.np(p.a)}`, `eˣ + ${MP.np(p.a)} − ${MP.np(p.b)}`],
      porDer: (p) => `La derivada de eˣ es eˣ (no se usa la regla de la potencia). La de ${coef(p.a)}x es ${MP.np(p.a)} y la de la constante ${MP.np(p.b)} es 0.`
    }
  };
  MP.FAM = FAM;

  // variantes revisadas: en bisección, Xr reemplaza a un extremo distinto en las filas 1 y 2;
  // ningún f(Xr) se redondea a 0; ninguna es del examen ni del repaso del miércoles
  MP.VARIANTES = {
    bis: [
      ['B1', { a: 2 }, 1, 2], ['B1', { a: 2.5 }, 1, 2], ['B1', { a: 3 }, 1, 2], ['B1', { a: 3.5 }, 1, 2],
      ['B1', { a: 4 }, 1, 3], ['B1', { a: 5 }, 1, 3], ['B1', { a: 6 }, 1, 3], ['B1', { a: 7 }, 1, 3],
      ['B2', { a: 2 }, 0, 2], ['B2', { a: 2.5 }, 0, 2], ['B2', { a: 3 }, 1, 2], ['B2', { a: 4 }, 1, 3],
      ['B2', { a: 5 }, 1, 3], ['B2', { a: 6 }, 1, 3]
    ],
    fp: [
      ['F1', { a: 2 }, 0, 2], ['F1', { a: 3 }, 0, 2], ['F1', { a: 4 }, 0, 2], ['F1', { a: 5 }, 0, 2],
      ['F1', { a: 6 }, 0, 2], ['F1', { a: 5 }, 1, 3], ['F1', { a: 6 }, 1, 3],
      ['F2', { a: 2 }, 0, 2], ['F2', { a: 2.5 }, 0, 2], ['F2', { a: 3 }, 0, 2], ['F2', { a: 3 }, 1, 3], ['F2', { a: 3.5 }, 0, 2]
    ],
    nr: [
      ['N1', { a: 1 }, 0.5], ['N1', { a: 1 }, 2], ['N1', { a: 2 }, 0.5], ['N1', { a: 2 }, 2], ['N1', { a: 3 }, 0.5],
      ['N1', { a: 3 }, 2], ['N1', { a: 4 }, 0.5], ['N1', { a: 4 }, 2], ['N1', { a: 5 }, 0.5],
      ['N2', { a: 1, b: 4 }, 2], ['N2', { a: 1, b: 5 }, 2], ['N2', { a: 1, b: 6 }, 1], ['N2', { a: 1, b: 6 }, 2], ['N2', { a: 1, b: 8 }, 1]
    ]
  };

  MP.METODOS = {
    bis: { titulo: 'Bisección', max: 30, cerrado: true },
    fp: { titulo: 'Falsa posición', max: 35, cerrado: true },
    nr: { titulo: 'Newton-Raphson', max: 35, cerrado: false }
  };
  MP.FILAS = 3;
  MP.PTS_DER = 6;

  // función del estudiante para un método; `semilla` = 0, 1, 2… («Otra función» la aumenta)
  MP.datos = (met, carnet, semilla) => {
    const lista = MP.VARIANTES[met];
    const orden = MP.mezclar(MP.rng(String(carnet) + '|mp|' + met), lista.map((_, i) => i));
    const s = Math.max(0, Number(semilla) || 0);
    const v = lista[orden[s % lista.length]];
    const F = FAM[v[0]], p = v[1];
    const d = { met, fam: v[0], p, semilla: s, txt: 'f(x) = ' + F.txt(p), f: F.f(p), sus: (x) => F.sus(p, x), rad: !!F.rad };
    if (met === 'nr') {
      d.x0 = v[2];
      d.df = F.df(p);
      d.dsus = (x) => F.dsus(p, x);
      d.derCorrecta = F.der(p)[0];
      d.porDer = F.porDer(p);
      const ops = F.der(p).map((t, k) => ({ t, ok: k === 0 }));
      d.derOps = MP.mezclar(MP.rng(String(carnet) + '|der|' + s), ops);
    } else {
      d.a = v[2];
      d.b = v[3];
    }
    return d;
  };

  // ---------- casillas de cada fila ----------
  // tipo: 'fijo' (viene dado), 'num' (escribe un número), 'dec' (elige qué extremo reemplaza Xr)
  // calc(g): valor esperado con los números del propio estudiante (g(id) = su valor, o el esperado si no escribió)
  // prev: valores finales de la fila anterior
  const PTS = {
    bis: { fa: 2, fb: 2, xr: 2, fr: 2, er: 2, dec: 3, copia: 0.5 },
    fp: { fa: 2, fb: 2, xr: 3, fr: 2, er: 3, dec: 3, copia: 0.5 },
    nr: { fx: 2, dfx: 2, x1: 3, er: 2, copia: 1 }
  };
  MP.PTS = PTS;

  function celdasCerrado(d, n, prev) {
    const fp = d.met === 'fp';
    const pt = PTS[d.met];
    const C = [];
    if (n === 1) {
      C.push({ id: 'xa', et: 'Xa', tipo: 'fijo', val: d.a });
      C.push({ id: 'xb', et: 'Xb', tipo: 'fijo', val: d.b });
      C.push({ id: 'fa', et: 'f(Xa)', tipo: 'num', pts: pt.fa, calc: (g) => MP.r4(d.f(g('xa'))), pista: (g) => `f(Xa) = ${d.sus(g('xa'))}` });
      C.push({ id: 'fb', et: 'f(Xb)', tipo: 'num', pts: pt.fb, calc: (g) => MP.r4(d.f(g('xb'))), pista: (g) => `f(Xb) = ${d.sus(g('xb'))}` });
    } else {
      const cambiaA = prev.dec === 'a';
      const nota = `En la fila ${n - 1}, Xr reemplazó a ${cambiaA ? 'Xa' : 'Xb'}: ese extremo toma el valor de Xr y su f es f(Xr) de esa fila. El otro extremo y su f se copian igual.`;
      C.push({ id: 'xa', et: 'Xa', tipo: 'num', copia: true, par: 'xb', pts: pt.copia, calc: () => (cambiaA ? prev.xr : prev.xa), pista: () => nota });
      C.push({ id: 'xb', et: 'Xb', tipo: 'num', copia: true, par: 'xa', pts: pt.copia, calc: () => (cambiaA ? prev.xb : prev.xr), pista: () => nota });
      C.push({ id: 'fa', et: 'f(Xa)', tipo: 'num', copia: true, par: 'fb', pts: pt.copia, calc: () => (cambiaA ? prev.fr : prev.fa), pista: () => nota });
      C.push({ id: 'fb', et: 'f(Xb)', tipo: 'num', copia: true, par: 'fa', pts: pt.copia, calc: () => (cambiaA ? prev.fb : prev.fr), pista: () => nota });
    }
    C.push({
      id: 'xr', et: 'Xr', tipo: 'num', pts: pt.xr,
      calc: (g) => (fp ? MP.r4(g('xb') - (g('fb') * (g('xa') - g('xb'))) / (g('fa') - g('fb'))) : MP.r4((g('xa') + g('xb')) / 2)),
      pista: (g) => (fp
        ? `Xr = Xb − f(Xb)·(Xa − Xb) / (f(Xa) − f(Xb)) = ${MP.d4(g('xb'))} − ${P(g('fb'))}·(${MP.d4(g('xa'))} − ${MP.d4(g('xb'))}) / (${MP.d4(g('fa'))} − ${P(g('fb'))})`
        : `Xr = (Xa + Xb) / 2 = (${MP.d4(g('xa'))} + ${MP.d4(g('xb'))}) / 2`)
    });
    C.push({ id: 'fr', et: 'f(Xr)', tipo: 'num', pts: pt.fr, calc: (g) => MP.r4(d.f(g('xr'))), pista: (g) => `f(Xr) = ${d.sus(g('xr'))}` });
    if (n === 1) C.push({ id: 'er', et: 'Error %', tipo: 'fijo', val: '---' });
    else C.push({
      id: 'er', et: 'Error %', tipo: 'num', pts: pt.er,
      calc: (g) => MP.r4((Math.abs(g('xr') - prev.xr) / Math.abs(g('xr'))) * 100),
      pista: (g) => `Error = |Xr − Xr anterior| / |Xr| × 100 = |${MP.d4(g('xr'))} − ${MP.d4(prev.xr)}| / |${MP.d4(g('xr'))}| × 100`
    });
    if (n < MP.FILAS) C.push({
      id: 'dec', et: '¿Qué extremo reemplaza Xr?', tipo: 'dec', pts: pt.dec,
      calc: (g) => (g('fa') * g('fr') < 0 ? 'b' : 'a'),
      pista: (g) => `Mira el signo de f(Xa)·f(Xr) = ${P(g('fa'))}·${P(g('fr'))}. Si es negativo, la raíz está entre Xa y Xr.`
    });
    return C;
  }

  function celdasNewton(d, n, prev) {
    const pt = PTS.nr;
    const C = [];
    if (n === 1) C.push({ id: 'xn', et: 'Xₙ', tipo: 'fijo', val: d.x0 });
    else C.push({ id: 'xn', et: 'Xₙ', tipo: 'num', copia: true, pts: pt.copia, calc: () => prev.x1, pista: () => 'El Xₙ de esta fila es el Xₙ₊₁ de la fila anterior.' });
    C.push({ id: 'fx', et: 'f(Xₙ)', tipo: 'num', pts: pt.fx, calc: (g) => MP.r4(d.f(g('xn'))), pista: (g) => `f(Xₙ) = ${d.sus(g('xn'))}` });
    C.push({ id: 'dfx', et: "f'(Xₙ)", tipo: 'num', pts: pt.dfx, calc: (g) => MP.r4(d.df(g('xn'))), pista: (g) => `f'(Xₙ) = ${d.dsus(g('xn'))}` });
    C.push({
      id: 'x1', et: 'Xₙ₊₁', tipo: 'num', pts: pt.x1,
      calc: (g) => MP.r4(g('xn') - g('fx') / g('dfx')),
      pista: (g) => `Xₙ₊₁ = Xₙ − f(Xₙ) / f'(Xₙ) = ${MP.d4(g('xn'))} − ${P(g('fx'))} / ${P(g('dfx'))}`
    });
    C.push({
      id: 'er', et: 'Error %', tipo: 'num', pts: pt.er,
      calc: (g) => MP.r4((Math.abs(g('x1') - g('xn')) / Math.abs(g('x1'))) * 100),
      pista: (g) => `Error = |Xₙ₊₁ − Xₙ| / |Xₙ₊₁| × 100 = |${MP.d4(g('x1'))} − ${MP.d4(g('xn'))}| / |${MP.d4(g('x1'))}| × 100`
    });
    return C;
  }

  MP.celdas = (d, n, prev) => (d.met === 'nr' ? celdasNewton(d, n, prev) : celdasCerrado(d, n, prev));
  MP.entradas = (C) => C.filter((c) => c.tipo !== 'fijo');

  // valores esperados con los números del estudiante (sin arrastrar errores)
  // dep: casillas de las que depende cada una (directa o indirectamente)
  MP.evaluar = (C, vals) => {
    const cur = {};
    let usadas = null;
    const g = (id) => { if (usadas) usadas.add(id); return cur[id]; };
    const out = {};
    const dep = {};
    C.forEach((c) => {
      if (c.tipo === 'fijo') { cur[c.id] = c.val; return; }
      usadas = new Set();
      const exp = c.calc(g);
      const todas = new Set();
      usadas.forEach((id) => { todas.add(id); (dep[id] || []).forEach((x) => todas.add(x)); });
      usadas = null;
      dep[c.id] = [...todas].filter((id) => { const x = C.find((k) => k.id === id); return x && x.tipo !== 'fijo'; });
      if (c.tipo === 'dec') {
        out[c.id] = { exp, r: vals[c.id] === exp ? 'ok' : 'mal', pista: c.pista(g), dep: dep[c.id] };
        return;
      }
      const p = MP.leer(vals[c.id]);
      let j = { r: 'mal' };
      if (!p.vacio && !p.sep && !p.invalido) {
        j = MP.juzgar(p, exp);
        // copia en la casilla equivocada
        if (j.r !== 'ok' && c.par) {
          const otro = C.find((x) => x.id === c.par);
          if (otro && MP.juzgar(p, otro.calc(g)).r === 'ok') j = { r: 'mal', msg: `Este valor va en ${otro.et}.` };
        }
      }
      out[c.id] = { exp, r: j.r, msg: j.msg || null, pista: c.pista(g), dep: dep[c.id] };
      cur[c.id] = !p.vacio && !p.sep && !p.invalido ? p.v : exp;
    });
    return out;
  };

  // «Comprobar fila»: fila = { vals: {id: texto|'a'|'b'}, chk, cel: {id: {r1, fin, msg, pista}} }
  // fin: 'ok1' | 'ok2' (bien al 1.er / 2.º intento) | 'rev' (mostrado) | 'aj' (ajustado al corregir otra casilla)
  // devuelve { falta | sep | invalido } si no se puede comprobar todavía
  MP.comprobar = (d, n, prev, fila, maxIntentos = 2) => {
    const C = MP.celdas(d, n, prev);
    fila.vals = fila.vals || {};
    fila.cel = fila.cel || {};
    for (const c of MP.entradas(C)) {
      const st = fila.cel[c.id];
      if (st && st.fin) continue;
      const v = fila.vals[c.id];
      if (c.tipo === 'dec') { if (v !== 'a' && v !== 'b') return { falta: c.id }; continue; }
      const p = MP.leer(v);
      if (p.vacio) return { falta: c.id };
      if (p.sep) return { sep: c.id };
      if (p.invalido) return { invalido: c.id };
    }
    fila.chk = (fila.chk || 0) + 1;
    const ev = MP.evaluar(C, fila.vals);
    // una casilla bien queda fija solo si todas las casillas de las que depende también están bien;
    // si no, queda abierta («bien con tus números»): al corregir la anterior, hay que recalcularla
    const bien = (id) => ev[id] && ev[id].r === 'ok';
    MP.entradas(C).forEach((c) => {
      const st = fila.cel[c.id] || (fila.cel[c.id] = {});
      if (st.fin) return;
      const e = ev[c.id];
      if (st.r1 == null) st.r1 = e.r;
      st.depMal = false;
      if (e.r === 'ok' && (e.dep || []).every((id) => (fila.cel[id] && fila.cel[id].fin) || bien(id))) {
        st.fin = st.r1 === 'ok' ? 'ok1' : 'ok2'; st.msg = null; st.pista = null; st.ult = 'ok';
      } else if (e.r === 'ok') {
        st.ult = 'ok'; st.depMal = true; st.msg = null; st.pista = null;
      } else { st.ult = e.r; st.msg = e.msg; st.pista = e.r === 'mal' ? e.pista : null; }
    });
    if (fila.chk >= maxIntentos) cerrarFila(C, fila);
    fila.lista = MP.entradas(C).every((c) => fila.cel[c.id] && fila.cel[c.id].fin);
    if (fila.lista) fila.final = MP.valoresFinales(C, fila.vals);
    return { ok: true, lista: fila.lista };
  };

  // muestra lo que falta y ajusta las casillas que dependían de un valor corregido
  function cerrarFila(C, fila) {
    const cur = {};
    const g = (id) => cur[id];
    C.forEach((c) => {
      if (c.tipo === 'fijo') { cur[c.id] = c.val; return; }
      const st = fila.cel[c.id];
      const exp = c.calc(g);
      if (c.tipo === 'dec') {
        if (!st.fin) { st.fin = fila.vals[c.id] === exp ? (st.r1 === 'ok' ? 'ok1' : 'ok2') : st.ult === 'ok' ? 'aj' : 'rev'; fila.vals[c.id] = exp; }
        else if (fila.vals[c.id] !== exp) { fila.vals[c.id] = exp; st.fin = 'aj'; }
        return;
      }
      const p = MP.leer(fila.vals[c.id]);
      const bien = !p.vacio && !p.sep && !p.invalido && MP.juzgar(p, exp).r === 'ok';
      // si estaba bien con sus números (pero dependía de una casilla equivocada) se ajusta; si no, se muestra
      if (!st.fin) { st.fin = bien ? (st.r1 === 'ok' ? 'ok1' : 'ok2') : st.ult === 'ok' ? 'aj' : 'rev'; fila.vals[c.id] = MP.d4(exp); st.pista = null; }
      else if (!bien) { fila.vals[c.id] = MP.d4(exp); st.fin = 'aj'; }
      cur[c.id] = MP.r4(exp);
    });
  }

  MP.valoresFinales = (C, vals) => {
    const o = {};
    C.forEach((c) => {
      if (c.tipo === 'fijo') o[c.id] = c.val;
      else if (c.tipo === 'dec') o[c.id] = vals[c.id];
      else o[c.id] = MP.r4(MP.leer(vals[c.id]).v);
    });
    return o;
  };

  // ---------- puntaje «si esto fuera el examen» (solo el 1.er intento) ----------
  const FACTOR = { ok: 1, red: 0.5, mal: 0 };
  // em = { semilla, der: { ok }, filas: [fila, fila, fila] }
  MP.puntaje = (met, em, carnet) => {
    const d = MP.datos(met, carnet, em.semilla);
    let pts = 0, prev = null;
    (em.filas || []).forEach((fila, i) => {
      if (!fila || !fila.chk) return;
      const C = MP.celdas(d, i + 1, prev);
      MP.entradas(C).forEach((c) => { const st = fila.cel && fila.cel[c.id]; if (st && st.r1) pts += c.pts * (FACTOR[st.r1] || 0); });
      prev = fila.final || null;
    });
    if (met === 'nr' && em.der && em.der.ok) pts += MP.PTS_DER;
    return Math.round(pts * 100) / 100;
  };
  MP.terminado = (em) => !!(em && em.filas && em.filas.length === MP.FILAS && em.filas.every((f) => f && f.lista));

  // tabla de referencia (para el panel y las pruebas)
  MP.tablaReferencia = (d) => {
    const T = [];
    let prev = null;
    for (let n = 1; n <= MP.FILAS; n++) {
      const C = MP.celdas(d, n, prev);
      const ev = MP.evaluar(C, {});
      const vals = {};
      MP.entradas(C).forEach((c) => { vals[c.id] = c.tipo === 'dec' ? ev[c.id].exp : MP.d4(ev[c.id].exp); });
      prev = MP.valoresFinales(C, vals);
      T.push(prev);
    }
    return T;
  };

  // ---------- ejercicios de redondeo ----------
  const dig = (r, a = 0, b = 9) => a + Math.floor(r() * (b - a + 1));
  const digs = (r, k) => Array.from({ length: k }, () => dig(r)).join('');
  const conComa = (s) => s.replace('.', ',');
  MP.redondeo = (carnet, serie) => {
    const r = MP.rng(String(carnet) + '|red|' + (serie || 0));
    const L = [];
    // 1. la 5.ª cifra es 5 → sube
    {
      const e = dig(r, 0, 2), d4 = String(dig(r, 1, 8)) + digs(r, 2) + String(dig(r, 0, 8)), s = `${e}.${d4}5${dig(r, 1, 9)}${dig(r, 0, 9)}`;
      L.push({ id: 'n1', tipo: 'num', t: `Redondea a 4 decimales: <b class="mono">${conComa(s)}</b>`, exp: MP.r4(Number(s)), por: `La 5.ª cifra decimal es <b>5</b>: la 4.ª sube en 1 → <b>${MP.d4(Number(s))}</b>.` });
    }
    // 2. negativo, la 5.ª cifra ≥ 6 → sube (en valor absoluto)
    {
      const d4 = String(dig(r, 1, 7)) + digs(r, 2) + String(dig(r, 0, 8)), s = `-0.${d4}${dig(r, 6, 9)}${digs(r, 2)}`;
      L.push({ id: 'n2', tipo: 'num', t: `Redondea a 4 decimales: <b class="mono">${conComa(s).replace('-', '−')}</b>`, exp: MP.r4(Number(s)), por: `Con los negativos se redondea igual, sin mirar el signo: la 5.ª cifra es ${s.charAt(7)} → <b>${MP.d4(Number(s)).replace('-', '−')}</b>.` });
    }
    // 3. la 5.ª cifra es 4 y después vienen 9 → se queda (trampa)
    {
      const e = dig(r, 1, 3), d4 = String(dig(r, 1, 8)) + digs(r, 2) + String(dig(r, 1, 8)), s = `${e}.${d4}499`;
      L.push({ id: 'n3', tipo: 'num', t: `Redondea a 4 decimales: <b class="mono">${conComa(s)}</b>`, exp: MP.r4(Number(s)), por: `Solo importa la <b>5.ª cifra</b>, que es 4: la 4.ª se queda igual → <b>${MP.d4(Number(s))}</b>. Los 9 que vienen después no cambian nada.` });
    }
    // 4. acarreo: x,y999 con 5.ª cifra ≥ 5
    {
      const e = dig(r, 0, 2), y = dig(r, 1, 8), s = `${e}.${y}999${dig(r, 5, 9)}${digs(r, 2)}`;
      L.push({ id: 'n4', tipo: 'num', t: `Redondea a 4 decimales: <b class="mono">${conComa(s)}</b>`, exp: MP.r4(Number(s)), por: `La 5.ª cifra sube la 4.ª: 9 + 1 = 10, y se «lleva» hacia la izquierda → <b>${MP.d4(Number(s))}</b>. Se escriben los 4 decimales, aunque sean ceros.` });
    }
    // 5. muy pequeño → 0,0000
    {
      const neg = r() < 0.5, s = `${neg ? '-' : ''}0.0000${dig(r, 1, 4)}${digs(r, 2)}`;
      L.push({ id: 'n5', tipo: 'num', t: `Redondea a 4 decimales: <b class="mono">${conComa(s).replace('-', '−')}</b>`, exp: 0, por: 'La 5.ª cifra es menor que 5: queda <b>0,0000</b>. Pasa cuando f(Xr) está muy cerca de la raíz; en la tabla se anota 0,0000.' });
    }
    // 6. los cálculos intermedios no se redondean
    L.push({
      id: 'c1', tipo: 'op',
      t: 'Estás calculando Xr = Xb − f(Xb)·(Xa − Xb) / (f(Xa) − f(Xb)). ¿Redondeas los resultados parciales (la resta, la división) antes de terminar?',
      o: ['No: hago todo el cálculo seguido y redondeo solo el resultado que anoto en la tabla', 'Sí: cada operación a 4 decimales', 'Sí: cada operación a 2 decimales, para simplificar', 'Solo redondeo la división'],
      c: 0, por: 'Los cálculos intermedios <b>no</b> se redondean. Solo se redondea el valor que se anota en la tabla (Xr, f(Xr), error…).'
    });
    // 7. se sigue con el valor anotado
    L.push({
      id: 'c2', tipo: 'op',
      t: 'Anotaste Xr = 0,7358 en la tabla, pero la calculadora guarda 0,735753… (Ans). Para calcular f(Xr), ¿qué valor usas?',
      o: ['0,7358, el que está en la tabla', '0,735753…, el de la memoria (Ans)', '0,74', 'Cualquiera de los dos'],
      c: 0, por: 'Siempre se sigue con el número <b>anotado en la tabla</b> (redondeado). Así todos obtienen los mismos valores.'
    });
    // 8. procedimiento: f(Xr) con el Xr ya redondeado
    {
      const xr = Number('1.' + String(dig(r, 1, 8)) + digs(r, 2) + String(dig(r, 1, 9)));
      const f = (x) => x * x + Math.log(x) - 2;
      const v = f(xr);
      L.push({
        id: 'p1', tipo: 'num',
        t: `En la tabla anotaste <b class="mono">Xr = ${MP.d4(xr)}</b>. Calcula f(Xr) para f(x) = x² + ln(x) − 2 y escríbelo como va en la tabla.`,
        exp: MP.r4(v), por: `f(${MP.d4(xr)}) = (${MP.d4(xr)})² + ln(${MP.d4(xr)}) − 2 = ${v.toFixed(7).replace('.', ',').replace('-', '−')}… → se anota <b>${MP.d4(v).replace('-', '−')}</b>.`
      });
    }
    // opciones mezcladas por carnet
    L.forEach((q) => {
      if (q.tipo !== 'op') return;
      q.orden = MP.mezclar(MP.rng(String(carnet) + '|' + q.id + '|' + (serie || 0)), q.o.map((_, k) => k));
    });
    return L;
  };
})();
