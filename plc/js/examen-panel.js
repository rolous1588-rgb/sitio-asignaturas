// ============================================================
// Panel docente del examen final (pl-ex)
// Abrir y cerrar, cambiar fechas, avance, reporte con nota calculada aquí, CSV para Excel, borrar datos de prueba.
// ============================================================
(function () {
  const II = window.II, CE = II.EX;
  const main = II.$('#principal');
    const D = { vista: 'control', filas: {}, resp: {}, alumnos: [], fantasmas: [], armadoBorrar: false };
  II.$('#b-icono').innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5"/><circle cx="12" cy="16" r="1.4" fill="#fff"/></svg>';
  II.alCambiarConexion((ok) => { II.$('#b-conexion').className = 'punto-conexion ' + (ok ? 'ok' : 'mal'); });

  const fechaBO = (ms) => (ms ? new Date(ms).toLocaleString('es-BO', { timeZone: 'America/La_Paz', weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '—');
  const aEntradaBO = (ms) => new Date(ms - 4 * 3600e3).toISOString().slice(0, 16);   // Bolivia: UTC−4 todo el año
  const deEntradaBO = (v) => Date.parse(v + ':59-04:00');
  const aviso = (t, c = 'mal') => { const a = II.html(`<div class="aviso ${c} aviso-flotante">${t}</div>`); document.body.appendChild(a); setTimeout(() => a.remove(), 4500); };
  const ses = () => 'pl-ex';
  const extra = () => (D.filas[ses()] && D.filas[ses()].extra) || {};

  // ---------- acceso ----------
  const pintarLogin = (msg) => {
    main.innerHTML = `<div class="contenido angosto"><div class="tarjeta"><span class="etiqueta">Acceso docente</span><h2>Examen final</h2>
      <form id="f-login"><label class="campo"><span>Correo</span><input class="entrada" name="email" type="email" required autocomplete="username"></label>
      <label class="campo"><span>Contraseña</span><input class="entrada" name="clave" type="password" required autocomplete="current-password"></label>
      ${msg ? `<div class="aviso mal">${II.esc(msg)}</div>` : ''}<button class="boton primario grande bloque" type="submit">Entrar</button></form></div></div>`;
    II.$('#f-login').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      const { error } = await II.sb.auth.signInWithPassword({ email: String(f.get('email')).trim(), password: String(f.get('clave')) });
      if (error) return pintarLogin(error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : error.message);
      verificar();
    });
  };
  const verificar = async () => {
    const { data: u } = await II.sb.auth.getUser();
    if (!u || !u.user) return pintarLogin();
    const { data, error } = await II.sb.from('docentes').select('email');
    if (error || !data || !data.length) { await II.sb.auth.signOut(); return pintarLogin('Esta cuenta no está registrada como docente.'); }
    II.$('#b-usuario').innerHTML = '<button class="boton chico" id="b-salir">Cerrar sesión</button>';
    II.$('#b-salir').onclick = async () => { await II.sb.auth.signOut(); location.reload(); };
    await cargar(); pintar();
    setInterval(async () => { if (D.vista === 'control') { await cargar(); pintar(); } }, 20000);
  };

  // ---------- datos ----------
  const traer = async (sesion, filtro) => {
    let todo = [];
    for (let p = 0; p < 12; p++) {
      let q = II.sb.from('respuestas').select('*').eq('sesion', sesion);
      q = filtro(q).order('creado').range(p * 1000, p * 1000 + 999);
      const { data, error } = await q;
      if (error || !data) break;
      todo = todo.concat(data);
      if (data.length < 1000) break;
    }
    return todo;
  };
  const cargar = async () => {
    const [f, al] = await Promise.all([
      II.sb.from('estado_sesion').select('*').eq('sesion', 'pl-ex'),
      II.sb.from('estudiantes').select('carnet,nombre,fantasma')
    ]);
    D.filas = {}; (f.data || []).forEach((x) => { D.filas[x.sesion] = x; });
    D.alumnos = (al.data || []).filter((a) => !a.fantasma); D.fantasmas = (al.data || []).filter((a) => a.fantasma).map((a) => a.carnet);
    D.resp['pl-ex'] = await traer('pl-ex', (q) => q.neq('actividad', 'eval-avance'));
    D.avance = await traer('pl-ex', (q) => q.eq('actividad', 'eval-avance'));
  };
  const cambiar = async (cambios, msg) => {
    const r = await II.fijarExtra(ses(), cambios, extra());
    if (!r.ok) return aviso('No se pudo cambiar: ' + r.error);
    D.filas[ses()] = { ...(D.filas[ses()] || { sesion: ses() }), extra: r.extra };
    pintar(); if (msg) aviso(msg, 'ok');
  };
  const sinFantasma = (rs) => rs.filter((r) => !D.fantasmas.includes(r.carnet));

  // ---------- control: una fila por estudiante de la lista ----------
  const filasCE = () => {
    const ex = (D.filas['pl-ex'] || {}).extra || {}, minutos = ex.minutos || CE.META.minutos;
    const cierra = ex.cierra ? Date.parse(ex.cierra) : null, ahora = Date.now();
    const rs = sinFantasma(D.resp['pl-ex']), av = sinFantasma(D.avance || []);
    const gente = D.alumnos.slice();
    rs.forEach((r) => { if (!gente.some((a) => a.carnet === r.carnet)) gente.push({ carnet: r.carnet, nombre: r.nombre }); });
    return gente.map((a) => {
      const ini = rs.find((r) => r.carnet === a.carnet && r.actividad === 'eval-inicio');
      const env = rs.find((r) => r.carnet === a.carnet && r.actividad === 'eval');
      const ids = CE.seleccion(a.carnet);
      let estado, origen, resp = null, fin = null;
      if (env) { resp = env.respuesta && env.respuesta.resp; estado = 'enviada'; fin = Date.parse(env.creado); origen = env.respuesta && env.respuesta.motivo === 'tiempo' ? 'Enviada al terminar el tiempo' : 'Enviada'; }
      else if (ini) {
        const limite = Date.parse(ini.creado) + (minutos + 2) * 60000;
        const ult = av.filter((r) => r.carnet === a.carnet && Date.parse(r.creado) <= limite).pop();
        if (ahora < limite && (!cierra || ahora < cierra + 120000)) { estado = 'curso'; origen = 'Rindiendo ahora'; }
        else if (ult) { estado = 'avance'; resp = ult.respuesta && ult.respuesta.resp; fin = Date.parse(ult.creado); origen = 'No envió: se calificó su última copia automática'; }
        else { estado = 'sin'; origen = 'Empezó y no se guardó ninguna respuesta'; }
      } else { estado = 'no'; origen = 'No rindió'; }
      const cal = resp ? CE.calificarTodo(ids, resp, a.carnet) : null;
      const cerrada = cierra && ahora > cierra;
      const nota = cal ? cal.nota : estado === 'sin' || (estado === 'no' && cerrada) ? 0 : null;
      const sal = env && env.respuesta && env.respuesta.sal;
      const inicio = ini ? Date.parse(ini.creado) : null;
      return { a, inicio, fin, dur: inicio && fin ? (fin - inicio) / 60000 : null, estado, origen, cal, nota, sal };
    });
  };

  const metricas = (arr) => `<div class="metricas">${arr.map(([b, s]) => `<div class="metrica"><b>${b}</b><span>${s}</span></div>`).join('')}</div>`;
  const bloqueFechas = (campos) => `<div class="tarjeta" style="padding:14px;margin-bottom:12px">
    ${campos.map(([id, rot, ms]) => `<label class="campo"><span>${rot} (hora de Bolivia)</span><input class="entrada" type="datetime-local" id="${id}" value="${ms ? aEntradaBO(ms) : ''}" style="max-width:260px"></label>`).join('')}
    <button class="boton" data-acc="guardar-fechas">Guardar fechas</button>
    <p class="nota" style="margin:6px 0 0">La base de datos rechaza cualquier envío fuera de estas fechas. </p></div>`;


  const vistaControl = () => {
    const ex = extra(), abre = ex.abre ? Date.parse(ex.abre) : null, cierra = ex.cierra ? Date.parse(ex.cierra) : null, pub = ex.publica ? Date.parse(ex.publica) : null, t = Date.now();
    const est = !D.filas['pl-ex'] ? 'falta' : !abre || t < abre ? 'antes' : cierra && t >= cierra ? 'cerrada' : 'abierta';
    const txt = { falta: '<b style="color:var(--mal)">Falta crear la fila pl-ex (aplicar examen-pl.sql)</b>', antes: '<b style="color:var(--duda)">No abierto</b>', abierta: '<b style="color:var(--ok)">Abierto</b>', cerrada: '<b style="color:var(--mal)">Cerrado</b>; ya no se registra nada' }[est];
    const fl = filasCE(), con = fl.filter((f) => f.cal);
    const prom = con.length ? con.reduce((s, f) => s + f.nota, 0) / con.length : null;
    const pubTxt = pub ? (t >= pub ? '<b style="color:var(--ok)">publicado: los estudiantes ya ven nota y soluciones</b>' : 'oculto hasta esa hora') : 'sin fecha: se publica al cierre';
    return `<div class="paso-actual"><span class="etiqueta">${CE.META.titulo}; un intento; ${CE.META.minutos} min; ${CE.META.nEval} casillas; vale ${CE.META.peso} %</span><div class="nota">Estado: ${txt}</div></div>
      <div class="tarjeta" style="padding:14px;margin-bottom:12px"><div style="display:grid;gap:4px"><div><b>Abre:</b> ${fechaBO(abre)}</div><div><b>Cierra:</b> ${fechaBO(cierra)}</div><div><b>Nota y soluciones visibles desde:</b> ${fechaBO(pub || cierra)} (${pubTxt})</div></div>
        <div class="controles" style="margin-top:10px">${est !== 'abierta' ? '<button class="boton primario" data-acc="abrir">Abrir ahora</button>' : '<button class="boton peligro" data-acc="cerrar">Cerrar ahora</button>'}
          ${abre ? '<button class="boton chico" data-acc="ocultar">Volver a «No abierto»</button>' : ''}
          <button class="boton chico" data-acc="publicar">Publicar nota y soluciones ahora</button></div></div>
      ${bloqueFechas([['f-abre', 'Abre', abre], ['f-cierra', 'Cierra (nadie puede enviar después)', cierra], ['f-publica', 'Nota y soluciones visibles desde', pub]])}
      ${metricas([[fl.filter((f) => f.inicio).length, 'Empezaron'], [fl.filter((f) => f.estado === 'enviada').length, 'Enviaron'], [fl.filter((f) => f.estado === 'curso').length, 'Rindiendo ahora'], [prom == null ? '—' : II.fmt(prom, 1), 'Promedio /100']])}
      <div class="tarjeta" style="padding:14px"><div class="controles"><a class="boton chico" href="examen.html?modo=revision" target="_blank" rel="noopener">Revisar como estudiante (no registra nada) ↗</a>
        <button class="boton chico" data-acc="copiar" data-url="examen.html">Copiar enlace de estudiantes</button></div></div>`;
  };
  const vistaReporte = () => {
    const fl = filasCE(), chip = { enviada: 'ok', avance: 'duda', curso: 'acento', sin: 'mal', no: '' };
    return `<div class="controles" style="margin-bottom:12px"><button class="boton primario" data-acc="csv">Descargar para Excel (.csv)</button><button class="boton" data-acc="recargar">Actualizar</button></div>
      <p class="nota">La nota se recalcula aquí con las respuestas guardadas. Ponderada = nota × ${II.fmt(CE.META.peso / 100, 2)}. La cuenta fantasma no aparece.</p>
      <div class="tabla-envoltura"><table class="tabla"><tr><th>Nombre</th><th>Nota /100</th><th>Pond. /${CE.META.peso}</th><th>Estado</th><th>Inicio</th><th>Duración</th><th>Salidas</th><th>Carnet</th></tr>
      ${fl.map((f) => `<tr><td>${II.esc(f.a.nombre)}</td><td class="n"><b>${f.nota == null ? '—' : II.fmt(f.nota, 1)}</b></td><td class="n">${f.nota == null ? '—' : II.fmt((f.nota * CE.META.peso) / 100, 2)}</td>
        <td><span class="chip ${chip[f.estado]}" style="white-space:normal">${f.origen}</span></td><td class="n">${f.inicio ? fechaBO(f.inicio) : '—'}</td><td class="n">${f.dur != null ? II.fmt(f.dur, 1) + ' min' : '—'}</td>
        <td class="n">${f.sal ? f.sal.n + ' (' + f.sal.seg + ' s)' : '—'}</td><td>${II.esc(f.a.carnet)}</td></tr>`).join('')}</table></div>
      ${borrarBloque()}`;
  };
  const borrarBloque = () => `<div class="tarjeta" style="margin-top:24px;padding:14px"><h3>Datos de prueba</h3>
    <p class="nota">Borra todas las respuestas e ingresos de esta sesión. Úsalo solo antes de abrirla a los estudiantes. Las fechas no cambian.</p>
    <button class="boton peligro" data-acc="borrar">Borrar datos de esta sesión</button></div>`;


  // ---------- CSV ----------
  const descargar = (nombre, filas) => {
    const csv = '﻿' + filas.map((f) => f.join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `${nombre}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  const n = (x) => (x == null ? '' : String(x).replace('.', ','));
  const q = (s) => '"' + String(s ?? '').replace(/"/g, '""') + '"';

  const csvCE = () => {
    const cab = ['Nombre', 'Carnet', 'Inicio', 'Duración (min)', 'Estado', 'Nota (/100)', `Ponderada (/${CE.META.peso})`, 'Salidas', 'Segundos fuera', ...Array.from({ length: CE.META.nEval }, (_, j) => `P${j + 1}`)];
    const filas = filasCE().map((f) => [q(f.a.nombre), q(f.a.carnet), q(f.inicio ? fechaBO(f.inicio) : ''), n(f.dur != null ? Math.round(f.dur * 10) / 10 : null), q(f.origen), n(f.nota == null ? null : Math.round(f.nota * 10) / 10), n(f.nota == null ? null : Math.round(f.nota * CE.META.peso) / 100),
      f.sal ? f.sal.n : '', f.sal ? f.sal.seg : '', ...CE.seleccion(f.a.carnet).map((id) => n(f.cal ? Math.round(f.cal.det.find((d) => d.id === id.split(':')[0]).f * 100) / 100 : null))]);
    descargar('examen-final-pl', [cab.map(q), ...filas]);
  };
  const pintar = () => {
    const y = window.scrollY;
    main.innerHTML = `<div class="contenido" style="max-width:900px">
      <div class="pestanas"><button data-v="control" class="${D.vista === 'control' ? 'activo' : ''}">Control</button><button data-v="reporte" class="${D.vista === 'reporte' ? 'activo' : ''}">Reporte</button></div>
      <div id="panel">${D.vista === 'control' ? vistaControl() : vistaReporte()}</div></div>`;
    window.scrollTo(0, y);
  };
  main.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.v) { D.vista = b.dataset.v; return pintar(); }
    const acc = b.dataset.acc;
    if (acc === 'recargar') { await cargar(); return pintar(); }
    if (acc === 'copiar') { const u = location.href.replace(/[^/]*$/, '') + b.dataset.url; try { await navigator.clipboard.writeText(u); aviso('Enlace copiado.', 'ok'); } catch (x) { aviso(u, 'info'); } return; }
    if (acc === 'csv') return csvCE();
    if (acc === 'abrir') {
      const c = extra().cierra ? Date.parse(extra().cierra) : null;
      if (c && c < Date.now()) return aviso('La fecha de cierre ya pasó: cámbiala primero.');
      return cambiar({ abre: new Date().toISOString() }, 'Examen abierto.');
    }
    if (acc === 'cerrar') return cambiar({ cierra: new Date().toISOString() }, 'Examen cerrado.');
    if (acc === 'ocultar') return cambiar({ abre: null }, 'Volvió a «No abierto».');
    if (acc === 'publicar') return cambiar({ publica: new Date().toISOString() }, 'Nota y soluciones publicadas.');
    if (acc === 'guardar-fechas') {
      const v = (id) => { const e2 = II.$('#' + id); return e2 && e2.value ? deEntradaBO(e2.value) : null; };
      const a = v('f-abre'), c = v('f-cierra'), p = v('f-publica');
      if (a && c && c <= a) return aviso('El cierre debe ser después de la apertura.');
      if (p && c && p < c) return aviso('La publicación no puede ser antes del cierre.');
      return cambiar({ abre: a ? new Date(a - 59000).toISOString() : null, cierra: c ? new Date(c).toISOString() : null, publica: p ? new Date(p).toISOString() : null }, 'Fechas guardadas.');
    }
    if (acc === 'borrar') {
      if (!D.armadoBorrar) { D.armadoBorrar = true; b.textContent = '¿Seguro? Se borran las respuestas reales también. Toca otra vez'; b.classList.add('confirmar'); setTimeout(() => { D.armadoBorrar = false; if (b.isConnected) { b.textContent = 'Borrar datos de esta sesión'; b.classList.remove('confirmar'); } }, 4000); return; }
      D.armadoBorrar = false; b.disabled = true;
      const r1 = await II.sb.from('respuestas').delete().eq('sesion', ses());
      const r2 = await II.sb.from('ingresos').delete().eq('sesion', ses());
      if (r1.error || r2.error) { aviso('No se pudo borrar: ' + ((r1.error || r2.error).message)); b.disabled = false; return; }
      await cargar(); pintar(); aviso('Datos borrados.', 'ok');
    }
  });

  if (!II.configurado) { main.innerHTML = '<div class="contenido angosto"><div class="tarjeta"><div class="aviso mal">Falta configurar Supabase.</div></div></div>'; return; }
  II.sb.auth.getSession().then(({ data }) => { if (data && data.session) verificar(); else pintarLogin(); });
})();
