// ============================================================
// Métodos Numéricos · Práctica autónoma de raíces — vista del estudiante (celular)
// Ensayo del examen: sin nota, 2 intentos por fila (en el examen, 1).
// El docente la abre y la cierra desde panel.html (estado_sesion 'mn-practica', extra.abre / extra.cierra).
// ?modo=prueba → para el docente: funciona aunque esté cerrada y no guarda nada en la base.
// ============================================================
(function () {
  const $ = II.$;
  const $$ = II.$$;
  const SID = 'mn-practica';
  const PRUEBA = II.params.get('modo') === 'prueba';
  const K_AL = PRUEBA ? 'mp-alumno-prueba' : 'mp-alumno';
  const CARRERAS = ['Ingeniería Mecatrónica', 'Ingeniería Electrónica', 'Ingeniería Eléctrica'];
  const MET = ['bis', 'fp', 'nr'];

  let alumno = II.leer(K_AL, null);
  if (PRUEBA && !alumno) {
    alumno = { nombre: 'Prueba, Docente', carnet: 'prueba' + Math.floor(Math.random() * 1e5), info: { apellidos: 'Prueba', nombres: 'Docente', carrera: CARRERAS[0] } };
    II.guardar(K_AL, alumno);
  }
  let filaSes = null;
  let leida = false;
  let estadoPrev = null;
  let E = null;

  const kE = () => 'mp-prog-' + (PRUEBA ? 'prueba-' : '') + alumno.carnet;
  const nuevoMet = (s) => ({ semilla: s || 0, der: null, filas: [], terminado: false, pts: null });
  const cargar = () => {
    E = II.leer(kE(), null) || {};
    E.red = E.red || { serie: 0, it: {} };
    E.hist = E.hist || { bis: [], fp: [], nr: [] };
    MET.forEach((m) => { E[m] = E[m] || nuevoMet(0); });
  };
  const guardar = () => II.guardar(kE(), E);
  const nombreCorto = () => ((alumno.info && alumno.info.nombres) || alumno.nombre || '').split(' ')[0];

  // cola propia de envíos: vuelve a leer la cola guardada en cada paso, así dos envíos seguidos
  // (por ejemplo, la fila 3 y el cierre del método) no se pisan
  const K_COLA = 'mp-cola';
  let vaciando = false;
  function enviar(actividad, respuesta, o = {}) {
    if (PRUEBA || !II.sb) return;
    const cola = II.leer(K_COLA, []);
    cola.push({
      sesion: SID, actividad, carnet: alumno.carnet, nombre: alumno.nombre,
      respuesta: { ...respuesta, car: (alumno.info && alumno.info.carrera) || '' },
      correcta: !!o.correcta, intento: Math.min(5, Math.max(1, o.intento || 1)),
      puntaje: Math.min(100, Math.max(0, Number(o.puntaje) || 0))
    });
    II.guardar(K_COLA, cola);
    vaciar();
  }
  async function vaciar() {
    if (vaciando || !II.sb) return;
    vaciando = true;
    try {
      for (;;) {
        const cola = II.leer(K_COLA, []);
        if (!cola.length) break;
        const { error } = await II.sb.from('respuestas').insert(cola[0]);
        if (error) {
          const cerrada = error.code === '42501' || /row-level security/i.test(error.message || '');
          if (!cerrada) { II.marcarConexion(false); break; }
          // la práctica ya estaba cerrada: se descarta (queda una copia local)
          const r = II.leer('mp-cola-rechazadas', []);
          r.push(cola[0]);
          II.guardar('mp-cola-rechazadas', r.slice(-50));
        }
        II.marcarConexion(true);
        const resto = II.leer(K_COLA, []);
        resto.shift();
        II.guardar(K_COLA, resto);
      }
    } catch (e) {
      II.marcarConexion(false);
    } finally {
      vaciando = false;
    }
  }
  setInterval(vaciar, 5000);

  // ---------------- estado de la práctica (abierta / cerrada) ----------------
  function estado() {
    if (PRUEBA) return 'abierta';
    if (!II.sb) return 'sin-red';
    if (!leida) return 'cargando';
    const ex = (filaSes && filaSes.extra) || {};
    if (!ex.abre) return 'no-abierta';
    const t = Date.now();
    if (t < new Date(ex.abre).getTime() - 60000) return 'no-abierta';
    if (ex.cierra && t > new Date(ex.cierra).getTime()) return 'cerrada';
    return 'abierta';
  }
  async function leerEstado() {
    if (PRUEBA || !II.sb) return;
    try {
      const { data, error } = await II.sb.from('estado_sesion').select('*').eq('sesion', SID).maybeSingle();
      if (error) throw error;
      II.marcarConexion(true);
      filaSes = data;
      leida = true;
    } catch (e) {
      II.marcarConexion(false);
    }
    const est = estado();
    if (est !== estadoPrev) { estadoPrev = est; render(); }
  }

  // ---------------- piezas ----------------
  const tarjeta = (html, cls = '') => `<div class="tarjeta ${cls}">${html}</div>`;
  const volver = () => '<button class="mp-volver" data-ir="">← Inicio</button>';
  const neg = (s) => String(s).replace(/^-/, '−');
  const fmt = (x) => neg(MP.d4(x));
  const ptsTxt = (x) => II.fmt(x, 2);

  function confirmar(titulo, texto, si = 'Sí', no = 'Cancelar') {
    return new Promise((res) => {
      const capa = II.html(`<div class="capa"><div class="dialogo"><h2>${titulo}</h2><p>${texto}</p>
        <div class="fila-bt"><button class="boton" data-r="0">${no}</button><button class="boton prim" data-r="1">${si}</button></div></div></div>`);
      document.body.appendChild(capa);
      capa.onclick = (e) => {
        const b = e.target.closest('[data-r]');
        if (!b && e.target !== capa) return;
        capa.remove();
        res(!!(b && b.dataset.r === '1'));
      };
    });
  }

  function barra() {
    $('#e-nombre').textContent = !alumno ? 'Práctica · Raíces' : (PRUEBA ? 'Modo prueba · ' : '') + alumno.nombre;
  }

  // ---------------- registro ----------------
  function vRegistro() {
    $('#cont').innerHTML = tarjeta(`<span class="etq">Métodos Numéricos · Práctica</span>
      <h2>Ensayo del examen: raíces</h2>
      <p>Entra con tus datos. Tendrás <b>tus propias funciones</b> y podrás repetir con datos nuevos.</p>
      <form id="f-ingreso">
        <label class="campo"><span>Apellidos</span><input name="apellidos" required minlength="2" maxlength="38" autocomplete="family-name"></label>
        <label class="campo"><span>Nombres</span><input name="nombres" required minlength="2" maxlength="38" autocomplete="given-name"></label>
        <label class="campo"><span>Número de carnet de identidad (C.I.)</span><input name="ci" required minlength="4" maxlength="15" autocomplete="off"></label>
        <label class="campo"><span>Carnet universitario (C.U.)</span><input name="cu" required minlength="3" maxlength="20" inputmode="numeric" autocomplete="off"></label>
        <label class="campo"><span>Carrera</span><select name="carrera" required><option value="" disabled selected>Elige tu carrera</option>${CARRERAS.map((c) => `<option>${c}</option>`).join('')}</select></label>
        <div class="aviso mal oculto" id="f-error"></div>
        <button class="boton prim bloque">Entrar a la práctica</button>
      </form>`);
    $('#f-ingreso').onsubmit = async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const limpio = (k) => String(fd.get(k) || '').trim().replace(/\s+/g, ' ');
      const info = { apellidos: limpio('apellidos'), nombres: limpio('nombres'), ci: limpio('ci'), carrera: String(fd.get('carrera') || '') };
      const cu = limpio('cu').replace(/\s+/g, '');
      if (!CARRERAS.includes(info.carrera)) { const e = $('#f-error'); e.textContent = 'Elige tu carrera.'; e.classList.remove('oculto'); return; }
      alumno = { nombre: info.apellidos + ', ' + info.nombres, carnet: cu, info, dia: hoy() };
      ev.target.querySelector('button').disabled = true;
      if (II.sb) await II.registrarIngreso(SID, alumno);
      II.guardar(K_AL, alumno);
      cargar();
      render();
    };
  }
  const hoy = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  function marcarAsistencia() {
    if (PRUEBA || !II.sb || !alumno || alumno.dia === hoy()) return;
    alumno.dia = hoy();
    II.guardar(K_AL, alumno);
    II.registrarIngreso(SID, alumno);
  }

  // ---------------- espera / cerrada ----------------
  function vEspera(est) {
    const t = {
      'cargando': ['Conectando…', 'Un momento.'],
      'sin-red': ['Sin conexión', 'No se pudo conectar. Revisa tus datos móviles y recarga la página.'],
      'no-abierta': ['La práctica aún no está abierta', 'El docente la abrirá pronto. Esta página se actualiza sola.'],
      'cerrada': ['La práctica está cerrada', 'El docente cerró la práctica. Tu avance quedó guardado en este celular. ¡Éxitos en el examen!']
    }[est];
    $('#cont').innerHTML = tarjeta(`<span class="etq">Métodos Numéricos · Práctica</span><h2>${t[0]}</h2><p>${t[1]}</p>
      ${est === 'no-abierta' || est === 'sin-red' ? '<button class="boton bloque" id="b-act">Actualizar</button>' : ''}`);
    const b = $('#b-act');
    if (b) b.onclick = () => (II.sb ? leerEstado() : location.reload());
  }

  // ---------------- inicio ----------------
  function estadoMet(m) {
    const em = E[m];
    const last = E.hist[m].length ? E.hist[m][E.hist[m].length - 1] : null;
    if (em.terminado) return { hecho: true, txt: `Terminado · ${ptsTxt(em.pts)} de ${MP.METODOS[m].max} (como examen)` };
    const k = em.filas.filter((f) => f && f.lista).length;
    if (m === 'nr' && em.der && !k) return { txt: 'Derivada lista · sigue con la tabla' };
    if (k || (em.filas[0] && em.filas[0].chk)) return { txt: `Vas en la fila ${Math.min(3, k + 1)} de 3` };
    if (last) return { txt: `Función nueva · la anterior: ${ptsTxt(last.pts)} de ${MP.METODOS[m].max}` };
    return { txt: 'Sin empezar' };
  }
  function vInicio() {
    const its = MP.redondeo(alumno.carnet, E.red.serie);
    const bienRed = its.filter((q) => E.red.it[q.id] && E.red.it[q.id].ok).length;
    const item = (ir, num, titulo, sub, hecho) => `<button class="mp-item ${hecho ? 'hecho' : ''}" data-ir="${ir}">
      <span class="num">${num}</span><span class="txt"><b>${titulo}</b><small>${sub}</small></span><span class="flecha">›</span></button>`;
    $('#cont').innerHTML = tarjeta(`<span class="etq">Práctica · ensayo del examen</span>
        <h2>Hola, ${II.esc(nombreCorto())}</h2>
        <p>Practica los tres métodos con el mismo formato del examen: <b>3 iteraciones</b>, <b>4 decimales</b> y calculadora simple en <b>RAD</b>.</p>
        <div class="aviso info">Esta práctica <b>no tiene nota</b>. Aquí tienes <b>2 intentos</b> por fila; <b>en el examen tendrás un solo intento</b>.</div>
        ${PRUEBA ? '<div class="aviso duda">Modo prueba: no se guarda nada en la base de datos.</div>' : ''}
        <p class="mp-nota">Empieza por la regla de redondeo. En cada método: repasa la idea, llena la tabla fila por fila y toca <b>Comprobar</b>. Con <b>Otra función</b> repites con datos nuevos.</p>`) +
      `<div class="mp-menu">
        ${item('red', '1', 'Regla de redondeo', `${bienRed} de ${its.length} ejercicios bien`, bienRed === its.length)}
        ${MET.map((m, i) => { const s = estadoMet(m); return item(m, String(i + 2), MP.METODOS[m].titulo, s.txt, s.hecho); }).join('')}
        ${item('res', '✓', 'Mi resultado', 'Como si fuera el examen (sobre 100)', MET.every((m) => E.hist[m].length))}
      </div>`;
  }

  // ---------------- regla de redondeo ----------------
  const REGLA = `<details class="tarjeta mp-repaso" open><summary>La regla de redondeo</summary>
    <ol>
      <li><b>4 decimales, al más cercano.</b> Mira la <b>5.ª cifra decimal</b>: si es 5 o más, la 4.ª sube en 1; si es menor que 5, se queda igual. Con los negativos se redondea igual, sin mirar el signo.</li>
      <li><b>Solo se redondea lo que anotas en la tabla</b> (Xr, f(Xr), f'(Xₙ), Xₙ₊₁, error %). Dentro de una fórmula no se redondea: calcula todo seguido y redondea el resultado.</li>
      <li><b>Sigue con el valor anotado.</b> La fila siguiente usa el número redondeado de la tabla, no el que guarda la calculadora (Ans).</li>
    </ol>
    <table class="mp-ej"><tr><td>f(1) = e¹ + 1 − 3</td><td>0,718281…</td><td>0,7183</td></tr>
      <tr><td>Xr de la fila</td><td>0,735753…</td><td>0,7358</td></tr>
      <tr><td>f(0,7358)</td><td>−0,464274…</td><td>−0,4643</td></tr></table>
    <p class="mp-nota">Puedes escribir con <b>coma o punto</b>: 0,7358 o 0.7358. Una casilla está bien si coincide en los 4 decimales con lo que sale de <b>tus propios números</b>. Si solo falla el último decimal, verás «Casi: revisa el redondeo» (en el examen vale la mitad).</p>
  </details>`;

  function numInput(id, v, dis) {
    return `<span class="mp-num"><button type="button" class="mp-signo" data-signo="${id}" ${dis ? 'disabled' : ''} aria-label="Cambiar signo">±</button><input data-c="${id}" inputmode="decimal" autocomplete="off" value="${II.esc(v == null ? '' : v)}" ${dis ? 'disabled' : ''}></span>`;
  }
  function enlazarSignos(guardarCambio) {
    $$('[data-signo]').forEach((b) => {
      b.onclick = () => {
        const inp = $(`[data-c="${b.dataset.signo}"]`);
        if (!inp || inp.disabled) return;
        const t = inp.value.trim().replace(/^[−–]/, '-');
        inp.value = t.startsWith('-') ? t.slice(1) : '-' + t;
        guardarCambio(inp);
      };
    });
  }

  function vRedondeo() {
    const its = MP.redondeo(alumno.carnet, E.red.serie);
    const bien = its.filter((q) => E.red.it[q.id] && E.red.it[q.id].ok).length;
    const qs = its.map((q, i) => {
      const st = E.red.it[q.id] || {};
      const cab = `<h3><span class="n">${i + 1}.</span>${q.t}</h3>`;
      let cuerpo = '';
      if (q.tipo === 'num') {
        cuerpo = `<div class="fila-r">${numInput('r-' + q.id, st.v, st.fin)}${st.fin ? '' : `<button class="boton prim" data-rq="${q.id}">Comprobar</button>`}</div>`;
      } else {
        cuerpo = `<div class="ops">${q.orden.map((k) => {
          let cls = '';
          if (st.fin) cls = k === q.c ? 'ok' : st.op === k ? 'mal' : '';
          return `<button class="mp-op ${cls}" data-rop="${q.id}" data-k="${k}" ${st.fin ? 'disabled' : ''}>${II.esc(q.o[k])}</button>`;
        }).join('')}</div>`;
      }
      let pie = '';
      if (st.fin) pie = `<div class="aviso ${st.ok ? 'ok' : 'mal'}">${st.ok ? '¡Correcto!' : q.tipo === 'num' ? 'Respuesta: <span class="mono">' + fmt(q.exp) + '</span>' : 'No era esa: mira la correcta en verde.'}</div><p class="expl">${q.por}</p>`;
      else if (st.msg) pie = `<div class="aviso duda">${st.msg}</div>`;
      return `<div class="mp-q ${st.fin && st.ok ? 'ok' : ''}" id="q-${q.id}">${cab}${cuerpo}${pie}</div>`;
    }).join('');
    $('#cont').innerHTML = volver() + REGLA + tarjeta(`<span class="etq">Ejercicios</span><h2>Practica el redondeo</h2>
        <div class="mp-barra-prog"><span style="width:${(bien / its.length) * 100}%"></span></div><p class="mp-nota">${bien} de ${its.length} bien. En los numéricos tienes 2 intentos.</p>`) +
      qs + `<div class="mp-botones"><button class="boton bloque" id="b-otra-red">Otra serie de ejercicios</button><button class="boton prim bloque" data-ir="bis">Seguir con Bisección →</button></div>`;
    const guardarCambio = (inp) => { const id = inp.dataset.c.slice(2); E.red.it[id] = { ...(E.red.it[id] || {}), v: inp.value }; guardar(); };
    $$('[data-c]').forEach((inp) => inp.addEventListener('input', () => guardarCambio(inp)));
    enlazarSignos(guardarCambio);
    $$('[data-rq]').forEach((b) => {
      b.onclick = () => {
        const q = its.find((x) => x.id === b.dataset.rq);
        const st = (E.red.it[q.id] = E.red.it[q.id] || {});
        st.v = $(`[data-c="r-${q.id}"]`).value;
        const p = MP.leer(st.v);
        if (p.vacio) { st.msg = 'Escribe tu respuesta.'; guardar(); return vRedondeo(); }
        if (p.sep || p.invalido) { st.msg = 'Escribe solo un número, con un solo separador decimal (coma o punto).'; guardar(); return vRedondeo(); }
        const igual = Math.round(p.v * 1e4) === Math.round(q.exp * 1e4) && p.dec <= 4;
        if (igual && p.dec < 4) { st.msg = 'El valor es correcto, pero escribe los 4 decimales (también los ceros).'; guardar(); return vRedondeo(); }
        st.int = (st.int || 0) + 1;
        st.ok = igual;
        if (igual || st.int >= 2) { st.fin = true; st.msg = null; }
        else st.msg = q.id === 'p1'
          ? 'No es ese. Usa el Xr de la tabla tal como está, calcula todo seguido y redondea solo el resultado.'
          : 'No es ese. Mira solo la 5.ª cifra decimal: si es 5 o más, la 4.ª sube en 1; si es menor, se queda igual.';
        enviar('red', { serie: E.red.serie, id: q.id, v: st.v, ok: igual, int: st.int }, { correcta: igual, intento: st.int });
        guardar();
        vRedondeo();
        const el = $('#q-' + q.id);
        if (el) el.scrollIntoView({ block: 'center' });
      };
    });
    $$('[data-rop]').forEach((b) => {
      b.onclick = () => {
        const q = its.find((x) => x.id === b.dataset.rop);
        const k = Number(b.dataset.k);
        const ok = k === q.c;
        E.red.it[q.id] = { op: k, ok, fin: true, int: 1 };
        enviar('red', { serie: E.red.serie, id: q.id, v: q.o[k], ok, int: 1 }, { correcta: ok, intento: 1 });
        guardar();
        vRedondeo();
        const el = $('#q-' + q.id);
        if (el) el.scrollIntoView({ block: 'center' });
      };
    });
    $('#b-otra-red').onclick = () => { E.red = { serie: (E.red.serie || 0) + 1, it: {} }; guardar(); vRedondeo(); window.scrollTo(0, 0); };
  }

  // ---------------- repaso de cada método ----------------
  const REPASO = {
    bis: `<details class="tarjeta mp-repaso" open><summary>Repasa: método de bisección</summary>
      <p><b>Idea.</b> Si f(Xa) y f(Xb) tienen signos distintos, la curva cruza el eje entre ellos: ahí hay una raíz. Bisección parte el intervalo por la mitad y se queda con la mitad donde sigue el cambio de signo.</p>
      <div class="mp-form"><div>Xr = (Xa + Xb) / 2</div>
        <div>f(Xa)·f(Xr) &lt; 0 → Xr reemplazará a Xb</div><div class="c">(la raíz está entre Xa y Xr)</div>
        <div>f(Xa)·f(Xr) &gt; 0 → Xr reemplazará a Xa</div><div class="c">(la raíz está entre Xr y Xb)</div>
        <div>Error % = |Xr − Xr anterior| / |Xr| × 100</div><div class="c">En la fila 1 no hay error: se anota ---</div></div>
      <p><b>En cada fila:</b> 1) Xa, Xb y sus f · 2) Xr · 3) f(Xr) · 4) error % · 5) ¿Xr reemplazará a Xa o a Xb?</p>
      <p class="mp-nota"><b>Ojo:</b> en la fila siguiente, el extremo que cambia toma el valor de Xr y su f es el f(Xr) que ya calculaste: no hace falta volver a calcularla. El otro extremo y su f se copian igual.</p></details>`,
    fp: `<details class="tarjeta mp-repaso" open><summary>Repasa: método de falsa posición</summary>
      <p><b>Idea.</b> Igual que bisección, pero Xr no es el punto medio: se unen (Xa, f(Xa)) y (Xb, f(Xb)) con una recta, y Xr es donde esa recta corta el eje x. Por eso suele acercarse más rápido.</p>
      <div class="mp-form"><div>Xr = Xb − f(Xb)·(Xa − Xb) / (f(Xa) − f(Xb))</div>
        <div>f(Xa)·f(Xr) &lt; 0 → Xr reemplazará a Xb</div>
        <div>f(Xa)·f(Xr) &gt; 0 → Xr reemplazará a Xa</div>
        <div>Error % = |Xr − Xr anterior| / |Xr| × 100</div><div class="c">En la fila 1 no hay error: se anota ---</div></div>
      <p><b>En cada fila:</b> 1) Xa, Xb y sus f · 2) Xr con la fórmula (usa f(Xa) y f(Xb) de la tabla, ya redondeados) · 3) f(Xr) · 4) error % · 5) ¿qué extremo reemplazará Xr?</p>
      <p class="mp-nota"><b>Es normal</b> que uno de los extremos se quede fijo en todas las filas: la recta corta siempre del mismo lado de la raíz.</p></details>`,
    nr: `<details class="tarjeta mp-repaso" open><summary>Repasa: método de Newton-Raphson</summary>
      <p><b>Idea.</b> Desde Xₙ se traza la recta tangente a la curva; Xₙ₊₁ es donde esa tangente corta el eje x. No necesita intervalo, pero sí la derivada f'(x).</p>
      <div class="mp-form"><div>Xₙ₊₁ = Xₙ − f(Xₙ) / f'(Xₙ)</div>
        <div>Error % = |Xₙ₊₁ − Xₙ| / |Xₙ₊₁| × 100</div>
        <div class="c">El Xₙ de la fila siguiente es el Xₙ₊₁ de esta fila.</div></div>
      <div class="mp-form"><div class="c">Derivadas que vas a usar:</div><div>(xⁿ)' = n·xⁿ⁻¹ · (eˣ)' = eˣ</div><div>(sen x)' = cos x · (cos x)' = −sen x</div><div>(constante)' = 0</div></div>
      <p><b>En cada fila:</b> 1) Xₙ · 2) f(Xₙ) · 3) f'(Xₙ) · 4) Xₙ₊₁ · 5) error %. Calculadora en <b>RAD</b>.</p></details>`
  };

  // ---------------- gráfica liviana ----------------
  function grafica(d) {
    const W = 640, H = 300, mL = 40, mR = 16, mT = 16, mB = 40;
    let x0, x1;
    if (d.met === 'nr') {
      const T = MP.tablaReferencia(d);
      const raiz = T[T.length - 1].x1;
      x0 = Math.max(0, Math.min(d.x0, raiz) - 0.5);
      x1 = Math.max(d.x0, raiz) + 0.5;
    } else {
      const m = (d.b - d.a) * 0.06;
      x0 = d.a - m; x1 = d.b + m;
      if (d.fam === 'B1') x0 = Math.max(0.05, x0);
    }
    const N = 140, xs = [], ys = [];
    for (let i = 0; i <= N; i++) { const x = x0 + ((x1 - x0) * i) / N; xs.push(x); ys.push(d.f(x)); }
    let y0 = Math.min(0, ...ys), y1 = Math.max(0, ...ys);
    const pad = (y1 - y0) * 0.1 || 1; y0 -= pad; y1 += pad;
    const X = (x) => mL + ((x - x0) / (x1 - x0)) * (W - mL - mR);
    const Y = (y) => mT + ((y1 - y) / (y1 - y0)) * (H - mT - mB);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica de f(x)"><rect width="${W}" height="${H}" fill="#fff"/>`;
    s += `<line x1="${mL}" y1="${Y(0)}" x2="${W - mR}" y2="${Y(0)}" stroke="#334155" stroke-width="2"/>`;
    const marcas = [];
    for (let m = Math.ceil(x0 * 2) / 2; m <= x1 + 1e-9; m += 0.5) marcas.push(Math.round(m * 10) / 10);
    marcas.forEach((m) => { s += `<line x1="${X(m)}" y1="${Y(0) - 5}" x2="${X(m)}" y2="${Y(0) + 5}" stroke="#334155" stroke-width="2"/><text x="${X(m)}" y="${H - 12}" font-size="20" text-anchor="middle" fill="#465366">${String(m).replace('.', ',')}</text>`; });
    s += `<polyline fill="none" stroke="#1d5fb4" stroke-width="4.5" stroke-linejoin="round" points="${xs.map((x, i) => X(x).toFixed(1) + ',' + Y(ys[i]).toFixed(1)).join(' ')}"/>`;
    const punto = (x, et, col) => { const y = d.f(x); s += `<line x1="${X(x)}" y1="${Y(0)}" x2="${X(x)}" y2="${Y(y)}" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4 5"/><circle cx="${X(x)}" cy="${Y(y)}" r="8" fill="${col}"/><text x="${X(x)}" y="${Y(y) + (y < 0 ? 30 : -14)}" font-size="22" font-weight="700" text-anchor="middle" fill="${col}">${et}</text>`; };
    if (d.met === 'nr') punto(d.x0, 'x₀', '#c2410c');
    else { punto(d.a, 'Xa', '#c2410c'); punto(d.b, 'Xb', '#c2410c'); }
    return s + '</svg>';
  }

  // ---------------- un método ----------------
  const MARCA = { ok1: '✓', ok2: '✓ 2.º intento', rev: 'mostrado', aj: 'ajustado', mal: '✗', red: '≈ redondeo', dep: '✓ con tus números' };
  const claseCelda = (st) => (st.fin ? st.fin : st.ult === 'ok' && st.depMal ? 'dep' : st.ult || '');

  function filaHTML(m, d, n, prev, fila) {
    const C = MP.celdas(d, n, prev);
    const cel = fila.cel || {};
    let celdas = '';
    let dec = '';
    const ayudas = [];
    const vistas = new Set();
    const dependen = [];
    C.forEach((c) => {
      if (c.tipo === 'fijo') {
        celdas += `<div class="mp-celda"><span class="et">${c.et}</span><div class="mp-fijo">${c.val === '---' ? '---' : fmt(c.val)}</div><span class="mp-marca" style="color:var(--texto-3)">${c.val === '---' ? 'fila 1' : 'dato'}</span></div>`;
        return;
      }
      const st = cel[c.id] || {};
      const cls = claseCelda(st);
      if (c.tipo === 'dec') {
        const v = fila.vals[c.id];
        const op = (k, t) => {
          let k2 = v === k ? 'elegida' : '';
          if (st.fin) k2 = v === k ? 'ok' : '';
          else if (st.ult === 'mal' && v === k) k2 = 'mal';
          return `<button type="button" class="mp-op ${k2}" data-dec="${n}" data-k="${k}" ${st.fin ? 'disabled' : ''}>${t}</button>`;
        };
        dec = `<div class="mp-dec ${cls}"><p>Responde: en la siguiente fila, ¿Xr reemplazará a Xa o reemplazará a Xb?</p>
          <div class="ops">${op('a', 'Xr reemplazará a Xa')}${op('b', 'Xr reemplazará a Xb')}</div>
          <span class="mp-marca">${st.fin === 'rev' ? 'mostrado: es la respuesta correcta' : MARCA[cls] || ''}</span></div>`;
      } else {
        celdas += `<label class="mp-celda ${cls}" data-celda="${c.id}"><span class="et">${c.et}</span>${numInput(n + '-' + c.id, fila.vals[c.id], !!st.fin)}<span class="mp-marca">${MARCA[cls] || ''}</span></label>`;
      }
      if (!st.fin && (st.ult === 'mal' || st.ult === 'red')) {
        let pista = '';
        if (st.pista && !vistas.has(st.pista)) {
          vistas.add(st.pista);
          pista = c.copia ? II.esc(st.pista) : `<span class="fx">${II.esc(st.pista)}</span>`;
        }
        const msg = st.msg ? II.esc(st.msg) + ' ' : st.ult === 'mal' && !pista ? 'Revisa este valor. ' : '';
        ayudas.push(`<p><b>${c.tipo === 'dec' ? 'Extremo' : c.et}:</b> ${msg}${pista}</p>`);
      } else if (!st.fin && st.depMal) {
        dependen.push(c.tipo === 'dec' ? 'la pregunta del extremo' : c.et);
      }
    });
    if (dependen.length) {
      const lista = dependen.length === 1 ? dependen[0] : dependen.slice(0, -1).join(', ') + ' y ' + dependen[dependen.length - 1];
      ayudas.push(`<p><b>${lista}:</b> ${dependen.length === 1 ? 'está bien' : 'están bien'} con tus números, pero ${dependen.length === 1 ? 'usa' : 'usan'} un valor con error. Después de corregirlo, revisa si cambia${dependen.length === 1 ? '' : 'n'}.</p>`);
    }
    const chk = fila.chk || 0;
    const pie = fila.lista
      ? '<div class="mp-pie"><span class="mp-int ok">Fila completa ✓</span></div>'
      : `<div class="mp-pie"><button class="boton prim" data-chk="${n}">Comprobar fila ${n}</button><span class="mp-int">Intento ${chk + 1} de 2</span><span class="mp-examen">En el examen: 1 solo intento</span></div><div class="mp-int mal" id="aviso-${n}"></div>`;
    const ayuda = ayudas.length && !fila.lista ? `<div class="mp-ayuda"><p><b>Ayuda para el intento 2</b></p>${ayudas.join('')}</div>` : '';
    return `<div class="mp-fila ${fila.lista ? 'lista' : ''}" id="fila-${n}"><div class="mp-fila-cab"><h3>Fila ${n}</h3><span>n = ${n}</span></div>
      <div class="mp-celdas">${celdas}${dec}</div>${ayuda}${pie}</div>`;
  }

  function tablaFinal(m, em) {
    const F = em.filas.map((f) => f.final);
    if (m === 'nr') {
      return `<div class="mp-tabla-scroll"><table class="mp-tabla"><tr><th>n</th><th>Xₙ</th><th>f(Xₙ)</th><th>f'(Xₙ)</th><th>Xₙ₊₁</th><th>Error %</th></tr>
        ${F.map((t, i) => `<tr><td>${i + 1}</td><td>${fmt(t.xn)}</td><td>${fmt(t.fx)}</td><td>${fmt(t.dfx)}</td><td>${fmt(t.x1)}</td><td>${fmt(t.er)}</td></tr>`).join('')}</table></div>`;
    }
    return `<div class="mp-tabla-scroll"><table class="mp-tabla"><tr><th>n</th><th>Xa</th><th>Xb</th><th>f(Xa)</th><th>f(Xb)</th><th>Xr</th><th>f(Xr)</th><th>Error %</th><th>Xr reemplaza a</th></tr>
      ${F.map((t, i) => `<tr><td>${i + 1}</td><td>${fmt(t.xa)}</td><td>${fmt(t.xb)}</td><td>${fmt(t.fa)}</td><td>${fmt(t.fb)}</td><td>${fmt(t.xr)}</td><td>${fmt(t.fr)}</td><td>${t.er === '---' ? '---' : fmt(t.er)}</td><td>${t.dec ? (t.dec === 'a' ? 'Xa' : 'Xb') : '—'}</td></tr>`).join('')}</table></div>`;
  }

  function vMetodo(m) {
    const em = E[m];
    const d = MP.datos(m, alumno.carnet, em.semilla);
    const max = MP.METODOS[m].max;
    const ini = m === 'nr' ? `<span class="mp-chip">x₀ = ${fmt(d.x0)}</span>` : `<span class="mp-chip">Xa = ${fmt(d.a)}</span><span class="mp-chip">Xb = ${fmt(d.b)}</span>`;
    let html = volver() + REPASO[m] + tarjeta(`<span class="etq">${MP.METODOS[m].titulo} · tu función</span>
      <div class="mp-func">${d.txt}</div>
      <div class="mp-chips">${ini}<span class="mp-chip">3 iteraciones</span><span class="mp-chip">4 decimales</span>${d.rad ? '<span class="mp-chip rad">Calculadora en RAD</span>' : ''}</div>
      <div class="mp-graf">${grafica(d)}</div>
      ${em.terminado ? '' : '<button class="boton bloque" id="b-otra" style="margin-top:10px">Otra función (datos nuevos)</button>'}`);

    let listo = true;
    if (m === 'nr') {
      if (!em.der) {
        listo = false;
        html += tarjeta(`<span class="etq">Antes de la tabla</span><h2>¿Cuál es f'(x)?</h2><p>Deriva tu función en el cuaderno y elige. Se revisa al momento.</p>
          <div class="mp-der">${d.derOps.map((o, k) => `<button class="mp-op" data-der="${k}">f'(x) = ${II.esc(o.t)}</button>`).join('')}</div>`);
      } else {
        html += tarjeta(`<span class="etq">La derivada</span>
          <div class="aviso ${em.der.ok ? 'ok' : 'mal'}">${em.der.ok ? '¡Correcto!' : 'No era esa. Elegiste: f\'(x) = ' + II.esc(em.der.t)}</div>
          <p>Continúa con <b class="mono">f'(x) = ${II.esc(d.derCorrecta)}</b></p><p class="mp-nota">${d.porDer}</p>`);
      }
    }
    if (listo) {
      let prev = null;
      for (let n = 1; n <= MP.FILAS; n++) {
        const abierta = n === 1 || (em.filas[n - 2] && em.filas[n - 2].lista);
        if (!abierta) {
          html += `<div class="mp-fila bloq"><div class="mp-fila-cab"><h3>Fila ${n}</h3><span>se abre al terminar la fila ${n - 1}</span></div></div>`;
          continue;
        }
        em.filas[n - 1] = em.filas[n - 1] || { vals: {}, cel: {}, chk: 0 };
        html += filaHTML(m, d, n, prev, em.filas[n - 1]);
        prev = em.filas[n - 1].final || null;
      }
    }
    if (em.terminado) {
      const sig = { bis: ['fp', 'Seguir con Falsa posición →'], fp: ['nr', 'Seguir con Newton-Raphson →'], nr: ['res', 'Ver mi resultado →'] }[m];
      html += tarjeta(`<span class="etq">Terminaste ${MP.METODOS[m].titulo.toLowerCase()}</span>
        <div class="mp-res"><p class="mp-nota" style="margin:0">Si esto fuera el examen</p><div class="grande">${ptsTxt(em.pts)}<small> / ${max}</small></div>
        <p class="mp-nota">Cuenta solo tu primer intento de cada casilla: ✓ vale completo, «casi» por redondeo vale la mitad y ✗ vale 0.</p></div>
        ${tablaFinal(m, em)}
        <div class="mp-botones"><button class="boton prim bloque" data-ir="${sig[0]}">${sig[1]}</button>
          <button class="boton bloque" id="b-otra2">Repetir con otra función</button></div>`);
    }
    $('#cont').innerHTML = html;
    guardar();
    enlazarMetodo(m, d);
  }

  function enlazarMetodo(m, d) {
    const em = E[m];
    // escribir: se guarda al momento
    const guardarCambio = (inp) => {
      const [n, id] = inp.dataset.c.split('-');
      const fila = em.filas[Number(n) - 1];
      if (!fila) return;
      fila.vals[id] = inp.value;
      const lab = inp.closest('.mp-celda');
      if (lab) lab.classList.remove('falta');
      guardar();
    };
    $$('.mp-fila [data-c]').forEach((inp) => inp.addEventListener('input', () => guardarCambio(inp)));
    enlazarSignos(guardarCambio);
    $$('[data-dec]').forEach((b) => {
      b.onclick = () => {
        const n = Number(b.dataset.dec);
        const fila = em.filas[n - 1];
        fila.vals.dec = b.dataset.k;
        guardar();
        $$(`[data-dec="${n}"]`).forEach((x) => { x.classList.toggle('elegida', x === b); x.classList.remove('mal'); });
      };
    });
    $$('[data-chk]').forEach((b) => { b.onclick = () => comprobar(m, d, Number(b.dataset.chk)); });
    $$('[data-der]').forEach((b) => {
      b.onclick = () => {
        const o = d.derOps[Number(b.dataset.der)];
        em.der = { t: o.t, ok: o.ok };
        enviar('nr', { s: em.semilla, fun: d.txt, fila: 0, der: o.t, ok: o.ok }, { correcta: o.ok });
        guardar();
        vMetodo(m);
      };
    });
    const otra = async () => {
      const enCurso = !em.terminado && (em.der || em.filas.some((f) => f && (f.chk || Object.keys(f.vals || {}).length)));
      if (enCurso && !(await confirmar('¿Otra función?', 'Empezarás de nuevo este método con datos nuevos. Lo que llevas de esta función se pierde.', 'Sí, otra función'))) return;
      E[m] = nuevoMet((em.semilla || 0) + 1);
      guardar();
      vMetodo(m);
      window.scrollTo(0, 0);
    };
    const bo = $('#b-otra');
    if (bo) bo.onclick = otra;
    const bo2 = $('#b-otra2');
    if (bo2) bo2.onclick = otra;
  }

  function comprobar(m, d, n) {
    const em = E[m];
    const fila = em.filas[n - 1];
    const prev = n > 1 ? em.filas[n - 2].final : null;
    // toma lo que está en pantalla
    $$(`#fila-${n} [data-c]`).forEach((inp) => { if (!inp.disabled) fila.vals[inp.dataset.c.split('-')[1]] = inp.value; });
    const res = MP.comprobar(d, n, prev, fila);
    const aviso = $('#aviso-' + n);
    const marcar = (id) => { const el = $(`#fila-${n} [data-celda="${id}"]`); if (el) { el.classList.add('falta'); const i = el.querySelector('input'); if (i) i.focus(); } };
    const nombre = (id) => { const c = MP.celdas(d, n, prev).find((x) => x.id === id); return c ? c.et : id; };
    if (res.falta) { aviso.textContent = res.falta === 'dec' ? 'Responde la pregunta: ¿Xr reemplazará a Xa o a Xb?' : `Completa todas las casillas de la fila (falta ${nombre(res.falta)}).`; marcar(res.falta); return; }
    if (res.sep) { aviso.textContent = `En ${nombre(res.sep)} usa un solo separador decimal (coma o punto).`; marcar(res.sep); return; }
    if (res.invalido) { aviso.textContent = `En ${nombre(res.invalido)} escribe solo un número.`; marcar(res.invalido); return; }
    const compacto = {};
    Object.keys(fila.cel).forEach((id) => { const st = fila.cel[id]; compacto[id] = [st.r1, st.fin || (st.depMal ? 'dep' : st.ult)]; });
    em.pts = MP.puntaje(m, em, alumno.carnet);
    enviar(m, { s: em.semilla, fun: d.txt, fila: n, chk: fila.chk, vals: fila.vals, cel: compacto, lista: !!fila.lista, pts: em.pts, max: MP.METODOS[m].max },
      { correcta: !!fila.lista && Object.values(fila.cel).every((st) => st.fin === 'ok1'), intento: fila.chk });
    if (fila.lista && n === MP.FILAS) {
      em.terminado = true;
      E.hist[m].push({ s: em.semilla, pts: em.pts, t: Date.now() });
      enviar(m + '-fin', { s: em.semilla, fun: d.txt, pts: em.pts, max: MP.METODOS[m].max, tabla: em.filas.map((f) => f.final), der: em.der || undefined }, { correcta: true, puntaje: em.pts });
    }
    guardar();
    vMetodo(m);
    const destino = fila.lista && n < MP.FILAS ? $('#fila-' + (n + 1)) : $('#fila-' + n);
    if (destino) destino.scrollIntoView({ block: 'start' });
  }

  // ---------------- resultado ----------------
  function vResultado() {
    const filas = MET.map((m) => {
      const h = E.hist[m];
      const ult = h.length ? h[h.length - 1] : null;
      return `<tr><td>${MP.METODOS[m].titulo}</td><td>${ult ? ptsTxt(ult.pts) : '—'}</td><td>${MP.METODOS[m].max}</td><td>${h.length}</td></tr>`;
    }).join('');
    const todos = MET.every((m) => E.hist[m].length);
    const total = MET.reduce((a, m) => a + (E.hist[m].length ? E.hist[m][E.hist[m].length - 1].pts : 0), 0);
    $('#cont').innerHTML = volver() + tarjeta(`<span class="etq">Mi resultado</span><h2>Como si fuera el examen</h2>
      <div class="mp-res"><div class="grande">${todos ? ptsTxt(total) : '—'}<small> / 100</small></div>
      <p class="mp-nota">${todos ? 'Suma de tu último intento terminado en cada método.' : 'Termina los tres métodos para ver tu total.'}</p></div>
      <div class="mp-tabla-scroll"><table class="mp-tabla"><tr><th>Método</th><th>Último</th><th>Máximo</th><th>Funciones hechas</th></tr>${filas}</table></div>
      <div class="aviso info">Esta práctica no tiene nota. En el examen tendrás <b>un solo intento</b> por fila: revisa bien antes de comprobar.</div>`);
  }

  // ---------------- render ----------------
  function render() {
    barra();
    if (!alumno) return vRegistro();
    if (!E) cargar();
    const est = estado();
    if (est !== 'abierta') return vEspera(est);
    const h = location.hash.replace('#', '');
    if (h === 'red') vRedondeo();
    else if (MET.includes(h)) vMetodo(h);
    else if (h === 'res') vResultado();
    else vInicio();
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ir]');
    if (!b) return;
    const ir = b.dataset.ir;
    if (location.hash.replace('#', '') === ir) { render(); window.scrollTo(0, 0); return; }
    location.hash = ir;
  });
  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
  II.alCambiarConexion((ok) => { const d = $('#e-con'); d.classList.toggle('on', ok); d.classList.toggle('off', !ok); });

  if (alumno) { cargar(); marcarAsistencia(); }
  render();
  if (!PRUEBA && II.sb) {
    leerEstado();
    setInterval(leerEstado, 15000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) leerEstado(); });
  }
})();
