// ============================================================
// Electrónica Digital 1 — vista del estudiante (celular vertical).
// Sigue el paso que marca el docente. ?modo=libre → repaso sin registro.
// ============================================================
(function () {
  'use strict';
  const $ = II.$, $$ = II.$$, K = D1.k, E = D1.EJERCICIOS;
  const S = D1.SESIONES[II.params.get('s')] || D1.SESIONES['d1-c3'];
  const SID = S.id;
  const LIBRE = II.params.get('modo') === 'libre';
  const K_AL = 'd1-alumno-' + SID;
  const LETRAS = 'ABCDE';

  let alumno = II.leer(K_AL, null);
  if (LIBRE && !alumno) {
    alumno = II.leer('d1-libre-al', null) || { nombre: 'Repaso', carnet: 'libre' + Math.floor(Math.random() * 1e6) };
    II.guardar('d1-libre-al', alumno);
  }
  let fila = null, recibido = 0, libreIdx = 0, diag = null, montado = '', cuentaT = null;
  const elegida = {};
  const semilla = II.leer('d1-semilla-' + SID, {});
  let resp = {};
  const kResp = () => (LIBRE ? 'd1-libre-' : 'd1-resp-') + SID + '-' + alumno.carnet;
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
  const datos = (p) => D1.datosDe(p.ejercicio, alumno.carnet, semilla[p.id] || 0);
  // los puntos se muestran cuando la actividad ya se cerró o la clase pasó a otro paso
  const puntosTotales = () => Object.entries(resp).reduce((a, [id, r]) => a + (r.visto || (alumno && id !== pasoActual().id) ? Number(r.puntos) || 0 : 0), 0);

  // ---------------- barra ----------------
  function barra() {
    $('#e-nombre').textContent = alumno ? (LIBRE ? 'Repaso libre' : alumno.nombre) : S.titulo;
    $('#e-pts').textContent = II.fmt(puntosTotales(), 1) + ' pts';
    $('#e-pts').classList.toggle('oculto', !alumno);
  }

  // ---------------- ingreso ----------------
  function vistaIngreso() {
    $('#cont').innerHTML = tarjeta('<span class="etq">' + II.esc(S.materia) + '</span><h2>' + II.esc(S.titulo) + '</h2>' +
      '<p>Entra con tu nombre y carnet. Tus ejercicios tendrán datos propios y tus puntos cuentan para prácticas.</p>' +
      '<form id="f-ingreso">' +
      '<label class="campo"><span>Nombre y apellido</span><input name="nombre" required minlength="3" maxlength="80" autocomplete="name"></label>' +
      '<label class="campo"><span>Carnet universitario</span><input name="carnet" required minlength="3" maxlength="20" inputmode="numeric" autocomplete="off"></label>' +
      '<label class="campo"><span>Carrera</span><select name="carrera"><option>Ingeniería Electrónica</option><option>Ingeniería Mecatrónica</option><option>Ingeniería Eléctrica</option><option>Otra</option></select></label>' +
      '<button class="boton prim bloque">Entrar a la clase</button></form>');
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
  const tarjeta = (h) => '<div class="tarjeta">' + h + '</div>';
  const mira = (t) => '<p class="mira"><span class="icono">📺</span>' + (t || 'Mira la pantalla') + '</p>';
  function quitarDiag() { if (diag) { diag.destruir(); diag = null; } }
  function navLibre() {
    if (!LIBRE) return '';
    return '<div class="nav-libre"><button class="boton" id="l-ant" ' + (libreIdx === 0 ? 'disabled' : '') + '>◀ Anterior</button><span>' + (libreIdx + 1) + '/' + S.pasos.length + '</span>' +
      '<button class="boton" id="l-sig" ' + (libreIdx === S.pasos.length - 1 ? 'disabled' : '') + '>Siguiente ▶</button></div>';
  }
  function enlazarNav() {
    if (!LIBRE) return;
    $('#l-ant').onclick = () => { libreIdx--; II.guardar('d1-libre-idx', libreIdx); render(true); window.scrollTo(0, 0); };
    $('#l-sig').onclick = () => { libreIdx++; II.guardar('d1-libre-idx', libreIdx); render(true); window.scrollTo(0, 0); };
  }

  // ---------------- vistas por tipo ----------------
  function vInicio() {
    $('#cont').innerHTML = navLibre() + tarjeta('<span class="etq">Conectado</span><h2>¡Listo, ' + II.esc(alumno.nombre.split(' ')[0]) + '!</h2>' +
      (LIBRE ? '<p>Recorre la clase a tu ritmo. Nada se registra.</p>' : mira('Mira la pantalla: la clase empieza pronto.')));
  }

  // explorar un diagrama en el propio celular
  function explorarMapa(zona) {
    const caja = document.createElement('div');
    caja.innerHTML = '<div class="row" style="gap:8px;margin-bottom:8px"><button class="boton" data-nv="3">3 variables</button><button class="boton" data-nv="4">4 variables</button><button class="boton prim" data-v>¿Está bien?</button></div><div class="zona-ed"></div><div class="res-ex"></div>';
    zona.appendChild(caja);
    let nv = 3, ed = null;
    const nuevo = (n) => {
      nv = n;
      if (ed) ed.destruir();
      ed = K.editor(caja.querySelector('.zona-ed'), { nv, conX: nv === 4 });
      caja.querySelector('.res-ex').innerHTML = '';
    };
    caja.addEventListener('click', (e) => {
      const b = e.target.closest('[data-nv]');
      if (b) return nuevo(+b.dataset.nv);
      if (e.target.closest('[data-v]')) {
        const st = ed.estado(), sol = K.resolver(nv, st.vals);
        const eq = st.grupos.length && K.equivale(nv, st.grupos, st.vals);
        const min = eq && st.grupos.length === sol.cubos.length && K.lits(st.grupos) === sol.lits;
        caja.querySelector('.res-ex').innerHTML = !st.vals.includes(1) ? '<div class="aviso info">Primero pon algunos unos en el mapa.</div>'
          : min ? '<div class="aviso ok">¡Correcto y mínimo!</div>'
            : eq ? '<div class="aviso duda">Correcto, pero no es la mínima. Mínima: ' + K.expr(sol.cubos, nv) + '</div>'
              : '<div class="aviso mal">Tus grupos todavía no cubren justo los unos.</div>';
      }
    });
    nuevo(3);
    return { destruir: () => { if (ed) ed.destruir(); caja.remove(); } };
  }

  function vExplica(p) {
    $('#cont').innerHTML = navLibre() + tarjeta('<span class="etq">Explicación</span><h2>' + p.titulo + '</h2>' +
      (p.idea ? '<p class="idea-est">' + p.idea + '</p>' : '') + (LIBRE ? '' : mira()) +
      (p.explorar ? '<button class="boton bloque" id="b-explorar">' + (LIBRE ? 'Abrir el diagrama' : 'Explorar en mi celular') + '</button>' : '') +
      '<div id="zona-dg" style="margin-top:12px"></div>');
    const b = $('#b-explorar');
    if (b) b.onclick = () => {
      b.remove();
      quitarDiag();
      diag = p.explorar === 'bomba' ? D1.diag.bomba($('#zona-dg'), { botonesFalla: true, celular: true }) : explorarMapa($('#zona-dg'));
    };
  }

  function vRapida(p) {
    const fz = faseDe(p), r = resp[p.id];
    if (fz === 'preparado') {
      $('#cont').innerHTML = navLibre() + tarjeta('<span class="etq">' + p.titulo + ' · 1 punto</span><h2>Espera la pregunta…</h2>' + mira('Aparecerá aquí cuando el docente la habilite.'));
      return;
    }
    const orden = II.mezclar(II.rng(alumno.carnet + '|' + p.id), p.o.map((_, k) => k));
    const cerrado = fz === 'cerrado';
    const ops = orden.map((k) => {
      let cls = '';
      if (cerrado) cls = k === p.c ? 'correcta' : r && r.opcion === k ? 'errada' : '';
      else if ((r && r.opcion === k) || elegida[p.id] === k) cls = 'elegida';
      return '<button class="opcion-est ' + cls + '" data-k="' + k + '" ' + (r || cerrado ? 'disabled' : '') + '><span class="letra">' + LETRAS[k] + '</span><span>' + p.o[k] + '</span></button>';
    }).join('');
    let pie = '';
    if (cerrado) {
      if (r) { r.visto = true; guardarResp(); }
      pie = (!r ? '<div class="aviso duda">No respondiste esta pregunta.</div>' : r.ok ? '<div class="aviso ok">¡Correcto! +1 punto</div>' : '<div class="aviso mal">No era esa. Mira la correcta en verde.</div>') +
        (p.por ? '<p class="idea-est">' + p.por + '</p>' : '');
    } else if (r) pie = '<div class="aviso info">Enviado ✓ — espera a que se cierre.</div>';
    else pie = '<button class="boton prim bloque" id="b-enviar" ' + (elegida[p.id] == null ? 'disabled' : '') + '>Enviar</button>';
    $('#cont').innerHTML = navLibre() + tarjeta('<span class="etq">' + p.titulo + ' · 1 punto</span><h2>' + p.t + '</h2>' +
      (p.fig ? mira('Mira la figura en la pantalla.') : '') + '<div class="opciones-est">' + ops + '</div><div style="margin-top:12px">' + pie + '</div>');
    $$('.opcion-est').forEach((bt) => {
      bt.onclick = () => {
        elegida[p.id] = Number(bt.dataset.k);
        $$('.opcion-est').forEach((x) => x.classList.toggle('elegida', x === bt));
        const e = $('#b-enviar'); if (e) e.disabled = false;
      };
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
    if (!LIBRE) await II.enviar({ sesion: SID, actividad: p.id, carnet: alumno.carnet, nombre: alumno.nombre, respuesta: { opcion: k, auto: auto || undefined }, correcta: ok, intento: 1, puntaje: ok ? 1 : 0 });
    render(true);
  }

  function vEjercicio(p) {
    const ej = E[p.ejercicio], fz = faseDe(p), r = resp[p.id], d = datos(p);
    const cab = '<span class="etq">Ejercicio · ' + ej.puntos + ' puntos</span><h2>' + ej.titulo + '</h2>';
    if (fz === 'preparado') { $('#cont').innerHTML = navLibre() + tarjeta(cab + mira('El docente lo habilitará en un momento.')); return; }
    if (fz === 'cerrado') {
      if (r) { r.visto = true; guardarResp(); }
      const ev = r && !r.vacio ? ej.evaluar(r.estado, d) : null;
      const cls = !ev ? 'duda' : ev.puntos >= ej.puntos ? 'ok' : ev.puntos > 0 ? 'duda' : 'mal';
      const msg = !ev ? 'No enviaste respuesta.' : (ev.puntos >= ej.puntos ? '¡Correcto! ' : ev.puntos > 0 ? 'Casi. ' : 'Incorrecto. ') + '+' + II.fmt(ev.puntos, 1) + ' pts';
      $('#cont').innerHTML = navLibre() + tarjeta(cab + '<div class="aviso ' + cls + '">' + msg + (ev ? '<br><span style="font-weight:500">' + ev.texto + '</span>' : '') + '</div>' +
        '<p class="etq">Solución con tus datos</p>' + ej.solucion(d).html +
        (r && !r.vacio ? '<p class="etq mi-res">Tu respuesta</p>' + ej.vista(r.estado, d) : '') +
        (LIBRE ? '<button class="boton bloque" id="v-otra" style="margin-top:12px">Otra vez (datos nuevos)</button>' : ''));
      if (LIBRE) $('#v-otra').onclick = () => { semilla[p.id] = (semilla[p.id] || 0) + 1; II.guardar('d1-semilla-' + SID, semilla); delete resp[p.id]; guardarResp(); render(true); };
      barra();
      return;
    }
    if (r) { $('#cont').innerHTML = navLibre() + tarjeta(cab + '<div class="aviso info">Enviado ✓ — tu respuesta quedó registrada.</div>' + mira('Espera la revisión en la pantalla.')); return; }
    // abierto: trabaja con sus propios datos
    const kB = 'd1-borr-' + SID + '-' + p.id + '-' + alumno.carnet;
    $('#cont').innerHTML = navLibre() + tarjeta(cab + ej.enunciado(d) + '<div id="zona-dg"></div><button class="boton prim bloque" id="b-enviar" style="margin-top:14px">Enviar mi respuesta</button>');
    quitarDiag();
    diag = ej.montar($('#zona-dg'), d);
    const borr = II.leer(kB, null);
    if (borr) diag.fijar(borr);
    diag.alCambiar(() => II.guardar(kB, diag.estado()));
    $('#b-enviar').onclick = () => enviarEjercicio(p);
  }
  async function enviarEjercicio(p, auto) {
    if (resp[p.id] || !diag || !diag.estado) return;
    const ej = E[p.ejercicio], d = datos(p);
    const est = diag.estado(), mov = diag.movimientos();
    const vacio = !!auto && mov === 0;
    const ev = ej.evaluar(est, d);
    const puntos = vacio ? 0 : ev.puntos;
    resp[p.id] = { estado: est, ok: !vacio && ev.ok, puntos, vacio, visto: LIBRE };
    guardarResp();
    if (!LIBRE) {
      await II.enviar({
        sesion: SID, actividad: p.id, carnet: alumno.carnet, nombre: alumno.nombre,
        respuesta: { estado: est, valor: ev.valor, mov, seg: diag.segundos(), auto: auto || undefined, vacio: vacio || undefined },
        correcta: !vacio && ev.ok, intento: 1, puntaje: puntos
      });
    }
    render(true);
  }

  function vCierre() {
    const ult = S.pasos[S.pasos.length - 1];
    $('#cont').innerHTML = navLibre() + tarjeta('<span class="etq">Cierre</span><h2>¡Gracias, ' + II.esc(alumno.nombre.split(' ')[0]) + '!</h2>' +
      '<p>Hoy sumaste <b>' + II.fmt(puntosTotales(), 1) + ' puntos</b>.</p><p class="idea-est">' + ult.idea + '</p>' +
      (LIBRE ? '' : '<p>Puedes repasar todo por tu cuenta (sin puntaje): <a href="clase.html?s=' + SID + '&modo=libre">modo repaso</a>.</p>'));
  }

  // ---------------- envío automático (cierre o cambio de paso) ----------------
  function autoEnviar(p, motivo) {
    if (!p || resp[p.id] || LIBRE) return;
    if (p.tipo === 'rapida' && elegida[p.id] != null) enviarRapida(p, motivo);
    if (p.tipo === 'ejercicio' && diag && diag.estado) {
      if (diag.movimientos() > 0 || motivo === 'cierre') enviarEjercicio(p, motivo);
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
      c.textContent = r > 0 ? 'Se cierra en ' + r + ' s — se enviará lo que tengas' : 'Enviando…';
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
      quitarDiag();
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
    if (LIBRE) { libreIdx = Math.min(S.pasos.length - 1, II.leer('d1-libre-idx', 0) || 0); render(true); return; }
    $('#cont').innerHTML = tarjeta('<p>Conectando con la clase…</p>');
    if (!II.sb) { $('#cont').innerHTML = tarjeta('<div class="aviso mal">No se pudo conectar. Revisa tus datos móviles y recarga.</div>'); return; }
    II.seguirEstado(SID, (f) => { fila = f; recibido = Date.now(); render(false); });
  }

  II.alCambiarConexion((ok) => { const d = $('#e-con'); d.classList.toggle('on', ok); d.classList.toggle('off', !ok); });
  if (alumno) arrancar(); else { barra(); vistaIngreso(); }
})();
