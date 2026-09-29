// ============================================================
// Sesión 2 — Sensores de temperatura y presión
// Martes 29/09 · 20:00–22:00 (2 h, sin pausa)
// Enfoque: principio físico → conexión/instalación → selección → diagnóstico
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  const V = (x, u = '') => `<span class="valor">${II.fmt(x, 3)}${u ? ' ' + u : ''}</span>`;

  // presión atmosférica típica según la altura (atmósfera estándar), en kPa
  const patm = (h) => Math.round(101.325 * Math.pow(1 - 2.25577e-5 * h, 5.25588) * 10) / 10;
  const CIUDADES = [['Santa Cruz', 416], ['Tarija', 1854], ['Cochabamba', 2558], ['Sucre', 2810], ['La Paz', 3640], ['Oruro', 3706], ['Potosí', 4067]];

  // ---------- Reto 1: sensores de temperatura ----------
  const SENSORES_T = ['RTD Pt100', 'Termopar', 'Termistor NTC'];
  const APLIC_T = {
    'RTD Pt100': [
      'Controlar la pasteurización de leche a 72 °C con un error menor a ±0,3 °C.',
      'Medir la temperatura de un reactor farmacéutico a 37 °C con la mayor exactitud posible.',
      'Laboratorio de calibración: medir un baño de aceite a 200 °C con la mínima incertidumbre.',
      'Medir el agua caliente de un proceso de alimentos a 85 °C con exactitud de ±0,5 °C.'
    ],
    Termopar: [
      'Medir la temperatura de un horno de fundición de cobre a 1150 °C.',
      'Medir los gases de escape de un motor diésel (≈ 600 °C) con respuesta rápida y bajo costo.',
      'Controlar un horno de tratamiento térmico de acero a 900 °C.',
      'Medir la temperatura en la zona de llama de una caldera de biomasa (≈ 1000 °C).'
    ],
    'Termistor NTC': [
      'Proteger el bobinado de un motor pequeño contra sobrecalentamiento, al menor costo posible.',
      'Medir la temperatura de una batería de litio dentro de un equipo portátil.',
      'Termostato de un refrigerador doméstico (entre −20 y 10 °C), muy barato.',
      'Sensor económico para el control de un aire acondicionado de oficina.'
    ]
  };
  const RAZON_T = {
    'RTD Pt100': 'la prioridad es la exactitud en un rango moderado (hasta ≈ 600 °C).',
    Termopar: 'es el único de los tres que soporta temperaturas tan altas, con respuesta rápida y bajo costo.',
    'Termistor NTC': 'basta un rango corto de temperatura y se busca bajo costo y alta sensibilidad.'
  };
  // diagnóstico: síntoma → causa
  const CAUSAS_T = [
    'Pt100 conectada a 2 hilos con cable largo',
    'Termopar sin compensación o con cable de cobre',
    'Sensor abierto (cable cortado)',
    'Termopar con la polaridad invertida',
    'Sensor sin contacto con el fondo del termopozo',
    'Borne flojo o corroído en una conexión a 3 hilos'
  ];
  const SINTOMAS_T = [
    ['Una Pt100 instalada a 150 m del tablero marca siempre varios grados de más, en todo el rango.', 0, 'Los dos conductores se suman a la Pt100: a 2 hilos, 150 m de cable agregan ≈ 7,5 Ω ≈ 19 °C.'],
    ['Un termopar marca de menos, y el error crece al mediodía, cuando el sol calienta la caja del cabezal.', 1, 'La unión fría real quedó en el cabezal (cable de cobre) o no se compensa: el error sigue a la temperatura de la caja.'],
    ['De un momento a otro, la lectura se fue al extremo de la escala y se quedó ahí.', 2, 'Con el circuito abierto el transmisor lleva la señal a un extremo a propósito ("burnout") para avisar la falla.'],
    ['Cuando el horno se calienta, la lectura del termopar baja.', 3, 'Con los cables invertidos, la tensión cambia de signo: el transmisor interpreta al revés.'],
    ['La lectura es correcta, pero tarda varios minutos en reaccionar a un cambio que un termómetro de mano detecta enseguida.', 4, 'Si el inserto no toca el fondo del termopozo, queda aire en medio, que es un buen aislante térmico.'],
    ['Una Pt100 a 3 hilos funcionó bien por años; después de la temporada de lluvias empezó a marcar 3 °C de más.', 5, 'El borne corroído agrega resistencia a un solo conductor: los cables ya no son iguales y el 3er hilo deja de compensar.']
  ];

  // ---------- Reto 2: presión ----------
  const TIPOS_P = ['Manométrica', 'Absoluta', 'Diferencial'];
  const APLIC_P = {
    Manométrica: [
      'Vigilar la presión de descarga de una bomba de agua.',
      'Mantener la red de aire comprimido de la planta en 6 bar.',
      'Revisar la presión de inflado del neumático de un camión.'
    ],
    Absoluta: [
      'Controlar el vacío de una envasadora de alimentos que debe dar el mismo resultado en Santa Cruz y en Potosí.',
      'Medir la presión barométrica en una estación meteorológica.',
      'Controlar la presión dentro de un condensador de vapor que trabaja por debajo de la atmósfera, sin que influya el clima.'
    ],
    Diferencial: [
      'Saber cuándo se está tapando un filtro (presión antes vs. después del filtro).',
      'Medir el nivel de un tanque cerrado y presurizado.',
      'Medir el caudal de una tubería con una placa orificio.'
    ]
  };
  const RAZON_P = {
    Manométrica: 'interesa cuánto supera la presión a la atmósfera del lugar (es lo que "empuja" contra la tubería o el neumático).',
    Absoluta: 'el resultado no debe depender de la altura ni del clima: se mide desde el vacío total.',
    Diferencial: 'lo que importa es la diferencia entre dos puntos, no la presión de cada uno.'
  };
  const LIQUIDOS = [['agua', 1000], ['diésel', 840], ['leche', 1030], ['pulpa de mineral', 1400]];
  const CAUSAS_P = [
    'Pulsaciones de la bomba sin amortiguador',
    'Toma tapada o válvula de bloqueo cerrada',
    'Transmisor absoluto donde se esperaba uno manométrico',
    'Falta el sifón en una línea de vapor',
    'Columna de líquido en la línea de impulso',
    'Faltó un sello de diafragma para ese fluido'
  ];
  const SINTOMAS_P = [
    ['La aguja del manómetro en la descarga de una bomba de pistón vibra tanto que no se puede leer, y el mecanismo se desgastó en semanas.', 0, 'Cada golpe del pistón es un pico de presión: hace falta un amortiguador y un manómetro con glicerina.'],
    ['El proceso arranca y para, pero la lectura del transmisor de presión no se mueve nada.', 1, 'Si la presión no llega al instrumento, la lectura se congela: toma tapada o válvula de bloqueo olvidada cerrada.'],
    ['Con la tubería vacía y abierta al aire, un transmisor recién instalado en Sucre marca 71,8 kPa en vez de 0.', 2, 'Marca la presión atmosférica de Sucre: es un transmisor absoluto, no manométrico.'],
    ['El manómetro de una línea de vapor dejó de funcionar al poco tiempo: el tubo Bourdon se deformó por el calor.', 3, 'Sin sifón, el vapor caliente llega directo al Bourdon; el sifón mantiene una barrera de condensado frío.'],
    ['Un transmisor instalado 3 m por debajo de la toma de una tubería de agua marca ≈ 29 kPa de más, incluso con la bomba apagada.', 4, 'La línea llena de agua suma ρ·g·h = 1000 × 9,81 × 3 ≈ 29 kPa: hay que corregir el cero o reubicar.'],
    ['En una línea de pulpa de mineral, la línea de impulso se tapó y el transmisor dejó de medir a las pocas semanas.', 5, 'Los sólidos se asientan en la línea: con pulpa se usa un sello de diafragma al ras de la toma.']
  ];

  // ---------- Integrador: diagnóstico en el TK-100 ----------
  const CAUSAS_TK = [
    'Borne corroído en la conexión a 3 hilos',
    'Toma tapada o válvula de bloqueo cerrada',
    'Sensor sin contacto con el fondo del termopozo',
    'Pulsaciones sin amortiguador',
    'Transmisor configurado con el sensor equivocado'
  ];
  const SINTOMAS_TK = [
    ['Tras la temporada de lluvias, el TT-102 marca 3 °C más que un termómetro patrón. Al abrir el cabezal, los bornes están verdosos.', 0],
    ['Con la bomba funcionando, el PT-103 marca siempre lo mismo, aunque se cierre la válvula de descarga.', 1],
    ['El TT-102 tarda varios minutos en mostrar un cambio de temperatura que un termómetro de mano detecta enseguida.', 2],
    ['La aguja del manómetro local de la descarga de la bomba vibra tanto que no se puede leer.', 3],
    ['Después de cambiar el TT-102 por un repuesto, la lectura quedó muy lejos de la real, aunque el sensor está bien conectado.', 4]
  ];

  const retos = {
    'c1-reto': {
      titulo: 'Reto 1 · Sensores de temperatura',
      puntos: 10,
      general: 'Cada estudiante recibe su propia Pt100, su propio cable y su propio termopar: calcula, diagnostica una falla y elige el sensor adecuado.',
      pista: 'Pt100: R = 100 · (1 + 0,00385 · T). A 2 hilos el cable suma 2 × (resistencia de un conductor), y cada 0,385 Ω equivale a 1 °C. Termopar: T = E ÷ 0,041 + temperatura de la bornera. Para la falla, piensa qué parte del punto de medición produce ESE síntoma.',
      errorComun: 'En el termopar, olvidar sumar la temperatura de la bornera: el termopar solo "ve" la DIFERENCIA entre la unión caliente y la unión fría.',
      metodo: 'Pt100: R = 100 · (1 + 0,00385 · T) · Error a 2 hilos = 2 · Rc ÷ 0,385 [°C] · Termopar K: T = E ÷ 0,041 + T bornera · Falla: síntoma → parte del punto de medición · Exactitud → Pt100; mucho calor → termopar; barato y rango corto → NTC',
      generar(r) {
        const T = II.elegir(r, [35, 45, 55, 65, 72, 85, 95, 110, 125, 140]);
        const R = 100 * (1 + 0.00385 * T);
        const Rc = II.elegir(r, [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5]);
        const errC = (2 * Rc) / 0.385;
        const Tf = II.elegir(r, [18, 20, 22, 25, 28, 30]);
        const Th = II.elegir(r, [250, 300, 350, 400, 450, 500, 600, 700, 800]);
        const E = Math.round((Th - Tf) * 0.041 * 100) / 100;
        const dT = E / 0.041;
        const Tp = dT + Tf;
        const sint = II.elegir(r, SINTOMAS_T);
        const tipo = II.elegir(r, SENSORES_T);
        const sit = II.elegir(r, APLIC_T[tipo]);
        return {
          enunciado: `
            <p><b>a)</b> Una <b>Pt100</b> está midiendo un proceso a ${V(T, '°C')}.</p>
            <p><b>b)</b> Otra Pt100 está conectada <b>a 2 hilos</b> y cada conductor del cable tiene ${V(Rc, 'Ω')}.</p>
            <p><b>c)</b> Un <b>termopar tipo K</b> entrega ${V(E, 'mV')} y su bornera (unión fría) está a ${V(Tf, '°C')}. Usa la aproximación de 0,041 mV/°C.</p>`,
          campos: [
            { id: 'r', tipo: 'num', pregunta: 'a) ¿Qué resistencia tiene la Pt100? Usa R = 100 · (1 + 0,00385 · T)', unidad: 'Ω', tolRel: 0.004 },
            { id: 'e', tipo: 'num', pregunta: 'b) ¿Cuántos °C <b>de más</b> indicará el transmisor por culpa del cable?', unidad: '°C', tolRel: 0.02, tolAbs: 0.05 },
            { id: 't', tipo: 'num', pregunta: 'c) ¿A qué temperatura está el proceso que mide el termopar?', unidad: '°C', tolRel: 0.01 },
            { id: 'f', tipo: 'select', pregunta: 'd) <b>Diagnóstico:</b> ' + II.esc(sint[0]) + '<br><span class="nota">¿Cuál es la causa más probable?</span>', opciones: CAUSAS_T },
            { id: 's', tipo: 'select', pregunta: 'e) ' + II.esc(sit) + '<br><span class="nota">¿Qué sensor elegirías?</span>', opciones: SENSORES_T }
          ],
          esperado: { r: R, e: errC, t: Tp, f: CAUSAS_T[sint[1]], s: tipo },
          solucion: `
            <p><b>a)</b> R = 100 · (1 + 0,00385 · ${II.fmt(T)}) = <b>${II.fmt(R, 2)} Ω</b></p>
            <p><b>b)</b> A 2 hilos el transmisor también mide los dos conductores: 2 × ${II.fmt(Rc)} = ${II.fmt(2 * Rc)} Ω. Como la Pt100 cambia 0,385 Ω por °C: ${II.fmt(2 * Rc)} ÷ 0,385 = <b>${II.fmt(errC, 2)} °C</b> de más. A 3 o 4 hilos este error desaparece.</p>
            <p><b>c)</b> El termopar mide la diferencia: ${II.fmt(E)} ÷ 0,041 = ${II.fmt(dT, 1)} °C por encima de la bornera → T = ${II.fmt(dT, 1)} + ${II.fmt(Tf)} = <b>${II.fmt(Tp, 1)} °C</b></p>
            <p><b>d) ${CAUSAS_T[sint[1]]}</b>: ${sint[2]}</p>
            <p><b>e) ${tipo}</b>: ${RAZON_T[tipo]}</p>`
        };
      }
    },

    'c2-reto': {
      titulo: 'Reto 2 · Presión',
      puntos: 10,
      general: 'Convierte unidades, calcula la presión absoluta en tu ciudad y la del fondo de un tanque, diagnostica una falla y elige el tipo de medición.',
      pista: '1 psi = 0,0689 bar y 1 bar = 100 kPa. P_abs = P_man + P_atm (en las mismas unidades). Presión de un líquido: P = ρ · g · h con g = 9,81 m/s²; divide entre 1000 para tenerla en kPa. Para la falla, piensa en la toma, la línea y los accesorios.',
      errorComun: 'Usar la presión atmosférica del nivel del mar (101,3 kPa) en una ciudad de altura, o sumar bar con kPa sin convertir.',
      metodo: '1 psi = 0,0689 bar · P_abs = P_man × 100 + P_atm [kPa] · P = ρ · 9,81 · h ÷ 1000 [kPa] · Falla: toma, línea, accesorio o tipo equivocado · Filtro, nivel en tanque cerrado, placa orificio → diferencial',
      generar(r) {
        const psi = II.elegir(r, [30, 45, 60, 75, 90, 120]);
        const bar = psi * 0.0689476;
        const [ciudad, alt] = II.elegir(r, CIUDADES);
        const pa = patm(alt);
        const pman = II.elegir(r, [1.5, 2, 2.5, 3, 3.5, 4, 5]);
        const pabs = pman * 100 + pa;
        const [liq, rho] = II.elegir(r, LIQUIDOS);
        const h = II.elegir(r, [2, 2.5, 3, 4, 4.5, 5, 6, 7.5]);
        const ph = (rho * 9.81 * h) / 1000;
        const sint = II.elegir(r, SINTOMAS_P);
        const tipo = II.elegir(r, TIPOS_P);
        const sit = II.elegir(r, APLIC_P[tipo]);
        return {
          enunciado: `
            <p><b>a)</b> Un manómetro importado marca ${V(psi, 'psi')}.</p>
            <p><b>b)</b> Una planta está en <b>${ciudad}</b>, donde la presión atmosférica es ${V(pa, 'kPa')}. El manómetro de descarga de una bomba marca ${V(pman, 'bar')}.</p>
            <p><b>c)</b> Un tanque abierto contiene ${liq} (ρ = ${V(rho, 'kg/m³')}) hasta una altura de ${V(h, 'm')}.</p>`,
          campos: [
            { id: 'b', tipo: 'num', pregunta: 'a) ¿Cuánto marca el manómetro en bar?', unidad: 'bar', tolRel: 0.01 },
            { id: 'a', tipo: 'num', pregunta: 'b) ¿Cuál es la presión <b>absoluta</b> en la descarga de la bomba?', unidad: 'kPa', tolRel: 0.01 },
            { id: 'h', tipo: 'num', pregunta: 'c) ¿Qué presión (manométrica) hay en el fondo del tanque?', unidad: 'kPa', tolRel: 0.02 },
            { id: 'f', tipo: 'select', pregunta: 'd) <b>Diagnóstico:</b> ' + II.esc(sint[0]) + '<br><span class="nota">¿Cuál es la causa más probable?</span>', opciones: CAUSAS_P },
            { id: 't', tipo: 'select', pregunta: 'e) ' + II.esc(sit) + '<br><span class="nota">¿Qué tipo de medición de presión corresponde?</span>', opciones: TIPOS_P }
          ],
          esperado: { b: bar, a: pabs, h: ph, f: CAUSAS_P[sint[1]], t: tipo },
          solucion: `
            <p><b>a)</b> ${II.fmt(psi)} psi × 0,0689 = <b>${II.fmt(bar, 3)} bar</b></p>
            <p><b>b)</b> ${II.fmt(pman)} bar = ${II.fmt(pman * 100)} kPa → P_abs = ${II.fmt(pman * 100)} + ${II.fmt(pa, 1)} = <b>${II.fmt(pabs, 1)} kPa</b> (en ${ciudad}, no 101,3 kPa)</p>
            <p><b>c)</b> P = ρ · g · h = ${rho} × 9,81 × ${II.fmt(h)} = ${II.fmt(rho * 9.81 * h, 0)} Pa = <b>${II.fmt(ph, 2)} kPa</b></p>
            <p><b>d) ${CAUSAS_P[sint[1]]}</b>: ${sint[2]}</p>
            <p><b>e) ${tipo}</b>: ${RAZON_P[tipo]}</p>`
        };
      }
    },

    integrador: {
      titulo: 'Reto integrador · El TK-100 por dentro',
      puntos: 20,
      general: 'Volvemos al tanque TK-100 de la Sesión 1: temperatura con Pt100, presión absoluta, un adelanto de nivel, una falla real y una decisión de instrumentación.',
      pista: 'Pt100: T = (R ÷ 100 − 1) ÷ 0,00385. P_abs = P_man × 100 + P_atm. Nivel: h = P ÷ (ρ · 9,81), con P en Pa. Para la falla, busca la parte del punto de medición que explica el síntoma.',
      errorComun: 'En la pregunta 3, dejar la presión en kPa (hay que pasarla a Pa multiplicando por 1000) o usar ρ = 1000 en vez de la densidad del agua caliente.',
      metodo: 'T = (R ÷ 100 − 1) ÷ 0,00385 · P_abs = P_man × 100 + P_atm [kPa] · h = P × 1000 ÷ (ρ · 9,81) [m] · Falla: síntoma → parte del punto de medición · Tanque cerrado y presurizado → diferencial',
      generar(r) {
        const [ciudad, alt] = II.elegir(r, CIUDADES);
        const pa = patm(alt);
        const T = II.elegir(r, [58, 62, 66, 70, 74, 78]);
        const R = Math.round(100 * (1 + 0.00385 * T) * 100) / 100;
        const Tc = (R / 100 - 1) / 0.00385;
        const pman = II.elegir(r, [1.8, 2.2, 2.4, 2.6, 3.2]);
        const pabs = pman * 100 + pa;
        const rho = 978;
        const hReal = II.elegir(r, [2.2, 2.6, 3, 3.4, 3.8]);
        const pf = Math.round(((rho * 9.81 * hReal) / 1000) * 10) / 10;
        const h = (pf * 1000) / (rho * 9.81);
        const sint = II.elegir(r, SINTOMAS_TK);
        return {
          enunciado: `
            <p>El tanque <b>TK-100</b> de la Sesión 1 está en una planta de <b>${ciudad}</b> (presión atmosférica: ${V(pa, 'kPa')}). Está <b>abierto</b> y contiene agua caliente (ρ = ${V(rho, 'kg/m³')}).</p>
            <p>• El <b>TT-102</b> es una Pt100 conectada a 3 hilos, dentro de un termopozo, y hoy mide ${V(R, 'Ω')}.<br>
            • El <b>PT-103</b> es un transmisor <b>manométrico</b> en la descarga de la bomba y marca ${V(pman, 'bar')}.<br>
            • El <b>LT-101</b> mide la presión que hace el agua en el fondo del tanque: ${V(pf, 'kPa')}.</p>`,
          campos: [
            { id: 'q1', tipo: 'num', pregunta: '1) ¿A qué temperatura está el agua según el TT-102?', unidad: '°C', tolRel: 0.01 },
            { id: 'q2', tipo: 'num', pregunta: '2) ¿Cuál es la presión <b>absoluta</b> en la descarga de la bomba?', unidad: 'kPa', tolRel: 0.01 },
            { id: 'q3', tipo: 'num', pregunta: '3) ¿Qué nivel de agua hay en el tanque?', unidad: 'm', tolRel: 0.02 },
            { id: 'q4', tipo: 'select', pregunta: '4) <b>Diagnóstico:</b> ' + II.esc(sint[0]) + '<br><span class="nota">¿Cuál es la causa más probable?</span>', opciones: CAUSAS_TK },
            { id: 'q5', tipo: 'select', pregunta: '5) Si el TK-100 se cerrara y se presurizara con aire, ¿qué tipo de transmisor necesitaría el LT-101 para seguir midiendo bien el nivel?', opciones: ['Manométrico', 'Absoluto', 'Diferencial'] }
          ],
          esperado: { q1: Tc, q2: pabs, q3: h, q4: CAUSAS_TK[sint[1]], q5: 'Diferencial' },
          solucion: `
            <p><b>1)</b> T = (${II.fmt(R, 2)} ÷ 100 − 1) ÷ 0,00385 = <b>${II.fmt(Tc, 1)} °C</b></p>
            <p><b>2)</b> P_abs = ${II.fmt(pman)} × 100 + ${II.fmt(pa, 1)} = <b>${II.fmt(pabs, 1)} kPa</b></p>
            <p><b>3)</b> h = P ÷ (ρ · g) = ${II.fmt(pf * 1000, 0)} ÷ (${rho} × 9,81) = <b>${II.fmt(h, 2)} m</b></p>
            <p><b>4) ${CAUSAS_TK[sint[1]]}</b>.</p>
            <p><b>5) Diferencial</b>: con el tanque presurizado, el fondo "siente" el gas + el líquido. El diferencial resta la presión de arriba (lado L) y queda solo ρ · g · h.</p>`
        };
      }
    }
  };

  II.SESIONES['ii-s2'] = {
    id: 'ii-s2',
    numero: 2,
    titulo: 'Sensores de temperatura y presión',
    fecha: 'Martes 29/09 · 20:00–22:00',
    siguiente: 'Sesión 3 · Miércoles 30/09, 20:00 — Sensores de nivel y flujo',
    retos,
    diagnostico: [
      { t: '(Repaso) Un transmisor de 0 a 200 °C con exactitud de ±0,5 % del span tiene un error máximo de:', o: ['±0,5 °C', '±1 °C', '±2 °C', '±10 °C'], c: 1 },
      { t: '(Repaso) En un lazo cerrado, ¿qué hace el controlador?', o: ['Mide la variable del proceso', 'Compara la medición con el setpoint y decide la corrección', 'Abre o cierra físicamente el paso del fluido'], c: 1 },
      { t: 'Cuando un metal como el platino se calienta, su resistencia eléctrica:', o: ['Aumenta', 'Disminuye', 'No cambia'], c: 0 },
      { t: 'Un manómetro abierto al aire marca 0. La presión absoluta en ese punto es:', o: ['Cero', 'La presión atmosférica del lugar', 'Depende de la marca del manómetro'], c: 1 },
      { t: '¿A qué temperatura hierve el agua en Sucre (≈ 2800 m de altura)?', o: ['≈ 100 °C', '≈ 90 °C', '≈ 110 °C'], c: 1 }
    ],
    pasos: [
      { id: 'inicio', tipo: 'espera', titulo: 'Sesión 2: Sensores de temperatura y presión' },
      { id: 'diagnostico', tipo: 'cuestionario', titulo: 'Repaso y diagnóstico: 5 preguntas' },

      { id: 'c1-principio', tipo: 'explica', ciclo: 1, titulo: 'Temperatura: el principio físico de cada sensor', diagrama: 'principioT',
        ideas: [
          'Cada sensor aprovecha un <b>efecto físico</b> que cambia con la temperatura: la resistencia de un metal (RTD), la tensión entre dos metales (termopar) o los portadores de un semiconductor (termistor).',
          '<b>RTD</b>: al calentarse, los átomos vibran más y frenan a los electrones → la resistencia <b>sube</b>. El platino es el estándar: Pt100 = 100 Ω a 0 °C (IEC 60751).',
          '<b>Termopar</b>: dos metales distintos generan milivoltios según la <b>diferencia</b> entre la unión caliente y la fría. Los tipos (J, K, T, E, N, R, S, B) dependen de los metales (IEC 60584).',
          '<b>Termistor</b>: en un semiconductor el calor libera portadores de carga → la resistencia <b>baja</b> mucho (NTC). Muy sensible, pero de rango corto.'
        ] },
      { id: 'c1-conexion', tipo: 'explica', ciclo: 1, titulo: 'Cómo se conecta: 2, 3 y 4 hilos; cable de compensación', diagrama: 'hilos',
        ideas: [
          'A <b>2 hilos</b>, el transmisor mide la Pt100 <b>más</b> los dos cables: cada 0,385 Ω de cable es 1 °C de error.',
          'A <b>3 hilos</b>, se mide la caída en un cable y se resta: el error se anula <b>si los cables son iguales</b>. Es el estándar industrial.',
          'A <b>4 hilos</b>, dos cables llevan la corriente y dos solo miden: el cable no influye aunque sea distinto. Para laboratorios, calibración y máxima exactitud.',
          'En el termopar, la unión fría está donde termina su metal: del cabezal al transmisor va <b>cable de compensación</b> del mismo tipo, nunca cobre.'
        ] },
      { id: 'c1-planta', tipo: 'explica', ciclo: 1, titulo: 'Así se ve en planta y cómo se elige', diagrama: 'plantaT',
        ideas: [
          'Un punto de medición es más que el sensor: <b>termopozo → inserto → cuello → cabezal → transmisor → cable</b>.',
          'El <b>termopozo</b> protege al sensor y permite cambiarlo sin parar el proceso (ASME PTC 19.3 TW). La punta va en el tercio central de la tubería.',
          'El <b>transmisor de cabezal</b> convierte la señal en 4–20 mA junto al sensor: menos cable, menos error y menos ruido.',
          'Para elegir: <b>rango</b>, <b>exactitud</b>, <b>vibración</b>, <b>velocidad</b>, <b>costo</b> y <b>ambiente</b> (IP, Ex).'
        ] },
      { id: 'c1-explora', tipo: 'explora', ciclo: 1, titulo: 'Explora los errores de medición', diagrama: 'temperatura',
        guia: [
          'Pt100 a <b>2 hilos</b> con 200 m de cable: ¿cuánto error aparece? ¿Qué pasa con 3 hilos?',
          '<b>Termopar</b> a 600 °C: desactiva la compensación y sube la bornera a 40 °C. ¿Cuánto se equivoca?',
          '<b>Termistor</b>: súbelo arriba de 125 °C. ¿Por qué no lo usarías en un horno?',
          '¿Qué sensor elegirías para el TT-102 del TK-100 (agua a 72 °C, exactitud de ±0,5 °C)? ¿Por qué?'
        ] },
      { id: 'c1-reto', tipo: 'reto', ciclo: 1, titulo: 'Reto 1 · Sensores de temperatura', reto: 'c1-reto' },
      { id: 'c1-revisa', tipo: 'revisa', ciclo: 1, titulo: 'Revisión del Reto 1', reto: 'c1-reto' },

      { id: 'c2-tipos', tipo: 'explica', ciclo: 2, titulo: 'Presión: absoluta, manométrica y diferencial', diagrama: 'presion',
        ideas: [
          'Presión = fuerza ÷ área. <b>1 bar = 100 kPa ≈ 14,5 psi ≈ 10,2 m de columna de agua</b>.',
          '<b>Absoluta</b> (desde el vacío), <b>manométrica</b> (respecto a la atmósfera del lugar) y <b>diferencial</b> (entre dos puntos). <b>P<sub>abs</sub> = P<sub>man</sub> + P<sub>atm</sub></b>.',
          'La atmósfera depende de la altura: ≈ 96 kPa en Santa Cruz, ≈ 72 kPa en Sucre, ≈ 65 kPa en La Paz. Por eso en Sucre el agua hierve cerca de 90 °C.',
          'Un líquido empuja más cuanto más profundo: <b>P = ρ · g · h</b>. Así se mide el nivel (Sesión 3).'
        ] },
      { id: 'c2-principio', tipo: 'explica', ciclo: 2, titulo: 'Presión: el principio físico de cada sensor', diagrama: 'principioP',
        ideas: [
          '<b>Tubo Bourdon</b>: un tubo curvo y aplanado se endereza con la presión y mueve la aguja. Mecánico, sin energía (EN 837-1).',
          '<b>Diafragma con galgas</b>: la presión deforma un diafragma; las galgas cambian su resistencia y un puente de Wheatstone entrega milivoltios.',
          '<b>Capacitivo</b>: el diafragma se acerca a una placa y cambia la capacitancia. Es la celda típica de los transmisores diferenciales.',
          '<b>Piezoeléctrico</b>: un cristal genera carga al deformarse, pero se fuga: solo mide presiones que cambian rápido.'
        ] },
      { id: 'c2-planta', tipo: 'explica', ciclo: 2, titulo: 'Así se ve en planta: instalación, accesorios y selección', diagrama: 'plantaP',
        ideas: [
          'Punto de medición: <b>toma → válvula de bloqueo → línea de impulso → manifold → transmisor</b>.',
          'La toma va al costado en líquidos y arriba en gases. Cada metro de agua en la línea suma ≈ 9,8 kPa.',
          'Accesorios según el fluido: <b>sifón</b> (vapor), <b>sello de diafragma</b> (pulpa o corrosivo), <b>amortiguador</b> (pulsaciones).',
          'Para elegir: tipo, <b>rango</b> (presión normal cerca de la mitad de la escala), tecnología, material, conexión, señal y ambiente (IP, Ex).'
        ] },
      { id: 'c2-explora', tipo: 'explora', ciclo: 2, titulo: 'Explora la presión', diagrama: 'presion',
        guia: [
          'Elige tu ciudad y pulsa <b>Aire libre</b>: el manómetro marca 0. ¿Cuánto vale la presión absoluta? ¿Y en Santa Cruz?',
          'Pon 200 kPa absolutos y cambia de ciudad. ¿Qué lectura cambia y cuál no?',
          'Pulsa <b>Olla a presión</b>: ¿a qué temperatura hierve el agua?',
          'Pestaña <b>Presión en un tanque</b>: con 5 m de agua, ¿cuánta presión hay en el fondo? Cierra el tanque con gas: ¿qué transmisor sigue dando bien el nivel?'
        ] },
      { id: 'c2-reto', tipo: 'reto', ciclo: 2, titulo: 'Reto 2 · Presión', reto: 'c2-reto' },
      { id: 'c2-revisa', tipo: 'revisa', ciclo: 2, titulo: 'Revisión del Reto 2', reto: 'c2-reto' },

      { id: 'integrador', tipo: 'reto', titulo: 'Reto integrador · El TK-100 por dentro', reto: 'integrador' },
      { id: 'integrador-revisa', tipo: 'revisa', titulo: 'Revisión del reto integrador', reto: 'integrador' },
      { id: 'cierre', tipo: 'cierre', titulo: 'Cierre de la Sesión 2',
        ideas: [
          'Cada sensor se basa en un <b>principio físico</b>: resistencia (RTD), tensión entre metales (termopar), semiconductor (termistor); deformación, capacitancia o carga (presión).',
          'La <b>instalación</b> decide la exactitud: 3 o 4 hilos, cable de compensación, termopozo, toma correcta y accesorios según el fluido.',
          'Muchas fallas se diagnostican por el <b>síntoma</b>: lectura corrida, congelada, lenta o que vibra.',
          'Próxima sesión: <b>sensores de nivel y flujo</b> (miércoles 30/09, 20:00).'
        ] }
    ]
  };

  // ---------- Guion docente extenso (solo se ve en el panel del celular) ----------
  // Estructura: objetivo · pasos (Haz / Di / Pregunta) · preguntas · dudas ("Si preguntan…") · transicion
  const GUION = {
    inicio: { min: 4,
      objetivo: 'Que todos entren con su carnet y sepan qué van a aprender hoy.',
      pasos: [
        '<b>Haz:</b> comparte en Zoom la pantalla de la presentación. Aparece el código QR y el enlace.',
        '<b>Haz:</b> pega en el chat el enlace de estudiantes (botón "Copiar enlace de estudiantes" de este panel).',
        '<b>Di:</b> "Buenas noches. Entren con el QR o el enlace del chat, con <b>el mismo carnet</b> de la Sesión 1."',
        '<b>Di:</b> "Hoy vamos a ver <b>cómo funciona por dentro</b> un sensor de temperatura y uno de presión, <b>cómo se conectan</b>, <b>cómo se ven en una planta</b>, <b>cómo se eligen</b> y <b>cómo se diagnostica</b> cuando fallan."',
        '<b>Di:</b> "Hoy no hay pausa: la clase es intensa, así que les pido tener el dispositivo a mano todo el tiempo."',
        '<b>Haz:</b> mira el contador de "Conectados" arriba en este panel.'
      ],
      dudas: [
        '"No me carga la página" → que recarguen; si sigue, que entren desde el celular con datos móviles.',
        '"Me equivoqué de carnet" → botón "Salir" arriba a la derecha y vuelven a entrar.'
      ],
      transicion: 'Cuando la mayoría esté conectada (mira "Conectados"), toca <b>Siguiente</b>.' },

    diagnostico: { min: 5,
      objetivo: 'Refrescar dos ideas de la Sesión 1 y descubrir qué saben de temperatura y presión.',
      pasos: [
        '<b>Di:</b> "Cinco preguntas rápidas: dos de repaso y tres de lo que viene. <b>No tienen nota</b>. Tienen 3 minutos."',
        '<b>Haz:</b> toca la pestaña <b>Pizarra → Diagnóstico</b> para ver el porcentaje de aciertos por pregunta.',
        '<b>Di</b> (pregunta 1): "±0,5 % de un span de 200 °C es ±1 °C: el error se calcula sobre el span."',
        '<b>Di</b> (pregunta 2): "El controlador <b>compara</b> la medición con el setpoint y <b>decide</b>; la válvula es la que actúa."',
        '<b>Di:</b> "Las preguntas 3, 4 y 5 las vamos a descubrir hoy. La 5 es interesante: ¿por qué el agua hierve a ≈ 90 °C en Sucre?"'
      ],
      dudas: ['"¿Cuenta para la nota?" → No, es solo para saber desde dónde partir.'],
      transicion: 'Con ~80 % de respuestas, toca <b>Siguiente</b>.' },

    'c1-principio': { min: 13,
      objetivo: 'Que entiendan QUÉ fenómeno físico usa cada sensor de temperatura, manipulándolo en el diagrama.',
      pasos: [
        '<b>Pregunta al grupo:</b> "¿Cómo sabe un horno o una caldera a qué temperatura está? ¿Qué cosa cambia con el calor y se puede medir?" Deja 2–3 respuestas en el chat (se dilata, cambia de color, cambia la resistencia…).',
        '<b>Di:</b> "Todo sensor aprovecha algo que cambia con la temperatura. En la industria se usan tres efectos. Veámoslos por dentro."',
        '<b>Haz:</b> pestaña <b>RTD</b>, metal <b>Platino</b>. Mueve la temperatura de 0 a 300 °C despacio.',
        '<b>Di:</b> "Esto es el hilo metálico visto al microscopio. Las bolitas grises son átomos; las azules, electrones que llevan la corriente. Con calor los átomos vibran más, los electrones chocan más y avanzan más lento: <b>la resistencia sube</b>."',
        '<b>Haz:</b> señala la curva: a 0 °C marca 100 Ω. <b>Di:</b> "Por eso se llama Pt100: platino, 100 ohmios a 0 °C. Sube ≈ 0,385 Ω por grado, casi en línea recta."',
        '<b>Haz:</b> toca <b>Níquel</b> y luego <b>Cobre</b>. <b>Di:</b> "El níquel es más sensible pero se curva y tiene rango corto; el cobre es muy lineal pero se oxida. El platino gana: estable, lineal y hasta 600 °C o más. Norma IEC 60751."',
        '<b>Haz:</b> pestaña <b>Termopar</b>, tipo <b>K</b>, unión caliente en 400 °C, unión fría en 25 °C.',
        '<b>Di:</b> "Aquí no hay resistencia: hay <b>dos metales distintos</b> unidos en la punta. Cada metal empuja electrones del lado caliente al frío con distinta fuerza, y la diferencia aparece como milivoltios. El tipo K es cromel con alumel: ≈ 41 µV por grado."',
        '<b>Haz:</b> sube y baja la <b>unión fría</b>. <b>Di:</b> "Miren: la tensión depende de la DIFERENCIA entre las dos uniones. Si no sé a qué temperatura está la unión fría, no sé la del proceso. Eso lo resolvemos en el siguiente paso."',
        '<b>Haz:</b> toca los tipos <b>J, T, E, N, R, S, B</b> y señala la curva resaltada entre las grises. <b>Di:</b> "Cada par de metales tiene su rango y su uso: T para frío y alimentos, J para plásticos, K el más usado, N más estable, R y S de platino para vidrio y siderurgia, B para más de 1000 °C. Los colores del cable también son norma (IEC 60584)."',
        '<b>Haz:</b> pestaña <b>Termistor</b>, <b>NTC</b>, temperatura de −40 a 150 °C. <b>Di:</b> "Es un semiconductor: con calor se liberan portadores de carga y la resistencia <b>baja</b>, y muchísimo: unas 10 veces más sensible que la Pt100. Pero es poco lineal y no pasa de ≈ 125 °C."',
        '<b>Haz:</b> toca <b>PTC</b> y pasa de 110 a 130 °C. <b>Di:</b> "El PTC es distinto: casi no cambia y de golpe se dispara. Se usa como interruptor térmico dentro de los motores."'
      ],
      preguntas: [
        '"¿Por qué casi todas las RTD son de platino?" → Estable, no se oxida, lineal y con rango amplio.',
        '"Si la unión fría se calienta, ¿la tensión del termopar sube o baja?" → Baja: depende de la diferencia.'
      ],
      dudas: [
        '"¿El termopar necesita alimentación?" → No: genera su propia tensión (muy pequeña, milivoltios).',
        '"¿Dónde está la unión fría en la práctica?" → En los bornes donde el termopar se conecta al instrumento. Lo vemos en el siguiente paso.',
        '"¿Qué es la Pt1000?" → Igual que la Pt100 pero de 1000 Ω a 0 °C: el cable pesa 10 veces menos en el error.'
      ],
      transicion: '<b>Di:</b> "Ya sabemos cómo funcionan. Ahora, el sensor está en la planta y el transmisor lejos: ¿qué pasa con los cables?" → <b>Siguiente</b>.' },

    'c1-conexion': { min: 9,
      objetivo: 'Que vean DÓNDE aparece el error del cable y por qué existen las conexiones de 3 y 4 hilos y el cable de compensación.',
      pasos: [
        '<b>Haz:</b> pestaña <b>Pt100: 2, 3 y 4 hilos</b>, en <b>2 hilos</b>, cable de 100 m, temperatura 72 °C.',
        '<b>Di:</b> "El transmisor hace pasar una corriente pequeña, 1 mA (línea naranja), y mide la tensión. Tensión entre corriente es resistencia. Pero la corriente recorre también los dos cables."',
        '<b>Haz:</b> señala los recuadros "Rc 2,5 Ω". <b>Di:</b> "Cada conductor de 100 m tiene 2,5 Ω. El transmisor ve 127,8 + 2,5 + 2,5 = 132,8 Ω y cree que el proceso está a <b>85 °C</b> en lugar de 72. ¡13 °C de error solo por el cable!"',
        '<b>Haz:</b> mueve el largo del cable a 0 y a 300 m. <b>Di:</b> "El error crece con el largo. Con 2 hilos no hay forma de separarlo."',
        '<b>Haz:</b> cambia a <b>3 hilos</b>. <b>Di:</b> "Ahora hay un tercer cable por el que no pasa corriente. Con él, el transmisor mide la caída en UNO de los cables (V₂) y la resta dos veces. Error: 0. Es la conexión <b>estándar en la industria</b>."',
        '<b>Haz:</b> sube el <b>borne corroído</b> a 1,5 Ω. <b>Di:</b> "Pero el 3 hilos supone que los dos cables son iguales. Si un borne se corroe con la humedad, ya no lo son y el error vuelve: aquí ≈ 4 °C."',
        '<b>Haz:</b> cambia a <b>4 hilos</b> con el borne corroído. <b>Di:</b> "Con 4 hilos, dos cables llevan la corriente y otros dos solo miden la tensión justo en la Pt100. Por esos casi no pasa corriente, así que su resistencia no importa. Error: 0, aunque los cables sean distintos."',
        '<b>Di:</b> "¿Por qué existe el de 4 si el de 3 funciona? Porque el de 3 <b>supone</b> y el de 4 <b>no supone nada</b>. Se usa en laboratorios, calibración y transferencia de custodia. Y el de 2 solo cuando el transmisor va en el mismo cabezal, con cables de centímetros."',
        '<b>Haz:</b> pestaña <b>Termopar: cable de compensación</b>, cable de <b>cobre común</b>, horno 400 °C, cabezal 45 °C, tablero 22 °C.',
        '<b>Di:</b> "La unión fría está donde termina el metal del termopar. Con cobre, termina en el cabezal, que está al sol a 45 °C. El transmisor compensa 22 °C. Resultado: ≈ 23 °C de error."',
        '<b>Haz:</b> cambia a <b>Cable de compensación tipo K</b>. <b>Di:</b> "Este cable tiene el mismo comportamiento que el termopar: lleva la unión fría hasta el transmisor, que sí la mide. Error: 0. Regla: del termopar al transmisor, siempre cable de compensación del mismo tipo."'
      ],
      preguntas: [
        '"Una Pt100 a 3 hilos empezó a marcar de más después de las lluvias. ¿Qué revisarían?" → Los bornes (corrosión) y la tapa del cabezal.',
        '"¿Qué pasa si conecto un termopar K con cable de cobre?" → La unión fría se muda al cabezal y aparece un error igual a la diferencia de temperatura cabezal–tablero.'
      ],
      dudas: [
        '"¿Cómo sé cuál cable es cuál en una Pt100?" → Por color (IEC 60751): los dos del mismo extremo tienen el mismo color (rojo en uno, blanco en el otro).',
        '"¿El cable de compensación es caro?" → Más que el cobre, pero mucho menos que una medición equivocada.',
        '"¿Y si el termopar se conecta con la polaridad invertida?" → La lectura se va al revés: baja cuando el horno se calienta.'
      ],
      transicion: '<b>Di:</b> "Ya sabemos cómo funciona y cómo se conecta. Ahora veamos cómo se ve realmente en una tubería." → <b>Siguiente</b>.' },

    'c1-planta': { min: 8,
      objetivo: 'Que reconozcan las partes de un punto de medición real y apliquen criterios y normas para elegir el sensor.',
      pasos: [
        '<b>Haz:</b> pestaña <b>Así se ve en planta</b>. <b>Di:</b> "Así se instala una medición de temperatura en una tubería. El sensor es solo una parte."',
        '<b>Haz:</b> toca en orden: <b>Termopozo</b> → <b>Inserto (sensor)</b> → <b>Cuello</b> → <b>Cabezal</b> → <b>Transmisor</b> → <b>Prensaestopas</b> → <b>Cable</b>. Lee en voz alta el "Para qué sirve" de cada uno.',
        '<b>Di</b> (termopozo): "Permite sacar el sensor sin parar ni vaciar la tubería. Pero si el fluido va rápido, los remolinos lo pueden hacer vibrar hasta romperlo: por eso se calcula con la norma ASME PTC 19.3 TW."',
        '<b>Haz:</b> señala las líneas punteadas azules. <b>Di:</b> "La punta debe quedar en el tercio central, donde el fluido representa bien al proceso."',
        '<b>Di</b> (inserto): "Un resorte lo empuja contra el fondo del termopozo. Si no toca, queda aire, que aísla: la lectura se vuelve lenta."',
        '<b>Di</b> (cabezal y transmisor): "El transmisor de cabezal convierte la señal en 4–20 mA ahí mismo: el cable al sensor mide centímetros. El cabezal se elige por su grado IP y, en minas o plantas de gas, debe ser a prueba de explosión (Ex)."',
        '<b>Haz:</b> pestaña <b>Cómo elegir el sensor</b>. Recorre la tabla fila por fila: rango, exactitud, estabilidad, respuesta, vibración, señal, costo, norma, industria.',
        '<b>Haz:</b> en el <b>Asistente</b>, pon "125 a 600 °C" y exactitud "Alta" → recomienda Pt100 clase A. Luego "600 a 1200 °C" → termopar K o N. Luego "≤ 125 °C" + "Costo mínimo" + exactitud "Baja" → termistor.',
        '<b>Di:</b> "La regla corta: <b>exactitud → Pt100; mucho calor → termopar; barato y rango corto → termistor</b>. Y siempre: termopozo, transmisor en cabezal si el tablero está lejos, y certificación Ex si hay atmósfera explosiva."'
      ],
      preguntas: [
        '"¿Qué sensor pondrían en el TT-102 del TK-100 (agua a 72 °C, ±0,5 °C)?" → Pt100 a 3 hilos (o con transmisor de cabezal), en termopozo.',
        '"¿Y en un horno de fundición de cobre a 1150 °C?" → Termopar (K o N; R o S si se necesita más exactitud).'
      ],
      dudas: [
        '"¿Qué significa IP66?" → Protección contra polvo (6: total) y chorros fuertes de agua (6). Norma IEC 60529.',
        '"¿Qué es Ex d?" → Carcasa a prueba de explosión: si algo se enciende dentro, no sale la llama. Norma IEC 60079.',
        '"¿Termopozo o sensor directo?" → Casi siempre termopozo en procesos con presión, velocidad o fluido agresivo.'
      ],
      transicion: '<b>Di:</b> "Ahora les toca a ustedes: 5 minutos para explorar los errores en su dispositivo." → <b>Siguiente</b>.' },

    'c1-explora': { min: 5,
      objetivo: 'Que cada estudiante produzca con sus manos los errores que acabamos de ver.',
      pasos: [
        '<b>Di:</b> "En su dispositivo tienen el diagrama y 4 preguntas. Tienen 4 minutos."',
        '<b>Haz:</b> mientras exploran, lee el chat y responde dudas.',
        '<b>Respuestas esperadas:</b> (1) 200 m a 2 hilos → ≈ 26 °C de error; a 3 hilos, 0. (2) Termopar a 600 °C sin compensación con la bornera a 40 °C → indica ≈ 40 °C menos. (3) El termistor sale de su rango arriba de 125 °C. (4) Pt100 a 3 hilos, por la exactitud.',
        '<b>Haz:</b> pide a 1 o 2 estudiantes que digan su respuesta de la pregunta 4.'
      ],
      transicion: 'Avisa "1 minuto" y toca <b>Siguiente</b>.' },

    'c1-reto': { min: 10,
      objetivo: 'Evaluar cálculo, diagnóstico y selección con valores propios de cada carnet.',
      pasos: [
        '<b>Di:</b> "Cada uno tiene su Pt100, su cable, su termopar, <b>una falla para diagnosticar</b> y una aplicación para elegir sensor. Vale 10 puntos, 2 intentos."',
        '<b>Di:</b> "Antes de enviar, marquen con honestidad si están seguros o tienen dudas: así sé a quién ayudar."',
        '<b>Haz:</b> toca <b>Pizarra</b>. Rojo = se equivocó estando seguro. Toca un nombre para ver qué respondió.',
        '<b>Haz:</b> si ves mucho rojo, da la pista en voz alta: "R = 100·(1 + 0,00385·T); error del cable = 2·Rc ÷ 0,385; termopar: E ÷ 0,041 + bornera. Para la falla: ¿qué parte del punto de medición produce ese síntoma?"'
      ],
      transicion: 'Cuando ~80 % haya enviado, avisa "1 minuto" → <b>Siguiente</b>.' },

    'c1-revisa': { min: 5,
      objetivo: 'Cerrar el ciclo de temperatura corrigiendo los errores más comunes.',
      pasos: [
        '<b>Haz:</b> comenta las barras de resultados de la pantalla.',
        '<b>Di</b> (ejemplo genérico): "72 °C → 100·(1 + 0,00385·72) = <b>127,7 Ω</b>. Cable de 1 Ω por conductor a 2 hilos → 2 ÷ 0,385 = <b>5,2 °C</b> de más. Termopar: 16 mV con la bornera a 25 °C → 16 ÷ 0,041 = 390 → <b>415 °C</b>."',
        '<b>Di</b> (fallas): "Recuerden el patrón: lectura corrida fija → cable o compensación; lectura al extremo → sensor abierto; lectura al revés → polaridad; lectura lenta → termopozo; error que aparece con la humedad → borne corroído."',
        '<b>Haz:</b> pide que revisen en su dispositivo la solución con sus propios valores.'
      ],
      transicion: '<b>Di:</b> "Pasamos a presión. Empezamos con una pregunta de cocina." → <b>Siguiente</b>.' },

    'c2-tipos': { min: 7,
      objetivo: 'Distinguir presión absoluta, manométrica y diferencial, y entender el efecto de la altura en Bolivia.',
      pasos: [
        '<b>Pregunta al grupo:</b> "¿Por qué en Sucre los fideos tardan más en cocerse que en Santa Cruz?" Deja responder en el chat.',
        '<b>Haz:</b> pestaña <b>Absoluta y manométrica</b>, ciudad <b>Sucre</b>, botón <b>Aire libre</b>.',
        '<b>Di:</b> "El manómetro marca 0, pero sí hay presión: el aire pesa ≈ 72 kPa. La <b>absoluta</b> se mide desde el vacío total; la <b>manométrica</b>, desde la atmósfera del lugar. P<sub>abs</sub> = P<sub>man</sub> + P<sub>atm</sub>."',
        '<b>Haz:</b> cambia a <b>Santa Cruz</b> y a <b>La Paz</b>. <b>Di:</b> "La atmósfera baja con la altura. Por eso en Sucre el agua hierve a ≈ 91 °C: los fideos se cocinan a menor temperatura."',
        '<b>Haz:</b> pon el deslizador en 200 kPa absolutos y cambia de ciudad. <b>Di:</b> "La absoluta no cambia; la manométrica sí. Si un equipo debe dar lo mismo en cualquier ciudad, se mide absoluta."',
        '<b>Haz:</b> botón <b>Olla a presión</b>. <b>Di:</b> "La olla sube la presión 1 bar y el agua hierve a ≈ 115 °C: cocina más rápido. Temperatura y presión van juntas."',
        '<b>Di:</b> "Las unidades: 1 bar = 100 kPa ≈ 14,5 psi ≈ 10,2 metros de columna de agua. Y la <b>diferencial</b> es la resta entre dos puntos: filtros, nivel, flujo."',
        '<b>Haz:</b> pestaña <b>Presión en un tanque</b>, nivel 5 m. <b>Di:</b> "5 m de agua empujan ≈ 49 kPa en el fondo: P = ρ·g·h. Así se mide nivel, lo vemos mañana."'
      ],
      preguntas: ['"Un transmisor marca 71,8 kPa con la tubería vacía en Sucre. ¿Qué tipo es?" → Absoluto.'],
      dudas: [
        '"¿kg/cm² es lo mismo que bar?" → Casi: 1 kg/cm² ≈ 0,98 bar.',
        '"¿Y el vacío?" → Es una presión manométrica negativa: por debajo de la atmósfera.'
      ],
      transicion: '<b>Di:</b> "Bien, ¿y cómo hace un sensor para sentir la presión?" → <b>Siguiente</b>.' },

    'c2-principio': { min: 11,
      objetivo: 'Que entiendan el fenómeno físico de los 4 sensores de presión manipulándolos.',
      pasos: [
        '<b>Haz:</b> pestaña <b>Tubo Bourdon</b>, mueve la presión de 0 a 10 bar despacio.',
        '<b>Di:</b> "Es un tubo curvo de sección aplanada (miren el corte arriba a la izquierda). La presión intenta volverlo redondo y al hacerlo el tubo se endereza. El extremo libre mueve un sector dentado y la aguja. El movimiento real es de milímetros; aquí está exagerado."',
        '<b>Di:</b> "Es el manómetro de toda la vida: no necesita electricidad. Norma EN 837-1 o ASME B40.100."',
        '<b>Haz:</b> pestaña <b>Diafragma con galgas</b>, sube la presión.',
        '<b>Di:</b> "La presión abomba un diafragma. Pegadas encima hay galgas: resistencias muy delgadas. Al estirarse, un conductor se hace más largo y delgado y su resistencia sube; en los bordes se comprimen y baja."',
        '<b>Haz:</b> señala el puente de Wheatstone. <b>Di:</b> "Dos suben y dos bajan: el puente convierte ese cambio pequeñísimo en milivoltios." Cambia a <b>Silicio piezorresistivo</b>: "El silicio es ≈ 50 veces más sensible a la deformación y da unas 10 veces más señal. Es lo que tienen la mayoría de los transmisores de presión."',
        '<b>Haz:</b> pestaña <b>Capacitivo</b>. Sube H y baja L.',
        '<b>Di:</b> "Un condensador son dos placas: si cambia la distancia, cambia la capacitancia. El diafragma rojo se acerca a una placa y se aleja de la otra. La presión llega por aceite, así el fluido nunca toca el sensor."',
        '<b>Haz:</b> botón <b>Subir las dos +100 kPa</b>. <b>Di:</b> "La diferencia no cambia y el diafragma no se mueve: por eso es la celda de los transmisores <b>diferenciales</b> (nivel, flujo, filtros). Muy exactos y estables."',
        '<b>Haz:</b> pestaña <b>Piezoeléctrico</b>, modo <b>Constante</b>. <b>Di:</b> "El cuarzo genera carga al deformarse… pero miren la línea naranja: se cae aunque la presión siga. La carga se fuga."',
        '<b>Haz:</b> cambia a <b>Pulsante</b>. <b>Di:</b> "Con presión que cambia rápido la sigue perfecto. Se usa en motores, explosiones y golpe de ariete, nunca para la presión normal de un proceso."'
      ],
      preguntas: [
        '"¿Qué sensor usarían para medir la presión dentro del cilindro de un motor diésel?" → Piezoeléctrico.',
        '"¿Y para medir la diferencia de presión antes y después de un filtro?" → Capacitivo diferencial.'
      ],
      dudas: [
        '"¿Qué es el factor de galga?" → Cuánto cambia la resistencia por cada unidad de deformación: ≈ 2 en metal, ≈ 100 en silicio.',
        '"¿Por qué el silicio no se usa siempre?" → Es sensible a la temperatura: hay que compensarlo electrónicamente.'
      ],
      transicion: '<b>Di:</b> "Ahora veamos cómo se instala todo esto en una tubería, y qué cambia según el fluido." → <b>Siguiente</b>.' },

    'c2-planta': { min: 8,
      objetivo: 'Reconocer el punto de medición de presión, sus accesorios según el fluido, y los criterios y normas para elegir.',
      pasos: [
        '<b>Haz:</b> pestaña <b>Así se ve en planta</b>, fluido <b>Agua limpia</b>. Toca en orden: <b>Toma</b> → <b>Válvula de bloqueo</b> → <b>Línea de impulso</b> → <b>Manifold</b> → <b>Transmisor</b> → <b>Manómetro</b>.',
        '<b>Di:</b> "La toma va al costado: arriba entraría aire y abajo se tapa con sedimentos. Miren el corte de la tubería a la derecha: verde es donde va."',
        '<b>Di</b> (línea de impulso): "Si el transmisor queda más abajo que la toma, la columna de agua suma ≈ 9,8 kPa por metro. Es un error clásico de instalación."',
        '<b>Di</b> (manifold): "Permite aislar, purgar y verificar el cero sin desmontar. En diferenciales tiene una válvula ecualizadora que protege de la sobrepresión de un solo lado."',
        '<b>Haz:</b> toca <b>Gas o aire comprimido</b>. <b>Di:</b> "En gases la toma va arriba, para que el agua condensada vuelva a la tubería."',
        '<b>Haz:</b> toca <b>Vapor</b> y luego el <b>Sifón</b>. <b>Di:</b> "El vapor dañaría el Bourdon. El sifón se llena de condensado frío que lo protege."',
        '<b>Haz:</b> toca <b>Pulpa de mineral o químico</b> y luego el <b>Sello de diafragma</b>. <b>Di:</b> "En minería, una línea de impulso con pulpa se tapa en semanas. El sello pone un diafragma al ras de la toma y la presión viaja por aceite en un capilar."',
        '<b>Haz:</b> toca <b>Descarga de bomba de pistón</b> y luego el <b>Amortiguador</b>. <b>Di:</b> "Las pulsaciones hacen vibrar la aguja: amortiguador y manómetro con glicerina."',
        '<b>Haz:</b> pestaña <b>Cómo elegir</b>. Recorre las 8 preguntas de la tabla. Resalta la del rango: "que la presión normal quede cerca de la mitad de la escala".',
        '<b>Di:</b> "Normas: EN 837-1 y ASME B40.100 para manómetros, IEC 60770 para transmisores, IP y Ex para el ambiente." Lee la lista de aplicaciones por industria.'
      ],
      preguntas: [
        '"¿Qué instalarían para medir la presión de una línea de pulpa en una planta concentradora?" → Transmisor con sello de diafragma.',
        '"Presión normal de 4 bar: ¿manómetro de 0–6 o de 0–10 bar?" → 0–10 bar (la presión normal queda cerca de la mitad).'
      ],
      dudas: [
        '"¿Qué es ½″ NPT?" → Rosca cónica estándar de media pulgada, la más común en instrumentos.',
        '"¿Por qué no usar siempre sello de diafragma?" → Es más caro, más lento y el capilar introduce errores con la temperatura; se usa solo cuando el fluido lo exige.'
      ],
      transicion: '<b>Di:</b> "Su turno: 5 minutos para explorar la presión en su dispositivo." → <b>Siguiente</b>.' },

    'c2-explora': { min: 5,
      objetivo: 'Que cada estudiante compruebe con el diagrama la relación entre absoluta, manométrica, altura y nivel.',
      pasos: [
        '<b>Di:</b> "4 preguntas en su dispositivo. 4 minutos."',
        '<b>Respuestas esperadas:</b> (1) Al aire libre la absoluta es la atmosférica del lugar: ≈ 72 kPa en Sucre, ≈ 96 kPa en Santa Cruz. (2) Con la absoluta fija, cambia la manométrica. (3) En la olla, el agua hierve a ≈ 115 °C. (4) 5 m de agua ≈ 49 kPa; con el tanque cerrado solo el DP da bien el nivel.',
        '<b>Haz:</b> pregunta a un estudiante de otra ciudad cuánto le dio al aire libre.'
      ],
      transicion: 'Avisa "1 minuto" y toca <b>Siguiente</b>.' },

    'c2-reto': { min: 10,
      objetivo: 'Evaluar unidades, presión absoluta, presión hidrostática, diagnóstico y tipo de medición.',
      pasos: [
        '<b>Di:</b> "Conversión de unidades, presión absoluta en su ciudad, presión en el fondo de un tanque, <b>una falla</b> y el tipo de medición. 10 puntos, 2 intentos."',
        '<b>Di:</b> "Ojo: la atmósfera es la <b>de la ciudad del enunciado</b>, no 101,3 kPa."',
        '<b>Haz:</b> mira la <b>Pizarra</b>. El rojo en b) casi siempre es por usar 101,3 kPa o mezclar bar con kPa.'
      ],
      transicion: 'Con ~80 % enviado, avisa "1 minuto" → <b>Siguiente</b>.' },

    'c2-revisa': { min: 5,
      objetivo: 'Cerrar el ciclo de presión.',
      pasos: [
        '<b>Haz:</b> comenta las barras de resultados.',
        '<b>Di</b> (ejemplo genérico): "60 psi × 0,0689 = <b>4,14 bar</b>. En Sucre, 3 bar manométricos → 300 + 71,8 = <b>371,8 kPa abs</b>. 4 m de agua → 1000 × 9,81 × 4 ÷ 1000 = <b>39,2 kPa</b>."',
        '<b>Di</b> (fallas): "Lectura congelada → toma o válvula; aguja que vibra → pulsaciones; marca la atmósfera al aire → es absoluto; transmisor más abajo que la toma → columna de líquido; vapor → sifón; pulpa → sello."'
      ],
      transicion: '<b>Di:</b> "Último reto: volvemos al TK-100, vale 20 puntos." → <b>Siguiente</b>.' },

    integrador: { min: 10,
      objetivo: 'Integrar temperatura, presión, nivel y diagnóstico en la planta de la Sesión 1.',
      pasos: [
        '<b>Di:</b> "Volvemos al TK-100 de la Sesión 1, ahora por dentro. Son 5 preguntas y vale <b>20 puntos</b>. Tienen 8 minutos."',
        '<b>Di:</b> "Sugiero este orden: 1 (temperatura), 2 (presión absoluta), 3 (nivel), 4 (falla) y 5 (tipo de transmisor)."',
        '<b>Haz:</b> avisa a los 6 minutos: "2 minutos".'
      ],
      transicion: 'A los 8–9 minutos → <b>Siguiente</b>.' },

    'integrador-revisa': { min: 3,
      objetivo: 'Cerrar el integrador con la pregunta que más cuesta.',
      pasos: [
        '<b>Di</b> (pregunta 3): "29 kPa con agua caliente → h = 29 000 ÷ (978 × 9,81) = <b>3,02 m</b>. Ojo: kPa a Pa, por mil."',
        '<b>Di</b> (pregunta 5): "Con el tanque presurizado, solo el diferencial resta la presión del gas."'
      ],
      transicion: '→ <b>Siguiente</b>.' },

    cierre: { min: 2,
      objetivo: 'Dejar las 4 ideas clave y anunciar la próxima sesión.',
      pasos: [
        '<b>Haz:</b> lee las 4 ideas que aparecen en pantalla.',
        '<b>Di:</b> "Mañana, miércoles a las 20:00: <b>sensores de nivel y flujo</b>. Piensen cómo se mide el nivel de un tanque en su trabajo o en su casa."',
        '<b>Di:</b> "Pueden repasar hoy con el botón <b>Repasar</b> de la página del módulo."',
        '<b>Después de clase:</b> Reporte → <b>Descargar para Excel</b>.'
      ] }
  };
  II.SESIONES['ii-s2'].pasos.forEach((p) => { p.guion = GUION[p.id]; });
})();
