// ============================================================
// Medidas Eléctricas · 2.º parcial por celular (09/11/2026) — problemas y calificación
// Mismo espacio RC que el 2.º parcial de Transformadas (transformadas/parcial2/js/rc-motor.js), con otros problemas.
// Con formulario propio en papel: los enunciados no traen fórmulas.
// 7 problemas con datos propios por carnet (100 pts):
//   P1 potencia en CA (15) · P2 FP bajo en la línea (15) · P3 dos vatímetros (15) · P4 corrección del FP (20)
//   P5 factura y armónicos (15) · P6 vatímetro (10) · P7 puesta a tierra, solo lo visto (10)
// Casillas numéricas: entero o decimal con punto o coma. Tolerancia ±2 % (mínimo 0,01), salvo FP (±0,01),
// ángulos (±2 % o ±0,5°) y número de pasos (exacto).
// Si una casilla depende de otra, se acepta el valor que sale con los números del propio estudiante
// o el valor exacto (un error no se arrastra).
// Opciones: la correcta va primero en ops() y se mezcla por carnet. o.h = texto HTML; o.t = LaTeX.
// ============================================================
(function () {
  const RC = (window.RC = window.RC || {});
  const PI = Math.PI, R3 = Math.sqrt(3);
  const GRAD = 180 / PI;

  // ---------- azar reproducible por carnet ----------
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  RC.rng = (semilla) => {
    let a = hash(String(semilla));
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  const elegir = (r, arr) => arr[Math.floor(r() * arr.length)];
  const entre = (r, a, b, paso) => Math.round((a + paso * Math.floor(r() * (Math.round((b - a) / paso) + 1))) * 1e6) / 1e6;
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

  // ---------- números para mostrar (coma decimal, sin separador de miles) ----------
  const decs = (x) => { const a = Math.abs(x); if (!isFinite(a) || a === 0) return 0; return Math.max(0, Math.min(4, 3 - Math.floor(Math.log10(a)))); };
  const redo = (x, d) => { const v = Math.round(x * 10 ** d) / 10 ** d; return Object.is(v, -0) ? 0 : v; };
  RC.txt = (x, d) => String(redo(x, d == null ? decs(x) : d)).replace('.', ',').replace('-', '−');
  RC.tex = (x, d) => String(redo(x, d == null ? decs(x) : d)).replace('.', '{,}');
  const tx = RC.tex;
  const nh = (x) => String(x).replace('.', '{,}'); // dato exacto dentro de LaTeX
  RC.opTxt = (o) => (o.h != null ? o.h : '\\(' + o.t + '\\)');
  RC.etTxt = (it) => (it.h != null ? it.h : '\\(' + it.et + '\\)'); // etiqueta de una casilla: HTML (it.h) o LaTeX (it.et)
  const M = (s) => '\\(' + s + '\\)';
  const datos = (lista) => '<ul class="pm-datos">' + lista.map((x) => '<li>' + x + '</li>').join('') + '</ul>';
  const UNI = { 'Ω': '\\Omega', 'Ω·m': '\\Omega\\cdot\\text{m}', 'µF': '\\mu\\text{F}' };
  const u_ = (s) => '\\ ' + (UNI[s] || '\\text{' + s + '}');

  const TOL_FP = { rel: 0, abs: 0.01 };
  const TOL_ANG = { rel: 0.02, abs: 0.5 };
  const TOL_ENT = { rel: 0, abs: 0.01 };

  // casillas que dependen de otras: valor con los números del estudiante y valor exacto
  const dos = (propio, exacto) => (isFinite(propio) ? [propio, exacto] : [exacto]);
  const usar = (u, id, exacto) => { const v = u(id); return v == null || !isFinite(v) ? exacto : v; };
  const acosS = (x) => Math.acos(Math.max(-1, Math.min(1, x)));

  const P = {};

  // ===== P1: potencia en CA (monofásica) =====
  const EQ1 = ['el motor de una bomba de agua', 'un taladro de banco', 'un equipo de aire acondicionado', 'una amasadora de panadería', 'el compresor de una cámara de frío', 'una cortadora de cerámica'];
  const Q1 = [
    { q: 'Se conecta en paralelo con la carga un capacitor adecuado (la carga y la tensión no cambian). ¿Qué instrumento marca menos que antes?', et: '\\text{Marca menos}',
      ops: ['El amperímetro', 'El vatímetro', 'El voltímetro', 'Ninguno: los tres marcan lo mismo'] },
    { q: '¿Qué mide el vatímetro de este circuito?', et: '\\text{El vatímetro mide}',
      ops: ['El promedio de \\(v\\cdot i\\): la potencia activa \\(P\\)', 'El producto de los valores eficaces \\(V\\cdot I\\)', 'La potencia reactiva \\(Q\\)', 'El valor máximo de \\(v\\cdot i\\)'] },
    { q: 'En lugar de la carga se conecta una bobina ideal (sin resistencia) a la misma tensión. ¿Qué marca el vatímetro?', et: '\\text{Marca el vatímetro}',
      ops: ['Cero: \\(P = 0\\)', 'Lo mismo que \\(V\\cdot I\\)', 'La mitad de \\(V\\cdot I\\)', 'Depende de la frecuencia de la red'] }
  ];
  P.p1 = {
    titulo: 'Potencia en CA', max: 15,
    gen(r) {
      const eq = elegir(r, EQ1), V = elegir(r, [220, 230]), I = entre(r, 6, 24, 0.5), fp = entre(r, 0.6, 0.9, 0.01);
      const Pw = Math.round((V * I * fp) / 10) * 10;
      return { eq, V, I, Pw, v: Math.floor(r() * Q1.length) };
    },
    enunciado: (d) => `<p>Se mide ${d.eq} (carga monofásica) con un voltímetro, un amperímetro y un vatímetro. La corriente está atrasada respecto de la tensión.</p>
      ${datos([`Voltímetro: ${M('V = ' + d.V + u_('V'))}`, `Amperímetro: ${M('I = ' + nh(d.I) + u_('A'))}`, `Vatímetro: ${M('P = ' + d.Pw + u_('W'))}`])}`,
    pasos: (d) => [
      { t: 'Calcula', tex: null, items: [
        { id: 'S', et: 'S\\ (\\text{VA})', pts: 3 },
        { id: 'fp', et: '\\text{FP}', pts: 3, tol: TOL_FP },
        { id: 'Q', et: 'Q\\ (\\text{VAR})', pts: 3 },
        { id: 'phi', et: '\\varphi\\ (\\text{grados})', pts: 3, tol: TOL_ANG }] },
      { t: 'Elige', nota: Q1[(d && d.v) || 0].q, tex: null, items: [{ id: 'op', et: Q1[(d && d.v) || 0].et, pts: 3, tipo: 'op' }] }
    ],
    ops: (d) => Q1[d.v].ops.map((h, i) => ({ h, t: '\\text{opción ' + (i + 1) + '}' })),
    esperado(d, u) {
      const S = d.V * d.I, Su = usar(u, 'S', S);
      const fp = d.Pw / S, fpu = usar(u, 'fp', fp);
      const Q = Math.sqrt(S * S - d.Pw * d.Pw);
      return { S: [S], fp: dos(d.Pw / Su, fp), Q: dos(Math.sqrt(Su * Su - d.Pw * d.Pw), Q), phi: dos(acosS(fpu) * GRAD, acosS(fp) * GRAD), op: 0 };
    },
    final(d) {
      const S = d.V * d.I, fp = d.Pw / S;
      return [`S = V\\cdot I = ${tx(S)}${u_('VA')}`, `\\text{FP} = \\dfrac{P}{S} = \\dfrac{${d.Pw}}{${tx(S)}} = ${tx(fp, 3)}`,
        `Q = \\sqrt{S^2 - P^2} = ${tx(Math.sqrt(S * S - d.Pw * d.Pw))}${u_('VAR')}`, `\\varphi = \\arccos(${tx(fp, 3)}) = ${tx(acosS(fp) * GRAD, 1)}^\\circ`];
    }
  };

  // ===== P2: FP bajo en la línea (trifásica, 380 V) =====
  const USO2 = ['un aserradero', 'una planta de lácteos', 'un taller de metalmecánica', 'una bomba de pozo profundo', 'un molino de granos', 'una planta de áridos'];
  const I3 = (Pkw, V, fp) => (Pkw * 1000) / (R3 * V * fp);
  P.p2 = {
    titulo: 'FP bajo en la línea', max: 15,
    gen(r) {
      for (;;) {
        const Pkw = entre(r, 40, 80, 5), fp1 = entre(r, 0.62, 0.78, 0.01), R = elegir(r, [0.03, 0.04, 0.05, 0.06]), ST = elegir(r, [75, 100, 125]);
        const S1 = Pkw / fp1;
        if (Math.abs(S1 - ST) / ST < 0.06) continue;
        return { uso: elegir(r, USO2), Pkw, fp1, R, ST, V: 380, fp2: 0.95, sobre: S1 > ST };
      }
    },
    enunciado: (d) => `<p>La carga trifásica de ${d.uso} se alimenta por un cable desde un transformador.</p>
      ${datos([`Tensión de línea: ${M('V = ' + d.V + u_('V'))}`, `Potencia activa: ${M('P = ' + d.Pkw + u_('kW'))}`, `Factor de potencia actual: ${M('\\text{FP}_1 = ' + nh(d.fp1))}`,
        `Resistencia del cable: ${M('R = ' + nh(d.R) + u_('Ω'))} por fase`, `Transformador de ${M(d.ST + u_('kVA'))}`])}
      <p>Después se corrige el factor de potencia a ${M('\\text{FP}_2 = 0{,}95')} (misma potencia activa).</p>`,
    pasos: (d) => [
      { t: 'Con el FP actual', tex: null, items: [
        { id: 'I1', et: 'I_1\\ (\\text{A})', pts: 3 },
        { id: 'Pp1', et: 'P_{p1}\\ (\\text{W})', h: 'Pérdidas en el cable \\(P_{p1}\\) (W)', pts: 3 }] },
      { t: 'Con FP 0,95', tex: null, items: [
        { id: 'I2', et: 'I_2\\ (\\text{A})', pts: 3 },
        { id: 'Pp2', et: 'P_{p2}\\ (\\text{W})', h: 'Pérdidas en el cable \\(P_{p2}\\) (W)', pts: 3 }] },
      { t: 'Elige', nota: `Con el FP actual, ¿el transformador de ${d && d.ST ? d.ST : '…'} kVA queda sobrecargado?`, tex: null, items: [{ id: 'op', et: '\\text{Transformador}', pts: 3, tipo: 'op' }] }
    ],
    ops: (d) => {
      const si = { h: `Sí: la potencia aparente pasa de ${d.ST} kVA`, t: '\\text{Sí}' }, no = { h: `No: la potencia aparente es menor que ${d.ST} kVA`, t: '\\text{No}' };
      const ns = { h: 'No se puede saber sin medir la tensión del transformador', t: '\\text{No se puede saber}' };
      return d.sobre ? [si, no, ns] : [no, si, ns];
    },
    esperado(d, u) {
      const I1 = I3(d.Pkw, d.V, d.fp1), I2 = I3(d.Pkw, d.V, d.fp2);
      const p = (I) => 3 * I * I * d.R;
      return { I1: [I1], Pp1: dos(p(usar(u, 'I1', I1)), p(I1)), I2: [I2], Pp2: dos(p(usar(u, 'I2', I2)), p(I2)), op: 0 };
    },
    final(d) {
      const I1 = I3(d.Pkw, d.V, d.fp1), I2 = I3(d.Pkw, d.V, d.fp2);
      return [`I_1 = \\dfrac{P}{\\sqrt{3}\\cdot V\\cdot \\text{FP}_1} = ${tx(I1)}${u_('A')}`, `P_{p1} = 3\\cdot I_1^2\\cdot R = ${tx(3 * I1 * I1 * d.R)}${u_('W')}`,
        `I_2 = ${tx(I2)}${u_('A')};\\; P_{p2} = ${tx(3 * I2 * I2 * d.R)}${u_('W')}`, `S_1 = \\dfrac{P}{\\text{FP}_1} = ${tx(d.Pkw / d.fp1)}${u_('kVA')}`, `${tx(d.Pkw / d.fp1)} ${d.sobre ? '>' : '<'} ${d.ST}${u_('kVA')}:\\ \\text{${d.sobre ? 'sobrecargado' : 'no se sobrecarga'}}`];
    }
  };

  // ===== P3: dos vatímetros (conexión Aron) =====
  const USO3 = ['el molino de bolas de una mina', 'una bomba de riego', 'una sierra de cinta', 'el ventilador de un secador de granos', 'una trituradora de piedra', 'una cinta transportadora'];
  const Q3 = [
    { q: 'Con otra carga, uno de los dos vatímetros marca cero. ¿Cuál es el FP de esa carga?', et: '\\text{FP}', ops: ['0{,}5', '0', '1', '0{,}866'] },
    { q: 'Con otra carga, los dos vatímetros marcan lo mismo. ¿Cuál es el FP de esa carga?', et: '\\text{FP}', ops: ['1', '0{,}5', '0', '0{,}707'] },
    { q: 'Con otra carga, un vatímetro marca negativo (hay que invertir su bobina de tensión para leerlo). ¿Qué se sabe del FP de esa carga?', et: '\\text{FP}',
      ops: ['\\text{Es menor que } 0{,}5', '\\text{Es mayor que } 0{,}5', '\\text{Es exactamente } 0{,}5', '\\text{Es } 1'] }
  ];
  P.p3 = {
    titulo: 'Dos vatímetros', max: 15,
    gen(r) {
      for (;;) {
        const Pt = entre(r, 6, 24, 0.5), fp = entre(r, 0.55, 0.95, 0.01);
        const Q = Pt * Math.tan(acosS(fp));
        const W1 = Math.round(((Pt - Q / R3) / 2) * 100) / 100, W2 = Math.round(((Pt + Q / R3) / 2) * 100) / 100;
        if (W1 < 0.3) continue;
        return { uso: elegir(r, USO3), W1, W2, v: Math.floor(r() * Q3.length) };
      }
    },
    enunciado: (d) => `<p>Se mide ${d.uso} (carga trifásica equilibrada e inductiva) con el método de los dos vatímetros (conexión Aron).</p>
      ${datos([`Vatímetro 1: ${M('W_1 = ' + nh(d.W1) + u_('kW'))}`, `Vatímetro 2: ${M('W_2 = ' + nh(d.W2) + u_('kW'))}`])}`,
    pasos: (d) => [
      { t: 'Calcula', tex: null, items: [
        { id: 'P', et: 'P\\ (\\text{kW})', pts: 3 },
        { id: 'Q', et: 'Q\\ (\\text{kVAR})', pts: 3 },
        { id: 'phi', et: '\\varphi\\ (\\text{grados})', pts: 3, tol: TOL_ANG },
        { id: 'fp', et: '\\text{FP}', pts: 3, tol: TOL_FP }] },
      { t: 'Elige', nota: Q3[(d && d.v) || 0].q, tex: null, items: [{ id: 'op', et: Q3[(d && d.v) || 0].et, pts: 3, tipo: 'op' }] }
    ],
    ops: (d) => Q3[d.v].ops.map((t) => ({ t })),
    esperado(d, u) {
      const Pt = d.W1 + d.W2, Q = R3 * (d.W2 - d.W1), phi = Math.atan(Q / Pt) * GRAD;
      const Pu = usar(u, 'P', Pt), Qu = usar(u, 'Q', Q), phiu = usar(u, 'phi', phi);
      return { P: [Pt], Q: [Q], phi: dos(Pu ? Math.atan(Qu / Pu) * GRAD : NaN, phi), fp: dos(Math.cos(phiu / GRAD), Math.cos(phi / GRAD)), op: 0 };
    },
    final(d) {
      const Pt = d.W1 + d.W2, Q = R3 * (d.W2 - d.W1), phi = Math.atan(Q / Pt);
      return [`P = W_1 + W_2 = ${tx(Pt)}${u_('kW')}`, `Q = \\sqrt{3}\\cdot (W_2 - W_1) = ${tx(Q)}${u_('kVAR')}`,
        `\\varphi = \\arctan\\dfrac{Q}{P} = ${tx(phi * GRAD, 1)}^\\circ`, `\\text{FP} = \\cos\\varphi = ${tx(Math.cos(phi), 3)}`];
    }
  };

  // ===== P4: corrección del FP con banco por pasos =====
  const Q4 = [
    { q: 'De noche la planta casi no consume y el banco completo queda conectado. ¿Qué pasa?', et: '\\text{De noche}',
      ops: ['El FP pasa a capacitivo y la tensión sube', 'El FP se queda en 0,95', 'La corriente de la red baja a cero', 'Los capacitores dejan de tomar corriente'] },
    { q: 'El banco se instala en el tablero general. ¿Baja la corriente en el cable que va del tablero a un motor?', et: '\\text{Cable al motor}',
      ops: ['No: solo baja la corriente entre la red y el tablero (aguas arriba del banco)', 'Sí: baja en todos los cables de la planta', 'Sí, pero solo en el motor más grande', 'No: sube en todos los cables'] },
    { q: 'Si el mismo banco (los mismos kVAR) se conecta en estrella en vez de triángulo, ¿cuántos µF por fase hacen falta?', et: '\\mu\\text{F en estrella}',
      ops: ['3 veces más', 'Los mismos', '3 veces menos', '√3 veces más'] }
  ];
  P.p4 = {
    titulo: 'Corrección del FP', max: 20,
    gen(r) {
      for (;;) {
        const Pkw = entre(r, 50, 150, 5), fp1 = entre(r, 0.65, 0.82, 0.01), Qp = elegir(r, [5, 10, 15]);
        const Qc = Pkw * (Math.tan(acosS(fp1)) - Math.tan(acosS(0.95)));
        const x = Qc / Qp, fr = x - Math.floor(x), n = Math.ceil(x);
        if (fr < 0.12 || fr > 0.88 || n < 2 || n > 15) continue;
        return { Pkw, fp1, Qp, V: 380, f: 50, v: Math.floor(r() * Q4.length) };
      }
    },
    enunciado: (d) => `<p>Una planta industrial quiere llevar su factor de potencia a ${M('0{,}95')} con un banco automático de capacitores conectado en triángulo, que se arma con pasos iguales.</p>
      ${datos([`Potencia activa: ${M('P = ' + d.Pkw + u_('kW'))}`, `Factor de potencia actual: ${M('\\text{FP}_1 = ' + nh(d.fp1))}`, `Factor de potencia deseado: ${M('\\text{FP}_2 = 0{,}95')}`,
        `Cada paso del banco: ${M(d.Qp + u_('kVAR'))}`, `Red: ${M(d.V + u_('V') + ';\\;' + d.f + u_('Hz'))}`])}
      <p>Instala el menor número de pasos que alcance el FP deseado. Los µF y la corriente se piden para el <b>banco instalado</b> (todos sus pasos).</p>`,
    pasos: (d) => [
      { t: 'Calcula', tex: null, items: [
        { id: 'Qc', et: 'Q_c\\ (\\text{kVAR})', pts: 4 },
        { id: 'n', et: 'n', h: 'Número de pasos instalados \\(n\\)', pts: 4, tol: TOL_ENT },
        { id: 'C', et: 'C_\\Delta\\ (\\mu\\text{F})', h: 'Capacidad por fase en triángulo \\(C_\\Delta\\) (µF)', pts: 4 },
        { id: 'Ic', et: 'I_c\\ (\\text{A})', h: 'Corriente de línea del banco \\(I_c\\) (A)', pts: 4 }] },
      { t: 'Elige', nota: Q4[(d && d.v) || 0].q, tex: null, items: [{ id: 'op', et: Q4[(d && d.v) || 0].et, pts: 4, tipo: 'op' }] }
    ],
    ops: (d) => Q4[d.v].ops.map((h) => ({ h, t: '\\text{' + h + '}' })),
    calc(d, n) { const Qb = n * d.Qp * 1000; return { C: (Qb / (3 * 2 * PI * d.f * d.V * d.V)) * 1e6, Ic: Qb / (R3 * d.V) }; },
    esperado(d, u) {
      const Qc = d.Pkw * (Math.tan(acosS(d.fp1)) - Math.tan(acosS(0.95)));
      const n = Math.ceil(Qc / d.Qp), Qcu = usar(u, 'Qc', Qc), nPropio = Math.ceil(Qcu / d.Qp - 1e-9);
      const nu = usar(u, 'n', n), ok = nu > 0 && nu < 100;
      const a = this.calc(d, n), b = ok ? this.calc(d, nu) : { C: NaN, Ic: NaN };
      return { Qc: [Qc], n: dos(nPropio, n), C: dos(b.C, a.C), Ic: dos(b.Ic, a.Ic), op: 0 };
    },
    final(d) {
      const Qc = d.Pkw * (Math.tan(acosS(d.fp1)) - Math.tan(acosS(0.95))), n = Math.ceil(Qc / d.Qp), c = this.calc(d, n);
      return [`Q_c = P\\cdot(\\tan\\varphi_1 - \\tan\\varphi_2) = ${tx(Qc)}${u_('kVAR')}`, `n = ${tx(Qc / d.Qp, 2)} \\to ${n}\\text{ pasos} = ${n * d.Qp}${u_('kVAR')}`,
        `C_\\Delta = \\dfrac{Q}{3\\cdot\\omega\\cdot V^2} = ${tx(c.C)}${u_('µF')}`, `I_c = \\dfrac{Q}{\\sqrt{3}\\cdot V} = ${tx(c.Ic)}${u_('A')}`];
    }
  };

  // ===== P5: factura y armónicos =====
  const EQ5 = ['las fuentes de un laboratorio de computadoras', 'un variador de velocidad sin filtro', 'un grupo de cargadores de baterías', 'una instalación de luminarias LED', 'un horno de microondas industrial'];
  const Q5 = [
    { q: 'En ese equipo el cosfímetro marca casi 1. ¿Por qué el FP verdadero es menor?', et: '\\text{Motivo}',
      ops: ['Porque los armónicos aumentan la corriente eficaz sin aportar potencia activa', 'Porque el cosfímetro mide mal la tensión', 'Porque la carga se vuelve capacitiva', 'Porque baja la frecuencia de la red'] },
    { q: 'En una red con muchos armónicos se quiere corregir el FP. ¿Qué conviene instalar?', et: '\\text{Solución}',
      ops: ['Capacitores con reactor de desintonía (o un filtro activo)', 'Más capacitores comunes', 'Un transformador más pequeño', 'Otro cosfímetro'] }
  ];
  P.p5 = {
    titulo: 'Factura y armónicos', max: 15,
    gen(r) {
      const kWh = entre(r, 6000, 30000, 500), fpf = entre(r, 0.7, 0.83, 0.01);
      const kVARh = Math.round((kWh * Math.tan(acosS(fpf))) / 10) * 10;
      const tarifa = elegir(r, [0.55, 0.6, 0.65, 0.7]), cargo = Math.round((kWh * tarifa) / 10) * 10;
      return { kWh, kVARh, cargo, eq: elegir(r, EQ5), cosf: entre(r, 0.95, 0.99, 0.01), thd: elegir(r, [40, 60, 80, 100, 120]), v: Math.floor(r() * Q5.length) };
    },
    enunciado: (d) => `<p><b>a) La factura del mes de una industria.</b> La distribuidora cobra un recargo cuando el FP es menor que ${M('0{,}85')} (regla vista en clase).</p>
      ${datos([`Energía activa: ${M(d.kWh + u_('kWh'))}`, `Energía reactiva: ${M(d.kVARh + u_('kVARh'))}`, `Cargo por energía: ${M(d.cargo + u_('Bs'))}`])}
      <p><b>b) Armónicos.</b> En ${d.eq} el cosfímetro marca ${M('\\cos\\varphi = ' + nh(d.cosf))} y la corriente tiene una distorsión armónica ${M('\\text{THD}_I = ' + d.thd + '\\ \\%')}.</p>`,
    pasos: (d) => [
      { t: 'a) Factura', tex: null, items: [
        { id: 'fp', et: '\\text{FP}', h: 'FP de la factura', pts: 3, tol: TOL_FP },
        { id: 'rec', et: '\\text{Recargo}', h: 'Recargo (Bs)', pts: 3 },
        { id: 'qmax', et: '\\text{kVARh}_{\\text{máx}}', h: 'kVARh máximos sin recargo (con los mismos kWh)', pts: 3 }] },
      { t: 'b) Armónicos', tex: null, items: [{ id: 'fpv', et: '\\text{FP}_v', h: 'FP verdadero', pts: 3, tol: TOL_FP }] },
      { t: 'Elige', nota: Q5[(d && d.v) || 0].q, tex: null, items: [{ id: 'op', et: Q5[(d && d.v) || 0].et, pts: 3, tipo: 'op' }] }
    ],
    ops: (d) => Q5[d.v].ops.map((h) => ({ h, t: '\\text{' + h + '}' })),
    esperado(d, u) {
      const fp = d.kWh / Math.hypot(d.kWh, d.kVARh), fpu = usar(u, 'fp', fp);
      const rec = (x) => (x > 0 && x < 0.85 ? d.cargo * (0.85 / x - 1) : 0);
      return { fp: [fp], rec: dos(rec(fpu), rec(fp)), qmax: [d.kWh * Math.tan(acosS(0.85))], fpv: [d.cosf / Math.sqrt(1 + (d.thd / 100) ** 2)], op: 0 };
    },
    final(d) {
      const fp = d.kWh / Math.hypot(d.kWh, d.kVARh);
      return [`\\text{FP} = \\dfrac{\\text{kWh}}{\\sqrt{\\text{kWh}^2 + \\text{kVARh}^2}} = ${tx(fp, 3)}`, `\\text{Recargo} = ${d.cargo}\\cdot\\left(\\dfrac{0{,}85}{${tx(fp, 3)}} - 1\\right) = ${tx(d.cargo * (0.85 / fp - 1), 1)}${u_('Bs')}`,
        `\\text{kVARh}_{\\text{máx}} = \\text{kWh}\\cdot\\tan(\\arccos 0{,}85) = ${tx(d.kWh * Math.tan(acosS(0.85)))}`,
        `\\text{FP}_v = \\dfrac{\\cos\\varphi}{\\sqrt{1 + \\text{THD}^2}} = ${tx(d.cosf / Math.sqrt(1 + (d.thd / 100) ** 2), 3)}`];
    }
  };

  // ===== P6: vatímetro electrodinámico =====
  P.p6 = {
    titulo: 'Vatímetro', max: 10,
    gen(r) {
      for (;;) {
        const Vn = elegir(r, [120, 240, 300]), In = elegir(r, [1, 2.5, 5, 10]), amax = elegir(r, [100, 120, 150]);
        const alfa = Math.round(amax * entre(r, 0.3, 0.9, 0.01));
        const V = Vn >= 240 ? elegir(r, [220, 230]) : elegir(r, [110, 115]);
        const fp = elegir(r, [0.4, 0.5, 0.6]), ratio = elegir(r, [0.6, 0.75, 1.25, 1.45]);
        const Pc = Math.round((V * In * ratio * fp) / 10) * 10, I = Pc / (V * fp);
        if (Pc <= 0 || Math.abs(I / In - 1) < 0.1) continue;
        return { Vn, In, amax, alfa, V, fp, Pc, quema: I > In };
      }
    },
    enunciado: (d) => `<p>Un vatímetro electrodinámico tiene estos datos de placa:</p>
      ${datos([`Tensión nominal: ${M('V_n = ' + d.Vn + u_('V'))}`, `Corriente nominal: ${M('I_n = ' + nh(d.In) + u_('A'))}`, `${M('\\cos\\varphi_n = 1')}`, `Escala: ${M(d.amax + u_('divisiones'))}`])}
      <p><b>a)</b> En una medición la aguja marca ${M(d.alfa + u_('divisiones'))}.</p>
      <p><b>b)</b> Después se conecta a una carga de ${M(d.Pc + u_('W'))} con ${M('\\text{FP} = ' + nh(d.fp))}, alimentada con ${M(d.V + u_('V'))}.</p>`,
    pasos: (d) => [
      { t: 'a) Lectura', tex: null, items: [
        { id: 'k', et: 'k', h: 'Constante \\(k\\) (W por división)', pts: 3 },
        { id: 'Pm', et: 'P\\ (\\text{W})', h: 'Potencia medida \\(P\\) (W)', pts: 3 }] },
      { t: 'b) La otra carga', tex: null, items: [{ id: 'I', et: 'I\\ (\\text{A})', h: 'Corriente de la carga \\(I\\) (A)', pts: 2 }] },
      { t: 'Elige', nota: 'En b), ¿corre peligro la bobina de corriente del vatímetro?', tex: null, items: [{ id: 'op', et: '\\text{Bobina de corriente}', pts: 2, tipo: 'op' }] }
    ],
    ops: (d) => {
      const si = { h: 'Sí: la corriente pasa de la nominal, aunque la aguja no llegue al final de la escala', t: '\\text{Sí}' };
      const no = { h: 'No: la corriente es menor que la nominal', t: '\\text{No}' };
      const fpb = { h: 'Sí, siempre: con FP bajo el vatímetro se quema', t: '\\text{Sí, siempre}' };
      return d.quema ? [si, no] : [no, fpb];
    },
    esperado(d, u) {
      const k = (d.Vn * d.In) / d.amax, ku = usar(u, 'k', k);
      return { k: [k], Pm: dos(ku * d.alfa, k * d.alfa), I: [d.Pc / (d.V * d.fp)], op: 0 };
    },
    final(d) {
      const k = (d.Vn * d.In) / d.amax;
      return [`k = \\dfrac{V_n\\cdot I_n\\cdot\\cos\\varphi_n}{\\alpha_{\\text{máx}}} = ${tx(k)}${u_('W/div')}`, `P = k\\cdot\\alpha = ${tx(k * d.alfa)}${u_('W')}`,
        `I = \\dfrac{P}{V\\cdot\\text{FP}} = ${tx(d.Pc / (d.V * d.fp))}${u_('A')}\\ ${d.quema ? '>' : '<'}\\ I_n = ${nh(d.In)}${u_('A')}`];
    }
  };

  // ===== P7: puesta a tierra (solo lo visto: contacto, Dwight, regla del 62 %) =====
  const Q7 = [
    { q: 'En la falla de a), ¿qué protege a una persona que toque la carcasa?', et: '\\text{Protección}',
      ops: ['Un interruptor diferencial de 30 mA', 'El disyuntor termomagnético de 16 A', 'Un fusible de mayor capacidad', 'Nada: esa tensión no es peligrosa'] },
    { q: 'Al medir con el telurómetro, la lectura cambia más del 5 % al mover la pica S un metro hacia adelante o hacia atrás. ¿Qué haces?', et: '\\text{Qué hacer}',
      ops: ['Alejar la pica H y volver a medir', 'Acercar S a la jabalina', 'Tomar el promedio de las lecturas', 'Aceptar la lectura más baja'] }
  ];
  P.p7 = {
    titulo: 'Puesta a tierra', max: 10,
    gen(r) {
      return { RA: elegir(r, [20, 25, 30, 40, 50, 60, 80]), RB: elegir(r, [5, 8, 10, 15]), rho: entre(r, 50, 300, 10), L: elegir(r, [1.5, 2.4, 3]), D: elegir(r, [20, 25, 30, 40, 50]), v: Math.floor(r() * Q7.length) };
    },
    R: (d) => (d.rho / (2 * PI * d.L)) * (Math.log((4 * d.L) / 0.008) - 1),
    enunciado: (d) => `<p><b>a)</b> Una lavadora (220 V) tiene una falla: la fase toca la carcasa metálica. La carcasa está conectada a su propia puesta a tierra.</p>
      ${datos([`Tensión: ${M('220' + u_('V'))}`, `Puesta a tierra de la lavadora: ${M('R_A = ' + d.RA + u_('Ω'))}`, `Puesta a tierra del neutro en el transformador: ${M('R_B = ' + d.RB + u_('Ω'))}`])}
      <p><b>b)</b> Una jabalina de cobre se clava en un suelo parejo.</p>
      ${datos([`Resistividad del suelo: ${M('\\rho = ' + d.rho + u_('Ω·m'))}`, `Largo: ${M('L = ' + nh(d.L) + u_('m'))}`, `Radio: ${M('a = 8' + u_('mm'))}`])}
      <p><b>c)</b> Se mide esa jabalina con el método de caída de potencial. La pica de corriente H está a ${M(d.D + u_('m'))} de la jabalina.</p>`,
    pasos: (d) => [
      { t: 'a) Falla a la carcasa', tex: null, items: [
        { id: 'If', et: 'I_f\\ (\\text{A})', h: 'Corriente de falla \\(I_f\\) (A)', pts: 2 },
        { id: 'Vc', et: 'V_c\\ (\\text{V})', h: 'Tensión de la carcasa respecto de la tierra lejana \\(V_c\\) (V)', pts: 2 }] },
      { t: 'b) y c)', tex: null, items: [
        { id: 'R', et: 'R\\ (\\Omega)', h: 'Resistencia de la jabalina \\(R\\) (Ω)', pts: 2 },
        { id: 'x', et: 'x\\ (\\text{m})', h: 'Distancia de la pica S a la jabalina \\(x\\) (m)', pts: 2 }] },
      { t: 'Elige', nota: Q7[(d && d.v) || 0].q, tex: null, items: [{ id: 'op', et: Q7[(d && d.v) || 0].et, pts: 2, tipo: 'op' }] }
    ],
    ops: (d) => Q7[d.v].ops.map((h) => ({ h, t: '\\text{' + h + '}' })),
    esperado(d, u) {
      const If = 220 / (d.RA + d.RB), Ifu = usar(u, 'If', If);
      return { If: [If], Vc: dos(Ifu * d.RA, If * d.RA), R: [this.R(d)], x: [0.62 * d.D], op: 0 };
    },
    final(d) {
      const If = 220 / (d.RA + d.RB);
      return [`I = \\dfrac{220}{R_A + R_B} = ${tx(If)}${u_('A')};\\; V_c = I\\cdot R_A = ${tx(If * d.RA)}${u_('V')}`,
        `R = \\dfrac{\\rho}{2\\pi L}\\left(\\ln\\dfrac{4L}{a} - 1\\right) = ${tx(this.R(d))}${u_('Ω')}`, `x = 0{,}62\\cdot D = ${tx(0.62 * d.D)}${u_('m')}`];
    }
  };

  RC.P = P;
  RC.PROB = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];
  RC.MAX = Object.fromEntries(RC.PROB.map((k) => [k, P[k].max]));
  RC.TITULO = Object.fromEntries(RC.PROB.map((k, i) => [k, 'P' + (i + 1)]));
  RC.NOMBRE = Object.fromEntries(RC.PROB.map((k) => [k, P[k].titulo]));

  // datos de un problema para un carnet (la carrera no cambia los datos en Medidas)
  const cache = {};
  RC.datos = (k, carnet) => {
    const clave = k + '|' + carnet;
    if (cache[clave]) return cache[clave];
    const r = RC.rng(String(carnet) + '|me-ex2|' + k);
    const d = P[k].gen(r);
    d.prob = k;
    d.op = {};
    P[k].pasos(d).forEach((ps) => ps.items.forEach((it) => {
      if (it.tipo !== 'op') return;
      const lista = P[k].ops(d).map((o, i) => ({ ...o, ok: i === 0 }));
      d.op[it.id] = RC.mezclar(RC.rng(String(carnet) + '|me-ex2|' + k + '|' + it.id), lista);
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
    const u = (id) => { const it = items.find((x) => x.id === id); if (!it || it.tipo === 'op') return undefined; const q = RC.leer(vals[id]); return q.vacio || q.invalido ? undefined : q.v; };
    const esp = P[k].esperado(d, u);
    const cel = {};
    let pts = 0;
    items.forEach((it) => {
      const v = vals[it.id];
      let r;
      if (it.tipo === 'op') {
        const ok = d.op[it.id].findIndex((o) => o.ok);
        r = v == null || v === '' ? 'vacio' : Number(v) === ok ? 'ok' : 'mal';
        cel[it.id] = { r, exp: ok, pts: r === 'ok' ? it.pts : 0, max: it.pts };
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
