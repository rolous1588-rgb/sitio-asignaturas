// ============================================================
// Métodos Numéricos · Factorización LU (miércoles 21/10/2026)
//   Etapa 1 · La idea: una red, muchas fuentes; costo; A = L·U (Gauss guardado)
//   Etapa 2 · Resolvamos juntos: circuito de 3 mallas, la misma matriz para todos,
//             11 rápidas encadenadas (cada una pide el paso siguiente) + b nuevo
//   Etapa 3 · Tu propio sistema: A, b y b′ por carnet; 6 filas con «Comprobar fila»
// Método: Doolittle (L con unos en la diagonal), sin pivoteo. Chapra, cap. 10.
// Reutiliza el motor de la clase de raíces (FS.*): ejercicios con items num/op y filas.
// Los valores esperados se calculan con los números del propio estudiante
// (un error no se arrastra a las filas siguientes).
// ============================================================
(function () {
  const FS = (window.FS = window.FS || {});
  FS.SESIONES = FS.SESIONES || {};
  const E = (FS.EJERCICIOS = {});
  const MN = (window.MN = window.MN || {});
  const X = String.raw;

  FS.CARRERAS = ['Ingeniería Mecatrónica', 'Ingeniería Electrónica', 'Ingeniería Eléctrica'];
  FS.CARNET_EJEMPLO = 'EJEMPLO';
  FS.ETAPAS = ['La idea', 'Resolvamos juntos', 'Tu propio sistema'];

  const entre = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const r4 = (x) => Math.round(x * 1e4) / 1e4;
  const d4 = (x) => (isFinite(x) ? (Math.abs(x) < 5e-5 ? 0 : r4(x)).toFixed(4).replace('.', ',') : '—');
  MN.r4 = r4;
  MN.d4 = d4;
  const num = (v) => (window.II ? II.num(v) : Number(String(v).replace(',', '.')));
  const sd = (x, y) => (Math.abs(x) > 1e-9 ? x : y);

  // número para LaTeX: -0{,}5
  const tx = (v) => {
    let s = String(Math.round(v * 1e4) / 1e4);
    if (s === '-0') s = '0';
    return s.replace('.', '{,}');
  };
  const mat = (M) => X`\begin{bmatrix}` + M.map((f) => f.map((v) => (typeof v === 'string' ? v : tx(v))).join('&')).join(X`\\`) + X`\end{bmatrix}`;
  const vec = (v) => mat(v.map((a) => [a]));
  const Q = X`\textcolor{#c0392b}{?}`;

  // ---------------- ejemplo guiado: circuito de 3 mallas (R en kΩ, V en voltios) ----------------
  // Todo da multiplicadores simples: L = [1; −0,5 1; −0,5 −0,6 1], U = [4 −2 −2; 0 5 −3; 0 0 3,2]
  const GA = [[4, -2, -2], [-2, 6, -2], [-2, -2, 6]];
  const GB = [12, 0, 8];
  const GB2 = [6, 6, 0];
  const G = { l21: -0.5, l31: -0.5, u22: 5, u23: -3, l32: -0.6, u33: 3.2, d1: 12, d2: 6, d3: 17.6, x3: 5.5, x2: 4.5, x1: 8 };
  const G2 = { d1: 6, d2: 9, d3: 8.4, x3: 2.625, x2: 3.375, x1: 4.5 };
  MN.G = G;

  const ORDEN_G = ['l21', 'l31', 'u22', 'u23', 'l32', 'u33', 'd2', 'd3', 'x3', 'x2', 'x1'];
  // contexto que se ve sobre cada pregunta: lo ya encontrado queda escrito, lo que falta es «?»
  function ctxG(k) {
    const sab = new Set(ORDEN_G.slice(0, k - 1));
    const v = (id) => (sab.has(id) ? G[id] : Q);
    const L = [[1, 0, 0], [v('l21'), 1, 0], [v('l31'), v('l32'), 1]];
    const U = [[4, -2, -2], [0, v('u22'), v('u23')], [0, 0, v('u33')]];
    let h = X`\(A=${mat(GA)}\)` + X`\(L=${mat(L)}\)` + X`\(U=${mat(U)}\)`;
    if (k >= 7) {
      h += X`\(b=${vec(GB)}\)` + X`\(d=${vec([12, v('d2'), v('d3')])}\)`;
      if (k >= 9) h += X`\(x=${vec([v('x1'), v('x2'), v('x3')])}\)`;
    }
    return h;
  }
  const N = (v) => X`\(${tx(v)}\)`;
  const opc = (ok, ...otras) => [N(ok), ...otras.map(N)];

  // ============================================================
  // Ejercicio individual: A (3×3), b y b′ por carnet
  // ============================================================
  // cadena de cálculo: cada valor usa los números ESCRITOS por el estudiante (o el correcto si falta)
  function corre(d, est) {
    const e = est || {};
    const out = [];
    const usa = (id, ideal) => {
      const v = num(e[id]);
      return e[id] != null && e[id] !== '' && isFinite(v) ? v : r4(ideal);
    };
    const put = (id, ideal) => { out.push({ id, ok: ideal }); return usa(id, ideal); };
    const [[a11, a12, a13], [a21, a22, a23], [a31, a32, a33]] = d.A;
    const l21 = put('l21', a21 / a11);
    const l31 = put('l31', a31 / a11);
    const u22 = put('u22', a22 - l21 * a12);
    const u23 = put('u23', a23 - l21 * a13);
    const l32 = put('l32', (a32 - l31 * a12) / sd(u22, 1));
    const u33 = put('u33', a33 - l31 * a13 - l32 * u23);
    const sust = (b, p) => {
      const d1 = put(p[0], b[0]);
      const d2 = put(p[1], b[1] - l21 * d1);
      const d3 = put(p[2], b[2] - l31 * d1 - l32 * d2);
      const x3 = put(p[3], d3 / sd(u33, 1));
      const x2 = put(p[4], (d2 - u23 * x3) / sd(u22, 1));
      put(p[5], (d1 - a12 * x2 - a13 * x3) / a11);
    };
    sust(d.b, ['d1', 'd2', 'd3', 'x3', 'x2', 'x1']);
    sust(d.b2, ['e1', 'e2', 'e3', 'y3', 'y2', 'y1']);
    return out;
  }

  const META = {
    l21: [1, 0, 'l₂₁', 5 / 6], l31: [1, 0, 'l₃₁', 5 / 6],
    u22: [2, 1, 'u₂₂', 5 / 6], u23: [2, 1, 'u₂₃', 5 / 6], l32: [2, 1, 'l₃₂', 5 / 6], u33: [2, 1, 'u₃₃', 5 / 6],
    d1: [3, 2, 'd₁', 0.5], d2: [3, 2, 'd₂', 0.5], d3: [3, 2, 'd₃', 0.5],
    x3: [4, 3, 'x₃', 0.5], x2: [4, 3, 'x₂', 0.5], x1: [4, 3, 'x₁', 0.5],
    e1: [5, 4, 'd′₁', 1 / 3], e2: [5, 4, 'd′₂', 1 / 3], e3: [5, 4, 'd′₃', 1 / 3],
    y3: [6, 5, 'x′₃', 1 / 3], y2: [6, 5, 'x′₂', 1 / 3], y1: [6, 5, 'x′₁', 1 / 3]
  };
  const CAB = ['', 'Eliminar la columna 1', 'Terminar U y l₃₂', 'Adelante: L·d = b', 'Atrás: U·x = d', 'b′ nuevo: adelante', 'b′ nuevo: atrás'];

  const emp = (v) => Math.abs(Math.abs(v * 1e4) % 1 - 0.5) < 0.03; // cerca de un empate en el 5.º decimal
  function generar(r) {
    for (let t = 0; t < 400; t++) {
      const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) A[i][j] = i === j ? entre(r, 5, 9) : entre(r, 1, 4) * (r() < 0.7 ? -1 : 1);
      const b = [entre(r, -6, 14), entre(r, -6, 14), entre(r, -6, 14)];
      const b2 = [entre(r, -6, 14), entre(r, -6, 14), entre(r, -6, 14)];
      if (b.every((v, i) => v === b2[i]) || b.every((v) => v === 0) || b2.every((v) => v === 0)) continue;
      const d = { A, b, b2 };
      const ch = corre(d, {});
      const get = (id) => ch.find((c) => c.id === id).ok;
      // sin empates en el 5.º decimal (con la cadena redondeada paso a paso), pivotes razonables y x lejos de cero
      const rd = corre(d, {}); // ok ideal de cada paso con valores redondeados del paso anterior
      if (rd.some((c) => emp(c.ok))) continue;
      if (Math.abs(get('u22')) < 3 || Math.abs(get('u33')) < 2.5) continue;
      const nt = ['l21', 'l31', 'l32'].filter((id) => Math.abs(get(id) * 1e4 - Math.round(get(id) * 1e4)) > 1e-3).length;
      if (nt < 2) continue;
      if (['x1', 'x2', 'x3', 'y1', 'y2', 'y3'].some((id) => Math.abs(get(id)) < 0.05 || Math.abs(get(id)) > 15)) continue;
      return d;
    }
    return { A: [[6, -2, -1], [-3, 7, -2], [-1, -4, 8]], b: [5, 7, -3], b2: [9, -2, 4] };
  }
  MN.generarLU = generar;
  MN.corre = corre;

  E.lu = {
    titulo: 'Tu factorización LU',
    puntos: 10,
    filas: 6,
    columnas: ['Fila 1: l₂₁, l₃₁', 'Fila 2: u₂₂, u₂₃, l₃₂, u₃₃', 'Fila 3: d (con b)', 'Fila 4: x (con b)', 'Fila 5: d′ (con b′)', 'Fila 6: x′ (con b′)'],
    tv: 'Cada uno tiene <b>su propia matriz A</b> y <b>dos fuentes</b>: b y b′. Factoricen <b>A = L·U</b> (4 decimales en cada paso), resuelvan con b y después con b′ <b>sin volver a eliminar</b>. <b>Comprobar fila</b>: 2 intentos.',
    generar,
    resumen: (d) => 'A = ' + d.A.map((f) => '[' + f.join(' ') + ']').join(''),
    formulas: [
      X`\(l_{21}=\dfrac{a_{21}}{a_{11}}\;;\;l_{31}=\dfrac{a_{31}}{a_{11}}\)`,
      X`\(u_{22}=a_{22}-l_{21}\,a_{12}\;;\;u_{23}=a_{23}-l_{21}\,a_{13}\)`,
      X`\(l_{32}=\dfrac{a_{32}-l_{31}\,a_{12}}{u_{22}}\)`,
      X`\(u_{33}=a_{33}-l_{31}\,a_{13}-l_{32}\,u_{23}\)`,
      'La primera fila de U es la primera fila de A.',
      'Adelante (L·d = b):',
      X`\(d_1=b_1\;;\;d_2=b_2-l_{21}d_1\;;\;d_3=b_3-l_{31}d_1-l_{32}d_2\)`,
      'Atrás (U·x = d):',
      X`\(x_3=\dfrac{d_3}{u_{33}}\;;\;x_2=\dfrac{d_2-u_{23}x_3}{u_{22}}\;;\;x_1=\dfrac{d_1-a_{12}x_2-a_{13}x_3}{a_{11}}\)`
    ],
    enunciado: (d) => X`<p>Tu sistema <b>A·x = b</b>, y la misma red con otra fuente <b>b′</b>:</p>
      <div class="lu-ctx">\(A=${mat(d.A)}\)\(b=${vec(d.b)}\)\(b'=${vec(d.b2)}\)</div>
      <p>1) Factoriza <b>A = L·U</b> (filas 1 y 2). 2) Resuelve con <b>b</b> (filas 3 y 4). 3) Con <b>b′</b> reutiliza <b>L y U</b>, sin eliminar otra vez (filas 5 y 6). <b>4 decimales en cada paso.</b> Toca <b>Comprobar fila</b> (2 intentos; si fallas los dos, te muestra el valor y sigues).</p>`,
    // valores esperados con los números del propio estudiante
    items: (d, est) => corre(d, est).map((c) => {
      const m = META[c.id];
      return { id: c.id, fila: m[0], col: m[1], etc: m[2], et: `Fila ${m[0]} · ${m[2]}`, cab: CAB[m[0]], w: m[3], tipo: 'num', ok: c.ok, tolRel: 0, tolAbs: 0.0006 };
    }),
    solucion: (d) => {
      const c = {};
      corre(d, {}).forEach((x) => { c[x.id] = r4(x.ok); });
      const f = d4;
      const A = d.A;
      return [
        `Fila 1: l₂₁ = ${A[1][0]} / ${A[0][0]} = <b>${f(c.l21)}</b> ; l₃₁ = ${A[2][0]} / ${A[0][0]} = <b>${f(c.l31)}</b>`,
        `Fila 2: u₂₂ = ${A[1][1]} − (${f(c.l21)})(${A[0][1]}) = <b>${f(c.u22)}</b> ; u₂₃ = ${A[1][2]} − (${f(c.l21)})(${A[0][2]}) = <b>${f(c.u23)}</b>`,
        `l₃₂ = (${A[2][1]} − (${f(c.l31)})(${A[0][1]})) / ${f(c.u22)} = <b>${f(c.l32)}</b> ; u₃₃ = ${A[2][2]} − (${f(c.l31)})(${A[0][2]}) − (${f(c.l32)})(${f(c.u23)}) = <b>${f(c.u33)}</b>`,
        `Fila 3 (adelante, b = ${d.b.join('; ')}): d₁ = <b>${f(c.d1)}</b> ; d₂ = <b>${f(c.d2)}</b> ; d₃ = <b>${f(c.d3)}</b>`,
        `Fila 4 (atrás): x₃ = <b>${f(c.x3)}</b> ; x₂ = <b>${f(c.x2)}</b> ; x₁ = <b>${f(c.x1)}</b>`,
        `Fila 5 (b′ = ${d.b2.join('; ')}, mismos L y U): d′₁ = <b>${f(c.e1)}</b> ; d′₂ = <b>${f(c.e2)}</b> ; d′₃ = <b>${f(c.e3)}</b>`,
        `Fila 6: x′₃ = <b>${f(c.y3)}</b> ; x′₂ = <b>${f(c.y2)}</b> ; x′₁ = <b>${f(c.y1)}</b>`
      ];
    }
  };

  // ---------- datos y calificación (con peso por celda) ----------
  FS.datosDe = (ejId, carnet, carrera, extraSem) =>
    E[ejId].generar(II.rng(carnet + '|' + ejId + (extraSem ? '|' + extraSem : '')), carrera);

  FS.itemOk = (it, v) => {
    if (v == null || v === '') return false;
    if (it.tipo === 'op') return Number(v) === it.ok;
    return II.cerca(II.num(v), it.ok, it.tolRel != null ? it.tolRel : 0.02, it.tolAbs != null ? it.tolAbs : 0.005);
  };
  FS.evaluar = (ejId, d, est) => {
    const ej = E[ejId];
    const e = est || {};
    const its = ej.items(d, e);
    const det = {};
    let ac = 0, peso = 0, total = 0;
    its.forEach((it) => {
      const w = it.w != null ? it.w : 1;
      total += w;
      det[it.id] = FS.itemOk(it, e[it.id]);
      if (!det[it.id]) return;
      ac++;
      if (e._rev && e._rev[it.id]) return; // valor mostrado tras 2 intentos: no suma
      peso += w * (e._int && Number(e._int[it.id]) === 2 ? 0.5 : 1);
    });
    const puntos = Math.round(((ej.puntos * peso) / total) * 100) / 100;
    return { puntos, ok: ac === its.length, det, aciertos: ac, total: its.length };
  };
  FS.vacios = (ejId, d, est) => E[ejId].items(d, est).filter((it) => est == null || est[it.id] == null || est[it.id] === '').length;
  FS.mostrarValor = (it, v) => (v == null || v === '' ? '—' : it.tipo === 'op' ? it.ops[Number(v)] : String(v));
  FS.valorCorrecto = (it) => (it.tipo === 'op' ? it.ops[it.ok] : d4(it.ok));

  // ============================================================
  // La clase
  // ============================================================
  const rap = (id, etapa, titulo, t, o, por, ctx) => ({ id, etapa, tipo: 'rapida', titulo, t, o, c: 0, por, ctx });
  const J = (k, id, titulo, t, o, por) => rap(id, 2, titulo, t, o, por, ctxG(k));

  FS.SESIONES['mn-lu'] = {
    id: 'mn-lu',
    materia: 'Métodos Numéricos',
    titulo: 'Factorización LU',
    pasos: [
      { id: 'inicio', etapa: 1, tipo: 'inicio', titulo: 'Factorización LU: Gauss, pero guardado', idea: 'Escanea el QR y entra con tus datos.' },
      { id: 'x-red', etapa: 1, tipo: 'explica', titulo: 'Una red, muchas fuentes', idea: 'Prueba varias fuentes: la red es la misma, cambian las fuentes.', modo: 'luRed' },
      rap('g1', 1, 'Mismo A, otro b', 'La misma red se prueba con 5 fuentes distintas (5 vectores b). Con Gauss, ¿cuántas veces se repite la eliminación?',
        ['5 veces: una por cada b', '1 sola vez para las 5 fuentes', '10 veces', 'Ninguna: Gauss no sirve aquí'],
        'Gauss trabaja con la matriz aumentada [A | b]: si b cambia, hay que repetir todo. LU separa el trabajo: A se factoriza una sola vez.'),
      rap('g2', 1, 'El costo', X`Matriz de \(n=100\) con \(k=50\) fuentes. Gauss repetido hace unas \(17\) millones de operaciones; LU, unas \(0{,}83\) millones. ¿Qué conviene?`,
        ['LU: unas 20 veces menos trabajo', 'Gauss: es más simple y cuesta lo mismo', 'LU: solo 2 veces menos', 'Da igual'],
        X`Gauss repetido: \(50\,(100^3/3+100^2)\approx 17\) millones. LU: \(100^3/3+50\cdot 100^2\approx 0{,}83\) millones. Cada b nuevo cuesta solo \(n^2\), no \(n^3/3\).`),
      { id: 'x-costo', etapa: 1, tipo: 'explica', titulo: '¿Cuánto cuesta cada camino?', idea: 'Mueve n y k: compara Gauss repetido con LU.', modo: 'luCosto' },
      { id: 'x-lu', etapa: 1, tipo: 'explica', titulo: 'Gauss guardado: mira cómo se llena L', idea: 'Avanza paso a paso. Cada multiplicador cae en L.', modo: 'luPaso' },
      { id: 'x-sust', etapa: 1, tipo: 'explica', titulo: 'Las dos escaleras', idea: 'Con L y U guardados, cada fuente nueva es bajar y subir.', modo: 'luSust' },
      rap('c1', 1, '¿Qué guarda L?', 'En A = L·U, ¿qué contiene la matriz L?',
        ['Los multiplicadores de la eliminación, con unos en la diagonal', 'La matriz triangular que queda al terminar de eliminar', 'Las incógnitas x', 'La inversa de A'],
        'L guarda los multiplicadores. La matriz triangular que queda arriba al terminar de eliminar es U.'),
      rap('c2', 1, 'El orden', X`Ya tienes \(L\) y \(U\). ¿Cómo resuelves \(A\,x=b\)?`,
        [X`Primero \(L\,d=b\) (adelante) y después \(U\,x=d\) (atrás)`, X`Primero \(U\,x=d\) y después \(L\,d=b\)`, 'Elimino otra vez toda la matriz A', X`Calculo \(A^{-1}\) y multiplico por \(b\)`],
        X`Como \(A=LU\), primero se obtiene \(d\) con \(L\,d=b\) (L es triangular inferior: de arriba hacia abajo) y luego \(x\) con \(U\,x=d\) (de abajo hacia arriba).`),

      // ---------- Etapa 2 ----------
      {
        id: 't-circuito', etapa: 2, tipo: 'teoria', titulo: 'Resolvamos juntos: el circuito de 3 mallas', idea: 'La misma matriz para todos. Cada pregunta pide el paso siguiente.',
        puntos: [
          X`Análisis de mallas (R en kΩ; V en voltios): \(A\,x=b\), con \(x\) = corrientes de malla en mA.`,
          X`\[A=${mat(GA)}\;;\;b=${vec(GB)}\]`,
          'Vamos a factorizar <b>A = L·U</b> a mano, con números simples. Calculen en su cuaderno y voten.',
          X`Después cambiaremos la fuente a \(b'=${vec(GB2).replace(/\\\\/g, ' ; ').replace(/\\begin\{bmatrix\}|\\end\{bmatrix\}/g, '')}\) <b>sin volver a eliminar</b>.`
        ],
        formulas: [X`\(l_{21}=\dfrac{a_{21}}{a_{11}}\;;\;l_{31}=\dfrac{a_{31}}{a_{11}}\)`, X`\(u_{22}=a_{22}-l_{21}\,a_{12}\;;\;u_{23}=a_{23}-l_{21}\,a_{13}\)`, X`\(l_{32}=\dfrac{a_{32}-l_{31}\,a_{12}}{u_{22}}\)`, X`\(u_{33}=a_{33}-l_{31}\,a_{13}-l_{32}\,u_{23}\)`, 'La primera fila de U es la primera fila de A.'],
        derecha: 'Fórmulas'
      },
      J(1, 'j1', '¿Cuánto vale l₂₁?', X`Para anular el \(-2\) de la fila 2 usando la fila 1 (pivote \(4\)), ¿cuál es el multiplicador \(l_{21}=a_{21}/a_{11}\)?`,
        opc(-0.5, 0.5, -2, 2), X`\(l_{21}=a_{21}/a_{11}=-2/4=-0{,}5\). Es el número por el que multiplicas la fila 1 para restarla de la fila 2: \(-2-(-0{,}5)(4)=0\).`),
      J(2, 'j2', '¿Cuánto vale l₃₁?', X`Ahora la fila 3: \(l_{31}=a_{31}/a_{11}\). ¿Cuánto vale?`,
        opc(-0.5, 0.5, -2, 4), X`\(l_{31}=a_{31}/a_{11}=-2/4=-0{,}5\).`),
      J(3, 'j3', '¿Cuánto vale u₂₂?', X`\(u_{22}=a_{22}-l_{21}\,a_{12}\). ¿Cuánto vale?`,
        opc(5, 7, 6, 4), X`\(u_{22}=6-(-0{,}5)(-2)=6-1=5\). Cuidado con el signo: dos negativos dan positivo, y se resta.`),
      J(4, 'j4', '¿Cuánto vale u₂₃?', X`\(u_{23}=a_{23}-l_{21}\,a_{13}\). ¿Cuánto vale?`,
        opc(-3, -1, -2, 1), X`\(u_{23}=-2-(-0{,}5)(-2)=-2-1=-3\).`),
      J(5, 'j5', '¿Cuánto vale l₃₂?', X`El pivote ahora es \(u_{22}=5\). \(l_{32}=\dfrac{a_{32}-l_{31}\,a_{12}}{u_{22}}\). ¿Cuánto vale?`,
        opc(-0.6, -0.4, 0.6, -3), X`\(l_{32}=\dfrac{-2-(-0{,}5)(-2)}{5}=\dfrac{-2-1}{5}=-0{,}6\). Un error común es olvidar el término \(l_{31}\,a_{12}\) y dividir solo \(-2/5=-0{,}4\).`),
      J(6, 'j6', '¿Cuánto vale u₃₃?', X`\(u_{33}=a_{33}-l_{31}\,a_{13}-l_{32}\,u_{23}\). ¿Cuánto vale?`,
        opc(3.2, 5, 6.8, 8.8), X`\(u_{33}=6-(-0{,}5)(-2)-(-0{,}6)(-3)=6-1-1{,}8=3{,}2\). Ya tenemos \(L\) y \(U\) completas: <b>este trabajo no se repite</b> aunque cambie b.`),
      J(7, 'j7', 'Adelante: d₂', X`Ahora \(L\,d=b\) con \(b=(12;\,0;\,8)\). \(d_1=12\). ¿Cuánto vale \(d_2=b_2-l_{21}\,d_1\)?`,
        opc(6, -6, 0, 12), X`\(d_2=0-(-0{,}5)(12)=6\).`),
      J(8, 'j8', 'Adelante: d₃', X`\(d_3=b_3-l_{31}\,d_1-l_{32}\,d_2\). ¿Cuánto vale?`,
        opc(17.6, 10.4, 14, 8), X`\(d_3=8-(-0{,}5)(12)-(-0{,}6)(6)=8+6+3{,}6=17{,}6\).`),
      J(9, 'j9', 'Atrás: x₃', X`Ahora \(U\,x=d\), empezando por abajo. \(x_3=d_3/u_{33}\). ¿Cuánto vale?`,
        opc(5.5, 14.4, 0.18, 56.3), X`\(x_3=17{,}6/3{,}2=5{,}5\) mA.`),
      J(10, 'j10', 'Atrás: x₂', X`\(x_2=\dfrac{d_2-u_{23}\,x_3}{u_{22}}\). ¿Cuánto vale?`,
        opc(4.5, -2.1, 22.5, 1.2), X`\(x_2=\dfrac{6-(-3)(5{,}5)}{5}=\dfrac{6+16{,}5}{5}=4{,}5\) mA.`),
      J(11, 'j11', 'Atrás: x₁', X`\(x_1=\dfrac{d_1-a_{12}\,x_2-a_{13}\,x_3}{a_{11}}\). ¿Cuánto vale?`,
        opc(8, -2, 32, 4), X`\(x_1=\dfrac{12-(-2)(4{,}5)-(-2)(5{,}5)}{4}=\dfrac{12+9+11}{4}=8\) mA. Comprobación en la fila 1: \(4(8)-2(4{,}5)-2(5{,}5)=12\) ✓.`),
      rap('j12', 2, 'Cambió la fuente', X`La fuente cambia a \(b'=(6;\,6;\,0)\), la matriz \(A\) sigue igual. ¿Qué hay que rehacer?`,
        [X`Solo \(L\,d=b'\) y \(U\,x=d\): \(L\) y \(U\) se reutilizan`, 'Toda la eliminación otra vez', X`Solo la matriz \(U\)`, 'Nada: x queda igual'],
        X`Con \(L\) y \(U\) ya guardadas, solo se hacen las dos sustituciones (\(n^2\) operaciones). Resultado: \(d'=(6;\,9;\,8{,}4)\) y \(x'=(4{,}5;\,3{,}375;\,2{,}625)\).`, ctxG(12)),
      rap('c3', 2, 'Un pivote muy pequeño', 'Como en la clase del pivoteo: si el primer pivote fuera 0,0002, ¿qué pasaría en LU?',
        ['Multiplicadores enormes y errores de redondeo grandes: conviene intercambiar filas (pivoteo)', 'Nada: LU no usa pivotes', 'LU sería más exacta que Gauss', 'L tendría ceros en la diagonal'],
        'LU es Gauss guardado: hereda sus problemas. Un pivote casi cero produce multiplicadores gigantes. Se resuelve con pivoteo (PA = LU), que veremos si queda tiempo. Hoy los sistemas no lo necesitan.'),

      // ---------- Etapa 3 ----------
      {
        id: 't-solo', etapa: 3, tipo: 'teoria', titulo: 'Ahora tú solo: tu propio sistema', idea: 'Misma receta, tus números.',
        puntos: [
          'Cada uno tiene <b>su matriz A</b> (3×3) y <b>dos fuentes</b>: b y b′.',
          'Filas 1 y 2: <b>L y U</b>. Filas 3 y 4: la solución con <b>b</b>. Filas 5 y 6: la solución con <b>b′</b>, reutilizando L y U.',
          'Calculadora simple, <b>4 decimales en cada paso</b> (se anota redondeado y se sigue con lo anotado).',
          '<b>Comprobar fila</b>: 2 intentos. Si fallas los dos, te muestra el valor y sigues.'
        ],
        formulas: [X`\(A=L\,U\)`, X`\(L\,d=b\;\;(\text{adelante})\)`, X`\(U\,x=d\;\;(\text{atrás})\)`, 'Puntaje por celda:', '1.er intento: completo; 2.º: mitad; mostrado: 0']
      },
      { id: 'lu', etapa: 3, tipo: 'ejercicio', ejercicio: 'lu' },
      { id: 'cierre', etapa: 3, tipo: 'cierre', titulo: 'Cierre', idea: 'LU factoriza una vez y resuelve muchas fuentes. Siguiente: métodos iterativos (Jacobi y Gauss-Seidel).' }
    ]
  };
})();
