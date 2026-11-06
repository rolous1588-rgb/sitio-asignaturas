// ============================================================
// Material nuevo (04/11/2026): del GRAFCET de nivel 2 a las ecuaciones lógicas y al diagrama escalera (ejemplo del tanque).
// Bloque H (ciclo 8): 5 explicaciones/exploración, 4 preguntas rápidas y los retos L, M y N. Va antes del cierre.
// Se carga después de bloque-semaforo.js y diagramas-ecuaciones.js.
// ============================================================
(function () {
  const II = window.II;
  const PL = (II.pl = II.pl || {});
  const S = II.SESIONES['pl-s1'];
  if (!S || !PL.ecuaciones || S.pasos.some((p) => p.id === 'q-tanque')) return;
  const EQ = PL.ecuaciones, ov = EQ.ov, R = EQ.R;
  const unicas = (a) => a.filter((x, i) => a.indexOf(x) === i);

  // nombres distintos de las señales para cada estudiante
  const NOMBRES = [
    { PM: 'PM', PP: 'PP', LL: 'LL', HL: 'HL', KB: 'KB' },
    { PM: 'PA', PP: 'PO', LL: 'SL', HL: 'SH', KB: 'KM' },
    { PM: 'S1', PP: 'S0', LL: 'B1', HL: 'B2', KB: 'KM1' },
    { PM: 'MA', PP: 'PR', LL: 'NB', HL: 'NA', KB: 'Q1' },
    { PM: 'I1', PP: 'I0', LL: 'I2', HL: 'I3', KB: 'Q0' }
  ];
  const opc = (r, ok, malas) => II.mezclar(r, unicas([ok, ...II.mezclar(r, malas.filter((x) => x !== ok)).slice(0, 3)]));
  const dos = (r) => II.elegir(r, [0, 1]);

  // ============================================================
  // RETOS
  // ============================================================
  const retoL = {
    titulo: 'Reto L · Escribe el SET y el RESET', puntos: 10,
    general: 'Cada estudiante recibe el GRAFCET del tanque con otros nombres de señales y escribe, a partir del dibujo, las ecuaciones de SET y de RESET de cada etapa, la regla de la etapa inicial y la salida.',
    pista: 'SET = etapa anterior · condición de la transición que entra. RESET = lo que apaga la etapa: la etapa siguiente o la otra salida (el paro), unidas con una suma.',
    errorComun: 'Escribir el SET con la etapa equivocada o unir con producto condiciones que son alternativas (el RESET se arma con suma).',
    metodo: 'SET = etapa anterior · condición | RESET = etapa siguiente + otra salida | E0 = ~E1~ · ~E2~ | salida = la etapa que la ordena',
    generar(r) {
      const L = II.elegir(r, NOMBRES), n = (x) => ov(L[x]);
      const dib = EQ.svgGr(Object.assign({}, L, { accion: L.KB + ' = 1' }));
      const se1 = `E0 · ${L.PM}`, re1 = `E2 + ${n('PP')}`, se2 = `E1 · ${n('LL')}`, re2 = `${n('PP')} + ${L.HL}`;
      const e0 = `${ov('E1')} · ${ov('E2')}`;
      return {
        enunciado: `<p>Este GRAFCET de nivel 2 gobierna el llenado de un tanque. Las señales son: <b>${L.PM}</b>, pulsador de marcha (NA); <b>${L.PP}</b>, pulsador de paro (NC); <b>${L.LL}</b>, sensor de nivel bajo; <b>${L.HL}</b>, sensor de nivel alto; <b>${L.KB}</b>, contactor de la bomba.</p>${dib}
          <p>Escribe las ecuaciones lógicas. La barra encima indica negación.</p>`,
        campos: [
          { id: 'a', tipo: 'select', pregunta: 'a) ¿Cuál es el SET de la etapa 1 (SE1)?', opciones: opc(r, se1, [`E1 · ${L.PM}`, `E0 · ${n('LL')}`, `E2 · ${L.PM}`, `E0 + ${L.PM}`, `E0 · ${n('PM')}`]) },
          { id: 'b', tipo: 'select', pregunta: 'b) ¿Cuál es el RESET de la etapa 1 (RE1)?', opciones: opc(r, re1, [`E2 · ${n('PP')}`, `E2 + ${L.PP}`, `E0 + ${n('PP')}`, `${ov('E2')} · ${L.PP}`]) },
          { id: 'c', tipo: 'select', pregunta: 'c) ¿Cuál es el SET de la etapa 2 (SE2)?', opciones: opc(r, se2, [`E1 · ${L.LL}`, `E0 · ${n('LL')}`, `E2 · ${n('LL')}`, `E1 + ${n('LL')}`]) },
          { id: 'd', tipo: 'select', pregunta: 'd) ¿Cuál es el RESET de la etapa 2 (RE2)? Las dos condiciones salen de la misma etapa.', opciones: opc(r, re2, [`${L.PP} + ${L.HL}`, `${n('PP')} · ${L.HL}`, `${n('PP')} + ${n('HL')}`, `${L.PP} · ${n('HL')}`]) },
          { id: 'e', tipo: 'select', pregunta: 'e) ¿Cuál es la regla de la etapa inicial E0?', opciones: opc(r, e0, ['E1 · E2', `${ov('E1')} + ${ov('E2')}`, 'E1 + E2', `E0 · ${ov('E1')}`]) },
          { id: 'f', tipo: 'select', pregunta: `f) ¿Cómo se escribe la salida ${L.KB}?`, opciones: opc(r, `${L.KB} = E2`, [`${L.KB} = E1 · E2`, `${L.KB} = E0`, `${L.KB} = ${ov('E2')}`, `${L.KB} = E1`]) }
        ],
        esperado: { a: se1, b: re1, c: se2, d: re2, e: e0, f: `${L.KB} = E2` },
        solucion: `<p><b>a) SE1 = ${se1}.</b> Entra desde E0 y la transición es ${L.PM}.</p>
          <p><b>b) RE1 = ${re1}.</b> E1 se apaga al activarse E2 o al pulsar el paro (${n('PP')}); son alternativas, por eso van sumadas.</p>
          <p><b>c) SE2 = ${se2}.</b> Entra desde E1 con el nivel bajo apagado.</p>
          <p><b>d) RE2 = ${re2}.</b> Paro o nivel alto, ambos en la transición que sale de E2.</p>
          <p><b>e) E0 = ${e0}.</b> Está activa cuando ninguna otra etapa lo está.</p>
          <p><b>f) ${L.KB} = E2.</b> La bomba funciona mientras E2 esté activa.</p>`
      };
    }
  };

  const retoM = {
    titulo: 'Reto M · Aplica De Morgan', puntos: 10,
    general: 'Cada estudiante recibe tres RESET negados con otros nombres de señales y los simplifica con la ley de De Morgan; después evalúa los resultados con valores dados.',
    pista: 'De Morgan: la barra larga se reparte entre los términos; la suma pasa a producto y el producto pasa a suma. Una doble barra se cancela.',
    errorComun: 'Repartir la barra sin cambiar la suma por producto, o dejar una doble negación sin cancelar.',
    metodo: '~(A + B)~ = ~A~ · ~B~ | ~(A · B)~ = ~A~ + ~B~ | la doble barra se cancela: A queda igual',
    generar(r) {
      const L = II.elegir(r, NOMBRES), n = (x) => ov(L[x]);
      const e2 = dos(r), pp = dos(r), hl = dos(r);
      const A = `${ov('E2')} · ${L.PP}`, B = `${L.PP} · ${n('HL')}`, Cc = `${ov('E1')} + ${L.LL}`;
      const va = (!e2 && pp) ? 1 : 0, vb = (pp && !hl) ? 1 : 0;
      const reglas = ['De Morgan: la barra larga se reparte, la suma pasa a producto y la doble barra se cancela', 'La barra larga se quita sin cambiar nada', 'Se cambia el signo de cada término pero la suma se mantiene', 'Se multiplican los términos sin negarlos'];
      return {
        enunciado: `<p>Los RESET de las etapas se niegan para usarlos en serie en el escalera. Simplifica con la ley de De Morgan. En estas expresiones aparecen las señales ${L.PP} (paro NC), ${L.HL}, ${L.LL} y las etapas E1 y E2.</p>`,
        campos: [
          { id: 'a', tipo: 'select', pregunta: `a) ${R('{{E2 + ~' + L.PP + '~}}')} =`, opciones: opc(r, A, [`${ov('E2')} + ${L.PP}`, `E2 · ${n('PP')}`, `${ov('E2')} · ${n('PP')}`, `${ov('E2')} + ${n('PP')}`]) },
          { id: 'b', tipo: 'select', pregunta: `b) ${R('{{~' + L.PP + '~ + ' + L.HL + '}}')} =`, opciones: opc(r, B, [`${L.PP} + ${n('HL')}`, `${n('PP')} · ${n('HL')}`, `${L.PP} · ${L.HL}`, `${n('PP')} · ${L.HL}`]) },
          { id: 'c', tipo: 'select', pregunta: `c) ${R('{{E1 · ~' + L.LL + '~}}')} =`, opciones: opc(r, Cc, [`${ov('E1')} · ${L.LL}`, `E1 + ${L.LL}`, `${ov('E1')} + ${n('LL')}`, `E1 · ${L.LL}`]) },
          { id: 'd', tipo: 'select', pregunta: `d) Con E2 = ${e2} y ${L.PP} = ${pp}, ¿cuánto vale el resultado de a)?`, opciones: ['0', '1'] },
          { id: 'e', tipo: 'select', pregunta: `e) Con ${L.PP} = ${pp} y ${L.HL} = ${hl}, ¿cuánto vale el resultado de b)?`, opciones: ['0', '1'] },
          { id: 'f', tipo: 'select', pregunta: 'f) ¿Qué se hizo en los incisos a) y b)?', opciones: II.mezclar(r, reglas) }
        ],
        esperado: { a: A, b: B, c: Cc, d: String(va), e: String(vb), f: reglas[0] },
        solucion: `<p><b>a) ${A}.</b> La barra larga se reparte: ${ov('E2')} y ${n('PP')} negado de nuevo (queda ${L.PP}); la suma pasa a producto.</p>
          <p><b>b) ${B}.</b> ${n('PP')} negado dos veces es ${L.PP}; ${L.HL} queda negado.</p>
          <p><b>c) ${Cc}.</b> El producto pasa a suma: ${ov('E1')} y ${n('LL')} negado de nuevo (queda ${L.LL}).</p>
          <p><b>d) ${va}.</b> ${ov('E2')} · ${L.PP} con E2 = ${e2} y ${L.PP} = ${pp}.</p>
          <p><b>e) ${vb}.</b> ${L.PP} · ${n('HL')} con ${L.PP} = ${pp} y ${L.HL} = ${hl}.</p>
          <p><b>f)</b> Se aplicó De Morgan.</p>`
      };
    }
  };

  // escalón de la etapa 1 (idx 1) o de la etapa 2 (idx 2); contactos: [nombre, negado?]
  const RUNG = {
    1: { coil: 'E1', set: [['E0', 0], ['PM', 0]], seal: 'E1', ser: [['E2', 1], ['PP', 0]], ecu: (L) => `${ov('E2')} · ${L.PP}`, soltar: (L) => `se suelta ${L.PM} (pasa a 0)`, set1: 'PM' },
    2: { coil: 'E2', set: [['E1', 0], ['LL', 1]], seal: 'E2', ser: [['PP', 0], ['HL', 1]], ecu: (L) => `${L.PP} · ${ov(L.HL)}`, soltar: (L) => `sube el nivel y ${L.LL} pasa a 1`, set1: 'LL' }
  };
  const retoN = {
    titulo: 'Reto N · De las ecuaciones al escalera', puntos: 10,
    general: 'Cada estudiante recibe un escalón del diagrama escalera del tanque (de la etapa 1 o de la etapa 2, con otros nombres) y responde sobre su estructura y su comportamiento: enclavamiento, contactos normalmente cerrados y qué pasa al soltar el pulsador o pulsar el paro.',
    pista: 'El SET va arriba, en serie; el contacto con el nombre de la bobina, en paralelo, mantiene el escalón; el RESET negado va a continuación en serie. Un contacto con raya inclinada es normalmente cerrado.',
    errorComun: 'Creer que al soltar el pulsador de marcha se apaga la bobina, olvidando que el enclavamiento la mantiene.',
    metodo: 'producto = serie | suma = paralelo | barra = contacto NC | enclavamiento = contacto con el nombre de la bobina en paralelo con el SET',
    generar(r) {
      const idx = II.elegir(r, [1, 2]), L = II.elegir(r, NOMBRES), D = RUNG[idx];
      const nm = (c) => L[c] || c;
      const todos = unicas([...D.set.map((c) => c[0]), D.seal, ...D.ser.map((c) => c[0])]);
      const nc = [...D.set, ...D.ser].filter((c) => c[1]).length;
      const val = {}; todos.forEach((c) => { val[c] = dos(r); });
      const cond = (c) => c[1] ? !val[c[0]] : !!val[c[0]];
      const setOk = D.set.every(cond), serOk = D.ser.every(cond);
      const bob = ((setOk || !!val[D.seal]) && serOk) ? 1 : 0;
      const dib = EQ.svgLd(idx, L, {});
      const ec = D.ecu(L);
      const ecOpc = idx === 1
        ? [ec, `${ov('E2')} + ${L.PP}`, `E2 · ${L.PP}`, `${ov('E2')} · ${ov(L.PP)}`]
        : [ec, `${L.PP} + ${ov(L.HL)}`, `${ov(L.PP)} · ${ov(L.HL)}`, `${L.PP} · ${L.HL}`];
      const dsc = 'Se desactiva: el contacto en serie con el paro se abre y corta el paso';
      const mant = 'Sigue activa: el contacto de enclavamiento mantiene el paso';
      const sinR = ['Se desactiva: el contacto en serie con el paro se abre y corta el paso', 'Sigue activa: el contacto de enclavamiento mantiene el paso', 'Se desactiva: el enclavamiento se abre al soltar', 'Depende de la etapa anterior'];
      const lista = todos.map((c) => `${nm(c)} = ${val[c]}`).join('; ');
      return {
        enunciado: `<p>Este escalón corresponde a la etapa ${idx} del tanque. Las señales son: <b>${L.PM}</b>, pulsador de marcha (NA); <b>${L.PP}</b>, pulsador de paro (NC); <b>${L.LL}</b>, sensor de nivel bajo; <b>${L.HL}</b>, sensor de nivel alto.</p>${dib}
          <p>Un contacto normalmente abierto conduce cuando su bit vale 1; uno normalmente cerrado (raya inclinada) conduce cuando su bit vale 0.</p>`,
        campos: [
          { id: 'a', tipo: 'select', pregunta: 'a) ¿Cuál es el contacto de enclavamiento (el que mantiene la bobina encendida)?', opciones: opc(r, nm(D.seal), todos.filter((c) => c !== D.seal).map(nm)) },
          { id: 'b', tipo: 'select', pregunta: 'b) ¿Cuántos contactos normalmente cerrados tiene el escalón?', opciones: ['0', '1', '2', '3'] },
          { id: 'c', tipo: 'select', pregunta: `c) Estos son los valores de los bits antes del escaneo: ${lista}. ¿Cómo queda la bobina ${D.coil} después del escaneo?`, opciones: ['Activada (1)', 'Desactivada (0)'] },
          { id: 'd', tipo: 'select', pregunta: `d) La bobina ${D.coil} está activa y los demás contactos conducen. Entonces ${D.soltar(L)} y el primer tramo del SET deja de conducir. ¿Qué ocurre?`, opciones: II.mezclar(r, sinR) },
          { id: 'e', tipo: 'select', pregunta: `e) Con la bobina ${D.coil} activa, se pulsa el paro (${L.PP} pasa a 0). ¿Qué ocurre?`, opciones: II.mezclar(r, sinR) },
          { id: 'f', tipo: 'select', pregunta: 'f) ¿Qué ecuación corresponde al tramo en serie después del paralelo (el RESET negado)?', opciones: opc(r, ec, ecOpc) }
        ],
        esperado: { a: nm(D.seal), b: String(nc), c: bob ? 'Activada (1)' : 'Desactivada (0)', d: mant, e: dsc, f: ec },
        solucion: `<p><b>a) ${D.seal}.</b> Tiene el mismo nombre que la bobina y está en paralelo con el SET.</p>
          <p><b>b) ${nc}.</b> Son los que llevan barra en las ecuaciones.</p>
          <p><b>c) ${bob ? 'Activada' : 'Desactivada'}.</b> SET ${setOk ? 'conduce' : 'no conduce'}; enclavamiento ${val[D.seal] ? 'conduce' : 'no conduce'}; tramo en serie ${serOk ? 'conduce' : 'no conduce'}.</p>
          <p><b>d)</b> Sigue activa: el contacto de enclavamiento (${D.seal}) conduce por sí solo mientras el RESET negado conduzca.</p>
          <p><b>e)</b> Se desactiva: el contacto ${L.PP} está en serie con todo y, al abrirse, corta el paso.</p>
          <p><b>f) ${ec}.</b> Es el RESET negado de la etapa.</p>`
      };
    }
  };
  S.retos['l1-reto'] = retoL; S.retos['l2-reto'] = retoM; S.retos['l3-reto'] = retoN;

  // ============================================================
  // PASOS
  // ============================================================
  const C = 8;
  const rap = (id, t, o, c, por) => ({ id, tipo: 'rapida', ciclo: C, titulo: 'Pregunta rápida', t, o, c, por });
  const reto = (n, tit) => [
    { id: 'l' + n + '-reto', tipo: 'reto', ciclo: C, titulo: tit, reto: 'l' + n + '-reto' },
    { id: 'l' + n + '-revisa', tipo: 'revisa', ciclo: C, titulo: 'Revisión del ' + tit.split('·')[0].trim(), reto: 'l' + n + '-reto' }
  ];
  const nuevos = [
    { id: 'q-tanque', tipo: 'explica', ciclo: C, titulo: 'Bloque H · El tanque y su GRAFCET', diagrama: 'ecuaciones', pestana: 'tanque',
      ideas: [
        'Un tanque se llena con una bomba. Se arranca con el pulsador de marcha; la bomba funciona cuando el nivel baja de <b>LL</b> y se detiene al llegar a <b>HL</b>. El paro detiene todo.',
        'Este es su <b>GRAFCET de nivel 2</b>: E0 reposo, E1 espera el nivel bajo y E2 llena el tanque con la bomba (KB).',
        'Hay dos salidas de seguridad: el paro (<b>PP</b> negado) desde E1 o E2, y el nivel alto desde E2.',
        'Para programarlo en escalera hay que pasar el GRAFCET a <b>ecuaciones lógicas</b>. Eso es lo que haremos en este bloque.'
      ] },
    rap('rq1', 'En el GRAFCET del tanque, ¿cuándo funciona la bomba?',
      ['Solo mientras la etapa E2 está activa', 'Mientras E0 está activa', 'Siempre que el nivel sea bajo', 'Desde que se pulsa marcha hasta que se pulsa paro'], 0,
      'La acción de la bomba está asociada a la etapa 2: funciona mientras E2 esté activa y se detiene cuando E2 se apaga (por el nivel alto o por el paro).'),
    { id: 'q-set', tipo: 'explica', ciclo: C, titulo: 'Bloque H · Cómo se escribe el SET y el RESET', diagrama: 'ecuaciones', pestana: 'ecuaciones',
      ideas: [
        'Cada etapa tiene dos ecuaciones. El <b>SET</b> la enciende: <b>etapa anterior · condición</b> de la transición que entra.',
        'El <b>RESET</b> la apaga: la <b>etapa siguiente</b> o la otra salida (el paro), unidas con una <b>suma</b> porque cualquiera de las dos basta.',
        'La etapa se mantiene mientras el RESET no ocurra; por eso se <b>niega</b> el RESET completo: una barra larga sobre toda la suma.',
        'En la pestaña 2, elige <b>Etapa 1</b> y avanza paso a paso. Fíjate en los colores del GRAFCET: azul entra (SET), rojo apaga (RESET).'
      ] },
    rap('rq2', 'Para escribir el SET de una etapa, ¿qué se multiplica?',
      ['La etapa anterior por la condición de la transición que entra', 'La etapa siguiente por la condición de salida', 'Todas las etapas entre sí', 'Las dos salidas de seguridad'], 0,
      'SET = etapa anterior · condición. Por ejemplo, SE1 = E0 · PM: E1 se enciende si E0 está activa y se pulsa marcha.'),
    { id: 'q-morgan', tipo: 'explica', ciclo: C, titulo: 'Bloque H · La ley de De Morgan', diagrama: 'ecuaciones', pestana: 'ecuaciones',
      ideas: [
        'Una barra larga sobre una suma es difícil de dibujar en escalera. La <b>ley de De Morgan</b> la reparte: la barra queda sobre cada término y la <b>suma pasa a producto</b>.',
        'Si el término ya tenía barra, la <b>doble barra se cancela</b>: el paro negado, negado otra vez, queda PP.',
        'Así, el RESET negado de la etapa 1 queda <b><span style="text-decoration:overline;text-decoration-thickness:1.5px">E2</span> · PP</b>, y el de la etapa 2, <b>PP · <span style="text-decoration:overline;text-decoration-thickness:1.5px">HL</span></b>.',
        'En la pestaña 2, llega hasta el paso 4 (<b>Aplica De Morgan</b>) en las etapas 1 y 2 y lee cómo cambia la ecuación.'
      ] },
    rap('rq3', 'Aplicando De Morgan, ¿a qué equivale la negación de (E2 + <span style="text-decoration:overline;text-decoration-thickness:1.5px">PP</span>)?',
      ['<span style="text-decoration:overline;text-decoration-thickness:1.5px">E2</span> · PP', '<span style="text-decoration:overline;text-decoration-thickness:1.5px">E2</span> + PP', 'E2 · <span style="text-decoration:overline;text-decoration-thickness:1.5px">PP</span>', '<span style="text-decoration:overline;text-decoration-thickness:1.5px">E2</span> · <span style="text-decoration:overline;text-decoration-thickness:1.5px">PP</span>'], 0,
      'La barra larga se reparte y la suma pasa a producto: <span style="text-decoration:overline;text-decoration-thickness:1.5px">E2</span> y la negación de <span style="text-decoration:overline;text-decoration-thickness:1.5px">PP</span>. La doble negación se cancela y queda PP. Resultado: <span style="text-decoration:overline;text-decoration-thickness:1.5px">E2</span> · PP.'),
    { id: 'q-esc', tipo: 'explica', ciclo: C, titulo: 'Bloque H · De las ecuaciones al diagrama escalera', diagrama: 'ecuaciones', pestana: 'escalera',
      ideas: [
        'Cada ecuación ya es un circuito: el <b>producto</b> es serie, la <b>suma</b> es paralelo y la <b>barra</b> es un contacto normalmente cerrado.',
        'El <b>SET</b> va arriba, en serie. En paralelo con él va un contacto con el <b>mismo nombre que la bobina</b>: es el enclavamiento que la mantiene.',
        'Después, en serie con todo, va el <b>RESET negado</b>. Si el paro se pulsa, ese tramo se abre y la bobina se apaga.',
        'La etapa 0 (<b><span style="text-decoration:overline;text-decoration-thickness:1.5px">E1</span> · <span style="text-decoration:overline;text-decoration-thickness:1.5px">E2</span></b>) y la salida (<b>KB = E2</b>) son escalones sencillos de contactos en serie.'
      ] },
    rap('rq4', 'En el escalón de una etapa, ¿qué hace el contacto con el mismo nombre que la bobina, puesto en paralelo con el SET?',
      ['Mantiene la bobina encendida aunque el SET deje de conducir', 'Apaga la bobina', 'Cuenta el tiempo de la etapa', 'No cumple ninguna función'], 0,
      'Es el enclavamiento: una vez encendida la bobina, su propio contacto cierra el paso y la mantiene hasta que el RESET negado se abre.'),
    { id: 'q-prueba', tipo: 'explora', ciclo: C, titulo: 'Pruébalo: el tanque en marcha', diagrama: 'ecuaciones', pestana: 'prueba',
      guia: [
        'Mantén pulsado <b>Marcha (PM)</b>: la bomba arranca. Suéltalo y comprueba que sigue funcionando.',
        'Usa <b>Consumir agua</b> o el deslizador de nivel y mira cuándo LL y HL cambian de valor.',
        'Pulsa <b>Paro (PP)</b> con la bomba encendida: ¿qué etapa se apaga?',
        'Cambia entre las tres ventanas: <b>GRAFCET</b>, <b>ecuaciones lógicas</b> y <b>diagrama escalera</b>. Es el mismo funcionamiento visto desde tres lugares.'
      ] },
    ...reto(1, 'Reto L · Escribe el SET y el RESET'),
    ...reto(2, 'Reto M · Aplica De Morgan'),
    ...reto(3, 'Reto N · De las ecuaciones al escalera')
  ];
  const iCierre = S.pasos.findIndex((p) => p.id === 'cierre');
  S.pasos.splice(iCierre < 0 ? S.pasos.length : iCierre, 0, ...nuevos);
  const cierre = S.pasos.find((p) => p.id === 'cierre');
  if (cierre && cierre.ideas) cierre.ideas.push('Para pasar un <b>GRAFCET a ecuaciones</b>: SET = etapa anterior · condición; RESET = etapa siguiente + otra salida; se niega el RESET y se simplifica con De Morgan. En escalera: producto en serie, suma en paralelo, barra = contacto NC y enclavamiento con el nombre de la bobina.');
  let k = 0;
  S.pasos.forEach((p) => { if (p.tipo === 'rapida') { k += 1; p.titulo = 'Pregunta rápida ' + k; } });

  // ---------- guion docente ----------
  const G = {
    'q-tanque': { min: 6, objetivo: 'Que lean el GRAFCET del tanque y entiendan qué hace cada etapa antes de escribir ecuaciones.',
      pasos: ['<b>Haz:</b> en <b>1 · El tanque</b> toca <b>Encender bomba</b> y muestra el agua entrando por la tubería.', '<b>Di:</b> "Marcha lleva a E1; con el nivel bajo pasa a E2 y la bomba llena; con el nivel alto o el paro, vuelve a E0."', '<b>Di:</b> "Hoy aprendemos a pasar este dibujo a ecuaciones, y las ecuaciones al escalera."'],
      preguntas: ['<b>"¿Qué etapa enciende la bomba?"</b> → La etapa 2.', '<b>"¿Qué salidas tiene E2?"</b> → Nivel alto o paro.'],
      dudas: ['"¿Por qué el paro se escribe PP negado?" → Porque es NC: vale 1 en reposo y 0 al pulsarlo.'],
      transicion: 'Toca <b>Siguiente</b> para la pregunta rápida.' },
    rq1: { min: 2, puntos: ['Cierra la pregunta. Refuerza: la bomba es la acción de E2.'] },
    'q-set': { min: 12, objetivo: 'Que escriban el SET y el RESET de una etapa a partir del dibujo y entiendan por qué se niega el RESET.',
      pasos: ['<b>Haz:</b> en <b>2 · Ecuaciones</b> elige <b>Etapa 1</b> y avanza con <b>Siguiente</b>.', '<b>Di:</b> "El azul entra: etapa anterior por la condición. El rojo apaga: etapa siguiente más el paro."', '<b>Di:</b> "La etapa se mantiene mientras el RESET no ocurra: por eso se niega todo el RESET."', '<b>Haz:</b> repite con la <b>Etapa 2</b>, donde el paro y el nivel alto salen de la misma transición.'],
      preguntas: ['<b>"¿Por qué el RESET lleva suma?"</b> → Porque cualquiera de las dos condiciones apaga la etapa.', '<b>"¿Por qué el SET lleva producto?"</b> → Hacen falta las dos cosas a la vez.'],
      dudas: ['"¿Y la etapa 0?" → No tiene SET ni RESET propios: está activa cuando E1 y E2 están apagadas.'],
      transicion: 'Toca <b>Siguiente</b> para la pregunta rápida.' },
    rq2: { min: 2, puntos: ['Cierra la pregunta. Refuerza: SET = etapa anterior · condición.'] },
    'q-morgan': { min: 10, objetivo: 'Que apliquen De Morgan para simplificar el RESET negado y cancelen la doble barra.',
      pasos: ['<b>Haz:</b> en <b>2 · Ecuaciones</b> llega al paso 4 de la Etapa 1.', '<b>Di:</b> "La barra larga se reparte: cada término lleva su barra y la suma pasa a producto."', '<b>Di:</b> "Dos barras sobre PP se cancelan: queda PP."', '<b>Haz:</b> en la <b>Etapa 2</b>, el resultado es PP · <span style="text-decoration:overline;text-decoration-thickness:1.5px">HL</span>. Pide a los estudiantes que lo anticipen antes de mostrarlo.'],
      preguntas: ['<b>"¿Qué pasa con la doble barra?"</b> → Se cancela.', '<b>"¿Y si fuera un producto?"</b> → Pasa a suma.'],
      dudas: ['"¿Por qué no dejarlo con la barra larga?" → En escalera no existe un contacto para una suma negada; con De Morgan queda en contactos sencillos.'],
      transicion: 'Toca <b>Siguiente</b> para la pregunta rápida.' },
    rq3: { min: 2, puntos: ['Cierra la pregunta. Refuerza: suma a producto y doble barra cancelada.'] },
    'q-esc': { min: 10, objetivo: 'Que dibujen un escalón a partir de sus ecuaciones: SET en serie, enclavamiento en paralelo y RESET negado en serie.',
      pasos: ['<b>Haz:</b> en <b>3 · Escalera</b> elige <b>Escalón 2 · E1</b>.', '<b>Di:</b> "Azul, el SET en serie; lila, el enclavamiento en paralelo; rojo, el RESET negado en serie."', '<b>Haz:</b> pasa al escalón 3 y pide que identifiquen cada parte antes de leer el texto.', '<b>Di:</b> "El contacto con la raya inclinada es el que lleva barra."'],
      preguntas: ['<b>"¿Cuál es el contacto de enclavamiento?"</b> → El que tiene el nombre de la bobina.', '<b>"¿Qué pasa si se abre el contacto del paro?"</b> → La bobina se apaga.'],
      dudas: [],
      transicion: 'Toca <b>Siguiente</b> para la pregunta rápida.' },
    rq4: { min: 2, puntos: ['Cierra la pregunta. Refuerza: el enclavamiento mantiene la bobina.'] },
    'q-prueba': { min: 10, objetivo: 'Que vean el mismo funcionamiento en el GRAFCET, en las ecuaciones y en el diagrama escalera.',
      pasos: ['<b>Haz:</b> en <b>4 · Pruébalo</b> usa <b>Tanque y GRAFCET</b>: mantén Marcha y observa cómo avanzan las etapas.', '<b>Haz:</b> cambia a <b>Tanque y ecuaciones lógicas</b>: los valores de E0, E1, E2 y KB se actualizan en cada escaneo.', '<b>Haz:</b> cambia a <b>Tanque y diagrama escalera</b>: la energía verde recorre los contactos que conducen.', '<b>Haz:</b> pulsa Paro con la bomba encendida y repite la lectura en las tres ventanas.'],
      preguntas: ['<b>"¿Por qué la bomba sigue al soltar Marcha?"</b> → E1 y E2 se mantienen por su enclavamiento.', '<b>"¿Qué apaga la bomba?"</b> → El nivel alto o el paro.'],
      dudas: ['"¿Por qué hay un escaneo?" → El PLC evalúa las ecuaciones en orden, una vez por ciclo.'],
      transicion: 'Toca <b>Siguiente</b> para el primer reto.' },
    'l1-reto': { min: 8, puntos: ['Escribir SET y RESET a partir del GRAFCET con otros nombres. Deja que lo resuelvan solos.'] },
    'l1-revisa': { min: 4, puntos: ['Comenta los resultados.', 'Repasa: SET = etapa anterior · condición; RESET = etapa siguiente + otra salida.'] },
    'l2-reto': { min: 8, puntos: ['Simplificar con De Morgan y evaluar con valores.'] },
    'l2-revisa': { min: 4, puntos: ['Comenta los resultados.', 'Repasa: suma a producto, producto a suma, doble barra cancelada.'] },
    'l3-reto': { min: 10, puntos: ['Leer un escalón: enclavamiento, contactos NC y comportamiento al soltar marcha o pulsar paro.'] },
    'l3-revisa': { min: 5, puntos: ['Comenta los resultados.', 'Repasa: el enclavamiento mantiene; el paro en serie apaga.', 'Cierra: "Con esto ya podemos programar cualquier GRAFCET en escalera."'] }
  };
  S.pasos.forEach((p) => { if (G[p.id]) p.guion = G[p.id]; });
})();
