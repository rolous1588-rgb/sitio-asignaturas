// ============================================================
// Métodos Numéricos · 2.º parcial de Métodos (16/10/2026) — panel del docente (celular vertical)
// ?s=prueba → examen de ensayo (mn-ex2-prueba); sin parámetro → examen oficial (mn-ex2)
// estado_sesion.extra = { asincrona, token, qr_n, abre, hab: { carnet: true }, fin, cierra, pausa: { rest }, publicado }
//   · QR de un solo uso: la RPC mn_canjear_qr cambia «token» cuando alguien lo escanea; «Nuevo QR» lo cambia a mano
//   · Iniciar: abre = ahora y habilita a todos los registrados; los que llegan después se habilitan uno por uno
//   · Cuenta regresiva: fin = ahora + minutos; detener guarda lo que falta en pausa.rest; cierra = fin + 60 s (margen de red)
//   · Terminar: fin = ahora + 20 s · Publicar: notas en la fila «<sesión>-notas» y publicado = true
// ============================================================
(function () {
  const $ = II.$;
  const $$ = II.$$;
  const PRUEBA = /prueba/.test(II.params.get('s') || '');
  const SID = PRUEBA ? 'mn-ex2-prueba' : 'mn-ex2';
  const URL_EST = new URL('index.html', location.href).href.split('?')[0];
  const esc = II.esc;

  let ex = {};
  let offset = 0;
  const ahora = () => Date.now() + offset;
  let ing = [];
  let resp = [];
  let ultimoId = 0;
  let alumnos = [];
  let filtroCod = '';
  let qrAbierto = false;
  let tokenVisto = null;

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
    btn.onclick = () => {
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
    $('#cont').innerHTML = `<div class="tarjeta"><span class="etq">2.º parcial de Métodos${PRUEBA ? '; ensayo' : ''}</span><h2>Panel del docente</h2>
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
        await II.sb.from('estado_sesion').insert({ sesion: SID, paso: 'inicio', extra: { asincrona: true, abre: null, cierra: null } });
        ex = { asincrona: true };
      } else ex = data.extra || {};
    } catch (e) { II.marcarConexion(false); }
  }
  // lee lo último y aplica los cambios (para no pisar el QR que cambió la RPC)
  async function cambiar(cambios, texto) {
    await leerEstado();
    const extra = { ...ex, asincrona: true, ...cambios };
    Object.keys(extra).forEach((k) => { if (extra[k] === undefined) delete extra[k]; });
    const { data, error } = await II.sb.from('estado_sesion').update({ extra, actualizado: new Date().toISOString() }).eq('sesion', SID).select();
    if (error || !data || !data.length) { aviso('No se pudo guardar el cambio. Revisa la conexión.', 'mal'); return false; }
    ex = data[0].extra || {};
    if (texto) aviso(texto, 'ok');
    pintarControl(true);
    return true;
  }
  // confirmación del docente: el código del panel coincide con el que muestra el celular del estudiante
  async function marcarCodigo(a, on) {
    const ver = { ...(ex.ver || {}) };
    if (on) ver[a.carnet] = codigoDe(a); else delete ver[a.carnet];
    const ok = await cambiar({ ver }, on ? `Código ${codigoDe(a)} confirmado para ${a.nombre}.` : 'Confirmación quitada.');
    pintarListas();
    return ok;
  }
  const nuevoToken = () => Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);
  const iso = (ms) => new Date(ms).toISOString();

  // ---------------- datos (incrementales) ----------------
  // código de 3 cifras de cada estudiante: el que vio al registrarse o el que reasignó el docente
  const codigoDe = (a) => (ex.codigos && ex.codigos[a.carnet]) || a.info.cod || (a.snap && a.snap.cod) || '—';
  // si dos estudiantes tienen el mismo código, el segundo recibe uno libre (se guarda en la sesión)
  let asignando = false;
  async function asignarCodigos() {
    const reservados = new Set(alumnos.map(codigoDe));
    const orden = alumnos.slice().sort((p, q) => String(p.primero || '').localeCompare(String(q.primero || '')));
    const vistos = new Set(); const nuevos = {};
    let libre = 100;
    orden.forEach((a) => {
      let c = codigoDe(a);
      if (c === '—' || vistos.has(c)) {
        while (reservados.has(String(libre)) || vistos.has(String(libre))) libre++;
        c = String(libre); reservados.add(c); nuevos[a.carnet] = c;
      }
      vistos.add(c);
    });
    const n = Object.keys(nuevos).length;
    if (!n) return;
    await cambiar({ codigos: { ...(ex.codigos || {}), ...nuevos } }, `Códigos repetidos: se asignó otro código a ${n} estudiante${n === 1 ? '' : 's'}.`);
  }

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
      pintarListas();
    } catch (e) { II.marcarConexion(false); }
  }

  function agrupar() {
    const g = {};
    const de = (c, n) => (g[c] = g[c] || { carnet: c, nombre: n, info: {}, disp: new Set(), primero: null, snap: null, snapT: null, nsnap: 0 });
    ing.forEach((r) => {
      const a = de(r.carnet, r.nombre);
      a.nombre = r.nombre;
      a.info = { ...a.info, ...(r.info || {}) };
      if (r.info && r.info.disp) a.disp.add(r.info.disp);
      if (!a.primero || r.creado < a.primero) a.primero = r.creado;
    });
    resp.forEach((r) => {
      const a = de(r.carnet, r.nombre);
      const x = r.respuesta || {};
      if (r.actividad === 'ingreso') { a.info = { ...x, ...a.info }; if (x.disp) a.disp.add(x.disp); if (!a.primero || r.creado < a.primero) a.primero = r.creado; return; }
      if (r.actividad !== 'avance') return;
      if (x.disp) a.disp.add(x.disp);
      a.nsnap++;
      if (!a.snap || r.id > a.snapId) { a.snap = x; a.snapId = r.id; a.snapT = r.creado; }
    });
    alumnos = Object.values(g).map((a) => {
      const e = (a.snap && a.snap.est) || {};
      const cal = EX.nota(a.carnet, e);
      const filas = EX.MET.reduce((s, m) => s + ((e[m] && e[m].filas) || []).filter((f) => f && f.vals && Object.keys(f.vals).length).length, 0);
      return { ...a, est: e, cal, filas, sal: (a.snap && a.snap.sal) || null, hab: !!(ex.hab && ex.hab[a.carnet]), ndisp: a.disp.size };
    }).sort((p, q) => String(p.nombre).localeCompare(String(q.nombre)));
    if (alumnos.length && !asignando) { asignando = true; asignarCodigos().catch(() => {}).finally(() => { asignando = false; }); }
  }

  // ---------------- control ----------------
  // solo se vuelve a pintar si algo cambió (para no borrar lo que el docente está escribiendo ni un doble toque armado)
  let claveControl = '';
  function pintarControl(forzar) {
    const f = fase();
    const c = $('#control');
    if (!c) return;
    const reg = alumnos.length;
    const clave = JSON.stringify([f, !!ex.pausa, ex.pausa && ex.pausa.rest, ex.fin, ex.publicado, reg, ex.qr_n]);
    if (!forzar && clave === claveControl) return;
    claveControl = clave;
    let h = `<div class="exp-fase"><span class="mpp-pill ${f === 'curso' ? 'ok' : f === 'terminado' ? 'mal' : 'duda'}">${f === 'espera' ? 'Antes de iniciar' : f === 'curso' ? 'En curso' : 'Terminado'}</span>
      <span>${reg} registrados${ex.qr_n ? `; QR usados: ${ex.qr_n}` : ''}</span></div>`;
    if (f === 'espera') {
      h += `<div class="exp-bt"><button class="boton prim" id="b-qr">Mostrar QR</button></div>
        <div class="exp-bt"><button class="boton" id="b-iniciar" style="border-color:var(--ok);color:var(--ok)">Iniciar examen (${reg})</button></div>
        <p class="mp-nota">«Iniciar» abre el examen para todos los registrados (toca dos veces para confirmar). Los que se registren después aparecerán en «Llegaron tarde».</p>`;
    } else if (f === 'curso') {
      if (ex.pausa) {
        h += `<div class="exp-reloj pausa">⏸ ${mmss(ex.pausa.rest / 1000)}</div><p class="mp-nota" style="text-align:center">Cuenta regresiva detenida</p>
          <div class="exp-bt"><button class="boton prim" id="b-reanudar">Reanudar</button><button class="boton" id="b-mas">+5 min</button></div>`;
      } else if (ex.fin) {
        h += `<div class="exp-reloj" id="reloj">${mmss((Date.parse(ex.fin) - ahora()) / 1000)}</div>
          <div class="exp-bt"><button class="boton" id="b-detener">Detener</button><button class="boton" id="b-mas">+5 min</button></div>`;
      } else {
        h += `<p>Abierto desde las ${hora(ex.abre)}; sin cuenta regresiva.</p>
          <div class="exp-bt"><span style="display:flex;align-items:center;gap:6px">Últimos <input class="exp-min" id="i-min" type="number" min="1" max="120" value="20"> minutos</span><button class="boton prim" id="b-cuenta">Empezar cuenta regresiva</button></div>`;
      }
      h += `<div class="exp-bt"><button class="boton" id="b-qr">Mostrar QR (llegaron tarde)</button></div>
        <div class="exp-bt"><button class="boton" id="b-terminar" style="border-color:var(--mal);color:var(--mal)">Terminar examen</button></div>`;
    } else {
      h += `<p>Terminó a las ${hora(ex.fin)}<br>${ex.publicado ? '<b>Notas publicadas.</b>' : 'Los estudiantes todavía no ven su nota.'}</p>
        <div class="exp-bt">${ex.publicado ? '<button class="boton" id="b-ocultar">Ocultar notas</button>' : '<button class="boton prim" id="b-publicar">Publicar notas</button>'}<button class="boton" id="b-csv">Descargar notas (Excel)</button></div>
        <div class="exp-bt"><button class="boton" id="b-reabrir">Reabrir 5 minutos</button></div>`;
    }
    c.innerHTML = h;
    const on = (id, fn) => { const b = $('#' + id); if (b) b.onclick = fn; };
    on('b-qr', abrirQR);
    dobleToque($('#b-iniciar'), 'Toca otra vez para iniciar', iniciar);
    on('b-cuenta', () => {
      const m = Math.max(1, Math.min(120, Number($('#i-min').value) || 20));
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
      if (ex.pausa) cambiar({ pausa: { rest: Number(ex.pausa.rest) + 300000 } }, '+5 minutos.');
      else if (ex.fin) { const fin = Date.parse(ex.fin) + 300000; cambiar({ fin: iso(fin), cierra: iso(fin + 60000) }, '+5 minutos.'); }
    });
    dobleToque($('#b-terminar'), 'Toca otra vez: termina en 20 s', () => {
      const fin = ahora() + 20000;
      cambiar({ fin: iso(fin), cierra: iso(fin + 60000), pausa: null }, 'El examen termina en 20 segundos. Cada celular envía lo que tiene.');
    });
    on('b-reabrir', () => { const fin = ahora() + 300000; cambiar({ fin: iso(fin), cierra: iso(fin + 60000), pausa: null, publicado: false }, 'Reabierto 5 minutos.'); });
    dobleToque($('#b-publicar'), 'Toca otra vez para publicar', publicar);
    on('b-ocultar', () => cambiar({ publicado: false }, 'Notas ocultas.'));
    on('b-csv', descargar);
  }

  async function iniciar() {
    await cargarDatos(false);
    const hab = {};
    alumnos.forEach((a) => { hab[a.carnet] = true; });
    await cambiar({ abre: iso(ahora() - 5000), hab, fin: null, cierra: null, pausa: null, publicado: false }, `Examen iniciado para ${Object.keys(hab).length} estudiantes.`);
    agrupar();
    pintarListas();
  }
  async function habilitar(carnets) {
    await leerEstado();
    const hab = { ...(ex.hab || {}) };
    carnets.forEach((c) => { hab[c] = true; });
    await cambiar({ hab }, carnets.length === 1 ? 'Habilitado.' : `${carnets.length} habilitados.`);
    agrupar();
    pintarListas();
  }

  // ---------------- revisión del razonamiento (parcial 2) ----------------
  // Revisión guardada en la fila <sesión>-notas: extra.revision[carnet] = { rz, fb, obs } (por método)
  // Nota final de cada método (sobre su máximo): 70 % lo automático + 30 % el razonamiento (0–100).
  const NOTA_FINAL = (a, rz) => {
    let t = 0;
    EX.MET.forEach((m) => { t += 0.7 * a.cal.res[m].pts + 0.3 * EX.MAX[m] * ((rz && rz[m]) || 0) / 100; });
    return Math.round(t * 100) / 100;
  };
  async function leerNotasFila() {
    const { data } = await II.sb.from('estado_sesion').select('extra').eq('sesion', SID + '-notas').maybeSingle();
    return (data && data.extra) || {};
  }
  async function escribirNotasFila(cambios) {
    const fila = SID + '-notas';
    const extra = { ...(await leerNotasFila()), ...cambios };
    const { data: ex1 } = await II.sb.from('estado_sesion').select('sesion').eq('sesion', fila).maybeSingle();
    const q = ex1
      ? II.sb.from('estado_sesion').update({ extra, actualizado: new Date().toISOString() }).eq('sesion', fila).select()
      : II.sb.from('estado_sesion').insert({ sesion: fila, paso: 'notas', extra }).select();
    const { data, error } = await q;
    return !error && data && data.length;
  }
  function filaRevision(a, rev) {
    const r = (rev && rev[a.carnet]) || {};
    return r;
  }

  async function publicar() {
    await cargarDatos(true);
    const extra = await leerNotasFila();
    const rev = extra.revision || {};
    const sin = alumnos.filter((a) => a.nsnap > 0 && !(rev[a.carnet] && rev[a.carnet].rz && EX.MET.every((m) => typeof rev[a.carnet].rz[m] === 'number')));
    if (sin.length) { aviso(`Faltan revisar ${sin.length} razonamiento${sin.length === 1 ? '' : 's'}. No se publicó nada.`, 'mal'); pintarControl(true); return; }
    const notas = {};
    alumnos.forEach((a) => {
      const r = filaRevision(a, rev);
      const rz = r.rz || { bis: 0, fp: 0, nr: 0 };
      notas[a.carnet] = {
        n: NOTA_FINAL(a, rz), auto: a.cal.total, h: EX.firma(a.est),
        p: { bis: a.cal.res.bis.pts, fp: a.cal.res.fp.pts, nr: a.cal.res.nr.pts },
        rz, fb: r.fb || {}
      };
    });
    const ok = await escribirNotasFila({ notas });
    if (!ok) { aviso('No se pudieron guardar las notas. Revisa la conexión.', 'mal'); pintarControl(true); return; }
    await cambiar({ publicado: true }, `Notas publicadas (${Object.keys(notas).length}).`);
  }

  function bloqueRevision(a, r) {
    const T = (m) => `<div class="mpp-det"><b>Razonamiento: ${esc(EX.TITULO[m])}</b>
      <p><b>1. Convergencia.</b> ${esc((a.est[m] && a.est[m].razon && a.est[m].razon.c) || '(sin respuesta)')}</p>
      <p><b>2. Significado.</b> ${esc((a.est[m] && a.est[m].razon && a.est[m].razon.s) || '(sin respuesta)')}</p>
      <label class="mpp-lab">Nota del razonamiento (0 a 100)<input type="number" min="0" max="100" step="1" data-rz="${m}" value="${r.rz && typeof r.rz[m] === 'number' ? r.rz[m] : ''}"></label>
      <label class="mpp-lab">Feedback para el estudiante<textarea data-fb="${m}" rows="3">${esc((r.fb && r.fb[m]) || '')}</textarea></label>
      <label class="mpp-lab">Observación para revisar (solo docente)<textarea data-obs="${m}" rows="2">${esc((r.obs && r.obs[m]) || '')}</textarea></label></div>`;
    return `<div class="mpp-det"><b>Revisión del razonamiento</b><p class="mp-nota" id="rev-nota">Nota final estimada: —</p></div>${EX.MET.map(T).join('')}
      <div class="fila-bt"><button class="boton prim" id="d-rev-guardar">Guardar revisión</button><span class="mp-int" id="d-rev-estado"></span></div>`;
  }

  function detalle(a) {
    const s = a.sal || {};
    const verificado = !!(ex.ver && ex.ver[a.carnet] === codigoDe(a));
    const marca = { ok: '✓', red: '≈', mal: '✗', vacio: '—' };
    const metodos = EX.MET.map((m) => {
      const r = a.cal.res[m];
      const e = a.est[m] || {};
      const filas = r.filas.map((f, i) => {
        const vals = (e.filas && e.filas[i] && e.filas[i].vals) || {};
        const cel = Object.entries(f.cel).map(([id, c]) => {
          const v = id === 'dec' ? (vals.dec === 'a' ? 'Xa' : vals.dec === 'b' ? 'Xb' : '—') : vals[id] || '—';
          return `<span class="mpp-cel ${c.r === 'vacio' ? '' : c.r}">${id === 'dec' ? 'extremo' : id} <b>${esc(String(v).replace(/^-/, '−'))}</b> ${marca[c.r]}</span>`;
        }).join('');
        return `<div class="mpp-dfila"><span class="nf">Fila ${i + 1}</span>${cel}</div>`;
      }).join('');
      const der = m === 'nr' ? `<div class="mpp-dfila"><span class="mpp-cel ${e.der ? (e.der.ok ? 'ok' : 'mal') : ''}">derivada ${e.der ? (e.der.ok ? '✓' : '✗') : 'sin elegir'}</span></div>` : '';
      return `<div class="mpp-det"><b>${EX.TITULO[m]}: ${pts(r.pts)}/${EX.MAX[m]}</b><div class="mp-nota mono">${esc(EX.datos(m, a.carnet).tex)}</div>${der}${filas}</div>`;
    }).join('');
    const salidas = (s.lista || []).map((x) => `<span class="mpp-cel mal">min ${x.min}: ${x.seg} s${x.met ? ' (' + esc(EX.TITULO[x.met] || x.met) + ')' : ''}</span>`).join('') || '<span class="mp-nota">Ninguna.</span>';
    const cambios = (s.cambios || []).map((x) => `<span class="mpp-cel red">${esc(x.f)}: ${x.s} s después de volver</span>`).join('');
    const capa = II.html(`<div class="capa"><div class="dialogo ancho mpp-dialogo">
      <h2>${esc(a.nombre)}</h2>
      <p class="mp-nota">C.U. ${esc(a.carnet)}; C.I. ${esc(a.info.ci || '—')}; ${esc(a.info.carrera || '')}<br>
        Código ${esc(codigoDe(a))}; ${a.ndisp} celular${a.ndisp === 1 ? '' : 'es'} (${esc(s.disp || a.info.tipo || '—')}); entró ${hora(a.primero)}; último guardado ${hora(a.snapT)} (${a.nsnap} envíos)</p>
      <div class="mpp-det ex-verif"><b>Código ${esc(codigoDe(a))}</b> — ${verificado ? 'confirmado: coincide con el que muestra su celular.' : 'mira su celular: ¿muestra el mismo número?'}<br><button class="boton ${verificado ? '' : 'prim'}" id="d-ver">${verificado ? 'Quitar confirmación' : 'Confirmar: coincide ✓'}</button></div>
      <div class="mpp-det"><b>Salidas de la página: ${s.n || 0} (${s.seg || 0} s en total; la más larga ${s.max || 0} s)</b><div class="mpp-dfila">${salidas}</div>
        <p class="mp-nota">Pérdidas de foco sin salir: ${(s.foco && s.foco.n) || 0} (${(s.foco && s.foco.seg) || 0} s); recargas: ${s.recargas || 0}; pantalla encendida: ${esc(s.pantalla || '—')}${s.abierta ? '; <b>fuera de la página ahora</b>' : ''}</p>
        ${cambios ? `<p class="mp-nota">Cambió respuestas poco después de volver:</p><div class="mpp-dfila">${cambios}</div>` : ''}</div>
      <div class="mpp-det"><b>Respuestas (calificadas con sus números): ${pts(a.cal.total)}/100</b></div>${metodos}
      <div id="bloque-rev">${a.nsnap > 0 ? '<p class="mp-nota">Cargando revisión…</p>' : '<p class="mp-nota">Sin envíos: no requiere revisión (0).</p>'}</div>
      <div class="fila-bt">${ex.abre && !a.hab ? `<button class="boton prim" id="d-hab">Habilitar</button>` : ''}<button class="boton prim" id="d-cerrar">Cerrar</button></div></div></div>`);
    document.body.appendChild(capa);
    capa.onclick = (e) => { if (e.target === capa) capa.remove(); };
    $('#d-cerrar').onclick = () => capa.remove();
    $('#d-ver').onclick = async (e) => { e.currentTarget.disabled = true; await marcarCodigo(a, !verificado); capa.remove(); detalle(a); };
    const dh = $('#d-hab');
    if (dh) dh.onclick = () => { capa.remove(); habilitar([a.carnet]); };
    if (a.nsnap > 0) cargarRevision(a, capa);
  }

  async function cargarRevision(a, capa) {
    const extra = await leerNotasFila();
    const r = ((extra.revision || {})[a.carnet]) || {};
    const bloque = capa.querySelector('#bloque-rev');
    if (!bloque) return;
    bloque.innerHTML = bloqueRevision(a, r);
    const nota = () => {
      const rz = {};
      EX.MET.forEach((m) => { const v = capa.querySelector(`[data-rz="${m}"]`).value; rz[m] = v === '' ? 0 : Math.min(100, Math.max(0, Number(v))); });
      const txt = EX.MET.every((m) => capa.querySelector(`[data-rz="${m}"]`).value !== '') ? String(NOTA_FINAL(a, rz)).replace('.', ',') + ' / 100' : 'falta una nota de razonamiento';
      capa.querySelector('#rev-nota').textContent = 'Nota final estimada: ' + txt;
    };
    capa.querySelectorAll('[data-rz]').forEach((el) => el.addEventListener('input', nota));
    nota();
    capa.querySelector('#d-rev-guardar').onclick = async () => {
      const est = capa.querySelector('#d-rev-estado');
      if (!EX.MET.every((m) => capa.querySelector(`[data-rz="${m}"]`).value !== '')) { est.textContent = 'Falta la nota de algún razonamiento'; est.className = 'mp-int mal'; return; }
      const nuevo = { rz: {}, fb: {}, obs: {}, t: new Date().toISOString() };
      EX.MET.forEach((m) => {
        nuevo.rz[m] = Math.min(100, Math.max(0, Number(capa.querySelector(`[data-rz="${m}"]`).value)));
        nuevo.fb[m] = capa.querySelector(`[data-fb="${m}"]`).value.trim();
        nuevo.obs[m] = capa.querySelector(`[data-obs="${m}"]`).value.trim();
      });
      const actual = (await leerNotasFila()).revision || {};
      actual[a.carnet] = nuevo;
      est.textContent = 'Guardando…'; est.className = 'mp-int';
      const ok = await escribirNotasFila({ revision: actual });
      est.textContent = ok ? 'Revisión guardada ✓' : 'No se guardó. Revisa la conexión.';
      est.className = ok ? 'mp-int ok' : 'mp-int mal';
    };
  }

  // ---------------- QR en pantalla completa ----------------
  async function abrirQR() {
    await leerEstado();
    if (!ex.token) await cambiar({ token: nuevoToken() });
    qrAbierto = true;
    tokenVisto = ex.token;
    pintarQR('');
  }
  function pintarQR(flash) {
    let capa = $('#capa-qr');
    if (!capa) { capa = document.createElement('div'); capa.id = 'capa-qr'; capa.className = 'exp-qr'; document.body.appendChild(capa); }
    const url = URL_EST + '?s=' + (PRUEBA ? 'prueba' : 'mn-ex2') + '&t=' + encodeURIComponent(ex.token || '');
    const ult = alumnos.length ? alumnos.slice().sort((p, q) => (p.primero < q.primero ? 1 : -1))[0] : null;
    capa.innerHTML = `<div class="qr">${II.qrSVG(url, 600)}</div>
      <div class="exp-flash">${flash || '&nbsp;'}</div>
      <div class="exp-n">Registrados: <b>${alumnos.length}</b>${ult ? `<br><small>Último: ${esc(ult.nombre)}</small>` : ''}</div>
      <div class="fila-bt"><button class="boton" id="q-nuevo">Nuevo QR</button><button class="boton prim" id="q-cerrar">Cerrar</button></div>`;
    $('#q-nuevo').onclick = async () => { await cambiar({ token: nuevoToken() }); tokenVisto = ex.token; pintarQR('QR nuevo'); };
    $('#q-cerrar').onclick = () => { qrAbierto = false; capa.remove(); pintarControl(true); pintarListas(); };
  }

  // ---------------- listas ----------------
  function pintarListas() {
    const f = fase();
    const tarde = alumnos.filter((a) => ex.abre && !(ex.hab && ex.hab[a.carnet]));
    const t = $('#tarde');
    if (t) {
      t.closest('.tarjeta').classList.toggle('oculto', !(f === 'curso' && tarde.length));
      t.innerHTML = tarde.map((a) => `<div class="exp-tarde"><span><b>${esc(a.nombre)}</b><br><small>C.U. ${esc(a.carnet)}; código ${esc(codigoDe(a))}; ${hora(a.primero)}</small></span><button class="boton prim" data-hab="${esc(a.carnet)}">Habilitar</button></div>`).join('') +
        (tarde.length > 1 ? '<div class="exp-bt"><button class="boton" id="b-hab-todos">Habilitar a todos</button></div>' : '');
      $$('[data-hab]').forEach((b) => { b.onclick = () => { b.disabled = true; habilitar([b.dataset.hab]); }; });
      const ht = $('#b-hab-todos');
      if (ht) ht.onclick = () => habilitar(tarde.map((a) => a.carnet));
    }
    const conSal = alumnos.filter((a) => a.sal && (a.sal.n || (a.sal.foco && a.sal.foco.n)));
    $('#alertas').innerHTML = conSal.length ? `<div class="aviso duda">⚠ ${conSal.length} ${conSal.length === 1 ? 'estudiante salió' : 'estudiantes salieron'} de la página o perdieron el foco. Tócalos en la lista para ver el detalle.</div>` : '';
    const q = filtroCod.trim();
    const vis = q ? alumnos.filter((a) => codigoDe(a).startsWith(q)) : alumnos;
    $('#buscado').textContent = q ? (vis.length ? `${vis.length} coincidencia${vis.length === 1 ? '' : 's'}` : 'Ningún código empieza con «' + q + '».') : '';
    $('#lista').innerHTML = alumnos.length ? vis.map((a) => {
      const i = alumnos.indexOf(a);
      const s = a.sal || {};
      const chips = [];
      if (ex.abre) chips.push(`<span class="mpp-c ${a.hab ? '' : 'mal'}">${a.hab ? 'habilitado' : 'sin habilitar'}</span>`);
      if (ex.ver && ex.ver[a.carnet] === codigoDe(a)) chips.push('<span class="mpp-c">código confirmado ✓</span>');
      chips.push(`<span class="mpp-c">${a.filas}/9 filas</span>`);
      if (a.snapT) chips.push(`<span class="mpp-c">guardó ${hora(a.snapT)}</span>`);
      if (s.n) chips.push(`<span class="mpp-c mal">salió ${s.n}; ${s.seg} s</span>`);
      if (s.foco && s.foco.n) chips.push(`<span class="mpp-c mal">foco ${s.foco.n}</span>`);
      if (s.recargas) chips.push(`<span class="mpp-c">recargó ${s.recargas}</span>`);
      if (s.pantalla && s.pantalla !== 'sí' && s.pantalla !== '—') chips.push(`<span class="mpp-c">pantalla: ${esc(s.pantalla)}</span>`);
      if (a.ndisp > 1) chips.push(`<span class="mpp-c mal">${a.ndisp} celulares</span>`);
      const alerta = s.n || (s.foco && s.foco.n) || a.ndisp > 1;
      return `<button class="exp-al ${alerta ? 'alerta' : ''}" data-al="${i}"><div class="l1"><b>${esc(a.nombre)}</b><span class="n">${f === 'terminado' ? pts(a.cal.total) + '/100' : ''}</span></div>
        <div class="l2">${esc(a.info.carrera || '')}; C.U. ${esc(a.carnet)}; código ${esc(codigoDe(a))}</div><div class="l3">${chips.join('')}</div></button>`;
    }).join('') : '<p class="mp-nota">Todavía no se registró nadie.</p>';
    $$('[data-al]').forEach((b) => { b.onclick = () => detalle(alumnos[Number(b.dataset.al)]); });
  }

  // ---------------- Excel ----------------
  async function descargar() {
    const rev = (await leerNotasFila()).revision || {};
    const cel = (v) => { const s = String(v == null ? '' : v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const num = (x) => (x == null ? '' : String(Math.round(x * 100) / 100).replace('.', ','));
    const filas = [['C.U.', 'C.I.', 'Apellidos', 'Nombres', 'Carrera', 'Bisección (30)', 'Falsa posición (35)', 'Newton-Raphson (35)', 'Nota (100)', 'Salidas', 'Segundos fuera', 'Pérdidas de foco', 'Recargas', 'Celulares', 'Último guardado', 'Código', 'Razonamiento bis (100)', 'Razonamiento fp (100)', 'Razonamiento nr (100)', 'Nota final (100)', 'Observación bis', 'Observación fp', 'Observación nr'].map(cel).join(';')];
    alumnos.forEach((a) => {
      const s = a.sal || {};
      const [ap, no] = String(a.nombre || '').split(', ');
      filas.push([a.carnet, a.info.ci || '', a.info.apellidos || ap || '', a.info.nombres || no || '', a.info.carrera || '',
        num(a.cal.res.bis.pts), num(a.cal.res.fp.pts), num(a.cal.res.nr.pts), num(a.cal.total),
        s.n || 0, s.seg || 0, (s.foco && s.foco.n) || 0, s.recargas || 0, a.ndisp, hora(a.snapT),
        codigoDe(a), ...(rev[a.carnet] && rev[a.carnet].rz ? EX.MET.map((m) => rev[a.carnet].rz[m]) : ['', '', '']),
        rev[a.carnet] && rev[a.carnet].rz ? num(NOTA_FINAL(a, rev[a.carnet].rz)) : '',
        ...EX.MET.map((m) => (rev[a.carnet] && rev[a.carnet].obs ? rev[a.carnet].obs[m] || '' : ''))].map(cel).join(';'));
    });
    const blob = new Blob(['﻿' + filas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const el = document.createElement('a');
    el.href = URL.createObjectURL(blob);
    el.download = 'notas-examen-raices' + (PRUEBA ? '-ensayo' : '') + '-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(el);
    el.click();
    el.remove();
  }

  // ---------------- armado ----------------
  function vPanel() {
    $('#cont').innerHTML = `<div class="aviso oculto" id="aviso"></div>
      <div class="tarjeta"><span class="etq">${PRUEBA ? 'Examen de ENSAYO (no es el oficial)' : 'Examen oficial'}</span><h2>2.º parcial de Métodos</h2>
        <p class="mp-nota">${PRUEBA ? '<a href="panel.html">Ir al examen oficial</a>' : '<a href="panel.html?s=prueba">Ir al examen de ensayo</a>'}</p><div id="control"></div></div>
      <div id="alertas"></div>
      <div class="tarjeta oculto"><span class="etq">Llegaron tarde</span><div id="tarde"></div></div>
      <div class="tarjeta"><span class="etq">Estudiantes</span><p class="mp-nota">Toca un nombre para ver sus salidas de la página y sus respuestas.</p>
        <label class="campo"><span>Buscar por código (3 cifras)</span><input id="buscar-cod" type="search" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="Ej.: 298" value="${filtroCod}"></label>
        <p class="mp-nota" id="buscado"></p><div id="lista"></div></div>
      ${PRUEBA ? '<div class="tarjeta"><span class="etq">Ensayo</span><p class="mp-nota">Deja el ensayo como nuevo: borra registros, respuestas y notas.</p><button class="boton" id="b-reiniciar" style="color:var(--mal);border-color:var(--mal)">Reiniciar el ensayo y borrar sus datos</button></div>' : ''}
      <div class="tarjeta"><button class="boton" id="b-salir">Salir</button></div>`;
    $('#b-salir').onclick = async () => { await II.sb.auth.signOut(); location.reload(); };
    $('#buscar-cod').oninput = (e) => { filtroCod = e.target.value.replace(/\D/g, '').slice(0, 3); pintarListas(); };
    const br = $('#b-reiniciar');
    if (br) dobleToque(br, 'Toca otra vez para borrar todo el ensayo', async () => {
      await Promise.all([II.sb.from('respuestas').delete().eq('sesion', SID), II.sb.from('ingresos').delete().eq('sesion', SID)]);
      await II.sb.from('estado_sesion').update({ extra: { notas: {} } }).eq('sesion', SID + '-notas');
      const { error } = await II.sb.from('estado_sesion').update({ extra: { asincrona: true, abre: null, cierra: null }, actualizado: new Date().toISOString() }).eq('sesion', SID);
      aviso(error ? 'No se pudo reiniciar.' : 'Ensayo reiniciado.', error ? 'mal' : 'ok');
      await leerEstado();
      await cargarDatos(true);
      vPanel();
    });
    pintarControl(true);
    pintarListas();
  }

  let tLento = null, tRapido = null;
  async function arrancar() {
    $('#cont').innerHTML = '<div class="tarjeta"><p>Cargando…</p></div>';
    await sincronizarHora();
    await leerEstado();
    await cargarDatos(true);
    vPanel();
    clearInterval(tLento); clearInterval(tRapido);
    // estado: rápido con el QR abierto (para cambiarlo apenas alguien lo escanea)
    tRapido = setInterval(async () => {
      if (qrAbierto) {
        await leerEstado();
        if (ex.token !== tokenVisto) {
          tokenVisto = ex.token;
          await cargarDatos(false);
          pintarQR('✓ Escaneado. QR nuevo listo');
        }
      }
      const r = $('#reloj');
      if (r && ex.fin) r.textContent = mmss((Date.parse(ex.fin) - ahora()) / 1000);
      pintarControl();
    }, 1000);
    tLento = setInterval(async () => {
      await leerEstado();
      await cargarDatos(false);
      if (qrAbierto) pintarQR('');
      else pintarControl();
    }, 8000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { sincronizarHora(); leerEstado().then(pintarControl); } });
  }

  II.alCambiarConexion((ok) => { const d = $('#e-con'); d.classList.toggle('on', ok); d.classList.toggle('off', !ok); });
  (async () => {
    if (!II.sb) { $('#cont').innerHTML = '<div class="tarjeta"><div class="aviso mal">No se pudo conectar con la base de datos. Revisa internet y recarga.</div></div>'; return; }
    const { data } = await II.sb.auth.getSession();
    if (data && data.session && (await esDocente())) arrancar();
    else vIngreso();
  })();
})();
