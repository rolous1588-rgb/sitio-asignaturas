// ============================================================
// Escenas de planta para el Control de estudio (tocar el lugar / encontrar errores)
// II.escenas[nombre](params) → { titulo, svg, zonas: { A: { t, ok, por }, … } }
// Las zonas se dibujan como <g class="zona" data-z="A"> con su letra.
// Reglas basadas en manuales de fabricantes (Rosemount 3051, VEGA, E+H Promag, WIKA, AW-Lake).
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  const E = (II.escenas = II.escenas || {});
  const halo = 'stroke="#fff" stroke-width="3.5" paint-order="stroke"';
  const Z = (id, x, y, r = 20) => `<g class="zona" data-z="${id}"><circle class="aro" cx="${x}" cy="${y}" r="${r}"/><circle class="letra" cx="${(x + r * 0.78).toFixed(1)}" cy="${(y - r * 0.78).toFixed(1)}" r="11"/><text class="letra-t" x="${(x + r * 0.78).toFixed(1)}" y="${(y - r * 0.78 + 4).toFixed(1)}" text-anchor="middle">${id}</text></g>`;
  const T = (x, y, txt, extra = '') => `<text x="${x}" y="${y}" font-size="11.5" fill="#465366" ${halo} ${extra}>${txt}</text>`;
  const svg = (w, h, cuerpo, aria) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${aria}">${cuerpo}</svg>`;
  const tx = (x, y, w = 56, h = 44, tag = 'PT') => `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="8" fill="#fff" stroke="#2f3b4a" stroke-width="2"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11.5" font-weight="700" font-family="var(--mono)">${tag}</text>`;
  const valvula = (x, y, vert = false) => vert
    ? `<path d="M${x - 9},${y - 9} L${x + 9},${y - 9} L${x - 9},${y + 9} L${x + 9},${y + 9} Z" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>`
    : `<path d="M${x - 9},${y - 9} L${x + 9},${y + 9} L${x + 9},${y - 9} L${x - 9},${y + 9} Z" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>`;
  const flecha = (x1, y1, x2, y2, col = '#1d5fb4') => {
    const a = Math.atan2(y2 - y1, x2 - x1), s = 9;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="2.2"/><path d="M${x2},${y2} L${(x2 - s * Math.cos(a - 0.45)).toFixed(1)},${(y2 - s * Math.sin(a - 0.45)).toFixed(1)} L${(x2 - s * Math.cos(a + 0.45)).toFixed(1)},${(y2 - s * Math.sin(a + 0.45)).toFixed(1)} Z" fill="${col}"/>`;
  };

  // ------------------------------------------------------------
  // 1) Radar en el techo de un tanque (VEGA, E+H Micropilot)
  // ------------------------------------------------------------
  E.techo = ({ variante = 1 } = {}) => {
    const izq = variante !== 2;
    const X0 = 120, X1 = 480, YT = 112, YB = 350, YL = 255;
    const yR = (x) => { const t = (x - X0) / (X1 - X0); return YT - 140 * t * (1 - t); };
    const xIn = izq ? 175 : 425, xLad = izq ? 460 : 140, xOk = izq ? 385 : 215, xPar = izq ? 466 : 134, xB = izq ? 205 : 395;
    const yIn = yR(xIn) - 34;
    let peld = '';
    for (let y = YT + 14; y < YB - 10; y += 20) peld += `<line x1="${xLad - 7}" x2="${xLad + 7}" y1="${y}" y2="${y}" stroke="#8e99a6" stroke-width="2"/>`;
    const cuerpo = `
      <path d="M${X0},${YT} Q300,40 ${X1},${YT} V${YB} H${X0} Z" fill="#fff" stroke="#5d6a7a" stroke-width="3"/>
      <rect x="${X0 + 2}" y="${YL}" width="${X1 - X0 - 4}" height="${YB - YL - 2}" fill="#cfe6fb"/>
      <line x1="${X0 + 2}" x2="${X1 - 2}" y1="${YL}" y2="${YL}" stroke="#7fb3e0" stroke-width="2"/>
      <path d="M${izq ? 30 : 570},${yIn} H${xIn} V${yR(xIn) + 2}" fill="none" stroke="#5d6a7a" stroke-width="10"/>
      <path d="M${xIn - 3},${yR(xIn) + 6} C${xIn - 9},${yR(xIn) + 50} ${xIn + 6},${YL - 70} ${xIn},${YL}" fill="none" stroke="#7fb3e0" stroke-width="3" stroke-dasharray="7 5"/>
      <path d="M${xIn + 4},${yR(xIn) + 6} C${xIn + 10},${yR(xIn) + 60} ${xIn - 4},${YL - 60} ${xIn + 5},${YL}" fill="none" stroke="#7fb3e0" stroke-width="3" stroke-dasharray="7 5"/>
      ${T(izq ? 34 : 566, yIn - 12, 'entrada de producto', izq ? '' : 'text-anchor="end"')}
      <rect x="284" y="${yR(300) - 36}" width="32" height="22" rx="4" fill="#eef2f7" stroke="#2f3b4a" stroke-width="2"/>
      <line x1="300" x2="300" y1="${yR(300) - 14}" y2="305" stroke="#2f3b4a" stroke-width="4"/>
      <path d="M262,300 L300,305 L338,310 M262,310 L300,305 L338,300" stroke="#2f3b4a" stroke-width="5" stroke-linecap="round"/>
      ${T(312, 330, 'agitador')}
      <line x1="${xLad - 7}" x2="${xLad - 7}" y1="${YT + 6}" y2="${YB - 6}" stroke="#8e99a6" stroke-width="2.5"/><line x1="${xLad + 7}" x2="${xLad + 7}" y1="${YT + 6}" y2="${YB - 6}" stroke="#8e99a6" stroke-width="2.5"/>${peld}
      ${T(xLad + (izq ? -10 : 10), YB - 14, 'escalera', izq ? 'text-anchor="end"' : '')}
      ${T(300, YB + 22, 'Tanque con techo abombado: ¿dónde va el radar de nivel?', 'text-anchor="middle" font-weight="700" fill="#16202c"')}
      ${Z('A', 300, yR(300) - 52)}${Z('B', xB, yR(xB) - 24)}${Z('C', xPar, yR(xPar) - 22)}${Z('D', xOk, yR(xOk) - 26)}`;
    return {
      titulo: 'Radar en el techo del tanque',
      svg: svg(600, 385, cuerpo, 'Tanque con techo abombado, entrada de producto, agitador y escalera'),
      zonas: {
        A: { t: 'En el centro del techo, sobre el agitador', ok: false, por: 'En techos abombados el centro produce ecos múltiples (VEGA), y además el agitador cruza el haz y da ecos falsos.' },
        B: { t: 'Junto a la entrada, sobre el chorro de llenado', ok: false, por: 'VEGA: no montarlo en el chorro de llenado ni sobre él; mediría el producto que cae y no la superficie.' },
        C: { t: 'Pegado a la pared, sobre la escalera', ok: false, por: 'VEGA pide al menos 200 mm de la pared; la pared y la escalera devuelven ecos falsos.' },
        D: { t: 'Entre el centro y la pared, lejos de la entrada y del agitador', ok: true, por: 'Lejos del chorro, del agitador y de la escalera, y a más de 200 mm de la pared: el haz ve la superficie limpia.' }
      }
    };
  };

  // ------------------------------------------------------------
  // 2) Dónde va la toma en una tubería horizontal (Rosemount 3051)
  // ------------------------------------------------------------
  E.toma = ({ fluido = 'liquido' } = {}) => {
    const cx = 300, cy = 190, R = 92;
    const nombre = { liquido: 'un líquido', gas: 'un gas', vapor: 'vapor' }[fluido];
    const fondo = fluido === 'liquido' ? '#cfe6fb' : fluido === 'gas' ? '#f3f6fa' : '#f6f6f6';
    let detalles = '';
    if (fluido === 'liquido') {
      detalles = [-30, 0, 26].map((dx, i) => `<circle cx="${cx + dx}" cy="${cy - R + 18 + (i % 2) * 6}" r="${5 + i}" fill="#fff" stroke="#7fb3e0" stroke-width="1.5"/>`).join('') +
        [-36, -18, 0, 16, 34].map((dx, i) => `<circle cx="${cx + dx}" cy="${cy + R - 12 - (i % 2) * 4}" r="3.5" fill="#93806a"/>`).join('') +
        T(cx - 70, cy - R + 36, 'aire o gas atrapado') + T(cx - 60, cy + R - 26, 'sedimentos');
    } else {
      detalles = `<path d="M${cx - 70},${cy + R - 30} Q${cx},${cy + R - 18} ${cx + 70},${cy + R - 30} L${cx + 50},${cy + R - 12} Q${cx},${cy + R - 2} ${cx - 50},${cy + R - 12} Z" fill="#cfe6fb"/>` +
        T(cx - 52, cy + R - 36, 'condensado') + (fluido === 'vapor' ? T(cx - 20, cy - 10, 'vapor', 'font-weight="700"') : T(cx - 14, cy - 10, 'gas', 'font-weight="700"'));
    }
    const cuerpo = `
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="${fondo}" stroke="#5d6a7a" stroke-width="10"/>
      ${detalles}
      ${T(cx, 372, `Corte de una tubería horizontal con ${nombre}: ¿dónde va la toma de presión?`, 'text-anchor="middle" font-weight="700" fill="#16202c"')}
      ${Z('A', cx, cy - R - 12)}${Z('B', cx + R + 12, cy)}${Z('C', cx, cy + R + 12)}`;
    const Z3 = {
      liquido: {
        A: { t: 'Arriba', ok: false, por: 'Arriba se junta el aire o el gas, que entra a la línea y produce lecturas erráticas.' },
        B: { t: 'Al costado', ok: true, por: 'Rosemount: para líquido, tomas al costado de la línea; no entra el gas de arriba ni el sedimento de abajo.' },
        C: { t: 'Abajo', ok: false, por: 'Abajo entran los sedimentos y la toma se tapa.' }
      },
      gas: {
        A: { t: 'Arriba', ok: true, por: 'Rosemount: para gas, tomas arriba o al costado; el condensado no entra a la línea.' },
        B: { t: 'Al costado', ok: true, por: 'También aceptable para gas (Rosemount: arriba o al costado).' },
        C: { t: 'Abajo', ok: false, por: 'Abajo entra el condensado y llena la línea de impulso: la lectura se corre.' }
      },
      vapor: {
        A: { t: 'Arriba', ok: false, por: 'Arriba la línea no se llena de condensado y el vapor caliente llega al instrumento.' },
        B: { t: 'Al costado', ok: true, por: 'Rosemount: para vapor, tomas al costado, con las líneas de impulso llenas de agua.' },
        C: { t: 'Abajo', ok: false, por: 'Abajo entran el sedimento y el óxido, que tapan la toma.' }
      }
    }[fluido];
    return { titulo: 'Toma de presión', svg: svg(600, 385, cuerpo, 'Corte de una tubería con tres posiciones posibles para la toma'), zonas: Z3 };
  };

  // ------------------------------------------------------------
  // 3) Transmisor encima o debajo de la toma (Rosemount 3051)
  // ------------------------------------------------------------
  E.posicion = ({ fluido = 'liquido' } = {}) => {
    const nombre = { liquido: 'líquido', gas: 'gas', vapor: 'vapor' }[fluido];
    const cuerpo = `
      <line x1="60" x2="540" y1="190" y2="190" stroke="#5d6a7a" stroke-width="26"/>
      <line x1="60" x2="540" y1="190" y2="190" stroke="${fluido === 'liquido' ? '#cfe6fb' : '#f3f6fa'}" stroke-width="18"/>
      ${flecha(80, 190, 150, 190)}${T(160, 194, nombre, 'font-weight="700"')}
      <circle cx="300" cy="190" r="7" fill="#2f3b4a"/>${T(312, 222, 'toma al costado')}
      <path d="M300,183 V95" stroke="#8e99a6" stroke-width="4" stroke-dasharray="6 5"/><path d="M300,197 V285" stroke="#8e99a6" stroke-width="4" stroke-dasharray="6 5"/>
      ${valvula(300, 150, true)}${valvula(300, 232, true)}
      ${tx(300, 70, 60, 44, 'PT')}${tx(300, 310, 60, 44, 'PT')}
      ${T(340, 74, 'transmisor encima de la toma')}${T(340, 314, 'transmisor debajo de la toma')}
      ${T(300, 372, `Línea de ${nombre}: ¿dónde conviene montar el transmisor?`, 'text-anchor="middle" font-weight="700" fill="#16202c"')}
      ${Z('A', 300, 70, 38)}${Z('B', 300, 310, 38)}`;
    const Z2 = {
      liquido: { A: { t: 'Encima de la toma', ok: false, por: 'El aire o gas sube y queda atrapado en la línea y en la celda: lecturas erráticas.' },
        B: { t: 'Debajo de la toma', ok: true, por: 'Rosemount: para líquido, transmisor al lado o debajo de las tomas; el gas sube y vuelve a la tubería.' } },
      gas: { A: { t: 'Encima de la toma', ok: true, por: 'Rosemount: para gas, transmisor al lado o encima; el condensado drena de vuelta a la tubería.' },
        B: { t: 'Debajo de la toma', ok: false, por: 'El condensado se acumula en la línea y en la celda, y la lectura se corre.' } },
      vapor: { A: { t: 'Encima de la toma', ok: false, por: 'La línea se vacía de condensado y el vapor caliente llega a la celda.' },
        B: { t: 'Debajo de la toma', ok: true, por: 'Rosemount: para vapor, transmisor al lado o debajo de las tomas, con las líneas llenas de agua.' } }
    }[fluido];
    return { titulo: 'Posición del transmisor', svg: svg(600, 385, cuerpo, 'Tubería con un transmisor encima y otro debajo de la toma'), zonas: Z2 };
  };

  // ------------------------------------------------------------
  // 4) Dónde instalar un caudalímetro magnético (E+H Promag)
  // ------------------------------------------------------------
  E.trazado = () => {
    const cuerpo = `
      <path d="M20,320 H70" stroke="#5d6a7a" stroke-width="12" fill="none"/>
      <circle cx="90" cy="320" r="24" fill="#fff" stroke="#2f3b4a" stroke-width="2.5"/><path d="M80,308 L104,320 L80,332 Z" fill="#2f3b4a"/>
      ${T(66, 362, 'bomba')}
      <path d="M114,320 H220 V120 H420 V300" stroke="#5d6a7a" stroke-width="12" fill="none" stroke-linejoin="round"/>
      <rect x="380" y="300" width="150" height="62" fill="#fff" stroke="#5d6a7a" stroke-width="2.5"/>
      <rect x="382" y="330" width="146" height="30" fill="#cfe6fb"/>
      <path d="M420,306 C416,316 424,322 420,330" stroke="#7fb3e0" stroke-width="3" stroke-dasharray="5 4" fill="none"/>
      ${T(440, 318, 'descarga libre')}
      ${flecha(130, 300, 190, 300)}${flecha(240, 260, 240, 190)}${flecha(270, 100, 360, 100)}${flecha(440, 160, 440, 230)}
      ${T(24, 304, 'succión')}
      ${T(300, 30, 'Trazado de tubería: ¿dónde instalarías el caudalímetro magnético?', 'text-anchor="middle" font-weight="700" fill="#16202c"')}
      ${Z('A', 220, 230, 24)}${Z('B', 320, 120, 24)}${Z('C', 420, 220, 24)}${Z('D', 46, 320, 22)}`;
    return {
      titulo: 'Caudalímetro magnético en el trazado',
      svg: svg(600, 385, cuerpo, 'Trazado de tubería con bomba, tramo vertical, punto alto y descarga libre'),
      zonas: {
        A: { t: 'Tramo vertical con flujo hacia arriba', ok: true, por: 'E+H Promag: el montaje vertical con flujo ascendente asegura la tubería siempre llena.' },
        B: { t: 'Punto más alto de la línea', ok: false, por: 'En el punto más alto se acumula el aire: electrodos al aire y lectura errática (E+H).' },
        C: { t: 'Bajante antes de una descarga libre', ok: false, por: 'Antes de una descarga libre la tubería se vacía: el tubo no va lleno (E+H).' },
        D: { t: 'Succión de la bomba', ok: false, por: 'E+H: no en la succión de bombas; el vacío puede dañar el revestimiento del tubo.' }
      }
    };
  };

  // ------------------------------------------------------------
  // 5) Profundidad y ubicación del termopozo (WIKA)
  // ------------------------------------------------------------
  E.termopozo = ({ variante = 'recto' } = {}) => {
    if (variante === 'codo') {
      const cuerpo = `
        <path d="M40,150 H380 Q420,150 420,190 V370" stroke="#5d6a7a" stroke-width="80" fill="none"/>
        <path d="M40,150 H380 Q420,150 420,190 V370" stroke="#f6eadb" stroke-width="64" fill="none"/>
        ${flecha(70, 150, 150, 150, '#e0782b')}${T(70, 136, 'flujo')}
        <rect x="350" y="143" width="120" height="14" rx="7" fill="#aab3bf" stroke="#465366"/><rect x="470" y="136" width="30" height="28" rx="4" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
        <rect x="160" y="96" width="14" height="34" rx="7" fill="#aab3bf" stroke="#465366"/><rect x="153" y="70" width="28" height="26" rx="4" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
        <rect x="447" y="292" width="40" height="14" rx="7" fill="#aab3bf" stroke="#465366"/><rect x="487" y="285" width="28" height="28" rx="4" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
        ${T(300, 30, 'Tubería delgada con un codo: ¿dónde va el termopozo?', 'text-anchor="middle" font-weight="700" fill="#16202c"')}
        ${Z('A', 360, 150, 22)}${Z('B', 448, 299, 20)}${Z('C', 167, 128, 20)}`;
      return {
        titulo: 'Termopozo en una tubería delgada',
        svg: svg(600, 385, cuerpo, 'Tubería con codo y tres termopozos'),
        zonas: {
          A: { t: 'En el codo, con la punta de frente al flujo', ok: true, por: 'WIKA: en tuberías chicas se instala en un codo, con la punta de frente al flujo (aguas arriba); así entra lo suficiente.' },
          B: { t: 'Después del codo, entrando apenas', ok: false, por: 'Queda muy corto y justo donde el codo genera remolinos: medición pobre.' },
          C: { t: 'En el tramo recto, entrando apenas', ok: false, por: 'En una tubería delgada no alcanza la inserción mínima: la punta queda cerca de la pared y el vástago conduce calor.' }
        }
      };
    }
    const cuerpo = `
      <rect x="40" y="130" width="520" height="150" fill="#f6eadb"/>
      <line x1="40" x2="560" y1="130" y2="130" stroke="#5d6a7a" stroke-width="6"/><line x1="40" x2="560" y1="280" y2="280" stroke="#5d6a7a" stroke-width="6"/>
      <line x1="40" x2="560" y1="180" y2="180" stroke="#d9c6ad" stroke-dasharray="4 4"/><line x1="40" x2="560" y1="230" y2="230" stroke="#d9c6ad" stroke-dasharray="4 4"/>
      ${T(46, 176, '1/3')}${T(46, 226, '2/3')}
      ${flecha(60, 255, 140, 255, '#e0782b')}${T(60, 248, 'flujo')}
      <rect x="153" y="100" width="14" height="52" rx="7" fill="#aab3bf" stroke="#465366"/><rect x="146" y="74" width="28" height="26" rx="4" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
      <rect x="293" y="100" width="14" height="104" rx="7" fill="#aab3bf" stroke="#465366"/><rect x="286" y="74" width="28" height="26" rx="4" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
      <rect x="433" y="100" width="14" height="172" rx="7" fill="#aab3bf" stroke="#465366"/><rect x="426" y="74" width="28" height="26" rx="4" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
      ${T(300, 32, 'Corte de una tubería: ¿cuál termopozo tiene la profundidad correcta?', 'text-anchor="middle" font-weight="700" fill="#16202c"')}
      ${Z('A', 160, 150, 20)}${Z('B', 300, 202, 20)}${Z('C', 440, 266, 20)}`;
    return {
      titulo: 'Profundidad del termopozo',
      svg: svg(600, 305, cuerpo, 'Tubería con tres termopozos de distinta profundidad'),
      zonas: {
        A: { t: 'Punta apenas dentro de la tubería', ok: false, por: 'Muy corto: la punta queda cerca de la pared y el vástago conduce calor hacia afuera; lee de menos en procesos calientes.' },
        B: { t: 'Punta entre 1/3 y 2/3 del diámetro', ok: true, por: 'WIKA: inserción entre 1/3 y 2/3 del diámetro (o al menos 10 veces el diámetro de la punta).' },
        C: { t: 'Punta casi tocando la pared opuesta', ok: false, por: 'Demasiado largo: el flujo lo hace vibrar más y puede romperse (por eso se calcula según ASME PTC 19.3 TW).' }
      }
    };
  };

  // ------------------------------------------------------------
  // 6) Línea de vapor con manómetro y transmisor (encuentra los errores)
  // ------------------------------------------------------------
  E.vapor = () => {
    const cuerpo = `
      <line x1="30" x2="570" y1="250" y2="250" stroke="#5d6a7a" stroke-width="28"/>
      <line x1="30" x2="570" y1="250" y2="250" stroke="#f6f6f6" stroke-width="20"/>
      ${T(40, 254, 'vapor', 'font-weight="700"')}${flecha(90, 250, 150, 250, '#e0782b')}
      <line x1="140" x2="140" y1="236" y2="200" stroke="#5d6a7a" stroke-width="6"/>
      <circle cx="140" cy="176" r="26" fill="#fff" stroke="#2f3b4a" stroke-width="2.5"/><line x1="140" y1="176" x2="154" y2="164" stroke="#c0392b" stroke-width="2.5"/>
      ${T(100, 140, 'manómetro')}
      <line x1="340" x2="340" y1="236" y2="120" stroke="#5d6a7a" stroke-width="6"/>${valvula(340, 205, true)}
      ${tx(340, 96, 70, 46, 'PT-104')}
      <path d="M340,20 V73" stroke="#2f3b4a" stroke-width="5" fill="none"/>${T(350, 34, 'cable')}
      <circle cx="378" cy="96" r="6" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
      ${T(300, 372, 'Encuentra los errores de esta instalación en una línea de vapor', 'text-anchor="middle" font-weight="700" fill="#16202c"')}
      ${Z('A', 140, 205, 22)}${Z('B', 340, 205, 20)}${Z('C', 340, 50, 18)}${Z('D', 384, 96, 16)}${Z('E', 300, 150, 18)}${Z('F', 340, 120, 14)}`;
    return {
      titulo: 'Instalación en una línea de vapor',
      svg: svg(600, 385, cuerpo, 'Línea de vapor con un manómetro y un transmisor'),
      zonas: {
        A: { t: 'Manómetro directo sobre el vapor', ok: false, por: 'Sin sifón, el vapor caliente llega al tubo Bourdon y lo deforma; el sifón mantiene una barrera de condensado frío.' },
        B: { t: 'Válvula de bloqueo en la línea del transmisor', ok: true, por: 'Correcto: permite aislar y retirar el instrumento sin parar la línea.' },
        C: { t: 'Cable que baja directo a la entrada superior', ok: false, por: 'El agua corre por el cable y entra a la carcasa: el cable debe entrar por abajo o con un lazo de goteo.' },
        D: { t: 'Entrada de cable sin usar, abierta', ok: false, por: 'Rosemount: las entradas sin usar se cierran con un tapón; si no, entran agua y polvo.' },
        E: { t: 'Transmisor montado encima de la toma', ok: false, por: 'Rosemount: en vapor, el transmisor va al lado o debajo de las tomas, con las líneas llenas de agua.' },
        F: { t: 'Placa con el TAG (PT-104)', ok: true, por: 'Correcto: identifica el instrumento igual que en el P&ID.' }
      }
    };
  };

  // ------------------------------------------------------------
  // 7) Caudalímetro magnético en tubería de PVC (encuentra los errores)
  // ------------------------------------------------------------
  E.magnetico = () => {
    const cuerpo = `
      <path d="M140,40 V150 Q140,200 190,200 H570" stroke="#5d6a7a" stroke-width="30" fill="none"/>
      <path d="M140,40 V150 Q140,200 190,200 H570" stroke="#e7eef6" stroke-width="22" fill="none"/>
      ${T(150, 60, 'tubería de PVC')}${flecha(156, 70, 156, 120)}
      <rect x="222" y="168" width="10" height="64" fill="#8e99a6"/><rect x="298" y="168" width="10" height="64" fill="#8e99a6"/>
      <rect x="232" y="174" width="66" height="52" rx="8" fill="#e7f0fb" stroke="#1d5fb4" stroke-width="2.4"/>
      <rect x="250" y="130" width="30" height="40" rx="4" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>${T(244, 124, 'FT')}
      <circle cx="265" cy="180" r="5" fill="#2f3b4a"/><circle cx="265" cy="220" r="5" fill="#2f3b4a"/>
      ${flecha(246, 238, 286, 238, '#1b8a5a')}
      <path d="M460,186 L480,200 L460,214 Z M500,186 L480,200 L500,214 Z" fill="#fff" stroke="#2f3b4a" stroke-width="2"/><line x1="480" x2="480" y1="200" y2="176" stroke="#2f3b4a" stroke-width="2"/><rect x="470" y="164" width="20" height="12" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
      ${T(452, 236, 'válvula de control')}
      <rect x="250" y="300" width="320" height="34" rx="4" fill="#fbfcfe" stroke="#8e99a6" stroke-width="2"/>
      <path d="M265,170 C265,250 250,290 290,312 H560" stroke="#1d5fb4" stroke-width="3" fill="none"/><path d="M262,322 H560" stroke="#c0392b" stroke-width="5" fill="none"/>
      ${T(570, 352, 'misma bandeja: señal del FT y cable de motor 380 V', 'text-anchor="end"')}
      ${T(300, 374, 'Encuentra los errores de esta instalación', 'text-anchor="middle" font-weight="700" fill="#16202c"')}
      ${Z('A', 200, 200, 22)}${Z('B', 265, 200, 16)}${Z('C', 304, 200, 14)}${Z('D', 480, 196, 22)}${Z('E', 360, 318, 18)}${Z('F', 266, 240, 13)}`;
    return {
      titulo: 'Instalación de un caudalímetro magnético',
      svg: svg(600, 380, cuerpo, 'Caudalímetro magnético en tubería de PVC con codo, válvula y bandeja de cables'),
      zonas: {
        A: { t: 'Medidor justo después del codo', ok: false, por: 'E+H pide al menos 5 diámetros de tramo recto antes del medidor; el codo deforma el perfil de velocidad.' },
        B: { t: 'Electrodos arriba y abajo (eje vertical)', ok: false, por: 'E+H: en horizontal, el eje de los electrodos va horizontal, para que las burbujas de arriba y los sedimentos de abajo no los cubran.' },
        C: { t: 'Tubería de PVC sin discos de puesta a tierra', ok: false, por: 'En tubería plástica o revestida siempre van discos de tierra para igualar el potencial del líquido (E+H).' },
        D: { t: 'Válvula de control aguas abajo', ok: true, por: 'Correcto: aguas abajo, la válvula ayuda a mantener el tubo lleno y no deforma el flujo antes del medidor.' },
        E: { t: 'Cable de señal junto al cable del motor', ok: false, por: 'La señal debe ir separada de los cables de fuerza (otra bandeja o cruces a 90°); si no, aparece ruido.' },
        F: { t: 'Flecha del medidor en el sentido del flujo', ok: true, por: 'Correcto: la flecha del cuerpo coincide con el sentido del flujo.' }
      }
    };
  };

  // ------------------------------------------------------------
  // 8) Cableado de un lazo 4–20 mA en campo (encuentra los errores)
  // ------------------------------------------------------------
  E.cableado = () => {
    const cuerpo = `
      <line x1="110" x2="110" y1="200" y2="350" stroke="#8e99a6" stroke-width="8"/><rect x="80" y="346" width="60" height="8" fill="#8e99a6"/>
      ${tx(110, 150, 80, 60, 'LT-101')}
      <rect x="150" y="128" width="16" height="22" rx="3" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
      <path d="M110,180 V230 C110,262 150,262 150,232 V215" stroke="#1d5fb4" stroke-width="4" fill="none"/>
      <path d="M150,215 C150,190 190,190 200,215 L200,290 H460" stroke="#1d5fb4" stroke-width="4" fill="none"/>
      <rect x="250" y="268" width="80" height="44" fill="none" stroke="#8e99a6" stroke-width="2" stroke-dasharray="4 3"/>${T(252, 326, 'cruce a 90° con')}${T(252, 340, 'la bandeja de fuerza')}
      <line x1="290" x2="290" y1="230" y2="350" stroke="#c0392b" stroke-width="6"/>
      <line x1="360" x2="460" y1="296" y2="296" stroke="#c0392b" stroke-width="6"/>${T(360, 318, 'junto al cable del variador')}
      <rect x="460" y="60" width="120" height="290" rx="6" fill="#fff" stroke="#2f3b4a" stroke-width="2.5"/>${T(470, 82, 'tablero')}
      <rect x="478" y="100" width="84" height="40" rx="4" fill="#e7f0fb" stroke="#1d5fb4"/>${T(486, 125, 'fuente + PLC')}
      <rect x="478" y="300" width="84" height="12" fill="#1b8a5a"/>${T(482, 332, 'barra de tierra')}
      <path d="M460,290 H520 V140" stroke="#1d5fb4" stroke-width="3" fill="none"/>
      <path d="M470,290 V306 H480" stroke="#1b8a5a" stroke-width="3" fill="none"/>
      <path d="M100,180 V196 H60 V350" stroke="#1b8a5a" stroke-width="3" fill="none"/>${T(30, 370, 'blindaje a tierra en el transmisor')}
      <rect x="168" y="150" width="20" height="14" fill="#fff" stroke="#2f3b4a" stroke-width="2" transform="rotate(25 178 157)"/>${T(176, 120, 'tapa')}
      <rect x="120" y="268" width="56" height="16" rx="3" fill="#fbf1de" stroke="#b7791f"/>${T(124, 280, 'LAZO 101', 'font-size="9"')}
      ${T(300, 28, 'Encuentra los errores del cableado de este lazo 4–20 mA', 'text-anchor="middle" font-weight="700" fill="#16202c"')}
      ${Z('A', 72, 196, 18)}${Z('B', 290, 290, 20)}${Z('C', 130, 250, 20)}${Z('D', 410, 296, 20)}${Z('E', 178, 157, 15)}${Z('F', 148, 276, 16)}`;
    return {
      titulo: 'Cableado del lazo en campo',
      svg: svg(600, 385, cuerpo, 'Transmisor, bandejas de cables y tablero con barra de tierra'),
      zonas: {
        A: { t: 'Blindaje conectado a tierra también en el transmisor', ok: false, por: 'Rosemount: el blindaje va a tierra solo en el extremo de la fuente; en el transmisor se recorta y aísla. A tierra en los dos extremos forma un lazo de tierra y mete ruido.' },
        B: { t: 'Cable de señal cruzando la bandeja de fuerza a 90°', ok: true, por: 'Correcto: cuando la señal debe cruzar cables de fuerza, se cruza en ángulo recto.' },
        C: { t: 'Cable con lazo de goteo antes de la entrada', ok: true, por: 'Correcto: el agua que corre por el cable gotea en la parte baja del lazo y no entra a la carcasa.' },
        D: { t: 'Señal tendida junto al cable del variador', ok: false, por: 'Los variadores emiten mucho ruido: la señal debe ir en otra bandeja, separada.' },
        E: { t: 'Tapa de bornes abierta', ok: false, por: 'Sin la tapa bien cerrada se pierde el grado IP: entra humedad y se corroen los bornes.' },
        F: { t: 'Etiqueta con el número de lazo', ok: true, por: 'Correcto: cada cable se identifica con su lazo, como en los planos.' }
      }
    };
  };
})();
