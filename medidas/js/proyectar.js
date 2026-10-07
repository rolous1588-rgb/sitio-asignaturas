// ============================================================
// Proyección + control (el celular del docente, en horizontal, espejado a la TV)
// Uso oficial: al abrir pide la cuenta docente y retoma el paso en que quedó la clase.
// estado_sesion.extra = { abierto: id, fin, seg } | { cerrado: id } | {}
// ============================================================
(function () {
  const $ = II.$;
  const S = FP.SESIONES[II.params.get('s')] || FP.SESIONES['me-fp1'];
  const SID = S.id;
  const URL_CLASE = II.urlClase(SID);
  const SEG = { rapida: 12, ejercicio: 15 };

  let idx = Math.max(0, Math.min(S.pasos.length - 1, II.leer('me-proy-' + SID, 0) || 0));
  let extra = {};
  let docente = false;
  let diag = null;
  let vista = 'resultados';
  let intentoIdx = -1;
  let respuestas = [];
  let todas = [];
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
  const mediana = (arr) => {
    const a = arr.filter((x) => isFinite(x)).sort((x, y) => x - y);
    if (!a.length) return NaN;
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  };
  const LETRAS = ['A', 'B', 'C', 'D', 'E'];
  const puntosDe = (p) => (p.tipo === 'rapida' ? 1 : FP.EJERCICIOS[p.ejercicio].puntos);
  const nombreAct = (p) => (p.tipo === 'rapida' ? 'Predicción ' + p.id.slice(1) : FP.EJERCICIOS[p.ejercicio].titulo);
  const hoy = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); };

  // ---------------- encabezado y pie ----------------
  function cabecera() {
    const p = paso();
    let titulo = p.titulo, idea = p.idea || '';
    if (p.tipo === 'ejercicio') {
      const ej = FP.EJERCICIOS[p.ejercicio];
      titulo = 'Ejercicio: ' + ej.titulo;
      idea = fase(p) === 'cerrado'
        ? (vista === 'solucion' ? 'Solución con datos de ejemplo' : vista === 'intento' ? 'Intento de un compañero (anónimo)' : 'Resultados de la clase (anónimos)')
        : 'Cada uno trabaja en su celular con sus propios datos';
    }
    if (p.tipo === 'rapida') idea = 'Responde en tu celular · 1 punto';
    if (p.tipo === 'teoria' && !idea) idea = 'Teoría';
    $('#t-titulo').textContent = titulo;
    $('#t-idea').textContent = idea;
    $('#t-num').textContent = idx + 1 + '/' + S.pasos.length;
    $('#t-gente').textContent = '👥 ' + conectados;
  }

  function pie() {
    const p = paso();
    const acc = $('#b-acc'), ext = $('#b-extra');
    acc.className = 'tv-btn prim';
    acc.disabled = false;
    ext.classList.add('oculto');
    $('#b-ant').disabled = idx === 0;
    $('#b-sig').disabled = idx === S.pasos.length - 1;
    if (!actDe(p)) { acc.classList.add('oculto'); }
    else {
      acc.classList.remove('oculto');
      const fz = fase(p);
      if (fz === 'preparado') { acc.textContent = 'Habilitar'; acc.className = 'tv-btn ok'; }
      else if (fz === 'abierto') { acc.textContent = 'Cerrar'; acc.className = 'tv-btn peligro'; }
      else if (fz === 'cerrando') { acc.textContent = 'Cerrando…'; acc.disabled = true; }
      else if (p.tipo === 'rapida') { acc.textContent = 'Reabrir'; acc.className = 'tv-btn'; }
      else {
        acc.textContent = vista === 'solucion' ? 'Resultados' : 'Solución';
        ext.classList.remove('oculto');
        ext.textContent = vista === 'intento' ? 'Otro intento' : 'Intento';
      }
    }

  }

  // ---------------- escenas ----------------
  function limpiar() {
    if (diag) { diag.destruir(); diag = null; }
    $('#cuerpo').innerHTML = '';
  }

  function montarDiagrama(nombre, opc, encima) {
    const c = $('#cuerpo');
    diag = FP.diagramas[nombre](c, opc || {});
    if (encima) {
      const lado = c.querySelector('.dg-lado');
      lado.insertBefore(encima, lado.firstChild);
    }
  }

  function escInicio() {
    const p = paso();
    $('#cuerpo').innerHTML = `<div class="esc">
      <div class="panel">
        <span class="etq">${II.esc(S.materia)}</span>
        <p class="grande">${II.esc(p.titulo)}</p>
        <p class="medio">1. Escanea el código QR<br>2. Escribe tu nombre y carnet<br>3. Mira la pantalla y responde en tu celular</p>
        <p class="chico">Funciona con datos móviles: consume muy poco.</p>
      </div>
      <div class="panel centro">
        <div class="qr">${II.qrSVG(URL_CLASE, 400)}</div>
        <div class="cifra" id="c-gente">${conectados} <small>conectados</small></div>
      </div></div>`;
  }

  function escExplica() {
    const p = paso();
    montarDiagrama(p.diagrama, { inicial: p.inicial, params: p.params });
  }

  function cajaFormulas(lista, titulo, texto) {
    return `<div class="formulas-tv${texto ? ' texto' : ''}">${titulo ? `<span class="etq">${II.esc(titulo)}</span>` : ''}${lista.map((x) => (/:$/.test(x) ? `<div class="nota">${II.esc(x)}</div>` : `<div>${II.esc(x)}</div>`)).join('')}</div>`;
  }

  function escTeoria() {
    const p = paso();
    $('#cuerpo').innerHTML = `<div class="esc teoria">
      <div class="panel"><ul class="puntos-tv">${(p.puntos || []).map((x) => `<li>${x}</li>`).join('')}</ul></div>
      <div class="panel">${cajaFormulas(p.formulas || [], p.derecha || 'Fórmulas', p.derechaTexto)}</div></div>`;
  }

  function panelEstado(p) {
    const fz = fase(p);
    const txt = { preparado: 'Aún cerrado', abierto: 'Abierto', cerrando: 'Cerrando', cerrado: 'Cerrado' }[fz];
    const cls = fz === 'abierto' ? 'abierto' : fz === 'cerrado' || fz === 'cerrando' ? 'cerrado' : '';
    return `<div class="panel centro">
      <span class="estado ${cls}">${txt}</span>
      <div class="${fz === 'cerrando' ? 'reloj' : 'cifra'}" id="c-cifra">${fz === 'cerrando' ? '' : respuestas.length + ' <small>/ ' + conectados + '</small>'}</div>
      <p class="chico" id="c-sub">${fz === 'cerrando' ? 'se envía lo que tengan' : 'respuestas recibidas'}</p>
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
    $('#cuerpo').innerHTML = `<div class="esc">
      <div class="panel"><p class="grande" style="font-size:calc(var(--u)*5.4)">${II.esc(p.t)}</p><div class="opciones-tv">${ops}</div></div>
      ${panelEstado(p)}</div>`;
  }

  function escEjercicio() {
    const p = paso();
    const ej = FP.EJERCICIOS[p.ejercicio];
    const fz = fase(p);
    if (fz !== 'cerrado') {
      $('#cuerpo').innerHTML = `<div class="esc">
        <div class="panel"><span class="etq">Ejercicio · ${ej.puntos} puntos</span>
          <p class="grande">${II.esc(ej.titulo)}</p>
          <p class="medio">${ej.tv}</p>
          ${ej.formulas ? cajaFormulas(ej.formulas.slice(0, 3)) : ''}</div>
        ${panelEstado(p)}</div>`;
      return;
    }
    if (vista === 'solucion') {
      const d = FP.datosDe(p.ejercicio, FP.CARNET_EJEMPLO);
      const sol = ej.solucion(d);
      const caja = document.createElement('div');
      caja.className = 'solucion';
      caja.innerHTML = sol.pasos.map((x) => `<p>${x}</p>`).join('');
      const o = ej.opciones(d);
      montarDiagrama(ej.diagrama, { ...o, inicial: { ...(o.inicial || {}), ...sol.estado }, revelado: true }, caja);
      return;
    }
    if (vista === 'intento') {
      const lista = ordenIntentos();
      if (!lista.length) { vista = 'resultados'; return escEjercicio(); }
      const r = lista[((intentoIdx % lista.length) + lista.length) % lista.length];
      const d = FP.datosDe(p.ejercicio, r.carnet);
      const est = (r.respuesta && r.respuesta.estado) || {};
      const ev = r.respuesta && r.respuesta.vacio ? null : ej.evaluar(est, d);
      const caja = document.createElement('div');
      const cls = !ev ? 'mal' : ev.puntos >= ej.puntos ? 'ok' : ev.puntos > 0 ? 'duda' : 'mal';
      caja.className = 'etiqueta-intento ' + cls;
      const mov = r.respuesta && r.respuesta.mov != null ? r.respuesta.mov + ' mov.' : '';
      const seg = r.respuesta && r.respuesta.seg != null ? r.respuesta.seg + ' s' : '';
      caja.innerHTML = `Intento ${(((intentoIdx % lista.length) + lista.length) % lista.length) + 1}/${lista.length} · ${ev ? ev.puntos + ' pts' : 'no respondió'} · ${[mov, seg].filter(Boolean).join(' · ')}<br><span style="font-weight:600;color:var(--texto)">Sus datos: ${ej.resumen ? ej.resumen(d) : ''}</span>`;
      const o = ej.opciones(d);
      if (ej.tipo === 'numerico') {
        montarDiagrama(ej.diagrama, { ...o, revelado: true }, caja);
        const sol = document.createElement('div');
        sol.className = 'solucion';
        sol.innerHTML = `<p>Escribió: FP ${II.esc(est.fp || '—')} · Bs ${II.esc(est.bs || '—')}</p>`;
        caja.after(sol);
      } else {
        montarDiagrama(ej.diagrama, { ...o, inicial: { ...(o.inicial || {}), ...est }, revelado: true }, caja);
      }
      return;
    }
    // resultados
    $('#cuerpo').innerHTML = `<div class="esc">
      <div class="lienzo-res" id="c-grafico"></div>
      <div class="panel"><div class="metricas" id="c-metricas"></div>
        <p class="chico">Cada punto es un estudiante (anónimo). Verde = correcto.</p></div></div>`;
    pintarResultados();
  }

  function ordenIntentos() {
    // primero los errores (más útiles para discutir), luego los correctos
    const p = paso(), ej = FP.EJERCICIOS[p.ejercicio];
    return respuestas.slice().map((r) => {
      const d = FP.datosDe(p.ejercicio, r.carnet);
      const ev = r.respuesta && r.respuesta.vacio ? { puntos: -1 } : ej.evaluar((r.respuesta && r.respuesta.estado) || {}, d);
      return { ...r, _p: ev.puntos };
    }).sort((a, b) => a._p - b._p || String(a.carnet).localeCompare(String(b.carnet)));
  }

  function pintarResultados() {
    const p = paso();
    const ej = FP.EJERCICIOS[p.ejercicio];
    const e = ej.eje;
    const graf = $('#c-grafico'), met = $('#c-metricas');
    if (!graf || !met) return;
    const filas = respuestas.map((r) => {
      const d = FP.datosDe(p.ejercicio, r.carnet);
      if (r.respuesta && r.respuesta.vacio) return { vacio: true };
      const ev = ej.evaluar((r.respuesta && r.respuesta.estado) || {}, d);
      return { ...ev, mov: r.respuesta && r.respuesta.mov, seg: r.respuesta && r.respuesta.seg };
    });
    const validas = filas.filter((x) => !x.vacio);
    const x0 = 90, x1 = 930, y = 400;
    const X = (v) => x0 + ((Math.max(e.min, Math.min(e.max, v)) - e.min) / (e.max - e.min)) * (x1 - x0);
    let s = '';
    s += `<text x="${x0}" y="70" font-size="44" font-weight="700" fill="#16202c">${e.titulo}</text>`;
    s += `<rect x="${X(e.zona[0]).toFixed(1)}" y="110" width="${Math.max(10, X(e.zona[1]) - X(e.zona[0])).toFixed(1)}" height="${y - 100}" rx="10" fill="#e3f4eb"/>`;
    s += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#7a8596" stroke-width="5" stroke-linecap="round"/>`;
    e.marcas.forEach((m) => {
      s += `<line x1="${X(m).toFixed(1)}" y1="${y - 14}" x2="${X(m).toFixed(1)}" y2="${y + 14}" stroke="#7a8596" stroke-width="4"/>`;
      s += `<text x="${X(m).toFixed(1)}" y="${y + 66}" font-size="40" font-weight="600" fill="#465366" text-anchor="middle" font-family="JetBrains Mono, monospace">${e.fmt(m)}</text>`;
    });
    const pilas = {};
    validas.slice().sort((a, b) => a.valor - b.valor).forEach((v) => {
      const cx = X(v.valor);
      const bin = Math.round(cx / 30);
      const k = (pilas[bin] = (pilas[bin] || 0) + 1) - 1;
      const cy = y - 34 - k * 32;
      const col = v.puntos >= ej.puntos ? '#1b8a5a' : v.puntos > 0 ? '#b7791f' : '#c0392b';
      if (cy > 100) s += `<circle cx="${cx.toFixed(1)}" cy="${cy}" r="14" fill="${col}" stroke="#fff" stroke-width="3"/>`;
    });
    if (!validas.length) s += `<text x="500" y="260" font-size="46" fill="#7a8596" text-anchor="middle" font-weight="600">Aún no hay respuestas</text>`;
    graf.innerHTML = `<svg viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid meet">${s}</svg>`;
    const ok = validas.filter((v) => v.puntos >= ej.puntos).length;
    const pct = validas.length ? Math.round((ok / validas.length) * 100) : 0;
    const mMov = mediana(validas.map((v) => v.mov));
    const mSeg = mediana(validas.map((v) => v.seg));
    met.innerHTML =
      `<div class="metrica"><span>Enviaron</span><b>${validas.length}</b></div>` +
      `<div class="metrica ok"><span>Correctos</span><b>${pct}%</b></div>` +
      `<div class="metrica"><span>Movimientos</span><b>${isFinite(mMov) ? Math.round(mMov) : '—'}</b></div>` +
      `<div class="metrica"><span>Tiempo</span><b>${isFinite(mSeg) ? Math.round(mSeg) + 's' : '—'}</b></div>`;
  }

  async function escCierre() {
    const acts = S.pasos.filter((p) => actDe(p));
    const por = {};
    todas.forEach((r) => { (por[r.actividad] = por[r.actividad] || {})[r.carnet] = r; });
    const gente = new Set(todas.filter((r) => r.actividad !== 'ingreso').map((r) => r.carnet));
    let sumaPts = 0;
    gente.forEach((c) => { acts.forEach((p) => { const r = por[p.id] && por[p.id][c]; if (r) sumaPts += Number(r.puntaje) || 0; }); });
    const maxPts = acts.filter((p) => por[p.id]).reduce((a, p) => a + puntosDe(p), 0);
    const fila = (nombre, rs) => {
      const ok = rs.filter((r) => r.correcta).length;
      const pct = rs.length ? Math.round((ok / rs.length) * 100) : 0;
      return `<div class="opcion-tv"><span class="barra" style="width:${pct}%;background:var(--ok-claro)"></span><span class="txt">${II.esc(nombre)}</span><span class="n">${pct}%</span></div>`;
    };
    const hechas = acts.filter((p) => por[p.id]);
    const rapidas = hechas.filter((p) => p.tipo === 'rapida').flatMap((p) => Object.values(por[p.id]));
    const filas = hechas.filter((p) => p.tipo === 'ejercicio').map((p) => fila(nombreAct(p), Object.values(por[p.id]))).join('') +
      (rapidas.length ? fila('Predicciones (' + hechas.filter((p) => p.tipo === 'rapida').length + ')', rapidas) : '');
    $('#cuerpo').innerHTML = `<div class="esc">
      <div class="panel" style="gap:calc(var(--u)*1)"><span class="etq">Aciertos por actividad</span><div class="opciones-tv una cierre-lista">${filas || '<p class="chico">Aún no hay respuestas.</p>'}</div></div>
      <div class="panel"><div class="metricas">
        <div class="metrica"><span>Participaron</span><b>${gente.size}</b></div>
        <div class="metrica ok"><span>Promedio</span><b>${gente.size ? II.fmt(sumaPts / gente.size, 1) : '—'}</b></div>
      </div><p class="medio">de ${maxPts} puntos posibles</p><p class="chico">${II.esc(paso().idea)}</p></div></div>`;
  }

  function montar() {
    limpiar();
    const p = paso();
    if (p.tipo !== 'ejercicio') vista = 'resultados';
    cabecera();
    pie();
    if (p.tipo === 'inicio') escInicio();
    else if (p.tipo === 'explica') escExplica();
    else if (p.tipo === 'teoria') escTeoria();
    else if (p.tipo === 'rapida') escRapida();
    else if (p.tipo === 'ejercicio') escEjercicio();
    else if (p.tipo === 'cierre') { escCierre(); cargarTodas().then(() => { if (paso().tipo === 'cierre') escCierre(); }); }
    vigilarCierre();
  }

  // refresca contadores sin desmontar el diagrama que el docente está moviendo
  function refrescar() {
    const p = paso();
    cabecera();
    if (p.tipo === 'inicio') { const c = $('#c-gente'); if (c) c.innerHTML = `${conectados} <small>conectados</small>`; return; }
    if (p.tipo === 'rapida') { if (fase(p) === 'cerrado') escRapida(); else actualizarCifra(); return; }
    if (p.tipo === 'ejercicio') {
      if (fase(p) !== 'cerrado') actualizarCifra();
      else if (vista === 'resultados') pintarResultados();
    }
  }
  function actualizarCifra() {
    const c = $('#c-cifra');
    if (c && fase(paso()) !== 'cerrando') c.innerHTML = respuestas.length + ' <small>/ ' + conectados + '</small>';
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
    }, Math.max(0, fin - Date.now()) + 1500);
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
    idx = nuevo;
    extra = {};
    vista = 'resultados';
    intentoIdx = -1;
    respuestas = [];
    ultimoLocal = Date.now();
    II.guardar('me-proy-' + SID, idx);
    montar();
    if (docente) {
      const r = await II.fijarPaso(SID, paso().id, {});
      if (!r.ok) aviso('No se pudo cambiar el paso: ' + r.error);
      sondear();
    }
  }

  function accion() {
    if (!docente) return pedirIngreso();
    const p = paso();
    const fz = fase(p);
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
    if (vista !== 'intento') { vista = 'intento'; intentoIdx = 0; }
    else intentoIdx++;
    montar();
  }

  let avisoT = null;
  function aviso(txt) {
    const a = $('#aviso');
    a.textContent = txt;
    a.classList.remove('oculto');
    clearTimeout(avisoT);
    avisoT = setTimeout(() => a.classList.add('oculto'), 4000);
  }

  // ---------------- datos en vivo (solo docente) ----------------
  async function sondear() {
    if (!docente) return;
    const p = paso();
    const act = actDe(p);
    try {
      if (act) {
        const { data, error } = await II.sb.from('respuestas')
          .select('carnet,respuesta,correcta,puntaje,creado')
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
  async function cargarTodas() {
    if (!docente) return;
    const { data } = await II.sb.from('respuestas').select('actividad,carnet,correcta,puntaje,creado').eq('sesion', SID).order('creado', { ascending: true });
    todas = data || [];
  }

  // ---------------- docente: ingreso obligatorio ----------------
  let capaIngreso = null;
  function pedirIngreso(msg) {
    if (capaIngreso) return;
    capaIngreso = II.html(`<div class="capa ingreso"><form class="dialogo">
      <span class="etq">${II.esc(S.materia)}</span>
      <h2>${II.esc(S.titulo)}</h2>
      <p>Entra con tu cuenta docente (la misma del diplomado). Hazlo <b>antes de proyectar</b>: el celular la recuerda para las próximas clases.</p>
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
      ${it('pasos', 'Ir a un paso…', 'Lista de todas las pantallas de la clase')}
      ${it('notas', 'Descargar notas (Excel)', 'Puntaje por estudiante, asistencia y nota sobre 100')}
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
      else if (m === 'notas') descargarNotas();
      else if (m === 'salir') { await II.sb.auth.signOut(); docente = false; pedirIngreso(); }
    };
  }

  const TIPO = { inicio: 'Inicio', explica: 'Diagrama', teoria: 'Teoría', rapida: 'Predicción', ejercicio: 'Ejercicio', cierre: 'Cierre' };
  function listaPasos() {
    const filas = S.pasos.map((p, i) => {
      const t = p.tipo === 'ejercicio' ? FP.EJERCICIOS[p.ejercicio].titulo : p.tipo === 'rapida' ? p.t : p.titulo;
      return `<button class="paso-it ${i === idx ? 'actual' : ''} t-${p.tipo}" data-i="${i}"><span class="n">${i + 1}</span><span class="tp">${TIPO[p.tipo] || ''}</span><span class="tt">${II.esc(t)}</span></button>`;
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

  // ---------------- notas (CSV que abre Excel) ----------------
  async function descargarNotas() {
    if (!docente) return pedirIngreso();
    aviso('Preparando las notas…');
    try {
      const [r1, r2] = await Promise.all([
        II.sb.from('ingresos').select('carnet,nombre,info,creado').eq('sesion', SID).order('creado', { ascending: true }),
        II.sb.from('respuestas').select('actividad,carnet,nombre,puntaje,creado').eq('sesion', SID).order('creado', { ascending: true })
      ]);
      if (r1.error || r2.error) throw r1.error || r2.error;
      const acts = S.pasos.filter(actDe);
      const gente = {};
      const persona = (c, n) => (gente[c] = gente[c] || { nombre: n, carrera: '', dias: new Set(), pts: {} });
      const dia = (iso) => { const d = new Date(iso); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); };
      (r1.data || []).forEach((r) => {
        const g = persona(r.carnet, r.nombre);
        g.nombre = r.nombre;
        if (r.info && r.info.carrera) g.carrera = r.info.carrera;
        g.dias.add(dia(r.creado));
      });
      const hechas = new Set();
      (r2.data || []).forEach((r) => {
        if (r.actividad === 'ingreso') return;
        const g = persona(r.carnet, r.nombre);
        g.pts[r.actividad] = Number(r.puntaje) || 0; // la última respuesta vale
        g.dias.add(dia(r.creado));
        hechas.add(r.actividad);
      });
      const usadas = acts.filter((p) => hechas.has(p.id));
      const maxPts = usadas.reduce((a, p) => a + puntosDe(p), 0);
      const num = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
      const cel = (v) => '"' + String(v).replace(/"/g, '""') + '"';
      const cab = ['Carnet', 'Nombre', 'Carrera', 'Asistencia'].concat(usadas.map((p) => nombreAct(p) + ' (' + puntosDe(p) + ')'), ['Total', 'Máximo', 'Nota /100']);
      const filas = [cab.map(cel).join(';')];
      Object.entries(gente).sort((a, b) => a[1].nombre.localeCompare(b[1].nombre, 'es')).forEach(([c, g]) => {
        const pts = usadas.map((p) => g.pts[p.id]);
        const tot = pts.reduce((a, x) => a + (x || 0), 0);
        filas.push([cel(c), cel(g.nombre), cel(g.carrera), cel(Array.from(g.dias).join(', '))]
          .concat(pts.map((x) => (x == null ? '0' : num(x))), [num(tot), maxPts, maxPts ? num((tot / maxPts) * 100) : '0']).join(';'));
      });
      const blob = new Blob(['﻿' + filas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'notas-medidas-factor-potencia-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      aviso('Notas descargadas: ' + Object.keys(gente).length + ' estudiantes.');
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
