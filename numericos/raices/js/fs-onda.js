// ============================================================
// Series de Fourier — motor de ondas, coeficientes, gráficos SVG y diagramas
// FS.diagrama(cont, { modo, params }) → { destruir() }
// Modos: periodica, seno, suma, sintesis, ortogonal, simetria, potencia, filtro, complejo
// ============================================================
(function () {
  const FS = (window.FS = window.FS || {});
  const PI = Math.PI;
  const fr = (u) => ((u % 1) + 1) % 1;
  const gauss = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) * ((x - m) / s));
  FS.fr = fr;

  // ---------- formas base (período 1, variable u = t/T) ----------
  FS.BASE = {
    cuadrada: { nombre: 'Cuadrada', f: (u) => (fr(u) < 0.5 ? 1 : -1) },
    triangular: { nombre: 'Triangular', f: (u) => { const x = fr(u); return 1 - 4 * Math.min(x, 1 - x); } },
    diente: { nombre: 'Diente de sierra', f: (u) => 2 * fr(u + 0.5) - 1 },
    media: { nombre: 'Rectificada de media onda', f: (u) => Math.max(0, Math.sin(2 * PI * u)) },
    completa: { nombre: 'Rectificada de onda completa', f: (u) => Math.abs(Math.sin(2 * PI * u)) },
    pulsos: { nombre: 'Tren de pulsos', f: (u) => (fr(u) < 0.25 ? 1 : 0) },
    ecg: {
      nombre: 'Latido (ECG)',
      f: (u) => { const x = fr(u); return 0.12 * gauss(x, 0.18, 0.025) - 0.12 * gauss(x, 0.285, 0.008) + gauss(x, 0.3, 0.009) - 0.22 * gauss(x, 0.318, 0.008) + 0.25 * gauss(x, 0.55, 0.045); }
    },
    cargador: { nombre: 'Corriente de un cargador', f: (u) => { const x = fr(u); return gauss(x, 0.25, 0.035) - gauss(x, 0.75, 0.035); } },
    seno: { nombre: 'Seno', f: (u) => Math.sin(2 * PI * u) }
  };

  // onda transformada: c + (±A)·base(u − s)
  FS.onda = (base, o = {}) => {
    const A = o.A == null ? 1 : o.A, s = o.s || 0, c = o.c || 0, sg = o.inv ? -1 : 1;
    const f = FS.BASE[base].f;
    return (u) => c + sg * A * f(u - s);
  };

  // coeficientes por integración numérica (punto medio) sobre un período
  FS.coef = (f, N = 20, M = 4096) => {
    const a = new Array(N + 1).fill(0), b = new Array(N + 1).fill(0);
    let a0 = 0;
    for (let k = 0; k < M; k++) {
      const u = (k + 0.5) / M, v = f(u);
      a0 += v;
      for (let n = 1; n <= N; n++) { const w = 2 * PI * n * u; a[n] += v * Math.cos(w); b[n] += v * Math.sin(w); }
    }
    a0 /= M;
    const lim = (x) => (Math.abs(x) < 1e-9 ? 0 : x);
    for (let n = 1; n <= N; n++) { a[n] = lim((2 * a[n]) / M); b[n] = lim((2 * b[n]) / M); }
    const c = a.map((_, n) => (n === 0 ? Math.abs(a0) : Math.hypot(a[n], b[n])));
    return { a0: lim(a0), a, b, c, N };
  };
  FS.parcial = (co, N) => (u) => {
    let s = co.a0;
    for (let n = 1; n <= Math.min(N, co.N); n++) s += co.a[n] * Math.cos(2 * PI * n * u) + co.b[n] * Math.sin(2 * PI * n * u);
    return s;
  };

  // ---------- gráficos SVG ----------
  const n2 = (x) => (Math.round(x * 10) / 10).toFixed(1);
  FS.COL = { azul: '#1d5fb4', gris: '#9aa5b4', naranja: '#e67700', verde: '#1b8a5a', rojo: '#c0392b', morado: '#7a52c7', tinta: '#16202c' };

  // opc: { curvas:[{f, color, ancho, guion, area}], u0, u1, ymin, ymax, w, h, ejeX:{T, unidad, paso, fmt}, ejeY:[valores con etiqueta], cero, extra(X,Y) }
  FS.plot = (opc) => {
    const w = opc.w || 1000, h = opc.h || 520;
    const ml = opc.ml != null ? opc.ml : 90, mr = 24, mt = 26, mb = opc.ejeX === false ? 20 : 66;
    const u0 = opc.u0 != null ? opc.u0 : 0, u1 = opc.u1 != null ? opc.u1 : 2;
    let ymin = opc.ymin, ymax = opc.ymax;
    if (ymin == null || ymax == null) {
      let lo = Infinity, hi = -Infinity;
      opc.curvas.forEach((c) => { for (let k = 0; k <= 200; k++) { const v = c.f(u0 + ((u1 - u0) * k) / 200); if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } } });
      const m = (hi - lo) * 0.12 || 1;
      if (ymin == null) ymin = lo - m;
      if (ymax == null) ymax = hi + m;
    }
    const X = (u) => ml + ((u - u0) / (u1 - u0)) * (w - ml - mr);
    const Y = (v) => mt + ((ymax - v) / (ymax - ymin)) * (h - mt - mb);
    let s = `<rect x="0" y="0" width="${w}" height="${h}" fill="#fff"/>`;
    // períodos
    for (let k = Math.ceil(u0); k <= Math.floor(u1); k++) s += `<line x1="${n2(X(k))}" y1="${mt}" x2="${n2(X(k))}" y2="${h - mb}" stroke="#e1e6ed" stroke-width="3" stroke-dasharray="10 10"/>`;
    // eje t = 0 destacado (simetrías)
    if (opc.ejeCero && u0 < 0 && u1 > 0) s += `<line x1="${n2(X(0))}" y1="${mt}" x2="${n2(X(0))}" y2="${h - mb}" stroke="#465366" stroke-width="4"/>`;
    // línea de cero
    if (ymin < 0 && ymax > 0) s += `<line x1="${ml}" y1="${n2(Y(0))}" x2="${w - mr}" y2="${n2(Y(0))}" stroke="#7a8596" stroke-width="3"/>`;
    // etiquetas de y
    (opc.ejeY || []).forEach((v) => {
      const val = typeof v === 'object' ? v.v : v, et = typeof v === 'object' ? v.t : FS.f(v);
      s += `<line x1="${ml - 10}" y1="${n2(Y(val))}" x2="${w - mr}" y2="${n2(Y(val))}" stroke="#eef1f5" stroke-width="2"/>`;
      s += `<text x="${ml - 14}" y="${n2(Y(val) + 11)}" font-size="30" font-weight="700" fill="#465366" text-anchor="end" font-family="JetBrains Mono, monospace">${et}</text>`;
    });
    // eje x
    if (opc.ejeX !== false) {
      const ex = opc.ejeX || {};
      if (ex.paso) {
        // valores reales (T en unidades) cada "paso"
        const T = ex.T, pasoU = ex.paso / T;
        const k0 = Math.ceil(u0 / pasoU - 1e-9), k1 = Math.floor(u1 / pasoU + 1e-9);
        for (let k = k0; k <= k1; k++) {
          const u = k * pasoU, x = n2(X(u));
          s += `<line x1="${x}" y1="${mt}" x2="${x}" y2="${h - mb}" stroke="#f0f3f7" stroke-width="2"/>`;
          if (k % (ex.cada || 1) === 0) s += `<text x="${x}" y="${h - mb + 44}" font-size="28" font-weight="700" fill="#465366" text-anchor="middle" font-family="JetBrains Mono, monospace">${(ex.fmt || FS.f)(k * ex.paso)}</text>`;
        }
        if (ex.unidad) s += `<text x="${w - mr}" y="${h - mb - 10}" font-size="28" font-weight="700" fill="#7a8596" text-anchor="end">t (${ex.unidad})</text>`;
      } else {
        for (let k = Math.ceil(u0 * 2); k <= Math.floor(u1 * 2); k++) {
          const u = k / 2;
          const et = u === 0 ? '0' : (Math.abs(u) === 0.5 ? (u < 0 ? '−' : '') + 'T/2' : (u % 1 === 0 ? (u < 0 ? '−' : '') + (Math.abs(u) === 1 ? '' : Math.abs(u)) + 'T' : (u < 0 ? '−' : '') + Math.abs(u * 2) + 'T/2'));
          s += `<text x="${n2(X(u))}" y="${h - mb + 46}" font-size="32" font-weight="700" fill="#465366" text-anchor="middle" font-family="JetBrains Mono, monospace">${et}</text>`;
        }
      }
    }
    // curvas
    const MUE = opc.muestras || 700;
    opc.curvas.forEach((c) => {
      let d = '', ant = null;
      for (let k = 0; k <= MUE; k++) {
        const u = u0 + ((u1 - u0) * k) / MUE;
        const v = Math.max(ymin - (ymax - ymin), Math.min(ymax + (ymax - ymin), c.f(u)));
        d += (k ? 'L' : 'M') + n2(X(u)) + ' ' + n2(Y(v));
        ant = v;
      }
      if (c.area) {
        // área positiva (verde) y negativa (roja) respecto de cero
        let dp = `M${n2(X(u0))} ${n2(Y(0))}`, dn = dp;
        for (let k = 0; k <= MUE; k++) {
          const u = u0 + ((u1 - u0) * k) / MUE, v = c.f(u);
          dp += 'L' + n2(X(u)) + ' ' + n2(Y(Math.max(0, v)));
          dn += 'L' + n2(X(u)) + ' ' + n2(Y(Math.min(0, v)));
        }
        dp += `L${n2(X(u1))} ${n2(Y(0))}Z`; dn += `L${n2(X(u1))} ${n2(Y(0))}Z`;
        s += `<path d="${dp}" fill="#bfe5d0" opacity=".85"/><path d="${dn}" fill="#f3c4bd" opacity=".85"/>`;
      }
      s += `<path d="${d}" fill="none" stroke="${c.color || FS.COL.azul}" stroke-width="${c.ancho || 6}" stroke-linejoin="round" stroke-linecap="round"${c.guion ? ` stroke-dasharray="${c.guion}"` : ''}${c.op ? ` opacity="${c.op}"` : ''}/>`;
      void ant;
    });
    if (opc.extra) s += opc.extra(X, Y);
    return `<svg class="fs-graf" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img">${s}</svg>`;
  };

  // barras: { vals:[{v, color, et}], max, w, h, titulo, fmt }
  FS.barras = (opc) => {
    const w = opc.w || 1000, h = opc.h || 300;
    const n = opc.vals.length, ml = 30, mr = 20, mt = opc.titulo ? 58 : 24, mb = 54;
    const max = opc.max || Math.max(1e-9, ...opc.vals.map((x) => Math.abs(x.v)));
    const anch = (w - ml - mr) / n;
    let s = `<rect x="0" y="0" width="${w}" height="${h}" fill="#fff"/>`;
    if (opc.titulo) s += `<text x="${ml}" y="40" font-size="32" font-weight="700" fill="#16202c">${opc.titulo}</text>`;
    s += `<line x1="${ml}" y1="${h - mb}" x2="${w - mr}" y2="${h - mb}" stroke="#7a8596" stroke-width="3"/>`;
    opc.vals.forEach((x, i) => {
      const alto = (Math.min(Math.abs(x.v), max) / max) * (h - mt - mb);
      const bx = ml + i * anch + anch * 0.18, bw = anch * 0.64;
      if (alto > 0.5) s += `<rect x="${n2(bx)}" y="${n2(h - mb - alto)}" width="${n2(bw)}" height="${n2(alto)}" rx="4" fill="${x.color || FS.COL.azul}"/>`;
      if (x.et != null) s += `<text x="${n2(bx + bw / 2)}" y="${h - mb + 38}" font-size="${anch > 60 ? 30 : 24}" font-weight="700" fill="#465366" text-anchor="middle" font-family="JetBrains Mono, monospace">${x.et}</text>`;
      if (opc.valores && Math.abs(x.v) > max * 0.005) s += `<text x="${n2(bx + bw / 2)}" y="${n2(h - mb - alto - 10)}" font-size="24" font-weight="700" fill="#16202c" text-anchor="middle" font-family="JetBrains Mono, monospace">${(opc.fmt || FS.f)(x.v)}</text>`;
    });
    return `<svg class="fs-graf barras" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img">${s}</svg>`;
  };

  // número con coma decimal
  FS.f = (x, d = 2) => (window.II ? II.fmt(x, d) : String(Math.round(x * 100) / 100));

  // ---------- piezas de los diagramas ----------
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

  function armar(cont) {
    const raiz = el(`<div class="dg fs-dg"><div class="dg-lienzo"><div class="fs-svg"></div></div><div class="dg-lado"><div class="dg-ctrl"></div><div class="dg-lect"></div><p class="fs-nota"></p></div></div>`);
    cont.appendChild(raiz);
    return { raiz, svg: raiz.querySelector('.fs-svg'), ctrl: raiz.querySelector('.dg-ctrl'), lect: raiz.querySelector('.dg-lect'), nota: raiz.querySelector('.fs-nota') };
  }
  function deslizador(cont, o, alCambiar) {
    const d = el(`<label class="deslizador-tv"><div class="fila"><span class="et">${o.et}</span><output></output></div><input type="range" min="${o.min}" max="${o.max}" step="${o.paso}" value="${o.valor}"></label>`);
    const inp = d.querySelector('input'), out = d.querySelector('output');
    const pinta = () => { out.textContent = (o.fmt || FS.f)(Number(inp.value)); };
    inp.addEventListener('input', () => { pinta(); alCambiar(Number(inp.value)); });
    pinta();
    cont.appendChild(d);
    return inp;
  }
  function botones(cont, lista, actual, alCambiar) {
    const d = el(`<div class="dg-botones">${lista.map((x) => `<button class="dg-boton${x.k === actual ? ' activo' : ''}" data-k="${x.k}">${x.t}</button>`).join('')}</div>`);
    d.onclick = (e) => {
      const b = e.target.closest('[data-k]');
      if (!b) return;
      d.querySelectorAll('.dg-boton').forEach((x) => x.classList.toggle('activo', x === b));
      alCambiar(b.dataset.k);
    };
    cont.appendChild(d);
    return d;
  }
  const tiles = (cont, lista) => {
    cont.innerHTML = lista.map((x) => `<div class="tile ${x.cls || ''}"><span class="et">${x.et}</span><b>${x.v}</b></div>`).join('');
  };
  const siNo = (x) => (x ? 'Sí' : 'No');

  // ---------- modos ----------
  const MODOS = {};

  // 1. Señales periódicas de la vida real
  MODOS.periodica = (P, o) => {
    const SEN = {
      red: { t: 'Red de 50 Hz', f: (u) => 311 * Math.sin(2 * PI * u), T: 20, uni: 'ms', paso: 5, cada: 2, ymin: -380, ymax: 380, ejeY: [-311, 0, 311], mag: 'V' },
      latido: { t: 'Latido (ECG)', f: (u) => FS.BASE.ecg.f(u), T: 0.8, uni: 's', paso: 0.2, cada: 2, ymin: -0.35, ymax: 1.25, ejeY: [0, 1], mag: 'mV' },
      cargador: { t: 'Cargador', f: (u) => 0.9 * FS.BASE.cargador.f(u), T: 20, uni: 'ms', paso: 5, cada: 2, ymin: -1.15, ymax: 1.15, ejeY: [-0.9, 0, 0.9], mag: 'A' }
    };
    let k = (o.params && o.params.senal) || 'red';
    botones(P.ctrl, Object.entries(SEN).map(([kk, v]) => ({ k: kk, t: v.t })), k, (x) => { k = x; dibujar(); });
    function dibujar() {
      const S = SEN[k];
      const co = FS.coef(S.f, 4, 2048);
      // ubica el máximo del primer período para marcar T
      let um = 0, vm = -Infinity;
      for (let i = 0; i < 400; i++) { const u = i / 400, v = S.f(u); if (v > vm) { vm = v; um = u; } }
      const extra = (X, Y) => {
        const y = Y(S.ymax) + 26;
        const x1 = X(um), x2 = X(um + 1);
        return `<line x1="${x1}" y1="${Y(vm)}" x2="${x1}" y2="${y}" stroke="${FS.COL.naranja}" stroke-width="3" stroke-dasharray="6 6"/>
          <line x1="${x2}" y1="${Y(vm)}" x2="${x2}" y2="${y}" stroke="${FS.COL.naranja}" stroke-width="3" stroke-dasharray="6 6"/>
          <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${FS.COL.naranja}" stroke-width="5"/>
          <rect x="${(x1 + x2) / 2 - 40}" y="${y - 22}" width="80" height="44" rx="10" fill="#fff"/>
          <text x="${(x1 + x2) / 2}" y="${y + 13}" font-size="38" font-weight="700" fill="${FS.COL.naranja}" text-anchor="middle">T</text>
          <line x1="${X(0)}" y1="${Y(co.a0)}" x2="${X(3)}" y2="${Y(co.a0)}" stroke="${FS.COL.verde}" stroke-width="4" stroke-dasharray="14 10"/>`;
      };
      P.svg.innerHTML = FS.plot({ curvas: [{ f: S.f, color: FS.COL.azul, ancho: 6 }], u0: 0, u1: 3, ymin: S.ymin, ymax: S.ymax, ejeX: { T: S.T, paso: S.paso, cada: S.cada, unidad: S.uni }, ejeY: S.ejeY, extra });
      const Ts = S.uni === 'ms' ? S.T / 1000 : S.T;
      tiles(P.lect, [
        { et: 'Período T', v: FS.f(S.T) + ' ' + S.uni, cls: 'destacado' },
        { et: 'Frecuencia f = 1/T', v: FS.f(1 / Ts) + ' Hz' },
        { et: 'ω₀ = 2π/T', v: FS.f((2 * PI) / Ts, 1) + ' rad/s' },
        { et: 'Valor medio', v: FS.f(co.a0, 2) + ' ' + S.mag, cls: 'ok' }
      ]);
      P.nota.innerHTML = 'Se repite cada <b>T</b>: f(t + T) = f(t). La línea verde es el <b>valor medio</b>.';
    }
    dibujar();
  };

  // 2. La sinusoide como ladrillo
  MODOS.seno = (P, o) => {
    const p = { A: 1, n: 1, fi: 0, ...((o && o.params) || {}) };
    deslizador(P.ctrl, { et: 'Amplitud A', min: 0.2, max: 1.5, paso: 0.1, valor: p.A, fmt: (v) => FS.f(v, 1) }, (v) => { p.A = v; dibujar(); });
    deslizador(P.ctrl, { et: 'Armónico n (frecuencia n·f₀)', min: 1, max: 4, paso: 1, valor: p.n, fmt: (v) => 'n = ' + v }, (v) => { p.n = v; dibujar(); });
    deslizador(P.ctrl, { et: 'Fase φ', min: -180, max: 180, paso: 15, valor: p.fi, fmt: (v) => v + '°' }, (v) => { p.fi = v; dibujar(); });
    function dibujar() {
      const fi = (p.fi * PI) / 180;
      const f = (u) => p.A * Math.sin(2 * PI * p.n * u + fi);
      P.svg.innerHTML = FS.plot({
        curvas: [{ f: (u) => Math.sin(2 * PI * u), color: FS.COL.gris, ancho: 4, guion: '12 10' }, { f, color: FS.COL.azul, ancho: 7 }],
        u0: 0, u1: 2, ymin: -1.7, ymax: 1.7, ejeY: [-1, 0, 1]
      });
      tiles(P.lect, [
        { et: 'Amplitud', v: FS.f(p.A, 1), cls: 'destacado' },
        { et: 'Frecuencia', v: p.n + '·f₀' },
        { et: 'a (coseno) = A·sen φ', v: FS.f(p.A * Math.sin(fi), 2) },
        { et: 'b (seno) = A·cos φ', v: FS.f(p.A * Math.cos(fi), 2) }
      ]);
      P.nota.innerHTML = 'A·sen(nω₀t + φ) = <b>a</b>·cos(nω₀t) + <b>b</b>·sen(nω₀t). Gris: sen(ω₀t) de referencia.';
    }
    dibujar();
  };

  // 3. Suma de armónicos
  MODOS.suma = (P, o) => {
    const p = { b1: 1, b2: 0, b3: 0.5, ...((o && o.params) || {}) };
    const cols = [null, FS.COL.naranja, FS.COL.morado, FS.COL.verde];
    [1, 2, 3].forEach((n) => deslizador(P.ctrl, { et: `Armónico ${n} · sen(${n === 1 ? '' : n}ω₀t)`, min: -1, max: 1, paso: 0.1, valor: p['b' + n], fmt: (v) => FS.f(v, 1) }, (v) => { p['b' + n] = v; dibujar(); }));
    const mcd = (a, b) => (b ? mcd(b, a % b) : a);
    function dibujar() {
      const comps = [1, 2, 3].map((n) => (u) => p['b' + n] * Math.sin(2 * PI * n * u));
      const suma = (u) => comps.reduce((a, f) => a + f(u), 0);
      const curvas = [1, 2, 3].filter((n) => p['b' + n] !== 0).map((n) => ({ f: comps[n - 1], color: cols[n], ancho: 4, op: 0.75 }));
      curvas.push({ f: suma, color: FS.COL.azul, ancho: 8 });
      P.svg.innerHTML = FS.plot({ curvas, u0: 0, u1: 2, ymin: -2.4, ymax: 2.4, ejeY: [-2, -1, 0, 1, 2] });
      const act = [1, 2, 3].filter((n) => Math.abs(p['b' + n]) > 1e-9);
      const g = act.reduce((a, n) => mcd(a, n), 0);
      tiles(P.lect, [
        { et: 'Período de la suma', v: !act.length ? '—' : g === 1 ? 'T' : 'T/' + g, cls: 'destacado' },
        { et: 'Armónicos presentes', v: act.length ? act.map((n) => n + 'f₀').join(' · ') : 'ninguno' }
      ]);
      P.nota.innerHTML = 'Colores: cada armónico. <b>Azul grueso</b>: la suma. Se repite con el período de la fundamental.';
    }
    dibujar();
  };

  // 4 y 8–9. Síntesis: la onda armándose término a término + espectro
  const ONDAS_SINT = [
    { k: 'cuadrada', t: 'Cuadrada' }, { k: 'triangular', t: 'Triangular' }, { k: 'diente', t: 'Diente' },
    { k: 'ecg', t: 'Latido' }, { k: 'cargador', t: 'Cargador' }
  ];
  MODOS.sintesis = (P, o) => {
    const p = { onda: 'cuadrada', N: 1, ...((o && o.params) || {}) };
    const NMAX = 40;
    botones(P.ctrl, ONDAS_SINT, p.onda, (k) => { p.onda = k; calc(); dibujar(); });
    deslizador(P.ctrl, { et: 'Armónicos sumados N', min: 1, max: 40, paso: 1, valor: p.N, fmt: (v) => 'N = ' + v }, (v) => { p.N = v; dibujar(); });
    let co, f;
    function calc() {
      f = FS.onda(p.onda, { A: p.onda === 'ecg' ? 1 : 1 });
      co = FS.coef(f, NMAX, 4096);
    }
    function dibujar() {
      const parc = FS.parcial(co, p.N);
      let lo = Infinity, hi = -Infinity, pmax = -Infinity;
      for (let k = 0; k <= 800; k++) { const u = k / 800, v = f(u), w = parc(u); lo = Math.min(lo, v); hi = Math.max(hi, v); pmax = Math.max(pmax, w); }
      const m = (hi - lo) * 0.22;
      const graf = FS.plot({ curvas: [{ f, color: FS.COL.gris, ancho: 7, op: 0.8 }, { f: parc, color: FS.COL.azul, ancho: 6 }], u0: 0, u1: 2, ymin: lo - m, ymax: hi + m, ejeY: [], h: 430, muestras: 900 });
      const Nb = 15;
      const vals = [];
      for (let n = 1; n <= Nb; n++) vals.push({ v: co.c[n], et: n, color: n <= p.N ? FS.COL.azul : '#d5dbe3' });
      const bar = FS.barras({ vals, h: 250, titulo: 'Espectro: amplitud cₙ de cada armónico' });
      P.svg.innerHTML = graf + bar;
      const sobre = hi - lo > 0 ? ((pmax - hi) / (hi - lo)) * 100 : 0;
      tiles(P.lect, [
        { et: 'Armónicos sumados', v: 'N = ' + p.N, cls: 'destacado' },
        { et: 'c₁ · c₃', v: [1, 3].map((n) => FS.f(co.c[n], 2)).join(' · ') },
        { et: 'Sobrepico', v: (sobre > 0.05 ? FS.f(sobre, 1) : '0') + ' %' }
      ]);
      P.nota.innerHTML = 'Gris: la señal. <b>Azul</b>: suma de los primeros N armónicos. Abajo, cuánto pesa cada uno.';
    }
    calc();
    dibujar();
  };

  // 5. Ortogonalidad: producto y promedio
  MODOS.ortogonal = (P, o) => {
    const p = { m: 1, n: 2, tipo: 'sen', ...((o && o.params) || {}) };
    deslizador(P.ctrl, { et: 'Señal: sen(m·ω₀t)', min: 1, max: 4, paso: 1, valor: p.m, fmt: (v) => 'm = ' + v }, (v) => { p.m = v; dibujar(); });
    deslizador(P.ctrl, { et: 'Prueba con el armónico n', min: 1, max: 4, paso: 1, valor: p.n, fmt: (v) => 'n = ' + v }, (v) => { p.n = v; dibujar(); });
    botones(P.ctrl, [{ k: 'sen', t: 'sen(nω₀t)' }, { k: 'cos', t: 'cos(nω₀t)' }], p.tipo, (k) => { p.tipo = k; dibujar(); });
    function dibujar() {
      const f1 = (u) => Math.sin(2 * PI * p.m * u);
      const f2 = (u) => (p.tipo === 'sen' ? Math.sin : Math.cos)(2 * PI * p.n * u);
      const pr = (u) => f1(u) * f2(u);
      let prom = 0;
      const M = 2000;
      for (let k = 0; k < M; k++) prom += pr((k + 0.5) / M);
      prom /= M;
      if (Math.abs(prom) < 1e-6) prom = 0;
      P.svg.innerHTML = FS.plot({
        curvas: [{ f: pr, color: FS.COL.tinta, ancho: 5, area: true }, { f: f1, color: FS.COL.azul, ancho: 4, op: 0.55 }, { f: f2, color: FS.COL.naranja, ancho: 4, op: 0.55 }],
        u0: 0, u1: 1, ymin: -1.3, ymax: 1.3, ejeY: [-1, 0, 1]
      });
      tiles(P.lect, [
        { et: 'Promedio del producto', v: FS.f(prom, 2), cls: prom === 0 ? 'mal' : 'ok' },
        { et: 'Conclusión', v: prom === 0 ? 'no contiene' : 'sí contiene', cls: 'compacto' }
      ]);
      P.nota.innerHTML = '<span style="color:#1b8a5a">Verde</span>: área positiva · <span style="color:#c0392b">rojo</span>: negativa. Armónicos distintos → se cancelan (0). El mismo → ½.';
    }
    dibujar();
  };

  // 7 y 10. Simetrías: desplazar la onda y ver qué coeficientes se apagan
  const ONDAS_SIM = [{ k: 'cuadrada', t: 'Cuadrada' }, { k: 'triangular', t: 'Triangular' }, { k: 'diente', t: 'Diente' }, { k: 'media', t: 'Media onda' }, { k: 'pulsos', t: 'Pulsos' }];
  FS.simetrias = (co, tol = 2e-3) => {
    const N = Math.min(co.N, 15);
    let aCero = true, bCero = true, pares = true;
    for (let n = 1; n <= N; n++) {
      if (Math.abs(co.a[n]) > tol) aCero = false;
      if (Math.abs(co.b[n]) > tol) bCero = false;
      if (n % 2 === 0 && co.c[n] > tol) pares = false;
    }
    const a0Cero = Math.abs(co.a0) < tol;
    return { a0Cero, aCero, bCero, soloImpares: pares, par: bCero, impar: aCero && a0Cero, mediaOnda: pares && a0Cero };
  };
  MODOS.simetria = (P, o) => {
    const p = { onda: 'cuadrada', s: 0, c: 0, ...((o && o.params) || {}) };
    botones(P.ctrl, ONDAS_SIM, p.onda, (k) => { p.onda = k; dibujar(); });
    deslizador(P.ctrl, { et: 'Mover el origen (desplazar)', min: -4, max: 4, paso: 1, valor: p.s * 8, fmt: (v) => (v === 0 ? '0' : (v > 0 ? '+' : '−') + Math.abs(v) + 'T/8') }, (v) => { p.s = v / 8; dibujar(); });
    deslizador(P.ctrl, { et: 'Nivel DC (sumar V₀)', min: -1, max: 1, paso: 0.5, valor: p.c, fmt: (v) => FS.f(v, 1) }, (v) => { p.c = v; dibujar(); });
    function dibujar() {
      const f = FS.onda(p.onda, { s: p.s, c: p.c });
      const co = FS.coef(f, 15, 4096);
      const sm = FS.simetrias(co);
      const graf = FS.plot({ curvas: [{ f, color: FS.COL.azul, ancho: 7 }], u0: -1, u1: 1, ymin: -2.3, ymax: 2.3, ejeY: [-1, 0, 1], ejeCero: true, h: 400 });
      const vals = [];
      for (let n = 1; n <= 8; n++) { vals.push({ v: co.a[n], et: 'a' + n, color: FS.COL.naranja }); vals.push({ v: co.b[n], et: 'b' + n, color: FS.COL.azul }); }
      const bar = FS.barras({ vals, h: 270, max: 1.35, titulo: 'Naranja: aₙ (cosenos) · Azul: bₙ (senos)' });
      P.svg.innerHTML = graf + bar;
      tiles(P.lect, [
        { et: 'a₀ (valor medio)', v: FS.f(co.a0, 2), cls: sm.a0Cero ? '' : 'destacado' },
        { et: 'Par → solo cosenos', v: siNo(sm.par), cls: sm.par ? 'ok' : '' },
        { et: 'Impar → solo senos', v: siNo(sm.impar), cls: sm.impar ? 'ok' : '' },
        { et: 'Media onda → solo impares', v: siNo(sm.mediaOnda), cls: sm.mediaOnda ? 'ok' : '' }
      ]);
      P.nota.innerHTML = 'La línea vertical es <b>t = 0</b>. Mover el origen cambia senos por cosenos, pero no la forma.';
    }
    dibujar();
  };

  // 11. Potencia por armónico (Parseval) y THD
  MODOS.potencia = (P, o) => {
    const p = { I1: 10, I3: 6, I5: 3, I7: 1, ...((o && o.params) || {}) };
    [[1, 0, 12], [3, 0, 8], [5, 0, 6], [7, 0, 4]].forEach(([n, mi, ma]) =>
      deslizador(P.ctrl, { et: `I${n} (amplitud del ${n === 1 ? 'fundamental' : n + '.º armónico'})`, min: mi, max: ma, paso: 0.5, valor: p['I' + n], fmt: (v) => FS.f(v, 1) + ' A' }, (v) => { p['I' + n] = v; dibujar(); }));
    function dibujar() {
      const sg = { 1: 1, 3: -1, 5: 1, 7: -1 };
      const f = (u) => [1, 3, 5, 7].reduce((a, n) => a + sg[n] * p['I' + n] * Math.sin(2 * PI * n * u), 0);
      const graf = FS.plot({ curvas: [{ f: (u) => p.I1 * Math.sin(2 * PI * u), color: FS.COL.gris, ancho: 4, guion: '12 10' }, { f, color: FS.COL.azul, ancho: 7 }], u0: 0, u1: 2, ymin: -24, ymax: 24, ejeY: [-20, -10, 0, 10, 20], h: 400, ejeX: { T: 20, paso: 5, cada: 2, unidad: 'ms' } });
      const pot = [1, 3, 5, 7].map((n) => (p['I' + n] * p['I' + n]) / 2);
      const tot = pot.reduce((a, b) => a + b, 0) || 1;
      const bar = FS.barras({ vals: [1, 3, 5, 7].map((n, i) => ({ v: (pot[i] / tot) * 100, et: n + 'f₀', color: n === 1 ? FS.COL.verde : FS.COL.naranja })), h: 260, max: 100, valores: true, fmt: (v) => FS.f(v, 0) + '%', titulo: '% de la potencia que lleva cada armónico' });
      P.svg.innerHTML = graf + bar;
      const ief = Math.sqrt(tot);
      const thd = p.I1 > 0 ? (Math.sqrt(p.I3 * p.I3 + p.I5 * p.I5 + p.I7 * p.I7) / p.I1) * 100 : NaN;
      tiles(P.lect, [
        { et: 'I eficaz = √(½ΣIₙ²)', v: FS.f(ief, 2) + ' A', cls: 'destacado' },
        { et: 'THD', v: isFinite(thd) ? FS.f(thd, 1) + ' %' : '—', cls: thd > 20 ? 'mal' : 'ok' }
      ]);
      P.nota.innerHTML = 'Gris: solo la fundamental. <b>Azul</b>: la corriente real con armónicos (cargadores, LED, variadores).';
    }
    dibujar();
  };

  // 12. Señal periódica que entra a un filtro RC
  MODOS.filtro = (P, o) => {
    const RS = [0.5, 1, 2, 3, 5, 10, 20];
    const p = { r: 3, ...((o && o.params) || {}) };
    deslizador(P.ctrl, { et: 'Corte del filtro f_c (en múltiplos de f₀)', min: 0, max: RS.length - 1, paso: 1, valor: Math.max(0, RS.indexOf(p.r)), fmt: (v) => 'f_c = ' + FS.f(RS[v], 1) + '·f₀' }, (v) => { p.r = RS[v]; dibujar(); });
    function dibujar() {
      const N = 41;
      const H = (n) => ({ m: 1 / Math.sqrt(1 + (n / p.r) * (n / p.r)), fi: -Math.atan(n / p.r) });
      const ent = (u) => FS.BASE.cuadrada.f(u);
      const sal = (u) => { let s = 0; for (let n = 1; n <= N; n += 2) { const h = H(n); s += (4 / (n * PI)) * h.m * Math.sin(2 * PI * n * u + h.fi); } return s; };
      const graf = FS.plot({ curvas: [{ f: ent, color: FS.COL.gris, ancho: 6, op: 0.8 }, { f: sal, color: FS.COL.azul, ancho: 7 }], u0: 0, u1: 2, ymin: -1.6, ymax: 1.6, ejeY: [-1, 0, 1], h: 400 });
      const vals = [];
      for (let n = 1; n <= 11; n += 2) { vals.push({ v: 4 / (n * PI), et: n + '↓', color: '#d5dbe3' }); vals.push({ v: (4 / (n * PI)) * H(n).m, et: n + '↑', color: FS.COL.azul }); }
      const bar = FS.barras({ vals, h: 270, max: 1.35, titulo: 'Gris: entra · Azul: sale (cada armónico × |H|)' });
      P.svg.innerHTML = graf + bar;
      tiles(P.lect, [
        { et: '|H(jω₀)|', v: FS.f(H(1).m, 2), cls: 'destacado' },
        { et: '|H(j3ω₀)|', v: FS.f(H(3).m, 2) },
        { et: '|H(j9ω₀)|', v: FS.f(H(9).m, 2) }
      ]);
      P.nota.innerHTML = 'H(jω) = 1/(1 + jω/ω_c). Los armónicos altos se atenúan más: las esquinas se redondean.';
    }
    dibujar();
  };

  // 13. Forma compleja: espectro a ambos lados
  MODOS.complejo = (P, o) => {
    const p = { onda: 'cuadrada', ...((o && o.params) || {}) };
    botones(P.ctrl, [{ k: 'cuadrada', t: 'Cuadrada' }, { k: 'triangular', t: 'Triangular' }, { k: 'diente', t: 'Diente' }, { k: 'pulsos', t: 'Pulsos' }], p.onda, (k) => { p.onda = k; dibujar(); });
    function dibujar() {
      const f = FS.onda(p.onda);
      const co = FS.coef(f, 7, 4096);
      const graf = FS.plot({ curvas: [{ f, color: FS.COL.azul, ancho: 7 }], u0: 0, u1: 2, ymin: -1.4, ymax: 1.4, ejeY: [-1, 0, 1], h: 330 });
      const vals = [];
      for (let n = -7; n <= 7; n++) vals.push({ v: n === 0 ? Math.abs(co.a0) : co.c[Math.abs(n)] / 2, et: n, color: n === 0 ? FS.COL.verde : FS.COL.morado });
      const bar = FS.barras({ vals, h: 330, max: 0.75, titulo: '|Cₙ| para n = −7 … 7 (cada barra real se parte en dos)' });
      P.svg.innerHTML = graf + bar;
      tiles(P.lect, [
        { et: 'C₀ = a₀', v: FS.f(co.a0, 2) },
        { et: '|C₁| = c₁/2', v: FS.f(co.c[1] / 2, 2), cls: 'destacado' },
        { et: '|C₃| = c₃/2', v: FS.f(co.c[3] / 2, 2) }
      ]);
      P.nota.innerHTML = 'f(t) = Σ Cₙ·e^{jnω₀t}, n de −∞ a ∞. Es el mismo espectro, repartido a ambos lados.';
    }
    dibujar();
  };

  FS.diagrama = (cont, opc = {}) => {
    const P = armar(cont);
    (MODOS[opc.modo] || MODOS.sintesis)(P, opc);
    return { destruir() { P.raiz.remove(); } };
  };
})();
