// ============================================================
// Electrónica Digital 2 · parcial por celular (09/11/2026), copia del 2.º parcial de Medidas — celular del estudiante
// Copia del 2.º parcial de Transformadas (transformadas/parcial2/, a su vez copia del recuperatorio de Laplace) con 7 problemas.
// Observaciones: con las notas publicadas, el estudiante escribe una por pregunta (clave «p1.0», con su etiqueta en «etq») y las envía a la sesión «<sesión>-obs».
// Entrada: QR proyectado en la TV (?t=código). Sirve para todos mientras el docente no lo cambie ni lo bloquee.
// Fases (estado_sesion.extra):
//   sin «abre» → espera · abre → en curso (también para los que llegan tarde)
//   obs[reg] → examen observado (bloqueado) · fin alcanzado o «Terminar examen» → terminado
//   reab[reg] mayor que lo visto → el docente lo reabrió · publicado → nota y solución
// Cada registro (reg) recibe del panel un código de 3 cifras distinto: cod[reg]. ver[reg] = verificado en el aula.
// Problemas: no se bloquean; «Enviar problema» envía todo; vale lo último enviado.
// ============================================================
(function () {
  const $ = II.$;
  const $$ = II.$$;
  const PRUEBA = /prueba/.test(II.params.get('s') || '');
  const SID = PRUEBA ? 'd2-ex1-prueba' : 'd2-ex1';
  const SID_OBS = SID + '-obs';
  const TOKEN = II.params.get('t') || '';
  const K_AL = 'px-alumno-' + SID;
  const K_PASE = 'px-pase-' + SID;
  const K_COLA = 'pm-cola';
  const CARRERAS = ['Ingeniería Electrónica', 'Ingeniería Mecatrónica', 'Otra carrera'];
  const DISP = (() => { let d = II.leer('rc-disp', null); if (!d) { d = Math.random().toString(36).slice(2, 10); II.guardar('rc-disp', d); } return d; })();
  const tipoDisp = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'iPhone' : /Android/.test(navigator.userAgent) ? 'Android' : 'otro';

  let alumno = II.leer(K_AL, null);
  let ex = {};
  let leida = false;
  let offset = 0;
  const ahora = () => Date.now() + offset;
  let vista = '';
  let pestana = 'p1';
  let notas = null;
  let pubVisto;

  const kEst = () => 'px-est-' + SID + '-' + alumno.reg;
  const CAR = () => (alumno && alumno.info && alumno.info.carrera) || '';
  const nuevaSal = () => ({ n: 0, seg: 0, max: 0, lista: [], abierta: null, foco: { n: 0, seg: 0 }, cambios: [], pantalla: '—', recargas: 0, disp: tipoDisp, escr: { n: 0, seg: 0, ini: null } });
  const nuevoEst = () => ({ ...Object.fromEntries(RC.PROB.map((k) => [k, { vals: {} }])), sal: nuevaSal(), enviados: {}, final: false, terminoYo: false, reabVisto: 0, ultEnvio: null });
  let est = null;
  const cargarEst = () => { est = II.leer(kEst(), null) || nuevoEst(); est.sal = est.sal || nuevaSal(); est.enviados = est.enviados || {}; };
  const guardarEst = () => II.guardar(kEst(), est);
  const codigo = () => (alumno && ex.cod && ex.cod[alumno.reg]) || null;
  const verificado = () => !!(alumno && ex.ver && ex.ver[alumno.reg]);
  const observado = () => !!(alumno && ex.obs && ex.obs[alumno.reg]);

  // ---------------- hora del servidor ----------------
  async function sincronizarHora() {
    if (!II.sb) return;
    const t0 = Date.now();
    try {
      const { data, error } = await II.sb.rpc('estado_evaluacion', { p_sesion: SID, p_carnet: (alumno && alumno.carnet) || '---' });
      if (error) throw error;
      const d = data && data[0];
      if (d && d.ahora) offset = Date.parse(d.ahora) - (t0 + Date.now()) / 2;
    } catch (e) { /* se reintenta luego */ }
  }

  // ---------------- fase ----------------
  const finGlobal = () => !!(ex.fin && ahora() >= Date.parse(ex.fin));
  function fase() {
    if (!alumno) return 'registro';
    if (!leida) return 'cargando';
    if (ex.publicado) return 'publicado';
    if (observado()) return 'observado';
    if (!ex.abre) return 'espera';
    if (finGlobal()) return 'terminado';
    if (est && est.terminoYo) {
      const r = (ex.reab && ex.reab[alumno.reg]) || 0;
      if (r > (est.reabVisto || 0)) { est.reabVisto = r; est.terminoYo = false; est.final = false; guardarEst(); enviarAvance('reabierto'); }
      else return 'terminado';
    }
    return 'curso';
  }
  const restante = () => (ex.pausa ? Number(ex.pausa.rest) / 1000 : ex.fin ? (Date.parse(ex.fin) - ahora()) / 1000 : null);
  const minDesdeInicio = () => (ex.abre ? Math.max(0, Math.round((ahora() - Date.parse(ex.abre)) / 60000)) : 0);
  const mmss = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  // ---------------- envíos (cola propia: relee la cola en cada paso) ----------------
  let vaciando = false;
  function encolar(registro) {
    if (!II.sb) return;
    const c = II.leer(K_COLA, []);
    c.push(registro);
    II.guardar(K_COLA, c.slice(-40));
    vaciar();
  }
  async function vaciar() {
    if (vaciando || !II.sb) return;
    vaciando = true;
    try {
      for (;;) {
        const c = II.leer(K_COLA, []);
        if (!c.length) break;
        const { error } = await II.sb.from('respuestas').insert(c[0]);
        if (error) {
          const rechazo = error.code === '42501' || /row-level security/i.test(error.message || '');
          if (!rechazo) { II.marcarConexion(false); break; }
          const r = II.leer('px-cola-rechazadas', []); r.push(c[0]); II.guardar('px-cola-rechazadas', r.slice(-20));
        }
        II.marcarConexion(true);
        const resto = II.leer(K_COLA, []);
        resto.shift();
        II.guardar(K_COLA, resto);
        if (!error && c[0].actividad === 'avance' && est) { est.ultEnvio = ahora(); guardarEst(); }
      }
    } catch (e) {
      II.marcarConexion(false);
    } finally {
      vaciando = false;
    }
  }
  setInterval(vaciar, 4000);

  function resumenSal() {
    const s = est.sal;
    return { n: s.n, seg: s.seg, max: s.max, lista: s.lista.slice(-30), abierta: s.abierta, foco: s.foco, cambios: s.cambios.slice(-30), pantalla: s.pantalla, recargas: s.recargas, disp: s.disp, escr: s.escr };
  }
  function enviarAvance(motivo) {
    if (!alumno || !est) return;
    const copia = Object.fromEntries(RC.PROB.map((k) => [k, { vals: est[k].vals }]));
    encolar({
      sesion: SID, actividad: 'avance', carnet: alumno.carnet, nombre: alumno.nombre,
      respuesta: { est: copia, sal: resumenSal(), motivo, disp: DISP, reg: alumno.reg, cod: codigo(), car: alumno.info.carrera, final: !!est.final, termino: !!est.terminoYo },
      correcta: null, intento: 1, puntaje: 0
    });
  }
  let tAvance = null;
  let cambiosSinEnviar = false;
  function programarAvance(ms = 20000) {
    cambiosSinEnviar = true;
    clearTimeout(tAvance);
    tAvance = setTimeout(() => { if (cambiosSinEnviar && fase() === 'curso') { cambiosSinEnviar = false; enviarAvance('auto'); } }, ms);
  }

  // ---------------- piezas ----------------
  const tarjeta = (h, cls = '') => `<div class="tarjeta ${cls}">${h}</div>`;
  const neg = (s) => String(s).replace(/^-/, '−');

  function barra() {
    $('#e-nombre').textContent = alumno ? alumno.nombre + (PRUEBA ? '; ENSAYO' : '') : 'Examen de Electrónica Digital 2' + (PRUEBA ? '; ensayo' : '');
    const r = $('#e-reloj');
    const s = restante();
    const f = fase();
    if (f === 'curso' && s != null) {
      r.textContent = (ex.pausa ? '⏸ ' : '⏱ ') + mmss(s);
      r.classList.remove('oculto');
      r.classList.toggle('urgente', !ex.pausa && s <= 120);
    } else r.classList.add('oculto');
  }

  // franja con el nombre completo y el código (el docente la lee al recorrer el aula)
  function franja() {
    const c = codigo();
    return `<div class="rc-id"><div class="rc-id-nom"><b>${II.esc(alumno.nombre)}</b><small>C.U. ${II.esc(alumno.carnet)}</small></div>
      <div class="rc-id-cod">${c ? `<small>Código</small><b>${c}</b>` : '<small>Código</small><b class="espera">…</b>'}</div>
      ${verificado() ? '<div class="rc-id-ver">✓ Verificado por el docente</div>' : ''}</div>`;
  }

  // ---------------- entrada con el QR ----------------
  function vEntrada() {
    const pase = II.leer(K_PASE, null);
    if (pase && Date.now() - pase.en < 20 * 60000) return vRegistro();
    if (!leida) { if (vista !== 'cargando') { vista = 'cargando'; CONT(tarjeta('<p>Verificando el código…</p>')); } return; }
    const k = 'entrada' + (ex.qr ? 1 : 0) + (TOKEN && TOKEN === ex.token ? 1 : 0);
    if (!TOKEN) { if (vista === k) return; vista = k; CONT(tarjeta('<span class="etq">Electrónica Digital 2; examen</span><h2>Escanea el QR de la pantalla</h2><p>Para entrar al examen, escanea el código que muestra el docente.</p>')); return; }
    if (!ex.qr) { if (vista === k) return; vista = k; CONT(tarjeta('<span class="etq">Electrónica Digital 2; examen</span><h2>El ingreso está cerrado</h2><p>El docente bloqueó el QR. Si estás en el aula, pídele que lo habilite y vuelve a escanear.</p>')); return; }
    if (TOKEN !== ex.token) { if (vista === k) return; vista = k; CONT(tarjeta('<span class="etq">Electrónica Digital 2; examen</span><h2>Este QR ya no sirve</h2><p>El docente cambió el código. Escanea el QR que te muestre ahora.</p>')); return; }
    II.guardar(K_PASE, { t: TOKEN, en: Date.now() });
    vRegistro();
  }

  function vRegistro() {
    if (vista === 'registro') return;
    vista = 'registro';
    CONT(tarjeta(`<span class="etq">Electrónica Digital 2; examen</span>
      <h2>Escribe tus datos</h2>
      <form id="f-ingreso">
        <label class="campo"><span>Apellidos</span><input name="apellidos" required minlength="2" maxlength="38" autocomplete="family-name"></label>
        <label class="campo"><span>Nombres</span><input name="nombres" required minlength="2" maxlength="38" autocomplete="given-name"></label>
        <label class="campo"><span>Número de carnet de identidad (C.I.)</span><input name="ci" required minlength="4" maxlength="15" autocomplete="off"></label>
        <label class="campo"><span>Carnet universitario (C.U.)</span><input name="cu" required minlength="3" maxlength="20" inputmode="numeric" autocomplete="off"></label>
        <label class="campo"><span>Carrera</span><select name="carrera" required><option value="" disabled selected>Elige tu carrera</option>${CARRERAS.map((c) => `<option>${c}</option>`).join('')}</select></label>
        <div class="aviso mal oculto" id="f-error"></div>
        <button class="boton prim bloque">Entrar al examen</button>
      </form>`));
    $('#f-ingreso').onsubmit = async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const limpio = (k) => String(fd.get(k) || '').trim().replace(/\s+/g, ' ');
      const reg = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      const info = { apellidos: limpio('apellidos').toUpperCase(), nombres: limpio('nombres'), ci: limpio('ci'), carrera: String(fd.get('carrera') || ''), disp: DISP, tipo: tipoDisp, reg };
      const cu = limpio('cu').replace(/\s+/g, '');
      if (!CARRERAS.includes(info.carrera)) { const e = $('#f-error'); e.textContent = 'Elige tu carrera.'; e.classList.remove('oculto'); return; }
      ev.target.querySelector('button').disabled = true;
      alumno = { nombre: info.apellidos + ', ' + info.nombres, carnet: cu, reg, info };
      try { await II.sb.from('ingresos').insert({ sesion: SID, carnet: cu, nombre: alumno.nombre, info }); } catch (e) { /* la respuesta «ingreso» lo vuelve a registrar */ }
      encolar({ sesion: SID, actividad: 'ingreso', carnet: cu, nombre: alumno.nombre, respuesta: info, correcta: true, intento: 1, puntaje: 0 });
      II.guardar(K_AL, alumno);
      II.guardar(K_PASE, null);
      cargarEst();
      vista = '';
      pintar();
    };
  }

  // ---------------- espera ----------------
  function vEspera() {
    const k = 'espera' + (codigo() || '') + verificado();
    if (vista === k) return;
    vista = k;
    CONT(franja() + tarjeta(`<span class="etq">Examen de Electrónica Digital 2</span>
      <h2>Espera a que el docente inicie el examen</h2>
      <ul class="ex-reglas">
        <li>4 problemas (100 puntos) sobre un mismo contador síncrono no secuencial con flip-flops JK, con datos propios: P1 tabla de transición (20); P2 tabla de J y K (25); P3 mapas de Karnaugh (30); P4 circuito y simulación (25). <b>Tú armas todo</b>: lo que respondes en un paso se copia solo al siguiente y se califica con tus propios números. Puedes usar papel y lápiz como hoja auxiliar (cuentas); no se entrega.</li>
        <li>Las tablas se llenan tocando cada casilla (? → 1 → 0 → X). Las opciones se eligen con un toque.</li>
                <li>Toca <b>Enviar problema</b> cada vez que avances. Puedes corregir hasta el final; vale lo último enviado.</li>
        <li>Cuando acabes, toca <b>Terminar examen</b>.</li>
        <li><b>No salgas de esta página ni bloquees el celular:</b> cada salida queda registrada para el docente. Activa «No molestar».</li>
      </ul>
      <p class="mp-nota">Esta pantalla cambia sola cuando empiece el examen.</p>`));
  }

  // ---------------- examen ----------------
  function vExamen() {
    const k = 'curso-' + pestana + '-' + (codigo() || '') + verificado();
    if (vista === k) { pintarGuardado(); return; }
    vista = k;
    document.body.classList.add('examen');
    marcaDeAgua();
    const tabs = RC.PROB.map((p) => `<button class="ex-tab ${p === pestana ? 'activa' : ''}" data-tab="${p}"><b>${RC.TITULO[p]}</b><small>${RC.MAX[p]} pts; <span data-prog="${p}">${progreso(p)}</span></small></button>`).join('');
    CONT(`${franja()}<div class="ex-tabs rc-tabs">${tabs}</div><div id="ex-met">${problemaHTML(pestana)}</div>
      <div class="tarjeta rc-fin"><button class="boton bloque rc-terminar" id="b-terminar">Terminar examen</button>
      <p class="mp-nota">Tus respuestas se guardan en tu celular y llegan al docente cuando tocas «Enviar problema» (y solas cada cierto tiempo). Vale lo último enviado.</p></div>`);
    enlazar();
    pintarGuardado();
  }

  function progreso(p) {
    const n = Object.keys(est[p].vals).filter((id) => est[p].vals[id] !== '' && est[p].vals[id] != null).length;
    return `${n}/${RC.casillas(p)}`;
  }

  function problemaHTML(p) {
    const d = RC.datos(p, alumno.carnet, CAR(), est);
    const P = RC.P[p];
    let h = tarjeta(`<span class="etq">${RC.TITULO[p]}; ${P.titulo}; ${RC.MAX[p]} puntos</span><div class="ex-func">${P.enunciado(d)}</div>`);
    P.pasos(d).forEach((ps) => {
      const cuerpo = ps.mapas ? mapasHTML() : ps.circuito ? '<div id="zona-circ"></div>' : ps.simulacion ? '<div id="zona-sim"></div>' + `<div class="mp-celdas rc-celdas">${ps.items.map((it) => itemHTML(p, d, it)).join('')}</div>` : ps.multi ? tablaMulti(p, ps) : ps.tabla || ps.mapa ? tablaY(p, ps) : `<div class="mp-celdas rc-celdas">${ps.items.map((it) => itemHTML(p, d, it)).join('')}</div>`;
      h += tarjeta(`<h3 class="rc-paso">${II.esc(ps.t)}</h3>${ps.html ? `<div class="pd-enun">${ps.html}</div>` : ''}${ps.nota ? `<p class="mp-nota">${ps.nota}</p>` : ''}
        ${ps.tex ? `<div class="ex-func rc-plantilla">\\[${ps.tex}\\]</div>` : ''}
        ${cuerpo}`, 'rc-tpaso');
    });
    h += `<div class="mp-pie rc-pie"><button class="boton prim bloque" data-enviar="${p}">Enviar ${RC.TITULO[p]}</button><span class="mp-int" data-estado="${p}"></span></div>`;
    return h;
  }

  // tabla de verdad completa o mapa de Karnaugh (Digital 2): se toca cada casilla: ? → 1 → 0 (→ X)
  function botonY(p, it, x) {
    const v = est[p].vals[it.id];
    return `<button type="button" class="pd-y ${v ? 'v' + v : ''}" data-y="${p}|${it.id}" data-x="${x ? 1 : 0}">${v || '?'}</button>`;
  }
  // tabla de varias columnas por fila (Digital 2: J y K de cada estado); las filas sin usar vienen en X y no se tocan
  function tablaMulti(p, ps) {
    const filas = [];
    ps.items.forEach((it) => { (filas[it.fila] = filas[it.fila] || []).push(it); });
    const cuerpo = filas.map((its) => {
      const f = its[0];
      return `<tr class="${f.fijo ? 'pd-fijo' : ''}"><td class="mono pd-est"><span class="pd-e1">${f.bits}</span>${f.sig ? '<span class="pd-e2">→ ' + f.sig + '</span>' : ''}</td>` +
        its.map((it) => `<td>${it.fijo ? '<span class="pd-fx">X</span>' : botonY(p, it, true)}</td>`).join('') + '</tr>';
    }).join('');
    return `<div class="pd-tabla"><table class="tt tight pd-tt pd-multi"><tr>${ps.multi.cols.map((c) => `<th>${c}</th>`).join('')}</tr>${cuerpo}</table></div><p class="mp-nota">Toca cada casilla para cambiarla: ? → 1 → 0 → X.</p>`;
  }
  function tablaY(p, ps) {
    const ceros = `<button type="button" class="boton pd-ceros" data-ceros="${p}|${ps.items.map((it) => it.id).join(',')}">Poner 0 en las casillas vacías</button>`;
    if (ps.mapa) {
      const G = [0, 1, 3, 2], b2 = (n) => n.toString(2).padStart(2, '0');
      return `<div class="pd-tabla"><table class="pd-km"><tr><th class="pd-kh">AB \\ CD</th>${G.map((c) => `<th>${b2(c)}</th>`).join('')}</tr>` +
        G.map((f) => `<tr><th>${b2(f)}</th>${G.map((c) => `<td>${botonY(p, ps.items[(f << 2) | c], false)}</td>`).join('')}</tr>`).join('') +
        `</table></div><p class="mp-nota">Toca cada casilla para cambiarla: ? → 1 → 0.</p>${ceros}`;
    }
    const T = ps.tabla;
    return `<div class="pd-tabla"><table class="tt tight pd-tt"><tr>${T.cols.map((c) => `<th>${II.esc(c)}</th>`).join('')}<th>Y</th></tr>` +
      ps.items.map((it) => `<tr>${it.bits.split('').map((x) => `<td>${x}</td>`).join('')}<td>${botonY(p, it, T.x)}</td></tr>`).join('') +
      `</table></div><p class="mp-nota">Toca cada casilla de Y para cambiarla: ? → 1 → 0${T.x ? ' → X' : ''}.</p>${ceros}`;
  }

  // ---------------- mapas de Karnaugh, circuito y simulación (P3 y P4) ----------------
  let mapaAct = 0, entAct = 0, simE = null, simH = [];
  const entVista = (e) => e || { c: null, p: [[]] };
  const entsP4 = () => CT.entradas(3).map((x, i) => RC.decEnt(est.p4.vals['c' + i]));
  function mapasHTML() {
    const v = est.p3.vals;
    const tabs = CT.entradas(3).map((x, i) => `<button type="button" class="ct-tab-b${i === mapaAct ? ' sel' : ''}${v['m' + i] != null ? ' ok' : ''}" data-mt="${i}">${x.nom}</button>`).join('');
    return `<div class="ct-tabs">${tabs}</div><div id="zona-mapa" class="pd-zona-mapa"></div><p class="mp-nota">Primero «1. Llenar» con la columna de tu tabla de J y K; luego «2. Agrupar». Cada mapa se guarda solo.</p>`;
  }
  function montarMapa() {
    const z = $('#zona-mapa');
    if (!z) return;
    z.innerHTML = '';
    const i = mapaAct, x = CT.entradas(3)[i], v = est.p3.vals;
    const ed = window.D2.k.editor(z, { nv: 3, nombres: CT.nombres(3), conX: true, vals: RC.decMapa(v['m' + i]) || undefined, fijo: false, salida: x.nom });
    if (v['g' + i]) ed.fijar({ grupos: RC.decG(v['g' + i]) });
    ed.alCambiar((st) => {
      v['m' + i] = RC.encMapa(st.vals); v['g' + i] = RC.encG(st.grupos);
      const t = $(`[data-mt="${i}"]`); if (t) t.classList.add('ok');
      anotarCambio('p3'); guardarEst(); pintarGuardado(); programarAvance();
      const pr = $('[data-prog="p3"]'); if (pr) pr.textContent = progreso('p3');
    });
  }
  function pintarCirc() {
    const z = $('#zona-circ');
    if (!z) return;
    const v = est.p4.vals, en = CT.entradas(3), nom = CT.nombres(3), a = entAct;
    const ents = entsP4().map(entVista), x = ents[a];
    let h = `<div class="ct-esq-w">${CT.svgContador(3, ents, { activo: a })}</div><div class="ct-tabs">` +
      en.map((y, i) => `<button type="button" class="ct-tab-b${i === a ? ' sel' : ''}${v['c' + i] ? ' ok' : ''}" data-et="${i}">${y.nom}</button>`).join('') + '</div>' +
      `<div class="tarjeta"><p class="ct-tit">Arma la entrada ${en[a].nom}</p>`;
    if (x.c === 0 || x.c === 1) h += `<p>${en[a].nom} está conectada a <b>${x.c}</b>.</p><button type="button" class="boton" data-cx="quitar">Quitar la conexión</button>`;
    else {
      h += x.p.map((g, k) => `<div class="ct-and"><span class="ct-and-n">${x.p.length > 1 || g.length > 1 ? 'AND ' + (k + 1) : 'Término'}</span><div class="ct-chips">` +
        nom.map((q, i) => [0, 1].map((ng) => { const c = 2 * i + ng; return `<button type="button" class="ct-chip${g.includes(c) ? ' on' : ''}" data-cx="chip" data-k="${k}" data-l="${c}">${ng ? '<span class="ov">' + q + '</span>' : q}</button>`; }).join('')).join('') +
        `</div><button type="button" class="ct-x" data-cx="xg" data-k="${k}" aria-label="Quitar compuerta">✕</button></div>`).join('<div style="height:6px"></div>');
      h += '<div class="fila-bt" style="margin-top:8px"><button type="button" class="boton" data-cx="mas">+ Compuerta AND</button><button type="button" class="boton" data-cx="c1">Conectar a 1</button><button type="button" class="boton" data-cx="c0">Conectar a 0</button></div>';
    }
    h += `<p class="lbl" style="margin-top:8px">Tu entrada: <b>${en[a].nom} = ${CT.htmlEnt(3, x)}</b></p></div>`;
    z.innerHTML = h;
    if (window.renderMathInElement) { /* sin LaTeX en esta zona */ }
  }
  function guardarEnt(ent) {
    est.p4.vals['c' + entAct] = RC.encEnt(ent);
    anotarCambio('p4'); guardarEst(); pintarGuardado(); programarAvance();
    const pr = $('[data-prog="p4"]'); if (pr) pr.textContent = progreso('p4');
    pintarCirc(); pintarSim();
  }
  function accionCirc(b) {
    const x = b.dataset.cx;
    let ent = RC.decEnt(est.p4.vals['c' + entAct]) || { c: null, p: [[]] };
    if (x === 'chip') {
      if (ent.c === 0 || ent.c === 1) return;
      const g = ent.p[+b.dataset.k], c = +b.dataset.l, i = g.indexOf(c);
      if (i >= 0) g.splice(i, 1); else { const j = g.findIndex((y) => y >> 1 === c >> 1); if (j >= 0) g.splice(j, 1); g.push(c); g.sort((p, q) => p - q); }
    } else if (x === 'xg') { ent.p.splice(+b.dataset.k, 1); if (!ent.p.length) ent.p = [[]]; }
    else if (x === 'mas') ent.p.push([]);
    else if (x === 'c1' || x === 'c0') ent = { c: x === 'c1' ? 1 : 0, p: [] };
    else if (x === 'quitar') ent = { c: null, p: [[]] };
    guardarEnt(ent);
  }
  function pintarSim() {
    const z = $('#zona-sim');
    if (!z) return;
    const d = RC.datos('p4', alumno.carnet, CAR(), est), seq = d.seq;
    const ents = entsP4().map((e) => e || { c: 0, p: [] });
    if (simE == null) { simE = seq[0]; simH = [simE]; }
    const nx = CT.siguiente(3, ents, simE), b3 = (n) => n.toString(2).padStart(3, '0');
    let tab = '<table class="ct-tab pd-simtab"><tr><th>FF</th><th>Q</th><th>J</th><th>K</th><th>Q<sup>+</sup></th></tr>';
    for (let j = 0; j < 3; j++) {
      const bb = 2 - j, q = (simE >> bb) & 1, J = CT.evalEnt(3, ents[2 * j], simE), Kk = CT.evalEnt(3, ents[2 * j + 1], simE);
      tab += `<tr><td>FF${CT.sub(bb)}</td><td>${q}</td><td>${J}</td><td>${Kk}</td><td><b>${(nx >> bb) & 1}</b></td></tr>`;
    }
    tab += '</table>';
    z.innerHTML = `<div class="tarjeta idea"><p class="ct-tit">Simula tu circuito</p>
      <p class="lbl">Secuencia que te tocó: <b>${seq.join(' → ')} → ${seq[0]}</b>. Toca un estado para encender ahí y da pulsos de reloj.</p>
      <div class="ct-estados">${Array.from({ length: 8 }, (_, s) => `<button type="button" class="ct-estado${s === simE ? ' on' : ''}" data-ss="${s}"><b>${s}</b><small>${b3(s)}</small></button>`).join('')}</div>
      <p class="ct-tit" style="margin-top:8px">Estado actual: ${simE} (${b3(simE)}); con el próximo pulso pasa a ${nx} (${b3(nx)})</p>${tab}
      <div class="fila-bt"><button type="button" class="boton prim" data-sa="pulso">Dar un pulso de reloj</button><button type="button" class="boton" data-sa="ini">Volver al ${seq[0]}</button></div>
      <p class="lbl" style="margin-top:6px">Recorrido: ${simH.map((s) => '<b>' + s + '</b>').join(' → ')}</p></div>`;
  }
  function montarEspeciales() {
    $$('[data-mt]').forEach((b) => { b.onclick = () => { mapaAct = +b.dataset.mt; $$('[data-mt]').forEach((x) => x.classList.toggle('sel', x === b)); montarMapa(); }; });
    if (pestana === 'p3') montarMapa();
    if (pestana === 'p4') {
      pintarCirc(); pintarSim();
      const zc = $('#zona-circ'), zs = $('#zona-sim');
      zc.onclick = (e) => {
        const t = e.target.closest('[data-et]');
        if (t) { entAct = +t.dataset.et; pintarCirc(); return; }
        const b = e.target.closest('[data-cx]');
        if (b) accionCirc(b);
      };
      zs.onclick = (e) => {
        const t = e.target.closest('[data-ss]'), a = e.target.closest('[data-sa]');
        const d = RC.datos('p4', alumno.carnet, CAR(), est);
        if (t) { simE = +t.dataset.ss; simH = [simE]; }
        else if (a && a.dataset.sa === 'pulso') { simE = CT.siguiente(3, entsP4().map((x) => x || { c: 0, p: [] }), simE); simH.push(simE); if (simH.length > 14) simH.shift(); }
        else if (a) { simE = d.seq[0]; simH = [simE]; }
        else return;
        pintarSim();
      };
    }
  }

  function itemHTML(p, d, it) {
    const v = est[p].vals[it.id];
    if (it.tipo === 'op') {
      const ops = d.op[it.id].map((o, i) => `<button type="button" class="mp-op rc-op ${String(v) === String(i) ? 'elegida' : ''}" data-op="${p}|${it.id}" data-k="${i}">${RC.opTxt(o)}</button>`).join('');
      return `<div class="rc-ops${it.fila ? ' rc-ops-fila' : ''}"><span class="et">${RC.etTxt(it)}</span>${ops}</div>`;
    }
    const id = p + '|' + it.id;
    return `<label class="mp-celda"><span class="et">${RC.etTxt(it)}</span><span class="mp-num"><button type="button" class="mp-signo" data-signo="${id}" aria-label="Cambiar signo">±</button><input data-c="${id}" inputmode="decimal" autocomplete="off" value="${II.esc(v == null ? '' : v)}"></span></label>`;
  }

  const firmaProb = (p) => JSON.stringify(est[p].vals);
  function pintarGuardado() {
    $$('[data-estado]').forEach((el) => {
      const p = el.dataset.estado;
      const g = est.enviados[p];
      const vacio = !Object.keys(est[p].vals).length;
      if (g && g.f === firmaProb(p)) { el.textContent = 'Enviado ✓ ' + new Date(g.t).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }); el.className = 'mp-int ok'; }
      else if (vacio) { el.textContent = ''; el.className = 'mp-int'; }
      else { el.textContent = 'Cambios sin enviar'; el.className = 'mp-int mal'; }
    });
    RC.PROB.forEach((p) => { const x = $(`[data-prog="${p}"]`); if (x) x.textContent = progreso(p); });
  }

  function enlazar() {
    $$('[data-tab]').forEach((b) => { b.onclick = () => { pestana = b.dataset.tab; vista = ''; vExamen(); window.scrollTo(0, 0); }; });
    const cambiar = (inp) => {
      const [p, id] = inp.dataset.c.split('|');
      est[p].vals[id] = inp.value;
      if (inp.value === '') delete est[p].vals[id];
      anotarCambio(p);
      guardarEst();
      pintarGuardado();
      programarAvance();
    };
    $$('[data-c]').forEach((inp) => inp.addEventListener('input', () => cambiar(inp)));
    $$('[data-signo]').forEach((b) => {
      b.onclick = () => {
        const inp = $(`[data-c="${b.dataset.signo}"]`);
        const t = inp.value.trim().replace(/^[−–]/, '-');
        inp.value = t.startsWith('-') ? t.slice(1) : '-' + t;
        cambiar(inp);
      };
    });
    $$('[data-barra]').forEach((b) => {
      b.onclick = () => {
        const inp = $(`[data-c="${b.dataset.barra}"]`);
        if (!inp.value.includes('/')) inp.value = inp.value + '/';
        cambiar(inp);
        inp.focus();
      };
    });
    $$('[data-y]').forEach((b) => {
      b.onclick = () => {
        const [p, id] = b.dataset.y.split('|');
        const ciclo = b.dataset.x === '1' ? ['1', '0', 'X'] : ['1', '0'];
        const n = ciclo[(ciclo.indexOf(est[p].vals[id]) + 1) % ciclo.length];
        est[p].vals[id] = n;
        b.textContent = n;
        b.className = 'pd-y v' + n;
        anotarCambio(p);
        guardarEst();
        pintarGuardado();
        programarAvance();
      };
    });
    $$('[data-ceros]').forEach((b) => {
      b.onclick = () => {
        const [p, ids] = b.dataset.ceros.split('|');
        ids.split(',').forEach((id) => {
          if (est[p].vals[id]) return;
          est[p].vals[id] = '0';
          const y = document.querySelector(`[data-y="${p}|${id}"]`);
          if (y) { y.textContent = '0'; y.className = 'pd-y v0'; }
        });
        anotarCambio(p);
        guardarEst();
        pintarGuardado();
        programarAvance();
      };
    });
    $$('[data-op]').forEach((b) => {
      b.onclick = () => {
        const [p, id] = b.dataset.op.split('|');
        est[p].vals[id] = b.dataset.k;
        $$(`[data-op="${p}|${id}"]`).forEach((x) => x.classList.toggle('elegida', x === b));
        anotarCambio(p);
        guardarEst();
        pintarGuardado();
        programarAvance();
      };
    });
    $$('[data-enviar]').forEach((b) => {
      b.onclick = () => {
        const p = b.dataset.enviar;
        est.enviados[p] = { f: firmaProb(p), t: ahora() };
        guardarEst();
        cambiosSinEnviar = false;
        enviarAvance('envió ' + p);
        pintarGuardado();
      };
    });
    const bt = $('#b-terminar');
    if (bt) bt.onclick = terminarYo;
    montarEspeciales();
  }

  async function terminarYo() {
    const sin = RC.PROB.filter((p) => Object.keys(est[p].vals).length && !(est.enviados[p] && est.enviados[p].f === firmaProb(p))).map((p) => RC.TITULO[p]);
    const vacios = RC.PROB.filter((p) => !Object.keys(est[p].vals).length).map((p) => RC.TITULO[p]);
    const extra = (sin.length ? `<br>Tienes cambios sin enviar en ${sin.join(', ')}: se enviarán al terminar.` : '') + (vacios.length ? `<br>Sin responder: ${vacios.join(', ')}.` : '');
    const ok = await confirmar('¿Terminar el examen?', `Ya no podrás cambiar tus respuestas.${extra}`, 'Cancelar y seguir trabajando', 'Sí, terminar');
    if (!ok) return;
    RC.PROB.forEach((p) => { est.enviados[p] = { f: firmaProb(p), t: ahora() }; });
    est.final = true;
    est.terminoYo = true;
    guardarEst();
    enviarAvance('terminó');
    vista = '';
    pintar();
  }

  function confirmar(titulo, texto, no = 'Cancelar', si = 'Sí') {
    return new Promise((res) => {
      const capa = II.html(`<div class="capa"><div class="dialogo"><h2>${titulo}</h2><p>${texto}</p>
        <div class="fila-bt rc-fila-bt"><button class="boton" data-r="0">${no}</button><button class="boton prim" data-r="1">${si}</button></div></div></div>`);
      document.body.appendChild(capa);
      capa.onclick = (e) => {
        const b = e.target.closest('[data-r]');
        if (!b && e.target !== capa) return;
        capa.remove();
        res(!!(b && b.dataset.r === '1'));
      };
    });
  }

  function marcaDeAgua() {
    const t = (alumno.nombre + '; C.U. ' + alumno.carnet).replace(/[<&>"]/g, '');
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='180'><text x='10' y='100' transform='rotate(-20 180 90)' font-family='sans-serif' font-size='15' fill='rgba(29,95,180,0.07)'>${t}</text></svg>`;
    document.body.style.backgroundImage = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  }
  function sinMarca() { document.body.classList.remove('examen'); document.body.style.backgroundImage = ''; }

  // ---------------- observado ----------------
  function vObservado() {
    if (!est.obsVisto) { est.obsVisto = true; est.final = true; guardarEst(); }
    if (vista === 'observado') return;
    vista = 'observado';
    sinMarca();
    soltarPantalla();
    CONT(franja() + tarjeta(`<span class="etq">Examen observado</span><h2>El docente observó tu examen</h2>
      <div class="aviso mal">Ya no puedes continuar.</div><p>Lo que enviaste hasta ahora quedó guardado. Habla con el docente.</p>`));
  }

  // ---------------- terminado ----------------
  function vTerminado() {
    if (!est.final) {
      est.final = true;
      guardarEst();
      enviarAvance('final');
    }
    const pend = II.leer(K_COLA, []).length;
    const clave = 'terminado' + (pend ? 'p' : '') + verificado();
    if (vista === clave) return;
    vista = clave;
    sinMarca();
    soltarPantalla();
    CONT(franja() + tarjeta(`<span class="etq">Examen terminado</span><h2>Listo, ${II.esc(alumno.info.nombres.split(' ')[0])}</h2>
      ${pend ? '<div class="aviso duda">Enviando tus últimas respuestas… no cierres esta página hasta que desaparezca este aviso.</div>' : '<div class="aviso ok">Tus respuestas llegaron al docente.</div>'}
      <p>El docente publicará las notas. Cuando lo haga, aquí verás tu nota, el detalle de cada casilla y la solución.</p>`));
  }

  // ---------------- nota publicada ----------------
  async function vPublicado() {
    if (!notas) {
      if (vista !== 'pub-cargando') { vista = 'pub-cargando'; CONT(tarjeta('<p>Cargando tu nota…</p>')); }
      try {
        const { data } = await II.sb.from('estado_sesion').select('extra').eq('sesion', SID + '-notas').maybeSingle();
        notas = (data && data.extra && data.extra.notas) || {};
      } catch (e) { return; }
    }
    if (vista === 'publicado') return;
    vista = 'publicado';
    sinMarca();
    soltarPantalla();
    const mia = notas[alumno.reg];
    if (!mia) { CONT(tarjeta('<h2>Notas publicadas</h2><p>No se encontró una nota para este registro. Habla con el docente.</p>')); return; }
    if (mia.obs) { CONT(tarjeta('<span class="etq">Parcial; nota publicada</span><h2>Examen observado</h2><p>Habla con el docente.</p>')); return; }
    const local = RC.nota(alumno.carnet, est, CAR());
    const igual = mia.h === RC.firma(est);
    let h = tarjeta(`<span class="etq">Parcial; nota publicada</span>
      <div class="mp-res"><div class="grande">${II.fmt(mia.n, 2)}<small> / 100</small></div></div>
      <div class="mp-tabla-scroll"><table class="mp-tabla rc-resumen"><tr><th>Problema</th><th>Puntos</th></tr>${RC.PROB.map((p) => `<tr><td>${RC.TITULO[p]}; ${RC.NOMBRE[p]}</td><td>${II.fmt(mia.p ? mia.p[p] : local.res[p].pts, 2)} / ${RC.MAX[p]}</td></tr>`).join('')}</table></div>
      ${igual ? '' : '<div class="aviso duda">Tu nota se calculó con lo último que llegó al docente. El detalle de abajo es lo que quedó en tu celular y puede no coincidir.</div>'}
      <p class="mp-nota">✓ completo; ✗ o vacía, 0. Si crees que algo está mal calificado, escribe una <b>observación</b> debajo de esa pregunta y envíalas todas juntas al final.</p>`);
    RC.PROB.forEach((p) => { h += detalleProblema(p, local.res[p]); });
    h += tarjeta(`<span class="etq">Observaciones</span><p>Revisa tu detalle. Si tienes observaciones, escríbelas arriba, debajo de cada pregunta, y envíalas juntas. Puedes volver a enviarlas: vale lo último. El docente las revisará y volverá a publicar las notas si corresponde.</p>
      <button class="boton prim bloque" id="b-obs">Enviar mis observaciones</button><div id="obs-estado" class="mp-nota">${est.obsEnv ? 'Enviadas ✓ ' + new Date(est.obsEnv).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : ''}</div>`);
    CONT(h);
    $$('[data-obs-p]').forEach((ta) => ta.addEventListener('input', () => { est.obs = est.obs || {}; est.obs[ta.dataset.obsP] = ta.value; guardarEst(); }));
    $('#b-obs').onclick = enviarObs;
  }

  // Preguntas de un problema (una observación por pregunta): cada paso es una pregunta; un paso con varias
  // casillas «a)», «b)», «c)» se parte en una pregunta por casilla. Clave = «p1.0», «p1.1», …
  function preguntas(p, d) {
    const g = [];
    RC.P[p].pasos(d).forEach((ps) => {
      const its = ps.items.filter((it) => !it.fijo);
      const partir = its.length > 1 && its.every((it) => it.tipo !== 'bit' && /^[a-z]\)/.test(it.h || ''));
      if (partir) its.forEach((it) => g.push({ t: it.h, items: [it] }));
      else g.push({ t: ps.t, items: its, html: ps.html || '', tex: ps.tex || '' });
    });
    return g.map((x, i) => ({ ...x, clave: p + '.' + i, etq: RC.TITULO[p] + ' ' + x.t }));
  }
  const gruposObs = () => RC.PROB.reduce((a, p) => a.concat(preguntas(p, RC.datos(p, alumno.carnet, CAR(), est))), []);

  function detalleProblema(p, res) {
    const d = RC.datos(p, alumno.carnet, CAR(), est);
    const P = RC.P[p];
    const vals = est[p].vals;
    const fila = (it) => {
      const c = res.cel[it.id];
      const tuya = it.mostrar ? it.mostrar(vals) : it.tipo === 'op' ? (vals[it.id] == null ? '—' : RC.opTxt(d.op[it.id][Number(vals[it.id])])) : vals[it.id] ? II.esc(neg(vals[it.id])) : '—';
      const espT = it.tipo === 'op' ? RC.opTxt(d.op[it.id][c.exp]) : it.mostrar ? it.txt : it.txt != null ? '<span class="mono">' + it.txt + '</span>' : `\\(${RC.tex(c.exp)}\\)`;
      return `<tr class="${c.r === 'ok' ? 'ok' : 'mal'}"><td>${RC.etTxt(it)}${c.anulada ? ' <small>(anulada)</small>' : ''}</td><td class="mono">${tuya}</td><td>${c.r === 'ok' ? '✓' : '✗ ' + espT}</td><td>${II.fmt(c.pts, 2)}/${II.fmt(c.max, 2)}</td></tr>`;
    };
    // explicación de una pregunta anulada, solo para quien la tuvo mal o vacía
    const explica = (q) => q.items.filter((it) => it.anulada && it.explica && res.cel[it.id].r !== 'ok').map((it) => `<div class="aviso duda rc-explica">${it.explica}</div>`).join('');
    const bloques = preguntas(p, d).map((q) => {
      const ptsQ = q.items.reduce((s, it) => s + res.cel[it.id].pts, 0), maxQ = q.items.reduce((s, it) => s + it.pts, 0);
      const t = (est.obs && est.obs[q.clave]) || '';
      return `<div class="rc-preg"><p class="rc-preg-t"><b>${II.esc(q.t)}</b><span>${II.fmt(Math.round(ptsQ * 100) / 100, 2)} / ${II.fmt(maxQ, 2)}</span></p>
        ${q.html ? `<div class="pd-enun">${q.html}</div>` : ''}${q.tex ? `<div class="ex-func rc-plantilla">\\[${q.tex}\\]</div>` : ''}
        <div class="mp-tabla-scroll"><table class="mp-tabla ex-det">${q.items.map(fila).join('')}</table></div>${explica(q)}
        <label class="campo rc-obs-caja"><span>Observación sobre esta pregunta (opcional)</span><textarea data-obs-p="${q.clave}" rows="2" maxlength="800" placeholder="Escribe qué crees que está mal calificado y por qué">${II.esc(t)}</textarea></label></div>`;
    }).join('');
    return tarjeta(`<span class="etq">${RC.TITULO[p]}; ${P.titulo}; ${II.fmt(res.pts, 2)} / ${RC.MAX[p]}</span>
      <div class="ex-func">${P.enunciado(d)}</div>
      <p class="mp-nota">Tus respuestas, pregunta por pregunta. Si una casilla está mal, al lado va el valor correcto.</p>
      ${bloques}
      <p class="mp-nota">Solución:</p><div class="ex-func">${[].concat(P.final(d)).map((l) => (l.charAt(0) === '<' ? l : '\\[' + l + '\\]')).join('')}</div>`);
  }

  async function enviarObs() {
    const b = $('#b-obs');
    const box = $('#obs-estado');
    const textos = {};
    const etq = {};
    gruposObs().forEach((q) => { const t = String((est.obs && est.obs[q.clave]) || '').trim(); if (t) { textos[q.clave] = t.slice(0, 800); etq[q.clave] = q.etq; } });
    if (!Object.keys(textos).length) { box.textContent = 'Escribe al menos una observación antes de enviar.'; return; }
    b.disabled = true;
    box.textContent = 'Enviando…';
    const mia = notas && notas[alumno.reg];
    const { error } = await II.sb.from('respuestas').insert({
      sesion: SID_OBS, actividad: 'obs', carnet: alumno.carnet, nombre: alumno.nombre,
      respuesta: { reg: alumno.reg, cod: codigo(), car: CAR(), textos, etq, nota: mia ? mia.n : null },
      correcta: null, intento: 1, puntaje: 0
    });
    b.disabled = false;
    if (error) { box.textContent = 'No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.'; return; }
    est.obsEnv = Date.now();
    guardarEst();
    box.textContent = 'Enviadas ✓ ' + new Date(est.obsEnv).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
  }

  // ---------------- pintar ----------------
  function CONT(html) { $('#cont').innerHTML = html; }
  // ---------------- vista de escritorio: las preguntas desaparecen mientras esté activa ----------------
  // El examen es para celular. Un navegador de celular con «Sitio de escritorio» dice ser Linux, Windows o Mac, y la
  // página mide mucho más que la pantalla física. Con esa vista bloqueamos las preguntas (se ve un aviso en blanco) y
  // lo anotamos para el docente (sal.escr). Al desactivarla, las preguntas vuelven con lo que ya se había escrito.
  function esEscritorio() {
    const ua = navigator.userAgent || '';
    const movil = /Android|iPhone|iPod|Mobile/i.test(ua);
    const uaEsc = /X11|Linux x86_64|Windows NT|Macintosh|CrOS/i.test(ua) && !movil;
    const pantalla = Math.min(screen.width || 0, screen.height || 0);
    const ancho = Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0);
    const tactil = (navigator.maxTouchPoints || 0) > 0;
    const forzado = tactil && pantalla > 0 && pantalla < 700 && ancho > pantalla * 1.6;
    const uad = navigator.userAgentData;
    const uadEsc = !!(uad && uad.mobile === false && tactil && pantalla < 700);
    return uaEsc || forzado || uadEsc;
  }
  let escrAntes = false;
  function anotarEscritorio(ahoraEsc) {
    if (!est) return;
    est.sal.escr = est.sal.escr || { n: 0, seg: 0, ini: null };
    const e = est.sal.escr;
    if (ahoraEsc && !e.ini) { e.n++; e.ini = Date.now(); guardarEst(); enviarAvance('escritorio'); }
    else if (!ahoraEsc && e.ini) { e.seg += Math.round((Date.now() - e.ini) / 1000); e.ini = null; guardarEst(); enviarAvance('escritorio fin'); }
  }
  function vBloqueoEscritorio() {
    if (vista === 'bloqueo-esc') return;
    vista = 'bloqueo-esc';
    document.body.classList.remove('examen');
    CONT(tarjeta(`<span class="etq">Examen de Electrónica Digital 2</span><h2>Vista de escritorio activada</h2>
      <p>Este examen solo se puede resolver en la vista de celular. Las preguntas están ocultas.</p>
      <p><b>Desactiva «Sitio de escritorio»</b> en el menú del navegador (los tres puntos) y las preguntas vuelven solas, con lo que ya escribiste. Este intento queda registrado para el docente y el reloj sigue corriendo.</p>`));
  }
  setInterval(() => { if (alumno && est && fase() === 'curso' && esEscritorio() !== escrAntes) pintar(); }, 1500);
  window.addEventListener('resize', () => { if (alumno && est && fase() === 'curso' && esEscritorio() !== escrAntes) pintar(); });

  function pintar() {
    barra();
    const f = fase();
    if (alumno && est && f === 'curso') {
      const esc = esEscritorio();
      anotarEscritorio(esc);
      if (esc !== escrAntes) { escrAntes = esc; vista = ''; }
      if (esc) return vBloqueoEscritorio();
    } else if (alumno && est && est.sal && est.sal.escr && est.sal.escr.ini) anotarEscritorio(false);
    if (f === 'registro') return vEntrada();
    if (f === 'cargando') { if (vista !== 'cargando') { vista = 'cargando'; CONT(tarjeta('<p>Conectando con el examen…</p>')); } return; }
    if (f === 'espera') return vEspera();
    if (f === 'observado') return vObservado();
    if (f === 'curso') { if (est.final && !est.terminoYo) { est.final = false; guardarEst(); } pedirPantalla(); return vExamen(); }
    if (f === 'terminado') return vTerminado();
    if (f === 'publicado') return vPublicado();
  }

  // ---------------- registro de salidas ----------------
  const vigilando = () => !!(alumno && est && !est.final && fase() === 'curso');
  let volvio = 0, probTrasVolver = new Set(), blurT0 = 0, ultimoHidden = 0, salidaCerradaEn = 0;
  function cerrarSalidaAbierta() {
    const a = est.sal.abierta;
    if (!a) return 0;
    const seg = Math.max(0, Math.round((ahora() - a.t0) / 1000));
    est.sal.n += 1;
    est.sal.seg += seg;
    est.sal.max = Math.max(est.sal.max, seg);
    est.sal.lista.push({ min: a.min, seg, met: a.met });
    est.sal.abierta = null;
    return seg;
  }
  function anotarCambio(p) {
    if (!volvio || ahora() - volvio > 30000) return;
    if (probTrasVolver.has(p)) return;
    probTrasVolver.add(p);
    est.sal.cambios.push({ f: RC.TITULO[p], s: Math.round((ahora() - volvio) / 1000), min: minDesdeInicio() });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      ultimoHidden = Date.now();
      if (!vigilando()) return;
      if (!est.sal.abierta) { est.sal.abierta = { t0: ahora(), min: minDesdeInicio(), met: pestana }; guardarEst(); }
      enviarAvance('salida');
      return;
    }
    sincronizarHora();
    leerEstado();
    if (est && est.sal && est.sal.abierta && !est.final) {
      const seg = cerrarSalidaAbierta();
      guardarEst();
      salidaCerradaEn = Date.now();
      if (fase() === 'curso') {
        volvio = ahora(); probTrasVolver = new Set();
        avisoVuelta(est.sal.n, seg);
        pedirPantalla();
        enviarAvance('volvió');
      }
    }
  });
  window.addEventListener('blur', (e) => { if (e.target === window && !document.hidden && vigilando()) blurT0 = Date.now(); });
  window.addEventListener('focus', (e) => {
    if (e.target !== window || !blurT0) return;
    const d = Date.now() - blurT0;
    const ocultaEnMedio = ultimoHidden >= blurT0 || Date.now() - salidaCerradaEn < 3000;
    blurT0 = 0;
    if (ocultaEnMedio || d < 1500 || !vigilando()) return;
    est.sal.foco.n += 1;
    est.sal.foco.seg += Math.round(d / 1000);
    guardarEst();
    programarAvance(1000);
  });
  let tVuelta = null;
  function avisoVuelta(n, seg) {
    let a = $('#aviso-vuelta');
    if (!a) { a = document.createElement('div'); a.id = 'aviso-vuelta'; a.className = 'aviso duda aviso-vuelta'; document.body.appendChild(a); }
    a.innerHTML = `⚠ Saliste de la página (${n}.ª vez); ${seg} s fuera. <b>Queda registrado para el docente.</b>`;
    a.classList.remove('oculto');
    clearTimeout(tVuelta);
    tVuelta = setTimeout(() => a.classList.add('oculto'), 6000);
  }
  let bloqueo = null;
  async function pedirPantalla() {
    if (!vigilando() || document.hidden) return;
    if (!('wakeLock' in navigator)) {
      if (est.sal.pantalla !== 'no compatible') { est.sal.pantalla = 'no compatible'; guardarEst(); avisoPantalla(); }
      return;
    }
    if (bloqueo) return;
    try {
      bloqueo = await navigator.wakeLock.request('screen');
      bloqueo.addEventListener('release', () => { bloqueo = null; });
      if (est.sal.pantalla !== 'sí') { est.sal.pantalla = 'sí'; guardarEst(); }
    } catch (e) {
      if (est.sal.pantalla !== 'sí') { est.sal.pantalla = 'falló'; guardarEst(); }
    }
  }
  function avisoPantalla() {
    const a = document.createElement('div');
    a.className = 'aviso duda aviso-vuelta';
    a.innerHTML = 'Tu celular no puede mantener la pantalla encendida solo. <b>Sube el tiempo de bloqueo de pantalla</b> en Ajustes: si se apaga, cuenta como salida.';
    document.body.appendChild(a);
    setTimeout(() => a.remove(), 12000);
  }
  function soltarPantalla() { try { if (bloqueo) bloqueo.release(); } catch (e) { /* nada */ } bloqueo = null; }
  document.addEventListener('click', () => { if (!bloqueo) pedirPantalla(); }, true);

  // ---------------- estado del examen (cada 4 s) ----------------
  async function leerEstado() {
    if (!II.sb) return;
    try {
      const { data, error } = await II.sb.from('estado_sesion').select('extra').eq('sesion', SID).maybeSingle();
      if (error) throw error;
      II.marcarConexion(true);
      const antes = JSON.stringify(ex);
      ex = (data && data.extra) || {};
      leida = true;
      if (!ex.publicado) notas = null;
      if (ex.pub !== pubVisto) { pubVisto = ex.pub; notas = null; if (vista === 'publicado') vista = ''; }
      if (JSON.stringify(ex) !== antes || vista === 'cargando' || vista === '') { if (fase() !== 'curso') vista = vista.startsWith('curso') ? '' : vista; pintar(); }
    } catch (e) { II.marcarConexion(false); }
  }

  // ---------------- arranque ----------------
  II.alCambiarConexion((ok) => { const d = $('#e-con'); d.classList.toggle('on', ok); d.classList.toggle('off', !ok); });
  if (!II.sb) {
    CONT(tarjeta('<h2>Sin conexión</h2><p>No se pudo cargar el examen. Revisa tus datos móviles y recarga la página.</p><button class="boton prim bloque" onclick="location.reload()">Recargar</button>'));
    return;
  }
  if (alumno) {
    cargarEst();
    if (est && !est.final) {
      est.sal.recargas += 1;
      if (est.sal.abierta) cerrarSalidaAbierta();
      guardarEst();
    }
  }
  sincronizarHora().then(() => { leerEstado(); pintar(); });
  setInterval(leerEstado, 4000);
  // reloj y cierre automático
  setInterval(() => {
    barra();
    const f = fase();
    if (alumno && est && f === 'terminado' && !est.final) pintar();
    if (f === 'terminado' && vista.startsWith('terminadop') && !II.leer(K_COLA, []).length) { vista = ''; pintar(); }
  }, 500);
  // copia automática si hay cambios
  setInterval(() => { if (cambiosSinEnviar && fase() === 'curso') { cambiosSinEnviar = false; enviarAvance('auto'); } }, 30000);
})();
