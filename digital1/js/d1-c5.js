// ============================================================
// Electrónica Digital 1 — «Práctica general» (d1-c5, 05/11/2026)
//   Solo ejercicios para practicar todo lo avanzado (pedido del docente).
//   Pestañas 13 Números y compuertas; 14 Karnaugh; 15 Diseño; 16 XOR y paridad.
//   p1 «Tus conversiones» es nuevo. p2…p11 reusan los ejercicios de d1-c3 y d1-c4
//   con claves nuevas: cada carnet recibe datos distintos a los de esas clases.
//   Regla del «?» también en las tablas (p2 y p7) y separador «; » en los textos.
//   Las diapositivas «Recuerda» de la TV se arman aquí (no están en proyectar.html).
// ============================================================
(function () {
  'use strict';
  const D1 = (window.D1 = window.D1 || {});
  const K = D1.k, E = D1.EJERCICIOS;
  const X = String.raw;
  const N3 = ['A', 'B', 'C'];
  const SEP = (s) => (typeof s === 'string' ? s.replace(/ · /g, '; ') : s);
  const faltanTxt = (n, cosa) => (n ? '<p class="c4-faltan">Dejaste ' + n + ' ' + cosa + ' sin completar («?»): cuentan como incorrectos. Hay que llenar todo.</p>' : '');
  const marca = (ok) => (ok ? '✓' : '✗');
  const Q = '<span class="c4-q-txt">?</span>';

  // =================================================================
  // Copias de ejercicios anteriores (misma lógica, datos nuevos por carnet)
  // =================================================================
  function copia(base, cambios) {
    const b = E[base];
    const w = Object.assign({}, b, cambios || {});
    const ev = w.evaluar, so = w.solucion, vi = w.vista;
    w.evaluar = (est, d) => { const r = ev(est, d); return Object.assign({}, r, { texto: SEP(r.texto) }); };
    w.solucion = (d) => ({ html: SEP(so(d).html) });
    w.vista = (est, d) => SEP(vi(est, d));
    w.tv = SEP(w.tv);
    return w;
  }
  // tabla de verdad de la respuesta: «?» en rojo y filas equivocadas marcadas
  function tablaQ(nv, nombres, salida, t, f) {
    let h = '<table class="tt tight"><tr>' + nombres.map((x) => '<th>' + x + '</th>').join('') + '<th>' + salida + '</th></tr>';
    for (let m = 0; m < 1 << nv; m++) {
      const v = t[m];
      const cls = v == null ? 'c5-q' : v !== f[m] ? 'c5-mal' : v === 1 ? 'v1' : '';
      h += '<tr>' + nombres.map((_, i) => '<td>' + ((m >> (nv - 1 - i)) & 1) + '</td>').join('') + '<td class="' + cls + '">' + (v == null ? '?' : v) + '</td></tr>';
    }
    return h + '</table>';
  }
  const sinTabla = (est, n) => { const t = (est && est.tabla) || []; let k = 0; for (let m = 0; m < n; m++) if (t[m] == null) k++; return k; };
  const cambiarTabla = (html, tabla) => html.replace(/<table class="tt tight">[\s\S]*?<\/table>/, tabla);

  // ---------- p2: del circuito a la función (copia de e6) ----------
  E.p2 = copia('e6', {
    medios: true,
    evaluar(est, d) {
      const r = E.e6.evaluar(est, d), f = sinTabla(est, 8), sinOp = !est || est.opcion == null;
      const n = f + (sinOp ? 1 : 0);
      return Object.assign({}, r, { texto: r.texto + (n ? ' · ' + n + ' sin completar (cuentan como incorrectas)' : '') });
    },
    vista(est, d) {
      const t = ((est && est.tabla) || []).slice();
      const f = sinTabla(est, 8), sinOp = !est || est.opcion == null;
      return cambiarTabla(E.e6.vista(est, d), tablaQ(3, N3, 'F', t, d.f)).replace('Eligió: —', 'Eligió: ' + Q) +
        faltanTxt(f + (sinOp ? 1 : 0), f + (sinOp ? 1 : 0) === 1 ? 'respuesta' : 'respuestas');
    }
  });
  // ---------- p3 a p6: mapas ----------
  E.p3 = copia('e1');
  E.p4 = copia('e7', { medios: true });
  E.p5 = copia('e8');
  E.p6 = copia('e4');
  // ---------- p7: diseño completo (copia de e2) ----------
  E.p7 = copia('e2', {
    medios: true,
    evaluar(est, d) {
      const r = E.e2.evaluar(est, d), f = sinTabla(est, 8);
      return Object.assign({}, r, { texto: r.texto + (f ? ' · ' + f + (f === 1 ? ' fila' : ' filas') + ' sin completar (cuentan como incorrectas)' : '') });
    },
    vista(est, d) {
      const t = ((est && est.tabla) || []).slice(), f = sinTabla(est, 8);
      return cambiarTabla(E.e2.vista(est, d), tablaQ(3, d.nombres, 'Y', t, d.f)) + faltanTxt(f, f === 1 ? 'fila' : 'filas');
    }
  });
  // ---------- p8: solo con NAND; p9 a p11: XOR y paridad ----------
  E.p8 = copia('e9', { vista: (est, d) => E.e9.vista(est, d).replace('Dijo: —', 'Dijo: ' + Q) + (est && est.cuenta != null ? '' : faltanTxt(1, 'respuesta')) });
  E.p9 = copia('x1');
  E.p10 = copia('x2');
  E.p11 = copia('x3');

  // =================================================================
  // p1 · Tus conversiones (nuevo): decimal → binario, binario → decimal,
  //      decimal → BCD y leer un código BCD. 1 punto cada parte.
  // =================================================================
  const bitsDe = (n, k) => Array.from({ length: k }, (_, i) => (n >> (k - 1 - i)) & 1);
  const valDe = (bits) => bits.reduce((a, b) => 2 * a + b, 0);
  const unos = (bits) => bits.reduce((a, b) => a + b, 0);
  const g4 = (bits) => bits.slice(0, 4).join('') + ' ' + bits.slice(4).join('');
  const bcdDe = (n) => bitsDe(Math.floor(n / 10), 4).concat(bitsDe(n % 10, 4));
  const PESOS = [128, 64, 32, 16, 8, 4, 2, 1];
  const sumaPesos = (bits) => PESOS.filter((_, i) => bits[i]).join(' + ');
  const LET = 'ABCD';

  E.p1 = {
    titulo: 'Tus conversiones', puntos: 4,
    tv: 'Cada uno tiene <b>sus propios números</b>: decimal a binario, binario a decimal, decimal a BCD y leer un código BCD. Usen el cuaderno.',
    generar(r) {
      const ent = (a, b) => a + Math.floor(r() * (b - a + 1));
      let n1, nb;
      do { n1 = ent(37, 250); } while (unos(bitsDe(n1, 8)) < 3);
      do { nb = ent(41, 239); } while (nb === n1 || unos(bitsDe(nb, 8)) < 3);
      let n3;
      do { n3 = ent(13, 98); } while (n3 % 11 === 0 || n3 === n1 % 100);
      const malo = r() < 0.35;
      const h = ent(1, 9);
      let l;
      do { l = malo ? ent(10, 15) : ent(0, 9); } while (l === h || 16 * h + l === 10 * l + h);
      const code = bitsDe(h, 4).concat(bitsDe(l, 4));
      const ops = malo ? ['No es un BCD válido', String(16 * h + l), String(h) + String(l), String(10 * h + l - 10)]
        : [String(10 * h + l), String(16 * h + l), String(10 * l + h), 'No es un BCD válido'];
      return { n1, nb, n3, h, l, malo, code, ops, per: II.mezclar(r, [0, 1, 2, 3]) };
    },
    resumen: (d) => d.n1 + ' → binario; ' + g4(bitsDe(d.nb, 8)) + ' → decimal; ' + d.n3 + ' → BCD; leer ' + g4(d.code),
    enunciado: (d) => '<p>Cuatro conversiones con <b>tus</b> números. Toca cada bit para ponerlo en 1 o en 0 (empieza en «?»).</p>',
    montar(cont, d) {
      const st = { a: Array(8).fill(null), b: '', c: Array(8).fill(null), op: null };
      let mov = 0;
      const t0 = Date.now(), oyentes = [];
      const avisar = () => { mov++; oyentes.forEach((fn) => fn()); };
      const fila = (n, pesos, sep) => '<div class="c5-bits" data-f="' + n + '">' + pesos.map((p, i) =>
        (sep && i === 4 ? '<span class="c5-sep"></span>' : '') + '<div class="c5-bit"><small>' + p + '</small><button class="c4-b" data-f="' + n + '" data-i="' + i + '">?</button></div>').join('') + '</div>';
      const caja = document.createElement('div');
      caja.className = 'c5-items';
      caja.innerHTML =
        '<div class="c5-item"><p><b>a)</b> Pasa <b class="c5-num">' + d.n1 + '</b> a binario (8 bits).</p>' + fila('a', PESOS, true) + '</div>' +
        '<div class="c5-item"><p><b>b)</b> ¿Cuánto vale <span class="c4-bits">' + g4(bitsDe(d.nb, 8)) + '</span> en decimal?</p>' +
        '<input class="c5-in" type="text" inputmode="numeric" autocomplete="off" placeholder="Escribe el número"></div>' +
        '<div class="c5-item"><p><b>c)</b> Escribe <b class="c5-num">' + d.n3 + '</b> en BCD (decenas y unidades).</p>' + fila('c', [8, 4, 2, 1, 8, 4, 2, 1], true) + '</div>' +
        '<div class="c5-item"><p><b>d)</b> Llega el código BCD <span class="c4-bits">' + g4(d.code) + '</span>. ¿Qué número es?</p><div class="opciones-est">' +
        d.per.map((k, j) => '<button class="opcion-est" data-k="' + k + '"><span class="letra">' + LET[j] + '</span><span>' + d.ops[k] + '</span></button>').join('') + '</div></div>';
      cont.appendChild(caja);
      const inp = caja.querySelector('.c5-in');
      function pintar() {
        caja.querySelectorAll('.c4-b[data-f]').forEach((b) => {
          const v = st[b.dataset.f][+b.dataset.i];
          b.textContent = v == null ? '?' : v;
          b.classList.toggle('uno', v === 1);
          b.classList.toggle('c5-vacio', v == null);
        });
        caja.querySelectorAll('.opcion-est').forEach((b) => b.classList.toggle('elegida', +b.dataset.k === st.op));
        if (inp.value !== st.b) inp.value = st.b;
      }
      caja.addEventListener('click', (e) => {
        const b = e.target.closest('.c4-b[data-f]');
        if (b) { const arr = st[b.dataset.f], i = +b.dataset.i; arr[i] = arr[i] === 1 ? 0 : 1; pintar(); avisar(); return; }
        const o = e.target.closest('.opcion-est');
        if (o) { st.op = +o.dataset.k; pintar(); avisar(); }
      });
      inp.addEventListener('input', () => { st.b = inp.value; avisar(); });
      pintar();
      return {
        estado: () => ({ a: st.a.slice(), b: st.b, c: st.c.slice(), op: st.op }),
        fijar(x) {
          if (!x) return;
          if (x.a) st.a = x.a.slice(); if (x.c) st.c = x.c.slice();
          if (x.b != null) st.b = String(x.b); if (x.op != null) st.op = x.op;
          pintar();
        },
        movimientos: () => mov, segundos: () => Math.round((Date.now() - t0) / 1000),
        alCambiar: (fn) => oyentes.push(fn), destruir: () => caja.remove()
      };
    },
    _partes(est, d) {
      const a = (est && est.a) || [], c = (est && est.c) || [];
      const bTxt = String((est && est.b) || '').replace(/\s/g, '');
      const op = est ? est.op : null;
      const A = bitsDe(d.n1, 8), C = bcdDe(d.n3);
      const vacA = A.some((_, i) => a[i] == null), vacC = C.some((_, i) => c[i] == null);
      return {
        ok: [A.every((v, i) => a[i] === v), /^\d+$/.test(bTxt) && +bTxt === d.nb, C.every((v, i) => c[i] === v), op === 0],
        vac: [vacA, !bTxt, vacC, op == null], a, c, bTxt, op
      };
    },
    evaluar(est, d) {
      const x = E.p1._partes(est, d);
      const puntos = x.ok.filter(Boolean).length, nv = x.vac.filter(Boolean).length;
      const nom = ['a) binario', 'b) decimal', 'c) BCD', 'd) leer BCD'];
      return {
        puntos, ok: puntos === 4, valor: puntos,
        texto: nom.map((t, i) => marca(x.ok[i]) + ' ' + t).join('; ') + (nv ? '; ' + nv + (nv === 1 ? ' parte' : ' partes') + ' sin completar (cuentan como incorrectas)' : '')
      };
    },
    solucion(d) {
      const A = bitsDe(d.n1, 8), B = bitsDe(d.nb, 8), C = bcdDe(d.n3);
      const dd = Math.floor(d.n3 / 10), uu = d.n3 % 10;
      const lectura = d.malo
        ? 'El segundo grupo, <span class="c4-bits">' + d.code.slice(4).join('') + '</span> = ' + d.l + ', no es un dígito (BCD llega solo hasta 1001 = 9): <b>no es un BCD válido</b>.'
        : '<span class="c4-bits">' + d.code.slice(0, 4).join('') + '</span> = ' + d.h + ' y <span class="c4-bits">' + d.code.slice(4).join('') + '</span> = ' + d.l + ' → <b>' + (10 * d.h + d.l) + '</b> (leído en binario sería ' + (16 * d.h + d.l) + ').';
      return {
        html: '<div class="solucion">' +
          '<p><b>a)</b> ' + d.n1 + ' = ' + sumaPesos(A) + ' → <span class="c4-bits">' + g4(A) + '</span></p>' +
          '<p><b>b)</b> <span class="c4-bits">' + g4(B) + '</span> = ' + sumaPesos(B) + ' = <b>' + d.nb + '</b></p>' +
          '<p><b>c)</b> Cada dígito por separado: ' + dd + ' = <span class="c4-bits">' + C.slice(0, 4).join('') + '</span>; ' + uu + ' = <span class="c4-bits">' + C.slice(4).join('') + '</span> → <span class="c4-bits">' + g4(C) + '</span>' +
          ' (en binario, ' + d.n3 + ' sería <span class="c4-bits">' + g4(bitsDe(d.n3, 8)) + '</span>)</p>' +
          '<p><b>d)</b> ' + lectura + '</p>' +
          '<p class="lbl">Binario: se resta el peso más grande que entra (128, 64, 32…). BCD: cada dígito decimal va en su propio grupo de 4 bits.</p></div>'
      };
    },
    vista(est, d) {
      const x = E.p1._partes(est, d);
      const bits = (arr, ok) => '<span class="c4-bits">' + arr.slice(0, 8).map((v, i) => (i === 4 ? ' ' : '') + (v == null ? '<span class="c4-q-txt">?</span>' : v)).join('') +
        '</span> <b class="' + (ok ? 'on-t' : 'bad-t') + '">' + marca(ok) + '</b>';
      const arrA = Array.from({ length: 8 }, (_, i) => (x.a[i] == null ? null : x.a[i]));
      const arrC = Array.from({ length: 8 }, (_, i) => (x.c[i] == null ? null : x.c[i]));
      const nv = x.vac.filter(Boolean).length;
      return '<div class="solucion">' +
        '<p><b>a)</b> ' + d.n1 + ' → ' + bits(arrA, x.ok[0]) + '</p>' +
        '<p><b>b)</b> <span class="c4-bits">' + g4(bitsDe(d.nb, 8)) + '</span> → ' + (x.bTxt ? '<b class="' + (x.ok[1] ? 'on-t' : 'bad-t') + '">' + II.esc(x.bTxt) + ' ' + marca(x.ok[1]) + '</b>' : '<span class="c4-q-txt">?</span>') + '</p>' +
        '<p><b>c)</b> ' + d.n3 + ' → ' + bits(arrC, x.ok[2]) + '</p>' +
        '<p><b>d)</b> <span class="c4-bits">' + g4(d.code) + '</span> → ' + (x.op == null ? '<span class="c4-q-txt">?</span>' : '<b class="' + (x.ok[3] ? 'on-t' : 'bad-t') + '">' + d.ops[x.op] + ' ' + marca(x.ok[3]) + '</b>') + '</p></div>' +
        faltanTxt(nv, nv === 1 ? 'parte' : 'partes');
    }
  };

  // =================================================================
  // La sesión
  // =================================================================
  const RECUERDA = {
    rc1: {
      izq: '<p class="lbl">Decimal → binario: resta el peso más grande que entra</p>' +
        '<p class="card">\\(173 = 128 + 32 + 8 + 4 + 1\\) → <span class="c4-bits">1010 1101</span></p>' +
        '<p class="lbl">Decimal → BCD: cada dígito en 4 bits (0000 a 1001)</p>' +
        '<p class="card">47 → <span class="c4-bits">0100 0111</span>; en binario sería <span class="c4-bits">0010 1111</span></p>',
      der: '<p class="expr">\\(A + A\\cdot B = A\\)</p><p class="expr">\\(\\overline{A\\cdot B} = \\overline{A} + \\overline{B}\\)</p><p class="expr">\\(\\overline{A + B} = \\overline{A}\\cdot\\overline{B}\\)</p>' +
        '<div class="q"><p class="qt">¿173 en BCD?</p><button class="rv">Revelar</button><div class="ans"><span class="c4-bits">0001 0111 0011</span>: tres dígitos, 12 bits. En binario bastan 8.</div></div>'
    },
    rc2: {
      izq: '<p class="card">Grupos de 1, 2, 4, 8 o 16 unos vecinos, lo más grandes posible.</p>' +
        '<p class="card">Un grupo de \\(2^k\\) celdas elimina \\(k\\) variables.</p>' +
        '<p class="card">Orden Gray: 00; 01; 11; 10. Los bordes también son vecinos.</p>',
      der: '<p class="card">Un 1 puede estar en <b>varios</b> grupos: si evitas solapar, la expresión no sale mínima.</p>' +
        '<p class="card">Una X se toma como 1 solo si agranda un grupo.</p>' +
        '<div class="q"><p class="qt">¿Un grupo de 6 celdas vale?</p><button class="rv">Revelar</button><div class="ans">No: solo 1, 2, 4, 8 o 16. Seis unos se cubren con dos grupos de 4 que se pisan.</div></div>'
    },
    rc3: {
      izq: '<p class="lbl">El método</p><p class="card">1 enunciado → 2 tabla → 3 mapa → 4 expresión → 5 circuito → 6 prueba</p>' +
        '<p class="card">Decodificador BCD a 7 segmentos: 4 entradas, 7 salidas, un mapa por segmento (10 a 15 son X).</p>',
      der: '<p class="expr">AND → OR = NAND → NAND</p><p class="expr">\\(\\overline{A\\cdot A} = \\overline{A}\\)</p>' +
        '<p class="card">Un término de una sola variable entra <b>negado</b> a la NAND de salida. Un 7400 trae 4 NAND de 2 entradas.</p>' +
        '<div class="q"><p class="qt">¿Por qué NAND → NAND hace lo mismo que AND → OR?</p><button class="rv">Revelar</button><div class="ans">Por De Morgan: \\(\\overline{\\overline{X}\\cdot\\overline{Y}} = X + Y\\). Las dos barras de cada producto se cancelan.</div></div>'
    },
    rc4: {
      izq: '<p class="expr">\\(A \\oplus B = \\overline{A}\\cdot B + A\\cdot\\overline{B}\\)</p><p class="expr">\\(A \\oplus 0 = A\\); \\(A \\oplus 1 = \\overline{A}\\)</p>' +
        '<p class="card">La XOR de muchos bits vale 1 si la cantidad de unos es impar.</p>',
      der: '<p class="card">Paridad par: \\(P\\) = XOR de los datos. Comprobador: \\(E\\) = XOR de todo lo recibido; \\(E = 1\\): error.</p>' +
        '<p class="card">Detecta 1, 3, 5… bits dañados; con 2 o 4 los cambios se tapan.</p>' +
        '<div class="q"><p class="qt">Se envió <span class="c4-bits">1010 0</span> y llegó <span class="c4-bits">1110 0</span>. ¿E?</p><button class="rv">Revelar</button><div class="ans">Llegaron tres unos: \\(E = 1\\), error detectado.</div></div>'
    }
  };

  D1.SESIONES['d1-c5'] = {
    id: 'd1-c5',
    materia: 'Electrónica Digital 1',
    titulo: 'Práctica general',
    pestana0: 13,
    grupos: ['Números y compuertas', 'Karnaugh', 'Diseño', 'XOR y paridad'],
    pasos: [
      { id: 'inicio', tipo: 'inicio', g: 0, titulo: 'Práctica general', idea: 'Escanea el QR y entra con tu nombre y carnet. Hoy solo practicamos: ten tu cuaderno a mano.' },
      // ----- 13: números y compuertas -----
      { id: 'rc1', tipo: 'explica', g: 0, titulo: 'Recuerda: números y compuertas', idea: 'Binario por pesos; BCD dígito por dígito; De Morgan niega cada variable y cambia la operación.',
        formulas: X`Pesos: 128; 64; 32; 16; 8; 4; 2; 1<br>BCD: cada dígito en 4 bits (0000 a 1001)<br>\(A + A\cdot B = A\)<br>\(\overline{A\cdot B} = \overline{A} + \overline{B}\); \(\overline{A + B} = \overline{A}\cdot\overline{B}\)` },
      { id: 'q1', tipo: 'rapida', g: 0, titulo: 'Contar piezas', t: 'Una máquina cuenta piezas de 0 a 299. ¿Cuántos bits necesita el contador como mínimo?', o: ['9', '8', '10', '300'], c: 0,
        por: X`Con 8 bits se llega hasta \(2^8 - 1 = 255\): no alcanza. Con 9 bits, hasta \(2^9 - 1 = 511\).` },
      { id: 'p1', tipo: 'ejercicio', g: 0, ejercicio: 'p1' },
      { id: 'q2', tipo: 'rapida', g: 0, titulo: 'BCD o binario', t: 'El código <span class="c4-bits">0100 1001</span>, ¿cuánto vale leído en BCD y leído en binario?', o: ['BCD: 49; binario: 73', 'BCD: 73; binario: 49', 'BCD: 49; binario: 49', 'BCD: 94; binario: 73'], c: 0, una: true,
        por: 'En BCD cada grupo de 4 bits es un dígito: 0100 = 4 y 1001 = 9 → 49. En binario: 64 + 8 + 1 = 73.' },
      { id: 'q3', tipo: 'rapida', g: 0, titulo: '¿Qué sale del circuito?', t: 'Con A = 1, B = 1 y C = 1, ¿cuánto vale F?', o: ['0', '1', 'Depende de C', 'No se puede saber'], c: 0,
        fig: 'html', figura: () => '<div class="fig-tv">' + D1.circ.svg(3, [[0, 5], [3]], N3, { mono: true }) + '</div>',
        por: X`Arriba: \(A\cdot\overline{C} = 1\cdot 0 = 0\). Abajo: \(\overline{B} = 0\). La OR recibe 0 y 0: \(F = 0\). Se sigue la señal compuerta por compuerta.` },
      { id: 'p2', tipo: 'ejercicio', g: 0, ejercicio: 'p2' },
      { id: 'q4', tipo: 'rapida', g: 0, titulo: 'De Morgan', t: X`\(\overline{A + B}\) es igual a…`,
        o: [X`\(\overline{A}\cdot\overline{B}\)`, X`\(\overline{A} + \overline{B}\)`, X`\(A\cdot B\)`, X`\(\overline{A}\cdot B\)`], c: 0,
        por: X`Negar una suma da el producto de las negaciones: una NOR es una AND con las entradas negadas. Y al revés: \(\overline{A\cdot B} = \overline{A} + \overline{B}\).` },
      { id: 'q5', tipo: 'rapida', g: 0, titulo: 'Simplifica', t: X`\(A + A\cdot B\) es igual a…`, o: [X`\(A\)`, X`\(B\)`, X`\(A\cdot B\)`, X`\(1\)`], c: 0,
        por: X`Absorción: \(A + A\cdot B = A\cdot(1 + B) = A\cdot 1 = A\). Si \(A = 1\), da 1; si \(A = 0\), los dos términos valen 0.` },
      // ----- 14: Karnaugh -----
      { id: 'rc2', tipo: 'explica', g: 1, titulo: 'Recuerda: Karnaugh', idea: 'Grupos de 1, 2, 4, 8 o 16 unos vecinos, lo más grandes posible; se pueden pisar.',
        formulas: X`Grupo de \(2^k\) celdas: elimina \(k\) variables<br>Orden Gray: 00; 01; 11; 10<br>Los bordes son vecinos<br>X: se usa como 1 solo si agranda un grupo` },
      { id: 'q6', tipo: 'rapida', g: 1, titulo: 'Tamaño del grupo', t: 'En un mapa de 4 variables, un grupo de 4 celdas da un término de…', o: ['2 literales', '4 literales', '1 literal', '3 literales'], c: 0,
        por: X`Un grupo de \(2^k\) celdas elimina \(k\) variables: 4 celdas \(= 2^2\) eliminan 2 de las 4 y quedan 2 literales. Un grupo de 8 deja 1; uno de 2 deja 3.` },
      { id: 'p3', tipo: 'ejercicio', g: 1, ejercicio: 'p3' },
      { id: 'q7', tipo: 'rapida', g: 1, titulo: 'Las cuatro esquinas', t: '¿Qué expresión cubre los cuatro unos de las esquinas?',
        o: [X`\(\overline{B}\cdot\overline{D}\)`, X`\(\overline{A}\cdot\overline{C}\)`, X`\(B\cdot D\)`, 'No se agrupan: son 4 términos'], c: 0,
        fig: 'html', figura: () => '<div class="fig-tv">' + K.estatico(4, [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0], { mt: false }) + '</div>',
        por: X`El mapa se enrolla: la fila de arriba es vecina de la de abajo y la columna izquierda de la derecha. Las cuatro esquinas forman un grupo y en todas \(B = 0\) y \(D = 0\): \(F = \overline{B}\cdot\overline{D}\).` },
      { id: 'p4', tipo: 'ejercicio', g: 1, ejercicio: 'p4' },
      { id: 'p5', tipo: 'ejercicio', g: 1, ejercicio: 'p5' },
      { id: 'p6', tipo: 'ejercicio', g: 1, ejercicio: 'p6' },
      // ----- 15: diseño -----
      { id: 'rc3', tipo: 'explica', g: 2, titulo: 'Recuerda: diseño y NAND', idea: 'Enunciado → tabla → mapa → expresión → circuito → prueba.',
        formulas: X`AND → OR = NAND → NAND<br>Inversor: NAND con las entradas unidas, \(\overline{A\cdot A} = \overline{A}\)<br>Un 7400 trae 4 NAND de 2 entradas` },
      { id: 'q8', tipo: 'rapida', g: 2, titulo: 'El decodificador', t: '¿Cuántas entradas y cuántas salidas tiene un decodificador BCD a 7 segmentos?', o: ['4 entradas y 7 salidas', '7 entradas y 4 salidas', '4 entradas y 10 salidas', '1 entrada y 7 salidas'], c: 0, una: true,
        por: 'Entran los 4 bits del dígito en BCD (0 a 9) y sale una señal por segmento: a, b, c, d, e, f y g. Cada salida tiene su propio mapa de 4 variables.' },
      { id: 'p7', tipo: 'ejercicio', g: 2, ejercicio: 'p7' },
      { id: 'q9', tipo: 'rapida', g: 2, titulo: 'Contar NAND', t: X`\(F = A\cdot B + C\) usando solo NAND de 2 entradas: ¿cuántas compuertas?`, o: ['3', '2', '4', '5'], c: 0,
        por: X`Una NAND para \(A\cdot B\), una NAND con las entradas unidas para \(\overline{C}\) y la NAND de salida: \(\overline{\overline{A\cdot B}\cdot\overline{C}} = A\cdot B + C\). Total 3.` },
      { id: 'p8', tipo: 'ejercicio', g: 2, ejercicio: 'p8' },
      { id: 'q10', tipo: 'rapida', g: 2, titulo: 'Para pensar: la bomba', t: 'La bomba arranca al bajar de Lb y para recién al llegar a La. Con el agua entre los dos sensores, ¿un circuito combinacional sabe qué hacer?',
        o: ['No: necesita recordar lo que estaba haciendo', 'Sí, con una AND', 'Sí, con una XOR', 'Sí, si se simplifica con Karnaugh'], c: 0, una: true,
        por: 'Entre Lb y La las entradas son las mismas al llenar y al vaciar, pero la bomba debe hacer cosas distintas. Hace falta memoria: eso lo hacen los circuitos secuenciales (flip-flops).' },
      // ----- 16: XOR y paridad -----
      { id: 'rc4', tipo: 'explica', g: 3, titulo: 'Recuerda: XOR y paridad', idea: 'La XOR vale 1 si la cantidad de unos es impar.',
        formulas: X`\(A \oplus B = \overline{A}\cdot B + A\cdot\overline{B}\)<br>\(A \oplus 0 = A\); \(A \oplus 1 = \overline{A}\)<br>Paridad par: \(P\) = XOR de los datos<br>Comprobador: \(E\) = XOR de lo recibido; \(E = 1\): error` },
      { id: 'q11', tipo: 'rapida', g: 3, titulo: 'Inversor controlado', t: X`¿Cuánto vale \(A \oplus 1\)?`, o: [X`\(\overline{A}\)`, X`\(A\)`, X`\(1\)`, X`\(0\)`], c: 0,
        por: X`\(A \oplus 1 = \overline{A}\) y \(A \oplus 0 = A\): con la otra entrada decides si la señal pasa tal cual o invertida.` },
      { id: 'p9', tipo: 'ejercicio', g: 3, ejercicio: 'p9' },
      { id: 'q12', tipo: 'rapida', g: 3, titulo: 'El bit de paridad', t: 'Paridad par: el dato <span class="c4-bits">1101 0110</span>, ¿qué bit de paridad P lleva?', o: ['1', '0', '5', 'Depende del primer bit'], c: 0,
        por: 'El dato tiene 5 unos (impar). P = 1 para que el total, contando P, quede par: 6 unos.' },
      { id: 'p10', tipo: 'ejercicio', g: 3, ejercicio: 'p10' },
      { id: 'q13', tipo: 'rapida', g: 3, titulo: '¿Qué detecta?', t: 'Con un solo bit de paridad, ¿qué errores detecta el receptor?', o: ['Una cantidad impar de bits dañados', 'Cualquier cantidad de bits dañados', 'Solo cuando fallan 2 bits', 'Ninguno: solo los corrige'], c: 0, una: true,
        por: 'Cada bit dañado cambia la paridad. Con 1 o 3 errores, E = 1; con 2 o 4, los cambios se tapan y E = 0. Para saber cuál bit falló hace falta paridad en filas y columnas.' },
      { id: 'p11', tipo: 'ejercicio', g: 3, ejercicio: 'p11' },
      { id: 'cierre', tipo: 'cierre', g: 3, titulo: 'Cierre', idea: 'Para seguir practicando: entra al modo repaso y usa «Otra vez (datos nuevos)» en cada ejercicio.' }
    ]
  };

  // =================================================================
  // Proyección: diapositivas «Recuerda» (solo en la TV y solo en esta sesión)
  // =================================================================
  function montarTV() {
    const stage = document.getElementById('stage');
    if (!stage || !document.body.classList.contains('tv') || !window.II || II.params.get('s') !== 'd1-c5') return;
    D1.SESIONES['d1-c5'].pasos.filter((p) => RECUERDA[p.id]).forEach((p) => {
      if (document.getElementById('p-' + p.id)) return;
      const R = RECUERDA[p.id];
      const s = document.createElement('section');
      s.className = 'slide';
      s.id = 'p-' + p.id;
      s.innerHTML = '<h2>' + p.titulo + '</h2><div class="body"><div class="col">' + R.izq + '</div><div class="col">' + R.der + '</div></div>';
      stage.appendChild(s);
    });
  }
  montarTV();
})();
