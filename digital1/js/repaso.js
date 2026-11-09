// ============================================================
// Electrónica Digital 1 — Repaso para el examen (09/11/2026)
//   Página para el celular: temas → teoría / ejercicios / preguntas, y un
//   simulacro al azar. No se conecta a la base de datos: no hay registro, no se
//   envía nada y no cambia ningún punto. El avance se guarda solo en el celular.
//   Rutas: #/  ·  #/t/<tema>[/ej|/pr]  ·  #/e/<tema>/<ejercicio>  ·  #/sim
// ============================================================
(function () {
  'use strict';
  const D1 = window.D1, K = D1.k, E = D1.EJERCICIOS, RP = D1.RP;
  const TEMAS = D1.REPASO.TEMAS;
  const $ = (s, r) => (r || document).querySelector(s);
  const app = $('#app');
  const LET = 'ABCDEF';
  const SEP = (s) => (typeof s === 'string' ? s.replace(/ · /g, '; ') : s);
  const PRE = 'd1rep-v1-';
  const leer = (k, d) => II.leer(PRE + k, d);
  const guardar = (k, v) => II.guardar(PRE + k, v);
  let uid = leer('uid', null);
  if (!uid) { uid = Math.random().toString(36).slice(2, 10); guardar('uid', uid); }
  const temaDe = (id) => TEMAS.find((t) => t.id === id);
  const esNuevo = (k) => /^n\d+$/.test(k);

  // ---------- limpieza al cambiar de página ----------
  let limpiar = [];
  function soltar() { limpiar.forEach((fn) => { try { fn(); } catch (e) { /* nada */ } }); limpiar = []; }

  // ---------- avance (solo en este celular) ----------
  const hecho = () => leer('hecho', {});
  function marcarHecho(k, frac) { const h = hecho(); h[k] = Math.max(h[k] || 0, frac); guardar('hecho', h); }

  // =================================================================
  // Widgets para manipular (teoría)
  // =================================================================
  const W = {};
  W.bits8 = (z) => {
    const P = [128, 64, 32, 16, 8, 4, 2, 1], b = Array(8).fill(0);
    let meta = 100;
    z.innerHTML = '<p class="lbl">Toca los bits para formar números.</p><div class="c5-bits rp-w8"></div><p class="rp-wres"></p><div class="rp-reto"><span></span><button class="boton">Nuevo reto</button></div>';
    const fila = $('.rp-w8', z);
    fila.innerHTML = P.map((p, i) => '<div class="c5-bit"><small>' + p + '</small><button class="c4-b" data-i="' + i + '">0</button></div>').join('');
    const pintar = () => {
      let s = 0; const partes = [];
      b.forEach((v, i) => { if (v) { s += P[i]; partes.push(P[i]); } });
      fila.querySelectorAll('.c4-b').forEach((x, i) => { x.textContent = b[i]; x.classList.toggle('uno', !!b[i]); });
      $('.rp-wres', z).innerHTML = 'Binario ' + RP.bits(b.join('')) + ' = ' + (partes.length ? partes.join(' + ') : '0') + ' = <b>' + s + '</b>';
      $('.rp-reto span', z).innerHTML = 'Reto: forma el <b>' + meta + '</b> ' + (s === meta ? '<b class="on-t">✓ ¡Logrado!</b>' : '');
    };
    fila.addEventListener('click', (e) => { const x = e.target.closest('.c4-b'); if (x) { b[+x.dataset.i] ^= 1; pintar(); } });
    $('.rp-reto button', z).onclick = () => { meta = 1 + Math.floor(Math.random() * 255); pintar(); };
    pintar();
  };
  W.bcd = (z) => {
    let n = 473;
    z.innerHTML = '<p class="lbl">Cambia el número decimal y compara su BCD con su binario.</p><div class="rp-num"><button class="boton" data-d="-10">−10</button><button class="boton" data-d="-1">−1</button><b class="rp-n"></b><button class="boton" data-d="1">+1</button><button class="boton" data-d="10">+10</button></div><div class="rp-wres"></div>';
    const pintar = () => {
      $('.rp-n', z).textContent = n;
      $('.rp-wres', z).innerHTML = '<p>Cada dígito: ' + String(n).split('').map((c) => c + ' → ' + RP.bin(+c, 4)).join('; ') + '</p>' +
        '<p>En <b>BCD</b>: ' + RP.bits(RP.bcd(n)) + ' (' + RP.bcd(n).length + ' bits)</p><p>En <b>binario</b>: ' + RP.bits(RP.bin(n)) + ' (' + RP.bin(n).length + ' bits)</p>';
    };
    z.addEventListener('click', (e) => { const x = e.target.closest('[data-d]'); if (x) { n = Math.min(999, Math.max(0, n + +x.dataset.d)); pintar(); } });
    pintar();
  };
  // símbolo de compuerta (rescatado del HTML de la Clase 1)
  const P_AND = 'M0,0 H30 A30,30 0 0 1 30,60 H0 Z', P_OR = 'M-4,0 Q12,30 -4,60 Q36,60 62,30 Q36,0 -4,0 Z', P_XB = 'M-10,0 Q6,30 -10,60';
  const OUTX = { AND: 60, NAND: 70, OR: 62, NOR: 72, XOR: 62, XNOR: 72, NOT: 54 };
  function forma(t) {
    const bur = (cx) => '<circle class="gb" cx="' + cx + '" cy="30" r="5"/>';
    return { AND: '<path class="gb" d="' + P_AND + '"/>', NAND: '<path class="gb" d="' + P_AND + '"/>' + bur(65), OR: '<path class="gb" d="' + P_OR + '"/>', NOR: '<path class="gb" d="' + P_OR + '"/>' + bur(67),
      XOR: '<path class="gb" d="' + P_OR + '"/><path class="gb nf" d="' + P_XB + '"/>', XNOR: '<path class="gb" d="' + P_OR + '"/><path class="gb nf" d="' + P_XB + '"/>' + bur(67), NOT: '<path class="gb" d="M0,8 L44,30 L0,52 Z"/>' + bur(49) }[t];
  }
  W.compuerta = (z) => {
    const G = Object.assign({ NOT: (a) => 1 - a }, RP.G), EXP = { NOT: X('Y = \\overline{A}'), AND: X('Y = A\\cdot B'), OR: X('Y = A + B'), NAND: X('Y = \\overline{A\\cdot B}'), NOR: X('Y = \\overline{A + B}'), XOR: X('Y = A \\oplus B'), XNOR: X('Y = \\overline{A \\oplus B}') };
    function X(s) { return '\\(' + s + '\\)'; }
    let t = 'AND', a = 0, b = 0;
    z.innerHTML = '<p class="lbl">Elige una compuerta y toca A y B.</p><div class="rp-gsel">' + Object.keys(EXP).map((g) => '<button class="boton" data-g="' + g + '">' + g + '</button>').join('') + '</div><div class="rp-gx"><svg viewBox="0 0 240 110"></svg><div class="rp-gtab"></div></div><p class="rp-gexp"></p>';
    const svg = $('svg', z);
    function pintar() {
      const y = t === 'NOT' ? G.NOT(a) : G[t](a, b), s = 1.4, gx = 82, gy = 13;
      const io = (n, x, yy, v) => '<g class="rp-gin" data-n="' + n + '"><circle cx="' + x + '" cy="' + yy + '" r="13" class="io' + (v ? ' hi' : '') + '"/><text x="' + x + '" y="' + (yy + 5) + '" class="iot">' + v + '</text><text x="' + (x - 26) + '" y="' + (yy + 5) + '" class="st">' + n + '</text></g>';
      const ins = t === 'NOT' ? [['A', 30 * s + gy, a]] : [['A', 15 * s + gy, a], ['B', 45 * s + gy, b]];
      const ix = (t === 'OR' || t === 'NOR') ? 2 : (t === 'XOR' || t === 'XNOR') ? -4 : 0;
      let h = ins.map(([n, yy, v]) => '<path class="w' + (v ? ' hi' : '') + '" d="M48,' + yy + ' H' + (gx + ix * s) + '"/>').join('');
      h += '<g transform="translate(' + gx + ',' + gy + ') scale(' + s + ')" style="--sw:' + (2.6 / s).toFixed(2) + '">' + forma(t) + '</g>';
      const ox = gx + OUTX[t] * s, oy = gy + 30 * s;
      h += '<path class="w' + (y ? ' hi' : '') + '" d="M' + ox + ',' + oy + ' H205"/><circle class="led' + (y ? ' lit' : '') + '" cx="215" cy="' + oy + '" r="11"/><text class="st" x="208" y="' + (oy + 32) + '">Y = ' + y + '</text>';
      h += ins.map(([n, yy, v]) => io(n, 36, yy, v)).join('');
      svg.innerHTML = h;
      const filas = t === 'NOT' ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
      $('.rp-gtab', z).innerHTML = '<table class="tt tight"><tr><th>A</th>' + (t === 'NOT' ? '' : '<th>B</th>') + '<th>Y</th></tr>' + filas.map((r) => {
        const yy = t === 'NOT' ? G.NOT(r[0]) : G[t](r[0], r[1]), cur = r[0] === a && (t === 'NOT' || r[1] === b);
        return '<tr class="' + (cur ? 'hl' : '') + '"><td>' + r.join('</td><td>') + '</td><td class="' + (yy ? 'v1' : '') + '">' + yy + '</td></tr>';
      }).join('') + '</table>';
      $('.rp-gexp', z).innerHTML = EXP[t] + (t === 'NOT' ? ': invierte la entrada.' : ': ' + RP.REGLA[t] + '.');
      z.querySelectorAll('[data-g]').forEach((x) => x.classList.toggle('prim', x.dataset.g === t));
    }
    z.addEventListener('click', (e) => {
      const g = e.target.closest('[data-g]'); if (g) { t = g.dataset.g; pintar(); return; }
      const i = e.target.closest('.rp-gin'); if (i) { if (i.dataset.n === 'A') a ^= 1; else b ^= 1; pintar(); }
    });
    pintar();
  };
  W.demorgan = (z) => {
    const f = (x) => (x ? '<td class="v1">1</td>' : '<td>0</td>');
    z.innerHTML = '<p class="lbl">Compruébalo fila por fila: las columnas del mismo color son iguales.</p><div class="rp-scroll"><table class="tt tight rp-dm"><tr><th>A</th><th>B</th><th class="c1">' + '\\(\\overline{A\\cdot B}\\)' + '</th><th class="c1">' + '\\(\\overline{A} + \\overline{B}\\)' +
      '</th><th class="c2">' + '\\(\\overline{A + B}\\)' + '</th><th class="c2">' + '\\(\\overline{A}\\cdot\\overline{B}\\)' + '</th></tr>' +
      [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => '<tr><td>' + a + '</td><td>' + b + '</td>' + f(1 - (a & b)) + f((1 - a) | (1 - b)) + f(1 - (a | b)) + f((1 - a) & (1 - b)) + '</tr>').join('') + '</table></div>';
  };
  W.voltaje = (z) => {
    z.innerHTML = '<p class="lbl">Mueve el voltaje de la entrada (TTL).</p><input type="range" min="0" max="5" step="0.1" value="3.5" class="rp-rng"><div class="rp-vbar"><div class="z0">0</div><div class="zx">?</div><div class="z1">1</div><i></i></div><p class="rp-wres"></p>';
    const r = $('input', z);
    const pintar = () => {
      const v = +r.value, lee = v <= 0.8 ? '0' : v >= 2 ? '1' : '?';
      $('.rp-vbar i', z).style.left = (v / 5 * 100) + '%';
      $('.rp-wres', z).innerHTML = 'Entrada: <b>' + v.toFixed(1).replace('.', ',') + ' V</b> → se lee <b class="' + (lee === '?' ? 'warn-t' : 'on-t') + '">' + (lee === '?' ? '? (zona prohibida: puede leer 0 o 1)' : lee) + '</b>';
    };
    r.oninput = pintar; pintar();
  };
  W.circuito = (z) => {
    let s, v = [0, 0, 0], vistas = {};
    z.innerHTML = '<p class="lbl">Un circuito al azar: toca A, B y C, sigue la señal y arma su tabla.</p><div class="rp-sw3"></div><div class="rp-wcirc"></div><p class="rp-wres"></p><div class="rp-wt"></div><button class="boton bloque">Otro circuito</button>';
    const nuevo = () => { s = RP.sopAzar(Math.random); v = [0, 0, 0]; vistas = {}; pintar(); };
    const pintar = () => {
      const m = v[0] * 4 + v[1] * 2 + v[2], y = s.f[m]; vistas[m] = y;
      $('.rp-sw3', z).innerHTML = ['A', 'B', 'C'].map((n, i) => '<button class="boton' + (v[i] ? ' prim' : '') + '" data-i="' + i + '">' + n + ' = ' + v[i] + '</button>').join('');
      $('.rp-wcirc', z).innerHTML = '<div class="rp-circ">' + D1.circ.svg(3, s.pu, ['A', 'B', 'C'], { mono: true, salida: 'Y' }) + '</div>';
      $('.rp-wres', z).innerHTML = '\\(Y = ' + RP.sopTex(s.pu, ['A', 'B', 'C']) + '\\) → con estas entradas, <b>Y = ' + y + '</b>';
      let h = '<table class="tt tight"><tr><th>A</th><th>B</th><th>C</th><th>Y</th></tr>';
      for (let k = 0; k < 8; k++) h += '<tr class="' + (k === m ? 'hl' : '') + '"><td>' + (k >> 2 & 1) + '</td><td>' + (k >> 1 & 1) + '</td><td>' + (k & 1) + '</td><td class="' + (vistas[k] ? 'v1' : '') + '">' + (vistas[k] == null ? '?' : vistas[k]) + '</td></tr>';
      $('.rp-wt', z).innerHTML = '<div class="centro">' + h + '</table></div>';
    };
    z.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) { v[+b.dataset.i] ^= 1; pintar(); } else if (e.target.closest('.bloque')) nuevo(); });
    nuevo();
  };
  W.mapa = (z) => {
    let nv = 3, ed = null;
    z.innerHTML = '<p class="lbl">Llena un mapa, agrupa y compara con la solución mínima.</p><div class="rp-num"><button class="boton" data-nv="3">3 variables</button><button class="boton" data-nv="4">4 variables (con X)</button></div><div class="rp-ked"></div><button class="boton prim bloque" data-v>Ver la solución mínima</button><div class="rp-wres"></div>';
    const nuevo = (n) => {
      nv = n; if (ed) ed.destruir();
      ed = K.editor($('.rp-ked', z), { nv, conX: nv === 4 });
      $('.rp-wres', z).innerHTML = '';
      z.querySelectorAll('[data-nv]').forEach((b) => b.classList.toggle('prim', +b.dataset.nv === nv));
    };
    z.addEventListener('click', (e) => {
      const b = e.target.closest('[data-nv]'); if (b) return nuevo(+b.dataset.nv);
      if (e.target.closest('[data-v]')) {
        const est = ed.estado(), sol = K.resolver(nv, est.vals);
        const tuya = est.grupos.length ? (K.equivale(nv, est.grupos, est.vals) ? (est.grupos.length === sol.cubos.length && K.lits(est.grupos) === sol.lits ? '<b class="on-t">✓ Tus grupos dan la expresión mínima.</b>' : '<b class="warn-t">Tus grupos son correctos, pero no es la mínima.</b>') : '<b class="bad-t">✗ Tus grupos no cubren bien los unos.</b>') : '';
        $('.rp-wres', z).innerHTML = '<div class="sol-mapa">' + K.estatico(nv, est.vals, { grupos: sol.cubos }) + '<p class="expr">Y = ' + K.expr(sol.cubos, nv, nv === 4 ? K.N4 : K.N3, true) + '</p></div>' + tuya;
      }
    });
    nuevo(3);
    limpiar.push(() => ed && ed.destruir());
  };
  W.bomba = (z) => { const b = D1.diag.bomba(z, { botonesFalla: true, celular: true }); limpiar.push(() => b.destruir()); };
  W.display = (z) => {
    let n = 5;
    z.innerHTML = '<p class="lbl">Toca un dígito: mira su código BCD y qué segmentos se encienden.</p><div class="rp-num rp-dig">' + Array.from({ length: 10 }, (_, i) => '<button class="boton" data-n="' + i + '">' + i + '</button>').join('') + '</div><div class="rp-7"></div>';
    const pintar = () => {
      const on = Object.keys(D1.seg.SEG).filter((s) => D1.seg.SEG[s].includes(n));
      $('.rp-7', z).innerHTML = '<div class="rp-7d">' + D1.seg.svg(n, { letras: true }) + '</div><div><p>Entrada en BCD (ABCD): ' + RP.bits(RP.bin(n, 4)) + '</p><p>Se encienden: <b>' + on.join('; ') + '</b></p><p class="lbl">Apagados: ' + (Object.keys(D1.seg.SEG).filter((s) => !on.includes(s)).join('; ') || 'ninguno') + '</p></div>';
      z.querySelectorAll('[data-n]').forEach((b) => b.classList.toggle('prim', +b.dataset.n === n));
    };
    z.addEventListener('click', (e) => { const b = e.target.closest('[data-n]'); if (b) { n = +b.dataset.n; pintar(); } });
    pintar();
  };
  ['tiempos', 'paridad', 'bloque'].forEach((k) => {
    W[k] = (z) => { const r = D1.EXPLORAR[k](z); if (r && r.destruir) limpiar.push(() => r.destruir()); };
  });

  // =================================================================
  // Páginas
  // =================================================================
  const cab = (titulo, sub) => { $('#e-nombre').textContent = sub || 'Repaso para el examen'; document.title = titulo + ' · Digital 1'; };
  const fracTema = (t) => { const h = hecho(); return t.ejercicios.filter((k) => h[k] != null).length; };

  function vInicio() {
    cab('Repaso para el examen');
    app.innerHTML = '<div class="tarjeta rp-intro"><span class="etq">Electrónica Digital 1</span><h2>Repaso para el examen</h2>' +
      '<p>Todo lo que avanzamos: la teoría de cada tema, los mismos ejercicios de clase y ejercicios nuevos. Cada vez que pides <b>«Otro ejercicio»</b> los datos cambian.</p>' +
      '<p class="lbl">Esta página no se conecta a la plataforma: no pide tu nombre, no envía nada y no cambia tus puntos. Tu avance queda guardado solo en este celular.</p></div>' +
      '<a class="rp-tema rp-sim" href="#/sim"><span class="rp-ic">⏱</span><span><b>Simulacro de examen</b><small>20 preguntas al azar de todos los temas; la nota al final</small></span></a>' +
      '<div class="rp-temas">' + TEMAS.map((t) => '<a class="rp-tema" href="#/t/' + t.id + '"><span class="rp-ic">' + t.n + '</span><span><b>' + t.titulo + '</b><small>' + t.corto + '</small>' +
        '<small class="rp-av">' + fracTema(t) + ' de ' + t.ejercicios.length + ' ejercicios hechos; ' + t.rapidas.length + ' preguntas</small></span></a>').join('') + '</div>';
  }

  function tabsTema(t, act) {
    return '<div class="rp-migas"><a href="#/">← Temas</a></div><div class="rp-tt"><span class="rp-ic">' + t.n + '</span><h2>' + t.titulo + '</h2></div>' +
      '<div class="rp-tabs"><a href="#/t/' + t.id + '" class="' + (act === 'teo' ? 'sel' : '') + '">Teoría</a><a href="#/t/' + t.id + '/ej" class="' + (act === 'ej' ? 'sel' : '') + '">Ejercicios (' + t.ejercicios.length + ')</a><a href="#/t/' + t.id + '/pr" class="' + (act === 'pr' ? 'sel' : '') + '">Preguntas</a></div>';
  }
  function pieTema(t, act) {
    const i = TEMAS.indexOf(t), sig = TEMAS[i + 1];
    const siguiente = act === 'teo' ? ['#/t/' + t.id + '/ej', 'Practicar: ejercicios →'] : act === 'ej' ? ['#/t/' + t.id + '/pr', 'Preguntas rápidas →'] : sig ? ['#/t/' + sig.id, 'Siguiente tema: ' + sig.titulo + ' →'] : ['#/sim', 'Hacer el simulacro →'];
    return '<a class="boton prim bloque rp-sig" href="' + siguiente[0] + '">' + siguiente[1] + '</a>';
  }

  function vTeoria(t) {
    cab(t.titulo, t.n + ' · ' + t.titulo);
    app.innerHTML = tabsTema(t, 'teo') + t.teoria.map((s, i) => (s.w ? '<div class="tarjeta rp-wid" data-w="' + s.w + '" id="w' + i + '"></div>' : '<div class="tarjeta rp-sec"><h3>' + s.t + '</h3>' + s.h + '</div>')).join('') +
      '<div class="tarjeta rp-err"><h3>⚠ Errores típicos (vistos en clase)</h3><ul>' + t.errores.map((x) => '<li>' + x + '</li>').join('') + '</ul></div>' + pieTema(t, 'teo');
    app.querySelectorAll('[data-w]').forEach((z) => { const f = W[z.dataset.w]; if (f) f(z); });
  }

  function vListaEj(t) {
    cab(t.titulo, t.n + ' · Ejercicios');
    const h = hecho();
    app.innerHTML = tabsTema(t, 'ej') + '<p class="lbl rp-nota">Resuelve con tu cuaderno y toca <b>Revisar</b>: verás la solución con tus datos. «Otro ejercicio» te da datos nuevos.</p>' +
      t.ejercicios.map((k) => {
        const ej = E[k], f = h[k];
        return '<a class="rp-ej" href="#/e/' + t.id + '/' + k + '"><span><b>' + ej.titulo + '</b><small>' + ej.puntos + ' puntos' + (esNuevo(k) ? '; <span class="rp-nuevo">nuevo</span>' : '; como en clase') + '</small></span>' +
          '<span class="rp-est ' + (f == null ? '' : f >= 1 ? 'ok' : 'duda') + '">' + (f == null ? '›' : f >= 1 ? '✓' : Math.round(f * 100) + ' %') + '</span></a>';
      }).join('') + pieTema(t, 'ej');
  }

  function vEjercicio(t, k) {
    const ej = E[k];
    if (!ej) return irA('#/t/' + t.id + '/ej');
    cab(ej.titulo, t.n + ' · ' + t.titulo);
    const semilla = leer('sem-' + k, 0);
    const d = ej.generar(II.rng('rep|' + uid + '|' + k + '|' + semilla));
    const kB = 'b-' + k + '-' + semilla, kR = 'r-' + k + '-' + semilla;
    const head = '<div class="rp-migas"><a href="#/t/' + t.id + '/ej">← Ejercicios de «' + t.titulo + '»</a></div>';
    const cabEj = '<span class="etq">Ejercicio · ' + ej.puntos + ' puntos' + (esNuevo(k) ? ' · nuevo' : '') + '</span><h2>' + ej.titulo + '</h2>';
    const otra = () => { soltar(); guardar('sem-' + k, semilla + 1); vEjercicio(t, k); window.scrollTo(0, 0); };
    const hecha = leer(kR, null);
    if (hecha) {
      const ev = ej.evaluar(hecha, d);
      const cls = ev.puntos >= ej.puntos ? 'ok' : ev.puntos > 0 ? 'duda' : 'mal';
      app.innerHTML = head + '<div class="tarjeta">' + cabEj + '<div class="aviso ' + cls + '">' + (ev.puntos >= ej.puntos ? '¡Correcto! ' : ev.puntos > 0 ? 'Casi. ' : 'Incorrecto. ') + II.fmt(ev.puntos, 1) + ' de ' + ej.puntos + ' puntos<br><span style="font-weight:500">' + SEP(ev.texto) + '</span></div>' +
        '<p class="etq">Solución con tus datos</p>' + SEP(ej.solucion(d).html) + '<p class="etq mi-res">Tu respuesta</p>' + SEP(ej.vista(hecha, d)) +
        '<button class="boton prim bloque" id="rp-otra" style="margin-top:14px">Otro ejercicio (datos nuevos)</button>' +
        '<a class="boton bloque" style="margin-top:10px" href="#/t/' + t.id + '/ej">Volver a los ejercicios</a></div>';
      $('#rp-otra').onclick = otra;
      return;
    }
    app.innerHTML = head + '<div class="tarjeta">' + cabEj + (ej.enunciado ? ej.enunciado(d) : '') + '<div id="zona-dg"></div>' +
      '<button class="boton prim bloque" id="rp-rev" style="margin-top:14px">Revisar mi respuesta</button><button class="boton bloque" id="rp-salta" style="margin-top:10px">Otro ejercicio (datos nuevos)</button></div>';
    const ctrl = ej.montar($('#zona-dg'), d);
    limpiar.push(() => ctrl.destruir && ctrl.destruir());
    const borr = leer(kB, null);
    if (borr && ctrl.fijar) ctrl.fijar(borr);
    ctrl.alCambiar(() => guardar(kB, ctrl.estado()));
    $('#rp-salta').onclick = otra;
    $('#rp-rev').onclick = () => {
      const est = ctrl.estado(), ev = ej.evaluar(est, d);
      guardar(kR, est);
      marcarHecho(k, ev.puntos / ej.puntos);
      soltar(); vEjercicio(t, k); window.scrollTo(0, 0);
    };
  }

  // ---------- preguntas (rápidas del tema + generadas) ----------
  function itemsGenerados(t, cuantos) {
    const out = [];
    t.ejercicios.filter((k) => E[k] && E[k].tipo === 'opciones').forEach((k) => {
      const d = E[k].generar(II.rng('q|' + Math.random()));
      d.its.forEach((it) => out.push({ t: it.t, fig: it.fig, o: it.o, por: it.por + (it.sol ? '' : ''), sol: it.sol, svg: it.svg, una: it.una }));
    });
    return II.mezclar(Math.random, out).slice(0, cuantos);
  }
  function preparar(lista) { return lista.map((q) => Object.assign({}, q, { per: II.mezclar(Math.random, q.o.map((_, i) => i)) })); }
  function preguntaHTML(q, i, n, elegida, mostrar) {
    return '<div class="tarjeta rp-q"><span class="etq">Pregunta ' + (i + 1) + ' de ' + n + '</span><p class="rp-t">' + q.t + '</p>' + (q.fig || '') +
      '<div class="opciones-est' + (q.svg ? ' rp-svgops' : '') + '">' + q.per.map((k, j) => {
        let c = '';
        if (mostrar) c = k === 0 ? ' correcta' : k === elegida ? ' errada' : '';
        else if (k === elegida) c = ' elegida';
        return '<button class="opcion-est' + c + '" data-k="' + k + '"' + (mostrar ? ' disabled' : '') + '><span class="letra">' + LET[j] + '</span><span class="rp-op">' + q.o[k] + '</span></button>';
      }).join('') + '</div>' +
      (mostrar ? '<div class="aviso ' + (elegida === 0 ? 'ok' : 'mal') + '">' + (elegida === 0 ? '¡Correcto!' : elegida == null ? 'Sin responder.' : 'Incorrecto.') + '<br><span style="font-weight:500">' + q.por + '</span></div>' + (q.sol || '') : '') + '</div>';
  }
  function vPreguntas(t) {
    cab(t.titulo, t.n + ' · Preguntas');
    const qs = preparar(II.mezclar(Math.random, t.rapidas.concat(itemsGenerados(t, 3))));
    let i = 0, bien = 0;
    const pintar = (elegida, mostrar) => {
      if (i >= qs.length) {
        app.innerHTML = tabsTema(t, 'pr') + '<div class="tarjeta"><h2>Resultado</h2><p class="rp-nota-g">' + bien + ' de ' + qs.length + '</p><p>' + (bien === qs.length ? '¡Excelente!' : bien >= qs.length * 0.7 ? 'Bien. Repasa las que fallaste.' : 'Vuelve a la teoría y repite.') + '</p>' +
          '<button class="boton prim bloque" id="rp-rep">Otra ronda (otro orden)</button></div>' + pieTema(t, 'pr');
        $('#rp-rep').onclick = () => vPreguntas(t);
        return;
      }
      app.innerHTML = tabsTema(t, 'pr') + preguntaHTML(qs[i], i, qs.length, elegida, mostrar) + (mostrar ? '<button class="boton prim bloque" id="rp-sig">' + (i + 1 < qs.length ? 'Siguiente pregunta' : 'Ver resultado') + '</button>' : '');
      if (mostrar) $('#rp-sig').onclick = () => { i++; pintar(null, false); window.scrollTo(0, 0); };
      else app.querySelectorAll('.opcion-est').forEach((b) => (b.onclick = () => { const k = +b.dataset.k; if (k === 0) bien++; pintar(k, true); }));
    };
    pintar(null, false);
  }

  // ---------- simulacro ----------
  function vSimulacro() {
    cab('Simulacro', 'Simulacro de examen');
    const pool = [];
    TEMAS.forEach((t) => { const p = II.mezclar(Math.random, t.rapidas.concat(itemsGenerados(t, 4))); pool.push(...p.slice(0, 2).map((q) => Object.assign({ tema: t.titulo }, q))); });
    const extra = II.mezclar(Math.random, TEMAS).slice(0, 2).map((t) => Object.assign({ tema: t.titulo }, II.elegir(Math.random, t.rapidas)));
    const qs = preparar(II.mezclar(Math.random, pool.concat(extra).filter((q, i, a) => a.findIndex((x) => x.t === q.t) === i)));
    const resp = Array(qs.length).fill(null);
    let i = 0;
    const chips = () => '<div class="rp-chips">' + qs.map((_, j) => '<button class="' + (j === i ? 'act ' : '') + (resp[j] != null ? 'hecha' : '') + '" data-j="' + j + '">' + (j + 1) + '</button>').join('') + '</div>';
    function pintar() {
      const faltan = resp.filter((x) => x == null).length;
      app.innerHTML = '<div class="rp-migas"><a href="#/">← Temas</a></div><div class="tarjeta rp-intro"><h2>Simulacro de examen</h2><p class="lbl">Responde las ' + qs.length + ' preguntas y toca «Terminar». La nota y las soluciones aparecen al final.</p>' + chips() + '</div>' +
        preguntaHTML(qs[i], i, qs.length, resp[i], false) +
        '<div class="rp-nav"><button class="boton" id="rp-ant"' + (i === 0 ? ' disabled' : '') + '>◀ Anterior</button><button class="boton" id="rp-sg"' + (i === qs.length - 1 ? ' disabled' : '') + '>Siguiente ▶</button></div>' +
        '<button class="boton prim bloque" id="rp-fin">Terminar' + (faltan ? ' (faltan ' + faltan + ')' : '') + '</button>';
      app.querySelectorAll('.opcion-est').forEach((b) => (b.onclick = () => { resp[i] = +b.dataset.k; if (i < qs.length - 1) i++; pintar(); }));
      app.querySelectorAll('.rp-chips [data-j]').forEach((b) => (b.onclick = () => { i = +b.dataset.j; pintar(); }));
      $('#rp-ant').onclick = () => { i--; pintar(); };
      $('#rp-sg').onclick = () => { i++; pintar(); };
      $('#rp-fin').onclick = (e) => {
        const b = e.currentTarget;
        if (faltan && !b.classList.contains('confirmar')) { b.classList.add('confirmar'); b.textContent = 'Te faltan ' + faltan + '. Toca otra vez para terminar'; return; }
        fin();
      };
    }
    function fin() {
      const bien = resp.filter((x) => x === 0).length, nota = Math.round(bien / qs.length * 100);
      const porTema = {};
      qs.forEach((q, j) => { porTema[q.tema] = porTema[q.tema] || [0, 0]; porTema[q.tema][1]++; if (resp[j] === 0) porTema[q.tema][0]++; });
      app.innerHTML = '<div class="rp-migas"><a href="#/">← Temas</a></div><div class="tarjeta"><h2>Resultado del simulacro</h2><p class="rp-nota-g">' + nota + ' / 100</p><p>' + bien + ' de ' + qs.length + ' correctas.</p>' +
        '<table class="rp-tab"><tr><th>Tema</th><th>Aciertos</th></tr>' + TEMAS.filter((t) => porTema[t.titulo]).map((t) => '<tr><td><a href="#/t/' + t.id + '">' + t.titulo + '</a></td><td>' + porTema[t.titulo][0] + ' de ' + porTema[t.titulo][1] + '</td></tr>').join('') + '</table>' +
        '<button class="boton prim bloque" id="rp-otro" style="margin-top:12px">Otro simulacro</button></div><p class="etq">Revisión</p>' +
        qs.map((q, j) => preguntaHTML(q, j, qs.length, resp[j], true)).join('');
      $('#rp-otro').onclick = () => { vSimulacro(); window.scrollTo(0, 0); };
      window.scrollTo(0, 0);
    }
    pintar();
  }

  // =================================================================
  // Rutas
  // =================================================================
  function irA(h) { if (location.hash !== h) location.hash = h; else ruta(); }
  function ruta() {
    soltar();
    const p = (location.hash || '#/').replace(/^#\/?/, '').split('/');
    if (p[0] === 't' && temaDe(p[1])) { const t = temaDe(p[1]); if (p[2] === 'ej') vListaEj(t); else if (p[2] === 'pr') vPreguntas(t); else vTeoria(t); }
    else if (p[0] === 'e' && temaDe(p[1]) && E[p[2]]) vEjercicio(temaDe(p[1]), p[2]);
    else if (p[0] === 'sim') vSimulacro();
    else vInicio();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', ruta);
  ruta();
})();
