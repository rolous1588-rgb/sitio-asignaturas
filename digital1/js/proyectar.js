// ============================================================
// Electrónica Digital 1 — proyección + control (celular del docente, horizontal)
// La misma página proyecta en la TV (espejo por Chromecast) y controla la clase.
// Sin sesión de docente funciona en «modo ensayo» (solo local).
// estado_sesion.paso  = id del paso en pantalla
// estado_sesion.extra = { abierto: id } → { abierto: id, fin, seg } → { cerrado: id }
// ============================================================
(function () {
  'use strict';
  const $ = II.$, $$ = II.$$, K = D1.k, E = D1.EJERCICIOS;
  const S = D1.SESIONES[II.params.get('s')] || D1.SESIONES['d1-c3'];
  const SID = S.id, PASOS = S.pasos;
  const URL_CLASE = II.urlClase(SID);
  const SEG = { rapida: 12, ejercicio: 20 };
  const LETRAS = 'ABCDE';
  const hooks = {};

  let idx = Math.max(0, Math.min(PASOS.length - 1, II.leer('d1-proy-' + SID, 0) || 0));
  let extra = {}, docente = false, respuestas = [], todas = [], conectados = 0, ultimoLocal = 0;
  let vista = 'resultados', intentoIdx = 0, timerCierre = null, timerReloj = null;
  const paso = () => PASOS[idx];
  const actDe = (p) => (p.tipo === 'rapida' || p.tipo === 'ejercicio' ? p.id : null);
  const fase = (p) => {
    if (extra.cerrado === p.id) return 'cerrado';
    if (extra.abierto === p.id) return extra.fin ? 'cerrando' : 'abierto';
    return 'preparado';
  };
  const mediana = (arr) => {
    const a = arr.filter((x) => isFinite(x)).sort((x, y) => x - y);
    if (!a.length) return NaN;
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  };

  // ---------------- diapositivas en el orden de la sesión ----------------
  const stage = $('#stage');
  const slides = PASOS.map((p, i) => {
    let el = $('#p-' + p.id);
    if (!el) {
      el = document.createElement('section');
      el.className = 'slide vivo';
      el.id = 'p-' + p.id;
    }
    el.dataset.i = i;
    stage.appendChild(el);
    return el;
  });
  const curEl = () => slides[idx];

  // ---------------- ajuste de tamaño (letra grande primero) ----------------
  function fit(el) {
    if (!el) return;
    const over = () => el.scrollHeight > el.clientHeight + 2, H = el.clientHeight, hasSvg = !!el.querySelector('svg');
    const setF = (v) => el.style.setProperty('--fit', v.toFixed(2)), setS = (v) => el.style.setProperty('--svh', Math.round(H * v) + 'px');
    el.style.removeProperty('--svh');
    for (let f = 1; f > 0.6; f -= 0.04) {
      setF(f);
      if (!hasSvg) { if (!over()) return; continue; }
      for (let sv = 0.74; sv > 0.44; sv -= 0.04) { setS(sv); if (!over()) return; }
    }
  }
  const refit = () => fit(curEl());

  // ---------------- pestañas, puntos y flechas ----------------
  const tabsEl = $('#tabs');
  S.grupos.forEach((n, g) => {
    const b = document.createElement('button');
    b.innerHTML = '<b>' + (7 + g) + '</b>' + n;
    b.onclick = () => irA(PASOS.findIndex((p) => p.g === g));
    tabsEl.appendChild(b);
  });
  function barra() {
    const p = paso();
    $$('#tabs button').forEach((b, g) => b.classList.toggle('on', g === p.g));
    const dots = $('#dots');
    dots.innerHTML = '';
    PASOS.forEach((q, i) => {
      if (q.g !== p.g) return;
      const d = document.createElement('button');
      if (i === idx) d.className = 'on';
      d.onclick = () => irA(i);
      dots.appendChild(d);
    });
    $('#prev').disabled = idx === 0;
    $('#next').disabled = idx === PASOS.length - 1;
    // botones de la actividad
    const acc = $('#b-acc'), ext = $('#b-extra');
    acc.className = 'acc'; acc.disabled = false; ext.className = 'acc oculto';
    if (!actDe(p)) acc.classList.add('oculto');
    else {
      const fz = fase(p);
      if (fz === 'preparado') { acc.textContent = 'Habilitar'; acc.classList.add('ok'); }
      else if (fz === 'abierto') { acc.textContent = 'Cerrar'; acc.classList.add('peligro'); }
      else if (fz === 'cerrando') { acc.textContent = 'Cerrando…'; acc.disabled = true; }
      else if (p.tipo === 'rapida') acc.textContent = 'Reabrir';
      else {
        acc.textContent = vista === 'solucion' ? 'Resultados' : 'Solución';
        ext.classList.remove('oculto');
        ext.textContent = vista === 'intento' ? 'Otro intento' : 'Intento';
      }
    }
    const chip = $('#b-chip');
    chip.textContent = docente ? '👥 ' + conectados : 'Ensayo';
    chip.classList.toggle('ensayo', !docente);
  }

  // ---------------- escenas en vivo ----------------
  function qr(tam) { return II.qrSVG(URL_CLASE, tam || 300); }
  function panelEstado(p) {
    const fz = fase(p);
    const txt = { preparado: 'Aún cerrado', abierto: 'Abierto', cerrando: 'Cerrando', cerrado: 'Cerrado' }[fz];
    const cls = fz === 'abierto' ? 'abierto' : fz === 'preparado' ? '' : 'cerrado';
    return '<div class="tvp centro"><span class="estado ' + cls + '">' + txt + '</span>' +
      '<div class="' + (fz === 'cerrando' ? 'reloj' : 'cifra') + '" id="c-cifra">' + (fz === 'cerrando' ? '' : respuestas.length + ' <small>/ ' + conectados + '</small>') + '</div>' +
      '<p class="lbl" id="c-sub">' + (fz === 'cerrando' ? 'se envía lo que tengan' : 'respuestas') + '</p>' +
      (fz === 'cerrado' ? '' : '<div class="qrbox">' + qr(240) + '</div>') + '</div>';
  }
  function escInicio(el, p) {
    el.innerHTML = '<h2>' + p.titulo + '</h2><div class="esc"><div class="izq">' +
      '<p class="preg">1. Escanea el código QR<br>2. Escribe tu nombre y carnet<br>3. Mira la TV y responde en tu celular</p>' +
      '<p class="lbl">Funciona con datos móviles: consume muy poco. Los puntos de hoy cuentan para prácticas.</p>' +
      '<p class="lbl mono">' + II.esc(URL_CLASE.replace(/^https?:\/\//, '')) + '</p></div>' +
      '<div class="der"><div class="tvp centro"><div class="qrbox grande">' + qr(300) + '</div><div class="cifra" id="c-gente">' + conectados + ' <small>conectados</small></div></div></div></div>';
  }
  function figura(p) {
    if (p.fig !== 'validos') return '';
    const ej = [['a', [4, 5, 7]], ['b', [0, 2]], ['c', [1, 7]], ['d', [1, 3, 5, 7]]];
    return '<div class="fig-min">' + ej.map(([l, c]) => {
      const v = Array(8).fill(0); c.forEach((m) => (v[m] = 1));
      return '<figure>' + K.estatico(3, v, { blanco0: true, mt: false, cls: (m) => (c.includes(m) ? 'hl' : '') }) + '<figcaption>' + l + ')</figcaption></figure>';
    }).join('') + '</div>';
  }
  function escRapida(el, p) {
    const fz = fase(p), cerr = fz === 'cerrado';
    const conteo = p.o.map((_, k) => respuestas.filter((r) => r.respuesta && r.respuesta.opcion === k).length);
    const total = conteo.reduce((a, b) => a + b, 0) || 1;
    const ops = p.o.map((t, k) => '<div class="opt ' + (cerr && k === p.c ? 'correcta' : '') + '"><span class="barra" style="width:' + (cerr ? (conteo[k] / total) * 100 : 0) + '%"></span>' +
      '<span class="letra">' + LETRAS[k] + '</span><span class="txt">' + t + '</span>' + (cerr ? '<span class="n">' + conteo[k] + '</span>' : '') + '</div>').join('');
    const cortas = p.o.every((t) => String(t).length <= 3);
    if (p.fig) {
      const fz2 = fase(p);
      const txt = { preparado: 'Aún cerrado', abierto: 'Abierto', cerrando: 'Cerrando', cerrado: 'Cerrado' }[fz2];
      el.innerHTML = '<h2>' + p.titulo + ' <span class="lbl">· 1 punto</span></h2><div class="stack" style="margin-block:auto">' + figura(p) +
        '<div class="row" style="flex-wrap:nowrap;gap:1em;align-items:center"><div class="stack" style="flex:1;min-width:0"><p class="preg">' + p.t + '</p>' +
        '<div class="opts' + (cortas ? ' cuatro' : '') + '">' + ops + '</div>' + (cerr && p.por ? '<p class="por">' + p.por + '</p>' : '') + '</div>' +
        '<div class="tvp centro" style="flex:0 0 auto;min-width:6.5em"><span class="estado ' + (fz2 === 'abierto' ? 'abierto' : fz2 === 'preparado' ? '' : 'cerrado') + '">' + txt + '</span>' +
        '<div class="' + (fz2 === 'cerrando' ? 'reloj' : 'cifra') + '" id="c-cifra">' + (fz2 === 'cerrando' ? '' : respuestas.length + ' <small>/ ' + conectados + '</small>') + '</div></div></div></div>';
      return;
    }
    el.innerHTML = '<h2>' + p.titulo + ' <span class="lbl">· 1 punto</span></h2><div class="esc"><div class="izq">' + figura(p) +
      '<p class="preg">' + p.t + '</p><div class="opts' + (cortas ? ' cuatro' : '') + '">' + ops + '</div>' + (cerr && p.por ? '<p class="por">' + p.por + '</p>' : '') + '</div>' +
      '<div class="der">' + panelEstado(p) + '</div></div>';
  }
  function escEjercicio(el, p) {
    const ej = E[p.ejercicio], fz = fase(p);
    if (fz !== 'cerrado') {
      el.innerHTML = '<h2>Ejercicio: ' + ej.titulo + '</h2><div class="esc"><div class="izq">' +
        '<span class="etq">Ejercicio · ' + ej.puntos + ' puntos</span><p class="preg">' + ej.tv + '</p>' +
        '<p class="lbl">' + (ej.comun ? 'Es el mismo problema para todos: tabla → mapa → circuito en su celular. Al cerrar se envía lo que tengas.' : 'Tus datos son distintos a los de tu compañero: están en tu celular. Al cerrar se envía lo que tengas.') + '</p></div>' +
        '<div class="der">' + panelEstado(p) + '</div></div>';
      return;
    }
    if (vista === 'solucion') {
      const d = D1.datosDe(p.ejercicio, D1.CARNET_EJEMPLO);
      if (ej.comun) { el.innerHTML = '<h2>Solución · ' + ej.titulo + '</h2><div class="esc"><div class="izq">' + ej.solucion(d).html + '</div></div>'; return; }
      el.innerHTML = '<h2>Solución · ' + ej.titulo + '</h2><div class="esc"><div class="izq">' + ej.solucion(d).html + '</div>' +
        '<div class="der"><div class="tvp"><span class="etq">' + (ej.comun ? 'Problema' : 'Datos de ejemplo') + '</span><p>' + ej.resumen(d) + '</p>' +
        (p.ejercicio === 'e2' ? '<p class="lbl">' + II.esc(D1.PROBLEMAS[d.k].txt) + '</p>' : '') + '</div></div></div>';
      return;
    }
    if (vista === 'intento') {
      const lista = ordenIntentos();
      if (!lista.length) { vista = 'resultados'; return escEjercicio(el, p); }
      const i = ((intentoIdx % lista.length) + lista.length) % lista.length, r = lista[i];
      const d = D1.datosDe(p.ejercicio, r.carnet);
      const est = (r.respuesta && r.respuesta.estado) || {};
      const ev = r.respuesta && r.respuesta.vacio ? null : ej.evaluar(est, d);
      const cls = !ev ? 'mal' : ev.puntos >= ej.puntos ? 'ok' : ev.puntos > 0 ? 'duda' : 'mal';
      const mov = r.respuesta && r.respuesta.mov != null ? r.respuesta.mov + ' mov.' : '';
      const seg = r.respuesta && r.respuesta.seg != null ? r.respuesta.seg + ' s' : '';
      el.innerHTML = '<h2>Intento de un compañero (anónimo)</h2><div class="esc"><div class="izq">' + ej.vista(est, d) + '</div>' +
        '<div class="der"><div class="tvp"><div class="intento ' + cls + '">Intento ' + (i + 1) + '/' + lista.length + ' · ' + (ev ? ev.puntos + ' de ' + ej.puntos + ' pts' : 'no respondió') + '</div>' +
        (ev ? '<p class="lbl">' + ev.texto + '</p>' : '') + '<p class="lbl">Sus datos: ' + ej.resumen(d) + '</p><p class="lbl">' + [mov, seg].filter(Boolean).join(' · ') + '</p></div></div></div>';
      return;
    }
    el.innerHTML = '<h2>Resultados · ' + ej.titulo + '</h2><div class="esc"><div class="izq"><div class="res-svg" id="c-graf"></div></div>' +
      '<div class="der"><div class="tvp"><div class="metricas" id="c-met"></div><p class="lbl">Cada barra cuenta estudiantes (anónimo) según sus puntos.</p></div></div></div>';
    pintarResultados();
  }
  function evaluados() {
    const p = paso(), ej = E[p.ejercicio];
    return respuestas.map((r) => {
      if (r.respuesta && r.respuesta.vacio) return { vacio: true };
      const ev = ej.evaluar((r.respuesta && r.respuesta.estado) || {}, D1.datosDe(p.ejercicio, r.carnet));
      return { ...ev, mov: r.respuesta && r.respuesta.mov, seg: r.respuesta && r.respuesta.seg };
    });
  }
  function ordenIntentos() {
    const p = paso(), ej = E[p.ejercicio];
    return respuestas.filter((r) => !(r.respuesta && r.respuesta.vacio)).map((r) => {
      const ev = ej.evaluar((r.respuesta && r.respuesta.estado) || {}, D1.datosDe(p.ejercicio, r.carnet));
      return { ...r, _p: ev.puntos };
    }).sort((a, b) => a._p - b._p || String(a.carnet).localeCompare(String(b.carnet)));
  }
  function pintarResultados() {
    const p = paso(), ej = E[p.ejercicio];
    const g = $('#c-graf'), met = $('#c-met');
    if (!g || !met) return;
    const filas = evaluados(), val = filas.filter((x) => !x.vacio);
    const paso05 = p.ejercicio === 'e2';
    const cats = [];
    for (let v = 0; v <= ej.puntos + 1e-9; v += paso05 ? 0.5 : 1) cats.push(Math.round(v * 10) / 10);
    const cnt = cats.map((c) => val.filter((x) => Math.abs(x.puntos - c) < 0.01).length);
    const mx = Math.max(1, ...cnt);
    const x0 = 70, x1 = 960, base = 420, alto = 270, w = (x1 - x0) / cats.length;
    let s = '<line x1="' + x0 + '" y1="' + base + '" x2="' + x1 + '" y2="' + base + '" stroke="#adb5bd" stroke-width="4"/>';
    cats.forEach((c, i) => {
      const h = (cnt[i] / mx) * alto, x = x0 + i * w + w * 0.15, bw = w * 0.7;
      const col = c >= ej.puntos ? '#2b8a3e' : c > 0 ? '#e67700' : '#c92a2a';
      if (cnt[i]) s += '<rect x="' + x.toFixed(1) + '" y="' + (base - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="8" fill="' + col + '"/>' +
        '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (base - h - 14).toFixed(1) + '" font-size="46" font-weight="800" text-anchor="middle" fill="#1f2633">' + cnt[i] + '</text>';
      s += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (base + 56) + '" font-size="' + (paso05 ? 34 : 44) + '" font-weight="700" text-anchor="middle" fill="#5d6676">' + String(c).replace('.', ',') + '</text>';
    });
    s += '<text x="' + x0 + '" y="60" font-size="40" font-weight="700" fill="#1d4f86">Puntos obtenidos (de ' + ej.puntos + ')</text>';
    if (!val.length) s += '<text x="515" y="260" font-size="46" fill="#868e96" text-anchor="middle" font-weight="700">Aún no hay respuestas</text>';
    g.innerHTML = '<svg viewBox="0 0 1000 500">' + s + '</svg>';
    const ok = val.filter((v) => v.puntos >= ej.puntos).length;
    const prom = val.length ? val.reduce((a, v) => a + v.puntos, 0) / val.length : NaN;
    const mSeg = mediana(val.map((v) => v.seg));
    met.innerHTML =
      '<div class="metrica"><span>Enviaron</span><b>' + val.length + '</b></div>' +
      '<div class="metrica ok"><span>Todo bien</span><b>' + (val.length ? Math.round((ok / val.length) * 100) + '%' : '—') + '</b></div>' +
      '<div class="metrica"><span>Promedio</span><b>' + (isFinite(prom) ? II.fmt(prom, 1) : '—') + '</b></div>' +
      '<div class="metrica"><span>Tiempo</span><b>' + (isFinite(mSeg) ? Math.round(mSeg) + ' s' : '—') + '</b></div>';
  }
  function escCierre(el, p) {
    const acts = PASOS.filter(actDe);
    const por = {};
    todas.forEach((r) => { (por[r.actividad] = por[r.actividad] || {})[r.carnet] = r; });
    const gente = new Set(todas.filter((r) => r.actividad !== 'ingreso').map((r) => r.carnet));
    let suma = 0;
    gente.forEach((c) => acts.forEach((q) => { const r = por[q.id] && por[q.id][c]; if (r) suma += Number(r.puntaje) || 0; }));
    const maxPts = acts.reduce((a, q) => a + D1.puntosPaso(q), 0);
    const filas = acts.map((q, i) => {
      const rs = Object.values(por[q.id] || {});
      const ok = rs.filter((r) => r.correcta).length;
      const pct = rs.length ? Math.round((ok / rs.length) * 100) : 0;
      const nom = q.tipo === 'rapida' ? 'Rápida ' + q.id.slice(1) : E[q.ejercicio].titulo;
      return '<div class="opt"><span class="barra" style="width:' + pct + '%;background:var(--on2)"></span><span class="txt">' + nom + '</span><span class="n">' + (rs.length ? pct + '%' : '—') + '</span></div>';
    }).join('');
    el.innerHTML = '<h2>' + p.titulo + '</h2><div class="esc"><div class="izq"><span class="etq">Aciertos por actividad</span><div class="opts" style="font-size:.78em">' + filas + '</div></div>' +
      '<div class="der"><div class="tvp"><div class="metricas"><div class="metrica"><span>Participaron</span><b>' + gente.size + '</b></div>' +
      '<div class="metrica ok"><span>Promedio</span><b>' + (gente.size ? II.fmt(suma / gente.size, 1) : '—') + '</b></div></div>' +
      '<p class="lbl">de ' + maxPts + ' puntos posibles</p><p class="por">' + p.idea + '</p>' +
      (docente ? '<button class="btn pri" id="c-rep">Descargar reporte (CSV)</button>' : '') + '</div></div></div>';
    const b = $('#c-rep');
    if (b) b.onclick = reporte;
  }

  // ---------------- montar la diapositiva ----------------
  function montar() {
    const p = paso(), el = curEl();
    closePop();
    slides.forEach((s, i) => {
      if (i !== idx && s.classList.contains('on')) {
        s.classList.remove('on');
        const h = hooks[PASOS[i].id];
        if (h && h.hide) h.hide();
      }
    });
    const nuevo = !el.classList.contains('on');
    el.classList.add('on');
    if (p.tipo !== 'ejercicio') vista = 'resultados';
    if (p.tipo === 'inicio') escInicio(el, p);
    else if (p.tipo === 'rapida') escRapida(el, p);
    else if (p.tipo === 'ejercicio') escEjercicio(el, p);
    else if (p.tipo === 'cierre') { escCierre(el, p); cargarTodas().then(() => { if (paso().tipo === 'cierre') { escCierre(curEl(), paso()); refit(); } }); }
    if (nuevo) { const h = hooks[p.id]; if (h && h.show) h.show(); }
    barra();
    vigilarCierre();
    fit(el);
    II.guardar('d1-proy-' + SID, idx);
  }
  // refresca contadores sin desmontar diagramas
  function refrescar() {
    const p = paso();
    barra();
    if (p.tipo === 'inicio') { const c = $('#c-gente'); if (c) c.innerHTML = conectados + ' <small>conectados</small>'; return; }
    if (p.tipo === 'rapida') { if (fase(p) === 'cerrado') { escRapida(curEl(), p); refit(); } else cifra(); return; }
    if (p.tipo === 'ejercicio') { if (fase(p) !== 'cerrado') cifra(); else if (vista === 'resultados') pintarResultados(); }
  }
  function cifra() {
    const c = $('#c-cifra');
    if (c && fase(paso()) !== 'cerrando') c.innerHTML = respuestas.length + ' <small>/ ' + conectados + '</small>';
  }

  // ---------------- cuenta regresiva del cierre ----------------
  function vigilarCierre() {
    clearInterval(timerReloj);
    clearTimeout(timerCierre);
    const p = paso();
    if (!actDe(p) || fase(p) !== 'cerrando') return;
    const fin = new Date(extra.fin).getTime();
    const tic = () => {
      const r = Math.max(0, Math.ceil((fin - Date.now()) / 1000));
      const c = $('#c-cifra');
      if (c) c.textContent = r;
      if (r <= 0) clearInterval(timerReloj);
    };
    tic();
    timerReloj = setInterval(tic, 250);
    timerCierre = setTimeout(() => { if (extra.abierto === p.id && paso().id === p.id) cambiarExtra({ cerrado: p.id }); }, Math.max(0, fin - Date.now()) + 1500);
  }

  // ---------------- acciones ----------------
  async function cambiarExtra(nuevo) {
    extra = nuevo;
    ultimoLocal = Date.now();
    montar();
    if (docente) {
      const { data, error } = await II.sb.from('estado_sesion').update({ extra: nuevo, actualizado: new Date().toISOString() }).eq('sesion', SID).select();
      if (error || !data || !data.length) aviso('No se pudo guardar el cambio. Revisa la conexión.');
      sondear();
    }
  }
  async function irA(nuevo) {
    if (nuevo < 0 || nuevo >= PASOS.length || nuevo === idx) return;
    idx = nuevo;
    extra = {};
    vista = 'resultados';
    intentoIdx = 0;
    respuestas = [];
    ultimoLocal = Date.now();
    montar();
    if (docente) {
      const r = await II.fijarPaso(SID, paso().id, {});
      if (!r.ok) aviso('No se pudo cambiar el paso: ' + r.error);
      sondear();
    }
  }
  function accion() {
    const p = paso(), fz = fase(p);
    if (fz === 'preparado') return cambiarExtra({ abierto: p.id });
    if (fz === 'abierto') {
      const seg = SEG[p.tipo] || 12;
      return cambiarExtra({ abierto: p.id, seg, fin: new Date(Date.now() + seg * 1000).toISOString() });
    }
    if (fz === 'cerrado') {
      if (p.tipo === 'rapida') return cambiarExtra({ abierto: p.id });
      vista = vista === 'solucion' ? 'resultados' : 'solucion';
      montar();
    }
  }
  function accionExtra() {
    if (vista !== 'intento') { vista = 'intento'; intentoIdx = 0; } else intentoIdx++;
    montar();
  }
  let avisoT = null;
  function aviso(t) {
    const a = $('#aviso');
    a.textContent = t;
    a.classList.remove('oculto');
    clearTimeout(avisoT);
    avisoT = setTimeout(() => a.classList.add('oculto'), 4000);
  }

  // ---------------- datos en vivo (solo docente) ----------------
  async function sondear() {
    if (!docente) return;
    const p = paso(), act = actDe(p);
    try {
      if (act) {
        const { data, error } = await II.sb.from('respuestas').select('carnet,respuesta,correcta,puntaje,creado')
          .eq('sesion', SID).eq('actividad', act).order('creado', { ascending: true });
        if (error) throw error;
        const ult = {};
        (data || []).forEach((r) => { ult[r.carnet] = r; });
        if (paso().id === p.id) respuestas = Object.values(ult);
      }
      II.marcarConexion(true);
    } catch (e) { II.marcarConexion(false); }
    refrescar();
  }
  async function contarGente() {
    if (!docente) return;
    try {
      const { data, error } = await II.sb.from('ingresos').select('carnet').eq('sesion', SID);
      if (error) throw error;
      conectados = new Set((data || []).map((r) => r.carnet)).size;
    } catch (e) { /* sin red */ }
    refrescar();
  }
  async function cargarTodas() {
    if (!docente) return;
    const { data } = await II.sb.from('respuestas').select('actividad,carnet,nombre,correcta,puntaje,creado').eq('sesion', SID).order('creado', { ascending: true });
    todas = data || [];
  }

  // ---------------- reporte para la nota de prácticas ----------------
  async function reporte() {
    if (!docente) return aviso('Entra como docente para descargar el reporte.');
    aviso('Preparando el reporte…');
    const [{ data: ing }, { data: res }] = await Promise.all([
      II.sb.from('ingresos').select('carnet,nombre,creado').eq('sesion', SID).order('creado', { ascending: true }),
      II.sb.from('respuestas').select('actividad,carnet,nombre,puntaje,creado').eq('sesion', SID).order('creado', { ascending: true })
    ]);
    const acts = PASOS.filter(actDe);
    const gente = {};
    (ing || []).forEach((r) => { gente[r.carnet] = gente[r.carnet] || { nombre: r.nombre, pts: {} }; gente[r.carnet].nombre = r.nombre; });
    (res || []).forEach((r) => {
      if (r.actividad === 'ingreso') return;
      const g = (gente[r.carnet] = gente[r.carnet] || { nombre: r.nombre, pts: {} });
      g.pts[r.actividad] = Number(r.puntaje) || 0;
    });
    const maxPts = acts.reduce((a, q) => a + D1.puntosPaso(q), 0);
    const num = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
    const cel = (s) => '"' + String(s).replace(/"/g, '""') + '"';
    const filas = [['Carnet', 'Nombre'].concat(acts.map((q) => (q.tipo === 'rapida' ? 'Rápida ' + q.id.slice(1) : E[q.ejercicio].titulo) + ' (' + D1.puntosPaso(q) + ')'), ['Total', 'Máximo']).map(cel).join(';')];
    Object.entries(gente).sort((a, b) => a[1].nombre.localeCompare(b[1].nombre)).forEach(([c, g]) => {
      const pts = acts.map((q) => g.pts[q.id]);
      const tot = pts.reduce((a, x) => a + (x || 0), 0);
      filas.push([cel(c), cel(g.nombre)].concat(pts.map((x) => (x == null ? '' : num(x))), [num(tot), maxPts]).join(';'));
    });
    const blob = new Blob(['﻿' + filas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'digital1-' + SID + '-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    aviso('Reporte descargado: ' + Object.keys(gente).length + ' estudiantes.');
  }
  function borrarDatos() {
    if (!docente) return;
    const capa = II.html('<div class="capa"><div class="dialogo"><h3>Borrar datos de esta clase</h3><p>Se borran todas las respuestas e ingresos de «' + II.esc(S.titulo) + '». Úsalo solo para limpiar las pruebas antes de la clase.</p>' +
      '<div class="fila-bt"><button class="boton" data-x>Cancelar</button><button class="boton peligro" data-ok>Borrar todo</button></div></div></div>');
    document.body.appendChild(capa);
    capa.querySelector('[data-x]').onclick = () => capa.remove();
    capa.querySelector('[data-ok]').onclick = async () => {
      const r1 = await II.sb.from('respuestas').delete().eq('sesion', SID);
      const r2 = await II.sb.from('ingresos').delete().eq('sesion', SID);
      capa.remove();
      aviso(r1.error || r2.error ? 'No se pudo borrar: ' + ((r1.error || r2.error).message || '') : 'Datos de prueba borrados.');
      respuestas = []; todas = []; conectados = 0;
      contarGente(); montar();
    };
  }

  // ---------------- docente: ingreso y menú ----------------
  function dialogoLogin() {
    if (!II.sb) { aviso('Sin conexión con la base de datos: solo modo ensayo.'); return; }
    const capa = II.html('<div class="capa"><form class="dialogo"><h3>Entrar como docente</h3><p>La misma cuenta del diplomado y de Medidas.</p>' +
      '<input name="email" type="email" placeholder="Correo" autocomplete="username" required>' +
      '<input name="clave" type="password" placeholder="Contraseña" autocomplete="current-password" required>' +
      '<div class="error"></div><div class="fila-bt"><button type="button" class="boton" data-x>Cancelar</button><button class="boton prim">Entrar</button></div></form></div>');
    document.body.appendChild(capa);
    capa.querySelector('[data-x]').onclick = () => capa.remove();
    capa.querySelector('form').onsubmit = async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target), err = capa.querySelector('.error');
      err.textContent = 'Entrando…';
      const { error } = await II.sb.auth.signInWithPassword({ email: String(fd.get('email')).trim(), password: String(fd.get('clave')) });
      if (error) { err.textContent = 'No se pudo entrar: revisa correo y contraseña.'; return; }
      if (!(await verificarDocente())) { err.textContent = 'Esta cuenta no tiene permiso de docente.'; return; }
      capa.remove();
      const r = await II.fijarPaso(SID, paso().id, {});
      extra = {};
      if (!r.ok) aviso(r.error);
      montar(); sondear(); contarGente();
    };
  }
  async function verificarDocente() {
    try {
      const { data, error } = await II.sb.from('docentes').select('email').limit(1);
      docente = !error && !!(data && data.length);
    } catch (e) { docente = false; }
    barra();
    return docente;
  }
  function menu() {
    const it = (k, t, s) => '<button class="menu-it" data-m="' + k + '">' + t + (s ? '<small>' + s + '</small>' : '') + '</button>';
    const capa = II.html('<div class="capa"><div class="dialogo"><h3>' + II.esc(S.titulo) + '</h3>' +
      (docente ? it('rep', 'Descargar reporte (CSV)', 'Puntos por estudiante, para la nota de prácticas') + it('borrar', 'Borrar datos de esta clase', 'Solo para limpiar pruebas') + it('salir', 'Salir de la cuenta docente')
        : it('entrar', 'Entrar como docente', 'Para habilitar actividades y ver respuestas')) +
      it('inicio', 'Ir a la portada (QR)') + '<div class="fila-bt"><button class="boton" data-x>Cerrar</button></div></div></div>');
    document.body.appendChild(capa);
    capa.onclick = async (e) => {
      if (e.target === capa || e.target.closest('[data-x]')) return capa.remove();
      const b = e.target.closest('[data-m]');
      if (!b) return;
      capa.remove();
      const m = b.dataset.m;
      if (m === 'entrar') dialogoLogin();
      else if (m === 'rep') reporte();
      else if (m === 'borrar') borrarDatos();
      else if (m === 'salir') { await II.sb.auth.signOut(); docente = false; barra(); montar(); }
      else if (m === 'inicio') irA(0);
    };
  }
  function verQR() {
    const capa = II.html('<div class="capa" style="background:rgba(246,245,241,.98)"><div style="display:flex;gap:4vh;align-items:center;font-size:var(--fs)">' +
      '<div class="qrbox" style="font-size:calc(var(--fs)*1.6)">' + qr(400) + '</div><div><p class="preg">Entra a la clase</p><p class="lbl mono">' + II.esc(URL_CLASE.replace(/^https?:\/\//, '')) + '</p><p class="lbl">Toca para cerrar</p></div></div></div>');
    capa.querySelector('.qrbox svg').style.cssText = 'width:13em;height:13em';
    capa.onclick = () => capa.remove();
    document.body.appendChild(capa);
  }

  // ---------------- respuestas en ventana (preguntas para discutir) ----------------
  const pop = $('#pop');
  function closePop() { pop.classList.remove('on'); }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.rv');
    if (!b) return;
    const q = b.closest('.q,.pp');
    const a = b.dataset.a ? $(b.dataset.a, q) : $('.ans', q);
    $('.pq', pop).innerHTML = $('.qt', q).innerHTML + (b.dataset.h ? ' · ' + b.dataset.h : '');
    $('.pa', pop).innerHTML = a.innerHTML;
    q.classList.add('seen');
    pop.classList.add('on');
  });
  pop.onclick = closePop;

  // ---------------- navegación, gestos y herramientas ----------------
  $('#next').onclick = () => irA(idx + 1);
  $('#prev').onclick = () => irA(idx - 1);
  $('#b-acc').onclick = accion;
  $('#b-extra').onclick = accionExtra;
  $('#b-chip').onclick = () => { if (!docente) dialogoLogin(); };
  $('#b-menu').onclick = menu;
  $('#b-qr').onclick = verQR;
  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input')) return;
    if (e.key === 'Escape') return closePop();
    closePop();
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); irA(idx + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); irA(idx - 1); }
  });
  let tx = null, ty = 0, tt = null;
  stage.addEventListener('touchstart', (e) => { const p = e.touches[0]; tx = p.clientX; ty = p.clientY; tt = e.target; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (tx === null) return;
    const p = e.changedTouches[0], dx = p.clientX - tx, dy = p.clientY - ty;
    if (Math.abs(dx) > 70 && Math.abs(dx) > 1.6 * Math.abs(dy) && !(tt && tt.closest && tt.closest('input'))) irA(idx + (dx < 0 ? 1 : -1));
    tx = null;
  }, { passive: true });
  let k = II.leer('d1-k', 1);
  function setK(v) { k = Math.min(1.8, Math.max(0.6, Math.round(v * 10) / 10)); document.documentElement.style.setProperty('--k', k); II.guardar('d1-k', k); refit(); }
  $('#aMinus').onclick = () => setK(k - 0.1);
  $('#aPlus').onclick = () => setK(k + 0.1);
  let bloqueo = null;
  async function pantallaEncendida() {
    try { if ('wakeLock' in navigator && !bloqueo) { bloqueo = await navigator.wakeLock.request('screen'); bloqueo.addEventListener('release', () => { bloqueo = null; }); } } catch (e) { /* nada */ }
  }
  $('#fsBtn').onclick = async () => {
    try {
      if (!document.fullscreenElement) { await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); try { await screen.orientation.lock('landscape'); } catch (e) { /* no soportado */ } }
      else await document.exitFullscreen();
    } catch (e) { /* nada */ }
    pantallaEncendida();
  };
  document.addEventListener('fullscreenchange', () => setTimeout(refit, 200));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pantallaEncendida(); });
  let rz;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(refit, 150); });
  $('#rotOk').onclick = () => { document.body.classList.add('pok'); refit(); };
  II.alCambiarConexion((ok) => { const d = $('#t-con'); d.classList.toggle('on', ok); d.classList.toggle('off', !ok); });

  // =================================================================
  // Diagramas de las explicaciones (iguales a los del archivo de clase)
  // =================================================================
  const N3 = K.N3, N4 = K.N4, bin = K.bin, OV = K.OV;
  function bitBtn(el, v) { el.textContent = v; el.classList.toggle('one', v === 1); }

  (function () { // vecinas
    const svg = $('#c2KI'); let sel = 5, sec = -1;
    const nbs = (m) => [8, 4, 2, 1].map((b) => m ^ b);
    const T = (m) => K.termino({ mask: 15, val: m }, 4);
    function draw() {
      const nb = nbs(sel);
      K.dibujar(svg, 4, null, { etiqueta: (m) => bin(m, 4), cls: (m) => (m === sel ? 'sel' : m === sec ? 'sel2' : nb.includes(m) ? 'nb' : '') });
      if (sec < 0) $('#c2KIMsg').innerHTML = 'Celda <b>' + bin(sel, 4) + '</b> = ' + T(sel) + '<br>Vecinas (en azul): ' + nb.map((n, i) => bin(n, 4) + ' <span class="lbl">(cambia ' + N4[i] + ')</span>').join(', ') + '<br><span class="lbl">Toca una vecina para juntarlas.</span>';
      else {
        const b = sel ^ sec, i = [8, 4, 2, 1].indexOf(b), cb = { mask: 15 & ~b, val: sel & ~b };
        $('#c2KIMsg').innerHTML = T(sel) + ' + ' + T(sec) + '<br>= <b class="k">' + K.termino(cb, 4) + '</b><br><b>' + N4[i] + '</b> desaparece: vale 0 en una celda y 1 en la otra.';
      }
    }
    K.alTocar(svg, (m) => { if (m === sel) sec = -1; else if (nbs(sel).includes(m) && m !== sec) sec = m; else { sel = m; sec = -1; } draw(); refit(); });
    draw();
  })();
  (function () { // votador en el mapa
    const vals = [0, 0, 0, 1, 0, 1, 1, 1], sol = K.resolver(3, vals), svg = $('#c2KV'), T = $('#c2KVT'); let hl = -1, grp = false;
    function draw() {
      let h = '<tr><th>m</th><th>A</th><th>B</th><th>C</th><th>Y</th></tr>';
      for (let m = 0; m < 8; m++) h += '<tr data-m="' + m + '" class="' + (m === hl ? 'hl' : '') + '"><td class="mt">' + m + '</td><td>' + (m >> 2 & 1) + '</td><td>' + (m >> 1 & 1) + '</td><td>' + (m & 1) + '</td><td class="' + (vals[m] ? 'v1' : '') + '">' + vals[m] + '</td></tr>';
      T.innerHTML = h;
      K.dibujar(svg, 3, vals, { grupos: grp ? sol.cubos : [], cls: (m) => (m === hl ? 'hl' : '') });
      $('#c2KVExpr').innerHTML = 'Y = ' + (grp ? K.expr(sol.cubos, 3, N3, true) : '?');
      $('#c2KVGo').textContent = grp ? 'Ocultar grupos' : 'Agrupar';
    }
    T.onclick = (e) => { const tr = e.target.closest('tr[data-m]'); if (tr) { const m = +tr.dataset.m; hl = hl === m ? -1 : m; draw(); } };
    K.alTocar(svg, (m) => { hl = hl === m ? -1 : m; draw(); });
    $('#c2KVGo').onclick = () => { grp = !grp; draw(); refit(); };
    draw();
  })();
  (function () { // esquinas
    const v = Array(16).fill(0); [0, 2, 8, 10].forEach((m) => (v[m] = 1));
    const sol = K.resolver(4, v);
    K.dibujar($('#c2KR'), 4, v, { grupos: sol.cubos, blanco0: true });
    $('#c2KRExpr').innerHTML = K.expr(sol.cubos, 4, N4, true);
  })();
  (function () { // mapa interactivo
    const svg = $('#c2KS'); let nv = 3, vals = [1, 0, 1, 0, 1, 1, 1, 0], show = false;
    function draw() {
      const sol = K.resolver(nv, vals), n = nv === 4 ? N4 : N3;
      K.dibujar(svg, nv, vals, { grupos: show ? sol.cubos : [] });
      $('#c2KSExpr').innerHTML = 'Y = ' + (show ? K.expr(sol.cubos, nv, n, true) : '?');
      $('#c2KSInfo').textContent = show ? sol.cubos.length + (sol.cubos.length === 1 ? ' grupo' : ' grupos') + ' · ' + sol.lits + ' literales' : 'Piensa los grupos antes de mostrarlos.';
      $('#c2KSGo').textContent = show ? 'Ocultar grupos' : 'Mostrar grupos';
      $('#c2KS3').classList.toggle('sel', nv === 3); $('#c2KS4').classList.toggle('sel', nv === 4);
      refit();
    }
    K.alTocar(svg, (m) => { vals[m] = (vals[m] + 1) % 3; draw(); });
    const setN = (n) => { nv = n; vals = Array(1 << n).fill(0); show = false; draw(); };
    $('#c2KS3').onclick = () => setN(3); $('#c2KS4').onclick = () => setN(4);
    $('#c2KSGo').onclick = () => { show = !show; draw(); };
    $('#c2KSClr').onclick = () => { vals = Array(1 << nv).fill(0); show = false; draw(); };
    $('#c2KSRnd').onclick = () => {
      do { vals = Array.from({ length: 1 << nv }, () => { const r = Math.random(); return r < 0.42 ? 1 : nv === 4 && r < 0.52 ? 2 : 0; }); } while (!vals.includes(1) || !vals.includes(0));
      show = false; draw();
    };
    draw();
  })();
  (function () { // no importa
    const svg = $('#c2KX'), base = Array.from({ length: 16 }, (_, m) => (m >= 10 ? 2 : m >= 5 ? 1 : 0)); let use = true;
    function draw() {
      const v = use ? base : base.map((x) => (x === 2 ? 0 : x)), sol = K.resolver(4, v);
      K.dibujar(svg, 4, v, { grupos: sol.cubos });
      $('#c2KXExpr').innerHTML = 'Y = ' + K.expr(sol.cubos, 4, N4, true);
      $('#c2KXInfo').textContent = sol.cubos.length + ' términos · ' + sol.lits + ' literales' + (use ? '' : ' (sin aprovechar las X)');
      $('#c2KXUse').classList.toggle('sel', use); $('#c2KXZero').classList.toggle('sel', !use);
      refit();
    }
    $('#c2KXUse').onclick = () => { use = true; draw(); }; $('#c2KXZero').onclick = () => { use = false; draw(); };
    draw();
  })();
  (function () { // diseño de la bomba
    const PN = ['C', 'Lb', 'La'];
    // M = 'M' en la fila 110: entre los dos sensores la bomba sigue haciendo lo que hacía (memoria)
    const pumpM = (m) => ((m >> 2 & 1) && !(m & 1) ? ((m >> 1 & 1) ? 'M' : 1) : 0), pumpF = (m) => (!(m >> 1 & 1) && (m & 1) ? 1 : 0);
    const T = $('#c2PDT'), rev = Array(8).fill(false); let hl = -1;
    const WHY = ['Cisterna vacía: la bomba no debe trabajar en seco.', 'Agua arriba pero no abajo: imposible → un sensor está fallando.',
      'Cisterna vacía: no se bombea aunque el tanque esté a medias.', 'Tanque lleno y cisterna vacía: no hay nada que hacer.',
      'El agua bajó del sensor bajo: el tanque está vacío → ¡arranca la bomba!', 'Lectura imposible: alarma, y bomba apagada por seguridad.',
      'Entre los dos sensores: si la bomba estaba llenando, sigue llenando; si estaba apagada, sigue apagada. <b>La tabla no alcanza: depende de lo que pasó antes.</b>', 'El agua llegó al sensor alto: la bomba se apaga y termina el ciclo.'];
    function draw() {
      let h = '<tr><th>C</th><th>Lb</th><th>La</th><th>M</th><th>F</th></tr>';
      for (let m = 0; m < 8; m++) {
        const M = pumpM(m), F = pumpF(m);
        h += '<tr data-m="' + m + '" class="' + (m === hl ? 'hl' : '') + '"><td>' + (m >> 2 & 1) + '</td><td>' + (m >> 1 & 1) + '</td><td>' + (m & 1) + '</td>' +
          (rev[m] ? '<td class="' + (M === 'M' ? 'vx' : M ? 'v1' : '') + '">' + M + '</td><td class="' + (F ? 'al' : '') + '">' + F + '</td>' : '<td class="unk">?</td><td class="unk">?</td>') + '</tr>';
      }
      T.innerHTML = h;
      $('#c2PDWhy').innerHTML = hl < 0 ? 'Toca una fila: primero propongan qué deben valer M y F, y después revélalo.'
        : '<b>C = ' + (hl >> 2 & 1) + ', Lb = ' + (hl >> 1 & 1) + ', La = ' + (hl & 1) + '</b><br>' + WHY[hl] + '<br>→ M = ' + (pumpM(hl) === 'M' ? 'M (lo que estaba: memoria)' : pumpM(hl)) + ', F = ' + pumpF(hl);
    }
    T.onclick = (e) => { const tr = e.target.closest('tr[data-m]'); if (!tr) return; const m = +tr.dataset.m; rev[m] = true; hl = m; draw(); refit(); };
    $('#c2PDAll').onclick = () => { rev.fill(true); hl = -1; draw(); refit(); };
    // M⁺ con memoria: mapa de 4 variables (C, Lb, La y lo que estaba haciendo la bomba, M)
    const PN4 = ['C', 'Lb', 'La', 'M'];
    const vM = Array.from({ length: 16 }, (_, m) => ((m & 8) && !(m & 2) && (!(m & 4) || (m & 1)) ? 1 : 0)), vF = Array.from({ length: 8 }, (_, m) => pumpF(m)), sM = K.resolver(4, vM), sF = K.resolver(3, vF);
    $('#c2PDMaps').innerHTML = '<div class="maps m4"><div>' + K.estatico(4, vM, { nombres: PN4, grupos: sM.cubos }) + '<p class="expr">M⁺ = ' + K.expr(sM.cubos, 4, PN4, true) + '</p><p class="nota">M = lo que estaba haciendo la bomba (memoria)</p></div><div>' +
      K.estatico(3, vF, { nombres: PN, grupos: sF.cubos }) + '<p class="expr">F = ' + K.expr(sF.cubos, 3, PN, true) + '</p></div></div>';
    draw();
  })();
  (function () { // simulación de la bomba: arranca bajo Lb y para en La
    const zona = $('#c2PSZona');
    const b = D1.diag.bomba(zona, { botonesFalla: true });
    const q = $('#c2PSQ');
    q.classList.remove('oculto');
    zona.querySelector('.bomba-lado').appendChild(q);
    hooks.psim = { hide: () => b.parar() };
  })();
  (function () { // prensa
    const svg = $('#c2PR'); let I = 0, D = 0, tape = false;
    svg.innerHTML =
      '<g id="c2PRRam" style="transition:transform .45s ease-in-out"><rect x="122" y="-70" width="16" height="120" fill="#adb5bd"/><rect x="82" y="46" width="96" height="20" rx="3" fill="#868e96" stroke="#495057" stroke-width="2"/></g>' +
      '<rect x="30" y="0" width="200" height="34" fill="#495057"/><text id="c2PRY" x="130" y="23" text-anchor="middle" style="font-size:13px;font-weight:800;fill:#fff"></text>' +
      '<rect x="30" y="0" width="14" height="160" fill="#495057"/><rect x="216" y="0" width="14" height="160" fill="#495057"/>' +
      '<rect x="30" y="148" width="200" height="14" fill="#495057"/>' +
      '<rect x="105" y="132" width="50" height="16" rx="2" fill="#fab005"/>' +
      '<g id="c2PRHand"><ellipse cx="96" cy="126" rx="19" ry="9" fill="#ffc9a9" stroke="#e8590c" stroke-width="1.5"/><text x="96" y="130" text-anchor="middle" style="font-size:10px;font-weight:700;fill:#c2410c">mano</text></g>' +
      '<text id="c2PRW" class="warn" x="130" y="98">¡La mano quedó bajo la prensa!</text>' +
      [['I', 44, 'start', 64], ['D', 216, 'end', 196]].map(([n, x, a, lx]) => '<g class="pb" data-b="' + n + '"><circle class="hit" cx="' + x + '" cy="182" r="24"/><circle id="c2PRB' + n + '" cx="' + x + '" cy="182" r="14" stroke="#7a1a1a" stroke-width="2.5"/>' +
        '<text x="' + x + '" y="187" text-anchor="middle" style="font-size:14px;font-weight:800;fill:#fff;pointer-events:none">' + n + '</text></g>' +
        '<text id="c2PRL' + n + '" class="st" x="' + lx + '" y="187" text-anchor="' + a + '"></text>').join('') +
      '<rect id="c2PRTp" x="26" y="177" width="36" height="10" rx="2" fill="#adb5bd" opacity=".95" transform="rotate(-25 44 182)" style="pointer-events:none"/>';
    function draw() {
      const i = tape ? 1 : I, Y = i & D;
      $('#c2PRRam').style.transform = 'translateY(' + (Y ? 62 : 0) + 'px)';
      $('#c2PRY').textContent = 'Y = ' + Y + (Y ? ' · BAJA' : ' · arriba');
      [['I', i], ['D', D]].forEach(([n, v]) => { $('#c2PRB' + n).setAttribute('fill', v ? '#a51111' : '#e03131'); $('#c2PRL' + n).textContent = n + ' = ' + v; });
      $('#c2PRTp').style.display = tape ? '' : 'none'; $('#c2PRHand').style.display = tape ? '' : 'none';
      $('#c2PRW').style.display = tape && Y ? '' : 'none';
      $('#c2PRTape').classList.toggle('sel', tape); $('#c2PRTape').textContent = tape ? 'Quitar la cinta' : 'Poner cinta en el botón I';
    }
    svg.onclick = (e) => { const g = e.target.closest('.pb'); if (!g) return; if (g.dataset.b === 'I') { if (!tape) I ^= 1; } else D ^= 1; draw(); };
    $('#c2PRTape').onclick = () => { tape = !tape; draw(); };
    draw();
  })();
  (function () { // BCD a 7 segmentos
    const SG = D1.seg;
    const W = [8, 4, 2, 1], disp = $('#c2SSD'), map = $('#c2SSMap'), row = $('#c2SSBits'); let n = 5, seg = 'a', show = false;
    W.forEach((w) => { const c = document.createElement('div'); c.className = 'bitc'; c.innerHTML = '<span class="w8">' + w + '</span><button class="bit sm">0</button>'; c.querySelector('button').onclick = () => { n ^= w; draw(); }; row.appendChild(c); });
    disp.onclick = (e) => { const p = e.target.closest('[data-s]'); if (p) { seg = p.dataset.s; draw(); } };
    K.alTocar(map, (m) => { n = m; draw(); });
    $('#c2SSGo').onclick = () => { show = !show; draw(); };
    function draw() {
      let h = '';
      Object.keys(SG.FORMAS).forEach((s) => {
        const cls = n > 9 ? 'dc' : SG.SEG[s].includes(n) ? 'lit' : '';
        h += '<polygon class="seg ' + cls + (s === seg ? ' sel' : '') + '" data-s="' + s + '" points="' + SG.FORMAS[s].map((p) => p.join(',')).join(' ') + '"/>';
      });
      Object.keys(SG.ETQ).forEach((s) => (h += '<text class="sgl' + (s === seg ? ' sel' : '') + '" x="' + SG.ETQ[s][0] + '" y="' + (SG.ETQ[s][1] + 5) + '">' + s + '</text>'));
      disp.innerHTML = h;
      $$('.bit', row).forEach((b, i) => bitBtn(b, n & W[i] ? 1 : 0));
      $('#c2SSCap').innerHTML = n > 9 ? '<b class="warn-t">' + bin(n, 4) + ' = ' + n + ': no existe en BCD → X</b>' : 'Toca un segmento para ver su mapa';
      const vals = SG.funcion(seg), sol = K.resolver(4, vals);
      K.dibujar(map, 4, vals, { grupos: show ? sol.cubos : [], cls: (m) => (m === n ? 'cur' : '') });
      $('#c2SSExpr').innerHTML = seg + ' = ' + (show ? K.expr(sol.cubos, 4, N4, true) : '?');
      $('#c2SSGo').textContent = show ? 'Ocultar grupos' : 'Ver grupos';
      refit();
    }
    draw();
  })();

  // ---------------- arranque ----------------
  setK(k);
  montar();
  if (II.sb) {
    II.sb.auth.getSession().then(async ({ data }) => {
      if (!(data && data.session)) return;
      if (!(await verificarDocente())) return;
      // retoma la clase donde está
      const { data: fila } = await II.sb.from('estado_sesion').select('*').eq('sesion', SID).maybeSingle();
      if (fila) {
        const i = PASOS.findIndex((p) => p.id === fila.paso);
        if (i >= 0) idx = i;
        extra = fila.extra || {};
      }
      montar(); sondear(); contarGente();
    });
    II.seguirEstado(SID, (fila) => {
      if (!docente || Date.now() - ultimoLocal < 3000) return;
      const i = PASOS.findIndex((p) => p.id === fila.paso);
      const nuevoExtra = fila.extra || {};
      if (i >= 0 && i !== idx) { idx = i; extra = nuevoExtra; montar(); sondear(); }
      else if (JSON.stringify(nuevoExtra) !== JSON.stringify(extra)) { extra = nuevoExtra; montar(); }
    });
    setInterval(() => { if (docente && actDe(paso()) && fase(paso()) !== 'preparado') sondear(); }, 3000);
    setInterval(contarGente, 8000);
  }
})();
