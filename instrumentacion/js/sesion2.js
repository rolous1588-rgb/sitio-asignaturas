// ============================================================
// Sesión 2 — Sensores de temperatura y presión
// Martes 29/09 · 20:00–22:00 (2 h)
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

  const retos = {
    'c1-reto': {
      titulo: 'Reto 1 · Sensores de temperatura',
      puntos: 10,
      general: 'Cada estudiante recibe su propia Pt100, su propio cable y su propio termopar: calcula la resistencia, el error del cable y la temperatura, y elige el sensor adecuado.',
      pista: 'Pt100: R = 100 · (1 + 0,00385 · T). A 2 hilos el cable suma 2 × (resistencia de un conductor), y cada 0,385 Ω equivale a 1 °C. Termopar: T = E ÷ 0,041 + temperatura de la bornera.',
      errorComun: 'En el termopar, olvidar sumar la temperatura de la bornera: el termopar solo "ve" la DIFERENCIA entre la unión caliente y la unión fría.',
      metodo: 'Pt100: R = 100 · (1 + 0,00385 · T) · Error a 2 hilos = 2 · Rc ÷ 0,385 [°C] · Termopar K: T = E ÷ 0,041 + T bornera · Exactitud → Pt100; mucho calor → termopar; barato y rango corto → NTC',
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
            { id: 's', tipo: 'select', pregunta: 'd) ' + II.esc(sit) + '<br><span class="nota">¿Qué sensor elegirías?</span>', opciones: SENSORES_T }
          ],
          esperado: { r: R, e: errC, t: Tp, s: tipo },
          solucion: `
            <p><b>a)</b> R = 100 · (1 + 0,00385 · ${II.fmt(T)}) = <b>${II.fmt(R, 2)} Ω</b></p>
            <p><b>b)</b> A 2 hilos el transmisor también mide los dos conductores: 2 × ${II.fmt(Rc)} = ${II.fmt(2 * Rc)} Ω. Como la Pt100 cambia 0,385 Ω por °C: ${II.fmt(2 * Rc)} ÷ 0,385 = <b>${II.fmt(errC, 2)} °C</b> de más. A 3 o 4 hilos este error desaparece.</p>
            <p><b>c)</b> El termopar mide la diferencia: ${II.fmt(E)} ÷ 0,041 = ${II.fmt(dT, 1)} °C por encima de la bornera → T = ${II.fmt(dT, 1)} + ${II.fmt(Tf)} = <b>${II.fmt(Tp, 1)} °C</b></p>
            <p><b>d) ${tipo}</b>: ${RAZON_T[tipo]}</p>`
        };
      }
    },

    'c2-reto': {
      titulo: 'Reto 2 · Presión',
      puntos: 10,
      general: 'Convierte unidades, calcula la presión absoluta en tu ciudad y la presión en el fondo de un tanque, y elige el tipo de medición correcto.',
      pista: '1 psi = 0,0689 bar y 1 bar = 100 kPa. P_abs = P_man + P_atm (en las mismas unidades). Presión de un líquido: P = ρ · g · h con g = 9,81 m/s²; divide entre 1000 para tenerla en kPa.',
      errorComun: 'Usar la presión atmosférica del nivel del mar (101,3 kPa) en una ciudad de altura, o sumar bar con kPa sin convertir.',
      metodo: '1 psi = 0,0689 bar · P_abs = P_man × 100 + P_atm [kPa] · P = ρ · 9,81 · h ÷ 1000 [kPa] · Filtro, nivel en tanque cerrado, placa orificio → diferencial',
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
            { id: 't', tipo: 'select', pregunta: 'd) ' + II.esc(sit) + '<br><span class="nota">¿Qué tipo de medición de presión corresponde?</span>', opciones: TIPOS_P }
          ],
          esperado: { b: bar, a: pabs, h: ph, t: tipo },
          solucion: `
            <p><b>a)</b> ${II.fmt(psi)} psi × 0,0689 = <b>${II.fmt(bar, 3)} bar</b></p>
            <p><b>b)</b> ${II.fmt(pman)} bar = ${II.fmt(pman * 100)} kPa → P_abs = ${II.fmt(pman * 100)} + ${II.fmt(pa, 1)} = <b>${II.fmt(pabs, 1)} kPa</b> (en ${ciudad}, no 101,3 kPa)</p>
            <p><b>c)</b> P = ρ · g · h = ${rho} × 9,81 × ${II.fmt(h)} = ${II.fmt(rho * 9.81 * h, 0)} Pa = <b>${II.fmt(ph, 2)} kPa</b></p>
            <p><b>d) ${tipo}</b>: ${RAZON_P[tipo]}</p>`
        };
      }
    },

    integrador: {
      titulo: 'Reto integrador · El TK-100 por dentro',
      puntos: 20,
      general: 'Volvemos al tanque TK-100 de la Sesión 1: temperatura con Pt100, presión absoluta y manométrica, y un adelanto de cómo se mide el nivel.',
      pista: 'Resuelve por partes. Pt100: T = (R ÷ 100 − 1) ÷ 0,00385. P_abs = P_man × 100 + P_atm. Nivel: h = P ÷ (ρ · 9,81), con P en Pa. Termopar sin compensación: indica la temperatura real MENOS la de la bornera.',
      errorComun: 'En la pregunta 4, dejar la presión en kPa (hay que pasarla a Pa multiplicando por 1000) o usar ρ = 1000 en vez de la densidad del agua caliente.',
      metodo: 'T = (R ÷ 100 − 1) ÷ 0,00385 · Abierto al aire → manómetro marca 0 · P_abs = P_man × 100 + P_atm [kPa] · h = P × 1000 ÷ (ρ · 9,81) [m] · Termopar sin compensar ≈ T − T bornera · Tanque cerrado y presurizado → diferencial',
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
        const Tf = II.elegir(r, [20, 24, 28, 32]);
        const Tsin = Tc - Tf;
        const OPC_Q2 = ['0 bar', `La presión atmosférica de ${ciudad}`, '1 bar'];
        return {
          enunciado: `
            <p>El tanque <b>TK-100</b> de la Sesión 1 está en una planta de <b>${ciudad}</b> (presión atmosférica: ${V(pa, 'kPa')}). Está <b>abierto</b> y contiene agua caliente (ρ = ${V(rho, 'kg/m³')}).</p>
            <p>• El <b>TT-102</b> es una Pt100 conectada a 3 hilos y hoy mide ${V(R, 'Ω')}.<br>
            • El <b>PT-103</b> es un transmisor <b>manométrico</b> en la descarga de la bomba y marca ${V(pman, 'bar')}.<br>
            • El <b>LT-101</b> mide la presión que hace el agua en el fondo del tanque: ${V(pf, 'kPa')}.</p>`,
          campos: [
            { id: 'q1', tipo: 'num', pregunta: '1) ¿A qué temperatura está el agua según el TT-102?', unidad: '°C', tolRel: 0.01 },
            { id: 'q2', tipo: 'select', pregunta: '2) Con la bomba apagada y la toma del PT-103 abierta al ambiente, ¿qué marcaría el PT-103?', opciones: OPC_Q2 },
            { id: 'q3', tipo: 'num', pregunta: '3) En operación, ¿cuál es la presión <b>absoluta</b> en la descarga de la bomba?', unidad: 'kPa', tolRel: 0.01 },
            { id: 'q4', tipo: 'num', pregunta: '4) ¿Qué nivel de agua hay en el tanque?', unidad: 'm', tolRel: 0.02 },
            { id: 'q5', tipo: 'num', pregunta: '5) Si el TT-102 fuera un termopar tipo K <b>sin compensación de unión fría</b>, con la bornera a ' + II.fmt(Tf) + ' °C, ¿qué temperatura indicaría aproximadamente?', unidad: '°C', tolRel: 0.03 },
            { id: 'q6', tipo: 'select', pregunta: '6) Si el TK-100 se cerrara y se presurizara con aire, ¿qué tipo de transmisor necesitaría el LT-101 para seguir midiendo bien el nivel?', opciones: ['Manométrico', 'Absoluto', 'Diferencial'] }
          ],
          esperado: { q1: Tc, q2: '0 bar', q3: pabs, q4: h, q5: Tsin, q6: 'Diferencial' },
          solucion: `
            <p><b>1)</b> T = (${II.fmt(R, 2)} ÷ 100 − 1) ÷ 0,00385 = <b>${II.fmt(Tc, 1)} °C</b></p>
            <p><b>2) 0 bar</b>: el PT-103 es manométrico, mide respecto a la atmósfera; al aire libre la diferencia es cero (aunque la presión absoluta sea ${II.fmt(pa, 1)} kPa).</p>
            <p><b>3)</b> P_abs = ${II.fmt(pman)} × 100 + ${II.fmt(pa, 1)} = <b>${II.fmt(pabs, 1)} kPa</b></p>
            <p><b>4)</b> h = P ÷ (ρ · g) = ${II.fmt(pf * 1000, 0)} ÷ (${rho} × 9,81) = <b>${II.fmt(h, 2)} m</b></p>
            <p><b>5)</b> El termopar solo ve la diferencia con la bornera y, sin compensación, el transmisor supone la bornera a 0 °C: ≈ ${II.fmt(Tc, 1)} − ${II.fmt(Tf)} = <b>${II.fmt(Tsin, 1)} °C</b> (¡${II.fmt(Tf)} °C menos!).</p>
            <p><b>6) Diferencial</b>: con el tanque presurizado, el fondo "siente" el gas + el líquido. El diferencial resta la presión de arriba (lado L) y queda solo ρ · g · h.</p>`
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

      { id: 'c1-explica', tipo: 'explica', ciclo: 1, titulo: 'Sensores de temperatura: Pt100, termopar y termistor', diagrama: 'temperatura',
        ideas: [
          'Tres sensores dominan la industria: <b>RTD Pt100</b>, <b>termopar</b> y <b>termistor</b>. Se eligen según rango, exactitud, velocidad y costo.',
          '<b>Pt100</b>: hilo de platino de <b>100 Ω a 0 °C</b> que sube ≈ <b>0,385 Ω por °C</b>. Muy exacta; se conecta a <b>3 o 4 hilos</b> para que el cable no sume error.',
          '<b>Termopar</b>: dos metales distintos generan milivoltios según la diferencia entre la <b>unión caliente</b> y la <b>unión fría</b> (tipo K ≈ 41 µV/°C). Llega a ≈ 1200 °C, pero necesita <b>compensación de unión fría</b>.',
          '<b>Termistor NTC</b>: su resistencia <b>baja</b> mucho al calentarse. Muy sensible y barato, pero de rango corto (−40 a 125 °C) y poco lineal.',
          'En planta el sensor va dentro de un <b>termopozo</b> (vaina): lo protege y permite cambiarlo sin detener el proceso, a cambio de una respuesta más lenta.'
        ] },
      { id: 'c1-explora', tipo: 'explora', ciclo: 1, titulo: 'Explora los sensores de temperatura', diagrama: 'temperatura',
        guia: [
          'Con la <b>Pt100</b>, pon 0 °C y luego 100 °C. ¿Cuántos ohmios marca en cada caso? ¿Cuánto cambia por cada °C?',
          'Conéctala a <b>2 hilos</b> con 100 m de cable. ¿Cuánto error aparece? ¿Qué pasa con 3 hilos?',
          'Con el <b>termopar</b> a 400 °C, desactiva la compensación. ¿Cuánto se equivoca? Mueve la temperatura de la bornera: ¿qué relación encuentras?',
          'Con el <b>termistor</b> a 25 °C, ¿cuántos ohmios cambia por cada °C? ¿Por qué no lo usarías en un horno?'
        ] },
      { id: 'c1-reto', tipo: 'reto', ciclo: 1, titulo: 'Reto 1 · Sensores de temperatura', reto: 'c1-reto' },
      { id: 'c1-revisa', tipo: 'revisa', ciclo: 1, titulo: 'Revisión del Reto 1', reto: 'c1-reto' },

      { id: 'c2-explica', tipo: 'explica', ciclo: 2, titulo: 'Presión: absoluta, manométrica y diferencial', diagrama: 'presion',
        ideas: [
          'Presión = fuerza ÷ área. <b>1 bar = 100 kPa ≈ 14,5 psi ≈ 1,02 kg/cm² ≈ 10,2 m de columna de agua</b>.',
          '<b>Absoluta</b>: se mide desde el vacío total. <b>Manométrica</b>: respecto a la atmósfera del lugar. <b>P<sub>abs</sub> = P<sub>man</sub> + P<sub>atm</sub></b>. <b>Diferencial</b>: la diferencia entre dos puntos.',
          'La atmósfera depende de la altura: ≈ 96 kPa en Santa Cruz, ≈ 72 kPa en Sucre, ≈ 65 kPa en La Paz. Por eso en Sucre el agua hierve cerca de 90 °C.',
          'Sensores: <b>tubo Bourdon</b> (manómetro mecánico), <b>diafragma con galgas piezorresistivas</b>, <b>capacitivo</b> (muy usado en transmisores diferenciales) y <b>piezoeléctrico</b> (solo presiones que cambian rápido).',
          'Un líquido empuja más cuanto más profundo: <b>P = ρ · g · h</b>. Así se mide el nivel (Sesión 3).'
        ] },
      { id: 'c2-explora', tipo: 'explora', ciclo: 2, titulo: 'Explora la presión', diagrama: 'presion',
        guia: [
          'Elige tu ciudad y pulsa <b>Aire libre</b>: el manómetro marca 0. ¿Cuánto vale la presión absoluta? ¿Y en Santa Cruz?',
          'Pon 200 kPa absolutos y cambia de ciudad. ¿Qué lectura cambia y cuál no? ¿Por qué?',
          'Pulsa <b>Olla a presión</b>: ¿a qué temperatura hierve el agua? Compárala con el aire libre en La Paz.',
          'Pestaña <b>Presión en un tanque</b>: con 5 m de agua, ¿cuánta presión hay en el fondo? Cierra el tanque con gas a 50 kPa: ¿qué transmisor sigue dando bien el nivel?'
        ] },
      { id: 'c2-reto', tipo: 'reto', ciclo: 2, titulo: 'Reto 2 · Presión', reto: 'c2-reto' },
      { id: 'c2-revisa', tipo: 'revisa', ciclo: 2, titulo: 'Revisión del Reto 2', reto: 'c2-reto' },

      { id: 'pausa', tipo: 'pausa', titulo: 'Pausa', minutos: 5 },

      { id: 'integrador', tipo: 'reto', titulo: 'Reto integrador · El TK-100 por dentro', reto: 'integrador' },
      { id: 'integrador-revisa', tipo: 'revisa', titulo: 'Revisión del reto integrador', reto: 'integrador' },
      { id: 'cierre', tipo: 'cierre', titulo: 'Cierre de la Sesión 2',
        ideas: [
          '<b>Pt100</b> para exactitud, <b>termopar</b> para altas temperaturas, <b>termistor</b> para rangos cortos y bajo costo.',
          'La Pt100 a 2 hilos suma el error del cable; el termopar necesita <b>compensación de unión fría</b>.',
          '<b>P<sub>abs</sub> = P<sub>man</sub> + P<sub>atm</sub></b>, y la atmósfera cambia con la altura: en Bolivia eso importa.',
          'La presión en el fondo de un tanque es <b>ρ · g · h</b>: la base para medir nivel. Próxima sesión: <b>sensores de nivel y flujo</b> (miércoles 30/09, 20:00).'
        ] }
    ]
  };

  // ---------- Guion docente: qué decir y en qué orden (solo se ve en el panel del celular) ----------
  const GUION = {
    inicio: { min: 5, puntos: [
      'Saluda y recuerda la dinámica: <b>explico → exploran → reto → revisamos</b>. Hoy: <b>sensores de temperatura y presión</b>.',
      'Pide que entren con el QR o el enlace del chat usando <b>el mismo carnet</b> de la Sesión 1.',
      'Retoma en una frase lo que más les costó en la Sesión 1.',
      'Cuando la mayoría esté conectada → <b>Siguiente</b>.'
    ] },
    diagnostico: { min: 10, puntos: [
      '"Cinco preguntas: dos de repaso y tres de lo que viene. <b>No tienen nota</b>."',
      'Dales 4 minutos. Mira <b>Pizarra → Diagnóstico</b>.',
      'Comenta en voz alta las 2 de repaso: ±0,5 % de 200 °C = <b>±1 °C</b>; el controlador <b>compara y decide</b>.',
      'No resuelvas la 3, 4 y 5: "lo vamos a ver hoy". La 5 (el agua hierve cerca de 90 °C en Sucre) es el gancho del Ciclo 2.'
    ] },
    'c1-explica': { min: 12, puntos: [
      'Pregunta de arranque: <b>"¿Cómo sabe un horno o una caldera a qué temperatura está?"</b> Pide 2–3 ejemplos de sus industrias en el chat.',
      'Botón <b>RTD Pt100</b>: lleva el deslizador a 0 °C (100 Ω) y a 100 °C (≈ 138,5 Ω). "Sube casi 0,39 Ω por grado: es casi una recta."',
      'Cambia a <b>2 hilos</b> (el cable está en 100 m): aparece un error de ≈ <b>13 °C</b>. Vuelve a <b>3 hilos</b>: desaparece. "Por eso en planta se usan 3 o 4 hilos."',
      'Botón <b>Termopar tipo K</b>: sube a 400 °C (≈ 16 mV). Explica que mide una <b>diferencia</b> entre la unión caliente y la bornera.',
      '<b>Desactiva la compensación</b> con la bornera a 25 °C: indica casi 25 °C menos. "El transmisor debe medir la bornera y sumarla."',
      'Botón <b>Termistor NTC</b>: la curva baja; es muy sensible cerca de 25 °C, pero se sale de rango arriba de 125 °C.',
      'Cierra con la regla: <b>exactitud → Pt100; mucho calor → termopar; barato y rango corto → termistor</b>. Menciona el termopozo.'
    ] },
    'c1-explora': { min: 7, puntos: [
      '"Ahora ustedes: hagan las 4 experiencias de la guía en su dispositivo."',
      'Respuestas: 100 Ω y 138,5 Ω (≈ 0,385 Ω/°C); a 2 hilos con 100 m ≈ 13 °C de error; sin compensación el termopar indica la temperatura real <b>menos</b> la de la bornera.',
      'Pregunta a 1 o 2 estudiantes qué sensor usan en su planta y por qué.',
      'Avisa "1 minuto" → <b>Siguiente</b>.'
    ] },
    'c1-reto': { min: 10, puntos: [
      '"Cada uno tiene su Pt100, su cable y su termopar: 3 cálculos y una elección."',
      'Si ves mucho rojo, da la pista en voz alta: <b>R = 100·(1 + 0,00385·T)</b>; error del cable = <b>2·Rc ÷ 0,385</b>; termopar: <b>E ÷ 0,041 + bornera</b>.',
      'En la pizarra, el error típico está en la c): olvidar sumar la bornera.',
      'Cuando ~80 % haya enviado → <b>Siguiente</b>.'
    ] },
    'c1-revisa': { min: 6, puntos: [
      'Comenta los resultados en pantalla.',
      'Resuelve uno genérico: 72 °C → 100·(1 + 0,00385·72) = <b>127,7 Ω</b>. Cable de 1 Ω por conductor a 2 hilos → 2 ÷ 0,385 = <b>5,2 °C</b> de más.',
      'Termopar: 16 mV con la bornera a 25 °C → 16 ÷ 0,041 = 390 °C sobre la bornera → <b>415 °C</b>.'
    ] },
    'c2-explica': { min: 12, puntos: [
      'Gancho: <b>"¿Por qué en Sucre los fideos tardan más en cocerse que en Santa Cruz?"</b> Deja que respondan en el chat.',
      'Pestaña <b>Absoluta y manométrica</b>, ciudad Sucre. Pulsa <b>Aire libre</b>: el manómetro marca 0, pero la absoluta es ≈ 72 kPa. Define absoluta, manométrica y <b>P<sub>abs</sub> = P<sub>man</sub> + P<sub>atm</sub></b>.',
      'Deja fija la absoluta en 200 kPa y cambia a Santa Cruz y a La Paz: <b>la manométrica cambia, la absoluta no</b>.',
      'Pulsa <b>Olla a presión</b>: el agua hierve a ≈ 115 °C → por eso cocina más rápido. Así se unen temperatura y presión.',
      'Señala las unidades del panel: 1 bar = 100 kPa ≈ 14,5 psi ≈ 10,2 m de columna de agua. Nombra los sensores: Bourdon (el del dibujo), diafragma piezorresistivo, capacitivo, piezoeléctrico.',
      'Pestaña <b>Presión en un tanque</b>: 5 m de agua → ≈ <b>49 kPa</b> en el fondo. "P = ρ·g·h: así se mide el nivel; lo vemos mañana." Cierra el tanque con gas: solo el <b>DP</b> sigue dando bien el nivel.'
    ] },
    'c2-explora': { min: 7, puntos: [
      'Pide las 4 experiencias de la guía.',
      'Respuestas: al aire libre la absoluta es la atmosférica del lugar (≈ 72 kPa en Sucre, ≈ 96 kPa en Santa Cruz); con la absoluta fija cambia la manométrica; en la olla hierve a ≈ 115 °C y en La Paz al aire libre a ≈ 88 °C; 5 m de agua ≈ 49 kPa.',
      'Avisa "1 minuto" → <b>Siguiente</b>.'
    ] },
    'c2-reto': { min: 10, puntos: [
      '"Conversión de unidades, presión absoluta en su ciudad, presión en el fondo de un tanque y el tipo de medición."',
      'Recuerda: <b>1 bar = 100 kPa</b>; <b>1 psi = 0,0689 bar</b>; la atmósfera es la <b>de la ciudad del enunciado</b>, no 101,3 kPa.',
      'En la pizarra, el rojo en b) casi siempre es por usar 101,3 kPa o mezclar bar con kPa.'
    ] },
    'c2-revisa': { min: 6, puntos: [
      'Comenta los resultados.',
      'Genérico: 60 psi × 0,0689 = <b>4,14 bar</b>. En Sucre, 3 bar man. → 300 + 71,8 = <b>371,8 kPa abs</b>. 4 m de agua → 1000 × 9,81 × 4 ÷ 1000 = <b>39,2 kPa</b>.',
      'Repasa cuándo es diferencial: filtros, nivel en tanque cerrado, placa orificio (Sesión 3).'
    ] },
    pausa: { min: 5, puntos: [
      'Pausa de 5 minutos: el reloj corre en la pantalla y en sus dispositivos.',
      'Mira <b>Reporte</b> para ver quién no ha enviado.',
      'Al volver → <b>Siguiente</b>.'
    ] },
    integrador: { min: 15, puntos: [
      '"Volvemos al TK-100 de la Sesión 1, ahora por dentro: temperatura, presión y un adelanto de nivel. Vale <b>20 puntos</b>."',
      'Sugiere el orden: 1 y 5 (temperatura), 2 y 3 (presión), 4 y 6 (nivel).',
      'Da 12 minutos; avisa a los 10.'
    ] },
    'integrador-revisa': { min: 5, puntos: [
      'Comenta los resultados.',
      'Pregunta 4 genérica: 29 kPa con agua caliente → h = 29 000 ÷ (978 × 9,81) = <b>3,02 m</b>. Ojo: kPa → Pa (× 1000).',
      'Pregunta 5: sin compensación, el termopar indica la temperatura real <b>menos</b> la de la bornera.'
    ] },
    cierre: { min: 10, puntos: [
      'Repasa las 4 ideas que aparecen en pantalla.',
      'Cada estudiante ve su puntaje de hoy en su dispositivo.',
      'Anuncia la <b>Sesión 3 (miércoles 30/09, 20:00)</b>: nivel y flujo. Pide que piensen cómo se miden en su trabajo.',
      'Recuerda el <b>modo repaso</b> para estudiar después.',
      'Después de clase: <b>Reporte → Descargar para Excel</b>.'
    ] }
  };
  II.SESIONES['ii-s2'].pasos.forEach((p) => { p.guion = GUION[p.id]; });
})();
