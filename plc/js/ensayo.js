// ============================================================
// Modo estudio del docente: practicar la clase sin tocar la clase real.
// Junta en una página la presentación (la de Meet), el guion del paso y la vista del
// estudiante. No escribe nada en la base; solo lee, si puede, hasta dónde llegó la clase.
// ============================================================
(function () {
  const II = window.II;
  const SES = II.sesionActual();
  const S = II.SESIONES[SES];
  const $ = II.$;
  const esc = II.esc;
  const N = S.pasos.length;
  const CLAVE_DADO = 'pl-ensayo-dado-' + SES;
  let idx = 0, dado = -1, ifP = null, ifE = null;

  $('#en-sesion').textContent = S.titulo;

  const TIPO = { espera: 'Bienvenida', rubrica: 'Rúbrica', cuestionario: 'Diagnóstico', explica: 'Explicación', explora: 'Explora', rapida: 'Pregunta rápida', reto: 'Reto', revisa: 'Revisión', pausa: 'Pausa', cierre: 'Cierre' };
  const titulo = (p) => p.titulo || p.id;

  // ---------- hasta dónde llegó la clase real (solo lectura) ----------
  const leerDado = async () => {
    let hasta = null;
    try {
      if (II.sb) {
        const { data, error } = await II.sb.from('estado_sesion').select('extra').eq('sesion', SES).maybeSingle();
        if (!error && data && data.extra && data.extra.cierre_anticipado) hasta = data.extra.cierre_anticipado.hasta || null;
        if (hasta) try { localStorage.setItem(CLAVE_DADO, hasta); } catch (e) { /* sin almacenamiento */ }
      }
    } catch (e) { /* sin conexión */ }
    if (!hasta) { try { hasta = localStorage.getItem(CLAVE_DADO); } catch (e) { /* sin almacenamiento */ } }
    return hasta ? II.indicePaso(SES, hasta) : -1;
  };

  // ---------- guion (misma estructura que el panel del celular) ----------
  const lista = (items, ordenada) => `${ordenada ? '<ol>' : '<ul style="margin:0;padding-left:20px;display:grid;gap:9px">'}${items.map((t) => `<li>${t}</li>`).join('')}${ordenada ? '</ol>' : '</ul>'}`;
  const sec = (t, cuerpo) => `<div class="etiqueta" style="margin:14px 0 6px">${t}</div>${cuerpo}`;
  const guionHTML = (g) => `<div class="tarjeta guion">
      <div class="controles" style="justify-content:space-between;margin-bottom:6px"><span class="etiqueta">Qué hacer y qué decir</span>${g.min ? `<span class="chip">⏱ ${g.min} min</span>` : ''}</div>
      ${g.objetivo ? `<p style="margin:0 0 4px;font-size:.95rem"><b>Objetivo:</b> ${g.objetivo}</p>` : ''}
      ${g.puntos ? lista(g.puntos, true) : ''}
      ${g.pasos ? sec('Paso a paso', lista(g.pasos, true)) : ''}
      ${g.preguntas ? sec('Pregunta al grupo (y respuesta esperada)', lista(g.preguntas)) : ''}
      ${g.dudas ? sec('Si preguntan…', lista(g.dudas)) : ''}
      ${g.transicion ? sec('Para pasar al siguiente', `<p style="margin:0;font-size:.95rem">${g.transicion}</p>`) : ''}
    </div>`;

  // lo que el guion no dice y sirve para ensayar: respuesta de las rápidas, guía del explora, datos del reto
  const apoyo = (p) => {
    let h = '';
    if (p.tipo === 'rapida') {
      h += `<div class="tarjeta" style="padding:14px 16px;margin-bottom:14px"><div class="etiqueta" style="margin-bottom:6px">La pregunta y su respuesta</div>
        <p style="margin:0 0 8px"><b>${p.t}</b></p>
        <ul class="en-rap" style="margin:0;padding-left:20px;display:grid;gap:5px">${p.o.map((t, i) => `<li class="${i === p.c ? 'ok' : ''}">${t}${i === p.c ? ' ✓' : ''}</li>`).join('')}</ul>
        ${p.por ? `<p class="nota" style="margin:8px 0 0">${p.por}</p>` : ''}</div>`;
    }
    if (p.tipo === 'explora' && p.guia) {
      h += `<div class="tarjeta" style="padding:14px 16px;margin-bottom:14px"><div class="etiqueta" style="margin-bottom:6px">Lo que se les pide explorar</div>${lista(p.guia, true)}</div>`;
    }
    if ((p.tipo === 'reto' || p.tipo === 'revisa') && p.reto && S.retos && S.retos[p.reto]) {
      const r = S.retos[p.reto];
      const fila = (t, v) => (v ? `<p style="margin:6px 0 0;font-size:.93rem"><b>${t}:</b> ${v}</p>` : '');
      h += `<div class="tarjeta" style="padding:14px 16px;margin-bottom:14px"><div class="etiqueta" style="margin-bottom:6px">${esc(r.titulo || p.reto)} · ${r.puntos || '?'} puntos</div>
        ${fila('Qué se pide', r.general)}${fila('Pista', r.pista)}${fila('Error común', r.errorComun)}${fila('Método', r.metodo && String(r.metodo).replace(/~([^~]+)~/g, '<span style="text-decoration:overline;text-decoration-thickness:1.5px">$1</span>'))}
        <p class="nota" style="margin:8px 0 0">Los valores cambian según el carnet de cada estudiante; a la derecha ves un ejemplo con su solución.</p></div>`;
    }
    return h;
  };

  const pintarGuion = (p) => {
    const g = p.guion;
    $('#en-guion').innerHTML = `<div class="en-meta"><span class="chip acento">${idx + 1} de ${N}</span><span class="chip">${esc(TIPO[p.tipo] || p.tipo)}</span>${idx <= dado ? '<span class="chip">Ya lo diste en clase</span>' : '<span class="chip duda">Falta por dar</span>'}</div>
      <h3 style="margin:0 0 10px">${esc(titulo(p))}</h3>
      ${apoyo(p)}${g ? guionHTML(g) : '<div class="aviso info">Este paso no tiene guion escrito: se explica solo con lo que se proyecta.</div>'}`;
    if (window.renderMathInElement) try { window.renderMathInElement($('#en-guion'), { delimiters: [{ left: '\\(', right: '\\)', display: false }, { left: '\\[', right: '\\]', display: true }] }); } catch (e) { /* sin KaTeX */ }
  };

  // ---------- navegación ----------
  const pintarNav = () => {
    const sel = $('#en-sel');
    if (!sel.options.length) {
      sel.innerHTML = S.pasos.map((p, i) => `<option value="${i}">${i + 1}. ${esc(titulo(p))}</option>`).join('');
      sel.onchange = () => ir(Number(sel.value), 'madre');
      $('#en-ant').onclick = () => ir(idx - 1, 'madre');
      $('#en-sig').onclick = () => ir(idx + 1, 'madre');
      $('#en-tira').innerHTML = S.pasos.map((p, i) => `<button type="button" data-i="${i}" title="${esc(titulo(p))}">${i + 1}</button>`).join('');
      $('#en-tira').onclick = (e) => { const b = e.target.closest('button[data-i]'); if (b) ir(Number(b.dataset.i), 'madre'); };
    }
    Array.from(sel.options).forEach((o, i) => { o.textContent = `${i <= dado ? '✓ ' : ''}${i + 1}. ${titulo(S.pasos[i])}`; });
    sel.value = String(idx);
    $('#en-tira').querySelectorAll('button').forEach((b) => {
      const i = Number(b.dataset.i);
      b.className = (i === idx ? 'actual ' : '') + (i <= dado ? 'dado' : '');
    });
    const act = $('#en-tira').querySelector('.actual');
    if (act && act.scrollIntoView) act.scrollIntoView({ block: 'nearest', inline: 'center' });
    $('#en-ant').disabled = idx === 0;
    $('#en-sig').disabled = idx >= N - 1;
  };
  const pintarResumen = () => {
    const faltan = N - 1 - dado;
    $('#en-resumen').innerHTML = dado >= 0
      ? `En clase llegaste hasta el paso <b>${dado + 1}</b> («${esc(titulo(S.pasos[dado]))}»). Faltan por dar los pasos <b>${dado + 2} al ${N}</b> (${faltan}). Los ya dados llevan ✓ y salen en gris.`
      : 'Todavía no se sabe hasta dónde llegó la clase: se muestran todos los pasos como pendientes.';
  };

  const urlPres = (id) => `presentar.html?s=${SES}&ensayo=1&p=${encodeURIComponent(id)}`;
  const urlEst = (id) => `clase.html?s=${SES}&ensayo=1&p=${encodeURIComponent(id)}`;

  // 'origen' = quién cambió el paso ('presentar', 'estudiante' o 'madre'); a los demás se les avisa
  const ir = (i, origen) => {
    idx = Math.max(0, Math.min(N - 1, i));
    const p = S.pasos[idx];
    pintarNav(); pintarGuion(p);
    try { history.replaceState(null, '', '#' + p.id); } catch (e) { /* sin historial */ }
    $('#en-link-pres').href = urlPres(p.id);
    $('#en-link-est').href = urlEst(p.id);
    [['presentar', ifP], ['estudiante', ifE]].forEach(([nombre, f]) => {
      if (nombre !== origen && f && f.contentWindow) f.contentWindow.postMessage({ ensayo: 'ir', id: p.id }, location.origin);
    });
    window.scrollTo({ top: 0 });
  };

  // ---------- marcos ----------
  const escalar = () => {
    const c = $('#en-escala');
    const w = c.clientWidth || 640;
    const k = w / 1280;
    c.style.height = Math.round(720 * k) + 'px';
    if (ifP) ifP.style.transform = `scale(${k})`;
  };

  const crearMarcos = () => {
    const id = S.pasos[idx].id;
    ifP = document.createElement('iframe');
    ifP.title = 'Presentación'; ifP.src = urlPres(id);
    $('#en-escala').appendChild(ifP);
    ifE = document.createElement('iframe');
    ifE.title = 'Vista del estudiante'; ifE.src = urlEst(id);
    $('#en-tel').appendChild(ifE);
    escalar();
  };

  window.addEventListener('resize', escalar);
  if (window.ResizeObserver) new ResizeObserver(escalar).observe($('#en-escala'));
  // si alguien cambia de paso dentro de un marco, se sincroniza todo lo demás
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || e.data.ensayo !== 'paso') return;
    const k = II.indicePaso(SES, e.data.id);
    if (k >= 0 && k !== idx) ir(k, e.data.de);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input,select,textarea')) return;
    if (e.key === 'ArrowRight') ir(idx + 1, 'madre');
    if (e.key === 'ArrowLeft') ir(idx - 1, 'madre');
  });
  $('#en-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]'); if (!b) return;
    $('#en-grid').dataset.vista = b.dataset.v;
    $('#en-tabs').querySelectorAll('button').forEach((x) => x.classList.toggle('activo', x === b));
    escalar();
  });

  // ---------- arranque: empieza en el primer paso que falta por dar (o en el de la dirección #) ----------
  (async () => {
    dado = await Promise.race([leerDado(), new Promise((r) => setTimeout(() => r(-1), 2500))]);
    const hash = decodeURIComponent((location.hash || '').slice(1));
    const h = hash ? II.indicePaso(SES, hash) : -1;
    idx = h >= 0 ? h : Math.min(N - 1, dado + 1);
    pintarResumen();
    pintarNav(); pintarGuion(S.pasos[idx]);
    $('#en-link-pres').href = urlPres(S.pasos[idx].id);
    $('#en-link-est').href = urlEst(S.pasos[idx].id);
    crearMarcos();
  })();
})();
