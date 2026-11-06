// ============================================================
// De los relés a la escalera: el circuito cableado, la lógica con contactos,
// cómo se lee una escalera y cómo la ejecuta el PLC (escaneo y memoria).
// Pestañas: reles, logica, leer, scan
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  II.diagramas = II.diagramas || {};
  const PL = (II.pl = II.pl || {});

  const AZUL = '#1d5fb4', VERDE = '#1b8a5a', ROJO = '#c0392b', GRIS = '#b7c0cc', OSC = '#2f3b4a', AMBAR = '#b7791f';
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" class="svg-texto${o.mono ? ' mono' : ''}${o.fuerte ? ' fuerte' : ''}" text-anchor="${o.a || 'middle'}" style="font-size:${o.z || 12}px;${o.c ? 'fill:' + o.c + ';' : ''}">${s}</text>`;
  const L = (x1, y1, x2, y2, c = OSC, w = 2.6) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  const W = (x1, y1, x2, y2, on) => L(x1, y1, x2, y2, on ? VERDE : GRIS, on ? 4 : 2.6);
  const aviso = (cls, html) => `<div class="aviso ${cls}" style="margin:10px 0 0">${html}</div>`;
  const seg = (opciones, actual, rol) => `<div class="segmentado" data-rol="${rol}">${opciones.map((o) => `<button type="button" data-v="${o[0]}" class="${o[0] === actual ? 'activo' : ''}">${o[1]}</button>`).join('')}</div>`;
  const marcar = (cont, rol, valor) => cont.querySelectorAll(`[data-rol=${rol}] button`).forEach((b) => b.classList.toggle('activo', b.dataset.v === valor));

  // contacto de escalera en (x, y): nc = con barra diagonal; pasa = deja pasar el flujo; etq arriba, dir abajo
  const contacto = (x, y, o) => {
    const c = o.foco ? AMBAR : o.pasa ? VERDE : OSC, w = o.foco ? 4.2 : 3.2;
    return `${L(x - 9, y - 16, x - 9, y + 16, c, w)}${L(x + 9, y - 16, x + 9, y + 16, c, w)}${o.nc ? L(x - 15, y + 15, x + 15, y - 15, c, 2.6) : ''}
      ${T(x, y - 24, o.etq || '', { fuerte: 1, z: 12 })}${o.dir ? T(x, y + 34, o.dir, { mono: 1, z: 10, c: '#465366' }) : ''}`;
  };
  const bobina = (x, y, o) => {
    const c = o.foco ? AMBAR : o.on ? VERDE : OSC;
    return `<circle cx="${x}" cy="${y}" r="20" fill="${o.on ? '#d9f0e3' : '#fff'}" stroke="${c}" stroke-width="3.2"/>
      ${T(x, y + 5, o.simbolo || 'Q', { fuerte: 1, z: 14 })}${T(x, y - 30, o.etq || '', { fuerte: 1 })}${o.dir ? T(x, y + 40, o.dir, { mono: 1, z: 10, c: '#465366' }) : ''}`;
  };

  // Renglón estático para los enunciados de los retos.
  // estr: 'a' = A en serie con (B o C); 'b' = (A o B) en serie con C; 'c' = (A en serie con B) o C. nc = { A, B, C }: contacto NC.
  PL.RENGLONES = {
    a: { eq: (n) => `${n.A} · (${n.B} + ${n.C})`, f: (v) => v.A && (v.B || v.C) },
    b: { eq: (n) => `(${n.A} + ${n.B}) · ${n.C}`, f: (v) => (v.A || v.B) && v.C },
    c: { eq: (n) => `${n.A} · ${n.B} + ${n.C}`, f: (v) => (v.A && v.B) || v.C }
  };
  PL.renglonSVG = (estr, nc) => {
    const c = (x, y, k, d) => contacto(x, y, { etq: k, nc: !!nc[k], dir: d });
    const dir = { A: 'ED1.00', B: 'ED1.01', C: 'ED1.02' };
    let g = `${L(40, 20, 40, 200)}${L(600, 20, 600, 200)}`;
    const salida = (x) => `${L(x, 100, 440, 100)}${bobina(460, 100, { etq: 'Q', simbolo: 'Q', dir: 'SD2.00' })}${L(480, 100, 600, 100)}`;
    const w = (a, b, y) => L(a, y, b, y);
    if (estr === 'a') {
      g += `${w(40, 110, 100)}${c(130, 100, 'A', dir.A)}${w(149, 210, 100)}${L(210, 60, 210, 140)}${w(210, 270, 60)}${c(290, 60, 'B', dir.B)}${w(309, 380, 60)}${w(210, 270, 140)}${c(290, 140, 'C', dir.C)}${w(309, 380, 140)}${L(380, 60, 380, 140)}${salida(380)}`;
    } else if (estr === 'b') {
      g += `${w(40, 100, 100)}${L(100, 60, 100, 140)}${w(100, 150, 60)}${c(170, 60, 'A', dir.A)}${w(189, 250, 60)}${w(100, 150, 140)}${c(170, 140, 'B', dir.B)}${w(189, 250, 140)}${L(250, 60, 250, 140)}${w(250, 300, 100)}${c(320, 100, 'C', dir.C)}${salida(339)}`;
    } else {
      g += `${w(40, 100, 100)}${L(100, 60, 100, 140)}${w(100, 150, 60)}${c(170, 60, 'A', dir.A)}${w(189, 250, 60)}${c(270, 60, 'B', dir.B)}${w(289, 360, 60)}${w(100, 200, 140)}${c(220, 140, 'C', dir.C)}${w(239, 360, 140)}${L(360, 60, 360, 140)}${salida(360)}`;
    }
    return `<svg viewBox="0 0 640 210" style="width:100%;height:auto;max-height:260px" role="img" aria-label="Renglón de escalera">${g}</svg>`;
  };

  II.diagramas.escalera = (cont, opts = {}) => {
    cont.classList.add('diagrama');
    const lista = [{ id: 'reles', t: '1 · Del relé al PLC' }, { id: 'logica', t: '2 · Lógica con contactos' }, { id: 'leer', t: '3 · Leer una escalera' }, { id: 'scan', t: '4 · Escaneo y memoria' }];
    const ini = lista.some((x) => x.id === opts.pestana) ? opts.pestana : 'reles';
    const Tb = PL.pestanas(cont, lista, ini);
    const raiz = (id) => Tb.raiz(id);
    const timers = [];

    // =======================================================
    // 1 · Del relé al PLC: el mismo circuito, dos dibujos
    // =======================================================
    (() => {
      const s = { vista: 'cab', marcha: false, paro: false, Q: false };
      const r = raiz('reles');
      let pM = 0, pP = 0;
      r.innerHTML = `<div class="controles">${seg([['cab', 'Circuito cableado'], ['esc', 'Escalera del PLC']], s.vista, 'vista')}
          <button type="button" class="boton primario" id="r-m">Marcha</button><button type="button" class="boton" id="r-p">Paro</button></div>
        <div class="diag-2col planta-grid"><div class="lienzo"><svg viewBox="0 0 640 300" id="r-svg"></svg></div><div class="panel-info" id="r-info"></div></div>`;
      const sig = () => (s.marcha || s.Q) && !s.paro;
      const d = () => {
        const cab = s.vista === 'cab';
        const paroOK = !s.paro, flujoIzq = paroOK, up = flujoIzq && s.marcha, lo = flujoIzq && s.Q, nodo = up || lo, bob = nodo;
        const svg = `
          ${L(40, 30, 40, 270, OSC, 5)}${L(600, 30, 600, 270, OSC, 5)}${T(40, 22, cab ? '+24 V' : 'riel izq.', { fuerte: 1, c: ROJO, z: 11 })}${T(600, 22, cab ? '0 V' : 'riel der.', { fuerte: 1, c: AZUL, z: 11 })}
          ${W(40, 110, 100, 110, true)}
          ${cab
            ? `${contacto(120, 110, { etq: 'S2 paro', nc: true, pasa: paroOK })}`
            : `${contacto(120, 110, { etq: 'paro', dir: 'ED1.01', pasa: paroOK })}`}
          ${W(139, 110, 200, 110, flujoIzq)}
          ${W(200, 110, 240, 110, flujoIzq)}${L(200, 110, 200, 190, flujoIzq ? VERDE : GRIS, flujoIzq ? 4 : 2.6)}
          ${cab ? contacto(270, 110, { etq: 'S1 marcha', pasa: s.marcha }) : contacto(270, 110, { etq: 'marcha', dir: 'ED1.00', pasa: s.marcha })}
          ${W(289, 110, 350, 110, up)}
          ${W(200, 190, 240, 190, flujoIzq)}${cab ? contacto(270, 190, { etq: 'K1 contacto auxiliar', pasa: s.Q }) : contacto(270, 190, { etq: 'sello', dir: 'SD2.00', pasa: s.Q })}${W(289, 190, 350, 190, lo)}
          ${L(350, 110, 350, 190, nodo ? VERDE : GRIS, nodo ? 4 : 2.6)}
          ${W(350, 110, 440, 110, nodo)}${bobina(460, 110, { etq: cab ? 'Bobina K1' : 'motor', simbolo: cab ? 'K1' : 'Q', on: bob, dir: cab ? '' : 'SD2.00' })}${W(480, 110, 600, 110, bob)}
          ${T(320, 258, cab ? 'Los contactos S1, S2 y K1 son piezas reales; la bobina K1 cierra los contactos de potencia del motor.' : 'Cada contacto lee un bit; la bobina escribe un bit. La unión con los cables ya no existe: es la tabla de asignación.', { z: 11, c: '#465366' })}`;
        r.querySelector('#r-svg').innerHTML = svg;
        const info = cab
          ? `<h4>El circuito de arranque y paro</h4><p>Es el circuito que ya conocen: el <b>paro</b> (NC) está en serie; la <b>marcha</b> (NA) está en paralelo con un <b>contacto auxiliar de K1</b>. Al soltar la marcha, ese contacto sigue cerrado y mantiene la bobina: es el <b>sello</b>.</p>`
          : `<h4>El mismo circuito en el PLC</h4><p>Ahora cada contacto es un <b>bit</b>. Fíjate: el paro físico es NC, pero en el programa se dibuja como contacto de los que <b>dejan pasar cuando el bit vale 1</b>, porque en reposo ED1.01 vale 1.</p>`;
        r.querySelector('#r-info').innerHTML = `${info}
          ${s.Q ? aviso('ok', '<b>La bobina está energizada.</b> Suelta la marcha: el contacto de sello la sigue manteniendo.') : aviso('info', 'Pulsa <b>Marcha</b> y observa por dónde pasa la corriente. Luego prueba <b>Paro</b>.')}
          <p class="nota" style="margin-top:8px">La lógica es idéntica; cambia la forma de dibujarla y de construirla: ya no se unen cables, se escribe un programa.</p>`;
      };
      const ciclo = () => { s.Q = sig(); d(); };
      r.querySelector('[data-rol=vista]').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; s.vista = b.dataset.v; marcar(r, 'vista', s.vista); d(); };
      r.querySelector('#r-m').onclick = () => { s.marcha = true; clearTimeout(pM); ciclo(); pM = setTimeout(() => { s.marcha = false; ciclo(); }, 900); };
      r.querySelector('#r-p').onclick = () => { s.paro = true; clearTimeout(pP); ciclo(); pP = setTimeout(() => { s.paro = false; ciclo(); }, 900); };
      timers.push(() => { clearTimeout(pM); clearTimeout(pP); });
      d();
    })();

    // =======================================================
    // 2 · Lógica con contactos: la tabla se llena sola
    // =======================================================
    (() => {
      const PAT = {
        and: { n: 'En serie (AND)', vars: ['A', 'B'], eq: 'Q = A · B', f: (v) => v.A && v.B, nota: 'En <b>serie</b> hacen falta todos: el producto vale 1 solo si A <i>y</i> B valen 1.' },
        or: { n: 'En paralelo (OR)', vars: ['A', 'B'], eq: 'Q = A + B', f: (v) => v.A || v.B, nota: 'En <b>paralelo</b> basta uno: la suma vale 1 si A <i>o</i> B valen 1.' },
        nc: { n: 'Con un contacto NC (NOT)', vars: ['A', 'B'], eq: 'Q = A · /B', f: (v) => v.A && !v.B, nota: 'El contacto <b>NC</b> deja pasar cuando su bit vale <b>0</b>: /B se lee «no B».' },
        mix: { n: 'Mixto', vars: ['A', 'B', 'C'], eq: 'Q = A · (B + C)', f: (v) => v.A && (v.B || v.C), nota: 'Primero A en serie, y después B o C en paralelo: se resuelve el paréntesis.' }
      };
      const s = { pat: 'and', v: { A: false, B: false, C: false }, vis: {} };
      const r = raiz('logica');
      r.innerHTML = `<div class="controles">${seg(Object.keys(PAT).map((k) => [k, PAT[k].n]), s.pat, 'pat')}</div>
        <div class="controles" id="l-sw" style="margin-top:4px"></div>
        <div class="diag-2col planta-grid"><div class="lienzo"><svg viewBox="0 0 640 250" id="l-svg"></svg></div><div class="panel-info" id="l-info"></div></div>`;
      const comb = (p, v) => p.vars.map((k) => (v[k] ? 1 : 0)).join('');
      const d = () => {
        const p = PAT[s.pat], v = s.v, q = !!p.f(v);
        s.vis[s.pat] = s.vis[s.pat] || {};
        s.vis[s.pat][comb(p, v)] = true;
        const A = !!v.A, B = !!v.B, C = !!v.C;
        let g = `${L(40, 20, 40, 230, OSC, 5)}${L(600, 20, 600, 230, OSC, 5)}`;
        const dirs = { A: 'ED1.00', B: 'ED1.01', C: 'ED1.02' };
        if (s.pat === 'and') {
          g += `${W(40, 110, 130, 110, true)}${contacto(150, 110, { etq: 'A', dir: dirs.A, pasa: A })}${W(169, 110, 260, 110, A)}${contacto(280, 110, { etq: 'B', dir: dirs.B, pasa: B && A })}${W(299, 110, 440, 110, A && B)}${bobina(460, 110, { etq: 'Q', simbolo: 'Q', on: q, dir: 'SD2.00' })}${W(480, 110, 600, 110, q)}`;
        } else if (s.pat === 'or') {
          g += `${W(40, 110, 100, 110, true)}${L(100, 70, 100, 150, GRIS, 2.6)}${W(100, 70, 220, 70, true)}${contacto(240, 70, { etq: 'A', dir: dirs.A, pasa: A })}${W(259, 70, 360, 70, A)}${W(100, 150, 220, 150, true)}${contacto(240, 150, { etq: 'B', dir: dirs.B, pasa: B })}${W(259, 150, 360, 150, B)}${L(360, 70, 360, 150, q ? VERDE : GRIS, q ? 4 : 2.6)}${W(360, 110, 440, 110, q)}${bobina(460, 110, { etq: 'Q', simbolo: 'Q', on: q, dir: 'SD2.00' })}${W(480, 110, 600, 110, q)}${L(100, 70, 100, 150, VERDE, 4)}`;
        } else if (s.pat === 'nc') {
          g += `${W(40, 110, 130, 110, true)}${contacto(150, 110, { etq: 'A', dir: dirs.A, pasa: A })}${W(169, 110, 260, 110, A)}${contacto(280, 110, { etq: '/B', nc: true, dir: dirs.B, pasa: A && !B })}${W(299, 110, 440, 110, A && !B)}${bobina(460, 110, { etq: 'Q', simbolo: 'Q', on: q, dir: 'SD2.00' })}${W(480, 110, 600, 110, q)}`;
        } else {
          const bc = B || C;
          g += `${W(40, 110, 110, 110, true)}${contacto(130, 110, { etq: 'A', dir: dirs.A, pasa: A })}${W(149, 110, 210, 110, A)}${L(210, 70, 210, 150, A ? VERDE : GRIS, A ? 4 : 2.6)}
            ${W(210, 70, 270, 70, A)}${contacto(290, 70, { etq: 'B', dir: dirs.B, pasa: A && B })}${W(309, 70, 380, 70, A && B)}
            ${W(210, 150, 270, 150, A)}${contacto(290, 150, { etq: 'C', dir: dirs.C, pasa: A && C })}${W(309, 150, 380, 150, A && C)}
            ${L(380, 70, 380, 150, q ? VERDE : GRIS, q ? 4 : 2.6)}${W(380, 110, 440, 110, q)}${bobina(460, 110, { etq: 'Q', simbolo: 'Q', on: q, dir: 'SD2.00' })}${W(480, 110, 600, 110, q)}`;
          void bc;
        }
        r.querySelector('#l-svg').innerHTML = g + T(320, 238, `Los contactos leen bits ${p.vars.join(', ')}; la bobina escribe Q.`, { z: 11, c: '#465366' });
        // interruptores
        r.querySelector('#l-sw').innerHTML = p.vars.map((k) => `<button type="button" class="boton ${v[k] ? 'primario' : ''}" data-sw="${k}">${k} = ${v[k] ? 1 : 0} (${dirs[k]})</button>`).join('');
        // tabla de verdad que se llena sola
        const n = p.vars.length, filas = [];
        for (let i = 0; i < (1 << n); i++) { const vv = {}; p.vars.forEach((k, j) => { vv[k] = !!(i & (1 << (n - 1 - j))); }); filas.push(vv); }
        const vistas = s.vis[s.pat], descubiertas = filas.filter((f) => vistas[comb(p, f)]).length;
        const tabla = `<table class="tabla-mini"><thead><tr>${p.vars.map((k) => `<th>${k}</th>`).join('')}<th>Q</th></tr></thead><tbody>${filas.map((f) => {
          const ya = vistas[comb(p, f)], act = comb(p, f) === comb(p, v);
          return `<tr style="${act ? 'background:#e7f0fb' : ''}">${p.vars.map((k) => `<td>${f[k] ? 1 : 0}</td>`).join('')}<td><b>${ya ? (p.f(f) ? 1 : 0) : '?'}</b></td></tr>`;
        }).join('')}</tbody></table>`;
        r.querySelector('#l-info').innerHTML = `<h4>${p.eq}</h4><p>${p.nota}</p>${tabla}
          <p class="nota" style="margin:8px 0 0">Has descubierto <b>${descubiertas} de ${filas.length}</b> filas de la tabla de verdad.${descubiertas === filas.length ? ' <b>Completa.</b>' : ' Cambia los contactos para descubrir las demás.'}</p>
          <div class="controles" style="margin-top:8px"><button type="button" class="boton chico" id="l-rev">Mostrar toda la tabla</button></div>`;
        r.querySelector('#l-rev').onclick = () => { filas.forEach((f) => { s.vis[s.pat][comb(p, f)] = true; }); d(); };
      };
      r.querySelector('[data-rol=pat]').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; s.pat = b.dataset.v; s.v = { A: false, B: false, C: false }; marcar(r, 'pat', s.pat); d(); };
      r.querySelector('#l-sw').onclick = (e) => { const b = e.target.closest('[data-sw]'); if (!b) return; s.v[b.dataset.sw] = !s.v[b.dataset.sw]; d(); };
      d();
    })();

    // =======================================================
    // 3 · Leer una escalera
    // =======================================================
    (() => {
      const s = { s1: false, s2: false, lsh: false, mant: false, foco: null };
      const r = raiz('leer');
      const SIMB = [
        ['rieles', 'Los dos rieles', 'No llevan corriente de verdad: son una forma de dibujar. Piensa en un «flujo lógico» que sale del riel izquierdo y busca llegar a la bobina.'],
        ['na', 'Contacto NA  –| |–', 'Lee un bit. Deja pasar el flujo cuando su bit vale <b>1</b>.'],
        ['nc', 'Contacto NC  –|/|–', 'Lee un bit. Deja pasar el flujo cuando su bit vale <b>0</b>.'],
        ['bobina', 'Bobina  –( )–', 'Escribe un bit: vale <b>1</b> si al renglón le llega flujo y <b>0</b> si no.'],
        ['dir', 'Dirección', 'Debajo de cada símbolo está el bit que lee o escribe. Es el vínculo con el cableado: ED1.00 es el terminal 0 del módulo de entradas.']
      ];
      r.innerHTML = `<div class="controles" id="e-sw"></div>
        <div class="diag-2col planta-grid"><div class="lienzo"><svg viewBox="0 0 640 330" id="le-svg"></svg></div><div class="panel-info" id="le-info"></div></div>`;
      const d = () => {
        const b0 = s.s1 ? 1 : 0, b1 = s.s2 ? 0 : 1, b3 = s.lsh ? 1 : 0, b5 = s.mant ? 1 : 0;   // S2 es NC: en reposo lee 1
        const r1 = !!(b0 && b1), r2 = !!(b3 && !b5);
        const f = s.foco;
        const sw = [['s1', `Pulsar marcha S1  (ED1.00 = ${b0})`], ['s2', `Pulsar paro S2 NC  (ED1.01 = ${b1})`], ['lsh', `Flotador alto activo  (ED1.03 = ${b3})`], ['mant', `Selector de mantenimiento  (ED1.05 = ${b5})`]];
        r.querySelector('#e-sw').innerHTML = sw.map(([k, t]) => `<button type="button" class="boton chico ${s[k] ? 'primario' : ''}" data-sw="${k}">${t}</button>`).join('');
        const svg = `${L(40, 20, 40, 310, f === 'rieles' ? AMBAR : OSC, f === 'rieles' ? 7 : 5)}${L(600, 20, 600, 310, f === 'rieles' ? AMBAR : OSC, f === 'rieles' ? 7 : 5)}
          ${T(40, 14, 'riel izq.', { z: 10 })}${T(600, 14, 'riel der.', { z: 10 })}
          ${W(40, 90, 130, 90, true)}${contacto(150, 90, { etq: 'S1 marcha', dir: 'ED1.00', pasa: !!b0, foco: f === 'na' || f === 'dir' && false })}${W(169, 90, 270, 90, !!b0)}${contacto(290, 90, { etq: 'S2 paro', dir: 'ED1.01', pasa: !!(b0 && b1), foco: f === 'na' })}${W(309, 90, 440, 90, r1)}${bobina(460, 90, { etq: 'H1 lámpara', simbolo: 'Q', on: r1, dir: 'SD2.01', foco: f === 'bobina' })}${W(480, 90, 600, 90, r1)}
          ${W(40, 220, 130, 220, true)}${contacto(150, 220, { etq: 'LSH nivel alto', dir: 'ED1.03', pasa: !!b3, foco: f === 'na' })}${W(169, 220, 270, 220, !!b3)}${contacto(290, 220, { etq: '/MANT', nc: true, dir: 'ED1.05', pasa: r2, foco: f === 'nc' })}${W(309, 220, 440, 220, r2)}${bobina(460, 220, { etq: 'Sirena', simbolo: 'Q', on: r2, dir: 'SD2.02', foco: f === 'bobina' })}${W(480, 220, 600, 220, r2)}
          ${f === 'dir' ? [[150, 112], [290, 112], [460, 132], [150, 242], [290, 242], [460, 262]].map(([x, y]) => `<rect x="${x - 36}" y="${y}" width="72" height="22" rx="6" fill="none" stroke="${AMBAR}" stroke-width="3"/>`).join('') : ''}
          ${T(320, 320, 'Se lee de izquierda a derecha y de arriba hacia abajo.', { z: 11, c: '#465366' })}`;
        r.querySelector('#le-svg').innerHTML = svg;
        const ex = SIMB.find((x) => x[0] === f);
        r.querySelector('#le-info').innerHTML = `<h4>Las piezas de una escalera</h4>
          <div style="display:grid;gap:6px">${SIMB.map((x) => `<button type="button" class="boton chico ${f === x[0] ? 'primario' : ''}" data-f="${x[0]}" style="text-align:left">${x[1]}</button>`).join('')}</div>
          ${ex ? aviso('info', ex[2]) : aviso('info', 'Toca una pieza para saber qué hace y verla resaltada en el dibujo.')}
          <p class="nota" style="margin-top:8px">Renglón 1: la lámpara se enciende si hay marcha <i>y</i> el paro está en reposo. Renglón 2: la sirena suena si hay nivel alto <i>y no</i> está en mantenimiento.</p>`;
      };
      r.addEventListener('click', (e) => {
        const bs = e.target.closest('[data-sw]'), bf = e.target.closest('[data-f]');
        if (bs) { s[bs.dataset.sw] = !s[bs.dataset.sw]; d(); }
        if (bf) { s.foco = s.foco === bf.dataset.f ? null : bf.dataset.f; d(); }
      });
      d();
    })();

    // =======================================================
    // 4 · Escaneo y memoria: por qué el motor «se acuerda»
    // =======================================================
    (() => {
      const FASES = ['Leer las entradas', 'Ejecutar el renglón', 'Escribir las salidas'];
      const s = { M: false, P: false, Q: false, fase: 0, img: null, res: null, hist: [], n: 0 };
      const r = raiz('scan');
      r.innerHTML = `<div class="controles"><button type="button" class="boton" id="n-m"></button><button type="button" class="boton" id="n-p"></button>
          <button type="button" class="boton primario" id="n-s"></button><button type="button" class="boton chico" id="n-r">Reiniciar</button></div>
        <div class="diag-2col planta-grid"><div><div class="lienzo"><svg viewBox="0 0 640 260" id="n-svg"></svg></div><div id="n-hist" style="margin-top:10px"></div></div><div class="panel-info" id="n-info"></div></div>`;
      const d = () => {
        const img = s.img || { M: s.M, Pbit: !s.P, Qa: s.Q };
        const mostrar = s.fase >= 1;   // ya se leyeron las entradas
        const M = mostrar ? img.M : s.M, Pb = mostrar ? img.Pbit : !s.P, Qa = mostrar ? img.Qa : s.Q;
        const evalua = s.fase >= 2;
        const arr = (M || Qa), res = arr && Pb;
        const flujo = evalua ? { m: M, sello: Qa, ar: arr, p: res, q: res } : { m: false, sello: false, ar: false, p: false, q: false };
        const svg = `${L(40, 30, 40, 220, OSC, 5)}${L(600, 30, 600, 220, OSC, 5)}
          ${W(40, 90, 110, 90, true)}${contacto(130, 90, { etq: 'M marcha', dir: 'ED1.00', pasa: flujo.m })}${W(149, 90, 200, 90, flujo.m)}
          ${L(200, 90, 200, 170, flujo.ar ? VERDE : GRIS, flujo.ar ? 4 : 2.6)}${W(200, 90, 250, 90, flujo.ar)}
          ${W(40, 170, 110, 170, true)}${W(110, 170, 110, 170, true)}${L(40, 170, 40, 90, OSC, 5)}
          ${W(40, 170, 110, 170, true)}${contacto(130, 170, { etq: 'Q sello', dir: 'SD2.00', pasa: flujo.sello })}${W(149, 170, 200, 170, flujo.sello)}
          ${W(200, 90, 250, 90, flujo.ar)}${contacto(270, 90, { etq: 'P paro', dir: 'ED1.01', pasa: flujo.p })}${W(289, 90, 440, 90, flujo.p)}${bobina(460, 90, { etq: 'Q motor', simbolo: 'Q', on: s.fase === 2 ? res : s.Q, dir: 'SD2.00' })}${W(480, 90, 600, 90, s.fase === 2 ? res : s.Q)}
          ${T(320, 246, evalua ? 'El renglón se evalúa con la foto de las entradas y con Q del escaneo anterior.' : 'Todavía no se evaluó el renglón en este escaneo.', { z: 11, c: '#465366' })}`;
        r.querySelector('#n-svg').innerHTML = svg;
        r.querySelector('#n-m').textContent = `Marcha: ${s.M ? 'pulsada' : 'suelta'}`;
        r.querySelector('#n-m').className = 'boton ' + (s.M ? 'primario' : '');
        r.querySelector('#n-p').textContent = `Paro: ${s.P ? 'pulsado' : 'suelto'}`;
        r.querySelector('#n-p').className = 'boton ' + (s.P ? 'primario' : '');
        r.querySelector('#n-s').textContent = `Escaneo ${s.n + 1}, fase ${s.fase + 1}: ${FASES[s.fase]}`;
        r.querySelector('#n-hist').innerHTML = s.hist.length
          ? `<table class="tabla-mini"><thead><tr><th>Escaneo</th><th>M</th><th>P (bit)</th><th>Q antes</th><th>Q después</th></tr></thead><tbody>${s.hist.slice(-6).map((h) => `<tr><td>${h.n}</td><td>${h.M}</td><td>${h.P}</td><td>${h.Qa}</td><td><b>${h.Q}</b></td></tr>`).join('')}</tbody></table>`
          : '<p class="nota" style="margin:0">Ejecuta un escaneo para ver la tabla del historial.</p>';
        let msg = aviso('info', 'Pon la <b>marcha</b> y avanza las tres fases de un escaneo. Después suéltala y ejecuta otro.');
        if (evalua && !M && Qa && Pb) msg = aviso('ok', '<b>La marcha ya está suelta, pero el motor sigue.</b> Q valía 1 en el escaneo anterior, y ese valor entra por el contacto de sello. Eso es la memoria.');
        else if (evalua && !Pb) msg = aviso('duda', 'El paro está pulsado: su bit vale 0 y el renglón no puede dar 1, aunque haya marcha o sello.');
        else if (evalua && M && Pb) msg = aviso('ok', 'La marcha da el 1 que arranca el motor.');
        else if (evalua && !M && !Qa) msg = aviso('info', 'Sin marcha y sin sello: Q queda en 0.');
        r.querySelector('#n-info').innerHTML = `<h4>Un escaneo, fase por fase</h4>
          <ol style="margin:0;padding-left:18px;display:grid;gap:6px"><li class="${s.fase === 0 ? 'ok' : ''}"><b>Leer</b>: el PLC toma una «foto» de M y P.</li><li><b>Ejecutar</b>: calcula el renglón con esa foto y con el valor <b>anterior</b> de Q.</li><li><b>Escribir</b>: recién entonces cambia la salida física.</li></ol>
          ${msg}`;
      };
      r.querySelector('#n-m').onclick = () => { s.M = !s.M; d(); };
      r.querySelector('#n-p').onclick = () => { s.P = !s.P; d(); };
      r.querySelector('#n-r').onclick = () => { Object.assign(s, { M: false, P: false, Q: false, fase: 0, img: null, hist: [], n: 0 }); d(); };
      r.querySelector('#n-s').onclick = () => {
        if (s.fase === 0) { s.img = { M: s.M, Pbit: !s.P, Qa: s.Q }; s.fase = 1; }
        else if (s.fase === 1) { s.fase = 2; }
        else {
          const im = s.img, q = (im.M || im.Qa) && im.Pbit;
          s.n += 1; s.hist.push({ n: s.n, M: im.M ? 1 : 0, P: im.Pbit ? 1 : 0, Qa: im.Qa ? 1 : 0, Q: q ? 1 : 0 });
          s.Q = q; s.img = null; s.fase = 0;
        }
        d();
      };
      d();
    })();

    return { destruir() { timers.forEach((f) => f()); }, pestana: Tb.pestana };
  };

  ['reles', 'logica', 'leer', 'scan'].forEach((id) => { II.diagramas['escalera_' + id] = (cont, o = {}) => II.diagramas.escalera(cont, { ...o, pestana: id }); });
})();
