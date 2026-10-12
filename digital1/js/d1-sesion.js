// ============================================================
// Electrónica Digital 1 — clase en vivo «Karnaugh y aplicaciones» (d1-c3)
//   D1.SESIONES[id] = { id, materia, titulo, grupos, pasos }
//   Tipos de paso: inicio · explica · rapida · ejercicio · cierre
//   Pregunta rápida: { id, tipo:'rapida', t, o:[…], c, por, fig? } → 1 punto
//   D1.EJERCICIOS[id]: titulo, puntos, tv, generar(r), enunciado(d), montar(cont, d),
//                      evaluar(est, d), solucion(d), vista(est, d), resumen(d)
//   Los datos de cada ejercicio salen del carnet: II.rng(carnet + '|' + ejercicio)
// ============================================================
(function () {
  const D1 = (window.D1 = window.D1 || {});
  const K = D1.k;
  const esc = (s) => (window.II ? II.esc(s) : String(s));
  D1.SESIONES = D1.SESIONES || {};
  D1.CARNET_EJEMPLO = '7351204';

  // ---------- piezas comunes de los ejercicios de mapas ----------
  function evaluarMapa(est, d) {
    const nv = d.nv, f = d.f;
    const vals = (est && est.vals) || [];
    const grupos = (est && est.grupos) || [];
    const llenoOK = f.every((v, m) => vals[m] === v);
    const funcOK = grupos.length > 0 && K.equivale(nv, grupos, f);
    const opt = K.resolver(nv, f);
    const minOK = funcOK && grupos.length === opt.cubos.length && K.lits(grupos) === opt.lits;
    const puntos = (llenoOK ? 1 : 0) + (funcOK ? 2 : 0) + (minOK ? 1 : 0);
    const t = (ok, s) => (ok ? '✓ ' : '✗ ') + s;
    return {
      puntos, ok: puntos === 4, valor: puntos,
      texto: [t(llenoOK, 'mapa'), t(funcOK, 'expresión correcta'), t(minOK, 'expresión mínima')].join(' · ')
    };
  }
  function solucionMapa(d, nombres, salida) {
    const opt = K.resolver(d.nv, d.f);
    return {
      html: '<div class="sol-mapa">' + K.estatico(d.nv, d.f, { nombres, grupos: opt.cubos }) +
        '<p class="expr">' + (salida || 'Y') + ' = ' + K.expr(opt.cubos, d.nv, nombres, true) + '</p>' +
        '<p class="lbl">' + opt.cubos.length + (opt.cubos.length === 1 ? ' grupo · ' : ' grupos · ') + opt.lits + ' literales</p></div>'
    };
  }
  function vistaMapa(est, d, nombres, salida) {
    const vals = (est && est.vals) || Array(1 << d.nv).fill(0);
    const grupos = (est && est.grupos) || [];
    return '<div class="sol-mapa">' + K.estatico(d.nv, vals, { nombres, grupos, cls: (m) => (vals[m] !== d.f[m] ? 'mal' : '') }) +
      '<p class="expr">' + (salida || 'Y') + ' = ' + (grupos.length ? K.expr(grupos, d.nv, nombres, true) : '—') + '</p></div>';
  }

  const E = (D1.EJERCICIOS = {});

  // ---------- E1: tabla → mapa de 3 variables ----------
  E.e1 = {
    titulo: 'Tu mapa de 3 variables', puntos: 4, tipo: 'mapa',
    tv: 'Cada uno tiene <b>una tabla distinta</b> en su celular: pásala al mapa, agrupa y obtén la expresión mínima.',
    generar(r) {
      let f, n, sol;
      do {
        f = Array.from({ length: 8 }, () => (r() < 0.5 ? 1 : 0));
        n = f.filter((x) => x === 1).length;
        sol = n ? K.resolver(3, f) : null;
      } while (n < 3 || n > 5 || sol.cubos.length < 2);
      return { nv: 3, f };
    },
    resumen: (d) => 'Σm(' + K.minterminos(d.f).join(', ') + ')',
    enunciado: (d) => '<p>Pasa esta tabla al mapa, agrupa los unos y obtén la <b>expresión mínima</b>.</p><div class="centro">' + K.tablaHTML(3, d.f) + '</div>',
    montar: (cont, d) => K.editor(cont, { nv: 3 }),
    evaluar: evaluarMapa,
    solucion: (d) => solucionMapa(d),
    vista: (est, d) => vistaMapa(est, d)
  };

  // ---------- E4: un segmento del display (4 variables con X) ----------
  E.e4 = {
    titulo: 'Tu segmento del display', puntos: 4, tipo: 'mapa',
    tv: 'Cada uno diseña <b>un segmento distinto</b>: llena el mapa (10 a 15 son X), agrupa y obtén la expresión.',
    generar(r) { const s = II.elegir(r, ['a', 'b', 'c', 'd', 'e', 'f', 'g']); return { nv: 4, s, f: D1.seg.funcion(s) }; },
    resumen: (d) => 'segmento ' + d.s,
    enunciado: (d) =>
      '<div class="seg-tuyo">' + D1.seg.svg(null, { apagado: true, resaltar: d.s, letras: true }) +
      '<p>Tu segmento es el <b class="k">' + d.s + '</b>. Mira los dígitos: ¿en cuáles se enciende?</p></div>' +
      '<div class="digitos">' + Array.from({ length: 10 }, (_, k) => '<figure>' + D1.seg.svg(k) + '<figcaption>' + k + '</figcaption></figure>').join('') + '</div>' +
      '<p>Pon <b>1</b> donde se enciende, <b>0</b> donde no y <b>X</b> en 10 a 15. Luego agrupa (las X te pueden ayudar).</p>',
    montar: (cont, d) => K.editor(cont, { nv: 4, conX: true, salida: d.s }),
    evaluar: evaluarMapa,
    solucion: (d) => solucionMapa(d, null, d.s),
    vista: (est, d) => vistaMapa(est, d, null, d.s)
  };

  // ---------- E2: diseño completo (enunciado → tabla → mapa → expresión) ----------
  const PROBLEMAS = [
    { t: 'Alarma de un depósito', v: [['A', 'alarma armada'], ['P', 'puerta abierta'], ['V', 'ventana abierta']],
      txt: 'Suena si la alarma está armada y está abierta la puerta o la ventana.', f: (a, p, v) => a && (p || v) },
    { t: 'Luz de pasillo', v: [['I', 'interruptor presionado'], ['M', 'hay movimiento'], ['D', 'es de día']],
      txt: 'Se enciende si alguien presiona el interruptor, o si hay movimiento y es de noche.', f: (i, m, d) => i || (m && !d) },
    { t: 'Riego de un jardín', v: [['H', 'suelo húmedo'], ['D', 'es de día'], ['T', 'hay agua en el tanque']],
      txt: 'Se riega si el suelo está seco, es de noche y hay agua en el tanque.', f: (h, d, t) => !h && !d && t },
    { t: 'Ventilador de un servidor', v: [['T', 'temperatura alta'], ['E', 'equipo encendido'], ['S', 'modo silencio']],
      txt: 'Funciona si la temperatura es alta, o si el equipo está encendido y no está en modo silencio.', f: (t, e, s) => t || (e && !s) },
    { t: 'Luz roja de una máquina', v: [['M', 'máquina en marcha'], ['G', 'guarda abierta'], ['P', 'paro presionado']],
      txt: 'Se enciende si la máquina está en marcha y además la guarda está abierta o se presionó el paro.', f: (m, g, p) => m && (g || p) },
    { t: 'Votación con presidente', v: [['P', 'vota el presidente'], ['A', 'vota el juez A'], ['B', 'vota el juez B']],
      txt: 'Se aprueba con al menos dos votos a favor, pero nunca sin el voto del presidente.', f: (p, a, b) => p && (a || b) },
    { t: 'Sensores redundantes', v: [['X', 'sensor 1 detecta'], ['Y', 'sensor 2 detecta'], ['Z', 'sensor 3 detecta']],
      txt: 'Tres sensores miden lo mismo. La alarma de falla suena si los tres no coinciden.', f: (x, y, z) => !((x && y && z) || (!x && !y && !z)) },
    { t: 'Portón automático', v: [['C', 'control presionado'], ['O', 'hay un obstáculo'], ['F', 'portón ya abierto (fin de carrera)']],
      txt: 'El motor abre si se presiona el control, no hay obstáculo y el portón todavía no está abierto.', f: (c, o, f) => c && !o && !f }
  ];
  D1.PROBLEMAS = PROBLEMAS;
  E.e2 = {
    titulo: 'Diseño completo', puntos: 4, tipo: 'diseno',
    tv: 'Cada uno tiene <b>un problema distinto</b>: tabla de verdad → mapa → expresión mínima.',
    generar(r) {
      const k = Math.floor(r() * PROBLEMAS.length), P = PROBLEMAS[k];
      const f = Array.from({ length: 8 }, (_, m) => (P.f(!!(m & 4), !!(m & 2), !!(m & 1)) ? 1 : 0));
      return { nv: 3, k, f, nombres: P.v.map((x) => x[0]) };
    },
    resumen: (d) => PROBLEMAS[d.k].t,
    enunciado: (d) => {
      const P = PROBLEMAS[d.k];
      return '<div class="problema"><b>' + esc(P.t) + '.</b> ' + esc(P.txt) + '<ul>' + P.v.map((x) => '<li><b>' + x[0] + '</b> = 1 si ' + esc(x[1]) + '</li>').join('') + '<li><b>Y</b> = 1 si se cumple</li></ul></div>';
    },
    montar(cont, d) {
      const tabla = Array(8).fill(null);
      let mov = 0;
      const t0 = Date.now(), oyentes = [];
      const caja = document.createElement('div');
      caja.innerHTML = '<p class="paso-t"><b>1.</b> Toca cada fila para poner Y = 1 o 0:</p><div class="centro"><table class="tt tight tabla-y"></table></div>' +
        '<p class="paso-t"><b>2.</b> El mapa se llena con tu tabla. Agrupa:</p><div class="zona-ed"></div>';
      cont.appendChild(caja);
      const T = caja.querySelector('table');
      const ed = K.editor(caja.querySelector('.zona-ed'), { nv: 3, nombres: d.nombres, fijo: true });
      const valores = () => tabla.map((x) => (x === 1 ? 1 : 0));
      function dibujarTabla() {
        let h = '<tr>' + d.nombres.map((x) => '<th>' + x + '</th>').join('') + '<th>Y</th></tr>';
        for (let m = 0; m < 8; m++) h += '<tr data-m="' + m + '">' + [4, 2, 1].map((b) => '<td>' + (m & b ? 1 : 0) + '</td>').join('') +
          '<td class="yc ' + (tabla[m] === null ? 'unk' : tabla[m] ? 'v1' : '') + '">' + (tabla[m] === null ? '?' : tabla[m]) + '</td></tr>';
        T.innerHTML = h;
      }
      T.addEventListener('click', (e) => {
        const tr = e.target.closest('tr[data-m]');
        if (!tr) return;
        const m = +tr.dataset.m;
        tabla[m] = tabla[m] === 1 ? 0 : 1;
        mov++;
        dibujarTabla();
        ed.fijarValores(valores());
        oyentes.forEach((fn) => fn());
      });
      ed.alCambiar(() => { mov++; oyentes.forEach((fn) => fn()); });
      dibujarTabla();
      ed.fijarValores(valores());
      return {
        estado: () => ({ tabla: tabla.slice(), vals: valores(), grupos: ed.estado().grupos }),
        fijar(e) {
          if (!e) return;
          if (e.tabla) e.tabla.forEach((v, m) => { tabla[m] = v; });
          dibujarTabla(); ed.fijarValores(valores());
          if (e.grupos) ed.fijar({ grupos: e.grupos });
        },
        movimientos: () => mov,
        segundos: () => Math.round((Date.now() - t0) / 1000),
        alCambiar: (fn) => oyentes.push(fn),
        destruir: () => { ed.destruir(); caja.remove(); }
      };
    },
    evaluar(est, d) {
      const tabla = (est && est.tabla) || [];
      const bien = d.f.filter((v, m) => tabla[m] === v).length;
      const ptsTabla = Math.round((2 * bien / 8) * 2) / 2;
      const grupos = (est && est.grupos) || [];
      const funcOK = grupos.length > 0 && K.equivale(3, grupos, d.f);
      const opt = K.resolver(3, d.f);
      const minOK = funcOK && grupos.length === opt.cubos.length && K.lits(grupos) === opt.lits;
      const puntos = ptsTabla + (funcOK ? 1 : 0) + (minOK ? 1 : 0);
      return {
        puntos, ok: puntos === 4, valor: puntos,
        texto: 'Tabla: ' + bien + '/8 filas · ' + (funcOK ? '✓' : '✗') + ' expresión correcta · ' + (minOK ? '✓' : '✗') + ' mínima'
      };
    },
    solucion(d) {
      const s = solucionMapa(d, d.nombres);
      return { html: '<div class="sol-dos"><div>' + K.tablaHTML(3, d.f, { nombres: d.nombres }) + '</div>' + s.html + '</div>' };
    },
    vista(est, d) {
      const tabla = (est && est.tabla) || [];
      const ft = tabla.map((x) => (x === null || x === undefined ? 0 : x));
      return '<div class="sol-dos"><div>' + K.tablaHTML(3, ft, { nombres: d.nombres }) + '</div>' +
        vistaMapa({ vals: ft, grupos: (est && est.grupos) || [] }, { nv: 3, f: ft }, d.nombres) + '</div>';
    }
  };

  // ---------- E5: problema común para todos (tabla → mapa → circuito) ----------
  const INC = {
    t: 'Alarma de incendio «2 de 3»',
    txt: 'La sirena suena si alguien presiona el pulsador manual, o si al menos dos de los tres detectores se activan. Un solo detector puede ser una falsa alarma (polvo, vapor de la cocina).',
    v: [['P', 'alguien presiona el pulsador manual'], ['A', 'el detector de humo A se activa'], ['B', 'el detector de humo B se activa'], ['T', 'el detector de temperatura se activa']],
    f: (p, a, b, t) => p || (a && b) || (a && t) || (b && t)
  };
  E.e5 = {
    titulo: 'Alarma de incendio', puntos: 6, tipo: 'diseno', comun: true,
    tv: '<b>' + INC.t + '.</b> ' + INC.txt + '<br><span class="vars">' + INC.v.map((x) => '<b>' + x[0] + '</b> = ' + x[1]).join(' · ') + ' · <b>F</b> = sirena</span>',
    generar() {
      const f = Array.from({ length: 16 }, (_, m) => (INC.f(!!(m & 8), !!(m & 4), !!(m & 2), !!(m & 1)) ? 1 : 0));
      return { nv: 4, f, nombres: INC.v.map((x) => x[0]) };
    },
    resumen: () => INC.t,
    enunciado: () => '<div class="problema"><b>' + esc(INC.t) + '.</b> ' + esc(INC.txt) + '<ul>' +
      INC.v.map((x) => '<li><b>' + x[0] + '</b> = 1 si ' + esc(x[1]) + '</li>').join('') + '<li><b>F</b> = 1 si suena la sirena</li></ul>' +
      '<p class="lbl" style="margin:6px 0 0">Haz los tres pasos: <b>1</b> tabla · <b>2</b> mapa · <b>3</b> circuito.</p></div>',
    montar(cont, d) {
      const N = 16, n = d.nombres;
      const tabla = Array(N).fill(null);
      let puertas = [[]], tab = 0, mov = 0;
      const t0 = Date.now(), oyentes = [];
      const caja = document.createElement('div');
      caja.className = 'e5';
      caja.innerHTML = '<div class="e5-tabs"><button data-t="0">1 · Tabla</button><button data-t="1">2 · Mapa</button><button data-t="2">3 · Circuito</button></div>' +
        '<div class="e5-p" data-p="0"><p class="paso-t">Toca cada fila para poner F = 1 o 0:</p><div class="centro"><table class="tt tight tabla-y"></table></div>' +
        '<button class="boton bloque e5-sig" data-ir="1">Siguiente: el mapa →</button></div>' +
        '<div class="e5-p" data-p="1"><p class="paso-t">El mapa se llena con tu tabla. Forma los grupos:</p><div class="zona-ed"></div>' +
        '<button class="boton bloque e5-sig" data-ir="2">Siguiente: el circuito →</button></div>' +
        '<div class="e5-p" data-p="2"><p class="paso-t">Tu expresión del mapa: <b class="e5-mia"></b></p>' +
        '<p class="lbl">Arma el circuito: en cada compuerta AND toca las entradas que llegan. Una compuerta con una sola entrada es un cable directo a la OR.</p>' +
        '<div class="e5-circ"></div><div class="e5-puertas"></div>' +
        '<button class="boton bloque" data-a="mas">+ Agregar compuerta AND</button><p class="e5-cuenta lbl"></p></div>';
      cont.appendChild(caja);
      const q = (x) => caja.querySelector(x);
      const T = q('table');
      const ed = K.editor(q('.zona-ed'), { nv: 4, nombres: n, fijo: true, salida: 'F' });
      const valores = () => tabla.map((x) => (x === 1 ? 1 : 0));
      const avisar = () => { mov++; oyentes.forEach((fn) => fn()); };
      function dibujarTabla() {
        let h = '<tr>' + n.map((x) => '<th>' + x + '</th>').join('') + '<th>F</th></tr>';
        for (let m = 0; m < N; m++) h += '<tr data-m="' + m + '">' + [8, 4, 2, 1].map((b) => '<td>' + (m & b ? 1 : 0) + '</td>').join('') +
          '<td class="yc ' + (tabla[m] === null ? 'unk' : tabla[m] ? 'v1' : '') + '">' + (tabla[m] === null ? '?' : tabla[m]) + '</td></tr>';
        T.innerHTML = h;
      }
      function dibujarCirc() {
        const gr = ed.estado().grupos;
        q('.e5-mia').innerHTML = gr.length ? 'F = ' + K.expr(gr, 4, n, false) : '(todavía sin grupos)';
        q('.e5-circ').innerHTML = D1.circ.svg(4, puertas, n);
        q('.e5-puertas').innerHTML = puertas.map((g, k) => '<div class="e5-and" data-g="' + k + '"><span class="e5-n" style="color:' + K.GC[k % 8] + '">AND ' + (k + 1) + '</span><div class="e5-chips">' +
          [0, 1, 2, 3].map((i) => [0, 1].map((ng) => { const c = 2 * i + ng; return '<button class="e5-chip' + (g.includes(c) ? ' on' : '') + '" data-c="' + c + '">' + (ng ? '<span class="ov">' + n[i] + '</span>' : n[i]) + '</button>'; }).join('')).join('') +
          '</div><button class="e5-x" data-x="' + k + '" aria-label="Quitar">✕</button></div>').join('');
        const c = D1.circ.cuenta(puertas);
        q('.e5-cuenta').innerHTML = 'Tu circuito: <b>F = ' + D1.circ.expr(puertas, n, true) + '</b><br>' + c.not + ' NOT · ' + c.and + ' AND · ' + c.or + ' OR';
      }
      function marcar() {
        const hecho = [tabla.every((x) => x !== null), ed.estado().grupos.length > 0, puertas.some((g) => g.length)];
        caja.querySelectorAll('.e5-tabs button').forEach((b) => { const t = +b.dataset.t; b.classList.toggle('on', t === tab); b.classList.toggle('hecho', hecho[t]); });
        caja.querySelectorAll('.e5-p').forEach((x) => { x.hidden = +x.dataset.p !== tab; });
      }
      function ir(t) { tab = t; if (t === 2) dibujarCirc(); marcar(); window.scrollTo({ top: Math.max(0, caja.getBoundingClientRect().top + window.scrollY - 70), behavior: 'smooth' }); }
      caja.addEventListener('click', (e) => {
        const tb = e.target.closest('.e5-tabs [data-t]'); if (tb) { ir(+tb.dataset.t); return; }
        const sg = e.target.closest('[data-ir]'); if (sg) { ir(+sg.dataset.ir); return; }
        const tr = e.target.closest('tr[data-m]');
        if (tr && T.contains(tr)) { const m = +tr.dataset.m; tabla[m] = tabla[m] === 1 ? 0 : 1; dibujarTabla(); ed.fijarValores(valores()); marcar(); avisar(); return; }
        const ch = e.target.closest('.e5-chip');
        if (ch) {
          const k = +ch.closest('.e5-and').dataset.g, c = +ch.dataset.c, g = puertas[k];
          const i = g.indexOf(c); if (i >= 0) g.splice(i, 1); else g.push(c);
          dibujarCirc(); marcar(); avisar(); return;
        }
        const x = e.target.closest('.e5-x');
        if (x) { puertas.splice(+x.dataset.x, 1); if (!puertas.length) puertas.push([]); dibujarCirc(); marcar(); avisar(); return; }
        if (e.target.closest('[data-a="mas"]')) { if (puertas.length < 8) puertas.push([]); dibujarCirc(); marcar(); avisar(); }
      });
      ed.alCambiar(() => { marcar(); avisar(); });
      dibujarTabla(); ed.fijarValores(valores()); dibujarCirc(); marcar();
      return {
        estado: () => ({ tabla: tabla.slice(), vals: valores(), grupos: ed.estado().grupos, puertas: puertas.map((g) => g.slice()) }),
        fijar(e) {
          if (!e) return;
          if (e.tabla) e.tabla.forEach((v, m) => { tabla[m] = v; });
          dibujarTabla(); ed.fijarValores(valores());
          if (e.grupos) ed.fijar({ grupos: e.grupos });
          if (e.puertas && e.puertas.length) puertas = e.puertas.map((g) => g.slice());
          dibujarCirc(); marcar();
        },
        movimientos: () => mov,
        segundos: () => Math.round((Date.now() - t0) / 1000),
        alCambiar: (fn) => oyentes.push(fn),
        destruir: () => { ed.destruir(); caja.remove(); }
      };
    },
    evaluar(est, d) {
      const tabla = (est && est.tabla) || [];
      const bien = d.f.filter((v, m) => tabla[m] === v).length;
      const ptsTabla = Math.round((2 * bien / 16) * 2) / 2;
      const grupos = (est && est.grupos) || [];
      const funcOK = grupos.length > 0 && K.equivale(4, grupos, d.f);
      const opt = K.resolver(4, d.f);
      const minOK = funcOK && grupos.length === opt.cubos.length && K.lits(grupos) === opt.lits;
      const puertas = ((est && est.puertas) || []).filter((g) => g.length);
      const fc = D1.circ.funcion(4, puertas);
      const circOK = puertas.length > 0 && fc.every((v, m) => v === d.f[m]);
      const suya = tabla.map((x) => (x === 1 ? 1 : 0));
      const circSuyo = !circOK && puertas.length > 0 && grupos.length > 0 && fc.every((v, m) => v === K.evaluar(4, grupos)[m]);
      const ptsCirc = circOK ? 2 : circSuyo ? 1 : 0;
      const puntos = ptsTabla + (funcOK ? 1 : 0) + (minOK ? 1 : 0) + ptsCirc;
      return {
        puntos, ok: puntos === 6, valor: puntos, suya,
        texto: 'Tabla: ' + bien + '/16 filas · ' + (funcOK ? '✓' : '✗') + ' expresión correcta · ' + (minOK ? '✓' : '✗') + ' mínima · ' +
          (circOK ? '✓ circuito correcto' : circSuyo ? '½ circuito igual a tu mapa (pero el mapa tiene errores)' : '✗ circuito')
      };
    },
    solucion(d) {
      const opt = K.resolver(4, d.f), pu = D1.circ.deCubos(4, opt.cubos), c = D1.circ.cuenta(pu);
      return {
        html: '<div class="sol-dos e5-sol"><div class="solo-cel">' + K.tablaHTML(4, d.f, { nombres: d.nombres, salida: 'F' }) + '</div>' +
          '<div class="sol-mapa">' + K.estatico(4, d.f, { nombres: d.nombres, grupos: opt.cubos }) +
          '<p class="expr">F = ' + K.expr(opt.cubos, 4, d.nombres, true) + '</p></div>' +
          '<div class="sol-circ">' + D1.circ.svg(4, pu, d.nombres) + '<p class="lbl">' + c.not + ' NOT · ' + c.and + ' AND · ' + c.or + ' OR de ' + pu.length + ' entradas</p></div></div>'
      };
    },
    vista(est, d) {
      const tabla = (est && est.tabla) || [];
      const ft = tabla.map((x) => (x === null || x === undefined ? 0 : x));
      while (ft.length < 16) ft.push(0);
      const grupos = (est && est.grupos) || [], pu = (est && est.puertas) || [];
      return '<div class="sol-dos e5-sol"><div class="solo-cel">' + K.tablaHTML(4, ft, { nombres: d.nombres, salida: 'F' }) + '</div>' +
        '<div class="sol-mapa">' + K.estatico(4, ft, { nombres: d.nombres, grupos, cls: (m) => (ft[m] !== d.f[m] ? 'mal' : '') }) +
        '<p class="expr">F = ' + (grupos.length ? K.expr(grupos, 4, d.nombres, true) : '—') + '</p></div>' +
        '<div class="sol-circ">' + (pu.some((g) => g.length) ? D1.circ.svg(4, pu, d.nombres) + '<p class="expr">F = ' + D1.circ.expr(pu, d.nombres, true) + '</p>' : '<p class="lbl">No armó el circuito.</p>') + '</div></div>';
    }
  };

  // ================= PRÁCTICA (pestaña 9): del circuito a la función =================
  const N3 = ['A', 'B', 'C'], N4 = ['A', 'B', 'C', 'D'];
  const medio = (x) => Math.round(x * 2) / 2;
  const opcionesHTML = (lista, per, elegida) => '<div class="opciones-est">' + per.map((k, i) =>
    '<button class="opcion-est' + (elegida === k ? ' elegida' : '') + '" data-k="' + k + '"><span class="letra">' + 'ABCD'[i] + '</span><span>' + lista[k] + '</span></button>').join('') + '</div>';
  // tabla de verdad para tocar: cada toque alterna 1 / 0
  function tablaTocar(cont, nv, n, salida, alCambiar) {
    const N = 1 << nv, t = Array(N).fill(null);
    const box = document.createElement('div');
    box.className = 'centro';
    box.innerHTML = '<table class="tt tight tabla-y"></table>';
    cont.appendChild(box);
    const T = box.querySelector('table');
    function pintar() {
      let h = '<tr>' + n.map((x) => '<th>' + x + '</th>').join('') + '<th>' + salida + '</th></tr>';
      for (let m = 0; m < N; m++) h += '<tr data-m="' + m + '">' + n.map((_, i) => '<td>' + ((m >> (nv - 1 - i)) & 1) + '</td>').join('') +
        '<td class="yc ' + (t[m] === null ? 'unk' : t[m] ? 'v1' : '') + '">' + (t[m] === null ? '?' : t[m]) + '</td></tr>';
      T.innerHTML = h;
    }
    T.addEventListener('click', (e) => { const tr = e.target.closest('tr[data-m]'); if (!tr) return; const m = +tr.dataset.m; t[m] = t[m] === 1 ? 0 : 1; pintar(); alCambiar(); });
    pintar();
    return { t, pintar, fijar(v) { (v || []).forEach((x, m) => { t[m] = x; }); pintar(); } };
  }
  const FORMAS = {
    sop: { t1: 'and', t2: 'or', nombre: 'AND → OR' },
    pos: { t1: 'or', t2: 'and', nombre: 'OR → AND' },
    nand: { t1: 'nand', t2: 'nand', nombre: 'NAND → NAND' }
  };
  const igualF = (a, b) => a.every((x, m) => x === b[m]);

  // ---------- P1 (e6): del circuito a la tabla y a la expresión ----------
  E.e6 = {
    titulo: 'Del circuito a la función', puntos: 3, tipo: 'analisis',
    tv: 'Cada uno tiene <b>un circuito distinto</b> en su celular: llena su tabla de verdad y elige su expresión.',
    generar(r) {
      for (let intento = 0; intento < 400; intento++) {
        const forma = II.elegir(r, ['sop', 'pos', 'nand']), F = FORMAS[forma];
        const term = (permitirUno) => {
          const vars = II.mezclar(r, [0, 1, 2]).slice(0, permitirUno && r() < 0.3 ? 1 : 2).sort();
          return vars.map((i) => 2 * i + (r() < 0.35 ? 1 : 0));
        };
        const g = [term(false), term(forma !== 'nand')];
        if (JSON.stringify(g[0]) === JSON.stringify(g[1])) continue;
        const f = D1.circ.funcion2(3, g, F.t1, F.t2), unos = f.filter((x) => x).length;
        if (unos < 2 || unos > 6) continue;
        const ft = forma === 'pos' ? 'pos' : 'sop', otra = ft === 'pos' ? 'sop' : 'pos';
        const fDe = (gg, fo) => D1.circ.funcion2(3, gg, fo === 'pos' ? 'or' : 'and', fo === 'pos' ? 'and' : 'or');
        const cand = [{ t: D1.circ.texto(g, N3, otra), f: fDe(g, otra) }];
        g.forEach((gg, gi) => gg.forEach((c, li) => {
          const h = g.map((x) => x.slice()); h[gi][li] = c ^ 1;
          cand.push({ t: D1.circ.texto(h, N3, ft), f: fDe(h, ft) });
          cand.push({ t: D1.circ.texto(h, N3, otra), f: fDe(h, otra) });
        }));
        const vistos = [f.join('')], ops = [D1.circ.texto(g, N3, ft)];
        II.mezclar(r, cand.slice(1)).concat([cand[0]]).reverse().forEach((c) => {
          const k = c.f.join('');
          if (ops.length < 4 && !vistos.includes(k) && !ops.includes(c.t)) { vistos.push(k); ops.push(c.t); }
        });
        if (ops.length < 4) continue;
        return { forma, g, f, ops, per: II.mezclar(r, [0, 1, 2, 3]) };
      }
    },
    resumen: (d) => 'circuito ' + FORMAS[d.forma].nombre,
    enunciado: (d) => '<p>Este es <b>tu circuito</b>. 1) Llena la tabla: para cada fila, sigue la señal compuerta por compuerta. 2) Elige la expresión que hace lo mismo.</p>' +
      '<div class="e5-circ">' + D1.circ.svg(3, d.g, N3, Object.assign({ mono: true }, FORMAS[d.forma])) + '</div>',
    montar(cont, d) {
      let mov = 0, op = null;
      const t0 = Date.now(), oyentes = [];
      const avisar = () => { mov++; oyentes.forEach((fn) => fn()); };
      const caja = document.createElement('div');
      caja.innerHTML = '<p class="paso-t"><b>1.</b> Toca cada fila para poner F = 1 o 0:</p>';
      cont.appendChild(caja);
      const tb = tablaTocar(caja, 3, N3, 'F', avisar);
      const z = document.createElement('div');
      z.innerHTML = '<p class="paso-t"><b>2.</b> ¿Qué expresión corresponde a tu circuito?</p><div class="z-op"></div>';
      caja.appendChild(z);
      const pintarOp = () => { z.querySelector('.z-op').innerHTML = opcionesHTML(d.ops, d.per, op); };
      z.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (!b) return; op = +b.dataset.k; pintarOp(); avisar(); });
      pintarOp();
      return {
        estado: () => ({ tabla: tb.t.slice(), opcion: op }),
        fijar(e) { if (!e) return; tb.fijar(e.tabla); if (e.opcion != null) { op = e.opcion; pintarOp(); } },
        movimientos: () => mov, segundos: () => Math.round((Date.now() - t0) / 1000),
        alCambiar: (fn) => oyentes.push(fn), destruir: () => caja.remove()
      };
    },
    evaluar(est, d) {
      const t = (est && est.tabla) || [];
      const bien = d.f.filter((v, m) => t[m] === v).length;
      const opOK = est && est.opcion === 0;
      const puntos = medio(2 * bien / 8) + (opOK ? 1 : 0);
      return { puntos, ok: puntos === 3, valor: puntos, texto: 'Tabla: ' + bien + '/8 filas · ' + (opOK ? '✓' : '✗') + ' expresión' };
    },
    solucion(d) {
      const nota = d.forma === 'nand' ? '<p class="lbl">NAND → NAND hace lo mismo que AND → OR (De Morgan).</p>' : '';
      return { html: '<div class="sol-dos e5-sol"><div class="sol-circ">' + D1.circ.svg(3, d.g, N3, Object.assign({ mono: true }, FORMAS[d.forma])) +
        '<p class="expr">F = ' + d.ops[0] + '</p>' + nota + '</div><div>' + K.tablaHTML(3, d.f, { nombres: N3, salida: 'F' }) + '</div></div>' };
    },
    vista(est, d) {
      const t = ((est && est.tabla) || []).map((x) => (x == null ? 0 : x));
      while (t.length < 8) t.push(0);
      const k = est && est.opcion;
      return '<div class="sol-dos e5-sol"><div class="sol-circ">' + D1.circ.svg(3, d.g, N3, Object.assign({ mono: true }, FORMAS[d.forma])) +
        '<p class="expr">Eligió: ' + (k != null ? d.ops[k] + (k === 0 ? ' ✓' : ' ✗') : '—') + '</p></div><div>' + K.tablaHTML(3, t, { nombres: N3, salida: 'F' }) + '</div></div>';
    }
  };

  // ---------- P2 (e7): de la expresión al mapa (cada término es un grupo) ----------
  const seTocan = (a, b) => (((a.val ^ b.val) & a.mask & b.mask) === 0);
  E.e7 = {
    titulo: 'De la expresión al mapa', puntos: 3, tipo: 'mapa',
    tv: 'Cada uno tiene <b>una expresión distinta</b>: llena el mapa directamente, sin hacer la tabla. Cada término es un grupo.',
    generar(r) {
      for (let intento = 0; intento < 400; intento++) {
        const nt = r() < 0.6 ? 2 : 3, cubos = [];
        for (let k = 0; k < nt; k++) {
          const vars = II.mezclar(r, [0, 1, 2, 3]).slice(0, 2);
          let mask = 0, val = 0;
          vars.forEach((i) => { const b = 1 << (3 - i); mask |= b; if (r() < 0.5) val |= b; });
          cubos.push({ mask, val });
        }
        const f = K.evaluar(4, cubos), unos = f.filter((x) => x).length;
        const distintos = new Set(cubos.map((c) => c.mask + '|' + c.val)).size === nt;
        const toque = cubos.some((a, i) => cubos.some((b, j) => j > i && seTocan(a, b)));
        if (!distintos || !toque || unos < 6 || unos > 11) continue;
        return { nv: 4, cubos, f };
      }
    },
    resumen: (d) => 'F = ' + K.expr(d.cubos, 4, N4, false),
    enunciado: (d) => '<p class="expr" style="text-align:center">F = ' + K.expr(d.cubos, 4, N4, true) + '</p>' +
      '<p>Pon un <b>1</b> en todas las celdas donde F vale 1 (toca para cambiar). Pista: cada término cubre un grupo de 4 celdas, y los grupos se pueden pisar.</p>',
    montar: (cont, d) => K.editor(cont, { nv: 4, salida: 'F' }),
    evaluar(est, d) {
      const v = (est && est.vals) || [];
      const bien = d.f.filter((x, m) => (v[m] || 0) === x).length;
      const puntos = medio(3 * bien / 16);
      return { puntos, ok: bien === 16, valor: puntos, texto: 'Mapa: ' + bien + '/16 celdas bien' };
    },
    solucion: (d) => ({ html: '<div class="sol-mapa">' + K.estatico(4, d.f, { nombres: N4, grupos: d.cubos }) + '<p class="expr">F = ' + K.expr(d.cubos, 4, N4, true) + '</p><p class="lbl">Cada término es un grupo; las celdas compartidas son 1 una sola vez.</p></div>' }),
    vista(est, d) {
      const v = ((est && est.vals) || Array(16).fill(0)).map((x) => x || 0);
      return '<div class="sol-mapa">' + K.estatico(4, v, { nombres: N4, cls: (m) => (v[m] !== d.f[m] ? 'mal' : '') }) + '<p class="expr">F = ' + K.expr(d.cubos, 4, N4, true) + '</p></div>';
    }
  };

  // ---------- P3 (e8): mapa de 4 variables donde hay que solapar ----------
  E.e8 = {
    titulo: 'Mapa de 4 variables: hay que solapar', puntos: 4, tipo: 'mapa',
    tv: 'Cada uno tiene <b>su función</b> en su celular. La expresión mínima <b>obliga a solapar grupos</b>: si los evitas, no sale mínima.',
    generar(r) {
      for (let intento = 0; intento < 2000; intento++) {
        const conX = r() < 0.4;
        const f = Array.from({ length: 16 }, () => { const x = r(); return conX && x < 0.1 ? 2 : x < 0.5 ? 1 : 0; });
        const unos = f.filter((x) => x === 1).length;
        if (unos < 6 || unos > 10) continue;
        const sol = K.resolver(4, f);
        if (sol.cubos.length < 2 || sol.cubos.length > 4) continue;
        if (!sol.cubos.some((c) => K.pc(c.mask) <= 2)) continue;
        if (!sol.cubos.some((a, i) => sol.cubos.some((b, j) => j > i && seTocan(a, b)))) continue;
        return { nv: 4, f };
      }
    },
    resumen: (d) => 'Σm(' + K.minterminos(d.f).join(', ') + ')' + (K.noImporta(d.f).length ? ' + d(' + K.noImporta(d.f).join(', ') + ')' : ''),
    enunciado: (d) => '<p class="expr" style="text-align:center">F = Σm(' + K.minterminos(d.f).join(', ') + ')' + (K.noImporta(d.f).length ? ' + d(' + K.noImporta(d.f).join(', ') + ')' : '') + '</p>' +
      '<p>Pon los unos (y las <b>X</b> de «d») usando el número de cada celda, agrupa y obtén la <b>expresión mínima</b>. Recuerda: un 1 puede estar en más de un grupo.</p>',
    montar: (cont, d) => K.editor(cont, { nv: 4, conX: K.noImporta(d.f).length > 0, salida: 'F' }),
    evaluar: evaluarMapa,
    solucion: (d) => solucionMapa(d, N4, 'F'),
    vista: (est, d) => vistaMapa(est, d, N4, 'F')
  };

  // ---------- P4 (e9): solo con NAND ----------
  E.e9 = {
    titulo: 'Solo con NAND', puntos: 3, tipo: 'circuito',
    tv: 'Cada uno tiene <b>su expresión</b>: arma el circuito solo con NAND (NAND → NAND) y cuenta cuántas NAND de 2 entradas usa.',
    generar(r) {
      for (let intento = 0; intento < 400; intento++) {
        const g = [0, 1].map(() => II.mezclar(r, [0, 1, 2, 3]).slice(0, 2).sort().map((i) => 2 * i + (r() < 0.22 ? 1 : 0)));
        if (JSON.stringify(g[0]) === JSON.stringify(g[1])) continue;
        const negs = new Set(); g.forEach((x) => x.forEach((c) => { if (c & 1) negs.add(c >> 1); }));
        if (negs.size > 2) continue;
        return { g, f: D1.circ.funcion(4, g), n: 3 + negs.size };
      }
    },
    resumen: (d) => 'F = ' + D1.circ.texto(d.g, N4, 'sop').replace(/<[^>]+>/g, '') + ' → ' + d.n + ' NAND',
    enunciado: (d) => '<p class="expr" style="text-align:center">F = ' + D1.circ.texto(d.g, N4, 'sop') + '</p>' +
      '<p>Arma el circuito <b>solo con NAND</b>: en cada NAND del primer nivel toca las entradas que llegan; la NAND de salida las junta. Luego responde cuántas NAND de 2 entradas necesitas en total (cada inversor también es una NAND con sus entradas unidas).</p>',
    montar(cont, d) {
      let puertas = [[]], cuenta = null, mov = 0;
      const t0 = Date.now(), oyentes = [];
      const avisar = () => { mov++; oyentes.forEach((fn) => fn()); };
      const caja = document.createElement('div');
      caja.innerHTML = '<div class="e5-circ"></div><div class="e5-puertas"></div><button class="boton bloque" data-a="mas">+ Agregar NAND</button>' +
        '<p class="e5-cuenta lbl"></p><p class="paso-t">¿Cuántas NAND de 2 entradas usas en total?</p><div class="z-op"></div>';
      cont.appendChild(caja);
      const q = (x) => caja.querySelector(x);
      const OPC = ['3', '4', '5', '6'];
      function pintar() {
        q('.e5-circ').innerHTML = D1.circ.svg(4, puertas, N4, { t1: 'nand', t2: 'nand' });
        q('.e5-puertas').innerHTML = puertas.map((g, k) => '<div class="e5-and" data-g="' + k + '"><span class="e5-n" style="color:' + K.GC[k % 8] + '">NAND ' + (k + 1) + '</span><div class="e5-chips">' +
          [0, 1, 2, 3].map((i) => [0, 1].map((ng) => { const c = 2 * i + ng; return '<button class="e5-chip' + (g.includes(c) ? ' on' : '') + '" data-c="' + c + '">' + (ng ? '<span class="ov">' + N4[i] + '</span>' : N4[i]) + '</button>'; }).join('')).join('') +
          '</div><button class="e5-x" data-x="' + k + '" aria-label="Quitar">✕</button></div>').join('');
        q('.e5-cuenta').innerHTML = 'Tu circuito hace: <b>F = ' + D1.circ.expr(puertas, N4, true) + '</b>';
        q('.z-op').innerHTML = opcionesHTML(OPC, [0, 1, 2, 3], cuenta);
      }
      caja.addEventListener('click', (e) => {
        const ch = e.target.closest('.e5-chip');
        if (ch) { const k = +ch.closest('.e5-and').dataset.g, c = +ch.dataset.c, g = puertas[k], i = g.indexOf(c); if (i >= 0) g.splice(i, 1); else g.push(c); pintar(); avisar(); return; }
        const x = e.target.closest('.e5-x');
        if (x) { puertas.splice(+x.dataset.x, 1); if (!puertas.length) puertas.push([]); pintar(); avisar(); return; }
        if (e.target.closest('[data-a="mas"]')) { if (puertas.length < 6) puertas.push([]); pintar(); avisar(); return; }
        const b = e.target.closest('.z-op [data-k]');
        if (b) { cuenta = +b.dataset.k; pintar(); avisar(); }
      });
      pintar();
      return {
        estado: () => ({ puertas: puertas.map((g) => g.slice()), cuenta }),
        fijar(e) { if (!e) return; if (e.puertas && e.puertas.length) puertas = e.puertas.map((g) => g.slice()); if (e.cuenta != null) cuenta = e.cuenta; pintar(); },
        movimientos: () => mov, segundos: () => Math.round((Date.now() - t0) / 1000),
        alCambiar: (fn) => oyentes.push(fn), destruir: () => caja.remove()
      };
    },
    evaluar(est, d) {
      const pu = ((est && est.puertas) || []).filter((g) => g.length);
      const circOK = pu.length > 0 && igualF(D1.circ.funcion2(4, pu, 'nand', 'nand'), d.f);
      const cOK = est && est.cuenta != null && 3 + est.cuenta === d.n;
      const puntos = (circOK ? 2 : 0) + (cOK ? 1 : 0);
      return { puntos, ok: puntos === 3, valor: puntos, texto: (circOK ? '✓' : '✗') + ' circuito · ' + (cOK ? '✓' : '✗') + ' cantidad de NAND' };
    },
    solucion(d) {
      const inv = d.n - 3;
      return { html: '<div class="sol-circ" style="margin:auto">' + D1.circ.svg(4, d.g, N4, { t1: 'nand', t2: 'nand' }) +
        '<p class="expr">F = ' + D1.circ.texto(d.g, N4, 'sop') + '</p><p class="lbl">2 NAND para los productos + 1 NAND de salida' +
        (inv ? ' + ' + inv + (inv === 1 ? ' inversor' : ' inversores') + ' (NAND con las entradas unidas)' : '') + ' = <b>' + d.n + ' NAND</b> → ' + (d.n <= 4 ? 'un' : 'dos') + ' 7400.</p></div>' };
    },
    vista(est, d) {
      const pu = (est && est.puertas) || [];
      return '<div class="sol-circ" style="margin:auto">' + (pu.some((g) => g.length) ? D1.circ.svg(4, pu, N4, { t1: 'nand', t2: 'nand' }) + '<p class="expr">F = ' + D1.circ.expr(pu, N4, true) + '</p>' : '<p class="lbl">No armó el circuito.</p>') +
        '<p class="lbl">Dijo: ' + (est && est.cuenta != null ? 3 + est.cuenta : '—') + ' NAND (eran ' + d.n + ')</p></div>';
    }
  };

  // ---------- E3: encontrar la falla de la bomba ----------
  const FALLAS = ['fb', 'fa', 'fc', 'ok'];
  const OPC_FALLA = ['El sensor bajo (Lb) está dañado', 'El sensor alto (La) está dañado', 'El sensor de la cisterna (C) está dañado', 'No hay ninguna falla'];
  E.e3 = {
    titulo: 'Encuentra la falla de la bomba', puntos: 2, tipo: 'bomba',
    tv: 'Cada celular tiene <b>una instalación distinta</b>. Hagan funcionar la bomba, comparen las lecturas con el agua y digan qué está fallando.',
    generar(r) { const x = r(); return { falla: x < 0.3 ? 'fb' : x < 0.6 ? 'fa' : x < 0.85 ? 'fc' : 'ok' }; },
    resumen: (d) => OPC_FALLA[FALLAS.indexOf(d.falla)],
    opciones: OPC_FALLA,
    enunciado: () => '<p>Haz funcionar el sistema (▶, la llave, la cisterna) y compara lo que dicen los sensores con lo que ves en el agua. ¿Qué está fallando?</p>',
    montar(cont, d) {
      const b = D1.diag.bomba(cont, { falla: d.falla === 'ok' ? null : d.falla, celular: true });
      const caja = document.createElement('div');
      caja.className = 'opciones-est';
      caja.innerHTML = OPC_FALLA.map((t, k) => '<button class="opcion-est" data-k="' + k + '"><span class="letra">' + 'ABCD'[k] + '</span><span>' + t + '</span></button>').join('');
      cont.appendChild(caja);
      let elegida = null, mov = 0;
      const oyentes = [];
      caja.addEventListener('click', (e) => {
        const bt = e.target.closest('[data-k]');
        if (!bt) return;
        elegida = +bt.dataset.k;
        mov++;
        caja.querySelectorAll('.opcion-est').forEach((x) => x.classList.toggle('elegida', x === bt));
        oyentes.forEach((fn) => fn());
      });
      b.alCambiar(() => oyentes.forEach((fn) => fn()));
      return {
        estado: () => ({ opcion: elegida, sim: b.estado() }),
        fijar(e) { if (e && e.opcion != null) { elegida = e.opcion; caja.querySelectorAll('.opcion-est').forEach((x) => x.classList.toggle('elegida', +x.dataset.k === elegida)); } },
        movimientos: () => mov + b.movimientos(),
        segundos: b.segundos,
        alCambiar: (fn) => oyentes.push(fn),
        destruir: () => { b.destruir(); caja.remove(); }
      };
    },
    evaluar(est, d) {
      const k = est && est.opcion;
      const ok = k != null && FALLAS[k] === d.falla;
      return { puntos: ok ? 2 : 0, ok, valor: ok ? 2 : 0, texto: k == null ? 'No elegiste ninguna opción.' : ok ? 'Diagnóstico correcto.' : 'Tu instalación tenía: ' + OPC_FALLA[FALLAS.indexOf(d.falla)].toLowerCase() + '.' };
    },
    solucion: () => ({
      html: '<div class="solucion"><p><b>Lb dañado:</b> el agua cubre Lb pero la lectura sigue en 0: la bomba vuelve a arrancar apenas baja un poco de La, y al llegar a La suena F.</p>' +
        '<p><b>La dañado:</b> el tanque llega arriba, La sigue en 0 y la bomba no para: rebalsa.</p>' +
        '<p><b>C dañado:</b> hay agua en la cisterna pero C = 0, y la bomba nunca arranca.</p>' +
        '<p><b>Sin falla:</b> cada lectura coincide con el agua.</p><p>Método: <b>comparar lo que mide el sensor con lo que pasa de verdad</b>.</p></div>'
    }),
    vista: (est) => '<div class="solucion"><p>Eligió: <b>' + (est && est.opcion != null ? OPC_FALLA[est.opcion] : '—') + '</b></p></div>'
  };

  // ---------- la sesión ----------
  D1.SESIONES['d1-c3'] = {
    id: 'd1-c3',
    materia: 'Electrónica Digital 1',
    titulo: 'Karnaugh y aplicaciones',
    grupos: ['Karnaugh', 'Aplicaciones', 'Práctica'],
    pasos: [
      { id: 'inicio', tipo: 'inicio', g: 0, titulo: 'Mapas de Karnaugh y aplicaciones', idea: 'Escanea el QR y entra con tu nombre y carnet.' },
      { id: 'r1', tipo: 'rapida', g: 0, titulo: 'Predicción', t: 'En un mapa de 4 variables, ¿cuántas vecinas tiene cada celda?', o: ['2', '3', '4', '8'], c: 2,
        por: 'Una vecina por cada variable que puede cambiar: 4 variables → 4 vecinas (contando los bordes).' },
      { id: 'kidea', tipo: 'explica', g: 0, titulo: 'Celdas vecinas cambian un solo bit', idea: 'Dos vecinas se juntan y la variable que cambia desaparece.' },
      { id: 'r2', tipo: 'rapida', g: 0, titulo: 'Para pensar', t: '¿Por qué las columnas van 00, 01, 11, 10 y no 00, 01, 10, 11?', o: ['Para que entre vecinas cambie un solo bit', 'Porque así se cuenta en binario', 'Para que entren más unos', 'Es solo una costumbre'], c: 0,
        por: 'Es el código Gray: de 01 a 10 cambiarían dos bits y esas celdas ya no se podrían juntar.' },
      { id: 'kvot', tipo: 'explica', g: 0, titulo: 'Del votador al mapa', idea: 'Cada fila de la tabla es una celda del mapa.' },
      { id: 'krules', tipo: 'explica', g: 0, titulo: 'Reglas para agrupar', idea: 'Grupos de 1, 2, 4 u 8, lo más grandes posible.' },
      { id: 'r3', tipo: 'rapida', g: 0, titulo: '¿Grupo válido o no?', t: '¿Cuántos de estos cuatro grupos son válidos?', o: ['1', '2', '3', '4'], c: 1, fig: 'validos',
        por: 'a) No: 3 celdas. b) Sí: los bordes son vecinos. c) No: en diagonal cambian dos variables. d) Sí: un bloque de 4.' },
      { id: 'ksolve', tipo: 'explica', g: 0, titulo: 'Mapa interactivo', idea: 'Primero piensa los grupos; después compruébalos.', explorar: 'mapa' },
      { id: 'e1', tipo: 'ejercicio', g: 0, ejercicio: 'e1' },
      { id: 'kx', tipo: 'explica', g: 0, titulo: '«No importa» (X)', idea: 'Una X se usa como 1 solo si agranda un grupo.' },
      { id: 'r4', tipo: 'rapida', g: 0, titulo: 'Para pensar', t: 'Una X conviene tomarla como 1…', o: ['solo si agranda un grupo', 'siempre', 'nunca', 'solo si está sola'], c: 0,
        por: 'Como 1 solo si te permite agrandar un grupo; si no, como 0. Nunca hagas un grupo solo de X.' },
      { id: 'kq', tipo: 'explica', g: 0, titulo: 'Para pensar: Karnaugh', idea: 'Discutan en parejas antes de revelar.' },
      { id: 'pumpd', tipo: 'explica', g: 1, titulo: 'Problema 1 · La bomba de agua', idea: 'La bomba arranca cuando el agua baja de Lb y para cuando llega a La.' },
      { id: 'r5', tipo: 'rapida', g: 1, titulo: 'Predicción', t: 'El tanque está a la mitad, la bomba apagada y la gente consume agua. ¿Cuándo arranca la bomba?', o: ['cuando el agua baja del sensor bajo (Lb)', 'de inmediato', 'cuando el agua baja del sensor alto (La)', 'nunca, porque ya llenó'], c: 0,
        por: 'Arranca recién cuando el agua baja de Lb (tanque vacío) y sigue hasta llegar a La. Entre los dos sensores, la bomba hace lo mismo que estaba haciendo.' },
      { id: 'psim', tipo: 'explica', g: 1, titulo: 'Probemos el diseño', idea: 'Mira el ciclo: arranca bajo Lb y para en La. Cambia la llave para cambiar el consumo.', explorar: 'bomba' },
      { id: 'r6', tipo: 'rapida', g: 1, titulo: 'Predicción', t: 'Si el sensor alto se daña y queda siempre en 0, ¿qué pasa?', o: ['el tanque rebalsa', 'suena la alarma F', 'la bomba no arranca', 'nada, sigue normal'], c: 0,
        por: 'Con La siempre en 0, la bomba nunca recibe la orden de parar: el tanque rebalsa y F no se entera.' },
      { id: 'e3', tipo: 'ejercicio', g: 1, ejercicio: 'e3' },
      { id: 'pq', tipo: 'explica', g: 1, titulo: 'Para pensar: la bomba', idea: '¿Qué no puede hacer un circuito combinacional?' },
      { id: 'e5', tipo: 'ejercicio', g: 1, ejercicio: 'e5' },
      { id: 'r7', tipo: 'rapida', g: 1, titulo: 'Predicción', t: 'Prensa con Y = I·D. Con cinta en el botón I, ¿baja si presionas solo D?', o: ['Sí, baja', 'No, la AND lo impide', 'Solo si la guarda está cerrada', 'Depende del tiempo'], c: 0,
        por: 'La cinta deja I = 1 para siempre: la AND ya no exige las dos manos.' },
      { id: 'press', tipo: 'explica', g: 1, titulo: 'Problema 2 · Prensa a dos manos', idea: 'Una AND no alcanza para la seguridad real.' },
      { id: 'r8', tipo: 'rapida', g: 1, titulo: 'Predicción', t: '¿Cuántas salidas tiene un decodificador BCD a 7 segmentos?', o: ['4', '7', '10', '16'], c: 1,
        por: 'Siete: una por segmento, todas con las mismas 4 entradas.' },
      { id: 'seg7', tipo: 'explica', g: 1, titulo: 'Problema 3 · BCD a 7 segmentos', idea: 'Un mapa por segmento; 10 a 15 son X.' },
      { id: 'e4', tipo: 'ejercicio', g: 1, ejercicio: 'e4' },
      { id: 'q7', tipo: 'explica', g: 1, titulo: 'Para pensar: el display', idea: 'Discutan en parejas antes de revelar.' },
      { id: 'e2', tipo: 'ejercicio', g: 1, ejercicio: 'e2' },
      { id: 'meth', tipo: 'explica', g: 1, titulo: 'El método en 6 pasos', idea: 'Del enunciado al circuito probado.' },
      { id: 'reto', tipo: 'explica', g: 1, titulo: 'Retos para el laboratorio', idea: 'Tabla, mapas, Falstad y protoboard.' },
      { id: 'prac', tipo: 'explica', g: 2, titulo: 'Práctica: del circuito a la función', idea: 'Cada uno tiene su propio circuito y sus propios mapas.' },
      { id: 'r9', tipo: 'rapida', g: 2, titulo: '¿Qué sale del circuito?', t: 'Con A = 1, B = 0 y C = 0, ¿cuánto vale F?', o: ['1', '0', 'Depende de C', 'No se puede saber'], c: 0,
        fig: 'html', figura: () => '<div class="fig-tv">' + D1.circ.svg(3, [[0, 3], [4]], ['A', 'B', 'C'], { mono: true }) + '</div>',
        por: 'La AND recibe A = 1 y B̄ = 1, así que da 1. La OR deja pasar ese 1: F = 1. Se sigue la señal compuerta por compuerta.' },
      { id: 'e6', tipo: 'ejercicio', g: 2, ejercicio: 'e6' },
      { id: 'r10', tipo: 'rapida', g: 2, titulo: 'De Morgan', t: '<span class="ov">A·B</span> es igual a…',
        o: ['<span class="ov">A</span> + <span class="ov">B</span>', '<span class="ov">A</span>·<span class="ov">B</span>', 'A + B', 'A·B'], c: 0,
        por: 'Negar un producto es sumar las negaciones. Por eso una NAND equivale a una OR con las entradas negadas, y NAND → NAND hace lo mismo que AND → OR.' },
      { id: 'e7', tipo: 'ejercicio', g: 2, ejercicio: 'e7' },
      { id: 'r11', tipo: 'rapida', g: 2, titulo: '¿Se puede reusar una celda?', t: 'Ya está el grupo de 8 (A). Para cubrir los unos que faltan, ¿puedo usar celdas que ya están en ese grupo?',
        o: ['Sí, si así el grupo sale más grande', 'No, cada celda va en un solo grupo', 'Solo si es una X', 'Solo en mapas de 3 variables'], c: 0,
        fig: 'html', figura: () => { const f = Array.from({ length: 16 }, (_, m) => ((m & 8) || (m & 3) === 3 ? 1 : 0)); return '<div class="fig-tv">' + K.estatico(4, f, { grupos: [{ mask: 8, val: 8 }] }) + '</div>'; },
        por: 'Sí. Conviene la columna completa C·D (4 celdas) aunque 2 ya estén en el grupo de A: F = A + C·D. Si evitas solapar, quedan grupos de 2 y la expresión no es mínima.' },
      { id: 'e8', tipo: 'ejercicio', g: 2, ejercicio: 'e8' },
      { id: 'r12', tipo: 'rapida', g: 2, titulo: 'El chip 7400', t: 'Y = A·B + C·D usando solo NAND de 2 entradas: ¿cuántas compuertas necesitas?', o: ['3', '2', '4', '6'], c: 0,
        por: 'Dos NAND para los productos y una NAND a la salida: NAND → NAND hace lo mismo que AND → OR. Las 3 caben en un solo 7400 (trae 4).' },
      { id: 'e9', tipo: 'ejercicio', g: 2, ejercicio: 'e9' },
      { id: 'pq9', tipo: 'explica', g: 2, titulo: 'Para pensar: circuitos', idea: 'Discutan en parejas antes de revelar.' },
      { id: 'cierre', tipo: 'cierre', g: 2, titulo: 'Cierre', idea: 'Un circuito combinacional decide con lo que ve ahora; no recuerda.' }
    ]
  };

  D1.datosDe = (ejId, carnet, extra) => E[ejId].generar(II.rng(String(carnet) + '|' + ejId + (extra ? '|' + extra : '')));
  D1.puntosPaso = (p) => (p.tipo === 'rapida' ? 1 : p.tipo === 'ejercicio' ? E[p.ejercicio].puntos : 0);
  D1.tituloPaso = (p) => (p.tipo === 'ejercicio' ? E[p.ejercicio].titulo : p.titulo);
})();
