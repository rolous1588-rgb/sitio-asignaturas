// ============================================================
// Evaluaciones de un solo intento. La página elige cuál con <body data-eval="…">:
//   ii-ce  Control de estudio (estudio.html): 7 módulos + evaluación de 15 preguntas en 20 minutos
//   ii-s6  Examen final (examen.html): 20 preguntas, sin reloj fijo; el docente lo cierra con cuenta regresiva
//   ?modo=revision → revisión docente: todo abierto, no registra nada
//                    (pide haber entrado antes al panel docente en este navegador)
// Envíos: ingreso · mod-1 … mod-7 (módulo estudiado) · eval-inicio · eval-avance (copia automática) · eval
// La hora que manda es la del servidor (RPC estado_evaluacion); la base rechaza envíos fuera de plazo.
// ============================================================
(function () {
  const II = window.II, P = II.preguntas;
  const C = (II.EVALUACIONES || {})[document.body.dataset.eval || 'ii-ce'] || II.CONTROL;
  const SES = C.id;
  const EX = !!C.examen;               // examen final: sin módulos, lo cierra el docente
  const revision = II.params.get('modo') === 'revision';
  const ensayo = !II.configurado;      // sin Supabase: todo queda en este navegador
  const local = revision || ensayo;    // en estos modos no se envía nada
  const main = II.$('#principal');
  const N = C.modulos.length;

  let alumno = revision ? { nombre: 'Revisión docente', carnet: II.leer('ii-ce-rev-carnet', 'REVISION') } : II.leer('ii-alumno');
  let fila = null;        // estado_sesion de ii-ce (ventana: extra.abre / extra.cierra)
  let offset = 0;         // hora del servidor − hora de este dispositivo (ms)
  let srv = null;         // { inicio, enviado, minutos } según el servidor
  let destruibles = [];   // diagramas montados en la vista actual
  let vistaInt = null;    // intervalo de la vista actual
  let moduloAbierto = null;
  let ultimoAvance = '';  // última copia automática enviada (para no repetir)

  const k = (t) => `${SES}${revision ? '-rev' : ''}-${t}-${alumno ? alumno.carnet : 'x'}`;
  const ahora = () => Date.now() + offset;
  const leerMods = () => II.leer(k('mods'), {});
  const hechos = () => C.modulos.filter((m) => leerMods()[m.n]).length;
  const leerEval = () => II.leer(k('eval'), null);
  const guardarEval = (ev) => II.guardar(k('eval'), ev);

  // ---------- fechas en hora de Bolivia ----------
  const fecha = (ms, conDia = true) => {
    if (!ms) return '—';
    const o = { timeZone: 'America/La_Paz', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false };
    if (conDia) o.weekday = 'long';
    return new Date(ms).toLocaleString('es-BO', o);
  };

  // ---------- ventana del control (la abre y la cierra el docente) ----------
  const ventana = () => {
    const ex = (fila && fila.extra) || {};
    const abre = ex.abre ? Date.parse(ex.abre) : null;
    const cierra = ex.cierra ? Date.parse(ex.cierra) : null;
    if (revision) return { estado: 'abierta', abre, cierra: null };
    if (ensayo) return { estado: 'abierta', abre: null, cierra: null };
    if (!fila) return { estado: 'sin-datos' };
    const t = ahora();
    if (!abre || t < abre) return { estado: 'antes', abre, cierra };
    if (cierra && t > cierra) return { estado: 'cerrada', abre, cierra };
    return { estado: 'abierta', abre, cierra };
  };

  // ---------- servidor ----------
  const leerFila = async () => {
    if (!II.sb) return;
    try {
      const { data, error } = await II.sb.from('estado_sesion').select('*').eq('sesion', SES).maybeSingle();
      if (error) throw error;
      fila = data;
      II.marcarConexion(true);
    } catch (e) { II.marcarConexion(false); }
  };
  const leerSrv = async () => {
    if (local || !alumno) return null;
    const t0 = Date.now();
    try {
      const { data, error } = await II.sb.rpc('estado_evaluacion', { p_sesion: SES, p_carnet: alumno.carnet });
      if (error) throw error;
      const d = data && data[0];
      if (!d) return null;
      offset = Date.parse(d.ahora) - (t0 + Date.now()) / 2;
      srv = { inicio: d.inicio ? Date.parse(d.inicio) : null, enviado: !!d.enviado, minutos: d.minutos || C.minutos };
      II.marcarConexion(true);
      return srv;
    } catch (e) { return null; }
  };
  const registro = (actividad, respuesta, extra = {}) => ({
    sesion: SES, actividad, carnet: alumno.carnet, nombre: alumno.nombre, respuesta,
    correcta: null, intento: 1, puntaje: 0, ...extra
  });

  // ---------- barra superior ----------
  II.alCambiarConexion((ok) => {
    const p = II.$('#b-conexion');
    p.className = 'punto-conexion ' + (ok ? 'ok' : 'mal');
    p.title = ok ? 'Conectado' : 'Sin conexión: tu avance se guarda y se envía al reconectar';
  });
  const pintarBarra = () => {
    II.$('#b-sesion').textContent = C.titulo + ' · ' + C.subtitulo.split(':')[0];
    II.$('#b-modo').innerHTML = revision ? '<span class="chip duda">Revisión docente</span>' : ensayo ? '<span class="chip duda">Modo ensayo</span>' : '';
    II.$('#b-avance').innerHTML = alumno && !revision && !EX ? `<span class="chip acento" title="Módulos estudiados">📘 ${hechos()}/${N}</span>` : '';
    const u = II.$('#b-usuario');
    if (alumno && !revision) {
      u.innerHTML = `<span>${II.esc(alumno.nombre)}</span><button class="boton chico" id="b-salir" title="Cambiar de usuario">Salir</button>`;
      let armado = false;
      II.$('#b-salir').onclick = (e) => {
        if (!armado) {
          armado = true;
          const ev = leerEval();
          e.target.textContent = ev && ev.inicio && !ev.enviado ? 'Tienes la evaluación en curso. ¿Salir igual?' : '¿Seguro? Toca otra vez';
          e.target.classList.add('peligro');
          setTimeout(() => { armado = false; if (e.target.isConnected) { e.target.textContent = 'Salir'; e.target.classList.remove('peligro'); } }, 3500);
          return;
        }
        localStorage.removeItem('ii-alumno');
        location.hash = '';
        location.reload();
      };
    } else u.innerHTML = '';
  };

  // aviso breve abajo de la pantalla
  const avisoBreve = (html, clase = 'info', ms = 5000) => {
    const a = II.html(`<div class="aviso ${clase} aviso-flotante">${html}</div>`);
    document.body.appendChild(a);
    setTimeout(() => a.remove(), ms);
  };
  // botón que pide un segundo toque para confirmar
  const dobleToque = (b, texto2, accion, ms = 3500) => {
    let armado = false;
    const t1 = b.innerHTML;
    b.addEventListener('click', () => {
      if (!armado) {
        armado = true; b.innerHTML = typeof texto2 === 'function' ? texto2() : texto2; b.classList.add('confirmar');
        setTimeout(() => { if (armado && b.isConnected) { armado = false; b.innerHTML = t1; b.classList.remove('confirmar'); } }, ms);
        return;
      }
      armado = false; b.classList.remove('confirmar');
      accion(b);
    });
  };

  // ---------- limpieza al cambiar de vista ----------
  const limpiar = () => {
    destruibles.forEach((d) => { try { d && d.destruir && d.destruir(); } catch (e) { /* nada */ } });
    destruibles = [];
    if (vistaInt) clearInterval(vistaInt);
    vistaInt = null;
    if (moduloAbierto) { // suma el tiempo de estudio del módulo (máx. 30 min por visita)
      const seg = II.leer(k('seg'), {});
      seg[moduloAbierto.n] = (seg[moduloAbierto.n] || 0) + Math.min(1800, Math.round((Date.now() - moduloAbierto.desde) / 1000));
      II.guardar(k('seg'), seg);
      moduloAbierto = null;
    }
  };

  // ============================================================
  // INGRESO
  // ============================================================
  const pintarIngreso = () => {
    const o = II.OPCIONES_INGRESO;
    main.innerHTML = `<div class="contenido angosto"><div class="tarjeta">
      <span class="etiqueta">Diplomado · Instrumentación Industrial</span>
      <h2>${C.titulo}</h2>
      <p class="sub">${C.subtitulo}. Escribe tus datos para entrar.</p>
      <form id="f-ingreso" autocomplete="on">
        <label class="campo"><span>Nombre y apellido</span><input class="entrada" name="nombre" required minlength="3" maxlength="80" autocomplete="name"></label>
        <label class="campo"><span>Carnet de identidad</span><input class="entrada" name="carnet" required minlength="4" maxlength="20" inputmode="numeric" autocomplete="off"></label>
        <label class="campo"><span>¿En qué área trabajas?</span><select class="entrada" name="area" required><option value="">Elige…</option>${o.area.map((a) => `<option>${a}</option>`).join('')}</select></label>
        <label class="campo"><span>¿Has trabajado con instrumentos industriales?</span><select class="entrada" name="experiencia" required><option value="">Elige…</option>${o.experiencia.map((a) => `<option>${a}</option>`).join('')}</select></label>
        <button class="boton primario grande bloque" type="submit">Entrar</button>
      </form>
      <p class="nota" style="margin:14px 0 0">Usa el <b>mismo carnet</b> que en las clases: con él se registra tu nota y se eligen tus preguntas. Solo lo ve el docente.</p>
    </div></div>`;
    II.$('#f-ingreso').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      alumno = {
        nombre: String(f.get('nombre')).trim().replace(/\s+/g, ' '),
        carnet: String(f.get('carnet')).trim().replace(/\s+/g, '').toUpperCase(),
        info: { area: f.get('area'), experiencia: f.get('experiencia') }
      };
      II.guardar('ii-alumno', alumno);
      entrar();
    });
  };
  // ya tiene datos de las clases: confirmar que es la misma persona
  const pintarConfirmar = () => {
    main.innerHTML = `<div class="contenido angosto"><div class="tarjeta">
      <span class="etiqueta">Diplomado · Instrumentación Industrial</span>
      <h2>${C.titulo}</h2>
      <p class="sub">${C.subtitulo}.</p>
      <div class="aviso info">Vas a entrar como <b>${II.esc(alumno.nombre)}</b> · CI <b>${II.esc(alumno.carnet)}</b>.</div>
      <div class="controles"><button class="boton primario grande" id="c-si">Sí, soy yo: entrar</button><button class="boton" id="c-no">No, soy otra persona</button></div>
    </div></div>`;
    II.$('#c-si').onclick = entrar;
    II.$('#c-no').onclick = () => { localStorage.removeItem('ii-alumno'); alumno = null; pintarBarra(); pintarIngreso(); };
  };
  const entrar = async () => {
    II.guardar(k('confirmado'), true);
    pintarBarra();
    if (!local && !II.leer(k('ingreso'))) {
      II.registrarIngreso(SES, alumno).then((r) => { if (r.ok) II.guardar(k('ingreso'), true); });
    }
    await leerSrv();
    sincronizarEval();
    alHash();
  };

  // ============================================================
  // PORTADA: módulos + tarjeta de la evaluación
  // ============================================================
  const tarjetaEval = (v) => {
    const ev = leerEval();
    const n = hechos();
    const titulo = `<span class="etiqueta">Evaluación · ${C.nEval} preguntas · ${C.minutos} minutos · un solo intento</span>`;
    if (ev && ev.enviado) return `${titulo}<h3>✓ Evaluación enviada</h3><p class="sub">Tu nota: <b>${II.fmt(ev.nota, 1)} / 100</b></p><a class="boton primario" href="#eval">Ver mi resultado</a>`;
    if (srv && srv.enviado) return `${titulo}<h3>✓ Ya enviaste tu evaluación</h3><p class="sub">La enviaste desde otro dispositivo; tu nota quedó registrada. Las respuestas solo se ven en ese dispositivo.</p>`;
    if (ev && ev.inicio) return `${titulo}<h3>⏳ Evaluación en curso</h3><p class="sub">Quedan <b data-rol="resta">${II.formatoReloj(Math.max(0, (finEval(ev) - ahora()) / 1000))}</b>. El reloj no se detiene.</p><a class="boton primario grande" href="#eval">Continuar la evaluación</a>`;
    if (srv && srv.inicio) return `${titulo}<h3>⏳ Empezaste la evaluación en otro dispositivo</h3><p class="sub">El reloj sigue corriendo. Puedes continuarla aquí, pero las respuestas marcadas en el otro dispositivo no se traen.</p><a class="boton primario" href="#eval">Continuar aquí</a>`;
    if (v.estado === 'cerrada') return `${titulo}<h3>El plazo terminó</h3><p class="sub">No se registró ninguna evaluación con tu carnet.</p>`;
    if (v.estado !== 'abierta') return `${titulo}<h3>🔒 Todavía no está abierta</h3>`;
    if (n < N) return `${titulo}<h3>🔒 Se habilita al terminar los ${N} módulos</h3><p class="sub">Te falta${N - n > 1 ? 'n' : ''} <b>${N - n}</b>. Marca cada módulo como estudiado al terminarlo.</p>`;
    return `${titulo}<h3>✅ Ya puedes rendir la evaluación</h3><p class="sub">Hazla cuando tengas ${C.minutos} minutos tranquilos y buena conexión.</p><a class="boton primario grande" href="#eval">Ir a la evaluación</a>`;
  };

  const pintarInicio = () => {
    const v = ventana();
    const mods = leerMods();
    const n = hechos();
    let aviso = '';
    if (v.estado === 'abierta' && v.cierra) aviso = `<div class="aviso info">Disponible hasta el <b>${fecha(v.cierra)}</b>.</div>`;
    if (v.estado === 'antes') aviso = `<div class="aviso duda">El control de estudio <b>todavía no está abierto</b>. El docente avisará cuando se habilite.</div>`;
    if (v.estado === 'cerrada') aviso = `<div class="aviso duda">El plazo terminó el <b>${fecha(v.cierra)}</b>. Puedes seguir repasando los módulos, pero ya no se registra nada.</div>`;
    if (v.estado === 'sin-datos') aviso = `<div class="aviso mal">No se pudo leer el estado del control de estudio. Revisa tu conexión y recarga la página.</div>`;
    const bloqueado = v.estado === 'antes' || v.estado === 'sin-datos';
    main.innerHTML = `<div class="contenido angosto" style="max-width:760px">
      ${revision ? barraRevision() : ''}
      <div class="tarjeta">
        <span class="etiqueta">Sesión asíncrona · vale el 10 % de la nota del módulo</span>
        <h2>${C.titulo}</h2>
        <p class="sub">${C.subtitulo}</p>
        ${aviso}
        <ul class="ideas">
          <li><b class="n">1</b><span>Estudia los <b>${N} módulos</b> a tu ritmo (unos 90 minutos en total, puedes hacerlo en varias veces). Cada uno trae reglas de los fabricantes, errores típicos, un caso real y 2 preguntas de práctica sin nota.</span></li>
          <li><b class="n">2</b><span>Al terminar cada módulo, toca <b>«Marcar como estudiado»</b>. Tu avance se guarda en este dispositivo.</span></li>
          <li><b class="n">3</b><span>Con los ${N} módulos se habilita la <b>evaluación</b>: ${C.nEval} preguntas en ${C.minutos} minutos, <b>un solo intento</b>.</span></li>
        </ul>
        <div class="barra-prog" style="margin-top:12px"><div style="width:${(n / N) * 100}%"></div></div>
        <div class="nota" style="text-align:right;margin-top:4px">${n} de ${N} módulos estudiados</div>
      </div>
      <div class="tarjeta"><h3>Módulos</h3>
        <div class="modulos">${C.modulos.map((m) => `
          <button class="modulo-item ${mods[m.n] ? 'hecho' : ''} ${bloqueado ? 'bloqueado' : ''}" data-m="${m.n}" ${bloqueado ? 'disabled' : ''}>
            <span class="n">${mods[m.n] ? '✓' : m.n}</span>
            <span><b>${m.titulo}</b><small class="nota" style="display:block">~${m.min} min${mods[m.n] ? ' · Estudiado' : ''}</small></span>
            <span aria-hidden="true">›</span>
          </button>`).join('')}</div>
      </div>
      <div class="tarjeta" id="t-eval">${tarjetaEval(v)}</div>
    </div>`;
    II.$$('.modulo-item').forEach((b) => b.addEventListener('click', () => { location.hash = 'm' + b.dataset.m; }));
    enlazarRevision();
    vistaInt = setInterval(() => {
      const e = II.$('#t-eval [data-rol=resta]');
      const ev = leerEval();
      if (e && ev && ev.inicio && !ev.enviado) e.textContent = II.formatoReloj(Math.max(0, (finEval(ev) - ahora()) / 1000));
    }, 1000);
  };

  // ============================================================
  // MÓDULO
  // ============================================================
  const fuenteHTML = (clave) => (clave && C.fuentes[clave] ? `<span class="fuente">Fuente: ${II.esc(C.fuentes[clave].t)}</span>` : '');

  const pintarModulo = (n) => {
    const m = C.modulos.find((x) => x.n === n);
    if (!m) { location.hash = ''; return; }
    const v = ventana();
    if (v.estado === 'antes' || v.estado === 'sin-datos') { location.hash = ''; return; }
    moduloAbierto = { n, desde: Date.now() };
    const hecho = !!leerMods()[n];
    const sig = C.modulos.find((x) => x.n === n + 1);
    const fuentes = Array.from(new Set(m.fuentes.concat(m.reglas.map((r) => r[1]).filter(Boolean))));
    main.innerHTML = `<div class="contenido" style="max-width:900px">
      ${revision ? barraRevision() : ''}
      <div class="controles" style="margin-bottom:12px"><a class="boton chico" href="#">◀ Módulos</a><span class="chip acento">Módulo ${n} de ${N}</span><span class="chip">⏱ ~${m.min} min</span>${hecho ? '<span class="chip ok">✓ Estudiado</span>' : ''}</div>
      <div class="tarjeta"><h2>${m.titulo}</h2><p class="sub" style="margin:0"><b>Objetivo:</b> ${m.objetivo}</p></div>
      ${m.vistas.map((vi, i) => `<div class="tarjeta"><h3>${vi.titulo}</h3><div data-vista="${i}"></div></div>`).join('')}
      <div class="tarjeta"><h3>Reglas que piden los fabricantes</h3>
        <ul class="reglas">${m.reglas.map(([t, f]) => `<li>${t}${fuenteHTML(f)}</li>`).join('')}</ul></div>
      <div class="tarjeta"><h3>Errores típicos en planta</h3>
        <div class="tabla-envoltura"><table class="tabla"><tr><th>Lo que se ve</th><th>Causa probable</th></tr>
          ${m.errores.map(([s, c]) => `<tr><td style="white-space:normal">${s}</td><td style="white-space:normal">${c}</td></tr>`).join('')}</table></div></div>
      <div class="tarjeta"><h3>Caso real</h3><p style="margin:0">${m.caso}</p></div>
      <div class="tarjeta"><h3>Práctica (sin nota)</h3><p class="nota" style="margin:0 0 10px">Responde y toca <b>Comprobar</b>: verás al instante si acertaste y por qué.</p>
        ${m.practica.map((q) => `<div class="grupo-campo" data-prac="${q.id}"></div>`).join('')}</div>
      <div class="tarjeta">
        ${fuentes.length ? `<h3>Para leer más (manuales de los fabricantes)</h3><ul style="margin:0 0 14px;padding-left:20px">${fuentes.map((f) => `<li><a href="${C.fuentes[f].url}" target="_blank" rel="noopener">${II.esc(C.fuentes[f].t)}</a></li>`).join('')}</ul>` : ''}
        <div id="marcar"></div>
        <div class="mando" style="margin-top:12px">
          <a class="boton grande" href="${n > 1 ? '#m' + (n - 1) : '#'}">◀ ${n > 1 ? 'Anterior' : 'Módulos'}</a>
          <a class="boton grande" href="${sig ? '#m' + sig.n : '#'}">${sig ? 'Siguiente' : 'Módulos'} ▶</a>
        </div>
      </div>
    </div>`;

    // vistas: texto, escena (tocar letras) o diagrama interactivo de las sesiones
    m.vistas.forEach((vi, i) => {
      const cont = II.$(`[data-vista="${i}"]`);
      if (vi.tipo === 'html') cont.innerHTML = vi.html;
      else if (vi.tipo === 'escena') P.explicarEscena(cont, vi.escena, vi.params || {});
      else if (vi.tipo === 'diagrama' && II.diagramas[vi.nombre]) {
        try { destruibles.push(II.diagramas[vi.nombre](cont, { pestana: 'a' })); }
        catch (e) { cont.innerHTML = '<p class="nota">No se pudo mostrar este diagrama en tu dispositivo.</p>'; }
      }
    });

    // práctica
    const prac = () => II.leer(k('prac'), {});
    const pintarPractica = (q) => {
      const cont = II.$(`[data-prac="${q.id}"]`);
      const inst = P.instancia(q, alumno.carnet);
      const st = prac()[q.id];
      let actual = st ? st.r : null;
      const caja = document.createElement('div');
      cont.innerHTML = '';
      cont.appendChild(caja);
      P.render(caja, inst, actual, { mostrar: !!st, numero: m.practica.indexOf(q) + 1, alCambiar: (val) => { actual = val; } });
      const b = II.html(st ? '<button class="boton chico" style="margin-top:8px">Volver a intentar</button>' : '<button class="boton primario" style="margin-top:10px">Comprobar</button>');
      cont.appendChild(b);
      b.onclick = () => {
        const todo = prac();
        if (st) { delete todo[q.id]; II.guardar(k('prac'), todo); pintarPractica(q); pintarMarcar(); return; }
        if (!P.respondida(inst, actual)) { avisoBreve('Primero responde la pregunta.', 'duda', 2500); return; }
        todo[q.id] = { r: actual, f: P.calificar(inst, actual) };
        II.guardar(k('prac'), todo);
        pintarPractica(q); pintarMarcar();
      };
    };
    m.practica.forEach(pintarPractica);

    // marcar como estudiado
    const pintarMarcar = () => {
      const cont = II.$('#marcar');
      if (!cont) return;
      const ya = !!leerMods()[n];
      const listas = m.practica.filter((q) => prac()[q.id]).length;
      if (ya) { cont.innerHTML = `<div class="aviso ok" style="margin:0">✓ Módulo marcado como estudiado.${sig ? ' Sigue con el módulo ' + sig.n + '.' : ''}</div>`; return; }
      const falta = m.practica.length - listas;
      cont.innerHTML = `<button class="boton primario grande bloque" id="b-marcar" ${falta ? 'disabled' : ''}>✓ Marcar como estudiado</button>
        <p class="nota" style="margin:6px 0 0">${falta ? `Antes, comprueba ${falta === 1 ? 'la pregunta de práctica que falta' : 'las ' + falta + ' preguntas de práctica'}.` : 'Registra que terminaste este módulo.'}</p>`;
      II.$('#b-marcar').onclick = () => marcar(m);
    };
    pintarMarcar();
  };

  const marcar = (m) => {
    const mods = leerMods();
    mods[m.n] = { en: Date.now() };
    II.guardar(k('mods'), mods);
    const seg = II.leer(k('seg'), {});
    const total = (seg[m.n] || 0) + (moduloAbierto ? Math.min(1800, Math.round((Date.now() - moduloAbierto.desde) / 1000)) : 0);
    seg[m.n] = total; II.guardar(k('seg'), seg);
    if (moduloAbierto) moduloAbierto.desde = Date.now();
    const prac = II.leer(k('prac'), {});
    const practica = {};
    m.practica.forEach((q) => { practica[q.id] = prac[q.id] ? Math.round(prac[q.id].f * 100) / 100 : null; });
    if (!local && ventana().estado === 'abierta') {
      II.enviar(registro('mod-' + m.n, { practica, seg: total }, { correcta: true }));
    }
    pintarBarra();
    const sig = C.modulos.find((x) => x.n === m.n + 1);
    const n = hechos();
    avisoBreve(n === N ? `🎉 ¡Terminaste los ${N} módulos! Ya puedes rendir la evaluación.` : `✓ Módulo ${m.n} estudiado (${n} de ${N}).`, 'ok', 4000);
    location.hash = n === N ? '' : sig ? 'm' + sig.n : '';
  };

  // ============================================================
  // EVALUACIÓN
  // ============================================================
  // hora de término (hora del servidor): inicio + minutos, sin pasar el cierre del control (−15 s de margen)
  // (examen: sin límite propio; termina 10 s antes del cierre que pone el docente)
  const finEval = (ev) => {
    if (!ev || !ev.inicio) return null;
    const min = (srv && srv.minutos) || C.minutos;
    let fin = min ? ev.inicio + min * 60000 : null;
    const v = ventana();
    if (v.cierra) fin = Math.min(fin == null ? Infinity : fin, v.cierra - (EX ? 10000 : 15000));
    return fin;
  };
  const pintarAviso = (titulo, texto, clase = 'info') => {
    main.innerHTML = `<div class="contenido angosto">${revision ? barraRevision() : ''}<div class="tarjeta" style="text-align:center">
      <span class="etiqueta">${C.titulo}</span><h2 style="margin-top:6px">${titulo}</h2>
      <div class="aviso ${clase}" style="text-align:left">${texto}</div></div></div>`;
    enlazarRevision();
  };
  const instancias = (ids) => ids.map((id) => P.instancia(C.porId(id), alumno.carnet));

  // ajusta lo guardado en este dispositivo a lo que dice el servidor
  const sincronizarEval = () => {
    const ev = leerEval();
    if (local || !srv || !ev) return;
    if (!srv.inicio && !srv.enviado && ev.inicio) { localStorage.removeItem(k('eval')); return; } // el docente borró los datos de prueba
    if (srv.inicio && ev.inicio !== srv.inicio && !ev.enviado) { ev.inicio = srv.inicio; guardarEval(ev); }
  };

  const pintarEval = async () => {
    if (!local) { await leerSrv(); sincronizarEval(); }
    const ev = leerEval();
    if (ev && ev.enviado) return pintarResultado();
    if (ev && ev.inicio) return pintarEnCurso();
    if (srv && srv.inicio) { // empezó en otro dispositivo: seguir aquí con el mismo reloj
      guardarEval({ ids: C.seleccion(alumno.carnet), resp: {}, inicio: srv.inicio, actual: 0 });
      return pintarEnCurso();
    }
    if (srv && srv.enviado) {
      if (EX) return pintarAviso('✓ Ya enviaste tu examen', 'Lo enviaste desde otro dispositivo y tu nota quedó registrada. La nota y las soluciones se ven en ese dispositivo.', 'ok');
      location.hash = ''; return;
    }
    if (EX) {
      const v = ventana();
      if (v.estado === 'antes') return pintarAviso('⏳ El examen todavía no empieza', 'Espera la indicación del docente. <b>Esta pantalla se actualiza sola</b> cuando se abra el examen.');
      if (v.estado === 'cerrada') return pintarAviso('El examen ya se cerró', 'No se registró ningún examen con tu carnet.', 'duda');
      if (v.estado === 'sin-datos') return pintarAviso('Sin conexión', 'No se pudo leer el estado del examen. Revisa tu conexión y recarga la página.', 'mal');
    }
    pintarIntro();
  };

  const pintarIntro = () => {
    const v = ventana();
    if (v.estado !== 'abierta' || hechos() < N) { if (!EX) location.hash = ''; return; }
    const quedan = v.cierra ? (v.cierra - ahora()) / 60000 : Infinity;
    if (EX) return pintarIntroExamen(v);
    main.innerHTML = `<div class="contenido angosto" style="max-width:760px">
      ${revision ? barraRevision() : ''}
      <div class="tarjeta">
        <span class="etiqueta">Evaluación · un solo intento</span>
        <h2>Evaluación del control de estudio</h2>
        <ul class="ideas">
          <li><b class="n">1</b><span><b>${C.nEval} preguntas</b> de los ${N} módulos: opción múltiple, cálculos cortos, tocar el lugar correcto en un dibujo, encontrar errores y ordenar pasos. Cada carnet recibe preguntas y valores distintos.</span></li>
          <li><b class="n">2</b><span>Tienes <b>${C.minutos} minutos</b> desde que tocas «Empezar». El reloj <b>sigue corriendo</b> aunque cierres la página o se corte la conexión.</span></li>
          <li><b class="n">3</b><span>Puedes moverte entre las preguntas y cambiar tus respuestas hasta enviar. Al llegar a cero, <b>se envía solo</b> lo que tengas marcado.</span></li>
          <li><b class="n">4</b><span>Encontrar errores y ordenar pasos dan <b>puntaje parcial</b>. En los cálculos se acepta un margen de ±2 %.</span></li>
          <li><b class="n">5</b><span>Al enviar verás tu nota. Las soluciones se publican cuando cierre el control.</span></li>
        </ul>
        ${quedan < C.minutos ? `<div class="aviso duda">Faltan solo <b>${Math.max(0, Math.floor(quedan))} minutos</b> para el cierre del control: la evaluación terminará a las ${fecha(v.cierra, false).split(', ').pop()}, aunque no se cumplan los ${C.minutos} minutos.</div>` : ''}
        ${local ? `<div class="aviso info">${revision ? 'Revisión docente' : 'Modo ensayo'}: el reloj corre en este navegador y no se registra nada.</div>` : ''}
        <div id="ev-msg"></div>
        <button class="boton primario grande bloque" id="b-empezar">Empezar la evaluación</button>
        <a class="boton bloque" href="#" style="margin-top:10px;text-align:center">Todavía no: volver a los módulos</a>
      </div></div>`;
    dobleToque(II.$('#b-empezar'), '¿Listo? Toca otra vez: el reloj arranca', empezar, 4000);
  };

  const pintarIntroExamen = (v) => {
    main.innerHTML = `<div class="contenido angosto" style="max-width:760px">
      ${revision ? barraRevision() : ''}
      <div class="tarjeta">
        <span class="etiqueta">Examen final · vale el ${C.peso} % de la nota del módulo · un solo intento</span>
        <h2>${C.titulo}</h2>
        <p class="sub">${II.esc(alumno.nombre)} · CI ${II.esc(alumno.carnet)}</p>
        <ul class="ideas">
          <li><b class="n">1</b><span><b>${C.nEval} preguntas</b> de todo el módulo (2 de cada tema): opción múltiple, cálculos cortos, tocar el lugar correcto en un dibujo y encontrar errores. Cada carnet recibe preguntas y valores distintos.</span></li>
          <li><b class="n">2</b><span>No hay un reloj fijo. Cuando el docente cierre el examen verás una <b>cuenta regresiva</b>; al llegar a cero <b>se envía solo</b> lo que tengas marcado.</span></li>
          <li><b class="n">3</b><span>Puedes moverte entre las preguntas y cambiar tus respuestas hasta enviar. En los cálculos se acepta un margen de ±2 %.</span></li>
          <li><b class="n">4</b><span>Al enviar verás tu <b>nota y las soluciones</b>.</span></li>
        </ul>
        ${v.cierra ? `<div class="aviso duda">El docente ya puso la hora de cierre: quedan <b>${II.formatoReloj(Math.max(0, (v.cierra - ahora()) / 1000))}</b>.</div>` : ''}
        ${local ? `<div class="aviso info">${revision ? 'Revisión docente' : 'Modo ensayo'}: no se registra nada.</div>` : ''}
        <div id="ev-msg"></div>
        <button class="boton primario grande bloque" id="b-empezar">Empezar el examen</button>
      </div></div>`;
    enlazarRevision();
    dobleToque(II.$('#b-empezar'), '¿Listo? Toca otra vez para empezar', empezar, 4000);
  };

  const empezar = async (b) => {
    b.disabled = true; b.textContent = 'Empezando…';
    const msg = (html, clase = 'mal') => { const e = II.$('#ev-msg'); if (e) e.innerHTML = `<div class="aviso ${clase}">${html}</div>`; b.disabled = false; b.textContent = EX ? 'Empezar el examen' : 'Empezar la evaluación'; };
    const ids = C.seleccion(alumno.carnet);
    if (local) {
      guardarEval({ ids, resp: {}, inicio: Date.now(), actual: 0 });
      return pintarEnCurso();
    }
    // el inicio debe quedar en el servidor: su hora es la que cuenta
    let error = null;
    try { ({ error } = await II.sb.from('respuestas').insert(registro('eval-inicio', { ids }))); }
    catch (e) { error = { message: String(e) }; }
    const s = await leerSrv();
    if (s && s.enviado) { if (EX) alHash(); else location.hash = ''; return; }
    if (s && s.inicio) {
      guardarEval({ ids, resp: {}, inicio: s.inicio, actual: 0 });
      return pintarEnCurso();
    }
    if (!error && !s) { // el inicio quedó registrado, pero no se pudo leer la hora del servidor: se usa la de este dispositivo
      guardarEval({ ids, resp: {}, inicio: Date.now(), actual: 0 });
      return pintarEnCurso();
    }
    if (error && (error.code === '42501' || /row-level security/i.test(error.message || ''))) {
      await leerFila();
      return msg(EX ? 'El examen no está abierto en este momento. Recarga la página.' : 'La evaluación no está disponible en este momento (el control está cerrado). Recarga la página.');
    }
    msg('No se pudo empezar: <b>revisa tu conexión</b> e inténtalo otra vez. El reloj todavía no arrancó.');
  };

  // copia automática al servidor (si el celular se apaga, el docente califica con la última copia hecha a tiempo)
  const enviarAvance = () => {
    const ev = leerEval();
    if (local || !ev || !ev.inicio || ev.enviado) return;
    const firma = JSON.stringify(ev.resp);
    if (firma === ultimoAvance || firma === '{}') return;
    ultimoAvance = firma;
    II.enviar(registro('eval-avance', { ids: ev.ids, resp: ev.resp, n: Object.keys(ev.resp).length }));
  };

  const pintarEnCurso = () => {
    const ev = leerEval();
    const insts = instancias(ev.ids);
    let i = Math.min(ev.actual || 0, insts.length - 1);
    main.innerHTML = `<div class="contenido angosto" style="max-width:760px">
      <div class="reloj-eval"><span>Pregunta <b id="ev-n"></b> de ${insts.length} · <span id="ev-cont"></span></span><span class="t" id="ev-t">--:--</span></div>
      <div id="ev-cierre"></div>
      <div class="chips-preg" id="ev-chips">${insts.map((_, j) => `<button type="button" data-j="${j}">${j + 1}</button>`).join('')}</div>
      <div class="tarjeta" id="ev-preg"></div>
      <div class="mando" style="margin-top:12px"><button class="boton grande" id="ev-ant">◀ Anterior</button><button class="boton grande" id="ev-sig">Siguiente ▶</button></div>
      <div class="tarjeta" style="margin-top:16px">
        <button class="boton primario grande bloque" id="ev-enviar">${EX ? 'Enviar examen' : 'Enviar evaluación'}</button>
        <p class="nota" id="ev-faltan" style="margin:8px 0 0"></p>
        ${local ? '' : '<p class="nota" style="margin:6px 0 0">Tus respuestas se guardan en este dispositivo y se copian al servidor mientras avanzas.</p>'}
      </div></div>`;
    const respondidas = () => insts.filter((q) => P.respondida(q, leerEval().resp[q.id])).length;
    const chips = () => {
      const r = leerEval().resp;
      II.$$('#ev-chips button').forEach((b, j) => {
        b.classList.toggle('resp', P.respondida(insts[j], r[insts[j].id]));
        b.classList.toggle('actual', j === i);
      });
      const nr = respondidas();
      II.$('#ev-n').textContent = i + 1;
      II.$('#ev-cont').textContent = nr === 1 ? '1 respondida' : nr + ' respondidas';
      II.$('#ev-faltan').textContent = nr < insts.length ? `Te falta${insts.length - nr > 1 ? 'n' : ''} responder ${insts.length - nr}. Los números en azul ya tienen respuesta.` : 'Respondiste todas. Revisa si quieres y envía.';
      II.$('#ev-ant').disabled = i === 0;
      II.$('#ev-sig').disabled = i === insts.length - 1;
    };
    const mostrar = (j) => {
      if (j !== i) enviarAvance();
      i = Math.max(0, Math.min(insts.length - 1, j));
      const e = leerEval(); e.actual = i; guardarEval(e);
      const q = insts[i];
      P.render(II.$('#ev-preg'), q, e.resp[q.id], {
        numero: i + 1,
        alCambiar: (val) => {
          const x = leerEval();
          if (!x || x.enviado) return;
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
      const x = leerEval();
      if (!x || x.enviado) return;
      const fin = finEval(x);
      const t = II.$('#ev-t'), bc = II.$('#ev-cierre');
      if (fin == null) {
        if (t) { t.textContent = 'sin límite'; t.style.fontSize = '1rem'; t.classList.remove('poco'); }
        if (bc) bc.innerHTML = '';
        return;
      }
      const s = (fin - ahora()) / 1000;
      if (t) { t.textContent = II.formatoReloj(Math.max(0, s)); t.style.fontSize = ''; t.classList.toggle('poco', s < 120); }
      if (bc && EX) bc.innerHTML = `<div class="aviso duda" style="margin:0 0 12px">⏳ <b>El docente cerró el examen.</b> Al llegar a cero se envía solo lo que tengas marcado.</div>`;
    };
    tick();
    vistaInt = setInterval(tick, 500);
  };

  let enviando = false;
  const enviarEval = async (motivo) => {
    const ev = leerEval();
    if (!ev || ev.enviado || enviando) return;
    enviando = true;
    const cal = C.calificar(ev.ids, ev.resp, alumno.carnet);
    Object.assign(ev, { enviado: true, nota: cal.nota, puntos: cal.puntos, motivo, envio: local ? 'local' : 'pendiente', enviadoEn: ahora() });
    guardarEval(ev);
    if (motivo === 'tiempo') avisoBreve(`⏰ Se acabó el tiempo: tu ${EX ? 'examen' : 'evaluación'} se envió con lo que tenías marcado.`, 'duda', 7000);
    if (!local) {
      II.enviar(registro('eval', { ids: ev.ids, resp: ev.resp, puntos: cal.puntos, nota: cal.nota, motivo }, { correcta: cal.nota >= 51, puntaje: cal.nota }));
    }
    enviando = false;
    if (location.hash === '#eval') alHash(); else location.hash = 'eval';
  };

  // ¿la evaluación enviada ya está en el servidor?
  const revisarEnvio = async () => {
    const ev = leerEval();
    if (!ev || !ev.enviado || local || ev.envio === 'ok' || ev.envio === 'rechazada') return;
    const enCola = II.leer('ii-cola-envios', []).some((r) => r.actividad === 'eval' && r.carnet === alumno.carnet && r.sesion === SES);
    if (enCola) { II.vaciarCola(); return; }
    const rech = II.leer('ii-cola-rechazadas', []).some((r) => r.actividad === 'eval' && r.carnet === alumno.carnet && r.sesion === SES);
    const s = await leerSrv();
    const e2 = leerEval();
    if (s && s.enviado) e2.envio = 'ok';
    else if (rech) e2.envio = 'rechazada';
    else return;
    guardarEval(e2);
    const a = II.$('#ev-envio');
    if (a) a.outerHTML = avisoEnvio(e2);
  };
  const avisoEnvio = (ev) => {
    if (ev.envio === 'ok') return `<div class="aviso ok" id="ev-envio">✓ Tu ${EX ? 'examen' : 'evaluación'} quedó <b>registrad${EX ? 'o' : 'a'}</b> en el servidor.</div>`;
    if (ev.envio === 'local') return `<div class="aviso info" id="ev-envio">${revision ? 'Revisión docente' : 'Modo ensayo'}: no se registró nada.</div>`;
    if (ev.envio === 'rechazada') return '<div class="aviso mal" id="ev-envio">⚠ El envío llegó <b>fuera de tiempo</b> y el servidor no lo aceptó. El docente calificará con la última copia automática de tus respuestas que llegó a tiempo.</div>';
    return '<div class="aviso duda" id="ev-envio">⏳ <b>Enviando…</b> No cierres esta página hasta que diga «registrada». Si no tienes conexión, se enviará sola al reconectar.</div>';
  };

  const pintarResultado = () => {
    const ev = leerEval();
    if (!ev || !ev.enviado) { location.hash = ''; return; }
    const v = ventana();
    const verSol = C.solucionesAlEnviar || revision || ensayo || v.estado === 'cerrada';
    const insts = instancias(ev.ids);
    const pts = insts.map((q) => P.calificar(q, ev.resp[q.id]));
    main.innerHTML = `<div class="contenido angosto" style="max-width:760px">
      ${revision ? barraRevision() : ''}
      <div class="tarjeta" style="text-align:center">
        <span class="etiqueta">${EX ? 'Examen enviado' : 'Evaluación enviada'}${ev.motivo === 'tiempo' ? ' al terminar el tiempo' : ''}</span>
        <div class="grande-numero" style="margin:8px 0 0">${II.fmt(ev.nota, 1)}<small style="font-size:.45em;color:var(--texto-3)"> / 100</small></div>
        <p class="sub" style="margin:4px 0 0">Equivale a <b>${II.fmt((ev.nota * C.peso) / 100, 2)} de ${C.peso} puntos</b> de la nota del módulo.</p>
        ${avisoEnvio(ev)}
      </div>
      <div class="tarjeta"><h3>Pregunta por pregunta</h3>
        <div class="chips-preg">${pts.map((p, j) => `<button type="button" class="${p >= 0.999 ? 'ok' : p > 0 ? 'duda' : 'mal'}" data-j="${j}" title="${II.fmt(p * 100, 0)} %">${j + 1}</button>`).join('')}</div>
        <p class="nota" style="margin:0">Verde: correcta · Ámbar: parcial · Rojo: incorrecta o sin responder. Sumaste <b>${II.fmt(pts.reduce((a, b) => a + b, 0), 2)}</b> de ${insts.length} puntos.</p>
        ${verSol ? '' : `<div class="aviso info" style="margin-bottom:0">Las <b>soluciones</b> se publican cuando cierre el control (${v.cierra ? fecha(v.cierra) : C.cierreTexto}). Vuelve a abrir esta página <b>en este mismo dispositivo</b> para verlas con tus respuestas.</div>`}
      </div>
      ${verSol ? `<div id="ev-sol">${insts.map((_, j) => `<div class="tarjeta" data-sol="${j}"></div>`).join('')}</div>` : ''}
      ${EX ? '' : '<a class="boton bloque" href="#" style="margin-top:16px;text-align:center">◀ Volver a los módulos</a>'}
    </div>`;
    if (verSol) {
      insts.forEach((q, j) => P.render(II.$(`[data-sol="${j}"]`), q, ev.resp[q.id], { mostrar: true, numero: j + 1 }));
      II.$$('.chips-preg button').forEach((b) => b.addEventListener('click', () => II.$(`[data-sol="${b.dataset.j}"]`).scrollIntoView({ behavior: 'smooth', block: 'start' })));
    }
    revisarEnvio();
    vistaInt = setInterval(revisarEnvio, 3000);
  };

  // ============================================================
  // REVISIÓN DOCENTE: banco completo y herramientas
  // ============================================================
  const barraRevision = () => `<div class="tarjeta" style="padding:12px 14px;border-color:#f0d9a8;background:var(--duda-claro)">
      <div class="nota" style="color:#8a5a12"><b>Revisión docente:</b> todo está abierto y no se registra nada. Carnet de prueba: <b>${II.esc(alumno.carnet)}</b> (define qué preguntas y valores salen).</div>
      <div class="controles" style="margin-top:8px">
        <a class="boton chico" href="#banco">Ver el banco completo (${C.banco.length} preguntas)</a>
        ${EX ? '' : `<button class="boton chico" data-rev="todos">Marcar los ${N} módulos</button>`}
        <button class="boton chico" data-rev="carnet">Cambiar carnet de prueba</button>
        <button class="boton chico peligro" data-rev="reiniciar">Reiniciar la revisión</button>
      </div></div>`;
  const enlazarRevision = () => {
    II.$$('[data-rev]').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.rev;
      if (a === 'todos') {
        const mods = {}; C.modulos.forEach((m) => { mods[m.n] = { en: Date.now() }; });
        II.guardar(k('mods'), mods); alHash();
      } else if (a === 'carnet') {
        const nuevo = (window.prompt('Carnet de prueba (cambia las preguntas y los valores):', alumno.carnet) || '').trim().toUpperCase();
        if (nuevo) { II.guardar('ii-ce-rev-carnet', nuevo); alumno.carnet = nuevo; alHash(); }
      } else if (a === 'reiniciar') {
        ['mods', 'prac', 'seg', 'eval'].forEach((t) => localStorage.removeItem(k(t)));
        location.hash = ''; alHash();
      }
    }));
  };
  const respuestaCorrecta = (q) => {
    if (q.tipo === 'opcion') return q.c;
    if (q.tipo === 'num') return String(Math.round(q.valor * 1000) / 1000).replace('.', ',');
    if (q.tipo === 'zona') return q.correcta || q.correctas[0];
    if (q.tipo === 'errores') return q.errores.slice();
    if (q.tipo === 'orden') return q.pasos.map((_, j) => j);
    return null;
  };
  const pintarBanco = () => {
    const tipos = { opcion: 'Opción múltiple', num: 'Cálculo', zona: 'Tocar el lugar', errores: 'Encontrar errores', orden: 'Ordenar pasos' };
    main.innerHTML = `<div class="contenido angosto" style="max-width:820px">
      ${barraRevision()}
      <div class="tarjeta"><h2>Banco de la evaluación</h2>
        <p class="sub">${C.banco.length} preguntas. A cada carnet le tocan ${C.nEval}: ${EX ? '2 de cada tema' : '2 de cada módulo y 1 más al azar'}. Las de cálculo cambian sus valores con el carnet (aquí, con el carnet de prueba). Se muestran ya respondidas correctamente.</p>
        <div class="controles">${(C.temas || C.modulos).map((m) => `<a class="boton chico" href="#banco" data-ir="${m.n}">${EX ? 'T' : 'M'}${m.n} (${C.banco.filter((q) => q.mod === m.n).length})</a>`).join('')}</div></div>
      ${(C.temas || C.modulos).map((m) => `<h3 style="margin:22px 0 8px" id="bm-${m.n}">${EX ? 'Tema' : 'Módulo'} ${m.n} · ${m.titulo}</h3>
        ${C.banco.filter((q) => q.mod === m.n).map((q) => `<div class="tarjeta" data-b="${q.id}"></div>`).join('')}`).join('')}
    </div>`;
    C.banco.forEach((q) => {
      const inst = P.instancia(q, alumno.carnet);
      const cont = II.$(`[data-b="${q.id}"]`);
      P.render(cont, inst, respuestaCorrecta(inst), { mostrar: true, numero: q.id, tituloCorreccion: 'Solución.', claseCorreccion: 'info' });
      cont.insertAdjacentHTML('afterbegin', `<div class="nota" style="margin:0 0 6px">${tipos[q.tipo]}</div>`);
    });
    II.$$('[data-ir]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); II.$('#bm-' + a.dataset.ir).scrollIntoView({ behavior: 'smooth' }); }));
    enlazarRevision();
  };

  // ============================================================
  // NAVEGACIÓN (#, #m1 … #m7, #eval, #banco)
  // ============================================================
  const alHash = () => {
    limpiar();
    if (!alumno) return pintarIngreso();
    pintarBarra();
    const h = location.hash.replace('#', '');
    if (/^m\d$/.test(h) && !EX) pintarModulo(+h.slice(1));
    else if (h === 'eval') pintarEval();
    else if (h === 'banco' && revision) pintarBanco();
    else if (EX) pintarEval();
    else pintarInicio();
    window.scrollTo(0, 0);
  };
  window.addEventListener('hashchange', alHash);

  // vigilante general: envía la evaluación al terminar el tiempo (esté donde esté) y copia el avance cada 45 s
  let cuentaAvance = 0;
  setInterval(() => {
    const ev = leerEval();
    if (!alumno || !ev || !ev.inicio || ev.enviado) return;
    const fin = finEval(ev);
    if (fin != null && ahora() >= fin) enviarEval('tiempo');
    else if (++cuentaAvance % 45 === 0) enviarAvance();
  }, 1000);
  // la ventana puede cambiar (el docente la abre o la cierra): se relee cada minuto (examen: cada 5 s)
  setInterval(async () => {
    if (local || !alumno) return;
    const antes = ventana().estado;
    await leerFila();
    if (ventana().estado === antes) return;
    const ev = leerEval();
    if (EX) { if (!(ev && ev.inicio && !ev.enviado)) alHash(); }
    else if (location.hash === '' || location.hash === '#') alHash();
  }, EX ? 5000 : 60000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) enviarAvance(); });

  // ---------- arranque ----------
  const ICONO = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5"/><circle cx="12" cy="16" r="1.4" fill="#fff"/></svg>';
  II.$('#b-icono').innerHTML = ICONO;

  const arrancar = async () => {
    if (revision && II.sb) { // solo el docente puede ver el banco con las soluciones
      const { data } = await II.sb.auth.getSession();
      let ok = false;
      if (data && data.session) {
        const r = await II.sb.from('docentes').select('email');
        ok = !r.error && r.data && r.data.length > 0;
      }
      if (!ok) {
        main.innerHTML = `<div class="contenido angosto"><div class="tarjeta"><h2>Vista solo para el docente</h2>
          <p class="sub">Entra primero al <a href="docente.html?s=${SES}">panel docente</a> en este mismo navegador y vuelve a abrir esta página.</p>
          <a class="boton" href="estudio.html">Ir a la vista del estudiante</a></div></div>`;
        return;
      }
    }
    await leerFila();
    if (!alumno) { pintarBarra(); return pintarIngreso(); }
    if (!revision && !II.leer(k('confirmado'))) { pintarBarra(); return pintarConfirmar(); }
    await leerSrv();
    sincronizarEval();
    alHash();
  };
  arrancar();
})();
