// ============================================================
// Mi panel (estudiante): sesiones dadas, puntaje de cada día, promedio de participación y rúbrica del módulo
// Todo se calcula con las mismas reglas que el reporte del docente (lo realizado vale 100 %, penalización de la ruleta).
// ============================================================
(function () {
  const II = window.II;
  const main = II.$('#principal');
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const f1 = (x) => II.fmt(Math.round(x * 10) / 10, 1);

  const pintarLogin = (msg, pedirPin, previo) => {
    const anio = new Date().getFullYear();
    const sel = (name, ini, fin, rotulo, texto) => `<select class="entrada" name="${name}" required><option value="">${rotulo}</option>${Array.from({ length: Math.abs(fin - ini) + 1 }, (_, i) => {
      const v = ini <= fin ? ini + i : ini - i; return `<option value="${v}">${texto ? texto(v) : v}</option>`; }).join('')}</select>`;
    main.innerHTML = `<div class="contenido angosto"><div class="tarjeta">
      <span class="etiqueta">Mi panel</span><h2>Mis puntajes y mi avance</h2>
      <p class="sub">Entra con tu carnet y tu fecha de nacimiento.</p>
      <form id="f-panel" autocomplete="off">
        <label class="campo"><span>Carnet de identidad (solo el número)</span><input class="entrada" name="carnet" required inputmode="text" autocomplete="off" value="${II.esc((previo && previo.carnet) || '')}"></label>
        <div class="campo"><span>Fecha de nacimiento: <b>mes, día y año</b></span>
          <div style="display:grid;grid-template-columns:1.5fr 1fr 1.2fr;gap:8px">${sel('mes', 1, 12, 'Mes', (v) => MESES[v - 1])}${sel('dia', 1, 31, 'Día')}${sel('anio', anio - 16, 1950, 'Año')}</div></div>
        <label class="campo" id="c-pin" style="display:${pedirPin ? '' : 'none'}"><span>PIN</span><input class="entrada" name="pin" type="password" inputmode="numeric" autocomplete="off"></label>
        ${msg ? `<div class="aviso ${pedirPin && msg === II.MOTIVOS_ENTRADA.pin ? 'info' : 'mal'}">${II.esc(msg)}</div>` : ''}
        <button class="boton primario grande bloque" type="submit">Ver mi panel</button>
      </form></div></div>`;
    II.$('#f-panel').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      const dos = (n) => String(n).padStart(2, '0');
      const cred = { carnet: II.normCarnet(f.get('carnet')), fecha: `${f.get('anio')}-${dos(f.get('mes'))}-${dos(f.get('dia'))}`, pin: String(f.get('pin') || '') };
      cargar(cred);
    });
  };

  const cargar = async (cred) => {
    main.innerHTML = '<div class="contenido angosto"><div class="tarjeta"><p class="sub" style="margin:0">Cargando tu panel…</p></div></div>';
    const r = await II.panelEstudiante(cred.carnet, cred.fecha, cred.pin);
    if (!r.ok) {
      II.borrarCred();
      return pintarLogin(II.MOTIVOS_ENTRADA[r.motivo] || II.MOTIVOS_ENTRADA.red, r.motivo === 'pin' || r.motivo === 'pin_mal', cred);
    }
    II.guardarCred({ ...cred, nombre: r.nombre });
    pintarPanel(r);
  };

  const pintarPanel = (r) => {
    II.$('#b-usuario').innerHTML = `<span class="b-nombre">${II.esc(r.nombre)}</span><button class="boton chico" id="b-salir">Salir</button>`;
    II.$('#b-salir').onclick = () => { II.borrarCred(); Object.keys(localStorage).filter((k) => k.indexOf('pl-alumno-') === 0).forEach((k) => localStorage.removeItem(k)); location.reload(); };

    const MESD = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'], DSEM = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    const rotuloDia = (d) => { const [a, m, dd] = d.split('-').map(Number); const f = new Date(a, m - 1, dd); return DSEM[f.getDay()] + ' ' + dd + ' de ' + MESD[m - 1]; };
    const dias = (r.sesiones || []).filter((x) => II.SESIONES[x.sesion] && (x.realizadas || []).length > 0).map((x) => {
      const S = II.SESIONES[x.sesion];
      const mejor = {};
      (x.respuestas || []).forEach((q) => { if (q.intento <= 2) mejor[q.actividad] = Math.max(mejor[q.actividad] || 0, +q.puntaje || 0); });
      const n = II.notaDia(S, x.trasladados || [], x.realizadas, (id) => mejor[id] || 0, +x.no_responde || 0);
      return { x, S, mejor, n, asistio: !!x.ingreso };
    });
    const prom = dias.length ? dias.reduce((t, d) => t + d.n.final, 0) / dias.length : 0;
    const part = prom * 25 / 100;

    const rub = II.RUBRICA.map((q, i) => {
      const pts = q.id === 'part' ? `${f1(part)} / ${q.peso}` : `— / ${q.peso}`;
      const det = q.id === 'part' ? `Promedio de tus notas de participación: ${f1(prom)} % (${dias.length} ${dias.length === 1 ? 'día' : 'días'} de clase)` : 'Todavía no se evalúa';
      return `<div class="mp-rub"><div><b style="color:${II.COLORES_RUBRICA[i]}">${q.nombre}</b> <span class="nota">(${q.peso} %)</span><br><span class="nota">${det}</span></div><div class="mp-p"><b>${pts}</b></div></div>`;
    }).join('');

    const tarjetaDia = (d) => {
      const S = d.S, n = d.n;
      // solo las actividades que se hicieron en la clase (lo que no se alcanzó pertenece a la siguiente sesión)
      const filas = II.actividadesDe(S, d.x.trasladados || []).filter((a) => (d.x.realizadas || []).indexOf(a.id) >= 0)
        .map((a) => `<tr><td>${II.esc(a.nombre)}</td><td class="n">${f1(d.mejor[a.id] || 0)} / ${a.puntos}</td></tr>`).join('');
      return `<div class="mp-dia">
        <h3>Clase del ${rotuloDia(d.x.dia)}</h3>
        <div class="nota">${II.esc(S.titulo)}${d.asistio ? '' : '; <b style="color:#b3261e">no ingresaste a esta sesión</b>'}</div>
        ${II.tarjetaNotaDia(n)}
        <details><summary class="nota" style="cursor:pointer">Ver detalle por actividad</summary>
          <table class="mp-tabla"><tr><th>Actividad</th><th class="n">Tus puntos</th></tr>${filas}</table></details>
        <div class="controles" style="margin-top:10px"><a class="boton" href="clase.html?s=${II.esc(S.id)}&amp;modo=libre">Repasar esta sesión</a></div>
      </div>`;
    };

    main.innerHTML = `<div class="contenido angosto">
      <div class="tarjeta"><span class="etiqueta">Hola</span><h2 style="margin:4px 0 0">${II.esc(r.nombre)}</h2>
        <div class="mp-resumen"><div class="mp-caja"><b>${f1(prom)} %</b><span class="nota">Participación acumulada (promedio de los días)</span></div>
          <div class="mp-caja"><b>${f1(part)} / 25</b><span class="nota">Puntos de participación hasta hoy</span></div></div>
        <h3 style="margin:14px 0 4px">Rúbrica del módulo</h3>${rub}
        <p class="nota" style="margin-top:10px">Se irán llenando el control de estudio, el foro y el examen final a medida que se realicen.</p></div>
      <h3 style="margin:18px 0 0">Mis días de clase</h3>
      ${dias.length ? dias.map(tarjetaDia).join('') : '<div class="tarjeta"><p class="nota">Todavía no hay sesiones con puntaje.</p></div>'}
      <p class="nota" style="margin:16px 0">Cada día vale 100 % de lo que se hizo ese día. Si el docente te llama con la ruleta y no respondes, a ese día se le restan ${II.PENALIZACION} puntos porcentuales.</p>
    </div>`;
  };

  const c = II.leerCred();
  if (!II.configurado) main.innerHTML = '<div class="contenido angosto"><div class="tarjeta"><p class="sub">Este panel necesita la conexión con la base de datos.</p></div></div>';
  else if (c && c.carnet) cargar(c);
  else pintarLogin('');
})();
