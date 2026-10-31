// ============================================================
// Enclavamiento (marcha-paro con memoria) — Sesión 1, Bloque D
//   II.diagramas.enclav → cuatro representaciones del mismo programa con un panel de simulación común:
//     GRAFCET → logigrama → ecuaciones lógicas → diagrama de escalera, más un editor por casilleros
//   PL.ENCLAV (variantes A–D) y PL.verificarEc (validación por tabla de verdad), que usa también el reto.
//
// Convenciones (direcciones genéricas del curso):
//   ED1.00 Marcha (pulsador NA); ED1.01 Paro (NC); ED1.02 Emergencia (NC); SD2.00 Motor.
//   Los contactos NC dan 1 en reposo: por eso, en las ecuaciones, P y E valen 1 mientras nadie las pulsa.
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  II.diagramas = II.diagramas || {};
  const PL = (II.pl = II.pl || {});
  const esc = (s) => II.esc(s);

  // ---------- variantes del ejercicio ----------
  // vars: variables de entrada (se enumeran todas las combinaciones); lits: opciones de cada casillero
  // plantilla: partes del texto con casilleros (números = índice del casillero)
  PL.ENCLAV = {
    A: {
      id: 'A', nombre: 'A. Arranque simple con enclavamiento',
      desc: 'Una bomba se arranca con un pulsador de marcha <b>M</b> (ED1.00). Debe quedarse funcionando sola al soltar M (<b>enclavamiento</b>) y detenerse con el paro <b>P</b> (ED1.01, NC) o con la emergencia <b>E</b> (ED1.02, NC). La salida es <b>Q</b> (SD2.00).',
      vars: ['M', 'Q', 'P', 'E'], lits: ['M', 'Q', 'P', 'E', '/M', '/Q', '/P', '/E'],
      plantilla: ['Q = ( ', 0, ' + ', 1, ' ) · ', 2, ' · ', 3],
      ev: (l) => (l(0) || l(1)) && l(2) && l(3),
      meta: (v) => (v.M || v.Q) && v.P && v.E,
      pistas: 'Piensa en dos ramas en paralelo (quien arranca: el pulsador o la propia salida) y dos condiciones de seguridad en serie.'
    },
    B: {
      id: 'B', nombre: 'B. Dos puntos de arranque',
      desc: 'La misma bomba puede arrancarse desde <b>dos puestos</b>: marcha local <b>M1</b> (ED1.00) o marcha remota <b>M2</b> (ED1.03). Se mantiene enclavada y se detiene con el paro <b>P</b> (ED1.01, NC) o la emergencia <b>E</b> (ED1.02, NC). La salida es <b>Q</b> (SD2.00).',
      vars: ['M1', 'M2', 'Q', 'P', 'E'], lits: ['M1', 'M2', 'Q', 'P', 'E', '/M1', '/M2', '/Q', '/P', '/E'],
      plantilla: ['Q = ( ', 0, ' + ', 1, ' + ', 2, ' ) · ', 3, ' · ', 4],
      ev: (l) => (l(0) || l(1) || l(2)) && l(3) && l(4),
      meta: (v) => (v.M1 || v.M2 || v.Q) && v.P && v.E,
      pistas: 'Los dos pulsadores de marcha están en paralelo con el enclavamiento: cualquiera de los tres mantiene la rama cerrada.'
    },
    C: {
      id: 'C', nombre: 'C. Con temporizador de seguridad de 3 s',
      desc: 'La bomba se arranca con <b>M</b> (ED1.00) y se mantiene enclavada. Un temporizador <b>T</b> (marca interna) se activa si la bomba lleva <b>3 s</b> en marcha sin que el sensor de flujo lo confirme: entonces debe <b>detenerse</b> y quedar la alarma. También se detiene con <b>P</b> (ED1.01, NC) o <b>E</b> (ED1.02, NC). La salida es <b>Q</b> (SD2.00). Considera <b>T = 1</b> cuando el temporizador se cumplió.',
      vars: ['M', 'Q', 'P', 'E', 'T'], lits: ['M', 'Q', 'P', 'E', 'T', '/M', '/Q', '/P', '/E', '/T'],
      plantilla: ['Q = ( ', 0, ' + ', 1, ' ) · ', 2, ' · ', 3, ' · ', 4],
      ev: (l) => (l(0) || l(1)) && l(2) && l(3) && l(4),
      meta: (v) => (v.M || v.Q) && v.P && v.E && !v.T,
      pistas: 'Es el programa de la variante A con una condición más en serie: la bomba solo puede quedar activa si el temporizador todavía NO se cumplió.'
    },
    D: {
      id: 'D', nombre: 'D. Con prioridad al arranque (set / reset)',
      desc: 'Se usa la lógica de <b>set y reset</b>. <b>Set</b>: la marcha <b>M</b> (ED1.00) conecta la bomba siempre que la emergencia <b>E</b> (ED1.02, NC) esté en reposo; <b>M tiene prioridad</b> sobre el paro. <b>Reset</b>: el paro <b>P</b> (ED1.01, NC) o la emergencia desconectan. La salida es <b>Q</b> (SD2.00).',
      vars: ['M', 'Q', 'P', 'E'], lits: ['M', 'Q', 'P', 'E', '/M', '/Q', '/P', '/E'],
      plantilla: ['Q = ', 0, ' · ', 1, ' + ', 2, ' · ', 3, ' · ', 4],
      ev: (l) => (l(0) && l(1)) || (l(2) && l(3) && l(4)),
      meta: (v) => (v.M && v.E) || (v.Q && v.P && v.E),
      pistas: 'Hay dos términos sumados: el «set» (marcha con emergencia en reposo) y el «mantener» (la salida sigue mientras no haya paro ni emergencia).'
    }
  };

  // número de casilleros por variante
  PL.nCasilleros = (v) => PL.ENCLAV[v].plantilla.filter((x) => typeof x === 'number').length;

  // evalúa un literal ("P" o "/P") con los valores de las variables
  const lit = (v, s) => (s && s[0] === '/' ? (v[s.slice(1)] ? 0 : 1) : (v[s] ? 1 : 0));
  // todas las combinaciones de las variables de la variante
  PL.combinaciones = (vars) => {
    const out = [];
    for (let i = 0; i < 1 << vars.length; i++) {
      const v = {};
      vars.forEach((n, k) => (v[n] = (i >> (vars.length - 1 - k)) & 1));
      out.push(v);
    }
    return out;
  };
  // validación por tabla de verdad → { ok, fallo: { vals, esperado, obtenido } | null, completa }
  PL.verificarEc = (variante, sl) => {
    const V = PL.ENCLAV[variante];
    if (!sl || sl.length < PL.nCasilleros(variante) || sl.some((x) => !x)) return { ok: false, completa: false, fallo: null };
    for (const v of PL.combinaciones(V.vars)) {
      const esperado = V.meta(v) ? 1 : 0;
      const obtenido = V.ev((i) => lit(v, sl[i])) ? 1 : 0;
      if (esperado !== obtenido) return { ok: false, completa: true, fallo: { vals: v, esperado, obtenido } };
    }
    return { ok: true, completa: true, fallo: null };
  };
  // cuántas combinaciones dan Q = 1
  PL.cuentaUnos = (variante) => {
    const V = PL.ENCLAV[variante];
    return PL.combinaciones(V.vars).filter((v) => V.meta(v)).length;
  };
  // texto de la ecuación correcta (para la solución)
  PL.ecuacionTexto = (variante) => ({
    A: 'Q = (M + Q) · P · E', B: 'Q = (M1 + M2 + Q) · P · E', C: 'Q = (M + Q) · P · E · /T', D: 'Q = M · E + Q · P · E'
  }[variante]);

  // ============================================================
  // Diagrama
  // ============================================================
  II.diagramas.enclav = function (cont, opts = {}) {
    opts = opts || {};
    const ms = { marcha: false, paro: false, emerg: false, Q: false };
    let pulsoM = 0, pulsoP = 0;
    cont.classList.add('diagrama');
    cont.innerHTML = `
      <div class="panel-sim" id="sim">
        <div class="sim-botones">
          <button type="button" class="boton primario grande" id="b-marcha">Marcha</button>
          <button type="button" class="boton grande" id="b-paro">Paro</button>
          <button type="button" class="boton grande peligro" id="b-emerg">Emergencia</button>
        </div>
        <div class="sim-motor"><svg viewBox="0 0 90 90" width="76" height="76" id="motor"></svg><div id="sim-txt" class="sim-txt"></div></div>
      </div>
      <div id="vistas"></div>`;
    const T = PL.pestanas(cont.querySelector('#vistas'), [
      { id: 'gr', t: '1 · GRAFCET' }, { id: 'lg', t: '2 · Logigrama' }, { id: 'ec', t: '3 · Ecuaciones' }, { id: 'es', t: '4 · Escalera' }, { id: 'ed', t: 'Practicar' }
    ], opts.pestana && opts.pestana !== 'a' ? opts.pestana : 'gr', () => dibujar());

    const P = () => (ms.paro ? 0 : 1), E = () => (ms.emerg ? 0 : 1), M = () => (ms.marcha ? 1 : 0);
    const siguiente = () => Boolean((M() || ms.Q) && P() && E());
    const col = (v) => (v ? '#1d5fb4' : '#b7c0cc');
    const pw = (v) => (v ? '#1b8a5a' : '#b7c0cc');
    const W = (x1, y1, x2, y2, v) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col(v)}" stroke-width="3" stroke-linecap="round"/>`;

    // ---------- GRAFCET ----------
    const R = (id) => T.raiz(id);
    R('gr').innerHTML = `<div class="diag-2col planta-grid"><div class="lienzo"><svg viewBox="0 0 560 380" id="gr-svg"></svg></div>
      <div class="panel-info"><h4>GRAFCET básico (madre)</h4><p>Describe el <b>comportamiento</b> como etapas y transiciones, sin pensar aún en contactos.</p>
      <ul style="padding-left:18px;margin:0"><li><b>Etapa 0</b> (cuadro doble = inicial): reposo, motor apagado.</li><li><b>Transición t1</b>: se pasa a la etapa 1 si hay marcha y no hay paro ni emergencia.</li><li><b>Etapa 1</b>: motor en marcha (acción: Q = 1).</li><li><b>Transición t2</b>: se vuelve a 0 si se pulsa el paro o la emergencia.</li></ul>
      <p class="nota" style="margin-top:8px">Pulsa Marcha, Paro o Emergencia arriba y mira cómo se mueve la etapa activa.</p></div></div>`;
    const grafcet = () => {
      const a0 = !ms.Q, a1 = ms.Q;
      const t1 = M() && P() && E(), t2 = !P() || !E();
      return `
        <rect x="170" y="20" width="120" height="58" rx="3" fill="${a0 ? '#d9f0e3' : '#fff'}" stroke="#2f3b4a" stroke-width="2.4"/><rect x="176" y="26" width="108" height="46" fill="none" stroke="#2f3b4a" stroke-width="1.4"/>
        <text x="230" y="46" class="svg-texto fuerte" text-anchor="middle">0</text><text x="230" y="63" class="svg-texto" text-anchor="middle" style="font-size:11px">Reposo</text>
        ${a0 ? '<circle cx="230" cy="86" r="6" fill="#1b8a5a"/>' : ''}
        <line x1="230" y1="78" x2="230" y2="132" stroke="#2f3b4a" stroke-width="2"/>
        <line x1="212" y1="108" x2="248" y2="108" stroke="${t1 ? '#1b8a5a' : '#2f3b4a'}" stroke-width="5"/>
        <text x="262" y="104" class="svg-texto mono" style="font-size:12px;fill:${t1 ? '#1b8a5a' : '#465366'}">t1: M · P · E</text><text x="262" y="120" class="svg-texto" style="font-size:10px">marcha, y sin paro ni emergencia</text>
        <rect x="170" y="132" width="120" height="58" rx="3" fill="${a1 ? '#d9f0e3' : '#fff'}" stroke="#2f3b4a" stroke-width="2.4"/>
        <text x="230" y="158" class="svg-texto fuerte" text-anchor="middle">1</text><text x="230" y="176" class="svg-texto" text-anchor="middle" style="font-size:11px">En marcha</text>
        ${a1 ? '<circle cx="230" cy="198" r="6" fill="#1b8a5a"/>' : ''}
        <line x1="290" y1="161" x2="340" y2="161" stroke="#2f3b4a" stroke-width="2"/><rect x="340" y="143" width="190" height="36" rx="3" fill="${a1 ? '#fff6e6' : '#fff'}" stroke="#2f3b4a" stroke-width="1.8"/>
        <text x="435" y="166" class="svg-texto mono" text-anchor="middle" style="font-size:12px">Q := 1  (motor SD2.00)</text>
        <line x1="230" y1="190" x2="230" y2="262" stroke="#2f3b4a" stroke-width="2"/>
        <line x1="212" y1="226" x2="248" y2="226" stroke="${t2 && a1 ? '#c0392b' : '#2f3b4a'}" stroke-width="5"/>
        <text x="262" y="222" class="svg-texto mono" style="font-size:12px;fill:${t2 ? '#c0392b' : '#465366'}">t2: /P + /E</text><text x="262" y="238" class="svg-texto" style="font-size:10px">paro o emergencia pulsados</text>
        <path d="M230 262 H110 V49 H170" fill="none" stroke="#2f3b4a" stroke-width="2"/><path d="M158 43 L170 49 L158 55" fill="none" stroke="#2f3b4a" stroke-width="2"/>
        <text x="30" y="330" class="svg-texto" style="font-size:11px">M = ED1.00 (marcha); P = ED1.01 (paro, NC); E = ED1.02 (emergencia, NC); Q = SD2.00 (motor).</text>
        <text x="30" y="348" class="svg-texto" style="font-size:11px">P y E valen 1 en reposo (contactos NC); «/P» significa «paro pulsado».</text>`;
    };

    // ---------- Logigrama ----------
    R('lg').innerHTML = `<div class="diag-2col planta-grid"><div class="lienzo"><svg viewBox="0 0 640 330" id="lg-svg"></svg></div>
      <div class="panel-info"><h4>Logigrama</h4><p>El mismo comportamiento con <b>compuertas</b>. Las líneas azules llevan un 1; las grises, un 0.</p>
      <ul style="padding-left:18px;margin:0"><li><b>OR</b> (suma): basta que la marcha <i>o</i> la propia salida valga 1.</li><li><b>AND</b> (producto): además, paro y emergencia deben estar en reposo.</li><li><b>Realimentación</b>: la salida Q vuelve a la entrada de la OR. Esa es la <b>memoria</b>.</li></ul></div></div>`;
    const logigrama = () => {
      const orO = M() || ms.Q ? 1 : 0, q = siguiente() ? 1 : 0;
      const etq = (x, y, t, v) => `<rect x="${x}" y="${y - 13}" width="86" height="26" rx="6" fill="#fff" stroke="#cbd3dd"/><text x="${x + 43}" y="${y + 4}" class="svg-texto mono" text-anchor="middle" style="font-size:12px">${t}: <tspan style="font-weight:700;fill:${v ? '#1d5fb4' : '#7a8596'}">${v}</tspan></text>`;
      return `
        ${etq(10, 70, 'M', M())}${W(96, 70, 190, 70, M())}${W(190, 70, 210, 82, M())}
        ${etq(10, 150, 'Q', ms.Q ? 1 : 0)}${W(96, 150, 190, 150, ms.Q)}${W(190, 150, 210, 128, ms.Q)}
        <path d="M200 100 H230 M230 100 H300 Q340 100 340 140" fill="none" stroke="${col(orO)}" stroke-width="3"/>
        <path d="M210 62 C260 62 270 80 270 105 C270 130 260 148 210 148 C230 128 230 82 210 62 Z" fill="#fff" stroke="#2f3b4a" stroke-width="2"/><text x="240" y="110" class="svg-texto fuerte" text-anchor="middle" style="font-size:12px">OR</text>
        <path d="M270 105 H330" stroke="${col(orO)}" stroke-width="3" fill="none"/>
        ${etq(10, 225, 'P', P())}${W(96, 225, 330, 225, P())}${W(330, 225, 330, 150, P())}
        ${etq(10, 285, 'E', E())}${W(96, 285, 350, 285, E())}${W(350, 285, 350, 162, E())}
        <path d="M335 90 H405 Q450 90 450 165 Q450 240 405 240 H335 Z" fill="#fff" stroke="#2f3b4a" stroke-width="2"/><text x="388" y="170" class="svg-texto fuerte" text-anchor="middle" style="font-size:12px">AND</text>
        ${W(450, 165, 540, 165, q)}<rect x="540" y="146" width="90" height="38" rx="8" fill="${q ? '#d9f0e3' : '#fff'}" stroke="#2f3b4a" stroke-width="2"/><text x="585" y="170" class="svg-texto mono" text-anchor="middle" style="font-size:12px">Q = <tspan style="font-weight:700">${q}</tspan></text>
        <path d="M500 165 V20 H60 V150 H96" fill="none" stroke="${col(q)}" stroke-width="2.4" stroke-dasharray="6 5"/><text x="280" y="14" class="svg-texto" style="font-size:11px" text-anchor="middle">realimentación de Q (la memoria del enclavamiento)</text>`;
    };

    // ---------- Ecuaciones ----------
    R('ec').innerHTML = `<div class="diag-2col rango-grid"><div><div class="enunciado" style="text-align:center;font-size:1.15rem">\\[ Q \\;=\\; (M + Q)\\cdot P \\cdot E \\]</div>
      <p class="nota" style="margin:6px 0">\\(+\\) es OR (suma); \\(\\cdot\\) es AND (producto). M, P, E son las entradas y Q es la salida (leída antes del cambio). P y E valen 1 en reposo porque son contactos NC.</p>
      <div id="ec-ahora"></div></div><div style="overflow:auto"><table class="pl-tabla" id="ec-tab"></table></div></div>`;
    const ecuaciones = () => {
      const m = M(), q = ms.Q ? 1 : 0, p = P(), e = E(), r = siguiente() ? 1 : 0;
      R('ec').querySelector('#ec-ahora').innerHTML = `<div class="aviso info">Ahora: \\(M=${m}\\); \\(Q=${q}\\); \\(P=${p}\\); \\(E=${e}\\).<br>\\(Q_{nueva} = (${m}+${q})\\cdot${p}\\cdot${e} = ${r}\\)</div>`;
      let filas = '';
      for (let i = 0; i < 16; i++) {
        const v = [(i >> 3) & 1, (i >> 2) & 1, (i >> 1) & 1, i & 1];
        const res = (v[0] || v[1]) && v[2] && v[3] ? 1 : 0;
        const act = v[0] === m && v[1] === q && v[2] === p && v[3] === e;
        filas += `<tr class="${act ? 'act' : ''}"><td>${v[0]}</td><td>${v[1]}</td><td>${v[2]}</td><td>${v[3]}</td><td><b>${res}</b></td></tr>`;
      }
      R('ec').querySelector('#ec-tab').innerHTML = `<thead><tr><th>M</th><th>Q</th><th>P</th><th>E</th><th>Q nueva</th></tr></thead><tbody>${filas}</tbody>`;
    };

    // ---------- Escalera ----------
    R('es').innerHTML = `<div class="lienzo"><svg viewBox="0 0 760 270" id="es-svg"></svg></div>
      <div class="aviso info">En escalera, la corriente «fluye» de la barra izquierda a la derecha. Un contacto deja pasar si su señal vale 1. Las ramas en paralelo son <b>OR</b>; los contactos en serie, <b>AND</b>. El paro y la emergencia están cableados NC: en reposo su entrada vale 1, por eso su contacto en el programa deja pasar.</div>`;
    const escalera = () => {
      const m = M() === 1, q = ms.Q, p = P() === 1, e = E() === 1;
      const n1 = m || q, n2 = n1 && p, n3 = n2 && e;
      const c = (x, y, dir, nom, act, flujoIn) => `
        <line x1="${x}" y1="${y}" x2="${x + 30}" y2="${y}" stroke="${pw(flujoIn)}" stroke-width="3"/>
        <line x1="${x + 30}" y1="${y - 16}" x2="${x + 30}" y2="${y + 16}" stroke="${act ? '#1b8a5a' : '#2f3b4a'}" stroke-width="3.4"/><line x1="${x + 46}" y1="${y - 16}" x2="${x + 46}" y2="${y + 16}" stroke="${act ? '#1b8a5a' : '#2f3b4a'}" stroke-width="3.4"/>
        <line x1="${x + 46}" y1="${y}" x2="${x + 76}" y2="${y}" stroke="${pw(flujoIn && act)}" stroke-width="3"/>
        <text x="${x + 38}" y="${y - 24}" class="svg-texto mono" text-anchor="middle" style="font-size:12px">${nom}</text><text x="${x + 38}" y="${y + 34}" class="svg-texto" text-anchor="middle" style="font-size:10px">${dir}</text>`;
      return `
        <line x1="30" y1="20" x2="30" y2="250" stroke="#2f3b4a" stroke-width="5"/><line x1="730" y1="20" x2="730" y2="250" stroke="#2f3b4a" stroke-width="5"/>
        <line x1="30" y1="90" x2="70" y2="90" stroke="${pw(true)}" stroke-width="3"/><line x1="70" y1="90" x2="70" y2="170" stroke="${pw(true)}" stroke-width="3"/><line x1="70" y1="170" x2="90" y2="170" stroke="${pw(true)}" stroke-width="3"/>
        ${c(70, 90, 'ED1.00', 'M', m, true)}${c(90, 170, 'SD2.00', 'Q', q, true)}
        <line x1="146" y1="90" x2="250" y2="90" stroke="${pw(m)}" stroke-width="3"/><line x1="166" y1="170" x2="190" y2="170" stroke="${pw(q)}" stroke-width="3"/><line x1="190" y1="170" x2="250" y2="170" stroke="${pw(q)}" stroke-width="3"/>
        <line x1="250" y1="170" x2="250" y2="90" stroke="${pw(n1)}" stroke-width="3"/>
        ${c(250, 90, 'ED1.01', 'P', p, n1)}${c(390, 90, 'ED1.02', 'E', e, n2)}
        <line x1="326" y1="90" x2="390" y2="90" stroke="${pw(n2)}" stroke-width="3"/><line x1="466" y1="90" x2="560" y2="90" stroke="${pw(n3)}" stroke-width="3"/>
        <path d="M580 70 Q566 90 580 110" fill="none" stroke="${n3 ? '#1b8a5a' : '#2f3b4a'}" stroke-width="3.4"/><path d="M620 70 Q634 90 620 110" fill="none" stroke="${n3 ? '#1b8a5a' : '#2f3b4a'}" stroke-width="3.4"/>
        <line x1="560" y1="90" x2="573" y2="90" stroke="${pw(n3)}" stroke-width="3"/><line x1="627" y1="90" x2="730" y2="90" stroke="${pw(n3)}" stroke-width="3"/>
        <text x="600" y="60" class="svg-texto mono" text-anchor="middle" style="font-size:12px">Q</text><text x="600" y="132" class="svg-texto" text-anchor="middle" style="font-size:10px">SD2.00 (motor)</text>
        <text x="600" y="95" class="svg-texto mono" text-anchor="middle" style="font-size:12px;fill:${n3 ? '#1b8a5a' : '#7a8596'}">${n3 ? 'ON' : 'OFF'}</text>
        <text x="110" y="214" class="svg-texto" style="font-size:11px">La rama de abajo (Q) es el enclavamiento: mantiene la corriente cuando se suelta M.</text>`;
    };

    // ---------- Practicar (editor por casilleros) ----------
    let variante = PL.ENCLAV[opts.variante] ? opts.variante : 'A';
    const slots = {};
    const ED = R('ed');
    const editor = () => {
      const V = PL.ENCLAV[variante];
      ED.innerHTML = `
        <p class="sub" style="margin:0">Arma la ecuación llenando los casilleros. Se valida con la <b>tabla de verdad</b>: cualquier forma equivalente es correcta.</p>
        <div class="controles"><div class="segmentado" data-rol="var">${Object.keys(PL.ENCLAV).map((k) => `<button type="button" data-v="${k}" class="${k === variante ? 'activo' : ''}">${k}</button>`).join('')}</div></div>
        <div class="enunciado"><p><b>${V.nombre}</b></p><p>${V.desc}</p></div>
        <div class="ec-editor">${V.plantilla.map((p) => typeof p === 'number'
          ? `<select class="entrada ec-slot" data-i="${p}"><option value="">?</option>${V.lits.map((l) => `<option ${slots[variante + p] === l ? 'selected' : ''}>${l}</option>`).join('')}</select>`
          : `<span class="ec-op">${esc(p)}</span>`).join('')}</div>
        <div class="controles"><button type="button" class="boton primario" id="ed-ver">Comprobar con la tabla de verdad</button></div>
        <div id="ed-res"></div><p class="nota">Pista: ${V.pistas}</p>`;
      ED.querySelectorAll('[data-rol=var] button').forEach((b) => b.onclick = () => { variante = b.dataset.v; editor(); });
      ED.querySelectorAll('.ec-slot').forEach((s) => s.onchange = () => { slots[variante + s.dataset.i] = s.value; });
      ED.querySelector('#ed-ver').onclick = () => {
        const n = PL.nCasilleros(variante);
        const sl = Array.from({ length: n }, (_, i) => slots[variante + i] || '');
        const r = PL.verificarEc(variante, sl);
        const out = ED.querySelector('#ed-res');
        if (!r.completa) out.innerHTML = '<div class="aviso duda">Faltan casilleros por llenar.</div>';
        else if (r.ok) out.innerHTML = `<div class="aviso ok"><b>Correcto.</b> Tu ecuación da el resultado esperado en las ${1 << V.vars.length} combinaciones de la tabla de verdad.</div>`;
        else {
          const f = r.fallo, txt = V.vars.map((k) => `${k} = ${f.vals[k]}`).join('; ');
          out.innerHTML = `<div class="aviso mal"><b>Todavía no.</b> Con ${txt}, tu ecuación da <b>Q = ${f.obtenido}</b> y debería dar <b>Q = ${f.esperado}</b>.</div>`;
        }
      };
    };
    editor();

    // ---------- panel de simulación ----------
    const motor = () => {
      const g = ms.Q;
      cont.querySelector('#motor').innerHTML = `<circle cx="45" cy="45" r="38" fill="${g ? '#d9f0e3' : '#fff'}" stroke="${g ? '#1b8a5a' : '#2f3b4a'}" stroke-width="3"/>
        <g style="transform-origin:45px 45px;${g ? 'animation:giro .7s linear infinite' : ''}"><path d="M45 45 L45 14 M45 45 L72 60 M45 45 L18 60" stroke="${g ? '#1b8a5a' : '#8e99a6'}" stroke-width="5" stroke-linecap="round"/></g>
        <circle cx="45" cy="45" r="5" fill="#2f3b4a"/>`;
      cont.querySelector('#sim-txt').innerHTML = `<b>${ms.Q ? 'Motor en marcha' : 'Motor detenido'}</b><br><span class="nota">M=${M()}; P=${P()}; E=${E()}; Q=${ms.Q ? 1 : 0}</span>`;
      cont.querySelector('#b-emerg').classList.toggle('confirmar', ms.emerg);
      cont.querySelector('#b-emerg').textContent = ms.emerg ? 'Rearmar emergencia' : 'Emergencia';
      cont.querySelector('#b-marcha').classList.toggle('activo', ms.marcha);
      cont.querySelector('#b-paro').classList.toggle('activo', ms.paro);
    };
    const dibujar = () => {
      motor();
      if (PL.ver(R('gr'))) R('gr').querySelector('#gr-svg').innerHTML = grafcet();
      if (PL.ver(R('lg'))) R('lg').querySelector('#lg-svg').innerHTML = logigrama();
      if (PL.ver(R('ec'))) ecuaciones();
      if (PL.ver(R('es'))) R('es').querySelector('#es-svg').innerHTML = escalera();
    };
    const ciclo = () => { ms.Q = siguiente(); dibujar(); };
    cont.querySelector('#b-marcha').onclick = () => { ms.marcha = true; pulsoM && clearTimeout(pulsoM); ciclo(); pulsoM = setTimeout(() => { ms.marcha = false; ciclo(); }, 700); };
    cont.querySelector('#b-paro').onclick = () => { ms.paro = true; pulsoP && clearTimeout(pulsoP); ciclo(); pulsoP = setTimeout(() => { ms.paro = false; ciclo(); }, 700); };
    cont.querySelector('#b-emerg').onclick = () => { ms.emerg = !ms.emerg; ciclo(); };
    ciclo();
    const t = setInterval(() => { const q = siguiente(); if (q !== ms.Q) { ms.Q = q; dibujar(); } }, 150);

    return { destruir() { clearInterval(t); clearTimeout(pulsoM); clearTimeout(pulsoP); }, pestana: T.pestana };
  };
})();
