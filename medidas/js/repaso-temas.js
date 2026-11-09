// ============================================================
// Medidas Eléctricas — Repaso para el 2.º parcial (09/11/2026)
//   FP.REPASO.TEMAS: los 7 temas vistos desde el lunes 05/10, con su teoría
//   (rescatada de las clases me-fp1, me-planta, me-vatimetro y me-tierra, hasta
//   el paso 13 de puesta a tierra), los diagramas para manipular, los errores
//   típicos con los datos reales de la base, los ejercicios y las preguntas.
//   Datos de «Errores típicos»: respuestas de las sesiones me- (consulta del 09/11).
// ============================================================
(function () {
  'use strict';
  const FP = window.FP;
  const X = String.raw;
  const D = (s) => '<div class="rp-f">\\[' + s + '\\]</div>';
  const R = (t, o, por, extra) => Object.assign({ t, o, por }, extra || {});
  const ejm = (titulo, html) => '<div class="rp-ejm"><b>' + titulo + '</b> ' + html + '</div>';

  const TEMAS = [
    // =========================================================
    {
      id: 'ca', n: 1, titulo: 'Corriente alterna y potencia', corto: 'Desfase; potencia instantánea; P, Q, S y el triángulo',
      teoria: [
        { t: 'Adelanto y retraso de la corriente', h: X`<p>En corriente alterna la tensión y la corriente son senoidales de 50 Hz, pero no siempre suben y bajan juntas. El ángulo entre ellas es el <b>desfase</b> \(\varphi\).</p>
          <ul class="rp-lista"><li><b>Resistencia</b> (estufa, foco incandescente): la corriente va en fase; \(\varphi = 0\).</li><li><b>Carga inductiva</b> (motores, transformadores, balastos): la corriente se <b>atrasa</b>.</li><li><b>Carga capacitiva</b> (capacitores, algunas fuentes): la corriente se <b>adelanta</b>.</li></ul>` },
        { w: 'fasores', opc: { inicial: { phi: 37 } }, nota: 'Mueve el desfase: a la derecha la corriente se atrasa (inductiva); a la izquierda se adelanta (capacitiva).' },
        { t: 'Potencia instantánea y potencia activa', h: X`<p>En cada instante la carga recibe \(p(t) = v(t)\cdot i(t)\). Esa potencia oscila al doble de la frecuencia (100 Hz) y, si hay desfase, tiene tramos negativos: la carga devuelve energía a la red.</p>
          <p>La potencia que hace trabajo útil es el <b>promedio</b> de \(p(t)\): la potencia activa \(P\).</p>` + D(X`P = \dfrac{1}{T}\int_0^T v(t)\,i(t)\,dt = V\cdot I\cdot\cos\varphi`) + X`<p>\(V\) e \(I\) son valores <b>eficaces</b>. Con \(\varphi = 90^\circ\) (bobina ideal) el promedio es cero: hay corriente, pero no se hace trabajo.</p>` },
        { w: 'potencia', opc: { inicial: { phi: 60 } }, nota: 'Mueve el desfase y mira el área positiva y la negativa de p(t). Con 90° se cancelan.' },
        { t: 'Las tres potencias y el triángulo', h: `<table class="rp-tab"><tr><th>Potencia</th><th>Fórmula</th><th>Unidad</th></tr><tr><td>Activa (hace trabajo)</td><td>${X`\(P = V I\cos\varphi\)`}</td><td>W</td></tr><tr><td>Reactiva (va y vuelve)</td><td>${X`\(Q = V I\operatorname{sen}\varphi\)`}</td><td>VAR</td></tr><tr><td>Aparente (la que ve la red)</td><td>${X`\(S = V I\)`}</td><td>VA</td></tr></table>` +
          D(X`S^2 = P^2 + Q^2`) + D(X`FP = \dfrac{P}{S} = \cos\varphi`) + X`<p>En trifásico se multiplica por \(\sqrt{3}\) con valores de línea: \(P = \sqrt{3}\,V_L I_L\cos\varphi\).</p>` +
          ejm('Ejemplo resuelto.', X`Una carga de \(S = 50\ \text{kVA}\) con \(FP = 0{,}8\) inductivo: \(P = 50\cdot 0{,}8 = 40\ \text{kW}\); \(\varphi = \arccos 0{,}8 = 36{,}9^\circ\); \(Q = 50\cdot\operatorname{sen} 36{,}9^\circ = 30\ \text{kVAR}\).`) },
        { w: 'triangulo', opc: { inicial: { P: 40, Q: 30 } }, nota: 'Mueve P y Q y mira cómo cambian S y el FP. ¿Qué pasa con el FP si Q sube y P queda igual?' }
      ],
      errores: [
        X`Con la bobina ideal (\(\varphi = 90^\circ\)) la potencia activa es <b>cero</b>: en clase lo acertó el 64 % (7 de 11). Dos eligieron «máxima» y dos «negativa»: el área negativa de \(p(t)\) se cancela con la positiva.`,
        X`«La corriente de un motor se atrasa»: la acertaron los 11 (100 %).`,
        X`Ejercicio «Construye el triángulo de tu carga»: promedio 6,4 de 10 (11 estudiantes). El error típico fue usar \(Q = S\cdot FP\) en vez de \(Q = S\cdot\operatorname{sen}\varphi\).`,
        X`El FP no se suma ni se promedia: se calculan \(P\) y \(Q\) y después \(FP = P/S\).`
      ],
      ejercicios: ['c1', 'n1', 'n2'],
      rapidas: [
        R('Un motor es una carga inductiva. Su corriente, respecto de la tensión…', ['se atrasa', 'se adelanta', 'está en fase', 'depende de la carga mecánica'], 'En una bobina la corriente se atrasa respecto de la tensión. Los motores son inductivos.'),
        R(X`Si la corriente se atrasa \(90^\circ\) (bobina ideal), la potencia promedio \(P\) es…`, ['cero', 'máxima', X`la mitad de \(V\cdot I\)`, 'negativa'], X`\(P = VI\cos 90^\circ = 0\). La energía va y vuelve: el área positiva y la negativa de \(p(t)\) son iguales.`),
        R(X`¿En qué unidad se expresa la potencia reactiva \(Q\)?`, ['VAR', 'W', 'VA', 'kWh'], X`\(P\) en W, \(Q\) en VAR y \(S\) en VA. Las energías se cobran en kWh y kVARh.`),
        R(X`Una carga tiene \(P = 30\ \text{kW}\) y \(Q = 40\ \text{kVAR}\). Su FP es…`, [X`\(0{,}6\)`, X`\(0{,}75\)`, X`\(0{,}8\)`, X`\(1{,}33\)`], X`\(S = \sqrt{30^2 + 40^2} = 50\ \text{kVA}\); \(FP = 30/50 = 0{,}6\).`),
        R(X`Una estufa (resistencia pura) de 2 kW. ¿Cuánto valen \(Q\) y el FP?`, [X`\(Q = 0\); \(FP = 1\)`, X`\(Q = 2\ \text{kVAR}\); \(FP = 0{,}5\)`, X`\(Q = 0\); \(FP = 0\)`, 'no se puede saber sin la corriente'], 'En una resistencia la corriente está en fase: no hay reactiva y el FP es 1.'),
        R(X`¿Con qué frecuencia oscila la potencia instantánea \(p(t)\) en una red de 50 Hz?`, ['100 Hz', '50 Hz', '25 Hz', 'no oscila'], X`\(p = v\cdot i\): el producto de dos senoidales de 50 Hz oscila al doble, 100 Hz.`),
        R('La corriente de un capacitor, respecto de la tensión…', ['se adelanta 90°', 'se atrasa 90°', 'está en fase', 'se atrasa 45°'], 'En un capacitor la corriente se adelanta. Por eso un capacitor «entrega» la reactiva que pide un motor.')
      ]
    },
    // =========================================================
    {
      id: 'fpbajo', n: 2, titulo: 'Por qué importa un FP bajo', corto: 'Más corriente, más pérdidas, el transformador al límite',
      teoria: [
        { t: 'Con el mismo trabajo, más corriente', h: X`<p>La potencia útil \(P\) la decide la carga. Si el FP baja, la red tiene que mandar <b>más corriente</b> para entregar la misma \(P\):</p>` + D(X`I = \dfrac{P}{\sqrt{3}\cdot V_L\cdot FP}`) +
          X`<p>Esa corriente extra calienta los cables y el transformador aunque no haga trabajo útil.</p>` + ejm('Ejemplo.', X`Una carga de 50 kW pasa de \(FP = 1\) a \(FP = 0{,}7\): la corriente se multiplica por \(1/0{,}7 = 1{,}43\); sube cerca de 43 %.`) },
        { t: 'Las pérdidas suben con el cuadrado', h: X`<p>Las pérdidas en un cable de resistencia \(R\) por fase son:</p>` + D(X`P_p = 3\cdot I^2\cdot R`) + X`<p>Como \(I\) es proporcional a \(1/FP\), las pérdidas van con \(1/FP^2\): con \(FP = 0{,}7\) son el doble que con \(FP = 1\) (\(1/0{,}7^2 = 2{,}04\)). También aumenta la caída de tensión.</p>` },
        { w: 'linea', opc: { inicial: { P: 50, fp: 0.7 } }, nota: 'Mueve el FP: mira el grosor del cable (corriente), las pérdidas y la carga del transformador de 75 kVA.' },
        { t: 'El transformador se llena de kVA, no de kW', h: X`<p>Un transformador se elige por su potencia aparente \(S_n\) (kVA), porque lo limita la corriente. La potencia activa que puede dar depende del FP:</p>` + D(X`P_{max} = S_n\cdot FP`) +
          ejm('Caso «transformador al límite».', X`Transformador de 75 kVA. Con \(FP = 0{,}7\) solo da \(75\cdot 0{,}7 = 52{,}5\ \text{kW}\); con \(FP = 0{,}95\), \(71{,}3\ \text{kW}\). Mejorar el FP «libera» capacidad sin cambiar el transformador.`) +
          '<p><b>FP mínimo para un cable:</b> si el cable soporta ' + X`\(I_{max}\)` + ', despejando:</p>' + D(X`FP_{min} = \dfrac{P}{\sqrt{3}\cdot V_L\cdot I_{max}}`) }
      ],
      errores: [
        X`«Una carga de 50 kW pasa de FP 1 a 0,7: la corriente…»: la acertó el 73 % (8 de 11). Dos eligieron «sube 70 %»: no es la diferencia \(1 - 0{,}7\), es el cociente \(1/0{,}7 = 1{,}43\).`,
        X`Ejercicio «FP mínimo para tu cable»: promedio 5,9 de 10 (11 estudiantes). Error típico: olvidar el \(\sqrt{3}\) o usar la tensión de fase.`,
        'Las pérdidas no suben igual que la corriente: suben con su cuadrado.'
      ],
      ejercicios: ['c2', 'n3', 'n4'],
      rapidas: [
        R('Una carga de 50 kW pasa de FP 1 a FP 0,7. La corriente…', ['sube cerca de 43 %', 'no cambia', 'baja 30 %', 'sube 70 %'], X`\(I \propto 1/FP\): \(1/0{,}7 = 1{,}43\).`),
        R('Si el FP de una carga baja de 1 a 0,7 con la misma P, las pérdidas en el cable…', ['casi se duplican', 'suben 30 %', 'no cambian', 'bajan'], X`Las pérdidas van con \(I^2\), es decir con \(1/FP^2\): \(1/0{,}49 = 2{,}04\).`),
        R('¿Por qué un transformador se especifica en kVA y no en kW?', ['porque lo limita la corriente, que depende de S', 'porque así es más barato', 'porque no consume energía', 'porque solo alimenta motores'], 'El calentamiento depende de la corriente, y la corriente depende de la potencia aparente S, sea cual sea el FP.', { una: true }),
        R(X`Un transformador de 100 kVA alimenta cargas con \(FP = 0{,}6\). ¿Cuánta potencia activa puede dar como máximo?`, ['60 kW', '100 kW', '166 kW', '40 kW'], X`\(P_{max} = S_n\cdot FP = 100\cdot 0{,}6 = 60\ \text{kW}\).`),
        R('Mejorar el FP de una planta, ¿reduce la potencia activa que consume?', ['No: P es la misma; bajan Q, S y la corriente', 'Sí, a la mitad', 'Sí, baja tanto como Q', 'No, y además sube la corriente'], 'Los capacitores no cambian el trabajo de las máquinas: solo dejan de pedir reactiva a la red.', { una: true }),
        R(X`¿Qué fórmula da la corriente de línea de una carga trifásica?`, [X`\(I = \dfrac{P}{\sqrt{3}\,V_L\,FP}\)`, X`\(I = \dfrac{P}{V_L\,FP}\)`, X`\(I = \dfrac{P\,FP}{\sqrt{3}\,V_L}\)`, X`\(I = \dfrac{\sqrt{3}\,P}{V_L}\)`], X`De \(P = \sqrt{3}\,V_L\,I_L\cos\varphi\) se despeja \(I_L\).`)
      ]
    },
    // =========================================================
    {
      id: 'vat2', n: 3, titulo: 'Potencia trifásica con dos vatímetros', corto: 'Blondel; conexión Aron; del par de lecturas al FP',
      teoria: [
        { t: 'Teorema de Blondel y conexión Aron', h: X`<p>Con \(n\) conductores bastan \(n - 1\) vatímetros. En una red de 3 hilos alcanzan <b>dos vatímetros</b> (conexión Aron); con neutro (4 hilos) hacen falta tres.</p>
          <ul class="rp-lista"><li>Cada bobina de corriente va en serie con su línea (L1 y L3).</li><li>Cada bobina de tensión va entre su línea y la <b>línea común</b> (L2).</li><li>La suma de las dos lecturas es la potencia total, con carga equilibrada o no. Cada lectura sola no significa nada.</li></ul>` + D(X`P = W_1 + W_2`) },
        { t: 'Del par de lecturas al FP (carga equilibrada)', h: D(X`W_1 = V_L I_L\cos(30^\circ + \varphi)`) + D(X`W_2 = V_L I_L\cos(30^\circ - \varphi)`) + D(X`\tan\varphi = \dfrac{\sqrt{3}\,(W_2 - W_1)}{W_1 + W_2}`) + D(X`Q = \sqrt{3}\,(W_2 - W_1)`) +
          `<table class="rp-tab"><tr><th>FP</th><th>Lecturas</th></tr><tr><td>1</td><td>${X`\(W_1 = W_2\)`}</td></tr><tr><td>0,5</td><td>${X`\(W_1 = 0\)`}</td></tr><tr><td>menor que 0,5</td><td>${X`\(W_1 < 0\)`}: la aguja va al revés; se invierte su bobina de tensión y la lectura se <b>resta</b></td></tr></table>` },
        { w: 'vatimetros', opc: { inicial: { fp: 0.8 } }, nota: 'Mueve el FP y mira cómo se separan las dos lecturas. Busca el FP en que W1 marca cero.' },
        { t: 'Ejemplo resuelto', h: ejm('Motor trifásico a 380 V.', X`La lectura del vatímetro W1 es 2,24 kW y la del W2, 5,66 kW.`) + D(X`P = 2{,}24 + 5{,}66 = 7{,}90\ \text{kW}`) + D(X`\tan\varphi = \dfrac{1{,}732\cdot 3{,}42}{7{,}90} = 0{,}750`) + D(X`\varphi = 36{,}9^\circ \;\Rightarrow\; FP = 0{,}80`) + D(X`Q = 1{,}732\cdot 3{,}42 = 5{,}92\ \text{kVAR}`) + D(X`I = \dfrac{7\,900}{1{,}732\cdot 380\cdot 0{,}8} = 15\ \text{A}`) }
      ],
      errores: [
        X`«Con FP = 0,5, uno de los dos vatímetros marca…»: la acertó el 57 % (4 de 7). Dos eligieron «el doble del otro»: con \(\varphi = 60^\circ\), \(W_1 = V_L I_L\cos 90^\circ = 0\).`,
        X`Ejercicio «FP con dos vatímetros»: promedio 5,7 de 10 (7 estudiantes). Error típico: poner \(W_1 - W_2\) en vez de \(W_2 - W_1\) o olvidar el \(\sqrt{3}\).`,
        'Si una aguja va al revés no se cambia el signo en la hoja sin más: se invierte la bobina de tensión y esa lectura se resta.'
      ],
      ejercicios: ['c3', 'n5', 'n6'],
      rapidas: [
        R('Con FP = 0,5, uno de los dos vatímetros marca…', ['cero', 'el doble del otro', 'lo mismo que el otro', 'la potencia total'], X`Con \(\varphi = 60^\circ\): \(W_1 = V_L I_L\cos 90^\circ = 0\).`),
        R('¿Cuántos vatímetros hacen falta para medir la potencia de una red trifásica de 4 hilos (con neutro)?', ['3', '2', '1', '4'], X`Blondel: con \(n\) conductores, \(n - 1\) vatímetros. Con 4 hilos, 3.`),
        R('En conexión Aron, las dos lecturas son iguales. La carga es…', ['resistiva (FP = 1)', 'inductiva pura', 'de FP 0,5', 'capacitiva pura'], X`Con \(\varphi = 0\): \(\cos 30^\circ = \cos(-30^\circ)\), las dos lecturas son iguales.`),
        R(X`Las lecturas son \(W_1 = 2\ \text{kW}\) y \(W_2 = 6\ \text{kW}\). La potencia activa total es…`, ['8 kW', '4 kW', '6 kW', '12 kW'], X`\(P = W_1 + W_2 = 8\ \text{kW}\), sea cual sea el FP.`),
        R('La carga tiene FP = 0,3 inductivo. ¿Qué pasa con W1?', ['marca negativo: se invierte su bobina de tensión y se resta', 'marca cero', 'marca más que W2', 'nada: es igual a W2'], X`Con FP menor que 0,5, \(30^\circ + \varphi > 90^\circ\) y el coseno es negativo.`, { una: true }),
        R(X`¿Qué da \(\sqrt{3}\,(W_2 - W_1)\) en conexión Aron con carga equilibrada?`, ['la potencia reactiva Q', 'la potencia activa P', 'la potencia aparente S', 'el factor de potencia'], X`\(W_2 - W_1 = V_L I_L\operatorname{sen}\varphi\); multiplicado por \(\sqrt{3}\) da \(Q\).`)
      ]
    },
    // =========================================================
    {
      id: 'corr', n: 4, titulo: 'Corrección del factor de potencia', corto: 'Cuántos kVAR, cuántos µF, dónde y qué no hacer',
      teoria: [
        { t: 'El capacitor entrega la reactiva en el sitio', h: X`<p>Un banco de capacitores <b>en paralelo</b> con la carga entrega la potencia reactiva que pedía el motor. La carga sigue igual (\(P\) no cambia), pero la red ya no transporta esa \(Q\): bajan \(S\), la corriente y las pérdidas.</p>` +
          D(X`Q_c = P\,(\tan\varphi_1 - \tan\varphi_2)`) + D(X`\tan\varphi = \dfrac{\sqrt{1 - FP^2}}{FP};\;\; FP = 0{,}95 \Rightarrow \tan\varphi = 0{,}329`) +
          '<p>Los bancos vienen en <b>pasos</b>: se redondea hacia arriba.</p>' +
          ejm('Ejemplo resuelto (planta de lácteos, de día).', X`\(P = 80\ \text{kW}\), \(Q = 77{,}2\ \text{kVAR}\) → \(\tan\varphi_1 = 0{,}964\). \(Q_c = 80\,(0{,}964 - 0{,}329) = 50{,}8\ \text{kVAR}\) → con pasos de 10 kVAR, 6 pasos. La corriente baja de 169 A a 124 A.`) },
        { w: 'corrector', opc: { params: { P: 80, q: 10, N: 12, fp1: 0.72 }, inicial: { pasos: 0, fp1: 0.72 } }, nota: 'Agrega pasos de uno en uno: ¿con 5 o con 6 se pasa de 0,95? Sigue agregando y mira cuándo se vuelve capacitivo.' },
        { t: 'De kVAR a microfaradios', h: X`<p>En <b>triángulo</b> cada capacitor ve la tensión de línea; en <b>estrella</b>, \(V_L/\sqrt{3}\). Por eso en triángulo hacen falta <b>3 veces menos µF</b>.</p>` +
          D(X`C_\Delta = \dfrac{Q_c}{3\cdot\omega\cdot V_L^2}`) + D(X`C_Y = 3\cdot C_\Delta;\;\; \omega = 2\pi\cdot 50 = 314{,}16\ \text{rad/s}`) + D(X`I_c = \dfrac{Q_c}{\sqrt{3}\cdot V_L};\;\; \text{contactor} \approx 1{,}43\cdot I_c`) +
          ejm('Ejemplo.', X`50 kVAR a 380 V: \(C_\Delta = 50\,000/(3\cdot 314{,}16\cdot 380^2) = 367\ \mu\text{F}\) por fase; \(I_c = 76\ \text{A}\).`) },
        { t: 'Más cargas, menos cargas', h: X`<p>Para el FP de una instalación <b>se suman las P y las Q</b> de cada carga; <b>nunca los FP</b>. El FP cambia con el turno: en la planta de lácteos fue 0,72 de día, 0,78 al almuerzo y 0,80 de noche.</p>
          <p>Un <b>motor poco cargado</b> tiene peor FP: su reactiva (la que magnetiza) casi no cambia, pero su \(P\) baja.</p>` },
        { t: 'Sobrecompensar, dónde compensar y seguridad', h: X`<ul class="rp-lista"><li><b>Banco fijo de noche:</b> si quedan 60 kVAR conectados con solo 15 kW de carga, el FP pasa a capacitivo (0,29 en la planta) y la corriente <b>sube</b>; además sube la tensión. Por eso se usa un banco <b>automático</b> que conecta los pasos según la carga.</li>
          <li><b>Individual</b> (en el motor): alivia el cable de ese motor; \(Q_c \leq 0{,}9\) de la reactiva del motor en vacío. <b>Por grupos</b> o <b>central</b> (en el tablero general): solo alivia lo que está aguas arriba del banco.</li>
          <li>Los capacitores guardan carga: llevan resistencias de descarga; esperar antes de tocarlos.</li></ul>` }
      ],
      errores: [
        X`«Más capacitores de los necesarios…»: la acertó el 71 % (5 de 7): el FP pasa a capacitivo y la tensión sube.`,
        X`«¿En qué turno el FP de la planta es peor?»: solo el 56 % (5 de 9). Tres eligieron «al almuerzo»: se suman P y Q de las cargas que funcionan; de día el homogeneizador poco cargado empeora todo.`,
        X`«Un motor de 75 kW trabajando a 30 kW, su FP…»: el 67 % (6 de 9). Tres eligieron «mejora»: con poca carga el FP <b>empeora</b>.`,
        X`Ejercicio «Corrige tu planta a 0,95»: promedio 6,6 de 10 (7 estudiantes). Error típico: no redondear los pasos hacia arriba o usar FP en vez de \(\tan\varphi\).`
      ],
      ejercicios: ['c4', 'n7', 'n8'],
      rapidas: [
        R('Si conectas más capacitores de los necesarios…', ['el FP se vuelve capacitivo y la tensión sube', 'el FP sube por encima de 1', 'el motor gira más rápido', 'no pasa nada: sobra'], 'Con exceso de capacitores la instalación entrega reactiva a la red: FP capacitivo, más corriente y sobretensión.', { una: true }),
        R('En una planta funcionan a la vez cargas con distinto FP. ¿Cómo se obtiene el FP total?', ['sumando P y Q de todas y calculando P/S', 'promediando los FP', 'sumando los FP', 'tomando el peor FP'], 'El FP no se suma ni se promedia: P y Q sí se suman.', { una: true }),
        R('Un motor de 75 kW trabaja a 30 kW. Comparado con trabajar a plena carga, su FP…', ['empeora', 'mejora', 'no cambia', 'se vuelve capacitivo'], 'Su reactiva de magnetización casi no cambia y su P baja: el FP baja.'),
        R('El electricista deja 60 kVAR conectados fijos. De noche (solo 15 kW de carga), la corriente del transformador…', ['sube', 'baja a cero', 'baja un poco', 'no cambia'], 'Sobra mucha reactiva capacitiva: S y la corriente suben (FP 0,29 capacitivo en la planta).'),
        R('El banco está en el tablero general. ¿Baja la corriente en el cable que va al motor más grande?', ['no, sigue igual', 'sí, a la mitad', 'sí, igual que en el transformador', 'sube'], 'El banco solo alivia lo que está aguas arriba de él. Para aliviar ese cable hay que compensar en el motor.', { una: true }),
        R('Para el mismo paso de 10 kVAR a 380 V, conectado en estrella en vez de triángulo, cada capacitor necesita…', ['3 veces más µF', 'la misma capacidad', '3 veces menos µF', X`\(\sqrt{3}\) veces más µF`], X`En estrella cada capacitor ve \(V_L/\sqrt{3}\): \(Q \propto V^2\), así que necesita 3 veces más capacidad.`),
        R(X`Una planta de 100 kW tiene \(\tan\varphi_1 = 1\). Para llegar a \(FP = 0{,}95\) (\(\tan\varphi_2 = 0{,}329\)) se necesitan…`, ['67,1 kVAR', '95 kVAR', '32,9 kVAR', '100 kVAR'], X`\(Q_c = 100\cdot(1 - 0{,}329) = 67{,}1\ \text{kVAR}\).`)
      ]
    },
    // =========================================================
    {
      id: 'fact', n: 5, titulo: 'La factura y los armónicos', corto: 'Recargo por FP bajo; cosfímetro frente al FP verdadero',
      teoria: [
        { t: 'Cómo cobra la distribuidora', h: X`<p>El medidor registra la energía activa (kWh) y la reactiva (kVARh) del mes. El FP del mes sale de esas dos lecturas:</p>` + D(X`FP = \dfrac{\text{kWh}}{\sqrt{\text{kWh}^2 + \text{kVARh}^2}}`) +
          X`<p>Con la regla de ELFEC (Cochabamba), si el FP es menor que 0,85 se cobra un recargo sobre el cargo base. (La regla de CESSA en Sucre no se encontró publicada.)</p>` + D(X`\text{Recargo} = \text{cargo}\cdot\left(\dfrac{0{,}85}{FP} - 1\right)`) +
          ejm('Ejemplo.', X`12 480 kWh y 10 950 kVARh: \(FP = 12\,480/\sqrt{12\,480^2 + 10\,950^2} = 0{,}752\). Con un cargo de Bs 9 860: recargo \(= 9\,860\cdot(0{,}85/0{,}752 - 1) = \text{Bs}\ 1\,285\).`) },
        { w: 'factura', opc: { params: { cargo: 9860 }, inicial: { kwh: 12480, kvarh: 10950 } }, nota: 'Mueve la energía reactiva: ¿cuántos kVARh puede tener el mes sin pagar recargo?' },
        { t: 'Armónicos: el cosfímetro no ve todo', h: X`<p>Variadores, fuentes de computadora, LED y equipos médicos toman corriente <b>deformada</b>: además de la fundamental de 50 Hz tienen armónicos. Se mide con el THD de corriente.</p>
          <ul class="rp-lista"><li>El <b>cosfímetro</b> solo mide el desfase de la fundamental: \(\cos\varphi_1\).</li><li>El <b>FP verdadero</b> (\(P/S\)) además baja por la distorsión.</li></ul>` +
          D(X`FP = \cos\varphi_1\cdot\dfrac{1}{\sqrt{1 + THD^2}}`) + ejm('Ejemplo.', X`Fuente de PC sin PFC: el cosfímetro marca 0,99 y el THD es 110 %. \(FP = 0{,}99/\sqrt{1 + 1{,}1^2} = 0{,}67\).`) },
        { w: 'armonicos', opc: { inicial: { phi: 10, thd: 80 } }, nota: 'Sube el THD: el cosfímetro sigue igual, pero el FP real baja.' },
        { t: 'Resonancia', h: X`<p>Los capacitores no corrigen la distorsión y, con armónicos, pueden entrar en <b>resonancia</b> con el transformador: la corriente de un armónico se amplifica y los capacitores se dañan. Se usa un banco con <b>reactor de desintonía</b> (por ejemplo 7 %) o un <b>filtro activo</b>.</p>` }
      ],
      errores: [
        X`«Fuente de PC sin PFC: cosfímetro 0,99 y THD 110 %. El FP real es cerca de…»: la acertó solo el <b>25 %</b> (2 de 8). Tres eligieron 0,99, lo que marca el cosfímetro: confunden el FP de desplazamiento con el FP verdadero.`,
        X`Ejercicio «Lee tu factura» (laboratorio de la planta): promedio 7,9 de 10 (7 estudiantes, uno en blanco). Error típico: aplicar el recargo aunque el FP sea 0,85 o más.`,
        X`El FP del mes se calcula con las energías (kWh y kVARh), no con una lectura instantánea.`
      ],
      ejercicios: ['c5', 'n9', 'n10'],
      rapidas: [
        R('Fuente de computadora sin PFC: el cosfímetro marca 0,99 y el THD es 110 %. El FP real es cerca de…', ['0,67', '0,99', '1', '0,30'], X`\(FP = 0{,}99/\sqrt{1 + 1{,}1^2} = 0{,}67\). El cosfímetro solo ve el desfase de la fundamental.`),
        R('El cosfímetro de un tablero mide…', ['el desfase de la fundamental (cos φ₁)', 'el FP verdadero con armónicos', 'la potencia aparente', 'el THD'], 'Por eso con cargas electrónicas marca casi 1 aunque el FP real sea bajo.'),
        R(X`Un mes con 10 000 kWh y 10 000 kVARh tiene un FP de…`, [X`\(0{,}707\)`, X`\(1\)`, X`\(0{,}5\)`, X`\(0{,}85\)`], X`\(FP = \dfrac{10\,000}{\sqrt{2}\cdot 10\,000} = 0{,}707\).`),
        R('Con la regla de ELFEC, un taller tiene FP 0,90 en el mes. Su recargo es…', ['cero', '5 % del cargo', '10 % del cargo', '0,9 del cargo'], 'El recargo solo se cobra si el FP es menor que 0,85.'),
        R('¿Corrigen los capacitores un FP bajo causado por armónicos?', ['No: corrigen el desfase, no la distorsión; hasta pueden entrar en resonancia', 'Sí, siempre', 'Sí, si son de triángulo', 'Solo de noche'], 'Para armónicos se usan reactores de desintonía o filtros activos.', { una: true }),
        R(X`Un taller tiene FP 0,80 y un cargo base de Bs 8 000. Con la regla de ELFEC el recargo es…`, ['Bs 500', 'Bs 0', 'Bs 1 600', 'Bs 6 400'], X`\(8\,000\cdot(0{,}85/0{,}80 - 1) = 8\,000\cdot 0{,}0625 = \text{Bs}\ 500\).`)
      ]
    },
    // =========================================================
    {
      id: 'vat', n: 6, titulo: 'El vatímetro', corto: 'Multiplica y promedia; conexión; inserción; rangos; constante',
      teoria: [
        { t: 'El vatímetro multiplica y promedia', h: X`<p>El vatímetro calcula \(v(t)\cdot i(t)\) en cada instante y marca el <b>promedio</b>: la potencia activa \(P = VI\cos\varphi\). Con un desfase de 60° marca la mitad de \(V\cdot I\).</p>
          <p><b>Electrodinámico:</b> una bobina de corriente fija (pocas espiras, en serie con la carga) y una bobina de tensión móvil (muchas espiras con una resistencia grande, en paralelo). La fuerza entre ambas es proporcional a \(v\cdot i\); la inercia y el resorte la promedian. También mide en corriente continua: 100 V y 2 A marcan 200 W.</p>
          <p><b>Digital:</b> muestrea \(v\) e \(i\) (por ejemplo 128 muestras por ciclo), multiplica muestra a muestra y promedia. Con las mismas muestras da \(V_{ef}\), \(I_{ef}\), \(S\) y el FP verdadero.</p>` +
          D(X`P = \dfrac{1}{N}\sum_{k=1}^{N} v_k\, i_k`) },
        { w: 'potencia', opc: { inicial: { phi: 60 } }, nota: 'Con 60° el promedio de p(t) es la mitad de V·I. Compruébalo moviendo el desfase.' },
        { t: 'Cómo se conecta', h: X`<ul class="rp-lista"><li>Bornes de <b>corriente</b>: en serie con la carga, como un amperímetro.</li><li>Bornes de <b>tensión</b>: en paralelo con la carga, como un voltímetro.</li><li>Los dos bornes marcados \(\pm\) van del <b>lado de la fuente</b>. Si una bobina queda invertida, la aguja va al revés.</li><li><b>Nunca</b> la bobina de corriente en paralelo con la red: \(R_c \approx 0{,}05\ \Omega\) es un cortocircuito y se quema.</li></ul>` },
        { t: 'El error de inserción: conexión A o B', h: X`<p><b>Conexión A</b> (bobina de tensión del lado de la fuente): suma \(I^2 R_c\). <b>Conexión B</b> (bobina de tensión del lado de la carga): suma \(V^2/R_p\).</p>` +
          D(X`\text{A: } W = P + I^2 R_c`) + D(X`\text{B: } W = P + \dfrac{V^2}{R_p}`) + '<p>Regla: corriente pequeña → A; corriente grande → B.</p>' +
          ejm('Ejemplo resuelto.', X`\(R_c = 0{,}05\ \Omega\); \(R_p = 8\,000\ \Omega\); 220 V. Lámpara de 40 W: \(I = 0{,}18\ \text{A}\); A suma \(0{,}0017\ \text{W}\); B suma \(6{,}05\ \text{W}\) (15 %) → conviene A. Motor de 5 kW con FP 0,8: \(I = 28{,}4\ \text{A}\); A suma \(40{,}4\ \text{W}\) (0,81 %); B suma \(6{,}05\ \text{W}\) (0,12 %) → conviene B.`) },
        { t: 'Rangos: por qué se quema marcando poco', h: X`<p>El vatímetro tiene límite de <b>corriente</b> y de <b>tensión</b>, no de vatios. La bobina de corriente se calienta con \(I^2 R_c\) sea cual sea el FP; con FP bajo la aguja marca poco aunque la corriente sea alta.</p>` + D(X`I = \dfrac{P}{V\cos\varphi} \leq I_n;\;\; V \leq V_n`) +
          ejm('Caso.', X`Vatímetro de 5 A y 240 V (escala de 1 200 W) mide un motor en vacío: 330 W a 220 V con FP 0,25. \(I = 330/(220\cdot 0{,}25) = 6\ \text{A} > 5\ \text{A}\): se quema aunque la aguja esté en el 28 %.`) +
          X`<p>Para ensayos en vacío existen vatímetros de <b>bajo FP</b> (\(\cos\varphi_n = 0{,}2\)).</p>` },
        { t: 'Leer un vatímetro analógico: la constante', h: D(X`k = \dfrac{V_n\cdot I_n\cdot\cos\varphi_n}{\alpha_{max}}\ \ \text{(W/div)}`) + D(X`P = k\cdot\alpha`) +
          ejm('Ejemplo.', X`240 V; 5 A; 120 divisiones; \(\cos\varphi_n = 1\): \(k = 10\ \text{W/div}\). La aguja en 33 div: \(P = 330\ \text{W}\).`) },
        { t: 'Potencia reactiva con un vatímetro', h: X`<p>Con la corriente de la línea 1 y la tensión entre las líneas 2 y 3 (90° atrasada respecto de \(V_{1N}\)), el vatímetro marca \(V_L I_L\operatorname{sen}\varphi\). Vale con carga equilibrada y senoidal.</p>` + D(X`Q = \sqrt{3}\cdot W`) + ejm('Ejemplo.', X`\(W = 2{,}0\ \text{kW} \Rightarrow Q = 3{,}46\ \text{kVAR}\).`) }
      ],
      errores: [
        X`«Vatímetro de 5 A y 240 V: ¿qué carga lo pone en peligro?»: el 71 % (5 de 7). Dos eligieron «1 100 W a 230 V con FP 1» (4,8 A: no pasa de 5 A). El peligro es «600 W a 220 V con FP 0,5»: \(I = 5{,}45\ \text{A}\).`,
        X`«Bobina de corriente en paralelo con la red»: el 80 % (4 de 5) reconoció el cortocircuito.`,
        X`Las demás preguntas del vatímetro salieron bien: desfase de 60° (91 %), corriente continua (91 %), lámpara con conexión B (100 %) y constante de lectura (100 %).`,
        'Los rangos se eligen por corriente y tensión, nunca por vatios.'
      ],
      ejercicios: ['n11', 'n12', 'n13'],
      rapidas: [
        R('Si la corriente se atrasa 60° respecto de la tensión, el vatímetro marca…', [X`\(\tfrac{1}{2}\, V\cdot I\)`, X`\(V\cdot I\)`, 'cero', X`\(0{,}87\cdot V\cdot I\)`], X`\(P = VI\cos 60^\circ = \tfrac{1}{2}\,VI\).`),
        R('Un vatímetro electrodinámico mide una carga de corriente continua: 100 V y 2 A. Marca…', ['200 W', '0 W: solo funciona en CA', '141 W', 'la aguja oscila sin parar'], X`La fuerza es proporcional a \(v\cdot i\) también en continua: \(100\cdot 2 = 200\ \text{W}\).`),
        R('Por error conectan la bobina de corriente en paralelo con la red de 220 V. ¿Qué pasa?', ['cortocircuito: la bobina se quema', 'marca cero', 'marca el doble', 'nada: tiene fusible interno'], X`\(R_c \approx 0{,}05\ \Omega\): con 220 V la corriente es enorme.`),
        R(X`Mides una lámpara de 40 W a 220 V con la conexión B. La bobina de tensión tiene \(R_p = 8\ \text{k}\Omega\). El vatímetro marca…`, ['cerca de 46 W', '40 W', 'cerca de 34 W', 'cerca de 80 W'], X`Suma \(V^2/R_p = 220^2/8\,000 = 6{,}05\ \text{W}\): marca 46 W.`),
        R('Vatímetro de 5 A y 240 V. ¿Qué carga lo pone en peligro?', ['600 W a 220 V con FP 0,5', '1 000 W a 220 V con FP 1', '1 100 W a 230 V con FP 1', '200 W a 220 V con FP 0,2'], X`\(I = 600/(220\cdot 0{,}5) = 5{,}45\ \text{A} > 5\ \text{A}\). Las otras: 4,5 A; 4,8 A; 4,5 A.`),
        R(X`Vatímetro con rangos 480 V y 10 A, escala de 120 divisiones y \(\cos\varphi_n = 1\). La aguja marca 45 divisiones. \(P\) es…`, ['1 800 W', '450 W', '4 800 W', '540 W'], X`\(k = 480\cdot 10/120 = 40\ \text{W/div}\); \(P = 40\cdot 45 = 1\,800\ \text{W}\).`),
        R('Para medir un motor grande (mucha corriente), ¿qué conexión conviene?', ['B: bobina de tensión del lado de la carga', 'A: bobina de tensión del lado de la fuente', 'da lo mismo', 'ninguna: hace falta un amperímetro'], X`Con corriente grande, \(I^2 R_c\) (conexión A) es mayor que \(V^2/R_p\) (conexión B).`, { una: true }),
        R('Un vatímetro conectado con la corriente de L1 y la tensión entre L2 y L3 marca 1,5 kW. La potencia reactiva de la carga equilibrada es…', ['2,6 kVAR', '1,5 kVAR', '4,5 kVAR', '0,87 kVAR'], X`\(Q = \sqrt{3}\cdot W = 1{,}732\cdot 1{,}5 = 2{,}6\ \text{kVAR}\).`)
      ]
    },
    // =========================================================
    {
      id: 'tierra', n: 7, titulo: 'Puesta a tierra y telurómetro', corto: 'Tensión de contacto; jabalina; cómo mide; regla del 62 %',
      teoria: [
        { t: '¿Para qué sirve la tierra?', h: X`<p>Si la fase toca la carcasa de una lavadora, la corriente de falla vuelve al transformador por el suelo: las dos tierras (casa \(R_A\) y transformador \(R_B\)) quedan <b>en serie</b>.</p>` +
          D(X`I_f = \dfrac{U_0}{R_A + R_B};\;\; U_c = I_f\cdot R_A`) +
          ejm('Ejemplo.', X`\(U_0 = 220\ \text{V}\), \(R_A = 40\ \Omega\), \(R_B = 10\ \Omega\): \(I_f = 4{,}4\ \text{A}\) y la carcasa queda a \(U_c = 176\ \text{V}\). Un disyuntor de 16 A necesita varias veces su corriente para disparar rápido: no se entera.`) +
          '<p>Por eso se usa un <b>diferencial</b> (30 mA) y una tierra lo bastante baja:</p>' + D(X`R_A \leq \dfrac{U_L}{I_{\Delta n}} = \dfrac{24}{0{,}03} = 800\ \Omega`) },
        { t: 'Dónde está la resistencia de una tierra', h: X`<p>La corriente sale del electrodo y se abre en capas cada vez más anchas: casi toda la resistencia está <b>cerca del electrodo</b>. Con un hemisferio de 0,4 m, a 1 m ya está el 60 %; a 2 m, el 80 %; a 4 m, el 90 %. Más allá está la «tierra remota».</p>` },
        { w: 'capas', opc: { inicial: { r: 2 } }, nota: 'Mueve r: ¿a qué distancia queda el 95 % de la resistencia?' },
        { t: 'Qué mide un telurómetro: resistividad y jabalina', h: X`<p>La resistencia de tierra depende de la <b>resistividad</b> \(\rho\) del suelo (Ω·m), que cambia mucho con el agua, las sales y la época del año, y de la forma del electrodo.</p>` +
          D(X`R_{jabalina} = \dfrac{\rho}{2\pi L}\left(\ln\dfrac{8L}{d} - 1\right)`) + X`<p>(Dwight; \(L\) largo y \(d\) diámetro de la jabalina.) Una jabalina más larga baja la resistencia, pero no en proporción: doblar el largo la deja en unas 0,56 veces.</p>` },
        { t: 'El telurómetro por dentro', h: X`<ul class="rp-lista"><li>Inyecta una corriente alterna de miliamperios entre el electrodo <b>E</b> y una pica lejana <b>H</b>.</li><li>Mide la tensión entre E y una pica <b>S</b> con un voltímetro de alta impedancia: por S casi no circula corriente.</li><li>Usa 94 a 128 Hz, no 50 Hz, para separar su señal de las corrientes de la red; con continua las picas se polarizan.</li></ul>` + D(X`R_E = \dfrac{V_{ES}}{I_{EH}}`) },
        { w: 'campoTierra', opc: { params: { rho: 100, L: 2.4, I: 0.02 }, inicial: { D: 25, x: 15.5, etapa: 1 } }, nota: 'Avanza con ▶: la corriente; la tensión en el suelo; medir con S; ¿y si H está cerca?' },
        { t: 'Caída de potencial: la regla del 62 %', h: X`<p>Con suelo parejo y H lejos, la lectura es igual a la resistencia real cuando S está al <b>61,8 %</b> de la distancia entre E y H:</p>` +
          D(X`R(x) = \dfrac{\rho}{2\pi}\left(\dfrac{1}{r} - \dfrac{1}{D} - \dfrac{1}{x} + \dfrac{1}{D - x}\right)`) + D(X`x^2 + D\,x - D^2 = 0`) + D(X`x = \dfrac{\sqrt{5} - 1}{2}\,D = 0{,}618\,D`) +
          '<p>Si al mover S un metro la lectura cambia mucho, <b>H está demasiado cerca</b>: hay que alejarla (unas 10 veces el largo del electrodo) y repetir.</p>' },
        { w: 'telurometro', opc: { params: { rho: 100, L: 2.4, sem: 7 }, inicial: { D: 25, x: 3, puntos: [] } }, nota: 'Mueve S y toca «Medir» en varios lugares: busca la zona plana. Después acerca H y repite.' }
      ],
      errores: [
        X`«Jabalina de 1,5 m por una de 3 m: su resistencia…»: la acertó solo el <b>43 %</b> (3 de 7). Tres eligieron «baja exactamente a la mitad»: el logaritmo frena el efecto; baja a unas 0,56 veces.`,
        X`«¿Salta el disyuntor de 16 A?»: la acertaron los 6 (100 %): la corriente de falla es de unos 4 A.`,
        X`«¿Por qué 128 Hz?» y «¿qué haces si la lectura cambia 15 % al mover S?»: 86 % cada una (6 de 7).`,
        'La resistencia de tierra está casi toda cerca del electrodo: el suelo lejano casi no cuenta.'
      ],
      ejercicios: ['n15', 'n16', 'n17'],
      rapidas: [
        R(X`Red de 220 V; tierra de la casa 40 Ω; tierra del transformador 10 Ω. La fase toca la carcasa. ¿Salta el disyuntor de 16 A?`, ['no: la corriente es de unos 4 A', 'sí, de inmediato', 'no: la corriente es cero', 'sí: la tierra se lleva toda la corriente'], X`\(I_f = 220/50 = 4{,}4\ \text{A}\): muy poco para el disyuntor.`, { una: true }),
        R('Si cambias una jabalina de 1,5 m por una de 3 m en el mismo suelo, su resistencia…', ['baja, pero un poco menos que a la mitad', 'baja exactamente a la mitad', 'no cambia', 'sube'], 'El logaritmo de la fórmula de Dwight frena el efecto: queda en unas 0,56 veces.', { una: true }),
        R('¿Por qué el telurómetro inyecta a 128 Hz y no a 50 Hz?', ['para separar su señal de las corrientes de la red', 'porque 50 Hz es más peligroso', 'para que la corriente sea mayor', 'para medir la inductancia del suelo'], 'Las corrientes que ya circulan por el suelo son de 50 Hz; con otra frecuencia y un filtro, el equipo distingue la suya.', { una: true }),
        R('Con H a solo 8 m de una jabalina de 3 m, mueves S un metro y la lectura cambia 15 %. ¿Qué haces?', ['alejo H y repito', 'promedio las lecturas', 'acerco S al electrodo', 'mojo la pica S'], 'Si las zonas de E y H se tocan no hay zona plana: promediar números malos no da un número bueno.'),
        R(X`Con H a 30 m del electrodo, ¿dónde va la pica S?`, ['a unos 18,5 m', 'a 15 m (la mitad)', 'a 10 m', 'pegada a H'], X`\(x = 0{,}618\cdot 30 = 18{,}5\ \text{m}\).`),
        R('Con un diferencial de 30 mA y una tensión límite de 24 V, la tierra de la casa debe ser como máximo…', ['800 Ω', '25 Ω', '8 Ω', '24 Ω'], X`\(R_A \leq 24/0{,}03 = 800\ \Omega\).`),
        R('¿Dónde está la mayor parte de la resistencia de una puesta a tierra?', ['en el suelo cerca del electrodo', 'en el suelo lejano', 'en el cable de cobre', 'en la conexión al tablero'], 'Las capas cercanas son las más angostas: ahí está casi toda la resistencia.'),
        R('En época seca, la resistencia de una misma jabalina…', ['sube', 'baja', 'no cambia', 'se hace cero'], X`El suelo seco tiene más resistividad, y \(R\) es proporcional a \(\rho\).`)
      ]
    }
  ];

  FP.REPASO = { TEMAS };
})();
