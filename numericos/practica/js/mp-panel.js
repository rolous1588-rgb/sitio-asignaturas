// ============================================================
// Métodos Numéricos · Práctica autónoma de raíces — panel del docente (celular)
// Abrir / cerrar la práctica (estado_sesion 'mn-practica': extra.asincrona, abre, cierra),
// quién practicó y con qué detalle, dónde fallan más, descarga para Excel y borrar pruebas.
// ============================================================
(function () {
  const $ = II.$;
  const $$ = II.$$;
  const SID = 'mn-practica';
  const MET = ['bis', 'fp', 'nr'];
  const URL_EST = new URL('index.html', location.href).href.split('?')[0];
  let fila = null;
  let datos = { resp: [], ing: [] };
  let alumnos = [];
  let timer = null;

  const esc = II.esc;
  const neg = (s) => String(s).replace(/^-/, '−');
  const hora = (t) => (t ? new Date(t).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : '—');
  const fechaHora = (t) => (t ? new Date(t).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');
  const pts = (x) => (x == null ? '—' : II.fmt(x, 2));

  function aviso(txt, cls = 'info') {
    const a = $('#aviso');
    a.className = 'aviso ' + cls;
    a.innerHTML = txt;
    clearTimeout(aviso.t);
    aviso.t = setTimeout(() => a.classList.add('oculto'), 4000);
  }

  function confirmar(titulo, texto, si = 'Sí', escribir) {
    return new Promise((res) => {
      const capa = II.html(`<div class="capa"><div class="dialogo"><h2>${titulo}</h2><p>${texto}</p>
        ${escribir ? `<input id="c-txt" placeholder="Escribe ${escribir}" autocomplete="off">` : ''}
        <div class="fila-bt"><button class="boton" data-r="0">Cancelar</button><button class="boton prim" data-r="1">${si}</button></div></div></div>`);
      document.body.appendChild(capa);
      capa.onclick = (e) => {
        const b = e.target.closest('[data-r]');
        if (!b && e.target !== capa) return;
        if (b && b.dataset.r === '1' && escribir && $('#c-txt').value.trim().toUpperCase() !== escribir) { $('#c-txt').focus(); return; }
        capa.remove();
        res(!!(b && b.dataset.r === '1'));
      };
    });
  }

  // ---------------- ingreso del docente ----------------
  async function esDocente() {
    try {
      const { data, error } = await II.sb.from('docentes').select('email').limit(1);
      return !error && !!(data && data.length);
    } catch (e) { return false; }
  }
  function vIngreso(msg) {
    $('#cont').innerHTML = `<div class="tarjeta"><span class="etq">Métodos Numéricos; práctica</span><h2>Panel del docente</h2>
      <p>Entra con tu cuenta docente (la misma de las otras materias).</p>
      <form id="f-doc"><label class="campo"><span>Correo</span><input name="email" type="email" required autocomplete="username"></label>
      <label class="campo"><span>Contraseña</span><input name="clave" type="password" required autocomplete="current-password"></label>
      <div class="aviso mal ${msg ? '' : 'oculto'}" id="f-err">${msg || ''}</div>
      <button class="boton prim bloque">Entrar</button></form></div>`;
    $('#f-doc').onsubmit = async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const err = $('#f-err');
      err.classList.remove('oculto');
      err.textContent = 'Entrando…';
      const { error } = await II.sb.auth.signInWithPassword({ email: String(fd.get('email')).trim(), password: String(fd.get('clave')) });
      if (error) { err.textContent = /fetch|network/i.test(error.message || '') ? 'Sin internet. Revisa la conexión.' : 'No se pudo entrar: revisa correo y contraseña.'; return; }
      if (!(await esDocente())) { err.textContent = 'Esta cuenta no tiene permiso de docente.'; await II.sb.auth.signOut(); return; }
      arrancar();
    };
  }

  // ---------------- estado de la práctica ----------------
  function estado() {
    const ex = (fila && fila.extra) || {};
    if (!ex.abre) return 'no-abierta';
    const t = Date.now();
    if (ex.cierra && t > new Date(ex.cierra).getTime()) return 'cerrada';
    return 'abierta';
  }
  async function leerFila() {
    const { data } = await II.sb.from('estado_sesion').select('*').eq('sesion', SID).maybeSingle();
    if (!data) {
      // la crea si no existe (práctica asíncrona, sin abrir)
      const nueva = { sesion: SID, paso: 'inicio', extra: { asincrona: true, abre: null, cierra: null } };
      const { data: d2 } = await II.sb.from('estado_sesion').insert(nueva).select().maybeSingle();
      fila = d2 || nueva;
    } else fila = data;
  }
  async function cambiarExtra(cambios, texto) {
    const extra = { ...((fila && fila.extra) || {}), asincrona: true, ...cambios };
    const { data, error } = await II.sb.from('estado_sesion').update({ extra, actualizado: new Date().toISOString() }).eq('sesion', SID).select();
    if (error || !data || !data.length) { aviso('No se pudo guardar el cambio. Revisa la conexión.', 'mal'); return; }
    fila = data[0];
    aviso(texto, 'ok');
    pintarEstado();
  }

  function pintarEstado() {
    const est = estado();
    const ex = (fila && fila.extra) || {};
    const pill = { abierta: ['ok', 'Abierta'], cerrada: ['mal', 'Cerrada'], 'no-abierta': ['duda', 'Aún no abierta'] }[est];
    let det = '';
    if (est === 'abierta') det = `Abierta desde las ${hora(ex.abre)}${ex.cierra ? `; se cierra sola a las <b>${hora(ex.cierra)}</b>` : '; sin hora de cierre'}`;
    else if (est === 'cerrada') det = `Se cerró a las ${hora(ex.cierra)}`;
    else det = 'Los estudiantes ven «La práctica aún no está abierta».';
    $('#estado').innerHTML = `<div class="mpp-estado"><span class="mpp-pill ${pill[0]}">${pill[1]}</span><span>${det}</span></div>
      <div class="mpp-bt">
        ${est !== 'abierta' ? '<button class="boton prim" id="b-abrir">Abrir ahora</button>' : '<button class="boton" id="b-cerrar" style="border-color:var(--mal);color:var(--mal)">Cerrar ahora</button>'}
      </div>
      <div class="mpp-prog"><label>Cerrar sola a las <input type="time" id="t-cierre" value="${ex.cierra && est === 'abierta' ? new Date(ex.cierra).toTimeString().slice(0, 5) : '15:50'}"></label>
        <button class="boton" id="b-prog">${ex.cierra && est === 'abierta' ? 'Cambiar hora' : 'Programar cierre'}</button>
        ${ex.cierra && est === 'abierta' ? '<button class="boton" id="b-sinhora">Quitar hora</button>' : ''}</div>`;
    const ab = $('#b-abrir');
    if (ab) ab.onclick = () => cambiarExtra({ abre: new Date(Date.now() - 10000).toISOString(), cierra: ex.cierra && new Date(ex.cierra).getTime() > Date.now() ? ex.cierra : null }, 'Práctica abierta.');
    const ce = $('#b-cerrar');
    if (ce) ce.onclick = async () => { if (await confirmar('¿Cerrar la práctica?', 'Los estudiantes ya no podrán seguir practicando (su avance queda guardado en su celular). Puedes volver a abrirla.', 'Sí, cerrar')) cambiarExtra({ cierra: new Date().toISOString() }, 'Práctica cerrada.'); };
    $('#b-prog').onclick = () => {
      const v = $('#t-cierre').value;
      if (!v) return;
      const [h, m] = v.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      if (d.getTime() < Date.now()) { aviso('Esa hora ya pasó. Elige una hora futura de hoy.', 'mal'); return; }
      const abre = ex.abre && est === 'abierta' ? ex.abre : null;
      cambiarExtra({ cierra: d.toISOString(), abre }, abre ? `Se cerrará sola a las ${v}.` : `Cierre programado a las ${v}. Falta tocar «Abrir ahora».`);
    };
    const sh = $('#b-sinhora');
    if (sh) sh.onclick = () => cambiarExtra({ cierra: null }, 'Sin hora de cierre.');
  }

  // ---------------- datos ----------------
  async function todas(tabla, campos) {
    const out = [];
    for (let desde = 0; ; desde += 1000) {
      const { data, error } = await II.sb.from(tabla).select(campos).eq('sesion', SID).order('id').range(desde, desde + 999);
      if (error) throw error;
      out.push(...data);
      if (data.length < 1000) break;
    }
    return out;
  }
  async function cargar() {
    try {
      const [resp, ing] = await Promise.all([
        todas('respuestas', 'id,actividad,carnet,nombre,respuesta,correcta,intento,puntaje,creado'),
        todas('ingresos', 'id,carnet,nombre,info,creado')
      ]);
      datos = { resp, ing };
      II.marcarConexion(true);
      agrupar();
      pintarDatos();
    } catch (e) {
      II.marcarConexion(false);
      aviso('No se pudieron leer los datos. Revisa la conexión.', 'mal');
    }
  }

  function agrupar() {
    const g = {};
    const de = (carnet, nombre) => (g[carnet] = g[carnet] || { carnet, nombre, info: {}, primero: null, ultimo: null, red: {}, met: { bis: {}, fp: {}, nr: {} }, fin: { bis: [], fp: [], nr: [] }, registros: 0 });
    const tiempo = (a, t) => { if (!a.primero || t < a.primero) a.primero = t; if (!a.ultimo || t > a.ultimo) a.ultimo = t; };
    datos.ing.forEach((r) => { const a = de(r.carnet, r.nombre); a.info = { ...a.info, ...(r.info || {}) }; a.nombre = r.nombre; a.ingreso = a.ingreso || r.creado; tiempo(a, r.creado); });
    datos.resp.forEach((r) => {
      const a = de(r.carnet, r.nombre);
      const x = r.respuesta || {};
      tiempo(a, r.creado);
      if (r.actividad === 'ingreso') { a.info = { ...x, ...a.info }; return; }
      a.registros++;
      if (r.actividad === 'red') {
        const k = x.serie + '|' + x.id;
        a.red[k] = a.red[k] || { id: x.id, serie: x.serie, ok: false, int: 0 };
        a.red[k].ok = a.red[k].ok || !!x.ok;
        a.red[k].int = Math.max(a.red[k].int, x.int || 1);
        return;
      }
      const m = r.actividad.replace(/-fin$/, '');
      if (!MET.includes(m)) return;
      if (r.actividad.endsWith('-fin')) { a.fin[m].push({ s: x.s, pts: Number(x.pts), fun: x.fun, t: r.creado, tabla: x.tabla, der: x.der }); return; }
      const it = (a.met[m][x.s] = a.met[m][x.s] || { s: x.s, fun: x.fun, filas: {}, der: null, pts: 0, t: r.creado });
      it.t = r.creado;
      if (x.fun) it.fun = x.fun;
      if (x.fila === 0) { it.der = { t: x.der, ok: !!x.ok }; return; }
      const f = (it.filas[x.fila] = it.filas[x.fila] || { primero: null, ultimo: null });
      if (x.chk === 1 && !f.primero) f.primero = x;
      f.ultimo = x;
      if (x.pts != null) it.pts = Number(x.pts);
    });
    alumnos = Object.values(g).map((a) => {
      const res = {};
      MET.forEach((m) => {
        const its = Object.values(a.met[m]).sort((p, q) => (p.t < q.t ? -1 : 1));
        const act = its[its.length - 1] || null;
        const fins = a.fin[m];
        const ultFin = fins.length ? fins[fins.length - 1] : null;
        const filasHechas = act ? Object.values(act.filas).filter((f) => f.ultimo && f.ultimo.lista).length : 0;
        res[m] = { funciones: its.length, terminadas: fins.length, ultFin, act, filasHechas, der: act && act.der };
      });
      const redV = Object.values(a.red);
      const todos = MET.every((m) => res[m].ultFin);
      const total = MET.reduce((s, m) => s + (res[m].ultFin ? res[m].ultFin.pts : 0), 0);
      return { ...a, res, redBien: redV.filter((x) => x.ok).length, redHechos: redV.length, total: todos ? total : null, parcial: total, minutos: a.primero && a.ultimo ? Math.round((new Date(a.ultimo) - new Date(a.primero)) / 60000) : 0 };
    }).sort((p, q) => String(p.nombre).localeCompare(String(q.nombre)));
  }

  // ---------------- pintar ----------------
  const ETQ = {
    ini: 'f(Xa) y f(Xb) de la fila 1', copia: 'Copiar extremos y sus f', xr: 'Xr', fr: 'f(Xr)', er: 'Error %', dec: '¿Qué extremo reemplaza Xr?',
    der: 'Elegir la derivada', xn: 'Copiar Xₙ', fx: 'f(Xₙ)', dfx: "f'(Xₙ)", x1: 'Xₙ₊₁'
  };
  const ORDEN = { bis: ['ini', 'xr', 'fr', 'er', 'dec', 'copia'], fp: ['ini', 'xr', 'fr', 'er', 'dec', 'copia'], nr: ['der', 'fx', 'dfx', 'x1', 'er', 'xn'] };
  function grupo(m, filaN, id) {
    if (m === 'nr') return id;
    if (['xa', 'xb', 'fa', 'fb'].includes(id)) return filaN === 1 ? 'ini' : 'copia';
    return id;
  }
  function fallas() {
    const c = { bis: {}, fp: {}, nr: {} };
    const sumar = (m, k, r) => { const x = (c[m][k] = c[m][k] || { n: 0, ok: 0, red: 0, mal: 0 }); x.n++; x[r] = (x[r] || 0) + 1; };
    datos.resp.forEach((r) => {
      const x = r.respuesta || {};
      if (!MET.includes(r.actividad)) return;
      if (x.fila === 0) { sumar('nr', 'der', x.ok ? 'ok' : 'mal'); return; }
      if (x.chk !== 1 || !x.cel) return;
      Object.entries(x.cel).forEach(([id, v]) => { if (v && v[0]) sumar(r.actividad, grupo(r.actividad, x.fila, id), v[0]); });
    });
    return c;
  }

  function pintarDatos() {
    const n = alumnos.length;
    const practicaron = alumnos.filter((a) => a.registros > 0).length;
    const term = (m) => alumnos.filter((a) => a.res[m].terminadas).length;
    const conTotal = alumnos.filter((a) => a.total != null);
    const prom = conTotal.length ? conTotal.reduce((s, a) => s + a.total, 0) / conTotal.length : null;
    $('#resumen').innerHTML = `<div class="mpp-met"><div><span>Entraron</span><b>${n}</b></div><div><span>Practicaron</span><b>${practicaron}</b></div>
      <div><span>Terminaron los 3</span><b>${conTotal.length}</b></div><div><span>Promedio (como examen)</span><b>${prom == null ? '—' : II.fmt(prom, 1)}</b></div></div>
      <p class="mp-nota" style="margin:8px 0 0">Terminaron: Bisección ${term('bis')}; Falsa posición ${term('fp')}; Newton ${term('nr')}. Actualizado a las ${hora(new Date())}</p>`;

    const F = fallas();
    $('#fallas').innerHTML = MET.map((m) => {
      const filas = ORDEN[m].filter((k) => F[m][k]).map((k) => {
        const x = F[m][k];
        const pm = Math.round((x.mal / x.n) * 100), pr = Math.round((x.red / x.n) * 100);
        return `<div class="mpp-falla"><span class="t">${ETQ[k]}</span><span class="bar"><i class="mal" style="width:${pm}%"></i><i class="red" style="width:${pr}%"></i></span><span class="n">${pm + pr}%</span></div>`;
      }).join('');
      return `<div class="mpp-bloque"><b>${MP.METODOS[m].titulo}</b>${filas || '<p class="mp-nota">Aún sin datos.</p>'}</div>`;
    }).join('') + '<p class="mp-nota">Porcentaje de casillas con error en el <b>primer intento</b>: <span style="color:var(--mal)">■</span> error; <span style="color:var(--duda)">■</span> solo redondeo.</p>';

    $('#lista').innerHTML = alumnos.length ? alumnos.map((a, i) => {
      const chip = (m) => {
        const r = a.res[m];
        if (r.ultFin) return `<span class="mpp-c ok">${MP.METODOS[m].titulo.split(' ')[0]} ${pts(r.ultFin.pts)}/${MP.METODOS[m].max}</span>`;
        if (r.act) return `<span class="mpp-c">${MP.METODOS[m].titulo.split(' ')[0]} fila ${Math.min(3, r.filasHechas + 1)}</span>`;
        return `<span class="mpp-c vacio">${MP.METODOS[m].titulo.split(' ')[0]} —</span>`;
      };
      return `<button class="mpp-al" data-al="${i}"><div class="l1"><b>${esc(a.nombre)}</b><span class="tot">${a.total != null ? pts(a.total) + '/100' : a.registros ? 'en curso' : 'solo entró'}</span></div>
        <div class="l2">${esc(a.info.carrera || '')}; C.U. ${esc(a.carnet)}; de ${hora(a.primero)} a ${hora(a.ultimo)} (${a.minutos} min)</div>
        <div class="l3"><span class="mpp-c">Redondeo ${a.redBien}/${Math.max(8, a.redHechos)}</span>${MET.map(chip).join('')}${a.res.nr.der ? `<span class="mpp-c ${a.res.nr.der.ok ? 'ok' : 'mal'}">f' ${a.res.nr.der.ok ? '✓' : '✗'}</span>` : ''}</div></button>`;
    }).join('') : '<p class="mp-nota">Todavía no entró nadie.</p>';
    $$('[data-al]').forEach((b) => { b.onclick = () => detalle(alumnos[Number(b.dataset.al)]); });
  }

  // ---------------- detalle de un estudiante ----------------
  const SIMB = { ok: '✓', red: '≈', mal: '✗' };
  const FIN = { ok1: 'bien', ok2: 'bien al 2.º', rev: 'mostrado', aj: 'ajustado', dep: 'con sus números', mal: '✗', red: '≈' };
  function detalle(a) {
    const bloques = MET.map((m) => {
      const its = Object.values(a.met[m]).sort((p, q) => (p.t < q.t ? -1 : 1));
      if (!its.length) return `<div class="mpp-det"><b>${MP.METODOS[m].titulo}</b><p class="mp-nota">No empezó.</p></div>`;
      return `<div class="mpp-det"><b>${MP.METODOS[m].titulo}</b>${its.map((it, k) => {
        const fin = a.fin[m].find((f) => f.s === it.s);
        const filas = Object.keys(it.filas).sort().map((nf) => {
          const f = it.filas[nf];
          const p = f.primero || f.ultimo;
          const u = f.ultimo;
          const cel = Object.keys(p.cel || {}).map((id) => {
            const r1 = p.cel[id][0], fn = u.cel && u.cel[id] ? u.cel[id][1] : '';
            const v = id === 'dec' ? (p.vals[id] === 'a' ? 'Xa' : p.vals[id] === 'b' ? 'Xb' : '—') : neg(p.vals[id] || '—');
            return `<span class="mpp-cel ${r1}">${id === 'dec' ? 'extremo' : id} <b>${esc(v)}</b> ${SIMB[r1] || ''}${fn && !/^ok1$/.test(fn) ? ` <small>→ ${FIN[fn] || fn}</small>` : ''}</span>`;
          }).join('');
          return `<div class="mpp-dfila"><span class="nf">Fila ${nf}; ${u.chk || 1} intento${(u.chk || 1) > 1 ? 's' : ''}${u.lista ? '' : '; sin terminar'}</span>${cel}</div>`;
        }).join('');
        return `<div class="mpp-int"><div class="cab">Función ${k + 1}: <span class="mono">${esc(it.fun || '')}</span>; ${fin ? `<b>${pts(fin.pts)}/${MP.METODOS[m].max}</b>` : 'sin terminar'}</div>
          ${it.der ? `<div class="mpp-dfila"><span class="mpp-cel ${it.der.ok ? 'ok' : 'mal'}">derivada <b>${esc(it.der.t)}</b> ${it.der.ok ? '✓' : '✗'}</span></div>` : ''}${filas}</div>`;
      }).join('')}</div>`;
    }).join('');
    const red = Object.values(a.red).sort((p, q) => p.serie - q.serie || String(p.id).localeCompare(q.id));
    const capa = II.html(`<div class="capa"><div class="dialogo ancho mpp-dialogo">
      <h2>${esc(a.nombre)}</h2>
      <p class="mp-nota">C.U. ${esc(a.carnet)}; C.I. ${esc(a.info.ci || '—')}; ${esc(a.info.carrera || '')}<br>Entró ${fechaHora(a.primero)}; último movimiento ${fechaHora(a.ultimo)}; ${a.minutos} min</p>
      <div class="mpp-det"><b>Regla de redondeo</b><div class="mpp-dfila">${red.length ? red.map((x) => `<span class="mpp-cel ${x.ok ? 'ok' : 'mal'}">serie ${x.serie + 1}; ${x.id} ${x.ok ? '✓' : '✗'}${x.int > 1 ? ' <small>(2 int.)</small>' : ''}</span>`).join('') : '<span class="mp-nota">No hizo ejercicios.</span>'}</div></div>
      ${bloques}
      <p class="mp-nota">Primer intento: ✓ bien; ≈ solo redondeo; ✗ error. Después de la flecha, cómo quedó la casilla.</p>
      <div class="fila-bt"><button class="boton" id="d-borrar" style="color:var(--mal);border-color:var(--mal)">Borrar sus datos</button><button class="boton prim" id="d-cerrar">Cerrar</button></div>
    </div></div>`);
    document.body.appendChild(capa);
    capa.onclick = (e) => { if (e.target === capa) capa.remove(); };
    $('#d-cerrar').onclick = () => capa.remove();
    $('#d-borrar').onclick = async () => {
      capa.remove();
      if (!(await confirmar('¿Borrar sus datos?', `Se borra todo lo que envió <b>${esc(a.nombre)}</b> en esta práctica. Úsalo para tus pruebas.`, 'Sí, borrar'))) return;
      await borrar(a.carnet);
    };
  }

  async function borrar(carnet) {
    let q1 = II.sb.from('respuestas').delete().eq('sesion', SID);
    let q2 = II.sb.from('ingresos').delete().eq('sesion', SID);
    if (carnet) { q1 = q1.eq('carnet', carnet); q2 = q2.eq('carnet', carnet); }
    const [r1, r2] = await Promise.all([q1, q2]);
    if (r1.error || r2.error) aviso('No se pudo borrar. Revisa la conexión.', 'mal');
    else aviso('Datos borrados.', 'ok');
    cargar();
  }

  // ---------------- descarga para Excel ----------------
  function descargar() {
    const cel = (v) => { const s = String(v == null ? '' : v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const num = (x) => (x == null ? '' : String(Math.round(x * 100) / 100).replace('.', ','));
    const cab = ['C.U.', 'C.I.', 'Apellidos', 'Nombres', 'Carrera', 'Entró', 'Último movimiento', 'Minutos', 'Redondeo bien', 'Redondeo hechos'];
    MET.forEach((m) => { const t = MP.METODOS[m].titulo; cab.push(`${t}: último (de ${MP.METODOS[m].max})`, `${t}: funciones terminadas`, `${t}: funciones empezadas`); });
    cab.push('Derivada (último intento)', 'Total como examen (/100)');
    const filas = [cab.map(cel).join(';')];
    alumnos.forEach((a) => {
      const [ap, no] = String(a.nombre || '').split(', ');
      const f = [a.carnet, a.info.ci || '', a.info.apellidos || ap || '', a.info.nombres || no || '', a.info.carrera || '', fechaHora(a.primero), fechaHora(a.ultimo), a.minutos, a.redBien, a.redHechos];
      MET.forEach((m) => { const r = a.res[m]; f.push(r.ultFin ? num(r.ultFin.pts) : '', r.terminadas, r.funciones); });
      f.push(a.res.nr.der ? (a.res.nr.der.ok ? 'bien' : 'mal') : '', a.total != null ? num(a.total) : '');
      filas.push(f.map(cel).join(';'));
    });
    const blob = new Blob(['﻿' + filas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'practica-raices-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // ---------------- armado ----------------
  function vPanel() {
    $('#cont').innerHTML = `
      <div class="aviso oculto" id="aviso"></div>
      <div class="tarjeta"><span class="etq">Práctica de raíces; ensayo del examen</span><h2>Abrir y cerrar</h2><div id="estado"></div></div>
      <div class="tarjeta"><span class="etq">Enlace para los estudiantes</span>
        <p class="mono mpp-url">${esc(URL_EST)}</p>
        <div class="mpp-bt"><button class="boton prim" id="b-compartir">Compartir</button><button class="boton" id="b-copiar">Copiar enlace</button>
        <a class="boton" href="index.html?modo=prueba" target="_blank" rel="noopener">Probar (sin guardar)</a></div></div>
      <div class="tarjeta"><span class="etq">Resumen</span><div id="resumen"><p class="mp-nota">Cargando…</p></div>
        <div class="mpp-bt" style="margin-top:10px"><button class="boton" id="b-act">Actualizar</button><button class="boton" id="b-csv">Descargar para Excel</button></div></div>
      <div class="tarjeta"><span class="etq">Dónde fallan más</span><div id="fallas"></div></div>
      <div class="tarjeta"><span class="etq">Quién practicó</span><p class="mp-nota">Toca un nombre para ver todo su detalle.</p><div id="lista"></div></div>
      <div class="tarjeta"><span class="etq">Pruebas</span><p class="mp-nota">Para borrar solo tus pruebas, abre tu nombre en la lista y toca «Borrar sus datos».</p>
        <button class="boton" id="b-borrar-todo" style="color:var(--mal);border-color:var(--mal)">Borrar todos los datos de esta práctica</button>
        <button class="boton" id="b-salir" style="margin-left:6px">Salir</button></div>`;
    pintarEstado();
    $('#b-act').onclick = () => { leerFila().then(pintarEstado); cargar(); };
    $('#b-csv').onclick = descargar;
    $('#b-copiar').onclick = async () => { try { await navigator.clipboard.writeText(URL_EST); aviso('Enlace copiado.', 'ok'); } catch (e) { aviso('Mantén presionado el enlace para copiarlo.', 'info'); } };
    $('#b-compartir').onclick = async () => {
      const texto = 'Práctica de Métodos Numéricos (raíces), ensayo del examen. No tiene nota: ' + URL_EST;
      if (navigator.share) { try { await navigator.share({ title: 'Práctica de raíces', text: texto }); } catch (e) { /* cancelado */ } }
      else location.href = 'https://wa.me/?text=' + encodeURIComponent(texto);
    };
    $('#b-borrar-todo').onclick = async () => { if (await confirmar('¿Borrar todo?', 'Se borran los datos de <b>todos</b> los estudiantes en esta práctica. No se puede deshacer.', 'Borrar todo', 'BORRAR')) borrar(null); };
    $('#b-salir').onclick = async () => { await II.sb.auth.signOut(); location.reload(); };
  }

  async function arrancar() {
    $('#cont').innerHTML = '<div class="tarjeta"><p>Cargando…</p></div>';
    await leerFila();
    vPanel();
    cargar();
    clearInterval(timer);
    timer = setInterval(() => { leerFila().then(pintarEstado); cargar(); }, 30000);
  }

  II.alCambiarConexion((ok) => { const d = $('#e-con'); d.classList.toggle('on', ok); d.classList.toggle('off', !ok); });
  (async () => {
    if (!II.sb) { $('#cont').innerHTML = '<div class="tarjeta"><div class="aviso mal">No se pudo conectar con la base de datos. Revisa internet y recarga.</div></div>'; return; }
    const { data } = await II.sb.auth.getSession();
    if (data && data.session && (await esDocente())) arrancar();
    else vIngreso();
  })();
})();
