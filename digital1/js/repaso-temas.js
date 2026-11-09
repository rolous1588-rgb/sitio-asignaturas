// ============================================================
// Electrónica Digital 1 — Repaso para el examen (09/11/2026)
//   D1.REPASO: los temas, con su teoría (rescatada de las clases del 01/10 al
//   05/11), los widgets para manipular, los ejercicios (antiguos y nuevos) y las
//   preguntas rápidas. Los datos de «Errores típicos» salen de la base
//   (respuestas de las sesiones d1-c3, d1-c4 y d1-c5).
// ============================================================
(function () {
  'use strict';
  const D1 = (window.D1 = window.D1 || {});
  const X = String.raw;
  const b = (s) => '<span class="rp-bits">' + s + '</span>';
  const circ = (pu, opc) => '<div class="rp-circ">' + D1.circ.svg(3, pu, ['A', 'B', 'C'], Object.assign({ mono: true }, opc || {})) + '</div>';
  const mapa4 = (f, opc) => '<div class="rp-fig">' + D1.k.estatico(4, f, opc || {}) + '</div>';
  const R = (t, o, por, extra) => Object.assign({ t, o, por }, extra || {});

  const TEMAS = [
    // =========================================================
    {
      id: 'conv', n: 1, titulo: 'Números: binario, decimal y BCD', corto: 'Conversiones entre decimal, binario y BCD',
      teoria: [
        { t: 'Por qué solo 0 y 1', h: '<p>Un circuito digital no mide el voltaje exacto: solo decide si es <b>bajo (0)</b> o <b>alto (1)</b>. Con dos niveles el margen contra el ruido es grande y el circuito es simple y barato.</p>' },
        { t: 'Binario: cada posición vale el doble', h: '<p>En decimal cada posición vale 10 veces la anterior; en binario vale <b>2 veces</b>. El número es la suma de los pesos que están en 1.</p>' +
          '<table class="rp-tab rp-pesos"><tr>' + [7, 6, 5, 4, 3, 2, 1, 0].map((i) => '<td>\\(2^{' + i + '}\\)</td>').join('') + '</tr><tr>' + [128, 64, 32, 16, 8, 4, 2, 1].map((v) => '<td><b>' + v + '</b></td>').join('') + '</tr></table>' +
          '<div class="rp-ejm"><b>Binario → decimal:</b> la siguiente cantidad está en binario: ' + b('10110110') + '. Se suman los pesos de los unos: 128 + 32 + 16 + 4 + 2 = <b>182</b>.</div>' +
          '<div class="rp-ejm"><b>Decimal → binario (restando pesos):</b> 173. ¿Cabe 128? Sí → 1, quedan 45. ¿64? No → 0. ¿32? Sí → 1, quedan 13. ¿16? No → 0. ¿8? Sí → 1, quedan 5. ¿4? Sí → 1, queda 1. ¿2? No → 0. ¿1? Sí → 1. Resultado: ' + b('10101101') + '.</div>' },
        { w: 'bits8' },
        { t: '¿Cuántos valores caben en n bits?', h: '<p class="rp-f">' + X`Con \(n\) bits hay \(2^n\) combinaciones: de 0 a \(2^n - 1\).` + '</p>' +
          '<p>Con 8 bits: 256 combinaciones, del 0 al 255. Para contar hasta 1000 hacen falta 10 bits (' + X`\(2^{10} = 1024\)` + '). Cada bit extra <b>duplica</b> la cantidad.</p>' +
          '<p>Trucos: un binario es par si su último bit (peso 1) es 0. Agregar un 0 a la derecha multiplica por 2.</p>' },
        { t: 'BCD: cada dígito decimal con sus propios 4 bits', h: '<p>En <b>BCD</b> (decimal codificado en binario) no se convierte el número completo: cada dígito decimal se escribe con <b>4 bits</b> (0000 a 1001).</p>' +
          '<div class="rp-ejm"><b>Decimal → BCD:</b> 47 → 4 es 0100 y 7 es 0111 → la cantidad en BCD es ' + b('01000111') + '. En binario, 47 sería ' + b('101111') + ': ¡no es lo mismo!</div>' +
          '<div class="rp-ejm"><b>BCD → decimal:</b> la siguiente cantidad está en BCD: ' + b('01011000') + '. Se separa en grupos de 4 bits desde la derecha (0101 | 1000) y cada grupo es un dígito: 5 y 8 → <b>58</b>.</div>' +
          '<div class="rp-ejm"><b>BCD → binario:</b> primero a decimal y después a binario. ' + b('00100111') + ' en BCD → 27 → ' + b('11011') + ' en binario.</div>' +
          '<div class="rp-ejm"><b>Binario → BCD:</b> primero a decimal y después cada dígito a 4 bits. ' + b('1011010') + ' en binario → 90 → ' + b('10010000') + ' en BCD.</div>' +
          '<p><b>Códigos inválidos:</b> 4 bits dan 16 combinaciones, pero solo hay 10 dígitos. De 1010 a 1111 (10 a 15) <b>no existen en BCD</b>. Si un grupo vale más de 9, el código no es válido.</p>' +
          '<p>BCD gasta más bits (0 a 999 necesita 12 bits en BCD y 10 en binario), pero cada grupo de 4 bits va directo a su display.</p>' },
        { w: 'bcd' }
      ],
      errores: [
        'Leer una cantidad en BCD como si fuera binario (o al revés). Siempre mira en qué código está: ' + b('01001001') + ' en BCD es 49 y en binario es 73.',
        'Con 8 bits el máximo es 255, no 256: la primera combinación es el 0.',
        'Para BCD no se convierte el número completo: dígito por dígito, 4 bits cada uno.',
        'En clase: «¿cuántos bits para contar 300 piezas?» la acertó el 79 %; las conversiones del 05/11 promediaron 3,1 de 4.'
      ],
      ejercicios: ['n1', 'n11'],
      rapidas: [
        R('Una máquina cuenta piezas de 0 a 299. ¿Cuántos bits necesita como mínimo?', ['9', '8', '10', '300'], X`Con 8 bits se llega a \(2^8 - 1 = 255\): no alcanza. Con 9 bits, a \(2^9 - 1 = 511\).`),
        R('Con 8 bits, ¿cuál es el número más grande?', ['255', '256', '128', '8'], 'Hay 2⁸ = 256 combinaciones, pero la primera es el 0: el más grande es 255.'),
        R('La siguiente cantidad está en <b>BCD</b>: ' + b('01001001') + '. ¿Qué número decimal es?', ['49', '73', '94', 'No es un BCD válido'], 'En BCD cada grupo de 4 bits es un dígito: 0100 = 4 y 1001 = 9 → 49. (Leída en binario sería 73.)'),
        R('La siguiente cantidad está en <b>binario</b>: ' + b('01001001') + '. ¿Qué número decimal es?', ['73', '49', '41', '137'], '64 + 8 + 1 = 73. (Leída en BCD sería 49: siempre hay que saber en qué código está.)'),
        R('La siguiente cantidad está en <b>BCD</b>: ' + b('00111100') + '. ¿Qué número decimal es?', ['No es un BCD válido', '60', '312', '39'], 'Grupos de 4: 0011 = 3 y 1100 = 12. El 12 no es un dígito: no es un código BCD válido.', { una: true }),
        R('La siguiente cantidad está en <b>decimal</b>: 25. ¿Cuál es su código BCD?', [b('00100101'), b('00011001'), b('01010010'), b('00100110')], '2 → 0010 y 5 → 0101 → 00100101. (25 en binario es 11001.)'),
        R('Para contar de 0 a 999, ¿cuántos bits hacen falta en binario y cuántos en BCD?', ['10 en binario; 12 en BCD', '12 en binario; 10 en BCD', '10 en los dos', '9 en binario; 12 en BCD'], 'Binario: 2¹⁰ = 1024 alcanza. BCD: 3 dígitos × 4 bits = 12.', { una: true }),
        R('Sin convertir, ¿cómo sabes si un número binario es par?', ['Si su último bit (peso 1) es 0', 'Si tiene más ceros que unos', 'Si su primer bit es 0', 'Si tiene una cantidad par de unos'], 'Todos los pesos son pares menos el último (1). Si ese bit es 0, el número es par.', { una: true }),
        R('Si a un número binario le agregas un 0 a la derecha, el número…', ['se multiplica por 2', 'se multiplica por 10', 'no cambia', 'se divide entre 2'], 'Cada bit se corre a una posición que vale el doble, igual que en decimal un 0 a la derecha multiplica por 10.'),
        R('La siguiente cantidad está en <b>BCD</b>: ' + b('00010110') + '. ¿Cuánto vale en binario?', [b('10000'), b('10110'), b('00010110'), b('1010')], 'Primero a decimal: 0001 | 0110 → 16. Después a binario: 16 = 10000.')
      ]
    },
    // =========================================================
    {
      id: 'comp', n: 2, titulo: 'Compuertas lógicas', corto: 'Las 7 compuertas, sus tablas y diagramas de tiempo',
      teoria: [
        { t: 'Antes de las compuertas: interruptores', h: '<p>Interruptores en <b>serie</b>: la lámpara enciende solo si A <b>y</b> B están cerrados → <b>AND</b>. En <b>paralelo</b>: basta que A <b>o</b> B esté cerrado → <b>OR</b>. Cerrado = 1; abierto = 0.</p>' },
        { t: 'Las 7 compuertas', h: '<table class="rp-tab"><tr><th>Compuerta</th><th>Expresión</th><th>Regla</th></tr>' +
          '<tr><td>NOT</td><td>' + X`\(Y = \overline{A}\)` + '</td><td>Invierte la entrada</td></tr>' +
          '<tr><td>AND</td><td>' + X`\(Y = A\cdot B\)` + '</td><td>1 solo si <b>todas</b> son 1</td></tr>' +
          '<tr><td>OR</td><td>' + X`\(Y = A + B\)` + '</td><td>1 si <b>al menos una</b> es 1</td></tr>' +
          '<tr><td>NAND</td><td>' + X`\(Y = \overline{A\cdot B}\)` + '</td><td>0 solo si todas son 1</td></tr>' +
          '<tr><td>NOR</td><td>' + X`\(Y = \overline{A + B}\)` + '</td><td>1 solo si todas son 0</td></tr>' +
          '<tr><td>XOR</td><td>' + X`\(Y = A \oplus B\)` + '</td><td>1 si son <b>distintas</b></td></tr>' +
          '<tr><td>XNOR</td><td>' + X`\(Y = \overline{A \oplus B}\)` + '</td><td>1 si son <b>iguales</b></td></tr></table>' },
        { w: 'compuerta' },
        { t: 'La caja misteriosa', h: '<p>Para saber qué compuerta hay adentro hay que probar <b>las 4 filas</b>. Por ejemplo, OR y XOR solo se diferencian cuando A = B = 1.</p>' },
        { t: 'Diagrama de tiempos', h: '<p>Las señales cambian con el tiempo; en cada intervalo se aplica la tabla de la compuerta con los valores de A y B en ese momento.</p><p>Una <b>AND</b> deja pasar A solo cuando B = 1 (B funciona como una puerta que se abre o se cierra: por eso se llaman <i>gates</i>). Una <b>OR</b> deja pasar A cuando B = 0. Una <b>XOR</b> deja pasar A cuando B = 0 y la invierte cuando B = 1.</p>' },
        { w: 'tiempos' },
        { t: 'Leer un circuito', h: '<p>Para saber cuánto vale la salida, se sigue la señal <b>compuerta por compuerta</b>, anotando el valor en cada cable. Ejemplo con A = 1, B = 0 y C = 0:</p>' + circ([[0, 3], [4]]) +
          '<p>Arriba: ' + X`\(A\cdot\overline{B} = 1\cdot 1 = 1\)` + '. Abajo: C = 0. La OR recibe 1 y 0: <b>F = 1</b>.</p>' }
      ],
      errores: [
        'Evaluar un circuito «a ojo»: en clase lo acertó el 50 % (12/10) y el 69 % (05/11). Anota el valor de cada cable.',
        'Confundir OR con XOR: solo se diferencian en la fila A = 1, B = 1.',
        'Olvidar el circulito: NAND y NOR son AND y OR con la salida invertida.'
      ],
      ejercicios: ['n2', 'p9'],
      rapidas: [
        R('¿Qué compuerta da 1 solo si todas sus entradas son 1?', ['AND', 'OR', 'NAND', 'XOR'], 'AND: basta un 0 para que salga 0.'),
        R('¿Qué compuerta da 1 solo si todas sus entradas son 0?', ['NOR', 'NAND', 'AND', 'XOR'], 'NOR = OR invertida: la OR da 0 solo si todas son 0, y la NOR invierte eso.'),
        R('¿Qué compuerta da 1 cuando sus dos entradas son distintas?', ['XOR', 'XNOR', 'OR', 'NAND'], 'XOR: 01 y 10 dan 1; 00 y 11 dan 0. La XNOR hace lo contrario.'),
        R('Una NAND con A = 1 y B = 1 da…', ['0', '1', 'Depende', 'No se puede saber'], 'La AND daría 1 y la NAND lo invierte: 0. Es la única fila en que la NAND da 0.'),
        R('Quiero que A pase a la salida solo cuando B = 1, y que con B = 0 la salida quede en 0. ¿Qué compuerta uso?', ['AND', 'OR', 'XOR', 'NOR'], 'AND: con B = 1, Y = A; con B = 0, Y = 0.', { una: true }),
        R('Para distinguir una OR de una XOR, ¿qué fila tienes que probar sí o sí?', ['A = 1, B = 1', 'A = 0, B = 0', 'A = 0, B = 1', 'A = 1, B = 0'], 'Solo con A = B = 1 dan distinto: la OR da 1 y la XOR da 0.'),
        R('Un interruptor abajo y otro arriba: mover cualquiera cambia la luz. ¿Qué compuerta sirve?', ['XOR', 'OR', 'AND', 'NAND'], 'XOR: cada vez que cambia una entrada, cambia la salida. La XNOR también sirve.'),
        R('Con A = 1, B = 1 y C = 1, ¿cuánto vale F?', ['0', '1', 'Depende de C', 'No se puede saber'], X`Arriba: \(A\cdot\overline{C} = 1\cdot 0 = 0\). Abajo: \(\overline{B} = 0\). La OR recibe 0 y 0: \(F = 0\).`, { fig: circ([[0, 5], [3]]) }),
        R('Con A = 1, B = 0 y C = 0, ¿cuánto vale F?', ['1', '0', 'Depende de C', 'No se puede saber'], X`Arriba: \(A\cdot\overline{B} = 1\). Abajo: \(C = 0\). La OR da 1.`, { fig: circ([[0, 3], [4]]) })
      ]
    },
    // =========================================================
    {
      id: 'boole', n: 3, titulo: 'Álgebra de Boole y De Morgan', corto: 'Reglas, absorción, De Morgan y simplificar',
      teoria: [
        { t: 'Las reglas (piensa en interruptores)', h: '<p>' + X`\(\cdot\)` + ' es serie, ' + X`\(+\)` + ' es paralelo, 0 es abierto, 1 es cerrado.</p>' +
          '<table class="rp-tab"><tr><th>Con ·</th><th>Con +</th></tr>' +
          '<tr><td>' + X`\(A\cdot 0 = 0\)` + '</td><td>' + X`\(A + 0 = A\)` + '</td></tr>' +
          '<tr><td>' + X`\(A\cdot 1 = A\)` + '</td><td>' + X`\(A + 1 = 1\)` + '</td></tr>' +
          '<tr><td>' + X`\(A\cdot A = A\)` + '</td><td>' + X`\(A + A = A\)` + '</td></tr>' +
          '<tr><td>' + X`\(A\cdot\overline{A} = 0\)` + '</td><td>' + X`\(A + \overline{A} = 1\)` + '</td></tr>' +
          '<tr><td colspan="2">Doble negación: ' + X`\(\overline{\overline{A}} = A\)` + '</td></tr></table>' },
        { t: 'Distributivas y absorción', h: '<div class="rp-f">' + X`\[ A\cdot(B + C) = A\cdot B + A\cdot C \]` + X`\[ A + B\cdot C = (A + B)\cdot(A + C) \]` + '</div>' +
          '<p>La segunda no vale en aritmética, pero en Boole sí.</p>' +
          '<div class="rp-f">' + X`\[ A + A\cdot B = A \]\[ A\cdot(A + B) = A \]\[ A + \overline{A}\cdot B = A + B \]` + '</div>' +
          '<div class="rp-ejm"><b>¿Por qué ' + X`\(A + A\cdot B = A\)` + '?</b> Si A = 1, todo vale 1. Si A = 0, ' + X`\(A\cdot B\)` + ' también es 0. B nunca decide nada: ' + X`\(A\cdot(1 + B) = A\cdot 1 = A\)` + '.</div>' },
        { t: 'Leyes de De Morgan', h: '<div class="rp-f">' + X`\[ \overline{A\cdot B} = \overline{A} + \overline{B} \qquad \overline{A + B} = \overline{A}\cdot\overline{B} \]` + '</div>' +
          '<p><b>Se rompe la barra y se cambia la operación</b> (' + X`\(\cdot \leftrightarrow +\)` + '). Vale para más variables: ' + X`\(\overline{A\cdot B\cdot C} = \overline{A} + \overline{B} + \overline{C}\)` + '.</p>' +
          '<p>En circuitos: una NAND es una OR con las entradas negadas; una NOR es una AND con las entradas negadas.</p>' },
        { w: 'demorgan' },
        { t: 'Simplificar paso a paso', h: '<div class="rp-ejm">' + X`\(Y = A\cdot B + A\cdot\overline{B}\)` + '<br>= ' + X`\(A\cdot(B + \overline{B})\)` + ' (factor común A)<br>= ' + X`\(A\cdot 1\)` + ' (' + X`\(B + \overline{B} = 1\)` + ')<br>= <b>A</b>. Antes: 2 AND, 1 OR y 1 NOT. Después: un simple cable desde A.</div>' +
          '<div class="rp-ejm">' + X`\(Y = \overline{A}\cdot B + A\cdot B + A\cdot\overline{B}\)` + '<br>= ' + X`\(\overline{A}\cdot B + A\cdot B + A\cdot B + A\cdot\overline{B}\)` + ' (se repite ' + X`\(A\cdot B\)` + ': X + X = X)<br>= ' + X`\(B\cdot(\overline{A} + A) + A\cdot(B + \overline{B})\)` + '<br>= <b>A + B</b>: una sola OR.</div>' +
          '<p>Si una variable desaparece al simplificar, significa que no influye en la salida: sus cables y compuertas sobran.</p>' }
      ],
      errores: [
        'Absorción ' + X`\(A + A\cdot B = A\)` + ': el 05/11 solo la acertó el 33 %. Es la pregunta que más falló.',
        'De Morgan: el 12/10 la acertó el 45 %; el 05/11 subió al 79 %. Se niega <b>cada</b> variable <b>y</b> se cambia la operación.',
        'Creer que ' + X`\(\overline{A\cdot B} = \overline{A}\cdot\overline{B}\)` + ': falta cambiar el ' + X`\(\cdot\)` + ' por ' + X`\(+\)` + '.'
      ],
      ejercicios: ['n3'],
      rapidas: [
        R(X`\(A + A\cdot B\)` + ' es igual a…', [X`\(A\)`, X`\(B\)`, X`\(A\cdot B\)`, X`\(1\)`], X`Absorción: \(A\cdot(1 + B) = A\cdot 1 = A\).`),
        R(X`\(\overline{A + B}\)` + ' es igual a…', [X`\(\overline{A}\cdot\overline{B}\)`, X`\(\overline{A} + \overline{B}\)`, X`\(A\cdot B\)`, X`\(\overline{A}\cdot B\)`], 'De Morgan: negar una suma es multiplicar las negaciones.'),
        R(X`\(\overline{A\cdot B}\)` + ' es igual a…', [X`\(\overline{A} + \overline{B}\)`, X`\(\overline{A}\cdot\overline{B}\)`, X`\(A + B\)`, X`\(A\cdot B\)`], 'De Morgan: negar un producto es sumar las negaciones.'),
        R(X`\(A\cdot B + A\cdot\overline{B}\)` + ' es igual a…', [X`\(A\)`, X`\(B\)`, X`\(1\)`, X`\(A\cdot B\)`], X`\(A\cdot(B + \overline{B}) = A\).`),
        R(X`\(A + \overline{A}\cdot B\)` + ' es igual a…', [X`\(A + B\)`, X`\(A\)`, X`\(B\)`, X`\(A\cdot B\)`], X`\((A + \overline{A})\cdot(A + B) = A + B\).`),
        R(X`\(A\cdot\overline{A}\)` + ' es igual a…', [X`\(0\)`, X`\(1\)`, X`\(A\)`, X`\(\overline{A}\)`], 'Una variable y su negación nunca valen 1 a la vez.'),
        R(X`\(A + 1\)` + ' es igual a…', [X`\(1\)`, X`\(A\)`, X`\(0\)`, X`\(\overline{A}\)`], 'Un interruptor siempre cerrado en paralelo: la corriente pasa siempre.'),
        R('¿Es cierto que ' + X`\(A + B\cdot C = (A + B)\cdot(A + C)\)` + '?', ['Sí: en Boole la suma también distribuye', 'No: solo vale en aritmética', 'Solo si A = 1', 'Solo si B = C'], 'Es la distributiva de la suma. En aritmética no vale, en Boole sí: compruébalo con una tabla de 8 filas.', { una: true }),
        R('Si al simplificar una variable desaparece, en el circuito significa que…', ['esa variable no influye en la salida', 'hay un error de cálculo', 'hay que agregar un inversor', 'la salida es siempre 1'], 'Sus cables y compuertas sobran: el circuito queda más barato y con menos puntos de falla.', { una: true })
      ]
    },
    // =========================================================
    {
      id: 'ttl', n: 4, titulo: 'TTL: del símbolo al chip', corto: 'Chips 74xx, pines, niveles y fallas típicas',
      teoria: [
        { t: 'La familia 74xx', h: '<table class="rp-tab"><tr><th>Chip</th><th>Trae</th></tr>' +
          '<tr><td>7400</td><td>4 NAND de 2 entradas</td></tr><tr><td>7402</td><td>4 NOR de 2 entradas (¡otra distribución de pines!)</td></tr>' +
          '<tr><td>7404</td><td>6 inversores NOT</td></tr><tr><td>7408</td><td>4 AND de 2 entradas</td></tr>' +
          '<tr><td>7432</td><td>4 OR de 2 entradas</td></tr><tr><td>7486</td><td>4 XOR de 2 entradas</td></tr><tr><td>7448</td><td>Decodificador BCD a 7 segmentos</td></tr></table>' +
          '<p>Chips de 14 pines: <b>pin 14 = VCC (+5 V)</b> y <b>pin 7 = GND</b>. La muesca va a la izquierda; el pin 1 queda abajo a la izquierda y se cuenta en sentido antihorario.</p>' },
        { t: 'Niveles lógicos TTL', h: '<div class="rp-f">' + X`\[ V \le 0{,}8\ \text{V} \Rightarrow 0 \qquad V \ge 2{,}0\ \text{V} \Rightarrow 1 \]` + '</div><p>Entre 0,8 V y 2,0 V está la <b>zona prohibida</b>: puede leer 0 o 1. Las salidas TTL dan unos 0,3 V (0) y 3,4 V (1). En CMOS 74HC a 5 V: 0 hasta 1,5 V y 1 desde 3,5 V.</p>' },
        { w: 'voltaje' },
        { t: 'Entradas al aire y entradas que sobran', h: '<p>En TTL una entrada sin conectar suele leerse como 1, pero capta ruido y el circuito falla al azar: <b>nunca se deja al aire</b>.</p><p>Si sobra una entrada: en una <b>AND</b> se conecta a 1 (o se une a la otra); en una <b>OR</b>, a 0.</p>' },
        { t: 'Armaste el circuito y no funciona', h: '<ol class="rp-lista"><li>Alimentación: pin 14 a +5 V y pin 7 a GND.</li><li>Orientación: muesca y pin 1.</li><li>Entradas al aire.</li><li>Que sea el chip correcto (el 7402 tiene las salidas en los pines 1, 4, 10 y 13).</li><li>Cables y protoboard.</li></ol>' },
        { t: 'Contar chips', h: '<p>Se cuentan <b>chips, no compuertas</b>. Para ' + X`\(Y = A\cdot B + A\cdot C + B\cdot C\)` + ': 3 AND (un 7408, sobra una) y 2 OR de 2 entradas en cascada (un 7432) = <b>2 chips</b>. Si hay variables negadas, se suma un 7404.</p>' }
      ],
      errores: [
        'Cablear un 7402 igual que un 7400: tiene otra distribución de pines. Siempre se mira la hoja de datos.',
        'Contar compuertas en vez de chips: un 7408 trae 4 AND.',
        'Una OR de 3 entradas con chips de 2 entradas necesita 2 OR en cascada.'
      ],
      ejercicios: ['n4'],
      rapidas: [
        R('¿Qué va en los pines 7 y 14 de un chip 74xx de 14 pines?', ['7: GND; 14: VCC (+5 V)', '7: VCC; 14: GND', '1: VCC; 14: GND', 'Son entradas comunes'], 'Pin 7 = tierra y pin 14 = +5 V. Sin eso el chip no hace nada.', { una: true }),
        R('¿Qué trae el chip 7400?', ['4 NAND de 2 entradas', '4 AND de 2 entradas', '6 inversores NOT', '4 NOR de 2 entradas'], '7400: cuatro NAND. Con él se arma cualquier circuito (NAND universal).', { una: true }),
        R('¿Qué chip trae 6 inversores NOT?', ['7404', '7400', '7408', '7432'], '7404: seis NOT.'),
        R('¿Qué chip trae 4 compuertas XOR?', ['7486', '7432', '7402', '7408'], '7486: cuatro XOR de 2 entradas.'),
        R('En TTL, una entrada con 1,5 V se lee como…', ['Indefinido: zona prohibida', '0', '1', 'Siempre 1'], 'TTL: hasta 0,8 V se lee 0 y desde 2,0 V se lee 1. Entre los dos no está garantizado.', { una: true }),
        R('En un 7408 conectas A = 1 y dejas B al aire. ¿Qué pasa?', ['Probablemente lee 1, pero capta ruido: no se deja al aire', 'Siempre lee 0', 'Siempre lee 1 y es seguro', 'El chip se quema'], 'En TTL una entrada al aire suele leerse 1, pero «probablemente» no sirve: capta ruido y falla al azar.', { una: true }),
        R('Te sobra una entrada en una OR. ¿A qué nivel la conectas?', ['A 0 (o unida a la otra entrada)', 'A 1', 'La dejo al aire', 'A VCC'], 'Si la pones a 1, la salida de la OR queda siempre en 1.', { una: true }),
        R('Un circuito tiene 3 AND y 2 OR de 2 entradas. ¿Cuántos chips necesitas?', ['2: un 7408 y un 7432', '5', '3', '1'], 'Un 7408 trae 4 AND (sobra una) y un 7432 trae 4 OR (sobran dos).', { una: true }),
        R('Armaste el circuito y nada enciende. ¿Qué revisas primero?', ['La alimentación: pin 14 a +5 V y pin 7 a GND', 'Cambiar todos los chips', 'La tabla de verdad', 'El simulador'], 'Primero alimentación y orientación; después entradas al aire, chip correcto y cables.', { una: true })
      ]
    },
    // =========================================================
    {
      id: 'rep', n: 5, titulo: 'Tabla, función y circuito', corto: 'Las seis conversiones entre tabla, función y circuito',
      teoria: [
        { t: 'Tres formas de describir lo mismo', h: '<p>Un circuito combinacional se puede describir con su <b>tabla de verdad</b>, con su <b>función lógica</b> (expresión) o con su <b>circuito</b>. Hay que saber pasar de cualquiera a cualquiera.</p>' +
          '<div class="rp-tri"><span>Tabla</span><span>Función</span><span>Circuito</span></div>' },
        { t: 'Ejemplo: el votador de 3 jueces', h: '<p>Se aprueba si al menos dos jueces votan a favor (A, B, C = 1 si el juez vota a favor).</p><div class="rp-fig">' + D1.k.tablaHTML(3, [0, 0, 0, 1, 0, 1, 1, 1], { salida: 'Y' }) + '</div>' +
          '<div class="rp-f">' + X`\[ Y = A\cdot B + A\cdot C + B\cdot C \]` + '</div>' + circ([[0, 2], [0, 4], [2, 4]], { salida: 'Y' }) },
        { t: 'Tabla → función', h: '<p>Cada fila con <b>Y = 1</b> da un término: la variable en 1 va tal cual y la variable en 0 va negada. Se suman todos los términos (suma de productos). Después se simplifica con álgebra o, mejor, con el mapa de Karnaugh.</p>' +
          '<div class="rp-ejm">Fila A = 0, B = 1, C = 1 → término ' + X`\(\overline{A}\cdot B\cdot C\)` + '. Ese producto vale 1 <b>solo en esa fila</b>.</div>' },
        { t: 'Función → tabla', h: '<p>Cada término vale 1 en las filas donde todos sus literales valen 1. Se marcan esas filas con Y = 1 y el resto con 0. Con n entradas hay ' + X`\(2^n\)` + ' filas.</p>' +
          '<div class="rp-ejm">' + X`\(Y = A\cdot\overline{B} + C\)` + ': ' + X`\(A\cdot\overline{B}\)` + ' vale 1 en las filas 100 y 101; C vale 1 en 001, 011, 101 y 111. Y = 1 en 001, 011, 100, 101 y 111.</div>' },
        { t: 'Función → circuito', h: '<p>Una <b>AND por cada término</b> (con NOT donde haya barra) y una <b>OR</b> que los junta. Un término de una sola variable es un cable directo a la OR.</p>' },
        { t: 'Circuito → función y → tabla', h: '<p>Se lee cada AND (qué variables le llegan y cuáles pasan por un NOT) y se escribe su término; la OR los suma. Para la tabla, se prueban las ' + X`\(2^n\)` + ' combinaciones siguiendo la señal compuerta por compuerta (o se sale primero a la función).</p>' +
          '<p>Formas de dos niveles: AND → OR (suma de productos); OR → AND (producto de sumas); NAND → NAND (hace lo mismo que AND → OR).</p>' },
        { t: 'Tabla → circuito', h: '<p>Tabla → mapa de Karnaugh → expresión mínima → circuito. Así el circuito sale con la menor cantidad de compuertas.</p>' },
        { w: 'circuito' }
      ],
      errores: [
        'Del circuito a la función: en clase costó tanto como evaluar el circuito (alrededor del 50 % el 12/10).',
        'En la tabla, dejar filas sin llenar: cuentan como incorrectas.',
        'Olvidar que una variable en 0 va <b>negada</b> en el término de esa fila.'
      ],
      ejercicios: ['n5', 'n6', 'n7', 'n8', 'p2', 'p4'],
      rapidas: [
        R('Una fila con Y = 1 tiene A = 0, B = 1 y C = 1. ¿Qué término aporta?', [X`\(\overline{A}\cdot B\cdot C\)`, X`\(A\cdot\overline{B}\cdot\overline{C}\)`, X`\(\overline{A} + B + C\)`, X`\(A\cdot B\cdot C\)`], 'La variable en 1 va tal cual y la variable en 0 va negada: así el producto vale 1 solo en esa fila.'),
        R('Con 3 entradas, ¿cuántas filas tiene la tabla de verdad? ¿Y con 5?', ['8 y 32', '6 y 10', '8 y 16', '9 y 25'], 'Con n entradas hay 2ⁿ filas: 2³ = 8 y 2⁵ = 32.'),
        R(X`\(F = A\cdot B + C\)` + ' con A = 0, B = 1 y C = 1. ¿Cuánto vale F?', ['1', '0', 'Depende de A', 'No se puede saber'], X`\(A\cdot B = 0\), pero \(C = 1\): la OR da 1.`),
        R('¿Qué función implementa este circuito?', [X`\(Y = A\cdot B + A\cdot C + B\cdot C\)`, X`\(Y = A\cdot B\cdot C\)`, X`\(Y = A + B + C\)`, X`\(Y = A\cdot B + C\)`], 'Tres AND (A·B, A·C y B·C) que entran a la OR: el votador «2 de 3».', { fig: circ([[0, 2], [0, 4], [2, 4]], { salida: 'Y' }) }),
        R(X`\(Y = A\cdot B + A\cdot C + B\cdot C\)` + ' con chips de 2 entradas: ¿cuántas AND y cuántas OR?', ['3 AND y 2 OR', '3 AND y 1 OR', '2 AND y 2 OR', '6 AND y 3 OR'], 'Una AND por término (3) y una OR de 3 entradas armada con 2 OR de 2 en cascada.', { una: true }),
        R('Para pasar de un circuito a su tabla de verdad, ¿qué haces?', ['Pruebas las 2ⁿ combinaciones siguiendo la señal', 'Cuentas las compuertas', 'Agrupas en el mapa', 'Aplicas De Morgan'], 'Se prueba cada combinación (o se escribe primero la función y luego se evalúa fila por fila).', { una: true }),
        R('Un circuito NAND → NAND hace lo mismo que…', ['AND → OR', 'OR → AND', 'OR → OR', 'NOR → NOR'], X`Por De Morgan, \(\overline{\overline{X}\cdot\overline{Y}} = X + Y\): las dos barras de cada producto se cancelan.`)
      ]
    },
    // =========================================================
    {
      id: 'kmap', n: 6, titulo: 'Mapas de Karnaugh', corto: 'Agrupar con 3 y 4 variables, con X y sin X',
      teoria: [
        { t: 'La idea: celdas vecinas cambian un solo bit', h: '<p>El mapa ordena las filas de la tabla en código Gray (<b>00; 01; 11; 10</b>) para que dos celdas vecinas difieran en <b>una sola variable</b>. Al juntar dos vecinas, esa variable desaparece:</p>' +
          '<div class="rp-f">' + X`\[ A\cdot B\cdot\overline{C} + A\cdot B\cdot C = A\cdot B \]` + '</div>' +
          '<p>El mapa se «enrolla»: la columna de la izquierda es vecina de la de la derecha, y la fila de arriba de la de abajo. En 4 variables cada celda tiene 4 vecinas.</p>' },
        { t: 'Reglas para agrupar', h: '<ol class="rp-lista"><li>Solo se agrupan <b>unos</b> (y X si conviene).</li><li>Grupos de <b>1, 2, 4, 8 o 16</b> celdas, en rectángulo (nunca 3, 6 ni en diagonal).</li><li>Los bordes se tocan.</li><li>Grupos <b>lo más grandes</b> posible.</li><li>La <b>menor cantidad</b> de grupos.</li><li>Se pueden <b>solapar</b>: cada 1 debe quedar en algún grupo.</li></ol>' +
          '<p class="rp-f">' + X`Un grupo de \(2^k\) celdas elimina \(k\) variables.` + '</p>' +
          '<p>En 4 variables: grupo de 2 → 3 literales; de 4 → 2 literales; de 8 → 1 literal.</p>' },
        { t: 'Las cuatro esquinas', h: mapa4([1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0], { grupos: [{ mask: 5, val: 0 }], mt: false }) + '<p>Las cuatro esquinas forman <b>un solo grupo</b>: en las cuatro, B = 0 y D = 0 → ' + X`\(F = \overline{B}\cdot\overline{D}\)` + '.</p>' },
        { t: 'Solapar grupos', h: mapa4(Array.from({ length: 16 }, (_, m) => ((m & 8) || (m & 3) === 3 ? 1 : 0)), { grupos: [{ mask: 8, val: 8 }, { mask: 3, val: 3 }], mt: false }) +
          '<p>Los unos de la columna CD = 11 ya están en parte en el grupo de A, pero conviene <b>reusarlos</b> para formar el grupo de 4 (' + X`\(C\cdot D\)` + ') en vez de un grupo de 2 (' + X`\(\overline{A}\cdot C\cdot D\)` + '): ' + X`\(F = A + C\cdot D\)` + '.</p>' },
        { t: '«No importa» (X)', h: '<p>Cuando una combinación nunca llega (por ejemplo, 1010 a 1111 en BCD), su salida es <b>X</b>. Una X se toma como 1 <b>solo si agranda un grupo</b>; si no, como 0. Nunca se hace un grupo solo de X.</p>' +
          '<div class="rp-ejm">Entrada BCD, Y = 1 si el dígito es 5 o más: aprovechando las X, ' + X`\(Y = A + B\cdot D + B\cdot C\)` + '.</div>' +
          '<p>A veces hay más de una expresión mínima correcta: si dan lo mismo fila por fila, las dos están bien.</p>' },
        { w: 'mapa' }
      ],
      errores: [
        'No solapar grupos: en la alarma de incendio (08/10) 6 de 9 hicieron grupos de 2 en vez de grupos de 4 que se pisan. Después de practicarlo, 9 de 14 lo hicieron bien (15/10).',
        'Tamaño del grupo y literales: «un grupo de 4 en 4 variables deja 2 literales» lo acertó el 71 % (05/11).',
        'Ordenar columnas 00, 01, 10, 11: el orden correcto es Gray (00, 01, 11, 10).'
      ],
      ejercicios: ['p3', 'p4', 'p5', 'p6'],
      rapidas: [
        R('En un mapa de 4 variables, ¿cuántas vecinas tiene cada celda?', ['4', '2', '3', '8'], 'Una vecina por cada variable que puede cambiar: 4 variables → 4 vecinas (contando los bordes).'),
        R('¿Por qué las columnas van 00, 01, 11, 10 y no 00, 01, 10, 11?', ['Para que entre vecinas cambie un solo bit', 'Porque así se cuenta en binario', 'Para que entren más unos', 'Es solo una costumbre'], 'Es el código Gray: de 01 a 10 cambiarían dos bits y esas celdas ya no se podrían juntar.', { una: true }),
        R('Una X conviene tomarla como 1…', ['solo si agranda un grupo', 'siempre', 'nunca', 'solo si está sola'], 'Como 1 solo si permite agrandar un grupo; si no, como 0.'),
        R('En un mapa de 4 variables, un grupo de 4 celdas da un término de…', ['2 literales', '4 literales', '1 literal', '3 literales'], X`Un grupo de \(2^k\) celdas elimina \(k\) variables: 4 celdas eliminan 2 de las 4.`),
        R('En un mapa de 4 variables, un grupo de 8 celdas da un término de…', ['1 literal', '2 literales', '3 literales', '4 literales'], '8 celdas = 2³: eliminan 3 de las 4 variables.'),
        R('¿Un grupo de 3 celdas vale?', ['No: solo 1, 2, 4, 8 o 16', 'Sí, si están en fila', 'Sí, siempre', 'Solo con X'], 'Tres unos se cubren con dos grupos de 2 que se pisan.', { una: true }),
        R('Dos unos en diagonal, ¿forman un grupo?', ['No: cambian dos variables', 'Sí', 'Solo en el borde', 'Solo si son X'], 'Las celdas en diagonal no son vecinas.'),
        R('¿Qué expresión cubre los cuatro unos de las esquinas?', [X`\(\overline{B}\cdot\overline{D}\)`, X`\(\overline{A}\cdot\overline{C}\)`, X`\(B\cdot D\)`, 'No se agrupan: son 4 términos'], 'El mapa se enrolla: las cuatro esquinas son vecinas. En todas, B = 0 y D = 0.', { fig: mapa4([1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0], { mt: false }) }),
        R('Ya está el grupo de 8 (A). Para cubrir los unos que faltan, ¿puedo usar celdas que ya están en ese grupo?', ['Sí, si así el grupo sale más grande', 'No, cada celda va en un solo grupo', 'Solo si es una X', 'Solo en mapas de 3 variables'], X`Sí: conviene la columna completa \(C\cdot D\) aunque 2 celdas ya estén en el grupo de A.`, { una: true, fig: mapa4(Array.from({ length: 16 }, (_, m) => ((m & 8) || (m & 3) === 3 ? 1 : 0)), { grupos: [{ mask: 8, val: 8 }], mt: false }) })
      ]
    },
    // =========================================================
    {
      id: 'dis', n: 7, titulo: 'Diseño y aplicaciones', corto: 'Método en 6 pasos, bomba, alarma, display y más',
      teoria: [
        { t: 'El método en 6 pasos', h: '<ol class="rp-lista"><li><b>Entender el enunciado</b> y preguntar lo que falta.</li><li><b>Definir variables:</b> entradas, salidas y qué significa el 1.</li><li><b>Tabla de verdad:</b> ' + X`\(2^n\)` + ' filas; X donde no importa.</li><li><b>Mapa de Karnaugh:</b> agrupar y sacar la expresión mínima.</li><li><b>Circuito y chips:</b> contar compuertas y elegir los 74xx.</li><li><b>Simular y montar:</b> probar todas las combinaciones.</li></ol>' },
        { t: 'Alarma de incendio «2 de 3»', h: '<p>La sirena suena si alguien presiona el pulsador P, o si al menos dos de los tres detectores (humo A, humo B, temperatura T) se activan. Un solo detector puede ser una falsa alarma.</p><div class="rp-f">' + X`\[ F = P + A\cdot B + A\cdot T + B\cdot T \]` + '</div><p>En el mapa, los grupos de 4 de A·B, A·T y B·T <b>se pisan</b> con el grupo de 8 de P: por eso no queda ' + X`\(\overline{P}\cdot A\cdot B\)` + '.</p>' },
        { t: 'Bomba de agua con dos sensores', h: '<p>La bomba sube agua de la cisterna al tanque. Arranca cuando el agua baja del sensor bajo (Lb) y para al llegar al sensor alto (La). C = hay agua en la cisterna. La alarma F avisa una lectura imposible: agua arriba pero no abajo.</p>' +
          '<div class="rp-f">' + X`\[ M^{+} = C\cdot\overline{L_a}\cdot(\overline{L_b} + M) \]\[ F = \overline{L_b}\cdot L_a \]` + '</div>' +
          '<p>Entre los dos sensores la bomba sigue haciendo lo que hacía: necesita <b>memoria</b> (M vuelve a entrar). Un circuito solo combinacional no recuerda: ese es el paso a los circuitos secuenciales (flip-flops).</p>' },
        { w: 'bomba' },
        { t: 'Prensa con mando a dos manos', h: '<p>Baja solo con los dos botones: ' + X`\(Y = I\cdot D\)` + '. Pero si alguien traba un botón con cinta, la AND ya no exige las dos manos: las normas piden además presionar casi a la vez (tiempo y memoria).</p>' },
        { t: 'Decodificador BCD a 7 segmentos', h: '<p><b>4 entradas</b> (el dígito en BCD: A B C D = 8 4 2 1) y <b>7 salidas</b> (a, b, c, d, e, f, g). Cada segmento tiene su propio mapa de 4 variables; las combinaciones 10 a 15 nunca llegan y son X. El chip comercial es el 7448.</p>' +
          '<p>Display de ánodo común (enciende con 0): se invierte cada salida o se agrupan los ceros.</p>' },
        { w: 'display' },
        { t: 'Otras aplicaciones', h: '<p>El mismo método sirve para un ascensor (puerta cerrada, sin sobrepeso, piso pedido), un riego automático, un microondas, un portón eléctrico, el control de calidad de una cinta o la luz automática de un pasillo. En el ejercicio «Descubre la máquina» manipulas la máquina, armas la tabla y diseñas.</p>' }
      ],
      errores: [
        '«¿Cuántas salidas tiene un decodificador BCD a 7 segmentos?» la acertó solo el 40 % (12/10): son 7, una por segmento.',
        'Diseño completo: la tabla sale bien, pero la expresión no queda mínima por no solapar grupos.',
        'Dejar filas de la tabla sin llenar.'
      ],
      ejercicios: ['n9', 'p7', 'e5', 'p6', 'e3'],
      rapidas: [
        R('¿Cuántas entradas y cuántas salidas tiene un decodificador BCD a 7 segmentos?', ['4 entradas y 7 salidas', '7 entradas y 4 salidas', '4 entradas y 10 salidas', '1 entrada y 7 salidas'], 'Entran los 4 bits del dígito y sale una señal por segmento: a, b, c, d, e, f y g.', { una: true }),
        R('¿Por qué las combinaciones 10 a 15 son X en el decodificador BCD a 7 segmentos?', ['Porque nunca llegan en BCD', 'Porque encienden todo el display', 'Porque son errores del chip', 'Porque el display solo tiene 7 segmentos'], 'En BCD no existen los códigos 1010 a 1111: lo que salga ahí no importa.', { una: true }),
        R('El método de diseño en orden es…', ['Enunciado → variables → tabla → mapa → circuito → prueba', 'Circuito → tabla → mapa → enunciado', 'Tabla → circuito → mapa → prueba', 'Mapa → tabla → circuito → enunciado'], 'Dibujar compuertas es el último paso, no el primero.', { una: true }),
        R('Alarma «2 de 3» con pulsador: ' + X`\(F = P + A\cdot B + A\cdot T + B\cdot T\)` + '. Si solo se activa el detector A, ¿suena?', ['No', 'Sí', 'Solo si P = 0', 'Depende de T'], 'Con P = B = T = 0, todos los términos valen 0: un solo detector puede ser una falsa alarma.'),
        R('El tanque está a la mitad, la bomba apagada y la gente consume agua. ¿Cuándo arranca la bomba?', ['Cuando el agua baja del sensor bajo (Lb)', 'De inmediato', 'Cuando el agua baja del sensor alto (La)', 'Nunca, porque ya llenó'], 'Arranca recién cuando el agua baja de Lb y sigue hasta llegar a La.', { una: true }),
        R('Si el sensor alto se daña y queda siempre en 0, ¿qué pasa?', ['El tanque rebalsa', 'Suena la alarma F', 'La bomba no arranca', 'Nada, sigue normal'], 'Con La siempre en 0, la bomba nunca recibe la orden de parar: el tanque rebalsa y F no se entera.', { una: true }),
        R('La bomba arranca al bajar de Lb y para recién al llegar a La. Con el agua entre los dos sensores, ¿un circuito combinacional sabe qué hacer?', ['No: necesita recordar lo que estaba haciendo', 'Sí, con una AND', 'Sí, con una XOR', 'Sí, si se simplifica con Karnaugh'], 'Las entradas son las mismas al llenar y al vaciar: hace falta memoria (circuitos secuenciales).', { una: true }),
        R('Prensa con ' + X`\(Y = I\cdot D\)` + '. Con cinta en el botón I, ¿baja si presionas solo D?', ['Sí, baja', 'No, la AND lo impide', 'Solo si la guarda está cerrada', 'Depende del tiempo'], 'La cinta deja I = 1 para siempre: la AND ya no exige las dos manos.'),
        R('Tu display es de ánodo común: cada segmento se enciende con 0. ¿Qué haces con tu diseño?', ['Inviertes cada salida (o agrupas los ceros)', 'Rehaces todo desde cero', 'Nada', 'Cambias las entradas'], 'Basta un NOT por salida, o agrupar los ceros del mapa en vez de los unos.', { una: true })
      ]
    },
    // =========================================================
    {
      id: 'nand', n: 8, titulo: 'NAND: la compuerta universal', corto: 'Todo con NAND y cómo contarlas',
      teoria: [
        { t: 'Con NAND se arma todo', h: '<table class="rp-tab"><tr><th>Para hacer</th><th>NAND de 2 entradas</th></tr>' +
          '<tr><td>NOT</td><td>1 (entradas unidas): ' + X`\(\overline{A\cdot A} = \overline{A}\)` + '</td></tr>' +
          '<tr><td>AND</td><td>2 (NAND y luego NOT)</td></tr>' +
          '<tr><td>OR</td><td>3 (invertir A, invertir B y NAND): ' + X`\(\overline{\overline{A}\cdot\overline{B}} = A + B\)` + '</td></tr>' +
          '<tr><td>XOR</td><td>4 (un 7400 completo)</td></tr></table>' +
          '<p>Por eso la NAND se llama <b>universal</b>: con un solo tipo de compuerta se construye cualquier circuito. La NOR también es universal.</p>' },
        { t: 'AND → OR se convierte en NAND → NAND', h: '<p>Por De Morgan, una suma de productos pasa directo a NAND → NAND: se cambia cada AND por una NAND y la OR de salida por una NAND.</p>' +
          '<div class="rp-f">' + X`\[ A\cdot B + C\cdot D = \overline{\overline{A\cdot B}\cdot\overline{C\cdot D}} \]` + '</div>' + '<div class="rp-circ">' + D1.circ.svg(4, [[0, 2], [4, 6]], ['A', 'B', 'C', 'D'], { mono: true, t1: 'nand', t2: 'nand' }) + '</div>' +
          '<p>Así ' + X`\(A\cdot B + C\cdot D\)` + ' usa <b>3 NAND</b>: caben en un solo 7400.</p>' },
        { t: 'Cómo contar las NAND', h: '<ol class="rp-lista"><li>Una NAND por cada producto de 2 o más literales.</li><li>Una NAND (como inversor) por cada variable que aparece negada dentro de un producto.</li><li>Un término de <b>una sola variable</b> entra <b>negado</b> a la NAND de salida: C necesita una NAND inversora; ' + X`\(\overline{C}\)` + ' entra directo.</li><li>Una NAND de salida.</li></ol>' +
          '<div class="rp-ejm">' + X`\(F = A\cdot B + C\)` + ': NAND para ' + X`\(A\cdot B\)` + ', NAND inversora para ' + X`\(\overline{C}\)` + ' y NAND de salida: ' + X`\(\overline{\overline{A\cdot B}\cdot\overline{C}} = A\cdot B + C\)` + '. <b>Total 3.</b></div>' }
      ],
      errores: [
        'Solo con NAND: en el ejercicio del 15/10, 7 de 14 lo hicieron perfecto; «¿cuántas NAND para AB + CD?» la acertó el 64 %.',
        'Olvidar que un término de una sola variable entra negado a la NAND de salida.',
        '«XOR con NAND» (4 compuertas) la acertó el 71 % (16/10).'
      ],
      ejercicios: ['p8'],
      rapidas: [
        R('¿Cuántas NAND de 2 entradas hacen falta para un NOT, para una AND y para una OR?', ['1; 2; 3', '1; 1; 1', '2; 2; 3', '1; 2; 2'], 'NOT = NAND con entradas unidas; AND = NAND + NOT; OR = dos NOT + NAND.', { una: true }),
        R('¿Por qué la NAND se llama compuerta universal?', ['Con solo NAND se arman NOT, AND y OR', 'Porque es la más rápida', 'Porque trae 4 por chip', 'Porque no necesita alimentación'], 'Con NOT, AND y OR se arma cualquier circuito.', { una: true }),
        R(X`\(Y = A\cdot B + C\cdot D\)` + ' usando solo NAND de 2 entradas: ¿cuántas compuertas?', ['3', '2', '4', '6'], 'Dos NAND para los productos y una NAND a la salida. Caben en un 7400.'),
        R(X`\(F = A\cdot B + C\)` + ' usando solo NAND de 2 entradas: ¿cuántas compuertas?', ['3', '2', '4', '5'], X`Una NAND para \(A\cdot B\), una inversora para \(\overline{C}\) y la de salida.`),
        R('¿Cuántas NAND de 2 entradas hacen falta para armar una XOR?', ['4', '2', '3', '5'], 'Cuatro: un 7400 completo.'),
        R('Un circuito NAND → NAND hace lo mismo que…', ['AND → OR', 'OR → AND', 'AND → AND', 'OR → OR'], 'Por De Morgan, las dos barras de cada producto se cancelan.'),
        R('Una NAND con sus dos entradas unidas hace…', ['un NOT', 'una AND', 'un cable', 'un 1 fijo'], X`\(\overline{A\cdot A} = \overline{A}\).`),
        R('En un circuito NAND → NAND, un término de una sola variable C entra a la NAND de salida…', [X`negado: \(\overline{C}\)`, 'tal cual: C', 'no entra', 'por duplicado'], X`La NAND de salida niega lo que recibe: para que aporte C debe recibir \(\overline{C}\).`, { una: true })
      ]
    },
    // =========================================================
    {
      id: 'xor', n: 9, titulo: 'XOR y paridad', corto: 'XOR, XNOR, bit de paridad y detección de errores',
      teoria: [
        { t: 'XOR y XNOR', h: '<div class="rp-f">' + X`\[ A \oplus B = \overline{A}\cdot B + A\cdot\overline{B} \]` + '</div><p>La XOR da 1 si las entradas son <b>distintas</b>; la XNOR, si son <b>iguales</b>. Sirve para la luz de la escalera (mover cualquier interruptor cambia la luz). Chip: 7486.</p>' +
          '<div class="rp-f">' + X`\[ A \oplus 0 = A \qquad A \oplus 1 = \overline{A} \]` + '</div><p><b>Inversor controlado:</b> con la otra entrada decides si la señal pasa tal cual o invertida.</p>' +
          '<p>La XOR de muchos bits vale 1 si la cantidad de unos es <b>impar</b>. En el mapa de Karnaugh la paridad queda como un tablero de ajedrez: no se puede agrupar nada.</p>' },
        { w: 'tiempos' },
        { t: 'Bit de paridad: generar y comprobar', h: '<p>Un bit puede cambiar en el cable por ruido. Para detectarlo, el emisor agrega un <b>bit de paridad P</b>.</p>' +
          '<p><b>Paridad par:</b></p><div class="rp-f">' + X`\[ P = D_1 \oplus D_2 \oplus \cdots \oplus D_n \]` + '</div>' +
          '<p>Con paridad par, el total de unos (datos y P) queda par. Con paridad impar, P es el contrario.</p>' +
          '<p><b>Comprobador</b> (si E = 1, hay error):</p><div class="rp-f">' + X`\[ E = D_1 \oplus \cdots \oplus D_n \oplus P \]` + '</div>' +
          '<div class="rp-ejm">Paridad par. Dato ' + b('1011001') + ': tiene 4 unos → P = 0. Si llega ' + b('1001001') + ' con P = 0: hay 3 unos → E = 1, error detectado.</div>' +
          '<p>Detecta una cantidad <b>impar</b> de errores (1, 3, 5…). Con 2 o 4 errores los cambios se tapan y E = 0. No dice qué bit falló.</p>' },
        { w: 'paridad' },
        { t: 'Cadena o árbol', h: '<p>Para n bits hacen falta siempre ' + X`\(n - 1\)` + ' XOR de 2 entradas. En <b>cadena</b> la señal pasa por n − 1 niveles; en <b>árbol</b>, de a pares, por ' + X`\(\log_2 n\)` + ' niveles (8 bits: 7 XOR y 3 niveles): responde más rápido.</p>' },
        { t: 'Paridad en filas y columnas', h: '<p>Si los datos se ordenan en un bloque y se agrega paridad a cada fila y a cada columna, un bit dañado hace fallar <b>una fila y una columna</b>: el bit está en el cruce, y se puede corregir.</p>' },
        { w: 'bloque' },
        { t: 'Aplicación: la trama UART', h: '<p>En una comunicación serie (UART) se envía: bit de inicio, 8 bits de datos, bit de paridad y bit de parada. El receptor recalcula la paridad para saber si la trama llegó bien.</p>' }
      ],
      errores: [
        'OR frente a XOR, inversor controlado y XOR con NAND: cada una la acertó el 71 % (16/10).',
        'Creer que la paridad detecta dos errores: dos cambios se tapan y E = 0.',
        'Contar mal los unos: cuenta dos veces antes de decidir P.'
      ],
      ejercicios: ['n10', 'p9', 'p10', 'p11'],
      rapidas: [
        R('¿En qué fila dan distinto la OR y la XOR?', ['A = 1, B = 1', 'A = 0, B = 0', 'A = 0, B = 1', 'A = 1, B = 0'], 'Solo con las dos entradas en 1: la OR da 1 y la XOR da 0.'),
        R('Una XOR con una entrada fija en 1 se comporta como…', ['un NOT', 'una AND', 'un cable', 'un 1 fijo'], X`\(A \oplus 1 = \overline{A}\).`),
        R('La XNOR da 1 cuando…', ['las entradas son iguales', 'las entradas son distintas', 'las dos entradas son 1', 'alguna entrada es 1'], 'XNOR = XOR invertida: detecta igualdad.'),
        R('Paridad par: el dato ' + b('11010110') + ', ¿qué bit de paridad P lleva?', ['1', '0', '5', 'Depende del primer bit'], 'El dato tiene 5 unos (impar): P = 1 para que el total quede par.'),
        R('Con un solo bit de paridad, ¿qué errores detecta el receptor?', ['Una cantidad impar de bits dañados', 'Cualquier cantidad de bits dañados', 'Solo cuando fallan 2 bits', 'Ninguno: solo los corrige'], 'Cada bit dañado cambia la paridad: 1 o 3 errores dan E = 1; 2 o 4 se tapan.', { una: true }),
        R('Paridad par. Se envió el dato ' + b('1011') + ' con P = 1 y llegó el dato ' + b('1000') + ' con P = 1 (fallaron dos bits). ¿El comprobador lo detecta?', ['No: E = 0', 'Sí: E = 1', 'Sí, y dice qué bits fallaron', 'Depende del primer bit'], 'Llegaron dos unos en total: la paridad sigue par y E = 0. Dos errores se tapan.', { una: true }),
        R('Trama UART con paridad par: datos ' + b('01101010') + ' y bit de paridad 1. ¿Llegó bien?', ['No: hay un error', 'Sí, llegó bien', 'No se puede saber', 'Solo si el bit de parada es 0'], 'Los datos tienen 4 unos y P = 1: en total 5, impar. Con paridad par eso es un error.', { una: true }),
        R('Paridad de 8 bits armada en árbol: ¿cuántas XOR de 2 entradas y cuántos niveles?', ['7 XOR y 3 niveles', '8 XOR y 3 niveles', '7 XOR y 7 niveles', '4 XOR y 2 niveles'], 'Siempre n − 1 = 7 XOR; en árbol se juntan de a pares: 4, 2 y 1, que son 3 niveles.', { una: true }),
        R('En un mapa de 4 variables pongo 1 donde la cantidad de unos de ABCD es impar. ¿Cuántos grupos tiene la expresión mínima?', ['8', '4', '2', '1'], 'Ocho grupos de una sola celda: tablero de ajedrez. Dos vecinas nunca tienen la misma paridad.'),
        R('Paridad en filas y columnas: falla un bit del bloque. ¿Cómo se encuentra?', ['En el cruce de la fila y la columna con error', 'Revisando solo la fila', 'No se puede encontrar', 'Repitiendo el envío'], 'Ese bit hace fallar una fila y una columna: está en el cruce y se puede corregir.', { una: true })
      ]
    }
  ];
  D1.REPASO = { TEMAS };
})();
