// ============================================================
// Electrónica Digital 1 — clase en vivo «XOR, paridad y comparador» (d1-c4, 16/10/2026)
//   Pestañas 10 Repaso XOR · 11 Paridad · 12 Comparador (S.pestana0 = 10)
//   Diagramas D1.W.* (sirven en la TV y en el celular), D1.EXPLORAR (celular)
//   y ejercicios x1–x4 con datos por carnet. Fórmulas en LaTeX con \( … \).
//   Regla del «?» (decisión del 15/10): lo que se deja sin completar cuenta como
//   incorrecto y en «Tu respuesta» se ve como «?» en rojo, siempre con el aviso.
// ============================================================
(function () {
  'use strict';
  const D1 = (window.D1 = window.D1 || {});
  const K = D1.k;
  const X = String.raw;
  const esc = (s) => (window.II ? II.esc(s) : String(s));
  const R = () => { if (D1.refit) D1.refit(); };
  const G = {
    AND: (a, b) => a & b, OR: (a, b) => a | b, NAND: (a, b) => 1 - (a & b),
    NOR: (a, b) => 1 - (a | b), XOR: (a, b) => a ^ b, XNOR: (a, b) => 1 - (a ^ b)
  };
  const REGLA = {
    AND: 'Con B = 1 deja pasar A; con B = 0 la salida queda en 0.',
    OR: 'Con B = 0 deja pasar A; con B = 1 la salida queda en 1.',
    NAND: 'Con B = 1 pasa A invertida; con B = 0 la salida queda en 1.',
    NOR: 'Con B = 0 pasa A invertida; con B = 1 la salida queda en 0.',
    XOR: 'Con B = 0 pasa A tal cual; con B = 1 pasa A invertida: un inversor controlado.',
    XNOR: 'Con B = 0 pasa A invertida; con B = 1 pasa A tal cual.'
  };
  const paridad = (bits) => bits.reduce((a, b) => a ^ b, 0);
  const unos = (bits) => bits.reduce((a, b) => a + b, 0);
  const faltanTxt = (n, cosa) => (n ? '<p class="c4-faltan">Dejaste ' + n + ' ' + cosa + ' sin completar («?»): cuentan como incorrectos. Hay que llenar todo.</p>' : '');
  const medio = (x) => Math.round(x * 2) / 2;
  function contador() {
    let mov = 0;
    const t0 = Date.now(), oyentes = [];
    return {
      tocar() { mov++; oyentes.forEach((fn) => fn()); },
      movimientos: () => mov,
      segundos: () => Math.round((Date.now() - t0) / 1000),
      alCambiar: (fn) => oyentes.push(fn)
    };
  }

  // =================================================================
  // Ondas (diagrama de tiempos)
  //   filas: [{ n, v: [0|1|null…], y?: true, toca?: true, marca?: [bool…] }]
  // =================================================================
  function ondasSVG(filas, o) {
    o = o || {};
    const N = filas[0].v.length, x0 = 34, w = (412 - x0) / N, alto = 46;
    let h = '';
    for (let i = 0; i <= N; i++) h += '<line class="grid" x1="' + (x0 + i * w) + '" y1="4" x2="' + (x0 + i * w) + '" y2="' + (filas.length * alto + 2) + '"/>';
    filas.forEach((f, k) => {
      const top = 6 + k * alto, hi = top + 6, lo = top + 34;
      const cls = f.y ? ' y' : '';
      let d = '', prev = null;
      f.v.forEach((b, i) => {
        const xa = x0 + i * w, xb = xa + w;
        if (f.marca && f.marca[i] === false) h += '<rect class="c4-malslot" x="' + xa + '" y="' + (top - 2) + '" width="' + w + '" height="' + (lo - top + 6) + '"/>';
        if (b == null) {
          h += '<text class="' + (o.vacioRojo ? 'c4-q' : 'c4-qg') + '" x="' + (xa + w / 2) + '" y="' + (top + 26) + '">?</text>';
          prev = null;
          return;
        }
        const y = b ? hi : lo;
        if (b) h += '<rect class="shade' + cls + '" x="' + xa + '" y="' + hi + '" width="' + w + '" height="' + (lo - hi) + '"/>';
        d += (prev == null ? 'M' + xa + ',' + y : (prev !== b ? ' V' + y : '')) + ' H' + xb;
        prev = b;
      });
      if (d) h += '<path class="wf' + cls + '" d="' + d + '"/>';
      h += '<text class="st" x="4" y="' + (top + 26) + '"' + (f.y ? ' style="fill:var(--on)"' : '') + '>' + f.n + '</text>';
      if (f.toca) for (let i = 0; i < N; i++) h += '<rect class="slot" data-r="' + f.n + '" data-i="' + i + '" x="' + (x0 + i * w) + '" y="' + top + '" width="' + w + '" height="' + (alto - 4) + '"/>';
    });
    return '<svg class="c4-ondas" viewBox="0 0 416 ' + (filas.length * alto + 6) + '">' + h + '</svg>';
  }

  const W = (D1.W = {});

  // ---------- compuertas que dejan pasar: A cambia rápido, B controla ----------
  W.tiempos = function (cont, o) {
    o = o || {};
    let g = o.puerta || 'XOR';
    const A = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1], B = [0, 0, 0, 1, 1, 1, 1, 0, 0, 0];
    const caja = document.createElement('div');
    caja.className = 'c4-tiempos';
    cont.appendChild(caja);
    function draw() {
      const Y = A.map((a, i) => G[g](a, B[i]));
      caja.innerHTML = '<div class="c4-sel">' + Object.keys(G).map((k) => '<button class="btn' + (k === g ? ' sel' : '') + '" data-g="' + k + '">' + k + '</button>').join('') + '</div>' +
        ondasSVG([{ n: 'A', v: A, toca: true }, { n: 'B', v: B, toca: true }, { n: 'Y', v: Y, y: true }]) +
        '<p class="card c4-regla"><b>' + g + ':</b> ' + REGLA[g] + '</p>' + (o.tv ? '' : '<p class="lbl">Toca los recuadros de A o B para cambiar las señales.</p>');
      R();
    }
    caja.addEventListener('click', (e) => {
      const b = e.target.closest('[data-g]');
      if (b) { g = b.dataset.g; return draw(); }
      const s = e.target.closest('.slot');
      if (s) { (s.dataset.r === 'A' ? A : B)[+s.dataset.i] ^= 1; draw(); }
    });
    draw();
    return { destruir: () => caja.remove() };
  };

  // ---------- XOR en cadena o en árbol ----------
  W.paridad = function (cont, o) {
    o = o || {};
    let n = 4, bits = [1, 0, 1, 1], modo = 'cadena';
    const caja = document.createElement('div');
    caja.className = 'c4-paridad';
    cont.appendChild(caja);
    function svg() {
      const H = n === 4 ? 40 : 22, y0 = 16, s = 24, yIn = (i) => y0 + i * H;
      let h = '', niveles = 0, salida = null;
      const cable = (pts, v) => (h += '<polyline class="w' + (v ? ' hi' : '') + '" fill="none" points="' + pts.map((p) => p.join(',')).join(' ') + '"/>');
      const puerta = (x, y, v) => {
        h += '<rect class="gb" x="' + x + '" y="' + (y - s / 2) + '" width="' + s + '" height="' + s + '" rx="4"/>' +
          '<text class="st" x="' + (x + s / 2) + '" y="' + (y + 6) + '" text-anchor="middle" style="font-size:17px">⊕</text>';
        return { x: x + s, y, v };
      };
      const entra = (src, x, y) => cable([[src.x, src.y], [x - 9, src.y], [x - 9, y], [x, y]], src.v);
      const ins = bits.map((b, i) => ({ x: 31, y: yIn(i), v: b }));
      if (modo === 'cadena') {
        const Wg = n === 4 ? 78 : 44;
        let prev = ins[0];
        for (let g = 0; g < n - 1; g++) {
          const gx = 62 + g * Wg, gy = yIn(g + 1);
          entra(prev, gx, gy - 6);
          cable([[31, gy], [gx - 15, gy], [gx - 15, gy + 6], [gx, gy + 6]], ins[g + 1].v);
          prev = puerta(gx, gy, prev.v ^ ins[g + 1].v);
        }
        salida = prev; niveles = n - 1;
      } else {
        const Wt = n === 4 ? 110 : 80;
        let nivel = ins, L = 0;
        while (nivel.length > 1) {
          L++;
          const sig = [];
          for (let j = 0; j < nivel.length; j += 2) {
            const a = nivel[j], b = nivel[j + 1], gx = 62 + (L - 1) * Wt, gy = (a.y + b.y) / 2;
            entra(a, gx, gy - 6); entra(b, gx, gy + 6);
            sig.push(puerta(gx, gy, a.v ^ b.v));
          }
          nivel = sig;
        }
        salida = nivel[0]; niveles = L;
      }
      const xl = Math.max(salida.x + 26, 330);
      cable([[salida.x, salida.y], [xl - 12, salida.y]], salida.v);
      h += '<circle class="led' + (salida.v ? ' lit' : '') + '" cx="' + xl + '" cy="' + salida.y + '" r="11"/><text class="st" x="' + xl + '" y="' + (salida.y + 30) + '" text-anchor="middle">Y</text>';
      ins.forEach((p, i) => {
        h += '<g class="tin" data-b="' + i + '"><circle class="hit" cx="20" cy="' + p.y + '" r="' + (H / 2) + '"/><circle class="io' + (p.v ? ' hi' : '') + '" cx="20" cy="' + p.y + '" r="' + (n === 4 ? 11 : 9) + '"/>' +
          '<text class="iot" x="20" y="' + (p.y + 5) + '">' + p.v + '</text></g>';
      });
      const altoV = yIn(n - 1) + 34;
      return { html: '<svg class="c4-par" viewBox="0 0 ' + (xl + 16) + ' ' + altoV + '">' + h + '</svg>', niveles, y: salida.v };
    }
    function draw() {
      const d = svg(), u = unos(bits);
      caja.innerHTML = '<div class="c4-sel"><button class="btn' + (n === 4 ? ' sel' : '') + '" data-n="4">4 bits</button><button class="btn' + (n === 8 ? ' sel' : '') + '" data-n="8">8 bits</button>' +
        '<button class="btn' + (modo === 'cadena' ? ' sel' : '') + '" data-m="cadena">Cadena</button><button class="btn' + (modo === 'arbol' ? ' sel' : '') + '" data-m="arbol">Árbol</button></div>' + d.html +
        '<p class="card">Unos: <b>' + u + '</b> (' + (u % 2 ? 'impar' : 'par') + ') → Y = <b>' + d.y + '</b>. XOR usadas: <b>' + (n - 1) + '</b>; niveles: <b>' + d.niveles + '</b>' +
        (modo === 'arbol' ? ' (en cadena serían ' + (n - 1) + ')' : ' (en árbol serían ' + Math.log2(n) + ')') + '.</p>' + (o.tv ? '' : '<p class="lbl">Toca los bits de la izquierda.</p>');
      R();
    }
    caja.addEventListener('click', (e) => {
      const b = e.target.closest('[data-n]');
      if (b) { n = +b.dataset.n; bits = n === 4 ? [1, 0, 1, 1] : [1, 0, 1, 1, 0, 0, 1, 0]; return draw(); }
      const m = e.target.closest('[data-m]');
      if (m) { modo = m.dataset.m; return draw(); }
      const t = e.target.closest('[data-b]');
      if (t) { bits[+t.dataset.b] ^= 1; draw(); }
    });
    draw();
    return { destruir: () => caja.remove() };
  };

  // ---------- paridad en filas y columnas (bloque 4 × 4) ----------
  function tablaBloque(dat, pr, pc, o) {
    o = o || {};
    const fe = dat.map((f, i) => paridad(f) ^ pr[i]);
    const ce = [0, 1, 2, 3].map((j) => paridad(dat.map((f) => f[j])) ^ pc[j]);
    const marcar = o.marcar !== false;
    let h = '<table class="c4-tabla"><tr><td></td>' + [1, 2, 3, 4].map((j) => '<td class="c4-col">' + j + '</td>').join('') + '<td class="c4-col">P</td>' + (marcar ? '<td></td>' : '') + '</tr>';
    dat.forEach((f, i) => {
      h += '<tr><td class="c4-col">' + (i + 1) + '</td>' + f.map((b, j) => {
        const cls = ['c4-b', b ? 'uno' : '', o.cls ? o.cls(i, j) : ''].join(' ');
        return '<td><button class="' + cls + '" data-i="' + i + '" data-j="' + j + '"' + (o.tocar ? '' : ' tabindex="-1"') + '>' + b + '</button></td>';
      }).join('') + '<td><span class="c4-p">' + pr[i] + '</span></td>' + (marcar ? '<td class="c4-flag ' + (fe[i] ? 'mal' : 'ok') + '">' + (fe[i] ? '✗' : '✓') + '</td>' : '') + '</tr>';
    });
    h += '<tr><td class="c4-col">P</td>' + pc.map((b) => '<td><span class="c4-p">' + b + '</span></td>').join('') + '<td></td>' + (marcar ? '<td></td>' : '') + '</tr>';
    if (marcar) h += '<tr><td></td>' + ce.map((e) => '<td class="c4-flag ' + (e ? 'mal' : 'ok') + '">' + (e ? '✗' : '✓') + '</td>').join('') + '<td></td><td></td></tr>';
    return { html: h + '</table>', fe, ce };
  }
  W.bloque = function (cont, o) {
    o = o || {};
    const caja = document.createElement('div');
    caja.className = 'c4-bloque';
    cont.appendChild(caja);
    let dat, pr, pc, danados;
    function nuevo() {
      dat = [0, 1, 2, 3].map(() => [0, 1, 2, 3].map(() => (Math.random() < 0.5 ? 1 : 0)));
      pr = dat.map((f) => paridad(f));
      pc = [0, 1, 2, 3].map((j) => paridad(dat.map((f) => f[j])));
      danados = new Set();
    }
    function draw() {
      const t = tablaBloque(dat, pr, pc, { tocar: true, cls: (i, j) => (danados.has(i * 4 + j) ? 'danado' : '') });
      const nf = t.fe.filter(Boolean).length, nc = t.ce.filter(Boolean).length;
      let msg;
      if (!nf && !nc) msg = danados.size ? 'Ninguna fila ni columna marca error, aunque cambiaste ' + danados.size + ' bits: los errores se taparon entre sí.' : 'Todas las filas y columnas cumplen la paridad par: no hay error. Toca un bit para dañarlo.';
      else if (nf === 1 && nc === 1) msg = 'Falla la fila ' + (t.fe.indexOf(1) + 1) + ' y la columna ' + (t.ce.indexOf(1) + 1) + ': el bit dañado está en su cruce. Para corregirlo, se invierte.';
      else msg = 'Fallan ' + nf + (nf === 1 ? ' fila' : ' filas') + ' y ' + nc + (nc === 1 ? ' columna' : ' columnas') + ': hay más de un error. Se detecta, pero ya no se sabe con certeza cuáles bits son.';
      caja.innerHTML = '<div class="c4-bl">' + t.html + '<div class="c4-bl-txt"><p class="card">' + msg + '</p>' +
        '<div class="c4-sel"><button class="btn" data-x="nuevo">Nuevo bloque</button><button class="btn" data-x="reparar">Reparar todo</button></div>' +
        (o.tv ? '' : '<p class="lbl">Toca un bit para dañarlo (cambiarlo). Los ✗ marcan dónde no se cumple la paridad.</p>') + '</div></div>';
      R();
    }
    caja.addEventListener('click', (e) => {
      const x = e.target.closest('[data-x]');
      if (x) {
        if (x.dataset.x === 'nuevo') nuevo();
        else { danados.forEach((k) => { dat[k >> 2][k & 3] ^= 1; }); danados.clear(); }
        return draw();
      }
      const b = e.target.closest('[data-i]');
      if (!b) return;
      const i = +b.dataset.i, j = +b.dataset.j, k = i * 4 + j;
      dat[i][j] ^= 1;
      if (danados.has(k)) danados.delete(k); else danados.add(k);
      draw();
    });
    nuevo();
    draw();
    return { destruir: () => caja.remove() };
  };

  // ---------- comparador de 2 bits ----------
  function comparar(a1, a0, b1, b0) {
    const x1 = 1 - (a1 ^ b1), x0 = 1 - (a0 ^ b0);
    const ig = x1 & x0;
    const ma = (a1 & (1 - b1)) | (x1 & a0 & (1 - b0));
    const me = ((1 - a1) & b1) | (x1 & (1 - a0) & b0);
    return { x1, x0, ig, ma, me };
  }
  W.comparador = function (cont, o) {
    o = o || {};
    const v = { a1: 1, a0: 0, b1: 1, b0: 1 };
    const caja = document.createElement('div');
    caja.className = 'c4-comp';
    cont.appendChild(caja);
    const led = (n, x) => '<span class="ld' + (x ? ' on' : '') + '"><i></i>' + n + ' = ' + x + '</span>';
    function draw() {
      const c = comparar(v.a1, v.a0, v.b1, v.b0);
      const A = v.a1 * 2 + v.a0, B = v.b1 * 2 + v.b0;
      const bit = (k) => '<button class="bit sm' + (v[k] ? ' one' : '') + '" data-k="' + k + '">' + v[k] + '</button>';
      let por = '';
      if (o.completo) {
        por = v.a1 !== v.b1 ? 'Los bits altos son distintos (\\(X_1 = 0\\)): decide el bit alto. ' + (v.a1 ? 'A₁ = 1 y B₁ = 0, A es MAYOR.' : 'A₁ = 0 y B₁ = 1, A es MENOR.')
          : 'Los bits altos son iguales (\\(X_1 = 1\\)): decide el bit bajo. ' + (v.a0 === v.b0 ? 'También son iguales: A = B.' : v.a0 ? 'A₀ = 1 y B₀ = 0, A es MAYOR.' : 'A₀ = 0 y B₀ = 1, A es MENOR.');
      }
      caja.innerHTML = '<div class="c4-comp-in"><div class="c4-num"><span class="lbl">A</span>' + bit('a1') + bit('a0') + '<span class="k">= ' + A + '</span></div>' +
        '<div class="c4-num"><span class="lbl">B</span>' + bit('b1') + bit('b0') + '<span class="k">= ' + B + '</span></div></div>' +
        '<div class="c4-leds">' + led('X₁', c.x1) + led('X₀', c.x0) + led('IGUAL', c.ig) + (o.completo ? led('MAYOR', c.ma) + led('MENOR', c.me) : '') + '</div>' +
        (por ? '<p class="card">' + por + '</p>' : '') + (o.tv ? '' : '<p class="lbl">Toca los bits de A y de B.</p>');
      R();
    }
    caja.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) { v[b.dataset.k] ^= 1; draw(); } });
    draw();
    return { destruir: () => caja.remove() };
  };

  // ---------- posición de un motor: encoder contra consigna ----------
  W.motor = function (cont, o) {
    o = o || {};
    let P = 3, C = 11, t = null;
    const caja = document.createElement('div');
    caja.className = 'c4-motor';
    cont.appendChild(caja);
    const b4 = (x) => x.toString(2).padStart(4, '0');
    function draw() {
      const acc = P < C ? { t: 'Avanza ▶', c: 'on-t', s: 'MENOR = 1' } : P > C ? { t: '◀ Retrocede', c: 'warn-t', s: 'MAYOR = 1' } : { t: '■ Para', c: '', s: 'IGUAL = 1' };
      caja.innerHTML = '<div class="c4-mot-fila"><span class="lbl">Posición (encoder)</span><button class="btn" data-d="P-">−</button><span class="c4-bits k">' + b4(P) + '</span><span class="lbl">= ' + P + '</span><button class="btn" data-d="P+">+</button></div>' +
        '<div class="c4-mot-fila"><span class="lbl">Consigna</span><button class="btn" data-d="C-">−</button><span class="c4-bits k">' + b4(C) + '</span><span class="lbl">= ' + C + '</span><button class="btn" data-d="C+">+</button></div>' +
        '<div class="c4-pista"><span class="c4-cons" style="left:' + (4 + C * 6) + '%">▼</span><span class="c4-pos" style="left:' + (4 + P * 6) + '%">⚙</span></div>' +
        '<p class="c4-accion ' + acc.c + '">' + acc.t + ' <span class="lbl">(' + acc.s + ')</span></p>' +
        '<div class="c4-sel"><button class="btn pri" data-x>' + (t ? 'Detener' : 'Mover el motor') + '</button></div>';
      R();
    }
    function paso() { if (P === C) { clearInterval(t); t = null; } else P += P < C ? 1 : -1; draw(); }
    caja.addEventListener('click', (e) => {
      const d = e.target.closest('[data-d]');
      if (d) {
        const k = d.dataset.d;
        if (k[0] === 'P') P = Math.max(0, Math.min(15, P + (k[1] === '+' ? 1 : -1)));
        else C = Math.max(0, Math.min(15, C + (k[1] === '+' ? 1 : -1)));
        return draw();
      }
      if (e.target.closest('[data-x]')) {
        if (t) { clearInterval(t); t = null; draw(); } else { t = setInterval(paso, 600); draw(); }
      }
    });
    draw();
    return { destruir: () => { clearInterval(t); caja.remove(); } };
  };

  // ---------- explorar en el celular ----------
  D1.EXPLORAR = {
    tiempos: (z) => W.tiempos(z, {}),
    paridad: (z) => W.paridad(z, {}),
    bloque: (z) => W.bloque(z, {}),
    comparador: (z) => W.comparador(z, {}),
    comparador2: (z) => W.comparador(z, { completo: true }),
    motor: (z) => W.motor(z, {})
  };

  // =================================================================
  // Ejercicios
  // =================================================================
  const E = (D1.EJERCICIOS = D1.EJERCICIOS || {});
  const b2 = (bits) => bits.join('');
  function botones01(nombre, val, mal) {
    return '<div class="c4-ops">' + [1, 0].map((x) => '<button class="c4-t' + (val === x ? ' sel' : '') + '" data-c="' + nombre + '" data-v="' + x + '">' + x + '</button>').join('') + '</div>';
  }
  const valTxt = (v, ok) => (v == null ? '<span class="c4-q-txt">?</span>' : '<b class="' + (ok ? 'on-t' : 'bad-t') + '">' + v + (ok ? ' ✓' : ' ✗') + '</b>');

  // ---------- x1: tu diagrama de tiempos ----------
  E.x1 = {
    titulo: 'Tu diagrama de tiempos', puntos: 3, medios: true,
    tv: 'Cada uno tiene <b>sus señales A y B</b> y <b>su compuerta</b>. Toquen cada intervalo de Y. Primero escriban la tabla de su compuerta en el cuaderno.',
    generar(r) {
      const lista = ['XOR', 'XNOR', 'XOR', 'XNOR', 'NAND', 'NOR'];
      const g = lista[Math.floor(r() * lista.length)];
      let A, B;
      do {
        A = Array.from({ length: 8 }, () => (r() < 0.5 ? 1 : 0));
        B = Array.from({ length: 8 }, () => (r() < 0.5 ? 1 : 0));
      } while (new Set(A.map((a, i) => a * 2 + B[i])).size < 4);
      return { g, A, B, Y: A.map((a, i) => G[g](a, B[i])) };
    },
    resumen: (d) => 'compuerta ' + d.g + '; A = ' + b2(d.A) + '; B = ' + b2(d.B),
    enunciado: (d) => '<p>Tus señales A y B entran a una compuerta <b>' + d.g + '</b>. Toca cada intervalo de <b>Y</b> para poner 1 o 0.</p><p class="lbl">Cuaderno: escribe primero la tabla de la ' + d.g + '.</p>',
    montar(cont, d) {
      const y = Array(8).fill(null), c = contador();
      const caja = document.createElement('div');
      cont.appendChild(caja);
      const draw = () => { caja.innerHTML = ondasSVG([{ n: 'A', v: d.A }, { n: 'B', v: d.B }, { n: 'Y', v: y, y: true, toca: true }]); };
      caja.addEventListener('click', (e) => {
        const s = e.target.closest('.slot');
        if (!s) return;
        const i = +s.dataset.i;
        y[i] = y[i] === 1 ? 0 : 1;
        draw(); c.tocar();
      });
      draw();
      return {
        estado: () => ({ y: y.slice() }),
        fijar(e) { if (e && e.y) { e.y.forEach((v, i) => { y[i] = v; }); draw(); } },
        movimientos: c.movimientos, segundos: c.segundos, alCambiar: c.alCambiar,
        destruir: () => caja.remove()
      };
    },
    evaluar(est, d) {
      const y = (est && est.y) || [];
      const bien = d.Y.filter((v, i) => y[i] === v).length;
      const faltan = d.Y.filter((_, i) => y[i] == null).length;
      const puntos = medio((3 * bien) / 8);
      return { puntos, ok: bien === 8, valor: bien, texto: 'Y: ' + bien + '/8 intervalos bien' + (faltan ? '; ' + faltan + ' sin completar (cuentan como incorrectos)' : '') };
    },
    solucion: (d) => ({ html: '<div class="solucion"><p><b>' + d.g + ':</b> ' + REGLA[d.g] + '</p>' + ondasSVG([{ n: 'A', v: d.A }, { n: 'B', v: d.B }, { n: 'Y', v: d.Y, y: true }]) + '</div>' }),
    vista(est, d) {
      const y = (est && est.y) || Array(8).fill(null);
      const faltan = y.filter((v) => v == null).length;
      return ondasSVG([{ n: 'A', v: d.A }, { n: 'B', v: d.B }, { n: 'Y', v: y, y: true, marca: y.map((v, i) => v === d.Y[i]) }], { vacioRojo: true }) + faltanTxt(faltan, faltan === 1 ? 'intervalo' : 'intervalos');
    }
  };

  // ---------- x2: tu dato con paridad ----------
  E.x2 = {
    titulo: 'Tu dato con paridad', puntos: 4,
    tv: 'Cada uno tiene <b>su dato de 7 bits</b> con paridad par. Calculen P y digan qué marca el comprobador en 3 palabras recibidas. Cuenten los unos en el cuaderno.',
    generar(r) {
      let dato;
      do { dato = Array.from({ length: 7 }, () => (r() < 0.5 ? 1 : 0)); } while (unos(dato) < 2 || unos(dato) > 5);
      const P = paridad(dato), env = dato.concat([P]);
      const pos = II.mezclar(r, [0, 1, 2, 3, 4, 5, 6, 7]);
      const flip = (ks) => env.map((b, i) => (ks.includes(i) ? 1 - b : b));
      const recib = II.mezclar(r, [env.slice(), flip([pos[0]]), flip([pos[1], pos[2]])]).map((bits) => ({ bits, E: paridad(bits) }));
      return { dato, P, recib };
    },
    resumen: (d) => 'dato ' + b2(d.dato) + '; P = ' + d.P,
    enunciado: (d) => '<p>Tu dato de 7 bits: <span class="c4-bits k">' + b2(d.dato) + '</span>. Se envía con <b>paridad par</b>: el total de unos, contando P, debe ser par.</p>' +
      '<div class="c4-form">\\(P = \\text{XOR de los 7 bits}\\)<br>\\(E = \\text{XOR de los 8 bits recibidos}\\): \\(E = 0\\) llegó bien; \\(E = 1\\) hubo error.</div>',
    montar(cont, d) {
      const st = { p: null, e: [null, null, null] }, c = contador();
      const caja = document.createElement('div');
      cont.appendChild(caja);
      function draw() {
        caja.innerHTML = '<div class="c4-items"><div class="c4-item"><span>1. ¿Cuánto vale P?</span>' + botones01('p', st.p) + '</div>' +
          d.recib.map((w, k) => '<div class="c4-item"><span>' + (k + 2) + '. Llega <span class="c4-bits">' + b2(w.bits.slice(0, 7)) + ' ' + w.bits[7] + '</span>. ¿E?</span>' + botones01('e' + k, st.e[k]) + '</div>').join('') + '</div>';
      }
      caja.addEventListener('click', (e) => {
        const b = e.target.closest('[data-c]');
        if (!b) return;
        const n = b.dataset.c, v = +b.dataset.v;
        if (n === 'p') st.p = v; else st.e[+n.slice(1)] = v;
        draw(); c.tocar();
      });
      draw();
      return {
        estado: () => ({ p: st.p, e: st.e.slice() }),
        fijar(x) { if (!x) return; st.p = x.p; if (x.e) st.e = x.e.slice(); draw(); },
        movimientos: c.movimientos, segundos: c.segundos, alCambiar: c.alCambiar,
        destruir: () => caja.remove()
      };
    },
    evaluar(est, d) {
      const p = est ? est.p : null, e = (est && est.e) || [];
      const okP = p === d.P, okE = d.recib.map((w, k) => e[k] === w.E);
      const faltan = (p == null ? 1 : 0) + d.recib.filter((_, k) => e[k] == null).length;
      const puntos = (okP ? 1 : 0) + okE.filter(Boolean).length;
      return { puntos, ok: puntos === 4, valor: puntos, texto: (okP ? '✓' : '✗') + ' P; ' + okE.filter(Boolean).length + '/3 comprobaciones bien' + (faltan ? '; ' + faltan + ' sin completar (cuentan como incorrectas)' : '') };
    },
    solucion(d) {
      return { html: '<div class="solucion"><p>Dato <span class="c4-bits">' + b2(d.dato) + '</span>: ' + unos(d.dato) + ' unos → <b>P = ' + d.P + '</b> (el total queda par).</p>' +
        d.recib.map((w) => '<p>Llega <span class="c4-bits">' + b2(w.bits.slice(0, 7)) + ' ' + w.bits[7] + '</span>: ' + unos(w.bits) + ' unos → <b>E = ' + w.E + '</b>' + (w.E ? ' (error detectado)' : ' (parece bien)') + '</p>').join('') +
        '<p>Una de las palabras traía <b>dos</b> bits dañados: la cantidad de unos sigue par y el comprobador no la detecta.</p></div>' };
    },
    vista(est, d) {
      const p = est ? est.p : null, e = (est && est.e) || [];
      const faltan = (p == null ? 1 : 0) + d.recib.filter((_, k) => e[k] == null).length;
      return '<div class="solucion"><p>P: ' + valTxt(p, p === d.P) + '</p>' + d.recib.map((w, k) => '<p><span class="c4-bits">' + b2(w.bits.slice(0, 7)) + ' ' + w.bits[7] + '</span> → E: ' + valTxt(e[k], e[k] === w.E) + '</p>').join('') + '</div>' + faltanTxt(faltan, faltan === 1 ? 'respuesta' : 'respuestas');
    }
  };

  // ---------- x3: encuentra el bit dañado ----------
  E.x3 = {
    titulo: 'Encuentra el bit dañado', puntos: 3,
    tv: 'Cada uno tiene <b>su bloque de 4 × 4 bits</b> con paridad par por fila y por columna. Un bit llegó dañado: <b>tóquenlo</b>. Revisen fila por fila y columna por columna en el cuaderno.',
    generar(r) {
      const orig = [0, 1, 2, 3].map(() => [0, 1, 2, 3].map(() => (r() < 0.5 ? 1 : 0)));
      const pr = orig.map((f) => paridad(f)), pc = [0, 1, 2, 3].map((j) => paridad(orig.map((f) => f[j])));
      const fi = Math.floor(r() * 4), fj = Math.floor(r() * 4);
      const dat = orig.map((f, i) => f.map((b, j) => (i === fi && j === fj ? 1 - b : b)));
      return { dat, pr, pc, fi, fj };
    },
    resumen: (d) => 'bit dañado en la fila ' + (d.fi + 1) + ', columna ' + (d.fj + 1),
    enunciado: () => '<p>La columna <b>P</b> es la paridad de cada fila y la fila <b>P</b> la de cada columna (paridad par). Un solo bit de datos llegó dañado. <b>Tócalo.</b></p>',
    montar(cont, d) {
      let sel = null;
      const c = contador(), caja = document.createElement('div');
      cont.appendChild(caja);
      function draw() {
        caja.innerHTML = '<div class="centro">' + tablaBloque(d.dat, d.pr, d.pc, { tocar: true, marcar: false, cls: (i, j) => (sel && sel[0] === i && sel[1] === j ? 'elegido' : '') }).html + '</div>' +
          '<p class="lbl" style="text-align:center">' + (sel ? 'Elegiste la fila ' + (sel[0] + 1) + ', columna ' + (sel[1] + 1) + '.' : 'Todavía no elegiste ningún bit.') + '</p>';
      }
      caja.addEventListener('click', (e) => {
        const b = e.target.closest('[data-i]');
        if (!b) return;
        sel = [+b.dataset.i, +b.dataset.j];
        draw(); c.tocar();
      });
      draw();
      return {
        estado: () => ({ sel }),
        fijar(x) { if (x && x.sel) { sel = x.sel; draw(); } },
        movimientos: c.movimientos, segundos: c.segundos, alCambiar: c.alCambiar,
        destruir: () => caja.remove()
      };
    },
    evaluar(est, d) {
      const s = est && est.sel;
      if (!s) return { puntos: 0, ok: false, valor: 0, texto: 'No elegiste ningún bit (cuenta como incorrecto).' };
      const ok = s[0] === d.fi && s[1] === d.fj, medioOk = s[0] === d.fi || s[1] === d.fj;
      return { puntos: ok ? 3 : medioOk ? 1 : 0, ok, valor: ok ? 3 : medioOk ? 1 : 0, texto: ok ? 'Encontraste el bit dañado.' : medioOk ? 'Acertaste la ' + (s[0] === d.fi ? 'fila' : 'columna') + ', pero no el bit.' : 'Ese bit no era.' };
    },
    solucion(d) {
      return { html: '<div class="solucion"><div class="centro">' + tablaBloque(d.dat, d.pr, d.pc, { cls: (i, j) => (i === d.fi && j === d.fj ? 'danado' : '') }).html + '</div>' +
        '<p>Falla la paridad de la <b>fila ' + (d.fi + 1) + '</b> y de la <b>columna ' + (d.fj + 1) + '</b>: el bit dañado está en su cruce. Se corrige invirtiéndolo.</p></div>' };
    },
    vista(est, d) {
      const s = est && est.sel;
      return '<div class="centro">' + tablaBloque(d.dat, d.pr, d.pc, { marcar: false, cls: (i, j) => (s && s[0] === i && s[1] === j ? 'elegido' : '') + (i === d.fi && j === d.fj ? ' correcto' : '') }).html + '</div>' +
        (s ? '<p class="lbl" style="text-align:center">Elegiste fila ' + (s[0] + 1) + ', columna ' + (s[1] + 1) + '. El borde verde marca el bit dañado.</p>' : '<p class="c4-faltan">No elegiste ningún bit («?»): cuenta como incorrecto.</p>');
    }
  };

  // ---------- x4: tu comparador ----------
  const SAL = [['x1', X`X_1 = \overline{A_1 \oplus B_1}`], ['x0', X`X_0 = \overline{A_0 \oplus B_0}`], ['ig', X`\text{IGUAL}`], ['ma', X`\text{MAYOR}`], ['me', X`\text{MENOR}`]];
  E.x4 = {
    titulo: 'Tu comparador', puntos: 3, medios: true,
    tv: 'Cada uno tiene <b>sus dos números de 2 bits</b>. Llenen las salidas de las XNOR, IGUAL, MAYOR y MENOR. Usen el cuaderno.',
    generar(r) {
      const A = Math.floor(r() * 4);
      let B = Math.floor(r() * 4);
      if (r() < 0.2) B = A;
      const a1 = A >> 1, a0 = A & 1, b1 = B >> 1, b0 = B & 1;
      return { A, B, a1, a0, b1, b0, sal: comparar(a1, a0, b1, b0) };
    },
    resumen: (d) => 'A = ' + d.a1 + d.a0 + '; B = ' + d.b1 + d.b0,
    enunciado: (d) => '<p>Tus números: <b>A</b> = <span class="c4-bits k">' + d.a1 + d.a0 + '</span> y <b>B</b> = <span class="c4-bits k">' + d.b1 + d.b0 + '</span>.</p>' +
      '<div class="c4-form">' + X`\(\text{IGUAL} = X_1 \cdot X_0\)<br>\(\text{MAYOR} = A_1\overline{B_1} + X_1\,A_0\overline{B_0}\)<br>\(\text{MENOR} = \overline{A_1}B_1 + X_1\,\overline{A_0}B_0\)` + '</div>',
    montar(cont, d) {
      const st = { x1: null, x0: null, ig: null, ma: null, me: null }, c = contador();
      const caja = document.createElement('div');
      cont.appendChild(caja);
      function draw() {
        caja.innerHTML = '<div class="c4-items">' + SAL.map(([k, t]) => '<div class="c4-item"><span>\\(' + t + '\\)</span>' + botones01(k, st[k]) + '</div>').join('') + '</div>';
      }
      caja.addEventListener('click', (e) => {
        const b = e.target.closest('[data-c]');
        if (!b) return;
        st[b.dataset.c] = +b.dataset.v;
        draw(); c.tocar();
      });
      draw();
      return {
        estado: () => Object.assign({}, st),
        fijar(x) { if (x) { Object.keys(st).forEach((k) => { if (x[k] != null) st[k] = x[k]; }); draw(); } },
        movimientos: c.movimientos, segundos: c.segundos, alCambiar: c.alCambiar,
        destruir: () => caja.remove()
      };
    },
    evaluar(est, d) {
      est = est || {};
      const bien = SAL.filter(([k]) => est[k] === d.sal[k]).length;
      const faltan = SAL.filter(([k]) => est[k] == null).length;
      return { puntos: medio((3 * bien) / 5), ok: bien === 5, valor: bien, texto: bien + '/5 salidas bien' + (faltan ? '; ' + faltan + ' sin completar (cuentan como incorrectas)' : '') };
    },
    solucion(d) {
      const s = d.sal;
      const por = d.a1 !== d.b1 ? 'Los bits altos son distintos: decide el bit alto.' : d.a0 !== d.b0 ? 'Los bits altos son iguales: decide el bit bajo.' : 'Los dos bits coinciden: son iguales.';
      return { html: '<div class="solucion"><p>A = ' + d.a1 + d.a0 + ' (' + d.A + ') y B = ' + d.b1 + d.b0 + ' (' + d.B + '). ' + por + '</p>' +
        SAL.map(([k, t]) => '<p>\\(' + t + '\\) = <b>' + s[k] + '</b></p>').join('') + '</div>' };
    },
    vista(est, d) {
      est = est || {};
      const faltan = SAL.filter(([k]) => est[k] == null).length;
      return '<div class="solucion">' + SAL.map(([k, t]) => '<p>\\(' + t + '\\): ' + valTxt(est[k], est[k] === d.sal[k]) + '</p>').join('') + '</div>' + faltanTxt(faltan, faltan === 1 ? 'salida' : 'salidas');
    }
  };

  // =================================================================
  // La sesión
  // =================================================================
  D1.SESIONES = D1.SESIONES || {};
  D1.SESIONES['d1-c4'] = {
    id: 'd1-c4',
    materia: 'Electrónica Digital 1',
    titulo: 'XOR, paridad y comparador',
    pestana0: 10,
    grupos: ['Repaso XOR', 'Paridad', 'Comparador'],
    pasos: [
      { id: 'inicio', tipo: 'inicio', g: 0, titulo: 'XOR, paridad y comparador', idea: 'Escanea el QR y entra con tu nombre y carnet. Ten tu cuaderno a mano.' },
      // ----- pestaña 10: repaso de XOR -----
      { id: 'r1', tipo: 'rapida', g: 0, titulo: 'La luz de la escalera', t: 'Un interruptor abajo y otro arriba: mover cualquiera cambia la luz. ¿Qué compuerta sirve?', o: ['XOR', 'OR', 'AND', 'NAND'], c: 0,
        por: 'XOR: cada vez que cambia un interruptor, cambia la luz. La XNOR también sirve; solo cambia si la luz empieza prendida o apagada. La OR falla: con un interruptor en 1, el otro ya no manda.' },
      { id: 'xres', tipo: 'explica', g: 0, titulo: 'Repaso: XOR y XNOR', idea: 'XOR da 1 si las entradas son distintas; XNOR, si son iguales.',
        formulas: X`\(A \oplus B = \overline{A}B + A\overline{B}\)<br>\(\overline{A \oplus B} = \overline{A}\,\overline{B} + AB\)` },
      { id: 'r2', tipo: 'rapida', g: 0, titulo: 'OR contra XOR', t: '¿En qué fila dan distinto la OR y la XOR?', o: ['A = 1, B = 1', 'A = 0, B = 0', 'A = 0, B = 1', 'A = 1, B = 0'], c: 0, una: true,
        por: X`Solo cuando las dos entradas valen 1: la OR da 1 y la XOR da 0. En las otras tres filas son iguales.` },
      { id: 'r3', tipo: 'rapida', g: 0, titulo: 'Inversor controlado', t: 'Una XOR con una entrada fija en 1 se comporta como…', o: ['un NOT', 'una AND', 'un cable', 'un 1 fijo'], c: 0,
        por: X`\(A \oplus 1 = \overline{A}\) y \(A \oplus 0 = A\): con la otra entrada decides si la señal pasa tal cual o invertida.` },
      { id: 'xtiempo', tipo: 'explica', g: 0, titulo: 'Compuertas que dejan pasar una señal', idea: 'AND y OR dejan pasar o bloquean; la XOR invierte a voluntad.', explorar: 'tiempos',
        formulas: X`\(A \cdot 1 = A\); \(A \cdot 0 = 0\)<br>\(A + 0 = A\); \(A + 1 = 1\)<br>\(A \oplus 0 = A\); \(A \oplus 1 = \overline{A}\)` },
      { id: 'x1', tipo: 'ejercicio', g: 0, ejercicio: 'x1' },
      { id: 'xchip', tipo: 'explica', g: 0, titulo: 'Del símbolo al chip: el 7486', idea: 'Cuatro XOR, con los mismos pines que el 7400, 7408 y 7432.' },
      { id: 'r4', tipo: 'rapida', g: 0, titulo: 'Solo con NAND', t: '¿Cuántas NAND de 2 entradas hacen falta para armar una XOR?', o: ['4', '2', '3', '5'], c: 0,
        por: 'Cuatro: un 7400 completo. La primera NAND recibe A y B; las dos del medio combinan esa salida con A y con B; la última junta las dos.' },
      // ----- pestaña 11: paridad -----
      { id: 'pruido', tipo: 'explica', g: 1, titulo: 'Un bit cambia en el cable', idea: '¿Cómo se entera el receptor de que el dato llegó mal?' },
      { id: 'r5', tipo: 'rapida', g: 1, titulo: 'Predicción', t: 'En un mapa de 4 variables pongo 1 donde la cantidad de unos de ABCD es impar. ¿Cuántos grupos tiene la expresión mínima?', o: ['8', '4', '2', '1'], c: 0,
        por: 'Ocho grupos de una sola celda: el mapa queda como un tablero de ajedrez y no se puede agrupar nada.' },
      { id: 'pajedrez', tipo: 'explica', g: 1, titulo: 'El mapa que no se agrupa', idea: 'Dos celdas vecinas difieren en un bit: siempre tienen paridad distinta.', explorar: 'mapa',
        formulas: X`\(Y = A \oplus B \oplus C \oplus D\)` },
      { id: 'r6', tipo: 'rapida', g: 1, titulo: 'Para pensar', t: '¿Por qué en el mapa de paridad no hay ni un grupo de 2?', o: ['Dos celdas vecinas siempre tienen paridad distinta', 'Hay demasiados unos', 'Karnaugh no admite 4 variables', 'Los unos están en las esquinas'], c: 0, una: true,
        por: 'Pasar a una celda vecina cambia un solo bit, y cambiar un bit cambia la paridad. Entonces dos vecinas nunca valen lo mismo.' },
      { id: 'pcadena', tipo: 'explica', g: 1, titulo: 'XOR en cadena o en árbol', idea: 'La XOR de muchos bits vale 1 si la cantidad de unos es impar.', explorar: 'paridad',
        formulas: X`\(n\) bits: \(n - 1\) XOR<br>Cadena: \(n - 1\) niveles; árbol: \(\log_2 n\) niveles` },
      { id: 'r7', tipo: 'rapida', g: 1, titulo: 'Cadena o árbol', t: 'Paridad de 8 bits armada en árbol: ¿cuántas XOR de 2 entradas y cuántos niveles?', o: ['7 XOR y 3 niveles', '8 XOR y 3 niveles', '7 XOR y 7 niveles', '4 XOR y 2 niveles'], c: 0, una: true,
        por: X`Siempre hacen falta \(n - 1 = 7\) XOR. En árbol se juntan de a pares: 4, luego 2, luego 1, que son 3 niveles. En cadena serían 7 niveles: la señal tarda más.` },
      { id: 'pbit', tipo: 'explica', g: 1, titulo: 'Bit de paridad: generar y comprobar', idea: 'Con paridad par, P se elige para que el total de unos sea par.',
        formulas: X`\(P = A \oplus B \oplus C \oplus D\)<br>\(E = A \oplus B \oplus C \oplus D \oplus P\)<br>\(E = 0\): llegó bien; \(E = 1\): hubo error` },
      { id: 'x2', tipo: 'ejercicio', g: 1, ejercicio: 'x2' },
      { id: 'r8', tipo: 'rapida', g: 1, titulo: 'Peer Instruction', t: 'Se envió 1011 1 y llegó 1000 1: fallaron dos bits. ¿El comprobador lo detecta?', o: ['No: E = 0', 'Sí: E = 1', 'Sí, y dice qué bits fallaron', 'Depende del primer bit'], c: 0, una: true,
        por: 'Llegaron dos unos: el total sigue par y E = 0. La paridad detecta una cantidad impar de errores; dos errores se tapan entre sí.' },
      { id: 'r9', tipo: 'rapida', g: 1, titulo: 'Tres errores', t: 'Fallaron 3 bits de la misma palabra. ¿El comprobador de paridad lo detecta?', o: ['Sí: la cantidad de unos cambia de par a impar', 'No: tres errores nunca se detectan', 'Solo si falló el bit P', 'Solo si los tres eran unos'], c: 0, una: true,
        por: 'Cada bit que falla cambia la paridad. Con 3 cambios la paridad queda invertida y E = 1. Detecta 1, 3, 5… errores; no detecta 2, 4…' },
      { id: 'p2d', tipo: 'explica', g: 1, titulo: 'Paridad en filas y columnas', idea: 'Un bit dañado marca su fila y su columna: se encuentra y se corrige.', explorar: 'bloque' },
      { id: 'x3', tipo: 'ejercicio', g: 1, ejercicio: 'x3' },
      { id: 'puart', tipo: 'explica', g: 1, titulo: 'Aplicación: la trama UART', idea: 'Inicio, 8 datos, paridad y parada: así hablan muchos módulos con un microcontrolador.' },
      { id: 'r10', tipo: 'rapida', g: 1, titulo: 'Trama UART', t: 'Trama con paridad par: datos 0110 1010 y bit de paridad 1. ¿Llegó bien?', o: ['No: hay un error', 'Sí, llegó bien', 'No se puede saber', 'Solo si el bit de parada es 0'], c: 0, una: true,
        por: 'Los datos tienen 4 unos y P = 1: en total 5, impar. Con paridad par eso es un error.' },
      // ----- pestaña 12: comparador -----
      { id: 'cigual', tipo: 'explica', g: 2, titulo: 'Igualdad con XNOR', idea: 'Dos números son iguales si cada par de bits es igual.', explorar: 'comparador',
        formulas: X`\(X_1 = \overline{A_1 \oplus B_1}\); \(X_0 = \overline{A_0 \oplus B_0}\)<br>\(\text{IGUAL} = X_1 \cdot X_0 = \overline{(A_1 \oplus B_1) + (A_0 \oplus B_0)}\)` },
      { id: 'r11', tipo: 'rapida', g: 2, titulo: 'Con chips', t: '¿Qué hace falta para la salida IGUAL de dos números de 2 bits?', o: ['2 XOR y 1 NOR (7486 y 7402)', '2 AND y 1 OR (7408 y 7432)', '1 XOR (7486)', '2 OR y 1 AND (7432 y 7408)'], c: 0, una: true,
        por: X`Por De Morgan, \(\overline{X_a} \cdot \overline{X_b} = \overline{X_a + X_b}\): dos XOR del 7486 y una NOR del 7402.` },
      { id: 'cmayor', tipo: 'explica', g: 2, titulo: 'MAYOR y MENOR', idea: 'Decide el bit más significativo; si empatan, decide el siguiente.', explorar: 'comparador2',
        formulas: X`\(\text{MAYOR} = A_1\overline{B_1} + X_1\,A_0\overline{B_0}\)<br>\(\text{MENOR} = \overline{A_1}B_1 + X_1\,\overline{A_0}B_0\)` },
      { id: 'r12', tipo: 'rapida', g: 2, titulo: '¿Quién decide?', t: 'A = 10 y B = 01. ¿Qué bit decide cuál es mayor?', o: ['El bit alto (A₁ y B₁)', 'El bit bajo (A₀ y B₀)', 'Los dos por igual', 'Ninguno: son iguales'], c: 0, una: true,
        por: 'A₁ = 1 y B₁ = 0: A ya es mayor, sin mirar el bit bajo. El bit bajo solo decide cuando los bits altos son iguales.' },
      { id: 'c85', tipo: 'explica', g: 2, titulo: 'El 74LS85: compara 4 bits', idea: 'Dos chips en cascada comparan 8 bits.' },
      { id: 'cmotor', tipo: 'explica', g: 2, titulo: 'Aplicación: llevar un motor a su posición', idea: 'El encoder da la posición en binario y se compara con la consigna.', explorar: 'motor' },
      { id: 'r13', tipo: 'rapida', g: 2, titulo: 'El motor', t: 'Posición del encoder 1010 y consigna 1100. ¿Qué hace el motor?', o: ['Avanza', 'Retrocede', 'Para', 'Depende del bit bajo'], c: 0,
        por: 'La posición vale 10 y la consigna 12: la posición es MENOR, así que el motor avanza hasta que IGUAL = 1.' },
      { id: 'x4', tipo: 'ejercicio', g: 2, ejercicio: 'x4' },
      { id: 'cierre', tipo: 'cierre', g: 2, titulo: 'Cierre', idea: 'La XOR detecta diferencias: con ella se invierte a voluntad, se calcula la paridad y se arman comparadores.' }
    ]
  };

  // =================================================================
  // Proyección: monta los diagramas de las diapositivas de esta sesión
  // =================================================================

  // ---------- dibujos fijos de la proyección ----------
  function pinesSVG() {
    const STD = { 1: '1A', 2: '1B', 3: '1Y', 4: '2A', 5: '2B', 6: '2Y', 7: 'GND', 8: '3Y', 9: '3A', 10: '3B', 11: '4Y', 12: '4A', 13: '4B', 14: 'VCC' };
    const COL = ['#495057', '#1c7ed6', '#e8590c', '#7048e8', '#0c8599'];
    const px = (p) => (p <= 7 ? 68 + (p - 1) * 44 : 68 + (14 - p) * 44);
    let h = '<rect x="40" y="44" width="320" height="72" rx="6" fill="#495057"/><path d="M40,70 A10,10 0 0 1 40,90 Z" fill="var(--bg)"/>' +
      '<text x="200" y="86" text-anchor="middle" style="font-size:17px;font-weight:700;fill:#fff;letter-spacing:1px">74LS86</text>';
    for (let p = 1; p <= 14; p++) {
      const n = STD[p], x = px(p), bot = p <= 7, py = bot ? 116 : 22;
      const g = /^\d/.test(n) ? +n[0] : 0, lc = COL[g];
      const fill = n === 'VCC' ? '#ffe3e3' : n === 'GND' ? '#dee2e6' : '#fff';
      h += '<rect x="' + (x - 14) + '" y="' + py + '" width="28" height="22" rx="3" fill="' + fill + '" stroke="' + lc + '" stroke-width="2.5"/>' +
        '<text x="' + x + '" y="' + (bot ? 109 : 61) + '" text-anchor="middle" style="font-size:13px;font-weight:700;fill:#dee2e6">' + p + '</text>' +
        '<text x="' + x + '" y="' + (bot ? 157 : 15) + '" text-anchor="middle" style="font-size:14px;font-weight:800;fill:' + lc + '">' + n + '</text>';
    }
    return h;
  }
  function uartSVG() {
    const bits = [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1];
    const et = ['reposo', 'inicio', 'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'P', 'parada', 'reposo'];
    const x0 = 6, w = (434 - x0) / bits.length, hi = 34, lo = 84;
    let h = '', d = '';
    bits.forEach((b, i) => {
      const xa = x0 + i * w, fondo = i >= 2 && i <= 9 ? 'var(--pri2)' : i === 10 ? 'var(--q2)' : i === 1 || i === 11 ? 'var(--on2)' : 'transparent';
      h += '<rect x="' + xa + '" y="26" width="' + w + '" height="66" fill="' + fondo + '"/>' +
        '<text x="' + (xa + w / 2) + '" y="18" text-anchor="middle" style="font-size:15px;font-weight:800;fill:var(--ink)">' + b + '</text>' +
        '<text x="' + (xa + w / 2) + '" y="' + (i % 2 ? 128 : 112) + '" text-anchor="middle" style="font-size:11px;font-weight:700;fill:var(--muted)">' + et[i] + '</text>';
      const y = b ? hi : lo;
      d += (i === 0 ? 'M' + xa + ',' + y : (bits[i - 1] !== b ? ' V' + y : '')) + ' H' + (xa + w);
    });
    return h + '<path class="wf" d="' + d + '"/><text x="220" y="146" text-anchor="middle" style="font-size:12px;fill:var(--muted)">Letra A = 0100 0001, enviada desde D0 (bit menos significativo)</text>';
  }
  function c85SVG() {
    const NOM = ['A&gt;B', 'A=B', 'A&lt;B'], Y = [78, 102, 126];
    const chip = (x, t, sub) => '<rect x="' + x + '" y="50" width="120" height="100" rx="8" fill="#fff" stroke="var(--ink)" stroke-width="2.5"/>' +
      '<text x="' + (x + 60) + '" y="96" text-anchor="middle" style="font-size:16px;font-weight:800;fill:var(--ink)">' + t + '</text>' +
      '<text x="' + (x + 60) + '" y="114" text-anchor="middle" style="font-size:12px;fill:var(--muted)">' + sub + '</text>';
    let h = chip(30, '74LS85', 'bits 3 a 0') + chip(280, '74LS85', 'bits 7 a 4');
    // entradas de cascada del chip bajo: fijas 0; 1; 0
    [60, 90, 120].forEach((x, k) => {
      h += '<line x1="' + x + '" y1="30" x2="' + x + '" y2="50" stroke="var(--muted)" stroke-width="2.5"/>' +
        '<text x="' + x + '" y="24" text-anchor="middle" style="font-size:13px;font-weight:800;fill:var(--muted)">' + (k === 1 ? 1 : 0) + '</text>' +
        '<text x="' + x + '" y="64" text-anchor="middle" style="font-size:9px;font-weight:700;fill:var(--muted)">' + NOM[k] + '</text>';
    });
    // salidas del chip bajo → entradas de cascada del chip alto
    Y.forEach((y, k) => {
      h += '<line x1="150" y1="' + y + '" x2="280" y2="' + y + '" stroke="var(--q)" stroke-width="3"/>' +
        '<text x="215" y="' + (y - 5) + '" text-anchor="middle" style="font-size:12px;font-weight:800;fill:var(--q)">' + NOM[k] + '</text>' +
        '<line x1="400" y1="' + y + '" x2="436" y2="' + y + '" stroke="var(--on)" stroke-width="3"/>' +
        '<text x="436" y="' + (y - 5) + '" text-anchor="end" style="font-size:12px;font-weight:800;fill:var(--on)">' + NOM[k] + '</text>';
    });
    return h + '<text x="90" y="170" text-anchor="middle" style="font-size:12px;fill:var(--muted)">Entran A₃…A₀ y B₃…B₀</text>' +
      '<text x="340" y="170" text-anchor="middle" style="font-size:12px;fill:var(--muted)">Entran A₇…A₄ y B₇…B₄</text>' +
      '<text x="340" y="186" text-anchor="middle" style="font-size:12px;font-weight:700;fill:var(--on)">Resultado de los 8 bits</text>';
  }
  function montarTV() {
    if (!document.body.classList.contains('tv')) return;
    const $ = (s) => document.querySelector(s);
    const z = (id, fn) => { const el = $(id); if (el) fn(el); };
    z('#c4-tiempos', (el) => W.tiempos(el, { tv: true }));
    z('#c4-paridad', (el) => W.paridad(el, { tv: true }));
    z('#c4-bloque', (el) => W.bloque(el, { tv: true }));
    z('#c4-comp1', (el) => W.comparador(el, { tv: true }));
    z('#c4-comp2', (el) => W.comparador(el, { tv: true, completo: true }));
    z('#c4-motor', (el) => W.motor(el, { tv: true }));
    z('#c4-pin', (el) => { el.innerHTML = pinesSVG(); });
    z('#c4-uart', (el) => { el.innerHTML = uartSVG(); });
    z('#c4-85', (el) => { el.innerHTML = c85SVG(); });
    z('#c4-ajedrez', (svg) => {
      const v = Array.from({ length: 16 }, (_, m) => paridad([m >> 3 & 1, m >> 2 & 1, m >> 1 & 1, m & 1]));
      const sol = K.resolver(4, v);
      let ver = false;
      const bt = $('#c4-ajedrez-bt'), ex = $('#c4-ajedrez-ex');
      const draw = () => {
        K.dibujar(svg, 4, v, { grupos: ver ? sol.cubos : [] });
        bt.textContent = ver ? 'Ocultar grupos' : 'Mostrar grupos';
        ex.textContent = ver ? sol.cubos.length + ' grupos de una celda; ' + sol.lits + ' literales' : 'Primero piensen cuántos grupos salen.';
        R();
      };
      bt.onclick = () => { ver = !ver; draw(); };
      draw();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montarTV);
  else montarTV();
})();
