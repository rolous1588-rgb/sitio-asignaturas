// ============================================================
// El semáforo: enunciado, componentes, GRAFCET nivel 1 (con modo automático) y nivel 2.
// Pestañas: enunciado, componentes, nivel1, nivel2. Atajos: semaforo_enunciado, semaforo_componentes, semaforo_nivel1, semaforo_nivel2
// Borrador aprobado en chat el 03/11/2026. Blanco y negro; verde #2BD65B para lo activo.
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  II.diagramas = II.diagramas || {};
  const PL = (II.pl = II.pl || {});
  const G = '#2BD65B', TV = '#04260F', INK = 'var(--texto)', FON = 'var(--superficie)';
  let NID = 0;
  const DUR = { 1: 5, 2: 2, 3: 5 };
  const TR = [
    { id: 'a', t: 1, x: 300, y: 110 }, { id: 'b', t: 2, x: 300, y: 230 }, { id: 'c', t: 3, x: 300, y: 350 },
    { id: 'd', t: 1, x: 230, y: 490, l: 1 }, { id: 'e', t: 0, x: 400, y: 490 }];
  const L1 = { a: ['Pulsador de arranque (NA)'], b: ['Pasaron 5 s'], c: ['Pasaron 2 s'], d: ['Pasaron 5 s'], e: ['Pulsador de', 'paro (NC)'] };
  const L2 = { a: ['PA'], b: ['T1 = 5 s'], c: ['T2 = 2 s'], d: ['T3 = 5 s'], e: ['~PP~'] };
  const NOM = ['Reposo', 'Verde', 'Amarillo', 'Rojo'];
  const AC1 = ['', 'Encender luz verde', 'Encender luz amarilla', 'Encender luz roja'];
  const AC2 = ['', 'H1 = 1', 'H2 = 1', 'H3 = 1'];
  const MSG = {
    a: 'Se apagó la etapa 0 y se activó la etapa 1: luz verde.', b: 'Pasaron 5 s: se activó la etapa 2, luz amarilla.',
    c: 'Pasaron 2 s: se activó la etapa 3, luz roja.', d: 'Pasaron 5 s: vuelve a la etapa 1, luz verde.',
    e: 'Se presionó el pulsador de paro antes de terminar la cuenta: todo se apagó, el temporizador se detuvo y se volvió a la etapa 0.'
  };
  const esc = (s) => s.replace(/~/g, '');
  const ln = (a, b, c, d, w) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${INK}" stroke-width="${w || 1.5}"/>`;
  const tx = (x, y, s, o = {}) => {
    const p = s.split('~'); let h = '';
    p.forEach((q, i) => { h += `<tspan${i % 2 ? ' text-decoration="overline" style="text-decoration:overline"' : ''}>${q}</tspan>`; });
    return `<text x="${x}" y="${y}" text-anchor="${o.a || 'middle'}" dominant-baseline="central" style="font:${o.w || 500} ${o.z || 14}px Inter,sans-serif;fill:${o.c || INK}">${h}</text>`;
  };
  const caja = (x, y, t, on, ini) => {
    let o = `<rect x="${x - 25}" y="${y - 18}" width="50" height="36" rx="2" stroke="${INK}" stroke-width="1.5" style="fill:${on ? G : FON}"/>`;
    if (ini) o += `<rect x="${x - 20}" y="${y - 13}" width="40" height="26" rx="2" stroke="${INK}" stroke-width="1.5" style="fill:${on ? G : FON}"/>`;
    return o + tx(x, y, t, { c: on ? TV : INK });
  };
  const dibujar = (st, n, mid) => {
    const Y = [50, 170, 290, 410];
    let o = `<defs><marker id="${mid}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#16202c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>`;
    o += ln(300, 68, 300, 152) + ln(300, 188, 300, 272) + ln(300, 308, 300, 392) + ln(300, 428, 300, 450) + ln(230, 450, 400, 450) + ln(230, 450, 230, 490) + ln(400, 450, 400, 490);
    o += `<path d="M230 490V540H60V140H300V152" fill="none" stroke="${INK}" stroke-width="1.5" marker-end="url(#${mid})"/>`;
    o += `<path d="M400 490V565H620V20H300V32" fill="none" stroke="${INK}" stroke-width="1.5" marker-end="url(#${mid})"/>`;
    for (let i = 0; i < 4; i++) {
      o += caja(300, Y[i], '' + i, st.s === i, i === 0) + tx(268, Y[i], NOM[i], { a: 'end', z: 13, w: 400 });
      if (i > 0) {
        o += ln(325, Y[i], 355, Y[i]) + `<rect x="355" y="${Y[i] - 18}" width="185" height="36" rx="2" stroke="${INK}" stroke-width="1.5" style="fill:${st.s === i ? G : FON}"/>` + tx(447, Y[i], n === 1 ? AC1[i] : AC2[i], { c: st.s === i ? TV : INK, z: 13 });
      }
    }
    TR.forEach((t) => {
      const on = st.fl === t.id, lines = (n === 1 ? L1 : L2)[t.id];
      let w = 0; lines.forEach((l) => { w = Math.max(w, esc(l).length * 7.4 + 16); });
      o += `<line x1="${t.x - 22}" y1="${t.y}" x2="${t.x + 22}" y2="${t.y}" stroke="${on ? G : INK}" stroke-width="${on ? 6 : 4}"/>`;
      const h = lines.length * 18 + 8, rx = t.l ? t.x - 22 - 10 - w : t.x + 22 + 10;
      o += `<rect x="${rx}" y="${t.y - h / 2}" width="${w}" height="${h}" rx="4" style="fill:${on ? G : 'none'}"/>`;
      lines.forEach((l, k) => { o += tx(rx + w / 2, t.y - (lines.length - 1) * 9 + k * 18, l, { c: on ? TV : INK, z: 13 }); });
    });
    return `<svg viewBox="0 0 680 600" style="width:100%;height:auto;max-height:640px" role="img" aria-label="GRAFCET del semáforo, nivel ${n}">${o}</svg>`;
  };
  const luzSVG = (s) => {
    const c = [['#E24B4A', 3], ['#EF9F27', 2], ['#2BD65B', 1]];
    let o = `<rect x="3" y="3" width="40" height="110" rx="8" style="fill:var(--superficie-2)" stroke="${INK}" stroke-width="1.5"/>`;
    c.forEach((k, i) => { o += `<circle cx="23" cy="${24 + i * 34}" r="12" stroke="${INK}" stroke-width="1" style="fill:${s === k[1] ? k[0] : FON}"/>`; });
    return `<svg width="46" height="116" viewBox="0 0 46 116" aria-label="Semáforo">${o}</svg>`;
  };

  // ---------- GRAFCET interactivo (nivel 1 y 2) ----------
  const grafcet = (r, nivel, vivos) => {
    const st = { s: 0, fl: null, busy: false, auto: false, cnt: 0, iv: null, to: null, counting: false, vivo: true };
    const mid = 'sm' + (++NID);
    r.innerHTML = `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin:0 0 8px">
      <div data-rol="luz"></div>
      <div class="controles" style="display:flex;flex-direction:column;gap:8px;align-items:stretch">
        <button type="button" class="boton" data-b="a">Pulsar arranque</button>
        <button type="button" class="boton" data-b="p">Pulsar paro</button>
        <button type="button" class="boton" data-b="t">Que pasen los segundos</button>
        ${nivel === 1 ? '<button type="button" class="boton primario" data-b="u">Automático</button>' : ''}
      </div>
      <div style="flex:1;min-width:220px"><div data-rol="tmr" style="color:var(--texto-2);font-size:.9rem"></div>
      <div data-rol="msg" style="color:var(--texto-2);line-height:1.55;margin-top:6px"></div></div></div>
      <div class="lienzo" data-rol="gr"></div>`;
    const $ = (k) => r.querySelector(`[data-rol=${k}]`), B = (k) => r.querySelector(`[data-b=${k}]`);
    const msg = (h) => { $('msg').innerHTML = h; };
    const tmr = () => {
      if (st.s === 0) { $('tmr').innerHTML = 'Temporizador: detenido (reposo)'; return; }
      const d = DUR[st.s]; let h = (nivel === 1 ? 'Temporizador de la etapa' : 'Temporizador T' + st.s) + ' (s): ';
      for (let i = 0; i <= d; i++) {
        const on = i === st.cnt, pas = i < st.cnt;
        h += `<span style="display:inline-flex;width:28px;height:28px;margin-right:4px;align-items:center;justify-content:center;border-radius:6px;font-weight:700;border:1px solid ${on ? G : 'var(--borde-2)'};background:${on ? G : 'var(--superficie)'};color:${on ? TV : pas ? 'var(--texto)' : 'var(--texto-3)'}">${i}</span>`;
      }
      $('tmr').innerHTML = h;
    };
    const ver = () => { $('gr').innerHTML = dibujar(st, nivel, mid); $('luz').innerHTML = luzSVG(st.s); tmr(); if (nivel === 1) B('u').textContent = st.auto ? 'Detener automático' : 'Automático'; };
    const cancel = () => { if (st.iv) { clearInterval(st.iv); st.iv = null; } if (st.to) { clearTimeout(st.to); st.to = null; } st.counting = false; };
    const fire = (id, txt, cb) => {
      st.busy = true; st.fl = id; ver();
      const t = TR.filter((x) => x.id === id)[0];
      st.to = setTimeout(() => { st.to = null; st.s = t.t; st.fl = null; st.busy = false; st.cnt = 0; ver(); msg(txt); if (cb) cb(); }, 700);
    };
    const sig = () => (st.s === 1 ? 'b' : st.s === 2 ? 'c' : 'd');
    const cuenta = () => {
      if (st.s === 0) return;
      st.counting = true; st.cnt = 0; tmr();
      st.iv = setInterval(() => {
        st.cnt += 1; tmr();
        if (st.cnt >= DUR[st.s]) {
          clearInterval(st.iv); st.iv = null; msg('Llegó a ' + DUR[st.s] + ' s: se cumple la condición de tiempo.');
          st.to = setTimeout(() => { st.to = null; st.counting = false; const k = sig(); fire(k, MSG[k], () => { if (st.auto) cuenta(); }); }, 900);
        }
      }, 1000);
    };
    const libre = () => {
      if (st.busy) return false;
      if (st.counting) { msg('Está contando. Espera a que termine o, en el rojo, pulsa el paro.'); return false; }
      return true;
    };
    B('a').onclick = () => {
      if (!libre()) return;
      if (st.s !== 0) { msg('Pulsar arranque no hace nada ahora: esa transición solo espera en la etapa 0.'); return; }
      msg('Se presionó el arranque: la transición está validada y su condición se cumple.'); fire('a', MSG.a);
    };
    B('p').onclick = () => {
      if (st.busy) return;
      if (st.s !== 3) { msg('El paro no hace nada ahora: el GRAFCET solo lo espera en la etapa 3 (rojo).'); return; }
      cancel(); st.auto = false; fire('e', MSG.e);
    };
    B('t').onclick = () => {
      if (!libre()) return;
      if (st.s === 0) { msg('En reposo no hay condición de tiempo: la etapa 0 solo espera el arranque.'); return; }
      msg('Contando ' + DUR[st.s] + ' s, segundo a segundo…' + (st.s === 3 ? ' Pulsa el paro antes de llegar a 5 para ir a reposo.' : '')); cuenta();
    };
    if (nivel === 1) {
      B('u').onclick = () => {
        if (st.auto) { st.auto = false; ver(); msg('Modo automático detenido. Si estaba contando, terminará esa cuenta.'); return; }
        if (st.busy) return;
        st.auto = true; ver();
        if (st.s === 0) { msg('Automático: se presionó el arranque.'); fire('a', MSG.a, () => { if (st.auto) cuenta(); }); }
        else if (!st.counting) { msg('Automático en marcha: cada etapa cuenta su tiempo.'); cuenta(); }
        else msg('Automático en marcha.');
      };
    }
    st.parar = () => { st.vivo = false; cancel(); st.auto = false; };
    vivos.push(st);
    msg(nivel === 1 ? 'Nivel 1: todo en palabras. Usa los botones paso a paso o prueba el modo automático.' : 'Nivel 2: las mismas condiciones y acciones con símbolos. T1, T2 y T3 son los temporizadores del PLC; <span style="text-decoration:overline">PP</span> se cumple al pulsar el paro (NC).');
    ver();
  };

  // ---------- enunciado y componentes ----------
  const sNA = '<svg width="64" height="36" viewBox="0 0 64 36" aria-label="Pulsador NA"><g stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round"><line x1="4" y1="28" x2="20" y2="28"/><line x1="44" y1="28" x2="60" y2="28"/><line x1="20" y1="28" x2="42" y2="19"/><line x1="32" y1="24" x2="32" y2="8" stroke-dasharray="3 2"/><line x1="24" y1="8" x2="40" y2="8"/></g></svg>';
  const sNC = '<svg width="64" height="36" viewBox="0 0 64 36" aria-label="Pulsador NC"><g stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round"><line x1="4" y1="28" x2="20" y2="28"/><line x1="44" y1="28" x2="60" y2="28"/><line x1="20" y1="28" x2="44" y2="28"/><line x1="44" y1="28" x2="44" y2="18"/><line x1="32" y1="24" x2="32" y2="8" stroke-dasharray="3 2"/><line x1="24" y1="8" x2="40" y2="8"/></g></svg>';
  const sLam = '<svg width="64" height="36" viewBox="0 0 64 36" aria-label="Lámpara"><g stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round"><line x1="4" y1="18" x2="21" y2="18"/><line x1="43" y1="18" x2="60" y2="18"/><circle cx="32" cy="18" r="11"/><line x1="24" y1="10" x2="40" y2="26"/><line x1="40" y1="10" x2="24" y2="26"/></g></svg>';
  PL.semaforoSimbolos = { na: sNA, nc: sNC, lampara: sLam };
  const ENUNCIADO = `<div class="panel-info" style="line-height:1.65">
    <p><b>Semáforo de una vía.</b> Un semáforo tiene tres lámparas: verde, amarilla y roja. Se controla con un pulsador de arranque y un pulsador de paro.</p>
    <p>Al presionar el <b>pulsador de arranque</b>, el semáforo se pone en verde durante 5 s. Luego pasa a amarillo durante 2 s y después a rojo.</p>
    <p>Estando en rojo hay dos posibilidades: si pasan <b>5 s</b>, vuelve al verde y repite el ciclo; si antes se presiona el <b>pulsador de paro</b>, el semáforo queda en reposo, con todas las lámparas apagadas y el temporizador detenido.</p>
    <p>En reposo, todas las lámparas están apagadas. Solo una lámpara está encendida a la vez. Las lámparas son de 24 V cc y 0,05 A cada una.</p></div>
    <div class="aviso info" style="margin-top:10px"><b>Se pide:</b> a) identificar entradas, salidas y temporizadores con su símbolo y sus características; b) dibujar el GRAFCET de nivel 1 (en palabras); c) dibujar el GRAFCET de nivel 2 (con símbolos).</div>`;
  const fila = (a, b, c, d, e, f) => `<tr><td style="padding:6px;border-bottom:1px solid var(--borde)">${a}</td><td style="padding:6px;border-bottom:1px solid var(--borde)">${b}</td><td style="padding:6px;border-bottom:1px solid var(--borde)"><b>${c}</b></td><td style="padding:6px;border-bottom:1px solid var(--borde)">${d}</td><td style="padding:6px;border-bottom:1px solid var(--borde)">${e}</td><td style="padding:6px;border-bottom:1px solid var(--borde)">${f}</td></tr>`;
  const TABLA = `<div class="panel-info" style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.88rem;min-width:560px">
    <tr style="text-align:left;color:var(--texto-2)"><th style="padding:6px;border-bottom:1px solid var(--borde-2)">Componente</th><th style="padding:6px;border-bottom:1px solid var(--borde-2)">Símbolo</th><th style="padding:6px;border-bottom:1px solid var(--borde-2)">Nombre</th><th style="padding:6px;border-bottom:1px solid var(--borde-2)">Característica</th><th style="padding:6px;border-bottom:1px solid var(--borde-2)">Dirección</th><th style="padding:6px;border-bottom:1px solid var(--borde-2)">Bit en reposo</th></tr>
    ${fila('Pulsador de arranque', sNA, 'PA', 'Pulsador NA, 24 V cc', 'ED1.00', '0')}
    ${fila('Pulsador de paro', sNC, 'PP', 'Pulsador NC, 24 V cc', 'ED1.01', '1')}
    ${fila('Lámpara verde', sLam, 'H1', '24 V cc, 0,05 A', 'SD1.00', '0')}
    ${fila('Lámpara amarilla', sLam, 'H2', '24 V cc, 0,05 A', 'SD1.01', '0')}
    ${fila('Lámpara roja', sLam, 'H3', '24 V cc, 0,05 A', 'SD1.02', '0')}
    ${fila('Temporizador (verde)', 'interno', 'T1', '5 s desde que se activa la etapa 1', 'interno', '0')}
    ${fila('Temporizador (amarillo)', 'interno', 'T2', '2 s desde que se activa la etapa 2', 'interno', '0')}
    ${fila('Temporizador (rojo)', 'interno', 'T3', '5 s desde que se activa la etapa 3', 'interno', '0')}
    </table></div>
    <div class="aviso info" style="margin-top:10px"><b>Temporizadores:</b> no son componentes externos; los cuenta el propio PLC y cada uno solo cuenta mientras su etapa está activa. Si la etapa se apaga, su temporizador se detiene y vuelve a 0. <b>Salidas:</b> con 24 V cc y 0,05 A por lámpara sirve una salida a relé o a transistor.</div>`;

  II.diagramas.semaforo = (cont, opts = {}) => {
    cont.classList.add('diagrama');
    const defs = [{ id: 'enunciado', t: '1 · Enunciado' }, { id: 'componentes', t: '2 · Componentes' }, { id: 'nivel1', t: '3 · GRAFCET nivel 1' }, { id: 'nivel2', t: '4 · GRAFCET nivel 2' }];
    const ini = defs.some((d) => d.id === opts.pestana) ? opts.pestana : 'enunciado';
    const T = PL.pestanas(cont, defs, ini);
    const vivos = [];
    T.raiz('enunciado').innerHTML = ENUNCIADO;
    T.raiz('componentes').innerHTML = TABLA;
    grafcet(T.raiz('nivel1'), 1, vivos);
    grafcet(T.raiz('nivel2'), 2, vivos);
    return { destruir() { vivos.forEach((v) => v.parar()); }, pestana: T.pestana };
  };
  ['enunciado', 'componentes', 'nivel1', 'nivel2'].forEach((id) => { II.diagramas['semaforo_' + id] = (cont, o = {}) => II.diagramas.semaforo(cont, { ...o, pestana: id }); });
})();
