// ============================================================
// Series de Fourier — proyección + control (celular del docente en horizontal, espejado a la TV)
// Al abrir pide la cuenta docente y retoma el paso en que quedó la clase.
// estado_sesion.extra = { abierto, fin?, seg?, rehab?: { act, c: { carnet: n } } }
//                     | { cerrado } | { dia: { fecha, acts, max } } | {}
// ============================================================
(function () {
  const $ = II.$;
  const S = FS.SESIONES['tf-fourier'];
  const SID = S.id;
  const URL_CLASE = II.urlClase(SID);
  const SEG = { rapida: 15, ejercicio: 20 };
  const LETRAS = ['A', 'B', 'C', 'D', 'E'];

  let idx = Math.max(0, Math.min(S.pasos.length - 1, II.leer('fs-proy-' + SID, 0) || 0));
  let extra = {};
  let docente = false;
  let diag = null;
  let vista = 'resultados';
  let intentoIdx = -1;
  let respuestas = [];
  let conectados = 0;
  let ultimoLocal = 0;
  let timerCierre = null;
  let timerReloj = null;

  const paso = () => S.pasos[idx];
  const actDe = (p) => (p.tipo === 'rapida' || p.tipo === 'ejercicio' ? p.id : null);
  const fase = (p) => {
    if (extra.cerrado === p.id) return 'cerrado';
    if (extra.abierto === p.id) return extra.fin ? 'cerrando' : 'abierto';
    return 'preparado';
  };
  const puntosDe = (p) => (p.tipo === 'rapida' ? 1 : FS.EJERCICIOS[p.ejercicio].puntos);
  const nombreAct = (p) => (p.tipo === 'rapida' ? 'Rápida ' + p.id.slice(1) : FS.EJERCICIOS[p.ejercicio].titulo);
  const hoy = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); };
  const fechaLocal = (iso) => { const d = iso ? new Date(iso) : new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const ddmm = (f) => f.slice(8, 10) + '/' + f.slice(5, 7);
  const nombreCorto = (n) => { const [ap, no] = String(n || '').split(', '); return no ? ap + ' ' + no.charAt(0) + '.' : ap; };
  const datosDe = (ejId, r) => FS.datosDe(ejId, r.carnet, (r.respuesta && r.respuesta.car) || '');

  // ---------------- encabezado y pie ----------------
  function cabecera() {
    const p = paso();
    let titulo = p.titulo, idea = p.idea || '';
    if (p.tipo === 'ejercicio') {
      const ej = FS.EJERCICIOS[p.ejercicio];
      titulo = 'Ejercicio: ' + ej.titulo;
      idea = fase(p) === 'cerrado'
        ? (vista === 'solucion' ? 'Solución con datos de ejemplo' : vista === 'intento' ? 'Intento de un compañero (anónimo)' : 'Resultados de la clase (anónimos)')
        : 'Cada uno trabaja en su celular con sus propios datos';
    }
    if (p.tipo === 'rapida') idea = 'Responde en tu celular · 1 punto';
    if (extra.dia && extra.dia.fecha === fechaLocal()) { titulo = 'Clase de hoy terminada'; idea = 'Nota de hoy sobre 100'; }
    $('#t-titulo').textContent = titulo;
    $('#t-idea').textContent = idea;
    $('#t-num').textContent = idx + 1 + '/' + S.pasos.length;
    $('#t-gente').textContent = '👥 ' + conectados;
    II.$$('#t-etapas button').forEach((b) => b.classList.toggle('activa', Number(b.dataset.e) === p.etapa));
  }

  function pie() {
    const p = paso();
    const acc = $('#b-acc'), ext = $('#b-extra');
    acc.className = 'tv-btn prim';
    acc.disabled = false;
    ext.classList.add('oculto');
    $('#b-ant').disabled = idx === 0;
    $('#b-sig').disabled = idx === S.pasos.length - 1;
    if (extra.dia && extra.dia.fecha === fechaLocal()) {
      acc.classList.remove('oculto');
      acc.textContent = 'Volver a la clase';
      return;
    }
    if (!actDe(p)) { acc.classList.add('oculto'); return; }
    acc.classList.remove('oculto');
    const fz = fase(p);
    if (fz === 'preparado') { acc.textContent = 'Habilitar'; acc.className = 'tv-btn ok'; }
    else if (fz === 'abierto') {
      acc.textContent = 'Cerrar';
      acc.className = 'tv-btn peligro';
      ext.classList.remove('oculto');
      ext.textContent = 'Enviaron';
    } else if (fz === 'cerrando') { acc.textContent = 'Cerrando…'; acc.disabled = true; }
    else if (p.tipo === 'rapida') { acc.textContent = 'Reabrir'; acc.className = 'tv-btn'; }
    else {
      acc.textContent = vista === 'solucion' ? 'Resultados' : 'Solución';
      ext.classList.remove('oculto');
      ext.textContent = vista === 'intento' ? 'Otro intento' : 'Intento';
    }
  }

  // ---------------- escenas ----------------
  function limpiar() {
    if (diag) { diag.destruir(); diag = null; }
    $('#cuerpo').innerHTML = '';
  }

  function escInicio() {
    const p = paso();
    $('#cuerpo').innerHTML = `<div class="esc">
      <div class="panel">
        <span class="etq">${II.esc(S.materia)}</span>
        <p class="grande">${II.esc(p.titulo)}</p>
        <p class="medio">1. Escanea el código QR<br>2. Escribe tus datos y elige tu carrera<br>3. Mira la pantalla y responde en tu celular</p>
        <p class="chico">Funciona con datos móviles: consume muy poco.</p>
      </div>
      <div class="panel centro">
        <div class="qr">${II.qrSVG(URL_CLASE, 400)}</div>
        <div class="cifra" id="c-gente">${conectados} <small>conectados</small></div>
      </div></div>`;
  }

  function escExplica() {
    const p = paso();
    diag = FS.diagrama($('#cuerpo'), { modo: p.modo, params: p.params });
  }

  function cajaFormulas(lista, titulo) {
    return `<div class="formulas-tv">${titulo ? `<span class="etq">${II.esc(titulo)}</span>` : ''}${lista.map((x) => (/:$/.test(x) ? `<div class="nota">${II.esc(x)}</div>` : `<div>${II.esc(x)}</div>`)).join('')}</div>`;
  }

  function escTeoria() {
    const p = paso();
    $('#cuerpo').innerHTML = `<div class="esc teoria">
      <div class="panel"><ul class="puntos-tv">${(p.puntos || []).map((x) => `<li>${x}</li>`).join('')}</ul></div>
      <div class="panel">${cajaFormulas(p.formulas || [], p.derecha || 'Fórmulas')}</div></div>`;
  }

  function cifraEstado() {
    const n = respuestas.length;
    const pct = conectados ? Math.round((n / conectados) * 100) : 0;
    return `${n} <small>/ ${conectados} · ${pct}%</small>`;
  }

  function panelEstado(p) {
    const fz = fase(p);
    const txt = { preparado: 'Aún cerrado', abierto: 'Abierto', cerrando: 'Cerrando', cerrado: 'Cerrado' }[fz];
    const cls = fz === 'abierto' ? 'abierto' : fz === 'cerrado' || fz === 'cerrando' ? 'cerrado' : '';
    return `<div class="panel centro">
      <span class="estado ${cls}">${txt}</span>
      <div class="${fz === 'cerrando' ? 'reloj' : 'cifra'}" id="c-cifra">${fz === 'cerrando' ? '' : cifraEstado()}</div>
      <p class="chico" id="c-sub">${fz === 'cerrando' ? 'se envía lo que tengan' : 'enviaron'}</p>
      ${fz === 'cerrado' ? '' : `<div class="qr chico">${II.qrSVG(URL_CLASE, 240)}</div>`}
    </div>`;
  }

  function escRapida() {
    const p = paso();
    const fz = fase(p);
    const conteo = p.o.map((_, k) => respuestas.filter((r) => r.respuesta && r.respuesta.opcion === k).length);
    const total = conteo.reduce((a, b) => a + b, 0) || 1;
    const ops = p.o.map((t, k) => {
      const cerr = fz === 'cerrado';
      const ancho = cerr ? (conteo[k] / total) * 100 : 0;
      return `<div class="opcion-tv ${cerr && k === p.c ? 'correcta' : ''}"><span class="barra" style="width:${ancho}%"></span>
        <span class="letra">${LETRAS[k]}</span><span class="txt">${II.esc(t)}</span>${cerr ? `<span class="n">${conteo[k]}</span>` : ''}</div>`;
    }).join('');
    const por = fz === 'cerrado' && p.por ? `<p class="medio fs-por">${II.esc(p.por)}</p>` : '';
    $('#cuerpo').innerHTML = `<div class="esc">
      <div class="panel"><p class="grande" style="font-size:calc(var(--u)*5.4)">${II.esc(p.t)}</p><div class="opciones-tv">${ops}</div>${por}</div>
      ${panelEstado(p)}</div>`;
  }

  function escEjercicio() {
    const p = paso();
    const ej = FS.EJERCICIOS[p.ejercicio];
    const fz = fase(p);
    if (fz !== 'cerrado') {
      $('#cuerpo').innerHTML = `<div class="esc">
        <div class="panel"><span class="etq">Ejercicio · ${ej.puntos} puntos</span>
          <p class="grande">${II.esc(ej.titulo)}</p>
          <p class="medio">${ej.tv}</p>
          ${ej.formulas ? cajaFormulas(ej.formulas.slice(0, 4)) : ''}</div>
        ${panelEstado(p)}</div>`;
      return;
    }
    if (vista === 'solucion') {
      const ejemplos = ej.porCarrera ? FS.CARRERAS.map((c) => ({ c, d: FS.datosDe(p.ejercicio, FS.CARNET_EJEMPLO, c) })) : [{ c: '', d: FS.datosDe(p.ejercicio, FS.CARNET_EJEMPLO, '') }];
      if (ejemplos.length > 1) {
        $('#cuerpo').innerHTML = `<div class="esc dos">${ejemplos.map((x) => `<div class="panel"><span class="etq">${II.esc(x.c)}</span><div class="fs-enun">${ej.enunciado(x.d)}</div><div class="solucion">${ej.solucion(x.d).map((l) => `<p>${l}</p>`).join('')}</div></div>`).join('')}</div>`;
      } else {
        const d = ejemplos[0].d;
        $('#cuerpo').innerHTML = `<div class="esc">
          <div class="panel fs-fig">${ej.figura ? ej.figura(d) : `<div class="fs-enun">${ej.enunciado(d)}</div>`}</div>
          <div class="panel"><span class="etq">Datos: ${II.esc(ej.resumen(d))}</span><div class="solucion">${ej.solucion(d).map((l) => `<p>${l}</p>`).join('')}</div></div></div>`;
      }
      return;
    }
    if (vista === 'intento') {
      const lista = ordenIntentos();
      if (!lista.length) { vista = 'resultados'; return escEjercicio(); }
      const k = ((intentoIdx % lista.length) + lista.length) % lista.length;
      const r = lista[k];
      const d = datosDe(p.ejercicio, r);
      const est = (r.respuesta && r.respuesta.estado) || {};
      const vacio = r.respuesta && r.respuesta.vacio;
      const ev = FS.evaluar(p.ejercicio, d, est);
      const cls = vacio ? 'mal' : ev.ok ? 'ok' : ev.puntos > 0 ? 'duda' : 'mal';
      const filas = ej.items(d).map((it) => `<tr class="${ev.det[it.id] ? 'ok' : 'mal'}"><td>${it.et}</td><td>${II.esc(FS.mostrarValor(it, est[it.id]))}</td><td>${ev.det[it.id] ? '✓' : '✗ ' + FS.valorCorrecto(it)}</td></tr>`).join('');
      $('#cuerpo').innerHTML = `<div class="esc">
        <div class="panel fs-fig">${ej.figura ? ej.figura(d) : `<div class="fs-enun">${ej.enunciado(d)}</div>`}</div>
        <div class="panel"><div class="etiqueta-intento ${cls}">Intento ${k + 1}/${lista.length} · ${vacio ? 'no respondió' : ev.puntos + ' de ' + ej.puntos + ' pts'}</div>
          <p class="chico">Sus datos: ${II.esc(ej.resumen(d))}</p>
          <table class="fs-tabla">${filas}</table></div></div>`;
      return;
    }
    $('#cuerpo').innerHTML = `<div class="esc">
      <div class="panel" id="c-items"></div>
      <div class="panel"><div class="metricas" id="c-metricas"></div><div class="lienzo-res fs-hist" id="c-hist"></div></div></div>`;
    pintarResultados();
  }

  function evaluadas() {
    const p = paso();
    return respuestas.map((r) => {
      const d = datosDe(p.ejercicio, r);
      const vacio = !!(r.respuesta && r.respuesta.vacio);
      return { r, d, vacio, ev: FS.evaluar(p.ejercicio, d, (r.respuesta && r.respuesta.estado) || {}) };
    });
  }

  function ordenIntentos() {
    // primero los errores (más útiles para discutir), luego los correctos
    return evaluadas().map((x) => ({ ...x.r, _p: x.vacio ? -1 : x.ev.puntos }))
      .sort((a, b) => a._p - b._p || String(a.carnet).localeCompare(String(b.carnet)));
  }

  function pintarResultados() {
    const p = paso();
    const ej = FS.EJERCICIOS[p.ejercicio];
    const box = $('#c-items'), met = $('#c-metricas'), hist = $('#c-hist');
    if (!box || !met || !hist) return;
    const ev = evaluadas().filter((x) => !x.vacio);
    // % de acierto por parte (los ítems son los mismos para todos, con otros números)
    const its = ej.items(FS.datosDe(p.ejercicio, FS.CARNET_EJEMPLO, FS.CARRERAS[0]));
    const its2 = ej.items(FS.datosDe(p.ejercicio, FS.CARNET_EJEMPLO, FS.CARRERAS[1]));
    const filas = its.map((it, i) => {
      const ok = ev.filter((x) => { const k = Object.keys(x.ev.det)[i]; return k && x.ev.det[k]; }).length;
      const pct = ev.length ? Math.round((ok / ev.length) * 100) : 0;
      const et = !ej.porCarrera || (its2[i] && its2[i].et === it.et) ? it.et : 'Parte ' + (i + 1);
      return `<div class="opcion-tv"><span class="barra" style="width:${pct}%;background:var(--ok-claro)"></span><span class="txt">${et}</span><span class="n">${pct}%</span></div>`;
    }).join('');
    box.innerHTML = `<span class="etq">Acierto por parte</span><div class="opciones-tv una cierre-lista">${ev.length ? filas : '<p class="chico">Aún no hay respuestas.</p>'}</div>`;
    const prom = ev.length ? ev.reduce((a, x) => a + x.ev.puntos, 0) / ev.length : NaN;
    const okTodo = ev.filter((x) => x.ev.ok).length;
    met.innerHTML = `<div class="metrica"><span>Enviaron</span><b>${ev.length}</b></div>
      <div class="metrica ok"><span>Todo correcto</span><b>${ev.length ? Math.round((okTodo / ev.length) * 100) : 0}%</b></div>
      <div class="metrica"><span>Promedio</span><b>${isFinite(prom) ? II.fmt(prom, 1) : '—'}</b></div>
      <div class="metrica"><span>Máximo</span><b>${ej.puntos}</b></div>`;
    // histograma de puntajes
    const pasos = [];
    for (let v = 0; v <= ej.puntos + 1e-9; v += ej.puntos / its.length) pasos.push(Math.round(v * 10) / 10);
    const cuenta = pasos.map((v) => ev.filter((x) => Math.abs(x.ev.puntos - v) < 0.05).length);
    hist.innerHTML = FS.barras({ vals: pasos.map((v, i) => ({ v: cuenta[i], et: II.fmt(v, 1), color: v >= ej.puntos - 1e-9 ? FS.COL.verde : v > 0 ? '#b7791f' : FS.COL.rojo })), max: Math.max(1, ...cuenta), valores: true, fmt: (x) => String(x), titulo: 'Estudiantes por puntaje', h: 320 });
  }

  // resumen de una lista de respuestas → por estudiante y por actividad
  function porEstudiante(filas) {
    const g = {};
    filas.forEach((r) => {
      if (r.actividad === 'ingreso') return;
      (g[r.carnet] = g[r.carnet] || {})[r.actividad] = Number(r.puntaje) || 0; // la última vale
    });
    return g;
  }

  async function escCierre() {
    const filas = await traerTodas(hoy());
    const acts = S.pasos.filter((p) => actDe(p));
    const hechas = acts.filter((p) => filas.some((r) => r.actividad === p.id));
    const g = porEstudiante(filas);
    const max = hechas.reduce((a, p) => a + puntosDe(p), 0);
    const notas = Object.values(g).map((x) => (max ? (hechas.reduce((a, p) => a + (x[p.id] || 0), 0) / max) * 100 : 0));
    if (paso().tipo !== 'cierre') return;
    const fila = (p) => {
      const rs = filas.filter((r) => r.actividad === p.id);
      const ult = {};
      rs.forEach((r) => { ult[r.carnet] = r; });
      const v = Object.values(ult);
      const pct = v.length ? Math.round((v.filter((r) => r.correcta).length / v.length) * 100) : 0;
      return `<div class="opcion-tv"><span class="barra" style="width:${pct}%;background:var(--ok-claro)"></span><span class="txt">${II.esc(nombreAct(p))}</span><span class="n">${pct}%</span></div>`;
    };
    $('#cuerpo').innerHTML = `<div class="esc">
      <div class="panel" style="gap:calc(var(--u)*1)"><span class="etq">Hoy: acierto por actividad</span><div class="opciones-tv una cierre-lista fs-scroll">${hechas.map(fila).join('') || '<p class="chico">Aún no hay respuestas hoy.</p>'}</div></div>
      <div class="panel"><div class="metricas">
        <div class="metrica"><span>Participaron</span><b>${notas.length}</b></div>
        <div class="metrica ok"><span>Promedio /100</span><b>${notas.length ? II.fmt(notas.reduce((a, b) => a + b, 0) / notas.length, 0) : '—'}</b></div>
      </div><p class="medio">${hechas.length} actividades · ${max} puntos posibles hoy</p><p class="chico">${II.esc(paso().idea)}</p></div></div>`;
  }

  async function escDia() {
    const dia = extra.dia;
    $('#cuerpo').innerHTML = `<div class="esc"><div class="panel centro"><p class="grande">Calculando la nota de hoy…</p></div><div class="panel"></div></div>`;
    const filas = await traerTodas(hoy());
    if (!(extra.dia && extra.dia.fecha === dia.fecha)) return;
    const g = porEstudiante(filas);
    const notas = Object.values(g).map((x) => (dia.max ? (dia.acts.reduce((a, id) => a + (x[id] || 0), 0) / dia.max) * 100 : 0));
    const prom = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : NaN;
    const rangos = [[0, 50], [50, 70], [70, 90], [90, 101]];
    const cuenta = rangos.map(([a, b]) => notas.filter((n) => n >= a && n < b).length);
    $('#cuerpo').innerHTML = `<div class="esc">
      <div class="panel"><span class="etq">Clase del ${ddmm(dia.fecha)} · nota sobre 100</span>
        <div class="lienzo-res" style="flex:1">${FS.barras({ vals: rangos.map(([a, b], i) => ({ v: cuenta[i], et: a + '–' + Math.min(100, b - 1), color: i === 0 ? FS.COL.rojo : i === 3 ? FS.COL.verde : FS.COL.azul })), max: Math.max(1, ...cuenta), valores: true, fmt: (x) => String(x), titulo: 'Estudiantes por nota', h: 380 })}</div></div>
      <div class="panel"><div class="metricas">
        <div class="metrica"><span>Participaron</span><b>${notas.length}</b></div>
        <div class="metrica ok"><span>Promedio</span><b>${isFinite(prom) ? II.fmt(prom, 0) : '—'}</b></div>
        <div class="metrica"><span>Actividades</span><b>${dia.acts.length}</b></div>
        <div class="metrica"><span>Puntos posibles</span><b>${dia.max}</b></div>
      </div><p class="medio">Cada uno ve su nota de hoy en su celular. La próxima clase continúa desde aquí con otra nota sobre 100.</p></div></div>`;
  }

  function montar() {
    limpiar();
    const p = paso();
    if (p.tipo !== 'ejercicio') vista = 'resultados';
    cabecera();
    pie();
    if (extra.dia && extra.dia.fecha === fechaLocal()) { escDia(); return; }
    if (p.tipo === 'inicio') escInicio();
    else if (p.tipo === 'explica') escExplica();
    else if (p.tipo === 'teoria') escTeoria();
    else if (p.tipo === 'rapida') escRapida();
    else if (p.tipo === 'ejercicio') escEjercicio();
    else if (p.tipo === 'cierre') { $('#cuerpo').innerHTML = '<div class="esc"><div class="panel centro"><p class="grande">Cargando el resumen…</p></div><div class="panel"></div></div>'; if (docente) escCierre(); }
    vigilarCierre();
  }

  // refresca contadores sin desmontar el diagrama que el docente está moviendo
  function refrescar() {
    const p = paso();
    cabecera();
    if (extra.dia && extra.dia.fecha === fechaLocal()) return;
    if (p.tipo === 'inicio') { const c = $('#c-gente'); if (c) c.innerHTML = `${conectados} <small>conectados</small>`; return; }
    if (p.tipo === 'rapida') { if (fase(p) === 'cerrado') escRapida(); else actualizarCifra(); return; }
    if (p.tipo === 'ejercicio') {
      if (fase(p) !== 'cerrado') actualizarCifra();
      else if (vista === 'resultados') pintarResultados();
    }
  }
  function actualizarCifra() {
    const c = $('#c-cifra');
    if (c && fase(paso()) !== 'cerrando') c.innerHTML = cifraEstado();
  }

  // ---------------- cuenta regresiva del cierre ----------------
  function vigilarCierre() {
    clearInterval(timerReloj);
    clearTimeout(timerCierre);
    const p = paso();
    if (fase(p) !== 'cerrando') return;
    const fin = new Date(extra.fin).getTime();
    const tic = () => {
      const r = Math.max(0, Math.ceil((fin - Date.now()) / 1000));
      const c = $('#c-cifra');
      if (c) c.textContent = r;
      if (r <= 0) clearInterval(timerReloj);
    };
    tic();
    timerReloj = setInterval(tic, 250);
    timerCierre = setTimeout(() => {
      if (extra.abierto === p.id && paso().id === p.id) cambiarExtra({ cerrado: p.id });
    }, Math.max(0, fin - Date.now()) + 2000);
  }

  // ---------------- acciones ----------------
  async function cambiarExtra(nuevo) {
    extra = nuevo;
    ultimoLocal = Date.now();
    montar();
    if (docente) {
      const { data, error } = await II.sb.from('estado_sesion')
        .update({ extra: nuevo, actualizado: new Date().toISOString() })
        .eq('sesion', SID).select();
      if (error || !data || !data.length) aviso('No se pudo guardar el cambio. Revisa la conexión.');
    }
  }

  async function irA(nuevo) {
    if (!docente) return pedirIngreso();
    if (nuevo < 0 || nuevo >= S.pasos.length || nuevo === idx) return;
    const ant = paso();
    if (actDe(ant) && (fase(ant) === 'abierto' || fase(ant) === 'cerrando')) aviso('La actividad anterior quedó cerrada: cada celular envía lo que tenía.');
    idx = nuevo;
    extra = {};
    vista = 'resultados';
    intentoIdx = -1;
    respuestas = [];
    ultimoLocal = Date.now();
    II.guardar('fs-proy-' + SID, idx);
    montar();
    const r = await II.fijarPaso(SID, paso().id, {});
    if (!r.ok) aviso('No se pudo cambiar el paso: ' + r.error);
    sondear();
  }

  function accion() {
    if (!docente) return pedirIngreso();
    if (extra.dia && extra.dia.fecha === fechaLocal()) {
      const { dia, ...resto } = extra;
      return cambiarExtra(resto);
    }
    const p = paso();
    const fz = fase(p);
    if (fz === 'preparado') return cambiarExtra({ abierto: p.id });
    if (fz === 'abierto') {
      const seg = SEG[p.tipo] || 15;
      return cambiarExtra({ ...extra, abierto: p.id, seg, fin: new Date(Date.now() + seg * 1000).toISOString() });
    }
    if (fz === 'cerrado') {
      if (p.tipo === 'rapida') return cambiarExtra({ abierto: p.id });
      vista = vista === 'solucion' ? 'resultados' : 'solucion';
      montar();
    }
  }

  function accionExtra() {
    const p = paso();
    if (fase(p) === 'abierto') return listaEnviaron();
    if (vista !== 'intento') { vista = 'intento'; intentoIdx = 0; }
    else intentoIdx++;
    montar();
  }

  // ---------------- habilitar de nuevo (mientras la actividad está abierta) ----------------
  function listaEnviaron() {
    const p = paso();
    const reh = (extra.rehab && extra.rehab.act === p.id && extra.rehab.c) || {};
    const lista = respuestas.slice().sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'));
    const filas = lista.map((r) => {
      const n = reh[r.carnet] || 0;
      const yaReenvio = r.respuesta && (r.respuesta.rehab || 0) >= n && n > 0;
      const estado = n > 0 && !yaReenvio ? '<small class="fs-hab">habilitado · esperando su envío</small>' : yaReenvio ? '<small class="fs-hab">reenvió</small>' : '';
      return `<div class="fs-env"><span>${II.esc(nombreCorto(r.nombre))}${r.respuesta && r.respuesta.vacio ? ' <small>(no respondió)</small>' : ''}${estado}</span><button class="boton" data-c="${II.esc(r.carnet)}">Habilitar</button></div>`;
    }).join('');
    const capa = II.html(`<div class="capa"><div class="dialogo ancho">
      <h2>Enviaron (${lista.length})</h2>
      <p>Toca <b>Habilitar</b> para que ese estudiante pueda corregir y volver a enviar. Vale su último envío. Solo funciona mientras la actividad está abierta.</p>
      <div class="lista-pasos">${filas || '<p>Todavía nadie envió.</p>'}</div>
      <div class="fila-bt"><button class="boton" data-x>Cerrar</button></div></div></div>`);
    document.body.appendChild(capa);
    capa.onclick = (e) => {
      if (e.target === capa || e.target.closest('[data-x]')) return capa.remove();
      const bt = e.target.closest('[data-c]');
      if (!bt) return;
      if (fase(paso()) !== 'abierto' || paso().id !== p.id) { capa.remove(); return aviso('La actividad ya no está abierta.'); }
      const c = bt.dataset.c;
      const prev = (extra.rehab && extra.rehab.act === p.id && extra.rehab.c) || {};
      const nuevo = { ...prev, [c]: (prev[c] || 0) + 1 };
      capa.remove();
      cambiarExtra({ ...extra, rehab: { act: p.id, c: nuevo } });
      aviso('Habilitado: ' + nombreCorto((lista.find((r) => r.carnet === c) || {}).nombre) + ' puede volver a enviar.');
    };
  }

  // ---------------- terminar la clase de hoy ----------------
  async function terminarDia() {
    if (!docente) return pedirIngreso();
    const p = paso();
    if (actDe(p) && (fase(p) === 'abierto' || fase(p) === 'cerrando')) return aviso('Primero cierra la actividad abierta.');
    aviso('Calculando la nota de hoy…');
    let filas;
    try { filas = await traerTodas(hoy()); } catch (e) { return aviso('Sin conexión. Intenta de nuevo.'); }
    const acts = S.pasos.filter((x) => actDe(x) && filas.some((r) => r.actividad === x.id)).map((x) => x.id);
    const max = acts.reduce((a, id) => a + puntosDe(S.pasos.find((x) => x.id === id)), 0);
    cambiarExtra({ ...extra, dia: { fecha: fechaLocal(), acts, max } });
  }

  let avisoT = null;
  function aviso(txt) {
    const a = $('#aviso');
    a.textContent = txt;
    a.classList.remove('oculto');
    clearTimeout(avisoT);
    avisoT = setTimeout(() => a.classList.add('oculto'), 4000);
  }

  // ---------------- datos (solo docente) ----------------
  // trae todas las respuestas de la sesión (desde una fecha), por partes de 1000
  async function traerTodas(desde) {
    let todas = [];
    for (let i = 0; i < 20; i++) {
      let q = II.sb.from('respuestas').select('actividad,carnet,nombre,respuesta,correcta,puntaje,creado').eq('sesion', SID);
      if (desde) q = q.gte('creado', desde);
      const { data, error } = await q.order('creado', { ascending: true }).range(i * 1000, i * 1000 + 999);
      if (error) throw error;
      todas = todas.concat(data || []);
      if (!data || data.length < 1000) break;
    }
    return todas;
  }

  async function sondear() {
    if (!docente) return;
    const p = paso();
    const act = actDe(p);
    try {
      if (act) {
        const { data, error } = await II.sb.from('respuestas')
          .select('carnet,nombre,respuesta,correcta,puntaje,creado')
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
      const { data, error } = await II.sb.from('ingresos').select('carnet').eq('sesion', SID).gte('creado', hoy());
      if (error) throw error;
      conectados = new Set((data || []).map((r) => r.carnet)).size;
    } catch (e) { /* sin red */ }
    refrescar();
  }

  // ---------------- docente: ingreso obligatorio ----------------
  let capaIngreso = null;
  function pedirIngreso(msg) {
    if (capaIngreso) return;
    capaIngreso = II.html(`<div class="capa ingreso"><form class="dialogo">
      <span class="etq">${II.esc(S.materia)}</span>
      <h2>${II.esc(S.titulo)}</h2>
      <p>Entra con tu cuenta docente (la misma de las otras materias). Hazlo <b>antes de proyectar</b>: el celular la recuerda.</p>
      <input name="email" type="email" placeholder="Correo" autocomplete="username" required>
      <input name="clave" type="password" placeholder="Contraseña" autocomplete="current-password" required>
      <div class="error">${II.esc(msg || '')}</div>
      <div class="fila-bt"><button class="boton prim">Entrar a la clase</button></div>
    </form></div>`);
    document.body.appendChild(capaIngreso);
    capaIngreso.querySelector('form').onsubmit = async (ev) => {
      ev.preventDefault();
      const err = capaIngreso.querySelector('.error');
      if (!II.sb) { err.textContent = 'Sin conexión con la base de datos. Revisa internet y recarga la página.'; return; }
      const fd = new FormData(ev.target);
      err.textContent = 'Entrando…';
      const { error } = await II.sb.auth.signInWithPassword({ email: String(fd.get('email')).trim(), password: String(fd.get('clave')) });
      if (error) { err.textContent = /fetch|network/i.test(error.message || '') ? 'Sin internet. Revisa la conexión.' : 'No se pudo entrar: revisa correo y contraseña.'; return; }
      if (!(await verificarDocente())) { err.textContent = 'Esta cuenta no tiene permiso de docente.'; await II.sb.auth.signOut(); return; }
      capaIngreso.remove();
      capaIngreso = null;
      retomar();
    };
  }

  // la pantalla vuelve al paso en que está la clase (no la reinicia)
  async function retomar() {
    try {
      const { data: fila } = await II.sb.from('estado_sesion').select('*').eq('sesion', SID).maybeSingle();
      if (fila) {
        const i = S.pasos.findIndex((p) => p.id === fila.paso);
        if (i >= 0) idx = i;
        extra = fila.extra || {};
      }
    } catch (e) { /* sin red: sigue con lo local */ }
    montar();
    sondear();
    contarGente();
  }

  async function verificarDocente() {
    try {
      const { data, error } = await II.sb.from('docentes').select('email').limit(1);
      docente = !error && !!(data && data.length);
    } catch (e) { docente = false; }
    pie();
    return docente;
  }

  // ---------------- menú ⋮ ----------------
  function menu() {
    const it = (k, t, sub) => `<button class="menu-it" data-m="${k}">${t}${sub ? `<small>${sub}</small>` : ''}</button>`;
    const capa = II.html(`<div class="capa"><div class="dialogo">
      <h2>${II.esc(S.titulo)}</h2>
      ${it('pasos', 'Ir a un paso…', 'Lista de todas las pantallas, por etapa')}
      ${it('dia', 'Terminar la clase de hoy', 'Muestra la nota de hoy sobre 100. La próxima clase sigue desde aquí con otra nota')}
      ${it('notas', 'Descargar notas (Excel)', 'Una nota sobre 100 por cada fecha de clase')}
      ${it('salir', 'Salir de la cuenta docente', '')}
      <div class="fila-bt"><button class="boton" data-x>Cerrar</button></div></div></div>`);
    document.body.appendChild(capa);
    capa.onclick = async (e) => {
      if (e.target === capa || e.target.closest('[data-x]')) return capa.remove();
      const bt = e.target.closest('[data-m]');
      if (!bt) return;
      capa.remove();
      const m = bt.dataset.m;
      if (m === 'pasos') listaPasos();
      else if (m === 'dia') terminarDia();
      else if (m === 'notas') descargarNotas();
      else if (m === 'salir') { await II.sb.auth.signOut(); docente = false; pedirIngreso(); }
    };
  }

  const TIPO = { inicio: 'Inicio', explica: 'Diagrama', teoria: 'Teoría', rapida: 'Rápida', ejercicio: 'Ejercicio', cierre: 'Cierre' };
  function listaPasos() {
    let etapa = 0;
    const filas = S.pasos.map((p, i) => {
      const t = p.tipo === 'ejercicio' ? FS.EJERCICIOS[p.ejercicio].titulo : p.tipo === 'rapida' ? p.t : p.titulo;
      const sep = p.etapa !== etapa ? `<div class="fs-sep">Etapa ${(etapa = p.etapa)} · ${FS.ETAPAS[p.etapa - 1]}</div>` : '';
      return sep + `<button class="paso-it ${i === idx ? 'actual' : ''} t-${p.tipo}" data-i="${i}"><span class="n">${i + 1}</span><span class="tp">${TIPO[p.tipo] || ''}</span><span class="tt">${II.esc(t)}</span></button>`;
    }).join('');
    const capa = II.html(`<div class="capa"><div class="dialogo ancho"><h2>Ir a un paso</h2><div class="lista-pasos">${filas}</div>
      <div class="fila-bt"><button class="boton" data-x>Cerrar</button></div></div></div>`);
    document.body.appendChild(capa);
    const act = capa.querySelector('.actual');
    if (act) act.scrollIntoView({ block: 'center' });
    capa.onclick = (e) => {
      if (e.target === capa || e.target.closest('[data-x]')) return capa.remove();
      const bt = e.target.closest('[data-i]');
      if (!bt) return;
      capa.remove();
      irA(Number(bt.dataset.i));
    };
  }

  // ---------------- notas (CSV que abre Excel): una nota /100 por fecha ----------------
  async function descargarNotas() {
    if (!docente) return pedirIngreso();
    aviso('Preparando las notas…');
    try {
      const ingresos = [];
      for (let i = 0; i < 20; i++) {
        const { data, error } = await II.sb.from('ingresos').select('carnet,nombre,info,creado').eq('sesion', SID).order('creado', { ascending: true }).range(i * 1000, i * 1000 + 999);
        if (error) throw error;
        ingresos.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      const resp = await traerTodas(null);
      const acts = S.pasos.filter(actDe);
      const gente = {};
      const persona = (c, n) => (gente[c] = gente[c] || { nombre: n || '', info: {}, dias: new Set(), pts: {}, rehab: new Set() });
      ingresos.forEach((r) => {
        const g = persona(r.carnet, r.nombre);
        g.nombre = r.nombre;
        g.info = { ...g.info, ...(r.info || {}) };
        g.dias.add(fechaLocal(r.creado));
      });
      // fecha de cada actividad = fecha de su primera respuesta
      const fechaAct = {};
      resp.forEach((r) => {
        if (r.actividad === 'ingreso') return;
        if (!fechaAct[r.actividad]) fechaAct[r.actividad] = fechaLocal(r.creado);
        const g = persona(r.carnet, r.nombre);
        g.pts[r.actividad] = Number(r.puntaje) || 0; // la última respuesta vale
        g.dias.add(fechaLocal(r.creado));
        if (r.respuesta && r.respuesta.rehab) g.rehab.add(r.actividad);
      });
      const fechas = Array.from(new Set(Object.values(fechaAct))).sort();
      const num = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
      const cel = (v) => '"' + String(v).replace(/"/g, '""') + '"';
      const cab = ['C.U.', 'C.I.', 'Apellidos', 'Nombres', 'Carrera'];
      const porFecha = fechas.map((fe) => ({ fe, acts: acts.filter((p) => fechaAct[p.id] === fe) }));
      porFecha.forEach(({ fe, acts: as }) => {
        as.forEach((p) => cab.push(ddmm(fe) + ' ' + nombreAct(p) + ' (' + puntosDe(p) + ')'));
        cab.push(ddmm(fe) + ' Asistencia', ddmm(fe) + ' Puntos', ddmm(fe) + ' Máximo', ddmm(fe) + ' Nota /100');
      });
      cab.push('Habilitado de nuevo en');
      const filas = [cab.map(cel).join(';')];
      Object.entries(gente)
        .sort((a, b) => String(a[1].info.apellidos || a[1].nombre).localeCompare(String(b[1].info.apellidos || b[1].nombre), 'es'))
        .forEach(([c, g]) => {
          const [ap, no] = String(g.nombre).split(', ');
          const fila = [cel(c), cel(g.info.ci || ''), cel(g.info.apellidos || ap || ''), cel(g.info.nombres || no || ''), cel(g.info.carrera || '')];
          porFecha.forEach(({ fe, acts: as }) => {
            let tot = 0;
            as.forEach((p) => { const x = g.pts[p.id]; tot += x || 0; fila.push(x == null ? '0' : num(x)); });
            const max = as.reduce((a, p) => a + puntosDe(p), 0);
            fila.push(cel(g.dias.has(fe) ? 'Sí' : 'No'), num(tot), String(max), max ? num((tot / max) * 100) : '0');
          });
          fila.push(cel(Array.from(g.rehab).map((id) => nombreAct(S.pasos.find((p) => p.id === id) || { tipo: 'rapida', id })).join(', ')));
          filas.push(fila.join(';'));
        });
      const blob = new Blob(['﻿' + filas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'notas-transformadas-fourier-' + fechaLocal() + '.csv';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      aviso('Notas descargadas: ' + Object.keys(gente).length + ' estudiantes, ' + fechas.length + ' fecha(s).');
    } catch (e) { aviso('No se pudieron descargar las notas. Revisa la conexión.'); }
  }

  // ---------------- pantalla completa y QR ----------------
  async function pantallaCompleta() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
        try { await screen.orientation.lock('landscape'); } catch (e) { /* no soportado */ }
      } else await document.exitFullscreen();
    } catch (e) { aviso('Tu navegador no permitió la pantalla completa.'); }
    pedirPantallaEncendida();
  }
  let bloqueo = null;
  async function pedirPantallaEncendida() {
    try { if ('wakeLock' in navigator && !bloqueo) { bloqueo = await navigator.wakeLock.request('screen'); bloqueo.addEventListener('release', () => { bloqueo = null; }); } } catch (e) { /* nada */ }
  }
  function verQR() {
    const capa = II.html(`<div class="capa" style="background:rgba(244,246,249,.97)"><div class="panel centro" style="width:92vw;height:88vh;flex-direction:row;gap:calc(var(--u)*6)">
      <div class="qr">${II.qrSVG(URL_CLASE, 400)}</div>
      <div style="text-align:left;max-width:45%"><p class="grande">Entra a la clase</p><p class="url" style="font-size:calc(var(--u)*3.4)">${II.esc(URL_CLASE.replace(/^https?:\/\//, ''))}</p><p class="chico">Toca para cerrar</p></div>
    </div></div>`);
    capa.onclick = () => capa.remove();
    document.body.appendChild(capa);
  }

  // ---------------- arranque ----------------
  function iniciar() {
    $('#t-etapas').innerHTML = FS.ETAPAS.map((t, i) => `<button data-e="${i + 1}"><b>${i + 1}</b> ${t}</button>`).join('');
    $('#t-etapas').onclick = (e) => {
      const b = e.target.closest('[data-e]');
      if (!b) return;
      if (!docente) return pedirIngreso();
      const i = S.pasos.findIndex((p) => p.etapa === Number(b.dataset.e));
      if (i >= 0) irA(i);
    };
    $('#b-ant').onclick = () => irA(idx - 1);
    $('#b-sig').onclick = () => irA(idx + 1);
    $('#b-acc').onclick = accion;
    $('#b-extra').onclick = accionExtra;
    $('#b-pant').onclick = pantallaCompleta;
    $('#b-qr').onclick = verQR;
    $('#b-menu').onclick = () => (docente ? menu() : pedirIngreso());
    $('#t-num').onclick = () => (docente ? listaPasos() : pedirIngreso());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') irA(idx + 1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') irA(idx - 1);
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) pedirPantallaEncendida(); });
    II.alCambiarConexion((ok) => { const d = $('#t-con'); d.classList.toggle('on', ok); d.classList.toggle('off', !ok); });
    montar();
    if (!II.sb) return pedirIngreso('Sin conexión con la base de datos. Revisa internet y recarga la página.');
    II.sb.auth.getSession().then(async ({ data }) => {
      if (!(data && data.session)) return pedirIngreso();
      if (!(await verificarDocente())) return pedirIngreso('Esta cuenta no tiene permiso de docente.');
      retomar();
    }).catch(() => pedirIngreso('Sin internet. Revisa la conexión.'));
    II.seguirEstado(SID, (fila) => {
      if (!docente || Date.now() - ultimoLocal < 3000) return;
      const i = S.pasos.findIndex((p) => p.id === fila.paso);
      const nuevoExtra = fila.extra || {};
      if (i >= 0 && i !== idx) { idx = i; extra = nuevoExtra; montar(); sondear(); }
      else if (JSON.stringify(nuevoExtra) !== JSON.stringify(extra)) { extra = nuevoExtra; montar(); }
    });
    setInterval(() => { if (actDe(paso()) && fase(paso()) !== 'preparado') sondear(); }, 3000);
    setInterval(contarGente, 8000);
  }
  iniciar();
})();
