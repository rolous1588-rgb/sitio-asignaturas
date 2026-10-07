// ============================================================
// Control de estudio · Instrumentos en planta: selección, instalación y puesta en marcha
// Sesión asíncrona (ii-ce): 7 módulos con práctica sin nota + evaluación de 15 preguntas en 20 minutos (un intento).
// Reglas tomadas de manuales de fabricantes (enlaces en FUENTES).
// ============================================================
(function () {
  const II = (window.II = window.II || {});

  const FUENTES = {
    rosemount: { t: 'Rosemount 3051 · Guía de inicio rápido (Emerson)', url: 'https://www.emerson.com/documents/automation/quick-start-guide-rosemount-3051-pressure-transmitter-en-5446184.pdf' },
    rosemountMan: { t: 'Rosemount 3051 · Manual de referencia (Emerson)', url: 'https://core.instrumart.com/assets/3051-manual.pdf' },
    vega: { t: 'VEGAPULS 64 · Instrucciones de servicio (VEGA)', url: 'https://www.insatech.com/media/ifui4ivc/im-51141-en-vegapuls-64-4-20-ma-hart-two-wire-2021-02-17.pdf' },
    micropilot: { t: 'Micropilot FMR10 · Guía breve (Endress+Hauser)', url: 'https://bdih-download.endress.com/file/005056A5E3831EEEA1A674E05413EB01/KA01657FEN_0123-00.pdf' },
    promag: { t: 'Promag · Manual de operación (Endress+Hauser)', url: 'https://bdih-download.endress.com/files/DLA/4169B9E9950A0C4BE10000000A35E018/BA029DEN.pdf' },
    wika: { t: 'WIKA · Dónde instalar un termopozo (buenas prácticas)', url: 'https://blog.wika.com/us/knowhow/where-should-i-install-my-thermowell-guide-for-best-practices/' },
    turbina: { t: 'AW-Lake · Manual de instalación de turbinas', url: 'https://www.instrumart.com/assets/AW-Turbine-Manual.pdf' },
    placa: { t: 'Chemical Processing · Tramos rectos de placas orificio (ISO 5167)', url: 'https://www.chemicalprocessing.com/processing-equipment/fluid-handling/article/11343758/think-straight-about-orifice-plates' }
  };
  const f = (k) => FUENTES[k].t.split(' · ')[0];

  // ---------- preguntas: helpers ----------
  const O = (id, mod, t, o, c, por, fuente) => ({ id, mod, tipo: 'opcion', t, o, c, por, fuente: fuente ? f(fuente) : '' });

  // ============================================================
  // MÓDULOS
  // ============================================================
  const MODULOS = [
    { n: 1, titulo: 'Del papel a la planta: cómo se elige un instrumento', min: 12,
      objetivo: 'Conocer el recorrido real de un instrumento (del P&ID a la operación) y los criterios para elegirlo bien.',
      vistas: [{ tipo: 'html', titulo: 'El recorrido de un instrumento', html: `
        <ul class="ideas">
          <li><b class="n">1</b><span><b>P&amp;ID:</b> define qué se mide, dónde y con qué TAG (por ejemplo LT-101), y el rango esperado.</span></li>
          <li><b class="n">2</b><span><b>Selección y hoja de datos</b> (datasheet): rango, presión y temperatura del proceso, fluido, materiales, conexión, señal, IP y área clasificada.</span></li>
          <li><b class="n">3</b><span><b>Compra y recepción:</b> se verifica la placa del equipo (modelo, rango, materiales, certificados) contra la hoja de datos.</span></li>
          <li><b class="n">4</b><span><b>Instalación</b> según el <b>plano de montaje</b> (hook-up) y las reglas del fabricante.</span></li>
          <li><b class="n">5</b><span><b>Puesta en marcha:</b> prueba de lazo y trim de cero.</span></li>
          <li><b class="n">6</b><span><b>Operación y mantenimiento:</b> calibración periódica y registros.</span></li>
        </ul>` }, { tipo: 'html', titulo: 'Qué mirar al elegir', html: `
        <div class="tabla-envoltura"><table class="tabla">
          <tr><th>Criterio</th><th>Qué preguntar</th></tr>
          <tr><td>Proceso</td><td>¿Qué variable? ¿Rango normal y máximo? ¿Presión y temperatura? ¿Líquido, gas, vapor, pulpa?</td></tr>
          <tr><td>Exactitud</td><td>¿Cuánto error se tolera? Más exactitud cuesta más.</td></tr>
          <tr><td>Materiales en contacto</td><td>¿Resisten el fluido? 316L es lo común; corrosivos piden Hastelloy, tantalio o recubrimientos.</td></tr>
          <tr><td>Conexión al proceso</td><td>Rosca NPT, brida (ASME B16.5 / EN 1092) o sanitaria (tri-clamp).</td></tr>
          <tr><td>Ambiente</td><td>Grado IP (IEC 60529), sol, temperatura ambiente, vibración.</td></tr>
          <tr><td>Área clasificada</td><td>¿Hay gas, vapor o polvo inflamable? Certificación Ex de la zona (IEC 60079).</td></tr>
          <tr><td>Señal</td><td>4–20 mA con HART, bus de campo, inalámbrico.</td></tr>
          <tr><td>Costo total</td><td>Compra + instalación + mantenimiento + repuestos y soporte en Bolivia.</td></tr>
        </table></div>` }],
      reglas: [
        ['Todo empieza en el <b>P&amp;ID</b>: qué se mide, dónde y con qué TAG. Con eso se llena la <b>hoja de datos</b>, que es lo que se usa para comprar.', ''],
        ['<b>Rango:</b> el valor normal debe quedar cerca de la mitad o de dos tercios del rango, con margen para el máximo. Un rango muy grande pierde resolución; uno muy chico se satura.', ''],
        ['<b>Partes en contacto con el proceso</b> ("mojadas"): deben resistir el fluido según las tablas de compatibilidad del fabricante.', ''],
        ['<b>Grado IP</b> (IEC 60529): IP66 resiste chorros fuertes de agua; IP67, una inmersión temporal.', ''],
        ['<b>Áreas clasificadas:</b> el instrumento necesita certificación Ex para esa zona, por ejemplo Ex d (a prueba de explosión) o Ex i (seguridad intrínseca).', ''],
        ['<b>Costo total</b>, no solo el precio: repuestos y soporte técnico en el país, y estandarizar marcas y modelos para tener menos repuestos en stock.', '']
      ],
      errores: [
        ['El transmisor marca el máximo durante la operación normal', 'Rango demasiado chico: se satura.'],
        ['El diafragma se corroyó en pocos meses', 'Material de las partes mojadas incompatible con el fluido.'],
        ['Entra agua al cabezal cuando se lava el equipo con manguera', 'Grado IP insuficiente (o tapa mal cerrada).'],
        ['Un transmisor dañado tarda meses en reemplazarse', 'Se eligió un modelo sin repuestos ni soporte en el país.']
      ],
      caso: 'Una planta concentradora compra transmisores de presión para líneas de pulpa: elige sello de diafragma al ras (no se tapa), partes mojadas resistentes a la abrasión, IP67 por el lavado con agua y una marca con representante y repuestos en Bolivia.',
      practica: [
        O('p1a', 1, '¿Qué documento resume lo necesario para comprar un transmisor (rango, materiales, conexión, señal, área clasificada)?',
          ['La hoja de datos (datasheet)', 'El P&ID', 'El manual de usuario', 'La factura'], 0,
          'El P&ID dice qué se mide y dónde; la hoja de datos dice exactamente qué equipo comprar.'),
        O('p1b', 1, 'Un transmisor medirá una presión normal de 6 bar que puede llegar a 8 bar. ¿Qué rango es más adecuado?',
          ['0 a 10 bar', '0 a 6 bar', '0 a 100 bar', '0 a 8 bar'], 0,
          'Con 0–10 bar, el valor normal queda en el 60 % y el máximo cabe con margen. 0–6 se satura; 0–100 pierde resolución; 0–8 no deja margen.')
      ],
      fuentes: [] },

    { n: 2, titulo: 'Temperatura en planta: el termopozo y el sensor', min: 12,
      objetivo: 'Saber dónde y a qué profundidad va un termopozo, y qué errores de montaje afectan la medición.',
      vistas: [{ tipo: 'escena', titulo: 'Profundidad del termopozo', escena: 'termopozo', params: { variante: 'recto' } },
        { tipo: 'diagrama', titulo: 'El punto de medición completo (Sesión 2)', nombre: 'plantaT' }],
      reglas: [
        ['El <b>termopozo</b> protege al sensor (presión, corrosión, velocidad) y permite <b>retirarlo sin parar ni vaciar la línea</b>.', ''],
        ['Profundidad: la punta entre <b>1/3 y 2/3 del diámetro</b> de la tubería, o al menos <b>10 veces el diámetro de la punta</b> (mínimo 50 mm).', 'wika'],
        ['En tuberías delgadas, se instala en un <b>codo</b>, con la punta <b>de frente al flujo</b> (aguas arriba).', 'wika'],
        ['Varios termopozos en la misma línea: separarlos unos <b>25 diámetros</b> de tubería.', 'wika'],
        ['Con velocidades altas el flujo hace vibrar el termopozo: se verifica con el cálculo de <b>frecuencia de estela</b> de <b>ASME PTC 19.3 TW</b>.', 'wika'],
        ['El inserto debe <b>tocar el fondo</b> del termopozo (los insertos traen resorte): si queda aire, la respuesta es lenta.', ''],
        ['Termopar: del cabezal al transmisor solo con <b>cable de compensación</b> del mismo tipo; mejor aún, transmisor en el cabezal.', '']
      ],
      errores: [
        ['Responde lento a los cambios de temperatura', 'El inserto no toca el fondo del termopozo.'],
        ['Lee de menos en un proceso caliente', 'Inserción muy corta: el vástago conduce calor hacia afuera.'],
        ['El termopozo se rompió por vibración', 'Velocidad alta sin el cálculo de frecuencia de estela.'],
        ['El error del termopar sigue la temperatura del cabezal', 'Cable de cobre en vez de cable de compensación.']
      ],
      caso: 'En una planta de lácteos, la temperatura de pasteurización (72 °C) se mide en un codo de la tubería de 2", con termopozo sanitario, Pt100 a 3 hilos y transmisor en el cabezal; se calibra cada año contra un patrón.',
      practica: [
        { id: 'p2a', mod: 2, tipo: 'zona', escena: 'termopozo', params: { variante: 'recto' }, correcta: 'B', t: '¿Cuál de los tres termopozos tiene la profundidad correcta?', por: 'La punta debe quedar entre 1/3 y 2/3 del diámetro de la tubería.', fuente: f('wika') },
        O('p2b', 2, 'Una Pt100 dentro de su termopozo tarda varios minutos en reaccionar a un cambio. ¿Qué revisarías primero?',
          ['Que el inserto toque el fondo del termopozo', 'El color del cable', 'La escala del PLC', 'La pantalla del transmisor'], 0,
          'El aire entre el inserto y el termopozo es un aislante: la respuesta se vuelve lenta.')
      ],
      fuentes: ['wika'] },

    { n: 3, titulo: 'Presión en planta: tomas, líneas de impulso y manifold', min: 13,
      objetivo: 'Elegir la posición de la toma y del transmisor según el fluido, y operar un manifold sin dañar el transmisor.',
      vistas: [{ tipo: 'escena', titulo: 'Toma en una línea de vapor', escena: 'toma', params: { fluido: 'vapor' } },
        { tipo: 'escena', titulo: 'Transmisor en una línea de gas', escena: 'posicion', params: { fluido: 'gas' } },
        { tipo: 'html', titulo: 'Manifold de 3 válvulas (transmisor DP)', html: `
          <p style="margin:0 0 8px">Tiene una válvula de <b>bloqueo de alta</b>, una de <b>bloqueo de baja</b> y una <b>ecualizadora</b> que une los dos lados. Para ponerlo en servicio sin someter la celda a la presión de un solo lado:</p>
          <ul class="ideas">
            <li><b class="n">1</b><span>Verificar que las tres válvulas estén cerradas.</span></li>
            <li><b class="n">2</b><span>Abrir la <b>ecualizadora</b>.</span></li>
            <li><b class="n">3</b><span>Abrir lentamente el <b>bloqueo de alta</b> (los dos lados quedan a la misma presión).</span></li>
            <li><b class="n">4</b><span>Cerrar la <b>ecualizadora</b>.</span></li>
            <li><b class="n">5</b><span>Abrir el <b>bloqueo de baja</b>.</span></li>
          </ul>
          <p class="nota" style="margin:8px 0 0">Con la ecualizadora abierta, ΔP = 0: así se hace el trim de cero. Revisa siempre el manual del manifold instalado.</p>` },
        { tipo: 'diagrama', titulo: 'Accesorios según el fluido (Sesión 2)', nombre: 'plantaP' }],
      reglas: [
        ['<b>Líquido:</b> tomas <b>al costado</b> de la línea; transmisor <b>al lado o debajo</b> de las tomas.', 'rosemount'],
        ['<b>Gas:</b> tomas <b>arriba o al costado</b>; transmisor <b>al lado o encima</b> (el condensado vuelve a la tubería).', 'rosemount'],
        ['<b>Vapor:</b> tomas <b>al costado</b>; transmisor <b>al lado o debajo</b>, con las líneas de impulso <b>llenas de agua</b>.', 'rosemount'],
        ['Líneas de impulso <b>cortas</b>, sin puntos altos donde se junte gas (en líquido) ni bajos donde se junte condensado (en gas), y con las dos ramas a la misma temperatura.', ''],
        ['Accesorios: <b>válvula de bloqueo</b> para retirar el instrumento, <b>sifón</b> en vapor, <b>sello de diafragma</b> en fluidos corrosivos, viscosos o con sólidos, y <b>amortiguador</b> con pulsaciones.', ''],
        ['Después de instalar, <b>trim de cero</b> para eliminar el efecto de la posición de montaje.', 'rosemount']
      ],
      errores: [
        ['Lectura errática en una línea de líquido', 'Transmisor encima de las tomas: aire atrapado.'],
        ['Un DP en servicio marca siempre cero', 'La válvula ecualizadora quedó abierta.'],
        ['El manómetro de una línea de vapor se deformó', 'Falta el sifón.'],
        ['Lectura que se corre en una línea de gas', 'Condensado en la línea: transmisor debajo de las tomas.']
      ],
      caso: 'En la línea de vapor de una caldera, el PT va debajo de una toma lateral, con las líneas llenas de agua y un manifold de 3 válvulas; el manómetro local lleva sifón y válvula de bloqueo.',
      practica: [
        { id: 'p3a', mod: 3, tipo: 'zona', escena: 'toma', params: { fluido: 'gas' }, correctas: ['A', 'B'], t: 'Tubería de <b>gas</b>: ¿dónde va la toma de presión?', por: 'Para gas: arriba o al costado; abajo entraría el condensado.', fuente: f('rosemount') },
        O('p3b', 3, 'Hay que medir la presión de una pulpa de mineral sin que se tape la línea. ¿Qué accesorio usarías?',
          ['Sello de diafragma al ras', 'Sifón', 'Amortiguador', 'Ninguno'], 0,
          'Con sólidos, el sello de diafragma al ras evita que la toma y la línea se tapen.')
      ],
      fuentes: ['rosemount'] },

    { n: 4, titulo: 'Nivel en planta: DP, sellos y radar', min: 13,
      objetivo: 'Instalar bien un nivel por presión diferencial y ubicar correctamente un radar en el techo del tanque.',
      vistas: [{ tipo: 'escena', titulo: 'Radar en un techo abombado', escena: 'techo', params: { variante: 1 } },
        { tipo: 'diagrama', titulo: 'Nivel por presión y por tiempo de vuelo (Sesión 3)', nombre: 'nivel' }],
      reglas: [
        ['DP: toma de <b>alta (H) abajo</b>, por encima de los sedimentos; la de <b>baja (L) arriba</b>, en el gas (tanque cerrado) o al aire (tanque abierto).', ''],
        ['<b>Pierna seca:</b> la rama L tiene gas que no condensa. <b>Pierna húmeda:</b> si condensa (vapor), la rama L se llena de líquido a propósito y se compensa en el cero.', ''],
        ['<b>Sellos remotos</b> con capilares: <b>igual longitud</b> y a la <b>misma temperatura</b>; si no, el nivel deriva.', ''],
        ['Radar: <b>al menos 200 mm de la pared</b>, <b>no en el centro</b> de techos abombados (ecos múltiples) y <b>nunca sobre el chorro de llenado</b>.', 'vega'],
        ['El haz no debe tocar escaleras, serpentines, soportes ni agitadores: dan ecos falsos.', 'vega'],
        ['La antena debe <b>sobresalir de la boquilla</b> (VEGA: al menos 5 mm en conexiones roscadas), y la boquilla debe ser lisa, sin bordes ni soldaduras.', 'micropilot'],
        ['Ultrasónico: perpendicular a la superficie y respetando la zona muerta; el vapor y la espuma lo afectan más que al radar.', '']
      ],
      errores: [
        ['Lecturas erráticas solo mientras se llena el tanque', 'Radar sobre el chorro de llenado.'],
        ['Un eco falso siempre a la misma altura', 'El haz toca una escalera, un soporte o un serpentín.'],
        ['El nivel deriva cuando sale el sol', 'Capilares de los sellos remotos a distinta temperatura.'],
        ['Nivel corrido en un tanque con vapor', 'Pierna húmeda sin compensar en el cero.']
      ],
      caso: 'En un espesador de una planta minera, el nivel de pulpa se mide con radar sin contacto, montado lejos de la alimentación y del puente del rastrillo.',
      practica: [
        O('p4a', 4, '¿Por qué no se monta un radar en el centro de un techo abombado?',
          ['Porque el techo concentra los reflejos y aparecen ecos múltiples', 'Porque ahí no hay espacio', 'Porque se calienta más', 'Porque el radar mide temperatura'], 0,
          'VEGA advierte que en el centro de techos abombados o redondos se forman ecos múltiples.', 'vega'),
        O('p4b', 4, 'En un tanque cerrado con vapor que condensa, la rama de baja del DP se llena de líquido a propósito. ¿Cómo se llama?',
          ['Pierna húmeda', 'Pierna seca', 'Sello de diafragma', 'Venteo'], 0,
          'Con pierna húmeda la rama L tiene una columna fija de líquido, que se compensa en la configuración del cero.')
      ],
      fuentes: ['vega', 'micropilot'] },

    { n: 5, titulo: 'Flujo en planta: tramos rectos y dónde va cada caudalímetro', min: 13,
      objetivo: 'Ubicar correctamente una placa orificio, un caudalímetro magnético y una turbina.',
      vistas: [{ tipo: 'diagrama', titulo: 'Placa, turbina y magnético (Sesión 3)', nombre: 'flujo' }],
      reglas: [
        ['Todo caudalímetro necesita <b>tramo recto</b> antes y después: codos, válvulas y bombas deforman el perfil de velocidad.', ''],
        ['Placa orificio: el tramo recto depende de β y de lo que haya antes. Por ejemplo, con β = 0,55 y un codo de 90° antes, unos <b>16 D</b>; con dos codos seguidos, <b>44 D</b> (tablas de ISO 5167).', 'placa'],
        ['La placa se instala con el <b>borde afilado hacia aguas arriba</b> (el bisel, aguas abajo).', ''],
        ['Magnético: tubería <b>siempre llena</b>, mejor en un tramo <b>vertical que sube</b>; nunca en el <b>punto más alto</b>, ni antes de una <b>descarga libre</b>, ni en la <b>succión de una bomba</b>.', 'promag'],
        ['Magnético: al menos <b>5 D antes y 2 D después</b>; en horizontal, <b>eje de electrodos horizontal</b>; en tubería plástica o revestida, <b>discos de puesta a tierra</b>; el líquido debe conducir (≥ 5 µS/cm).', 'promag'],
        ['Turbina: <b>10 D antes y 5 D después</b>, <b>filtro</b> aguas arriba, <b>válvulas de control aguas abajo</b>, eliminador de gas y <b>bypass</b>. Nunca llenarla de golpe estando vacía.', 'turbina'],
        ['La flecha del cuerpo del medidor debe coincidir con el sentido del flujo.', 'turbina']
      ],
      errores: [
        ['Magnético errático con caudal bajo', 'Está en un punto alto o antes de una descarga libre: el tubo no va lleno.'],
        ['Magnético inestable en tubería de PVC', 'Faltan los discos de puesta a tierra.'],
        ['Turbina dañada al arrancar la línea', 'Se llenó de golpe estando vacía, o entró aire o sólidos (sin filtro).'],
        ['Placa que mide mal desde que se instaló', 'Montada al revés o sin tramo recto suficiente.']
      ],
      caso: 'En una planta de agua potable, el caudal de cada línea se mide con magnéticos en tramos que suben, con 5 D antes y 2 D después, y discos de tierra porque la tubería es revestida.',
      practica: [
        O('p5a', 5, '¿Por qué se pide tramo recto antes de un caudalímetro?',
          ['Para que el flujo llegue ordenado, sin los remolinos de codos y válvulas', 'Para que el instrumento quepa', 'Para ahorrar tubería', 'Para que el agua se enfríe'], 0,
          'Los accesorios deforman el perfil de velocidad; el tramo recto lo vuelve a ordenar.'),
        { id: 'p5b', mod: 5, tipo: 'num', fuente: f('promag'), gen(r) {
          const dn = II.elegir(r, [50, 80, 100, 150, 200]);
          return { t: `Un caudalímetro magnético de <b>DN ${dn}</b> (diámetro ${dn} mm). Endress+Hauser pide al menos <b>5 diámetros</b> de tramo recto antes. ¿Cuántos milímetros como mínimo?`, valor: 5 * dn, unidad: 'mm', sol: `5 × ${dn} = ${5 * dn} mm` };
        } }
      ],
      fuentes: ['promag', 'turbina', 'placa'] },

    { n: 6, titulo: 'Señal y cableado en campo', min: 12,
      objetivo: 'Cablear un lazo 4–20 mA sin ruido ni humedad, y reconocer las protecciones IP y Ex.',
      vistas: [{ tipo: 'escena', titulo: 'Cableado del lazo', escena: 'cableado', params: {} },
        { tipo: 'diagrama', titulo: 'El lazo de corriente (Sesión 3)', nombre: 'lazo420' }],
      reglas: [
        ['Cable de <b>par trenzado blindado</b> (apantallado) para la señal 4–20 mA.', ''],
        ['El blindaje va a tierra en <b>un solo extremo, el de la fuente</b>; en el transmisor se recorta y se aísla.', 'rosemount'],
        ['La señal va <b>separada de los cables de fuerza</b> y de los variadores; si debe cruzarlos, a <b>90°</b>.', ''],
        ['Entrada de cable con <b>prensaestopas</b> adecuado y <b>lazo de goteo</b>; las entradas sin usar se cierran con <b>tapón</b>.', 'rosemountMan'],
        ['<b>Tapa</b> de bornes bien cerrada para mantener el IP, y carcasa conectada a tierra.', ''],
        ['Áreas clasificadas: <b>Ex d</b>, la carcasa resiste y contiene una explosión interna; <b>Ex i</b>, el circuito no tiene energía suficiente para encender la atmósfera. La certificación debe corresponder a la zona.', ''],
        ['Para HART, el lazo necesita al menos <b>250 Ω</b>. Carga máxima total = (V fuente − V mínima) ÷ 0,020 A.', 'rosemountMan']
      ],
      errores: [
        ['La lectura oscila al arrancar un variador', 'Señal junto a cables de fuerza, o blindaje a tierra en los dos extremos.'],
        ['Agua y bornes verdes dentro del transmisor', 'Sin lazo de goteo, entrada sin tapón o tapa abierta.'],
        ['El comunicador HART no se conecta', 'El lazo tiene menos de 250 Ω.']
      ],
      caso: 'En una estación de gas, los transmisores de la zona clasificada son Ex d, con prensaestopas certificados, y los cables de señal van en una bandeja separada de la fuerza.',
      practica: [
        O('p6a', 6, '¿Dónde se conecta a tierra el blindaje del cable de un lazo 4–20 mA?',
          ['En un solo extremo: el de la fuente (tablero)', 'En los dos extremos', 'Solo en el transmisor', 'En ninguno'], 0,
          'A tierra en los dos extremos se forma un lazo de tierra que mete ruido.', 'rosemount'),
        O('p6b', 6, '¿Por qué el cable debe entrar al transmisor formando un lazo de goteo?',
          ['Para que el agua que corre por el cable gotee antes de llegar a la entrada', 'Para que el cable sea más largo', 'Para mejorar la señal', 'Para que se vea ordenado'], 0,
          'El agua escurre por el cable; el lazo la hace gotear en su punto más bajo, lejos de la entrada.')
      ],
      fuentes: ['rosemount', 'rosemountMan'] },

    { n: 7, titulo: 'Puesta en marcha y mantenimiento', min: 12,
      objetivo: 'Saber qué se verifica antes de arrancar (prueba de lazo, cero) y cómo se mantiene confiable un instrumento.',
      vistas: [{ tipo: 'diagrama', titulo: 'Banco de calibración (Sesión 4)', nombre: 'calibracion' }],
      reglas: [
        ['Antes de energizar: comparar la instalación con el <b>plano de montaje</b> y la <b>hoja de datos</b> (TAG, rango, materiales, conexión).', ''],
        ['<b>Prueba de lazo:</b> con un medidor de referencia en el lazo, se fuerza la salida del transmisor (4, 12 y 20 mA) y se comprueba lo que muestra el sistema de control: valor, escala y alarmas.', 'rosemountMan'],
        ['<b>Trim de cero</b> después de instalar los transmisores manométricos y DP: elimina el efecto de la posición de montaje.', 'rosemount'],
        ['Líneas de impulso purgadas; en vapor, <b>llenas de agua</b> antes de medir.', 'rosemountMan'],
        ['Calibración periódica: <b>como se encontró</b> → ajuste si hace falta (primero cero, luego span) → <b>como se dejó</b>, con un patrón 4 veces mejor.', ''],
        ['El <b>intervalo de calibración</b> depende de la deriva, de qué tan crítica es la medición y del historial.', ''],
        ['<b>Todo queda registrado:</b> sin registro no se puede demostrar que la medición era confiable.', '']
      ],
      errores: [
        ['El PLC muestra otro valor que el transmisor', 'Escala distinta en el PLC (no se hizo la prueba de lazo) o salida corrida (trim de salida).'],
        ['Un transmisor nuevo marca 0,03 bar abierto a la atmósfera', 'Falta el trim de cero después del montaje.'],
        ['Un DP de vapor marca mal al arrancar', 'Las líneas no se llenaron de agua.']
      ],
      caso: 'Al terminar el montaje de una planta, el equipo de instrumentación hace la prueba de lazo de cada TAG junto con operación, registra cada resultado y recién entonces se arranca el proceso.',
      practica: [
        { id: 'p7a', mod: 7, tipo: 'orden', t: 'Ordena los pasos de una <b>prueba de lazo</b>.', pasos: [
          'Verificar el montaje y el conexionado contra el plano de montaje',
          'Confirmar con HART el TAG y el rango del transmisor',
          'Avisar a operación y poner el lazo en manual',
          'Forzar 4, 12 y 20 mA desde el transmisor',
          'Comprobar valor, escala y alarmas en el sistema de control, y registrar'],
          por: 'Primero se verifica lo instalado y la configuración; se avisa a operación antes de mover la señal; al final se comprueba y se registra.', fuente: f('rosemountMan') },
        O('p7b', 7, 'Recién instalado, un transmisor de presión manométrica marca 0,03 bar con la toma abierta a la atmósfera. ¿Qué recomienda el fabricante?',
          ['Hacer un trim de cero para eliminar el efecto de la posición de montaje', 'Cambiar el transmisor', 'Re-rango a 0,03–10 bar', 'Nada'], 0,
          'Rosemount recomienda el trim de cero después de instalar los transmisores manométricos y DP.', 'rosemount')
      ],
      fuentes: ['rosemount', 'rosemountMan'] }
  ];

  // ============================================================
  // BANCO DE LA EVALUACIÓN (cada carnet recibe 2 por módulo + 1 extra = 15)
  // ============================================================
  const BANCO = [
    // ---- Módulo 1 ----
    { id: 'b1a', mod: 1, tipo: 'num', gen(r) {
      const R = II.elegir(r, [10, 16, 25, 40]);
      const p = Math.round(R * II.elegir(r, [0.45, 0.5, 0.55, 0.6, 0.65, 0.7]) * 100) / 100;
      return { t: `Un transmisor de presión de <b>0 a ${R} bar</b> trabaja normalmente en <b>${II.fmt(p)} bar</b>. ¿Qué porcentaje del rango está usando?`, valor: (p / R) * 100, unidad: '%', sol: `${II.fmt(p)} ÷ ${R} × 100`, por: 'Lo recomendable es que el valor normal quede cerca de la mitad o de dos tercios del rango.' };
    } },
    O('b1b', 1, 'Un transmisor de nivel irá en un tanque de ácido sulfúrico. ¿Qué criterio de selección es el más crítico?',
      ['El material de las partes en contacto con el proceso', 'El color de la carcasa', 'Que sea la marca más conocida', 'Que tenga una pantalla grande'], 0,
      'Si las partes mojadas no resisten el ácido, el instrumento se destruye en poco tiempo.'),
    O('b1c', 1, 'Un instrumento irá a la intemperie, expuesto a lluvia y a lavados con manguera. ¿Qué grado de protección pedirías?',
      ['IP66 o IP67', 'IP20', 'IP40', 'El grado IP no importa'], 0,
      'IP66 resiste chorros fuertes de agua e IP67 una inmersión temporal (IEC 60529).'),
    O('b1d', 1, 'En una planta de gas natural hay atmósfera potencialmente explosiva. ¿Qué debe tener el transmisor?',
      ['Certificación Ex para esa zona (por ejemplo Ex d o Ex i)', 'Solo un buen grado IP', 'Carcasa de plástico', 'Salida de 0–10 V'], 0,
      'El IP protege del agua y el polvo, pero no evita una explosión: hace falta la certificación Ex de la zona.'),
    O('b1e', 1, 'Dos transmisores cumplen lo técnico. Uno cuesta 15 % menos, pero no tiene representante ni repuestos en Bolivia. ¿Qué conviene considerar?',
      ['El costo total: repuestos, soporte y tiempo de parada pueden costar más que el ahorro', 'Siempre el más barato', 'Siempre el más caro', 'El que llegue más rápido'], 0,
      'Una falla sin repuesto puede parar la planta semanas: el costo total importa más que el precio.'),
    { id: 'b1f', mod: 1, tipo: 'orden', t: 'Ordena el recorrido de un instrumento, desde el papel hasta la operación.', pasos: [
      'Definir la medición en el P&ID (TAG y rango)',
      'Seleccionar el equipo y llenar la hoja de datos',
      'Comprarlo y verificar su placa al recibirlo',
      'Instalarlo según el plano de montaje',
      'Puesta en marcha: prueba de lazo y trim de cero',
      'Operación, calibración periódica y registros'],
      por: 'Primero se define y especifica; después se compra, se instala, se pone en marcha y se mantiene.' },

    // ---- Módulo 2 ----
    { id: 'b2a', mod: 2, tipo: 'zona', escena: 'termopozo', params: { variante: 'codo' }, correcta: 'A', t: 'Tubería <b>delgada</b> con un codo: ¿dónde instalarías el termopozo?', por: 'En tuberías chicas, en un codo con la punta de frente al flujo: así entra lo suficiente.', fuente: f('wika') },
    O('b2b', 2, '¿Para qué sirve el termopozo?',
      ['Protege al sensor del proceso y permite retirarlo sin parar ni vaciar la línea', 'Aumenta la exactitud del sensor', 'Reemplaza al transmisor', 'Amplifica la señal'], 0,
      'Además de proteger, permite cambiar el sensor con la planta en marcha.'),
    O('b2c', 2, 'Para un termopozo en una línea de alta velocidad, ¿qué cálculo pide la norma ASME PTC 19.3 TW?',
      ['La frecuencia de estela (vibración por el flujo) y los esfuerzos', 'La caída de tensión del cable', 'El rango del transmisor', 'La temperatura del cabezal'], 0,
      'El flujo desprende remolinos que hacen vibrar el termopozo; si entra en resonancia, se rompe.', 'wika'),
    { id: 'b2d', mod: 2, tipo: 'num', fuente: f('wika'), gen(r) {
      const d = II.elegir(r, [9, 11, 12, 16, 19, 22]);
      return { t: `La punta de un termopozo mide <b>${d} mm</b> de diámetro. Con la regla de inserción mínima de <b>10 veces el diámetro de la punta</b>, ¿cuántos milímetros debe entrar como mínimo?`, valor: 10 * d, unidad: 'mm', sol: `10 × ${d} = ${10 * d} mm` };
    } },
    O('b2e', 2, 'Un termopar marca bien en el taller, pero ya instalado lee de menos, y el error crece por la tarde, cuando el sol calienta el cabezal. ¿Causa más probable?',
      ['Del cabezal al transmisor se usó cable de cobre en vez de cable de compensación', 'El termopozo es demasiado largo', 'El PLC tiene mal la escala', 'Falta pasta en la rosca'], 0,
      'Con cobre, la unión fría queda en el cabezal y el error sigue su temperatura.'),
    O('b2f', 2, 'Varios termopozos irán en la misma línea. Según WIKA, ¿qué separación conviene entre ellos?',
      ['Unos 25 diámetros de tubería', 'Pegados uno al lado del otro', '1 diámetro', 'No importa la distancia'], 0,
      'Así la estela de un termopozo no perturba la medición del siguiente.', 'wika'),

    // ---- Módulo 3 ----
    { id: 'b3a', mod: 3, tipo: 'zona', escena: 'toma', params: { fluido: 'liquido' }, correcta: 'B', t: 'Tubería con un <b>líquido</b>: ¿dónde va la toma de presión?', por: 'Al costado: arriba entra el aire y abajo los sedimentos.', fuente: f('rosemount') },
    { id: 'b3b', mod: 3, tipo: 'zona', escena: 'posicion', params: { fluido: 'vapor' }, correcta: 'B', t: 'Línea de <b>vapor</b>: ¿dónde montarías el transmisor?', por: 'Al lado o debajo de las tomas, con las líneas llenas de agua.', fuente: f('rosemount') },
    { id: 'b3c', mod: 3, tipo: 'orden', t: 'Ordena los pasos para poner en servicio un transmisor DP con su <b>manifold de 3 válvulas</b>.', pasos: [
      'Verificar que las tres válvulas estén cerradas',
      'Abrir la válvula ecualizadora',
      'Abrir lentamente el bloqueo de alta',
      'Cerrar la válvula ecualizadora',
      'Abrir el bloqueo de baja'],
      por: 'Con la ecualizadora abierta, los dos lados de la celda se presurizan juntos; nunca queda presión de un solo lado.' },
    O('b3d', 3, '¿Por qué, en servicio con vapor, las líneas de impulso se llenan de agua?',
      ['Para que el vapor caliente no llegue al transmisor y lo dañe', 'Para que pesen más', 'Para limpiar la tubería', 'Para medir el nivel'], 0,
      'La columna de agua aísla al transmisor de la temperatura del vapor.', 'rosemount'),
    O('b3e', 3, 'Un DP en servicio marca siempre cero aunque el proceso cambia. ¿Qué válvula del manifold sospechas que quedó abierta?',
      ['La ecualizadora', 'El bloqueo de alta', 'El bloqueo de baja', 'Ninguna'], 0,
      'Con la ecualizadora abierta, los dos lados tienen la misma presión: ΔP = 0.'),
    O('b3f', 3, 'Un transmisor de presión de gas se instaló debajo de la toma. ¿Qué problema aparece con el tiempo?',
      ['El condensado se acumula en la línea y en la celda, y la lectura se corre', 'Ninguno: la posición no importa', 'La señal 4–20 mA se invierte', 'Deja de comunicar por HART'], 0,
      'Para gas, el transmisor va al lado o encima de la toma, para que el condensado vuelva a la tubería.', 'rosemount'),

    // ---- Módulo 4 ----
    { id: 'b4a', mod: 4, tipo: 'zona', escena: 'techo', params: { variante: 2 }, correcta: 'D', t: '¿Dónde instalarías el <b>radar</b> en el techo de este tanque?', por: 'Lejos del chorro de llenado, del agitador y de la escalera, y a más de 200 mm de la pared.', fuente: f('vega') },
    O('b4b', 4, 'Según VEGA, ¿a qué distancia mínima de la pared del tanque conviene montar un radar?',
      ['Al menos 200 mm', 'Pegado a la pared', 'A 5 mm', 'Siempre exactamente en el centro'], 0,
      'La pared cercana devuelve ecos que confunden al radar.', 'vega'),
    O('b4c', 4, 'Un radar da valores erráticos solo mientras se llena el tanque. ¿Causa más probable?',
      ['Está montado sobre el chorro de llenado: mide el chorro y no la superficie', 'El tanque está muy lleno', 'Falta el trim de salida', 'El cable es muy largo'], 0,
      'VEGA: no montar el instrumento en el chorro de llenado ni sobre él.', 'vega'),
    O('b4d', 4, 'Un nivel por DP con sellos remotos deriva cada tarde. Un capilar queda al sol y el otro a la sombra. ¿Qué regla se incumplió?',
      ['Los capilares deben tener igual longitud y estar a la misma temperatura', 'El transmisor debe ir encima del tanque', 'Los sellos deben ser de plástico', 'La toma de alta debe ir arriba'], 0,
      'El líquido de relleno de los capilares se dilata con el calor; si un lado se calienta más, aparece un error.'),
    O('b4e', 4, '¿Por qué la antena del radar debe sobresalir de la boquilla (tubuladura)?',
      ['Para que las paredes y soldaduras de la boquilla no generen ecos falsos', 'Para que se vea mejor', 'Para que no se moje', 'Para medir la temperatura'], 0,
      'Endress+Hauser y VEGA piden que la antena sobresalga y que la boquilla sea lisa.', 'micropilot'),
    O('b4f', 4, 'En un nivel por DP en un tanque abierto, ¿dónde va la toma de alta (H)?',
      ['Abajo, cerca del fondo, por encima de los sedimentos', 'Arriba, en el techo', 'En la mitad del tanque', 'En la descarga de la bomba'], 0,
      'La toma H debe "sentir" toda la columna de líquido; la L queda al aire en un tanque abierto.'),

    // ---- Módulo 5 ----
    { id: 'b5a', mod: 5, tipo: 'zona', escena: 'trazado', params: {}, correcta: 'A', t: '¿Dónde instalarías el <b>caudalímetro magnético</b> en este trazado?', por: 'En el tramo vertical que sube: la tubería va siempre llena.', fuente: f('promag') },
    { id: 'b5b', mod: 5, tipo: 'errores', escena: 'magnetico', params: {}, errores: ['A', 'B', 'C', 'E'], t: '<b>Encuentra los errores</b> en la instalación de este caudalímetro magnético.', por: 'Faltan 5 D de tramo recto, el eje de electrodos debe ser horizontal, en PVC van discos de tierra y la señal no debe ir junto al cable del motor.', fuente: f('promag') },
    { id: 'b5c', mod: 5, tipo: 'num', fuente: f('promag'), gen(r) {
      const dn = II.elegir(r, [65, 80, 100, 125, 150, 200, 250]);
      return { t: `Un caudalímetro magnético de <b>DN ${dn}</b>. Endress+Hauser pide al menos <b>2 diámetros</b> de tramo recto <b>después</b> del medidor. ¿Cuántos milímetros como mínimo?`, valor: 2 * dn, unidad: 'mm', sol: `2 × ${dn} = ${2 * dn} mm` };
    } },
    O('b5d', 5, '¿Dónde debe ir la válvula de control respecto de una turbina?',
      ['Aguas abajo del medidor', 'Aguas arriba, justo antes', 'Da lo mismo', 'Dentro del medidor'], 0,
      'AW-Lake: todas las válvulas de control aguas abajo, para no deformar el flujo ni provocar cavitación en el medidor.', 'turbina'),
    O('b5e', 5, 'Antes de una turbina de combustible, ¿qué accesorio recomienda el fabricante?',
      ['Un filtro (y un eliminador de gas si puede haber aire)', 'Un sifón', 'Un sello de diafragma', 'Una placa orificio'], 0,
      'Los sólidos y el aire dañan el rotor y los rodamientos.', 'turbina'),
    O('b5f', 5, 'Un caudalímetro magnético en tubería de PVC marca inestable. ¿Qué falta casi seguro?',
      ['Los discos de puesta a tierra, para igualar el potencial del líquido', 'Más tramo recto', 'Una válvula aguas arriba', 'Un filtro'], 0,
      'En tubería plástica o revestida, el líquido queda "flotando" eléctricamente sin los discos de tierra.', 'promag'),
    O('b5g', 5, '¿Cómo se instala una placa orificio?',
      ['Con el borde afilado hacia aguas arriba y el bisel hacia aguas abajo', 'Con el bisel hacia aguas arriba', 'Da lo mismo', 'Paralela a la tubería'], 0,
      'Al revés, el coeficiente de descarga cambia y la medición se equivoca.'),

    // ---- Módulo 6 ----
    O('b6a', 6, 'Una entrada de cable del transmisor no se usa. ¿Qué se hace con ella?',
      ['Se cierra con un tapón adecuado (en zonas Ex, con suficientes hilos de rosca enganchados)', 'Se deja abierta para ventilar', 'Se tapa con cinta', 'Se rellena con silicona'], 0,
      'Rosemount exige tapón en las entradas sin usar; para a prueba de explosión, con al menos 5 hilos de rosca.', 'rosemountMan'),
    O('b6b', 6, '¿Cuál es la diferencia entre Ex d y Ex i?',
      ['Ex d: la carcasa resiste y contiene una explosión interna; Ex i: el circuito no tiene energía suficiente para encender la atmósfera', 'Son lo mismo', 'Ex d es para agua y Ex i para polvo', 'Ex i usa una carcasa más gruesa'], 0,
      'Son dos formas distintas de evitar que el instrumento encienda una atmósfera explosiva.'),
    O('b6c', 6, 'La señal de un transmisor oscila cada vez que arranca un variador cercano. El cable de señal va en la misma bandeja que el del motor. ¿Qué corrige el problema?',
      ['Llevar la señal en cable blindado y separada de los cables de fuerza (cruces a 90°)', 'Subir la fuente a 48 V', 'Cambiar el rango', 'Acercar el transmisor al motor'], 0,
      'Los variadores emiten mucho ruido eléctrico: la señal debe ir separada.'),
    O('b6d', 6, 'Para comunicarse por HART con el transmisor desde el tablero, ¿qué necesita el lazo?',
      ['Al menos 250 Ω de resistencia', 'Un tercer cable', 'Cortar el lazo', 'Cable sin blindaje'], 0,
      'Sin esa resistencia, el comunicador no "ve" la señal HART.', 'rosemountMan'),
    { id: 'b6e', mod: 6, tipo: 'num', gen(r) {
      const v = II.elegir(r, [10.5, 11, 11.5, 12, 12.5]);
      return { t: `Un transmisor de 2 hilos necesita al menos <b>${II.fmt(v)} V</b> y la fuente del tablero es de <b>24 V</b>. ¿Cuál es la resistencia máxima del lazo (cable + entrada del PLC) para que llegue a 20 mA?`, valor: (24 - v) / 0.02, unidad: 'Ω', tolRel: 0.01, sol: `(24 − ${II.fmt(v)}) ÷ 0,020` };
    } },
    O('b6f', 6, 'Después de la temporada de lluvias, un transmisor marca errático y al abrirlo tiene agua y bornes verdosos. ¿Qué falló en la instalación?',
      ['Faltó el lazo de goteo, el tapón de la entrada libre o cerrar bien la tapa', 'El rango era muy grande', 'Faltó el trim de salida', 'El termopozo era corto'], 0,
      'El agua entra por el cable, por entradas abiertas o por una tapa mal cerrada.'),

    // ---- Módulo 7 ----
    { id: 'b7a', mod: 7, tipo: 'errores', escena: 'vapor', params: {}, errores: ['A', 'C', 'D', 'E'], t: '<b>Encuentra los errores</b> de esta instalación en una línea de vapor.', por: 'El manómetro necesita sifón, el cable debe entrar por abajo con lazo de goteo, la entrada libre lleva tapón y el transmisor va debajo de la toma.', fuente: f('rosemount') },
    { id: 'b7b', mod: 7, tipo: 'orden', t: 'Ordena los pasos de la <b>calibración de un transmisor</b> en el taller.', pasos: [
      'Aplicar los 5 puntos subiendo y bajando, y registrar (como se encontró)',
      'Comparar el error máximo con la tolerancia',
      'Si no pasa, ajustar primero el cero',
      'Ajustar después el span',
      'Repetir los 5 puntos y registrar (como se dejó)'],
      por: 'Se registra antes de tocar nada; se ajusta cero y luego span; se registra cómo quedó.' },
    O('b7c', 7, '¿Qué se comprueba en una prueba de lazo?',
      ['Que una señal conocida desde campo llegue correcta al sistema de control: valor, escala y alarmas', 'Que el transmisor sea de la marca correcta', 'La exactitud del sensor contra un patrón', 'El color del cable'], 0,
      'La prueba de lazo verifica todo el camino de la señal, desde el transmisor hasta la pantalla del operador.', 'rosemountMan'),
    O('b7d', 7, 'Un transmisor DP se reubicó y quedó montado en otra posición. ¿Qué conviene hacer al terminar?',
      ['Un trim de cero con la ecualizadora abierta (ΔP = 0)', 'Un re-rango', 'Cambiar el cable', 'Nada: la posición no afecta'], 0,
      'La posición de montaje desplaza el cero; se corrige con el trim de cero.', 'rosemount'),
    O('b7e', 7, 'Al arrancar una línea de vapor, el DP que mide su caudal marca mal. ¿Qué se olvidó en la puesta en marcha?',
      ['Llenar de agua las líneas de impulso', 'Hacer un re-rango', 'Cambiar la placa orificio', 'Pintar el transmisor'], 0,
      'En vapor, las líneas se llenan de agua antes de medir; si no, la medición se corre.', 'rosemountMan'),
    O('b7f', 7, '¿Qué decide el intervalo de calibración de un instrumento?',
      ['Su deriva, qué tan crítica es la medición y su historial de calibraciones', 'El color del instrumento', 'Siempre cada 10 años', 'El precio'], 0,
      'Hay que recalibrar antes de que la deriva saque el error de la tolerancia.')
  ];

  // ---------- selección por carnet: 2 por módulo + 1 extra ----------
  const N_EVAL = 15;
  const seleccion = (semilla) => {
    const r = II.rng(String(semilla) + '|ce-seleccion');
    const elegidas = [], resto = [];
    for (let m = 1; m <= 7; m++) {
      const pool = II.mezclar(r, BANCO.filter((q) => q.mod === m));
      elegidas.push(...pool.slice(0, 2)); resto.push(...pool.slice(2));
    }
    const extra = II.mezclar(r, resto).slice(0, N_EVAL - elegidas.length);
    return elegidas.concat(extra).sort((a, b) => a.mod - b.mod).map((q) => q.id);
  };
  const porId = (id) => BANCO.find((q) => q.id === id);
  // calificación total: puntos por pregunta (0 a 1) y nota sobre 100
  const calificar = (ids, resp, semilla) => {
    const puntos = ids.map((id) => { const q = porId(id); return q ? II.preguntas.calificar(II.preguntas.instancia(q, semilla), (resp || {})[id]) : 0; });
    const suma = puntos.reduce((a, b) => a + b, 0);
    return { puntos, suma, nota: Math.round((suma / ids.length) * 1000) / 10 };
  };

  II.CONTROL = {
    id: 'ii-ce',
    titulo: 'Control de estudio',
    subtitulo: 'Instrumentos en planta: selección, instalación y puesta en marcha',
    cierreTexto: 'jueves 08/10 a las 23:59',
    nEval: N_EVAL, minutos: 20, peso: 10, pagina: 'estudio.html',
    fuentes: FUENTES, modulos: MODULOS, banco: BANCO,
    seleccion, porId, calificar
  };
  II.EVALUACIONES = II.EVALUACIONES || {};
  II.EVALUACIONES['ii-ce'] = II.CONTROL;
  // registro mínimo para que el panel docente la muestre en su lista
  II.SESIONES['ii-ce'] = { id: 'ii-ce', etiqueta: 'Control de estudio', numero: '', titulo: 'Instrumentos en planta (asíncrono)', fecha: 'Hasta el jueves 08/10, 23:59', asincrona: true, retos: {}, pasos: [], diagnostico: [] };
})();
