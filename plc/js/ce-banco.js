// ============================================================
// Banco del Control de estudio (pl-ce, 10 % del módulo) · Programación de Controladores e Interfaces Industriales
// 36 casillas de 8 temas; cada casilla tiene de 3 a 6 plantillas y a cada carnet le toca una.
// Tipos y puntos: opción 2; cálculo 3; ejercicio con partes (tomado de los retos de clase) 5; ordenar pasos 2.
// 22 opciones × 2 + 4 cálculos × 3 + 8 ejercicios × 5 + 2 ordenar × 2 = 100 puntos para todos.
// Tiempo estimado: unos 50 minutos de trabajo para el promedio; el reloj da 60.
// Las preguntas salen de lo avanzado en la plataforma (pl-s1): las preguntas rápidas y los retos de clase
// se reutilizan con los datos propios de cada carnet (II.rng(carnet|ce|casilla|plantilla)).
// Convenciones: «/» antes de una señal indica negada; la multiplicación lógica se escribe con «·».
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  const CE = (II.CE = II.CE || {});

  CE.META = {
    id: 'pl-ce', titulo: 'Control de estudio', subtitulo: 'Programación de Controladores e Interfaces Industriales',
    minutos: 60, peso: 10, nEval: 36
  };
  CE.TEMAS = {
    a: 'Arquitectura del PLC y ciclo de escaneo',
    b: 'Tipos de señal de entrada y salida',
    c: 'Rack, módulos y direcciones',
    d: 'Del campo al PLC: mando y potencia, NA y NC, PNP y NPN, relé y transistor',
    e: 'Lógica de contactos y diagrama escalera',
    f: 'Enclavamiento y GRAFCET niveles 1 y 2',
    g: 'El semáforo',
    h: 'Del GRAFCET a las ecuaciones: SET, RESET y De Morgan'
  };

  // ---------- constructores de plantillas ----------
  const op = (t, ok, mal, por) => ({ k: 'op', t, ok, mal, por });
  const rap = (id) => ({ k: 'rap', id });
  const reto = (reto, campos, t, pista) => ({ k: 'reto', reto, campos, t, pista });
  const num = (gen) => ({ k: 'num', gen });
  const orden = (gen) => ({ k: 'orden', gen });
  const el = II.elegir, mez = II.mezclar;
  const f3 = (x) => II.fmt(x, 3);

  // ---------- lógica de contactos para las preguntas de conteo ----------
  const contar = (vars, f) => {
    let n = 0;
    for (let i = 0; i < (1 << vars); i++) {
      const b = Array.from({ length: vars }, (_, k) => !!((i >> (vars - 1 - k)) & 1));
      if (f(...b)) n++;
    }
    return n;
  };
  const RENG_POS = [
    ['A en serie con B, y todo eso en paralelo con C', (a, b, c) => (a && b) || c],
    ['A en paralelo con B, y todo eso en serie con C', (a, b, c) => (a || b) && c],
    ['A en serie con el paralelo de B y C', (a, b, c) => a && (b || c)],
    ['A, B y C en serie', (a, b, c) => a && b && c],
    ['A, B y C en paralelo', (a, b, c) => a || b || c]
  ];
  const RENG_NEG = [
    ['A (NA) en serie con B (NC), y todo eso en paralelo con C (NA)', (a, b, c) => (a && !b) || c],
    ['A (NC) en serie con B (NA), y todo eso en paralelo con C (NC)', (a, b, c) => (!a && b) || !c],
    ['A (NA) en paralelo con B (NC), y todo eso en serie con C (NA)', (a, b, c) => (a || !b) && c],
    ['A (NC) en serie con el paralelo de B (NA) y C (NA)', (a, b, c) => !a && (b || c)],
    ['A (NA), B (NC) y C (NC) en serie', (a, b, c) => a && !b && !c]
  ];
  const RENG_SELLO = [
    ['Q = (M + Q) · P · E, con P y E leídos como bits (en reposo valen 1)', (m, q, p, e) => (m || q) && p && e, 4, 'M, Q, P y E (16 en total)'],
    ['Q = (M + Q) · P, con P leído como bit (en reposo vale 1)', (m, q, p) => (m || q) && p, 3, 'M, Q y P (8 en total)'],
    ['Q = M · P + Q · P · E, con P y E leídos como bits (en reposo valen 1)', (m, q, p, e) => (m && p) || (q && p && e), 4, 'M, Q, P y E (16 en total)']
  ];
  // expresiones para De Morgan (A, B, C)
  const DM = [
    ['/(A + B)', (a, b) => !(a || b)], ['/(A · B)', (a, b) => !(a && b)], ['/A · /B', (a, b) => !a && !b],
    ['/A + /B', (a, b) => !a || !b], ['/(A + /B)', (a, b) => !(a || !b)], ['/(/A · B)', (a, b) => !(!a && b)]
  ];
  const DM3 = [
    ['/(A · B) + C · /B', (a, b, c) => !(a && b) || (c && !b)],
    ['/(A + B) · C', (a, b, c) => !(a || b) && c],
    ['/(A · B · C)', (a, b, c) => !(a && b && c)],
    ['/(A + B + C)', (a, b, c) => !(a || b || c)],
    ['/A · (B + /C)', (a, b, c) => !a && (b || !c)]
  ];

  // ============================================================
  // CASILLAS
  // ============================================================
  const S = (id, tema, tipo, peso, plantillas) => ({ id, tema, tipo, peso, plantillas });

  CE.SLOTS = [
    // ---------------- A. Arquitectura y ciclo ----------------
    S('a1', 'a', 'opcion', 2, [
      rap('ra1'),
      op('¿Para qué sirve la memoria de imagen de entradas?',
        'Guarda una copia de las entradas leída al inicio del ciclo, y el programa trabaja con esa copia hasta el final del ciclo',
        ['Guarda el programa del usuario cuando se apaga el PLC', 'Convierte las señales analógicas en digitales', 'Cuenta los pulsos rápidos que llegan entre dos ciclos'],
        'Las entradas se leen una sola vez por ciclo; así el programa ve valores coherentes mientras se ejecuta.'),
      op('¿Qué detecta el temporizador de vigilancia (watchdog) de un PLC?',
        'Que el ciclo tardó más de lo permitido, y entonces la CPU pasa a falla',
        ['Que el operario no pulsó marcha', 'Que la temperatura del tablero es alta', 'Que el programa se ejecutó dos veces'],
        'El watchdog vigila que el ciclo termine a tiempo: si el programa se cuelga o tarda demasiado, la CPU se detiene en falla.'),
      op('En un PLC modular, ¿qué hace la fuente de alimentación?',
        'Entrega la tensión de trabajo a la CPU y a los módulos del bastidor',
        ['Guarda y ejecuta el programa del usuario', 'Conecta los sensores del campo con la CPU', 'Convierte las señales de 4–20 mA en bits'],
        'La fuente alimenta el bastidor; guardar y ejecutar el programa es tarea de la CPU, y conectar el campo es tarea de los módulos de E/S.')
    ]),
    S('a2', 'a', 'opcion', 2, [
      rap('ra2'),
      op('¿En qué orden trabaja el PLC en cada ciclo de escaneo?',
        'Lee las entradas; ejecuta el programa; actualiza las salidas; atiende las comunicaciones',
        ['Ejecuta el programa; lee las entradas; atiende las comunicaciones; actualiza las salidas',
         'Actualiza las salidas; lee las entradas; ejecuta el programa; atiende las comunicaciones',
         'Atiende las comunicaciones; actualiza las salidas; ejecuta el programa; lee las entradas'],
        'Primero se leen las entradas, luego se ejecuta la lógica con esa lectura y recién después se actualizan las salidas físicas.'),
      op('Un pulso empieza y termina entre dos lecturas de entradas consecutivas del PLC. ¿Qué ve el programa?',
        'Nada: el pulso pasó entre dos lecturas y no quedó registrado',
        ['El pulso completo, porque el PLC lee en tiempo real', 'Un pulso más corto, pero lo ve', 'Un error de la CPU'],
        'El PLC solo mira las entradas una vez por ciclo; lo que ocurre entre dos lecturas puede perderse.'),
      op('Si el programa duplica sus instrucciones y todo lo demás queda igual, el tiempo de ciclo:',
        'Aumenta, pero no llega a duplicarse, porque la lectura de E/S y las comunicaciones no cambian',
        ['Se reduce a la mitad', 'Queda igual', 'Se duplica exactamente'],
        'Solo crece el tiempo de ejecución del programa; la lectura de E/S y las comunicaciones siguen igual.')
    ]),
    S('a3', 'a', 'num', 3, [
      num((r) => {
        const N = el(r, [2000, 3000, 4000, 5000, 6000, 8000]), t = el(r, [1, 2, 3]), io = el(r, [1, 2, 3, 4]), com = el(r, [1, 2, 3]);
        const T = (N * t) / 1000 + io + com;
        return { t: `Un PLC ejecuta un programa de ${N} instrucciones de ${t} µs cada una. Leer entradas y escribir salidas tarda ${io} ms en total, y atender comunicaciones y diagnóstico tarda ${com} ms. ¿Cuánto vale el tiempo de ciclo?`,
          valor: T, unidad: 'ms', sol: `T = ${N} · ${t} µs + ${io} ms + ${com} ms = ${f3(T)} ms` };
      }),
      num((r) => {
        const T = el(r, [8, 10, 16, 20, 25, 40, 50]);
        return { t: `Un PLC tiene un tiempo de ciclo de ${T} ms. ¿Cuántos ciclos completa por segundo?`,
          valor: 1000 / T, unidad: 'ciclos/s', sol: `1000 ms ÷ ${T} ms = ${f3(1000 / T)} ciclos/s` };
      }),
      num((r) => {
        const T = el(r, [6, 8, 10, 12, 15, 20, 25, 30]);
        return { t: `El tiempo de ciclo de un PLC es de ${T} ms. ¿Cuánto debe durar, como mínimo, un pulso del sensor para que el PLC lo detecte con seguridad?`,
          valor: T, unidad: 'ms', tolRel: 0.02, sol: `El pulso debe durar más que un ciclo completo: al menos ${T} ms.`,
          por: 'Para garantizar la lectura, el pulso debe durar más que el ciclo; si es más corto, puede empezar y terminar entre dos lecturas.' };
      })
    ]),
    S('a4', 'a', 'opcion', 2, [
      rap('ra3'),
      op('Una máquina cuenta piezas con pulsos de 0,2 ms y el PLC tiene un ciclo de 10 ms. ¿Qué conviene usar?',
        'Una entrada rápida (contador de alta velocidad) o una interrupción',
        ['Una entrada analógica', 'Cambiar el sensor a normalmente cerrado', 'Subir la tensión del sensor a 220 V'],
        'Con pulsos mucho más cortos que el ciclo, hay que contarlos con hardware dedicado: entrada rápida o interrupción.'),
      op('Dos partes del programa escriben valores distintos en la misma salida dentro de un ciclo. ¿Qué recibe la salida física?',
        'El último valor escrito, que se transfiere al final del ciclo',
        ['El primer valor escrito', 'Un promedio de los dos', 'Los dos valores uno detrás del otro en el mismo ciclo'],
        'Las salidas físicas se actualizan una sola vez por ciclo, con el último valor que quedó en la imagen de salidas.')
    ]),

    // ---------------- B. Tipos de señal ----------------
    S('b1', 'b', 'opcion', 2, [
      rap('rb1'),
      rap('rb2'),
      op('Una electroválvula todo o nada de 24 V cc, vista desde el PLC, es una:',
        'Salida digital', ['Entrada digital', 'Salida analógica', 'Entrada analógica'],
        'El PLC la comanda con dos estados (abierta o cerrada); la señal sale del PLC hacia el campo.'),
      op('La referencia de velocidad de un variador de frecuencia (0 a 10 V) la entrega el PLC por una:',
        'Salida analógica', ['Entrada analógica', 'Salida digital', 'Entrada digital'],
        'Es un valor que varía de forma continua y sale del PLC hacia el variador.')
    ]),
    S('b2', 'b', 'num', 3, [
      num((r) => {
        const p = el(r, [10, 25, 37.5, 50, 62.5, 75, 80]);
        const mA = 4 + (16 * p) / 100;
        return { t: `Un transmisor 4–20 mA indica ${f3(p)} % de su rango. ¿Qué corriente entrega?`, valor: mA, unidad: 'mA',
          sol: `I = 4 + 16 · ${f3(p)} / 100 = ${f3(mA)} mA` };
      }),
      num((r) => {
        const mA = el(r, [6, 8, 10, 12, 14, 16, 18]);
        const p = ((mA - 4) / 16) * 100;
        return { t: `El módulo analógico mide ${mA} mA de un transmisor 4–20 mA. ¿A qué porcentaje del rango corresponde?`, valor: p, unidad: '%',
          sol: `(${mA} − 4) / 16 · 100 = ${f3(p)} %` };
      }),
      num((r) => {
        const X = el(r, [4, 6, 10, 16, 25]), mA = el(r, [8, 10, 12, 14, 16, 18]);
        const P = ((mA - 4) / 16) * X;
        return { t: `Un transmisor de presión mide de 0 a ${X} bar y entrega ${mA} mA. ¿Qué presión mide?`, valor: P, unidad: 'bar',
          sol: `P = (${mA} − 4) / 16 · ${X} = ${f3(P)} bar` };
      })
    ]),
    S('b3', 'b', 'campos', 5, [
      reto('e1-reto', ['s1', 's2', 's3'], 'Clasifica estas señales según el tipo de canal del PLC al que se conectan.'),
      reto('e1-reto', ['s4', 's5', 's6'], 'Clasifica estas señales según el tipo de canal del PLC al que se conectan.'),
      reto('e1-reto', ['s6', 's7', 's8'], 'Clasifica estas señales según el tipo de canal del PLC al que se conectan.')
    ]),

    // ---------------- C. Rack, módulos y direcciones ----------------
    S('c1', 'c', 'opcion', 2, [
      rap('rc1'),
      op('En la notación del curso, la dirección ED1.07 corresponde a:',
        'Entrada digital, ranura 1, canal 7',
        ['Entrada digital, ranura 7, canal 1', 'Salida digital, ranura 1, canal 7', 'Entrada analógica, ranura 1, canal 7'],
        'ED = entrada digital; 1 = ranura; 07 = canal.'),
      op('En la dirección EA3.2, ¿qué indica el número 3?',
        'La ranura donde está el módulo', ['El canal', 'La cantidad de bits', 'El tipo de señal'],
        'EA3.2: entrada analógica, ranura 3, canal 2.'),
      op('¿Qué significa la dirección SA4.1?',
        'Salida analógica, ranura 4, canal 1',
        ['Sensor analógico, ranura 4, canal 1', 'Salida digital, ranura 4, canal 1', 'Salida analógica, ranura 1, canal 4'],
        'SA = salida analógica; 4 = ranura; 1 = canal.')
    ]),
    S('c2', 'c', 'opcion', 2, [
      rap('rc2'),
      op('Un módulo de 16 entradas digitales está en la ranura 2 y los canales se numeran desde 0. ¿Cuál es la dirección de su último canal?',
        'ED2.15', ['ED2.16', 'ED16.2', 'ED1.15'],
        'Con 16 canales numerados desde 0, el último es el 15, y la ranura es la 2.'),
      op('Se agrega un módulo nuevo en una ranura intermedia y los demás módulos se corren un lugar. ¿Qué pasa con sus direcciones?',
        'Cambian, porque las direcciones dependen de la ranura',
        ['Quedan igual: el PLC las conserva', 'Solo cambian las de las salidas', 'Se borra el programa'],
        'La ranura forma parte de la dirección; al correr los módulos hay que actualizar la tabla y el programa.')
    ]),
    S('c3', 'c', 'campos', 5, [
      reto('c-reto', ['d1', 'd2', 'd3'], 'Obtén las direcciones de estas señales a partir del rack.'),
      reto('c-reto', ['lin', 'cau', 'sw'], 'Revisa la tabla de asignación y analiza el intercambio de módulos.'),
      reto('c-reto', ['d1', 'lin', 'cau'], 'Obtén una dirección y encuentra el error de la tabla.')
    ]),
    S('c4', 'c', 'opcion', 2, [
      op('¿Para qué sirve la tabla de asignación de direcciones?',
        'Relaciona cada señal del campo con su canal físico y su dirección en el programa',
        ['Guarda el programa del usuario', 'Calcula el tiempo de ciclo', 'Define el protocolo de comunicación'],
        'Es el documento que une el campo (sensores y actuadores) con las direcciones que usa el programa.'),
      op('En una tabla de asignación, dos señales distintas aparecen con la misma dirección ED1.05. ¿Qué tipo de error es?',
        'Repetido: dos señales en el mismo canal',
        ['Tipo equivocado', 'Fuera de rango', 'No es un error: pueden compartir canal'],
        'Cada canal físico solo puede tener una señal.'),
      op('Una tabla asigna una lámpara piloto (que es una salida) a ED1.03. ¿Qué error tiene?',
        'Tipo equivocado: una lámpara es salida y ED es entrada',
        ['Repetido', 'Fuera de rango', 'No tiene error'],
        'Una lámpara recibe una señal del PLC: va en un canal de salida (SD), no de entrada.'),
      op('Un módulo tiene 16 canales (de 0 a 15) y la tabla asigna una señal al canal 17. ¿Qué error es?',
        'Fuera de rango: el módulo no tiene ese canal',
        ['Repetido', 'Tipo equivocado', 'No tiene error'],
        'El canal 17 no existe en un módulo de 16 canales.')
    ]),

    // ---------------- D. Del campo al PLC ----------------
    S('d1', 'd', 'opcion', 2, [
      rap('rf1'),
      op('En un arranque de motor con PLC, ¿qué comanda directamente la salida del PLC?',
        'La bobina del contactor', ['El motor', 'El relé térmico', 'La red trifásica'],
        'El PLC maneja poca corriente: energiza la bobina del contactor y este conecta el motor.'),
      op('En un circuito de mando y potencia, ¿qué parte lleva la corriente grande del motor?',
        'El circuito de potencia, a través de los contactos principales del contactor',
        ['El circuito de mando, a través de la bobina', 'La salida del PLC', 'La entrada digital'],
        'El mando comanda; la potencia es la que alimenta el motor.')
    ]),
    S('d2', 'd', 'opcion', 2, [
      rap('rf2'),
      op('Un pulsador de marcha NA conectado a una entrada digital, sin tocarlo, se lee:',
        '0', ['1', 'Indefinido', 'Depende del programa'],
        'El contacto NA está abierto en reposo: no pasa corriente y el bit vale 0.'),
      op('¿Por qué el paro de emergencia se cablea con un contacto NC?',
        'Porque si se corta el cable, la entrada baja a 0 y el PLC lo interpreta como paro: es una falla segura',
        ['Porque el NC consume menos corriente', 'Porque el PLC solo lee contactos NC', 'Porque el NA no existe en pulsadores de hongo'],
        'Un cable cortado se comporta igual que un paro pulsado, y la máquina se detiene.'),
      op('Se corta el cable de un paro NC cableado a una entrada. ¿Qué lee el PLC?',
        '0, como si el paro estuviera pulsado', ['1', 'Un valor intermedio', 'El último valor que tenía'],
        'En reposo el NC leía 1; sin cable no circula corriente y el bit baja a 0.')
    ]),
    S('d3', 'd', 'opcion', 2, [
      rap('rf3'),
      op('Un sensor inductivo PNP, al activarse, entrega a la entrada:',
        '+24 V (conecta su salida al positivo)', ['0 V', 'Una corriente de 4 mA', 'Nada: abre el circuito'],
        'PNP entrega positivo a la salida; NPN la lleva a 0 V.'),
      op('Un sensor PNP se conecta a un módulo de entradas. ¿A qué debe estar el común del módulo?',
        '0 V', ['+24 V', '220 V ca', 'Al neutro de la red'],
        'El PNP entrega +24 V al activarse, así que el común del módulo debe estar a 0 V para cerrar el circuito.'),
      op('Los tres hilos de un sensor inductivo de 24 V son:',
        'Positivo (+24 V), negativo (0 V) y señal', ['Fase, neutro y tierra', 'Marcha, paro y común', 'Dos de alimentación y uno de blindaje'],
        'Dos hilos lo alimentan y el tercero entrega la señal.')
    ]),
    S('d4', 'd', 'opcion', 2, [
      rap('rf4'),
      op('Una lámpara de 220 V ca requiere una salida:',
        'A relé (o un relé auxiliar)', ['A transistor', 'Analógica', 'De alta velocidad'],
        'El transistor solo maneja corriente continua; para ca se usa relé.'),
      op('Frente a una salida a transistor, una salida a relé del módulo:',
        'Permite cargas de ca o cc, pero conmuta más lento y tiene desgaste mecánico',
        ['Conmuta mucho más rápido', 'Solo maneja cc', 'Maneja motores sin contactor siempre'],
        'El relé es un contacto mecánico: admite ca y cc, pero es más lento y se desgasta.'),
      op('Una salida a transistor del módulo puede manejar directamente:',
        'Una carga de corriente continua dentro de su capacidad, por ejemplo un relé auxiliar de 24 V cc',
        ['Cualquier carga de ca', 'Un motor trifásico de 7,5 kW', 'Ninguna carga']
        , 'El transistor conmuta rápido, pero solo cc y poca corriente.')
    ]),
    S('d5', 'd', 'campos', 5, [
      reto('f-reto', ['a', 'b', 'c'], 'Responde qué lee y qué comanda el PLC en estos casos de cableado.'),
      reto('f-reto', ['c', 'd', 'e'], 'Responde sobre el cableado de la estación de bombeo.'),
      reto('f-reto', ['a', 'd', 'e'], 'Responde sobre el cableado de la estación de bombeo.')
    ]),
    S('d6', 'd', 'opcion', 2, [
      op('¿Cuál de estos dispositivos se conecta a una entrada analógica?',
        'Un transmisor de presión de 4–20 mA', ['Un final de carrera', 'Un pulsador de paro NC', 'Un sensor inductivo de proximidad'],
        'Los otros tres entregan solo dos estados; el transmisor entrega un valor continuo.'),
      op('¿Para qué sirve el común de un módulo de entradas digitales?',
        'Cierra el circuito de corriente de las entradas del módulo', ['Guarda el programa', 'Alimenta la CPU', 'Convierte las señales a 4–20 mA'],
        'Sin el común, la corriente de las entradas no tiene camino de retorno.'),
      op('Una entrada digital de 24 V cc lee un 1 cuando:',
        'Circula corriente por su circuito cerrado a través del común', ['El programa lo ordena', 'La CPU está en marcha', 'Pasa la tensión de la red de 220 V'],
        'La entrada reconoce un 1 por la corriente que circula al cerrarse el circuito del campo.')
    ]),

    // ---------------- E. Lógica de contactos y escalera ----------------
    S('e1', 'e', 'opcion', 2, [
      rap('rg3'),
      rap('rg2'),
      op('En un renglón, un contacto A (NA) en serie con un contacto B (NC) gobiernan la bobina Q. ¿Cuándo vale Q = 1?',
        'Cuando el bit de A vale 1 y el bit de B vale 0',
        ['Cuando ambos bits valen 1', 'Cuando ambos bits valen 0', 'Cuando el bit de A vale 0 y el de B vale 1'],
        'El NA conduce con 1 y el NC conduce con 0; en serie deben conducir los dos.'),
      op('Dos contactos NA, A y B, en serie con la bobina Q. ¿Cuál es la ecuación?',
        'Q = A · B', ['Q = A + B', 'Q = /A · B', 'Q = /(A · B)'],
        'Serie = producto: Q vale 1 solo si ambos valen 1.')
    ]),
    S('e2', 'e', 'opcion', 2, [
      rap('rg4'),
      op('Un contacto de sello lee el mismo bit que la bobina Q. ¿Qué valor lee?',
        'El valor que tenía Q en el escaneo anterior', ['El valor que tendrá al final del ciclo', 'Siempre 0', 'Siempre 1'],
        'El programa se ejecuta de arriba hacia abajo: al llegar al contacto, Q todavía tiene el valor del ciclo anterior.'),
      op('¿Por qué un contacto de sello mantiene la salida encendida aunque se suelte la marcha?',
        'Porque realimenta el valor anterior de Q en paralelo con la marcha',
        ['Porque la marcha queda pulsada por dentro', 'Porque el temporizador la sostiene', 'Porque la CPU guarda la marcha en la fuente'],
        'Mientras Q valga 1, el contacto en paralelo mantiene el paso aunque la marcha vuelva a 0.')
    ]),
    S('e3', 'e', 'opcion', 2, [
      rap('rg1'),
      op('En Q = (M + Q) · P · E, ¿para qué sirve el término Q dentro del paréntesis?',
        'Mantiene la salida encendida después de soltar M (es el enclavamiento)',
        ['Apaga la salida cuando se pulsa M', 'Cuenta el tiempo de la salida', 'Protege al motor contra sobrecarga'],
        'Es el contacto de sello: realimenta la salida.'),
      op('En Q = (M + Q) · P · E, P y E son contactos NC en reposo. ¿Qué pasa si se pulsa E con el motor en marcha?',
        'Q se apaga: E pasa a 0 y corta el producto', ['Q sigue encendida gracias al sello', 'Q parpadea', 'No pasa nada hasta soltar M'],
        'P y E están en serie con todo el paralelo; si cualquiera baja a 0, la salida se corta.')
    ]),
    S('e4', 'e', 'campos', 5, [
      reto('g-reto', ['q1', 'q2', 'q3'], 'Evalúa el renglón de la escalera con estos valores de las entradas.'),
      reto('g-reto', ['q1', 'n', 'eq'], 'Evalúa el renglón de la escalera y obtén su ecuación.'),
      reto('g-reto', ['q2', 'q3', 'eq'], 'Evalúa el renglón de la escalera y obtén su ecuación.'),
      reto('d-reto', ['unos', 'fin', 'cua'], 'Analiza este enclavamiento con prioridad.')
    ]),
    S('e5', 'e', 'num', 3, [
      num((r) => {
        const [txt, f] = el(r, RENG_POS);
        return { t: `Un renglón de la escalera tiene estos contactos NA gobernando la bobina Q: ${txt}. De las 8 combinaciones posibles de A, B y C, ¿en cuántas vale Q = 1?`,
          valor: contar(3, f), unidad: 'combinaciones', tolRel: 0.001, sol: 'Se recorren las 8 combinaciones de A, B y C y se cuentan las que dejan pasar el flujo.' };
      }),
      num((r) => {
        const [txt, f] = el(r, RENG_NEG);
        return { t: `Un renglón de la escalera gobierna la bobina Q con estos contactos: ${txt}. Un contacto NC conduce cuando su bit vale 0. De las 8 combinaciones posibles de A, B y C, ¿en cuántas vale Q = 1?`,
          valor: contar(3, f), unidad: 'combinaciones', tolRel: 0.001, sol: 'Se recorren las 8 combinaciones, recordando que el NC conduce con 0, y se cuentan las que dejan pasar el flujo.' };
      }),
      num((r) => {
        const [txt, f, n, nombres] = el(r, RENG_SELLO);
        return { t: `Considera el enclavamiento ${txt}. Cuenta todas las combinaciones posibles de ${nombres} para las que la ecuación da 1. ¿Cuántas son?`,
          valor: contar(n, f), unidad: 'combinaciones', tolRel: 0.001, sol: 'Se cuentan las combinaciones en las que el lado derecho de la ecuación vale 1.' };
      })
    ]),

    // ---------------- F. Enclavamiento y GRAFCET ----------------
    S('f1', 'f', 'opcion', 2, [
      rap('rh1'),
      rap('rh3'),
      op('En las reglas de evolución, ¿qué se desactiva al franquear una transición?',
        'Las etapas inmediatamente anteriores a esa transición', ['Todas las etapas del GRAFCET', 'Solo la etapa inicial', 'Las acciones de la etapa siguiente'],
        'Se desactivan las etapas anteriores y se activan las posteriores.'),
      op('Una transición está validada cuando:',
        'Todas las etapas inmediatamente anteriores a ella están activas', ['Su condición se cumple', 'La etapa siguiente está inactiva', 'Se pulsa cualquier botón'],
        'Validada significa que están activas las etapas de entrada; para franquearla además debe cumplirse su condición.')
    ]),
    S('f2', 'f', 'opcion', 2, [
      rap('rh4'),
      op('Para activar dos ramas a la vez en un GRAFCET se usa:',
        'Una divergencia en Y (doble barra)', ['Una divergencia en O', 'Una transición sin condición', 'Dos etapas iniciales'],
        'La doble barra activa a la vez todas las ramas.'),
      op('En la regla de alternancia, ¿qué debe ir siempre entre dos etapas?',
        'Una transición', ['Otra etapa', 'Una acción', 'Un temporizador'],
        'Etapa y transición se alternan siempre: etapa, transición, etapa…'),
      op('Una divergencia en O significa que:',
        'Se elige una sola rama, según la condición que se cumpla', ['Se activan todas las ramas a la vez', 'Las ramas se ejecutan una detrás de otra', 'La etapa inicial se desactiva para siempre'],
        'Las condiciones de las ramas son excluyentes: solo se activa una.')
    ]),
    S('f3', 'f', 'opcion', 2, [
      rap('rh2'),
      op('¿Cuál es la diferencia entre el GRAFCET de nivel 1 y el de nivel 2?',
        'El nivel 1 describe en palabras; el nivel 2 usa las variables del PLC',
        ['El nivel 1 es para motores y el nivel 2 para lámparas', 'El nivel 2 no tiene transiciones', 'El nivel 1 usa direcciones de memoria'],
        'El nivel 2 reemplaza el texto por símbolos que el PLC puede ejecutar: PA, PP, T1 = 3 s, KM1 = 1.'),
      op('En el nivel 2, ¿cómo se escribe la acción «Encender la cinta» si la mueve el contactor KM1?',
        'KM1 = 1', ['/KM1', 'KM1 = 3 s', 'PA'], 'La acción se escribe como la variable y el valor que toma.'),
      op('En el nivel 2, la condición «pasaron 3 s en la etapa 1» se escribe:',
        'T1 = 3 s', ['PA', 'KM1 = 3', '/T1'], 'Es una condición de tiempo del temporizador T1.')
    ]),
    S('f4', 'f', 'campos', 5, [
      reto('h-reto', ['a', 'b', 'c'], 'Aplica las reglas de evolución a este GRAFCET.'),
      reto('h-reto', ['c', 'd', 'e'], 'Aplica las reglas de evolución y reconoce la estructura de este GRAFCET.'),
      reto('h-reto', ['a', 'd', 'e'], 'Aplica las reglas de evolución y reconoce la estructura de este GRAFCET.')
    ]),
    S('f5', 'f', 'campos', 5, [
      reto('k1-reto', ['a', 'b', 'c'], 'Lee este GRAFCET de nivel 1.'),
      reto('k1-reto', ['c', 'd', 'e'], 'Lee este GRAFCET de nivel 1 y aplica las reglas de evolución.'),
      reto('k2-reto', ['a', 'b', 'c'], 'Pasa del nivel 1 al nivel 2.'),
      reto('k2-reto', ['d', 'e', 'f'], 'Pasa del nivel 1 al nivel 2.')
    ]),
    S('f6', 'f', 'orden', 2, [
      orden(() => ({ t: 'Ordena lo que ocurre cuando, con la etapa 0 activa, se presiona el pulsador de arranque.',
        pasos: ['La etapa 0 está activa, así que la transición está validada', 'Se presiona el pulsador de arranque y la condición se cumple', 'Se franquea la transición', 'Se desactiva la etapa 0', 'Se activa la etapa 1'],
        por: 'Primero la transición debe estar validada y su condición cumplida; al franquearla, se apaga la etapa anterior y se activa la siguiente.' })),
      orden(() => ({ t: 'Ordena las fases de un ciclo de escaneo del PLC.',
        pasos: ['Lee las entradas y guarda su copia', 'Ejecuta el programa con esa copia', 'Escribe el resultado en la imagen de salidas', 'Actualiza las salidas físicas', 'Atiende comunicaciones y diagnóstico'],
        por: 'Las salidas físicas cambian recién cuando el programa terminó de ejecutarse.' })),
      orden(() => ({ t: 'Ordena el trabajo para pasar de un enunciado a un programa en PLC.',
        pasos: ['Identificar las entradas, las salidas y los temporizadores', 'Dibujar el GRAFCET de nivel 1 en palabras', 'Pasar al nivel 2 con las variables del PLC', 'Escribir el SET y el RESET de cada etapa', 'Dibujar el escalón de cada etapa y probarlo'],
        por: 'Cada paso se apoya en el anterior: del enunciado al nivel 1, al nivel 2, a las ecuaciones y a la escalera.' }))
    ]),
    S('f7', 'f', 'opcion', 2, [
      op('En un enclavamiento marcha-paro, ¿cómo se hace que el paro tenga prioridad sobre la marcha?',
        'Poniendo el contacto de paro en serie con todo el paralelo de marcha y sello',
        ['Poniéndolo en paralelo con la marcha', 'Poniéndolo solo en paralelo con el sello', 'Quitando el sello'],
        'Si el paro está en serie con todo, al abrirse corta el paso aunque la marcha o el sello conduzcan.'),
      op('En el enclavamiento Q = (M + Q) · P, con P un paro NC, ¿qué pasa al pulsar P?',
        'Q se apaga, porque P pasa a 0 y corta el producto', ['Q se mantiene por el sello', 'Q se enciende', 'No pasa nada hasta soltar M'],
        'El paro NC baja a 0 al pulsarlo y anula todo el producto.'),
      op('En un enclavamiento, ¿qué ocurre si M se suelta y el paro no se pulsó?',
        'Q se mantiene en 1, sostenida por el contacto de sello', ['Q se apaga de inmediato', 'Q queda indeterminada', 'Q parpadea'],
        'El sello lee el 1 que tenía Q y lo realimenta.')
    ]),

    // ---------------- G. El semáforo ----------------
    S('g1', 'g', 'opcion', 2, [
      op('Un semáforo tiene tres lámparas (verde, amarilla y roja), cada una en su propia salida, y se controla con un pulsador de arranque y uno de paro. ¿Cuántas salidas digitales necesita?',
        '3', ['1', '2', '5'],
        'Son tres lámparas, cada una en su propia salida; los pulsadores son entradas.'),
      op('En el GRAFCET de un semáforo, la etapa del rojo (5 s) está activa y se presiona el paro a los 2 s. ¿Qué ocurre?',
        'Vuelve a reposo de inmediato, se apagan las lámparas y el temporizador se detiene',
        ['Se espera a que pasen los 5 s y recién se detiene', 'Vuelve al verde', 'No ocurre nada hasta soltar el paro'],
        'La transición del paro está validada en el rojo y su condición se cumple: se franquea sin esperar el tiempo.'),
      op('¿Cuántos temporizadores necesita el GRAFCET del semáforo (verde 5 s; amarillo 2 s; rojo 5 s)?',
        '3, uno por cada etapa temporizada', ['1', '2', '5'],
        'Cada etapa con su tiempo (verde, amarillo y rojo) necesita su propio temporizador.')
    ]),
    S('g2', 'g', 'campos', 5, [
      reto('k3-reto', ['a', 'b', 'c'], 'Analiza las conexiones del semáforo.'),
      reto('k3-reto', ['d', 'e', 'f'], 'Analiza las conexiones del semáforo.'),
      reto('k4-reto', ['a', 'b', 'c'], 'Completa y analiza este GRAFCET.'),
      reto('k4-reto', ['c', 'd', 'e'], 'Analiza este GRAFCET.'),
      reto('k5-reto', ['a', 'b', 'c'], 'Haz evolucionar el GRAFCET del semáforo con estos eventos.')
    ]),
    S('g3', 'g', 'opcion', 2, [
      op('En el semáforo, el pulsador de arranque solo sirve en la etapa 0. Si se pulsa durante el verde, ¿qué pasa?',
        'Nada: la transición del arranque no está validada', ['Se reinicia el verde', 'Se pasa al amarillo', 'Se apagan las lámparas'],
        'La transición solo está validada cuando la etapa 0 está activa.'),
      op('Un semáforo de tres lámparas se controla con arranque y paro. ¿Qué entradas digitales usa?',
        'Dos pulsadores: arranque (NA) y paro (NC)', ['Tres sensores, uno por lámpara', 'Una sola entrada', 'Los tres temporizadores'],
        'Los pulsadores son entradas; las lámparas son salidas y los tiempos son temporizadores internos.'),
      op('Las lámparas de 220 V ca del semáforo, ¿con qué tipo de salida se comandan?',
        'Salida digital a relé', ['Salida digital a transistor', 'Salida analógica', 'Entrada digital'],
        'Son cargas de ca: el transistor no puede manejarlas.')
    ]),
    S('g4', 'g', 'orden', 2, [
      orden(() => ({ t: 'Ordena la secuencia normal del semáforo después de pulsar arranque.',
        pasos: ['Etapa 0: reposo, lámparas apagadas', 'Arranque: se enciende el verde durante 5 s', 'Pasan 5 s: se enciende el amarillo durante 2 s', 'Pasan 2 s: se enciende el rojo durante 5 s', 'Pasan 5 s en el rojo: vuelve al verde'],
        por: 'Verde, amarillo y rojo, y del rojo se vuelve al verde mientras no se pulse el paro.' })),
      orden(() => ({ t: 'Ordena lo que ocurre al pulsar el paro mientras el semáforo está en rojo.',
        pasos: ['La etapa 3 (rojo) está activa', 'Se pulsa el paro y su bit PP baja a 0', 'Se cumple la condición PP negado', 'Se franquea la transición hacia la etapa 0', 'Se apagan las lámparas y el temporizador se detiene'],
        por: 'La transición del paro está validada en el rojo y su condición se cumple: se franquea sin esperar el tiempo.' })),
      orden(() => ({ t: 'Ordena el funcionamiento de una puerta automática.',
        pasos: ['Etapa 0: puerta cerrada, en reposo', 'Sensor de presencia activado: el motor abre la puerta', 'Final de carrera de apertura: se enciende la luz verde', 'Pasan 5 s: el motor cierra la puerta', 'Final de carrera de cierre: se vuelve a la etapa 0'],
        por: 'Cada evento hace avanzar el GRAFCET a la etapa siguiente.' }))
    ]),

    // ---------------- H. SET, RESET y De Morgan ----------------
    S('h1', 'h', 'opcion', 2, [
      op('En un GRAFCET de llenado de un tanque, la acción «bomba encendida» está asociada a la etapa 2. ¿Cuándo funciona la bomba?',
        'Solo mientras la etapa 2 está activa',
        ['Mientras la etapa 0 está activa', 'Siempre que el nivel sea bajo', 'Desde que se pulsa marcha hasta que se pulsa paro, sin importar la etapa'],
        'La acción está asociada a la etapa: se ejecuta mientras la etapa esté activa y se detiene cuando se apaga.'),
      rap('rq2'), rap('rq3'), rap('rq4'),
      op('El RESET de una etapa se niega para usarlo en serie en la escalera. ¿Por qué?',
        'Porque el contacto en serie debe dejar pasar el flujo mientras no haya motivo para apagar la etapa',
        ['Porque la bobina solo acepta contactos NC', 'Porque así se ahorra una instrucción', 'Porque el RESET siempre vale 0'],
        'El escalón mantiene la etapa mientras el RESET negado conduce; cuando la condición de apagado se cumple, el contacto se abre.')
    ]),
    S('h2', 'h', 'campos', 5, [
      reto('l1-reto', ['a', 'b', 'c'], 'Escribe las ecuaciones de este GRAFCET de nivel 2.'),
      reto('l1-reto', ['d', 'e', 'f'], 'Escribe las ecuaciones de este GRAFCET de nivel 2.'),
      reto('l2-reto', ['a', 'b', 'c'], 'Simplifica con la ley de De Morgan.'),
      reto('l2-reto', ['d', 'e', 'f'], 'Simplifica con la ley de De Morgan y evalúa.'),
      reto('l3-reto', ['a', 'b', 'c'], 'Lee este escalón de la etapa 2 del tanque.'),
      reto('l3-reto', ['d', 'e', 'f'], 'Lee este escalón y analiza su comportamiento.')
    ]),
    S('h3', 'h', 'num', 3, [
      num((r) => {
        const [txt, f] = el(r, DM);
        return { t: `Para la expresión ${txt}, donde «/» indica negado, ¿en cuántas de las 4 combinaciones posibles de A y B vale 1?`,
          valor: contar(2, f), unidad: 'combinaciones', tolRel: 0.001, sol: 'Se evalúa la expresión en las 4 combinaciones de A y B.' };
      }),
      num((r) => {
        const [txt, f] = el(r, DM3);
        const a = el(r, [0, 1]), b = el(r, [0, 1]), c = el(r, [0, 1]);
        return { t: `Con A = ${a}; B = ${b}; C = ${c}, ¿cuánto vale la expresión ${txt}? («/» indica negado; «·» es producto y «+» es suma lógica).`,
          valor: f(!!a, !!b, !!c) ? 1 : 0, unidad: '', tolAbs: 0.001, tolRel: 0, sol: 'Se reemplazan los valores y se aplica la negación antes del producto y de la suma.' };
      }),
      num((r) => {
        const p = el(r, [0, 1]), q = el(r, [0, 1]);
        return { t: `El RESET de una etapa es RE2 = /PP + I3, donde PP es el bit de un paro NC e I3 un sensor. Con PP = ${p} e I3 = ${q}, ¿cuánto vale RE2?`,
          valor: (!p || q) ? 1 : 0, unidad: '', tolAbs: 0.001, tolRel: 0,
          sol: `/PP = ${p ? 0 : 1}; RE2 = ${p ? 0 : 1} + ${q} = ${(!p || q) ? 1 : 0}`,
          por: 'Un paro NC sin pulsar vale PP = 1, así que /PP vale 0 y el RESET depende solo del sensor.' };
      })
    ])
  ];

  // ---------- verificación interna ----------
  CE.PESO_TOTAL = CE.SLOTS.reduce((a, s) => a + s.peso, 0);
})();
