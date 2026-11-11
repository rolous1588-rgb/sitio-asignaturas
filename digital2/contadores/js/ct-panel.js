// ============================================================
// Electrónica Digital 2 · Práctica de contadores — panel del docente (celular)
//   panel.html?s=d2-contadores
//   QR para entrar; abrir y cerrar; asignar a cada estudiante su secuencia de 3 o 4 bits;
//   ver en vivo en qué paso va cada uno y qué está haciendo; pista; otra oportunidad; notas para Excel.
// estado_sesion.extra = { asincrona: true, abre, cierra, asig: { carnet: { n, seq, v, t } },
//                         pista: { carnet: { t, txt } }, hab: { carnet: { t } } }
// ============================================================
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const SID = /^d2-[a-z0-9-]{2,40}$/.test(II.params.get('s') || '') ? II.params.get('s') : 'd2-contadores';
  const URL_EST = new URL('index.html', location.href).href.split('?')[0] + (SID === 'd2-contadores' ? '' : '?s=' + SID);
  const esc = CT.esc;
  const fmt = (x) => II.fmt(x, 2).replace(/[,.]00$/, '');
  const hora = (t) => (t ? new Date(t).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : '—');
  const hace = (t) => {
    if (!t) return '—';
    const s = Math.max(0, Math.round((Date.now() - new Date(t).getTime()) / 1000));
    return s < 60 ? 'hace ' + s + ' s' : s < 3600 ? 'hace ' + Math.floor(s / 60) + ' min' : 'a las ' + hora(t);
  };

  let fila = null;
  const al = {};            // carnet → { carnet, nombre, info, ing, E, t, fin, pts, err }
  let ultIng = 0, ultResp = 0;
  let vista = { tipo: 'lista', filtro: 'todos', carnet: null };
  let firmaVista = '';
  let cola = Promise.resolve();

  // ---------------- piezas ----------------
  function avisar(txt, cls) {
    let a = $('#aviso-flot');
    if (!a) { a = document.createElement('div'); a.id = 'aviso-flot'; document.body.appendChild(a); }
    a.className = 'aviso ' + (cls || 'ok');
    a.innerHTML = txt;
    a.style.cssText = 'position:fixed;left:12px;right:12px;bottom:16px;z-index:80;box-shadow:0 4px 18px rgba(0,0,0,.15);font-size:15px';
    clearTimeout(avisar.t);
    avisar.t = setTimeout(() => a.remove(), 3500);
  }
  function hoja(html, alAbrir) {
    const capa = II.html('<div class="capa"><div class="dialogo">' + html + '</div></div>');
    document.body.appendChild(capa);
    capa.addEventListener('click', (e) => { if (e.target === capa || e.target.closest('[data-cerrar]')) capa.remove(); });
    if (alAbrir) alAbrir(capa);
    return capa;
  }
  function confirmar(titulo, texto, si) {
    return new Promise((res) => {
      const c = hoja('<h2>' + titulo + '</h2><p>' + texto + '</p><div class="fila-bt"><button class="boton" data-r="0">Cancelar</button><button class="boton prim" data-r="1">' + (si || 'Sí') + '</button></div>');
      c.addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) { c.remove(); res(b.dataset.r === '1'); } else if (e.target === c) res(false); });
    });
  }

  // ---------------- ingreso del docente ----------------
  async function esDocente() {
    try { const { data, error } = await II.sb.from('docentes').select('email').limit(1); return !error && !!(data && data.length); } catch (e) { return false; }
  }
  function vIngreso(msg) {
    document.body.innerHTML = '<main class="ct-cont"><div class="tarjeta"><span class="etq">Electrónica Digital 2</span><h2>Panel de la práctica de contadores</h2>' +
      '<p>Entra con tu cuenta docente (la misma de las otras materias).</p><form id="f-doc">' +
      '<label class="campo"><span>Correo</span><input name="email" type="email" required autocomplete="username"></label>' +
      '<label class="campo"><span>Contraseña</span><input name="clave" type="password" required autocomplete="current-password"></label>' +
      '<div class="aviso mal ' + (msg ? '' : 'oculto') + '" id="f-err">' + (msg || '') + '</div><button class="boton prim bloque">Entrar</button></form></div></main>';
    $('#f-doc').onsubmit = async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target), err = $('#f-err');
      err.classList.remove('oculto'); err.textContent = 'Entrando…';
      const { error } = await II.sb.auth.signInWithPassword({ email: String(fd.get('email')).trim(), password: String(fd.get('clave')) });
      if (error) { err.textContent = /fetch|network/i.test(error.message || '') ? 'Sin internet. Revisa la conexión.' : 'No se pudo entrar: revisa correo y contraseña.'; return; }
      if (!(await esDocente())) { err.textContent = 'Esta cuenta no tiene permiso de docente.'; await II.sb.auth.signOut(); return; }
      arrancar();
    };
  }

  // ---------------- base de datos ----------------
  async function leerFila() {
    const { data, error } = await II.sb.from('estado_sesion').select('*').eq('sesion', SID).maybeSingle();
    if (error) throw error;
    if (!data) {
      const nueva = { sesion: SID, paso: 'inicio', extra: { asincrona: true, abre: null, cierra: null, asig: {}, pista: {}, hab: {} } };
      const r = await II.sb.from('estado_sesion').insert(nueva).select().maybeSingle();
      fila = r.data || nueva;
    } else fila = data;
    return fila;
  }
  // lee lo último y aplica el cambio (serializado: dos toques seguidos no se pisan)
  function cambiarExtra(fn, ok) {
    cola = cola.then(async () => {
      try {
        await leerFila();
        const extra = JSON.parse(JSON.stringify((fila && fila.extra) || {}));
        extra.asincrona = true;
        extra.asig = extra.asig || {}; extra.pista = extra.pista || {}; extra.hab = extra.hab || {};
        fn(extra);
        const { data, error } = await II.sb.from('estado_sesion').update({ extra, actualizado: new Date().toISOString() }).eq('sesion', SID).select();
        if (error || !data || !data.length) throw error || new Error('sin permiso');
        fila = data[0];
        II.marcarConexion(true);
        if (ok) avisar(ok, 'ok');
        pintar(true);
      } catch (e) {
        avisar('No se pudo guardar. Revisa la conexión e inténtalo otra vez.', 'mal');
      }
    });
    return cola;
  }
  async function leerNuevos() {
    // ingresos
    for (;;) {
      const { data, error } = await II.sb.from('ingresos').select('id,carnet,nombre,info,creado').eq('sesion', SID).gt('id', ultIng).order('id').range(0, 499);
      if (error) throw error;
      data.forEach((r) => {
        ultIng = Math.max(ultIng, r.id);
        const a = al[r.carnet] || (al[r.carnet] = { carnet: r.carnet });
        a.nombre = r.nombre; a.info = r.info || {}; a.ing = a.ing || r.creado;
      });
      if (data.length < 500) break;
    }
    // avances y finales
    for (;;) {
      const { data, error } = await II.sb.from('respuestas').select('id,actividad,carnet,nombre,respuesta,creado').eq('sesion', SID).gt('id', ultResp).order('id').range(0, 199);
      if (error) throw error;
      data.forEach((r) => {
        ultResp = Math.max(ultResp, r.id);
        if (r.actividad !== 'avance' && r.actividad !== 'final') return;
        const a = al[r.carnet] || (al[r.carnet] = { carnet: r.carnet, nombre: r.nombre, info: {} });
        const R = r.respuesta || {};
        if (!R.E) return;
        if (a.fin && r.actividad === 'avance' && a.E && a.E.v === R.E.v) return; // lo final manda
        a.E = R.E; a.t = r.creado; a.pts = R.pts || CT.puntos(R.E); a.err = R.err != null ? R.err : CT.errores(R.E);
        a.fin = r.actividad === 'final' || R.E.paso === 'fin';
        if (!a.ini || (a.vIni !== R.E.v)) { a.ini = r.creado; a.vIni = R.E.v; }
        if (r.actividad === 'final') a.tfin = r.creado;
      });
      if (data.length < 200) break;
    }
  }
  async function refrescar() {
    try {
      await leerFila();
      await leerNuevos();
      II.marcarConexion(true);
    } catch (e) {
      II.marcarConexion(false);
    }
    pintar(false);
  }

  // ---------------- estado de cada estudiante ----------------
  const asigDe = (c) => (fila && fila.extra && fila.extra.asig && fila.extra.asig[c]) || null;
  function errPaso(E) {
    if (!E || !E.paso || E.paso === 'fin') return 0;
    let e = 0;
    const c = (it) => { if (!it) return; if (it.est === 'mos') e += 2; else if (it.int >= 2 || it.est === 'mal') e += 1; };
    if (E.paso === 1) ['k', 'n', 'nu'].forEach((x) => c(E.p1[x]));
    if (E.paso === 2) E.p2.f.forEach(c);
    if (E.paso === 3) E.p3.f.forEach(c);
    if (E.paso === 4) E.p4.m.forEach((m) => { c(m.fill); c(m.ex); });
    if (E.paso === 5) E.p5.e.forEach(c);
    return e;
  }
  function estadoDe(a) {
    const as = asigDe(a.carnet);
    if (!as) return { k: 'sin', txt: 'Sin asignar', cls: 'q' };
    const E = a.E && a.E.v === as.v ? a.E : null;
    if (!E) return { k: 'espera', txt: 'Aún no abre su secuencia', cls: 'pri' };
    if (a.fin) return { k: 'fin', txt: 'Terminó', cls: 'ok' };
    const quieto = a.t && Date.now() - new Date(a.t).getTime() > 5 * 60000;
    const ep = errPaso(E);
    if (ep >= 3 || quieto) return { k: 'atascado', txt: ep >= 3 ? 'Atascado: ' + ep + ' errores en este paso' : 'Sin actividad hace ' + Math.round((Date.now() - new Date(a.t).getTime()) / 60000) + ' min', cls: 'mal' };
    return { k: 'curso', txt: 'En curso', cls: 'pri' };
  }
  const estadoPractica = () => {
    const ex = (fila && fila.extra) || {};
    if (ex.cierra && Date.now() > new Date(ex.cierra).getTime()) return 'cerrada';
    if (!ex.abre) return 'sin-abrir';
    return 'abierta';
  };

  // ---------------- dibujo ----------------
  function barraPasos(E) {
    const p = E ? E.paso : 0;
    return '<div class="ct-pasos">' + CT.PASOS.map((_, i) => '<span class="' + (p === 'fin' || i + 1 < p ? 'hecho' : i + 1 === p ? 'act' : '') + '"></span>').join('') + '</div>';
  }
  function pintar(forzar) {
    if (!document.body.dataset.panel) return;
    const firma = JSON.stringify([vista, fila && fila.extra, Object.values(al).map((a) => [a.carnet, a.t, a.fin, a.nombre]), estadoPractica(), Math.floor(Date.now() / 30000)]);
    if (!forzar && firma === firmaVista) return;
    firmaVista = firma;
    const y = window.scrollY;
    if (vista.tipo === 'detalle' && al[vista.carnet]) vDetalle(al[vista.carnet]); else vLista();
    window.scrollTo(0, y);
  }
  function cabecera() {
    const est = estadoPractica(), ex = (fila && fila.extra) || {};
    const pill = { abierta: ['ok', 'Abierta'], cerrada: ['mal', 'Cerrada'], 'sin-abrir': ['q', 'Sin abrir'] }[est];
    return '<header class="ct-barra"><div class="ct-barra-in"><div class="ct-fila1"><div class="ct-marca">Contadores no secuenciales<small>Digital 2; panel docente; sesión ' + SID + '</small></div>' +
      '<span class="ct-pill ' + pill[0] + '">' + pill[1] + '</span></div>' +
      '<div class="fila-bt"><button class="boton prim" data-a="qr">Mostrar QR</button>' +
      (est === 'abierta' ? '<button class="boton peligro" data-a="cerrar">Cerrar práctica</button>' : '<button class="boton verde" data-a="abrir">' + (est === 'cerrada' ? 'Reabrir' : 'Abrir práctica') + '</button>') +
      '<button class="boton" data-a="menu" aria-label="Más opciones" style="flex:0 0 52px">⋮</button></div>' +
      '<small class="lbl">' + (est === 'abierta' ? 'Abierta desde las ' + hora(ex.abre) : est === 'cerrada' ? 'Se cerró a las ' + hora(ex.cierra) + '. Los estudiantes ya no pueden guardar.' : 'Al asignar la primera secuencia se abre sola.') + '</small></div></header>';
  }
  function vLista() {
    const lista = Object.values(al).filter((a) => a.nombre);
    const conE = lista.map((a) => ({ a, st: estadoDe(a) }));
    const cnt = (k) => conE.filter((x) => x.st.k === k).length;
    const sin = cnt('sin');
    const tile = (n, t, cls, f) => '<button class="pp-tile ' + cls + (vista.filtro === f ? ' sel' : '') + '" data-filtro="' + f + '"><b>' + n + '</b><span>' + t + '</span></button>';
    let h = cabecera() + '<main class="ct-cont">' +
      '<div class="pp-tiles">' + tile(lista.length, 'registrados', '', 'todos') + tile(sin, 'sin asignar', 'q', 'sin') + tile(cnt('atascado'), 'atascados', 'mal', 'atascado') + tile(cnt('fin'), 'terminaron', 'ok', 'fin') + '</div>';
    if (sin) h += '<button class="boton prim bloque" data-a="asig-todos">Asignar a los ' + sin + ' sin asignar</button>';
    if (!lista.length) h += '<div class="tarjeta"><p><b>Todavía no entró nadie.</b> Toca «Mostrar QR» para que los estudiantes entren desde su celular. Cada uno aparece aquí apenas se registra.</p></div>';
    const orden = { sin: 0, atascado: 1, espera: 2, curso: 3, fin: 4 };
    conE.filter((x) => vista.filtro === 'todos' || x.st.k === vista.filtro)
      .sort((x, y) => orden[x.st.k] - orden[y.st.k] || String(x.a.nombre).localeCompare(String(y.a.nombre), 'es'))
      .forEach(({ a, st }) => {
        const as = asigDe(a.carnet), E = a.E && as && a.E.v === as.v ? a.E : null;
        const P = E ? CT.puntos(E) : null;
        h += '<div class="pp-card ' + st.k + '" data-ver="' + esc(a.carnet) + '"><div class="pp-c1"><b>' + esc(a.nombre) + '</b><span class="ct-pill ' + st.cls + '">' + (st.k === 'atascado' ? 'Atascado' : st.txt) + '</span></div>';
        if (as) {
          h += '<div class="pp-c2 mono">' + as.seq.join(' → ') + ' <small>(' + as.n + ' bits)</small></div>' + barraPasos(E) +
            '<div class="pp-c3"><span>' + (E ? (E.paso === 'fin' ? 'Terminó' : 'Paso ' + E.paso + ': ' + CT.PASOS[E.paso - 1]) : 'Todavía no abre su secuencia') + '</span>' +
            '<span>' + (E ? fmt(P.total) + ' de 20 pts' : '') + '</span></div>' +
            '<div class="pp-c3 lbl"><span>' + (st.k === 'atascado' ? '<b style="color:var(--bad)">' + st.txt + '</b>' : E ? (a.err || 0) + ' intento' + (a.err === 1 ? '' : 's') + ' fallido' + (a.err === 1 ? '' : 's') : '') + '</span><span>' + (a.t ? hace(a.t) : '') + '</span></div>';
        } else {
          h += '<div class="pp-c3 lbl"><span>C.U. ' + esc(a.carnet) + '; entró ' + hace(a.ing) + '</span></div><button class="boton prim" data-asig="' + esc(a.carnet) + '">Asignar secuencia</button>';
        }
        h += '</div>';
      });
    h += '</main>';
    document.body.innerHTML = h;
  }

  function vistaPaso(E, p) {
    const n = E.n;
    if (p === 1) {
      const it = E.p1, m = (x) => '<span class="ct-res ' + CT.clsIt(x) + '">' + (x.est === 'ok' ? '✓' : x.est === 'mos' ? '!' : x.est === 'mal' ? '✗' : '') + '</span>';
      return '<table class="ct-tab"><tr><th>Pregunta</th><th>Respondió</th><th></th></tr><tr><td>k</td><td>' + esc(it.k.r || '—') + '</td><td>' + m(it.k) + '</td></tr><tr><td>n</td><td>' + esc(it.n.r || '—') + '</td><td>' + m(it.n) + '</td></tr>' +
        '<tr><td>No usados</td><td>' + (it.nu.r.length ? it.nu.r.join(', ') : '—') + '</td><td>' + m(it.nu) + '</td></tr></table>';
    }
    if (p === 2) return CT.htmlTrans(E);
    if (p === 3) return CT.htmlJK(E);
    if (p === 4) return CT.htmlMapas(E);
    if (p === 5) return '<div class="ct-esq-w">' + CT.svgContador(n, E.p5.e.map((x) => ({ c: x.c, p: x.p })), { activo: E.paso === 5 ? E.p5.act : undefined }) + '</div>';
    const ents = E.p5.e.map((x) => ({ c: x.c, p: x.p }));
    const P6 = E.p6;
    if (!P6.hecho) return '<p class="lbl">Está prediciendo: ' + (P6.pred.r === null ? 'aún no elige el siguiente del ' + P6.u : 'dice que el ' + P6.u + ' pasa al ' + P6.pred.r) + '; ' + (P6.atr.r === null ? 'aún no responde si se queda atrapado.' : 'dice que ' + (P6.atr.r ? 'sí' : 'no') + ' se queda atrapado.') + '</p>';
    return '<p>' + (P6.pred.ok ? '✓' : '✗') + ' Predicción del ' + P6.u + ' (dijo ' + P6.pred.r + '); ' + (P6.atr.ok ? '✓' : '✗') + ' ¿atrapado?</p>' + CT.htmlSim(n, CT.simular(n, ents, E.seq), E.seq);
  }
  function vDetalle(a) {
    const as = asigDe(a.carnet), st = estadoDe(a);
    const E = a.E && as && a.E.v === as.v ? a.E : null;
    let h = cabecera() + '<main class="ct-cont"><div class="pp-det1"><button class="boton" data-a="volver" aria-label="Volver" style="flex:0 0 48px">←</button><div><b style="font-size:19px">' + esc(a.nombre) + '</b><br><small class="lbl">C.U. ' + esc(a.carnet) + (a.info && a.info.carrera ? '; ' + esc(a.info.carrera) : '') + '</small></div><span class="ct-pill ' + st.cls + '">' + (st.k === 'atascado' ? 'Atascado' : st.txt) + '</span></div>';
    if (!as) {
      h += '<div class="tarjeta"><p>Todavía no tiene secuencia.</p><button class="boton prim bloque" data-asig="' + esc(a.carnet) + '">Asignar secuencia</button></div></main>';
      document.body.innerHTML = h;
      return;
    }
    h += '<div class="tarjeta"><span class="etq">Su secuencia (' + as.n + ' bits)' + (as.t ? '; asignada a las ' + hora(as.t) : '') + '</span>' + '<div class="ct-seq">' + as.seq.map((s) => '<b>' + s + '</b>').join('<i>→</i>') + '<i>↺</i></div></div>';
    if (!E) {
      h += '<div class="tarjeta"><p>Aún no abrió su secuencia en el celular (o su celular no envía: revisa sus datos móviles).</p></div>';
    } else {
      const P = CT.puntos(E);
      h += barraPasos(E) + '<div class="pp-pasos-t">' + CT.PASOS.map((t, i) => '<span' + (E.paso === i + 1 ? ' class="act"' : '') + '>' + t + '</span>').join('') + '</div>';
      if (st.k === 'atascado') h += '<div class="aviso mal">' + st.txt + '.</div>';
      const pAct = E.paso === 'fin' ? 6 : E.paso;
      h += '<div class="tarjeta"><div style="display:flex;justify-content:space-between;align-items:center"><span class="ct-tit">' + (E.paso === 'fin' ? 'Terminó' : 'Ahora mismo: paso ' + E.paso + ', ' + CT.PASOS[E.paso - 1]) + '</span><span class="lbl">' + hace(a.t) + '</span></div>' + vistaPaso(E, pAct) + '</div>';
      h += '<div class="tarjeta"><table class="ct-resumen">' + [['1. Datos', P.p1, 3], ['2. Transición', P.p2, 4], ['3. J y K', P.p3, 4], ['4. Mapas', P.p4, 5], ['5. Circuito', P.p5, 2], ['6. Verificar', P.p6, 2]]
        .map(([t, v, m]) => '<tr><td>' + t + '</td><td>' + fmt(v) + ' de ' + m + '</td></tr>').join('') + '<tr class="tot"><td>Total</td><td>' + fmt(P.total) + ' de 20</td></tr></table>' +
        '<p class="lbl" style="margin-top:6px">' + (a.err || 0) + ' intentos fallidos en toda la práctica.</p></div>';
      if (pAct > 1) h += '<details class="ct-ayuda"><summary>Ver los pasos anteriores</summary>' + [1, 2, 3, 4, 5].filter((p) => p < pAct).map((p) => '<p class="ct-tit" style="margin-top:8px">' + p + '. ' + CT.PASOS[p - 1] + '</p>' + vistaPaso(E, p)).join('') + '</details>';
    }
    const ex = (fila && fila.extra) || {}, pi = ex.pista && ex.pista[a.carnet];
    if (pi) h += '<p class="lbl">Última pista (' + hora(pi.t) + '): «' + esc(pi.txt) + '»</p>';
    h += '<div class="fila-bt" style="margin-top:4px"><button class="boton prim" data-a="pista"' + (E && E.paso !== 'fin' ? '' : ' disabled') + '>Mandarle una pista</button></div>' +
      '<div class="fila-bt"><button class="boton" data-a="hab"' + (E && E.paso !== 'fin' ? '' : ' disabled') + '>Otra oportunidad en este paso</button><button class="boton" data-asig="' + esc(a.carnet) + '">Cambiar secuencia</button></div></main>';
    document.body.innerHTML = h;
  }

  // ---------------- asignar ----------------
  function hojaAsignar(carnets) {
    const uno = carnets.length === 1 ? al[carnets[0]] : null;
    const previa = uno && asigDe(uno.carnet);
    const st = { n: previa ? previa.n : 3, k: previa ? previa.seq.length : CT.K_DEF[3], seq: null, mano: false };
    st.seq = CT.azar(st.n, st.k);
    const capa = hoja('<div id="h-asig"></div>');
    const caja = $('#h-asig', capa);
    function dibujar() {
      const [kmin, kmax] = CT.RANGO_K[st.n];
      let h = '<h2>' + (uno ? 'Asignar secuencia a ' + esc(uno.nombre) : 'Asignar a los ' + carnets.length + ' sin asignar') + '</h2>' +
        (previa ? '<div class="aviso mal">Ya tiene la secuencia ' + previa.seq.join(' → ') + '. Si le cambias, empieza de nuevo desde el paso 1.</div>' : '') +
        '<div class="pp-seg"><button data-n="3" class="' + (st.n === 3 ? 'sel' : '') + '">3 bits<small>8 estados</small></button><button data-n="4" class="' + (st.n === 4 ? 'sel' : '') + '">4 bits<small>16 estados</small></button></div>' +
        '<div class="pp-k"><span>Estados en la secuencia (k)<small class="lbl">Con ' + st.n + ' bits: de ' + kmin + ' a ' + kmax + '</small></span><span class="pp-step"><button data-k="-1" ' + (st.k <= kmin ? 'disabled' : '') + '>−</button><b>' + st.k + '</b><button data-k="1" ' + (st.k >= kmax ? 'disabled' : '') + '>+</button></span></div>';
      if (uno) {
        const t = CT.trampa(st.n, st.seq);
        const d = CT.datos({ n: st.n, seq: st.seq });
        h += '<div class="tarjeta" style="margin:10px 0"><span class="etq">Secuencia</span><div class="ct-seq">' + st.seq.map((s) => '<b>' + s + '</b>').join('<i>→</i>') + '<i>↺</i></div>' +
          '<p class="lbl" style="margin-top:6px">Estados no usados: ' + d.noUsados.join(', ') + '</p>' +
          (t.atrapados.length ? '<div class="aviso info" style="background:var(--q2);color:#8a4700"><b>Tiene trampa:</b> si la diseña con X en los no usados, ' + t.atrapados.join(', ') + ' se queda' + (t.atrapados.length > 1 ? 'n' : '') + ' atrapado' + (t.atrapados.length > 1 ? 's' : '') + '. Buena para discutir el bloqueo.</div>' : '<p class="lbl">Con X en los no usados queda autocorregible.</p>') +
          '<div class="fila-bt"><button class="boton" data-otra="1">Otra al azar</button><button class="boton" data-mano="1">Escribir a mano</button></div>' +
          (st.mano ? '<label class="campo" style="margin-top:8px"><span>Escribe los estados en orden (decimal)</span><input id="h-mano" inputmode="numeric" placeholder="por ejemplo: 0 3 7 2 5" value="' + st.seq.join(' ') + '"></label><div class="aviso mal oculto" id="h-err"></div>' : '') + '</div>';
      } else {
        h += '<p class="lbl" style="margin:10px 0">Cada estudiante recibe una secuencia distinta al azar. Después puedes cambiar la de cualquiera desde su detalle.</p>';
      }
      if (estadoPractica() !== 'abierta') h += '<p class="lbl">Al asignar, la práctica se abre.</p>';
      h += '<div class="fila-bt"><button class="boton" data-cerrar="1">Cancelar</button><button class="boton prim" data-ok="1">Asignar</button></div>';
      caja.innerHTML = h;
      const mano = $('#h-mano', caja);
      if (mano) mano.oninput = () => {
        const s = CT.parsear(mano.value), v = CT.validar(st.n, s), err = $('#h-err', caja);
        if (v.ok) { st.seq = s; st.k = s.length; err.classList.add('oculto'); dibujarSinMano(); } else { err.textContent = v.motivo; err.classList.remove('oculto'); }
      };
    }
    // repinta la vista previa sin perder el foco del campo «a mano»
    function dibujarSinMano() {
      const v = $('#h-mano', caja).value;
      const pos = $('#h-mano', caja).selectionStart;
      dibujar();
      const m = $('#h-mano', caja); m.value = v; m.focus(); try { m.setSelectionRange(pos, pos); } catch (e) {}
    }
    caja.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.n) { st.n = +b.dataset.n; st.k = Math.min(Math.max(st.k, CT.RANGO_K[st.n][0]), CT.RANGO_K[st.n][1]); st.seq = CT.azar(st.n, st.k); st.mano = false; dibujar(); }
      if (b.dataset.k) { st.k += +b.dataset.k; st.seq = CT.azar(st.n, st.k); dibujar(); }
      if (b.dataset.otra) { st.seq = CT.azar(st.n, st.k); st.mano = false; dibujar(); }
      if (b.dataset.mano) { st.mano = true; dibujar(); }
      if (b.dataset.ok) {
        if (uno && !CT.validar(st.n, st.seq).ok) return;
        const t = Date.now();
        const nuevas = {};
        carnets.forEach((c, i) => { nuevas[c] = { n: st.n, seq: uno ? st.seq.slice() : CT.azar(st.n, st.k), v: t.toString(36) + '-' + i, t: new Date(t).toISOString() }; });
        capa.remove();
        cambiarExtra((ex) => {
          Object.assign(ex.asig, nuevas);
          if (!(ex.abre && !(ex.cierra && Date.now() > new Date(ex.cierra).getTime()))) { ex.abre = new Date(Date.now() - 10000).toISOString(); ex.cierra = null; }
        }, carnets.length === 1 ? 'Secuencia asignada.' : 'Se asignaron ' + carnets.length + ' secuencias.');
      }
    });
    dibujar();
  }

  // ---------------- pista ----------------
  const PISTAS = {
    1: ['k es la cantidad de estados de tu secuencia. n debe cumplir 2ⁿ ≥ k y el estado más grande debe caber en binario.', 'Los no usados son los números de 0 a 2ⁿ − 1 que no aparecen en tu secuencia.'],
    2: ['El siguiente de cada estado es el que viene después en tu secuencia; el último vuelve al primero.', 'Escribe el siguiente en binario, con todos sus bits.'],
    3: ['Mira bit por bit: 0→0 da 0 X; 0→1 da 1 X; 1→0 da X 1; 1→1 da X 0.', 'Si el siguiente es X, J y K de ese bit son X.'],
    4: ['Copia la columna tal cual: cada celda es un estado presente (el número de la esquina).', 'Usa las X para hacer grupos más grandes; los bordes del mapa se tocan.', 'Cada grupo debe tener 1, 2, 4 u 8 celdas en rectángulo y al menos un 1.'],
    5: ['Cada grupo es una AND con las variables que no cambian dentro del grupo; si hay varios grupos, van a una OR.', 'Si la ecuación es 1, conecta la entrada a 1.'],
    6: ['Usa Q⁺ = J·Q̄ + K̄·Q en cada flip-flop con los valores del estado de encendido.', 'Si J = K = 1, el bit cambia; si J = K = 0, se mantiene.']
  };
  function hojaPista(a) {
    const E = a.E, p = E && E.paso !== 'fin' ? E.paso : 6;
    const capa = hoja('<h2>Pista para ' + esc(a.nombre) + '</h2><p class="lbl">Le aparece arriba en su celular. No le quita puntos.</p>' +
      '<div class="pp-sug">' + (PISTAS[p] || []).map((t, i) => '<button class="boton" data-sug="' + i + '" style="text-align:left;font-weight:500">' + esc(t) + '</button>').join('') + '</div>' +
      '<label class="campo" style="margin-top:8px"><span>O escribe la tuya</span><textarea id="p-txt" rows="3" maxlength="300"></textarea></label>' +
      '<div class="fila-bt"><button class="boton" data-cerrar="1">Cancelar</button><button class="boton prim" data-env="1">Enviar pista</button></div>');
    capa.addEventListener('click', (e) => {
      const s = e.target.closest('[data-sug]');
      if (s) { $('#p-txt', capa).value = PISTAS[p][+s.dataset.sug]; return; }
      if (e.target.closest('[data-env]')) {
        const txt = $('#p-txt', capa).value.trim();
        if (!txt) { $('#p-txt', capa).focus(); return; }
        capa.remove();
        cambiarExtra((ex) => { ex.pista[a.carnet] = { t: Date.now(), txt }; }, 'Pista enviada.');
      }
    });
  }

  // ---------------- QR ----------------
  function abrirQR() {
    const n = Object.values(al).filter((a) => a.nombre).length;
    const capa = II.html('<div class="pp-qr"><div class="qr">' + II.qrSVG(URL_EST, 640) + '</div><p class="pp-qr-t">Escanea con la cámara del celular</p>' +
      '<p class="mono pp-qr-u">' + esc(URL_EST.replace(/^https?:\/\//, '')) + '</p><p class="lbl"><b id="qr-n">' + n + '</b> registrados</p>' +
      '<div class="fila-bt" style="width:100%;max-width:420px"><button class="boton" data-copiar="1">Copiar enlace</button><button class="boton prim" data-cerrarqr="1">Cerrar</button></div></div>');
    document.body.appendChild(capa);
    capa.addEventListener('click', async (e) => {
      if (e.target.closest('[data-cerrarqr]')) { clearInterval(t); capa.remove(); }
      if (e.target.closest('[data-copiar]')) { try { await navigator.clipboard.writeText(URL_EST); avisar('Enlace copiado.', 'ok'); } catch (er) { avisar(URL_EST, 'info'); } }
    });
    const t = setInterval(() => { const q = $('#qr-n'); if (!q) return clearInterval(t); q.textContent = Object.values(al).filter((a) => a.nombre).length; }, 2000);
  }

  // ---------------- notas para Excel ----------------
  function csv() {
    const dec = (x) => String(Math.round(x * 100) / 100).replace('.', ',');
    const filas = [['Carnet', 'Apellidos y nombres', 'Carrera', 'Bits', 'Secuencia', 'Paso', 'Datos (3)', 'Transición (4)', 'J y K (4)', 'Mapas (5)', 'Circuito (2)', 'Verificar (2)', 'Total (20)', 'Nota (100)', 'Intentos fallidos', 'Terminó', 'Autocorregible', 'Empezó', 'Último envío']];
    Object.values(al).filter((a) => a.nombre).sort((x, y) => x.nombre.localeCompare(y.nombre, 'es')).forEach((a) => {
      const as = asigDe(a.carnet), E = a.E && as && a.E.v === as.v ? a.E : null, P = E ? CT.puntos(E) : null;
      filas.push([a.carnet, a.nombre, (a.info && a.info.carrera) || '', as ? as.n : '', as ? as.seq.join(' ') : '', E ? (E.paso === 'fin' ? 'terminó' : E.paso) : '',
        P ? dec(P.p1) : '', P ? dec(P.p2) : '', P ? dec(P.p3) : '', P ? dec(P.p4) : '', P ? dec(P.p5) : '', P ? dec(P.p6) : '', P ? dec(P.total) : '0', P ? dec(P.total * 5) : '0',
        E ? a.err || 0 : '', a.fin ? 'sí' : 'no', E && E.p6 && E.p6.hecho ? (E.p6.auto ? 'sí' : 'no') : '', a.ini ? new Date(a.ini).toLocaleString('es-BO') : '', a.t ? new Date(a.t).toLocaleString('es-BO') : '']);
    });
    const txt = '﻿' + filas.map((f) => f.map((c) => { const s = String(c); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\r\n');
    const b = new Blob([txt], { type: 'text/csv;charset=utf-8' });
    const u = URL.createObjectURL(b), l = document.createElement('a');
    l.href = u; l.download = 'contadores_' + SID + '_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(l); l.click(); l.remove();
    setTimeout(() => URL.revokeObjectURL(u), 2000);
  }
  function menu() {
    const capa = hoja('<h2>Más opciones</h2><div style="display:flex;flex-direction:column;gap:8px">' +
      '<button class="boton" data-m="csv">Descargar notas (Excel)</button>' +
      '<a class="boton" style="text-align:center;text-decoration:none" target="_blank" href="index.html?modo=prueba">Probar como estudiante (3 bits)</a>' +
      '<a class="boton" style="text-align:center;text-decoration:none" target="_blank" href="index.html?modo=prueba&n=4">Probar como estudiante (4 bits)</a>' +
      '<button class="boton peligro" data-m="salir">Salir de la cuenta docente</button><button class="boton" data-cerrar="1">Volver</button></div>');
    capa.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-m]');
      if (!b) return;
      capa.remove();
      if (b.dataset.m === 'csv') csv();
      if (b.dataset.m === 'salir') { await II.sb.auth.signOut(); location.reload(); }
    });
  }

  // ---------------- eventos ----------------
  document.addEventListener('click', async (e) => {
    if (e.target.closest('.capa') || e.target.closest('.pp-qr')) return;
    const a = e.target.closest('[data-a]');
    if (a && !a.disabled) {
      const x = a.dataset.a;
      if (x === 'qr') return abrirQR();
      if (x === 'menu') return menu();
      if (x === 'abrir') return cambiarExtra((ex) => { ex.abre = new Date(Date.now() - 10000).toISOString(); ex.cierra = null; }, 'Práctica abierta.');
      if (x === 'cerrar') {
        if (await confirmar('¿Cerrar la práctica?', 'Los estudiantes ya no podrán guardar ni comprobar. Su avance queda guardado y puedes reabrirla.', 'Sí, cerrar')) cambiarExtra((ex) => { ex.cierra = new Date().toISOString(); }, 'Práctica cerrada.');
        return;
      }
      if (x === 'asig-todos') { const sin = Object.values(al).filter((z) => z.nombre && !asigDe(z.carnet)).map((z) => z.carnet); if (sin.length) hojaAsignar(sin); return; }
      if (x === 'volver') { vista = { tipo: 'lista', filtro: vista.filtro, carnet: null }; pintar(true); window.scrollTo(0, 0); return; }
      if (x === 'pista') return hojaPista(al[vista.carnet]);
      if (x === 'hab') {
        const z = al[vista.carnet];
        if (await confirmar('¿Otra oportunidad?', 'En el paso donde está ' + esc(z.nombre) + ', lo que se le mostró por fallar dos veces vuelve a quedar abierto con 1 intento (vale la mitad).', 'Sí, habilitar')) cambiarExtra((ex) => { ex.hab[z.carnet] = { t: Date.now() }; }, 'Habilitado.');
        return;
      }
    }
    const as = e.target.closest('[data-asig]');
    if (as) { e.stopPropagation(); return hojaAsignar([as.dataset.asig]); }
    const f = e.target.closest('[data-filtro]');
    if (f) { vista.filtro = vista.filtro === f.dataset.filtro ? 'todos' : f.dataset.filtro; pintar(true); return; }
    const v = e.target.closest('[data-ver]');
    if (v) { vista = { tipo: 'detalle', filtro: vista.filtro, carnet: v.dataset.ver }; pintar(true); window.scrollTo(0, 0); }
  });

  // ---------------- arranque ----------------
  async function arrancar() {
    document.body.dataset.panel = '1';
    document.body.innerHTML = '<main class="ct-cont"><div class="tarjeta"><p>Cargando la práctica…</p></div></main>';
    await refrescar();
    pintar(true);
    setInterval(refrescar, 5000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refrescar(); });
  }
  (async () => {
    if (!II.sb) { document.body.innerHTML = '<main class="ct-cont"><div class="tarjeta"><p>No se pudo cargar la conexión. Revisa internet y recarga.</p></div></main>'; return; }
    const { data } = await II.sb.auth.getSession();
    if (data && data.session && (await esDocente())) arrancar(); else vIngreso();
  })();
  window.CT_PANEL = { al, vista: () => vista, fila: () => fila };
})();
