// ============================================================
// Electrónica Digital 1 — diagramas que funcionan en la TV y en el celular
//   D1.seg   → display de 7 segmentos (tabla y dibujo)
//   D1.diag.bomba(contenedor, opc) → tanque con control de dos niveles y llave de salida:
//     la bomba arranca cuando el agua baja de Lb y para cuando llega a La (M⁺ = C·L̄a·(L̄b + M))
//     opc: { falla: null | 'fb' | 'fa' | 'fc' (oculta), botonesFalla: true/false }
//     API: estado(), movimientos(), segundos(), alCambiar(fn), parar(), destruir()
// ============================================================
(function () {
  const D1 = (window.D1 = window.D1 || {});
  D1.diag = D1.diag || {};

  // ---------------- 7 segmentos ----------------
  const SEG = { a: [0, 2, 3, 5, 6, 7, 8, 9], b: [0, 1, 2, 3, 4, 7, 8, 9], c: [0, 1, 3, 4, 5, 6, 7, 8, 9], d: [0, 2, 3, 5, 6, 8, 9], e: [0, 2, 6, 8], f: [0, 4, 5, 6, 8, 9], g: [2, 3, 4, 5, 6, 8, 9] };
  const Hs = (y, x0, x1) => [[x0 + 6, y], [x0 + 12, y - 6], [x1 - 12, y - 6], [x1 - 6, y], [x1 - 12, y + 6], [x0 + 12, y + 6]];
  const Vs = (x, y0, y1) => [[x, y0 + 6], [x + 6, y0 + 12], [x + 6, y1 - 12], [x, y1 - 6], [x - 6, y1 - 12], [x - 6, y0 + 12]];
  const X0 = 22, X1 = 108, YA = 14, YG = 107, YD = 200;
  const FORMAS = { a: Hs(YA, X0, X1), g: Hs(YG, X0, X1), d: Hs(YD, X0, X1), f: Vs(X0, YA, YG), b: Vs(X1, YA, YG), e: Vs(X0, YG, YD), c: Vs(X1, YG, YD) };
  const ETQ = { a: [65, 34], b: [90, 62], c: [90, 156], d: [65, 180], e: [40, 156], f: [40, 62], g: [65, 127] };
  D1.seg = {
    SEG, FORMAS, ETQ,
    // función de un segmento: 1 si se enciende en el dígito, X (2) para 10–15
    funcion: (s) => Array.from({ length: 16 }, (_, m) => (m > 9 ? 2 : SEG[s].includes(m) ? 1 : 0)),
    // dibujo de un dígito: opc { resaltar: 'g', letras: true, apagado: true (todo apagado) }
    svg(n, opc) {
      opc = opc || {};
      let h = '';
      Object.keys(FORMAS).forEach((s) => {
        const on = !opc.apagado && n != null && n <= 9 && SEG[s].includes(n);
        const res = opc.resaltar === s;
        h += '<polygon points="' + FORMAS[s].map((p) => p.join(',')).join(' ') + '" fill="' + (res && opc.apagado ? '#ffd8a8' : on ? '#e03131' : '#f1f3f5') +
          '" stroke="' + (res ? '#e67700' : on ? '#c92a2a' : '#dee2e6') + '" stroke-width="' + (res ? 6 : 1.5) + '"/>';
      });
      if (opc.letras) Object.keys(ETQ).forEach((s) => {
        h += '<text x="' + ETQ[s][0] + '" y="' + (ETQ[s][1] + 6) + '" text-anchor="middle" style="font-size:' + (opc.resaltar === s ? 22 : 16) + 'px;font-weight:800;fill:' + (opc.resaltar === s ? '#e67700' : '#adb5bd') + '">' + s + '</text>';
      });
      return '<svg class="dig7" viewBox="0 0 130 214">' + h + '</svg>';
    }
  };

  // ---------------- tanque con bomba y llave de salida ----------------
  D1.diag.bomba = function (cont, opc) {
    opc = opc || {};
    const LB = 20, LA = 85, BANDA = 2;          // umbrales (%) y banda de los electrodos
    const SUBE = 1.0, BAJA = [0, 0.35, 0.7];     // % por paso de 0,1 s
    const LLAVE = ['cerrada', 'media', 'abierta'];
    const ty = (v) => 128 - v * 1.06;
    const INI = { lv: 30, run: false, C: 1, llave: 1, fb: 0, fa: 0, sa: 0, sb: 1, arranques: 0, M: 0, F: 0, t: null, rebalse: false };
    const P = Object.assign({}, INI);
    const oculta = opc.falla || null;
    let mov = 0, vivo = true;
    const t0 = Date.now(), oyentes = [];

    const raiz = document.createElement('div');
    raiz.className = 'bomba' + (opc.celular ? ' celular' : '');
    cont.appendChild(raiz);
    raiz.innerHTML = '<div class="bomba-svg"><svg viewBox="0 0 300 200"></svg></div><div class="bomba-lado">' +
      '<div class="ctl">' +
      '<button class="btn pri" data-b="run">▶ Simular</button><button class="btn" data-b="rst">Reiniciar</button>' +
      '<button class="btn sel" data-b="C">Cisterna con agua</button>' +
      (opc.botonesFalla ? '<button class="btn" data-b="fb">Dañar sensor bajo</button><button class="btn" data-b="fa">Dañar sensor alto</button>' : '') +
      '</div><div class="leds"></div><p class="binfo"></p></div>';
    const svg = raiz.querySelector('svg');
    svg.innerHTML =
      '<rect x="20" y="150" width="100" height="46" rx="4" fill="#fff" stroke="#868e96" stroke-width="2.5"/>' +
      '<rect class="b-cw" x="22" y="160" width="96" height="34" fill="#74c0fc"/>' +
      '<text class="lbl2" x="70" y="144" text-anchor="middle">Cisterna</text>' +
      '<path class="pipe" d="M100,186 V172 H134"/><path class="pipe" d="M162,172 H168 V8 H225 V21"/>' +
      '<path class="flow b-f1" d="M100,186 V172 H134"/><path class="flow b-f2" d="M162,172 H168 V8 H225 V21"/>' +
      '<circle class="b-p" cx="148" cy="172" r="15" stroke="#495057" stroke-width="2.5"/><text class="b-pt" x="148" y="177.5" text-anchor="middle" style="font-size:15px;font-weight:800">M</text>' +
      '<path class="pipe" d="M262,129 V146 H296"/>' +
      '<path class="flow b-f3" d="M262,129 V146 H296"/>' +
      '<line class="b-chorro" x1="296" y1="150" x2="296" y2="194" stroke="#4dabf7" stroke-width="3" stroke-dasharray="4 5"/>' +
      '<g class="llave" style="cursor:pointer"><rect x="262" y="128" width="38" height="44" fill="transparent"/>' +
      '<path class="b-val" d="M271,139 L271,153 L287,139 L287,153 Z" fill="#fff" stroke="#495057" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<line class="b-man" x1="279" y1="146" x2="279" y2="133" stroke="#495057" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="279" cy="146" r="3" fill="#495057"/></g>' +
      '<text class="lbl2 b-ll" x="300" y="184" text-anchor="end">llave</text>' +
      '<rect x="180" y="20" width="90" height="110" fill="#fff" stroke="#868e96" stroke-width="2.5"/>' +
      '<rect class="b-tw" x="182" y="80" width="86" height="48" fill="#74c0fc"/>' +
      '<text class="st b-lv" x="225" y="88" text-anchor="middle"></text>' +
      '<text class="lbl2" x="225" y="145" text-anchor="middle">Tanque</text>' +
      [['a', LA, 'La'], ['b', LB, 'Lb']].map(([k, l, t]) =>
        '<line x1="172" x2="186" y1="' + ty(l) + '" y2="' + ty(l) + '" stroke="#495057" stroke-width="2"/>' +
        '<circle class="b-s' + k + '" cx="180" cy="' + ty(l) + '" r="6.5" stroke-width="2.5"/>' +
        '<path class="b-x' + k + '" d="M174,' + (ty(l) - 6) + ' L186,' + (ty(l) + 6) + ' M186,' + (ty(l) - 6) + ' L174,' + (ty(l) + 6) + '" stroke="#c92a2a" stroke-width="2.5"/>' +
        '<text class="st" x="168" y="' + (ty(l) + 5) + '" text-anchor="end">' + t + '</text>').join('') +
      '<text class="ovf b-ov" x="225" y="60">¡REBALSE!</text>';
    const q = (s) => raiz.querySelector(s);

    // sensores de electrodo: se mojan al llegar al umbral y se secan 2 % más abajo
    function sensores() {
      if (P.lv >= LA) P.sa = 1; else if (P.lv < LA - BANDA) P.sa = 0;
      if (P.lv >= LB) P.sb = 1; else if (P.lv < LB - BANDA) P.sb = 0;
      const malo = (k) => P[k] || oculta === k;
      return { C: malo('fc') ? 0 : P.C, Lb: malo('fb') ? 0 : P.sb, La: malo('fa') ? 0 : P.sa };
    }
    function salidas() {
      const i = sensores();
      // memoria: arranca con el tanque vacío (Lb = 0), sigue mientras no llegue a La
      const M = i.C && !i.La && (!i.Lb || P.M) ? 1 : 0;
      if (P.run && M && !P.M) P.arranques++;
      P.M = M;
      P.F = !i.Lb && i.La ? 1 : 0;
      return i;
    }
    function pintar() {
      if (!vivo) return;
      const i = salidas();
      const w = q('.b-tw');
      w.setAttribute('y', ty(P.lv)); w.setAttribute('height', Math.max(0, P.lv * 1.06));
      q('.b-lv').textContent = Math.round(P.lv) + ' %';
      const cw = q('.b-cw');
      cw.setAttribute('y', P.C ? 160 : 191); cw.setAttribute('height', P.C ? 34 : 3);
      const bombea = P.M && P.run && P.C;
      q('.b-p').setAttribute('fill', P.M ? 'var(--on)' : '#dee2e6');
      q('.b-pt').style.fill = P.M ? '#fff' : '#868e96';
      q('.b-f1').style.display = q('.b-f2').style.display = bombea ? '' : 'none';
      const sale = P.run && P.llave > 0 && P.lv > 0;
      q('.b-f3').style.display = q('.b-chorro').style.display = sale ? '' : 'none';
      q('.b-chorro').setAttribute('stroke-width', P.llave === 2 ? 4.5 : 2.5);
      q('.b-man').setAttribute('transform', 'rotate(' + [0, -45, -90][P.llave] + ' 279 146)');
      q('.b-val').setAttribute('fill', P.llave ? '#d0ebff' : '#fff');
      q('.b-ll').textContent = 'llave ' + LLAVE[P.llave];
      [['a', i.La, P.fa], ['b', i.Lb, P.fb]].forEach(([k, v, f]) => {
        const c = q('.b-s' + k);
        c.setAttribute('fill', v ? 'var(--on)' : '#fff');
        c.setAttribute('stroke', f ? '#c92a2a' : '#495057');
        q('.b-x' + k).style.display = f ? '' : 'none';
      });
      q('.b-ov').style.display = P.rebalse ? '' : 'none';
      const b = (n, x) => '<span class="sb">' + n + ' <b class="' + (x ? 'one' : '') + '">' + x + '</b></span>';
      q('.leds').innerHTML = b('C', i.C) + b('Lb', i.Lb) + b('La', i.La) +
        '<span class="ld' + (P.M ? ' on' : '') + '"><i></i>M</span><span class="ld al' + (P.F ? ' on' : '') + '"><i></i>F</span>';
      const qhace = P.rebalse ? '¡rebalsando!' : !i.C ? 'apagada (cisterna sin agua)' : P.M ? 'llenando hasta La' : i.La ? 'apagada (llegó a La)' : 'apagada, espera que baje de Lb';
      q('.binfo').innerHTML = 'Bomba: <b>' + qhace + '</b> · arranques: <b>' + P.arranques + '</b><br>Toca la <b>llave</b> para cambiar el consumo.';
      q('[data-b="run"]').textContent = P.run ? '❚❚ Pausa' : '▶ Simular';
      q('[data-b="C"]').classList.toggle('sel', !!P.C);
      raiz.querySelectorAll('[data-b="fb"],[data-b="fa"]').forEach((bt) => bt.classList.toggle('sel', !!P[bt.dataset.b]));
    }
    function paso() {
      salidas();
      if (P.M && P.C) P.lv += SUBE;
      if (P.lv > 0) P.lv -= BAJA[P.llave];
      P.rebalse = P.lv >= 100 && P.M && P.C;
      P.lv = Math.max(0, Math.min(100, P.lv));
      pintar();
    }
    const avisar = () => { mov++; oyentes.forEach((fn) => fn()); };
    function parar() { P.run = false; clearInterval(P.t); P.t = null; pintar(); }
    raiz.addEventListener('click', (e) => {
      if (e.target.closest('.llave')) { P.llave = (P.llave + 1) % 3; pintar(); avisar(); return; }
      const bt = e.target.closest('[data-b]');
      if (!bt) return;
      const k = bt.dataset.b;
      if (k === 'run') { if (P.run) parar(); else { P.run = true; if (P.M) P.arranques++; P.t = setInterval(paso, 100); pintar(); } }
      else if (k === 'rst') { clearInterval(P.t); Object.assign(P, INI); pintar(); }
      else { P[k] ^= 1; pintar(); }
      avisar();
    });
    pintar();
    return {
      estado: () => ({ nivel: Math.round(P.lv), llave: P.llave, arranques: P.arranques }),
      movimientos: () => mov,
      segundos: () => Math.round((Date.now() - t0) / 1000),
      alCambiar: (fn) => oyentes.push(fn),
      parar,
      destruir: () => { vivo = false; clearInterval(P.t); raiz.remove(); }
    };
  };
  // ---------------- circuito lógico AND–OR (suma de productos) ----------------
  //   puertas: [[literal, …], …]; literal = 2·i + (1 si va negada); i = 0 es la variable más alta
  //   Una puerta con una sola entrada es un cable directo a la OR.
  const C = (D1.circ = {});
  const GCc = () => (D1.k && D1.k.GC) || ['#1c7ed6', '#e8590c', '#2b8a3e', '#ae3ec9', '#0c8599', '#c92a2a', '#f08c00', '#5f3dc4'];
  const OVc = (s) => '<span class="ov">' + s + '</span>';
  const orden = (g) => g.slice().sort((a, b) => a - b);
  C.funcion = (nv, puertas) => Array.from({ length: 1 << nv }, (_, m) =>
    (puertas || []).some((g) => g.length && g.every((c) => ((((m >> (nv - 1 - (c >> 1))) & 1) ^ (c & 1)) === 1))) ? 1 : 0);
  C.deCubos = (nv, cubos) => cubos.map((cb) => { const g = []; for (let i = 0; i < nv; i++) { const b = 1 << (nv - 1 - i); if (cb.mask & b) g.push(2 * i + (cb.val & b ? 0 : 1)); } return g; });
  C.termino = (g, n) => (g.length ? orden(g).map((c) => (c & 1 ? OVc(n[c >> 1]) : n[c >> 1])).join('·') : '—');
  C.expr = (puertas, n, color) => {
    const u = (puertas || []).map((g, k) => ({ g, k })).filter((x) => x.g.length);
    if (!u.length) return '—';
    return u.map((x) => (color ? '<span style="color:' + GCc()[x.k % 8] + '">' + C.termino(x.g, n) + '</span>' : C.termino(x.g, n))).join(' + ');
  };
  // cuenta de compuertas: NOT (una por variable negada), AND (puertas de 2 o más entradas), OR
  C.cuenta = (puertas) => {
    const u = (puertas || []).filter((g) => g.length);
    const neg = new Set(); u.forEach((g) => g.forEach((c) => { if (c & 1) neg.add(c >> 1); }));
    return { not: neg.size, and: u.filter((g) => g.length > 1).length, or: u.length > 1 ? 1 : 0 };
  };
  // valor del circuito de dos niveles: t1 = compuerta de cada término ('and' | 'or' | 'nand'), t2 = compuerta de salida ('or' | 'and' | 'nand')
  //   En 'and'/'or' un término de una sola entrada es un cable directo; en 'nand' es una NAND que hace de inversor.
  C.funcion2 = (nv, puertas, t1, t2) => Array.from({ length: 1 << nv }, (_, m) => {
    const lit = (c) => (((m >> (nv - 1 - (c >> 1))) & 1) ^ (c & 1)) === 1;
    const u = (puertas || []).filter((g) => g.length);
    if (!u.length) return 0;
    const v1 = u.map((g) => {
      if (g.length === 1 && t1 !== 'nand') return lit(g[0]);
      const y = t1 === 'or' ? g.some(lit) : g.every(lit);
      return t1 === 'nand' ? !y : y;
    });
    const y2 = t2 === 'and' || t2 === 'nand' ? v1.every(Boolean) : v1.some(Boolean);
    return (t2 === 'nand' ? !y2 : y2) ? 1 : 0;
  });
  // texto de la expresión: forma 'sop' (A·B̄ + C) o 'pos' ((A + B̄)·C)
  C.texto = (puertas, n, forma) => {
    const u = (puertas || []).filter((g) => g.length).map(orden);
    const L = (c) => (c & 1 ? OVc(n[c >> 1]) : n[c >> 1]);
    if (forma === 'pos') return u.map((g) => (g.length > 1 ? '(' + g.map(L).join(' + ') + ')' : L(g[0]))).join('·');
    return u.map((g) => g.map(L).join('·')).join(' + ');
  };
  C.svg = function (nv, puertas, n, opc) {
    opc = opc || {};
    const sal = opc.salida || 'F', GC = GCc(), t1 = opc.t1 || 'and', t2 = opc.t2 || 'or', mono = !!opc.mono;
    const u = (puertas || []).map((g, k) => ({ g: orden(g), k })).filter((x) => x.g.length);
    const neg = Array(nv).fill(false);
    u.forEach((x) => x.g.forEach((c) => { if (c & 1) neg[c >> 1] = true; }));
    const RX = (i, ng) => 18 + i * 48 + (ng ? 22 : 0);
    const TOP = 46, GX = 18 + nv * 48 + 4;
    const cable = (g) => g.length === 1 && t1 !== 'nand';
    let y = TOP + 8;
    const fil = u.map((x) => {
      const k = x.g.length, h = cable(x.g) ? 12 : Math.max(24, k * 12 + 4);
      const r = { g: x.g, k: x.k, y0: y, h, yc: y + h / 2, ins: x.g.map((c, j) => y + h / 2 + (j - (k - 1) / 2) * 12) };
      y += h + 14;
      return r;
    });
    const H = Math.max(y + 2, TOP + 60);
    const OX = GX + 76, W = OX + (u.length > 1 ? 92 : 50);
    const bur = (x, yy, col) => '<circle cx="' + (x + 3.5) + '" cy="' + yy + '" r="3.5" class="cg" style="stroke:' + col + '"/>';
    let s = '';
    for (let i = 0; i < nv; i++) {
      const xt = RX(i, false), xn = RX(i, true);
      s += '<text x="' + xt + '" y="15" text-anchor="middle" class="cv">' + n[i] + '</text>';
      s += '<line x1="' + xt + '" y1="20" x2="' + xt + '" y2="' + (H - 4) + '" class="cw"/>';
      if (neg[i]) {
        s += '<line x1="' + xt + '" y1="26" x2="' + xn + '" y2="26" class="cw"/><circle cx="' + xt + '" cy="26" r="2.6" class="cd"/>' +
          '<path d="M' + (xn - 6) + ',27 H' + (xn + 6) + ' L' + xn + ',37 Z" class="cg"/><circle cx="' + xn + '" cy="40" r="2.8" class="cg"/>' +
          '<line x1="' + xn + '" y1="43" x2="' + xn + '" y2="' + (H - 4) + '" class="cw"/>' +
          '<text x="' + (xn + 4) + '" y="15" text-anchor="middle" class="cv cvn">' + OVt(n[i]) + '</text>';
      }
    }
    // primer nivel
    fil.forEach((f) => {
      const col = mono ? '#495057' : GC[f.k % 8];
      const r = f.h / 2, y1 = f.y0 + f.h;
      const back1 = (yy) => { const t = (yy - f.y0) / f.h; return GX - 4 + 24 * t * (1 - t); };
      f.g.forEach((c, j) => {
        const xr = RX(c >> 1, c & 1), yy = f.ins[j];
        const xe = cable(f.g) ? OX : t1 === 'or' ? back1(yy) : GX;
        s += '<line x1="' + xr + '" y1="' + yy + '" x2="' + xe + '" y2="' + yy + '" class="cw" style="stroke:' + col + '"/><circle cx="' + xr + '" cy="' + yy + '" r="3" class="cd" style="fill:' + col + '"/>';
      });
      if (cable(f.g)) { f.xo = null; return; }
      if (t1 === 'or') {
        s += '<path d="M' + (GX - 4) + ',' + f.y0 + ' Q' + (GX + 8) + ',' + f.yc + ' ' + (GX - 4) + ',' + y1 + ' Q' + (GX + 18) + ',' + y1 + ' ' + (GX + 34) + ',' + f.yc + ' Q' + (GX + 18) + ',' + f.y0 + ' ' + (GX - 4) + ',' + f.y0 + ' Z" class="cg" style="stroke:' + col + '"/>';
        f.xo = GX + 34;
      } else {
        s += '<path d="M' + GX + ',' + f.y0 + ' H' + (GX + 10) + ' A' + r + ',' + r + ' 0 0 1 ' + (GX + 10) + ',' + y1 + ' H' + GX + ' Z" class="cg" style="stroke:' + col + '"/>';
        f.xo = GX + 10 + r;
        if (t1 === 'nand') { s += bur(f.xo, f.yc, col); f.xo += 7; }
      }
    });
    // segundo nivel (o salida directa si hay un solo término)
    if (u.length > 1) {
      const oy0 = fil[0].yc - 12, oy1 = Math.max(fil[fil.length - 1].yc + 12, oy0 + 30), om = (oy0 + oy1) / 2, oh = oy1 - oy0;
      let xs;
      if (t2 === 'or') {
        const back = (yy) => { const t = (yy - oy0) / oh; return OX - 4 + 24 * t * (1 - t); };
        fil.forEach((f) => { s += '<line x1="' + (f.xo || OX) + '" y1="' + f.yc + '" x2="' + back(f.yc) + '" y2="' + f.yc + '" class="cw"/>'; });
        s += '<path d="M' + (OX - 4) + ',' + oy0 + ' Q' + (OX + 8) + ',' + om + ' ' + (OX - 4) + ',' + oy1 + ' Q' + (OX + 26) + ',' + oy1 + ' ' + (OX + 44) + ',' + om + ' Q' + (OX + 26) + ',' + oy0 + ' ' + (OX - 4) + ',' + oy0 + ' Z" class="cg"/>';
        xs = OX + 44;
      } else {
        const r = oh / 2;
        fil.forEach((f) => { s += '<line x1="' + (f.xo || OX) + '" y1="' + f.yc + '" x2="' + OX + '" y2="' + f.yc + '" class="cw"/>'; });
        s += '<path d="M' + OX + ',' + oy0 + ' H' + (OX + 8) + ' A' + r + ',' + r + ' 0 0 1 ' + (OX + 8) + ',' + oy1 + ' H' + OX + ' Z" class="cg"/>';
        xs = OX + 8 + r;
        if (t2 === 'nand') { s += bur(xs, om, '#495057'); xs += 7; }
      }
      s += '<line x1="' + xs + '" y1="' + om + '" x2="' + (W - 22) + '" y2="' + om + '" class="cw"/><text x="' + (W - 18) + '" y="' + (om + 5) + '" class="cv">' + sal + '</text>';
    } else if (u.length === 1) {
      const f = fil[0];
      s += '<line x1="' + (f.xo || OX) + '" y1="' + f.yc + '" x2="' + (W - 22) + '" y2="' + f.yc + '" class="cw"/><text x="' + (W - 18) + '" y="' + (f.yc + 5) + '" class="cv">' + sal + '</text>';
    } else {
      s += '<text x="' + (GX + 4) + '" y="' + (TOP + 30) + '" class="cvac">Agrega una compuerta</text>';
    }
    return '<svg class="circ" viewBox="0 0 ' + Math.max(W, OX + 60) + ' ' + H + '">' + s + '</svg>';
  };
  function OVt(x) { return x + '̅'; }
})();
