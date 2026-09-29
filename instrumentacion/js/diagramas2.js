// ============================================================
// Diagramas interactivos — Sesión 2
//   II.diagramas.temperatura → Pt100, termopar K y termistor NTC
//   II.diagramas.presion     → absoluta / manométrica y presión hidrostática
// Cada uno devuelve { destruir() }.
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  II.diagramas = II.diagramas || {};
  let contador = 0;
  const uid = () => 's2d' + ++contador;

  // ---------- modelos físicos ----------
  // Pt100 según IEC 60751 (Callendar–Van Dusen)
  const pt100 = (t) => {
    const A = 3.9083e-3, B = -5.775e-7, C = -4.183e-12;
    return 100 * (1 + A * t + B * t * t + (t < 0 ? C * (t - 100) * t * t * t : 0));
  };
  // Termopar tipo K: tabla de referencia (unión fría a 0 °C), en mV
  const K_T = [-50, -40, -30, -20, -10, 0, 10, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300];
  const K_E = [-1.889, -1.527, -1.156, -0.778, -0.392, 0, 0.397, 0.798, 1.0, 1.203, 1.612, 2.023, 2.436, 2.851, 3.267, 3.682, 4.096, 8.138, 12.209, 16.397, 20.644, 24.905, 29.129, 33.275, 37.326, 41.276, 45.119, 48.838, 52.41];
  const interp = (xs, ys, x) => {
    if (x <= xs[0]) return ys[0] + ((x - xs[0]) * (ys[1] - ys[0])) / (xs[1] - xs[0]);
    for (let i = 1; i < xs.length; i++) if (x <= xs[i]) return ys[i - 1] + ((x - xs[i - 1]) * (ys[i] - ys[i - 1])) / (xs[i] - xs[i - 1]);
    const n = xs.length - 1;
    return ys[n] + ((x - xs[n]) * (ys[n] - ys[n - 1])) / (xs[n] - xs[n - 1]);
  };
  const kE = (t) => interp(K_T, K_E, t);
  const kT = (e) => interp(K_E, K_T, e);
  // Termistor NTC 10 kΩ a 25 °C, β = 3950 K
  const ntc = (t) => 10000 * Math.exp(3950 * (1 / (t + 273.15) - 1 / 298.15));
  // inversa numérica de una función creciente
  const invertir = (f, y, a, b) => {
    for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (f(m) < y) a = m; else b = m; }
    return (a + b) / 2;
  };
  // atmósfera estándar y ebullición del agua (Antoine)
  II.patm = (h) => Math.round(101.325 * Math.pow(1 - 2.25577e-5 * h, 5.25588) * 10) / 10;
  II.ebullicion = (kPa) => {
    const mmHg = kPa * 7.50062;
    if (mmHg <= 0) return NaN;
    const [A, B, C] = mmHg < 760 ? [8.07131, 1730.63, 233.426] : [8.14019, 1810.94, 244.485];
    return B / (A - Math.log10(mmHg)) - C;
  };

  const lectura = (x, y, texto, ancho = 90, color = 'var(--acento-2)') =>
    `<g><rect x="${x - ancho / 2}" y="${y - 13}" width="${ancho}" height="26" rx="6" fill="#fff" stroke="#cbd3dd"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-family="var(--mono)" font-size="12.5" font-weight="700" fill="${color}">${texto}</text></g>`;
  // puntas de flecha por color (sin context-stroke, para máxima compatibilidad)
  const COLORES_FLECHA = { az: '#1d5fb4', vd: '#1b8a5a', rj: '#c0392b', os: '#154a8c' };
  const flechaDef = (id) => `<defs>${Object.entries(COLORES_FLECHA).map(([k, c]) => `<marker id="${id}-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join('')}</defs>`;

  // ------------------------------------------------------------
  // 1) TEMPERATURA
  // ------------------------------------------------------------
  const SENSORES = {
    pt: {
      nombre: 'RTD Pt100', tMin: -50, tMax: 600, paso: 1, yMin: 60, yMax: 330, yU: 'Ω', yTit: 'Resistencia (Ω)',
      yTicks: [100, 150, 200, 250, 300], xTicks: [0, 100, 200, 300, 400, 500, 600], f: pt100,
      ficha: {
        Principio: 'La resistencia del platino aumenta con la temperatura: 100 Ω a 0 °C y unos 0,385 Ω más por cada °C.',
        'Rango típico': '−200 a 600 °C (algunas hasta 850 °C).',
        'Exactitud típica': 'Clase A: ±(0,15 + 0,002·|T|) °C → ±0,3 °C a 72 °C.',
        Ventajas: 'Muy exacta, estable y casi lineal.',
        'Cuidado con': 'El cable también tiene resistencia: a 2 hilos se suma como error. Se usa a 3 o 4 hilos.',
        'Uso típico': 'Alimentos, farmacéutica, agua caliente, laboratorios: donde importa la exactitud.'
      }
    },
    tc: {
      nombre: 'Termopar tipo K', tMin: 0, tMax: 1200, paso: 5, yMin: -4, yMax: 52, yU: 'mV', yTit: 'Tensión (mV)',
      yTicks: [0, 10, 20, 30, 40, 50], xTicks: [0, 200, 400, 600, 800, 1000, 1200], f: kE,
      ficha: {
        Principio: 'Dos metales distintos unidos generan milivoltios según la DIFERENCIA de temperatura entre la unión caliente y la unión fría (bornera). Tipo K ≈ 41 µV/°C.',
        'Rango típico': '−200 a 1260 °C (tipo K). Otros tipos (R, S, B) llegan a 1700 °C.',
        'Exactitud típica': '±2,2 °C o ±0,75 % de la lectura (el mayor).',
        Ventajas: 'Robusto, barato, rápido y resiste altas temperaturas.',
        'Cuidado con': 'Señal muy pequeña (sensible al ruido) y necesita compensación de unión fría. Se extiende con cable de compensación del mismo tipo.',
        'Uso típico': 'Hornos, calderas, fundición, gases de escape.'
      }
    },
    ntc: {
      nombre: 'Termistor NTC', tMin: -20, tMax: 150, paso: 1, yMin: 0, yMax: 110, yU: 'kΩ', yTit: 'Resistencia (kΩ)',
      yTicks: [0, 20, 40, 60, 80, 100], xTicks: [-20, 0, 25, 50, 75, 100, 125, 150], f: (t) => ntc(t) / 1000,
      ficha: {
        Principio: 'Semiconductor cuya resistencia BAJA mucho al subir la temperatura (coeficiente negativo). Aquí: 10 kΩ a 25 °C.',
        'Rango típico': '−40 a 125 °C.',
        'Exactitud típica': '±0,2 a ±1 °C en un rango corto.',
        Ventajas: 'Muy sensible, pequeño y barato.',
        'Cuidado con': 'Muy poco lineal, rango estrecho y poca intercambiabilidad entre unidades.',
        'Uso típico': 'Equipos y electrodomésticos, protección de motores y baterías, aire acondicionado.'
      }
    }
  };

  II.diagramas.temperatura = function (cont, opts = {}) {
    const id = uid();
    const S = { sensor: opts.sensor || 'pt', t: 72, hilos: 3, largo: 100, tf: 25, comp: true };
    const X0 = 74, X1 = 612, Y0 = 34, Y1 = 312;

    cont.innerHTML = `
      <div class="diagrama">
        <div class="controles">
          <div class="segmentado" data-rol="sensor">
            <button data-s="pt">RTD Pt100</button><button data-s="tc">Termopar tipo K</button><button data-s="ntc">Termistor NTC</button>
          </div>
        </div>
        <div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 640 360" id="${id}-g" role="img" aria-label="Curva del sensor de temperatura"></svg></div>
          <div class="panel-info">
            <div class="deslizador" data-d="t"><label>Temperatura real del proceso</label><output></output><input type="range"></div>
            <div data-rol="extra"></div>
            <dl data-rol="lect" style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin:0;align-items:baseline"></dl>
          </div>
        </div>
        <div class="panel-info" data-rol="ficha"></div>
      </div>`;

    const q = (s) => cont.querySelector(s);
    const svg = q('#' + id + '-g');

    const pintarExtra = () => {
      const ex = q('[data-rol=extra]');
      if (S.sensor === 'pt') {
        ex.innerHTML = `
          <label class="campo" style="margin-bottom:10px"><span>Conexión al transmisor</span>
            <div class="segmentado" data-rol="hilos"><button data-h="2">2 hilos</button><button data-h="3">3 hilos</button><button data-h="4">4 hilos</button></div></label>
          <div class="deslizador" data-d="largo"><label>Largo del cable (0,75 mm² ≈ 0,025 Ω/m)</label><output></output><input type="range" min="0" max="300" step="5"></div>`;
        ex.querySelectorAll('[data-rol=hilos] button').forEach((b) => b.addEventListener('click', () => { S.hilos = +b.dataset.h; pintar(); }));
        const d = ex.querySelector('[data-d=largo] input');
        d.value = S.largo;
        d.addEventListener('input', (e) => { S.largo = +e.target.value; pintar(); });
      } else if (S.sensor === 'tc') {
        ex.innerHTML = `
          <div class="deslizador" data-d="tf"><label>Temperatura de la bornera (unión fría)</label><output></output><input type="range" min="0" max="50" step="1"></div>
          <label class="campo" style="margin-bottom:10px"><span>Compensación de unión fría en el transmisor</span>
            <div class="segmentado" data-rol="comp"><button data-c="1">Activada</button><button data-c="0">Desactivada</button></div></label>`;
        ex.querySelectorAll('[data-rol=comp] button').forEach((b) => b.addEventListener('click', () => { S.comp = b.dataset.c === '1'; pintar(); }));
        const d = ex.querySelector('[data-d=tf] input');
        d.value = S.tf;
        d.addEventListener('input', (e) => { S.tf = +e.target.value; pintar(); });
      } else {
        ex.innerHTML = '<p class="nota" style="margin:0 0 12px">Compara cuántos ohmios cambia por cada °C con lo que cambia la Pt100.</p>';
      }
    };

    const calcular = () => {
      const c = SENSORES[S.sensor];
      const r = { c };
      if (S.sensor === 'pt') {
        r.real = pt100(S.t);
        r.rc = S.largo * 0.025;
        r.extra = S.hilos === 2 ? 2 * r.rc : 0;
        r.usada = r.real + r.extra;
        r.ind = invertir(pt100, r.usada, -200, 900);
      } else if (S.sensor === 'tc') {
        r.real = kE(S.t);
        r.med = kE(S.t) - kE(S.tf);
        r.usada = S.comp ? r.med + kE(S.tf) : r.med;
        r.ind = kT(r.usada);
      } else {
        r.real = ntc(S.t) / 1000;
        r.usada = r.real;
        r.ind = S.t;
        r.sens = (3950 / Math.pow(S.t + 273.15, 2)) * ntc(S.t);
      }
      r.err = r.ind - S.t;
      return r;
    };

    const pintar = () => {
      const c = SENSORES[S.sensor];
      cont.querySelectorAll('[data-rol=sensor] button').forEach((b) => b.classList.toggle('activo', b.dataset.s === S.sensor));
      cont.querySelectorAll('[data-rol=hilos] button').forEach((b) => b.classList.toggle('activo', +b.dataset.h === S.hilos));
      cont.querySelectorAll('[data-rol=comp] button').forEach((b) => b.classList.toggle('activo', (b.dataset.c === '1') === S.comp));
      q('[data-d=t] output').textContent = II.fmt(S.t, 0) + ' °C';
      if (q('[data-d=largo] output')) q('[data-d=largo] output').textContent = S.largo + ' m';
      if (q('[data-d=tf] output')) q('[data-d=tf] output').textContent = S.tf + ' °C';

      const r = calcular();
      const sx = (t) => X0 + ((Math.max(c.tMin, Math.min(c.tMax, t)) - c.tMin) / (c.tMax - c.tMin)) * (X1 - X0);
      const sy = (y) => Y1 - ((Math.max(c.yMin, Math.min(c.yMax, y)) - c.yMin) / (c.yMax - c.yMin)) * (Y1 - Y0);
      const pts = [];
      for (let i = 0; i <= 160; i++) { const t = c.tMin + (i / 160) * (c.tMax - c.tMin); pts.push(sx(t).toFixed(1) + ',' + sy(c.f(t)).toFixed(1)); }
      const hayError = Math.abs(r.err) >= 0.05;
      const colErr = Math.abs(r.err) < 0.5 ? 'var(--ok)' : '#c0392b';
      const dec = S.sensor === 'tc' ? 2 : S.sensor === 'ntc' ? 2 : 1;
      const yTxt = (v) => II.fmt(v, dec) + ' ' + c.yU;
      const xr = sx(S.t), yr = sy(r.real), yu = sy(r.usada), xi = sx(r.ind);
      svg.innerHTML = `
        ${c.yTicks.map((v) => `<line x1="${X0}" x2="${X1}" y1="${sy(v)}" y2="${sy(v)}" stroke="#e1e6ed"/><text class="svg-texto" x="${X0 - 8}" y="${sy(v) + 4}" text-anchor="end" font-size="11">${v}</text>`).join('')}
        ${c.xTicks.map((v) => `<line x1="${sx(v)}" x2="${sx(v)}" y1="${Y1}" y2="${Y1 + 6}" stroke="#8e99a6"/><text class="svg-texto" x="${sx(v)}" y="${Y1 + 20}" text-anchor="middle" font-size="11">${v}</text>`).join('')}
        <line x1="${X0}" x2="${X1}" y1="${Y1}" y2="${Y1}" stroke="#8e99a6" stroke-width="1.5"/>
        <line x1="${X0}" x2="${X0}" y1="${Y0}" y2="${Y1}" stroke="#8e99a6" stroke-width="1.5"/>
        <text class="svg-texto fuerte" x="${X0}" y="20" font-size="12">${c.yTit}</text>
        <text class="svg-texto fuerte" x="${(X0 + X1) / 2}" y="352" text-anchor="middle" font-size="12">Temperatura (°C)</text>
        <text class="svg-texto" x="${X1}" y="20" text-anchor="end" font-size="12">${II.esc(c.nombre)}</text>
        <polyline points="${pts.join(' ')}" fill="none" stroke="#1d5fb4" stroke-width="3" stroke-linejoin="round"/>
        <line x1="${xr}" x2="${xr}" y1="${yr}" y2="${Y1}" stroke="#1d5fb4" stroke-dasharray="4 4" stroke-width="1.5"/>
        ${hayError ? `
          <line x1="${xr}" x2="${xi}" y1="${yu}" y2="${yu}" stroke="${colErr}" stroke-dasharray="5 4" stroke-width="2"/>
          <line x1="${xi}" x2="${xi}" y1="${yu}" y2="${Y1}" stroke="${colErr}" stroke-dasharray="5 4" stroke-width="2"/>
          <circle cx="${xr}" cy="${yu}" r="6" fill="#fff" stroke="${colErr}" stroke-width="2.5"/>
          <circle cx="${xi}" cy="${yu}" r="4" fill="${colErr}"/>
          <text x="${xi + (xi > xr ? 6 : -6)}" y="${Y1 - 8}" text-anchor="${xi > xr ? 'start' : 'end'}" font-size="12" font-weight="700" fill="${colErr}" stroke="#fff" stroke-width="3" paint-order="stroke">indica ${II.fmt(r.ind, 1)} °C</text>` : ''}
        <circle cx="${xr}" cy="${yr}" r="7" fill="#1d5fb4" stroke="#fff" stroke-width="2"/>
        <text x="${xr + (xr > 480 ? -12 : 12)}" y="${yr - 10}" text-anchor="${xr > 480 ? 'end' : 'start'}" font-size="12.5" font-weight="700" fill="#154a8c" stroke="#fff" stroke-width="3" paint-order="stroke">${II.fmt(S.t, 0)} °C → ${yTxt(r.real)}</text>
        ${hayError ? '' : `<text x="${xr + (xr > 480 ? -6 : 6)}" y="${Y1 - 8}" text-anchor="${xr > 480 ? 'end' : 'start'}" font-size="12" font-weight="700" fill="var(--ok)" stroke="#fff" stroke-width="3" paint-order="stroke">indica ${II.fmt(r.ind, 1)} °C ✓</text>`}`;

      const chip = `<span class="chip ${Math.abs(r.err) < 0.5 ? 'ok' : Math.abs(r.err) < 2 ? 'duda' : 'mal'}">${Math.abs(r.err) < 0.05 ? '0' : (r.err > 0 ? '+' : '') + II.fmt(r.err, 1)} °C</span>`;
      let filas = '';
      if (S.sensor === 'pt') {
        filas = `
          <dt class="nota">Resistencia de la Pt100</dt><dd><b>${II.fmt(r.real, 2)} Ω</b></dd>
          <dt class="nota">Cada conductor del cable</dt><dd>${II.fmt(r.rc, 2)} Ω</dd>
          <dt class="nota">El transmisor mide</dt><dd><b>${II.fmt(r.usada, 2)} Ω</b> ${S.hilos === 2 ? `<span class="nota">(${II.fmt(r.real, 2)} + 2 × ${II.fmt(r.rc, 2)})</span>` : `<span class="nota">(el ${S.hilos === 3 ? '3er' : '3er y 4º'} hilo compensa el cable)</span>`}</dd>`;
      } else if (S.sensor === 'tc') {
        filas = `
          <dt class="nota">Tensión en los bornes</dt><dd><b>${II.fmt(r.med, 3)} mV</b> <span class="nota">(depende de ${II.fmt(S.t, 0)} − ${S.tf} °C)</span></dd>
          <dt class="nota">Compensación</dt><dd>${S.comp ? `+ ${II.fmt(kE(S.tf), 3)} mV (equivale a ${S.tf} °C)` : '<b style="color:var(--mal)">ninguna</b>: supone la bornera a 0 °C'}</dd>`;
      } else {
        filas = `
          <dt class="nota">Resistencia</dt><dd><b>${r.real >= 1 ? II.fmt(r.real, 2) + ' kΩ' : II.fmt(r.real * 1000, 0) + ' Ω'}</b></dd>
          <dt class="nota">Sensibilidad</dt><dd><b>−${II.fmt(r.sens, r.sens < 10 ? 1 : 0)} Ω por °C</b> <span class="nota">(Pt100: +0,39 Ω por °C)</span></dd>
          ${S.t > 125 ? '<dt class="nota">Atención</dt><dd><b style="color:var(--mal)">Fuera del rango típico de un termistor (máx. ≈ 125 °C)</b></dd>' : ''}`;
      }
      q('[data-rol=lect]').innerHTML = `${filas}
        <dt class="nota">El transmisor indica</dt><dd><b style="font-size:1.1rem">${II.fmt(r.ind, 1)} °C</b></dd>
        <dt class="nota">Error</dt><dd>${chip}</dd>`;
      q('[data-rol=ficha]').innerHTML = `<span class="etiqueta">${II.esc(c.nombre)}</span>
        <dl style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));margin-top:8px">${Object.entries(c.ficha).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
    };

    const ponerSensor = (s) => {
      S.sensor = s;
      const c = SENSORES[s];
      const d = q('[data-d=t] input');
      d.min = c.tMin; d.max = c.tMax; d.step = c.paso;
      S.t = Math.max(c.tMin, Math.min(c.tMax, S.t));
      d.value = S.t;
      pintarExtra();
      pintar();
    };
    q('[data-d=t] input').addEventListener('input', (e) => { S.t = +e.target.value; pintar(); });
    cont.querySelectorAll('[data-rol=sensor] button').forEach((b) => b.addEventListener('click', () => ponerSensor(b.dataset.s)));
    ponerSensor(S.sensor);
    return { destruir() {}, ponerSensor };
  };

  // ------------------------------------------------------------
  // 2) PRESIÓN
  // ------------------------------------------------------------
  const CIUDADES = [['Nivel del mar', 0], ['Santa Cruz', 416], ['Cochabamba', 2558], ['Sucre', 2810], ['La Paz', 3640], ['Potosí', 4067]];
  const LIQUIDOS = [['Agua fría', 1000], ['Agua caliente (70 °C)', 978], ['Diésel', 840], ['Leche', 1030], ['Pulpa de mineral', 1400]];

  II.diagramas.presion = function (cont, opts = {}) {
    const id = uid();
    const A = { ciudad: 3, pabs: 250 };
    const B = { h: 5, liq: 0, cerrado: false, pgas: 50 };

    cont.innerHTML = `
      <div class="diagrama">
        <div class="controles">
          <div class="segmentado" data-rol="tab"><button data-t="a">Absoluta y manométrica</button><button data-t="b">Presión en un tanque</button></div>
        </div>
        <div data-tab="a">
          <div class="diag-2col rango-grid">
            <div class="lienzo"><svg viewBox="0 0 640 400" id="${id}-a" role="img" aria-label="Escala de presión absoluta y manómetro Bourdon"></svg></div>
            <div class="panel-info">
              <label class="campo"><span>¿Dónde está la planta?</span>
                <select class="entrada" data-a="ciudad">${CIUDADES.map((c, i) => `<option value="${i}">${c[0]} (${c[1]} m)</option>`).join('')}</select></label>
              <div class="deslizador" data-d="pabs"><label>Presión absoluta del proceso</label><output></output><input type="range" min="0" max="600" step="0.5"></div>
              <div class="controles" style="margin-bottom:12px">
                <button class="boton chico" data-p="aire">Aire libre</button>
                <button class="boton chico" data-p="olla">Olla a presión</button>
                <button class="boton chico" data-p="llanta">Llanta de auto</button>
                <button class="boton chico" data-p="vacio">Vacío parcial</button>
              </div>
              <dl data-rol="lectA" style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin:0;align-items:baseline"></dl>
            </div>
          </div>
        </div>
        <div data-tab="b">
          <div class="diag-2col rango-grid">
            <div class="lienzo"><svg viewBox="0 0 640 400" id="${id}-b" role="img" aria-label="Tanque con transmisor manométrico y diferencial"></svg></div>
            <div class="panel-info">
              <div class="deslizador" data-d="h"><label>Nivel del líquido</label><output></output><input type="range" min="0" max="10" step="0.1"></div>
              <label class="campo"><span>Líquido</span><select class="entrada" data-b="liq">${LIQUIDOS.map((l, i) => `<option value="${i}">${l[0]} · ${l[1]} kg/m³</option>`).join('')}</select></label>
              <label class="campo" style="margin-bottom:10px"><span>Tanque</span>
                <div class="segmentado" data-rol="cerrado"><button data-c="0">Abierto a la atmósfera</button><button data-c="1">Cerrado con gas a presión</button></div></label>
              <div class="deslizador" data-d="pgas"><label>Presión del gas (manométrica)</label><output></output><input type="range" min="0" max="200" step="1"></div>
              <dl data-rol="lectB" style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin:0;align-items:baseline"></dl>
            </div>
          </div>
        </div>
      </div>`;

    const q = (s) => cont.querySelector(s);
    const svgA = q('#' + id + '-a');
    const svgB = q('#' + id + '-b');

    // ----- pestaña A -----
    const yP = (p) => 360 - (Math.max(0, Math.min(600, p)) / 600) * 320;
    const pintarA = () => {
      const [nom, alt] = CIUDADES[A.ciudad];
      const pa = II.patm(alt);
      const pm = A.pabs - pa;
      const barM = pm / 100;
      q('[data-d=pabs] output').textContent = II.fmt(A.pabs, 1) + ' kPa abs';
      const vacio = pm < 0;
      const colM = vacio ? '#c0392b' : '#1b8a5a';
      // dial Bourdon: −1 a 5 bar, barrido de 270°
      const CX = 522, CY = 190, R = 100;
      const ang = (b) => ((225 - ((Math.max(-1.08, Math.min(5.08, b)) + 1) / 6) * 270) * Math.PI) / 180;
      const pto = (b, r) => [CX + r * Math.cos(ang(b)), CY - r * Math.sin(ang(b))];
      let marcas = '';
      for (let b = -1; b <= 5.001; b += 0.5) {
        const larga = Math.abs(b - Math.round(b)) < 0.01;
        const [x1, y1] = pto(b, R - 4), [x2, y2] = pto(b, R - (larga ? 18 : 11));
        marcas += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#2f3b4a" stroke-width="${larga ? 2.2 : 1.2}"/>`;
        if (larga) { const [xt, yt] = pto(b, R - 32); marcas += `<text x="${xt.toFixed(1)}" y="${(yt + 5).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" fill="#16202c">${Math.round(b)}</text>`; }
      }
      const [va1x, va1y] = pto(-1, R - 2), [va2x, va2y] = pto(0, R - 2);
      const [nx, ny] = pto(barM, R - 26);
      const fueraDial = barM > 5.05 || barM < -1.05;
      const halo = 'stroke="#fff" stroke-width="3.5" paint-order="stroke"';
      const yPr = yP(A.pabs), yAt = yP(pa), y0 = yP(0);
      const arriba = A.pabs >= pa;
      // etiquetas a la derecha de las líneas: la de arriba va sobre su línea y la de abajo, bajo la suya
      const yEtqPr = arriba ? yPr - 6 : yPr + 15;
      const yEtqAt = arriba ? yAt + 15 : yAt - 6;
      svgA.innerHTML = `
        ${flechaDef(id + '-fa')}
        ${[0, 100, 200, 300, 400, 500, 600].map((p) => `<line x1="96" x2="262" y1="${yP(p)}" y2="${yP(p)}" stroke="#eef1f5"/><line x1="90" x2="100" y1="${yP(p)}" y2="${yP(p)}" stroke="#8e99a6"/><text class="svg-texto" x="84" y="${yP(p) + 4}" text-anchor="end" font-size="11">${p}</text>`).join('')}
        <line x1="96" x2="96" y1="${yP(600)}" y2="${y0}" stroke="#8e99a6" stroke-width="2"/>
        <text class="svg-texto fuerte" x="20" y="24" font-size="12">kPa absolutos</text>
        <text class="svg-texto" x="100" y="${y0 + 22}" font-size="11">0 = vacío absoluto (no hay aire)</text>
        <rect x="97" y="${yAt}" width="165" height="${y0 - yAt}" fill="#e7f0fb" opacity=".55"/>
        <line x1="96" x2="262" y1="${yAt}" y2="${yAt}" stroke="#1d5fb4" stroke-width="2" stroke-dasharray="7 5"/>
        <text x="268" y="${yEtqAt}" font-size="11.5" font-weight="700" fill="#154a8c" ${halo}>Atmósfera: ${II.fmt(pa, 1)}</text>
        <line x1="96" x2="262" y1="${yPr}" y2="${yPr}" stroke="#16202c" stroke-width="2.5"/>
        <text x="268" y="${yEtqPr}" font-size="12" font-weight="700" fill="#16202c" ${halo}>Proceso: ${II.fmt(A.pabs, 1)}</text>
        ${y0 - yPr > 14 ? `<line x1="136" x2="136" y1="${y0}" y2="${yPr + 3}" stroke="#1d5fb4" stroke-width="3" marker-end="url(#${id}-fa-az)"/>` : ''}
        ${y0 - yPr > 34 ? `<text x="142" y="${(y0 + yPr) / 2 + 4}" font-size="12" font-weight="700" fill="#1d5fb4" ${halo}>absoluta</text>` : ''}
        ${Math.abs(yPr - yAt) > 14 ? `<line x1="214" x2="214" y1="${yAt}" y2="${yPr + (vacio ? -3 : 3)}" stroke="${colM}" stroke-width="3" marker-end="url(#${id}-fa-${vacio ? 'rj' : 'vd'})"/>` : ''}
        ${Math.abs(yPr - yAt) > 44 ? `<text x="220" y="${(yAt + yPr) / 2 + 4}" font-size="12" font-weight="700" fill="${colM}" ${halo}>${vacio ? 'vacío' : 'manométrica'}</text>` : ''}
        <circle cx="${CX}" cy="${CY}" r="${R + 10}" fill="#f0f3f7" stroke="#5d6a7a" stroke-width="3"/>
        <circle cx="${CX}" cy="${CY}" r="${R}" fill="#fff" stroke="#cbd3dd"/>
        <path d="M${va1x.toFixed(1)},${va1y.toFixed(1)} A${R - 2},${R - 2} 0 0 1 ${va2x.toFixed(1)},${va2y.toFixed(1)}" stroke="#f2c2bb" stroke-width="7" fill="none"/>
        ${marcas}
        <text x="${CX}" y="${CY + 38}" text-anchor="middle" font-size="13" font-weight="700" fill="#465366">bar</text>
        <text x="${CX}" y="${CY + 54}" text-anchor="middle" font-size="10.5" fill="#7a8596">manométrica</text>
        <line x1="${CX}" y1="${CY}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#c0392b" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="${CX}" cy="${CY}" r="8" fill="#2f3b4a"/>
        ${lectura(CX, CY + R + 34, (barM < -0.0005 ? '−' : '') + II.fmt(Math.abs(barM), 2) + ' bar', 110, colM)}
        <text x="${CX}" y="${CY + R + 64}" text-anchor="middle" font-size="11" fill="#7a8596">${fueraDial ? 'Fuera de escala del manómetro' : 'Manómetro Bourdon'}</text>
        <text x="${CX}" y="${CY + R + 79}" text-anchor="middle" font-size="11" fill="#7a8596">${fueraDial ? '' : 'mide respecto a la atmósfera'}</text>`;
      const tb = II.ebullicion(A.pabs);
      q('[data-rol=lectA]').innerHTML = `
        <dt class="nota">Absoluta</dt><dd><b>${II.fmt(A.pabs, 1)} kPa</b> = ${II.fmt(A.pabs / 100, 3)} bar abs</dd>
        <dt class="nota">Atmosférica</dt><dd>${II.fmt(pa, 1)} kPa <span class="nota">(${II.esc(nom)})</span></dd>
        <dt class="nota">Manométrica</dt><dd><b style="color:${colM}">${II.fmt(pm, 1)} kPa</b> = <b>${II.fmt(barM, 3)} bar</b></dd>
        <dt class="nota">…en otras unidades</dt><dd>${II.fmt(pm / 6.89476, 2)} psi · ${II.fmt(pm / 98.0665, 3)} kg/cm² · ${II.fmt(pm / 9.80665, 2)} m.c.a.</dd>
        <dt class="nota">El agua hierve a</dt><dd><b>${isFinite(tb) && A.pabs >= 1 ? II.fmt(tb, 1) + ' °C' : '—'}</b> <span class="nota">a esta presión absoluta</span></dd>`;
      q('[data-a=ciudad]').value = A.ciudad;
      q('[data-d=pabs] input').value = A.pabs;
    };
    q('[data-a=ciudad]').addEventListener('change', (e) => { A.ciudad = +e.target.value; pintarA(); });
    q('[data-d=pabs] input').addEventListener('input', (e) => { A.pabs = +e.target.value; pintarA(); });
    cont.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
      const pa = II.patm(CIUDADES[A.ciudad][1]);
      const man = { aire: 0, olla: 100, llanta: 220, vacio: null }[b.dataset.p];
      A.pabs = man == null ? 25 : pa + man;
      pintarA();
    }));

    // ----- pestaña B -----
    const pintarB = () => {
      const [nomL, rho] = LIQUIDOS[B.liq];
      const phid = (rho * 9.81 * B.h) / 1000;
      const pgas = B.cerrado ? B.pgas : 0;
      const pfondo = pgas + phid;
      const hCalc = (pfondo * 1000) / (rho * 9.81);
      q('[data-d=h] output').textContent = II.fmt(B.h, 1) + ' m';
      q('[data-d=pgas] output').textContent = B.cerrado ? B.pgas + ' kPa' : '—';
      q('[data-d=pgas] input').disabled = !B.cerrado;
      q('[data-d=pgas]').style.opacity = B.cerrado ? 1 : 0.45;
      cont.querySelectorAll('[data-rol=cerrado] button').forEach((b) => b.classList.toggle('activo', (b.dataset.c === '1') === B.cerrado));
      const TX0 = 230, TX1 = 410, TY0 = 50, TY1 = 350;
      const yl = TY1 - (B.h / 10) * (TY1 - TY0);
      const colLiq = rho >= 1300 ? '#d9c9b0' : rho <= 900 ? '#f3e2a6' : '#d3e8fa';
      const errNivel = Math.abs(hCalc - B.h) > 0.05;
      svgB.innerHTML = `
        ${flechaDef(id + '-fb')}
        ${[0, 2, 4, 6, 8, 10].map((m) => { const y = TY1 - (m / 10) * (TY1 - TY0); return `<line x1="200" x2="212" y1="${y}" y2="${y}" stroke="#8e99a6"/><text class="svg-texto" x="194" y="${y + 4}" text-anchor="end" font-size="11">${m} m</text>`; }).join('')}
        <line x1="212" x2="212" y1="${TY0}" y2="${TY1}" stroke="#8e99a6"/>
        <rect x="${TX0}" y="${yl}" width="${TX1 - TX0}" height="${TY1 - yl}" fill="${colLiq}"/>
        <line x1="${TX0}" x2="${TX1}" y1="${yl}" y2="${yl}" stroke="#4a9be0" stroke-width="2"/>
        <path d="M${TX0},${TY0} V${TY1} H${TX1} V${TY0}" fill="none" stroke="#5d6a7a" stroke-width="3"/>
        ${B.cerrado
          ? `<line x1="${TX0 - 2}" x2="${TX1 + 2}" y1="${TY0}" y2="${TY0}" stroke="#5d6a7a" stroke-width="3"/>
             <text x="${(TX0 + TX1) / 2}" y="${Math.min(yl - 12, TY0 + 30)}" text-anchor="middle" font-size="12.5" font-weight="700" fill="#b7791f">Gas a ${B.pgas} kPa</text>`
          : `<text x="${(TX0 + TX1) / 2}" y="${TY0 - 10}" text-anchor="middle" font-size="12" fill="#7a8596">abierto a la atmósfera</text>`}
        ${B.h > 0.3 ? `<line x1="${(TX0 + TX1) / 2}" x2="${(TX0 + TX1) / 2}" y1="${yl + 4}" y2="${TY1 - 6}" stroke="#154a8c" stroke-width="1.5" marker-start="url(#${id}-fb-os)" marker-end="url(#${id}-fb-os)"/>
        <text x="${(TX0 + TX1) / 2 + 8}" y="${(yl + TY1) / 2 + 4}" font-size="13" font-weight="700" fill="#154a8c">h = ${II.fmt(B.h, 1)} m</text>` : ''}
        <path d="M${TX0},335 H110 V300" stroke="#5d6a7a" stroke-width="2" fill="none"/>
        <circle cx="110" cy="278" r="22" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
        <text x="110" y="283" text-anchor="middle" font-family="var(--mono)" font-size="12" font-weight="700">PT</text>
        ${lectura(110, 236, II.fmt(pfondo, 1) + ' kPa', 96)}
        <text x="110" y="212" text-anchor="middle" font-size="11" fill="#7a8596">manométrico</text>
        <path d="M${TX1},335 H500 V300" stroke="#5d6a7a" stroke-width="2" fill="none"/>
        <text x="${TX1 + 10}" y="330" font-size="11" font-weight="700" fill="#465366">H</text>
        ${B.cerrado
          ? `<path d="M${TX1},${TY0 + 12} H540 V300" stroke="#5d6a7a" stroke-width="2" fill="none" stroke-dasharray="6 4"/><text x="${TX1 + 10}" y="${TY0 + 8}" font-size="11" font-weight="700" fill="#465366">L</text>`
          : `<path d="M540,300 V250" stroke="#5d6a7a" stroke-width="2" fill="none"/><text x="546" y="248" font-size="11" fill="#7a8596">L: al aire</text>`}
        <circle cx="520" cy="300" r="24" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
        <text x="520" y="305" text-anchor="middle" font-family="var(--mono)" font-size="12" font-weight="700">DP</text>
        ${lectura(520, 360, II.fmt(phid, 1) + ' kPa', 96)}
        <text x="520" y="388" text-anchor="middle" font-size="11" fill="#7a8596">diferencial (H − L)</text>
        <text class="svg-texto fuerte" x="20" y="30" font-size="13">P = ρ · g · h</text>
        <text class="svg-texto" x="20" y="48" font-size="11">g = 9,81 m/s²</text>`;
      q('[data-rol=lectB]').innerHTML = `
        <dt class="nota">Presión por el líquido</dt><dd><b>${II.fmt(phid, 2)} kPa</b> <span class="nota">= ${rho} × 9,81 × ${II.fmt(B.h, 1)} ÷ 1000</span></dd>
        <dt class="nota">Presión en el fondo</dt><dd><b>${II.fmt(pfondo, 2)} kPa</b> ${B.cerrado ? `<span class="nota">(gas ${B.pgas} + líquido ${II.fmt(phid, 1)})</span>` : '<span class="nota">(manométrica)</span>'}</dd>
        <dt class="nota">Nivel según el PT</dt><dd><b style="color:${errNivel ? 'var(--mal)' : 'var(--ok)'}">${II.fmt(hCalc, 2)} m</b> ${errNivel ? '<span class="chip mal">incorrecto</span>' : '<span class="chip ok">correcto</span>'}</dd>
        <dt class="nota">Nivel según el DP</dt><dd><b style="color:var(--ok)">${II.fmt(B.h, 2)} m</b> <span class="chip ok">correcto</span></dd>
        <dt class="nota">Líquido</dt><dd>${II.esc(nomL)} · ρ = ${rho} kg/m³</dd>`;
      q('[data-d=h] input').value = B.h;
      q('[data-d=pgas] input').value = B.pgas;
    };
    q('[data-d=h] input').addEventListener('input', (e) => { B.h = +e.target.value; pintarB(); });
    q('[data-d=pgas] input').addEventListener('input', (e) => { B.pgas = +e.target.value; pintarB(); });
    q('[data-b=liq]').addEventListener('change', (e) => { B.liq = +e.target.value; pintarB(); });
    cont.querySelectorAll('[data-rol=cerrado] button').forEach((b) => b.addEventListener('click', () => { B.cerrado = b.dataset.c === '1'; pintarB(); }));

    const pestana = (t) => {
      cont.querySelectorAll('[data-rol=tab] button').forEach((b) => b.classList.toggle('activo', b.dataset.t === t));
      cont.querySelectorAll('[data-tab]').forEach((d) => d.classList.toggle('oculto', d.dataset.tab !== t));
    };
    cont.querySelectorAll('[data-rol=tab] button').forEach((b) => b.addEventListener('click', () => pestana(b.dataset.t)));
    pintarA();
    pintarB();
    pestana(opts.pestana || 'a');
    return { destruir() {}, pestana };
  };
})();
