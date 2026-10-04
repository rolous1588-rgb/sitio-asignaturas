// ============================================================
// Diagramas interactivos — Sesión 3 (nivel, flujo y lazo 4–20 mA)
//   II.diagramas.nivel    → hidrostático (abierto/cerrado, densidad) y tiempo de vuelo (ultrasonido/radar)
//   II.diagramas.flujo    → placa orificio, turbina y electromagnético
//   II.diagramas.lazo420  → el lazo de corriente (fallas, carga, ruido) y el escalado
// Atajos con pestaña fija: nivelTOF, flujoOtros, lazoEscala.
// Requiere diagramas2b.js (utilidades II.s2). Cada uno devuelve { destruir() }.
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  II.diagramas = II.diagramas || {};
  const S2 = II.s2;
  let contador = 0;
  const uid = () => 's3d' + ++contador;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const halo = 'stroke="#fff" stroke-width="3.5" paint-order="stroke"';
  const G = 9.81;
  const f = (x, d = 2) => II.fmt(x, d);
  const LIQ = {
    agua: { n: 'Agua', rho: 1000, col: '#cfe6fb', borde: '#7fb3e0', cond: true },
    diesel: { n: 'Diésel', rho: 840, col: '#f6e7b4', borde: '#d6b85a', cond: false },
    leche: { n: 'Leche', rho: 1030, col: '#fbfaf3', borde: '#c9c4ad', cond: true },
    pulpa: { n: 'Pulpa de mineral', rho: 1400, col: '#c9b9a2', borde: '#93806a', cond: true }
  };
  const seg = (rol, pares) => `<div class="segmentado" data-rol="${rol}">${pares.map(([v, t]) => `<button data-v="${v}">${t}</button>`).join('')}</div>`;
  const desl = (d, txt, min, max, paso) => `<div class="deslizador" data-d="${d}"><label>${txt}</label><output></output><input type="range" min="${min}" max="${max}" step="${paso}"></div>`;
  const chipOk = (ok, si, no) => `<span class="chip ${ok ? 'ok' : 'mal'}">${ok ? si : no}</span>`;
  const animar = (fn) => { let v = true, t0 = performance.now(); const paso = (t) => { if (!v) return; fn((t - t0) / 1000); requestAnimationFrame(paso); }; requestAnimationFrame(paso); return () => { v = false; }; };

  // ============================================================
  // 1) NIVEL
  // ============================================================
  II.diagramas.nivel = function (cont, opts = {}) {
    const id = uid();
    const S = { tab: opts.pestana === 'tof' ? 'tof' : 'hidro', abierto: '1', tx: 'pt', liq: 'agua', h: 2.5, pgas: 60, cal: '1',
      tipo: 'us', hT: 3, temp: 20, comp: '1', vapor: '0' };
    cont.innerHTML = `
      <div class="diagrama">
        <div class="controles"><div class="segmentado" data-rol="tab"><button data-t="hidro">Por presión (hidrostático)</button><button data-t="tof">Por tiempo de vuelo (ultrasonido y radar)</button></div></div>
        <div data-tab="hidro"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 560 420" id="${id}-h" role="img" aria-label="Tanque con transmisor de nivel por presión"></svg></div>
          <div class="panel-info">
            <label class="campo"><span>Tanque</span>${seg('abierto', [['1', 'Abierto'], ['0', 'Cerrado y presurizado']])}</label>
            <label class="campo"><span>Transmisor</span>${seg('tx', [['pt', 'Presión en el fondo'], ['dp', 'Diferencial (DP)']])}</label>
            <label class="campo"><span>Líquido</span>${seg('liq', Object.entries(LIQ).map(([k, d]) => [k, d.n]))}</label>
            ${desl('h', 'Nivel real', 0, 5, 0.05)}
            <div data-rol="gas">${desl('pgas', 'Presión del gas encima del líquido', 0, 200, 5)}</div>
            <label class="campo"><span>El transmisor se configuró con la densidad…</span>${seg('cal', [['1', 'de este líquido'], ['0', 'del agua (1000 kg/m³)']])}</label>
            <div data-rol="lh"></div>
          </div></div></div>
        <div data-tab="tof"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 560 420" id="${id}-t" role="img" aria-label="Tanque con sensor de nivel por tiempo de vuelo"></svg></div>
          <div class="panel-info">
            <label class="campo"><span>Sensor (sin contacto)</span>${seg('tipo', [['us', 'Ultrasónico (sonido)'], ['radar', 'Radar (microondas)']])}</label>
            ${desl('hT', 'Nivel real', 0, 6, 0.05)}
            <div data-rol="solo-us">
              ${desl('temp', 'Temperatura del aire en el tanque', -10, 60, 1)}
              <label class="campo"><span>Compensación de temperatura</span>${seg('comp', [['1', 'Activada'], ['0', 'Desactivada']])}</label>
            </div>
            <label class="campo"><span>Vapor sobre el líquido</span>${seg('vapor', [['0', 'Sin vapor'], ['1', 'Con mucho vapor']])}</label>
            <div data-rol="lt"></div>
          </div></div></div>
      </div>`;
    const q = (s) => cont.querySelector(s);
    const svgH = q('#' + id + '-h'), svgT = q('#' + id + '-t');

    // ---------- hidrostático ----------
    const TX0 = 170, TX1 = 370, TY0 = 50, TY1 = 370, PXM = (TY1 - TY0) / 5;
    const pintarH = () => {
      const L = LIQ[S.liq];
      const abierto = S.abierto === '1';
      const rhoCal = S.cal === '1' ? L.rho : 1000;
      const pg = abierto ? 0 : S.pgas;
      const pl = (L.rho * G * S.h) / 1000;
      const lect = S.tx === 'pt' ? pg + pl : pl;
      const hInd = (lect * 1000) / (rhoCal * G);
      const err = hInd - S.h;
      const ok = Math.abs(err) < 0.02;
      const yL = TY1 - S.h * PXM;
      const tapa = abierto ? '' : `<line x1="${TX0}" y1="${TY0}" x2="${TX1}" y2="${TY0}" stroke="#5d6a7a" stroke-width="3"/>`;
      const gas = abierto ? `<text x="${(TX0 + TX1) / 2}" y="${TY0 - 12}" text-anchor="middle" font-size="12" fill="#465366">abierto a la atmósfera ↑↓</text>`
        : `<rect x="${TX0 + 2}" y="${TY0 + 2}" width="${TX1 - TX0 - 4}" height="${Math.max(0, yL - TY0 - 2)}" fill="#eef2f7"/>
           <text x="${(TX0 + TX1) / 2}" y="${TY0 + 26}" text-anchor="middle" font-size="12.5" font-weight="700" fill="#465366" ${halo}>gas a ${f(pg, 0)} kPa</text>
           <circle cx="${TX1 - 30}" cy="${TY0 - 18}" r="13" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/><text x="${TX1 - 30}" y="${TY0 - 14}" text-anchor="middle" font-size="9.5" font-weight="700">PI</text>
           <line x1="${TX1 - 30}" y1="${TY0 - 5}" x2="${TX1 - 30}" y2="${TY0}" stroke="#2f3b4a" stroke-width="1.8"/>`;
      let tx = '';
      if (S.tx === 'pt') {
        tx = `<line x1="${TX0}" y1="${TY1 - 16}" x2="104" y2="${TY1 - 16}" stroke="#5d6a7a" stroke-width="5"/>
          <g class="svg-instr"><circle class="cuerpo" cx="82" cy="${TY1 - 16}" r="22"/><text x="82" y="${TY1 - 12}" font-size="12">PT</text></g>
          <rect x="18" y="${TY1 - 96}" width="128" height="52" rx="8" fill="#fff" stroke="#c9d1db"/>
          <text x="82" y="${TY1 - 76}" text-anchor="middle" font-size="11" fill="#465366">mide (gas + líquido)</text>
          <text x="82" y="${TY1 - 56}" text-anchor="middle" font-size="15" font-weight="700" fill="#154a8c">${f(lect, 1)} kPa</text>`;
      } else {
        const xb = 440;
        tx = `<line x1="${TX1}" y1="${TY1 - 16}" x2="${xb}" y2="${TY1 - 16}" stroke="#5d6a7a" stroke-width="5"/>
          <rect x="${xb}" y="${TY1 - 46}" width="74" height="58" rx="8" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
          <text x="${xb + 37}" y="${TY1 - 22}" text-anchor="middle" font-size="12" font-weight="700" font-family="var(--mono)">LT (DP)</text>
          <text x="${xb + 8}" y="${TY1 + 4}" font-size="11" font-weight="700" fill="#c0392b">H</text><text x="${xb + 70}" y="${TY1 - 52}" font-size="11" font-weight="700" fill="#1d5fb4">L</text>
          <path d="M${xb + 64},${TY1 - 46} V${TY0 + 20} ${abierto ? '' : `H${TX1}`}" stroke="#1d5fb4" stroke-width="3" fill="none" stroke-dasharray="${abierto ? '0' : '0'}"/>
          ${abierto ? `<text x="${xb + 64}" y="${TY0 + 12}" text-anchor="middle" font-size="11" fill="#1d5fb4">L al aire</text>` : `<text x="${xb + 8}" y="${TY0 + 14}" font-size="11" fill="#1d5fb4">L: siente solo el gas</text>`}
          <rect x="${xb - 44}" y="${TY1 - 130}" width="150" height="52" rx="8" fill="#fff" stroke="#c9d1db"/>
          <text x="${xb + 31}" y="${TY1 - 110}" text-anchor="middle" font-size="11" fill="#465366">mide H − L (solo líquido)</text>
          <text x="${xb + 31}" y="${TY1 - 90}" text-anchor="middle" font-size="15" font-weight="700" fill="#154a8c">${f(lect, 1)} kPa</text>`;
      }
      const reglas = [0, 1, 2, 3, 4, 5].map((m) => `<line x1="${TX0}" x2="${TX0 + 12}" y1="${TY1 - m * PXM}" y2="${TY1 - m * PXM}" stroke="#8e99a6"/><text x="${TX0 + 16}" y="${TY1 - m * PXM + 4}" font-size="10.5" fill="#465366" ${halo}>${m} m</text>`).join('');
      svgH.innerHTML = `
        ${gas}
        <rect x="${TX0 + 2}" y="${yL}" width="${TX1 - TX0 - 4}" height="${TY1 - yL}" fill="${L.col}"/>
        <line x1="${TX0 + 2}" x2="${TX1 - 2}" y1="${yL}" y2="${yL}" stroke="${L.borde}" stroke-width="2"/>
        <path d="M${TX0},${TY0} V${TY1} H${TX1} V${TY0}" fill="none" stroke="#5d6a7a" stroke-width="3"/>${tapa}
        ${reglas}
        <text x="${TX1 - 10}" y="${yL - 8}" text-anchor="end" font-size="12.5" font-weight="700" fill="#16202c" ${halo}>nivel real ${f(S.h)} m</text>
        ${S.h > 0.6 ? `<text x="${TX1 - 8}" y="${TY1 - PXM / 2 + 4}" text-anchor="end" font-size="11.5" fill="#465366" ${halo}>${L.n} · ρ = ${L.rho} kg/m³</text>` : ''}
        ${tx}
        <rect x="150" y="388" width="260" height="26" rx="13" fill="${ok ? '#e3f4eb' : '#fbe8e5'}" stroke="${ok ? '#1b8a5a' : '#c0392b'}"/>
        <text x="280" y="405" text-anchor="middle" font-size="12.5" font-weight="700" fill="${ok ? '#146b46' : '#97271c'}">el transmisor indica ${f(hInd)} m${ok ? ' ✓' : ` (error ${err > 0 ? '+' : ''}${f(err)} m)`}</text>`;
      let porque;
      if (S.tx === 'pt' && !abierto && pg > 0) porque = `El transmisor del fondo también siente los <b>${f(pg, 0)} kPa del gas</b> y los confunde con líquido. En un tanque cerrado se usa un <b>diferencial</b>: el lado L resta la presión de arriba.`;
      else if (S.cal !== '1' && L.rho !== 1000) porque = `Se configuró para agua, pero el ${L.n.toLowerCase()} tiene ρ = ${L.rho}: la misma altura hace ${L.rho > 1000 ? 'más' : 'menos'} presión. El nivel indicado sale ${L.rho > 1000 ? '+' : ''}${f((L.rho / 1000 - 1) * 100, 0)} % corrido: <b>hay que configurar la densidad real</b>.`;
      else porque = `Correcto: <b>h = P ÷ (ρ · g)</b>. Cada metro de agua hace ≈ 9,81 kPa.${S.liq === 'pulpa' ? ' Con pulpa, la toma se tapa: se usa un <b>sello de diafragma</b> al ras.' : ''}`;
      q('[data-rol=lh]').innerHTML = S2.ficha([
        ['Líquido (ρ·g·h)', `<b>${f(pl, 2)} kPa</b>`],
        ...(abierto ? [] : [['Gas arriba', `${f(pg, 0)} kPa`]]),
        ['Mide el transmisor', `<b>${f(lect, 2)} kPa</b>`],
        ['Nivel indicado', `<b style="font-size:1.08rem">${f(hInd)} m</b> ${chipOk(ok, 'correcto', 'con error')}`],
        ['¿Por qué?', porque]
      ]);
      q('[data-d=h] output').textContent = f(S.h) + ' m';
      q('[data-d=pgas] output').textContent = S.pgas + ' kPa';
      q('[data-rol=gas]').classList.toggle('oculto', abierto);
    };

    // ---------- tiempo de vuelo ----------
    const UX0 = 170, UX1 = 370, UY0 = 70, UY1 = 380, HT = 6, PXT = (UY1 - UY0) / HT;
    let pulsoT = 0;
    const calcT = () => {
      const d = HT - S.hT;
      if (S.tipo === 'us') {
        const c = 331.3 + 0.606 * S.temp;
        const cu = S.comp === '1' ? c : 343.4;
        const t = (2 * d) / c;
        const zona = d < 0.35;
        const dm = (cu * t) / 2;
        return { d, c, cu, t, dm, hm: HT - dm, zona, malVapor: S.vapor === '1' };
      }
      const t = (2 * d) / 299792458;
      return { d, c: 299792458, cu: 299792458, t, dm: d, hm: S.hT, zona: d < 0.1, malVapor: false };
    };
    const pintarT = () => {
      const r = calcT();
      const yL = UY1 - S.hT * PXT;
      const us = S.tipo === 'us';
      const L = LIQ.agua;
      const vapor = S.vapor === '1' ? [0, 1, 2, 3, 4].map((i) => `<path d="M${UX0 + 30 + i * 36},${yL - 6} q 8,-14 0,-28 q -8,-14 0,-28" stroke="#b9c3cf" stroke-width="3" fill="none" opacity=".8"/>`).join('') : '';
      const sensor = us
        ? `<rect x="250" y="${UY0 - 44}" width="40" height="30" rx="4" fill="#fff" stroke="#2f3b4a" stroke-width="2"/><rect x="254" y="${UY0 - 14}" width="32" height="10" fill="#2f3b4a"/>
           <text x="300" y="${UY0 - 26}" font-size="11.5" font-weight="700" font-family="var(--mono)">LT ultrasónico</text>`
        : `<rect x="252" y="${UY0 - 48}" width="36" height="22" rx="4" fill="#fff" stroke="#2f3b4a" stroke-width="2"/><path d="M258,${UY0 - 26} L244,${UY0 + 2} H296 L282,${UY0 - 26} Z" fill="#e7f0fb" stroke="#2f3b4a" stroke-width="2"/>
           <text x="300" y="${UY0 - 32}" font-size="11.5" font-weight="700" font-family="var(--mono)">LT radar</text>`;
      const reglas = [0, 1, 2, 3, 4, 5, 6].map((m) => `<line x1="${UX0}" x2="${UX0 + 12}" y1="${UY1 - m * PXT}" y2="${UY1 - m * PXT}" stroke="#8e99a6"/><text x="${UX0 + 16}" y="${UY1 - m * PXT + 4}" font-size="10.5" fill="#465366" ${halo}>${m} m</text>`).join('');
      const ok = !r.zona && !r.malVapor && Math.abs(r.hm - S.hT) < 0.02;
      const tTxt = us ? `${f(r.t * 1000, 2)} ms` : `${f(r.t * 1e9, 1)} ns`;
      svgT.innerHTML = `
        <rect x="${UX0 + 2}" y="${yL}" width="${UX1 - UX0 - 4}" height="${UY1 - yL}" fill="${L.col}"/>
        <line x1="${UX0 + 2}" x2="${UX1 - 2}" y1="${yL}" y2="${yL}" stroke="${L.borde}" stroke-width="2"/>
        ${vapor}
        <path d="M${UX0},${UY0} V${UY1} H${UX1} V${UY0} Z" fill="none" stroke="#5d6a7a" stroke-width="3"/>
        ${reglas}${sensor}
        <g id="${id}-pulso"></g>
        <line x1="${UX1 + 22}" x2="${UX1 + 22}" y1="${UY0}" y2="${yL}" stroke="#1d5fb4" stroke-width="1.6" marker-start="url(#${id}-az)" marker-end="url(#${id}-az)"/>
        <text x="${UX1 + 30}" y="${(UY0 + yL) / 2}" font-size="12" font-weight="700" fill="#154a8c" ${halo}>d = ${f(r.d)} m</text>
        <line x1="${UX1 + 22}" x2="${UX1 + 22}" y1="${yL}" y2="${UY1}" stroke="#1b8a5a" stroke-width="1.6" marker-start="url(#${id}-vd)" marker-end="url(#${id}-vd)"/>
        <text x="${UX1 + 30}" y="${(yL + UY1) / 2}" font-size="12" font-weight="700" fill="#146b46" ${halo}>nivel = ${f(S.hT)} m</text>
        <text x="${UX0 - 10}" y="${UY0 + 14}" text-anchor="end" font-size="11" fill="#465366">H = 6 m</text>
        <text x="${UX0 - 10}" y="${UY0 + 28}" text-anchor="end" font-size="11" fill="#465366">(sensor → fondo)</text>
        ${S2.marcadores(id)}
        <rect x="120" y="390" width="320" height="26" rx="13" fill="${ok ? '#e3f4eb' : '#fbe8e5'}" stroke="${ok ? '#1b8a5a' : '#c0392b'}"/>
        <text x="280" y="407" text-anchor="middle" font-size="12.5" font-weight="700" fill="${ok ? '#146b46' : '#97271c'}">${r.zona ? 'zona muerta: no distingue el eco' : r.malVapor ? 'eco débil: lectura inestable' : `indica ${f(r.hm)} m${ok ? ' ✓' : ` (error ${r.hm - S.hT > 0 ? '+' : ''}${f(r.hm - S.hT)} m)`}`}</text>`;
      const notas = us
        ? (r.zona ? 'Muy cerca del sensor el eco vuelve mientras la membrana todavía vibra: es la <b>zona muerta</b> (≈ 0,3 m). No se debe llenar hasta ahí.'
          : r.malVapor ? 'El vapor y la espuma <b>absorben y desvían el sonido</b>, y cambian su velocidad: el eco llega débil o no llega. En ese caso se usa radar.'
            : S.comp !== '1' && Math.abs(S.temp - 20) > 1 ? `El sonido viaja a <b>${f(r.c, 1)} m/s</b> a ${S.temp} °C, pero el sensor sin compensar usa 343,4 m/s (20 °C): la distancia sale mal. Los ultrasónicos traen un sensor de temperatura.`
              : 'Mide el tiempo del eco: <b>d = v · t ÷ 2</b> (ida y vuelta), y el nivel es <b>H − d</b>. Económico, sin contacto; para agua, tanques abiertos y sólidos sin polvo.')
        : (r.zona ? 'Pegado a la antena tampoco distingue el eco (zona muerta de unos centímetros).'
          : 'Las microondas viajan a la velocidad de la luz: el viaje dura <b>nanosegundos</b> y el sensor mide la diferencia de frecuencia (FMCW). No le afectan la temperatura, la presión ni el vapor: es la opción para tanques de proceso difíciles.');
      q('[data-rol=lt]').innerHTML = S2.ficha([
        ['Tiempo de ida y vuelta', `<b>${tTxt}</b>`],
        ['Velocidad', us ? `real ${f(r.c, 1)} m/s · usa ${f(r.cu, 1)} m/s` : '≈ 300 000 km/s (luz)'],
        ['Distancia d = v·t ÷ 2', `${f(r.dm)} m`],
        ['Nivel = H − d', `<b style="font-size:1.08rem">${r.zona || r.malVapor ? '—' : f(r.hm) + ' m'}</b> ${chipOk(ok, 'correcto', r.zona || r.malVapor ? 'no confiable' : 'con error')}`],
        ['¿Por qué?', notas]
      ]);
      q('[data-d=hT] output').textContent = f(S.hT) + ' m';
      q('[data-d=temp] output').textContent = S.temp + ' °C';
      q('[data-rol=solo-us]').classList.toggle('oculto', !us);
    };
    const dibujarPulso = (t) => {
      if (S.tab !== 'tof') return;
      const g = svgT.querySelector('#' + id + '-pulso');
      if (!g) return;
      const r = calcT();
      if (r.zona) { g.innerHTML = ''; return; }
      const yL = UY1 - S.hT * PXT;
      const ciclo = 1.6, fase = (t % ciclo) / ciclo;
      const baja = fase < 0.5;
      const y = baja ? UY0 + 4 + (yL - UY0 - 4) * (fase / 0.5) : yL - (yL - UY0 - 4) * ((fase - 0.5) / 0.5);
      const col = S.tipo === 'us' ? '#1d5fb4' : '#e0782b';
      const op = !baja && r.malVapor ? 0.15 : 1;
      const arcos = [0, 10, 20].map((k) => {
        const yy = baja ? y - k : y + k;
        const w = 22 + (yy - UY0) * 0.18;
        return `<path d="M${270 - w},${yy} Q270,${yy + (baja ? 10 : -10)} ${270 + w},${yy}" stroke="${col}" stroke-width="2.6" fill="none" opacity="${op * (1 - k / 30)}"/>`;
      }).join('');
      g.innerHTML = arcos + `<text x="${270 - 40}" y="${y + (baja ? -18 : 26)}" text-anchor="end" font-size="11" font-weight="700" fill="${col}" ${halo}>${baja ? 'pulso' : 'eco'}</text>`;
    };

    const segs = {};
    [['abierto', pintarH], ['tx', pintarH], ['liq', pintarH], ['cal', pintarH], ['tipo', pintarT], ['comp', pintarT], ['vapor', pintarT]].forEach(([k, fn]) => {
      segs[k] = S2.segmentado(cont, k, (v) => { S[k] = v; segs[k](v); fn(); });
      segs[k](S[k]);
    });
    [['h', pintarH], ['pgas', pintarH], ['hT', pintarT], ['temp', pintarT]].forEach(([k, fn]) => {
      const d = S2.deslizador(cont, k, (v) => { S[k] = v; fn(); });
      d.poner(S[k]);
    });
    const ir = S2.pestanas(cont, (t) => { S.tab = t; });
    pintarH(); pintarT(); ir(S.tab);
    const parar = animar(dibujarPulso);
    return { destruir: () => parar() };
  };
  II.diagramas.nivelTOF = (c, o = {}) => II.diagramas.nivel(c, { ...o, pestana: 'tof' });

  // ============================================================
  // 2) FLUJO
  // ============================================================
  II.diagramas.flujo = function (cont, opts = {}) {
    const id = uid();
    const tabs = ['placa', 'turbina', 'mag'];
    const S = { tab: tabs.includes(opts.pestana) ? opts.pestana : 'placa', q: 60, raiz: '1', qt: 80, gastado: '0', v: 2, fl: 'agua', lleno: '1', litros: 0 };
    const QMAX = 100, DPMAX = 25, K = 60, B = 0.01, D = 0.1;
    cont.innerHTML = `
      <div class="diagrama">
        <div class="controles"><div class="segmentado" data-rol="tab"><button data-t="placa">Placa orificio (ΔP)</button><button data-t="turbina">Turbina</button><button data-t="mag">Electromagnético</button></div></div>
        <div data-tab="placa"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 640 420" id="${id}-p" role="img" aria-label="Placa orificio con tomas de presión y perfil de presión"></svg></div>
          <div class="panel-info">
            ${desl('q', 'Caudal que pasa', 0, 100, 1)}
            <label class="campo"><span>¿Quién saca la raíz cuadrada?</span>${seg('raiz', [['1', 'El transmisor (salida lineal en caudal)'], ['0', 'Nadie (salida lineal en ΔP)']])}</label>
            <svg viewBox="0 0 260 150" id="${id}-pc" style="margin:4px 0 8px;max-width:300px" role="img" aria-label="Curva de presión diferencial contra caudal"></svg>
            <div data-rol="lp"></div>
          </div></div></div>
        <div data-tab="turbina"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 640 380" id="${id}-u" role="img" aria-label="Rotor de turbina y tren de pulsos"></svg></div>
          <div class="panel-info">
            ${desl('qt', 'Caudal que pasa', 0, 200, 1)}
            <label class="campo"><span>Estado de la turbina</span>${seg('gastado', [['0', 'Nueva'], ['1', 'Rodamiento gastado']])}</label>
            <div data-rol="lu"></div>
          </div></div></div>
        <div data-tab="mag"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 660 380" id="${id}-m" role="img" aria-label="Corte de un caudalímetro electromagnético"></svg></div>
          <div class="panel-info">
            ${desl('v', 'Velocidad del líquido', 0, 5, 0.05)}
            <label class="campo"><span>Líquido</span>${seg('fl', Object.entries(LIQ).map(([k, d]) => [k, d.n]))}</label>
            <label class="campo"><span>Tubería</span>${seg('lleno', [['1', 'Llena'], ['0', 'Medio llena']])}</label>
            <div data-rol="lm"></div>
          </div></div></div>
      </div>`;
    const q = (s) => cont.querySelector(s);
    const svgP = q('#' + id + '-p'), svgPC = q('#' + id + '-pc'), svgU = q('#' + id + '-u'), svgM = q('#' + id + '-m');

    // ---------- placa orificio ----------
    const pintarP = () => {
      const dp = DPMAX * Math.pow(S.q / 100, 2);
      const A = 110 * Math.pow(S.q / 100, 2);
      const P0 = 282;
      const dur = S.q > 0 ? clamp(60 / S.q, 0.35, 6) : 0;
      const lineas = [-26, -13, 0, 13, 26].map((o) => `<path class="svg-flujo ${S.q ? '' : 'quieto'}" style="animation-duration:${dur}s" d="M24,${190 + o} C200,${190 + o} 260,${190 + o * 0.85} 300,${190 + o * 0.55} S360,${190 + o * 0.42} 400,${190 + o * 0.6} S500,${190 + o} 616,${190 + o}"/>`).join('');
      const perfil = `M24,${P0} L230,${P0} C270,${P0} 285,${P0 + A * 0.5} 300,${P0 + A * 0.85} C315,${P0 + A} 330,${P0 + A} 345,${P0 + A} C400,${P0 + A} 440,${P0 + A * 0.62} 520,${P0 + A * 0.62} L616,${P0 + A * 0.62}`;
      const iRaiz = 4 + 16 * (S.q / 100);
      const iLin = 4 + 16 * (dp / DPMAX);
      const salida = S.raiz === '1' ? iRaiz : iLin;
      svgP.innerHTML = `${S2.marcadores(id + 'p')}
        <rect x="20" y="150" width="600" height="80" fill="#e8f3fd"/>
        <line x1="20" x2="620" y1="150" y2="150" stroke="#5d6a7a" stroke-width="4"/><line x1="20" x2="620" y1="230" y2="230" stroke="#5d6a7a" stroke-width="4"/>
        ${lineas}
        <rect x="297" y="140" width="7" height="34" fill="#2f3b4a"/><rect x="297" y="206" width="7" height="34" fill="#2f3b4a"/>
        <text x="300" y="132" text-anchor="middle" font-size="11.5" font-weight="700" fill="#16202c">placa</text>
        <text x="352" y="246" text-anchor="middle" font-size="10.5" fill="#465366">vena contracta</text>
        <line x1="220" x2="220" y1="150" y2="70" stroke="#c0392b" stroke-width="2.5"/><line x1="345" x2="345" y1="150" y2="70" stroke="#1d5fb4" stroke-width="2.5"/>
        <path d="M220,70 H250 M345,70 H315" stroke="#5d6a7a" stroke-width="2.5"/>
        <rect x="250" y="44" width="65" height="44" rx="7" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
        <text x="282" y="64" text-anchor="middle" font-size="11.5" font-weight="700" font-family="var(--mono)">FT</text><text x="282" y="80" text-anchor="middle" font-size="10" fill="#465366">(DP)</text>
        <text x="212" y="86" text-anchor="end" font-size="11" font-weight="700" fill="#c0392b">H</text><text x="353" y="86" font-size="11" font-weight="700" fill="#1d5fb4">L</text>
        <text x="330" y="40" font-size="12" font-weight="700" fill="#154a8c" ${halo}>ΔP = ${f(dp, 2)} kPa → ${f(salida, 2)} mA</text>
        <text x="24" y="266" font-size="11" font-weight="700" fill="#16202c">Presión a lo largo de la tubería</text>
        <path d="${perfil}" stroke="#1d5fb4" stroke-width="3" fill="none"/>
        ${A > 6 ? `<line x1="345" x2="345" y1="${P0}" y2="${P0 + A}" stroke="#c0392b" stroke-width="1.6" marker-start="url(#${id}p-rj)" marker-end="url(#${id}p-rj)"/>
          <text x="353" y="${P0 + Math.min(A / 2, 40) + 4}" font-size="11" font-weight="700" fill="#97271c" ${halo}>ΔP medido (H − L)</text>
          <line x1="580" x2="580" y1="${P0}" y2="${P0 + A * 0.62}" stroke="#465366" stroke-width="1.4" marker-start="url(#${id}p-gr)" marker-end="url(#${id}p-gr)"/>
          <text x="574" y="${P0 + A * 0.31 + 4}" text-anchor="end" font-size="10.5" fill="#465366" ${halo}>pérdida permanente</text>` : ''}
        <line x1="24" x2="616" y1="${P0}" y2="${P0}" stroke="#d5dbe3" stroke-dasharray="4 4"/>
        <text x="320" y="414" text-anchor="middle" font-size="12" fill="#465366">La placa acelera el fluido: sube la velocidad y <tspan font-weight="700">baja la presión</tspan>. ΔP crece con el <tspan font-weight="700">cuadrado</tspan> del caudal.</text>`;
      // curva ΔP–Q
      const cx = (qq) => 34 + (qq / 100) * 210, cy = (d) => 128 - (d / DPMAX) * 110;
      let pts = ''; for (let qq = 0; qq <= 100; qq += 4) pts += `${cx(qq).toFixed(1)},${cy(DPMAX * (qq / 100) ** 2).toFixed(1)} `;
      svgPC.innerHTML = `<line x1="34" x2="246" y1="128" y2="128" stroke="#8e99a6"/><line x1="34" x2="34" y1="14" y2="128" stroke="#8e99a6"/>
        <polyline points="${pts}" fill="none" stroke="#1d5fb4" stroke-width="2.6"/>
        <line x1="${cx(S.q)}" x2="${cx(S.q)}" y1="128" y2="${cy(dp)}" stroke="#1d5fb4" stroke-dasharray="3 3"/><line x1="34" x2="${cx(S.q)}" y1="${cy(dp)}" y2="${cy(dp)}" stroke="#1d5fb4" stroke-dasharray="3 3"/>
        <circle cx="${cx(S.q)}" cy="${cy(dp)}" r="5" fill="#1d5fb4" stroke="#fff" stroke-width="2"/>
        <text x="140" y="146" text-anchor="middle" font-size="10.5" fill="#465366">caudal (% del máximo)</text>
        <text x="30" y="12" font-size="10.5" fill="#465366">ΔP (kPa)</text><text x="28" y="${cy(DPMAX) + 4}" text-anchor="end" font-size="9.5" fill="#465366">25</text>
        <text x="28" y="131" text-anchor="end" font-size="9.5" fill="#465366">0</text><text x="246" y="140" text-anchor="end" font-size="9.5" fill="#465366">100</text>`;
      const qPLC = S.raiz === '1' ? S.q : (QMAX * dp) / DPMAX;
      const ok = Math.abs(qPLC - S.q) < 0.6;
      q('[data-rol=lp]').innerHTML = S2.ficha([
        ['Caudal real', `<b>${f(S.q * QMAX / 100, 1)} m³/h</b> (${S.q} %)`],
        ['ΔP en la placa', `<b>${f(dp, 2)} kPa</b> = 25 × (${f(S.q / 100, 2)})²`],
        ['Salida', `<b>${f(salida, 2)} mA</b>`],
        ['El PLC muestra', `<b>${f(qPLC, 1)} m³/h</b> ${chipOk(ok, 'correcto', 'error: falta la raíz')}`],
        ['Ojo', S.q <= 20 && S.q > 0 ? `Con ${S.q} % de caudal la ΔP es solo ${f((S.q / 100) ** 2 * 100, 1)} % del máximo: casi no hay señal. Por eso una placa se usa entre ≈ 30 y 100 % (rango 3:1 a 4:1).`
          : 'Q = Qmáx · √(ΔP ÷ ΔPmáx). Placa: barata, sin partes móviles, sirve para líquidos, gases y vapor (ISO 5167). Necesita tramo recto antes y después.']
      ]);
      q('[data-d=q] output').textContent = S.q + ' %';
    };

    // ---------- turbina ----------
    let ang = 0, tAnt = null, pulsos = [];
    const pintarU = () => {
      const qe = S.qt * (S.gastado === '1' ? 0.85 : 1);
      const fr = (K * qe) / 60;
      const qInd = (fr * 60) / K;
      const ok = Math.abs(qInd - S.qt) < 0.5;
      q('[data-rol=lu]').innerHTML = S2.ficha([
        ['Factor K (placa del equipo)', `${K} pulsos por litro`],
        ['Frecuencia', `<b>${f(fr, 1)} Hz</b> (pulsos por segundo)`],
        ['Caudal = f · 60 ÷ K', `<b>${f(qInd, 1)} L/min</b> ${chipOk(ok, 'correcto', 'marca de menos')}`],
        ['Totalizador', `<b data-rol="tot">${f(S.litros, 1)}</b> L`],
        ['¿Por qué?', S.gastado === '1' ? 'El rodamiento gastado <b>frena el rotor</b>: gira más lento que el líquido y marca de menos. Por eso la turbina pide líquido limpio y mantenimiento.'
          : 'El líquido hace girar el rotor; un sensor magnético cuenta cada álabe que pasa. <b>Más caudal → más pulsos por segundo</b>. Muy exacta para líquidos limpios y poco viscosos (combustibles, despacho).']
      ]);
      q('[data-d=qt] output').textContent = S.qt + ' L/min';
    };
    const dibujarU = (t) => {
      if (S.tab !== 'turbina') { tAnt = t; return; }
      const dt = tAnt == null ? 0 : Math.min(0.1, t - tAnt); tAnt = t;
      const qe = S.qt * (S.gastado === '1' ? 0.85 : 1);
      const fr = (K * qe) / 60;
      S.litros += (S.qt / 60) * dt * (S.gastado === '1' ? 0.85 : 1);
      // giro visible (más lento que el real para poder verlo)
      ang += dt * qe * 2.2;
      const blades = 6;
      const ver = (ang % (360 / blades)) < 6;
      let rotor = '';
      for (let i = 0; i < blades; i++) {
        const a = ((ang + (i * 360) / blades) * Math.PI) / 180;
        rotor += `<path d="M190,190 L${(190 + 92 * Math.cos(a - 0.12)).toFixed(1)},${(190 + 92 * Math.sin(a - 0.12)).toFixed(1)} L${(190 + 92 * Math.cos(a + 0.12)).toFixed(1)},${(190 + 92 * Math.sin(a + 0.12)).toFixed(1)} Z" fill="#aab3bf" stroke="#465366" stroke-width="1.5"/>`;
      }
      // tren de pulsos: frecuencia mostrada proporcional (escala 1:8)
      const X0 = 360, X1 = 620, nVis = clamp(fr / 8, 0, 40);
      let tren = `M${X0},230`;
      if (nVis > 0.05) {
        const per = (X1 - X0) / nVis, desp = ((t * fr) / 8) % 1 * per;
        for (let x = X0 - desp; x < X1; x += per) {
          const a = Math.max(X0, x), b = Math.min(X1, x + per / 2);
          if (b > a) tren += ` L${a.toFixed(1)},230 L${a.toFixed(1)},170 L${b.toFixed(1)},170 L${b.toFixed(1)},230`;
        }
      }
      tren += ` L${X1},230`;
      svgU.innerHTML = `
        <circle cx="190" cy="190" r="118" fill="#e8f3fd" stroke="#5d6a7a" stroke-width="6"/>
        ${rotor}<circle cx="190" cy="190" r="16" fill="#465366"/>
        <rect x="172" y="44" width="36" height="34" rx="4" fill="#fff" stroke="#2f3b4a" stroke-width="2"/><rect x="183" y="78" width="14" height="12" fill="#2f3b4a"/>
        <circle cx="190" cy="60" r="5" fill="${ver ? '#e0782b' : '#cfd6de'}"/>
        <text x="216" y="58" font-size="11.5" font-weight="700" fill="#16202c">sensor magnético</text>
        <text x="190" y="336" text-anchor="middle" font-size="12" fill="#465366">Vista de frente: el líquido entra hacia la pantalla</text>
        <text x="${X0}" y="150" font-size="12" font-weight="700" fill="#16202c">Pulsos que recibe el transmisor</text>
        <line x1="${X0}" x2="${X1}" y1="230" y2="230" stroke="#d5dbe3"/>
        <path d="${tren}" fill="none" stroke="#e0782b" stroke-width="2.4"/>
        <text x="${X0}" y="258" font-size="12" fill="#465366">${f(fr, 1)} pulsos por segundo (dibujo más lento)</text>
        <text x="${X0}" y="294" font-size="13" font-weight="700" fill="#154a8c">Q = f · 60 ÷ K</text>
        <text x="${X0}" y="314" font-size="13" font-weight="700" fill="#154a8c">= ${f(fr, 1)} · 60 ÷ ${K} = ${f((fr * 60) / K, 1)} L/min</text>`;
      const tot = q('[data-rol=tot]'); if (tot) tot.textContent = f(S.litros, 1);
    };

    // ---------- electromagnético ----------
    const pintarM = () => {
      const L = LIQ[S.fl];
      const lleno = S.lleno === '1';
      const e = L.cond && lleno ? 1000 * B * D * S.v : 0;
      const qm = S.v * Math.PI * D * D / 4 * 3600;
      const ok = L.cond && lleno;
      const cx = 200, cy = 190, R = 108;
      const nivelY = lleno ? cy - R : cy + 10;
      let cargas = '';
      if (L.cond && S.v > 0.05) {
        const sep = clamp(S.v / 5, 0, 1);
        for (let i = 0; i < 5; i++) {
          const y = cy - 60 + i * 30;
          if (y < nivelY + 6) continue;
          cargas += `<text x="${cx + 30 + 50 * sep}" y="${y + 5}" font-size="16" font-weight="700" fill="#c0392b" text-anchor="middle">+</text><text x="${cx - 30 - 50 * sep}" y="${y + 5}" font-size="18" font-weight="700" fill="#1d5fb4" text-anchor="middle">−</text>`;
        }
      }
      const cruces = [];
      for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { const x = cx + i * 34, y = cy + j * 34; if ((x - cx) ** 2 + (y - cy) ** 2 < (R - 14) ** 2 && y > nivelY + 8) cruces.push(`<g opacity=".45"><circle cx="${x}" cy="${y}" r="7" fill="none" stroke="#465366" stroke-width="1.4"/><path d="M${x - 4},${y - 4} L${x + 4},${y + 4} M${x + 4},${y - 4} L${x - 4},${y + 4}" stroke="#465366" stroke-width="1.4"/></g>`); }
      svgM.innerHTML = `${S2.marcadores(id + 'm')}
        <defs><clipPath id="${id}-cl"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath></defs>
        <rect x="${cx - 70}" y="22" width="140" height="34" rx="6" fill="#fbf1de" stroke="#b7791f" stroke-width="2"/><text x="${cx}" y="44" text-anchor="middle" font-size="12" font-weight="700" fill="#8a5a12">bobina</text>
        <rect x="${cx - 70}" y="324" width="140" height="34" rx="6" fill="#fbf1de" stroke="#b7791f" stroke-width="2"/><text x="${cx}" y="346" text-anchor="middle" font-size="12" font-weight="700" fill="#8a5a12">bobina</text>
        <rect x="${cx - R}" y="${nivelY}" width="${2 * R}" height="${cy + R - nivelY}" fill="${L.col}" clip-path="url(#${id}-cl)"/>
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#5d6a7a" stroke-width="10"/>
        ${[-60, -20, 20, 60].map((dx) => `<line x1="${cx + dx}" y1="${cy - R + 12}" x2="${cx + dx}" y2="${cy + R - 14}" stroke="#b7791f" stroke-width="1.6" stroke-dasharray="5 5" marker-end="url(#${id}m-nj)"/>`).join('')}
        ${cruces.join('')}${cargas}
        <rect x="${cx - R - 14}" y="${cy - 9}" width="16" height="18" fill="#2f3b4a"/><rect x="${cx + R - 2}" y="${cy - 9}" width="16" height="18" fill="#2f3b4a"/>
        <text x="${cx - R - 22}" y="${cy - 14}" text-anchor="end" font-size="10.5" fill="#465366">electrodo</text><text x="${cx + R + 22}" y="${cy - 14}" font-size="10.5" fill="#465366">electrodo</text>
        <path d="M${cx + R + 14},${cy} H470 V154" stroke="#2f3b4a" stroke-width="2" fill="none"/><path d="M${cx - R - 14},${cy} H${cx - R - 30} V372 H645 V125 H590" stroke="#2f3b4a" stroke-width="2" fill="none"/>
        <rect x="440" y="96" width="150" height="58" rx="10" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
        <text x="515" y="118" text-anchor="middle" font-size="11" fill="#465366">tensión en los electrodos</text>
        <text x="515" y="142" text-anchor="middle" font-size="17" font-weight="700" fill="#154a8c">${f(e, 2)} mV</text>
        <text x="440" y="218" font-size="12.5" font-weight="700" fill="#16202c">E = B · D · v</text>
        <text x="440" y="238" font-size="11.5" fill="#465366">B: campo de las bobinas</text>
        <text x="440" y="256" font-size="11.5" fill="#465366">D: diámetro (${D * 1000} mm)</text>
        <text x="440" y="274" font-size="11.5" fill="#465366">v: velocidad del líquido</text>
        <text x="440" y="308" font-size="11.5" fill="#465366">Corte de la tubería: el líquido</text><text x="440" y="324" font-size="11.5" fill="#465366">entra hacia la pantalla (⊗)</text>`;
      q('[data-rol=lm]').innerHTML = S2.ficha([
        ['Tensión', `<b>${f(e, 2)} mV</b>`],
        ['Caudal que indica', `<b>${ok ? f(qm, 1) : '—'} m³/h</b> ${chipOk(ok, 'correcto', 'no mide')}`],
        ['¿Por qué?', !L.cond ? 'El diésel <b>no conduce la electricidad</b>: no hay cargas que separar y no aparece tensión. El magnético solo sirve para líquidos conductores (agua, leche, pulpa, ácidos).'
          : !lleno ? 'Con la tubería medio llena los electrodos quedan al aire y el área no es la del tubo: la lectura es <b>errática o falsa</b>. Se instala donde la tubería siempre vaya llena (por ejemplo, en un tramo que sube).'
            : 'Es la ley de Faraday: un conductor (el líquido) que se mueve dentro de un campo magnético genera tensión. <b>Sin partes móviles ni obstrucción</b>: ideal para pulpas, aguas residuales y alimentos.']
      ]);
      q('[data-d=v] output').textContent = f(S.v) + ' m/s';
    };

    const segs = {};
    [['raiz', pintarP], ['gastado', pintarU], ['fl', pintarM], ['lleno', pintarM]].forEach(([k, fn]) => {
      segs[k] = S2.segmentado(cont, k, (v) => { S[k] = v; segs[k](v); fn(); });
      segs[k](S[k]);
    });
    [['q', pintarP], ['qt', pintarU], ['v', pintarM]].forEach(([k, fn]) => { S2.deslizador(cont, k, (v) => { S[k] = v; fn(); }).poner(S[k]); });
    const ir = S2.pestanas(cont, (t) => { S.tab = t; });
    pintarP(); pintarU(); pintarM(); ir(S.tab);
    const parar = animar(dibujarU);
    return { destruir: () => parar() };
  };
  II.diagramas.flujoOtros = (c, o = {}) => II.diagramas.flujo(c, { ...o, pestana: 'turbina' });

  // ============================================================
  // 3) LAZO 4–20 mA
  // ============================================================
  const VARS = {
    t: { n: 'Temperatura', u: '°C', lrv: 0, urv: 150, tag: 'TT-103' },
    l: { n: 'Nivel', u: 'm', lrv: 0, urv: 4, tag: 'LT-101' },
    p: { n: 'Presión', u: 'bar', lrv: 0, urv: 10, tag: 'PT-104' },
    q: { n: 'Caudal', u: 'm³/h', lrv: 0, urv: 100, tag: 'FT-102' },
    t2: { n: 'Temperatura con cero desplazado', u: '°C', lrv: -20, urv: 180, tag: 'TT-105' }
  };
  II.diagramas.lazo420 = function (cont, opts = {}) {
    const id = uid();
    const S = { tab: opts.pestana === 'escala' ? 'escala' : 'lazo', pv: 50, largo: 300, carga: '250', falla: 'no', ruido: '0', var: 't', pvE: 75 };
    const VF = 24, VMIN = 12, RHILO = 0.036; // fuente, mínimo del transmisor, Ω/m de un conductor de 0,5 mm²
    cont.innerHTML = `
      <div class="diagrama">
        <div class="controles"><div class="segmentado" data-rol="tab"><button data-t="lazo">El lazo de corriente</button><button data-t="escala">Escalado: de la variable a los mA</button></div></div>
        <div data-tab="lazo"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 640 410" id="${id}-l" role="img" aria-label="Lazo de corriente 4 a 20 mA con fuente, transmisor y entrada del PLC"></svg></div>
          <div class="panel-info">
            ${desl('pv', 'Variable medida (% del rango)', 0, 100, 1)}
            ${desl('largo', 'Largo del cable (ida)', 0, 2000, 50)}
            <label class="campo"><span>Resistencia de entrada del PLC</span>${seg('carga', [['250', '250 Ω'], ['500', '500 Ω'], ['750', '750 Ω']])}</label>
            <label class="campo"><span>Simular una falla</span>${seg('falla', [['no', 'Ninguna'], ['abierto', 'Cable cortado'], ['baja', 'Sensor dañado (alarma baja)'], ['alta', 'Alarma alta']])}</label>
            <label class="campo"><span>Interferencia (motor grande cerca)</span>${seg('ruido', [['0', 'No'], ['1', 'Sí']])}</label>
            <div data-rol="ll"></div>
            <svg viewBox="0 0 300 130" id="${id}-r" style="margin-top:10px" role="img" aria-label="Comparación de señal en voltaje y en corriente con interferencia"></svg>
          </div></div></div>
        <div data-tab="escala"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 640 400" id="${id}-e" role="img" aria-label="Recta de escalado de 4 a 20 mA con zonas NAMUR NE 43"></svg></div>
          <div class="panel-info">
            <label class="campo"><span>Instrumento</span>${seg('var', Object.entries(VARS).map(([k, v]) => [k, `${v.tag} · ${v.n.split(' ')[0]} ${v.lrv} a ${v.urv} ${v.u}`]))}</label>
            ${desl('pvE', 'Valor de la variable (incluye fuera de rango)', -10, 110, 0.5)}
            <div data-rol="le"></div>
          </div></div></div>
      </div>`;
    const q = (s) => cont.querySelector(s);
    const svgL = q('#' + id + '-l'), svgR = q('#' + id + '-r'), svgE = q('#' + id + '-e');

    const calc = () => {
      const rc = 2 * S.largo * RHILO, rl = +S.carga, rt = rc + rl;
      const imax = ((VF - VMIN) / rt) * 1000;
      let ideal = S.falla === 'baja' ? 3.6 : S.falla === 'alta' ? 21.5 : 4 + (16 * S.pv) / 100;
      let i = S.falla === 'abierto' ? 0 : Math.min(ideal, imax);
      const sat = S.falla !== 'abierto' && ideal > imax + 1e-9;
      return { rc, rl, rt, imax, ideal, i, sat, vplc: (i / 1000) * rl, vtx: S.falla === 'abierto' ? VF : VF - (i / 1000) * rt };
    };
    // interpretación del PLC según NAMUR NE 43
    const interpretar = (i) => {
      if (i < 1) return { txt: 'FALLA: no circula corriente (lazo abierto o sin fuente)', cls: 'mal' };
      if (i <= 3.6) return { txt: 'FALLA del instrumento (alarma baja ≤ 3,6 mA)', cls: 'mal' };
      if (i >= 21) return { txt: 'FALLA del instrumento (alarma alta ≥ 21 mA)', cls: 'mal' };
      if (i < 4 || i > 20) return { txt: 'Fuera de rango (saturación), pero el lazo funciona', cls: 'duda' };
      return { txt: 'Señal válida', cls: 'ok' };
    };
    let fase = 0;
    const pintarL = () => {
      const r = calc();
      const it = interpretar(r.i);
      const pvPLC = ((r.i - 4) / 16) * 100;
      const corte = S.falla === 'abierto';
      if (r.sat && it.cls === 'ok') { it.cls = 'duda'; it.txt = 'Parece válida, pero la corriente se quedó corta'; }
      svgL.innerHTML = `
        <path id="${id}-ruta" d="M70,90 H580 V330 H70 Z" fill="none" stroke="#2f3b4a" stroke-width="3"/>
        ${corte ? '<rect x="425" y="80" width="30" height="20" fill="#fbfcfe"/><path d="M425,80 L433,100 M447,80 L455,100" stroke="#c0392b" stroke-width="3"/><text x="440" y="72" text-anchor="middle" font-size="12" font-weight="700" fill="#c0392b">cable cortado</text>' : ''}
        <g id="${id}-pt"></g>
        <rect x="30" y="170" width="80" height="80" rx="8" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
        <text x="70" y="200" text-anchor="middle" font-size="12" font-weight="700">Fuente</text><text x="70" y="222" text-anchor="middle" font-size="17" font-weight="700" fill="#154a8c">24 V</text>
        <text x="70" y="240" text-anchor="middle" font-size="10" fill="#465366">(en el tablero)</text>
        <rect x="522" y="160" width="114" height="100" rx="10" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
        <text x="580" y="186" text-anchor="middle" font-size="12" font-weight="700">Transmisor</text><text x="580" y="202" text-anchor="middle" font-size="10.5" fill="#465366">2 hilos (en campo)</text>
        <text x="580" y="228" text-anchor="middle" font-size="15" font-weight="700" fill="#154a8c">${S.falla === 'baja' || S.falla === 'alta' ? 'falla' : S.pv + ' %'}</text>
        <text x="580" y="248" text-anchor="middle" font-size="10" fill="#465366">necesita ≥ 12 V</text>
        <rect x="262" y="66" width="116" height="48" rx="8" fill="#fff" stroke="#1d5fb4" stroke-width="2"/>
        <text x="320" y="84" text-anchor="middle" font-size="10.5" fill="#465366">corriente del lazo</text><text x="320" y="106" text-anchor="middle" font-size="17" font-weight="700" fill="#154a8c">${f(r.i, 2)} mA</text>
        <rect x="290" y="316" width="60" height="28" rx="4" fill="#fbf1de" stroke="#b7791f" stroke-width="2"/><text x="320" y="335" text-anchor="middle" font-size="11.5" font-weight="700" fill="#8a5a12">${r.rl} Ω</text>
        <text x="320" y="364" text-anchor="middle" font-size="11" fill="#465366">entrada del PLC: V = I · R = ${f(r.vplc, 2)} V</text>
        <text x="440" y="124" text-anchor="middle" font-size="11" fill="#465366">cable: ${S.largo} m (2 × ${f(S.largo * RHILO, 1)} Ω)</text>
        <text x="330" y="205" text-anchor="middle" font-size="12" fill="#465366">la misma corriente pasa por todo el lazo</text>
        <rect x="140" y="378" width="360" height="26" rx="13" fill="${it.cls === 'ok' ? '#e3f4eb' : it.cls === 'duda' ? '#fbf1de' : '#fbe8e5'}" stroke="${it.cls === 'ok' ? '#1b8a5a' : it.cls === 'duda' ? '#b7791f' : '#c0392b'}"/>
        <text x="320" y="395" text-anchor="middle" font-size="12" font-weight="700" fill="${it.cls === 'ok' ? '#146b46' : it.cls === 'duda' ? '#8a5a12' : '#97271c'}">PLC: ${r.sat && r.i >= 4 ? `${f(pvPLC, 1)} % (el real es ${S.pv} %)` : it.cls === 'ok' ? `${f(pvPLC, 1)} % del rango` : it.txt.split(' (')[0]}</text>`;
      q('[data-rol=ll]').innerHTML = S2.ficha([
        ['Corriente', `<b>${f(r.i, 2)} mA</b>${r.sat ? ' <span class="chip mal">no alcanza</span>' : ''}`],
        ['Tensión en el PLC', `${f(r.vplc, 2)} V`],
        ['Le queda al transmisor', `${f(r.vtx, 1)} V ${chipOk(r.vtx >= VMIN - 0.05 || corte, '≥ 12 V', 'menos de 12 V')}`],
        ['Carga máxima', `(24 − 12) ÷ 0,020 = <b>600 Ω</b> en total (cable + PLC). Ahora: ${f(r.rt, 0)} Ω`],
        ['El PLC entiende', `<span class="chip ${it.cls}">${it.txt}</span>`],
        ['¿Por qué?', corte ? 'Sin camino, no circula corriente: <b>0 mA</b>. Como el mínimo normal es 4 mA ("cero vivo"), el PLC sabe que es una falla y no "variable en cero".'
          : S.falla === 'baja' ? 'El transmisor detectó su sensor roto y lleva la corriente a <b>3,6 mA</b> a propósito (NAMUR NE 43) para avisar.'
            : S.falla === 'alta' ? 'Algunos transmisores se configuran para avisar la falla con <b>≥ 21 mA</b>. Se elige alta o baja según qué sea más seguro para el proceso.'
              : r.sat ? `Demasiada resistencia: con ${f(r.rt, 0)} Ω la fuente solo puede empujar ${f(r.imax, 1)} mA y la lectura se queda corta arriba. Hay que acortar, usar cable más grueso o bajar la carga.`
                : 'I = 4 + 16 · (% ÷ 100). En un lazo en serie la misma corriente pasa por todo: el largo del cable no cambia la medida mientras la fuente alcance.']
      ]);
      q('[data-d=pv] output').textContent = S.pv + ' %';
      q('[data-d=largo] output').textContent = S.largo + ' m';
      pintarRuido();
    };
    const pintarRuido = () => {
      const r = calc();
      const pct = S.falla === 'no' ? S.pv : null;
      const rnd = II.rng('ruido' + S.pv + S.largo);
      let pv = '', pi = '';
      const yV = (x) => 58 - (x / 100) * 40, yI = (x) => 120 - (x / 100) * 40;
      for (let k = 0; k <= 60; k++) {
        const x = 14 + k * 4.6;
        const nV = S.ruido === '1' ? (rnd() - 0.5) * 14 : 0;
        const nI = S.ruido === '1' ? (rnd() - 0.5) * 0.8 : 0;
        const caida = (S.largo / 2000) * 4; // en voltaje la caída del cable también resta
        pv += `${x.toFixed(1)},${(yV(pct == null ? 0 : pct - caida) + nV).toFixed(1)} `;
        pi += `${x.toFixed(1)},${(yI(pct == null ? 0 : ((r.i - 4) / 16) * 100) + nI).toFixed(1)} `;
      }
      svgR.innerHTML = `<text x="14" y="12" font-size="11" font-weight="700" fill="#16202c">Si la señal fuera 0–10 V (voltaje)</text>
        <polyline points="${pv}" fill="none" stroke="#c0392b" stroke-width="1.8"/>
        <text x="14" y="76" font-size="11" font-weight="700" fill="#16202c">Señal 4–20 mA (corriente)</text>
        <polyline points="${pi}" fill="none" stroke="#1b8a5a" stroke-width="1.8"/>`;
    };
    const dibujarPuntos = (t) => {
      if (S.tab !== 'lazo') return;
      const g = svgL.querySelector('#' + id + '-pt');
      if (!g) return;
      const r = calc();
      if (r.i < 0.5) { g.innerHTML = ''; return; }
      fase = (fase + r.i * 0.35) % 1500; // perímetro del lazo: (510 + 240) × 2 = 1500
      let puntos = '';
      for (let k = 0; k < 20; k++) {
        const s = (fase + k * 75) % 1500;
        let x, y;
        if (s < 510) { x = 70 + s; y = 90; } else if (s < 750) { x = 580; y = 90 + (s - 510); } else if (s < 1260) { x = 580 - (s - 750); y = 330; } else { x = 70; y = 330 - (s - 1260); }
        puntos += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#1d5fb4"/>`;
      }
      g.innerHTML = puntos;
    };

    // ---------- escalado ----------
    const pintarE = () => {
      const V = VARS[S.var];
      const span = V.urv - V.lrv;
      const val = V.lrv + (S.pvE / 100) * span;
      const pct = S.pvE;
      const ideal = 4 + 16 * pct / 100;
      const i = clamp(ideal, 3.8, 20.5);
      const X0 = 70, X1 = 610, Y0 = 30, Y1 = 350;
      const sx = (p) => X0 + ((p + 10) / 120) * (X1 - X0), sy = (ma) => Y1 - (ma / 24) * (Y1 - Y0);
      const fmtV = (p) => f(V.lrv + (p / 100) * span, 2);
      svgE.innerHTML = `
        <rect x="${X0}" y="${sy(24)}" width="${X1 - X0}" height="${sy(21) - sy(24)}" fill="#fbe8e5"/>
        <rect x="${X0}" y="${sy(3.6)}" width="${X1 - X0}" height="${sy(0) - sy(3.6)}" fill="#fbe8e5"/>
        <rect x="${X0}" y="${sy(20.5)}" width="${X1 - X0}" height="${sy(20) - sy(20.5)}" fill="#fbf1de"/>
        <rect x="${X0}" y="${sy(4)}" width="${X1 - X0}" height="${sy(3.8) - sy(4)}" fill="#fbf1de"/>
        <text x="${X1 - 6}" y="${sy(22.2)}" text-anchor="end" font-size="11" fill="#97271c">falla (≥ 21 mA)</text>
        <text x="${X1 - 6}" y="${sy(1.6)}" text-anchor="end" font-size="11" fill="#97271c">falla (≤ 3,6 mA) · 0 mA = lazo abierto</text>
        ${[0, 4, 8, 12, 16, 20, 24].map((m) => `<line x1="${X0}" x2="${X1}" y1="${sy(m)}" y2="${sy(m)}" stroke="#eef1f5"/><text x="${X0 - 8}" y="${sy(m) + 4}" text-anchor="end" font-size="11" fill="#465366">${m} mA</text>`).join('')}
        ${[0, 25, 50, 75, 100].map((p) => `<line x1="${sx(p)}" x2="${sx(p)}" y1="${Y0}" y2="${Y1}" stroke="#eef1f5"/><text x="${sx(p)}" y="${Y1 + 16}" text-anchor="middle" font-size="10.5" fill="#465366">${p} %</text><text x="${sx(p)}" y="${Y1 + 31}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#154a8c">${fmtV(p)} ${V.u}</text>`).join('')}
        <polyline points="${sx(-10)},${sy(3.8)} ${sx(-1.25)},${sy(3.8)} ${sx(0)},${sy(4)} ${sx(100)},${sy(20)} ${sx(103.125)},${sy(20.5)} ${sx(110)},${sy(20.5)}" fill="none" stroke="#1d5fb4" stroke-width="3"/>
        <line x1="${sx(pct)}" x2="${sx(pct)}" y1="${Y1}" y2="${sy(i)}" stroke="#1d5fb4" stroke-dasharray="4 4"/><line x1="${X0}" x2="${sx(pct)}" y1="${sy(i)}" y2="${sy(i)}" stroke="#1d5fb4" stroke-dasharray="4 4"/>
        <circle cx="${sx(pct)}" cy="${sy(i)}" r="7" fill="#1d5fb4" stroke="#fff" stroke-width="2"/>
        <text x="${sx(pct) + (pct > 80 ? -12 : 12)}" y="${sy(i) - 10}" text-anchor="${pct > 80 ? 'end' : 'start'}" font-size="13" font-weight="700" fill="#154a8c" ${halo}>${f(val, 2)} ${V.u} → ${f(i, 2)} mA</text>
        <text x="${X0}" y="${Y0 - 10}" font-size="12" font-weight="700" fill="#16202c">${V.tag} · rango ${V.lrv} a ${V.urv} ${V.u} (LRV a URV)</text>`;
      const fuera = pct < 0 || pct > 100;
      q('[data-rol=le]').innerHTML = S2.ficha([
        ['Valor medido', `<b>${f(val, 2)} ${V.u}</b>`],
        ['% del rango', `(${f(val, 2)} − ${V.lrv}) ÷ ${span} = <b>${f(pct, 1)} %</b>`],
        ['Corriente', `4 + 16 × ${f(pct / 100, 3)} = <b>${f(ideal, 2)} mA</b>${fuera ? ` → se satura en <b>${f(i, 2)} mA</b>` : ''}`],
        ['Al revés (en el PLC)', `valor = LRV + (I − 4) ÷ 16 × span`],
        ['Zonas NAMUR NE 43', '3,8 a 20,5 mA: medida válida (con saturación fuera de rango). ≤ 3,6 o ≥ 21 mA: falla del instrumento.']
      ]);
      q('[data-d=pvE] output').textContent = `${f(val, 1)} ${V.u}`;
    };

    const segs = {};
    [['carga', pintarL], ['falla', pintarL], ['ruido', pintarL], ['var', pintarE]].forEach(([k, fn]) => {
      segs[k] = S2.segmentado(cont, k, (v) => { S[k] = v; segs[k](v); fn(); });
      segs[k](S[k]);
    });
    [['pv', pintarL], ['largo', pintarL], ['pvE', pintarE]].forEach(([k, fn]) => { S2.deslizador(cont, k, (v) => { S[k] = v; fn(); }).poner(S[k]); });
    const ir = S2.pestanas(cont, (t) => { S.tab = t; });
    pintarL(); pintarE(); ir(S.tab);
    const parar = animar(dibujarPuntos);
    return { destruir: () => parar() };
  };
  II.diagramas.lazoEscala = (c, o = {}) => II.diagramas.lazo420(c, { ...o, pestana: 'escala' });
})();
