// ============================================================
// Cápsula «Materiales magnéticos» (22/11/2026), ?c=materiales.
// Basada en el informe «Materiales magnéticos» que entregó el docente, con sus errores corregidos
// (láminas aisladas eléctricamente, sentido del ciclo B-H, Fe₃O₄ conductor, Cu diamagnético, etc.).
// Seis etapas, cada una con ideas, un problema paso a paso y un panel «¿y si…?». 22 encuestas.
// Datos numéricos propuestos y aprobados por el docente (22/11). Sin el tema del agua tratada con imanes.
// Usa las piezas comunes de em-capsula.js (EM.barras, EM.orden, EM.tex, EM.esc, EM.f, EM.sig).
// ============================================================
(function () {
  'use strict';
  const EM = window.EM;
  const MM = window.MM = {};
  const MU0 = 4e-7 * Math.PI, X = String.raw, GR = 9.81;
  const f = EM.f, sig = EM.sig, esc = EM.esc;
  MM.titulo = 'Materiales magnéticos';
  window.CAPSULAS = window.CAPSULAS || {};
  window.CAPSULAS.materiales = MM;

  const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  function sci(x, n) {
    n = n || 2; if (!isFinite(x)) return '∞'; if (x === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(x)));
    if (e >= -2 && e <= 4) return sig(x, n + 1);
    return f(x / Math.pow(10, e), n) + '×10' + String(e).split('').map((c) => SUP[c] || c).join('');
  }
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const svg = (vb, s) => `<svg viewBox="${vb}">${s}</svg>`;

  // ============================================================
  // FÍSICA
  // ============================================================
  // Etapa 1: respuesta de la materia (H en A/m, T en K)
  MM.MAT0 = {
    cu: { n: 'Cobre', tipo: 'dia', col: '#f6d2b3', bor: '#b4692f' },
    sal: { n: 'Sal', tipo: 'para', col: '#eef3fa', bor: '#8ea3bf' },
    fe: { n: 'Hierro', tipo: 'ferro', TC: 1043, mu: 3000, Cp: 2.3, col: '#d5d9df', bor: '#6b7480' },
    nio: { n: 'Óxido de níquel', tipo: 'anti', TN: 525, col: '#d3ead6', bor: '#4f8a5b' },
    fer: { n: 'Ferrita Mn-Zn', tipo: 'ferri', TC: 470, mu: 2000, Cp: 0.5, col: '#c9cdd3', bor: '#4c535c' }
  };
  const NOMBRE_TIPO = { dia: 'diamagnético', para: 'paramagnético', ferro: 'ferromagnético', anti: 'antiferromagnético', ferri: 'ferrimagnético' };
  function materia(P) {
    const m = MM.MAT0[P.mat] || MM.MAT0.fe, T = P.T, H = P.H;
    let chi, ord = false, orden;
    if (m.tipo === 'dia') { chi = -1.0e-5; orden = 'Momentos inducidos contra H'; }
    else if (m.tipo === 'para') { chi = 0.09 / T; orden = 'Espines que el calor desordena'; }
    else if (m.tipo === 'anti') {
      const cN = 7e-4; ord = T < m.TN;
      chi = ord ? cN * (0.67 + 0.33 * T / m.TN) : cN * (m.TN + 2000) / (T + 2000);
      orden = ord ? 'Vecinos antiparalelos iguales: se cancelan' : 'Sobre TN: paramagnético';
    } else {
      ord = T < m.TC;
      chi = ord ? (m.mu - 1) * Math.min(1, Math.sqrt((m.TC - T) / 150)) : m.Cp / (T - m.TC + 5);
      orden = ord ? (m.tipo === 'ferro' ? 'Dominios ordenados' : 'Subredes desiguales: queda un neto') : 'Sobre TC: paramagnético';
    }
    const tipoAhora = (m.tipo === 'ferro' || m.tipo === 'ferri' || m.tipo === 'anti') && !ord ? 'para' : m.tipo;
    return { m, chi, mur: 1 + chi, B0: MU0 * H, B: MU0 * (1 + chi) * H, ord, orden, tipoAhora };
  }
  MM.materia = materia;

  // Etapa 2: ciclos B-H (modelo de tangente hiperbólica con cierre en ±Hm). Calibrado: acero con
  // Bm = 1,2 T; Br = 1,0 T; Hc = 40 A/m en la amplitud completa.
  MM.LAZOS = {
    acero: { n: 'Acero al silicio', Bs: 1.2017, a: 33.382, h: 40.046, Hm: 150, k: 1, u: 'A/m' },
    ferb: { n: 'Ferrita Mn-Zn', Bs: 0.45, a: 43.281, h: 15, Hm: 300, k: 1, u: 'A/m' },
    alnico: { n: 'Alnico', Bs: 1.3005, a: 25436, h: 50010, Hm: 150e3, k: 1000, u: 'kA/m' },
    ferd: { n: 'Ferrita de bario', Bs: 0.414, a: 98147, h: 230050, Hm: 600e3, k: 1000, u: 'kA/m' },
    ndfeb: { n: 'NdFeB', Bs: 1.3158, a: 3.474e5, h: 9.5008e5, Hm: 2.4e6, k: 1000, u: 'kA/m' }
  };
  function lazo(mat, amp) {
    const L = MM.LAZOS[mat] || MM.LAZOS.acero, Hm = L.Hm * clamp(amp || 1, 0.02, 1), th = Math.tanh;
    const d = L.Bs * (th((Hm + L.h) / L.a) - th((Hm - L.h) / L.a)) / 2;
    const Bd = (H) => L.Bs * th((H + L.h) / L.a) - d, Ba = (H) => L.Bs * th((H - L.h) / L.a) + d;
    const Hc = Math.max(0, L.h - L.a * Math.atanh(Math.min(0.999999, d / L.Bs)));
    let area = 0; const n = 400;
    for (let i = 0; i < n; i++) { const H1 = -Hm + 2 * Hm * i / n, H2 = H1 + 2 * Hm / n; area += ((Bd(H1) - Ba(H1)) + (Bd(H2) - Ba(H2))) / 2 * (H2 - H1); }
    return { L, Hm, Bd, Ba, Bm: Bd(Hm), Br: Bd(0), Hc, area, P: area * 0.010 * 50, duro: L.h > 1e4 };
  }
  MM.lazo = lazo;
  function puntoLazo(q, fi) {
    fi = clamp(fi, 0, 1);
    if (fi <= 0.5) { const H = q.Hm - 4 * fi * q.Hm; return { H, B: q.Bd(H) }; }
    const H = -q.Hm + (fi - 0.5) * 4 * q.Hm; return { H, B: q.Ba(H) };
  }

  // Etapa 3: pérdidas en el núcleo (0,010 m³) y retenedor de puerta
  MM.NUC = {
    acero: { n: 'Acero al silicio', rho: 4.7e-7, Hc: 40, mu: 3000, Bmax: 1.6 },
    fe: { n: 'Hierro sin silicio', rho: 1.0e-7, Hc: 80, mu: 3000, Bmax: 1.7 },
    fer: { n: 'Ferrita Mn-Zn', rho: 1, Hc: 15, mu: 2000, Bmax: 0.35 }
  };
  function perdidas(P) {
    const m = MM.NUC[P.mat] || MM.NUC.acero, t = P.t / 1000, V = 0.010;
    const Ph = 4 * m.Hc * P.B * V * P.f, PF = Math.PI * Math.PI * P.f * P.f * P.B * P.B * t * t / (6 * m.rho) * V;
    const del = Math.sqrt(2 * m.rho / (2 * Math.PI * P.f * MU0 * m.mu));
    return { m, Ph, PF, tot: Ph + PF, del, sat: P.B > m.Bmax + 1e-9, valida: t < del };
  }
  MM.perdidas = perdidas;
  function reten(P) {
    const l = 0.40, S = 4e-4, N = 500, NI = N * P.I, RFe = l / (MU0 * P.mu * S), Rg = (P.g / 1000) / (MU0 * S);
    const Phi = NI / (RFe + Rg), B = Phi / S, F = B * B * S / MU0;
    return { NI, RFe, Rg, Phi, B, F, aire: Rg / (RFe + Rg) * 100, eq: P.g * P.mu / 10, sat: B > 1.605 };
  }
  MM.reten = reten;

  // Etapa 4: imanes (recta lineal con codo en Hcj). T en °C; Pc = coeficiente de permeancia.
  MM.IMAN = {
    n: { n: 'NdFeB grado N', Br: 1.30, mr: 1.05, Hcj: 1000e3, al: -0.0012, be: -0.006, Tmax: 80, Hx: 1100e3, col: '#e8590c' },
    sh: { n: 'NdFeB grado SH', Br: 1.28, mr: 1.05, Hcj: 1600e3, al: -0.0012, be: -0.0055, Tmax: 150, Hx: 1100e3, col: '#d9480f' },
    smco: { n: 'Samario-cobalto', Br: 1.05, mr: 1.03, Hcj: 1500e3, al: -0.00035, be: -0.0025, Tmax: 300, Hx: 1100e3, col: '#7048e8' },
    fer: { n: 'Ferrita', Br: 0.40, mr: 1.10, Hcj: 250e3, al: -0.002, be: 0.003, Tmax: 250, Hx: 400e3, col: '#8d6e3f' }
  };
  function iman(P) {
    const m = MM.IMAN[P.mat] || MM.IMAN.n, dT = P.T - 20;
    const Br = m.Br * (1 + m.al * dT), Hcj = Math.max(0, m.Hcj * (1 + m.be * dT));
    const H = -Br / (MU0 * (m.mr + P.Pc)), B = Br + MU0 * m.mr * H;
    return { m, Br, Hcj, H, B, BH: -B * H, BHmax: Br * Br / (4 * MU0 * m.mr), Hcb: Br / (MU0 * m.mr), pierde: -H > Hcj, caliente: P.T > m.Tmax };
  }
  MM.iman = iman;

  // Etapa 5: válvula de espín (modelo de dos canales; r = 1 Ω) y ciclo magnetocalórico (Gd ≈ 3 K/T)
  function gmr(P) {
    const r = 1, R = P.al, c = (1 - Math.cos(P.th * Math.PI / 180)) / 2;
    const fu = r + (R - r) * c, fd = R - (R - r) * c, Ru = r + fu, Rd = R + fd, Rt = Ru * Rd / (Ru + Rd);
    const RP = (2 * r) * (2 * R) / (2 * r + 2 * R), RAP = (r + R) / 2;
    return { r, R, fu, fd, Ru, Rd, Rt, RP, RAP, MR: (RAP - RP) / RP * 100, V: Rt * P.I, dV: (RAP - RP) * P.I, iu: Rd / (Ru + Rd) };
  }
  MM.gmr = gmr;
  function mc(P) { const dT = 3 * P.B; return { dT, T: [20 + dT, 20, 20 - dT, 20] }; }
  MM.mc = mc;

  // Etapa 6: levitación diamagnética. B·dB/dz disponible ≈ B²/L (B cae a cero en L mm).
  MM.LEV = {
    agua: { n: 'Agua (o una rana)', chi: -9.0e-6, rho: 1000 },
    grafito: { n: 'Grafito pirolítico', chi: -4.0e-4, rho: 2200 },
    bi: { n: 'Bismuto', chi: -1.66e-4, rho: 9780 },
    cu: { n: 'Cobre', chi: -1.0e-5, rho: 8960 },
    sc: { n: 'Superconductor', chi: -1, rho: 6000 }
  };
  function lev(P) {
    const m = MM.LEV[P.mat] || MM.LEV.agua, need = MU0 * m.rho * GR / Math.abs(m.chi), disp = P.B * P.B / (P.L / 1000);
    return { m, need, disp, rel: disp / need, flota: disp >= need };
  }
  MM.lev = lev;

  // ============================================================
  // DIBUJOS
  // ============================================================
  const AZ = '#1c7ed6', RO = '#c92a2a', TX = '#1f2633', VE = '#2f9e44', NA = '#e8590c';
  function arrow(x1, y1, x2, y2, col, w, hs) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L; hs = hs || 9;
    const bx = x2 - ux * hs, by = y2 - uy * hs;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${col}" stroke-width="${w || 3}" stroke-linecap="round"/>` +
      `<polygon points="${x2.toFixed(1)},${y2.toFixed(1)} ${(bx - uy * hs * 0.6).toFixed(1)},${(by + ux * hs * 0.6).toFixed(1)} ${(bx + uy * hs * 0.6).toFixed(1)},${(by - ux * hs * 0.6).toFixed(1)}" fill="${col}"/>`;
  }
  function cabeza(x1, y1, x2, y2, col, hs) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L; hs = hs || 11;
    const bx = x2 - ux * hs, by = y2 - uy * hs;
    return `<polygon points="${x2.toFixed(1)},${y2.toFixed(1)} ${(bx - uy * hs * 0.55).toFixed(1)},${(by + ux * hs * 0.55).toFixed(1)} ${(bx + uy * hs * 0.55).toFixed(1)},${(by - ux * hs * 0.55).toFixed(1)}" fill="${col}"/>`;
  }
  const pt = (cx, cy, r, t) => [cx + r * Math.cos(t), cy + r * Math.sin(t)];
  const halo = 'paint-order:stroke;stroke:#fff;stroke-width:5px;stroke-linejoin:round';
  function rnd(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const ANG = (() => { const r = rnd(7); return Array.from({ length: 20 }, () => (r() * 2 - 1) * Math.PI); })();

  // ---- Etapa 1: muestra en un campo H (líneas de B y momentos atómicos) ----
  const VBM = '0 0 400 300';
  function muestra(P, o) {
    o = o || {}; const q = materia(P), m = q.m, H = P.H, T = P.T;
    const x0 = 120, y0 = 80, w = 160, h = 130, cx = 200, cy = y0 + h / 2;
    let s = `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="8" fill="${m.col}" stroke="${m.bor}" stroke-width="2.4"/>`;
    const op = H > 0 ? 0.35 + 0.65 * Math.min(1, H / 100) : 0;
    let k;
    if (q.tipoAhora === 'dia') k = -0.3;
    else if (q.ord && (m.tipo === 'ferro' || m.tipo === 'ferri')) k = 0.85;
    else if (q.ord && m.tipo === 'anti') k = 0.15;
    else k = 0.25;
    if (op > 0) {
      [-0.86, -0.57, -0.29, 0, 0.29, 0.57, 0.86].forEach((u) => {
        const xb = cx + u * 185;
        const xt = k > 0 ? xb + (cx + u * (w / 2 - 12) - xb) * k : xb + Math.sign(u) * (-k) * 70 * (1 - Math.abs(u) * 0.5);
        const xx = (y) => xb + (xt - xb) / (1 + Math.pow((y - cy) / 100, 6));
        let d = '';
        for (let i = 0; i <= 40; i++) { const y = 290 - i * 280 / 40; d += (i ? ' L' : 'M') + xx(y).toFixed(1) + ',' + y.toFixed(1); }
        s += `<path d="${d}" fill="none" stroke="${AZ}" stroke-width="2.2" opacity="${op.toFixed(2)}"/>`;
        s += `<g opacity="${op.toFixed(2)}">${cabeza(xx(36), 36, xx(24), 24, AZ, 10)}</g>`;
      });
      s += `<text class="st" x="${cx + 0.86 * 185 + 6}" y="30" style="fill:${AZ}">B</text>`;
      s += arrow(30, 240, 30, 120, RO, 4, 12) + `<text class="st" x="40" y="140" style="fill:${RO}">H</text>`;
    }
    const cols = 5, rows = 4, alin = Math.min(1, H / 120);
    if (q.ord && m.tipo === 'ferro' && alin < 1) s += `<line x1="${x0 + 65}" y1="${y0 + 4}" x2="${x0 + 65}" y2="${y0 + h - 4}" stroke="${m.bor}" stroke-width="1.6" stroke-dasharray="5 4"/><line x1="${x0 + 4}" y1="${y0 + 65}" x2="${x0 + w - 4}" y2="${y0 + 65}" stroke="${m.bor}" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const ax = x0 + 20 + i * 30, ay = y0 + 18 + j * 31.3, idx = j * cols + i;
      let ang = null, len = 16, col = TX;
      if (m.tipo === 'dia') { if (H > 0) { ang = Math.PI; len = 6 + 12 * Math.min(1, H / 150); col = RO; } }
      else if (q.ord && m.tipo === 'ferro') { const dom = (i < 2 ? 0 : 1) + (j < 2 ? 0 : 2); ang = [0.9, 2.6, -1.7, -2.4][dom] * (1 - alin); len = 18; }
      else if (q.ord && m.tipo === 'anti') { ang = (i + j) % 2 ? Math.PI : 0; len = 15; }
      else if (q.ord && m.tipo === 'ferri') { const up = (i + j) % 2 === 0; ang = up ? 0 : Math.PI; len = up ? 22 : 12; }
      else { const sA = Math.tanh(1.1 * (H / 100) * (300 / T) * (m.tipo === 'para' ? 1 : 0.35)); ang = ANG[idx] * (1 - sA); len = 15; }
      s += `<circle cx="${ax}" cy="${ay}" r="3.2" fill="${col}"/>`;
      if (ang !== null) { const dx = Math.sin(ang) * len, dy = -Math.cos(ang) * len; s += arrow(ax - dx / 2, ay - dy / 2, ax + dx / 2, ay + dy / 2, col, 2.4, 6); }
    }
    const tipoTxt = q.tipoAhora !== m.tipo ? NOMBRE_TIPO.para + (m.tipo === 'anti' ? ' (sobre TN)' : ' (sobre TC)') : NOMBRE_TIPO[m.tipo];
    s += `<text class="st" x="${cx}" y="${y0 + h + 26}" text-anchor="middle" style="${halo}">${m.n}: ${tipoTxt}</text>`;
    if (op > 0 && (q.tipoAhora === 'dia' || q.tipoAhora === 'para' || m.tipo === 'anti')) s += `<text class="st2" x="${cx}" y="${y0 + h + 48}" text-anchor="middle" style="${halo}">curvatura y flechas exageradas</text>`;
    if (o.nota) s += `<text class="st" x="${cx}" y="20" text-anchor="middle" style="fill:${AZ};${halo}">${o.nota}</text>`;
    return svg(VBM, s);
  }

  // ---- Etapa 2: anillo de Rowland ----
  const VBR = '0 0 400 300';
  function anilloSec(cx, cy, Ri, Ro) {
    return `M${cx + Ro},${cy} A${Ro},${Ro} 0 1 1 ${cx - Ro},${cy} A${Ro},${Ro} 0 1 1 ${cx + Ro},${cy} Z M${cx + Ri},${cy} A${Ri},${Ri} 0 1 0 ${cx - Ri},${cy} A${Ri},${Ri} 0 1 0 ${cx + Ri},${cy} Z`;
  }
  function rowland(o) {
    o = o || {}; const hl = o.hl || [], cx = 200, cy = 150, Ro = 108, Ri = 76, Rm = 92;
    let s = `<path d="${anilloSec(cx, cy, Ri, Ro)}" fill="#d5d9df" stroke="#6b7480" stroke-width="2.2" fill-rule="evenodd"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${Rm}" class="flux" style="opacity:${hl.includes('B') ? 1 : 0.45}"/>`;
    if (hl.includes('L')) s += `<circle cx="${cx}" cy="${cy}" r="${Rm}" fill="none" stroke="${RO}" stroke-width="3" stroke-dasharray="8 5"/><text class="st" x="${cx}" y="${cy + 6}" text-anchor="middle" style="fill:${RO}">L = πD</text>`;
    const cP = hl.includes('H') ? RO : '#b45309', cS = hl.includes('B') ? VE : '#5c7f63';
    for (let g = -40; g <= 40; g += 10) { const t = Math.PI + g * Math.PI / 180, [xa, ya] = pt(cx, cy, Ri - 8, t), [xb, yb] = pt(cx, cy, Ro + 8, t); s += `<line x1="${xa.toFixed(1)}" y1="${ya.toFixed(1)}" x2="${xb.toFixed(1)}" y2="${yb.toFixed(1)}" stroke="${cP}" stroke-width="5" stroke-linecap="round"/>`; }
    for (let g = -24; g <= 24; g += 12) { const t = g * Math.PI / 180, [xa, ya] = pt(cx, cy, Ri - 8, t), [xb, yb] = pt(cx, cy, Ro + 8, t); s += `<line x1="${xa.toFixed(1)}" y1="${ya.toFixed(1)}" x2="${xb.toFixed(1)}" y2="${yb.toFixed(1)}" stroke="${cS}" stroke-width="5" stroke-linecap="round"/>`; }
    // fuente y primaria
    { const [x1, y1] = pt(cx, cy, Ro + 8, Math.PI * (1 - 40 / 180)), [x2, y2] = pt(cx, cy, Ro + 8, Math.PI * (1 + 40 / 180));
      s += `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} L26,${y1.toFixed(1)} L26,132 M26,168 L26,${y2.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}" fill="none" stroke="${cP}" stroke-width="2"/>`;
      s += `<circle cx="26" cy="150" r="18" fill="#fff" stroke="${cP}" stroke-width="2.4"/><text class="st" x="26" y="156" text-anchor="middle" style="fill:${cP}">I</text>`;
      s += `<text class="st" x="58" y="56" style="fill:${cP}">N₁</text>`; }
    // secundaria y fluxómetro
    { const [x1, y1] = pt(cx, cy, Ro + 8, -24 * Math.PI / 180), [x2, y2] = pt(cx, cy, Ro + 8, 24 * Math.PI / 180);
      s += `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} L350,${y1.toFixed(1)} L350,128 M350,172 L350,${y2.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}" fill="none" stroke="${cS}" stroke-width="2"/>`;
      s += `<rect x="326" y="128" width="62" height="44" rx="6" fill="#fff" stroke="${cS}" stroke-width="2.4"/><text class="st" x="357" y="157" text-anchor="middle" style="fill:${cS}">λ</text>`;
      s += `<text class="st" x="322" y="62" style="fill:${cS}">N₂</text><text class="st2" x="357" y="214" text-anchor="middle">fluxómetro</text>`; }
    if (o.nota) s += `<text class="st" x="${cx}" y="${cy + 6}" text-anchor="middle" style="fill:${AZ}">${o.nota}</text>`;
    return svg(VBR, s);
  }

  // ---- Etapa 2: dominios con H creciente ----
  function dominios() {
    const base = [1.6, -0.5, 3.4, 2.6, 0.2, 4.5, 0.8, 5.2, 3.0];
    const al2 = [0, 2, 4, 5, 7];
    let s = '';
    [['H = 0', 0], ['H medio', 1], ['H grande', 2]].forEach(([tit, k], p) => {
      const ox = 12 + p * 136, oy = 34;
      s += `<text class="st" x="${ox + 60}" y="22" text-anchor="middle">${tit}</text>`;
      for (let c = 0; c < 9; c++) {
        const i = c % 3, j = Math.floor(c / 3), x = ox + i * 40, y = oy + j * 40;
        const ok = k === 2 || (k === 1 && al2.includes(c));
        const ang = k === 0 ? base[c] : ok ? 0 : base[c] * 0.5;
        s += `<rect x="${x}" y="${y}" width="40" height="40" fill="${ok ? '#dbe8f8' : '#eef0f3'}" stroke="#8b95a3" stroke-width="1.4"/>`;
        const dx = Math.cos(ang) * 14, dy = -Math.sin(ang) * 14;
        s += arrow(x + 20 - dx, y + 20 - dy, x + 20 + dx, y + 20 + dy, ok ? AZ : TX, 2.6, 7);
      }
      if (k > 0) s += arrow(ox + 20, oy + 140, ox + 20 + (k === 1 ? 50 : 90), oy + 140, RO, 3.4, 10) + `<text class="st" x="${ox + (k === 1 ? 78 : 116)}" y="${oy + 146}" style="fill:${RO}">H</text>`;
      s += `<text class="st2" x="${ox + 60}" y="${oy + 176}" text-anchor="middle">${['M ≈ 0', 'M crece', 'M ≈ Ms'][k]}</text>`;
    });
    return svg('0 0 420 220', s);
  }

  // ---- Etapa 2: ciclo B-H ----
  function cicloG(mat, o) {
    o = o || {}; const q = lazo(mat, o.amp || 1), L = q.L, Hm = q.Hm;
    const W = o.W || 400, Hh = o.H || 280, m = { l: o.mini ? 14 : 18, r: 14, t: o.mini ? 44 : 26, b: 18 }, pw = W - m.l - m.r, ph = Hh - m.t - m.b;
    const hx = L.Hm * 1.08, by = Math.max(0.3, L.Bs * 1.18);
    const px = (h) => m.l + (h + hx) / (2 * hx) * pw, py = (b) => m.t + (by - b) / (2 * by) * ph;
    let s = '';
    s += `<line class="ax" x1="${m.l}" x2="${W - m.r}" y1="${py(0)}" y2="${py(0)}" style="stroke:#8b95a3;stroke-width:1.6"/><line class="ax" x1="${px(0)}" x2="${px(0)}" y1="${m.t}" y2="${Hh - m.b}" style="stroke:#8b95a3;stroke-width:1.6"/>`;
    const N = 90; let dd = '', da = '';
    for (let i = 0; i <= N; i++) { const H = Hm - 2 * Hm * i / N; dd += (i ? ' L' : 'M') + px(H).toFixed(1) + ',' + py(q.Bd(H)).toFixed(1); }
    for (let i = 0; i <= N; i++) { const H = -Hm + 2 * Hm * i / N; da += ' L' + px(H).toFixed(1) + ',' + py(q.Ba(H)).toFixed(1); }
    if (o.area) s += `<path d="${dd}${da} Z" fill="${AZ}" opacity=".16"/>`;
    if (o.inicial) { let di = ''; for (let i = 0; i <= 40; i++) { const H = Hm * i / 40; di += (i ? ' L' : 'M') + px(H).toFixed(1) + ',' + py((q.Bd(H) + q.Ba(H)) / 2).toFixed(1); } s += `<path d="${di}" fill="none" stroke="#8b95a3" stroke-width="2.4" stroke-dasharray="6 4"/>`; }
    s += `<path class="ln" d="${dd}"/><path class="ln" d="M${da.slice(2)}"/>`;
    // flechas en sentido antihorario: la rama de arriba va hacia la izquierda
    [[0.42, 0.3, 'd'], [-0.58, -0.7, 'd'], [-0.42, -0.3, 'a'], [0.58, 0.7, 'a']].forEach(([a, b, r]) => {
      const B1 = r === 'd' ? q.Bd(a * Hm) : q.Ba(a * Hm), B2 = r === 'd' ? q.Bd(b * Hm) : q.Ba(b * Hm);
      s += cabeza(px(a * Hm), py(B1), px(b * Hm), py(B2), '#174f9c', o.mini ? 9 : 12);
    });
    const u = L.k === 1 ? ' ' : ' k';
    if (o.marcas) {
      s += `<circle cx="${px(0)}" cy="${py(q.Br)}" r="6" fill="${RO}" stroke="#fff" stroke-width="2"/><text class="st" x="${px(0) - 9}" y="${py(q.Br) - 8}" text-anchor="end" style="fill:${RO};${halo}">Br${o.valores ? ' = ' + f(q.Br, 1) + ' T' : ''}</text>`;
      s += `<circle cx="${px(-q.Hc)}" cy="${py(0)}" r="6" fill="${VE}" stroke="#fff" stroke-width="2"/><text class="st" x="${px(-q.Hc) - 8}" y="${py(0) - 10}" text-anchor="end" style="fill:${VE};${halo}">−Hc${o.valores ? ' = −' + f(q.Hc / L.k, 0) + u + 'A/m' : ''}</text>`;
      s += `<circle cx="${px(Hm)}" cy="${py(q.Bm)}" r="6" fill="${AZ}" stroke="#fff" stroke-width="2"/><text class="st" x="${px(Hm) - 6}" y="${py(q.Bm) - 12}" text-anchor="end" style="fill:${AZ};${halo}">Bm${o.valores ? ' = ' + f(q.Bm, 1) + ' T' : ''}</text>`;
    }
    if (o.fi !== undefined) {
      const p = puntoLazo(q, o.fi);
      s += `<line x1="${px(p.H)}" y1="${py(p.B)}" x2="${px(p.H)}" y2="${py(0)}" stroke="${NA}" stroke-width="1.6" stroke-dasharray="4 3"/><line x1="${px(p.H)}" y1="${py(p.B)}" x2="${px(0)}" y2="${py(p.B)}" stroke="${NA}" stroke-width="1.6" stroke-dasharray="4 3"/>`;
      s += `<circle cx="${px(p.H)}" cy="${py(p.B)}" r="8" fill="${NA}" stroke="#fff" stroke-width="2.4"/>`;
    }
    s += `<text class="tk" x="${W - m.r}" y="${py(0) - 8}" text-anchor="end">${o.mini ? 'H' : 'H (' + L.u + ')'}</text><text class="tk" x="${px(0) + 8}" y="${m.t - 8}">B (T)</text>`;
    if (!o.mini) {
      s += `<text class="tk" x="${px(L.Hm)}" y="${py(0) + 20}" text-anchor="middle">${f(L.Hm / L.k, 0)}</text><text class="tk" x="${px(-L.Hm)}" y="${py(0) + 20}" text-anchor="middle">−${f(L.Hm / L.k, 0)}</text>`;
      const bt = L.Bs > 0.8 ? 1 : 0.4;
      [bt, -bt].forEach((b) => { s += `<line x1="${px(0) - 5}" x2="${px(0) + 5}" y1="${py(b)}" y2="${py(b)}" stroke="#8b95a3" stroke-width="1.6"/><text class="tk" x="${px(0) + 9}" y="${py(b) + 5}">${f(b, 1)}</text>`; });
    }
    if (o.titulo) s += `<text class="st" x="${W / 2}" y="18" text-anchor="middle">${o.titulo}</text>`;
    return s;
  }
  const ciclo = (mat, o) => svg('0 0 400 280', cicloG(mat, o));
  function cicloDoble() {
    return svg('0 0 420 270', `<g>${cicloG('acero', { W: 205, H: 230, mini: true, titulo: 'Acero al silicio' })}</g><g transform="translate(215,0)">${cicloG('ndfeb', { W: 205, H: 230, mini: true, titulo: 'NdFeB' })}</g>` +
      `<text class="st2" x="102" y="258" text-anchor="middle">Hc = 40 A/m</text><text class="st2" x="317" y="258" text-anchor="middle">Hc = 950 000 A/m</text>`);
  }

  // ---- Etapa 3: corrientes de Foucault (macizo frente a laminado) ----
  function lazoRect(x, y, w, h, col, sw, flechas) {
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w, h) * 0.35}" fill="none" stroke="${col}" stroke-width="${sw}"/>`;
    if (flechas) { s += cabeza(x + w / 2 - 6, y, x + w / 2 + 6, y, col, 9) + cabeza(x + w / 2 + 6, y + h, x + w / 2 - 6, y + h, col, 9); }
    else if (h > 30) s += cabeza(x, y + h / 2 + 4, x, y + h / 2 - 4, col, 7) + cabeza(x + w, y + h / 2 - 4, x + w, y + h / 2 + 4, col, 7);
    return s;
  }
  function chapas(o) {
    o = o || {}; const hl = o.hl || [];
    let s = `<rect x="20" y="40" width="150" height="150" rx="4" fill="#d5d9df" stroke="#6b7480" stroke-width="2"/>`;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = 39 + i * 37, y = 59 + j * 37; s += `<circle cx="${x}" cy="${y}" r="6" fill="none" stroke="#9aa3ae" stroke-width="1.4"/><path d="M${x - 4},${y - 4} L${x + 4},${y + 4} M${x + 4},${y - 4} L${x - 4},${y + 4}" stroke="#9aa3ae" stroke-width="1.4"/>`; }
    s += lazoRect(38, 58, 114, 114, RO, 4, true);
    s += `<text class="st" x="95" y="216" text-anchor="middle">macizo</text>`;
    const n = 7, g = 4, pw = (150 - (n - 1) * g) / n;
    for (let i = 0; i < n; i++) {
      const x = 230 + i * (pw + g);
      s += `<rect x="${x.toFixed(1)}" y="40" width="${pw.toFixed(1)}" height="150" fill="#d5d9df" stroke="#6b7480" stroke-width="1.2"/>`;
      if (i < n - 1) s += `<rect x="${(x + pw).toFixed(1)}" y="40" width="${g}" height="150" fill="${hl.includes('aisl') ? RO : '#a07a3c'}"/>`;
      s += lazoRect(x + 3.5, 52, pw - 7, 126, RO, 2, false);
    }
    s += `<text class="st" x="305" y="216" text-anchor="middle">laminado</text>`;
    s += `<text class="st2" x="200" y="24" text-anchor="middle">⊗ B alterno; en rojo, la corriente inducida</text>`;
    if (hl.includes('aisl')) s += arrow(372, 234, 339, 193, RO, 2.6, 9) + `<text class="st" x="398" y="254" text-anchor="end" style="fill:${RO}">aislante eléctrico</text>`;
    return svg('0 0 400 262', s);
  }
  function perdFig(P) {
    const q = perdidas(P), fer = P.mat === 'fer';
    let s = '';
    if (fer) {
      s += `<rect x="40" y="20" width="320" height="100" rx="4" fill="#c9cdd3" stroke="#4c535c" stroke-width="2"/><text class="st" x="200" y="76" text-anchor="middle">ferrita: casi no conduce</text>`;
    } else {
      const pw = 6 + 30 * P.t, g = 3, n = Math.max(1, Math.floor(320 / (pw + g)));
      const int = clamp(Math.log10(1 + q.PF) / 2.6, 0.15, 1);
      for (let i = 0; i < n; i++) {
        const x = 40 + i * (pw + g);
        s += `<rect x="${x.toFixed(1)}" y="20" width="${pw.toFixed(1)}" height="100" fill="#d5d9df" stroke="#6b7480" stroke-width="1"/>`;
        if (pw > 9) s += `<rect x="${(x + 2.5).toFixed(1)}" y="28" width="${(pw - 5).toFixed(1)}" height="84" rx="${((pw - 5) * 0.4).toFixed(1)}" fill="none" stroke="${RO}" stroke-width="${(1 + 2.4 * int).toFixed(1)}" opacity="${(0.35 + 0.65 * int).toFixed(2)}"/>`;
      }
      s += `<text class="st2" x="200" y="144" text-anchor="middle">láminas de ${f(P.t, 2)} mm</text>`;
    }
    const mx = Math.max(q.Ph, q.PF, 20), bw = (v) => Math.max(2, 230 * v / mx);
    s += `<text class="st2" x="104" y="182" text-anchor="end">histéresis</text><rect x="110" y="166" width="${bw(q.Ph).toFixed(1)}" height="22" rx="3" fill="${AZ}"/><text class="st" x="${(116 + bw(q.Ph)).toFixed(1)}" y="183">${sig(q.Ph, 3)} W</text>`;
    s += `<text class="st2" x="104" y="222" text-anchor="end">Foucault</text><rect x="110" y="206" width="${bw(q.PF).toFixed(1)}" height="22" rx="3" fill="${RO}"/><text class="st" x="${(116 + bw(q.PF)).toFixed(1)}" y="223">${q.PF < 0.01 ? '≈ 0' : sig(q.PF, 3)} W</text>`;
    s += `<text class="st2" x="200" y="256" text-anchor="middle">núcleo de 0,010 m³</text>`;
    return svg('0 0 400 268', s);
  }

  // ---- Etapa 3: retenedor electromagnético de puerta ----
  function retenFig(P, o) {
    o = o || {}; const hl = o.hl || [], q = reten(P);
    const gp = P.g > 0 ? 3 + 34 * Math.min(1, P.g / 0.5) : 0, yT = 64 + gp;
    let s = `<rect x="50" y="30" width="300" height="34" rx="3" fill="#e3e6ea" stroke="#6b7480" stroke-width="2"/><text class="st2" x="200" y="20" text-anchor="middle">placa de la puerta</text>`;
    s += `<path d="M70,${yT} H125 V205 H275 V${yT} H330 V255 H70 Z" fill="#d5d9df" stroke="#6b7480" stroke-width="2.2"/>`;
    for (let x = 146; x <= 254; x += 12) s += `<line x1="${x}" y1="196" x2="${x}" y2="264" stroke="#b45309" stroke-width="6" stroke-linecap="round"/>`;
    s += `<text class="st" x="200" y="290" text-anchor="middle" style="fill:#b45309">N·I = ${f(q.NI, 0)} A·v</text>`;
    s += `<path d="M97.5,230 V47 H302.5 V230 Z" class="flux${P.I > 0 ? '' : ' off'}" style="opacity:${hl.includes('flujo') ? 1 : 0.6}"/>`;
    const fc = hl.includes('caras');
    s += `<line x1="70" y1="${yT}" x2="125" y2="${yT}" stroke="${fc ? RO : '#6b7480'}" stroke-width="${fc ? 6 : 2.2}"/><line x1="275" y1="${yT}" x2="330" y2="${yT}" stroke="${fc ? RO : '#6b7480'}" stroke-width="${fc ? 6 : 2.2}"/>`;
    if (gp > 0) {
      const cg = hl.includes('gap') ? RO : TX;
      s += `<rect x="70" y="64" width="55" height="${gp}" fill="#f7e3b5" opacity=".9"/><rect x="275" y="64" width="55" height="${gp}" fill="#f7e3b5" opacity=".9"/>`;
      s += `<text class="st" x="338" y="${64 + gp / 2 + 6}" style="fill:${cg}">g</text>`;
      if (hl.includes('gap')) s += `<text class="st" x="200" y="${64 + gp + 26}" text-anchor="middle" style="fill:${RO}">suciedad = aire</text>`;
    }
    if (o.F) [97.5, 302.5].forEach((x) => { s += arrow(x, 8, x, 40, VE, 3.4, 10); });
    if (o.F) s += `<text class="st" x="118" y="22" style="fill:${VE}">F</text>`;
    if (!hl.includes('gap')) s += `<text class="st2" x="200" y="${yT + 42}" text-anchor="middle">l = 40 cm</text><text class="st2" x="200" y="${yT + 64}" text-anchor="middle">S = 4 cm²</text>`;
    return svg('0 0 400 300', s);
  }

  // ---- Etapa 4: segundo cuadrante (curva de desmagnetización) ----
  function cuadG(o) {
    const W = 400, Hh = 290, m = { l: 52, r: 16, t: 18, b: 44 }, pw = W - m.l - m.r, ph = Hh - m.t - m.b;
    const Hx = o.Hx, by = o.by || 1.45;
    const px = (H) => m.l + (H + Hx) / Hx * pw, py = (B) => m.t + (by - B) / by * ph;
    let s = '';
    const st = Hx > 600e3 ? 200e3 : 100e3;
    for (let H = 0; H <= Hx + 1; H += st) { s += `<line class="ax" x1="${px(-H)}" x2="${px(-H)}" y1="${m.t}" y2="${Hh - m.b}"/><text class="tk" x="${px(-H)}" y="${Hh - m.b + 18}" text-anchor="middle">${H ? '−' + f(H / 1000, 0) : '0'}</text>`; }
    const bs = by > 0.8 ? 0.5 : 0.1;
    for (let B = 0; B <= by + 1e-9; B += bs) s += `<line class="ax" x1="${m.l}" x2="${W - m.r}" y1="${py(B)}" y2="${py(B)}"/><text class="tk" x="${m.l - 6}" y="${py(B) + 5}" text-anchor="end">${f(B, bs < 0.5 ? 1 : 1)}</text>`;
    s += `<text class="tk" x="${m.l + pw / 2}" y="${Hh - 6}" text-anchor="middle">H (kA/m)</text><text class="tk" x="14" y="${m.t + ph / 2}" transform="rotate(-90 14 ${m.t + ph / 2})" text-anchor="middle">B (T)</text>`;
    return { s, px, py, Hx, by };
  }
  function rectaIman(c, q, col, w, dash) {
    const m = q.m, lim = Math.min(q.Hcj, c.Hx);
    let d = `M${c.px(0)},${c.py(q.Br)}`;
    const Bk = q.Br - MU0 * m.mr * lim;
    if (Bk > 0) { d += ` L${c.px(-lim)},${c.py(Bk)}`; if (q.Hcj <= c.Hx) d += ` L${c.px(-Math.min(c.Hx, q.Hcj * 1.05))},${c.py(0)}`; }
    else d += ` L${c.px(-q.Hcb)},${c.py(0)}`;
    return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" ${dash ? 'stroke-dasharray="6 5"' : ''} stroke-linejoin="round"/>`;
  }
  function cuadrante(P, o) {
    o = o || {}; const hl = o.hl || [], q = iman(P), m = q.m;
    const c = cuadG({ Hx: m.Hx, by: m.Br > 0.8 ? 1.45 : 0.5 });
    let s = c.s;
    if (o.ref && P.T !== 20) s += rectaIman(c, iman(Object.assign({}, P, { T: 20 })), '#aab2bd', 2.4, true) + `<text class="tk" x="${c.px(0) - 6}" y="${c.py(m.Br) - 6}" text-anchor="end">20 °C</text>`;
    // J intrínseca
    { const lim = Math.min(q.Hcj, c.Hx), J0 = q.Br, Jk = q.Br + MU0 * (m.mr - 1) * (-lim);
      let d = `M${c.px(0)},${c.py(J0)} L${c.px(-lim)},${c.py(Math.min(c.by, Jk))}`; if (q.Hcj <= c.Hx) d += ` L${c.px(-lim)},${c.py(0)}`;
      s += `<path d="${d}" fill="none" stroke="${m.col}" stroke-width="1.8" stroke-dasharray="3 4" opacity=".7"/>`; }
    if (hl.includes('bh') && !q.pierde) s += `<rect x="${c.px(q.H)}" y="${c.py(q.B)}" width="${c.px(0) - c.px(q.H)}" height="${c.py(0) - c.py(q.B)}" fill="#f6dc6b" opacity=".55"/><text class="st" x="${(c.px(q.H) + c.px(0)) / 2}" y="${(c.py(q.B) + c.py(0)) / 2 + 6}" text-anchor="middle">B·H</text>`;
    { const Bk = q.Br - MU0 * m.mr * q.Hcj; if (q.Hcj <= c.Hx && Bk > 0) s += `<line x1="${c.px(-q.Hcj)}" y1="${c.py(Bk)}" x2="${c.px(-Math.min(c.Hx, q.Hcb))}" y2="${c.py(q.Br - MU0 * m.mr * Math.min(c.Hx, q.Hcb))}" stroke="${m.col}" stroke-width="2" stroke-dasharray="3 4" opacity=".6"/>`; }
    s += rectaIman(c, q, m.col, 3.4, false);
    if (q.Hcj <= c.Hx) { const Bk = Math.max(0, q.Br - MU0 * m.mr * q.Hcj); s += `<circle cx="${c.px(-q.Hcj)}" cy="${c.py(Bk)}" r="5" fill="#fff" stroke="${m.col}" stroke-width="2.4"/><text class="st2" x="${c.px(-q.Hcj) + 8}" y="${c.py(Bk) - 8}" style="${halo}">codo</text>`; }
    // recta de carga
    { const Hend = Math.min(c.Hx, c.by / (P.Pc * MU0)); s += `<line x1="${c.px(0)}" y1="${c.py(0)}" x2="${c.px(-Hend)}" y2="${c.py(P.Pc * MU0 * Hend)}" stroke="${TX}" stroke-width="2" stroke-dasharray="7 5"/>`;
      s += `<text class="st2" x="${c.px(-Hend * 0.62) - 6}" y="${c.py(P.Pc * MU0 * Hend * 0.62) - 8}" text-anchor="end" style="${halo}">recta de carga</text>`; }
    const okc = q.pierde ? RO : VE;
    s += `<line x1="${c.px(q.H)}" y1="${c.py(q.B)}" x2="${c.px(q.H)}" y2="${c.py(0)}" stroke="${okc}" stroke-width="1.4" stroke-dasharray="4 3"/>`;
    s += `<circle cx="${c.px(q.H)}" cy="${c.py(q.B)}" r="8" fill="${okc}" stroke="#fff" stroke-width="2.4"/>`;
    if (hl.includes('op') || q.pierde) { const der = c.px(q.H) < 230; s += `<text class="st" x="${c.px(q.H) + (der ? 12 : -12)}" y="${c.py(q.B) + 24}" text-anchor="${der ? 'start' : 'end'}" style="fill:${okc};${halo}">${q.pierde ? 'pasó el codo' : 'punto de trabajo'}</text>`; }
    s += `<text class="st" x="${c.px(-c.Hx) + 8}" y="${c.py(c.by) + 20}" style="${halo}">${m.n}; ${f(P.T, 0)} °C</text>`;
    s += `<text class="st2" x="${c.px(0) - 8}" y="${c.py(q.Br) + 20}" text-anchor="end" style="fill:${m.col};${halo}">Br</text>`;
    return svg('0 0 400 290', s);
  }
  function familias() {
    const c = cuadG({ Hx: 1100e3, by: 1.45 });
    let s = c.s;
    ['n', 'smco', 'fer'].forEach((k) => { s += rectaIman(c, iman({ mat: k, T: 20, Pc: 1 }), MM.IMAN[k].col, 3.4, false); });
    // alnico: curva no lineal (Br = 1,25 T; Hc = 50 kA/m)
    { let d = ''; for (let i = 0; i <= 30; i++) { const u = 1 - i / 30, H = -(1 - u) * 50e3, B = 1.25 * u / (u + 0.25 * (1 - u)); d += (i ? ' L' : 'M') + c.px(H).toFixed(1) + ',' + c.py(B).toFixed(1); } s += `<path d="${d}" fill="none" stroke="${VE}" stroke-width="3.4"/>`; }
    s += `<text class="st" x="${c.px(-560e3)}" y="${c.py(0.86)}" style="fill:${MM.IMAN.n.col};${halo}">NdFeB</text>`;
    s += `<text class="st" x="${c.px(-470e3)}" y="${c.py(0.2)}" style="fill:${MM.IMAN.smco.col};${halo}">SmCo</text>`;
    s += `<text class="st" x="${c.px(-330e3)}" y="${c.py(0.05) - 4}" style="fill:${MM.IMAN.fer.col};${halo}">ferrita</text>`;
    s += `<text class="st" x="${c.px(-90e3)}" y="${c.py(1.38)}" text-anchor="end" style="fill:${VE};${halo}">alnico (Hc baja)</text>` + arrow(c.px(-85e3), c.py(1.33), c.px(-30e3), c.py(1.2), VE, 2, 8);
    return svg('0 0 400 290', s);
  }

  // ---- Etapa 5: válvula de espín y su circuito de dos canales ----
  function valvula(P, o) {
    o = o || {}; const q = gmr(P), th = P.th * Math.PI / 180;
    let s = '';
    const capa = (y, h, fill, stk) => `<rect x="20" y="${y}" width="210" height="${h}" fill="${fill}" stroke="${stk}" stroke-width="1.6"/>`;
    s += capa(26, 26, '#dbe8f8', AZ) + capa(52, 14, '#f6d2b3', '#b4692f') + capa(66, 26, '#dbe8f8', AZ) + capa(92, 18, '#d3ead6', '#4f8a5b');
    const lx = 70 * Math.cos(th);
    if (Math.abs(lx) > 6) s += arrow(125 - lx / 2, 39, 125 + lx / 2, 39, AZ, 3.4, 10); else s += `<circle cx="125" cy="39" r="5" fill="${AZ}"/>`;
    s += arrow(90, 79, 160, 79, AZ, 3.4, 10);
    for (let i = 0; i < 6; i++) { const x = 40 + i * 34; s += arrow(x, i % 2 ? 96 : 106, x, i % 2 ? 106 : 96, '#4f8a5b', 2, 5); }
    s += `<text class="st2" x="238" y="44">capa libre</text><text class="st2" x="238" y="63">espaciador Cu</text><text class="st2" x="238" y="84">capa fija</text><text class="st2" x="238" y="106">antiferro</text>`;
    // brújula de la capa libre
    s += `<circle cx="376" cy="34" r="20" fill="#fff" stroke="${AZ}" stroke-width="1.6"/>` + arrow(376 - 14 * Math.cos(th), 34 + 14 * Math.sin(th), 376 + 14 * Math.cos(th), 34 - 14 * Math.sin(th), AZ, 2.6, 7);
    s += `<text class="tk" x="398" y="74" text-anchor="end">θ = ${f(P.th, 0)}°</text>`;
    // circuito equivalente
    const ancho = (v) => 26 + 80 * v / (v + 3);
    const rama = (y, a, b, lab, share) => {
      const w1 = ancho(a), w2 = ancho(b), x1 = 80, x2 = 80 + w1 + 28, sw = (1.5 + 6 * share).toFixed(1);
      let r = `<line x1="30" y1="${y}" x2="370" y2="${y}" stroke="${NA}" stroke-width="${sw}"/>`;
      r += `<rect x="${x1}" y="${y - 15}" width="${w1.toFixed(1)}" height="30" rx="4" fill="#fff" stroke="${TX}" stroke-width="2"/><text class="st2" x="${(x1 + w1 / 2).toFixed(1)}" y="${y + 6}" text-anchor="middle">${sig(a, 2)} Ω</text>`;
      r += `<rect x="${x2.toFixed(1)}" y="${y - 15}" width="${w2.toFixed(1)}" height="30" rx="4" fill="#fff" stroke="${TX}" stroke-width="2"/><text class="st2" x="${(x2 + w2 / 2).toFixed(1)}" y="${y + 6}" text-anchor="middle">${sig(b, 2)} Ω</text>`;
      r += `<text class="st" x="40" y="${y - 22}">${lab}</text>`;
      return r;
    };
    s += `<line x1="30" y1="186" x2="30" y2="256" stroke="${TX}" stroke-width="2"/><line x1="370" y1="186" x2="370" y2="256" stroke="${TX}" stroke-width="2"/>`;
    s += rama(186, q.fu, q.r, 'espín ↑', q.iu) + rama(256, q.fd, q.R, 'espín ↓', 1 - q.iu);
    s += `<text class="tk" x="${80 + ancho(q.fu) / 2}" y="${290}" text-anchor="middle">libre</text><text class="tk" x="${80 + ancho(q.fu) + 28 + ancho(q.r) / 2}" y="290" text-anchor="middle">fija</text>`;
    s += `<text class="st" x="370" y="${o.solo ? 150 : 150}" text-anchor="end" style="fill:${NA}">R = ${sig(q.Rt, 3)} Ω</text>`;
    return svg('0 0 400 300', s);
  }

  // ---- Etapa 5: ciclo magnetocalórico (4 etapas) ----
  function cicloMC(P) {
    const q = mc(P), e = +P.e || 1;
    const cajas = [[8, 8, '1 Magnetizar'], [212, 8, '2 Botar calor'], [212, 158, '3 Desmagnetizar'], [8, 158, '4 Absorber calor']];
    let s = '';
    cajas.forEach(([x, y, tit], i) => {
      const T = q.T[i], on = i + 1 === e, col = T > 20.5 ? '#f3a6a6' : T < 19.5 ? '#a9c9f2' : '#d5d9df';
      s += `<rect x="${x}" y="${y}" width="180" height="134" rx="10" fill="#fff" stroke="${on ? AZ : '#cbd3dd'}" stroke-width="${on ? 4 : 1.6}"/>`;
      s += `<text class="st" x="${x + 10}" y="${y + 24}">${tit}</text>`;
      s += `<rect x="${x + 22}" y="${y + 46}" width="54" height="54" rx="6" fill="${col}" stroke="#6b7480" stroke-width="1.6"/><text class="st2" x="${x + 49}" y="${y + 79}" text-anchor="middle">Gd</text>`;
      if (i < 2) s += `<path d="M${x + 12},${y + 40} q37,-14 74,0 M${x + 12},${y + 106} q37,14 74,0" fill="none" stroke="${AZ}" stroke-width="2"/><text class="st2" x="${x + 92}" y="${y + 50}" style="fill:${AZ}">B</text>`;
      else s += `<text class="st2" x="${x + 92}" y="${y + 50}">B = 0</text>`;
      s += `<text class="st" x="${x + 92}" y="${y + 84}" style="fill:${T > 20.5 ? RO : T < 19.5 ? AZ : TX}">${sig(T, 3)} °C</text>`;
      if (i === 1) s += arrow(x + 96, y + 108, x + 160, y + 108, RO, 3, 9) + `<text class="tk" x="${x + 96}" y="${y + 128}">al ambiente</text>`;
      if (i === 3) s += arrow(x + 160, y + 108, x + 96, y + 108, AZ, 3, 9) + `<text class="tk" x="${x + 92}" y="${y + 128}">del interior</text>`;
    });
    s += arrow(190, 70, 210, 70, TX, 3, 9) + arrow(302, 144, 302, 156, TX, 3, 8) + arrow(210, 226, 190, 226, TX, 3, 9) + arrow(98, 156, 98, 144, TX, 3, 8);
    return svg('0 0 400 300', s);
  }

  // ---- Etapa 6: levitación diamagnética ----
  function levita(P, o) {
    o = o || {}; const q = lev(P), m = q.m, bob = P.B >= 2;
    let s = '';
    if (bob) { s += `<rect x="110" y="226" width="180" height="62" rx="8" fill="#f3d9c2" stroke="#b45309" stroke-width="2"/>`; for (let x = 122; x <= 278; x += 12) s += `<line x1="${x}" y1="228" x2="${x}" y2="286" stroke="#b45309" stroke-width="4"/>`; s += `<text class="st" x="200" y="262" text-anchor="middle" style="${halo}">electroimán</text>`; }
    else s += `<rect x="130" y="240" width="140" height="48" rx="4" fill="#d5d9df" stroke="#6b7480" stroke-width="2"/><text class="st" x="200" y="270" text-anchor="middle">imán NdFeB</text>`;
    const yTop = bob ? 226 : 240;
    [-1, -0.6, -0.25, 0.25, 0.6, 1].forEach((u) => { s += `<path d="M${200 + u * 50},${yTop} Q${200 + u * 70},${yTop - 90} ${200 + u * 170},${yTop - 190}" fill="none" stroke="${AZ}" stroke-width="1.8" opacity=".45"/>`; });
    const yo = q.flota ? 120 : yTop - 22;
    if (P.mat === 'grafito') s += `<rect x="160" y="${yo - 6}" width="80" height="12" rx="2" fill="#5c636d" stroke="#2f343a" stroke-width="1.6"/>`;
    else if (P.mat === 'sc') s += `<ellipse cx="200" cy="${yo}" rx="40" ry="12" fill="#c9cdd3" stroke="#4c535c" stroke-width="2"/><text class="st2" x="200" y="${yo + 5}" text-anchor="middle">SC</text>`;
    else { const col = { agua: '#a9d3f5', bi: '#d8c3d6', cu: '#e8a87c' }[P.mat] || '#a9d3f5'; s += `<circle cx="200" cy="${yo}" r="20" fill="${col}" stroke="#4c535c" stroke-width="1.8"/>`; }
    const lf = clamp(56 * q.rel, 0, 100);
    if (q.flota) {
      s += arrow(222, yo, 222, yo + 56, TX, 3.4, 11) + `<text class="st2" x="230" y="${yo + 52}" style="${halo}">peso</text>`;
      s += arrow(178, yo, 178, yo - lf, RO, 3.4, 11) + `<text class="st2" x="170" y="${Math.max(48, yo - lf + 6)}" text-anchor="end" style="fill:${RO};${halo}">fuerza magnética</text>`;
    } else {
      const y0 = yo - 26;
      s += arrow(226, y0 - 56, 226, y0, TX, 3.4, 11) + `<text class="st2" x="234" y="${y0 - 30}" style="${halo}">peso</text>`;
      if (lf > 3) s += arrow(174, y0, 174, y0 - lf, RO, 3.4, Math.min(11, lf));
      s += `<text class="st2" x="166" y="${y0 - Math.max(lf, 4) + 6}" text-anchor="end" style="fill:${RO};${halo}">fuerza magnética</text>`;
    }
    s += `<text class="st" x="12" y="24" style="${halo}">${m.n}</text>`;
    s += `<text class="st" x="388" y="24" text-anchor="end" style="fill:${q.flota ? VE : RO};${halo}">${q.flota ? 'flota' : 'no flota'}</text>`;
    return svg('0 0 400 300', s);
  }
  MM._dib = { muestra, rowland, dominios, ciclo, cicloDoble, chapas, perdFig, retenFig, cuadrante, familias, valvula, cicloMC, levita };

  // ============================================================
  // IDEAS (leyes) de cada etapa
  // ============================================================
  const P0 = { mat: 'fe', H: 100, T: 300 };
  const LEYES = [
    [
      { c: 'B, H y M', n: 'Campo y magnetización', f: X`\(\vec B = \mu_0(\vec H + \vec M) = \mu_0(1+\chi_m)\,\vec H\)`,
        d: 'H es el campo dentro del material (lo crea la corriente y lo corrige el propio material). M es lo que aportan los átomos: sus electrones giran en órbitas y tienen espín. χm dice cuánto responde el material: μr = 1 + χm.', w: 'En el imán en anillo de la cápsula anterior, H dentro del imán iba contra M: H no es «el campo exterior».', fig: () => muestra(P0) },
      { c: 'Dia', n: 'Diamagnetismo', f: X`\(\chi_m \approx -10^{-5}\)`,
        d: 'El campo induce en cada órbita un pequeño momento en contra (ley de Lenz a escala atómica). Existe en toda la materia; se nota solo cuando no hay nada más. Ejemplos: cobre, agua, oro, bismuto.', w: 'Un diamagnético es empujado hacia donde el campo es más débil.', fig: () => muestra({ mat: 'cu', H: 100, T: 300 }) },
      { c: 'Para', n: 'Paramagnetismo', f: X`\(\chi_m = \dfrac{C}{T}\quad(\text{ley de Curie})\)`,
        d: 'Los electrones desapareados dan a cada átomo un momento propio (espín). El campo los alinea un poco y el calor los desordena: χ pequeña y positiva (10⁻⁵ a 10⁻³). Ejemplos: aluminio, oxígeno, sales de metales.', w: 'La ley de Curie vale para sales y O₂; en metales como el aluminio, χ casi no cambia con T.', fig: () => muestra({ mat: 'sal', H: 100, T: 300 }) },
      { c: 'Ferro', n: 'Ferromagnetismo', f: X`\(\chi_m \ \text{hasta}\ 10^{5} \qquad T < T_C\)`,
        d: 'La interacción de intercambio alinea en paralelo los espines vecinos, en regiones llamadas dominios. Con un campo pequeño los dominios se alinean y B se multiplica por miles. Hierro, níquel, cobalto y sus aleaciones.', w: 'Sobre la temperatura de Curie (hierro: 770 °C) el orden se pierde y queda paramagnético.', fig: () => muestra({ mat: 'fe', H: 40, T: 300 }) },
      { c: 'Anti y ferri', n: 'Antiferro y ferrimagnetismo', f: X`\(M_{\text{anti}} = 0 \qquad M_{\text{ferri}} \neq 0\)`,
        d: 'Antiferro: vecinos antiparalelos e iguales, se cancelan (cromo, NiO) hasta la temperatura de Néel. Ferri: antiparalelos pero desiguales (Fe²⁺ y Fe³⁺), queda un neto. Las ferritas Mn-Zn y Ni-Zn son ferrimagnéticas y casi no conducen electricidad.', w: 'La magnetita (Fe₃O₄) también es ferrimagnética, pero sí conduce.', fig: () => muestra({ mat: 'fer', H: 100, T: 300 }) }
    ],
    [
      { c: 'Dominios', n: 'Dominios magnéticos', f: X`\(H = 0:\ M \approx 0 \qquad H\ \text{grande}:\ M \to M_s\)`,
        d: 'Sin campo, los dominios apuntan a todos lados y se cancelan. Al subir H, primero crecen los dominios alineados (se mueven sus paredes) y al final los demás giran. Los átomos no cambian: cambia su orden.', w: 'Desmagnetizar no «borra» los átomos magnéticos: solo los desordena.', fig: dominios },
      { c: 'Ciclo', n: 'Ciclo de histéresis', f: X`\(B_r:\ \text{remanencia} \qquad H_c:\ \text{coercitividad}\)`,
        d: 'Al bajar H a cero, B no vuelve a cero: queda la remanencia Br. Para anular B hay que aplicar −Hc. El ciclo se recorre en sentido antihorario: arriba hacia la izquierda, abajo hacia la derecha.', w: 'Las paredes de los dominios se traban en las imperfecciones: no deshacen el camino.', fig: () => ciclo('acero', { marcas: true, inicial: true }) },
      { c: 'Blandos y duros', n: 'Materiales blandos y duros', f: X`\(H_c < 1\ \text{kA/m} \qquad H_c > 10\ \text{kA/m}\)`,
        d: 'Blandos (acero al silicio, ferrita Mn-Zn): ciclo angosto; se magnetizan y desmagnetizan fácil; van en núcleos. Duros (NdFeB, SmCo, ferrita de bario, alnico): ciclo ancho; retienen la magnetización: son los imanes.', w: 'Los blandos no son imanes: son núcleos.', fig: cicloDoble },
      { c: 'Energía', n: 'Energía del ciclo', f: X`\(w = \oint H\,dB \qquad P = w\,V\,f\)`,
        d: 'El área del ciclo es energía por volumen (J/m³) que se vuelve calor en cada vuelta. A 50 Hz el núcleo da 50 vueltas por segundo.', w: 'Un rectángulo de ancho 2Hc y alto 2Bm tiene área 4·Hc·Bm: sirve para estimar w.', fig: () => ciclo('acero', { area: true }) }
    ],
    [
      { c: 'Foucault', n: 'Corrientes de Foucault', f: X`\(\dfrac{P_F}{V} = \dfrac{\pi^2 f^2 B_m^2\,t^2}{6\,\rho}\)`,
        d: 'El flujo alterno induce tensión dentro del propio núcleo (Faraday) y, como el hierro conduce, circulan corrientes en lazo que lo calientan. Crecen con f², con B² y con el cuadrado del espesor t.', w: 'Vale si t es menor que la profundidad de penetración δ (0,89 mm en este acero a 50 Hz).', fig: () => chapas() },
      { c: 'Laminar', n: 'Láminas aisladas', f: X`\(P_F \propto \dfrac{t^2}{\rho}\)`,
        d: 'El núcleo se arma con láminas delgadas aisladas eléctricamente (barniz u óxido): cada corriente queda encerrada en su lámina. El silicio (≈ 3 %) sube la resistividad y baja la histéresis. Para kHz se usan ferritas, que casi no conducen.', w: 'El flujo sigue a lo largo de las láminas: no se aíslan magnéticamente.', fig: () => chapas({ hl: ['aisl'] }) },
      { c: 'Reluctancia y fuerza', n: 'Reluctancia y fuerza', f: X`\(\mathcal R = \dfrac{l}{\mu_0\mu_r S} \qquad F = \dfrac{B^2 S}{2\mu_0}\ \text{por cara}\)`,
        d: 'Como en un circuito en serie: NI = Φ·(ℛ hierro + ℛ aire). Cada cara de contacto tira con B²S/2μ₀. La reluctancia no gasta energía como una resistencia: la guarda, sobre todo en el aire.', w: 'Una fisura o suciedad es aire en serie: μr = 1 frente a 3000.', fig: () => retenFig({ g: 0, I: 0.2, mu: 3000 }, { hl: ['caras'], F: true }) }
    ],
    [
      { c: '2.º cuadrante', n: 'Dónde trabaja un imán', f: X`\(B = B_r + \mu_0\mu_{rec}H \qquad B = -P_c\,\mu_0 H\)`,
        d: 'Sin bobina, H dentro del imán va contra M (como en el imán en anillo): el imán trabaja con H < 0 y B > 0. La recta del imán y la recta de carga (la fija la geometría, Pc) se cruzan en el punto de trabajo.', w: 'Más entrehierro, menor Pc: el punto baja por la recta.', fig: () => cuadrante({ mat: 'n', T: 20, Pc: 1.05 }, { hl: ['op'] }) },
      { c: '(BH)max', n: 'Producto de energía', f: X`\((BH)_{max} = \dfrac{B_r^2}{4\mu_0\mu_{rec}}\ \ \text{en}\ B = \dfrac{B_r}{2}\)`,
        d: 'B·H en el punto de trabajo mide la energía que el imán entrega al entrehierro por cada m³ de imán. Es máximo a mitad de la recta. Para el mismo trabajo, el volumen del imán va como 1/(BH)max.', w: '1 MGOe = 7,958 kJ/m³ (las hojas de datos usan MGOe).', fig: () => cuadrante({ mat: 'n', T: 20, Pc: 1.05 }, { hl: ['bh'] }) },
      { c: 'Temperatura', n: 'Temperatura y codo', f: X`\(\begin{gathered} B_r(T) = B_r\,(1+\alpha\,\Delta T) \\ H_{cj}(T) = H_{cj}\,(1+\beta\,\Delta T) \end{gathered}\)`,
        d: 'Con ΔT = T − 20 °C. Al calentar, Br baja un poco y se recupera al enfriar. Hcj baja mucho en el NdFeB: si el punto de trabajo pasa el codo (|H| > Hcj), parte del imán se invierte y no vuelve. Los grados H, SH, UH… tienen más Hcj y aguantan más calor.', w: 'En la ferrita es al revés: su Hcj baja con el frío.', fig: () => cuadrante({ mat: 'n', T: 120, Pc: 1.05 }, { ref: true }) },
      { c: 'Familias', n: 'Familias de imanes', f: X`\(\text{NdFeB} > \text{SmCo} > \text{alnico} > \text{ferrita}\)`,
        d: 'Ordenados por (BH)max. NdFeB: hasta ≈ 48 MGOe; 80 a 230 °C según el grado; se corroe y va con níquel-cobre-níquel. SmCo: hasta ≈ 32 MGOe y 300 °C; estable y caro. Alnico: aguanta 550 °C, pero su Hc es baja. Ferrita: ≈ 4 MGOe; barata y no se corroe.', w: 'Elegir un imán es equilibrar energía, temperatura, costo y corrosión.', fig: familias }
    ],
    [
      { c: 'Dos canales', n: 'Conducción por dos canales de espín', f: X`\(R = \dfrac{R_\uparrow\,R_\downarrow}{R_\uparrow + R_\downarrow}\)`,
        d: 'Los electrones con espín ↑ y con espín ↓ conducen como dos resistencias en paralelo. En una capa magnética, el espín igual a su magnetización choca poco (r) y el opuesto choca mucho (R).', w: 'Modelo de Mott. En el ejemplo: r = 1 Ω y R = 3 Ω por capa.', fig: () => valvula({ th: 0, al: 3, I: 1 }) },
      { c: 'Válvula de espín', n: 'Válvula de espín', f: X`\(\text{MR} = \dfrac{R_{AP} - R_P}{R_P}\)`,
        d: 'Capa fija (anclada por un antiferromagnético) + espaciador de cobre (no magnético) + capa libre que gira con el campo de cada bit del disco. Capas paralelas: R baja. Capas opuestas: R alta.', w: 'AMR: 2 a 5 %; GMR: ≈ 10 a 20 % a temperatura ambiente. Desde ≈ 2005 los discos usan TMR (túnel), con más de 100 %.', fig: () => valvula({ th: 180, al: 3, I: 1 }) },
      { c: 'Magnetocalórico', n: 'Efecto magnetocalórico', f: X`\(\Delta T_{ad} \approx 3\ \text{K por tesla (gadolinio)}\)`,
        d: 'Magnetizar ordena los espines (baja su entropía) y, si el material está aislado, se calienta; desmagnetizar lo enfría. El ciclo: magnetizar, botar calor, desmagnetizar y absorber calor del interior.', w: 'El Gd tiene TC ≈ 20 °C: ahí el efecto es máximo. Una pasada da pocos grados; un regenerador las suma.', fig: () => cicloMC({ B: 1, e: 1 }) }
    ],
    [
      { c: 'Fuerza', n: 'Fuerza sobre un diamagnético', f: X`\(F_z = \dfrac{\chi V}{\mu_0}\,B\,\dfrac{dB}{dz}\)`,
        d: 'Con χ < 0, la fuerza va hacia donde B es menor. Encima de un imán, B baja con la altura: el cuerpo es empujado hacia arriba. No basta un campo intenso: tiene que cambiar rápido con la altura.', w: 'El diamagnético busca un mínimo de B y ahí queda estable, cosa que un imán solo no logra (teorema de Earnshaw).', fig: () => levita({ mat: 'agua', B: 16, L: 180 }) },
      { c: 'Condición', n: 'Condición para flotar', f: X`\(B\left|\dfrac{dB}{dz}\right| \ge \dfrac{\mu_0\,\rho\,g}{|\chi|}\)`,
        d: 'Fuerza igual al peso: el volumen se cancela y solo cuentan la densidad ρ y χ. Es la condición del informe escrita con B·dB/dz (porque ∇B² = 2B·dB/dz).', w: 'Un imán de NdFeB da ≈ 100 T²/m cerca de su cara (0,5 T que caen en ≈ 2,5 mm).', fig: () => levita({ mat: 'grafito', B: 0.5, L: 2.5 }) }
    ]
  ];
  MM.LEYES = LEYES;

  // ============================================================
  // ENCUESTAS (la correcta primero)
  // ============================================================
  const ENC = {
    'A-E1': { pred: true, q: '¿Qué materiales responden a un campo magnético?', o: ['Todos, aunque casi todos muy poco', 'Solo el hierro, el níquel y el cobalto', 'Solo los metales', 'Solo los que tienen hierro'], por: 'Lo vemos al final del cálculo.' },
    'A-S1': { q: 'Con H = 100 A/m, en el vacío B = 0,1257 mT. Si ese espacio se llena de cobre (χ = −1,0·10⁻⁵), ¿cuánto cambia B?', o: ['Baja 0,001 %', 'Baja 10 %', 'Baja a la mitad', 'Sube 0,001 %'],
      por: X`\(B = \mu_0(1+\chi)H\): el factor es \(1 - 0{,}00001\), una parte en cien mil. Por eso en un circuito magnético el cobre, el aluminio y el aire se toman con \(\mu_r = 1\).` },
    'A-C2': { q: 'Un clavo de hierro cuelga de un imán. Lo calientas al rojo (≈ 800 °C). ¿Qué pasa?', o: ['Se suelta; al enfriarse vuelve a pegarse', 'Se pega más fuerte', 'Se suelta y ya no vuelve a pegarse nunca', 'Se convierte en un imán permanente'],
      por: 'Sobre 770 °C (temperatura de Curie del hierro) la agitación térmica rompe el orden de los dominios y el hierro queda paramagnético. Los átomos siguen ahí: al enfriarse, el orden vuelve y se pega otra vez.' },
    'B-E1': { pred: true, q: 'Llevas el núcleo hasta B = 1,2 T y luego bajas la corriente a cero. ¿Qué B queda?', o: ['Queda algo de B: no vuelve a cero', 'B vuelve exactamente a cero', 'Queda el mismo 1,2 T', 'B se invierte'], por: 'Lo vemos al final del cálculo.' },
    'B-S2': { q: 'Con H = 318 A/m se mide B = 1,20 T. ¿Cuánto vale μr?', o: ['≈ 3000', '≈ 0,0038', X`\(\approx 9{,}5\cdot 10^{5}\)`, '≈ 1,2'],
      por: X`\(\mu_r = \dfrac{B}{\mu_0 H} = \dfrac{1{,}20}{4\cdot 10^{-4}} = 3000\). 0,0038 es B/H sin \(\mu_0\); \(9{,}5\cdot 10^5\) A/m es M.` },
    'B-C2': { q: 'Para el núcleo de un transformador, ¿qué ciclo de histéresis conviene?', o: ['Angosto (Hc pequeña)', 'Ancho, para que no se desmagnetice', 'El de mayor área, para guardar más energía', 'Da igual: solo importa la saturación'],
      por: 'El área del ciclo es energía que se vuelve calor en cada vuelta (50 por segundo). Un material blando (Hc < 1 kA/m) tiene un ciclo angosto y pierde poco.' },
    'B-S3': { q: 'Estima la pérdida por histéresis de un núcleo de 0,010 m³ a 50 Hz (Hc = 40 A/m; Bm = 1,2 T; área ≈ 4·Hc·Bm).', o: ['≈ 96 W', '≈ 1,9 W', '≈ 48 W', '≈ 9600 W'],
      por: X`\(w \approx 4\cdot 40\cdot 1{,}2 = 192\ \text{J/m}^3\) por vuelta; \(P = w\,V\,f = 192\cdot 0{,}010\cdot 50 = 96\ \text{W}\). 1,9 W olvida f; 9600 W olvida V; 48 W usa \(2H_cB_m\).` },
    'N-C1': { q: 'Las láminas de un núcleo van aisladas entre sí. ¿Aisladas de qué forma?', o: ['Eléctricamente: así se cortan las corrientes de Foucault', 'Magnéticamente: para que el flujo no pase de una lámina a otra', 'Térmicamente: para que no se calienten', 'No se aíslan: se sueldan para que conduzcan mejor'],
      por: 'El barniz o el óxido corta el camino de la corriente inducida, que queda encerrada en cada lámina delgada. El flujo sigue a lo largo de las láminas: magnéticamente el núcleo sigue siendo un buen camino.' },
    'N-S1': { q: 'Con láminas de 0,35 mm, la pérdida por Foucault es 15 W. Con láminas de 0,70 mm, ¿cuánto es?', o: ['≈ 62 W (4 veces)', '≈ 31 W (el doble)', '≈ 15 W (igual)', '≈ 8 W (la mitad)'],
      por: X`\(P_F \propto t^2\): con el doble de espesor, 4 veces más. Cada lámina abarca más flujo, su tensión inducida es mayor y su lazo de corriente también.` },
    'N-S2': { q: 'En un núcleo con μr = 3000, ¿a cuánto hierro equivale una capa de aire de 0,10 mm?', o: ['30 cm', '0,10 mm', '3 cm', '3 m'],
      por: X`Con la misma sección, \(\mathcal R \propto l/\mu_r\): \(0{,}10\ \text{mm}\cdot 3000 = 300\ \text{mm} = 30\ \text{cm}\). El núcleo entero mide 40 cm.` },
    'N-S3': { q: 'Con esa suciedad, ¿qué parte de la fuerza de 283 N queda?', o: ['≈ 33 % (92 N)', '≈ 57 % (161 N)', '≈ 75 % (212 N)', 'Casi toda: 0,1 mm no es nada'],
      por: X`El flujo baja a \(\dfrac{2{,}65}{2{,}65 + 1{,}99} = 0{,}57\) y la fuerza va con \(B^2\): \(0{,}57^2 = 0{,}33\). 57 % olvida el cuadrado.` },
    'I-E1': { pred: true, q: 'Un motor con imanes de NdFeB trabajó a 120 °C. Cuando se enfría, ¿recupera toda su fuerza?', o: ['No siempre: puede perder imán para siempre', 'Sí: el efecto del calor siempre es reversible', 'Sí, porque no llegó a 770 °C', 'Los imanes nunca pierden fuerza'], por: 'Lo vemos al final del cálculo.' },
    'I-S2': { q: X`NdFeB con \(B_r = 1{,}30\) T y \(\mu_{rec} = 1{,}05\). ¿Cuánto vale \((BH)_{max} = B_r^2/(4\mu_0\mu_{rec})\)?`, o: ['≈ 320 kJ/m³', '≈ 640 kJ/m³', '≈ 1280 kJ/m³', '≈ 1345 kJ/m³'],
      por: X`\(\dfrac{1{,}30^2}{4\cdot 4\pi\cdot 10^{-7}\cdot 1{,}05} = 3{,}20\cdot 10^5\ \text{J/m}^3\): 320 kJ/m³ = 40 MGOe. 1280 olvida el 4; 1345 es \(B_r^2/\mu_0\).` },
    'I-S3': { q: 'A 120 °C, ¿cuánto vale Hcj de ese imán? (1000 kA/m a 20 °C; β = −0,6 %/°C)', o: ['400 kA/m', '940 kA/m', '1600 kA/m', '0'],
      por: X`\(H_{cj} = 1000\,[1 - 0{,}006\cdot(120-20)] = 400\ \text{kA/m}\). 940 sale con 0,06 % en vez de 0,6 %.` },
    'I-C2': { q: 'Un motor compacto de avión trabaja a 250 °C. ¿Qué imán eliges?', o: ['Samario-cobalto', 'NdFeB grado N (el más fuerte)', 'Ferrita (la más barata)', 'Alnico (aguanta más calor)'],
      por: 'El SmCo trabaja hasta unos 300 °C y su Hcj baja poco con la temperatura; además da mucha energía por volumen. El NdFeB grado N pierde imán mucho antes; la ferrita pide unas 11 veces más volumen; el alnico aguanta el calor, pero su Hc es baja y en un motor compacto se desmagnetiza.' },
    'G-C1': { q: 'En una válvula de espín, ¿cuándo es baja la resistencia?', o: ['Con las dos capas magnetizadas en el mismo sentido', 'Con las capas en sentidos opuestos', 'Cuando el espaciador es de hierro', 'Nunca cambia: R depende solo de ρ, l y S'],
      por: 'Con las capas paralelas, los electrones con espín a favor cruzan las dos capas casi sin chocar: ese canal hace de atajo. Con las capas opuestas, los dos canales chocan en alguna capa.' },
    'G-S2': { q: 'Con r = 1 Ω y R = 3 Ω por capa, calcula la resistencia con las capas paralelas.', o: ['1,5 Ω', '2 Ω', '4 Ω', '8 Ω'],
      por: X`Canal a favor: \(r + r = 2\ \Omega\); canal en contra: \(R + R = 6\ \Omega\); en paralelo: \(\dfrac{2\cdot 6}{2+6} = 1{,}5\ \Omega\). 2 Ω es el caso de capas opuestas; 8 Ω suma todo en serie.` },
    'G-C3': { q: 'En un refrigerador magnético, «magnetizar el gadolinio» se parece, en un refrigerador de gas, a…', o: ['Comprimir el gas: se calienta y luego bota calor', 'Expandir el gas: se enfría', 'Prender el ventilador', 'Abrir la puerta'],
      por: 'Al magnetizar, los espines se ordenan (baja su entropía) y, si el material está aislado, la red se calienta, como un gas comprimido. Al desmagnetizar pasa lo contrario: se enfría, como un gas que se expande.' },
    'L-E1': { pred: true, q: '¿Se puede hacer flotar una rana viva con un campo magnético?', o: ['Sí, con un campo muy intenso (≈ 16 T)', 'No: no tiene hierro', 'Sí, con un imán de NdFeB de tienda', 'No: el campo la mataría'], por: 'Lo vemos al final del cálculo.' },
    'L-S1': { q: X`¿Qué valor de \(B\,dB/dz\) necesita el agua para flotar? (\(\chi = -9{,}0\cdot 10^{-6}\); \(\rho = 1000\) kg/m³)`, o: ['≈ 1370 T²/m', '≈ 140 T²/m', '≈ 0,012 T²/m', X`\(\approx 1{,}1\cdot 10^{-7}\) T²/m`],
      por: X`\(\dfrac{\mu_0\rho g}{|\chi|} = \dfrac{4\pi\cdot 10^{-7}\cdot 1000\cdot 9{,}81}{9{,}0\cdot 10^{-6}} = 1370\ \text{T}^2/\text{m}\). 140 olvida g; 0,012 olvida χ; \(1{,}1\cdot 10^{-7}\) multiplica por χ.` },
    'L-S2': { q: X`Un imán de NdFeB da \(B\,dB/dz \approx 100\) T²/m cerca de su cara. ¿Cuál de estos flota encima?`,
      o: [X`Grafito pirolítico (\(\chi = -4\cdot 10^{-4}\); \(\rho = 2200\))`, X`Bismuto (\(\chi = -1{,}7\cdot 10^{-4}\); \(\rho = 9780\))`, X`Agua (\(\chi = -9\cdot 10^{-6}\); \(\rho = 1000\))`, X`Cobre (\(\chi = -1\cdot 10^{-5}\); \(\rho = 8960\))`],
      por: 'Lo que manda es |χ|/ρ. El grafito necesita 68 T²/m; el bismuto, 726; el agua, 1370; el cobre, 11 000. Solo el grafito queda por debajo de 100.' },
    'Z1': { q: '¿Qué tienen en común el clavo al rojo que se suelta, el NdFeB que se debilita en caliente y el gadolinio que se enfría?', o: ['La agitación térmica desordena los espines', 'La corrosión del material', 'La reluctancia del aire', 'La ley de Lenz'],
      por: 'El orden magnético (dominios, imanes, espines del gadolinio) compite con la agitación térmica. Cerca de la temperatura crítica el calor gana: el hierro deja de ser ferromagnético, el imán pierde coercitividad y el Gd cambia mucho de entropía, que es lo que se aprovecha para enfriar.' }
  };

  // ============================================================
  // PROBLEMAS PASO A PASO
  // ============================================================
  const SOL = [
    [
      { t: 'El mismo H en el vacío y en cobre', e: [X`B_0 = \mu_0 H = 4\pi\cdot 10^{-7}\cdot 100 = 0{,}1257\ \text{mT}`, X`B_{Cu} = \mu_0(1+\chi)H`, X`B_{Cu} = 0{,}1257\,(1 - 0{,}00001)\ \text{mT}`], w: 'El cobre cambia B en 0,001 %: para un circuito magnético, μr = 1 (igual que el aluminio y el aire).', fig: () => muestra({ mat: 'cu', H: 100, T: 300 }) },
      { t: 'El mismo H en hierro', e: [X`B_{Fe} = \mu_0\mu_r H = 4\pi\cdot 10^{-7}\cdot 3000\cdot 100`, X`B_{Fe} = 0{,}377\ \text{T} = 3000\,B_0`], w: 'Solo los ferro y ferrimagnéticos cambian B de forma útil: por eso los núcleos son de hierro o de ferrita.', fig: () => muestra(P0, { nota: '0,377 T' }) }
    ],
    [
      { t: 'H y B en el anillo', e: [X`H = \dfrac{N_1 I}{\pi D} = \dfrac{200\cdot 0{,}50}{\pi\cdot 0{,}10} = 318\ \text{A/m}`, X`B = \dfrac{\lambda}{N_2 S} = \dfrac{0{,}012}{100\cdot 1{,}0\cdot 10^{-4}} = 1{,}20\ \text{T}`], w: 'Sin entrehierro, H es el que pone la bobina. Esa bobina sola, en el aire, daría μ₀H = 0,40 mT.', fig: () => rowland({ hl: ['H', 'L'] }) },
      { t: 'Permeabilidad y magnetización', e: [X`\mu_r = \dfrac{B}{\mu_0 H} = \dfrac{1{,}20}{4\cdot 10^{-4}} = 3000`, X`M = \dfrac{B}{\mu_0} - H = 9{,}55\cdot 10^{5}\ \text{A/m}`], w: 'El material pone el 99,97 % de B; la bobina, el 0,03 %.', fig: () => rowland({ hl: ['B'], nota: '1,20 T' }) },
      { t: 'Lo que dice el ciclo medido', e: [X`B_m = 1{,}2\ \text{T} \qquad B_r = 1{,}0\ \text{T}`, X`H_c = 40\ \text{A/m} < 1\ \text{kA/m}\ \Rightarrow\ \text{blando}`], w: 'Al cortar la corriente queda Br = 1,0 T; con −40 A/m el núcleo vuelve a B = 0.', fig: () => ciclo('acero', { marcas: true, valores: true }) },
      { t: 'Pérdida por histéresis', e: [X`w \approx 4\,H_c\,B_m = 4\cdot 40\cdot 1{,}2 = 192\ \text{J/m}^3`, X`P = w\,V\,f = 192\cdot 0{,}010\cdot 50 = 96\ \text{W}`], w: 'El área de este ciclo, calculada punto por punto, da 191 J/m³: la estimación es buena.', fig: () => ciclo('acero', { area: true }) }
    ],
    [
      { t: 'Foucault con láminas de 0,35 mm', e: [X`\dfrac{P_F}{V} = \dfrac{\pi^2\cdot 50^2\cdot 1{,}2^2\cdot(0{,}35\cdot 10^{-3})^2}{6\cdot 4{,}7\cdot 10^{-7}}`, X`\dfrac{P_F}{V} = 1540\ \text{W/m}^3 \quad\Rightarrow\quad P_F = 15\ \text{W}`], w: 'Sumada a la histéresis (96 W), el núcleo pierde unos 111 W.', fig: () => perdFig({ mat: 'acero', t: 0.35, f: 50, B: 1.2 }) },
      { t: 'Láminas del doble de espesor', e: [X`t = 0{,}70\ \text{mm}:\quad P_F = 15\cdot 2^2 = 62\ \text{W}`], w: 'Por eso las láminas son tan delgadas: de 0,23 a 0,50 mm a 50 Hz.', fig: () => perdFig({ mat: 'acero', t: 0.7, f: 50, B: 1.2 }) },
      { t: 'Retenedor limpio', e: [X`\mathcal R_{Fe} = \dfrac{0{,}40}{4\pi\cdot 10^{-7}\cdot 3000\cdot 4\cdot 10^{-4}}`, X`\mathcal R_{Fe} = 2{,}65\cdot 10^{5}\ \text{A}\cdot\text{v/Wb}`, X`B = \dfrac{NI}{\mathcal R_{Fe}\,S} = 0{,}94\ \text{T}`, X`F = 2\cdot\dfrac{B^2 S}{2\mu_0} = 283\ \text{N}`], w: 'Dos caras de contacto: la fuerza total es B²S/μ₀.', fig: () => retenFig({ g: 0, I: 0.2, mu: 3000 }, { hl: ['flujo', 'caras'], F: true }) },
      { t: 'La suciedad es aire', e: [X`\mathcal R_{aire} = \dfrac{0{,}10\cdot 10^{-3}}{4\pi\cdot 10^{-7}\cdot 4\cdot 10^{-4}}`, X`\mathcal R_{aire} = 1{,}99\cdot 10^{5}\ \text{A}\cdot\text{v/Wb}`, X`\mathcal R_{aire}/\mathcal R_{Fe} = 0{,}75`], w: 'Una décima de milímetro de aire «pesa» como 30 cm de hierro.', fig: () => retenFig({ g: 0.1, I: 0.2, mu: 3000 }, { hl: ['gap'] }) },
      { t: 'Fuerza con suciedad', e: [X`B = \dfrac{100}{(2{,}65 + 1{,}99)\cdot 10^5\cdot 4\cdot 10^{-4}} = 0{,}54\ \text{T}`, X`F = \dfrac{0{,}54^2\cdot 4\cdot 10^{-4}}{4\pi\cdot 10^{-7}} = 92\ \text{N}\ \ (33\ \%)`], w: 'El 43 % de la NI se gasta en 0,1 mm de aire. Solución: limpiar y rectificar las caras.', fig: () => retenFig({ g: 0.1, I: 0.2, mu: 3000 }, { hl: ['gap'], F: true }) }
    ],
    [
      { t: '(BH)max del NdFeB y de la ferrita', e: [X`(BH)_{max} = \dfrac{1{,}30^2}{4\cdot 4\pi\cdot 10^{-7}\cdot 1{,}05} = 320\ \tfrac{\text{kJ}}{\text{m}^3}`, X`\text{Ferrita: } \dfrac{0{,}40^2}{4\cdot 4\pi\cdot 10^{-7}\cdot 1{,}10} = 29\ \tfrac{\text{kJ}}{\text{m}^3}`, X`320/29 = 11`], w: 'Son 40 MGOe. Para el mismo trabajo, la ferrita pide unas 11 veces más volumen. El mejor NdFeB (48 MGOe) llega a 382 kJ/m³.', fig: () => cuadrante({ mat: 'n', T: 20, Pc: 1.05 }, { hl: ['bh'] }) },
      { t: 'Punto de trabajo a 20 °C', e: [X`H = -\dfrac{B_r}{\mu_0(\mu_{rec} + P_c)}`, X`H = -\dfrac{1{,}30}{4\pi\cdot 10^{-7}\cdot 2{,}10} = -493\ \text{kA/m}`, X`B = 0{,}65\ \text{T} = B_r/2`], w: 'Con Pc = 1,05 el imán trabaja justo en su (BH)max; |H| = 493 kA/m está lejos de Hcj = 1000 kA/m.', fig: () => cuadrante({ mat: 'n', T: 20, Pc: 1.05 }, { hl: ['op'] }) },
      { t: 'El mismo imán a 120 °C', e: [X`B_r = 1{,}30\,(1 - 0{,}0012\cdot 100) = 1{,}14\ \text{T}`, X`H_{cj} = 1000\,(1 - 0{,}6) = 400\ \text{kA/m}`, X`H = -\dfrac{1{,}14}{4\pi\cdot 10^{-7}\cdot 2{,}10} = -434\ \text{kA/m}`], w: '|H| = 434 kA/m > Hcj = 400 kA/m: pasó el codo y pierde imán para siempre. El grado SH (Hcj = 720 kA/m a 120 °C) sí aguanta.', fig: () => cuadrante({ mat: 'n', T: 120, Pc: 1.05 }, { ref: true }) }
    ],
    [
      { t: 'Capas paralelas', e: [X`R_\uparrow = r + r = 2\ \Omega`, X`R_\downarrow = R + R = 6\ \Omega`, X`R_P = \dfrac{2\cdot 6}{2 + 6} = 1{,}5\ \Omega`], w: 'El canal ↑ hace de atajo: lleva la mayor parte de la corriente.', fig: () => valvula({ th: 0, al: 3, I: 1 }) },
      { t: 'Capas opuestas', e: [X`R_\uparrow = R_\downarrow = r + R = 4\ \Omega`, X`R_{AP} = \dfrac{4\cdot 4}{4 + 4} = 2\ \Omega`], w: 'Ahora los dos canales chocan en alguna capa.', fig: () => valvula({ th: 180, al: 3, I: 1 }) },
      { t: 'La señal del cabezal', e: [X`\text{MR} = \dfrac{2 - 1{,}5}{1{,}5} = 33\ \%`, X`\Delta V = \Delta R\cdot I = 0{,}5\ \Omega\cdot 1\ \text{mA} = 0{,}5\ \text{mV}`], w: 'Cada vez que la capa libre gira con un bit, la tensión cambia 0,5 mV: así se lee el disco.', fig: () => valvula({ th: 180, al: 3, I: 1 }) }
    ],
    [
      { t: 'El agua (y la rana)', e: [X`\dfrac{\mu_0\rho g}{|\chi|} = \dfrac{4\pi\cdot 10^{-7}\cdot 1000\cdot 9{,}81}{9{,}0\cdot 10^{-6}} = 1370\ \tfrac{\text{T}^2}{\text{m}}`, X`\text{Con } B = 16\ \text{T}:\ \ \dfrac{dB}{dz} = \dfrac{1370}{16} = 86\ \text{T/m}`], w: 'El campo tiene que bajar 8,6 T en 10 cm: solo lo logra un electroimán de laboratorio (Nimega, 1997).', fig: () => levita({ mat: 'agua', B: 16, L: 180 }) },
      { t: 'Sobre un imán de NdFeB', e: [X`B\,\dfrac{dB}{dz} \approx \dfrac{0{,}5^2}{0{,}0025} = 100\ \tfrac{\text{T}^2}{\text{m}}`, X`\text{grafito } 68;\;\text{bismuto } 726`, X`\text{agua } 1370;\;\text{cobre } 11\,000`], w: 'Solo el grafito pirolítico flota sobre imanes comunes (es el juguete de escritorio).', fig: () => levita({ mat: 'grafito', B: 0.5, L: 2.5 }) }
    ]
  ];
  MM.SOL = SOL;

  // ============================================================
  // PANELES «¿y si…?»
  // ============================================================
  const PANEL = {
    materia: { def: { mat: 'fe', H: 100, T: 300 }, dib: (P) => muestra(P),
      ctl: [{ k: 'mat', l: 'Material', sel: [['cu', 'Cobre'], ['sal', 'Sal'], ['fe', 'Hierro'], ['nio', 'NiO'], ['fer', 'Ferrita']] },
        { k: 'H', l: 'Campo H', u: 'A/m', min: 0, max: 200, st: 5, d: 0 }, { k: 'T', l: 'Temperatura', u: 'K', min: 50, max: 1300, st: 10, d: 0 }],
      lect(P) {
        const q = materia(P), B = q.B, Bt = Math.abs(B) >= 0.01 ? sig(B, 3) + ' T' : sig(B * 1000, 4) + ' mT';
        return `<div class="badge ok">B = ${P.H ? Bt : '0'}</div>
          <div class="c"><small>Susceptibilidad χ</small><b>${sci(q.chi, 2)}</b></div>
          <div class="c"><small>μr</small><b>${q.mur > 10 ? f(q.mur, 0) : f(q.mur, 5)}</b></div>
          <div class="c"><small>B en el vacío</small><b>${sig(q.B0 * 1000, 4)} mT</b></div>
          <div class="c"><small>B comparado con el vacío</small><b>${q.mur > 10 ? f(q.mur, 0) + ' veces' : (q.chi >= 0 ? '+' : '−') + sig(Math.abs(q.chi) * 100, 1) + ' %'}</b></div>
          <div class="c" style="grid-column:1/3"><small>Estado</small><b>${q.orden}</b></div>`;
      } },
    lazo: { def: { mat: 'acero', amp: 100, fi: 25 }, dib: (P) => ciclo(P.mat, { amp: P.amp / 100, fi: P.fi / 100, marcas: true }),
      ctl: [{ k: 'mat', l: 'Material', sel: [['acero', 'Acero Si'], ['ferb', 'Ferrita Mn-Zn'], ['alnico', 'Alnico'], ['ferd', 'Ferrita Ba'], ['ndfeb', 'NdFeB']] },
        { k: 'amp', l: 'Amplitud de H', u: '%', min: 5, max: 100, st: 1, d: 0 }, { k: 'fi', l: 'Recorrido', u: '%', min: 0, max: 100, st: 1, d: 0 }],
      lect(P) {
        const q = lazo(P.mat, P.amp / 100), L = q.L, p = puntoLazo(q, P.fi / 100), u = L.k === 1 ? 'A/m' : 'kA/m';
        return `<div class="badge ${q.duro ? 'no' : 'ok'}">${q.duro ? 'Duro: sirve de imán' : 'Blando: sirve de núcleo'}</div>
          <div class="c"><small>Punto: H</small><b>${f(p.H / L.k, 0)} ${u}</b></div>
          <div class="c"><small>Punto: B</small><b>${f(p.B, 2)} T</b></div>
          <div class="c"><small>Remanencia Br</small><b>${f(q.Br, 2)} T</b></div>
          <div class="c"><small>Coercitividad Hc</small><b>${f(q.Hc / L.k, 0)} ${u}</b></div>
          <div class="c"><small>Área del ciclo</small><b>${sci(q.area, 2)} J/m³</b></div>
          <div class="c${q.duro ? ' alerta' : ''}"><small>Pérdida (0,010 m³; 50 Hz)</small><b>${sci(q.P, 2)} W</b></div>`;
      } },
    perd: { def: { mat: 'acero', t: 0.35, f: 50, B: 1.2 }, dib: (P) => perdFig(P),
      ctl: [{ k: 'mat', l: 'Material', sel: [['acero', 'Acero Si'], ['fe', 'Hierro sin Si'], ['fer', 'Ferrita']] },
        { k: 't', l: 'Lámina', u: 'mm', min: 0.1, max: 1, st: 0.05, d: 2 }, { k: 'f', l: 'Frecuencia', u: 'Hz', min: 50, max: 1000, st: 10, d: 0 }, { k: 'B', l: 'Bm', u: 'T', min: 0.1, max: 1.6, st: 0.05, d: 2 }],
      lect(P) {
        const q = perdidas(P);
        return `<div class="badge ${q.sat ? 'no' : 'ok'}">${q.sat ? '⚠ Satura: Bm muy alto' : 'Total ≈ ' + sig(q.tot, 3) + ' W'}</div>
          <div class="c"><small>Histéresis (4·Hc·Bm·V·f)</small><b>${sig(q.Ph, 3)} W</b></div>
          <div class="c"><small>Foucault</small><b>${q.PF < 0.01 ? '≈ 0' : sig(q.PF, 3)} W</b></div>
          <div class="c"><small>Resistividad</small><b>${sci(q.m.rho, 1)} Ω·m</b></div>
          <div class="c${q.valida ? '' : ' alerta'}"><small>Penetración δ</small><b>${P.mat === 'fer' ? '> 1 m' : f(q.del * 1000, 2) + ' mm'}</b></div>
          ${q.valida ? '' : '<div class="alert">La lámina es más gruesa que δ: la fórmula ya no vale (efecto pelicular). Hay que usar láminas más delgadas.</div>'}
          ${q.sat ? `<div class="alert">${esc(q.m.n)} satura cerca de ${f(q.m.Bmax, 2)} T.</div>` : ''}`;
      } },
    reten: { def: { g: 0, I: 0.2, mu: 3000 }, dib: (P) => retenFig(P, { hl: P.g > 0 ? ['gap'] : [], F: true }),
      ctl: [{ k: 'g', l: 'Suciedad', u: 'mm', min: 0, max: 0.5, st: 0.01, d: 2 }, { k: 'I', l: 'Corriente I', u: 'A', min: 0, max: 0.6, st: 0.01, d: 2 }, { k: 'mu', l: 'μr del núcleo', u: '', min: 500, max: 6000, st: 100, d: 0 }],
      lect(P) {
        const q = reten(P);
        return `<div class="badge ${q.sat ? 'no' : 'ok'}">${q.sat ? '⚠ El núcleo se satura' : 'F = ' + f(q.F, 0) + ' N'}</div>
          <div class="c${q.sat ? ' alerta' : ''}"><small>B en el núcleo</small><b>${f(q.B, 2)} T</b></div>
          <div class="c"><small>NI que se gasta en el aire</small><b>${f(q.aire, 0)} %</b></div>
          <div class="c"><small>ℛ del hierro</small><b>${sci(q.RFe, 2)}</b></div>
          <div class="c"><small>ℛ del aire</small><b>${P.g ? sci(q.Rg, 2) : '0'}</b></div>
          <div class="c" style="grid-column:1/3"><small>El aire equivale a</small><b>${P.g ? f(q.eq, 0) + ' cm de hierro' : 'nada: caras limpias'}</b></div>
          ${q.sat ? '<div class="alert">⚠ B &gt; 1,6 T: el hierro real se satura y este modelo ya no vale.</div>' : ''}`;
      } },
    iman: { def: { mat: 'n', T: 20, Pc: 1.05 }, dib: (P) => cuadrante(P, { ref: true, hl: ['op'] }),
      ctl: [{ k: 'mat', l: 'Imán', sel: [['n', 'NdFeB N'], ['sh', 'NdFeB SH'], ['smco', 'SmCo'], ['fer', 'Ferrita']] },
        { k: 'T', l: 'Temperatura', u: '°C', min: -40, max: 250, st: 5, d: 0 }, { k: 'Pc', l: 'Recta de carga Pc', u: '', min: 0.2, max: 4, st: 0.05, d: 2 }],
      lect(P) {
        const q = iman(P);
        return `<div class="badge ${q.pierde ? 'no' : 'ok'}">${q.pierde ? '⚠ Pierde imán para siempre' : 'Trabaja bien (reversible)'}</div>
          <div class="c"><small>Br a esta temperatura</small><b>${f(q.Br, 2)} T</b></div>
          <div class="c${q.pierde ? ' alerta' : ''}"><small>Hcj a esta temperatura</small><b>${f(q.Hcj / 1000, 0)} kA/m</b></div>
          <div class="c"><small>H de trabajo</small><b>${f(q.H / 1000, 0)} kA/m</b></div>
          <div class="c"><small>B de trabajo</small><b>${f(q.B, 2)} T</b></div>
          <div class="c"><small>B·H en el punto</small><b>${f(q.BH / 1000, 0)} kJ/m³</b></div>
          <div class="c"><small>(BH)max</small><b>${f(q.BHmax / 1000, 0)} kJ/m³</b></div>
          ${q.caliente ? `<div class="alert">Pasa su temperatura máxima de trabajo (≈ ${q.m.Tmax} °C).</div>` : ''}`;
      } },
    gmr: { def: { th: 0, al: 3, I: 1 }, dib: (P) => valvula(P),
      ctl: [{ k: 'th', l: 'Capa libre θ', u: '°', min: 0, max: 180, st: 5, d: 0 }, { k: 'al', l: 'R/r', u: '', min: 1, max: 10, st: 0.1, d: 1 }, { k: 'I', l: 'Corriente', u: 'mA', min: 0, max: 5, st: 0.1, d: 1 }],
      lect(P) {
        const q = gmr(P);
        return `<div class="badge ok">R = ${sig(q.Rt, 3)} Ω</div>
          <div class="c"><small>R con capas paralelas</small><b>${sig(q.RP, 3)} Ω</b></div>
          <div class="c"><small>R con capas opuestas</small><b>${sig(q.RAP, 3)} Ω</b></div>
          <div class="c"><small>Magnetorresistencia</small><b>${f(q.MR, 0)} %</b></div>
          <div class="c"><small>Tensión ahora</small><b>${sig(q.V, 3)} mV</b></div>
          <div class="c" style="grid-column:1/3"><small>Señal de un bit (cambio de V)</small><b>${sig(q.dV, 3)} mV</b></div>`;
      } },
    mc: { def: { B: 1, e: 1 }, dib: (P) => cicloMC(P),
      ctl: [{ k: 'e', l: 'Etapa del ciclo', sel: [[1, '1 Magnetizar'], [2, '2 Botar calor'], [3, '3 Desmagnetizar'], [4, '4 Absorber']] },
        { k: 'B', l: 'Campo del imán', u: 'T', min: 0, max: 2, st: 0.1, d: 1 }],
      lect(P) {
        const q = mc(P), T = q.T[(+P.e || 1) - 1];
        return `<div class="badge ok">Gd: ${sig(T, 3)} °C</div>
          <div class="c"><small>Salto por pasada</small><b>${sig(q.dT, 2)} K</b></div>
          <div class="c"><small>Ambiente</small><b>20 °C</b></div>
          <div class="c"><small>Gd magnetizado</small><b>${sig(q.T[0], 3)} °C</b></div>
          <div class="c"><small>Gd desmagnetizado</small><b>${sig(q.T[2], 3)} °C</b></div>
          <div class="alert" style="color:var(--texto2)">Un refrigerador necesita ≈ 25 K de diferencia: un regenerador suma muchas pasadas.</div>`;
      } },
    lev: { def: { mat: 'agua', B: 0.5, L: 2.5 }, dib: (P) => levita(P),
      ctl: [{ k: 'mat', l: 'Material', sel: [['agua', 'Agua'], ['grafito', 'Grafito pir.'], ['bi', 'Bismuto'], ['cu', 'Cobre'], ['sc', 'Supercond.']] },
        { k: 'B', l: 'B del imán', u: 'T', min: 0, max: 20, st: 0.1, d: 1 }, { k: 'L', l: 'B cae en', u: 'mm', min: 1, max: 200, st: 0.5, d: 1 }],
      lect(P) {
        const q = lev(P);
        return `<div class="badge ${q.flota ? 'ok' : 'no'}">${q.flota ? 'Flota' : 'No flota'}</div>
          <div class="c"><small>Necesita B·dB/dz</small><b>${sci(q.need, 2)} T²/m</b></div>
          <div class="c"><small>Hay ≈ B²/L</small><b>${sci(q.disp, 2)} T²/m</b></div>
          <div class="c"><small>χ</small><b>${sci(q.m.chi, 2)}</b></div>
          <div class="c"><small>ρ</small><b>${f(q.m.rho, 0)} kg/m³</b></div>
          <div class="c" style="grid-column:1/3"><small>Fuerza / peso</small><b>${q.rel >= 100 ? 'más de 100' : sig(q.rel, 2)}</b></div>`;
      } }
  };
  MM.PANEL = PANEL;

  // ============================================================
  // PANTALLAS
  // ============================================================
  MM.ETAPAS = ['Materia y campo', 'Histéresis', 'Núcleos', 'Imanes', 'Sensores y frío', 'Levitación'];
  const PREF = ['Materia', 'Rowland', 'Núcleo', 'Imán', 'Válvula', 'Levitación'];
  const enc = (id, et) => Object.assign({ id, et, tipo: 'enc', c: 0, t: 'Encuesta ' + id }, ENC[id]);
  const ley = (id, et, k) => ({ id, et, tipo: 'ley', k, t: 'Ideas: ' + LEYES[et][k].n.charAt(0).toLowerCase() + LEYES[et][k].n.slice(1) });
  const sol = (id, et, k) => ({ id, et, tipo: 'sol', k });
  const panel = (id, et, D, t, nota, P) => ({ id, et, tipo: 'panel', D, t, nota, P: P || {} });
  const chk = (id, et, D, t, P, nota) => ({ id, et, tipo: 'panel', D, t: 'Compruébalo: ' + t, P, nota });

  MM.PASOS = [
    { id: 'a-enun', et: 0, tipo: 'info', t: 'La materia frente a un campo magnético',
      txt: 'Toda la materia tiene electrones que giran en órbitas y tienen espín. ¿Qué le pasa cuando la ponemos en un campo H? Hay cinco respuestas posibles, y solo dos sirven para hacer núcleos e imanes.',
      chips: [['diamagnético', 'Cu; agua'], ['paramagnético', 'Al; O₂'], ['ferromagnético', 'Fe; Ni; Co'], ['ferrimagnético', 'ferritas']], nota: 'Basado en el informe «Materiales magnéticos», con datos de tablas y hojas de datos.', fig: () => muestra(P0) },
    enc('A-E1', 0),
    ley('a-ley1', 0, 0), ley('a-ley2', 0, 1), ley('a-ley3', 0, 2), ley('a-ley4', 0, 3), ley('a-ley5', 0, 4),
    enc('A-S1', 0), sol('a-sol1', 0, 0), sol('a-sol2', 0, 1),
    { id: 'a-pred', et: 0, tipo: 'pred', ref: 'A-E1', t: 'Materia: ¿cuánto predijeron?', res: 'Todos: el cobre cambia B en 0,001 %; el hierro lo multiplica por 3000.', fig: () => muestra(P0) },
    panel('a-panel', 0, 'materia', 'Materia: ¿qué pasa si cambiamos un valor?', 'Cambia el material, el campo o la temperatura y mira χ, μr y B.'),
    enc('A-C2', 0), chk('a-chk1', 0, 'materia', 'hierro a 1100 K', { mat: 'fe', H: 100, T: 1100 }, 'Sobre 1043 K (770 °C) el hierro pierde sus dominios.'),

    { id: 'h-enun', et: 1, tipo: 'info', t: 'Ensayo del anillo de Rowland',
      txt: 'Un anillo de acero al silicio con dos bobinas. La primaria (N₁) crea H = N₁I/L, sin polos ni entrehierro. La secundaria (N₂), con un fluxómetro, mide el flujo. Así se traza la curva B-H del material.',
      chips: [['D medio', '10 cm'], ['S', '1,0 cm²'], ['N₁', '200'], ['N₂', '100'], ['I', '0,50 A'], ['λ medido', '12 mWb·v'], ['núcleo', '0,010 m³'], ['f', '50 Hz']], fig: () => rowland() },
    enc('B-E1', 1),
    ley('h-ley1', 1, 0), ley('h-ley2', 1, 1), ley('h-ley3', 1, 2), ley('h-ley4', 1, 3),
    sol('h-sol1', 1, 0), enc('B-S2', 1), sol('h-sol2', 1, 1), sol('h-sol3', 1, 2),
    enc('B-C2', 1), enc('B-S3', 1), sol('h-sol4', 1, 3),
    { id: 'h-pred', et: 1, tipo: 'pred', ref: 'B-E1', t: 'Rowland: ¿cuánto predijeron?', res: 'Queda Br = 1,0 T: la remanencia.', fig: () => ciclo('acero', { marcas: true, valores: true }) },
    panel('h-panel', 1, 'lazo', 'Ciclo B-H: ¿qué pasa si cambiamos un valor?', 'Mueve «Recorrido» para seguir el punto por el ciclo; cambia el material o la amplitud.'),

    { id: 'n-enun', et: 2, tipo: 'info', t: 'Núcleos: pérdidas y fisuras',
      txt: 'Dos problemas con acero al silicio. (a) El núcleo del transformador de la etapa anterior: ¿cuánto pierde por corrientes de Foucault? (b) Un retenedor electromagnético de puerta: ¿cuánta fuerza hace y qué pasa con 0,05 mm de suciedad en cada cara?',
      chips: [['ρ', '4,7·10⁻⁷ Ω·m'], ['lámina', '0,35 mm'], ['Bm; f', '1,2 T; 50 Hz'], ['núcleo', '0,010 m³'], ['l', '40 cm'], ['S', '4 cm²'], ['N·I', '500 × 0,20 A'], ['μr', '3000']], fig: () => retenFig({ g: 0, I: 0.2, mu: 3000 }, { F: true }) },
    ley('n-ley1', 2, 0), enc('N-C1', 2), ley('n-ley2', 2, 1), ley('n-ley3', 2, 2),
    sol('n-sol1', 2, 0), enc('N-S1', 2), sol('n-sol2', 2, 1),
    sol('n-sol3', 2, 2), enc('N-S2', 2), sol('n-sol4', 2, 3), enc('N-S3', 2), sol('n-sol5', 2, 4),
    panel('n-panel1', 2, 'perd', 'Pérdidas en el núcleo: ¿y si…?', 'Cambia el espesor, la frecuencia o el material.'),
    panel('n-panel2', 2, 'reten', 'Retenedor: ¿y si…?', 'Agrega suciedad, cambia la corriente o el material del núcleo.'),

    { id: 'i-enun', et: 3, tipo: 'info', t: 'Un imán en su circuito',
      txt: 'Un imán de NdFeB grado N trabaja en un circuito con entrehierro (coeficiente de permeancia Pc = 1,05). ¿Cuánta energía entrega por volumen y cuánto calor aguanta? Lo comparamos con una ferrita.',
      chips: [['Br', '1,30 T'], ['μrec', '1,05'], ['Hcj (20 °C)', '1000 kA/m'], ['Pc', '1,05'], ['α (Br)', '−0,12 %/°C'], ['β (Hcj)', '−0,6 %/°C'], ['ferrita Br', '0,40 T'], ['ferrita μrec', '1,10']], fig: () => cuadrante({ mat: 'n', T: 20, Pc: 1.05 }) },
    enc('I-E1', 3),
    ley('i-ley1', 3, 0), ley('i-ley2', 3, 1), ley('i-ley3', 3, 2), ley('i-ley4', 3, 3),
    enc('I-S2', 3), sol('i-sol1', 3, 0), sol('i-sol2', 3, 1), enc('I-S3', 3), sol('i-sol3', 3, 2),
    { id: 'i-pred', et: 3, tipo: 'pred', ref: 'I-E1', t: 'Imán: ¿cuánto predijeron?', res: 'No siempre: a 120 °C el grado N pasa el codo y pierde imán para siempre.', fig: () => cuadrante({ mat: 'n', T: 120, Pc: 1.05 }, { ref: true }) },
    panel('i-panel', 3, 'iman', 'Imán: ¿qué pasa si cambiamos un valor?', 'Cambia el imán, la temperatura o el entrehierro (Pc).'),
    enc('I-C2', 3), chk('i-chk1', 3, 'iman', 'samario-cobalto a 250 °C', { mat: 'smco', T: 250, Pc: 1.05 }, 'Prueba también el NdFeB a 250 °C.'),

    { id: 'g-enun', et: 4, tipo: 'info', t: 'Espín: leer un disco y enfriar',
      txt: 'Dos aplicaciones del espín del electrón: la cabeza que lee un disco duro (magnetorresistencia gigante, GMR) y un refrigerador sin gas (efecto magnetocalórico del gadolinio).',
      chips: [['r (espín a favor)', '1 Ω'], ['R (en contra)', '3 Ω'], ['I de lectura', '1 mA'], ['Gd: TC', '≈ 20 °C']], fig: () => valvula({ th: 0, al: 3, I: 1 }) },
    ley('g-ley1', 4, 0), enc('G-C1', 4), ley('g-ley2', 4, 1),
    enc('G-S2', 4), sol('g-sol1', 4, 0), sol('g-sol2', 4, 1), sol('g-sol3', 4, 2),
    panel('g-panel1', 4, 'gmr', 'Válvula de espín: ¿y si…?', 'Gira la capa libre (θ) o cambia la diferencia entre espines (R/r).'),
    enc('G-C3', 4), ley('g-ley3', 4, 2),
    panel('g-panel2', 4, 'mc', 'Refrigerador magnético: ¿y si…?', 'Avanza por las 4 etapas y cambia el campo del imán.'),

    { id: 'l-enun', et: 5, tipo: 'info', t: '¿Puede flotar algo sin hierro?',
      txt: 'Un material diamagnético es empujado hacia donde el campo es más débil. Si el campo es intenso y además cambia rápido con la altura, ese empuje puede igualar al peso.',
      chips: [['agua χ', '−9,0·10⁻⁶'], ['agua ρ', '1000 kg/m³'], ['grafito pir. χ', '−4·10⁻⁴'], ['grafito ρ', '2200 kg/m³'], ['bismuto χ', '−1,66·10⁻⁴'], ['bismuto ρ', '9780 kg/m³'], ['cobre χ', '−1,0·10⁻⁵'], ['cobre ρ', '8960 kg/m³']], fig: () => levita({ mat: 'agua', B: 16, L: 180 }) },
    enc('L-E1', 5),
    ley('l-ley1', 5, 0), ley('l-ley2', 5, 1),
    enc('L-S1', 5), sol('l-sol1', 5, 0), enc('L-S2', 5), sol('l-sol2', 5, 1),
    { id: 'l-pred', et: 5, tipo: 'pred', ref: 'L-E1', t: 'Levitación: ¿cuánto predijeron?', res: 'Sí: en Nimega (1997) flotó una rana con unos 16 T.', fig: () => levita({ mat: 'agua', B: 16, L: 180 }) },
    panel('l-panel', 5, 'lev', '¿Flota?: ¿qué pasa si cambiamos un valor?', 'Elige el material y el imán: B y la distancia en que el campo cae.'),
    chk('l-chk1', 5, 'lev', 'grafito sobre NdFeB', { mat: 'grafito', B: 0.5, L: 2.5 }, 'El juguete de escritorio: grafito pirolítico sobre imanes.'),
    enc('Z1', 5),
    { id: 'cierre', et: 5, tipo: 'cierre', t: 'Cierre' }
  ];
  MM.PASOS.forEach((p, i) => {
    p.n = i;
    if (p.tipo === 'sol') { const tot = SOL[p.et].length; p.t = PREF[p.et] + ', paso ' + (p.k + 1) + ' de ' + tot + ': ' + SOL[p.et][p.k].t; p.tot = tot; }
  });
  MM.ENC = ENC;

  // ============================================================
  // VISTAS
  // ============================================================
  const chipsHtml = (C) => `<div class="chips">${C.map((x) => `<div class="chip"><small>${x[0]}</small>${x[1]}</div>`).join('')}</div>`;
  function vInfo(cont, p) {
    cont.innerHTML = `<div class="vista"><div class="txt"><p>${p.txt}</p>${chipsHtml(p.chips)}${p.nota ? `<p class="lbl">${p.nota}</p>` : ''}</div><div class="fig">${p.fig()}</div></div>`;
    EM.tex(cont);
    return {};
  }
  function vLey(cont, p, v, cambio) {
    const leyes = LEYES[p.et];
    let k = v && v.ley !== undefined && leyes[v.ley] ? v.ley : p.k;
    cont.innerHTML = `<div class="vista leyv"><div class="txt"><div class="leyes">${leyes.map((L, i) => `<button class="ley" data-i="${i}"><span class="n">${i + 1}</span>${L.c}</button>`).join('')}</div><div class="ley-det card"></div></div><div class="fig"></div></div>`;
    const lista = cont.querySelector('.leyes');
    lista.onclick = (e) => { const b = e.target.closest('.ley'); if (!b) return; k = +b.dataset.i; pintar(); cambio && cambio({ ley: k }); };
    function pintar() {
      const L = leyes[k];
      lista.querySelectorAll('.ley').forEach((b, i) => b.classList.toggle('sel', i === k));
      cont.querySelector('.ley-det').innerHTML = `<p class="ley-n">${L.n}</p><div class="ley-f">${L.f.replace('\\(', '\\[').replace(/\\\)$/, '\\]')}</div><p>${L.d}</p><p class="lbl">${L.w}</p>`;
      cont.querySelector('.fig').innerHTML = L.fig();
      EM.tex(cont);
    }
    pintar();
    return { act(v2) { if (v2 && v2.ley !== undefined && v2.ley !== k && leyes[v2.ley]) { k = v2.ley; pintar(); } } };
  }
  function vSol(cont, p) {
    const S = SOL[p.et][p.k];
    cont.innerHTML = `<div class="vista sol"><div class="fig ancha">${S.fig()}</div><div class="txt"><div class="stp${p.k === p.tot - 1 ? ' last' : ''}"><span class="t">Paso ${p.k + 1} de ${p.tot}: ${S.t}</span>${S.e.map((x) => `<div class="e">\\[${x}\\]</div>`).join('')}<span class="why">${S.w}</span></div></div></div>`;
    EM.tex(cont);
    return {};
  }
  function vPanel(cont, p, v, cambio) {
    const D = PANEL[p.D];
    const ini = () => Object.assign({}, D.def, p.P || {});
    let P = v && v.P ? Object.assign({}, D.def, v.P) : ini();
    cont.innerHTML = `<div class="vista panel"><div class="txt ctl-col"><div class="ctl"></div>
      <div class="row"><button class="btn sm rst">Valores de esta pantalla</button></div>
      ${p.nota ? `<p class="lbl nota">${esc(p.nota)}</p>` : ''}</div>
      <div class="fig"></div><div class="txt rd"></div></div>`;
    const ctl = cont.querySelector('.ctl');
    ctl.innerHTML = D.ctl.map((c) => c.sel
      ? `<div class="selg"><span class="sl">${c.l}</span><div class="opts">${c.sel.map(([val, et]) => `<button data-k="${c.k}" data-val="${val}">${et}</button>`).join('')}</div></div>`
      : `<div><label><span>${c.l}</span><b data-v="${c.k}"></b></label><input type="range" data-k="${c.k}" min="${c.min}" max="${c.max}" step="${c.st}"></div>`).join('');
    function sync() {
      D.ctl.forEach((c) => {
        if (c.sel) { ctl.querySelectorAll(`button[data-k="${c.k}"]`).forEach((b) => b.classList.toggle('on', b.dataset.val === String(P[c.k]))); return; }
        const inp = ctl.querySelector(`input[data-k="${c.k}"]`);
        if (document.activeElement !== inp) inp.value = P[c.k];
        ctl.querySelector(`b[data-v="${c.k}"]`).textContent = f(P[c.k], c.d) + (c.u ? ' ' + c.u : '');
      });
    }
    function dibujar() { cont.querySelector('.fig').innerHTML = D.dib(P); cont.querySelector('.rd').innerHTML = D.lect(P); }
    const avisar = () => cambio && cambio({ P: Object.assign({}, P) });
    ctl.oninput = (e) => { const k = e.target.dataset.k; if (!k || e.target.tagName !== 'INPUT') return; P[k] = +e.target.value; sync(); dibujar(); avisar(); };
    ctl.onclick = (e) => {
      const b = e.target.closest('button[data-val]'); if (!b) return;
      const c = D.ctl.find((x) => x.k === b.dataset.k), it = c.sel.find(([val]) => String(val) === b.dataset.val);
      P[c.k] = it[0]; sync(); dibujar(); avisar();
    };
    cont.querySelector('.rst').onclick = () => { P = ini(); sync(); dibujar(); avisar(); };
    sync(); dibujar();
    return { act(v2) { if (!v2 || !v2.P) return; P = Object.assign({}, D.def, v2.P); sync(); dibujar(); } };
  }
  function vPred(cont, p, v) {
    const e1 = MM.PASOS.find((x) => x.id === p.ref);
    function pintar(v2) {
      const pr = (v2 && v2.pred) || null;
      cont.innerHTML = `<div class="vista predv"><div class="txt"><p class="big">Resultado: <b class="on-t">${esc(p.res)}</b></p>
        <p>Lo que votaron antes de calcular:</p>${EM.barras(e1, pr ? pr.c : null, { correcta: true })}
        ${pr ? `<p class="lbl">${pr.n} votos.</p>` : '<p class="lbl">No hubo votos en la predicción.</p>'}</div>
        <div class="fig">${p.fig()}</div></div>`;
      EM.tex(cont);
    }
    pintar(v);
    return { act(v2) { pintar(v2); } };
  }
  function vCierre(cont) {
    cont.innerHTML = `<div class="vista"><div class="txt"><ul class="sum">
      <li>Toda la materia responde al campo; solo ferro y ferrimagnéticos lo hacen de forma útil (\\(\\mu_r\\) de miles).</li>
      <li>Blandos (Hc pequeña) para núcleos; duros (Hc grande) para imanes. El área del ciclo es calor.</li>
      <li>Láminas aisladas eléctricamente contra Foucault (\\(P_F \\propto t^2\\)). Una fisura de 0,1 mm vale 30 cm de hierro.</li>
      <li>Un imán trabaja en el 2.º cuadrante; el calor puede hacerle pasar el codo para siempre.</li>
      <li>El espín explica la GMR, el frío magnético y la levitación diamagnética.</li></ul></div>
      <div class="txt"><div class="card"><b>Supuestos y límites</b><ul class="sum lbl">
      <li>Modelos simples: μr constante, ciclos de forma idealizada, rectas lineales en los imanes y coeficientes de temperatura de hojas de datos típicas.</li>
      <li>Valores de χ y ρ de tablas (HyperPhysics); levitación según Berry y Geim; gadolinio según Risø DTU.</li>
      <li>Basado en el informe «Materiales magnéticos», con sus errores corregidos.</li></ul></div></div></div>`;
    EM.tex(cont);
    return {};
  }

  MM.vista = function (cont, p, v, modo, cambio) {
    cont.classList.add('modo-' + modo);
    switch (p.tipo) {
      case 'info': return vInfo(cont, p);
      case 'ley': return vLey(cont, p, v, cambio);
      case 'sol': return vSol(cont, p);
      case 'panel': return vPanel(cont, p, v, cambio);
      case 'pred': return vPred(cont, p, v);
      case 'cierre': return vCierre(cont);
      default: cont.innerHTML = ''; return {};
    }
  };
})();
