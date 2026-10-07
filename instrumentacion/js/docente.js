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
    if (rs.every(esVacio)) return { clase: 'nada', txt: 'No respondió · 0 pts', rs, mejor: 0 };
    const ok = rs.find((r) => r.correcta);
    const ult = rs[rs.length - 1];
    const mejor = Math.max(...rs.map((r) => +r.puntaje || 0));
    if (ok) return { clase: 'ok', txt: `✓ ${ok.intento === 1 ? '1er' : '2º'} intento · ${II.fmt(mejor, 1)} pts`, rs, mejor };
    if (ult.confianza === 'seguro') return { clase: 'mal', txt: `✗ Seguro · ${II.fmt(mejor, 1)} pts`, rs, mejor };
    return { clase: 'duda', txt: `✗ Con dudas · ${II.fmt(mejor, 1)} pts`, rs, mejor };
  };
  const actividadDePaso = (paso) => II.actividadDe(paso);
  const esVacio = (r) => !!(r.respuesta && r.respuesta.vacio);
  const enviaron = (act) => new Set(deActividad(act).filter((r) => !esVacio(r)).map((r) => r.carnet)).size;

  // ---------- control ----------
  const pasoIdx = () => Math.max(0, II.indicePaso(SES, D.fila ? D.fila.paso : 'inicio'));
  const ir = async (i) => {
    i = Math.max(0, Math.min(S.pasos.length - 1, i));
    const paso = S.pasos[i];
    const ex = (D.fila && D.fila.extra) || {};
    const extra = ex.cierre ? { ...ex, cierre: null } : undefined;
    D.fila = { ...(D.fila || {}), paso: paso.id, actualizado: new Date().toISOString(), ...(extra ? { extra } : {}) };
    const act = actividadDePaso(paso);
    if (act) D.actividad = act;
    pintar();
    if (D.pestana === 'control') window.scrollTo({ top: 0, behavior: 'smooth' });
    const r = await II.fijarPaso(SES, paso.id, extra);
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
    const env = act ? enviaron(act) : null;
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
      ${tarjetaCierre(p)}
      ${p.tipo === 'rapida' ? tarjetaRapida(p) : ''}
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

  // ---------- cerrar reto / pregunta rápida ----------
  const tarjetaCierre = (p) => {
    if (p.tipo !== 'reto' && p.tipo !== 'rapida') return '';
    const act = actividadDePaso(p);
    const nombre = p.tipo === 'rapida' ? 'pregunta' : 'reto';
    const c = II.cierreDe(D.fila, act);
    const s = c ? Math.ceil(II.restaCierre(c)) : null;
    let cuerpo;
    if (!c) cuerpo = `<button class="boton primario bloque" data-acc="cerrar-act">⏱ Cerrar ${nombre} (${II.SEG_CIERRE[p.tipo]} s)</button>
      <div class="nota" style="margin-top:6px">Los estudiantes ven una cuenta regresiva; al terminar, se envía lo que cada uno tenga escrito y ven su nota. Si tocas Siguiente sin cerrar, se cierra solo.</div>`;
    else if (s > 0) cuerpo = `<div class="controles" style="justify-content:space-between"><b style="font-size:1.1rem">⏳ Cerrando en <span id="cd-doc">${s}</span> s…</b><button class="boton chico" data-acc="cancelar-cierre">Cancelar</button></div>`;
    else cuerpo = `<div class="aviso ok" style="margin:0">✓ ${p.tipo === 'rapida' ? 'Pregunta cerrada: en Zoom ya se ven los resultados.' : 'Reto cerrado. Toca <b>Siguiente</b> para la revisión.'}</div>`;
    return `<div class="tarjeta" style="padding:12px 14px;margin-bottom:12px;border-color:#c9dbf3">${cuerpo}</div>`;
  };
  const tarjetaRapida = (p) => {
    const rs = deActividad(p.id).filter((r) => !esVacio(r));
    const ult = new Map(); rs.forEach((r) => ult.set(r.carnet, r));
    const n = ult.size;
    const cuenta = p.o.map((_, i) => Array.from(ult.values()).filter((r) => r.respuesta && r.respuesta.opcion === i).length);
    return `<div class="tarjeta" style="padding:12px 14px;margin-bottom:12px">
      <div class="etiqueta" style="margin-bottom:6px">Pregunta rápida · respuestas en vivo (${n})</div>
      <div style="font-weight:600;margin-bottom:8px">${p.t}</div>
      ${p.o.map((o, i) => `<div style="margin-bottom:6px"><div class="nota" style="margin-bottom:2px">${i === p.c ? '✓ ' : ''}${o}</div>
        <div class="barra-prog"><div style="width:${n ? (cuenta[i] / n) * 100 : 0}%;background:${i === p.c ? 'var(--ok)' : 'var(--mal)'}"></div></div>
        <div class="nota" style="text-align:right">${cuenta[i]}</div></div>`).join('')}
      ${p.por ? `<div class="nota" style="margin-top:6px"><b>Por qué:</b> ${p.por}</div>` : ''}
    </div>`;
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
    const rapidas = II.rapidasDe(S);
    const acts = [['diagnostico', 'Diagnóstico']].concat(Object.entries(S.retos).map(([k, r]) => [k, r.titulo.split('·')[0].trim()]), rapidas.length ? [['rapidas', 'Preguntas rápidas']] : []);
    let act = D.actividad || actividadDePaso(S.pasos[pasoIdx()]) || 'c1-reto';
    if (rapidas.some((p) => p.id === act)) act = 'rapidas';
    D.actividad = act;
    const lista = alumnos();
    let cuerpo = '';
    if (act === 'rapidas') {
      const filas = rapidas.map((p, j) => {
        const ult = new Map(); deActividad(p.id).forEach((r) => ult.set(r.carnet, r));
        const v = Array.from(ult.values());
        const resp = v.filter((r) => !esVacio(r)).length, ok = v.filter((r) => r.correcta).length;
        const pct = resp ? Math.round((ok / resp) * 100) : 0;
        return `<div style="margin-bottom:12px"><div class="nota" style="margin-bottom:4px">${j + 1}. ${p.t}</div>
          <div class="barra-prog"><div style="width:${pct}%;background:${pct >= 70 ? 'var(--ok)' : pct >= 40 ? 'var(--duda)' : 'var(--mal)'}"></div></div>
          <div class="nota" style="text-align:right">${resp ? `${ok} de ${resp} correctas (${pct} %)` : 'sin respuestas'}${v.length - resp ? ` · ${v.length - resp} no respondieron` : ''}</div></div>`;
      }).join('');
      cuerpo = `<div class="tarjeta" style="padding:14px">${filas}</div>`;
    } else if (act === 'diagnostico') {
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
      const rap = II.rapidasDe(S).map((p) => {
        const rs = deActividad(p.id).filter((r) => r.carnet === a.carnet);
        return rs.length ? Math.max(...rs.map((r) => +r.puntaje || 0)) : null;
      });
      const rapTotal = rap.reduce((s, p) => s + (p || 0), 0);
      const total = pts.reduce((s, p) => s + (p || 0), 0) + rapTotal;
      const participo = pts.filter((p) => p != null).length + rap.filter((p) => p != null).length + (diag ? 1 : 0);
      return { a, diag: diag ? diag.respuesta.aciertos : null, pts, rap, rapTotal, total, participo };
    });
  };
  const vistaReporte = () => {
    const retos = Object.entries(S.retos);
    const rapidas = II.rapidasDe(S);
    const maxRap = rapidas.reduce((s, p) => s + II.puntosRapida(p), 0);
    const max = retos.reduce((s, [, r]) => s + r.puntos, 0) + maxRap;
    const nAct = retos.length + rapidas.length + 1;
    const filas = tablaReporte();
    return `
      <div class="controles" style="margin-bottom:12px">
        <button class="boton primario" data-acc="csv">Descargar para Excel (.csv)</button>
        <button class="boton" data-acc="recargar">Actualizar</button>
      </div>
      <div class="tabla-envoltura"><table class="tabla">
        <tr><th>Nombre</th><th>Carnet</th><th>Área</th><th>Diag. /5</th>${retos.map(([, r]) => `<th>${II.esc(r.titulo.split('·')[0].trim())} /${r.puntos}</th>`).join('')}${maxRap ? `<th>Rápidas /${maxRap}</th>` : ''}<th>Total /${max}</th><th>Actividades</th></tr>
        ${filas.map((f) => `<tr><td>${II.esc(f.a.nombre)}</td><td>${II.esc(f.a.carnet)}</td><td>${II.esc(f.a.info.area || '—')}</td><td class="n">${f.diag ?? '—'}</td>${f.pts.map((p) => `<td class="n">${p == null ? '—' : II.fmt(p, 1)}</td>`).join('')}${maxRap ? `<td class="n">${II.fmt(f.rapTotal, 1)}</td>` : ''}<td class="n"><b>${II.fmt(f.total, 1)}</b></td><td class="n">${f.participo}/${nAct}</td></tr>`).join('') || `<tr><td colspan="${7 + retos.length}" class="nota">Aún no hay datos.</td></tr>`}
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
    const rapidas = II.rapidasDe(S);
    const cab = ['Nombre', 'Carnet', 'Área', 'Experiencia', 'Diagnóstico (/5)', ...retos.map(([, r]) => `${r.titulo} (/${r.puntos})`),
      ...rapidas.map((p, j) => `Rápida ${j + 1} (/${II.puntosRapida(p)})`), ...(rapidas.length ? ['Rápidas total'] : []), 'Total', 'Actividades'];
    const filas = tablaReporte().map((f) => [q(f.a.nombre), q(f.a.carnet), q(f.a.info.area), q(f.a.info.experiencia), n(f.diag), ...f.pts.map(n),
      ...f.rap.map(n), ...(rapidas.length ? [n(f.rapTotal)] : []), n(f.total), f.participo].join(';'));
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
    if (S.asincrona) {
      const foco = document.activeElement && document.activeElement.id === 'ce-cierra' ? document.activeElement.value : null;
      if (foco != null) return; // no repintar mientras el docente escribe la fecha de cierre
      cont.innerHTML = D.pestana === 'control' ? vistaControlCE() : vistaReporteCE();
      return;
    }
    const detalleAbierto = D.pestana === 'pizarra' && II.$('#detalle-alumno') && II.$('#detalle-alumno').innerHTML ? D.detalle : null;
    cont.innerHTML = D.pestana === 'control' ? vistaControl() : D.pestana === 'pizarra' ? vistaPizarra() : vistaReporte();
    if (detalleAbierto) verDetalle(detalleAbierto);
  };

  const selectorSesiones = () => `<div class="controles" style="margin-bottom:12px">
        <select class="entrada" id="sel-sesion" style="max-width:100%">${Object.values(II.SESIONES).map((s) => `<option value="${s.id}" ${s.id === SES ? 'selected' : ''}>${s.etiqueta ? II.esc(s.etiqueta) : 'Sesión ' + s.numero} · ${II.esc(s.titulo)}</option>`).join('')}</select>
      </div>`;

  const iniciarPanel = () => {
    if (S.asincrona) return iniciarAsincrona();
    main.innerHTML = `<div class="contenido" style="max-width:760px">
      ${selectorSesiones()}
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
      else if (acc === 'cerrar-act' || acc === 'cancelar-cierre') {
        b.disabled = true;
        const p = S.pasos[pasoIdx()];
        const seg = II.SEG_CIERRE[p.tipo] || 30;
        const cierre = acc === 'cancelar-cierre' ? null
          : { act: actividadDePaso(p), seg, fin: new Date(Date.now() + seg * 1000).toISOString(), id: String(Date.now()) };
        const r = await II.fijarExtra(SES, { cierre }, D.fila ? D.fila.extra : {});
        if (!r.ok) { aviso('No se pudo ' + (cierre ? 'cerrar' : 'cancelar') + ': ' + r.error); b.disabled = false; return; }
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
    // cuenta regresiva del cierre: actualiza el número y repinta al terminar
    let cdAntes = null;
    setInterval(() => {
      const p = S.pasos[pasoIdx()];
      const c = II.cierreDe(D.fila, actividadDePaso(p));
      const s = c ? Math.ceil(II.restaCierre(c)) : null;
      const e = II.$('#cd-doc');
      if (e && s > 0) e.textContent = s;
      if (cdAntes > 0 && s === 0 && D.pestana === 'control') pintar();
      cdAntes = s;
    }, 500);
  };

  // ============================================================
  // SESIÓN ASÍNCRONA (Control de estudio): ventana, avance y notas
  // ============================================================
  const CE = II.CONTROL;
  const fechaBO = (ms) => (ms ? new Date(ms).toLocaleString('es-BO', { timeZone: 'America/La_Paz', weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '—');
  // Bolivia está en UTC−4 todo el año (sin horario de verano)
  const aEntradaBO = (ms) => new Date(ms - 4 * 3600e3).toISOString().slice(0, 16);
  const deEntradaBO = (v) => Date.parse(v + ':59-04:00'); // 23:59 → hasta 23:59:59
  const extraCE = () => (D.fila && D.fila.extra) || {};
  const ventanaCE = () => {
    const ex = extraCE();
    const abre = ex.abre ? Date.parse(ex.abre) : null, cierra = ex.cierra ? Date.parse(ex.cierra) : null, t = Date.now();
    if (!D.fila) return { estado: 'sin-fila', abre, cierra };
    if (!abre || t < abre) return { estado: 'antes', abre, cierra };
    if (cierra && t >= cierra) return { estado: 'cerrada', abre, cierra };
    return { estado: 'abierta', abre, cierra };
  };

  // una fila por estudiante; la nota se recalcula con las respuestas guardadas (no se usa el puntaje que mandó el celular)
  const filasCE = () => {
    const minutos = extraCE().minutos || CE.minutos;
    const v = ventanaCE();
    const ahora = Date.now();
    return alumnos().map((a) => {
      const rs = D.respuestas.filter((r) => r.carnet === a.carnet);
      const mods = new Set(), seg = {};
      rs.forEach((r) => {
        const m = /^mod-(\d)$/.exec(r.actividad);
        if (m) { mods.add(+m[1]); seg[m[1]] = Math.max(seg[m[1]] || 0, +((r.respuesta && r.respuesta.seg) || 0)); }
      });
      const ini = rs.find((r) => r.actividad === 'eval-inicio');
      const env = rs.find((r) => r.actividad === 'eval');
      const ids = CE.seleccion(a.carnet); // las preguntas dependen solo del carnet
      let estado, origen, resp = null, fin = null;
      if (env) {
        resp = env.respuesta && env.respuesta.resp; estado = 'enviada'; fin = Date.parse(env.creado);
        origen = env.respuesta && env.respuesta.motivo === 'tiempo' ? 'Enviada al terminar el tiempo' : 'Enviada';
      } else if (ini) {
        const limite = Date.parse(ini.creado) + (minutos + 2) * 60000;
        const av = rs.filter((r) => r.actividad === 'eval-avance' && Date.parse(r.creado) <= limite).pop();
        if (ahora < limite) { estado = 'curso'; origen = 'Rindiendo ahora'; }
        else if (av) { estado = 'avance'; resp = av.respuesta && av.respuesta.resp; fin = Date.parse(av.creado); origen = 'No envió: se calificó su última copia automática'; }
        else { estado = 'sin'; origen = 'Empezó y no se guardó ninguna respuesta'; }
      } else { estado = 'no'; origen = 'No rindió'; }
      const cal = resp ? CE.calificar(ids, resp, a.carnet) : null;
      const nota = cal ? cal.nota : estado === 'sin' || (estado === 'no' && v.estado === 'cerrada') ? 0 : null;
      const inicio = ini ? Date.parse(ini.creado) : null;
      return {
        a, mods: mods.size, min: Math.round(Object.values(seg).reduce((x, y) => x + y, 0) / 60),
        inicio, fin, dur: inicio && fin ? (fin - inicio) / 60000 : null, estado, origen, ids, cal, nota
      };
    });
  };

  const vistaControlCE = () => {
    const v = ventanaCE(), ex = extraCE();
    const filas = filasCE();
    const conNota = filas.filter((f) => f.cal);
    const prom = conNota.length ? conNota.reduce((s, f) => s + f.nota, 0) / conNota.length : null;
    const txt = { 'sin-fila': '<b style="color:var(--mal)">Falta crear la fila ii-ce en la base de datos</b>', antes: '<b style="color:var(--duda)">No abierto</b> · los estudiantes no pueden entrar a los módulos', abierta: '<b style="color:var(--ok)">Abierto</b>', cerrada: '<b style="color:var(--mal)">Cerrado</b> · ya no se registra nada' }[v.estado];
    const porMod = CE.modulos.map((m) => new Set(D.respuestas.filter((r) => r.actividad === 'mod-' + m.n).map((r) => r.carnet)).size);
    const n = filas.length;
    return `
      <div class="paso-actual"><span class="etiqueta">${CE.titulo} · sesión asíncrona</span>
        <div class="titulo">${CE.subtitulo}</div>
        <div class="nota">Estado: ${txt}</div></div>
      <div class="tarjeta" style="padding:14px;margin-bottom:12px">
        <div style="display:grid;gap:4px;font-size:.95rem">
          <div><b>Abre:</b> ${v.abre ? fechaBO(v.abre) : 'todavía no'}</div>
          <div><b>Cierra:</b> ${fechaBO(v.cierra)}</div>
          <div><b>Evaluación:</b> ${CE.nEval} preguntas · ${ex.minutos || CE.minutos} min · un intento</div></div>
        <div class="controles" style="margin-top:10px">
          ${v.estado !== 'abierta' ? '<button class="boton primario" data-acc="ce-abrir">Abrir ahora</button>' : '<button class="boton peligro" data-acc="ce-cerrar">Cerrar ahora</button>'}
          ${v.abre ? '<button class="boton chico" data-acc="ce-ocultar">Volver a «No abierto»</button>' : ''}
        </div>
        <label class="campo" style="margin-top:12px"><span>Cambiar el cierre (hora de Bolivia)</span>
          <span class="controles"><input class="entrada" type="datetime-local" id="ce-cierra" value="${v.cierra ? aEntradaBO(v.cierra) : ''}" style="max-width:260px"><button class="boton" data-acc="ce-guardar-cierre">Guardar cierre</button></span></label>
        <p class="nota" style="margin:6px 0 0">La base de datos rechaza cualquier envío fuera de esta ventana. Si alguien empieza la evaluación cerca del cierre, su tiempo termina con el cierre.</p>
      </div>
      <div class="metricas"><div class="metrica"><b>${n}</b><span>Entraron</span></div><div class="metrica"><b>${filas.filter((f) => f.mods === CE.modulos.length).length}</b><span>Con los ${CE.modulos.length} módulos</span></div>
        <div class="metrica"><b>${filas.filter((f) => f.inicio).length}</b><span>Empezaron la evaluación</span></div><div class="metrica"><b>${prom == null ? '—' : II.fmt(prom, 1)}</b><span>Nota promedio (${conNota.length})</span></div></div>
      <div class="tarjeta" style="padding:14px;margin-bottom:12px"><div class="etiqueta" style="margin-bottom:8px">Avance por módulo</div>
        ${CE.modulos.map((m, j) => `<div style="margin-bottom:8px"><div class="nota" style="margin-bottom:2px">${m.n}. ${m.titulo}</div>
          <div class="barra-prog"><div style="width:${n ? (porMod[j] / n) * 100 : 0}%"></div></div><div class="nota" style="text-align:right">${porMod[j]} de ${n}</div></div>`).join('')}
      </div>
      <div class="tarjeta" style="padding:14px">
        <div class="controles" style="margin-bottom:8px">
          <a class="boton chico" href="estudio.html?modo=revision" target="_blank" rel="noopener">Revisar como estudiante (no registra nada) ↗</a>
          <a class="boton chico" href="estudio.html?modo=revision#banco" target="_blank" rel="noopener">Ver el banco de preguntas ↗</a>
          <button class="boton chico" data-acc="ce-copiar">Copiar enlace de estudiantes</button>
        </div>
        <div class="nota" style="word-break:break-all">${II.esc(urlEstudio())}</div>
      </div>`;
  };
  const urlEstudio = () => location.href.replace(/[^/]*$/, '') + 'estudio.html';

  const vistaReporteCE = () => {
    const filas = filasCE();
    const chip = { enviada: 'ok', avance: 'duda', curso: 'acento', sin: 'mal', no: '' };
    // dificultad de cada pregunta del banco
    const est = {};
    filas.filter((f) => f.cal).forEach((f) => f.ids.forEach((id, j) => { (est[id] = est[id] || []).push(f.cal.puntos[j]); }));
    const dif = CE.banco.map((q) => ({ q, n: (est[q.id] || []).length, p: est[q.id] ? est[q.id].reduce((a, b) => a + b, 0) / est[q.id].length : null }))
      .filter((x) => x.n).sort((x, y) => x.p - y.p);
    const textoQ = (q) => { const i = II.preguntas.instancia(q, 'X'); return String(i.t).replace(/<[^>]+>/g, '').slice(0, 110); };
    return `
      <div class="controles" style="margin-bottom:12px">
        <button class="boton primario" data-acc="ce-csv">Descargar para Excel (.csv)</button>
        <button class="boton" data-acc="recargar">Actualizar</button>
      </div>
      <p class="nota" style="margin:0 0 8px">La nota se recalcula aquí con las respuestas guardadas. Ponderada = nota × 0,10 (el control vale el 10 % del módulo).</p>
      <div class="tabla-envoltura"><table class="tabla">
        <tr><th>Nombre</th><th>Nota /100</th><th>Ponderada /10</th><th>Estado</th><th>Módulos</th><th>Estudio</th><th>Inicio</th><th>Duración</th><th>Carnet</th></tr>
        ${filas.map((f) => `<tr><td>${II.esc(f.a.nombre)}</td><td class="n"><b>${f.nota == null ? '—' : II.fmt(f.nota, 1)}</b></td><td class="n">${f.nota == null ? '—' : II.fmt(f.nota / 10, 2)}</td>
          <td><span class="chip ${chip[f.estado]}" style="white-space:normal">${f.origen}</span></td>
          <td class="n">${f.mods}/${CE.modulos.length}</td><td class="n">${f.min ? f.min + ' min' : '—'}</td>
          <td class="n">${f.inicio ? fechaBO(f.inicio) : '—'}</td><td class="n">${f.dur != null ? II.fmt(f.dur, 1) + ' min' : '—'}</td><td>${II.esc(f.a.carnet)}</td></tr>`).join('') || '<tr><td colspan="9" class="nota">Aún no hay datos.</td></tr>'}
      </table></div>
      ${dif.length ? `<div class="tarjeta" style="margin-top:20px;padding:14px"><h3>Preguntas del banco: de la más difícil a la más fácil</h3>
        <div class="tabla-envoltura"><table class="tabla"><tr><th>Id</th><th>Módulo</th><th>Pregunta</th><th>Veces</th><th>Acierto</th></tr>
        ${dif.map((x) => `<tr><td>${x.q.id}</td><td class="n">${x.q.mod}</td><td style="white-space:normal;min-width:220px">${II.esc(textoQ(x.q))}</td><td class="n">${x.n}</td><td class="n"><b style="color:${x.p >= 0.7 ? 'var(--ok)' : x.p >= 0.4 ? 'var(--duda)' : 'var(--mal)'}">${II.fmt(x.p * 100, 0)} %</b></td></tr>`).join('')}</table></div></div>` : ''}
      <div class="tarjeta" style="margin-top:24px;padding:14px">
        <h3>Datos de prueba</h3>
        <p class="nota">Borra todas las respuestas e ingresos del control de estudio. Úsalo solo después de probar, <b>antes de abrirlo</b> a los estudiantes. La ventana (abre/cierra) no cambia.</p>
        ${ventanaCE().estado === 'abierta' ? '<div class="aviso duda">El control está <b>abierto</b>: si ya entraron estudiantes, borrarías sus datos reales.</div>' : ''}
        <button class="boton peligro" data-acc="ce-borrar">Borrar datos de esta sesión</button>
      </div>`;
  };

  const csvCE = () => {
    const n = (x) => (x == null ? '' : String(x).replace('.', ','));
    const q = (s) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
    const cab = ['Nombre', 'Carnet', 'Área', 'Módulos (/7)', 'Estudio (min)', 'Inicio', 'Duración (min)', 'Estado', 'Nota (/100)', 'Ponderada (/10)',
      ...Array.from({ length: CE.nEval }, (_, j) => `P${j + 1}`), 'Preguntas (id)'];
    const filas = filasCE().map((f) => [q(f.a.nombre), q(f.a.carnet), q(f.a.info.area), f.mods, f.min, q(f.inicio ? fechaBO(f.inicio) : ''), n(f.dur != null ? Math.round(f.dur * 10) / 10 : null),
      q(f.origen), n(f.nota), n(f.nota == null ? null : Math.round(f.nota * 10) / 100),
      ...f.ids.map((_, j) => n(f.cal ? Math.round(f.cal.puntos[j] * 100) / 100 : null)), q(f.ids.join(' '))].join(';'));
    const csv = '\ufeff' + [cab.map(q).join(';'), ...filas].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `control-de-estudio-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const iniciarAsincrona = () => {
    if (D.pestana === 'pizarra') D.pestana = 'control';
    main.innerHTML = `<div class="contenido" style="max-width:860px">
      ${selectorSesiones()}
      <div class="pestanas"><button data-p="control">Control</button><button data-p="reporte">Reporte</button></div>
      <div id="panel"></div></div>`;
    II.$$('.pestanas button').forEach((b) => b.addEventListener('click', () => { D.pestana = b.dataset.p; pintar(); }));
    II.$('#sel-sesion').addEventListener('change', (e) => { location.search = '?s=' + e.target.value; });
    const cambiar = async (b, cambios, okMsg) => {
      b.disabled = true;
      const r = await II.fijarExtra(SES, cambios, extraCE());
      if (!r.ok) { aviso('No se pudo cambiar: ' + r.error); b.disabled = false; return; }
      D.fila = { ...(D.fila || {}), extra: r.extra };
      pintar();
      if (okMsg) { const a = II.html(`<div class="aviso ok aviso-flotante">${okMsg}</div>`); document.body.appendChild(a); setTimeout(() => a.remove(), 3500); }
    };
    let borrarCE = false;
    II.$('#panel').addEventListener('click', async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const acc = b.dataset.acc;
      if (acc === 'ce-abrir') {
        const v = ventanaCE();
        if (v.cierra && v.cierra < Date.now()) return aviso('La fecha de cierre ya pasó: cámbiala primero.');
        cambiar(b, { abre: new Date().toISOString() }, 'Control de estudio abierto.');
      } else if (acc === 'ce-cerrar') cambiar(b, { cierra: new Date().toISOString() }, 'Control de estudio cerrado.');
      else if (acc === 'ce-ocultar') cambiar(b, { abre: null }, 'Volvió a «No abierto».');
      else if (acc === 'ce-guardar-cierre') {
        const val = II.$('#ce-cierra').value;
        const ms = val ? deEntradaBO(val) : NaN;
        if (!isFinite(ms)) return aviso('Escribe una fecha y hora de cierre válidas.');
        II.$('#ce-cierra').blur();
        cambiar(b, { cierra: new Date(ms).toISOString() }, 'Cierre guardado: ' + fechaBO(ms) + '.');
      } else if (acc === 'ce-csv') csvCE();
      else if (acc === 'recargar') cargar();
      else if (acc === 'ce-copiar') {
        try { await navigator.clipboard.writeText(urlEstudio()); b.textContent = '¡Copiado!'; }
        catch (err) { b.textContent = 'Mantén presionado el enlace para copiarlo'; }
        setTimeout(() => { if (b.isConnected) b.textContent = 'Copiar enlace de estudiantes'; }, 2500);
      } else if (acc === 'ce-borrar') {
        if (!borrarCE) {
          borrarCE = true; b.classList.add('confirmar'); b.textContent = 'Toca otra vez para confirmar';
          setTimeout(() => { borrarCE = false; if (b.isConnected) { b.classList.remove('confirmar'); b.textContent = 'Borrar datos de esta sesión'; } }, 4000);
          return;
        }
        borrarCE = false; b.disabled = true; b.textContent = 'Borrando…';
        const r1 = await II.sb.from('respuestas').delete().eq('sesion', SES);
        const r2 = await II.sb.from('ingresos').delete().eq('sesion', SES);
        if (r1.error || r2.error) aviso('No se pudo borrar: ' + (r1.error || r2.error).message);
        D.respuestas = []; D.ingresos = [];
        cargar();
      }
    });
    II.seguirEstado(SES, (fila) => { D.fila = fila; pintar(); });
    // seguirEstado no avisa los cambios de la ventana hechos desde otro dispositivo: se relee cada 30 s
    setInterval(async () => {
      const { data } = await II.sb.from('estado_sesion').select('*').eq('sesion', SES).maybeSingle();
      if (data && JSON.stringify(data.extra) !== JSON.stringify(extraCE())) { D.fila = data; pintar(); }
    }, 30000);
    cargar();
    suscribir();
    setInterval(cargar, 15000);
    // si no existe la fila (falta aplicar el SQL), se avisa en la vista de control
    II.sb.from('estado_sesion').select('*').eq('sesion', SES).maybeSingle().then(({ data }) => { if (!data) { D.fila = null; pintar(); } });
  };

  // arranque
  II.sb.auth.getSession().then(({ data }) => { if (data && data.session) verificarDocente(); else pintarLogin(); });
})();
