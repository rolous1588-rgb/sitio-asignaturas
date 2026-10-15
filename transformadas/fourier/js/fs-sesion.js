// ============================================================
// Series de Fourier — contenido de la clase (4 etapas en un solo carrusel)
// Pasos: inicio · explica (diagrama) · teoria · rapida · ejercicio · cierre
// Ejercicio: { titulo, puntos, tv, porCarrera?, generar(r, carrera), enunciado(d),
//              figura?(d), items(d) → [{ id, et, tipo:'num'|'op', unidad?, ops?, ok, tolRel?, tolAbs? }],
//              solucion(d) → [html], resumen(d) }
// Cada ítem vale lo mismo (puntaje parcial).
// ============================================================
(function () {
  const FS = (window.FS = window.FS || {});
  const PI = Math.PI;
  const X = String.raw; // textos con LaTeX: X`\(\dfrac{a}{b}\)`
  const f = (x, d = 2) => FS.f(x, d);
  FS.SESIONES = FS.SESIONES || {};
  const E = (FS.EJERCICIOS = {});

  FS.CARRERAS = ['Ingeniería Electromecánica', 'Ingeniería Biomédica'];
  FS.esBio = (carrera) => /biom/i.test(String(carrera || ''));
  FS.CARNET_EJEMPLO = 'EJEMPLO';
  FS.ETAPAS = ['La idea', 'Calcular', 'Reconocer', 'Usar'];

  const entre = (r, a, b) => a + Math.floor(r() * (b - a + 1)); // entero en [a, b]
  const elegir = (r, arr) => arr[Math.floor(r() * arr.length)];
  const SI_NO = ['Sí', 'No'];

  // ---------- ejercicio 1: leer una señal periódica ----------
  E.e1 = {
    titulo: 'Lee tu señal', puntos: 4, porCarrera: true,
    tv: 'Cada uno tiene <b>su propia señal</b> según su carrera: lee el período y calcula f, ω₀ y el valor medio.',
    generar(r, carrera) {
      if (FS.esBio(carrera)) {
        const FC = elegir(r, [60, 75, 100, 120, 150]);
        return { bio: true, FC, T: 60 / FC, V0: entre(r, 10, 20) / 10, Vp: entre(r, 2, 6) / 10 };
      }
      return { bio: false, T: elegir(r, [10, 15, 20, 25, 30, 40]), V0: entre(r, 1, 5) / 2, Vp: entre(r, 2, 6) / 2 };
    },
    resumen: (d) => (d.bio ? 'oxímetro, ' + d.FC + ' lpm' : 'vibración, T = ' + d.T + ' ms'),
    enunciado: (d) => d.bio
      ? `<p>Señal de un <b>oxímetro de pulso</b> en el dedo de un paciente (en voltios). Lee en el gráfico el <b>período T</b> y calcula lo demás.</p>`
      : `<p>Señal de un <b>sensor de vibración</b> en la carcasa de un motor (en voltios). Lee en el gráfico el <b>período T</b> y calcula lo demás.</p>`,
    figura(d) {
      const sen = (u) => d.V0 + d.Vp * Math.sin(2 * PI * u);
      const ejeX = d.bio ? { T: d.T, paso: 0.1, cada: d.T >= 0.8 ? 5 : 2, unidad: 's' } : { T: d.T, paso: 5, cada: d.T > 20 ? 2 : 1, unidad: 'ms' };
      const ejeY = [d.V0 - d.Vp, d.V0 + d.Vp];
      if (d.V0 - d.Vp > 0.15) ejeY.unshift(0);
      return FS.plot({ curvas: [{ f: sen, ancho: 6 }], u0: 0, u1: 3, ymin: Math.min(0, d.V0 - d.Vp) - 0.3, ymax: d.V0 + d.Vp + 0.3, ejeX, ejeY });
    },
    items(d) {
      const Ts = d.bio ? d.T : d.T / 1000;
      return [
        { id: 'T', et: 'Período T', unidad: d.bio ? 's' : 'ms', tipo: 'num', ok: d.T },
        { id: 'f', et: 'Frecuencia f', unidad: 'Hz', tipo: 'num', ok: 1 / Ts },
        { id: 'w', et: 'Frecuencia angular ω₀', unidad: 'rad/s', tipo: 'num', ok: (2 * PI) / Ts },
        { id: 'm', et: 'Valor medio a₀', unidad: 'V', tipo: 'num', ok: d.V0, tolAbs: 0.02 }
      ];
    },
    solucion(d) {
      const Ts = d.bio ? d.T : d.T / 1000;
      return [
        `T = <b>${f(d.T, 3)} ${d.bio ? 's' : 'ms'}</b> (de un pico al siguiente)${d.bio ? ' = 60/' + d.FC + ' lpm' : ''}`,
        `f = 1/T = 1/${f(Ts, 4)} s = <b>${f(1 / Ts, 2)} Hz</b>`,
        `ω₀ = 2π/T = <b>${f((2 * PI) / Ts, 1)} rad/s</b>`,
        `a₀ = (máx + mín)/2 = (${f(d.V0 + d.Vp)} + ${f(d.V0 - d.Vp)})/2 = <b>${f(d.V0)} V</b>`
      ];
    }
  };

  // ---------- ejercicio 2: coeficientes de una onda cuadrada (integrales) ----------
  E.e2 = {
    titulo: 'Tus coeficientes', puntos: 4,
    tv: 'Cada uno tiene <b>su propia onda cuadrada</b> (otra altura y otro nivel): calcula a₀, b₁, b₂ y b₃.',
    generar: (r) => ({ A: entre(r, 2, 8), V0: elegir(r, [-3, -2, -1, 1, 2, 3]) }),
    resumen: (d) => 'A = ' + d.A + ', V₀ = ' + d.V0,
    enunciado: (d) => `<p>Tu onda vale <b>${f(d.V0 + d.A)}</b> en la primera mitad del período y <b>${f(d.V0 - d.A)}</b> en la segunda. Calcula sus coeficientes (usa las fórmulas o razona con la cuadrada del ejemplo).</p>`,
    formulas: [X`\(a_0 = \dfrac{1}{T}\displaystyle\int_0^T f\,dt\)`, X`\(b_n = \dfrac{2}{T}\displaystyle\int_0^T f\sen(n\omega_0 t)\,dt\)`, X`Cuadrada \(\pm A\): \(b_n = \dfrac{4A}{n\pi}\), \(n\) impar`, X`\(A = \dfrac{\text{alto} - \text{bajo}}{2}\), \(\;V_0 = \dfrac{\text{alto} + \text{bajo}}{2}\)`],
    figura: (d) => FS.plot({ curvas: [{ f: FS.onda('cuadrada', { A: d.A, c: d.V0 }), ancho: 6 }], u0: 0, u1: 2, ymin: Math.min(0, d.V0 - d.A) - 1, ymax: Math.max(0, d.V0 + d.A) + 1, ejeY: [d.V0 - d.A, 0, d.V0 + d.A] }),
    items: (d) => [
      { id: 'a0', et: 'a₀', tipo: 'num', ok: d.V0, tolAbs: 0.02 },
      { id: 'b1', et: 'b₁', tipo: 'num', ok: (4 * d.A) / PI },
      { id: 'b2', et: 'b₂', tipo: 'num', ok: 0, tolAbs: 0.02 },
      { id: 'b3', et: 'b₃', tipo: 'num', ok: (4 * d.A) / (3 * PI) }
    ],
    solucion: (d) => [
      `a₀ = promedio = (${f(d.V0 + d.A)} + ${f(d.V0 - d.A)})/2 = <b>${f(d.V0)}</b>`,
      `El nivel V₀ solo cambia a₀. Lo que oscila es una cuadrada de amplitud A = ${d.A}`,
      `bₙ = 4A/(nπ) para n impar y 0 para n par`,
      `b₁ = 4·${d.A}/π = <b>${f((4 * d.A) / PI, 3)}</b> · b₂ = <b>0</b> · b₃ = 4·${d.A}/(3π) = <b>${f((4 * d.A) / (3 * PI), 3)}</b>`
    ]
  };

  // ---------- ejercicio 3: simetrías sin integrar ----------
  const CASOS_SIM = [];
  ['cuadrada', 'triangular', 'diente', 'media', 'pulsos'].forEach((base) => [0, 0.25].forEach((s) => [0, 1].forEach((c) => CASOS_SIM.push({ base, s, c }))));
  E.e3 = {
    titulo: 'Reconoce sin integrar', puntos: 4,
    tv: 'Cada uno tiene <b>una onda distinta</b>: decide qué coeficientes son cero mirando su simetría, sin calcular.',
    generar(r) {
      const k = elegir(r, CASOS_SIM);
      const inv = r() < 0.3;
      const fn = FS.onda(k.base, { s: k.s, c: k.c, inv });
      const sm = FS.simetrias(FS.coef(fn, 15, 4096));
      return { ...k, inv, sm };
    },
    resumen: (d) => FS.BASE[d.base].nombre.toLowerCase() + (d.s ? ', corrida T/4' : '') + (d.c ? ', con nivel DC' : ''),
    enunciado: () => '<p>La línea vertical gruesa es <b>t = 0</b>. Responde mirando la forma: ¿es par, impar, de media onda? ¿tiene nivel DC?</p>',
    figura: (d) => FS.plot({ curvas: [{ f: FS.onda(d.base, { s: d.s, c: d.c, inv: d.inv }), ancho: 6 }], u0: -1, u1: 1, ymin: -1.5 + Math.min(0, d.c), ymax: 1.5 + d.c, ejeY: [-1, 0, 1].concat(d.c ? [2] : []), ejeCero: true }),
    items: (d) => [
      { id: 'a0', et: '¿a₀ = 0 (valor medio cero)?', tipo: 'op', ops: SI_NO, ok: d.sm.a0Cero ? 0 : 1 },
      { id: 'an', et: '¿Todos los aₙ = 0 (no hay cosenos)?', tipo: 'op', ops: SI_NO, ok: d.sm.aCero ? 0 : 1 },
      { id: 'bn', et: '¿Todos los bₙ = 0 (no hay senos)?', tipo: 'op', ops: SI_NO, ok: d.sm.bCero ? 0 : 1 },
      { id: 'imp', et: '¿Solo armónicos impares (1, 3, 5…)?', tipo: 'op', ops: SI_NO, ok: d.sm.soloImpares ? 0 : 1 }
    ],
    solucion: (d) => [
      `Valor medio: ${d.sm.a0Cero ? 'las áreas arriba y abajo se compensan → <b>a₀ = 0</b>' : 'hay más área de un lado → <b>a₀ ≠ 0</b>'}`,
      `${d.sm.bCero ? 'Es <b>par</b> (espejo respecto de t = 0) → <b>todos los bₙ = 0</b>' : d.sm.aCero ? 'Es <b>impar</b> (simétrica respecto del origen) → <b>todos los aₙ = 0</b>' : 'No es par ni impar → tiene <b>senos y cosenos</b>'}`,
      `${d.sm.soloImpares ? 'Si la corres medio período, sale invertida (sin contar el nivel DC) → <b>solo armónicos impares</b>' : 'No cumple f(t + T/2) = −f(t) → <b>también hay armónicos pares</b>'}`
    ]
  };

  // ---------- ejercicio 4: emparejar ondas y espectros ----------
  const BANCO_ESP = ['cuadrada', 'triangular', 'diente', 'media', 'completa', 'pulsos'];
  E.e4 = {
    titulo: '¿De quién es este espectro?', puntos: 4,
    tv: 'Cada uno tiene <b>4 ondas y 4 espectros</b> mezclados: une cada onda con su espectro.',
    generar(r) {
      const ondas = II.mezclar(r, BANCO_ESP).slice(0, 4);
      const orden = II.mezclar(r, [0, 1, 2, 3]); // orden[j] = onda que va en el espectro j
      const esp = {};
      orden.forEach((k, j) => { esp[k] = j; });
      return { ondas, orden, esp };
    },
    resumen: (d) => d.ondas.map((o) => FS.BASE[o].nombre.split(' ')[0].toLowerCase()).join(', '),
    enunciado: () => '<p>Arriba, 4 ondas (A a D). Abajo, 4 espectros (1 a 4): la barra verde es a₀ y las azules, c₁ … c₈. Une cada onda con su espectro.</p><p class="pista">Pistas: ¿tiene saltos (barras que bajan lento) o solo esquinas (bajan rápido)? ¿tiene valor medio? ¿armónicos pares?</p>',
    figura(d) {
      const L = ['A', 'B', 'C', 'D'];
      const ondas = d.ondas.map((o, i) => `<div class="fs-mini"><span>${L[i]}</span>${FS.plot({ curvas: [{ f: FS.onda(o), ancho: 9 }], u0: 0, u1: 2, ymin: -1.4, ymax: 1.4, ejeY: [], ejeX: false, ml: 20, w: 600, h: 300, muestras: 400 })}</div>`).join('');
      const esps = d.orden.map((k, j) => {
        const co = FS.coef(FS.onda(d.ondas[k]), 8, 2048);
        const vals = [{ v: Math.abs(co.a0), et: 0, color: FS.COL.verde }];
        for (let n = 1; n <= 8; n++) vals.push({ v: co.c[n], et: n, color: FS.COL.azul });
        return `<div class="fs-mini"><span>${j + 1}</span>${FS.barras({ vals, w: 600, h: 300, max: 1.35 })}</div>`;
      }).join('');
      return `<div class="fs-grid4">${ondas}</div><div class="fs-grid4">${esps}</div>`;
    },
    items: (d) => ['A', 'B', 'C', 'D'].map((l, i) => ({ id: l, et: 'Onda ' + l + ' → espectro', tipo: 'op', ops: ['1', '2', '3', '4'], ok: d.esp[i] })),
    solucion: (d) => ['A', 'B', 'C', 'D'].map((l, i) => {
      const o = d.ondas[i];
      const por = { cuadrada: 'saltos → bajan como 1/n, solo impares', triangular: 'solo esquinas → bajan muy rápido (1/n²)', diente: 'un salto por período → todos los armónicos, 1/n', media: 'valor medio y c₁ grande, armónicos pares', completa: 'valor medio grande y solo armónicos pares', pulsos: 'valor medio ¼ y faltan los múltiplos de 4' }[o];
      return `Onda ${l} (${FS.BASE[o].nombre.toLowerCase()}) → <b>espectro ${d.esp[i] + 1}</b>: ${por}`;
    })
  };

  // ---------- ejercicio 5: serie de tabla (triangular) sin integrar ----------
  E.e5 = {
    titulo: 'Tu serie sin integrar', puntos: 4,
    tv: 'Cada uno tiene <b>su propia triangular</b> (altura, nivel y período): escribe su serie a partir de la tabla.',
    generar: (r) => ({ A: entre(r, 1, 5), V0: elegir(r, [-2, -1, 1, 2]), T: elegir(r, [2, 4, 5, 8, 10]) }),
    resumen: (d) => 'A = ' + d.A + ', V₀ = ' + d.V0 + ', T = ' + d.T + ' ms',
    enunciado: (d) => `<p>Triangular <b>par</b> (pico en t = 0) que sube hasta <b>${f(d.V0 + d.A)}</b> y baja hasta <b>${f(d.V0 - d.A)}</b>, con período <b>T = ${d.T} ms</b>. Usa la serie de la tabla, sin integrar.</p>`,
    formulas: ['Triangular ±1 (par):', '(8/π²)·[cos ω₀t + cos 3ω₀t/9 + cos 5ω₀t/25 + …]', 'Amplitud ×A → coeficientes ×A', 'Sumar V₀ → solo cambia a₀'],
    figura: (d) => FS.plot({ curvas: [{ f: FS.onda('triangular', { A: d.A, c: d.V0 }), ancho: 6 }], u0: -1, u1: 1, ymin: Math.min(0, d.V0 - d.A) - 0.6, ymax: Math.max(0, d.V0 + d.A) + 0.6, ejeY: [d.V0 - d.A, 0, d.V0 + d.A], ejeCero: true, ejeX: { T: d.T, paso: d.T / 2, unidad: 'ms' } }),
    items: (d) => [
      { id: 'w', et: 'ω₀', unidad: 'rad/s', tipo: 'num', ok: (2 * PI) / (d.T / 1000) },
      { id: 'a0', et: 'a₀', tipo: 'num', ok: d.V0, tolAbs: 0.02 },
      { id: 'a1', et: 'a₁', tipo: 'num', ok: (8 * d.A) / (PI * PI) },
      { id: 'a3', et: 'a₃', tipo: 'num', ok: (8 * d.A) / (9 * PI * PI) }
    ],
    solucion: (d) => [
      `ω₀ = 2π/T = 2π/${f(d.T / 1000, 3)} = <b>${f((2 * PI) / (d.T / 1000), 1)} rad/s</b>`,
      `a₀ = V₀ = <b>${f(d.V0)}</b> (el nivel no cambia los demás coeficientes)`,
      `a₁ = 8A/π² = 8·${d.A}/π² = <b>${f((8 * d.A) / (PI * PI), 3)}</b>`,
      `a₃ = 8A/(9π²) = <b>${f((8 * d.A) / (9 * PI * PI), 3)}</b> · todos los bₙ = 0 (es par)`
    ]
  };

  // ---------- ejercicio 6: potencia por armónico (Parseval), por carrera ----------
  E.e6 = {
    titulo: 'Potencia por armónico', puntos: 4, porCarrera: true,
    tv: 'Problema de tu carrera: <b>Electromecánica</b>, corriente de una carga no lineal; <b>Biomédica</b>, señal del oxímetro. Usa Parseval.',
    generar(r, carrera) {
      if (FS.esBio(carrera)) return { bio: true, FC: elegir(r, [60, 72, 75, 90, 100, 120]), V0: elegir(r, [1, 1.2, 1.4, 1.6, 1.8]), c1: elegir(r, [0.2, 0.25, 0.3, 0.35, 0.4]), c2: elegir(r, [0.05, 0.1, 0.15]) };
      return { bio: false, I1: entre(r, 8, 12), I3: entre(r, 2, 6), I5: entre(r, 1, 3) };
    },
    resumen: (d) => (d.bio ? 'oxímetro, ' + d.FC + ' lpm' : 'I₁ = ' + d.I1 + ', I₃ = ' + d.I3 + ', I₅ = ' + d.I5 + ' A'),
    enunciado: (d) => d.bio
      ? `<p>Un oxímetro mide v(t) = ${f(d.V0)} + ${f(d.c1)}·sen(ω₀t) + ${f(d.c2)}·sen(2ω₀t) V, con una frecuencia cardíaca de <b>${d.FC} latidos por minuto</b>. Su filtro deja pasar hasta <b>5 Hz</b>.</p>`
      : `<p>La corriente de una oficina llena de cargadores y luminarias LED (red de 50 Hz) tiene amplitudes <b>I₁ = ${d.I1} A</b>, <b>I₃ = ${d.I3} A</b> e <b>I₅ = ${d.I5} A</b>.</p>`,
    formulas: ['(Valor eficaz)² = a₀² + ½·Σ cₙ²', 'THD = √(I₃² + I₅² + …) / I₁'],
    figura(d) {
      if (d.bio) return FS.plot({ curvas: [{ f: (u) => d.V0 + d.c1 * Math.sin(2 * PI * u) + d.c2 * Math.sin(4 * PI * u), ancho: 6 }], u0: 0, u1: 2, ymin: 0, ymax: d.V0 + 0.7, ejeY: [0, d.V0], ejeX: { T: 60 / d.FC, paso: 0.25, cada: 2, unidad: 's' } });
      return FS.plot({ curvas: [{ f: (u) => d.I1 * Math.sin(2 * PI * u) - d.I3 * Math.sin(6 * PI * u) + d.I5 * Math.sin(10 * PI * u), ancho: 6 }], u0: 0, u1: 2, ymin: -22, ymax: 22, ejeY: [-20, -10, 0, 10, 20], ejeX: { T: 20, paso: 5, cada: 2, unidad: 'ms' } });
    },
    items(d) {
      if (d.bio) {
        const f1 = d.FC / 60;
        return [
          { id: 'f1', et: 'Frecuencia fundamental f₁', unidad: 'Hz', tipo: 'num', ok: f1 },
          { id: 'vef', et: 'Valor eficaz de v(t)', unidad: 'V', tipo: 'num', ok: Math.sqrt(d.V0 * d.V0 + (d.c1 * d.c1 + d.c2 * d.c2) / 2) },
          { id: 'pf', et: '% de la potencia alterna en la fundamental', unidad: '%', tipo: 'num', ok: (100 * d.c1 * d.c1) / (d.c1 * d.c1 + d.c2 * d.c2) },
          { id: 'nmax', et: 'Último armónico que pasa el filtro de 5 Hz (n)', tipo: 'num', ok: Math.floor(5 / f1 + 1e-9), tolAbs: 0 }
        ];
      }
      const S = d.I1 * d.I1 + d.I3 * d.I3 + d.I5 * d.I5;
      return [
        { id: 'ief', et: 'Corriente eficaz', unidad: 'A', tipo: 'num', ok: Math.sqrt(S / 2) },
        { id: 'thd', et: 'THD', unidad: '%', tipo: 'num', ok: (100 * Math.sqrt(d.I3 * d.I3 + d.I5 * d.I5)) / d.I1 },
        { id: 'pf', et: '% de la potencia en la fundamental', unidad: '%', tipo: 'num', ok: (100 * d.I1 * d.I1) / S },
        { id: 'neu', et: 'En un sistema trifásico, ¿qué armónico se suma en el neutro?', tipo: 'op', ops: ['El 3.º', 'El 5.º', 'El fundamental', 'Ninguno'], ok: 0 }
      ];
    },
    solucion(d) {
      if (d.bio) {
        const f1 = d.FC / 60;
        return [
          `f₁ = ${d.FC}/60 = <b>${f(f1, 3)} Hz</b>`,
          `V_ef = √(${f(d.V0)}² + ½·(${f(d.c1)}² + ${f(d.c2)}²)) = <b>${f(Math.sqrt(d.V0 * d.V0 + (d.c1 * d.c1 + d.c2 * d.c2) / 2), 3)} V</b> (casi todo es el nivel DC)`,
          `% fundamental = ${f(d.c1)}²/(${f(d.c1)}² + ${f(d.c2)}²) = <b>${f((100 * d.c1 * d.c1) / (d.c1 * d.c1 + d.c2 * d.c2), 1)} %</b>`,
          `Pasan los armónicos con n·${f(f1, 2)} ≤ 5 Hz → hasta <b>n = ${Math.floor(5 / f1 + 1e-9)}</b>`
        ];
      }
      const S = d.I1 * d.I1 + d.I3 * d.I3 + d.I5 * d.I5;
      return [
        `I_ef = √(½·(${d.I1}² + ${d.I3}² + ${d.I5}²)) = √(${f(S / 2, 1)}) = <b>${f(Math.sqrt(S / 2), 2)} A</b>`,
        `THD = √(${d.I3}² + ${d.I5}²)/${d.I1} = <b>${f((100 * Math.sqrt(d.I3 * d.I3 + d.I5 * d.I5)) / d.I1, 1)} %</b>`,
        `% fundamental = ${d.I1}²/${S} = <b>${f((100 * d.I1 * d.I1) / S, 1)} %</b>`,
        'Los <b>3.º</b> armónicos de las tres fases están en fase entre sí: en el neutro se suman en vez de cancelarse'
      ];
    }
  };

  // ---------- ejercicio 7: una cuadrada entra a un filtro RC ----------
  E.e7 = {
    titulo: 'La cuadrada pasa por un filtro', puntos: 3,
    tv: 'Cada uno tiene <b>su propio filtro RC</b>: calcula cuánto deja pasar de cada armónico.',
    generar: (r) => ({ A: entre(r, 1, 5), k: entre(r, 1, 5) }),
    resumen: (d) => 'A = ' + d.A + ', f_c = ' + d.k + '·f₀',
    enunciado: (d) => `<p>Una cuadrada de amplitud <b>A = ${d.A} V</b> y frecuencia f₀ entra a un filtro RC pasa-bajos con <b>f_c = ${d.k}·f₀</b>. Recuerda: H(jω) = 1/(1 + jω/ω_c).</p>`,
    formulas: ['|H(jnω₀)| = 1/√(1 + (n·f₀/f_c)²)', 'Cuadrada: cₙ = 4A/(nπ), n impar', 'Salida: cₙ·|H(jnω₀)|'],
    items: (d) => [
      { id: 'h1', et: '|H(jω₀)|', tipo: 'num', ok: 1 / Math.sqrt(1 + 1 / (d.k * d.k)) },
      { id: 'h3', et: '|H(j3ω₀)|', tipo: 'num', ok: 1 / Math.sqrt(1 + 9 / (d.k * d.k)) },
      { id: 'c3', et: 'Amplitud del 3.er armónico a la salida', unidad: 'V', tipo: 'num', ok: ((4 * d.A) / (3 * PI)) / Math.sqrt(1 + 9 / (d.k * d.k)) }
    ],
    solucion: (d) => [
      `|H(jω₀)| = 1/√(1 + (1/${d.k})²) = <b>${f(1 / Math.sqrt(1 + 1 / (d.k * d.k)), 3)}</b>`,
      `|H(j3ω₀)| = 1/√(1 + (3/${d.k})²) = <b>${f(1 / Math.sqrt(1 + 9 / (d.k * d.k)), 3)}</b>`,
      `c₃ entra = 4·${d.A}/(3π) = ${f((4 * d.A) / (3 * PI), 3)} → sale <b>${f(((4 * d.A) / (3 * PI)) / Math.sqrt(1 + 9 / (d.k * d.k)), 3)} V</b>`
    ]
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
    const its = ej.items(d);
    const det = {};
    let ac = 0;
    its.forEach((it) => { det[it.id] = FS.itemOk(it, est && est[it.id]); if (det[it.id]) ac++; });
    const puntos = Math.round(((ej.puntos * ac) / its.length) * 10) / 10;
    return { puntos, ok: ac === its.length, det, aciertos: ac, total: its.length };
  };
  FS.vacios = (ejId, d, est) => E[ejId].items(d).filter((it) => est == null || est[it.id] == null || est[it.id] === '').length;
  FS.mostrarValor = (it, v) => (v == null || v === '' ? '—' : it.tipo === 'op' ? it.ops[Number(v)] : String(v));
  FS.valorCorrecto = (it) => (it.tipo === 'op' ? it.ops[it.ok] : FS.f(it.ok, 3));

  // ---------- la clase ----------
  FS.SESIONES['tf-fourier'] = {
    id: 'tf-fourier',
    materia: 'Transformadas y Funciones Especiales',
    titulo: 'Series de Fourier',
    pasos: [
      // ===== Etapa 1: la idea =====
      { id: 'inicio', etapa: 1, tipo: 'inicio', titulo: 'Series de Fourier', idea: 'Escanea el QR y entra con tus datos.' },
      { id: 'per', etapa: 1, tipo: 'explica', titulo: 'Señales que se repiten', idea: 'Una señal periódica se repite cada T: f(t + T) = f(t).', modo: 'periodica', params: { senal: 'red' } },
      { id: 'r1', etapa: 1, tipo: 'rapida', titulo: 'Período de la red', t: 'La tensión de la red en Bolivia se repite 50 veces por segundo. ¿Cuánto vale su período T?', o: ['20 ms', '50 ms', '2 ms', '0,5 s'], c: 0, por: 'T = 1/f = 1/50 s = 0,02 s = 20 ms.' },
      {
        id: 't-per', etapa: 1, tipo: 'teoria', titulo: 'Período, frecuencia y valor medio', idea: 'Tres números que se leen en el gráfico.',
        puntos: ['<b>Período T</b>: lo que dura un ciclo; se mide de un pico al siguiente.', '<b>Frecuencia</b>: cuántos ciclos por segundo.', '<b>Valor medio</b>: el nivel alrededor del cual oscila (lo que marcaría un voltímetro en DC).', 'Ejemplos: la red (20 ms), un latido a 75 lpm (0,8 s), un motor que vibra.'],
        formulas: ['f = 1/T  (Hz)', 'ω₀ = 2π/T = 2πf  (rad/s)', 'a₀ = (1/T)·∫ f(t) dt', 'En un seno con nivel:', 'a₀ = (máx + mín)/2']
      },
      { id: 'e1', etapa: 1, tipo: 'ejercicio', ejercicio: 'e1' },
      { id: 'r2', etapa: 1, tipo: 'rapida', titulo: 'Predicción: la fase', t: 'En A·sen(ω₀t + φ) cambio solo la fase φ. ¿Qué le pasa a la onda?', o: ['Se corre en el tiempo', 'Se hace más alta', 'Se repite más rápido', 'Cambia su valor medio'], c: 0, por: 'La fase solo corre la onda en el tiempo: la amplitud y la frecuencia no cambian.' },
      { id: 'seno', etapa: 1, tipo: 'explica', titulo: 'La sinusoide: el ladrillo', idea: 'A·sen(nω₀t + φ): amplitud, frecuencia y fase.', modo: 'seno', params: { A: 1, n: 1, fi: 0 } },
      { id: 'r3', etapa: 1, tipo: 'rapida', titulo: 'Predicción: la suma', t: 'Sumo sen(ω₀t) + sen(3ω₀t), con T = 20 ms. ¿Cada cuánto se repite la suma?', o: ['Cada 20 ms', 'Cada 6,7 ms', 'Cada 60 ms', 'No se repite'], c: 0, por: 'El 3.er armónico completa 3 ciclos en 20 ms: la suma se repite con el período de la fundamental.' },
      { id: 'suma', etapa: 1, tipo: 'explica', titulo: 'Armónicos: múltiplos de la fundamental', idea: 'Al sumar f₀, 2f₀, 3f₀… la suma se repite cada T.', modo: 'suma', params: { b1: 1, b2: 0, b3: 0.5 } },
      { id: 'r4', etapa: 1, tipo: 'rapida', titulo: 'Predicción: la idea de Fourier', t: '¿Se puede armar una onda cuadrada, con esquinas, sumando solo senos suaves?', o: ['Sí: con más armónicos se parece cada vez más', 'No: los senos son suaves', 'Sí: con dos armónicos queda exacta', 'Solo si la cuadrada es par'], c: 0, por: 'Cada armónico agrega detalle: con más términos la suma se acerca a la cuadrada.' },
      { id: 'sint', etapa: 1, tipo: 'explica', titulo: 'La idea de Fourier', idea: 'Casi toda señal periódica es una receta: cuánto de cada armónico.', modo: 'sintesis', params: { onda: 'cuadrada', N: 1 } },

      // ===== Etapa 2: calcular =====
      // Fórmulas en LaTeX (X`...` = String.raw): \( … \) en línea; las dibuja js/fs-tex.js con KaTeX.
      {
        id: 'rep2', etapa: 2, tipo: 'teoria', titulo: 'Antes de calcular: lo que costó el lunes', idea: 'Cuatro cuidados que evitan la mayoría de los errores.',
        puntos: [
          X`<b>T en segundos</b> antes de calcular \(\omega_0\): \(20\ \text{ms} = 0{,}020\ \text{s}\).`,
          X`<b>Valor medio</b> de un seno con nivel: el centro entre el máximo y el mínimo.`,
          X`<b>No redondees</b> hasta el final: \(1/0{,}6 = 1{,}667\ \text{Hz}\), no \(1{,}6\).`,
          X`La <b>fase</b> solo corre la onda en el tiempo: no cambia su altura, su período ni su valor medio.`
        ],
        derecha: 'Ejemplo',
        formulas: [
          X`\(\omega_0 = \dfrac{2\pi}{T} = \dfrac{2\pi}{0{,}020\ \text{s}} = 314\ \text{rad/s}\)`,
          X`\(a_0 = \dfrac{\text{máx} + \text{mín}}{2}\)`
        ]
      },
      { id: 'r5', etapa: 2, tipo: 'rapida', titulo: 'Predicción: el promedio', t: X`Multiplico \(\sen(\omega_0 t)\cdot\sen(2\omega_0 t)\) y promedio en un período. ¿Qué da?`, o: ['0', '0,5', '1', 'Depende de T'], c: 0, por: 'Las áreas positivas y negativas se cancelan: armónicos distintos son ortogonales.' },
      { id: 'orto', etapa: 2, tipo: 'explica', titulo: 'Cómo se encuentra cada ingrediente', idea: 'Multiplica por un seno y promedia: distintos dan 0; el mismo da ½.', modo: 'ortogonal', params: { m: 1, n: 2, tipo: 'sen' } },
      {
        id: 't-form', etapa: 2, tipo: 'teoria', titulo: 'Las fórmulas de Fourier', idea: 'Cada coeficiente mide cuánto se parece la señal a un armónico.',
        puntos: [
          X`\(a_0\) es el <b>promedio</b> de la señal.`,
          X`\(a_n\): cuánto se parece a \(\cos(n\omega_0 t)\).`,
          X`\(b_n\): cuánto se parece a \(\sen(n\omega_0 t)\).`,
          X`El \(2\) delante compensa que el promedio de \(\sen^2\) es \(\tfrac{1}{2}\).`,
          'Las integrales se hacen sobre <b>un período</b> cualquiera.'
        ],
        formulas: [
          X`\(f(t) = a_0 + \sum_{n=1}^{\infty}\big[a_n\cos(n\omega_0 t)\)`,
          X`\(\qquad\quad + \; b_n\sen(n\omega_0 t)\big]\)`,
          X`\(a_0 = \dfrac{1}{T}\displaystyle\int_0^T f(t)\,dt\)`,
          X`\(a_n = \dfrac{2}{T}\displaystyle\int_0^T f(t)\cos(n\omega_0 t)\,dt\)`,
          X`\(b_n = \dfrac{2}{T}\displaystyle\int_0^T f(t)\sen(n\omega_0 t)\,dt\)`
        ]
      },
      // --- Resolvamos juntos: la cuadrada ±A, un paso por pregunta (pedido del docente 15/10) ---
      {
        id: 'j0', etapa: 2, tipo: 'teoria', titulo: 'Resolvamos juntos: la onda cuadrada', idea: 'Tú decides cada paso desde tu celular.',
        puntos: [
          X`La señal vale \(A\) en la primera mitad del período y \(-A\) en la segunda.`,
          X`Buscamos su receta: \(a_0\), \(a_n\) y \(b_n\).`,
          'En cada paso eliges el movimiento siguiente. Las opciones incorrectas son los errores más comunes: <b>piensa antes de tocar</b>.',
          'Ten a mano papel y lápiz.'
        ],
        derecha: 'La señal',
        formulas: [
          X`\(f(t) = \begin{cases} \;\;A, & 0 \lt t \lt T/2 \\ -A, & T/2 \lt t \lt T \end{cases}\)`,
          X`\(\omega_0 = \dfrac{2\pi}{T}\)`
        ]
      },
      { id: 'rj1', etapa: 2, tipo: 'rapida', titulo: 'Paso 1 · El promedio a₀', t: X`Empecemos por lo fácil: \(a_0 = \dfrac{1}{T}\displaystyle\int_0^T f(t)\,dt\) es el promedio. ¿Cuánto vale?`, o: [X`\(A\)`, X`\(\dfrac{A}{2}\)`, X`\(0\)`, X`\(2A\)`], c: 2, por: X`Área \(+A\cdot\tfrac{T}{2}\) arriba y \(-A\cdot\tfrac{T}{2}\) abajo: se cancelan. \(a_0 = \tfrac{1}{T}\big[A\tfrac{T}{2} - A\tfrac{T}{2}\big] = 0\).` },
      { id: 'rj2', etapa: 2, tipo: 'rapida', una: true, titulo: 'Paso 2 · Partir la integral', t: X`Con \(s = \sen(n\omega_0 t)\), ¿qué va dentro de \(b_n = \tfrac{2}{T}\,[\;\cdots\;]\)?`, o: [X`\(\int_0^{T} A\,s\,dt\)`, X`\(\int_0^{T/2} A\,s\,dt\)`, X`\(\int_0^{T/2} A\,s\,dt + \int_{T/2}^{T} A\,s\,dt\)`, X`\(\int_0^{T/2} A\,s\,dt + \int_{T/2}^{T} (-A)\,s\,dt\)`], c: 3, por: X`Donde la señal cambia, la integral se parte: de \(0\) a \(T/2\) vale \(A\); de \(T/2\) a \(T\) vale \(-A\).` },
      { id: 'rj3', etapa: 2, tipo: 'rapida', pi: true, titulo: 'Paso 3 · La primitiva (1.er voto)', t: X`Necesitamos \(\displaystyle\int \sen(n\omega_0 t)\,dt\). ¿Cuánto vale?`, o: [X`\(\dfrac{\cos(n\omega_0 t)}{n\omega_0}\)`, X`\(-\dfrac{\cos(n\omega_0 t)}{n\omega_0}\)`, X`\(-n\omega_0\cos(n\omega_0 t)\)`, X`\(-\cos(n\omega_0 t)\)`], c: 1 },
      { id: 'rj3b', etapa: 2, tipo: 'rapida', titulo: 'Paso 3 · La primitiva (vuelve a votar)', t: X`Después de discutir con tu vecino: \(\displaystyle\int \sen(n\omega_0 t)\,dt = \;?\)`, o: [X`\(-n\omega_0\cos(n\omega_0 t)\)`, X`\(\dfrac{\cos(n\omega_0 t)}{n\omega_0}\)`, X`\(-\cos(n\omega_0 t)\)`, X`\(-\dfrac{\cos(n\omega_0 t)}{n\omega_0}\)`], c: 3, por: X`Compruébalo derivando: \(\tfrac{d}{dt}\Big[-\tfrac{\cos(n\omega_0 t)}{n\omega_0}\Big] = \sen(n\omega_0 t)\). El signo menos y el \(n\omega_0\) abajo son los dos olvidos más comunes.` },
      { id: 'rj4', etapa: 2, tipo: 'rapida', titulo: 'Paso 4 · El dato clave', t: X`Al evaluar en \(t = T/2\) aparece \(n\omega_0\cdot\dfrac{T}{2}\). Con \(\omega_0 = \dfrac{2\pi}{T}\), ¿cuánto vale?`, o: [X`\(2n\pi\)`, X`\(\dfrac{n\pi}{2}\)`, X`\(\pi\)`, X`\(n\pi\)`], c: 3, por: X`\(\tfrac{2\pi}{T}\cdot n\cdot\tfrac{T}{2} = n\pi\). Y en \(t = T\): \(n\omega_0 T = 2n\pi\). La \(T\) desaparece: por eso conviene usar \(\omega_0 T = 2\pi\).` },
      { id: 'rj5', etapa: 2, tipo: 'rapida', titulo: 'Paso 5 · El coseno de nπ', t: X`¿Cuánto vale \(\cos(n\pi)\) cuando \(n\) es entero?`, o: [X`\(1\)`, X`\((-1)^n\)`, X`\(0\)`, X`\(-1\)`], c: 1, por: X`\(n=1\): \(-1\) · \(n=2\): \(+1\) · \(n=3\): \(-1\)… Va alternando: \(\cos(n\pi) = (-1)^n\). Además \(\sen(n\pi) = 0\) y \(\cos(2n\pi) = 1\).` },
      { id: 'rj6', etapa: 2, tipo: 'rapida', titulo: 'Paso 6 · ¿Y los aₙ?', t: X`\(\int\cos(n\omega_0 t)\,dt = \tfrac{\sen(n\omega_0 t)}{n\omega_0}\). Evaluado en \(0\), \(T/2\) y \(T\), ¿cuánto vale \(a_n\)?`, o: [X`\(\dfrac{2A}{n\pi}\)`, X`\(A\)`, 'Depende de n', X`\(0\)`], c: 3, por: X`Solo aparecen \(\sen 0\), \(\sen(n\pi)\) y \(\sen(2n\pi)\), y todos valen \(0\). Por eso \(a_n = 0\): esta señal no tiene cosenos.` },
      { id: 'rj7', etapa: 2, tipo: 'rapida', titulo: 'Paso 7 · La primera mitad', t: X`\(\int_0^{T/2} A\sen(n\omega_0 t)\,dt = -\dfrac{A}{n\omega_0}\Big[\cos(n\omega_0 t)\Big]_0^{T/2} = \;?\)`, o: [X`\(\dfrac{A}{n\omega_0}(\cos n\pi - 1)\)`, X`\(0\)`, X`\(\dfrac{A}{n\omega_0}(1-\cos n\pi)\)`, X`\(\dfrac{A}{n\omega_0}(1+\cos n\pi)\)`], c: 2, por: X`\(-\tfrac{A}{n\omega_0}\big[\cos(n\pi) - \cos 0\big] = \tfrac{A}{n\omega_0}(1-\cos n\pi)\). El menos de la primitiva da vuelta el paréntesis.` },
      { id: 'rj8', etapa: 2, tipo: 'rapida', titulo: 'Paso 8 · La segunda mitad', t: X`\(\int_{T/2}^{T} (-A)\sen(n\omega_0 t)\,dt = \dfrac{A}{n\omega_0}\Big[\cos(n\omega_0 t)\Big]_{T/2}^{T} = \;?\)`, o: [X`\(-\dfrac{A}{n\omega_0}(1-\cos n\pi)\)`, X`\(\dfrac{A}{n\omega_0}(1-\cos n\pi)\)`, X`\(0\)`, X`\(\dfrac{2A}{n\omega_0}\)`], c: 1, por: X`\(\tfrac{A}{n\omega_0}\big[\cos(2n\pi) - \cos(n\pi)\big] = \tfrac{A}{n\omega_0}(1-\cos n\pi)\): igual que la primera. La señal y el seno cambian de signo juntos, así que las dos mitades suman.` },
      { id: 'rj9', etapa: 2, tipo: 'rapida', pi: true, titulo: 'Paso 9 · Juntar (1.er voto)', t: X`Sumamos las dos mitades: \(b_n = \dfrac{2}{T}\cdot\dfrac{2A}{n\omega_0}(1-\cos n\pi)\). Usa \(\omega_0 T = 2\pi\). ¿Qué queda?`, o: [X`\(\dfrac{4A}{n\pi}(1-\cos n\pi)\)`, X`\(\dfrac{2A}{\pi}(1-\cos n\pi)\)`, X`\(\dfrac{A}{n\pi}(1-\cos n\pi)\)`, X`\(\dfrac{2A}{n\pi}(1-\cos n\pi)\)`], c: 3 },
      { id: 'rj9b', etapa: 2, tipo: 'rapida', titulo: 'Paso 9 · Juntar (vuelve a votar)', t: X`Después de discutir: \(b_n = \dfrac{2}{T}\cdot\dfrac{2A}{n\omega_0}(1-\cos n\pi) = \;?\)`, o: [X`\(\dfrac{2A}{n\pi}(1-\cos n\pi)\)`, X`\(\dfrac{A}{n\pi}(1-\cos n\pi)\)`, X`\(\dfrac{4A}{n\pi}(1-\cos n\pi)\)`, X`\(\dfrac{2A}{\pi}(1-\cos n\pi)\)`], c: 0, por: X`\(\tfrac{4A}{n\,\omega_0 T} = \tfrac{4A}{2\pi n} = \tfrac{2A}{n\pi}\). Entonces \(b_n = \tfrac{2A}{n\pi}\big(1-(-1)^n\big)\).` },
      { id: 'rj10', etapa: 2, tipo: 'rapida', titulo: 'Paso 10 · Los armónicos pares', t: X`Con \(b_n = \dfrac{2A}{n\pi}\big(1-(-1)^n\big)\), ¿cuánto vale \(b_n\) cuando \(n\) es par?`, o: [X`\(\dfrac{4A}{n\pi}\)`, X`\(0\)`, X`\(\dfrac{2A}{n\pi}\)`, X`\(-\dfrac{4A}{n\pi}\)`], c: 1, por: X`\(n\) par: \(1-(+1) = 0\), así que \(b_n = 0\). \(n\) impar: \(1-(-1) = 2\), así que \(b_n = \tfrac{4A}{n\pi}\). La cuadrada solo tiene armónicos impares.` },
      { id: 'rj11', etapa: 2, tipo: 'rapida', titulo: 'Paso 11 · Un número', t: X`Con \(A = 1\), ¿cuánto vale \(b_3\)?`, o: [X`\(1{,}273\)`, X`\(0\)`, X`\(0{,}212\)`, X`\(0{,}424\)`], c: 3, por: X`\(b_3 = \tfrac{4\cdot 1}{3\pi} = 0{,}424\). Es un tercio de \(b_1 = \tfrac{4}{\pi} = 1{,}273\).` },
      {
        id: 't-cuad', etapa: 2, tipo: 'teoria', titulo: 'Resultado: la receta de la cuadrada', idea: 'Lo que acabamos de deducir entre todos.',
        puntos: [
          X`\(a_0 = 0\) y \(a_n = 0\): las mitades se compensan y solo quedan senos.`,
          X`\(b_n = \tfrac{4A}{n\pi}\) si \(n\) es impar; \(0\) si es par.`,
          '<b>Electromecánica:</b> un inversor de onda cuadrada da un 3.er armónico del 33 % y un 5.º del 20 %, que calientan los motores.',
          '<b>Biomédica:</b> los estimuladores (TENS) usan pulsos rectangulares: estos coeficientes dicen qué frecuencias llegan al tejido.'
        ],
        derecha: 'Resultado',
        formulas: [
          X`\(f(t) = \dfrac{4A}{\pi}\Big[\sen\omega_0 t\)`,
          X`\(\qquad + \dfrac{\sen 3\omega_0 t}{3} + \dfrac{\sen 5\omega_0 t}{5} + \cdots\Big]\)`,
          X`\(b_1 = \dfrac{4A}{\pi} \approx 1{,}27\,A\)`,
          X`\(b_3 = \dfrac{4A}{3\pi} \approx 0{,}42\,A\)`
        ]
      },
      { id: 'e2', etapa: 2, tipo: 'ejercicio', ejercicio: 'e2' },
      { id: 'r6', etapa: 2, tipo: 'rapida', titulo: 'Predicción: simetría', t: 'Una onda es par: f(−t) = f(t). ¿Qué coeficientes son cero?', o: ['Todos los bₙ (senos)', 'Todos los aₙ (cosenos)', 'Solo a₀', 'Ninguno'], c: 0, por: 'El seno es impar: una función par no puede contener senos.' },
      { id: 'sim', etapa: 2, tipo: 'explica', titulo: 'Atajos por simetría', idea: 'Mira antes de integrar: par → cosenos; impar → senos.', modo: 'simetria', params: { onda: 'cuadrada', s: 0, c: 0 } },
      {
        id: 't-sim', etapa: 2, tipo: 'teoria', titulo: 'Las cuatro reglas', idea: 'Ahorran integrales: se sabe qué es cero antes de calcular.',
        puntos: ['<b>Par</b>, f(−t) = f(t) (espejo en t = 0): todos los <b>bₙ = 0</b>.', '<b>Impar</b>, f(−t) = −f(t): <b>a₀ = 0</b> y todos los <b>aₙ = 0</b>.', '<b>Media onda</b>, f(t + T/2) = −f(t): <b>solo armónicos impares</b>.', '<b>a₀</b> = promedio: se lee del dibujo.', 'Truco: <b>resta el nivel DC</b> o <b>mueve el origen</b> para descubrir una simetría escondida.'],
        formulas: ['Par → solo cosenos', 'Impar → solo senos', 'Media onda → n = 1, 3, 5…', 'Mover el origen:', 'cambia senos ↔ cosenos', 'no cambia cₙ']
      },
      { id: 'r7', etapa: 2, tipo: 'rapida', titulo: 'Media onda', t: 'Si f(t + T/2) = −f(t), ¿qué armónicos faltan?', o: ['Los pares', 'Los impares', 'Los senos', 'Ninguno'], c: 0, por: 'Los armónicos pares no cambian de signo al correrse T/2; para que todo cambie de signo deben ser cero.' },
      { id: 'e3', etapa: 2, tipo: 'ejercicio', ejercicio: 'e3' },

      // ===== Etapa 3: reconocer =====
      { id: 'esp', etapa: 3, tipo: 'explica', titulo: 'El espectro: la huella de la señal', idea: 'Cada barra dice cuánto pesa un armónico: cₙ = √(aₙ² + bₙ²).', modo: 'sintesis', params: { onda: 'cuadrada', N: 9 } },
      {
        id: 't-esp', etapa: 3, tipo: 'teoria', titulo: 'Amplitud y fase de cada armónico', idea: 'Del gráfico en el tiempo a las barras, y al revés.',
        puntos: ['Cada armónico es un seno con su <b>amplitud cₙ</b> y su <b>fase φₙ</b>.', 'El <b>espectro de amplitud</b> son las barras cₙ: lo que mide un analizador de espectro.', 'Barra alta = armónico importante. Faltan barras = hay simetría.', 'Mover la señal en el tiempo cambia φₙ, <b>no cambia cₙ</b>.'],
        formulas: ['f(t) = a₀ + Σ cₙ·sen(nω₀t + φₙ)', 'cₙ = √(aₙ² + bₙ²)', 'tan φₙ = aₙ / bₙ']
      },
      { id: 'r8', etapa: 3, tipo: 'rapida', titulo: 'Predicción: pocos términos', t: 'Con solo 3 armónicos, ¿cuál se parece más a su forma original?', o: ['La triangular', 'La cuadrada', 'Las dos igual', 'Ninguna'], c: 0, por: 'La triangular no tiene saltos: sus armónicos bajan como 1/n² y pocos términos bastan.' },
      { id: 'conv', etapa: 3, tipo: 'explica', titulo: 'Saltos y esquinas', idea: 'Con saltos, cₙ baja como 1/n; con solo esquinas, como 1/n².', modo: 'sintesis', params: { onda: 'triangular', N: 3 } },
      { id: 'r9', etapa: 3, tipo: 'rapida', titulo: 'Predicción: Gibbs', t: 'Sumo 1000 armónicos de la cuadrada. El sobrepico junto al salto…', o: ['Se angosta, pero su altura (≈9 %) no baja', 'Desaparece', 'Crece sin límite', 'Se mueve al centro'], c: 0, por: 'Es el fenómeno de Gibbs: el sobrepico se hace angosto, pero se queda en ≈9 % del salto.' },
      { id: 'e4', etapa: 3, tipo: 'ejercicio', ejercicio: 'e4' },
      {
        id: 't-tabla', etapa: 3, tipo: 'teoria', titulo: 'Series de tabla: sin integrar', idea: 'Se parte de una serie conocida y se ajusta.',
        puntos: ['Multiplicar la amplitud por k → <b>todos los coeficientes por k</b>.', 'Sumar un nivel V₀ → <b>solo cambia a₀</b>.', 'Cambiar T → cambia <b>ω₀</b>, no los coeficientes.', 'Correr en el tiempo → mismas cₙ, otra fase.', 'Integrar la cuadrada da la triangular: cada término se divide por n.'],
        derecha: 'Tabla (amplitud 1)', formulas: ['Cuadrada (impar):', '(4/π)·Σ sen(nω₀t)/n,  n impar', 'Triangular (par, pico en 0):', '(8/π²)·Σ cos(nω₀t)/n²,  n impar', 'Diente (impar):', '(2/π)·Σ (−1)ⁿ⁺¹ sen(nω₀t)/n']
      },
      { id: 'e5', etapa: 3, tipo: 'ejercicio', ejercicio: 'e5' },

      // ===== Etapa 4: usar =====
      { id: 'r10', etapa: 4, tipo: 'rapida', titulo: 'Predicción: potencia', t: 'Si duplico la amplitud de un armónico, la potencia que lleva…', o: ['Se multiplica por 4', 'Se duplica', 'No cambia', 'Se reduce a la mitad'], c: 0, por: 'La potencia va con el cuadrado de la amplitud: (2c)² = 4c².' },
      { id: 'pot', etapa: 4, tipo: 'explica', titulo: 'Potencia de cada armónico', idea: 'Parseval: cada armónico aporta su parte del valor eficaz.', modo: 'potencia', params: { I1: 10, I3: 6, I5: 3, I7: 1 } },
      {
        id: 't-pot', etapa: 4, tipo: 'teoria', titulo: 'Parseval y distorsión armónica', idea: 'La potencia se reparte entre los armónicos.',
        puntos: ['<b>Electromecánica</b>: cargadores, LED y variadores toman corriente a pulsos: aparecen el 3.º, 5.º y 7.º armónico. El 3.º se <b>suma en el neutro</b> y lo calienta.', '<b>Biomédica</b>: el oxímetro tiene un nivel DC grande y un pulso con pocos armónicos; el ECG, con el QRS angosto, necesita muchos más.', 'El <b>THD</b> compara los armónicos con la fundamental.'],
        formulas: ['(Valor eficaz)² = a₀² + ½·Σ cₙ²', 'Potencia del armónico n ∝ cₙ²/2', 'THD = √(c₂² + c₃² + …) / c₁']
      },
      { id: 'e6', etapa: 4, tipo: 'ejercicio', ejercicio: 'e6' },
      { id: 'fil', etapa: 4, tipo: 'explica', titulo: 'Una señal periódica entra a un sistema', idea: 'Cada armónico sale multiplicado por H(jnω₀).', modo: 'filtro', params: { r: 3 } },
      {
        id: 't-fil', etapa: 4, tipo: 'teoria', titulo: 'De Laplace a los armónicos', idea: 'La función de transferencia trata a cada armónico por separado.',
        puntos: ['De Laplace: H(s). Con s = jω se obtiene la respuesta a un seno.', 'Cada armónico entra con cₙ y sale con <b>cₙ·|H(jnω₀)|</b>, desfasado ∠H.', 'Un pasa-bajos atenúa los armónicos altos: las esquinas se redondean.', '<b>Resonancia</b>: si un armónico cae cerca de la frecuencia natural de un sistema, se amplifica.'],
        formulas: ['Filtro RC: H(s) = 1/(1 + sRC)', 'H(jω) = 1/(1 + jω/ω_c)', '|H| = 1/√(1 + (ω/ω_c)²)', 'Salida: Σ cₙ|H(jnω₀)|·sen(nω₀t + φₙ + ∠H)']
      },
      { id: 'r11', etapa: 4, tipo: 'rapida', titulo: 'Predicción: el filtro', t: 'Una cuadrada de 50 Hz entra a un filtro RC con f_c = 50 Hz. ¿Qué armónico sale más atenuado?', o: ['El 9.º', 'El 1.º', 'El 3.º', 'Todos igual'], c: 0, por: '|H| baja con la frecuencia: el armónico más alto es el más atenuado.' },
      { id: 'e7', etapa: 4, tipo: 'ejercicio', ejercicio: 'e7' },
      { id: 'cplx', etapa: 4, tipo: 'explica', titulo: 'La forma compleja', idea: 'Cₙ·e^{jnω₀t} con n negativos: el mismo espectro, a ambos lados.', modo: 'complejo', params: { onda: 'cuadrada' } },
      {
        id: 't-cplx', etapa: 4, tipo: 'teoria', titulo: 'Hacia la transformada de Fourier', idea: 'Una sola fórmula en lugar de tres.',
        puntos: ['Euler: e^{jθ} = cos θ + j·sen θ.', 'Cada seno se parte en dos exponenciales: una con n positivo y otra con n negativo.', 'Por eso <b>|Cₙ| = cₙ/2</b> y C₀ = a₀.', 'Si el período T crece sin límite, las barras se juntan: aparece la <b>transformada de Fourier</b>.'],
        formulas: ['f(t) = Σ Cₙ·e^{jnω₀t},  n = −∞ … ∞', 'Cₙ = (1/T) ∫ f(t)·e^{−jnω₀t} dt', 'Cₙ = (aₙ − j·bₙ)/2', '|Cₙ| = cₙ/2,   C₀ = a₀']
      },
      { id: 'r12', etapa: 4, tipo: 'rapida', titulo: 'Forma compleja', t: 'En la forma real c₃ = 0,8. ¿Cuánto vale |C₃| en la forma compleja?', o: ['0,4', '0,8', '1,6', '0,64'], c: 0, por: 'Cada seno se reparte entre n = 3 y n = −3: |C₃| = c₃/2 = 0,4.' },
      { id: 'cierre', etapa: 4, tipo: 'cierre', titulo: 'Cierre', idea: 'Una señal periódica es una receta de armónicos: se calcula, se reconoce y se usa.' }
    ]
  };
})();
