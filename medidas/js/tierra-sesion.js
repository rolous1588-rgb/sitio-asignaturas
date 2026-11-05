// ============================================================
// Medidas Eléctricas · Puesta a tierra y telurómetro (preparada el 04/11/2026)
//   me-tierra  clase de la unidad 6 (lunes 16/11/2026, 90 min)
//   me-lab4    laboratorio 4a: telurómetro virtual (jueves 19/11/2026)
// Ejercicios por carnet: t1 (clase) y t2 (laboratorio), sobre FP.diagramas.telurometro.
// Fórmulas en LaTeX (KaTeX): \( … \) en línea; decimales 0{,}62; multiplicar con \cdot.
// Requiere fp-diagramas.js, fp-sesion.js y tierra-diagramas.js.
// ============================================================
(function () {
  const FP = (window.FP = window.FP || {});
  const X = String.raw;
  const M = FP.tierra;
  const { f } = FP.fmt;
  const E = FP.EJERCICIOS;
  const elegir = (r, arr) => arr[Math.floor(r() * arr.length)];
  // En el repaso libre los datos son otros: nadie ve antes su terreno de la clase o del laboratorio.
  const REPASO = !!(window.II && II.params && II.params.get('modo') === 'libre');
  const azar = (r) => { if (REPASO) { r(); r(); r(); } return r; };
  const fT = (v, d) => f(v, d).replace(',', '{,}'); // número dentro de LaTeX
  const fR = (R) => (R >= 100 ? f(R, 0) : f(R, 1));
  const xSol = (Dd) => Math.round(0.618 * Dd * 2) / 2;
  const puntosSol = (p, Dd) => {
    const x = xSol(Dd);
    return [x - 1, x, x + 1].map((xx) => ({ x: xx, D: Dd, R: Math.round(M.lectura(p, Dd, xx) * 100) / 100 }));
  };
  // puntaje de método: lecturas a −1 m, 0 y +1 m con la misma H (las lecturas se recalculan con el modelo)
  const metodo = (est, Dd, d) => M.verificacion((est.puntos || []).map((q) => ({ x: Number(q.x), D: Number(q.D), R: M.lectura(d, Number(q.D), Number(q.x)) })), est.x, Dd);

  // ---------------- t1 · clase: mide tu jabalina ----------------
  E.t1 = {
    diagrama: 'telurometro', puntos: 10,
    titulo: 'Mide la resistencia de tu jabalina',
    tv: 'Cada uno tiene su terreno y su jabalina. <b>Ubica la pica S donde la lectura es confiable y compruébala moviéndola 1 m a cada lado.</b>',
    formulas: [X`x \approx 0{,}618 \cdot D`, 'Guarda lecturas en x − 1, x y x + 1', 'Si varían 5 % o menos, la lectura es confiable'],
    generar: (r0) => {
      const r = azar(r0);
      const rho = elegir(r, [60, 80, 100, 120, 150, 180, 220]);
      const L = elegir(r, [1.5, 2.4, 3]);
      return { rho, L, sem: Math.floor(r() * 1000), D0: 25, re: M.re(rho, L) };
    },
    resumen: (d) => `jabalina de ${f(d.L, 1)} m; suelo de ${d.rho} Ω·m`,
    enunciado: (d) => `Tu jabalina mide <b>${f(d.L, 1)} m</b> y la pica H ya está a <b>${d.D0} m</b>. Mueve la pica S, toca <b>«Medir»</b> para guardar lecturas y deja S donde la lectura es confiable. Guarda también las lecturas 1 m antes y 1 m después de esa posición.`,
    opciones: (d) => ({ params: { rho: d.rho, L: d.L, sem: d.sem }, inicial: { D: d.D0, x: 3, puntos: [] }, fijos: { D: true } }),
    evaluar: (est, d) => {
      if (est.x == null) return { ok: false, puntos: 0, valor: 100, texto: 'No dejaste la pica S en ninguna posición.' };
      const Dd = est.D != null ? est.D : d.D0;
      const R = M.lectura(d, Dd, est.x);
      const err = (Math.abs(R - d.re) / d.re) * 100;
      const ver = metodo(est, Dd, d);
      const pPrec = err <= 2 ? 6 : err <= 5 ? 3 : 0;
      const pMet = ver.ok ? (ver.var <= 5 ? 4 : 1) : 0;
      const puntos = pPrec + pMet;
      return {
        ok: puntos >= 10, puntos, valor: err,
        texto: `Lectura final: ${fR(R)} Ω con S a ${f(est.x, 1)} m (error ${f(err, 1)} %). ` +
          (ver.ok ? `Comprobación a ±1 m: varía ${f(ver.var, 1)} %.` : 'Faltan las lecturas a −1 m, 0 y +1 m de tu posición.')
      };
    },
    eje: { min: 0, max: 20, zona: [0, 2], titulo: 'Error de la lectura final (%)', fmt: (v) => f(v, 0) + ' %', marcas: [0, 5, 10, 15, 20] },
    solucion: (d) => {
      const x = xSol(d.D0), pts = puntosSol(d, d.D0);
      const ver = M.verificacion(pts, x, d.D0);
      return {
        estado: { D: d.D0, x, puntos: pts },
        pasos: [
          X`Pica S al 61,8 % de D: \(x = 0{,}618 \cdot ${d.D0} \approx ${fT(x, 1)}\ \text{m}\).`,
          `Lectura: <b>${fR(pts[1].R)} Ω</b>. Con S a ${f(x - 1, 1)} m y a ${f(x + 1, 1)} m: ${fR(pts[0].R)} Ω y ${fR(pts[2].R)} Ω.`,
          `Varían ${f(ver.var, 1)} %: menos del 5 %, la lectura es confiable. Valor real del electrodo: ${fR(d.re)} Ω.`
        ]
      };
    }
  };

  // ---------------- t2 · laboratorio: mide y decide ----------------
  E.t2 = {
    diagrama: 'telurometro', puntos: 10,
    titulo: 'Mide y decide: ¿cumple 25 Ω?',
    tv: 'La pica H empieza a solo 8 m. <b>Encuentra una lectura confiable, compruébala a ±1 m y decide si la tierra cumple 25 Ω.</b>',
    formulas: [X`x \approx 0{,}618 \cdot D`, X`D \geq 10 \cdot L`, 'Variación a ±1 m ≤ 5 %', X`R \leq 25\ \Omega \Rightarrow \text{cumple}`],
    generar: (r0) => {
      const r = azar(r0);
      let rho = 100, L = 2.4, re = M.re(rho, L);
      for (let k = 0; k < 30; k++) {
        rho = elegir(r, [40, 50, 60, 80, 100, 150, 200]);
        L = elegir(r, [1.5, 2.4, 3]);
        re = M.re(rho, L);
        if (Math.abs(re - 25) / 25 >= 0.15) break;
      }
      return { rho, L, sem: Math.floor(r() * 1000), D0: 8, limite: 25, re, cumple: re <= 25 };
    },
    resumen: (d) => `jabalina de ${f(d.L, 1)} m; suelo de ${d.rho} Ω·m; ${d.cumple ? 'cumple' : 'no cumple'}`,
    enunciado: (d) => `Tu jabalina mide <b>${f(d.L, 1)} m</b>. El ayudante dejó la pica H a solo <b>${d.D0} m</b>. Ubica H y S donde la lectura sea confiable, guarda las lecturas 1 m antes y 1 m después de S, y decide si la puesta a tierra <b>cumple 25 Ω</b>.`,
    opciones: (d) => ({ params: { rho: d.rho, L: d.L, sem: d.sem, limite: d.limite }, inicial: { D: d.D0, x: 4, puntos: [], decision: null } }),
    evaluar: (est, d) => {
      if (est.x == null) return { ok: false, puntos: 0, valor: 100, texto: 'No dejaste la pica S en ninguna posición.' };
      const Dd = est.D != null ? est.D : d.D0;
      const R = M.lectura(d, Dd, est.x);
      const err = (Math.abs(R - d.re) / d.re) * 100;
      const ver = metodo(est, Dd, d);
      const confiable = ver.ok && ver.var <= 5;
      // sin una comprobación confiable, la lectura vale a lo sumo la mitad
      const pPrec = Math.min(err <= 2 ? 4 : err <= 5 ? 2 : 0, confiable ? 4 : 2);
      const pMet = ver.ok ? (ver.var <= 5 ? 3 : 1) : 0;
      const okDec = est.decision === (d.cumple ? 'cumple' : 'no');
      const puntos = pPrec + pMet + (okDec ? 3 : 0);
      return {
        ok: puntos >= 10, puntos, valor: err,
        texto: `Lectura final: ${fR(R)} Ω con H a ${f(Dd, 0)} m y S a ${f(est.x, 1)} m (error ${f(err, 1)} %). ` +
          (ver.ok ? `Comprobación a ±1 m: varía ${f(ver.var, 1)} %${confiable ? '' : ': la lectura no es confiable (H muy cerca) y vale la mitad'}. ` : 'Faltan las lecturas a −1 m, 0 y +1 m: la lectura vale la mitad. ') +
          (est.decision ? `Decidiste «${est.decision === 'cumple' ? 'cumple' : 'no cumple'}»: ${okDec ? 'correcto' : 'incorrecto'}.` : 'No marcaste si cumple.')
      };
    },
    eje: { min: 0, max: 20, zona: [0, 2], titulo: 'Error de la lectura final (%)', fmt: (v) => f(v, 0) + ' %', marcas: [0, 5, 10, 15, 20] },
    solucion: (d) => {
      const Dd = 30, x = xSol(Dd), pts = puntosSol(d, Dd);
      const ver = M.verificacion(pts, x, Dd);
      return {
        estado: { D: Dd, x, puntos: pts, decision: d.cumple ? 'cumple' : 'no' },
        pasos: [
          X`Con H a 8 m, mover S un metro cambia mucho la lectura: hay que alejar H. Con \(D = 30\ \text{m}\) (más de 10 veces el largo de la jabalina) aparece la meseta.`,
          X`Pica S en \(x = 0{,}618 \cdot 30 \approx ${fT(x, 1)}\ \text{m}\): lectura <b>${fR(pts[1].R)} Ω</b>; a ±1 m varía ${f(ver.var, 1)} %.`,
          `${fR(d.re)} Ω ${d.cumple ? '≤' : '>'} 25 Ω: la puesta a tierra <b>${d.cumple ? 'cumple' : 'no cumple'}</b>.`
        ]
      };
    }
  };

  // ---------------- sesiones ----------------
  FP.SESIONES = FP.SESIONES || {};

  FP.SESIONES['me-tierra'] = {
    id: 'me-tierra',
    materia: 'Medidas Eléctricas',
    titulo: 'Puesta a tierra y telurómetro',
    pasos: [
      { id: 'inicio', tipo: 'inicio', titulo: 'Puesta a tierra y telurómetro', idea: 'Escanea el QR, entra con tu nombre y carnet.' },

      { id: 'caso', tipo: 'teoria', titulo: '¿Para qué sirve la tierra?', idea: 'Una lavadora con falla a la carcasa: ¿quién protege a la persona que la toca?',
        puntos: ['Red de 220 V. La tierra del transformador mide 10 Ω y la de la casa, 40 Ω.', 'Se pela un cable y la fase toca la carcasa metálica.', 'La corriente de falla vuelve a la fuente por el suelo: atraviesa las dos tierras en serie.'],
        derecha: 'Datos', formulas: [X`U_0 = 220\ \text{V}`, X`R_A = 40\ \Omega\ \ (\text{casa})`, X`R_B = 10\ \Omega\ \ (\text{transformador})`, 'Disyuntor de 16 A'],
        guia: ['Preguntar antes de calcular: ¿salta el disyuntor?'] },
      { id: 'r1', tipo: 'rapida', titulo: 'Predicción', t: 'Con esas tierras, ¿salta el disyuntor de 16 A cuando la fase toca la carcasa?', o: ['sí, de inmediato', 'no: la corriente es de unos 4 A', 'no: la corriente es cero', 'sí: la tierra se lleva toda la corriente'], c: 1 },
      { id: 't-contacto', tipo: 'teoria', titulo: 'La carcasa queda con tensión', idea: 'La corriente de falla es pequeña para el disyuntor, pero la tensión de la carcasa es peligrosa.',
        puntos: ['Las dos tierras quedan en serie con la fuente.', X`La carcasa sube a \(I_f \cdot R_A\) respecto del suelo lejano: eso siente quien la toca.`, 'Con 40 Ω la carcasa queda a 176 V: el disyuntor no salta y la persona corre peligro.', 'Por eso se usa un diferencial (30 mA) y una tierra lo bastante baja.'],
        derecha: 'Cálculo',
        formulas: [X`I_f = \dfrac{U_0}{R_A + R_B} = \dfrac{220}{40 + 10} = 4{,}4\ \text{A}`, X`U_c = I_f \cdot R_A = 4{,}4 \cdot 40 = 176\ \text{V}`, X`R_A \leq \dfrac{U_L}{I_{\Delta n}} = \dfrac{24}{0{,}03} = 800\ \Omega`],
        guia: ['El criterio con diferencial usa 24 V como tensión límite (valor de una fuente boliviana; algunas normas usan 50 V).'] },

      { id: 'capas', tipo: 'explica', titulo: '¿Dónde está la resistencia de una tierra?', diagrama: 'capas', inicial: { r: 2 },
        idea: 'La corriente sale del electrodo y se abre en capas cada vez más anchas: casi toda la resistencia está cerca del electrodo.',
        guia: ['Con r = 1 m ya está el 60 %; con r = 4 m, el 90 %. Más allá de 10 m casi no queda nada: eso es la «tierra remota».'] },
      { id: 't-que', tipo: 'teoria', titulo: 'Qué mide un telurómetro', idea: 'La resistencia entre el electrodo y la tierra remota. Depende del suelo y de la forma del electrodo.',
        puntos: [X`<b>Resistividad</b> \(\rho\) del suelo (Ω·m): cambia muchísimo con el agua, las sales y el frío.`, 'Una tierra medida en época de lluvias sale mejor que en época seca: se anota siempre la fecha y el estado del suelo.', 'Una jabalina más larga baja la resistencia, pero no en proporción: el logaritmo lo frena.'],
        formulas: [X`R_{\text{hemisferio}} = \dfrac{\rho}{2\pi r}`, X`R_{\text{jabalina}} = \dfrac{\rho}{2\pi L}\left(\ln\dfrac{4L}{a} - 1\right)`, 'Suelos habituales: 5 a 500 Ω·m', 'Arena seca o roca: 1000 a 10 000 Ω·m o más'],
        guia: ['Dwight; a = radio de la jabalina (8 mm para una de 16 mm).'] },
      { id: 'r2', tipo: 'rapida', titulo: 'Predicción', t: 'Si cambias una jabalina de 1,5 m por una de 3 m en el mismo suelo, su resistencia…', o: ['baja exactamente a la mitad', 'baja, pero un poco menos que a la mitad', 'no cambia', 'sube'], c: 1 },

      { id: 't-dentro', tipo: 'teoria', titulo: 'El telurómetro por dentro', idea: 'Una fuente de corriente alterna, un amperímetro y un voltímetro de alta impedancia, con un filtro.',
        puntos: ['Inyecta una corriente de miliamperios entre el electrodo <b>E</b> y la pica lejana <b>H</b>.', 'Mide la tensión entre E y la pica <b>S</b>. Por S casi no circula corriente: su resistencia de contacto apenas influye.', 'Usa 94 a 128 Hz, no 50 Hz: así separa su señal de las corrientes de la red. Con continua, los iones polarizan las picas.', 'El filtro multiplica la tensión por su propia señal y promedia: la misma idea del vatímetro.'],
        formulas: [X`R_E = \dfrac{V_{ES}}{I_{EH}}`, 'Salida: 20 a 50 V; corriente de mA', 'Revisa antes: picas y tensión de interferencia'] },
      { id: 'r3', tipo: 'rapida', titulo: 'Predicción', t: '¿Por qué el telurómetro inyecta a 128 Hz y no a 50 Hz?', o: ['para separar su señal de las corrientes de la red', 'porque 50 Hz es más peligroso', 'para que la corriente sea mayor', 'para medir la inductancia del suelo'], c: 0 },

      { id: 'campo', tipo: 'explica', titulo: 'Cómo mide: corriente y tensión en el suelo', diagrama: 'campoTierra', params: { rho: 100, L: 2.4, I: 0.02 }, inicial: { D: 25, x: 15.5, etapa: 1 },
        idea: 'Avanza con ▶: la corriente; la tensión en el suelo; medir con S; ¿y si H está cerca?',
        guia: ['Paso 2: señalar la zona crema del medio (tierra remota). Paso 3: mover S por la zona plana y ver que R casi no cambia; luego llevar S cerca de E o de H. Paso 4: H a 8 m, ya no hay zona plana.'] },
      { id: 't-caida', tipo: 'teoria', titulo: 'Caída de potencial: la regla del 62 %', idea: 'Con S al 61,8 % del camino entre E y H, la lectura es igual a la resistencia real.',
        puntos: ['Se desconecta el electrodo; las picas S y H van en línea recta.', X`El electrodo crea un potencial que baja con la distancia; la pica H, otro de signo contrario. La lectura es \(R(x) = (V_E - V(x))/I\).`, X`Esa lectura iguala a \(\rho/(2\pi r)\) en un solo punto: \(x = 0{,}618\,D\).`, 'Vale si el suelo es parejo y H está lejos (unas 10 veces el largo del electrodo).'],
        derecha: 'Deducción',
        formulas: [X`R(x) = \dfrac{\rho}{2\pi}\left(\dfrac{1}{r} - \dfrac{1}{D} - \dfrac{1}{x} + \dfrac{1}{D - x}\right)`, 'Igualando a la resistencia real ρ/(2πr):', X`x^2 + D\,x - D^2 = 0`, X`x = \dfrac{\sqrt{5} - 1}{2}\,D = 0{,}618\,D`] },
      { id: 'telu-lejos', tipo: 'explica', titulo: 'Telurómetro virtual: H lejos', diagrama: 'telurometro', params: { rho: 100, L: 2.4, sem: 7 }, inicial: { D: 25, x: 3, puntos: [] },
        idea: 'Mueve S de a pocos metros y toca «Medir»: la curva se aplana en el medio. Esa meseta es la lectura confiable.',
        guia: ['Medir en 3, 6, 9, 12, 15, 18, 21 y 24 m. Luego 14,5; 15,5 y 16,5 m: varían menos del 5 %.'] },
      { id: 'r4', tipo: 'rapida', titulo: 'Predicción', t: 'Con H a solo 8 m de una jabalina de 3 m, mueves S un metro y la lectura cambia 15 %. ¿Qué haces?', o: ['promedio las lecturas', 'alejo H y repito', 'acerco S al electrodo', 'mojo la pica S'], c: 1 },
      { id: 'telu-cerca', tipo: 'explica', titulo: 'Telurómetro virtual: H cerca', diagrama: 'telurometro', params: { rho: 100, L: 3, sem: 3 }, inicial: { D: 8, x: 2, puntos: [] },
        idea: 'Con H a 8 m las áreas de resistencia se tocan: no hay meseta y un metro cambia mucho la lectura.',
        guia: ['Medir en 4, 5 y 6 m: varían más del 10 %. Subir H a 30 m y volver a medir.'] },
      { id: 't1', tipo: 'ejercicio', ejercicio: 't1' },

      { id: 't-errores', tipo: 'teoria', titulo: 'Errores típicos en campo', idea: 'El error más común: la pica H demasiado cerca.',
        puntos: ['<b>H cerca:</b> las áreas se tocan; la lectura cambia al mover S. Alejar H.', '<b>Electrodo sin desconectar:</b> se mide en paralelo con otras tierras y el valor sale bajo.', '<b>Picas en suelo seco:</b> el equipo avisa; mojar el suelo junto a la pica o clavarla más.', '<b>Cables juntos y paralelos</b> o metales enterrados cerca: medir en otra dirección.'],
        derecha: 'Seguridad', derechaTexto: true,
        formulas: ['Electrodo desconectado: la instalación queda sin tierra', 'Medir sin carga o con un puente provisional', 'Nunca con tormenta'] },
      { id: 'r5', tipo: 'rapida', titulo: 'Predicción', t: 'Mides la tierra de un edificio sin desconectar el electrodo del tablero. El valor sale…', o: ['mayor que el real', 'menor que el real', 'igual al real', 'siempre cero'], c: 1 },
      { id: 't-otros', tipo: 'teoria', titulo: 'Otros métodos y equipos', idea: 'Todos aplican R = V/I; cambian dónde inyectan la corriente y dónde miden la tensión.',
        puntos: ['<b>4 polos:</b> un cable aparte para la tensión; sirve para resistencias bajas.', '<b>Selectivo:</b> una pinza mide solo la corriente de ese electrodo; no hay que desconectarlo.', '<b>Sin picas (dos pinzas):</b> mide el lazo; necesita muchas tierras en paralelo.', X`<b>Resistividad (Wenner):</b> cuatro picas a la misma distancia \(a\); sirve para diseñar.`],
        formulas: [X`\rho = 2\pi\, a\, R`, 'Picas poco clavadas: b ≤ a/20', 'Selectivo: error mayor (≈ 7 %)'] },
      { id: 'r6', tipo: 'rapida', titulo: 'Predicción', t: '¿Sirve una pinza sin picas para medir una jabalina aislada en un terreno?', o: ['sí, igual que con picas', 'no: necesita otras tierras en paralelo para cerrar el lazo', 'solo si el suelo está mojado', 'solo con corriente continua'], c: 1 },
      { id: 't-valores', tipo: 'teoria', titulo: '¿Cuánto es «bueno»?', idea: 'Depende de para qué sirve la tierra y de quién la exige.',
        puntos: ['Un electrodo solo con más de 25 Ω: agregar otro (NEC).', 'ELFEC exige 25 Ω en el neutro del punto de entrega.', 'Pararrayos y equipos sensibles: 5 Ω o menos.', 'Subestaciones y mallas grandes: menos de 0,5 Ω.'],
        derecha: 'Referencias', derechaTexto: true,
        formulas: ['NEC: 25 Ω por electrodo', 'ELFEC: 25 Ω (punto de entrega)', 'CRE: menos de 10 Ω', 'Con diferencial de 30 mA: 800 Ω'] },
      { id: 'formas', tipo: 'explica', titulo: '¿Qué forma conviene y por qué?', diagrama: 'formasTierra', params: { rho: 100 }, inicial: { etapa: 1 },
        idea: 'Avanza con ▶: una jabalina; varias jabalinas; conductor horizontal; malla. Compara con 1 jabalina de 2,4 m.',
        guia: ['Paso 1: subir el largo de 2,4 a 4,8 m (R baja a 0,56) y el grosor de 10 a 25 mm (casi nada). Paso 2: 3 jabalinas a 0,5 m (se tocan) y luego a 5 m. Paso 3: 10 m y 30 m de conductor. Paso 4: malla de 10 m y de 30 m.'] },
      { id: 'preparar', tipo: 'explica', titulo: 'Cómo se prepara el terreno', diagrama: 'prepararTierra', inicial: { suelo: 2, relleno: 0, dp: 0.8 },
        idea: 'Toca un suelo y un relleno: R = parte cercana (relleno) + parte lejana (suelo).',
        guia: ['Arena o grava sin relleno; luego tierra cernida, bentonita y cemento conductivo: la parte lejana no cambia. Bentonita en época seca. Sal y carbón: subir los años. Arcilla húmeda: el relleno casi no hace falta.'] },
      { id: 'instalar', tipo: 'explica', titulo: 'Cómo se instala, paso a paso', diagrama: 'instalarTierra', inicial: { etapa: 1 },
        idea: 'Ocho pasos con ▶: qué se hace y por qué.',
        guia: ['Las medidas del pozo (unos 0,9 m de diámetro y 3 m de hondo) son la práctica común; la jabalina de al menos 2,4 m viene del NEC.'] },
      { id: 't-resumen', tipo: 'teoria', titulo: 'Para llevar: las fórmulas de hoy', idea: 'Anótalas: el jueves las usas en el laboratorio.',
        puntos: ['La resistencia de tierra está casi toda cerca del electrodo.', 'El telurómetro inyecta alterna entre E y H y mide la tensión entre E y S.', 'S al 61,8 % de D, con H lejos; comprobar a ±1 m.', 'Decidir con la norma que corresponde.'],
        formulas: [X`R_E = \dfrac{V_{ES}}{I_{EH}}`, X`x = 0{,}618\, D \;;\; D \geq 10 \cdot L`, X`R = \dfrac{\rho}{2\pi L}\left(\ln\dfrac{4L}{a} - 1\right)`, X`U_c = I_f \cdot R_A`] },
      { id: 'cierre', tipo: 'cierre', titulo: 'Cierre', idea: 'Una tierra se mide con H lejos, S al 62 % y una comprobación a ±1 m.' }
    ]
  };

  FP.SESIONES['me-lab4'] = {
    id: 'me-lab4',
    materia: 'Medidas Eléctricas',
    titulo: 'Laboratorio 4a: ¿cumple la puesta a tierra?',
    pasos: [
      { id: 'inicio', tipo: 'inicio', titulo: 'Laboratorio 4a: ¿cumple la puesta a tierra?', idea: 'Escanea el QR, entra con tu nombre y carnet.' },
      { id: 't-consigna', tipo: 'teoria', titulo: 'La consigna', idea: 'Un taller pide verificar su puesta a tierra antes de conectar equipos nuevos. Límite: 25 Ω.',
        puntos: ['Cada uno recibe un terreno y una jabalina distintos.', 'El ayudante dejó la pica H a solo 8 m: primero hay que ver si así sirve.', 'Método: ubicar H lejos, S al 61,8 %, guardar lecturas a ±1 m y decidir.', 'Puntaje: lectura (4) + comprobación a ±1 m (3) + decisión (3). Sin comprobación confiable, la lectura vale la mitad.'],
        derecha: 'Método', formulas: [X`D \geq 10 \cdot L`, X`x \approx 0{,}618 \cdot D`, 'Variación a ±1 m ≤ 5 %', X`R \leq 25\ \Omega \Rightarrow \text{cumple}`] },
      { id: 'p1', tipo: 'rapida', titulo: 'Antes de medir', t: 'Si la lectura cambia más del 30 % al mover S un metro, la conclusión es…', o: ['el equipo está dañado', 'H está demasiado cerca: hay que alejarla', 'el suelo está mojado', 'el electrodo está desconectado'], c: 1 },
      { id: 't2', tipo: 'ejercicio', ejercicio: 't2' },
      { id: 't-mejorar', tipo: 'teoria', titulo: 'Si no cumple, ¿qué se hace?', idea: 'Bajar la resistencia es ampliar el contacto con el suelo o llegar a capas más húmedas.',
        puntos: ['Más jabalinas en paralelo, separadas al menos su largo (mejor, el doble): si están pegadas, sus áreas se tocan y casi no ayudan.', 'Jabalinas más largas, que lleguen a capas húmedas.', 'Mejorar el contacto del electrodo con el suelo.', 'Volver a medir después del cambio y anotar la fecha.'],
        formulas: [X`R_{\text{jabalina}} = \dfrac{\rho}{2\pi L}\left(\ln\dfrac{4L}{a} - 1\right)`, 'Áreas de resistencia separadas: el paralelo sí ayuda'] },
      { id: 'l-formas', tipo: 'explica', titulo: 'Si no cumple: ¿qué forma conviene?', diagrama: 'formasTierra', params: { rho: 100 }, inicial: { etapa: 2 },
        idea: 'Varias jabalinas: separarlas para que sus zonas no se toquen.' },
      { id: 'p2', tipo: 'rapida', titulo: 'Para cerrar', t: 'Tu tierra no cumple. ¿Qué propones?', o: ['otra jabalina igual, a dos veces su largo, unida a la primera', 'una segunda jabalina pegada a la primera, a 10 cm', 'acortar la jabalina', 'medir otra vez con H más cerca'], c: 0 },
      { id: 'cierre', tipo: 'cierre', titulo: 'Cierre', idea: 'Medir bien es parte de la decisión: sin meseta ni comprobación, el número no sirve.' }
    ]
  };

  // Las fórmulas sin delimitadores se envuelven en \( … \) para que KaTeX las dibuje.
  const envolver = (t) => (/\\\(/.test(t) || !/[\\=^_]/.test(t) ? t : '\\(' + t + '\\)');
  ['me-tierra', 'me-lab4'].forEach((id) => FP.SESIONES[id].pasos.forEach((p) => { if (p.formulas) p.formulas = p.formulas.map(envolver); }));
  ['t1', 't2'].forEach((id) => { E[id].formulas = E[id].formulas.map(envolver); });
})();
