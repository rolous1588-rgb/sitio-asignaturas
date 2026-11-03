// ============================================================
// GRAFCET: etapas, transiciones, acciones y reglas de evolución.
// Pestañas: nivel1 (en palabras), nivel2 (con símbolos), reglas (las 5 reglas), lee (lee y predice)
// Atajos: grafcet_nivel1, grafcet_nivel2, grafcet_reglas (empieza en la regla 1), grafcet_reglas4 (regla 4), grafcet_lee
// Blanco y negro, con verde para lo que está activo (pedido del docente, 03/11/2026).
// Exporta PL.grafcet: escenas, evolucionar, dibujar, svgEstatico (los usa el Reto F).
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  II.diagramas = II.diagramas || {};
  const PL = (II.pl = II.pl || {});

  const VERDE = '#2BD65B', TV = '#04260F', INK = 'var(--texto)', FONDO = 'var(--superficie)';
  let NID = 0;
  const ln = (x1, y1, x2, y2, w) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="${w || 1.5}"/>`;
  const tx = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || 'middle'}" dominant-baseline="central" style="font:${o.f === 0 ? 500 : 700} ${o.z || 14}px Inter,sans-serif;fill:${o.c || INK}">${s}</text>`;
  const caja = (x, y, t, on, init) => {
    const f = on ? VERDE : FONDO;
    return `<rect x="${x - 25}" y="${y - 18}" width="50" height="36" rx="2" stroke="${INK}" stroke-width="1.5" style="fill:${f}"/>` +
      (init ? `<rect x="${x - 20}" y="${y - 13}" width="40" height="26" rx="2" stroke="${INK}" stroke-width="1.5" style="fill:${f}"/>` : '') +
      tx(x, y, t, { c: on ? TV : INK });
  };
  const marcador = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#16202c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>`;
  const boton = (id, t, extra = '') => `<button type="button" class="boton" ${id ? `data-b="${id}"` : ''} ${extra}>${t}</button>`;
  const lista = (a) => a.join(' y ');

  // ============================================================
  // MOTOR: validación, franqueo y evolución (reglas 2 a 4)
  // ============================================================
  const calc = (sc, act, inp) => sc.trans.map((t) => {
    const v = t.from.every((f) => act[f]), c = !!inp[t.in];
    return { t, val: v, cond: c, fire: v && c };
  });
  const aplicar = (act, fs) => {
    const des = {}, ac = {};
    fs.forEach((k) => { k.t.from.forEach((f) => { des[f] = 1; }); k.t.to.forEach((f) => { ac[f] = 1; }); });
    const n = { ...act };
    Object.keys(des).forEach((i) => { if (!ac[i]) n[i] = false; });
    Object.keys(ac).forEach((i) => { n[i] = true; });
    return n;
  };
  const inicial = (sc) => { const a = {}; sc.steps.forEach((s) => { a[s.id] = !!s.init; }); return a; };
  const activos = (sc, act) => sc.steps.filter((s) => act[s.id]).map((s) => s.id);
  const evolucionar = (sc, a0, inp, max = 8) => {
    let a = { ...a0 }; const rondas = []; let estable = false;
    for (let i = 0; i < max; i++) {
      const fs = calc(sc, a, inp).filter((k) => k.fire);
      if (!fs.length) { estable = true; break; }
      rondas.push(fs.map((k) => k.t.in)); a = aplicar(a, fs);
    }
    return { act: a, rondas, estable };
  };

  // ============================================================
  // DIBUJO de una escena (etapas, transiciones, dobles barras, acciones)
  // ============================================================
  const etq = (t) => t.lab || t.in;
  const dibujar = (sc, act, inp, mid) => {
    let o = marcador(mid);
    (sc.lines || []).forEach((l) => { o += ln(l[0], l[1], l[2], l[3]); });
    (sc.paths || []).forEach((p) => { o += `<path d="${p}" fill="none" stroke="${INK}" stroke-width="1.5" marker-end="url(#${mid})"/>`; });
    (sc.dbl || []).forEach((l) => { o += ln(l[0], l[1], l[2], l[3], 2.5); });
    const st = (id) => sc.steps.filter((s) => s.id === id)[0];
    calc(sc, act, inp).forEach((k) => {
      const t = k.t, xt = t.xt != null ? t.xt : st(t.from[0]).x, ys = t.y;
      if (t.xt == null) {
        t.from.forEach((f) => { const s = st(f); o += ln(s.x, s.y + 18, s.x, ys); });
        t.to.forEach((f) => { const s = st(f); o += ln(s.x, ys, s.x, s.y - 18); });
      }
      const col = k.cond ? VERDE : INK;
      o += `<line x1="${xt - 24}" y1="${ys}" x2="${xt + 24}" y2="${ys}" stroke="${col}" stroke-width="${k.cond ? 4 : 3}"/>`;
      const lab = etq(t), w = Math.max(34, 14 + 9 * lab.replace(/<[^>]+>/g, '').length);
      const rx = t.l ? xt - 24 - 12 - w : xt + 24 + 12, cx = rx + w / 2;
      o += `<rect x="${rx}" y="${ys - 14}" width="${w}" height="28" rx="4" style="fill:${k.cond ? VERDE : 'none'}"/>`;
      o += tx(cx, ys, lab, { c: k.cond ? TV : INK });
      if (t.bar) o += `<line x1="${cx - w / 2 + 8}" y1="${ys - 10}" x2="${cx + w / 2 - 8}" y2="${ys - 10}" stroke="${k.cond ? TV : INK}" stroke-width="1.5"/>`;
      if (k.val && !k.cond && !sc.sinVal) o += tx(t.l ? rx - 8 : rx + w + 8, ys, 'validada', { a: t.l ? 'end' : 'start', z: 12, f: 0 });
    });
    sc.steps.forEach((s) => {
      o += caja(s.x, s.y, s.id, act[s.id], s.init);
      if (s.acc) {
        const on = act[s.id];
        o += ln(s.x + 25, s.y, s.x + 55, s.y);
        o += `<rect x="${s.x + 55}" y="${s.y - 18}" width="${s.accW || 190}" height="36" rx="2" stroke="${INK}" stroke-width="1.5" style="fill:${on ? VERDE : FONDO}"/>`;
        o += tx(s.x + 55 + (s.accW || 190) / 2, s.y, s.acc, { c: on ? TV : INK, z: 13 });
      }
      if (s.nom) o += tx(s.x - 38, s.y, s.nom, { a: 'end', z: 12, f: 0 });
    });
    return o;
  };
  const svgDe = (sc, act, inp, mid) => `<svg viewBox="0 0 680 ${sc.H}" style="width:100%;height:auto;max-height:${Math.min(sc.H + 40, 460)}px" role="img" aria-label="GRAFCET">${dibujar(sc, act, inp, mid)}</svg>`;
  const svgEstatico = (sc, act) => svgDe(sc, act || inicial(sc), {}, 'gfe' + (++NID));

  // ============================================================
  // ESCENAS
  // ============================================================
  const ESC = {};
  ESC.reglas = [
    { r: '<b>Regla 1 · Situación inicial.</b> Al arrancar, las etapas iniciales (cuadrado doble) están activas y todas las demás inactivas.',
      h: 'Presiona la transición A: la etapa 0 se apaga y se activa la 1. Luego pulsa Reiniciar para volver a la situación inicial.', H: 250,
      steps: [{ id: '0', x: 340, y: 50, init: 1 }, { id: '1', x: 340, y: 190 }], trans: [{ in: 'A', from: ['0'], to: ['1'], y: 120 }] },
    { r: '<b>Regla 2 · Franqueo de una transición.</b> Una transición está <b>validada</b> cuando todas las etapas anteriores están activas. Se <b>franquea</b> si, además, se presiona (su condición es verdadera). Es una secuencia: no se puede saltar.',
      h: 'Con la etapa 0 activa, presiona la transición B: se enciende, pero no pasa nada, porque primero debe estar activa la etapa 1. Luego presiona A y después B.', H: 380,
      steps: [{ id: '0', x: 340, y: 50, init: 1 }, { id: '1', x: 340, y: 190 }, { id: '2', x: 340, y: 330 }],
      trans: [{ in: 'A', from: ['0'], to: ['1'], y: 120 }, { in: 'B', from: ['1'], to: ['2'], y: 260 }] },
    { r: '<b>Regla 3 · Divergencia en Y (simultáneas).</b> La doble barra significa que, con la etapa 0 activa, al franquearse la transición A se activan <b>a la vez</b> las etapas 1 y 2. La doble barra de abajo espera que <b>las dos</b> estén activas para que B active la etapa 3.',
      h: 'Presiona B con la etapa 0 activa: se enciende, pero no pasa nada. Luego presiona A: se activan 1 y 2 a la vez. Después B: se activa la etapa 3 porque las dos etapas están activas.', H: 400,
      steps: [{ id: '0', x: 340, y: 50, init: 1 }, { id: '1', x: 280, y: 190 }, { id: '2', x: 400, y: 190 }, { id: '3', x: 340, y: 340 }],
      trans: [{ in: 'A', from: ['0'], to: ['1', '2'], y: 100, xt: 340 }, { in: 'B', from: ['1', '2'], to: ['3'], y: 290, xt: 340 }],
      lines: [[340, 68, 340, 100], [340, 100, 340, 135], [280, 141, 280, 172], [400, 141, 400, 172], [280, 208, 280, 244], [400, 208, 400, 244], [340, 250, 340, 290], [340, 290, 340, 322]],
      dbl: [[250, 135, 430, 135], [250, 141, 430, 141], [250, 244, 430, 244], [250, 250, 430, 250]] },
    { r: '<b>Regla 4 · Divergencia en O (selección).</b> Desde la etapa 0 hay dos caminos: según qué transición se presione, A o B, se activa solo la etapa 1 o solo la 2. Luego C o D llevan cada rama a la etapa 3.',
      h: 'A y B son excluyentes: al presionar una, la otra se suelta. Elige A o B y luego presiona la transición de esa rama (C o D). Si presionas la de la otra rama, se enciende, pero no pasa nada.', H: 400,
      steps: [{ id: '0', x: 340, y: 50, init: 1 }, { id: '1', x: 280, y: 190 }, { id: '2', x: 400, y: 190 }, { id: '3', x: 340, y: 340 }],
      trans: [{ in: 'A', from: ['0'], to: ['1'], y: 130, xt: 280, l: 1 }, { in: 'B', from: ['0'], to: ['2'], y: 130, xt: 400 },
        { in: 'C', from: ['1'], to: ['3'], y: 250, xt: 280, l: 1 }, { in: 'D', from: ['2'], to: ['3'], y: 250, xt: 400 }],
      excl: [['A', 'B']],
      lines: [[340, 68, 340, 100], [280, 100, 400, 100], [280, 100, 280, 130], [400, 100, 400, 130], [280, 130, 280, 172], [400, 130, 400, 172], [280, 208, 280, 250], [400, 208, 400, 250], [280, 250, 280, 290], [400, 250, 400, 290], [280, 290, 400, 290], [340, 290, 340, 322]] },
    { r: '<b>Regla 5 · Alternancia.</b> Entre dos etapas siempre hay una transición, y entre dos transiciones siempre hay una etapa. Nunca dos etapas seguidas ni dos transiciones seguidas.',
      h: 'Compara el esquema correcto con los dos errores más comunes.', H: 380, estatica: 1, steps: [], trans: [] }
  ];
  // una estación de llenado para «Lee y predice»
  ESC.lee = {
    H: 470, steps: [
      { id: '0', x: 300, y: 50, init: 1, acc: '', nom: 'Reposo' },
      { id: '1', x: 300, y: 190, acc: 'KM1 = 1 (bomba)', nom: 'Llenando' },
      { id: '2', x: 300, y: 330, acc: 'H1 = 1 (lleno)', nom: 'Lleno' }],
    trans: [{ in: 'PA', from: ['0'], to: ['1'], y: 120 }, { in: 'LSH', from: ['1'], to: ['2'], y: 260 }, { in: 'PP', lab: 'PP', bar: 1, from: ['2'], to: ['0'], y: 400, xt: 300 }],
    lines: [[300, 348, 300, 400]],
    paths: ['M300 400V440H150V20H300V32']
  };
  ESC.lee.steps[0].acc = '';
  delete ESC.lee.steps[0].acc;

  PL.grafcet = { escenas: ESC, calc, aplicar, inicial, activos, evolucionar, dibujar, svgEstatico, svgDe };

  // ============================================================
  // Escena interactiva reutilizable (reglas y lee)
  // ============================================================
  const nuevaEscena = (sc, svgEl, statEl, alCambiar) => {
    const mid = 'gfi' + (++NID);
    const E = { sc, act: inicial(sc), inp: {}, busy: false, tok: 0, fired: {} };
    sc.trans.forEach((t) => { E.inp[t.in] = 0; });
    E.draw = () => { svgEl.setAttribute('viewBox', `0 0 680 ${sc.H}`); svgEl.innerHTML = dibujar(sc, E.act, E.inp, mid); if (alCambiar) alCambiar(); };
    E.msg = (h) => { statEl.innerHTML = h; };
    E.reiniciar = () => { E.tok += 1; E.busy = false; E.act = inicial(sc); Object.keys(E.inp).forEach((k) => { E.inp[k] = 0; }); E.draw(); E.msg('Situación inicial: etapas activas ' + lista(activos(sc, E.act)) + '. Ninguna transición está presionada.'); };
    E.terminar = (msgs) => {
      const extra = [];
      calc(sc, E.act, E.inp).forEach((k) => {
        const n = etq(k.t).replace(/<[^>]+>/g, '');
        if (k.cond && !k.val && !E.fired[n]) extra.push('La transición <b>' + n + '</b> está presionada y se enciende, pero no pasa nada: no está validada, porque ' + (k.t.from.length > 1 ? 'no están activas las etapas ' : 'no está activa la etapa ') + lista(k.t.from) + '.');
      });
      E.msg(msgs.concat(extra).concat(['<b>Situación estable. Etapas activas: ' + (activos(sc, E.act).join(', ') || 'ninguna') + '.</b>']).join('<br>'));
    };
    E.run = (msgs, n) => {
      if (E.busy && !n) return;
      E.busy = true; const tk = E.tok; n = n || 0; if (!n) E.fired = {};
      const fs = calc(sc, E.act, E.inp).filter((k) => k.fire);
      E.draw();
      if (!fs.length) { E.busy = false; E.terminar(msgs); return; }
      if (n >= 8) { E.busy = false; E.msg(msgs.concat(['<b>El GRAFCET no llega a una situación estable con estas condiciones presionadas: suelta alguna.</b>']).join('<br>')); return; }
      fs.forEach((k) => { E.fired[etq(k.t).replace(/<[^>]+>/g, '')] = 1; });
      E.msg(msgs.concat(['Se franquea la transición <b>' + fs.map((k) => etq(k.t).replace(/<[^>]+>/g, '')).join('</b> y <b>') + '</b>: estaba validada y se presionó.']).join('<br>'));
      setTimeout(() => {
        if (tk !== E.tok) return;
        E.act = aplicar(E.act, fs);
        const m = fs.length > 1 ? 'Se franquearon ' + fs.length + ' transiciones a la vez.' : 'Se desactivaron las etapas anteriores y se activaron las siguientes a la vez.';
        E.draw();
        setTimeout(() => { if (tk !== E.tok) return; E.run(msgs.concat([m]), n + 1); }, 650);
      }, 700);
    };
    E.fijar = (act, inp) => { E.tok += 1; E.busy = false; E.act = { ...act }; Object.keys(E.inp).forEach((k) => { E.inp[k] = 0; }); Object.keys(inp || {}).forEach((k) => { E.inp[k] = inp[k]; }); };
    return E;
  };

  // ============================================================
  // 1 y 2 · La bomba: nivel 1 (palabras) y nivel 2 (símbolos)
  // ============================================================
  const bomba = (r, nivel) => {
    const mid = 'gfb' + (++NID);
    const s = { E1: false, busy: false, lit: { 1: false, 2: false }, bit: { PA: 0, PP: 1 }, t0: { arr: 0, paro: 0 }, msg: '' };
    const dx = 160;
    r.innerHTML = `<div class="lienzo"><svg viewBox="0 0 680 360" role="img" aria-label="GRAFCET de la bomba de llenado"></svg></div>
      <div class="controles" style="margin:10px 0;display:flex;flex-wrap:wrap;gap:10px">${boton('arr', 'Pulsador de arranque (NA)', 'style="touch-action:manipulation"')}${boton('paro', 'Pulsador de paro (NC)', 'style="touch-action:manipulation"')}</div>
      <div data-rol="bits" style="font-family:var(--mono);font-size:.95rem"></div><div data-rol="msg" style="color:var(--texto-2);min-height:64px;margin-top:6px;line-height:1.55"></div>`;
    const svg = r.querySelector('svg');
    const dib = () => {
      const l1 = s.lit[1], l2 = s.lit[2];
      let o = marcador(mid);
      o += `<path d="M${180 + dx} 84V280" fill="none" stroke="${INK}" stroke-width="1.5"/>`;
      o += `<path d="M${180 + dx} 280V330H${60 + dx}V20H${180 + dx}V40" fill="none" stroke="${INK}" stroke-width="1.5" marker-end="url(#${mid})"/>`;
      const bw = nivel === 1 ? [250, 215] : [50, 50];
      const tr = (n, y, t, lit, bar) => {
        const x = 220 + dx;
        let q = `<rect x="${x - 10}" y="${y - 16}" width="${bw[n - 1]}" height="32" rx="4" style="fill:${lit ? VERDE : 'none'}"/>`;
        q += `<line x1="${160 + dx}" y1="${y}" x2="${200 + dx}" y2="${y}" stroke="${lit ? VERDE : INK}" stroke-width="${lit ? 6 : 4}"/>`;
        q += tx(x, y + 2, t, { a: 'start', c: lit ? TV : INK });
        if (bar && nivel === 2) q += `<line x1="${x}" y1="${y - 10}" x2="${x + 22}" y2="${y - 10}" stroke="${lit ? TV : INK}" stroke-width="1.5"/>`;
        return q;
      };
      o += tr(1, 140, nivel === 1 ? 'Pulsador de arranque (NA)' : 'PA', l1, false);
      o += tr(2, 290, nivel === 1 ? 'Pulsador de paro (NC)' : 'PP', l2, true);
      o += caja(180 + dx, 62, '0', !s.E1, true);
      o += caja(180 + dx, 212, '1', s.E1, false);
      o += ln(210 + dx, 212, 240 + dx, 212);
      o += `<rect x="${240 + dx}" y="192" width="190" height="40" rx="2" stroke="${INK}" stroke-width="1.5" style="fill:${s.E1 ? VERDE : FONDO}"/>` + tx(335 + dx, 212, 'KM1 = 1 (bomba)', { c: s.E1 ? TV : INK });
      o += tx(150 + dx - 8, 62, 'Reposo', { a: 'end', z: 12, f: 0 }) + tx(150 + dx - 8, 212, 'Llenando', { a: 'end', z: 12, f: 0 });
      svg.innerHTML = o;
      r.querySelector('[data-rol=bits]').innerHTML = `PA = ${s.bit.PA} &nbsp; PP = ${s.bit.PP}<div style="font-family:Inter,sans-serif;font-size:.85rem;color:var(--texto-2);margin-top:2px">` +
        (nivel === 2 ? 'PA: pulsador de arranque (NA; en reposo vale 0). PP: pulsador de paro (NC; en reposo vale 1). La condición de paro es <span style="text-decoration:overline">PP</span> (PP negado): se cumple cuando PP vale 0.'
          : 'El contacto NC del paro, en reposo, deja pasar corriente: su bit vale 1. Al pulsarlo se abre y el bit baja a 0.') + '</div>';
      r.querySelector('[data-rol=msg]').innerHTML = s.msg;
    };
    const soltar = (n) => {
      const k = n === 'arr' ? 'PA' : 'PP'; s.bit[k] = n === 'arr' ? 0 : 1;
      const dt = Date.now() - s.t0[n];
      setTimeout(() => { s.lit[n === 'arr' ? 1 : 2] = false; dib(); }, Math.max(0, 900 - dt)); dib();
    };
    const pulsar = (n) => {
      if (s.busy) return;
      s.t0[n] = Date.now();
      if (n === 'arr') s.bit.PA = 1; else s.bit.PP = 0;
      if (n === 'arr') {
        if (s.E1) { s.msg = 'La etapa 1 ya está activa: el pulsador de arranque no tiene efecto. La transición que espera ahora es la del paro.'; dib(); return; }
        s.busy = true; s.lit[1] = true;
        s.msg = 'Se presionó el pulsador de arranque: PA vale 1, la transición está habilitada y su condición se cumple, así que se franquea.'; dib();
        setTimeout(() => { s.E1 = true; s.busy = false; s.msg = 'La etapa 0 se apagó y se activó la etapa 1: la bomba arranca (KM1 = 1). Ahora espera el pulsador de paro.'; dib(); }, 450);
      } else {
        if (!s.E1) { s.msg = 'Estamos en reposo: el paro NC se abrió (PP vale 0), pero la etapa 0 no tiene una transición que espere el paro.'; dib(); return; }
        s.busy = true; s.lit[2] = true;
        s.msg = 'Se presionó el pulsador de paro: su contacto NC se abrió y PP vale 0, así que ' + (nivel === 2 ? '<span style="text-decoration:overline">PP</span>' : 'la condición de paro') + ' se cumple y la transición se franquea.'; dib();
        setTimeout(() => { s.E1 = false; s.busy = false; s.msg = 'La etapa 1 se apagó y se activó otra vez la etapa 0: la bomba se detiene (KM1 = 0). Vuelve a esperar el arranque.'; dib(); }, 450);
      }
    };
    const ligar = (n) => {
      const b = r.querySelector(`[data-b=${n}]`);
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); pulsar(n); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, () => { if ((n === 'arr' && s.bit.PA) || (n === 'paro' && !s.bit.PP)) soltar(n); }));
      b.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); pulsar(n); } });
      b.addEventListener('keyup', (e) => { if (e.key === 'Enter' || e.key === ' ') soltar(n); });
    };
    ligar('arr'); ligar('paro');
    s.msg = 'Empezamos en reposo: la etapa 0 (inicial) está activa y la bomba está parada. Presiona el pulsador de arranque.';
    dib();
  };

  // ============================================================
  // 3 · Las reglas de evolución
  // ============================================================
  const alternancia = () => {
    let o = '';
    const bar = (x, y) => ln(x - 24, y, x + 24, y, 3);
    o += caja(120, 50, '1', 0) + ln(120, 68, 120, 110) + bar(120, 110) + ln(120, 110, 120, 172) + caja(120, 190, '2', 0) + ln(120, 208, 120, 250) + bar(120, 250) + ln(120, 250, 120, 292) + caja(120, 310, '3', 0);
    o += tx(120, 355, 'Correcto', { z: 14 });
    o += caja(340, 50, '1', 0) + ln(340, 68, 340, 172) + caja(340, 190, '2', 0) + ln(376, 100, 404, 128, 2) + ln(404, 100, 376, 128, 2);
    o += tx(340, 260, 'Incorrecto', { z: 14 }) + tx(340, 282, 'dos etapas seguidas', { z: 12, f: 0 });
    o += caja(560, 50, '1', 0) + ln(560, 68, 560, 100) + bar(560, 100) + ln(560, 100, 560, 130) + bar(560, 130) + ln(560, 130, 560, 172) + caja(560, 190, '2', 0) + ln(600, 90, 628, 118, 2) + ln(628, 90, 600, 118, 2);
    o += tx(560, 260, 'Incorrecto', { z: 14 }) + tx(560, 282, 'dos transiciones seguidas', { z: 12, f: 0 });
    return o;
  };
  const reglas = (r, ini) => {
    let cur = ini || 0, E = null;
    r.innerHTML = `<div data-rol="sel" style="display:flex;flex-wrap:wrap;gap:8px;margin:0 0 10px"></div>
      <div data-rol="regla" style="line-height:1.6;margin-bottom:6px"></div><div data-rol="hint" class="nota" style="margin-bottom:6px"></div>
      <div class="lienzo"><svg viewBox="0 0 680 330" role="img" aria-label="GRAFCET de la regla seleccionada"></svg></div>
      <div data-rol="ctl" style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0"></div>
      <div data-rol="stat" style="color:var(--texto-2);line-height:1.55;min-height:90px"></div>`;
    const $ = (k) => r.querySelector(`[data-rol=${k}]`), svg = r.querySelector('svg');
    const ctl = () => {
      const sc = ESC.reglas[cur]; let h = '';
      const ins = []; sc.trans.forEach((t) => { if (ins.indexOf(t.in) < 0) ins.push(t.in); });
      ins.forEach((i) => { h += `<button type="button" class="boton" data-i="${i}">Transición ${i}: ${E.inp[i] ? 'presionada' : 'suelta'}</button>`; });
      if (!sc.estatica) h += '<button type="button" class="boton" data-rol="rei">Reiniciar</button>';
      $('ctl').innerHTML = h;
      $('ctl').querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
        const i = b.dataset.i; E.inp[i] = E.inp[i] ? 0 : 1;
        if (E.inp[i]) (sc.excl || []).forEach((g) => { if (g.indexOf(i) >= 0) g.forEach((j) => { if (j !== i) E.inp[j] = 0; }); });
        ctl(); E.run([]);
      }));
      const rei = $('ctl').querySelector('[data-rol=rei]'); if (rei) rei.onclick = () => { E.reiniciar(); ctl(); };
    };
    const sel = () => {
      $('sel').innerHTML = ESC.reglas.map((s, i) => `<button type="button" class="boton${i === cur ? ' primario' : ''}" data-r="${i}">Regla ${i + 1}</button>`).join('');
      $('sel').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { cur = +b.dataset.r; cargar(); }));
    };
    const cargar = () => {
      const sc = ESC.reglas[cur]; sel();
      $('regla').innerHTML = sc.r; $('hint').textContent = sc.h;
      if (sc.estatica) {
        E = { inp: {}, tok: 0, run() {} };
        svg.setAttribute('viewBox', '0 0 680 380'); svg.innerHTML = alternancia();
        $('stat').innerHTML = 'Cómo se corrige: entre las dos etapas seguidas se agrega una transición con su condición; entre las dos transiciones seguidas se agrega una etapa.';
        ctl(); return;
      }
      if (E && E.tok != null) E.tok += 1;
      E = nuevaEscena(sc, svg, $('stat')); E.reiniciar(); ctl();
    };
    cargar();
  };

  // ============================================================
  // 4 · Lee y predice
  // ============================================================
  const PRED = [
    { t: 'Estás en la situación inicial. Se presiona el pulsador de arranque (PA) y se suelta.', act: ['0'], inp: { PA: 1 } },
    { t: 'Estás en la situación inicial. Se activa el flotador de nivel alto (LSH), sin que nadie haya arrancado la bomba.', act: ['0'], inp: { LSH: 1 } },
    { t: 'La bomba está llenando (etapa 1). Se activa el flotador de nivel alto (LSH).', act: ['1'], inp: { LSH: 1 } },
    { t: 'El tanque está lleno (etapa 2). Se presiona el pulsador de paro (NC): su bit baja a 0 y PP negado se cumple.', act: ['2'], inp: { PP: 1 } },
    { t: 'Estás en reposo y el pulsador de arranque (PA) y el flotador LSH están presionados a la vez, y se mantienen así.', act: ['0'], inp: { PA: 1, LSH: 1 } }
  ];
  const lee = (r) => {
    const sc = ESC.lee; let k = 0, ok = 0, respondidas = 0, respondido = false;
    r.innerHTML = `<div class="nota" style="margin-bottom:6px">Condiciones: PA = pulsador de arranque (NA); LSH = flotador de nivel alto (NA); <span style="text-decoration:overline">PP</span> = pulsador de paro (NC), que se cumple cuando se pulsa.</div>
      <div class="lienzo"><svg viewBox="0 0 680 470" role="img" aria-label="GRAFCET de una estación de llenado"></svg></div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0" data-rol="ctl">
        <button type="button" class="boton" data-i="PA"></button><button type="button" class="boton" data-i="LSH"></button><button type="button" class="boton" data-i="PP"></button>
        <button type="button" class="boton" data-rol="rei">Reiniciar</button></div>
      <div data-rol="stat" style="color:var(--texto-2);line-height:1.55;min-height:70px"></div>
      <div class="aviso info" style="margin-top:14px" data-rol="pred"></div>`;
    const E = nuevaEscena(sc, r.querySelector('svg'), r.querySelector('[data-rol=stat]'), () => {
      r.querySelector('[data-i=PA]').textContent = 'PA: ' + (E.inp.PA ? 'presionado' : 'suelto');
      r.querySelector('[data-i=LSH]').textContent = 'LSH: ' + (E.inp.LSH ? 'activo' : 'inactivo');
      r.querySelector('[data-i=PP]').textContent = 'Paro: ' + (E.inp.PP ? 'presionado' : 'suelto');
    });
    ['PA', 'LSH', 'PP'].forEach((i) => r.querySelector(`[data-i=${i}]`).addEventListener('click', () => { E.inp[i] = E.inp[i] ? 0 : 1; E.draw(); E.run([]); }));
    r.querySelector('[data-rol=rei]').onclick = () => E.reiniciar();
    E.reiniciar();
    const pred = r.querySelector('[data-rol=pred]');
    const mostrar = () => {
      const p = PRED[k]; respondido = false;
      pred.innerHTML = `<b>Predice ${k + 1} de ${PRED.length}.</b> ${p.t}<div style="margin:10px 0;display:flex;flex-wrap:wrap;gap:8px">
        ${['0', '1', '2'].map((e) => `<button type="button" class="boton" data-e="${e}">Queda activa la etapa ${e}</button>`).join('')}</div><div data-rol="res"></div>`;
      pred.querySelectorAll('[data-e]').forEach((b) => b.addEventListener('click', () => responder(b.dataset.e)));
    };
    const responder = (e) => {
      if (respondido) return; respondido = true; respondidas += 1;
      const p = PRED[k], a0 = {}; sc.steps.forEach((s) => { a0[s.id] = p.act.indexOf(s.id) >= 0; });
      const ev = evolucionar(sc, a0, p.inp), fin = activos(sc, ev.act);
      const bien = fin.length === 1 && fin[0] === e; if (bien) ok += 1;
      const res = pred.querySelector('[data-rol=res]');
      res.innerHTML = `<div class="aviso ${bien ? 'ok' : 'mal'}" style="margin:0 0 8px"><b>${bien ? 'Correcto.' : 'No exactamente.'}</b> Queda activa la etapa ${fin.join(', ')}. ${ev.rondas.length ? 'Se franqueó ' + ev.rondas.map((x) => 'la transición ' + x.join(' y ').replace('PP', 'de paro')).join(' y luego ') + '.' : 'Ninguna transición se franqueó: la transición con la condición presionada no estaba validada.'}</div>
        <button type="button" class="boton chico" data-rol="ver">Verlo en el diagrama</button> <button type="button" class="boton chico primario" data-rol="sig">${k + 1 < PRED.length ? 'Siguiente predicción' : 'Terminar (' + ok + ' de ' + PRED.length + ' bien)'}</button>`;
      res.querySelector('[data-rol=ver]').onclick = () => { E.fijar(a0, p.inp); E.draw(); E.run(['Escenario: ' + p.t]); };
      res.querySelector('[data-rol=sig]').onclick = () => { if (k + 1 < PRED.length) { k += 1; mostrar(); } else { pred.innerHTML = `<b>Terminaste las ${PRED.length} predicciones: ${ok} bien.</b> <button type="button" class="boton chico" data-rol="otra">Repetir</button>`; pred.querySelector('[data-rol=otra]').onclick = () => { k = 0; ok = 0; respondidas = 0; mostrar(); }; } };
    };
    mostrar();
  };

  // ============================================================
  // Diagrama con pestañas
  // ============================================================
  II.diagramas.grafcet = (cont, opts = {}) => {
    cont.classList.add('diagrama');
    const defs = [{ id: 'nivel1', t: '1 · Nivel 1: palabras' }, { id: 'nivel2', t: '2 · Nivel 2: símbolos' }, { id: 'reglas', t: '3 · Reglas de evolución' }, { id: 'lee', t: '4 · Lee y predice' }];
    const mapa = { reglas1: 'reglas', reglas4: 'reglas' };
    const ini = mapa[opts.pestana] || (defs.some((d) => d.id === opts.pestana) ? opts.pestana : 'nivel1');
    const T = PL.pestanas(cont, defs, ini);
    bomba(T.raiz('nivel1'), 1);
    bomba(T.raiz('nivel2'), 2);
    reglas(T.raiz('reglas'), opts.pestana === 'reglas4' ? 3 : 0);
    lee(T.raiz('lee'));
    return { destruir() {}, pestana: T.pestana };
  };
  ['nivel1', 'nivel2', 'reglas', 'lee'].forEach((id) => { II.diagramas['grafcet_' + id] = (cont, o = {}) => II.diagramas.grafcet(cont, { ...o, pestana: id }); });
  II.diagramas.grafcet_reglas4 = (cont, o = {}) => II.diagramas.grafcet(cont, { ...o, pestana: 'reglas4' });
})();
