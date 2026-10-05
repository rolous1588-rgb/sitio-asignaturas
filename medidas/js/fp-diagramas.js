// ============================================================
// Diagramas interactivos — Factor de potencia y su corrección
// Cada diagrama: FP.diagramas.nombre(contenedor, opciones) → API
//   opciones: { inicial:{…}, ocultar:[ids], fijos:{id:true}, params:{…}, revelado, animar }
//   API: estado(), fijar(est), revelar(), movimientos(), segundos(), alCambiar(fn), destruir()
// Convención: φ > 0 = carga inductiva (la corriente se atrasa). f = 50 Hz (Bolivia).
// ============================================================
(function () {
  const FP = (window.FP = window.FP || {});
  const D = (FP.diagramas = {});
  const COL = {
    v: '#1d5fb4', i: '#e0782b', p: '#1b8a5a', q: '#b7791f', s: '#1d5fb4', c: '#7a52c7',
    mal: '#c0392b', ok: '#1b8a5a', duda: '#b7791f', texto: '#16202c', t2: '#465366', t3: '#7a8596',
    rejilla: '#e1e6ed', borde: '#cbd3dd', fondo: '#f4f6f9'
  };
  FP.COL = COL;
  const RAD = Math.PI / 180;
  const W50 = 2 * Math.PI * 50;
  const R3 = Math.sqrt(3);
  const T = 46, TG = 58, TS = 40; // tamaños de letra dentro del SVG (viewBox de 600 de alto)

  // ---------- formato ----------
  const f = (x, d = 2) => (window.II ? II.fmt(x, d) : String(Math.round(x * 100) / 100));
  const miles = (x, d = 0) => {
    if (!isFinite(x)) return '—';
    const s = Math.abs(x).toFixed(d).split('.');
    const ent = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (x < 0 ? '−' : '') + ent + (s[1] ? ',' + s[1] : '');
  };
  const fpTexto = (fp, q) => (Math.abs(q) < 1e-9 || fp > 0.9995 ? '1' : f(fp, 2) + (q > 0 ? ' ind' : ' cap'));
  FP.fmt = { f, miles, fpTexto };

  // ---------- SVG en texto ----------
  const txt = (x, y, s, o = {}) =>
    `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${o.tam || T}" fill="${o.col || COL.texto}" text-anchor="${o.anc || 'middle'}" font-weight="${o.peso || 600}"${o.mono ? ' font-family="JetBrains Mono, monospace"' : ''} stroke="#fff" stroke-width="${o.halo === false || o.col === '#fff' ? 0 : 9}" stroke-linejoin="round" paint-order="stroke"${o.extra ? ' ' + o.extra : ''}>${s}</text>`;
  const lin = (x1, y1, x2, y2, col, an = 5, extra = '') =>
    `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="${an}" stroke-linecap="round"${extra ? ' ' + extra : ''}/>`;
  const flecha = (x1, y1, x2, y2, col, an = 7, punta = 26) => {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 2) return '';
    const p = Math.min(punta, L * 0.6);
    const bx = x2 - p * Math.cos(a), by = y2 - p * Math.sin(a);
    const px = (p * 0.45) * Math.sin(a), py = (p * 0.45) * Math.cos(a);
    return lin(x1, y1, bx, by, col, an) +
      `<polygon points="${x2.toFixed(1)},${y2.toFixed(1)} ${(bx + px).toFixed(1)},${(by - py).toFixed(1)} ${(bx - px).toFixed(1)},${(by + py).toFixed(1)}" fill="${col}"/>`;
  };
  const arco = (cx, cy, r, a1, a2, col, an = 4, extra = '') => {
    // ángulos en grados, sentido matemático (y hacia arriba)
    const p1 = [cx + r * Math.cos(a1 * RAD), cy - r * Math.sin(a1 * RAD)];
    const p2 = [cx + r * Math.cos(a2 * RAD), cy - r * Math.sin(a2 * RAD)];
    const grande = Math.abs(a2 - a1) > 180 ? 1 : 0;
    const barrido = a2 > a1 ? 0 : 1;
    return `<path d="M${p1[0].toFixed(1)},${p1[1].toFixed(1)} A${r},${r} 0 ${grande} ${barrido} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}" fill="none" stroke="${col}" stroke-width="${an}" stroke-linecap="round"${extra ? ' ' + extra : ''}/>`;
  };

  // ---------- armazón común ----------
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

    b.tile = (id, etiqueta, destacado, compacto) => {
      const el = document.createElement('div');
      el.className = 'tile' + (destacado ? ' destacado' : '') + (compacto ? ' compacto' : '');
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
      if (b.fijo(o.id) || o.deshabilitado) { input.disabled = true; el.classList.add('fijo'); }
      input.addEventListener('input', () => { o.alMover(Number(input.value)); s.mostrar(); b.pintar(); });
      input.addEventListener('change', () => { b.mov++; b.avisar(); });
      s.mostrar();
      b.sliders[o.id] = s;
      return s;
    };

    b.botones = (lista, clase = '') => {
      const fila = document.createElement('div');
      fila.className = 'dg-botones ' + clase;
      lista.forEach((o) => {
        const bt = document.createElement('button');
        bt.type = 'button';
        bt.className = 'dg-boton' + (o.clase ? ' ' + o.clase : '');
        bt.innerHTML = o.texto;
        if (o.id && b.fijo(o.id)) bt.disabled = true;
        bt.addEventListener('click', () => { if (o.neutro) return; o.accion(bt); b.pintar(); b.mov++; b.avisar(); });
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
  const fmtGrados = (v) => (v > 0 ? '+' : '') + v + '°';
  const tipoCarga = (phi) => (Math.abs(phi) < 0.5 ? 'resistiva' : phi > 0 ? 'inductiva' : 'capacitiva');

  // ============================================================
  // D1 · Fasores: adelanto y retraso
  // ============================================================
  D.fasores = (cont, opc) => {
    const b = base(cont, opc);
    const e = { phi: ini(opc, 'phi', 37) };
    let pausa = false;
    b.tile('phi', 'Desfase φ', true);
    b.tile('rel', 'La corriente');
    b.tile('tipo', 'Carga');
    b.tile('fp', 'FP = cos φ');
    b.slider({ id: 'phi', etiqueta: 'Desfase φ', min: -90, max: 90, paso: 1, valor: e.phi, formato: fmtGrados, alMover: (v) => { e.phi = v; } });
    const pre = (v) => () => { e.phi = v; b.sliders.phi.fijar(v); };
    b.botones([
      { texto: 'R', accion: pre(0) }, { texto: 'R-L', accion: pre(37) }, { texto: 'L', accion: pre(90) },
      { texto: 'R-C', accion: pre(-37) }, { texto: 'C', accion: pre(-90) },
      { texto: '❚❚', clase: 'icono', accion: (bt) => { pausa = !pausa; bt.innerHTML = pausa ? '▶' : '❚❚'; } }
    ]);

    const cx = 205, cy = 300, RV = 165, RI = 118, x0 = 430, x1 = 975;
    let ondas = '', phiOndas = null, t = 0, ultimo = performance.now();
    const ondasDe = (phi) => {
      let pv = '', pi = '';
      for (let k = 0; k <= 160; k++) {
        const th = (k / 160) * 4 * Math.PI;
        const x = x0 + (k / 160) * (x1 - x0);
        pv += (k ? 'L' : 'M') + x.toFixed(1) + ',' + (cy - RV * Math.sin(th)).toFixed(1);
        pi += (k ? 'L' : 'M') + x.toFixed(1) + ',' + (cy - RI * Math.sin(th - phi * RAD)).toFixed(1);
      }
      return `<path d="${pv}" fill="none" stroke="${COL.v}" stroke-width="6"/><path d="${pi}" fill="none" stroke="${COL.i}" stroke-width="6"/>`;
    };

    b.pintar = () => {
      if (phiOndas !== e.phi) { ondas = ondasDe(e.phi); phiOndas = e.phi; }
      const th = (t / 4) * 2 * Math.PI; // un ciclo cada 4 s
      const thI = th - e.phi * RAD;
      const vx = cx + RV * Math.cos(th), vy = cy - RV * Math.sin(th);
      const ix = cx + RI * Math.cos(thI), iy = cy - RI * Math.sin(thI);
      const thc = th % (4 * Math.PI);
      const xc = x0 + (thc / (4 * Math.PI)) * (x1 - x0);
      const yv = cy - RV * Math.sin(thc), yi = cy - RI * Math.sin(thc - e.phi * RAD);
      let s = '';
      s += `<circle cx="${cx}" cy="${cy}" r="${RV}" fill="none" stroke="${COL.rejilla}" stroke-width="4"/>`;
      s += lin(cx - RV - 15, cy, cx + RV + 15, cy, COL.rejilla, 3) + lin(cx, cy - RV - 15, cx, cy + RV + 15, COL.rejilla, 3);
      s += lin(x0, cy, x1, cy, COL.borde, 3) + lin(x0, cy - RV - 20, x0, cy + RV + 20, COL.borde, 3);
      s += ondas;
      // proyecciones de las puntas hacia las ondas
      s += lin(vx, vy, xc, yv, COL.v, 2.5, 'stroke-dasharray="8 10" opacity=".7"');
      s += lin(ix, iy, xc, yi, COL.i, 2.5, 'stroke-dasharray="8 10" opacity=".7"');
      s += lin(xc, cy - RV - 20, xc, cy + RV + 20, COL.t3, 2.5, 'opacity=".5"');
      s += `<circle cx="${xc.toFixed(1)}" cy="${yv.toFixed(1)}" r="11" fill="${COL.v}"/><circle cx="${xc.toFixed(1)}" cy="${yi.toFixed(1)}" r="11" fill="${COL.i}"/>`;
      // arco de desfase
      if (Math.abs(e.phi) >= 5) {
        const a1 = Math.min(th, thI) / RAD, a2 = Math.max(th, thI) / RAD;
        s += arco(cx, cy, 62, a1, a2, COL.t2, 4);
        const am = ((th + thI) / 2);
        s += txt(cx + 92 * Math.cos(am), cy - 92 * Math.sin(am) + 15, 'φ', { tam: TS, col: COL.t2 });
      }
      s += flecha(cx, cy, vx, vy, COL.v, 9, 30) + flecha(cx, cy, ix, iy, COL.i, 9, 30);
      s += `<circle cx="${cx}" cy="${cy}" r="9" fill="${COL.texto}"/>`;
      s += txt(cx + (RV + 34) * Math.cos(th), cy - (RV + 34) * Math.sin(th) + 15, 'V', { tam: TS, col: COL.v, peso: 700 });
      s += txt(cx + (RI + 34) * Math.cos(thI), cy - (RI + 34) * Math.sin(thI) + 15, 'I', { tam: TS, col: COL.i, peso: 700 });
      s += txt(x0 + 10, 62, 'v(t)', { anc: 'start', col: COL.v, peso: 700 }) + txt(x0 + 150, 62, 'i(t)', { anc: 'start', col: COL.i, peso: 700 });
      s += txt(x1, 575, 't →', { anc: 'end', tam: TS, col: COL.t3 });
      b.svg.innerHTML = s;
      const ph = e.phi;
      b.set('phi', fmtGrados(ph));
      b.set('rel', ph === 0 ? 'en fase' : ph > 0 ? 'se atrasa' : 'se adelanta', ph === 0 ? 'ok' : ph > 0 ? 'duda' : '');
      b.set('tipo', tipoCarga(ph));
      b.set('fp', fpTexto(Math.cos(ph * RAD), ph));
    };
    const animar = opc && opc.animar === false ? false : true;
    const bucle = (ahora) => {
      if (!b.vivo) return;
      const dt = Math.min(0.1, (ahora - ultimo) / 1000);
      ultimo = ahora;
      if (!pausa && !document.hidden) { t += dt; b.pintar(); }
      requestAnimationFrame(bucle);
    };
    b.pintar();
    if (animar) requestAnimationFrame(bucle);
    return api(b, e, () => b.sliders.phi.fijar(e.phi));
  };

  // ============================================================
  // D2 · Potencia instantánea p(t) = v·i
  // ============================================================
  D.potencia = (cont, opc) => {
    const b = base(cont, opc);
    const e = { phi: ini(opc, 'phi', 60) };
    const V = 220, I = 10;
    b.tile('P', 'P activa', true);
    b.tile('Q', 'Q reactiva');
    b.tile('S', 'S = V·I');
    b.tile('fp', 'FP');
    b.slider({ id: 'phi', etiqueta: 'Desfase φ', min: -90, max: 90, paso: 5, valor: e.phi, formato: fmtGrados, alMover: (v) => { e.phi = v; } });
    const pre = (v) => () => { e.phi = v; b.sliders.phi.fijar(v); };
    b.botones([{ texto: 'R', accion: pre(0) }, { texto: 'R-L', accion: pre(37) }, { texto: 'L', accion: pre(90) }, { texto: 'C', accion: pre(-90) }]);

    const x0 = 80, x1 = 975, y0 = 330, A = 108;
    b.pintar = () => {
      const ph = e.phi * RAD;
      const N = 240;
      let pv = '', pi = '', pp = '', pos = `M${x0},${y0}`, neg = `M${x0},${y0}`;
      for (let k = 0; k <= N; k++) {
        const th = (k / N) * 4 * Math.PI;
        const x = (x0 + (k / N) * (x1 - x0)).toFixed(1);
        const v = Math.sin(th), i = Math.sin(th - ph), p = 2 * v * i; // potencia normalizada (media = cos φ)
        pv += (k ? 'L' : 'M') + x + ',' + (y0 - A * v).toFixed(1);
        pi += (k ? 'L' : 'M') + x + ',' + (y0 - A * i).toFixed(1);
        pp += (k ? 'L' : 'M') + x + ',' + (y0 - A * p).toFixed(1);
        pos += 'L' + x + ',' + (y0 - A * Math.max(p, 0)).toFixed(1);
        neg += 'L' + x + ',' + (y0 - A * Math.min(p, 0)).toFixed(1);
      }
      pos += `L${x1},${y0}Z`; neg += `L${x1},${y0}Z`;
      let s = '';
      s += `<path d="${pos}" fill="${COL.p}" opacity=".18"/><path d="${neg}" fill="${COL.i}" opacity=".28"/>`;
      s += lin(x0, y0, x1, y0, COL.borde, 3);
      s += `<path d="${pv}" fill="none" stroke="${COL.v}" stroke-width="3.5" opacity=".55"/>`;
      s += `<path d="${pi}" fill="none" stroke="${COL.i}" stroke-width="3.5" opacity=".55"/>`;
      s += `<path d="${pp}" fill="none" stroke="${COL.p}" stroke-width="8"/>`;
      const yP = y0 - A * Math.cos(ph);
      s += lin(x0, yP, x1, yP, COL.p, 4, 'stroke-dasharray="16 12"');
      s += txt(x1, yP - 16, 'P = promedio', { anc: 'end', tam: TS, col: COL.p, peso: 700 });
      s += txt(x0, 62, 'p(t) = v · i', { anc: 'start', col: COL.p, peso: 700 });
      s += txt(x0 + 380, 62, 'v', { anc: 'start', col: COL.v, peso: 700 }) + txt(x0 + 440, 62, 'i', { anc: 'start', col: COL.i, peso: 700 });
      if (Math.abs(e.phi) >= 15) {
        // centro del primer lóbulo negativo: 2θ − φ = π (normalizado al primer ciclo)
        let thm = (Math.PI + ph) / 2;
        if (thm < 0) thm += Math.PI;
        const xm = x0 + (thm / (4 * Math.PI)) * (x1 - x0);
        const ym = y0 - A * (Math.cos(ph) - 1);
        s += txt(Math.max(x0 + 100, xm), Math.min(585, ym + 62), 'vuelve a la red', { tam: TS, col: COL.i, peso: 700 });
      }
      s += txt(x1, 585, 't →', { anc: 'end', tam: TS, col: COL.t3 });
      b.svg.innerHTML = s;
      const P = V * I * Math.cos(ph), Q = V * I * Math.sin(ph);
      b.set('P', miles(P) + ' W');
      b.set('Q', miles(Q) + ' VAR');
      b.set('S', miles(V * I) + ' VA');
      b.set('fp', fpTexto(Math.cos(ph), e.phi));
    };
    b.pintar();
    return api(b, e, () => b.sliders.phi.fijar(e.phi));
  };

  // ============================================================
  // D3 · Triángulo de potencias
  // ============================================================
  D.triangulo = (cont, opc) => {
    const b = base(cont, opc);
    const e = { P: ini(opc, 'P', 40), Q: ini(opc, 'Q', 30) };
    b.tile('P', 'P activa');
    b.tile('Q', 'Q reactiva');
    b.tile('S', 'S aparente', true);
    b.tile('fp', 'FP = P / S', true);
    b.slider({ id: 'P', etiqueta: 'P activa', min: 0, max: 100, paso: 0.5, valor: e.P, formato: (v) => f(v, 1) + ' kW', alMover: (v) => { e.P = v; } });
    b.slider({ id: 'Q', etiqueta: 'Q reactiva', min: 0, max: 100, paso: 0.5, valor: e.Q, formato: (v) => f(v, 1) + ' kVAR', alMover: (v) => { e.Q = v; } });

    b.pintar = () => {
      const P = e.P, Q = e.Q, S = Math.hypot(P, Q), fp = S > 0 ? P / S : 1;
      const Ox = 110, Oy = 505;
      const k = Math.min(540 / Math.max(P, 20), 400 / Math.max(Q, 20));
      const Px = Ox + P * k, Qy = Oy - Q * k;
      let s = '';
      s += `<polygon points="${Ox},${Oy} ${Px.toFixed(1)},${Oy} ${Px.toFixed(1)},${Qy.toFixed(1)}" fill="${COL.s}" opacity=".07"/>`;
      s += lin(Ox, Oy, Px, Oy, COL.p, 10) + lin(Px, Oy, Px, Qy, COL.q, 10) + lin(Ox, Oy, Px, Qy, COL.s, 10);
      if (Q > 0.5 && P > 0.5) {
        const phi = Math.atan2(Q, P) / RAD;
        s += arco(Ox, Oy, 90, 0, phi, COL.t2, 4);
        s += txt(Ox + 130 * Math.cos((phi / 2) * RAD), Oy - 130 * Math.sin((phi / 2) * RAD) + 14, b.oculto('fp') ? 'φ' : 'φ = ' + f(phi, 1) + '°', { tam: TS, col: COL.t2, anc: 'start' });
        s += `<rect x="${(Px - 30).toFixed(1)}" y="${(Oy - 30).toFixed(1)}" width="30" height="30" fill="none" stroke="${COL.t3}" stroke-width="3"/>`;
      }
      s += txt((Ox + Px) / 2, Oy + 62, 'P = ' + f(P, 1) + ' kW', { col: COL.p, peso: 700 });
      s += txt(Px + 22, (Oy + Qy) / 2 + 16, 'Q = ' + f(Q, 1) + ' kVAR', { col: COL.q, peso: 700, anc: 'start', tam: TS });
      const mx = (Ox + Px) / 2, my = (Oy + Qy) / 2;
      const etS = b.oculto('S') ? 'S = ?' : 'S = ' + f(S, 1) + ' kVA';
      s += txt(Math.max(mx - 24, 12 + etS.length * 0.58 * T), my - 22, etS, { col: COL.s, peso: 700, anc: 'end' });
      s += txt(Ox, 60, 'S² = P² + Q²', { anc: 'start', tam: TS, col: COL.t2, mono: true });
      b.svg.innerHTML = s;
      b.set('P', f(P, 1) + ' kW');
      b.set('Q', f(Q, 1) + ' kVAR');
      b.set('S', f(S, 1) + ' kVA');
      b.set('fp', fpTexto(fp, Q));
    };
    b.pintar();
    return api(b, e, () => { b.sliders.P.fijar(e.P); b.sliders.Q.fijar(e.Q); });
  };

  // ============================================================
  // D4 · Línea de alimentación y transformador
  // ============================================================
  FP.linea = { V: 380, R: 0.05, X: 0.008, Strafo: 75 }; // cable 100 m · 35 mm² Cu
  FP.calcLinea = (P, fp) => {
    const c = FP.linea;
    const S = P / fp;
    const I = (S * 1000) / (R3 * c.V);
    const sen = Math.sqrt(Math.max(0, 1 - fp * fp));
    return {
      S, I,
      perd: (3 * I * I * c.R) / 1000,
      dv: ((R3 * I * (c.R * fp + c.X * sen)) / c.V) * 100,
      trafo: (S / c.Strafo) * 100
    };
  };
  D.linea = (cont, opc) => {
    const b = base(cont, opc);
    const e = { P: ini(opc, 'P', 50), fp: ini(opc, 'fp', 0.7) };
    b.tile('S', 'S aparente');
    b.tile('I', 'Corriente', true);
    b.tile('perd', 'Pérdidas cable');
    b.tile('trafo', 'Carga trafo', true);
    b.slider({ id: 'P', etiqueta: 'P de la carga', min: 10, max: 70, paso: 0.5, valor: e.P, formato: (v) => f(v, 1) + ' kW', alMover: (v) => { e.P = v; } });
    b.slider({ id: 'fp', etiqueta: 'Factor de potencia', min: 0.5, max: 1, paso: 0.01, valor: e.fp, formato: (v) => f(v, 2), alMover: (v) => { e.fp = v; } });

    b.pintar = () => {
      const r = FP.calcLinea(e.P, e.fp);
      const ocI = b.oculto('I');
      const sobre = r.trafo > 100;
      const colCable = ocI ? COL.t3 : sobre ? COL.mal : r.trafo > 85 ? COL.i : COL.v;
      const an = ocI ? 14 : 6 + 26 * Math.min(r.I / 200, 1);
      let s = '';
      // trafo
      s += `<circle cx="112" cy="175" r="52" fill="#fff" stroke="${COL.texto}" stroke-width="6"/><circle cx="168" cy="175" r="52" fill="none" stroke="${COL.texto}" stroke-width="6"/>`;
      s += txt(140, 268, 'Trafo ' + FP.linea.Strafo + ' kVA', { tam: TS, col: COL.t2 });
      // cable
      s += lin(222, 175, 770, 175, colCable, an);
      s += txt(496, 128, ocI ? 'I = ?' : 'I = ' + f(r.I, 0) + ' A', { tam: TG, col: colCable === COL.v ? COL.v : colCable, peso: 700 });
      s += txt(496, 236 + an / 2, 'cable 100 m · 35 mm²', { tam: TS - 4, col: COL.t3, peso: 500 });
      // motor
      s += `<circle cx="850" cy="175" r="62" fill="#fff" stroke="${COL.texto}" stroke-width="6"/>`;
      s += txt(850, 195, 'M', { tam: TG, peso: 700 });
      s += txt(850, 282, f(e.P, 1) + ' kW', { tam: TS, col: COL.p, peso: 700 });
      // barras
      const filas = [
        { id: 'I', et: 'Corriente', v: r.I, max: 200, txt: f(r.I, 0) + ' A' },
        { id: 'perd', et: 'Pérdidas', v: r.perd, max: 4, txt: f(r.perd, 2) + ' kW' },
        { id: 'dv', et: 'Caída de V', v: r.dv, max: 8, txt: f(r.dv, 1) + ' %', ref: 5, refTxt: '5 %' },
        { id: 'trafo', et: 'Carga trafo', v: r.trafo, max: 150, txt: f(r.trafo, 0) + ' %', ref: 100, refTxt: '100 %' }
      ];
      const bx0 = 290, bx1 = 740;
      filas.forEach((fl, k) => {
        const y = 340 + k * 66;
        const oc = b.oculto(fl.id) || (fl.id !== 'I' && b.oculto('I'));
        s += txt(30, y + 34, fl.et, { anc: 'start', tam: TS, col: COL.t2 });
        s += `<rect x="${bx0}" y="${y + 6}" width="${bx1 - bx0}" height="38" rx="10" fill="${COL.fondo}" stroke="${COL.rejilla}" stroke-width="2"/>`;
        if (!oc) {
          const w = Math.max(0, Math.min(1, fl.v / fl.max)) * (bx1 - bx0);
          const malo = fl.ref != null && fl.v > fl.ref;
          s += `<rect x="${bx0}" y="${y + 6}" width="${w.toFixed(1)}" height="38" rx="10" fill="${malo ? COL.mal : fl.id === 'perd' ? COL.i : COL.v}" opacity=".85"/>`;
        }
        if (fl.ref != null) {
          const xr = bx0 + (fl.ref / fl.max) * (bx1 - bx0);
          s += lin(xr, y, xr, y + 50, COL.texto, 4);
        }
        s += txt(985, y + 36, oc ? '?' : fl.txt, { anc: 'end', tam: T, peso: 700, mono: true, col: oc ? COL.t3 : COL.texto });
      });
      b.svg.innerHTML = s;
      b.set('S', f(r.S, 1) + ' kVA');
      b.set('I', f(r.I, 0) + ' A');
      b.set('perd', f(r.perd, 2) + ' kW');
      b.set('trafo', f(r.trafo, 0) + ' %', sobre ? 'mal' : r.trafo > 85 ? 'duda' : 'ok');
    };
    b.pintar();
    return api(b, e, () => { b.sliders.P.fijar(e.P); b.sliders.fp.fijar(e.fp); });
  };

  // ============================================================
  // D5 · Medición: método de los dos vatímetros (trifásico equilibrado)
  // ============================================================
  FP.dosVatimetros = (VL, IL, fp) => {
    const phi = Math.acos(Math.max(0, Math.min(1, fp)));
    const k = (VL * IL) / 1000;
    return { phi, W1: k * Math.cos(Math.PI / 6 + phi), W2: k * Math.cos(Math.PI / 6 - phi) };
  };
  D.vatimetros = (cont, opc) => {
    const b = base(cont, opc);
    const VL = par(opc, 'VL', 380), IL = par(opc, 'IL', 15);
    const e = { fp: ini(opc, 'fp', 0.8) };
    const rango = Math.max(2, Math.ceil(((VL * IL) / 1000) * 1.1));
    b.tile('W1', 'W1', true);
    b.tile('W2', 'W2', true);
    b.tile('P', 'P = W1 + W2');
    b.tile('fp', 'FP de la carga');
    b.slider({ id: 'fp', etiqueta: 'FP de la carga', min: 0.1, max: 1, paso: 0.01, valor: e.fp, formato: (v) => f(v, 2) + ' · φ = ' + f(Math.acos(v) / RAD, 0) + '°', alMover: (v) => { e.fp = v; } });
    b.botones([{ texto: 'FP 1', accion: () => { e.fp = 1; b.sliders.fp.fijar(1); } }, { texto: 'FP 0,8', accion: () => { e.fp = 0.8; b.sliders.fp.fijar(0.8); } }, { texto: 'FP 0,5', accion: () => { e.fp = 0.5; b.sliders.fp.fijar(0.5); } }, { texto: 'FP 0,3', accion: () => { e.fp = 0.3; b.sliders.fp.fijar(0.3); } }]);

    const dial = (cx, cy, val, nombre, oc) => {
      let s = arco(cx, cy, 92, 20, 160, COL.borde, 10);
      const ang = (v) => 90 - (Math.max(-rango, Math.min(rango, v)) / rango) * 70;
      [-rango, 0, rango].forEach((v) => {
        const a = ang(v) * RAD;
        s += lin(cx + 76 * Math.cos(a), cy - 76 * Math.sin(a), cx + 106 * Math.cos(a), cy - 106 * Math.sin(a), COL.t2, 4);
      });
      s += txt(cx - 104, cy + 6, '−', { tam: TS, col: COL.t3 }) + txt(cx + 104, cy + 6, '+', { tam: TS, col: COL.t3 });
      if (!oc) {
        const a = ang(val) * RAD;
        s += lin(cx, cy, cx + 88 * Math.cos(a), cy - 88 * Math.sin(a), val < -0.005 ? COL.mal : COL.texto, 7);
      }
      s += `<circle cx="${cx}" cy="${cy}" r="11" fill="${COL.texto}"/>`;
      s += txt(cx - 150, cy - 40, nombre, { tam: T, peso: 700, col: COL.v, anc: 'end' });
      s += txt(cx, cy + 56, oc ? '? kW' : f(val, 2) + ' kW', { tam: T, peso: 700, mono: true, col: val < -0.005 && !oc ? COL.mal : COL.texto });
      return s;
    };

    b.pintar = () => {
      const r = FP.dosVatimetros(VL, IL, e.fp);
      const oc = b.oculto('W1');
      let s = '';
      const ys = [120, 290, 460];
      ['L1', 'L2', 'L3'].forEach((n, k) => {
        s += lin(30, ys[k], 500, ys[k], COL.texto, 6);
        s += txt(30, ys[k] - 18, n, { anc: 'start', tam: TS, col: COL.t2 });
      });
      s += `<rect x="500" y="70" width="110" height="440" rx="16" fill="#fff" stroke="${COL.texto}" stroke-width="6"/>`;
      s += txt(555, 282, 'Z', { tam: TG, peso: 700 }) + txt(555, 338, '∠φ', { tam: T, col: COL.t2 });
      s += txt(555, 560, 'carga 3φ', { tam: TS - 6, col: COL.t3, peso: 500 });
      [[0, 'W1'], [2, 'W2']].forEach(([k, n]) => {
        const y = ys[k];
        s += `<rect x="160" y="${y - 44}" width="150" height="88" rx="14" fill="${COL.fondo}" stroke="${COL.v}" stroke-width="5"/>`;
        s += txt(235, y + 17, n, { tam: T, peso: 700, col: COL.v });
        const yb = k === 0 ? y + 44 : y - 44;
        s += lin(270, yb, 270, ys[1], COL.v, 4, 'stroke-dasharray="10 9"');
        s += `<circle cx="270" cy="${ys[1]}" r="10" fill="${COL.v}"/>`;
      });
      s += txt(30, 580, 'bobinas de tensión a L2', { tam: TS - 6, col: COL.t3, peso: 500, anc: 'start' });
      s += dial(840, 180, r.W1, 'W1', oc);
      s += dial(840, 470, r.W2, 'W2', oc);
      b.svg.innerHTML = s;
      b.set('W1', f(r.W1, 2) + ' kW', r.W1 < -0.005 ? 'mal' : '');
      b.set('W2', f(r.W2, 2) + ' kW');
      b.set('P', f(r.W1 + r.W2, 2) + ' kW');
      b.set('fp', f(e.fp, 2));
    };
    b.pintar();
    return api(b, e, () => b.sliders.fp.fijar(e.fp));
  };

  // ============================================================
  // D6 · Corrector: banco de capacitores por escalones
  // ============================================================
  FP.calcCorrector = (P, fp1, Qc, V = 380) => {
    const Q1 = P * Math.tan(Math.acos(fp1));
    const Q2 = Q1 - Qc;
    const S1 = P / fp1, S2 = Math.hypot(P, Q2);
    const fp2 = S2 > 0 ? P / S2 : 1;
    const k = R3 * (V / 1000);
    return { Q1, Q2, S1, S2, fp2, I1: S1 / k, I2: S2 / k, CuF: ((Qc * 1000) / (3 * W50 * V * V)) * 1e6 };
  };
  // posición horizontal "continua" del FP para gráficos: inductivo 0,70→0,70 … 1 → 1 … capacitivo 0,90 → 1,10
  FP.ejeFP = (fp, Q) => (Q >= 0 ? fp : 2 - fp);
  D.corrector = (cont, opc) => {
    const b = base(cont, opc);
    const P = par(opc, 'P', 80), q = par(opc, 'q', 10), N = par(opc, 'N', 12);
    const e = { pasos: ini(opc, 'pasos', 0), fp1: ini(opc, 'fp1', par(opc, 'fp1', 0.72)) };
    b.tile('Qc', 'Banco Qc', true);
    b.tile('fp2', 'FP final', true);
    b.tile('I', 'Corriente', false, true);
    b.tile('C', 'C por fase (Δ)');
    b.botones([
      { id: 'pasos', texto: '−', clase: 'grande', accion: () => { e.pasos = Math.max(0, e.pasos - 1); } },
      { texto: '<span class="dg-pasos"></span>', clase: 'contador', neutro: true, accion: () => {} },
      { id: 'pasos', texto: '+', clase: 'grande', accion: () => { e.pasos = Math.min(N, e.pasos + 1); } }
    ], 'stepper');
    const cuenta = b.ctrl.querySelector('.dg-pasos');
    b.slider({ id: 'fp1', etiqueta: 'FP sin corregir', min: 0.5, max: 0.95, paso: 0.01, valor: e.fp1, formato: (v) => f(v, 2) + ' ind', alMover: (v) => { e.fp1 = v; } });

    b.pintar = () => {
      const Qc = e.pasos * q;
      const r = FP.calcCorrector(P, e.fp1, Qc);
      const oc = b.oculto('fp2');
      cuenta.innerHTML = `${e.pasos} <small>de ${N} pasos</small>`;
      const Ox = 70;
      const k = Math.min(470 / P, 420 / (Math.max(r.Q1, 0.01) + Math.max(0, -r.Q2)));
      const Oy = 110 + r.Q1 * k;
      const Px = Ox + P * k, Q1y = Oy - r.Q1 * k, Q2y = Oy - r.Q2 * k;
      let s = '';
      s += lin(Ox, Oy, Px, Q1y, COL.t3, 5, 'stroke-dasharray="14 10"');
      s += lin(Px, Oy, Px, Q1y, COL.q, 8);
      if (P * k > 220 && Oy - Q1y > 120) s += txt(Ox + (Px - Ox) * 0.42 - 16, Oy - (Oy - Q1y) * 0.42 - 26, 'antes', { tam: TS - 4, col: COL.t3, anc: 'end', peso: 500 });
      if (Qc > 0) s += flecha(Px + 34, Q1y, Px + 34, Q2y, COL.c, 8, 28);
      if (Qc > 0) s += txt(Px + 54, (Q1y + Q2y) / 2 + 14, 'Qc', { tam: T, col: COL.c, anc: 'start', peso: 700 });
      s += lin(Ox, Oy, Px, Oy, COL.p, 10);
      if (!oc) s += lin(Ox, Oy, Px, Q2y, r.Q2 < -0.01 ? COL.mal : COL.s, 10);
      s += txt(Ox, Math.min(585, Oy + Math.max(0, -r.Q2) * k + 50), 'P = ' + f(P, 0) + ' kW', { tam: TS, col: COL.p, peso: 700, anc: 'start' });
      s += txt(Px - 18, Math.max(50, Q1y - 18), 'Q = ' + f(r.Q1, 1), { tam: TS - 4, col: COL.q, anc: 'end', peso: 700 });
      // indicador de FP
      const gx = 800, gy = 330, gr = 150;
      const angDe = (fp, Q) => {
        const u = FP.ejeFP(fp, Q); // 0,70 … 1,30
        return 180 - ((Math.max(0.7, Math.min(1.3, u)) - 0.7) / 0.6) * 180;
      };
      s += arco(gx, gy, gr, 0, 180, COL.rejilla, 26);
      s += arco(gx, gy, gr, angDe(0.7, 1), angDe(0.85, 1), '#f3c4bd', 26);
      s += arco(gx, gy, gr, angDe(0.95, 1), angDe(1, 0), '#bfe5d0', 26);
      [[0.7, 1, '0,7'], [0.85, 1, '0,85'], [1, 0, '1'], [0.85, -1, '0,85c']].forEach(([v, Q, t]) => {
        const a = angDe(v, Q) * RAD;
        s += txt(gx + (gr + 46) * Math.cos(a), gy - (gr + 46) * Math.sin(a) + 12, t, { tam: TS - 8, col: COL.t3, peso: 600 });
      });
      if (!oc) {
        const a = angDe(r.fp2, r.Q2) * RAD;
        s += lin(gx, gy, gx + (gr - 10) * Math.cos(a), gy - (gr - 10) * Math.sin(a), COL.texto, 8);
      }
      s += `<circle cx="${gx}" cy="${gy}" r="14" fill="${COL.texto}"/>`;
      const capac = r.Q2 < -0.01;
      s += txt(gx, gy + 72, oc ? 'FP = ?' : 'FP ' + fpTexto(r.fp2, r.Q2), { tam: TG, peso: 700, col: oc ? COL.t3 : capac ? COL.mal : r.fp2 >= 0.95 ? COL.ok : COL.texto });
      if (!oc && capac) s += txt(gx, gy + 122, '¡sobrecompensado!', { tam: TS, col: COL.mal, peso: 700 });
      // banco por escalones
      const bw = Math.min(30, 420 / N), bx = gx - (N * bw) / 2;
      s += txt(gx, 492, 'banco: ' + N + ' × ' + f(q, 1) + ' kVAR', { tam: TS - 6, col: COL.t2, peso: 600 });
      for (let k2 = 0; k2 < N; k2++) {
        const on = k2 < e.pasos;
        s += `<rect x="${(bx + k2 * bw + 3).toFixed(1)}" y="512" width="${(bw - 6).toFixed(1)}" height="58" rx="6" fill="${on ? COL.c : '#fff'}" stroke="${on ? COL.c : COL.borde}" stroke-width="3"/>`;
      }
      b.svg.innerHTML = s;
      b.set('Qc', f(Qc, 1) + ' kVAR');
      b.set('fp2', fpTexto(r.fp2, r.Q2), capac ? 'mal' : r.fp2 >= 0.95 ? 'ok' : r.fp2 >= 0.85 ? 'duda' : 'mal');
      b.set('I', f(r.I1, 0) + ' → ' + (b.oculto('fp2') ? '?' : f(r.I2, 0) + ' A'));
      b.set('C', f(r.CuF, 0) + ' µF');
    };
    b.pintar();
    return api(b, e, () => { if (b.sliders.fp1) b.sliders.fp1.fijar(e.fp1); });
  };

  // ============================================================
  // D7 · La factura: FP a partir de kWh y kVARh + recargo
  // ============================================================
  FP.FP_MIN = 0.85;
  FP.calcFactura = (kwh, kvarh, cargo) => {
    const fp = kwh / Math.hypot(kwh, kvarh);
    const pct = fp < FP.FP_MIN ? (FP.FP_MIN / fp - 1) * 100 : 0;
    return { fp, pct, bs: (cargo * pct) / 100 };
  };
  D.factura = (cont, opc) => {
    const b = base(cont, opc);
    const cargo = par(opc, 'cargo', 9860);
    const cliente = par(opc, 'cliente', 'Taller industrial');
    const e = { kwh: ini(opc, 'kwh', 12480), kvarh: ini(opc, 'kvarh', 10950) };
    b.tile('fp', 'Factor de potencia', true);
    b.tile('pct', 'Recargo');
    b.tile('rec', 'Recargo en Bs', true);
    b.slider({ id: 'kwh', etiqueta: 'Energía activa', min: 2000, max: 20000, paso: 10, valor: e.kwh, formato: (v) => miles(v) + ' kWh', alMover: (v) => { e.kwh = v; } });
    b.slider({ id: 'kvarh', etiqueta: 'Energía reactiva', min: 0, max: 20000, paso: 10, valor: e.kvarh, formato: (v) => miles(v) + ' kVARh', alMover: (v) => { e.kvarh = v; } });

    b.pintar = () => {
      const r = FP.calcFactura(e.kwh, e.kvarh, cargo);
      const ocF = b.oculto('fp'), ocR = b.oculto('rec');
      let s = '';
      s += `<rect x="20" y="20" width="560" height="560" rx="22" fill="#fff" stroke="${COL.borde}" stroke-width="4"/>`;
      s += `<path d="M20,42 a22,22 0 0 1 22,-22 h516 a22,22 0 0 1 22,22 v62 h-560z" fill="${COL.v}"/>`;
      s += txt(48, 82, 'Factura de electricidad', { anc: 'start', tam: TS, col: '#fff', peso: 700 });
      s += txt(48, 152, cliente, { anc: 'start', tam: TS - 4, col: COL.t2, peso: 600 });
      const filas = [
        ['Activa', miles(e.kwh) + ' kWh', COL.p],
        ['Reactiva', miles(e.kvarh) + ' kVARh', COL.q],
        ['Cargo base', 'Bs ' + miles(cargo), COL.texto]
      ];
      filas.forEach(([a, v, c], k) => {
        const y = 230 + k * 70;
        s += txt(48, y, a, { anc: 'start', tam: TS, col: COL.t2, peso: 500 });
        s += txt(552, y, v, { anc: 'end', tam: TS + 2, col: c, peso: 700, mono: true });
      });
      s += lin(48, 410, 552, 410, COL.rejilla, 3);
      s += txt(48, 466, 'FP del mes', { anc: 'start', tam: TS, col: COL.t2, peso: 500 });
      s += txt(552, 466, ocF ? '?' : f(r.fp, 3), { anc: 'end', tam: T, peso: 700, mono: true, col: ocF ? COL.t3 : r.fp < FP.FP_MIN ? COL.mal : COL.ok });
      s += txt(48, 540, 'Recargo', { anc: 'start', tam: TS, col: COL.t2, peso: 500 });
      s += txt(552, 540, ocR ? '?' : 'Bs ' + miles(r.bs), { anc: 'end', tam: T, peso: 700, mono: true, col: ocR ? COL.t3 : r.bs > 0 ? COL.mal : COL.ok });
      // triángulo de energías
      const Ox = 630, Oy = 300, k = Math.min(250 / e.kwh, 230 / Math.max(e.kvarh, 1));
      const X = Ox + e.kwh * k, Y = Oy - e.kvarh * k;
      s += lin(Ox, Oy, X, Oy, COL.p, 9) + lin(X, Oy, X, Y, COL.q, 9) + lin(Ox, Oy, X, Y, COL.s, 9);
      s += txt((Ox + X) / 2, Oy + 50, 'kWh', { tam: TS, col: COL.p, peso: 700 });
      s += txt(X + 14, (Oy + Y) / 2 + 14, 'kVARh', { tam: TS - 6, col: COL.q, anc: 'start', peso: 700 });
      // regla 0,85
      const x0 = 630, x1 = 975, yB = 470;
      const xs = (v) => x0 + ((Math.max(0.5, Math.min(1, v)) - 0.5) / 0.5) * (x1 - x0);
      s += `<rect x="${x0}" y="${yB}" width="${(xs(0.85) - x0).toFixed(1)}" height="34" rx="8" fill="#f3c4bd"/>`;
      s += `<rect x="${xs(0.85).toFixed(1)}" y="${yB}" width="${(x1 - xs(0.85)).toFixed(1)}" height="34" rx="8" fill="#bfe5d0"/>`;
      s += lin(xs(0.85), yB - 16, xs(0.85), yB + 50, COL.texto, 4);
      s += txt(xs(0.85), yB - 26, 'mín. 0,85', { tam: TS - 6, col: COL.texto, peso: 700 });
      s += txt(x0, yB + 88, '0,5', { tam: TS - 8, col: COL.t3, anc: 'start' }) + txt(x1, yB + 88, '1', { tam: TS - 8, col: COL.t3, anc: 'end' });
      if (!ocF) s += `<polygon points="${xs(r.fp).toFixed(1)},${yB + 40} ${(xs(r.fp) - 18).toFixed(1)},${yB + 74} ${(xs(r.fp) + 18).toFixed(1)},${yB + 74}" fill="${COL.texto}"/>`;
      b.svg.innerHTML = s;
      b.set('fp', f(r.fp, 3), r.fp < FP.FP_MIN ? 'mal' : 'ok');
      b.set('pct', f(r.pct, 1) + ' %');
      b.set('rec', 'Bs ' + miles(r.bs), r.bs > 0 ? 'mal' : 'ok');
      if (b.oculto('rec') && b.tiles.pct) b.tiles.pct.b.textContent = '?';
    };
    b.pintar();
    return api(b, e, () => { b.sliders.kwh.fijar(e.kwh); b.sliders.kvarh.fijar(e.kvarh); });
  };

  // ============================================================
  // D8 · Armónicos: FP de desplazamiento vs FP verdadero
  // ============================================================
  D.armonicos = (cont, opc) => {
    const b = base(cont, opc);
    const e = { phi: ini(opc, 'phi', 10), thd: ini(opc, 'thd', 80) };
    b.tile('dpf', 'Cosfímetro (cos φ₁)');
    b.tile('thd', 'THD de corriente');
    b.tile('tpf', 'Analizador (FP real)', true);
    b.slider({ id: 'phi', etiqueta: 'Desfase φ₁', min: 0, max: 60, paso: 1, valor: e.phi, formato: (v) => v + '°', alMover: (v) => { e.phi = v; } });
    b.slider({ id: 'thd', etiqueta: 'Distorsión THD', min: 0, max: 120, paso: 5, valor: e.thd, formato: (v) => v + ' %', alMover: (v) => { e.thd = v; } });
    const pre = (p, t) => () => { e.phi = p; e.thd = t; b.sliders.phi.fijar(p); b.sliders.thd.fijar(t); };
    b.botones([{ texto: 'Motor', accion: pre(35, 5) }, { texto: 'Variador', accion: pre(8, 45) }, { texto: 'Fuente sin PFC', accion: pre(5, 110) }]);

    const x0 = 80, x1 = 975, y0 = 300;
    b.pintar = () => {
      const ph = e.phi * RAD, thd = e.thd / 100;
      const a3 = thd * 0.8, a5 = thd * 0.6;
      const pico = 1 + a3 + a5;
      const Ai = 190 / pico;
      const N = 320;
      let pv = '', pi = '', pf = '';
      for (let k = 0; k <= N; k++) {
        const th = (k / N) * 4 * Math.PI;
        const x = (x0 + (k / N) * (x1 - x0)).toFixed(1);
        const u = th - ph;
        pv += (k ? 'L' : 'M') + x + ',' + (y0 - 190 * Math.sin(th)).toFixed(1);
        pi += (k ? 'L' : 'M') + x + ',' + (y0 - Ai * (Math.sin(u) - a3 * Math.sin(3 * u) + a5 * Math.sin(5 * u))).toFixed(1);
        pf += (k ? 'L' : 'M') + x + ',' + (y0 - Ai * Math.sin(u)).toFixed(1);
      }
      let s = '';
      s += lin(x0, y0, x1, y0, COL.borde, 3);
      s += `<path d="${pv}" fill="none" stroke="${COL.v}" stroke-width="5" opacity=".75"/>`;
      s += `<path d="${pf}" fill="none" stroke="${COL.i}" stroke-width="4" stroke-dasharray="12 10" opacity=".6"/>`;
      s += `<path d="${pi}" fill="none" stroke="${COL.i}" stroke-width="8"/>`;
      s += txt(x0, 62, 'v(t)', { anc: 'start', col: COL.v, peso: 700 });
      s += txt(x0 + 140, 62, 'i(t) real', { anc: 'start', col: COL.i, peso: 700 });
      s += txt(x0 + 400, 62, '- - fundamental', { anc: 'start', tam: TS, col: COL.i, peso: 500 });
      b.svg.innerHTML = s;
      const dpf = Math.cos(ph), fd = 1 / Math.sqrt(1 + thd * thd), tpf = dpf * fd;
      b.set('dpf', f(dpf, 2));
      b.set('thd', f(e.thd, 0) + ' %');
      b.set('tpf', f(tpf, 2), tpf < 0.85 ? 'mal' : tpf < 0.95 ? 'duda' : 'ok');
    };
    b.pintar();
    return api(b, e, () => { b.sliders.phi.fijar(e.phi); b.sliders.thd.fijar(e.thd); });
  };
})();
