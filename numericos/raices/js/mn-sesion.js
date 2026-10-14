// ============================================================
// Métodos Numéricos · Repaso de raíces por celular (miércoles 14/10/2026)
// Entrenamiento para el examen del viernes.
//   Etapa 1 · Calentamiento (reglas + 2 rápidas)
//   Etapa 2 · Falsa posición guiada: misma función para todos, una fila por actividad
//   Etapa 3 · Newton-Raphson individual: función propia, 4 filas, «Comprobar fila» con 2 intentos
// Reutiliza el motor de Fourier (FS.*): ejercicios con items num/op.
// Extensiones propias:
//   - items(d, est): los valores esperados de Newton se calculan con los números del propio
//     estudiante (un error no se arrastra a las filas siguientes).
//   - participacion: true → 1 punto por enviar + 1 punto según aciertos.
//   - filas: n → el celular agrupa los items por fila y ofrece «Comprobar fila».
//     est._int[id] = intento (1 o 2) en que la celda quedó correcta; est._rev[id] = valor mostrado.
//     Puntaje por celda: 1.er intento (o sin comprobar) = completo, 2.º = mitad, mostrado = 0.
// ============================================================
(function () {
  const FS = (window.FS = window.FS || {});
  FS.SESIONES = FS.SESIONES || {};
  const E = (FS.EJERCICIOS = {});
  const MN = (window.MN = window.MN || {});

  FS.CARRERAS = ['Ingeniería Mecatrónica', 'Ingeniería Electrónica', 'Ingeniería Eléctrica'];
  FS.CARNET_EJEMPLO = 'EJEMPLO';
  FS.ETAPAS = ['Calentamiento', 'Falsa posición', 'Newton-Raphson'];

  const entre = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const elegir = (r, arr) => arr[Math.floor(r() * arr.length)];
  const r4 = (x) => Math.round(x * 1e4) / 1e4;
  // 4 decimales con coma (como se escribe en clase)
  const d4 = (x) => (isFinite(x) ? (Math.abs(x) < 5e-5 ? 0 : r4(x)).toFixed(4).replace('.', ',') : '—');
  MN.r4 = r4;
  MN.d4 = d4;
  const errPct = (nuevo, ant) => (Math.abs(nuevo - ant) / Math.abs(nuevo)) * 100;

  // ---------- gráfica liviana (SVG, colores claros) ----------
  MN.grafica = function (o) {
    const W = 640, H = 380, mL = 50, mR = 20, mT = 20, mB = 46;
    const N = 120;
    const xs = [], ys = [];
    for (let i = 0; i <= N; i++) { const x = o.x0 + ((o.x1 - o.x0) * i) / N; xs.push(x); ys.push(o.f(x)); }
    let y0 = o.y0 != null ? o.y0 : Math.min(0, ...ys), y1 = o.y1 != null ? o.y1 : Math.max(0, ...ys);
    const pad = (y1 - y0) * 0.08 || 1; y0 -= pad; y1 += pad;
    const X = (x) => mL + ((x - o.x0) / (o.x1 - o.x0)) * (W - mL - mR);
    const Y = (y) => mT + ((y1 - y) / (y1 - y0)) * (H - mT - mB);
    const cl = (y) => Math.max(mT - 2, Math.min(H - mB + 2, y));
    let s = `<svg viewBox="0 0 ${W} ${H}" class="mn-graf" role="img" aria-label="Gráfica de f(x)" style="width:100%;height:auto;display:block">`;
    s += `<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`;
    // ejes
    s += `<line x1="${mL}" y1="${Y(0)}" x2="${W - mR}" y2="${Y(0)}" stroke="#334155" stroke-width="2"/>`;
    (o.marcas || []).forEach((m) => {
      s += `<line x1="${X(m)}" y1="${Y(0) - 6}" x2="${X(m)}" y2="${Y(0) + 6}" stroke="#334155" stroke-width="2"/><text x="${X(m)}" y="${H - 14}" font-size="22" text-anchor="middle" fill="#334155">${String(m).replace('.', ',')}</text>`;
    });
    // curva
    s += `<polyline fill="none" stroke="#2563eb" stroke-width="5" stroke-linejoin="round" points="${xs.map((x, i) => X(x).toFixed(1) + ',' + cl(Y(ys[i])).toFixed(1)).join(' ')}"/>`;
    // secante (falsa posición)
    if (o.secante) {
      const [a, b] = o.secante, fa = o.f(a), fb = o.f(b);
      s += `<line x1="${X(a)}" y1="${cl(Y(fa))}" x2="${X(b)}" y2="${cl(Y(fb))}" stroke="#ea580c" stroke-width="4" stroke-dasharray="12 8"/>`;
      [[a, fa, 'Xa'], [b, fb, 'Xb']].forEach(([x, y, et]) => {
        s += `<line x1="${X(x)}" y1="${Y(0)}" x2="${X(x)}" y2="${cl(Y(y))}" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4 5"/>`;
        s += `<circle cx="${X(x)}" cy="${cl(Y(y))}" r="9" fill="#ea580c"/><text x="${X(x)}" y="${cl(Y(y)) + (y < 0 ? 34 : -16)}" font-size="26" font-weight="700" text-anchor="middle" fill="#9a3412">${et}</text>`;
      });
      const xr = b - (fb * (a - b)) / (fa - fb);
      s += `<circle cx="${X(xr)}" cy="${Y(0)}" r="10" fill="#ffffff" stroke="#16a34a" stroke-width="5"/>`;
      if (o.etXr) s += `<text x="${X(xr)}" y="${Y(0) - 18}" font-size="26" font-weight="700" text-anchor="middle" fill="#15803d">Xr</text>`;
    }
    // tangente (Newton)
    if (o.tangente) {
      const x = o.tangente, fx = o.f(x), m = o.df(x);
      const xa = o.x0, xb = o.x1;
      s += `<line x1="${X(xa)}" y1="${cl(Y(fx + m * (xa - x)))}" x2="${X(xb)}" y2="${cl(Y(fx + m * (xb - x)))}" stroke="#ea580c" stroke-width="4" stroke-dasharray="12 8"/>`;
      s += `<line x1="${X(x)}" y1="${Y(0)}" x2="${X(x)}" y2="${cl(Y(fx))}" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4 5"/>`;
      s += `<circle cx="${X(x)}" cy="${cl(Y(fx))}" r="9" fill="#ea580c"/><text x="${X(x) + 16}" y="${cl(Y(fx)) + (fx < 0 ? 30 : -12)}" font-size="26" font-weight="700" fill="#9a3412">x₀</text>`;
      const xn = x - fx / m;
      if (xn > o.x0 && xn < o.x1) s += `<circle cx="${X(xn)}" cy="${Y(0)}" r="10" fill="#ffffff" stroke="#16a34a" stroke-width="5"/>`;
    }
    return s + '</svg>';
  };

  // ============================================================
  // Etapa 2 · Falsa posición guiada: f(x) = x·eˣ − 2 en [0, 1]
  // ============================================================
  const FP = { f: (x) => x * Math.exp(x) - 2, txt: 'f(x) = x·eˣ − 2', a: 0, b: 1 };
  MN.FP = FP;
  // tabla de referencia, redondeando a 4 decimales en cada paso (como el estudiante)
  MN.tablaFP = (() => {
    let cache = null;
    return () => {
      if (cache) return cache;
      const T = [];
      let xa = FP.a, xb = FP.b, fa = r4(FP.f(xa)), fb = r4(FP.f(xb)), ant = null;
      for (let n = 1; n <= 4; n++) {
        const xr = r4(xb - (fb * (xa - xb)) / (fa - fb));
        const fr = r4(FP.f(xr));
        const fila = { n, xa, xb, fa, fb, xr, fr, err: ant == null ? null : errPct(xr, ant), cambia: fa * fr < 0 ? 1 : 0 };
        T.push(fila);
        if (fa * fr < 0) { xb = xr; fb = fr; } else { xa = xr; fa = fr; }
        ant = xr;
      }
      return (cache = T);
    };
  })();

  const FORM_FP = [
    'Xr = Xb − f(Xb)·(Xa − Xb) / (f(Xa) − f(Xb))',
    'Si f(Xa)·f(Xr) < 0 → Xb = Xr',
    'Si f(Xa)·f(Xr) > 0 → Xa = Xr',
    'Error % = |Xr − Xr anterior| / |Xr| × 100'
  ];
  const TOL_X = { tolRel: 0, tolAbs: 0.0006 };
  const TOL_E = { tolRel: 0.003, tolAbs: 0.01 };

  function tablaPrevia(n) {
    const T = MN.tablaFP();
    const filas = T.slice(0, n - 1).map((t) => `<tr><td>${t.n}</td><td>${d4(t.xa)}</td><td>${d4(t.xb)}</td><td>${d4(t.xr)}</td><td>${d4(t.fr)}</td><td>${t.err == null ? '---' : d4(t.err)}</td></tr>`).join('');
    const actual = T[n - 1];
    const fila = n === 1
      ? `<tr class="mn-actual"><td>1</td><td>${d4(actual.xa)}</td><td>${d4(actual.xb)}</td><td>?</td><td>?</td><td>---</td></tr>`
      : `<tr class="mn-actual"><td>${n}</td><td>?</td><td>?</td><td>?</td><td>?</td><td>?</td></tr>`;
    return `<div class="mn-tabla-scroll"><table class="mn-tabla"><thead><tr><th>n</th><th>Xa</th><th>Xb</th><th>Xr</th><th>f(Xr)</th><th>Error %</th></tr></thead><tbody>${filas}${fila}</tbody></table></div>`;
  }

  for (let n = 1; n <= 4; n++) {
    E['fp' + n] = {
      titulo: 'Falsa posición · fila ' + n,
      puntos: 2,
      participacion: true,
      tv: n === 1
        ? `Todos con la misma función: <b>${FP.txt}</b> en [0, 1]. Calculen <b>Xr</b> y <b>f(Xr)</b> y decidan <b>qué extremo cambia</b>.`
        : `Fila ${n}: escriban el <b>nuevo intervalo</b> (Xa, Xb), <b>Xr</b>, <b>f(Xr)</b> y el <b>error %</b>. 4 decimales en cada paso.`,
      generar: () => ({ n }),
      resumen: () => FP.txt + ' en [0, 1]',
      formulas: FORM_FP,
      enunciado: (d) => `<p><b>${FP.txt}</b> en [0, 1]. Trabaja con <b>4 decimales en cada paso</b>.</p>${tablaPrevia(d.n)}`,
      figura: (d) => {
        const t = MN.tablaFP()[d.n - 1];
        return MN.grafica({ f: FP.f, x0: -0.05, x1: 1.08, y0: -2.2, y1: 0.9, marcas: [0, 0.5, 1], secante: [t.xa, t.xb] });
      },
      items: (d) => {
        const t = MN.tablaFP()[d.n - 1];
        if (d.n === 1) {
          return [
            { id: 'xr', et: 'Xr', tipo: 'num', ok: t.xr, ...TOL_X },
            { id: 'fr', et: 'f(Xr)', tipo: 'num', ok: t.fr, ...TOL_X },
            { id: 'ext', et: '¿Qué extremo cambia por Xr?', tipo: 'op', ops: ['Xa = Xr', 'Xb = Xr'], ok: t.cambia }
          ];
        }
        return [
          { id: 'xa', et: 'Xa', tipo: 'num', ok: t.xa, ...TOL_X },
          { id: 'xb', et: 'Xb', tipo: 'num', ok: t.xb, ...TOL_X },
          { id: 'xr', et: 'Xr', tipo: 'num', ok: t.xr, ...TOL_X },
          { id: 'fr', et: 'f(Xr)', tipo: 'num', ok: t.fr, ...TOL_X },
          { id: 'er', et: 'Error %', tipo: 'num', ok: t.err, ...TOL_E }
        ];
      },
      solucion: (d) => {
        const T = MN.tablaFP();
        const t = T[d.n - 1];
        const L = [];
        if (d.n > 1) {
          const p = T[d.n - 2];
          L.push(`Fila ${p.n}: f(Xa)·f(Xr) = (${d4(p.fa)})·(${d4(p.fr)}) ${p.cambia ? '< 0 → <b>Xb = Xr</b>' : '> 0 → <b>Xa = Xr</b>'}`);
          L.push(`Intervalo nuevo: Xa = <b>${d4(t.xa)}</b>, Xb = <b>${d4(t.xb)}</b>`);
        }
        L.push(`f(Xa) = ${d4(t.fa)} · f(Xb) = ${d4(t.fb)}`);
        L.push(`Xr = ${d4(t.xb)} − (${d4(t.fb)})·(${d4(t.xa)} − ${d4(t.xb)}) / (${d4(t.fa)} − ${d4(t.fb)}) = <b>${d4(t.xr)}</b>`);
        L.push(`f(Xr) = ${d4(t.xr)}·e^${d4(t.xr)} − 2 = <b>${d4(t.fr)}</b>`);
        if (d.n === 1) L.push(`f(Xa)·f(Xr) = (${d4(t.fa)})·(${d4(t.fr)}) ${t.cambia ? '< 0 → <b>Xb = Xr</b>' : '> 0 → <b>Xa = Xr</b>'}`);
        else L.push(`Error = |${d4(t.xr)} − ${d4(T[d.n - 2].xr)}| / ${d4(t.xr)} × 100 = <b>${d4(t.err)} %</b>`);
        return L;
      }
    };
  }

  // ============================================================
  // Etapa 3 · Newton-Raphson individual: f(x) = x³ + a·sen(x) − b, x₀ = 1
  // f'(x) = 3x² + a·cos(x) > 0 para x ≥ 0 (a ≤ 6): una sola raíz positiva, sin f' = 0.
  // ============================================================
  const NR = {
    f: (d) => (x) => x * x * x + d.a * Math.sin(x) - d.b,
    df: (d) => (x) => 3 * x * x + d.a * Math.cos(x),
    txt: (d) => `f(x) = x³ + ${d.a}·sen(x) − ${d.b}`,
    // (a, b) con la raíz lejos de x₀ = 1, para que se vean varias iteraciones
    variantes: [[2, 5], [2, 6], [2, 7], [2, 8], [2, 9], [3, 6], [3, 7], [3, 8], [3, 9], [4, 7], [4, 8], [4, 9], [5, 8], [5, 9]]
  };
  MN.NR = NR;
  // tabla de referencia (4 decimales en cada paso)
  MN.tablaNR = (d) => {
    const F = NR.f(d), D = NR.df(d);
    const T = [];
    let x = d.x0;
    for (let n = 1; n <= 4; n++) {
      const fx = r4(F(x)), dfx = r4(D(x));
      const x1 = r4(x - fx / dfx);
      T.push({ n, x, fx, dfx, x1, err: errPct(x1, x) });
      x = x1;
    }
    return T;
  };
  const COLS_NR = [
    { k: 'f', et: 'f(Xₙ)', col: 0 },
    { k: 'd', et: "f'(Xₙ)", col: 1 },
    { k: 'x', et: 'Xₙ₊₁', col: 2 },
    { k: 'e', et: 'Error %', col: 3 }
  ];
  const num = (v) => (window.II ? II.num(v) : Number(String(v).replace(',', '.')));

  E.nr = {
    titulo: 'Tu Newton-Raphson',
    puntos: 8,
    filas: 4,
    columnas: COLS_NR.map((c) => c.et),
    tv: 'Cada uno tiene <b>su propia función</b> f(x) = x³ + a·sen(x) − b con <b>x₀ = 1</b>. Saquen la derivada en el cuaderno, calculadora en <b>RAD</b>, 4 decimales. <b>Comprobar fila</b>: 2 intentos.',
    generar: (r) => { const [a, b] = elegir(r, NR.variantes); return { a, b, x0: 1 }; },
    resumen: (d) => NR.txt(d) + ', x₀ = 1',
    formulas: ['Xₙ₊₁ = Xₙ − f(Xₙ) / f\'(Xₙ)', 'Error % = |Xₙ₊₁ − Xₙ| / |Xₙ₊₁| × 100', 'd/dx sen(x) = cos(x)', 'Calculadora en RAD'],
    enunciado: (d) => `<p>Tu función: <b class="mn-func">${NR.txt(d)}</b>, con <b>x₀ = 1</b>.</p>
      <p>1) Saca <b>f'(x)</b> en tu cuaderno. 2) Llena cada fila con <b>4 decimales</b> y toca <b>Comprobar fila</b> (2 intentos; si fallas los dos, te muestra el valor y sigues).</p>`,
    figura: (d) => {
      const F = NR.f(d), D = NR.df(d);
      const T = MN.tablaNR(d);
      const raiz = T[3].x1;
      const x1 = Math.max(2, Math.ceil((Math.max(raiz, T[0].x1) + 0.3) * 2) / 2);
      const ys = [F(0), F(x1)];
      return MN.grafica({ f: F, df: D, x0: 0, x1, y0: Math.min(...ys), y1: Math.max(...ys), marcas: [0, 1, 2].filter((m) => m <= x1), tangente: d.x0 });
    },
    // valores esperados con los números del propio estudiante
    items: (d, est) => {
      const F = NR.f(d), D = NR.df(d);
      const T = MN.tablaNR(d);
      const e = est || {};
      const its = [];
      let x = d.x0;
      for (let n = 1; n <= 4; n++) {
        const ref = T[n - 1];
        const fx = F(x), dfx = D(x);
        const fE = num(e['f' + n]), dE = num(e['d' + n]), xE = num(e['x' + n]);
        const fUsa = isFinite(fE) ? fE : r4(fx);
        const dUsa = isFinite(dE) && Math.abs(dE) > 1e-9 ? dE : r4(dfx);
        const x1 = x - fUsa / dUsa;
        const xUsa = isFinite(xE) ? xE : r4(x1);
        const err = errPct(xUsa, x);
        its.push({ id: 'f' + n, fila: n, col: 0, etc: 'f(Xₙ)', et: `Fila ${n} · f(Xₙ)`, tipo: 'num', ok: fx, tolRel: 0, tolAbs: 0.0006, ref: ref.fx, xn: x });
        its.push({ id: 'd' + n, fila: n, col: 1, etc: "f'(Xₙ)", et: `Fila ${n} · f'(Xₙ)`, tipo: 'num', ok: dfx, tolRel: 0, tolAbs: 0.0006, ref: ref.dfx, xn: x });
        its.push({ id: 'x' + n, fila: n, col: 2, etc: 'Xₙ₊₁', et: `Fila ${n} · Xₙ₊₁`, tipo: 'num', ok: x1, tolRel: 0, tolAbs: 0.0006, ref: ref.x1, xn: x });
        its.push({ id: 'e' + n, fila: n, col: 3, etc: 'Error %', et: `Fila ${n} · Error %`, tipo: 'num', ok: err, tolRel: 0.003, tolAbs: 0.01, ref: ref.err, xn: x });
        x = xUsa; // la fila siguiente parte del Xₙ₊₁ que escribió el estudiante
      }
      return its;
    },
    solucion: (d) => {
      const T = MN.tablaNR(d);
      return [
        `${NR.txt(d)} → f'(x) = <b>3x² + ${d.a}·cos(x)</b>`,
        ...T.map((t) => `n = ${t.n}: Xₙ = ${d4(t.x)} · f = ${d4(t.fx)} · f' = ${d4(t.dfx)} · Xₙ₊₁ = <b>${d4(t.x1)}</b> · error = ${d4(t.err)} %`)
      ];
    }
  };

  // ---------- datos y calificación ----------
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
    let ac = 0, peso = 0;
    its.forEach((it) => {
      det[it.id] = FS.itemOk(it, e[it.id]);
      if (!det[it.id]) return;
      ac++;
      if (e._rev && e._rev[it.id]) return; // valor mostrado tras 2 intentos: no suma
      peso += e._int && Number(e._int[it.id]) === 2 ? 0.5 : 1;
    });
    const algo = its.some((it) => e[it.id] != null && e[it.id] !== '');
    let puntos;
    if (ej.participacion) puntos = algo ? 1 + (ac / its.length) * (ej.puntos - 1) : 0;
    else puntos = (ej.puntos * peso) / its.length;
    puntos = Math.round(puntos * 100) / 100;
    return { puntos, ok: ac === its.length, det, aciertos: ac, total: its.length };
  };
  FS.vacios = (ejId, d, est) => E[ejId].items(d, est).filter((it) => est == null || est[it.id] == null || est[it.id] === '').length;
  FS.mostrarValor = (it, v) => (v == null || v === '' ? '—' : it.tipo === 'op' ? it.ops[Number(v)] : String(v));
  FS.valorCorrecto = (it) => (it.tipo === 'op' ? it.ops[it.ok] : d4(it.ok));

  // ---------- la clase ----------
  FS.SESIONES['mn-raices'] = {
    id: 'mn-raices',
    materia: 'Métodos Numéricos',
    titulo: 'Repaso de raíces',
    pasos: [
      { id: 'inicio', etapa: 1, tipo: 'inicio', titulo: 'Repaso de raíces: entrenamiento para el viernes', idea: 'Escanea el QR y entra con tus datos.' },
      {
        id: 't-reglas', etapa: 1, tipo: 'teoria', titulo: 'Las reglas de hoy', idea: 'Es el mismo formato del examen del viernes.',
        puntos: [
          'Hoy es <b>entrenamiento</b> para el examen del viernes y <b>suma a prácticas</b>.',
          'Primero una tabla <b>conmigo</b> (falsa posición), después una tabla <b>tuya</b> (Newton-Raphson).',
          '<b>4 decimales en cada paso</b>, igual que en el examen.',
          'Calculadora simple, en modo <b>RAD</b>.'
        ],
        formulas: ['Tabla de los métodos cerrados:', 'n · Xa · Xb · Xr · f(Xr) · Error %', 'Tabla de Newton-Raphson:', 'n · Xₙ · f(Xₙ) · f\'(Xₙ) · Xₙ₊₁ · Error %'],
        derecha: 'Las tablas'
      },
      { id: 'r1', etapa: 1, tipo: 'rapida', titulo: 'La regla del signo', t: 'Falsa posición: f(Xa)·f(Xr) < 0. ¿Qué extremo se reemplaza por Xr?', o: ['Xb', 'Xa', 'Ninguno: ya es la raíz', 'Los dos'], c: 0, por: 'Si el producto es negativo, la raíz está entre Xa y Xr: Xr pasa a ser el nuevo Xb.' },
      { id: 'r2', etapa: 1, tipo: 'rapida', titulo: 'Bisección vs falsa posición', t: 'Bisección y falsa posición usan la misma regla del signo. ¿Qué cambia entre ellas?', o: ['Cómo se calcula Xr', 'La regla para elegir el intervalo', 'La fórmula del error', 'Nada'], c: 0, por: 'Bisección: Xr = (Xa + Xb)/2. Falsa posición: Xr es donde la recta entre (Xa, f(Xa)) y (Xb, f(Xb)) corta el eje.' },
      {
        id: 't-fp', etapa: 2, tipo: 'teoria', titulo: 'Falsa posición: f(x) = x·eˣ − 2 en [0, 1]', idea: 'La recta entre los extremos corta el eje cerca de la raíz.',
        puntos: [
          'f(0) = −2 y f(1) = 0,7183: hay cambio de signo, hay raíz en [0, 1].',
          'Xr es donde la <b>recta</b> que une (Xa, f(Xa)) y (Xb, f(Xb)) corta el eje x.',
          'Con el signo de f(Xa)·f(Xr) decides qué extremo cambia.',
          'Llenamos la tabla <b>fila por fila</b>: tú calculas en tu celular, después revelo.'
        ],
        formulas: FORM_FP
      },
      { id: 'fp1', etapa: 2, tipo: 'ejercicio', ejercicio: 'fp1' },
      { id: 'fp2', etapa: 2, tipo: 'ejercicio', ejercicio: 'fp2' },
      { id: 'fp3', etapa: 2, tipo: 'ejercicio', ejercicio: 'fp3' },
      { id: 'fp4', etapa: 2, tipo: 'ejercicio', ejercicio: 'fp4' },
      { id: 'r3', etapa: 2, tipo: 'rapida', titulo: 'Un extremo que no se mueve', t: 'En la tabla, Xb se quedó en 1 en todas las filas. ¿Por qué?', o: ['La curva no cambia de concavidad: la recta siempre corta del mismo lado de la raíz', 'Es un error de redondeo', 'Porque f(1) es positivo y siempre lo será', 'Porque la raíz está en 1'], c: 0, por: 'Aquí f es creciente y cóncava hacia arriba en todo [0, 1]: la recta queda por encima de la curva y siempre corta a la izquierda de la raíz. Xb queda fijo y la convergencia es más lenta que en Newton.' },
      {
        id: 't-nr', etapa: 3, tipo: 'teoria', titulo: 'Newton-Raphson: ahora tú solo', idea: 'La tangente en Xₙ corta el eje en Xₙ₊₁.',
        puntos: [
          'Cada uno tiene <b>su propia función</b> f(x) = x³ + a·sen(x) − b, con <b>x₀ = 1</b>.',
          'Saca <b>f\'(x)</b> en tu cuaderno: si está mal, la columna f\'(Xₙ) te lo dirá en la fila 1.',
          'Toca <b>Comprobar fila</b>: tienes 2 intentos. Si fallas los dos, te muestra el valor y sigues.',
          'Calculadora en <b>RAD</b>.'
        ],
        formulas: ['Xₙ₊₁ = Xₙ − f(Xₙ) / f\'(Xₙ)', 'Error % = |Xₙ₊₁ − Xₙ| / |Xₙ₊₁| × 100', 'Puntaje por celda:', '1.er intento: completo · 2.º: mitad · mostrado: 0']
      },
      { id: 'r4', etapa: 3, tipo: 'rapida', titulo: 'La calculadora', t: 'Tu función tiene sen(x). ¿En qué modo debe estar la calculadora?', o: ['Radianes (RAD)', 'Grados (DEG)', 'Da igual', 'Gradianes (GRA)'], c: 0, por: 'Las derivadas sen′ = cos y cos′ = −sen solo valen con el ángulo en radianes.' },
      { id: 'nr', etapa: 3, tipo: 'ejercicio', ejercicio: 'nr' },
      { id: 'cierre', etapa: 3, tipo: 'cierre', titulo: 'Cierre', idea: 'El viernes: los tres métodos, la misma tabla, 4 decimales en cada paso y la calculadora en RAD.' }
    ]
  };
})();
