// ============================================================
// Métodos Numéricos · Factorización LU — diagramas interactivos (HTML liviano, colores claros)
//   luCosto: n, k  →  barras Gauss repetido frente a LU
//   luPaso : eliminación paso a paso; los multiplicadores caen en L, lo que queda arriba es U
// Se enchufan en FS.diagrama (los demás modos siguen siendo los de fs-onda.js).
// ============================================================
(function () {
  const FS = (window.FS = window.FS || {});
  const orig = FS.diagrama;

  const fm = (x) => {
    if (!isFinite(x)) return '—';
    let v = Math.round(x * 1e4) / 1e4;
    if (Object.is(v, -0) || v === 0) v = 0;
    return String(v).replace('.', ',');
  };
  const miles = (x) => Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  // ---------------- costo ----------------
  function costo(cont) {
    cont.innerHTML = `<div class="lu-dg">
      <div class="lu-izq">
        <label class="lu-sl"><span>Tamaño de la matriz: n = <b id="lu-n">100</b></span><input type="range" id="lu-ns" min="3" max="200" value="100"></label>
        <label class="lu-sl"><span>Fuentes distintas: k = <b id="lu-k">50</b></span><input type="range" id="lu-ks" min="1" max="100" value="50"></label>
        <p class="lu-nota">Gauss repetido: k·(n³/3 + n²) multiplicaciones.<br>LU: n³/3 + k·n² (se factoriza una vez; cada b nuevo cuesta n²).</p>
      </div>
      <div class="lu-der">
        <div class="lu-barra"><span class="lu-et">Gauss repetido</span><span class="lu-pista"><i id="lu-bg" style="width:100%;background:#e67700"></i></span><b id="lu-vg"></b></div>
        <div class="lu-barra"><span class="lu-et">LU</span><span class="lu-pista"><i id="lu-bl" style="background:#1b8a5a"></i></span><b id="lu-vl"></b></div>
        <p class="lu-gran" id="lu-res"></p>
      </div></div>`;
    const q = (s) => cont.querySelector(s);
    function pintar() {
      const n = Number(q('#lu-ns').value), k = Number(q('#lu-ks').value);
      q('#lu-n').textContent = n;
      q('#lu-k').textContent = k;
      const g = k * (n ** 3 / 3 + n * n), l = n ** 3 / 3 + k * n * n;
      q('#lu-bl').style.width = Math.max(1.5, (l / g) * 100) + '%';
      q('#lu-vg').textContent = miles(g);
      q('#lu-vl').textContent = miles(l);
      const r = g / l;
      q('#lu-res').innerHTML = k === 1 ? 'Con una sola fuente, las dos cuestan casi lo mismo.' : `LU hace <b>${r >= 10 ? Math.round(r) : fm(Math.round(r * 10) / 10)} veces menos</b> trabajo.`;
    }
    cont.querySelectorAll('input[type=range]').forEach((i) => i.addEventListener('input', pintar));
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
  const matHTML = (M, marca) => `<div class="lu-mat">${M.map((f, i) => f.map((v, j) => `<span class="${(marca && marca[i + ',' + j]) || ''}">${fm(v)}</span>`).join('')).join('')}</div>`;

  function paso(cont, params) {
    let A = (params && params.A) || A0;
    let st = 0;
    cont.innerHTML = `<div class="lu-dg lu-paso">
      <div class="lu-fila-mats">
        <div class="lu-bloque"><b>A</b><div id="lu-a"></div></div>
        <div class="lu-signo">=</div>
        <div class="lu-bloque"><b>L</b> <small>multiplicadores</small><div id="lu-l"></div></div>
        <div class="lu-signo">·</div>
        <div class="lu-bloque"><b>U</b> <small>tras eliminar</small><div id="lu-u"></div></div>
      </div>
      <p class="lu-texto" id="lu-t"></p>
      <div class="lu-botones"><button class="boton prim" id="lu-sig"></button><button class="boton" id="lu-ini">Reiniciar</button><button class="boton" id="lu-otra">Otra matriz</button></div>
    </div>`;
    const q = (s) => cont.querySelector(s);
    function pintar() {
      const M = A.map((f) => f.slice());
      const L = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      const mL = {}, mU = {};
      let txt = 'A es la matriz de las resistencias. Todavía no hemos eliminado nada: L es la identidad.';
      let aviso = '';
      if (st >= 1) {
        if (Math.abs(M[0][0]) < 1e-9) aviso = 'El pivote a₁₁ es 0: habría que intercambiar filas.';
        const l21 = M[1][0] / M[0][0], l31 = M[2][0] / M[0][0];
        for (let j = 0; j < 3; j++) { M[1][j] -= l21 * M[0][j]; M[2][j] -= l31 * M[0][j]; }
        M[1][0] = 0; M[2][0] = 0;
        L[1][0] = l21; L[2][0] = l31;
        mL['1,0'] = mL['2,0'] = 'nuevo';
        ['1,1', '1,2', '2,1', '2,2'].forEach((k) => (mU[k] = 'cambio'));
        txt = `Columna 1. Multiplicadores: l₂₁ = ${fm(A[1][0])} / ${fm(A[0][0])} = ${fm(l21)} ; l₃₁ = ${fm(A[2][0])} / ${fm(A[0][0])} = ${fm(l31)}. Fila 2 ← fila 2 − (${fm(l21)})·fila 1 ; fila 3 ← fila 3 − (${fm(l31)})·fila 1. Los multiplicadores se guardan en L.`;
      }
      if (st >= 2) {
        if (Math.abs(M[1][1]) < 1e-9) aviso = 'El pivote u₂₂ es 0: habría que intercambiar filas.';
        const l32 = M[2][1] / M[1][1];
        for (let j = 0; j < 3; j++) M[2][j] -= l32 * M[1][j];
        M[2][1] = 0;
        L[2][1] = l32;
        Object.keys(mL).forEach((k) => (mL[k] = ''));
        mL['2,1'] = 'nuevo';
        Object.keys(mU).forEach((k) => (mU[k] = ''));
        mU['2,2'] = 'cambio';
        txt = `Columna 2. Con el pivote u₂₂ = ${fm(M[1][1])}: l₃₂ = ${fm(l32 * M[1][1])} / ${fm(M[1][1])} = ${fm(l32)}. Fila 3 ← fila 3 − (${fm(l32)})·fila 2. Ya tenemos U arriba y L completa.`;
      }
      if (st >= 3) {
        const P = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) P[i][j] += L[i][k] * M[k][j];
        const ok = P.every((f, i) => f.every((v, j) => Math.abs(v - A[i][j]) < 1e-9));
        txt = ok ? 'Comprobación: al multiplicar L por U se recupera A exactamente. Este trabajo se hizo una sola vez: sirve para cualquier b.' : 'Comprobación: L·U no coincide con A (revisa los pasos).';
      }
      q('#lu-a').innerHTML = matHTML(A);
      q('#lu-l').innerHTML = matHTML(L, mL);
      q('#lu-u').innerHTML = matHTML(M, mU);
      q('#lu-t').textContent = (aviso ? aviso + ' ' : '') + txt;
      const sig = q('#lu-sig');
      sig.textContent = ['Paso 1: anular la columna 1', 'Paso 2: anular la columna 2', 'Comprobar L·U = A', 'Listo ✓'][st];
      sig.disabled = st >= 3;
    }
    q('#lu-sig').onclick = () => { if (st < 3) { st++; pintar(); } };
    q('#lu-ini').onclick = () => { st = 0; pintar(); };
    q('#lu-otra').onclick = () => { A = rnd(); st = 0; pintar(); };
    pintar();
    return { destruir() { cont.innerHTML = ''; } };
  }

  FS.diagrama = function (cont, o) {
    if (o && o.modo === 'luCosto') return costo(cont, o.params);
    if (o && o.modo === 'luPaso') return paso(cont, o.params);
    return orig(cont, o);
  };
})();
