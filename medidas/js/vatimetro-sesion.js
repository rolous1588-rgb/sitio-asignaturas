// ============================================================
// Medidas Eléctricas · Sesión "Del v·i al vatímetro" (T1, lun 19/10/2026)
// Bloque 1 del programa: ¿qué mide realmente cada equipo?
// Vatímetro electrodinámico y digital, conexión, error de inserción,
// por qué se quema marcando poco, constante de lectura y reactiva con un vatímetro.
// Reutiliza el diagrama "potencia" de fp-diagramas.js. Fórmulas en LaTeX (KaTeX):
// \( … \) en línea; decimales 0{,}25; multiplicar con \cdot; separar con ;\;
// ============================================================
(function () {
  const FP = (window.FP = window.FP || {});
  const X = String.raw;
  FP.SESIONES = FP.SESIONES || {};
  FP.SESIONES['me-vatimetro'] = {
    id: 'me-vatimetro',
    materia: 'Medidas Eléctricas',
    titulo: 'Del v·i al vatímetro',
    pasos: [
      { id: 'inicio', tipo: 'inicio', titulo: 'Del v·i al vatímetro', idea: 'Escanea el QR, entra con tu nombre y carnet.' },

      { id: 'caso', tipo: 'teoria', titulo: '¿Se puede quemar un vatímetro que marca poco?', idea: 'Vatímetro de 5 A y 240 V, escala de 1 200 W. Mide un motor de 220 V y marca 330 W.', derecha: 'Solución',
        puntos: ['La aguja está apenas en el 28 % de la escala.', 'El motor trabaja en vacío: su FP es 0,25.', '¿Corre peligro el instrumento?'],
        formulas: [X`P = V \cdot I \cdot \cos\varphi`, X`I = \dfrac{P}{V\cos\varphi}`, X`I = \dfrac{330}{220 \cdot 0{,}25} = 6\ \text{A}`, X`6\ \text{A} > 5\ \text{A}`, 'Se quema la bobina de corriente'],
        guia: ['Que lo discutan en parejas antes de mostrar la solución.'] },

      { id: 'potencia', tipo: 'explica', titulo: 'Lo que hace un vatímetro: multiplicar y promediar', diagrama: 'potencia', inicial: { phi: 60 },
        idea: X`El vatímetro multiplica \(v(t)\cdot i(t)\) en cada instante y marca el promedio. Mueve el desfase y mira el área.`,
        guia: ['Con 0°: p(t) siempre positiva. Con 90°: el promedio es cero.', 'Con 60°: el promedio es la mitad de V·I.'] },
      { id: 't-promedio', tipo: 'teoria', titulo: 'De la potencia instantánea a P', idea: 'La aguja no puede seguir 100 oscilaciones por segundo: marca el promedio.',
        puntos: [X`\(p(t)\): potencia en cada instante. Oscila al doble de la frecuencia de la red (100 Hz).`, X`\(P\): el <b>promedio</b> de \(p(t)\) en un período \(T\). Es la potencia que hace trabajo.`, X`En régimen senoidal, con \(V\) e \(I\) <b>eficaces</b>, el promedio se reduce a \(V \cdot I \cdot \cos\varphi\).`, X`\(\varphi\) es el desfase entre tensión y corriente.`],
        formulas: [X`p(t) = v(t)\cdot i(t)`, X`P = \dfrac{1}{T}\displaystyle\int_0^T v(t)\, i(t)\, dt`, X`P = V \cdot I \cdot \cos\varphi`, X`T = \dfrac{1}{f} = 20\ \text{ms}`] },
      { id: 'r1', tipo: 'rapida', titulo: 'Predicción', t: 'Si la corriente se atrasa 60° respecto de la tensión, el vatímetro marca…', o: [X`\(V\cdot I\)`, X`\(\tfrac{1}{2}\, V\cdot I\)`, 'cero', X`\(0{,}87\cdot V\cdot I\)`], c: 1 },

      // ---------- por dentro ----------
      { id: 't-electrodinamico', tipo: 'teoria', titulo: 'El vatímetro electrodinámico por dentro', idea: 'Dos bobinas: una lleva la corriente de la carga y la otra una corriente proporcional a la tensión.',
        puntos: [X`<b>Bobina de corriente</b> (fija): pocas espiras de alambre grueso, <b>en serie</b> con la carga. Crea un campo \(B\) proporcional a \(i(t)\).`, X`<b>Bobina de tensión</b> (móvil): muchas espiras de alambre fino con una resistencia grande en serie, <b>en paralelo</b> con la carga. Lleva \(i_p = v/R_p\), en fase con \(v\).`, 'La fuerza entre las dos bobinas es proporcional al producto de sus corrientes.', 'La inercia y el resorte promedian esa fuerza: la aguja marca P. La escala es lineal.'],
        formulas: [X`B \propto i(t)`, X`i_p(t) = \dfrac{v(t)}{R_p}`, X`\tau(t) = k\, i(t)\, i_p(t) = \dfrac{k}{R_p}\, v(t)\, i(t)`, X`\bar{\tau} \propto P \;\Rightarrow\; \alpha \propto P`] },
      { id: 'r2', tipo: 'rapida', titulo: 'Predicción', t: 'Un vatímetro electrodinámico mide una carga de corriente continua: 100 V y 2 A. Marca…', o: ['0 W: solo funciona en CA', '200 W', '141 W', 'la aguja oscila sin parar'], c: 1 },
      { id: 't-digital', tipo: 'teoria', titulo: 'El vatímetro digital', idea: 'Hace la misma cuenta, pero con números: muestrea, multiplica y promedia.',
        puntos: ['Mide la tensión con un divisor resistivo o un TP, y la corriente con un shunt, un TC o un sensor Hall.', X`Un conversor A/D toma \(N\) muestras por período, por ejemplo 128 por ciclo de 20 ms (6 400 muestras por segundo).`, X`Multiplica muestra a muestra \(v_k \cdot i_k\) y promedia.`, X`Con las mismas muestras calcula \(V_{ef}\), \(I_{ef}\), \(S\) y el <b>FP verdadero</b> \(P/S\). Eso lo veremos el miércoles.`],
        formulas: [X`P = \dfrac{1}{N}\displaystyle\sum_{k=1}^{N} v_k\, i_k`, X`V_{ef} = \sqrt{\dfrac{1}{N}\displaystyle\sum_{k=1}^{N} v_k^2}`, X`S = V_{ef}\cdot I_{ef}`, X`FP = \dfrac{P}{S}`] },

      // ---------- conexión ----------
      { id: 't-conexion', tipo: 'teoria', titulo: 'Cómo se conecta: cuatro bornes', idea: 'Corriente en serie; tensión en paralelo; los dos bornes marcados del lado de la fuente.',
        puntos: ['Dos bornes de <b>corriente</b> (A): en serie con la carga, como un amperímetro.', 'Dos bornes de <b>tensión</b> (V): en paralelo con la carga, como un voltímetro.', X`Un borne de cada bobina lleva la marca \(\pm\) (o \(*\)): los dos bornes marcados van del <b>lado de la fuente</b>.`, 'Si se invierte una bobina, la aguja va al revés. No se arregla cambiando el signo en la hoja: se invierte la bobina de tensión.'],
        derecha: 'Nunca', derechaTexto: true,
        formulas: ['Bobina de corriente en paralelo con la red', X`\(R_c \approx 0{,}05\ \Omega\) → cortocircuito`, 'Se quema la bobina y salta la protección'] },
      { id: 'r3', tipo: 'rapida', titulo: 'Predicción', t: 'Por error conectan la bobina de corriente en paralelo con la red de 220 V. ¿Qué pasa?', o: ['marca cero', 'cortocircuito: la bobina se quema', 'marca el doble', 'nada: el vatímetro tiene fusible interno'], c: 1 },

      { id: 't-insercion', tipo: 'teoria', titulo: '¿La bobina de tensión antes o después de la de corriente?', idea: 'Cada conexión suma al resultado el consumo de una de las bobinas: el error de inserción.',
        puntos: [X`<b>Conexión A</b> (tensión del lado de la fuente): la bobina de tensión mide también la caída en la bobina de corriente. Se suma \(I^2 R_c\).`, X`<b>Conexión B</b> (tensión del lado de la carga): la bobina de corriente lleva también la corriente de la bobina de tensión. Se suma \(V^2 / R_p\).`, 'Regla: corriente pequeña → conexión A. Corriente grande → conexión B.', 'Existen vatímetros compensados que restan ese error.'],
        formulas: [X`\text{A: } W = P_{carga} + I^2 R_c`, X`\text{B: } W = P_{carga} + \dfrac{V^2}{R_p}`, X`\varepsilon = \dfrac{W - P_{carga}}{P_{carga}} \cdot 100\ \%`] },
      { id: 'r4', tipo: 'rapida', titulo: 'Predicción', t: X`Mides una lámpara de 40 W a 220 V con la conexión B. La bobina de tensión tiene \(R_p = 8\ \text{k}\Omega\). El vatímetro marca…`, o: ['40 W', 'cerca de 46 W', 'cerca de 34 W', 'cerca de 80 W'], c: 1 },
      { id: 'ej-insercion', tipo: 'teoria', titulo: 'Ejemplo resuelto: elegir la conexión', idea: X`Vatímetro con \(R_c = 0{,}05\ \Omega\) y \(R_p = 8\,000\ \Omega\), a 220 V.`, derecha: 'Solución',
        puntos: ['<b>Lámpara de 40 W</b> (FP 1).', '<b>Motor de 5 kW</b> con FP 0,8.', '¿Qué conexión conviene en cada caso?'],
        formulas: [X`Lámpara: \(I = 40/220 = 0{,}18\ \text{A}\)`, X`A: \(I^2R_c = 0{,}0017\ \text{W}\;(0{,}004\ \%)\)`, X`B: \(V^2/R_p = 6{,}05\ \text{W}\;(15\ \%)\) → conviene A`, X`Motor: \(I = 5\,000/(220\cdot 0{,}8) = 28{,}4\ \text{A}\)`, X`A: \(I^2R_c = 40{,}4\ \text{W}\;(0{,}81\ \%)\)`, X`B: \(V^2/R_p = 6{,}05\ \text{W}\;(0{,}12\ \%)\) → conviene B`] },

      // ---------- rangos y lectura ----------
      { id: 't-rangos', tipo: 'teoria', titulo: 'Por qué se quema marcando poco', idea: 'El vatímetro tiene límite de corriente y de tensión, no de vatios.',
        puntos: [X`La bobina de corriente se calienta con \(I^2 R_c\), sin importar el FP.`, X`La aguja marca \(V I \cos\varphi\): con FP bajo, marca poco aunque la corriente sea alta.`, 'Antes de conectar: estimar I y V, elegir los rangos de corriente y de tensión, y poner <b>amperímetro y voltímetro</b> junto al vatímetro.', X`Para ensayos en vacío existen vatímetros de <b>bajo FP</b> (\(\cos\varphi_n = 0{,}2\)): dan toda la escala con poca potencia.`],
        formulas: [X`I = \dfrac{P}{V\cos\varphi} \le I_n`, X`V \le V_n`, X`W_{max} = V_n \cdot I_n \cdot \cos\varphi_n`] },
      { id: 'r5', tipo: 'rapida', titulo: 'Predicción', t: 'Vatímetro de 5 A y 240 V. ¿Qué carga lo pone en peligro?', o: ['1 000 W a 220 V con FP 1', '600 W a 220 V con FP 0,5', '1 100 W a 230 V con FP 1', '200 W a 220 V con FP 0,2'], c: 1 },

      { id: 't-constante', tipo: 'teoria', titulo: 'Leer un vatímetro analógico: la constante', idea: 'La escala está en divisiones: hay que multiplicar por la constante del rango elegido.',
        puntos: [X`La constante \(k\) dice cuántos vatios vale cada división, según los rangos de tensión y corriente que conectaste.`, X`Si cambias de rango, cambia \(k\): la misma aguja vale otra potencia.`, X`\(\cos\varphi_n\) viene escrito en el cuadrante (1 en los normales; 0,2 en los de bajo FP).`],
        derecha: 'Ejemplo',
        formulas: [X`k = \dfrac{V_n \cdot I_n \cdot \cos\varphi_n}{\alpha_{max}}\ \ \text{W/div}`, X`P = k \cdot \alpha`, X`240\ \text{V};\; 5\ \text{A};\; 120\ \text{div} \Rightarrow k = 10\ \text{W/div}`, X`\alpha = 33\ \text{div} \Rightarrow P = 330\ \text{W}`] },
      { id: 'r6', tipo: 'rapida', titulo: 'Predicción', t: X`Vatímetro con rangos 480 V y 10 A, escala de 120 divisiones y \(\cos\varphi_n = 1\). La aguja marca 45 divisiones. \(P\) es…`, o: ['450 W', '1 800 W', '4 800 W', '540 W'], c: 1 },

      { id: 't-reactiva', tipo: 'teoria', titulo: 'Medir potencia reactiva con un vatímetro', idea: 'Corriente de la línea 1 y tensión entre las líneas 2 y 3: el vatímetro marca algo proporcional a Q.',
        puntos: [X`La tensión \(V_{23}\) está <b>90° atrasada</b> respecto de \(V_{1N}\).`, X`El vatímetro multiplica \(I_1\) por \(V_{23}\): el coseno del ángulo entre ellas es \(\sin\varphi\).`, 'Vale con carga equilibrada y ondas senoidales.', 'Si la aguja va al revés, la secuencia de fases está invertida.'],
        formulas: [X`W = V_L\, I_L \cos(90^\circ - \varphi) = V_L\, I_L \sin\varphi`, X`Q = \sqrt{3}\, V_L\, I_L \sin\varphi`, X`Q = \sqrt{3}\cdot W`, X`W = 2{,}0\ \text{kW} \Rightarrow Q = 3{,}46\ \text{kVAR}`] },

      { id: 't-resumen', tipo: 'teoria', titulo: 'Para llevar: las fórmulas de hoy', idea: 'Anótalas: son la base del laboratorio del jueves.',
        puntos: ['El vatímetro <b>multiplica y promedia</b>: marca P, no V·I.', 'Corriente en serie; tensión en paralelo; bornes marcados del lado de la fuente.', 'Corriente pequeña → conexión A; corriente grande → conexión B.', 'Los rangos se eligen por <b>corriente y tensión</b>, nunca por vatios.'],
        formulas: [X`P = V \cdot I \cdot \cos\varphi`, X`P = \dfrac{1}{N}\sum v_k\, i_k`, X`\text{A: } +I^2R_c\;;\;\text{B: } +V^2/R_p`, X`k = \dfrac{V_n\, I_n \cos\varphi_n}{\alpha_{max}}`, X`Q = \sqrt{3}\cdot W_{(I_1,\,V_{23})}`] },

      { id: 'cierre', tipo: 'cierre', titulo: 'Cierre', idea: X`El vatímetro mide \(P = V\cdot I\cdot\cos\varphi\); se elige y se protege por su corriente y su tensión.` }
    ]
  };

  // Las fórmulas sin delimitadores se envuelven en \( … \) para que KaTeX las dibuje.
  const envolver = (t) => (/\\\(/.test(t) || !/[\\=^_]/.test(t) ? t : '\\(' + t + '\\)');
  FP.SESIONES['me-vatimetro'].pasos.forEach((p) => { if (p.formulas) p.formulas = p.formulas.map(envolver); });
})();
