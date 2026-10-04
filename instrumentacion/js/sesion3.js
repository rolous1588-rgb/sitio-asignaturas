// ============================================================
// Sesión 3 — Nivel, flujo y señal 4–20 mA
// Domingo 04/10 · 09:00–12:00 (3 h)
// Ciclo: explica → pregunta rápida → explica → pregunta rápida → explora → reto → revisión
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  const V = (x, u = '') => `<span class="valor">${II.fmt(x, 3)}${u ? ' ' + u : ''}</span>`;
  const G = 9.81;
  const LIQUIDOS = [['agua', 1000], ['diésel', 840], ['leche', 1030], ['pulpa de mineral', 1400]];

  // ---------- Reto 1: nivel ----------
  const SENSORES_N = ['Presión hidrostática (DP)', 'Ultrasónico', 'Radar'];
  const APLIC_N = {
    'Presión hidrostática (DP)': [
      'Medir el nivel de un tanque cerrado de agua, presurizado con aire a 3 bar.',
      'Medir el nivel de un tanque cerrado de leche presurizado con nitrógeno, con conexión sanitaria.',
      'Medir el nivel de un tanque cerrado de ácido presurizado, usando sellos de diafragma resistentes a la corrosión.'
    ],
    Ultrasónico: [
      'Medir el nivel de un pozo de agua potable abierto, a temperatura ambiente, con el menor presupuesto y sin tocar el agua.',
      'Medir el nivel de un canal abierto de agua de riego, sin vapor ni espuma, con lo más económico sin contacto.',
      'Medir el nivel de un tanque abierto de agua tratada a temperatura ambiente, barato y sin contacto.'
    ],
    Radar: [
      'Medir el nivel de un tanque de asfalto caliente (≈ 160 °C) lleno de vapores, sin tocar el producto.',
      'Medir el nivel de un reactor con vapor y temperatura que cambia mucho, sin contacto con el líquido.',
      'Medir el inventario de un tanque de combustible de 20 m de alto con la máxima exactitud y sin contacto.'
    ]
  };
  const RAZON_N = {
    'Presión hidrostática (DP)': 'en un tanque cerrado y presurizado, el diferencial resta la presión del gas y queda solo ρ · g · h.',
    Ultrasónico: 'es la opción sin contacto más económica, y aquí no hay vapor, espuma ni cambios fuertes de temperatura.',
    Radar: 'las microondas no se ven afectadas por el vapor ni por la temperatura, y dan la mejor exactitud sin contacto.'
  };
  const CAUSAS_N = [
    'Transmisor manométrico en un tanque cerrado y presurizado',
    'Densidad configurada distinta a la del líquido',
    'Vapor o espuma que debilitan el eco ultrasónico',
    'Nivel dentro de la zona muerta del sensor',
    'Toma del transmisor tapada por sedimentos',
    'Ultrasónico sin compensación de temperatura'
  ];
  const SINTOMAS_N = [
    ['En un tanque cerrado, cada vez que sube la presión del gas, el nivel indicado sube aunque no entre líquido.', 0, 'El transmisor del fondo suma la presión del gas a la del líquido: hace falta un DP que la reste.'],
    ['Un tanque se cambió de agua a diésel y desde entonces el nivel indicado es menor que el medido con una varilla.', 1, 'El diésel es menos denso: la misma altura hace menos presión. Hay que configurar ρ = 840 kg/m³.'],
    ['El ultrasónico de un tanque de agua caliente pierde la señal cada vez que el agua hierve y se llena de vapor.', 2, 'El vapor absorbe y desvía el sonido: el eco no vuelve. En ese tanque corresponde un radar.'],
    ['Al llenar el tanque casi hasta el techo, el ultrasónico empieza a mostrar lecturas sin sentido.', 3, 'Muy cerca del sensor el eco llega mientras la membrana todavía vibra: es la zona muerta.'],
    ['En un tanque de pulpa, el nivel indicado quedó congelado aunque el tanque se vacía y se llena.', 4, 'Los sólidos se asentaron en la toma y la presión ya no llega al transmisor. Con pulpa se usa sello de diafragma al ras.'],
    ['El nivel que da el ultrasónico de un tanque al aire libre cambia varios centímetros entre la mañana y la tarde, aunque nadie toca el tanque.', 5, 'La velocidad del sonido cambia con la temperatura del aire (≈ 0,6 m/s por °C): sin compensación, la distancia calculada varía.']
  ];

  // ---------- Reto 2: flujo ----------
  const TIPOS_F = ['Placa orificio (ΔP)', 'Turbina', 'Electromagnético'];
  const APLIC_F = {
    'Placa orificio (ΔP)': [
      'Medir vapor saturado a 180 °C a la salida de una caldera.',
      'Medir gas natural en una línea de 6" a la entrada de una planta.',
      'Medir aire comprimido caliente en una línea grande, al menor costo y sin partes móviles.'
    ],
    Turbina: [
      'Medir el despacho de diésel a camiones cisterna, con alta exactitud.',
      'Medir la gasolina de aviación que se carga en un aeropuerto (líquido limpio que no conduce electricidad).',
      'Medir el combustible limpio que entra a un quemador, con buena exactitud y bajo costo.'
    ],
    Electromagnético: [
      'Medir pulpa de mineral en una planta concentradora (abrasiva y conductora).',
      'Medir aguas residuales con sólidos en una planta de tratamiento.',
      'Medir leche en una planta de lácteos, con diseño sanitario y sin partes móviles.'
    ]
  };
  const RAZON_F = {
    'Placa orificio (ΔP)': 'soporta vapor, gas y temperaturas altas, no tiene partes móviles y es la opción más económica en líneas grandes.',
    Turbina: 'es muy exacta con líquidos limpios y poco viscosos; como el líquido no conduce, un magnético no serviría.',
    Electromagnético: 'el líquido conduce, y como no tiene partes móviles ni obstrucción, los sólidos y la abrasión no lo afectan.'
  };
  const CAUSAS_F = [
    'Falta tramo recto antes del caudalímetro',
    'Líquido no conductor en un electromagnético',
    'Tubería parcialmente llena',
    'Rodamientos de la turbina desgastados',
    'Nadie extrae la raíz cuadrada de la ΔP',
    'Placa orificio con el borde gastado o redondeado'
  ];
  const SINTOMAS_F = [
    ['Una placa orificio instalada justo después de un codo da lecturas que no cuadran con el balance de la planta.', 0, 'El codo deja el perfil de velocidad torcido: la placa necesita tramo recto (ISO 5167) o un acondicionador de flujo.'],
    ['Un caudalímetro magnético nuevo, instalado en una línea de diésel, marca cero o valores al azar.', 1, 'El diésel no conduce: no aparece tensión en los electrodos. Para hidrocarburos se usa turbina u otra tecnología.'],
    ['Un magnético instalado en la parte alta de una tubería que descarga a un tanque da valores erráticos cuando el caudal es bajo.', 2, 'En ese punto la tubería no va llena y los electrodos quedan al aire. Se instala en un tramo que sube.'],
    ['Con los meses, la turbina de despacho de combustible marca cada vez menos que la balanza de los camiones.', 3, 'El rotor frenado gira más lento que el líquido: marca de menos. Toca mantenimiento y recalibración.'],
    ['Con el caudal a la mitad del máximo, el PLC muestra apenas un cuarto del caudal de la placa orificio.', 4, 'La ΔP crece con el cuadrado del caudal: si nadie saca la raíz, 50 % de caudal se ve como 25 %.'],
    ['Una placa orificio con años de servicio en agua con arena empezó a marcar de menos.', 5, 'El borde afilado se redondea: produce menos ΔP para el mismo caudal y la lectura baja.']
  ];

  // ---------- Reto 3: lazo 4–20 mA ----------
  const CAUSAS_S = [
    'Cable cortado o fuente apagada (lazo abierto)',
    'El transmisor detectó una falla de su sensor (alarma baja)',
    'La variable superó el rango configurado (saturación)',
    'Resistencia total del lazo demasiado alta',
    'Blindaje del cable conectado a tierra en los dos extremos',
    'Rango configurado distinto en el transmisor y en el PLC'
  ];
  const SINTOMAS_S = [
    ['El PLC lee 0,0 mA en el lazo del LT-101.', 0, 'Sin camino no circula corriente. Como el mínimo normal es 4 mA, 0 mA siempre es falla del lazo.'],
    ['El TT-103 envía 3,6 mA fijos y el PLC muestra una alarma.', 1, 'Según NAMUR NE 43, el transmisor avisa su propia falla llevando la señal a ≤ 3,6 mA.'],
    ['Durante el arranque, el PT-104 se queda clavado en 20,5 mA y no sube más.', 2, '20,5 mA es saturación: la presión pasó el límite superior del rango. El lazo funciona; el rango quedó corto.'],
    ['Después de agregar un indicador en serie al lazo, el transmisor ya no llega a 20 mA cuando el tanque está lleno.', 3, 'Cada equipo en serie suma resistencia: la fuente ya no deja los 12 V mínimos al transmisor cuando pasan 20 mA.'],
    ['La lectura de un transmisor oscila cada vez que arranca una bomba grande cercana.', 4, 'Con el blindaje a tierra en dos puntos circula corriente por la malla (lazo de tierra) e induce ruido. Se aterriza en un solo extremo, en el tablero.'],
    ['Un transmisor de nivel de 0 a 4 m envía 12 mA, pero el PLC muestra 1,5 m en vez de 2 m.', 5, 'El PLC quedó escalado de 0 a 3 m: el rango debe ser el mismo en el transmisor y en el PLC.']
  ];
  const CONCEPTOS_S = [
    ['e) ¿Por qué el rango empieza en 4 mA y no en 0 mA?',
      ['Para distinguir "variable en cero" de "cable cortado" y para alimentar al transmisor', 'Porque 0 mA puede dañar la entrada del PLC', 'Porque así el lazo consume menos energía'], 0,
      'Con 4 mA como cero, 0 mA solo puede ser falla. Además, esos 4 mA mínimos le dan energía al transmisor de 2 hilos.'],
    ['e) ¿Por qué en planta se prefiere 4–20 mA a una señal de 0–10 V?',
      ['La corriente no cambia con la resistencia del cable y resiste mejor el ruido', 'Los PLC no pueden leer voltaje', 'La corriente viaja más rápido por el cable'], 0,
      'En un lazo en serie la misma corriente pasa por todo, así que la resistencia del cable no la altera, y el ruido inducido casi no la mueve.'],
    ['e) En un transmisor "a 2 hilos", ¿de dónde saca su energía?',
      ['De los mismos dos cables que llevan la señal 4–20 mA', 'De una batería interna', 'De un tercer cable de alimentación'], 0,
      'El transmisor de 2 hilos se alimenta del propio lazo: por eso nunca puede consumir menos de ≈ 3,6 mA.']
  ];

  // ---------- Integrador ----------
  const CAUSAS_TK = [
    'Lazo abierto (cable cortado)',
    'Nadie extrae la raíz cuadrada de la ΔP',
    'Densidad configurada distinta a la del líquido',
    'Ruido por blindaje mal aterrizado',
    'Toma del transmisor tapada'
  ];
  const SINTOMAS_TK = [
    ['El PLC muestra el LT-101 en falla y, al medir con el multímetro en serie, la corriente es 0 mA.', 0],
    ['El FT-102 indica 25 % de caudal cuando el caudal real es la mitad del máximo.', 1],
    ['Desde que el TK-100 recibe salmuera (más densa que el agua), el LT-101 indica más nivel que el real.', 2],
    ['La lectura del TT-103 oscila cada vez que arranca la bomba principal.', 3],
    ['El LT-101 marca siempre lo mismo aunque el tanque se vacía; el agua trae sedimentos.', 4]
  ];

  const retos = {
    'c1-reto': {
      titulo: 'Reto 1 · Nivel',
      puntos: 10,
      general: 'Cada estudiante tiene su propio tanque, su propio sensor ultrasónico y su propia falla: calcula el nivel, diagnostica y elige el sensor.',
      pista: 'Presión → nivel: h = P × 1000 ÷ (ρ · 9,81), con P en kPa. Ultrasonido: d = 343 × t ÷ 2 (t en segundos) y nivel = H − d. En un tanque cerrado, el transmisor del fondo suma la presión del gas: réstala antes de calcular.',
      errorComun: 'En el ultrasónico, olvidar dividir entre 2 (el sonido va y vuelve) o dar la distancia d como si fuera el nivel. En el tanque cerrado, no restar la presión del gas.',
      metodo: 'h = P × 1000 ÷ (ρ · 9,81) · d = 343 × t ÷ 2 → nivel = H − d · Tanque cerrado: h = (P − P_gas) × 1000 ÷ (ρ · 9,81) · Falla: síntoma → causa · Cerrado y presurizado → DP; barato y sin vapor → ultrasónico; vapor, calor o exactitud → radar',
      generar(r) {
        const [liq, rho] = II.elegir(r, LIQUIDOS);
        const hA = II.elegir(r, [1.5, 2, 2.5, 3, 3.5, 4, 4.5]);
        const pA = Math.round(((rho * G * hA) / 1000) * 10) / 10;
        const h1 = (pA * 1000) / (rho * G);
        const H = II.elegir(r, [5, 6, 7, 8]);
        const d0 = II.elegir(r, [1.2, 1.8, 2.4, 3, 3.6]);
        const t = Math.round(((2 * d0) / 343) * 1000 * 100) / 100; // ms
        const d = (343 * t) / 1000 / 2;
        const nivelU = H - d;
        const pg = II.elegir(r, [40, 60, 80, 120, 150]);
        const hC = II.elegir(r, [1.5, 2, 2.5, 3, 3.5]);
        const pC = Math.round((pg + (1000 * G * hC) / 1000) * 10) / 10;
        const h3 = ((pC - pg) * 1000) / (1000 * G);
        const sint = II.elegir(r, SINTOMAS_N);
        const tipo = II.elegir(r, SENSORES_N);
        const sit = II.elegir(r, APLIC_N[tipo]);
        return {
          enunciado: `
            <p><b>a)</b> Un tanque <b>abierto</b> contiene ${liq} (ρ = ${V(rho, 'kg/m³')}). El transmisor de presión del fondo marca ${V(pA, 'kPa')}.</p>
            <p><b>b)</b> Un sensor <b>ultrasónico</b> está montado a ${V(H, 'm')} del fondo de otro tanque. El eco vuelve en ${V(t, 'ms')}. Usa 343 m/s para el sonido.</p>
            <p><b>c)</b> Un tanque <b>cerrado</b> de agua (ρ = 1000 kg/m³) tiene gas encima a ${V(pg, 'kPa')}. Un transmisor <b>manométrico</b> en el fondo marca ${V(pC, 'kPa')}.</p>`,
          campos: [
            { id: 'a', tipo: 'num', pregunta: 'a) ¿Qué nivel hay en el tanque abierto?', unidad: 'm', tolRel: 0.02 },
            { id: 'b', tipo: 'num', pregunta: 'b) ¿Qué nivel de líquido mide el ultrasónico?', unidad: 'm', tolRel: 0.02 },
            { id: 'c', tipo: 'num', pregunta: 'c) ¿Qué nivel <b>real</b> hay en el tanque cerrado?', unidad: 'm', tolRel: 0.02 },
            { id: 'f', tipo: 'select', pregunta: 'd) <b>Diagnóstico:</b> ' + II.esc(sint[0]) + '<br><span class="nota">¿Cuál es la causa más probable?</span>', opciones: CAUSAS_N },
            { id: 's', tipo: 'select', pregunta: 'e) ' + II.esc(sit) + '<br><span class="nota">¿Qué sensor de nivel elegirías?</span>', opciones: SENSORES_N }
          ],
          esperado: { a: h1, b: nivelU, c: h3, f: CAUSAS_N[sint[1]], s: tipo },
          solucion: `
            <p><b>a)</b> h = P ÷ (ρ · g) = ${II.fmt(pA * 1000, 0)} Pa ÷ (${rho} × 9,81) = <b>${II.fmt(h1, 2)} m</b></p>
            <p><b>b)</b> El sonido va y vuelve: d = 343 × ${II.fmt(t / 1000, 5)} s ÷ 2 = ${II.fmt(d, 3)} m desde el sensor. Nivel = ${II.fmt(H)} − ${II.fmt(d, 3)} = <b>${II.fmt(nivelU, 2)} m</b></p>
            <p><b>c)</b> El transmisor manométrico suma el gas: líquido = ${II.fmt(pC, 1)} − ${II.fmt(pg)} = ${II.fmt(pC - pg, 1)} kPa → h = ${II.fmt((pC - pg) * 1000, 0)} ÷ (1000 × 9,81) = <b>${II.fmt(h3, 2)} m</b>. (Por eso en un tanque cerrado se usa un DP.)</p>
            <p><b>d) ${CAUSAS_N[sint[1]]}</b>: ${sint[2]}</p>
            <p><b>e) ${tipo}</b>: ${RAZON_N[tipo]}</p>`
        };
      }
    },

    'c2-reto': {
      titulo: 'Reto 2 · Flujo',
      puntos: 10,
      general: 'Cada estudiante tiene su propia placa orificio y su propia turbina: aplica la raíz cuadrada, calcula con pulsos, diagnostica una falla y elige el caudalímetro.',
      pista: 'Placa: Q = Qmáx · √(ΔP ÷ ΔPmáx) y, al revés, ΔP = ΔPmáx · (Q ÷ Qmáx)². Turbina: Q [L/min] = f [Hz] × 60 ÷ K [pulsos/L]. Para elegir: ¿el líquido conduce? ¿es limpio? ¿es vapor o gas?',
      errorComun: 'Tratar la placa orificio como si fuera lineal (olvidar la raíz cuadrada) y, en la turbina, olvidar multiplicar por 60 para pasar de segundos a minutos.',
      metodo: 'Q = Qmáx · √(ΔP ÷ ΔPmáx) · ΔP = ΔPmáx · (Q ÷ Qmáx)² · Turbina: Q = f · 60 ÷ K [L/min] · Falla: síntoma → causa · Vapor o gas → placa; líquido limpio no conductor → turbina; conductor con sólidos o sanitario → magnético',
      generar(r) {
        const qmax = II.elegir(r, [50, 80, 100, 120, 150, 200]);
        const dpmax = II.elegir(r, [20, 25, 40, 50]);
        const fr = II.elegir(r, [0.16, 0.25, 0.36, 0.49, 0.64, 0.81]);
        const dp = Math.round(fr * dpmax * 1000) / 1000;
        const q1 = qmax * Math.sqrt(dp / dpmax);
        const fb = II.elegir(r, [0.3, 0.4, 0.6, 0.7, 0.8, 0.9]);
        const qb = Math.round(qmax * fb * 1000) / 1000;
        const dpb = dpmax * Math.pow(qb / qmax, 2);
        const K = II.elegir(r, [20, 40, 60, 75, 120, 150]);
        const f = II.elegir(r, [10, 15, 20, 25, 30, 40, 50]);
        const qt = (f * 60) / K;
        const sint = II.elegir(r, SINTOMAS_F);
        const tipo = II.elegir(r, TIPOS_F);
        const sit = II.elegir(r, APLIC_F[tipo]);
        return {
          enunciado: `
            <p>Una <b>placa orificio</b> está dimensionada para ${V(qmax, 'm³/h')} con una presión diferencial máxima de ${V(dpmax, 'kPa')}.</p>
            <p><b>a)</b> Hoy el transmisor mide ${V(dp, 'kPa')}.</p>
            <p><b>b)</b> Más tarde el caudal será de ${V(qb, 'm³/h')}.</p>
            <p><b>c)</b> Una <b>turbina</b> tiene un factor K de ${V(K, 'pulsos/L')} y está entregando ${V(f, 'Hz')}.</p>`,
          campos: [
            { id: 'a', tipo: 'num', pregunta: 'a) ¿Qué caudal pasa por la placa?', unidad: 'm³/h', tolRel: 0.02 },
            { id: 'b', tipo: 'num', pregunta: 'b) ¿Qué presión diferencial marcará el transmisor con ese caudal?', unidad: 'kPa', tolRel: 0.02 },
            { id: 'c', tipo: 'num', pregunta: 'c) ¿Qué caudal mide la turbina?', unidad: 'L/min', tolRel: 0.02 },
            { id: 'f', tipo: 'select', pregunta: 'd) <b>Diagnóstico:</b> ' + II.esc(sint[0]) + '<br><span class="nota">¿Cuál es la causa más probable?</span>', opciones: CAUSAS_F },
            { id: 't', tipo: 'select', pregunta: 'e) ' + II.esc(sit) + '<br><span class="nota">¿Qué caudalímetro elegirías?</span>', opciones: TIPOS_F }
          ],
          esperado: { a: q1, b: dpb, c: qt, f: CAUSAS_F[sint[1]], t: tipo },
          solucion: `
            <p><b>a)</b> Q = ${qmax} · √(${II.fmt(dp, 3)} ÷ ${dpmax}) = ${qmax} · √${II.fmt(dp / dpmax, 3)} = ${qmax} × ${II.fmt(Math.sqrt(dp / dpmax), 3)} = <b>${II.fmt(q1, 2)} m³/h</b></p>
            <p><b>b)</b> ΔP = ${dpmax} · (${II.fmt(qb, 3)} ÷ ${qmax})² = ${dpmax} × ${II.fmt(Math.pow(qb / qmax, 2), 4)} = <b>${II.fmt(dpb, 2)} kPa</b></p>
            <p><b>c)</b> Q = ${f} pulsos/s × 60 s/min ÷ ${K} pulsos/L = <b>${II.fmt(qt, 2)} L/min</b></p>
            <p><b>d) ${CAUSAS_F[sint[1]]}</b>: ${sint[2]}</p>
            <p><b>e) ${tipo}</b>: ${RAZON_F[tipo]}</p>`
        };
      }
    },

    'c3-reto': {
      titulo: 'Reto 3 · Señal 4–20 mA',
      puntos: 10,
      general: 'Cada estudiante tiene sus propios transmisores y su propio lazo: convierte entre la variable y los mA, calcula la carga máxima y diagnostica una falla del lazo.',
      pista: 'Variable → mA: I = 4 + 16 · (valor − LRV) ÷ (URV − LRV). mA → variable: valor = LRV + (I − 4) ÷ 16 × (URV − LRV). Carga máxima: R = (V fuente − V mínimo del transmisor) ÷ 0,020 A.',
      errorComun: 'Olvidar restar los 4 mA del cero vivo (usar I ÷ 20) o, en rangos que no empiezan en cero, olvidar sumar el LRV.',
      metodo: 'I = 4 + 16 · (valor − LRV) ÷ span · valor = LRV + (I − 4) ÷ 16 × span · R máx = (24 − V mín) ÷ 0,020 · 0 mA = lazo abierto; ≤ 3,6 o ≥ 21 mA = falla (NAMUR NE 43); 20,5 mA = saturación',
      generar(r) {
        const hmax = II.elegir(r, [3, 4, 5, 6, 8]);
        const h = Math.round(hmax * II.elegir(r, [0.2, 0.3, 0.35, 0.45, 0.6, 0.7, 0.85]) * 100) / 100;
        const iA = 4 + (16 * h) / hmax;
        const [lrv, urv] = II.elegir(r, [[0, 150], [0, 200], [-20, 180], [50, 250], [0, 400]]);
        const iB = II.elegir(r, [6.4, 8, 9.6, 11.2, 13.6, 15.2, 17.6]);
        const tB = lrv + ((iB - 4) / 16) * (urv - lrv);
        const vmin = II.elegir(r, [10.5, 11, 12, 12.5, 13]);
        const rmax = (24 - vmin) / 0.02;
        const sint = II.elegir(r, SINTOMAS_S);
        const con = II.elegir(r, CONCEPTOS_S);
        return {
          enunciado: `
            <p><b>a)</b> El <b>LT-101</b> tiene un rango de 0 a ${V(hmax, 'm')} y el nivel está en ${V(h, 'm')}.</p>
            <p><b>b)</b> El <b>TT-103</b> tiene un rango de ${V(lrv, '°C')} a ${V(urv, '°C')} y está enviando ${V(iB, 'mA')}.</p>
            <p><b>c)</b> Un transmisor de 2 hilos necesita al menos ${V(vmin, 'V')} para funcionar y la fuente del tablero es de 24 V.</p>`,
          campos: [
            { id: 'a', tipo: 'num', pregunta: 'a) ¿Qué corriente envía el LT-101?', unidad: 'mA', tolRel: 0.01 },
            { id: 'b', tipo: 'num', pregunta: 'b) ¿Qué temperatura mide el TT-103?', unidad: '°C', tolRel: 0.01, tolAbs: 0.5 },
            { id: 'c', tipo: 'num', pregunta: 'c) ¿Cuál es la resistencia <b>máxima</b> del lazo (cable + entrada del PLC) para que llegue a 20 mA?', unidad: 'Ω', tolRel: 0.01 },
            { id: 'f', tipo: 'select', pregunta: 'd) <b>Diagnóstico:</b> ' + II.esc(sint[0]) + '<br><span class="nota">¿Cuál es la causa más probable?</span>', opciones: CAUSAS_S },
            { id: 'e', tipo: 'select', pregunta: con[0], opciones: con[1] }
          ],
          esperado: { a: iA, b: tB, c: rmax, f: CAUSAS_S[sint[1]], e: con[1][con[2]] },
          solucion: `
            <p><b>a)</b> I = 4 + 16 × ${II.fmt(h)} ÷ ${hmax} = 4 + ${II.fmt((16 * h) / hmax, 3)} = <b>${II.fmt(iA, 2)} mA</b></p>
            <p><b>b)</b> T = ${lrv} + (${II.fmt(iB)} − 4) ÷ 16 × ${urv - lrv} = ${lrv} + ${II.fmt((iB - 4) / 16, 3)} × ${urv - lrv} = <b>${II.fmt(tB, 1)} °C</b></p>
            <p><b>c)</b> R = (24 − ${II.fmt(vmin)}) ÷ 0,020 = ${II.fmt(24 - vmin)} ÷ 0,020 = <b>${II.fmt(rmax, 0)} Ω</b></p>
            <p><b>d) ${CAUSAS_S[sint[1]]}</b>: ${sint[2]}</p>
            <p><b>e) ${con[1][con[2]]}</b>: ${con[3]}</p>`
        };
      }
    },

    integrador: {
      titulo: 'Reto integrador · El TK-100 se comunica',
      puntos: 20,
      general: 'Volvemos al TK-100: nivel por presión diferencial, su señal 4–20 mA, el caudal de salida por placa orificio, una falla real y una decisión de instrumentación.',
      pista: 'h = ΔP × 1000 ÷ (ρ · 9,81). I = 4 + 16 · h ÷ rango. Placa: Q = Qmáx · √(ΔP ÷ ΔPmáx). Para la falla, piensa en el lazo, la raíz cuadrada, la densidad, el ruido o la toma.',
      errorComun: 'En la pregunta 2, calcular la corriente con el nivel redondeado de más o sin sumar los 4 mA del cero vivo; en la 3, olvidar la raíz cuadrada.',
      metodo: 'h = ΔP × 1000 ÷ (ρ · 9,81) [m] · I = 4 + 16 · h ÷ H máx [mA] · Q = Qmáx · √(ΔP ÷ ΔPmáx) · Falla: síntoma → causa · Pulpa conductora y abrasiva → electromagnético',
      generar(r) {
        const rho = 978;
        const hmax = II.elegir(r, [4, 5, 6]);
        const hR = II.elegir(r, [1.6, 2.2, 2.8, 3.4]);
        const dpL = Math.round(((rho * G * hR) / 1000) * 10) / 10;
        const h = (dpL * 1000) / (rho * G);
        const i = 4 + (16 * h) / hmax;
        const qmax = II.elegir(r, [20, 30, 40, 60]);
        const dpF = II.elegir(r, [4, 9, 12.25, 16]);
        const q = qmax * Math.sqrt(dpF / 25);
        const sint = II.elegir(r, SINTOMAS_TK);
        return {
          enunciado: `
            <p>El tanque <b>TK-100</b> contiene agua caliente (ρ = ${V(rho, 'kg/m³')}) y ahora está <b>cerrado</b>.</p>
            <p>• El <b>LT-101</b> es un transmisor <b>diferencial</b> con rango de 0 a ${V(hmax, 'm')} y hoy mide ${V(dpL, 'kPa')}.<br>
            • El <b>FT-102</b> mide la salida con una placa orificio dimensionada para ${V(qmax, 'm³/h')} a 25 kPa, y hoy mide ${V(dpF, 'kPa')}.</p>`,
          campos: [
            { id: 'q1', tipo: 'num', pregunta: '1) ¿Qué nivel hay en el tanque?', unidad: 'm', tolRel: 0.02 },
            { id: 'q2', tipo: 'num', pregunta: '2) ¿Qué corriente envía el LT-101 al PLC?', unidad: 'mA', tolRel: 0.01 },
            { id: 'q3', tipo: 'num', pregunta: '3) ¿Qué caudal sale del tanque?', unidad: 'm³/h', tolRel: 0.02 },
            { id: 'q4', tipo: 'select', pregunta: '4) <b>Diagnóstico:</b> ' + II.esc(sint[0]) + '<br><span class="nota">¿Cuál es la causa más probable?</span>', opciones: CAUSAS_TK },
            { id: 'q5', tipo: 'select', pregunta: '5) Si el TK-100 pasara a recibir <b>pulpa de mineral</b> (abrasiva y conductora) en vez de agua, ¿qué caudalímetro debería reemplazar a la placa del FT-102?', opciones: TIPOS_F }
          ],
          esperado: { q1: h, q2: i, q3: q, q4: CAUSAS_TK[sint[1]], q5: 'Electromagnético' },
          solucion: `
            <p><b>1)</b> h = ${II.fmt(dpL * 1000, 0)} ÷ (${rho} × 9,81) = <b>${II.fmt(h, 2)} m</b> (el DP ya restó la presión del gas)</p>
            <p><b>2)</b> I = 4 + 16 × ${II.fmt(h, 3)} ÷ ${hmax} = <b>${II.fmt(i, 2)} mA</b></p>
            <p><b>3)</b> Q = ${qmax} · √(${II.fmt(dpF)} ÷ 25) = ${qmax} × ${II.fmt(Math.sqrt(dpF / 25), 2)} = <b>${II.fmt(q, 1)} m³/h</b></p>
            <p><b>4) ${CAUSAS_TK[sint[1]]}</b>.</p>
            <p><b>5) Electromagnético</b>: la pulpa conduce, y al no tener partes móviles ni obstrucción no se desgasta como la placa ni se tapa.</p>`
        };
      }
    }
  };

  // ---------- preguntas rápidas (1 punto cada una) ----------
  const R = (id, ciclo, titulo, t, o, c, por) => ({ id, tipo: 'rapida', ciclo, titulo, t, o, c, por });

  II.SESIONES['ii-s3'] = {
    id: 'ii-s3',
    numero: 3,
    titulo: 'Nivel, flujo y señal 4–20 mA',
    fecha: 'Domingo 04/10 · 09:00–12:00',
    siguiente: 'Sesión 4 · Martes 06/10, 20:00 — Calibración, errores y trazabilidad (con HART)',
    retos,
    diagnostico: [
      { t: '(Repaso) La presión en el fondo de un tanque abierto con 2 m de agua es aproximadamente:', o: ['19,6 kPa', '2 kPa', '196 kPa'], c: 0 },
      { t: '(Repaso) En un tanque cerrado y presurizado, para que el gas no afecte la medición se usa un transmisor:', o: ['Manométrico', 'Absoluto', 'Diferencial'], c: 2 },
      { t: '¿Cómo sabe un murciélago a qué distancia está una pared?', o: ['Por el tiempo que tarda en volver el eco de su sonido', 'Por la temperatura de la pared', 'Por el color de la pared'], c: 0 },
      { t: 'Si por la misma tubería pasa el doble de agua, la velocidad del agua:', o: ['Se duplica', 'No cambia', 'Se reduce a la mitad'], c: 0 },
      { t: 'En un lazo 4–20 mA, ¿qué corriente corresponde al 0 % de la variable?', o: ['0 mA', '4 mA', '20 mA'], c: 1 }
    ],
    pasos: [
      { id: 'inicio', tipo: 'espera', titulo: 'Sesión 3: Nivel, flujo y señal 4–20 mA' },
      { id: 'diagnostico', tipo: 'cuestionario', titulo: 'Repaso y diagnóstico: 5 preguntas' },

      // ---------------- Ciclo 1 · Nivel ----------------
      { id: 'c1-hidro', tipo: 'explica', ciclo: 1, titulo: 'Nivel por presión: tanque abierto, cerrado y densidad', diagrama: 'nivel',
        ideas: [
          'Un líquido hace presión en el fondo según su altura: <b>P = ρ · g · h</b>. Midiendo la presión, se conoce el nivel: <b>h = P ÷ (ρ · g)</b>. Cada metro de agua ≈ 9,81 kPa.',
          '<b>Tanque abierto:</b> basta un transmisor de presión en el fondo (el aire de arriba es la referencia).',
          '<b>Tanque cerrado y presurizado:</b> el fondo siente gas + líquido. Se usa un <b>diferencial (DP)</b>: lado H abajo, lado L arriba; resta el gas y queda solo ρ · g · h.',
          'La medida depende de la <b>densidad</b>: si cambia el líquido, hay que configurar la nueva ρ. Con pulpas o productos sucios se usan <b>sellos de diafragma</b>.'
        ] },
      R('q-n1', 1, 'Pregunta rápida · nivel por presión',
        'Un tanque <b>abierto</b> de agua tiene un transmisor en el fondo que marca <b>29,4 kPa</b>. ¿Qué nivel hay?',
        ['≈ 3 m', '≈ 29,4 m', '≈ 0,3 m', '≈ 2,94 cm'], 0,
        'h = P ÷ (ρ · g) = 29 400 ÷ (1000 × 9,81) ≈ 3,0 m. Atajo: cada metro de agua hace ≈ 9,81 kPa.'),
      R('q-n2', 1, 'Pregunta rápida · tanque cerrado',
        'En un tanque <b>cerrado y presurizado</b>, ¿por qué no basta un transmisor de presión manométrica en el fondo?',
        ['Porque también mide la presión del gas y la confunde con nivel', 'Porque en un tanque cerrado el líquido no hace presión', 'Porque la presión del gas anula la del líquido'], 0,
        'El fondo siente gas + líquido. El DP resta la presión de arriba (lado L) y queda solo ρ · g · h.'),
      { id: 'c1-tof', tipo: 'explica', ciclo: 1, titulo: 'Nivel sin contacto: ultrasonido y radar', diagrama: 'nivelTOF',
        ideas: [
          'Ambos miden el <b>tiempo de vuelo</b>: envían un pulso desde arriba, rebota en la superficie y vuelve. <b>d = v · t ÷ 2</b> y <b>nivel = H − d</b>.',
          '<b>Ultrasónico</b> (sonido, ≈ 343 m/s): económico; pero la velocidad cambia con la temperatura del aire, y el vapor y la espuma debilitan el eco. Tiene <b>zona muerta</b> cerca del sensor.',
          '<b>Radar</b> (microondas, velocidad de la luz): no le afectan la temperatura, la presión ni el vapor. Más caro, pero es la opción para tanques de proceso difíciles.',
          'Ninguno toca el producto: sirven para líquidos corrosivos, sucios o con sólidos. El radar guiado (con varilla o cable) resuelve la espuma y los tanques angostos.'
        ] },
      R('q-n3', 1, 'Pregunta rápida · ultrasonido',
        'Un ultrasónico <b>sin compensación de temperatura</b> se ajustó en una mañana fría. Al mediodía, el aire del tanque está a 35 °C. ¿Qué pasa con su lectura?',
        ['Se corre, porque el sonido viaja más rápido en aire caliente', 'No cambia: el sonido viaja igual siempre', 'Deja de medir por completo'], 0,
        'v ≈ 331 + 0,6 · T m/s: de ≈ 334 m/s a 5 °C a ≈ 352 m/s a 35 °C (≈ 5 %). Por eso traen un sensor de temperatura; el radar no tiene ese problema.'),
      { id: 'c1-explora', tipo: 'explora', ciclo: 1, titulo: 'Explora la medición de nivel', diagrama: 'nivel',
        guia: [
          'Tanque <b>cerrado</b> con 100 kPa de gas: compara el transmisor del fondo con el <b>DP</b>. ¿Cuál dice la verdad?',
          'Cambia el líquido a <b>diésel</b> con el transmisor configurado para agua. ¿Indica de más o de menos? ¿Por qué?',
          'Pestaña de tiempo de vuelo: ultrasónico <b>sin compensación</b> y aire a 50 °C. ¿Cuánto se equivoca?',
          'Agrega <b>vapor</b> y compara ultrasónico contra radar. ¿Cuál usarías en el TK-100 con agua caliente?'
        ] },
      { id: 'c1-reto', tipo: 'reto', ciclo: 1, titulo: 'Reto 1 · Nivel', reto: 'c1-reto' },
      { id: 'c1-revisa', tipo: 'revisa', ciclo: 1, titulo: 'Revisión del Reto 1', reto: 'c1-reto' },

      // ---------------- Ciclo 2 · Flujo ----------------
      { id: 'c2-placa', tipo: 'explica', ciclo: 2, titulo: 'Flujo por presión diferencial: la placa orificio', diagrama: 'flujo',
        ideas: [
          'La placa es un disco con un agujero: el fluido se <b>acelera</b> al pasar y su <b>presión baja</b> (Bernoulli). Un DP mide la diferencia antes y después.',
          'La ΔP crece con el <b>cuadrado</b> del caudal: el doble de caudal da 4 veces la ΔP. Por eso <b>Q = Qmáx · √(ΔP ÷ ΔPmáx)</b>: alguien tiene que sacar la raíz (el transmisor o el PLC).',
          'Ventajas: barata, sin partes móviles, sirve para <b>líquidos, gases y vapor</b> (ISO 5167). Desventajas: pérdida de presión permanente y rango corto (≈ 3:1 a 4:1).',
          'Necesita <b>tramo recto</b> antes y después (codos y válvulas deforman el flujo) y un borde afilado: si se gasta, marca de menos.'
        ] },
      R('q-f1', 2, 'Pregunta rápida · placa orificio',
        'En una placa orificio, si el caudal <b>se duplica</b>, la presión diferencial…',
        ['Se multiplica por 4', 'Se duplica', 'Se reduce a la mitad', 'No cambia'], 0,
        'ΔP ∝ Q²: (2)² = 4. Por eso se dice que la placa es "cuadrática" y hay que sacar la raíz.'),
      R('q-f2', 2, 'Pregunta rápida · raíz cuadrada',
        'Una placa orificio marca el <b>25 %</b> de su ΔP máxima. ¿Qué porcentaje del caudal máximo está pasando?',
        ['50 %', '25 %', '6,25 %', '12,5 %'], 0,
        'Q ÷ Qmáx = √(ΔP ÷ ΔPmáx) = √0,25 = 0,5 → 50 %.'),
      { id: 'c2-otros', tipo: 'explica', ciclo: 2, titulo: 'Turbina y electromagnético: cómo funcionan y cuándo usarlos', diagrama: 'flujoOtros',
        ideas: [
          '<b>Turbina:</b> el líquido hace girar un rotor y un sensor cuenta los álabes. <b>Q = f · 60 ÷ K</b> (K = pulsos por litro, viene en la placa del equipo).',
          'La turbina es muy exacta con <b>líquidos limpios y poco viscosos</b> (combustibles, despacho). Tiene partes móviles: los sólidos y el desgaste la frenan y marca de menos.',
          '<b>Electromagnético:</b> el líquido conductor se mueve dentro de un campo magnético y genera tensión (Faraday): <b>E = B · D · v</b>. Sin partes móviles ni obstrucción.',
          'El magnético exige un <b>líquido conductor</b> (agua, pulpa, leche, ácidos; no hidrocarburos) y la <b>tubería llena</b>. Ideal para pulpas, aguas residuales y alimentos.'
        ] },
      R('q-f3', 2, 'Pregunta rápida · electromagnético',
        '¿Cuál de estos líquidos <b>no</b> se puede medir con un caudalímetro electromagnético?',
        ['Diésel', 'Agua potable', 'Pulpa de mineral', 'Leche'], 0,
        'El magnético necesita que el líquido conduzca electricidad. Los hidrocarburos como el diésel no conducen.'),
      { id: 'c2-explora', tipo: 'explora', ciclo: 2, titulo: 'Explora la medición de flujo', diagrama: 'flujo',
        guia: [
          'Placa orificio al <b>50 %</b> de caudal con "Nadie saca la raíz": ¿qué muestra el PLC? ¿Por qué?',
          'Baja el caudal al <b>10 %</b>: ¿cuánta ΔP queda? ¿Por qué la placa no sirve para caudales muy bajos?',
          'Turbina: activa el <b>rodamiento gastado</b>. ¿Marca de más o de menos?',
          'Magnético: prueba con <b>diésel</b> y con la tubería <b>medio llena</b>. ¿Qué pasa en cada caso?'
        ] },
      { id: 'c2-reto', tipo: 'reto', ciclo: 2, titulo: 'Reto 2 · Flujo', reto: 'c2-reto' },
      { id: 'c2-revisa', tipo: 'revisa', ciclo: 2, titulo: 'Revisión del Reto 2', reto: 'c2-reto' },

      { id: 'pausa', tipo: 'pausa', titulo: 'Pausa', minutos: 10 },

      // ---------------- Ciclo 3 · Señal 4–20 mA ----------------
      { id: 'c3-lazo', tipo: 'explica', ciclo: 3, titulo: 'El lazo 4–20 mA: cómo viaja la medición', diagrama: 'lazo420',
        ideas: [
          'El transmisor convierte la medición en una <b>corriente de 4 a 20 mA</b> que viaja por dos cables hasta el PLC. 4 mA = 0 % del rango; 20 mA = 100 %.',
          'Se usa <b>corriente</b> porque en un lazo en serie pasa la misma por todo: la resistencia del cable no la cambia y el ruido casi no la mueve. El PLC la lee como tensión en una resistencia (250 Ω → 1 a 5 V).',
          'El <b>cero vivo</b> (4 mA) permite detectar fallas: <b>0 mA = lazo abierto</b>. Y esos 4 mA mínimos alimentan al transmisor de <b>2 hilos</b>.',
          'La fuente tiene un límite: el transmisor necesita su tensión mínima (≈ 12 V). <b>Carga máxima = (V fuente − V mínima) ÷ 0,020 A</b> (≈ 600 Ω con 24 V).'
        ] },
      R('q-s1', 3, 'Pregunta rápida · por qué corriente',
        '¿Por qué en planta se transmite en corriente (4–20 mA) y no en voltaje (0–10 V)?',
        ['La corriente no cambia con la resistencia del cable y resiste mejor el ruido', 'Porque la corriente viaja más rápido', 'Porque el voltaje es peligroso para las personas'], 0,
        'En un lazo en serie la misma corriente pasa por todo, así que el cable largo no la altera (si la fuente alcanza), y el ruido inducido casi no la mueve.'),
      R('q-s2', 3, 'Pregunta rápida · 0 mA',
        'El PLC lee <b>0 mA</b> en un lazo 4–20 mA. ¿Qué es lo más probable?',
        ['El lazo está abierto o sin alimentación', 'La variable está en el mínimo de su rango', 'El transmisor está en el máximo de su rango'], 0,
        'El mínimo normal es 4 mA ("cero vivo"). 0 mA significa que no circula corriente: cable cortado, borne suelto, fusible o fuente.'),
      { id: 'c3-escala', tipo: 'explica', ciclo: 3, titulo: 'Escalado y zonas de falla (NAMUR NE 43)', diagrama: 'lazoEscala',
        ideas: [
          'Cada transmisor tiene un <b>rango</b>: LRV (valor inferior, 4 mA) y URV (valor superior, 20 mA). El rango puede no empezar en cero (por ejemplo, −20 a 180 °C).',
          '<b>I = 4 + 16 · (valor − LRV) ÷ (URV − LRV)</b>. En el PLC, al revés: <b>valor = LRV + (I − 4) ÷ 16 × (URV − LRV)</b>. El rango debe ser el mismo en ambos extremos.',
          '<b>NAMUR NE 43:</b> de 3,8 a 20,5 mA la medida es válida (fuera de 4–20 se satura). <b>≤ 3,6 mA o ≥ 21 mA</b> = el transmisor avisa que falló.',
          'En el P&amp;ID la señal 4–20 mA se dibuja como <b>línea punteada</b> entre instrumentos (LT-101 → LIC-101). Lo veremos completo en la última sesión.'
        ] },
      R('q-s3', 3, 'Pregunta rápida · escalado',
        'Un transmisor de <b>0 a 100 °C</b> está enviando <b>12 mA</b>. ¿Qué temperatura mide?',
        ['50 °C', '12 °C', '60 °C', '75 °C'], 0,
        '12 mA está justo a la mitad entre 4 y 20 mA: (12 − 4) ÷ 16 = 0,5 → 50 % del rango = 50 °C.'),
      { id: 'c3-explora', tipo: 'explora', ciclo: 3, titulo: 'Explora el lazo 4–20 mA', diagrama: 'lazo420',
        guia: [
          'Sube el cable a <b>2000 m</b> con 250 Ω: ¿cambia la corriente? Ahora pon <b>750 Ω</b>: ¿qué pasa al 100 %?',
          'Prueba las tres <b>fallas</b>: ¿qué corriente ve el PLC en cada una y cómo distingue cada caso?',
          'Activa la <b>interferencia</b>: compara la señal de voltaje con la de corriente.',
          'Pestaña de escalado: elige el <b>TT-105 (−20 a 180 °C)</b>. ¿Cuántos mA envía a 0 °C? ¿Y a 200 °C?'
        ] },
      { id: 'c3-reto', tipo: 'reto', ciclo: 3, titulo: 'Reto 3 · Señal 4–20 mA', reto: 'c3-reto' },
      { id: 'c3-revisa', tipo: 'revisa', ciclo: 3, titulo: 'Revisión del Reto 3', reto: 'c3-reto' },

      // ---------------- Cierre ----------------
      { id: 'integrador', tipo: 'reto', titulo: 'Reto integrador · El TK-100 se comunica', reto: 'integrador' },
      { id: 'integrador-revisa', tipo: 'revisa', titulo: 'Revisión del reto integrador', reto: 'integrador' },
      { id: 'cierre', tipo: 'cierre', titulo: 'Cierre de la Sesión 3',
        ideas: [
          '<b>Nivel:</b> por presión (h = P ÷ ρg; DP en tanques cerrados; ojo con la densidad) o sin contacto por tiempo de vuelo (ultrasonido barato; radar para vapor y calor).',
          '<b>Flujo:</b> placa orificio (ΔP ∝ Q², hay que sacar la raíz), turbina (pulsos, líquidos limpios) y electromagnético (líquidos conductores, sin partes móviles).',
          '<b>Señal:</b> 4–20 mA porque la corriente no se pierde en el cable; 0 mA = lazo abierto; ≤ 3,6 o ≥ 21 mA = falla del instrumento.',
          'Próxima sesión (martes 06/10, 20:00): <b>calibración, errores y trazabilidad</b>, con HART para ajustar los transmisores.'
        ] }
    ]
  };

  // ---------- Guion docente extenso (solo se ve en el panel del celular) ----------
  const rapida = (min, lectura, comenta, extra = []) => ({ min,
    objetivo: 'Activar la atención y verificar en el momento si la idea anterior quedó clara (1 punto).',
    pasos: [
      '<b>Di:</b> "Pregunta rápida, vale un punto. Tienen un minuto." Lee la pregunta en voz alta: ' + lectura,
      '<b>Haz:</b> mira el contador "Enviaron" arriba en este panel. Con ~80 % de respuestas (o al minuto), toca <b>⏱ Cerrar pregunta</b>: tienen 15 s más.',
      '<b>Haz:</b> al cerrar, en Zoom aparecen las barras por opción con la correcta en verde. Mira también la tarjeta de respuestas en vivo de este panel.',
      '<b>Di:</b> ' + comenta,
      ...extra
    ],
    transicion: 'Comentada la respuesta (1 minuto como máximo), toca <b>Siguiente</b>.' });

  const GUION = {
    inicio: { min: 4,
      objetivo: 'Que todos entren con su carnet y sepan qué van a aprender hoy.',
      pasos: [
        '<b>Haz:</b> comparte en Zoom la pantalla de la presentación. Aparece el código QR y el enlace.',
        '<b>Haz:</b> pega en el chat el enlace de estudiantes (botón "Copiar enlace de estudiantes" de este panel).',
        '<b>Di:</b> "Buenos días. Entren con el QR o el enlace del chat, con <b>el mismo carnet</b> de siempre."',
        '<b>Di:</b> "Hoy completamos los sensores con <b>nivel</b> y <b>flujo</b>, y vemos <b>cómo viaja la medición</b> hasta el PLC: el famoso 4–20 mA."',
        '<b>Di:</b> "Novedad: hoy hay <b>preguntas rápidas</b> de un punto cada pocos minutos, y arriba a la derecha van a ver su <b>puntaje acumulado</b>. Tengan el dispositivo a mano."',
        '<b>Di:</b> "Otra novedad: cuando cierro un reto, les aparece una cuenta regresiva de 30 segundos y se envía solo lo que tengan escrito. Nadie pierde lo que hizo."',
        '<b>Haz:</b> mira el contador de "Conectados" arriba en este panel.'
      ],
      dudas: [
        '"No me carga la página" → que recarguen; si sigue, que entren desde el celular con datos móviles.',
        '"Me equivoqué de carnet" → botón "Salir" arriba a la derecha y vuelven a entrar.',
        '"¿Las preguntas rápidas cuentan?" → Sí: suman a la nota del día, un punto cada una.'
      ],
      transicion: 'Cuando la mayoría esté conectada, toca <b>Siguiente</b>.' },

    diagnostico: { min: 5,
      objetivo: 'Refrescar presión hidrostática y DP de la Sesión 2, y descubrir qué saben de lo que viene.',
      pasos: [
        '<b>Di:</b> "Cinco preguntas: dos de repaso y tres de lo que viene. <b>No tienen nota</b>. Tienen 3 minutos."',
        '<b>Haz:</b> toca <b>Pizarra → Diagnóstico</b> para ver el porcentaje de aciertos por pregunta.',
        '<b>Di</b> (pregunta 1): "2 m de agua: 1000 × 9,81 × 2 = 19 620 Pa ≈ 19,6 kPa. Hoy lo usamos al revés: de la presión sacamos el nivel."',
        '<b>Di</b> (pregunta 2): "El diferencial resta la presión de arriba. Lo vimos con el TK-100 presurizado: hoy lo usamos para medir nivel."',
        '<b>Di</b> (pregunta 3): "El eco del murciélago es exactamente cómo funciona un sensor ultrasónico."'
      ],
      dudas: ['"¿Cuenta para la nota?" → No, es solo para saber desde dónde partir.'],
      transicion: 'Con ~80 % de respuestas, toca <b>Siguiente</b>.' },

    'c1-hidro': { min: 10,
      objetivo: 'Que entiendan que medir nivel por presión es aplicar P = ρgh al revés, y por qué en tanques cerrados se usa DP.',
      pasos: [
        '<b>Pregunta al grupo:</b> "¿Cómo saben en su trabajo cuánto líquido hay en un tanque?" (varilla, visor, flotador, transmisor…). Deja 2–3 respuestas en el chat.',
        '<b>Di:</b> "La forma más usada en la industria es indirecta: medir la <b>presión del fondo</b>. Ya sabemos que P = ρ · g · h; despejamos h."',
        '<b>Haz:</b> tanque <b>abierto</b>, transmisor "Presión en el fondo", agua. Mueve el nivel de 1 a 4 m.',
        '<b>Di:</b> "Cada metro de agua son ≈ 9,81 kPa. Con 29,4 kPa en el fondo hay 3 m. Así de simple."',
        '<b>Haz:</b> cambia a <b>Cerrado y presurizado</b> con el transmisor del fondo. Sube la presión del gas a 100 kPa sin tocar el nivel.',
        '<b>Di:</b> "¡El nivel indicado subió sin que entrara una gota! El transmisor siente gas + líquido. Esto pasa en la vida real cuando alguien pone un manométrico en un tanque presurizado."',
        '<b>Haz:</b> cambia a <b>Diferencial (DP)</b>. <b>Di:</b> "El lado H está abajo, el lado L arriba, en el gas. El DP resta: queda solo el líquido. Mismo principio que vimos en la Sesión 2."',
        '<b>Haz:</b> vuelve a abierto, elige <b>Diésel</b> y "configurado para agua". <b>Di:</b> "El diésel pesa menos: la misma altura hace menos presión. Si no le decimos al transmisor la densidad correcta, miente." Cambia a "de este líquido".',
        '<b>Haz:</b> elige <b>Pulpa</b>. <b>Di:</b> "Con pulpa la toma se tapa: se usa un sello de diafragma al ras del tanque, como vimos en presión."'
      ],
      preguntas: [
        '"Si el tanque tiene leche en vez de agua, ¿el transmisor marca más o menos para la misma altura?" → Un poco más: la leche (1030) es más densa.',
        '"¿Dónde va el lado L del DP en un tanque abierto?" → Al aire (venteado): la atmósfera es la referencia.'
      ],
      dudas: [
        '"¿Y si el líquido se calienta?" → Baja la densidad (agua a 80 °C ≈ 972): hay un pequeño error si no se compensa.',
        '"¿El DP tiene que estar en el fondo?" → La toma H, sí (o se corrige el cero si está más arriba). El transmisor suele ir un poco por debajo de la toma.',
        '"¿Qué es el lado húmedo/seco?" → Si en la línea L se condensa líquido (vapor), se llena a propósito ("pierna húmeda") y se corrige en la configuración.'
      ],
      transicion: '<b>Di:</b> "Veamos si quedó claro: dos preguntas rápidas." → <b>Siguiente</b>.' },

    'q-n1': rapida(2, '"Tanque abierto, el transmisor del fondo marca 29,4 kPa: ¿qué nivel hay?"',
      '"29 400 ÷ 9810 ≈ 3 m. El atajo: cada metro de agua son casi 10 kPa." Si muchos eligieron 2,94 cm o 29,4 m, recuerda pasar kPa a Pa (× 1000).'),
    'q-n2': rapida(2, '"Tanque cerrado y presurizado: ¿por qué no basta un manométrico en el fondo?"',
      '"Porque suma la presión del gas y la confunde con nivel. El DP la resta."'),

    'c1-tof': { min: 9,
      objetivo: 'Que entiendan el tiempo de vuelo y sepan cuándo usar ultrasonido y cuándo radar.',
      pasos: [
        '<b>Di:</b> "¿Recuerdan el murciélago del diagnóstico? Un sensor ultrasónico hace lo mismo: grita desde arriba y escucha el eco de la superficie."',
        '<b>Haz:</b> pestaña <b>tiempo de vuelo</b>, Ultrasónico. Muestra la animación del pulso y del eco.',
        '<b>Di:</b> "Mide el tiempo de ida y vuelta. Distancia = velocidad × tiempo ÷ 2, porque el sonido va y vuelve. Y el nivel es la altura total menos esa distancia."',
        '<b>Haz:</b> pon el nivel en 3 m: señala el tiempo (≈ 17 ms). <b>Di:</b> "17 milésimas de segundo: el sensor hace la cuenta solo."',
        '<b>Haz:</b> desactiva la compensación y sube el aire a 50 °C. <b>Di:</b> "El sonido viaja más rápido en aire caliente. Sin compensar, la medida se corre. Por eso traen un sensor de temperatura."',
        '<b>Haz:</b> sube el nivel hasta casi el techo. <b>Di:</b> "Zona muerta: el eco vuelve mientras la membrana todavía vibra. Nunca se llena hasta ahí."',
        '<b>Haz:</b> activa <b>vapor</b>. <b>Di:</b> "El vapor y la espuma se comen el eco." Cambia a <b>Radar</b>. <b>Di:</b> "El radar usa microondas, a la velocidad de la luz: nanosegundos. No le importa el vapor ni la temperatura."',
        '<b>Di:</b> "Resumen: ultrasónico = económico para agua y tanques sencillos; radar = procesos difíciles, vapor, calor, exactitud."'
      ],
      preguntas: [
        '"¿Cuál usarían en el TK-100 con agua caliente que humea?" → Radar (o DP, que ya vimos).',
        '"¿Por qué se divide entre 2?" → Porque el tiempo medido es de ida y vuelta.'
      ],
      dudas: [
        '"¿Qué es el radar guiado?" → Las microondas bajan por una varilla o cable: funciona con espuma, tanques angostos y productos con poca reflexión.',
        '"¿Sirve para sólidos (granos, cemento)?" → Sí, sobre todo el radar; el ultrasónico sufre con el polvo.',
        '"¿El radar es peligroso?" → No: la potencia es de milivatios, mucho menor que un celular.'
      ],
      transicion: '<b>Di:</b> "Otra rápida." → <b>Siguiente</b>.' },

    'q-n3': rapida(2, '"Ultrasónico sin compensar, ajustado en la mañana fría; al mediodía el aire está a 35 °C: ¿qué pasa?"',
      '"Se corre: el sonido pasa de ≈ 334 a ≈ 352 m/s, casi un 5 %. Con compensación de temperatura se corrige; el radar ni se entera."'),

    'c1-explora': { min: 5,
      objetivo: 'Que cada uno compruebe con sus manos los errores típicos de nivel.',
      pasos: [
        '<b>Di:</b> "Cinco minutos para jugar con el diagrama en su dispositivo. Respondan las 4 preguntas de la pantalla; no tienen nota, pero el reto que viene se parece mucho."',
        '<b>Haz:</b> mientras exploran, deja en tu pantalla el tanque cerrado con DP.',
        '<b>Di</b> (a los 4 min): "La de diésel: indica de menos porque es más liviano. La de vapor: radar."'
      ],
      transicion: 'A los 5 minutos → <b>Siguiente</b> (Reto 1).' },

    'c1-reto': { min: 9,
      objetivo: 'Aplicar nivel por presión, tiempo de vuelo, tanque cerrado, diagnóstico y selección con valores propios.',
      pasos: [
        '<b>Di:</b> "Reto 1, vale 10 puntos y tienen 2 intentos. Cada uno tiene valores distintos según su carnet. Tienen 7 minutos."',
        '<b>Di:</b> "Ojo en la b): el sonido va y vuelve. Y en la c): el tanque está cerrado."',
        '<b>Haz:</b> mira el contador "Enviaron". A los 5 minutos avisa: "2 minutos".',
        '<b>Haz:</b> a los 7 minutos toca <b>⏱ Cerrar reto (30 s)</b>. Se envía lo que cada uno tenga escrito y ven su nota.'
      ],
      dudas: ['"Me sale negativo el nivel del ultrasónico" → Están restando al revés: nivel = H − d.', '"¿Uso 9,8 o 9,81?" → 9,81; con 9,8 igual entra en el margen de ±2 %.'],
      transicion: 'Cuando el panel diga "Reto cerrado" → <b>Siguiente</b> (Revisión).' },

    'c1-revisa': { min: 4,
      objetivo: 'Corregir los errores más frecuentes del Reto 1.',
      pasos: [
        '<b>Haz:</b> en Zoom aparecen las barras de correctas/incorrectas y el error frecuente. Mira la Pizarra: los rojos se equivocaron estando seguros.',
        '<b>Di</b> (b): "d = 343 × t ÷ 2, con t en segundos (los ms entre 1000). Y el nivel es H − d."',
        '<b>Di</b> (c): "Primero se resta el gas: solo lo que sobra es líquido."',
        '<b>Di:</b> "Cada uno ve en su dispositivo la solución con sus propios números."'
      ],
      transicion: '<b>Di:</b> "Pasamos a flujo." → <b>Siguiente</b>.' },

    'c2-placa': { min: 11,
      objetivo: 'Que entiendan por qué la placa genera ΔP, la relación cuadrática y la necesidad de sacar la raíz.',
      pasos: [
        '<b>Pregunta al grupo:</b> "Cuando tapan con el dedo la punta de una manguera, ¿qué pasa con el chorro?" → Sale más rápido.',
        '<b>Di:</b> "La placa orificio hace eso: un disco con un agujero. El fluido se acelera al pasar y, por Bernoulli, si sube la velocidad baja la presión."',
        '<b>Haz:</b> pestaña <b>Placa orificio</b>. Señala la placa, las tomas H (antes) y L (después) y el transmisor DP arriba.',
        '<b>Haz:</b> señala el perfil de presión de abajo. <b>Di:</b> "La presión cae justo después de la placa (vena contracta) y se recupera solo en parte: esa parte que no vuelve es la pérdida permanente, energía que paga la bomba."',
        '<b>Haz:</b> mueve el caudal de 50 % a 100 %. <b>Di:</b> "Duplicamos el caudal y la ΔP se multiplicó por 4. Es cuadrática: mira la curva a la derecha."',
        '<b>Haz:</b> pon caudal 50 % y elige "Nadie saca la raíz". <b>Di:</b> "Si nadie saca la raíz, el PLC muestra 25 % cuando pasa 50 %. Error clásico. El transmisor DP de caudal trae la función de raíz cuadrada, o la hace el PLC: <b>uno de los dos, no los dos</b>."',
        '<b>Haz:</b> baja el caudal a 10 %. <b>Di:</b> "Con 10 % de caudal queda 1 % de ΔP: casi nada. Por eso la placa trabaja bien de ≈ 30 a 100 %."',
        '<b>Di:</b> "¿Por qué se sigue usando tanto? Es barata, no tiene partes móviles, sirve para vapor y gas a alta temperatura, y está normalizada (ISO 5167)."'
      ],
      preguntas: [
        '"Si la ΔP baja a la cuarta parte, ¿cuánto bajó el caudal?" → A la mitad (√¼ = ½).',
        '"¿Qué le pasa a la lectura si el borde de la placa se gasta?" → Marca de menos: hace menos ΔP para el mismo caudal.'
      ],
      dudas: [
        '"¿Qué es el tramo recto?" → Tubería recta antes (≈ 10 a 40 diámetros, según lo que haya antes) y después (≈ 5 D) para que el flujo llegue ordenado.',
        '"¿Qué es β?" → La relación entre el diámetro del agujero y el de la tubería (típico 0,4 a 0,7).',
        '"¿Hay otros elementos de ΔP?" → Venturi (menos pérdida), tobera, tubo Pitot, Annubar.'
      ],
      transicion: '<b>Di:</b> "Dos rápidas sobre la raíz cuadrada." → <b>Siguiente</b>.' },

    'q-f1': rapida(2, '"En una placa orificio, si el caudal se duplica, la ΔP…"',
      '"Se multiplica por 4: ΔP va con el caudal al cuadrado."'),
    'q-f2': rapida(2, '"La placa marca el 25 % de su ΔP máxima: ¿qué porcentaje de caudal pasa?"',
      '"√0,25 = 0,5: pasa el 50 %. Quien eligió 25 % trató la placa como lineal: justo el error del PLC sin raíz."'),

    'c2-otros': { min: 9,
      objetivo: 'Que conozcan el principio de la turbina y del electromagnético y cuándo elegir cada uno.',
      pasos: [
        '<b>Di:</b> "La placa sirve para casi todo, pero no siempre es la mejor. Veamos dos caudalímetros muy comunes."',
        '<b>Haz:</b> pestaña <b>Turbina</b>. <b>Di:</b> "Es un molinete dentro de la tubería. Cada álabe que pasa frente al sensor magnético es un pulso."',
        '<b>Haz:</b> mueve el caudal. <b>Di:</b> "Más caudal, más pulsos por segundo. El fabricante da el factor K: pulsos por litro. Caudal = frecuencia × 60 ÷ K, en litros por minuto. Miren el totalizador: así cobra un surtidor."',
        '<b>Haz:</b> activa <b>rodamiento gastado</b>. <b>Di:</b> "Si el rotor se frena, marca de menos. La turbina pide líquido limpio y mantenimiento."',
        '<b>Haz:</b> pestaña <b>Electromagnético</b>. <b>Di:</b> "Aquí vemos el tubo de frente. Las bobinas crean un campo magnético. El líquido, que conduce, es como un cable que se mueve dentro del campo: aparece una tensión entre los electrodos. Es la ley de Faraday, la misma de un generador."',
        '<b>Haz:</b> mueve la velocidad. <b>Di:</b> "La tensión es proporcional a la velocidad: E = B · D · v. Son milivoltios."',
        '<b>Haz:</b> elige <b>Diésel</b>. <b>Di:</b> "El diésel no conduce: cero. El magnético solo sirve para líquidos conductores." Luego <b>tubería medio llena</b>: "Electrodos al aire: lectura falsa."',
        '<b>Di:</b> "Ventaja enorme: no tiene nada dentro del tubo. Ni se desgasta ni se tapa: pulpas de minería, aguas residuales, alimentos."'
      ],
      preguntas: [
        '"¿Qué usarían para pulpa de mineral?" → Magnético. "¿Y para despachar diésel?" → Turbina.',
        '"¿Y para vapor de una caldera?" → Placa orificio (o vortex).'
      ],
      dudas: [
        '"¿Existen otros?" → Sí: Coriolis (mide masa directamente, muy exacto), vortex (vapor y gas), ultrasónico de tiempo de tránsito (no invasivo). Los mencionamos para que los reconozcan.',
        '"¿El magnético necesita tierra?" → Sí: anillos o electrodos de tierra para que el líquido esté al mismo potencial que el equipo; si no, la lectura es inestable.'
      ],
      transicion: '<b>Di:</b> "Una rápida." → <b>Siguiente</b>.' },

    'q-f3': rapida(2, '"¿Cuál de estos líquidos NO se puede medir con un magnético?"',
      '"El diésel: no conduce. La leche, el agua y la pulpa sí conducen."'),

    'c2-explora': { min: 5,
      objetivo: 'Que comprueben la raíz cuadrada, el rango de la placa y las fallas de turbina y magnético.',
      pasos: [
        '<b>Di:</b> "Cinco minutos con el diagrama. Respondan las 4 preguntas de la pantalla."',
        '<b>Di</b> (a los 4 min): "Al 10 % de caudal la placa casi no da señal; la turbina gastada marca de menos; el magnético con diésel da cero."'
      ],
      transicion: 'A los 5 minutos → <b>Siguiente</b> (Reto 2).' },

    'c2-reto': { min: 9,
      objetivo: 'Aplicar la raíz cuadrada, la turbina, el diagnóstico y la selección de caudalímetros.',
      pasos: [
        '<b>Di:</b> "Reto 2, vale 10 puntos, 2 intentos y 7 minutos."',
        '<b>Di:</b> "En la a) se saca la raíz; en la b) es al revés: se eleva al cuadrado. En la c), no olviden el 60."',
        '<b>Haz:</b> a los 5 minutos avisa "2 minutos"; a los 7, toca <b>⏱ Cerrar reto (30 s)</b>.'
      ],
      dudas: ['"¿La raíz es de la ΔP o del cociente?" → Del cociente ΔP ÷ ΔPmáx; después se multiplica por Qmáx.'],
      transicion: 'Con el reto cerrado → <b>Siguiente</b>.' },

    'c2-revisa': { min: 4,
      objetivo: 'Corregir la raíz cuadrada y la conversión de la turbina.',
      pasos: [
        '<b>Haz:</b> mira las barras en Zoom y la Pizarra.',
        '<b>Di</b> (a y b): "Si la ΔP es el 36 %, el caudal es el 60 % (√0,36). Y al revés: 60 % de caudal → 36 % de ΔP."',
        '<b>Di</b> (c): "Hertz son pulsos por segundo: × 60 para tener por minuto, ÷ K para tener litros."'
      ],
      transicion: '<b>Di:</b> "Pausa de 10 minutos." → <b>Siguiente</b> (si vas atrasado, sáltala: toca directamente el paso del lazo 4–20 mA en la lista).' },

    pausa: { min: 10,
      objetivo: 'Descansar sin perder la conexión.',
      pasos: [
        '<b>Di:</b> "Diez minutos de pausa. No cierren la página: la clase continúa sola en su pantalla."',
        '<b>Haz:</b> revisa la Pizarra de los retos 1 y 2 para ver quién necesita apoyo.'
      ],
      transicion: 'Al terminar el reloj → <b>Siguiente</b>.' },

    'c3-lazo': { min: 11,
      objetivo: 'Que entiendan cómo viaja la medición en 4–20 mA, por qué corriente, el cero vivo y el límite de carga.',
      pasos: [
        '<b>Pregunta al grupo:</b> "Ya medimos nivel, flujo, temperatura y presión. ¿Cómo llega ese número al PLC que está a 300 m, en la sala de control?"',
        '<b>Haz:</b> pestaña <b>El lazo de corriente</b>. Señala la fuente de 24 V (tablero), el transmisor (campo) y la resistencia de 250 Ω del PLC.',
        '<b>Di:</b> "Es un circuito en serie: la fuente empuja, el transmisor <b>regula</b> la corriente según lo que mide, y el PLC la lee como tensión en su resistencia: 4 mA × 250 Ω = 1 V; 20 mA → 5 V."',
        '<b>Haz:</b> mueve la variable de 0 a 100 %. <b>Di:</b> "0 % → 4 mA; 100 % → 20 mA; 50 % → 12 mA."',
        '<b>Haz:</b> sube el cable a 2000 m. <b>Di:</b> "La corriente no cambió: en serie, la misma corriente pasa por todo. Con voltaje, el cable se comería parte de la señal."',
        '<b>Haz:</b> activa la <b>interferencia</b>. <b>Di:</b> "Abajo a la derecha: la señal de voltaje se llena de ruido; la de corriente casi no se mueve."',
        '<b>Haz:</b> falla <b>Cable cortado</b>. <b>Di:</b> "0 mA. Como el cero real es 4 mA, el PLC sabe que es una falla y no un tanque vacío. A eso se le llama cero vivo."',
        '<b>Haz:</b> vuelve a "Ninguna", pon 750 Ω y la variable al 100 %. <b>Di:</b> "El transmisor necesita al menos 12 V. Con tanta resistencia la fuente no alcanza y la señal se queda corta. Carga máxima = (24 − 12) ÷ 0,020 = 600 Ω."',
        '<b>Di:</b> "Y algo práctico: este transmisor es de <b>2 hilos</b>: se alimenta por los mismos cables de la señal. Por eso nunca baja de ≈ 3,6 mA: es lo que consume para vivir."'
      ],
      preguntas: [
        '"Si el PLC lee 12 mA, ¿qué porcentaje es?" → 50 %.',
        '"¿Cómo mido la corriente sin desconectar?" → Con la pinza de mA o en los bornes de prueba del transmisor.'
      ],
      dudas: [
        '"¿Qué es HART?" → Una señal digital montada sobre el 4–20 mA que permite configurar y diagnosticar el transmisor. Lo usamos el martes, en calibración.',
        '"¿Y los buses (Profibus, Foundation Fieldbus)?" → Son 100 % digitales; el 4–20 mA sigue siendo el estándar más común por simple y robusto.',
        '"¿El blindaje se conecta en los dos lados?" → No: a tierra solo en un extremo (el tablero), para no crear un lazo de tierra.'
      ],
      transicion: '<b>Di:</b> "Dos rápidas." → <b>Siguiente</b>.' },

    'q-s1': rapida(2, '"¿Por qué en planta se transmite en corriente y no en voltaje?"',
      '"Porque la corriente no cambia con la resistencia del cable y resiste mejor el ruido."'),
    'q-s2': rapida(2, '"El PLC lee 0 mA: ¿qué es lo más probable?"',
      '"Lazo abierto o sin fuente. Si fuera el mínimo de la variable, leería 4 mA."'),

    'c3-escala': { min: 8,
      objetivo: 'Que sepan convertir entre la variable y los mA en los dos sentidos e interpretar las zonas NAMUR.',
      pasos: [
        '<b>Haz:</b> pestaña <b>Escalado</b>, TT-103 (0 a 150 °C). Mueve la variable.',
        '<b>Di:</b> "Es una recta: 4 mA en el LRV, 20 mA en el URV. I = 4 + 16 por la fracción del rango."',
        '<b>Haz:</b> pon 75 °C → 12 mA. <b>Di:</b> "La mitad del rango, 12 mA. Y en el PLC se hace al revés."',
        '<b>Haz:</b> elige <b>TT-105 (−20 a 180 °C)</b>. <b>Di:</b> "Cuando el rango no empieza en cero hay que restar el LRV. 0 °C aquí no es 4 mA: es 5,6 mA."',
        '<b>Haz:</b> lleva la variable por encima del 100 %. <b>Di:</b> "Se satura en 20,5 mA: el lazo está bien, pero la variable salió del rango."',
        '<b>Di:</b> "Y las zonas rojas: ≤ 3,6 o ≥ 21 mA es el transmisor avisando que falló. Es la recomendación NAMUR NE 43, que siguen casi todos los fabricantes."',
        '<b>Di:</b> "Importante: el rango del transmisor y el del PLC deben ser el mismo. Si no, el PLC muestra otra cosa aunque todo esté bien conectado."'
      ],
      preguntas: ['"Un TT de 0 a 200 °C envía 8 mA: ¿qué temperatura?" → (8 − 4) ÷ 16 = 0,25 → 50 °C.'],
      dudas: ['"¿Quién decide si la falla es alta o baja?" → Se configura en el transmisor, según qué sea más seguro para el proceso (por ejemplo, que un nivel en falla se vea como "lleno" para detener una bomba).'],
      transicion: '<b>Di:</b> "Una rápida." → <b>Siguiente</b>.' },

    'q-s3': rapida(2, '"Transmisor de 0 a 100 °C que envía 12 mA: ¿qué temperatura mide?"',
      '"12 mA es la mitad entre 4 y 20: 50 °C. Quien eligió 60 °C dividió 12 entre 20: olvidó el cero vivo."'),

    'c3-explora': { min: 5,
      objetivo: 'Que comprueben el efecto del cable, la carga, las fallas, el ruido y el escalado.',
      pasos: [
        '<b>Di:</b> "Cinco minutos con el diagrama del lazo. Respondan las 4 preguntas."',
        '<b>Di</b> (a los 4 min): "TT-105 a 0 °C: 5,6 mA. A 200 °C: está fuera de rango y se satura en 20,5 mA."'
      ],
      transicion: 'A los 5 minutos → <b>Siguiente</b> (Reto 3).' },

    'c3-reto': { min: 9,
      objetivo: 'Convertir variable ↔ mA, calcular la carga máxima y diagnosticar fallas del lazo.',
      pasos: [
        '<b>Di:</b> "Reto 3, vale 10 puntos, 2 intentos y 7 minutos."',
        '<b>Di:</b> "En la b), fíjense si el rango empieza en cero o no."',
        '<b>Haz:</b> a los 5 minutos avisa "2 minutos"; a los 7, toca <b>⏱ Cerrar reto (30 s)</b>.'
      ],
      dudas: ['"¿La c) incluye el cable?" → Sí: es la resistencia total del lazo, cable + entrada del PLC + lo que esté en serie.'],
      transicion: 'Con el reto cerrado → <b>Siguiente</b>.' },

    'c3-revisa': { min: 4,
      objetivo: 'Corregir el escalado y fijar el diagnóstico por la corriente.',
      pasos: [
        '<b>Haz:</b> mira las barras en Zoom y la Pizarra.',
        '<b>Di</b> (b): "Primero (I − 4) ÷ 16 = fracción; luego × span y + LRV."',
        '<b>Di</b> (d): "Por la corriente se diagnostica: 0 mA lazo abierto; 3,6 falla baja; 20,5 saturación; ≥ 21 falla alta."'
      ],
      transicion: '<b>Di:</b> "Último reto, el integrador: vale 20 puntos." → <b>Siguiente</b>.' },

    integrador: { min: 12,
      objetivo: 'Integrar nivel por DP, la señal 4–20 mA, la placa orificio, el diagnóstico y la selección en el TK-100.',
      pasos: [
        '<b>Di:</b> "Volvemos al TK-100: ahora está cerrado y sus instrumentos le hablan al PLC. Son 5 preguntas y vale <b>20 puntos</b>. Tienen 10 minutos."',
        '<b>Di:</b> "Orden sugerido: 1 (nivel), 2 (corriente), 3 (caudal), 4 (falla) y 5 (selección)."',
        '<b>Haz:</b> avisa a los 8 minutos: "2 minutos". A los 10, toca <b>⏱ Cerrar reto (30 s)</b>.'
      ],
      transicion: 'Con el reto cerrado → <b>Siguiente</b>.' },

    'integrador-revisa': { min: 4,
      objetivo: 'Cerrar el integrador con las preguntas que más cuestan.',
      pasos: [
        '<b>Di</b> (pregunta 1): "El DP ya restó el gas: h = ΔP × 1000 ÷ (978 × 9,81)."',
        '<b>Di</b> (pregunta 2): "Con ese nivel: I = 4 + 16 × h ÷ rango."',
        '<b>Di</b> (pregunta 5): "Pulpa abrasiva y conductora: magnético. La placa se gastaría y se taparía."'
      ],
      transicion: '→ <b>Siguiente</b>.' },

    cierre: { min: 3,
      objetivo: 'Dejar las 4 ideas clave y anunciar la próxima sesión.',
      pasos: [
        '<b>Haz:</b> lee las 4 ideas que aparecen en pantalla. Cada estudiante ve su puntaje de hoy.',
        '<b>Di:</b> "El martes a las 20:00: <b>calibración, errores y trazabilidad</b>. Vamos a ajustar el cero y el span de un transmisor y a usar HART."',
        '<b>Di:</b> "Pueden repasar hoy con el botón <b>Repasar</b> de la página del módulo."',
        '<b>Haz:</b> deja la clase en este paso (fuera de un reto) y, si quieres, toca "Abrir toda la sesión" para el repaso.',
        '<b>Después de clase:</b> Reporte → <b>Descargar para Excel</b>.'
      ] }
  };
  II.SESIONES['ii-s3'].pasos.forEach((p) => { p.guion = GUION[p.id]; });
})();
