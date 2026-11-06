// ============================================================
// Del GRAFCET nivel 2 a las ecuaciones lógicas y al diagrama escalera (ejemplo: llenado de un tanque).
// Pestañas: tanque, ecuaciones, escalera, prueba. Atajos: ecuaciones_tanque, ecuaciones_deriva, ecuaciones_escalera, ecuaciones_prueba
// Borrador aprobado en chat el 04/11/2026. Negación = barra encima. Azul = SET, rojo = RESET, lila = enclavamiento, verde #2BD65B = activo.
// Exporta PL.ecuaciones { svgGr, svgLd, R, ov, REG } para los retos.
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  II.diagramas = II.diagramas || {};
  const PL = (II.pl = II.pl || {});
  const G = '#2BD65B', GD = '#04260F', BL = '#378ADD', PU = '#7F77DD', RD = '#E24B4A';
  const INK = 'var(--texto)', SEC = 'var(--texto-2)', S1 = 'var(--superficie-2)', S2 = 'var(--superficie)', BRD = 'var(--borde-2)';

  if (!document.getElementById('eqz-css')) {
    const st = document.createElement('style');
    st.id = 'eqz-css';
    st.textContent = `
.eqz-ov{text-decoration:overline;text-decoration-thickness:1.5px}
.eqz-ovg{display:inline-block;border-top:1.5px solid currentColor;padding-top:7px;line-height:1.2;margin-top:4px}
.eqz-eq{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.95rem;padding:7px 12px;border-radius:8px;margin:6px 0;line-height:2;overflow-x:auto}
.eqz-s{background:#E6F1FB;color:#0C447C}.eqz-r{background:#FCEBEB;color:#791F1F}.eqz-n{background:${S1};color:${INK};border:1px solid var(--borde)}.eqz-f{background:#2BD65B;color:#04260F}
.eqz-cs{background:#E6F1FB;color:#0C447C;padding:1px 6px;border-radius:4px}.eqz-ck{background:#EEEDFE;color:#3C3489;padding:1px 6px;border-radius:4px}.eqz-cr{background:#FCEBEB;color:#791F1F;padding:1px 6px;border-radius:4px}
.eqz-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;align-items:start}
.eqz-card{background:${S2};border:1px solid var(--borde);border-radius:12px;padding:8px}
.eqz-chip{display:inline-block;min-width:54px;text-align:center;font-size:.8rem;padding:3px 8px;border-radius:6px;border:1px solid var(--borde)}
.eqz-btn.on{background:#2BD65B!important;color:#04260F!important;border-color:#2BD65B!important}
.eqz-btn.sel{background:#E6F1FB!important;color:#0C447C!important;border-color:#378ADD!important}
.eqz-dot{width:8px;height:8px;border-radius:50%;background:var(--borde-2);display:inline-block}.eqz-dot.a{background:#378ADD}
@media (prefers-reduced-motion:no-preference){.eqz-flow{stroke-dasharray:6 6;animation:eqzfl .5s linear infinite}.eqz-spin{animation:eqzsp .7s linear infinite;transform-origin:60px 50px}}
@keyframes eqzfl{to{stroke-dashoffset:-12}}@keyframes eqzsp{to{transform:rotate(360deg)}}`;
    document.head.appendChild(st);
  }

  // ---------- notación ----------
  // ~x~ = barra sobre x; {{x}} = barra larga; [s:x] SET, [k:x] enclavamiento, [r:x] RESET
  const R = (t) => String(t)
    .replace(/\[(s|k|r):([^\]]+)\]/g, (m, c, x) => `<span class="eqz-c${c}">${x}</span>`)
    .replace(/\{\{(.+?)\}\}/g, '<span class="eqz-ovg">$1</span>')
    .replace(/~([^~]+)~/g, '<span class="eqz-ov">$1</span>');
  const SV = (t) => String(t).replace(/~([^~]+)~/g, '<tspan style="text-decoration:overline">$1</tspan>');
  const ov = (s) => Array.from(String(s)).map((c) => c + '̅').join(''); // barra para texto plano (opciones de un select)

  const REG = { PM: 'PM', PP: 'PP', LL: 'LL', HL: 'HL', KB: 'KB' };

  // ---------- escena del tanque con bomba ----------
  const escena = (kb, lv, ll, hl) => {
    const h = lv * 1.5, y = 260 - h, sk = 'style="stroke:' + SEC + ';stroke-width:1"';
    let s = `<rect x="0" y="44" width="40" height="12" style="fill:${S1};stroke:${SEC};stroke-width:1"/><text x="0" y="72" font-size="11" style="fill:${SEC}">Entrada</text>`;
    if (kb) s += `<line class="eqz-flow" x1="0" y1="50" x2="40" y2="50" style="stroke:${BL};stroke-width:4"/>`;
    s += `<path d="M60 28V12H150V112" fill="none" style="stroke:var(--texto-3);stroke-width:12"/><path d="M60 28V12H150V112" fill="none" style="stroke:#fff;stroke-width:9"/>`;
    if (kb) s += `<path class="eqz-flow" d="M60 28V12H150V112" fill="none" style="stroke:${BL};stroke-width:4"/>`;
    s += `<path d="M100 110V260H200V110" fill="none" style="stroke:${INK};stroke-width:2"/>`;
    s += `<rect x="101" y="${y}" width="98" height="${Math.max(0, h - 1)}" style="fill:#85B7EB;opacity:.75"/>`;
    if (kb && lv < 100) s += `<line class="eqz-flow" x1="150" y1="112" x2="150" y2="${y}" style="stroke:${BL};stroke-width:4"/>`;
    s += `<rect x="88" y="36" width="44" height="28" rx="4" style="fill:${kb ? '#C0DD97' : S1};stroke:${kb ? '#3B6D11' : INK};stroke-width:1.5"/>`;
    s += [96, 104, 112].map((x) => `<line x1="${x}" y1="36" x2="${x}" y2="64" ${sk}/>`).join('');
    s += `<line x1="80" y1="50" x2="88" y2="50" style="stroke:${INK};stroke-width:3"/><circle cx="60" cy="50" r="22" style="fill:${S1};stroke:${INK};stroke-width:2"/>`;
    s += `<g class="${kb ? 'eqz-spin' : ''}"><line x1="60" y1="36" x2="60" y2="64" style="stroke:${INK};stroke-width:2.5"/><line x1="46" y1="50" x2="74" y2="50" style="stroke:${INK};stroke-width:2.5"/></g><circle cx="60" cy="50" r="4" style="fill:${INK}"/>`;
    s += `<rect x="14" y="80" width="92" height="22" rx="6" style="fill:${kb ? G : S1};stroke:${SEC};stroke-width:1"/><text x="60" y="95" font-size="13" text-anchor="middle" style="fill:${kb ? GD : SEC};font-weight:500">Bomba ${kb ? 'ON' : 'OFF'}</text>`;
    [[25, 'LL', ll], [80, 'HL', hl]].forEach(([q, n, v]) => {
      const yy = 260 - q * 1.5;
      s += `<line x1="200" y1="${yy}" x2="210" y2="${yy}" stroke-dasharray="3 3" ${sk}/><line x1="100" y1="${yy}" x2="200" y2="${yy}" stroke-dasharray="4 4" style="stroke:${SEC};stroke-width:.7;opacity:.6"/>`;
      s += `<circle cx="218" cy="${yy}" r="8" style="fill:${v ? G : S1};stroke:${SEC};stroke-width:1"/><text x="232" y="${yy + 4}" font-size="13" style="fill:${INK}">${n} = ${v}</text>`;
    });
    s += `<text x="150" y="278" font-size="13" text-anchor="middle" style="fill:${SEC}">Nivel ${Math.round(lv)} %</text>`;
    return `<svg viewBox="0 0 300 290" style="width:100%;max-width:360px;display:block;margin:0 auto" role="img" aria-label="Tanque con bomba hidráulica, tubería y sensores de nivel">${s}</svg>`;
  };

  // ---------- GRAFCET nivel 2 ----------
  // S: estado {E0,E1,E2,KB,PM,PP,LL,HL}; mode: 'live' o 'derive'; o: resaltados {hs,hr,ts,tr}; L: nombres de las señales
  const grafcet = (S, mode, o, L) => {
    o = o || {}; L = Object.assign({}, REG, L || {});
    const box = (id) => {
      if (mode === 'live') { const on = S[id]; return { f: on ? G : S2, t: on ? GD : INK, s: INK }; }
      if (o.hs && o.hs.includes(id)) return { f: '#E6F1FB', t: '#0C447C', s: BL };
      if (o.hr && o.hr.includes(id)) return { f: '#FCEBEB', t: '#791F1F', s: RD };
      return { f: S2, t: INK, s: INK };
    };
    const tcol = (k, on) => mode === 'live' ? (on ? G : INK) : (o.ts && o.ts.includes(k)) ? BL : (o.tr && o.tr.includes(k)) ? RD : INK;
    const tw = (k, on) => mode === 'live' ? (on ? 5 : 2.5) : (((o.ts && o.ts.includes(k)) || (o.tr && o.tr.includes(k))) ? 5 : 2.5);
    const t1 = S.E0 && S.PM, t2 = S.E1 && !S.LL, t3 = S.E2 && (S.HL || !S.PP), t4 = S.E1 && !S.PP;
    const stp = (id, y, init) => {
      const c = box(id); let q = '';
      if (init) q += `<rect x="106" y="${y - 4}" width="48" height="48" style="fill:none;stroke:${c.s};stroke-width:1.5"/>`;
      return q + `<rect x="110" y="${y}" width="40" height="40" style="fill:${c.f};stroke:${c.s};stroke-width:2"/><text x="130" y="${y + 25}" font-size="14" text-anchor="middle" style="fill:${c.t};font-weight:500">${id}</text>`;
    };
    const trH = (k, x, y, lab, on) => `<line x1="${x - 11}" y1="${y}" x2="${x + 11}" y2="${y}" style="stroke:${tcol(k, on)};stroke-width:${tw(k, on)}"/><text x="${x + 18}" y="${y + 4}" font-size="13" style="fill:${INK}">${SV(lab)}</text>`;
    const Ln = (d) => `<path d="${d}" fill="none" style="stroke:${INK};stroke-width:1.5"/>`;
    const mk = 'eqzar' + mode;
    let s = `<defs><marker id="${mk}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#16202c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>`;
    s += Ln('M130 70V140') + Ln('M130 180V250') + Ln('M130 198H30');
    s += `<path d="M130 290V360H30V10H130V28" fill="none" marker-end="url(#${mk})" style="stroke:${INK};stroke-width:1.5"/><circle cx="130" cy="198" r="3" style="fill:${INK}"/>`;
    s += trH('PM', 130, 105, L.PM, t1) + trH('LL', 130, 215, '~' + L.LL + '~', t2) + trH('HL', 130, 325, L.HL + ' + ~' + L.PP + '~', t3);
    s += `<line x1="70" y1="188" x2="70" y2="208" style="stroke:${tcol('PE1', t4)};stroke-width:${tw('PE1', t4)}"/><text x="70" y="182" font-size="13" text-anchor="middle" style="fill:${INK}">${SV('~' + L.PP + '~')}</text>`;
    s += stp('E0', 30, true) + stp('E1', 140) + stp('E2', 250);
    const kbOn = mode === 'live' ? S.KB : 0;
    s += `<line x1="150" y1="270" x2="160" y2="270" style="stroke:${INK};stroke-width:1.5"/><rect x="160" y="256" width="104" height="28" style="fill:${kbOn ? G : S2};stroke:${INK};stroke-width:1.5"/><text x="212" y="274" font-size="13" text-anchor="middle" style="fill:${kbOn ? GD : INK}">${L.accion || (L.KB + ': bomba ON')}</text>`;
    return `<svg viewBox="0 0 270 380" style="width:100%;max-width:420px;display:block;margin:0 auto" role="img" aria-label="GRAFCET de nivel 2">${s}</svg>`;
  };

  // ---------- diagrama escalera ----------
  const C = (n, neg, t) => ({ n, neg: !!neg, t: t || 'o' });
  const RUNGS = [
    { y: 40, parts: [C('E1', 1), C('E2', 1)], coil: 'E0' },
    { y: 105, parts: [{ par: [[C('E0', 0, 's'), C('PM', 0, 's')], [C('E1', 0, 'k')]] }, C('E2', 1, 'r'), C('PP', 0, 'r')], coil: 'E1' },
    { y: 200, parts: [{ par: [[C('E1', 0, 's'), C('LL', 1, 's')], [C('E2', 0, 'k')]] }, C('PP', 0, 'r'), C('HL', 1, 'r')], coil: 'E2' },
    { y: 290, parts: [C('E2')], coil: 'KB' }
  ];
  const TC = { s: BL, k: PU, r: RD, o: SEC };
  // mode: 'live' (energía en verde), 'map' (colores por función) o 'plain' (sin color); sel = escalón a resaltar; rungs = lista de escalones (por defecto, los 4)
  const escalera = (S, mode, sel, L, rungs) => {
    L = Object.assign({}, REG, L || {}); rungs = rungs || RUNGS;
    const cond = (c) => c.neg ? !S[c.n] : !!S[c.n];
    const lin = (x1, y1, x2, y2, on, w) => {
      const col = mode === 'live' ? (on ? G : '#c3ccd6') : SEC, ww = mode === 'live' ? (w || (on ? 3 : 2)) : (w || 2);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-linecap="round" style="stroke:${col};stroke-width:${ww}"/>`;
    };
    const rail = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-linecap="round" style="stroke:${INK};stroke-width:2.5"/>`;
    const contact = (cx, y, c, pIn) => {
      const cl = cond(c), on = pIn && cl;
      const col = mode === 'live' ? (cl ? G : SEC) : (mode === 'map' ? TC[c.t] : SEC);
      let s = lin(cx - 30, y, cx - 8, y, pIn) + lin(cx + 8, y, cx + 30, y, on);
      s += `<line x1="${cx - 7}" y1="${y - 10}" x2="${cx - 7}" y2="${y + 10}" style="stroke:${col};stroke-width:3"/><line x1="${cx + 7}" y1="${y - 10}" x2="${cx + 7}" y2="${y + 10}" style="stroke:${col};stroke-width:3"/>`;
      if (c.neg) s += `<line x1="${cx - 11}" y1="${y + 11}" x2="${cx + 11}" y2="${y - 11}" style="stroke:${col};stroke-width:1.5"/>`;
      const nm = L[c.n] || c.n;
      return s + `<text x="${cx}" y="${y - 16}" font-size="13" text-anchor="middle" style="fill:${INK}">${SV(nm)}</text>`;
    };
    const top = rungs[0].y - 25, bot = rungs[rungs.length - 1].y + 25 + (rungs[rungs.length - 1].parts.some((p) => p.par) ? 40 : 0);
    let s = rail(20, top, 20, bot) + rail(400, top, 400, bot);
    rungs.forEach((r, ri) => {
      const y = r.y; let x = 30, p = true, g = lin(20, y, 30, y, true);
      r.parts.forEach((pt) => {
        if (pt.par) {
          const n = pt.par.length, inner = Math.max(...pt.par.map((b) => b.length)) * 60, xr = x + 24 + inner; let any = false;
          pt.par.forEach((b, i) => {
            const yy = y + i * 40; let q = p, cx = x + 12;
            g += lin(x, yy, x + 12, yy, p);
            b.forEach((c) => { g += contact(cx + 30, yy, c, q); q = q && cond(c); cx += 60; });
            if (cx < x + 12 + inner) g += lin(cx, yy, x + 12 + inner, yy, q);
            g += lin(x + 12 + inner, yy, xr, yy, q);
            if (q) any = true;
          });
          g += lin(x, y, x, y + (n - 1) * 40, p) + lin(xr, y, xr, y + (n - 1) * 40, any);
          x = xr; p = any;
        } else { g += contact(x + 30, y, pt, p); p = p && cond(pt); x += 60; }
      });
      g += lin(x, y, 331, y, p) + lin(359, y, 400, y, p);
      const on = mode === 'live' && S[r.coil];
      g += `<circle cx="345" cy="${y}" r="15" style="fill:${on ? G : S2};stroke:${on ? G : SEC};stroke-width:2"/><text x="345" y="${y + 4}" font-size="13" text-anchor="middle" style="fill:${on ? GD : INK};font-weight:500">${L[r.coil] || r.coil}</text>`;
      const dim = mode === 'map' && sel != null && sel !== ri;
      s += `<g style="opacity:${dim ? 0.25 : 1}">${g}</g>`;
    });
    return `<svg viewBox="0 ${top - 5} 420 ${bot - top + 15}" style="width:100%;display:block" role="img" aria-label="Diagrama escalera">${s}</svg>`;
  };

  // ---------- contenido didáctico ----------
  const DERIV = {
    E1: { name: 'Etapa 1', stages: [
      { t: 'Entrada: el SET', d: 'Mira de qué etapa viene la flecha y qué transición cruza. El SET es la etapa anterior multiplicada por la condición.', eq: [['SE1 = E0 · PM', 's']], hs: ['E0'], ts: ['PM'] },
      { t: 'Salida: el RESET', d: 'La etapa se apaga cuando se activa la siguiente (E2) o cuando se cumple su otra salida: el paro.', eq: [['SE1 = E0 · PM', 's'], ['RE1 = E2 + ~PP~', 'r']], hs: ['E0'], ts: ['PM'], hr: ['E2'], tr: ['PE1'] },
      { t: 'Niega el RESET', d: 'La etapa se mantiene mientras el RESET no ocurra. Por eso se niega el RESET completo: la barra grande cubre toda la suma y la barra pequeña sigue sobre PP.', eq: [['SE1 = E0 · PM', 's'], ['~RE1~ = {{E2 + ~PP~}}', 'r']], hs: ['E0'], ts: ['PM'], hr: ['E2'], tr: ['PE1'] },
      { t: 'Aplica De Morgan', d: 'Una barra larga sobre una suma se reparte: cada término queda con su propia barra y la suma pasa a producto. La doble barra sobre PP se cancela.', eq: [['SE1 = E0 · PM', 's'], ['~RE1~ = {{E2 + ~PP~}} = ~E2~ · PP', 'r']], hr: ['E2'], tr: ['PE1'] },
      { t: 'Ecuaciones finales', d: 'Estas dos ecuaciones son el resultado de la etapa 1: una para encenderla y otra para mantenerla mientras no se apague.', eq: [['SE1 = E0 · PM', 's'], ['~RE1~ = ~E2~ · PP', 'r']] }
    ] },
    E2: { name: 'Etapa 2', stages: [
      { t: 'Entrada: el SET', d: 'E2 viene de E1 y la transición es nivel bajo.', eq: [['SE2 = E1 · ~LL~', 's']], hs: ['E1'], ts: ['LL'] },
      { t: 'Salida: el RESET', d: 'Se apaga con el paro o con el nivel alto. Las dos condiciones están en la misma transición, unidas con una suma.', eq: [['SE2 = E1 · ~LL~', 's'], ['RE2 = ~PP~ + HL', 'r']], hs: ['E1'], ts: ['LL'], tr: ['HL'] },
      { t: 'Niega el RESET', d: 'La etapa se mantiene mientras el RESET no ocurra. La barra grande cubre toda la suma y la barra pequeña sigue sobre PP.', eq: [['SE2 = E1 · ~LL~', 's'], ['~RE2~ = {{~PP~ + HL}}', 'r']], hs: ['E1'], ts: ['LL'], tr: ['HL'] },
      { t: 'Aplica De Morgan', d: 'Se reparte la barra: ~PP~ queda negado dos veces, es decir PP, y HL queda negado.', eq: [['SE2 = E1 · ~LL~', 's'], ['~RE2~ = {{~PP~ + HL}} = PP · ~HL~', 'r']], tr: ['HL'] },
      { t: 'Ecuaciones finales', d: 'Estas dos ecuaciones son el resultado de la etapa 2.', eq: [['SE2 = E1 · ~LL~', 's'], ['~RE2~ = PP · ~HL~', 'r']] }
    ] },
    E0: { name: 'Etapa 0 y salida', stages: [
      { t: 'La etapa inicial es distinta', d: 'E0 no tiene SET ni RESET propios: está activa cuando ninguna otra etapa lo está. También arranca activa al energizar.', eq: [['E0 activa = E1 apagada y E2 apagada', 'n']], hr: ['E1', 'E2'] },
      { t: 'Escríbela con barras', d: 'Apagada se escribe con barra sobre la etapa. Las dos condiciones van en serie.', eq: [['E0 = ~E1~ · ~E2~', 'f']], hr: ['E1', 'E2'] },
      { t: 'La salida', d: 'La acción del GRAFCET queda asociada a la etapa que la ordena: la bomba funciona mientras E2 esté activa.', eq: [['E0 = ~E1~ · ~E2~', 'f'], ['KB = E2', 'f']], hs: ['E2'] }
    ] }
  };
  const FIN = {
    E1: [['SE1 = E0 · PM', 's'], ['~RE1~ = ~E2~ · PP', 'r']],
    E2: [['SE2 = E1 · ~LL~', 's'], ['~RE2~ = PP · ~HL~', 'r']],
    E0: [['E0 = ~E1~ · ~E2~', 'f'], ['KB = E2', 'f']]
  };
  const RUNGTXT = [
    { n: 'Escalón 1 · E0', eq: [['E0 = ~E1~ · ~E2~', 'n']], d: 'Dos contactos normalmente cerrados en serie: E0 se enciende solo si E1 y E2 están apagadas.' },
    { n: 'Escalón 2 · E1', eq: [['SE1 = E0 · PM', 's'], ['~RE1~ = ~E2~ · PP', 'r']], d: 'El SET (E0 y PM en serie) va en la rama de arriba. El contacto E1 en paralelo, con el mismo nombre que la bobina, hace que se sostenga sola. El RESET negado (~E2~ y PP en serie) va después, en serie con todo lo anterior.' },
    { n: 'Escalón 3 · E2', eq: [['SE2 = E1 · ~LL~', 's'], ['~RE2~ = PP · ~HL~', 'r']], d: 'Mismo molde: el SET (E1 y ~LL~ en serie) arriba, el contacto E2 en paralelo como enclavamiento, y el RESET negado (PP y ~HL~ en serie) a continuación.' },
    { n: 'Escalón 4 · KB', eq: [['KB = E2', 'n']], d: 'Un solo contacto: la bomba funciona mientras E2 esté activa.' }
  ];
  const EQROWS = [['E0', ['E0 = ~E1~ · ~E2~']], ['E1', ['SE1 = E0 · PM', '~RE1~ = ~E2~ · PP']], ['E2', ['SE2 = E1 · ~LL~', '~RE2~ = PP · ~HL~']], ['KB', ['KB = E2']]];
  const nuevoEstado = () => ({ E0: 1, E1: 0, E2: 0, KB: 0, PM: 0, PP: 1, LL: 1, HL: 0 });
  const chip = (n, v) => `<span class="eqz-chip" style="background:${v ? G : S1};color:${v ? GD : SEC}">${R(n)} = ${v}</span>`;
  const bt = (t, extra = '') => `<button type="button" class="boton chico eqz-btn" ${extra}>${t}</button>`;

  // ---------- vista 1: el tanque ----------
  const vistaTanque = (r) => {
    let kb = 0;
    r.innerHTML = `<p style="margin:0 0 12px;line-height:1.65">Un tanque se llena con una bomba. Se arranca con el pulsador de marcha; la bomba funciona cuando el nivel baja de LL y se detiene al llegar a HL. El pulsador de paro detiene todo. Este es su GRAFCET de nivel 2.</p>
      <div class="eqz-grid"><div class="eqz-card"><div data-r="sc"></div><div style="padding:6px 8px 8px">${bt('Encender bomba', 'data-r="demo"')}</div></div>
      <div class="eqz-card" data-r="gr"></div></div>
      <div class="eqz-grid" style="margin-top:12px;gap:8px;font-size:.85rem;color:var(--texto-2)">
        <div class="panel-info"><b>LL y HL</b><br>1 = agua por encima del sensor; 0 = por debajo.</div>
        <div class="panel-info"><b>PM y PP</b><br>PP es un pulsador NC: vale 1 sin pulsar. Paro pulsado se escribe ${R('~PP~')}.</div>
        <div class="panel-info"><b>KB</b><br>Contactor de la bomba: 1 = bomba ON.</div></div>`;
    const q = (s) => r.querySelector(s);
    const pinta = () => { q('[data-r=sc]').innerHTML = escena(kb, 60, 1, 0); const b = q('[data-r=demo]'); b.classList.toggle('on', !!kb); b.textContent = kb ? 'Apagar bomba' : 'Encender bomba'; };
    q('[data-r=demo]').onclick = () => { kb = kb ? 0 : 1; pinta(); };
    q('[data-r=gr]').innerHTML = grafcet(nuevoEstado(), 'derive', {});
    pinta();
  };

  // ---------- vista 2: de cada etapa a sus ecuaciones ----------
  const vistaDeriva = (r, opts) => {
    const orden = ['E1', 'E2', 'E0'], hechas = { E1: 0, E2: 0, E0: 0 };
    let sel = orden.includes(opts.etapa) ? opts.etapa : 'E1', st = Math.max(0, Math.min((opts.paso || 1) - 1, DERIV[sel].stages.length - 1));
    r.innerHTML = `<p style="margin:0 0 10px;line-height:1.65">Elige una etapa y recorre cómo se escribe su ecuación. En el GRAFCET, <b style="color:#0C447C">azul</b> marca lo que entra (SET) y <b style="color:#791F1F">rojo</b> lo que apaga (RESET).</p>
      <div class="controles" data-r="sel" style="margin:0 0 10px"></div>
      <div class="eqz-grid"><div class="eqz-card" data-r="gr"></div>
      <div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><b data-r="tt"></b><span data-r="dots" style="display:flex;gap:6px"></span></div>
        <p data-r="dd" style="margin:0 0 6px;color:var(--texto-2);line-height:1.6"></p><div data-r="ee"></div>
        <div style="display:flex;justify-content:space-between;margin-top:8px">${bt('Atrás', 'data-r="ant"')}${bt('Siguiente', 'data-r="sig"')}</div>
        <div data-r="sum" style="margin-top:14px;border-top:1px solid var(--borde);padding-top:10px"></div></div></div>`;
    const q = (s) => r.querySelector(s);
    const pinta = () => {
      const D = DERIV[sel], k = D.stages[st];
      if (st === D.stages.length - 1) hechas[sel] = 1;
      q('[data-r=sel]').innerHTML = orden.map((e) => `<button type="button" class="boton chico eqz-btn${sel === e ? ' sel' : ''}" data-e="${e}">${DERIV[e].name}${hechas[e] ? ' ✓' : ''}</button>`).join('');
      q('[data-r=sel]').querySelectorAll('button').forEach((b) => { b.onclick = () => { sel = b.dataset.e; st = 0; pinta(); }; });
      q('[data-r=gr]').innerHTML = grafcet(nuevoEstado(), 'derive', { hs: k.hs, hr: k.hr, ts: k.ts, tr: k.tr });
      q('[data-r=tt]').textContent = `${st + 1}. ${k.t}`;
      q('[data-r=dots]').innerHTML = D.stages.map((_, i) => `<span class="eqz-dot${i === st ? ' a' : ''}"></span>`).join('');
      q('[data-r=dd]').innerHTML = R(k.d);
      q('[data-r=ee]').innerHTML = k.eq.map((e, i) => `<div class="eqz-eq eqz-${e[1]}" style="opacity:${i === k.eq.length - 1 ? 1 : .65}">${R(e[0])}</div>`).join('');
      q('[data-r=ant]').style.visibility = st === 0 ? 'hidden' : 'visible';
      const ultimo = st === D.stages.length - 1, ni = orden.indexOf(sel) + 1;
      q('[data-r=sig]').style.visibility = (ultimo && ni >= orden.length) ? 'hidden' : 'visible';
      q('[data-r=sig]').textContent = ultimo ? 'Siguiente etapa' : 'Siguiente';
      q('[data-r=sum]').innerHTML = `<div style="font-size:.85rem;color:var(--texto-2);margin-bottom:4px">Tus ecuaciones</div>` +
        orden.map((e) => hechas[e] ? FIN[e].map((x) => `<div class="eqz-eq eqz-${x[1]}" style="margin:4px 0">${R(x[0])}</div>`).join('') : `<div class="eqz-eq eqz-n" style="margin:4px 0;color:var(--texto-3)">${DERIV[e].name}: pendiente</div>`).join('');
    };
    q('[data-r=ant]').onclick = () => { if (st > 0) { st--; pinta(); } };
    q('[data-r=sig]').onclick = () => {
      const D = DERIV[sel];
      if (st < D.stages.length - 1) { st++; pinta(); } else { const ni = orden.indexOf(sel) + 1; if (ni < orden.length) { sel = orden[ni]; st = 0; pinta(); } }
    };
    pinta();
  };

  // ---------- vista 3: de las ecuaciones al diagrama escalera ----------
  const vistaEscalera = (r, opts) => {
    let rsel = Math.max(0, Math.min((opts.escalon || 2) - 1, 3));
    r.innerHTML = `<p style="margin:0 0 10px;line-height:1.65">Cada ecuación ya es un circuito: el producto es serie, la suma es paralelo y la barra es un contacto normalmente cerrado. Elige un escalón.</p>
      <div class="controles" data-r="rc" style="margin:0 0 10px"></div>
      <div class="eqz-grid"><div class="eqz-card" data-r="ld"></div>
      <div><div data-r="re"></div><p data-r="rd" style="color:var(--texto-2);line-height:1.6;margin:8px 0 12px"></p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:.85rem"><span class="eqz-cs">SET</span><span class="eqz-ck">Enclavamiento (mismo nombre)</span><span class="eqz-cr">RESET negado</span></div>
        <p style="font-size:.85rem;color:var(--texto-2);margin:12px 0 0">El contacto con la raya inclinada es normalmente cerrado: en la escalera la raya ya lo indica, y solo en la ecuación se escribe con barra.</p></div></div>`;
    const q = (s) => r.querySelector(s), S = nuevoEstado();
    const pinta = () => {
      q('[data-r=rc]').innerHTML = RUNGTXT.map((x, i) => `<button type="button" class="boton chico eqz-btn${rsel === i ? ' sel' : ''}" data-i="${i}">${x.n}</button>`).join('');
      q('[data-r=rc]').querySelectorAll('button').forEach((b) => { b.onclick = () => { rsel = +b.dataset.i; pinta(); }; });
      q('[data-r=ld]').innerHTML = escalera(S, 'map', rsel);
      q('[data-r=re]').innerHTML = RUNGTXT[rsel].eq.map((e) => `<div class="eqz-eq eqz-${e[1]}">${R(e[0])}</div>`).join('');
      q('[data-r=rd]').innerHTML = R(RUNGTXT[rsel].d);
    };
    pinta();
  };

  // ---------- vista 4: pruébalo (tres ventanas) ----------
  const vistaPrueba = (r, opts, vivos) => {
    const S = nuevoEstado();
    let level = 60, scan = 0, pmHold = false, pmPend = false, pp = false, timer = null, vista = ['gr', 'eq', 'ld'].includes(opts.vista) ? opts.vista : 'gr';
    r.innerHTML = `<p style="margin:0 0 10px;line-height:1.65">Mantén pulsado Marcha. Consume agua hasta que LL valga 0 y mira cómo la bomba llena el tanque hasta HL. Prueba también el paro. Cambia de ventana para ver lo mismo desde el GRAFCET, las ecuaciones lógicas o el diagrama escalera.</p>
      <div class="controles" data-r="vt" style="margin:0 0 10px">
        <button type="button" class="boton chico eqz-btn" data-v="gr">Tanque y GRAFCET</button>
        <button type="button" class="boton chico eqz-btn" data-v="eq">Tanque y ecuaciones lógicas</button>
        <button type="button" class="boton chico eqz-btn" data-v="ld">Tanque y diagrama escalera</button></div>
      <div class="eqz-grid"><div>
        <div class="eqz-card" data-r="sc"></div>
        <div class="controles" style="margin:10px 0">${bt('Marcha (PM)', 'data-r="pm"')}${bt('Paro (PP)', 'data-r="pp"')}${bt('Consumir agua', 'data-r="cons"')}</div>
        <div style="display:flex;align-items:center;gap:10px;font-size:.85rem;color:var(--texto-2);margin-bottom:8px"><span>Nivel</span><input type="range" data-r="lv" min="0" max="100" value="60" step="1" style="flex:1"><span data-r="lvt" style="min-width:36px;text-align:right">60 %</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;font-size:.85rem;color:var(--texto-2)"><label style="display:flex;gap:6px;align-items:center;cursor:pointer"><input type="checkbox" data-r="auto" checked>Escaneo automático</label>${bt('Un escaneo', 'data-r="un"')}<span data-r="sct"></span></div>
        <div data-r="chips" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px"></div></div>
      <div data-r="vw"></div></div>`;
    const q = (s) => r.querySelector(s);
    const sens = () => { S.LL = level >= 25 ? 1 : 0; S.HL = level >= 80 ? 1 : 0; S.PP = pp ? 0 : 1; S.PM = pmHold ? 1 : 0; };
    const vistaHTML = () => vista === 'gr' ? `<div class="eqz-card"><div style="font-size:.85rem;color:var(--texto-2);padding:2px 6px">GRAFCET nivel 2</div><div data-r="g4"></div></div>`
      : vista === 'eq' ? `<div class="eqz-card" style="padding:8px 14px"><div style="font-size:.85rem;color:var(--texto-2);padding:2px 0 4px">Ecuaciones lógicas</div><div data-r="eqs"></div></div>`
      : `<div class="eqz-card"><div style="font-size:.85rem;color:var(--texto-2);padding:2px 6px">Diagrama escalera</div><div data-r="l4"></div></div>`;
    const pinta = () => {
      if (!r.isConnected) return;
      sens();
      q('[data-r=sc]').innerHTML = escena(S.KB, level, S.LL, S.HL);
      q('[data-r=lv]').value = Math.round(level); q('[data-r=lvt]').textContent = Math.round(level) + ' %';
      q('[data-r=sct]').textContent = 'Escaneo ' + scan;
      q('[data-r=pm]').classList.toggle('on', !!S.PM); q('[data-r=pp]').classList.toggle('on', pp);
      q('[data-r=chips]').innerHTML = ['PM', 'PP', 'LL', 'HL', 'KB'].map((n) => chip(n, S[n])).join('');
      const g4 = q('[data-r=g4]'), l4 = q('[data-r=l4]'), eqs = q('[data-r=eqs]');
      if (g4) g4.innerHTML = grafcet(S, 'live');
      if (l4) l4.innerHTML = escalera(S, 'live');
      if (eqs) eqs.innerHTML = EQROWS.map(([n, ts]) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--borde);font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.95rem;line-height:2.1"><span>${ts.map((t) => R(t)).join('<br>')}</span>${chip(n, S[n])}</div>`).join('');
    };
    const escaneo = () => {
      if (S.KB) level = Math.min(100, level + 4);
      sens();
      S.E0 = (!S.E1 && !S.E2) ? 1 : 0;
      S.E1 = (((S.E0 && S.PM) || S.E1) && !S.E2 && S.PP) ? 1 : 0;
      S.E2 = (((S.E1 && !S.LL) || S.E2) && S.PP && !S.HL) ? 1 : 0;
      S.KB = S.E2; scan++; pinta();
      if (pmPend) { pmHold = false; pmPend = false; pinta(); }
    };
    const poner = () => {
      q('[data-r=vt]').querySelectorAll('button').forEach((b) => b.classList.toggle('sel', b.dataset.v === vista));
      q('[data-r=vw]').innerHTML = vistaHTML(); pinta();
    };
    q('[data-r=vt]').querySelectorAll('button').forEach((b) => { b.onclick = () => { vista = b.dataset.v; poner(); }; });
    const pm = q('[data-r=pm]');
    pm.addEventListener('pointerdown', (e) => { e.preventDefault(); pmHold = true; pmPend = false; pinta(); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => pm.addEventListener(ev, () => { if (pmHold) { pmPend = true; if (!q('[data-r=auto]').checked) pinta(); } }));
    q('[data-r=pp]').onclick = () => { pp = !pp; pinta(); };
    q('[data-r=cons]').onclick = () => { level = Math.max(0, level - 15); pinta(); };
    q('[data-r=lv]').oninput = (e) => { level = +e.target.value; pinta(); };
    q('[data-r=un]').onclick = escaneo;
    const auto = () => { clearInterval(timer); timer = null; if (q('[data-r=auto]').checked) timer = setInterval(escaneo, 600); };
    q('[data-r=auto]').onchange = auto;
    vivos.push({ parar() { clearInterval(timer); timer = null; } });
    auto(); poner();
  };

  // ---------- diagrama con pestañas ----------
  II.diagramas.ecuaciones = (cont, opts = {}) => {
    cont.classList.add('diagrama');
    const defs = [{ id: 'tanque', t: '1 · El tanque' }, { id: 'ecuaciones', t: '2 · Ecuaciones' }, { id: 'escalera', t: '3 · Escalera' }, { id: 'prueba', t: '4 · Pruébalo' }];
    const ini = defs.some((d) => d.id === opts.pestana) ? opts.pestana : 'tanque';
    const T = PL.pestanas(cont, defs, ini);
    const vivos = [];
    vistaTanque(T.raiz('tanque'));
    vistaDeriva(T.raiz('ecuaciones'), opts);
    vistaEscalera(T.raiz('escalera'), opts);
    vistaPrueba(T.raiz('prueba'), opts, vivos);
    return { destruir() { vivos.forEach((v) => v.parar()); }, pestana: T.pestana };
  };
  ['tanque', 'ecuaciones', 'escalera', 'prueba'].forEach((id) => { II.diagramas['ecuaciones_' + id] = (cont, o = {}) => II.diagramas.ecuaciones(cont, { ...o, pestana: id }); });
  II.diagramas.ecuaciones_deriva = (cont, o = {}) => II.diagramas.ecuaciones(cont, { ...o, pestana: 'ecuaciones' });

  // ---------- para los retos ----------
  PL.ecuaciones = {
    R, ov, REG,
    // GRAFCET del tanque con nombres propios (estático)
    svgGr: (L) => `<div class="lienzo" style="margin:8px 0">${grafcet(nuevoEstado(), 'derive', {}, L)}</div>`,
    // un escalón (0 = E0, 1 = E1, 2 = E2, 3 = KB) con nombres propios y valores de entrada
    svgLd: (idx, L, valores) => `<div class="lienzo" style="margin:8px 0">${escalera(Object.assign(nuevoEstado(), valores || {}), 'plain', null, L, [Object.assign({}, RUNGS[idx], { y: 40 })])}</div>`
  };
})();
