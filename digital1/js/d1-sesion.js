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
      html: '<div class="solucion"><p><b>Lb dañado:</b> el agua cubre Lb pero la lectura sigue en 0. Al llegar a La suena F.</p>' +
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
    grupos: ['Karnaugh', 'Aplicaciones'],
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
      { id: 'pumpd', tipo: 'explica', g: 1, titulo: 'Problema 1 · La bomba de agua', idea: 'M = C·<span class="ov">La</span> · F = <span class="ov">Lb</span>·La' },
      { id: 'r5', tipo: 'rapida', g: 1, titulo: 'Predicción', t: 'Con la llave de salida cerrada, el agua llega al sensor alto. La bomba…', o: ['se apaga y se queda apagada', 'arranca y para muchas veces', 'sigue encendida hasta rebalsar', 'hace sonar la alarma F'], c: 0,
        por: 'Si nadie consume agua, el nivel no baja: La sigue en 1 y la bomba queda apagada.' },
      { id: 'psim', tipo: 'explica', g: 1, titulo: 'Probemos el diseño', idea: 'Abre y cierra la llave de salida y mira la bomba.', explorar: 'bomba' },
      { id: 'r6', tipo: 'rapida', g: 1, titulo: 'Predicción', t: 'Si el sensor alto se daña y queda siempre en 0, ¿qué pasa?', o: ['el tanque rebalsa', 'suena la alarma F', 'la bomba no arranca', 'nada, sigue normal'], c: 0,
        por: 'Con La siempre en 0, M = C·<span class="ov">La</span> nunca se apaga: el tanque rebalsa y F no se entera.' },
      { id: 'e3', tipo: 'ejercicio', g: 1, ejercicio: 'e3' },
      { id: 'pq', tipo: 'explica', g: 1, titulo: 'Para pensar: la bomba', idea: '¿Qué no puede hacer un circuito combinacional?' },
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
      { id: 'cierre', tipo: 'cierre', g: 1, titulo: 'Cierre', idea: 'Un circuito combinacional decide con lo que ve ahora; no recuerda.' }
    ]
  };

  D1.datosDe = (ejId, carnet, extra) => E[ejId].generar(II.rng(String(carnet) + '|' + ejId + (extra ? '|' + extra : '')));
  D1.puntosPaso = (p) => (p.tipo === 'rapida' ? 1 : p.tipo === 'ejercicio' ? E[p.ejercicio].puntos : 0);
  D1.tituloPaso = (p) => (p.tipo === 'ejercicio' ? E[p.ejercicio].titulo : p.titulo);
})();
