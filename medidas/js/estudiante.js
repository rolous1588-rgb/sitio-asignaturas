// ============================================================
// Vista del estudiante (celular vertical). Sigue el paso del docente.
// ?modo=libre → repaso por su cuenta, sin registrar nada.
// ============================================================
(function () {
  const $ = II.$;
  const S = FP.SESIONES[II.params.get('s')] || FP.SESIONES['me-fp1'];
  const SID = S.id;
  const LIBRE = II.params.get('modo') === 'libre';
  const K_AL = 'me-alumno-' + SID;
  const LETRAS = ['A', 'B', 'C', 'D', 'E'];

  let alumno = II.leer(K_AL, null);
  if (LIBRE && !alumno) {
    alumno = II.leer('me-libre-al', null) || { nombre: 'Repaso', carnet: 'libre' + Math.floor(Math.random() * 1e6) };
    II.guardar('me-libre-al', alumno);
  }
  let fila = null;
  let recibido = 0;
  let libreIdx = 0;
  let diag = null;
  let montado = '';
  let elegida = {};
  let cuentaT = null;
  let semilla = II.leer('me-semilla-' + SID, {});
  let resp = {};
  const kResp = () => (LIBRE ? 'me-libre-' : 'me-resp-') + SID + '-' + alumno.carnet;
  const guardarResp = () => II.guardar(kResp(), resp);

  const pasoActual = () => {
    if (LIBRE) return S.pasos[libreIdx];
    const i = fila ? S.pasos.findIndex((p) => p.id === fila.paso) : 0;
    return S.pasos[Math.max(0, i)];
  };
  const faseDe = (p) => {
    if (LIBRE) return resp[p.id] ? 'cerrado' : 'abierto';
    const ex = (fila && fila.extra) || {};
    if (ex.cerrado === p.id) return 'cerrado';
    if (ex.abierto === p.id) return ex.fin ? 'cerrando' : 'abierto';
    return 'preparado';
  };
  const datos = (p) => {
    const extraSem = semilla[p.id] ? '|' + semilla[p.id] : '';
    return FP.EJERCICIOS[p.ejercicio].generar(II.rng(alumno.carnet + '|' + p.ejercicio + extraSem));
  };
  const puntosTotales = () => Object.entries(resp).reduce((a, [id, r]) => a + (r.visto ? Number(r.puntos) || 0 : 0), 0);

  // ---------------- barra ----------------
  function barra() {
    $('#e-nombre').textContent = alumno ? (LIBRE ? 'Repaso libre' : alumno.nombre) : 'Factor de potencia';
    $('#e-pts').textContent = puntosTotales() + ' pts';
    $('#e-pts').classList.toggle('oculto', !alumno);
  }

  // ---------------- ingreso ----------------
  function vistaIngreso() {
    $('#cont').innerHTML = `<div class="tarjeta">
      <span class="etq">${II.esc(S.materia)}</span>
      <h2>${II.esc(S.titulo)}</h2>
      <p>Entra con tu nombre y carnet. Tus ejercicios tendrán datos propios.</p>
      <form id="f-ingreso">
        <label class="campo"><span>Nombre y apellido</span><input name="nombre" required minlength="3" maxlength="80" autocomplete="name"></label>
        <label class="campo"><span>Carnet universitario</span><input name="carnet" required minlength="3" maxlength="20" inputmode="numeric" autocomplete="off"></label>
        <label class="campo"><span>Carrera</span><select name="carrera"><option>Ingeniería Eléctrica</option><option>Ingeniería Electrónica</option><option>Ingeniería Biomédica</option><option>Otra</option></select></label>
        <button class="boton prim bloque">Entrar a la clase</button>
      </form></div>`;
    $('#f-ingreso').onsubmit = async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      alumno = { nombre: String(fd.get('nombre')).trim(), carnet: String(fd.get('carnet')).trim().replace(/\s+/g, ''), info: { carrera: fd.get('carrera') } };
      II.guardar(K_AL, alumno);
      resp = II.leer(kResp(), {});
      ev.target.querySelector('button').disabled = true;
      await II.registrarIngreso(SID, alumno);
      arrancar();
    };
  }

  // ---------------- piezas ----------------
  const tarjeta = (html) => `<div class="tarjeta">${html}</div>`;
  const mira = (t = 'Mira la pantalla') => `<p class="mira"><span class="icono">📺</span>${t}</p>`;

  function montarDiagrama(cont, nombre, opc) {
    if (diag) { diag.destruir(); diag = null; }
    diag = FP.diagramas[nombre](cont, { ...opc, animar: true });
    return diag;
  }

  function navLibre() {
    if (!LIBRE) return '';
    return `<div class="nav-libre"><button class="boton" id="l-ant" ${libreIdx === 0 ? 'disabled' : ''}>◀ Anterior</button><span>${libreIdx + 1}/${S.pasos.length}</span><button class="boton" id="l-sig" ${libreIdx === S.pasos.length - 1 ? 'disabled' : ''}>Siguiente ▶</button></div>`;
  }
  function enlazarNav() {
    if (!LIBRE) return;
    $('#l-ant').onclick = () => { libreIdx--; II.guardar('me-libre-idx', libreIdx); render(true); window.scrollTo(0, 0); };
    $('#l-sig').onclick = () => { libreIdx++; II.guardar('me-libre-idx', libreIdx); render(true); window.scrollTo(0, 0); };
  }

  // ---------------- vistas por tipo ----------------
  function vInicio(p) {
    $('#cont').innerHTML = navLibre() + tarjeta(`<span class="etq">Conectado</span><h2>¡Listo, ${II.esc(alumno.nombre.split(' ')[0])}!</h2>${LIBRE ? '<p>Recorre la clase a tu ritmo. Nada se registra.</p>' : mira('Mira la pantalla: la clase empieza pronto.')}`);
  }

  function vExplica(p) {
    $('#cont').innerHTML = navLibre() + tarjeta(`<span class="etq">Explicación</span><h2>${II.esc(p.titulo)}</h2>
      <p class="idea-est">${II.esc(p.idea || '')}</p>${LIBRE ? '' : mira()}
      <button class="boton bloque" id="b-explorar">${LIBRE ? 'Abrir el diagrama' : 'Explorar en mi celular'}</button><div id="zona-dg" style="margin-top:12px"></div>`);
    $('#b-explorar').onclick = (ev) => {
      ev.target.remove();
      montarDiagrama($('#zona-dg'), p.diagrama, { inicial: p.inicial, params: p.params });
    };
  }

  function vRapida(p) {
    const fz = faseDe(p);
    const r = resp[p.id];
    if (fz === 'preparado') {
      $('#cont').innerHTML = navLibre() + tarjeta(`<span class="etq">Predicción · 1 punto</span><h2>Espera la pregunta…</h2>${mira('Aparecerá aquí cuando el docente la habilite.')}`);
      return;
    }
    const orden = II.mezclar(II.rng(alumno.carnet + '|' + p.id), p.o.map((_, k) => k));
    const cerrado = fz === 'cerrado';
    const ops = orden.map((k, j) => {
      let cls = '';
      if (cerrado) cls = k === p.c ? 'correcta' : r && r.opcion === k ? 'errada' : '';
      else if ((r && r.opcion === k) || elegida[p.id] === k) cls = 'elegida';
      return `<button class="opcion-est ${cls}" data-k="${k}" ${r || cerrado ? 'disabled' : ''}><span class="letra">${LETRAS[k]}</span><span>${II.esc(p.o[k])}</span></button>`;
    }).join('');
    let pie = '';
    if (cerrado) {
      if (r) { r.visto = true; guardarResp(); }
      pie = !r ? '<div class="aviso duda">No respondiste esta pregunta.</div>'
        : r.ok ? '<div class="aviso ok">¡Correcto! +1 punto</div>' : '<div class="aviso mal">No era esa. Mira la correcta en verde.</div>';
    } else if (r) pie = '<div class="aviso info">Enviado ✓ — espera a que se cierre.</div>';
    else pie = `<button class="boton prim bloque" id="b-enviar" ${elegida[p.id] == null ? 'disabled' : ''}>Enviar</button>`;
    $('#cont').innerHTML = navLibre() + tarjeta(`<span class="etq">Predicción · 1 punto</span><h2>${II.esc(p.t)}</h2><div class="opciones-est">${ops}</div><div style="margin-top:12px">${pie}</div>`);
    II.$$('.opcion-est').forEach((bt) => {
      bt.onclick = () => { elegida[p.id] = Number(bt.dataset.k); II.$$('.opcion-est').forEach((x) => x.classList.toggle('elegida', x === bt)); const e = $('#b-enviar'); if (e) e.disabled = false; };
    });
    const be = $('#b-enviar');
    if (be) be.onclick = () => enviarRapida(p);
    barra();
  }

  async function enviarRapida(p, auto) {
    const k = elegida[p.id];
    if (k == null || resp[p.id]) return;
    const ok = k === p.c;
    resp[p.id] = { opcion: k, ok, puntos: ok ? 1 : 0, visto: LIBRE };
    guardarResp();
    if (!LIBRE) {
      await II.enviar({ sesion: SID, actividad: p.id, carnet: alumno.carnet, nombre: alumno.nombre, respuesta: { opcion: k, auto: auto || undefined }, correcta: ok, intento: 1, puntaje: ok ? 1 : 0 });
    }
    render(true);
  }

  function vEjercicio(p) {
    const ej = FP.EJERCICIOS[p.ejercicio];
    const fz = faseDe(p);
    const r = resp[p.id];
    const d = datos(p);
    const cab = `<span class="etq">Ejercicio · ${ej.puntos} puntos</span><h2>${II.esc(ej.titulo)}</h2>`;
    if (fz === 'preparado') {
      $('#cont').innerHTML = navLibre() + tarjeta(cab + mira('El docente lo habilitará en un momento.'));
      return;
    }
    if (fz === 'cerrado') {
      if (r) { r.visto = true; guardarResp(); }
      const ev = r && !r.vacio ? ej.evaluar(r.estado, d) : null;
      const sol = ej.solucion(d);
      const cls = !ev ? 'duda' : ev.puntos >= ej.puntos ? 'ok' : ev.puntos > 0 ? 'duda' : 'mal';
      const msg = !ev ? 'No enviaste respuesta.' : (ev.puntos >= ej.puntos ? '¡Correcto! ' : ev.puntos > 0 ? 'Casi. ' : 'Incorrecto. ') + '+' + ev.puntos + ' pts';
      $('#cont').innerHTML = navLibre() + tarjeta(cab + `<p>${ej.enunciado(d)}</p>
        <div class="aviso ${cls}">${msg}${ev ? '<br><span style="font-weight:500">' + ev.texto + '</span>' : ''}</div>
        <div class="solucion-est">${sol.pasos.map((x) => '<p>' + x + '</p>').join('')}</div>
        <div class="dg-botones" style="margin:12px 0"><button class="dg-boton" id="v-mia">Mi respuesta</button><button class="dg-boton" id="v-sol">Solución</button>${LIBRE ? '<button class="dg-boton" id="v-otra">Otra vez (datos nuevos)</button>' : ''}</div>
        <div id="zona-dg"></div>`);
      const o = ej.opciones(d);
      const verMia = () => montarDiagrama($('#zona-dg'), ej.diagrama, { ...o, inicial: { ...(o.inicial || {}), ...(ej.tipo === 'numerico' ? {} : (r && r.estado) || {}) }, revelado: true });
      const verSol = () => montarDiagrama($('#zona-dg'), ej.diagrama, { ...o, inicial: { ...(o.inicial || {}), ...sol.estado }, revelado: true });
      $('#v-mia').onclick = verMia;
      $('#v-sol').onclick = verSol;
      if (LIBRE) $('#v-otra').onclick = () => { semilla[p.id] = (semilla[p.id] || 0) + 1; II.guardar('me-semilla-' + SID, semilla); delete resp[p.id]; guardarResp(); render(true); };
      if (r && !r.vacio && ej.tipo !== 'numerico') verMia(); else verSol();
      barra();
      return;
    }
    if (r) {
      $('#cont').innerHTML = navLibre() + tarjeta(cab + '<div class="aviso info">Enviado ✓ — tu respuesta quedó registrada.</div>' + mira('Espera la revisión en la pantalla.'));
      return;
    }
    // abierto: trabaja en su propio diagrama
    const borr = II.leer('me-borr-' + SID + '-' + p.id + '-' + alumno.carnet, null);
    const campos = ej.tipo === 'numerico'
      ? `<div class="campos-num">${ej.campos.map((c) => `<label class="campo"><span>${c.etiqueta}${c.unidad ? ' (' + c.unidad + ')' : ''}</span><input data-c="${c.id}" inputmode="decimal" autocomplete="off" value="${II.esc((borr && borr[c.id]) || '')}"></label>`).join('')}</div>` : '';
    $('#cont').innerHTML = navLibre() + tarjeta(cab + `<p>${ej.enunciado(d)}</p><div id="zona-dg"></div>${campos}
      <button class="boton prim bloque" id="b-enviar" style="margin-top:12px">Enviar mi respuesta</button>`);
    const o = ej.opciones(d);
    const dg = montarDiagrama($('#zona-dg'), ej.diagrama, { ...o, inicial: { ...(o.inicial || {}), ...(ej.tipo !== 'numerico' && borr ? borr : {}) } });
    const guardarBorr = () => II.guardar('me-borr-' + SID + '-' + p.id + '-' + alumno.carnet, ej.tipo === 'numerico' ? leerCampos() : dg.estado());
    dg.alCambiar(guardarBorr);
    II.$$('[data-c]').forEach((inp) => inp.addEventListener('input', guardarBorr));
    $('#b-enviar').onclick = () => enviarEjercicio(p);
  }

  const leerCampos = () => {
    const v = {};
    II.$$('[data-c]').forEach((inp) => { v[inp.dataset.c] = inp.value.trim(); });
    return v;
  };

  async function enviarEjercicio(p, auto) {
    if (resp[p.id]) return;
    const ej = FP.EJERCICIOS[p.ejercicio];
    const d = datos(p);
    const numerico = ej.tipo === 'numerico';
    if (!numerico && !diag) return;
    const est = numerico ? leerCampos() : diag.estado();
    const mov = diag ? diag.movimientos() : 0;
    const vacio = numerico ? !(est.fp || est.bs) : auto && mov === 0;
    const ev = ej.evaluar(est, d);
    const puntos = vacio ? 0 : ev.puntos;
    resp[p.id] = { estado: est, ok: !vacio && ev.ok, puntos, vacio, visto: LIBRE };
    guardarResp();
    if (!LIBRE) {
      await II.enviar({
        sesion: SID, actividad: p.id, carnet: alumno.carnet, nombre: alumno.nombre,
        respuesta: { estado: est, valor: ev.valor, mov, seg: diag ? diag.segundos() : 0, auto: auto || undefined, vacio: vacio || undefined },
        correcta: !vacio && ev.ok, intento: 1, puntaje: puntos
      });
    }
    render(true);
  }

  function vCierre() {
    $('#cont').innerHTML = navLibre() + tarjeta(`<span class="etq">Cierre</span><h2>¡Gracias, ${II.esc(alumno.nombre.split(' ')[0])}!</h2>
      <p>Hoy sumaste <b>${puntosTotales()} puntos</b>.</p><p class="idea-est">${II.esc(S.pasos[S.pasos.length - 1].idea)}</p>
      ${LIBRE ? '' : `<p>Puedes repasar todo por tu cuenta (sin puntaje): <a href="clase.html?s=${SID}&modo=libre">modo repaso</a>.</p>`}`);
  }

  // ---------------- envío automático (cierre o cambio de paso) ----------------
  function autoEnviar(p, motivo) {
    if (!p || resp[p.id] || LIBRE) return;
    if (p.tipo === 'rapida' && elegida[p.id] != null) enviarRapida(p, motivo);
    if (p.tipo === 'ejercicio') {
      const ej = FP.EJERCICIOS[p.ejercicio];
      const tocado = ej.tipo === 'numerico' ? II.$$('[data-c]').some((i) => i.value.trim()) : diag && diag.movimientos() > 0;
      if (tocado || motivo === 'cierre') enviarEjercicio(p, motivo);
    }
  }

  function vigilarCuenta(p) {
    clearInterval(cuentaT);
    const c = $('#cuenta');
    c.classList.add('oculto');
    const ex = (fila && fila.extra) || {};
    if (LIBRE || faseDe(p) !== 'cerrando' || resp[p.id]) return;
    const seg = Number(ex.seg) || 12;
    const fin = Math.min(new Date(ex.fin).getTime() || Infinity, recibido + seg * 1000);
    const tic = () => {
      const r = Math.max(0, Math.ceil((fin - Date.now()) / 1000));
      c.textContent = r > 0 ? `Se cierra en ${r} s — se enviará lo que tengas` : 'Enviando…';
      c.classList.remove('oculto');
      if (r <= 0) { clearInterval(cuentaT); autoEnviar(p, 'cierre'); c.classList.add('oculto'); }
    };
    tic();
    cuentaT = setInterval(tic, 250);
  }

  // ---------------- render ----------------
  let pasoPrevio = null;
  function render(forzar) {
    if (!alumno) return vistaIngreso();
    const p = pasoActual();
    if (pasoPrevio && pasoPrevio.id !== p.id) autoEnviar(pasoPrevio, 'avance');
    pasoPrevio = p;
    const fz = faseDe(p);
    const clave = p.id + '|' + (fz === 'cerrando' ? 'abierto' : fz) + '|' + (resp[p.id] ? 'r' : '');
    if (forzar || clave !== montado) {
      montado = clave;
      if (diag) { diag.destruir(); diag = null; }
      if (p.tipo === 'inicio') vInicio(p);
      else if (p.tipo === 'explica') vExplica(p);
      else if (p.tipo === 'rapida') vRapida(p);
      else if (p.tipo === 'ejercicio') vEjercicio(p);
      else vCierre(p);
      enlazarNav();
    }
    vigilarCuenta(p);
    barra();
  }

  function arrancar() {
    resp = II.leer(kResp(), {});
    barra();
    if (LIBRE) { libreIdx = Math.min(S.pasos.length - 1, II.leer('me-libre-idx', 0) || 0); render(true); return; }
    $('#cont').innerHTML = tarjeta('<p>Conectando con la clase…</p>');
    if (!II.sb) { $('#cont').innerHTML = tarjeta('<div class="aviso mal">No se pudo conectar. Revisa tus datos móviles y recarga.</div>'); return; }
    II.seguirEstado(SID, (f) => { fila = f; recibido = Date.now(); render(false); });
  }

  II.alCambiarConexion((ok) => { const d = $('#e-con'); d.classList.toggle('on', ok); d.classList.toggle('off', !ok); });
  if (alumno) arrancar(); else { barra(); vistaIngreso(); }
})();
