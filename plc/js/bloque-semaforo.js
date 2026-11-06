// ============================================================
// Material nuevo (03/11/2026): el semáforo como ejemplo completo y una escalera de retos
// (de leer un GRAFCET sencillo a evolucionarlo con eventos).
// Va después del Reto F (h-revisa). Quita los pasos del enclavamiento (Bloque G) y la cápsula del gemelo
// (de momento no sirven, pedido del docente): el código de esos pasos queda en sesion1.js.
// Se carga después de bloque-grafcet.js, diagramas-grafcet.js y diagramas-semaforo.js.
// ============================================================
(function () {
  const II = window.II;
  const PL = (II.pl = II.pl || {});
  const S = II.SESIONES['pl-s1'];
  if (!S || !PL.grafcet || S.pasos.some((p) => p.id === 's-enun')) return;
  const GF = PL.grafcet;
  const unicas = (a) => a.filter((x, i) => a.indexOf(x) === i);

  // ---------- escena lineal de un GRAFCET (para los retos) ----------
  // nombres y acciones incluyen la etapa 0 (reposo); conds tiene una condición por transición (la última vuelve a 0)
  const escena = (nombres, accs, conds, oc = {}) => {
    const k = nombres.length - 1, Y = (i) => 50 + 130 * i;
    const steps = nombres.map((n, i) => ({ id: '' + i, x: 300, y: Y(i), init: i === 0, nom: n, acc: i > 0 ? (oc.acc === i ? '?' : accs[i]) : undefined, accW: 210 }));
    const trans = []; const lines = [];
    for (let i = 0; i < k; i++) trans.push({ in: 'c' + i, lab: oc.cond === i ? '?' : conds[i], from: ['' + i], to: ['' + (i + 1)], y: (Y(i) + Y(i + 1)) / 2 });
    const yT = Y(k) + 80;
    trans.push({ in: 'c' + k, lab: oc.cond === k ? '?' : conds[k], from: ['' + k], to: ['0'], y: yT, xt: 300 });
    lines.push([300, Y(k) + 18, 300, yT]);
    return { H: yT + 90, sinVal: true, steps, trans, lines, paths: [`M300 ${yT}V${yT + 40}H70V20H300V32`] };
  };
  const dib = (sc) => `<div class="lienzo" style="margin:8px 0">${GF.svgEstatico(sc)}</div>`;

  // ---------- escenarios ----------
  const SC3 = [
    { n: 'una bomba de llenado', nom: ['Llenando', 'Lleno'], acc: ['Encender la bomba', 'Encender la luz de lleno'], cond: ['Pulsador de arranque (NA)', 'Flotador de nivel alto activado', 'Pulsador de paro (NC)'] },
    { n: 'un portón corredizo', nom: ['Abriendo', 'Abierto'], acc: ['Motor en sentido abrir', 'Encender la luz de abierto'], cond: ['Pulsador de apertura (NA)', 'Final de carrera de apertura', 'Pulsador de cierre (NA)'] },
    { n: 'una cinta transportadora', nom: ['Avanzando', 'Con aviso'], acc: ['Encender el motor de la cinta', 'Encender la sirena'], cond: ['Pulsador de marcha (NA)', 'Sensor de fin de cinta activado', 'Pulsador de reconocimiento (NA)'] },
    { n: 'una mezcladora', nom: ['Mezclando', 'Descargando'], acc: ['Encender el agitador', 'Abrir la válvula de descarga'], cond: ['Pulsador de inicio (NA)', 'Pasaron 10 s', 'Pasaron 4 s'] },
    { n: 'un ventilador de túnel', nom: ['Ventilando', 'Con alarma'], acc: ['Encender el ventilador', 'Encender la luz de alarma'], cond: ['Pulsador de arranque (NA)', 'Sensor de humo activado', 'Pulsador de paro (NC)'] },
    { n: 'una llenadora de botellas', nom: ['Llenando', 'Sellando'], acc: ['Abrir la electroválvula', 'Bajar el sellador'], cond: ['Sensor de botella presente', 'Pasaron 6 s', 'Pasaron 3 s'] }
  ];
  const SC4 = [
    { n: 'una lavadora simple', nom: ['Llenando', 'Lavando', 'Vaciando'], acc: ['Abrir la válvula de agua', 'Girar el tambor', 'Encender la bomba de desagüe'], cond: ['Pulsador de inicio (NA)', 'Flotador de nivel alto activado', 'Pasaron 20 s', 'Flotador de nivel bajo activado'] },
    { n: 'una puerta automática', nom: ['Abriendo', 'Abierta', 'Cerrando'], acc: ['Motor en sentido abrir', 'Encender la luz verde', 'Motor en sentido cerrar'], cond: ['Sensor de presencia activado', 'Final de carrera de apertura', 'Pasaron 5 s', 'Final de carrera de cierre'] },
    { n: 'un dosificador', nom: ['Dosificando', 'Mezclando', 'Descargando'], acc: ['Abrir la válvula de ingreso', 'Girar el agitador', 'Abrir la compuerta'], cond: ['Pulsador de inicio (NA)', 'Pasaron 8 s', 'Pasaron 10 s', 'Pasaron 4 s'] },
    { n: 'una barrera de estacionamiento', nom: ['Subiendo', 'Arriba', 'Bajando'], acc: ['Motor sube la barrera', 'Encender la luz verde', 'Motor baja la barrera'], cond: ['Sensor de vehículo activado', 'Final de carrera superior', 'Pasaron 6 s', 'Final de carrera inferior'] }
  ];
  const esT = (x) => /^Pasaron/.test(x);
  // cuatro opciones: la correcta y tres distintas; nunca dos condiciones de tiempo (si la correcta es de tiempo, ninguna otra)
  const opciones4 = (r, ok, mias, otras) => {
    const pool = [...II.mezclar(r, mias.filter((x) => x !== ok)), ...II.mezclar(r, otras.filter((x) => x !== ok))];
    const sel = []; let tiempo = esT(ok);
    pool.forEach((x) => {
      if (sel.length >= 3 || sel.indexOf(x) >= 0) return;
      if (esT(x)) { if (tiempo) return; tiempo = true; }
      sel.push(x);
    });
    return II.mezclar(r, [ok, ...sel]);
  };
  // el enunciado en palabras: lo que el dibujo no dice y permite decidir sin adivinar
  const relato = (e) => {
    const n = e.nom.length;
    const filas = [`<li>En reposo todo está apagado.</li>`];
    for (let i = 0; i < n; i++) {
      const de = i === 0 ? 'En reposo' : `En la etapa ${i} («${e.nom[i - 1]}»)`;
      filas.push(`<li>${de}, cuando se cumple la condición «${e.cond[i]}», pasa a la etapa ${i + 1} («${e.nom[i]}») y ejecuta la acción «${e.acc[i]}».</li>`);
    }
    filas.push(`<li>En la etapa ${n} («${e.nom[n - 1]}»), cuando se cumple la condición «${e.cond[n]}», vuelve al reposo.</li>`);
    return `<p><b>Enunciado.</b> Se automatiza <b>${e.n}</b> así:</p><ul>${filas.join('')}</ul>`;
  };

  // ============================================================
  // RETOS
  // ============================================================
  const retoG = {
    titulo: 'Reto G · Lee un GRAFCET sencillo', puntos: 10,
    general: 'Cada estudiante recibe un GRAFCET distinto de tres etapas (una máquina diferente) y responde preguntas de lectura: cuántas etapas, cuál es la inicial, qué acción y qué condición.',
    pista: 'La etapa inicial es el cuadro doble. La acción está en el rectángulo a la derecha de su etapa y la condición está al lado de la rayita de la transición.',
    errorComun: 'Confundir la condición de una transición con la acción de una etapa, o creer que una transición actúa sin estar validada.',
    metodo: 'Etapa inicial = cuadro doble | acción = lo que se hace mientras la etapa está activa | condición = lo que hace falta para pasar a la siguiente etapa',
    generar(r) {
      const e = II.elegir(r, SC3), otros = SC3.filter((x) => x !== e);
      const sc = escena(['Reposo', ...e.nom], ['', ...e.acc], e.cond);
      const kk = II.elegir(r, [1, 2]), j = II.elegir(r, [0, 1]);
      const accOk = e.acc[kk - 1], condOk = e.cond[j];
      const optsAcc = II.mezclar(r, unicas([...e.acc, 'Ninguna: todo apagado', II.elegir(r, otros).acc[0]]));
      const optsCond = opciones4(r, condOk, e.cond, otros.flatMap((x) => x.cond));
      const nada = 'No ocurre nada: la transición no está validada';
      return {
        enunciado: `<p>Este GRAFCET describe el funcionamiento de <b>${e.n}</b>.</p>${dib(sc)}`,
        campos: [
          { id: 'a', tipo: 'select', pregunta: 'a) ¿Cuántas etapas tiene el GRAFCET (contando el reposo)?', opciones: ['2', '3', '4', '5'] },
          { id: 'b', tipo: 'select', pregunta: 'b) ¿Cuál es la etapa inicial?', opciones: ['0', '1', '2'] },
          { id: 'c', tipo: 'select', pregunta: `c) ¿Qué acción se ejecuta en la etapa ${kk}?`, opciones: optsAcc },
          { id: 'd', tipo: 'select', pregunta: `d) ¿Qué condición debe cumplirse para pasar de la etapa ${j} a la etapa ${j + 1}?`, opciones: optsCond },
          { id: 'e', tipo: 'select', pregunta: `e) Estás en la etapa 0 y se cumple la condición «${e.cond[2]}», que es la de la transición que vuelve al reposo. ¿Qué ocurre?`, opciones: II.mezclar(r, [nada, 'Se activa la etapa 0', 'Se activa la etapa 2', 'Se apagan todas las etapas']) }
        ],
        esperado: { a: '3', b: '0', c: accOk, d: condOk, e: nada },
        solucion: `<p><b>a) 3.</b> Reposo (0) y dos etapas más: ${e.nom[0]} (1) y ${e.nom[1]} (2).</p>
          <p><b>b) 0.</b> Es el cuadro doble: la etapa activa al arrancar.</p>
          <p><b>c) ${accOk}.</b> Es el rectángulo a la derecha de la etapa ${kk}.</p>
          <p><b>d) ${condOk}.</b> Está al lado de la rayita entre las etapas ${j} y ${j + 1}.</p>
          <p><b>e) Nada.</b> La transición espera que la etapa 2 esté activa; si no está validada, no se franquea aunque su condición se cumpla.</p>`
      };
    }
  };

  const SENS = [{ n: 'Flotador de nivel alto activado', s: 'LSH' }, { n: 'Sensor de botella presente', s: 'B1' }, { n: 'Final de carrera de puerta cerrada', s: 'FC1' }, { n: 'Sensor de temperatura alta', s: 'TS1' }];
  const retoH = {
    titulo: 'Reto H · De palabras a símbolos', puntos: 10,
    general: 'Cada estudiante recibe un sistema distinto y pasa condiciones y acciones del nivel 1 (palabras) al nivel 2 (símbolos), con el paro NC y un temporizador.',
    pista: 'Un paro NC vale 1 en reposo: al pulsarlo baja a 0, y su condición se escribe PP negado. Un tiempo se escribe T1 = n s.',
    errorComun: 'Escribir PP en lugar de PP negado para el paro NC.',
    metodo: 'NA presionado = su símbolo | NC presionado = símbolo negado | tiempo = T1 = n s | acción = salida = 1',
    generar(r) {
      const se = II.elegir(r, SENS), n = II.elegir(r, [3, 4, 5, 6, 8, 10, 12]);
      const maq = II.elegir(r, ['la bomba', 'el ventilador', 'el agitador', 'la cinta']);
      const otrosS = SENS.filter((x) => x !== se).map((x) => x.s);
      const tOpc = unicas([n, n + 2, Math.max(1, n - 2), n * 2].map((x) => `T1 = ${x} s`));
      return {
        enunciado: `<p>Un sistema tiene estos elementos: <b>PA</b>, pulsador de arranque (NA); <b>PP</b>, pulsador de paro (NC); <b>${se.s}</b>, ${se.n.toLowerCase()}; <b>T1</b>, temporizador de la etapa 1; <b>KM1</b>, contactor que enciende ${maq}.</p>
          <p>Pasa del <b>nivel 1</b> (en palabras) al <b>nivel 2</b> (con símbolos).</p>`,
        campos: [
          { id: 'a', tipo: 'select', pregunta: 'a) Condición «Pulsador de arranque (NA)»: ¿cómo se escribe en el nivel 2?', opciones: ['PA', 'PP', 'PA negado', 'PP negado'] },
          { id: 'b', tipo: 'select', pregunta: 'b) Condición «Pulsador de paro (NC) presionado»: ¿cómo se escribe en el nivel 2?', opciones: ['PA', 'PP', 'PA negado', 'PP negado'] },
          { id: 'c', tipo: 'select', pregunta: `c) Condición «${se.n}»: ¿cómo se escribe en el nivel 2?`, opciones: II.mezclar(r, unicas([se.s, ...otrosS.slice(0, 2), 'PP negado'])) },
          { id: 'd', tipo: 'select', pregunta: `d) Condición «Pasaron ${n} s en la etapa 1»: ¿cómo se escribe en el nivel 2?`, opciones: II.mezclar(r, tOpc) },
          { id: 'e', tipo: 'select', pregunta: `e) Acción «Encender ${maq}»: ¿cómo se escribe en el nivel 2?`, opciones: ['KM1 = 1', 'KM1 = 0', 'PA = 1', 'T1 = 1'] },
          { id: 'f', tipo: 'select', pregunta: 'f) Con el paro NC sin pulsar (en reposo), ¿cuánto vale el bit PP?', opciones: ['0', '1'] }
        ],
        esperado: { a: 'PA', b: 'PP negado', c: se.s, d: `T1 = ${n} s`, e: 'KM1 = 1', f: '1' },
        solucion: `<p><b>a) PA.</b> El pulsador NA presionado vale 1.</p>
          <p><b>b) PP negado.</b> El paro NC en reposo vale 1; al presionarlo baja a 0, y la condición se cumple cuando PP vale 0.</p>
          <p><b>c) ${se.s}.</b> Es el símbolo del sensor.</p>
          <p><b>d) T1 = ${n} s.</b> El temporizador de la etapa 1 con el tiempo pedido.</p>
          <p><b>e) KM1 = 1.</b> La acción pone la salida del contactor en 1.</p>
          <p><b>f) 1.</b> El NC en reposo deja pasar corriente.</p>`
      };
    }
  };

  const CARGAS = [
    { t: '24 V cc y 0,05 A', r: 'Relé o transistor', p: 'Es continua y de poca corriente: sirve cualquiera de las dos salidas.' },
    { t: '220 V ca y 0,1 A', r: 'Solo relé', p: 'Es de corriente alterna: un transistor solo maneja corriente continua.' }
  ];
  const retoI = {
    titulo: 'Reto I · Componentes y direcciones', puntos: 10,
    general: 'Cada estudiante recibe un semáforo con otras direcciones y otro tipo de lámpara: identifica bits en reposo, direcciones, cuántas entradas, salidas y temporizadores usa, y qué salida corresponde.',
    pista: 'Entradas (ED) son lo que el PLC lee: los pulsadores. Salidas (SD) son lo que comanda: las lámparas. Cada etapa con tiempo propio necesita su temporizador.',
    errorComun: 'Contar los temporizadores como entradas o salidas, o elegir la salida por la tensión sin mirar si es continua o alterna.',
    metodo: 'ED = pulsadores | SD = lámparas | NC en reposo = 1 | un temporizador por etapa con tiempo | ca = solo relé',
    generar(r) {
      const carga = II.elegir(r, CARGAS), col = II.mezclar(r, ['verde', 'amarilla', 'roja']);
      const dir = (i) => PL.direccion('SD', 1, i);
      const c = II.elegir(r, [0, 1, 2]);
      const opc = II.mezclar(r, unicas([dir(c), dir((c + 1) % 3), PL.direccion('ED', 1, c), PL.direccion('SD', 2, c)]));
      return {
        enunciado: `<p>Un semáforo tiene tres lámparas y se controla con un pulsador de arranque (NA, <b>ED1.00</b>) y un pulsador de paro (NC, <b>ED1.01</b>). Cada lámpara es de <b>${carga.t}</b>.</p>
          <p>Conexión de las lámparas: ${col.map((x, i) => `la ${x} a <b>${dir(i)}</b>`).join('; ')}.</p>
          <p>El GRAFCET es el del semáforo: verde 5 s; amarillo 2 s; rojo 5 s; cada etapa con tiempo lleva su temporizador.</p>`,
        campos: [
          { id: 'a', tipo: 'select', pregunta: 'a) Con el pulsador de paro sin pulsar, ¿qué valor tiene su bit?', opciones: ['0', '1'] },
          { id: 'b', tipo: 'select', pregunta: `b) ¿Con qué dirección aparece la lámpara ${col[c]} en el programa?`, opciones: opc },
          { id: 'c', tipo: 'select', pregunta: 'c) ¿Cuántas entradas digitales usa el sistema?', opciones: ['1', '2', '3', '5'] },
          { id: 'd', tipo: 'select', pregunta: 'd) ¿Cuántas salidas digitales usa el sistema?', opciones: ['1', '2', '3', '5'] },
          { id: 'e', tipo: 'select', pregunta: 'e) ¿Qué tipo de salida puede manejar esas lámparas?', opciones: ['Relé o transistor', 'Solo relé', 'Solo transistor', 'Ninguna: usar contactor'] },
          { id: 'f', tipo: 'select', pregunta: 'f) ¿Cuántos temporizadores necesita el GRAFCET?', opciones: ['1', '2', '3', '4'] }
        ],
        esperado: { a: '1', b: dir(c), c: '2', d: '3', e: carga.r, f: '3' },
        solucion: `<p><b>a) 1.</b> El paro es NC: en reposo deja pasar corriente.</p>
          <p><b>b) ${dir(c)}.</b> Es salida digital (SD), ranura 1, canal ${c}.</p>
          <p><b>c) 2.</b> Los dos pulsadores.</p>
          <p><b>d) 3.</b> Las tres lámparas.</p>
          <p><b>e) ${carga.r}.</b> ${carga.p}</p>
          <p><b>f) 3.</b> T1, T2 y T3: uno por cada etapa con tiempo propio.</p>`
      };
    }
  };

  const retoJ = {
    titulo: 'Reto J · Completa el GRAFCET', puntos: 10,
    general: 'Cada estudiante recibe un GRAFCET distinto de cuatro etapas al que le falta una acción y una condición (marcadas con «?»). Las completa y contesta preguntas sobre la estructura.',
    pista: 'Lee la secuencia completa: cada acción es coherente con el nombre de su etapa y cada condición con lo que viene después.',
    errorComun: 'Poner la acción de una etapa en la siguiente, o una condición que no corresponde al paso que sigue.',
    metodo: 'nombre de la etapa = qué hace | la transición espera lo que permite pasar a la etapa siguiente | la última transición vuelve a reposo',
    generar(r) {
      const e = II.elegir(r, SC4), otros = SC4.filter((x) => x !== e);
      const ia = II.elegir(r, [1, 2, 3]), ic = II.elegir(r, [0, 1, 2, 3]), ee = II.elegir(r, [1, 2, 3]);
      const sc = escena(['Reposo', ...e.nom], ['', ...e.acc], e.cond, { acc: ia, cond: ic });
      const accOk = e.acc[ia - 1], condOk = e.cond[ic];
      const optsA = opciones4(r, accOk, e.acc, otros.flatMap((x) => x.acc));
      const optsC = opciones4(r, condOk, e.cond, otros.flatMap((x) => x.cond));
      const sigE = ee === 3 ? '0' : String(ee + 1);
      return {
        enunciado: `${relato(e)}<p>El GRAFCET de este sistema está dibujado abajo, pero le faltan dos datos (marcados con «?»). Complétalos con lo que dice el enunciado.</p>${dib(sc)}`,
        campos: [
          { id: 'a', tipo: 'select', pregunta: `a) ¿Qué acción va en la etapa ${ia} (${e.nom[ia - 1]})?`, opciones: optsA },
          { id: 'b', tipo: 'select', pregunta: `b) ¿Qué condición va en la transición que sale de la etapa ${ic}?`, opciones: optsC },
          { id: 'c', tipo: 'select', pregunta: `c) La etapa ${ee} está activa y se cumple la condición de la transición que sigue. ¿Qué etapa se activa?`, opciones: ['0', '1', '2', '3'] },
          { id: 'd', tipo: 'select', pregunta: 'd) ¿Cuántas transiciones tiene el GRAFCET?', opciones: ['3', '4', '5', '6'] },
          { id: 'e', tipo: 'select', pregunta: 'e) ¿Cuántas etapas tienen una acción?', opciones: ['2', '3', '4', '5'] }
        ],
        esperado: { a: accOk, b: condOk, c: sigE, d: '4', e: '3' },
        solucion: `<p><b>a) ${accOk}.</b> Es lo que corresponde a la etapa «${e.nom[ia - 1]}».</p>
          <p><b>b) ${condOk}.</b> Es lo que hace falta para pasar de la etapa ${ic} a ${ic === 3 ? 'la 0' : 'la ' + (ic + 1)}.</p>
          <p><b>c) ${sigE}.</b> ${ee === 3 ? 'La última transición vuelve al reposo.' : 'Pasa a la etapa siguiente.'}</p>
          <p><b>d) 4.</b> Una entre cada par de etapas y la que vuelve al reposo.</p>
          <p><b>e) 3.</b> El reposo no tiene acción.</p>`
      };
    }
  };

  const EV = { A: 'Se presiona el pulsador de arranque', T: 'Pasa el tiempo de la etapa activa y se cumple su condición de tiempo', P: 'Se presiona el pulsador de paro' };
  const retoK = {
    titulo: 'Reto K · Evoluciona el GRAFCET', puntos: 10,
    general: 'Cada estudiante recibe una lista distinta de eventos sobre el GRAFCET del semáforo y debe decir en qué etapa queda, qué lámpara está encendida y qué eventos no hicieron nada.',
    pista: 'Aplica los eventos uno por uno. El arranque solo sirve en reposo, el paro solo se espera en el rojo, y el tiempo no avanza nada en reposo.',
    errorComun: 'Hacer avanzar el GRAFCET con un evento que no está validado (por ejemplo, el arranque estando en verde).',
    metodo: 'Reposo, arranque, 1 verde, 5 s, 2 amarillo, 2 s, 3 rojo | en rojo: 5 s vuelve a 1 y el paro vuelve a 0 | un evento sin transición validada no hace nada',
    generar(r) {
      const ev = ['A'];
      for (let i = 1; i < 6; i++) ev.push(II.elegir(r, ['T', 'T', 'T', 'P', 'A', 'T']));
      let s = 0, ign = 0, rojas = 0; const hist = [];
      ev.forEach((x) => {
        if (x === 'A') { if (s === 0) s = 1; else ign += 1; }
        else if (x === 'T') { if (s === 0) ign += 1; else { s = s === 1 ? 2 : s === 2 ? 3 : 1; if (s === 3) rojas += 1; } }
        else if (s === 3) s = 0; else ign += 1;
        hist.push(s);
      });
      const lamp = ['Ninguna', 'Verde', 'Amarilla', 'Roja'];
      const validas = ['Etapa, transición, etapa, transición', 'Transición, etapa, transición, etapa'.replace('Transición, etapa, transición, etapa', 'Etapa, transición, etapa, transición, etapa')];
      const mala = 'Etapa, transición, transición, etapa';
      return {
        enunciado: `<p>Recuerda el GRAFCET del semáforo: 0 reposo; el arranque lleva a 1 (verde); 5 s a 2 (amarillo); 2 s a 3 (rojo); en el rojo, 5 s vuelve a 1 y el paro lleva a 0. El arranque solo sirve en la etapa 0 y el paro solo se espera en el rojo.</p>
          <p>Parte de la situación inicial (etapa 0) y ocurren estos eventos en orden:</p>
          <ol>${ev.map((x) => `<li>${EV[x]}.</li>`).join('')}</ol>`,
        campos: [
          { id: 'a', tipo: 'select', pregunta: 'a) ¿Qué etapa está activa después del evento 3?', opciones: ['0', '1', '2', '3'] },
          { id: 'b', tipo: 'select', pregunta: 'b) ¿Qué etapa está activa después del evento 6 (al final)?', opciones: ['0', '1', '2', '3'] },
          { id: 'c', tipo: 'select', pregunta: 'c) ¿Qué lámpara está encendida al final?', opciones: lamp },
          { id: 'd', tipo: 'select', pregunta: 'd) ¿Cuántos eventos no hicieron nada (no había transición validada)?', opciones: ['0', '1', '2', '3', '4', '5'] },
          { id: 'e', tipo: 'select', pregunta: 'e) ¿Cuántas veces se activó la etapa 3 (rojo) durante los 6 eventos?', opciones: ['0', '1', '2', '3'] },
          { id: 'f', tipo: 'select', pregunta: 'f) ¿Cuál de estas secuencias NO respeta la regla de alternancia?', opciones: II.mezclar(r, [...validas, 'Etapa, transición, etapa', mala]) }
        ],
        esperado: { a: String(hist[2]), b: String(s), c: lamp[s], d: String(ign), e: String(rojas), f: mala },
        solucion: `<p>Etapa activa después de cada evento: ${hist.map((h, i) => `${i + 1}) ${h}`).join('; ')}.</p>
          <p><b>a) ${hist[2]}.</b> <b>b) ${s}.</b> <b>c) ${lamp[s]}.</b></p>
          <p><b>d) ${ign}.</b> Un evento no hace nada si su transición no está validada: el arranque fuera del reposo, el paro fuera del rojo o el tiempo en reposo.</p>
          <p><b>e) ${rojas}.</b></p>
          <p><b>f) ${mala}.</b> Hay dos transiciones seguidas: entre dos transiciones siempre debe haber una etapa.</p>`
      };
    }
  };
  S.retos['k1-reto'] = retoG; S.retos['k2-reto'] = retoH; S.retos['k3-reto'] = retoI; S.retos['k4-reto'] = retoJ; S.retos['k5-reto'] = retoK;

  // ============================================================
  // PASOS
  // ============================================================
  const rap = (id, ciclo, t, o, c, por) => ({ id, tipo: 'rapida', ciclo, titulo: 'Pregunta rápida', t, o, c, por });
  const C = 7;
  const reto = (n, id, tit) => [
    { id: 'k' + n + '-reto', tipo: 'reto', ciclo: C, titulo: tit, reto: 'k' + n + '-reto' },
    { id: 'k' + n + '-revisa', tipo: 'revisa', ciclo: C, titulo: 'Revisión del ' + tit.split('·')[0].trim(), reto: 'k' + n + '-reto' }
  ];
  const nuevos = [
    { id: 's-enun', tipo: 'explica', ciclo: C, titulo: 'Bloque G · Ejemplo completo: el semáforo', diagrama: 'semaforo', pestana: 'enunciado',
      ideas: [
        'Vamos a resolver <b>un ejemplo completo</b>: primero leemos el enunciado, luego identificamos los componentes y por último dibujamos el GRAFCET en sus dos niveles.',
        'Un semáforo de una vía: <b>verde 5 s, amarillo 2 s, rojo 5 s</b>. Se arranca con un pulsador; en el rojo, o se repite el ciclo o el paro lo lleva a reposo.',
        'Antes de dibujar, hay que preguntarse: ¿qué entradas tiene?; ¿qué salidas?; ¿qué estados distintos recorre?',
        'En reposo todas las lámparas están apagadas: ese es el estado inicial.'
      ] },
    { id: 's-comp', tipo: 'explica', ciclo: C, titulo: 'Bloque G · Identificar los componentes', diagrama: 'semaforo', pestana: 'componentes',
      ideas: [
        'Cada componente lleva su <b>símbolo</b>, su <b>característica</b>, su <b>dirección</b> y el <b>bit que tiene en reposo</b>.',
        '<b>Entradas</b>: el pulsador de arranque PA (NA, vale 0 en reposo) y el de paro PP (NC, vale 1 en reposo). <b>Salidas</b>: las lámparas H1, H2 y H3.',
        'Los tiempos no son componentes externos: los cuenta el PLC con los <b>temporizadores</b> T1, T2 y T3, uno por cada etapa con tiempo.',
        'Las lámparas son de 24 V cc y 0,05 A: sirve una salida a relé o a transistor.'
      ] },
    rap('rs1', C, '¿Cuántas salidas digitales necesita el semáforo de este ejemplo?',
      ['1', '2', '3', '5'], 2,
      'Son tres lámparas (verde, amarilla y roja), cada una en su propia salida: H1, H2 y H3. Los pulsadores son entradas.'),
    { id: 's-n1', tipo: 'explica', ciclo: C, titulo: 'Bloque G · El semáforo en GRAFCET nivel 1', diagrama: 'semaforo', pestana: 'nivel1',
      ideas: [
        'El <b>nivel 1</b> se escribe en palabras: «Pulsador de arranque (NA)», «Pasaron 5 s», «Encender luz verde».',
        'Hay <b>cuatro etapas</b>: 0 reposo (cuadro doble), 1 verde, 2 amarillo, 3 rojo.',
        'En el rojo hay <b>dos salidas</b>: pasan 5 s y vuelve al verde, o se presiona el pulsador de paro y vuelve a reposo.',
        'Prueba el modo <b>Automático</b>: cada etapa cuenta su tiempo y, al llegar, la transición se enciende y pasa a la siguiente.'
      ] },
    { id: 's-n2', tipo: 'explica', ciclo: C, titulo: 'Bloque G · El semáforo en GRAFCET nivel 2', diagrama: 'semaforo', pestana: 'nivel2',
      ideas: [
        'El <b>nivel 2</b> es la misma secuencia con los <b>símbolos</b> del programa: PA, T1 = 5 s, T2 = 2 s, T3 = 5 s, PP negado, H1 = 1.',
        'El paro es NC: su bit vale 1 en reposo y baja a 0 al pulsarlo; por eso la condición es <b>PP negado</b>.',
        'Cada temporizador cuenta mientras su etapa está activa. Si la etapa se apaga (por ejemplo, con el paro en el rojo), el temporizador se detiene y vuelve a 0.',
        'Si el nivel 1 está bien planteado, pasar al nivel 2 es solo cambiar palabras por símbolos.'
      ] },
    rap('rs2', C, 'Estás en el rojo y se presiona el paro antes de que pasen los 5 s. ¿Qué ocurre?',
      ['Se espera a que pasen los 5 s y recién se detiene', 'Vuelve a reposo, se apagan las lámparas y el temporizador se detiene', 'Vuelve al verde', 'No ocurre nada hasta soltar el paro'], 1,
      'La transición del paro está validada (la etapa 3 está activa) y su condición se cumple: se franquea de inmediato, sin esperar al tiempo.'),
    { id: 's-explora', tipo: 'explora', ciclo: C, titulo: 'Explora el semáforo', diagrama: 'semaforo', pestana: 'nivel1',
      guia: [
        'Presiona <b>Pulsar arranque</b> y luego <b>Que pasen los segundos</b>: el temporizador cuenta 0, 1, 2… y la transición se enciende al llegar.',
        'Prueba el <b>Automático</b> y mira cuántas veces se repite el ciclo.',
        'Estando en el rojo, pulsa el <b>paro</b> antes de que llegue a 5: ¿qué se apaga y qué le pasa al temporizador?',
        'Cambia a la pestaña <b>nivel 2</b> y repite: compara cada condición con su símbolo.'
      ] },
    ...reto(1, 'k1', 'Reto G · Lee un GRAFCET sencillo'),
    ...reto(2, 'k2', 'Reto H · De palabras a símbolos'),
    ...reto(3, 'k3', 'Reto I · Componentes y direcciones'),
    ...reto(4, 'k4', 'Reto J · Completa el GRAFCET'),
    ...reto(5, 'k5', 'Reto K · Evoluciona el GRAFCET')
  ];

  // ---------- se quitan los pasos 57 a 63 y se reubica el cierre al final ----------
  const quitar = ['d-explica', 'rd1', 'd-explora', 'rd2', 'd-reto', 'd-revisa', 'gemelo'];
  const cierre = S.pasos.find((p) => p.id === 'cierre');
  S.pasos = S.pasos.filter((p) => quitar.indexOf(p.id) < 0 && p.id !== 'cierre');
  S.pasos.push(...nuevos);
  if (cierre) {
    cierre.titulo = 'Cierre de la clase';
    cierre.ideas = [
      'El <b>GRAFCET</b> describe una secuencia con etapas, transiciones y acciones; una transición se franquea si está validada y su condición se cumple.',
      'Se escribe en <b>nivel 1</b> (en palabras) y en <b>nivel 2</b> (con los símbolos del programa: PA, PP negado, T1 = 5 s, H1 = 1).',
      'Un paro <b>NC</b> vale 1 en reposo: su condición es <b>PP negado</b>. Cada etapa con tiempo lleva su temporizador y este vuelve a 0 si la etapa se apaga.',
      'Antes de dibujar: identificar entradas, salidas, estados y tiempos.'
    ];
    S.pasos.push(cierre);
  }
  let k = 0;
  S.pasos.forEach((p) => { if (p.tipo === 'rapida') { k += 1; p.titulo = 'Pregunta rápida ' + k; } });

  // ---------- guion docente ----------
  const gRet = (obj, pasos, pregs) => ({ min: 10, objetivo: obj, puntos: pasos });
  const G = {
    's-enun': { min: 6, objetivo: 'Que lean un enunciado y se pregunten qué entradas, salidas, estados y tiempos tiene antes de dibujar.',
      pasos: ['<b>Di:</b> "Vamos a resolver un problema completo. Antes de dibujar, leemos bien el enunciado."', '<b>Haz:</b> en <b>1 · Enunciado</b> lee el texto en voz alta y pregunta: "¿Qué entradas ven? ¿Qué salidas? ¿Cuántos estados distintos?"', '<b>Di:</b> "Verde, amarillo, rojo y reposo: cuatro estados. Eso serán cuatro etapas."'],
      preguntas: ['<b>"¿Cuántas etapas tendrá?"</b> → Cuatro: reposo, verde, amarillo y rojo.', '<b>"¿Cuál es la inicial?"</b> → El reposo.'],
      dudas: ['"¿Y si el paro se pulsa en verde?" → En este enunciado el paro solo se espera en el rojo; es una decisión de diseño.'],
      transicion: 'Toca <b>Siguiente</b> para identificar los componentes.' },
    's-comp': { min: 8, objetivo: 'Que identifiquen entradas, salidas y temporizadores con símbolo, característica, dirección y bit en reposo.',
      pasos: ['<b>Haz:</b> en <b>2 · Componentes</b> recorre la tabla fila por fila.', '<b>Di:</b> "PA es NA: vale 0 en reposo. PP es NC: vale 1 en reposo."', '<b>Di:</b> "Los tiempos no son componentes externos: los cuenta el PLC con temporizadores, uno por etapa con tiempo."'],
      preguntas: ['<b>"¿Cuántas entradas y cuántas salidas?"</b> → Dos entradas y tres salidas.', '<b>"¿Qué salida sirve?"</b> → Relé o transistor: 24 V cc y 0,05 A.'],
      dudas: ['"¿Por qué ED1.00 y no otro?" → Es la asignación del ejemplo; en un proyecto real la define la tabla de asignación.'],
      transicion: 'Toca <b>Siguiente</b> para la pregunta rápida.' },
    rs1: { min: 2, puntos: ['Cierra la pregunta. Refuerza: lámparas = salidas (3); pulsadores = entradas (2).'] },
    's-n1': { min: 10, objetivo: 'Que lean el GRAFCET nivel 1 y vean cómo el tiempo y el paro hacen evolucionar la secuencia.',
      pasos: ['<b>Haz:</b> en <b>3 · GRAFCET nivel 1</b> toca <b>Pulsar arranque</b> y luego <b>Que pasen los segundos</b>: el temporizador cuenta 0, 1, 2, 3, 4, 5 y la transición se enciende.', '<b>Haz:</b> toca <b>Automático</b> y deja que recorra una vuelta.', '<b>Haz:</b> en el rojo, antes del 5, toca <b>Pulsar paro</b>: vuelve a reposo y el temporizador se detiene.', '<b>Di:</b> "Dos salidas en el rojo: tiempo o paro."'],
      preguntas: ['<b>"¿Qué pasa si el paro se pulsa en verde?"</b> → Nada: ese GRAFCET no lo espera en esa etapa.'],
      dudas: ['"¿Y si pasan 5 s y se pulsa el paro a la vez?" → En un diseño real las condiciones deben ser excluyentes; aquí lo que ocurra primero decide.'],
      transicion: 'Toca <b>Siguiente</b> para el nivel 2.' },
    's-n2': { min: 8, objetivo: 'Que pasen del nivel 1 al nivel 2 reconociendo PP negado y los temporizadores T1, T2 y T3.',
      pasos: ['<b>Haz:</b> en <b>4 · GRAFCET nivel 2</b> compara cada condición con la del nivel 1.', '<b>Di:</b> "El paro NC vale 1 en reposo; la condición se cumple al pulsarlo, cuando vale 0: PP negado."', '<b>Haz:</b> prueba arranque, segundos y paro en el rojo.'],
      preguntas: ['<b>"¿Qué cambia entre nivel 1 y nivel 2?"</b> → Las palabras por símbolos; la secuencia es la misma.'],
      dudas: [],
      transicion: 'Toca <b>Siguiente</b> para la pregunta rápida.' },
    rs2: { min: 2, puntos: ['Cierra la pregunta. Refuerza: el paro en el rojo se franquea de inmediato y detiene el temporizador.'] },
    's-explora': { min: 6, objetivo: 'Que exploren el semáforo por su cuenta.', pasos: ['<b>Di:</b> "Ahora ustedes. Prueben el arranque, los segundos, el automático y el paro."'], preguntas: [], dudas: [], transicion: 'Toca <b>Siguiente</b> para el primer reto.' },
    'k1-reto': { min: 8, puntos: ['Reto simple: lectura de un GRAFCET de otra máquina. Deja que lo resuelvan solos.'] },
    'k1-revisa': { min: 4, puntos: ['Comenta los resultados.', 'Repasa: etapa inicial, acción y condición.'] },
    'k2-reto': { min: 8, puntos: ['Del nivel 1 al nivel 2. Cuidado con PP negado.'] },
    'k2-revisa': { min: 4, puntos: ['Comenta los resultados.', 'Repasa: NC en reposo vale 1; presionado vale 0; condición PP negado.'] },
    'k3-reto': { min: 8, puntos: ['Componentes, direcciones y salida adecuada.'] },
    'k3-revisa': { min: 4, puntos: ['Comenta los resultados.', 'Repasa: entradas son pulsadores; salidas son lámparas; ca = solo relé.'] },
    'k4-reto': { min: 8, puntos: ['Completar un GRAFCET de cuatro etapas con acción y condición ocultas.'] },
    'k4-revisa': { min: 4, puntos: ['Comenta los resultados.', 'Repasa: la acción corresponde al nombre de la etapa; la condición, al paso que sigue.'] },
    'k5-reto': { min: 10, puntos: ['Evolucionar el GRAFCET del semáforo con una lista de eventos. Es el reto más difícil.'] },
    'k5-revisa': { min: 5, puntos: ['Comenta los resultados.', 'Repasa: un evento sin transición validada no hace nada.', 'Cierra: "El GRAFCET es la base para programar la escalera."'] }
  };
  S.pasos.forEach((p) => { if (G[p.id]) p.guion = G[p.id]; });
})();
