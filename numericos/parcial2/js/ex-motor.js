// ============================================================
// Métodos Numéricos · Examen de raíces (16/10/2026) — funciones y calificación
// Usa el motor de la práctica (mp-motor.js: casillas, revisión, redondeo, pesos) con
// familias NUEVAS, distintas de la práctica en forma y en datos:
//   Bisección:      f(x) = x·ln(x) − a
//   Falsa posición: f(x) = eˣ − a·x²
//   Newton-Raphson: f(x) = a·e^(−x) − x       f'(x) = −a·e^(−x) − 1
// Calificación (opción B): un solo envío final; las filas no se bloquean; cada casilla se
// califica con los números del propio estudiante (el error no se arrastra):
//   ok = completo; red (error de redondeo) = mitad; mal o vacía = 0. Derivada bien = 6.
// ============================================================
(function () {
  const EX = (window.EX = window.EX || {});
  const tn = (x) => String(x).replace('.', '{,}');          // número para LaTeX: 2{,}5
  const coefT = (a) => (a === 1 ? '' : tn(a));
  const P = (x) => '(' + MP.d4(x) + ')';

  // Parcial 2 (11/11/2026): tres problemas de aplicación (uno por método), cada uno con variantes por carnet
  //   Bisección (diodo):          f(V) = (Vs − V) − 10⁻⁹·(e^(V/0,026) − 1)     en mA; R = 1 kΩ; V en [0,5; 0,8]
  //   Falsa posición (canal):     f(y) = (1/0,015)·√0,001·2y·(2y/(2 + 2y))^(2/3) − Q     y en [0,5; 2]
  //   Newton (catenaria):         f(a) = 2a·senh(50/a) − L     f'(a) = 2·senh(50/a) − (100/a)·cosh(50/a),  a₀ = 90
  EX.FAM = {
    bis: {
      tex: (p) => `${tn(p.vs)} - x - 10^{-9}\\left(e^{x/0{,}026}-1\\right)`,
      f: (p) => (x) => (p.vs - x) - 1e-9 * (Math.exp(x / 0.026) - 1),
      sus: (p, x) => `(${MP.np(p.vs)} − ${P(x)}) − 10⁻⁹·(e^(${P(x)}/0,026) − 1)`
    },
    fp: {
      tex: (p) => `\\frac{\\sqrt{0{,}001}}{0{,}015}\\cdot 2x\\left(\\frac{2x}{2+2x}\\right)^{2/3} - ${tn(p.q)}`,
      f: (p) => (x) => (1 / 0.015) * Math.sqrt(0.001) * 2 * x * Math.pow(2 * x / (2 + 2 * x), 2 / 3) - p.q,
      sus: (p, x) => `(1/0,015)·√0,001·2·${P(x)}·(2·${P(x)}/(2 + 2·${P(x)}))^(2/3) − ${MP.np(p.q)}`
    },
    nr: {
      tex: (p) => `2x\\sinh\\left(\\frac{50}{x}\\right) - ${tn(p.L)}`,
      f: (p) => (x) => 2 * x * Math.sinh(50 / x) - p.L,
      df: () => (x) => 2 * Math.sinh(50 / x) - (100 / x) * Math.cosh(50 / x),
      sus: (p, x) => `2·${P(x)}·senh(50/${P(x)}) − ${MP.np(p.L)}`,
      dsus: (p, x) => `2·senh(50/${P(x)}) − (100/${P(x)})·cosh(50/${P(x)})`,
      // la correcta primero; las otras son errores típicos (olvidar la derivada de 50/a, signo, olvidar el factor 2a)
      der: () => [`2\\sinh\\left(\\frac{50}{x}\\right) - \\frac{100}{x}\\cosh\\left(\\frac{50}{x}\\right)`, `2\\sinh\\left(\\frac{50}{x}\\right) + \\frac{100}{x}\\cosh\\left(\\frac{50}{x}\\right)`, `2\\cosh\\left(\\frac{50}{x}\\right)`, `2\\sinh\\left(\\frac{50}{x}\\right) - \\frac{50}{x}\\cosh\\left(\\frac{50}{x}\\right)`],
      porDer: () => `Derivada de \\(2x\\sinh(50/x)\\): producto de \\(2x\\) y \\(\\sinh(50/x)\\). Como \\(\\frac{d}{dx}\\sinh(u)=\\cosh(u)\\,u'\\) con \\(u=50/x\\), \\(u'=-50/x^{2}\\). Entonces \\(f'(x)=2\\sinh(50/x)+2x\\cosh(50/x)\\cdot(-50/x^{2}) = 2\\sinh(50/x)-\\frac{100}{x}\\cosh(50/x)\\).`
    }
  };

  // variantes: los datos de cada variante se revisaron (cambio de signo en el intervalo; sin empates en el 5.º decimal)
  EX.VARIANTES = {
    bis: [[{ vs: 5 }, 0.5, 0.8], [{ vs: 5.25 }, 0.5, 0.8], [{ vs: 5.5 }, 0.5, 0.8], [{ vs: 5.75 }, 0.5, 0.8], [{ vs: 6 }, 0.5, 0.8]],
    fp: [[{ q: 2.5 }, 0.5, 2], [{ q: 3 }, 0.5, 2], [{ q: 3.5 }, 0.5, 2], [{ q: 4 }, 0.5, 2]],
    nr: [[{ L: 104 }, 90], [{ L: 105 }, 90], [{ L: 106 }, 90], [{ L: 107 }, 90]]
  };
  // enunciado breve de cada problema (con los datos de la variante del estudiante)
  EX.CONTEXTO = (m, d) => {
    const tn2 = (x) => String(x).replace('.', '{,}');
    if (m === 'bis') return `Un diodo está en serie con una resistencia de \\(1\\,\\mathrm{k\\Omega}\\) y una fuente de \\(V_s = ${tn2(d.p.vs)}\\,\\mathrm{V}\\). La corriente de la resistencia, en mA, es \\((V_s - V)\\); la del diodo, en mA, es \\(10^{-9}(e^{V/0{,}026}-1)\\). Ambas son iguales: halla \\(V\\) en voltios.`;
    if (m === 'fp') return `Un canal rectangular de \\(2\\,\\mathrm{m}\\) de ancho tiene pendiente \\(S = 0{,}001\\) y coeficiente de Manning \\(n = 0{,}015\\). Transporta un caudal de \\(Q = ${tn2(d.p.q)}\\,\\mathrm{m^3/s}\\). Halla la profundidad \\(y\\) del agua en metros.`;
    return `Un cable tiene \\(${tn2(d.p.L)}\\,\\mathrm{m}\\) de longitud y está sostenido entre dos torres separadas \\(100\\,\\mathrm{m}\\). Su forma es una catenaria, \\(L = 2a\\,\\mathrm{senh}(50/a)\\). Halla el parámetro \\(a\\) en metros.`;
  };
  // dos preguntas de razonamiento por problema: convergencia y significado de la solución
  EX.RAZON = {
    bis: { c: '¿Por qué el intervalo se hace cada vez más pequeño? Explica con tus valores de \\(X_r\\) y de \\(f(X_r)\\) cómo se elige el extremo que se reemplaza.', s: '¿Qué significa el valor de \\(V\\) que encontraste para el diodo? ¿Qué corriente pasa por la resistencia en ese punto?' },
    fp: { c: '¿Por qué la falsa posición llega a la raíz con pocas iteraciones? Explica qué pasa con el extremo que se queda fijo y con \\(f(X_r)\\).', s: '¿Qué significa la profundidad que obtuviste para el canal? Si el caudal aumentara, ¿la profundidad subiría o bajaría? Justifica.' },
    nr: { c: '¿Por qué Newton-Raphson converge en pocas iteraciones? Explica con las diferencias entre \\(x_n\\) y \\(x_{n+1}\\) y con el valor de \\(f(x_n)\\).', s: '¿Qué significa el parámetro \\(a\\) que encontraste para el cable? ¿Qué relación tiene con la forma de la catenaria?' }
  };

  EX.MET = ['bis', 'fp', 'nr'];
  EX.TITULO = { bis: 'Bisección: diodo', fp: 'Falsa posición: canal', nr: 'Newton: catenaria' };
  EX.MAX = { bis: 30, fp: 35, nr: 35 };

  // datos del estudiante (compatibles con MP.celdas)
  EX.datos = (met, carnet) => {
    const lista = EX.VARIANTES[met];
    const r = MP.rng(String(carnet) + '|ex1|' + met);
    const v = lista[Math.floor(r() * lista.length)];
    const F = EX.FAM[met], p = v[0];
    const d = { met, p, f: F.f(p), sus: (x) => F.sus(p, x), tex: 'f(x) = ' + F.tex(p), rad: false };
    if (met === 'nr') {
      d.x0 = v[1];
      d.df = F.df(p);
      d.dsus = (x) => F.dsus(p, x);
      d.derCorrecta = F.der(p)[0];
      d.porDer = F.porDer(p);
      d.derOps = MP.mezclar(MP.rng(String(carnet) + '|ex1der'), F.der(p).map((t, k) => ({ t, ok: k === 0 })));
    } else {
      d.a = v[1];
      d.b = v[2];
    }
    return d;
  };

  // calificación de un método: filas = [{ vals }, …]; der = { ok } (solo Newton)
  // devuelve { pts, max, filas: [{ cel: { id: { r, exp, pts, max } } }] }
  EX.calificar = (met, d, filas, der) => {
    let prev = null, pts = 0;
    const out = [];
    for (let n = 1; n <= MP.FILAS; n++) {
      const vals = (filas && filas[n - 1] && filas[n - 1].vals) || {};
      const C = MP.celdas(d, n, prev);
      const ev = MP.evaluar(C, vals);
      const cel = {};
      const sig = {};
      C.forEach((c) => {
        if (c.tipo === 'fijo') { sig[c.id] = c.val; return; }
        const e = ev[c.id];
        const v = vals[c.id];
        const vacio = v == null || v === '';
        const r = vacio ? 'vacio' : e.r;
        const p = c.pts * (r === 'ok' ? 1 : r === 'red' ? 0.5 : 0);
        pts += p;
        cel[c.id] = { r, exp: e.exp, pts: p, max: c.pts, et: c.et };
        if (c.tipo === 'dec') sig.dec = v === 'a' || v === 'b' ? v : e.exp;
        else { const q = MP.leer(v); sig[c.id] = !q.vacio && !q.sep && !q.invalido ? q.v : e.exp; }
      });
      out.push({ cel });
      prev = sig;
    }
    if (met === 'nr' && der && der.ok) pts += MP.PTS_DER;
    return { pts: Math.round(pts * 100) / 100, max: EX.MAX[met], filas: out, der: met === 'nr' ? !!(der && der.ok) : null };
  };

  // nota del examen (sobre 100): est = { bis: { filas }, fp: { filas }, nr: { filas, der } }
  EX.nota = (carnet, est) => {
    const res = {};
    let total = 0;
    EX.MET.forEach((m) => {
      const d = EX.datos(m, carnet);
      const e = (est && est[m]) || {};
      res[m] = EX.calificar(m, d, e.filas, e.der);
      total += res[m].pts;
    });
    return { total: Math.round(total * 100) / 100, res };
  };

  // firma corta de lo que se calificó (para comparar con lo que tiene el celular)
  EX.firma = (est) => {
    const s = JSON.stringify(EX.MET.map((m) => [((est && est[m] && est[m].filas) || []).map((f) => (f && f.vals) || {}), m === 'nr' ? !!(est && est.nr && est.nr.der && est.nr.der.ok) : 0]));
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  };

  // código de verificación de 3 cifras (se ve en el celular del estudiante y en el panel)
  EX.codigo = (carnet, disp) => {
    const r = MP.rng(String(carnet) + '|' + String(disp || ''));
    return String(100 + Math.floor(r() * 900));
  };
})();
