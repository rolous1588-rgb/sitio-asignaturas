// ============================================================
// Material nuevo (01/11/2026): lo que hace falta antes del enclavamiento.
//   Bloque D · Del campo al bit (cómo se conectan sensores y actuadores al PLC)
//   Bloque E · De los relés a la escalera (lógica, leer una escalera, escaneo y memoria)
// Se inserta después del Reto C. El enclavamiento pasa a ser el Bloque F.
// Los pasos son una sola lista corrida para todo el módulo; cada clase empieza donde quedó la anterior.
// Se carga después de sesion1.js, diagramas-campo.js y diagramas-escalera.js.
// ============================================================
(function () {
  const II = window.II;
  const PL = (II.pl = II.pl || {});
  const S = II.SESIONES['pl-s1'];
  if (!S || S.pasos.some((p) => p.id === 'f-mundos')) return;
  const V = (x, u = '') => `<span class="valor">${II.fmt(x, 3)}${u ? ' ' + u : ''}</span>`;
  const p2 = (n) => String(n).padStart(2, '0');

  // ============================================================
  // RETOS
  // ============================================================
  const DISP = [
    ['un pulsador de marcha (NA)', false], ['un pulsador de paro (NC)', true], ['un paro de emergencia tipo hongo (NC)', true],
    ['un flotador de nivel alto (NA)', false], ['un relé térmico con contacto NC', true], ['un final de carrera de puerta cerrada (NA)', false]
  ];
  const ESCENAS = [
    ['Se corta el cable de señal de un pulsador de paro NC', '0', 'El camino de corriente se abre: el bit baja a 0, igual que si se pulsara el paro. La máquina se detiene (falla segura).'],
    ['Se corta el cable de señal de un pulsador de marcha NA', '0', 'El NA ya valía 0 en reposo; cortar el cable no cambia nada y nadie se entera de la falla.'],
    ['Se pulsa un paro NC', '0', 'Al pulsarlo, el contacto NC se abre y deja de pasar corriente: el bit vale 0.'],
    ['Se pulsa una marcha NA', '1', 'Al pulsarlo, el contacto NA se cierra, pasa corriente y el bit vale 1.'],
    ['Se suelta un paro NC que estaba pulsado', '1', 'Al soltarlo, el contacto NC vuelve a cerrarse: pasa corriente y el bit vale 1.']
  ];
  const CARGAS = [
    ['una lámpara piloto de 24 V cc y 0,05 A', 'Relé o transistor', 'Es continua y de poca corriente: cualquiera de las dos salidas puede.'],
    ['la bobina de un contactor de 24 V cc y 0,1 A', 'Relé o transistor', 'Es continua y de poca corriente. Con transistor, un diodo en paralelo protege la salida.'],
    ['la bobina de un contactor de 220 V ca y 0,05 A', 'Solo relé', 'Es de corriente alterna: un transistor solo maneja corriente continua.'],
    ['una electroválvula de 24 V cc y 1,5 A', 'Solo relé', 'Toma 1,5 A: pasa los 0,5 A del transistor, pero entra en los 2 A del relé.'],
    ['una válvula dosificadora de 24 V cc y 0,2 A que se acciona 50 veces por segundo', 'Solo transistor', 'La corriente es baja, pero se acciona muy seguido: un relé es lento y se desgastaría enseguida.'],
    ['una resistencia calefactora de 220 V ca y 8 A', 'Ninguna: usar contactor', 'Toma 8 A: pasa el límite de cualquier salida. La salida comanda un contactor.'],
    ['un motor de 7,5 kW, 380 V ca y 15 A', 'Ninguna: usar contactor', 'Toma unos 15 A a 380 V: la salida comanda la bobina de un contactor.']
  ];
  const OPC_CARGA = ['Relé o transistor', 'Solo relé', 'Solo transistor', 'Ninguna: usar contactor'];

  const retoF = {
    titulo: 'Reto D · Del campo al bit',
    puntos: 10,
    general: 'Cada estudiante recibe un caso distinto sobre cómo se conectan los dispositivos al PLC: qué bit se lee, qué sensor y qué salida corresponden, y qué dirección usa el programa.',
    pista: 'Una entrada vale 1 cuando pasa corriente: el NC deja pasar en reposo y el NA no. Un PNP necesita el común a 0 V y un NPN a +24 V. Una salida a transistor solo maneja 24 V cc y unos 0,5 A.',
    errorComun: 'Creer que el bit vale 1 «cuando se pulsa»: depende de si el contacto es NA o NC. O elegir una salida por la tensión de la carga sin mirar la corriente.',
    metodo: 'Bit = 1 si hay camino cerrado de corriente | PNP con común a 0 V; NPN con común a +24 V | relé: ca o cc, hasta unos 2 A; transistor: solo cc, unos 0,5 A, rápido | dirección = TIPO + ranura + canal',
    generar(r) {
      const d1 = II.elegir(r, DISP);
      const esc = II.elegir(r, ESCENAS);
      const tipo = II.elegir(r, ['PNP', 'NPN']);
      const car = II.elegir(r, CARGAS);
      const d2 = II.elegir(r, DISP.filter((x) => x !== d1));
      const nn = Math.floor(r() * 16);
      const ok = PL.direccion('ED', 1, nn);
      const opcDir = II.mezclar(r, [ok, PL.direccion('SD', 1, nn), PL.direccion('ED', 2, nn), PL.direccion('ED', 1, (nn + 1) % 16)]);
      const bitReposo = d1[1] ? '1' : '0';
      const comun = tipo === 'PNP' ? '0 V' : '+24 V';
      return {
        enunciado: `<p>Estás cableando una estación de bombeo. Responde con lo que lee y comanda el PLC.</p>
          <p><b>Caso a.</b> Conectas ${d1[0]} a una entrada digital. Nadie lo toca.</p>
          <p><b>Caso b.</b> ${esc[0]}.</p>
          <p><b>Caso c.</b> Compras un sensor inductivo de 3 hilos tipo <span class="valor">${tipo}</span>.</p>
          <p><b>Caso d.</b> Quieres comandar ${car[0]}.</p>
          <p><b>Caso e.</b> Conectas ${d2[0]} al terminal ${V(String(nn))} del módulo de entradas, que está en la ranura 1.</p>`,
        campos: [
          { id: 'a', tipo: 'select', pregunta: 'a) ¿Qué valor lee el PLC en ese bit, en reposo?', opciones: ['0', '1'] },
          { id: 'b', tipo: 'select', pregunta: 'b) ¿Qué valor lee el PLC después de ese hecho?', opciones: ['0', '1'] },
          { id: 'c', tipo: 'select', pregunta: 'c) ¿A qué debe estar el común del módulo de entradas?', opciones: ['0 V', '+24 V'] },
          { id: 'd', tipo: 'select', pregunta: 'd) ¿Qué tipo de salida puede manejar esa carga directamente?', opciones: OPC_CARGA },
          { id: 'e', tipo: 'select', pregunta: 'e) ¿Con qué dirección aparece ese dispositivo en el programa?', opciones: opcDir }
        ],
        esperado: { a: bitReposo, b: esc[1], c: comun, d: car[1], e: ok },
        solucion: `
          <p><b>a) ${bitReposo}.</b> ${d1[1] ? 'Es NC: en reposo el contacto está cerrado, pasa corriente y el bit vale 1.' : 'Es NA: en reposo el contacto está abierto, no pasa corriente y el bit vale 0.'}</p>
          <p><b>b) ${esc[1]}.</b> ${esc[2]}</p>
          <p><b>c) ${comun}.</b> ${tipo === 'PNP' ? 'El PNP entrega +24 V por la señal; la corriente vuelve por el común a 0 V.' : 'El NPN lleva la señal a 0 V; la corriente entra por el común a +24 V y sale por la señal.'}</p>
          <p><b>d) ${car[1]}.</b> ${car[2]}</p>
          <p><b>e) ${ok}.</b> Entrada digital (ED), ranura 1, canal ${nn}.</p>`
      };
    }
  };

  const ESTR = { a: 'A en serie con (B o C)', b: '(A o B) en serie con C', c: '(A en serie con B) o C' };
  const retoG = {
    titulo: 'Reto E · Lee la escalera',
    puntos: 10,
    general: 'Cada estudiante recibe un renglón distinto, con contactos NA y NC: calcula la salida en tres casos, cuenta cuántas combinaciones la encienden y reconoce su ecuación.',
    pista: 'Un contacto NA deja pasar con 1 y uno NC con 0. Resuelve primero lo que está en paralelo (la suma) y después lo que está en serie (el producto).',
    errorComun: 'Olvidar que un contacto NC se invierte, o resolver el paralelo como si fuera una serie.',
    metodo: 'Serie = producto (AND); paralelo = suma (OR); NC = inversión | con 3 entradas hay 8 combinaciones',
    generar(r) {
      const estr = II.elegir(r, ['a', 'b', 'c']);
      const nc = { A: r() < 0.4, B: r() < 0.4, C: r() < 0.4 };
      if (!nc.A && !nc.B && !nc.C) nc[II.elegir(r, ['A', 'B', 'C'])] = true;
      const R = PL.RENGLONES[estr];
      const etq = (k) => (nc[k] ? '/' + k : k);
      const nombres = { A: etq('A'), B: etq('B'), C: etq('C') };
      const pasa = (bits) => ({ A: nc.A ? !bits.A : !!bits.A, B: nc.B ? !bits.B : !!bits.B, C: nc.C ? !bits.C : !!bits.C });
      const q = (bits) => !!R.f(pasa(bits));
      const todas = [];
      for (let i = 0; i < 8; i++) todas.push({ A: !!(i & 4), B: !!(i & 2), C: !!(i & 1) });
      const elegidas = II.mezclar(r, todas).slice(0, 3);
      const cuenta = todas.filter(q).length;
      const eq = 'Q = ' + R.eq(nombres);
      const otras = ['a', 'b', 'c'].filter((x) => x !== estr).map((x) => 'Q = ' + PL.RENGLONES[x].eq(nombres));
      const flip = ['A', 'B', 'C'].map((k) => ({ ...nombres, [k]: nc[k] ? k : '/' + k }));
      const opciones = II.mezclar(r, [eq, otras[0], otras[1], 'Q = ' + R.eq(II.elegir(r, flip))].filter((x, i, a) => a.indexOf(x) === i)).slice(0, 4);
      if (!opciones.includes(eq)) opciones[0] = eq;
      const bit = (b) => (b ? 1 : 0);
      return {
        enunciado: `<p>Este renglón gobierna la salida Q. Los contactos con una barra «/» son <b>NC</b>. Las entradas son A = ED1.00, B = ED1.01 y C = ED1.02.</p>
          <div class="lienzo" style="margin:8px 0">${PL.renglonSVG(estr, nc)}</div>
          <p class="nota">Estructura: ${ESTR[estr]}.</p>`,
        campos: [
          ...elegidas.map((b, i) => ({ id: 'q' + (i + 1), tipo: 'select', pregunta: `${'abc'[i]}) Si A = ${bit(b.A)}, B = ${bit(b.B)} y C = ${bit(b.C)}, ¿cuánto vale Q?`, opciones: ['0', '1'] })),
          { id: 'n', tipo: 'select', pregunta: 'd) De las 8 combinaciones posibles de A, B y C, ¿en cuántas vale Q = 1?', opciones: ['0', '1', '2', '3', '4', '5', '6', '7', '8'] },
          { id: 'eq', tipo: 'select', pregunta: 'e) ¿Cuál es la ecuación de este renglón?', opciones }
        ],
        esperado: { q1: String(bit(q(elegidas[0]))), q2: String(bit(q(elegidas[1]))), q3: String(bit(q(elegidas[2]))), n: String(cuenta), eq },
        solucion: `
          ${elegidas.map((b, i) => { const p = pasa(b); return `<p><b>${'abc'[i]}) ${bit(q(b))}.</b> Con A = ${bit(b.A)}, B = ${bit(b.B)}, C = ${bit(b.C)}, los contactos dejan pasar así: ${nombres.A} → ${bit(p.A)}; ${nombres.B} → ${bit(p.B)}; ${nombres.C} → ${bit(p.C)}. Resolviendo ${R.eq({ A: bit(p.A), B: bit(p.B), C: bit(p.C) })} resulta ${bit(q(b))}.</p>`; }).join('')}
          <p><b>d) ${cuenta}.</b> Se recorren las 8 filas de la tabla de verdad y se cuentan las que dan 1.</p>
          <p><b>e) ${eq}.</b> ${ESTR[estr]}; el producto es la serie y la suma es el paralelo.</p>`
      };
    }
  };
  S.retos['f-reto'] = retoF;
  S.retos['g-reto'] = retoG;

  // ============================================================
  // PASOS
  // ============================================================
  const rap = (id, ciclo, t, o, c, por) => ({ id, tipo: 'rapida', ciclo, titulo: 'Pregunta rápida', t, o, c, por });
  const nuevos = [
    // ----- Bloque D · Del campo al bit -----
    { id: 'f-mundos', tipo: 'explica', ciclo: 4, titulo: 'Bloque D · Mando y potencia', diagrama: 'campo', pestana: 'mundos',
      ideas: [
        'Un PLC vive en el <b>mando</b>: señales de 24 V cc y corrientes pequeñas. Una máquina vive en la <b>potencia</b>: 220 o 380 V y decenas de amperios.',
        'La salida de un PLC entrega entre <b>0,5 y 2 A</b>, según su tipo. Un motor de 7,5 kW toma unos <b>15 A</b> a 380 V: la salida no puede ni debe alimentarlo.',
        'El puente es el <b>contactor</b>: su bobina (mando) cierra contactos fuertes (potencia). El PLC solo energiza la bobina.',
        'Cuando decimos «la salida del motor» en un programa, en realidad hablamos de la <b>bobina del contactor</b>.'
      ] },
    rap('rf1', 4, 'Un motor de 7,5 kW se quiere arrancar con el PLC. ¿Por qué no se conecta directamente a la salida del PLC?',
      ['Porque los motores trabajan en corriente continua', 'Porque la salida entrega poca corriente y el motor necesita mucha: se usa un contactor', 'Porque la salida solo puede ser analógica', 'Porque el programa no puede escribir en las salidas'], 1,
      'La salida maneja entre 0,5 y 2 A; el motor toma unos 15 A. El PLC comanda la bobina de un contactor y este maneja la potencia.'),
    { id: 'f-entrada', tipo: 'explica', ciclo: 4, titulo: 'Bloque D · Una entrada: el circuito cerrado y el común', diagrama: 'campo', pestana: 'entrada',
      ideas: [
        'Una entrada vale <b>1 cuando pasa corriente</b> por el LED de su borne y 0 cuando no pasa. No vale «se pulsó»: vale «pasa corriente».',
        'La corriente necesita un <b>camino cerrado</b>: +24 V, contacto, borne, LED, común y 0 V. Si falta cualquier tramo, el bit queda en 0.',
        'Un contacto <b>NA</b> cierra al accionarse y uno <b>NC</b> abre al accionarse. En reposo, el NA da bit 0 y el NC da bit 1.',
        'El paro se cablea <b>NC</b>: si el cable se corta, el bit baja a 0 igual que al pulsar y la máquina se detiene. Es una <b>falla segura</b>.'
      ] },
    rap('rf2', 4, 'Un pulsador de paro NC está bien cableado a una entrada y nadie lo toca. ¿Qué valor lee el PLC en ese bit?',
      ['0', '1', 'Depende del programa', 'No se puede saber'], 1,
      'En reposo el contacto NC está cerrado, pasa corriente por el borne y el bit vale 1. Al pulsarlo, o si se corta el cable, baja a 0.'),
    { id: 'f-sensor', tipo: 'explica', ciclo: 4, titulo: 'Bloque D · Sensores de 3 hilos: PNP y NPN', diagrama: 'campo', pestana: 'sensor',
      ideas: [
        'Los sensores electrónicos (inductivos, capacitivos, fotoeléctricos) suelen tener <b>3 hilos</b>: marrón (+24 V), azul (0 V) y negro (señal).',
        'Un sensor <b>PNP</b> entrega +24 V por la señal al activarse; un <b>NPN</b> la lleva a 0 V. Son opuestos.',
        'El módulo debe ser compatible: <b>PNP con el común a 0 V</b>; <b>NPN con el común a +24 V</b>. Mal combinados, el bit nunca sube aunque el sensor detecte.',
        'La salida del sensor puede ser <b>NA</b> (conduce al detectar) o <b>NC</b> (conduce mientras no detecta, y se corta al detectar).'
      ] },
    rap('rf3', 4, 'Un sensor inductivo NPN se conecta a un módulo de entradas. ¿A qué debe estar el común del módulo?',
      ['0 V', '+24 V', '220 V ca', 'A tierra'], 1,
      'El NPN lleva la señal a 0 V al activarse; para que circule corriente, el común del módulo debe estar a +24 V. Un PNP necesita el común a 0 V.'),
    { id: 'f-salida', tipo: 'explica', ciclo: 4, titulo: 'Bloque D · Salidas: relé o transistor', diagrama: 'campo', pestana: 'salida',
      ideas: [
        'Una salida a <b>relé</b> sirve para corriente alterna y continua (hasta unos 250 V y 2 A); tiene un contacto aislado, pero es lento y se desgasta.',
        'Una salida a <b>transistor</b> es solo para 24 V cc y unos 0,5 A; es muy rápida y no se desgasta.',
        'Con cargas inductivas (bobinas, válvulas) y un transistor se pone un <b>diodo</b> en paralelo con la bobina para protegerlo.',
        'Si la carga pasa del límite o es de potencia, la salida comanda un <b>contactor o un relé auxiliar</b> y ese maneja la carga.'
      ] },
    rap('rf4', 4, 'Quieres energizar la bobina de un contactor de 220 V ca con una salida a transistor de 24 V cc. ¿Qué corresponde?',
      ['Funciona normal', 'No sirve: el transistor solo maneja corriente continua; hay que usar una salida a relé', 'Funciona pero con menos fuerza', 'Funciona si se agrega un diodo'], 1,
      'Un transistor del módulo solo maneja corriente continua. Para una carga de corriente alterna se usa una salida a relé (o un relé auxiliar).'),
    { id: 'f-conecta', tipo: 'explora', ciclo: 4, titulo: 'Conecta tú la estación de bombeo', diagrama: 'campo', pestana: 'estacion',
      guia: [
        'Toca <b>Poner un ejemplo</b> y revisa la tabla de asignación que resulta.',
        'Acciona el paro S2 (NC) y mira qué le pasa al bit de su terminal. Haz lo mismo con la marcha S1 (NA).',
        'Pulsa <b>Borrar conexiones</b> y cablea tú: cada dispositivo va al módulo que corresponde (entradas ED o salidas SD).',
        'Ordena <b>SD2.00 = 1</b>: ¿cuál dispositivo responde? Cámbialo de terminal y repite. La dirección manda.'
      ] },
    { id: 'f-reto', tipo: 'reto', ciclo: 4, titulo: 'Reto D · Del campo al bit', reto: 'f-reto' },
    { id: 'f-revisa', tipo: 'revisa', ciclo: 4, titulo: 'Revisión del Reto D', reto: 'f-reto' },

    // ----- Bloque E · De los relés a la escalera -----
    { id: 'g-reles', tipo: 'explica', ciclo: 5, titulo: 'Bloque E · El circuito que ya conocen', diagrama: 'escalera', pestana: 'reles',
      ideas: [
        'El circuito cableado de arranque y paro: el <b>paro NC</b> en serie y la <b>marcha NA</b> en paralelo con un <b>contacto auxiliar de K1</b> (el sello).',
        'La <b>escalera</b> es ese mismo circuito dibujado entre dos rieles: contactos a la izquierda y bobina a la derecha.',
        'En el PLC los contactos son <b>bits</b> y la bobina es un bit de salida: el cableado entre ellos se reemplaza por un programa.',
        'El paro físico es NC, pero en el programa se dibuja como un contacto que <b>deja pasar con 1</b>, porque en reposo su bit vale 1.'
      ] },
    rap('rg1', 5, 'En el circuito cableado de arranque y paro, ¿qué mantiene energizada la bobina K1 después de soltar la marcha?',
      ['El pulsador de paro', 'Un contacto auxiliar de K1 en paralelo con la marcha', 'La fuente de 24 V', 'El relé térmico'], 1,
      'El contacto auxiliar de K1 se cierra al energizarse la bobina y puentea la marcha: es el sello o enclavamiento.'),
    { id: 'g-logica', tipo: 'explica', ciclo: 5, titulo: 'Bloque E · Lógica con contactos y tabla de verdad', diagrama: 'escalera', pestana: 'logica',
      ideas: [
        'Todo renglón se reduce a tres ideas: <b>serie</b> = Y (AND), <b>paralelo</b> = O (OR) y <b>contacto NC</b> = NO (NOT).',
        'La <b>tabla de verdad</b> lista todas las combinaciones de las entradas y el valor de la salida: con n entradas hay 2<sup>n</sup> filas.',
        'La <b>ecuación</b> resume lo mismo: producto para la serie, suma para el paralelo y una barra para el NC. Primero se resuelve el paréntesis.',
        'Probar todas las filas es la forma más segura de comprobar un renglón antes de cargarlo al PLC.'
      ] },
    rap('rg2', 5, 'Dos contactos A y B, ambos NA y en paralelo, gobiernan una bobina. ¿Cuándo vale Q = 1?',
      ['Solo cuando A y B valen 1', 'Cuando A o B valen 1', 'Solo cuando ambos valen 0', 'Siempre'], 1,
      'En paralelo basta que uno deje pasar el flujo: la suma A + B vale 1 si A o B valen 1.'),
    { id: 'g-leer', tipo: 'explica', ciclo: 5, titulo: 'Bloque E · Cómo se lee una escalera', diagrama: 'escalera', pestana: 'leer',
      ideas: [
        'Los dos <b>rieles</b> no llevan corriente real: el «flujo» es lógico, va de izquierda a derecha y busca llegar a la bobina.',
        'Un <b>contacto</b> lee un bit: el NA deja pasar con 1 y el NC deja pasar con 0. Una <b>bobina</b> escribe un bit: 1 si llega flujo.',
        'Se lee de arriba hacia abajo y de izquierda a derecha; cada renglón decide una sola bobina.',
        'Debajo de cada símbolo está su <b>dirección</b>: así el programa se conecta con el cableado y con la tabla de asignación.'
      ] },
    rap('rg3', 5, 'Un contacto NC de la escalera lee un bit que vale 0. ¿Deja pasar el flujo?',
      ['Sí: el contacto NC deja pasar cuando su bit vale 0', 'No: solo deja pasar con 1', 'Depende del escaneo', 'Solo si hay bobina'], 0,
      'El NC del programa invierte al bit: deja pasar el flujo cuando el bit vale 0 y lo corta cuando vale 1.'),
    { id: 'g-scan', tipo: 'explica', ciclo: 5, titulo: 'Bloque E · Escaneo y memoria', diagrama: 'escalera', pestana: 'scan',
      ideas: [
        'El PLC no «ve» el circuito: en cada escaneo ejecuta el programa con una <b>foto</b> de las entradas.',
        'La bobina Q también puede usarse como contacto: ese contacto lee el valor que Q tuvo en el <b>escaneo anterior</b>.',
        'Eso es la <b>memoria</b>: soltar la marcha no apaga el motor, porque Q (que valía 1) mantiene el renglón por el contacto de sello.',
        'El motor se detiene cuando el paro baja su bit a 0: no pasa flujo, Q baja a 0 y el sello deja de sostenerse.'
      ] },
    rap('rg4', 5, 'La marcha ya se soltó (M = 0), el paro está en reposo y Q valía 1 en el escaneo anterior. ¿Cuánto vale Q ahora?',
      ['0, porque M = 0', '1, porque el sello lee el valor anterior de Q', 'Queda indeterminado', 'Depende de la marca del PLC'], 1,
      'El contacto de sello lee el Q del escaneo anterior (1); con el paro en reposo, el flujo pasa y Q se mantiene en 1.'),
    { id: 'g-explora', tipo: 'explora', ciclo: 5, titulo: 'Explora la lógica y el escaneo', diagrama: 'escalera', pestana: 'logica',
      guia: [
        'En <b>2 · Lógica con contactos</b> cambia A, B y C hasta <b>descubrir las 4 u 8 filas</b> de la tabla de verdad de cada circuito.',
        'En <b>3 · Leer una escalera</b> toca cada símbolo y acciona el paro S2: ¿qué valor tiene su bit?',
        'En <b>4 · Escaneo y memoria</b> pulsa la marcha, ejecuta un escaneo completo, suéltala y ejecuta otro. ¿Por qué Q sigue en 1?',
        'Ahora pulsa el paro y ejecuta un escaneo: ¿qué le pasa a Q?'
      ] },
    { id: 'g-reto', tipo: 'reto', ciclo: 5, titulo: 'Reto E · Lee la escalera', reto: 'g-reto' },
    { id: 'g-revisa', tipo: 'revisa', ciclo: 5, titulo: 'Revisión del Reto E', reto: 'g-reto' }
  ];

  // se insertan después de la revisión del Reto C
  const iC = S.pasos.findIndex((p) => p.id === 'c-revisa');
  S.pasos.splice(iC + 1, 0, ...nuevos);

  // el enclavamiento pasa a ser el Bloque F
  const ren = (id, cambios) => { const p = S.pasos.find((x) => x.id === id); if (p) Object.assign(p, cambios); };
  ['d-explica', 'rd1', 'd-explora', 'rd2', 'd-reto', 'd-revisa'].forEach((id) => ren(id, { ciclo: 6 }));
  ren('d-explica', { titulo: 'Bloque F · El enclavamiento marcha-paro' });
  ren('d-reto', { titulo: 'Reto F · Tu enclavamiento' });
  ren('d-revisa', { titulo: 'Revisión del Reto F' });
  S.retos['d-reto'].titulo = 'Reto F · Tu enclavamiento';
  // las preguntas rápidas se numeran corridas
  let k = 0;
  S.pasos.forEach((p) => { if (p.tipo === 'rapida') { k += 1; p.titulo = 'Pregunta rápida ' + k; } });

  // la lista de pasos es una sola para todo el módulo: sin «Sesión 1» en los títulos
  S.titulo = 'Pasos del módulo';
  S.siguiente = 'La clase siguiente continúa en el paso donde se terminó';

  // ============================================================
  // GUION DOCENTE
  // ============================================================
  const G = {
    'f-mundos': { min: 8,
      objetivo: 'Que entiendan por qué el PLC nunca alimenta un motor directamente y qué papel cumple el contactor.',
      pasos: [
        '<b>Di:</b> "Hasta ahora vimos qué hay dentro del PLC. Ahora vamos a ver cómo se conecta con la máquina. Todo programa que escriban depende de esto."',
        '<b>Haz:</b> en la pestaña <b>1 · Mando y potencia</b> deja «Motor directo a la salida» y toca <b>Poner Q = 1</b>. Se ve el aviso en rojo: "así no".',
        '<b>Di:</b> "La salida da entre 0,5 y 2 A; el motor toma unos 15 A a 380 V. No son del mismo mundo."',
        '<b>Haz:</b> cambia a <b>Con contactor</b> y toca de nuevo Q = 1: se energiza la bobina, cierran los contactos y el motor gira.',
        '<b>Di:</b> "El PLC solo da la orden. El contactor es el músculo."'
      ],
      preguntas: ['<b>"¿Qué circula por la bobina del contactor?"</b> → Una corriente pequeña de 24 V cc: es del mundo del mando.', '<b>"¿Y por los contactos de potencia?"</b> → La corriente del motor a 380 V.'],
      dudas: ['"¿Y si el motor es muy chiquito?" → Aun así, con un motor pequeño conviene un relé o contactor: protege la salida y separa los mundos.'],
      transicion: 'Toca <b>Siguiente</b> para la pregunta rápida.' },
    rf1: { min: 2, puntos: ['Cierra la pregunta. Refuerza: <b>mando</b> (24 V, pocos amperios) frente a <b>potencia</b> (380 V, decenas de amperios).'] },
    'f-entrada': { min: 10,
      objetivo: 'Que entiendan que un bit de entrada es «pasa corriente» y que por eso el NC lee 1 en reposo.',
      pasos: [
        '<b>Di:</b> "Una entrada del PLC no sabe qué es un pulsador. Solo sabe si pasa corriente por su borne."',
        '<b>Haz:</b> en <b>2 · Una entrada</b> deja <b>Pulsador NA</b>. Pulsa y suelta: la tabla de la derecha muestra el bit. Sigue la línea verde: es el camino de la corriente.',
        '<b>Haz:</b> cambia a <b>Pulsador NC</b>: sin tocar nada, el bit ya vale 1. "En reposo el NC está cerrado."',
        '<b>Haz:</b> toca <b>Cortar cable de señal</b> con el NC: el bit baja a 0, igual que si pulsaran el paro. "Se detiene la máquina: es una falla segura. Por eso el paro es NC."',
        '<b>Haz:</b> ahora toca <b>Cortar cable del común</b>: nunca sube el bit. "Si falta el retorno, no hay circuito."'
      ],
      preguntas: ['<b>"¿Qué pasaría con un paro NA si se corta el cable?"</b> → Nadie se entera: el paro no funcionaría y la máquina no podría detenerse. Por eso nunca se cablea NA.'],
      dudas: ['"¿Siempre es 24 V?" → Es lo más común en control, pero hay módulos de 120 o 220 V ca; el principio del camino cerrado es el mismo.'],
      transicion: 'Toca <b>Siguiente</b> para la pregunta rápida.' },
    rf2: { min: 2, puntos: ['Cierra la pregunta. Refuerza: <b>NC en reposo = bit 1</b>; pulsado o cable cortado = bit 0.'] },
    'f-sensor': { min: 10,
      objetivo: 'Que sepan elegir un sensor PNP o NPN y el común de módulo que le corresponde.',
      pasos: [
        '<b>Di:</b> "Los sensores sin contacto (inductivos, fotoeléctricos) no son un interruptor; tienen un transistor adentro y tres hilos: marrón más, azul menos, negro señal."',
        '<b>Haz:</b> en <b>3 · Sensor de 3 hilos</b> deja PNP con común a 0 V y toca <b>Acercar el objeto</b>: hay corriente y el bit vale 1.',
        '<b>Haz:</b> cambia el módulo a común a +24 V: aparece "no se entienden" y el bit queda en 0. "El sensor funciona, pero el camino no se cierra."',
        '<b>Haz:</b> cambia el sensor a NPN: ahora sí funciona con común a +24 V. "Son opuestos."',
        '<b>Haz:</b> cambia la salida a NC y observa: el bit vale 1 mientras no hay objeto.'
      ],
      preguntas: ['<b>"¿Cuál es el error más común?"</b> → Comprar el sensor por el catálogo sin mirar si es PNP o NPN, o cambiar de marca de PLC y no revisar el común.'],
      dudas: ['"¿Cómo sé qué tipo es mi módulo?" → Mira el manual y el esquema de conexión del módulo: ahí dice si el común va a 0 V o a +24 V. Los nombres sink y source se usan distinto según el fabricante.'],
      transicion: 'Toca <b>Siguiente</b> para la pregunta rápida.' },
    rf3: { min: 2, puntos: ['Cierra la pregunta. Refuerza: <b>PNP con común a 0 V</b>; <b>NPN con común a +24 V</b>.'] },
    'f-salida': { min: 10,
      objetivo: 'Que elijan entre salida a relé y a transistor según la carga, y que recuerden el contactor como puente.',
      pasos: [
        '<b>Di:</b> "Ahora al revés: una salida entrega energía a una carga. No todas las salidas sirven para todas las cargas."',
        '<b>Haz:</b> en <b>4 · Una salida</b> elige «Salida a relé» y recorre las cargas. Verifica que la barra muestra cuánta corriente toma frente al límite.',
        '<b>Haz:</b> cambia a transistor y elige la bobina de 220 V ca: aparece "no se puede": un transistor solo maneja continua.',
        '<b>Haz:</b> elige la válvula pulsada a 50 veces por segundo: el relé no sirve (lento); el transistor sí.',
        '<b>Haz:</b> elige el motor de 7,5 kW: ninguna sirve; se usa un contactor.'
      ],
      preguntas: ['<b>"¿Cuándo uso relé y cuándo transistor?"</b> → Relé: cargas de alterna o de más corriente y maniobras poco frecuentes. Transistor: cargas de 24 V cc de poca corriente o que se accionan muy seguido.'],
      dudas: ['"¿Por qué el diodo?" → Al cortar una bobina, esta genera un pico de tensión que puede dañar al transistor; el diodo en paralelo lo desvía.'],
      transicion: 'Toca <b>Siguiente</b> para la pregunta rápida.' },
    rf4: { min: 2, puntos: ['Cierra la pregunta. Refuerza: transistor = <b>solo continua</b> y poca corriente; para alterna, relé o contactor.'] },
    'f-conecta': { min: 10,
      pasos: [
        '<b>Di:</b> "Ahora cablean ustedes. Toquen un dispositivo y luego el terminal donde lo conectan."',
        '<b>Haz:</b> pídeles <b>Poner un ejemplo</b>, acciona el paro S2 y muestra que su bit cae a 0.',
        '<b>Haz:</b> pídeles ordenar <b>SD2.00 = 1</b>: responde el dispositivo que cablearon en ese terminal. "La dirección manda, no el nombre."',
        'Pregunta: "Si cablean la lámpara en SD2.00 y el programa usa SD2.00 para el contactor, ¿qué pasa?" → Se enciende la lámpara y el motor no arranca: hay que respetar la tabla de asignación.'
      ],
      transicion: 'Avisa "2 minutos" y toca <b>Siguiente</b>.' },
    'f-reto': { min: 10, pasos: ['<b>Di:</b> "Cinco casos propios: qué lee el PLC, qué sensor y qué salida corresponden y con qué dirección aparece el dispositivo."', '<b>Haz:</b> mira la pizarra y cierra cuando ~80 % haya enviado.'], transicion: 'Toca <b>Siguiente</b>.' },
    'f-revisa': { min: 5, puntos: ['Comenta los resultados de la pantalla.', 'Repasa el criterio: <b>NC lee 1 en reposo</b>; <b>PNP con común a 0 V</b>; <b>transistor solo en continua</b>.', 'Pide a alguien que explique por qué el paro se cablea NC.'] },
    'g-reles': { min: 8,
      objetivo: 'Conectar lo que ya saben (el circuito con contactor) con el diagrama de escalera.',
      pasos: [
        '<b>Di:</b> "Muchos de ustedes ya armaron este circuito con un contactor. La escalera es exactamente eso, dibujado para un PLC."',
        '<b>Haz:</b> en <b>1 · Del relé al PLC</b> con «Circuito cableado», pulsa <b>Marcha</b>: la bobina se energiza y, al soltar, el contacto auxiliar la mantiene. Pulsa <b>Paro</b>: se apaga.',
        '<b>Haz:</b> cambia a <b>Escalera del PLC</b> y repite: mismo comportamiento, pero ahora los contactos tienen direcciones (ED1.00, ED1.01, SD2.00).',
        '<b>Di:</b> "En el PLC el cableado entre contactos desaparece: lo reemplaza el programa."',
        '<b>Señala:</b> el paro es NC físico, pero en el programa se dibuja como contacto que deja pasar con 1. "En reposo su bit vale 1."'
      ],
      preguntas: ['<b>"¿Qué es el sello?"</b> → El contacto que mantiene la bobina después de soltar la marcha.'],
      dudas: ['"¿Entonces dibujo el paro como NC en el programa?" → No: el contacto del programa es NA porque lee un bit que en reposo vale 1. Si lo dibujaran NC, la lógica se invertiría.'],
      transicion: 'Toca <b>Siguiente</b> para la pregunta rápida.' },
    rg1: { min: 2, puntos: ['Cierra la pregunta. Refuerza: el <b>contacto auxiliar</b> de K1 es el sello.'] },
    'g-logica': { min: 10,
      objetivo: 'Que dominen serie, paralelo y NC, y que usen la tabla de verdad como herramienta de comprobación.',
      pasos: [
        '<b>Di:</b> "Toda escalera se reduce a tres ideas: en serie hacen falta todos; en paralelo basta uno; el NC invierte."',
        '<b>Haz:</b> en <b>2 · Lógica con contactos</b> elige «En serie». Pide que activen A y B por separado y juntos. Cada combinación nueva descubre una fila de la tabla.',
        '<b>Haz:</b> cambia a paralelo, luego al contacto NC y al mixto. En el mixto resuelve primero el paréntesis.',
        '<b>Di:</b> "Con n entradas hay 2<sup>n</sup> filas: con 3 entradas son 8. Antes de cargar un programa, pruebo todas."',
        '<b>Haz:</b> toca <b>Mostrar toda la tabla</b> para confirmar.'
      ],
      preguntas: ['<b>"¿Cuántas filas tiene una tabla de 4 entradas?"</b> → 16.', '<b>"¿Cuántas filas dan 1 en el AND de dos entradas?"</b> → Una.'],
      dudas: ['"¿Y cómo leo la ecuación?" → Serie es producto, paralelo es suma, la barra es «no». Q = A · (B + C) se lee: A y (B o C).'],
      transicion: 'Toca <b>Siguiente</b> para la pregunta rápida.' },
    rg2: { min: 2, puntos: ['Cierra la pregunta. Refuerza: <b>paralelo = suma = O</b>.'] },
    'g-leer': { min: 8,
      objetivo: 'Que lean una escalera con seguridad: rieles, contactos, bobina y direcciones.',
      pasos: [
        '<b>Di:</b> "Ahora a leer. Los rieles no llevan corriente real; imaginen un flujo lógico que va de izquierda a derecha."',
        '<b>Haz:</b> en <b>3 · Leer una escalera</b> toca cada elemento de la lista de la derecha y muestra cómo se resalta en el dibujo.',
        '<b>Haz:</b> pulsa la marcha S1 y luego el paro S2: observa que el bit de S2 baja a 0 y el renglón se corta.',
        '<b>Haz:</b> activa el flotador alto y luego el selector de mantenimiento: el contacto NC deja de pasar.',
        '<b>Di:</b> "Se lee de arriba abajo y de izquierda a derecha; cada renglón decide una bobina."'
      ],
      preguntas: ['<b>"¿Qué hace una bobina?"</b> → Escribe un bit: 1 si llega flujo.'],
      dudas: ['"¿El contacto NC significa que el sensor es NC?" → No: el símbolo NC del programa solo invierte el bit; no dice cómo está cableado el sensor.'],
      transicion: 'Toca <b>Siguiente</b> para la pregunta rápida.' },
    rg3: { min: 2, puntos: ['Cierra la pregunta. Refuerza: contacto NC del programa = deja pasar con bit <b>0</b>.'] },
    'g-scan': { min: 10,
      objetivo: 'Que entiendan por qué el sello funciona: lee el valor anterior de Q en cada escaneo.',
      pasos: [
        '<b>Di:</b> "El PLC ejecuta el programa una y otra vez. Cada vuelta se llama escaneo. Vamos a ejecutarlo despacio."',
        '<b>Haz:</b> en <b>4 · Escaneo y memoria</b> pulsa Marcha y avanza las tres fases: leer, ejecutar, escribir. Q pasa a 1.',
        '<b>Haz:</b> suelta Marcha y ejecuta otro escaneo completo. Q sigue en 1 y aparece el aviso verde del sello.',
        '<b>Di:</b> "La marcha ya no está, pero Q del escaneo anterior mantiene el renglón. Esa es la memoria."',
        '<b>Haz:</b> pulsa Paro y ejecuta otro escaneo: Q baja a 0. "Sin flujo, el sello ya no se sostiene."'
      ],
      preguntas: ['<b>"¿Qué pasa si Q empieza en 0 y nadie pulsa la marcha?"</b> → Q se queda en 0: el sello solo sostiene lo que ya estaba en 1.'],
      dudas: ['"¿Entonces la salida se actualiza dentro del renglón?" → Q cambia en la imagen al ejecutar; la salida física cambia recién al final del escaneo (lo vimos en el Bloque A).'],
      transicion: 'Toca <b>Siguiente</b> para la pregunta rápida.' },
    rg4: { min: 2, puntos: ['Cierra la pregunta. Refuerza: el sello lee el <b>Q del escaneo anterior</b>.'] },
    'g-explora': { min: 8,
      pasos: [
        '<b>Di:</b> "Exploren las cuatro pestañas. Tienen unos minutos."',
        '<b>Haz:</b> pídeles completar la tabla de verdad en el circuito mixto.',
        '<b>Haz:</b> pídeles ejecutar un escaneo con marcha, soltarla, y luego pulsar el paro.'
      ],
      transicion: 'Avisa "2 minutos" y toca <b>Siguiente</b>.' },
    'g-reto': { min: 10, pasos: ['<b>Di:</b> "Cada uno tiene un renglón distinto con contactos NA y NC. Calculen la salida en tres casos y reconozcan la ecuación."', '<b>Haz:</b> mira la pizarra y cierra cuando ~80 % haya enviado.'], transicion: 'Toca <b>Siguiente</b>.' },
    'g-revisa': { min: 5, puntos: ['Comenta los resultados.', 'Repasa: <b>serie = producto</b>; <b>paralelo = suma</b>; <b>NC invierte</b>.', 'Anuncia: "Ahora sí tenemos todo para el enclavamiento: lo vamos a escribir de cuatro formas."'] }
  };
  S.pasos.forEach((p) => { if (G[p.id]) p.guion = G[p.id]; });
  // el guion del enclavamiento ahora es el Bloque F: se ajusta la primera línea del paso a paso
  const gd = S.pasos.find((p) => p.id === 'd-explica');
  if (gd && gd.guion && gd.guion.pasos && gd.guion.pasos[0]) gd.guion.pasos[0] = '<b>Di:</b> "Ya sabemos cómo se conectan los dispositivos, cómo funciona un contacto y cómo ejecuta el PLC. Ahora juntamos todo en el enclavamiento. El pulsador de marcha se suelta; ¿cómo logra el motor seguir?" Deja 2 respuestas.';
})();
