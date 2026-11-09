// ============================================================
// Electrónica Digital 1 — Repaso para el examen (09/11/2026)
//   Ejercicios NUEVOS del repaso (claves n1…n11). Usan la misma forma que los
//   de clase (generar, enunciado, montar, evaluar, solucion, vista), así que
//   repaso.js los muestra igual que los antiguos (p2…p11, e3, e5).
//   Nada de esto escribe en la base de datos.
//   Regla del docente (09/11): toda cantidad en ceros y unos va JUNTA (sin separar
//   de 4 en 4) y el enunciado dice explícitamente en qué código está.
// ============================================================
(function () {
  'use strict';
  const D1 = (window.D1 = window.D1 || {});
  const K = D1.k, C = D1.circ, E = D1.EJERCICIOS;
  const X = String.raw;
  const N3 = ['A', 'B', 'C'];
  const LET = 'ABCDEF';
  const Q = '<span class="c4-q-txt">?</span>';
  const marca = (ok) => (ok ? '✓' : '✗');
  const faltanTxt = (n, cosa) => (n ? '<p class="c4-faltan">Dejaste ' + n + ' ' + cosa + ' sin completar («?»): cuentan como incorrectas. Hay que llenar todo.</p>' : '');
  const RP = (D1.RP = D1.RP || {});

  // ---------------- utilidades de números ----------------
  const bin = (n, k) => { const s = n.toString(2); return k ? s.padStart(k, '0') : s; };
  const bits = (s) => '<span class="rp-bits">' + s + '</span>';
  const bcd = (n) => String(n).split('').map((c) => bin(+c, 4)).join('');
  const pesos = (n) => { const out = []; for (let p = 128; p >= 1; p /= 2) if (n & p) out.push(p); return out; };
  const limpia = (s) => String(s == null ? '' : s).replace(/[\s.,_-]/g, '');
  RP.bits = bits; RP.bin = bin; RP.bcd = bcd;

  // ---------------- utilidades de funciones (3 variables) ----------------
  const litTex = (c, n) => (c & 1 ? '\\overline{' + n[c >> 1] + '}' : n[c >> 1]);
  const ordenar = (g) => g.slice().sort((a, b) => a - b);
  // suma de productos en LaTeX (sin los \( \))
  const sopTex = (pu, n) => {
    const u = (pu || []).filter((g) => g.length);
    return u.length ? u.map((g) => ordenar(g).map((c) => litTex(c, n)).join('\\cdot ')).join(' + ') : '0';
  };
  const tex = (s) => '\\(' + s + '\\)';
  RP.sopTex = sopTex; RP.tex = tex;
  const fun = (pu) => C.funcion(3, pu);
  const igual = (a, b) => a.every((x, i) => x === b[i]);
  const clave = (f) => f.join('');
  // suma de productos al azar: 2 o 3 términos de 1 a 2 literales (a veces 3)
  function sopAzar(r) {
    for (let t = 0; t < 400; t++) {
      const nt = r() < 0.55 ? 2 : 3, pu = [], vistos = new Set();
      for (let j = 0; j < nt; j++) {
        const x = r(), k = x < 0.2 ? 1 : x < 0.88 ? 2 : 3;
        const vars = II.mezclar(r, [0, 1, 2]).slice(0, k).sort();
        const g = vars.map((v) => 2 * v + (r() < 0.4 ? 1 : 0));
        const id = g.join(',');
        if (!vistos.has(id)) { vistos.add(id); pu.push(g); }
      }
      if (pu.length < 2) continue;
      const f = fun(pu), unos = f.filter(Boolean).length;
      if (unos < 2 || unos > 6) continue;
      // que ningún término sobre del todo (cada uno aporta algo)
      if (pu.some((g, j) => igual(fun(pu.filter((_, i) => i !== j)), f))) continue;
      return { pu, f };
    }
    return { pu: [[0, 2], [5]], f: fun([[0, 2], [5]]) };
  }
  // variantes equivocadas de un circuito (funciones distintas entre sí y de la correcta)
  function distractores(r, pu, f, k) {
    const cand = [];
    pu.forEach((g, j) => {
      g.forEach((c, i) => { const h = g.slice(); h[i] = c ^ 1; cand.push(pu.map((x, z) => (z === j ? h : x))); });
      if (pu.length > 1) cand.push(pu.filter((_, z) => z !== j));
      g.forEach((c, i) => {
        [0, 1, 2].filter((v) => !g.some((cc) => cc >> 1 === v)).forEach((v) => {
          const h = g.slice(); h[i] = 2 * v + (c & 1); cand.push(pu.map((x, z) => (z === j ? h : x)));
          if (g.length < 3) cand.push(pu.map((x, z) => (z === j ? g.concat([2 * v + (r() < 0.5 ? 1 : 0)]) : x)));
        });
      });
    });
    const usadas = new Set([clave(f)]), out = [];
    II.mezclar(r, cand).forEach((p) => {
      if (out.length >= k || !p.length || p.some((g) => !g.length)) return;
      const ff = fun(p), kk = clave(ff);
      if (usadas.has(kk) || ff.every((x) => x === 0) || ff.every((x) => x === 1)) return;
      usadas.add(kk); out.push(p);
    });
    return out;
  }
  const minima = (f) => { const s = K.resolver(3, f); return C.deCubos(3, s.cubos); };
  const tablaV = (f, n, sal) => K.tablaHTML(3, f, { nombres: n || N3, salida: sal || 'Y' });
  const circuito = (pu, n) => '<div class="rp-circ">' + C.svg(3, pu, n || N3, { mono: true, salida: 'Y' }) + '</div>';
  RP.sopAzar = sopAzar; RP.distractores = distractores; RP.minima = minima;

  // ============================================================
  // Motor de ejercicios de opción múltiple (varias preguntas, 1 punto cada una)
  //   cfg: { titulo, n, enunciado, items(r) → [{ t, fig?, o: [correcta primero…], por, sol?, una? }] }
  // ============================================================
  function ejOpciones(cfg) {
    return {
      titulo: cfg.titulo, puntos: cfg.n, tipo: 'opciones',
      generar(r) { return { its: cfg.items(r).map((it) => Object.assign({}, it, { per: II.mezclar(r, it.o.map((_, i) => i)) })) }; },
      resumen: () => cfg.titulo,
      enunciado: () => (cfg.enunciado ? '<p>' + cfg.enunciado + '</p>' : ''),
      montar(cont, d) {
        const sel = Array(d.its.length).fill(null);
        let mov = 0;
        const t0 = Date.now(), oyentes = [];
        const caja = document.createElement('div');
        caja.className = 'rp-items';
        caja.innerHTML = d.its.map((it, i) => '<div class="rp-item"><p class="rp-t"><b>' + (i + 1) + ')</b> ' + it.t + '</p>' + (it.fig || '') +
          '<div class="opciones-est' + (it.svg ? ' rp-svgops' : '') + '">' + it.per.map((k, j) => '<button class="opcion-est" data-i="' + i + '" data-k="' + k + '"><span class="letra">' + LET[j] + '</span><span class="rp-op">' + it.o[k] + '</span></button>').join('') + '</div></div>').join('');
        cont.appendChild(caja);
        const pintar = () => caja.querySelectorAll('.opcion-est').forEach((b) => b.classList.toggle('elegida', sel[+b.dataset.i] === +b.dataset.k));
        caja.addEventListener('click', (e) => {
          const b = e.target.closest('.opcion-est');
          if (!b) return;
          sel[+b.dataset.i] = +b.dataset.k; mov++; pintar(); oyentes.forEach((fn) => fn());
        });
        return {
          estado: () => ({ sel: sel.slice() }),
          fijar(x) { if (x && x.sel) x.sel.forEach((v, i) => { sel[i] = v; }); pintar(); },
          movimientos: () => mov, segundos: () => Math.round((Date.now() - t0) / 1000),
          alCambiar: (fn) => oyentes.push(fn), destruir: () => caja.remove()
        };
      },
      evaluar(est, d) {
        const sel = (est && est.sel) || [];
        const ok = d.its.map((_, i) => sel[i] === 0), nv = d.its.filter((_, i) => sel[i] == null).length;
        const puntos = ok.filter(Boolean).length;
        return {
          puntos, ok: puntos === d.its.length, valor: puntos,
          texto: ok.map((x, i) => marca(x) + ' ' + (i + 1)).join('; ') + (nv ? '; ' + nv + ' sin responder (cuentan como incorrectas)' : '')
        };
      },
      solucion(d) {
        return { html: '<div class="solucion">' + d.its.map((it, i) => '<div class="rp-sol"><p><b>' + (i + 1) + ')</b> ' + it.t + '</p>' + (it.fig || '') +
          '<p class="rp-resp"><b>Respuesta:</b> ' + (it.svg ? '' : it.o[0]) + '</p>' + (it.svg ? '<div class="rp-svgsol">' + it.o[0] + '</div>' : '') +
          (it.sol || '') + '<p class="rp-por">' + it.por + '</p></div>').join('') + '</div>' };
      },
      vista(est, d) {
        const sel = (est && est.sel) || [], nv = d.its.filter((_, i) => sel[i] == null).length;
        return '<div class="solucion">' + d.its.map((it, i) => {
          const s = sel[i];
          return '<p><b>' + (i + 1) + ')</b> ' + (s == null ? Q : '<span class="' + (s === 0 ? 'on-t' : 'bad-t') + '"><b>' + marca(s === 0) + '</b></span> ' + (it.svg ? '' : it.o[s])) + '</p>' +
            (s != null && it.svg ? '<div class="rp-svgsol ' + (s === 0 ? 'ok' : 'mal') + '">' + it.o[s] + '</div>' : '');
        }).join('') + '</div>' + faltanTxt(nv, nv === 1 ? 'pregunta' : 'preguntas');
      }
    };
  }
  RP.ejOpciones = ejOpciones;
  // opciones distintas a partir de una lista de candatos (la correcta primero)
  const unicas = (lista, k) => { const out = []; lista.forEach((x) => { if (out.length < k && !out.includes(String(x))) out.push(String(x)); }); return out; };
  // opciones numéricas: la correcta primero y distractores distintos (completa con vecinos si faltan)
  const numOps = (c, extras) => {
    const lista = [c].concat(extras || []).filter((x) => x >= 0);
    for (let d = 1; lista.length < 12; d++) { lista.push(c + d); if (c - d >= 0) lista.push(c - d); }
    return unicas(lista, 4);
  };

  // ============================================================
  // n1 · Conversiones (se escriben): seis partes, 1 punto cada una
  // ============================================================
  const PARTES_N1 = [
    { id: 'a', de: 'decimal', a: 'binario' }, { id: 'b', de: 'binario', a: 'decimal' }, { id: 'c', de: 'decimal', a: 'BCD' },
    { id: 'd', de: 'BCD', a: 'decimal' }, { id: 'e', de: 'BCD', a: 'binario' }, { id: 'f', de: 'binario', a: 'BCD' }
  ];
  E.n1 = {
    titulo: 'Conversiones: decimal, binario y BCD', puntos: 6, tipo: 'conversiones',
    generar(r) {
      const ent = (a, b) => a + Math.floor(r() * (b - a + 1));
      const unosDe = (n) => bin(n).split('').filter((c) => c === '1').length;
      let a; do { a = ent(37, 250); } while (unosDe(a) < 3);
      let b; do { b = ent(41, 250); } while (b === a || unosDe(b) < 3);
      const c = r() < 0.5 ? ent(13, 98) : ent(105, 987);
      // d: BCD para leer; a veces no es válido
      const malo = r() < 0.3;
      let dd; do { dd = ent(12, 98); } while (dd % 11 === 0);
      let dcode = bcd(dd);
      if (malo) { const pos = r() < 0.5 ? 0 : 4, v = ent(10, 15); dcode = dcode.slice(0, pos) + bin(v, 4) + dcode.slice(pos + 4); }
      let e; do { e = ent(12, 98); } while (e % 10 === 0);
      let f; do { f = ent(21, 99); } while (f % 10 === 0 || f === e);
      return { a, b, c, dd, dcode, malo, e, f };
    },
    resumen: (d) => 'decimal ' + d.a + '; binario ' + bin(d.b, 8) + '; decimal ' + d.c + '; BCD ' + d.dcode + '; BCD ' + bcd(d.e) + '; binario ' + bin(d.f),
    enunciado: () => '<p>Escribe solo ceros y unos (o el número decimal), <b>sin espacios</b>. Usa tu cuaderno para los cálculos.</p>',
    _dato(d, id) {
      return { a: d.a, b: bits(bin(d.b, 8)), c: d.c, d: bits(d.dcode), e: bits(bcd(d.e)), f: bits(bin(d.f)) }[id];
    },
    montar(cont, d) {
      const st = { a: '', b: '', c: '', d: '', dmal: false, e: '', f: '' };
      let mov = 0;
      const t0 = Date.now(), oyentes = [];
      const caja = document.createElement('div');
      caja.className = 'rp-items';
      caja.innerHTML = PARTES_N1.map((p) => '<div class="rp-item"><p class="rp-t"><b>' + p.id + ')</b> La siguiente cantidad está en <b>' + p.de + '</b>: ' +
        '<span class="rp-dato">' + E.n1._dato(d, p.id) + '</span>. Conviértela a <b>' + p.a + '</b>.</p>' +
        '<input class="rp-in" data-p="' + p.id + '" type="text" inputmode="numeric" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribe en ' + p.a + '">' +
        (p.id === 'd' ? '<button class="boton rp-nov" data-nov>No es un código BCD válido</button>' : '') + '</div>').join('');
      cont.appendChild(caja);
      const avisar = () => { mov++; oyentes.forEach((fn) => fn()); };
      const pintar = () => {
        caja.querySelectorAll('.rp-in').forEach((i) => { if (i.value !== st[i.dataset.p]) i.value = st[i.dataset.p]; });
        const nb = caja.querySelector('[data-nov]'); nb.classList.toggle('prim', st.dmal);
        nb.textContent = st.dmal ? '✓ Marcaste: no es un código BCD válido' : 'No es un código BCD válido';
        caja.querySelector('[data-p="d"]').disabled = st.dmal;
      };
      caja.addEventListener('input', (e) => { const i = e.target.closest('.rp-in'); if (i) { st[i.dataset.p] = i.value; avisar(); } });
      caja.addEventListener('click', (e) => { if (e.target.closest('[data-nov]')) { st.dmal = !st.dmal; if (st.dmal) st.d = ''; pintar(); avisar(); } });
      pintar();
      return {
        estado: () => Object.assign({}, st),
        fijar(x) { if (x) Object.assign(st, x); pintar(); },
        movimientos: () => mov, segundos: () => Math.round((Date.now() - t0) / 1000),
        alCambiar: (fn) => oyentes.push(fn), destruir: () => caja.remove()
      };
    },
    _partes(est, d) {
      est = est || {};
      const s = (k) => limpia(est[k]);
      const esBin = (x) => /^[01]+$/.test(x) && x.length <= 16;
      const esDec = (x) => /^\d+$/.test(x) && x.length <= 6;
      const okBCD = (x, n) => { const c = bcd(n); return esBin(x) && x.length <= c.length && x.padStart(c.length, '0') === c; };
      return {
        a: { ok: esBin(s('a')) && parseInt(s('a'), 2) === d.a, vac: !s('a'), r: s('a') },
        b: { ok: esDec(s('b')) && +s('b') === d.b, vac: !s('b'), r: s('b') },
        c: { ok: okBCD(s('c'), d.c), vac: !s('c'), r: s('c') },
        d: { ok: d.malo ? !!est.dmal : !est.dmal && esDec(s('d')) && +s('d') === d.dd, vac: !est.dmal && !s('d'), r: est.dmal ? 'No es un código BCD válido' : s('d') },
        e: { ok: esBin(s('e')) && parseInt(s('e'), 2) === d.e, vac: !s('e'), r: s('e') },
        f: { ok: okBCD(s('f'), d.f), vac: !s('f'), r: s('f') }
      };
    },
    evaluar(est, d) {
      const x = E.n1._partes(est, d), ids = 'abcdef'.split('');
      const puntos = ids.filter((k) => x[k].ok).length, nv = ids.filter((k) => x[k].vac).length;
      return {
        puntos, ok: puntos === 6, valor: puntos,
        texto: ids.map((k) => marca(x[k].ok) + ' ' + k + ')').join('; ') + (nv ? '; ' + nv + (nv === 1 ? ' parte' : ' partes') + ' sin completar (cuentan como incorrectas)' : '')
      };
    },
    solucion(d) {
      const sumaP = (n) => pesos(n).join(' + ');
      const dig = (n) => String(n).split('').map((c) => c + ' → ' + bin(+c, 4)).join('; ');
      const grupos = (code) => code.match(/.{4}/g);
      const g = grupos(d.dcode), vals = g.map((x) => parseInt(x, 2));
      const lecturaD = d.malo
        ? 'Se separa en grupos de 4 bits desde la derecha: ' + g.join(' | ') + '. El grupo ' + g[vals.findIndex((v) => v > 9)] + ' vale ' + vals.find((v) => v > 9) + ', que no es un dígito (BCD llega solo hasta 1001 = 9): <b>no es un código BCD válido</b>.'
        : 'Se separa en grupos de 4 bits desde la derecha: ' + g.join(' | ') + ' → ' + vals.join(' y ') + ' → <b>' + d.dd + '</b>.';
      return {
        html: '<div class="solucion rp-solconv">' +
          '<p><b>a)</b> Se restan los pesos (128, 64, 32, 16, 8, 4, 2, 1) que caben: ' + d.a + ' = ' + sumaP(d.a) + ' → ' + bits(bin(d.a)) + '</p>' +
          '<p><b>b)</b> Se suman los pesos de los unos: ' + bits(bin(d.b, 8)) + ' = ' + sumaP(d.b) + ' = <b>' + d.b + '</b></p>' +
          '<p><b>c)</b> Cada dígito decimal con sus propios 4 bits: ' + dig(d.c) + ' → ' + bits(bcd(d.c)) + ' <span class="lbl">(en binario, ' + d.c + ' sería ' + bits(bin(d.c)) + ')</span></p>' +
          '<p><b>d)</b> ' + lecturaD + '</p>' +
          '<p><b>e)</b> Primero a decimal: ' + grupos(bcd(d.e)).join(' | ') + ' → ' + d.e + '. Después a binario: ' + d.e + ' = ' + sumaP(d.e) + ' → ' + bits(bin(d.e)) + '</p>' +
          '<p><b>f)</b> Primero a decimal: ' + bits(bin(d.f)) + ' = ' + sumaP(d.f) + ' = ' + d.f + '. Después a BCD: ' + dig(d.f) + ' → ' + bits(bcd(d.f)) + '</p>' +
          '</div>'
      };
    },
    vista(est, d) {
      const x = E.n1._partes(est, d), ids = 'abcdef'.split('');
      const nv = ids.filter((k) => x[k].vac).length;
      return '<div class="solucion">' + ids.map((k) => '<p><b>' + k + ')</b> ' + (x[k].vac ? Q : '<b class="' + (x[k].ok ? 'on-t' : 'bad-t') + '">' + II.esc(x[k].r) + ' ' + marca(x[k].ok) + '</b>') + '</p>').join('') + '</div>' +
        faltanTxt(nv, nv === 1 ? 'parte' : 'partes');
    }
  };

  // ============================================================
  // n11 · Bits, rangos y códigos BCD (opciones)
  // ============================================================
  E.n11 = ejOpciones({
    titulo: 'Bits, rangos y códigos BCD', n: 4,
    items(r) {
      const ent = (a, b) => a + Math.floor(r() * (b - a + 1));
      const its = [];
      // 1) cuántos bits para contar
      const N = II.elegir(r, [ent(20, 60), ent(70, 250), ent(300, 900), ent(1100, 4000)]);
      const nb = Math.ceil(Math.log2(N + 1));
      its.push({ t: 'Un contador debe llegar de 0 a ' + N + '. ¿Cuántos bits necesita como mínimo?', o: numOps(nb, [nb - 1, nb + 1, String(N).length * 4]),
        por: X`Con \(n\) bits se cuenta de 0 a \(2^n - 1\). Con ` + (nb - 1) + X` bits se llega a \(2^{` + (nb - 1) + X`} - 1 = ` + (2 ** (nb - 1) - 1) + X`\): no alcanza. Con ` + nb + X` bits se llega a ` + (2 ** nb - 1) + '.' });
      // 2) número más grande con n bits
      const n = ent(4, 12);
      its.push({ t: 'Con ' + n + ' bits, ¿cuál es el número más grande que se puede escribir?', o: numOps(2 ** n - 1, [2 ** n, 2 ** (n - 1), 2 * n]),
        por: X`Hay \(2^{` + n + X`} = ` + 2 ** n + X`\) combinaciones, pero la primera es el 0: el más grande es \(2^{` + n + X`} - 1 = ` + (2 ** n - 1) + X`\).` });
      // 3) ¿código BCD válido?
      const malo = r() < 0.5;
      let v = ent(12, 98), code = bcd(v), vm = null;
      if (malo) { vm = ent(10, 15); code = (r() < 0.5 ? bin(vm, 4) + code.slice(4) : code.slice(0, 4) + bin(vm, 4)); }
      its.push({ t: 'La siguiente cantidad está en <b>BCD</b>: ' + bits(code) + '. ¿Es un código BCD válido?', una: true,
        o: malo ? ['No: un grupo de 4 bits vale ' + vm + ' y no es un dígito', 'Sí, vale ' + parseInt(code, 2), 'Sí, porque tiene 8 bits', 'Solo si se lee en binario']
          : ['Sí: vale ' + v, 'No: un grupo de 4 bits vale más de 9', 'Sí: vale ' + parseInt(code, 2), 'No: el BCD solo usa 4 bits'],
        por: 'Se separa en grupos de 4 bits desde la derecha: ' + code.match(/.{4}/g).join(' | ') + '. ' + (malo ? 'El grupo que vale ' + vm + ' no es un dígito decimal (BCD llega solo hasta 1001 = 9).' : 'Los dos grupos son dígitos (0 a 9): ' + code.match(/.{4}/g).map((g) => parseInt(g, 2)).join(' y ') + ' → ' + v + '.') });
      // 4) bits en BCD y en binario
      const D = ent(100, 999), bb = bin(D).length;
      its.push({ t: 'El número decimal ' + D + ': ¿cuántos bits ocupa en BCD y cuántos en binario?', una: true,
        o: unicas(['12 en BCD; ' + bb + ' en binario', bb + ' en BCD; 12 en binario', '3 en BCD; ' + bb + ' en binario', '12 en BCD; 12 en binario'], 4),
        por: 'En BCD cada dígito usa 4 bits: 3 dígitos × 4 = 12 bits. En binario: ' + D + ' = ' + bits(bin(D)) + ', ' + bb + ' bits. El BCD gasta más bits, pero cada dígito va directo a su display.' });
      return its;
    }
  });

  // ============================================================
  // n2 · Compuertas lógicas
  // ============================================================
  const G = { AND: (a, b) => a & b, OR: (a, b) => a | b, NAND: (a, b) => 1 - (a & b), NOR: (a, b) => 1 - (a | b), XOR: (a, b) => a ^ b, XNOR: (a, b) => 1 - (a ^ b) };
  const REGLA = { AND: 'sale 1 solo si todas sus entradas son 1', OR: 'sale 1 si al menos una entrada es 1', NAND: 'sale 0 solo si todas sus entradas son 1', NOR: 'sale 1 solo si todas sus entradas son 0', XOR: 'sale 1 si sus entradas son distintas', XNOR: 'sale 1 si sus entradas son iguales' };
  RP.G = G; RP.REGLA = REGLA;
  const tabla2 = (g) => '<table class="tt tight"><tr><th>A</th><th>B</th><th>Y</th></tr>' + [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => { const y = G[g](a, b); return '<tr><td>' + a + '</td><td>' + b + '</td><td class="' + (y ? 'v1' : '') + '">' + y + '</td></tr>'; }).join('') + '</table>';
  E.n2 = ejOpciones({
    titulo: 'Compuertas lógicas', n: 4,
    items(r) {
      const nombres = Object.keys(G), its = [];
      const g1 = II.elegir(r, nombres);
      let g2; do { g2 = II.elegir(r, nombres); } while (g2 === g1);
      [g1, g2].forEach((g) => its.push({ t: 'La caja misteriosa da esta tabla. ¿Qué compuerta tiene adentro?', fig: '<div class="rp-fig">' + tabla2(g) + '</div>',
        o: [g].concat(II.mezclar(r, nombres.filter((x) => x !== g)).slice(0, 3)), por: 'La ' + g + ' ' + REGLA[g] + '.' }));
      // regla en palabras
      let g3; do { g3 = II.elegir(r, nombres); } while (g3 === g1 || g3 === g2);
      its.push({ t: '¿Qué compuerta ' + REGLA[g3] + '?', o: [g3].concat(II.mezclar(r, nombres.filter((x) => x !== g3)).slice(0, 3)), por: 'La ' + g3 + ' ' + REGLA[g3] + '. Repasa su tabla de 4 filas.' });
      // circuito con valores
      const s = sopAzar(r), m = Math.floor(r() * 8), v = [(m >> 2) & 1, (m >> 1) & 1, m & 1], F = s.f[m];
      its.push({ t: 'Con A = ' + v[0] + ', B = ' + v[1] + ' y C = ' + v[2] + ', ¿cuánto vale Y?', fig: circuito(s.pu),
        o: [String(F), String(1 - F), 'Depende de otra variable', 'No se puede saber'],
        por: 'Se sigue la señal compuerta por compuerta: ' + s.pu.map((g) => tex(ordenar(g).map((c) => litTex(c, N3)).join('\\cdot ')) + ' = ' + (g.every((c) => (v[c >> 1] ^ (c & 1)) === 1) ? 1 : 0)).join('; ') + '. La OR da ' + F + '.' });
      return its;
    }
  });

  // ============================================================
  // n3 · Álgebra de Boole y De Morgan (banco)
  // ============================================================
  const BOOLE = [
    [X`A\cdot B + A\cdot\overline{B}`, [X`A`, X`B`, X`1`, X`A\cdot B`], X`Factor común: \(A\cdot(B + \overline{B}) = A\cdot 1 = A\).`],
    [X`A + \overline{A}\cdot B`, [X`A + B`, X`A`, X`B`, X`A\cdot B`], X`Distributiva de la suma: \((A + \overline{A})\cdot(A + B) = 1\cdot(A + B) = A + B\).`],
    [X`(A + B)\cdot(A + \overline{B})`, [X`A`, X`B`, X`A + B`, X`0`], X`Distributiva: \(A + B\cdot\overline{B} = A + 0 = A\).`],
    [X`A\cdot(\overline{A} + B)`, [X`A\cdot B`, X`A`, X`B`, X`0`], X`\(A\cdot\overline{A} + A\cdot B = 0 + A\cdot B = A\cdot B\).`],
    [X`\overline{\overline{A}\cdot\overline{B}}`, [X`A + B`, X`A\cdot B`, X`\overline{A} + \overline{B}`, X`\overline{A}\cdot\overline{B}`], X`De Morgan: \(\overline{\overline{A}} + \overline{\overline{B}} = A + B\).`],
    [X`\overline{\overline{A} + B}`, [X`A\cdot\overline{B}`, X`\overline{A}\cdot B`, X`A + \overline{B}`, X`\overline{A}\cdot\overline{B}`], X`De Morgan: \(\overline{\overline{A}}\cdot\overline{B} = A\cdot\overline{B}\).`],
    [X`A + A\cdot B`, [X`A`, X`B`, X`A\cdot B`, X`1`], X`Absorción: \(A\cdot(1 + B) = A\cdot 1 = A\). Si \(A = 1\) da 1; si \(A = 0\) los dos términos valen 0: B nunca decide.`],
    [X`A\cdot(A + B)`, [X`A`, X`A\cdot B`, X`A + B`, X`B`], X`Absorción: \(A\cdot A + A\cdot B = A + A\cdot B = A\).`],
    [X`\overline{A\cdot B\cdot C}`, [X`\overline{A} + \overline{B} + \overline{C}`, X`\overline{A}\cdot\overline{B}\cdot\overline{C}`, X`A + B + C`, X`\overline{A + B + C}`], X`De Morgan: negar un producto es sumar las negaciones (se rompe la barra y se cambia \(\cdot\) por \(+\)).`],
    [X`\overline{A + B + C}`, [X`\overline{A}\cdot\overline{B}\cdot\overline{C}`, X`\overline{A} + \overline{B} + \overline{C}`, X`A\cdot B\cdot C`, X`\overline{A\cdot B\cdot C}`], X`De Morgan: negar una suma es multiplicar las negaciones.`],
    [X`\overline{A + B}`, [X`\overline{A}\cdot\overline{B}`, X`\overline{A} + \overline{B}`, X`A\cdot B`, X`\overline{A}\cdot B`], X`De Morgan: se rompe la barra y se cambia \(+\) por \(\cdot\). Una NOR es una AND con las entradas negadas.`],
    [X`\overline{A\cdot B}`, [X`\overline{A} + \overline{B}`, X`\overline{A}\cdot\overline{B}`, X`A + B`, X`A\cdot B`], X`De Morgan: se rompe la barra y se cambia \(\cdot\) por \(+\). Una NAND es una OR con las entradas negadas.`],
    [X`A\cdot B + \overline{A}\cdot B`, [X`B`, X`A`, X`1`, X`A\cdot B`], X`Factor común: \(B\cdot(A + \overline{A}) = B\cdot 1 = B\).`],
    [X`A\cdot B\cdot C + A\cdot B\cdot\overline{C}`, [X`A\cdot B`, X`A\cdot B\cdot C`, X`C`, X`A + B`], X`Factor común: \(A\cdot B\cdot(C + \overline{C}) = A\cdot B\).`],
    [X`\overline{A}\cdot\overline{B} + \overline{A}\cdot B`, [X`\overline{A}`, X`\overline{B}`, X`1`, X`\overline{A}\cdot B`], X`Factor común: \(\overline{A}\cdot(\overline{B} + B) = \overline{A}\).`],
    [X`A\cdot B + A\cdot B\cdot C`, [X`A\cdot B`, X`A\cdot B\cdot C`, X`C`, X`A + C`], X`Absorción: \(A\cdot B\cdot(1 + C) = A\cdot B\).`],
    [X`(A + 1)\cdot B`, [X`B`, X`A\cdot B`, X`1`, X`A + B`], X`\(A + 1 = 1\), y \(1\cdot B = B\).`],
    [X`A\cdot\overline{A} + B`, [X`B`, X`A`, X`1`, X`0`], X`\(A\cdot\overline{A} = 0\), y \(0 + B = B\).`],
    [X`\overline{\overline{A}}\cdot(B + \overline{B})`, [X`A`, X`\overline{A}`, X`B`, X`0`], X`Doble negación \(\overline{\overline{A}} = A\) y \(B + \overline{B} = 1\): queda \(A\cdot 1 = A\).`],
    [X`A + \overline{A}`, [X`1`, X`0`, X`A`, X`\overline{A}`], X`Una variable o su negación siempre vale 1: \(A + \overline{A} = 1\).`]
  ];
  RP.BOOLE = BOOLE;
  E.n3 = ejOpciones({
    titulo: 'Simplifica con álgebra de Boole', n: 4,
    enunciado: 'Elige la expresión más simple que es igual a la dada. Hazlo primero en tu cuaderno.',
    items: (r) => II.mezclar(r, BOOLE).slice(0, 4).map((b) => ({ t: tex(b[0]) + ' es igual a…', o: b[1].map(tex), por: b[2] }))
  });

  // ============================================================
  // n4 · TTL: compuertas y chips 74xx que necesita un circuito
  // ============================================================
  E.n4 = ejOpciones({
    titulo: 'TTL: ¿cuántos chips necesitas?', n: 4,
    enunciado: 'Se arma con chips de 2 entradas: 7404 (6 NOT), 7408 (4 AND) y 7432 (4 OR).',
    items(r) {
      let pu;
      for (let t = 0; t < 300; t++) {
        const nt = 2 + Math.floor(r() * 3), out = [], vistos = new Set();
        while (out.length < nt) {
          const vars = II.mezclar(r, [0, 1, 2]).slice(0, 2).sort(), g = vars.map((v) => 2 * v + (r() < 0.35 ? 1 : 0)), id = g.join();
          if (!vistos.has(id)) { vistos.add(id); out.push(g); }
        }
        if (out.some((g) => g.some((c) => c & 1))) { pu = out; break; }
      }
      const neg = new Set(); pu.forEach((g) => g.forEach((c) => { if (c & 1) neg.add(c >> 1); }));
      const nNot = neg.size, nAnd = pu.length, nOr = pu.length - 1;
      const chips = (nNot ? 1 : 0) + Math.ceil(nAnd / 4) + Math.ceil(nOr / 4);
      const F = tex('Y = ' + sopTex(pu, N3));
      return [
        { t: F + ' ¿Cuántos inversores (NOT) hacen falta?', o: numOps(nNot, [pu.reduce((a, g) => a + g.filter((c) => c & 1).length, 0), nNot + 1, 0]),
          por: 'Un NOT por cada variable que aparece negada: ' + [...neg].map((i) => tex('\\overline{' + N3[i] + '}')).join('; ') + '. Si la misma variable negada se usa dos veces, se reutiliza el mismo NOT.' },
        { t: F + ' ¿Cuántas AND de 2 entradas?', o: numOps(nAnd, [nAnd - 1, nAnd + 1, 2 * nAnd]), por: 'Una AND por cada producto de 2 literales: ' + nAnd + '.' },
        { t: F + ' ¿Cuántas OR de 2 entradas?', o: numOps(nOr, [nAnd, nOr + 1, 0]), por: 'Para sumar ' + nAnd + ' términos con OR de 2 entradas se ponen en cascada: ' + nAnd + ' − 1 = ' + nOr + ' OR.' },
        { t: F + ' ¿Cuántos chips hacen falta en total?', o: numOps(chips, [nNot + nAnd + nOr, chips + 1, chips - 1]),
          por: (nNot ? '1 chip 7404 (trae 6 NOT); ' : '') + Math.ceil(nAnd / 4) + ' chip 7408 (trae 4 AND); ' + Math.ceil(nOr / 4) + ' chip 7432 (trae 4 OR). Se cuentan chips, no compuertas: total ' + chips + '.' }
      ];
    }
  });

  // ============================================================
  // n5 · De la función a la tabla de verdad (se llena)
  // ============================================================
  E.n5 = {
    titulo: 'De la función a la tabla', puntos: 4, medios: true, tipo: 'tabla',
    generar(r) { const s = sopAzar(r); return { pu: s.pu, f: s.f }; },
    resumen: (d) => 'Y = ' + sopTex(d.pu, N3),
    enunciado: (d) => '<p>Llena la tabla de verdad de</p><p class="rp-fx">' + tex('Y = ' + sopTex(d.pu, N3)) + '</p><p class="lbl">Toca cada fila para poner Y = 1 o 0 (empieza en «?»).</p>',
    montar(cont, d) {
      const t = Array(8).fill(null);
      let mov = 0;
      const t0 = Date.now(), oyentes = [];
      const caja = document.createElement('div');
      caja.innerHTML = '<div class="centro"><table class="tt tight tabla-y"></table></div>';
      cont.appendChild(caja);
      const T = caja.querySelector('table');
      const dib = () => {
        T.innerHTML = '<tr><th>A</th><th>B</th><th>C</th><th>Y</th></tr>' + t.map((v, m) => '<tr data-m="' + m + '">' + [4, 2, 1].map((b) => '<td>' + (m & b ? 1 : 0) + '</td>').join('') +
          '<td class="yc ' + (v == null ? 'unk' : v ? 'v1' : '') + '">' + (v == null ? '?' : v) + '</td></tr>').join('');
      };
      T.addEventListener('click', (e) => { const tr = e.target.closest('tr[data-m]'); if (!tr) return; const m = +tr.dataset.m; t[m] = t[m] === 1 ? 0 : 1; mov++; dib(); oyentes.forEach((fn) => fn()); });
      dib();
      return {
        estado: () => ({ tabla: t.slice() }),
        fijar(x) { if (x && x.tabla) x.tabla.forEach((v, m) => { t[m] = v; }); dib(); },
        movimientos: () => mov, segundos: () => Math.round((Date.now() - t0) / 1000),
        alCambiar: (fn) => oyentes.push(fn), destruir: () => caja.remove()
      };
    },
    evaluar(est, d) {
      const t = (est && est.tabla) || [];
      const bien = d.f.filter((v, m) => t[m] === v).length, nv = d.f.filter((_, m) => t[m] == null).length;
      const puntos = Math.round(4 * bien / 8 * 2) / 2;
      return { puntos, ok: bien === 8, valor: puntos, texto: 'Tabla: ' + bien + '/8 filas' + (nv ? '; ' + nv + (nv === 1 ? ' fila' : ' filas') + ' sin completar (cuentan como incorrectas)' : '') };
    },
    solucion(d) {
      const filas = (g) => { const ms = []; for (let m = 0; m < 8; m++) if (g.every((c) => ((((m >> (2 - (c >> 1))) & 1) ^ (c & 1)) === 1))) ms.push(bin(m, 3)); return ms; };
      return { html: '<div class="sol-dos"><div>' + tablaV(d.f) + '</div><div class="solucion">' +
        '<p>Cada término vale 1 en las filas donde todos sus literales valen 1 (variable sin barra = 1; con barra = 0):</p>' +
        d.pu.map((g) => '<p>' + tex(ordenar(g).map((c) => litTex(c, N3)).join('\\cdot ')) + ' → filas ABC = ' + filas(g).join('; ') + '</p>').join('') +
        '<p>Y = 1 en todas esas filas (la OR junta los términos) y 0 en las demás.</p></div></div>' };
    },
    vista(est, d) {
      const t = (est && est.tabla) || [], nv = d.f.filter((_, m) => t[m] == null).length;
      let h = '<table class="tt tight"><tr><th>A</th><th>B</th><th>C</th><th>Y</th></tr>';
      for (let m = 0; m < 8; m++) { const v = t[m]; h += '<tr>' + [4, 2, 1].map((b) => '<td>' + (m & b ? 1 : 0) + '</td>').join('') + '<td class="' + (v == null ? 'c5-q' : v !== d.f[m] ? 'c5-mal' : v ? 'v1' : '') + '">' + (v == null ? '?' : v) + '</td></tr>'; }
      return '<div class="centro">' + h + '</table></div>' + faltanTxt(nv, nv === 1 ? 'fila' : 'filas');
    }
  };

  // ============================================================
  // n6 · De la tabla a la función; n7 · de la función al circuito; n8 · de la tabla al circuito
  // ============================================================
  E.n6 = ejOpciones({
    titulo: 'De la tabla a la función', n: 2,
    enunciado: 'Pasa la tabla al mapa de Karnaugh en tu cuaderno, agrupa y elige la expresión mínima.',
    items(r) {
      return [0, 1].map(() => {
        const s = sopAzar(r), mi = minima(s.f), ds = distractores(r, mi, s.f, 3);
        const sol = K.resolver(3, s.f);
        return { t: '¿Qué expresión mínima corresponde a esta tabla?', fig: '<div class="rp-fig">' + tablaV(s.f) + '</div>',
          o: [mi].concat(ds).map((p) => tex('Y = ' + sopTex(p, N3))),
          sol: '<div class="rp-fig">' + K.estatico(3, s.f, { grupos: sol.cubos }) + '</div>',
          por: 'En el mapa, cada grupo de 2 celdas elimina 1 variable y cada grupo de 4 elimina 2. Las otras opciones dan 1 en filas donde la tabla tiene 0 (o al revés): compruébalo fila por fila.' };
      });
    }
  });
  E.n7 = ejOpciones({
    titulo: 'De la función al circuito', n: 2,
    enunciado: 'Cada AND hace un término; la OR los junta. Un círculo en la entrada (o una barra) es un NOT.',
    items(r) {
      return [0, 1].map(() => {
        const s = sopAzar(r), ds = distractores(r, s.pu, s.f, 3);
        return { t: '¿Qué circuito implementa ' + tex('Y = ' + sopTex(s.pu, N3)) + '?', svg: true, una: true,
          o: [s.pu].concat(ds).map((p) => circuito(p)),
          por: 'Se lee cada AND: qué variables le llegan y cuáles pasan por un NOT. El circuito correcto tiene exactamente los términos de la expresión.' };
      });
    }
  });
  E.n8 = ejOpciones({
    titulo: 'De la tabla al circuito', n: 2,
    enunciado: 'Tabla → mapa → expresión mínima → circuito. Usa el cuaderno.',
    items(r) {
      return [0, 1].map(() => {
        const s = sopAzar(r), mi = minima(s.f), ds = distractores(r, mi, s.f, 3);
        return { t: '¿Qué circuito cumple esta tabla?', fig: '<div class="rp-fig">' + tablaV(s.f) + '</div>', svg: true, una: true,
          o: [mi].concat(ds).map((p) => circuito(p)),
          sol: '<p class="rp-fx">' + tex('Y = ' + sopTex(mi, N3)) + '</p>',
          por: 'De la tabla se saca la expresión mínima con el mapa y después se dibuja: una AND por término y una OR que los junta.' };
      });
    }
  });

  // ============================================================
  // n9 · Aplicación interactiva: manipula la máquina, arma la tabla y diseña
  // ============================================================
  const MAQ = [
    { t: 'Ascensor', ic: '🛗', ctx: 'El motor del ascensor arranca cuando alguien pide un piso, pero por seguridad debe tener la puerta cerrada y no tener sobrepeso.',
      v: [['P', '🚪', 'Puerta cerrada'], ['S', '⚖️', 'Sobrepeso'], ['B', '🔘', 'Botón de piso presionado']], y: ['⚙️', 'Motor en marcha', 'Motor detenido'],
      f: (p, s, b) => p && !s && b, regla: 'El motor arranca si la puerta está cerrada, no hay sobrepeso y alguien presionó un piso.' },
    { t: 'Riego automático', ic: '🌱', ctx: 'Una bomba riega el jardín cuando el suelo está seco, siempre que no esté lloviendo y el tanque tenga agua.',
      v: [['H', '💧', 'Suelo húmedo'], ['L', '🌧️', 'Está lloviendo'], ['T', '🛢️', 'Tanque con agua']], y: ['🚿', 'Regando', 'Bomba apagada'],
      f: (h, l, t) => !h && !l && t, regla: 'Riega si el suelo NO está húmedo, NO llueve y el tanque tiene agua.' },
    { t: 'Horno de microondas', ic: '🍲', ctx: 'El magnetrón calienta solo con la puerta cerrada y el temporizador corriendo; el botón cancelar lo detiene.',
      v: [['P', '🚪', 'Puerta cerrada'], ['T', '⏱️', 'Temporizador corriendo'], ['C', '✋', 'Cancelar presionado']], y: ['🔥', 'Calentando', 'Apagado'],
      f: (p, t, c) => p && t && !c, regla: 'Calienta si la puerta está cerrada, el temporizador corre y NO se presiona cancelar.' },
    { t: 'Aviso del cinturón', ic: '🚗', ctx: 'Un auto avisa cuando el conductor no se abrochó el cinturón. Revisa también si importa que el auto se mueva.',
      v: [['L', '🔑', 'Llave puesta'], ['C', '🔒', 'Cinturón abrochado'], ['V', '🏁', 'Auto en movimiento']], y: ['🔔', 'Suena el aviso', 'Silencio'],
      f: (l, c) => l && !c, regla: 'Suena si la llave está puesta y el cinturón NO está abrochado. Que el auto se mueva no cambia nada: V no influye y desaparece al simplificar.' },
    { t: 'Ventilador de invernadero', ic: '🌿', ctx: 'El ventilador se enciende si hace calor. De día también se enciende si hay mucha humedad.',
      v: [['T', '🌡️', 'Temperatura alta'], ['H', '💦', 'Humedad alta'], ['N', '🌙', 'Es de noche']], y: ['🌀', 'Ventilando', 'Apagado'],
      f: (t, h, n) => t || (h && !n), regla: 'Se enciende si la temperatura es alta, o si hay humedad alta y NO es de noche.' },
    { t: 'Control de calidad', ic: '📦', ctx: 'En una cinta transportadora, un pistón expulsa la pieza que pasa por el sensor si tiene un defecto de tamaño o de color.',
      v: [['A', '📏', 'Tamaño correcto'], ['B', '🎨', 'Color correcto'], ['P', '📍', 'Hay pieza en el sensor']], y: ['🦾', 'Expulsa la pieza', 'Deja pasar'],
      f: (a, b, p) => p && (!a || !b), regla: 'Expulsa si hay pieza y el tamaño NO es correcto o el color NO es correcto.' },
    { t: 'Portón eléctrico', ic: '🏠', ctx: 'El motor abre el portón al presionar el control remoto, pero nunca si un sensor detecta un obstáculo o si el portón ya está abierto.',
      v: [['R', '📡', 'Control remoto presionado'], ['O', '🚧', 'Obstáculo detectado'], ['F', '🛑', 'Portón ya abierto (fin de carrera)']], y: ['↔️', 'Abriendo', 'Detenido'],
      f: (r, o, f) => r && !o && !f, regla: 'Abre si se presiona el remoto, NO hay obstáculo y el portón NO está ya abierto.' },
    { t: 'Luz del pasillo', ic: '💡', ctx: 'La luz del pasillo se enciende con el interruptor manual, o sola cuando detecta movimiento y está oscuro.',
      v: [['I', '🎚️', 'Interruptor manual'], ['M', '🚶', 'Movimiento detectado'], ['O', '🌑', 'Está oscuro']], y: ['💡', 'Encendida', 'Apagada'],
      f: (i, m, o) => i || (m && o), regla: 'Enciende si el interruptor está activado, o si hay movimiento y está oscuro.' },
    { t: 'Prensa con guarda', ic: '🏭', ctx: 'La prensa baja solo con las dos manos en los botones y con la guarda de seguridad cerrada.',
      v: [['I', '🤚', 'Botón izquierdo'], ['D', '✋', 'Botón derecho'], ['G', '🛡️', 'Guarda cerrada']], y: ['⬇️', 'Bajando', 'Arriba'],
      f: (i, d, g) => i && d && g, regla: 'Baja si se presionan los dos botones y la guarda está cerrada.' },
    { t: 'Tanque con alarma', ic: '🚨', ctx: 'Un tanque tiene sensor bajo y sensor alto. La alarma avisa si el tanque se vació o si los sensores dan una lectura imposible (agua arriba, pero no abajo).',
      v: [['B', '⬇️', 'Agua en el sensor bajo'], ['A', '⬆️', 'Agua en el sensor alto'], ['S', '🔇', 'Alarma silenciada']], y: ['🚨', 'Alarma sonando', 'Silencio'],
      f: (b, a, s) => !s && !b, regla: 'Suena si NO está silenciada y el agua NO llega al sensor bajo (tanque vacío o lectura imposible). El sensor alto no influye: si B = 0 ya suena, haya o no agua arriba.' },
    { t: 'Votación de 3 sensores', ic: '🧯', ctx: 'Tres detectores de gas: para evitar falsas alarmas, la válvula se cierra cuando al menos dos de los tres detectan gas.',
      v: [['A', '📟', 'Detector A'], ['B', '📟', 'Detector B'], ['C', '📟', 'Detector C']], y: ['🔒', 'Válvula cerrada', 'Válvula abierta'],
      f: (a, b, c) => (a && b) || (a && c) || (b && c), regla: 'Se cierra si al menos dos detectores se activan: votación «2 de 3».' }
  ];
  RP.MAQ = MAQ;
  E.n9 = {
    titulo: 'Aplicación: descubre la máquina', puntos: 4, medios: true, tipo: 'diseno',
    generar(r) {
      const k = Math.floor(r() * MAQ.length), M = MAQ[k];
      const f = Array.from({ length: 8 }, (_, m) => (M.f(!!(m & 4), !!(m & 2), !!(m & 1)) ? 1 : 0));
      return { nv: 3, k, f, nombres: M.v.map((x) => x[0]) };
    },
    resumen: (d) => MAQ[d.k].t,
    enunciado: (d) => { const M = MAQ[d.k]; return '<p><b>' + M.ic + ' ' + M.t + '.</b> ' + M.ctx + '</p><p class="lbl">Manipula la máquina y anota en tu tabla qué pasa con cada combinación. Después agrupa en el mapa.</p>'; },
    montar(cont, d) {
      const M = MAQ[d.k], v = [0, 0, 0];
      const maq = document.createElement('div');
      maq.className = 'rp-maq';
      cont.appendChild(maq);
      const sub = document.createElement('div');
      cont.appendChild(sub);
      const ctrl = E.p7.montar(sub, d);
      const m = () => v[0] * 4 + v[1] * 2 + v[2];
      function marcar() { sub.querySelectorAll('tr[data-m]').forEach((tr) => tr.classList.toggle('hl', +tr.dataset.m === m())); }
      function dib() {
        const y = d.f[m()];
        maq.innerHTML = '<div class="rp-maq-ent">' + M.v.map((x, i) => '<button class="rp-sw' + (v[i] ? ' on' : '') + '" data-i="' + i + '"><span class="ic">' + x[1] + '</span><b>' + x[0] + ' = ' + v[i] + '</b><small>' + x[2] + '</small></button>').join('') + '</div>' +
          '<div class="rp-maq-sal' + (y ? ' on' : '') + '"><span class="ic">' + M.y[0] + '</span><div><b>Y = ' + y + '</b><small>' + (y ? M.y[1] : M.y[2]) + '</small></div></div>';
        marcar();
      }
      maq.addEventListener('click', (e) => { const b = e.target.closest('.rp-sw'); if (!b) return; v[+b.dataset.i] ^= 1; dib(); });
      ctrl.alCambiar(() => setTimeout(marcar, 0));
      dib();
      return Object.assign({}, ctrl, { destruir: () => { ctrl.destruir(); maq.remove(); sub.remove(); } });
    },
    evaluar: (est, d) => E.p7.evaluar(est, d),
    solucion(d) {
      const M = MAQ[d.k];
      return { html: '<p class="rp-por"><b>La regla de la máquina:</b> ' + M.regla + '</p>' + E.p7.solucion(d).html };
    },
    vista: (est, d) => E.p7.vista(est, d)
  };

  // ============================================================
  // n10 · XOR y paridad (opciones)
  // ============================================================
  const xorDe = (s) => s.split('').reduce((a, c) => a ^ +c, 0);
  const unosDe = (s) => s.split('').filter((c) => c === '1').length;
  E.n10 = ejOpciones({
    titulo: 'XOR y paridad', n: 4,
    items(r) {
      const dato = (n) => Array.from({ length: n }, () => (r() < 0.5 ? '1' : '0')).join('');
      const its = [];
      // 1) XOR de varios bits
      const s1 = dato(5), x = xorDe(s1);
      its.push({ t: 'Calcula ' + tex(s1.split('').join(' \\oplus ')), o: [String(x), String(1 - x), 'No se puede calcular', 'Depende del primer bit'],
        por: 'La XOR de varios bits vale 1 si la cantidad de unos es impar. Aquí hay ' + unosDe(s1) + ' unos → ' + x + '.' });
      // 2) bit de paridad par o impar
      const par = r() < 0.6, s2 = dato(8), u2 = unosDe(s2), P = par ? u2 % 2 : 1 - (u2 % 2);
      its.push({ t: 'Paridad <b>' + (par ? 'par' : 'impar') + '</b>. ¿Qué bit de paridad P se agrega al dato ' + bits(s2) + '?', o: [String(P), String(1 - P), 'Depende del primer bit', String(u2) === '0' || String(u2) === '1' ? 'Igual al último bit' : String(u2)],
        por: 'El dato tiene ' + u2 + ' unos. Con paridad ' + (par ? 'par' : 'impar') + ', el total contando P debe ser ' + (par ? 'par' : 'impar') + ': P = ' + P + '.' });
      // 3) comprobador con 0, 1 o 2 errores
      const s3 = dato(7), P3 = xorDe(s3), envio = s3 + P3, nErr = II.elegir(r, [0, 1, 1, 2]);
      let llega = envio.split('');
      II.mezclar(r, [0, 1, 2, 3, 4, 5, 6, 7]).slice(0, nErr).forEach((i) => { llega[i] = llega[i] === '1' ? '0' : '1'; });
      llega = llega.join('');
      const E3 = xorDe(llega);
      its.push({ t: 'Paridad par. Llegó el dato ' + bits(llega.slice(0, 7)) + ' con P = ' + llega[7] + '. ¿Qué dice el comprobador?', una: true,
        o: E3 ? ['E = 1: detecta un error', 'E = 0: llegó bien', 'E = 1 y dice qué bit falló', 'No se puede saber'] : ['E = 0: no detecta error', 'E = 1: detecta un error', 'E = 1 y dice qué bit falló', 'No se puede saber'],
        por: 'E es la XOR de todo lo recibido (datos y P). Llegaron ' + unosDe(llega) + ' unos → E = ' + E3 + '.' + (nErr === 2 ? ' En realidad fallaron 2 bits: dos errores se tapan y la paridad no los detecta.' : nErr === 1 ? ' En realidad falló 1 bit.' : ' Llegó tal como se envió.') });
      // 4) concepto
      const k = Math.floor(r() * 3);
      its.push([
        { t: 'Con un solo bit de paridad, ¿qué errores detecta el receptor?', una: true, o: ['Una cantidad impar de bits dañados', 'Cualquier cantidad de bits dañados', 'Solo cuando fallan 2 bits', 'Ninguno: solo los corrige'], por: 'Cada bit dañado cambia la paridad: con 1 o 3 errores E = 1; con 2 o 4 los cambios se tapan y E = 0.' },
        { t: '¿Cuánto vale ' + tex('A \\oplus 1') + '?', o: [tex('\\overline{A}'), tex('A'), tex('1'), tex('0')], por: X`\(A \oplus 1 = \overline{A}\) y \(A \oplus 0 = A\): la XOR es un inversor controlado.` },
        { t: 'Paridad de 8 bits armada en árbol: ¿cuántas XOR de 2 entradas y cuántos niveles?', una: true, o: ['7 XOR y 3 niveles', '8 XOR y 3 niveles', '7 XOR y 7 niveles', '4 XOR y 2 niveles'], por: 'Siempre hacen falta n − 1 = 7 XOR. En árbol se juntan de a pares: 4, luego 2, luego 1, que son 3 niveles.' }
      ][k]);
      return its;
    }
  });
})();
