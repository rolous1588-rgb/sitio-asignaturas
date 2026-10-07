// ============================================================
// Sesión 5, día 6 — P&ID de la planta TK-100 con simbología ISA 5.1
// II.diagramas.pid (cont, { pestana: 'inst' | 'letras' | 'simbolos' }) → { destruir() }
// Tocar un instrumento: qué significan sus letras, dónde está, qué señal usa y se resalta su lazo.
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  II.diagramas = II.diagramas || {};
  let n = 0;

  const UBIC = {
    campo: ['En campo', 'círculo <b>sin línea</b>: montado junto al proceso.'],
    tablero: ['En tablero de la sala de control', 'círculo <b>con una línea</b> al medio: el operador lo ve en un tablero.'],
    dcs: ['En el sistema de control (DCS/PLC)', 'círculo <b>dentro de un cuadrado</b>: es una función del software y se ve en la pantalla del operador.']
  };
  const INST = {
    'LT-101': { lazo: '101', ubic: 'campo', letras: [['L', 'Nivel (variable medida)'], ['T', 'Transmite']], que: 'Mide el nivel del TK-100 (por presión o radar) y lo envía al controlador.', senal: 'Envía 4–20 mA (línea de trazos) a LIC-101.' },
    'LIC-101': { lazo: '101', ubic: 'dcs', letras: [['L', 'Nivel'], ['I', 'Indica'], ['C', 'Controla']], que: 'Compara el nivel con el set point y calcula cuánto abrir la válvula de entrada. Aquí también se configuran sus alarmas (LAH, LAL).', senal: 'Recibe 4–20 mA de LT-101 y envía 4–20 mA a LY-101.' },
    'LY-101': { lazo: '101', ubic: 'campo', letras: [['L', 'Nivel'], ['Y', 'Relé o convertidor (aquí, I/P: de corriente a presión de aire)']], que: 'Convierte los 4–20 mA del controlador en 3–15 psi de aire para mover la válvula.', senal: 'Recibe 4–20 mA (trazos) y envía aire (línea con //) a LV-101.' },
    'LV-101': { lazo: '101', ubic: 'campo', letras: [['L', 'Nivel'], ['V', 'Válvula']], lugar: '<b>En campo</b>: símbolo de válvula con su actuador neumático (la cúpula de arriba).', que: 'Válvula de control de la entrada de agua: es el elemento final del lazo de nivel.', senal: 'Recibe la señal neumática de LY-101 en su actuador.' },
    'FT-102': { lazo: '102', ubic: 'campo', letras: [['F', 'Caudal (flow)'], ['T', 'Transmite']], que: 'Mide el caudal de salida con una placa orificio y un transmisor de presión diferencial.', senal: 'Envía 4–20 mA a FI-102.' },
    'FI-102': { lazo: '102', ubic: 'dcs', letras: [['F', 'Caudal'], ['I', 'Indica']], que: 'Muestra el caudal al operador. Solo indica: este lazo no controla nada.', senal: 'Recibe 4–20 mA de FT-102.' },
    'TE-103': { lazo: '103', ubic: 'campo', letras: [['T', 'Temperatura'], ['E', 'Elemento primario (el sensor)']], lugar: '<b>En campo</b>: dentro de un termopozo en la pared del tanque.', que: 'Pt100 dentro de un termopozo; la punta queda dentro del líquido.', senal: 'Conectada a 3 hilos al transmisor TT-103.' },
    'TT-103': { lazo: '103', ubic: 'campo', letras: [['T', 'Temperatura'], ['T', 'Transmite']], que: 'Convierte la resistencia de la Pt100 en 4–20 mA (transmisor de cabezal).', senal: 'Envía 4–20 mA a TIC-103.' },
    'TIC-103': { lazo: '103', ubic: 'dcs', letras: [['T', 'Temperatura'], ['I', 'Indica'], ['C', 'Controla']], que: 'Controla la temperatura del agua manejando la potencia del calentador.', senal: 'Recibe de TT-103 y envía la señal de mando al calentador.' },
    'PT-104': { lazo: '104', ubic: 'campo', letras: [['P', 'Presión'], ['T', 'Transmite']], que: 'Mide la presión del gas en la parte alta del tanque.', senal: 'Envía 4–20 mA a PI-104.' },
    'PI-104': { lazo: '104', ubic: 'tablero', letras: [['P', 'Presión'], ['I', 'Indica']], que: 'Indicador de presión en el tablero de la sala de control.', senal: 'Recibe 4–20 mA de PT-104.' }
  };

  // ---------- símbolos ----------
  const burbuja = (tag, x, y, ubic) => {
    const [l, num] = tag.split('-');
    const lazo = INST[tag].lazo;
    let marco = '';
    if (ubic === 'dcs') marco = `<rect x="${x - 26}" y="${y - 26}" width="52" height="52" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/>`;
    const linea = ubic === 'tablero' ? `<line x1="${x - 24}" x2="${x + 24}" y1="${y}" y2="${y}" stroke="#2f3b4a" stroke-width="1.8"/>` : '';
    return `<g class="clic inst" data-tag="${tag}" data-lazo="${lazo}" tabindex="0" role="button" aria-label="${tag}">
      ${marco}<circle cx="${x}" cy="${y}" r="24" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/>${linea}
      <text x="${x}" y="${y - 4}" text-anchor="middle" font-size="12" font-weight="700" font-family="var(--mono)" fill="#16202c">${l}</text>
      <text x="${x}" y="${y + 13}" text-anchor="middle" font-size="10.5" font-family="var(--mono)" fill="#465366">${num}</text>
      <circle class="halo" cx="${x}" cy="${y}" r="30" fill="none" stroke="#1d5fb4" stroke-width="3" opacity="0"/></g>`;
  };
  const elec = (d, lazo) => `<path d="${d}" fill="none" stroke="#1d5fb4" stroke-width="1.8" stroke-dasharray="6 4" data-lazo="${lazo}"/>`;
  const neum = (x, y1, y2, lazo) => {
    let marcas = '';
    for (let y = y1 - 12; y > y2 + 6; y -= 22) marcas += `<line x1="${x - 6}" y1="${y + 4}" x2="${x + 2}" y2="${y - 4}" stroke="#1b8a5a" stroke-width="1.8"/><line x1="${x - 2}" y1="${y + 8}" x2="${x + 6}" y2="${y}" stroke="#1b8a5a" stroke-width="1.8"/>`;
    return `<g data-lazo="${lazo}"><line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#1b8a5a" stroke-width="1.8"/>${marcas}</g>`;
  };
  const T = (x, y, t, extra = '') => `<text x="${x}" y="${y}" font-size="11.5" fill="#465366" stroke="#fff" stroke-width="3" paint-order="stroke" ${extra}>${t}</text>`;

  const svgPlanta = (id) => `
    <svg viewBox="0 0 760 480" id="${id}" role="img" aria-label="P&ID del tanque TK-100 con sus lazos de nivel, caudal, temperatura y presión">
      <text x="380" y="22" text-anchor="middle" font-size="13" font-weight="700" fill="#16202c">P&amp;ID del TK-100 (ISA 5.1) · toca un instrumento</text>
      <!-- tanque -->
      <rect x="320" y="150" width="180" height="270" rx="16" fill="#fff" stroke="#5d6a7a" stroke-width="3"/>
      <rect x="323" y="250" width="174" height="167" rx="12" fill="#d3e8fa"/>
      <text x="410" y="205" text-anchor="middle" font-size="15" font-weight="700" fill="#16202c">TK-100</text>
      <!-- entrada con LV-101 -->
      <path d="M20,120 H360 V150" fill="none" stroke="#5d6a7a" stroke-width="4"/>
      ${T(24, 110, 'Entrada de agua')}
      <g data-lazo="101"><path d="M156,108 L184,132 L184,108 L156,132 Z" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
        <line x1="170" y1="120" x2="170" y2="96" stroke="#2f3b4a" stroke-width="2"/><path d="M154,96 A16,14 0 0 1 186,96 Z" fill="#fff" stroke="#2f3b4a" stroke-width="2"/></g>
      ${T(190, 146, 'LV-101', 'font-family="var(--mono)" font-weight="700" fill="#16202c"')}
      <!-- salida con FT-102 (placa orificio) -->
      <path d="M410,420 V455 H745" fill="none" stroke="#5d6a7a" stroke-width="4"/>
      ${T(640, 474, 'Salida a proceso')}
      <g data-lazo="102"><line x1="556" y1="443" x2="556" y2="467" stroke="#2f3b4a" stroke-width="3"/><line x1="564" y1="443" x2="564" y2="467" stroke="#2f3b4a" stroke-width="3"/>
        <line x1="560" y1="443" x2="560" y2="420" stroke="#2f3b4a" stroke-width="1.5"/></g>
      <!-- calentador -->
      <path d="M480,392 l-12,-10 l-12,10 l-12,-10 l-12,10 l-12,-10 l-12,10 l-12,-10 l-12,10 l-12,-10 l-12,10" fill="none" stroke="#e0782b" stroke-width="3" data-lazo="103"/>
      ${T(352, 408, 'calentador')}
      <!-- termopozo TE-103 -->
      <g data-lazo="103"><rect x="452" y="335" width="48" height="10" rx="5" fill="#aab3bf" stroke="#465366"/></g>
      ${T(430, 330, 'TE-103', 'font-family="var(--mono)" font-weight="700" fill="#16202c" text-anchor="end"')}
      <!-- lazo 101: nivel -->
      <line x1="320" y1="320" x2="274" y2="320" stroke="#2f3b4a" stroke-width="1.5" data-lazo="101"/>
      ${elec('M250,296 V256', '101')}
      ${elec('M224,230 H170 V204', '101')}
      ${neum(170, 156, 104, '101')}
      ${burbuja('LT-101', 250, 320, 'campo')}
      ${burbuja('LIC-101', 250, 230, 'dcs')}
      ${burbuja('LY-101', 170, 180, 'campo')}
      ${T(196, 196, 'I/P')}
      <!-- lazo 103: temperatura -->
      <line x1="500" y1="340" x2="556" y2="340" stroke="#2f3b4a" stroke-width="1.5" data-lazo="103"/>
      ${elec('M580,316 V300 H636', '103')}
      ${elec('M660,324 V372 H500', '103')}
      ${burbuja('TT-103', 580, 340, 'campo')}
      ${burbuja('TIC-103', 660, 300, 'dcs')}
      <!-- lazo 102: caudal -->
      ${elec('M584,404 H674', '102')}
      ${burbuja('FT-102', 560, 404, 'campo')}
      ${burbuja('FI-102', 700, 404, 'dcs')}
      <!-- lazo 104: presión -->
      <line x1="450" y1="150" x2="450" y2="119" stroke="#2f3b4a" stroke-width="1.5" data-lazo="104"/>
      ${elec('M474,95 H516', '104')}
      ${burbuja('PT-104', 450, 95, 'campo')}
      ${burbuja('PI-104', 540, 95, 'tablero')}
      <!-- zonas táctiles encima de todo (válvula y termopozo no son círculos) -->
      <rect class="clic" data-tag="LV-101" data-lazo="101" x="148" y="80" width="44" height="56" fill="transparent"/>
      <rect class="clic" data-tag="TE-103" data-lazo="103" x="446" y="326" width="58" height="28" fill="transparent"/>
    </svg>`;

  const LETRAS = `
    <div class="tabla-envoltura"><table class="tabla">
      <tr><th>Letra</th><th>Primera letra: qué se mide</th><th>Letras siguientes: qué hace</th></tr>
      <tr><td><b>A</b></td><td>Análisis (pH, oxígeno…)</td><td>Alarma</td></tr>
      <tr><td><b>C</b></td><td>—</td><td>Controla</td></tr>
      <tr><td><b>E</b></td><td>—</td><td>Elemento primario (sensor)</td></tr>
      <tr><td><b>F</b></td><td>Caudal (flow)</td><td>—</td></tr>
      <tr><td><b>I</b></td><td>—</td><td>Indica</td></tr>
      <tr><td><b>L</b></td><td>Nivel (level)</td><td>(L como modificador: bajo)</td></tr>
      <tr><td><b>P</b></td><td>Presión</td><td>—</td></tr>
      <tr><td><b>T</b></td><td>Temperatura</td><td>Transmite</td></tr>
      <tr><td><b>H</b></td><td>—</td><td>(modificador: alto)</td></tr>
      <tr><td><b>S</b></td><td>Velocidad</td><td>Interruptor (switch)</td></tr>
      <tr><td><b>V</b></td><td>—</td><td>Válvula</td></tr>
      <tr><td><b>Y</b></td><td>—</td><td>Relé, cálculo o convertidor (I/P)</td></tr>
    </table></div>
    <p class="nota" style="margin:8px 0 0">Ejemplos: <b>LAH</b> = alarma de nivel alto · <b>PSL</b> = interruptor de presión baja · <b>FIC</b> = controlador indicador de caudal. El número (101, 102…) identifica el <b>lazo</b>: todos los instrumentos de un lazo llevan el mismo número.</p>`;
  const SIMBOLOS = `
    <svg viewBox="0 0 320 250" style="max-width:340px" role="img" aria-label="Símbolos ISA 5.1">
      <circle cx="40" cy="36" r="20" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/>
      <text x="74" y="32" font-size="12" font-weight="700">En campo</text><text x="74" y="48" font-size="11" fill="#465366">círculo sin línea</text>
      <circle cx="40" cy="90" r="20" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/><line x1="20" x2="60" y1="90" y2="90" stroke="#2f3b4a" stroke-width="1.8"/>
      <text x="74" y="86" font-size="12" font-weight="700">Tablero en sala de control</text><text x="74" y="102" font-size="11" fill="#465366">círculo con una línea</text>
      <rect x="18" y="122" width="44" height="44" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/><circle cx="40" cy="144" r="20" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/>
      <text x="74" y="140" font-size="12" font-weight="700">Sistema de control (DCS/PLC)</text><text x="74" y="156" font-size="11" fill="#465366">círculo dentro de un cuadrado</text>
      <line x1="16" x2="64" y1="190" y2="190" stroke="#5d6a7a" stroke-width="4"/><text x="74" y="194" font-size="12">Tubería de proceso</text>
      <line x1="16" x2="64" y1="214" y2="214" stroke="#1d5fb4" stroke-width="1.8" stroke-dasharray="6 4"/><text x="74" y="218" font-size="12">Señal eléctrica (4–20 mA)</text>
      <line x1="16" x2="64" y1="238" y2="238" stroke="#1b8a5a" stroke-width="1.8"/>
      <line x1="30" y1="242" x2="38" y2="234" stroke="#1b8a5a" stroke-width="1.8"/><line x1="36" y1="244" x2="44" y2="236" stroke="#1b8a5a" stroke-width="1.8"/>
      <text x="74" y="242" font-size="12">Señal neumática (aire)</text>
    </svg>`;

  II.diagramas.pid = function (cont, opts = {}) {
    const id = 'pid' + ++n;
    let tab = ['letras', 'simbolos'].includes(opts.pestana) ? opts.pestana : 'inst';
    let sel = null;
    cont.innerHTML = `
      <div class="diagrama"><div class="diag-2col rango-grid">
        <div class="lienzo">${svgPlanta(id)}</div>
        <div class="panel-info">
          <div class="segmentado" data-rol="tab" style="margin-bottom:10px"><button data-t="inst">Instrumento</button><button data-t="letras">Letras</button><button data-t="simbolos">Símbolos</button></div>
          <div data-rol="cuerpo"></div>
        </div></div></div>`;
    const svg = cont.querySelector('#' + id);
    const cuerpo = cont.querySelector('[data-rol=cuerpo]');
    const pintar = () => {
      cont.querySelectorAll('[data-rol=tab] button').forEach((b) => b.classList.toggle('activo', b.dataset.t === tab));
      if (tab === 'letras') { cuerpo.innerHTML = LETRAS; return; }
      if (tab === 'simbolos') { cuerpo.innerHTML = SIMBOLOS; return; }
      if (!sel) {
        cuerpo.innerHTML = `<span class="etiqueta">Explora</span><h4>Toca un instrumento del P&amp;ID</h4>
          <p class="nota" style="margin:0">Cada círculo es un instrumento. Las letras dicen qué mide y qué hace; el número, a qué lazo pertenece. Al tocarlo se resalta todo su lazo.</p>`;
        return;
      }
      const d = INST[sel], u = UBIC[d.ubic];
      cuerpo.innerHTML = `<span class="etiqueta">Lazo ${d.lazo}</span><h4 style="font-family:var(--mono)">${sel}</h4>
        <dl>
          <div><dt class="nota">Letras</dt><dd style="margin:2px 0 0">${d.letras.map(([l, t], i) => `<b style="font-family:var(--mono)">${l}</b> = ${t}${i === 0 ? ' <span class="nota">(primera letra)</span>' : ''}`).join('<br>')}</dd></div>
          <div><dt class="nota">Dónde está</dt><dd style="margin:2px 0 0">${d.lugar || `<b>${u[0]}</b>: ${u[1]}`}</dd></div>
          <div><dt class="nota">Qué hace en el TK-100</dt><dd style="margin:2px 0 0">${d.que}</dd></div>
          <div><dt class="nota">Señal</dt><dd style="margin:2px 0 0">${d.senal}</dd></div>
        </dl>
        <button class="boton chico" data-rol="todo" style="margin-top:10px">Ver toda la planta</button>`;
      cuerpo.querySelector('[data-rol=todo]').onclick = () => { sel = null; resaltar(); pintar(); };
    };
    const resaltar = () => {
      const lazo = sel ? INST[sel].lazo : null;
      svg.querySelectorAll('[data-lazo]').forEach((e) => { e.style.opacity = !lazo || e.dataset.lazo === lazo ? '1' : '0.22'; });
      svg.querySelectorAll('.inst .halo').forEach((h) => { h.setAttribute('opacity', h.parentNode.dataset.tag === sel ? '1' : '0'); });
    };
    const alTocar = (e) => {
      const g = e.target.closest('[data-tag]');
      if (!g) return;
      sel = g.dataset.tag; tab = 'inst'; resaltar(); pintar();
    };
    svg.addEventListener('click', alTocar);
    svg.addEventListener('keydown', (e) => { if (e.key === 'Enter') alTocar(e); });
    cont.querySelectorAll('[data-rol=tab] button').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.t; pintar(); }));
    pintar();
    return { destruir() { cont.innerHTML = ''; } };
  };
  II.diagramas.pidLetras = (c, o = {}) => II.diagramas.pid(c, { ...o, pestana: 'letras' });
  II.diagramas.pidSimbolos = (c, o = {}) => II.diagramas.pid(c, { ...o, pestana: 'simbolos' });
})();
