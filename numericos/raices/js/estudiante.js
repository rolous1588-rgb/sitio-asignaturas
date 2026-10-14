// ============================================================
// Métodos Numéricos · Repaso de raíces — vista del estudiante (celular vertical). Sigue el paso del docente.
// Copia adaptada de transformadas/fourier/js/estudiante.js: agrega «Comprobar fila» (ejercicios con `filas`).
// ?modo=libre → repaso por su cuenta, sin registrar nada.
// Antes de enviar pide confirmación. Si el docente lo habilita de nuevo (extra.rehab),
// puede corregir y volver a enviar: vale el último envío.
// ============================================================
(function () {
  const $ = II.$;
  const S = FS.SESIONES['mn-raices'];
  const SID = S.id;
  const LIBRE = II.params.get('modo') === 'libre';
  const K_AL = 'fs-alumno-' + SID;
  const LETRAS = ['A', 'B', 'C', 'D', 'E'];

  let alumno = II.leer(K_AL, null);
  if (LIBRE && !alumno) alumno = { nombre: 'Repaso', carnet: 'libre' + Math.floor(Math.random() * 1e6), info: { carrera: FS.CARRERAS[0] } };
  let fila = null;
  let recibido = 0;
  let libreIdx = 0;
  let diag = null;
  let montado = '';
  let elegida = {};
  let cuentaT = null;
  let semilla = II.leer('fs-semilla-' + SID, {});
  let resp = {};
  let habil = {};
  let enviando = {};
  const kResp = () => (LIBRE ? 'fs-libre-' : 'fs-resp-') + SID + '-' + alumno.carnet;
  const kHabil = () => 'fs-habil-' + SID + '-' + alumno.carnet;
  const kBorr = (p) => 'fs-borr-' + SID + '-' + p.id + '-' + alumno.carnet;
  const guardarResp = () => { II.guardar(kResp(), resp); II.guardar(kHabil(), habil); };
  const carrera = () => (alumno && alumno.info && alumno.info.carrera) || '';
  const fechaLocal = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  const pasoActual = () => {
    if (LIBRE) return S.pasos[libreIdx];
    const i = fila ? S.pasos.findIndex((p) => p.id === fila.paso) : 0;
    return S.pasos[Math.max(0, i)];
  };
  const faseDe = (p) => {
    if (LIBRE) return resp[p.id] ? 'cerrado' : 'abierto';
    const ex = (fila && fila.extra) || {};
    if (ex.cerrado === p.id) return 'cerrado';
    if (ex.abierto === p.id) return ex.fin ? 'cerrando' : 'abierto';
    return 'preparado';
  };
  const datos = (p) => FS.datosDe(p.ejercicio, alumno.carnet, carrera(), semilla[p.id]);
  const puntosTotales = () => Object.values(resp).reduce((a, r) => a + (r && r.visto ? Number(r.puntos) || 0 : 0), 0);
  const diaActivo = () => { const ex = (fila && fila.extra) || {}; return !LIBRE && ex.dia && ex.dia.fecha === fechaLocal() ? ex.dia : null; };

  // ---------------- barra ----------------
  function barra() {
    const p = alumno ? pasoActual() : null;
    $('#e-nombre').textContent = !alumno ? 'Repaso de raíces' : LIBRE ? 'Repaso libre' : (p ? 'Etapa ' + p.etapa + ' · ' + FS.ETAPAS[p.etapa - 1] : '') + ' · ' + alumno.info.nombres;
    $('#e-pts').textContent = II.fmt(puntosTotales(), 1) + ' pts';
    $('#e-pts').classList.toggle('oculto', !alumno);
  }

  // ---------------- ingreso ----------------
  function vistaIngreso() {
    $('#cont').innerHTML = `<div class="tarjeta">
      <span class="etq">${II.esc(S.materia)}</span>
      <h2>${II.esc(S.titulo)}</h2>
      <p>Entra con tus datos. En la parte individual tendrás <b>tu propia función</b>.</p>
      <form id="f-ingreso">
        <label class="campo"><span>Apellidos</span><input name="apellidos" required minlength="2" maxlength="38" autocomplete="family-name"></label>
        <label class="campo"><span>Nombres</span><input name="nombres" required minlength="2" maxlength="38" autocomplete="given-name"></label>
        <label class="campo"><span>Número de carnet de identidad (C.I.)</span><input name="ci" required minlength="4" maxlength="15" autocomplete="off"></label>
        <label class="campo"><span>Carnet universitario (C.U.)</span><input name="cu" required minlength="3" maxlength="20" inputmode="numeric" autocomplete="off"></label>
        <label class="campo"><span>Carrera</span><select name="carrera" required><option value="" disabled selected>Elige tu carrera</option>${FS.CARRERAS.map((c) => `<option>${c}</option>`).join('')}</select></label>
        <div class="aviso mal oculto" id="f-error"></div>
        <button class="boton prim bloque">Entrar a la clase</button>
      </form></div>`;
    $('#f-ingreso').onsubmit = async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const limpio = (k) => String(fd.get(k) || '').trim().replace(/\s+/g, ' ');
      const info = { apellidos: limpio('apellidos'), nombres: limpio('nombres'), ci: limpio('ci'), carrera: String(fd.get('carrera') || '') };
      const cu = limpio('cu').replace(/\s+/g, '');
      if (!FS.CARRERAS.includes(info.carrera)) { const e = $('#f-error'); e.textContent = 'Elige tu carrera.'; e.classList.remove('oculto'); return; }
      alumno = { nombre: info.apellidos + ', ' + info.nombres, carnet: cu, info };
      ev.target.querySelector('button').disabled = true;
      await II.registrarIngreso(SID, alumno);
      alumno.dia = hoy();
      II.guardar(K_AL, alumno);
      arrancar();
    };
  }

  // ---------------- piezas ----------------
  const formulas = (lista, titulo = 'Fórmulas útiles') =>
    `<div class="formulas-est"><span class="etq">${II.esc(titulo)}</span>${lista.map((x) => (/:$/.test(x) ? `<div class="nota">${II.esc(x)}</div>` : `<div>${II.esc(x)}</div>`)).join('')}</div>`;
  const tarjeta = (html) => `<div class="tarjeta">${html}</div>`;
  const mira = (t = 'Mira la pantalla') => `<p class="mira"><span class="icono">📺</span>${t}</p>`;

  function confirmar(titulo, texto) {
    return new Promise((res) => {
      const capa = II.html(`<div class="capa"><div class="dialogo">
        <h2>${titulo}</h2><p>${texto}</p>
        <div class="fila-bt"><button class="boton" data-r="0">Cancelar</button><button class="boton prim" data-r="1">Sí, enviar</button></div></div></div>`);
      document.body.appendChild(capa);
      capa.onclick = (e) => {
        const b = e.target.closest('[data-r]');
        if (!b && e.target !== capa) return;
        capa.remove();
        res(!!(b && b.dataset.r === '1'));
      };
    });
  }

  function navLibre() {
    if (!LIBRE) return '';
    return `<div class="nav-libre"><button class="boton" id="l-ant" ${libreIdx === 0 ? 'disabled' : ''}>◀ Anterior</button><span>${libreIdx + 1}/${S.pasos.length}</span><button class="boton" id="l-sig" ${libreIdx === S.pasos.length - 1 ? 'disabled' : ''}>Siguiente ▶</button></div>`;
  }
  function enlazarNav() {
    if (!LIBRE) return;
    $('#l-ant').onclick = () => { libreIdx--; II.guardar('fs-libre-idx', libreIdx); render(true); window.scrollTo(0, 0); };
    $('#l-sig').onclick = () => { libreIdx++; II.guardar('fs-libre-idx', libreIdx); render(true); window.scrollTo(0, 0); };
  }

  // ---------------- vistas por tipo ----------------
  function vInicio() {
    $('#cont').innerHTML = navLibre() + tarjeta(`<span class="etq">Conectado</span><h2>¡Listo, ${II.esc((alumno.info && alumno.info.nombres || alumno.nombre).split(' ')[0])}!</h2>${LIBRE ? '<p>Recorre la clase a tu ritmo. Nada se registra.</p>' : mira('Mira la pantalla: la clase empieza pronto.')}`);
  }

  function vTeoria(p) {
    $('#cont').innerHTML = navLibre() + tarjeta(`<span class="etq">Etapa ${p.etapa} · Teoría</span><h2>${II.esc(p.titulo)}</h2>
      ${p.idea ? `<p class="idea-est">${II.esc(p.idea)}</p>` : ''}
      <ul class="puntos-est">${(p.puntos || []).map((x) => `<li>${x}</li>`).join('')}</ul>
      ${formulas(p.formulas || [], p.derecha || 'Fórmulas')}${LIBRE ? '' : mira()}`);
  }

  function vExplica(p) {
    $('#cont').innerHTML = navLibre() + tarjeta(`<span class="etq">Etapa ${p.etapa} · Explicación</span><h2>${II.esc(p.titulo)}</h2>
      <p class="idea-est">${II.esc(p.idea || '')}</p>${LIBRE ? '' : mira()}
      <button class="boton bloque" id="b-explorar">${LIBRE ? 'Abrir el diagrama' : 'Explorar en mi celular'}</button><div id="zona-dg" style="margin-top:12px"></div>`);
    $('#b-explorar').onclick = (ev) => {
      ev.target.remove();
      if (diag) diag.destruir();
      diag = FS.diagrama($('#zona-dg'), { modo: p.modo, params: p.params });
    };
  }

  function avisoHabil(p) {
    return habil[p.id] && !resp[p.id] ? '<div class="aviso info">El docente te habilitó: corrige y vuelve a enviar. Vale tu último envío.</div>' : '';
  }

  function vRapida(p) {
    const fz = faseDe(p);
    const r = resp[p.id];
    if (fz === 'preparado') {
      $('#cont').innerHTML = navLibre() + tarjeta(`<span class="etq">Pregunta rápida · 1 punto</span><h2>Espera la pregunta…</h2>${mira('Aparecerá aquí cuando el docente la habilite.')}`);
      return;
    }
    const orden = II.mezclar(II.rng(alumno.carnet + '|' + p.id), p.o.map((_, k) => k));
    const cerrado = fz === 'cerrado';
    const ops = orden.map((k) => {
      let cls = '';
      if (cerrado) cls = k === p.c ? 'correcta' : r && r.opcion === k ? 'errada' : '';
      else if ((r && r.opcion === k) || elegida[p.id] === k) cls = 'elegida';
      return `<button class="opcion-est ${cls}" data-k="${k}" ${r || cerrado ? 'disabled' : ''}><span class="letra">${LETRAS[k]}</span><span>${II.esc(p.o[k])}</span></button>`;
    }).join('');
    let pie = '';
    if (cerrado) {
      if (r) { r.visto = true; guardarResp(); }
      pie = (!r ? '<div class="aviso duda">No respondiste esta pregunta.</div>'
        : r.ok ? '<div class="aviso ok">¡Correcto! +1 punto</div>' : '<div class="aviso mal">No era esa. Mira la correcta en verde.</div>') + (p.por ? `<p class="idea-est">${II.esc(p.por)}</p>` : '');
    } else if (r) pie = '<div class="aviso info">Enviado ✓ — espera a que se cierre.</div>';
    else pie = `<button class="boton prim bloque" id="b-enviar" ${elegida[p.id] == null ? 'disabled' : ''}>Enviar</button>`;
    $('#cont').innerHTML = navLibre() + tarjeta(`<span class="etq">Etapa ${p.etapa} · Pregunta rápida · 1 punto</span><h2>${II.esc(p.t)}</h2>${avisoHabil(p)}<div class="opciones-est">${ops}</div><div style="margin-top:12px">${pie}</div>`);
    II.$$('.opcion-est').forEach((bt) => {
      bt.onclick = () => { elegida[p.id] = Number(bt.dataset.k); II.$$('.opcion-est').forEach((x) => x.classList.toggle('elegida', x === bt)); const e = $('#b-enviar'); if (e) e.disabled = false; };
    });
    const be = $('#b-enviar');
    if (be) be.onclick = async () => {
      if (elegida[p.id] == null) return;
      const ok = await confirmar('¿Enviar tu respuesta?', `Elegiste <b>${LETRAS[elegida[p.id]]}</b>: ${II.esc(p.o[elegida[p.id]])}. Después de enviar no podrás cambiarla.`);
      if (ok) enviarRapida(p);
    };
    barra();
  }

  async function enviarRapida(p, auto) {
    const k = elegida[p.id];
    if (k == null || resp[p.id] || enviando[p.id]) return;
    enviando[p.id] = true;
    const ok = k === p.c;
    const reh = habil[p.id] || 0;
    resp[p.id] = { opcion: k, ok, puntos: ok ? 1 : 0, visto: LIBRE, rehab: reh, fecha: fechaLocal() };
    guardarResp();
    if (!LIBRE) {
      await II.enviar({ sesion: SID, actividad: p.id, carnet: alumno.carnet, nombre: alumno.nombre, respuesta: { opcion: k, auto: auto || undefined, rehab: reh || undefined, car: carrera() }, correcta: ok, intento: 1, puntaje: ok ? 1 : 0 });
    }
    enviando[p.id] = false;
    render(true);
  }

  // ---------------- ejercicios ----------------
  function camposHTML(its, borr, bloqueado) {
    return `<div class="fs-items">${its.map((it) => {
      const v = borr ? borr[it.id] : undefined;
      if (it.tipo === 'op') {
        return `<div class="fs-item"><span class="et">${it.et}</span><div class="fs-chips" data-op="${it.id}">${it.ops.map((o, k) => `<button type="button" class="fs-chip${v != null && Number(v) === k ? ' elegida' : ''}" data-k="${k}" ${bloqueado ? 'disabled' : ''}>${II.esc(o)}</button>`).join('')}</div></div>`;
      }
      return `<label class="fs-item"><span class="et">${it.et}${it.unidad ? ' (' + it.unidad + ')' : ''}</span><span class="fs-num"><button type="button" class="fs-signo" data-signo="${it.id}" ${bloqueado ? 'disabled' : ''}>±</button><input data-c="${it.id}" inputmode="decimal" autocomplete="off" value="${II.esc(v == null ? '' : v)}" ${bloqueado ? 'disabled' : ''}></span></label>`;
    }).join('')}</div>`;
  }

  const leerEstado = () => {
    const v = {};
    II.$$('[data-c]').forEach((inp) => { if (inp.value.trim() !== '') v[inp.dataset.c] = inp.value.trim(); });
    II.$$('[data-op]').forEach((g) => { const e = g.querySelector('.elegida'); if (e) v[g.dataset.op] = Number(e.dataset.k); });
    return v;
  };

  // ---------- «Comprobar fila» (ejercicios con `filas`) ----------
  // meta: _chk[n] = comprobaciones de la fila n · _int[id] = intento en que quedó bien · _rev[id] = valor mostrado
  let meta = { pid: '', _chk: {}, _int: {}, _rev: {} };
  const metaPara = (p) => (meta.pid === p.id ? { _chk: meta._chk, _int: meta._int, _rev: meta._rev } : {});
  const soloItems = (est) => Object.keys(est || {}).filter((k) => k[0] !== '_');

  function filasHTML(ej, its, borr) {
    let h = '';
    for (let n = 1; n <= ej.filas; n++) {
      const fi = its.filter((it) => it.fila === n);
      h += `<div class="mn-fila" data-fila="${n}">
        <div class="mn-fila-cab"><b>Fila ${n}</b><span>Xₙ = <b data-xn="${n}">${MN.d4(fi[0].xn)}</b></span></div>
        <div class="mn-celdas">${fi.map((it) => `<label class="mn-celda"><span class="et">${it.etc}</span><span class="fs-num"><button type="button" class="fs-signo" data-signo="${it.id}">±</button><input data-c="${it.id}" inputmode="decimal" autocomplete="off" value="${II.esc(borr[it.id] == null ? '' : borr[it.id])}"></span><span class="mn-marca" data-m="${it.id}"></span></label>`).join('')}</div>
        <div class="mn-fila-pie"><button type="button" class="boton" data-chk="${n}">Comprobar fila ${n}</button><span class="mn-int" data-int="${n}"></span></div>
      </div>`;
    }
    return `<div class="mn-filas">${h}</div>`;
  }

  function pintarFilas(ej, d) {
    const its = ej.items(d, leerEstado());
    let anterior = true;
    for (let n = 1; n <= ej.filas; n++) {
      const fi = its.filter((it) => it.fila === n);
      const chk = meta._chk[n] || 0;
      let completa = true;
      fi.forEach((it) => {
        const inp = $(`[data-c="${it.id}"]`), m = $(`[data-m="${it.id}"]`), sg = $(`[data-signo="${it.id}"]`);
        if (!inp) return;
        let e = '';
        if (meta._rev[it.id]) e = 'rev';
        else if (meta._int[it.id]) e = 'ok';
        else if (chk > 0) e = 'mal';
        if (e !== 'ok' && e !== 'rev') completa = false;
        inp.closest('.mn-celda').className = 'mn-celda ' + e;
        inp.disabled = sg.disabled = e === 'ok' || e === 'rev';
        m.textContent = e === 'ok' ? (Number(meta._int[it.id]) === 2 ? '✓ ½' : '✓') : e === 'rev' ? 'mostrado' : e === 'mal' ? '✗' : '';
      });
      const xn = $(`[data-xn="${n}"]`);
      if (xn) xn.textContent = MN.d4(fi[0].xn);
      const bt = $(`[data-chk="${n}"]`), tx = $(`[data-int="${n}"]`);
      if (completa) { bt.classList.add('oculto'); tx.textContent = 'Fila completa ✓'; tx.className = 'mn-int ok'; }
      else if (!anterior) { bt.classList.remove('oculto'); bt.disabled = true; tx.textContent = 'Primero termina la fila ' + (n - 1); tx.className = 'mn-int'; }
      else { bt.classList.remove('oculto'); bt.disabled = false; tx.textContent = 'Intento ' + (chk + 1) + ' de 2'; tx.className = 'mn-int'; }
      anterior = completa;
    }
  }

  function comprobarFila(p, ej, d, n, guardarBorr) {
    const est = leerEstado();
    const libres = ej.items(d, est).filter((it) => it.fila === n && !meta._int[it.id] && !meta._rev[it.id]);
    if (!libres.length) return;
    if (libres.some((it) => est[it.id] == null)) {
      const tx = $(`[data-int="${n}"]`);
      tx.textContent = 'Completa todas las celdas de la fila ' + n;
      tx.className = 'mn-int mal';
      return;
    }
    meta._chk[n] = (meta._chk[n] || 0) + 1;
    const intento = meta._chk[n];
    libres.forEach((it) => { if (FS.itemOk(it, est[it.id])) meta._int[it.id] = intento; });
    if (intento >= 2) {
      // muestra los valores que faltan, en orden (cada uno se calcula con lo ya corregido)
      libres.filter((it) => !meta._int[it.id]).forEach((it) => {
        const it2 = ej.items(d, leerEstado()).find((x) => x.id === it.id);
        const inp = $(`[data-c="${it.id}"]`);
        inp.value = MN.d4(it2.ok);
        meta._rev[it.id] = true;
      });
    }
    guardarBorr();
    pintarFilas(ej, d);
  }

  function vEjercicio(p) {
    const ej = FS.EJERCICIOS[p.ejercicio];
    const fz = faseDe(p);
    const r = resp[p.id];
    const d = datos(p);
    const cab = `<span class="etq">Etapa ${p.etapa} · Ejercicio · ${ej.puntos} puntos</span><h2>${II.esc(ej.titulo)}</h2>`;
    if (fz === 'preparado') {
      $('#cont').innerHTML = navLibre() + tarjeta(cab + mira('El docente lo habilitará en un momento.'));
      return;
    }
    const fig = ej.figura ? `<div class="fs-fig-est">${ej.figura(d)}</div>` : '';
    if (fz === 'cerrado') {
      if (r) { r.visto = true; guardarResp(); }
      const est = (r && r.estado) || {};
      const its = ej.items(d, est);
      const ev = r && !r.vacio ? FS.evaluar(p.ejercicio, d, est) : null;
      const cls = !ev ? 'duda' : ev.ok ? 'ok' : ev.puntos > 0 ? 'duda' : 'mal';
      const msg = !ev ? 'No enviaste respuesta.' : (ev.ok ? '¡Todo correcto! ' : ev.puntos > 0 ? 'Parcialmente correcto. ' : 'Incorrecto. ') + '+' + II.fmt(ev.puntos, 2) + ' pts';
      const tabla = `<table class="fs-tabla">${its.map((it) => {
        const ok = ev && ev.det[it.id];
        const rev = est._rev && est._rev[it.id];
        const marca = rev ? 'mostrado' : ok ? (est._int && Number(est._int[it.id]) === 2 ? '✓ ½' : '✓') : '✗ ' + FS.valorCorrecto(it);
        return `<tr class="${ok && !rev ? 'ok' : 'mal'}"><td>${it.et}</td><td>${II.esc(FS.mostrarValor(it, est[it.id]))}</td><td>${marca}</td></tr>`;
      }).join('')}</table>`;
      $('#cont').innerHTML = navLibre() + tarjeta(cab + `<div class="aviso ${cls}">${msg}</div>${ej.enunciado(d)}${fig}${tabla}
        <div class="solucion-est">${ej.solucion(d).map((x) => '<p>' + x + '</p>').join('')}</div>
        ${LIBRE ? '<button class="boton bloque" id="v-otra" style="margin-top:12px">Otra vez (datos nuevos)</button>' : ''}`);
      if (LIBRE) $('#v-otra').onclick = () => { semilla[p.id] = (semilla[p.id] || 0) + 1; II.guardar('fs-semilla-' + SID, semilla); delete resp[p.id]; II.guardar(kBorr(p), null); guardarResp(); render(true); };
      barra();
      return;
    }
    if (r) {
      $('#cont').innerHTML = navLibre() + tarjeta(cab + '<div class="aviso info">Enviado ✓ — tu respuesta quedó registrada.</div>' + mira('Espera la revisión en la pantalla. Si te equivocaste al enviar, avisa al docente.'));
      return;
    }
    // abierto: trabaja con sus propios datos
    const borr = II.leer(kBorr(p), null) || {};
    meta = { pid: p.id, _chk: borr._chk || {}, _int: borr._int || {}, _rev: borr._rev || {} };
    const its = ej.items(d, borr);
    const campos = ej.filas ? filasHTML(ej, its, borr) : camposHTML(its, borr, false);
    $('#cont').innerHTML = navLibre() + tarjeta(cab + avisoHabil(p) + ej.enunciado(d) + fig + (ej.formulas ? formulas(ej.formulas) : '') + campos +
      '<button class="boton prim bloque" id="b-enviar" style="margin-top:12px">Enviar mi respuesta</button>');
    const guardarBorr = () => II.guardar(kBorr(p), Object.assign(leerEstado(), metaPara(p)));
    II.$$('[data-c]').forEach((inp) => inp.addEventListener('input', () => { guardarBorr(); if (ej.filas) pintarFilas(ej, d); }));
    II.$$('[data-signo]').forEach((b) => {
      b.onclick = () => {
        const inp = $(`[data-c="${b.dataset.signo}"]`);
        if (inp.disabled) return;
        inp.value = inp.value.trim().startsWith('-') ? inp.value.trim().slice(1) : '-' + inp.value.trim();
        guardarBorr();
        if (ej.filas) pintarFilas(ej, d);
      };
    });
    II.$$('[data-op]').forEach((g) => {
      g.onclick = (e) => {
        const b = e.target.closest('[data-k]');
        if (!b) return;
        g.querySelectorAll('.fs-chip').forEach((x) => x.classList.toggle('elegida', x === b));
        guardarBorr();
      };
    });
    if (ej.filas) {
      II.$$('[data-chk]').forEach((b) => { b.onclick = () => comprobarFila(p, ej, d, Number(b.dataset.chk), guardarBorr); });
      pintarFilas(ej, d);
    }
    $('#b-enviar').onclick = async () => {
      const est = leerEstado();
      const faltan = FS.vacios(p.ejercicio, d, est);
      const texto = (faltan ? `<b>Te faltan ${faltan} de ${its.length} partes</b> sin responder. ` : '') + 'Después de enviar no podrás cambiar tu respuesta.';
      const ok = await confirmar(faltan ? '¿Enviar incompleto?' : '¿Enviar tu respuesta?', texto);
      if (ok) enviarEjercicio(p);
    };
  }

  async function enviarEjercicio(p, auto) {
    if (resp[p.id] || enviando[p.id]) return;
    const ej = FS.EJERCICIOS[p.ejercicio];
    const d = datos(p);
    const enPantalla = II.$$('[data-c],[data-op]').length > 0 && montado.startsWith(p.id + '|');
    const est = enPantalla ? Object.assign(leerEstado(), metaPara(p)) : II.leer(kBorr(p), {}) || {};
    const vacio = soloItems(est).length === 0;
    if (vacio && auto === 'avance') return;
    enviando[p.id] = true;
    const ev = FS.evaluar(p.ejercicio, d, est);
    const puntos = vacio ? 0 : ev.puntos;
    const reh = habil[p.id] || 0;
    resp[p.id] = { estado: est, ok: !vacio && ev.ok, puntos, vacio, visto: LIBRE, rehab: reh, fecha: fechaLocal() };
    guardarResp();
    if (!LIBRE) {
      await II.enviar({
        sesion: SID, actividad: p.id, carnet: alumno.carnet, nombre: alumno.nombre,
        respuesta: { estado: est, car: carrera(), auto: auto || undefined, vacio: vacio || undefined, rehab: reh || undefined },
        correcta: !vacio && ev.ok, intento: 1, puntaje: puntos
      });
    }
    enviando[p.id] = false;
    void ej;
    render(true);
  }

  function vCierre() {
    $('#cont').innerHTML = navLibre() + tarjeta(`<span class="etq">Cierre</span><h2>¡Gracias, ${II.esc((alumno.info && alumno.info.nombres || alumno.nombre).split(' ')[0])}!</h2>
      <p>Sumaste <b>${II.fmt(puntosTotales(), 1)} puntos</b> en esta clase.</p><p class="idea-est">${II.esc(S.pasos[S.pasos.length - 1].idea)}</p>
      ${LIBRE ? '' : `<p>Puedes repasar todo por tu cuenta (sin puntaje): <a href="clase.html?s=${SID}&modo=libre">modo repaso</a>.</p>`}`);
  }

  function vDia(dia) {
    let pts = 0;
    dia.acts.forEach((id) => { const r = resp[id]; if (r) { r.visto = true; pts += Number(r.puntos) || 0; } });
    guardarResp();
    const nota = dia.max ? (pts / dia.max) * 100 : 0;
    $('#cont').innerHTML = tarjeta(`<span class="etq">Clase de hoy terminada</span><h2>Tu nota de hoy</h2>
      <p class="fs-nota-dia">${II.fmt(nota, 0)}<small> / 100</small></p>
      <p>${II.fmt(pts, 1)} de ${dia.max} puntos en ${dia.acts.length} actividades.</p>
      <p class="idea-est">La próxima clase seguimos desde aquí, con otra nota sobre 100.</p>`);
  }

  // ---------------- habilitado de nuevo por el docente ----------------
  function revisarHabil(p) {
    if (LIBRE || !p || !fila) return;
    const ex = fila.extra || {};
    const n = ex.rehab && ex.rehab.act === p.id && ex.rehab.c ? Number(ex.rehab.c[alumno.carnet]) || 0 : 0;
    const r = resp[p.id];
    if (!n || !r || (r.rehab || 0) >= n || faseDe(p) !== 'abierto') return;
    habil[p.id] = n;
    if (p.tipo === 'rapida') elegida[p.id] = r.opcion;
    if (p.tipo === 'ejercicio' && r.estado) II.guardar(kBorr(p), r.estado);
    delete resp[p.id];
    guardarResp();
    montado = '';
  }

  // ---------------- envío automático (cierre o cambio de paso) ----------------
  function autoEnviar(p, motivo) {
    if (!p || resp[p.id] || LIBRE) return;
    if (p.tipo === 'rapida' && elegida[p.id] != null) enviarRapida(p, motivo);
    if (p.tipo === 'ejercicio') enviarEjercicio(p, motivo);
  }

  function vigilarCuenta(p) {
    clearInterval(cuentaT);
    const c = $('#cuenta');
    c.classList.add('oculto');
    const ex = (fila && fila.extra) || {};
    if (LIBRE || faseDe(p) !== 'cerrando' || resp[p.id]) return;
    const seg = Number(ex.seg) || 15;
    const fin = Math.min(new Date(ex.fin).getTime() || Infinity, recibido + seg * 1000);
    const tic = () => {
      const r = Math.max(0, Math.ceil((fin - Date.now()) / 1000));
      c.textContent = r > 0 ? `Se cierra en ${r} s — se enviará lo que tengas` : 'Enviando…';
      c.classList.remove('oculto');
      if (r <= 0) {
        clearInterval(cuentaT);
        const capa = document.querySelector('.capa');
        if (capa) capa.remove();
        autoEnviar(p, 'cierre');
        c.classList.add('oculto');
      }
    };
    tic();
    cuentaT = setInterval(tic, 250);
  }

  // ---------------- render ----------------
  let pasoPrevio = null;
  function render(forzar) {
    if (!alumno) return vistaIngreso();
    const p = pasoActual();
    if (pasoPrevio && pasoPrevio.id !== p.id) autoEnviar(pasoPrevio, 'avance');
    pasoPrevio = p;
    revisarHabil(p);
    const dia = diaActivo();
    if (dia) {
      if (forzar || montado !== 'dia|' + dia.fecha) { montado = 'dia|' + dia.fecha; if (diag) { diag.destruir(); diag = null; } vDia(dia); }
      clearInterval(cuentaT); $('#cuenta').classList.add('oculto');
      barra();
      return;
    }
    const fz = faseDe(p);
    const clave = p.id + '|' + (fz === 'cerrando' ? 'abierto' : fz) + '|' + (resp[p.id] ? 'r' : '');
    if (forzar || clave !== montado) {
      // si cambia la vista con un diálogo de confirmación abierto, se cierra
      const capa = document.querySelector('.capa');
      if (capa) capa.remove();
      montado = clave;
      if (diag) { diag.destruir(); diag = null; }
      if (p.tipo === 'inicio') vInicio(p);
      else if (p.tipo === 'explica') vExplica(p);
      else if (p.tipo === 'teoria') vTeoria(p);
      else if (p.tipo === 'rapida') vRapida(p);
      else if (p.tipo === 'ejercicio') vEjercicio(p);
      else vCierre(p);
      enlazarNav();
    }
    vigilarCuenta(p);
    barra();
  }

  // asistencia: si vuelve otro día con el mismo celular, se registra de nuevo
  const hoy = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  function marcarAsistencia() {
    if (LIBRE || !II.sb || !alumno || alumno.dia === hoy()) return;
    alumno.dia = hoy();
    II.guardar(K_AL, alumno);
    II.registrarIngreso(SID, alumno);
  }

  function arrancar() {
    resp = II.leer(kResp(), {});
    habil = II.leer(kHabil(), {});
    marcarAsistencia();
    barra();
    if (LIBRE) { libreIdx = Math.min(S.pasos.length - 1, II.leer('fs-libre-idx', 0) || 0); render(true); return; }
    $('#cont').innerHTML = tarjeta('<p>Conectando con la clase…</p>');
    if (!II.sb) { $('#cont').innerHTML = tarjeta('<div class="aviso mal">No se pudo conectar. Revisa tus datos móviles y recarga.</div>'); return; }
    II.seguirEstado(SID, (f) => { fila = f; recibido = Date.now(); render(false); });
  }

  II.alCambiarConexion((ok) => { const d = $('#e-con'); d.classList.toggle('on', ok); d.classList.toggle('off', !ok); });
  if (alumno) arrancar(); else { barra(); vistaIngreso(); }
})();
