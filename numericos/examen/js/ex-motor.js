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

  EX.FAM = {
    bis: {
      tex: (p) => `x\\ln(x) - ${tn(p.a)}`,
      f: (p) => (x) => x * Math.log(x) - p.a,
      sus: (p, x) => `${P(x)}·ln${P(x)} − ${MP.np(p.a)}`
    },
    fp: {
      tex: (p) => `e^{x} - ${tn(p.a)}x^{2}`,
      f: (p) => (x) => Math.exp(x) - p.a * x * x,
      sus: (p, x) => `e^${P(x)} − ${MP.np(p.a)}·${P(x)}²`
    },
    nr: {
      tex: (p) => `${coefT(p.a)}e^{-x} - x`,
      f: (p) => (x) => p.a * Math.exp(-x) - x,
      df: (p) => (x) => -p.a * Math.exp(-x) - 1,
      sus: (p, x) => `${MP.np(p.a)}·e^(−${MP.d4(x)}) − ${P(x)}`,
      dsus: (p, x) => `−${MP.np(p.a)}·e^(−${MP.d4(x)}) − 1`,
      // la correcta primero; las otras son errores típicos (signo de la regla de la cadena, olvidar la derivada de x, regla de la potencia)
      der: (p) => [`-${coefT(p.a)}e^{-x} - 1`, `${coefT(p.a)}e^{-x} - 1`, `-${coefT(p.a)}e^{-x}`, `-${coefT(p.a)}x\\,e^{-x-1} - 1`],
      porDer: (p) => `La derivada de \\(e^{-x}\\) es \\(-e^{-x}\\) (regla de la cadena: la derivada de \\(-x\\) es \\(-1\\)). La derivada de \\(-x\\) es \\(-1\\). Por eso \\(f'(x) = -${coefT(p.a)}e^{-x} - 1\\).`
    }
  };

  // variantes revisadas: sin empates en el 5.º decimal; en bisección Xr reemplaza a extremos distintos en las filas 1 y 2;
  // ningún f(Xr) se redondea a 0; en falsa posición hay una sola raíz en el intervalo
  EX.VARIANTES = {
    bis: [[{ a: 1 }, 1, 3], [{ a: 1.5 }, 1, 3], [{ a: 2 }, 1, 3], [{ a: 2 }, 2, 3], [{ a: 2.5 }, 2, 3], [{ a: 2.5 }, 2, 4],
      [{ a: 3 }, 2, 4], [{ a: 3.5 }, 2, 4], [{ a: 4 }, 2, 4], [{ a: 4.5 }, 3, 5], [{ a: 5 }, 3, 5], [{ a: 6 }, 3, 5]],
    fp: [[{ a: 3 }, 0, 1], [{ a: 3.5 }, 0, 1], [{ a: 4 }, 0, 1], [{ a: 4.5 }, 0, 1], [{ a: 5 }, 0, 1], [{ a: 5.5 }, 0, 1],
      [{ a: 6 }, 0, 1], [{ a: 7 }, 0, 1], [{ a: 2.5 }, 0, 2], [{ a: 3 }, 0, 2], [{ a: 4 }, 0, 2], [{ a: 5 }, 0, 2]],
    nr: [[{ a: 2 }, 0], [{ a: 3 }, 0], [{ a: 4 }, 0], [{ a: 5 }, 0], [{ a: 6 }, 0], [{ a: 8 }, 0],
      [{ a: 2 }, 2], [{ a: 3 }, 2], [{ a: 4 }, 2], [{ a: 5 }, 2], [{ a: 6 }, 2], [{ a: 8 }, 2], [{ a: 5 }, 1], [{ a: 6 }, 1], [{ a: 8 }, 1]]
  };
  EX.MET = ['bis', 'fp', 'nr'];
  EX.TITULO = { bis: 'Bisección', fp: 'Falsa posición', nr: 'Newton-Raphson' };
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
