// ============================================================
// Vista del estudiante: ingreso, seguimiento del paso, retos
// ============================================================
(function () {
  const II = window.II;
  const SES = II.sesionActual();
  const S = II.SESIONES[SES];
  const libre = II.params.get('modo') === 'libre' || !II.configurado;
  let alumno = II.leer('ii-alumno');
  let pasoActual = null, filaEstado = null, diagrama = null, idxLibre = 0, relojInt = null;
  // actividad en pantalla que se puede cerrar (reto o pregunta rápida): { act, cerrar(motivo) }
  let cerrador = null, cuentaInt = null, cierreVisto = null;
  let limiteLibre = S.pasos.length - 1; // hasta dónde deja avanzar el modo repaso

  const main = II.$('#principal');
  const clave = (tipo, extra = '') => `ii-${tipo}-${SES}-${alumno ? alumno.carnet : 'x'}${extra ? '-' + extra : ''}`;

  // ---------- barra superior ----------
  const pintarBarra = () => {
    II.$('#b-sesion').textContent = `Sesión ${S.numero} · ${S.titulo}`;
    const u = II.$('#b-usuario');
    if (alumno) {
      u.innerHTML = `<span>${II.esc(alumno.nombre)}</span><button class="boton chico" id="b-salir" title="Cambiar de usuario">Salir</button>`;
      II.$('#b-salir').onclick = () => { if (confirmarSalida()) { localStorage.removeItem('ii-alumno'); location.reload(); } };
    } else u.innerHTML = '';
    II.$('#b-modo').innerHTML = libre ? '<span class="chip duda">Modo repaso</span>' : '';
    actualizarPuntos();
  };

  // ---------- puntaje acumulado de hoy (solo lo ve el propio estudiante) ----------
  // Las preguntas rápidas suman recién cuando se cierran (así el puntaje no delata la respuesta).
  const puntosHoy = () => {
    let total = 0, max = 0;
    Object.entries(S.retos).forEach(([id, R]) => { max += R.puntos; const st = II.leer(clave('reto', id)); if (st) total += st.mejor || 0; });
    II.rapidasDe(S).forEach((p) => { max += II.puntosRapida(p); const st = II.leer(clave('rap', p.id)); if (st && st.revelada) total += st.pts || 0; });
    return { total: Math.round(total * 10) / 10, max };
  };
  const actualizarPuntos = () => {
    const e = II.$('#b-puntos');
    if (!e) return;
    if (!alumno || libre) { e.innerHTML = ''; return; }
    const p = puntosHoy();
    e.innerHTML = `<span class="chip ok" title="Tu puntaje de hoy">⭐ ${II.fmt(p.total, 1)} / ${p.max}</span>`;
  };

  // aviso breve abajo de la pantalla
  const avisoBreve = (html, clase = 'info', ms = 6000) => {
    const a = II.html(`<div class="aviso ${clase} aviso-flotante">${html}</div>`);
    document.body.appendChild(a);
    setTimeout(() => a.remove(), ms);
  };
  let salidaArmada = false;
  const confirmarSalida = () => {
    if (salidaArmada) return true;
    salidaArmada = true;
    const b = II.$('#b-salir'); b.textContent = '¿Seguro? Toca otra vez'; b.classList.add('peligro');
    setTimeout(() => { salidaArmada = false; if (II.$('#b-salir')) { II.$('#b-salir').textContent = 'Salir'; II.$('#b-salir').classList.remove('peligro'); } }, 3000);
    return false;
  };
  II.alCambiarConexion((ok) => {
    const p = II.$('#b-conexion');
    p.className = 'punto-conexion ' + (ok ? 'ok' : 'mal');
    p.title = ok ? 'Conectado con la clase' : 'Sin conexión: tus respuestas se guardarán y se enviarán al reconectar';
  });

  // ---------- ingreso ----------
  const pintarIngreso = () => {
    const o = II.OPCIONES_INGRESO;
    main.innerHTML = `
      <div class="contenido angosto">
        <div class="tarjeta">
          <span class="etiqueta">Diplomado · Módulo 1</span>
          <h2>Instrumentación Industrial</h2>
          <p class="sub">Sesión ${S.numero}: ${II.esc(S.titulo)}. Escribe tus datos para entrar a la clase.</p>
          <form id="f-ingreso" autocomplete="on">
            <label class="campo"><span>Nombre y apellido</span><input class="entrada" name="nombre" required minlength="3" maxlength="80" autocomplete="name"></label>
            <label class="campo"><span>Carnet de identidad</span><input class="entrada" name="carnet" required minlength="4" maxlength="20" inputmode="numeric" autocomplete="off"></label>
            <label class="campo"><span>¿En qué área trabajas?</span><select class="entrada" name="area" required><option value="">Elige…</option>${o.area.map((a) => `<option>${a}</option>`).join('')}</select></label>
            <label class="campo"><span>¿Has trabajado con instrumentos industriales?</span><select class="entrada" name="experiencia" required><option value="">Elige…</option>${o.experiencia.map((a) => `<option>${a}</option>`).join('')}</select></label>
            <button class="boton primario grande bloque" type="submit">Entrar a la clase</button>
          </form>
          <p class="nota" style="margin:14px 0 0">Tu carnet se usa para darte ejercicios con valores propios y registrar tu participación. Solo lo ve el docente.</p>
        </div>
      </div>`;
    II.$('#f-ingreso').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      alumno = {
        nombre: String(f.get('nombre')).trim().replace(/\s+/g, ' '),
        carnet: String(f.get('carnet')).trim().replace(/\s+/g, '').toUpperCase(),
        info: { area: f.get('area'), experiencia: f.get('experiencia') }
      };
      II.guardar('ii-alumno', alumno);
      arrancar();
    });
  };

  const registrarSiHaceFalta = async () => {
    if (libre || II.leer(clave('ingreso'))) return;
    const r = await II.registrarIngreso(SES, alumno);
    if (r.ok) II.guardar(clave('ingreso'), true);
  };

  // ---------- helpers de render ----------
  const limpiar = () => {
    if (diagrama && diagrama.destruir) diagrama.destruir();
    diagrama = null;
    if (relojInt) clearInterval(relojInt);
    relojInt = null;
    if (cuentaInt) clearInterval(cuentaInt);
    cuentaInt = null; cierreVisto = null; cerrador = null;
    const b = II.$('#cierre-aviso'); if (b) b.remove();
  };

  // ---------- cierre de la actividad por el docente (cuenta regresiva) ----------
  const vigilarCierre = () => {
    if (libre || !cerrador) return;
    const c = II.cierreDe(filaEstado, cerrador.act);
    if (!c) { // sin cierre o cancelado por el docente
      if (cuentaInt) { clearInterval(cuentaInt); cuentaInt = null; }
      const b = II.$('#cierre-aviso'); if (b) b.remove();
      cierreVisto = null;
      return;
    }
    if (cierreVisto === c.id) return; // ya está corriendo
    cierreVisto = c.id;
    // se cuenta con el reloj de este dispositivo, entre 3 s y los segundos del aviso
    const resta = Math.max(3, II.restaCierre(c) || 0);
    const fin = Date.now() + resta * 1000;
    const tick = () => {
      const s = Math.ceil((fin - Date.now()) / 1000);
      let b = II.$('#cierre-aviso');
      if (s <= 0) {
        clearInterval(cuentaInt); cuentaInt = null;
        if (b) b.remove();
        if (cerrador) cerrador.cerrar('docente');
        return;
      }
      if (!b) { b = II.html('<div id="cierre-aviso" class="aviso duda aviso-flotante"></div>'); document.body.appendChild(b); }
      b.innerHTML = `⏳ <b>${pasoActual && pasoActual.tipo === 'rapida' ? 'La pregunta' : 'El reto'} se cierra en ${s} s.</b> Lo que tengas marcado o escrito se enviará solo.`;
    };
    tick(); cuentaInt = setInterval(tick, 250);
  };
  const cabecera = (paso) => `
    <div class="cabecera-paso">
      <span class="chip acento">${II.TIPOS[paso.tipo]}${paso.ciclo ? ' · Ciclo ' + paso.ciclo : ''}</span>
      <h2>${II.esc(paso.titulo)}</h2>
    </div>`;
  const montarDiagrama = (cont, paso) => {
    const fn = II.diagramas[paso.diagrama];
    if (fn) diagrama = fn(cont, { pestana: 'a' });
  };

  // ---------- pasos ----------
  const render = {
    espera(paso) {
      main.innerHTML = `<div class="contenido angosto"><div class="tarjeta" style="text-align:center">
        <div class="marca-icono" style="margin:0 auto 12px;width:52px;height:52px;border-radius:14px">${ICONO}</div>
        <h2>${II.esc(paso.titulo)}</h2>
        <p class="sub">Hola, <b>${II.esc(alumno.nombre.split(' ')[0])}</b>. ${libre ? 'Estás en modo repaso: avanza con los botones de abajo.' : 'Ya estás registrado. La clase avanzará sola en esta pantalla cuando el docente pase al siguiente paso.'}</p>
        <p class="nota">${II.esc(S.fecha)}</p>
      </div></div>`;
    },

    cuestionario(paso) {
      const st = II.leer(clave('diag'));
      const preg = S.diagnostico;
      main.innerHTML = `<div class="contenido angosto"><div class="tarjeta">${cabecera(paso)}
        <p class="sub">No tiene nota: sirve para que el docente sepa desde dónde empezar. Responde con sinceridad.</p>
        <form id="f-diag">${preg.map((p, i) => `
          <div class="grupo-campo"><div class="pregunta">${i + 1}. ${II.esc(p.t)}</div>
            <div class="opciones">${p.o.map((op, j) => `<label class="opcion"><input type="radio" name="d${i}" value="${j}" required ${st && st.r[i] === j ? 'checked' : ''} ${st ? 'disabled' : ''}>${II.esc(op)}</label>`).join('')}</div>
          </div>`).join('')}
          <div id="diag-res"></div>
          <button class="boton primario grande bloque" type="submit" ${st ? 'disabled' : ''}>${st ? 'Enviado' : 'Enviar diagnóstico'}</button>
        </form></div></div>`;
      const marcar = (r) => {
        II.$$('#f-diag .grupo-campo').forEach((g, i) => {
          II.$$('.opcion', g).forEach((o, j) => {
            if (j === preg[i].c) o.classList.add('elegida');
            if (r[i] === j && j !== preg[i].c) o.style.borderColor = 'var(--mal)';
          });
        });
        const ac = r.filter((x, i) => x === preg[i].c).length;
        II.$('#diag-res').innerHTML = `<div class="aviso ok">¡Gracias! Acertaste <b>${ac} de ${preg.length}</b>. Las respuestas correctas están resaltadas en azul.</div>`;
      };
      if (st) marcar(st.r);
      II.$$('#f-diag .opcion input').forEach((i) => i.addEventListener('change', () => {
        II.$$(`input[name=${i.name}]`).forEach((x) => x.closest('.opcion').classList.toggle('elegida', x.checked));
      }));
      II.$('#f-diag').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const f = new FormData(ev.target);
        const r = preg.map((p, i) => +f.get('d' + i));
        const ac = r.filter((x, i) => x === preg[i].c).length;
        II.guardar(clave('diag'), { r });
        if (!libre) II.enviar({ sesion: SES, actividad: 'diagnostico', carnet: alumno.carnet, nombre: alumno.nombre, respuesta: { r, aciertos: ac }, correcta: ac === preg.length, intento: 1, puntaje: 0 });
        II.$$('#f-diag input').forEach((x) => (x.disabled = true));
        const b = II.$('#f-diag button[type=submit]'); b.disabled = true; b.textContent = 'Enviado';
        marcar(r);
      });
    },

    explica(paso) {
      main.innerHTML = `<div class="contenido"><div class="tarjeta">${cabecera(paso)}
        ${libre ? '' : '<div class="aviso info">📺 Sigue la explicación en la pantalla compartida de Zoom. Aquí tienes las ideas clave como apunte.</div>'}
        <ul class="ideas">${paso.ideas.map((t, i) => `<li><b class="n">${i + 1}</b><span>${t}</span></li>`).join('')}</ul>
        <div style="margin-top:16px"><button class="boton" id="ver-diag">${libre ? 'Mostrar' : 'Ver también en mi dispositivo'}: diagrama interactivo</button></div>
        <div id="diag" style="margin-top:14px"></div></div></div>`;
      II.$('#ver-diag').onclick = (e) => { e.target.remove(); montarDiagrama(II.$('#diag'), paso); };
      if (libre) II.$('#ver-diag').click();
    },

    explora(paso) {
      const hechos = II.leer(clave('guia', paso.id), []);
      main.innerHTML = `<div class="contenido"><div class="tarjeta">${cabecera(paso)}
        <p class="sub">Ahora te toca a ti. Usa el diagrama y trata de responder estas preguntas (no tienen nota).</p>
        <ul class="guia">${paso.guia.map((t, i) => `<li><input type="checkbox" data-i="${i}" ${hechos.includes(i) ? 'checked' : ''}><span>${t}</span></li>`).join('')}</ul>
        </div><div class="tarjeta" id="diag"></div></div>`;
      II.$$('.guia input').forEach((c) => c.addEventListener('change', () => {
        const h = II.$$('.guia input').filter((x) => x.checked).map((x) => +x.dataset.i);
        II.guardar(clave('guia', paso.id), h);
      }));
      montarDiagrama(II.$('#diag'), paso);
    },

    rapida(paso) {
      const k = clave('rap', paso.id);
      const pts = II.puntosRapida(paso);
      let st = II.leer(k, null); // { op, ok, pts, revelada, vacio, auto }
      // cada carnet ve las opciones en otro orden: decir "es la C" no sirve
      const orden = II.mezclar(II.rng(alumno.carnet + '|' + paso.id), paso.o.map((_, i) => i));
      main.innerHTML = `<div class="contenido angosto"><div class="tarjeta">${cabecera(paso)}
        <div class="controles" style="margin:-4px 0 12px"><span class="chip">Vale ${pts} punto${pts > 1 ? 's' : ''}</span><span class="chip">Un solo intento</span></div>
        <div class="pregunta-rapida">${paso.t}</div>
        <div class="opciones" id="rq-op">${orden.map((i) => `<label class="opcion"><input type="radio" name="rq" value="${i}">${paso.o[i]}</label>`).join('')}</div>
        <div id="rq-msg"></div>
        <button class="boton primario grande bloque" id="rq-enviar">Enviar respuesta</button>
      </div></div>`;
      const raiz = II.$('#rq-op');
      const elegida = () => { const x = raiz.querySelector('input:checked'); return x ? +x.value : null; };
      raiz.querySelectorAll('input').forEach((i) => i.addEventListener('change', () => {
        raiz.querySelectorAll('.opcion').forEach((o) => o.classList.toggle('elegida', o.querySelector('input').checked));
        II.$('#rq-msg').innerHTML = '';
      }));

      const pintar = () => {
        const bot = II.$('#rq-enviar');
        raiz.querySelectorAll('input').forEach((i) => {
          const v = +i.value, o = i.closest('.opcion');
          i.disabled = !!st;
          if (st && st.op === v) i.checked = true;
          o.classList.toggle('elegida', !!st && st.op === v && !st.revelada);
          o.classList.toggle('correcta', !!st && st.revelada && v === paso.c);
          o.classList.toggle('errada', !!st && st.revelada && st.op === v && v !== paso.c);
        });
        if (!st) return;
        bot.classList.add('oculto');
        const msg = II.$('#rq-msg');
        if (!st.revelada) {
          msg.innerHTML = '<div class="aviso info">✓ Respuesta registrada. Verás si acertaste cuando el docente cierre la pregunta.</div>';
        } else {
          const cab = st.vacio ? `<b>No respondiste:</b> 0 de ${pts}.`
            : st.ok ? `<b>¡Correcto!</b> +${pts} punto${pts > 1 ? 's' : ''}.` : `<b>Incorrecto:</b> 0 de ${pts}.`;
          msg.innerHTML = `<div class="aviso ${st.ok ? 'ok' : st.vacio ? 'duda' : 'mal'}">${cab}${st.ok ? '' : ` La correcta es: <b>${paso.o[paso.c]}</b>.`}${paso.por ? `<br>${paso.por}` : ''}</div>`;
        }
      };

      const enviarOp = (op, auto) => {
        const ok = op != null && op === paso.c;
        st = { op, ok, pts: ok ? pts : 0, revelada: libre, vacio: op == null, auto: auto || null };
        II.guardar(k, st);
        if (!libre) {
          II.enviar({ sesion: SES, actividad: paso.id, carnet: alumno.carnet, nombre: alumno.nombre,
            respuesta: { opcion: op, auto: auto || null, vacio: op == null }, correcta: ok, intento: 1, confianza: null, puntaje: st.pts })
            .then((r) => {
              const m = II.$('#rq-msg');
              if (!m || !pasoActual || pasoActual.id !== paso.id) return;
              if (r.rechazadas) m.insertAdjacentHTML('beforeend', '<div class="aviso mal">Esta pregunta ya está cerrada: tu respuesta <b>no</b> se registró.</div>');
              else if (!r.ok) m.insertAdjacentHTML('beforeend', '<div class="aviso duda">Sin conexión: tu respuesta quedó guardada y se enviará sola al reconectar.</div>');
            });
        }
      };

      II.$('#rq-enviar').addEventListener('click', () => {
        if (st) return;
        const op = elegida();
        if (op == null) { II.$('#rq-msg').innerHTML = '<div class="aviso mal">Elige una opción antes de enviar.</div>'; return; }
        enviarOp(op);
        pintar();
        actualizarPuntos();
      });

      // cierre (botón del docente o cambio de paso): envía lo marcado y muestra el resultado
      if (!libre) cerrador = {
        act: paso.id,
        cerrar: (motivo) => {
          if (st && st.revelada) return null;
          if (!st) enviarOp(elegida(), motivo);
          st = { ...st, revelada: true };
          II.guardar(k, st);
          pintar();
          actualizarPuntos();
          return st.vacio ? 'Pregunta rápida: no respondiste (0 puntos).'
            : st.ok ? `Pregunta rápida: <b>¡correcta!</b> +${pts}.` : `Pregunta rápida: incorrecta. La correcta era <b>${paso.o[paso.c]}</b>.`;
        }
      };
      pintar();
    },

    reto(paso) {
      const R = S.retos[paso.reto];
      const gen = R.generar(II.rng(alumno.carnet + '|' + paso.reto));
      const k = clave('reto', paso.reto);
      const kb = clave('borr', paso.reto); // borrador: lo escrito sin enviar (sobrevive a una recarga)
      let st = II.leer(k, { intentos: 0, mejor: 0, terminado: false, valores: {}, detalle: {}, confianza: null });
      const borr = II.leer(kb, null);
      main.innerHTML = `<div class="contenido angosto"><div class="tarjeta">${cabecera(paso)}
        <div class="controles" style="margin:-4px 0 12px"><span class="chip">Vale ${R.puntos} puntos</span><span class="chip" id="r-intento"></span><span class="chip">Valores propios de tu carnet</span></div>
        <div class="enunciado">${gen.enunciado}</div>
        <p class="nota" style="margin:-6px 0 12px">Usa coma o punto decimal. No redondees de más: se acepta un margen de ±2 %.</p>
        <form id="f-reto" novalidate>
          ${gen.campos.map((c) => `
            <div class="grupo-campo"><div class="pregunta">${c.pregunta}</div>
            ${c.tipo === 'select'
              ? `<select class="entrada" name="${c.id}"><option value="">Elige…</option>${c.opciones.map((o) => `<option>${II.esc(o)}</option>`).join('')}</select>`
              : `<div class="con-unidad"><input class="entrada" name="${c.id}" inputmode="decimal" autocomplete="off" placeholder="Tu respuesta"><span class="unidad">${II.esc(c.unidad || '')}</span></div>`}
            </div>`).join('')}
          <div class="pregunta" style="font-weight:600;margin-top:4px">¿Qué tan seguro estás de tu respuesta?</div>
          <div class="confianza">
            <button type="button" class="boton seguro" data-c="seguro">Estoy seguro</button>
            <button type="button" class="boton dudas" data-c="dudas">Tengo dudas</button>
          </div>
          <div id="r-msg"></div>
          <button class="boton primario grande bloque" type="submit" id="r-enviar">Enviar respuesta</button>
        </form>
        <div id="r-sol"></div>
      </div></div>`;

      const form = II.$('#f-reto');
      let confianza = st.confianza || (!st.terminado && borr ? borr.confianza : null);
      const leerValores = () => { const v = {}; gen.campos.forEach((c) => { v[c.id] = form.elements[c.id].value; }); return v; };
      const guardarBorrador = () => { if (!st.terminado) II.guardar(kb, { valores: leerValores(), confianza }); };
      const pintarConfianza = () => II.$$('.confianza button').forEach((b) => b.classList.toggle('activo', b.dataset.c === confianza));
      II.$$('.confianza button').forEach((b) => b.addEventListener('click', () => { if (!st.terminado) { confianza = b.dataset.c; pintarConfianza(); guardarBorrador(); } }));
      const iniciales = !st.terminado && borr && borr.valores ? borr.valores : st.valores;
      gen.campos.forEach((c) => { if (iniciales[c.id] != null) form.elements[c.id].value = iniciales[c.id]; });
      form.addEventListener('input', guardarBorrador);
      form.addEventListener('change', guardarBorrador);

      const pintarEstado = () => {
        II.$('#r-intento').textContent = st.terminado ? (st.cerradoPor ? 'Cerrado' : 'Terminado') : `Intento ${st.intentos + 1} de 2`;
        gen.campos.forEach((c) => {
          const e = form.elements[c.id];
          e.classList.remove('ok', 'mal');
          if (st.intentos > 0 && st.detalle[c.id] != null) e.classList.add(st.detalle[c.id] ? 'ok' : 'mal');
          e.disabled = st.terminado;
        });
        pintarConfianza();
        const msg = II.$('#r-msg');
        const bot = II.$('#r-enviar');
        if (st.terminado) {
          bot.classList.add('oculto');
          II.$$('.confianza button').forEach((b) => (b.disabled = true));
          const nota = `<b>${II.fmt(st.mejor, 1)} de ${R.puntos}</b> puntos`;
          msg.innerHTML = st.vacio
            ? `<div class="aviso duda">El reto se cerró sin que enviaras respuesta: ${nota}. ${libre ? '' : 'Veremos la solución en la revisión.'}</div>`
            : st.correcta
              ? `<div class="aviso ok">¡Correcto! Obtuviste ${nota}.</div>`
              : `<div class="aviso mal">${st.cerradoPor ? 'El reto se cerró y se envió lo que tenías: ' : 'Respuesta registrada: '}${nota}. ${libre ? 'Mira la solución abajo.' : 'Veremos la solución en la revisión.'}</div>`;
          if (libre) II.$('#r-sol').innerHTML = `<h3 style="margin-top:16px">Solución con tus valores</h3><div class="solucion">${gen.solucion}</div>`;
        } else if (st.intentos === 1) {
          const ac = Object.values(st.detalle).filter(Boolean).length;
          msg.innerHTML = `<div class="aviso duda">Tienes <b>${ac} de ${gen.campos.length}</b> bien. Corrige las marcadas en rojo: lo que corrijas vale la mitad.<br><b>Pista:</b> ${II.esc(R.pista)}</div>`;
        }
      };

      // califica y registra un intento (también lo usa el cierre automático)
      const registrar = (valores, motivo) => {
        const ver = II.verificarReto(gen, valores);
        const intento = st.intentos + 1;
        // 1er intento: proporcional. 2º intento: lo que ya estaba bien conserva su valor; lo corregido vale la mitad.
        const base = intento === 1
          ? ver.aciertos
          : gen.campos.reduce((a, c) => a + (ver.detalle[c.id] ? (st.detalle[c.id] ? 1 : 0.5) : 0), 0);
        const pts = Math.round(((R.puntos * base) / ver.total) * 10) / 10;
        const vacio = !!motivo && st.intentos === 0 && gen.campos.every((c) => String(valores[c.id] || '').trim() === '');
        st = { ...st, intentos: intento, valores, detalle: ver.detalle, confianza, mejor: Math.max(st.mejor, pts), correcta: ver.todo,
          terminado: !!motivo || ver.todo || intento >= 2, cerradoPor: motivo || null, vacio };
        II.guardar(k, st);
        II.guardar(kb, null);
        if (libre) return Promise.resolve({ ok: true });
        return II.enviar({ sesion: SES, actividad: paso.reto, carnet: alumno.carnet, nombre: alumno.nombre,
          respuesta: { valores, aciertos: ver.aciertos, total: ver.total, auto: motivo || null, vacio },
          correcta: ver.todo, intento, confianza: confianza || null, puntaje: pts });
      };
      const avisarEnvio = (r) => {
        const sol = II.$('#r-sol');
        if (!sol || !pasoActual || pasoActual.id !== paso.id) return;
        if (r.rechazadas) sol.innerHTML = '<div class="aviso mal">Este reto ya está cerrado: tu respuesta <b>no</b> se registró.</div>';
        else if (!r.ok) sol.innerHTML = '<div class="aviso duda">Sin conexión en este momento: tu respuesta quedó guardada y se enviará sola al reconectar.</div>';
      };

      form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        if (st.terminado) return;
        const valores = leerValores();
        const faltan = gen.campos.some((c) => String(valores[c.id]).trim() === '' || (c.tipo === 'num' && !isFinite(II.num(valores[c.id]))));
        if (faltan) { II.$('#r-msg').innerHTML = '<div class="aviso mal">Completa todas las respuestas (los números pueden llevar coma o punto decimal).</div>'; return; }
        if (!confianza) { II.$('#r-msg').innerHTML = '<div class="aviso mal">Marca si estás seguro o tienes dudas antes de enviar.</div>'; return; }
        II.$('#r-enviar').disabled = true;
        const envio = registrar(valores);
        pintarEstado();
        actualizarPuntos();
        const r = await envio;
        avisarEnvio(r);
        if (II.$('#r-enviar')) II.$('#r-enviar').disabled = false;
      });

      // cierre (botón del docente o cambio de paso): envía lo que haya escrito, aunque esté incompleto
      if (!libre) cerrador = {
        act: paso.reto,
        cerrar: (motivo) => {
          if (st.terminado) return null;
          const valores = leerValores();
          const sinCambios = st.intentos > 0 && gen.campos.every((c) => String(valores[c.id]) === String(st.valores[c.id] ?? ''));
          if (sinCambios) { // ya había enviado un intento y no cambió nada: queda ese puntaje
            st = { ...st, terminado: true, cerradoPor: motivo };
            II.guardar(k, st); II.guardar(kb, null);
          } else {
            registrar(valores, motivo).then(avisarEnvio);
          }
          pintarEstado();
          actualizarPuntos();
          return `${II.esc(R.titulo.split('·')[0].trim())}: ${st.vacio ? 'se cerró sin respuesta' : 'se envió lo que tenías'} → <b>${II.fmt(st.mejor, 1)} de ${R.puntos}</b> puntos.`;
        }
      };
      pintarEstado();
    },

    revisa(paso) {
      const R = S.retos[paso.reto];
      const gen = R.generar(II.rng(alumno.carnet + '|' + paso.reto));
      const st = II.leer(clave('reto', paso.reto));
      const res = !st || !st.intentos || st.vacio
        ? '<div class="aviso duda">No enviaste este reto. Igual revisa la solución con tus valores.</div>'
        : st.correcta
          ? `<div class="aviso ok">Lo resolviste bien: <b>${II.fmt(st.mejor, 1)} de ${R.puntos}</b> puntos.</div>`
          : `<div class="aviso mal">Obtuviste <b>${II.fmt(st.mejor, 1)} de ${R.puntos}</b> puntos. Compara tu procedimiento con la solución.</div>`;
      main.innerHTML = `<div class="contenido angosto"><div class="tarjeta">${cabecera(paso)}
        ${res}
        <div class="enunciado">${gen.enunciado}</div>
        <h3>Solución con tus valores</h3>
        <div class="solucion">${gen.solucion}</div>
        <div class="aviso info"><b>Error frecuente:</b> ${II.esc(R.errorComun)}</div>
      </div></div>`;
    },

    pausa(paso) {
      main.innerHTML = `<div class="contenido angosto"><div class="tarjeta" style="text-align:center">
        <span class="chip acento">Pausa</span>
        <h2 style="margin-top:10px">Volvemos en</h2>
        <div class="grande-numero" id="reloj" style="font-size:4rem;margin:10px 0">${paso.minutos}:00</div>
        <p class="nota">No cierres esta página: la clase continuará aquí.</p>
      </div></div>`;
      const inicio = filaEstado && filaEstado.paso === paso.id ? new Date(filaEstado.actualizado).getTime() : Date.now();
      const tick = () => { const e = II.$('#reloj'); if (e) e.textContent = II.formatoReloj(paso.minutos * 60 - (Date.now() - inicio) / 1000); };
      tick(); relojInt = setInterval(tick, 1000);
    },

    cierre(paso) {
      const { total, max } = puntosHoy();
      main.innerHTML = `<div class="contenido angosto"><div class="tarjeta">${cabecera(paso)}
        <div style="text-align:center;margin:10px 0 18px"><div class="nota">Tu puntaje de hoy</div><div class="grande-numero">${II.fmt(total, 1)} <span style="font-size:1.4rem;color:var(--texto-3)">/ ${max}</span></div></div>
        <ul class="ideas">${paso.ideas.map((t, i) => `<li><b class="n">${i + 1}</b><span>${t}</span></li>`).join('')}</ul>
        <div class="aviso info" style="margin-top:16px">Puedes repasar esta sesión cuando quieras en <a href="clase.html?s=${SES}&modo=libre">modo repaso</a>.</div>
      </div></div>`;
    }
  };

  const mostrarPaso = (paso) => {
    // red de seguridad: si la clase avanza con un reto o pregunta sin cerrar, se envía lo que haya
    let resumen = null;
    if (!libre && cerrador && pasoActual && pasoActual.id !== paso.id) {
      try { resumen = cerrador.cerrar('avance'); } catch (e) { /* no debe impedir el cambio de paso */ }
    }
    limpiar();
    pasoActual = paso;
    II.$('#b-paso').textContent = II.TIPOS[paso.tipo];
    (render[paso.tipo] || render.espera)(paso);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (libre) pintarNavLibre();
    if (resumen) avisoBreve(resumen, 'info', 7000);
    actualizarPuntos();
    vigilarCierre();
  };

  // ---------- modo repaso: navegación libre ----------
  const pintarNavLibre = () => {
    let nav = II.$('#nav-libre');
    if (!nav) {
      nav = II.html(`<div id="nav-libre" class="barra" style="position:sticky;bottom:0;top:auto;border-top:1px solid var(--borde);border-bottom:0">
        <div class="barra-interior" style="justify-content:space-between">
          <button class="boton" id="nl-ant">◀ Atrás</button><span class="nota" id="nl-pos" style="white-space:nowrap"></span><button class="boton primario" id="nl-sig">Siguiente ▶</button>
        </div></div>`);
      document.body.appendChild(nav);
      II.$('#nl-ant').onclick = () => irLibre(idxLibre - 1);
      II.$('#nl-sig').onclick = () => irLibre(idxLibre + 1);
    }
    II.$('#nl-pos').textContent = `${idxLibre + 1} / ${S.pasos.length}`;
    II.$('#nl-ant').disabled = idxLibre === 0;
    II.$('#nl-sig').disabled = idxLibre >= limiteLibre;
    if (idxLibre >= limiteLibre && limiteLibre < S.pasos.length - 1) {
      main.insertAdjacentHTML('beforeend', `<div class="contenido angosto" style="padding-top:0"><div class="aviso info" style="margin:0"><b>Hasta aquí llegó la clase.</b> Los temas siguientes se abrirán en el repaso cuando los veamos en clase.</div></div>`);
    }
  };
  const irLibre = (i) => {
    idxLibre = Math.max(0, Math.min(limiteLibre, i));
    II.guardar(clave('libre'), idxLibre);
    mostrarPaso(S.pasos[idxLibre]);
  };

  // ---------- arranque ----------
  const arrancar = async () => {
    pintarBarra();
    if (!alumno) return pintarIngreso();
    if (libre) {
      main.innerHTML = '<div class="contenido angosto"><div class="tarjeta"><p class="sub" style="margin:0">Cargando el repaso…</p></div></div>';
      const rep = await II.leerRepaso(SES);
      if (rep.cerrado) {
        main.innerHTML = `<div class="contenido angosto"><div class="tarjeta" style="text-align:center">
          <span class="chip duda">Modo repaso</span>
          <h2 style="margin-top:10px">El repaso de esta sesión está cerrado</h2>
          <p class="sub">El docente lo cerró por el momento. Vuelve a intentarlo más tarde.</p>
          <a class="boton" href="index.html">Volver al módulo</a></div></div>`;
        return;
      }
      const j = rep.hasta ? II.indicePaso(SES, rep.hasta) : -1;
      limiteLibre = j >= 0 ? j : S.pasos.length - 1;
      idxLibre = II.leer(clave('libre'), 0) || 0;
      return irLibre(idxLibre);
    }
    main.innerHTML = '<div class="contenido angosto"><div class="tarjeta"><p class="sub" style="margin:0">Conectando con la clase…</p></div></div>';
    registrarSiHaceFalta();
    const aviso = setTimeout(() => {
      if (!pasoActual) main.innerHTML = `<div class="contenido angosto"><div class="tarjeta"><h2>No logramos conectar con la clase</h2>
        <p class="sub">Revisa tu internet y recarga la página. Si el problema sigue, puedes avanzar por tu cuenta.</p>
        <div class="controles"><button class="boton primario" onclick="location.reload()">Reintentar</button><a class="boton" href="clase.html?s=${SES}&modo=libre">Continuar en modo repaso</a></div></div></div>`;
    }, 9000);
    II.seguirEstado(SES, (fila) => {
      clearTimeout(aviso);
      filaEstado = fila;
      const paso = S.pasos.find((p) => p.id === fila.paso) || S.pasos[0];
      if (!pasoActual || paso.id !== pasoActual.id) mostrarPaso(paso);
      else vigilarCierre(); // mismo paso: puede haber empezado o cancelado un cierre
    });
  };

  const ICONO = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5"/><circle cx="12" cy="16" r="1.4" fill="#fff"/></svg>';
  II.$('#b-icono').innerHTML = ICONO;
  arrancar();
})();
