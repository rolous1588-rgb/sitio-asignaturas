// ============================================================
// Examen final del módulo (sesión ii-s6): 20 preguntas de todo el módulo, un intento.
// 10 temas × 2 preguntas por carnet. Sin reloj fijo: el docente lo cierra con una cuenta regresiva.
// Al enviar, el estudiante ve su nota y las soluciones.
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  const O = (id, mod, t, o, c, por) => ({ id, mod, tipo: 'opcion', t, o, c, por });
  const E = II.elegir;
  const r2 = (x) => Math.round(x * 100) / 100;

  const TEMAS = [
    { n: 1, titulo: 'La planta y el lazo de control' },
    { n: 2, titulo: 'Medición: rango, span, exactitud y precisión' },
    { n: 3, titulo: 'Temperatura: RTD, termopar y termistor' },
    { n: 4, titulo: 'Presión' },
    { n: 5, titulo: 'Nivel' },
    { n: 6, titulo: 'Flujo' },
    { n: 7, titulo: 'Lazo de corriente 4–20 mA' },
    { n: 8, titulo: 'Errores, calibración, HART y trazabilidad' },
    { n: 9, titulo: 'Instalación en planta' },
    { n: 10, titulo: 'P&ID (ISA 5.1) y fallas del lazo' }
  ];

  const BANCO = [
    // ---------- 1. Planta y lazo ----------
    O('x1a', 1, 'En el lazo de nivel del TK-100, ¿qué hace el controlador LIC?',
      ['Compara el nivel medido con el valor deseado (set point) y decide cuánto abrir la válvula', 'Mide el nivel del tanque', 'Mueve el líquido hacia el tanque', 'Solo muestra el nivel al operador'], 0,
      'El controlador recibe la PV, la compara con el SP y calcula la salida hacia el elemento final.'),
    O('x1b', 1, '¿Qué elemento del lazo actúa directamente sobre el proceso?',
      ['La válvula de control (elemento final)', 'El transmisor', 'El controlador', 'El indicador del operador'], 0,
      'El elemento final (válvula, calentador, variador) es el que cambia el proceso.'),
    O('x1c', 1, 'En el lazo de temperatura del TK-100, ¿cuál es la variable manipulada?',
      ['La potencia entregada al calentador', 'La temperatura del agua del tanque', 'El set point de temperatura', 'El nivel del tanque'], 0,
      'La variable controlada es la temperatura; lo que el controlador mueve para corregirla es la potencia del calentador.'),
    { id: 'x1d', mod: 1, tipo: 'num', gen(r) {
      const sp = E(r, [2, 2.5, 3, 3.5]), pv = r2(sp - E(r, [0.2, 0.3, 0.4, 0.5, 0.6]));
      return { t: `El set point de nivel del TK-100 es <b>${II.fmt(sp)} m</b> y el transmisor mide <b>${II.fmt(pv)} m</b>. ¿Cuál es el error del controlador (SP − PV)?`, valor: sp - pv, unidad: 'm', sol: `${II.fmt(sp)} − ${II.fmt(pv)}`, por: 'El controlador trabaja con el error e = SP − PV; aquí es positivo: falta nivel.' };
    } },
    O('x1e', 1, 'De pronto aumenta el consumo (se abre más la salida del TK-100). Para el lazo de nivel, eso es…',
      ['Una perturbación', 'El set point', 'La variable controlada', 'El elemento final'], 0,
      'Una perturbación es un cambio externo que saca a la variable controlada de su valor; el lazo debe corregirlo.'),

    // ---------- 2. Medición ----------
    { id: 'x2a', mod: 2, tipo: 'num', gen(r) {
      const lrv = E(r, [-50, -20, 0, 20]), urv = E(r, [100, 150, 200, 250]);
      return { t: `Un transmisor de temperatura está calibrado de <b>${lrv} °C</b> a <b>${urv} °C</b>. ¿Cuál es su span?`, valor: urv - lrv, unidad: '°C', sol: `${urv} − (${lrv})`, por: 'Span = URV − LRV. El rango es el intervalo; el span es su ancho.' };
    } },
    { id: 'x2b', mod: 2, tipo: 'num', gen(r) {
      const lrv = E(r, [0, 20, 50]), span = E(r, [100, 150, 200]), pv = lrv + span * E(r, [0.2, 0.35, 0.45, 0.6, 0.75, 0.9]);
      return { t: `Un transmisor de <b>${lrv} a ${lrv + span} °C</b> mide <b>${II.fmt(pv, 1)} °C</b>. ¿Qué porcentaje del span representa?`, valor: ((pv - lrv) / span) * 100, unidad: '%', sol: `(${II.fmt(pv, 1)} − ${lrv}) ÷ ${span} × 100`, por: '% = (PV − LRV) ÷ span × 100.' };
    } },
    { id: 'x2c', mod: 2, tipo: 'num', gen(r) {
      const R = E(r, [10, 16, 25]), v = r2(R * E(r, [0.3, 0.5, 0.6, 0.8])), e = E(r, [0.5, 0.8, 1, 1.2, 1.5, 2]), l = r2(v + (e / 100) * R);
      return { t: `Un transmisor de <b>0 a ${R} bar</b> indica <b>${II.fmt(l)} bar</b> cuando el patrón marca <b>${II.fmt(v)} bar</b>. ¿Cuál es el error en % del span?`, valor: ((l - v) / R) * 100, unidad: '%', sol: `(${II.fmt(l)} − ${II.fmt(v)}) ÷ ${R} × 100`, por: 'Error % del span = (lectura − valor verdadero) ÷ span × 100.' };
    } },
    O('x2d', 2, 'En la diana, los disparos quedaron muy juntos entre sí, pero lejos del centro. ¿Cómo es ese instrumento?',
      ['Preciso pero no exacto', 'Exacto pero no preciso', 'Exacto y preciso', 'Ni exacto ni preciso'], 0,
      'Juntos = repetible (preciso); lejos del centro = con error sistemático (no exacto). Se corrige calibrando.'),
    { id: 'x2e', mod: 2, tipo: 'num', gen(r) {
      const ex = E(r, [0.25, 0.5, 1]), span = E(r, [100, 200, 400]);
      return { t: `Un transmisor tiene una exactitud de <b>±${II.fmt(ex)} % del span</b> y su span es <b>${span} °C</b>. ¿Cuál es el error máximo esperado (en °C)?`, valor: (ex / 100) * span, unidad: '°C', sol: `${II.fmt(ex)} % × ${span}`, por: 'Si la exactitud se da en % del span, el error en unidades es ese porcentaje del span.' };
    } },

    // ---------- 3. Temperatura ----------
    { id: 'x3a', mod: 3, tipo: 'num', gen(r) {
      const T = E(r, [25, 50, 75, 100, 120, 150, 200]);
      return { t: `Con la aproximación lineal R = R₀ (1 + α·T), con R₀ = 100 Ω y α = 0,00385 /°C, ¿cuánto mide una Pt100 a <b>${T} °C</b>?`, valor: 100 * (1 + 0.00385 * T), unidad: 'Ω', sol: `100 × (1 + 0,00385 × ${T})`, por: 'La Pt100 sube unos 0,385 Ω por cada °C.' };
    } },
    { id: 'x3b', mod: 3, tipo: 'num', gen(r) {
      const Rm = r2(100 * (1 + 0.00385 * E(r, [30, 60, 80, 90, 110, 140, 180])));
      return { t: `Una Pt100 (R₀ = 100 Ω, α = 0,00385 /°C) mide <b>${II.fmt(Rm)} Ω</b>. Con la aproximación lineal, ¿a qué temperatura está?`, valor: (Rm / 100 - 1) / 0.00385, unidad: '°C', sol: `(${II.fmt(Rm)} ÷ 100 − 1) ÷ 0,00385`, por: 'Se despeja T de R = R₀ (1 + α·T).' };
    } },
    { id: 'x3c', mod: 3, tipo: 'num', gen(r) {
      const T = E(r, [150, 200, 250, 300, 350, 400, 450, 500]), tf = E(r, [15, 20, 25, 30]);
      const mv = r2(0.041 * (T - tf));
      return { t: `Un termopar tipo K genera <b>${II.fmt(mv)} mV</b> y la unión fría (los bornes) está a <b>${tf} °C</b>. Con la aproximación de <b>41 µV/°C</b>, ¿qué temperatura mide la punta?`, valor: mv / 0.041 + tf, unidad: '°C', sol: `${II.fmt(mv)} ÷ 0,041 + ${tf}`, por: 'El termopar mide la diferencia entre la punta y la unión fría: hay que sumarle la temperatura de la unión fría (compensación).' };
    } },
    O('x3d', 3, 'Una Pt100 conectada a 2 hilos con un cable largo lee de más. ¿Por qué?',
      ['La resistencia de los cables se suma a la del sensor', 'El cable genera un voltaje como un termopar', 'El platino se oxida con el cable largo', 'La corriente de medición es muy alta'], 0,
      'Con 3 o 4 hilos se compensa o se elimina la resistencia de los cables.'),
    O('x3e', 3, 'Hay que medir unos 1000 °C dentro de un horno. ¿Qué sensor eliges?',
      ['Un termopar (tipo K, N o S, según la atmósfera)', 'Una Pt100', 'Un termistor NTC', 'Un termómetro de vidrio'], 0,
      'Las Pt100 de uso industrial llegan hasta unos 600 °C y los termistores son de rango bajo; para 1000 °C se usan termopares.'),
    O('x3f', 3, 'En un termistor NTC, al subir la temperatura la resistencia…',
      ['Baja, y no de forma lineal', 'Sube de forma lineal', 'No cambia', 'Sube y después baja'], 0,
      'NTC = coeficiente negativo: la resistencia cae (de forma exponencial) al calentarse.'),

    // ---------- 4. Presión ----------
    { id: 'x4a', mod: 4, tipo: 'num', gen(r) {
      const atm = E(r, [62, 72, 76, 101.3]), man = E(r, [150, 200, 250, 300, 350]);
      return { t: `Un manómetro marca <b>${man} kPa</b> en un lugar donde la presión atmosférica es <b>${II.fmt(atm, 1)} kPa</b>. ¿Cuál es la presión absoluta?`, valor: man + atm, unidad: 'kPa', sol: `${man} + ${II.fmt(atm, 1)}`, por: 'P absoluta = P manométrica + P atmosférica del lugar.' };
    } },
    { id: 'x4b', mod: 4, tipo: 'num', gen(r) {
      const [liq, rho] = E(r, [['agua', 1000], ['diésel', 850], ['leche', 1030]]), h = E(r, [1.5, 2, 2.5, 3, 4]);
      return { t: `¿Qué presión ejerce una columna de <b>${h} m</b> de ${liq} (ρ = ${rho} kg/m³) en el fondo? Usa g = 9,81 m/s² y da el resultado en kPa.`, valor: (rho * 9.81 * h) / 1000, unidad: 'kPa', sol: `${rho} × 9,81 × ${h} ÷ 1000`, por: 'P = ρ·g·h (en Pa); se divide entre 1000 para pasar a kPa.' };
    } },
    O('x4c', 4, 'Un transmisor marca 0 con la toma abierta al aire. ¿Qué tipo de presión mide?',
      ['Manométrica (relativa a la atmósfera)', 'Absoluta', 'Diferencial entre dos tanques', 'Vacío absoluto'], 0,
      'Un transmisor absoluto marcaría la presión atmosférica del lugar, no cero.'),
    O('x4d', 4, 'En un sensor de diafragma con galgas extensométricas, ¿qué se convierte en señal eléctrica?',
      ['La deformación del diafragma, que cambia la resistencia de las galgas (puente de Wheatstone)', 'El calor del fluido', 'La velocidad del fluido', 'La luz que refleja el diafragma'], 0,
      'La presión deforma el diafragma; las galgas se estiran o comprimen y el puente convierte eso en voltaje.'),
    O('x4e', 4, 'Para medir presiones que cambian muy rápido (golpe de ariete, explosiones), el sensor más adecuado es…',
      ['Piezoeléctrico', 'Tubo Bourdon', 'Manómetro de columna de agua', 'Balanza de pesos muertos'], 0,
      'El piezoeléctrico responde a cambios rápidos (dinámicos); no sirve para presiones estáticas.'),

    // ---------- 5. Nivel ----------
    { id: 'x5a', mod: 5, tipo: 'num', gen(r) {
      const [liq, rho] = E(r, [['agua', 1000], ['diésel', 850], ['leche', 1030]]), p = r2((rho * 9.81 * E(r, [1.2, 1.8, 2.2, 2.6, 3.4])) / 1000);
      return { t: `Un PT en el fondo de un tanque <b>abierto</b> con ${liq} (ρ = ${rho} kg/m³) mide <b>${II.fmt(p)} kPa</b>. ¿Cuál es el nivel? (g = 9,81 m/s²)`, valor: (p * 1000) / (rho * 9.81), unidad: 'm', sol: `${II.fmt(p)} × 1000 ÷ (${rho} × 9,81)`, por: 'h = P ÷ (ρ·g), con P en Pa.' };
    } },
    { id: 'x5b', mod: 5, tipo: 'num', gen(r) {
      const [liq, rho] = E(r, [['diésel', 850], ['aceite', 920], ['leche', 1030], ['pulpa de mineral', 1200]]), h = E(r, [2, 2.5, 3, 3.5, 4]);
      return { t: `Un transmisor de nivel por presión se configuró con la densidad del agua (1000 kg/m³), pero el tanque contiene ${liq} (ρ = ${rho} kg/m³). Si el nivel real es <b>${h} m</b>, ¿qué nivel indica?`, valor: (h * rho) / 1000, unidad: 'm', sol: `${h} × ${rho} ÷ 1000`, por: 'El transmisor mide ρ_real·g·h y divide entre ρ_agua·g: indica h × ρ_real ÷ 1000.' };
    } },
    { id: 'x5c', mod: 5, tipo: 'num', gen(r) {
      const t = E(r, [10, 12, 14, 16, 18, 20]), H = E(r, [4, 5, 6]);
      return { t: `Un radar está montado a <b>${H} m</b> del fondo del tanque y mide un tiempo de ida y vuelta de <b>${t} ns</b>. Con c = 3×10⁸ m/s, ¿cuál es el nivel del líquido?`, valor: H - (3e8 * t * 1e-9) / 2, unidad: 'm', sol: `${H} − 3×10⁸ × ${t}×10⁻⁹ ÷ 2`, por: 'Distancia a la superficie = c·t ÷ 2 (ida y vuelta); el nivel es la altura de la antena menos esa distancia.' };
    } },
    O('x5d', 5, 'En un tanque cerrado y presurizado, ¿por qué no basta un PT en el fondo para medir el nivel?',
      ['Porque también mide la presión del gas de arriba: hace falta un DP que la reste', 'Porque el gas no pesa', 'Porque el PT no resiste líquidos', 'Porque en tanques cerrados solo funciona el radar'], 0,
      'El DP mide (presión del líquido + gas) − (gas) = presión del líquido.'),
    O('x5e', 5, 'En un tanque con mucho vapor y espuma, el ultrasonido falla y el radar no tanto. ¿Por qué?',
      ['La velocidad del sonido depende del gas y la temperatura, y la espuma lo absorbe; las microondas casi no se afectan', 'El radar es más caro', 'El ultrasonido mide temperatura', 'El radar toca el líquido'], 0,
      'El ultrasonido es una onda mecánica que viaja por el aire; el radar es electromagnético.'),

    // ---------- 6. Flujo ----------
    { id: 'x6a', mod: 6, tipo: 'num', gen(r) {
      const qm = E(r, [50, 80, 100, 120]), dpm = E(r, [25, 50, 100]), f = E(r, [0.25, 0.36, 0.49, 0.64, 0.81]);
      return { t: `Una placa orificio da <b>${dpm} kPa</b> a su caudal máximo de <b>${qm} m³/h</b>. Si ahora mide <b>${II.fmt(dpm * f, 2)} kPa</b>, ¿cuál es el caudal?`, valor: qm * Math.sqrt(f), unidad: 'm³/h', sol: `${qm} × √(${II.fmt(dpm * f, 2)} ÷ ${dpm})`, por: 'Q = Q_máx × √(ΔP ÷ ΔP_máx): el caudal va con la raíz cuadrada de la ΔP.' };
    } },
    { id: 'x6b', mod: 6, tipo: 'num', gen(r) {
      const qm = E(r, [60, 100, 150]), dpm = E(r, [40, 50, 80, 100]), f = E(r, [0.3, 0.4, 0.5, 0.6, 0.7]);
      return { t: `Una placa orificio da <b>${dpm} kPa</b> con <b>${qm} m³/h</b>. ¿Qué ΔP dará con <b>${II.fmt(qm * f, 1)} m³/h</b>?`, valor: dpm * f * f, unidad: 'kPa', sol: `${dpm} × (${II.fmt(qm * f, 1)} ÷ ${qm})²`, por: 'ΔP crece con el cuadrado del caudal: ΔP = ΔP_máx × (Q ÷ Q_máx)².' };
    } },
    { id: 'x6c', mod: 6, tipo: 'num', gen(r) {
      const K = E(r, [20, 50, 100, 250]), q = E(r, [30, 60, 90, 120]);
      return { t: `Una turbina tiene un factor <b>K = ${K} pulsos/litro</b> y entrega <b>${II.fmt((K * q) / 60, 1)} Hz</b>. ¿Cuál es el caudal en litros por minuto?`, valor: q, unidad: 'L/min', sol: `${II.fmt((K * q) / 60, 1)} ÷ ${K} × 60`, por: 'Q (L/s) = f ÷ K; por 60 para L/min.' };
    } },
    { id: 'x6d', mod: 6, tipo: 'num', gen(r) {
      const v = E(r, [1, 1.5, 2, 2.5, 3]), [dn, D] = E(r, [[50, 0.05], [80, 0.08], [100, 0.1], [150, 0.15]]);
      return { t: `Un caudalímetro magnético mide una velocidad de <b>${II.fmt(v, 1)} m/s</b> en una tubería DN ${dn} (D = ${II.fmt(D)} m). ¿Cuál es el caudal en m³/h?`, valor: v * Math.PI * D * D / 4 * 3600, unidad: 'm³/h', sol: `${II.fmt(v, 1)} × π × ${II.fmt(D)}² ÷ 4 × 3600`, por: 'Q = v × área; el área es π·D²/4 y se multiplica por 3600 para pasar de m³/s a m³/h.' };
    } },
    O('x6e', 6, '¿Por qué un caudalímetro magnético no sirve para medir diésel o aceite?',
      ['Porque el líquido debe conducir la electricidad (≥ 5 µS/cm) y el diésel no conduce', 'Porque el diésel es muy denso', 'Porque es inflamable', 'Porque daña el revestimiento'], 0,
      'El magnético mide el voltaje E = B·D·v que se induce en un líquido conductor.'),
    O('x6f', 6, '¿Por qué la placa orificio tiene poca rangeabilidad (unos 3:1 a 4:1)?',
      ['Porque ΔP crece con el cuadrado del caudal: a caudal bajo la ΔP es tan pequeña que se mide mal', 'Porque la placa se desgasta', 'Porque es barata', 'Porque necesita tramo recto'], 0,
      'Al 25 % del caudal, la ΔP es apenas el 6,25 % de la máxima.'),

    // ---------- 7. Lazo 4–20 mA ----------
    { id: 'x7a', mod: 7, tipo: 'num', gen(r) {
      const lrv = E(r, [0, 0, 20, 50]), span = E(r, [100, 200, 250]), pv = lrv + span * E(r, [0.15, 0.3, 0.4, 0.65, 0.8]);
      return { t: `Un transmisor de temperatura está calibrado de <b>${lrv} a ${lrv + span} °C</b> (4–20 mA). ¿Qué corriente entrega con <b>${II.fmt(pv, 1)} °C</b>?`, valor: 4 + 16 * ((pv - lrv) / span), unidad: 'mA', sol: `4 + 16 × (${II.fmt(pv, 1)} − ${lrv}) ÷ ${span}`, por: 'I = 4 + 16 × fracción del span.' };
    } },
    { id: 'x7b', mod: 7, tipo: 'num', gen(r) {
      const urv = E(r, [4, 5, 6, 8]), I = E(r, [6.4, 8, 9.6, 12, 14.4, 16, 18.4]);
      return { t: `Un transmisor de nivel de <b>0 a ${urv} m</b> entrega <b>${II.fmt(I, 1)} mA</b>. ¿Qué nivel debe mostrar el PLC?`, valor: ((I - 4) / 16) * urv, unidad: 'm', sol: `(${II.fmt(I, 1)} − 4) ÷ 16 × ${urv}`, por: 'PV = LRV + (I − 4) ÷ 16 × span.' };
    } },
    { id: 'x7c', mod: 7, tipo: 'num', gen(r) {
      const I = E(r, [4, 8, 10, 12, 16, 20]);
      return { t: `La entrada del PLC tiene una resistencia de <b>250 Ω</b>. ¿Qué tensión se mide en ella cuando circulan <b>${I} mA</b>?`, valor: I * 0.25, unidad: 'V', sol: `${I} mA × 250 Ω`, por: 'V = I·R. Con 250 Ω, 4–20 mA se convierte en 1–5 V (y además sirve para HART).' };
    } },
    O('x7d', 7, '¿Por qué la señal empieza en 4 mA y no en 0 mA?',
      ['Para distinguir un 0 % real de un cable cortado (0 mA) y para alimentar al transmisor de 2 hilos', 'Porque 0 mA es peligroso', 'Por costumbre, sin razón técnica', 'Para ahorrar energía'], 0,
      'Con "cero vivo", 0 mA solo puede ser una falla, y el transmisor usa esos 4 mA para funcionar.'),
    O('x7e', 7, 'El PLC recibe 2,5 mA de un transmisor. Según NAMUR NE 43, ¿qué significa?',
      ['Falla: la señal está por debajo de 3,6 mA (por ejemplo, cable abierto o transmisor dañado)', 'El proceso está en −10 %', 'Todo está normal', 'El proceso está al máximo'], 0,
      'NAMUR NE 43: por debajo de 3,6 mA o por encima de 21 mA, la señal indica falla.'),

    // ---------- 8. Errores, calibración, HART, trazabilidad ----------
    { id: 'x8a', mod: 8, tipo: 'num', gen(r) {
      const x = E(r, [0.25, 0.5, 1, 2]);
      return { t: `La tolerancia de un transmisor es <b>±${II.fmt(x)} % del span</b>. Con la regla <b>4:1</b>, ¿cuál es la incertidumbre máxima que puede tener el patrón (en % del span)?`, valor: x / 4, unidad: '%', sol: `${II.fmt(x)} ÷ 4`, por: 'El patrón debe ser al menos 4 veces mejor que lo que se calibra.' };
    } },
    O('x8b', 8, 'En la calibración, los 5 puntos tienen el mismo error (+0,2 bar) en todo el rango. ¿Qué error es y qué se ajusta?',
      ['Error de cero: se ajusta el cero', 'Error de span: se ajusta el span', 'No linealidad: se cambia el sensor', 'Histéresis: se golpea el instrumento'], 0,
      'Un corrimiento igual en todos los puntos es un error de cero.'),
    O('x8c', 8, 'El error es 0 al 0 % y crece de forma proporcional hasta +2 % al 100 %. ¿Qué error es?',
      ['Error de span (ganancia): se ajusta el span', 'Error de cero', 'Histéresis', 'Deriva por temperatura'], 0,
      'Un error que crece con el valor es de span; primero se revisa el cero y luego el span.'),
    O('x8d', 8, 'Subiendo, el transmisor lee 50,0 % en un punto; bajando, en el mismo punto lee 50,6 %. ¿Qué error es?',
      ['Histéresis: no se corrige con cero ni con span', 'Error de cero', 'Error de span', 'Ruido eléctrico'], 0,
      'La histéresis depende de si se sube o se baja; suele ser mecánica (rozamiento, fatiga) y se repara o se cambia el equipo.'),
    O('x8e', 8, 'Quieres que un transmisor de 0–10 bar entregue 4–20 mA para 0–6 bar. ¿Qué haces por HART?',
      ['Un re-rango (cambiar LRV y URV)', 'Un trim de sensor', 'Un trim de salida', 'Cambiar el transmisor'], 0,
      'El re-rango cambia qué valores corresponden a 4 y 20 mA; los trims corrigen la lectura o la salida contra un patrón.'),
    O('x8f', 8, '¿Qué significa que una calibración sea trazable?',
      ['Que hay una cadena ininterrumpida de comparaciones, con incertidumbres conocidas, hasta los patrones nacionales (IBMETRO) y el SI', 'Que el instrumento es nuevo', 'Que tiene el sello del fabricante', 'Que se calibró dentro de la planta'], 0,
      'SI → IBMETRO → laboratorio acreditado ISO/IEC 17025 → patrón de trabajo → instrumento de planta.'),

    // ---------- 9. Instalación ----------
    { id: 'x9a', mod: 9, tipo: 'zona', escena: 'toma', params: { fluido: 'vapor' }, correcta: 'B', t: 'Línea de <b>vapor</b>: ¿dónde va la toma de presión?', por: 'Al costado: arriba entra el vapor seco y no se forma el sello de agua; abajo entran los sedimentos.' },
    { id: 'x9b', mod: 9, tipo: 'zona', escena: 'posicion', params: { fluido: 'liquido' }, correcta: 'B', t: 'Línea de <b>líquido</b>: ¿dónde montarías el transmisor?', por: 'Al lado o debajo de las tomas, para que el aire suba y vuelva a la tubería.' },
    { id: 'x9c', mod: 9, tipo: 'errores', escena: 'cableado', params: {}, errores: ['A', 'D', 'E'], t: '<b>Encuentra los errores</b> en el cableado de este lazo.', por: 'El blindaje va a tierra en un solo extremo, la señal no va junto a la fuerza y el cable necesita lazo de goteo o entrada por abajo.' },
    O('x9d', 9, 'Un caudalímetro magnético en el punto más alto de la tubería marca errático con caudal bajo. ¿Qué harías?',
      ['Moverlo a un tramo vertical que sube, donde la tubería va siempre llena', 'Cambiarlo por un modelo más caro', 'Hacerle un trim de cero', 'Ponerle un filtro antes'], 0,
      'En el punto alto se junta aire y el tubo no va lleno.'),
    O('x9e', 9, 'El blindaje de un cable 4–20 mA se conectó a tierra en los dos extremos. ¿Qué problema puede causar?',
      ['Un lazo de tierra que mete ruido en la señal', 'Ninguno: así es más seguro', 'Que el transmisor no encienda', 'Que la señal se invierta'], 0,
      'Las dos tierras no están al mismo potencial: circula corriente por el blindaje. Va a tierra solo del lado de la fuente.'),

    // ---------- 10. P&ID y fallas del lazo ----------
    O('x10a', 10, 'En un P&ID, ¿qué es <b>LIC-101</b>?',
      ['Un controlador indicador de nivel, del lazo 101', 'Un indicador de caudal', 'Un transmisor de nivel', 'Un interruptor de nivel'], 0,
      'Primera letra = variable (L, nivel); siguientes = función (I indica, C controla); el número identifica el lazo.'),
    O('x10b', 10, 'En un P&ID, ¿qué es <b>TT-103</b>?',
      ['Un transmisor de temperatura, del lazo 103', 'Un termopar', 'Un controlador de temperatura', 'Un termostato'], 0,
      'T (temperatura) + T (transmisor). El sensor (elemento primario) sería TE-103.'),
    O('x10c', 10, 'En un P&ID, un círculo con una línea horizontal en el medio representa…',
      ['Un instrumento en la sala de control (tablero), al alcance del operador', 'Un instrumento montado en campo', 'Una válvula de control', 'Un tanque'], 0,
      'ISA 5.1: círculo sin línea = en campo; con línea = en sala de control; círculo dentro de un cuadrado = en el sistema de control (DCS/PLC).'),
    O('x10d', 10, 'En un P&ID, la línea de trazos (- - -) entre el transmisor y el controlador representa…',
      ['Una señal eléctrica (por ejemplo, 4–20 mA)', 'Una tubería de proceso', 'Una señal neumática', 'Un capilar'], 0,
      'ISA 5.1: trazos = eléctrica; línea con dos rayitas (//) = neumática; línea continua gruesa = proceso.'),
    O('x10e', 10, 'El nivel en el PLC marca siempre un 25 % más que el real, en todo el rango, aunque el transmisor está bien calibrado. ¿Causa más probable?',
      ['La escala (LRV/URV) del PLC no coincide con la del transmisor', 'Cable abierto', 'Blindaje a tierra en dos extremos', 'Falta de alimentación'], 0,
      'Por ejemplo, transmisor de 0–4 m y PLC escalado en 0–5 m: todo sale × 1,25. La prueba de lazo lo detecta.'),
    O('x10f', 10, 'Una lectura de caudal sube y se queda clavada en un valor aunque el caudal sigue aumentando; el lazo mide 20,5 mA. ¿Qué pasa?',
      ['El transmisor se saturó: el proceso supera el URV configurado', 'Hay un cable abierto', 'Hay ruido de un variador', 'Falta alimentación'], 0,
      'Por encima del URV la salida se satura (≈ 20,5 mA). Hay que re-rangear o elegir otro rango.'),
    O('x10g', 10, 'Abajo el transmisor mide bien, pero cerca del 100 % la corriente no pasa de 17 mA. ¿Causa más probable?',
      ['Tensión insuficiente para la carga del lazo (fuente baja o demasiada resistencia)', 'Escala mal configurada en el PLC', 'Blindaje mal conectado', 'Sensor dañado'], 0,
      'A más corriente, más caída en la carga; si no queda la tensión mínima del transmisor, la salida se "achata" arriba.')
  ];

  const N_EVAL = 20;
  const seleccion = (semilla) => {
    const r = II.rng(String(semilla) + '|examen-seleccion');
    const elegidas = [];
    TEMAS.forEach((t) => elegidas.push(...II.mezclar(r, BANCO.filter((q) => q.mod === t.n)).slice(0, 2)));
    return elegidas.map((q) => q.id);
  };
  const porId = (id) => BANCO.find((q) => q.id === id);
  const calificar = (ids, resp, semilla) => {
    const puntos = ids.map((id) => { const q = porId(id); return q ? II.preguntas.calificar(II.preguntas.instancia(q, semilla), (resp || {})[id]) : 0; });
    const suma = puntos.reduce((a, b) => a + b, 0);
    return { puntos, suma, nota: Math.round((suma / ids.length) * 1000) / 10 };
  };

  II.EVALUACIONES = II.EVALUACIONES || {};
  II.EVALUACIONES['ii-s6'] = {
    id: 'ii-s6', examen: true,
    titulo: 'Examen final', subtitulo: 'Instrumentación Industrial · todo el módulo',
    nEval: N_EVAL, minutos: null, peso: 40, solucionesAlEnviar: true,
    pagina: 'examen.html',
    fuentes: {}, modulos: [], temas: TEMAS, banco: BANCO,
    seleccion, porId, calificar
  };
  II.SESIONES['ii-s6'] = { id: 'ii-s6', etiqueta: 'Examen final', numero: '', titulo: 'Instrumentación Industrial (20 preguntas)', fecha: 'Miércoles 07/10, después de la sesión 5', asincrona: true, examen: true, retos: {}, pasos: [], diagnostico: [] };
})();
