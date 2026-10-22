// ============================================================
// Transformadas · Recuperatorio del 1.er parcial (Laplace, 22/10/2026) — panel del docente
// Adaptado del panel del examen de raíces de Métodos Numéricos (copiado, no cargado).
// ?s=prueba → ensayo (tf-rec1-prueba); sin parámetro → examen oficial (tf-rec1)
// Dos vistas: «QR» (para proyectar en la TV) y «Control» (solo en el celular del docente, sin espejo).
// estado_sesion.extra = { asincrona, token, qr, abre, fin, cierra, pausa: { rest }, publicado,
//                         cod: { reg: '123' }, ver: { reg: hora }, obs: { reg: hora }, reab: { reg: n } }
//   · QR: sirve para todos mientras «qr» sea true; «Nuevo QR» cambia «token» y el anterior deja de servir
//   · Código: el panel da a cada registro un código de 3 cifras distinto (cod)
//   · Verificar: el docente escribe el código que ve en el celular del estudiante (ver)
//   · Observado: bloquea a ese registro (obs); lo que envíe después no se toma en cuenta
//   · Cuenta regresiva: fin = ahora + N minutos; cierra = fin + 60 s (margen de red); sin cuenta, cierra = null
// ============================================================
(function () {
  const $ = II.$;
  const $$ = II.$$;
  const PRUEBA = /prueba/.test(II.params.get('s') || '');
  const SID = PRUEBA ? 'tf-rec1-prueba' : 'tf-rec1';
  const URL_EST = new URL('index.html', location.href).href.split('?')[0];
  const esc = II.esc;

  let ex = {};
  let offset = 0;
  const ahora = () => Date.now() + offset;
  let ing = [];
  let resp = [];
  let ultimoId = 0;
  let alumnos = [];
  let vistaP = II.leer('rc-panel-vista-' + SID, 'control');
  let buscado = null;

  const hora = (t) => (t ? new Date(t).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : '—');
  const mmss = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const pts = (x) => (x == null ? '—' : II.fmt(x, 2));
  const fase = () => (!ex.abre ? 'espera' : ex.fin && ahora() >= Date.parse(ex.fin) ? 'terminado' : 'curso');

  function aviso(txt, cls = 'info') {
    const a = $('#aviso');
    if (!a) return;
    a.className = 'aviso ' + cls;
    a.innerHTML = txt;
    clearTimeout(aviso.t);
    aviso.t = setTimeout(() => a.classList.add('oculto'), 4500);
  }
  // botón con doble toque para confirmar
  function dobleToque(btn, texto, accion) {
    if (!btn) return;
    const original = btn.textContent;
    let armado = false, t = null;
    btn.onclick = (e) => {
      e.stopPropagation();
      if (!armado) {
        armado = true;
        btn.textContent = texto;
        btn.classList.add('peligro');
        t = setTimeout(() => { armado = false; btn.textContent = original; btn.classList.remove('peligro'); }, 4000);
        return;
      }
      clearTimeout(t);
      btn.disabled = true;
      accion();
    };
  }

  // ---------------- ingreso del docente ----------------
  async function esDocente() {
    try { const { data, error } = await II.sb.from('docentes').select('email').limit(1); return !error && !!(data && data.length); } catch (e) { return false; }
  }
  function vIngreso() {
    $('#cont').innerHTML = `<div class="tarjeta"><span class="etq">Recuperatorio de Laplace${PRUEBA ? '; ensayo' : ''}</span><h2>Panel del docente</h2>
      <p>Entra con tu cuenta docente (la misma de las otras materias).</p>
      <form id="f-doc"><label class="campo"><span>Correo</span><input name="email" type="email" required autocomplete="username"></label>
      <label class="campo"><span>Contraseña</span><input name="clave" type="password" required autocomplete="current-password"></label>
      <div class="aviso mal oculto" id="f-err"></div><button class="boton prim bloque">Entrar</button></form></div>`;
    $('#f-doc').onsubmit = async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const err = $('#f-err');
      err.classList.remove('oculto');
      err.textContent = 'Entrando…';
      const { error } = await II.sb.auth.signInWithPassword({ email: String(fd.get('email')).trim(), password: String(fd.get('clave')) });
      if (error) { err.textContent = /fetch|network/i.test(error.message || '') ? 'Sin internet. Revisa la conexión.' : 'No se pudo entrar: revisa correo y contraseña.'; return; }
      if (!(await esDocente())) { err.textContent = 'Esta cuenta no tiene permiso de docente.'; await II.sb.auth.signOut(); return; }
      arrancar();
    };
  }

  // ---------------- estado ----------------
  async function sincronizarHora() {
    const t0 = Date.now();
    try {
      const { data } = await II.sb.rpc('estado_evaluacion', { p_sesion: SID, p_carnet: '---' });
      const d = data && data[0];
      if (d && d.ahora) offset = Date.parse(d.ahora) - (t0 + Date.now()) / 2;
    } catch (e) { /* nada */ }
  }
  async function leerEstado() {
    try {
      const { data, error } = await II.sb.from('estado_sesion').select('extra').eq('sesion', SID).maybeSingle();
      if (error) throw error;
      II.marcarConexion(true);
      if (!data) {
        const extra = { asincrona: true, abre: null, cierra: null, qr: true, token: nuevoToken() };
        await II.sb.from('estado_sesion').insert({ sesion: SID, paso: 'inicio', extra });
        ex = extra;
      } else ex = data.extra || {};
    } catch (e) { II.marcarConexion(false); }
  }
  // lee lo último y aplica los cambios; «cambios» puede ser una función del estado actual
  let ocupado = Promise.resolve();
  function cambiar(cambios, texto) {
    ocupado = ocupado.then(async () => {
      await leerEstado();
      const c = typeof cambios === 'function' ? cambios(ex) : cambios;
      const extra = { ...ex, asincrona: true, ...c };
      Object.keys(extra).forEach((k) => { if (extra[k] === undefined) delete extra[k]; });
      const { data, error } = await II.sb.from('estado_sesion').update({ extra, actualizado: new Date().toISOString() }).eq('sesion', SID).select();
      if (error || !data || !data.length) { aviso('No se pudo guardar el cambio. Revisa la conexión.', 'mal'); return false; }
      ex = data[0].extra || {};
      if (texto) aviso(texto, 'ok');
      agrupar();
      pintar(true);
      return true;
    });
    return ocupado;
  }
  const nuevoToken = () => Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);
  const iso = (ms) => new Date(ms).toISOString();

  // ---------------- datos (incrementales) ----------------
  async function cargarDatos(todo) {
    try {
      if (todo) { resp = []; ultimoId = 0; }
      for (;;) {
        const { data, error } = await II.sb.from('respuestas').select('id,actividad,carnet,nombre,respuesta,creado').eq('sesion', SID).gt('id', ultimoId).order('id').range(0, 999);
        if (error) throw error;
        data.forEach((r) => { resp.push(r); ultimoId = Math.max(ultimoId, r.id); });
        if (data.length < 1000) break;
      }
      const { data: di, error: e2 } = await II.sb.from('ingresos').select('id,carnet,nombre,info,creado').eq('sesion', SID).order('id').range(0, 999);
      if (e2) throw e2;
      ing = di || [];
      II.marcarConexion(true);
      agrupar();
      await asignarCodigos();
    } catch (e) { II.marcarConexion(false); }
  }

  // cada registro (reg) es una fila: la misma persona en dos celulares son dos filas
  function agrupar() {
    const g = {};
    const de = (reg, r) => (g[reg] = g[reg] || { reg, carnet: r.carnet, nombre: r.nombre, info: {}, disp: new Set(), primero: null, snap: null, snapT: null, snapId: 0, nsnap: 0, ultT: null });
    const regDe = (r, x) => (x && x.reg) || (r.info && r.info.reg) || r.carnet + '|' + ((x && x.disp) || (r.info && r.info.disp) || '');
    ing.forEach((r) => {
      const a = de(regDe(r, r.info), r);
      a.nombre = r.nombre;
      a.info = { ...a.info, ...(r.info || {}) };
      if (r.info && r.info.disp) a.disp.add(r.info.disp);
      if (!a.primero || r.creado < a.primero) a.primero = r.creado;
    });
    resp.forEach((r) => {
      const x = r.respuesta || {};
      const a = de(regDe(r, x), r);
      if (r.actividad === 'ingreso') { a.info = { ...x, ...a.info }; if (x.disp) a.disp.add(x.disp); if (!a.primero || r.creado < a.primero) a.primero = r.creado; return; }
      if (r.actividad !== 'avance') return;
      if (x.disp) a.disp.add(x.disp);
      a.nsnap++;
      a.ultT = r.creado;
      // lo que llegó después de observarlo no cuenta
      const obs = ex.obs && ex.obs[a.reg];
      if (obs && r.creado > obs) return;
      if (!a.snap || r.id > a.snapId) { a.snap = x; a.snapId = r.id; a.snapT = r.creado; }
    });
    const porCU = {};
    Object.values(g).forEach((a) => { porCU[a.carnet] = (porCU[a.carnet] || 0) + 1; });
    alumnos = Object.values(g).map((a) => {
      const e = (a.snap && a.snap.est) || {};
      const cal = RC.nota(a.carnet, e);
      return {
        ...a, est: e, cal, av: RC.avance(e), sal: (a.snap && a.snap.sal) || null, ndisp: a.disp.size, mismoCU: porCU[a.carnet],
        cod: (ex.cod && ex.cod[a.reg]) || null, ver: (ex.ver && ex.ver[a.reg]) || null, obs: (ex.obs && ex.obs[a.reg]) || null,
        termino: !!(a.snap && a.snap.termino)
      };
    }).sort((p, q) => (!!p.ver - !!q.ver) || String(p.nombre).localeCompare(String(q.nombre)));
  }

  // códigos de 3 cifras distintos, uno por registro
  let asignando = false;
  async function asignarCodigos() {
    if (asignando) return;
    const faltan = alumnos.filter((a) => !(ex.cod && ex.cod[a.reg])).map((a) => a.reg);
    if (!faltan.length) return;
    asignando = true;
    try {
      await cambiar((e) => {
        const cod = { ...(e.cod || {}) };
        const usados = new Set(Object.values(cod));
        faltan.forEach((reg) => {
          if (cod[reg]) return;
          let c;
          do { c = String(100 + Math.floor(Math.random() * 900)); } while (usados.has(c) && usados.size < 900);
          cod[reg] = c;
          usados.add(c);
        });
        return { cod };
      });
    } finally { asignando = false; }
  }

  // ---------------- vistas ----------------
  function vPanel() {
    $('#cont').innerHTML = `<div class="aviso oculto" id="aviso"></div>
      <div class="rc-vistas"><button data-v="qr" class="${vistaP === 'qr' ? 'activa' : ''}">QR (para la TV)</button><button data-v="control" class="${vistaP === 'control' ? 'activa' : ''}">Control</button></div>
      <div id="v-qr" class="${vistaP === 'qr' ? '' : 'oculto'}"></div>
      <div id="v-control" class="${vistaP === 'control' ? '' : 'oculto'}">
        <div class="aviso duda rc-espejo">Esta vista muestra nombres y códigos: <b>no la proyectes</b>.</div>
        <div class="tarjeta"><span class="etq">${PRUEBA ? 'Examen de ENSAYO (no es el oficial)' : 'Examen oficial'}</span><h2>Recuperatorio de Laplace</h2>
          <p class="mp-nota">${PRUEBA ? '<a href="panel.html">Ir al examen oficial</a>' : '<a href="panel.html?s=prueba">Ir al examen de ensayo</a>'}</p><div id="control"></div></div>
        <div class="tarjeta"><span class="etq">Verificar en el aula</span>
          <p class="mp-nota">Escribe el código de 3 cifras que ves en el celular del estudiante, junto a su nombre.</p>
          <form id="f-ver" class="rc-ver"><input id="i-cod" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="123"><button class="boton prim">Buscar</button></form>
          <div id="ver-res"></div></div>
        <div id="alertas"></div>
        <div class="tarjeta"><span class="etq">Estudiantes</span><p class="mp-nota">Arriba, los que faltan verificar. Toca un nombre para ver sus respuestas y salidas.</p><div id="lista"></div></div>
        ${PRUEBA ? '<div class="tarjeta"><span class="etq">Ensayo</span><p class="mp-nota">Deja el ensayo como nuevo: borra registros, respuestas, códigos y notas.</p><button class="boton" id="b-reiniciar" style="color:var(--mal);border-color:var(--mal)">Reiniciar el ensayo y borrar sus datos</button></div>' : ''}
        <div class="tarjeta"><button class="boton" id="b-salir">Salir</button></div>
      </div>`;
    $$('[data-v]').forEach((b) => { b.onclick = () => { vistaP = b.dataset.v; II.guardar('rc-panel-vista-' + SID, vistaP); vPanel(); }; });
    $('#b-salir').onclick = async () => { await II.sb.auth.signOut(); location.reload(); };
    $('#f-ver').onsubmit = (ev) => { ev.preventDefault(); buscado = String($('#i-cod').value || '').trim(); pintarVer(); };
    const br = $('#b-reiniciar');
    if (br) dobleToque(br, 'Toca otra vez para borrar todo el ensayo', async () => {
      await Promise.all([II.sb.from('respuestas').delete().eq('sesion', SID), II.sb.from('ingresos').delete().eq('sesion', SID)]);
      await II.sb.from('estado_sesion').update({ extra: { notas: {} } }).eq('sesion', SID + '-notas');
      const { error } = await II.sb.from('estado_sesion').update({ extra: { asincrona: true, abre: null, cierra: null, qr: true, token: nuevoToken() }, actualizado: new Date().toISOString() }).eq('sesion', SID);
      aviso(error ? 'No se pudo reiniciar.' : 'Ensayo reiniciado.', error ? 'mal' : 'ok');
      buscado = null;
      await leerEstado();
      await cargarDatos(true);
      vPanel();
    });
    pintar(true);
  }

  let claveQR = '', claveControl = '', claveLista = '', listaForzada = false;
  function pintar(forzar) {
    if (vistaP === 'qr') pintarQR(forzar);
    else { if (forzar) listaForzada = true; pintarControl(forzar); pintarListas(); pintarVer(); }
  }

  // ---------------- vista QR ----------------
  function pintarQR(forzar) {
    const c = $('#v-qr');
    if (!c) return;
    const f = fase();
    const s = ex.pausa ? Number(ex.pausa.rest) / 1000 : ex.fin ? (Date.parse(ex.fin) - ahora()) / 1000 : null;
    const reloj = f === 'curso' && s != null ? (ex.pausa ? '⏸ ' : '⏱ ') + mmss(s) : '';
    const clave = JSON.stringify([ex.qr, ex.token, f, alumnos.length, reloj]);
    if (!forzar && clave === claveQR) return;
    claveQR = clave;
    const url = URL_EST + '?s=' + (PRUEBA ? 'prueba' : 'tf-rec1') + '&t=' + encodeURIComponent(ex.token || '');
    c.innerHTML = `<div class="rc-qr">
      <div class="rc-qr-tit">Recuperatorio de Laplace${PRUEBA ? ' (ENSAYO)' : ''}${reloj ? `<span class="rc-qr-reloj">${reloj}</span>` : ''}</div>
      ${ex.qr ? `<div class="qr">${II.qrSVG(url, 600)}</div><p class="rc-qr-txt">Escanea con la cámara del celular</p>` : '<div class="rc-qr-bloq">Ingreso cerrado</div>'}
      <div class="rc-qr-n">Registrados: <b>${alumnos.length}</b>${f === 'espera' ? '; esperando el inicio' : f === 'curso' ? '; examen en curso' : '; examen terminado'}</div>
      <div class="exp-bt rc-qr-bt">
        <button class="boton" id="q-nuevo">Nuevo QR</button>
        <button class="boton ${ex.qr ? '' : 'prim'}" id="q-bloq">${ex.qr ? 'Bloquear QR' : 'Habilitar QR'}</button>
        ${f === 'espera' ? `<button class="boton" id="q-iniciar" style="border-color:var(--ok);color:var(--ok)">Iniciar examen (${alumnos.length})</button>` : ''}
      </div></div>`;
    $('#q-nuevo').onclick = () => cambiar({ token: nuevoToken(), qr: true }, 'QR nuevo: el anterior ya no sirve.');
    $('#q-bloq').onclick = () => cambiar({ qr: !ex.qr }, ex.qr ? 'QR bloqueado: nadie más puede entrar.' : 'QR habilitado.');
    dobleToque($('#q-iniciar'), 'Toca otra vez para iniciar', iniciar);
  }

  // ---------------- vista Control ----------------
  function pintarControl(forzar) {
    const f = fase();
    const c = $('#control');
    if (!c) return;
    const activos = alumnos.filter((a) => !a.obs);
    const prom = activos.length ? Math.round(activos.reduce((s, a) => s + a.av, 0) / activos.length) : 0;
    const nver = alumnos.filter((a) => a.ver).length;
    const nobs = alumnos.filter((a) => a.obs).length;
    const nter = alumnos.filter((a) => a.termino && !a.obs).length;
    const clave = JSON.stringify([f, !!ex.pausa, ex.pausa && ex.pausa.rest, ex.fin, ex.publicado, ex.qr, alumnos.length, prom, nver, nobs, nter]);
    if (!forzar && clave === claveControl) return;
    claveControl = clave;
    let h = `<div class="exp-fase"><span class="mpp-pill ${f === 'curso' ? 'ok' : f === 'terminado' ? 'mal' : 'duda'}">${f === 'espera' ? 'Antes de iniciar' : f === 'curso' ? 'En curso' : 'Terminado'}</span>
      <span>QR ${ex.qr ? 'habilitado' : '<b>bloqueado</b>'}</span></div>
      <div class="rc-cifras"><div><b>${prom}%</b><small>avance promedio</small></div><div><b>${alumnos.length}</b><small>registros</small></div>
        <div><b>${nver}</b><small>verificados</small></div><div class="${alumnos.length - nver - nobs ? 'mal' : ''}"><b>${alumnos.length - nver - nobs}</b><small>sin verificar</small></div>
        <div><b>${nter}</b><small>terminaron</small></div><div class="${nobs ? 'mal' : ''}"><b>${nobs}</b><small>observados</small></div></div>
      <div class="rc-barra"><span style="width:${prom}%"></span></div>`;
    if (f === 'espera') {
      h += `<div class="exp-bt"><button class="boton" id="b-iniciar" style="border-color:var(--ok);color:var(--ok)">Iniciar examen (${alumnos.length})</button></div>
        <p class="mp-nota">«Iniciar» abre el examen para todos (toca dos veces). Los que entren después empiezan directo.</p>`;
    } else if (f === 'curso') {
      if (ex.pausa) {
        h += `<div class="exp-reloj pausa">⏸ ${mmss(ex.pausa.rest / 1000)}</div><p class="mp-nota" style="text-align:center">Cuenta regresiva detenida</p>
          <div class="exp-bt"><button class="boton prim" id="b-reanudar">Reanudar</button></div>`;
      } else if (ex.fin) {
        h += `<div class="exp-reloj" id="reloj">${mmss((Date.parse(ex.fin) - ahora()) / 1000)}</div>
          <div class="exp-bt"><button class="boton" id="b-detener">Detener</button></div>`;
      } else {
        h += `<p>Abierto desde las ${hora(ex.abre)}; sin cuenta regresiva.</p>
          <div class="exp-bt"><span class="rc-min">Últimos <input class="exp-min" id="i-min" type="number" min="1" max="180" value="15"> minutos</span><button class="boton prim" id="b-cuenta">Empezar cuenta regresiva</button></div>`;
      }
      if (ex.pausa || ex.fin) h += `<div class="exp-bt"><span class="rc-min">Sumar <input class="exp-min" id="i-mas" type="number" min="1" max="120" value="5"> minutos</span><button class="boton" id="b-mas">Sumar</button></div>`;
      h += `<div class="exp-bt"><button class="boton" id="b-terminar" style="border-color:var(--mal);color:var(--mal)">Terminar examen ahora</button></div>`;
    } else {
      h += `<p>Terminó a las ${hora(ex.fin)}<br>${ex.publicado ? '<b>Notas publicadas.</b>' : 'Los estudiantes todavía no ven su nota.'}</p>
        <div class="exp-bt">${ex.publicado ? '<button class="boton" id="b-ocultar">Ocultar notas</button>' : '<button class="boton prim" id="b-publicar">Publicar notas</button>'}<button class="boton" id="b-csv">Descargar notas (Excel)</button></div>
        <div class="exp-bt"><span class="rc-min">Reabrir <input class="exp-min" id="i-reab" type="number" min="1" max="60" value="5"> minutos</span><button class="boton" id="b-reabrir">Reabrir</button></div>`;
    }
    c.innerHTML = h;
    const on = (id, fn) => { const b = $('#' + id); if (b) b.onclick = fn; };
    dobleToque($('#b-iniciar'), 'Toca otra vez para iniciar', iniciar);
    on('b-cuenta', () => {
      const m = Math.max(1, Math.min(180, Number($('#i-min').value) || 15));
      const fin = ahora() + m * 60000;
      cambiar({ fin: iso(fin), cierra: iso(fin + 60000), pausa: null }, `Cuenta regresiva: ${m} minutos.`);
    });
    on('b-detener', () => {
      const rest = Math.max(0, Date.parse(ex.fin) - ahora());
      cambiar({ pausa: { rest }, fin: null, cierra: null }, 'Cuenta regresiva detenida.');
    });
    on('b-reanudar', () => {
      const fin = ahora() + Number(ex.pausa.rest);
      cambiar({ fin: iso(fin), cierra: iso(fin + 60000), pausa: null }, 'Cuenta regresiva reanudada.');
    });
    on('b-mas', () => {
      const m = Math.max(1, Math.min(120, Number($('#i-mas').value) || 5));
      if (ex.pausa) cambiar({ pausa: { rest: Number(ex.pausa.rest) + m * 60000 } }, `+${m} minutos.`);
      else if (ex.fin) { const fin = Date.parse(ex.fin) + m * 60000; cambiar({ fin: iso(fin), cierra: iso(fin + 60000) }, `+${m} minutos.`); }
    });
    dobleToque($('#b-terminar'), 'Toca otra vez: termina en 20 s', () => {
      const fin = ahora() + 20000;
      cambiar({ fin: iso(fin), cierra: iso(fin + 60000), pausa: null }, 'El examen termina en 20 segundos. Cada celular envía lo que tiene.');
    });
    on('b-reabrir', () => {
      const m = Math.max(1, Math.min(60, Number($('#i-reab').value) || 5));
      const fin = ahora() + m * 60000;
      cambiar({ fin: iso(fin), cierra: iso(fin + 60000), pausa: null, publicado: false }, `Reabierto ${m} minutos.`);
    });
    dobleToque($('#b-publicar'), 'Toca otra vez para publicar', publicar);
    on('b-ocultar', () => cambiar({ publicado: false }, 'Notas ocultas.'));
    on('b-csv', descargar);
  }

  async function iniciar() {
    await cambiar({ abre: iso(ahora() - 5000), fin: null, cierra: null, pausa: null, publicado: false }, 'Examen iniciado.');
  }

  async function publicar() {
    await cargarDatos(true);
    const notas = {};
    alumnos.forEach((a) => {
      notas[a.reg] = a.obs ? { obs: true } : { n: a.cal.total, h: RC.firma(a.est), p: Object.fromEntries(RC.PROB.map((p) => [p, a.cal.res[p].pts])) };
    });
    const fila = SID + '-notas';
    const { data } = await II.sb.from('estado_sesion').select('sesion').eq('sesion', fila).maybeSingle();
    const q = data
      ? II.sb.from('estado_sesion').update({ extra: { notas }, actualizado: new Date().toISOString() }).eq('sesion', fila).select()
      : II.sb.from('estado_sesion').insert({ sesion: fila, paso: 'notas', extra: { notas } }).select();
    const { data: d2, error } = await q;
    if (error || !d2 || !d2.length) { aviso('No se pudieron guardar las notas. Revisa la conexión.', 'mal'); pintar(true); return; }
    await cambiar({ publicado: true }, `Notas publicadas (${Object.keys(notas).length}).`);
  }

  // ---------------- verificar por código ----------------
  function pintarVer() {
    const box = $('#ver-res');
    if (!box) return;
    if (!buscado) { box.innerHTML = ''; return; }
    const a = alumnos.find((x) => x.cod === buscado);
    if (!a) { box.innerHTML = `<div class="aviso mal">Ningún registro con el código ${esc(buscado)}.</div>`; return; }
    box.innerHTML = `<div class="rc-ver-res ${a.ver ? 'ok' : ''}"><b>${esc(a.nombre)}</b><small>C.U. ${esc(a.carnet)}; ${esc(a.info.carrera || '')}; código ${esc(a.cod)}</small>
      ${a.obs ? '<div class="aviso mal">Este examen está observado.</div>' : a.ver ? `<div class="aviso ok">Ya verificado a las ${hora(a.ver)}.</div>` : '<button class="boton prim bloque" id="b-confirmar">Confirmar: está en el aula</button>'}
      ${a.mismoCU > 1 ? `<div class="aviso duda">Hay ${a.mismoCU} registros con este C.U.</div>` : ''}</div>`;
    const b = $('#b-confirmar');
    if (b) b.onclick = () => { b.disabled = true; const reg = a.reg; cambiar((e) => ({ ver: { ...(e.ver || {}), [reg]: iso(ahora()) } }), 'Verificado: ' + esc(a.nombre)).then(() => { const i = $('#i-cod'); if (i) { i.value = ''; i.focus(); } }); };
  }

  // ---------------- lista ----------------
  function pintarListas() {
    const conSal = alumnos.filter((a) => a.sal && (a.sal.n || (a.sal.foco && a.sal.foco.n)));
    const dup = alumnos.filter((a) => a.mismoCU > 1);
    const al = $('#alertas');
    if (al) al.innerHTML = (conSal.length ? `<div class="aviso duda">⚠ ${conSal.length} ${conSal.length === 1 ? 'estudiante salió' : 'estudiantes salieron'} de la página o perdieron el foco.</div>` : '') +
      (dup.length ? `<div class="aviso mal">⚠ Hay C.U. con más de un registro (${dup.length} registros). Verifica cuál está en el aula.</div>` : '');
    const l = $('#lista');
    if (!l) return;
    const f = fase();
    // solo se vuelve a pintar si algo cambió (para no desarmar un doble toque)
    const clave = JSON.stringify([f, alumnos.map((a) => [a.reg, a.nombre, a.cod, a.ver, a.obs, a.av, a.termino, a.sal && a.sal.n, a.sal && a.sal.abierta, a.sal && a.sal.foco && a.sal.foco.n, a.mismoCU, a.ndisp, f === 'terminado' ? a.cal.total : 0])]);
    if (clave === claveLista && !listaForzada) return;
    claveLista = clave;
    listaForzada = false;
    l.innerHTML = alumnos.length ? alumnos.map((a, i) => {
      const s = a.sal || {};
      const chips = [];
      chips.push(a.obs ? '<span class="mpp-c mal">OBSERVADO</span>' : a.ver ? '<span class="mpp-c ok">verificado</span>' : '<span class="mpp-c mal">sin verificar</span>');
      chips.push(`<span class="mpp-c">avance ${a.av}%</span>`);
      if (a.termino) chips.push('<span class="mpp-c">terminó</span>');
      if (s.n) chips.push(`<span class="mpp-c mal">salió ${s.n}; ${s.seg} s</span>`);
      if (s.abierta) chips.push('<span class="mpp-c mal">fuera ahora</span>');
      if (s.foco && s.foco.n) chips.push(`<span class="mpp-c mal">foco ${s.foco.n}</span>`);
      if (s.recargas) chips.push(`<span class="mpp-c">recargó ${s.recargas}</span>`);
      if (a.mismoCU > 1) chips.push(`<span class="mpp-c mal">${a.mismoCU} registros con su C.U.</span>`);
      if (a.ndisp > 1) chips.push(`<span class="mpp-c mal">${a.ndisp} celulares</span>`);
      const alerta = !a.ver || s.n || (s.foco && s.foco.n) || a.mismoCU > 1;
      const botones = a.obs
        ? `<button class="boton chico" data-desobs="${i}">Quitar observación</button>`
        : `<button class="boton chico rc-obs" data-obs="${i}">Examen observado</button>${a.termino && f === 'curso' ? `<button class="boton chico" data-reab="${i}">Reabrir</button>` : ''}`;
      return `<div class="exp-al ${a.obs ? 'rc-observado' : alerta ? 'alerta' : ''}"><div data-al="${i}"><div class="l1"><b>${esc(a.nombre)}</b><span class="n">${f === 'terminado' ? pts(a.cal.total) + '/100' : a.av + '%'}</span></div>
        <div class="l2">Código <b class="mono">${esc(a.cod || '…')}</b>; C.U. ${esc(a.carnet)}; ${esc(a.info.carrera || '')}</div>
        <div class="rc-barra chica"><span style="width:${a.av}%"></span></div>
        <div class="l3">${chips.join('')}</div></div><div class="exp-bt">${botones}</div></div>`;
    }).join('') : '<p class="mp-nota">Todavía no se registró nadie.</p>';
    $$('[data-al]').forEach((b) => { b.onclick = () => detalle(alumnos[Number(b.dataset.al)]); });
    $$('[data-obs]').forEach((b) => {
      const a = alumnos[Number(b.dataset.obs)];
      dobleToque(b, 'Toca otra vez: bloquear', () => { const reg = a.reg; cambiar((e) => ({ obs: { ...(e.obs || {}), [reg]: iso(ahora()) } }), 'Examen observado: ' + esc(a.nombre)); });
    });
    $$('[data-desobs]').forEach((b) => {
      const a = alumnos[Number(b.dataset.desobs)];
      dobleToque(b, 'Toca otra vez: quitar', () => { const reg = a.reg; cambiar((e) => { const o = { ...(e.obs || {}) }; delete o[reg]; return { obs: o }; }, 'Observación quitada: ' + esc(a.nombre)); });
    });
    $$('[data-reab]').forEach((b) => {
      const a = alumnos[Number(b.dataset.reab)];
      b.onclick = (e) => { e.stopPropagation(); b.disabled = true; const reg = a.reg; cambiar((x) => ({ reab: { ...(x.reab || {}), [reg]: ((x.reab && x.reab[reg]) || 0) + 1 } }), 'Reabierto para ' + esc(a.nombre)); };
    });
  }

  function detalle(a) {
    const s = a.sal || {};
    const probs = RC.PROB.map((p) => {
      const r = a.cal.res[p];
      const d = RC.datos(p, a.carnet);
      const vals = (a.est[p] && a.est[p].vals) || {};
      const cel = RC.items(p, d).map((it) => {
        const c = r.cel[it.id];
        const v = it.tipo === 'op' ? (vals[it.id] == null ? '—' : 'opción ' + (Number(vals[it.id]) + 1)) : vals[it.id] || '—';
        return `<span class="mpp-cel ${c.r === 'vacio' ? '' : c.r}">\\(${it.et}\\) <b>${esc(String(v).replace(/^-/, '−'))}</b> ${c.r === 'ok' ? '✓' : c.r === 'vacio' ? '—' : '✗'}</span>`;
      }).join('');
      return `<div class="mpp-det"><b>${RC.TITULO[p]} ${RC.NOMBRE[p]}: ${pts(r.pts)}/${RC.MAX[p]}</b><div class="mpp-dfila">${cel}</div></div>`;
    }).join('');
    const salidas = (s.lista || []).map((x) => `<span class="mpp-cel mal">min ${x.min}: ${x.seg} s${x.met ? ' (' + esc(RC.TITULO[x.met] || x.met) + ')' : ''}</span>`).join('') || '<span class="mp-nota">Ninguna.</span>';
    const cambios = (s.cambios || []).map((x) => `<span class="mpp-cel red">${esc(x.f)}: ${x.s} s después de volver</span>`).join('');
    const capa = II.html(`<div class="capa"><div class="dialogo ancho mpp-dialogo">
      <h2>${esc(a.nombre)}</h2>
      <p class="mp-nota">C.U. ${esc(a.carnet)}; C.I. ${esc(a.info.ci || '—')}; ${esc(a.info.carrera || '')}<br>
        Código ${esc(a.cod || '—')}; ${a.ver ? 'verificado ' + hora(a.ver) : 'sin verificar'}${a.obs ? '; <b>observado ' + hora(a.obs) + '</b>' : ''}<br>
        ${a.ndisp} celular${a.ndisp === 1 ? '' : 'es'} (${esc(s.disp || a.info.tipo || '—')}); entró ${hora(a.primero)}; último envío ${hora(a.ultT)} (${a.nsnap} envíos); avance ${a.av}%</p>
      <div class="mpp-det"><b>Salidas de la página: ${s.n || 0} (${s.seg || 0} s en total; la más larga ${s.max || 0} s)</b><div class="mpp-dfila">${salidas}</div>
        <p class="mp-nota">Pérdidas de foco sin salir: ${(s.foco && s.foco.n) || 0} (${(s.foco && s.foco.seg) || 0} s); recargas: ${s.recargas || 0}; pantalla encendida: ${esc(s.pantalla || '—')}${s.abierta ? '; <b>fuera de la página ahora</b>' : ''}</p>
        ${cambios ? `<p class="mp-nota">Cambió respuestas poco después de volver:</p><div class="mpp-dfila">${cambios}</div>` : ''}</div>
      <div class="mpp-det"><b>Respuestas (calificadas con sus números): ${pts(a.cal.total)}/100</b></div>${probs}
      <div class="fila-bt"><button class="boton prim" id="d-cerrar">Cerrar</button></div></div></div>`);
    document.body.appendChild(capa);
    capa.onclick = (e) => { if (e.target === capa) capa.remove(); };
    $('#d-cerrar').onclick = () => capa.remove();
  }

  // ---------------- Excel ----------------
  function descargar() {
    const cel = (v) => { const s = String(v == null ? '' : v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const num = (x) => (x == null ? '' : String(Math.round(x * 100) / 100).replace('.', ','));
    const cab = ['C.U.', 'C.I.', 'Apellidos', 'Nombres', 'Carrera', 'Código', 'Verificado', 'Observado', 'Terminó', ...RC.PROB.map((p) => `${RC.TITULO[p]} (${RC.MAX[p]})`), 'Nota (100)', 'Avance %', 'Salidas', 'Segundos fuera', 'Pérdidas de foco', 'Recargas', 'Celulares', 'Registros con este C.U.', 'Último envío'];
    const filas = [cab.map(cel).join(';')];
    alumnos.forEach((a) => {
      const s = a.sal || {};
      const [ap, no] = String(a.nombre || '').split(', ');
      filas.push([a.carnet, a.info.ci || '', a.info.apellidos || ap || '', a.info.nombres || no || '', a.info.carrera || '', a.cod || '',
        a.ver ? 'sí ' + hora(a.ver) : 'no', a.obs ? 'OBSERVADO ' + hora(a.obs) : '', a.termino ? 'sí' : '',
        ...RC.PROB.map((p) => num(a.cal.res[p].pts)), num(a.cal.total), a.av,
        s.n || 0, s.seg || 0, (s.foco && s.foco.n) || 0, s.recargas || 0, a.ndisp, a.mismoCU, hora(a.ultT)].map(cel).join(';'));
    });
    const blob = new Blob(['﻿' + filas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const el = document.createElement('a');
    el.href = URL.createObjectURL(blob);
    el.download = 'notas-recuperatorio-laplace' + (PRUEBA ? '-ensayo' : '') + '-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(el);
    el.click();
    el.remove();
  }

  // ---------------- arranque ----------------
  let tLento = null, tRapido = null;
  async function arrancar() {
    $('#cont').innerHTML = '<div class="tarjeta"><p>Cargando…</p></div>';
    await sincronizarHora();
    await leerEstado();
    if (!ex.token) await cambiar({ token: nuevoToken(), qr: ex.qr !== false });
    await cargarDatos(true);
    vPanel();
    clearInterval(tLento); clearInterval(tRapido);
    tRapido = setInterval(() => {
      const r = $('#reloj');
      if (r && ex.fin) r.textContent = mmss((Date.parse(ex.fin) - ahora()) / 1000);
      if (vistaP === 'qr') pintarQR(); else pintarControl();
    }, 1000);
    tLento = setInterval(async () => {
      await leerEstado();
      await cargarDatos(false);
      pintar();
    }, 5000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { sincronizarHora(); leerEstado().then(() => pintar(true)); } });
  }

  II.alCambiarConexion((ok) => { const d = $('#e-con'); d.classList.toggle('on', ok); d.classList.toggle('off', !ok); });
  (async () => {
    if (!II.sb) { $('#cont').innerHTML = '<div class="tarjeta"><div class="aviso mal">No se pudo conectar con la base de datos. Revisa internet y recarga.</div></div>'; return; }
    const { data } = await II.sb.auth.getSession();
    if (data && data.session && (await esDocente())) arrancar();
    else vIngreso();
  })();
})();
