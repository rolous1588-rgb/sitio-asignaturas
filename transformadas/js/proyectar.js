// ============================================================
// Proyección + control del examen (celular del docente en horizontal → TV)
// espera: QR + reglas · en curso: reloj gigante + contadores · cerrado: resultados anónimos
// extra = { asincrona: true, abre, fin, cierra, minutos, duracion, cortado? }
//   fin = fin visible del examen · cierra = fin + 20 s (margen de red para el envío final)
//   minutos = duración + 1 (lo usa la base: el envío final debe llegar dentro de inicio + minutos + 2)
// ============================================================
(function () {
  const $ = II.$;
  const SID = II.params.get('s') || 'tf-ex1';
  const E = TF.EXAMEN;
  const URL_CLASE = II.urlClase(SID);
  const MARGEN = 20 * 1000;
  const CORTE = 30;

  let ex = {};
  let docente = false;
  let offset = 0;
  const ahora = () => Date.now() + offset;
  let duracion = E.minutos;
  let ultimoLocal = 0;
  let datos = { ingresos: [], filas: [] };   // ingresos y respuestas de evaluación
  let reloj = null;
  let vista = '';

  const fase = () => {
    if (!ex || !ex.abre) return 'espera';
    if (ex.fin && ahora() >= Date.parse(ex.fin)) return 'cerrado';
    return 'curso';
  };
  const restante = () => (ex.fin ? (Date.parse(ex.fin) - ahora()) / 1000 : 0);

  // ---------------- hora del servidor ----------------
  async function sincronizarHora() {
    if (!II.sb) return;
    const t0 = Date.now();
    try {
      const { data, error } = await II.sb.rpc('estado_evaluacion', { p_sesion: SID, p_carnet: '---' });
      if (error) throw error;
      if (data && data[0] && data[0].ahora) offset = Date.parse(data[0].ahora) - (t0 + Date.now()) / 2;
    } catch (e) { /* sigue con el reloj del celular */ }
  }

  // ---------------- encabezado y pie ----------------
  function cabecera() {
    const fz = fase();
    $('#t-titulo').textContent = E.corto + (SID !== 'tf-ex1' ? ' · ' + (E.seccion[SID] || SID) : '');
    $('#t-idea').textContent = fz === 'espera' ? 'Escanea el QR y regístrate · el examen aún no empieza'
      : fz === 'curso' ? (ex.cortado ? 'Cerrando: se envía solo lo que tengan' : 'Examen en curso · responde en tu celular')
      : 'Examen cerrado · resultados anónimos';
    $('#t-gente').textContent = '👥 ' + registrados();
  }
  const btn = (id, txt, clase, fn) => {
    const b = $(id);
    b.textContent = txt; b.className = 'tv-btn ' + (clase || ''); b.disabled = false; b.onclick = fn;
    b.dataset.txt = txt;
  };
  function pie() {
    ['#b-a', '#b-b', '#b-c', '#b-min'].forEach((s) => $(s).classList.add('oculto'));
    const fz = fase();
    if (fz === 'espera') {
      btn('#b-a', '− 5', '', () => { duracion = Math.max(10, duracion - 5); pie(); });
      $('#b-min').textContent = duracion + ' min'; $('#b-min').classList.remove('oculto');
      btn('#b-b', '+ 5', '', () => { duracion = Math.min(180, duracion + 5); pie(); });
      btn('#b-c', '▶ Iniciar examen', 'ok', confirmar('#b-c', '¿Iniciar? Toca otra vez', iniciar));
    } else if (fz === 'curso') {
      btn('#b-a', '+ 5 min', '', confirmar('#b-a', '¿+5 min? Otra vez', masCinco));
      if (!ex.cortado) btn('#b-b', '■ Cortar examen', 'peligro', confirmar('#b-b', `¿Cortar en ${CORTE} s? Otra vez`, cortar));
    } else {
      btn('#b-a', 'Descargar notas', 'prim', descargarNotas);
      btn('#b-b', 'Actualizar', '', () => cargarDatos(true));
    }
  }
  // confirmación con doble toque (sin alert)
  function confirmar(sel, texto, accion) {
    let armado = false, t = null;
    return () => {
      if (!docente) return pedirIngreso();
      const b = $(sel);
      if (!armado) {
        armado = true; b.textContent = texto;
        t = setTimeout(() => { armado = false; b.textContent = b.dataset.txt; }, 3500);
        return;
      }
      clearTimeout(t); armado = false; b.disabled = true;
      accion();
    };
  }

  // ---------------- escenas ----------------
  function montar() {
    clearInterval(reloj);
    cabecera();
    pie();
    const fz = fase();
    vista = fz;
    if (fz === 'espera') escEspera();
    else if (fz === 'curso') escCurso();
    else escCerrado();
  }

  function escEspera() {
    $('#cuerpo').innerHTML = `<div class="esc">
      <div class="panel">
        <span class="etq">${II.esc(E.materia)}</span>
        <p class="grande" style="font-size:calc(var(--u)*5)">${II.esc(E.titulo)}</p>
        <ul class="reglas-tv">
          <li>Escanea el QR y regístrate con tu <b>C.U.</b></li>
          <li>Resuelve en <b>papel</b>; en el celular solo marcas o escribes <b>enteros</b></li>
          <li>Calculadora física y hoja a mano: <b>sí</b> · activa <b>«No molestar»</b></li>
          <li class="ojo"><b class="ojo">No bloquees el celular ni salgas de la página</b>: queda registrado</li>
        </ul>
      </div>
      <div class="panel centro">
        <div class="qr">${II.qrSVG(URL_CLASE, 400)}</div>
        <div class="cifra" id="c-reg" style="font-size:calc(var(--u)*11)">${registrados()} <small>registrados</small></div>
      </div></div>`;
  }

  function escCurso() {
    $('#cuerpo').innerHTML = `<div class="esc">
      <div class="panel centro">
        <span class="etq">${ex.cortado ? 'Cerrando el examen' : 'Tiempo restante'}</span>
        <div class="reloj-gigante" id="c-reloj">--:--</div>
        <p class="chico" id="c-fin"></p>
      </div>
      <div class="panel centro" style="gap:calc(var(--u)*2.4)">
        <div class="metricas" style="width:100%">
          <div class="metrica"><span>Registrados</span><b id="m-reg">${registrados()}</b></div>
          <div class="metrica"><span>Empezaron</span><b id="m-emp">${empezaron()}</b></div>
          <div class="metrica ok"><span>Enviaron</span><b id="m-env">${enviaron()}</b></div>
          <div class="metrica"><span>Minutos</span><b>${ex.duracion || '—'}</b></div>
        </div>
        ${ex.cortado ? '' : `<div class="qr chico">${II.qrSVG(URL_CLASE, 240)}</div><p class="chico">¿Llegaste tarde? Escanea y entra</p>`}
      </div></div>`;
    const finTxt = new Date(Date.parse(ex.fin)).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/La_Paz' });
    $('#c-fin').textContent = ex.cortado ? 'se envía solo lo que tengan' : 'Termina a las ' + finTxt;
    const paso = () => {
      const s = restante();
      const r = $('#c-reloj');
      if (r) {
        r.textContent = ex.cortado ? Math.max(0, Math.ceil(s)) : II.formatoReloj(Math.max(0, Math.ceil(s)));
        r.classList.toggle('poco', ex.cortado || s < 300);
      }
      if (s <= 0) { clearInterval(reloj); setTimeout(() => { montar(); cargarDatos(true); }, 1200); }
    };
    paso();
    reloj = setInterval(paso, 250);
  }

  function escCerrado() {
    const res = resultados();
    const conNota = res.filter((x) => x.nota != null);
    const prom = conNota.length ? conNota.reduce((a, x) => a + x.nota, 0) / conNota.length : NaN;
    const aprob = conNota.filter((x) => x.nota >= 51).length;
    const cols = TF.PREGUNTAS.map((q) => {
      const fr = conNota.map((x) => x.puntos[q.id] / q.puntos);
      const pct = fr.length ? Math.round((fr.reduce((a, b) => a + b, 0) / fr.length) * 100) : 0;
      return `<div class="col"><span class="pct">${fr.length ? pct + '%' : '—'}</span><div class="bar ${pct < 40 ? 'bajo' : pct < 70 ? 'medio' : ''}" style="height:${Math.max(1, pct) * 0.62}%"></div><span class="et">P${q.id.slice(1)}</span></div>`;
    }).join('');
    $('#cuerpo').innerHTML = `<div class="esc">
      <div class="panel"><span class="etq">Acierto promedio por pregunta</span><div class="barras-p">${cols}</div></div>
      <div class="panel centro"><div class="metricas" style="width:100%">
        <div class="metrica"><span>Rindieron</span><b>${conNota.length}</b></div>
        <div class="metrica ok"><span>Promedio</span><b>${isFinite(prom) ? II.fmt(prom, 1) : '—'}</b></div>
        <div class="metrica ok"><span>Aprobados</span><b>${aprob}</b></div>
        <div class="metrica"><span>Reprobados</span><b>${conNota.length - aprob}</b></div>
      </div><p class="chico">Nota sobre 100 · aprobado ≥ 51 · cada uno ve su nota en su celular</p></div></div>`;
  }

  function refrescarCifras() {
    cabecera();
    const fz = fase();
    if (fz === 'espera') { const c = $('#c-reg'); if (c) c.innerHTML = `${registrados()} <small>registrados</small>`; }
    if (fz === 'curso') {
      const s = (id, v) => { const el = $(id); if (el) el.textContent = v; };
      s('#m-reg', registrados()); s('#m-emp', empezaron()); s('#m-env', enviaron());
    }
    if (fz === 'cerrado' && vista === 'cerrado') escCerrado();
  }

  // ---------------- datos (solo docente) ----------------
  const registrados = () => new Set(datos.ingresos.map((r) => r.carnet)).size;
  const empezaron = () => new Set(datos.filas.filter((r) => r.actividad !== 'ingreso').map((r) => r.carnet)).size;
  const enviaron = () => new Set(datos.filas.filter((r) => r.actividad === 'eval').map((r) => r.carnet)).size;

  // Supabase devuelve como máximo 1000 filas por consulta: por eso las copias automáticas (muchas)
  // se piden aparte, solo para quienes no enviaron, de la más nueva a la más antigua.
  let cargando = false;
  async function cargarDatos(conRespuestas) {
    if (!docente || cargando) return;
    cargando = true;
    try {
      const completo = conRespuestas || fase() === 'cerrado';
      const cols = completo ? 'actividad,carnet,nombre,respuesta,creado' : 'actividad,carnet,creado';
      const [r1, r2] = await Promise.all([
        II.sb.from('ingresos').select('carnet,nombre,info,creado').eq('sesion', SID).order('creado', { ascending: true }),
        II.sb.from('respuestas').select(cols).eq('sesion', SID).in('actividad', ['eval-inicio', 'eval']).order('creado', { ascending: true })
      ]);
      if (r1.error || r2.error) throw r1.error || r2.error;
      let filas = r2.data || [];
      if (completo) {
        const conEval = new Set(filas.filter((r) => r.actividad === 'eval').map((r) => r.carnet));
        const todos = new Set((r1.data || []).map((r) => r.carnet).concat(filas.map((r) => r.carnet)));
        const faltan = Array.from(todos).filter((c) => !conEval.has(c));
        if (faltan.length) {
          const r3 = await II.sb.from('respuestas').select(cols).eq('sesion', SID).eq('actividad', 'eval-avance')
            .in('carnet', faltan).order('creado', { ascending: false }).limit(1000);
          if (r3.error) throw r3.error;
          const vistos = new Set();
          const ult = (r3.data || []).filter((r) => (vistos.has(r.carnet) ? false : vistos.add(r.carnet)));
          filas = filas.concat(ult);
        }
      }
      datos = { ingresos: r1.data || [], filas };
      II.marcarConexion(true);
    } catch (e) { II.marcarConexion(false); }
    cargando = false;
    refrescarCifras();
  }

  // resultado por estudiante: envío final; si no hay, la última copia automática (recalcula la nota con su carnet)
  function resultados() {
    const gente = {};
    const p = (c, n) => (gente[c] = gente[c] || { carnet: c, nombre: n || '', carrera: '', eval: null, avance: null, inicio: null });
    datos.ingresos.forEach((r) => { const g = p(r.carnet, r.nombre); g.nombre = r.nombre; if (r.info && r.info.carrera) g.carrera = r.info.carrera; });
    datos.filas.forEach((r) => {
      const g = p(r.carnet, r.nombre);
      if (r.nombre) g.nombre = r.nombre;
      if (r.actividad === 'eval') g.eval = r;
      else if (r.actividad === 'eval-avance') g.avance = r;
      else if (r.actividad === 'eval-inicio' && !g.inicio) g.inicio = r;
    });
    return Object.values(gente).map((g) => {
      const fuente = g.eval || g.avance;
      const resp = fuente && fuente.respuesta ? fuente.respuesta.resp || {} : null;
      const cal = resp ? TF.nota(g.carnet, resp) : null;
      const estado = g.eval ? (g.eval.respuesta && g.eval.respuesta.motivo === 'tiempo' ? 'Al terminar el tiempo' : 'Enviada')
        : g.avance ? 'Última copia automática' : g.inicio ? 'Empezó, sin respuestas' : 'No rindió';
      const sal = (fuente && fuente.respuesta && fuente.respuesta.sal) || null;
      return { ...g, estado, nota: cal ? cal.nota : (g.inicio ? 0 : null), puntos: cal ? cal.puntos : {}, sal, envio: g.eval ? g.eval.creado : null };
    });
  }

  // ---------------- acciones ----------------
  async function guardarExtra(nuevo) {
    ex = nuevo;
    ultimoLocal = Date.now();
    montar();
    const { data, error } = await II.sb.from('estado_sesion')
      .update({ extra: nuevo, actualizado: new Date().toISOString() })
      .eq('sesion', SID).select();
    if (error || !data || !data.length) { aviso('No se pudo guardar el cambio. Revisa la conexión y vuelve a intentar.'); return false; }
    return true;
  }
  async function iniciar() {
    await sincronizarHora();
    const t = ahora();
    const fin = t + duracion * 60000;
    const ok = await guardarExtra({ asincrona: true, abre: new Date(t - 10000).toISOString(), fin: new Date(fin).toISOString(),
      cierra: new Date(fin + MARGEN).toISOString(), minutos: duracion + 1, duracion });
    if (ok) aviso('Examen iniciado: ' + duracion + ' minutos.');
    cargarDatos();
  }
  async function masCinco() {
    const fin = Math.max(Date.parse(ex.fin), ahora()) + 5 * 60000;
    const nuevo = { ...ex, fin: new Date(fin).toISOString(), cierra: new Date(fin + MARGEN).toISOString(),
      minutos: (ex.minutos || duracion + 1) + 5, duracion: (ex.duracion || duracion) + 5 };
    delete nuevo.cortado;
    if (await guardarExtra(nuevo)) aviso('Se agregaron 5 minutos.');
  }
  async function cortar() {
    await sincronizarHora();
    if (restante() <= CORTE) return aviso('Ya quedan menos de ' + CORTE + ' segundos.');
    const fin = ahora() + CORTE * 1000;
    await guardarExtra({ ...ex, fin: new Date(fin).toISOString(), cierra: new Date(fin + MARGEN).toISOString(), cortado: true });
  }

  async function reiniciar() {
    const base = { asincrona: true, abre: null, fin: null, cierra: null, minutos: E.minutos + 1, duracion: E.minutos };
    const [a, b] = await Promise.all([
      II.sb.from('respuestas').delete().eq('sesion', SID),
      II.sb.from('ingresos').delete().eq('sesion', SID)
    ]);
    if (a.error || b.error) return aviso('No se pudieron borrar los datos: ' + ((a.error || b.error).message || ''));
    duracion = E.minutos;
    await guardarExtra(base);
    datos = { ingresos: [], filas: [] };
    refrescarCifras();
    aviso('Listo: examen en «espera» y sin datos.');
  }

  let avisoT = null;
  function aviso(txt) {
    const a = $('#aviso');
    a.textContent = txt;
    a.classList.remove('oculto');
    clearTimeout(avisoT);
    avisoT = setTimeout(() => a.classList.add('oculto'), 4500);
  }

  // ---------------- notas (CSV para Excel) ----------------
  async function descargarNotas() {
    if (!docente) return pedirIngreso();
    aviso('Preparando las notas…');
    await cargarDatos(true);
    const res = resultados().sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const num = (x) => (x == null || !isFinite(x) ? '' : String(Math.round(x * 10) / 10).replace('.', ','));
    const cel = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/La_Paz' }) : '');
    const cab = ['Carnet', 'Nombre', 'Carrera', 'Estado', 'Nota /100']
      .concat(TF.PREGUNTAS.map((q) => 'P' + q.id.slice(1) + ' (' + q.puntos + ')'))
      .concat(['Salidas de la página', 'Tiempo fuera (s)', 'Salida más larga (s)', 'Respuestas cambiadas ≤30 s tras volver', 'Pérdidas de foco', 'Tiempo sin foco (s)',
        'Pantalla encendida', 'Recargas', 'Dispositivo', 'Detalle de salidas', 'Detalle de cambios tras volver', 'Hora de envío']);
    const filas = [cab.map(cel).join(';')];
    res.forEach((g) => {
      const s = g.sal || {};
      let detalle = (s.lista || []).map((x) => `P${x.p} min ${x.min}: ${x.seg} s`).join(' | ');
      if (s.abierta) detalle += (detalle ? ' | ' : '') + `salió en P${s.abierta.p} (min ${s.abierta.min}) y no volvió`;
      const cambios = (s.cambios || []).map((x) => `P${x.p} a los ${x.s} s (min ${x.min})`).join(' | ');
      filas.push([cel(g.carnet), cel(g.nombre), cel(g.carrera), cel(g.estado), num(g.nota)]
        .concat(TF.PREGUNTAS.map((q) => (g.puntos[q.id] == null ? '' : num(g.puntos[q.id]))))
        .concat([s.n == null ? '' : s.n + (s.abierta ? 1 : 0), num(s.seg), num(s.max), s.cambios ? s.cambios.length : '', s.foco ? s.foco.n : '', s.foco ? s.foco.seg : '',
          cel(s.pantalla || ''), s.recargas == null ? '' : s.recargas, cel(s.disp || ''), cel(detalle), cel(cambios), cel(hora(g.envio))]).join(';'));
    });
    const blob = new Blob(['﻿' + filas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'notas-transformadas-laplace-' + SID + '-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    aviso('Notas descargadas: ' + res.length + ' estudiantes.');
  }

  // ---------------- docente: ingreso obligatorio ----------------
  let capaIngreso = null;
  function pedirIngreso(msg) {
    if (capaIngreso) return;
    capaIngreso = II.html(`<div class="capa ingreso"><form class="dialogo">
      <span class="etq">${II.esc(E.materia)}</span>
      <h2>${II.esc(E.titulo)}</h2>
      <p>Entra con tu cuenta docente (la misma del diplomado y de Medidas).</p>
      <input name="email" type="email" placeholder="Correo" autocomplete="username" required>
      <input name="clave" type="password" placeholder="Contraseña" autocomplete="current-password" required>
      <div class="error">${II.esc(msg || '')}</div>
      <div class="fila-bt"><button class="boton prim">Entrar</button></div>
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
  async function verificarDocente() {
    try {
      const { data, error } = await II.sb.from('docentes').select('email').limit(1);
      docente = !error && !!(data && data.length);
    } catch (e) { docente = false; }
    return docente;
  }
  // lee el estado guardado; si la fila del examen no existe, la crea en «espera»
  async function retomar() {
    await sincronizarHora();
    try {
      const { data: fila, error } = await II.sb.from('estado_sesion').select('*').eq('sesion', SID).maybeSingle();
      if (error) throw error;
      if (!fila) {
        const base = { asincrona: true, abre: null, fin: null, cierra: null, minutos: E.minutos + 1, duracion: E.minutos };
        const r = await II.sb.from('estado_sesion').insert({ sesion: SID, paso: 'examen', extra: base });
        if (r.error) aviso('No se pudo crear el examen en la base: ' + r.error.message);
        ex = base;
      } else ex = fila.extra || {};
      if (ex.duracion && fase() === 'espera') duracion = ex.duracion;
    } catch (e) { aviso('Sin conexión: no se pudo leer el estado del examen.'); }
    montar();
    cargarDatos(fase() === 'cerrado');
  }

  // ---------------- menú ⋮ ----------------
  function menu() {
    const it = (k, t, sub) => `<button class="menu-it" data-m="${k}">${t}${sub ? `<small>${sub}</small>` : ''}</button>`;
    const capa = II.html(`<div class="capa"><div class="dialogo">
      <h2>${II.esc(E.corto)}</h2>
      <p>Sesión: <b>${II.esc(SID)}</b> · ${II.esc(E.seccion[SID] || '')}</p>
      ${it('notas', 'Descargar notas (Excel)', 'Nota, puntaje por pregunta y registro de salidas de cada estudiante')}
      ${it('estudiante', 'Abrir la vista del estudiante', 'Para revisar cómo se ve en el celular')}
      ${it('reiniciar', 'Reiniciar y borrar datos', 'Solo para pruebas: borra respuestas y registros y vuelve a «espera»')}
      ${it('salir', 'Salir de la cuenta docente', '')}
      <div class="fila-bt"><button class="boton" data-x>Cerrar</button></div></div></div>`);
    document.body.appendChild(capa);
    capa.onclick = async (e) => {
      if (e.target === capa || e.target.closest('[data-x]')) return capa.remove();
      const b = e.target.closest('[data-m]');
      if (!b) return;
      capa.remove();
      const m = b.dataset.m;
      if (m === 'notas') descargarNotas();
      else if (m === 'estudiante') window.open(URL_CLASE, '_blank');
      else if (m === 'reiniciar') dialogoReiniciar();
      else if (m === 'salir') { await II.sb.auth.signOut(); docente = false; pedirIngreso(); }
    };
  }
  function dialogoReiniciar() {
    const capa = II.html(`<div class="capa"><form class="dialogo">
      <h2>Reiniciar y borrar datos</h2>
      <div class="aviso mal">Se borran <b>todas</b> las respuestas y registros de <b>${II.esc(SID)}</b>. Úsalo solo con datos de prueba, <b>nunca después del examen real</b>.</div>
      <p>Para confirmar, escribe <b>BORRAR</b>:</p>
      <input name="c" autocomplete="off" autocapitalize="characters">
      <div class="fila-bt"><button type="button" class="boton" data-x>Cancelar</button><button class="boton prim">Borrar</button></div></form></div>`);
    document.body.appendChild(capa);
    capa.querySelector('[data-x]').onclick = () => capa.remove();
    capa.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      if (String(new FormData(e.target).get('c')).trim().toUpperCase() !== 'BORRAR') return;
      capa.remove();
      reiniciar();
    };
  }

  // ---------------- pantalla completa, pantalla encendida y QR ----------------
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
      <div style="text-align:left;max-width:45%"><p class="grande">Entra al examen</p><p class="url" style="font-size:calc(var(--u)*3.4)">${II.esc(URL_CLASE.replace(/^https?:\/\//, ''))}</p><p class="chico">Toca para cerrar</p></div>
    </div></div>`);
    capa.onclick = () => capa.remove();
    document.body.appendChild(capa);
  }

  // ---------------- arranque ----------------
  function arrancar() {
    $('#b-pant').onclick = pantallaCompleta;
    $('#b-qr').onclick = verQR;
    $('#b-menu').onclick = () => (docente ? menu() : pedirIngreso());
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { pedirPantallaEncendida(); sincronizarHora(); } });
    II.alCambiarConexion((ok) => { const d = $('#t-con'); d.classList.toggle('on', ok); d.classList.toggle('off', !ok); });
    montar();
    if (!II.sb) return pedirIngreso('Sin conexión con la base de datos. Revisa internet y recarga la página.');
    II.sb.auth.getSession().then(async ({ data }) => {
      if (!(data && data.session)) return pedirIngreso();
      if (!(await verificarDocente())) return pedirIngreso('Esta cuenta no tiene permiso de docente.');
      retomar();
    }).catch(() => pedirIngreso('Sin internet. Revisa la conexión.'));
    // si otro dispositivo cambia el examen, esta pantalla se entera
    II.seguirEstado(SID, (fila) => {
      if (!docente || Date.now() - ultimoLocal < 3000) return;
      const nuevo = fila.extra || {};
      if (JSON.stringify(nuevo) !== JSON.stringify(ex)) { ex = nuevo; montar(); }
    });
    setInterval(() => { if (docente && fase() !== 'cerrado') cargarDatos(false); }, 5000);
    setInterval(() => { if (docente && fase() === 'cerrado') cargarDatos(true); }, 15000);
    setInterval(sincronizarHora, 60000);
    // cambio de fase por tiempo (fin del examen) aunque nadie toque nada
    setInterval(() => { if (fase() !== vista) { montar(); if (fase() === 'cerrado') cargarDatos(true); } }, 1000);
  }
  arrancar();
})();
