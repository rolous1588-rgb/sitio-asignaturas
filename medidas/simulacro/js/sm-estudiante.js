// ============================================================
// Medidas Eléctricas: simulacro del examen final, página del estudiante (25/11/2026).
// Se entra con un enlace (sin QR), se practica en casa, sin reloj. Cada simulacro tiene datos propios
// (semilla = C.U. + número de simulacro). Al terminar: nota, revisión casilla por casilla y solución con sus números.
// «Otro simulacro» genera datos nuevos. La nota de cada simulacro se envía a la sesión me-sim (actividad «sim»)
// para que el docente vea quién practicó. ?modo=prueba = no envía nada.
// El avance vive en el celular (localStorage); la cola de envíos es propia (mesim-cola).
// ============================================================
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = II.esc;
  const SID = 'me-sim';
  const PRUEBA = new URLSearchParams(location.search).get('modo') === 'prueba';
  const K_AL = 'mesim-alumno', K_COLA = 'mesim-cola', kE = (c) => 'mesim-v1-' + c;
  const CARRERAS = ['Ingeniería Eléctrica', 'Ingeniería Electrónica'];
  let alumno = II.leer(K_AL, null), E = null, abierto = null;
  const cont = $('#cont');

  // ---------------- estado del estudiante ----------------
  const nuevoE = () => ({ n: 0, act: null, hist: [], ult: null });
  const cargarE = () => { E = Object.assign(nuevoE(), II.leer(kE(alumno.carnet), {})); };
  const guardarE = () => II.guardar(kE(alumno.carnet), E);
  const normCU = (s) => String(s || '').toUpperCase().replace(/[^0-9A-Z]/g, '');

  // ---------------- conexión y envíos ----------------
  const pintarCon = (ok) => { const p = $('#e-con'); p.className = 'punto ' + (ok === false ? 'off' : ok ? 'on' : ''); };
  II.alCambiarConexion(pintarCon);
  function encolar(reg) { if (PRUEBA) return; const c = II.leer(K_COLA, []); c.push(reg); II.guardar(K_COLA, c.slice(-30)); vaciar(); }
  let vaciando = false;
  async function vaciar() {
    if (vaciando || !II.sb || PRUEBA) return;
    vaciando = true;
    try {
      for (;;) {
        const c = II.leer(K_COLA, []);
        if (!c.length) break;
        const reg = c[0], { error } = await II.sb.from('respuestas').insert(reg);
        let estado = 'ok';
        if (error) {
          const rechazo = error.code === '42501' || /row-level security/i.test(error.message || '');
          if (!rechazo) { II.marcarConexion(false); break; }
          estado = 'rech';
        } else II.marcarConexion(true);
        const c2 = II.leer(K_COLA, []); c2.shift(); II.guardar(K_COLA, c2);
        marcarEnvio(reg, estado);
      }
    } catch (e) { II.marcarConexion(false); } finally { vaciando = false; }
  }
  function marcarEnvio(reg, estado) {
    const k = reg.respuesta && reg.respuesta.k, key = kE(reg.carnet), e2 = II.leer(key, null);
    if (!e2 || !e2.hist) return;
    const h = e2.hist.find((x) => x.k === k);
    if (h) { h.env = estado; II.guardar(key, e2); }
    if (alumno && reg.carnet === alumno.carnet) { E = Object.assign(nuevoE(), e2); const b = $('#res-env'); if (b) b.outerHTML = envHtml(h); }
  }
  setInterval(vaciar, 15000);
  window.addEventListener('online', vaciar);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') vaciar(); });

  async function verEstado() {
    if (!II.sb || PRUEBA) return;
    try {
      const { data, error } = await II.sb.from('estado_sesion').select('extra').eq('sesion', SID).maybeSingle();
      if (error) return;
      const x = (data && data.extra) || {}, ahora = Date.now();
      abierto = !!(x.abre && Date.parse(x.abre) <= ahora && (!x.cierra || Date.parse(x.cierra) > ahora));
      II.marcarConexion(true);
      const av = $('#av-cerrado'); if (av) av.classList.toggle('oculto', abierto !== false);
    } catch (e) { /* sin conexión: se practica igual */ }
  }
  async function registrarIngreso() {
    if (!II.sb || PRUEBA) return;
    const hoy = new Date().toISOString().slice(0, 10), k = 'mesim-ing-' + alumno.carnet;
    if (II.leer(k, '') === hoy) return;
    try {
      const { error } = await II.sb.from('ingresos').insert({ sesion: SID, carnet: alumno.carnet, nombre: alumno.nombre.slice(0, 80), info: { car: alumno.car } });
      if (!error) II.guardar(k, hoy);
    } catch (e) { /* se intentará la próxima vez */ }
  }

  // ---------------- registro ----------------
  function vRegistro() {
    $('#e-avance').classList.add('oculto');
    cont.innerHTML = `<div class="tarjeta"><span class="etq">Medidas Eléctricas${PRUEBA ? '; modo prueba (no se envía nada)' : ''}</span><h2>Simulacro del examen final</h2>
      <p>Practica en casa con problemas como los del examen final. Cada simulacro tiene <b>tus propios datos</b>. Al terminar ves tu nota y la solución paso a paso con tus números, y puedes hacer otro con datos nuevos las veces que quieras.</p>
      <p class="sm-nota">Tu docente ve quién practicó y con qué nota. Esta nota no cuenta para el examen.</p>
      <form id="f-reg">
        <label class="campo"><span>Apellidos</span><input name="ap" required maxlength="40" autocomplete="family-name"></label>
        <label class="campo"><span>Nombres</span><input name="no" required maxlength="38" autocomplete="given-name"></label>
        <label class="campo"><span>C.U. (carnet universitario)</span><input name="cu" required maxlength="20" inputmode="numeric" autocomplete="off"></label>
        <label class="campo"><span>Carrera</span><select name="car" required><option value="">Elige tu carrera</option>${CARRERAS.map((c) => `<option>${c}</option>`).join('')}</select></label>
        <p class="sm-err" id="reg-err"></p>
        <button class="boton prim bloque" type="submit">Entrar</button>
      </form></div>`;
    $('#f-reg').onsubmit = (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target), cu = normCU(fd.get('cu')), ap = String(fd.get('ap')).trim().replace(/\s+/g, ' '), no = String(fd.get('no')).trim().replace(/\s+/g, ' ');
      if (cu.length < 3) { $('#reg-err').textContent = 'Revisa tu C.U.: debe tener al menos 3 cifras.'; return; }
      if (ap.length < 2 || no.length < 2) { $('#reg-err').textContent = 'Escribe tus apellidos y tus nombres.'; return; }
      alumno = { carnet: cu, nombre: (ap + ' ' + no).slice(0, 80), ap, no, car: String(fd.get('car')) };
      II.guardar(K_AL, alumno);
      cargarE(); registrarIngreso(); vInicio();
    };
  }

  // ---------------- inicio ----------------
  const fecha = (t) => new Date(t).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const llenas = (act) => {
    let n = 0;
    SM.PREG.forEach((q) => q.items.forEach((it) => { const v = act.resp[q.id] && act.resp[q.id][it.id]; if (v != null && v !== '' && !(Array.isArray(v) && !v.length)) n++; }));
    return n;
  };
  function envHtml(h) {
    if (PRUEBA) return '<p class="sm-env" id="res-env">Modo prueba: esta nota no se envía.</p>';
    if (!h) return '<p class="sm-env" id="res-env"></p>';
    if (h.env === 'ok') return '<p class="sm-env ok" id="res-env">✓ Tu nota quedó registrada para el docente.</p>';
    if (h.env === 'rech') return '<p class="sm-env mal" id="res-env">El registro del simulacro está cerrado: esta nota no quedó registrada (igual te sirve para practicar).</p>';
    return '<p class="sm-env" id="res-env">Enviando tu nota al docente… (se envía sola cuando haya conexión)</p>';
  }
  function vInicio() {
    $('#e-avance').classList.add('oculto');
    const act = E.act, hist = E.hist.slice().reverse();
    cont.innerHTML = `<div class="tarjeta"><span class="etq">Simulacro del examen final${PRUEBA ? '; modo prueba' : ''}</span><h2>Hola, ${esc(alumno.no.split(' ')[0])}</h2>
      <p class="sm-aviso mal oculto" id="av-cerrado">El docente cerró el registro del simulacro. Puedes practicar igual, pero tus notas ya no se guardan.</p>
      <ul class="sm-reglas">
        <li><b>5 partes, 17 preguntas, 100 puntos:</b> A multímetros y amperímetros (20); B potencia, FP y corrección (35); C puesta a tierra (10); D laboratorio (15); E interpretación de resultados (20).</li>
        <li>Los enunciados <b>no traen fórmulas</b>, como en el examen: ten a mano tu formulario, calculadora y papel.</li>
        <li>Escribe los números con coma o con punto. Se acepta una diferencia de ±2 % (en el FP, ±0,01).</li>
        <li>Si una casilla depende de otra que tuviste mal, se revisa con <b>tus</b> números.</li>
        <li>Lo que dejes vacío cuenta como incorrecto. No hay reloj: avanza a tu ritmo; lo escrito se guarda en tu celular.</li>
      </ul>
      ${act ? `<button class="boton prim bloque" id="b-seguir">Continuar el simulacro ${act.k} (${llenas(act)} de ${SM.casillas()} casillas)</button>`
        : `<button class="boton prim bloque" id="b-nuevo">${E.n ? 'Hacer otro simulacro (datos nuevos)' : 'Empezar el simulacro'}</button>`}
      </div>
      ${hist.length ? `<div class="tarjeta"><span class="etq">Tus simulacros</span><table class="sm-tab"><tr><th>N.º</th><th>Fecha</th><th>Nota</th></tr>${hist.map((h) => `<tr><td>${h.k}</td><td>${fecha(h.fecha)}</td><td><b>${String(h.nota).replace('.', ',')}</b> / 100</td></tr>`).join('')}</table>
        ${E.ult ? '<button class="boton bloque" id="b-rev">Ver la revisión del último simulacro</button>' : ''}</div>` : ''}
      <p class="sm-pie">${esc(alumno.nombre)}; C.U. ${esc(alumno.carnet)}; ${esc(alumno.car)}. <a href="#" id="b-otro">No soy yo</a></p>`;
    if ($('#b-seguir')) $('#b-seguir').onclick = () => vSim();
    if ($('#b-nuevo')) $('#b-nuevo').onclick = () => { nuevoSim(); vSim(); };
    if ($('#b-rev')) $('#b-rev').onclick = () => vRes(E.ult);
    $('#b-otro').onclick = (ev) => { ev.preventDefault(); if (!confirmarSalida()) return; II.guardar(K_AL, null); alumno = null; vRegistro(); };
    verEstado();
    window.scrollTo(0, 0);
  }
  const confirmarSalida = () => !E.act || window.confirm('Tienes un simulacro sin terminar en este celular. Si entras con otro nombre, queda guardado para cuando vuelvas. ¿Seguir?');
  function nuevoSim() {
    E.n += 1;
    E.act = { k: E.n, semilla: alumno.carnet + '|' + E.n, inicio: Date.now(), resp: {}, raz: {}, parte: 'A' };
    guardarE();
  }

  // ---------------- simulacro ----------------
  let D = null;
  function vSim() {
    const act = E.act;
    D = SM.datos(act.semilla);
    pintarParte();
  }
  function avance() {
    const act = E.act, n = llenas(act), b = $('#e-avance');
    b.textContent = n + '/' + SM.casillas(); b.classList.remove('oculto');
    SM.PARTES.forEach((p) => {
      const t = cont.querySelector(`.sm-tabs [data-p="${p.id}"] small`); if (!t) return;
      let tot = 0, ll = 0;
      p.preg.forEach((qid) => SM.porId[qid].items.forEach((it) => { tot++; const v = act.resp[qid] && act.resp[qid][it.id]; if (v != null && v !== '' && !(Array.isArray(v) && !v.length)) ll++; }));
      t.textContent = ll + '/' + tot;
      t.parentNode.classList.toggle('lleno', ll === tot);
    });
  }
  function pintarParte() {
    const act = E.act, P = SM.PARTES.find((p) => p.id === act.parte) || SM.PARTES[0], i = SM.PARTES.indexOf(P);
    $('#e-sub').textContent = 'Simulacro ' + act.k + '; parte ' + P.id;
    const tabs = `<nav class="sm-tabs">${SM.PARTES.map((p) => `<button data-p="${p.id}" class="${p.id === P.id ? 'on' : ''}"><b>${p.id}</b><small></small></button>`).join('')}</nav>`;
    const cuerpo = P.preg.map((qid) => preguntaHtml(SM.porId[qid])).join('');
    const nav = `<div class="sm-nav">${i > 0 ? `<button class="boton" data-ir="${SM.PARTES[i - 1].id}">← Parte ${SM.PARTES[i - 1].id}</button>` : '<span></span>'}
      ${i < SM.PARTES.length - 1 ? `<button class="boton prim" data-ir="${SM.PARTES[i + 1].id}">Parte ${SM.PARTES[i + 1].id} →</button>` : '<button class="boton prim" id="b-fin">Terminar y ver mi nota</button>'}</div>`;
    cont.innerHTML = tabs + `<div class="sm-parte"><span class="etq">Parte ${P.id}; ${P.max} puntos</span><h2>${P.t}</h2></div>` + cuerpo + nav +
      `<div class="sm-fin-sal"><button class="boton" id="b-salir">Guardar y salir</button>${i < SM.PARTES.length - 1 ? '<button class="boton" id="b-fin2">Terminar ahora</button>' : ''}</div>`;
    avance();
    window.scrollTo(0, 0);
  }
  function preguntaHtml(q) {
    const d = D[q.id], r = E.act.resp[q.id] || {};
    const items = q.items.map((it) => {
      const et = SM.etq(it, d), pts = `<span class="sm-pts">${String(it.pts).replace('.', ',')} pt${it.pts === 1 ? '' : 's'}</span>`;
      if (it.tipo === 'op') {
        const o = SM.opciones(q, d, it), ord = SM.orden(E.act.semilla, q, it, o.length);
        return `<div class="sm-item"><p class="sm-et">${et} ${pts}</p><div class="sm-ops">${ord.map((k, j) => `<button class="sm-op${String(r[it.id]) === String(k) ? ' sel' : ''}" data-q="${q.id}" data-i="${it.id}" data-k="${k}"><b>${'ABCD'[j]}</b><span>${o[k].h}</span></button>`).join('')}</div></div>`;
      }
      if (it.tipo === 'ord') {
        const pasos = q.pasos(d), o = Array.isArray(r[it.id]) ? r[it.id] : SM.ordenInicial(E.act.semilla, q, d);
        return `<div class="sm-item"><p class="sm-et">${et} ${pts}</p><p class="sm-ayuda">${Array.isArray(r[it.id]) ? 'Puedes seguir moviendo los pasos.' : 'Todavía no ordenaste: usa las flechas.'}</p><ol class="sm-ord" data-q="${q.id}" data-i="${it.id}">${o.map((k, j) => `<li data-k="${k}"><span class="sm-ord-t">${pasos[k]}</span><span class="sm-ord-b"><button data-m="-1" ${j === 0 ? 'disabled' : ''} aria-label="Subir">▲</button><button data-m="1" ${j === o.length - 1 ? 'disabled' : ''} aria-label="Bajar">▼</button></span></li>`).join('')}</ol></div>`;
      }
      return `<label class="sm-item sm-num"><span class="sm-et">${et} ${pts}</span><input class="sm-in" inputmode="decimal" autocomplete="off" autocapitalize="off" spellcheck="false" data-q="${q.id}" data-i="${it.id}" value="${esc(r[it.id] == null ? '' : r[it.id])}"></label>`;
    }).join('');
    const raz = q.raz ? `<label class="sm-item"><span class="sm-et">Explica tu razonamiento <span class="sm-pts">opcional, no suma</span></span><textarea class="sm-raz" rows="3" data-q="${q.id}">${esc(E.act.raz[q.id] || '')}</textarea></label>` : '';
    return `<div class="tarjeta sm-q"><span class="etq">${q.id}; ${q.pts} puntos</span><h3>${q.t}</h3>${q.enun(d)}${q.fig ? `<div class="sm-fig">${q.fig(d)}</div>` : ''}${items}${raz}</div>`;
  }
  let tGuardar = null;
  const guardarPronto = () => { clearTimeout(tGuardar); tGuardar = setTimeout(guardarE, 400); };
  cont.addEventListener('input', (ev) => {
    if (!E || !E.act) return;
    const el = ev.target;
    if (el.classList.contains('sm-in')) {
      const q = el.dataset.q, i = el.dataset.i; E.act.resp[q] = E.act.resp[q] || {}; E.act.resp[q][i] = el.value.slice(0, 20);
      const x = SM.leer(el.value); el.classList.toggle('inval', !!x.invalido);
      guardarPronto(); avance();
    } else if (el.classList.contains('sm-raz')) { E.act.raz[el.dataset.q] = el.value.slice(0, 1200); guardarPronto(); }
  });
  cont.addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b || !E) return;
    if (b.classList.contains('sm-op')) {
      const q = b.dataset.q, i = b.dataset.i; E.act.resp[q] = E.act.resp[q] || {}; E.act.resp[q][i] = Number(b.dataset.k);
      b.parentNode.querySelectorAll('.sm-op').forEach((x) => x.classList.toggle('sel', x === b)); guardarE(); avance(); return;
    }
    if (b.dataset.m) {
      const ol = b.closest('.sm-ord'), li = b.closest('li'), q = ol.dataset.q, i = ol.dataset.i;
      const lis = [...ol.children], j = lis.indexOf(li), m = Number(b.dataset.m), k = j + m;
      if (k < 0 || k >= lis.length) return;
      const o = lis.map((x) => Number(x.dataset.k)); [o[j], o[k]] = [o[k], o[j]];
      E.act.resp[q] = E.act.resp[q] || {}; E.act.resp[q][i] = o; guardarE();
      const qq = SM.porId[q], card = ol.closest('.sm-q');
      const y = b.getBoundingClientRect().top;
      card.outerHTML = preguntaHtml(qq);
      const nuevo = cont.querySelector(`.sm-ord[data-q="${q}"] li:nth-child(${k + 1}) button[data-m="${m}"]`) || cont.querySelector(`.sm-ord[data-q="${q}"] li:nth-child(${k + 1}) button`);
      if (nuevo) window.scrollBy(0, nuevo.getBoundingClientRect().top - y);
      avance(); return;
    }
    if (b.dataset.ir) { E.act.parte = b.dataset.ir; guardarE(); pintarParte(); return; }
    if (b.closest('.sm-tabs')) { E.act.parte = b.dataset.p; guardarE(); pintarParte(); return; }
    if (b.id === 'b-fin' || b.id === 'b-fin2') { confirmarFin(); return; }
    if (b.id === 'b-salir') { guardarE(); vInicio(); return; }
  });
  function confirmarFin() {
    const vac = SM.casillas() - llenas(E.act);
    const caja = document.createElement('div');
    caja.className = 'sm-modal';
    caja.innerHTML = `<div class="tarjeta"><h2>¿Terminar el simulacro?</h2>${vac ? `<p>Te faltan <b>${vac}</b> casillas por llenar: lo vacío cuenta como incorrecto.</p>` : '<p>Llenaste todas las casillas.</p>'}
      <p>Después verás tu nota y la solución, y ya no podrás cambiar las respuestas de este simulacro.</p>
      <div class="sm-nav"><button class="boton" id="m-no">Volver</button><button class="boton prim" id="m-si">Terminar y ver mi nota</button></div></div>`;
    document.body.appendChild(caja);
    $('#m-no', caja).onclick = () => caja.remove();
    $('#m-si', caja).onclick = () => { caja.remove(); terminar(); };
  }
  function terminar() {
    const act = E.act, c = SM.calificar(act.semilla, act.resp), seg = Math.round((Date.now() - act.inicio) / 1000);
    const fin = Date.now(), h = { k: act.k, nota: c.nota, partes: c.partes, fecha: fin, env: PRUEBA ? 'prueba' : 'pend' };
    E.hist.push(h);
    E.ult = { k: act.k, semilla: act.semilla, resp: act.resp, raz: act.raz, nota: c.nota, fecha: fin };
    E.act = null;
    guardarE();
    const pts = {}; Object.entries(c.preg).forEach(([k, v]) => (pts[k] = v.pts));
    encolar({ sesion: SID, actividad: 'sim', carnet: alumno.carnet, nombre: alumno.nombre, correcta: null, intento: Math.min(act.k, 5), puntaje: c.nota,
      respuesta: { k: act.k, nota: c.nota, partes: c.partes, pts, vacias: c.vacias, seg, car: alumno.car } });
    vRes(E.ult);
  }

  // ---------------- resultado y revisión ----------------
  function vRes(u) {
    $('#e-avance').classList.add('oculto');
    $('#e-sub').textContent = 'Simulacro ' + u.k + ': revisión';
    const c = SM.calificar(u.semilla, u.resp), h = E.hist.find((x) => x.k === u.k);
    const msg = c.nota >= 85 ? 'Muy bien: estás listo.' : c.nota >= 51 ? 'Vas bien. Revisa lo que fallaste y haz otro.' : 'Todavía falta. Revisa las soluciones con calma y haz otro con datos nuevos.';
    const partes = SM.PARTES.map((p) => `<tr><td><b>${p.id}</b> ${p.t}</td><td class="n">${String(c.partes[p.id]).replace('.', ',')} / ${p.max}</td></tr>`).join('');
    const botones = '<div class="sm-nav col"><button class="boton prim" data-a="otro">Hacer otro simulacro con datos nuevos</button><button class="boton" data-a="inicio">Volver al inicio</button></div>';
    const revision = SM.PREG.map((q) => {
      const d = c.D[q.id], r = u.resp[q.id] || {}, cq = c.preg[q.id];
      const its = q.items.map((it) => {
        const det = cq.det[it.id], m = SM.mostrarEsp(q, d, it, det), et = SM.etq(it, d);
        let tuya = '<i>vacía</i>';
        if (it.tipo === 'op') { const o = SM.opciones(q, d, it); if (r[it.id] != null && r[it.id] !== '' && o[r[it.id]]) tuya = o[r[it.id]].h; }
        else if (it.tipo === 'ord') { tuya = Array.isArray(r[it.id]) ? `${String(det.p).replace('.', ',')} de ${it.pts} puntos por los pasos en su lugar` : tuya; }
        else if (r[it.id] != null && String(r[it.id]).trim() !== '') tuya = esc(r[it.id]);
        const marca = det.ok ? '<span class="sm-bien">✓</span>' : det.p > 0 ? '<span class="sm-medio">½</span>' : '<span class="sm-malo">✗</span>';
        const esp = it.tipo === 'ord' ? '' : `<span class="sm-esp">${det.ok ? '' : 'Correcto: ' + (m.exacto || '') + (m.propio ? `; con tus números: ${m.propio}` : '')}</span>`;
        return `<div class="sm-rev-it ${det.ok ? 'ok' : det.p > 0 ? 'medio' : 'mal'}">${marca}<div><p class="sm-et">${et}</p><p>Tu respuesta: ${tuya}</p>${esp}</div></div>`;
      }).join('');
      const sol = q.sol(d).map((x) => (x.trim().charAt(0) === '<' ? x : `<div class="sm-sol-l">\\(\\displaystyle ${x}\\)</div>`)).join('');
      const raz = q.raz ? `<div class="sm-modelo"><b>Respuesta modelo:</b> ${esc(q.modelo(d))}${u.raz && u.raz[q.id] ? `<p class="sm-tuya"><b>Lo que escribiste:</b> ${esc(u.raz[q.id])}</p>` : ''}</div>` : '';
      return `<details class="tarjeta sm-rev"${cq.pts < q.pts ? ' open' : ''}><summary><span class="etq">${q.id}</span> ${q.t}<b class="sm-rev-p">${String(cq.pts).replace('.', ',')} / ${q.pts}</b></summary>
        ${q.enun(d)}${q.fig ? `<div class="sm-fig">${q.fig(d)}</div>` : ''}${its}<div class="sm-sol"><span class="etq">Solución</span>${sol}</div>${raz}</details>`;
    }).join('');
    cont.innerHTML = `<div class="tarjeta sm-res"><span class="etq">Simulacro ${u.k}</span><p class="sm-nota-g">${String(c.nota).replace('.', ',')}<small> / 100</small></p><p>${msg}</p>
      <table class="sm-tab">${partes}</table>${envHtml(h)}${botones}</div>
      <p class="sm-sub">Revisión por pregunta (abiertas las que tienen errores)</p>${revision}${botones}`;
    window.scrollTo(0, 0);
  }
  cont.addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-a]'); if (!b) return;
    if (b.dataset.a === 'inicio') vInicio();
    if (b.dataset.a === 'otro') { if (!E.act) nuevoSim(); vSim(); }
  });

  // ---------------- arranque ----------------
  if (alumno && alumno.carnet) { cargarE(); registrarIngreso(); if (E.act) vSim(); else vInicio(); }
  else vRegistro();
  vaciar();
})();
