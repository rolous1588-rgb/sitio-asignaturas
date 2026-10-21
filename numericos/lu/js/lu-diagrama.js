// ============================================================
// Métodos Numéricos · Factorización LU — diagramas interactivos (SVG 16:9, colores claros)
//   luCosto: línea de tiempo del trabajo: Gauss repetido frente a LU (más fuentes → más ahorro)
//   luPaso : eliminación paso a paso; los multiplicadores caen en L, lo que queda arriba es U
//   luSust : las dos escaleras: L·d = b hacia adelante y U·x = d hacia atrás (cambia b sin refactorizar)
// Todo el dibujo vive en un viewBox 960×540 (16:9) y se escala al espacio disponible,
// así entra completo en la TV y en el celular sin cortarse.
// Se enchufan en FS.diagrama (los demás modos siguen siendo los de fs-onda.js).
// ============================================================
(function () {
  const FS = (window.FS = window.FS || {});
  const orig = FS.diagrama;
  const C = { tinta: '#16202c', gris: '#64748b', borde: '#cbd5e1', fondo: '#f6f8fb', azul: '#1d5fb4', naranja: '#e67700', verde: '#1b8a5a', rojo: '#c0392b', ambar: '#fef3c7', verdeCl: '#dcfce7', azulCl: '#dbeafe' };

  const fm = (x) => {
    if (!isFinite(x)) return '—';
    let v = Math.round(x * 1e4) / 1e4;
    if (Object.is(v, -0) || v === 0) v = 0;
    return String(v).replace('.', ',').replace('-', '−');
  };
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.fs || 30}" font-weight="${o.w || 500}" fill="${o.c || C.tinta}" text-anchor="${o.a || 'middle'}" ${o.mono ? 'font-family="ui-monospace,Menlo,monospace"' : ''}>${s}</text>`;
  const R = (x, y, w, h, fill, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r == null ? 8 : o.r}" fill="${fill}" stroke="${o.s || 'none'}" stroke-width="${o.sw || 0}"/>`;

  // matriz 3×3 dibujada: marca[i,j] = 'nuevo' | 'cambio' | 'pivote' | 'gris'
  function mat(x, y, M, cell, marca, fs) {
    let s = '';
    const w = cell * M[0].length, h = cell * M.length;
    for (let i = 0; i < M.length; i++) {
      for (let j = 0; j < M[0].length; j++) {
        const m = (marca && marca[i + ',' + j]) || '';
        const fill = m === 'nuevo' ? C.verdeCl : m === 'cambio' ? C.ambar : m === 'pivote' ? C.azulCl : '#fff';
        s += R(x + j * cell + 2, y + i * cell + 2, cell - 4, cell - 4, fill, { s: m ? (m === 'nuevo' ? C.verde : m === 'cambio' ? C.naranja : C.azul) : C.borde, sw: m ? 3 : 1.5, r: 6 });
        const v = M[i][j];
        s += T(x + j * cell + cell / 2, y + i * cell + cell / 2 + (fs || 30) / 3, typeof v === 'string' ? v : fm(v), { fs: fs || 30, w: m ? 800 : 500, c: m === 'gris' ? '#94a3b8' : C.tinta });
      }
    }
    s += `<path d="M${x - 4} ${y} h-12 v${h} h12 M${x + w + 4} ${y} h12 v${h} h-12" fill="none" stroke="${C.tinta}" stroke-width="4"/>`;
    return s;
  }
  const marco = (inner, id) => `<svg viewBox="0 0 960 540" class="lu-svg" preserveAspectRatio="xMidYMid meet" role="img" ${id ? `id="${id}"` : ''}>${inner}</svg>`;

  // ---------------- línea de tiempo del trabajo ----------------
  function costo(cont) {
    let n = 30, k = 4;
    cont.innerHTML = `<div class="lu-dg"><div id="lu-sv" class="lu-sv"></div>
      <div class="lu-ctl"><button class="boton" id="lu-menos">− fuente</button><button class="boton prim" id="lu-mas">+ fuente</button>
      <label class="lu-sl2"><span>Tamaño de la red</span><input type="range" id="lu-ns" min="5" max="100" value="30"></label></div></div>`;
    const q = (s) => cont.querySelector(s);
    function pintar() {
      const grande = n ** 3 / 3, chico = n * n;
      const G = k * (grande + chico), L = grande + k * chico;
      const W = 800, x0 = 130, esc = W / G;
      let s = '';
      s += T(480, 38, `La misma red, ${k} fuente${k > 1 ? 's' : ''} distinta${k > 1 ? 's' : ''}`, { fs: 34, w: 800 });
      // fila Gauss
      s += T(x0 - 14, 150, 'Gauss', { a: 'end', fs: 34, w: 800, c: C.naranja });
      s += T(x0 - 14, 188, 'repetido', { a: 'end', fs: 26, c: C.gris });
      let x = x0;
      for (let i = 0; i < k; i++) {
        const wg = grande * esc, wc = chico * esc;
        s += R(x, 110, wg, 90, '#fde8cc', { s: C.naranja, sw: 3 });
        s += R(x + wg, 110, Math.max(wc, 3), 90, C.naranja, { s: C.naranja, sw: 2, r: 3 });
        if (wg > 46) s += T(x + wg / 2, 165, 'eliminar A', { fs: Math.min(28, wg / 5), c: '#9a3412', w: 700 });
        s += T(x + (wg + wc) / 2, 100, `b${'₁₂₃₄₅₆₇₈₉'[i] || i + 1}`, { fs: 26, c: C.gris });
        x += wg + wc;
      }
      // fila LU
      s += T(x0 - 14, 330, 'LU', { a: 'end', fs: 34, w: 800, c: C.verde });
      s += T(x0 - 14, 368, 'guardado', { a: 'end', fs: 26, c: C.gris });
      const wf = grande * esc, wc = chico * esc;
      s += R(x0, 290, wf, 90, C.verdeCl, { s: C.verde, sw: 3 });
      if (wf > 120) s += T(x0 + wf / 2, 345, 'factorizar A (1 vez)', { fs: Math.min(28, wf / 7), c: '#14532d', w: 700 });
      else if (wf > 40) s += T(x0 + wf / 2, 345, 'L·U', { fs: 28, c: '#14532d', w: 700 });
      x = x0 + wf;
      for (let i = 0; i < k; i++) {
        s += R(x, 290, Math.max(wc, 3), 90, C.verde, { s: C.verde, sw: 2, r: 3 });
        s += T(x + wc / 2, 280, `b${'₁₂₃₄₅₆₇₈₉'[i] || i + 1}`, { fs: 26, c: C.gris });
        x += wc;
      }
      // meta
      const xl = x0 + L * esc;
      s += `<line x1="${xl}" y1="230" x2="${xl}" y2="400" stroke="${C.rojo}" stroke-width="3" stroke-dasharray="8 6"/>`;
      s += `<line x1="${x0 + W}" y1="100" x2="${x0 + W}" y2="400" stroke="${C.gris}" stroke-width="2" stroke-dasharray="4 6"/>`;
      s += T(xl + 10, 232, 'LU termina aquí', { a: xl > 700 ? 'end' : 'start', fs: 26, c: C.rojo, w: 700 });
      const r = G / L;
      s += T(480, 470, k === 1 ? 'Con una sola fuente, las dos cuestan casi igual.' : `LU hace ${r >= 10 ? Math.round(r) : fm(Math.round(r * 10) / 10)} veces menos trabajo`, { fs: 40, w: 800, c: k === 1 ? C.gris : C.azul });
      s += T(480, 515, 'Bloque grande = eliminar A; bloque pequeño = resolver con una fuente', { fs: 26, c: C.gris });
      q('#lu-sv').innerHTML = marco(s);
    }
    q('#lu-mas').onclick = () => { if (k < 9) { k++; pintar(); } };
    q('#lu-menos').onclick = () => { if (k > 1) { k--; pintar(); } };
    q('#lu-ns').addEventListener('input', (e) => { n = Number(e.target.value); pintar(); });
    pintar();
    return { destruir() { cont.innerHTML = ''; } };
  }

  // ---------------- eliminación paso a paso ----------------
  const A0 = [[4, -2, -2], [-2, 6, -2], [-2, -2, 6]];
  const rnd = () => {
    const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) A[i][j] = i === j ? 5 + Math.floor(Math.random() * 5) : (1 + Math.floor(Math.random() * 4)) * (Math.random() < 0.7 ? -1 : 1);
    return A;
  };

  function paso(cont, params) {
    let A = (params && params.A) || A0;
    let st = 0;
    cont.innerHTML = `<div class="lu-dg"><div id="lu-sv" class="lu-sv"></div>
      <div class="lu-ctl"><button class="boton prim" id="lu-sig"></button><button class="boton" id="lu-ini">Reiniciar</button><button class="boton" id="lu-otra">Otra matriz</button></div></div>`;
    const q = (s) => cont.querySelector(s);
    function pintar() {
      const M = A.map((f) => f.slice());
      const L = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      const mL = {}, mU = {};
      let txt1 = 'A entra a la «máquina de eliminar».', txt2 = 'Todavía no hay multiplicadores: L es la identidad.';
      let fila = null; // [pivote, objetivo]
      if (st >= 1) {
        const l21 = M[1][0] / M[0][0], l31 = M[2][0] / M[0][0];
        for (let j = 0; j < 3; j++) { M[1][j] -= l21 * M[0][j]; M[2][j] -= l31 * M[0][j]; }
        M[1][0] = 0; M[2][0] = 0;
        L[1][0] = l21; L[2][0] = l31;
        mL['1,0'] = mL['2,0'] = 'nuevo';
        ['1,1', '1,2', '2,1', '2,2'].forEach((k) => (mU[k] = 'cambio'));
        for (let j = 0; j < 3; j++) mU['0,' + j] = 'pivote';
        txt1 = `Fila 2 − (${fm(l21)})·fila 1;  fila 3 − (${fm(l31)})·fila 1`;
        txt2 = 'Cada multiplicador usado se guarda en L.';
      }
      if (st >= 2) {
        const l32 = M[2][1] / M[1][1];
        for (let j = 0; j < 3; j++) M[2][j] -= l32 * M[1][j];
        M[2][1] = 0;
        L[2][1] = l32;
        Object.keys(mL).forEach((k) => (mL[k] = ''));
        mL['2,1'] = 'nuevo';
        Object.keys(mU).forEach((k) => (mU[k] = ''));
        for (let j = 0; j < 3; j++) mU['1,' + j] = 'pivote';
        mU['2,2'] = 'cambio'; mU['2,1'] = 'cambio';
        txt1 = `Fila 3 − (${fm(l32)})·fila 2`;
        txt2 = 'Ya está: arriba quedó U y abajo, completa, L.';
      }
      let comprob = '';
      if (st >= 3) {
        const P = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) P[i][j] += L[i][k] * M[k][j];
        const ok = P.every((f, i) => f.every((v, j) => Math.abs(v - A[i][j]) < 1e-9));
        comprob = ok ? 'L·U = A  ✓' : 'L·U no coincide con A';
        txt1 = 'Al multiplicar L por U se recupera A.';
        txt2 = 'Este trabajo se hizo una sola vez y sirve para cualquier b.';
      }
      const cell = 78;
      let s = '';
      s += T(130, 50, 'A', { fs: 44, w: 800 }) + T(130, 82, 'la red', { fs: 24, c: C.gris });
      s += mat(60, 110, A, cell, null, 32);
      s += T(342, 250, '=', { fs: 54, c: C.gris, w: 800 });
      s += T(520, 50, 'L', { fs: 44, w: 800, c: C.verde }) + T(520, 82, 'multiplicadores', { fs: 24, c: C.gris });
      s += mat(402, 110, L, cell, mL, 32);
      s += T(662, 250, '·', { fs: 54, c: C.gris, w: 800 });
      s += T(820, 50, 'U', { fs: 44, w: 800, c: C.naranja }) + T(820, 82, 'tras eliminar', { fs: 24, c: C.gris });
      s += mat(712, 110, M, cell, mU, 32);
      // flecha del multiplicador hacia L
      if (st >= 1 && st < 3) s += `<path d="M700 ${st === 1 ? 215 : 292} C 650 ${st === 1 ? 215 : 292}, 640 ${st === 1 ? 215 : 292}, 590 ${st === 1 ? 215 : 292}" fill="none" stroke="${C.verde}" stroke-width="5" marker-end="url(#fl)"/>`;
      s += `<defs><marker id="fl" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${C.verde}"/></marker></defs>`;
      s += T(480, 395, txt1, { fs: 34, w: 700 });
      s += T(480, 440, txt2, { fs: 30, c: C.gris });
      if (comprob) s += T(480, 500, comprob, { fs: 42, w: 800, c: C.verde });
      q('#lu-sv').innerHTML = marco(s);
      const sig = q('#lu-sig');
      sig.textContent = ['Paso 1: anular la columna 1', 'Paso 2: anular la columna 2', 'Comprobar L·U = A', 'Listo ✓'][st];
      sig.disabled = st >= 3;
      void fila;
    }
    q('#lu-sig').onclick = () => { if (st < 3) { st++; pintar(); } };
    q('#lu-ini').onclick = () => { st = 0; pintar(); };
    q('#lu-otra').onclick = () => { A = rnd(); st = 0; pintar(); };
    pintar();
    return { destruir() { cont.innerHTML = ''; } };
  }

  // ---------------- las dos escaleras ----------------
  const LL = [[1, 0, 0], [-0.5, 1, 0], [-0.5, -0.6, 1]];
  const UU = [[4, -2, -2], [0, 5, -3], [0, 0, 3.2]];
  function sust(cont) {
    let bsel = 0, st = 0; // st: 0..6
    const B = [[12, 0, 8], [6, 6, 0]];
    cont.innerHTML = `<div class="lu-dg"><div id="lu-sv" class="lu-sv"></div>
      <div class="lu-ctl"><button class="boton prim" id="lu-sig"></button><button class="boton" id="lu-ini">Reiniciar</button><button class="boton" id="lu-b0">fuente b</button><button class="boton" id="lu-b1">fuente b′</button></div></div>`;
    const q = (s) => cont.querySelector(s);
    function pintar() {
      const b = B[bsel];
      const d = [b[0], b[1] - LL[1][0] * b[0], 0];
      d[2] = b[2] - LL[2][0] * d[0] - LL[2][1] * d[1];
      const x = [0, 0, 0];
      x[2] = d[2] / UU[2][2];
      x[1] = (d[1] - UU[1][2] * x[2]) / UU[1][1];
      x[0] = (d[0] - UU[0][1] * x[1] - UU[0][2] * x[2]) / UU[0][0];
      // pasos: 1 d1, 2 d2, 3 d3, 4 x3, 5 x2, 6 x1
      const ver = (k) => st >= k;
      const sd = [ver(1) ? d[0] : '?', ver(2) ? d[1] : '?', ver(3) ? d[2] : '?'];
      const sx = [ver(6) ? x[0] : '?', ver(5) ? x[1] : '?', ver(4) ? x[2] : '?'];
      const eq = ['', `d₁ = b₁ = ${fm(d[0])}`,
        `d₂ = b₂ − l₂₁·d₁ = ${fm(b[1])} − (${fm(LL[1][0])})(${fm(d[0])}) = ${fm(d[1])}`,
        `d₃ = b₃ − l₃₁·d₁ − l₃₂·d₂ = ${fm(d[2])}`,
        `x₃ = d₃ / u₃₃ = ${fm(d[2])} / ${fm(UU[2][2])} = ${fm(x[2])}`,
        `x₂ = (d₂ − u₂₃·x₃) / u₂₂ = ${fm(x[1])}`,
        `x₁ = (d₁ − u₁₂·x₂ − u₁₃·x₃) / u₁₁ = ${fm(x[0])}`][st];
      let s = '';
      // títulos
      s += T(240, 40, 'Adelante: L·d = b', { fs: 34, w: 800, c: C.verde }) + T(720, 40, 'Atrás: U·x = d', { fs: 34, w: 800, c: C.naranja });
      s += T(480, 80, `fuente ${bsel ? 'b′' : 'b'} = (${b.map(fm).join('; ')})`, { fs: 28, c: C.gris });
      const cell = 62;
      const actL = st >= 1 && st <= 3 ? st - 1 : -1, actU = st >= 4 ? 6 - st : -1;
      const mLm = {}, mUm = {};
      if (actL >= 0) for (let j = 0; j <= actL; j++) mLm[actL + ',' + j] = 'nuevo';
      if (actU >= 0) for (let j = actU; j < 3; j++) mUm[actU + ',' + j] = 'cambio';
      s += mat(50, 110, LL, cell, mLm, 26);
      s += mat(500, 110, UU, cell, mUm, 26);
      // vectores resultado
      const colD = 345, colX = 835;
      for (let i = 0; i < 3; i++) {
        const hoyD = st === i + 1, hoyX = st === 6 - i;
        const vd = sd[i], vx = sx[i];
        s += T(colD - 40, 110 + i * cell + 40, `d${'₁₂₃'[i]} =`, { a: 'end', fs: 28, c: C.gris });
        s += R(colD - 32, 110 + i * cell + 6, 105, cell - 12, hoyD ? C.verdeCl : '#fff', { s: hoyD ? C.verde : C.borde, sw: hoyD ? 4 : 1.5, r: 8 });
        s += T(colD + 20, 110 + i * cell + 40, typeof vd === 'string' ? vd : fm(vd), { fs: 30, w: 800, c: typeof vd === 'string' ? '#94a3b8' : C.verde });
        s += T(colX - 40, 110 + i * cell + 40, `x${'₁₂₃'[i]} =`, { a: 'end', fs: 28, c: C.gris });
        s += R(colX - 32, 110 + i * cell + 6, 105, cell - 12, hoyX ? C.ambar : '#fff', { s: hoyX ? C.naranja : C.borde, sw: hoyX ? 4 : 1.5, r: 8 });
        s += T(colX + 20, 110 + i * cell + 40, typeof vx === 'string' ? vx : fm(vx), { fs: 30, w: 800, c: typeof vx === 'string' ? '#94a3b8' : C.naranja });
      }
      // flechas de escalera
      s += `<path d="M30 118 v150" stroke="${C.verde}" stroke-width="6" fill="none" marker-end="url(#fv)"/><path d="M930 268 v-150" stroke="${C.naranja}" stroke-width="6" fill="none" marker-end="url(#fn)"/>`;
      s += `<defs><marker id="fv" markerWidth="10" markerHeight="10" refX="5" refY="8" orient="auto"><path d="M0 0 L10 0 L5 10 z" fill="${C.verde}"/></marker><marker id="fn" markerWidth="10" markerHeight="10" refX="5" refY="2" orient="auto"><path d="M0 10 L10 10 L5 0 z" fill="${C.naranja}"/></marker></defs>`;
      s += R(40, 330, 880, 90, '#fff', { s: C.borde, sw: 2, r: 12 });
      s += T(480, 388, eq || 'Pulsa «Siguiente» para resolver paso a paso', { fs: 32, w: 700 });
      s += T(480, 470, 'L y U no cambian: solo se cambia la fuente b y se repiten las dos escaleras.', { fs: 28, c: C.gris });
      s += T(480, 510, `Resultado: x = (${x.map(fm).join('; ')})`, { fs: 30, w: 800, c: st === 6 ? C.azul : '#cbd5e1' });
      q('#lu-sv').innerHTML = marco(s);
      q('#lu-sig').textContent = st >= 6 ? 'Listo ✓' : ['Calcular d₁', 'Calcular d₂', 'Calcular d₃', 'Calcular x₃', 'Calcular x₂', 'Calcular x₁'][st];
      q('#lu-sig').disabled = st >= 6;
      q('#lu-b0').classList.toggle('activo', bsel === 0);
      q('#lu-b1').classList.toggle('activo', bsel === 1);
    }
    q('#lu-sig').onclick = () => { if (st < 6) { st++; pintar(); } };
    q('#lu-ini').onclick = () => { st = 0; pintar(); };
    q('#lu-b0').onclick = () => { bsel = 0; st = 0; pintar(); };
    q('#lu-b1').onclick = () => { bsel = 1; st = 0; pintar(); };
    pintar();
    return { destruir() { cont.innerHTML = ''; } };
  }

  // ---------------- la red y sus fuentes ----------------
  function resolver3(A, b) {
    const M = A.map((f, i) => f.concat(b[i]));
    for (let c = 0; c < 3; c++) for (let i = c + 1; i < 3; i++) { const m = M[i][c] / M[c][c]; for (let j = c; j < 4; j++) M[i][j] -= m * M[c][j]; }
    const x = [0, 0, 0];
    for (let i = 2; i >= 0; i--) { let t = M[i][3]; for (let j = i + 1; j < 3; j++) t -= M[i][j] * x[j]; x[i] = t / M[i][i]; }
    return x;
  }
  function red(cont) {
    const FUENTES = [[12, 0, 8], [6, 6, 0], [0, 10, 5], [9, 3, 3]];
    let sel = -1, usadas = [];
    cont.innerHTML = `<div class="lu-dg"><div id="lu-sv" class="lu-sv"></div>
      <div class="lu-ctl"><span class="lu-et">Probar la misma red con:</span>${FUENTES.map((_, i) => `<button class="boton" data-f="${i}">Fuente ${i + 1}</button>`).join('')}<button class="boton" id="lu-ini">Reiniciar</button></div></div>`;
    const q = (s) => cont.querySelector(s);
    function res(x, y, w, v) { // resistencia horizontal
      return `<rect x="${x}" y="${y - 12}" width="${w}" height="24" rx="4" fill="#fff" stroke="${C.tinta}" stroke-width="3"/>` + T(x + w / 2, y - 20, v, { fs: 22, c: C.gris });
    }
    function bat(x, y, v, act) {
      return `<circle cx="${x}" cy="${y}" r="26" fill="${act ? C.ambar : '#fff'}" stroke="${act ? C.naranja : C.tinta}" stroke-width="4"/>` + T(x, y + 9, v, { fs: 24, w: 800, c: act ? '#9a3412' : C.tinta });
    }
    function pintar() {
      const b = sel >= 0 ? FUENTES[sel] : null;
      const x = b ? resolver3(A0, b) : null;
      let s = '';
      // circuito: 3 mallas contiguas
      s += T(250, 36, 'La red (no cambia)', { fs: 30, w: 800 });
      const X0 = 40, Y0 = 70, Wm = 160, H = 230;
      s += `<rect x="${X0}" y="${Y0}" width="${Wm * 3}" height="${H}" fill="none" stroke="${C.tinta}" stroke-width="4"/>`;
      s += `<line x1="${X0 + Wm}" y1="${Y0}" x2="${X0 + Wm}" y2="${Y0 + H}" stroke="${C.tinta}" stroke-width="4"/><line x1="${X0 + 2 * Wm}" y1="${Y0}" x2="${X0 + 2 * Wm}" y2="${Y0 + H}" stroke="${C.tinta}" stroke-width="4"/>`;
      for (let i = 0; i < 3; i++) {
        const cx = X0 + Wm * i + Wm / 2;
        s += `<rect x="${cx - 34}" y="${Y0 - 14}" width="68" height="28" fill="${C.fondo}"/>`;
        s += bat(cx, Y0, b ? fm(b[i]) + ' V' : 'V' + '₁₂₃'[i], !!b);
        s += `<path d="M${cx - 40} ${Y0 + 120} a40 40 0 1 1 80 0" fill="none" stroke="${C.azul}" stroke-width="5" marker-end="url(#fa)"/>`;
        s += T(cx, Y0 + 165, 'x' + '₁₂₃'[i] + (x ? ' = ' + fm(x[i]) : ''), { fs: 28, w: 800, c: C.azul });
        s += T(cx, Y0 + 205, 'malla ' + (i + 1), { fs: 22, c: C.gris });
      }
      s += `<defs><marker id="fa" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="${C.azul}"/></marker></defs>`;
      // contadores
      const n = usadas.length;
      s += T(740, 36, 'Trabajo de eliminar A', { fs: 30, w: 800 });
      s += T(740, 80, 'Gauss', { fs: 30, w: 800, c: C.naranja });
      s += T(740, 190, 'LU', { fs: 30, w: 800, c: C.verde });
      for (let i = 0; i < 6; i++) {
        const on = i < n;
        s += R(560 + i * 62, 100, 52, 52, on ? '#fde8cc' : '#fff', { s: on ? C.naranja : C.borde, sw: 3 });
        if (on) s += T(586 + i * 62, 136, '⚙', { fs: 34, c: C.naranja });
      }
      s += T(740, 178 - 4, '', {});
      s += R(560, 210, 52, 52, n ? C.verdeCl : '#fff', { s: n ? C.verde : C.borde, sw: 3 });
      if (n) s += T(586, 246, '⚙', { fs: 34, c: C.verde });
      for (let i = 1; i < 6; i++) s += R(560 + i * 62, 210, 52, 52, '#fff', { s: C.borde, sw: 1.5, r: 8 }).replace('fill="#fff"', 'fill="#f1f5f9"');
      s += T(740, 292, n ? `Gauss: ${n} eliminaci${n > 1 ? 'ones' : 'ón'}; LU: 1` : 'Prueba una fuente', { fs: 30, w: 700, c: n > 1 ? C.rojo : C.tinta });
      s += T(480, 345, b ? `Fuente ${sel + 1}: b = (${b.map(fm).join('; ')})  →  x = (${x.map(fm).join('; ')})` : 'Pulsa una fuente: cambia b, pero la red (A) es la misma', { fs: 30, w: 700 });
      s += T(480, 410, n > 1 ? 'Gauss vuelve a eliminar A en cada fuente.' : 'Una fuente: las dos formas trabajan casi igual.', { fs: 32, c: C.tinta, w: 700 });
      s += T(480, 465, n > 1 ? 'LU elimina A una sola vez, guarda el resultado (L y U) y lo reutiliza.' : 'Prueba otra fuente y mira qué pasa.', { fs: 30, c: C.verde, w: 700 });
      q('#lu-sv').innerHTML = marco(s);
      cont.querySelectorAll('[data-f]').forEach((bt) => bt.classList.toggle('activo', Number(bt.dataset.f) === sel));
    }
    cont.querySelectorAll('[data-f]').forEach((bt) => (bt.onclick = () => { sel = Number(bt.dataset.f); if (usadas.length < 6) usadas.push(sel); pintar(); }));
    q('#lu-ini').onclick = () => { sel = -1; usadas = []; pintar(); };
    pintar();
    return { destruir() { cont.innerHTML = ''; } };
  }

  FS.diagrama = function (cont, o) {
    if (o && o.modo === 'luRed') return red(cont, o.params);
    if (o && o.modo === 'luCosto') return costo(cont, o.params);
    if (o && o.modo === 'luPaso') return paso(cont, o.params);
    if (o && o.modo === 'luSust') return sust(cont, o.params);
    return orig(cont, o);
  };
})();
