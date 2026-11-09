// ============================================================
// Medidas Eléctricas — Repaso para el 2.º parcial (09/11/2026)
//   Página para el celular: temas → teoría / ejercicios / preguntas, y un
//   simulacro de 20 preguntas al azar. No se conecta a la base de datos: no hay
//   registro, no se envía nada y no cambia ningún punto. El avance se guarda
//   solo en el celular.
//   Rutas: #/ ; #/t/<tema>[/ej|/pr] ; #/e/<tema>/<ejercicio> ; #/sim
// ============================================================
(function () {
  'use strict';
  const FP = window.FP, E = FP.REPASO_EJ;
  const TEMAS = FP.REPASO.TEMAS;
  const $ = (s, r) => (r || document).querySelector(s);
  const app = $('#app');
  const LET = 'ABCDEF';
  const PRE = 'merep-v1-';
  const leer = (k, d) => II.leer(PRE + k, d);
  const guardar = (k, v) => II.guardar(PRE + k, v);
  let uid = leer('uid', null);
  if (!uid) { uid = Math.random().toString(36).slice(2, 10); guardar('uid', uid); }
  const temaDe = (id) => TEMAS.find((t) => t.id === id);

  // ---------- limpieza al cambiar de página ----------
  let limpiar = [];
  function soltar() { limpiar.forEach((fn) => { try { fn(); } catch (e) { /* nada */ } }); limpiar = []; }

  // ---------- avance (solo en este celular) ----------
  const hecho = () => leer('hecho', {});
  function marcarHecho(k, frac) { const h = hecho(); h[k] = Math.max(h[k] || 0, frac); guardar('hecho', h); }

  // ---------- diagrama para manipular ----------
  function montarDg(z, nombre, opc) {
    const g = FP.diagramas[nombre](z, Object.assign({ animar: true }, opc || {}));
    limpiar.push(() => g.destruir());
    return g;
  }

  // =================================================================
  // Páginas
  // =================================================================
  const cab = (titulo, sub) => { $('#e-nombre').textContent = sub || 'Repaso para el 2.º parcial'; document.title = titulo + ' · Medidas Eléctricas'; };
  const fracTema = (t) => { const h = hecho(); return t.ejercicios.filter((k) => h[k] != null).length; };

  function vInicio() {
    cab('Repaso para el 2.º parcial');
    app.innerHTML = '<div class="tarjeta rp-intro"><span class="etq">Medidas Eléctricas</span><h2>Repaso para el 2.º parcial</h2>' +
      '<p>Todo lo que avanzamos desde el lunes 5 de octubre: la teoría de cada tema, los ejercicios de clase y ejercicios nuevos con aplicaciones reales. Cada vez que pides <b>«Otro ejercicio»</b> los datos cambian.</p>' +
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
    cab(t.titulo, t.n + '. ' + t.titulo);
    app.innerHTML = tabsTema(t, 'teo') + t.teoria.map((s, i) => (s.w
      ? '<div class="tarjeta rp-wid"><p class="rp-explora">' + (s.nota || 'Manipula el diagrama.') + '</p><div class="rp-dg" id="w' + i + '"></div></div>'
      : '<div class="tarjeta rp-sec"><h3>' + s.t + '</h3>' + s.h + '</div>')).join('') +
      '<div class="tarjeta rp-err"><h3>⚠ Errores típicos (datos de clase)</h3><ul>' + t.errores.map((x) => '<li>' + x + '</li>').join('') + '</ul></div>' + pieTema(t, 'teo');
    t.teoria.forEach((s, i) => { if (s.w) montarDg($('#w' + i), s.w, s.opc); });
  }

  function vListaEj(t) {
    cab(t.titulo, t.n + '. Ejercicios');
    const h = hecho();
    app.innerHTML = tabsTema(t, 'ej') + '<p class="lbl rp-nota">Resuelve con tu cuaderno y toca <b>Revisar</b>: verás tu nota y la solución con tus datos. «Otro ejercicio» te da datos nuevos.</p>' +
      t.ejercicios.map((k) => {
        const ej = E[k], fr = h[k];
        return '<a class="rp-ej" href="#/e/' + t.id + '/' + k + '"><span><b>' + ej.titulo + '</b><small>' + ej.puntos + ' puntos; ' + (ej.nuevo ? '<span class="rp-nuevo">nuevo</span>' : 'como en clase') + '</small></span>' +
          '<span class="rp-est ' + (fr == null ? '' : fr >= 1 ? 'ok' : 'duda') + '">' + (fr == null ? '›' : fr >= 1 ? '✓' : Math.round(fr * 100) + ' %') + '</span></a>';
      }).join('') + pieTema(t, 'ej');
  }

  const formulasHTML = (lista) => (lista && lista.length ? '<div class="formulas-est"><span class="etq">Fórmulas útiles</span>' + lista.map((x) => '<div>' + x + '</div>').join('') + '</div>' : '');

  function vEjercicio(t, k) {
    const ej = E[k];
    if (!ej) return irA('#/t/' + t.id + '/ej');
    cab(ej.titulo, t.n + '. ' + t.titulo);
    const semilla = leer('sem-' + k, 0);
    const d = ej.generar(II.rng('rep|' + uid + '|' + k + '|' + semilla));
    const kB = 'b-' + k + '-' + semilla, kR = 'r-' + k + '-' + semilla;
    const head = '<div class="rp-migas"><a href="#/t/' + t.id + '/ej">← Ejercicios de «' + t.titulo + '»</a></div>';
    const cabEj = '<span class="etq">Ejercicio; ' + ej.puntos + ' puntos' + (ej.nuevo ? '; nuevo' : '; como en clase') + '</span><h2>' + ej.titulo + '</h2>';
    const otra = () => { soltar(); guardar('sem-' + k, semilla + 1); vEjercicio(t, k); window.scrollTo(0, 0); };
    const hecha = leer(kR, null);
    if (hecha) {
      const ev = ej.evaluar(hecha, d), sol = ej.solucion(d);
      const cls = ev.puntos >= ej.puntos ? 'ok' : ev.puntos > 0 ? 'duda' : 'mal';
      app.innerHTML = head + '<div class="tarjeta">' + cabEj + ej.enunciado(d) +
        '<div class="aviso ' + cls + '">' + (ev.puntos >= ej.puntos ? '¡Correcto! ' : ev.puntos > 0 ? 'Casi. ' : 'Incorrecto. ') + II.fmt(ev.puntos, 0) + ' de ' + ej.puntos + ' puntos<br><span style="font-weight:500">' + ev.texto + '</span></div>' +
        '<p class="etq">Solución con tus datos</p>' + sol.html + (sol.dg ? '<div class="rp-dg" id="rp-soldg"></div>' : '') +
        '<p class="etq mi-res">Tu respuesta</p>' + ej.vista(hecha, d) +
        '<button class="boton prim bloque" id="rp-otra" style="margin-top:14px">Otro ejercicio (datos nuevos)</button>' +
        '<a class="boton bloque" style="margin-top:10px" href="#/t/' + t.id + '/ej">Volver a los ejercicios</a></div>';
      if (sol.dg) montarDg($('#rp-soldg'), sol.dg.nombre, sol.dg.opc);
      $('#rp-otra').onclick = otra;
      return;
    }
    app.innerHTML = head + '<div class="tarjeta">' + cabEj + ej.enunciado(d) + formulasHTML(ej.formulas) + '<div id="zona-dg"></div>' +
      '<button class="boton prim bloque" id="rp-rev" style="margin-top:14px">Revisar mi respuesta</button><button class="boton bloque" id="rp-salta" style="margin-top:10px">Otro ejercicio (datos nuevos)</button></div>';
    const ctrl = ej.montar($('#zona-dg'), d);
    limpiar.push(() => ctrl.destruir && ctrl.destruir());
    const borr = leer(kB, null);
    if (borr && ctrl.fijar) ctrl.fijar(borr);
    ctrl.alCambiar(() => guardar(kB, ctrl.estado()));
    $('#rp-salta').onclick = otra;
    $('#rp-rev').onclick = (e) => {
      const b = e.currentTarget;
      if (!b.classList.contains('confirmar')) { b.classList.add('confirmar'); b.textContent = 'Toca otra vez para revisar (no podrás cambiar)'; return; }
      const est = ctrl.estado(), ev = ej.evaluar(est, d);
      guardar(kR, est);
      marcarHecho(k, ev.puntos / ej.puntos);
      soltar(); vEjercicio(t, k); window.scrollTo(0, 0);
    };
  }

  // ---------- preguntas (rápidas del tema + generadas) ----------
  function itemsGenerados(t, cuantos) {
    const out = [];
    t.ejercicios.filter((k) => E[k] && E[k].soloOpciones).forEach((k) => {
      const d = E[k].generar(II.rng('q|' + Math.random()));
      E[k].opcionesSueltas(d).forEach((it) => out.push(it));
    });
    return II.mezclar(Math.random, out).slice(0, cuantos);
  }
  function preparar(lista) { return lista.map((q) => Object.assign({}, q, { per: II.mezclar(Math.random, q.o.map((_, i) => i)) })); }
  function preguntaHTML(q, i, n, elegida, mostrar) {
    return '<div class="tarjeta rp-q"><span class="etq">Pregunta ' + (i + 1) + ' de ' + n + (q.tema ? '; ' + q.tema : '') + '</span><p class="rp-t">' + q.t + '</p>' +
      '<div class="opciones-est">' + q.per.map((k, j) => {
        let c = '';
        if (mostrar) c = k === 0 ? ' correcta' : k === elegida ? ' errada' : '';
        else if (k === elegida) c = ' elegida';
        return '<button class="opcion-est' + c + '" data-k="' + k + '"' + (mostrar ? ' disabled' : '') + '><span class="letra">' + LET[j] + '</span><span class="rp-op">' + q.o[k] + '</span></button>';
      }).join('') + '</div>' +
      (mostrar ? '<div class="aviso ' + (elegida === 0 ? 'ok' : 'mal') + '">' + (elegida === 0 ? '¡Correcto!' : elegida == null ? '<span class="rp-q">?</span> Sin responder: cuenta como incorrecta.' : 'Incorrecto.') + '<br><span style="font-weight:500">' + q.por + '</span></div>' : '') + '</div>';
  }
  function vPreguntas(t) {
    cab(t.titulo, t.n + '. Preguntas');
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
    TEMAS.forEach((t) => { const p = II.mezclar(Math.random, t.rapidas.concat(itemsGenerados(t, 2))); pool.push(...p.slice(0, 2).map((q) => Object.assign({ tema: t.titulo }, q))); });
    const todas = [];
    TEMAS.forEach((t) => t.rapidas.forEach((q) => todas.push(Object.assign({ tema: t.titulo }, q))));
    II.mezclar(Math.random, todas).forEach((q) => { if (pool.length < 20 && !pool.some((x) => x.t === q.t)) pool.push(q); });
    const qs = preparar(II.mezclar(Math.random, pool));
    const resp = Array(qs.length).fill(null);
    let i = 0;
    const chips = () => '<div class="rp-chips">' + qs.map((_, j) => '<button class="' + (j === i ? 'act ' : '') + (resp[j] != null ? 'hecha' : '') + '" data-j="' + j + '">' + (j + 1) + '</button>').join('') + '</div>';
    function pintar() {
      const faltan = resp.filter((x) => x == null).length;
      app.innerHTML = '<div class="rp-migas"><a href="#/">← Temas</a></div><div class="tarjeta rp-intro"><h2>Simulacro de examen</h2><p class="lbl">Responde las ' + qs.length + ' preguntas y toca «Terminar». La nota y las soluciones aparecen al final. Lo que dejes sin responder cuenta como incorrecto.</p>' + chips() + '</div>' +
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
      const bien = resp.filter((x) => x === 0).length, nota = Math.round((bien / qs.length) * 100);
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
