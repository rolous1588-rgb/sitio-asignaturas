// ============================================================
// Métodos Numéricos · Examen de raíces (16/10/2026) — celular del estudiante
// Entrada: QR de un solo uso que el docente muestra en su celular (?t=código; RPC mn_canjear_qr).
// Fases (estado_sesion.extra):
//   sin «abre» → espera · abre + carnet en «hab» → en curso · abre sin habilitar → llegó tarde (espera)
//   fin (cuenta regresiva) alcanzado → terminado · publicado → nota y solución
//   pausa = { rest } → la cuenta regresiva está detenida
// Filas: no se bloquean; «Guardar fila» envía todo lo que tiene; vale lo último guardado.
// Derivada de Newton: se elige una vez y se corrige al momento.
// Registro de salidas (página oculta: otra app, bloqueo, pantalla apagada), pérdidas de foco, pantalla encendida.
// ============================================================
(function () {
  const $ = II.$;
  const $$ = II.$$;
  const PARAM_S = II.params.get('s') || '';
  const SID = /prueba/.test(PARAM_S) ? 'mn-ex-prueba' : 'mn-ex1';
  const TOKEN = II.params.get('t') || '';
  const K_AL = 'mx-alumno-' + SID;
  const K_PASE = 'mx-pase-' + SID;
  const K_COLA = 'mx-cola';
  const CARRERAS = ['Ingeniería Mecatrónica', 'Ingeniería Electrónica', 'Ingeniería Eléctrica'];
  const DISP = (() => { let d = II.leer('mx-disp', null); if (!d) { d = Math.random().toString(36).slice(2, 10); II.guardar('mx-disp', d); } return d; })();
  const tipoDisp = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'iPhone' : /Android/.test(navigator.userAgent) ? 'Android' : 'otro';

  let alumno = II.leer(K_AL, null);
  let ex = {};
  let leida = false;
  let offset = 0;
  const ahora = () => Date.now() + offset;
  let vista = '';
  let pestana = 'bis';
  let notas = null;

  const kEst = () => 'mx-est-' + SID + '-' + alumno.carnet;
  const nuevaSal = () => ({ n: 0, seg: 0, max: 0, lista: [], abierta: null, foco: { n: 0, seg: 0 }, cambios: [], pantalla: '—', recargas: 0, disp: tipoDisp });
  const nuevoEst = () => ({ bis: { filas: [{ vals: {} }, { vals: {} }, { vals: {} }] }, fp: { filas: [{ vals: {} }, { vals: {} }, { vals: {} }] }, nr: { filas: [{ vals: {} }, { vals: {} }, { vals: {} }], der: null }, sal: nuevaSal(), guardadas: {}, final: false, ultEnvio: null });
  let est = null;
  const cargarEst = () => { est = II.leer(kEst(), null) || nuevoEst(); est.sal = est.sal || nuevaSal(); est.guardadas = est.guardadas || {}; };
  const guardarEst = () => II.guardar(kEst(), est);
  const codigo = () => EX.codigo(alumno.carnet, DISP);

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
  const habilitado = () => !!(alumno && ex.hab && ex.hab[alumno.carnet]);
  const terminado = () => !!(ex.fin && ahora() >= Date.parse(ex.fin));
  function fase() {
    if (!alumno) return 'registro';
    if (!leida) return 'cargando';
    if (ex.publicado) return 'publicado';
    if (!ex.abre) return 'espera';
    if (terminado()) return 'terminado';
    if (!habilitado()) return 'tarde';
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
          const r = II.leer('mx-cola-rechazadas', []); r.push(c[0]); II.guardar('mx-cola-rechazadas', r.slice(-20));
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
    return { n: s.n, seg: s.seg, max: s.max, lista: s.lista.slice(-30), abierta: s.abierta, foco: s.foco, cambios: s.cambios.slice(-30), pantalla: s.pantalla, recargas: s.recargas, disp: s.disp };
  }
  function enviarAvance(motivo) {
    if (!alumno || !est) return;
    const copia = { bis: { filas: est.bis.filas }, fp: { filas: est.fp.filas }, nr: { filas: est.nr.filas, der: est.nr.der } };
    encolar({
      sesion: SID, actividad: 'avance', carnet: alumno.carnet, nombre: alumno.nombre,
      respuesta: { est: copia, sal: resumenSal(), motivo, disp: DISP, cod: codigo(), car: alumno.info.carrera, final: motivo === 'final' },
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
  const tn = (x) => MP.d4(x).replace(',', '{,}').replace(/^-/, '-');
  const fmt = (x) => MP.d4(x).replace(/^-/, '−');
  const LAB = { xa: 'X_a', xb: 'X_b', fa: 'f(X_a)', fb: 'f(X_b)', xr: 'X_r', fr: 'f(X_r)', er: '\\text{Error }\\%', xn: 'X_n', fx: 'f(X_n)', dfx: "f'(X_n)", x1: 'X_{n+1}' };
  const lab = (id) => `\\(${LAB[id] || id}\\)`;

  function barra() {
    $('#e-nombre').textContent = alumno ? alumno.nombre + (SID === 'mn-ex-prueba' ? '; ENSAYO' : '') : 'Examen de raíces' + (SID === 'mn-ex-prueba' ? '; ensayo' : '');
    const r = $('#e-reloj');
    const s = restante();
    const f = fase();
    if (f === 'curso' && s != null) {
      r.textContent = (ex.pausa ? '⏸ ' : '⏱ ') + mmss(s);
      r.classList.remove('oculto');
      r.classList.toggle('urgente', !ex.pausa && s <= 120);
    } else r.classList.add('oculto');
  }

  // ---------------- registro (con el QR) ----------------
  async function vEntrada() {
    const pase = II.leer(K_PASE, null);
    if (pase && (!TOKEN || pase.t === TOKEN)) return vRegistro();
    if (!TOKEN) {
      CONT(tarjeta(`<span class="etq">Métodos Numéricos; examen</span><h2>Escanea el QR del docente</h2><p>Para entrar, escanea el código que te muestra el docente en su celular.</p>`));
      return;
    }
    CONT(tarjeta('<p>Verificando el código…</p>'));
    let ok = false;
    try {
      const { data, error } = await II.sb.rpc('mn_canjear_qr', { p_sesion: SID, p_token: TOKEN });
      if (error) throw error;
      ok = !!data;
    } catch (e) {
      CONT(tarjeta('<h2>Sin conexión</h2><p>No se pudo verificar el código. Revisa tus datos móviles y vuelve a escanear.</p>'));
      return;
    }
    if (!ok) {
      CONT(tarjeta('<span class="etq">Métodos Numéricos; examen</span><h2>Este QR ya se usó</h2><p>Cada código sirve para una sola persona. Pide al docente que te muestre el QR de nuevo.</p>'));
      return;
    }
    II.guardar(K_PASE, { t: TOKEN, en: Date.now() });
    vRegistro();
  }

  function vRegistro() {
    vista = 'registro';
    CONT(tarjeta(`<span class="etq">Métodos Numéricos; examen de raíces</span>
      <h2>Escribe tus datos</h2>
      <p>Tómate tu tiempo: tu entrada ya está reservada.</p>
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
      const info = { apellidos: limpio('apellidos'), nombres: limpio('nombres'), ci: limpio('ci'), carrera: String(fd.get('carrera') || ''), disp: DISP, tipo: tipoDisp };
      const cu = limpio('cu').replace(/\s+/g, '');
      if (!CARRERAS.includes(info.carrera)) { const e = $('#f-error'); e.textContent = 'Elige tu carrera.'; e.classList.remove('oculto'); return; }
      ev.target.querySelector('button').disabled = true;
      alumno = { nombre: info.apellidos + ', ' + info.nombres, carnet: cu, info };
      info.cod = codigo();
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
  function vEspera(tarde) {
    if (vista === 'espera' + tarde) return;
    vista = 'espera' + tarde;
    CONT(tarjeta(`<span class="etq">Métodos Numéricos; examen de raíces</span>
      <h2>${tarde ? 'Espera: el docente te habilitará' : 'Espera a que el docente inicie el examen'}</h2>
      <p>Estás registrado como <b>${II.esc(alumno.nombre)}</b> (C.U. ${II.esc(alumno.carnet)}).</p>
      <div class="ex-codigo">Código <b>${codigo()}</b></div>
      <ul class="ex-reglas">
        <li>Calculadora simple. <b>4 decimales</b>, redondeando al más cercano; solo se redondea lo que anotas y sigues con el valor anotado.</li>
        <li>Puedes escribir con coma o con punto decimal.</li>
        <li>Tres métodos con 3 iteraciones cada uno: bisección (30 puntos), falsa posición (35) y Newton-Raphson (35).</li>
        <li>Las filas <b>no se bloquean</b>: puedes corregir hasta el final. Toca <b>Guardar fila</b> cada vez; vale lo último guardado.</li>
        <li>En Newton eliges la derivada <b>una sola vez</b>.</li>
        <li><b>No salgas de esta página ni bloquees el celular:</b> cada salida queda registrada para el docente. La pantalla se mantiene encendida sola.</li>
        <li>Activa «No molestar»: una llamada también cuenta como salida.</li>
      </ul>
      <p class="mp-nota">Esta pantalla cambia sola cuando empiece el examen.</p>`));
  }

  // ---------------- examen ----------------
  function vExamen() {
    if (vista === 'curso-' + pestana) { pintarGuardado(); return; }
    vista = 'curso-' + pestana;
    document.body.classList.add('examen');
    marcaDeAgua();
    const tabs = EX.MET.map((m) => `<button class="ex-tab ${m === pestana ? 'activa' : ''}" data-tab="${m}"><b>${EX.TITULO[m]}</b><small>${EX.MAX[m]} pts; <span data-prog="${m}">${progreso(m)}</span></small></button>`).join('');
    CONT(`<div class="ex-tabs">${tabs}</div><div id="ex-met">${metodoHTML(pestana)}</div>
      <p class="mp-nota ex-pie">Código ${codigo()}. Tus respuestas se guardan en tu celular y se envían al docente cuando tocas «Guardar fila» (y solas cada cierto tiempo). Vale lo último guardado.</p>`);
    enlazar();
    pintarGuardado();
  }

  function progreso(m) {
    const n = est[m].filas.filter((f, i) => est.guardadas[m + i]).length;
    return `${n}/3 guardadas`;
  }

  function metodoHTML(m) {
    const d = EX.datos(m, alumno.carnet);
    const tnum = (x) => String(x).replace('.', '{,}');
    const ini = m === 'nr' ? `\\(x_0 = ${tnum(d.x0)}\\)` : `\\(X_a = ${tnum(d.a)}\\);\\(\\;X_b = ${tnum(d.b)}\\)`;
    let h = tarjeta(`<span class="etq">${EX.TITULO[m]}; ${EX.MAX[m]} puntos</span>
      <div class="ex-func">\\[${d.tex}\\]</div>
      <p class="ex-datos">${m === 'nr' ? 'Valor inicial' : 'Intervalo inicial'}: ${ini}. Haz <b>3 iteraciones</b> con <b>4 decimales</b>.</p>`);
    const em = est[m];
    let listo = true;
    if (m === 'nr') {
      if (!em.der) {
        listo = false;
        h += tarjeta(`<span class="etq">Antes de la tabla</span><h2>Elige \\(f'(x)\\)</h2><p>Solo puedes elegir <b>una vez</b>. Se revisa al momento y después verás la correcta.</p>
          <div class="ex-der">${d.derOps.map((o, k) => `<button class="mp-op" data-der="${k}">\\(f'(x) = ${o.t}\\)</button>`).join('')}</div>`);
      } else {
        h += tarjeta(`<div class="aviso ${em.der.ok ? 'ok' : 'mal'}">${em.der.ok ? '¡Correcto!' : 'No era esa.'}</div>
          <p>Continúa con \\(f'(x) = ${d.derCorrecta}\\)</p>`);
      }
    }
    if (listo) {
      for (let n = 1; n <= MP.FILAS; n++) h += filaHTML(m, d, n);
    }
    return h;
  }

  // casillas de la fila n (los valores fijos de la fila 1 vienen dados)
  function filaHTML(m, d, n) {
    const C = MP.celdas(d, n, n === 1 ? null : { xa: 0, xb: 0, fa: 0, fb: 0, xr: 0, fr: 0, dec: 'a', x1: 0 });
    const vals = est[m].filas[n - 1].vals;
    let celdas = '', dec = '';
    C.forEach((c) => {
      if (c.tipo === 'fijo') {
        celdas += `<div class="mp-celda"><span class="et">${lab(c.id)}</span><div class="mp-fijo">${c.val === '---' ? '---' : fmt(c.val)}</div></div>`;
      } else if (c.tipo === 'dec') {
        const v = vals.dec;
        dec = `<div class="mp-dec"><p>Responde: en la siguiente fila, ¿\\(X_r\\) reemplazará a \\(X_a\\) o reemplazará a \\(X_b\\)?</p>
          <div class="ops"><button type="button" class="mp-op ${v === 'a' ? 'elegida' : ''}" data-dec="${m}|${n}" data-k="a">\\(X_r\\) reemplazará a \\(X_a\\)</button><button type="button" class="mp-op ${v === 'b' ? 'elegida' : ''}" data-dec="${m}|${n}" data-k="b">\\(X_r\\) reemplazará a \\(X_b\\)</button></div></div>`;
      } else {
        const id = m + '|' + n + '|' + c.id;
        celdas += `<label class="mp-celda"><span class="et">${lab(c.id)}</span><span class="mp-num"><button type="button" class="mp-signo" data-signo="${id}" aria-label="Cambiar signo">±</button><input data-c="${id}" inputmode="decimal" autocomplete="off" value="${II.esc(vals[c.id] == null ? '' : vals[c.id])}"></span></label>`;
      }
    });
    return `<div class="mp-fila" id="fila-${m}-${n}"><div class="mp-fila-cab"><h3>Fila ${n}</h3><span>\\(n = ${n}\\)</span></div>
      <div class="mp-celdas">${celdas}${dec}</div>
      <div class="mp-pie"><button class="boton prim" data-guardar="${m}|${n}">Guardar fila ${n}</button><span class="mp-int" data-estado="${m}|${n}"></span></div></div>`;
  }

  const firmaFila = (m, i) => JSON.stringify(est[m].filas[i].vals);
  function pintarGuardado() {
    $$('[data-estado]').forEach((el) => {
      const [m, n] = el.dataset.estado.split('|');
      const i = Number(n) - 1;
      const g = est.guardadas[m + i];
      const vacia = !Object.keys(est[m].filas[i].vals).length;
      if (g && g.f === firmaFila(m, i)) { el.textContent = 'Guardada ✓ ' + new Date(g.t).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }); el.className = 'mp-int ok'; }
      else if (vacia) { el.textContent = ''; el.className = 'mp-int'; }
      else { el.textContent = 'Cambios sin guardar'; el.className = 'mp-int mal'; }
    });
    EX.MET.forEach((m) => { const p = $(`[data-prog="${m}"]`); if (p) p.textContent = progreso(m); });
  }

  function enlazar() {
    $$('[data-tab]').forEach((b) => { b.onclick = () => { pestana = b.dataset.tab; vista = ''; vExamen(); window.scrollTo(0, 0); }; });
    const cambiar = (inp) => {
      const [m, n, id] = inp.dataset.c.split('|');
      const fila = est[m].filas[Number(n) - 1];
      fila.vals[id] = inp.value;
      if (inp.value === '') delete fila.vals[id];
      anotarCambio(m, n);
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
    $$('[data-dec]').forEach((b) => {
      b.onclick = () => {
        const [m, n] = b.dataset.dec.split('|');
        est[m].filas[Number(n) - 1].vals.dec = b.dataset.k;
        $$(`[data-dec="${m}|${n}"]`).forEach((x) => x.classList.toggle('elegida', x === b));
        anotarCambio(m, n);
        guardarEst();
        pintarGuardado();
        programarAvance();
      };
    });
    $$('[data-guardar]').forEach((b) => {
      b.onclick = () => {
        const [m, n] = b.dataset.guardar.split('|');
        const i = Number(n) - 1;
        est.guardadas[m + i] = { f: firmaFila(m, i), t: ahora() };
        guardarEst();
        cambiosSinEnviar = false;
        enviarAvance('fila ' + m + n);
        pintarGuardado();
      };
    });
    $$('[data-der]').forEach((b) => {
      b.onclick = async () => {
        const d = EX.datos('nr', alumno.carnet);
        const o = d.derOps[Number(b.dataset.der)];
        const ok = await confirmar('¿Esta es tu derivada?', `\\(f'(x) = ${o.t}\\)<br>Solo puedes elegir una vez.`);
        if (!ok) return;
        est.nr.der = { t: o.t, ok: o.ok };
        guardarEst();
        enviarAvance('derivada');
        vista = '';
        vExamen();
      };
    });
  }

  function confirmar(titulo, texto) {
    return new Promise((res) => {
      const capa = II.html(`<div class="capa"><div class="dialogo"><h2>${titulo}</h2><p>${texto}</p>
        <div class="fila-bt"><button class="boton" data-r="0">Cancelar</button><button class="boton prim" data-r="1">Sí, es esta</button></div></div></div>`);
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

  // ---------------- terminado ----------------
  function vTerminado() {
    if (!est.final) {
      est.final = true;
      guardarEst();
      enviarAvance('final');
    }
    const pend = II.leer(K_COLA, []).length;
    const clave = 'terminado' + (pend ? 'p' : '');
    if (vista === clave) return;
    vista = clave;
    document.body.classList.remove('examen');
    document.body.style.backgroundImage = '';
    soltarPantalla();
    CONT(tarjeta(`<span class="etq">Examen terminado</span><h2>Listo, ${II.esc(alumno.info.nombres.split(' ')[0])}</h2>
      ${pend ? '<div class="aviso duda">Enviando tus últimas respuestas… no cierres esta página hasta que desaparezca este aviso.</div>' : '<div class="aviso ok">Tus respuestas llegaron al docente.</div>'}
      <p>El docente publicará las notas. Cuando lo haga, aquí verás tu nota, tus errores y la solución.</p>`));
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
    document.body.classList.remove('examen');
    document.body.style.backgroundImage = '';
    const mia = notas[alumno.carnet];
    const local = EX.nota(alumno.carnet, est);
    if (!mia) {
      CONT(tarjeta('<h2>Notas publicadas</h2><p>No se encontró una nota con tu C.U. Habla con el docente.</p>'));
      return;
    }
    const igual = mia.h === EX.firma(est);
    let h = tarjeta(`<span class="etq">Examen de raíces; nota publicada</span>
      <div class="mp-res"><div class="grande">${II.fmt(mia.n, 2)}<small> / 100</small></div></div>
      <table class="mp-tabla"><tr><th>Método</th><th>Puntos</th></tr>${EX.MET.map((m) => `<tr><td>${EX.TITULO[m]}</td><td>${II.fmt(mia.p ? mia.p[m] : local.res[m].pts, 2)} / ${EX.MAX[m]}</td></tr>`).join('')}</table>
      ${igual ? '' : '<div class="aviso duda">Tu nota se calculó con lo último que llegó al docente. El detalle de abajo es lo que quedó en tu celular y puede no coincidir.</div>'}
      <p class="mp-nota">Cada casilla se califica con <b>tus propios números</b>: ✓ completo; ≈ error de redondeo, mitad; ✗ o vacía, 0.</p>`);
    EX.MET.forEach((m) => { h += detalleMetodo(m, local.res[m]); });
    CONT(h);
  }

  function detalleMetodo(m, res) {
    const d = EX.datos(m, alumno.carnet);
    const T = MP.tablaReferencia(d);
    const marca = { ok: '✓', red: '≈', mal: '✗', vacio: '✗' };
    let filas = '';
    res.filas.forEach((f, i) => {
      const vals = est[m].filas[i].vals;
      const celdas = Object.entries(f.cel).map(([id, c]) => {
        const v = id === 'dec' ? (vals.dec === 'a' ? 'Xa' : vals.dec === 'b' ? 'Xb' : '—') : vals[id] ? neg(vals[id]) : '—';
        const e = id === 'dec' ? (c.exp === 'a' ? 'Xa' : 'Xb') : fmt(c.exp);
        return `<tr class="${c.r === 'ok' ? 'ok' : c.r === 'red' ? 'red' : 'mal'}"><td>${id === 'dec' ? 'Extremo' : lab(id)}</td><td class="mono">${II.esc(v)}</td><td>${marca[c.r]}${c.r === 'ok' ? '' : ' <span class="mono">' + e + '</span>'}</td><td>${II.fmt(c.pts, 2)}/${II.fmt(c.max, 2)}</td></tr>`;
      }).join('');
      filas += `<tr class="ex-sep"><td colspan="4">Fila ${i + 1}</td></tr>${celdas}`;
    });
    const ref = m === 'nr'
      ? `<tr><th>n</th><th>\\(X_n\\)</th><th>\\(f(X_n)\\)</th><th>\\(f'(X_n)\\)</th><th>\\(X_{n+1}\\)</th><th>Error %</th></tr>${T.map((t, i) => `<tr><td>${i + 1}</td><td>${fmt(t.xn)}</td><td>${fmt(t.fx)}</td><td>${fmt(t.dfx)}</td><td>${fmt(t.x1)}</td><td>${fmt(t.er)}</td></tr>`).join('')}`
      : `<tr><th>n</th><th>\\(X_a\\)</th><th>\\(X_b\\)</th><th>\\(f(X_a)\\)</th><th>\\(f(X_b)\\)</th><th>\\(X_r\\)</th><th>\\(f(X_r)\\)</th><th>Error %</th><th>Reemplaza a</th></tr>${T.map((t, i) => `<tr><td>${i + 1}</td><td>${fmt(t.xa)}</td><td>${fmt(t.xb)}</td><td>${fmt(t.fa)}</td><td>${fmt(t.fb)}</td><td>${fmt(t.xr)}</td><td>${fmt(t.fr)}</td><td>${t.er === '---' ? '---' : fmt(t.er)}</td><td>${t.dec ? (t.dec === 'a' ? 'Xa' : 'Xb') : '—'}</td></tr>`).join('')}`;
    const der = m === 'nr' ? `<p>Derivada: ${est.nr.der ? (est.nr.der.ok ? '✓ correcta (6/6)' : '✗ elegiste \\(' + est.nr.der.t + '\\) (0/6)') : 'no elegiste (0/6)'}; la correcta es \\(f'(x) = ${d.derCorrecta}\\). ${d.porDer}</p>` : '';
    return tarjeta(`<span class="etq">${EX.TITULO[m]}; ${II.fmt(res.pts, 2)} / ${EX.MAX[m]}</span>
      <div class="ex-func">\\[${d.tex}\\]</div>${der}
      <p class="mp-nota">Tus respuestas. Si una casilla está mal, al lado va el valor que salía <b>con tus números</b>.</p>
      <div class="mp-tabla-scroll"><table class="mp-tabla ex-det">${filas}</table></div>
      <p class="mp-nota">Solución completa (desde el inicio, sin errores):</p>
      <div class="mp-tabla-scroll"><table class="mp-tabla">${ref}</table></div>`);
  }
  const neg = (s) => String(s).replace(/^-/, '−');

  // ---------------- pintar ----------------
  function CONT(html) { $('#cont').innerHTML = html; }
  function pintar() {
    barra();
    const f = fase();
    if (f === 'registro') return vEntrada();
    if (f === 'cargando') { if (vista !== 'cargando') { vista = 'cargando'; CONT(tarjeta('<p>Conectando con el examen…</p>')); } return; }
    if (f === 'espera') return vEspera(false);
    if (f === 'tarde') return vEspera(true);
    if (f === 'curso') { if (est.final) { est.final = false; guardarEst(); } pedirPantalla(); return vExamen(); }
    if (f === 'terminado') return vTerminado();
    if (f === 'publicado') return vPublicado();
  }

  // ---------------- registro de salidas ----------------
  const vigilando = () => !!(alumno && est && !est.final && fase() === 'curso');
  let volvio = 0, filasTrasVolver = new Set(), blurT0 = 0, ultimoHidden = 0, salidaCerradaEn = 0;
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
  function anotarCambio(m, n) {
    if (!volvio || ahora() - volvio > 30000) return;
    const k = m + n;
    if (filasTrasVolver.has(k)) return;
    filasTrasVolver.add(k);
    est.sal.cambios.push({ f: EX.TITULO[m] + ' fila ' + n, s: Math.round((ahora() - volvio) / 1000), min: minDesdeInicio() });
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
        volvio = ahora(); filasTrasVolver = new Set();
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
    if (f === 'terminado' && vista === 'terminadop' && !II.leer(K_COLA, []).length) { vista = ''; pintar(); }
  }, 500);
  // copia automática si hay cambios
  setInterval(() => { if (cambiosSinEnviar && fase() === 'curso') { cambiosSinEnviar = false; enviarAvance('auto'); } }, 30000);
})();
