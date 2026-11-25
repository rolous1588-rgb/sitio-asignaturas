// ============================================================
// Medidas Eléctricas: simulacro del examen final, panel del docente (25/11/2026).
// Entra con la cuenta docente. Abre o cierra el registro (estado_sesion me-sim: extra.asincrona, abre, cierra),
// muestra el enlace para los estudiantes, quién practicó, sus simulacros y notas, dónde fallan más,
// y descarga las notas para Excel. Lee respuestas (actividad «sim») e ingresos en forma incremental.
// ============================================================
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = II.esc;
  const SID = 'me-sim';
  const cont = $('#cont');
  const enlace = new URL('index.html', location.href).href.replace(/\?.*$/, '');
  let fila = null, sims = [], ingresos = [], ultId = 0, orden = 'nota', detalle = null;

  II.alCambiarConexion((ok) => { $('#e-con').className = 'punto ' + (ok ? 'on' : 'off'); });

  async function esDocente() {
    try { const { data, error } = await II.sb.from('docentes').select('email').limit(1); return !error && !!(data && data.length); } catch (e) { return false; }
  }
  function vIngreso() {
    cont.innerHTML = `<div class="tarjeta"><span class="etq">Simulacro del examen final</span><h2>Panel del docente</h2><p>Entra con tu cuenta docente (la misma de las otras materias).</p>
      <form id="f-doc"><label class="campo"><span>Correo</span><input name="email" type="email" required autocomplete="username"></label>
      <label class="campo"><span>Contraseña</span><input name="clave" type="password" required autocomplete="current-password"></label>
      <p class="sm-err" id="d-err"></p><button class="boton prim bloque" type="submit">Entrar</button></form></div>`;
    $('#f-doc').onsubmit = async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target), err = $('#d-err');
      err.textContent = 'Entrando…';
      const { error } = await II.sb.auth.signInWithPassword({ email: String(fd.get('email')).trim(), password: String(fd.get('clave')) });
      if (error) { err.textContent = 'Correo o contraseña incorrectos.'; return; }
      if (!(await esDocente())) { err.textContent = 'Esta cuenta no tiene permiso de docente.'; await II.sb.auth.signOut(); return; }
      arrancar();
    };
  }

  // ---------------- datos ----------------
  async function leerFila() {
    const { data, error } = await II.sb.from('estado_sesion').select('extra').eq('sesion', SID).maybeSingle();
    if (error) { II.marcarConexion(false); return; }
    if (!data) {
      const extra = { asincrona: true, abre: null, cierra: null };
      await II.sb.from('estado_sesion').insert({ sesion: SID, paso: 'sim', extra });
      fila = extra;
    } else fila = data.extra || {};
    II.marcarConexion(true);
  }
  async function guardarFila(cambios) {
    await leerFila();
    const extra = Object.assign({}, fila, cambios, { asincrona: true });
    const { error } = await II.sb.from('estado_sesion').update({ extra, actualizado: new Date().toISOString() }).eq('sesion', SID);
    if (error) { alert('No se pudo guardar: ' + error.message); return; }
    fila = extra; pintar();
  }
  async function leerDatos() {
    try {
      for (;;) {
        const { data, error } = await II.sb.from('respuestas').select('id,carnet,nombre,respuesta,puntaje,creado').eq('sesion', SID).eq('actividad', 'sim').gt('id', ultId).order('id').range(0, 999);
        if (error) throw error;
        (data || []).forEach((r) => { sims.push(r); ultId = Math.max(ultId, r.id); });
        if (!data || data.length < 1000) break;
      }
      const { data: di, error: e2 } = await II.sb.from('ingresos').select('carnet,nombre,info,creado').eq('sesion', SID).order('id').range(0, 4999);
      if (e2) throw e2;
      ingresos = di || [];
      II.marcarConexion(true);
    } catch (e) { II.marcarConexion(false); }
  }
  const abierto = () => !!(fila && fila.abre && Date.parse(fila.abre) <= Date.now() && (!fila.cierra || Date.parse(fila.cierra) > Date.now()));

  // por estudiante
  function porEstudiante() {
    const m = new Map();
    const de = (carnet, nombre) => { if (!m.has(carnet)) m.set(carnet, { carnet, nombre, car: '', sims: [], entro: null }); const e = m.get(carnet); if (nombre) e.nombre = nombre; return e; };
    ingresos.forEach((i) => { const e = de(i.carnet, i.nombre); e.car = (i.info && i.info.car) || e.car; if (!e.entro || i.creado < e.entro) e.entro = i.creado; });
    sims.forEach((r) => { const e = de(r.carnet, r.nombre); e.sims.push(r); if (r.respuesta && r.respuesta.car) e.car = r.respuesta.car; });
    return [...m.values()].map((e) => {
      const notas = e.sims.map((r) => Number(r.puntaje));
      const mejor = notas.length ? Math.max(...notas) : null, ult = e.sims.length ? e.sims[e.sims.length - 1] : null;
      return Object.assign(e, { mejor, ultima: ult ? Number(ult.puntaje) : null, prom: notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null, fecha: ult ? ult.creado : e.entro });
    });
  }
  const f1 = (x) => (x == null ? '—' : String(Math.round(x * 10) / 10).replace('.', ','));
  const fecha = (t) => (t ? new Date(t).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');

  // ---------------- pintar ----------------
  function pintar() {
    if (detalle) return pintarDetalle();
    const est = porEstudiante(), practicaron = est.filter((e) => e.sims.length), ab = abierto();
    const promMejor = practicaron.length ? practicaron.reduce((a, e) => a + e.mejor, 0) / practicaron.length : null;
    const ord = est.slice().sort((a, b) => orden === 'nota' ? (b.mejor ?? -1) - (a.mejor ?? -1) : orden === 'ap' ? a.nombre.localeCompare(b.nombre, 'es') : orden === 'n' ? b.sims.length - a.sims.length : String(b.fecha || '').localeCompare(String(a.fecha || '')));
    cont.innerHTML = `
      <div class="tarjeta"><span class="etq">Registro</span>
        <p><span class="pn-estado ${ab ? 'si' : 'no'}">${ab ? 'Abierto' : 'Cerrado'}</span> ${ab ? 'Las notas de los simulacros se guardan.' : fila && fila.abre ? 'Los estudiantes pueden practicar, pero sus notas ya no se guardan.' : 'Todavía no se abrió: las notas no se guardan.'}</p>
        <div class="pn-fila">${ab ? '<button class="boton" id="b-cerrar">Cerrar ahora</button>' : '<button class="boton prim" id="b-abrir">Abrir ahora</button>'}</div></div>
      <div class="tarjeta"><span class="etq">Enlace para los estudiantes</span><p class="pn-enlace">${esc(enlace)}</p>
        <div class="pn-fila"><button class="boton prim" id="b-copiar">Copiar enlace</button><a class="boton" href="index.html?modo=prueba" target="_blank" rel="noopener">Probar como estudiante</a></div>
        <p class="sm-ayuda" style="margin-top:8px">«Probar como estudiante» no envía nada.</p></div>
      <div class="tarjeta"><span class="etq">Resumen</span><div class="pn-cifras">
        <div><b>${est.length}</b><small>entraron</small></div><div><b>${practicaron.length}</b><small>terminaron al menos un simulacro</small></div>
        <div><b>${sims.length}</b><small>simulacros terminados</small></div><div><b>${f1(promMejor)}</b><small>promedio de la mejor nota</small></div></div>
        <div class="pn-fila" style="margin-top:10px"><button class="boton" id="b-act">Actualizar</button><button class="boton" id="b-csv">Descargar notas (Excel)</button></div></div>
      <div class="tarjeta"><span class="etq">Estudiantes</span>
        <div class="pn-orden">${[['nota', 'Mejor nota'], ['ap', 'Apellido'], ['n', 'Más simulacros'], ['f', 'Más reciente']].map(([k, t]) => `<button data-o="${k}" class="${orden === k ? 'on' : ''}">${t}</button>`).join('')}</div>
        <div class="pn-lista">${ord.length ? ord.map((e) => `<button class="pn-est" data-c="${esc(e.carnet)}"><span><b>${esc(e.nombre)}</b></span><b class="n">${f1(e.mejor)}</b>
          <small>C.U. ${esc(e.carnet)}; ${e.sims.length ? `${e.sims.length} simulacro${e.sims.length > 1 ? 's' : ''}; último ${fecha(e.fecha)}` : 'entró, todavía no terminó ninguno'}</small></button>`).join('') : '<p class="sm-ayuda">Todavía nadie entró.</p>'}</div></div>
      ${dificultad()}
      <p class="sm-pie"><a href="#" id="b-salir">Salir</a></p>`;
    const b = (id, fn) => { const x = $('#' + id); if (x) x.onclick = fn; };
    b('b-abrir', () => guardarFila({ abre: new Date().toISOString(), cierra: null }));
    b('b-cerrar', () => { if (confirm('¿Cerrar el registro? Los estudiantes podrán practicar, pero sus notas ya no se guardarán.')) guardarFila({ cierra: new Date().toISOString() }); });
    b('b-copiar', async () => { try { await navigator.clipboard.writeText(enlace); $('#b-copiar').textContent = 'Copiado ✓'; } catch (e) { prompt('Copia el enlace:', enlace); } });
    b('b-act', async () => { await leerDatos(); pintar(); });
    b('b-csv', csv);
    b('b-salir', async (ev) => { ev.preventDefault(); await II.sb.auth.signOut(); location.reload(); });
    cont.querySelectorAll('[data-o]').forEach((x) => (x.onclick = () => { orden = x.dataset.o; pintar(); }));
    cont.querySelectorAll('.pn-est').forEach((x) => (x.onclick = () => { detalle = x.dataset.c; pintar(); window.scrollTo(0, 0); }));
  }
  function dificultad() {
    if (!sims.length) return '';
    const filas = SM.PREG.map((q) => {
      const v = sims.map((r) => (r.respuesta && r.respuesta.pts ? Number(r.respuesta.pts[q.id]) : NaN)).filter((x) => isFinite(x));
      const pct = v.length ? (v.reduce((a, b) => a + b, 0) / v.length / q.pts) * 100 : null;
      return { q, pct };
    }).filter((x) => x.pct != null).sort((a, b) => a.pct - b.pct);
    return `<div class="tarjeta"><span class="etq">Dónde fallan más</span><p class="sm-ayuda">Porcentaje de puntos logrados en cada pregunta, en todos los simulacros terminados.</p>
      <table class="sm-tab pn-difi">${filas.map((x) => `<tr><td><b>${x.q.id}</b> ${esc(x.q.t)}<div class="pn-barra ${x.pct < 40 ? 'bajo' : x.pct < 70 ? 'medio' : ''}"><i style="width:${Math.round(x.pct)}%"></i></div></td><td class="n">${Math.round(x.pct)} %</td></tr>`).join('')}</table></div>`;
  }
  function pintarDetalle() {
    const e = porEstudiante().find((x) => x.carnet === detalle);
    if (!e) { detalle = null; return pintar(); }
    const filas = e.sims.map((r) => { const x = r.respuesta || {}, p = x.partes || {}; return `<tr><td>${x.k || '—'}</td><td>${fecha(r.creado)}</td><td class="n">${f1(Number(r.puntaje))}</td>${SM.PARTES.map((pp) => `<td class="n">${f1(p[pp.id])}</td>`).join('')}<td class="n">${x.seg ? Math.round(x.seg / 60) : '—'}</td></tr>`; }).join('');
    cont.innerHTML = `<div class="tarjeta"><span class="etq">Estudiante</span><h2>${esc(e.nombre)}</h2><p>C.U. ${esc(e.carnet)}; ${esc(e.car || 'carrera sin dato')}. Entró: ${fecha(e.entro)}.</p>
      <div class="pn-cifras"><div><b>${f1(e.mejor)}</b><small>mejor nota</small></div><div><b>${f1(e.ultima)}</b><small>última nota</small></div><div><b>${e.sims.length}</b><small>simulacros terminados</small></div><div><b>${f1(e.prom)}</b><small>promedio</small></div></div></div>
      ${e.sims.length ? `<div class="tarjeta" style="overflow-x:auto"><span class="etq">Sus simulacros</span><table class="sm-tab"><tr><th>N.º</th><th>Fecha</th><th>Nota</th>${SM.PARTES.map((p) => `<th>${p.id}<br><small>/${p.max}</small></th>`).join('')}<th>Min</th></tr>${filas}</table>
        <p class="sm-ayuda">Min: minutos entre que empezó y terminó (puede incluir pausas).</p></div>` : ''}
      <div class="pn-fila"><button class="boton" id="b-volver">← Volver a la lista</button><button class="boton" id="b-borrar">Borrar los datos de este estudiante</button></div>`;
    $('#b-volver').onclick = () => { detalle = null; pintar(); };
    let armado = false;
    $('#b-borrar').onclick = async () => {
      const b = $('#b-borrar');
      if (!armado) { armado = true; b.textContent = 'Toca otra vez para borrar (sirve para quitar pruebas)'; setTimeout(() => { armado = false; if (b.isConnected) b.textContent = 'Borrar los datos de este estudiante'; }, 4000); return; }
      await Promise.all([II.sb.from('respuestas').delete().eq('sesion', SID).eq('carnet', e.carnet), II.sb.from('ingresos').delete().eq('sesion', SID).eq('carnet', e.carnet)]);
      sims = sims.filter((r) => r.carnet !== e.carnet); ingresos = ingresos.filter((r) => r.carnet !== e.carnet); detalle = null; pintar();
    };
  }
  function csv() {
    const num = (x) => (x == null || !isFinite(x) ? '' : String(Math.round(x * 10) / 10).replace('.', ','));
    const est = porEstudiante().sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const cab = ['Apellidos y nombres', 'C.U.', 'Carrera', 'Simulacros terminados', 'Mejor nota', 'Última nota', 'Promedio', ...SM.PARTES.map((p) => `Parte ${p.id} del mejor (/${p.max})`), 'Primer ingreso', 'Último simulacro'];
    const filas = est.map((e) => {
      const mejor = e.sims.slice().sort((a, b) => Number(b.puntaje) - Number(a.puntaje))[0], p = (mejor && mejor.respuesta && mejor.respuesta.partes) || {};
      return [e.nombre, e.carnet, e.car, e.sims.length, num(e.mejor), num(e.ultima), num(e.prom), ...SM.PARTES.map((pp) => num(p[pp.id])), fecha(e.entro), e.sims.length ? fecha(e.fecha) : ''];
    });
    const txt = '﻿' + [cab, ...filas].map((f) => f.map((c) => { const s = String(c == null ? '' : c); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' }));
    a.download = 'Simulacro_final_Medidas_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
  }

  async function arrancar() {
    cont.innerHTML = '<div class="tarjeta"><p>Cargando…</p></div>';
    await leerFila(); await leerDatos(); pintar();
    setInterval(async () => { if (document.visibilityState !== 'visible') return; await leerDatos(); if (!document.activeElement || document.activeElement === document.body) pintar(); }, 30000);
  }
  (async () => {
    if (!II.sb) { cont.innerHTML = '<div class="tarjeta"><p>No se pudo cargar la conexión. Revisa tu internet y recarga la página.</p></div>'; return; }
    const { data } = await II.sb.auth.getSession();
    if (data && data.session && (await esDocente())) arrancar(); else vIngreso();
  })();
})();
