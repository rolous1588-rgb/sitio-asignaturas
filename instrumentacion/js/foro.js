// ============================================================
// Foro con coevaluación (foro.html) — vista del estudiante
// Fase 1: publica su aporte (una vez). Fase 2: evalúa los 3 aportes que le asigna el servidor
// y valora los comentarios que recibió. Todo con la hora del servidor (RPC foro_estado).
// ============================================================
(function () {
  const II = window.II, F = II.FORO;
  const SES = F.id;
  const main = II.$('#principal');
  let alumno = II.leer('ii-alumno');
  let est = null;          // respuesta de foro_estado
  let offset = 0;          // hora del servidor − hora del dispositivo
  let abierta = null;      // id del aporte que se está evaluando
  let reloj = null;
  let cambiando = false;

  const k = (t) => `ii-foro-${t}-${alumno ? alumno.carnet : 'x'}`;
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
    dobleToque(II.$('#b-salir'), '¿Seguro? Toca otra vez', () => { localStorage.removeItem('ii-alumno'); location.reload(); });
  };

  // ---------- ingreso ----------
  const pintarIngreso = () => {
    const o = II.OPCIONES_INGRESO;
    main.innerHTML = `<div class="contenido angosto"><div class="tarjeta">
      <span class="etiqueta">Diplomado · Instrumentación Industrial</span><h2>Foro: ${F.titulo}</h2>
      <p class="sub">Escribe tus datos para entrar. Usa el <b>mismo carnet</b> que en las clases.</p>
      <form id="f-ingreso">
        <label class="campo"><span>Nombre y apellido</span><input class="entrada" name="nombre" required minlength="3" maxlength="80" autocomplete="name"></label>
        <label class="campo"><span>Carnet de identidad</span><input class="entrada" name="carnet" required minlength="4" maxlength="20" inputmode="numeric" autocomplete="off"></label>
        <label class="campo"><span>¿En qué área trabajas?</span><select class="entrada" name="area" required><option value="">Elige…</option>${o.area.map((a) => `<option>${a}</option>`).join('')}</select></label>
        <label class="campo"><span>¿Has trabajado con instrumentos industriales?</span><select class="entrada" name="experiencia" required><option value="">Elige…</option>${o.experiencia.map((a) => `<option>${a}</option>`).join('')}</select></label>
        <button class="boton primario grande bloque" type="submit">Entrar</button>
      </form></div></div>`;
    II.$('#f-ingreso').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      alumno = { nombre: String(f.get('nombre')).trim().replace(/\s+/g, ' '), carnet: String(f.get('carnet')).trim().replace(/\s+/g, '').toUpperCase(), info: { area: f.get('area'), experiencia: f.get('experiencia') } };
      II.guardar('ii-alumno', alumno);
      entrar();
    });
  };
  const pintarConfirmar = () => {
    main.innerHTML = `<div class="contenido angosto"><div class="tarjeta">
      <span class="etiqueta">Diplomado · Instrumentación Industrial</span><h2>Foro: ${F.titulo}</h2>
      <div class="aviso info">Vas a entrar como <b>${II.esc(alumno.nombre)}</b> · CI <b>${II.esc(alumno.carnet)}</b>.</div>
      <div class="controles"><button class="boton primario grande" id="c-si">Sí, soy yo: entrar</button><button class="boton" id="c-no">No, soy otra persona</button></div>
    </div></div>`;
    II.$('#c-si').onclick = entrar;
    II.$('#c-no').onclick = () => { localStorage.removeItem('ii-alumno'); alumno = null; pintarBarra(); pintarIngreso(); };
  };
  const entrar = async () => {
    II.guardar(k('confirmado'), true);
    pintarBarra();
    if (!II.leer(k('ingreso'))) II.registrarIngreso(SES, alumno).then((r) => { if (r.ok) II.guardar(k('ingreso'), true); });
    await leerEstado();
    pintar();
  };

  // ---------- consigna ----------
  const consigna = () => `
    <details class="tarjeta" ${fase() === 'f1' && !(est && est.aporte) ? 'open' : ''}><summary style="cursor:pointer;font-weight:700">📋 Consigna completa y cómo se calcula tu nota</summary>
      <div style="margin-top:10px">
        <p style="margin:0 0 8px"><b>Objetivo:</b> aplicar lo visto en el módulo a una medición real. Vale el <b>${F.peso} %</b> de la nota del módulo.</p>
        <p style="margin:0 0 6px">El foro tiene <b>dos fases, una después de la otra</b>:</p>
        <ul style="margin:0 0 10px;padding-left:20px">
          <li><b>Fase 1 · Tu aporte:</b> hasta el <b>${fecha(ms(est.fase1))}</b>. Si no publicas tu aporte en esta fase, ya no podrás hacerlo después.</li>
          <li><b>Fase 2 · Evaluar a tres compañeros:</b> se abre <b>recién cuando cierra la fase 1</b> y dura hasta el <b>${fecha(ms(est.fase2))}</b>.</li>
        </ul>
        <h4 style="margin:12px 0 6px">Fase 1 · Tu aporte</h4>
        <ol style="margin:0;padding-left:20px;display:grid;gap:6px">
          <li>Elige un instrumento que hayas visto en tu trabajo, en tu casa, en la ciudad o en una foto con su fuente (un medidor de agua, el sensor de temperatura de un auto, un manómetro de garrafa, un tanque elevado, una planta industrial…).</li>
          <li>Responde las 4 preguntas, cada una en su cuadro, con <b>entre ${F.minPal} y ${F.maxPal} palabras en total</b> (la plataforma las cuenta).</li>
          <li>Foto o esquema (opcional): pega el <b>enlace</b> (Google Drive o Google Fotos compartido). Si usaste algo de internet, el enlace de la fuente es <b>obligatorio</b>. Si todo es tuyo, marca «Todo es de mi autoría».</li>
          <li>Revisa y publica. <b>Una vez publicado no se puede editar.</b> Tu borrador se guarda solo en este dispositivo.</li>
        </ol>
        <h4 style="margin:12px 0 6px">Fase 2 · Evalúa a tres compañeros</h4>
        <ol style="margin:0;padding-left:20px;display:grid;gap:6px">
          <li>La plataforma te asigna <b>3 aportes al azar</b>, sin el nombre del autor.</li>
          <li>En cada uno, califica 4 criterios con <b>0, 1 o 2</b> puntos:
            <ul style="margin:4px 0 0;padding-left:18px">${F.rubrica.map((c) => `<li><b>${c.t}:</b> ${c.d}</li>`).join('')}</ul></li>
          <li>Escribe un <b>comentario de al menos ${F.minComentario} palabras</b>: una pregunta técnica, una mejora o una comparación con tu instrumento.</li>
          <li>Verás los comentarios que recibió tu aporte (sin el nombre de quien los escribió) y podrás marcar si te sirvieron 👍 o no 👎.</li>
        </ol>
        <h4 style="margin:12px 0 6px">Cómo se calcula tu nota (100 puntos, automática y definitiva)</h4>
        <ul style="margin:0;padding-left:20px;display:grid;gap:6px">
          <li><b>Tu aporte · hasta 70 puntos</b>
            <ul style="margin:4px 0 0;padding-left:18px">
              <li><b>Cumplimiento (20):</b> llenaste los 4 cuadros (al menos ${F.minCuadro} palabras cada uno) y tu texto tiene entre ${F.minPal} y ${F.maxPal} palabras. Fuera de ese rango pierdes puntos.</li>
              <li><b>Calidad (50):</b> sale de las notas de tus compañeros con la rúbrica. Se usa la <b>mediana</b>: una nota muy alta o muy baja no te afecta.</li>
            </ul></li>
          <li><b>Tu trabajo como evaluador · hasta 30 puntos</b>
            <ul style="margin:4px 0 0;padding-left:18px">
              <li><b>Evaluaciones hechas (15):</b> 5 puntos por cada una de tus 3 evaluaciones con comentario.</li>
              <li><b>Evaluar con criterio (15):</b> tus notas se parecen a las de los otros evaluadores del mismo aporte y tus comentarios le sirvieron al autor.</li>
            </ul></li>
        </ul>
        <p class="nota" style="margin:10px 0 0">Si no publicaste aporte, igual puedes ganar hasta 30 puntos evaluando. No se aceptan copias de internet sin citar la fuente; los textos muy parecidos entre compañeros quedan marcados para el docente.</p>
      </div>
    </details>`;

  const cabecera = () => {
    const fz = fase();
    const f1 = ms(est.fase1), f2 = ms(est.fase2);
    const chip = (activa, hecha) => (activa ? 'acento' : hecha ? 'ok' : '');
    let reloj = '';
    if (fz === 'f1') reloj = `La fase 1 cierra en <b data-rol="resta" data-hasta="${f1}">${restante(f1)}</b>.`;
    if (fz === 'f2') reloj = `La fase 2 cierra en <b data-rol="resta" data-hasta="${f2}">${restante(f2)}</b>.`;
    return `<div class="tarjeta">
      <span class="etiqueta">Foro del módulo · vale el ${F.peso} %</span>
      <h2>${F.titulo}</h2>
      <div class="controles" style="margin:8px 0">
        <span class="chip ${chip(fz === 'f1', fz === 'f2' || fz === 'fin')}">Fase 1 · Tu aporte · hasta ${fecha(f1)}</span>
        <span class="chip ${chip(fz === 'f2', fz === 'fin')}">Fase 2 · Evaluar · hasta ${fecha(f2)}</span>
      </div>
      ${reloj ? `<div class="aviso info" style="margin:0">⏳ ${reloj}</div>` : ''}
    </div>`;
  };

  // ---------- fase 1: aporte ----------
  const vistaAporte = (r, titulo = 'Tu aporte') => `
    <span class="etiqueta">${titulo}</span><h3 style="margin:4px 0 8px">${II.esc(r.titulo || 'Instrumento')}</h3>
    ${F.preguntas.map((p, i) => `<p class="nota" style="margin:8px 0 2px"><b>${i + 1}. ${p}</b></p><p style="margin:0;white-space:pre-wrap">${II.esc(r['c' + (i + 1)] || '')}</p>`).join('')}
    ${r.enlace ? `<p style="margin:10px 0 0">🔗 <a href="${II.esc(/^https?:\/\//i.test(r.enlace) ? r.enlace : 'https://' + r.enlace)}" target="_blank" rel="noopener nofollow">Foto, esquema o fuente</a></p>` : r.propio ? '<p class="nota" style="margin:10px 0 0">El autor indicó que todo es de su autoría.</p>' : ''}
    <p class="nota" style="margin:6px 0 0">${r.palabras || F.palabras(['c1', 'c2', 'c3', 'c4'].map((x) => r[x]).join(' '))} palabras</p>`;

  const pintarFormAporte = (cont) => {
    const b = II.leer(k('borrador'), {});
    cont.innerHTML = `<div class="tarjeta">
      <span class="etiqueta">Fase 1 · Tu aporte</span><h3 style="margin:4px 0 10px">Escribe sobre tu instrumento</h3>
      <label class="campo"><span>Nombre del instrumento (por ejemplo: «Manómetro de una garrafa de GLP»)</span><input class="entrada" data-c="titulo" maxlength="90" value="${II.esc(b.titulo || '')}"></label>
      ${F.preguntas.map((p, i) => `<label class="campo"><span>${i + 1}. ${p}</span>
        <textarea class="entrada" data-c="c${i + 1}" rows="5" style="resize:vertical">${II.esc(b['c' + (i + 1)] || '')}</textarea>
        <small class="nota" data-n="c${i + 1}"></small></label>`).join('')}
      <label class="campo"><span>Enlace de la foto, esquema o fuente (opcional si todo es tuyo)</span><input class="entrada" data-c="enlace" inputmode="url" placeholder="https://…" value="${II.esc(b.enlace || '')}"></label>
      <label class="opcion" style="margin-bottom:10px"><input type="checkbox" data-c="propio" ${b.propio ? 'checked' : ''}> Todo es de mi autoría (no usé fotos ni textos de internet)</label>
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
      pc.forEach((n, i) => { const e = cont.querySelector(`[data-n="c${i + 1}"]`); e.textContent = `${n} palabras${n < F.minCuadro ? ` · mínimo ${F.minCuadro} para el puntaje completo` : ''}`; e.style.color = n < F.minCuadro ? 'var(--duda)' : 'var(--ok)'; });
      const tot = pc.reduce((a, b) => a + b, 0);
      const t = cont.querySelector('[data-rol=total]');
      const enRango = tot >= F.minPal && tot <= F.maxPal;
      t.className = 'aviso ' + (enRango ? 'ok' : 'duda');
      t.innerHTML = `<b>${tot} palabras en total</b> · ${enRango ? 'dentro del rango ✓' : `debe estar entre ${F.minPal} y ${F.maxPal} para el puntaje completo`}`;
      const falta = [];
      if (!v.titulo.trim()) falta.push('el nombre del instrumento');
      if (pc.some((n) => n < F.minPublicar)) falta.push(`al menos ${F.minPublicar} palabras en cada cuadro`);
      if (!v.enlace.trim() && !v.propio) falta.push('el enlace de la fuente o marcar «Todo es de mi autoría»');
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
      const resp = { titulo: v.titulo.trim().slice(0, 90), c1: v.c1.trim(), c2: v.c2.trim(), c3: v.c3.trim(), c4: v.c4.trim(), enlace: v.enlace.trim().slice(0, 500), propio: !!v.propio, palabras: tot, porCuadro: pc };
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
    cont.innerHTML = `<div class="tarjeta"><span class="etiqueta">Fase 2 · Evalúa a tus compañeros</span>
      <h3 style="margin:4px 0 6px">${hechas.size >= asig.length ? '✓ Hiciste todas tus evaluaciones' : `Te faltan ${asig.length - [...hechas].filter((h) => asig.some((a) => String(a.id) === h)).length} de ${asig.length}`}</h3>
      <p class="nota" style="margin:0 0 10px">Los aportes no muestran el nombre del autor. Califica cada criterio con 0, 1 o 2 y escribe un comentario de al menos ${F.minComentario} palabras.</p>
      <div class="modulos">${asig.map((a, i) => `<button class="modulo-item ${hechas.has(String(a.id)) ? 'hecho' : ''}" data-a="${a.id}">
        <span class="n">${hechas.has(String(a.id)) ? '✓' : i + 1}</span><span><b>Aporte ${i + 1}: ${II.esc((a.texto || {}).titulo || 'Instrumento')}</b><small class="nota" style="display:block">${hechas.has(String(a.id)) ? 'Evaluado' : 'Pendiente'}</small></span><span>›</span></button>`).join('')}</div>
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
    cont.innerHTML = `<div class="tarjeta" style="border-color:#c9dbf3">${vistaAporte(a.texto || {}, `Aporte ${i + 1} · autor anónimo`)}</div>
      ${hecha ? '<div class="aviso ok">✓ Ya evaluaste este aporte.</div>' : `
      <div class="tarjeta"><span class="etiqueta">Tu evaluación del aporte ${i + 1}</span>
        ${F.rubrica.map((c, j) => `<div class="grupo-campo"><div class="pregunta" style="margin-bottom:6px"><b>${c.t}</b> <span class="nota">· ${c.d}</span></div>
          <div class="opciones">${c.n.map((txt, v) => `<label class="opcion ${b.rub[j] === v ? 'elegida' : ''}"><input type="radio" name="r${j}" value="${v}" ${b.rub[j] === v ? 'checked' : ''}><b style="font-family:var(--mono);margin-right:6px">${v}</b> ${txt}</label>`).join('')}</div></div>`).join('')}
        <label class="campo"><span>Tu comentario (al menos ${F.minComentario} palabras): una pregunta técnica, una mejora o una comparación con tu instrumento. El autor lo verá sin tu nombre.</span>
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
      const e = II.$('#ev-n'); e.textContent = `${n} palabras${n < F.minComentario ? ` · faltan ${F.minComentario - n}` : ' ✓'}`; e.style.color = n < F.minComentario ? 'var(--duda)' : 'var(--ok)';
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
        <div class="nota" style="margin-bottom:4px">Comentario ${i + 1} · anónimo</div>
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
    if (!II.leer(k('confirmado'))) return pintarConfirmar();
    if (!II.leer(k('ingreso'))) II.registrarIngreso(SES, alumno).then((r) => { if (r.ok) II.guardar(k('ingreso'), true); });
    await leerEstado();
    pintar();
  })();
})();
