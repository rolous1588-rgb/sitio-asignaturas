// ============================================================
// Examen desde el celular (estudiante) · Transformadas
// Fases (estado_sesion.extra): sin «abre» = espera · abre…fin = en curso · después de «fin» = cerrado
//   extra = { asincrona: true, abre, fin, cierra, minutos, cortado? }  (fin = lo que ve el reloj; cierra = fin + 20 s de margen de red)
// Envíos: ingreso · eval-inicio · eval-avance (copia automática) · eval (una sola vez)
// Registro de salidas: veces que la página quedó oculta (otra app, bloqueo, pantalla apagada),
//   tiempo fuera, pérdidas de foco sin salir, cambios de respuesta ≤ 30 s después de volver, recargas.
// ============================================================
(function () {
  const $ = II.$;
  const SID = II.params.get('s') || 'tf-ex1';
  const E = TF.EXAMEN;
  const CONT = $('#cont');
  const K_AL = 'tf-alumno-' + SID;

  let alumno = II.leer(K_AL, null);
  let ex = {};               // estado_sesion.extra
  let filaLeida = false;
  let offset = 0;            // hora del servidor − hora del celular (ms)
  const ahora = () => Date.now() + offset;
  let insts = null;          // preguntas de este carnet
  let vista = '';            // vista pintada (para no repintar mientras escribe)
  let actual = 0;
  let tic = null;

  const kEv = () => 'tf-ev-' + SID + '-' + alumno.carnet;
  const leerEv = () => (alumno ? II.leer(kEv(), null) : null);
  const guardarEv = (ev) => II.guardar(kEv(), ev);
  const disp = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'iPhone' : /Android/.test(navigator.userAgent) ? 'Android' : 'otro';
  const nuevaSal = () => ({ n: 0, seg: 0, max: 0, lista: [], abierta: null, foco: { n: 0, seg: 0 }, cambios: [], pantalla: '—', recargas: 0, disp });

  // ---------- fase del examen ----------
  const fase = () => {
    if (!ex || !ex.abre) return 'espera';
    if (ex.fin && ahora() >= Date.parse(ex.fin)) return 'cerrado';
    return 'curso';
  };
  const restante = () => (ex && ex.fin ? (Date.parse(ex.fin) - ahora()) / 1000 : null);
  const minDesdeInicio = () => (ex && ex.abre ? Math.max(0, Math.round((ahora() - Date.parse(ex.abre)) / 60000)) : 0);

  // ---------- conexión y hora del servidor ----------
  II.alCambiarConexion((ok) => { const d = $('#e-con'); d.classList.toggle('on', ok); d.classList.toggle('off', !ok); });
  async function sincronizarHora() {
    if (!II.sb) return;
    const t0 = Date.now();
    try {
      const { data, error } = await II.sb.rpc('estado_evaluacion', { p_sesion: SID, p_carnet: (alumno && alumno.carnet) || '---' });
      if (error) throw error;
      const d = data && data[0];
      if (d && d.ahora) offset = Date.parse(d.ahora) - (t0 + Date.now()) / 2;
      II.marcarConexion(true);
    } catch (e) { /* se reintenta luego */ }
  }

  const registro = (actividad, respuesta, extra = {}) => ({
    sesion: SID, actividad, carnet: alumno.carnet, nombre: alumno.nombre, respuesta,
    correcta: null, intento: 1, puntaje: 0, ...extra
  });

  // ---------- barra ----------
  function barra() {
    $('#e-nombre').textContent = E.corto + (SID !== 'tf-ex1' ? ' · ' + (E.seccion[SID] || SID) : '');
    const a = $('#e-alumno');
    if (alumno) { a.textContent = alumno.nombre.split(' ')[0]; a.classList.remove('oculto'); } else a.classList.add('oculto');
  }

  // ============================================================
  // VISTAS
  // ============================================================
  function pintar(forzar) {
    barra();
    if (!alumno) return vistaRegistro();
    const fz = fase();
    const ev = leerEv();
    if (!filaLeida) return mostrar('cargando', '<div class="tarjeta"><p>Conectando con el examen…</p></div>');
    if (fz === 'espera') return vistaEspera(forzar);
    if (fz === 'curso') {
      if (ev && ev.enviado) return vistaEnviado(forzar);
      return vistaExamen(forzar);
    }
    // cerrado
    if (ev && ev.iniciado && !ev.enviado) enviarEval('tiempo');
    return vistaCerrado(forzar);
  }
  function mostrar(nombre, html, forzar) {
    if (vista === nombre && !forzar) return false;
    vista = nombre;
    CONT.innerHTML = html;
    window.scrollTo(0, 0);
    return true;
  }

  // ---------- registro ----------
  function vistaRegistro() {
    if (!mostrar('registro', `<div class="tarjeta">
        <span class="etq">${II.esc(E.materia)}</span>
        <h2>${II.esc(E.titulo)}</h2>
        <p>Escribe tus datos <b>exactamente</b> como en tu carnet. No se pueden cambiar después de empezar.</p>
        <form id="f-reg">
          <label class="campo"><span>Nombre y apellido</span><input name="nombre" autocomplete="name" required minlength="3" maxlength="80"></label>
          <label class="campo"><span>Carnet universitario (C.U.)</span><input name="carnet" required minlength="3" maxlength="20" autocomplete="off" autocapitalize="characters"></label>
          <label class="campo"><span>Carrera</span><select name="carrera" required>
            <option value="">Elige…</option><option>Ingeniería Electromecánica</option><option>Ingeniería Biomédica</option><option>Otra</option></select></label>
          <div id="r-msg"></div>
          <button class="boton prim bloque">Entrar al examen</button>
        </form></div>`)) return;
    $('#f-reg').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const nombre = String(fd.get('nombre')).trim().replace(/\s+/g, ' ');
      const carnet = String(fd.get('carnet')).replace(/\s+/g, '').toUpperCase();
      const carrera = String(fd.get('carrera'));
      if (nombre.length < 3 || carnet.length < 3) return;
      const b = e.target.querySelector('button');
      b.disabled = true; b.textContent = 'Entrando…';
      alumno = { nombre, carnet, info: { carrera } };
      II.guardar(K_AL, alumno);
      try { await II.registrarIngreso(SID, alumno); } catch (er) { /* la cola reintenta */ }
      insts = null;
      sincronizarHora();
      pintar(true);
    };
  }

  // ---------- espera ----------
  function vistaEspera(forzar) {
    if (!mostrar('espera', `<div class="tarjeta">
        <span class="etq">${II.esc(E.materia)}</span>
        <h2>${II.esc(E.titulo)}</h2>
        <p class="idea-est"><span class="espera-pulso"></span>Esperando a que el docente inicie el examen…</p>
        <ul class="lista-tf">
          <li><b>${TF.PREGUNTAS.length} preguntas · ${TF.TOTAL} puntos · ${E.minutos} minutos.</b> Cada estudiante tiene sus propios números.</li>
          <li>Resuelve en <b>papel</b>. En el celular solo eliges una opción, escribes números enteros (usa <b>±</b> para el signo) o tocas pasos en orden.</li>
          <li>Puedes usar <b>calculadora física</b> y tu <b>hoja escrita a mano</b>.</li>
          <li><b>No bloquees el celular ni salgas de esta página:</b> cada salida queda registrada para el docente. La pantalla se mantendrá encendida sola.</li>
          <li>Activa <b>«No molestar»</b>: una llamada también cuenta como salida.</li>
          <li>Si se corta el internet, sigue respondiendo: todo se guarda en tu celular y se envía al reconectar.</li>
        </ul></div>
        <div class="tarjeta"><p style="margin:0">Registrado como <b>${II.esc(alumno.nombre)}</b> · C.U. <b>${II.esc(alumno.carnet)}</b></p>
          ${leerEv() ? '' : '<button class="boton" id="b-otro" style="margin-top:10px">No soy yo</button>'}</div>`, forzar)) return;
    const b = $('#b-otro');
    if (b) b.onclick = () => { alumno = null; II.guardar(K_AL, null); insts = null; pintar(true); };
  }

  // ---------- examen en curso ----------
  function asegurarInicio() {
    let ev = leerEv();
    if (!ev) {
      ev = { resp: {}, actual: 0, iniciado: ahora(), enviado: false, sal: nuevaSal(), inicioEncolado: false };
      guardarEv(ev);
    }
    if (!ev.sal) { ev.sal = nuevaSal(); guardarEv(ev); }
    if (!ev.inicioEncolado) {
      ev.inicioEncolado = true;
      guardarEv(ev);
      // va a la misma cola que el resto: así llega siempre antes que el envío final
      II.enviar(registro('eval-inicio', { disp }));
    }
    return ev;
  }

  function vistaExamen(forzar) {
    const ev = asegurarInicio();
    insts = insts || TF.instancias(alumno.carnet);
    pedirPantalla();
    if (!mostrar('examen', `
        <div class="reloj-tf"><div class="info"><span id="x-preg"></span><br><span id="x-cont"></span></div><span class="t" id="x-t">--:--</span></div>
        <div class="chips-tf" id="x-chips">${insts.map((q, j) => `<button type="button" data-j="${j}">${j + 1}</button>`).join('')}</div>
        <div class="tarjeta" id="x-q"></div>
        <div class="mando-tf"><button class="boton" id="x-ant">◀ Anterior</button><button class="boton" id="x-sig">Siguiente ▶</button></div>
        <div class="tarjeta">
          <button class="boton prim bloque" id="x-env">Enviar examen</button>
          <p class="nota-tf" id="x-faltan" style="margin-top:8px"></p>
          <p class="nota-tf">Tus respuestas se guardan en este celular y se copian al servidor mientras avanzas. Si se acaba el tiempo, se envía solo lo que tengas.</p>
        </div>`, forzar)) { reloj(); return; }
    actual = Math.min(ev.actual || 0, insts.length - 1);
    $('#x-chips').onclick = (e) => { const b = e.target.closest('button'); if (b) irA(+b.dataset.j); };
    $('#x-ant').onclick = () => irA(actual - 1);
    $('#x-sig').onclick = () => irA(actual + 1);
    dobleToque($('#x-env'), () => {
      const f = insts.length - insts.filter((q) => TF.respondida(q, leerEv().resp[q.id])).length;
      return f ? `Te falta${f > 1 ? 'n' : ''} ${f}. ¿Enviar igual? Toca otra vez` : '¿Enviar? Toca otra vez para confirmar';
    }, () => enviarEval('estudiante'));
    pintarPregunta();
    reloj();
  }

  function irA(j) {
    if (j < 0 || j >= insts.length) return;
    if (j !== actual) programarAvance(0);
    actual = j;
    const ev = leerEv(); ev.actual = j; guardarEv(ev);
    pintarPregunta();
    $('#x-q').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function chips() {
    const r = leerEv().resp;
    II.$$('#x-chips button').forEach((b, j) => {
      const q = insts[j];
      b.classList.toggle('resp', TF.respondida(q, r[q.id]));
      b.classList.toggle('medio', !TF.respondida(q, r[q.id]) && TF.tocada(q, r[q.id]));
      b.classList.toggle('actual', j === actual);
    });
    const nr = insts.filter((q) => TF.respondida(q, r[q.id])).length;
    $('#x-preg').textContent = `Pregunta ${actual + 1} de ${insts.length}`;
    $('#x-cont').textContent = nr === 1 ? '1 respondida' : nr + ' respondidas';
    const f = insts.length - nr;
    $('#x-faltan').textContent = f ? `Te falta${f > 1 ? 'n' : ''} ${f}. Los números en azul ya tienen respuesta; en ámbar, a medias.` : 'Respondiste todas. Revisa si quieres y envía.';
    $('#x-ant').disabled = actual === 0;
    $('#x-sig').disabled = actual === insts.length - 1;
  }

  function pintarPregunta() {
    const q = insts[actual];
    const ev = leerEv();
    renderPregunta($('#x-q'), q, ev.resp[q.id], {
      alCambiar: (val) => {
        const x = leerEv();
        if (!x || x.enviado || fase() !== 'curso') return;
        if (val == null) delete x.resp[q.id]; else x.resp[q.id] = val;
        anotarCambio(x, q);
        guardarEv(x);
        chips();
        programarAvance(4000);
      }
    });
    chips();
  }

  // ---------- dibujo de una pregunta (también en modo corrección) ----------
  function renderPregunta(cont, q, resp, opts = {}) {
    const corr = !!opts.correccion;
    let valor = resp == null ? null : JSON.parse(JSON.stringify(resp));
    const avisar = () => { if (opts.alCambiar) opts.alCambiar(valor); };
    const LET = ['A', 'B', 'C', 'D'];
    let cuerpo = '';
    if (q.tipo === 'opcion') {
      cuerpo = `<div class="opciones-est">${q.orden.map((k, j) => `<button type="button" class="opcion-est" data-k="${k}" ${corr ? 'disabled' : ''}><span class="letra">${LET[j]}</span><span class="txt">${q.o[k]}</span></button>`).join('')}</div>`;
    } else if (q.tipo === 'campos') {
      cuerpo = `<div class="campos-tf">${q.campos.map((c) => `<label class="campo-tf"><span class="et">${c.et}</span>
          <button type="button" class="signo" data-c="${c.id}" ${corr ? 'disabled' : ''} aria-label="Cambiar signo">±</button>
          <input data-c="${c.id}" inputmode="decimal" autocomplete="off" placeholder="?" value="${II.esc(valor && valor[c.id] != null ? valor[c.id] : '')}" ${corr ? 'disabled' : ''}></label>`).join('')}</div>`;
    } else if (q.tipo === 'orden') {
      cuerpo = `<div class="orden-tf">${q.mezcla.map((i) => `<button type="button" data-i="${i}" ${corr ? 'disabled' : ''}><span class="num"></span><span>${q.pasos[i]}</span></button>`).join('')}</div>
        ${corr ? '' : '<button type="button" class="boton" data-rol="reiniciar" style="margin-top:10px">Reiniciar el orden</button>'}`;
    }
    const pts = corr ? Math.round(TF.calificar(q, valor) * q.puntos * 10) / 10 : null;
    const cls = corr ? (pts >= q.puntos ? 'ok' : pts > 0 ? 'duda' : 'mal') : 'acento';
    cont.innerHTML = `<div class="cab-preg"><span class="chip-tf acento">P${q.n}</span><span class="chip-tf ${cls}">${corr ? II.fmt(pts, 1) + ' / ' : ''}${q.puntos} pts</span><span class="chip-tf">${II.esc(q.tema)}</span></div>
      <div class="enunciado">${q.t}</div>${cuerpo}<div data-rol="corr"></div>`;

    if (q.tipo === 'opcion') {
      const pintarOp = () => cont.querySelectorAll('.opcion-est').forEach((b) => {
        const k = +b.dataset.k;
        b.classList.toggle('elegida', !corr && valor === k);
        if (corr) { b.classList.toggle('correcta', k === q.c); b.classList.toggle('errada', valor === k && k !== q.c); }
      });
      if (!corr) cont.querySelectorAll('.opcion-est').forEach((b) => b.addEventListener('click', () => { valor = +b.dataset.k; pintarOp(); avisar(); }));
      pintarOp();
    }
    if (q.tipo === 'campos') {
      const leerCampos = () => {
        const v = {};
        cont.querySelectorAll('input[data-c]').forEach((i) => { if (i.value.trim() !== '') v[i.dataset.c] = i.value.trim(); });
        valor = Object.keys(v).length ? v : null;
        avisar();
      };
      if (!corr) {
        cont.querySelectorAll('input[data-c]').forEach((i) => i.addEventListener('input', leerCampos));
        cont.querySelectorAll('.signo').forEach((b) => b.addEventListener('click', () => {
          const i = cont.querySelector(`input[data-c="${b.dataset.c}"]`);
          const s = i.value.trim();
          i.value = /^[-−]/.test(s) ? s.replace(/^[-−]\s*/, '') : '-' + s;
          leerCampos();
          if (!s) i.focus();
        }));
      } else {
        cont.querySelectorAll('input[data-c]').forEach((i) => {
          const c = q.campos.find((x) => x.id === i.dataset.c);
          const v = TF.num(i.value);
          i.classList.toggle('bien', isFinite(v) && Math.abs(v - c.valor) <= Math.max(Math.abs(c.valor) * 0.02, 0.01));
          i.classList.toggle('mal', !(isFinite(v) && Math.abs(v - c.valor) <= Math.max(Math.abs(c.valor) * 0.02, 0.01)));
        });
      }
    }
    if (q.tipo === 'orden') {
      const pintarOr = () => cont.querySelectorAll('.orden-tf button').forEach((b) => {
        const i = +b.dataset.i, k = (valor || []).indexOf(i);
        b.classList.toggle('elegido', !corr && k >= 0);
        b.querySelector('.num').textContent = k >= 0 ? k + 1 : '';
        if (corr) { b.classList.toggle('correcta', k === i); b.classList.toggle('errada', k !== i); }
      });
      if (!corr) {
        cont.querySelectorAll('.orden-tf button').forEach((b) => b.addEventListener('click', () => {
          const i = +b.dataset.i, s = valor ? valor.slice() : [];
          const k = s.indexOf(i);
          if (k >= 0) s.splice(k); else s.push(i);
          valor = s.length ? s : null; pintarOr(); avisar();
        }));
        cont.querySelector('[data-rol=reiniciar]').onclick = () => { valor = null; pintarOr(); avisar(); };
      }
      pintarOr();
    }
    if (corr) {
      cont.querySelector('[data-rol=corr]').innerHTML = `<div class="aviso ${cls === 'acento' ? 'info' : cls}" style="font-weight:500">
          <b>${pts >= q.puntos ? '¡Correcto!' : pts > 0 ? 'Parcialmente correcto.' : TF.tocada(q, valor) ? 'Incorrecto.' : 'Sin responder.'}</b>
          ${pts >= q.puntos ? '' : '<br>Respuesta correcta: ' + TF.correctaHTML(q)}</div>
        <div class="solucion-tf">${(q.sol || []).map((x) => `<p>${x}</p>`).join('')}</div>`;
    }
  }

  // ---------- reloj ----------
  function reloj() {
    clearInterval(tic);
    const paso = () => {
      const fz = fase();
      if (fz !== 'curso' || (leerEv() && leerEv().enviado)) {
        clearInterval(tic);
        const b = $('#x-cuenta'); if (b) b.classList.add('oculto');
        return pintar();
      }
      const s = restante();
      const t = $('#x-t');
      if (t) { t.textContent = s == null ? '--:--' : II.formatoReloj(Math.max(0, Math.ceil(s))); t.classList.toggle('poco', s != null && s < 300); }
      // barra fija abajo cuando el docente corta el examen o queda menos de un minuto
      let b = $('#x-cuenta');
      if (!b) { b = document.createElement('div'); b.id = 'x-cuenta'; b.className = 'cuenta oculto'; document.body.appendChild(b); }
      if (s != null && (ex.cortado || s < 60)) {
        b.textContent = `⏳ ${ex.cortado ? 'El docente cerró el examen' : 'Último minuto'}: se envía solo en ${Math.max(0, Math.ceil(s))} s`;
        b.classList.remove('oculto');
      } else b.classList.add('oculto');
    };
    paso();
    tic = setInterval(paso, 500);
  }

  // ---------- envíos ----------
  let tAvance = null, ultimaFirma = '';
  function programarAvance(ms) {
    clearTimeout(tAvance);
    tAvance = setTimeout(() => enviarAvance(false), ms);
  }
  function enviarAvance(forzar) {
    const ev = leerEv();
    if (!ev || !ev.iniciado || ev.enviado || fase() !== 'curso') return;
    const sal = resumenSal(ev.sal);
    const firma = JSON.stringify([ev.resp, sal.n, sal.seg, sal.foco, sal.cambios.length, !!ev.sal.abierta]);
    if (!forzar && firma === ultimaFirma) return;
    ultimaFirma = firma;
    II.enviar(registro('eval-avance', { resp: ev.resp, n: Object.keys(ev.resp).length, sal }));
  }
  setInterval(() => enviarAvance(false), 45000);

  let enviando = false;
  function enviarEval(motivo) {
    const ev = leerEv();
    if (!ev || ev.enviado || enviando) return;
    enviando = true;
    cerrarSalidaAbierta(ev);
    const cal = TF.nota(alumno.carnet, ev.resp);
    Object.assign(ev, { enviado: true, motivo, nota: cal.nota, puntos: cal.puntos, enviadoEn: ahora() });
    guardarEv(ev);
    II.enviar(registro('eval', { resp: ev.resp, puntos: cal.puntos, nota: cal.nota, motivo, sal: resumenSal(ev.sal) },
      { correcta: cal.nota >= 51, puntaje: Math.max(0, Math.min(100, cal.nota)) }));
    enviando = false;
    soltarPantalla();
    pintar(true);
  }

  // ---------- enviado (antes del cierre) ----------
  function vistaEnviado(forzar) {
    const ev = leerEv();
    const hora = new Date(ev.enviadoEn || Date.now()).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/La_Paz' });
    mostrar('enviado', `<div class="tarjeta">
        <span class="etq">${II.esc(E.corto)}</span>
        <h2>✓ Examen enviado</h2>
        <p>Lo enviaste a las <b>${hora}</b>.</p>
        <div class="aviso info">Verás tu <b>nota y la solución con tus números</b> cuando el docente cierre el examen. Deja esta página abierta o vuelve a entrar con el mismo celular.</div>
        <p class="nota-tf" id="x-estado-envio"></p></div>`, forzar);
    estadoEnvio();
  }
  function estadoEnvio() {
    const el = $('#x-estado-envio');
    if (!el) return;
    const pend = II.leer('ii-cola-envios', []).filter((r) => r.sesion === SID && r.carnet === alumno.carnet).length;
    el.textContent = pend ? `Enviando… (${pend} pendiente${pend > 1 ? 's' : ''}; se reintenta solo cuando haya internet)` : 'Recibido por el servidor.';
  }

  // ---------- cerrado: nota y solución ----------
  function vistaCerrado(forzar) {
    const ev = leerEv();
    if (!ev || !ev.iniciado) {
      return mostrar('cerrado-sin', `<div class="tarjeta"><span class="etq">${II.esc(E.corto)}</span><h2>El examen ya terminó</h2>
        <p>No hay respuestas tuyas en este celular.</p></div>`, forzar);
    }
    insts = insts || TF.instancias(alumno.carnet);
    const cal = TF.nota(alumno.carnet, ev.resp);
    if (!mostrar('cerrado', `<div class="tarjeta" style="text-align:center">
        <span class="etq">${II.esc(E.corto)} · Nota</span>
        <div class="nota-grande">${II.fmt(cal.nota, 1)}<small> / 100</small></div>
        <p class="nota-tf" style="margin-top:8px">${ev.motivo === 'tiempo' ? 'Se envió al terminar el tiempo.' : 'Lo enviaste tú.'} La nota oficial la confirma el docente.</p>
        <div class="resumen-pts">${insts.map((q) => { const p = cal.puntos[q.id]; return `<div class="${p >= q.puntos ? 'ok' : p > 0 ? 'duda' : 'mal'}">P${q.n}<br>${II.fmt(p, 1)}/${q.puntos}</div>`; }).join('')}</div>
        <p class="nota-tf" id="x-estado-envio"></p></div>
        <p class="nota-tf" style="margin:0 0 10px">Solución con <b>tus</b> números:</p>
        <div id="x-sols"></div>`, forzar)) return estadoEnvio();
    const cont = $('#x-sols');
    insts.forEach((q) => {
      const t = document.createElement('div');
      t.className = 'tarjeta';
      cont.appendChild(t);
      renderPregunta(t, q, ev.resp[q.id], { correccion: true });
    });
    estadoEnvio();
  }

  // ============================================================
  // REGISTRO DE SALIDAS
  // ============================================================
  const vigilando = () => {
    const ev = leerEv();
    return !!(alumno && ev && ev.iniciado && !ev.enviado && fase() === 'curso');
  };
  let volvio = 0, preguntasTrasVolver = new Set(), blurT0 = 0, ultimoHidden = 0, salidaCerradaEn = 0;

  function resumenSal(s) {
    s = s || nuevaSal();
    return { n: s.n, seg: s.seg, max: s.max, lista: s.lista.slice(-30), abierta: s.abierta, foco: s.foco, cambios: s.cambios.slice(-30), pantalla: s.pantalla, recargas: s.recargas, disp: s.disp };
  }
  function cerrarSalidaAbierta(ev) {
    const a = ev.sal && ev.sal.abierta;
    if (!a) return 0;
    const seg = Math.max(0, Math.round((ahora() - a.t0) / 1000));
    ev.sal.n += 1;
    ev.sal.seg += seg;
    ev.sal.max = Math.max(ev.sal.max, seg);
    ev.sal.lista.push({ p: a.p, min: a.min, seg });
    ev.sal.abierta = null;
    return seg;
  }
  function anotarCambio(ev, q) {
    if (!volvio || ahora() - volvio > 30000 || preguntasTrasVolver.has(q.id)) return;
    preguntasTrasVolver.add(q.id);
    ev.sal.cambios.push({ p: q.n, s: Math.round((ahora() - volvio) / 1000), min: minDesdeInicio() });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      ultimoHidden = Date.now();
      if (!vigilando()) return;
      const ev = leerEv();
      if (!ev.sal.abierta) {
        ev.sal.abierta = { p: actual + 1, t0: ahora(), min: minDesdeInicio() };
        guardarEv(ev);
      }
      enviarAvance(true);
      return;
    }
    // vuelve a la página
    sincronizarHora();
    const ev = leerEv();
    if (ev && ev.sal && ev.sal.abierta && !ev.enviado) {
      const seg = cerrarSalidaAbierta(ev);
      guardarEv(ev);
      salidaCerradaEn = Date.now();
      if (fase() === 'curso') {
        volvio = ahora(); preguntasTrasVolver = new Set();
        avisoVuelta(ev.sal.n, seg);
        pedirPantalla();
        enviarAvance(true);
      }
    }
    pintar();
  });
  // pérdida de foco sin ocultar la página (pantalla dividida, ventana flotante, cortina de notificaciones)
  window.addEventListener('blur', (e) => { if (e.target === window && !document.hidden && vigilando()) blurT0 = Date.now(); });
  window.addEventListener('focus', (e) => {
    if (e.target !== window || !blurT0) return;
    const d = Date.now() - blurT0;
    const ocultaEnMedio = ultimoHidden >= blurT0 || Date.now() - salidaCerradaEn < 3000;
    blurT0 = 0;
    if (ocultaEnMedio || d < 1500 || !vigilando()) return;
    const ev = leerEv();
    ev.sal.foco.n += 1;
    ev.sal.foco.seg += Math.round(d / 1000);
    guardarEv(ev);
    programarAvance(1000);
  });

  let tVuelta = null;
  function avisoVuelta(n, seg) {
    let a = $('#aviso-vuelta');
    if (!a) { a = document.createElement('div'); a.id = 'aviso-vuelta'; a.className = 'aviso duda aviso-vuelta'; document.body.appendChild(a); }
    a.innerHTML = `⚠ Saliste de la página (${n}.ª vez) · ${seg} s fuera. <b>Queda registrado para el docente.</b>`;
    a.classList.remove('oculto');
    clearTimeout(tVuelta);
    tVuelta = setTimeout(() => a.classList.add('oculto'), 6000);
  }

  // ---------- pantalla siempre encendida ----------
  let bloqueo = null;
  async function pedirPantalla() {
    if (!vigilando() || document.hidden) return;
    const ev = leerEv();
    if (!('wakeLock' in navigator)) { if (ev.sal.pantalla !== 'no compatible') { ev.sal.pantalla = 'no compatible'; guardarEv(ev); } return; }
    if (bloqueo) return;
    try {
      bloqueo = await navigator.wakeLock.request('screen');
      bloqueo.addEventListener('release', () => { bloqueo = null; });
      const x = leerEv(); if (x.sal.pantalla !== 'sí') { x.sal.pantalla = 'sí'; guardarEv(x); }
    } catch (e) {
      const x = leerEv(); if (x.sal.pantalla !== 'sí') { x.sal.pantalla = 'falló'; guardarEv(x); }
    }
  }
  function soltarPantalla() { try { if (bloqueo) bloqueo.release(); } catch (e) { /* nada */ } bloqueo = null; }
  // algunos navegadores (Safari) solo conceden la pantalla encendida después de un toque
  document.addEventListener('click', () => { if (!bloqueo) pedirPantalla(); }, true);

  // ---------- confirmación con doble toque ----------
  function dobleToque(btn, texto, accion) {
    const original = btn.textContent;
    let armado = false, t = null;
    btn.onclick = () => {
      if (!armado) {
        armado = true;
        btn.textContent = typeof texto === 'function' ? texto() : texto;
        btn.classList.add('peligro');
        t = setTimeout(() => { armado = false; btn.textContent = original; }, 4000);
        return;
      }
      clearTimeout(t);
      btn.disabled = true;
      accion();
    };
  }

  // ============================================================
  // ARRANQUE
  // ============================================================
  function arrancar() {
    barra();
    // recarga en medio del examen: se cuenta y se cierra la salida que quedó abierta
    const ev = leerEv();
    if (ev && ev.iniciado && !ev.enviado) {
      ev.sal = ev.sal || nuevaSal();
      ev.sal.recargas += 1;
      if (ev.sal.abierta) cerrarSalidaAbierta(ev);
      guardarEv(ev);
    }
    if (!II.sb) {
      CONT.innerHTML = '<div class="tarjeta"><h2>Sin conexión</h2><p>No se pudo cargar la conexión con el examen. Revisa tus datos móviles y recarga la página.</p><button class="boton prim bloque" onclick="location.reload()">Recargar</button></div>';
      return;
    }
    sincronizarHora().then(() => pintar());
    II.seguirEstado(SID, (fila) => {
      const antes = JSON.stringify(ex);
      ex = fila.extra || {};
      filaLeida = true;
      if (JSON.stringify(ex) !== antes || vista === 'cargando' || vista === '') pintar();
    });
    // la fila puede no existir aún o la red tardar: reintento propio
    setTimeout(() => { if (!filaLeida) { filaLeida = true; pintar(); } }, 8000);
    setInterval(sincronizarHora, 30000);
    setInterval(() => { if (vista === 'enviado' || vista === 'cerrado') estadoEnvio(); }, 4000);
    // al cerrar el examen el reloj local manda: repinta al pasar «fin»
    setInterval(() => { if (alumno && filaLeida && (vista === 'enviado' || vista === 'espera') && fase() === 'cerrado') pintar(); }, 1000);
  }
  arrancar();
})();
