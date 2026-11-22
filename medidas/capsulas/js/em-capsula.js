// ============================================================
// Cápsula «Electroimán en herradura» (ELT 220, práctica 2, problema 2), 22/11/2026.
// Física, dibujos (adaptados de la página del 18/11), pantallas y encuestas.
// La usan panel.html (TV) e index.html (celular del estudiante). No guarda nada.
// ============================================================
(function () {
  'use strict';
  const EM = window.EM = window.EM || {};
  const MU0 = 4e-7 * Math.PI, G = 9.81;
  EM.titulo = 'Electroimán en herradura';
  EM.DEF = { a: 17, l1: 32, l2: 22, h: 9, N: 220, u1: 1200, u2: 1030, w: 9, d: 12, m: 1.36 };

  // ---------------- física ----------------
  function calc(P, I) {
    const a = P.a / 100, l1 = P.l1 / 100, l2 = P.l2 / 100, h = P.h / 1000, w = P.w / 100, d = P.d / 100;
    const S = w * d, L1 = Math.PI * a + 2 * l1, Lg = 2 * h;
    const R1 = L1 / (MU0 * P.u1 * S), R2 = l2 / (MU0 * P.u2 * S), Rg = Lg / (MU0 * S), Rt = R1 + R2 + Rg;
    const Wn = P.m * 1000 * G;
    const B = Math.sqrt(Wn * MU0 / S), phi = B * S, NI = phi * Rt, Ireq = NI / P.N;
    const H1 = B / (MU0 * P.u1), H2 = B / (MU0 * P.u2), Hg = B / MU0;
    const F1 = H1 * L1, F2 = H2 * l2, Fg = Hg * Lg;
    const r = { S, L1, Lg, R1, R2, Rg, Rt, Wn, B, phi, NI, Ireq, H1, H2, Hg, F1, F2, Fg, sh: [Fg / NI, F1 / NI, F2 / NI] };
    if (I !== undefined) {
      const ph = P.N * I / Rt;
      r.phiI = ph; r.BI = ph / S; r.FI = ph * ph / (MU0 * S); r.liftT = r.FI / G / 1000; r.ok = r.FI >= Wn * 0.9999;
    }
    return r;
  }
  EM.calc = calc;
  EM.imin = (P) => Math.ceil(calc(P).Ireq * 10 - 1e-9) / 10;
  const DEF = EM.DEF, R0 = calc(DEF);

  // ---------------- formato (coma decimal; miles con espacio fino) ----------------
  const NB = '\u202f';
  function f(x, d) {
    const s = Math.abs(x).toFixed(d); let [i, fr] = s.split('.');
    if (i.length > 4) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, NB);
    return (x < 0 ? '−' : '') + i + (fr ? ',' + fr : '');
  }
  function sig(x, n) {
    n = n || 3; if (!isFinite(x)) return '∞'; if (x === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(x))); return f(x, Math.min(6, Math.max(0, n - 1 - e)));
  }
  const SUPD = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  function sci(x, n) {
    n = n || 3; if (x === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(x)));
    return f(x / Math.pow(10, e), n - 1) + '×10' + String(e).split('').map((c) => SUPD[c] || c).join('');
  }
  const aTex = (s) => s.replace(/,/g, '{,}').split(NB).join('\\,').replace('−', '-');
  const tf = (x, d) => aTex(f(x, d)), tsig = (x, n) => aTex(sig(x, n));
  function tsci(x, n) { n = n || 3; const e = Math.floor(Math.log10(Math.abs(x))); return tf(x / Math.pow(10, e), n - 1) + '\\cdot 10^{' + e + '}'; }
  EM.f = f; EM.sig = sig;

  // ---------------- dibujo del electroimán (de la página del 18/11) ----------------
  function arrow(x1, y1, x2, y2, col, w) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, hs = 9;
    const bx = x2 - ux * hs, by = y2 - uy * hs;
    return `<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${col}" stroke-width="${w || 3}" stroke-linecap="round"/>` +
      `<polygon points="${x2},${y2} ${bx - uy * 5.5},${by + ux * 5.5} ${bx + uy * 5.5},${by - ux * 5.5}" fill="${col}"/>`;
  }
  function geo(hmm) { const gpx = 3 + 22 * (1 - Math.exp(-hmm / 10)), yb = 208, yt = yb + gpx; return { gpx, yb, yt, y2: yt + 26, ym: yt + 13, floor: 322 }; }
  function floorDy(hmm) { const g = geo(hmm); return g.floor - g.y2; }
  function horse(o) {
    o = o || {};
    const hl = o.hl || null, on = (n) => !hl || hl.indexOf(n) >= 0, c = (n) => (on(n) ? '' : ' dim');
    const hmm = o.h === undefined ? 9 : o.h, Gm = geo(hmm), gpx = Gm.gpx, yb = Gm.yb, yt = Gm.yt, y2 = Gm.y2, ym = Gm.ym;
    const cx = 150, cy = 112, rc = 78, dy = o.dy || 0, hung = o.hung !== false;
    let s = '';
    if (o.floor) {
      s += `<line x1="-6" y1="${Gm.floor}" x2="306" y2="${Gm.floor}" stroke="#6b7280" stroke-width="3"/>`;
      for (let x = -2; x < 306; x += 12) s += `<line x1="${x}" y1="${Gm.floor + 2}" x2="${x - 8}" y2="${Gm.floor + 11}" stroke="#9aa1ac" stroke-width="1.6"/>`;
    }
    s += `<g class="${c('bar')}" transform="translate(0,${dy.toFixed(1)})"><rect x="40" y="${yt}" width="220" height="26" rx="3" fill="#8bc34a" stroke="#4d7a1d" stroke-width="2.4"/>`;
    s += `<text class="st" x="150" y="${ym + 6}" text-anchor="middle">${o.lab === 'R' ? 'ℛ₂' : 'μ₂'}</text></g>`;
    if (hung && hmm > 0) {
      s += `<g class="${c('gap')}">`;
      [50, 206].forEach((x) => { s += `<rect x="${x}" y="${yb}" width="44" height="${gpx}" fill="#e3effc" stroke="#5aa0e6" stroke-width="1.6" stroke-dasharray="4 3"/>`; });
      s += `<line x1="34" y1="${yb}" x2="34" y2="${yt}" stroke="#1f2633" stroke-width="1.6"/><line x1="30" y1="${yb}" x2="38" y2="${yb}" stroke="#1f2633" stroke-width="1.6"/><line x1="30" y1="${yt}" x2="38" y2="${yt}" stroke="#1f2633" stroke-width="1.6"/>`;
      s += `<text class="st" x="20" y="${yb + gpx / 2 + 6}" text-anchor="middle">h</text>`;
      s += `<text class="st2" x="-4" y="${yb - 8}">${o.lab === 'R' ? 'ℛg' : 'μ₀'}</text></g>`;
    }
    s += `<g class="${c('core')}"><path d="M50,${yb} V${cy} A100,100 0 0 1 250,${cy} V${yb} H206 V${cy} A56,56 0 0 0 94,${cy} V${yb} Z" fill="#f4b942" stroke="#a8741a" stroke-width="2.4" stroke-linejoin="round"/>`;
    s += `<text class="st" x="72" y="152" text-anchor="middle">${o.lab === 'R' ? 'ℛ₁' : 'μ₁'}</text></g>`;
    s += `<g class="${c('core')}"><line x1="150" y1="112" x2="${150 - 62.4}" y2="${112 - 46.8}" stroke="#1f2633" stroke-width="1.6" stroke-dasharray="4 3"/><text class="st" x="106" y="84">a</text>`;
    s += `<line x1="284" y1="${cy}" x2="284" y2="${yb}" stroke="#1f2633" stroke-width="1.6"/><line x1="279" y1="${cy}" x2="289" y2="${cy}" stroke="#1f2633" stroke-width="1.6"/><line x1="279" y1="${yb}" x2="289" y2="${yb}" stroke="#1f2633" stroke-width="1.6"/><text class="st" x="290" y="${(cy + yb) / 2 + 6}">l₁</text></g>`;
    s += `<g><line x1="206" y1="165" x2="250" y2="165" stroke="#1f2633" stroke-width="1.8" stroke-dasharray="5 3"/><text class="st" x="254" y="171">S</text>`;
    if (hl && hl.indexOf('sect') >= 0) {
      s += `<line x1="150" y1="${yt}" x2="150" y2="${y2}" stroke="#1f2633" stroke-width="2.4" stroke-dasharray="4 3"/>`;
      s += `<line x1="50" y1="${yb + gpx / 2}" x2="94" y2="${yb + gpx / 2}" stroke="#1f2633" stroke-width="2.4" stroke-dasharray="4 3"/>`;
      s += `<text class="st" x="72" y="${yb - 20}" text-anchor="middle" style="fill:#1c7ed6">Φ</text><text class="st" x="168" y="${ym + 6}" style="fill:#1c7ed6">Φ</text><text class="st" x="228" y="${cy + 30}" text-anchor="middle" style="fill:#1c7ed6">Φ</text>`;
    }
    s += '</g>';
    const fl = o.I === undefined || o.I > 0;
    const pth = hung ? `M72,${ym} V${cy} A${rc},${rc} 0 0 1 228,${cy} V${ym} H72` : `M72,${yb} V${cy} A${rc},${rc} 0 0 1 228,${cy} V${yb}`;
    s += `<g class="${c('loop')}"><path class="flux${fl ? '' : ' off'}" d="${pth}"/>`;
    s += '<polygon points="144,28 158,34 144,40" fill="#1c7ed6"/>';
    s += '<text class="st" x="150" y="152" text-anchor="middle" style="fill:#1c7ed6;font-size:20px">Φ</text></g>';
    s += `<g class="${c('coil')}">`;
    for (let g = -30; g <= 30; g += 10) {
      const t = g * Math.PI / 180, sx = Math.sin(t), sy = -Math.cos(t);
      s += `<line x1="${cx + sx * 46}" y1="${cy + sy * 46}" x2="${cx + sx * 109}" y2="${cy + sy * 109}" stroke="#b45309" stroke-width="6" stroke-linecap="round"/><line x1="${cx + sx * 46}" y1="${cy + sy * 46}" x2="${cx + sx * 109}" y2="${cy + sy * 109}" stroke="#e8a15b" stroke-width="2" stroke-linecap="round"/>`;
    }
    s += '<path d="M96,18 L80,-4 M204,18 L228,-4" stroke="#b45309" stroke-width="3" fill="none" stroke-linecap="round"/>';
    s += arrow(58, -8, 80, -6, '#1f2633', 2.4);
    s += `<text class="st" x="-8" y="-12">I${o.I !== undefined ? ' = ' + sig(o.I, 3) + ' A' : ''}</text><text class="st" x="232" y="-12">N = ${o.N || 220}</text></g>`;
    if (o.force) {
      if (hung && o.arrows !== false) {
        const fr = Math.min(1.5, o.fr === undefined ? 1 : o.fr), col = (o.fr !== undefined && o.fr < 0.9999) ? '#c92a2a' : '#2b8a3e', L = 10 + 24 * fr;
        s += `<g class="${c('force')}">`;
        [72, 228].forEach((x) => { s += arrow(x, y2 + 8 + L, x, y2 + 8, col, 3.4); });
        s += `<text class="st" x="72" y="${y2 + 64}" text-anchor="middle" style="fill:${col}">F/2</text><text class="st" x="228" y="${y2 + 64}" text-anchor="middle" style="fill:${col}">F/2</text>`;
        s += arrow(150, y2 + 8, 150, y2 + 44, '#1f2633', 3.4) + `<text class="st" x="150" y="${y2 + 64}" text-anchor="middle">W</text></g>`;
      }
    } else if (!o.nodim) {
      s += `<g class="${c('bar')}"><line x1="40" y1="${y2 + 14}" x2="260" y2="${y2 + 14}" stroke="#1f2633" stroke-width="1.6"/><line x1="40" y1="${y2 + 9}" x2="40" y2="${y2 + 19}" stroke="#1f2633" stroke-width="1.6"/><line x1="260" y1="${y2 + 9}" x2="260" y2="${y2 + 19}" stroke="#1f2633" stroke-width="1.6"/><text class="st" x="150" y="${y2 + 34}" text-anchor="middle">l₂</text></g>`;
    }
    if (o.msg) s += `<text class="st" x="150" y="${Gm.floor + 24}" text-anchor="middle" style="fill:#c92a2a">${o.msg}</text>`;
    return s;
  }
  EM.horse = horse;
  const VBH = '-12 -24 324 346', VBP = '-12 -24 324 380';

  function gauge(x, y, w, h, frac, col, mark) {
    frac = Math.max(0, Math.min(1, frac)); const ih = (h - 4) * frac;
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#fff" stroke="#9aa1ac" stroke-width="2"/><rect x="${x + 2}" y="${y + h - 2 - ih}" width="${w - 4}" height="${ih}" rx="3" fill="${col}"/>`;
    if (mark) {
      const my = y + h - 2 - (h - 4) * Math.min(1, mark.f);
      s += `<line x1="${x - 6}" y1="${my}" x2="${x + w + 6}" y2="${my}" stroke="#c92a2a" stroke-width="2" stroke-dasharray="4 3"/><text class="st2" x="${x + w + 10}" y="${my + 5}" style="fill:#c92a2a">${mark.l}</text>`;
    }
    return s;
  }
  function ease(u) { return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }

  // ---------------- solución paso a paso (7 dibujos animados) ----------------
  function dibSol(i, t) {
    const P = DEF, r = R0, Gm = geo(P.h);
    const bs = (o) => horse(Object.assign({ h: P.h, N: P.N, nodim: true }, o));
    let s = '';
    if (i === 0) {
      s = bs({ hl: ['core', 'sect'] });
      const k = 9.2 * Math.min(1, t * 1.4), w = 9 * k, h = 12 * k, x0 = 390 - w / 2, y0 = 70;
      s += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#f4b942" stroke="#a8741a" stroke-width="2.4"/>`;
      if (t > 0.7) s += `<text class="st" x="390" y="${y0 - 10}" text-anchor="middle">ancho 9 cm</text><text class="st" x="${x0 + w + 8}" y="${y0 + h / 2 + 6}" transform="rotate(90 ${x0 + w + 8} ${y0 + h / 2})" text-anchor="middle">prof. 12 cm</text><text class="st" x="390" y="${y0 + h + 34}" text-anchor="middle" style="font-size:20px">S = 108 cm²</text>`;
    } else if (i === 1) {
      s = bs({ hl: ['bar'] });
      const L = 8 + 36 * t;
      s += arrow(150, Gm.y2 + 6, 150, Gm.y2 + 6 + L, '#1f2633', 4.4) + `<text class="st" x="166" y="${Gm.y2 + 32}" style="font-size:18px">W</text>`;
      s += `<rect x="345" y="30" width="110" height="80" rx="8" fill="#cfd6df" stroke="#5d6676" stroke-width="3"/><text class="st" x="400" y="78" text-anchor="middle" style="font-size:19px">1360 kg</text>`;
      s += arrow(400, 118, 400, 148 + 110 * t, '#1f2633', 5);
      s += `<text class="st" x="400" y="300" text-anchor="middle" style="font-size:18px">W = ${f(r.Wn * t, 0)} N</text>`;
    } else if (i === 2) {
      s = bs({ hl: ['gap', 'bar', 'force'], force: true, fr: 1 });
      const L0 = Gm.gpx + 30, tail = Gm.yt + 10;
      if (t > 0.04) [72, 228].forEach((x) => { s += arrow(x, tail, x, tail - L0 * t, '#1c7ed6', 3.2); });
      s += `<text class="st" x="100" y="${Gm.yb - 4}" style="fill:#1c7ed6;font-size:18px">B</text>`;
      s += gauge(360, 20, 40, 250, r.B * t / 2, '#1c7ed6', { f: 0.8, l: '1,6 T' });
      s += `<text class="st" x="380" y="296" text-anchor="middle" style="font-size:18px">B = ${sig(r.B * t, 3)} T</text>`;
    } else if (i === 3) {
      s = bs({ hl: ['loop', 'sect'] });
      const mx = r.phi * 1.3;
      s += gauge(360, 24, 40, 246, r.phi * t / mx, '#1c7ed6');
      s += `<text class="st" x="380" y="296" text-anchor="middle" style="font-size:18px">Φ = ${sig(r.phi * 1000 * t, 3)} mWb</text>`;
    } else if (i === 4) {
      const u = t * 3, seg = u < 1 ? 'core' : u < 2 ? 'bar' : 'gap';
      s = bs({ hl: [seg], lab: 'R' });
      const rows = [['ℛ₁ herradura', r.R1, '#f4b942'], ['ℛ₂ barra', r.R2, '#8bc34a'], ['ℛg aire (2h)', r.Rg, '#5aa0e6']];
      const mx = Math.max(r.R1, r.R2, r.Rg);
      rows.forEach((q, j) => {
        const y0 = 26 + j * 88, k = Math.max(0, Math.min(1, u - j));
        s += `<text class="st" x="330" y="${y0}">${q[0]}</text><rect x="330" y="${y0 + 8}" width="160" height="22" rx="4" fill="#fff" stroke="#c9ced6"/><rect x="331" y="${y0 + 9}" width="${Math.max(0, 158 * q[1] / mx * k)}" height="20" rx="3" fill="${q[2]}"/>`;
        if (k > 0.98) s += `<text class="st" x="330" y="${y0 + 54}">${sci(q[1], 3)}</text>`;
      });
      if (t > 0.93) s += `<text class="st" x="330" y="300" style="fill:#c92a2a">ℛg ≈ ${sig(r.Rg / (r.R1 + r.R2), 2)} × (ℛ₁ + ℛ₂)</text>`;
    } else if (i === 5) {
      s = bs({ hl: ['coil', 'loop'] });
      const sh = r.sh, cols = ['#5aa0e6', '#f4b942', '#8bc34a'], nm = ['aire', 'herradura', 'barra'], va = [r.Fg, r.F1, r.F2];
      const x = 336, y = 36, w = 46, h = 240;
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#fff" stroke="#9aa1ac" stroke-width="2"/>`;
      let start = 0;
      for (let j = 0; j < 3; j++) {
        const sg = Math.max(0, Math.min(sh[j], t - start)), hh = sg * (h - 4);
        s += `<rect x="${x + 2}" y="${y + h - 2 - (start + sg) * (h - 4)}" width="${w - 4}" height="${hh}" fill="${cols[j]}"/>`;
        s += `<rect x="392" y="${84 + j * 40}" width="14" height="14" rx="2" fill="${cols[j]}"/><text class="st2" x="412" y="${97 + j * 40}" style="fill:#1f2633">${nm[j]} ${f(va[j] * Math.min(1, sg / sh[j]), 0)}</text>`;
        start += sh[j];
      }
      s += `<text class="st" x="360" y="24" text-anchor="middle" style="font-size:17px">NI = ${f(r.NI * t, 0)} A·v</text>`;
    } else {
      const fd = floorDy(P.h), IM = EM.imin(P);
      const Ic = IM * Math.min(1, t / 0.75), hung = t >= 0.75, dy = hung ? fd * (1 - ease(Math.min(1, (t - 0.75) / 0.25))) : fd;
      const q = calc(P, Ic);
      s = bs({ I: Ic, force: true, fr: q.FI / q.Wn, hung: hung, dy: dy, floor: true, arrows: t >= 1, msg: hung ? '' : 'F < W: la barra sigue en el piso' });
      const sc = 140;
      s += gauge(360, 20, 40, 250, Ic / sc, '#d9480f', { f: r.Ireq / sc, l: 'I mín.' });
      s += `<text class="st" x="380" y="296" text-anchor="middle" style="font-size:18px">I = ${sig(Ic, 3)} A</text>`;
    }
    return s;
  }
  const VBS = '-12 -24 512 380';

  // Fórmulas de cada paso de la solución (LaTeX, con los datos del problema)
  const r = R0;
  const SOL = [
    { t: 'Sección del núcleo', e: ['S = 9\\cdot 12 = 108\\ \\text{cm}^2', 'S = 0{,}0108\\ \\text{m}^2'], w: 'La misma sección en la herradura, en el aire y en la barra.' },
    { t: 'Peso a vencer', e: ['W = m\\,g = 1360\\cdot 9{,}81', `W = ${tf(r.Wn, 0)}\\ \\text{N}`], w: 'Para sostener la barra, la fuerza magnética debe igualar al peso: F = W.' },
    { t: 'Campo en el entrehierro', e: ['F = 2\\cdot\\frac{B^2S}{2\\mu_0} = \\frac{B^2S}{\\mu_0} = W', `B = \\sqrt{\\frac{\\mu_0 W}{S}} = \\sqrt{\\frac{4\\pi\\cdot 10^{-7}\\cdot ${tf(r.Wn, 0)}}{0{,}0108}}`, `B = ${tsig(r.B, 3)}\\ \\text{T}`], w: 'Está por debajo de 1,6 T: el hierro no se satura.' },
    { t: 'Flujo', e: [`\\Phi = B\\,S = ${tsig(r.B, 3)}\\cdot 0{,}0108`, `\\Phi = ${tsci(r.phi, 3)}\\ \\text{Wb}`], w: 'El mismo Φ atraviesa la herradura, el aire y la barra.' },
    { t: 'Longitudes y reluctancias', e: [`L_1 = \\pi a + 2l_1 = ${tsig(r.L1, 4)}\\ \\text{m}`, `\\mathcal R_1 = \\frac{L_1}{\\mu_0\\mu_{1r}S} = ${tsci(r.R1, 3)}`, `\\mathcal R_2 = \\frac{l_2}{\\mu_0\\mu_{2r}S} = ${tsci(r.R2, 3)}`, `\\mathcal R_g = \\frac{2h}{\\mu_0 S} = ${tsci(r.Rg, 3)}`], w: `En A·v/Wb. ℛg es unas ${sig(r.Rg / (r.R1 + r.R2), 2)} veces la reluctancia de todo el hierro.` },
    { t: 'Ampère por tramos', e: ['NI = H_g\\cdot 2h + H_1L_1 + H_2l_2', `NI = ${tf(r.Fg, 0)} + ${tf(r.F1, 0)} + ${tf(r.F2, 0)}`, `NI = ${tf(r.NI, 0)}\\ \\text{A}\\cdot\\text{v}`], w: `Es lo mismo que Φ·(ℛ₁ + ℛ₂ + ℛg). El aire se lleva el ${f(r.sh[0] * 100, 0)} %.` },
    { t: 'Corriente', e: [`I = \\frac{NI}{N} = \\frac{${tf(r.NI, 0)}}{220}`, `I = ${tsig(r.Ireq, 3)}\\ \\text{A}`], w: 'Con esta corriente la barra queda sostenida. Con menos, se cae.' }
  ];

  // ---------------- leyes ----------------
  const LEYES = [
    { n: 'Ley de Ampère', f: '\\(\\oint \\vec H\\cdot d\\vec l = N\\,I\\)', hl: ['coil', 'loop'],
      d: 'La corriente de las N espiras «empuja» el campo a lo largo del camino cerrado: \\(NI = H_1L_1 + H_2l_2 + H_g\\cdot 2h\\).', w: 'NI es la fuerza magnetomotriz: de ella sale la corriente.' },
    { n: 'Conservación del flujo', f: '\\(\\nabla\\cdot\\vec B = 0,\\quad \\Phi = B\\,S\\)', hl: ['sect', 'loop'],
      d: 'Las líneas de B son cerradas: no empiezan ni terminan en ningún punto.', w: '¿Qué consecuencia tiene para el flujo de cada tramo?' },
    { n: 'El material', f: '\\(B = \\mu_0\\,\\mu_r\\,H\\)', hl: ['core', 'bar', 'gap'], lab: 'mu',
      d: 'Un material con μr grande logra el mismo B con poco H. Hierro: μr de 1030 a 1200. Aire: μr = 1.', w: 'Aquí está la clave del problema.' },
    { n: 'Reluctancia («Ohm magnético»)', f: '\\(\\mathcal F = \\Phi\\,\\mathcal R,\\quad \\mathcal R = \\dfrac{l}{\\mu S}\\)', hl: ['core', 'bar', 'gap', 'loop'], lab: 'R',
      d: 'Ampère y el material juntos forman un circuito en serie: \\(\\mathcal F = NI\\) es el «voltaje», Φ la «corriente» y cada ℛ una «resistencia».', w: '\\(\\mathcal R_{total} = \\mathcal R_1 + \\mathcal R_2 + \\mathcal R_g\\)' },
    { n: 'Fuerza en el entrehierro (Maxwell)', f: '\\(F = \\dfrac{B^2 S}{2\\mu_0}\\) en cada entrehierro', hl: ['gap', 'force'], force: true,
      d: 'El campo guarda energía \\(B^2/(2\\mu_0)\\) por unidad de volumen; al cerrarse el entrehierro, esa energía se vuelve fuerza.', w: 'La barra cuelga de dos entrehierros.' }
  ];
  EM.LEYES = LEYES;

  // ---------------- encuestas (la correcta va primero; en pantalla se mezclan) ----------------
  const ENC = {
    E1: { pred: true, q: 'Antes de calcular, predice: ¿cuántos amperios hacen falta para levantar la barra?', o: ['≈ 90 A', '≈ 1 A', '≈ 10 A', '≈ 1000 A'],
      por: 'La respuesta la vemos al final de la solución.' },
    C1: { q: '¿Por qué el flujo Φ es el mismo en la herradura, en el aire y en la barra?',
      o: ['Porque las líneas de B son cerradas: \\(\\nabla\\cdot\\vec B = 0\\)', 'Porque los tres tramos tienen la misma μ', 'Porque la corriente es la misma en toda la bobina', 'Porque el aire no deja pasar el flujo'],
      por: 'Todo el flujo que sale de la herradura cruza el aire y entra a la barra. Sin dispersión y con la misma sección S, el mismo Φ atraviesa cada tramo, como la corriente en un circuito en serie.' },
    C2: { q: 'Con el mismo B, ¿cómo es H en el aire comparado con H en el hierro de la herradura (μr = 1200)?',
      o: ['Unas 1200 veces mayor', 'Igual', 'Unas 1200 veces menor', 'Cero: el aire no se magnetiza'],
      por: '\\(H = B/(\\mu_0\\mu_r)\\). Con el mismo B, el aire (μr = 1) necesita 1200 veces más H que el hierro. Por eso 18 mm de aire piden más NI que más de un metro de hierro.' },
    C3: { q: 'Cada entrehierro tira con \\(B^2S/(2\\mu_0)\\). La fuerza total sobre la barra es:',
      o: ['\\(F = B^2S/\\mu_0\\)', '\\(F = B^2S/(2\\mu_0)\\)', '\\(F = 2B^2S/\\mu_0\\)', '\\(F = B\\,S/\\mu_0\\)'],
      por: 'Son dos entrehierros iguales: \\(F = 2\\cdot \\dfrac{B^2S}{2\\mu_0} = \\dfrac{B^2S}{\\mu_0}\\).' },
    C4: { q: 'Si B se duplica, la fuerza de atracción…', o: ['Se multiplica por 4', 'Se duplica', 'No cambia', 'Baja a la mitad'],
      por: '\\(F \\propto B^2\\): \\((2B)^2 = 4B^2\\).' },
    S1: { q: 'Calcula la sección del núcleo S (ancho 9 cm; profundidad 12 cm).', o: ['\\(108\\ \\text{cm}^2 = 0{,}0108\\ \\text{m}^2\\)', '\\(21\\ \\text{cm}^2\\)', '\\(10{,}8\\ \\text{cm}^2\\)', '\\(1080\\ \\text{cm}^2\\)'],
      por: '\\(S = 9\\cdot 12 = 108\\ \\text{cm}^2 = 0{,}0108\\ \\text{m}^2\\). 21 cm² sale de sumar en lugar de multiplicar.' },
    S2: { q: 'La barra pesa 1,36 t («T.» = toneladas). ¿Qué fuerza debe hacer el electroimán?', o: ['≈ 13,3 kN', '≈ 1,36 kN', '≈ 13,3 N', '≈ 136 kN'],
      por: `\\(W = m\\,g = 1360\\cdot 9{,}81 = ${tf(r.Wn, 0)}\\ \\text{N} \\approx 13{,}3\\ \\text{kN}\\).` },
    S3: { q: '¿Qué B se necesita en el entrehierro?', o: ['≈ 1,25 T', '≈ 1,76 T', '≈ 1,55 T', '≈ 0,88 T'],
      por: `\\(B = \\sqrt{\\mu_0F/S} = \\sqrt{4\\pi\\cdot 10^{-7}\\cdot ${tf(r.Wn, 0)}/0{,}0108} = ${tsig(r.B, 3)}\\ \\text{T}\\). 1,76 T sale si se usa una sola cara; 1,55 T si se olvida la raíz.` },
    S4: { q: 'Longitud media del camino en la herradura: arco de radio a = 17 cm y dos brazos de l₁ = 32 cm.', o: ['≈ 1,17 m', '≈ 1,71 m', '≈ 0,81 m', '≈ 0,91 m'],
      por: `El arco es media circunferencia: \\(L_1 = \\pi a + 2l_1 = \\pi\\cdot 0{,}17 + 2\\cdot 0{,}32 = ${tsig(r.L1, 4)}\\ \\text{m}\\). 1,71 m sale con la circunferencia completa (2πa).` },
    S5: { q: '¿Cuánta fuerza magnetomotriz pide el aire (los dos entrehierros de 9 mm)?', o: ['≈ 17 850 A·v', '≈ 8 920 A·v', '≈ 15 A·v', '≈ 1,78 millones de A·v'],
      por: `\\(H_g = B/\\mu_0 \\approx ${tf(r.Hg, 0)}\\ \\text{A/m}\\); \\(NI_g = H_g\\cdot 2h = ${tf(r.Hg, 0)}\\cdot 0{,}018 \\approx ${tf(r.Fg, 0)}\\ \\text{A}\\cdot\\text{v}\\). 8 920 es un solo entrehierro; 15 sale con la μr del hierro.` },
    S6: { q: '¿Y cuánto pide todo el hierro (herradura y barra)?', o: ['≈ 1 180 A·v', '≈ 970 A·v', '≈ 212 A·v', '0 A·v'],
      por: `\\(H_1L_1 = ${tf(r.H1, 0)}\\cdot ${tsig(r.L1, 4)} = ${tf(r.F1, 0)}\\); \\(H_2l_2 = ${tf(r.H2, 0)}\\cdot 0{,}22 = ${tf(r.F2, 0)}\\). Total ≈ ${f(r.F1 + r.F2, 0)} A·v.` },
    S7: { q: 'Entonces, ¿qué corriente se necesita? (N = 220)', o: ['≈ 86,5 A', '≈ 81 A', '≈ 5,4 A', '≈ 19 000 A'],
      por: `\\(NI = ${tf(r.Fg, 0)} + ${tf(r.F1 + r.F2, 0)} = ${tf(r.NI, 0)}\\ \\text{A}\\cdot\\text{v}\\); \\(I = ${tf(r.NI, 0)}/220 \\approx ${tsig(r.Ireq, 3)}\\ \\text{A}\\). 81 A es solo el aire; 5,4 A, solo el hierro; 19 000 A es olvidar dividir entre N.` },
    K1: { q: 'En el circuito magnético, ¿quién se «come» casi toda la NI?', o: ['El aire de los dos entrehierros (≈ 94 %)', 'La herradura, porque es el tramo más largo', 'La barra', 'Se reparte por partes iguales'],
      por: '\\(\\mathcal R = l/(\\mu S)\\): el aire tiene μ unas mil veces menor. Sus 18 mm «pesan» como más de 20 m de hierro: \\(NI_g/NI \\approx 94\\,\\%\\).' },
    W1: { q: 'Misma carga, pero el entrehierro h se duplica (de 9 a 18 mm). La corriente necesaria…', o: ['Casi se duplica (≈ 168 A)', 'Se cuadruplica', 'Baja a la mitad', 'No cambia'],
      por: 'El aire pide el doble (35 694 A·v) y el hierro lo mismo (1 182): \\(I = 36\\,875/220 \\approx 168\\ \\text{A}\\), ×1,94. No llega a ×2 porque la parte del hierro no cambia.' },
    W2: { q: 'Ahora h baja a la mitad (4,5 mm). La corriente necesaria es…', o: ['≈ 46 A', '≈ 22 A', '≈ 81 A', '≈ 86 A'],
      por: '\\(NI = 8\\,923 + 1\\,182 = 10\\,105\\ \\text{A}\\cdot\\text{v} \\Rightarrow I \\approx 45{,}9\\ \\text{A}\\): casi la mitad.' },
    W3: { q: 'Se duplican las espiras (N = 440). La corriente necesaria…', o: ['Baja a la mitad (≈ 43 A)', 'Baja a la cuarta parte', 'Se duplica', 'No cambia'],
      por: 'Lo que importa es el producto NI = 19 029 A·v: con el doble de espiras basta la mitad de corriente, 43,2 A. (El devanado lleva el doble de alambre.)' },
    W4: { q: 'Se cambia el hierro por otro 4 veces mejor (μr = 4800 y 4120). La corriente…', o: ['Baja solo ≈ 5 % (≈ 82 A)', 'Baja a la cuarta parte (≈ 22 A)', 'Baja a la mitad', 'Sube'],
      por: 'El hierro solo pedía 1 182 A·v de 19 029; ahora pide 295. \\(I = 18\\,142/220 \\approx 82{,}5\\ \\text{A}\\). Conviene reducir el entrehierro, no mejorar el hierro.' },
    W5: { q: 'La barra ya está pegada (h → 0). ¿Qué corriente la mantiene?', o: ['≈ 5,4 A', '0 A', '≈ 43 A', '≈ 86 A'],
      por: 'Sin aire, solo queda el hierro: \\(I = 1\\,182/220 \\approx 5{,}4\\ \\text{A}\\), 16 veces menos. Por eso un relé o una grúa de chatarra sostienen con poca corriente lo que les costó atraer.' },
    W6: { q: '¿Duplicando la corriente (≈ 173 A) se levanta 4 veces la carga?', o: ['No: B tendría que llegar a ≈ 2,5 T y el hierro se satura cerca de 1,6 T', 'Sí, porque F ∝ I²', 'Solo si también se duplican las espiras', 'No: solo levanta el doble'],
      por: 'En el modelo lineal sí (F ∝ I²), pero B pasaría de 1,25 a 2,49 T. El hierro real se satura cerca de 1,6 T: μr cae y la fuerza deja de crecer así.' },
    W7: { q: '¿Cuál es la carga máxima sin pasar de B = 1,6 T?', o: ['≈ 2,2 t', '1,36 t', '≈ 4,5 t', '≈ 1,1 t'],
      por: '\\(F = B^2S/\\mu_0 = 1{,}6^2\\cdot 0{,}0108/(4\\pi\\cdot 10^{-7}) \\approx 22\\,000\\ \\text{N}\\), unas 2,24 t. 1,1 t sale con una sola cara.' },
    G1: { q: '¿Qué forma tiene la curva «carga que levanta» en función de la corriente I?', o: ['Una parábola', 'Una recta', 'Una exponencial', 'Una recta horizontal'],
      por: 'B ∝ I (circuito lineal) y F ∝ B², entonces F ∝ I²: una parábola, hasta que el hierro se satura.' },
    Z1: { q: 'Un relé necesita 100 mA para cerrar su contacto. Para mantenerlo cerrado necesita…', o: ['Mucho menos, porque al cerrar desaparece el entrehierro', 'Lo mismo', 'Más, porque debe vencer al resorte', 'El doble'],
      por: 'Con el contacto cerrado el entrehierro casi desaparece y la reluctancia cae: con mucho menos NI se mantiene el mismo B. Por eso hay relés con bobina de retención o con reducción de corriente.' }
  };

  // ---------------- pantallas ----------------
  EM.ETAPAS = ['El problema', 'Las leyes', 'Solución', 'Circuito', '¿Qué pasa si…?', 'Cierre'];
  const enc = (id, et) => Object.assign({ id, et, tipo: 'enc', c: 0, t: 'Encuesta ' + id }, ENC[id]);
  const chk = (id, et, t, P, I, nota) => ({ id, et, tipo: 'panel', t: 'Compruébalo: ' + t, P, I, nota });
  EM.PASOS = [
    { id: 'enun', et: 0, tipo: 'enun', t: '¿Qué corriente levanta la barra?' },
    enc('E1', 0),
    { id: 'ley1', et: 1, tipo: 'ley', k: 0, t: 'Las leyes: Ampère' },
    { id: 'ley2', et: 1, tipo: 'ley', k: 1, t: 'Las leyes: conservación del flujo' },
    enc('C1', 1),
    { id: 'ley3', et: 1, tipo: 'ley', k: 2, t: 'Las leyes: el material' },
    enc('C2', 1),
    { id: 'ley4', et: 1, tipo: 'ley', k: 3, t: 'Las leyes: reluctancia' },
    { id: 'ley5', et: 1, tipo: 'ley', k: 4, t: 'Las leyes: la fuerza' },
    enc('C3', 1), enc('C4', 1),
    enc('S1', 2), { id: 'sol1', et: 2, tipo: 'sol', k: 0 },
    enc('S2', 2), { id: 'sol2', et: 2, tipo: 'sol', k: 1 },
    enc('S3', 2), { id: 'sol3', et: 2, tipo: 'sol', k: 2 },
    { id: 'sol4', et: 2, tipo: 'sol', k: 3 },
    enc('S4', 2), { id: 'sol5', et: 2, tipo: 'sol', k: 4 },
    enc('S5', 2), enc('S6', 2), { id: 'sol6', et: 2, tipo: 'sol', k: 5 },
    enc('S7', 2), { id: 'sol7', et: 2, tipo: 'sol', k: 6 },
    { id: 'pred', et: 2, tipo: 'pred', t: '¿Cuánto predijeron?' },
    enc('K1', 3), { id: 'circ', et: 3, tipo: 'circ', t: 'El mismo problema como un circuito' },
    { id: 'panel', et: 4, tipo: 'panel', t: 'Panel: ¿qué pasa si cambiamos un valor?', P: {}, nota: 'Mueve un control y mira si la barra se sostiene.' },
    enc('W1', 4), chk('cW1', 4, 'h = 18 mm', { h: 18 }, 'min', 'La corriente mínima casi se duplica.'),
    enc('W2', 4), chk('cW2', 4, 'h = 4,5 mm', { h: 4.5 }, 'min', 'Casi la mitad: el aire manda.'),
    enc('W3', 4), chk('cW3', 4, 'N = 440 espiras', { N: 440 }, 'min', 'Lo que cuenta es NI.'),
    enc('W4', 4), chk('cW4', 4, 'hierro 4 veces mejor', { u1: 4800, u2: 4120 }, 'min', 'Casi no cambia: el hierro pedía poco.'),
    enc('W5', 4), chk('cW5', 4, 'barra pegada (h = 0)', { h: 0 }, 'min', 'Solo queda el hierro.'),
    enc('W6', 4), chk('cW6', 4, 'el doble de corriente', {}, 2 * EM.imin(DEF), 'Según el modelo lineal levantaría 4 veces más, pero B pasa de 1,6 T.'),
    enc('W7', 4), chk('cW7', 4, 'B = 1,6 T', { m: 2.24 }, 'min', 'Con 2,24 t, B llega a 1,6 T.'),
    enc('G1', 5), { id: 'graf', et: 5, tipo: 'graf', t: 'Cómo responde el electroimán' },
    enc('Z1', 5), { id: 'cierre', et: 5, tipo: 'cierre', t: 'Cierre' }
  ];
  EM.PASOS.forEach((p, i) => { p.n = i; if (p.tipo === 'sol') p.t = 'Solución ' + (p.k + 1) + ' de 7: ' + SOL[p.k].t.toLowerCase(); });
  EM.ENC = ENC;

  // Orden de las opciones en pantalla: mezclado fijo por encuesta (el mismo en la TV y en los celulares)
  function semilla(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  EM.orden = function (p) {
    let a = semilla('elt220|' + p.id); const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const o = p.o.map((_, i) => i);
    for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
    return o;
  };

  // ---------------- vistas (TV y celular usan las mismas) ----------------
  // EM.vista(cont, paso, v, modo, cambio) → { act(v), fin() }.  modo: 'tv' | 'cel'.
  function esc(s) { return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
  EM.esc = esc;

  function vEnun(cont) {
    const C = [['a', '17 cm'], ['l₁', '32 cm'], ['l₂', '22 cm'], ['h', '9 mm'], ['N', '220'], ['μ₁ᵣ', '1200'], ['μ₂ᵣ', '1030'], ['ancho; prof.', '9 cm; 12 cm']];
    cont.innerHTML = `<div class="vista"><div class="txt">
      <p>Hallar la corriente necesaria para que el electroimán en herradura levante una barra de hierro de <b>1,36 T.</b> de peso. Hay <b>dos entrehierros</b> de espesor <i>h</i> (material paramagnético).</p>
      <div class="chips">${C.map((x) => `<div class="chip"><small>${x[0]}</small>${x[1]}</div>`).join('')}</div>
      <p class="lbl">«1,36 T.» = 1,36 toneladas (1360 kg). Práctica 2 de ELT 220, problema 2.</p>
    </div><div class="fig"><svg viewBox="${VBH}">${horse({ h: 9, N: 220 })}</svg></div></div>`;
    return {};
  }

  const CORTO = ['Ampère', 'Flujo', 'Material', 'Reluctancia', 'Fuerza'];
  function vLey(cont, p, v, modo, cambio) {
    let k = v && v.ley !== undefined ? v.ley : p.k;
    cont.innerHTML = `<div class="vista leyv"><div class="txt"><div class="leyes">${LEYES.map((L, i) => `<button class="ley" data-i="${i}"><span class="n">${i + 1}</span>${CORTO[i]}</button>`).join('')}</div><div class="ley-det card"></div></div><div class="fig"><svg viewBox="${VBH}"></svg></div></div>`;
    const lista = cont.querySelector('.leyes');
    lista.onclick = (e) => { const b = e.target.closest('.ley'); if (!b) return; k = +b.dataset.i; pintar(); cambio && cambio({ ley: k }); };
    function pintar() {
      const L = LEYES[k];
      lista.querySelectorAll('.ley').forEach((b, i) => b.classList.toggle('sel', i === k));
      const fd = L.f.replace('\\(', '\\[').replace('\\)', '\\]');
      cont.querySelector('.ley-det').innerHTML = `<p class="ley-n">${L.n}</p><div class="ley-f">${fd}</div><p>${L.d}</p><p class="lbl">${L.w}</p>`;
      cont.querySelector('svg').innerHTML = horse({ h: 9, hl: L.hl, lab: L.lab, force: !!L.force, fr: 1, N: 220 });
      EM.tex(cont);
    }
    pintar();
    return { act(v2) { if (v2 && v2.ley !== undefined && v2.ley !== k) { k = v2.ley; pintar(); } } };
  }

  function vSol(cont, p) {
    const S = SOL[p.k];
    cont.innerHTML = `<div class="vista sol"><div class="fig ancha"><svg viewBox="${VBS}"></svg></div><div class="txt">
      <div class="stp${p.k === 6 ? ' last' : ''}"><span class="t">Paso ${p.k + 1}: ${S.t}</span>${S.e.map((x) => `<div class="e">\\[${x}\\]</div>`).join('')}<span class="why">${S.w}</span></div>
      <button class="btn sm otra">↻ Ver de nuevo</button></div></div>`;
    EM.tex(cont);
    const svg = cont.querySelector('svg');
    let raf = null;
    function correr() {
      cancelAnimationFrame(raf);
      const t0 = performance.now(), dur = p.k === 6 ? 2800 : 1600;
      const paso = (now) => { const t = Math.max(0, Math.min(1, (now - t0) / dur)); svg.innerHTML = dibSol(p.k, t); if (t < 1) raf = requestAnimationFrame(paso); };
      raf = requestAnimationFrame(paso);
    }
    cont.querySelector('.otra').onclick = correr;
    correr();
    return { fin() { cancelAnimationFrame(raf); } };
  }

  function zig(x1, x2, y, col) { let d = 'M' + x1 + ',' + y; const n = 7; for (let i = 1; i < n; i++) d += ' L' + (x1 + (x2 - x1) * (i / n)) + ',' + (y + (i % 2 ? -11 : 11)); d += ' L' + x2 + ',' + y; return `<path d="${d}" fill="none" stroke="${col}" stroke-width="3.2" stroke-linejoin="round"/>`; }
  function vCirc(cont) {
    let s = '<g transform="translate(70,0)"><path d="M40,40 H340 V165 H40 V120 M40,90 V40" fill="none" stroke="#1f2633" stroke-width="2.6" stroke-linejoin="round"/>';
    s += '<line x1="26" y1="90" x2="54" y2="90" stroke="#1f2633" stroke-width="3.4"/><line x1="32" y1="102" x2="48" y2="102" stroke="#1f2633" stroke-width="3.4"/><line x1="40" y1="102" x2="40" y2="120" stroke="#1f2633" stroke-width="2.6"/>';
    s += '<rect x="76" y="26" width="84" height="28" fill="#fff"/><rect x="196" y="26" width="104" height="28" fill="#fff"/><rect x="170" y="150" width="86" height="28" fill="#fff"/>';
    s += zig(76, 160, 40, '#a8741a') + zig(196, 300, 40, '#2a78d6') + zig(170, 256, 165, '#4d7a1d');
    s += `<text class="st" x="118" y="78" text-anchor="middle">ℛ₁</text><text class="st2" x="118" y="96" text-anchor="middle">${sci(r.R1, 3)}</text>`;
    s += `<text class="st" x="248" y="78" text-anchor="middle">ℛg (aire)</text><text class="st2" x="248" y="96" text-anchor="middle">${sci(r.Rg, 3)}</text>`;
    s += `<text class="st" x="213" y="140" text-anchor="middle">ℛ₂</text><text class="st2" x="213" y="122" text-anchor="middle">${sci(r.R2, 3)}</text>`;
    s += `<text class="st" x="-66" y="96">ℱ = NI</text><text class="st2" x="-66" y="116">${f(r.NI, 0)} A·v</text>`;
    s += arrow(168, 40, 192, 40, '#1c7ed6', 2.6) + '<text class="st" x="180" y="28" text-anchor="middle" style="fill:#1c7ed6">Φ</text></g>';
    const cols = ['#5aa0e6', '#f4b942', '#8bc34a'], nm = ['Aire (2 entrehierros)', 'Herradura (hierro)', 'Barra (hierro)'], va = [r.Fg, r.F1, r.F2];
    cont.innerHTML = `<div class="vista"><div class="fig"><svg viewBox="-10 0 460 200">${s}</svg>
      <p class="lbl tc">\\(\\mathcal F = NI\\) es la «batería», Φ la «corriente» y las ℛ las «resistencias» en serie.</p></div>
      <div class="txt"><p class="lbl">¿Quién se «come» la NI?</p>
      <div class="share">${r.sh.map((x, i) => `<div style="flex:${Math.max(x * 100, 1)} 1 0;background:${cols[i]}">${x > 0.12 ? f(x * 100, 1) + ' %' : ''}</div>`).join('')}</div>
      <div class="leg">${r.sh.map((x, i) => `<div><i style="background:${cols[i]}"></i>${nm[i]}: <b>${f(x * 100, 1)} %</b>; ${f(va[i], 0)} A·v</div>`).join('')}</div>
      <p class="card">18 mm de aire «pesan» como ${f(18 * 1200 / 1000, 1)} m de hierro: \\(\\mathcal R = l/(\\mu S)\\).</p></div></div>`;
    EM.tex(cont);
    return {};
  }

  // Panel: controles + electroimán + lecturas
  const CT = [
    { k: 'I', l: 'Corriente I', u: 'A', min: 0, max: 250, st: 0.5, d: 1 },
    { k: 'h', l: 'Entrehierro h', u: 'mm', min: 0, max: 30, st: 0.5, d: 1 },
    { k: 'N', l: 'Espiras N', u: '', min: 50, max: 600, st: 10, d: 0 },
    { k: 'm', l: 'Carga', u: 't', min: 0.1, max: 5, st: 0.01, d: 2 },
    { k: 'u1', l: 'μᵣ herradura', u: '', min: 100, max: 5000, st: 10, d: 0 },
    { k: 'u2', l: 'μᵣ barra', u: '', min: 100, max: 5000, st: 10, d: 0 }
  ];
  EM.panelInicial = function (p) {
    const P = Object.assign({}, DEF, p.P || {});
    const I = p.I === undefined || p.I === 'min' ? EM.imin(P) : p.I;
    return { P, I };
  };
  function vPanel(cont, p, v, modo, cambio) {
    let st = v && v.P ? { P: Object.assign({}, v.P), I: v.I } : EM.panelInicial(p);
    cont.innerHTML = `<div class="vista panel"><div class="txt ctl-col"><div class="ctl"></div>
      <div class="row"><button class="btn sm pri imin">Poner I mínima</button><button class="btn sm rst">Valores de esta pantalla</button></div>
      ${p.nota ? `<p class="lbl nota">${esc(p.nota)}</p>` : ''}</div>
      <div class="fig"><svg viewBox="${VBP}"></svg></div><div class="txt rd"></div></div>`;
    const ctl = cont.querySelector('.ctl');
    ctl.innerHTML = CT.map((c) => `<div><label><span>${c.l}</span><b data-v="${c.k}"></b></label><input type="range" data-k="${c.k}" min="${c.min}" max="${c.max}" step="${c.st}"></div>`).join('');
    const svg = cont.querySelector('svg');
    let dy = null, raf = null;
    const get = (k) => (k === 'I' ? st.I : st.P[k]);
    function sync() {
      CT.forEach((c) => {
        const inp = ctl.querySelector(`input[data-k="${c.k}"]`);
        if (document.activeElement !== inp) inp.value = get(c.k);
        ctl.querySelector(`b[data-v="${c.k}"]`).textContent = f(get(c.k), c.d) + (c.u ? ' ' + c.u : '');
      });
    }
    function dibujar() {
      const q = calc(st.P, st.I), fd = floorDy(st.P.h), objetivo = q.ok ? 0 : fd;
      if (dy === null) dy = objetivo;
      const pintaSvg = () => {
        const quieto = Math.abs(dy - objetivo) < 0.5;
        svg.innerHTML = horse({ h: st.P.h, I: st.I, N: st.P.N, force: true, fr: q.FI / q.Wn, hung: q.ok || !quieto, dy: dy, floor: true, arrows: q.ok && quieto, msg: (!q.ok && quieto) ? 'La barra cae: F < W' : '' });
      };
      cancelAnimationFrame(raf);
      const anim = () => { dy += (objetivo - dy) * 0.25; if (Math.abs(objetivo - dy) < 0.5) dy = objetivo; pintaSvg(); if (dy !== objetivo) raf = requestAnimationFrame(anim); };
      anim();
      const sat = q.BI > 1.605;
      cont.querySelector('.rd').innerHTML = `<div class="badge ${q.ok ? 'ok' : 'no'}">${q.ok ? '✓ La sostiene' : '✗ No la sostiene'}</div>
        <div class="c"><small>I mínima para esta carga</small><b>${sig(q.Ireq, 3)} A</b></div>
        <div class="c${sat ? ' alerta' : ''}"><small>B en el entrehierro</small><b>${sig(q.BI, 3)} T</b></div>
        <div class="c"><small>Carga máxima con esta I</small><b>${sig(q.liftT, 3)} t</b></div>
        <div class="c"><small>Parte de NI que pide el aire</small><b>${f(q.sh[0] * 100, 1)} %</b></div>
        ${sat ? '<div class="alert">⚠ B &gt; 1,6 T: el hierro real se satura y este modelo ya no vale.</div>' : ''}`;
    }
    ctl.oninput = (e) => {
      const k = e.target.dataset.k; if (!k) return;
      if (k === 'I') st.I = +e.target.value; else st.P[k] = +e.target.value;
      sync(); dibujar(); cambio && cambio({ P: Object.assign({}, st.P), I: st.I });
    };
    cont.querySelector('.imin').onclick = () => { st.I = EM.imin(st.P); sync(); dibujar(); cambio && cambio({ P: Object.assign({}, st.P), I: st.I }); };
    cont.querySelector('.rst').onclick = () => { st = EM.panelInicial(p); sync(); dibujar(); cambio && cambio({ P: Object.assign({}, st.P), I: st.I }); };
    sync(); dibujar();
    return {
      act(v2) { if (!v2 || !v2.P) return; st = { P: Object.assign({}, v2.P), I: v2.I }; sync(); dibujar(); },
      fin() { cancelAnimationFrame(raf); }
    };
  }

  function niceStep(rg, n) { const raw = rg / n, e = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / e; return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * e; }
  function plot(o) {
    const W = 360, H = 240, m = { l: 54, r: 14, t: 16, b: 46 }, pw = W - m.l - m.r, ph = H - m.t - m.b;
    const X = (x) => m.l + (x - o.x0) / (o.x1 - o.x0) * pw, Y = (y) => m.t + ph - y / o.y1 * ph;
    let s = '';
    const ys = niceStep(o.y1, 4), xs = niceStep(o.x1 - o.x0, 5), dec = (st) => Math.max(0, -Math.floor(Math.log10(st) + 1e-9));
    for (let y = 0; y <= o.y1 * 1.0001; y += ys) s += `<line class="ax" x1="${m.l}" x2="${W - m.r}" y1="${Y(y)}" y2="${Y(y)}"/><text class="tk" x="${m.l - 6}" y="${Y(y) + 5}" text-anchor="end">${f(y, dec(ys))}</text>`;
    for (let x = o.x0; x <= o.x1 * 1.0001; x += xs) s += `<text class="tk" x="${X(x)}" y="${H - m.b + 20}" text-anchor="middle">${f(x, dec(xs))}</text>`;
    s += `<text class="tk" x="${m.l + pw / 2}" y="${H - 4}" text-anchor="middle">${o.xl}</text>`;
    let d = ''; const n = 80;
    for (let i = 0; i <= n; i++) { const x = o.x0 + (o.x1 - o.x0) * i / n, y = Math.min(o.y1, o.fn(x)); d += (i ? ' L' : 'M') + X(x).toFixed(1) + ',' + Y(y).toFixed(1); }
    s += `<path class="ln" d="${d}"/>`;
    if (o.ref !== undefined) s += `<line class="ref" x1="${m.l}" x2="${W - m.r}" y1="${Y(o.ref)}" y2="${Y(o.ref)}"/><text class="tk" x="${m.l + 6}" y="${Y(o.ref) - 6}" style="fill:#1f2633;font-weight:700">${o.refl}</text>`;
    if (o.mk) s += `<circle cx="${X(o.mk.x)}" cy="${Y(o.mk.y)}" r="6" fill="#2a78d6" stroke="#fff" stroke-width="2"/><text class="tk" x="${X(o.mk.x) + 9}" y="${Y(o.mk.y) + 22}" style="fill:#1f2633;font-weight:700">${o.mk.l}</text>`;
    return `<svg viewBox="0 0 ${W} ${H}">${s}</svg>`;
  }
  function vGraf(cont) {
    const lift = (x) => calc(DEF, x).liftT;
    const Ih = (hh) => calc(Object.assign({}, DEF, { h: hh })).Ireq;
    cont.innerHTML = `<div class="vista graf"><div class="fig"><p class="lbl tc">Carga que levanta (t) según la corriente</p>
      ${plot({ x0: 0, x1: 140, y1: 4, fn: lift, xl: 'Corriente I (A)', ref: 1.36, refl: 'peso de la barra', mk: { x: R0.Ireq, y: 1.36, l: sig(R0.Ireq, 3) + ' A' } })}</div>
      <div class="fig"><p class="lbl tc">Corriente mínima (A) según el entrehierro</p>
      ${plot({ x0: 0, x1: 30, y1: Ih(30) * 1.05, fn: Ih, xl: 'Entrehierro h (mm)', mk: { x: 9, y: Ih(9), l: sig(Ih(9), 3) + ' A' } })}</div></div>`;
    return {};
  }

  function vCierre(cont) {
    cont.innerHTML = `<div class="vista"><div class="txt"><ul class="sum">
      <li><b>Ampère y circuito en serie:</b> \\(NI = \\Phi(\\mathcal R_1 + \\mathcal R_2 + \\mathcal R_g)\\).</li>
      <li><b>Fuerza:</b> \\(F = B^2S/\\mu_0\\) con dos entrehierros; se iguala al peso.</li>
      <li><b>El aire manda:</b> 18 mm de aire piden ≈ 94 % de la NI.</li>
      <li>\\(F \\propto I^2\\) y la corriente mínima es casi proporcional a h.</li>
      <li><b>Aplicaciones:</b> grúas de chatarra, relés, frenos y embragues electromagnéticos.</li></ul></div>
      <div class="txt"><div class="card"><b>Supuestos y límites</b><ul class="sum lbl">
      <li>μr constante: sin saturación. El hierro real se satura cerca de 1,6 T.</li>
      <li>Sin dispersión ni flujo marginal en los entrehierros.</li>
      <li>Camino medio: πa + 2l₁ en la herradura y l₂ en la barra; S = ancho × profundidad.</li>
      <li>«1,36 T.» tomada como toneladas métricas (1360 kg).</li></ul></div></div></div>`;
    EM.tex(cont);
    return {};
  }

  // Pantalla «¿Cuánto predijeron?»: v.pred = { c: [conteos por opción original], n }
  function vPred(cont, p, v) {
    const e1 = EM.PASOS.find((x) => x.id === 'E1');
    function pintar(v2) {
      const pr = (v2 && v2.pred) || null;
      cont.innerHTML = `<div class="vista"><div class="txt"><p class="big">Resultado: <b class="on-t">I ≈ ${sig(R0.Ireq, 3)} A</b></p>
        <p>Antes de calcular, ustedes predijeron:</p>${EM.barras(e1, pr ? pr.c : null, { correcta: true })}
        ${pr ? `<p class="lbl">${pr.n} votos.</p>` : '<p class="lbl">No hubo votos en la predicción.</p>'}</div>
        <div class="fig"><svg viewBox="${VBP}">${horse({ h: 9, I: R0.Ireq, N: 220, force: true, fr: 1, floor: true })}</svg></div></div>`;
      EM.tex(cont);
    }
    pintar(v);
    return { act(v2) { pintar(v2); } };
  }

  // Barras de una encuesta (las usan la TV, el celular y la pantalla de la predicción)
  // cuentas: conteo por opción original (o null); op.correcta: marcar la correcta; op.mio: opción del estudiante; op.antes: conteos de la ronda 1
  EM.barras = function (p, cuentas, op) {
    op = op || {};
    const ord = EM.orden(p), tot = cuentas ? cuentas.reduce((a, b) => a + b, 0) : 0;
    const totA = op.antes ? op.antes.reduce((a, b) => a + b, 0) : 0;
    return `<div class="opciones res">${ord.map((i, pos) => {
      const pc = tot ? Math.round(cuentas[i] / tot * 100) : 0, pa = totA ? Math.round(op.antes[i] / totA * 100) : null;
      const ok = op.correcta && i === p.c;
      return `<div class="op${ok ? ' ok' : ''}${op.mio === i ? ' mio' : ''}"><span class="fondo" style="width:${pc}%"></span>
        ${pa !== null ? `<span class="antes" style="width:${pa}%"></span>` : ''}
        <b class="letra">${'ABCD'[pos]}</b><span class="otxt">${p.o[i]}</span>
        <span class="pc">${cuentas ? pc + ' %' : ''}${pa !== null ? `<small>antes ${pa} %</small>` : ''}</span>${ok ? '<span class="vb">✓</span>' : ''}${op.mio === i ? '<span class="tuyo">tu voto</span>' : ''}</div>`;
    }).join('')}</div>`;
  };

  EM.vista = function (cont, p, v, modo, cambio) {
    cont.classList.add('modo-' + modo);
    switch (p.tipo) {
      case 'enun': return vEnun(cont) || {};
      case 'ley': return vLey(cont, p, v, modo, cambio);
      case 'sol': return vSol(cont, p);
      case 'circ': return vCirc(cont);
      case 'panel': return vPanel(cont, p, v, modo, cambio);
      case 'graf': return vGraf(cont);
      case 'cierre': return vCierre(cont);
      case 'pred': return vPred(cont, p, v);
      default: cont.innerHTML = ''; return {};
    }
  };

  // LaTeX con KaTeX (auto-render) sobre un elemento; si KaTeX aún no cargó, se intenta al cargar la página
  const OPC = { delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }], macros: { '\\sen': '\\operatorname{sen}' }, strict: 'ignore', throwOnError: false };
  const pend = new Set();
  EM.tex = function (el) {
    if (window.renderMathInElement) { try { window.renderMathInElement(el, OPC); } catch (e) { /* se ve el texto */ } return; }
    pend.add(el);
  };
  window.addEventListener('load', () => { pend.forEach((el) => EM.tex(el)); pend.clear(); });

  // Para las pruebas
  EM._dibSol = dibSol; EM._SOL = SOL;
})();
