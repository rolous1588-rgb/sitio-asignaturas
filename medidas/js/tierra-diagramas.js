// ============================================================
// Medidas Eléctricas · Diagramas de puesta a tierra (04/11/2026)
//   FP.diagramas.capas        ¿Dónde está la resistencia? (electrodo hemisférico)
//   FP.diagramas.telurometro  Telurómetro virtual: E, S y H en línea, lectura y curva
// Modelo (suelo homogéneo de resistividad ρ):
//   jabalina de largo L y radio a = 8 mm; pica H de 0,4 m.
//   R_E  = ρ/(2πL)·(ln(4L/a) − 1)            (Dwight)
//   u(x) = ρ/(2πL)·asinh(L/x)                potencial en la superficie, por amperio
//   lectura R(x) = R_E − u_H(D) − u_E(x) + u_H(D − x)
// Requiere fp-diagramas.js (FP.COL, FP.fmt y FP.diagramas). Copia sus utilidades
// de dibujo para no depender de cambios en ese archivo.
// ============================================================
(function () {
  const FP = (window.FP = window.FP || {});
  const D = FP.diagramas;
  const COL = FP.COL;
  const { f } = FP.fmt;
  const T = 46, TG = 58, TS = 40;

  // ---------- utilidades de dibujo (copia de fp-diagramas.js) ----------
  const txt = (x, y, s, o = {}) =>
    `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${o.tam || T}" fill="${o.col || COL.texto}" text-anchor="${o.anc || 'middle'}" font-weight="${o.peso || 600}"${o.mono ? ' font-family="JetBrains Mono, monospace"' : ''} stroke="#fff" stroke-width="${o.halo === false ? 0 : 9}" stroke-linejoin="round" paint-order="stroke">${s}</text>`;
  const lin = (x1, y1, x2, y2, col, an = 5, extra = '') =>
    `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="${an}" stroke-linecap="round"${extra ? ' ' + extra : ''}/>`;

  function base(cont, opc) {
    opc = opc || {};
    const ocultos = new Set(opc.ocultar || []);
    const fijos = opc.fijos || {};
    const raiz = document.createElement('div');
    raiz.className = 'dg';
    raiz.innerHTML =
      '<div class="dg-lienzo"><svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" class="dg-svg" role="img"></svg></div>' +
      '<div class="dg-lado"><div class="dg-lect"></div><div class="dg-ctrl"></div></div>';
    cont.appendChild(raiz);
    const b = {
      raiz, opc,
      svg: raiz.querySelector('svg'),
      lect: raiz.querySelector('.dg-lect'),
      ctrl: raiz.querySelector('.dg-ctrl'),
      revelado: !!opc.revelado,
      oyentes: [], mov: 0, t0: Date.now(), vivo: true,
      sliders: {}, tiles: {}, pintar: () => {}
    };
    b.oculto = (k) => ocultos.has(k) && !b.revelado;
    if (opc.sinControles) b.ctrl.classList.add('oculto');
    b.fijo = (k) => !!fijos[k];
    b.avisar = () => b.oyentes.forEach((fn) => { try { fn(); } catch (e) { /* nada */ } });
    b.tile = (id, etiqueta, destacado) => {
      const el = document.createElement('div');
      el.className = 'tile' + (destacado ? ' destacado' : '');
      el.innerHTML = `<span class="et">${etiqueta}</span><b>—</b>`;
      b.lect.appendChild(el);
      b.tiles[id] = { el, b: el.querySelector('b') };
    };
    b.set = (id, valor, clase) => {
      const t = b.tiles[id];
      if (!t) return;
      const oc = b.oculto(id);
      t.b.textContent = oc ? '?' : valor;
      t.el.classList.toggle('oculto', oc);
      t.el.classList.remove('ok', 'mal', 'duda');
      if (!oc && clase) t.el.classList.add(clase);
    };
    b.slider = (o) => {
      const el = document.createElement('label');
      el.className = 'deslizador-tv';
      el.innerHTML = `<span class="fila"><span class="et">${o.etiqueta}</span><output></output></span>` +
        `<input type="range" min="${o.min}" max="${o.max}" step="${o.paso}" value="${o.valor}">`;
      b.ctrl.appendChild(el);
      const input = el.querySelector('input');
      const out = el.querySelector('output');
      const s = {
        el, input,
        mostrar: () => { out.textContent = o.formato ? o.formato(Number(input.value)) : input.value; },
        fijar: (v) => { input.value = v; s.mostrar(); }
      };
      if (b.fijo(o.id)) { input.disabled = true; el.classList.add('fijo'); }
      input.addEventListener('input', () => { o.alMover(Number(input.value)); s.mostrar(); b.pintar(); });
      input.addEventListener('change', () => { b.mov++; b.avisar(); });
      s.mostrar();
      b.sliders[o.id] = s;
      return s;
    };
    b.botones = (lista) => {
      const fila = document.createElement('div');
      fila.className = 'dg-botones';
      lista.forEach((o) => {
        const bt = document.createElement('button');
        bt.type = 'button';
        bt.className = 'dg-boton';
        bt.innerHTML = o.texto;
        bt.addEventListener('click', () => { o.accion(bt); b.pintar(); b.mov++; b.avisar(); });
        fila.appendChild(bt);
        o.el = bt;
      });
      b.ctrl.appendChild(fila);
      return fila;
    };
    return b;
  }

  function api(b, e, sincronizar) {
    return {
      raiz: b.raiz,
      estado: () => JSON.parse(JSON.stringify(e)),
      fijar: (nuevo) => { Object.assign(e, nuevo || {}); if (sincronizar) sincronizar(); b.pintar(); },
      revelar: () => { b.revelado = true; b.pintar(); },
      movimientos: () => b.mov,
      segundos: () => Math.round((Date.now() - b.t0) / 1000),
      alCambiar: (fn) => b.oyentes.push(fn),
      destruir: () => { b.vivo = false; b.raiz.remove(); }
    };
  }
  const ini = (opc, k, def) => (opc && opc.inicial && opc.inicial[k] != null ? opc.inicial[k] : def);
  const par = (opc, k, def) => (opc && opc.params && opc.params[k] != null ? opc.params[k] : def);
  const marcar = (bt, si) => { bt.style.background = si ? '#dbe8f8' : '#fff'; bt.style.borderColor = si ? COL.v : ''; };

  // ---------- modelo físico ----------
  const A_JAB = 0.008, L_H = 0.4;
  const M = (FP.tierra = {});
  M.re = (rho, L) => (rho / (2 * Math.PI * L)) * (Math.log((4 * L) / A_JAB) - 1);
  M.uE = (rho, L, x) => (rho / (2 * Math.PI * L)) * Math.asinh(L / Math.max(x, 0.05));
  M.uH = (rho, d) => (rho / (2 * Math.PI * L_H)) * Math.asinh(L_H / Math.max(d, 0.05));
  // pequeña variación reproducible (±0,3 %): la misma posición da siempre la misma lectura
  M.ruido = (x, Dd, sem) => 0.003 * Math.sin(12.9898 * x + 78.233 * Dd + (sem || 0));
  M.lectura = (p, Dd, x) => {
    const v = M.re(p.rho, p.L) - M.uH(p.rho, Dd) - M.uE(p.rho, p.L, x) + M.uH(p.rho, Dd - x);
    return Math.max(0, v * (1 + M.ruido(x, Dd, p.sem)));
  };
  // lecturas tomadas a x − 1, x y x + 1 (± 0,3 m) con la misma pica H
  M.verificacion = (puntos, x, Dd) => {
    const pts = (puntos || []).filter((q) => Math.abs(q.D - Dd) < 0.01);
    const cerca = (xx) => pts.filter((q) => Math.abs(q.x - xx) <= 0.3).sort((a, c) => Math.abs(a.x - xx) - Math.abs(c.x - xx))[0];
    const tres = [cerca(x - 1), cerca(x), cerca(x + 1)];
    if (tres.some((q) => !q)) return { ok: false };
    const rs = tres.map((q) => q.R);
    const med = rs.reduce((a, c) => a + c, 0) / 3;
    return { ok: true, tres, var: med > 0 ? ((Math.max(...rs) - Math.min(...rs)) / med) * 100 : 100 };
  };
  const fR = (R) => (R >= 100 ? f(R, 0) : R >= 10 ? f(R, 1) : f(R, 2));

  // ============================================================
  // Capas: ¿dónde está la resistencia?
  // ============================================================
  D.capas = (cont, opc) => {
    const b = base(cont, opc);
    const r0 = par(opc, 'r0', 0.4);
    const rMin = 0.5, rMax = 20;
    const aS = (r) => Math.round((Math.log(r / rMin) / Math.log(rMax / rMin)) * 100);
    const deS = (s) => rMin * Math.pow(rMax / rMin, s / 100);
    const e = { r: ini(opc, 'r', 2) };
    b.tile('pct', 'Dentro de r', true);
    b.tile('fuera', 'Fuera de r');
    b.slider({ id: 'r', etiqueta: 'Distancia r al electrodo', min: 0, max: 100, paso: 1, valor: aS(e.r), formato: (s) => f(deS(s), deS(s) < 10 ? 1 : 0) + ' m', alMover: (s) => { e.r = Math.round(deS(s) * 10) / 10; } });
    b.pintar = () => {
      const cx = 500, gy = 110;
      const rad = (r) => 26 + (Math.log(r / r0) / Math.log(rMax / r0)) * 440;
      const pct = (1 - r0 / e.r) * 100;
      let s = '';
      s += `<rect x="0" y="${gy}" width="1000" height="${600 - gy}" fill="#f6f1e7"/>`;
      s += lin(0, gy, 1000, gy, COL.t2, 4);
      const R = rad(e.r);
      s += `<path d="M${cx - R},${gy} A${R},${R} 0 0 0 ${cx + R},${gy} Z" fill="#dbe8f8" stroke="${COL.v}" stroke-width="5"/>`;
      [1, 2, 5, 10, 20].forEach((m) => {
        const rr = rad(m);
        s += `<path d="M${cx - rr},${gy} A${rr},${rr} 0 0 0 ${cx + rr},${gy}" fill="none" stroke="${COL.t3}" stroke-width="2.5" stroke-dasharray="10 10"/>`;
        s += txt(cx + rr * 0.866, gy + rr * 0.5 + 12, m + ' m', { tam: TS - 6, col: COL.t3, peso: 700 });
      });
      const r0p = rad(r0);
      s += `<path d="M${cx - r0p},${gy} A${r0p},${r0p} 0 0 0 ${cx + r0p},${gy} Z" fill="${COL.t2}"/>`;
      s += txt(cx, gy - 30, 'Electrodo (hemisferio de ' + f(r0, 1) + ' m)', { tam: TS - 6, col: COL.t2 });
      s += txt(cx, gy + R * 0.62 + 20, f(pct, 0) + ' %', { tam: TG + 10, col: COL.v, peso: 800 });
      s += txt(cx, gy + R * 0.62 + 66, 'de la resistencia está aquí', { tam: TS - 8, col: COL.v, peso: 600 });
      b.svg.innerHTML = s;
      b.set('pct', f(pct, 0) + ' %', 'ok');
      b.set('fuera', f(100 - pct, 0) + ' %');
    };
    b.pintar();
    return api(b, e, () => b.sliders.r.fijar(aS(e.r)));
  };

  // ============================================================
  // Telurómetro virtual (método de caída de potencial)
  // ============================================================
  D.telurometro = (cont, opc) => {
    const b = base(cont, opc);
    const p = { rho: par(opc, 'rho', 100), L: par(opc, 'L', 2.4), sem: par(opc, 'sem', 0) };
    const limite = par(opc, 'limite', null);
    const e = {
      D: ini(opc, 'D', 30),
      x: ini(opc, 'x', 6),
      puntos: (ini(opc, 'puntos', []) || []).map((q) => ({ x: q.x, D: q.D, R: q.R })),
      decision: ini(opc, 'decision', null)
    };
    const xMax = () => e.D - 0.5;
    if (e.x > xMax()) e.x = xMax();
    b.tile('R', 'Lectura', true);
    b.tile('pos', 'Pica S');
    b.tile('ver', 'Varía a ±1 m');
    if (opc.revelado) b.tile('re', 'Valor real');

    b.slider({
      id: 'D', etiqueta: 'Pica de corriente H a', min: 5, max: 50, paso: 1, valor: e.D, formato: (v) => f(v, 0) + ' m',
      alMover: (v) => {
        e.D = v;
        b.sliders.x.input.max = xMax();
        if (e.x > xMax()) { e.x = xMax(); }
        b.sliders.x.fijar(e.x);
      }
    });
    b.slider({ id: 'x', etiqueta: 'Pica de potencial S a', min: 0.5, max: xMax(), paso: 0.5, valor: e.x, formato: (v) => f(v, 1) + ' m', alMover: (v) => { e.x = Math.min(v, xMax()); } });
    b.botones([
      {
        texto: 'Medir (guardar lectura)', accion: () => {
          const R = Math.round(M.lectura(p, e.D, e.x) * 100) / 100;
          e.puntos = e.puntos.filter((q) => !(Math.abs(q.D - e.D) < 0.01 && Math.abs(q.x - e.x) < 0.05));
          e.puntos.push({ x: e.x, D: e.D, R });
          if (e.puntos.length > 20) e.puntos.shift();
          e.puntos.sort((a, c) => a.D - c.D || a.x - c.x);
        }
      },
      { texto: 'Borrar lecturas', accion: () => { e.puntos = []; } }
    ]);
    const botDec = [];
    if (limite != null) {
      const lista = [
        { texto: `Cumple (≤ ${f(limite, 0)} Ω)`, accion: () => { e.decision = 'cumple'; } },
        { texto: 'No cumple', accion: () => { e.decision = 'no'; } }
      ];
      b.botones(lista);
      lista.forEach((o, k) => botDec.push({ el: o.el, val: k === 0 ? 'cumple' : 'no' }));
    }

    b.pintar = () => {
      const X = (m) => 70 + m * 17.6;
      const gy = 250;
      const R = M.lectura(p, e.D, e.x);
      const re = M.re(p.rho, p.L);
      const pts = e.puntos.filter((q) => Math.abs(q.D - e.D) < 0.01);
      const ver = M.verificacion(e.puntos, e.x, e.D);
      const rE = 2.5 * p.L, rH = 1.6;
      const solapa = rE + rH > e.D;
      let s = '';
      // suelo y escala
      s += `<rect x="0" y="${gy}" width="1000" height="${600 - gy}" fill="#f6f1e7"/>`;
      s += lin(0, gy, 1000, gy, COL.t2, 4);
      for (let m = 0; m <= 50; m += 5) {
        s += lin(X(m), gy, X(m), gy + (m % 10 ? 10 : 16), COL.t3, 3);
        if (m % 10 === 0) s += txt(X(m), gy + 50, m === 50 ? '50 m' : String(m), { tam: TS - 6, col: COL.t3, peso: 600 });
      }
      // áreas de resistencia
      const colA = solapa ? COL.mal : COL.t3;
      const rxE = X(rE) - X(0), rxH = X(rH) - X(0);
      s += `<path d="M${X(0) - rxE},${gy} A${rxE},${rxE * 0.55} 0 0 0 ${X(0) + rxE},${gy}" fill="none" stroke="${colA}" stroke-width="3" stroke-dasharray="10 9"/>`;
      s += `<path d="M${X(e.D) - rxH},${gy} A${rxH},${rxH * 0.7} 0 0 0 ${X(e.D) + rxH},${gy}" fill="none" stroke="${colA}" stroke-width="3" stroke-dasharray="10 9"/>`;
      if (solapa) s += txt(X(e.D) + 50, gy + 92, 'las áreas se tocan', { tam: TS, col: COL.mal, peso: 700, anc: 'start' });
      // instrumento
      s += `<rect x="16" y="8" width="320" height="124" rx="16" fill="#fff" stroke="${COL.texto}" stroke-width="5"/>`;
      s += txt(176, 46, 'Telurómetro', { tam: TS - 4, col: COL.t2 });
      s += txt(176, 112, 'R = ' + fR(R) + ' Ω', { tam: TG, peso: 800, mono: true, col: COL.v });
      // cables (sin cruces: E directo, S y H por debajo de la caja)
      s += `<path d="M70,132 V${gy}" fill="none" stroke="${COL.texto}" stroke-width="4"/>`;
      s += `<path d="M176,132 V178 H${X(e.x)} V${gy}" fill="none" stroke="${COL.v}" stroke-width="4"/>`;
      s += `<path d="M282,132 V154 H${X(e.D)} V${gy}" fill="none" stroke="${COL.i}" stroke-width="4"/>`;
      // electrodo y picas
      s += `<rect x="${X(0) - 8}" y="${gy}" width="16" height="${p.L * 35}" fill="${COL.t2}"/>`;
      s += `<rect x="${X(e.x) - 6}" y="${gy}" width="12" height="40" fill="${COL.v}"/>`;
      s += `<rect x="${X(e.D) - 6}" y="${gy}" width="12" height="48" fill="${COL.i}"/>`;
      s += txt(X(0) - 14, gy - 14, 'E', { tam: TS, col: COL.texto, peso: 800, anc: 'end' });
      s += txt(X(e.x) + 14, gy - 14, 'S', { tam: TS, col: COL.v, peso: 800, anc: 'start' });
      s += txt(X(e.D) + 14, gy - 14, 'H', { tam: TS, col: COL.i, peso: 800, anc: 'start' });
      // datos de posición
      s += txt(990, 50, `H a ${f(e.D, 0)} m`, { tam: TS, col: COL.i, anc: 'end', peso: 700 });
      s += txt(990, 104, `S a ${f(e.x, 1)} m = ${f((e.x / e.D) * 100, 0)} %`, { tam: TS, col: COL.v, anc: 'end', peso: 700 });
      // gráfico de lecturas guardadas
      const y0 = 400, y1 = 585;
      const todos = pts.map((q) => q.R).concat([R]);
      if (b.revelado) todos.push(re);
      const rTop = Math.max(5, Math.max(...todos) * 1.2);
      const Y = (v) => y1 - (Math.min(v, rTop) / rTop) * (y1 - y0);
      s += lin(X(0), y1, X(50), y1, COL.t3, 3);
      s += txt(X(0), y0 - 16, 'Lecturas guardadas', { tam: TS - 6, col: COL.t2, anc: 'start' });
      if (b.revelado) {
        s += lin(X(0), Y(re), X(50), Y(re), COL.ok, 3, 'stroke-dasharray="14 10"');
        s += txt(X(50), Y(re) - 12, 'real ' + fR(re) + ' Ω', { tam: TS - 6, col: COL.ok, anc: 'end' });
        s += lin(X(0.618 * e.D), y0, X(0.618 * e.D), y1, COL.ok, 3, 'stroke-dasharray="6 8"');
      }
      if (pts.length > 1) s += `<polyline points="${pts.map((q) => X(q.x).toFixed(1) + ',' + Y(q.R).toFixed(1)).join(' ')}" fill="none" stroke="${COL.v}" stroke-width="4"/>`;
      pts.forEach((q) => { s += `<circle cx="${X(q.x).toFixed(1)}" cy="${Y(q.R).toFixed(1)}" r="9" fill="${COL.v}"/>`; });
      s += lin(X(e.x), y0, X(e.x), y1, COL.v, 2, 'stroke-dasharray="4 8"');
      s += `<circle cx="${X(e.x).toFixed(1)}" cy="${Y(R).toFixed(1)}" r="13" fill="#fff" stroke="${COL.v}" stroke-width="4"/>`;
      if (!pts.length) s += txt(X(27), (y0 + y1) / 2 + 12, 'Toca «Medir» para guardar lecturas', { tam: TS - 6, col: COL.t3, peso: 500 });
      b.svg.innerHTML = s;

      b.set('R', fR(R) + ' Ω');
      b.set('pos', f(e.x, 1) + ' m');
      if (ver.ok) b.set('ver', f(ver.var, 1) + ' %', ver.var <= 5 ? 'ok' : 'mal');
      else b.set('ver', 'falta');
      if (opc.revelado) b.set('re', fR(re) + ' Ω', 'ok');
      botDec.forEach((o) => marcar(o.el, e.decision === o.val));
    };
    b.pintar();
    return api(b, e, () => {
      b.sliders.D.fijar(e.D);
      b.sliders.x.input.max = xMax();
      b.sliders.x.fijar(e.x);
    });
  };
})();
