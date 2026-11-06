// ============================================================
// Foro con coevaluación (foro.html) — vista del estudiante
// Fase 1: publica su aporte (una vez). Fase 2: evalúa los 3 aportes que le asigna el servidor
// y valora los comentarios que recibió. Todo con la hora del servidor (RPC foro_estado).
// ============================================================
(function () {
  const II = window.II, F = II.FORO;
  const SES = F.id;
  const main = II.$('#principal');
  let alumno = II.leer(II.claveAlumno(SES));
  const fantasma = () => !!(alumno && alumno.fantasma);   // el docente ensaya sin enviar nada
  let est = null;          // respuesta de foro_estado
  let offset = 0;          // hora del servidor − hora del dispositivo
  let abierta = null;      // id del aporte que se está evaluando
  let reloj = null;
  let cambiando = false;

  const k = (t) => `pl-foro-${t}-${alumno ? alumno.carnet : 'x'}`;
  const ahora = () => Date.now() + offset;
  const fecha = (ms) => (ms ? new Date(ms).toLocaleString('es-BO', { timeZone: 'America/La_Paz', weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '—');
  const ms = (x) => (x ? Date.parse(x) : null);
  const fase = () => {
    if (!est) return 'sin-datos';
    const t = ahora(), ab = ms(est.abre), f1 = ms(est.fase1), f2 = ms(est.fase2);
    if (!ab || t < ab) return 'antes';
    if (t <= f1) return 'f1';
    if (t <= f2) return 'f2';
    return 'fin';
  };
  const restante = (hasta) => {
    const s = Math.max(0, Math.round((hasta - ahora()) / 1000));
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    return d ? `${d} d ${h} h` : h ? `${h} h ${m} min` : `${m} min ${s % 60} s`;
  };
  const avisoBreve = (html, clase = 'info', t = 5000) => {
    const a = II.html(`<div class="aviso ${clase} aviso-flotante">${html}</div>`);
    document.body.appendChild(a); setTimeout(() => a.remove(), t);
  };
  const dobleToque = (b, texto2, accion) => {
    let armado = false; const t1 = b.innerHTML;
    b.addEventListener('click', () => {
      if (b.disabled) return;
      if (!armado) {
        armado = true; b.innerHTML = texto2; b.classList.add('confirmar');
        setTimeout(() => { if (armado && b.isConnected) { armado = false; b.innerHTML = t1; b.classList.remove('confirmar'); } }, 4000);
        return;
      }
      armado = false; b.classList.remove('confirmar'); accion(b);
    });
  };

  // ---------- servidor ----------
  const leerEstado = async () => {
    if (!II.sb || !alumno) return;
    const t0 = Date.now();
    try {
      const { data, error } = await II.sb.rpc('foro_estado', { p_sesion: SES, p_carnet: alumno.carnet });
      if (error) throw error;
      est = data;
      offset = Date.parse(data.ahora) - (t0 + Date.now()) / 2;
      II.marcarConexion(true);
    } catch (e) { II.marcarConexion(false); }
  };
  // inserta directo; si no hay red, queda en la cola y se envía sola al reconectar
  const enviar = async (actividad, respuesta) => {
    if (fantasma()) return 'ok';   // modo ensayo: no se envía nada
    const reg = { sesion: SES, actividad, carnet: alumno.carnet, nombre: alumno.nombre, respuesta, correcta: null, intento: 1, puntaje: 0 };
    let error = null;
    try { ({ error } = await II.sb.from('respuestas').insert(reg)); } catch (e) { error = { message: String(e) }; }
    if (!error) return 'ok';
    if (error.code === '42501' || /row-level security/i.test(error.message || '')) return 'cerrado';
    if (error.code === '23505') return 'ok';
    II.enviar(reg);
    return 'cola';
  };

  // ---------- barra ----------
  II.alCambiarConexion((ok) => { const p = II.$('#b-conexion'); p.className = 'punto-conexion ' + (ok ? 'ok' : 'mal'); });
  const pintarBarra = () => {
    const u = II.$('#b-usuario');
    if (!alumno) { u.innerHTML = ''; return; }
    u.innerHTML = `<span>${II.esc(alumno.nombre)}</span><button class="boton chico" id="b-salir">Salir</button>`;
    dobleToque(II.$('#b-salir'), '¿Seguro? Toca otra vez', () => { localStorage.removeItem(II.claveAlumno(SES)); II.borrarCred(); location.reload(); });
  };

  // ---------- ingreso por lista (carnet + fecha de nacimiento) ----------
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const pintarIngreso = () => {
    const anio = new Date().getFullYear();
    const sel = (name, ini, fin, rotulo, texto) => `<select class="entrada" name="${name}" required><option value="">${rotulo}</option>${Array.from({ length: Math.abs(fin - ini) + 1 }, (_, i) => {
      const v = ini <= fin ? ini + i : ini - i; return `<option value="${v}">${texto ? texto(v) : v}</option>`; }).join('')}</select>`;
    main.innerHTML = `<div class="contenido angosto"><div class="tarjeta">
      <span class="etiqueta">Diplomado en Control Automático Industrial</span><h2>Foro: ${F.titulo}</h2>
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
      entrar();
    });
  };
  const entrar = async () => {
    pintarBarra();
    if (!fantasma() && !II.leer(k('ingreso'))) II.registrarIngreso(SES, alumno).then((r) => { if (r.ok) II.guardar(k('ingreso'), true); });
    await leerEstado();
    pintar();
  };

  // ---------- consigna ----------
  const consigna = () => {
    const m = F.maquina(alumno.carnet);
    return `
    <details class="tarjeta" ${fase() === 'f1' && !(est && est.aporte) ? 'open' : ''}><summary style="cursor:pointer;font-weight:700">📋 Consigna completa y cómo se calcula tu nota</summary>
      <div style="margin-top:10px">
        <p style="margin:0 0 8px"><b>Objetivo:</b> aplicar <b>todo lo que avanzamos en el módulo</b> en un solo proyecto: automatizar una máquina de punta a punta, desde las señales del campo hasta la escalera. Vale el <b>${F.peso} %</b> de la rúbrica.</p>
        <p style="margin:0 0 6px">El foro tiene <b>dos fases, una después de la otra</b>:</p>
        <ul style="margin:0 0 10px;padding-left:20px">
          <li><b>Fase 1; tu aporte:</b> hasta el <b>${fecha(ms(est.fase1))}</b>. Si no publicas tu aporte en esta fase, ya no podrás hacerlo después.</li>
          <li><b>Fase 2; evaluar a tres compañeros:</b> se abre <b>recién cuando cierra la fase 1</b> y dura hasta el <b>${fecha(ms(est.fase2))}</b>.</li>
        </ul>
        <h4 style="margin:12px 0 6px">Fase 1; tu aporte</h4>
        <ol style="margin:0;padding-left:20px;display:grid;gap:6px">
          <li>La plataforma te asignó <b>una máquina con tus propios datos</b> (aparece abajo, en el formulario). Cada compañero tiene una máquina o datos distintos: no se puede copiar.</li>
          <li>Crea un <b>documento en Google Drive</b> (Documentos de Google) con tu trabajo: <b>tabla de direcciones del rack, GRAFCET de nivel 1 y 2, ecuaciones SET y RESET y la escalera</b>. Compártelo con «Cualquier persona con el enlace: Lector».</li>
          <li>Responde las 4 preguntas en sus cuadros, con <b>entre ${F.minPal} y ${F.maxPal} palabras en total</b> (la plataforma las cuenta): resumen de lo que está en tu documento.</li>
          <li>Pega el <b>enlace de Google Drive o Docs</b> (obligatorio): tus compañeros lo abrirán para revisar tu trabajo. Si usaste algo de internet, cita la fuente en el documento.</li>
          <li>Revisa y publica. <b>Una vez publicado no se puede editar.</b> Tu borrador se guarda solo en este dispositivo.</li>
        </ol>
        <h4 style="margin:12px 0 6px">Fase 2; evalúa a tres compañeros</h4>
        <ol style="margin:0;padding-left:20px;display:grid;gap:6px">
          <li>La plataforma te asigna <b>3 aportes</b>, sin el nombre del autor. Abre el enlace de cada uno para revisar su documento.</li>
          <li>En cada uno, califica 4 criterios con <b>0, 1 o 2</b> puntos:
            <ul style="margin:4px 0 0;padding-left:18px">${F.rubrica.map((c) => `<li><b>${c.t}:</b> ${c.d}</li>`).join('')}</ul></li>
          <li>Escribe un <b>comentario de al menos ${F.minComentario} palabras</b>: una pregunta técnica, una mejora o una comparación con tu máquina.</li>
          <li>Verás los comentarios que recibió tu aporte (sin el nombre de quien los escribió) y podrás marcar si te sirvieron 👍 o no 👎.</li>
        </ol>
        <h4 style="margin:12px 0 6px">Cómo se calcula tu nota (100 puntos, automática y definitiva)</h4>
        <ul style="margin:0;padding-left:20px;display:grid;gap:6px">
          <li><b>Tu aporte; hasta 70 puntos</b>
            <ul style="margin:4px 0 0;padding-left:18px">
              <li><b>Cumplimiento (20):</b> llenaste los 4 cuadros (al menos ${F.minCuadro} palabras cada uno) y tu texto tiene entre ${F.minPal} y ${F.maxPal} palabras. Fuera de ese rango pierdes puntos.</li>
              <li><b>Calidad (50):</b> sale de las notas de tus compañeros con la rúbrica. Se usa la <b>mediana</b>: una nota muy alta o muy baja no te afecta.</li>
            </ul></li>
          <li><b>Tu trabajo como evaluador; hasta 30 puntos</b>
            <ul style="margin:4px 0 0;padding-left:18px">
              <li><b>Evaluaciones hechas (15):</b> 5 puntos por cada una de tus 3 evaluaciones con comentario.</li>
              <li><b>Evaluar con criterio (15):</b> tus notas se parecen a las de los otros evaluadores del mismo aporte y tus comentarios le sirvieron al autor.</li>
            </ul></li>
        </ul>
        <p class="nota" style="margin:10px 0 0">Si no publicaste aporte, igual puedes ganar hasta 30 puntos evaluando. Los textos muy parecidos entre compañeros quedan marcados para el docente. Tu máquina: <b>${II.esc(m.nombre)}</b>.</p>
      </div>
    </details>`;
  };

  const cabecera = () => {
    const fz = fase();
    const f1 = ms(est.fase1), f2 = ms(est.fase2);
    const chip = (activa, hecha) => (activa ? 'acento' : hecha ? 'ok' : '');
    let reloj = '';
    if (fz === 'f1') reloj = `La fase 1 cierra en <b data-rol="resta" data-hasta="${f1}">${restante(f1)}</b>.`;
    if (fz === 'f2') reloj = `La fase 2 cierra en <b data-rol="resta" data-hasta="${f2}">${restante(f2)}</b>.`;
    return `<div class="tarjeta">
      <span class="etiqueta">Foro del módulo; vale el ${F.peso} % de la rúbrica${fantasma() ? ' (modo ensayo: no se envía nada)' : ''}</span>
      <h2>${F.titulo}</h2>
      <div class="controles" style="margin:8px 0">
        <span class="chip ${chip(fz === 'f1', fz === 'f2' || fz === 'fin')}">Fase 1; tu aporte; hasta ${fecha(f1)}</span>
        <span class="chip ${chip(fz === 'f2', fz === 'fin')}">Fase 2; evaluar; hasta ${fecha(f2)}</span>
      </div>
      ${reloj ? `<div class="aviso info" style="margin:0">⏳ ${reloj}</div>` : ''}
    </div>`;
  };

  // ---------- fase 1: aporte ----------
  const vistaAporte = (r, titulo = 'Tu aporte') => {
    const m = r.maquina || null;
    const enlace = String(r.enlace || '');
    return `
    <span class="etiqueta">${titulo}</span><h3 style="margin:4px 0 8px">${II.esc(r.titulo || (m && m.nombre) || 'Máquina')}</h3>
    ${m && m.datos ? `<p class="nota" style="margin:0 0 8px">Datos de su máquina: ${II.esc(m.datos)}</p>` : ''}
    ${F.preguntas.map((p, i) => `<p class="nota" style="margin:8px 0 2px"><b>${i + 1}. ${p}</b></p><p style="margin:0;white-space:pre-wrap">${II.esc(r['c' + (i + 1)] || '')}</p>`).join('')}
    ${enlace ? `<p style="margin:10px 0 0">🔗 <a href="${II.esc(F.esDrive(enlace) ? enlace : '#')}" target="_blank" rel="noopener nofollow">Abrir el documento de Google Drive</a></p>` : ''}
    <p class="nota" style="margin:6px 0 0">${r.palabras || F.palabras(['c1', 'c2', 'c3', 'c4'].map((x) => r[x]).join(' '))} palabras</p>`;
  };

  const pintarFormAporte = (cont) => {
    const b = II.leer(k('borrador'), {});
    const maq = F.maquina(alumno.carnet);
    cont.innerHTML = `<div class="tarjeta">
      <span class="etiqueta">Fase 1; tu aporte</span><h3 style="margin:4px 0 10px">Tu máquina: ${II.esc(maq.nombre)}</h3>
      <div class="aviso info" style="margin:0 0 12px"><p style="margin:0 0 6px">${II.esc(maq.que)}</p>
        <b>Tus datos (úsalos en todo el trabajo):</b><ul style="margin:4px 0 0;padding-left:20px">${maq.lista.map((x) => `<li>${x}</li>`).join('')}</ul></div>
      ${F.preguntas.map((p, i) => `<label class="campo"><span>${i + 1}. ${p}</span>
        <textarea class="entrada" data-c="c${i + 1}" rows="5" style="resize:vertical">${II.esc(b['c' + (i + 1)] || '')}</textarea>
        <small class="nota" data-n="c${i + 1}"></small></label>`).join('')}
      <label class="campo"><span><b>Enlace de tu documento en Google Drive o Docs (obligatorio)</b>. Debe empezar con https://docs.google.com o https://drive.google.com y estar compartido con «Cualquier persona con el enlace»</span><input class="entrada" data-c="enlace" inputmode="url" placeholder="https://docs.google.com/document/d/…" value="${II.esc(b.enlace || '')}"></label>
      <div class="nota" data-rol="enlace" style="margin:-4px 0 10px"></div>
      <div class="aviso" data-rol="total" style="margin:0 0 10px"></div>
      <button class="boton primario grande bloque" id="b-publicar">Publicar mi aporte</button>
      <p class="nota" style="margin:6px 0 0">Una vez publicado no se puede editar. El borrador se guarda solo en este dispositivo.</p>
    </div>`;
    const leer = () => {
      const v = {};
      cont.querySelectorAll('[data-c]').forEach((e) => { v[e.dataset.c] = e.type === 'checkbox' ? e.checked : e.value; });
      return v;
    };
    const revisar = () => {
      const v = leer();
      II.guardar(k('borrador'), v);
      const pc = [1, 2, 3, 4].map((i) => F.palabras(v['c' + i]));
      pc.forEach((n, i) => { const e = cont.querySelector(`[data-n="c${i + 1}"]`); e.textContent = `${n} palabras${n < F.minCuadro ? `; mínimo ${F.minCuadro} para el puntaje completo` : ''}`; e.style.color = n < F.minCuadro ? 'var(--duda)' : 'var(--ok)'; });
      const tot = pc.reduce((a, b) => a + b, 0);
      const t = cont.querySelector('[data-rol=total]');
      const enRango = tot >= F.minPal && tot <= F.maxPal;
      t.className = 'aviso ' + (enRango ? 'ok' : 'duda');
      t.innerHTML = `<b>${tot} palabras en total</b>; ${enRango ? 'dentro del rango ✓' : `debe estar entre ${F.minPal} y ${F.maxPal} para el puntaje completo`}`;
      const falta = [];
      if (pc.some((n) => n < F.minPublicar)) falta.push(`al menos ${F.minPublicar} palabras en cada cuadro`);
      const en = v.enlace.trim(), ok = F.esDrive(en);
      const ne = cont.querySelector('[data-rol=enlace]');
      ne.textContent = !en ? '' : ok ? '✓ Enlace de Google válido' : 'El enlace debe ser de Google Drive o Google Docs (https://docs.google.com/… o https://drive.google.com/…)';
      ne.style.color = ok ? 'var(--ok)' : 'var(--duda)';
      if (!ok) falta.push('el enlace de Google Drive o Docs con tu documento');
      const bp = II.$('#b-publicar');
      bp.disabled = falta.length > 0;
      bp.title = falta.length ? 'Falta: ' + falta.join(', ') : '';
      let f = cont.querySelector('[data-rol=falta]');
      if (!f) { f = II.html('<p class="nota" data-rol="falta" style="margin:6px 0 0;color:var(--duda)"></p>'); bp.after(f); }
      f.textContent = falta.length ? 'Para publicar falta: ' + falta.join('; ') + '.' : '';
      return { v, pc, tot };
    };
    cont.querySelectorAll('[data-c]').forEach((e) => e.addEventListener('input', revisar));
    revisar();
    dobleToque(II.$('#b-publicar'), '¿Publicar? Ya no podrás editarlo. Toca otra vez', async (btn) => {
      const { v, pc, tot } = revisar();
      if (btn.disabled) return;
      btn.disabled = true; btn.textContent = 'Publicando…';
      const maq = F.maquina(alumno.carnet);
      const resp = { titulo: maq.nombre, maquina: { id: maq.id, nombre: maq.nombre, datos: maq.textoDatos }, c1: v.c1.trim(), c2: v.c2.trim(), c3: v.c3.trim(), c4: v.c4.trim(), enlace: v.enlace.trim().slice(0, 500), palabras: tot, porCuadro: pc };
      const r = await enviar('foro-aporte', resp);
      if (r === 'cerrado') { avisoBreve('No se pudo publicar: la fase 1 ya cerró o ya publicaste antes.', 'mal', 8000); await leerEstado(); return pintar(); }
      II.guardar(k('publicado'), resp);
      avisoBreve(r === 'cola' ? '⏳ Sin conexión: tu aporte se publicará solo al reconectar. No borres los datos del navegador.' : '✓ ¡Aporte publicado!', r === 'cola' ? 'duda' : 'ok', 7000);
      await leerEstado(); pintar();
    });
  };

  // ---------- fase 2: evaluar ----------
  const pintarEvaluar = (cont) => {
    const asig = est.asignados || [];
    const hechas = new Set((est.hechas || []).map(String));
    if (!asig.length) { cont.innerHTML = '<div class="tarjeta"><p class="nota" style="margin:0">No hay aportes para asignarte.</p></div>'; return; }
    cont.innerHTML = `<div class="tarjeta"><span class="etiqueta">Fase 2; evalúa a tus compañeros</span>
      <h3 style="margin:4px 0 6px">${hechas.size >= asig.length ? '✓ Hiciste todas tus evaluaciones' : `Te faltan ${asig.length - [...hechas].filter((h) => asig.some((a) => String(a.id) === h)).length} de ${asig.length}`}</h3>
      <p class="nota" style="margin:0 0 10px">Los aportes no muestran el nombre del autor. Califica cada criterio con 0, 1 o 2 y escribe un comentario de al menos ${F.minComentario} palabras.</p>
      <div class="modulos">${asig.map((a, i) => `<button class="modulo-item ${hechas.has(String(a.id)) ? 'hecho' : ''}" data-a="${a.id}">
        <span class="n">${hechas.has(String(a.id)) ? '✓' : i + 1}</span><span><b>Aporte ${i + 1}: ${II.esc((a.texto || {}).titulo || 'Máquina')}</b><small class="nota" style="display:block">${hechas.has(String(a.id)) ? 'Evaluado' : 'Pendiente'}</small></span><span>›</span></button>`).join('')}</div>
      <div id="eval-form" style="margin-top:14px"></div></div>`;
    cont.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => { abierta = b.dataset.a; pintarFormEval(); II.$('#eval-form').scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
    if (abierta) pintarFormEval();
  };
  const pintarFormEval = () => {
    const cont = II.$('#eval-form');
    const asig = est.asignados || [];
    const i = asig.findIndex((a) => String(a.id) === String(abierta));
    if (i < 0) { cont.innerHTML = ''; return; }
    const a = asig[i];
    const hecha = (est.hechas || []).map(String).includes(String(a.id));
    const b = II.leer(k('ev-' + a.id), { rub: [null, null, null, null], com: '' });
    cont.innerHTML = `<div class="tarjeta" style="border-color:#c9dbf3">${vistaAporte(a.texto || {}, `Aporte ${i + 1}; autor anónimo`)}</div>
      ${hecha ? '<div class="aviso ok">✓ Ya evaluaste este aporte.</div>' : `
      <div class="tarjeta"><span class="etiqueta">Tu evaluación del aporte ${i + 1}</span>
        ${F.rubrica.map((c, j) => `<div class="grupo-campo"><div class="pregunta" style="margin-bottom:6px"><b>${c.t}</b> <span class="nota">${c.d}</span></div>
          <div class="opciones">${c.n.map((txt, v) => `<label class="opcion ${b.rub[j] === v ? 'elegida' : ''}"><input type="radio" name="r${j}" value="${v}" ${b.rub[j] === v ? 'checked' : ''}><b style="font-family:var(--mono);margin-right:6px">${v}</b> ${txt}</label>`).join('')}</div></div>`).join('')}
        <label class="campo"><span>Tu comentario (al menos ${F.minComentario} palabras): una pregunta técnica, una mejora o una comparación con tu máquina. El autor lo verá sin tu nombre.</span>
          <textarea class="entrada" id="ev-com" rows="5" style="resize:vertical">${II.esc(b.com || '')}</textarea><small class="nota" id="ev-n"></small></label>
        <button class="boton primario grande bloque" id="b-evaluar">Enviar evaluación</button>
        <p class="nota" style="margin:6px 0 0">Una vez enviada no se puede cambiar.</p>
      </div>`}`;
    if (hecha) return;
    const leer = () => ({ rub: F.rubrica.map((_, j) => { const x = cont.querySelector(`input[name=r${j}]:checked`); return x ? +x.value : null; }), com: II.$('#ev-com').value });
    const revisar = () => {
      const v = leer();
      II.guardar(k('ev-' + a.id), v);
      cont.querySelectorAll('.opcion').forEach((o) => o.classList.toggle('elegida', o.querySelector('input').checked));
      const n = F.palabras(v.com);
      const e = II.$('#ev-n'); e.textContent = `${n} palabras${n < F.minComentario ? `; faltan ${F.minComentario - n}` : ' ✓'}`; e.style.color = n < F.minComentario ? 'var(--duda)' : 'var(--ok)';
      II.$('#b-evaluar').disabled = v.rub.some((x) => x == null) || n < F.minComentario;
      return { v, n };
    };
    cont.querySelectorAll('input[type=radio]').forEach((x) => x.addEventListener('change', revisar));
    II.$('#ev-com').addEventListener('input', revisar);
    revisar();
    dobleToque(II.$('#b-evaluar'), '¿Enviar? Ya no podrás cambiarla. Toca otra vez', async (btn) => {
      const { v, n } = revisar();
      if (btn.disabled) return;
      btn.disabled = true; btn.textContent = 'Enviando…';
      const r = await enviar('foro-eval', { aporte: String(a.id), rubrica: v.rub, total: v.rub.reduce((s, x) => s + x, 0), comentario: v.com.trim(), palabras: n });
      if (r === 'cerrado') avisoBreve('No se pudo enviar: la fase 2 ya cerró o ya evaluaste este aporte.', 'mal', 8000);
      else avisoBreve(r === 'cola' ? '⏳ Sin conexión: tu evaluación se enviará sola al reconectar.' : '✓ Evaluación enviada.', r === 'cola' ? 'duda' : 'ok');
      if (r !== 'cerrado') { est.hechas = (est.hechas || []).concat(String(a.id)); localStorage.removeItem(k('ev-' + a.id)); }
      const sig = (est.asignados || []).find((x) => !(est.hechas || []).map(String).includes(String(x.id)));
      abierta = sig ? String(sig.id) : null;
      await leerEstado(); pintar();
    });
  };

  // ---------- comentarios recibidos ----------
  const pintarComentarios = (cont, editable) => {
    const cs = est.comentarios || [];
    cont.innerHTML = `<div class="tarjeta"><span class="etiqueta">Comentarios a tu aporte</span>
      <h3 style="margin:4px 0 8px">${cs.length ? `${cs.length} comentario${cs.length > 1 ? 's' : ''}` : 'Todavía no hay comentarios'}</h3>
      ${cs.length ? '<p class="nota" style="margin:0 0 10px">Marca si cada comentario te sirvió: eso cuenta en la nota de quien lo escribió.</p>' : '<p class="nota" style="margin:0">Aparecerán aquí cuando tus compañeros te evalúen.</p>'}
      ${cs.map((c, i) => `<div class="grupo-campo" style="border-left:3px solid var(--acento);padding-left:12px">
        <div class="nota" style="margin-bottom:4px">Comentario ${i + 1}; anónimo</div>
        <p style="margin:0 0 8px;white-space:pre-wrap">${II.esc(c.comentario || '')}</p>
        <div class="controles">
          <button class="boton chico ${c.util === true ? 'primario' : ''}" data-u="${c.id}" data-v="1" ${editable ? '' : 'disabled'}>👍 Me sirvió</button>
          <button class="boton chico ${c.util === false ? 'peligro confirmar' : ''}" data-u="${c.id}" data-v="0" ${editable ? '' : 'disabled'}>👎 No me sirvió</button>
        </div></div>`).join('')}
    </div>`;
    if (!editable) return;
    cont.querySelectorAll('[data-u]').forEach((b) => b.addEventListener('click', async () => {
      const util = b.dataset.v === '1';
      const c = cs.find((x) => String(x.id) === b.dataset.u);
      if (c) c.util = util;
      pintarComentarios(cont, editable);
      const r = await enviar('foro-util', { eval: String(b.dataset.u), util });
      if (r === 'cerrado') avisoBreve('No se pudo guardar: la fase 2 ya cerró.', 'mal');
    }));
  };

  // ---------- pintado general ----------
  const pintar = () => {
    if (reloj) clearInterval(reloj);
    if (!alumno) return pintarIngreso();
    if (!est) {
      main.innerHTML = '<div class="contenido angosto"><div class="tarjeta"><h2>Sin conexión</h2><div class="aviso mal">No se pudo leer el foro. Revisa tu conexión y recarga la página.</div></div></div>';
      return;
    }
    const fz = fase();
    if (fz === 'antes') {
      main.innerHTML = `<div class="contenido angosto"><div class="tarjeta"><h2>Foro: ${F.titulo}</h2><div class="aviso duda">El foro todavía no está abierto.</div></div></div>`;
      return;
    }
    main.innerHTML = `<div class="contenido angosto" style="max-width:780px">${cabecera()}${consigna()}<div id="z1"></div><div id="z2"></div><div id="z3"></div></div>`;
    const z1 = II.$('#z1'), z2 = II.$('#z2'), z3 = II.$('#z3');
    const local = II.leer(k('publicado'));
    if (fz === 'f1') {
      if (est.aporte) {
        z1.innerHTML = `<div class="aviso ok">✓ <b>Tu aporte está publicado</b> (${est.aporte.palabras || '—'} palabras). La fase 2 se abre el <b>${fecha(ms(est.fase1))}</b>: desde ese momento entra a esta misma página para evaluar a tus compañeros.</div>
          ${local ? `<details class="tarjeta"><summary style="cursor:pointer;font-weight:700">Ver mi aporte</summary><div style="margin-top:8px">${vistaAporte(local)}</div></details>` : ''}`;
      } else pintarFormAporte(z1);
    }
    if (fz === 'f2' || fz === 'fin') {
      const mio = est.aporte && est.aporte.texto ? est.aporte.texto : local;
      z1.innerHTML = est.aporte
        ? (mio ? `<details class="tarjeta"><summary style="cursor:pointer;font-weight:700">Ver mi aporte</summary><div style="margin-top:8px">${vistaAporte(mio)}</div></details>` : '')
        : `<div class="aviso duda">No publicaste aporte en la fase 1. ${fz === 'f2' ? 'Igual puedes ganar hasta 30 puntos evaluando a tus compañeros.' : ''}</div>`;
      if (fz === 'f2') pintarEvaluar(z2);
      else z2.innerHTML = `<div class="tarjeta"><h3 style="margin:0 0 6px">El foro terminó</h3><p class="nota" style="margin:0">Hiciste ${(est.hechas || []).length} evaluación(es). Tu nota la calcula la plataforma y la publicará el docente.</p></div>`;
      if (est.aporte) pintarComentarios(z3, fz === 'f2');
    }
    reloj = setInterval(() => {
      II.$$('[data-rol=resta]').forEach((e) => { e.textContent = restante(+e.dataset.hasta); });
      if (fase() !== fz && !cambiando) { cambiando = true; leerEstado().then(() => { cambiando = false; pintar(); }); } // cambio de fase: se repinta solo
    }, 1000);
  };

  setInterval(async () => {
    // relee cada 2 minutos (comentarios nuevos), sin interrumpir si está escribiendo
    if (!alumno || document.activeElement && /TEXTAREA|INPUT/.test(document.activeElement.tagName)) return;
    const antes = JSON.stringify([est && est.comentarios, est && est.hechas]);
    await leerEstado();
    if (JSON.stringify([est && est.comentarios, est && est.hechas]) !== antes) pintar();
  }, 120000);

  // ---------- arranque ----------
  II.$('#b-icono').innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5"/><circle cx="12" cy="16" r="1.4" fill="#fff"/></svg>';
  (async () => {
    pintarBarra();
    if (!alumno) return pintarIngreso();
    if (!fantasma() && !II.leer(k('ingreso'))) II.registrarIngreso(SES, alumno).then((r) => { if (r.ok) II.guardar(k('ingreso'), true); });
    await leerEstado();
    pintar();
  })();
})();
