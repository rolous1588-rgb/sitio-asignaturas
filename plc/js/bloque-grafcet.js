// ============================================================
// Material nuevo (03/11/2026): Bloque F · GRAFCET (etapas, transiciones y reglas de evolución).
// Se inserta después de la revisión del Reto E (g-revisa). El enclavamiento pasa a ser el Bloque G.
// Se carga después de bloque-campo.js y diagramas-grafcet.js.
// ============================================================
(function () {
  const II = window.II;
  const PL = (II.pl = II.pl || {});
  const S = II.SESIONES['pl-s1'];
  if (!S || !PL.grafcet || S.pasos.some((p) => p.id === 'h-que')) return;
  const GF = PL.grafcet;

  // ---------- Reto F · Lee el GRAFCET ----------
  const OPC = ['0', '1', '2', '3', '1 y 2'];
  const ALTERN = ['Etapa, transición, etapa', 'Etapa, etapa, transición', 'Transición, transición, etapa', 'Etapa, transición, transición'];
  const txt = (a) => a.join(' y ');
  const retoH = {
    titulo: 'Reto F · Lee el GRAFCET',
    puntos: 10,
    general: 'Cada estudiante recibe un GRAFCET distinto (simultáneo o de selección) con las transiciones rotuladas con letras: predice qué etapas quedan activas aplicando las reglas de evolución.',
    pista: 'Una transición solo se franquea si está validada (todas sus etapas anteriores están activas) y se presiona. Si se presiona sin estar validada, no pasa nada.',
    errorComun: 'Creer que presionar una transición siempre cambia de etapa, o que en una divergencia en O se activan las dos ramas.',
    metodo: 'Validada + presionada = franqueo | franquear desactiva las etapas anteriores y activa las siguientes | doble barra: simultáneas; línea simple: selección | alternancia: etapa, transición, etapa',
    generar(r) {
      const tipoY = r() < 0.5;
      const base = GF.escenas.reglas[tipoY ? 2 : 3];
      const letras = II.mezclar(r, ['K', 'L', 'M', 'N', 'P', 'R']).slice(0, 4);
      const map = { A: letras[0], B: letras[1], C: letras[2], D: letras[3] };
      const sc = JSON.parse(JSON.stringify(base));
      sc.sinVal = true;
      sc.trans.forEach((t) => { t.in = map[t.in]; });
      const a0 = GF.inicial(sc);
      const press = (act, ins) => { const inp = {}; ins.forEach((i) => { inp[i] = 1; }); return txt(GF.activos(sc, GF.evolucionar(sc, act, inp).act)); };
      let ins1, ins2, noVal, escenaTxt;
      if (tipoY) { ins1 = map.A; ins2 = map.B; noVal = map.B; }
      else { const ram = r() < 0.5; ins1 = ram ? map.A : map.B; ins2 = ram ? map.C : map.D; noVal = ram ? map.D : map.C; }
      const e1 = press(a0, [ins1]);
      const aDespues = GF.evolucionar(sc, a0, { [ins1]: 1 }).act;
      const e2 = press(a0, [tipoY ? map.B : noVal]);
      const e3 = press(aDespues, [ins2]);
      const tipoTxt = tipoY ? 'Divergencia en Y (etapas simultáneas)' : 'Divergencia en O (selección)';
      const tipos = ['Divergencia en Y (etapas simultáneas)', 'Divergencia en O (selección)'];
      escenaTxt = `<div class="lienzo" style="margin:8px 0">${GF.svgEstatico(sc, a0)}</div>`;
      return {
        enunciado: `<p>Este GRAFCET está en su situación inicial (etapa 0 activa). Las letras son las condiciones de las transiciones. Cada pregunta parte de lo indicado; aplica las reglas de evolución.</p>${escenaTxt}`,
        campos: [
          { id: 'a', tipo: 'select', pregunta: `a) Desde la situación inicial se presiona la transición ${ins1}. ¿Qué etapas quedan activas?`, opciones: OPC },
          { id: 'b', tipo: 'select', pregunta: `b) Desde la situación inicial se presiona la transición ${tipoY ? map.B : noVal} (y nada más). ¿Qué etapas quedan activas?`, opciones: OPC },
          { id: 'c', tipo: 'select', pregunta: `c) Después del caso a), se presiona la transición ${ins2}. ¿Qué etapas quedan activas?`, opciones: OPC },
          { id: 'd', tipo: 'select', pregunta: 'd) ¿Qué tipo de estructura tiene este GRAFCET?', opciones: tipos },
          { id: 'e', tipo: 'select', pregunta: 'e) ¿Cuál de estas secuencias respeta la regla de alternancia?', opciones: II.mezclar(r, ALTERN) }
        ],
        esperado: { a: e1, b: e2, c: e3, d: tipoTxt, e: ALTERN[0] },
        solucion: `
          <p><b>a) ${e1}.</b> ${tipoY ? 'La transición está validada (la etapa 0 está activa): al franquearse se activan las dos etapas a la vez.' : 'Está validada y se franquea: solo se activa la etapa de esa rama.'}</p>
          <p><b>b) ${e2}.</b> No está validada: faltan etapas anteriores activas, así que no pasa nada.</p>
          <p><b>c) ${e3}.</b> ${tipoY ? 'La transición de la doble barra inferior necesita que las dos etapas estén activas; lo están, y se activa la etapa 3.' : 'La transición de esa rama está validada y se franquea: se activa la etapa 3.'}</p>
          <p><b>d) ${tipoTxt}.</b> ${tipoY ? 'Tiene dobles barras: las ramas son simultáneas.' : 'Tiene una línea simple que se abre en ramas: se elige una sola.'}</p>
          <p><b>e) ${ALTERN[0]}.</b> Entre dos etapas siempre hay una transición, y entre dos transiciones, una etapa.</p>`
      };
    }
  };
  S.retos['h-reto'] = retoH;

  // ---------- Pasos ----------
  const rap = (id, ciclo, t, o, c, por) => ({ id, tipo: 'rapida', ciclo, titulo: 'Pregunta rápida', t, o, c, por });
  const nuevos = [
    { id: 'h-que', tipo: 'explica', ciclo: 6, titulo: 'Bloque F · GRAFCET: etapas, transiciones y acciones', diagrama: 'grafcet', pestana: 'nivel1',
      ideas: [
        'El <b>GRAFCET</b> describe un automatismo como una <b>secuencia</b>: etapas (cuadros) separadas por transiciones (rayitas).',
        'Una <b>etapa</b> es un estado de la máquina; la inicial lleva cuadrado doble. Solo las etapas activas ejecutan sus <b>acciones</b> (el rectángulo a la derecha).',
        'Una <b>transición</b> lleva una <b>condición</b>: cuando se cumple, la etapa anterior se apaga y se activa la siguiente.',
        'En el <b>nivel 1</b> las condiciones se escriben con palabras: «pulsador de arranque (NA)», «pulsador de paro (NC)».'
      ] },
    rap('rh1', 6, 'En un GRAFCET, la etapa 0 (inicial) está activa y se presiona el pulsador de arranque. ¿Qué pasa?',
      ['Se activa la etapa 1 y se apaga la etapa 0', 'Se activan las etapas 0 y 1 a la vez', 'No pasa nada hasta soltar el pulsador', 'Se activa la acción sin cambiar de etapa'], 0,
      'La transición está validada y su condición se cumple: se franquea. Se desactiva la etapa anterior y se activa la siguiente.'),
    { id: 'h-simbolos', tipo: 'explica', ciclo: 6, titulo: 'Bloque F · GRAFCET nivel 2: con las variables del PLC', diagrama: 'grafcet', pestana: 'nivel2',
      ideas: [
        'En el <b>nivel 2</b> las condiciones se escriben con los <b>símbolos</b> del programa: PA para el arranque y PP para el paro.',
        'PA es un pulsador <b>NA</b>: en reposo su bit vale 0 y al pulsarlo vale 1.',
        'PP es un pulsador <b>NC</b>: en reposo su bit vale <b>1</b> y al pulsarlo baja a 0. Por eso la condición de paro es <b>PP negado</b> (con la barrita arriba): se cumple cuando PP vale 0.',
        'Es la misma secuencia que el nivel 1; cambia solo cómo se escribe la condición.'
      ] },
    rap('rh2', 6, 'El paro es un pulsador NC con el bit PP. En reposo (sin pulsar), ¿cuánto vale PP y se cumple la condición de PP negado?',
      ['PP = 1 y no se cumple PP negado', 'PP = 0 y se cumple PP negado', 'PP = 1 y se cumple PP negado', 'PP = 0 y no se cumple PP negado'], 0,
      'El NC en reposo deja pasar corriente: PP = 1. PP negado vale 0 y no se cumple; se cumplirá al pulsar el paro, cuando PP baje a 0.'),
    { id: 'h-reglas', tipo: 'explica', ciclo: 6, titulo: 'Bloque F · Las reglas de evolución del GRAFCET', diagrama: 'grafcet', pestana: 'reglas',
      ideas: [
        '<b>Regla 1:</b> la situación inicial son las etapas iniciales activas. <b>Regla 2:</b> una transición se <b>franquea</b> si está <b>validada</b> (etapas anteriores activas) y su condición se cumple.',
        '<b>Regla 3:</b> al franquearse, se desactivan <b>todas</b> las etapas anteriores y se activan <b>todas</b> las siguientes. Con una doble barra, las ramas son simultáneas.',
        'Una transición con la condición cumplida pero <b>sin estar validada</b> no hace nada: no se pueden saltar etapas.',
        'En la divergencia en Y, la doble barra de abajo espera que <b>todas</b> las etapas anteriores estén activas.'
      ] },
    rap('rh3', 6, 'Una transición tiene la condición cumplida, pero la etapa anterior está inactiva. ¿Qué ocurre?',
      ['Se franquea y activa la siguiente etapa', 'No se franquea: no está validada', 'Se franquea al soltar la condición', 'Se activa la etapa inicial'], 1,
      'Para franquearse, una transición debe estar validada (etapas anteriores activas) y tener su condición cumplida.'),
    { id: 'h-o', tipo: 'explica', ciclo: 6, titulo: 'Bloque F · Selección (O) y alternancia', diagrama: 'grafcet', pestana: 'reglas4',
      ideas: [
        'En una <b>divergencia en O</b> el camino se abre en ramas con una línea simple; cada rama empieza con su propia transición (A o B) y <b>solo una</b> se franquea: las condiciones deben ser excluyentes.',
        'Las ramas se reúnen otra vez (C y D llevan a la misma etapa).',
        '<b>Alternancia:</b> entre dos etapas siempre hay una transición y entre dos transiciones siempre hay una etapa. Nunca dos seguidas.',
        'Si el GRAFCET incumple la alternancia, no se puede leer bien: es un error de construcción.'
      ] },
    rap('rh4', 6, 'Desde la etapa 0 salen dos ramas con las transiciones A y B (divergencia en O). ¿Cuándo se activan las dos etapas siguientes a la vez?',
      ['Cuando A y B se presionan juntas', 'Nunca: en una divergencia en O se elige una sola rama', 'Cuando la etapa 0 está activa', 'Cuando hay una doble barra'], 1,
      'En una divergencia en O las condiciones son excluyentes y solo se activa una rama. Las etapas simultáneas necesitan una doble barra (divergencia en Y).'),
    { id: 'h-explora', tipo: 'explora', ciclo: 6, titulo: 'Explora el GRAFCET', diagrama: 'grafcet', pestana: 'lee',
      guia: [
        'En la pestaña <b>4 · Lee y predice</b> elige una respuesta y luego toca <b>Verlo en el diagrama</b> para comprobarla.',
        'Presiona LSH en reposo: ¿qué pasa? ¿Por qué no se franquea esa transición?',
        'Presiona PA y observa cómo la etapa 0 se apaga y se activa la 1. Después presiona LSH.',
        'Mantén PA y LSH a la vez en reposo: el GRAFCET avanza varias etapas seguidas hasta quedar estable.'
      ] },
    { id: 'h-reto', tipo: 'reto', ciclo: 6, titulo: 'Reto F · Lee el GRAFCET', reto: 'h-reto' },
    { id: 'h-revisa', tipo: 'revisa', ciclo: 6, titulo: 'Revisión del Reto F', reto: 'h-reto' }
  ];
  const iG = S.pasos.findIndex((p) => p.id === 'g-revisa');
  S.pasos.splice(iG + 1, 0, ...nuevos);

  // el enclavamiento pasa a ser el Bloque G
  const ren = (id, cambios) => { const p = S.pasos.find((x) => x.id === id); if (p) Object.assign(p, cambios); };
  ['d-explica', 'rd1', 'd-explora', 'rd2', 'd-reto', 'd-revisa'].forEach((id) => ren(id, { ciclo: 7 }));
  ren('d-explica', { titulo: 'Bloque G · El enclavamiento marcha-paro' });
  ren('d-reto', { titulo: 'Reto G · Tu enclavamiento' });
  ren('d-revisa', { titulo: 'Revisión del Reto G' });
  ren('cierre', { titulo: 'Cierre de la clase' });
  if (S.retos['d-reto']) S.retos['d-reto'].titulo = 'Reto G · Tu enclavamiento';
  let k = 0;
  S.pasos.forEach((p) => { if (p.tipo === 'rapida') { k += 1; p.titulo = 'Pregunta rápida ' + k; } });

  // ---------- Guion docente ----------
  const G = {
    'h-que': { min: 8,
      objetivo: 'Que entiendan etapa, transición, acción y situación inicial, y la diferencia entre escribir la condición en palabras (nivel 1) y con símbolos (nivel 2).',
      pasos: [
        '<b>Di:</b> "Ya sabemos conectar dispositivos y leer una escalera. Antes de programar un enclavamiento aprendemos a describir la secuencia: eso es el GRAFCET."',
        '<b>Haz:</b> en <b>1 · Nivel 1</b> señala la etapa 0 en verde (reposo, cuadrado doble) y la bomba parada.',
        '<b>Haz:</b> mantén presionado <b>Pulsador de arranque (NA)</b>: la transición y su condición se encienden, la etapa 1 se activa y la bomba arranca.',
        '<b>Haz:</b> presiona <b>Pulsador de paro (NC)</b> y se regresa al reposo.',
        '<b>Di:</b> "Solo la etapa activa ejecuta su acción. El pulsador no es la acción: es la condición para cambiar de etapa."'
      ],
      preguntas: ['<b>"¿Cuántas etapas están activas ahora?"</b> → Una sola: la 0.', '<b>"¿Qué enciende la bomba?"</b> → Estar en la etapa 1, no el pulsador.'],
      dudas: ['"¿Qué hace el cuadrado doble?" → Marca la etapa inicial: la que está activa al arrancar.'],
      transicion: 'Toca <b>Siguiente</b> para la pregunta rápida.' },
    rh1: { min: 2, puntos: ['Cierra la pregunta. Refuerza: transición validada + condición cumplida = se franquea.'] },
    'h-simbolos': { min: 8,
      objetivo: 'Que entiendan por qué el paro NC se escribe como PP negado y la diferencia entre el nivel 1 y el nivel 2.',
      pasos: [
        '<b>Di:</b> "En el nivel 2 usamos los nombres del programa. PA es el arranque; PP es el paro."',
        '<b>Haz:</b> en <b>2 · Nivel 2</b> mira los bits PA y PP en reposo: PA = 0 y PP = 1.',
        '<b>Di:</b> "El paro es NC: en reposo deja pasar corriente, su bit vale 1. La condición de paro se cumple cuando PP vale 0: es PP negado, con la barrita arriba."',
        '<b>Haz:</b> presiona arranque y luego paro; fíjate en que PP baja a 0 mientras se pulsa.'
      ],
      preguntas: ['<b>"¿Cuánto vale PP en reposo?"</b> → 1, porque es NC.', '<b>"¿Por qué PP negado?"</b> → Porque la condición se cumple cuando se pulsa, es decir, cuando PP = 0.'],
      dudas: ['"¿Y si el paro fuera NA?" → Entonces la condición sería PP sin negar: se cumple cuando PP = 1.'],
      transicion: 'Toca <b>Siguiente</b> para la pregunta rápida.' },
    rh2: { min: 2, puntos: ['Cierra la pregunta. Refuerza: NC en reposo = 1; la condición de paro es PP negado.'] },
    'h-reglas': { min: 12,
      objetivo: 'Que apliquen las reglas de evolución: situación inicial, franqueo y simultaneidad.',
      pasos: [
        '<b>Di:</b> "Hay reglas para saber cómo evoluciona un GRAFCET. Vamos a verlas una por una."',
        '<b>Haz:</b> en <b>3 · Reglas de evolución</b> con la <b>Regla 1</b>, presiona la transición A y luego Reiniciar.',
        '<b>Haz:</b> en la <b>Regla 2</b> presiona B con la etapa 0 activa: se enciende, pero no pasa nada. Luego A y B en orden.',
        '<b>Haz:</b> en la <b>Regla 3</b> presiona A: se activan 1 y 2 a la vez. B espera que las dos estén activas.',
        '<b>Di:</b> "Validada es tener todas las etapas anteriores activas; franquear es validada y condición cumplida."'
      ],
      preguntas: ['<b>"¿Puede una transición presionada no hacer nada?"</b> → Sí, si no está validada.', '<b>"¿Qué hace la doble barra?"</b> → Activa o espera varias etapas a la vez.'],
      dudas: ['"¿Por qué B se enciende y no pasa nada?" → Porque la condición se cumple, pero la transición no está validada.'],
      transicion: 'Toca <b>Siguiente</b> para la pregunta rápida.' },
    rh3: { min: 2, puntos: ['Cierra la pregunta. Refuerza: sin validación no hay franqueo.'] },
    'h-o': { min: 8,
      objetivo: 'Que distingan la divergencia en O de la divergencia en Y y recuerden la alternancia.',
      pasos: [
        '<b>Di:</b> "No todo es simultáneo: a veces se elige un camino."',
        '<b>Haz:</b> en <b>Regla 4</b> presiona A o B (son excluyentes) y luego la transición de esa rama.',
        '<b>Haz:</b> en <b>Regla 5</b> compara el esquema correcto con los dos errores.',
        '<b>Di:</b> "Etapa, transición, etapa. Nunca dos etapas seguidas ni dos transiciones seguidas."'
      ],
      preguntas: ['<b>"¿Cómo se distingue una divergencia en O de una en Y?"</b> → La Y tiene doble barra; la O, línea simple.'],
      dudas: ['"¿Y si A y B se cumplen a la vez?" → No debe ocurrir: las condiciones de una divergencia en O deben ser excluyentes.'],
      transicion: 'Toca <b>Siguiente</b> para la pregunta rápida.' },
    rh4: { min: 2, puntos: ['Cierra la pregunta. Refuerza: Y = doble barra y simultáneas; O = elegir una rama.'] },
    'h-explora': { min: 8,
      objetivo: 'Que predigan la evolución y la comprueben en el diagrama.',
      pasos: [
        '<b>Di:</b> "Ahora ustedes predicen y yo les muestro si acertaron."',
        '<b>Haz:</b> en <b>4 · Lee y predice</b> deja que respondan cada predicción y toca <b>Verlo en el diagrama</b>.',
        '<b>Haz:</b> prueba PA y LSH juntos en reposo: el GRAFCET avanza hasta una situación estable.'
      ],
      preguntas: ['<b>"¿Por qué pasó dos etapas seguidas?"</b> → Porque, tras activar la 1, la transición siguiente quedó validada y su condición ya estaba cumplida.'],
      dudas: ['"¿Esto es lo que hace el PLC?" → Casi: el PLC evalúa una vez por escaneo; lo veremos al programarlo.'],
      transicion: 'Toca <b>Siguiente</b> para el Reto F.' },
    'h-reto': { min: 10, puntos: ['Cada estudiante recibe un GRAFCET distinto. Deja que lo resuelvan solos.', 'Recuerda: validada + presionada = franqueo.'] },
    'h-revisa': { min: 5, puntos: ['Comenta los resultados.', 'Repasa: franqueo, simultáneas (doble barra), selección (O) y alternancia.', 'Anuncia: "Ahora sí escribimos el enclavamiento."'] }
  };
  S.pasos.forEach((p) => { if (G[p.id]) p.guion = G[p.id]; });
  const gd = S.pasos.find((p) => p.id === 'd-explica');
  if (gd && gd.guion && gd.guion.pasos && gd.guion.pasos[0]) gd.guion.pasos[0] = '<b>Di:</b> "Ya sabemos conectar dispositivos, leer una escalera y describir una secuencia con GRAFCET. Ahora juntamos todo en el enclavamiento. El pulsador de marcha se suelta; ¿cómo logra el motor seguir?" Deja 2 respuestas.';
})();
