// ============================================================
// Examen final (sesión asíncrona pl-ex): un solo intento.
//   Preguntas por carnet (3 partes), 60 minutos desde «Empezar»; nota y soluciones recién en la hora de publicación (extra.publica).
//   Acceso por lista (carnet + fecha de nacimiento). El estudiante fantasma y ?modo=revision
//   trabajan en local: no se envía nada.
// Envíos: ingreso; eval-inicio (arranca el reloj del servidor); eval-avance (copia automática); eval
// ============================================================
(function () {
  const II = window.II, EX = II.EX;
  const SES = EX.META.id;
  const revision = II.params.get('modo') === 'revision';
  const main = II.$('#principal');
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  let alumno = revision ? { nombre: 'Revisión docente', carnet: II.params.get('c') || II.leer('pl-ex-rev-carnet', 'REVISION'), fantasma: true } : II.leer(II.claveAlumno(SES));
  let fila = null, offset = 0, srv = null, vistaInt = null, ultimoAvance = '', enviando = false;
  const local = () => revision || !II.configurado || !!(alumno && alumno.fantasma);   // sin envíos

  const k = (t) => `${SES}${local() ? '-loc' : ''}-${t}-${alumno ? alumno.carnet : 'x'}`;
  const ahora = () => Date.now() + offset;
  const leerEval = () => II.leer(k('eval'), null);
  const guardarEval = (ev) => II.guardar(k('eval'), ev);
  const fecha = (ms, dia = true) => {
    if (!ms) return '—';
    const o = { timeZone: 'America/La_Paz', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false };
    if (dia) o.weekday = 'long';
    return new Date(ms).toLocaleString('es-BO', o);
  };

  // ---------- ventana (la abre y la cierra el docente) ----------
  const ventana = () => {
    const ex = (fila && fila.extra) || {};
    const abre = ex.abre ? Date.parse(ex.abre) : null, cierra = ex.cierra ? Date.parse(ex.cierra) : null;
    if (local() && !fila) return { estado: 'abierta', abre: null, cierra: null };
    if (revision) return { estado: 'abierta', abre, cierra: null };
    if (!fila) return { estado: 'sin-datos' };
    const t = ahora();
    if (!abre || t < abre) return { estado: 'antes', abre, cierra };
    if (cierra && t > cierra) return { estado: 'cerrada', abre, cierra };
    return { estado: 'abierta', abre, cierra };
  };
  // el estudiante fantasma ensaya siempre con todo abierto; sus soluciones se ven al terminar
  const ventanaEfectiva = () => (alumno && alumno.fantasma && !revision) ? { estado: 'abierta', abre: null, cierra: null } : ventana();

  // hora en que se publican nota y soluciones: extra.publica, o el cierre si no hay
  const publicaMs = () => {
    const ex = (fila && fila.extra) || {};
    const p = ex.publica ? Date.parse(ex.publica) : (ex.cierra ? Date.parse(ex.cierra) : null);
    return p || Infinity;
  };

  const leerFila = async () => {
    if (!II.sb) return;
    try {
      const { data, error } = await II.sb.from('estado_sesion').select('*').eq('sesion', SES).maybeSingle();
      if (error) throw error;
      fila = data; II.marcarConexion(true);
    } catch (e) { II.marcarConexion(false); }
  };
  const leerSrv = async () => {
    if (local() || !alumno) return null;
    const t0 = Date.now();
    try {
      const { data, error } = await II.sb.rpc('estado_evaluacion', { p_sesion: SES, p_carnet: alumno.carnet });
      if (error) throw error;
      const d = data && data[0];
      if (!d) return null;
      offset = Date.parse(d.ahora) - (t0 + Date.now()) / 2;
      srv = { inicio: d.inicio ? Date.parse(d.inicio) : null, enviado: !!d.enviado, minutos: d.minutos || EX.META.minutos };
      II.marcarConexion(true);
      return srv;
    } catch (e) { return null; }
  };
  const registro = (actividad, respuesta, extra = {}) => ({
    sesion: SES, actividad, carnet: alumno.carnet, nombre: alumno.nombre, respuesta, correcta: null, intento: 1, puntaje: 0, ...extra
  });

  // ---------- barra ----------
  II.alCambiarConexion((ok) => {
    const p = II.$('#b-conexion');
    p.className = 'punto-conexion ' + (ok ? 'ok' : 'mal');
    p.title = ok ? 'Conectado' : 'Sin conexión: tu avance se guarda y se envía al reconectar';
  });
  const pintarBarra = () => {
    II.$('#b-sesion').textContent = EX.META.titulo;
    II.$('#b-modo').innerHTML = revision ? '<span class="chip duda">Revisión docente</span>' : (alumno && alumno.fantasma) ? '<span class="chip duda">Modo ensayo</span>' : '';
    const u = II.$('#b-usuario');
    if (alumno && !revision) {
      u.innerHTML = `<span>${II.esc(alumno.nombre)}</span><button class="boton chico" id="b-salir">Salir</button>`;
      let armado = false;
      II.$('#b-salir').onclick = (e) => {
        if (!armado) {
          armado = true;
          const ev = leerEval();
          e.target.textContent = ev && ev.inicio && !ev.enviado ? 'Tienes la prueba en curso. ¿Salir igual?' : '¿Seguro? Toca otra vez';
          e.target.classList.add('peligro');
          setTimeout(() => { armado = false; if (e.target.isConnected) { e.target.textContent = 'Salir'; e.target.classList.remove('peligro'); } }, 3500);
          return;
        }
        localStorage.removeItem(II.claveAlumno(SES)); II.borrarCred(); location.hash = ''; location.reload();
      };
    } else u.innerHTML = '';
  };
  const avisoBreve = (html, clase = 'info', ms = 5000) => {
    const a = II.html(`<div class="aviso ${clase} aviso-flotante">${html}</div>`);
    document.body.appendChild(a); setTimeout(() => a.remove(), ms);
  };
  const dobleToque = (b, texto2, accion, ms = 3500) => {
    let armado = false, t0 = 0; const t1 = b.innerHTML;
    b.addEventListener('click', () => {
      if (armado && Date.now() - t0 < 1500) return;   // un doble toque rápido no confirma: hay que leer el aviso
      if (!armado) {
        armado = true; t0 = Date.now(); b.innerHTML = typeof texto2 === 'function' ? texto2() : texto2; b.classList.add('confirmar');
        setTimeout(() => { if (armado && b.isConnected) { armado = false; b.innerHTML = t1; b.classList.remove('confirmar'); } }, ms);
        return;
      }
      armado = false; b.classList.remove('confirmar'); accion(b);
    });
  };
  const limpiar = () => { if (vistaInt) clearInterval(vistaInt); vistaInt = null; };

  // ---------- ingreso por lista ----------
  const pintarIngreso = () => {
    const anio = new Date().getFullYear();
    const sel = (name, ini, fin, rotulo, texto) => `<select class="entrada" name="${name}" required><option value="">${rotulo}</option>${Array.from({ length: Math.abs(fin - ini) + 1 }, (_, i) => {
      const v = ini <= fin ? ini + i : ini - i; return `<option value="${v}">${texto ? texto(v) : v}</option>`; }).join('')}</select>`;
    main.innerHTML = `<div class="contenido angosto"><div class="tarjeta">
      <span class="etiqueta">Diplomado en Control Automático Industrial</span>
      <h2>${EX.META.titulo}</h2>
      <p class="sub">Entra con tu carnet y tu fecha de nacimiento.</p>
      <form id="f-ingreso" autocomplete="off">
        <label class="campo"><span>Carnet de identidad (solo el número)</span><input class="entrada" name="carnet" required minlength="4" maxlength="20" autocomplete="off"></label>
        <div class="campo"><span>Fecha de nacimiento: <b>mes, día y año</b></span>
          <div style="display:grid;grid-template-columns:1.5fr 1fr 1.2fr;gap:8px">${sel('mes', 1, 12, 'Mes', (v) => MESES[v - 1])}${sel('dia', 1, 31, 'Día')}${sel('anio', anio - 16, 1950, 'Año')}</div></div>
        <label class="campo" id="c-pin" style="display:none"><span>PIN</span><input class="entrada" name="pin" type="password" inputmode="numeric" autocomplete="off"></label>
        <div id="f-msg"></div>
        <button class="boton primario grande bloque" type="submit">Entrar</button>
      </form>
      <a class="boton bloque" href="index.html" style="margin-top:10px;text-align:center">◀ Ir a la pantalla principal</a></div></div>`;
    II.$('#f-ingreso').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target), msg = II.$('#f-msg'), btn = ev.target.querySelector('button[type=submit]');
      const dos = (n) => String(n).padStart(2, '0');
      const fechaN = `${f.get('anio')}-${dos(f.get('mes'))}-${dos(f.get('dia'))}`;
      const carnet = II.normCarnet(f.get('carnet')), pin = String(f.get('pin') || '');
      btn.disabled = true; msg.innerHTML = '<div class="aviso info">Comprobando tus datos…</div>';
      const r = II.configurado ? await II.entrar(carnet, fechaN, pin) : { ok: true, nombre: carnet, carnet, fantasma: false };
      btn.disabled = false;
      if (!r.ok) {
        if (r.motivo === 'pin' || r.motivo === 'pin_mal') { II.$('#c-pin').style.display = ''; ev.target.pin.focus(); }
        msg.innerHTML = `<div class="aviso ${r.motivo === 'pin' ? 'info' : 'mal'}">${II.esc(II.MOTIVOS_ENTRADA[r.motivo] || II.MOTIVOS_ENTRADA.red)}</div>`;
        return;
      }
      alumno = { nombre: r.nombre, carnet: r.carnet, fantasma: !!r.fantasma, fecha: fechaN, pin, info: {} };
      II.guardar(II.claveAlumno(SES), alumno);
      II.guardarCred({ carnet: r.carnet, fecha: fechaN, pin, nombre: r.nombre });
      arrancar();
    });
  };

  // ---------- tiempo ----------
  const finEval = (ev) => {
    if (!ev || !ev.inicio) return null;
    const min = (srv && srv.minutos) || EX.META.minutos;
    let fin = ev.inicio + min * 60000;
    const v = ventanaEfectiva();
    if (v.cierra) fin = Math.min(fin, v.cierra - 15000);
    return fin;
  };
  const pintarAviso = (titulo, texto, clase = 'info') => {
    main.innerHTML = `<div class="contenido angosto">${revision ? barraRevision() : ''}<div class="tarjeta" style="text-align:center">
      <span class="etiqueta">${EX.META.titulo}</span><h2 style="margin-top:6px">${titulo}</h2>
      <div class="aviso ${clase}" style="text-align:left">${texto}</div></div></div>`;
    enlazarRevision();
  };
  const sincronizarEval = () => {
    const ev = leerEval();
    if (local() || !srv || !ev) return;
    if (!srv.inicio && !srv.enviado && ev.inicio) { localStorage.removeItem(k('eval')); return; }   // el docente borró los datos de prueba
    if (srv.inicio && ev.inicio !== srv.inicio && !ev.enviado) { ev.inicio = srv.inicio; guardarEval(ev); }
  };

  // ---------- flujo ----------
  const pintar = async () => {
    if (!local()) { await leerSrv(); sincronizarEval(); }
    const ev = leerEval();
    if (ev && ev.enviado) return pintarResultado();
    if (ev && ev.inicio) return pintarEnCurso();
    if (srv && srv.inicio) { guardarEval({ ids: EX.seleccion(alumno.carnet), resp: {}, inicio: srv.inicio, actual: 0 }); return pintarEnCurso(); }
    if (srv && srv.enviado) return pintarAviso('✓ Ya enviaste tu prueba', 'La enviaste desde otro dispositivo y tu prueba quedó registrada. La nota y las soluciones se publican esta noche y se ven en ese dispositivo.', 'ok');
    const v = ventanaEfectiva();
    if (v.estado === 'sin-datos') return pintarAviso('Sin conexión', 'No se pudo leer el estado del examen. Revisa tu conexión y recarga la página.', 'mal');
    if (v.estado === 'antes') return pintarAviso('⏳ El examen todavía no abre', `Abre el <b>${fecha(v.abre)}</b> (hora de Bolivia). Esta pantalla se actualiza sola.`);
    if (v.estado === 'cerrada') return pintarAviso('El examen ya se cerró', 'No se registró ninguna prueba con tu carnet.', 'duda');
    pintarIntro(v);
  };

  const pintarIntro = (v) => {
    const quedan = v.cierra ? (v.cierra - ahora()) / 60000 : Infinity;
    const M = EX.META;
    main.innerHTML = `<div class="contenido angosto" style="max-width:760px">${revision ? barraRevision() : ''}
      <div class="tarjeta">
        <span class="etiqueta">Un solo intento; vale el ${M.peso} % de la nota del módulo</span>
        <h2>${M.titulo}</h2>
        <p class="sub">${II.esc(alumno.nombre)}; CI ${II.esc(alumno.carnet)}</p>
        <ul class="ideas">
          <li><b class="n">1</b><span><b>${M.nEval} preguntas en 3 partes</b> sobre todo lo visto en el módulo: A) diagnóstico de E/S y fallas; B) leer y predecir un GRAFCET o una escalera; C) diseñar con ecuaciones SET/RESET. Cada carnet recibe casos y valores distintos.</span></li>
          <li><b class="n">2</b><span>Tienes <b>${M.minutos} minutos</b> desde que tocas «Empezar». El reloj <b>sigue corriendo</b> aunque cierres la página o se corte la conexión.</span></li>
          <li><b class="n">3</b><span>Puedes moverte entre las preguntas y cambiar tus respuestas hasta enviar. Al llegar a cero, <b>se envía solo</b> lo que tengas marcado.</span></li>
          <li><b class="n">4</b><span>Las preguntas con varias partes y las de ordenar dan <b>puntaje parcial</b>. En los cálculos se acepta un margen de ±2 %. Lo que dejes sin responder cuenta como incorrecto.</span></li>
          <li><b class="n">5</b><span>Al enviar, tu prueba queda registrada y <b>no verás la nota ni las respuestas correctas</b>. Las calificaciones y la retroalimentación se publican <b>esta noche${publicaMs() < Infinity ? ` (${fecha(publicaMs())})` : ''}</b>.</span></li>
        </ul>
        ${quedan < M.minutos ? `<div class="aviso duda">Faltan solo <b>${Math.max(0, Math.floor(quedan))} minutos</b> para el cierre del examen: la prueba terminará antes de los ${M.minutos} minutos.</div>` : ''}
        ${local() ? `<div class="aviso info">${revision ? 'Revisión docente' : 'Modo ensayo'}: el reloj corre en este navegador y no se registra nada.</div>` : ''}
        <div id="ev-msg"></div>
        <button class="boton primario grande bloque" id="b-empezar">Empezar la prueba</button>
      </div></div>`;
    enlazarRevision();
    dobleToque(II.$('#b-empezar'), '¿Listo? Toca otra vez: el reloj arranca', empezar, 4000);
  };

  const empezar = async (b) => {
    b.disabled = true; b.textContent = 'Empezando…';
    const msg = (html, clase = 'mal') => { const e = II.$('#ev-msg'); if (e) e.innerHTML = `<div class="aviso ${clase}">${html}</div>`; b.disabled = false; b.textContent = 'Empezar la prueba'; };
    const ids = EX.seleccion(alumno.carnet);
    if (local()) { guardarEval({ ids, resp: {}, inicio: Date.now(), actual: 0 }); return pintarEnCurso(); }
    let error = null;
    try { ({ error } = await II.sb.from('respuestas').insert(registro('eval-inicio', { ids }))); }
    catch (e) { error = { message: String(e) }; }
    const s = await leerSrv();
    if (s && s.enviado) return alHash();
    if (s && s.inicio) { guardarEval({ ids, resp: {}, inicio: s.inicio, actual: 0 }); return pintarEnCurso(); }
    if (!error && !s) { guardarEval({ ids, resp: {}, inicio: Date.now(), actual: 0 }); return pintarEnCurso(); }
    if (error && (error.code === '42501' || /row-level security/i.test(error.message || ''))) {
      await leerFila();
      return msg('La prueba no está disponible en este momento (el control está cerrado). Recarga la página.');
    }
    msg('No se pudo empezar: <b>revisa tu conexión</b> e inténtalo otra vez. El reloj todavía no arrancó.');
  };

  const enviarAvance = () => {
    const ev = leerEval();
    if (local() || !ev || !ev.inicio || ev.enviado) return;
    const firma = JSON.stringify(ev.resp);
    if (firma === ultimoAvance || firma === '{}') return;
    ultimoAvance = firma;
    II.enviar(registro('eval-avance', { ids: ev.ids, resp: ev.resp, n: Object.keys(ev.resp).length }));
  };

  // registro de salidas de la página durante la prueba (informativo para el docente)
  const salidas = { n: 0, seg: 0, desde: null };
  document.addEventListener('visibilitychange', () => {
    const ev = leerEval();
    if (!ev || !ev.inicio || ev.enviado) return;
    if (document.hidden) { salidas.desde = Date.now(); enviarAvance(); }
    else if (salidas.desde) {
      salidas.n++; salidas.seg += Math.round((Date.now() - salidas.desde) / 1000); salidas.desde = null;
      const x = leerEval(); x.sal = { n: salidas.n, seg: salidas.seg }; guardarEval(x);
      avisoBreve(`Saliste de la página (${salidas.n}.ª vez). El reloj sigue corriendo.`, 'duda', 5000);
    }
  });

  const pintarEnCurso = () => {
    const ev = leerEval();
    const insts = ev.ids.map((id) => EX.instancia(id, alumno.carnet));
    let i = Math.min(ev.actual || 0, insts.length - 1);
    main.innerHTML = `<div class="contenido angosto" style="max-width:760px">
      <div class="reloj-eval"><span>Pregunta <b id="ev-n"></b> de ${insts.length}; <span id="ev-cont"></span></span><span class="t" id="ev-t">--:--</span></div>
      <div class="chips-preg" id="ev-chips">${insts.map((_, j) => `<button type="button" data-j="${j}">${j + 1}</button>`).join('')}</div>
      <div class="tarjeta" id="ev-preg"></div>
      <div class="mando" style="margin-top:12px"><button class="boton grande" id="ev-ant">◀ Anterior</button><button class="boton grande" id="ev-sig">Siguiente ▶</button></div>
      <div class="tarjeta" style="margin-top:16px">
        <button class="boton primario grande bloque" id="ev-enviar">Enviar la prueba</button>
        <p class="nota" id="ev-faltan" style="margin:8px 0 0"></p>
        ${local() ? '' : '<p class="nota" style="margin:6px 0 0">Tus respuestas se guardan en este dispositivo y se copian al servidor mientras avanzas.</p>'}
      </div></div>`;
    const respondidas = () => insts.filter((q) => EX.respondida(q, leerEval().resp[q.id])).length;
    const chips = () => {
      const r = leerEval().resp;
      II.$$('#ev-chips button').forEach((b, j) => { b.classList.toggle('resp', EX.respondida(insts[j], r[insts[j].id])); b.classList.toggle('actual', j === i); });
      const nr = respondidas();
      II.$('#ev-n').textContent = i + 1;
      II.$('#ev-cont').textContent = nr === 1 ? '1 respondida' : nr + ' respondidas';
      II.$('#ev-faltan').textContent = nr < insts.length ? `Te falta${insts.length - nr > 1 ? 'n' : ''} responder ${insts.length - nr}. Los números en azul ya tienen respuesta.` : 'Respondiste todas. Revisa si quieres y envía.';
      II.$('#ev-ant').disabled = i === 0; II.$('#ev-sig').disabled = i === insts.length - 1;
    };
    const mostrar = (j) => {
      if (j !== i) enviarAvance();
      i = Math.max(0, Math.min(insts.length - 1, j));
      const e = leerEval(); e.actual = i; guardarEval(e);
      const q = insts[i];
      EX.render(II.$('#ev-preg'), q, e.resp[q.id], {
        numero: i + 1,
        alCambiar: (val) => {
          const x = leerEval(); if (!x || x.enviado) return;
          if (val == null || val === '') delete x.resp[q.id]; else x.resp[q.id] = val;
          guardarEval(x); chips();
        }
      });
      chips();
    };
    II.$('#ev-chips').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { mostrar(+b.dataset.j); II.$('#ev-preg').scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
    II.$('#ev-ant').onclick = () => mostrar(i - 1);
    II.$('#ev-sig').onclick = () => mostrar(i + 1);
    dobleToque(II.$('#ev-enviar'), () => {
      const f = insts.length - respondidas();
      return f ? `Te falta${f > 1 ? 'n' : ''} ${f}. ¿Enviar igual? Toca otra vez` : '¿Enviar? Toca otra vez para confirmar';
    }, () => enviarEval('estudiante'));
    mostrar(i);
    const tick = () => {
      const x = leerEval(); if (!x || x.enviado) return;
      const fin = finEval(x), t = II.$('#ev-t'); if (!t) return;
      const s = (fin - ahora()) / 1000;
      t.textContent = II.formatoReloj(Math.max(0, s)); t.classList.toggle('poco', s < 300);
    };
    tick(); vistaInt = setInterval(tick, 500);
    // contra copiar y pegar durante la prueba
    main.oncopy = main.oncut = main.onpaste = (e) => e.preventDefault();
  };

  const enviarEval = async (motivo) => {
    const ev = leerEval();
    if (!ev || ev.enviado || enviando) return;
    enviando = true;
    const cal = EX.calificarTodo(ev.ids, ev.resp, alumno.carnet);
    Object.assign(ev, { enviado: true, nota: cal.nota, puntos: cal.puntos, motivo, envio: local() ? 'local' : 'pendiente', enviadoEn: ahora() });
    guardarEval(ev);
    if (motivo === 'tiempo') avisoBreve('⏰ Se acabó el tiempo: tu prueba se envió con lo que tenías marcado.', 'duda', 7000);
    if (!local()) II.enviar(registro('eval', { ids: ev.ids, resp: ev.resp, puntos: cal.puntos, nota: cal.nota, motivo, sal: ev.sal || null }, { correcta: cal.nota >= 51, puntaje: cal.nota }));
    enviando = false;
    alHash();
  };

  const revisarEnvio = async () => {
    const ev = leerEval();
    if (!ev || !ev.enviado || local() || ev.envio === 'ok' || ev.envio === 'rechazada') return;
    const enCola = II.leer('ii-cola-envios', []).some((r) => r.actividad === 'eval' && r.carnet === alumno.carnet && r.sesion === SES);
    if (enCola) { II.vaciarCola(); return; }
    const rech = II.leer('ii-cola-rechazadas', []).some((r) => r.actividad === 'eval' && r.carnet === alumno.carnet && r.sesion === SES);
    const s = await leerSrv(); const e2 = leerEval();
    if (s && s.enviado) e2.envio = 'ok'; else if (rech) e2.envio = 'rechazada'; else return;
    guardarEval(e2);
    const a = II.$('#ev-envio'); if (a) a.outerHTML = avisoEnvio(e2);
  };
  const avisoEnvio = (ev) => {
    if (ev.envio === 'ok') return '<div class="aviso ok" id="ev-envio">✓ Tu prueba quedó <b>registrada</b> en el servidor.</div>';
    if (ev.envio === 'local') return `<div class="aviso info" id="ev-envio">${revision ? 'Revisión docente' : 'Modo ensayo'}: no se registró nada.</div>`;
    if (ev.envio === 'rechazada') return '<div class="aviso mal" id="ev-envio">⚠ El envío llegó <b>fuera de tiempo</b> y el servidor no lo aceptó. El docente calificará con la última copia automática de tus respuestas que llegó a tiempo.</div>';
    return '<div class="aviso duda" id="ev-envio">⏳ <b>Enviando…</b> No cierres esta página hasta que diga «registrada». Si no tienes conexión, se enviará sola al reconectar.</div>';
  };

  // Hasta el cierre general NO se muestra la nota, ni cuáles preguntas salieron bien, ni las soluciones
  // (para que no se pasen las respuestas). En ensayo y revisión se puede mirar cómo se verá al publicarse.
  let verComoPublicado = false;
  const pintarResultado = () => {
    const ev = leerEval();
    if (!ev || !ev.enviado) return pintar();
    const v = ventana();
    const publicado = ahora() >= publicaMs() || ((revision || local()) && verComoPublicado);
    const cierreTxt = publicaMs() < Infinity ? fecha(publicaMs()) : 'esta noche';
    if (!publicado) {
      main.innerHTML = `<div class="contenido angosto" style="max-width:760px">${revision ? barraRevision() : ''}
        <div class="tarjeta" style="text-align:center">
          <span class="etiqueta">Prueba enviada${ev.motivo === 'tiempo' ? ' al terminar el tiempo' : ''}</span>
          <h2 style="margin:8px 0 6px">✓ Tu prueba quedó registrada</h2>
          <p class="sub" style="margin:0">Las <b>calificaciones</b> y la <b>retroalimentación</b> (cuál era la respuesta correcta de cada pregunta) se publicarán <b>esta noche, al terminar la jornada de exámenes</b> (${cierreTxt}). Así nadie comparte las respuestas mientras sus compañeros aún rinden.</p>
          ${avisoEnvio(ev)}
        </div>
        <div class="tarjeta"><div class="aviso info" style="margin:0">Vuelve a abrir esta página <b>después de esa hora</b>, en este mismo dispositivo, para ver tu nota y las soluciones con tus respuestas. No es necesario que hagas nada más ahora.</div></div>
        ${(revision || local()) ? `<div class="tarjeta" style="border-color:#f0d9a8;background:var(--duda-claro)"><div class="nota" style="color:#8a5a12;margin-bottom:8px"><b>${revision ? 'Revisión docente' : 'Modo ensayo'}:</b> el estudiante real ve solo lo de arriba hasta el cierre.</div>
          <div class="controles"><button class="boton chico" id="b-ver-pub">Ver cómo se verá al publicarse (nota y soluciones)</button>${revision ? '' : '<button class="boton chico peligro" id="b-reiniciar-ensayo">Reiniciar el ensayo</button>'}</div></div>` : ''}
      </div>`;
      const bv = II.$('#b-ver-pub'); if (bv) bv.addEventListener('click', () => { verComoPublicado = true; pintarResultado(); });
      const br = II.$('#b-reiniciar-ensayo'); if (br) br.addEventListener('click', () => { localStorage.removeItem(k('eval')); location.hash = ''; alHash(); });
      if (revision) enlazarRevision();
      revisarEnvio(); vistaInt = setInterval(revisarEnvio, 3000);
      return;
    }
    const insts = ev.ids.map((id) => EX.instancia(id, alumno.carnet));
    const fr = insts.map((q) => EX.calificar(q, ev.resp[q.id]));
    main.innerHTML = `<div class="contenido angosto" style="max-width:760px">${revision ? barraRevision() : ''}
      <div class="tarjeta" style="text-align:center">
        <span class="etiqueta">Calificación publicada${ev.motivo === 'tiempo' ? '; enviada al terminar el tiempo' : ''}</span>
        <div class="grande-numero" style="margin:8px 0 0">${II.fmt(ev.nota, 1)}<small style="font-size:.45em;color:var(--texto-3)"> / 100</small></div>
        <p class="sub" style="margin:4px 0 0">Equivale a <b>${II.fmt((ev.nota * EX.META.peso) / 100, 2)} de ${EX.META.peso} puntos</b> de la nota del módulo.</p>
        ${avisoEnvio(ev)}
        ${(revision || local()) && ahora() < publicaMs() ? '<div class="controles" style="justify-content:center;margin-top:8px"><button class="boton chico" id="b-ocultar-pub">Volver a la vista del estudiante</button></div>' : ''}
      </div>
      <div class="tarjeta"><h3>Pregunta por pregunta</h3>
        <div class="chips-preg">${fr.map((p, j) => `<button type="button" class="${p >= 0.999 ? 'ok' : p > 0 ? 'duda' : 'mal'}" data-j="${j}" title="${II.fmt(p * 100, 0)} %">${j + 1}</button>`).join('')}</div>
        <p class="nota" style="margin:0">Verde: correcta; ámbar: parcial; rojo: incorrecta o sin responder.</p>
      </div>
      <div>${insts.map((_, j) => `<div class="tarjeta" data-sol="${j}"></div>`).join('')}</div>
    </div>`;
    insts.forEach((q, j) => EX.render(II.$(`[data-sol="${j}"]`), q, ev.resp[q.id], { mostrar: true, numero: j + 1 }));
    II.$$('.chips-preg button').forEach((b) => b.addEventListener('click', () => II.$(`[data-sol="${b.dataset.j}"]`).scrollIntoView({ behavior: 'smooth', block: 'start' })));
    const bo = II.$('#b-ocultar-pub'); if (bo) bo.addEventListener('click', () => { verComoPublicado = false; pintarResultado(); });
    if (revision) enlazarRevision();
    revisarEnvio(); vistaInt = setInterval(revisarEnvio, 3000);
  };

  // ---------- revisión docente ----------
  const barraRevision = () => `<div class="tarjeta" style="padding:12px 14px;border-color:#f0d9a8;background:var(--duda-claro)">
    <div class="nota" style="color:#8a5a12"><b>Revisión docente:</b> todo está abierto y no se registra nada. Carnet de prueba: <b>${II.esc(alumno.carnet)}</b> (define qué preguntas y valores salen).</div>
    <div class="controles" style="margin-top:8px"><a class="boton chico" href="#banco">Ver el banco completo</a>
      <button class="boton chico" data-rev="carnet">Cambiar carnet de prueba</button>
      <button class="boton chico peligro" data-rev="reiniciar">Reiniciar la revisión</button></div></div>`;
  const enlazarRevision = () => {
    II.$$('[data-rev]').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.rev === 'carnet') {
        const n = (window.prompt('Carnet de prueba (cambia las preguntas y los valores):', alumno.carnet) || '').trim().toUpperCase();
        if (n) { II.guardar('pl-ex-rev-carnet', n); alumno.carnet = n; alHash(); }
      } else { localStorage.removeItem(k('eval')); location.hash = ''; alHash(); }
    }));
  };
  const pintarBanco = () => {
    const filas = [];
    EX.SLOTS.forEach((s) => s.plantillas.forEach((_, ix) => filas.push(`${s.id}:${ix}`)));
    main.innerHTML = `<div class="contenido angosto" style="max-width:820px">${barraRevision()}
      <div class="tarjeta"><h2>Banco de la prueba</h2>
        <p class="sub">${EX.SLOTS.length} casillas y ${filas.length} plantillas. A cada carnet le toca una plantilla por casilla (${EX.META.nEval} preguntas). Se muestran con los datos del carnet de prueba y con la solución.</p></div>
      ${EX.SLOTS.map((s) => `<h3 style="margin:22px 0 8px">Casilla ${s.id}; ${EX.TEMAS[s.tema] || s.tema}; vale ${s.peso} puntos</h3>
        ${s.plantillas.map((_, ix) => `<div class="tarjeta" data-b="${s.id}:${ix}"></div>`).join('')}`).join('')}</div>`;
    filas.forEach((idc) => { const q = EX.instancia(idc, alumno.carnet); EX.render(II.$(`[data-b="${idc}"]`), q, null, { mostrar: true, numero: idc }); });
    enlazarRevision();
  };

  // ---------- navegación ----------
  const alHash = () => {
    limpiar();
    if (!alumno) return pintarIngreso();
    pintarBarra();
    if (location.hash === '#banco' && revision) pintarBanco(); else pintar();
    window.scrollTo(0, 0);
  };
  window.addEventListener('hashchange', alHash);

  setInterval(() => {
    const ev = leerEval();
    if (!alumno || !ev || !ev.inicio || ev.enviado) return;
    const fin = finEval(ev);
    if (fin != null && ahora() >= fin) enviarEval('tiempo'); else if (++cuenta % 45 === 0) enviarAvance();
  }, 1000);
  let cuenta = 0;
  setInterval(async () => {
    if (local() || !alumno) return;
    const antes = ventana().estado; await leerFila();
    if (ventana().estado !== antes) { const ev = leerEval(); if (!(ev && ev.inicio && !ev.enviado)) alHash(); }
  }, 30000);

  II.$('#b-icono').innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5"/><circle cx="12" cy="16" r="1.4" fill="#fff"/></svg>';

  const arrancar = async () => {
    if (revision && II.sb) {
      const { data } = await II.sb.auth.getSession();
      let ok = false;
      if (data && data.session) { const r = await II.sb.from('docentes').select('email'); ok = !r.error && r.data && r.data.length > 0; }
      if (!ok) { main.innerHTML = '<div class="contenido angosto"><div class="tarjeta"><h2>Vista solo para el docente</h2><p class="sub">Entra primero al panel docente del módulo en este navegador y vuelve a abrir esta página.</p><a class="boton" href="docente.html?s=pl-ce">Ir al panel docente</a></div></div>'; return; }
    }
    await leerFila();
    if (!alumno) { pintarBarra(); return pintarIngreso(); }
    await leerSrv(); sincronizarEval();
    alHash();
  };
  arrancar();
})();
