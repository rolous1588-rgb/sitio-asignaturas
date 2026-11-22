// ============================================================
// Cápsulas: página del estudiante (celular en vertical), 22/11/2026.
// Sin registro y sin notas: sigue la pantalla del presentador y vota. No se guarda nada en la base.
// ============================================================
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const pedida = (new URLSearchParams(location.search).get('c') || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const CAPS = window.CAPSULAS || {};
  const CAP = CAPS[pedida] ? pedida : 'electroiman', K = CAPS[CAP] || EM;
  const CANAL = 'me-capsula-' + CAP;
  const PASOS = K.PASOS, uid = CP.uid();
  document.title = K.titulo;
  { const t = document.querySelector('.tit-cap b'); if (t) t.textContent = K.titulo; }
  const cont = $('#cont');

  // Votos propios (en esta pestaña): clave sala|encuesta|ronda → opción
  const KV = 'cp-votos-' + CAP;
  let mis = {};
  try { mis = JSON.parse(sessionStorage.getItem(KV) || '{}') || {}; } catch (e) { mis = {}; }
  const guardarMis = () => { try { sessionStorage.setItem(KV, JSON.stringify(mis)); } catch (e) { /* sin almacenamiento */ } };

  let ult = null, ultT = 0, enVivo = false;
  const canal = CP.estudiante(CANAL, alEstado, (ok) => { enVivo = ok; pintarCnx(); if (ok) enviar({ t: 'hola' }); });
  function enviar(m) { if (!canal) return Promise.resolve(false); return canal.enviar(Object.assign({ uid }, m)); }
  setInterval(() => { enviar({ t: 'ping' }); }, 10000);
  setTimeout(() => enviar({ t: 'hola' }), 800);

  function pintarCnx() {
    const sinSenal = ult && Date.now() - ultT > 12000;
    const c = $('#cnx');
    c.className = 'cnx ' + (enVivo && ult && !sinSenal ? 'si' : 'no');
    c.textContent = !canal ? 'Sin conexión' : !enVivo ? 'Conectando…' : !ult ? 'Esperando' : sinSenal ? 'Sin señal' : 'En vivo';
  }
  setInterval(() => { pintarCnx(); if (!ult) esperar(); }, 2000);

  let t0 = Date.now();
  function esperar() {
    if (ult) return;
    $('#tit').textContent = K.titulo;
    $('#etq').textContent = '';
    cont.innerHTML = `<div class="espera card"><p><b>Conectando con la clase…</b></p><p class="lbl">${Date.now() - t0 > 8000 ? 'Todavía no llega la pantalla del presentador. Si la clase ya empezó, revisa tu conexión de datos.' : 'En unos segundos verás lo mismo que en la TV.'}</p></div>`;
  }

  // ---------------- estado que llega del presentador ----------------
  let vista = null, pasoPintado = -1, salaPintada = null, local = false;
  function alEstado(e) {
    if (!e || typeof e.paso !== 'number' || !PASOS[e.paso]) return;
    ult = e; ultT = Date.now();
    pintarCnx();
    pintar();
  }

  function pintar() {
    const e = ult, p = PASOS[e.paso];
    if (e.paso !== pasoPintado || e.sala !== salaPintada) {
      if (vista && vista.fin) vista.fin();
      vista = null; local = false; $('#local').hidden = true;
      cont.className = ''; cont.innerHTML = '';
      pasoPintado = e.paso; salaPintada = e.sala; firmaEnc = '';
      $('#etq').textContent = K.ETAPAS[p.et] + '; pantalla ' + (e.paso + 1) + ' de ' + PASOS.length;
      $('#tit').textContent = p.tipo === 'enc' ? (p.pred ? 'Votemos: predicción' : 'Votemos') : p.t;
      if (p.tipo !== 'enc') vista = K.vista(cont, p, e.v, 'cel', cambioLocal);
      window.scrollTo(0, 0);
    } else if (p.tipo !== 'enc' && !local && vista && vista.act) {
      vista.act(e.v);
    }
    if (p.tipo === 'enc') pintarEnc();
  }
  function cambioLocal() {
    local = true; $('#local').hidden = false;
  }
  $('#local button').onclick = () => {
    local = false; $('#local').hidden = true;
    pasoPintado = -1; pintar();
  };

  // ---------------- encuesta ----------------
  let firmaEnc = '', ultimoEnvio = 0;
  const clave = (p, e) => ult.sala + '|' + p.id + '|' + e.ronda;
  function pintarEnc() {
    const p = PASOS[ult.paso], e = ult.e;
    if (!e || e.id !== p.id) return;
    const mio = mis[clave(p, e)];
    const llego = e.fase === 'abierta' && e.mis && e.mis[uid] === mio;
    const firma = [p.id, e.fase, e.ronda, mio, llego, e.fase === 'mostrada' ? JSON.stringify(e.c) : ''].join('|');
    if (firma === firmaEnc) return reintentar(p, e, mio, llego);
    firmaEnc = firma;
    const ord = EM.orden(p), L = (i) => 'ABCD'[ord.indexOf(i)];
    let h = `<p class="preg">${p.q}</p>`;
    if (e.fase === 'mostrada') {
      h += EM.barras(p, e.c, { correcta: !p.pred, mio: mio, antes: e.c1 || null });
      if (p.pred) h += `<p class="aviso">${mio === undefined ? 'No votaste.' : 'Tu predicción: <b>' + p.o[mio] + '</b>.'} La respuesta la vemos al final de la solución.</p>`;
      else {
        h += mio === undefined ? `<p class="aviso">No votaste. La correcta es la <b>${L(p.c)}</b>.</p>`
          : mio === p.c ? '<p class="aviso ok">✓ Acertaste.</p>' : `<p class="aviso mal">✗ La correcta es la <b>${L(p.c)}</b>.</p>`;
        h += `<div class="por card"><b>Por qué:</b> ${p.por}</div>`;
      }
    } else {
      const abierta = e.fase === 'abierta';
      h += `<div class="opciones${abierta ? ' activas' : ''}">${ord.map((i, pos) => `<button class="op${mio === i ? ' sel' : ''}" data-i="${i}" ${abierta ? '' : 'disabled'}><b class="letra">${'ABCD'[pos]}</b><span class="otxt">${p.o[i]}</span></button>`).join('')}</div>`;
      if (!abierta) h += '<p class="aviso">Espera: la votación todavía no se abre.</p>';
      else if (mio === undefined) h += `<p class="aviso">Toca una opción. Puedes cambiarla hasta que se cierre.${e.ronda === 2 ? ' <b>Segunda ronda:</b> vota de nuevo.' : ''}</p>`;
      else if (llego) h += `<p class="aviso ok">✓ Tu voto (${L(mio)}) llegó. Puedes cambiarlo hasta que se cierre.</p>`;
      else h += `<p class="aviso">Enviando tu voto (${L(mio)})…</p>`;
    }
    cont.innerHTML = `<div class="enc">${h}</div>`;
    EM.tex(cont);
    reintentar(p, e, mio, llego);
  }
  function reintentar(p, e, mio, llego) {
    if (e.fase === 'abierta' && mio !== undefined && !llego && Date.now() - ultimoEnvio > 3500) votar(p, e, mio, true);
  }
  function votar(p, e, i, reintento) {
    mis[clave(p, e)] = i; guardarMis();
    ultimoEnvio = Date.now();
    enviar({ t: 'voto', sala: ult.sala, id: p.id, ronda: e.ronda, op: i });
    if (!reintento) pintarEnc();
  }
  cont.addEventListener('click', (ev) => {
    const b = ev.target.closest('.opciones.activas .op'); if (!b || !ult) return;
    const p = PASOS[ult.paso], e = ult.e;
    if (!e || e.fase !== 'abierta') return;
    votar(p, e, +b.dataset.i, false);
  });

  // Pantalla encendida mientras dura la clase
  let wl = null;
  async function despierto() { try { if ('wakeLock' in navigator && !wl) { wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); } } catch (e) { /* no soportado */ } }
  document.addEventListener('click', despierto);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { despierto(); enviar({ t: 'hola' }); } });

  pintarCnx(); esperar();
})();
