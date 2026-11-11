// ============================================================
// Electrónica Digital 2 · Práctica de contadores síncronos no secuenciales — vista del estudiante (celular)
//   index.html?s=d2-contadores            → práctica en clase (el docente asigna la secuencia desde panel.html)
//   index.html?modo=prueba[&n=4][&seq=…]  → para probar: sin base de datos, secuencia local
// estado_sesion.extra (lo escribe el panel): { asincrona, abre, cierra,
//   asig: { carnet: { n, seq, v } }, pista: { carnet: { t, txt } }, hab: { carnet: { t } } }
// Envíos a «respuestas»: ingreso; avance (estado completo, al comprobar y cada 20 s si cambió); final.
// ============================================================
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const SID = /^d2-[a-z0-9-]{2,40}$/.test(II.params.get('s') || '') ? II.params.get('s') : 'd2-contadores';
  const PRUEBA = II.params.get('modo') === 'prueba';
  const K_AL = 'd2ct-alumno' + (PRUEBA ? '-prueba' : '');
  const K_COLA = 'd2ct-cola';
  const CARRERAS = ['Ingeniería Electrónica', 'Ingeniería Mecatrónica', 'Otra carrera'];
  const Km = window.D2.k;
  const esc = CT.esc;

  let alumno = II.leer(K_AL, null);
  if (PRUEBA && !alumno) {
    alumno = { nombre: 'Prueba, Docente', carnet: 'prueba', info: { apellidos: 'Prueba', nombres: 'Docente', carrera: CARRERAS[0] } };
    II.guardar(K_AL, alumno);
  }
  let fila = null;
  let leida = false;
  let E = null;
  let aviso = null;          // { txt, cls } mensaje después de comprobar
  let ed = null;             // editor del mapa abierto
  let sucio = false;
  let ultimoEnvio = 0;

  const kE = () => 'd2ct-' + SID + (PRUEBA ? '-prueba' : '') + '-' + alumno.carnet;
  const guardar = () => { if (E) II.guardar(kE(), E); sucio = true; };
  const nombreCorto = () => ((alumno.info && alumno.info.nombres) || alumno.nombre || '').split(' ')[0];
  const fmt = (x) => II.fmt(x, 2).replace(/,00$/, '').replace(/\.00$/, '');

  // ---------------- cola propia de envíos (relee la cola guardada en cada vuelta) ----------------
  let vaciando = false;
  function enviar(actividad, respuesta, o) {
    o = o || {};
    if (PRUEBA || !II.sb) return;
    let cola = II.leer(K_COLA, []);
    if (actividad === 'avance') cola = cola.filter((x) => !(x.actividad === 'avance' && x.carnet === alumno.carnet && x.sesion === SID));
    cola.push({
      sesion: SID, actividad, carnet: alumno.carnet, nombre: alumno.nombre,
      respuesta: Object.assign({}, respuesta, { car: (alumno.info && alumno.info.carrera) || '' }),
      correcta: !!o.correcta, intento: 1, puntaje: Math.min(100, Math.max(0, Number(o.puntaje) || 0))
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
          const r = II.leer('d2ct-rechazadas', []);
          r.push(cola[0]);
          II.guardar('d2ct-rechazadas', r.slice(-20));
        }
        II.marcarConexion(true);
        const resto = II.leer(K_COLA, []);
        const i = resto.findIndex((x) => JSON.stringify(x) === JSON.stringify(cola[0]));
        if (i >= 0) resto.splice(i, 1);
        II.guardar(K_COLA, resto);
      }
    } catch (e) {
      II.marcarConexion(false);
    } finally {
      vaciando = false;
    }
  }
  function enviarAvance(forzar) {
    if (!E || PRUEBA) return;
    if (!forzar && (!sucio || Date.now() - ultimoEnvio < 20000)) return;
    sucio = false;
    ultimoEnvio = Date.now();
    const P = CT.puntos(E);
    enviar('avance', { E, paso: E.paso, pts: P, err: CT.errores(E) }, { puntaje: P.total });
  }
  setInterval(vaciar, 5000);
  setInterval(() => enviarAvance(false), 10000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) enviarAvance(true); });

  // ---------------- estado de la práctica ----------------
  function estadoPractica() {
    if (PRUEBA) return 'abierta';
    if (!II.sb) return 'sin-red';
    if (!leida) return 'cargando';
    const ex = (fila && fila.extra) || {};
    if (ex.cierra && Date.now() > new Date(ex.cierra).getTime()) return 'cerrada';
    if (!ex.abre) return 'no-abierta';
    return 'abierta';
  }
  function asignacion() {
    if (PRUEBA) {
      const n = II.params.get('n') === '4' ? 4 : 3;
      let seq = CT.parsear(II.params.get('seq'));
      if (!CT.validar(n, seq).ok) seq = (II.leer('d2ct-prueba-seq-' + n, null)) || CT.azar(n, CT.K_DEF[n]);
      II.guardar('d2ct-prueba-seq-' + n, seq);
      return { n, seq, v: 'prueba-' + n + '-' + seq.join('.') };
    }
    const ex = (fila && fila.extra) || {};
    return (ex.asig && ex.asig[alumno.carnet]) || null;
  }

  function nuevoE(a) {
    const n = a.n, N = 1 << n, ne = 2 * n, d = CT.datos(a);
    const r = II.rng(alumno.carnet + '|' + a.v);
    return {
      v: a.v, n, seq: a.seq.slice(), paso: 1, t0: Date.now(), tf: null,
      p1: { k: { r: '', int: 0, est: '' }, n: { r: '', int: 0, est: '' }, nu: { r: [], int: 0, est: '' } },
      p2: { f: Array.from({ length: N }, () => ({ r: Array(n).fill(-1), int: 0, est: '' })) },
      p3: { f: Array.from({ length: N }, () => ({ r: Array(ne).fill(-1), int: 0, est: '' })) },
      p4: { m: Array.from({ length: ne }, () => ({ vals: Array(N).fill(0), grupos: [], fill: { int: 0, est: '' }, ex: { int: 0, est: '', min: false, ok1: 0 } })), act: 0 },
      p5: { e: Array.from({ length: ne }, () => ({ c: null, p: [[]], int: 0, est: '' })), act: 0 },
      p6: { u: d.noUsados[Math.floor(r() * d.noUsados.length)], pred: { r: null, ok: null }, atr: { r: null, ok: null }, hecho: false },
      pistaT: 0, habT: 0
    };
  }

  let firma = '';
  function alCambiarFila(f) {
    fila = f;
    leida = true;
    if (!alumno) { const nf = 'reg|' + estadoPractica(); if (nf !== firma) { firma = nf; render(); } return; }
    const a = asignacion();
    const ex = (f && f.extra) || {};
    const h = ex.hab && ex.hab[alumno.carnet];
    const p = ex.pista && ex.pista[alumno.carnet];
    let cambio = false;
    if (a && (!E || E.v !== a.v)) {
      const habia = !!E;
      E = II.leer(kE(), null);
      if (!E || E.v !== a.v) {
        E = nuevoE(a);
        // lo que el docente mandó antes de esta secuencia no se aplica
        E.habT = (h && h.t) || 0;
        E.pistaVista = (p && p.t) || 0;
        if (habia) aviso = { txt: 'Tu docente te asignó una secuencia nueva. Empiezas desde el paso 1.', cls: 'info' };
      }
      guardar();
      enviarAvance(true);
      cambio = true;
    }
    if (!a && E && !PRUEBA) { E = null; cambio = true; }
    if (E && h && h.t && h.t !== E.habT) { habilitar(); E.habT = h.t; guardar(); enviarAvance(true); cambio = true; }
    const nf = estadoPractica() + '|' + (E ? E.v : '-') + '|' + (E && p && p.t !== E.pistaVista ? p.t : '');
    if (cambio || nf !== firma) { firma = nf; render(); }
    else pintarBarra();
  }

  // el docente da otra oportunidad: lo mostrado vuelve a quedar abierto con 1 intento (vale la mitad)
  function habilitar() {
    const re = (it) => { if (it && it.est === 'mos') { it.est = 'mal'; it.int = 1; if (it.prev !== undefined) it.r = it.prev; } };
    const p = E.paso;
    if (p === 1) ['k', 'n', 'nu'].forEach((x) => re(E.p1[x]));
    if (p === 2) E.p2.f.forEach(re);
    if (p === 3) E.p3.f.forEach(re);
    if (p === 4) E.p4.m.forEach((m) => { if (m.ex.est === 'mos') { m.ex.est = 'mal'; m.ex.int = 1; if (m.ex.prevMal) m.grupos = m.ex.prevMal; } re(m.fill); });
    if (p === 5) E.p5.e.forEach((x) => { if (x.est === 'mos') { x.est = 'mal'; x.int = 1; if (x.prevC) { x.c = x.prevC.c; x.p = x.prevC.p; } } });
    aviso = { txt: 'Tu docente te dio otra oportunidad en este paso: lo que se te mostró vuelve a estar abierto (vale la mitad).', cls: 'info' };
  }

  // ---------------- piezas de pantalla ----------------
  function confirmar(titulo, texto, si, no) {
    return new Promise((res) => {
      const capa = II.html('<div class="capa"><div class="dialogo"><h2>' + titulo + '</h2><p>' + texto + '</p>' +
        '<div class="fila-bt"><button class="boton" data-r="0">' + (no || 'Cancelar') + '</button><button class="boton prim" data-r="1">' + (si || 'Sí') + '</button></div></div></div>');
      document.body.appendChild(capa);
      capa.onclick = (e) => {
        const b = e.target.closest('[data-r]');
        if (!b && e.target !== capa) return;
        capa.remove();
        res(!!(b && b.dataset.r === '1'));
      };
    });
  }
  const seqHTML = (seq) => '<div class="ct-seq">' + seq.map((s) => '<b>' + s + '</b>').join('<i>→</i>') + '<i>↺</i></div>';
  const marca = (it) => (!it || !it.est ? '' : it.est === 'ok' ? '<span class="ct-marca-it ok">✓</span>' : it.est === 'mos' ? '<span class="ct-marca-it mos">!</span>' : it.est === 'mal' ? '<span class="ct-marca-it mal">✗</span>' : '');
  const clsBit = (v) => (v === 1 ? 'v1' : v === 0 ? 'v0' : v === 2 ? 'vx' : 'vq');

  function pintarBarra() {
    const b = $('.ct-barra');
    if (!b) return;
    const pasoAct = E ? E.paso : 0;
    const P = E ? CT.puntos(E) : null;
    $('.ct-pts', b).textContent = P ? fmt(P.total) + ' de ' + CT.TOTAL + ' pts' : '';
    $('.ct-pasos', b).innerHTML = CT.PASOS.map((_, i) => '<span class="' + (pasoAct === 'fin' || i + 1 < pasoAct ? 'hecho' : i + 1 === pasoAct ? 'act' : '') + '"></span>').join('');
    $('.ct-paso-t', b).innerHTML = !E ? '' : E.paso === 'fin' ? '<b>Terminaste la práctica</b>' : '<b>Paso ' + E.paso + ' de 6: ' + CT.PASOS[E.paso - 1] + '</b>';
    const pu = $('.ct-punto', b);
    pu.className = 'ct-punto ' + (PRUEBA ? '' : II.conectado === false ? 'off' : II.conectado ? 'on' : '');
  }
  II.alCambiarConexion && II.alCambiarConexion(pintarBarra);

  function marco(cuerpo, accion) {
    document.body.innerHTML =
      '<header class="ct-barra"><div class="ct-barra-in"><div class="ct-fila1"><div class="ct-marca">Contadores síncronos<small>' +
      (alumno ? esc(alumno.nombre) : 'Electrónica Digital 2') + (PRUEBA ? ' (prueba)' : '') + '</small></div><span><span class="ct-pts"></span><span class="ct-punto"></span></span></div>' +
      '<div class="ct-pasos"></div><div class="ct-paso-t"></div></div></header>' +
      '<main class="ct-cont" id="cont">' + cuerpo + '</main>' +
      (accion ? '<div class="ct-accion"><div class="ct-accion-in">' + accion + '</div></div>' : '');
    if (PRUEBA) $('#cont').insertAdjacentHTML('beforeend', '<button class="boton peligro" data-a="reiniciar">Reiniciar la prueba (otra secuencia)</button>');
    pintarBarra();
  }
  function bandaAvisos() {
    let h = '';
    const est = estadoPractica();
    if (est === 'cerrada' && E && E.paso !== 'fin') h += '<div class="aviso mal">La práctica está cerrada: ya no se guardan cambios.</div>';
    if (est === 'no-abierta' && E) h += '<div class="aviso info">El docente todavía no abrió la práctica: tu avance se guarda en el celular y se envía cuando la abra.</div>';
    const ex = (fila && fila.extra) || {};
    const p = ex.pista && alumno && ex.pista[alumno.carnet];
    if (E && p && p.t && p.t !== E.pistaVista) h += '<div class="ct-pista"><b>Pista de tu docente</b><p>' + esc(p.txt) + '</p><button class="boton" data-a="pista-ok">Entendido</button></div>';
    if (aviso) h += '<div class="aviso ' + aviso.cls + '">' + aviso.txt + '</div>';
    return h;
  }
  const puedeGuardar = () => estadoPractica() !== 'cerrada';

  // ---------------- vistas ----------------
  function render() {
    if (ed) { ed.destruir(); ed = null; }
    if (!alumno) return vRegistro();
    const est = estadoPractica();
    if (est === 'cargando') return marco('<div class="tarjeta"><p>Conectando…</p></div>');
    if (est === 'sin-red') return marco('<div class="tarjeta"><p>No se pudo conectar. Revisa tus datos móviles y recarga la página.</p></div>');
    if (!E) return vEspera();
    const v = { 1: v1, 2: v2, 3: v3, 4: v4, 5: v5, 6: v6, fin: vFin }[E.paso];
    v();
    window.scrollTo && window.scrollTo(0, 0);
  }

  function vRegistro() {
    marco('<div class="tarjeta"><span class="etq">Electrónica Digital 2; práctica en clase</span><h2>Contadores síncronos no secuenciales</h2>' +
      '<p>Entra con tus datos. Tu docente te asignará <b>tu propia secuencia</b> y la diseñarás paso a paso con flip-flops JK.</p>' +
      '<form id="f-ing"><label class="campo"><span>Apellidos</span><input name="apellidos" required minlength="2" maxlength="38" autocomplete="family-name"></label>' +
      '<label class="campo"><span>Nombres</span><input name="nombres" required minlength="2" maxlength="38" autocomplete="given-name"></label>' +
      '<label class="campo"><span>Carnet universitario (C.U.)</span><input name="cu" required minlength="3" maxlength="20" inputmode="numeric" autocomplete="off"></label>' +
      '<label class="campo"><span>Carrera</span><select name="carrera" required><option value="" disabled selected>Elige tu carrera</option>' + CARRERAS.map((c) => '<option>' + c + '</option>').join('') + '</select></label>' +
      '<div class="aviso mal oculto" id="f-err"></div><button class="boton prim bloque">Entrar</button></form></div>');
    $('#f-ing').onsubmit = async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const limpio = (k) => String(fd.get(k) || '').trim().replace(/\s+/g, ' ');
      const info = { apellidos: limpio('apellidos'), nombres: limpio('nombres'), carrera: String(fd.get('carrera') || '') };
      const cu = limpio('cu').replace(/[\s.-]+/g, '');
      const err = $('#f-err');
      if (!CARRERAS.includes(info.carrera)) { err.textContent = 'Elige tu carrera.'; err.classList.remove('oculto'); return; }
      if (cu.length < 3) { err.textContent = 'Revisa tu carnet universitario.'; err.classList.remove('oculto'); return; }
      alumno = { nombre: info.apellidos + ', ' + info.nombres, carnet: cu, info };
      ev.target.querySelector('button').disabled = true;
      if (II.sb && !PRUEBA) {
        await II.registrarIngreso(SID, alumno);
        II.guardar('d2ct-ing-' + SID + '-' + cu, new Date().toISOString().slice(0, 10));
      }
      II.guardar(K_AL, alumno);
      firma = '';
      alCambiarFila(fila);
    };
  }

  function teoriaJK() {
    return '<p>La ecuación característica del JK dice qué hace la salida con cada pulso de reloj:</p>' +
      '<p class="ct-form">\\[ Q^{+} = J\\cdot\\overline{Q} + \\overline{K}\\cdot Q \\]</p>' +
      '<p>Para diseñar se usa al revés: <b>sé de dónde vengo y a dónde quiero ir; ¿qué J y K necesito?</b> Esa es la tabla de excitación (X = «no importa»):</p>' +
      '<div class="ct-exc"><span>0→0<br><b>0 X</b></span><span>0→1<br><b>1 X</b></span><span>1→0<br><b>X 1</b></span><span>1→1<br><b>X 0</b></span></div>';
  }
  function vEspera() {
    marco(bandaAvisos() + '<div class="tarjeta"><span class="etq">Registrado</span><h2>Hola, ' + esc(nombreCorto()) + '</h2>' +
      '<p>Espera un momento: tu docente te asignará tu secuencia (de 3 o de 4 bits). Esta pantalla cambia sola.</p></div>' +
      '<div class="tarjeta idea"><span class="etq">Mientras esperas: el procedimiento</span><ol style="margin:0;padding-left:20px">' +
      '<li><b>Datos:</b> cuántos estados (k), cuántos flip-flops (n) y qué estados no se usan.</li>' +
      '<li><b>Transición:</b> a qué estado pasa cada uno.</li><li><b>J y K:</b> la excitación de cada flip-flop.</li>' +
      '<li><b>Mapas:</b> un mapa de Karnaugh por cada J y K, con sus grupos.</li><li><b>Circuito:</b> armas las compuertas de cada entrada.</li>' +
      '<li><b>Verificar:</b> simulas tu circuito y revisas los estados no usados.</li></ol></div>' +
      '<div class="tarjeta">' + teoriaJK() + '</div>');
  }

  // ---------- paso 1: datos ----------
  function v1() {
    const d = CT.datos(E), p = E.p1, abierto = puedeGuardar();
    const parteA = CT.cerrado(p.k) && CT.cerrado(p.n);
    const inp = (id, it, lab, ayuda) => '<div class="ct-preg"><label for="i-' + id + '">' + lab + (ayuda ? '<small>' + ayuda + '</small>' : '') + '</label>' +
      '<span style="display:flex;align-items:center;gap:6px"><input id="i-' + id + '" class="ct-num ' + CT.clsIt(it) + '" inputmode="numeric" maxlength="2" value="' + esc(it.r) + '"' + (CT.cerrado(it) || !abierto ? ' readonly' : '') + '>' + marca(it) + '</span></div>';
    let h = bandaAvisos() +
      '<div class="tarjeta"><span class="etq">Tu secuencia (te la asignó el docente)</span>' + seqHTML(E.seq) +
      '<p class="lbl" style="margin-top:6px">Después del ' + E.seq[E.seq.length - 1] + ' vuelve al ' + E.seq[0] + ' y el ciclo se repite. Los estados están en decimal.</p></div>' +
      '<details class="ct-ayuda"><summary>¿Cómo se sacan estos datos?</summary><p><b>k</b> es la cantidad de estados distintos de la secuencia. Con <b>n</b> flip-flops hay \\(2^{n}\\) combinaciones, así que hace falta \\(2^{n} \\ge k\\) y además que quepa el estado más grande en binario.</p>' +
      '<p>Los estados que no aparecen en la secuencia son los <b>no usados</b>: el circuito no debería pasar por ellos, pero al encender puede aparecer cualquiera.</p></details>' +
      '<div class="tarjeta">' + inp('k', p.k, '¿Cuántos estados tiene? <b>k</b>') + inp('n', p.n, '¿Cuántos flip-flops? <b>n</b>', 'Pista: \\(2^{n} \\ge k\\) y que quepa el estado más grande') + '</div>';
    if (parteA) {
      const sel = new Set(p.nu.r);
      h += '<div class="tarjeta"><p style="font-weight:600">Toca los estados que <b>no</b> se usan ' + marca(p.nu) + '</p><div class="ct-estados">' +
        Array.from({ length: d.N }, (_, s) => '<button class="ct-estado' + (sel.has(s) ? ' on' : '') + (CT.cerrado(p.nu) ? ' fijo' : '') + '" data-nu="' + s + '"' + (CT.cerrado(p.nu) || !abierto ? ' disabled' : '') + '><b>' + s + '</b><small>' + CT.bin(s, d.n) + '</small></button>').join('') +
        '</div><p class="lbl" style="margin-top:6px">Marcados: ' + sel.size + '. Debajo de cada estado está su valor en binario (' + CT.nombres(d.n).join(' ') + ').</p></div>' +
        '<div class="tarjeta pensar"><span class="etq">Para pensar antes de seguir</span>Si al encender el circuito aparece el ' + E.p6.u + ', ¿qué crees que hará? Lo comprobarás al final.</div>';
    }
    const todo = parteA && CT.cerrado(p.nu);
    const acc = todo ? '<button class="boton verde bloque" data-a="sig">Siguiente paso: la tabla de transición</button>'
      : '<button class="boton prim bloque" data-a="chk1"' + (abierto ? '' : ' disabled') + '>Comprobar</button><small>2 intentos por respuesta</small>';
    marco(h, acc);
    ['k', 'n'].forEach((id) => { const i = $('#i-' + id); if (i) i.oninput = () => { E.p1[id].r = i.value.replace(/\D/g, ''); guardar(); }; });
  }
  function chk1() {
    const d = CT.datos(E), p = E.p1;
    const res = [];
    let hayMal = false;
    if (!CT.cerrado(p.k) || !CT.cerrado(p.n)) {
      [['k', d.k, 'k'], ['n', d.n, 'n']].forEach(([id, ok, nom]) => {
        const it = p[id];
        if (CT.cerrado(it)) return;
        if (it.r === '') { res.push('Falta ' + nom + '.'); hayMal = true; return; }
        const e = CT.intentar(it, +it.r === ok);
        if (e !== 'ok') hayMal = true;
        if (e === 'mos') { it.prev = it.r; it.r = String(ok); }
        res.push(nom + ': ' + (e === 'ok' ? 'bien' : e === 'mos' ? 'era ' + ok : 'no; te queda 1 intento'));
      });
      if (p.n.est === 'mal') res.push('Recuerda: con n flip-flops hay 2ⁿ combinaciones y el estado más grande (' + Math.max(...E.seq) + ') debe caber en binario.');
    } else if (!CT.cerrado(p.nu)) {
      const ok = p.nu.r.length === d.noUsados.length && d.noUsados.every((s) => p.nu.r.includes(s));
      const e = CT.intentar(p.nu, ok);
      if (e !== 'ok') hayMal = true;
      if (e === 'mos') { p.nu.prev = p.nu.r.slice(); p.nu.r = d.noUsados.slice(); }
      res.push(e === 'ok' ? 'Bien: esos son los no usados.' : e === 'mos' ? 'Los no usados eran: ' + d.noUsados.join(', ') + '.' : 'No son esos. Revisa qué estados de 0 a ' + (d.N - 1) + ' no aparecen en tu secuencia. Te queda 1 intento.');
    }
    aviso = { txt: res.join(' '), cls: hayMal ? 'mal' : 'ok' };
    guardar(); enviarAvance(true); render();
  }

  // ---------- paso 2: transición ----------
  function v2() {
    const d = CT.datos(E), n = E.n, abierto = puedeGuardar();
    let h = bandaAvisos() + '<div class="tarjeta"><span class="etq">Tu secuencia</span>' + seqHTML(E.seq) + '</div>' +
      '<details class="ct-ayuda"' + (E.p2.f.every((f) => f.r.every((x) => x < 0)) ? ' open' : '') + '><summary>¿Cómo se llena?</summary>' +
      '<p>Para cada <b>estado presente</b> escribe en binario el <b>siguiente</b>. En los estados de tu secuencia, el siguiente es el que viene después (el último vuelve al primero).</p>' +
      '<p>En los <b>no usados decides tú</b>: con <b>X</b> («no importa») los mapas quedan más simples, pero al final hay que verificar que el contador no se quede atrapado; si los mandas a un estado de la secuencia (por ejemplo, al ' + E.seq[0] + '), siempre se corrige solo.</p>' +
      '<p class="lbl">Toca cada bit: ? → 0 → 1' + ' (en los no usados también X).</p></details>' +
      '<div class="ct-filas">';
    for (let s = 0; s < d.N; s++) {
      const f = E.p2.f[s], nu = !d.usado(s), fija = CT.cerrado(f) || f.est === 'dec' || !abierto;
      h += '<div class="ct-fila ' + (nu ? 'nu ' : '') + CT.clsIt(f) + (fija ? ' fija' : '') + '"><span class="ct-d">' + s + '</span><span class="ct-pres">' + CT.bin(s, n) + (nu ? '<span class="ct-tag">no usado</span>' : '') + '</span><span class="ct-fl">→</span>' +
        '<span class="ct-bits n' + n + '">' +
        f.r.map((v, j) => '<button class="ct-bit ' + clsBit(v) + '" data-f2="' + s + '" data-j="' + j + '"' + (fija ? ' disabled' : '') + '>' + CT.txtBit(v) + '</button>').join('') +
        '</span><span class="ct-res ' + (f.est === 'ok' ? 'ok' : f.est === 'mal' ? 'mal' : f.est === 'mos' ? 'mos' : '') + '">' + (f.est === 'ok' ? '✓' : f.est === 'mal' ? '✗' : f.est === 'mos' ? '!' : '') + '</span></div>';
    }
    h += '</div>';
    const pendU = d.seq.filter((s) => !CT.cerrado(E.p2.f[s])).length;
    const vacias = E.p2.f.filter((f) => !CT.cerrado(f) && f.est !== 'dec' && f.r.some((x) => x < 0)).length;
    const acc = !pendU ? '<button class="boton verde bloque" data-a="sig">Siguiente paso: J y K</button>'
      : '<button class="boton prim bloque" data-a="chk2"' + (vacias || !abierto ? ' disabled' : '') + '>Comprobar la tabla</button><small>' + (vacias ? 'Faltan ' + vacias + ' fila' + (vacias > 1 ? 's' : '') + ' por llenar' : '2 intentos por fila') + '</small>';
    marco(h, acc);
  }
  function chk2() {
    const d = CT.datos(E);
    let bien = 0, mal = 0, mos = 0;
    for (let s = 0; s < d.N; s++) {
      const f = E.p2.f[s];
      if (!d.usado(s)) { if (f.est !== 'dec') f.est = 'dec'; continue; }
      if (CT.cerrado(f)) continue;
      const ok = CT.bits(d.sig[s], d.n);
      const e = CT.intentar(f, f.r.every((v, j) => v === ok[j]));
      if (e === 'ok') bien++; else if (e === 'mos') { mos++; f.prev = f.r.slice(); f.r = ok; } else mal++;
    }
    aviso = mal || mos
      ? { txt: (bien ? bien + ' fila' + (bien > 1 ? 's' : '') + ' bien. ' : '') + (mal ? mal + ' con error (✗): te queda 1 intento en esa' + (mal > 1 ? 's' : '') + '. ' : '') + (mos ? 'En ' + mos + ' se te muestra la respuesta (!).' : '') + ' Las filas de los no usados quedaron como las decidiste.', cls: 'mal' }
      : { txt: '¡Tabla correcta! Las filas de los no usados quedaron como las decidiste.', cls: 'ok' };
    guardar(); enviarAvance(true); render();
  }

  // ---------- paso 3: J y K ----------
  function v3() {
    const n = E.n, N = 1 << n, en = CT.entradas(n), abierto = puedeGuardar();
    let h = bandaAvisos() + '<details class="ct-ayuda"' + (E.p3.f.every((f) => f.r.every((x) => x < 0)) ? ' open' : '') + '><summary>Tabla de excitación del JK</summary>' + teoriaJK() +
      '<p>Para cada fila mira <b>bit por bit</b>: Q₂ presente → Q₂ siguiente da J₂ y K₂, y así con cada flip-flop. Si el siguiente es X, J y K son X.</p></details>' +
      '<div class="ct-exc" style="margin-top:-4px"><span>0→0 <b>0 X</b></span><span>0→1 <b>1 X</b></span><span>1→0 <b>X 1</b></span><span>1→1 <b>X 0</b></span></div>' +
      '<div class="ct-jk n' + n + '"><div class="ct-jk-g" style="grid-template-columns:auto repeat(' + 2 * n + ',' + (n === 4 ? 29 : 34) + 'px)"><span class="ct-jk-h">Q → Q⁺</span>' + en.map((x) => '<span class="ct-jk-h">' + x.nom + '</span>').join('');
    for (let s = 0; s < N; s++) {
      const f = E.p3.f[s], sig = E.p2.f[s].r, fija = CT.cerrado(f) || !abierto;
      const malc = new Set(f.malc || []);
      h += '<span class="ct-jk-l ' + CT.clsIt(f) + '">' + CT.bin(s, n) + '→' + sig.map(CT.txtBit).join('') + (f.est === 'ok' ? ' ✓' : f.est === 'mos' ? ' !' : f.est === 'mal' ? ' ✗' : '') + '</span>' +
        f.r.map((v, e) => '<button class="ct-c ' + clsBit(v) + ' ' + CT.clsIt(f) + (f.est === 'mal' && malc.has(e) ? ' malc' : '') + '" data-f3="' + s + '" data-e="' + e + '"' + (fija ? ' disabled' : '') + ' aria-label="' + en[e].nom + ' del estado ' + s + '">' + CT.txtBit(v) + '</button>').join('');
    }
    h += '</div></div><p class="lbl" style="text-align:center">Toca una celda para cambiarla: ? → 0 → 1 → X</p>';
    const pend = E.p3.f.filter((f) => !CT.cerrado(f));
    const vacias = pend.filter((f) => f.r.some((x) => x < 0)).length;
    const acc = !pend.length ? '<button class="boton verde bloque" data-a="sig">Siguiente paso: los mapas</button>'
      : '<button class="boton prim bloque" data-a="chk3"' + (vacias || !abierto ? ' disabled' : '') + '>Comprobar la tabla</button><small>' + (vacias ? 'Faltan ' + vacias + ' fila' + (vacias > 1 ? 's' : '') + ' por completar' : '2 intentos por fila') + '</small>';
    marco(h, acc);
  }
  function chk3() {
    const n = E.n;
    let bien = 0, mal = 0, mos = 0;
    E.p3.f.forEach((f, s) => {
      if (CT.cerrado(f)) return;
      const ok = CT.filaJK(n, s, E.p2.f[s].r);
      const e = CT.intentar(f, f.r.every((v, i) => v === ok[i]));
      f.malc = f.r.map((v, i) => (v === ok[i] ? -1 : i)).filter((i) => i >= 0);
      if (e === 'ok') bien++; else if (e === 'mos') { mos++; f.prev = f.r.slice(); f.r = ok; } else mal++;
    });
    aviso = mal || mos
      ? { txt: (bien ? bien + ' fila' + (bien > 1 ? 's' : '') + ' bien. ' : '') + (mal ? mal + ' con error: las celdas marcadas en rojo no coinciden. Busca esa transición en la tabla de excitación; te queda 1 intento. ' : '') + (mos ? 'En ' + mos + ' fila' + (mos > 1 ? 's' : '') + ' se te muestra la respuesta (!).' : ''), cls: 'mal' }
      : { txt: '¡Tabla de J y K correcta!', cls: 'ok' };
    guardar(); enviarAvance(true); render();
  }

  // ---------- paso 4: mapas ----------
  function colCorrecta(e) { return E.p3.f.map((f) => f.r[e]); }
  function v4() {
    const n = E.n, en = CT.entradas(n), nom = CT.nombres(n), abierto = puedeGuardar();
    const a = E.p4.act, m = E.p4.m[a], x = en[a];
    const tabs = '<div class="ct-tabs">' + en.map((y, i) => { const mm = E.p4.m[i]; return '<button class="ct-tab-b' + (i === a ? ' sel' : '') + (mm.ex.est === 'ok' ? ' ok' : mm.ex.est === 'mos' ? ' mos' : '') + '" data-mapa="' + i + '">' + y.nom + (mm.ex.est === 'ok' ? ' ✓' : '') + '</button>'; }).join('') + '</div>';
    const col = colCorrecta(a);
    const fillOK = CT.cerrado(m.fill), exOK = CT.cerrado(m.ex);
    let h = bandaAvisos() + tabs +
      '<details class="ct-ayuda"><summary>¿Cómo se hace el mapa de ' + x.nom + '?</summary><p><b>1. Llenar:</b> copia la columna ' + x.nom + ' de tu tabla de J y K. Cada celda es un estado presente (el número pequeño de la esquina). Toca la celda para cambiarla: 0 → 1 → X.</p>' +
      '<p><b>2. Agrupar:</b> toca las celdas de un grupo (1, 2, 4 u 8 celdas vecinas en rectángulo; los bordes se tocan) y presiona «Formar grupo». Las X ayudan a hacer grupos más grandes, pero no hace falta cubrirlas. La expresión se arma sola.</p></details>' +
      '<details class="ct-ayuda"><summary>Ver mi columna ' + x.nom + '</summary><div class="ct-col">' + col.map((v, s) => '<span>' + CT.bin(s, n) + ' <b>' + CT.txtBit(v) + '</b></span>').join('') + '</div></details>' +
      '<div class="tarjeta"><p class="ct-tit">Mapa de ' + x.nom + (exOK ? ' ' + marca(m.ex) : '') + '</p>' +
      (fillOK ? '<p class="lbl">El mapa ya está lleno' + (m.fill.est === 'mos' ? ' (se te mostró)' : '') + '. Ahora forma los grupos.</p>' : '') +
      '<div id="zona-ed"></div></div>';
    if (m.ex.est === 'casi') h += '<div class="aviso info">Tu expresión es correcta, pero se puede simplificar más. Puedes intentar otra vez (2.º intento) o dejarla así.</div>';
    if (exOK) h += '<div class="tarjeta ' + (m.ex.est === 'ok' ? 'bien' : 'pensar') + '"><p class="ct-form">\\(' + x.tex + ' = ' + CT.texEnt(n, CT.deCubos(n, m.grupos)) + '\\)</p>' +
      (m.ex.est === 'ok' ? (m.ex.min ? '<p class="lbl" style="text-align:center">Correcta y mínima.</p>' : '<p class="lbl" style="text-align:center">Correcta, no mínima.</p>') : '<p class="lbl" style="text-align:center">Esta es la mínima; con ella sigues.</p>') + '</div>';
    const todos = E.p4.m.every((mm) => CT.cerrado(mm.ex));
    let acc;
    if (todos) acc = '<button class="boton verde bloque" data-a="sig">Siguiente paso: el circuito</button>';
    else if (exOK) acc = '<button class="boton prim bloque" data-a="sigmapa">Siguiente mapa</button>';
    else if (!fillOK) acc = '<button class="boton prim bloque" data-a="chk4f"' + (abierto ? '' : ' disabled') + '>Comprobar el mapa lleno</button><small>2 intentos</small>';
    else acc = '<button class="boton prim bloque" data-a="chk4e"' + (abierto ? '' : ' disabled') + '>Comprobar la expresión</button>' +
      (m.ex.est === 'casi' ? '<button class="boton bloque" data-a="dejar">Dejarla así</button>' : '<small>2 intentos</small>');
    marco(h, acc);
    // editor
    const zona = $('#zona-ed');
    if (exOK) {
      zona.innerHTML = Km.estatico(n, m.vals, { nombres: nom, grupos: m.grupos });
    } else {
      ed = Km.editor(zona, { nv: n, nombres: nom, conX: true, vals: m.vals, fijo: fillOK || !abierto, salida: x.nom });
      ed.fijar({ grupos: m.grupos });
      ed.alCambiar((st) => {
        if (!fillOK) m.vals = st.vals;
        m.grupos = st.grupos;
        guardar();
      });
    }
  }
  function chk4f() {
    const a = E.p4.act, m = E.p4.m[a], col = colCorrecta(a);
    const malas = m.vals.filter((v, s) => v !== col[s]).length;
    const e = CT.intentar(m.fill, !malas);
    if (e !== 'ok' && e !== 'mos') aviso = { txt: 'Hay ' + malas + ' celda' + (malas > 1 ? 's' : '') + ' que no coincide' + (malas > 1 ? 'n' : '') + ' con tu columna ' + CT.entradas(E.n)[a].nom + '. Revisa con «Ver mi columna». Te queda 1 intento.', cls: 'mal' };
    else if (e === 'mos') { aviso = { txt: 'Se te muestra el mapa lleno correctamente. Ahora forma los grupos.', cls: 'mal' }; }
    else aviso = { txt: 'Mapa bien lleno. Ahora forma los grupos (pestaña «2. Agrupar» ya activa).', cls: 'ok' };
    if (CT.cerrado(m.fill)) {
      m.vals = col.slice();
      m.grupos = m.grupos.filter((g) => !m.vals.some((v, k) => v === 0 && (k & g.mask) === g.val));
    }
    guardar(); enviarAvance(true); render();
  }
  function chk4e() {
    const n = E.n, a = E.p4.act, m = E.p4.m[a], ex = m.ex, vals = m.vals;
    const unos = vals.some((v) => v === 1);
    const correcto = m.grupos.length ? Km.equivale(n, m.grupos, vals) : !unos;
    const mn = Km.resolver(n, vals);
    const esMin = correcto && m.grupos.length === mn.cubos.length && Km.lits(m.grupos) === mn.lits;
    ex.int = (ex.int || 0) + 1;
    if (correcto && esMin) {
      ex.est = 'ok'; ex.min = true; if (!ex.ok1) ex.ok1 = ex.int;
      aviso = { txt: '¡Correcta y mínima!', cls: 'ok' };
    } else if (correcto) {
      if (!ex.ok1) ex.ok1 = ex.int;
      if (ex.int >= 2) { ex.est = 'ok'; ex.min = false; aviso = { txt: 'Correcta, pero no es la mínima. Sigues con ella.', cls: 'info' }; }
      else { ex.est = 'casi'; ex.prev = m.grupos.map((g) => ({ mask: g.mask, val: g.val })); aviso = null; }
    } else if (ex.ok1) {
      m.grupos = ex.prev; ex.est = 'ok'; ex.min = false;
      aviso = { txt: 'Tu segundo intento no daba la función. Se queda tu expresión anterior (correcta, no mínima).', cls: 'info' };
    } else if (ex.int >= 2) {
      ex.est = 'mos'; ex.prevMal = m.grupos.slice(); m.grupos = mn.cubos;
      aviso = { txt: 'Tu expresión no da los unos del mapa. Se te muestra la mínima: compárala con la tuya.', cls: 'mal' };
    } else {
      ex.est = 'mal';
      aviso = { txt: 'Esa expresión no cubre todos los unos o incluye un 0 del mapa. Revisa los grupos; te queda 1 intento.', cls: 'mal' };
    }
    guardar(); enviarAvance(true); render();
  }
  function sigMapa() {
    const ne = 2 * E.n;
    for (let i = 1; i <= ne; i++) { const j = (E.p4.act + i) % ne; if (!CT.cerrado(E.p4.m[j].ex)) { E.p4.act = j; break; } }
    aviso = null; guardar(); render();
  }

  // ---------- paso 5: circuito ----------
  function entsAlumno() { return E.p5.e.map((x) => ({ c: x.c, p: x.p })); }
  function v5() {
    const n = E.n, en = CT.entradas(n), nom = CT.nombres(n), abierto = puedeGuardar();
    const a = E.p5.act, x = E.p5.e[a], cer = CT.cerrado(x) || !abierto;
    const ecu = en.map((y, i) => '\\(' + y.tex + ' = ' + CT.texEnt(n, CT.deCubos(n, E.p4.m[i].grupos)) + '\\)').join('<br>');
    let h = bandaAvisos() +
      '<details class="ct-ayuda"><summary>¿Cómo se arma?</summary><p>Cada entrada J y K es una <b>suma de productos</b>: cada término es una compuerta AND y, si hay más de un término, todas llegan a una OR. Un término con una sola variable es un cable directo. Si la ecuación es 1 o 0, la entrada se conecta a 1 o a 0.</p>' +
      '<p>Las variables salen de los propios flip-flops (Q y Q̄): por eso el contador es una máquina que se alimenta a sí misma, y todos los flip-flops reciben el <b>mismo reloj</b> (síncrono).</p></details>' +
      '<div class="tarjeta idea"><span class="etq">Tus ecuaciones (del paso 4)</span><div class="ct-ecu">' + ecu + '</div></div>' +
      '<div class="ct-esq-w">' + CT.svgContador(n, entsAlumno(), { activo: a }) + '</div>' +
      '<div class="ct-tabs">' + en.map((y, i) => { const z = E.p5.e[i]; return '<button class="ct-tab-b' + (i === a ? ' sel' : '') + (z.est === 'ok' ? ' ok' : z.est === 'mos' ? ' mos' : '') + '" data-ent="' + i + '">' + y.nom + (z.est === 'ok' ? ' ✓' : z.est === 'mal' ? ' ✗' : '') + '</button>'; }).join('') + '</div>' +
      '<div class="tarjeta"><p class="ct-tit">Arma la entrada ' + en[a].nom + ' ' + marca(x) + '</p>';
    if (x.c === 1 || x.c === 0) {
      h += '<p>' + en[a].nom + ' está conectada a <b>' + x.c + '</b>.</p>' + (cer ? '' : '<button class="boton" data-a="c-quitar">Quitar la conexión</button>');
    } else {
      h += x.p.map((g, k) => '<div class="ct-and" data-g="' + k + '"><span class="ct-and-n">' + (x.p.length > 1 || g.length > 1 ? 'AND ' + (k + 1) : 'Término') + '</span><div class="ct-chips">' +
        nom.map((q, i) => [0, 1].map((ng) => { const c = 2 * i + ng; return '<button class="ct-chip' + (g.includes(c) ? ' on' : '') + '" data-c="' + c + '"' + (cer ? ' disabled' : '') + '>' + (ng ? '<span class="ov">' + q + '</span>' : q) + '</button>'; }).join('')).join('') +
        '</div>' + (cer ? '' : '<button class="ct-x" data-xg="' + k + '" aria-label="Quitar compuerta">✕</button>') + '</div>').join('<div style="height:6px"></div>');
      if (!cer) h += '<div class="fila-bt" style="margin-top:8px"><button class="boton" data-a="mas-and">+ Compuerta AND</button><button class="boton" data-a="c1">Conectar a 1</button><button class="boton" data-a="c0">Conectar a 0</button></div>';
    }
    h += '<p class="lbl" style="margin-top:8px">Tu entrada: <b>' + en[a].nom + ' = ' + CT.htmlEnt(n, x) + '</b></p></div>';
    const cnt = CT.cuentaCompuertas(n, entsAlumno());
    h += '<p class="lbl" style="text-align:center">Tu circuito: ' + n + ' flip-flops JK; ' + cnt.and + ' AND; ' + cnt.or + ' OR</p>';
    const pend = E.p5.e.map((z, i) => ({ z, i })).filter((o) => !CT.cerrado(o.z));
    const vacias = pend.filter((o) => CT.entVacia(o.z)).map((o) => en[o.i].nom);
    const acc = !pend.length ? '<button class="boton verde bloque" data-a="sig">Siguiente paso: verificar</button>'
      : '<button class="boton prim bloque" data-a="chk5"' + (vacias.length || !abierto ? ' disabled' : '') + '>Comprobar el circuito</button><small>' + (vacias.length ? 'Falta armar: ' + vacias.join('; ') : '2 intentos por entrada') + '</small>';
    marco(h, acc);
  }
  function chk5() {
    const n = E.n, en = CT.entradas(n);
    const malas = [], mostradas = [];
    E.p5.e.forEach((x, i) => {
      if (CT.cerrado(x)) return;
      const e = CT.intentar(x, CT.entCumple(n, x, E.p4.m[i].vals));
      if (e === 'mos') { x.prevC = { c: x.c, p: x.p }; const r = CT.deCubos(n, E.p4.m[i].grupos); x.c = r.c; x.p = r.p.length ? r.p : [[]]; mostradas.push(en[i].nom); }
      if (e === 'mal') malas.push(en[i].nom);
    });
    aviso = malas.length || mostradas.length
      ? { txt: (malas.length ? 'No coincide' + (malas.length > 1 ? 'n' : '') + ' con tu ecuación: ' + malas.join('; ') + '. Te queda 1 intento. ' : '') + (mostradas.length ? 'Se armó con tu ecuación: ' + mostradas.join('; ') + '.' : ''), cls: 'mal' }
      : { txt: '¡Circuito correcto!', cls: 'ok' };
    if (malas.length) E.p5.act = en.findIndex((y) => y.nom === malas[0]);
    guardar(); enviarAvance(true); render();
  }

  // ---------- paso 6: verificar ----------
  function v6() {
    const n = E.n, d = CT.datos(E), en = CT.entradas(n), ents = entsAlumno(), abierto = puedeGuardar(), p = E.p6;
    const ecu = en.map((y, i) => '\\(' + y.tex + ' = ' + CT.texEnt(n, ents[i]) + '\\)').join('<br>');
    let h = bandaAvisos() + '<div class="tarjeta idea"><span class="etq">Tu circuito</span><div class="ct-ecu">' + ecu + '</div>' +
      '<p class="lbl" style="margin-top:6px">\\(Q^{+} = J\\cdot\\overline{Q} + \\overline{K}\\cdot Q\\): si J = K = 0 se mantiene, J = 1 y K = 0 pone 1, J = 0 y K = 1 pone 0, J = K = 1 cambia.</p></div>';
    if (!p.hecho) {
      h += '<div class="tarjeta pensar"><span class="etq">Predice antes de simular (1 punto)</span><p>Si el contador enciende en el <b>' + p.u + '</b> (' + CT.bin(p.u, n) + '), ¿a qué estado pasa con el primer pulso de reloj? Calcula J y K de cada flip-flop con tus ecuaciones.</p>' +
        '<div class="ct-estados">' + Array.from({ length: d.N }, (_, s) => '<button class="ct-estado' + (p.pred.r === s ? ' on' : '') + '" data-pred="' + s + '"><b>' + s + '</b><small>' + CT.bin(s, n) + '</small></button>').join('') + '</div></div>' +
        '<div class="tarjeta pensar"><span class="etq">Predice (1 punto)</span><p>¿Algún estado no usado (' + d.noUsados.join(', ') + ') se queda <b>atrapado</b>, es decir, nunca llega a tu secuencia?</p>' +
        '<div class="ct-sino"><button class="boton' + (p.atr.r === true ? ' sel' : '') + '" data-atr="1">Sí</button><button class="boton' + (p.atr.r === false ? ' sel' : '') + '" data-atr="0">No</button></div></div>';
      marco(h, '<button class="boton prim bloque" data-a="chk6"' + (p.pred.r === null || p.atr.r === null || !abierto ? ' disabled' : '') + '>Responder y simular</button><small>Un solo intento: es una predicción</small>');
      return;
    }
    const sim = CT.simular(n, ents, E.seq);
    const real = sim.tabla[p.u];
    let calc = '<table class="ct-tab"><tr><th>FF</th><th>Q</th><th>J</th><th>K</th><th>Q⁺</th></tr>';
    for (let j = 0; j < n; j++) {
      const b = n - 1 - j, q = (p.u >> b) & 1, J = CT.evalEnt(n, ents[2 * j], p.u), K = CT.evalEnt(n, ents[2 * j + 1], p.u);
      calc += '<tr><td>FF' + CT.sub(b) + '</td><td>' + q + '</td><td>' + J + '</td><td>' + K + '</td><td><b>' + ((real >> b) & 1) + '</b></td></tr>';
    }
    calc += '</table>';
    h += '<div class="tarjeta ' + (p.pred.ok ? 'bien' : 'malo') + '"><span class="etq">Tu predicción del ' + p.u + '</span><p>' + (p.pred.ok ? '✓ Bien: ' : '✗ Dijiste ' + p.pred.r + '; ') + 'el ' + p.u + ' (' + CT.bin(p.u, n) + ') pasa al <b>' + real + '</b> (' + CT.bin(real, n) + ').</p>' + calc + '</div>' +
      '<div class="tarjeta ' + (p.atr.ok ? 'bien' : 'malo') + '"><span class="etq">¿Se queda atrapado?</span><p>' + (p.atr.ok ? '✓ Bien. ' : '✗ ') + (sim.autocorregible ? 'Ningún estado se queda atrapado: tu contador es <b>autocorregible</b>.' : 'Sí: ' + sim.noUsados.filter((u) => u.entra === null).map((u) => u.s).join(', ') + ' nunca llega' + (sim.noUsados.filter((u) => u.entra === null).length > 1 ? 'n' : '') + ' a la secuencia (<b>bloqueo</b>).') + '</p></div>' +
      '<div class="tarjeta"><span class="etq">Simulación de tu circuito</span>' + CT.htmlSim(n, sim, E.seq) + '</div>';
    if (!sim.autocorregible) h += '<div class="tarjeta pensar"><span class="etq">Para corregirlo</span>En la tabla de transición, en vez de X manda el estado atrapado a un estado de la secuencia (por ejemplo, al ' + E.seq[0] + '). Rehaz esos mapas y vuelve a simular: así el diseño queda seguro.</div>';
    marco(h, '<button class="boton verde bloque" data-a="fin"' + (abierto ? '' : ' disabled') + '>Enviar y terminar</button>');
  }
  function chk6() {
    const n = E.n, sim = CT.simular(n, entsAlumno(), E.seq), p = E.p6;
    p.pred.ok = p.pred.r === sim.tabla[p.u];
    p.atr.ok = p.atr.r === !sim.autocorregible;
    p.hecho = true;
    p.auto = sim.autocorregible;
    p.ciclo = sim.cicloOK;
    aviso = null;
    guardar(); enviarAvance(true); render();
  }
  async function terminar() {
    if (!(await confirmar('¿Enviar y terminar?', 'Tu docente recibe tu resultado. Después ya no puedes cambiar nada.', 'Sí, enviar'))) return;
    E.paso = 'fin';
    E.tf = Date.now();
    const P = CT.puntos(E);
    guardar();
    enviar('final', { E, paso: 'fin', pts: P, err: CT.errores(E), auto: E.p6.auto, ciclo: E.p6.ciclo }, { puntaje: P.total, correcta: true });
    aviso = null;
    render();
  }

  function vFin() {
    const P = CT.puntos(E), n = E.n;
    const fila = (t, v, m) => '<tr><td>' + t + '</td><td>' + fmt(v) + ' de ' + m + '</td></tr>';
    const sim = CT.simular(n, entsAlumno(), E.seq);
    marco(bandaAvisos() + '<div class="tarjeta bien"><span class="etq">Terminaste</span><h2>¡Buen trabajo, ' + esc(nombreCorto()) + '!</h2><p>Tu resultado ya le llegó a tu docente.</p></div>' +
      '<div class="tarjeta"><table class="ct-resumen">' + fila('1. Datos', P.p1, 3) + fila('2. Transición', P.p2, 4) + fila('3. J y K', P.p3, 4) + fila('4. Mapas', P.p4, 5) + fila('5. Circuito', P.p5, 2) + fila('6. Verificar', P.p6, 2) +
      '<tr class="tot"><td>Total</td><td>' + fmt(P.total) + ' de 20</td></tr></table></div>' +
      '<div class="tarjeta"><span class="etq">Tu secuencia</span>' + seqHTML(E.seq) + '</div>' +
      '<div class="ct-esq-w">' + CT.svgContador(n, entsAlumno()) + '</div>' +
      '<div class="tarjeta"><span class="etq">Simulación</span>' + CT.htmlSim(n, sim, E.seq) + '</div>');
  }

  // ---------------- eventos ----------------
  document.addEventListener('click', (ev) => {
    const t = ev.target;
    const a = t.closest('[data-a]');
    if (a && !a.disabled) {
      const x = a.dataset.a;
      if (x === 'reiniciar') { const n = II.params.get('n') === '4' ? 4 : 3; localStorage.removeItem('d2ct-prueba-seq-' + n); localStorage.removeItem(kE()); const a2 = asignacion(); E = nuevoE(a2); guardar(); aviso = null; render(); return; }
      if (x === 'pista-ok') { const ex = (fila && fila.extra) || {}; E.pistaVista = ex.pista[alumno.carnet].t; guardar(); render(); return; }
      if (x === 'sig') { E.paso = E.paso + 1; aviso = null; guardar(); enviarAvance(true); render(); return; }
      if (x === 'chk1') return chk1();
      if (x === 'chk2') return chk2();
      if (x === 'chk3') return chk3();
      if (x === 'chk4f') return chk4f();
      if (x === 'chk4e') return chk4e();
      if (x === 'dejar') { const m = E.p4.m[E.p4.act]; m.ex.est = 'ok'; m.ex.min = false; aviso = { txt: 'Queda tu expresión (correcta, no mínima).', cls: 'info' }; guardar(); enviarAvance(true); render(); return; }
      if (x === 'sigmapa') return sigMapa();
      if (x === 'chk5') return chk5();
      if (x === 'chk6') return chk6();
      if (x === 'fin') return terminar();
      const ent = E && E.p5 && E.p5.e[E.p5.act];
      if (x === 'mas-and') { ent.p.push([]); guardar(); render5(); return; }
      if (x === 'c1' || x === 'c0') { ent.c = x === 'c1' ? 1 : 0; guardar(); render5(); return; }
      if (x === 'c-quitar') { ent.c = null; if (!ent.p.length) ent.p = [[]]; guardar(); render5(); return; }
    }
    if (!E) return;
    const nu = t.closest('[data-nu]');
    if (nu && !nu.disabled) {
      const s = +nu.dataset.nu, r = E.p1.nu.r, i = r.indexOf(s);
      if (i >= 0) r.splice(i, 1); else r.push(s);
      r.sort((p, q) => p - q);
      guardar(); render(); return;
    }
    const b2 = t.closest('[data-f2]');
    if (b2 && !b2.disabled) {
      const s = +b2.dataset.f2, j = +b2.dataset.j, f = E.p2.f[s], nuS = !CT.datos(E).usado(s), v = f.r[j];
      f.r[j] = v < 0 ? 0 : v === 0 ? 1 : v === 1 ? (nuS ? 2 : 0) : 0;
      b2.className = 'ct-bit ' + clsBit(f.r[j]);
      b2.textContent = CT.txtBit(f.r[j]);
      guardar();
      actualizarAccion2();
      return;
    }
    const c3 = t.closest('[data-f3]');
    if (c3 && !c3.disabled) {
      const s = +c3.dataset.f3, e = +c3.dataset.e, f = E.p3.f[s], v = f.r[e];
      f.r[e] = v < 0 ? 0 : v === 0 ? 1 : v === 1 ? 2 : 0;
      c3.className = 'ct-c ' + clsBit(f.r[e]) + ' ' + CT.clsIt(f);
      c3.textContent = CT.txtBit(f.r[e]);
      guardar();
      actualizarAccion3();
      return;
    }
    const mp = t.closest('[data-mapa]');
    if (mp) { E.p4.act = +mp.dataset.mapa; aviso = null; guardar(); render(); return; }
    const en = t.closest('[data-ent]');
    if (en) { E.p5.act = +en.dataset.ent; aviso = null; guardar(); render(); return; }
    const ch = t.closest('.ct-chip');
    if (ch && !ch.disabled) {
      const ent = E.p5.e[E.p5.act], k = +ch.closest('[data-g]').dataset.g, c = +ch.dataset.c, g = ent.p[k];
      const i = g.indexOf(c);
      if (i >= 0) g.splice(i, 1); else g.push(c);
      guardar(); render5(); return;
    }
    const xg = t.closest('[data-xg]');
    if (xg) { const ent = E.p5.e[E.p5.act]; ent.p.splice(+xg.dataset.xg, 1); if (!ent.p.length) ent.p = [[]]; guardar(); render5(); return; }
    const pr = t.closest('[data-pred]');
    if (pr) { E.p6.pred.r = +pr.dataset.pred; guardar(); render(); return; }
    const at = t.closest('[data-atr]');
    if (at) { E.p6.atr.r = at.dataset.atr === '1'; guardar(); render(); }
  });
  // en el paso 5 se repinta sin volver arriba de la página
  function render5() { const y = window.scrollY; aviso = null; render(); window.scrollTo(0, y); }
  function actualizarAccion2() {
    const vacias = E.p2.f.filter((f) => !CT.cerrado(f) && f.est !== 'dec' && f.r.some((x) => x < 0)).length;
    const b = document.querySelector('[data-a="chk2"]');
    if (!b) return;
    b.disabled = !!vacias || !puedeGuardar();
    b.nextElementSibling.textContent = vacias ? 'Faltan ' + vacias + ' fila' + (vacias > 1 ? 's' : '') + ' por llenar' : '2 intentos por fila';
  }
  function actualizarAccion3() {
    const vacias = E.p3.f.filter((f) => !CT.cerrado(f) && f.r.some((x) => x < 0)).length;
    const b = document.querySelector('[data-a="chk3"]');
    if (!b) return;
    b.disabled = !!vacias || !puedeGuardar();
    b.nextElementSibling.textContent = vacias ? 'Faltan ' + vacias + ' fila' + (vacias > 1 ? 's' : '') + ' por completar' : '2 intentos por fila';
  }

  // ---------------- arranque ----------------
  if (PRUEBA || !II.sb) {
    leida = true;
    if (alumno) { const a = asignacion(); if (a) { E = II.leer(kE(), null); if (!E || E.v !== a.v) E = nuevoE(a); guardar(); } }
    render();
  } else {
    render();
    II.seguirEstado(SID, alCambiarFila);
    vaciar();
    if (alumno) {
      // un ingreso por día (asistencia)
      const hoy = new Date().toISOString().slice(0, 10);
      if (II.leer('d2ct-ing-' + SID + '-' + alumno.carnet, '') !== hoy) { II.registrarIngreso(SID, alumno); II.guardar('d2ct-ing-' + SID + '-' + alumno.carnet, hoy); }
    }
  }
  // para las pruebas
  window.CT_EST = { estado: () => E, render };
})();
