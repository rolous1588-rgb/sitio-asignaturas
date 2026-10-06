// ============================================================
// Diagramas interactivos — Sesión 4, día 5 (calibración, errores y trazabilidad)
//   II.diagramas.errores      → curva de error (cero, span, no linealidad, histéresis) y repetibilidad/deriva
//   II.diagramas.calibracion  → banco de calibración (como se encontró / como se dejó), HART y trazabilidad
// Atajos con pestaña fija: erroresRepet, calibracionHart, calibracionTraza.
// Requiere diagramas2b.js (utilidades II.s2). Cada uno devuelve { destruir() }.
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  II.diagramas = II.diagramas || {};
  const S2 = II.s2;
  let contador = 0;
  const uid = () => 's4d' + ++contador;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const halo = 'stroke="#fff" stroke-width="3.5" paint-order="stroke"';
  const f = (x, d = 2) => II.fmt(x, d);
  const fs = (x, d = 2) => (x > 0.00001 ? '+' : '') + II.fmt(x, d); // con signo
  const fx = (x, d = 3) => x.toFixed(d).replace('.', ','); // pantalla digital: decimales fijos
  const seg = (rol, pares) => `<div class="segmentado" data-rol="${rol}">${pares.map(([v, t]) => `<button data-v="${v}">${t}</button>`).join('')}</div>`;
  const desl = (d, txt, min, max, paso) => `<div class="deslizador" data-d="${d}"><label>${txt}</label><output></output><input type="range" min="${min}" max="${max}" step="${paso}"></div>`;
  const chipOk = (ok, si, no) => `<span class="chip ${ok ? 'ok' : 'mal'}">${ok ? si : no}</span>`;
  const forma = (x) => 4 * x * (1 - x); // vale 0 en los extremos y 1 a mitad de rango

  // ============================================================
  // 1) ERRORES DEL INSTRUMENTO
  // ============================================================
  II.diagramas.errores = function (cont, opts = {}) {
    const id = uid();
    const S = { tab: opts.pestana === 'repet' ? 'repet' : 'tipos', pre: 'cero', z: 0.6, s: 0, nl: 0, h: 0, tol: '0.5', sig: 0.12, der: 0.3, mes: 12, semilla: 1 };
    const PRE = { ideal: [0, 0, 0, 0], cero: [0.6, 0, 0, 0], span: [0, 0.9, 0, 0], nl: [0, 0, 0.7, 0], hist: [0, 0, 0, 0.8] };
    cont.innerHTML = `
      <div class="diagrama">
        <div class="controles"><div class="segmentado" data-rol="tab"><button data-t="tipos">Tipos de error: cero, span, no linealidad, histéresis</button><button data-t="repet">Repetibilidad y deriva</button></div></div>
        <div data-tab="tipos"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 640 400" id="${id}-t" role="img" aria-label="Curva de error de un transmisor subiendo y bajando"></svg></div>
          <div class="panel-info">
            <label class="campo"><span>Ejemplos</span>${seg('pre', [['ideal', 'Ideal'], ['cero', 'Solo cero'], ['span', 'Solo span'], ['nl', 'No linealidad'], ['hist', 'Histéresis']])}</label>
            ${desl('z', 'Error de cero (% del span)', -2, 2, 0.05)}
            ${desl('s', 'Error de span (extra a 100 %)', -2, 2, 0.05)}
            ${desl('nl', 'No linealidad (a mitad de rango)', -1.5, 1.5, 0.05)}
            ${desl('h', 'Histéresis (subiendo vs bajando)', 0, 2, 0.05)}
            <label class="campo"><span>Tolerancia del instrumento</span>${seg('tol', [['0.25', '±0,25 %'], ['0.5', '±0,5 %'], ['1', '±1 %']])}</label>
            <div data-rol="lt"></div>
          </div></div></div>
        <div data-tab="repet"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 640 400" id="${id}-r" role="img" aria-label="Repetibilidad de diez mediciones y deriva en el tiempo"></svg></div>
          <div class="panel-info">
            ${desl('sig', 'Dispersión entre mediciones (σ, % del span)', 0.02, 0.5, 0.01)}
            <div class="controles" style="margin:-4px 0 10px"><button class="boton chico" data-acc="medir">Medir otra vez (10 lecturas)</button></div>
            ${desl('der', 'Deriva (% del span por año)', 0, 1, 0.05)}
            ${desl('mes', 'Meses desde la última calibración', 0, 36, 1)}
            <label class="campo"><span>Tolerancia del instrumento</span>${seg('tol', [['0.25', '±0,25 %'], ['0.5', '±0,5 %'], ['1', '±1 %']])}</label>
            <div data-rol="lr"></div>
          </div></div></div>
      </div>`;
    const q = (s) => cont.querySelector(s);
    const svgT = q('#' + id + '-t'), svgR = q('#' + id + '-r');
    const err = (p, dir) => { const x = p / 100; return S.z + S.s * x + S.nl * forma(x) + (dir === 'baja' ? 1 : -1) * (S.h / 2) * forma(x); };

    const pintarT = () => {
      const T = +S.tol;
      const X0 = 70, X1 = 600, Y0 = 36, Y1 = 330, YM = (Y0 + Y1) / 2;
      const sx = (p) => X0 + (p / 100) * (X1 - X0), sy = (e) => YM - (clamp(e, -3.2, 3.2) / 3) * ((Y1 - Y0) / 2);
      const curva = (dir) => { let s = ''; for (let p = 0; p <= 100; p += 2) s += `${sx(p).toFixed(1)},${sy(err(p, dir)).toFixed(1)} `; return s; };
      const P = [0, 25, 50, 75, 100];
      const filas = P.map((p) => [p, err(p, 'sube'), err(p, 'baja')]);
      const maxE = Math.max(...filas.map(([, a, b]) => Math.max(Math.abs(a), Math.abs(b))));
      const pasa = maxE <= T + 1e-9;
      svgT.innerHTML = `
        <rect x="${X0}" y="${sy(T)}" width="${X1 - X0}" height="${sy(-T) - sy(T)}" fill="#e3f4eb"/>
        <text x="${X1 - 6}" y="${sy(T) - 5}" text-anchor="end" font-size="11" fill="#146b46">tolerancia ±${f(T)} %</text>
        ${[-3, -2, -1, 0, 1, 2, 3].map((e) => `<line x1="${X0}" x2="${X1}" y1="${sy(e)}" y2="${sy(e)}" stroke="${e === 0 ? '#8e99a6' : '#eef1f5'}"/><text x="${X0 - 8}" y="${sy(e) + 4}" text-anchor="end" font-size="11" fill="#465366">${e > 0 ? '+' : ''}${e} %</text>`).join('')}
        ${P.map((p) => `<line x1="${sx(p)}" x2="${sx(p)}" y1="${Y0}" y2="${Y1}" stroke="#eef1f5"/><text x="${sx(p)}" y="${Y1 + 18}" text-anchor="middle" font-size="11" fill="#465366">${p} %</text>`).join('')}
        <text x="${(X0 + X1) / 2}" y="${Y1 + 38}" text-anchor="middle" font-size="12" fill="#465366">entrada aplicada con el patrón (% del rango)</text>
        <text x="16" y="${Y0 - 14}" font-size="12" font-weight="700" fill="#16202c">Error = lo que indica − lo que aplica el patrón (en % del span)</text>
        <polyline points="${curva('sube')}" fill="none" stroke="#1d5fb4" stroke-width="3"/>
        ${S.h > 0.001 ? `<polyline points="${curva('baja')}" fill="none" stroke="#e0782b" stroke-width="3" stroke-dasharray="7 5"/>` : ''}
        ${filas.map(([p, a, b]) => `<circle cx="${sx(p)}" cy="${sy(a)}" r="6" fill="#1d5fb4" stroke="#fff" stroke-width="2"/>${S.h > 0.001 && p > 0 && p < 100 ? `<circle cx="${sx(p)}" cy="${sy(b)}" r="6" fill="#fff" stroke="#e0782b" stroke-width="2.5"/>` : ''}`).join('')}
        <g font-size="11.5"><circle cx="${X0 + 14}" cy="${Y1 - 16}" r="5" fill="#1d5fb4"/><text x="${X0 + 24}" y="${Y1 - 12}" fill="#154a8c">subiendo</text>
        ${S.h > 0.001 ? `<circle cx="${X0 + 104}" cy="${Y1 - 16}" r="5" fill="#fff" stroke="#e0782b" stroke-width="2"/><text x="${X0 + 114}" y="${Y1 - 12}" fill="#8a3f0a">bajando</text>` : ''}</g>
        <rect x="${X1 - 150}" y="${Y1 - 30}" width="150" height="24" rx="12" fill="${pasa ? '#e3f4eb' : '#fbe8e5'}" stroke="${pasa ? '#1b8a5a' : '#c0392b'}"/>
        <text x="${X1 - 75}" y="${Y1 - 14}" text-anchor="middle" font-size="12" font-weight="700" fill="${pasa ? '#146b46' : '#97271c'}">${pasa ? 'PASA' : 'NO PASA'} (máx. ${f(maxE)} %)</text>`;
      const tipos = [];
      if (Math.abs(S.z) > 0.001) tipos.push('<b>Error de cero:</b> toda la curva sube o baja por igual. Se corrige con el <b>ajuste de cero</b>.');
      if (Math.abs(S.s) > 0.001) tipos.push('<b>Error de span:</b> el error crece con la señal (la pendiente está mal). Se corrige con el <b>ajuste de span</b>.');
      if (Math.abs(S.nl) > 0.001) tipos.push('<b>No linealidad:</b> la curva se comba; el error mayor queda a mitad de rango. Con cero y span solo se reparte; si supera la tolerancia, se linealiza o se cambia el equipo.');
      if (S.h > 0.001) tipos.push('<b>Histéresis:</b> subiendo marca distinto que bajando (roces, elasticidad del diafragma). <b>No se corrige con ajustes</b>: si supera la tolerancia, se repara o se reemplaza.');
      if (!tipos.length) tipos.push('Instrumento ideal: indica exactamente lo que aplica el patrón.');
      q('[data-rol=lt]').innerHTML = `<table class="tabla" style="margin:4px 0 10px;font-size:.9rem"><tr><th>Entrada</th><th>Subiendo</th><th>Bajando</th></tr>
        ${filas.map(([p, a, b]) => `<tr><td>${p} %</td><td class="n" style="color:${Math.abs(a) > T ? 'var(--mal)' : 'inherit'}">${fs(a)} %</td><td class="n" style="color:${Math.abs(b) > T ? 'var(--mal)' : 'inherit'}">${p === 0 || p === 100 || S.h < 0.001 ? '—' : fs(b) + ' %'}</td></tr>`).join('')}</table>
        ${S2.ficha([['Error máximo', `<b>${f(maxE)} %</b> del span ${chipOk(pasa, 'pasa', 'no pasa')}`], ['¿Qué error es?', tipos.join('<br>')]])}`;
      ['z', 's', 'nl', 'h'].forEach((k) => { q(`[data-d=${k}] output`).textContent = (k === 'h' ? f(S[k]) : fs(S[k])) + ' %'; });
    };

    // ---------- repetibilidad y deriva ----------
    const normal = (r) => { const u = Math.max(1e-9, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const pintarR = () => {
      const T = +S.tol;
      const r = II.rng('repet' + S.semilla);
      const lect = Array.from({ length: 10 }, () => 50 + S.sig * normal(r));
      const media = lect.reduce((a, b) => a + b, 0) / 10;
      const dis = Math.sqrt(lect.reduce((a, b) => a + (b - media) ** 2, 0) / 9);
      // izquierda: diagrama de puntos
      const LX0 = 30, LX1 = 290, LY = 200;
      const lx = (v) => LX0 + ((v - 49) / 2) * (LX1 - LX0);
      const pilas = {};
      const puntos = lect.map((v) => { const k = Math.round(lx(v) / 9); pilas[k] = (pilas[k] || 0) + 1; return `<circle cx="${lx(v).toFixed(1)}" cy="${LY - 10 - (pilas[k] - 1) * 14}" r="6" fill="#1d5fb4" opacity=".85"/>`; }).join('');
      // derecha: deriva
      const RX0 = 360, RX1 = 620, RY0 = 70, RY1 = 330;
      const rx = (m) => RX0 + (m / 36) * (RX1 - RX0), ry = (e) => RY1 - (clamp(e, 0, 1.6) / 1.6) * (RY1 - RY0);
      const eAhora = (S.der * S.mes) / 12;
      const mLim = S.der > 0 ? (T / S.der) * 12 : Infinity;
      svgR.innerHTML = `
        <text x="${LX0}" y="40" font-size="12.5" font-weight="700" fill="#16202c">Repetibilidad: 10 lecturas del mismo 50 %</text>
        <line x1="${LX0}" x2="${LX1}" y1="${LY}" y2="${LY}" stroke="#8e99a6"/>
        ${[49, 49.5, 50, 50.5, 51].map((v) => `<line x1="${lx(v)}" x2="${lx(v)}" y1="${LY}" y2="${LY + 5}" stroke="#8e99a6"/><text x="${lx(v)}" y="${LY + 20}" text-anchor="middle" font-size="10.5" fill="#465366">${f(v, 1)}</text>`).join('')}
        <rect x="${lx(media - 2 * dis)}" y="${LY - 110}" width="${Math.max(2, lx(media + 2 * dis) - lx(media - 2 * dis))}" height="110" fill="#e7f0fb" opacity=".8"/>
        <line x1="${lx(media)}" x2="${lx(media)}" y1="${LY - 116}" y2="${LY}" stroke="#154a8c" stroke-dasharray="4 3"/>
        ${puntos}
        <text x="${(LX0 + LX1) / 2}" y="${LY + 44}" text-anchor="middle" font-size="11.5" fill="#465366">lectura (% del rango)</text>
        <text x="${(LX0 + LX1) / 2}" y="${LY + 70}" text-anchor="middle" font-size="12" font-weight="700" fill="#154a8c">repetibilidad ≈ ±2σ = ±${f(2 * dis)} %</text>
        <text x="${(LX0 + LX1) / 2}" y="${LY + 90}" text-anchor="middle" font-size="11" fill="#465366">(la zona azul: donde caen casi todas)</text>
        <text x="${RX0}" y="40" font-size="12.5" font-weight="700" fill="#16202c">Deriva: el error crece con el tiempo</text>
        <rect x="${RX0}" y="${ry(T)}" width="${RX1 - RX0}" height="${RY1 - ry(T)}" fill="#e3f4eb"/>
        ${[0, 0.5, 1, 1.5].map((e) => `<line x1="${RX0}" x2="${RX1}" y1="${ry(e)}" y2="${ry(e)}" stroke="#eef1f5"/><text x="${RX0 - 6}" y="${ry(e) + 4}" text-anchor="end" font-size="10.5" fill="#465366">${f(e, 1)} %</text>`).join('')}
        ${[0, 12, 24, 36].map((m) => `<text x="${rx(m)}" y="${RY1 + 16}" text-anchor="middle" font-size="10.5" fill="#465366">${m}</text>`).join('')}
        <text x="${(RX0 + RX1) / 2}" y="${RY1 + 34}" text-anchor="middle" font-size="11.5" fill="#465366">meses desde la calibración</text>
        <line x1="${rx(0)}" y1="${ry(0)}" x2="${rx(36)}" y2="${ry((S.der * 36) / 12)}" stroke="#1d5fb4" stroke-width="3"/>
        ${mLim <= 36 ? `<line x1="${rx(mLim)}" x2="${rx(mLim)}" y1="${RY0}" y2="${RY1}" stroke="#c0392b" stroke-dasharray="5 4"/><text x="${rx(mLim) + (mLim > 12 ? -6 : 6)}" y="${RY0 + 10}" text-anchor="${mLim > 12 ? 'end' : 'start'}" font-size="11" font-weight="700" fill="#97271c" ${halo}>sale de tolerancia: ${f(mLim, 0)} meses</text>` : ''}
        <circle cx="${rx(S.mes)}" cy="${ry(eAhora)}" r="7" fill="${eAhora <= T ? '#1b8a5a' : '#c0392b'}" stroke="#fff" stroke-width="2"/>
        <text x="${rx(S.mes) + (S.mes > 26 ? -10 : 10)}" y="${ry(eAhora) - 10}" text-anchor="${S.mes > 26 ? 'end' : 'start'}" font-size="12" font-weight="700" fill="#16202c" ${halo}>${f(eAhora)} %</text>`;
      q('[data-rol=lr]').innerHTML = S2.ficha([
        ['Promedio de las 10', `${f(media, 2)} %`],
        ['Repetibilidad (±2 sigma)', `<b>±${f(2 * dis)} %</b> del span`],
        ['Error por deriva hoy', `<b>${f(eAhora)} %</b> ${chipOk(eAhora <= T, 'dentro de tolerancia', 'fuera de tolerancia')}`],
        ['Recalibrar como máximo', mLim === Infinity ? 'sin deriva no hace falta (en la vida real siempre hay algo)' : `cada <b>${f(Math.min(mLim, 999), 0)} meses</b> = tolerancia ÷ deriva × 12`],
        ['¿Por qué importa?', 'La <b>repetibilidad</b> es el error que no se puede ajustar: si un instrumento no repite, ninguna calibración lo salva. La <b>deriva</b> decide el <b>intervalo de calibración</b>: hay que volver a calibrar antes de que el error salga de la tolerancia.']
      ]);
      q('[data-d=sig] output').textContent = f(S.sig) + ' %';
      q('[data-d=der] output').textContent = f(S.der) + ' %/año';
      q('[data-d=mes] output').textContent = S.mes + ' meses';
    };

    const desls = {};
    ['z', 's', 'nl', 'h'].forEach((k) => { desls[k] = S2.deslizador(cont, k, (v) => { S[k] = v; S.pre = ''; segs.pre(''); pintarT(); }); desls[k].poner(S[k]); });
    ['sig', 'der', 'mes'].forEach((k) => { S2.deslizador(cont, k, (v) => { S[k] = v; pintarR(); }).poner(S[k]); });
    const segs = {};
    segs.pre = S2.segmentado(cont, 'pre', (v) => { S.pre = v; [S.z, S.s, S.nl, S.h] = PRE[v]; ['z', 's', 'nl', 'h'].forEach((k) => desls[k].poner(S[k])); segs.pre(v); pintarT(); });
    segs.tol = S2.segmentado(cont, 'tol', (v) => { S.tol = v; segs.tol(v); pintarT(); pintarR(); });
    segs.pre(S.pre); segs.tol(S.tol);
    q('[data-acc=medir]').addEventListener('click', () => { S.semilla++; pintarR(); });
    const ir = S2.pestanas(cont, (t) => { S.tab = t; });
    pintarT(); pintarR(); ir(S.tab);
    return { destruir() {} };
  };
  II.diagramas.erroresRepet = (c, o = {}) => II.diagramas.errores(c, { ...o, pestana: 'repet' });

  // ============================================================
  // 2) CALIBRACIÓN: banco, HART y trazabilidad
  // ============================================================
  const PUNTOS = [[0, 'sube'], [25, 'sube'], [50, 'sube'], [75, 'sube'], [100, 'sube'], [75, 'baja'], [50, 'baja'], [25, 'baja'], [0, 'baja']];
  const FALLAS = {
    cero: { n: 'Cero corrido', o: 0.006, g: 1, h: 0 },
    span: { n: 'Span corrido', o: 0, g: 1.008, h: 0 },
    ambos: { n: 'Cero y span corridos', o: 0.005, g: 1.006, h: 0 },
    hist: { n: 'Histéresis (diafragma gastado)', o: 0, g: 1, h: 0.009 }
  };
  const URL_BAR = 10; // rango del PT-104: 0 a 10 bar
  const TOL = 0.25;   // tolerancia del PT-104 en % del span

  II.diagramas.calibracion = function (cont, opts = {}) {
    const id = uid();
    const tabs = ['banco', 'hart', 'traza'];
    const S = { tab: tabs.includes(opts.pestana) ? opts.pestana : 'banco',
      falla: 'ambos', o: 0, g: 1, h: 0, idx: null, fase: 'encontro', reg: { encontro: {}, dejo: {} }, ajustes: [],
      pv: 6, urv: 10, plc: 10, prob: 'salida', trimSal: false, trimSen: false, tolI: 0.5 };
    const reiniciar = () => { const F = FALLAS[S.falla]; S.o = F.o; S.g = F.g; S.h = F.h; S.idx = null; S.fase = 'encontro'; S.reg = { encontro: {}, dejo: {} }; S.ajustes = []; };
    reiniciar();
    cont.innerHTML = `
      <div class="diagrama">
        <div class="controles"><div class="segmentado" data-rol="tab"><button data-t="banco">Banco de calibración</button><button data-t="hart">HART: configurar y ajustar</button><button data-t="traza">Trazabilidad</button></div></div>
        <div data-tab="banco"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 640 400" id="${id}-b" role="img" aria-label="Banco de calibración con bomba, patrón, transmisor y multímetro"></svg></div>
          <div class="panel-info">
            <label class="campo"><span>Transmisor que llegó al taller</span>${seg('falla', Object.entries(FALLAS).map(([k, v]) => [k, v.n]))}</label>
            <div class="campo"><span>1) Aplica la presión de cada punto (subiendo y bajando)</span>
              <div class="segmentado" data-rol="pt" style="flex-wrap:wrap">${PUNTOS.map(([p, d], i) => `<button data-v="${i}">${p} %${p === 0 || p === 100 ? (i === 0 ? ' ↑' : p === 0 ? ' ↓' : '') : d === 'sube' ? ' ↑' : ' ↓'}</button>`).join('')}</div></div>
            <div class="campo"><span>2) Si no pasa, ajusta (primero el cero, después el span) y repite los 9 puntos</span>
              <div class="controles"><button class="boton chico" data-acc="cero">Ajustar cero (aplicar 0 %)</button><button class="boton chico" data-acc="span">Ajustar span (aplicar 100 %)</button><button class="boton chico" data-acc="reini">Empezar de nuevo</button></div></div>
            <div data-rol="lb"></div>
          </div></div></div>
        <div data-tab="hart"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 640 400" id="${id}-h" role="img" aria-label="Señal HART superpuesta a la corriente 4 a 20 mA y comunicador portátil"></svg></div>
          <div class="panel-info">
            ${desl('pv', 'Presión real en el proceso', 0, 10, 0.1)}
            <label class="campo"><span>Problema del transmisor</span>${seg('prob', [['ninguno', 'Ninguno'], ['salida', 'Salida de mA corrida'], ['sensor', 'Sensor corrido']])}</label>
            <div class="campo"><span>Acciones con el comunicador HART</span>
              <div class="controles"><button class="boton chico" data-acc="trimsal">Trim de salida (lazo)</button><button class="boton chico" data-acc="trimsen">Trim de sensor</button><button class="boton chico" data-acc="rerango">Re-rango 0–10 ↔ 0–6 bar</button><button class="boton chico" data-acc="plc">Cambiar escala del PLC</button></div></div>
            <div data-rol="lh"></div>
          </div></div></div>
        <div data-tab="traza"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 640 400" id="${id}-z" role="img" aria-label="Pirámide de trazabilidad de las mediciones"></svg></div>
          <div class="panel-info">
            <div data-rol="info"><span class="etiqueta">Toca cada nivel de la pirámide</span><h4>Cadena de trazabilidad</h4><p class="nota" style="margin:0">Cada instrumento se calibra con otro más exacto, y ese con otro, hasta llegar a la definición de la unidad.</p></div>
            <div style="margin-top:14px">${desl('tolI', 'Tolerancia del instrumento a calibrar (± % del span)', 0.1, 2, 0.05)}</div>
            <div data-rol="tur"></div>
          </div></div></div>
      </div>`;
    const q = (s) => cont.querySelector(s);
    const svgB = q('#' + id + '-b'), svgH = q('#' + id + '-h'), svgZ = q('#' + id + '-z');

    // ---------- banco ----------
    const errPct = (p, dir) => { const x = p / 100; return ((S.g - 1) * x + S.o) * 100 + (dir === 'baja' ? 1 : -1) * (S.h * 100 / 2) * forma(x); };
    const medir = (p, dir) => 4 + 16 * (p / 100 + errPct(p, dir) / 100);
    const tablaFase = (fase, titulo) => {
      const r = S.reg[fase];
      const n = Object.keys(r).length;
      if (!n) return '';
      const errs = Object.values(r).map((x) => x.e);
      const maxE = Math.max(...errs.map(Math.abs));
      const pasa = maxE <= TOL + 1e-9;
      return `<div class="etiqueta" style="margin:10px 0 4px">${titulo} · ${n}/9 puntos</div>
        <div class="tabla-envoltura"><table class="tabla" style="font-size:.86rem"><tr><th>Punto</th><th>Patrón</th><th>Ideal</th><th>Medido</th><th>Error</th></tr>
        ${PUNTOS.map(([p, d], i) => r[i] ? `<tr><td>${p} % ${p === 0 && i === 0 ? '↑' : p === 0 ? '↓' : p === 100 ? '' : d === 'sube' ? '↑' : '↓'}</td><td class="n">${f((p / 100) * URL_BAR, 3)} bar</td><td class="n">${fx(4 + (16 * p) / 100)}</td><td class="n">${fx(r[i].i)}</td><td class="n" style="color:${Math.abs(r[i].e) > TOL ? 'var(--mal)' : 'var(--ok)'}">${fs(r[i].e)} %</td></tr>` : '').join('')}
        </table></div>
        ${n === 9 ? `<div class="aviso ${pasa ? 'ok' : 'mal'}" style="margin:8px 0 0">Error máximo ${f(maxE)} % (tolerancia ±${f(TOL)} %): <b>${pasa ? 'PASA' : 'NO PASA'}</b>${!pasa && fase === 'encontro' ? '. Hay que ajustar.' : ''}</div>` : ''}`;
    };
    const pintarB = () => {
      const pt = S.idx != null ? PUNTOS[S.idx] : null;
      const p = pt ? pt[0] : 0;
      const P = (p / 100) * URL_BAR;
      const I = pt ? medir(pt[0], pt[1]) : 4 + 16 * (S.o);
      const azul = `rgb(${Math.round(207 - 120 * p / 100)},${Math.round(230 - 90 * p / 100)},${Math.round(251 - 60 * p / 100)})`;
      svgB.innerHTML = `
        <rect x="30" y="250" width="120" height="44" rx="8" fill="#eef2f7" stroke="#2f3b4a" stroke-width="2"/>
        <rect x="150" y="262" width="40" height="20" fill="#2f3b4a"/>
        <line x1="40" y1="250" x2="20" y2="200" stroke="#2f3b4a" stroke-width="5" stroke-linecap="round"/><line x1="20" y1="200" x2="80" y2="200" stroke="#2f3b4a" stroke-width="7" stroke-linecap="round"/>
        <text x="90" y="318" text-anchor="middle" font-size="12" font-weight="700" fill="#16202c">bomba manual</text>
        <text x="90" y="334" text-anchor="middle" font-size="10.5" fill="#465366">(genera la presión)</text>
        <path d="M190,272 H250 V150 M250,272 H320" stroke="${azul}" stroke-width="9" fill="none"/>
        <path d="M190,272 H250 V150 M250,272 H320" stroke="#5d6a7a" stroke-width="1.4" fill="none" stroke-dasharray="2 4"/>
        <rect x="175" y="70" width="150" height="80" rx="10" fill="#fff" stroke="#1b8a5a" stroke-width="2.4"/>
        <text x="250" y="90" text-anchor="middle" font-size="11" font-weight="700" fill="#146b46">PATRÓN digital</text>
        <text x="250" y="118" text-anchor="middle" font-size="19" font-weight="700" fill="#16202c" font-family="var(--mono)">${fx(P)}</text>
        <text x="250" y="138" text-anchor="middle" font-size="10.5" fill="#465366">bar · exactitud ±0,025 %</text>
        <rect x="320" y="235" width="140" height="80" rx="10" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
        <text x="390" y="258" text-anchor="middle" font-size="12" font-weight="700" font-family="var(--mono)">PT-104</text>
        <text x="390" y="276" text-anchor="middle" font-size="10.5" fill="#465366">0 a 10 bar · 4–20 mA</text>
        <text x="390" y="296" text-anchor="middle" font-size="10.5" fill="#465366">en prueba (±${f(TOL)} %)</text>
        <path d="M460,255 H520 V150" stroke="#c0392b" stroke-width="2.5" fill="none"/><path d="M460,295 H600 V150" stroke="#2f3b4a" stroke-width="2.5" fill="none"/>
        <rect x="480" y="60" width="140" height="56" rx="8" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
        <text x="550" y="82" text-anchor="middle" font-size="11" fill="#465366">fuente 24 V + 250 Ω</text><text x="550" y="104" text-anchor="middle" font-size="11" fill="#465366">(lazo de prueba)</text>
        <path d="M520,116 V150 M600,116 V150" stroke="#2f3b4a" stroke-width="2.5"/>
        <rect x="470" y="150" width="160" height="70" rx="10" fill="#fff" stroke="#1d5fb4" stroke-width="2.4"/>
        <text x="550" y="170" text-anchor="middle" font-size="11" font-weight="700" fill="#154a8c">MULTÍMETRO (mA)</text>
        <text x="550" y="202" text-anchor="middle" font-size="21" font-weight="700" fill="#154a8c" font-family="var(--mono)">${fx(I)}</text>
        <text x="30" y="40" font-size="12.5" font-weight="700" fill="#16202c">${pt ? `Punto ${p} % ${pt[1] === 'sube' ? 'subiendo' : 'bajando'}: ideal ${f(4 + 16 * p / 100, 3)} mA` : 'Elige un punto de prueba para aplicar presión'}</text>
        ${pt ? `<text x="30" y="60" font-size="12" fill="${Math.abs(errPct(pt[0], pt[1])) > TOL ? '#97271c' : '#146b46'}" font-weight="700">error = (${f(I, 3)} − ${f(4 + 16 * p / 100, 3)}) ÷ 16 × 100 = ${fs(errPct(pt[0], pt[1]))} %</text>` : ''}
        <text x="320" y="380" text-anchor="middle" font-size="11.5" fill="#465366">${S.fase === 'encontro' ? 'Fase 1: “como se encontró” (antes de tocar nada)' : 'Fase 2: “como se dejó” (después de ajustar)'}${S.ajustes.length ? ' · ajustes hechos: ' + S.ajustes.join(', ') : ''}</text>`;
      const nota = S.falla === 'hist' && S.ajustes.length
        ? '<div class="aviso duda" style="margin:8px 0 0">La histéresis <b>no se corrige</b> con cero ni span: el transmisor se repara o se reemplaza, y se deja registrado.</div>'
        : S.ajustes.includes('span') && !S.ajustes.includes('cero') ? '<div class="aviso duda" style="margin:8px 0 0">Ajustaste el span sin corregir antes el cero: al mover el cero, el span se vuelve a correr. Por eso se ajusta <b>primero el cero</b> y se repite.</div>' : '';
      q('[data-rol=lb]').innerHTML = tablaFase('encontro', 'Como se encontró') + tablaFase('dejo', 'Como se dejó') + nota +
        (!Object.keys(S.reg.encontro).length ? '<p class="nota" style="margin:8px 0 0">Calibrar = comparar con el patrón y registrar. Ajustar = corregir el instrumento. Siempre se registra antes y después.</p>' : '');
      q('[data-acc=cero]').disabled = !(pt && pt[0] === 0);
      q('[data-acc=span]').disabled = !(pt && pt[0] === 100);
    };

    // ---------- HART ----------
    const pintarH = () => {
      const pvSen = S.pv + (S.prob === 'sensor' && !S.trimSen ? 0.15 : 0);
      const aoIdeal = clamp(4 + (16 * pvSen) / S.urv, 3.8, 20.5);
      const aoReal = aoIdeal + (S.prob === 'salida' && !S.trimSal ? 0.12 : 0);
      const pvPLC = ((aoReal - 4) / 16) * S.plc;
      const okPLC = Math.abs(pvPLC - S.pv) < 0.02;
      // onda FSK: 1 = 1200 Hz (1 ciclo por bit), 0 = 2200 Hz (≈ 1,83 ciclos por bit)
      const bits = [1, 0, 1, 1, 0, 0, 1, 0];
      const X0 = 40, X1 = 600, Y0 = 50, Y1 = 170, W = (X1 - X0) / bits.length;
      const yc = (ma) => Y1 - ((ma - (aoReal - 1.2)) / 2.4) * (Y1 - Y0);
      let fase = 0, d = '';
      bits.forEach((b, i) => { const ciclos = b ? 1 : 2200 / 1200; for (let k = 0; k <= 24; k++) { const x = X0 + i * W + (k / 24) * W; const ph = fase + (k / 24) * ciclos * 2 * Math.PI; d += `${k === 0 && i === 0 ? 'M' : 'L'}${x.toFixed(1)},${yc(aoReal + 0.5 * Math.sin(ph)).toFixed(1)} `; } fase += ciclos * 2 * Math.PI; });
      svgH.innerHTML = `
        <text x="${X0}" y="32" font-size="12.5" font-weight="700" fill="#16202c">Corriente en el lazo: 4–20 mA + señal HART (±0,5 mA)</text>
        <line x1="${X0}" x2="${X1}" y1="${yc(aoReal)}" y2="${yc(aoReal)}" stroke="#1b8a5a" stroke-width="2" stroke-dasharray="6 4"/>
        <path d="${d}" fill="none" stroke="#e0782b" stroke-width="2.2"/>
        ${bits.map((b, i) => `<text x="${X0 + i * W + W / 2}" y="${Y1 + 18}" text-anchor="middle" font-size="12" font-weight="700" fill="#8a3f0a">${b}</text>`).join('')}
        <text x="${X1}" y="${Y0 + 8}" text-anchor="end" font-size="11.5" font-weight="700" fill="#146b46">- - - promedio = ${fx(aoReal, 2)} mA (lo que lee el PLC)</text>
        <text x="${X0}" y="${Y1 + 38}" font-size="11" fill="#465366">"1" = 1200 Hz · "0" = 2200 Hz · el seno sube y baja por igual: en promedio vale 0</text>
        <rect x="40" y="250" width="80" height="60" rx="8" fill="#fff" stroke="#2f3b4a" stroke-width="2"/><text x="80" y="276" text-anchor="middle" font-size="11.5" font-weight="700">Fuente</text><text x="80" y="294" text-anchor="middle" font-size="12" fill="#154a8c" font-weight="700">24 V</text>
        <path d="M120,265 H480 M120,295 H230 M290,295 H480" stroke="#2f3b4a" stroke-width="2.5" fill="none"/>
        <rect x="230" y="284" width="60" height="22" rx="4" fill="#fbf1de" stroke="#b7791f" stroke-width="2"/><text x="260" y="300" text-anchor="middle" font-size="11" font-weight="700" fill="#8a5a12">250 Ω</text>
        <text x="150" y="336" text-anchor="middle" font-size="10.5" fill="#465366">entrada del PLC</text><text x="150" y="350" text-anchor="middle" font-size="10.5" fill="#465366">(mín. ≈ 250 Ω para HART)</text>
        <rect x="480" y="240" width="120" height="80" rx="10" fill="#fff" stroke="#2f3b4a" stroke-width="2"/><text x="540" y="264" text-anchor="middle" font-size="12" font-weight="700" font-family="var(--mono)">PT-104</text>
        <text x="540" y="284" text-anchor="middle" font-size="10.5" fill="#465366">rango 0–${S.urv} bar</text><text x="540" y="304" text-anchor="middle" font-size="12" font-weight="700" fill="#154a8c">${f(aoReal, 2)} mA</text>
        <path d="M232,295 V365 H310 M288,295 V345 H310" stroke="#1d5fb4" stroke-width="2" fill="none"/>
        <rect x="310" y="330" width="180" height="50" rx="10" fill="#e7f0fb" stroke="#1d5fb4" stroke-width="2"/>
        <text x="400" y="352" text-anchor="middle" font-size="11.5" font-weight="700" fill="#154a8c">comunicador HART</text><text x="400" y="368" text-anchor="middle" font-size="10" fill="#465366">(en paralelo, sin cortar el lazo)</text>`;
      const acciones = [];
      if (S.prob === 'salida') acciones.push(S.trimSal ? '✓ Trim de salida hecho: el transmisor ajustó su salida de 4 y 20 mA comparándola con un multímetro patrón.' : 'El transmisor <b>cree</b> que envía ' + f(aoIdeal, 2) + ' mA, pero salen ' + f(aoReal, 2) + ' mA: está corrida la <b>salida analógica</b>. Se corrige con el <b>trim de salida</b>.');
      if (S.prob === 'sensor') acciones.push(S.trimSen ? '✓ Trim de sensor hecho: se aplicó presión conocida con el patrón y el transmisor corrigió su lectura digital.' : 'El sensor lee ' + f(pvSen, 2) + ' bar cuando hay ' + f(S.pv, 2) + ' bar: está corrida la <b>lectura del sensor</b>. Se corrige con el <b>trim de sensor</b>, aplicando presión con el patrón.');
      if (S.urv !== S.plc) acciones.push('Hiciste un <b>re-rango</b> (0–' + S.urv + ' bar) pero el PLC sigue escalado 0–' + S.plc + ' bar: <b>hay que cambiar la escala del PLC también</b>.');
      if (S.urv === 6 && S.urv === S.plc) acciones.push('Re-rango a 0–6 bar: la misma presión ahora usa más señal (mejor resolución). Ojo: <b>re-rango no es calibrar</b>, no verifica la exactitud del sensor.');
      q('[data-rol=lh]').innerHTML = `<div class="tarjeta" style="padding:10px 12px;margin:0 0 10px;background:#f6f9fd;font-family:var(--mono);font-size:.86rem">
          <div>TAG ........ PT-104</div><div>PV ......... ${fx(pvSen, 2)} bar</div><div>AO ......... ${fx(aoIdeal, 2)} mA</div><div>RANGO ...... 0 a ${S.urv} bar</div></div>
        ${S2.ficha([
          ['Corriente real en el lazo', `<b>${f(aoReal, 2)} mA</b>`],
          ['El PLC muestra', `<b>${f(pvPLC, 2)} bar</b> ${chipOk(okPLC, 'correcto', 'no coincide con el proceso')}`],
          ['Diagnóstico', acciones.length ? acciones.join('<br>') : 'Todo coincide: proceso, sensor, salida y PLC. HART permite leer el TAG, la variable, el rango y los diagnósticos sin desconectar nada.']
        ])}`;
      q('[data-d=pv] output').textContent = f(S.pv, 1) + ' bar';
    };

    // ---------- trazabilidad ----------
    const NIVELES = [
      ['si', 'SI · Sistema Internacional de Unidades', '#e3f4eb', { tipo: 'Nivel 1', t: 'Sistema Internacional de Unidades (SI)', que: 'La definición de las unidades (metro, kilogramo, segundo, kelvin, ampere…) a partir de constantes de la naturaleza. Lo coordina el BIPM, en Francia.', para: 'Es la referencia común de todo el mundo: un bar en Sucre es el mismo bar en Alemania.', dato: 'Desde 2019 el kilogramo se define con la constante de Planck, ya no con un cilindro de metal guardado en París.' }],
      ['nac', 'IBMETRO · patrones nacionales', '#e7f0fb', { tipo: 'Nivel 2', t: 'IBMETRO · Instituto Boliviano de Metrología', que: 'El instituto nacional de metrología de Bolivia: mantiene los patrones nacionales.', para: 'Sus patrones se comparan con los de otros institutos nacionales; así las mediciones del país quedan enlazadas al SI.', falla: 'Sin un patrón nacional trazable, las calibraciones del país no tendrían un origen reconocido.' }],
      ['lab', 'Laboratorio acreditado (ISO/IEC 17025)', '#fbf1de', { tipo: 'Nivel 3', t: 'Laboratorio de calibración acreditado', que: 'Un laboratorio evaluado según la norma ISO/IEC 17025, que demuestra su competencia técnica.', para: 'Calibra los patrones de trabajo de las empresas y entrega un certificado con los resultados, la incertidumbre y los patrones que usó.', falla: 'Un certificado sin incertidumbre o sin trazabilidad no sirve como evidencia en una auditoría.' }],
      ['trab', 'Patrón de trabajo del taller', '#f3eefa', { tipo: 'Nivel 4', t: 'Patrón de trabajo (calibrador del taller)', que: 'El equipo con que el instrumentista calibra: calibrador de presión, multímetro de procesos, baño térmico.', para: 'Debe ser varias veces más exacto que el instrumento que calibra: regla práctica <b>4 a 1</b>.', dato: 'Tiene su propio certificado vigente y fecha de próxima calibración.', falla: 'Un patrón vencido o golpeado contamina todas las calibraciones que se hagan con él.' }],
      ['planta', 'Instrumento de planta (PT-104)', '#fbe8e5', { tipo: 'Nivel 5', t: 'Instrumento de planta (PT-104)', que: 'El transmisor instalado en el proceso.', para: 'Se calibra cada cierto intervalo: se registra "como se encontró", se ajusta si hace falta y se registra "como se dejó".', dato: 'El intervalo depende de la deriva, de qué tan crítico es y de su historial (por ejemplo, cada 12 meses).', falla: 'Sin registro no hay forma de demostrar que la medición era confiable.' }]
    ];
    const pintarPiramide = () => {
      const top = 40, alto = 62, cx = 300;
      svgZ.innerHTML = NIVELES.map(([k, txt, col], i) => {
        const y = top + i * alto, w1 = 70 + i * 92, w2 = 70 + (i + 1) * 92;
        const d = `M${cx - w1 / 2},${y} L${cx + w1 / 2},${y} L${cx + w2 / 2},${y + alto - 4} L${cx - w2 / 2},${y + alto - 4} Z`;
        return `<g class="clic" data-id="${k}"><path d="${d}" fill="${col}" stroke="#8e99a6" stroke-width="1.4"/><path class="aro" d="${d}"/>
          <text x="${cx}" y="${y + alto / 2 + 3}" text-anchor="middle" font-size="${i < 1 ? 11 : i === 1 ? 11.5 : 12.5}" font-weight="700" fill="#16202c">${i === 0 ? 'SI' : txt}</text></g>`;
      }).join('') + `
        <text x="${cx}" y="${top - 12}" text-anchor="middle" font-size="11" fill="#465366">${NIVELES[0][1]}</text>
        <line x1="600" y1="${top + 6}" x2="600" y2="${top + 5 * alto - 10}" stroke="#c0392b" stroke-width="2" marker-end="url(#${id}z-rj)"/>
        <text x="590" y="${top + 2.5 * alto}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#97271c" transform="rotate(-90 590 ${top + 2.5 * alto})">la incertidumbre crece hacia abajo</text>
        <text x="${cx}" y="${top + 5 * alto + 22}" text-anchor="middle" font-size="12" fill="#465366">Cada nivel se calibra con el de arriba: es una <tspan font-weight="700">cadena sin cortes</tspan>.</text>
        ${S2.marcadores(id + 'z')}`;
    };
    const pintarZ = () => { // solo el panel (la pirámide se dibuja una vez para no perder los clics)
      const pat = S.tolI / 4;
      q('[data-rol=tur]').innerHTML = S2.ficha([
        ['Instrumento', `±${f(S.tolI)} % del span`],
        ['Patrón necesario (4 : 1)', `<b>±${f(pat, 3)} %</b> o mejor`],
        ['Un certificado debe tener', 'identificación del equipo, fecha, resultados como se encontró y como se dejó, incertidumbre, patrones usados con su trazabilidad y firma.']
      ]);
      q('[data-d=tolI] output').textContent = '±' + f(S.tolI) + ' %';
    };

    // ---------- eventos ----------
    const segs = {};
    segs.falla = S2.segmentado(cont, 'falla', (v) => { S.falla = v; segs.falla(v); reiniciar(); segs.pt(''); pintarB(); });
    segs.pt = S2.segmentado(cont, 'pt', (v) => {
      S.idx = +v; segs.pt(v);
      const [p, d] = PUNTOS[S.idx];
      S.reg[S.fase][S.idx] = { i: medir(p, d), e: errPct(p, d) };
      pintarB();
    });
    segs.prob = S2.segmentado(cont, 'prob', (v) => { S.prob = v; S.trimSal = false; S.trimSen = false; segs.prob(v); pintarH(); });
    segs.falla(S.falla); segs.prob(S.prob);
    const pasarADejo = () => { if (S.fase === 'encontro') { S.fase = 'dejo'; S.reg.dejo = {}; } };
    q('[data-acc=cero]').addEventListener('click', () => { pasarADejo(); S.o = 0; S.ajustes.push('cero'); const [p, d] = PUNTOS[S.idx]; S.reg.dejo[S.idx] = { i: medir(p, d), e: errPct(p, d) }; pintarB(); });
    q('[data-acc=span]').addEventListener('click', () => { pasarADejo(); S.g = 1 - S.o; S.ajustes.push('span'); const [p, d] = PUNTOS[S.idx]; S.reg.dejo[S.idx] = { i: medir(p, d), e: errPct(p, d) }; pintarB(); });
    q('[data-acc=reini]').addEventListener('click', () => { reiniciar(); segs.pt(''); pintarB(); });
    q('[data-acc=trimsal]').addEventListener('click', () => { S.trimSal = true; pintarH(); });
    q('[data-acc=trimsen]').addEventListener('click', () => { S.trimSen = true; pintarH(); });
    q('[data-acc=rerango]').addEventListener('click', () => { S.urv = S.urv === 10 ? 6 : 10; pintarH(); });
    q('[data-acc=plc]').addEventListener('click', () => { S.plc = S.urv; pintarH(); });
    S2.deslizador(cont, 'pv', (v) => { S.pv = v; pintarH(); }).poner(S.pv);
    S2.deslizador(cont, 'tolI', (v) => { S.tolI = v; pintarZ(); }).poner(S.tolI);
    const ir = S2.pestanas(cont, (t) => { S.tab = t; });
    pintarB(); pintarH(); pintarPiramide(); pintarZ();
    S2.panelPartes(cont.querySelector('[data-tab=traza]'), svgZ, Object.fromEntries(NIVELES.map(([k, , , d]) => [k, d])));
    ir(S.tab);
    return { destruir() {} };
  };
  II.diagramas.calibracionHart = (c, o = {}) => II.diagramas.calibracion(c, { ...o, pestana: 'hart' });
  II.diagramas.calibracionTraza = (c, o = {}) => II.diagramas.calibracion(c, { ...o, pestana: 'traza' });
})();
