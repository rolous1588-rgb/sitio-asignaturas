// ============================================================
// Práctica de los dos motores (06/11/2026): GRAFCET con ramas simultáneas, ecuaciones SET/RESET y diagrama escalera.
// Pestañas: grafcet, ecuaciones, escalera. Arriba va siempre el panel (pulsadores PA, PP, P1, P2, P3 y los motores KA y KB).
// Atajos: motores_grafcet, motores_ecuaciones, motores_escalera. Exporta PL.motores { crear } para el diagrama de interfaces.
// Reglas acordadas con el docente en el chat: PP y P3 son pulsadores normalmente cerrados (valen 1 en reposo); PA, P1 y P2 normalmente abiertos.
// KA = E1 + E3; KB = E5; T1 = 8 s sobre E2; T2 = 5 s sobre E4. Verde #2BD65B = activo.
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  II.diagramas = II.diagramas || {};
  const PL = (II.pl = II.pl || {});
  const G = '#2BD65B', GD = '#04260F', INK = 'var(--texto)', SEC = 'var(--texto-2)', S1 = 'var(--superficie-2)', S2 = 'var(--superficie)', BRD = 'var(--borde-2)';

  if (!document.getElementById('mtr-css')) {
    const st = document.createElement('style');
    st.id = 'mtr-css';
    st.textContent = `
.mtr-btns{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;max-width:520px}
.mtr-bt{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:.72rem;color:var(--texto-2);text-align:center}
.mtr-bt button{width:54px;height:54px;border-radius:50%;border:2px solid ${BRD};background:${S2};color:${INK};font-weight:600;font-size:.95rem;cursor:pointer;touch-action:none;user-select:none}
.mtr-bt button.nc{border-color:#E24B4A;background:#FCEBEB;color:#791F1F}.mtr-bt button.no{border-color:#639922;background:#EAF3DE;color:#27500A}
.mtr-bt button.on{transform:scale(.92);border-width:4px}
.mtr-mot{display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:420px}
.mtr-m{border:1px solid var(--borde);border-radius:12px;padding:8px;text-align:center;background:${S2};font-size:.85rem;color:var(--texto-2)}
.mtr-m b{display:block;color:${INK};font-size:.95rem}
.mtr-et{display:flex;gap:6px;flex-wrap:wrap}
.mtr-e{min-width:36px;padding:4px 8px;border-radius:8px;border:1px solid var(--borde);text-align:center;font-size:.85rem;color:var(--texto-2)}
.mtr-e.on{background:${G};border-color:${G};color:${GD};font-weight:600}
.mtr-bar{height:8px;border-radius:4px;background:${S1};border:1px solid var(--borde);overflow:hidden;margin-top:3px}.mtr-bar i{display:block;height:100%;width:0;background:#378ADD}
.mtr-row{display:grid;grid-template-columns:minmax(52px,70px) 1fr 1fr;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--borde);font-size:.9rem}
.mtr-eq{font-family:ui-monospace,Menlo,Consolas,monospace;line-height:1.9}
.mtr-chip{display:inline-block;min-width:22px;text-align:center;font-size:.78rem;padding:1px 6px;border-radius:6px;margin-left:6px;border:1px solid var(--borde);background:${S1};color:${SEC}}.mtr-chip.v{background:${G};border-color:${G};color:${GD}}
@media (prefers-reduced-motion:no-preference){.mtr-spin{transform-origin:0 0}}`;
    document.head.appendChild(st);
  }
  const ov = (t) => `<span style="text-decoration:overline;text-decoration-thickness:1.5px">${t}</span>`;

  // ---------- el modelo: se evalúa en el mismo orden de los escalones ----------
  const crear = () => {
    const I = { PA: 0, PP: 1, P1: 0, P2: 0, P3: 1 };
    const S = { E0: 1, E1: 0, E2: 0, E3: 0, E4: 0, E5: 0, E6: 0, T1: 0, T2: 0, t1: 0, t2: 0, KA: 0, KB: 0 };
    const scan = (dt) => {
      const e0 = !(S.E1 || S.E2 || S.E3 || S.E4 || S.E5 || S.E6);
      S.E0 = e0 ? 1 : 0;
      S.E1 = ((e0 && I.PA) || S.E1) && !S.E2 && I.PP ? 1 : 0;
      S.E2 = ((S.E1 && I.P1) || S.E2) && !S.E3 && I.PP ? 1 : 0;
      S.t1 = S.E2 ? Math.min(8, S.t1 + dt) : 0; S.T1 = S.t1 >= 8 ? 1 : 0;
      S.E3 = ((S.E2 && S.T1) || S.E3) && !S.E6 && I.PP ? 1 : 0;
      S.E4 = ((e0 && I.PA) || S.E4) && !S.E5 && I.PP ? 1 : 0;
      S.t2 = S.E4 ? Math.min(5, S.t2 + dt) : 0; S.T2 = S.t2 >= 5 ? 1 : 0;
      S.E5 = ((S.E4 && S.T2) || S.E5) && !S.E6 && I.PP ? 1 : 0;
      S.E6 = ((S.E3 && S.E5 && I.P2) || S.E6) && I.P3 ? 1 : 0;
      S.KA = S.E1 || S.E3 ? 1 : 0; S.KB = S.E5 ? 1 : 0;
    };
    const reinicia = () => { ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'T1', 'T2', 't1', 't2'].forEach((k) => (S[k] = 0)); S.E0 = 1; S.KA = 0; S.KB = 0; };
    return { I, S, scan, reinicia };
  };
  const valor = (M, n) => (/^E\d$|^T\d$|^K[AB]$/.test(n) ? M.S[n] : M.I[n]);

  // ---------- dibujos (GRAFCET y escalera) ----------
  const obar = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="2" fill="${INK}"/>`;
  const grafcet = (M) => {
    const S = M.S, ln = (d) => `<path d="${d}" fill="none" stroke="${SEC}" stroke-width="1.5"/>`;
    const step = (x, y, n) => `<rect x="${x - 18}" y="${y}" width="36" height="36" rx="2" fill="${S[n] ? G : S1}" stroke="${INK}" stroke-width="1.2"/><text x="${x}" y="${y + 18}" text-anchor="middle" dominant-baseline="central" font-size="15" font-weight="600" fill="${S[n] ? GD : INK}">${n.slice(1)}</text>`;
    const act = (x, y, n, on) => `<line x1="${x - 18}" y1="${y + 18}" x2="${x + 12}" y2="${y + 18}" stroke="${SEC}" stroke-width="1.5"/><rect x="${x + 12}" y="${y + 6}" width="56" height="24" rx="2" fill="${on ? G : S2}" stroke="${INK}" stroke-width="1.2"/><text x="${x + 40}" y="${y + 18}" text-anchor="middle" dominant-baseline="central" font-size="14" font-weight="600" fill="${on ? GD : INK}">${n}</text>`;
    const tr = (x, y, lbl, bar, dx = 26) => `<line x1="${x - 16}" y1="${y}" x2="${x + 16}" y2="${y}" stroke="${INK}" stroke-width="3"/><text x="${x + dx}" y="${y + 4}" font-size="14" font-weight="600" fill="${INK}">${lbl}</text>${bar ? obar(x + dx, y - 9, bar) : ''}`;
    const trh = (x, y, lbl, w, bajo) => `<line x1="${x}" y1="${y - 9}" x2="${x}" y2="${y + 9}" stroke="${INK}" stroke-width="3"/><text x="${x}" y="${bajo ? y + 26 : y - 18}" text-anchor="middle" font-size="14" font-weight="600" fill="${INK}">${lbl}</text>${obar(x - w / 2, bajo ? y + 13 : y - 31, w)}`;
    const dbl = (y) => `<line x1="220" y1="${y}" x2="480" y2="${y}" stroke="${INK}" stroke-width="2"/><line x1="220" y1="${y + 4}" x2="480" y2="${y + 4}" stroke="${INK}" stroke-width="2"/>`;
    return `<svg viewBox="0 0 680 590" style="width:100%;max-width:680px;display:block;margin:auto" role="img" aria-label="GRAFCET de los dos motores">
      ${ln('M60 550 L60 20 L350 20 L350 40')}${ln('M640 222 L640 20 L350 20')}${ln('M350 520 L350 550 L60 550')}${ln('M350 80 L350 140')}
      ${ln('M250 144 L250 170')}${ln('M250 206 L250 262')}${ln('M250 298 L250 354')}${ln('M250 390 L250 420')}
      ${ln('M450 144 L450 170')}${ln('M450 206 L450 262')}${ln('M450 298 L450 420')}
      ${ln('M250 222 L60 222')}${ln('M250 314 L60 314')}${ln('M450 222 L640 222')}${ln('M350 424 L350 484')}${ln('M350 442 L60 442')}
      ${dbl(140)}${dbl(420)}
      <rect x="328" y="38" width="44" height="44" fill="${S.E0 ? G : S1}" stroke="${INK}" stroke-width="1.2"/><rect x="333" y="43" width="34" height="34" fill="none" stroke="${INK}" stroke-width="1.2"/><text x="350" y="60" text-anchor="middle" dominant-baseline="central" font-size="15" font-weight="600" fill="${S.E0 ? GD : INK}">0</text>
      ${tr(350, 105, 'PA', 0)}
      ${step(250, 170, 'E1')}${act(250, 170, 'KA', S.KA)}${tr(250, 240, 'P1', 0)}${step(250, 262, 'E2')}${tr(250, 332, 't1 = 8 s', 0)}${step(250, 354, 'E3')}${act(250, 354, 'KA', S.KA)}
      ${step(450, 170, 'E4')}${tr(450, 240, 't2 = 5 s', 0)}${step(450, 262, 'E5')}${act(450, 262, 'KB', S.KB)}
      ${tr(350, 464, 'P2', 0)}${step(350, 484, 'E6')}${tr(350, 536, 'P3', 18)}
      ${trh(150, 222, 'PP', 22)}${trh(150, 314, 'PP', 22)}${trh(560, 222, 'PP', 22)}${trh(250, 442, 'PP', 22, true)}
    </svg>`;
  };
  const escalera = (M) => {
    const v = (n) => !!valor(M, n);
    const W = 460, RL = 16, RR = 444, P = 52;
    const w = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${SEC}" stroke-width="1.5"/>`;
    const contact = (x, y, n, nc) => {
      const cl = nc ? !v(n) : v(n), c = cl ? G : INK, sw = cl ? 3.5 : 2.5;
      return `${w(x - P / 2, y, x - 5, y)}${w(x + 5, y, x + P / 2, y)}<line x1="${x - 5}" y1="${y - 9}" x2="${x - 5}" y2="${y + 9}" stroke="${c}" stroke-width="${sw}"/><line x1="${x + 5}" y1="${y - 9}" x2="${x + 5}" y2="${y + 9}" stroke="${c}" stroke-width="${sw}"/>` +
        (nc ? `<line x1="${x - 9}" y1="${y + 10}" x2="${x + 9}" y2="${y - 10}" stroke="${c}" stroke-width="1.8"/>` : '') +
        `<text x="${x}" y="${y - 14}" text-anchor="middle" font-size="12" fill="${SEC}">${n}</text>`;
    };
    const coil = (x, y, n) => {
      const on = v(n), c = on ? G : INK;
      return `${w(x - 60, y, x - 12, y)}${w(x + 12, y, RR, y)}${on ? `<circle cx="${x}" cy="${y}" r="9" fill="${G}" opacity=".35"/>` : ''}<path d="M${x - 6} ${y - 10} Q${x - 14} ${y} ${x - 6} ${y + 10}" fill="none" stroke="${c}" stroke-width="2.5"/><path d="M${x + 6} ${y - 10} Q${x + 14} ${y} ${x + 6} ${y + 10}" fill="none" stroke="${c}" stroke-width="2.5"/><text x="${x}" y="${y - 14}" text-anchor="middle" font-size="13" font-weight="600" fill="${INK}">${n}</text>`;
    };
    const rung = (y0, title, Sr, seal, N, c) => {
      const ym = y0 + 44;
      let o = `<text x="${RL + 6}" y="${y0 + 8}" font-size="13" font-weight="600" fill="${INK}">${title}</text>${w(RL, ym, RL + 20, ym)}`;
      let x = RL + 20;
      if (seal) {
        const gw = Sr.length * P, xe = x + gw, y2 = ym + 36;
        Sr.forEach((s, i) => (o += contact(x + P / 2 + i * P, ym, s[0], s[1])));
        o += w(x, ym, x, y2) + w(xe, ym, xe, y2) + w(x, y2, x + gw / 2 - P / 2, y2) + w(x + gw / 2 + P / 2, y2, xe, y2) + contact(x + gw / 2, y2, seal[0], seal[1]);
        x = xe;
      } else { Sr.forEach((s, i) => (o += contact(x + P / 2 + i * P, ym, s[0], s[1]))); x += Sr.length * P; }
      N.forEach((s, i) => (o += contact(x + P / 2 + i * P, ym, s[0], s[1])));
      x += N.length * P;
      return o + w(x, ym, RR - 60, ym) + coil(RR - 44, ym, c);
    };
    const timer = (y0, title, e, n, t) => {
      const ym = y0 + 44, xb = RL + 20 + P + 20, on = v(n);
      return `<text x="${RL + 6}" y="${y0 + 8}" font-size="13" font-weight="600" fill="${INK}">${title}</text>${w(RL, ym, RL + 20, ym)}${contact(RL + 20 + P / 2, ym, e, false)}${w(RL + 20 + P, ym, xb, ym)}<rect x="${xb}" y="${ym - 18}" width="120" height="36" rx="3" fill="${on ? G : 'none'}" stroke="${INK}" stroke-width="1.5"/><text x="${xb + 60}" y="${ym - 3}" text-anchor="middle" font-size="13" font-weight="600" fill="${on ? GD : INK}">TON ${n}</text><text x="${xb + 60}" y="${ym + 12}" text-anchor="middle" font-size="12" fill="${on ? GD : SEC}">${t}</text>${w(xb + 120, ym, RR, ym)}`;
    };
    const NCs = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'].map((n) => [n, true]);
    const a = (n) => [n, false], b = (n) => [n, true];
    let y = 24, s = '';
    const add = (h, f) => { s += f(y); y += h; };
    add(70, (y) => rung(y, 'Escalón 1: etapa 0', NCs, null, [], 'E0'));
    add(100, (y) => rung(y, 'Escalón 2: etapa 1', [a('E0'), a('PA')], a('E1'), [b('E2'), a('PP')], 'E1'));
    add(100, (y) => rung(y, 'Escalón 3: etapa 2', [a('E1'), a('P1')], a('E2'), [b('E3'), a('PP')], 'E2'));
    add(70, (y) => timer(y, 'Escalón 4: temporizador T1', 'E2', 'T1', 'preset 8 s'));
    add(100, (y) => rung(y, 'Escalón 5: etapa 3', [a('E2'), a('T1')], a('E3'), [b('E6'), a('PP')], 'E3'));
    add(100, (y) => rung(y, 'Escalón 6: etapa 4', [a('E0'), a('PA')], a('E4'), [b('E5'), a('PP')], 'E4'));
    add(70, (y) => timer(y, 'Escalón 7: temporizador T2', 'E4', 'T2', 'preset 5 s'));
    add(100, (y) => rung(y, 'Escalón 8: etapa 5', [a('E4'), a('T2')], a('E5'), [b('E6'), a('PP')], 'E5'));
    add(100, (y) => rung(y, 'Escalón 9: etapa 6', [a('E3'), a('E5'), a('P2')], a('E6'), [a('P3')], 'E6'));
    add(100, (y) => rung(y, 'Escalón 10: contactor A', [a('E1')], a('E3'), [], 'KA'));
    add(70, (y) => rung(y, 'Escalón 11: contactor B', [a('E5')], null, [], 'KB'));
    return `<svg viewBox="0 0 ${W} ${y + 16}" style="width:100%;max-width:560px;display:block;margin:auto" role="img" aria-label="Diagrama escalera de los dos motores"><line x1="${RL}" y1="20" x2="${RL}" y2="${y - 20}" stroke="${INK}" stroke-width="2.5"/><line x1="${RR}" y1="20" x2="${RR}" y2="${y - 20}" stroke="${INK}" stroke-width="2.5"/>${s}</svg>`;
  };
  const ecuaciones = (M) => {
    const S = M.S, I = M.I, c = (x) => `<span class="mtr-chip${x ? ' v' : ''}">${x ? 1 : 0}</span>`;
    const filas = [
      ['Etapa 1', `S<sub>E1</sub> = E0 · PA`, S.E0 && I.PA, `${ov('R<sub>E1</sub>')} = ${ov('E2')} · PP`, !S.E2 && I.PP],
      ['Etapa 2', `S<sub>E2</sub> = E1 · P1`, S.E1 && I.P1, `${ov('R<sub>E2</sub>')} = ${ov('E3')} · PP`, !S.E3 && I.PP],
      ['Etapa 3', `S<sub>E3</sub> = E2 · T1`, S.E2 && S.T1, `${ov('R<sub>E3</sub>')} = ${ov('E6')} · PP`, !S.E6 && I.PP],
      ['Etapa 4', `S<sub>E4</sub> = E0 · PA`, S.E0 && I.PA, `${ov('R<sub>E4</sub>')} = ${ov('E5')} · PP`, !S.E5 && I.PP],
      ['Etapa 5', `S<sub>E5</sub> = E4 · T2`, S.E4 && S.T2, `${ov('R<sub>E5</sub>')} = ${ov('E6')} · PP`, !S.E6 && I.PP],
      ['Etapa 6', `S<sub>E6</sub> = E3 · E5 · P2`, S.E3 && S.E5 && I.P2, `${ov('R<sub>E6</sub>')} = P3`, I.P3]
    ];
    const e0 = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'].map(ov).join(' · ');
    return `<div class="mtr-eq"><div class="mtr-row" style="font-size:.78rem;color:var(--texto-2)"><span>Etapa</span><span>SET (enciende)</span><span>RESET negado (mantiene)</span></div>` +
      filas.map((f) => `<div class="mtr-row"><b>${f[0]}${c(S['E' + f[0].slice(-1)])}</b><span>${f[1]}${c(f[2])}</span><span>${f[3]}${c(f[4])}</span></div>`).join('') +
      `<div class="mtr-row" style="grid-template-columns:70px 1fr"><b>Etapa 0${c(S.E0)}</b><span>E0 = ${e0}</span></div>` +
      `<div class="mtr-row" style="grid-template-columns:70px 1fr"><b>Salidas</b><span>KA = E1 + E3${c(S.KA)} &nbsp; KB = E5${c(S.KB)}</span></div></div>` +
      `<p style="margin:10px 0 0;color:var(--texto-2);font-size:.85rem;line-height:1.55">Cada etapa se mantiene con (SET + la propia etapa) · RESET negado. Los números a la derecha de cada ecuación son su valor en este instante.</p>`;
  };

  // ---------- panel + vistas ----------
  const motorSvg = (id, col, bg) => `<svg viewBox="0 0 120 100" width="100%" style="max-width:150px"><rect x="12" y="26" width="64" height="48" rx="6" fill="${S2}" stroke="${BRD}" stroke-width="1.5"/><rect x="18" y="34" width="52" height="4" fill="var(--borde)"/><rect x="18" y="62" width="52" height="4" fill="var(--borde)"/><rect x="76" y="46" width="14" height="8" fill="${BRD}"/><g id="${id}" transform="translate(98 50)"><circle r="16" fill="${bg}" stroke="${col}" stroke-width="1.5"/><line x1="-14" y1="0" x2="14" y2="0" stroke="${col}" stroke-width="3"/><line x1="0" y1="-14" x2="0" y2="14" stroke="${col}" stroke-width="3"/><circle r="3" fill="${col}"/></g></svg>`;
  II.diagramas.motores = (cont, opts = {}) => {
    cont.classList.add('diagrama');
    const M = crear();
    cont.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start">
      <div style="flex:1 1 300px;min-width:0"><div class="mtr-btns" data-r="btns"></div>
        <div class="mtr-et" data-r="et" style="margin-top:12px"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:420px;margin-top:8px;font-size:.78rem;color:var(--texto-2)"><div>T1 (8 s)<div class="mtr-bar"><i data-r="b1"></i></div></div><div>T2 (5 s)<div class="mtr-bar"><i data-r="b2"></i></div></div></div>
        <div style="display:flex;gap:10px;align-items:center;margin-top:10px;flex-wrap:wrap"><button type="button" class="boton chico" data-r="rst">Reiniciar</button><label style="font-size:.82rem;color:var(--texto-2)"><input type="checkbox" data-r="rap"> Tiempo ×4</label></div>
        <p style="margin:8px 0 0;font-size:.8rem;color:var(--texto-2);line-height:1.5">Mantén presionado cada botón. PP y P3 son normalmente cerrados: al pulsarlos valen 0.</p></div>
      <div class="mtr-mot" style="flex:1 1 260px"><div class="mtr-m">${motorSvg('mt-a', '#185FA5', '#E6F1FB')}<b>Motor A (KA)</b><span data-r="ta">Detenido</span></div><div class="mtr-m">${motorSvg('mt-b', '#854F0B', '#FAEEDA')}<b>Motor B (KB)</b><span data-r="tb">Detenido</span></div></div></div>
      <div data-r="tabs" style="margin-top:14px"></div>`;
    const q = (s) => cont.querySelector(s);
    [['PA', 'no', 'normalmente abierto'], ['PP', 'nc', 'normalmente cerrado'], ['P1', 'no', 'normalmente abierto'], ['P2', 'no', 'normalmente abierto'], ['P3', 'nc', 'normalmente cerrado']].forEach(([n, c, t]) => {
      const d = document.createElement('div'); d.className = 'mtr-bt';
      const b = document.createElement('button'); b.type = 'button'; b.className = c; b.textContent = n;
      const rest = c === 'nc' ? 1 : 0;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); M.I[n] = 1 - rest; b.classList.add('on'); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((k) => b.addEventListener(k, () => { M.I[n] = rest; b.classList.remove('on'); }));
      d.appendChild(b); const s = document.createElement('span'); s.textContent = t; d.appendChild(s); q('[data-r=btns]').appendChild(d);
    });
    const E = ['E0', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6'].map((n) => { const e = document.createElement('div'); e.className = 'mtr-e'; e.textContent = n; q('[data-r=et]').appendChild(e); return e; });
    const defs = [{ id: 'grafcet', t: '1 · GRAFCET' }, { id: 'ecuaciones', t: '2 · Ecuaciones' }, { id: 'escalera', t: '3 · Escalera' }];
    const ini = defs.some((d) => d.id === opts.pestana) ? opts.pestana : 'grafcet';
    const T = PL.pestanas(q('[data-r=tabs]'), defs, ini);
    const vistas = { grafcet: grafcet, ecuaciones: ecuaciones, escalera: escalera };
    let firma = '', ang = { a: 0, b: 0 }, last = performance.now(), raf = 0, vivo = true;
    const sig = () => JSON.stringify([M.S.E0, M.S.E1, M.S.E2, M.S.E3, M.S.E4, M.S.E5, M.S.E6, M.S.T1, M.S.T2, M.I]);
    const pinta = () => {
      const f = sig();
      if (f !== firma) { firma = f; defs.forEach((d) => { T.raiz(d.id).innerHTML = vistas[d.id](M); }); }
      [M.S.E0, M.S.E1, M.S.E2, M.S.E3, M.S.E4, M.S.E5, M.S.E6].forEach((v, i) => E[i].classList.toggle('on', !!v));
      q('[data-r=b1]').style.width = (M.S.t1 / 8 * 100) + '%'; q('[data-r=b2]').style.width = (M.S.t2 / 5 * 100) + '%';
      q('[data-r=ta]').textContent = M.S.KA ? 'Girando' : 'Detenido'; q('[data-r=tb]').textContent = M.S.KB ? 'Girando' : 'Detenido';
    };
    const lazo = (now) => {
      if (!vivo) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      M.scan(dt * (q('[data-r=rap]').checked ? 4 : 1));
      if (M.S.KA) ang.a = (ang.a + 430 * dt) % 360; if (M.S.KB) ang.b = (ang.b + 430 * dt) % 360;
      q('#mt-a').setAttribute('transform', `translate(98 50) rotate(${ang.a})`); q('#mt-b').setAttribute('transform', `translate(98 50) rotate(${ang.b})`);
      pinta(); raf = requestAnimationFrame(lazo);
    };
    q('[data-r=rst]').onclick = () => { M.reinicia(); };
    M.scan(0); pinta(); raf = requestAnimationFrame(lazo);
    return { destruir() { vivo = false; cancelAnimationFrame(raf); }, pestana: T.pestana };
  };
  ['grafcet', 'ecuaciones', 'escalera'].forEach((id) => { II.diagramas['motores_' + id] = (cont, o = {}) => II.diagramas.motores(cont, { ...o, pestana: id }); });
  PL.motores = { crear, valor };
})();
