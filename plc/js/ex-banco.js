// ============================================================
// Banco del Examen final (pl-ex, 40 % del módulo) · Programación de Controladores e Interfaces Industriales
// 13 casillas en 3 partes; a cada carnet le toca UNA plantilla por casilla, con datos propios.
//   Parte A (30 pts): diagnóstico; 10 casillas de 3 puntos (opción o cálculo).
//   Parte B (30 pts): leer y predecir; 2 casos de 15 puntos (GRAFCET con ramas simultáneas y temporizador; escaneo de ecuaciones).
//   Parte C (40 pts): diseñar; 1 máquina por carnet, 10 casilleros de 4 puntos (SET, RESET, regla de E0, salida, escalera, prueba).
// Convenciones: la barra encima de una señal indica negación (se escribe con el carácter combinante U+0305);
//   «·» es la multiplicación lógica (AND) y «+» la suma lógica (OR). El paro PP es un contacto NC: su bit vale 1 en reposo.
//   Etapa: Ei = (SEi + Ei) · negado(REi); SEi = etapa anterior · condición; REi = etapa siguiente + negado(PP) (o la condición de salida).
//   La etapa inicial: E0 = negado(E1) · negado(E2) · negado(E3).
// Todo es determinista: la misma semilla (carnet) da siempre la misma prueba.
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  const EX = (II.EX = II.EX || {});
  const el = II.elegir, mez = II.mezclar;
  const esc = (s) => II.esc(s);

  EX.META = {
    id: 'pl-ex', titulo: 'Examen final', subtitulo: 'Programación de Controladores e Interfaces Industriales',
    minutos: 60, peso: 40, nEval: 13
  };
  EX.TEMAS = {
    a: 'Parte A; diagnóstico de E/S, escaneo, escalera y GRAFCET',
    b: 'Parte B; leer y predecir',
    c: 'Parte C; diseñar'
  };

  // ---------- constructores ----------
  const op = (t, ok, mal, por) => ({ k: 'op', t, ok, mal, por });
  const opg = (gen) => ({ k: 'opg', gen });
  const num = (gen) => ({ k: 'num', gen });
  const cam = (gen) => ({ k: 'cam', gen });
  const f3 = (x) => II.fmt(x, 3);
  const unicas = (a) => a.filter((x, i) => a.indexOf(x) === i);
  const ov = (x) => Array.from(String(x)).map((c) => c + '̅').join('');   // barra para texto plano (opciones de un select)
  const ovh = (x) => `<span style="text-decoration:overline;text-decoration-thickness:1.5px">${x}</span>`;   // barra para HTML
  const opc = (r, ok, malas) => mez(r, unicas([ok, ...mez(r, malas.filter((x) => x !== ok)).slice(0, 3)]));
  EX._ov = ov;

  // ============================================================
  // Utilidades de lógica
  // ============================================================
  const tabla = (nv, f) => { const out = []; for (let i = 0; i < (1 << nv); i++) out.push(f(...Array.from({ length: nv }, (_, k) => !!((i >> (nv - 1 - k)) & 1)))); return out; };
  const equiv = (nv, f, g) => tabla(nv, f).every((v, i) => v === tabla(nv, g)[i]);
  const cuenta = (nv, f) => tabla(nv, f).filter(Boolean).length;

  // ============================================================
  // PARTE A
  // ============================================================
  const S = (id, tema, tipo, peso, plantillas) => ({ id, tema, tipo, peso, plantillas });

  // De Morgan: el original y una expresión equivalente; las demás del banco son distractores (se verifican por tabla de verdad)
  const DM = [
    { o: `${ov('A · B + C')}`.replace(/./g, (c) => c), t: '/(A · B + C)', f: (a, b, c) => !((a && b) || c), eq: '(/A + /B) · /C', fe: (a, b, c) => (!a || !b) && !c },
    { t: '/((A + /B) · C)', f: (a, b, c) => !((a || !b) && c), eq: '/A · B + /C', fe: (a, b, c) => (!a && b) || !c },
    { t: '/(A · /B + /C)', f: (a, b, c) => !((a && !b) || !c), eq: '(/A + B) · C', fe: (a, b, c) => (!a || b) && c },
    { t: '/(/A · B · C)', f: (a, b, c) => !(!a && b && c), eq: 'A + /B + /C', fe: (a, b, c) => a || !b || !c },
    { t: '/((A + B) · (/B + C))', f: (a, b, c) => !((a || b) && (!b || c)), eq: '/A · /B + B · /C', fe: (a, b, c) => (!a && !b) || (b && !c) }
  ];
  const POOL = [
    ['/A · /B · /C', (a, b, c) => !a && !b && !c], ['/A + /B + /C', (a, b, c) => !a || !b || !c], ['/A · /B + /C', (a, b, c) => (!a && !b) || !c],
    ['A · B + /C', (a, b, c) => (a && b) || !c], ['(/A + B) · /C', (a, b, c) => (!a || b) && !c], ['/A · B + C', (a, b, c) => (!a && b) || c],
    ['(A + /B) · C', (a, b, c) => (a || !b) && c], ['(A + B) · /C', (a, b, c) => (a || b) && !c], ['A · /B · C', (a, b, c) => a && !b && c],
    ['/A · B + /B · C', (a, b, c) => (!a && b) || (!b && c)]
  ];
  const conBarras = (txt) => txt.replace(/\/([A-Z]\d?)/g, (_, v) => ov(v)).replace(/\/\(([^)]*)\)/g, (_, w) => '(' + w + ')̅').replace(/̅\)̅/g, '̅)̅');
  // texto con barra: se arma a mano para evitar ambigüedad (la barra larga cubre el paréntesis completo)
  const dmTexto = (txt) => txt.startsWith('/(') ? '[' + txt.slice(2, -1).replace(/\/([A-Z])/g, (_, v) => ov(v)) + ']^barra' : txt.replace(/\/([A-Z])/g, (_, v) => ov(v));
  const barraLarga = (inner) => `<span style="text-decoration:overline;text-decoration-thickness:1.5px;padding:0 2px">${inner}</span>`;
  const htmlNeg = (txt) => txt.replace(/\/([A-Z])/g, (_, v) => ovh(v));
  const textoDM = (d) => {   // HTML del original: la barra larga cubre todo lo que hay dentro de los paréntesis
    const inner = d.t.slice(2, -1);
    return barraLarga(htmlNeg(inner));
  };

  S; // (se usa más abajo)

  const A = [
    // A1: tiempo de ciclo con crecimiento del programa
    S('a1', 'a', 'num', 3, [
      num((r) => {
        const N = el(r, [2000, 3000, 4000, 5000, 6000]), b = el(r, [1, 2, 3]), a = el(r, [2, 3, 4, 5]), g = el(r, [30, 40, 50, 60]);
        const T0 = a + (N * b) / 1000, N1 = N * (1 + g / 100), T1 = a + (N1 * b) / 1000;
        return { t: `Un PLC tarda ${a} ms por ciclo en leer entradas, escribir salidas y atender comunicaciones, y ejecuta un programa de ${N} instrucciones de ${b} µs cada una. Se agregan funciones y el programa crece ${g} %. ¿Cuál es el pulso más corto, en ms, que el PLC detecta con seguridad después de la ampliación?`,
          valor: T1, unidad: 'ms', sol: `Ciclo nuevo = ${a} ms + ${f3(N1)} instrucciones · ${b} µs = ${f3(T1)} ms (antes era ${f3(T0)} ms). El pulso debe durar más que un ciclo completo.`,
          por: 'Para que un pulso no pase entre dos lecturas de las entradas debe durar al menos un ciclo completo; al crecer el programa, el ciclo se alarga.' };
      }),
      num((r) => {
        const T = el(r, [8, 10, 12, 16, 20, 25]), d = el(r, [3, 4, 5, 6]);
        return { t: `El tiempo de ciclo de un PLC es de ${T} ms. Un sensor entrega pulsos de ${T * d} ms de duración. Como mínimo, ¿cuántos ciclos completos ocurren mientras dura un pulso?`,
          valor: d, unidad: 'ciclos', tolRel: 0.001, sol: `${T * d} ms ÷ ${T} ms = ${d} ciclos; el pulso se lee en todos ellos.`,
          por: 'El número de lecturas que alcanzan un pulso es su duración dividida entre el tiempo de ciclo.' };
      })
    ]),
    // A2: contactos NA/NC y falla segura
    S('a2', 'a', 'opcion', 3, [
      op('El pulsador de paro de una máquina se cablea como contacto normalmente cerrado (NC). El cable que lleva su señal al PLC se corta por un golpe. ¿Qué ocurre?',
        'El PLC deja de recibir tensión en esa entrada, la interpreta como paro pulsado y detiene la máquina: la falla del cable es segura',
        ['El PLC no detecta el corte y la máquina sigue funcionando normalmente', 'La entrada queda en 1 y se activa la marcha', 'La entrada del PLC se daña por el cortocircuito'],
        'Con un NC, la entrada vale 1 en reposo y 0 cuando se pulsa o se corta el cable. Por eso un cable cortado se lee como paro: falla segura.'),
      op('En las ecuaciones aparece el paro como PP negado en el RESET de cada etapa. ¿Qué valor tiene el bit PP cuando nadie toca el pulsador (contacto NC)?',
        '1: el contacto NC está cerrado y deja pasar la señal; al pulsar, el bit pasa a 0 y el RESET se activa',
        ['0: el contacto NC está abierto en reposo', 'Depende de la marcha, no del paro', 'Queda indefinido hasta el primer escaneo'],
        'El NC conduce en reposo; al presionarlo se abre y el bit cae a 0. Por eso el RESET usa PP negado: se cumple cuando se pulsa el paro.'),
      op('Un operario pulsa la marcha (NA) solo un instante y la suelta. ¿Qué mantiene funcionando al motor?',
        'Un enclavamiento: la etapa activa del GRAFCET o un contacto con el nombre de la bobina en paralelo con la marcha',
        ['El propio pulsador NA, que sigue cerrado después de soltarlo', 'El temporizador de vigilancia (watchdog) de la CPU', 'La imagen de entradas, que conserva el pulsador para siempre'],
        'El pulsador NA vuelve a abrirse al soltarlo; la memoria (etapa o enclavamiento) mantiene la salida hasta el paro.')
    ]),
    // A3: sensores de 3 hilos
    S('a3', 'a', 'opcion', 3, [
      op('Un sensor inductivo de 3 hilos tipo PNP detecta una pieza. ¿Qué hace su hilo de señal?',
        'Entrega +24 V a la entrada del PLC (conecta la señal al positivo de la alimentación)',
        ['Conecta la entrada del PLC a 0 V', 'Abre el circuito y deja la entrada sin tensión, igual que sin pieza', 'Entrega una corriente de 4–20 mA proporcional a la distancia'],
        'PNP significa que el transistor de salida conecta la señal al positivo (+24 V) al detectar. El NPN la conecta a 0 V.'),
      op('Un sensor NPN de 3 hilos se conecta a una entrada del PLC que espera +24 V cuando hay detección. ¿Qué pasa?',
        'Al detectar, el sensor conecta la señal a 0 V; esa entrada nunca recibe +24 V y no se activa: hay que usar un sensor PNP o una entrada compatible',
        ['Funciona igual, porque PNP y NPN son lo mismo', 'La entrada se daña inmediatamente', 'La entrada se activa siempre, aunque no haya pieza'],
        'La polaridad del sensor debe coincidir con la del módulo de entrada: PNP entrega positivo y NPN conecta a 0 V.'),
      op('Un sensor de 3 hilos tiene los hilos marrón, azul y negro. ¿Para qué sirve cada uno?',
        'Marrón: +24 V de alimentación; azul: 0 V; negro: señal de salida hacia el PLC',
        ['Marrón: señal; azul: +24 V; negro: 0 V', 'Marrón: 0 V; azul: señal; negro: +24 V', 'Los tres hilos llevan señal y se eligen según el PLC'],
        'En el código de colores habitual, marrón es positivo, azul es 0 V y negro es la señal de salida.')
    ]),
    // A4: salidas del PLC
    S('a4', 'a', 'opcion', 3, [
      op('Se debe comandar la bobina de un contactor de 220 V de corriente alterna desde el PLC. ¿Qué salida conviene?',
        'Salida a relé: soporta cargas de CA y aísla eléctricamente al PLC; es más lenta, pero suficiente para un contactor',
        ['Salida a transistor, porque conmuta más rápido y sirve para CA', 'Salida analógica de 4–20 mA', 'Cualquiera, el tipo de salida no depende de la carga'],
        'El transistor del PLC es de corriente continua; para cargas de CA se usa relé (o un módulo especial de triac).'),
      op('Una salida debe conmutar a 1 kHz una carga de 24 V en corriente continua. ¿Qué módulo conviene?',
        'Salida a transistor: conmuta rápido y no tiene desgaste mecánico; solo sirve para corriente continua',
        ['Salida a relé, porque aguanta más conmutaciones por segundo', 'Salida a relé, porque es más rápida', 'Ninguno puede conmutar a esa frecuencia'],
        'Un relé tarda milisegundos y tiene vida mecánica limitada; el transistor soporta frecuencias altas.'),
      op('El relé de una salida del PLC, que comanda un motor pequeño unas 10 veces por minuto, se desgasta mucho antes de lo esperado. ¿Cuál es la causa más probable y la medida?',
        'La conmutación frecuente de una carga inductiva desgasta los contactos; conviene comandar un contactor o usar una salida a transistor/estado sólido con protección',
        ['El PLC envía demasiada tensión; hay que bajar la tensión de la fuente', 'El programa es muy lento; hay que alargar el ciclo', 'Es normal: los relés están hechos para durar pocas horas'],
        'Los contactos del relé sufren con cargas inductivas y muchas maniobras. Se protege la carga o se cambia el tipo de salida.')
    ]),
    // A5: rack y direcciones
    S('a5', 'a', 'opcion', 3, [
      opg((r) => {
        const orden = mez(r, ['DI', 'DO', 'DI', 'AI']);
        const nombres = { DI: 'entradas digitales', DO: 'salidas digitales', AI: 'entradas analógicas' };
        const cuantos = el(r, [8, 16]);
        const lista = orden.map((m, i) => `ranura ${i + 1}: ${m} (${nombres[m]}${m === 'AI' ? '' : ', ' + cuantos + ' canales'})`).join('; ');
        const idxDI = orden.map((m, i) => (m === 'DI' ? i + 1 : -1)).filter((x) => x > 0);
        const k = el(r, [0, 1]), canal = el(r, [2, 3, 5, 6, 7]);
        const ok = `DI${idxDI[k]}.${canal}`;
        const otra = `DI${idxDI[1 - k]}.${canal}`;
        const mal = [otra, `DI${idxDI[k]}.${canal === 7 ? 6 : canal + 1}`, `DI${idxDI[k]}.${canal === 0 ? 1 : canal - 1}`, `DO${idxDI[k]}.${canal}`, `DI${idxDI[k] + 1}.${canal}`];
        return { t: `Un rack tiene la CPU en la ranura 0 y estos módulos: ${lista}. Las ranuras y los canales se numeran desde 0 y la dirección se escribe TIPO + ranura + punto + canal. ¿Qué dirección tiene el sensor conectado al canal ${canal} del ${k === 0 ? 'primer' : 'segundo'} módulo de entradas digitales?`,
          ok, mal, por: `El ${k === 0 ? 'primer' : 'segundo'} módulo DI está en la ranura ${idxDI[k]}; con el canal ${canal} la dirección es ${ok}.` };
      }),
      opg((r) => {
        const di = el(r, [10, 14, 18, 22]), dO = el(r, [6, 9, 11, 13]), ai = el(r, [2, 3, 5]);
        const nDI = Math.ceil(di / 8), nDO = Math.ceil(dO / 8), nAI = Math.ceil(ai / 4);
        const f = (a, b, c) => `${a} de entradas digitales, ${b} de salidas digitales y ${c} de entradas analógicas`;
        const ok = f(nDI, nDO, nAI);
        const mal = [f(nDI + 1, nDO, nAI), f(nDI, nDO + 1, nAI), f(nDI, nDO, nAI + 1), f(Math.max(1, nDI - 1), nDO, nAI), f(nDI, Math.max(1, nDO - 1), nAI), f(nDI - 1 || 2, nDO + 1, nAI + 1)];
        return { t: `Una máquina tiene ${di} pulsadores y sensores digitales, ${dO} salidas digitales y ${ai} transmisores de 4–20 mA. Hay módulos de 8 entradas digitales, de 8 salidas digitales y de 4 entradas analógicas. ¿Cuántos módulos se necesitan como mínimo (cantidad de módulos de cada tipo)?`,
          ok, mal, por: `Se redondea hacia arriba cada tipo: ${di}/8 → ${nDI}; ${dO}/8 → ${nDO}; ${ai}/4 → ${nAI}.` };
      })
    ]),
    // A6: escalera, cuántas combinaciones activan la bobina
    S('a6', 'a', 'num', 3, [
      num((r) => {
        const L = [
          ['A en paralelo con B, todo eso en serie con C en paralelo con /D', 4, (a, b, c, d) => (a || b) && (c || !d)],
          ['A en serie con B, todo eso en paralelo con C en serie con D', 4, (a, b, c, d) => (a && b) || (c && d)],
          ['A (NA) en serie con B (NC), todo eso en paralelo con C (NA) en serie con D (NC)', 4, (a, b, c, d) => (a && !b) || (c && !d)],
          ['A (NC) en paralelo con B (NA), todo eso en serie con C (NA) y D (NC)', 4, (a, b, c, d) => (!a || b) && c && !d]
        ];
        const [t, nv, f] = el(r, L);
        const n = cuenta(nv, f);
        return { t: `Un escalón de escalera tiene los contactos A, B, C y D, en serie y en paralelo así: ${t}. En una descripción «/X» indica contacto normalmente cerrado y la bobina Q se activa si hay un camino cerrado. De las 16 combinaciones posibles de A, B, C y D, ¿en cuántas se activa Q?`,
          valor: n, unidad: 'combinaciones', tolRel: 0.001, sol: `Se evalúan las 16 combinaciones con la tabla de verdad: Q se activa en ${n}.`,
          por: 'Serie es producto (AND) y paralelo es suma (OR); un contacto NC se lee negado. Se cuenta cuántas de las 16 filas dan 1.' };
      })
    ]),
    // A7: enclavamiento y bobinas
    S('a7', 'a', 'opcion', 3, [
      op('En un arranque-paro en escalera, el motor funciona solo mientras se mantiene presionada la marcha y se apaga al soltarla. ¿Qué falta?',
        'El contacto de enclavamiento (con el nombre de la bobina) en paralelo con la marcha',
        ['Un segundo pulsador de paro en paralelo', 'Cambiar la marcha de NA a NC', 'Un temporizador en serie con la bobina'],
        'El enclavamiento mantiene la bobina encendida por sí mismo después de que la marcha se suelta.'),
      op('En una escalera, al pulsar el paro la bobina no se apaga. Revisas y el contacto del paro está en paralelo con la marcha. ¿Cuál es el error?',
        'El paro (contacto NC) debe ir en serie con el tramo marcha/enclavamiento; en paralelo nunca corta el camino',
        ['El paro debe ser un contacto NA en paralelo con la marcha', 'Falta un segundo paro en paralelo con el primero', 'La bobina debe tener otro nombre'],
        'Para cortar la corriente el paro debe estar en serie. Un contacto en paralelo solo agrega caminos.'),
      op('Un programa tiene dos escalones con la misma bobina Q: en el primero se activa con M y en el segundo con N. ¿Qué problema genera?',
        'La última bobina evaluada en el escaneo manda: la primera queda anulada y el comportamiento es confuso',
        ['Ninguno: Q se activa cuando cualquiera de los dos escalones conduce', 'El PLC rechaza el programa y no arranca', 'Q se activa solo si los dos escalones conducen a la vez'],
        'Cada escaneo escribe Q dos veces; vale el último resultado. Se corrige con un solo escalón que reúna las condiciones.')
    ]),
    // A8: reglas del GRAFCET
    S('a8', 'a', 'opcion', 3, [
      op('¿Cuándo se franquea una transición de un GRAFCET?',
        'Cuando todas las etapas anteriores están activas y la receptividad es verdadera',
        ['Cuando la receptividad es verdadera, aunque la etapa anterior esté inactiva', 'Cuando la etapa siguiente ya está activa', 'En cada escaneo, sin importar las condiciones'],
        'Se necesitan las dos cosas: etapa anterior activa y condición de la transición cumplida.'),
      op('Al franquearse una transición, ¿qué ocurre?',
        'Se activan todas las etapas siguientes y se desactivan todas las anteriores',
        ['Solo se activa la siguiente; la anterior sigue activa hasta el paro', 'Solo se desactiva la anterior; la siguiente espera otra condición', 'No cambia nada hasta el próximo escaneo completo del programa'],
        'El franqueo activa las etapas de salida y desactiva las de entrada en un mismo paso.'),
      op('En una convergencia en AND (línea doble) llegan dos etapas, E2 y E4. ¿Cuándo se franquea la transición que sigue?',
        'Cuando E2 y E4 están activas a la vez y se cumple la receptividad',
        ['Cuando E2 o E4 está activa y se cumple la receptividad', 'Apenas se activa cualquiera de las dos, sin condición', 'Cuando E2 y E4 están inactivas'],
        'Una convergencia en AND espera que todas las ramas hayan terminado.'),
      op('¿Qué diferencia hay entre el GRAFCET de nivel 1 y el de nivel 2?',
        'El nivel 1 describe el proceso en palabras; el nivel 2 usa las señales del equipo (entradas, salidas, temporizadores)',
        ['El nivel 1 usa temporizadores y el 2 no', 'El nivel 2 solo se usa para máquinas con un motor', 'Son idénticos; cambia solo el color del dibujo'],
        'El nivel 1 es funcional y en lenguaje natural; el nivel 2 ya habla de las variables concretas del PLC.')
    ]),
    // A9: De Morgan
    S('a9', 'a', 'opcion', 3, DM.map((d) => opg((r) => {
      const malas = POOL.filter(([, f]) => !equiv(3, d.f, f)).map(([t]) => t);
      const pon = (s) => s.replace(/\/([A-Z])/g, (_, v) => ov(v));
      return { t: `Aplica la ley de De Morgan y simplifica. Con una barra larga sobre una expresión: ${htmlNeg('')}${textoDM(d)}. ¿Cuál es equivalente?`,
        ok: pon(d.eq), mal: mez(r, malas).slice(0, 3).map(pon), por: `Se niega cada término y se cambia el producto por suma (y la suma por producto): ${pon(d.eq)}.` };
    }))),
    // A10: temporizador, tags y HMI
    S('a10', 'a', 'opcion', 3, [
      op('Un temporizador TON de 8 s se activa con la etapa E2. ¿Cuándo se pone en 1 su bit de salida T?',
        'Cuando E2 lleva activa 8 s seguidos; si E2 se apaga antes, el tiempo se reinicia',
        ['Apenas se activa E2', 'Cuando pasan 8 s desde que se energizó el PLC', 'Cuando E2 se apaga, tras 8 s'],
        'El TON cuenta mientras su entrada esté activa y se reinicia si la pierde antes de tiempo.'),
      op('¿Qué es un tag en una pantalla HMI o un SCADA?',
        'Una variable con nombre ligada a una dirección del PLC (entrada, salida, memoria o registro)',
        ['Un tipo de módulo de entradas del PLC', 'Un cable de comunicación entre dos PLC', 'Un diagrama del proceso'],
        'El tag es el nombre con el que la pantalla lee o escribe una dirección del PLC.'),
      op('En una máquina con PLC y pantalla HMI, se corta la alimentación de la pantalla. ¿Qué sucede con el control?',
        'El PLC sigue ejecutando la lógica; la HMI solo muestra y envía órdenes, aunque ya no se podrá operar desde ella',
        ['La máquina se detiene, porque la HMI ejecuta la lógica', 'El PLC pierde el programa', 'Las salidas del PLC pasan a 24 V'],
        'La lógica de control está en el PLC; la HMI es la interfaz de operación.')
    ])
  ];

  // ============================================================
  // PARTE B
  // ============================================================
  // ---------- B1: GRAFCET con ramas simultáneas y temporizador ----------
  const NB1 = [
    { PA: 'PA', S1: 'S1', PR: 'PR', A1: 'M1', A2: 'LV', B1: 'M2', B2: 'SR' },
    { PA: 'MA', S1: 'FC', PR: 'RE', A1: 'KA', A2: 'HL', B1: 'KB', B2: 'BZ' },
    { PA: 'I1', S1: 'I2', PR: 'I3', A1: 'Q1', A2: 'Q2', B1: 'Q3', B2: 'Q4' }
  ];
  const estadoLabel = (set, L) => {
    const acc = { E1: L.A1, E2: L.A2, E3: L.B1, E4: L.B2 };
    const sal = set.filter((e) => acc[e]).map((e) => acc[e]);
    return `${set.join(' y ')}; ${sal.length ? 'salidas ' + sal.join(' y ') : 'ninguna salida'}`;
  };
  // motor del GRAFCET de B1
  const B1T = [
    { de: ['E0'], a: ['E1', 'E3'], c: 'PA' }, { de: ['E1'], a: ['E2'], c: 'S1' },
    { de: ['E3'], a: ['E4'], c: 'T' }, { de: ['E2', 'E4'], a: ['E0'], c: 'PR' }
  ];
  const b1Aplicar = (act, c) => {
    let cambio = true; const s = new Set(act);
    while (cambio) {
      cambio = false;
      for (const t of B1T) if (t.c === c && t.de.every((e) => s.has(e))) { t.de.forEach((e) => s.delete(e)); t.a.forEach((e) => s.add(e)); cambio = true; break; }
      if (c === 'T') break;
    }
    return Array.from(s).sort();
  };
  EX._b1 = { simular(T, eventos) {   // eventos: [{ t, ev }] en orden; devuelve los estados tras cada evento
    let act = ['E0'], tE3 = null, out = [];
    eventos.forEach((e) => {
      if (tE3 != null && e.t >= tE3 + T && act.includes('E3')) act = b1Aplicar(act, 'T');
      const antes = act.join();
      act = b1Aplicar(act, e.ev);
      if (!antes.includes('E3') && act.includes('E3')) tE3 = e.t;
      out.push(act.slice());
    });
    return out;
  } };
  const casoB1 = (r) => {
    const L = el(r, NB1), T = el(r, [6, 8, 10, 12]);
    const mult = mez(r, ['S1', 'PR', 'PR', el(r, ['S1', 'PR'])]);
    const tiempos = []; let t = 0;
    for (let i = 0; i < 4; i++) { t += 1 + Math.floor(r() * 5); if (t === T) t++; tiempos.push(t); }
    const ev = [{ t: 0, ev: 'PA' }, ...mult.map((e, i) => ({ t: tiempos[i], ev: e }))];
    const est = EX._b1.simular(T, ev);
    const nombreEv = { PA: `se pulsa ${L.PA}`, S1: `se activa el sensor ${L.S1}`, PR: `se pulsa ${L.PR}` };
    const alcanz = ['E0', 'E1 y E3', 'E2 y E3', 'E1 y E4', 'E2 y E4'];
    const lab = (s) => estadoLabel(s, L);
    const todos = [['E0'], ['E1', 'E3'], ['E2', 'E3'], ['E1', 'E4'], ['E2', 'E4'], ['E1'], ['E3']];
    const campos = est.map((s, i) => ({ id: 'e' + i, tipo: 'select', pregunta: `${String.fromCharCode(97 + i)}) Justo después del evento ${i + 1}, ¿qué etapas están activas y qué salidas están encendidas?`, opciones: opc(r, lab(s), todos.filter((x) => x.join() !== s.join()).map(lab)) }));
    const esperado = {}; campos.forEach((c, i) => { esperado[c.id] = lab(est[i]); });
    const tabla = `<table class="tabla" style="margin:8px 0"><tr><th>Etapa</th><th>Acción</th><th>Transición que sale</th></tr>
      <tr><td>E0 (inicial)</td><td>ninguna</td><td>${L.PA}: pasa a E1 y E3 a la vez (divergencia en AND)</td></tr>
      <tr><td>E1</td><td>${L.A1} = 1</td><td>${L.S1}: pasa a E2</td></tr>
      <tr><td>E2</td><td>${L.A2} = 1</td><td>espera a E4 (convergencia en AND)</td></tr>
      <tr><td>E3</td><td>${L.B1} = 1; arranca el temporizador T de ${T} s</td><td>T cumplido: pasa a E4</td></tr>
      <tr><td>E4</td><td>${L.B2} = 1</td><td>espera a E2 (convergencia en AND)</td></tr>
      <tr><td>E2 y E4 juntas</td><td>—</td><td>${L.PR}: vuelven a E0</td></tr></table>`;
    const lista = '<ol style="margin:6px 0;padding-left:20px">' + ev.map((e) => `<li>A los <b>${e.t} s</b> de pulsar ${L.PA}: ${e.ev === 'PA' ? 'se pulsa <b>' + L.PA + '</b> (inicio)' : nombreEv[e.ev]}.</li>`).join('') + '</ol>';
    return {
      intro: 'Lee el GRAFCET y predice qué pasa.',
      enunciado: `<p>Este GRAFCET de nivel 2 tiene dos ramas que avanzan al mismo tiempo. El temporizador T cuenta mientras E3 esté activa. Se pulsa ${L.PA} en el instante 0 con el sistema en reposo (E0), y después ocurren estos eventos, uno a uno (si un evento no cambia nada, el estado sigue igual):</p>${tabla}${lista}
        <p class="nota">Una transición solo se franquea si todas sus etapas de entrada están activas y la condición se cumple.</p>`,
      campos, esperado,
      solucion: '<ol style="margin:6px 0;padding-left:20px">' + est.map((s, i) => `<li>Después del evento ${i + 1}: <b>${lab(s)}</b>.</li>`).join('') + `</ol><p>El temporizador de ${T} s empieza cuando se activa E3 (con ${L.PA}); si ya venció antes de un evento, E4 ya está activa. La convergencia ${L.PR} solo actúa cuando E2 y E4 están activas a la vez.</p>`
    };
  };

  // ---------- B2: escaneo de ecuaciones ----------
  const NB2 = [
    { PA: 'PA', A: 'S1', B: 'S2', C: 'S3', PP: 'PP' },
    { PA: 'MA', A: 'FA', B: 'FB', C: 'FC', PP: 'PR' },
    { PA: 'I1', A: 'I2', B: 'I3', C: 'I4', PP: 'I0' }
  ];
  const VAR_ESC = [
    [[1, 1, 0, 0, 1], [0, 0, 1, 0, 1], [0, 0, 0, 1, 1], [1, 0, 0, 0, 1], [0, 1, 0, 0, 1]],
    [[1, 0, 0, 0, 1], [0, 1, 1, 0, 1], [0, 0, 0, 0, 1], [0, 0, 0, 1, 1], [1, 1, 1, 0, 1]],
    [[1, 0, 0, 0, 1], [0, 1, 0, 0, 1], [0, 0, 1, 1, 1], [0, 0, 0, 0, 0], [1, 0, 0, 0, 1]]
  ];
  EX._b2 = { escanear(est, ent) {   // est: {E0,E1,E2,E3}; ent: [PA, A, B, C, PPbit]; escalones en orden E1, E2, E3, E0
    const [PA, A, B, C, PP] = ent.map(Boolean);
    const e = { ...est };
    e.E1 = (((e.E0 && PA) || e.E1) && !(e.E2 || !PP));
    e.E2 = (((e.E1 && A) || e.E2) && !(e.E3 || !PP));
    e.E3 = (((e.E2 && B) || e.E3) && !(C || !PP));
    e.E0 = (!e.E1 && !e.E2 && !e.E3);
    return e;
  } };
  const labelEsc = (e) => { const a = ['E0', 'E1', 'E2', 'E3'].filter((k) => e[k]); return a.length === 1 ? 'solo ' + a[0] : a.join(' y ') + ' activas'; };
  const casoB2 = (r) => {
    const L = el(r, NB2), fil = el(r, VAR_ESC);
    let e = { E0: true, E1: false, E2: false, E3: false }; const out = [];
    fil.forEach((f) => { e = EX._b2.escanear(e, f); out.push({ ...e }); });
    const todos = ['solo E0', 'solo E1', 'solo E2', 'solo E3', 'E1 y E2 activas', 'E2 y E3 activas'];
    const campos = out.map((s, i) => ({ id: 's' + i, tipo: 'select', pregunta: `${String.fromCharCode(97 + i)}) ¿Qué etapas están activas al terminar el escaneo ${i + 1}?`, opciones: opc(r, labelEsc(s), todos.filter((x) => x !== labelEsc(s))) }));
    const esperado = {}; campos.forEach((c, i) => { esperado[c.id] = labelEsc(out[i]); });
    const n = (x) => ovh(L[x]);
    const filas = fil.map((f, i) => `<tr><td>${i + 1}</td><td>${f[0]}</td><td>${f[1]}</td><td>${f[2]}</td><td>${f[3]}</td><td>${f[4] ? '1 (sin pulsar)' : '0 (pulsado)'}</td></tr>`).join('');
    return {
      intro: 'Simula el escaneo del PLC.',
      enunciado: `<p>Un PLC ejecuta estas ecuaciones, <b>de arriba abajo en cada escaneo</b> y en este orden: E1, E2, E3 y E0. Cada escalón usa el valor que las etapas tienen en ese momento, incluidos los que se acaban de recalcular en el mismo escaneo. La barra encima indica negación.</p>
        <div class="enunciado" style="font-family:var(--mono,monospace);line-height:1.9;white-space:nowrap;overflow-x:auto;font-size:13px">
          E1 = (E0 · ${L.PA} + E1) · ${ovh('(E2 + ' + ovh(L.PP) + ')')}<br>
          E2 = (E1 · ${L.A} + E2) · ${ovh('(E3 + ' + ovh(L.PP) + ')')}<br>
          E3 = (E2 · ${L.B} + E3) · ${ovh('(' + L.C + ' + ' + ovh(L.PP) + ')')}<br>
          E0 = ${ovh('E1')} · ${ovh('E2')} · ${ovh('E3')}</div>
        <p>${L.PP} es el paro (contacto NC: vale 1 si no se toca). Al inicio solo E0 está activa. Las entradas valen lo indicado en cada fila durante todo el escaneo:</p>
        <table class="tabla" style="margin:8px 0"><tr><th>Escaneo</th><th>${L.PA}</th><th>${L.A}</th><th>${L.B}</th><th>${L.C}</th><th>${L.PP}</th></tr>${filas}</table>`,
      campos, esperado,
      solucion: '<ol style="margin:6px 0;padding-left:20px">' + out.map((s, i) => `<li>Escaneo ${i + 1}: <b>${labelEsc(s)}</b>.</li>`).join('') + '</ol><p>Como los escalones se evalúan de arriba abajo, una etapa recién activada puede habilitar a la siguiente en el mismo escaneo, y la etapa anterior recién se apaga en el escaneo siguiente (cuando ve a la nueva etapa activa).</p>'
    };
  };

  // ============================================================
  // PARTE C
  // ============================================================
  const MAQ = [
    { nombre: 'mezcladora de pintura', Q1: ['YV1', 'la válvula de llenado'], A: 'el sensor de nivel alto', Q2: ['M1', 'el motor mezclador'], Tn: 'el tiempo de mezcla', Q3: ['YV2', 'la válvula de descarga'], B: 'el sensor de tanque vacío', L: ['HL1', 'una lámpara «proceso en curso»'],
      txt: 'Llena el tanque con {Q1} hasta que {A} se activa; mezcla con {Q2} durante {Tn}; y descarga con {Q3} hasta que {B} se activa. {L} está encendida durante la mezcla y la descarga.' },
    { nombre: 'portón corredizo', Q1: ['KA', 'el motor que abre'], A: 'el fin de carrera de portón abierto', Q2: ['HV', 'la luz verde de paso'], Tn: 'el tiempo de espera', Q3: ['KC', 'el motor que cierra'], B: 'el fin de carrera de portón cerrado', L: ['HB', 'una baliza de aviso'],
      txt: 'Abre con {Q1} hasta que {A} se activa; espera con {Q2} encendida durante {Tn}; y cierra con {Q3} hasta que {B} se activa. {L} está encendida durante la espera y el cierre.' },
    { nombre: 'horno de secado', Q1: ['EH', 'la resistencia'], A: 'el sensor de temperatura alcanzada', Q2: ['VF', 'el ventilador de mantenimiento'], Tn: 'el tiempo de secado', Q3: ['VX', 'el extractor'], B: 'el sensor de temperatura baja', L: ['HR', 'una luz roja «horno caliente»'],
      txt: 'Calienta con {Q1} hasta que {A} se activa; mantiene con {Q2} durante {Tn}; y enfría con {Q3} hasta que {B} se activa. {L} está encendida durante el mantenimiento y el enfriamiento.' },
    { nombre: 'estación de prensado', Q1: ['KM1', 'la cinta que avanza'], A: 'el sensor de pieza en posición', Q2: ['YV3', 'la prensa que baja'], Tn: 'el tiempo de prensado', Q3: ['YV4', 'el cilindro expulsor'], B: 'el sensor de expulsor retraído', L: ['HL2', 'una luz de operación'],
      txt: 'Avanza la pieza con {Q1} hasta que {A} se activa; prensa con {Q2} durante {Tn}; y expulsa con {Q3} hasta que {B} se activa. {L} está encendida durante el prensado y la expulsión.' },
    { nombre: 'lavadora industrial', Q1: ['YV5', 'la válvula de agua'], A: 'el sensor de nivel de agua', Q2: ['M2', 'el motor de lavado'], Tn: 'el tiempo de lavado', Q3: ['P1', 'la bomba de desagüe'], B: 'el sensor de tambor vacío', L: ['HL3', 'una luz de ciclo'],
      txt: 'Llena con {Q1} hasta que {A} se activa; lava con {Q2} durante {Tn}; y desagua con {Q3} hasta que {B} se activa. {L} está encendida durante el lavado y el desagüe.' },
    { nombre: 'estación de pegado', Q1: ['YV6', 'el pistón que baja'], A: 'el fin de carrera de pistón abajo', Q2: ['YV7', 'la prensa de pegado'], Tn: 'el tiempo de curado', Q3: ['YV8', 'el pistón que sube'], B: 'el fin de carrera de pistón arriba', L: ['HL4', 'una luz de proceso'],
      txt: 'Baja el pistón con {Q1} hasta que {A} se activa; pega con {Q2} durante {Tn}; y sube con {Q3} hasta que {B} se activa. {L} está encendida durante el curado y la subida.' }
  ];
  const NSEN = [
    { PA: 'PM', PP: 'PP', A: 'S1', B: 'S2', T: 'T1' },
    { PA: 'PA', PP: 'PO', A: 'FC1', B: 'FC2', T: 'T2' },
    { PA: 'I1', PP: 'I0', A: 'I2', B: 'I3', T: 'T3' },
    { PA: 'MA', PP: 'PR', A: 'SA', B: 'SB', T: 'TM' }
  ];
  const svgLineal = (N, M) => {
    const caja = (y, e, acc, ini) => `<rect x="70" y="${y}" width="90" height="34" fill="#fff" stroke="#1b2430" stroke-width="2"/>${ini ? `<rect x="64" y="${y - 6}" width="102" height="46" fill="none" stroke="#1b2430" stroke-width="2"/>` : ''}
      <text x="115" y="${y + 22}" text-anchor="middle" font-size="15" font-weight="700" fill="#1b2430">${e}</text>${acc ? `<line x1="160" y1="${y + 17}" x2="190" y2="${y + 17}" stroke="#1b2430" stroke-width="2"/><rect x="190" y="${y + 3}" width="190" height="28" fill="#fff" stroke="#1b2430" stroke-width="2"/><text x="285" y="${y + 22}" text-anchor="middle" font-size="13" fill="#1b2430">${acc}</text>` : ''}`;
    const trans = (y, txt) => `<line x1="115" y1="${y - 14}" x2="115" y2="${y + 14}" stroke="#1b2430" stroke-width="2"/><line x1="105" y1="${y}" x2="125" y2="${y}" stroke="#1b2430" stroke-width="3"/><text x="135" y="${y + 5}" font-size="13" fill="#1b2430">${txt}</text>`;
    return `<svg viewBox="0 0 400 440" style="width:100%;max-width:380px;height:auto" role="img" aria-label="GRAFCET lineal de cuatro etapas">
      ${caja(20, 'E0', '', true)}${trans(75, N.PA)}
      ${caja(100, 'E1', `${M.Q1[0]} = 1`)}${trans(155, N.A)}
      ${caja(180, 'E2', `${M.Q2[0]} = 1 (arranca ${N.T})`)}${trans(235, N.T + ' (fin del tiempo)')}
      ${caja(260, 'E3', `${M.Q3[0]} = 1`)}${trans(315, N.B)}
      <path d="M 70 277 H 40 V 37 H 64" fill="none" stroke="#1b2430" stroke-width="2"/><polygon points="64,37 56,32 56,42" fill="#1b2430"/>
      <text x="8" y="378" font-size="12" fill="#5a6676">El paro ${N.PP} (contacto NC) detiene cualquier</text>
      <text x="8" y="394" font-size="12" fill="#5a6676">etapa y vuelve a E0.</text>
      <text x="8" y="414" font-size="12" fill="#5a6676">${M.L[0]} está encendida en E2 y E3.</text></svg>`;
  };
  const casoC = (r) => {
    const M = el(r, MAQ), N = el(r, NSEN);
    const n = (x) => ov(N[x]);
    const txt = M.txt.replace('{Q1}', `${M.Q1[1]} (<b>${M.Q1[0]}</b>)`).replace('{A}', `${M.A} (<b>${N.A}</b>)`).replace('{Q2}', `${M.Q2[1]} (<b>${M.Q2[0]}</b>)`).replace('{Tn}', `${M.Tn} (temporizador <b>${N.T}</b>, TON activado con E2)`).replace('{Q3}', `${M.Q3[1]} (<b>${M.Q3[0]}</b>)`).replace('{B}', `${M.B} (<b>${N.B}</b>)`).replace('{L}', `${M.L[1][0].toUpperCase() + M.L[1].slice(1)} (<b>${M.L[0]}</b>)`);
    const f = [
      ['a', 'SE1', `E0 · ${N.PA}`, [`E1 · ${N.PA}`, `E0 + ${N.PA}`, `E0 · ${n('PA')}`, `E0 · ${N.A}`]],
      ['b', 'RE1', `E2 + ${n('PP')}`, [`E2 · ${n('PP')}`, `E2 + ${N.PP}`, `E0 + ${n('PP')}`, `E1 + ${n('PP')}`]],
      ['c', 'SE2', `E1 · ${N.A}`, [`E1 · ${n('A')}`, `E2 · ${N.A}`, `E1 + ${N.A}`, `E0 · ${N.A}`]],
      ['d', 'RE2', `E3 + ${n('PP')}`, [`E3 · ${n('PP')}`, `E1 + ${n('PP')}`, `E3 + ${N.PP}`, `${N.T} + ${n('PP')}`]],
      ['e', 'SE3', `E2 · ${N.T}`, [`E2 · ${n('T')}`, `E2 + ${N.T}`, `E3 · ${N.T}`, `E2 · ${N.B}`]],
      ['f', 'RE3', `${N.B} + ${n('PP')}`, [`${N.B} · ${n('PP')}`, `E0 + ${n('PP')}`, `${n('B')} + ${n('PP')}`, `${N.B} + ${N.PP}`]]
    ].map(([id, nom, ok, mal]) => ({ id, ok, tipo: 'select', pregunta: `${id}) ¿Cuál es la ecuación ${nom}?`, opciones: opc(r, ok, mal) }));
    const e0 = `${ov('E1')} · ${ov('E2')} · ${ov('E3')}`;
    const camposB = [
      { id: 'g', ok: e0, tipo: 'select', pregunta: 'g) ¿Cuál es la regla de la etapa inicial E0?', opciones: opc(r, e0, ['E1 · E2 · E3', `${ov('E1')} + ${ov('E2')} + ${ov('E3')}`, `E3 · ${N.B}`, `E0 · ${ov('E1')}`]) },
      { id: 'h', ok: `${M.L[0]} = E2 + E3`, tipo: 'select', pregunta: `h) ¿Cómo se escribe la salida ${M.L[0]}?`, opciones: opc(r, `${M.L[0]} = E2 + E3`, [`${M.L[0]} = E2 · E3`, `${M.L[0]} = E1 + E2`, `${M.L[0]} = E3`, `${M.L[0]} = E1 + E2 + E3`]) },
      { id: 'i', ok: 'Un contacto NA de E2 (el mismo nombre que la bobina)', tipo: 'select', pregunta: 'i) En el escalón de E2, ¿qué contacto se coloca en paralelo con el SET (E1 · ' + N.A + ') para mantener la etapa activa?', opciones: ['Un contacto NA de E2 (el mismo nombre que la bobina)', 'Un contacto NC de E2', 'Un contacto NA de E1', `Un contacto NA de ${N.A}`] },
      { id: 'j', ok: 'Solo E0 queda activa y todas las salidas se apagan', tipo: 'select', pregunta: `j) Prueba: E3 está activa, el paro (${N.PP}, contacto NC) se presiona, ${N.B} = 0 y ${N.T} = 1; los escalones se evalúan en el orden E1, E2, E3, E0 y salidas. ¿Qué queda tras un escaneo?`, opciones: mez(r, ['Solo E0 queda activa y todas las salidas se apagan', `E3 sigue activa y ${M.L[0]} sigue encendida`, `Se activa E3 de nuevo porque ${N.T} = 1`, 'E0 y E3 quedan activas a la vez']) }
    ];
    const campos = [...f.map(({ ok, ...c }) => c), ...camposB.map(({ ok, ...c }) => c)];
    const esperado = {}; [...f, ...camposB].forEach((c) => { esperado[c.id] = c.ok; });
    const sols = {
      a: 'Entra desde E0 con la marcha.', b: `E1 se apaga cuando se activa E2 o se pulsa el paro (${n('PP')}); son alternativas, por eso se suman.`,
      c: `Entra desde E1 con ${N.A}.`, d: 'E2 sale a E3 o por el paro.', e: `Entra desde E2 cuando el temporizador ${N.T} cumple su tiempo.`, f: `E3 sale a E0 con ${N.B} o por el paro.`,
      g: 'E0 está activa cuando ninguna otra etapa lo está.', h: `${M.L[0]} está encendida en E2 y en E3: se suman las dos etapas.`, i: 'El enclavamiento es un contacto con el nombre de la bobina en paralelo con el SET.',
      j: `Con el paro presionado, RE3 = ${N.B} + ${n('PP')} = 1: E3 se apaga. SE3 = E2 · ${N.T} = 0 porque E2 está apagada. Por eso E0 = ${ov('E1')} · ${ov('E2')} · ${ov('E3')} = 1 y las salidas se apagan.`
    };
    const solucion = '<ul style="margin:6px 0;padding-left:20px">' + [...f, ...camposB].map((c) => `<li><b>${c.id}) ${esc(c.ok)}.</b> ${sols[c.id]}</li>`).join('') + '</ul>';
    return {
      intro: `Diseña el control de una ${M.nombre}.`,
      enunciado: `<p>Una <b>${M.nombre}</b> trabaja con el GRAFCET de nivel 2 de la figura. ${txt} El pulsador de marcha es <b>${N.PA}</b> (NA) y el de paro es <b>${N.PP}</b> (NC; su bit vale 1 si no se toca). La barra encima indica negación; «·» es producto (AND) y «+» es suma (OR).</p>
        <div style="text-align:center">${svgLineal(N, M)}</div>
        <p>Cada etapa se escribe como E = (SET + E) · negado(RESET). Elige la ecuación correcta en cada casillero.</p>`,
      campos, esperado, solucion
    };
  };

  // ---------- casillas de las partes B y C ----------
  const B = [
    S('b1', 'b', 'campos', 15, [cam(casoB1)]),
    S('b2', 'b', 'campos', 15, [cam(casoB2)])
  ];
  const C = [S('c1', 'c', 'campos', 40, [cam(casoC)])];

  EX.SLOTS = [...A, ...B, ...C];
  EX.PESO_TOTAL = EX.SLOTS.reduce((a, s) => a + s.peso, 0);
})();
