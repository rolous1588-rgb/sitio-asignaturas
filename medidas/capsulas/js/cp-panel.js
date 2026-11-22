// ============================================================
// Cápsulas: panel del presentador (es también lo que se proyecta en la TV), 22/11/2026.
// Sin contraseña y sin base de datos: quien tenga el enlace presenta. El estado (pantalla y votos) vive en
// esta pestaña (sessionStorage): al cerrarla, todo desaparece.
// ============================================================
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const pedida = (new URLSearchParams(location.search).get('c') || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const CAPS = window.CAPSULAS || {};
  const CAP = CAPS[pedida] ? pedida : 'electroiman', K = CAPS[CAP] || EM;
  const CANAL = 'me-capsula-' + CAP, KEY = 'cp-panel-' + CAP;
  const PASOS = K.PASOS;
  document.title = K.titulo + ' (panel)';

  const nuevaSala = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  function cargar() { try { const s = JSON.parse(sessionStorage.getItem(KEY) || 'null'); return s && s.sala ? s : null; } catch (e) { return null; } }
  let st = cargar() || { sala: nuevaSala(), paso: 0, v: {}, enc: {} };
  if (!(st.paso >= 0 && st.paso < PASOS.length)) st.paso = 0;
  let tGuardar = null;
  function guardar() { clearTimeout(tGuardar); tGuardar = setTimeout(() => { try { sessionStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* sin almacenamiento */ } }, 120); }
  function encDe(id) { return st.enc[id] || (st.enc[id] = { fase: 'espera', ronda: 1, votos: { 1: {}, 2: {} } }); }
  function cuentas(p, votos) { const c = p.o.map(() => 0); Object.values(votos || {}).forEach((op) => { if (c[op] !== undefined) c[op]++; }); return c; }

  // ---------------- conexión ----------------
  const vistos = {};
  const conectados = () => { const t = Date.now() - 25000; return Object.values(vistos).filter((x) => x > t).length; };
  let enVivo = false;
  const canal = window.CP && CP.presentador ? CP.presentador(CANAL, recibir, (ok) => { enVivo = ok; pintarInfo(); if (ok) emitir(); }) : null;

  function recibir(m) {
    if (!m || !m.uid) return;
    vistos[m.uid] = Date.now();
    if (m.t === 'hola') emitirPronto();
    if (m.t === 'voto') {
      if (m.sala !== st.sala) return;
      const p = PASOS[st.paso];
      if (p.tipo !== 'enc' || p.id !== m.id) return;
      const e = encDe(p.id);
      if (e.fase !== 'abierta' || e.ronda !== m.ronda) return;
      if (!(Number.isInteger(m.op) && m.op >= 0 && m.op < p.o.length)) return;
      e.votos[e.ronda][m.uid] = m.op;
      guardar(); pintarEnc(false); emitirPronto();
    }
    pintarInfo();
  }

  function predDe(ref) {
    const e = st.enc[ref]; if (!e) return null;
    const ronda = Object.keys(e.votos[2] || {}).length ? 2 : 1;
    const v = e.votos[ronda] || {}, n = Object.keys(v).length;
    if (!n) return null;
    return { c: cuentas(PASOS.find((p) => p.id === ref), v), n };
  }
  function estado() {
    const p = PASOS[st.paso];
    const o = { sala: st.sala, paso: st.paso, v: st.v[p.id] || null, n: conectados(), t: Date.now() };
    if (p.tipo === 'enc') {
      const e = encDe(p.id), vr = e.votos[e.ronda];
      o.e = { id: p.id, fase: e.fase, ronda: e.ronda, nv: Object.keys(vr).length };
      if (e.fase === 'abierta') o.e.mis = vr;
      if (e.fase === 'mostrada') { o.e.c = cuentas(p, vr); if (e.ronda === 2) o.e.c1 = cuentas(p, e.votos[1]); }
    }
    if (p.tipo === 'pred') o.v = { pred: predDe(p.ref || 'E1') };
    return o;
  }
  function emitir() { if (canal) canal.emitir(estado()); }
  let tEmit = null;
  function emitirPronto() { if (tEmit) return; tEmit = setTimeout(() => { tEmit = null; emitir(); }, 150); }
  setInterval(() => { emitir(); pintarInfo(); }, 2500);

  // ---------------- pantalla ----------------
  const cont = $('#cont');
  let vista = null, pasoPintado = -1, tCambio = null;
  function cambioVista(v) {
    const p = PASOS[st.paso];
    st.v[p.id] = v; guardar();
    clearTimeout(tCambio); tCambio = setTimeout(emitir, 200);
  }
  function pintarEtapas() {
    const p = PASOS[st.paso];
    $('#etapas').innerHTML = K.ETAPAS.map((t, i) => `<button data-et="${i}" class="${i === p.et ? 'on' : ''}"><b>${i + 1}</b>${t}</button>`).join('');
    const on = $('#etapas .on'); if (on) { const n = $('#etapas'); n.scrollLeft = Math.max(0, on.offsetLeft - n.clientWidth / 2 + on.offsetWidth / 2); }
  }
  $('#etapas').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; const i = PASOS.findIndex((p) => p.et === +b.dataset.et); if (i >= 0) ir(i); };
  function pintarInfo() {
    $('#cnx').className = 'punto ' + (enVivo ? 'si' : 'no');
    $('#cnx').title = enVivo ? 'En vivo' : 'Sin conexión';
    $('#gente').textContent = '👥 ' + conectados();
    $('#num').textContent = (st.paso + 1) + '/' + PASOS.length;
    const p = PASOS[st.paso];
    if (p.tipo === 'enc' && encDe(p.id).fase === 'abierta') pintarEnc(false);
  }
  function titulo(p) {
    if (p.tipo === 'enc') return p.pred ? 'Votemos: predicción' : 'Votemos';
    return p.t;
  }
  function pintar() {
    const p = PASOS[st.paso];
    if (vista && vista.fin) vista.fin();
    vista = null; cont.className = ''; cont.innerHTML = '';
    $('#tit').textContent = titulo(p);
    pintarEtapas(); pintarInfo();
    if (p.tipo === 'enc') pintarEnc(true);
    else {
      vista = K.vista(cont, p, p.tipo === 'pred' ? { pred: predDe(p.ref || 'E1') } : (st.v[p.id] || null), 'tv', cambioVista);
      $('#ctrl').innerHTML = '';
    }
    pasoPintado = st.paso;
    $('#prev').disabled = st.paso === 0; $('#next').disabled = st.paso === PASOS.length - 1;
  }

  // Encuesta en la TV
  let firmaEnc = '';
  function pintarEnc(forzar) {
    const p = PASOS[st.paso]; if (p.tipo !== 'enc') return;
    const e = encDe(p.id), nv = Object.keys(e.votos[e.ronda]).length, n = conectados();
    const firma = [p.id, e.fase, e.ronda, e.fase === 'mostrada' ? nv : ''].join('|');
    if (forzar || firma !== firmaEnc) {
      firmaEnc = firma;
      const ord = EM.orden(p);
      let izq = `<p class="preg">${p.q}</p>`;
      if (e.fase === 'mostrada') {
        izq += EM.barras(p, cuentas(p, e.votos[e.ronda]), { correcta: !p.pred, antes: e.ronda === 2 ? cuentas(p, e.votos[1]) : null });
      } else {
        izq += `<div class="opciones">${ord.map((i, pos) => `<div class="op"><b class="letra">${'ABCD'[pos]}</b><span class="otxt">${p.o[i]}</span></div>`).join('')}</div>`;
      }
      let der = '';
      if (e.fase === 'espera') der = '<div class="estado">Votación cerrada</div><p class="lbl">Explica la pregunta y toca «Abrir votación».</p>';
      else if (e.fase === 'abierta') der = `<div class="cuenta" id="nv">${nv}</div><p>votaron</p><p class="lbl" id="dec">de ${n} conectados</p><p class="lbl">Pueden cambiar su voto hasta que toques «Mostrar».</p>`;
      else {
        const c = cuentas(p, e.votos[e.ronda]), tot = c.reduce((a, b) => a + b, 0);
        if (p.pred) der = `<div class="cuenta">${tot}</div><p>votos</p><p class="lbl">La respuesta, al final de la solución.</p>`;
        else {
          const pc = tot ? Math.round(c[p.c] / tot * 100) : 0;
          let ant = '';
          if (e.ronda === 2) { const c1 = cuentas(p, e.votos[1]), t1 = c1.reduce((a, b) => a + b, 0); ant = `<p class="lbl">Ronda 1: ${t1 ? Math.round(c1[p.c] / t1 * 100) : 0} % de acierto</p>`; }
          der = `<div class="cuenta ${pc >= 70 ? 'ok' : pc >= 40 ? 'med' : 'mal'}">${pc} %</div><p>de acierto${e.ronda === 2 ? ' (ronda 2)' : ''}</p><p class="lbl">${tot} votos</p>${ant}`;
        }
      }
      cont.innerHTML = `<div class="enc"><div class="izq">${izq}</div><div class="der">${der}</div></div>` +
        (e.fase === 'mostrada' && !p.pred ? `<div class="por card"><b>Por qué:</b> ${p.por}</div>` : '');
      EM.tex(cont);
      pintarCtrlEnc(p, e, nv);
    } else {
      const a = $('#nv'); if (a) a.textContent = nv;
      const b = $('#dec'); if (b) b.textContent = 'de ' + n + ' conectados';
      const bm = $('#bmostrar'); if (bm) bm.textContent = '▶ Mostrar resultados (' + nv + ')';
    }
  }
  let armado = null;
  function pintarCtrlEnc(p, e, nv) {
    const c = $('#ctrl');
    if (e.fase === 'espera') c.innerHTML = '<button class="btn pri grande" id="babrir">Abrir votación</button>';
    else if (e.fase === 'abierta') c.innerHTML = `<button class="btn pri grande" id="bmostrar">▶ Mostrar resultados (${nv})</button>`;
    else c.innerHTML = (e.ronda === 1 ? '<button class="btn grande" id="bronda">Otra ronda (votar de nuevo)</button>' : '<span class="lbl">Ronda 2</span>') +
      '<button class="btn sm" id="bborrar">Borrar votos</button>';
    armado = null;
  }
  $('#ctrl').onclick = (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    const p = PASOS[st.paso]; if (p.tipo !== 'enc') return;
    const e = encDe(p.id);
    if (b.id === 'babrir') e.fase = 'abierta';
    else if (b.id === 'bmostrar') e.fase = 'mostrada';
    else if (b.id === 'bronda') { e.ronda = 2; e.votos[2] = {}; e.fase = 'abierta'; }
    else if (b.id === 'bborrar') {
      if (armado !== 'borrar') { armado = 'borrar'; b.textContent = 'Toca otra vez para borrar'; setTimeout(() => { if (armado === 'borrar') { armado = null; b.textContent = 'Borrar votos'; } }, 3000); return; }
      st.enc[p.id] = { fase: 'espera', ronda: 1, votos: { 1: {}, 2: {} } };
    } else return;
    guardar(); pintarEnc(true); emitir();
  };

  // ---------------- navegación ----------------
  function ir(i) {
    i = Math.max(0, Math.min(PASOS.length - 1, i));
    if (i === st.paso && pasoPintado === i) return;
    st.paso = i; guardar(); pintar(); emitir();
  }
  $('#prev').onclick = () => ir(st.paso - 1);
  $('#next').onclick = () => ir(st.paso + 1);
  document.addEventListener('keydown', (e) => {
    if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); ir(st.paso + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); ir(st.paso - 1); }
    else if (e.key === 'Escape') cerrarCapas();
  });

  // Menú: ir a una pantalla; empezar de nuevo
  function cerrarCapas() { $('#qr-ov').hidden = true; $('#menu').hidden = true; }
  $('#bmenu').onclick = () => {
    const m = $('#menu');
    m.querySelector('.lista').innerHTML = PASOS.map((p, i) => `<button data-i="${i}" class="${i === st.paso ? 'on' : ''}"><span>${i + 1}</span>${K.ETAPAS[p.et]}: ${p.tipo === 'enc' ? 'votación ' + p.id : EM.esc(p.t)}</button>`).join('');
    m.hidden = false;
    const on = m.querySelector('.lista .on'); if (on) on.scrollIntoView({ block: 'center' });
  };
  $('#menu').onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) { if (e.target.id === 'menu') cerrarCapas(); return; }
    if (b.dataset.i !== undefined) { cerrarCapas(); ir(+b.dataset.i); return; }
    if (b.id === 'mcerrar') cerrarCapas();
    if (b.id === 'mnuevo') {
      if (b.dataset.armado !== '1') { b.dataset.armado = '1'; b.textContent = 'Toca otra vez: se borran todos los votos'; return; }
      st = { sala: nuevaSala(), paso: 0, v: {}, enc: {} }; guardar(); cerrarCapas(); pasoPintado = -1; pintar(); emitir();
      b.dataset.armado = ''; b.textContent = 'Empezar de nuevo';
    }
  };

  // QR para los estudiantes
  const urlEst = new URL('index.html?c=' + CAP, location.href).href;
  $('#bqr').onclick = () => {
    const box = $('#qr-ov .qr');
    if (window.qrcode) {
      const q = qrcode(0, 'M'); q.addData(urlEst); q.make();
      box.innerHTML = q.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
    } else box.innerHTML = '<p>No se pudo cargar el generador de QR. Comparte el enlace de abajo.</p>';
    $('#qr-ov .url').textContent = urlEst.replace(/^https?:\/\//, '');
    $('#qr-ov').hidden = false;
  };
  $('#qr-ov').onclick = () => cerrarCapas();

  // Pantalla completa, pantalla encendida y aviso de girar
  $('#bfs').onclick = async () => {
    try {
      if (!document.fullscreenElement) { await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); try { await screen.orientation.lock('landscape'); } catch (e) { /* no soportado */ } }
      else await document.exitFullscreen();
    } catch (e) { /* no soportado */ }
  };
  let wl = null;
  async function despierto() { try { if ('wakeLock' in navigator && !wl) { wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); } } catch (e) { /* no soportado */ } }
  document.addEventListener('click', despierto);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') despierto(); });
  $('#girar button').onclick = () => document.body.classList.add('vertical-ok');

  if (!canal) { enVivo = false; }
  pintar();
  if (st.paso === 0 && !cargar()) setTimeout(() => $('#bqr').click(), 400);
})();
