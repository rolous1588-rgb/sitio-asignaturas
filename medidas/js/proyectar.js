// ============================================================
// Proyección + control (el celular del docente, en horizontal, espejado a la TV)
// Sin sesión de docente funciona en "modo ensayo" (solo local).
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
    $('#t-modo').textContent = docente ? 'Docente · en vivo' : 'Modo ensayo · toca para entrar';
    $('#t-modo').classList.toggle('enlace', !docente);
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
          <p class="chico">Tus datos son distintos a los de tu compañero: están en tu celular.</p></div>
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
    const maxPts = acts.reduce((a, p) => a + (p.tipo === 'rapida' ? 1 : FP.EJERCICIOS[p.ejercicio].puntos), 0);
    const filas = acts.map((p) => {
      const rs = Object.values(por[p.id] || {});
      const ok = rs.filter((r) => r.correcta).length;
      const pct = rs.length ? Math.round((ok / rs.length) * 100) : 0;
      const nombre = p.tipo === 'rapida' ? 'Predicción ' + p.id.slice(1) : FP.EJERCICIOS[p.ejercicio].titulo;
      return `<div class="opcion-tv"><span class="barra" style="width:${pct}%;background:var(--ok-claro)"></span><span class="txt" style="font-size:calc(var(--u)*3.8)">${II.esc(nombre)}</span><span class="n" style="font-size:calc(var(--u)*3.8)">${rs.length ? pct + '%' : '—'}</span></div>`;
    }).join('');
    $('#cuerpo').innerHTML = `<div class="esc">
      <div class="panel" style="gap:calc(var(--u)*1)"><span class="etq">Aciertos por actividad</span><div class="opciones-tv una" style="gap:calc(var(--u)*.8);overflow:hidden">${filas}</div></div>
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
      const { data, error } = await II.sb.from('ingresos').select('carnet').eq('sesion', SID);
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

  // ---------------- docente: ingreso ----------------
  function dialogoLogin() {
    if (!II.sb) { aviso('Sin conexión con la base de datos: solo modo ensayo.'); return; }
    const capa = II.html(`<div class="capa"><form class="dialogo">
      <h2>Entrar como docente</h2><p>La misma cuenta del panel del diplomado.</p>
      <input name="email" type="email" placeholder="Correo" autocomplete="username" required>
      <input name="clave" type="password" placeholder="Contraseña" autocomplete="current-password" required>
      <div class="error"></div>
      <div class="fila-bt"><button type="button" class="boton" data-x>Cancelar</button><button class="boton prim">Entrar</button></div>
    </form></div>`);
    document.body.appendChild(capa);
    capa.querySelector('[data-x]').onclick = () => capa.remove();
    capa.querySelector('form').onsubmit = async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const err = capa.querySelector('.error');
      err.textContent = 'Entrando…';
      const { error } = await II.sb.auth.signInWithPassword({ email: String(fd.get('email')).trim(), password: String(fd.get('clave')) });
      if (error) { err.textContent = 'No se pudo entrar: revisa correo y contraseña.'; return; }
      const ok = await verificarDocente();
      if (!ok) { err.textContent = 'Esta cuenta no tiene permiso de docente.'; return; }
      capa.remove();
      // la clase sigue el paso que está en pantalla
      const r = await II.fijarPaso(SID, paso().id, {});
      extra = {};
      if (!r.ok) aviso(r.error);
      montar();
      sondear();
      contarGente();
    };
  }

  async function verificarDocente() {
    try {
      const { data, error } = await II.sb.from('docentes').select('email').limit(1);
      docente = !error && !!(data && data.length);
    } catch (e) { docente = false; }
    pie();
    return docente;
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
    $('#t-modo').onclick = () => { if (!docente) dialogoLogin(); };
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') irA(idx + 1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') irA(idx - 1);
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) pedirPantallaEncendida(); });
    II.alCambiarConexion((ok) => { const d = $('#t-con'); d.classList.toggle('on', ok); d.classList.toggle('off', !ok); });
    montar();
    if (!II.sb) return;
    II.sb.auth.getSession().then(async ({ data }) => {
      if (!(data && data.session)) return;
      if (!(await verificarDocente())) return;
      // retoma la clase donde está
      const { data: fila } = await II.sb.from('estado_sesion').select('*').eq('sesion', SID).maybeSingle();
      if (fila) {
        const i = S.pasos.findIndex((p) => p.id === fila.paso);
        if (i >= 0) idx = i;
        extra = fila.extra || {};
      }
      montar();
      sondear();
      contarGente();
    });
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
