// ============================================================
// Medidas Eléctricas · Sesión "Laboratorio: la planta de lácteos" (jue 15/10/2026)
// Caso industrial: cargas que entran y salen, banco fijo vs automático,
// dónde se conecta la compensación y cómo se conecta un banco.
// Reutiliza los diagramas de fp-diagramas.js y el ejercicio e5 de fp-sesion.js.
// Datos del caso (380 V, 50 Hz):
//   compresores de frío 15 kW FP 0,80 (24 h) · homogeneizador 30 kW FP 0,65 (día)
//   bombas y cintas 25 kW FP 0,75 (día) · compresor de aire 10 kW FP 0,75 (día y almuerzo)
//   Día 80 kW / 77,2 kVAR / FP 0,72 / 169 A · Almuerzo 25 / 20,1 / 0,78 / 49 A · Noche 15 / 11,3 / 0,80 / 28 A
// ============================================================
(function () {
  const FP = (window.FP = window.FP || {});
  FP.SESIONES = FP.SESIONES || {};
  FP.SESIONES['me-planta'] = {
    id: 'me-planta',
    materia: 'Medidas Eléctricas',
    titulo: 'Laboratorio: la planta de lácteos',
    pasos: [
      { id: 'inicio', tipo: 'inicio', titulo: 'Laboratorio: la planta de lácteos', idea: 'Escanea el QR, entra con tu nombre y carnet. Trabajo en parejas.' },

      { id: 'caso', tipo: 'teoria', titulo: 'El caso: una planta de lácteos en Sucre', idea: 'El gerente paga recargo por FP bajo y nos pide una recomendación.',
        puntos: ['Red trifásica de <b>380 V, 50 Hz</b>.', 'Las cargas <b>no están siempre conectadas</b>: hay turno de día, almuerzo y noche.', 'Tarea de la pareja: decidir <b>cuántos kVAR</b>, <b>dónde</b> y <b>de qué tipo</b> (fijo o automático).'],
        derecha: 'Cargas de la planta', derechaTexto: true,
        formulas: ['Compresores de frío: 15 kW · FP 0,80 · 24 h', 'Homogeneizador: 30 kW · FP 0,65 · día', 'Bombas y cintas: 25 kW · FP 0,75 · día', 'Compresor de aire: 10 kW · FP 0,75 · día y almuerzo'],
        guia: ['Que copien la tabla en su hoja. El homogeneizador es un motor de 75 kW que trabaja a 30 kW.'] },

      { id: 'conceptos', tipo: 'teoria', titulo: 'Repaso: las tres potencias', idea: 'La red entrega S; el trabajo útil es P; Q va y vuelve.',
        puntos: ['<b>P (kW)</b>: potencia activa, se convierte en trabajo o calor. Es lo que mueve el homogeneizador.', '<b>Q (kVAR)</b>: potencia reactiva, crea el campo magnético del motor. Va y vuelve a la red, pero la corriente que la lleva sí calienta cables y trafo.', '<b>S (kVA)</b>: potencia aparente, la que «ve» el cable. <b>FP = P/S</b>: qué fracción de la corriente hace trabajo.'],
        formulas: ['S² = P² + Q²', 'FP = P / S = cos φ', 'Q = P · tan φ', 'tan φ = √(1 − FP²) / FP', 'I = S / (√3 · VL)'],
        guia: ['Preguntar: si Q va y vuelve, ¿por qué la cobran? Porque la corriente que la transporta calienta cables y ocupa el trafo.'] },

      { id: 'factura', tipo: 'explica', titulo: 'Así le cobran a la planta', diagrama: 'factura',
        idea: 'El medidor registra kWh y kVARh del mes. Si el FP medio baja de 0,85, hay recargo.',
        guia: ['Bajar los kVARh y ver cómo desaparece el recargo.', 'Regla de ELFEC (Cochabamba); la de CESSA puede variar.'] },
      { id: 'e5', tipo: 'ejercicio', ejercicio: 'e5' },

      // ---------- Estación 1: más cargas, menos cargas ----------
      { id: 'r1', tipo: 'rapida', titulo: 'Predicción', t: 'Mira la tabla de cargas. ¿En qué turno el FP de la planta es peor?', o: ['de día (todo funcionando)', 'al almuerzo (frío + aire)', 'de noche (solo frío)', 'es igual en los tres'], c: 0 },
      { id: 't-turnos', tipo: 'teoria', titulo: 'Estación 1: más cargas, menos cargas', idea: 'El FP no se suma: se suman P y Q de cada carga.',
        puntos: ['Para cada carga encendida calcula su Q con su propio FP.', 'Suma todas las P y todas las Q. Recién con los totales calculas S, FP e I.', '<b>Error típico</b>: promediar los FP. No vale, porque cada carga pesa distinto.', 'En parejas: día, almuerzo y noche.'],
        formulas: ['Qᵢ = Pᵢ · tan φᵢ', 'P = Σ Pᵢ · Q = Σ Qᵢ', 'FP = P / √(P² + Q²)', 'I = √(P² + Q²) / (√3 · 0,38)', 'tan φ: 0,80 → 0,750 · 0,75 → 0,882 · 0,65 → 1,169'],
        guia: ['Dar 10 min. Pasar por las parejas: el error más común es promediar los FP.'] },
      { id: 't-turnos-sol', tipo: 'teoria', titulo: 'Resultados de la estación 1', idea: 'Cuanto más motores encendidos y poco cargados, peor FP.', derecha: 'Solución',
        puntos: ['<b>Día</b>: Q = 11,3 + 35,1 + 22,1 + 8,8 = 77,2 kVAR.', 'De día la planta toma <b>169 A</b> para hacer 80 kW de trabajo.', 'De noche el FP «mejora», pero solo porque quedan los compresores.'],
        formulas: ['Día: 80 kW · 77,2 kVAR · FP 0,72 · 169 A', 'Almuerzo: 25 kW · 20,1 kVAR · FP 0,78 · 49 A', 'Noche: 15 kW · 11,3 kVAR · FP 0,80 · 28 A'],
        guia: ['Preguntar qué carga aporta más Q: el homogeneizador (35,1 kVAR), por su FP de 0,65.'] },

      { id: 'r2', tipo: 'rapida', titulo: 'Predicción', t: 'El homogeneizador es un motor de 75 kW que trabaja a 30 kW. Comparado con trabajar a plena carga, su FP…', o: ['mejora', 'empeora', 'no cambia', 'se vuelve capacitivo'], c: 1 },
      { id: 't-motor', tipo: 'teoria', titulo: '¿Por qué un motor poco cargado tiene mal FP?', idea: 'La Q del motor casi no depende de la carga; la P sí.',
        puntos: ['El motor necesita Q para magnetizar su núcleo. Esa Q depende de la <b>tensión</b>, no de lo que mueve.', 'La P sí sigue a la carga mecánica: con poca carga, P baja mucho y Q casi nada.', 'Lección práctica: un motor <b>sobredimensionado</b> empeora el FP de toda la planta.'],
        derecha: 'Homogeneizador (valores típicos)',
        formulas: ['FP = P / √(P² + Q²)', 'En vacío: P ≈ 2 kW · Q ≈ 25 kVAR → FP ≈ 0,08', 'A 30 kW: Q ≈ 35 kVAR → FP 0,65', 'A 75 kW: Q ≈ 45 kVAR → FP 0,86'],
        guia: ['P sube 37 veces de vacío a plena carga; Q ni siquiera se duplica.'] },

      // ---------- Estación 2: ¿cuántos kVAR? ----------
      { id: 't-qc', tipo: 'teoria', titulo: 'Estación 2: ¿cuántos kVAR?', idea: 'El capacitor entrega en el sitio la Q que pedía el motor.',
        puntos: ['El capacitor va <b>en paralelo</b>: la carga sigue funcionando igual, P no cambia.', 'Solo baja la Q que viaja desde el trafo. Por eso bajan S y la corriente.', 'Los bancos vienen en <b>pasos</b>: se redondea hacia arriba.'],
        formulas: ['Qc = P · (tan φ₁ − tan φ₂)', 'Meta FP 0,95 → tan φ₂ = 0,329', 'Día: tan φ₁ = 77,2/80 = 0,964', 'Qc = 80 · (0,964 − 0,329) = 50,8 kVAR', 'Pasos de 10 kVAR → 6 pasos'],
        guia: ['Que lo calculen antes de mostrar el diagrama.'] },
      { id: 'corrector', tipo: 'explica', titulo: 'De día: agrega pasos al banco', diagrama: 'corrector', params: { P: 80, q: 10, N: 12, fp1: 0.72 },
        idea: 'Predice: ¿5 o 6 pasos? Con 5 llega a 0,947; con 6 a 0,978 y la corriente baja de 169 a 124 A.',
        guia: ['Agregar de a uno. Señalar el recuadro de corriente y el de µF por fase.'] },

      // ---------- Estación 3: la noche ----------
      { id: 'r3', tipo: 'rapida', titulo: 'Predicción', t: 'El electricista deja los 60 kVAR conectados fijos. De noche (solo compresores, 15 kW), la corriente del trafo…', o: ['baja', 'sube', 'no cambia', 'se hace cero'], c: 1 },
      { id: 'caso-noche', tipo: 'explica', titulo: 'Estación 3: la noche con banco fijo', diagrama: 'corrector', params: { P: 15, q: 5, N: 12, fp1: 0.8 }, inicial: { pasos: 12 },
        idea: '12 pasos de 5 kVAR = los mismos 60 kVAR. Quita pasos: ¿cuántos dejarías de noche?',
        guia: ['Con 12 pasos: FP 0,29 capacitivo y 77 A. Sin banco eran 28 A.', 'Con 2 pasos (10 kVAR): FP 0,997.'] },
      { id: 't-auto', tipo: 'teoria', titulo: 'Banco fijo o automático', idea: 'La carga cambia durante el día: la compensación también debe cambiar.',
        puntos: ['Con carga baja, un banco fijo grande <b>sobrecompensa</b>: la corriente sube, la tensión sube y el FP se vuelve capacitivo.', '<b>Banco automático</b>: un regulador mide el FP y conecta o desconecta pasos.', 'Espera unos segundos antes de reconectar un paso: el capacitor debe descargarse.', '<b>Fijo</b> solo para la carga que siempre está (los compresores de frío).'],
        derecha: 'Cuánto necesita cada turno',
        formulas: ['Día: Qc = 50,8 → 6 pasos de 10', 'Almuerzo: Qc = 25 · (0,803 − 0,329) = 11,9 → 2 pasos', 'Noche: Qc = 15 · (0,750 − 0,329) = 6,3 kVAR', 'Fijo 60 de noche: Q = 11,3 − 60 = −48,8', '→ S = 51 kVA · I = 77 A (sin banco: 28 A)'],
        guia: ['Almuerzo con 60 fijos: FP 0,53 capacitivo y 72 A. Que lo calculen en la hoja.'] },

      // ---------- Estación 4: ¿dónde y cómo? ----------
      { id: 't-donde', tipo: 'teoria', titulo: 'Estación 4: ¿dónde se conecta?', idea: 'El capacitor solo alivia los cables que están entre la fuente y él.',
        puntos: ['La Q viaja desde el capacitor hasta el motor. <b>Aguas arriba</b> del capacitor ya no circula.', '<b>Individual</b> (en bornes del motor): alivia su cable, el tablero y el trafo.', '<b>Por grupos</b> (tablero de un sector): alivia desde ese tablero hacia arriba.', '<b>Central</b> (tablero general): alivia solo el trafo y el alimentador principal.'],
        derecha: 'Qué alivia cada opción', derechaTexto: true,
        formulas: ['Trafo → tablero general → tablero de sector → motor', 'Individual: todo el camino', 'Grupos: desde el tablero de sector', 'Central: solo trafo y alimentador'],
        guia: ['Dibujar el unifilar en la pizarra y marcar con color los tramos aliviados en cada opción.'] },
      { id: 'r4', tipo: 'rapida', titulo: 'Predicción', t: 'El banco está en el tablero general. ¿Baja la corriente en el cable que va al homogeneizador?', o: ['sí, baja', 'no, sigue igual', 'sube', 'depende del trafo'], c: 1 },
      { id: 't-individual', tipo: 'teoria', titulo: 'Compensación individual del homogeneizador', idea: 'Se conecta después de su contactor: se apaga junto con el motor.',
        puntos: ['Ventaja: cuando el motor se apaga, su capacitor también. <b>Nunca sobrecompensa</b>.', 'Límite: Qc ≤ 90 % de la Q en vacío. Si es mayor, al desconectar el motor sigue girando, los capacitores lo excitan y genera sobretensión (<b>autoexcitación</b>).', 'Dato: Q en vacío del homogeneizador = 25 kVAR.'],
        formulas: ['Qc ≤ 0,9 · Q₀', 'Q₀ = √3 · VL · I₀', 'Qc ≤ 0,9 · 25 = 22,5 → 20 kVAR', 'Homogeneizador: Q 35,1 → 15,1 kVAR', 'Su FP: 0,65 → 0,89'],
        guia: ['I₀ = 25 000 / (1,732 · 380) ≈ 38 A: es la corriente que toma en vacío.'] },
      { id: 't-conexion', tipo: 'teoria', titulo: '¿Cómo se conecta un banco? En triángulo', idea: 'En baja tensión el banco va en Δ: cada capacitor recibe 380 V.',
        puntos: ['La Q de un capacitor crece con el <b>cuadrado</b> de su tensión: Q = V² · ω · C.', 'En Δ cada capacitor recibe 380 V; en Y solo 220 V. Por eso en Δ se necesitan <b>3 veces menos µF</b>: más chico y más barato.', 'Margen de corriente ≈ 1,43: 1,3 por armónicos y sobretensión × 1,1 por tolerancia del capacitor.'],
        derecha: 'Un paso de 10 kVAR a 380 V',
        formulas: ['ω = 2π · 50 = 314,2 rad/s', 'Δ: C = Qc / (3 · ω · VL²) = 73,5 µF', 'Y: C = Qc / (ω · VL²) = 220 µF', 'Ic = Qc / (√3 · VL) = 15,2 A', 'Contactor ≥ 1,43 · Ic ≈ 22 A'],
        guia: ['380 = √3 · 220, y (√3)² = 3: de ahí sale el factor 3.'] },
      { id: 't-componentes', tipo: 'teoria', titulo: 'Las partes de un banco y la seguridad', idea: 'Un capacitor desconectado puede seguir cargado.',
        puntos: ['<b>Fusibles o interruptor</b>: protegen cada paso.', '<b>Contactor para capacitores</b>: limita el pico de corriente al conectar.', '<b>Resistencias de descarga</b> y <b>regulador</b> de FP.', 'Si hay variadores o fuentes electrónicas: <b>reactor de desintonía</b> para evitar resonancia con armónicos.'],
        derecha: 'Seguridad', derechaTexto: true,
        formulas: ['Descarga: ≤ 75 V en 3 min (IEC 60831-1)', 'Antes de tocar: desconectar, esperar y medir', 'Con armónicos: reactor de desintonía 7 %'],
        guia: ['Conectar con r6 de la clase anterior: con armónicos el cosfímetro miente y el capacitor puede resonar.'] },
      { id: 'r5', tipo: 'rapida', titulo: 'Predicción', t: 'Para el mismo paso de 10 kVAR a 380 V, conectado en estrella en vez de triángulo, cada capacitor necesita…', o: ['3 veces menos µF', 'los mismos µF', '3 veces más µF', '√3 veces más µF'], c: 2 },

      // ---------- Cierre ----------
      { id: 't-recomendacion', tipo: 'teoria', titulo: 'Tu recomendación al gerente', idea: 'En 3 líneas: cuántos kVAR, dónde, fijo o automático, y por qué.',
        puntos: ['Escríbela en tu hoja con tu pareja y envía una foto al docente.', 'Justifica cada decisión con un número de la clase.', 'Una posible solución está a la derecha: la tuya puede ser distinta si la justificas.'],
        derecha: 'Una solución posible',
        formulas: ['Homogeneizador: 20 kVAR individual', 'Compresores de frío: 5 kVAR fijo', 'Resto: banco central automático, pasos de 10 kVAR', 'Día: 3 pasos → FP 0,96 · 126 A', 'Noche: FP 0,92 sin sobrecompensar'],
        guia: ['Día: Q = 77,2 − 20 − 5 − 30 = 22,2 → FP 0,964. Noche: el homogeneizador se apaga con su capacitor; Q = 11,3 − 5 = 6,3 → FP 0,92 (sin recargo).'] },

      { id: 'cierre', tipo: 'cierre', titulo: 'Cierre', idea: 'La compensación depende de qué cargas están encendidas y de dónde se conecta.' }
    ]
  };
})();
