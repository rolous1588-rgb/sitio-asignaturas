// ============================================================
// Métodos Numéricos · Examen final (sesión mn-fin) — problemas de Física 1 y calificación
// Usa el motor de la práctica (mp-motor.js: casillas, revisión, redondeo, pesos) con tres
// problemas de Física 1, uno por método (bisección, falsa posición, Newton-Raphson):
//   P1 · Bisección: distancia recorrida con arrastre lineal
//        x(t) = v_t·[t − τ(1 − e^(−t/τ))] = d          τ = m/k, v_t = m·g/k
//   P2 · Falsa posición: distancia con arrastre cuadrático
//        x(t) = (v_t²/g)·ln cosh(g·t/v_t) = d
//   P3 · Newton-Raphson: ángulo de lanzamiento con altura inicial h₀ (en radianes)
//        R(θ) = (v·cosθ/g)·(v·senθ + S) = d,   S = √(v²·sen²θ + 2·g·h₀)
// Calificación: un solo envío final; cada casilla se califica con los números del propio
// estudiante (ok = completo; red = mitad; mal o vacía = 0). Cada método vale 25 puntos
// (EX.PESO_MET): los puntos crudos del motor base se escalan a 25.
// El razonamiento (25 pts) lo califica el docente en el panel.
// Todas las soluciones se verificaron con Node (ceros únicos en cada intervalo).
// ============================================================
(function () {
  const EX = (window.EX = window.EX || {});
  const G = 9.81;
  const tn = (x) => String(x).replace('.', '{,}');          // número para LaTeX: 2{,}5
  const P = (x) => '(' + MP.d4(x) + ')';

  // funciones de la distancia (en el problema se usan con su propio carnet)
  const x1 = (vt, tau) => (t) => vt * (t - tau * (1 - Math.exp(-t / tau)));
  const x2 = (vt) => (t) => (vt * vt / G) * Math.log(Math.cosh(G * t / vt));
  const R3 = (v, h0) => (th) => { const s = Math.sin(th), c = Math.cos(th); const S = Math.sqrt(v * v * s * s + 2 * G * h0); return (v * c / G) * (v * s + S); };
  const dR3 = (v, h0) => (th) => { const s = Math.sin(th), c = Math.cos(th); const S = Math.sqrt(v * v * s * s + 2 * G * h0); return (-v * s / G) * (v * s + S) + (v * c / G) * (v * c + v * v * s * c / S); };

  EX.FAM = {
    bis: {
      // p = { vt, tau, d }
      tex: (p) => `${tn(p.vt)}\\left(x-${tn(p.tau)}\\left(1-e^{-x/${tn(p.tau)}}\\right)\\right)-${tn(p.d)}`,
      f: (p) => { const F = x1(p.vt, p.tau); return (x) => F(x) - p.d; },
      sus: (p, x) => `${tn(p.vt)}·(${P(x)} − ${tn(p.tau)}·(1 − e^(−${P(x)}/${tn(p.tau)}))) − ${tn(p.d)}`
    },
    fp: {
      // p = { vt, d }
      tex: (p) => `\\frac{${tn(p.vt)}^{2}}{9{,}81}\\ln\\cosh\\left(\\frac{9{,}81\\,x}{${tn(p.vt)}}\\right)-${tn(p.d)}`,
      f: (p) => { const F = x2(p.vt); return (x) => F(x) - p.d; },
      sus: (p, x) => `(${tn(p.vt)}²/9,81)·ln cosh(9,81·${P(x)}/${tn(p.vt)}) − ${tn(p.d)}`
    },
    nr: {
      // p = { v, h0, d }; x en radianes
      tex: (p) => `\\frac{${tn(p.v)}\\cos x}{9{,}81}\\left(${tn(p.v)}\\sin x+\\sqrt{${tn(p.v)}^{2}\\sin^{2}x+19{,}62\\,${tn(p.h0)}}\\right)-${tn(p.d)}`,
      f: (p) => { const F = R3(p.v, p.h0); return (x) => F(x) - p.d; },
      df: (p) => dR3(p.v, p.h0),
      sus: (p, x) => `(${tn(p.v)}·cos ${P(x)}/9,81)·(${tn(p.v)}·sen ${P(x)} + √(${tn(p.v)}²·sen² ${P(x)} + 19,62·${tn(p.h0)})) − ${tn(p.d)}`,
      dsus: (p, x) => `(−${tn(p.v)}·sen ${P(x)}/9,81)·(${tn(p.v)}·sen ${P(x)} + S) + (${tn(p.v)}·cos ${P(x)}/9,81)·(${tn(p.v)}·cos ${P(x)} + ${tn(p.v)}²·sen ${P(x)}·cos ${P(x)}/S),   S = √(${tn(p.v)}²·sen² ${P(x)} + 19,62·${tn(p.h0)})`,
      // la correcta primero; las otras son errores típicos (olvidar la derivada de S, cambiar un signo, olvidar un factor)
      der: (p) => {
        const S = `\\sqrt{${tn(p.v)}^{2}\\sin^{2}x+19{,}62\\,${tn(p.h0)}}`;
        return [
          `\\frac{-${tn(p.v)}\\sin x}{9{,}81}\\left(${tn(p.v)}\\sin x+${S}\\right)+\\frac{${tn(p.v)}\\cos x}{9{,}81}\\left(${tn(p.v)}\\cos x+\\frac{${tn(p.v)}^{2}\\sin x\\cos x}{${S}}\\right)`,
          `\\frac{-${tn(p.v)}\\sin x}{9{,}81}\\left(${tn(p.v)}\\sin x+${S}\\right)+\\frac{${tn(p.v)}\\cos x}{9{,}81}\\,${tn(p.v)}\\cos x`,
          `\\frac{${tn(p.v)}\\sin x}{9{,}81}\\left(${tn(p.v)}\\sin x+${S}\\right)+\\frac{${tn(p.v)}\\cos x}{9{,}81}\\left(${tn(p.v)}\\cos x+\\frac{${tn(p.v)}^{2}\\sin x\\cos x}{${S}}\\right)`,
          `\\frac{${tn(p.v)}\\cos x}{9{,}81}\\left(${tn(p.v)}\\cos x+\\frac{${tn(p.v)}^{2}\\sin x\\cos x}{${S}}\\right)`
        ];
      },
      porDer: () => `Derivada de \\(R(x)=\\frac{v\\cos x}{g}\\,(v\\sin x+S)\\), con \\(S=\\sqrt{v^2\\sin^2x+2gh_0}\\). Se aplica la regla del producto: la derivada de \\(\\frac{v\\cos x}{g}\\) es \\(-\\frac{v\\sin x}{g}\\), y la de \\((v\\sin x+S)\\) es \\(v\\cos x+S'\\), con \\(S'=\\frac{v^2\\sin x\\cos x}{S}\\).`
    }
  };

  // Variantes por carnet (cada una tiene una sola raíz en su intervalo; verificado en Node):
  //   bis: [ {vt, tau, d}, a, b ]   fp: [ {vt, d}, a, b ]   nr: [ {v, h0, d}, x₀ ]
  EX.VARIANTES = {
    bis: [[{ vt: 10, tau: 2, d: 15 }, 0, 8], [{ vt: 12, tau: 2, d: 20 }, 0, 9], [{ vt: 10, tau: 3, d: 22 }, 0, 10], [{ vt: 8, tau: 2, d: 14 }, 0, 8]],
    fp: [[{ vt: 30, d: 60 }, 0, 5], [{ vt: 32, d: 70 }, 0, 5], [{ vt: 34, d: 80 }, 0, 5], [{ vt: 36, d: 90 }, 0, 5]],
    nr: [[{ v: 20, h0: 10, d: 35 }, 0.5], [{ v: 22, h0: 8, d: 40 }, 0.5], [{ v: 25, h0: 5, d: 45 }, 0.5], [{ v: 18, h0: 12, d: 33 }, 0.5]]
  };

  // enunciado breve de cada problema (con los datos de la variante del estudiante)
  EX.CONTEXTO = (m, d) => {
    const p = d.p;
    if (m === 'bis') return `Un cuerpo cae con resistencia del aire proporcional a su velocidad. Su velocidad terminal es \\(v_t = ${tn(p.vt)}\\,\\mathrm{m/s}\\) y su tiempo característico es \\(\\tau = ${tn(p.tau)}\\,\\mathrm{s}\\). La distancia recorrida es \\(x(t)=v_t\\,[t-\\tau(1-e^{-t/\\tau})]\\). Halla el instante \\(t\\) en que el cuerpo ha recorrido \\(${tn(p.d)}\\,\\mathrm{m}\\).`;
    if (m === 'fp') return `Un paracaidista con resistencia cuadrática tiene velocidad terminal \\(v_t = ${tn(p.vt)}\\,\\mathrm{m/s}\\). La distancia recorrida es \\(x(t)=\\frac{v_t^2}{g}\\ln\\cosh\\left(\\frac{g\\,t}{v_t}\\right)\\), con \\(g = 9{,}81\\,\\mathrm{m/s^2}\\). Halla el instante \\(t\\) en que ha caído \\(${tn(p.d)}\\,\\mathrm{m}\\).`;
    return `Un proyectil sale desde una altura \\(h_0 = ${tn(p.h0)}\\,\\mathrm{m}\\) con velocidad \\(v = ${tn(p.v)}\\,\\mathrm{m/s}\\). Su alcance horizontal es \\(R(\\theta)=\\frac{v\\cos\\theta}{g}\\left(v\\sin\\theta+\\sqrt{v^2\\sin^2\\theta+2gh_0}\\right)\\), con \\(\\theta\\) en radianes. Halla el ángulo \\(\\theta\\) para que el alcance sea \\(${tn(p.d)}\\,\\mathrm{m}\\).`;
  };

  // Parte de razonamiento: tres preguntas (25 pts en total), revisadas por el docente
  EX.RAZON = [
    { pts: 8, t: 'Tu raíz del Problema 2 da un tiempo \\(t\\). ¿Qué significa físicamente ese valor? ¿Qué pasaría con la cantidad de iteraciones de falsa posición si el intervalo inicial fuera mucho más grande? Explica con tus datos.' },
    { pts: 9, t: 'En el Problema 3, ¿por qué un valor inicial cercano a un máximo de la función podría hacer divergir Newton-Raphson? Usa tu gráfica.' },
    { pts: 8, t: 'Compara bisección y falsa posición con tus resultados de los Problemas 1 y 2: ¿cuál necesitó menos iteraciones y por qué?' }
  ];
  EX.RAZON_MAX = 25;

  EX.MET = ['bis', 'fp', 'nr'];
  EX.TITULO = { bis: 'Bisección: caída con arrastre lineal', fp: 'Falsa posición: caída con arrastre cuadrático', nr: 'Newton-Raphson: ángulo de lanzamiento' };
  // puntos crudos del motor base; el examen los escala a EX.PESO_MET por método
  EX.MAX = { bis: 30, fp: 35, nr: 35 };
  EX.PESO_MET = 25;   // puntos de solución por método (3 × 25 = 75)

  // datos del estudiante (compatibles con MP.celdas)
  EX.datos = (met, carnet) => {
    const lista = EX.VARIANTES[met];
    const r = MP.rng(String(carnet) + '|fin1|' + met);
    const v = lista[Math.floor(r() * lista.length)];
    const F = EX.FAM[met];
    const p = v[0];
    const d = { met, p, f: F.f(p), sus: (x) => F.sus(p, x), tex: 'f(x) = ' + F.tex(p), rad: met === 'nr' };
    if (met === 'nr') {
      d.x0 = v[1];
      d.df = F.df(p);
      d.dsus = (x) => F.dsus(p, x);
      d.derCorrecta = F.der(p)[0];
      d.porDer = F.porDer(p);
      d.derOps = MP.mezclar(MP.rng(String(carnet) + '|findef'), F.der(p).map((t, k) => ({ t, ok: k === 0 })));
    } else {
      d.a = v[1];
      d.b = v[2];
    }
    return d;
  };

  // calificación de un método: filas = [{ vals }, …]; der = { ok } (solo Newton)
  // devuelve { pts (sobre el máximo del método, ya escalado a solución), max, filas, der }
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
    // cada método vale 25 puntos: los puntos crudos (máximo EX.MAX[met]) se escalan a 25
    const sol = Math.round(pts * EX.PESO_MET / EX.MAX[met] * 100) / 100;
    return { pts: sol, raw: Math.round(pts * 100) / 100, max: EX.PESO_MET, filas: out, der: met === 'nr' ? !!(der && der.ok) : null };
  };

  // nota del examen: solución (75) + razonamiento (25, lo pone el docente)
  // est = { bis: { filas }, fp: { filas }, nr: { filas, der } }, razon = { r: [q1, q2, q3] puntos del docente }
  EX.nota = (carnet, est, razon) => {
    const res = {};
    let sol = 0;
    EX.MET.forEach((m) => {
      const d = EX.datos(m, carnet);
      const e = (est && est[m]) || {};
      res[m] = EX.calificar(m, d, e.filas, e.der);
      sol += res[m].pts;
    });
    const rz = razon && razon.total != null ? Math.round(razon.total * 100) / 100 : 0;
    return { sol: Math.round(sol * 100) / 100, razon: rz, total: Math.round((sol + rz) * 100) / 100, res };
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
