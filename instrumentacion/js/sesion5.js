// ============================================================
// Sesión 5, día 6 — P&ID de la planta (ISA 5.1) y fallas del lazo · cierre del módulo
// Miércoles 07/10 · 20:00 (unos 55 min) · después: examen final (examen.html)
// Ciclo 1: P&ID · Ciclo 2: fallas del lazo con reto "Detective del lazo"
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  const V = (x, u = '') => `<span class="valor">${II.fmt(x, 3)}${u ? ' ' + u : ''}</span>`;
  const R = (id, ciclo, titulo, t, o, c, por) => ({ id, tipo: 'rapida', ciclo, titulo, t, o, c, por });

  const CAUSAS = [
    'Cable abierto o sin alimentación',
    'Transmisor saturado (el proceso pasó el URV)',
    'Escala del PLC distinta a la del transmisor',
    'Tensión insuficiente para la carga del lazo',
    'Ruido eléctrico (cable junto a fuerza o blindaje mal puesto)'
  ];
  const TAGS = [
    ['LIC-101', 'Controlador indicador de nivel'],
    ['FT-102', 'Transmisor de caudal'],
    ['TIC-103', 'Controlador indicador de temperatura'],
    ['PI-104', 'Indicador de presión'],
    ['LY-101', 'Convertidor (I/P) del lazo de nivel'],
    ['TE-103', 'Sensor (elemento primario) de temperatura'],
    ['LAH-101', 'Alarma de nivel alto']
  ];
  const UBIC = ['En campo, junto al proceso', 'En un tablero de la sala de control', 'En el sistema de control (DCS/PLC), en la pantalla del operador'];
  const SIMB = [['un círculo sin línea', 0], ['un círculo con una línea horizontal al medio', 1], ['un círculo dentro de un cuadrado', 2]];

  const retos = {
    'c2-reto': {
      titulo: 'Reto · Detective del lazo',
      puntos: 10,
      general: 'Cada estudiante recibe su propio lazo con una falla: calcula lo que debería mostrar el PLC, encuentra la causa del síntoma y lee el P&ID.',
      pista: 'Valor = LRV + (I − 4) ÷ 16 × span. Por debajo de 3,6 mA → falla del lazo; 20,5 mA fijos → saturación; mA correctos pero valor distinto en todo el rango → escala del PLC; se "achata" arriba → falta tensión; oscila con un motor → ruido. Primera letra = qué se mide; siguientes = qué hace.',
      errorComun: 'Dividir entre 20 en vez de entre 16, o pensar que si el PLC muestra mal, el transmisor está mal: primero se mide la corriente.',
      metodo: 'valor = (I − 4) ÷ 16 × URV · medir mA primero · < 3,6 mA falla · 20,5 mA saturado · mA bien y valor mal → escala · achatado arriba → tensión · oscila → ruido',
      generar(r) {
        const [tag, variable, u, urv] = II.elegir(r, [
          ['LT-101', 'nivel', 'm', II.elegir(r, [3, 4, 5])],
          ['TT-103', 'temperatura', '°C', II.elegir(r, [100, 150, 200])],
          ['PT-104', 'presión', 'bar', II.elegir(r, [6, 10, 16])],
          ['FT-102', 'caudal', 'm³/h', II.elegir(r, [50, 80, 120])]
        ]);
        const I = II.elegir(r, [6.4, 8, 9.6, 11.2, 13.6, 15.2, 17.6]);
        const pv = ((I - 4) / 16) * urv;
        const sint = II.elegir(r, [
          [`El PLC muestra falla en ${tag} y el multímetro en serie mide ${II.elegir(r, ['0', '1,2', '2,1'])} mA.`, 0],
          [`La lectura de ${tag} sube hasta un valor y se queda fija; el multímetro mide 20,5 mA aunque el proceso sigue subiendo.`, 1],
          [`El multímetro mide la corriente correcta, pero el PLC muestra ${tag} un ${II.elegir(r, ['25 % más alto', '20 % más bajo'])} que lo real, en todo el rango.`, 2],
          [`En valores bajos ${tag} mide bien, pero cerca del 100 % la corriente no pasa de ${II.elegir(r, ['16', '17', '18'])} mA.`, 3],
          [`La lectura de ${tag} oscila cada vez que arranca el agitador del tanque.`, 4]
        ]);
        const t = II.elegir(r, TAGS);
        const s = II.elegir(r, SIMB);
        return {
          enunciado: `
            <p><b>a)</b> El transmisor <b>${tag}</b> mide ${variable} de <b>0 a ${V(urv, u)}</b> y el multímetro en serie mide ${V(I, 'mA')}.</p>
            <p><b>b)</b> ${sint[0]}</p>
            <p><b>c)</b> En el P&amp;ID aparece el instrumento <b>${t[0]}</b>.</p>
            <p><b>d)</b> En el P&amp;ID, un instrumento está dibujado como <b>${s[0]}</b>.</p>`,
          campos: [
            { id: 'a', tipo: 'num', pregunta: `a) ¿Qué valor de ${variable} debería mostrar el PLC?`, unidad: u, tolRel: 0.02 },
            { id: 'b', tipo: 'select', pregunta: 'b) ¿Cuál es la causa más probable?', opciones: CAUSAS },
            { id: 'c', tipo: 'select', pregunta: `c) ¿Qué es ${t[0]}?`, opciones: TAGS.map((x) => x[1]) },
            { id: 'd', tipo: 'select', pregunta: 'd) ¿Dónde está ese instrumento?', opciones: UBIC }
          ],
          esperado: { a: pv, b: CAUSAS[sint[1]], c: t[1], d: UBIC[s[1]] },
          solucion: `
            <p><b>a)</b> (${II.fmt(I, 1)} − 4) ÷ 16 × ${urv} = <b>${II.fmt(pv, 2)} ${u}</b></p>
            <p><b>b) ${CAUSAS[sint[1]]}</b>: ${['menos de 3,6 mA (NAMUR NE 43) indica falla del lazo: se revisa continuidad y alimentación.', '20,5 mA fijos es la saturación: el proceso superó el URV; hay que re-rangear o cambiar el rango.', 'si los mA están bien, el transmisor está bien: lo que falla es la escala (LRV/URV) en el PLC. La prueba de lazo lo detecta.', 'a más corriente, más caída en la carga; si no queda la tensión mínima del transmisor, la salida no llega a 20 mA.', 'el ruido entra por el cable: separarlo de la fuerza (cruces a 90°) y conectar el blindaje a tierra solo del lado de la fuente.'][sint[1]]}</p>
            <p><b>c) ${t[1]}</b>: primera letra = qué se mide; siguientes = qué hace.</p>
            <p><b>d) ${UBIC[s[1]]}</b> (${s[0]}).</p>`
        };
      }
    }
  };

  II.SESIONES['ii-s5'] = {
    id: 'ii-s5',
    numero: '5, día 6',
    titulo: 'P&ID de la planta y fallas del lazo',
    fecha: 'Miércoles 07/10 · 20:00',
    siguiente: 'Examen final · hoy, al terminar la sesión',
    retos,
    diagnostico: [],
    pasos: [
      { id: 'inicio', tipo: 'espera', titulo: 'Sesión 5, día 6: el P&ID de la planta y las fallas del lazo' },

      // ---------------- Ciclo 1 · P&ID ----------------
      { id: 'c1-letras', tipo: 'explica', ciclo: 1, titulo: 'El P&ID y las letras ISA 5.1: qué mide y qué hace cada instrumento', diagrama: 'pidLetras',
        ideas: [
          'El <b>P&amp;ID</b> (diagrama de tuberías e instrumentación) es el plano de la planta: equipos, tuberías y <b>todos los instrumentos</b> con su TAG.',
          'La <b>primera letra</b> dice qué se mide: <b>L</b> nivel, <b>F</b> caudal, <b>T</b> temperatura, <b>P</b> presión.',
          'Las <b>letras siguientes</b> dicen qué hace: <b>T</b> transmite, <b>I</b> indica, <b>C</b> controla, <b>E</b> sensor, <b>V</b> válvula, <b>A</b> alarma (<b>H</b> alto, <b>L</b> bajo), <b>Y</b> convertidor.',
          'El <b>número</b> es el lazo: LT-101, LIC-101, LY-101 y LV-101 forman el lazo de nivel 101 del TK-100.'
        ] },
      R('q-p1', 1, 'Pregunta rápida · leer un TAG',
        'En el P&amp;ID del TK-100, ¿qué es <b>FT-102</b>?',
        ['Un transmisor de caudal del lazo 102', 'Un indicador de temperatura', 'Una válvula de caudal', 'Un controlador de nivel'], 0,
        'F = caudal (primera letra) y T = transmite. Es la placa orificio con su transmisor DP en la salida del tanque.'),
      { id: 'c1-simbolos', tipo: 'explica', ciclo: 1, titulo: 'Dónde está cada instrumento y cómo viaja la señal', diagrama: 'pidSimbolos',
        ideas: [
          'Círculo <b>sin línea</b> = instrumento <b>en campo</b>, junto al proceso (LT-101, TT-103, PT-104).',
          'Círculo <b>con una línea</b> = en un <b>tablero de la sala de control</b> (PI-104). Círculo <b>dentro de un cuadrado</b> = función del <b>DCS/PLC</b>, en la pantalla del operador (LIC-101, TIC-103, FI-102).',
          'Líneas: <b>gruesa continua</b> = tubería de proceso; <b>trazos</b> = señal eléctrica (4–20 mA); <b>con dos rayitas //</b> = señal neumática (aire).',
          'Seguir un lazo: <b>LT-101 → LIC-101 → LY-101 (I/P) → LV-101</b>. El I/P convierte los 4–20 mA en aire de 3–15 psi para mover la válvula.'
        ] },
      R('q-p2', 1, 'Pregunta rápida · símbolo',
        'LIC-101 está dibujado como un <b>círculo dentro de un cuadrado</b>. ¿Qué significa?',
        ['Es una función del sistema de control (DCS/PLC) que el operador ve en su pantalla', 'Está montado en campo, junto al tanque', 'Es una válvula', 'Está fuera de servicio'], 0,
        'Círculo en cuadrado = pantalla compartida del DCS/PLC. El controlador ya no es un aparato aparte: es software.'),
      { id: 'c1-explora', tipo: 'explora', ciclo: 1, titulo: 'Explora el P&ID del TK-100', diagrama: 'pid',
        guia: [
          'Toca <b>LIC-101</b>: ¿qué instrumentos forman su lazo? Sigue la señal desde el tanque hasta la válvula.',
          '¿Cuál es la única línea <b>neumática</b> del dibujo? ¿Por qué no es eléctrica?',
          'Toca <b>FI-102</b>: ¿ese lazo controla algo o solo indica?',
          '¿Qué instrumento ve el operador en un <b>tablero</b> y no en la pantalla del DCS?'
        ] },

      // ---------------- Ciclo 2 · Fallas del lazo ----------------
      { id: 'c2-fallas', tipo: 'explica', ciclo: 2, titulo: 'Diagnóstico de fallas del lazo: primero se mide la corriente', diagrama: 'lazo420',
        ideas: [
          'Regla de oro: con un multímetro <b>en serie</b>, se mide la corriente. Si los mA están bien, el transmisor está bien y el problema está en el PLC o en la escala.',
          '<b>Menos de 3,6 mA</b> (NAMUR NE 43): falla del lazo, como cable abierto, sin alimentación o transmisor dañado. <b>20,5 mA fijos</b>: el transmisor se saturó (el proceso pasó el URV).',
          '<b>mA correctos pero valor distinto en todo el rango</b>: la escala (LRV/URV) del PLC no coincide con la del transmisor. <b>Se achata arriba</b> (no llega a 20 mA): falta tensión para la carga del lazo.',
          '<b>Oscila cuando arranca un motor</b>: ruido eléctrico. Se separa la señal de la fuerza y el blindaje va a tierra en un solo extremo.'
        ] },
      R('q-f1', 2, 'Pregunta rápida · falla del lazo',
        'El PLC marca falla en LT-101 y el multímetro en serie mide <b>0 mA</b>. ¿Qué es lo más probable?',
        ['El lazo está abierto (cable cortado o borne suelto) o sin alimentación', 'El tanque está vacío', 'El transmisor está saturado', 'La escala del PLC está mal'], 0,
        'Con "cero vivo", un tanque vacío daría 4 mA. Con 0 mA no circula corriente: el lazo está abierto o sin fuente.'),
      R('q-f2', 2, 'Pregunta rápida · ruido',
        'La temperatura TT-103 oscila cada vez que arranca el agitador. El cable de señal va en la misma bandeja que el del motor. ¿Qué haces?',
        ['Separar la señal de los cables de fuerza y revisar que el blindaje vaya a tierra en un solo extremo', 'Cambiar la Pt100', 'Hacer un re-rango del transmisor', 'Subir la fuente a 48 V'], 0,
        'Es ruido eléctrico que entra por el cable: se corrige con el cableado, no con el instrumento.'),
      { id: 'c2-explora', tipo: 'explora', ciclo: 2, titulo: 'Explora las fallas del lazo', diagrama: 'lazo420',
        guia: [
          'Elige <b>"Cable cortado"</b>: ¿cuánto marca el multímetro y qué muestra el PLC?',
          'Sube el <b>largo del cable</b> y la resistencia del PLC a <b>750 Ω</b>, y lleva la variable al 100 %: ¿llega a 20 mA?',
          'Activa la <b>interferencia</b>: ¿qué le pasa a la lectura?',
          'Pestaña de <b>escalado</b>: si el PLC está escalado de 0 a 5 m y el transmisor de 0 a 4 m, ¿qué muestra con 12 mA?'
        ] },
      { id: 'c2-reto', tipo: 'reto', ciclo: 2, titulo: 'Reto · Detective del lazo', reto: 'c2-reto' },
      { id: 'c2-revisa', tipo: 'revisa', ciclo: 2, titulo: 'Revisión del reto', reto: 'c2-reto' },

      { id: 'cierre', tipo: 'cierre', titulo: 'Cierre del módulo y examen final',
        ideas: [
          'Medimos <b>temperatura, presión, nivel y flujo</b>, llevamos la señal en <b>4–20 mA</b>, la calibramos con trazabilidad y la dibujamos en el <b>P&amp;ID</b> con ISA 5.1.',
          'Ante una falla: <b>primero se mide la corriente</b>. Desde ahí se decide si el problema está en el transmisor, en el cable o en el PLC.',
          'Pendientes: el <b>Control de estudio</b> cierra el <b>jueves 08/10 a las 23:59</b>, y el <b>foro</b> en Moodle.',
          'Ahora: <b>examen final</b> (20 preguntas, un intento). Entra aquí con tu mismo carnet: <a href="examen.html"><b>examen.html</b></a>'
        ] }
    ]
  };

  // ---------- Guion docente ----------
  const rapida = (lectura, comenta) => ({ min: 2,
    objetivo: 'Verificar en el momento si la idea anterior quedó clara (1 punto).',
    pasos: [
      '<b>Di:</b> "Pregunta rápida, vale un punto." Léela: ' + lectura,
      '<b>Haz:</b> con ~80 % de respuestas (o al minuto), toca <b>⏱ Cerrar pregunta</b>: 15 s más y aparecen las barras en Zoom.',
      '<b>Di:</b> ' + comenta
    ],
    transicion: 'Comentada la respuesta, toca <b>Siguiente</b>.' });
  const GUION = {
    inicio: { min: 3,
      objetivo: 'Que todos entren con su carnet y sepan que hoy cierra el módulo con el examen.',
      pasos: [
        '<b>Haz:</b> comparte en Zoom la presentación y pega en el chat el enlace de estudiantes.',
        '<b>Di:</b> "Buenas noches, último día. Hoy juntamos todo en el plano de la planta, el P&amp;ID, y aprendemos a encontrar fallas del lazo. Son unos 50 minutos y después rendimos el examen final aquí mismo."',
        '<b>Di:</b> "Mismo carnet de siempre. Hay 4 preguntas rápidas y un reto."'
      ],
      transicion: 'Con la mayoría conectada → <b>Siguiente</b>.' },
    'c1-letras': { min: 7,
      objetivo: 'Que lean cualquier TAG: primera letra = variable, siguientes = función, número = lazo.',
      pasos: [
        '<b>Haz:</b> en Zoom, el diagrama abre en la pestaña <b>Letras</b>. Recorre la tabla.',
        '<b>Di:</b> "El P&amp;ID es el idioma común entre proceso, instrumentación y operación. Si saben leer las letras, saben qué hace cada instrumento sin preguntar."',
        '<b>Haz:</b> toca la pestaña <b>Instrumento</b> y toca <b>LT-101</b>, después <b>LIC-101</b>: "mismo número, mismo lazo".',
        '<b>Pregunta al grupo:</b> "¿Qué sería PSH?" → interruptor (switch) de presión alta. "¿Y TE?" → el sensor de temperatura.'
      ],
      dudas: ['"¿La L siempre es nivel?" → como primera letra, sí; como modificador después de una A o S, es "bajo" (LAL = alarma de nivel bajo).'],
      transicion: '→ <b>Siguiente</b> (pregunta rápida).' },
    'q-p1': rapida('"¿Qué es FT-102?"', '"F caudal, T transmite: el transmisor de caudal de la salida."'),
    'c1-simbolos': { min: 6,
      objetivo: 'Distinguir campo, tablero y DCS, y los tipos de línea de señal.',
      pasos: [
        '<b>Haz:</b> la pestaña <b>Símbolos</b> muestra los tres círculos y las tres líneas.',
        '<b>Di:</b> "Sin línea, en campo; con línea, en un tablero; en un cuadrado, es software del DCS o PLC y el operador lo ve en pantalla."',
        '<b>Haz:</b> toca <b>LY-101</b> y muestra la línea con <b>//</b>: "es aire, 3 a 15 psi; el I/P traduce los mA a aire para la válvula".',
        '<b>Haz:</b> toca <b>PI-104</b>: es el único en tablero.'
      ],
      transicion: '→ <b>Siguiente</b> (pregunta rápida).' },
    'q-p2': rapida('"¿Qué significa un círculo dentro de un cuadrado?"', '"Es una función del DCS o PLC; el controlador hoy es software."'),
    'c1-explora': { min: 5,
      objetivo: 'Que cada uno siga un lazo completo en su propio dispositivo.',
      pasos: [
        '<b>Di:</b> "Tres minutos: toquen los instrumentos y respondan la guía."',
        '<b>Pregunta al grupo</b> al final: "¿Cuál es el elemento final del lazo 101?" → LV-101. "¿El lazo 102 controla?" → no, solo indica.'
      ],
      transicion: '→ <b>Siguiente</b> (fallas).' },
    'c2-fallas': { min: 7,
      objetivo: 'Que diagnostiquen fallas del lazo empezando por medir la corriente.',
      pasos: [
        '<b>Di:</b> "Cuando el operador dice «el nivel marca mal», ¿por dónde empiezan? Por el multímetro en serie: los mA dicen de qué lado está el problema."',
        '<b>Haz:</b> en el diagrama, elige <b>Cable cortado</b>: 0 mA y alarma. Luego <b>Alarma alta</b>.',
        '<b>Haz:</b> sube el largo del cable y la carga a 750 Ω y lleva la variable al 100 %: no llega a 20 mA (falta tensión).',
        '<b>Haz:</b> activa la <b>interferencia</b> y recuerda el blindaje a tierra en un solo extremo.'
      ],
      dudas: ['"¿Y si el PLC muestra otro valor pero los mA están bien?" → escala del PLC distinta: pestaña de escalado.'],
      transicion: '→ <b>Siguiente</b> (preguntas rápidas).' },
    'q-f1': rapida('"0 mA en LT-101, ¿qué pasa?"', '"Tanque vacío serían 4 mA. Con 0 mA no circula corriente: cable abierto o sin fuente."'),
    'q-f2': rapida('"La temperatura oscila cuando arranca el agitador…"', '"Es ruido: se arregla en el cableado, no cambiando el sensor."'),
    'c2-explora': { min: 4,
      objetivo: 'Que provoquen cada falla y vean su síntoma.',
      pasos: ['<b>Di:</b> "Tres minutos con la guía. Fíjense qué marca el multímetro en cada falla."'],
      transicion: '→ <b>Siguiente</b> (reto).' },
    'c2-reto': { min: 8,
      objetivo: 'Aplicar todo en un lazo propio: valor esperado, causa de la falla, TAG y símbolo (10 pts).',
      pasos: [
        '<b>Di:</b> "Reto de 10 puntos, cada uno con su lazo. Tienen 6 minutos; hay segundo intento."',
        '<b>Haz:</b> mira "Enviaron". A los 6–7 minutos toca <b>⏱ Cerrar reto</b> (30 s).'
      ],
      transicion: 'Cerrado el reto → <b>Siguiente</b> (revisión).' },
    'c2-revisa': { min: 4,
      objetivo: 'Revisar el método de diagnóstico con los errores más comunes.',
      pasos: [
        '<b>Haz:</b> en Zoom aparecen los resultados; comenta el método.',
        '<b>Di:</b> "Siempre: medir mA → comparar con lo esperado → decidir si es transmisor, cable o PLC."'
      ],
      transicion: '→ <b>Siguiente</b> (cierre).' },
    cierre: { min: 4,
      objetivo: 'Cerrar el módulo y pasar al examen.',
      pasos: [
        '<b>Haz:</b> lee las 4 ideas. Recuerda el Control de estudio (jueves 23:59) y el foro.',
        '<b>Haz:</b> deja la clase en este paso (fuera del reto) y toca <b>"Abrir toda la sesión"</b> para el repaso.',
        '<b>Haz:</b> abre el panel del examen (<b>Examen final</b> en la lista de sesiones) y toca <b>▶ Abrir el examen</b>. Pega en el chat el enlace del examen.',
        '<b>Di:</b> "20 preguntas, un intento, con su mismo carnet. Les aviso antes de cerrar con la cuenta regresiva."'
      ] }
  };
  II.SESIONES['ii-s5'].pasos.forEach((p) => { p.guion = GUION[p.id]; });
})();
