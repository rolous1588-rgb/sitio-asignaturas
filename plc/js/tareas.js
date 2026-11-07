// ============================================================
// Panel docente del control de estudio (pl-ce) y del foro (pl-foro)
// Abrir y cerrar, cambiar fechas, avance, reporte con nota calculada aquí, CSV para Excel, borrar datos de prueba.
// ============================================================
(function () {
  const II = window.II, CE = II.CE, F = II.FORO;
  const main = II.$('#principal');
  const T = { ce: { ses: 'pl-ce', peso: CE.META.peso }, foro: { ses: 'pl-foro', peso: F.peso } };
  const D = { tab: II.params.get('t') === 'foro' ? 'foro' : 'ce', vista: 'control', filas: {}, resp: {}, alumnos: [], fantasmas: [], armadoBorrar: false };
  II.$('#b-icono').innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5"/><circle cx="12" cy="16" r="1.4" fill="#fff"/></svg>';
  II.alCambiarConexion((ok) => { II.$('#b-conexion').className = 'punto-conexion ' + (ok ? 'ok' : 'mal'); });

  const fechaBO = (ms) => (ms ? new Date(ms).toLocaleString('es-BO', { timeZone: 'America/La_Paz', weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '—');
  const aEntradaBO = (ms) => new Date(ms - 4 * 3600e3).toISOString().slice(0, 16);   // Bolivia: UTC−4 todo el año
  const deEntradaBO = (v) => Date.parse(v + ':59-04:00');
  const aviso = (t, c = 'mal') => { const a = II.html(`<div class="aviso ${c} aviso-flotante">${t}</div>`); document.body.appendChild(a); setTimeout(() => a.remove(), 4500); };
  const ses = () => T[D.tab].ses;
  const extra = () => (D.filas[ses()] && D.filas[ses()].extra) || {};

  // ---------- acceso ----------
  const pintarLogin = (msg) => {
    main.innerHTML = `<div class="contenido angosto"><div class="tarjeta"><span class="etiqueta">Acceso docente</span><h2>Control y foro</h2>
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
      II.sb.from('estado_sesion').select('*').in('sesion', ['pl-ce', 'pl-foro']),
      II.sb.from('estudiantes').select('carnet,nombre,fantasma')
    ]);
    D.filas = {}; (f.data || []).forEach((x) => { D.filas[x.sesion] = x; });
    D.alumnos = (al.data || []).filter((a) => !a.fantasma); D.fantasmas = (al.data || []).filter((a) => a.fantasma).map((a) => a.carnet);
    D.resp['pl-ce'] = await traer('pl-ce', (q) => q.neq('actividad', 'eval-avance'));
    D.avance = await traer('pl-ce', (q) => q.eq('actividad', 'eval-avance'));
    D.resp['pl-foro'] = await traer('pl-foro', (q) => q);
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
    const ex = (D.filas['pl-ce'] || {}).extra || {}, minutos = ex.minutos || CE.META.minutos;
    const cierra = ex.cierra ? Date.parse(ex.cierra) : null, ahora = Date.now();
    const rs = sinFantasma(D.resp['pl-ce']), av = sinFantasma(D.avance || []);
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
    <p class="nota" style="margin:6px 0 0">La base de datos rechaza cualquier envío fuera de estas fechas. El control y el foro abren al mismo tiempo.</p></div>`;

  const vistaControlCE = () => {
    const ex = extra(), abre = ex.abre ? Date.parse(ex.abre) : null, cierra = ex.cierra ? Date.parse(ex.cierra) : null, t = Date.now();
    const est = !D.filas['pl-ce'] ? 'falta' : !abre || t < abre ? 'antes' : cierra && t >= cierra ? 'cerrada' : 'abierta';
    const txt = { falta: '<b style="color:var(--mal)">Falta crear la fila pl-ce (aplicar control-foro-pl.sql)</b>', antes: '<b style="color:var(--duda)">No abierto</b>', abierta: '<b style="color:var(--ok)">Abierto</b>', cerrada: '<b style="color:var(--mal)">Cerrado</b>; ya no se registra nada' }[est];
    const fl = filasCE(), con = fl.filter((f) => f.cal);
    const prom = con.length ? con.reduce((s, f) => s + f.nota, 0) / con.length : null;
    return `<div class="paso-actual"><span class="etiqueta">${CE.META.titulo}; un intento; ${CE.META.minutos} min; ${CE.META.nEval} preguntas; vale ${CE.META.peso} %</span><div class="nota">Estado: ${txt}</div></div>
      <div class="tarjeta" style="padding:14px;margin-bottom:12px"><div style="display:grid;gap:4px"><div><b>Abre:</b> ${fechaBO(abre)}</div><div><b>Cierra:</b> ${fechaBO(cierra)}</div></div>
        <div class="controles" style="margin-top:10px">${est !== 'abierta' ? '<button class="boton primario" data-acc="abrir">Abrir ahora</button>' : '<button class="boton peligro" data-acc="cerrar">Cerrar ahora</button>'}
          ${abre ? '<button class="boton chico" data-acc="ocultar">Volver a «No abierto»</button>' : ''}</div></div>
      ${bloqueFechas([['f-abre', 'Abre', abre], ['f-cierra', 'Cierra', cierra]])}
      ${metricas([[fl.filter((f) => f.inicio).length, 'Empezaron'], [fl.filter((f) => f.estado === 'enviada').length, 'Enviaron'], [fl.filter((f) => f.estado === 'curso').length, 'Rindiendo ahora'], [prom == null ? '—' : II.fmt(prom, 1), 'Promedio /100']])}
      <div class="tarjeta" style="padding:14px"><div class="controles"><a class="boton chico" href="estudio.html?modo=revision" target="_blank" rel="noopener">Revisar como estudiante (no registra nada) ↗</a>
        <a class="boton chico" href="estudio.html?modo=revision#banco" target="_blank" rel="noopener">Ver el banco de preguntas ↗</a>
        <button class="boton chico" data-acc="copiar" data-url="estudio.html">Copiar enlace de estudiantes</button></div></div>`;
  };
  const vistaReporteCE = () => {
    const fl = filasCE(), chip = { enviada: 'ok', avance: 'duda', curso: 'acento', sin: 'mal', no: '' };
    return `<div class="controles" style="margin-bottom:12px"><button class="boton primario" data-acc="csv">Descargar para Excel (.csv)</button><button class="boton" data-acc="recargar">Actualizar</button></div>
      <p class="nota">La nota se recalcula aquí con las respuestas guardadas. Ponderada = nota × ${II.fmt(CE.META.peso / 100, 2)}. La cuenta fantasma no aparece.</p>
      <div class="tabla-envoltura"><table class="tabla"><tr><th>Nombre</th><th>Nota /100</th><th>Pond. /${CE.META.peso}</th><th>Estado</th><th>Inicio</th><th>Duración</th><th>Salidas</th><th>Carnet</th></tr>
      ${fl.map((f) => `<tr><td>${II.esc(f.a.nombre)}</td><td class="n"><b>${f.nota == null ? '—' : II.fmt(f.nota, 1)}</b></td><td class="n">${f.nota == null ? '—' : II.fmt((f.nota * CE.META.peso) / 100, 2)}</td>
        <td><span class="chip ${chip[f.estado]}" style="white-space:normal">${f.origen}</span></td><td class="n">${f.inicio ? fechaBO(f.inicio) : '—'}</td><td class="n">${f.dur != null ? II.fmt(f.dur, 1) + ' min' : '—'}</td>
        <td class="n">${f.sal ? f.sal.n + ' (' + f.sal.seg + ' s)' : '—'}</td><td>${II.esc(f.a.carnet)}</td></tr>`).join('')}</table></div>
      ${borrarBloque()}`;
  };

  // ---------- foro ----------
  const notasForo = () => F.notas(D.resp['pl-foro'], D.alumnos, D.fantasmas, (D.filas['pl-foro'] && D.filas['pl-foro'].extra && D.filas['pl-foro'].extra.restituidos) || []);
  const vistaControlForo = () => {
    const ex = extra(), abre = ex.abre ? Date.parse(ex.abre) : null, f1 = ex.fase1 ? Date.parse(ex.fase1) : null, f2 = ex.fase2 ? Date.parse(ex.fase2) : null, t = Date.now();
    const fase = !D.filas['pl-foro'] ? 'falta' : !abre || t < abre ? 'antes' : t <= f1 ? 'f1' : t <= f2 ? 'f2' : 'fin';
    const txt = { falta: '<b style="color:var(--mal)">Falta crear la fila pl-foro (aplicar control-foro-pl.sql)</b>', antes: '<b style="color:var(--duda)">No abierto</b>', f1: '<b style="color:var(--ok)">Fase 1; los estudiantes escriben su aporte</b>', f2: '<b style="color:var(--ok)">Fase 2; evalúan a tres compañeros</b>', fin: '<b style="color:var(--mal)">Terminado</b>' }[fase];
    const rs = sinFantasma(D.resp['pl-foro']);
    const ap = new Set(rs.filter((r) => r.actividad === 'foro-aporte').map((r) => r.carnet));
    const ev = rs.filter((r) => r.actividad === 'foro-eval');
    const nEv = new Set(ev.map((r) => r.carnet));
    return `<div class="paso-actual"><span class="etiqueta">${F.titulo}; vale ${F.peso} %</span><div class="nota">Estado: ${txt}</div></div>
      <div class="tarjeta" style="padding:14px;margin-bottom:12px"><div style="display:grid;gap:4px"><div><b>Abre:</b> ${fechaBO(abre)}</div><div><b>Fase 1 hasta:</b> ${fechaBO(f1)}</div><div><b>Fase 2 hasta:</b> ${fechaBO(f2)}</div></div>
        <div class="controles" style="margin-top:10px">${fase === 'antes' || fase === 'falta' ? '<button class="boton primario" data-acc="foro-abrir">Abrir ahora</button>' : ''}
          ${abre && fase !== 'antes' ? '<button class="boton chico" data-acc="foro-ocultar">Volver a «No abierto»</button>' : ''}</div></div>
      ${bloqueFechas([['f-abre', 'Abre', abre], ['f-f1', 'Fin de la fase 1', f1], ['f-f2', 'Fin de la fase 2 (cierre)', f2]])}
      ${metricas([[ap.size, 'Publicaron aporte'], [ev.length, 'Evaluaciones'], [nEv.size, 'Evaluadores'], [D.alumnos.length, 'En la lista']])}
      <div class="tarjeta" style="padding:14px"><div class="controles"><a class="boton chico" href="foro.html" target="_blank" rel="noopener">Abrir el foro (con tu cuenta fantasma es ensayo) ↗</a>
        <button class="boton chico" data-acc="copiar" data-url="foro.html">Copiar enlace de estudiantes</button></div></div>`;
  };
  const vistaReporteForo = () => {
    const ns = notasForo();
    return `<div class="controles" style="margin-bottom:12px"><button class="boton primario" data-acc="csv">Descargar para Excel (.csv)</button><button class="boton" data-acc="recargar">Actualizar</button></div>
      <p class="nota">Nota /100 = cumplimiento (20) + calidad (50) + evaluaciones hechas (15) + evaluar con criterio (15). Ponderada = nota × 0,25. Si 2 o más evaluadores marcan «no pude abrir el documento», la calidad es 0 y aparece «Sin acceso»: puedes restituirla si hubo un error (abre el enlace y compruébalo). El enlace de cada aporte está junto a esa columna.</p>
      <div class="tabla-envoltura"><table class="tabla"><tr><th>Nombre</th><th>Máquina</th><th>Cumpl. /20</th><th>Calidad /50</th><th>Eval. /15</th><th>Criterio /15</th><th>Nota /100</th><th>Pond. /${F.peso}</th><th>Alertas</th><th>Enlace</th><th>Acceso</th></tr>
      ${ns.map((x) => `<tr><td>${II.esc(x.a.nombre)}</td><td style="white-space:normal">${x.aporte ? II.esc((x.aporte.respuesta.maquina || {}).nombre || '') : '—'}</td><td class="n">${II.fmt(x.ptsCumpl, 1)}</td><td class="n">${II.fmt(x.ptsCal, 1)}</td><td class="n">${II.fmt(x.ptsEval, 1)}</td><td class="n">${II.fmt(x.ptsBuen, 1)}</td>
        <td class="n"><b>${II.fmt(x.nota, 1)}</b></td><td class="n">${II.fmt(x.pond, 2)}</td><td style="white-space:normal">${x.alertas.map(II.esc).join('; ')}</td>
        <td>${x.aporte && x.aporte.respuesta.enlace ? `<a href="${II.esc(x.aporte.respuesta.enlace)}" target="_blank" rel="noopener">abrir</a>` : '—'}</td>
        <td style="white-space:normal">${x.sinAcceso ? `<b style="color:var(--mal)">Sin acceso (${x.noAbrieron})</b><br><button class="boton chico" data-acc="restituir" data-c="${II.esc(x.a.carnet)}">Restituir calidad</button>`
          : x.restituido ? `<b style="color:var(--ok)">Restituido</b><br><button class="boton chico" data-acc="quitar-restitucion" data-c="${II.esc(x.a.carnet)}">Volver a 0</button>`
          : x.noAbrieron === 1 ? '<span style="color:var(--duda)">1 evaluador no pudo abrir</span>' : '—'}</td></tr>`).join('')}</table></div>
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
    const filas = filasCE().map((f) => [q(f.a.nombre), q(f.a.carnet), q(f.inicio ? fechaBO(f.inicio) : ''), n(f.dur != null ? Math.round(f.dur * 10) / 10 : null), q(f.origen), n(f.nota), n(f.nota == null ? null : Math.round(f.nota * CE.META.peso) / 100),
      f.sal ? f.sal.n : '', f.sal ? f.sal.seg : '', ...CE.seleccion(f.a.carnet).map((id, j) => n(f.cal ? Math.round(f.cal.det.find((d) => d.id === id.split(':')[0]).f * 100) / 100 : null))]);
    descargar('control-de-estudio-pl', [cab.map(q), ...filas]);
  };
  const csvForo = () => {
    const cab = ['Nombre', 'Carnet', 'Máquina', 'Datos', 'Palabras', 'Cumplimiento (/20)', 'Calidad (/50)', 'Evaluaciones hechas (/15)', 'Evaluar con criterio (/15)', 'Nota (/100)', `Ponderada (/${F.peso})`, 'Evaluaciones recibidas', 'Evaluaciones hechas', 'Enlace', 'Evaluadores que no pudieron abrir', 'Alertas'];
    const filas = notasForo().map((x) => { const m = x.aporte ? x.aporte.respuesta.maquina || {} : {};
      return [q(x.a.nombre), q(x.a.carnet), q(m.nombre || ''), q(m.datos || ''), x.palabras, n(Math.round(x.ptsCumpl * 10) / 10), n(Math.round(x.ptsCal * 10) / 10), n(Math.round(x.ptsEval * 10) / 10), n(Math.round(x.ptsBuen * 10) / 10), n(x.nota), n(x.pond), x.nRecibidas, x.hechas, q(x.aporte ? x.aporte.respuesta.enlace : ''), x.noAbrieron, q(x.alertas.join('; '))]; });
    descargar('foro-pl', [cab.map(q), ...filas]);
  };

  // ---------- pintado ----------
  const pintar = () => {
    const y = window.scrollY;
    main.innerHTML = `<div class="contenido" style="max-width:900px">
      <div class="pestanas"><button data-t="ce" class="${D.tab === 'ce' ? 'activo' : ''}">Control de estudio</button><button data-t="foro" class="${D.tab === 'foro' ? 'activo' : ''}">Foro</button></div>
      <div class="pestanas"><button data-v="control" class="${D.vista === 'control' ? 'activo' : ''}">Control</button><button data-v="reporte" class="${D.vista === 'reporte' ? 'activo' : ''}">Reporte</button></div>
      <div id="panel">${D.tab === 'ce' ? (D.vista === 'control' ? vistaControlCE() : vistaReporteCE()) : (D.vista === 'control' ? vistaControlForo() : vistaReporteForo())}</div></div>`;
    window.scrollTo(0, y);
  };
  main.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.t) { D.tab = b.dataset.t; return pintar(); }
    if (b.dataset.v) { D.vista = b.dataset.v; return pintar(); }
    const acc = b.dataset.acc;
    if (acc === 'recargar') { await cargar(); return pintar(); }
    if (acc === 'copiar') { const u = location.href.replace(/[^/]*$/, '') + b.dataset.url; try { await navigator.clipboard.writeText(u); aviso('Enlace copiado.', 'ok'); } catch (x) { aviso(u, 'info'); } return; }
    if (acc === 'csv') return D.tab === 'ce' ? csvCE() : csvForo();
    if (acc === 'abrir') {
      const c = extra().cierra ? Date.parse(extra().cierra) : null;
      if (c && c < Date.now()) return aviso('La fecha de cierre ya pasó: cámbiala primero.');
      return cambiar({ abre: new Date().toISOString() }, 'Control abierto.');
    }
    if (acc === 'cerrar') return cambiar({ cierra: new Date().toISOString() }, 'Control cerrado.');
    if (acc === 'ocultar') return cambiar({ abre: null }, 'Volvió a «No abierto».');
    if (acc === 'foro-abrir') {
      const f2 = extra().fase2 ? Date.parse(extra().fase2) : null;
      if (f2 && f2 < Date.now()) return aviso('Las fechas del foro ya pasaron: cámbialas primero.');
      return cambiar({ abre: new Date().toISOString() }, 'Foro abierto.');
    }
    if (acc === 'restituir' || acc === 'quitar-restitucion') {
      const c = b.dataset.c, l = (extra().restituidos || []).filter((x) => x !== c);
      return cambiar({ restituidos: acc === 'restituir' ? l.concat(c) : l }, acc === 'restituir' ? 'Calidad restituida.' : 'Restitución quitada.');
    }
    if (acc === 'foro-ocultar') return cambiar({ abre: null }, 'Volvió a «No abierto».');
    if (acc === 'guardar-fechas') {
      const v = (id) => { const e2 = II.$('#' + id); return e2 && e2.value ? deEntradaBO(e2.value) : null; };
      if (D.tab === 'ce') {
        const a = v('f-abre'), c = v('f-cierra');
        if (a && c && c <= a) return aviso('El cierre debe ser después de la apertura.');
        return cambiar({ abre: a ? new Date(a - 59000).toISOString() : null, cierra: c ? new Date(c).toISOString() : null }, 'Fechas guardadas.');
      }
      const a = v('f-abre'), f1 = v('f-f1'), f2 = v('f-f2');
      if (!f1 || !f2 || f2 <= f1 || (a && f1 <= a)) return aviso('Revisa el orden: apertura, fin de la fase 1, fin de la fase 2.');
      return cambiar({ abre: a ? new Date(a - 59000).toISOString() : null, fase1: new Date(f1).toISOString(), fase2: new Date(f2).toISOString(), cierra: new Date(f2).toISOString() }, 'Fechas guardadas.');
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
