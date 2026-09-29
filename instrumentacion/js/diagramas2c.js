// ============================================================
// Diagramas interactivos — Sesión 2 (parte C: presión)
//   II.diagramas.principioP → Bourdon, galgas, capacitivo, piezoeléctrico
//   II.diagramas.plantaP    → así se ve en planta (según el fluido) + cómo elegir
// Requiere diagramas2b.js (utilidades II.s2). Cada uno devuelve { destruir() }.
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  II.diagramas = II.diagramas || {};
  const S2 = II.s2;
  let contador = 0;
  const uid = () => 's2c' + ++contador;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const halo = 'stroke="#fff" stroke-width="3.5" paint-order="stroke"';
  const dl = 'style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin:0;align-items:baseline"';

  // ------------------------------------------------------------
  // 1) PRINCIPIO FÍSICO · PRESIÓN
  // ------------------------------------------------------------
  II.diagramas.principioP = function (cont, opts = {}) {
    const id = uid();
    const S = { tab: ['bourdon', 'galga', 'cap', 'piezo'].includes(opts.pestana) ? opts.pestana : 'bourdon', pB: 4, pG: 5, mat: 'metal', pH: 150, pL: 100, modo: 'constante', amp: 6, t0: 0 };
    cont.innerHTML = `
      <div class="diagrama">
        <div class="controles"><div class="segmentado" data-rol="tab"><button data-t="bourdon">Tubo Bourdon</button><button data-t="galga">Diafragma con galgas</button><button data-t="cap">Capacitivo</button><button data-t="piezo">Piezoeléctrico</button></div></div>
        <div data-tab="bourdon"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 640 400" id="${id}-b" role="img" aria-label="Tubo Bourdon que se endereza con la presión"></svg></div>
          <div class="panel-info">
            <div class="deslizador" data-d="pB"><label>Presión aplicada (manométrica)</label><output></output><input type="range" min="0" max="10" step="0.1"></div>
            <div data-rol="lb"></div></div></div></div>
        <div data-tab="galga"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 640 400" id="${id}-g" role="img" aria-label="Diafragma con galgas extensiométricas y puente de Wheatstone"></svg></div>
          <div class="panel-info">
            <label class="campo" style="margin-bottom:10px"><span>Tipo de galga</span>
              <div class="segmentado" data-rol="mat"><button data-v="metal">Metálica (lámina)</button><button data-v="si">Silicio piezorresistivo</button></div></label>
            <div class="deslizador" data-d="pG"><label>Presión aplicada</label><output></output><input type="range" min="0" max="10" step="0.1"></div>
            <div data-rol="lg"></div></div></div></div>
        <div data-tab="cap"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 640 380" id="${id}-c" role="img" aria-label="Celda capacitiva diferencial"></svg></div>
          <div class="panel-info">
            <div class="deslizador" data-d="pH"><label>Presión del lado H (alta)</label><output></output><input type="range" min="0" max="300" step="1"></div>
            <div class="deslizador" data-d="pL"><label>Presión del lado L (baja)</label><output></output><input type="range" min="0" max="300" step="1"></div>
            <button class="boton chico" data-acc="estatica" style="margin-bottom:12px">Subir las dos +100 kPa (presión estática)</button>
            <div data-rol="lc"></div></div></div></div>
        <div data-tab="piezo"><div class="diag-2col rango-grid">
          <div class="lienzo"><svg viewBox="0 0 640 400" id="${id}-p" role="img" aria-label="Cristal piezoeléctrico y señal en el tiempo"></svg></div>
          <div class="panel-info">
            <label class="campo" style="margin-bottom:10px"><span>¿Cómo cambia la presión?</span>
              <div class="segmentado" data-rol="modo"><button data-v="constante">Constante</button><button data-v="golpe">Golpes</button><button data-v="pulsante">Pulsante (motor)</button></div></label>
            <div class="deslizador" data-d="amp"><label>Amplitud</label><output></output><input type="range" min="1" max="10" step="0.5"></div>
            <button class="boton chico" data-acc="reiniciar" style="margin-bottom:12px">Volver a aplicar</button>
            <div data-rol="lp"></div></div></div></div>
      </div>`;
    const q = (s) => cont.querySelector(s);
    const svgB = q('#' + id + '-b'), svgG = q('#' + id + '-g'), svgC = q('#' + id + '-c'), svgP = q('#' + id + '-p');

    // ---------- Bourdon ----------
    const pintarB = () => {
      const P = S.pB, r0 = 110, th0 = 1.5 * Math.PI, L = r0 * th0;
      const th = th0 / (1 + 0.02 * P), r = L / th;
      const F = [180, 330], C = [F[0], F[1] - r];
      const pto = (phi) => [C[0] + r * Math.cos(phi), C[1] + r * Math.sin(phi)];
      const pts = []; for (let i = 0; i <= 60; i++) { const [x, y] = pto(Math.PI / 2 + (i / 60) * th); pts.push(x.toFixed(1) + ',' + y.toFixed(1)); }
      const E = pto(Math.PI / 2 + th);
      const D = [500, 170], R = 92;
      const ang = ((225 - (P / 10) * 270) * Math.PI) / 180;
      let marcas = '';
      for (let b = 0; b <= 10; b++) {
        const a = ((225 - (b / 10) * 270) * Math.PI) / 180;
        marcas += `<line x1="${D[0] + (R - 4) * Math.cos(a)}" y1="${D[1] - (R - 4) * Math.sin(a)}" x2="${D[0] + (R - (b % 2 ? 11 : 17)) * Math.cos(a)}" y2="${D[1] - (R - (b % 2 ? 11 : 17)) * Math.sin(a)}" stroke="#2f3b4a" stroke-width="${b % 2 ? 1.2 : 2}"/>`;
        if (b % 2 === 0) marcas += `<text x="${D[0] + (R - 30) * Math.cos(a)}" y="${D[1] - (R - 30) * Math.sin(a) + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#16202c">${b}</text>`;
      }
      const ry = 6 + 5 * (P / 10);
      svgB.innerHTML = `
        <rect x="150" y="330" width="60" height="34" rx="4" fill="#b9c0c9" stroke="#5d6a7a"/>
        <text x="218" y="378" font-size="11" font-weight="700" fill="#154a8c">presión</text>
        <path d="M180,396 V366" stroke="#1d5fb4" stroke-width="3" marker-end="url(#${id}-mb-az)"/>
        <polyline points="${pts.join(' ')}" fill="none" stroke="#8a6d12" stroke-width="18" stroke-linecap="round"/>
        <polyline points="${pts.join(' ')}" fill="none" stroke="#d6b44a" stroke-width="13" stroke-linecap="round"/>
        <circle cx="${E[0]}" cy="${E[1]}" r="7" fill="#8a6d12"/>
        <text x="${E[0] + 10}" y="${E[1] - 10}" font-size="11" font-weight="700" fill="#8a6d12" ${halo}>extremo libre</text>
        <line x1="${E[0]}" y1="${E[1]}" x2="410" y2="240" stroke="#5d6a7a" stroke-width="2.5"/>
        <circle cx="410" cy="240" r="9" fill="#dfe4ea" stroke="#5d6a7a"/><text x="410" y="266" text-anchor="middle" font-size="10.5" fill="#465366">sector y piñón</text>
        <line x1="410" y1="240" x2="${D[0]}" y2="${D[1]}" stroke="#5d6a7a" stroke-width="1.5" stroke-dasharray="3 3"/>
        <circle cx="${D[0]}" cy="${D[1]}" r="${R + 8}" fill="#f0f3f7" stroke="#5d6a7a" stroke-width="3"/><circle cx="${D[0]}" cy="${D[1]}" r="${R}" fill="#fff" stroke="#cbd3dd"/>
        ${marcas}
        <line x1="${D[0]}" y1="${D[1]}" x2="${D[0] + (R - 20) * Math.cos(ang)}" y2="${D[1] - (R - 20) * Math.sin(ang)}" stroke="#c0392b" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="${D[0]}" cy="${D[1]}" r="7" fill="#2f3b4a"/>
        <text x="${D[0]}" y="${D[1] + 40}" text-anchor="middle" font-size="12" font-weight="700" fill="#465366">bar</text>
        <rect x="24" y="24" width="120" height="74" rx="8" fill="#fff" stroke="#cbd3dd"/>
        <text x="84" y="40" text-anchor="middle" font-size="10.5" font-weight="700" fill="#465366">Corte del tubo</text>
        <ellipse cx="84" cy="66" rx="30" ry="${ry}" fill="#f6e7b4" stroke="#8a6d12" stroke-width="3"/>
        <text x="84" y="92" text-anchor="middle" font-size="10" fill="#7a8596">${P < 0.5 ? 'aplanado' : 'se redondea'}</text>
        <text x="320" y="296" text-anchor="middle" font-size="11" fill="#7a8596">(movimiento exagerado para que se vea)</text>
        ${S2.marcadores(id + '-mb')}`;
      q('[data-d=pB] output').textContent = II.fmt(P, 1) + ' bar';
      q('[data-rol=lb]').innerHTML = `<dl ${dl}>
        <dt class="nota">Principio</dt><dd>El tubo tiene sección <b>aplanada</b> y forma de C. La presión interna trata de volverlo redondo, y al hacerlo <b>el tubo se endereza</b>. El extremo libre mueve un sector dentado que hace girar la aguja.</dd>
        <dt class="nota">Movimiento real</dt><dd>Solo unos milímetros (≈ ${II.fmt(0.4 * P, 1)} mm aquí): el mecanismo lo amplifica.</dd>
        <dt class="nota">Ventajas</dt><dd>No necesita energía eléctrica, es barato y se lee en el lugar.</dd>
        <dt class="nota">Cuidado con</dt><dd>Pulsaciones y vibración (desgastan el mecanismo: se usa glicerina o amortiguador), vapor caliente (sifón) y sobrepresión.</dd>
        <dt class="nota">Rango y clase</dt><dd>Desde ≈ 0,6 hasta 1000 bar o más. Clases de exactitud 0,1 a 4 % del span (industrial típico: 1 o 1,6 %).</dd>
        <dt class="nota">Normas</dt><dd>EN 837-1 · ASME B40.100</dd></dl>`;
    };

    // ---------- Galgas ----------
    const pintarG = () => {
      const metal = S.mat === 'metal';
      const P = S.pG, frac = P / 10;
      const Sfs = metal ? 0.002 : 0.02; // ΔR/R a plena escala
      const R0 = metal ? 350 : 5000, GF = metal ? 2 : 100, Vex = 10;
      const dR = Sfs * frac;
      const vout = Vex * dR * 1000;
      const def = (dR / GF) * 1e6;
      const d = 34 * frac;
      const yC = (x) => { const u = (x - 180) / 100; return 150 - d * (1 - u * u); };
      const galga = (x, tipo) => `<rect x="${x - 13}" y="${yC(x) - 12}" width="26" height="10" rx="2" fill="${tipo === '+' ? (frac > 0.05 ? '#f3b3aa' : '#eee') : (frac > 0.05 ? '#b8d3f1' : '#eee')}" stroke="${tipo === '+' ? '#c0392b' : '#1d5fb4'}" stroke-width="1.6"/>`;
      const N = { t: [490, 60], r: [590, 160], b: [490, 260], l: [390, 160] };
      const resB = (a, b, nombre, tipo) => {
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        const v = R0 * (1 + (tipo === '+' ? dR : -dR));
        return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#2f3b4a" stroke-width="2"/><rect x="${mx - 20}" y="${my - 9}" width="40" height="18" rx="3" fill="#fff" stroke="${tipo === '+' ? '#c0392b' : '#1d5fb4'}" stroke-width="2" transform="rotate(${(Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI} ${mx} ${my})"/>
          <text x="${mx + (mx > 490 ? 26 : -26)}" y="${my + (my > 160 ? 18 : -10)}" text-anchor="${mx > 490 ? 'start' : 'end'}" font-size="10.5" font-weight="700" fill="${tipo === '+' ? '#c0392b' : '#1d5fb4'}">${nombre} ${II.fmt(v, metal ? 2 : 1)} Ω</text>`;
      };
      const flechas = Math.round(2 + 6 * frac);
      svgG.innerHTML = `
        <text class="svg-texto fuerte" x="20" y="24" font-size="12">Diafragma visto de costado, con 4 galgas pegadas</text>
        <rect x="24" y="44" width="22" height="10" rx="2" fill="#f3b3aa" stroke="#c0392b" stroke-width="1.6"/><text x="52" y="53" font-size="11" fill="#c0392b" font-weight="700">al centro: se estiran (R sube)</text>
        <rect x="24" y="64" width="22" height="10" rx="2" fill="#b8d3f1" stroke="#1d5fb4" stroke-width="1.6"/><text x="52" y="73" font-size="11" fill="#1d5fb4" font-weight="700">en los bordes: se comprimen (R baja)</text>
        <rect x="50" y="130" width="30" height="120" fill="#b9c0c9" stroke="#5d6a7a"/><rect x="280" y="130" width="30" height="120" fill="#b9c0c9" stroke="#5d6a7a"/>
        <path d="M80,150 Q180,${150 - 2 * d} 280,150" fill="none" stroke="#5d6a7a" stroke-width="6"/>
        ${galga(120, '−')}${galga(160, '+')}${galga(200, '+')}${galga(240, '−')}
        ${Array.from({ length: flechas }, (_, i) => { const x = 95 + (i + 0.5) * (170 / flechas); return `<path d="M${x},235 V${Math.max(yC(x) + 12, 175)}" stroke="#1d5fb4" stroke-width="2.4" marker-end="url(#${id}-mg-az)"/>`; }).join('')}
        <text x="180" y="262" text-anchor="middle" font-size="12" font-weight="700" fill="#154a8c">Presión del proceso: ${II.fmt(P, 1)} bar</text>
        <text x="180" y="300" text-anchor="middle" font-size="11.5" fill="#465366">Estirar un conductor lo hace más largo y</text>
        <text x="180" y="316" text-anchor="middle" font-size="11.5" fill="#465366">más delgado → <tspan font-weight="700">su resistencia sube</tspan></text>
        <text x="490" y="30" text-anchor="middle" font-size="12" font-weight="700" fill="#16202c">Puente de Wheatstone</text>
        ${resB(N.t, N.r, 'R1', '+')}${resB(N.r, N.b, 'R2', '−')}${resB(N.b, N.l, 'R3', '+')}${resB(N.l, N.t, 'R4', '−')}
        ${Object.values(N).map((n) => `<circle cx="${n[0]}" cy="${n[1]}" r="4" fill="#2f3b4a"/>`).join('')}
        <text x="490" y="${N.t[1] - 10}" text-anchor="middle" font-size="11" font-weight="700" fill="#b25f16">+10 V</text>
        <text x="490" y="${N.b[1] + 18}" text-anchor="middle" font-size="11" font-weight="700" fill="#b25f16">0 V</text>
        <line x1="${N.l[0]}" y1="160" x2="440" y2="160" stroke="#465366" stroke-width="1.4" stroke-dasharray="4 3"/><line x1="540" y1="160" x2="${N.r[0]}" y2="160" stroke="#465366" stroke-width="1.4" stroke-dasharray="4 3"/>
        <rect x="440" y="146" width="100" height="28" rx="6" fill="#fff" stroke="#2f3b4a" stroke-width="2"/>
        <text x="490" y="165" text-anchor="middle" font-family="var(--mono)" font-size="13" font-weight="700" fill="#154a8c">${II.fmt(vout, metal ? 2 : 1)} mV</text>
        <text x="490" y="300" text-anchor="middle" font-size="11.5" fill="#465366">Dos galgas suben y dos bajan: el puente</text>
        <text x="490" y="316" text-anchor="middle" font-size="11.5" fill="#465366">convierte ese cambio pequeño en milivoltios</text>
        ${S2.marcadores(id + '-mg')}`;
      q('[data-d=pG] output').textContent = II.fmt(P, 1) + ' bar';
      q('[data-rol=lg]').innerHTML = `<dl ${dl}>
        <dt class="nota">Deformación</dt><dd><b>${II.fmt(def, 0)} µm/m</b> <span class="nota">(${II.fmt(def / 1000, 3)} mm por metro)</span></dd>
        <dt class="nota">Cambio de resistencia</dt><dd><b>${II.fmt(dR * 100, 3)} %</b> (factor de galga ≈ ${GF})</dd>
        <dt class="nota">Salida del puente</dt><dd><b style="font-size:1.1rem">${II.fmt(vout, metal ? 2 : 1)} mV</b> con 10 V de alimentación</dd>
        <dt class="nota">Diferencia</dt><dd>${metal ? 'La galga metálica cambia poco (≈ 2 mV/V a plena escala): muy estable y lineal.' : 'El silicio cambia ≈ 50 veces más (efecto piezorresistivo): mucha señal, pero se debe compensar la temperatura.'}</dd>
        <dt class="nota">¿Dónde se usa?</dt><dd>En la mayoría de los transmisores y sensores de presión electrónicos: compactos, económicos, exactitud ≈ 0,1 a 0,5 % del span.</dd></dl>`;
    };

    // ---------- Capacitivo ----------
    const pintarC = () => {
      const dp = S.pH - S.pL;
      const u = clamp(dp / 250, -0.85, 0.85);
      const C0 = 150;
      const CL = C0 / (1 - u), CH = C0 / (1 + u);
      const x = 22 * u;
      const bb = (xx, lado) => `<path d="M${xx},92 q${lado * 8},14 0,28 q${-lado * 8},14 0,28 q${lado * 8},14 0,28 q${-lado * 8},14 0,28 q${lado * 8},14 0,28 q${-lado * 8},14 0,28" fill="none" stroke="#5d6a7a" stroke-width="3"/>`;
      svgC.innerHTML = `
        <rect x="150" y="70" width="340" height="200" rx="18" fill="#dfe4ea" stroke="#5d6a7a" stroke-width="2"/>
        <rect x="176" y="92" width="288" height="168" rx="10" fill="#fdf5d8"/>
        <text x="320" y="86" text-anchor="middle" font-size="10.5" fill="#8a6d12">aceite de relleno (silicona)</text>
        ${bb(180, 1)}${bb(460, -1)}
        <path d="M292,104 Q278,176 292,248" fill="none" stroke="#1d5fb4" stroke-width="7"/>
        <path d="M348,104 Q362,176 348,248" fill="none" stroke="#1d5fb4" stroke-width="7"/>
        <path d="M320,96 Q${320 + 2 * x},176 320,256" fill="none" stroke="#c0392b" stroke-width="4"/>
        <text x="274" y="276" text-anchor="middle" font-size="11" font-weight="700" fill="#1d5fb4">placa</text><text x="366" y="276" text-anchor="middle" font-size="11" font-weight="700" fill="#1d5fb4">placa</text>
        <text x="320" y="300" text-anchor="middle" font-size="11" font-weight="700" fill="#c0392b">diafragma sensor</text>
        <path d="M40,176 H170" stroke="#1d5fb4" stroke-width="${2 + S.pH / 60}" marker-end="url(#${id}-mc-az)"/>
        <path d="M600,176 H470" stroke="#1d5fb4" stroke-width="${2 + S.pL / 60}" marker-end="url(#${id}-mc-az)"/>
        <text x="80" y="160" text-anchor="middle" font-size="12" font-weight="700" fill="#154a8c">H: ${S.pH} kPa</text>
        <text x="560" y="160" text-anchor="middle" font-size="12" font-weight="700" fill="#154a8c">L: ${S.pL} kPa</text>
        <text x="200" y="330" font-size="12" font-weight="700" fill="#16202c">C<tspan font-size="9" dy="3">H</tspan><tspan dy="-3"> = ${II.fmt(CH, 1)} pF</tspan></text>
        <text x="370" y="330" font-size="12" font-weight="700" fill="#16202c">C<tspan font-size="9" dy="3">L</tspan><tspan dy="-3"> = ${II.fmt(CL, 1)} pF</tspan></text>
        <text x="320" y="360" text-anchor="middle" font-size="11.5" fill="#465366">El diafragma se acerca a una placa y se aleja de la otra: una capacitancia sube y la otra baja</text>
        ${S2.marcadores(id + '-mc')}`;
      q('[data-d=pH] output').textContent = S.pH + ' kPa';
      q('[data-d=pL] output').textContent = S.pL + ' kPa';
      q('[data-rol=lc]').innerHTML = `<dl ${dl}>
        <dt class="nota">Diferencia H − L</dt><dd><b style="font-size:1.1rem">${dp} kPa</b> ${Math.abs(dp / 250) > 0.85 ? '<span class="chip mal">sobrepresión</span>' : ''}</dd>
        <dt class="nota">Salida</dt><dd>(C<sub>L</sub> − C<sub>H</sub>) ÷ (C<sub>L</sub> + C<sub>H</sub>) = <b>${II.fmt(u, 3)}</b> → proporcional a H − L</dd>
        <dt class="nota">Principio</dt><dd>Un condensador son dos placas: si la distancia cambia, la capacitancia cambia. La presión llega al diafragma central a través del aceite, sin que el fluido del proceso toque el sensor.</dd>
        <dt class="nota">Prueba esto</dt><dd>Sube las dos presiones a la vez: la diferencia no cambia y el diafragma no se mueve. Por eso sirve para medir <b>diferencial</b> aunque la presión de la línea sea alta.</dd>
        <dt class="nota">¿Dónde se usa?</dt><dd>Transmisores de presión diferencial: nivel en tanques cerrados, flujo con placa orificio, filtros. Muy exactos (≈ 0,05 a 0,1 %) y estables.</dd></dl>`;
    };

    // ---------- Piezoeléctrico ----------
    const hist = [];
    let senal = 0, pAnt = 0, tUlt = 0;
    const presionEn = (t) => {
      const A = S.amp, dt = t - S.t0;
      if (S.modo === 'constante') return dt > 0.4 ? A : 0;
      if (S.modo === 'golpe') { const f = dt % 2; return f > 0.4 && f < 0.52 ? A : 0; }
      return dt > 0.4 ? A * (0.5 + 0.5 * Math.sin(2 * Math.PI * 2.5 * dt)) : 0;
    };
    const PX0 = 60, PX1 = 620, PY0 = 214, PY1 = 372;
    const pintarPestaticos = () => {
      q('[data-d=amp] output').textContent = II.fmt(S.amp, 1) + ' bar';
      q('[data-rol=lp]').innerHTML = `<dl ${dl}>
        <dt class="nota">Principio</dt><dd>Algunos cristales (cuarzo) generan <b>carga eléctrica</b> cuando se deforman: efecto piezoeléctrico.</dd>
        <dt class="nota">El detalle clave</dt><dd>Esa carga <b>se fuga</b> en poco tiempo. Si la presión se queda constante, la señal vuelve a cero aunque la presión siga ahí: <b>solo mide cambios</b>.</dd>
        <dt class="nota">Prueba esto</dt><dd>Elige "Constante" y mira cómo la línea naranja cae; luego "Pulsante": la sigue muy bien.</dd>
        <dt class="nota">¿Dónde se usa?</dt><dd>Combustión en motores, explosiones, golpe de ariete, ondas de presión y vibración. <b>No</b> se usa para la presión normal de un proceso.</dd></dl>`;
    };
    const cuadroP = (t) => {
      const p = presionEn(t);
      const dtp = Math.min(0.05, t - (tUlt || t)); tUlt = t;
      const a = 0.8 / (0.8 + dtp);
      senal = a * (senal + p - pAnt); pAnt = p;
      hist.push([t, p, senal]);
      while (hist.length && t - hist[0][0] > 6) hist.shift();
      const sx = (tt) => PX1 - ((t - tt) / 6) * (PX1 - PX0);
      const sy = (v) => (PY0 + PY1) / 2 - (v / 11) * ((PY1 - PY0) / 2);
      const linea = (k) => hist.map((h) => sx(h[0]).toFixed(1) + ',' + sy(h[k]).toFixed(1)).join(' ');
      const carga = Math.round(clamp(Math.abs(senal), 0, 10));
      const F = 6 + 4 * p;
      svgP.innerHTML = `
        <rect x="90" y="54" width="170" height="16" rx="3" fill="#9aa3ad"/><rect x="90" y="134" width="170" height="16" rx="3" fill="#9aa3ad"/>
        <rect x="100" y="70" width="150" height="64" rx="4" fill="#e9e1f7" stroke="#7b3fa0" stroke-width="2"/>
        <text x="175" y="106" text-anchor="middle" font-size="12" font-weight="700" fill="#5a2a78">cristal de cuarzo</text>
        ${Array.from({ length: carga }, (_, i) => `<text x="${108 + i * 14}" y="84" font-size="13" font-weight="700" fill="#c0392b">${senal >= 0 ? '+' : '−'}</text><text x="${108 + i * 14}" y="130" font-size="13" font-weight="700" fill="#1d5fb4">${senal >= 0 ? '−' : '+'}</text>`).join('')}
        <path d="M175,${Math.max(8, 44 - F * 2)} V50" stroke="#1d5fb4" stroke-width="${2 + p / 2}" marker-end="url(#${id}-mp-az)"/>
        <text x="190" y="22" font-size="12" font-weight="700" fill="#154a8c">presión: ${II.fmt(p, 1)} bar</text>
        <path d="M260,62 H330 V92" stroke="#2f3b4a" stroke-width="2" fill="none"/><path d="M260,142 H330 V112" stroke="#2f3b4a" stroke-width="2" fill="none"/>
        <rect x="330" y="82" width="140" height="40" rx="8" fill="#f7f9fc" stroke="#5d6a7a"/><text x="400" y="106" text-anchor="middle" font-size="11.5" font-weight="700" fill="#16202c">amplificador de carga</text>
        <path d="M470,102 H510" stroke="#2f3b4a" stroke-width="2"/>
        <rect x="510" y="84" width="100" height="36" rx="8" fill="#fff" stroke="#e0782b" stroke-width="2"/><text x="560" y="107" text-anchor="middle" font-family="var(--mono)" font-size="13" font-weight="700" fill="#b25f16">${II.fmt(senal, 2)}</text>
        <line x1="${PX0}" x2="${PX1}" y1="${(PY0 + PY1) / 2}" y2="${(PY0 + PY1) / 2}" stroke="#cbd3dd"/>
        <rect x="${PX0}" y="${PY0}" width="${PX1 - PX0}" height="${PY1 - PY0}" fill="none" stroke="#e1e6ed"/>
        <polyline points="${linea(1)}" fill="none" stroke="#1d5fb4" stroke-width="2.5"/>
        <polyline points="${linea(2)}" fill="none" stroke="#e0782b" stroke-width="2.5"/>
        <text x="${PX0}" y="${PY0 - 8}" font-size="11.5" font-weight="700" fill="#1d5fb4">— presión real</text>
        <text x="${PX0 + 120}" y="${PY0 - 8}" font-size="11.5" font-weight="700" fill="#b25f16">— señal del sensor</text>
        <text x="${PX1}" y="${PY1 + 16}" text-anchor="end" font-size="10.5" fill="#7a8596">últimos 6 segundos</text>
        ${S2.marcadores(id + '-mp')}`;
    };

    const ponMat = S2.segmentado(cont, 'mat', (v) => { S.mat = v; ponMat(v); pintarG(); });
    const ponModo = S2.segmentado(cont, 'modo', (v) => { S.modo = v; ponModo(v); S.t0 = performance.now() / 1000; });
    S2.deslizador(cont, 'pB', (v) => { S.pB = v; pintarB(); }).poner(S.pB);
    S2.deslizador(cont, 'pG', (v) => { S.pG = v; pintarG(); }).poner(S.pG);
    const dH = S2.deslizador(cont, 'pH', (v) => { S.pH = v; pintarC(); }); dH.poner(S.pH);
    const dL = S2.deslizador(cont, 'pL', (v) => { S.pL = v; pintarC(); }); dL.poner(S.pL);
    S2.deslizador(cont, 'amp', (v) => { S.amp = v; pintarPestaticos(); }).poner(S.amp);
    q('[data-acc=estatica]').addEventListener('click', () => { S.pH = Math.min(300, S.pH + 100); S.pL = Math.min(300, S.pL + 100); dH.poner(S.pH); dL.poner(S.pL); pintarC(); });
    q('[data-acc=reiniciar]').addEventListener('click', () => { S.t0 = performance.now() / 1000; });
    ponMat(S.mat); ponModo(S.modo);
    pintarB(); pintarG(); pintarC(); pintarPestaticos();
    const ir = S2.pestanas(cont, (t) => { S.tab = t; if (t === 'piezo') S.t0 = performance.now() / 1000; });
    ir(S.tab);
    S.t0 = performance.now() / 1000;
    let vivo = true;
    const cuadro = (ahora) => { if (!vivo) return; if (S.tab === 'piezo' && cont.isConnected) cuadroP(ahora / 1000); requestAnimationFrame(cuadro); };
    requestAnimationFrame(cuadro);
    return { destruir() { vivo = false; }, pestana: ir };
  };

  // ------------------------------------------------------------
  // 2) ASÍ SE VE EN PLANTA · PRESIÓN  (según el fluido)  + cómo elegir
  // ------------------------------------------------------------
  const FLUIDOS = {
    agua: { n: 'Agua limpia', toma: 'lateral', acc: null, txt: 'Instalación básica: válvula de bloqueo, línea corta y manifold. La toma va a un costado de la tubería: ni arriba (burbujas de aire) ni abajo (sedimentos).' },
    gas: { n: 'Gas o aire comprimido', toma: 'arriba', acc: null, txt: 'En gases la toma va <b>arriba</b> y el instrumento más alto que la toma, para que el condensado (agua) vuelva a la tubería y no se acumule en la línea.' },
    vapor: { n: 'Vapor', toma: 'lateral', acc: 'sifon', txt: 'El vapor a más de 100 °C dañaría el Bourdon y el sensor. El <b>sifón</b> ("cola de chancho") se llena de condensado frío que protege al instrumento.' },
    pulpa: { n: 'Pulpa de mineral o químico corrosivo', toma: 'lateral', acc: 'sello', txt: 'Una línea de impulso se taparía o corroería. Se usa un <b>sello de diafragma</b> al ras de la toma: el fluido solo toca el diafragma y la presión viaja por aceite en un capilar.' },
    pulsante: { n: 'Descarga de bomba de pistón', toma: 'lateral', acc: 'amortiguador', txt: 'Las pulsaciones hacen vibrar la aguja y desgastan el mecanismo. Se usa un <b>amortiguador</b> (restricción) y un manómetro <b>lleno de glicerina</b>.' }
  };
  const PARTES_P = {
    toma: { tipo: 'Montaje', t: 'Toma de proceso', que: 'Perforación con una boquilla soldada o roscada en la tubería.', para: 'Por aquí "sale" la presión hacia el instrumento.', dato: 'Líquidos: a un costado (±45° de la horizontal). Gases: arriba. Nunca abajo en líquidos con sólidos.', falla: 'Tapada por sedimentos: la lectura se queda congelada.' },
    valvula: { tipo: 'Montaje', t: 'Válvula de bloqueo (raíz)', que: 'Primera válvula, pegada a la tubería.', para: 'Permite aislar y retirar el instrumento sin parar el proceso.', dato: 'Debe soportar la presión y temperatura de la línea (misma especificación que la tubería).', falla: 'Olvidada cerrada después de un mantenimiento: la lectura no se mueve aunque el proceso cambie.' },
    linea: { tipo: 'Montaje', t: 'Línea de impulso', que: 'Tubo delgado (típico ½″) que lleva la presión desde la toma al instrumento.', para: 'Separa el instrumento de la tubería (vibración, calor, acceso).', dato: 'Lo más corta posible. En líquidos, con pendiente para que salgan burbujas; en gases, para que drene el condensado.', falla: 'Si el transmisor está más abajo que la toma, la columna de líquido suma presión: ≈ 9,8 kPa por cada metro de agua.' },
    manifold: { tipo: 'Montaje', t: 'Manifold (bloque de válvulas)', que: 'Bloque con 2 válvulas (manométrico) o 3–5 válvulas (diferencial) montado bajo el transmisor.', para: 'Aislar, purgar y verificar el cero del transmisor sin desmontarlo. En diferencial, la válvula ecualizadora protege de sobrepresión de un solo lado.', dato: 'Secuencia correcta en diferencial: abrir ecualizadora → abrir bloqueos → cerrar ecualizadora.', falla: 'Maniobra en orden equivocado: sobrepresión de un lado y celda dañada.' },
    transmisor: { tipo: 'Instrumento', t: 'Transmisor de presión (PT)', que: 'Sensor (piezorresistivo o capacitivo) más electrónica y display, en una carcasa sellada.', para: 'Convierte la presión en 4–20 mA (Sesión 4) para el PLC; muestra el valor en su pantalla.', dato: 'Desempeño: IEC 60770 · Protección IP66/IP67 (IEC 60529) · En áreas explosivas: Ex d o Ex i (IEC 60079).', falla: 'Tipo equivocado (absoluto en lugar de manométrico) o rango mal elegido.' },
    manometro: { tipo: 'Instrumento', t: 'Manómetro Bourdon', que: 'Indicador mecánico local.', para: 'Lectura en campo sin energía; verificación rápida del transmisor.', dato: 'EN 837-1 / ASME B40.100. Regla práctica: que la presión normal quede cerca de la mitad de la escala.', falla: 'Aguja que vibra (pulsaciones), aguja doblada por sobrepresión.' },
    sifon: { tipo: 'Accesorio', t: 'Sifón ("cola de chancho")', que: 'Tubo enrollado que se llena de condensado.', para: 'El agua condensada hace de barrera: el vapor caliente no llega al instrumento.', dato: 'Obligatorio en vapor. Se llena de agua antes de poner en servicio.', falla: 'Sin sifón: el Bourdon se deforma por calor y la lectura queda corrida.' },
    sello: { tipo: 'Accesorio', t: 'Sello de diafragma con capilar', que: 'Diafragma metálico al ras de la toma, unido al transmisor por un tubo capilar lleno de aceite.', para: 'El fluido sucio, viscoso o corrosivo nunca entra en la línea: solo empuja el diafragma.', dato: 'Material según el fluido: 316L, Hastelloy, tantalio (ácidos). Típico en minería, química y alimentos (conexión sanitaria).', falla: 'Capilar doblado o expuesto al sol: errores por temperatura.' },
    amortiguador: { tipo: 'Accesorio', t: 'Amortiguador de pulsaciones', que: 'Restricción pequeña (disco poroso o tornillo) en la entrada del instrumento.', para: 'Suaviza los picos de presión para que la aguja no vibre.', dato: 'Junto con un manómetro lleno de glicerina.', falla: 'Se tapa con fluidos sucios: la lectura responde muy lento.' },
    tuberia: { tipo: 'Proceso', t: 'Tubería del proceso', que: 'Donde está la presión que queremos medir.', para: 'La presión es la misma en todo el corte, por eso la toma puede ir al costado.', dato: 'Mira el corte de la derecha: dónde conviene la toma según el fluido.', falla: '—' }
  };

  II.diagramas.plantaP = function (cont, opts = {}) {
    const id = uid();
    const S = { fluido: 'agua' };
    cont.innerHTML = `
      <div class="diagrama">
        <div class="controles"><div class="segmentado" data-rol="tab"><button data-t="a">Así se ve en planta</button><button data-t="b">Cómo elegir</button></div></div>
        <div data-tab="a">
          <div class="controles" style="margin-bottom:10px"><span class="nota" style="font-weight:600">Fluido:</span>
            <div class="segmentado" data-rol="fluido">${Object.entries(FLUIDOS).map(([k, f]) => `<button data-v="${k}">${f.n}</button>`).join('')}</div></div>
          <div class="diag-2col planta-grid">
            <div><p class="nota solo-cel" style="margin:0 0 6px">Toca cada pieza del dibujo →</p><div class="lienzo"><svg viewBox="0 0 640 420" id="${id}-p" role="img" aria-label="Punto de medición de presión con accesorios según el fluido"></svg></div>
              <div class="aviso info" data-rol="fl" style="margin:10px 0 0"></div></div>
            <div class="panel-info" data-rol="info"><span class="etiqueta">Explora</span><h4>Toca cada pieza del punto de medición</h4><p class="nota" style="margin:0">Cambia el fluido arriba: la instalación cambia.</p></div>
          </div>
        </div>
        <div data-tab="b">
          <div class="tabla-envoltura"><table class="tabla" style="white-space:normal">
            <tr><th>Pregunta</th><th>Qué decidir</th><th>Ejemplo</th></tr>
            ${[
              ['1. ¿Respecto a qué mido?', '<b>Manométrica</b> (respecto a la atmósfera), <b>absoluta</b> (respecto al vacío) o <b>diferencial</b> (entre dos puntos).', 'Bomba → manométrica · Envasado al vacío → absoluta · Filtro, nivel en tanque cerrado, placa orificio → diferencial'],
              ['2. ¿Qué rango?', 'Que la presión normal quede cerca de la <b>mitad de la escala</b>, y que la máxima posible no supere el límite de sobrepresión.', 'Operación a 4 bar → manómetro de 0–10 bar o transmisor ajustado a 0–8 bar'],
              ['3. ¿Qué tecnología?', 'Bourdon (lectura local sin energía) · piezorresistivo (transmisor compacto) · capacitivo (diferencial, alta exactitud) · piezoeléctrico (solo presión que cambia rápido)', 'Tablero local → Bourdon · Lazo de control → transmisor'],
              ['4. ¿Qué fluido?', 'Materiales en contacto y accesorios: sifón (vapor), sello de diafragma (sucio o corrosivo), amortiguador (pulsaciones).', 'Pulpa de mina → sello · Caldera → sifón · Bomba de pistón → amortiguador'],
              ['5. ¿Qué material?', 'Acero inoxidable 316L como estándar; Hastelloy, Monel o tantalio para químicos agresivos.', 'Ácido sulfúrico → tantalio'],
              ['6. ¿Qué conexión?', 'Rosca ½″ NPT (típica), brida (sellos y alta presión) o sanitaria tipo clamp (alimentos).', 'Planta lechera → conexión sanitaria'],
              ['7. ¿Qué señal?', '4–20 mA, con HART si se quiere diagnóstico (Sesión 4).', 'Lazo de control → 4–20 mA'],
              ['8. ¿Qué ambiente?', 'Grado IP (polvo y agua) y certificación Ex si hay gas o polvo explosivo.', 'Mina subterránea o planta de gas → Ex']
            ].map((f) => `<tr><td><b>${f[0]}</b></td><td>${f[1]}</td><td>${f[2]}</td></tr>`).join('')}
          </table></div>
          <div class="diag-2col rango-grid" style="margin-top:14px">
            <div class="panel-info"><span class="etiqueta">Normas de referencia</span>
              <ul style="margin:8px 0 0;padding-left:18px;display:grid;gap:6px">
                <li><b>EN 837-1 / ASME B40.100</b>: manómetros (clases de exactitud, escalas, seguridad).</li>
                <li><b>IEC 60770</b>: cómo se evalúa el desempeño de los transmisores.</li>
                <li><b>IEC 60529</b>: grado de protección IP (polvo y agua).</li>
                <li><b>IEC 60079</b>: equipos para atmósferas explosivas (Ex).</li>
                <li><b>ISA 5.1</b>: símbolos y letras (PT, PI, PDT…) en los P&amp;ID (Sesión 4).</li>
              </ul></div>
            <div class="panel-info"><span class="etiqueta">Aplicaciones en la industria</span>
              <ul style="margin:8px 0 0;padding-left:18px;display:grid;gap:6px">
                <li><b>Minería:</b> pulpas → sellos de diafragma; ambientes Ex en interior mina.</li>
                <li><b>Petróleo y gas:</b> altas presiones, bridas, certificación Ex.</li>
                <li><b>Alimentos y bebidas:</b> conexiones sanitarias, sellos de fácil limpieza.</li>
                <li><b>Agua y saneamiento:</b> manométricos simples, nivel por presión hidrostática.</li>
                <li><b>Energía (calderas):</b> vapor → sifones; diferenciales para nivel del domo y flujo.</li>
              </ul></div>
          </div>
        </div>
      </div>`;
    const q = (s) => cont.querySelector(s);
    const svg = q('#' + id + '-p');
    const pintar = () => {
      const f = FLUIDOS[S.fluido];
      const arriba = f.toma === 'arriba';
      const sello = f.acc === 'sello';
      const clic = (k, contenido, aro) => `<g class="clic" data-id="${k}">${aro}${contenido}</g>`;
      const tomaX = 170;
      svg.innerHTML = `
        ${clic('tuberia', `<rect x="20" y="312" width="600" height="70" fill="${S.fluido === 'pulpa' ? '#d9c9b0' : S.fluido === 'gas' ? '#eef3f8' : S.fluido === 'vapor' ? '#f3f3f3' : '#d3e8fa'}"/><rect x="20" y="306" width="600" height="8" fill="#9aa3ad"/><rect x="20" y="380" width="600" height="8" fill="#9aa3ad"/>`, '<rect class="aro" x="14" y="300" width="612" height="94" rx="8"/>')}
        <text x="30" y="352" font-size="11" fill="#465366">${II.esc(f.n)} →</text>
        ${arriba
          ? clic('toma', `<rect x="${tomaX - 12}" y="286" width="24" height="22" fill="#b9c0c9" stroke="#5d6a7a"/>`, `<rect class="aro" x="${tomaX - 20}" y="278" width="40" height="32" rx="6"/>`)
          : clic('toma', `<circle cx="${tomaX}" cy="346" r="12" fill="#b9c0c9" stroke="#5d6a7a" stroke-width="2"/><circle cx="${tomaX}" cy="346" r="5" fill="#5d6a7a"/>`, `<circle class="aro" cx="${tomaX}" cy="346" r="19"/>`)}
        ${arriba ? '' : `<text x="${tomaX + 20}" y="374" font-size="10" fill="#465366" ${halo}>toma al costado (se ve de frente)</text>`}
        ${sello
          ? clic('sello', `<circle cx="${tomaX}" cy="346" r="17" fill="#dfe4ea" stroke="#5d6a7a" stroke-width="3"/><circle cx="${tomaX}" cy="346" r="9" fill="#f7f9fc" stroke="#b7791f" stroke-width="2"/><path d="M${tomaX},329 C${tomaX},230 ${tomaX + 40},200 262,158" fill="none" stroke="#b7791f" stroke-width="2.5"/>`, `<circle class="aro" cx="${tomaX}" cy="346" r="24"/>`)
          : clic('valvula', `<polygon points="${tomaX - 18},250 ${tomaX - 18},274 ${tomaX},262" fill="#fff" stroke="#2f3b4a" stroke-width="2"/><polygon points="${tomaX + 18},250 ${tomaX + 18},274 ${tomaX},262" fill="#fff" stroke="#2f3b4a" stroke-width="2"/><line x1="${tomaX}" y1="262" x2="${tomaX}" y2="244" stroke="#2f3b4a" stroke-width="2"/><line x1="${tomaX - 10}" y1="244" x2="${tomaX + 10}" y2="244" stroke="#2f3b4a" stroke-width="3"/>`, `<rect class="aro" x="${tomaX - 26}" y="238" width="52" height="42" rx="6"/>`)}
        ${sello ? '' : clic('linea', `<path d="M${tomaX},${arriba ? 286 : 334} V274" stroke="#5d6a7a" stroke-width="5" fill="none"/><path d="M${tomaX},250 V190" stroke="#5d6a7a" stroke-width="5" fill="none"/><path d="M${tomaX},210 H400 V${f.acc === 'sifon' ? 214 : 190}" stroke="#5d6a7a" stroke-width="5" fill="none"/>`, `<rect class="aro" x="${tomaX - 10}" y="184" width="${410 - tomaX + 10}" height="68" rx="6"/>`)}
        ${clic('manifold', `<rect x="${tomaX - 26}" y="${sello ? 138 : 166}" width="${sello ? 0 : 52}" height="${sello ? 0 : 26}" rx="4" fill="#c5ccd6" stroke="#5d6a7a" stroke-width="2"/>${sello ? '' : `<line x1="${tomaX - 26}" y1="179" x2="${tomaX - 40}" y2="179" stroke="#2f3b4a" stroke-width="4"/><line x1="${tomaX + 26}" y1="179" x2="${tomaX + 40}" y2="179" stroke="#2f3b4a" stroke-width="4"/>`}`, sello ? '' : `<rect class="aro" x="${tomaX - 46}" y="160" width="92" height="38" rx="6"/>`)}
        ${clic('transmisor', `
          <rect x="${sello ? 240 : tomaX - 22}" y="${sello ? 128 : 136}" width="44" height="30" rx="4" fill="#b9c0c9" stroke="#5d6a7a" stroke-width="2"/>
          <rect x="${sello ? 236 : tomaX - 26}" y="${sello ? 60 : 68}" width="52" height="68" rx="12" fill="#e7f0fb" stroke="#1d5fb4" stroke-width="2"/>
          <circle cx="${sello ? 262 : tomaX}" cy="${sello ? 92 : 100}" r="17" fill="#fff" stroke="#1d5fb4" stroke-width="2"/>
          <text x="${sello ? 262 : tomaX}" y="${sello ? 96 : 104}" text-anchor="middle" font-family="var(--mono)" font-size="10.5" font-weight="700" fill="#154a8c">PT</text>
          <path d="M${sello ? 288 : tomaX + 26},${sello ? 76 : 84} H${sello ? 330 : 240} V40 H620" stroke="#2f3b4a" stroke-width="3" fill="none"/>`, `<rect class="aro" x="${sello ? 228 : tomaX - 34}" y="${sello ? 52 : 60}" width="68" height="${sello ? 112 : 110}" rx="10"/>`)}
        <text x="620" y="32" text-anchor="end" font-size="11" fill="#465366">4–20 mA al PLC</text>
        ${sello ? `<text x="${tomaX + 34}" y="236" font-size="10.5" fill="#b7791f" ${halo}>capilar con aceite</text>` : ''}
        ${f.acc === 'sifon' ? clic('sifon', `<path d="M400,214 V232 a14,14 0 1 1 0.1,0 M400,232 V172" stroke="#5d6a7a" stroke-width="5" fill="none"/>`, '<rect class="aro" x="378" y="166" width="46" height="96" rx="8"/>') : ''}
        ${f.acc === 'amortiguador' ? clic('amortiguador', '<rect x="390" y="180" width="20" height="22" rx="3" fill="#e0782b" stroke="#8a3f0a"/>', '<rect class="aro" x="382" y="174" width="36" height="34" rx="6"/>') : ''}
        ${sello ? '' : clic('manometro', `<circle cx="400" cy="${f.acc === 'sifon' ? 130 : 140}" r="36" fill="${f.acc === 'amortiguador' ? '#fff8e1' : '#fff'}" stroke="#5d6a7a" stroke-width="4"/><line x1="400" y1="${f.acc === 'sifon' ? 130 : 140}" x2="${418}" y2="${f.acc === 'sifon' ? 112 : 122}" stroke="#c0392b" stroke-width="3"/><circle cx="400" cy="${f.acc === 'sifon' ? 130 : 140}" r="4" fill="#2f3b4a"/><text x="400" y="${f.acc === 'sifon' ? 158 : 168}" text-anchor="middle" font-size="9" fill="#465366">${f.acc === 'amortiguador' ? 'glicerina' : 'bar'}</text>`, `<circle class="aro" cx="400" cy="${f.acc === 'sifon' ? 130 : 140}" r="42"/>`)}
        ${[['Transmisor', sello ? 262 : tomaX, sello ? 52 : 60, 'middle'], ['Manifold', tomaX + 50, 184, 'start'], ['Válvula de bloqueo', tomaX + 26, 266, 'start'], ['Toma', tomaX - (arriba ? 18 : 22), arriba ? 296 : 350, 'end'], ['Manómetro', 444, sello ? -100 : 110, 'start'], ['Sifón', 424, f.acc === 'sifon' ? 236 : -100, 'start'], ['Amortiguador', 416, f.acc === 'amortiguador' ? 196 : -100, 'start'], ['Sello de diafragma', tomaX + 24, sello ? 330 : -100, 'start']].filter((e) => e[2] > 0 && !(sello && (e[0] === 'Manifold' || e[0] === 'Válvula de bloqueo'))).map(([t, x, y, a]) => `<text x="${x}" y="${y - (t === 'Transmisor' ? 6 : 0)}" text-anchor="${a}" font-size="11.5" font-weight="600" fill="#16202c" ${halo}>${t}</text>`).join('')}
        <circle cx="560" cy="200" r="46" fill="${S.fluido === 'pulpa' ? '#d9c9b0' : '#d3e8fa'}" stroke="#9aa3ad" stroke-width="6"/>
        ${S.fluido === 'pulpa' ? '<path d="M526,230 Q560,250 594,230 L594,238 Q560,258 526,238 Z" fill="#a8906a"/>' : ''}
        <path d="M${560 + 52 * Math.cos(-2.36)},${200 + 52 * Math.sin(-2.36)} A52,52 0 0 1 ${560 + 52 * Math.cos(-0.785)},${200 + 52 * Math.sin(-0.785)}" stroke="${arriba ? '#1b8a5a' : '#c0392b'}" stroke-width="7" fill="none"/>
        <path d="M${560 + 52 * Math.cos(-0.785)},${200 + 52 * Math.sin(-0.785)} A52,52 0 0 1 ${560 + 52 * Math.cos(0.785)},${200 + 52 * Math.sin(0.785)}" stroke="${arriba ? '#f0c36a' : '#1b8a5a'}" stroke-width="7" fill="none"/>
        <path d="M${560 + 52 * Math.cos(0.785)},${200 + 52 * Math.sin(0.785)} A52,52 0 0 1 ${560 + 52 * Math.cos(2.36)},${200 + 52 * Math.sin(2.36)}" stroke="#c0392b" stroke-width="7" fill="none"/>
        <text x="560" y="130" text-anchor="middle" font-size="11" font-weight="700" fill="#16202c">Corte de la tubería</text>
        <text x="560" y="276" text-anchor="middle" font-size="10.5" fill="#1b8a5a">verde: dónde va la toma</text>
        <text x="560" y="290" text-anchor="middle" font-size="10.5" fill="#c0392b">rojo: evitar${arriba ? ' · amarillo: aceptable' : ''}</text>`;
      q('[data-rol=fl]').innerHTML = `<b>${II.esc(f.n)}:</b> ${f.txt}`;
      mostrar = S2.panelPartes(cont, svg, PARTES_P);
    };
    let mostrar = null;
    const ponF = S2.segmentado(cont, 'fluido', (v) => { S.fluido = v; ponF(v); pintar(); });
    ponF(S.fluido);
    pintar();
    const ir = S2.pestanas(cont);
    ir(opts.pestana === 'b' ? 'b' : 'a');
    return { destruir() {}, pestana: ir };
  };
})();
