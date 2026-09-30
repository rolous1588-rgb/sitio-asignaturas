// ============================================================
// Panel docente (pensado para el celular): control, pizarra, reporte
// ============================================================
(function () {
  const II = window.II;
  let SES = II.sesionActual();
  let S = II.SESIONES[SES];
  const main = II.$('#principal');
  const D = { fila: null, respuestas: [], ingresos: [], pestana: 'control', actividad: null, detalle: null, seguido: {} };

  II.alCambiarConexion((ok) => { const p = II.$('#b-conexion'); if (p) p.className = 'punto-conexion ' + (ok ? 'ok' : 'mal'); });

  if (!II.configurado) {
    main.innerHTML = `<div class="contenido angosto"><div class="tarjeta"><h2>Falta conectar Supabase</h2>
      <p class="sub">Abre <code>instrumentacion/js/config.js</code> y pega la Project URL y la publishable key de tu proyecto.</p>
      <a class="boton" href="presentar.html?s=${SES}">Abrir la presentación en modo local</a></div></div>`;
    return;
  }

  // ---------- acceso ----------
  const pintarLogin = (msg = '') => {
    main.innerHTML = `<div class="contenido angosto"><div class="tarjeta">
      <span class="etiqueta">Acceso docente</span><h2>Panel de la clase</h2>
      <p class="sub">Entra con la cuenta que creaste en Supabase (Authentication → Users).</p>
      <form id="f-login">
        <label class="campo"><span>Correo</span><input class="entrada" name="email" type="email" required autocomplete="username"></label>
        <label class="campo"><span>Contraseña</span><input class="entrada" name="clave" type="password" required autocomplete="current-password"></label>
        ${msg ? `<div class="aviso mal">${II.esc(msg)}</div>` : ''}
        <button class="boton primario grande bloque" type="submit">Entrar</button>
      </form></div></div>`;
    II.$('#f-login').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      const b = ev.target.querySelector('button'); b.disabled = true; b.textContent = 'Entrando…';
      const { error } = await II.sb.auth.signInWithPassword({ email: String(f.get('email')).trim(), password: String(f.get('clave')) });
      if (error) return pintarLogin(error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : error.message);
      verificarDocente();
    });
  };

  const verificarDocente = async () => {
    const { data: u } = await II.sb.auth.getUser();
    if (!u || !u.user) return pintarLogin();
    const { data, error } = await II.sb.from('docentes').select('email');
    if (error || !data || !data.length) {
      await II.sb.auth.signOut();
      return pintarLogin('Esta cuenta no está registrada como docente en la tabla "docentes".');
    }
    II.$('#b-usuario').innerHTML = `<button class="boton chico" id="b-salir">Cerrar sesión</button>`;
    II.$('#b-salir').onclick = async () => { await II.sb.auth.signOut(); location.reload(); };
    iniciarPanel();
  };

  // ---------- datos ----------
  const cargar = async () => {
    const [r1, r2] = await Promise.all([
      II.sb.from('respuestas').select('*').eq('sesion', SES).order('creado').range(0, 4999),
      II.sb.from('ingresos').select('*').eq('sesion', SES).order('creado').range(0, 1999)
    ]);
    const antes = D.respuestas.length + '|' + D.ingresos.length;
    if (!r1.error) D.respuestas = r1.data;
    if (!r2.error) D.ingresos = r2.data;
    II.marcarConexion(!r1.error && !r2.error);
    if (antes !== D.respuestas.length + '|' + D.ingresos.length || !II.$('#panel') || !II.$('#panel').innerHTML) pintar();
  };
  const suscribir = () => {
    if (D.seguido[SES]) return;
    D.seguido[SES] = true;
    II.sb.channel('panel-' + SES)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'respuestas', filter: 'sesion=eq.' + SES }, (p) => {
        if (p.new.sesion !== SES || D.respuestas.some((x) => x.id === p.new.id)) return;
        D.respuestas.push(p.new); pintar();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ingresos', filter: 'sesion=eq.' + SES }, (p) => {
        if (p.new.sesion !== SES || D.ingresos.some((x) => x.id === p.new.id)) return;
        D.ingresos.push(p.new); pintar();
      })
      .subscribe();
  };

  const alumnos = () => {
    const m = new Map();
    D.ingresos.forEach((i) => m.set(i.carnet, { carnet: i.carnet, nombre: i.nombre, info: i.info || {} }));
    D.respuestas.forEach((r) => { if (!m.has(r.carnet)) m.set(r.carnet, { carnet: r.carnet, nombre: r.nombre, info: {} }); });
    return Array.from(m.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  };
  const deActividad = (act) => D.respuestas.filter((r) => r.actividad === act);
  const estadoAlumno = (act, carnet) => {
    const rs = deActividad(act).filter((r) => r.carnet === carnet);
    if (!rs.length) return { clase: 'nada', txt: 'Sin enviar', rs };
    const ok = rs.find((r) => r.correcta);
    const ult = rs[rs.length - 1];
    const mejor = Math.max(...rs.map((r) => +r.puntaje || 0));
    if (ok) return { clase: 'ok', txt: `✓ ${ok.intento === 1 ? '1er' : '2º'} intento · ${II.fmt(mejor, 1)} pts`, rs, mejor };
    if (ult.confianza === 'seguro') return { clase: 'mal', txt: `✗ Seguro · ${II.fmt(mejor, 1)} pts`, rs, mejor };
    return { clase: 'duda', txt: `✗ Con dudas · ${II.fmt(mejor, 1)} pts`, rs, mejor };
  };
  const actividadDePaso = (paso) => (paso ? (paso.reto || (paso.tipo === 'cuestionario' ? 'diagnostico' : null)) : null);

  // ---------- control ----------
  const pasoIdx = () => Math.max(0, II.indicePaso(SES, D.fila ? D.fila.paso : 'inicio'));
  const ir = async (i) => {
    i = Math.max(0, Math.min(S.pasos.length - 1, i));
    const paso = S.pasos[i];
    D.fila = { ...(D.fila || {}), paso: paso.id, actualizado: new Date().toISOString() };
    const act = actividadDePaso(paso);
    if (act) D.actividad = act;
    pintar();
    if (D.pestana === 'control') window.scrollTo({ top: 0, behavior: 'smooth' });
    const r = await II.fijarPaso(SES, paso.id);
    if (!r.ok) aviso('No se pudo cambiar el paso: ' + r.error);
  };
  const aviso = (t) => {
    const a = II.html(`<div class="aviso mal" style="position:fixed;left:16px;right:16px;bottom:16px;z-index:50;box-shadow:var(--sombra)">${II.esc(t)}</div>`);
    document.body.appendChild(a); setTimeout(() => a.remove(), 4000);
  };

  const vistaControl = () => {
    const i = pasoIdx();
    const p = S.pasos[i];
    const act = actividadDePaso(p);
    const al = alumnos().length;
    const env = act ? new Set(deActividad(act).map((r) => r.carnet)).size : null;
    let grupo = '';
    const lista = S.pasos.map((x, j) => {
      const g = x.ciclo ? 'Ciclo ' + x.ciclo : x.tipo === 'pausa' ? 'Pausa' : j < 3 ? 'Inicio' : 'Cierre';
      const cab = g !== grupo ? `<li class="grupo">${g}</li>` : '';
      grupo = g;
      return `${cab}<li><button data-i="${j}" class="${j === i ? 'actual' : ''}"><span class="i">${j + 1}</span><span>${II.esc(x.titulo)}</span><span class="chip">${II.TIPOS[x.tipo]}</span></button></li>`;
    }).join('');
    return `
      <div class="paso-actual">
        <span class="etiqueta">Paso ${i + 1} de ${S.pasos.length} · ${II.TIPOS[p.tipo]}</span>
        <div class="titulo">${II.esc(p.titulo)}</div>
        <div class="nota">Conectados: <b>${al}</b>${env != null ? ` · Enviaron: <b>${env}</b> de ${al}` : ''}</div>
      </div>
      <div class="mando">
        <button class="boton grande" data-acc="ant" ${i === 0 ? 'disabled' : ''}>◀ Anterior</button>
        <button class="boton primario grande" data-acc="sig" ${i === S.pasos.length - 1 ? 'disabled' : ''}>Siguiente ▶</button>
      </div>
      ${(() => {
        const ex = (D.fila && D.fila.extra) || {};
        const jh = ex.repaso_hasta ? II.indicePaso(SES, ex.repaso_hasta) : -1;
        const estado = ex.repaso_cerrado ? '<b style="color:var(--mal)">cerrado</b>'
          : jh >= 0 ? `<b>liberado hasta el paso ${jh + 1} · ${II.esc(S.pasos[jh].titulo)}</b>` : '<b>toda la sesión abierta</b>';
        return `<div class="tarjeta" style="padding:12px 14px;margin-bottom:12px">
          <div class="nota">Modo repaso de los estudiantes: ${estado}</div>
          <div class="controles" style="margin-top:8px">
            <button class="boton chico" data-acc="liberar" ${!ex.repaso_cerrado && jh === i ? 'disabled' : ''}>Liberar repaso hasta este paso</button>
            ${jh >= 0 || ex.repaso_cerrado ? '<button class="boton chico" data-acc="liberar-todo">Abrir toda la sesión</button>' : ''}
            ${ex.repaso_cerrado ? '' : '<button class="boton chico peligro" data-acc="cerrar-repaso">Cerrar el repaso</button>'}
          </div></div>`;
      })()}
      ${p.guion ? guionHTML(p.guion) : ''}
      <div class="tarjeta" style="padding:14px">
        <div class="controles" style="margin-bottom:8px">
          <a class="boton chico" href="presentar.html?s=${SES}" target="_blank" rel="noopener">Abrir presentación ↗</a>
          <button class="boton chico" data-acc="copiar">Copiar enlace de estudiantes</button>
        </div>
        <div class="nota" style="word-break:break-all">${II.esc(II.urlClase(SES))}</div>
      </div>
      <ul class="lista-pasos" style="margin-top:14px">${lista}</ul>`;
  };

  // guion: formato simple (puntos) o extenso (objetivo, pasos, preguntas, dudas, transición)
  const guionHTML = (g) => {
    const lista = (items, ordenada) => `${ordenada ? '<ol>' : '<ul style="margin:0;padding-left:20px;display:grid;gap:9px">'}${items.map((t) => `<li>${t}</li>`).join('')}${ordenada ? '</ol>' : '</ul>'}`;
    const sec = (titulo, cuerpo) => `<div class="etiqueta" style="margin:14px 0 6px">${titulo}</div>${cuerpo}`;
    return `<div class="tarjeta guion">
      <div class="controles" style="justify-content:space-between;margin-bottom:6px"><span class="etiqueta">Guion docente · qué hacer y qué decir</span>${g.min ? `<span class="chip">⏱ ${g.min} min</span>` : ''}</div>
      ${g.objetivo ? `<p style="margin:0 0 4px;font-size:.95rem"><b>Objetivo:</b> ${g.objetivo}</p>` : ''}
      ${g.puntos ? lista(g.puntos, true) : ''}
      ${g.pasos ? sec('Paso a paso', lista(g.pasos, true)) : ''}
      ${g.preguntas ? sec('Pregunta al grupo (y respuesta esperada)', lista(g.preguntas)) : ''}
      ${g.dudas ? sec('Si preguntan…', lista(g.dudas)) : ''}
      ${g.transicion ? sec('Para pasar al siguiente', `<p style="margin:0;font-size:.95rem">${g.transicion}</p>`) : ''}
    </div>`;
  };

  // ---------- pizarra ----------
  const vistaPizarra = () => {
    const acts = [['diagnostico', 'Diagnóstico']].concat(Object.entries(S.retos).map(([k, r]) => [k, r.titulo.split('·')[0].trim()]));
    const act = D.actividad || actividadDePaso(S.pasos[pasoIdx()]) || 'c1-reto';
    D.actividad = act;
    const lista = alumnos();
    let cuerpo = '';
    if (act === 'diagnostico') {
      const rs = deActividad('diagnostico');
      const ult = new Map(); rs.forEach((r) => ult.set(r.carnet, r));
      const n = ult.size;
      const porPreg = S.diagnostico.map((p, i) => {
        const ok = Array.from(ult.values()).filter((r) => r.respuesta && r.respuesta.r && r.respuesta.r[i] === p.c).length;
        const pct = n ? Math.round((ok / n) * 100) : 0;
        return `<div style="margin-bottom:10px"><div class="nota" style="margin-bottom:4px">${i + 1}. ${II.esc(p.t)}</div>
          <div class="barra-prog"><div style="width:${pct}%;background:${pct >= 70 ? 'var(--ok)' : pct >= 40 ? 'var(--duda)' : 'var(--mal)'}"></div></div>
          <div class="nota" style="text-align:right">${ok} de ${n} (${pct} %)</div></div>`;
      }).join('');
      cuerpo = `<div class="metricas"><div class="metrica"><b>${lista.length}</b><span>Conectados</span></div><div class="metrica"><b>${n}</b><span>Respondieron</span></div>
        <div class="metrica"><b>${n ? II.fmt(Array.from(ult.values()).reduce((s, r) => s + (r.respuesta.aciertos || 0), 0) / n, 1) : '—'}</b><span>Promedio /5</span></div><div class="metrica"><b>${lista.length - n}</b><span>Faltan</span></div></div>
        <div class="tarjeta" style="padding:14px">${porPreg || '<p class="nota">Aún no hay respuestas.</p>'}</div>`;
    } else {
      const est = lista.map((a) => ({ a, e: estadoAlumno(act, a.carnet) }));
      const c = (k) => est.filter((x) => x.e.clase === k).length;
      const orden = { mal: 0, duda: 1, nada: 2, ok: 3 };
      est.sort((x, y) => orden[x.e.clase] - orden[y.e.clase] || x.a.nombre.localeCompare(y.a.nombre, 'es'));
      cuerpo = `<div class="metricas"><div class="metrica"><b>${lista.length - c('nada')}/${lista.length}</b><span>Enviaron</span></div><div class="metrica"><b style="color:var(--ok)">${c('ok')}</b><span>Correctos</span></div>
        <div class="metrica"><b style="color:var(--mal)">${c('mal')}</b><span>Errados seguros</span></div><div class="metrica"><b style="color:var(--duda)">${c('duda')}</b><span>Errados con dudas</span></div></div>
        <p class="nota" style="margin:0 0 8px">Rojo primero: se equivocaron estando seguros (concepto mal aprendido). Toca un nombre para ver sus respuestas.</p>
        <div class="pizarra">${est.map(({ a, e }) => `<button class="alumno ${e.clase}" data-c="${II.esc(a.carnet)}"><b>${II.esc(a.nombre)}</b><small>${e.txt}</small></button>`).join('') || '<p class="nota">Aún no hay estudiantes conectados.</p>'}</div>
        <div id="detalle-alumno" style="margin-top:14px"></div>`;
    }
    return `<div class="segmentado" style="margin-bottom:12px" data-rol="acts">${acts.map(([k, t]) => `<button data-a="${k}" class="${k === act ? 'activo' : ''}">${II.esc(t)}</button>`).join('')}</div>${cuerpo}`;
  };

  const verDetalle = (carnet, desplazar = false) => {
    const act = D.actividad;
    const R = S.retos[act];
    const cont = II.$('#detalle-alumno');
    if (!R || !cont) return;
    const a = alumnos().find((x) => x.carnet === carnet);
    const gen = R.generar(II.rng(carnet + '|' + act));
    const rs = deActividad(act).filter((r) => r.carnet === carnet);
    const filas = gen.campos.map((c) => {
      const esp = gen.esperado[c.id];
      const dadas = rs.map((r) => (r.respuesta && r.respuesta.valores ? r.respuesta.valores[c.id] : '—'));
      const pregunta = c.pregunta.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 90);
      return `<tr><td style="white-space:normal;min-width:160px">${II.esc(pregunta)}</td><td class="n">${II.esc(typeof esp === 'number' ? II.fmt(esp, 3) : esp)}</td>${dadas.map((d) => `<td class="n">${II.esc(d)}</td>`).join('')}</tr>`;
    }).join('');
    cont.innerHTML = `<div class="tarjeta" style="padding:14px"><h3>${II.esc(a ? a.nombre : carnet)} <span class="nota">· CI ${II.esc(carnet)}</span></h3>
      ${rs.length ? `<div class="tabla-envoltura"><table class="tabla"><tr><th>Pregunta</th><th>Correcto</th>${rs.map((r) => `<th>Intento ${r.intento} (${r.confianza || '—'})</th>`).join('')}</tr>${filas}</table></div>` : '<p class="nota">Todavía no envió este reto.</p>'}</div>`;
    if (desplazar) cont.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // ---------- reporte ----------
  const tablaReporte = () => {
    const retos = Object.entries(S.retos);
    return alumnos().map((a) => {
      const diag = deActividad('diagnostico').filter((r) => r.carnet === a.carnet).pop();
      const pts = retos.map(([k]) => {
        const rs = deActividad(k).filter((r) => r.carnet === a.carnet && r.intento <= 2);
        return rs.length ? Math.max(...rs.map((r) => +r.puntaje || 0)) : null;
      });
      const total = pts.reduce((s, p) => s + (p || 0), 0);
      const participo = pts.filter((p) => p != null).length + (diag ? 1 : 0);
      return { a, diag: diag ? diag.respuesta.aciertos : null, pts, total, participo };
    });
  };
  const vistaReporte = () => {
    const retos = Object.entries(S.retos);
    const max = retos.reduce((s, [, r]) => s + r.puntos, 0);
    const filas = tablaReporte();
    return `
      <div class="controles" style="margin-bottom:12px">
        <button class="boton primario" data-acc="csv">Descargar para Excel (.csv)</button>
        <button class="boton" data-acc="recargar">Actualizar</button>
      </div>
      <div class="tabla-envoltura"><table class="tabla">
        <tr><th>Nombre</th><th>Carnet</th><th>Área</th><th>Diag. /5</th>${retos.map(([, r]) => `<th>${II.esc(r.titulo.split('·')[0].trim())} /${r.puntos}</th>`).join('')}<th>Total /${max}</th><th>Actividades</th></tr>
        ${filas.map((f) => `<tr><td>${II.esc(f.a.nombre)}</td><td>${II.esc(f.a.carnet)}</td><td>${II.esc(f.a.info.area || '—')}</td><td class="n">${f.diag ?? '—'}</td>${f.pts.map((p) => `<td class="n">${p == null ? '—' : II.fmt(p, 1)}</td>`).join('')}<td class="n"><b>${II.fmt(f.total, 1)}</b></td><td class="n">${f.participo}/${retos.length + 1}</td></tr>`).join('') || `<tr><td colspan="${6 + retos.length}" class="nota">Aún no hay datos.</td></tr>`}
      </table></div>
      <div class="tarjeta" style="margin-top:24px;padding:14px">
        <h3>Datos de prueba</h3>
        <p class="nota">Borra todas las respuestas e ingresos de esta sesión y vuelve la clase al inicio. Úsalo después de probar la plataforma, antes de la clase real.</p>
        <button class="boton peligro" data-acc="borrar">Borrar datos de esta sesión</button>
      </div>`;
  };
  const descargarCSV = () => {
    const retos = Object.entries(S.retos);
    const n = (x) => (x == null ? '' : String(x).replace('.', ','));
    const q = (s) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
    const cab = ['Nombre', 'Carnet', 'Área', 'Experiencia', 'Diagnóstico (/5)', ...retos.map(([, r]) => `${r.titulo} (/${r.puntos})`), 'Total', 'Actividades'];
    const filas = tablaReporte().map((f) => [q(f.a.nombre), q(f.a.carnet), q(f.a.info.area), q(f.a.info.experiencia), n(f.diag), ...f.pts.map(n), n(f.total), f.participo].join(';'));
    const csv = '﻿' + [cab.map(q).join(';'), ...filas].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `reporte-${SES}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  let borrarArmado = false;
  const borrar = async (b) => {
    if (!borrarArmado) {
      borrarArmado = true; b.classList.add('confirmar'); b.textContent = 'Toca otra vez para confirmar';
      setTimeout(() => { borrarArmado = false; if (b.isConnected) { b.classList.remove('confirmar'); b.textContent = 'Borrar datos de esta sesión'; } }, 4000);
      return;
    }
    b.disabled = true; b.textContent = 'Borrando…';
    const r1 = await II.sb.from('respuestas').delete().eq('sesion', SES);
    const r2 = await II.sb.from('ingresos').delete().eq('sesion', SES);
    if (r1.error || r2.error) aviso('No se pudo borrar: ' + (r1.error || r2.error).message);
    await II.fijarPaso(SES, 'inicio');
    D.respuestas = []; D.ingresos = [];
    borrarArmado = false;
    cargar();
  };

  // ---------- pintado ----------
  const pintar = () => {
    if (!II.$('#panel')) return;
    II.$$('.pestanas button').forEach((b) => b.classList.toggle('activo', b.dataset.p === D.pestana));
    const cont = II.$('#panel');
    const detalleAbierto = D.pestana === 'pizarra' && II.$('#detalle-alumno') && II.$('#detalle-alumno').innerHTML ? D.detalle : null;
    cont.innerHTML = D.pestana === 'control' ? vistaControl() : D.pestana === 'pizarra' ? vistaPizarra() : vistaReporte();
    if (detalleAbierto) verDetalle(detalleAbierto);
  };

  const iniciarPanel = () => {
    main.innerHTML = `<div class="contenido" style="max-width:760px">
      <div class="controles" style="margin-bottom:12px">
        <select class="entrada" id="sel-sesion" style="max-width:100%">${Object.values(II.SESIONES).map((s) => `<option value="${s.id}" ${s.id === SES ? 'selected' : ''}>Sesión ${s.numero} · ${II.esc(s.titulo)}</option>`).join('')}</select>
      </div>
      <div class="pestanas"><button data-p="control">Control</button><button data-p="pizarra">Pizarra</button><button data-p="reporte">Reporte</button></div>
      <div id="panel"></div></div>`;
    II.$$('.pestanas button').forEach((b) => b.addEventListener('click', () => { D.pestana = b.dataset.p; pintar(); }));
    II.$('#sel-sesion').addEventListener('change', (e) => { location.search = '?s=' + e.target.value; });
    II.$('#panel').addEventListener('click', async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.i != null) return ir(+b.dataset.i);
      if (b.dataset.a) { D.actividad = b.dataset.a; D.detalle = null; return pintar(); }
      if (b.dataset.c) { D.detalle = b.dataset.c; return verDetalle(b.dataset.c, true); }
      const acc = b.dataset.acc;
      if (acc === 'sig') ir(pasoIdx() + 1);
      else if (acc === 'ant') ir(pasoIdx() - 1);
      else if (acc === 'liberar' || acc === 'liberar-todo' || acc === 'cerrar-repaso') {
        b.disabled = true;
        const cambios = acc === 'cerrar-repaso' ? { repaso_cerrado: true }
          : { repaso_cerrado: false, repaso_hasta: acc === 'liberar' ? S.pasos[pasoIdx()].id : null };
        const r = await II.fijarExtra(SES, cambios, D.fila ? D.fila.extra : {});
        if (!r.ok) { aviso('No se pudo cambiar el repaso: ' + r.error); b.disabled = false; return; }
        D.fila = { ...(D.fila || {}), extra: r.extra };
        pintar();
      }
      else if (acc === 'csv') descargarCSV();
      else if (acc === 'recargar') cargar();
      else if (acc === 'borrar') borrar(b);
      else if (acc === 'copiar') {
        try { await navigator.clipboard.writeText(II.urlClase(SES)); b.textContent = '¡Copiado!'; }
        catch (err) { b.textContent = 'Mantén presionado el enlace para copiarlo'; }
        setTimeout(() => { if (b.isConnected) b.textContent = 'Copiar enlace de estudiantes'; }, 2500);
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input,select,textarea')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') ir(pasoIdx() + 1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') ir(pasoIdx() - 1);
    });
    II.seguirEstado(SES, (fila) => {
      const cambio = !D.fila || D.fila.paso !== fila.paso;
      D.fila = fila;
      if (cambio) { const a = actividadDePaso(S.pasos[pasoIdx()]); if (a) D.actividad = a; }
      pintar();
    });
    cargar();
    suscribir();
    setInterval(cargar, 8000);
  };

  // arranque
  II.sb.auth.getSession().then(({ data }) => { if (data && data.session) verificarDocente(); else pintarLogin(); });
})();
