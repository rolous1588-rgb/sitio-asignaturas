// ============================================================
// Sesión 1 — Fundamentos de instrumentación industrial
// Domingo 27/09 · 09:00–12:00 (3 h)
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  const V = (x, u = '') => `<span class="valor">${II.fmt(x, 3)}${u ? ' ' + u : ''}</span>`;
  const VAR = ['Temperatura', 'Presión', 'Nivel', 'Flujo'];
  const ELEM = ['Sensor / transmisor', 'Controlador', 'Elemento final de control', 'Perturbación del proceso'];

  // ---------- Reto 1: ¿qué variable se mide? ----------
  const SITUACIONES = {
    Temperatura: [
      'Asegurar que la leche se pasteurice a 72 °C durante 15 segundos.',
      'Mantener un horno de fundición de cobre a 1200 °C.',
      'Controlar la fermentación de la cerveza entre 10 y 12 °C.',
      'Vigilar que el aceite de un transformador no se sobrecaliente.'
    ],
    Presión: [
      'Evitar que una caldera supere su presión de diseño.',
      'Detectar que un filtro se está tapando comparando lo que "empuja" el fluido antes y después de él.',
      'Mantener la red de aire comprimido de la planta en 6 bar.',
      'Comprobar que un neumático de camión minero esté inflado correctamente.'
    ],
    Nivel: [
      'Saber cuánto diésel queda en un tanque de almacenamiento.',
      'Evitar que un silo de cemento rebalse mientras se llena.',
      'Mantener la altura de agua en el domo de una caldera.',
      'Controlar cuánta pulpa hay acumulada en el cajón de alimentación de una bomba.'
    ],
    Flujo: [
      'Medir cuántos m³/h de agua potable entrega la planta a la ciudad.',
      'Facturar el gas natural que se entrega a una industria.',
      'Dosificar 250 L/min de reactivo en un circuito de flotación.',
      'Controlar cuánto combustible entra por hora a un quemador.'
    ]
  };
  const RAZON = {
    Temperatura: 'se habla de grados (°C): calor.',
    Presión: 'se trata de la fuerza del fluido por unidad de área (bar).',
    Nivel: 'interesa cuánto hay acumulado (altura o volumen en un recipiente).',
    Flujo: 'interesa cuánto pasa por unidad de tiempo (m³/h, L/min).'
  };

  // ---------- Reto 2: escenarios de falla ----------
  const ESCENARIOS = [
    ['En automático, la lectura de nivel se queda fija en 50 % todo el turno, pero por la mirilla se ve que el tanque está rebalsando.', 0, 'La medición no refleja la realidad: el controlador corrige sobre un dato falso.'],
    ['La salida del controlador llega a 100 %, pero el caudal de entrada no cambia y el nivel sigue bajando.', 2, 'El controlador pide abrir, pero la válvula no responde (trabada o sin aire).'],
    ['La medición y la válvula funcionan bien, pero el nivel oscila arriba y abajo del setpoint sin estabilizarse nunca.', 1, 'El controlador está mal sintonizado: reacciona demasiado fuerte.'],
    ['Todo funciona bien; otra área abre una válvula aguas abajo, el consumo aumenta y el nivel baja unos minutos hasta que el controlador lo recupera.', 3, 'Es un cambio externo: el lazo cumplió su función al corregirlo.'],
    ['Desde que reemplazaron el transmisor, el nivel real siempre está 20 cm más bajo de lo que muestra la pantalla, aunque la lectura está en el setpoint.', 0, 'Error sistemático de medición: hay que calibrar el transmisor.'],
    ['El actuador neumático de la válvula perdió su suministro de aire y la válvula quedó cerrada.', 2, 'Sin aire, el elemento final queda en su posición de falla y no obedece.'],
    ['Alguien dejó el controlador en modo manual con salida fija; ante cambios de consumo el nivel ya no se corrige.', 1, 'En manual nadie compara la medición con el setpoint: el lazo queda abierto.'],
    ['Una lluvia intensa hace entrar agua a un tanque abierto: el nivel sube aunque nadie tocó el lazo.', 3, 'Entrada de agua no prevista: es una perturbación que el lazo debe compensar.']
  ];

  const retos = {
    'c1-reto': {
      titulo: 'Reto 1 · ¿Qué variable se mide?',
      puntos: 10,
      general: 'Cada estudiante recibe 5 situaciones industriales distintas. Identifica qué variable de proceso hay que medir en cada una.',
      pista: 'Pregúntate qué magnitud física cambia: ¿grados, fuerza por área, altura acumulada o cantidad que pasa por unidad de tiempo?',
      errorComun: 'Confundir nivel con flujo: el nivel es cuánto hay acumulado; el flujo es cuánto pasa por unidad de tiempo.',
      metodo: 'Busca la unidad o la magnitud: °C → temperatura · bar → presión · m o % de altura → nivel · m³/h o L/s → flujo.',
      generar(r) {
        const elegidas = VAR.map((v) => ({ v, s: II.elegir(r, SITUACIONES[v]) }));
        const extraV = II.elegir(r, VAR);
        const resto = SITUACIONES[extraV].filter((s) => !elegidas.some((e) => e.s === s));
        elegidas.push({ v: extraV, s: II.elegir(r, resto) });
        const orden = II.mezclar(r, elegidas);
        const campos = orden.map((e, i) => ({ id: 'q' + (i + 1), tipo: 'select', pregunta: e.s, opciones: VAR }));
        const esperado = {};
        orden.forEach((e, i) => (esperado['q' + (i + 1)] = e.v));
        return {
          enunciado: '<p>Para cada situación, elige la <b>variable de proceso</b> que hay que medir.</p>',
          campos, esperado,
          solucion: '<ol style="margin:0;padding-left:20px">' + orden.map((e) => `<li style="margin-bottom:6px">${II.esc(e.s)}<br><b>${e.v}</b>: ${RAZON[e.v]}</li>`).join('') + '</ol>'
        };
      }
    },

    'c2-reto': {
      titulo: 'Reto 2 · El lazo en acción',
      puntos: 10,
      general: 'Calcula qué tan rápido cambia el nivel en lazo abierto e identifica qué elemento del lazo explica cada situación.',
      pista: 'Velocidad del nivel = (caudal que sale − caudal que entra) ÷ área. Pasa L/s a m³/s dividiendo entre 1000, y de m/s a cm/min multiplicando por 6000.',
      errorComun: 'Olvidar convertir litros a m³ (÷1000) o segundos a minutos (×60).',
      metodo: 'v = (Qs − Qe) ÷ A → en cm/min: (Qs − Qe) [L/s] × 6 ÷ A [m²]',
      generar(r) {
        const A = II.elegir(r, [0.8, 1.2, 1.5, 2, 2.5, 3]);
        const Qe = II.elegir(r, [3, 4, 5, 6]);
        const dQ = II.elegir(r, [1, 1.5, 2, 2.5, 3]);
        const Qs = Qe + dQ;
        const v = (dQ * 6) / A;
        const e1 = II.elegir(r, ESCENARIOS);
        const e2 = II.elegir(r, ESCENARIOS.filter((e) => e[1] !== e1[1]));
        return {
          enunciado: `<p>Un tanque de ${V(A, 'm²')} de sección opera en <b>lazo abierto</b>: la válvula de entrada está fija y entran ${V(Qe, 'L/s')}. De pronto, el consumo sube a ${V(Qs, 'L/s')}.</p>`,
          campos: [
            { id: 'v', tipo: 'num', pregunta: 'a) ¿A qué velocidad <b>baja</b> el nivel?', unidad: 'cm/min', tolRel: 0.02 },
            { id: 'e1', tipo: 'select', pregunta: 'b) ' + II.esc(e1[0]) + '<br><span class="nota">¿Qué elemento explica esta situación?</span>', opciones: ELEM },
            { id: 'e2', tipo: 'select', pregunta: 'c) ' + II.esc(e2[0]) + '<br><span class="nota">¿Qué elemento explica esta situación?</span>', opciones: ELEM }
          ],
          esperado: { v, e1: ELEM[e1[1]], e2: ELEM[e2[1]] },
          solucion: `
            <p><b>a)</b> Sale más de lo que entra: ΔQ = ${II.fmt(Qs)} − ${II.fmt(Qe)} = ${V(dQ, 'L/s')} = ${II.fmt(dQ / 1000, 4)} m³/s.</p>
            <p>v = ΔQ ÷ A = ${II.fmt(dQ / 1000, 4)} ÷ ${II.fmt(A)} = ${II.fmt(dQ / 1000 / A, 6)} m/s × 6000 = <b>${II.fmt(v, 2)} cm/min</b></p>
            <p><b>b) ${ELEM[e1[1]]}</b>: ${II.esc(e1[2])}</p>
            <p><b>c) ${ELEM[e2[1]]}</b>: ${II.esc(e2[2])}</p>`
        };
      }
    },

    'c3-reto': {
      titulo: 'Reto 3 · Rango, span y exactitud',
      puntos: 10,
      general: 'Cada uno recibe un transmisor distinto: calcula su span, el error máximo permitido y verifica si cumple con su exactitud.',
      pista: 'El error en % se calcula respecto al span, no respecto a la lectura: |indicación − patrón| ÷ span × 100.',
      errorComun: 'Dividir el error entre la lectura o entre el URV en vez de entre el span. Con LRV negativo: span = URV − (−LRV), es decir, se suman.',
      metodo: 'Span = URV − LRV · Error máx = exactitud % × span · Error % = |indicación − patrón| ÷ span × 100 · Cumple si Error % ≤ exactitud %',
      generar(r) {
        const tipo = II.elegir(r, ['temp', 'pres', 'nivel']);
        let lrv, span, u, nombre;
        if (tipo === 'temp') { lrv = II.elegir(r, [-50, -20, 0, 20]); span = II.elegir(r, [100, 150, 200, 250, 400]); u = '°C'; nombre = 'transmisor de temperatura'; }
        else if (tipo === 'pres') { lrv = II.elegir(r, [0, 0, -1]); span = II.elegir(r, [6, 10, 16, 25, 40]); u = 'bar'; nombre = 'transmisor de presión'; }
        else { lrv = 0; span = II.elegir(r, [2.5, 3, 4, 5, 6]); u = 'm'; nombre = 'transmisor de nivel'; }
        const urv = lrv + span;
        const ex = II.elegir(r, [0.25, 0.5, 1]);
        const patron = Math.round((lrv + II.elegir(r, [0.25, 0.4, 0.5, 0.6, 0.75]) * span) * 1000) / 1000;
        const k = II.elegir(r, [0.4, 0.6, 1.5, 1.8]) * (r() < 0.5 ? -1 : 1);
        const dec = span <= 10 ? 3 : 2;
        const ind = Math.round((patron + (k * ex * span) / 100) * Math.pow(10, dec)) / Math.pow(10, dec);
        const emax = (ex / 100) * span;
        const errPct = (Math.abs(ind - patron) / span) * 100;
        const cumple = errPct <= ex + 1e-9 ? 'Sí' : 'No';
        return {
          enunciado: `<p>Un ${nombre} tiene un rango de ${V(lrv, u)} a ${V(urv, u)} y una exactitud de ${V(ex, '%')} del span.</p><p>En la verificación se le aplica un valor patrón de ${V(patron, u)} y el instrumento indica ${V(ind, u)}.</p>`,
          campos: [
            { id: 'span', tipo: 'num', pregunta: 'a) ¿Cuál es el span?', unidad: u, tolRel: 0.005 },
            { id: 'emax', tipo: 'num', pregunta: 'b) ¿Cuál es el error máximo permitido (±)?', unidad: u, tolRel: 0.02, tolAbs: 0.0005 },
            { id: 'err', tipo: 'num', pregunta: 'c) ¿Cuál es el error medido, en % del span? (valor absoluto)', unidad: '%', tolRel: 0.03, tolAbs: 0.005 },
            { id: 'cumple', tipo: 'select', pregunta: 'd) ¿El instrumento cumple con su exactitud?', opciones: ['Sí', 'No'] }
          ],
          esperado: { span, emax, err: errPct, cumple },
          solucion: `
            <p><b>a)</b> Span = ${II.fmt(urv, 3)} − (${II.fmt(lrv, 3)}) = <b>${II.fmt(span, 3)} ${u}</b></p>
            <p><b>b)</b> Error máx = ${II.fmt(ex)} % × ${II.fmt(span, 3)} = <b>± ${II.fmt(emax, 4)} ${u}</b></p>
            <p><b>c)</b> Error = |${II.fmt(ind, 3)} − ${II.fmt(patron, 3)}| = ${II.fmt(Math.abs(ind - patron), 4)} ${u} → ${II.fmt(Math.abs(ind - patron), 4)} ÷ ${II.fmt(span, 3)} × 100 = <b>${II.fmt(errPct, 3)} %</b></p>
            <p><b>d) ${cumple}</b>: ${II.fmt(errPct, 3)} % ${cumple === 'Sí' ? '≤' : '>'} ${II.fmt(ex)} %.</p>`
        };
      }
    },

    integrador: {
      titulo: 'Reto integrador · Tanque de agua potable',
      puntos: 20,
      general: 'Un caso que junta todo lo de hoy: elementos del lazo, variable de proceso, span, exactitud y comportamiento en lazo abierto.',
      pista: 'Resuelve por partes: identifica primero, luego calcula el span, después el error en % del span y al final el tiempo con la velocidad del nivel.',
      errorComun: 'En la última pregunta, mezclar unidades (cm con m, o segundos con minutos).',
      metodo: 'Tiempo = altura que baja ÷ velocidad del nivel · velocidad (cm/min) = (Qs − Qe) [L/s] × 6 ÷ A [m²]',
      generar(r) {
        const H = II.elegir(r, [3, 4, 5, 6]);
        const ex = II.elegir(r, [0.5, 1]);
        const P = Math.round(H * II.elegir(r, [0.35, 0.5, 0.65]) * 100) / 100;
        const k = II.elegir(r, [0.5, 1.6]) * (r() < 0.5 ? -1 : 1);
        const I = Math.round((P + (k * ex * H) / 100) * 1000) / 1000;
        const errPct = (Math.abs(I - P) / H) * 100;
        const cumple = errPct <= ex + 1e-9 ? 'Sí' : 'No';
        const A = II.elegir(r, [2, 2.5, 3, 4]);
        const Qe = II.elegir(r, [4, 5, 6]);
        const dQ = II.elegir(r, [1, 2, 3]);
        const Qs = Qe + dQ;
        const D = II.elegir(r, [30, 40, 50, 60]);
        const vel = (dQ * 6) / A;
        const t = D / vel;
        return {
          enunciado: `
            <p>La planta de agua potable tiene un tanque de reserva de ${V(A, 'm²')} de sección. Su nivel se controla con un lazo: el <b>LT-201</b> (rango 0 a ${V(H, 'm')}, exactitud ${V(ex, '%')} del span) envía la señal al <b>LIC-201</b>, que abre o cierra la válvula de entrada <b>LV-201</b>.</p>
            <p>En una verificación, una regla graduada (patrón) marca ${V(P, 'm')} y el LT-201 indica ${V(I, 'm')}.</p>
            <p>Más tarde, el controlador pasa a <b>manual</b> con la válvula fija: entran ${V(Qe, 'L/s')} y el consumo sube a ${V(Qs, 'L/s')}.</p>`,
          campos: [
            { id: 'q1', tipo: 'select', pregunta: '1) ¿Qué función cumple la válvula LV-201 en este lazo?', opciones: ['Sensor / transmisor', 'Controlador', 'Elemento final de control', 'Proceso'] },
            { id: 'q2', tipo: 'select', pregunta: '2) ¿Qué variable de proceso controla este lazo?', opciones: VAR },
            { id: 'q3', tipo: 'num', pregunta: '3) ¿Cuál es el span del LT-201?', unidad: 'm', tolRel: 0.005 },
            { id: 'q4', tipo: 'num', pregunta: '4) ¿Cuál es el error medido del LT-201, en % del span? (valor absoluto)', unidad: '%', tolRel: 0.03, tolAbs: 0.005 },
            { id: 'q5', tipo: 'select', pregunta: '5) ¿El LT-201 cumple con su exactitud?', opciones: ['Sí', 'No'] },
            { id: 'q6', tipo: 'num', pregunta: `6) En manual, ¿cuántos minutos tarda el nivel en bajar ${II.fmt(D)} cm?`, unidad: 'min', tolRel: 0.02 }
          ],
          esperado: { q1: 'Elemento final de control', q2: 'Nivel', q3: H, q4: errPct, q5: cumple, q6: t },
          solucion: `
            <p><b>1) Elemento final de control</b>: es lo que actúa sobre el proceso. <b>2) Nivel</b>.</p>
            <p><b>3)</b> Span = ${II.fmt(H)} − 0 = <b>${II.fmt(H)} m</b></p>
            <p><b>4)</b> Error = |${II.fmt(I, 3)} − ${II.fmt(P, 3)}| ÷ ${II.fmt(H)} × 100 = <b>${II.fmt(errPct, 3)} %</b> → <b>5) ${cumple}</b> (límite ${II.fmt(ex)} %).</p>
            <p><b>6)</b> v = (${II.fmt(Qs)} − ${II.fmt(Qe)}) × 6 ÷ ${II.fmt(A)} = ${II.fmt(vel, 3)} cm/min → t = ${II.fmt(D)} ÷ ${II.fmt(vel, 3)} = <b>${II.fmt(t, 2)} min</b></p>`
        };
      }
    }
  };

  II.SESIONES['ii-s1'] = {
    id: 'ii-s1',
    numero: 1,
    titulo: 'Fundamentos de instrumentación industrial',
    fecha: 'Domingo 27/09 · 09:00–12:00',
    siguiente: 'Sesión 2 · Martes 29/09, 20:00 — Sensores de temperatura y presión',
    retos,
    diagnostico: [
      { t: '¿Cuál de estas NO es una variable de proceso típica?', o: ['Temperatura', 'Presión', 'El color de la tubería', 'Caudal'], c: 2 },
      { t: 'El termostato de una casa enciende la calefacción cuando la temperatura baja del valor fijado. Es un ejemplo de:', o: ['Lazo abierto', 'Lazo cerrado', 'No es un sistema de control'], c: 1 },
      { t: 'Un termómetro siempre marca 2 °C más que el valor real, y siempre lo mismo. Es:', o: ['Exacto y preciso', 'Preciso pero no exacto', 'Exacto pero no preciso', 'Ni exacto ni preciso'], c: 1 },
      { t: 'Un manómetro con escala de 0 a 10 bar tiene un span de:', o: ['0 bar', '5 bar', '10 bar', '20 bar'], c: 2 },
      { t: 'En un lazo de control, ¿qué elemento actúa directamente sobre el proceso?', o: ['El sensor', 'El controlador', 'El elemento final (p. ej., la válvula)', 'El indicador'], c: 2 }
    ],
    pasos: [
      { id: 'inicio', tipo: 'espera', titulo: 'Bienvenidos al módulo de Instrumentación Industrial' },
      { id: 'diagnostico', tipo: 'cuestionario', titulo: 'Diagnóstico rápido: 5 preguntas' },

      { id: 'c1-explica', tipo: 'explica', ciclo: 1, titulo: '¿Qué es un sistema de instrumentación?', diagrama: 'planta',
        ideas: [
          'Un sistema de instrumentación <b>mide, transmite, muestra y controla</b> las variables de un proceso.',
          'Las cuatro variables más comunes: <b>temperatura, presión, nivel y flujo</b> (caudal).',
          'Medir es el primer paso: <b>lo que no se mide, no se puede controlar</b>.',
          'Instrumento ≠ equipo: la bomba mueve el agua; el transmisor <b>informa</b> lo que pasa.'
        ] },
      { id: 'c1-explora', tipo: 'explora', ciclo: 1, titulo: 'Explora la planta', diagrama: 'planta',
        guia: [
          'Haz clic en los 4 transmisores (LT, TT, PT, FT) y anota qué variable mide cada uno.',
          '¿Cuál es el único instrumento que está en la sala de control? ¿Cómo lo reconoces en el dibujo?',
          'Activa "Resaltar señales": ¿de dónde sale y a dónde llega cada señal?',
          '¿La bomba es un instrumento? ¿Por qué?'
        ] },
      { id: 'c1-reto', tipo: 'reto', ciclo: 1, titulo: 'Reto 1 · ¿Qué variable se mide?', reto: 'c1-reto' },
      { id: 'c1-revisa', tipo: 'revisa', ciclo: 1, titulo: 'Revisión del Reto 1', reto: 'c1-reto' },

      { id: 'c2-explica', tipo: 'explica', ciclo: 2, titulo: 'Lazo abierto y lazo cerrado', diagrama: 'lazo',
        ideas: [
          '<b>Lazo abierto</b>: la acción no depende de la medición (válvula fija). Si algo cambia, nadie corrige.',
          '<b>Lazo cerrado</b>: se mide, se compara con el <b>setpoint</b> y se corrige de forma continua (realimentación).',
          'Elementos del lazo: <b>sensor/transmisor → controlador → elemento final → proceso</b>.',
          '<b>Perturbación</b>: un cambio externo que saca a la variable de su valor deseado (por ejemplo, más consumo).'
        ] },
      { id: 'c2-explora', tipo: 'explora', ciclo: 2, titulo: 'Explora el lazo', diagrama: 'lazo',
        guia: [
          'En <b>Manual</b>, sube el consumo a 7 L/s. ¿Qué pasa con el nivel?',
          'Cambia a <b>Automático</b> y repite. ¿Qué hace la válvula?',
          'Cambia el setpoint a 70 %. ¿Cuánto tarda en llegar? ¿Se pasa?',
          'Simula "Sensor congelado" en automático. ¿Por qué el controlador no corrige?'
        ] },
      { id: 'c2-reto', tipo: 'reto', ciclo: 2, titulo: 'Reto 2 · El lazo en acción', reto: 'c2-reto' },
      { id: 'c2-revisa', tipo: 'revisa', ciclo: 2, titulo: 'Revisión del Reto 2', reto: 'c2-reto' },

      { id: 'pausa', tipo: 'pausa', titulo: 'Pausa', minutos: 10 },

      { id: 'c3-explica', tipo: 'explica', ciclo: 3, titulo: 'Exactitud, precisión, rango y span', diagrama: 'medicion',
        ideas: [
          '<b>Exactitud</b>: qué tan cerca está el promedio del valor verdadero. <b>Precisión</b>: qué tan repetibles son las lecturas.',
          'Un instrumento puede ser muy preciso y a la vez inexacto (error sistemático). Eso se corrige <b>calibrando</b> (Sesión 5).',
          '<b>Rango</b>: de LRV a URV. <b>Span = URV − LRV</b>.',
          'La exactitud suele darse en <b>% del span</b>: ±0,5 % de un span de 200 °C = ±1 °C.'
        ] },
      { id: 'c3-explora', tipo: 'explora', ciclo: 3, titulo: 'Explora la medición', diagrama: 'medicion',
        guia: [
          'Prueba los 4 casos de la diana. ¿Cuál es "preciso pero no exacto"? ¿Qué error lo causa?',
          'En "Rango y span", elige −20 a 180 °C. ¿Cuánto vale el span?',
          'Lleva la variable fuera del rango. ¿Qué pasa con la salida del transmisor?',
          'Cambia la exactitud a ±1 %: ¿cuánto crece el error permitido?'
        ] },
      { id: 'c3-reto', tipo: 'reto', ciclo: 3, titulo: 'Reto 3 · Rango, span y exactitud', reto: 'c3-reto' },
      { id: 'c3-revisa', tipo: 'revisa', ciclo: 3, titulo: 'Revisión del Reto 3', reto: 'c3-reto' },

      { id: 'integrador', tipo: 'reto', titulo: 'Reto integrador · Tanque de agua potable', reto: 'integrador' },
      { id: 'integrador-revisa', tipo: 'revisa', titulo: 'Revisión del reto integrador', reto: 'integrador' },
      { id: 'cierre', tipo: 'cierre', titulo: 'Cierre de la Sesión 1',
        ideas: [
          'Un sistema de instrumentación mide las variables del proceso: <b>T, P, L y F</b>.',
          'El <b>lazo cerrado</b> mide, compara y corrige; el abierto no.',
          '<b>Exactitud ≠ precisión</b>; el error se expresa en <b>% del span</b>.',
          'Próxima sesión: <b>sensores de temperatura y presión</b> (martes 29/09, 20:00).'
        ] }
    ]
  };


  // ---------- Guion docente: qué decir y en qué orden (solo se ve en el panel del celular) ----------
  const GUION = {
    inicio: { min: 15, puntos: [
      'Saluda, preséntate y presenta el módulo: 6 sesiones, 14 horas, del 27/09 al 07/10.',
      'Explica la dinámica: <b>no hay diapositivas</b>; cada uno trabaja en su dispositivo. Ciclo: <b>explico → exploran → reto → revisamos</b>.',
      'Pide que escaneen el QR o abran el enlace del chat de Zoom con <b>nombre y carnet</b>. Mira "Conectados" en tu panel.',
      'Aclara: los retos tienen <b>valores distintos por carnet</b>, hay 2 intentos y deben marcar "seguro / tengo dudas" con honestidad: así sabes a quién ayudar.',
      'Cuando la mayoría esté conectada → <b>Siguiente</b>.'
    ] },
    diagnostico: { min: 10, puntos: [
      '"Cinco preguntas rápidas, <b>no tienen nota</b>: me sirven para saber desde dónde empezar."',
      'Dales 4–5 minutos. Mira en <b>Pizarra → Diagnóstico</b> cuántos respondieron.',
      'Fíjate qué pregunta tiene el porcentaje más bajo: ahí pon más énfasis hoy.',
      'No des las respuestas todavía: "lo vamos a descubrir durante la clase".'
    ] },
    'c1-explica': { min: 12, puntos: [
      'Pregunta de arranque: <b>"¿Cómo sabe un operador cuánta agua hay en un tanque que no puede ver por dentro?"</b> Deja que respondan 2–3 en el chat.',
      'Recorre la planta: tanque TK-100, entrada con válvula, calentador y bomba de salida. Eso es el <b>proceso</b>.',
      'Haz clic en <b>LT-101</b> (nivel), luego <b>TT-102</b>, <b>PT-103</b> y <b>FT-104</b>: las 4 variables son temperatura, presión, nivel y flujo. Pide un ejemplo de su industria para cada una.',
      'Clic en la <b>bomba</b>: "¿es un instrumento?" No: es equipo. El transmisor <b>informa</b>; la bomba actúa sobre el fluido.',
      'Pulsa <b>"Resaltar señales"</b>: la línea punteada lleva información (señal eléctrica); la gruesa lleva el fluido.',
      'Cierra con la idea fuerza: <b>"lo que no se mide, no se puede controlar"</b>. Medir → transmitir → mostrar → controlar.'
    ] },
    'c1-explora': { min: 7, puntos: [
      '"Ahora ustedes: abran el diagrama en su dispositivo y respondan las 4 preguntas de la guía."',
      'Mientras exploran, lee el chat. Respuesta de la 2: <b>LIC-101</b> (la raya horizontal indica sala de control).',
      'Pregunta en voz alta a 1 o 2 estudiantes qué encontraron.',
      'Avisa "1 minuto" → <b>Siguiente</b>.'
    ] },
    'c1-reto': { min: 9, puntos: [
      '"Cada uno tiene 5 situaciones distintas: identifiquen qué variable hay que medir."',
      'Recuerda: marcar seguro / tengo dudas antes de enviar; hay 2 intentos.',
      'Mira la <b>Pizarra</b>: rojo = se equivocó estando seguro. Toca un nombre para ver qué confundió.',
      'Cuando ~80 % haya enviado, avisa "1 minuto" → <b>Siguiente</b>.'
    ] },
    'c1-revisa': { min: 5, puntos: [
      'La pantalla muestra los resultados sola: comenta el porcentaje de correctas.',
      'Error frecuente: <b>nivel vs. flujo</b>. Ejemplo: el balde lleno es nivel (lo acumulado); el grifo abierto es flujo (lo que pasa por segundo).',
      'Comenta 1 o 2 casos de la pizarra <b>sin decir nombres</b>.',
      'Pide que revisen en su pantalla la solución con sus propios valores.'
    ] },
    'c2-explica': { min: 12, puntos: [
      'Empieza en <b>Automático</b>, todo estable. Presenta el diagrama de bloques: <b>sensor/transmisor → controlador → elemento final → proceso</b>.',
      'Cambia a <b>Manual</b> (lazo abierto) y pulsa <b>"Perturbación +2 L/s"</b>: el nivel baja y nadie corrige. Pregunta: "¿qué hace falta?"',
      'Pulsa <b>Reiniciar</b>, vuelve a <b>Automático</b> y repite la perturbación: la válvula abre sola y el nivel vuelve al setpoint. Señala la tendencia (azul = nivel, naranja = válvula).',
      'Sube el <b>setpoint</b> de 50 a 70 %: muestra cómo el nivel lo sigue.',
      'Define <b>setpoint, perturbación y realimentación</b>. Ejemplo cotidiano: el termostato o la ducha.',
      'Si hay tiempo: falla <b>"Sensor congelado"</b>. El controlador "cree" que todo está bien → medir bien es clave (enlaza con el Ciclo 3).'
    ] },
    'c2-explora': { min: 7, puntos: [
      'Pide que hagan las 4 experiencias de la guía en su dispositivo.',
      'Pregunta para discutir: <b>¿por qué con el sensor congelado el controlador no corrige?</b>',
      'Avisa "1 minuto" → <b>Siguiente</b>.'
    ] },
    'c2-reto': { min: 9, puntos: [
      '"La parte a) es un cálculo: velocidad del nivel en cm/min. Las partes b) y c): qué elemento del lazo explica cada situación."',
      'Pista que puedes dar en voz alta: <b>ΔQ ÷ área</b> y cuidar unidades (L → m³ ÷ 1000; s → min × 60).',
      'Toca un nombre en rojo en la pizarra: casi siempre el error es de unidades.'
    ] },
    'c2-revisa': { min: 5, puntos: [
      'Comenta los resultados en pantalla.',
      'Resuelve un caso genérico en voz alta: ΔQ = 2 L/s, A = 2 m² → 0,002 ÷ 2 = 0,001 m/s = <b>6 cm/min</b>. Atajo: <b>ΔQ × 6 ÷ A</b>.',
      'Repasa las 4 categorías de falla con un ejemplo de cada una.'
    ] },
    pausa: { min: 10, puntos: [
      'Anuncia 10 minutos de pausa: el reloj corre en la pantalla y en sus dispositivos.',
      'Aprovecha para mirar <b>Reporte</b>: quién no ha enviado los retos.',
      'Al volver → <b>Siguiente</b>.'
    ] },
    'c3-explica': { min: 12, puntos: [
      'Pregunta de arranque: <b>"Si un termómetro siempre marca 2 °C de más, pero siempre lo mismo, ¿es bueno o malo?"</b> (es la pregunta 3 del diagnóstico).',
      'Pestaña <b>"Exactitud y precisión"</b>: pulsa los 4 casos en orden — Exacto y preciso → Preciso, no exacto → Exacto, no preciso → Ni exacto ni preciso. En cada uno señala la <b>cruz naranja</b> (promedio) y qué tan juntos están los puntos.',
      'Define: <b>exactitud</b> = el promedio cerca del valor verdadero (error sistemático o sesgo). <b>Precisión</b> = lecturas juntas entre sí (error aleatorio). Muestra abajo la recta del termómetro: lo mismo con números.',
      'Remata: lo "preciso pero no exacto" se corrige <b>calibrando</b> (Sesión 5); la falta de precisión no se arregla calibrando.',
      'Pestaña <b>"Rango y span"</b>: preset Presión 0–10 bar → span 10 bar. Luego Temperatura −20 a 180 °C → span = 180 − (−20) = <b>200 °C</b> (resalta el signo).',
      'Mueve el valor: la salida se expresa en <b>% del span</b>. Llévalo fuera de rango → la señal se satura: por eso el rango se elige según el proceso.',
      'Exactitud ±0,5 % del span = <b>±1 °C</b>; cámbiala a ±1 % → ±2 °C. Idea clave: <b>el error se expresa respecto al span, no a la lectura</b>.'
    ] },
    'c3-explora': { min: 7, puntos: [
      'Pide las 4 experiencias de la guía.',
      'Verifica en el chat: el span de −20 a 180 °C es <b>200 °C</b>.',
      'Avisa "1 minuto" → <b>Siguiente</b>.'
    ] },
    'c3-reto': { min: 9, puntos: [
      '"Cada uno tiene un transmisor distinto: calculen span, error máximo, error en % y digan si cumple."',
      'Recuerda: el % se calcula <b>sobre el span</b>; no redondear de más.',
      'En la pizarra, los errores típicos aparecen en la pregunta c).'
    ] },
    'c3-revisa': { min: 5, puntos: [
      'Comenta los resultados en pantalla.',
      'Resuelve uno genérico: 0–10 bar, ±0,5 % → ±0,05 bar. Patrón 5,00 bar, indica 5,04 → 0,04 ÷ 10 × 100 = 0,4 % ≤ 0,5 % → <b>cumple</b>.',
      'Error frecuente: dividir entre la lectura o entre el URV en vez del span.'
    ] },
    integrador: { min: 20, puntos: [
      '"Reto final que junta todo lo de hoy; vale <b>20 puntos</b>."',
      'Sugiere resolver por partes: 1–2 identificar, 3–5 medición, 6 cálculo de tiempo.',
      'Da 15 minutos; avisa a los 12.',
      'Mira la pizarra para decidir qué parte explicar en la revisión.'
    ] },
    'integrador-revisa': { min: 7, puntos: [
      'Comenta los resultados.',
      'Resuelve la parte 6 genérica: velocidad = ΔQ × 6 ÷ A (cm/min); tiempo = altura que baja ÷ velocidad.',
      'Pregunta: <b>"¿qué fue lo más difícil hoy?"</b> Anota para la Sesión 2.'
    ] },
    cierre: { min: 8, puntos: [
      'Repasa las 4 ideas que aparecen en pantalla.',
      'Cada estudiante ve su puntaje de hoy en su dispositivo.',
      'Anuncia la <b>Sesión 2 (martes 29/09, 20:00)</b>: sensores de temperatura y presión. Pide traer un ejemplo de su trabajo.',
      'Recuerda el <b>modo repaso</b> para estudiar después.',
      'Después de clase: <b>Reporte → Descargar para Excel</b>.'
    ] }
  };
  II.SESIONES['ii-s1'].pasos.forEach((p) => { p.guion = GUION[p.id]; });

  II.OPCIONES_INGRESO = {
    area: ['Minería', 'Petróleo y gas', 'Alimentos y bebidas', 'Energía eléctrica', 'Manufactura / industria', 'Agua y saneamiento', 'Construcción', 'Docencia / investigación', 'Estudiante', 'Otro'],
    experiencia: ['Nunca he trabajado con instrumentos', 'Un poco (los he visto o usado a veces)', 'Trabajo con ellos con frecuencia']
  };
})();
