// ============================================================
// Diagramas interactivos — Sesión 1
//   II.diagramas.planta     → sistema de instrumentación (P&ID simple)
//   II.diagramas.lazo       → lazo abierto vs. lazo cerrado (simulación)
//   II.diagramas.medicion   → exactitud/precisión y rango/span
// Cada uno devuelve { destruir() } para detener sus animaciones.
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  II.diagramas = II.diagramas || {};
  let contador = 0;
  const uid = () => 'd' + ++contador;

  const lectura = (id, x, y, ancho = 72) =>
    `<g class="svg-lectura"><rect x="${x - ancho / 2}" y="${y - 12}" width="${ancho}" height="24" rx="6"/><text id="${id}" x="${x}" y="${y + 4.5}">—</text></g>`;

  const burbuja = (id, x, y, letras, num, panel = false, r = 24, extra = '') => `
    <g class="clic svg-instr ${extra}" data-id="${id}">
      <circle class="aro" cx="${x}" cy="${y}" r="${r + 7}"/>
      <circle class="cuerpo" cx="${x}" cy="${y}" r="${r}"/>
      ${panel ? `<line class="panel" x1="${x - r}" y1="${y}" x2="${x + r}" y2="${y}"/>` : ''}
      <text x="${x}" y="${y - 5}" font-size="${r > 21 ? 12 : 11}">${letras}</text>
      <text x="${x}" y="${y + 14}" font-size="${r > 21 ? 11 : 10}">${num}</text>
    </g>`;

  const valvula = (x, y, id, extra = '') => `
    <g class="clic svg-valvula ${extra}" data-id="${id}">
      <circle class="aro" cx="${x}" cy="${y - 12}" r="34"/>
      <line x1="${x}" y1="${y}" x2="${x}" y2="${y - 20}" stroke="#2f3b4a" stroke-width="2"/>
      <path d="M${x - 16},${y - 20} A16,16 0 0 1 ${x + 16},${y - 20} Z"/>
      <polygon points="${x - 18},${y - 12} ${x - 18},${y + 12} ${x},${y}"/>
      <polygon points="${x + 18},${y - 12} ${x + 18},${y + 12} ${x},${y}"/>
    </g>`;

  const olaPath = (x0, ancho, y, fase, amp = 3) => {
    let d = `M${x0},${y + 8}`;
    for (let x = 0; x <= ancho; x += 10) d += ` L${x0 + x},${(y + amp * Math.sin(x / 22 + fase)).toFixed(1)}`;
    return d + ` L${x0 + ancho},${y + 8} Z`;
  };

  // ------------------------------------------------------------
  // 1) PLANTA — sistema de instrumentación
  // ------------------------------------------------------------
  const INFO_PLANTA = {
    'LT-101': {
      t: 'Transmisor de nivel · LT-101', v: 'Nivel: cuánto líquido hay en el tanque (%, m).',
      r: 'Sensor + transmisor. Mide el nivel y envía la señal al controlador.',
      e: 'Aquí mide por presión diferencial (compara la presión del fondo con la de arriba). Otras tecnologías: radar, ultrasónico, capacitivo (Sesión 3).',
      p: 'Evita que el tanque rebalse o que la bomba se quede sin líquido.'
    },
    'LIC-101': {
      t: 'Controlador indicador de nivel · LIC-101', v: 'Recibe la medición del nivel.',
      r: 'Controlador. Compara la medición con el valor deseado (setpoint) y decide cuánto abrir la válvula.',
      e: 'Puede ser un PLC, un DCS o un controlador de panel. La raya horizontal del símbolo indica que está en la sala de control.',
      p: 'Es el "cerebro" del lazo: sin él, nadie corrige las desviaciones.'
    },
    'LV-101': {
      t: 'Válvula de control · LV-101', v: 'Manipula el caudal de entrada al tanque.',
      r: 'Elemento final de control. Es lo que actúa físicamente sobre el proceso.',
      e: 'Válvula con actuador neumático (la cúpula del símbolo). Recibe la señal del controlador y cambia su apertura.',
      p: 'Si la válvula falla, el controlador puede "pensar" bien pero no logra cambiar nada.'
    },
    'TT-102': {
      t: 'Transmisor de temperatura · TT-102', v: 'Temperatura del agua (°C).',
      r: 'Sensor + transmisor. El sensor va dentro de una vaina (termopozo) que lo protege del líquido.',
      e: 'Termopar o RTD Pt100 (Sesión 2).',
      p: 'La temperatura define la calidad del producto y la seguridad del equipo.'
    },
    'PT-103': {
      t: 'Transmisor de presión · PT-103', v: 'Presión de descarga de la bomba (bar).',
      r: 'Sensor + transmisor de presión manométrica.',
      e: 'Diafragma con sensor piezorresistivo o capacitivo; en campo también se usa el manómetro Bourdon (Sesión 2).',
      p: 'Protege la bomba y la tubería; una caída de presión delata fugas u obstrucciones.'
    },
    'FT-104': {
      t: 'Transmisor de flujo · FT-104', v: 'Caudal que sale hacia el proceso (m³/h).',
      r: 'Sensor + transmisor. Aquí mide con una placa orificio (las dos rayas en la tubería).',
      e: 'Placa orificio, turbina, electromagnético, ultrasónico (Sesión 3).',
      p: 'Permite hacer balances, dosificar y facturar.'
    },
    tanque: {
      t: 'Tanque TK-100', v: 'Aquí "viven" las variables: nivel, temperatura, presión…',
      r: 'Proceso. Es el sistema físico que queremos conocer y mantener bajo control.',
      e: 'Tiene un calentador eléctrico en el fondo y una bomba de salida.',
      p: 'Toda la instrumentación existe para saber y controlar lo que pasa aquí dentro.'
    },
    bomba: {
      t: 'Bomba P-100', v: 'Impulsa el agua hacia el resto del proceso.',
      r: 'Equipo de proceso: no es un instrumento (no mide ni controla).',
      e: 'Lo que ella saca es una perturbación para el nivel: si sale más agua, el nivel baja.',
      p: 'Distinguir equipos de instrumentos es el primer paso para leer un P&ID (Sesión 4).'
    }
  };

  II.diagramas.planta = function (cont, opts = {}) {
    const id = uid();
    const ids = Object.keys(INFO_PLANTA);
    const vistos = new Set();
    let seleccionado = null;
    const svg = `
<svg viewBox="0 0 820 470" id="${id}" role="img" aria-label="Planta con tanque, instrumentos y lazo de nivel">
  <defs><clipPath id="${id}-clip"><path d="M333,133 H547 V372 Q547,387 532,387 H348 Q333,387 333,372 Z"/></clipPath></defs>
  <text class="svg-texto" x="20" y="66">Entrada de agua</text>
  <text class="svg-texto" x="805" y="418" text-anchor="end">Salida al proceso</text>
  <path class="svg-senal lazo" d="M640,151 V40 H190 V42"/>
  <path class="svg-senal lazo" d="M640,266 V199"/>
  <path class="svg-tuberia" d="M20,80 H390 V130"/>
  <path class="svg-flujo" d="M20,80 H390 V130"/>
  <g class="fuera-lazo">
    <path class="svg-tuberia" d="M500,390 V432 H805"/>
    <path class="svg-flujo" d="M500,390 V432 H805"/>
  </g>
  <path class="svg-tanque" d="M330,130 H550 V372 Q550,390 532,390 H348 Q330,390 330,372 Z"/>
  <g clip-path="url(#${id}-clip)">
    <rect class="svg-liquido" id="${id}-liq" x="330" y="240" width="220" height="160"/>
    <path class="svg-ola" id="${id}-ola" d=""/>
  </g>
  <g class="clic" data-id="tanque">
    <rect class="aro" x="323" y="123" width="234" height="274" rx="22"/>
    <rect x="330" y="130" width="220" height="260" fill="transparent"/>
  </g>
  <text class="svg-texto fuerte" x="345" y="155" pointer-events="none">TK-100</text>
  <g class="fuera-lazo">
    <polyline class="svg-calentador encendido" points="300,362 345,362 355,352 365,372 375,352 385,372 395,352 405,372 415,352 425,372 435,352 445,372 455,352 465,372 475,352 485,372 495,352 505,372 515,352 525,362"/>
    <text class="svg-texto" x="300" y="410">Calentador</text>
    <line class="svg-conexion" x1="274" y1="318" x2="362" y2="318" stroke-width="4"/>
  </g>
  <path class="svg-conexion" d="M616,290 H590 M590,160 V372 M590,160 H550 M590,372 H550"/>
  <line class="svg-conexion fuera-lazo" x1="670" y1="394" x2="670" y2="432"/>
  <line class="svg-conexion fuera-lazo" x1="745" y1="394" x2="745" y2="420"/>
  <g class="fuera-lazo"><line x1="741" y1="420" x2="741" y2="444" stroke="#2f3b4a" stroke-width="3"/><line x1="749" y1="420" x2="749" y2="444" stroke="#2f3b4a" stroke-width="3"/></g>
  <g class="clic svg-bomba fuera-lazo" data-id="bomba">
    <circle class="aro" cx="600" cy="432" r="24"/>
    <circle cx="600" cy="432" r="16"/><path d="M593,423 L611,432 L593,441 Z"/>
  </g>
  ${valvula(190, 80, 'LV-101')}
  <text class="svg-texto mono" x="190" y="116" text-anchor="middle">LV-101</text>
  ${lectura(id + '-v', 190, 140, 96)}
  ${burbuja('LIC-101', 640, 175, 'LIC', '101', true)}
  ${lectura(id + '-sp', 722, 162, 84)}
  ${lectura(id + '-out', 722, 190, 84)}
  ${burbuja('LT-101', 640, 290, 'LT', '101')}
  ${lectura(id + '-lt', 712, 290)}
  ${burbuja('TT-102', 250, 318, 'TT', '102', false, 24, 'fuera-lazo')}
  <g class="fuera-lazo">${lectura(id + '-tt', 250, 360)}</g>
  ${burbuja('PT-103', 670, 372, 'PT', '103', false, 22, 'fuera-lazo')}
  <g class="fuera-lazo">${lectura(id + '-pt', 670, 334)}</g>
  ${burbuja('FT-104', 745, 372, 'FT', '104', false, 22, 'fuera-lazo')}
  <g class="fuera-lazo">${lectura(id + '-ft', 745, 334, 80)}</g>
  <g class="fuera-lazo" transform="translate(20,432)">
    <line x1="0" y1="0" x2="30" y2="0" class="svg-tuberia" stroke-width="5"/><text class="svg-texto" x="38" y="4" font-size="12">Tubería de proceso</text>
    <line x1="160" y1="0" x2="190" y2="0" class="svg-senal"/><text class="svg-texto" x="198" y="4" font-size="12">Señal eléctrica</text>
    <circle cx="14" cy="24" r="9" fill="#fff" stroke="#2f3b4a" stroke-width="1.6"/><text class="svg-texto" x="38" y="28" font-size="12">Instrumento en campo</text>
    <circle cx="174" cy="24" r="9" fill="#fff" stroke="#2f3b4a" stroke-width="1.6"/><line x1="165" y1="24" x2="183" y2="24" stroke="#2f3b4a" stroke-width="1.4"/><text class="svg-texto" x="198" y="28" font-size="12">En sala de control</text>
  </g>
</svg>`;

    cont.innerHTML = `
      <div class="diagrama">
        <div class="controles">
          <div class="segmentado" data-rol="vista">
            <button class="activo" data-v="">Planta completa</button>
            <button data-v="resaltar-senales">Resaltar señales</button>
            <button data-v="resaltar-lazo">Resaltar lazo de nivel</button>
          </div>
          <span style="flex:1"></span>
          <span class="chip" data-rol="prog">Explorados 0/${ids.length}</span>
        </div>
        <div class="diag-2col planta-grid">
          <div><p class="nota solo-cel" style="margin:0 0 6px">Desliza el dibujo hacia los lados para verlo completo →</p><div class="lienzo">${svg}</div></div>
          <div class="panel-info" data-rol="info">
            <span class="etiqueta">Explora</span>
            <h4>Haz clic en un instrumento o equipo</h4>
            <p class="nota" style="margin:0">Los círculos son instrumentos. La línea gruesa lleva agua; la punteada lleva información.</p>
          </div>
        </div>
      </div>`;

    const raiz = cont.querySelector('svg');
    const info = cont.querySelector('[data-rol=info]');
    const prog = cont.querySelector('[data-rol=prog]');

    const mostrar = (clave) => {
      const d = INFO_PLANTA[clave];
      if (!d) return;
      seleccionado = clave;
      vistos.add(clave);
      raiz.querySelectorAll('.clic').forEach((g) => {
        g.classList.toggle('sel', g.dataset.id === clave);
        g.classList.toggle('visto', vistos.has(g.dataset.id));
      });
      prog.textContent = `Explorados ${vistos.size}/${ids.length}`;
      prog.className = 'chip' + (vistos.size === ids.length ? ' ok' : '');
      info.innerHTML = `
        <span class="etiqueta">${II.esc(clave.startsWith('L') || clave.startsWith('T') || clave.startsWith('P') || clave.startsWith('F') ? 'Instrumento' : 'Equipo / proceso')}</span>
        <h4>${II.esc(d.t)}</h4>
        <dl>
          <dt>Variable</dt><dd>${II.esc(d.v)}</dd>
          <dt>Rol en el sistema</dt><dd>${II.esc(d.r)}</dd>
          <dt>Tecnología</dt><dd>${II.esc(d.e)}</dd>
          <dt>Por qué importa</dt><dd>${II.esc(d.p)}</dd>
        </dl>`;
      if (opts.alSeleccionar) opts.alSeleccionar(clave, vistos.size, ids.length);
    };
    raiz.querySelectorAll('.clic').forEach((g) => g.addEventListener('click', () => mostrar(g.dataset.id)));
    cont.querySelectorAll('[data-rol=vista] button').forEach((b) =>
      b.addEventListener('click', () => {
        cont.querySelectorAll('[data-rol=vista] button').forEach((x) => x.classList.toggle('activo', x === b));
        raiz.classList.remove('resaltar-senales', 'resaltar-lazo');
        if (b.dataset.v) raiz.classList.add(b.dataset.v);
      })
    );

    // animación
    const liq = raiz.querySelector('#' + id + '-liq');
    const ola = raiz.querySelector('#' + id + '-ola');
    const txt = (s, v) => { const e = raiz.querySelector('#' + id + '-' + s); if (e) e.textContent = v; };
    let t0 = performance.now(), ultimoTexto = 0, vivo = true;
    const cuadro = (ahora) => {
      if (!vivo) return;
      const t = (ahora - t0) / 1000;
      const nivel = 60 + 2.2 * Math.sin(t / 6) + 0.6 * Math.sin(t / 1.7);
      const y = 388 - 2.5 * nivel;
      liq.setAttribute('y', (y + 4).toFixed(1));
      liq.setAttribute('height', (400 - y).toFixed(1));
      ola.setAttribute('d', olaPath(330, 220, y, t * 2.2));
      if (ahora - ultimoTexto > 400) {
        ultimoTexto = ahora;
        const salida = 48 - 1.6 * (nivel - 60);
        txt('lt', II.fmt(nivel, 1) + ' %');
        txt('sp', 'SP 60 %');
        txt('out', 'Salida ' + II.fmt(salida, 0) + ' %');
        txt('v', 'Apertura ' + II.fmt(salida, 0) + ' %');
        txt('tt', II.fmt(71.8 + 0.4 * Math.sin(t / 9) + (Math.random() - 0.5) * 0.1, 1) + ' °C');
        txt('pt', II.fmt(2.35 + 0.04 * Math.sin(t / 2.3), 2) + ' bar');
        txt('ft', II.fmt(12.6 + 0.35 * Math.sin(t / 4.1), 1) + ' m³/h');
      }
      requestAnimationFrame(cuadro);
    };
    requestAnimationFrame(cuadro);
    return { destruir() { vivo = false; }, mostrar };
  };

  // ------------------------------------------------------------
  // 2) LAZO — abierto vs. cerrado, con simulación de nivel
  //    Tanque A = 1 m², H = 1 m → dNivel%/dt = 0,1·(Qe − Qs); Qe = 0,1·apertura%
  // ------------------------------------------------------------
  II.diagramas.lazo = function (cont, opts = {}) {
    const id = uid();
    const S = {
      h: 50, med: 50, v: 40, u: 40, I: 40, sp: 50, qs: 4, modo: opts.modo || 'auto', manual: 40,
      falla: 'ninguna', congelado: null, trabada: null, hist: [], tHist: 0, tSim: 0
    };
    const X0 = 44, X1 = 448, Y0 = 30, Y1 = 290;

    const svgTanque = `
<svg viewBox="0 0 420 330" role="img" aria-label="Tanque con lazo de control de nivel">
  <path class="svg-senal" id="${id}-s1" d="M370,185 V120"/>
  <path class="svg-senal" id="${id}-s2" d="M370,80 V8 H110 V19"/>
  <path class="svg-tuberia" d="M10,55 H240 V85"/>
  <path class="svg-flujo" id="${id}-fe" d="M10,55 H240 V85"/>
  <path class="svg-tuberia" d="M300,300 V318 H410"/>
  <path class="svg-flujo" id="${id}-fs" d="M300,300 V318 H410"/>
  <rect class="svg-tanque" x="170" y="85" width="160" height="215" rx="10"/>
  <clipPath id="${id}-clip"><rect x="172" y="87" width="156" height="211" rx="9"/></clipPath>
  <g clip-path="url(#${id}-clip)">
    <rect class="svg-liquido" id="${id}-liq" x="170" y="200" width="160" height="110"/>
    <path class="svg-ola" id="${id}-ola" d=""/>
  </g>
  <line id="${id}-spl" x1="172" x2="328" y1="193" y2="193" stroke="#2f3b4a" stroke-width="1.6" stroke-dasharray="6 5"/>
  <text id="${id}-spt" class="svg-texto mono" x="324" y="188" text-anchor="end" font-size="11">SP</text>
  <text class="svg-texto" x="250" y="112" text-anchor="middle" font-size="12">Nivel real</text>
  <text id="${id}-nr" class="svg-texto fuerte" x="250" y="136" text-anchor="middle" font-size="22">50 %</text>
  <text id="${id}-alerta" x="250" y="165" text-anchor="middle" font-size="15" font-weight="700" fill="#c0392b"></text>
  <line class="svg-conexion" x1="350" y1="205" x2="330" y2="205"/>
  ${valvula(110, 55, 'LV')}
  ${lectura(id + '-vl', 110, 92, 96)}
  ${burbuja('LIC', 370, 100, 'LIC', '101', true, 20)}
  ${burbuja('LT', 370, 205, 'LT', '101', false, 20)}
  ${lectura(id + '-lt', 372, 242, 76)}
  ${lectura(id + '-qs', 372, 290, 76)}
</svg>`;

    const svgTend = `
<svg viewBox="0 0 460 330" role="img" aria-label="Tendencia del nivel en el tiempo">
  ${[0, 25, 50, 75, 100].map((p) => { const y = Y1 - (p / 100) * (Y1 - Y0); return `<line class="tend-rejilla" x1="${X0}" x2="${X1}" y1="${y}" y2="${y}"/><text class="svg-texto" x="${X0 - 6}" y="${y + 4}" text-anchor="end" font-size="11">${p}%</text>`; }).join('')}
  <line class="tend-eje" x1="${X0}" x2="${X0}" y1="${Y0}" y2="${Y1}"/>
  <text class="svg-texto" x="${X0}" y="${Y1 + 18}" font-size="11">−10 min</text>
  <text class="svg-texto" x="${(X0 + X1) / 2}" y="${Y1 + 18}" font-size="11" text-anchor="middle">−5 min</text>
  <text class="svg-texto" x="${X1}" y="${Y1 + 18}" font-size="11" text-anchor="end">ahora</text>
  <polyline class="tend-val" id="${id}-tv" points=""/>
  <polyline class="tend-sp" id="${id}-tsp" points=""/>
  <polyline class="tend-med" id="${id}-tm" points=""/>
  <polyline class="tend-pv" id="${id}-tpv" points=""/>
  <g transform="translate(${X0},14)" font-size="11">
    <line x1="0" x2="18" y1="0" y2="0" class="tend-pv"/><text class="svg-texto" x="22" y="4" font-size="11">Nivel real</text>
    <line x1="92" x2="110" y1="0" y2="0" class="tend-sp"/><text class="svg-texto" x="114" y="4" font-size="11">Setpoint</text>
    <line x1="176" x2="194" y1="0" y2="0" class="tend-val"/><text class="svg-texto" x="198" y="4" font-size="11">Válvula</text>
    <line x1="252" x2="270" y1="0" y2="0" class="tend-med"/><text class="svg-texto" x="274" y="4" font-size="11">Lectura LT</text>
  </g>
</svg>`;

    const svgBloques = `
<svg viewBox="0 0 900 178" role="img" aria-label="Diagrama de bloques del lazo de control">
  <defs><marker id="${id}-pf" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#2f3b4a"/></marker></defs>
  <text class="svg-texto" x="14" y="58" font-size="12">Setpoint</text>
  <path class="flecha" d="M14,70 H72" marker-end="url(#${id}-pf)"/>
  <circle cx="90" cy="70" r="16" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/>
  <text class="svg-texto fuerte" x="70" y="62" font-size="13">+</text>
  <text class="svg-texto fuerte" x="96" y="102" font-size="15">−</text>
  <path class="flecha" id="${id}-f1" d="M106,70 H148" marker-end="url(#${id}-pf)"/>
  <text class="svg-texto" x="127" y="60" font-size="11" text-anchor="middle">error</text>
  <g class="blq" id="${id}-bc"><rect x="150" y="45" width="150" height="50" rx="8"/><text x="225" y="66">Controlador</text><text class="sub" id="${id}-bcs" x="225" y="84">LIC-101 · automático</text></g>
  <path class="flecha" id="${id}-f2" d="M300,70 H358" marker-end="url(#${id}-pf)"/>
  <g class="blq" id="${id}-bv"><rect x="360" y="45" width="150" height="50" rx="8"/><text x="435" y="66">Elemento final</text><text class="sub" x="435" y="84">Válvula LV-101</text></g>
  <path class="flecha" id="${id}-f3" d="M510,70 H568" marker-end="url(#${id}-pf)"/>
  <g class="blq"><rect x="570" y="45" width="150" height="50" rx="8"/><text x="645" y="66">Proceso</text><text class="sub" x="645" y="84">Tanque (nivel)</text></g>
  <path class="flecha" d="M645,8 V43" marker-end="url(#${id}-pf)"/>
  <text class="svg-texto" x="655" y="22" font-size="11">Perturbación: consumo</text>
  <path class="flecha" d="M720,70 H866" marker-end="url(#${id}-pf)"/>
  <text class="svg-texto" x="866" y="60" font-size="12" text-anchor="end">Nivel</text>
  <path class="flecha" id="${id}-f4" d="M790,70 V140 H592" marker-end="url(#${id}-pf)"/>
  <g class="blq" id="${id}-bs"><rect x="440" y="117" width="150" height="46" rx="8"/><text x="515" y="136">Sensor / transmisor</text><text class="sub" x="515" y="153">LT-101</text></g>
  <path class="flecha" id="${id}-f5" d="M440,140 H90 V88" marker-end="url(#${id}-pf)"/>
  <text id="${id}-abierto" class="svg-texto" x="265" y="132" font-size="12" text-anchor="middle" fill="#c0392b"></text>
</svg>`;

    cont.innerHTML = `
      <div class="diagrama">
        <div class="controles">
          <div class="segmentado" data-rol="modo">
            <button data-m="manual">Manual · lazo abierto</button>
            <button data-m="auto">Automático · lazo cerrado</button>
          </div>
          <button class="boton chico" data-acc="perturbar">Perturbación: +2 L/s</button>
          <button class="boton chico" data-acc="reiniciar">Reiniciar</button>
          <span class="chip">Tiempo acelerado ×10</span>
        </div>
        <div class="lazo-grid">
          <div class="lienzo" style="grid-area:tanque">${svgTanque}</div>
          <div class="lienzo" style="grid-area:tend">${svgTend}</div>
          <div class="lienzo" style="grid-area:bloq">${svgBloques}</div>
          <div class="panel-info" style="grid-area:ctrl">
            <div class="deslizador" data-d="sp"><label>Setpoint (valor deseado)</label><output>50 %</output><input type="range" min="10" max="90" step="1" value="50"></div>
            <div class="deslizador" data-d="man"><label>Apertura de válvula (manual)</label><output>40 %</output><input type="range" min="0" max="100" step="1" value="40"></div>
            <div class="deslizador" data-d="qs" style="margin-bottom:0"><label>Consumo (salida)</label><output>4 L/s</output><input type="range" min="1" max="9" step="0.5" value="4"></div>
          </div>
          <div class="panel-info" style="grid-area:falla">
            <label class="campo" style="margin-bottom:10px"><span>Simular una falla</span>
              <select class="entrada" data-rol="falla">
                <option value="ninguna">Sin falla</option>
                <option value="sensor">Sensor congelado (lectura fija)</option>
                <option value="valvula">Válvula trabada</option>
                <option value="sintonia">Controlador mal sintonizado</option>
              </select>
            </label>
            <div class="aviso info" data-rol="msg" style="margin:0;font-size:.85rem"></div>
          </div>
        </div>
      </div>`;

    const q = (s) => cont.querySelector(s);
    const g = (s) => cont.querySelector('#' + id + '-' + s);
    const desl = (k) => q(`[data-d=${k}] input`);
    const outp = (k) => q(`[data-d=${k}] output`);

    const ponerModo = (m) => {
      if (m === S.modo) return pintarModo();
      const e = S.sp - S.med;
      if (m === 'auto') S.I = S.v - 6 * e; // transferencia sin salto
      else { S.manual = Math.round(S.v); desl('man').value = S.manual; outp('man').textContent = S.manual + ' %'; }
      S.modo = m;
      pintarModo();
    };
    const pintarModo = () => {
      cont.querySelectorAll('[data-rol=modo] button').forEach((b) => b.classList.toggle('activo', b.dataset.m === S.modo));
      const auto = S.modo === 'auto';
      desl('sp').disabled = !auto;
      desl('man').disabled = auto;
      q('[data-d=sp]').style.opacity = auto ? 1 : 0.45;
      q('[data-d=man]').style.opacity = auto ? 0.45 : 1;
      ['f1', 'f2', 'f3'].forEach((f) => g(f).classList.toggle('viva', auto));
      ['f4', 'f5'].forEach((f) => { g(f).classList.toggle('viva', auto); g(f).classList.toggle('rota', !auto); });
      g('bcs').textContent = auto ? 'LIC-101 · automático' : 'MANUAL: salida fija';
      g('abierto').textContent = auto ? '' : 'Lazo abierto: nadie compara la medición';
      g('spl').style.opacity = auto ? 1 : 0.25;
      g('spt').style.opacity = auto ? 1 : 0.25;
      mensaje();
    };
    const mensaje = () => {
      const m = q('[data-rol=msg]');
      const textos = {
        ninguna: S.modo === 'auto'
          ? 'Lazo cerrado: el controlador compara la lectura del LT con el setpoint y mueve la válvula para corregir. Prueba una perturbación.'
          : 'Lazo abierto: la válvula queda fija. Si cambia el consumo, el nivel se va y nadie lo corrige.',
        sensor: 'El LT dejó de actualizarse. El controlador "cree" que el nivel está bien, pero el nivel real se va. Compara la línea punteada con la azul.',
        valvula: 'La válvula no responde. El controlador lleva su salida al extremo, pero el caudal de entrada no cambia.',
        sintonia: 'El controlador reacciona demasiado fuerte: el nivel oscila alrededor del setpoint sin estabilizarse.'
      };
      m.textContent = textos[S.falla];
      m.className = 'aviso ' + (S.falla === 'ninguna' ? 'info' : 'duda');
      ['bc', 'bv', 'bs'].forEach((b) => g(b).classList.remove('falla'));
      if (S.falla === 'sensor') g('bs').classList.add('falla');
      if (S.falla === 'valvula') g('bv').classList.add('falla');
      if (S.falla === 'sintonia') g('bc').classList.add('falla');
    };

    cont.querySelectorAll('[data-rol=modo] button').forEach((b) => b.addEventListener('click', () => ponerModo(b.dataset.m)));
    desl('sp').addEventListener('input', (e) => { S.sp = +e.target.value; outp('sp').textContent = S.sp + ' %'; });
    desl('man').addEventListener('input', (e) => { S.manual = +e.target.value; outp('man').textContent = S.manual + ' %'; });
    desl('qs').addEventListener('input', (e) => { S.qs = +e.target.value; outp('qs').textContent = II.fmt(S.qs, 1) + ' L/s'; });
    q('[data-acc=perturbar]').addEventListener('click', () => {
      S.qs = Math.min(9, S.qs + 2); desl('qs').value = S.qs; outp('qs').textContent = II.fmt(S.qs, 1) + ' L/s';
    });
    q('[data-acc=reiniciar]').addEventListener('click', () => {
      Object.assign(S, { h: 50, med: 50, v: 40, u: 40, I: 40, sp: 50, qs: 4, manual: 40, hist: [], congelado: null, trabada: null });
      desl('sp').value = 50; outp('sp').textContent = '50 %';
      desl('man').value = 40; outp('man').textContent = '40 %';
      desl('qs').value = 4; outp('qs').textContent = '4 L/s';
    });
    q('[data-rol=falla]').addEventListener('change', (e) => {
      S.falla = e.target.value;
      S.congelado = S.falla === 'sensor' ? S.med : null;
      S.trabada = S.falla === 'valvula' ? S.v : null;
      mensaje();
    });

    const paso = (dt) => {
      const Kc = S.falla === 'sintonia' ? 15 : 6;
      const Ti = S.falla === 'sintonia' ? 4 : 60;
      S.med += ((S.h - S.med) * dt) / 3;
      if (S.falla === 'sensor') S.med = S.congelado;
      if (S.modo === 'auto') {
        const e = S.sp - S.med;
        let u = Kc * e + S.I;
        if (u >= 0 && u <= 100) S.I += (Kc / Ti) * e * dt;
        S.u = Math.max(0, Math.min(100, u));
      } else S.u = S.manual;
      if (S.falla === 'valvula') S.v = S.trabada;
      else S.v += ((S.u - S.v) * dt) / 4;
      const qe = 0.1 * S.v;
      const qs = S.h > 0 ? S.qs : 0;
      S.h = Math.max(0, Math.min(100, S.h + 0.1 * (qe - qs) * dt));
      S.tHist += dt;
      if (S.tHist >= 2) {
        S.tHist = 0;
        S.hist.push({ h: S.h, m: S.med, sp: S.modo === 'auto' ? S.sp : null, v: S.v });
        if (S.hist.length > 300) S.hist.shift();
      }
    };

    const linea = (clave) => {
      const n = S.hist.length;
      const pts = [];
      S.hist.forEach((p, i) => {
        if (p[clave] == null) return;
        const x = X1 - ((n - 1 - i) / 299) * (X1 - X0);
        const y = Y1 - (p[clave] / 100) * (Y1 - Y0);
        pts.push(x.toFixed(1) + ',' + y.toFixed(1));
      });
      return pts.join(' ');
    };

    let vivo = true, tPrev = performance.now(), tTexto = 0;
    const cuadro = (ahora) => {
      if (!vivo) return;
      let dtR = Math.min(0.1, (ahora - tPrev) / 1000);
      tPrev = ahora;
      let dt = dtR * 10;
      while (dt > 0) { const h = Math.min(0.05, dt); paso(h); dt -= h; }
      const y = 298 - 2.1 * S.h;
      g('liq').setAttribute('y', (y + 4).toFixed(1));
      g('liq').setAttribute('height', (310 - y).toFixed(1));
      g('ola').setAttribute('d', olaPath(170, 160, y, ahora / 450, 2.5));
      const ysp = 298 - 2.1 * S.sp;
      g('spl').setAttribute('y1', ysp); g('spl').setAttribute('y2', ysp); g('spt').setAttribute('y', ysp - 5);
      g('fe').classList.toggle('quieto', S.v < 1);
      if (ahora - tTexto > 150) {
        tTexto = ahora;
        g('nr').textContent = II.fmt(S.h, 0) + ' %';
        g('lt').textContent = 'LT ' + II.fmt(S.med, 0) + ' %';
        g('vl').textContent = 'Apertura ' + II.fmt(S.v, 0) + ' %';
        g('qs').textContent = II.fmt(S.qs, 1) + ' L/s';
        g('alerta').textContent = S.h >= 99.5 ? '¡Rebalse!' : S.h <= 0.5 ? 'Tanque vacío' : '';
        g('tpv').setAttribute('points', linea('h'));
        g('tm').setAttribute('points', linea('m'));
        g('tsp').setAttribute('points', linea('sp'));
        g('tv').setAttribute('points', linea('v'));
      }
      requestAnimationFrame(cuadro);
    };
    pintarModo();
    requestAnimationFrame(cuadro);
    return { destruir() { vivo = false; } };
  };

  // ------------------------------------------------------------
  // 3) MEDICIÓN — exactitud/precisión y rango/span
  // ------------------------------------------------------------
  II.diagramas.medicion = function (cont, opts = {}) {
    const id = uid();
    const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const A = { sesgo: 0, disp: 8, tiros: [], lecturas: [] };
    const PRESETS_A = [
      { n: 'Exacto y preciso', s: 0, d: 6 },
      { n: 'Preciso, no exacto', s: 70, d: 7 },
      { n: 'Exacto, no preciso', s: 0, d: 70 },
      { n: 'Ni exacto ni preciso', s: 70, d: 70 }
    ];
    const PRESETS_B = [
      { n: 'Presión 0 a 10 bar', lrv: 0, urv: 10, u: 'bar', val: 6.5 },
      { n: 'Temperatura −20 a 180 °C', lrv: -20, urv: 180, u: '°C', val: 105 },
      { n: 'Nivel 0 a 4 m', lrv: 0, urv: 4, u: 'm', val: 2.3 }
    ];
    const B = { lrv: -20, urv: 180, u: '°C', val: 105, ex: 0.5 };

    const anillos = [140, 112, 84, 56, 28].map((r, i) => `<circle cx="160" cy="160" r="${r}" fill="${i % 2 ? '#f0f3f7' : '#ffffff'}" stroke="#cbd3dd"/>`).join('');
    const svgDiana = `
<svg viewBox="0 0 320 320" role="img" aria-label="Diana de exactitud y precisión">
  ${anillos}
  <circle cx="160" cy="160" r="9" fill="#1d5fb4"/>
  <g id="${id}-tiros"></g>
  <g id="${id}-prom"></g>
</svg>`;
    const svgRecta = `
<svg viewBox="0 0 700 120" role="img" aria-label="Lecturas del instrumento en una recta numérica">
  <line x1="40" x2="660" y1="70" y2="70" stroke="#8e99a6" stroke-width="2"/>
  ${[94, 96, 98, 100, 102, 104, 106].map((v) => { const x = 40 + ((v - 94) / 12) * 620; return `<line x1="${x}" x2="${x}" y1="64" y2="76" stroke="#8e99a6"/><text class="svg-texto" x="${x}" y="96" text-anchor="middle" font-size="12">${v}</text>`; }).join('')}
  <line x1="350" x2="350" y1="30" y2="80" stroke="#1d5fb4" stroke-width="2.5"/>
  <text class="svg-texto fuerte" x="350" y="22" text-anchor="middle" font-size="12" fill="#1d5fb4">Valor verdadero: 100 °C</text>
  <g id="${id}-lec"></g>
  <text class="svg-texto" x="660" y="114" text-anchor="end" font-size="11">Lecturas de un termómetro (°C)</text>
</svg>`;

    cont.innerHTML = `
      <div class="diagrama">
        <div class="controles">
          <div class="segmentado" data-rol="tab">
            <button data-t="a">Exactitud y precisión</button>
            <button data-t="b">Rango y span</button>
          </div>
        </div>
        <div data-tab="a">
          <div class="medicion-grid">
            <div class="lienzo" style="grid-area:diana">${svgDiana}</div>
            <div class="panel-info" style="grid-area:panel">
              <div class="segmentado" data-rol="presetA" style="margin-bottom:12px">${PRESETS_A.map((p, i) => `<button data-i="${i}">${p.n}</button>`).join('')}</div>
              <div class="deslizador" data-d="sesgo"><label>Error sistemático (sesgo)</label><output>0</output><input type="range" min="0" max="100" value="0"></div>
              <div class="deslizador" data-d="disp"><label>Error aleatorio (dispersión)</label><output>8</output><input type="range" min="0" max="100" value="8"></div>
              <div class="controles" style="margin-bottom:10px">
                <button class="boton primario chico" data-acc="tirar">Tomar 10 lecturas</button>
                <button class="boton chico" data-acc="limpiar">Limpiar</button>
                <span data-rol="veredicto" class="controles"></span>
              </div>
              <p class="nota" style="margin:0"><b>Exactitud</b>: qué tan cerca está el promedio del valor verdadero. <b>Precisión</b>: qué tan juntas están las lecturas entre sí.</p>
            </div>
            <div class="lienzo" style="grid-area:recta">${svgRecta}</div>
          </div>
        </div>
        <div data-tab="b">
          <div class="diag-2col rango-grid">
            <div class="lienzo"><svg viewBox="0 0 700 240" id="${id}-escala" role="img" aria-label="Escala del transmisor con rango y span"></svg>
              <p class="nota" style="margin:8px 10px 4px">Fórmula: <span class="formula">% del span = (valor − LRV) ÷ span × 100</span></p></div>
            <div class="panel-info">
              <div class="segmentado" data-rol="presetB" style="margin-bottom:14px">${PRESETS_B.map((p, i) => `<button data-i="${i}">${p.n}</button>`).join('')}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <label class="campo"><span>LRV (inferior)</span><input class="entrada" data-b="lrv" inputmode="decimal"></label>
                <label class="campo"><span>URV (superior)</span><input class="entrada" data-b="urv" inputmode="decimal"></label>
              </div>
              <div class="deslizador" data-d="val"><label>Valor de la variable</label><output>—</output><input type="range"></div>
              <label class="campo"><span>Exactitud del instrumento</span>
                <select class="entrada" data-b="ex"><option value="0.25">± 0,25 % del span</option><option value="0.5" selected>± 0,5 % del span</option><option value="1">± 1 % del span</option></select>
              </label>
              <dl data-rol="datosB" style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin:0"></dl>
            </div>
          </div>
        </div>
      </div>`;

    const q = (s) => cont.querySelector(s);
    const g = (s) => cont.querySelector('#' + id + '-' + s);

    // --- pestaña A ---
    const desl = (k) => q(`[data-d=${k}] input`);
    const pintarA = () => {
      q('[data-d=sesgo] output').textContent = A.sesgo;
      q('[data-d=disp] output').textContent = A.disp;
      const ang = (-35 * Math.PI) / 180;
      g('tiros').innerHTML = A.tiros.map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="5" fill="#154a8c" fill-opacity=".8" stroke="#fff" stroke-width="1"/>`).join('');
      if (A.tiros.length) {
        const mx = A.tiros.reduce((s, p) => s + p[0], 0) / A.tiros.length;
        const my = A.tiros.reduce((s, p) => s + p[1], 0) / A.tiros.length;
        const sd = Math.sqrt(A.tiros.reduce((s, p) => s + (p[0] - mx) ** 2 + (p[1] - my) ** 2, 0) / Math.max(1, A.tiros.length - 1) / 2);
        const dist = Math.hypot(mx - 160, my - 160);
        g('prom').innerHTML = `<path d="M${mx - 9},${my} H${mx + 9} M${mx},${my - 9} V${my + 9}" stroke="#e0782b" stroke-width="3.5" stroke-linecap="round"/><text class="svg-texto" x="${Math.min(250, mx + 14)}" y="${my > 60 ? my - 14 : my + 26}" font-size="13" fill="#e0782b" font-weight="700" stroke="#fff" stroke-width="3" paint-order="stroke">promedio</text>`;
        const exacto = dist < 18, preciso = sd < 18;
        q('[data-rol=veredicto]').innerHTML = `<span class="chip ${exacto ? 'ok' : 'mal'}">${exacto ? '✓ Exacto' : '✗ No exacto'}</span><span class="chip ${preciso ? 'ok' : 'mal'}">${preciso ? '✓ Preciso' : '✗ No preciso'}</span>`;
      } else {
        g('prom').innerHTML = '';
        q('[data-rol=veredicto]').innerHTML = '<span class="nota">Toma lecturas para ver el resultado.</span>';
      }
      g('lec').innerHTML = A.lecturas.map((v) => { const x = 40 + ((Math.max(94, Math.min(106, v)) - 94) / 12) * 620; return `<circle cx="${x.toFixed(1)}" cy="70" r="6" fill="#154a8c" fill-opacity=".55" stroke="#fff"/>`; }).join('');
      void ang;
    };
    const tirar = () => {
      const ang = (-35 * Math.PI) / 180;
      const b = A.sesgo * 1.2, s = 3 + A.disp * 0.9;
      for (let i = 0; i < 10; i++) {
        A.tiros.push([160 + b * Math.cos(ang) + gauss() * s, 160 + b * Math.sin(ang) + gauss() * s]);
        A.lecturas.push(100 + (A.sesgo * 1.2 + gauss() * s) * (3 / 120));
      }
      if (A.tiros.length > 40) { A.tiros = A.tiros.slice(-40); A.lecturas = A.lecturas.slice(-40); }
      pintarA();
    };
    desl('sesgo').addEventListener('input', (e) => { A.sesgo = +e.target.value; pintarA(); });
    desl('disp').addEventListener('input', (e) => { A.disp = +e.target.value; pintarA(); });
    q('[data-acc=tirar]').addEventListener('click', tirar);
    q('[data-acc=limpiar]').addEventListener('click', () => { A.tiros = []; A.lecturas = []; pintarA(); });
    cont.querySelectorAll('[data-rol=presetA] button').forEach((b) => b.addEventListener('click', () => {
      const p = PRESETS_A[+b.dataset.i];
      cont.querySelectorAll('[data-rol=presetA] button').forEach((x) => x.classList.toggle('activo', x === b));
      A.sesgo = p.s; A.disp = p.d; desl('sesgo').value = p.s; desl('disp').value = p.d;
      A.tiros = []; A.lecturas = []; tirar();
    }));

    // --- pestaña B ---
    const XA = 70, XB = 630;
    const pintarB = () => {
      const span = B.urv - B.lrv;
      const valido = isFinite(span) && span > 0;
      const esc = g('escala');
      const dat = q('[data-rol=datosB]');
      if (!valido) {
        esc.innerHTML = `<text class="svg-texto" x="350" y="120" text-anchor="middle" fill="#c0392b" font-size="15">El URV debe ser mayor que el LRV</text>`;
        dat.innerHTML = '';
        return;
      }
      const pct = ((B.val - B.lrv) / span) * 100;
      const pctC = Math.max(0, Math.min(100, pct));
      const xv = XA + (Math.max(-10, Math.min(110, pct)) / 100) * (XB - XA);
      const emax = (B.ex / 100) * span;
      const bandaW = Math.max(3, (emax / span) * (XB - XA));
      const fuera = pct < 0 || pct > 100;
      const d = (v) => II.fmt(v, span < 20 ? 2 : 1);
      esc.innerHTML = `
        <path d="M${XA},52 V44 H${XB} V52" stroke="#1d5fb4" stroke-width="2" fill="none"/>
        <text class="svg-texto fuerte" x="${(XA + XB) / 2}" y="34" text-anchor="middle" font-size="14" fill="#154a8c">Span = URV − LRV = ${d(B.urv)} − (${d(B.lrv)}) = ${d(span)} ${B.u}</text>
        <line x1="20" x2="${XA}" y1="112" y2="112" stroke="#cbd3dd" stroke-width="10" stroke-dasharray="4 4"/>
        <line x1="${XB}" x2="680" y1="112" y2="112" stroke="#cbd3dd" stroke-width="10" stroke-dasharray="4 4"/>
        <line x1="${XA}" x2="${XB}" y1="112" y2="112" stroke="#8e99a6" stroke-width="10" stroke-linecap="butt"/>
        ${[0, 25, 50, 75, 100].map((p) => { const x = XA + (p / 100) * (XB - XA); return `<line x1="${x}" x2="${x}" y1="100" y2="124" stroke="#2f3b4a" stroke-width="1.5"/><text class="svg-texto" x="${x}" y="94" text-anchor="middle" font-size="11">${p} %</text><text class="svg-texto mono" x="${x}" y="142" text-anchor="middle" font-size="12">${d(B.lrv + (p / 100) * span)}</text>`; }).join('')}
        <text class="svg-texto fuerte" x="${XA}" y="164" text-anchor="middle" font-size="12">LRV</text>
        <text class="svg-texto fuerte" x="${XB}" y="164" text-anchor="middle" font-size="12">URV</text>
        <rect x="${xv - bandaW}" y="104" width="${2 * bandaW}" height="16" fill="#e0782b" fill-opacity=".35"/>
        <path d="M${xv - 8},62 L${xv + 8},62 L${xv},76 Z" fill="${fuera ? '#c0392b' : '#e0782b'}"/>
        <line x1="${xv}" x2="${xv}" y1="76" y2="124" stroke="${fuera ? '#c0392b' : '#e0782b'}" stroke-width="2.5"/>
        <rect x="${XA}" y="188" width="${XB - XA}" height="18" rx="9" fill="#f0f3f7" stroke="#e1e6ed"/>
        <rect x="${XA}" y="188" width="${((XB - XA) * pctC) / 100}" height="18" rx="9" fill="${fuera ? '#c0392b' : '#1d5fb4'}"/>
        <text class="svg-texto fuerte" x="${XA}" y="228" font-size="13">Salida del transmisor: ${II.fmt(pctC, 1)} % del span</text>
        ${fuera ? `<text x="${XB}" y="228" text-anchor="end" font-size="13" font-weight="700" fill="#c0392b">Fuera de rango: la señal se satura</text>` : ''}`;
      dat.innerHTML = `
        <dt class="nota">Span</dt><dd><b>${d(span)} ${B.u}</b></dd>
        <dt class="nota">Valor</dt><dd><b>${d(B.val)} ${B.u}</b> → ${II.fmt(pct, 1)} % del span</dd>
        <dt class="nota">Error máx. permitido</dt><dd><b>± ${II.fmt(emax, 3)} ${B.u}</b> <span class="nota">(${II.fmt(B.ex, 2)} % × ${d(span)})</span></dd>`;
    };
    const ajustarDeslizador = () => {
      const span = B.urv - B.lrv;
      const s = desl('val');
      if (!(span > 0)) return;
      s.min = B.lrv - span * 0.1; s.max = B.urv + span * 0.1; s.step = span / 400;
      s.value = B.val;
      q('[data-d=val] output').textContent = II.fmt(B.val, span < 20 ? 2 : 1) + ' ' + B.u;
    };
    const cargarPreset = (i) => {
      const p = PRESETS_B[i];
      Object.assign(B, { lrv: p.lrv, urv: p.urv, u: p.u, val: p.val });
      q('[data-b=lrv]').value = II.fmt(p.lrv, 3);
      q('[data-b=urv]').value = II.fmt(p.urv, 3);
      cont.querySelectorAll('[data-rol=presetB] button').forEach((x, j) => x.classList.toggle('activo', j === i));
      ajustarDeslizador(); pintarB();
    };
    cont.querySelectorAll('[data-rol=presetB] button').forEach((b) => b.addEventListener('click', () => cargarPreset(+b.dataset.i)));
    ['lrv', 'urv'].forEach((k) => q(`[data-b=${k}]`).addEventListener('input', (e) => {
      const v = II.num(e.target.value);
      if (!isFinite(v)) return;
      B[k] = v;
      const span = B.urv - B.lrv;
      if (span > 0) B.val = Math.max(B.lrv - span * 0.1, Math.min(B.urv + span * 0.1, B.val));
      cont.querySelectorAll('[data-rol=presetB] button').forEach((x) => x.classList.remove('activo'));
      ajustarDeslizador(); pintarB();
    }));
    desl('val').addEventListener('input', (e) => {
      B.val = +e.target.value;
      q('[data-d=val] output').textContent = II.fmt(B.val, B.urv - B.lrv < 20 ? 2 : 1) + ' ' + B.u;
      pintarB();
    });
    q('[data-b=ex]').addEventListener('change', (e) => { B.ex = +e.target.value; pintarB(); });

    const pestana = (t) => {
      cont.querySelectorAll('[data-rol=tab] button').forEach((b) => b.classList.toggle('activo', b.dataset.t === t));
      cont.querySelectorAll('[data-tab]').forEach((d) => d.classList.toggle('oculto', d.dataset.tab !== t));
    };
    cont.querySelectorAll('[data-rol=tab] button').forEach((b) => b.addEventListener('click', () => pestana(b.dataset.t)));

    pestana(opts.pestana || 'a');
    cont.querySelector('[data-rol=presetA] button').click();
    cargarPreset(1);
    return { destruir() {}, pestana };
  };
})();
