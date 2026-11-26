// ============================================================
// Transformadas · Práctica para el examen final (25/11/2026) — panel del docente
// Adaptado del panel del simulacro de Medidas (medidas/simulacro/js/sm-panel.js, copiado, no cargado).
// Entra con la cuenta docente. Abre o cierra el registro (estado_sesion tf-practica: extra.asincrona, abre, cierra),
// muestra el enlace, quién practicó, cuánto y en qué tema, dónde falla el curso (por tema y por casilla, al primer intento),
// los simulacros y sus notas, y descarga todo para Excel. Lee respuestas («prac» y «sim») e ingresos en forma incremental.
// ============================================================
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = II.esc;
  const SID = 'tf-practica';
  const cont = $('#cont');
  const enlace = new URL('index.html', location.href).href.replace(/\?.*$/, '');
  let fila = null, regs = [], ingresos = [], ultId = 0, orden = 'n', detalle = null;
  const f1 = (x) => (x == null || !isFinite(x) ? '—' : String(Math.round(x * 10) / 10).replace('.', ','));
  const pc = (x) => (x == null || !isFinite(x) ? '—' : Math.round(x) + '\u00a0%');
  const fecha = (t) => (t ? new Date(t).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');

  II.alCambiarConexion((ok) => { $('#e-con').className = 'punto ' + (ok ? 'on' : 'off'); });

  async function esDocente() {
    try { const { data, error } = await II.sb.from('docentes').select('email').limit(1); return !error && !!(data && data.length); } catch (e) { return false; }
  }
  function vIngreso() {
    cont.innerHTML = `<div class="tarjeta"><span class="etq">Práctica para el examen final</span><h2>Panel del docente</h2><p>Entra con tu cuenta docente (la misma de las otras materias).</p>
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
      const extra = { asincrona: true, abre: new Date().toISOString(), cierra: null };
      await II.sb.from('estado_sesion').insert({ sesion: SID, paso: 'practica', extra });
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
        const { data, error } = await II.sb.from('respuestas').select('id,actividad,carnet,nombre,respuesta,puntaje,creado').eq('sesion', SID).gt('id', ultId).order('id').range(0, 999);
        if (error) throw error;
        (data || []).forEach((r) => { if (r.actividad === 'prac' || r.actividad === 'sim') regs.push(r); ultId = Math.max(ultId, r.id); });
        if (!data || data.length < 1000) break;
      }
      const { data: di, error: e2 } = await II.sb.from('ingresos').select('carnet,nombre,info,creado').eq('sesion', SID).order('id').range(0, 4999);
      if (e2) throw e2;
      ingresos = di || [];
      II.marcarConexion(true);
    } catch (e) { II.marcarConexion(false); }
  }
  const abierto = () => !!(fila && fila.abre && Date.parse(fila.abre) <= Date.now() && (!fila.cierra || Date.parse(fila.cierra) > Date.now()));

  // un ejercicio = el 1.er «Revisar» (modo examen) o el último envío de un paso a paso (a medias o completo)
  let cacheEj = null, cacheN = -1;
  function ejercicios() {
    if (cacheN === regs.length) return cacheEj;
    const m = new Map();
    regs.forEach((r) => {
      if (r.actividad !== 'prac' || !r.respuesta) return;
      const x = r.respuesta, clave = r.carnet + '|' + x.t + '|' + x.n + '|' + x.modo;
      if (x.modo === 'guia') m.set(clave, r);
      else if (Number(x.int) === 1 && !m.has(clave)) m.set(clave, r);
    });
    cacheEj = [...m.values()].sort((a, b) => a.id - b.id); cacheN = regs.length;
    return cacheEj;
  }
  const idsEj = () => new Set(ejercicios().map((r) => r.id));
  // casillas correctas al primer intento en un ejercicio: { ok, tot }
  function casillas(r) {
    const cel = (r.respuesta && r.respuesta.cel) || {};
    let ok = 0, tot = 0;
    Object.values(cel).forEach((v) => { tot++; if (v === 'ok' || v === 'ok1') ok++; });
    return { ok, tot };
  }
  function porEstudiante() {
    const m = new Map(), ids = idsEj();
    const de = (carnet, nombre) => { if (!m.has(carnet)) m.set(carnet, { carnet, nombre, car: '', ej: [], sims: [], entro: null, ult: null }); const e = m.get(carnet); if (nombre) e.nombre = nombre; return e; };
    ingresos.forEach((i) => { const e = de(i.carnet, i.nombre); e.car = (i.info && i.info.car) || e.car; if (!e.entro || i.creado < e.entro) e.entro = i.creado; });
    regs.forEach((r) => {
      const e = de(r.carnet, r.nombre);
      if (r.respuesta && r.respuesta.car) e.car = r.respuesta.car;
      if (!e.ult || r.creado > e.ult) e.ult = r.creado;
      if (r.actividad === 'sim') e.sims.push(r); else if (ids.has(r.id)) e.ej.push(r);
    });
    return [...m.values()].map((e) => {
      const t = {};
      PR.TEMAS.forEach((T) => {
        const l = e.ej.filter((r) => r.respuesta.t === T.id);
        let ok = 0, tot = 0;
        l.forEach((r) => { const c = casillas(r); ok += c.ok; tot += c.tot; });
        t[T.id] = { n: l.length, guia: l.filter((r) => r.respuesta.modo === 'guia').length, pct: tot ? (100 * ok) / tot : null, ult: l.length ? Number(l[l.length - 1].puntaje) : null };
      });
      const mejor = (tipo) => { const l = e.sims.filter((r) => r.respuesta.tipo === tipo).map((r) => Number(r.puntaje)); return l.length ? Math.max(...l) : null; };
      const temas = PR.TEMAS.filter((T) => t[T.id].n).length;
      return Object.assign(e, { t, temas, mejorSim: { lap: mejor('lap'), fou: mejor('fou'), todo: mejor('todo') }, mejorTotal: e.sims.length ? Math.max(...e.sims.map((r) => Number(r.puntaje))) : null });
    });
  }

  // ---------------- pintar ----------------
  function pintar() {
    if (detalle) return pintarDetalle();
    const est = porEstudiante(), practicaron = est.filter((e) => e.ej.length || e.sims.length), ab = abierto();
    const nEj = est.reduce((s, e) => s + e.ej.length, 0), nSim = est.reduce((s, e) => s + e.sims.length, 0);
    const ord = est.slice().sort((a, b) => orden === 'n' ? (b.ej.length + b.sims.length) - (a.ej.length + a.sims.length) : orden === 'ap' ? a.nombre.localeCompare(b.nombre, 'es') : orden === 'sim' ? (b.mejorTotal ?? -1) - (a.mejorTotal ?? -1) : String(b.ult || b.entro || '').localeCompare(String(a.ult || a.entro || '')));
    cont.innerHTML = `
      <div class="tarjeta"><span class="etq">Registro</span>
        <p><span class="pn-estado ${ab ? 'si' : 'no'}">${ab ? 'Abierto' : 'Cerrado'}</span> ${ab ? 'Lo que practican se guarda.' : fila && fila.abre ? 'Pueden practicar, pero ya no se guarda.' : 'Todavía no se abrió: no se guarda nada.'}</p>
        <div class="pn-fila">${ab ? '<button class="boton" id="b-cerrar">Cerrar ahora</button>' : '<button class="boton prim" id="b-abrir">Abrir ahora</button>'}</div></div>
      <div class="tarjeta"><span class="etq">Enlace para los estudiantes</span><p class="pn-enlace">${esc(enlace)}</p>
        <div class="pn-fila"><button class="boton prim" id="b-copiar">Copiar enlace</button><a class="boton" href="index.html?modo=prueba" target="_blank" rel="noopener">Probar como estudiante</a></div>
        <p class="sm-ayuda" style="margin-top:8px">«Probar como estudiante» no envía nada.</p></div>
      <div class="tarjeta"><span class="etq">Resumen</span><div class="pn-cifras">
        <div><b>${est.length}</b><small>entraron</small></div><div><b>${practicaron.length}</b><small>practicaron</small></div>
        <div><b>${nEj}</b><small>ejercicios por tema</small></div><div><b>${nSim}</b><small>simulacros terminados</small></div></div>
        <div class="pn-fila" style="margin-top:10px"><button class="boton" id="b-act">Actualizar</button><button class="boton" id="b-csv">Descargar para Excel</button></div></div>
      ${dificultad()}
      ${simulacros()}
      <div class="tarjeta"><span class="etq">Estudiantes</span>
        <div class="pn-orden">${[['n', 'Más práctica'], ['ap', 'Apellido'], ['sim', 'Mejor simulacro'], ['f', 'Más reciente']].map(([k, t]) => `<button data-o="${k}" class="${orden === k ? 'on' : ''}">${t}</button>`).join('')}</div>
        <div class="pn-lista">${ord.length ? ord.map((e) => `<button class="pn-est" data-c="${esc(e.carnet)}"><span><b>${esc(e.nombre)}</b></span><b class="n">${e.ej.length}</b>
          <small>C.U. ${esc(e.carnet)}; ${e.ej.length || e.sims.length ? `${e.temas} de 9 temas; ${e.sims.length} simulacro${e.sims.length === 1 ? '' : 's'}${e.mejorTotal != null ? ` (mejor ${f1(e.mejorTotal)})` : ''}; ${fecha(e.ult)}` : 'entró, todavía no practicó'}</small></button>`).join('') : '<p class="sm-ayuda">Todavía nadie entró.</p>'}</div>
        <p class="sm-ayuda" style="margin-top:8px">El número de la derecha es la cantidad de ejercicios por tema.</p></div>
      <p class="sm-pie"><a href="#" id="b-salir">Salir</a></p>`;
    const b = (id, fn) => { const x = $('#' + id); if (x) x.onclick = fn; };
    b('b-abrir', () => guardarFila({ abre: new Date().toISOString(), cierra: null }));
    b('b-cerrar', () => { if (confirm('¿Cerrar el registro? Podrán practicar, pero ya no se guardará.')) guardarFila({ cierra: new Date().toISOString() }); });
    b('b-copiar', async () => { try { await navigator.clipboard.writeText(enlace); $('#b-copiar').textContent = 'Copiado ✓'; } catch (e) { prompt('Copia el enlace:', enlace); } });
    b('b-act', async () => { await leerDatos(); pintar(); });
    b('b-csv', csv);
    b('b-salir', async (ev) => { ev.preventDefault(); await II.sb.auth.signOut(); location.reload(); });
    $$('[data-o]').forEach((x) => (x.onclick = () => { orden = x.dataset.o; pintar(); }));
    $$('.pn-est').forEach((x) => (x.onclick = () => { detalle = x.dataset.c; pintar(); window.scrollTo(0, 0); }));
  }

  // etiquetas de las casillas de un problema
  const etiquetas = (T, k) => { const M = T.M; try { const d = M.datos(k, 'x', 'Ingeniería Electromecánica'), o = {}; M.P[k].pasos(d).forEach((ps) => ps.items.forEach((it) => { o[it.id] = { et: it.et, paso: ps.t }; })); return o; } catch (e) { return {}; } };
  function dificultad() {
    const ej = ejercicios();
    if (!ej.length) return '';
    const filas = PR.TEMAS.map((T) => {
      const l = ej.filter((r) => r.respuesta.t === T.id);
      let ok = 0, tot = 0;
      const porCas = {};
      l.forEach((r) => { const k = r.respuesta.k; Object.entries(r.respuesta.cel || {}).forEach(([id, v]) => { tot++; const bien = v === 'ok' || v === 'ok1'; if (bien) ok++; const c = (porCas[k + '|' + id] = porCas[k + '|' + id] || { k, id, ok: 0, tot: 0 }); c.tot++; if (bien) c.ok++; }); });
      const alumnos = new Set(l.map((r) => r.carnet)).size;
      return { T, n: l.length, alumnos, pct: tot ? (100 * ok) / tot : null, cas: Object.values(porCas) };
    });
    return `<div class="tarjeta"><span class="etq">Dónde fallan más</span><p class="sm-ayuda">Casillas correctas al <b>primer intento</b> en los ejercicios de cada tema (paso a paso y como en el examen). Toca un tema para ver cada casilla.</p>
      ${filas.map((x) => {
        const et = {};
        const cas = x.cas.map((c) => { if (!et[c.k]) et[c.k] = etiquetas(x.T, c.k); const l = et[c.k][c.id] || { et: c.id, paso: '' }; return Object.assign(c, { pct: (100 * c.ok) / c.tot, et: l.et, paso: l.paso }); }).sort((a, b) => a.pct - b.pct);
        const varios = new Set(cas.map((c) => c.k)).size > 1;
        return `<details class="pn-tema"><summary><span><b>${x.T.num}.</b> ${esc(x.T.titulo)}</span><span class="n">${pc(x.pct)}</span>
          <div class="pn-barra ${x.pct == null ? '' : x.pct < 40 ? 'bajo' : x.pct < 70 ? 'medio' : ''}" style="grid-column:1/-1"><i style="width:${Math.round(x.pct || 0)}%"></i></div>
          <small>${x.n} ejercicio${x.n === 1 ? '' : 's'} de ${x.alumnos} estudiante${x.alumnos === 1 ? '' : 's'}; en el examen: ${x.T.examen} %</small></summary>
          ${cas.length ? `<div class="pn-cas">${cas.map((c) => `<span>\\(${c.et}\\) <small>${esc(c.paso)}${varios ? ` (${c.k === 'p2c' ? 'cuadrada' : 'triangular'})` : ''}</small></span><span class="n">${pc(c.pct)}</span>`).join('')}</div>` : '<p class="sm-ayuda">Sin ejercicios todavía.</p>'}</details>`;
      }).join('')}</div>`;
  }
  function simulacros() {
    const s = regs.filter((r) => r.actividad === 'sim');
    if (!s.length) return '';
    const filas = Object.entries(PR.SIM).map(([k, S]) => {
      const l = s.filter((r) => r.respuesta.tipo === k);
      const prom = l.length ? l.reduce((a, r) => a + Number(r.puntaje), 0) / l.length : null;
      return `<tr><td>${esc(S.titulo)}</td><td class="n">${l.length}</td><td class="n">${f1(prom)}</td></tr>`;
    }).join('');
    const porTema = PR.TEMAS.map((T) => {
      const l = s.filter((r) => r.respuesta.pts && r.respuesta.pts[T.id] != null);
      if (!l.length) return '';
      const max = T.M.MAX[typeof T.k === 'string' ? T.k : 'p2'];
      const p = (100 * l.reduce((a, r) => a + Number(r.respuesta.pts[T.id]), 0)) / l.length / max;
      return `<tr><td><b>${T.num}.</b> ${esc(T.titulo)}<div class="pn-barra ${p < 40 ? 'bajo' : p < 70 ? 'medio' : ''}"><i style="width:${Math.round(p)}%"></i></div></td><td class="n">${pc(p)}</td></tr>`;
    }).join('');
    return `<div class="tarjeta"><span class="etq">Simulacros</span><table class="sm-tab"><tr><th>Tipo</th><th>Hechos</th><th>Promedio</th></tr>${filas}</table>
      <p class="sm-ayuda">Puntos logrados por problema en los simulacros:</p><table class="sm-tab pn-difi">${porTema}</table></div>`;
  }
  function pintarDetalle() {
    const e = porEstudiante().find((x) => x.carnet === detalle);
    if (!e) { detalle = null; return pintar(); }
    const temas = PR.TEMAS.map((T) => { const t = e.t[T.id]; return `<tr><td><b>${T.num}.</b> ${esc(T.titulo)}</td><td class="n">${t.n || '—'}${t.n ? `<br><small>${t.guia} paso a paso</small>` : ''}</td><td class="n">${pc(t.pct)}</td><td class="n">${t.ult == null ? '—' : Math.round(t.ult) + ' %'}</td></tr>`; }).join('');
    const sims = e.sims.map((r) => { const x = r.respuesta || {}; return `<tr><td>${x.k || '—'}</td><td>${esc((PR.SIM[x.tipo] || {}).titulo || '—').replace('Simulacro ', '')}</td><td>${fecha(r.creado)}</td><td class="n">${f1(Number(r.puntaje))}</td><td class="n">${x.seg ? Math.round(x.seg / 60) : '—'}</td></tr>`; }).join('');
    cont.innerHTML = `<div class="tarjeta"><span class="etq">Estudiante</span><h2>${esc(e.nombre)}</h2><p>C.U. ${esc(e.carnet)}; ${esc(e.car || 'carrera sin dato')}. Entró: ${fecha(e.entro)}; última actividad: ${fecha(e.ult)}.</p>
      <div class="pn-cifras"><div><b>${e.ej.length}</b><small>ejercicios por tema</small></div><div><b>${e.temas} / 9</b><small>temas practicados</small></div><div><b>${e.sims.length}</b><small>simulacros</small></div><div><b>${f1(e.mejorTotal)}</b><small>mejor simulacro</small></div></div></div>
      <div class="tarjeta pn-tab-ov"><span class="etq">Por tema</span><table class="sm-tab"><tr><th>Tema</th><th>Ejercicios</th><th>1.er intento</th><th>Último</th></tr>${temas}</table>
        <p class="sm-ayuda">1.er intento: casillas correctas al primer intento, sumando todos sus ejercicios del tema. Último: puntaje del último ejercicio.</p></div>
      ${e.sims.length ? `<div class="tarjeta pn-tab-ov"><span class="etq">Sus simulacros</span><table class="sm-tab"><tr><th>N.º</th><th>Tipo</th><th>Fecha</th><th>Nota</th><th>Min</th></tr>${sims}</table>
        <p class="sm-ayuda">Min: minutos entre que empezó y terminó (puede incluir pausas).</p></div>` : ''}
      <div class="pn-fila"><button class="boton" id="b-volver">← Volver a la lista</button><button class="boton" id="b-borrar">Borrar los datos de este estudiante</button></div>`;
    $('#b-volver').onclick = () => { detalle = null; pintar(); };
    let armado = false;
    $('#b-borrar').onclick = async () => {
      const b = $('#b-borrar');
      if (!armado) { armado = true; b.textContent = 'Toca otra vez para borrar (sirve para quitar pruebas)'; setTimeout(() => { armado = false; if (b.isConnected) b.textContent = 'Borrar los datos de este estudiante'; }, 4000); return; }
      await Promise.all([II.sb.from('respuestas').delete().eq('sesion', SID).eq('carnet', e.carnet), II.sb.from('ingresos').delete().eq('sesion', SID).eq('carnet', e.carnet)]);
      regs = regs.filter((r) => r.carnet !== e.carnet); ingresos = ingresos.filter((r) => r.carnet !== e.carnet); detalle = null; pintar();
    };
  }
  function csv() {
    const num = (x) => (x == null || !isFinite(x) ? '' : String(Math.round(x * 10) / 10).replace('.', ','));
    const est = porEstudiante().sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const cab = ['Apellidos y nombres', 'C.U.', 'Carrera', 'Primer ingreso', 'Última actividad', 'Ejercicios por tema', 'Temas practicados (de 9)',
      ...PR.TEMAS.flatMap((T) => [`T${T.num} ejercicios`, `T${T.num} 1.er intento %`]),
      'Simulacros', 'Mejor simulacro Laplace', 'Mejor simulacro Fourier', 'Mejor simulacro completo'];
    const filas = est.map((e) => [e.nombre, e.carnet, e.car, fecha(e.entro), fecha(e.ult), e.ej.length, e.temas,
      ...PR.TEMAS.flatMap((T) => [e.t[T.id].n, num(e.t[T.id].pct)]),
      e.sims.length, num(e.mejorSim.lap), num(e.mejorSim.fou), num(e.mejorSim.todo)]);
    const txt = '﻿' + [cab, ...filas].map((f) => f.map((c) => { const s = String(c == null ? '' : c); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' }));
    a.download = 'Practica_final_Transformadas_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
  }

  async function arrancar() {
    cont.innerHTML = '<div class="tarjeta"><p>Cargando…</p></div>';
    await leerFila(); await leerDatos(); pintar();
    setInterval(async () => { if (document.visibilityState !== 'visible') return; await leerDatos(); if (!document.activeElement || document.activeElement === document.body) pintar(); }, 30000);
  }
  (async () => {
    if (!II.sb) { cont.innerHTML = '<div class="tarjeta"><p>No se pudo cargar la conexión. Revisa tu internet y recarga la página.</p></div>'; return; }
    cont.innerHTML = '<div class="tarjeta"><p>Conectando…</p></div>';
    const aviso = setTimeout(() => { cont.innerHTML = '<div class="tarjeta"><p>La conexión está tardando. Cierra las otras pestañas de este sitio y recarga.</p><button class="boton" onclick="location.reload()">Recargar</button></div>'; }, 8000);
    try { const { data } = await II.sb.auth.getSession(); const doc = data && data.session && (await esDocente()); clearTimeout(aviso); if (doc) arrancar(); else vIngreso(); } catch (e) { clearTimeout(aviso); vIngreso(); }
  })();
})();
