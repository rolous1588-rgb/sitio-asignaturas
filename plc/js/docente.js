// ============================================================
// Panel docente (pensado para el celular): control, pizarra, reporte
// ============================================================
(function () {
  const II = window.II;
  let SES = II.sesionActual();
  let S = II.SESIONES[SES];
  const main = II.$('#principal');
  const D = { fila: null, respuestas: [], ingresos: [], ruleta: [], conectados: [], lista: [], cand: [], pestana: 'control', actividad: null, detalle: null, seguido: {}, sorteando: false, terminando: null };

  II.alCambiarConexion((ok) => { const p = II.$('#b-conexion'); if (p) p.className = 'punto-conexion ' + (ok ? 'ok' : 'mal'); });

  if (!II.configurado) {
    main.innerHTML = `<div class="contenido angosto"><div class="tarjeta"><h2>Falta conectar Supabase</h2>
      <p class="sub">Abre <code>plc/base/config.js</code> y pega la Project URL y la publishable key de tu proyecto.</p>
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
    const [r1, r2, r3, con, cand, r4] = await Promise.all([
      II.sb.from('respuestas').select('*').eq('sesion', SES).order('creado').range(0, 4999),
      II.sb.from('ingresos').select('*').eq('sesion', SES).order('creado').range(0, 1999),
      II.sb.from('ruleta').select('*').eq('sesion', SES).order('creado'),
      II.conectados(SES),
      II.candidatosRuleta(SES),
      D.lista.length ? Promise.resolve({ data: D.lista }) : II.sb.from('estudiantes').select('carnet,nombre,fantasma')
    ]);
    const antes = D.respuestas.length + '|' + D.ingresos.length + '|' + D.ruleta.length + '|' + D.conectados.length + '|' + D.cand.length;
    if (r4 && !r4.error && r4.data) D.lista = r4.data;
    const fantasmas = new Set(D.lista.filter((e) => e.fantasma).map((e) => e.carnet));   // el estudiante fantasma no cuenta en nada
    if (!r1.error) D.respuestas = r1.data.filter((x) => !fantasmas.has(x.carnet));
    if (!r2.error) D.ingresos = r2.data.filter((x) => !fantasmas.has(x.carnet));
    if (!r3.error) D.ruleta = r3.data;
    D.conectados = con;
    D.cand = cand;
    II.marcarConexion(!r1.error && !r2.error);
    if (antes !== D.respuestas.length + '|' + D.ingresos.length + '|' + D.ruleta.length + '|' + D.conectados.length + '|' + D.cand.length || !II.$('#panel') || !II.$('#panel').innerHTML) pintar();
  };
  const suscribir = () => {
    if (D.seguido[SES]) return;
    D.seguido[SES] = true;
    II.sb.channel('panel-' + SES)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'respuestas', filter: 'sesion=eq.' + SES }, (p) => {
        if (p.new.sesion !== SES || D.respuestas.some((x) => x.id === p.new.id)) return;
        if (esFantasma(p.new.carnet)) return;
        D.respuestas.push(p.new); pintar();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ingresos', filter: 'sesion=eq.' + SES }, (p) => {
        if (p.new.sesion !== SES || D.ingresos.some((x) => x.id === p.new.id)) return;
        if (esFantasma(p.new.carnet)) return;
        D.ingresos.push(p.new); pintar();
      })
      .subscribe();
  };

  const esFantasma = (carnet) => D.lista.some((e) => e.carnet === carnet && e.fantasma);
  const nombreLista = (carnet, otro) => { const e = D.lista.find((x) => x.carnet === carnet); return e ? e.nombre : otro; };
  // los que ingresaron a la sesión (sin el estudiante fantasma); el nombre sale de la lista del módulo
  const alumnos = () => {
    const m = new Map();
    D.ingresos.forEach((i) => m.set(i.carnet, { carnet: i.carnet, nombre: nombreLista(i.carnet, i.nombre), info: i.info || {}, ingreso: true }));
    D.respuestas.forEach((r) => { if (!m.has(r.carnet)) m.set(r.carnet, { carnet: r.carnet, nombre: nombreLista(r.carnet, r.nombre), info: {}, ingreso: true }); });
    return Array.from(m.values()).filter((a) => !esFantasma(a.carnet)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  };
  // para el reporte: toda la lista del módulo (los que no ingresaron cuentan 0) más quien entró sin estar en la lista
  const alumnosReporte = () => {
    const m = new Map();
    D.lista.filter((e) => !e.fantasma).forEach((e) => m.set(e.carnet, { carnet: e.carnet, nombre: e.nombre, info: {}, ingreso: false }));
    alumnos().forEach((a) => m.set(a.carnet, { ...a, fueraLista: !D.lista.some((e) => e.carnet === a.carnet) }));
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
        <div class="nota">Conectados ahora: <b>${D.conectados.length}</b>; registrados hoy: <b>${al}</b>${env != null ? `; enviaron: <b>${env}</b>` : ''}</div>
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
      ${tarjetaMando(p)}
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


  // ---------- v2: pausa a mando, ruleta, terminar clase y traslado de pendientes ----------
  const exActual = () => (D.fila && D.fila.extra) || {};
  const nConectados = () => D.conectados.length;
  // actividades que quedaron sin hacer: retos y preguntas rápidas desde el paso actual en adelante
  const pendientes = () => {
    const i = pasoIdx(), ex = exActual();
    const terminada = !!ex.cierre_anticipado;
    const desde = terminada ? Math.max(0, II.indicePaso(SES, ex.cierre_anticipado.hasta)) : i;
    return S.pasos.map((p, j) => ({ p, j })).filter(({ p, j }) => (p.tipo === 'reto' || p.tipo === 'rapida') && (j > desde || (j === desde && !deActividad(II.actividadDe(p)).some((r) => !esVacio(r)))));
  };
  const tarjetaMando = (p) => {
    const ex = exActual();
    const pa = II.pausaDe(D.fila);
    const enPausa = pa && II.restaPausa(pa) > 0;
    const ru = II.ruletaDe(D.fila);
    const act = actividadDePaso(p);
    const abierta = act && (p.tipo === 'reto' || p.tipo === 'rapida') && !II.cierreDe(D.fila, act);
    // --- pausa ---
    const cPausa = enPausa
      ? `<div class="controles" style="justify-content:space-between"><b style="font-size:1.1rem">☕ Pausa: quedan <span id="pa-resta">${II.formatoReloj(II.restaPausa(pa))}</span></b><span class="controles"><button class="boton chico" data-acc="pausa-mas">+1 min</button><button class="boton chico primario" data-acc="pausa-fin">Terminar pausa</button></span></div>`
      : `<div class="controles"><label class="campo" style="margin:0"><span>Minutos de pausa</span><input class="entrada" id="pa-min" inputmode="numeric" placeholder="10" value="${II.esc(String(D.paMin || ''))}" style="width:96px"></label>
          <button class="boton primario" data-acc="pausa-ini" style="align-self:end">☕ Iniciar pausa</button></div>
         ${abierta ? '<div class="nota" style="margin-top:6px">Antes de pausar, cierra el reto o la pregunta que está abierto: durante la pausa no se reciben respuestas.</div>' : ''}`;
    // --- ruleta ---
    let cRuleta;
    if (ru && ru.estado === 'llamando') {
      cRuleta = `<div class="aviso info" style="margin:0 0 8px"><b>${II.esc(ru.nombre)}</b> <span class="nota">(${II.esc(ru.carnet)})</span><br>Llámalo por Meet y pídele que responda en voz alta.</div>
        <div class="controles"><button class="boton" data-acc="ru-ok" style="background:var(--ok-claro);border-color:var(--ok)">✓ Respondió</button>
        <button class="boton peligro" data-acc="ru-no">✗ No responde (−${II.PENALIZACION} %)</button>
        <button class="boton" data-acc="ru-omitir">Omitir</button></div>`;
    } else {
      const cand = D.cand || [];
      const salieron = cand.filter((c) => c.salio).length;
      cRuleta = `<div class="controles"><button class="boton primario" data-acc="ru-sortear" ${D.sorteando || !cand.length ? 'disabled' : ''}>🎡 ${D.sorteando ? 'Sorteando…' : 'Sortear entre todos los que ingresaron'}</button><span class="nota">Participan ${cand.length} que ingresaron a esta sesión (${nConectados()} conectados ahora; ya salieron ${salieron}). Responder no da puntos.</span></div>
        <details style="margin-top:8px"><summary class="nota" style="cursor:pointer">Ver quiénes participan</summary>
          <div style="margin-top:6px">${cand.map((c) => `<div class="rank-fila"><span>${II.esc(c.nombre)}${c.salio ? ' <span class="nota">(ya salió)</span>' : ''}</span><span class="nota" style="color:${c.conectado ? 'var(--ok)' : 'var(--texto-3)'}">${c.conectado ? '● conectado' : '○ desconectado'}</span></div>`).join('') || '<p class="nota">Todavía no ingresó nadie.</p>'}</div></details>
        ${ru && ru.estado ? `<div class="nota" style="margin-top:6px">Último: ${II.esc(ru.nombre)}: ${ru.estado === 'responde' ? 'respondió' : ru.estado === 'no_responde' ? 'no respondió' : ru.estado}</div>` : ''}`;
    }
    // --- terminar clase / traslado ---
    let cFin;
    if (ex.cierre_anticipado) {
      const pend = pendientes();
      const otras = Object.values(II.SESIONES).filter((x) => x.id !== SES);
      cFin = `<div class="aviso ok" style="margin:0 0 8px">La clase está <b>terminada</b>: se evalúa solo lo realizado.</div>
        ${pend.length ? `<div class="etiqueta" style="margin:6px 0">Pendientes (marca los que pasan a la siguiente sesión)</div>
          <div style="display:grid;gap:6px">${pend.map(({ p: q }) => `<label class="opcion" style="padding:8px 10px"><input type="checkbox" data-tr="${q.id}" ${D.trSel && D.trSel[q.id] === false ? '' : 'checked'}>${II.esc(q.titulo)}</label>`).join('')}</div>
          <label class="campo" style="margin:10px 0 6px"><span>Sesión de destino</span><input class="entrada" id="tr-dest" placeholder="pl-s2" value="${II.esc(D.trDest || (otras[0] ? otras[0].id : 'pl-s2'))}"></label>
          <button class="boton primario" data-acc="trasladar">Trasladar a esa sesión</button>
          <div class="nota" style="margin-top:6px">Los puntos de lo trasladado cuentan solo en la sesión nueva; esta sesión no se modifica.${ex.trasladados_a ? ' Ya trasladaste a: <b>' + II.esc(ex.trasladados_a) + '</b>.' : ''}</div>` : '<div class="nota">No quedaron actividades pendientes.</div>'}
        <button class="boton chico" style="margin-top:10px" data-acc="reanudar">Reanudar la clase</button>`;
    } else if (D.terminando) {
      cFin = `<div class="aviso duda" style="margin:0">⏳ Cerrando la actividad abierta y terminando la clase…</div>`;
    } else {
      cFin = `<button class="boton peligro bloque" data-acc="terminar">⏹ Terminar clase ahora</button>
        <div class="nota" style="margin-top:6px">Cierra lo que esté abierto, lleva a todos al cierre y evalúa solo lo que se hizo. Lo pendiente se puede trasladar a otra sesión. Toca dos veces.</div>`;
    }
    const bloque = (t, c) => `<div class="tarjeta" style="padding:12px 14px;margin-bottom:12px"><div class="etiqueta" style="margin-bottom:6px">${t}</div>${c}</div>`;
    return bloque('Pausa (tú decides cuánto dura)', cPausa) + bloque('Ruleta de participación', cRuleta) + bloque('Terminar la clase', cFin);
  };

  const acMando = async (acc, b) => {
    const ex = exActual();
    const guardar = async (cambios) => {
      const r = await II.fijarExtra(SES, cambios, D.fila ? D.fila.extra : {});
      if (!r.ok) { aviso('No se pudo guardar: ' + r.error); return false; }
      D.fila = { ...(D.fila || {}), extra: r.extra }; pintar(); return true;
    };
    if (acc === 'pausa-ini') {
      const m = Math.round(+String((II.$('#pa-min') || {}).value || '').replace(',', '.'));
      if (!isFinite(m) || m < 1 || m > 120) return aviso('Escribe los minutos de pausa (entre 1 y 120).');
      const p = S.pasos[pasoIdx()], act = actividadDePaso(p);
      if (act && !II.cierreDe(D.fila, act) && (p.tipo === 'reto' || p.tipo === 'rapida')) return aviso('Cierra primero el reto o la pregunta que está abierto.');
      D.paMin = m;
      await guardar({ pausa: { hasta: new Date(Date.now() + m * 60000).toISOString(), minutos: m, paso_previo: p.id } });
    } else if (acc === 'pausa-fin') await guardar({ pausa: null });
    else if (acc === 'pausa-mas') { const pa = II.pausaDe(D.fila); if (pa) await guardar({ pausa: { ...pa, hasta: new Date(new Date(pa.hasta).getTime() + 60000).toISOString(), minutos: (pa.minutos || 0) + 1 } }); }
    else if (acc === 'ru-sortear') {
      D.sorteando = true; pintar();
      const r = await II.sortearRuleta(SES);
      D.sorteando = false;
      if (!r.ok) { aviso(r.error || 'No se pudo sortear.'); return pintar(); }
      const cand = (await II.candidatosRuleta(SES)).map((x) => x.nombre).slice(0, 60);
      await guardar({ ruleta: { id: String(Date.now()), carnet: r.carnet, nombre: r.nombre, hora: new Date().toISOString(), estado: 'llamando', cand } });
    } else if (acc === 'ru-ok' || acc === 'ru-no' || acc === 'ru-omitir') {
      const ru = II.ruletaDe(D.fila); if (!ru) return;
      b.disabled = true;
      const res = acc === 'ru-ok' ? 'responde' : acc === 'ru-no' ? 'no_responde' : 'omitir';
      const rr = await II.registrarRuleta(SES, ru.carnet, ru.nombre, res, S.pasos[pasoIdx()].id);
      if (!rr.ok) { aviso('No se pudo registrar: ' + rr.error); b.disabled = false; return; }
      await guardar({ ruleta: res === 'omitir' ? null : { ...ru, estado: res, resuelta: new Date().toISOString() } });
      cargar();
    } else if (acc === 'terminar') {
      if (!D.terminarArmado) {
        D.terminarArmado = true; b.classList.add('confirmar'); b.textContent = 'Toca otra vez para terminar la clase';
        setTimeout(() => { D.terminarArmado = false; if (b.isConnected) { b.classList.remove('confirmar'); b.textContent = '⏹ Terminar clase ahora'; } }, 4000);
        return;
      }
      D.terminarArmado = false;
      const p = S.pasos[pasoIdx()], act = actividadDePaso(p);
      const finalizar = async () => {
        const e2 = exActual();
        const r = await II.fijarPaso(SES, 'cierre', { ...e2, cierre: null, pausa: null, ruleta: null, cierre_anticipado: { hasta: p.id, hora: new Date().toISOString() } });
        D.terminando = null;
        if (!r.ok) aviso('No se pudo terminar la clase: ' + r.error);
        else D.fila = { ...(D.fila || {}), paso: 'cierre', extra: { ...e2, cierre: null, pausa: null, ruleta: null, cierre_anticipado: { hasta: p.id, hora: new Date().toISOString() } } };
        pintar();
      };
      if (act && (p.tipo === 'reto' || p.tipo === 'rapida')) {
        // primero se cierra la actividad abierta para que los estudiantes envíen lo que tienen
        const seg = II.SEG_CIERRE[p.tipo] || 30;
        D.terminando = true;
        await guardar({ cierre: { act, seg, fin: new Date(Date.now() + seg * 1000).toISOString(), id: String(Date.now()) } });
        setTimeout(finalizar, (seg + 4) * 1000);
      } else await finalizar();
    } else if (acc === 'reanudar') await guardar({ cierre_anticipado: null });
    else if (acc === 'trasladar') {
      const dest = String((II.$('#tr-dest') || {}).value || '').trim();
      const ids = II.$$('[data-tr]').filter((x) => x.checked).map((x) => x.dataset.tr);
      if (!dest || dest === SES) return aviso('Escribe la sesión de destino (por ejemplo pl-s2).');
      if (!ids.length) return aviso('Marca al menos una actividad.');
      b.disabled = true; b.textContent = 'Trasladando…';
      const tr = ids.map((id) => 'traslado:' + SES + ':' + id);
      const filas = ids.map((id) => ({ sesion_origen: SES, actividad: id, sesion_destino: dest }));
      const r1 = await II.sb.from('pendientes').insert(filas);
      if (r1.error) { aviso('No se pudo guardar: ' + r1.error.message); b.disabled = false; b.textContent = 'Trasladar a esa sesión'; return; }
      // la sesión de destino guarda las actividades habilitadas (si su fila no existe, se crea)
      const q = await II.sb.from('estado_sesion').select('*').eq('sesion', dest).maybeSingle();
      const exD = (q.data && q.data.extra) || {};
      const nuevo = Array.from(new Set([...(exD.trasladados || []), ...tr]));
      const r2 = q.data
        ? await II.sb.from('estado_sesion').update({ extra: { ...exD, trasladados: nuevo } }).eq('sesion', dest).select()
        : await II.sb.from('estado_sesion').insert({ sesion: dest, extra: { trasladados: nuevo } }).select();
      if (r2.error || !r2.data || !r2.data.length) { aviso('No se pudo habilitar en la sesión destino: ' + (r2.error ? r2.error.message : 'sin permiso')); b.disabled = false; return; }
      await guardar({ trasladados_a: dest });
    }
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
    else cuerpo = `<div class="aviso ok" style="margin:0">✓ ${p.tipo === 'rapida' ? 'Pregunta cerrada: en la presentación ya se ven los resultados.' : 'Reto cerrado. Toca <b>Siguiente</b> para la revisión.'}</div>`;
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
    let act = D.actividad || actividadDePaso(S.pasos[pasoIdx()]) || 'a-reto';
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
  // actividades con puntos de esta sesión (retos, preguntas rápidas y pendientes trasladados desde otra sesión)
  const actividades = () => {
    const L = [];
    Object.entries(S.retos).forEach(([k, r]) => L.push({ id: k, nombre: r.titulo.split('·')[0].trim(), puntos: r.puntos }));
    II.rapidasDe(S).forEach((p, j) => L.push({ id: p.id, nombre: 'Rápida ' + (j + 1), puntos: II.puntosRapida(p) }));
    ((D.fila && D.fila.extra && D.fila.extra.trasladados) || []).forEach((id) => {
      const [, orig, pid] = String(id).split(':'); const O = II.SESIONES[orig]; const po = O && O.pasos.find((q) => q.id === pid);
      if (!po) return;
      L.push({ id, nombre: 'Pendiente de S' + O.numero + ': ' + po.titulo.split('·')[0].trim(), puntos: po.tipo === 'reto' ? O.retos[po.reto].puntos : II.puntosRapida(po) });
    });
    return L;
  };
  // una actividad cuenta como «realizada» si al menos un estudiante envió algo (no vacío)
  const realizada = (a) => deActividad(a.id).some((r) => !esVacio(r));
  const mejorDe = (a, carnet) => {
    const rs = deActividad(a.id).filter((r) => r.carnet === carnet && r.intento <= 2);
    return rs.length ? Math.max(...rs.map((r) => +r.puntaje || 0)) : null;
  };
  const tablaReporte = () => {
    const acts = actividades();
    const hechas = acts.filter(realizada);
    const pos = hechas.reduce((s, a) => s + a.puntos, 0);
    return alumnosReporte().map((al) => {
      const diag = deActividad('diagnostico').filter((r) => r.carnet === al.carnet).pop();
      const pts = acts.map((a) => mejorDe(a, al.carnet));
      const obt = hechas.reduce((s, a) => s + (mejorDe(a, al.carnet) || 0), 0);
      const nr = D.ruleta.filter((r) => r.carnet === al.carnet && r.resultado === 'no_responde' && !r.anulado).length;
      const part = II.participacionDia(obt, pos, nr);
      return { a: al, diag: diag ? diag.respuesta.aciertos : null, pts, obt, pos, nr, ...part };
    });
  };
  const pct = (x) => II.fmt(Math.round(x * 10) / 10, 1) + ' %';
  const vistaReporte = () => {
    const acts = actividades();
    const filas = tablaReporte();
    const hechas = acts.filter(realizada);
    const pos = hechas.reduce((s, a) => s + a.puntos, 0);
    const ruTxt = { responde: 'Respondió', no_responde: 'No respondió', omitir: 'Omitida' };
    return `
      <div class="controles" style="margin-bottom:12px">
        <button class="boton primario" data-acc="csv">Descargar para Excel (.csv)</button>
        <button class="boton" data-acc="recargar">Actualizar</button>
      </div>
      <div class="aviso info" style="margin-top:0">Participación del día = puntos obtenidos ÷ puntos posibles de lo <b>realizado</b> (${hechas.length} de ${acts.length} actividades; ${II.fmt(pos, 1)} puntos posibles). Si no respondió a la ruleta, se restan ${II.PENALIZACION} puntos porcentuales, una vez por día.</div>
      <div class="tabla-envoltura"><table class="tabla">
        <tr><th>Nombre</th><th>Carnet</th><th>Diag. /5</th>${acts.map((a) => `<th>${II.esc(a.nombre)} /${a.puntos}${realizada(a) ? '' : ' (no se hizo)'}</th>`).join('')}<th>Obtenidos /${II.fmt(pos, 1)}</th><th>Bruta</th><th>Ruleta (no resp.)</th><th>Final del día</th></tr>
        ${filas.map((f) => `<tr><td>${II.esc(f.a.nombre)}${f.a.ingreso ? '' : ' <span class="nota">(no ingresó)</span>'}${f.a.fueraLista ? ' <span class="nota">(no está en la lista)</span>' : ''}</td><td>${II.esc(f.a.carnet)}</td><td class="n">${f.diag ?? '—'}</td>${f.pts.map((p) => `<td class="n">${p == null ? '—' : II.fmt(p, 1)}</td>`).join('')}<td class="n"><b>${II.fmt(f.obt, 1)}</b></td><td class="n">${pct(f.bruta)}</td><td class="n">${f.nr ? '−' + f.penalizacion + ' pts %' : '—'}</td><td class="n"><b>${pct(f.final)}</b></td></tr>`).join('') || `<tr><td colspan="${7 + acts.length}" class="nota">Aún no hay datos.</td></tr>`}
      </table></div>
      <div class="tarjeta" style="margin-top:18px;padding:14px"><h3>Llamados de la ruleta (${D.ruleta.length})</h3>
        ${D.ruleta.length ? D.ruleta.slice().reverse().map((r) => `<div class="rank-fila"><span>${II.esc(r.nombre)} <span class="nota">; ${new Date(r.creado).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/La_Paz' })}; ${ruTxt[r.resultado]}${r.anulado ? ' (anulado)' : ''}</span></span>
          ${r.resultado === 'no_responde' ? `<button class="boton chico" data-acc="ru-anular" data-id="${r.id}" data-v="${r.anulado ? 0 : 1}">${r.anulado ? 'Restituir' : 'Anular'}</button>` : '<span></span>'}</div>`).join('') : '<p class="nota">Todavía no se llamó a nadie.</p>'}
      </div>
      <div class="tarjeta" style="margin-top:24px;padding:14px">
        <h3>Datos de prueba</h3>
        <p class="nota">Borra todas las respuestas, ingresos y llamados de la ruleta de esta sesión y vuelve la clase al inicio. Úsalo después de probar la plataforma, antes de la clase real.</p>
        <button class="boton peligro" data-acc="borrar">Borrar datos de esta sesión</button>
      </div>`;
  };
  const descargarCSV = () => {
    const acts = actividades();
    const n = (x) => (x == null ? '' : String(Math.round(x * 100) / 100).replace('.', ','));
    const q = (s) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
    const cab = ['Nombre', 'Carnet', 'Área', 'Experiencia', 'Diagnóstico (/5)', ...acts.map((a) => `${a.nombre} (/${a.puntos})${realizada(a) ? '' : ' no se hizo'}`),
      'Puntos obtenidos', 'Puntos posibles de lo realizado', 'Participación bruta (%)', 'Veces que no respondió a la ruleta', 'Penalización (puntos %)', 'Participación final del día (%)'];
    const filas = tablaReporte().map((f) => [q(f.a.nombre), q(f.a.carnet), q(f.a.info.area), q(f.a.info.experiencia), n(f.diag), ...f.pts.map(n),
      n(f.obt), n(f.pos), n(f.bruta), f.nr, n(f.penalizacion), n(f.final)].join(';'));
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
    const r3 = await II.sb.from('ruleta').delete().eq('sesion', SES);
    if (r1.error || r2.error || r3.error) aviso('No se pudo borrar: ' + (r1.error || r2.error || r3.error).message);
    await II.fijarPaso(SES, 'inicio', {});
    D.fila = { ...(D.fila || {}), paso: 'inicio', extra: {} };
    D.respuestas = []; D.ingresos = []; D.ruleta = [];
    borrarArmado = false;
    cargar();
  };

  // ---------- pintado ----------
  const pintar = () => {
    if (!II.$('#panel')) return;
    II.$$('.pestanas button').forEach((b) => b.classList.toggle('activo', b.dataset.p === D.pestana));
    const cont = II.$('#panel');
    // no repintar mientras el docente escribe los minutos de la pausa
    if (document.activeElement && document.activeElement.id === 'pa-min') return;
    const detalleAbierto = D.pestana === 'pizarra' && II.$('#detalle-alumno') && II.$('#detalle-alumno').innerHTML ? D.detalle : null;
    cont.innerHTML = D.pestana === 'control' ? vistaControl() : D.pestana === 'pizarra' ? vistaPizarra() : vistaReporte();
    if (detalleAbierto) verDetalle(detalleAbierto);
  };

  const selectorSesiones = () => `<div class="controles" style="margin-bottom:12px">
        <select class="entrada" id="sel-sesion" style="max-width:100%">${Object.values(II.SESIONES).map((s) => `<option value="${s.id}" ${s.id === SES ? 'selected' : ''}>${s.etiqueta ? II.esc(s.etiqueta) : 'Sesión ' + s.numero} · ${II.esc(s.titulo)}</option>`).join('')}</select>
      </div>`;

  const iniciarPanel = () => {
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
      else if (['pausa-ini', 'pausa-fin', 'pausa-mas', 'ru-sortear', 'ru-ok', 'ru-no', 'ru-omitir', 'terminar', 'reanudar', 'trasladar'].includes(acc)) acMando(acc, b);
      else if (acc === 'ru-anular') {
        b.disabled = true;
        const r = await II.sb.from('ruleta').update({ anulado: b.dataset.v !== '0' }).eq('id', +b.dataset.id);
        if (r.error) aviso('No se pudo anular: ' + r.error.message);
        cargar();
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
    // cada 10 s: quién está conectado (para la ruleta) y la cuenta de la pausa
    setInterval(async () => { D.conectados = await II.conectados(SES); if (D.pestana === 'control' && !(document.activeElement && document.activeElement.id === 'pa-min')) pintar(); }, 10000);
    setInterval(() => {
      const pa = II.pausaDe(D.fila), e = II.$('#pa-resta');
      if (e && pa) e.textContent = II.formatoReloj(II.restaPausa(pa));
      if (pa && II.restaPausa(pa) <= 0 && D.pestana === 'control') { pintar(); }
    }, 1000);
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

  // arranque
  II.sb.auth.getSession().then(({ data }) => { if (data && data.session) verificarDocente(); else pintarLogin(); });
})();
