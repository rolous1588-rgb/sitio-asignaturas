// ============================================================
// Transformadas · Práctica para el examen final (25/11/2026) — página del estudiante
// Se entra con un enlace (sin QR) y se practica a cualquier hora. Registro: apellidos, nombres, C.U. y carrera.
// Portada con 9 temas (Laplace 1–5, Fourier 6–9) y 3 simulacros. En cada tema: repaso, errores típicos y ejercicios
// con números nuevos cada vez, en dos modos:
//   «Paso a paso»: un paso a la vez; 2 intentos por paso y una pista después del 1.º; si falla los dos, se le muestra.
//   «Como en el examen»: todo junto; «Revisar» marca cada casilla con la respuesta correcta (con sus números) y la solución.
// Simulacros: como los exámenes, sin pistas; al terminar, nota, revisión y solución.
// Envíos a la sesión asíncrona tf-practica: «ingreso» (uno por día), «prac» (cada ejercicio) y «sim» (cada simulacro).
// El avance vive en el celular (tfpr-v1-<C.U.>); cola de envíos propia (tfpr-cola). ?modo=prueba = no envía nada.
// ============================================================
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = II.esc;
  const SID = 'tf-practica';
  const PRUEBA = new URLSearchParams(location.search).get('modo') === 'prueba';
  const K_AL = 'tfpr-alumno', K_COLA = 'tfpr-cola', kE = (c) => 'tfpr-v1-' + c;
  const CARRERAS = ['Ingeniería Electromecánica', 'Ingeniería Biomédica'];
  const cont = $('#cont');
  let alumno = II.leer(K_AL, null), E = null, abierto = null, vista = '';
  const fmt = (x) => String(Math.round(x * 100) / 100).replace('.', ',');
  const vacio = (v) => v == null || String(v).trim() === '';
  const normCU = (s) => String(s || '').toUpperCase().replace(/[^0-9A-Z]/g, '');

  // ---------------- estado del estudiante ----------------
  const nuevoT = () => ({ n: 0, act: null, hechos: 0, pcts: [], mejor: null, modo: 'guia' });
  const nuevoE = () => ({ t: Object.fromEntries(PR.TEMAS.map((t) => [t.id, nuevoT()])), s: { n: 0, act: null, hist: [], ult: null } });
  function cargarE() {
    const g = II.leer(kE(alumno.carnet), null), base = nuevoE();
    E = g ? { t: Object.assign(base.t, g.t || {}), s: Object.assign(base.s, g.s || {}) } : base;
    PR.TEMAS.forEach((t) => { E.t[t.id] = Object.assign(nuevoT(), E.t[t.id]); });
  }
  const guardarE = () => II.guardar(kE(alumno.carnet), E);
  let tGuardar = null;
  const guardarPronto = () => { clearTimeout(tGuardar); tGuardar = setTimeout(guardarE, 400); };

  // ---------------- conexión y envíos ----------------
  II.alCambiarConexion((ok) => { const p = $('#e-con'); if (p) p.className = 'punto ' + (ok === false ? 'off' : ok ? 'on' : ''); });
  function encolar(reg) { if (PRUEBA) return; const c = II.leer(K_COLA, []); c.push(reg); II.guardar(K_COLA, c.slice(-60)); vaciar(); }
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
    if (reg.actividad !== 'sim') return;
    const e2 = II.leer(kE(reg.carnet), null);
    if (!e2 || !e2.s || !e2.s.hist) return;
    const h = e2.s.hist.find((x) => x.k === reg.respuesta.k);
    if (h) { h.env = estado; II.guardar(kE(reg.carnet), e2); }
    if (alumno && reg.carnet === alumno.carnet && E) { const h2 = E.s.hist.find((x) => x.k === reg.respuesta.k); if (h2) h2.env = estado; const b = $('#res-env'); if (b && h2) b.outerHTML = envHtml(h2); }
  }
  setInterval(vaciar, 15000);
  window.addEventListener('online', vaciar);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') vaciar(); else if (E) { if (vista === 'tema' && TID) enviarParcial(TID); guardarE(); } });

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
    const hoy = new Date().toISOString().slice(0, 10), k = 'tfpr-ing-' + alumno.carnet;
    if (II.leer(k, '') === hoy) return;
    try {
      const { error } = await II.sb.from('ingresos').insert({ sesion: SID, carnet: alumno.carnet, nombre: alumno.nombre.slice(0, 80), info: { car: alumno.car } });
      if (!error) II.guardar(k, hoy);
    } catch (e) { /* se intentará la próxima vez */ }
  }
  const base = (actividad, respuesta, puntaje, intento) => ({ sesion: SID, actividad, carnet: alumno.carnet, nombre: alumno.nombre, correcta: null, intento: Math.max(1, Math.min(intento || 1, 5)), puntaje, respuesta: Object.assign(respuesta, { car: alumno.car }) });

  // ---------------- piezas comunes ----------------
  const tarjeta = (h, cls = '') => `<div class="tarjeta ${cls}">${h}</div>`;
  const pctTxt = (x) => (x == null ? '—' : Math.round(x) + '\u00a0%');
  const esperadoTex = (ej, it, c) => (it.tipo === 'op' ? `\\(${ej.d.op[it.id][c.exp].t}\\)` : `\\(${ej.M.tex(c.exp)}\\)`);
  // una casilla: ctx = { vals, marca: { cls, txt }, bloq }
  function itemHTML(ej, it, vals, marca, bloq) {
    const v = vals[it.id];
    const m = marca ? `<span class="mp-marca">${marca.txt}</span>` : '<span class="mp-marca"></span>';
    if (it.tipo === 'op') {
      const ok = marca && marca.cls !== 'ok-vivo' ? ej.d.op[it.id].findIndex((o) => o.ok) : -1;
      const ops = ej.d.op[it.id].map((o, i) => {
        const sel = String(v) === String(i);
        let cls = sel ? 'elegida' : '';
        if (ok >= 0 && marca.cls !== 'mal-vivo') { if (i === ok) cls = 'ok'; else if (sel) cls = 'mal'; }
        else if (marca && marca.cls === 'mal-vivo' && sel) cls = 'mal';
        else if (marca && marca.cls === 'ok-vivo' && sel) cls = 'ok';
        return `<button type="button" class="mp-op rc-op ${cls}" data-op="${it.id}" data-k="${i}" ${bloq ? 'disabled' : ''}>\\(${o.t}\\)</button>`;
      }).join('');
      return `<div class="rc-ops${it.fila ? ' rc-ops-fila' : ''} pr-it" data-it="${it.id}"><span class="et">\\(${it.et}\\) <small class="pr-pts">${fmt(it.pts)} pt</small></span>${ops}${m}</div>`;
    }
    const cls = marca ? (marca.cls === 'mal-vivo' ? 'mal' : marca.cls === 'ok-vivo' ? 'ok' : marca.cls) : '';
    return `<label class="mp-celda pr-it ${cls}" data-it="${it.id}"><span class="et">\\(${it.et}\\) <small class="pr-pts">${fmt(it.pts)} pt</small></span><span class="mp-num"><button type="button" class="mp-signo" data-signo="${it.id}" aria-label="Cambiar signo" ${bloq ? 'disabled' : ''}>±</button><input data-c="${it.id}" inputmode="decimal" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(v == null ? '' : v)}" ${bloq ? 'disabled' : ''}></span>${m}</label>`;
  }
  const pasoCab = (ps, extra = '') => `<h3 class="rc-paso">${esc(ps.t)}${extra}</h3>${ps.nota ? `<p class="mp-nota">${ps.nota}</p>` : ''}${ps.tex ? `<div class="ex-func rc-plantilla">\\[${ps.tex}\\]</div>` : ''}`;
  function solucionHTML(ej) {
    let f = '';
    try { f = ej.P.final(ej.d); } catch (e) { f = ''; }
    // una línea por resultado (separados con «;\quad» o «\quad» en los motores) para que no haya que correr de lado
    const lineas = f.split(/;?\\quad\s*/).filter((x) => x.trim());
    return f ? `<div class="sm-sol"><span class="etq">Solución</span>${lineas.map((x) => `<div class="ex-func">\\[${x}\\]</div>`).join('')}</div>` : '';
  }
  function envHtml(h) {
    if (PRUEBA) return '<p class="sm-env" id="res-env">Modo prueba: no se envía nada.</p>';
    if (!h) return '<p class="sm-env" id="res-env"></p>';
    if (h.env === 'ok') return '<p class="sm-env ok" id="res-env">✓ Quedó registrado para el docente.</p>';
    if (h.env === 'rech') return '<p class="sm-env mal" id="res-env">El registro de la práctica está cerrado: esto no quedó registrado (igual te sirve para practicar).</p>';
    return '<p class="sm-env" id="res-env">Enviando al docente… (se envía solo cuando haya conexión)</p>';
  }
  function confirmar(titulo, texto, si, no = 'Volver') {
    return new Promise((ok) => {
      const caja = document.createElement('div');
      caja.className = 'sm-modal';
      caja.innerHTML = `<div class="tarjeta"><h2>${titulo}</h2>${texto}<div class="sm-nav"><button class="boton" data-r="0">${no}</button><button class="boton prim" data-r="1">${si}</button></div></div>`;
      document.body.appendChild(caja);
      caja.addEventListener('click', (ev) => { const b = ev.target.closest('[data-r]'); if (!b) return; caja.remove(); ok(b.dataset.r === '1'); });
    });
  }
  const ir = (h) => { if (location.hash === h) pintar(); else location.hash = h; };

  // ---------------- registro ----------------
  function vRegistro() {
    vista = 'reg';
    $('#e-sub').textContent = 'Práctica para el examen final';
    cont.innerHTML = tarjeta(`<span class="etq">Transformadas y Funciones Especiales${PRUEBA ? '; modo prueba (no se envía nada)' : ''}</span><h2>Práctica para el examen final</h2>
      <p>Practica Laplace y Series de Fourier con problemas como los de tus exámenes. Cada ejercicio trae <b>números nuevos</b>: puedes repetir las veces que quieras.</p>
      <p class="sm-nota">Tu docente ve quién practicó y en qué temas. Esto no es la nota del examen.</p>
      <form id="f-reg">
        <label class="campo"><span>Apellidos</span><input name="ap" required maxlength="40" autocomplete="family-name"></label>
        <label class="campo"><span>Nombres</span><input name="no" required maxlength="38" autocomplete="given-name"></label>
        <label class="campo"><span>C.U. (carnet universitario)</span><input name="cu" required maxlength="20" inputmode="numeric" autocomplete="off"></label>
        <label class="campo"><span>Carrera</span><select name="car" required><option value="">Elige tu carrera</option>${CARRERAS.map((c) => `<option>${c}</option>`).join('')}</select></label>
        <p class="sm-err" id="reg-err"></p>
        <button class="boton prim bloque" type="submit">Entrar</button>
      </form>`);
    $('#f-reg').onsubmit = (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target), cu = normCU(fd.get('cu'));
      const ap = String(fd.get('ap')).trim().replace(/\s+/g, ' ').toUpperCase(), no = String(fd.get('no')).trim().replace(/\s+/g, ' ');
      if (cu.length < 3) { $('#reg-err').textContent = 'Revisa tu C.U.: debe tener al menos 3 caracteres.'; return; }
      if (ap.length < 2 || no.length < 2) { $('#reg-err').textContent = 'Escribe tus apellidos y tus nombres.'; return; }
      alumno = { carnet: cu, nombre: (ap + ', ' + no).slice(0, 80), ap, no, car: String(fd.get('car')) };
      II.guardar(K_AL, alumno);
      cargarE(); registrarIngreso();
      ir('#/');
    };
  }

  // ---------------- inicio ----------------
  const fecha = (t) => new Date(t).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  function vInicio() {
    vista = 'inicio';
    $('#e-sub').textContent = 'Práctica para el examen final';
    const bloques = PR.BLOQUES.map((B) => tarjeta(`<span class="etq">${B.sub}</span><h2>${B.titulo}</h2><div class="mp-menu">${PR.TEMAS.filter((t) => t.bloque === B.id).map((t) => {
      const s = E.t[t.id], hecho = s.mejor != null && s.mejor >= 80;
      const tu = s.hechos ? `tú: ${s.hechos} ejercicio${s.hechos > 1 ? 's' : ''}; mejor ${pctTxt(s.mejor)}` : 'todavía no practicaste';
      return `<button class="mp-item${hecho ? ' hecho' : ''}" data-tema="${t.id}"><span class="num">${t.num}</span><span class="txt"><b>${esc(t.titulo)}</b><small>En el examen, el curso sacó ${t.examen}\u00a0%; ${tu}</small></span><span class="flecha">›</span></button>`;
    }).join('')}</div>`)).join('');
    const act = E.s.act, hist = E.s.hist.slice().reverse();
    const sims = tarjeta(`<span class="etq">Para el final</span><h2>Simulacros</h2><p class="mp-nota">Como un examen: sin pistas y sin reloj. Al terminar ves tu nota, la revisión y la solución.</p>
      ${act ? `<button class="boton prim bloque" id="b-seguir-sim">Continuar: ${esc(PR.SIM[act.tipo].titulo)} (n.º ${act.k})</button>` : `<div class="mp-menu">${Object.entries(PR.SIM).map(([k, S]) => `<button class="mp-item" data-sim="${k}"><span class="num">S</span><span class="txt"><b>${S.titulo}</b><small>${S.sub}</small></span><span class="flecha">›</span></button>`).join('')}</div>`}
      ${hist.length ? `<table class="sm-tab"><tr><th>N.º</th><th>Simulacro</th><th>Fecha</th><th>Nota</th></tr>${hist.slice(0, 12).map((h) => `<tr><td>${h.k}</td><td>${esc(PR.SIM[h.tipo].titulo.replace('Simulacro ', ''))}</td><td>${fecha(h.fecha)}</td><td class="n">${fmt(h.nota)}</td></tr>`).join('')}</table>
        ${E.s.ult ? '<button class="boton bloque" id="b-rev">Ver la revisión del último simulacro</button>' : ''}` : ''}`);
    cont.innerHTML = tarjeta(`<span class="etq">Práctica para el examen final${PRUEBA ? '; modo prueba' : ''}</span><h2>Hola, ${esc(alumno.no.split(' ')[0])}</h2>
      <p class="sm-aviso mal oculto" id="av-cerrado">El docente cerró el registro de la práctica. Puedes practicar igual, pero ya no se guarda.</p>
      <ul class="sm-reglas"><li>Elige un tema: primero lee el <b>repaso</b> y los <b>errores típicos</b>; después practica.</li>
      <li><b>Paso a paso:</b> 2 intentos por paso, con una pista después del primero. <b>Como en el examen:</b> todo junto y después «Revisar».</li>
      <li>Escribe los números con coma o con punto; también vale una fracción como 3/5. Se acepta ±2 %.</li></ul>`) + bloques + sims +
      `<p class="sm-pie">${esc(alumno.nombre)}; C.U. ${esc(alumno.carnet)}; ${esc(alumno.car)}. <a href="#" id="b-otro">No soy yo</a></p>`;
    $$('[data-tema]').forEach((b) => (b.onclick = () => ir('#/t/' + b.dataset.tema)));
    $$('[data-sim]').forEach((b) => (b.onclick = () => { nuevoSim(b.dataset.sim); ir('#/s'); }));
    if ($('#b-seguir-sim')) $('#b-seguir-sim').onclick = () => ir('#/s');
    if ($('#b-rev')) $('#b-rev').onclick = () => ir('#/r');
    $('#b-otro').onclick = (ev) => { ev.preventDefault(); guardarE(); II.guardar(K_AL, null); alumno = null; E = null; vRegistro(); };
    verEstado();
  }

  // ---------------- tema ----------------
  let TID = null;
  const semillaT = (tid, n) => alumno.carnet + '|' + tid + '|' + n;
  function nuevoEj(tid, modo) {
    const s = E.t[tid];
    if (s.act && !s.act.fin) enviarParcial(tid);
    s.n += 1; s.modo = modo || s.modo || 'guia';
    s.act = { n: s.n, semilla: semillaT(tid, s.n), modo: s.modo, vals: {}, paso: 0, est: {}, malo: {}, bien: {}, p1: {}, intp: {}, rev: 0, res: null, fin: false, inicio: Date.now() };
    guardarE();
  }
  const ejDe = (tid, act) => PR.ej(tid, act.semilla, alumno.car);

  function vTema(tid) {
    vista = 'tema'; TID = tid;
    const T = PR.porId[tid];
    if (!T) return ir('#/');
    const s = E.t[tid];
    if (!s.act) nuevoEj(tid);
    const act = s.act, ej = ejDe(tid, act);
    $('#e-sub').textContent = `Tema ${T.num}: ${T.titulo}`;
    const repaso = `<details class="tarjeta mp-repaso"${s.hechos ? '' : ' open'}><summary>Repaso: conceptos y fórmulas</summary><div class="pr-repaso">${T.repaso.join('')}</div></details>`;
    const errores = `<details class="tarjeta mp-repaso pr-err"><summary>Errores típicos del curso</summary><ul>${T.errores.map((x) => `<li>${x}</li>`).join('')}</ul></details>`;
    const modo = `<div class="pr-modo" role="tablist"><button data-modo="guia" class="${act.modo === 'guia' ? 'on' : ''}">Paso a paso<small>con pistas</small></button><button data-modo="exam" class="${act.modo === 'exam' ? 'on' : ''}">Como en el examen<small>todo junto</small></button></div>`;
    const cab = tarjeta(`<span class="etq">Ejercicio ${act.n}; ${fmt(ej.max)} puntos${act.modo === 'guia' ? '; paso a paso' : '; como en el examen'}</span>${act.modo === 'guia' && s.hechos === 0 && act.n === 1 ? '<p class="mp-nota">Los números son solo tuyos. Resuelve en tu cuaderno y escribe aquí cada resultado.</p>' : ''}<div class="ex-func">${ej.P.enunciado(ej.d)}</div>`);
    const cuerpo = act.modo === 'guia' ? guiaHTML(tid, ej, act) : examHTML(tid, ej, act);
    const tus = s.hechos ? `<p class="sm-pie">Ejercicios terminados en este tema: <b>${s.hechos}</b>; al primer intento: último ${pctTxt(s.pcts[s.pcts.length - 1])}, mejor ${pctTxt(s.mejor)}.</p>` : '';
    cont.innerHTML = `<button class="mp-volver" id="b-volver">‹ Temas</button>
      <div class="pr-tema-cab"><span class="pr-num">${T.num}</span><div><h2>${esc(T.titulo)}</h2><small>${T.bloque === 'L' ? 'Laplace' : 'Series de Fourier'}; en el examen el curso sacó ${T.examen}\u00a0%</small></div></div>
      ${repaso}${errores}${modo}${cab}${cuerpo}${tus}`;
    $('#b-volver').onclick = () => ir('#/');
  }

  // ---- modo «como en el examen» ----
  function examHTML(tid, ej, act) {
    const res = act.res;
    let h = '';
    ej.pasos.forEach((ps) => {
      const items = ps.items.map((it) => {
        let marca = null;
        if (res && res.cel[it.id]) {
          const c = res.cel[it.id];
          marca = c.r === 'ok' ? { cls: 'ok', txt: '✓' } : { cls: 'mal', txt: `✗ ${c.r === 'vacio' ? 'vacía; ' : ''}era ${esperadoTex(ej, it, c)}` };
        }
        return itemHTML(ej, it, act.vals, marca, false);
      }).join('');
      h += tarjeta(`${pasoCab(ps)}<div class="mp-celdas rc-celdas">${items}</div>`, 'rc-tpaso');
    });
    if (!res) {
      h += `<div class="mp-pie rc-pie"><button class="boton prim bloque" id="b-revisar">Revisar mi respuesta</button><span class="mp-int" id="m-rev"></span></div>`;
    } else {
      const pct = Math.round((100 * res.pts) / ej.max);
      h += tarjeta(`<div class="mp-res"><div class="grande">${fmt(res.pts)}<small> / ${fmt(ej.max)}</small></div><p>${pct >= 85 ? 'Muy bien.' : pct >= 51 ? 'Vas bien: mira lo que fallaste.' : 'Revisa la solución con calma y prueba otro.'}${act.rev > 1 ? ` (revisión n.º ${act.rev})` : ''}</p></div>
        <p class="mp-nota">En cada casilla con ✗ está lo que debía salir <b>con tus números</b>. Puedes corregir y revisar otra vez, o pedir otro ejercicio.</p>
        ${solucionHTML(ej)}
        <div class="mp-botones"><button class="boton prim" data-a="otro">Otro ejercicio (números nuevos)</button><button class="boton" id="b-revisar">Corregir y revisar otra vez</button><button class="boton" data-a="aguia">Probar uno paso a paso</button></div>`, 'pr-resultado');
    }
    return h;
  }
  function revisarExam() {
    const s = E.t[TID], act = s.act, ej = ejDe(TID, act);
    if (!ej.items.some((it) => !vacio(act.vals[it.id]))) { const m = $('#m-rev'); if (m) { m.textContent = 'Escribe al menos una respuesta.'; m.className = 'mp-int mal'; } return; }
    const r = PR.calificar(ej, act.vals);
    act.rev += 1;
    act.res = { pts: r.pts, cel: Object.fromEntries(Object.entries(r.cel).map(([id, c]) => [id, { r: c.r, exp: c.exp }])) };
    const pct = Math.round((100 * r.pts) / ej.max);
    if (act.rev === 1) { s.hechos += 1; s.pcts = s.pcts.concat(pct).slice(-30); s.mejor = Math.max(s.mejor == null ? 0 : s.mejor, pct); act.fin = true; }
    guardarE();
    encolar(base('prac', { t: TID, k: ej.k, n: act.n, modo: 'exam', int: act.rev, pts: r.pts, max: ej.max, cel: Object.fromEntries(Object.entries(r.cel).map(([id, c]) => [id, c.r])), seg: Math.round((Date.now() - act.inicio) / 1000) }, pct, act.rev));
    const y = window.scrollY;
    vTema(TID);
    const t = $('.pr-resultado');
    if (t && act.rev === 1) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); else window.scrollTo(0, y);
  }

  // ---- modo «paso a paso» ----
  function guiaHTML(tid, ej, act) {
    let h = '';
    ej.pasos.forEach((ps, i) => {
      if (i < act.paso || act.fin) {
        const items = ps.items.map((it) => {
          const e = act.est[it.id];
          const marca = e === 'ok1' ? { cls: 'ok', txt: '✓' } : e === 'ok2' ? { cls: 'ok', txt: '✓ al 2.º intento (vale la mitad)' } : { cls: 'rev', txt: 'Te la mostramos (0 pt)' };
          return itemHTML(ej, it, act.vals, marca, true);
        }).join('');
        h += tarjeta(`${pasoCab(ps, ' <span class="pr-ok">✓</span>')}<div class="mp-celdas rc-celdas">${items}</div>`, 'rc-tpaso pr-hecho');
      } else if (i === act.paso) {
        const n = act.intp[i] || 0;
        const bien = act.bien || {};
        const items = ps.items.map((it) => itemHTML(ej, it, act.vals, act.malo[it.id] ? { cls: 'mal-vivo', txt: '✗ Revisa esta' } : bien[it.id] ? { cls: 'ok-vivo', txt: '✓' } : null, false)).join('');
        const pista = n >= 1 ? `<div class="mp-ayuda pr-pista"><p><b>Pista:</b> ${PR.pista(ej, i)}</p><p>Te queda <b>1 intento</b> en este paso (vale la mitad). Si fallas, te mostramos la respuesta y sigues.</p></div>` : '';
        h += tarjeta(`${pasoCab(ps)}<div class="mp-celdas rc-celdas">${items}</div>${pista}
          <div class="mp-pie"><button class="boton prim bloque" id="b-comprobar">Comprobar este paso</button><span class="mp-int" id="m-paso"></span></div>`, 'rc-tpaso pr-actual');
      } else {
        h += `<div class="tarjeta pr-futuro"><h3 class="rc-paso">${esc(ps.t)}</h3><small>Se abre cuando termines el paso anterior.</small></div>`;
      }
    });
    if (act.fin) {
      const pts = puntosGuia(ej, act), pct = Math.round((100 * pts) / ej.max);
      h += tarjeta(`<div class="mp-res"><div class="grande">${fmt(pts)}<small> / ${fmt(ej.max)}</small></div><p>${pct} % (lo que salió al 2.º intento vale la mitad). ${pct >= 85 ? '¡Muy bien!' : pct >= 51 ? 'Vas bien.' : 'Sigue practicando: cada ejercicio trae números nuevos.'}</p></div>
        ${solucionHTML(ej)}
        <div class="mp-botones"><button class="boton prim" data-a="otro">Otro ejercicio (números nuevos)</button><button class="boton" data-a="aexam">Probar uno como en el examen</button></div>`, 'pr-resultado');
    }
    return h;
  }
  const puntosGuia = (ej, act) => Math.round(ej.items.reduce((s, it) => s + it.pts * (act.est[it.id] === 'ok1' ? 1 : act.est[it.id] === 'ok2' ? 0.5 : 0), 0) * 100) / 100;
  function comprobarPaso() {
    const s = E.t[TID], act = s.act, ej = ejDe(TID, act), i = act.paso, ps = ej.pasos[i];
    if (ps.items.some((it) => vacio(act.vals[it.id]))) { const m = $('#m-paso'); m.textContent = 'Completa todas las casillas de este paso.'; m.className = 'mp-int mal'; return; }
    const n = (act.intp[i] || 0) + 1;
    act.intp[i] = n;
    act.p1 = act.p1 || {};
    let r = PR.calificar(ej, act.vals);
    if (n === 1) ps.items.forEach((it) => { act.p1[it.id] = r.cel[it.id].r === 'ok'; });
    let malos = ps.items.filter((it) => r.cel[it.id].r !== 'ok');
    const listo = !malos.length || n >= 2;
    if (listo) {
      // segundo intento fallido: se muestran las que siguen mal (y las que cambien por mostrar otra del mismo paso)
      for (let vuelta = 0; vuelta < 4 && malos.length; vuelta++) {
        malos.forEach((it) => { const c = r.cel[it.id]; act.est[it.id] = 'rev'; act.vals[it.id] = it.tipo === 'op' ? String(c.exp) : ej.M.txt(c.exp); });
        r = PR.calificar(ej, act.vals);
        malos = ps.items.filter((it) => r.cel[it.id].r !== 'ok');
      }
      ps.items.forEach((it) => { if (act.est[it.id] !== 'rev') act.est[it.id] = act.p1[it.id] ? 'ok1' : 'ok2'; });
      act.paso = i + 1; act.malo = {}; act.bien = {};
    } else {
      act.malo = Object.fromEntries(malos.map((it) => [it.id, true]));
      act.bien = Object.fromEntries(ps.items.filter((it) => !act.malo[it.id]).map((it) => [it.id, true]));
    }
    if (act.paso >= ej.pasos.length && !act.fin) terminarGuia(ej, act, s);
    guardarE();
    const y = window.scrollY;
    vTema(TID);
    const sig = $('.pr-actual') || $('.pr-resultado');
    if (sig && listo) sig.scrollIntoView({ behavior: 'smooth', block: 'start' }); else window.scrollTo(0, y);
  }
  function terminarGuia(ej, act, s) {
    act.fin = true;
    const pts = puntosGuia(ej, act), pct = Math.round((100 * pts) / ej.max);
    s.hechos += 1; s.pcts = s.pcts.concat(pct).slice(-30); s.mejor = Math.max(s.mejor == null ? 0 : s.mejor, pct);
    encolar(base('prac', { t: TID, k: ej.k, n: act.n, modo: 'guia', int: 1, pts, max: ej.max, cel: Object.assign({}, act.est), seg: Math.round((Date.now() - act.inicio) / 1000) }, pct, 1));
  }
  // si deja un ejercicio paso a paso a medias (sale del tema, pide otro o cierra la página), se envía lo que alcanzó a comprobar;
  // si después lo termina, se envía completo y el panel se queda con el último envío de ese ejercicio
  function enviarParcial(tid) {
    const act = E.t[tid] && E.t[tid].act;
    if (!act || act.fin || act.modo !== 'guia') return;
    const nEst = Object.keys(act.est).length;
    if (!nEst || act.envN === nEst) return;
    const ej = ejDe(tid, act), pts = puntosGuia(ej, act);
    act.envN = nEst;
    guardarE();
    encolar(base('prac', { t: tid, k: ej.k, n: act.n, modo: 'guia', int: 1, inc: true, pasos: act.paso, pts, max: ej.max, cel: Object.assign({}, act.est), seg: Math.round((Date.now() - act.inicio) / 1000) }, Math.round((100 * pts) / ej.max), 1));
  }

  // ---------------- simulacros ----------------
  function nuevoSim(tipo) {
    E.s.n += 1;
    E.s.act = { tipo, k: E.s.n, semilla: alumno.carnet + '|sim|' + E.s.n, vals: Object.fromEntries(PR.SIM[tipo].temas.map((t) => [t, {}])), tab: 0, inicio: Date.now() };
    guardarE();
  }
  const ejSim = (a, tid) => PR.ej(tid, a.semilla + '|' + tid, alumno.car);
  const llenas = (a, tid) => { const v = a.vals[tid] || {}; return ejSim(a, tid).items.filter((it) => !vacio(v[it.id])).length; };
  function vSim() {
    const a = E.s.act;
    if (!a) return ir('#/');
    vista = 'sim';
    const S = PR.SIM[a.tipo], tid = S.temas[a.tab] || S.temas[0], ej = ejSim(a, tid);
    $('#e-sub').textContent = `${S.titulo} n.º ${a.k}`;
    const tabs = `<nav class="pr-tabs">${S.temas.map((t, i) => { const e2 = ejSim(a, t), n = llenas(a, t); return `<button data-tab="${i}" class="${i === a.tab ? 'on' : ''}${n === e2.items.length ? ' lleno' : ''}"><b>P${i + 1}</b><small>${n}/${e2.items.length}</small></button>`; }).join('')}</nav>`;
    let h = tarjeta(`<span class="etq">P${a.tab + 1}; ${esc(PR.porId[tid].titulo)}; ${fmt(ej.max)} puntos${a.tipo === 'todo' ? ' (sobre 100 en su bloque)' : ''}</span><div class="ex-func">${ej.P.enunciado(ej.d)}</div>`);
    ej.pasos.forEach((ps) => { h += tarjeta(`${pasoCab(ps)}<div class="mp-celdas rc-celdas">${ps.items.map((it) => itemHTML(ej, it, a.vals[tid], null, false)).join('')}</div>`, 'rc-tpaso'); });
    const i = a.tab, nT = S.temas.length;
    const nav = `<div class="sm-nav">${i > 0 ? `<button class="boton" data-tab="${i - 1}">← P${i}</button>` : '<span></span>'}${i < nT - 1 ? `<button class="boton prim" data-tab="${i + 1}">P${i + 2} →</button>` : '<button class="boton prim" id="b-fin">Terminar y ver mi nota</button>'}</div>`;
    cont.innerHTML = tabs + h + nav + `<div class="sm-fin-sal"><button class="boton" id="b-salir">Guardar y salir</button>${i < nT - 1 ? '<button class="boton" id="b-fin2">Terminar ahora</button>' : ''}</div>`;
  }
  async function terminarSim() {
    const a = E.s.act, S = PR.SIM[a.tipo];
    const tot = S.temas.reduce((s, t) => s + ejSim(a, t).items.length, 0), ll = S.temas.reduce((s, t) => s + llenas(a, t), 0);
    const ok = await confirmar('¿Terminar el simulacro?', `${tot - ll ? `<p>Te faltan <b>${tot - ll}</b> casillas: lo vacío cuenta como incorrecto.</p>` : '<p>Llenaste todas las casillas.</p>'}<p>Después verás tu nota y la solución, y ya no podrás cambiar las respuestas de este simulacro.</p>`, 'Terminar y ver mi nota');
    if (!ok) return;
    const pts = {}, cel = {};
    S.temas.forEach((t) => { const ej = ejSim(a, t), r = PR.calificar(ej, a.vals[t]); pts[t] = r.pts; cel[t] = Object.fromEntries(Object.entries(r.cel).map(([id, c]) => [id, c.r === 'ok' ? 1 : 0])); });
    const nota = PR.notaSim(a.tipo, pts), fin = Date.now();
    const h = { tipo: a.tipo, k: a.k, nota, fecha: fin, env: PRUEBA ? 'prueba' : 'pend' };
    E.s.hist.push(h);
    E.s.ult = { tipo: a.tipo, k: a.k, semilla: a.semilla, vals: a.vals, nota, fecha: fin };
    E.s.act = null;
    guardarE();
    encolar(base('sim', { tipo: a.tipo, k: a.k, nota, pts, cel, seg: Math.round((fin - a.inicio) / 1000) }, nota, a.k));
    ir('#/r');
  }
  function vRes() {
    const u = E.s.ult;
    if (!u) return ir('#/');
    vista = 'res';
    const S = PR.SIM[u.tipo], h = E.s.hist.find((x) => x.k === u.k);
    $('#e-sub').textContent = `${S.titulo} n.º ${u.k}: revisión`;
    const filas = [], det = [];
    S.temas.forEach((t, i) => {
      const ej = PR.ej(t, u.semilla + '|' + t, alumno.car), r = PR.calificar(ej, u.vals[t]);
      filas.push(`<tr><td><b>P${i + 1}</b> ${esc(PR.porId[t].titulo)}</td><td class="n">${fmt(r.pts)} / ${fmt(ej.max)}</td></tr>`);
      const its = ej.items.map((it) => {
        const c = r.cel[it.id], v = (u.vals[t] || {})[it.id];
        const tuya = vacio(v) ? '<i>vacía</i>' : it.tipo === 'op' ? `\\(${ej.d.op[it.id][Number(v)].t}\\)` : esc(v);
        return `<div class="sm-rev-it ${c.r === 'ok' ? 'ok' : 'mal'}">${c.r === 'ok' ? '<span class="sm-bien">✓</span>' : '<span class="sm-malo">✗</span>'}<div><p class="sm-et">\\(${it.et}\\)</p><p>Tu respuesta: ${tuya}</p>${c.r === 'ok' ? '' : `<span class="sm-esp">Debía ser ${esperadoTex(ej, it, c)}</span>`}</div></div>`;
      }).join('');
      det.push(`<details class="tarjeta sm-rev"${r.pts < ej.max ? ' open' : ''}><summary><span class="etq">P${i + 1}</span> ${esc(PR.porId[t].titulo)}<b class="sm-rev-p">${fmt(r.pts)} / ${fmt(ej.max)}</b></summary><div class="ex-func">${ej.P.enunciado(ej.d)}</div>${its}${solucionHTML(ej)}
        <p class="mp-nota"><a href="#/t/${t}">Practicar este tema ›</a></p></details>`);
    });
    const msg = u.nota >= 85 ? 'Muy bien: estás listo.' : u.nota >= 51 ? 'Vas bien. Revisa lo que fallaste y practica esos temas.' : 'Todavía falta. Practica los temas con más errores, paso a paso, y vuelve a intentarlo.';
    const botones = '<div class="sm-nav col"><button class="boton prim" data-a="otrosim">Hacer otro simulacro igual (números nuevos)</button><button class="boton" data-a="inicio">Volver al inicio</button></div>';
    cont.innerHTML = tarjeta(`<span class="etq">${esc(S.titulo)} n.º ${u.k}</span><p class="sm-nota-g">${fmt(u.nota)}<small> / 100</small></p><p>${msg}</p>
      <table class="sm-tab">${filas.join('')}</table>${u.tipo === 'todo' ? '<p class="mp-nota">La nota es el promedio de los dos bloques (Laplace sobre 100 y Fourier sobre 100).</p>' : ''}${envHtml(h)}${botones}`, 'sm-res') +
      `<p class="sm-sub">Revisión por problema (abiertos los que tienen errores)</p>${det.join('')}${botones}`;
  }

  // ---------------- eventos ----------------
  function cambiarValor(id, valor) {
    if (vista === 'tema') {
      const act = E.t[TID].act;
      if (valor === '' || valor == null) delete act.vals[id]; else act.vals[id] = valor;
      if (act.modo === 'exam' && act.res && act.res.cel[id]) { delete act.res.cel[id]; const el = $(`[data-it="${id}"]`); if (el) { el.classList.remove('ok', 'mal'); const m = $('.mp-marca', el); if (m) m.textContent = ''; } }
      if (act.modo === 'guia' && (act.malo[id] || (act.bien && act.bien[id]))) { delete act.malo[id]; if (act.bien) delete act.bien[id]; const el = $(`[data-it="${id}"]`); if (el) { el.classList.remove('mal', 'ok'); const m = $('.mp-marca', el); if (m) m.textContent = ''; } }
    } else if (vista === 'sim') {
      const a = E.s.act, tid = PR.SIM[a.tipo].temas[a.tab];
      a.vals[tid] = a.vals[tid] || {};
      if (valor === '' || valor == null) delete a.vals[tid][id]; else a.vals[tid][id] = valor;
      const b = $(`.pr-tabs [data-tab="${a.tab}"]`), ej = ejSim(a, tid), n = llenas(a, tid);
      if (b) { $('small', b).textContent = n + '/' + ej.items.length; b.classList.toggle('lleno', n === ej.items.length); }
    }
    guardarPronto();
  }
  cont.addEventListener('input', (ev) => {
    const el = ev.target;
    if (!el.dataset || !el.dataset.c) return;
    el.value = el.value.slice(0, 24);
    cambiarValor(el.dataset.c, el.value);
    const x = LP.leer(el.value);
    el.classList.toggle('inval', !!x.invalido);
  });
  cont.addEventListener('click', async (ev) => {
    const b = ev.target.closest('button, a[data-a]');
    if (!b || !E) return;
    if (b.dataset.op) {
      cambiarValor(b.dataset.op, b.dataset.k);
      $$(`[data-op="${b.dataset.op}"]`).forEach((x) => { x.classList.remove('ok', 'mal'); x.classList.toggle('elegida', x === b); });
      const it = b.closest('.pr-it'); if (it) { const m = $('.mp-marca', it); if (m) m.textContent = ''; }
      return;
    }
    if (b.dataset.signo) {
      const inp = $(`[data-c="${b.dataset.signo}"]`);
      const t = inp.value.trim().replace(/^[−–]/, '-');
      inp.value = t.startsWith('-') ? t.slice(1) : '-' + t;
      cambiarValor(b.dataset.signo, inp.value);
      return;
    }
    if (b.dataset.modo) {
      const s = E.t[TID];
      if (b.dataset.modo === s.act.modo) return;
      const empezado = s.act.modo === 'guia' ? Object.keys(s.act.est).length && !s.act.fin : Object.keys(s.act.vals).length && !s.act.res;
      if (empezado && !(await confirmar('¿Cambiar de modo?', '<p>Se empieza otro ejercicio con números nuevos en el otro modo.</p>', 'Cambiar'))) return;
      if (!empezado && !s.act.fin && !s.act.res) { s.modo = b.dataset.modo; s.act.modo = b.dataset.modo; s.act.vals = s.act.vals || {}; guardarE(); vTema(TID); return; }
      nuevoEj(TID, b.dataset.modo); vTema(TID); window.scrollTo(0, 0); return;
    }
    if (b.id === 'b-revisar') return revisarExam();
    if (b.id === 'b-comprobar') return comprobarPaso();
    if (b.dataset.a === 'otro') { nuevoEj(TID); vTema(TID); const c = $('.pr-modo'); if (c) c.scrollIntoView({ block: 'start' }); return; }
    if (b.dataset.a === 'aguia' || b.dataset.a === 'aexam') { nuevoEj(TID, b.dataset.a === 'aguia' ? 'guia' : 'exam'); vTema(TID); const c = $('.pr-modo'); if (c) c.scrollIntoView({ block: 'start' }); return; }
    if (b.dataset.tab != null && vista === 'sim') { guardarE(); E.s.act.tab = Number(b.dataset.tab); guardarE(); vSim(); window.scrollTo(0, 0); return; }
    if (b.id === 'b-salir') { guardarE(); ir('#/'); return; }
    if (b.id === 'b-fin' || b.id === 'b-fin2') return terminarSim();
    if (b.dataset.a === 'otrosim') { const t = E.s.ult ? E.s.ult.tipo : 'lap'; if (!E.s.act) nuevoSim(t); ir('#/s'); return; }
    if (b.dataset.a === 'inicio') { ir('#/'); }
  });

  // ---------------- rutas ----------------
  function pintar() {
    if (!alumno || !alumno.carnet) return vRegistro();
    if (!E) cargarE();
    if (E) { if (vista === 'tema' && TID) enviarParcial(TID); guardarE(); }
    const h = location.hash || '#/';
    const m = h.match(/^#\/t\/(\w+)/);
    if (m) vTema(m[1]);
    else if (h === '#/s') { if (E.s.act) vSim(); else ir('#/'); }
    else if (h === '#/r') vRes();
    else vInicio();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', pintar);

  if (alumno && alumno.carnet) { cargarE(); registrarIngreso(); }
  pintar();
  vaciar();
})();
