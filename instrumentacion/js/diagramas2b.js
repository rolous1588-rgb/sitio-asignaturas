// ============================================================
// Diagramas interactivos — Sesión 2 (parte B: temperatura)
//   II.diagramas.principioT → principio físico: RTD, termopar, termistor
//   II.diagramas.hilos      → Pt100 a 2/3/4 hilos + cable de compensación
//   II.diagramas.plantaT    → así se ve en planta + cómo elegir
// Cada uno devuelve { destruir() }.
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  II.diagramas = II.diagramas || {};
  let contador = 0;
  const uid = () => 's2b' + ++contador;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const halo = 'stroke="#fff" stroke-width="3.5" paint-order="stroke"';

  // ---------- utilidades compartidas (también las usa diagramas2c.js) ----------
  const S2 = (II.s2 = II.s2 || {});
  S2.interp = (xs, ys, x) => {
    if (x <= xs[0]) return ys[0] + ((x - xs[0]) * (ys[1] - ys[0])) / (xs[1] - xs[0]);
    for (let i = 1; i < xs.length; i++) if (x <= xs[i]) return ys[i - 1] + ((x - xs[i - 1]) * (ys[i] - ys[i - 1])) / (xs[i] - xs[i - 1]);
    const n = xs.length - 1;
    return ys[n] + ((x - xs[n]) * (ys[n] - ys[n - 1])) / (xs[n] - xs[n - 1]);
  };
  S2.invertir = (f, y, a, b) => { for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (f(m) < y) a = m; else b = m; } return (a + b) / 2; };
  S2.pt100 = (t) => { const A = 3.9083e-3, B = -5.775e-7, C = -4.183e-12; return 100 * (1 + A * t + B * t * t + (t < 0 ? C * (t - 100) * t * t * t : 0)); };
  S2.pestanas = (cont, alCambiar) => {
    const ir = (t) => {
      cont.querySelectorAll(':scope > .diagrama > .controles [data-rol=tab] button').forEach((b) => b.classList.toggle('activo', b.dataset.t === t));
      cont.querySelectorAll(':scope > .diagrama > [data-tab]').forEach((d) => d.classList.toggle('oculto', d.dataset.tab !== t));
      if (alCambiar) alCambiar(t);
    };
    cont.querySelectorAll(':scope > .diagrama > .controles [data-rol=tab] button').forEach((b) => b.addEventListener('click', () => ir(b.dataset.t)));
    return ir;
  };
  S2.segmentado = (raiz, rol, alElegir) => {
    raiz.querySelectorAll(`[data-rol=${rol}] button`).forEach((b) => b.addEventListener('click', () => alElegir(b.dataset.v)));
    return (v) => raiz.querySelectorAll(`[data-rol=${rol}] button`).forEach((b) => b.classList.toggle('activo', b.dataset.v === String(v)));
  };
  S2.deslizador = (raiz, clave, alMover) => {
    const i = raiz.querySelector(`[data-d=${clave}] input`);
    i.addEventListener('input', () => alMover(+i.value));
    return { poner: (v) => { i.value = v; }, salida: (t) => { raiz.querySelector(`[data-d=${clave}] output`).textContent = t; } };
  };
  S2.ficha = (pares) => `<dl style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin:0;align-items:baseline">${pares.map(([k, v]) => `<dt class="nota">${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
  S2.marcadores = (id) => `<defs>${[['az', '#1d5fb4'], ['nj', '#e0782b'], ['rj', '#c0392b'], ['gr', '#465366'], ['vd', '#1b8a5a']].map(([k, c]) => `<marker id="${id}-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join('')}</defs>`;
  S2.panelPartes = (cont, svg, datos, alSeleccionar) => {
    const info = cont.querySelector('[data-rol=info]');
    const vistos = new Set();
    const mostrar = (k) => {
      const d = datos[k];
      if (!d) return;
      vistos.add(k);
      svg.querySelectorAll('.clic').forEach((g) => { g.classList.toggle('sel', g.dataset.id === k); g.classList.toggle('visto', vistos.has(g.dataset.id)); });
      info.innerHTML = `<span class="etiqueta">${II.esc(d.tipo || 'Parte')} · ${vistos.size}/${Object.keys(datos).length} vistas</span><h4>${II.esc(d.t)}</h4>
        <dl>${d.que ? `<dt>Qué es</dt><dd>${d.que}</dd>` : ''}${d.para ? `<dt>Para qué sirve</dt><dd>${d.para}</dd>` : ''}${d.dato ? `<dt>Norma / dato típico</dt><dd>${d.dato}</dd>` : ''}${d.falla ? `<dt>Falla típica</dt><dd>${d.falla}</dd>` : ''}</dl>`;
      if (alSeleccionar) alSeleccionar(k);
    };
    svg.querySelectorAll('.clic').forEach((g) => g.addEventListener('click', () => mostrar(g.dataset.id)));
    return mostrar;
  };

  // ------------------------------------------------------------
  // Datos: RTD, termopares (NIST ITS-90, unión fría a 0 °C), termistores
  // ------------------------------------------------------------
  const METALES = {
    pt: { nombre: 'Platino (Pt100)', color: '#aab3bf', f: S2.pt100, rango: [-200, 850], vis: [-50, 400], alfa: '0,00385 /°C',
      uso: 'Es el estándar industrial: estable, no se oxida, casi lineal y con un rango amplio. Por eso casi todas las RTD son de platino.', norma: 'IEC 60751 (clases AA, A, B y C)' },
    ni: { nombre: 'Níquel (Ni100)', color: '#8fb08a', f: (t) => 100 * (1 + 5.485e-3 * t + 6.65e-6 * t * t), rango: [-60, 180], vis: [-50, 180], alfa: '0,00618 /°C',
      uso: 'Más sensible que el platino, pero menos lineal y de rango corto. Se usa en climatización (HVAC) y equipos.', norma: 'DIN 43760' },
    cu: { nombre: 'Cobre (Cu100)', color: '#c98a4b', f: (t) => 100 * (1 + 0.00427 * t), rango: [-50, 150], vis: [-50, 150], alfa: '0,00427 /°C',
      uso: 'Muy lineal y barato, pero se oxida con el calor y su resistividad es baja. Se usa para vigilar bobinados de motores y transformadores.', norma: '—' }
  };

  const T50 = (desde, hasta) => { const a = []; for (let t = desde; t <= hasta; t += 50) a.push(t); return a; };
  const TERMOPARES = {
    J: { mas: 'Hierro (Fe)', menos: 'Constantán (Cu-Ni)', min: -40, max: 750, T: [-50, ...T50(0, 750)],
      E: [-2.431, 0, 2.585, 5.269, 8.01, 10.779, 13.555, 16.327, 19.09, 21.848, 24.61, 27.393, 30.216, 33.102, 36.071, 39.132, 42.281],
      col: '#222222', ansi: 'blanco (+) / rojo (−)', iec: 'negro (+) / blanco (−)', uso: 'Plásticos (inyectoras y extrusoras) y atmósferas sin oxígeno. El hierro se oxida arriba de ≈ 550 °C.' },
    K: { mas: 'Cromel (Ni-Cr)', menos: 'Alumel (Ni-Al)', min: -200, max: 1260, T: [-50, ...T50(0, 1250)],
      E: [-1.889, 0, 2.023, 4.096, 6.138, 8.138, 10.153, 12.209, 14.293, 16.397, 18.516, 20.644, 22.776, 24.905, 27.025, 29.129, 31.213, 33.275, 35.313, 37.326, 39.314, 41.276, 43.211, 45.119, 46.995, 48.838, 50.644],
      col: '#2e8b57', ansi: 'amarillo (+) / rojo (−)', iec: 'verde (+) / blanco (−)', uso: 'El más usado: hornos, calderas, gases de escape y procesos en general.' },
    T: { mas: 'Cobre (Cu)', menos: 'Constantán (Cu-Ni)', min: -200, max: 350, T: [-50, ...T50(0, 350)],
      E: [-1.819, 0, 2.036, 4.279, 6.704, 9.288, 12.013, 14.862, 17.819],
      col: '#8b5a2b', ansi: 'azul (+) / rojo (−)', iec: 'marrón (+) / blanco (−)', uso: 'Bajas temperaturas: alimentos, cámaras de frío, criogenia. Muy estable.' },
    E: { mas: 'Cromel (Ni-Cr)', menos: 'Constantán (Cu-Ni)', min: -200, max: 900, T: [-50, ...T50(0, 900)],
      E: [-2.787, 0, 3.048, 6.319, 9.789, 13.421, 17.181, 21.036, 24.964, 28.946, 32.965, 37.005, 41.053, 45.093, 49.116, 53.112, 57.08, 61.017, 64.922, 68.787],
      col: '#7b3fa0', ansi: 'violeta (+) / rojo (−)', iec: 'violeta (+) / blanco (−)', uso: 'La mayor sensibilidad (≈ 68 µV/°C): útil para diferencias pequeñas de temperatura.' },
    N: { mas: 'Nicrosil (Ni-Cr-Si)', menos: 'Nisil (Ni-Si)', min: -200, max: 1300, T: [-50, ...T50(0, 1300)],
      E: [-1.269, 0, 1.34, 2.774, 4.302, 5.913, 7.597, 9.341, 11.136, 12.974, 14.846, 16.748, 18.672, 20.613, 22.566, 24.527, 26.491, 28.455, 30.416, 32.371, 34.319, 36.256, 38.179, 40.087, 41.976, 43.846, 45.694, 47.513],
      col: '#d9679b', ansi: 'naranja (+) / rojo (−)', iec: 'rosado (+) / blanco (−)', uso: 'Versión mejorada del K: más estable a alta temperatura (menos deriva con el tiempo).' },
    R: { mas: 'Platino + 13 % rodio', menos: 'Platino', min: 0, max: 1600, T: T50(0, 1600),
      E: [0, 0.296, 0.647, 1.041, 1.469, 1.923, 2.401, 2.896, 3.408, 3.933, 4.471, 5.021, 5.583, 6.157, 6.743, 7.34, 7.95, 8.571, 9.205, 9.85, 10.506, 11.173, 11.85, 12.535, 13.228, 13.926, 14.629, 15.334, 16.04, 16.746, 17.451, 18.152, 18.849],
      col: '#e8870e', ansi: 'negro (+) / rojo (−)', iec: 'naranja (+) / blanco (−)', uso: 'Alta temperatura con buena exactitud: vidrio, siderurgia, laboratorios. Es caro (platino).' },
    S: { mas: 'Platino + 10 % rodio', menos: 'Platino', min: 0, max: 1600, T: T50(0, 1600),
      E: [0, 0.299, 0.646, 1.029, 1.441, 1.874, 2.323, 2.786, 3.259, 3.742, 4.233, 4.732, 5.239, 5.753, 6.275, 6.806, 7.345, 7.893, 8.449, 9.014, 9.587, 10.168, 10.757, 11.351, 11.951, 12.554, 13.159, 13.766, 14.373, 14.978, 15.582, 16.182, 16.777],
      col: '#e8870e', ansi: 'negro (+) / rojo (−)', iec: 'naranja (+) / blanco (−)', uso: 'Patrón de calibración en alta temperatura; hornos de vidrio y cerámica.' },
    B: { mas: 'Platino + 30 % rodio', menos: 'Platino + 6 % rodio', min: 600, max: 1700, T: T50(0, 1800),
      E: [0, 0.002, 0.033, 0.092, 0.178, 0.291, 0.431, 0.596, 0.787, 1.002, 1.242, 1.505, 1.792, 2.101, 2.431, 2.782, 3.154, 3.546, 3.957, 4.387, 4.834, 5.299, 5.78, 6.276, 6.786, 7.311, 7.848, 8.397, 8.956, 9.524, 10.099, 10.679, 11.263, 11.848, 12.433, 13.014, 13.591],
      col: '#8a8f98', ansi: 'gris (+) / rojo (−)', iec: 'gris (+) / blanco (−)', uso: 'Muy alta temperatura (vidrio, cerámica). Casi no da señal bajo 50 °C: por eso ni necesita compensación de unión fría.' }
  };
  const tcE = (tipo, t) => { const d = TERMOPARES[tipo]; return S2.interp(d.T, d.E, t); };
  const tcT = (tipo, e) => { const d = TERMOPARES[tipo]; return S2.interp(d.E, d.T, e); };
  S2.tcE = tcE; S2.tcT = tcT; S2.TERMOPARES = TERMOPARES;
  const ntcR = (t, beta = 3950) => 10000 * Math.exp(beta * (1 / (t + 273.15) - 1 / 298.15));
  const ptcR = (t) => 100 * Math.pow(10, 4 / (1 + Math.exp(-(t - 120) / 4)));

  // ------------------------------------------------------------
  // 1) PRINCIPIO FÍSICO · TEMPERATURA
  // ------------------------------------------------------------
  II.diagramas.principioT = function (cont, opts = {}) {
    const id = uid();
    const S = { tab: opts.pestana && ['rtd', 'tc', 'ntc'].includes(opts.pestana) ? opts.pestana : 'rtd', metal: 'pt', tR: 72, tipo: 'K', th: 400, tf: 25, clase: 'ntc', tN: 25 };
    const dl = 'style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin:0;align-items:baseline"';
    cont.innerHTML = `
      <div class="diagrama">
        <div class="controles"><div class="segmentado" data-rol="tab"><button data-t="rtd">RTD: metal que cambia su resistencia</button><button data-t="tc">Termopar: dos metales distintos</button><button data-t="ntc">Termistor: semiconductor</button></div></div>
        <div data-tab="rtd"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 640 420" id="${id}-r" role="img" aria-label="Átomos del metal y curva de resistencia"></svg></div>
          <div class="panel-info">
            <label class="campo" style="margin-bottom:10px"><span>Metal del hilo</span>
              <div class="segmentado" data-rol="metal"><button data-v="pt">Platino</button><button data-v="ni">Níquel</button><button data-v="cu">Cobre</button></div></label>
            <div class="deslizador" data-d="tR"><label>Temperatura del hilo</label><output></output><input type="range" min="-50" max="400" step="1"></div>
            <div data-rol="lr"></div>
          </div></div></div>
        <div data-tab="tc"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 640 430" id="${id}-t" role="img" aria-label="Termopar con unión caliente, unión fría y voltímetro"></svg></div>
          <div class="panel-info">
            <label class="campo" style="margin-bottom:10px"><span>Tipo de termopar (par de metales)</span>
              <div class="segmentado" data-rol="tipo">${Object.keys(TERMOPARES).map((k) => `<button data-v="${k}">${k}</button>`).join('')}</div></label>
            <div class="deslizador" data-d="th"><label>Unión caliente (en el proceso)</label><output></output><input type="range" min="0" max="1700" step="5"></div>
            <div class="deslizador" data-d="tf"><label>Unión fría (bornera)</label><output></output><input type="range" min="0" max="60" step="1"></div>
            <div data-rol="lt"></div>
          </div></div></div>
        <div data-tab="ntc"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 640 420" id="${id}-n" role="img" aria-label="Portadores de carga en el semiconductor y curva del termistor"></svg></div>
          <div class="panel-info">
            <label class="campo" style="margin-bottom:10px"><span>Tipo de termistor</span>
              <div class="segmentado" data-rol="clase"><button data-v="ntc">NTC (baja con el calor)</button><button data-v="ptc">PTC (sube de golpe)</button></div></label>
            <div class="deslizador" data-d="tN"><label>Temperatura</label><output></output><input type="range" min="-40" max="150" step="1"></div>
            <div data-rol="ln"></div>
          </div></div></div>
      </div>`;
    const q = (s) => cont.querySelector(s);
    const svgR = q('#' + id + '-r'), svgT = q('#' + id + '-t'), svgN = q('#' + id + '-n');

    // ---------- RTD ----------
    const ATX = [], ATY = [];
    for (let i = 0; i < 11; i++) ATX.push(62 + i * 52);
    for (let j = 0; j < 4; j++) ATY.push(66 + j * 34);
    const electrones = Array.from({ length: 16 }, (_, i) => ({ x: 40 + ((i * 37) % 560), y: 66 + 17 + ((i * 53) % 3) * 34, f: Math.random() * 6 }));
    const RX0 = 70, RX1 = 610, RY0 = 236, RY1 = 392;
    const pintarRTD = () => {
      const m = METALES[S.metal];
      const [a, b] = m.vis;
      const sx = (t) => RX0 + ((t + 50) / 450) * (RX1 - RX0);
      const sy = (r) => RY1 - ((clamp(r, 60, 260) - 60) / 200) * (RY1 - RY0);
      const curva = (k) => { const mm = METALES[k]; const p = []; for (let t = mm.vis[0]; t <= mm.vis[1]; t += 5) p.push(sx(t).toFixed(1) + ',' + sy(mm.f(t)).toFixed(1)); return p.join(' '); };
      const R = m.f(S.tR);
      const dentro = S.tR >= m.rango[0] && S.tR <= m.rango[1];
      svgR.innerHTML = `
        <text class="svg-texto fuerte" x="20" y="20" font-size="12">Vista microscópica del hilo de ${II.esc(m.nombre.split(' ')[0].toLowerCase())}</text>
        <rect x="20" y="30" width="600" height="160" rx="10" fill="#fbfcfe" stroke="#cbd3dd"/>
        <g id="${id}-at"></g><g id="${id}-el"></g>
        <text x="320" y="210" text-anchor="middle" font-size="12" fill="#465366">Más temperatura → los átomos vibran más → los electrones (azul) chocan más → <tspan font-weight="700">más resistencia</tspan></text>
        ${[100, 150, 200, 250].map((r) => `<line x1="${RX0}" x2="${RX1}" y1="${sy(r)}" y2="${sy(r)}" stroke="#eef1f5"/><text class="svg-texto" x="${RX0 - 6}" y="${sy(r) + 4}" text-anchor="end" font-size="10.5">${r} Ω</text>`).join('')}
        ${[0, 100, 200, 300, 400].map((t) => `<text class="svg-texto" x="${sx(t)}" y="${RY1 + 16}" text-anchor="middle" font-size="10.5">${t} °C</text>`).join('')}
        <line x1="${RX0}" x2="${RX1}" y1="${RY1}" y2="${RY1}" stroke="#8e99a6"/>
        ${Object.keys(METALES).filter((k) => k !== S.metal).map((k) => `<polyline points="${curva(k)}" fill="none" stroke="${METALES[k].color}" stroke-width="2" opacity=".55"/><text x="${sx(METALES[k].vis[1]) - 4}" y="${sy(METALES[k].f(METALES[k].vis[1])) - 6}" text-anchor="end" font-size="10.5" fill="#7a8596">${METALES[k].nombre.split(' ')[0]}</text>`).join('')}
        <polyline points="${curva(S.metal)}" fill="none" stroke="#1d5fb4" stroke-width="3.2"/>
        ${S.tR <= b && S.tR >= a ? `<circle cx="${sx(S.tR)}" cy="${sy(R)}" r="6.5" fill="#1d5fb4" stroke="#fff" stroke-width="2"/>
          <text x="${sx(S.tR) + (S.tR > 280 ? -10 : 10)}" y="${sy(R) - 9}" text-anchor="${S.tR > 280 ? 'end' : 'start'}" font-size="12" font-weight="700" fill="#154a8c" ${halo}>${II.fmt(R, 1)} Ω</text>` : ''}`;
      const sens = (m.f(S.tR + 0.5) - m.f(S.tR - 0.5));
      q('[data-rol=lr]').innerHTML = `<dl ${dl}>
        <dt class="nota">Resistencia</dt><dd><b style="font-size:1.1rem">${II.fmt(R, 2)} Ω</b> ${dentro ? '' : '<span class="chip mal">fuera de su rango</span>'}</dd>
        <dt class="nota">A 0 °C</dt><dd>100 Ω (por eso se llama "…100")</dd>
        <dt class="nota">Sensibilidad</dt><dd><b>${II.fmt(sens, 3)} Ω por °C</b> <span class="nota">(α ≈ ${m.alfa})</span></dd>
        <dt class="nota">Rango de uso</dt><dd>${m.rango[0]} a ${m.rango[1]} °C</dd>
        <dt class="nota">¿Dónde se usa?</dt><dd>${m.uso}</dd>
        <dt class="nota">Norma</dt><dd>${m.norma}</dd></dl>`;
      q('[data-d=tR] output').textContent = S.tR + ' °C';
    };
    const animarRTD = (t) => {
      const m = METALES[S.metal];
      const amp = 1 + 7 * clamp((S.tR + 60) / 460, 0, 1);
      const R = m.f(S.tR);
      let at = '';
      ATY.forEach((y, j) => ATX.forEach((x, i) => {
        const dx = amp * Math.sin(t * 9 + i * 1.7 + j * 2.3), dy = amp * Math.cos(t * 11 + i * 2.9 + j * 1.1);
        at += `<circle cx="${(x + dx).toFixed(1)}" cy="${(y + dy).toFixed(1)}" r="11" fill="${m.color}" stroke="#6b7684" stroke-width="1"/>`;
      }));
      const v = 90 * (100 / R);
      let el = '';
      electrones.forEach((e) => {
        e.x += v / 60; if (e.x > 612) e.x = 28;
        const yy = e.y + 6 * Math.sin(t * 6 + e.f) * (amp / 4);
        el += `<circle cx="${e.x.toFixed(1)}" cy="${yy.toFixed(1)}" r="4" fill="#1d5fb4"/>`;
      });
      const g1 = svgR.querySelector('#' + id + '-at'), g2 = svgR.querySelector('#' + id + '-el');
      if (g1) g1.innerHTML = at; if (g2) g2.innerHTML = el;
    };

    // ---------- TERMOPAR ----------
    const TX0 = 70, TX1 = 610, TY0 = 250, TY1 = 404;
    const pintarTC = () => {
      const d = TERMOPARES[S.tipo];
      S.th = clamp(S.th, 0, d.max);
      const eh = tcE(S.tipo, S.th), ef = tcE(S.tipo, S.tf), e = eh - ef;
      const sens = (tcE(S.tipo, S.th + 1) - tcE(S.tipo, S.th - 1)) / 2 * 1000;
      const sx = (t) => TX0 + (t / 1800) * (TX1 - TX0);
      const sy = (v) => TY1 - ((clamp(v, -4, 70) + 4) / 74) * (TY1 - TY0);
      const calor = clamp(S.th / 1400, 0, 1);
      const cCal = `rgb(${255},${Math.round(243 - 120 * calor)},${Math.round(224 - 200 * calor)})`;
      const curva = (k) => TERMOPARES[k].T.filter((t) => t >= 0).map((t) => sx(t).toFixed(1) + ',' + sy(tcE(k, t)).toFixed(1)).join(' ');
      svgT.innerHTML = `
        <rect x="16" y="40" width="150" height="150" rx="12" fill="${cCal}" stroke="#e0782b" stroke-width="${1 + 2 * calor}"/>
        <text x="91" y="60" text-anchor="middle" font-size="12" font-weight="700" fill="#8a3f0a">Proceso</text>
        <text x="91" y="178" text-anchor="middle" font-size="13" font-weight="700" fill="#8a3f0a">${S.th} °C</text>
        <line x1="130" y1="115" x2="440" y2="80" stroke="${d.col}" stroke-width="7" stroke-linecap="round"/>
        <line x1="130" y1="115" x2="440" y2="150" stroke="#9aa3ad" stroke-width="9" stroke-linecap="round"/>
        <line x1="130" y1="115" x2="440" y2="150" stroke="#fafafa" stroke-width="5.5" stroke-linecap="round"/>
        <circle cx="130" cy="115" r="9" fill="#c0392b" stroke="#fff" stroke-width="2"/>
        <text x="122" y="100" text-anchor="end" font-size="11" font-weight="700" fill="#8a3f0a" ${halo}>unión caliente</text>
        <text x="285" y="78" text-anchor="middle" font-size="12" font-weight="700" fill="#16202c" ${halo}>(+) ${II.esc(d.mas)}</text>
        <text x="285" y="164" text-anchor="middle" font-size="12" font-weight="700" fill="#16202c" ${halo}>(−) ${II.esc(d.menos)}</text>
        <rect x="440" y="58" width="70" height="114" rx="8" fill="#e7f0fb" stroke="#1d5fb4"/>
        <text x="475" y="52" text-anchor="middle" font-size="11" font-weight="700" fill="#154a8c">unión fría</text>
        <text x="475" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="#154a8c">${S.tf} °C</text>
        <circle cx="448" cy="80" r="4" fill="#154a8c"/><circle cx="448" cy="150" r="4" fill="#154a8c"/>
        <path d="M510,80 H560 V92" stroke="#b87333" stroke-width="3" fill="none"/><path d="M510,150 H560 V138" stroke="#b87333" stroke-width="3" fill="none"/>
        <circle cx="570" cy="115" r="26" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
        <text x="570" y="112" text-anchor="middle" font-family="var(--mono)" font-size="12" font-weight="700" fill="#154a8c">${II.fmt(e, 3)}</text>
        <text x="570" y="127" text-anchor="middle" font-size="10" fill="#465366">mV</text>
        <text x="320" y="210" text-anchor="middle" font-size="11.5" fill="#465366">Cada metal "empuja" electrones del lado caliente al frío con distinta fuerza.</text>
        <text x="320" y="226" text-anchor="middle" font-size="11.5" fill="#465366">La <tspan font-weight="700">diferencia</tspan> entre los dos es la tensión: <tspan font-weight="700">E = f(T caliente) − f(T fría)</tspan></text>
        ${[0, 20, 40, 60].map((v) => `<line x1="${TX0}" x2="${TX1}" y1="${sy(v)}" y2="${sy(v)}" stroke="#eef1f5"/><text class="svg-texto" x="${TX0 - 6}" y="${sy(v) + 4}" text-anchor="end" font-size="10.5">${v} mV</text>`).join('')}
        ${[0, 400, 800, 1200, 1600].map((t) => `<text class="svg-texto" x="${sx(t)}" y="${TY1 + 16}" text-anchor="middle" font-size="10.5">${t} °C</text>`).join('')}
        <line x1="${TX0}" x2="${TX1}" y1="${sy(0)}" y2="${sy(0)}" stroke="#8e99a6"/>
        ${Object.keys(TERMOPARES).filter((k) => k !== S.tipo).map((k) => { const tt = TERMOPARES[k].T; const tl = Math.min(tt[tt.length - 1], TERMOPARES[k].max); return `<polyline points="${curva(k)}" fill="none" stroke="#c3cad3" stroke-width="1.6"/><text x="${sx(tl) + 3}" y="${sy(tcE(k, tl)) + 4}" font-size="10" fill="#8e99a6">${k}</text>`; }).join('')}
        <polyline points="${curva(S.tipo)}" fill="none" stroke="${d.col === '#222222' ? '#1d5fb4' : d.col}" stroke-width="3.4"/>
        <circle cx="${sx(S.th)}" cy="${sy(eh)}" r="6" fill="#c0392b" stroke="#fff" stroke-width="2"/>`;
      q('[data-rol=lt]').innerHTML = `<dl ${dl}>
        <dt class="nota">Metales</dt><dd>(+) ${d.mas}<br>(−) ${d.menos}</dd>
        <dt class="nota">Tensión medida</dt><dd><b style="font-size:1.1rem">${II.fmt(e, 3)} mV</b> <span class="nota">= ${II.fmt(eh, 3)} − ${II.fmt(ef, 3)}</span></dd>
        <dt class="nota">Sensibilidad</dt><dd><b>${II.fmt(sens, 1)} µV por °C</b> <span class="nota">(a ${S.th} °C)</span></dd>
        <dt class="nota">Rango de uso</dt><dd>${d.min} a ${d.max} °C ${S.th > d.max ? '<span class="chip mal">fuera de rango</span>' : ''}</dd>
        <dt class="nota">¿Dónde se usa?</dt><dd>${d.uso}</dd>
        <dt class="nota">Color del cable</dt><dd>IEC 60584: ${d.iec}<br>ANSI (EE. UU.): ${d.ansi}</dd></dl>`;
      q('[data-d=th] output').textContent = S.th + ' °C';
      q('[data-d=tf] output').textContent = S.tf + ' °C';
      const dth = q('[data-d=th] input'); dth.max = d.max; dth.value = S.th;
    };

    // ---------- TERMISTOR ----------
    const NX0 = 70, NX1 = 610, NY0 = 236, NY1 = 392;
    const portadores = Array.from({ length: 150 }, () => ({ x: 70 + Math.random() * 500, y: 50 + Math.random() * 120, vx: 0, vy: 0 }));
    const pintarNTC = () => {
      const sx = (t) => NX0 + ((t + 40) / 190) * (NX1 - NX0);
      const sy = (r) => NY1 - ((Math.log10(clamp(r, 10, 1e6)) - 1) / 5) * (NY1 - NY0);
      const curva = (f) => { const p = []; for (let t = -40; t <= 150; t += 2) p.push(sx(t).toFixed(1) + ',' + sy(f(t)).toFixed(1)); return p.join(' '); };
      const ntc = S.clase === 'ntc';
      const R = ntc ? ntcR(S.tN) : ptcR(S.tN);
      const sensPct = ((ntc ? ntcR(S.tN + 0.5) - ntcR(S.tN - 0.5) : ptcR(S.tN + 0.5) - ptcR(S.tN - 0.5)) / R) * 100;
      const sensPt = (0.385 / S2.pt100(S.tN)) * 100;
      const fr = (r) => r >= 1e6 ? II.fmt(r / 1e6, 2) + ' MΩ' : r >= 1000 ? II.fmt(r / 1000, 2) + ' kΩ' : II.fmt(r, 1) + ' Ω';
      svgN.innerHTML = `
        <text class="svg-texto fuerte" x="20" y="20" font-size="12">${ntc ? 'Semiconductor (óxidos de manganeso, níquel y cobalto)' : 'Cerámica de titanato de bario, formada por granos'}</text>
        <rect x="60" y="40" width="520" height="140" rx="10" fill="${ntc ? '#f6f1e7' : '#f1eef8'}" stroke="#9aa3ad"/>
        ${ntc ? '' : [140, 220, 300, 380, 460].map((x) => `<line x1="${x}" x2="${x}" y1="42" y2="178" stroke="${S.tN > 115 ? '#c0392b' : '#c9c3dc'}" stroke-width="${S.tN > 115 ? 4 : 2}" stroke-dasharray="${S.tN > 115 ? '0' : '4 4'}"/>`).join('')}
        <g id="${id}-pc"></g>
        <text x="320" y="202" text-anchor="middle" font-size="12" fill="#465366">${ntc
          ? 'Más temperatura → se liberan más portadores de carga → <tspan font-weight="700">menos resistencia</tspan>'
          : (S.tN > 115 ? 'Pasó su temperatura de Curie: los bordes de grano <tspan font-weight="700" fill="#c0392b">bloquean</tspan> la corriente' : 'Debajo de ≈ 120 °C conduce bien; arriba, la resistencia se dispara')}</text>
        <text x="320" y="218" text-anchor="middle" font-size="11" fill="#7a8596">Escala logarítmica: cada línea es 10 veces la anterior</text>
        ${[10, 100, 1000, 10000, 100000, 1000000].map((r) => `<line x1="${NX0}" x2="${NX1}" y1="${sy(r)}" y2="${sy(r)}" stroke="#eef1f5"/><text class="svg-texto" x="${NX0 - 6}" y="${sy(r) + 4}" text-anchor="end" font-size="10">${fr(r).replace(',00', '')}</text>`).join('')}
        ${[-40, 0, 25, 50, 100, 150].map((t) => `<text class="svg-texto" x="${sx(t)}" y="${NY1 + 16}" text-anchor="middle" font-size="10.5">${t} °C</text>`).join('')}
        <line x1="${NX0}" x2="${NX1}" y1="${NY1}" y2="${NY1}" stroke="#8e99a6"/>
        <polyline points="${curva(S2.pt100)}" fill="none" stroke="#aab3bf" stroke-width="2"/><text x="${NX1}" y="${sy(157) - 6}" text-anchor="end" font-size="10.5" fill="#7a8596">Pt100 (casi plana)</text>
        <polyline points="${curva(ntc ? ptcR : ntcR)}" fill="none" stroke="#c3cad3" stroke-width="1.6"/>
        <polyline points="${curva(ntc ? ntcR : ptcR)}" fill="none" stroke="#1d5fb4" stroke-width="3.2"/>
        <circle cx="${sx(S.tN)}" cy="${sy(R)}" r="6.5" fill="#c0392b" stroke="#fff" stroke-width="2"/>
        <text x="${sx(S.tN) + (S.tN > 100 ? -10 : 10)}" y="${sy(R) - 9}" text-anchor="${S.tN > 100 ? 'end' : 'start'}" font-size="12" font-weight="700" fill="#8a1f16" ${halo}>${fr(R)}</text>`;
      q('[data-rol=ln]').innerHTML = `<dl ${dl}>
        <dt class="nota">Resistencia</dt><dd><b style="font-size:1.1rem">${fr(R)}</b></dd>
        <dt class="nota">Cambio por °C</dt><dd><b>${sensPct >= 0 ? '+' : ''}${II.fmt(sensPct, 1)} %</b> <span class="nota">(Pt100: +${II.fmt(sensPt, 2)} %)</span></dd>
        <dt class="nota">Rango de uso</dt><dd>${ntc ? '−40 a 125 °C (algunos hasta 150 °C)' : 'Se usa como interruptor alrededor de su temperatura de Curie'}</dd>
        <dt class="nota">¿Dónde se usa?</dt><dd>${ntc ? 'Medir temperatura en equipos y electrodomésticos, baterías, aire acondicionado, arranque de motores. Barato y muy sensible, pero poco lineal.' : 'Protección térmica: va dentro del bobinado de un motor y, si se calienta, su resistencia sube y un relé lo desconecta. También fusibles que se reponen solos.'}</dd>
        <dt class="nota">¿Y en la industria de procesos?</dt><dd>Poco: su rango es corto y cada unidad es algo distinta. Para medir un proceso se prefiere la Pt100.</dd></dl>`;
      q('[data-d=tN] output').textContent = S.tN + ' °C';
    };
    const animarNTC = () => {
      const ntc = S.clase === 'ntc';
      const R = ntc ? ntcR(S.tN) : ptcR(S.tN);
      const n = ntc ? clamp(Math.round(12 * Math.pow(10000 / R, 0.7)), 2, 150) : 60;
      const bloqueo = !ntc && S.tN > 115;
      const vel = 0.6 + 2.2 * clamp((S.tN + 40) / 190, 0, 1);
      let s = '';
      for (let i = 0; i < n; i++) {
        const p = portadores[i];
        p.vx = clamp(p.vx + (Math.random() - 0.5) * vel, -vel * 2, vel * 2); p.vy = clamp(p.vy + (Math.random() - 0.5) * vel, -vel * 2, vel * 2);
        if (!bloqueo) p.x += 0.8 * vel;
        p.x += p.vx * 0.5; p.y += p.vy * 0.5;
        if (p.x > 572) p.x = 68; if (p.x < 68) p.x = 572;
        if (p.y < 48) p.y = 172; if (p.y > 172) p.y = 48;
        s += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.6" fill="${bloqueo ? '#b0a7c7' : '#1d5fb4'}"/>`;
      }
      const g = svgN.querySelector('#' + id + '-pc'); if (g) g.innerHTML = s;
    };

    // ---------- controles ----------
    const ponMetal = S2.segmentado(cont, 'metal', (v) => { S.metal = v; ponMetal(v); pintarRTD(); });
    const ponTipo = S2.segmentado(cont, 'tipo', (v) => { S.tipo = v; ponTipo(v); pintarTC(); });
    const ponClase = S2.segmentado(cont, 'clase', (v) => { S.clase = v; ponClase(v); pintarNTC(); });
    S2.deslizador(cont, 'tR', (v) => { S.tR = v; pintarRTD(); }).poner(S.tR);
    S2.deslizador(cont, 'th', (v) => { S.th = v; pintarTC(); }).poner(S.th);
    S2.deslizador(cont, 'tf', (v) => { S.tf = v; pintarTC(); }).poner(S.tf);
    S2.deslizador(cont, 'tN', (v) => { S.tN = v; pintarNTC(); }).poner(S.tN);
    ponMetal(S.metal); ponTipo(S.tipo); ponClase(S.clase);
    pintarRTD(); pintarTC(); pintarNTC();
    const ir = S2.pestanas(cont, (t) => { S.tab = t; });
    ir(S.tab);

    let vivo = true, cuadroN = 0;
    const cuadro = (ahora) => {
      if (!vivo) return;
      const t = ahora / 1000;
      if (cont.isConnected) {
        if (S.tab === 'rtd') animarRTD(t);
        else if (S.tab === 'ntc' && ++cuadroN % 2 === 0) animarNTC();
      }
      requestAnimationFrame(cuadro);
    };
    requestAnimationFrame(cuadro);
    return { destruir() { vivo = false; }, pestana: ir };
  };

  // ------------------------------------------------------------
  // 2) CONEXIÓN · Pt100 a 2/3/4 hilos + cable de compensación
  // ------------------------------------------------------------
  II.diagramas.hilos = function (cont, opts = {}) {
    const id = uid();
    const S = { hilos: 2, largo: 100, borne: 0, t: 72, cable: 'cobre', th: 400, tcab: 45, tpan: 22 };
    const dl = 'style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin:0;align-items:baseline"';
    cont.innerHTML = `
      <div class="diagrama">
        <div class="controles"><div class="segmentado" data-rol="tab"><button data-t="a">Pt100: 2, 3 y 4 hilos</button><button data-t="b">Termopar: cable de compensación</button></div></div>
        <div data-tab="a"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 640 360" id="${id}-a" role="img" aria-label="Circuito de conexión de la Pt100"></svg></div>
          <div class="panel-info">
            <label class="campo" style="margin-bottom:10px"><span>Conexión</span>
              <div class="segmentado" data-rol="hilos"><button data-v="2">2 hilos</button><button data-v="3">3 hilos</button><button data-v="4">4 hilos</button></div></label>
            <div class="deslizador" data-d="largo"><label>Largo del cable (≈ 0,025 Ω por metro)</label><output></output><input type="range" min="0" max="300" step="5"></div>
            <div class="deslizador" data-d="borne"><label>Borne flojo o corroído (resistencia extra en un conductor)</label><output></output><input type="range" min="0" max="3" step="0.1"></div>
            <div class="deslizador" data-d="t"><label>Temperatura real del proceso</label><output></output><input type="range" min="0" max="300" step="1"></div>
            <div data-rol="la"></div>
          </div></div>
          <div class="panel-info" data-rol="porque"></div></div>
        <div data-tab="b"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 640 330" id="${id}-b" role="img" aria-label="Termopar con cabezal, cable de extensión y transmisor"></svg></div>
          <div class="panel-info">
            <label class="campo" style="margin-bottom:10px"><span>Cable desde el cabezal hasta el transmisor</span>
              <div class="segmentado" data-rol="cable"><button data-v="comp">Cable de compensación tipo K</button><button data-v="cobre">Cable de cobre común</button></div></label>
            <div class="deslizador" data-d="th"><label>Temperatura del horno</label><output></output><input type="range" min="100" max="1200" step="5"></div>
            <div class="deslizador" data-d="tcab"><label>Cabezal (al sol, junto al horno)</label><output></output><input type="range" min="10" max="80" step="1"></div>
            <div class="deslizador" data-d="tpan"><label>Transmisor (en el tablero)</label><output></output><input type="range" min="10" max="35" step="1"></div>
            <div data-rol="lb"></div>
          </div></div></div>
      </div>`;
    const q = (s) => cont.querySelector(s);
    const svgA = q('#' + id + '-a'), svgB = q('#' + id + '-b');

    const res = (x, y, txt, color = '#2f3b4a', extra = '') => `<rect x="${x - 26}" y="${y - 7}" width="52" height="14" rx="3" fill="#fff" stroke="${color}" stroke-width="1.8"/><text x="${x}" y="${y - 12}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${color}" ${halo}>${txt}</text>${extra}`;
    const pintarA = () => {
      const n = S.hilos;
      const rc = S.largo * 0.025;
      const R = S2.pt100(S.t);
      const Y = n === 2 ? { A: 110, B: 250 } : n === 3 ? { A: 100, B: 230, C: 280 } : { A: 80, B: 130, C: 230, D: 280 };
      const arriba = n === 4 ? ['A', 'B'] : ['A'];
      const abajo = n === 2 ? ['B'] : n === 3 ? ['B', 'C'] : ['C', 'D'];
      const ret = n === 4 ? 'D' : 'B';
      const conCorriente = ['A', ret];
      const rcDe = (k) => rc + (k === 'A' ? S.borne : 0);
      let medida, formula;
      if (n === 2) { medida = R + rcDe('A') + rcDe('B'); formula = `V₁ ÷ I = R + Rc<sub>A</sub> + Rc<sub>B</sub> = ${II.fmt(R, 2)} + ${II.fmt(rcDe('A'), 2)} + ${II.fmt(rcDe('B'), 2)}`; }
      else if (n === 3) { medida = R + rcDe('A') - rcDe('B'); formula = `V₁ ÷ I − 2 · V₂ ÷ I = R + Rc<sub>A</sub> − Rc<sub>B</sub> = ${II.fmt(R, 2)} + ${II.fmt(rcDe('A'), 2)} − ${II.fmt(rcDe('B'), 2)}`; }
      else { medida = R; formula = 'V ÷ I = R (por los hilos B y C casi no circula corriente)'; }
      const ind = S2.invertir(S2.pt100, medida, -200, 900);
      const err = ind - S.t;
      const nodo = (k) => (arriba.includes(k) ? 120 : 240);
      const xv = {}; let ia = 0, ib = 0;
      Object.keys(Y).forEach((k) => { xv[k] = arriba.includes(k) ? 520 + 12 * ia++ : 520 + 12 * ib++; });
      const camino = (k) => `M226,${Y[k]} H${xv[k]} V${nodo(k)} H570`;
      const corriente = `M60,${Y.A} H226 ${camino('A').replace('M226,' + Y.A, '')} V240 H${xv[ret]} V${Y[ret]} H60 Z`;
      const vm = (x, y1, y2, nombre) => `<line x1="${x}" x2="${x}" y1="${y1}" y2="${y2}" stroke="#465366" stroke-width="1.6"/><line x1="${x}" x2="226" y1="${y1}" y2="${y1}" stroke="#465366" stroke-width="1.6"/><line x1="${x}" x2="226" y1="${y2}" y2="${y2}" stroke="#465366" stroke-width="1.6"/><circle cx="${x}" cy="${(y1 + y2) / 2}" r="15" fill="#fff" stroke="#465366" stroke-width="2"/><text x="${x}" y="${(y1 + y2) / 2 + 4.5}" text-anchor="middle" font-size="12" font-weight="700" fill="#16202c">${nombre}</text>`;
      svgA.innerHTML = `
        <rect x="16" y="30" width="210" height="300" rx="12" fill="#f7f9fc" stroke="#5d6a7a" stroke-width="1.6"/>
        <text x="121" y="22" text-anchor="middle" font-size="12" font-weight="700" fill="#16202c">Transmisor</text>
        <rect x="506" y="92" width="120" height="176" rx="12" fill="#fff8ef" stroke="#e0782b" stroke-dasharray="5 4"/>
        <text x="566" y="86" text-anchor="middle" font-size="11.5" font-weight="700" fill="#8a3f0a">Pt100 en el proceso</text>
        <text x="566" y="285" text-anchor="middle" font-size="11" fill="#8a3f0a">${S.t} °C → ${II.fmt(R, 2)} Ω</text>
        ${Object.keys(Y).map((k) => `<path d="${camino(k)}" stroke="#2f3b4a" stroke-width="2.2" fill="none"/>`).join('')}
        <path d="${corriente}" fill="none" stroke="#e0782b" stroke-width="3" stroke-dasharray="8 10" style="animation: fluir .8s linear infinite" opacity=".9"/>
        <rect x="558" y="140" width="24" height="80" rx="4" fill="#fff" stroke="#c0392b" stroke-width="2.2"/>
        <text x="570" y="184" text-anchor="middle" font-size="10" font-weight="700" fill="#c0392b" transform="rotate(-90 570 180)">Pt100</text>
        <circle cx="570" cy="120" r="4" fill="#2f3b4a"/><circle cx="570" cy="240" r="4" fill="#2f3b4a"/>
        ${Object.keys(Y).map((k) => res(390, Y[k], 'Rc ' + II.fmt(rcDe(k), 2) + ' Ω', k === 'A' && S.borne > 0 ? '#c0392b' : conCorriente.includes(k) ? '#b25f16' : '#465366',
          `<text x="238" y="${Y[k] - 6}" font-size="12" font-weight="700" fill="#16202c">${k}</text>`)).join('')}
        ${S.borne > 0 ? `<circle cx="226" cy="${Y.A}" r="7" fill="#c0392b" opacity=".85"/><text x="238" y="${Y.A + 17}" font-size="10.5" font-weight="700" fill="#c0392b">borne corroído +${II.fmt(S.borne, 1)} Ω</text>` : ''}
        <line x1="60" x2="60" y1="${Y.A}" y2="${Y[ret]}" stroke="#b25f16" stroke-width="2"/>
        <circle cx="60" cy="${(Y.A + Y[ret]) / 2}" r="17" fill="#fff" stroke="#b25f16" stroke-width="2"/>
        <path d="M60,${(Y.A + Y[ret]) / 2 + 9} V${(Y.A + Y[ret]) / 2 - 9}" stroke="#b25f16" stroke-width="2" marker-end="url(#${id}-m-nj)"/>
        <text x="60" y="${(Y.A + Y[ret]) / 2 + 34}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#b25f16">I = 1 mA</text>
        ${n === 4 ? vm(150, Y.B, Y.C, 'V') : vm(150, Y.A, Y.B, 'V₁')}
        ${n === 3 ? vm(196, Y.B, Y.C, 'V₂') : ''}
        ${S2.marcadores(id + '-m')}
        <text x="121" y="322" text-anchor="middle" font-size="10.5" fill="#465366">Naranja: camino de la corriente</text>`;
      q('[data-rol=la]').innerHTML = `<dl ${dl}>
        <dt class="nota">El transmisor calcula</dt><dd>${formula}<br><b style="font-size:1.05rem">= ${II.fmt(medida, 2)} Ω</b></dd>
        <dt class="nota">Indica</dt><dd><b style="font-size:1.1rem">${II.fmt(ind, 1)} °C</b></dd>
        <dt class="nota">Error</dt><dd><span class="chip ${Math.abs(err) < 0.5 ? 'ok' : Math.abs(err) < 2 ? 'duda' : 'mal'}">${Math.abs(err) < 0.05 ? '0' : (err > 0 ? '+' : '') + II.fmt(err, 1)} °C</span></dd></dl>`;
      const txt = {
        2: '<b>2 hilos:</b> la corriente y la medición van por los mismos dos conductores, así que el transmisor "ve" la Pt100 <b>más</b> los dos cables: cada 0,385 Ω de cable es 1 °C de error. <b>Solo se acepta</b> cuando el transmisor va montado en el cabezal y el cable mide pocos centímetros.',
        3: '<b>3 hilos:</b> el tercer conductor permite medir la caída de tensión en uno de los cables (V₂) y restarla dos veces. <b>Supone que los dos cables con corriente son iguales.</b> Es el <b>estándar industrial</b>: buen equilibrio entre costo y exactitud. Mueve el "borne corroído": el error vuelve, porque los cables ya no son iguales.',
        4: '<b>4 hilos:</b> dos conductores llevan la corriente y los otros dos solo miden tensión justo en los extremos de la Pt100. Como por ellos casi no circula corriente, <b>la resistencia del cable no importa, aunque los cables sean distintos</b>. Se usa donde se necesita la máxima exactitud: laboratorios, calibración, Pt100 clase AA y transferencia de custodia (medición que se usa para cobrar).'
      };
      q('[data-rol=porque]').innerHTML = `<span class="etiqueta">¿Por qué existe cada conexión?</span><p style="margin:6px 0 0">${txt[n]}</p><p class="nota" style="margin:8px 0 0">Colores según IEC 60751: los conductores de un mismo extremo de la Pt100 llevan el mismo color (rojo en un extremo, blanco en el otro).</p>`;
      q('[data-d=largo] output').textContent = S.largo + ' m (' + II.fmt(rc, 2) + ' Ω)';
      q('[data-d=borne] output').textContent = '+' + II.fmt(S.borne, 1) + ' Ω';
      q('[data-d=t] output').textContent = S.t + ' °C';
    };

    const pintarB = () => {
      const comp = S.cable === 'comp';
      const eFrio = comp ? S.tpan : S.tcab;
      const eBornes = tcE('K', S.th) - tcE('K', eFrio);
      const eUsada = eBornes + tcE('K', S.tpan);
      const ind = tcT('K', eUsada);
      const err = ind - S.th;
      const K = TERMOPARES.K;
      const cableMas = comp ? K.col : '#b87333', cableMenos = comp ? '#f2f2f2' : '#d08a4e';
      const calor = clamp(S.th / 1300, 0, 1);
      svgB.innerHTML = `
        <rect x="16" y="60" width="130" height="190" rx="12" fill="rgb(255,${Math.round(236 - 110 * calor)},${Math.round(214 - 180 * calor)})" stroke="#e0782b"/>
        <text x="81" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="#8a3f0a">Horno</text>
        <text x="81" y="238" text-anchor="middle" font-size="13" font-weight="700" fill="#8a3f0a">${S.th} °C</text>
        <circle cx="96" cy="150" r="8" fill="#c0392b" stroke="#fff" stroke-width="2"/>
        <line x1="96" y1="146" x2="210" y2="140" stroke="${K.col}" stroke-width="6"/><line x1="96" y1="154" x2="210" y2="160" stroke="#f2f2f2" stroke-width="8"/><line x1="96" y1="154" x2="210" y2="160" stroke="#b9c0c9" stroke-width="2"/>
        <rect x="200" y="112" width="70" height="76" rx="14" fill="#dfe4ea" stroke="#5d6a7a" stroke-width="2"/>
        <text x="235" y="104" text-anchor="middle" font-size="11.5" font-weight="700" fill="#16202c">Cabezal</text>
        <text x="235" y="204" text-anchor="middle" font-size="12" font-weight="700" fill="#b7791f">☀ ${S.tcab} °C</text>
        <line x1="270" y1="140" x2="470" y2="140" stroke="${cableMas}" stroke-width="6"/>
        <line x1="270" y1="160" x2="470" y2="160" stroke="${comp ? '#b9c0c9' : cableMenos}" stroke-width="${comp ? 8 : 6}"/>
        ${comp ? '<line x1="270" y1="160" x2="470" y2="160" stroke="#f2f2f2" stroke-width="5"/>' : ''}
        <text x="370" y="126" text-anchor="middle" font-size="11.5" font-weight="700" fill="${comp ? '#1b6d45' : '#8a4a12'}" ${halo}>${comp ? 'Cable de compensación tipo K (verde/blanco)' : 'Cable de cobre común'}</text>
        <rect x="470" y="96" width="150" height="110" rx="10" fill="#f7f9fc" stroke="#5d6a7a" stroke-width="1.6"/>
        <text x="545" y="88" text-anchor="middle" font-size="11.5" font-weight="700" fill="#16202c">Transmisor · ${S.tpan} °C</text>
        <text x="545" y="130" text-anchor="middle" font-size="11" fill="#465366">mide la bornera y suma</text>
        <text x="545" y="146" text-anchor="middle" font-size="11" fill="#465366">la tensión de ${S.tpan} °C</text>
        <text x="545" y="182" text-anchor="middle" font-family="var(--mono)" font-size="15" font-weight="700" fill="${Math.abs(err) < 1 ? '#1b8a5a' : '#c0392b'}">${II.fmt(ind, 1)} °C</text>
        <circle cx="${comp ? 478 : 262}" cy="150" r="10" fill="none" stroke="#c0392b" stroke-width="3"/>
        <text x="${comp ? 478 : 262}" y="${comp ? 236 : 236}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#c0392b" ${halo}>unión fría real: ${eFrio} °C</text>
        <text x="320" y="276" text-anchor="middle" font-size="11.5" fill="#465366">La unión fría está donde <tspan font-weight="700">termina el metal del termopar</tspan>.</text>
        <text x="320" y="294" text-anchor="middle" font-size="11.5" fill="#465366">${comp ? 'El cable de compensación "lleva" el termopar hasta el transmisor, que sí mide esa temperatura.' : 'Con cobre, la unión fría queda en el cabezal (a ' + S.tcab + ' °C), pero el transmisor compensa ' + S.tpan + ' °C.'}</text>`;
      q('[data-rol=lb]').innerHTML = `<dl ${dl}>
        <dt class="nota">Llega al transmisor</dt><dd><b>${II.fmt(eBornes, 3)} mV</b></dd>
        <dt class="nota">Compensación</dt><dd>+ ${II.fmt(tcE('K', S.tpan), 3)} mV (${S.tpan} °C)</dd>
        <dt class="nota">Indica</dt><dd><b style="font-size:1.1rem">${II.fmt(ind, 1)} °C</b></dd>
        <dt class="nota">Error</dt><dd><span class="chip ${Math.abs(err) < 1 ? 'ok' : 'mal'}">${Math.abs(err) < 0.05 ? '0' : (err > 0 ? '+' : '') + II.fmt(err, 1)} °C</span> ${comp ? '' : '<span class="nota">≈ −(cabezal − transmisor)</span>'}</dd>
        <dt class="nota">Regla</dt><dd>Del termopar al transmisor, <b>siempre</b> cable de compensación del mismo tipo (IEC 60584-3), con la polaridad correcta.</dd></dl>`;
      q('[data-d=th] output').textContent = S.th + ' °C';
      q('[data-d=tcab] output').textContent = S.tcab + ' °C';
      q('[data-d=tpan] output').textContent = S.tpan + ' °C';
    };

    const ponHilos = S2.segmentado(cont, 'hilos', (v) => { S.hilos = +v; ponHilos(v); pintarA(); });
    const ponCable = S2.segmentado(cont, 'cable', (v) => { S.cable = v; ponCable(v); pintarB(); });
    S2.deslizador(cont, 'largo', (v) => { S.largo = v; pintarA(); }).poner(S.largo);
    S2.deslizador(cont, 'borne', (v) => { S.borne = v; pintarA(); }).poner(S.borne);
    S2.deslizador(cont, 't', (v) => { S.t = v; pintarA(); }).poner(S.t);
    S2.deslizador(cont, 'th', (v) => { S.th = v; pintarB(); }).poner(S.th);
    S2.deslizador(cont, 'tcab', (v) => { S.tcab = v; pintarB(); }).poner(S.tcab);
    S2.deslizador(cont, 'tpan', (v) => { S.tpan = v; pintarB(); }).poner(S.tpan);
    ponHilos(S.hilos); ponCable(S.cable);
    pintarA(); pintarB();
    const ir = S2.pestanas(cont);
    ir(opts.pestana === 'b' ? 'b' : 'a');
    return { destruir() {}, pestana: ir };
  };

  // ------------------------------------------------------------
  // 3) ASÍ SE VE EN PLANTA · TEMPERATURA  (+ cómo elegir)
  // ------------------------------------------------------------
  const PARTES_T = {
    tuberia: { tipo: 'Proceso', t: 'Tubería con el fluido', que: 'Lo que realmente queremos medir es el fluido, no la tubería.',
      para: 'El sensor debe quedar en contacto con el fluido en movimiento, lejos de codos y zonas muertas.',
      dato: 'Regla práctica: la punta del termopozo en el <b>tercio central</b> de la tubería (línea punteada).', falla: 'Si la punta queda cerca de la pared, mide una mezcla de fluido y pared: lectura falsa.' },
    conexion: { tipo: 'Montaje', t: 'Conexión al proceso', que: 'Rosca (típico ½″ o ¾″ NPT), brida o soldadura que fija el termopozo a la tubería.',
      para: 'Sostiene el termopozo y sella la tubería.', dato: 'La brida se usa en presiones altas o fluidos peligrosos (petróleo, químicos).', falla: 'Fuga por la rosca si no se sella bien.' },
    termopozo: { tipo: 'Montaje', t: 'Termopozo (vaina)', que: 'Tubo cerrado en la punta, mecanizado de una barra maciza (acero inoxidable 316 u otro).',
      para: 'Protege al sensor de la presión, la corrosión y la velocidad del fluido, y permite <b>sacar el sensor sin parar ni vaciar la tubería</b>.',
      dato: 'Se calcula con <b>ASME PTC 19.3 TW</b>: si el fluido es rápido, los remolinos pueden hacerlo vibrar y romperlo.', falla: 'Rotura por vibración (resonancia). Respuesta lenta si es muy grueso.' },
    sensor: { tipo: 'Sensor', t: 'Inserto: el elemento sensor', que: 'La Pt100 o el termopar, dentro de una vaina metálica delgada rellena de polvo aislante (óxido de magnesio).',
      para: 'Es lo que realmente mide. Un resorte lo empuja para que toque el fondo del termopozo.',
      dato: 'Pt100: IEC 60751 · Termopar: IEC 60584.', falla: 'Si no toca el fondo, el aire aísla y la lectura se vuelve lenta. Humedad en el aislante → lectura inestable. Sensor abierto → la lectura se va al extremo.' },
    cuello: { tipo: 'Montaje', t: 'Cuello de extensión', que: 'Tramo entre el termopozo y el cabezal.',
      para: 'Aleja el cabezal y el transmisor del calor del proceso y deja espacio para el aislamiento térmico de la tubería.', dato: 'Típico: 100 a 150 mm.', falla: 'Sin cuello, la electrónica se recalienta.' },
    cabezal: { tipo: 'Montaje', t: 'Cabezal de conexión', que: 'Caja de aluminio o acero inoxidable con tapa roscada donde se conectan los cables.',
      para: 'Protege las conexiones del agua, el polvo y los golpes.',
      dato: 'Grado de protección IP65/IP66 (IEC 60529). En zonas con gas o polvo explosivo: cabezal <b>a prueba de explosión (Ex d, IEC 60079)</b>, clave en minería y petróleo.', falla: 'Tapa mal cerrada → entra agua → bornes corroídos (¡el borne corroído del diagrama de conexión!).' },
    transmisor: { tipo: 'Instrumento', t: 'Transmisor de cabezal (TT)', que: 'Pequeño circuito que va dentro del cabezal.',
      para: 'Convierte la señal de la Pt100 (ohmios) o del termopar (milivoltios) en <b>4–20 mA</b> (Sesión 4). Linealiza la curva y compensa la unión fría.',
      dato: 'Como está pegado al sensor, el cable hasta la Pt100 mide centímetros: por eso aquí hasta 2 hilos funcionaría.', falla: 'Configurado con el sensor equivocado (por ejemplo, termopar K configurado como J): lectura falsa.' },
    prensaestopas: { tipo: 'Montaje', t: 'Prensaestopas', que: 'Pasacable roscado con un sello de goma.',
      para: 'Sella la entrada del cable al cabezal y mantiene el grado IP.', dato: 'En áreas Ex, el prensaestopas también debe ser certificado Ex.', falla: 'Mal ajustado → entra agua por el cable.' },
    cable: { tipo: 'Conexión', t: 'Cable hacia la sala de control', que: 'Con transmisor en el cabezal: par de cobre apantallado que lleva 4–20 mA. Sin transmisor: cable de compensación (termopar) o de 3–4 hilos (Pt100).',
      para: 'Lleva la señal hasta el PLC o el sistema de control.', dato: 'Se tiende lejos de los cables de potencia y con la pantalla a tierra en un solo extremo.', falla: 'Junto a cables de motores → ruido y saltos en la lectura.' }
  };

  II.diagramas.plantaT = function (cont, opts = {}) {
    const id = uid();
    const svg = `
<svg viewBox="0 0 640 420" id="${id}-p" role="img" aria-label="Punto de medición de temperatura: termopozo, sensor, cabezal y transmisor">
  <g class="clic" data-id="tuberia">
    <rect class="aro" x="14" y="246" width="612" height="148" rx="10"/>
    <rect x="20" y="252" width="600" height="136" fill="#d3e8fa"/>
    <rect x="20" y="246" width="600" height="8" fill="#9aa3ad"/><rect x="20" y="386" width="600" height="8" fill="#9aa3ad"/>
  </g>
  <line x1="20" x2="620" y1="297" y2="297" stroke="#4a9be0" stroke-dasharray="6 5"/><line x1="20" x2="620" y1="343" y2="343" stroke="#4a9be0" stroke-dasharray="6 5"/>
  <text x="604" y="324" text-anchor="end" font-size="10.5" fill="#154a8c">tercio central</text>
  ${[70, 170, 400, 480].map((x) => `<path d="M${x},320 h40" stroke="#4a9be0" stroke-width="2.5" marker-end="url(#${id}-m-az)"/>`).join('')}
  <text x="40" y="376" font-size="11" fill="#154a8c">Agua caliente →</text>
  <g class="clic" data-id="conexion"><rect class="aro" x="270" y="222" width="100" height="30" rx="6"/><rect x="278" y="228" width="84" height="20" rx="3" fill="#b9c0c9" stroke="#5d6a7a"/></g>
  <g class="clic" data-id="termopozo">
    <rect class="aro" x="286" y="200" width="68" height="146" rx="10"/>
    <polygon points="296,204 344,204 350,214 344,224 296,224 290,214" fill="#9aa3ad" stroke="#5d6a7a"/>
    <path d="M300,224 L340,224 L334,328 Q320,342 306,328 Z" fill="#c5ccd6" stroke="#5d6a7a" stroke-width="1.6"/>
  </g>
  <g class="clic" data-id="sensor">
    <rect class="aro" x="308" y="150" width="24" height="182" rx="6"/>
    <line x1="320" y1="160" x2="320" y2="322" stroke="#7a8596" stroke-width="5"/>
    <rect x="315" y="306" width="10" height="20" rx="3" fill="#e0782b"/>
  </g>
  <g class="clic" data-id="cuello"><rect class="aro" x="300" y="164" width="40" height="42" rx="6"/><rect x="308" y="168" width="24" height="36" fill="#d5dae1" stroke="#5d6a7a"/></g>
  <g class="clic" data-id="cabezal">
    <rect class="aro" x="238" y="62" width="164" height="110" rx="26"/>
    <path d="M250,168 V104 Q250,72 282,72 H358 Q390,72 390,104 V168 Z" fill="#dfe4ea" stroke="#5d6a7a" stroke-width="2"/>
    <path d="M246,96 H394" stroke="#5d6a7a" stroke-width="2"/>
  </g>
  <g class="clic" data-id="transmisor">
    <circle class="aro" cx="320" cy="134" r="32"/>
    <circle cx="320" cy="134" r="26" fill="#fff" stroke="#1d5fb4" stroke-width="2"/>
    <text x="320" y="131" text-anchor="middle" font-family="var(--mono)" font-size="12" font-weight="700" fill="#154a8c">TT</text>
    <text x="320" y="146" text-anchor="middle" font-size="9" fill="#154a8c">4–20 mA</text>
  </g>
  <g class="clic" data-id="prensaestopas"><rect class="aro" x="386" y="118" width="40" height="32" rx="6"/><polygon points="392,124 412,124 418,134 412,144 392,144" fill="#9aa3ad" stroke="#5d6a7a"/></g>
  <g class="clic" data-id="cable"><path class="aro" d="M418,134 C470,134 480,60 612,60" style="fill:none;stroke-width:14"/><path d="M418,134 C470,134 480,60 612,60" fill="none" stroke="#2f3b4a" stroke-width="5"/></g>
  <text x="612" y="48" text-anchor="end" font-size="11" fill="#465366">al PLC / sala de control</text>
  ${[['Cabezal', 150, 92, 250, 100], ['Transmisor de cabezal', 150, 128, 294, 134], ['Cuello de extensión', 150, 186, 308, 186], ['Termopozo', 150, 226, 296, 226], ['Inserto (sensor)', 150, 300, 318, 312], ['Prensaestopas', 492, 160, 412, 138], ['Conexión al proceso', 492, 232, 362, 238]].map(([t, x, y, x2, y2]) => `<line x1="${x < 320 ? x + 4 : x - 4}" y1="${y - 4}" x2="${x2}" y2="${y2}" stroke="#9aa3ad" stroke-dasharray="3 3"/><text x="${x}" y="${y}" text-anchor="${x < 320 ? 'end' : 'start'}" font-size="11.5" font-weight="600" fill="#16202c" ${halo}>${t}</text>`).join('')}
  ${S2.marcadores(id + '-m')}
</svg>`;
    const OPC = { tmax: [['≤ 125 °C', 1], ['125 a 600 °C', 2], ['600 a 1200 °C', 3], ['más de 1200 °C', 4]], ex: [['Alta (±0,5 °C o mejor)', 'alta'], ['Media (±1 a 2 °C)', 'media'], ['Baja (±2 a 5 °C)', 'baja']] };
    cont.innerHTML = `
      <div class="diagrama">
        <div class="controles"><div class="segmentado" data-rol="tab"><button data-t="a">Así se ve en planta</button><button data-t="b">Cómo elegir el sensor</button></div></div>
        <div data-tab="a"><div class="diag-2col planta-grid">
          <div><p class="nota solo-cel" style="margin:0 0 6px">Toca cada pieza del dibujo →</p><div class="lienzo">${svg}</div></div>
          <div class="panel-info" data-rol="info"><span class="etiqueta">Explora</span><h4>Toca cada pieza del punto de medición</h4><p class="nota" style="margin:0">Así se instala una medición de temperatura en una tubería real. Toca el termopozo, el sensor, el cabezal, el transmisor…</p></div>
        </div></div>
        <div data-tab="b">
          <div class="tabla-envoltura"><table class="tabla" style="white-space:normal">
            <tr><th>Criterio</th><th>RTD Pt100</th><th>Termopar</th><th>Termistor NTC</th></tr>
            ${[
              ['Rango', '−200 a 600 °C (hasta 850)', '−200 a 1700 °C (según el tipo)', '−40 a 125 °C'],
              ['Exactitud típica', 'Muy buena: ±0,15 a ±0,3 °C (clase A/B a 0 °C)', 'Moderada: ±1,5 a ±2,5 °C o ±0,4–0,75 %', 'Buena solo en rango corto'],
              ['Estabilidad en el tiempo', 'Excelente', 'Deriva a alta temperatura', 'Moderada'],
              ['Velocidad de respuesta', 'Media', 'Rápida (punta delgada)', 'Rápida'],
              ['Vibración', 'Sensible (mejor: película delgada)', 'Muy robusto', 'Robusto'],
              ['Señal', 'Resistencia (Ω)', 'Milivoltios (mV): sensible al ruido', 'Resistencia (kΩ), muy poco lineal'],
              ['Costo', 'Medio', 'Bajo (tipos J, K) / alto (R, S, B)', 'Muy bajo'],
              ['Norma', 'IEC 60751 · ASTM E1137', 'IEC 60584 · ASTM E230', '—'],
              ['Industria', 'Alimentos, farmacéutica, agua, energía, laboratorios', 'Hornos, calderas, fundición, cemento, vidrio, petróleo', 'Equipos, HVAC, motores, baterías']
            ].map((f) => `<tr><td><b>${f[0]}</b></td><td>${f[1]}</td><td>${f[2]}</td><td>${f[3]}</td></tr>`).join('')}
          </table></div>
          <div class="diag-2col rango-grid" style="margin-top:14px">
            <div class="panel-info">
              <span class="etiqueta">Asistente de selección</span>
              <label class="campo" style="margin-top:8px"><span>Temperatura máxima del proceso</span><select class="entrada" data-s="tmax">${OPC.tmax.map(([t, v]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
              <label class="campo"><span>Exactitud necesaria</span><select class="entrada" data-s="ex">${OPC.ex.map(([t, v]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
              <div class="controles" style="gap:14px;flex-wrap:wrap">
                <label class="opcion" style="padding:8px 10px"><input type="checkbox" data-s="vib"> Vibración fuerte</label>
                <label class="opcion" style="padding:8px 10px"><input type="checkbox" data-s="rap"> Respuesta muy rápida</label>
                <label class="opcion" style="padding:8px 10px"><input type="checkbox" data-s="bar"> Costo mínimo</label>
                <label class="opcion" style="padding:8px 10px"><input type="checkbox" data-s="exz"> Área con gas o polvo explosivo</label>
              </div>
            </div>
            <div class="panel-info" data-rol="reco"></div>
          </div>
        </div>
      </div>`;
    const raiz = cont.querySelector('#' + id + '-p');
    S2.panelPartes(cont, raiz, PARTES_T);
    const reco = () => {
      const v = (k) => cont.querySelector(`[data-s=${k}]`);
      const tmax = +v('tmax').value, ex = v('ex').value, vib = v('vib').checked, rap = v('rap').checked, bar = v('bar').checked, exz = v('exz').checked;
      let s, por = [];
      if (tmax === 4) { s = 'Termopar tipo R o S (o B si pasa de 1600 °C)'; por.push('Solo los termopares de platino-rodio soportan esa temperatura.'); if (ex === 'alta') por.push('Son los termopares más exactos, pero ±0,5 °C a esa temperatura no es realista: revisa el requisito.'); }
      else if (tmax === 3) { s = ex === 'alta' ? 'Termopar tipo R o S' : 'Termopar tipo K (o N si se necesita estabilidad a largo plazo)'; por.push('Arriba de 600 °C la Pt100 ya no es práctica.'); if (ex === 'alta') por.push('R y S son más exactos y estables que K, aunque más caros.'); }
      else if (tmax === 1 && bar && ex !== 'alta') { s = 'Termistor NTC'; por.push('Rango corto, bajo costo y alta sensibilidad: justo su terreno.'); por.push('Si es un proceso industrial y no un equipo, considera igual una Pt100.'); }
      else if (ex === 'alta') { s = 'RTD Pt100 clase A (o AA) a 3 o 4 hilos'; por.push('Es el sensor más exacto y estable hasta 600 °C.'); por.push('4 hilos si es para calibración o transferencia de custodia.'); }
      else if (rap && !vib) { s = 'Termopar tipo K de punta delgada (o Pt100 de película delgada)'; por.push('Poca masa en la punta = respuesta rápida.'); }
      else if (vib) { s = 'Termopar con aislamiento mineral, o Pt100 de película delgada'; por.push('Un hilo de platino bobinado puede romperse con la vibración.'); }
      else { s = 'RTD Pt100 clase B a 3 hilos'; por.push('Es la opción estándar en la industria de procesos hasta 600 °C.'); }
      por.push('Instálalo en un <b>termopozo</b> (dimensionado con ASME PTC 19.3 TW si el fluido es rápido o a alta presión).');
      por.push('Si el tablero está lejos, usa <b>transmisor en el cabezal</b> (4–20 mA).');
      if (exz) por.push('Área explosiva: cabezal y transmisor <b>certificados Ex</b> (IEC 60079).');
      cont.querySelector('[data-rol=reco]').innerHTML = `<span class="etiqueta">Recomendación</span><h4 style="margin:6px 0 8px">${s}</h4><ul style="margin:0;padding-left:18px;display:grid;gap:6px">${por.map((p) => `<li>${p}</li>`).join('')}</ul>`;
    };
    cont.querySelectorAll('[data-s]').forEach((e) => e.addEventListener('change', reco));
    cont.querySelector('[data-s=tmax]').value = '2';
    reco();
    const ir = S2.pestanas(cont);
    ir(opts.pestana === 'b' ? 'b' : 'a');
    return { destruir() {}, pestana: ir };
  };
})();
