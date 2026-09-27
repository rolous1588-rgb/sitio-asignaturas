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

    reto(paso) {
      const R = S.retos[paso.reto];
      const gen = R.generar(II.rng(alumno.carnet + '|' + paso.reto));
      const k = clave('reto', paso.reto);
      let st = II.leer(k, { intentos: 0, mejor: 0, terminado: false, valores: {}, detalle: {}, confianza: null });
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
      let confianza = st.confianza;
      const pintarConfianza = () => II.$$('.confianza button').forEach((b) => b.classList.toggle('activo', b.dataset.c === confianza));
      II.$$('.confianza button').forEach((b) => b.addEventListener('click', () => { if (!st.terminado) { confianza = b.dataset.c; pintarConfianza(); } }));
      gen.campos.forEach((c) => { if (st.valores[c.id] != null) form.elements[c.id].value = st.valores[c.id]; });

      const pintarEstado = () => {
        II.$('#r-intento').textContent = st.terminado ? 'Terminado' : `Intento ${st.intentos + 1} de 2`;
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
          msg.innerHTML = st.correcta
            ? `<div class="aviso ok">¡Correcto! Obtuviste <b>${II.fmt(st.mejor, 1)} de ${R.puntos}</b> puntos.</div>`
            : `<div class="aviso mal">Respuesta registrada: <b>${II.fmt(st.mejor, 1)} de ${R.puntos}</b> puntos. ${libre ? 'Mira la solución abajo.' : 'Veremos la solución en la revisión.'}</div>`;
          if (libre) II.$('#r-sol').innerHTML = `<h3 style="margin-top:16px">Solución con tus valores</h3><div class="solucion">${gen.solucion}</div>`;
        } else if (st.intentos === 1) {
          const ac = Object.values(st.detalle).filter(Boolean).length;
          msg.innerHTML = `<div class="aviso duda">Tienes <b>${ac} de ${gen.campos.length}</b> bien. Corrige las marcadas en rojo: lo que corrijas vale la mitad.<br><b>Pista:</b> ${II.esc(R.pista)}</div>`;
        }
      };

      form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        if (st.terminado) return;
        const valores = {};
        let faltan = false;
        gen.campos.forEach((c) => {
          const v = form.elements[c.id].value;
          valores[c.id] = v;
          if (String(v).trim() === '' || (c.tipo === 'num' && !isFinite(II.num(v)))) faltan = true;
        });
        if (faltan) { II.$('#r-msg').innerHTML = '<div class="aviso mal">Completa todas las respuestas (los números pueden llevar coma o punto decimal).</div>'; return; }
        if (!confianza) { II.$('#r-msg').innerHTML = '<div class="aviso mal">Marca si estás seguro o tienes dudas antes de enviar.</div>'; return; }
        const ver = II.verificarReto(gen, valores);
        const intento = st.intentos + 1;
        // 1er intento: proporcional. 2º intento: lo que ya estaba bien conserva su valor; lo corregido vale la mitad.
        const base = intento === 1
          ? ver.aciertos
          : gen.campos.reduce((a, c) => a + (ver.detalle[c.id] ? (st.detalle[c.id] ? 1 : 0.5) : 0), 0);
        const pts = Math.round(((R.puntos * base) / ver.total) * 10) / 10;
        st = { ...st, intentos: intento, valores, detalle: ver.detalle, confianza, mejor: Math.max(st.mejor, pts), correcta: ver.todo, terminado: ver.todo || intento >= 2 };
        II.guardar(k, st);
        II.$('#r-enviar').disabled = true;
        if (!libre) {
          const r = await II.enviar({ sesion: SES, actividad: paso.reto, carnet: alumno.carnet, nombre: alumno.nombre, respuesta: { valores, aciertos: ver.aciertos, total: ver.total }, correcta: ver.todo, intento, confianza, puntaje: pts });
          if (!r.ok) II.$('#r-sol').innerHTML = '<div class="aviso duda">Sin conexión en este momento: tu respuesta quedó guardada y se enviará sola al reconectar.</div>';
        }
        II.$('#r-enviar').disabled = false;
        pintarEstado();
      });
      pintarEstado();
    },

    revisa(paso) {
      const R = S.retos[paso.reto];
      const gen = R.generar(II.rng(alumno.carnet + '|' + paso.reto));
      const st = II.leer(clave('reto', paso.reto));
      const res = !st || !st.intentos
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
      let total = 0, max = 0;
      Object.entries(S.retos).forEach(([id, R]) => { const st = II.leer(clave('reto', id)); max += R.puntos; if (st) total += st.mejor || 0; });
      main.innerHTML = `<div class="contenido angosto"><div class="tarjeta">${cabecera(paso)}
        <div style="text-align:center;margin:10px 0 18px"><div class="nota">Tu puntaje de hoy</div><div class="grande-numero">${II.fmt(total, 1)} <span style="font-size:1.4rem;color:var(--texto-3)">/ ${max}</span></div></div>
        <ul class="ideas">${paso.ideas.map((t, i) => `<li><b class="n">${i + 1}</b><span>${t}</span></li>`).join('')}</ul>
        <div class="aviso info" style="margin-top:16px">Puedes repasar esta sesión cuando quieras en <a href="clase.html?s=${SES}&modo=libre">modo repaso</a>.</div>
      </div></div>`;
    }
  };

  const mostrarPaso = (paso) => {
    limpiar();
    pasoActual = paso;
    II.$('#b-paso').textContent = II.TIPOS[paso.tipo];
    (render[paso.tipo] || render.espera)(paso);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (libre) pintarNavLibre();
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
    II.$('#nl-sig').disabled = idxLibre === S.pasos.length - 1;
  };
  const irLibre = (i) => {
    idxLibre = Math.max(0, Math.min(S.pasos.length - 1, i));
    II.guardar(clave('libre'), idxLibre);
    mostrarPaso(S.pasos[idxLibre]);
  };

  // ---------- arranque ----------
  const arrancar = async () => {
    pintarBarra();
    if (!alumno) return pintarIngreso();
    if (libre) {
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
    });
  };

  const ICONO = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5"/><circle cx="12" cy="16" r="1.4" fill="#fff"/></svg>';
  II.$('#b-icono').innerHTML = ICONO;
  arrancar();
})();
