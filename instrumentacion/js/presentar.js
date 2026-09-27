// ============================================================
// Vista de presentación (la que se comparte en Zoom)
// Sigue el paso que marca el docente desde el celular.
// ============================================================
(function () {
  const II = window.II;
  const SES = II.sesionActual();
  const S = II.SESIONES[SES];
  const cuerpo = II.$('#cuerpo');
  let paso = null, diagrama = null, sondeo = null, reloj = null, filaEstado = null, esDocente = false;
  const local = !II.configurado || II.params.get('modo') === 'local';
  let idxLocal = 0;

  II.$('#p-sesion').textContent = `Sesión ${S.numero} · ${S.titulo}`;
  II.$('#p-url').textContent = II.urlClase(SES).replace(/^https?:\/\//, '');
  II.alCambiarConexion((ok) => { II.$('#p-conexion').className = 'punto-conexion ' + (ok ? 'ok' : 'mal'); });

  const limpiar = () => {
    if (diagrama && diagrama.destruir) diagrama.destruir();
    diagrama = null;
    clearInterval(sondeo); clearInterval(reloj);
  };
  const ideas = (lista) => `<ul class="ideas">${lista.map((t, i) => `<li><b class="n">${i + 1}</b><span>${t}</span></li>`).join('')}</ul>`;
  const montar = (p, cont) => { const fn = II.diagramas[p.diagrama]; if (fn) diagrama = fn(cont, {}); };
  const conteo = async (act) => { const r = await II.resumen(SES, act); return r ? r : null; };

  const R = {
    async espera(p) {
      cuerpo.innerHTML = `
        <div class="pres-grid" style="align-items:center;min-height:68vh">
          <div>
            <span class="etiqueta">Diplomado · Módulo 1</span>
            <h1 class="pres-titulo" style="font-size:2.8rem">Instrumentación Industrial</h1>
            <p style="font-size:1.35rem;color:var(--texto-2);margin:0 0 6px">Sesión ${S.numero}: ${II.esc(S.titulo)}</p>
            <p class="nota" style="font-size:1rem">${II.esc(S.fecha)}</p>
            <div class="aviso info" style="font-size:1.05rem;max-width:560px;margin-top:22px">Entra desde tu celular o computadora con el código QR o el enlace del chat de Zoom. Ten a mano tu <b>carnet</b>.</div>
          </div>
          <div class="tarjeta" style="text-align:center">
            <div style="display:grid;place-items:center">${II.qrSVG(II.urlClase(SES), 260)}</div>
            <p class="nota" style="word-break:break-all;margin:8px 0 12px">${II.esc(II.urlClase(SES))}</p>
            ${local ? '' : '<div class="nota">Conectados</div><div class="grande-numero" id="n-con">—</div>'}
          </div>
        </div>`;
      if (!local) {
        const act = async () => { const r = await conteo('ingreso'); if (r && II.$('#n-con')) II.$('#n-con').textContent = r.total; };
        act(); sondeo = setInterval(act, 3000);
      }
    },

    async cuestionario(p) {
      cuerpo.innerHTML = `<div style="max-width:880px;margin:6vh auto;text-align:center">
        <span class="chip acento">Diagnóstico</span>
        <h1 class="pres-titulo" style="margin-top:12px">${II.esc(p.titulo)}</h1>
        <p style="font-size:1.25rem;color:var(--texto-2)">Responde en tu dispositivo. No tiene nota: me ayuda a saber desde dónde empezar.</p>
        ${local ? '' : `<div class="grande-numero" style="font-size:5rem;margin:26px 0 12px" id="n-env">—</div><div class="barra-prog" style="max-width:560px;margin:0 auto"><div id="b-env" style="width:0"></div></div>`}
      </div>`;
      if (!local) this._progreso('diagnostico');
    },

    _progreso(act) {
      const f = async () => {
        const [a, b] = await Promise.all([conteo(act), conteo('ingreso')]);
        if (!a || !b || !II.$('#n-env')) return;
        II.$('#n-env').textContent = `${a.total} de ${b.total}`;
        II.$('#b-env').style.width = (b.total ? Math.min(100, (a.total / b.total) * 100) : 0) + '%';
      };
      f(); sondeo = setInterval(f, 2500);
    },

    explica(p) {
      cuerpo.innerHTML = `<div class="pres-grid"><div id="diag"></div>
        <div class="pres-lado"><div><span class="chip acento">Ciclo ${p.ciclo} · Explicación</span><h1 class="pres-titulo" style="margin-top:10px;font-size:1.7rem">${II.esc(p.titulo)}</h1></div>
        <div class="tarjeta">${ideas(p.ideas)}</div></div></div>`;
      montar(p, II.$('#diag'));
    },

    explora(p) {
      cuerpo.innerHTML = `<div class="pres-grid"><div id="diag"></div>
        <div class="pres-lado"><div><span class="chip acento">Ciclo ${p.ciclo} · Exploración</span><h1 class="pres-titulo" style="margin-top:10px;font-size:1.7rem">Ahora te toca a ti</h1>
        <p class="nota" style="font-size:1rem">Abre el diagrama en tu dispositivo y responde:</p></div>
        <div class="tarjeta"><ul class="guia">${p.guia.map((t) => `<li><span>${t}</span></li>`).join('')}</ul></div></div></div>`;
      montar(p, II.$('#diag'));
    },

    reto(p) {
      const r = S.retos[p.reto];
      cuerpo.innerHTML = `<div style="max-width:960px;margin:5vh auto">
        <div class="controles"><span class="chip acento">Reto${p.ciclo ? ' · Ciclo ' + p.ciclo : ''}</span><span class="chip">Vale ${r.puntos} puntos</span><span class="chip">2 intentos · lo corregido vale la mitad</span></div>
        <h1 class="pres-titulo" style="margin-top:14px;font-size:2.4rem">${II.esc(r.titulo)}</h1>
        <p style="font-size:1.3rem;color:var(--texto-2)">${II.esc(r.general)}</p>
        <div class="aviso info" style="font-size:1.05rem">Cada estudiante tiene <b>valores distintos</b> generados con su carnet: compartir la respuesta no sirve 😉</div>
        ${local ? '' : `<div style="text-align:center;margin-top:34px"><div class="nota" style="font-size:1rem">Enviaron</div><div class="grande-numero" style="font-size:5rem;margin:6px 0 14px" id="n-env">—</div><div class="barra-prog" style="max-width:620px;margin:0 auto"><div id="b-env" style="width:0"></div></div></div>`}
      </div>`;
      if (!local) R._progreso(p.reto);
    },

    revisa(p) {
      const r = S.retos[p.reto];
      cuerpo.innerHTML = `<div style="max-width:1040px;margin:3vh auto">
        <span class="chip acento">Revisión</span>
        <h1 class="pres-titulo" style="margin-top:12px">${II.esc(r.titulo)}</h1>
        ${local ? '' : `<div class="tarjeta" style="margin:18px 0"><div class="barras-res" id="barras"><p class="nota">Cargando resultados…</p></div></div>`}
        <div class="pres-grid" style="grid-template-columns:1fr 1fr;margin-top:16px">
          <div class="tarjeta"><h3>Cómo se resuelve</h3><p style="font-family:var(--mono);font-size:1rem;line-height:1.7;margin:0">${II.esc(r.metodo).replace(/ · /g, '<br>')}</p></div>
          <div class="tarjeta" style="border-color:#f0d9a8;background:var(--duda-claro)"><h3>Error frecuente</h3><p style="font-size:1.05rem;margin:0">${II.esc(r.errorComun)}</p></div>
        </div>
        <p class="nota" style="margin-top:12px">Cada estudiante ve en su dispositivo la solución con sus propios valores.</p>
      </div>`;
      if (local) return;
      const f = async () => {
        const x = await conteo(p.reto);
        const b = II.$('#barras');
        if (!x || !b) return;
        const t = Math.max(1, x.total);
        const barra = (nombre, n, color) => `<div class="barra-res"><span>${nombre}</span><div class="pista"><div style="width:${(n / t) * 100}%;background:${color}"></div></div><span class="num">${n}</span></div>`;
        b.innerHTML = x.total
          ? barra('Correctas', x.correctas, 'var(--ok)') + barra('Incorrectas', x.total - x.correctas, 'var(--mal)') + barra('… y estaban seguros', x.seguros_errados, '#e8998f') + barra('Respondieron con dudas', x.dudosos, 'var(--duda)')
          : '<p class="nota">Nadie envió este reto todavía.</p>';
      };
      f(); sondeo = setInterval(f, 4000);
    },

    pausa(p) {
      cuerpo.innerHTML = `<div style="text-align:center;margin-top:10vh"><span class="chip acento">Pausa</span><h1 class="pres-titulo" style="margin-top:12px">Volvemos en</h1><div class="reloj" id="reloj">${p.minutos}:00</div></div>`;
      const inicio = filaEstado && filaEstado.paso === p.id ? new Date(filaEstado.actualizado).getTime() : Date.now();
      const tick = () => { const e = II.$('#reloj'); if (e) e.textContent = II.formatoReloj(p.minutos * 60 - (Date.now() - inicio) / 1000); };
      tick(); reloj = setInterval(tick, 1000);
    },

    cierre(p) {
      cuerpo.innerHTML = `<div style="max-width:900px;margin:5vh auto"><span class="chip acento">Cierre</span>
        <h1 class="pres-titulo" style="margin-top:12px">${II.esc(p.titulo)}</h1>
        <div class="tarjeta" style="margin-top:18px">${ideas(p.ideas)}</div>
        <div class="aviso info" style="font-size:1.05rem;margin-top:18px">${II.esc(S.siguiente)}</div></div>`;
    }
  };

  let ampliado = false;
  const botonAmpliar = () => {
    let b = II.$('#b-ampliar');
    const grid = II.$('.pres-grid');
    const tieneLado = grid && grid.querySelector('.pres-lado');
    if (!tieneLado) { if (b) b.remove(); return; }
    if (!b) {
      b = II.html('<button class="boton chico boton-ampliar" id="b-ampliar"></button>');
      document.body.appendChild(b);
      b.onclick = () => { ampliado = !ampliado; botonAmpliar(); };
    }
    grid.classList.toggle('ampliado', ampliado);
    b.textContent = ampliado ? '◂ Mostrar ideas' : 'Ampliar diagrama ▸';
  };
  const mostrar = (p) => {
    limpiar();
    paso = p;
    const i = II.indicePaso(SES, p.id);
    II.$('#p-paso').textContent = `${II.TIPOS[p.tipo]} · paso ${i + 1} de ${S.pasos.length}`;
    (R[p.tipo] || R.espera).call(R, p);
    botonAmpliar();
  };

  // navegación: modo local o docente conectado
  const irA = async (i) => {
    i = Math.max(0, Math.min(S.pasos.length - 1, i));
    if (local) { idxLocal = i; II.guardar('ii-pres-local-' + SES, i); return mostrar(S.pasos[i]); }
    if (esDocente) { mostrar(S.pasos[i]); await II.fijarPaso(SES, S.pasos[i].id); }
  };
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input,select,textarea')) return;
    const i = paso ? II.indicePaso(SES, paso.id) : 0;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') irA(i + 1);
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') irA(i - 1);
    if (e.key === 'a' || e.key === 'A') { ampliado = !ampliado; botonAmpliar(); }
  });
  II.$('#p-ant').onclick = () => irA((paso ? II.indicePaso(SES, paso.id) : 0) - 1);
  II.$('#p-sig').onclick = () => irA((paso ? II.indicePaso(SES, paso.id) : 0) + 1);

  if (local) {
    II.$('#p-modo').innerHTML = '<span class="chip duda">Modo ensayo (sin conexión)</span>';
    II.$('#p-nav').classList.remove('oculto');
    idxLocal = II.leer('ii-pres-local-' + SES, 0) || 0;
    mostrar(S.pasos[idxLocal]);
  } else {
    II.sb.auth.getSession().then(async ({ data }) => {
      if (data && data.session) {
        const r = await II.sb.from('docentes').select('email');
        esDocente = !r.error && r.data && r.data.length > 0;
        if (esDocente) II.$('#p-nav').classList.remove('oculto');
      }
    });
    II.seguirEstado(SES, (fila) => {
      filaEstado = fila;
      const p = S.pasos.find((x) => x.id === fila.paso) || S.pasos[0];
      if (!paso || p.id !== paso.id) mostrar(p);
    });
    setTimeout(() => { if (!paso) mostrar(S.pasos[0]); }, 6000);
  }
})();
