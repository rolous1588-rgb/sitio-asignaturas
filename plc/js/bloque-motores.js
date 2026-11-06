// ============================================================
// Material nuevo (06/11/2026, última clase): práctica de los dos motores y una introducción a las interfaces industriales.
// Bloque I (ciclo 9): GRAFCET con ramas simultáneas, ecuaciones SET/RESET y diagrama escalera; 12 preguntas rápidas.
// Bloque J (ciclo 10): pantalla HMI, tags y comunicación Modbus; 5 preguntas rápidas.
// Va antes del cierre. Se carga después de bloque-ecuaciones.js, diagramas-motores.js y diagramas-interfaz.js.
// ============================================================
(function () {
  const II = window.II;
  const S = II.SESIONES['pl-s1'];
  if (!S || !II.diagramas.motores || S.pasos.some((p) => p.id === 'm-panel')) return;
  const ob = (t) => Array.from(String(t)).map((c) => c + '\u0305').join(''); // barra encima (texto plano)
  const oh = (t) => '<span style="text-decoration:overline;text-decoration-thickness:1.5px">' + t + '</span>';
  const og = (t) => '<span style="display:inline-block;border-top:1.5px solid currentColor;padding-top:6px;line-height:1.2;margin-top:3px">' + t + '</span>';
  const rap = (id, ciclo, t, o, c, por) => ({ id, tipo: 'rapida', ciclo, titulo: 'Pregunta rápida', t, o, c, por });

  const nuevos = [
    // ---------------- Bloque I ----------------
    { id: 'm-panel', tipo: 'explica', ciclo: 9, titulo: 'Bloque I · El ejercicio de los dos motores', diagrama: 'motores', pestana: 'grafcet',
      ideas: [
        'Dos motores trabajan juntos: el <b>motor A (KA)</b> y el <b>motor B (KB)</b>. Se manejan con cinco pulsadores: <b>PA</b> arranca; <b>PP</b> es el paro; <b>P1</b>, <b>P2</b> y <b>P3</b> son pasos de la secuencia.',
        'Los GRAFCET pueden tener <b>ramas simultáneas</b>: al pulsar PA se activan a la vez la rama izquierda (E1, E2, E3) y la derecha (E4, E5). La doble barra horizontal marca ese reparto.',
        'Más abajo, otra doble barra <b>espera</b> a que las dos ramas terminen (E3 y E5) antes de pasar a E6.',
        '<b>PP y P3 son normalmente cerrados</b>: valen 1 en reposo y 0 al pulsarlos. Por eso aparecen con barra en el GRAFCET.'
      ] },
    rap('rm1', 9, 'En este GRAFCET, ¿qué ocurre cuando se pulsa PA estando en E0?',
      ['Se activan a la vez E1 y E4', 'Se activa solo E1', 'Se activa E1 y 8 s después E4', 'Se activa E4 y luego E1'], 0,
      'La doble barra después de PA reparte la ejecución en dos ramas simultáneas: E1 y E4 se activan en el mismo instante.'),
    rap('rm2', 9, '¿Cuándo funciona el motor A (KA)?',
      ['Cuando E1 o E3 están activas', 'Solo cuando E1 está activa', 'Cuando E1 y E3 están activas a la vez', 'Durante todo el ciclo'], 0,
      'KA está asociado a las etapas 1 y 3. Se enciende en cualquiera de las dos: KA = E1 + E3.'),
    rap('rm3', 9, '¿Qué significa la doble barra horizontal que está antes de la etapa 6?',
      ['Se espera a que E3 y E5 estén activas antes de seguir', 'Se pasa a E6 en cuanto termina una rama', 'Se reparte la ejecución en dos ramas', 'La secuencia vuelve a E0'], 0,
      'Es una convergencia: la transición se cumple solo si las dos ramas llegaron al final (E3 y E5) y se da la condición de paso (P2).'),
    rap('rm4', 9, 'El paro aparece como PP con barra encima en el GRAFCET. ¿Qué indica?',
      ['Que se pulsó el paro: PP es normalmente cerrado y vale 0 al pulsarlo', 'Que el paro es un pulsador normalmente abierto', 'Que el paro no se usa en esta etapa', 'Que el paro se pulsa dos veces'], 0,
      'Con PP normalmente cerrado, en reposo vale 1 y al pulsarlo vale 0. La barra (negación) escribe esa condición: «paro pulsado».'),
    { id: 'm-eq', tipo: 'explica', ciclo: 9, titulo: 'Bloque I · Las ecuaciones de los dos motores', diagrama: 'motores', pestana: 'ecuaciones',
      ideas: [
        'El método es el mismo: <b>SET = etapa anterior · condición</b>; <b>RESET = etapa siguiente + paro</b>; se niega el RESET y se aplica De Morgan.',
        'Ejemplo de la etapa 3, paso a paso: <b>SE3 = E2 · T1</b> (T1 es el temporizador de 8 s); <b>RE3 = E6 + ' + oh('PP') + '</b> (solo la apagan E6 o el paro); se niega todo el RESET: <b>' + oh('RE3') + ' = ' + og('E6 + ' + oh('PP')) + '</b>; con De Morgan: <b>' + oh('RE3') + ' = ' + oh('E6') + ' · PP</b>.',
        'La etapa 6 espera a las dos ramas: <b>SE6 = E3 · E5 · P2</b>. Su RESET es <b>RE6 = ' + oh('P3') + '</b> y, negado, la doble barra se cancela: <b>' + oh('RE6') + ' = P3</b>.',
        'La <b>etapa 0</b> es especial: está activa cuando <b>ninguna otra etapa</b> lo está.',
        'Mantén presionados los botones y mira los valores de cada ecuación cambiar junto a las etapas.'
      ] },
    rap('rm5', 9, '¿Cuál es el SET de la etapa 3?',
      ['SE3 = E2 · T1', 'SE3 = E3 · E5', 'SE3 = E1 · P1', 'SE3 = E2 · P2'], 0,
      'E3 viene de E2 y la transición es el temporizador T1 (8 s): SE3 = E2 · T1.'),
    rap('rm6', 9, 'El RESET de la etapa 1 es RE1 = E2 + ' + ob('PP') + '. Se niega todo (barra larga sobre la suma) y se aplica De Morgan: ¿cuánto vale ' + ob('RE1') + '?',
      [ob('E2') + ' · PP', ob('E2') + ' + PP', 'E2 · ' + ob('PP'), ob('E2') + ' · ' + ob('PP')], 0,
      'La barra larga se reparte y la suma pasa a producto: queda ' + ob('E2') + ' y la negación de ' + ob('PP') + ', que se cancela y deja PP. Resultado: ' + ob('E2') + ' · PP.'),
    rap('rm7', 9, 'A la etapa 3 solo la apagan E6 o el paro. ¿Cuál es su RESET negado?',
      [ob('E6') + ' · PP', ob('E6') + ' + PP', 'E6 · ' + ob('PP'), ob('E5') + ' · PP'], 0,
      'RE3 = E6 + ' + ob('PP') + '. Negado y con De Morgan: ' + ob('E6') + ' · PP.'),
    rap('rm8', 9, '¿Cuál es el SET de la etapa 6?',
      ['SE6 = E3 · E5 · P2', 'SE6 = E3 + E5 + P2', 'SE6 = E3 · P2', 'SE6 = E5 · P3'], 0,
      'La convergencia exige que las dos ramas estén listas (E3 y E5) y que se cumpla la transición P2: se multiplican las tres.'),
    rap('rm9', 9, '¿Cómo se escribe la ecuación de la etapa inicial E0?',
      ['E0 = ' + ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'].map(ob).join(' · '), 'E0 = E1 + E2 + E3 + E4 + E5 + E6', 'E0 = ' + ob('E1') + ' + ' + ob('E2'), 'E0 = PA'], 0,
      'E0 no tiene SET ni RESET: está activa cuando todas las demás etapas están apagadas, por eso son seis contactos normalmente cerrados en serie.'),
    { id: 'm-esc', tipo: 'explica', ciclo: 9, titulo: 'Bloque I · El diagrama escalera de los dos motores', diagrama: 'motores', pestana: 'escalera',
      ideas: [
        'Son <b>11 escalones</b>: la etapa 0, las etapas 1 a 6, los temporizadores T1 y T2, y las salidas KA y KB.',
        'Cada etapa sigue el mismo molde: <b>SET</b> arriba en serie, <b>enclavamiento</b> en paralelo y <b>RESET negado</b> en serie, antes de la bobina.',
        'El temporizador de cada rama se pone <b>justo debajo de la etapa que lo activa</b>: T1 bajo la etapa 2 y T2 bajo la etapa 4.',
        '<b>KA</b> es una suma (E1 o E3) y por eso lleva dos contactos en <b>paralelo</b>; <b>KB</b> es un solo contacto.',
        'En el panel, los contactos que conducen se ponen verdes y las bobinas activas se iluminan.'
      ] },
    rap('rm10', 9, 'En el escalón de la etapa 3, ¿dónde va el contacto del temporizador T1?',
      ['En serie con E2, en el SET', 'En paralelo con la bobina E3', 'En serie con el contacto del paro', 'No se usa en ese escalón'], 0,
      'SE3 = E2 · T1: el producto es serie. T1 acompaña a E2 en la rama de arriba, y el contacto E3 en paralelo la mantiene.'),
    rap('rm11', 9, '¿Cómo se dibuja la salida KA = E1 + E3 en el escalera?',
      ['Dos contactos E1 y E3 en paralelo y la bobina KA', 'Dos contactos E1 y E3 en serie y la bobina KA', 'Un solo contacto E1 y la bobina KA', 'Un contacto E3 normalmente cerrado y la bobina KA'], 0,
      'La suma (o) se dibuja en paralelo: basta que E1 o E3 conduzca para energizar KA.'),
    { id: 'm-prueba', tipo: 'explora', ciclo: 9, titulo: 'Pruébalo: los dos motores en marcha', diagrama: 'motores', pestana: 'grafcet',
      guia: [
        'Mantén pulsado <b>PA</b> un instante: ¿qué etapas se activan? ¿Qué motor arranca primero?',
        'Espera 5 s y observa cuándo arranca el motor B. Después pulsa <b>P1</b> y mira qué pasa con el motor A.',
        'Con E3 y E5 activas pulsa <b>P2</b>: ¿qué ocurre con los dos motores?',
        'Pulsa <b>P3</b> para volver a E0. Prueba también <b>PP</b> en distintos momentos.',
        'Cambia entre <b>GRAFCET</b>, <b>Ecuaciones</b> y <b>Escalera</b>: es el mismo funcionamiento visto de tres formas.'
      ] },

    // ---------------- Bloque J ----------------
    { id: 'i-hmi', tipo: 'explica', ciclo: 10, titulo: 'Bloque J · La pantalla del operador (HMI)', diagrama: 'interfaz', pestana: 'hmi',
      ideas: [
        'Una <b>HMI</b> es la pantalla que usa el operador para ver el proceso y dar órdenes. <b>No hace la lógica</b>: lee y escribe variables del PLC.',
        'Aquí la pantalla muestra los motores, las etapas, el temporizador y una alarma. Sus botones <b>MARCHA</b> y <b>PARO</b> son virtuales: escriben PA y PP en el PLC.',
        'Un <b>SCADA</b> es lo mismo en grande: muchas pantallas, históricos y alarmas de toda la planta.',
        'Regla de seguridad: el <b>paro de emergencia</b> siempre es un pulsador físico cableado; la pantalla no lo reemplaza.'
      ] },
    rap('rt1', 10, '¿Qué hace una HMI respecto al PLC?',
      ['Lee y escribe variables del PLC; la lógica la ejecuta el PLC', 'Ejecuta la lógica de control en lugar del PLC', 'Reemplaza a los sensores y actuadores', 'Alimenta con energía a los motores'], 0,
      'La HMI muestra datos y envía órdenes escribiendo variables. El PLC es quien ejecuta el programa y gobierna los motores.'),
    rap('rt2', 10, 'Si la pantalla HMI se desconecta, ¿qué debe seguir funcionando?',
      ['El paro de emergencia físico cableado', 'Nada: todo depende de la pantalla', 'Solo el botón MARCHA de la pantalla', 'El historial de alarmas'], 0,
      'Las funciones de seguridad no dependen de una pantalla ni de una red. El paro de emergencia debe ser un pulsador físico cableado.'),
    { id: 'i-tags', tipo: 'explica', ciclo: 10, titulo: 'Bloque J · Tags y direcciones', diagrama: 'interfaz', pestana: 'tags',
      ideas: [
        'Cada dato de la pantalla es un <b>tag</b> ligado a una <b>dirección</b> del PLC: una bobina (un bit) o un registro (un número).',
        'Los bits que la HMI escribe (<b>MARCHA</b>, <b>PARO</b>) y los que lee (<b>MOTOR_A</b>, <b>ETAPA_1</b>) se distinguen en la tabla.',
        'Si la dirección está mal, la pantalla muestra <b>otro dato</b>: es uno de los errores más comunes al poner en marcha una HMI.',
        'Vuelve a la pestaña 1, mantén MARCHA y regresa aquí para ver los valores cambiar.'
      ] },
    rap('rt3', 10, 'Un tag de la HMI está ligado a una dirección equivocada del PLC. ¿Qué se ve en la pantalla?',
      ['Se muestra el valor de otra variable', 'La pantalla no enciende', 'El PLC deja de ejecutar el programa', 'Se borra el programa del PLC'], 0,
      'La HMI lee la dirección que se le indicó. Si es otra, mostrará el valor de esa variable, aunque el nombre del tag diga otra cosa.'),
    { id: 'i-modbus', tipo: 'explora', ciclo: 10, titulo: 'Bloque J · Así se comunican: Modbus', diagrama: 'interfaz', pestana: 'modbus',
      guia: [
        'Elige <b>Leer bobina (01)</b> y pulsa <b>Enviar</b>. Identifica en la petición el esclavo, la función, la dirección y la cantidad.',
        'Compara la <b>petición</b> con la <b>respuesta</b>: ¿qué campo trae el dato?',
        'Elige <b>Escribir bobina (05)</b> y pulsa Enviar: el valor <b>FF00</b> significa 1. Mira cómo arranca la maniobra.',
        'Elige <b>Leer registro (03)</b> mientras cuenta T1 y observa cómo el dato cambia de una lectura a otra.'
      ] },
    rap('rt4', 10, 'En Modbus, ¿quién inicia siempre la comunicación?',
      ['El maestro: pregunta y el esclavo responde', 'El esclavo, cada vez que cambia un dato', 'Cualquiera de los dos, sin orden', 'El motor conectado'], 0,
      'Modbus es maestro-esclavo: el maestro (la HMI o el SCADA) envía la petición y el esclavo (el PLC) responde. El esclavo nunca habla por su cuenta.'),
    rap('rt5', 10, 'En la función 05 (escribir una bobina), ¿qué significa el valor FF00?',
      ['Poner la bobina en 1', 'Poner la bobina en 0', 'Leer 255 bobinas', 'Una dirección de esclavo'], 0,
      'En Modbus, FF00 es el código de 1 (encender) y 0000 es el código de 0 (apagar) para la función 05.')
  ];
  const iCierre = S.pasos.findIndex((p) => p.id === 'cierre');
  S.pasos.splice(iCierre < 0 ? S.pasos.length : iCierre, 0, ...nuevos);
  const cierre = S.pasos.find((p) => p.id === 'cierre');
  if (cierre && cierre.ideas) {
    cierre.ideas.push('Un GRAFCET puede tener <b>ramas simultáneas</b> (doble barra): se activan juntas y la convergencia espera a todas. Las ecuaciones y el escalera siguen el mismo método: SET, RESET negado y enclavamiento.');
    cierre.ideas.push('La <b>HMI</b> lee y escribe variables del PLC; la comunicación (por ejemplo <b>Modbus</b>) es maestro-esclavo. El paro de emergencia siempre es físico.');
  }
  let k = 0;
  S.pasos.forEach((p) => { if (p.tipo === 'rapida') { k += 1; p.titulo = 'Pregunta rápida ' + k; } });

  // ---------- guion docente ----------
  const G = {
    'm-panel': { min: 8, objetivo: 'Que lean el GRAFCET de dos ramas simultáneas y entiendan el panel de pulsadores y motores.',
      pasos: ['<b>Haz:</b> muestra el panel: cinco pulsadores y dos motores. Señala que PP y P3 son normalmente cerrados.', '<b>Haz:</b> en <b>1 · GRAFCET</b> recorre con el dedo la rama izquierda (E1, E2, E3) y la derecha (E4, E5).', '<b>Di:</b> "La doble barra reparte: al pulsar PA arrancan las dos ramas a la vez. La otra doble barra espera a que las dos terminen."', '<b>Haz:</b> mantén pulsado PA un instante y muestra E1 y E4 encendidas.'],
      preguntas: ['<b>"¿Cuántas etapas se activan con PA?"</b> → Dos: E1 y E4.', '<b>"¿Qué motor arranca primero?"</b> → El A, por E1; el B arranca 5 s después.'],
      dudas: ['"¿Por qué PP tiene barra?" → Porque es normalmente cerrado: la barra escribe «paro pulsado».'],
      transicion: 'Toca <b>Siguiente</b> para las preguntas rápidas.' },
    rm1: { min: 2, puntos: ['Cierra la pregunta. Refuerza: la doble barra de reparto activa las dos ramas a la vez.'] },
    rm2: { min: 2, puntos: ['Cierra la pregunta. Refuerza: KA = E1 + E3.'] },
    rm3: { min: 2, puntos: ['Cierra la pregunta. Refuerza: la convergencia espera a todas las ramas.'] },
    rm4: { min: 2, puntos: ['Cierra la pregunta. Refuerza: PP y P3 son NC, valen 1 en reposo.'] },
    'm-eq': { min: 10, objetivo: 'Que reconozcan el SET, el RESET negado y la ecuación especial de E0 en este ejemplo.',
      pasos: ['<b>Haz:</b> abre <b>2 · Ecuaciones</b> y señala la columna SET y la columna RESET negado.', '<b>Di:</b> "Cada etapa: SET es etapa anterior por condición. El RESET es etapa siguiente más paro; se niega y se aplica De Morgan."', '<b>Haz:</b> mantén PA y muestra cómo cambian los valores de SE1 y SE4.', '<b>Di:</b> "La etapa 6 tiene tres elementos en el SET porque espera a las dos ramas."'],
      preguntas: ['<b>"¿Por qué E0 no tiene SET ni RESET?"</b> → Está activa cuando todas las demás están apagadas.', '<b>"¿Por qué P3 aparece sin barra en el RESET negado?"</b> → El RESET es ' + ob('P3') + ' (P3 pulsado vale 0); al negarlo la doble barra se cancela y queda P3.'],
      dudas: ['"¿Por qué las etapas 3 y 5 no se reinician por la otra rama?" → Solo las apaga E6 o el paro; así se acordó.'],
      transicion: 'Toca <b>Siguiente</b> para las preguntas rápidas.' },
    rm5: { min: 2, puntos: ['Cierra la pregunta. Refuerza: SE3 = E2 · T1.'] },
    rm6: { min: 2, puntos: ['Cierra la pregunta. Refuerza: De Morgan y doble barra cancelada.'] },
    rm7: { min: 2, puntos: ['Cierra la pregunta. Refuerza: la misma operación en la etapa 3.'] },
    rm8: { min: 2, puntos: ['Cierra la pregunta. Refuerza: tres factores en el SET de la convergencia.'] },
    rm9: { min: 2, puntos: ['Cierra la pregunta. Refuerza: E0 es la ausencia de todas las demás etapas.'] },
    'm-esc': { min: 8, objetivo: 'Que vean cada ecuación convertida en un escalón y reconozcan el molde SET + enclavamiento + RESET negado.',
      pasos: ['<b>Haz:</b> abre <b>3 · Escalera</b> y recorre los escalones con el dedo.', '<b>Di:</b> "Arriba el SET en serie; en paralelo el contacto con el nombre de la bobina; luego el RESET negado."', '<b>Haz:</b> mantén PA: los contactos que conducen se ponen verdes y las bobinas E1 y E4 se encienden.', '<b>Di:</b> "Cada temporizador va justo debajo de su etapa."'],
      preguntas: ['<b>"¿Cuál contacto es el enclavamiento?"</b> → El que tiene el mismo nombre que la bobina.', '<b>"¿Por qué KA lleva dos contactos en paralelo?"</b> → Porque KA = E1 + E3 (suma).'],
      dudas: [],
      transicion: 'Toca <b>Siguiente</b> para las preguntas rápidas.' },
    rm10: { min: 2, puntos: ['Cierra la pregunta. Refuerza: el producto es serie.'] },
    rm11: { min: 2, puntos: ['Cierra la pregunta. Refuerza: la suma es paralelo.'] },
    'm-prueba': { min: 8, objetivo: 'Que comprueben el funcionamiento completo en los tres formatos.',
      pasos: ['<b>Haz:</b> en el panel mantén PA y deja pasar 5 s para ver arrancar el motor B.', '<b>Haz:</b> pulsa P1 y luego espera 8 s; muestra el motor A volviendo a arrancar.', '<b>Haz:</b> con E3 y E5 activas pulsa P2 y después P3.', '<b>Haz:</b> usa PP en distintos momentos. Para acelerar, marca <b>Tiempo ×4</b>.'],
      preguntas: ['<b>"¿Qué pasa con PP en cualquier etapa?"</b> → Apaga todo y vuelve a E0.', '<b>"¿Por qué el motor A se apaga al pulsar P1?"</b> → Pasa de E1 a E2, que no tiene acción.'],
      dudas: [],
      transicion: 'Toca <b>Siguiente</b> para pasar al bloque de interfaces industriales.' },
    'i-hmi': { min: 7, objetivo: 'Que entiendan qué es una HMI y qué datos lee y escribe.',
      pasos: ['<b>Haz:</b> en <b>1 · Pantalla HMI</b> mantén MARCHA y muestra cómo se encienden los motores y se actualizan las etapas y el temporizador.', '<b>Haz:</b> mantén PARO: aparece la alarma y todo vuelve a E0.', '<b>Di:</b> "La pantalla no ejecuta la lógica: lee y escribe variables del PLC. Los botones son virtuales."', '<b>Di:</b> "El paro de emergencia, siempre físico y cableado."'],
      preguntas: ['<b>"¿Quién ejecuta la lógica?"</b> → El PLC.', '<b>"¿Qué es un SCADA?"</b> → Una HMI de toda la planta, con históricos y alarmas.'],
      dudas: ['"¿Se puede usar solo la pantalla para el paro?" → No para seguridad: debe ser un pulsador físico.'],
      transicion: 'Toca <b>Siguiente</b> para las preguntas rápidas.' },
    rt1: { min: 2, puntos: ['Cierra la pregunta. Refuerza: la HMI lee y escribe; el PLC ejecuta.'] },
    rt2: { min: 2, puntos: ['Cierra la pregunta. Refuerza: la seguridad no depende de la pantalla.'] },
    'i-tags': { min: 6, objetivo: 'Que relacionen cada tag con su dirección en el PLC y distingan lo que la HMI lee y lo que escribe.',
      pasos: ['<b>Haz:</b> abre <b>2 · Tags y direcciones</b> y señala cada columna.', '<b>Haz:</b> vuelve a la pestaña 1, mantén MARCHA y regresa a ver cambiar los valores.', '<b>Di:</b> "Si la dirección está mal, la pantalla muestra otro dato."'],
      preguntas: ['<b>"¿Qué tags escribe la HMI?"</b> → MARCHA y PARO.'],
      dudas: [],
      transicion: 'Toca <b>Siguiente</b> para la pregunta rápida.' },
    rt3: { min: 2, puntos: ['Cierra la pregunta. Refuerza: una dirección mal puesta muestra otro dato.'] },
    'i-modbus': { min: 8, objetivo: 'Que vean cómo se arma una petición y su respuesta en Modbus RTU y quién habla primero.',
      pasos: ['<b>Haz:</b> en <b>3 · Comunicación Modbus</b> elige <b>Leer bobina (01)</b> y pulsa Enviar.', '<b>Di:</b> "El maestro pregunta con esclavo, función, dirección y cantidad. El esclavo responde con el dato y el CRC."', '<b>Haz:</b> prueba <b>Escribir bobina (05)</b>: FF00 significa 1 y arranca la maniobra.', '<b>Haz:</b> prueba <b>Leer registro (03)</b> mientras T1 cuenta.'],
      preguntas: ['<b>"¿Quién inicia?"</b> → El maestro.', '<b>"¿Para qué sirve el CRC?"</b> → Detecta errores en la trama.'],
      dudas: ['"¿Por qué la dirección es 10 y no 11?" → Modbus cuenta desde 0.'],
      transicion: 'Toca <b>Siguiente</b> para la última pregunta rápida.' },
    rt4: { min: 2, puntos: ['Cierra la pregunta. Refuerza: maestro pregunta, esclavo responde.'] },
    rt5: { min: 2, puntos: ['Cierra la pregunta. Refuerza: FF00 = 1 y 0000 = 0.', 'Pasa al cierre de la clase.'] }
  };
  S.pasos.forEach((p) => { if (G[p.id]) p.guion = G[p.id]; });
})();
