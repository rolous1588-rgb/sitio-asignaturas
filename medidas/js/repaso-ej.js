// ============================================================
// Medidas Eléctricas — Repaso para el 2.º parcial (09/11/2026)
//   Ejercicios del repaso. Nada de esto escribe en la base de datos.
//   - c1…c5: los ejercicios de clase (FP.EJERCICIOS e1…e5) con su diagrama,
//     su misma calificación y la solución escrita en LaTeX.
//   - n1…n17: ejercicios nuevos con casillas numéricas u opciones; varios
//     traen un diagrama para explorar antes de resolver.
//   Regla del «?»: lo que queda vacío cuenta como incorrecto.
//   Respuestas: se acepta coma o punto decimal.
// ============================================================
(function () {
  'use strict';
  const FP = window.FP;
  const E = FP.EJERCICIOS;
  const { f, miles } = FP.fmt;
  const R3 = Math.sqrt(3), RAD = Math.PI / 180, W = 2 * Math.PI * 50;
  const LET = 'ABCDEF';
  const RP = (FP.RP = FP.RP || {});
  const EJ = (FP.REPASO_EJ = {});

  // ---------- utilidades ----------
  const tx = (v, d) => f(v, d).replace(/,/g, '{,}');                        // número dentro de LaTeX
  const txm = (v, d = 0) => miles(v, d).replace(/,/g, '{,}').replace(/[\s\u00a0\u202f]/g, '\\,'); // con miles
  const T = (s) => '\\(' + s + '\\)';
  const D = (s) => '<div class="rp-f">\\[' + s + '\\]</div>';
  const Q = '<span class="rp-q">?</span>';
  const elegir = (r, a) => a[Math.floor(r() * a.length)];
  const entre = (r, a, b, paso) => Math.round((a + paso * Math.floor(r() * (Math.round((b - a) / paso) + 1))) * 1e6) / 1e6;
  const vacio = (s) => s == null || String(s).trim() === '';
  const marca = (ok) => (ok ? '<b class="on-t">✓</b>' : '<b class="bad-t">✗</b>');
  const tanFP = (fp) => Math.tan(Math.acos(fp));
  RP.tx = tx; RP.T = T; RP.D = D; RP.Q = Q;

  // =================================================================
  // Motor de ejercicios nuevos: casillas numéricas y opciones
  //   cfg: { titulo, datos(r), enunciado(d), items(d), sol(d), dg?(d), fig?(d) }
  //   items: { id, t, u?, v, tol?: { rel, abs }, dec } (número)
  //          { id, t, o: [correcta primero, …] }          (opción)
  // =================================================================
  function ejNum(cfg) {
    const its = (d) => cfg.items(d);
    const okItem = (it, x) => {
      if (vacio(x)) return null;
      if (it.o) return Number(x) === 0;
      const v = II.num(String(x).replace(/[^\d,.\-−]/g, '').replace('−', '-'));
      if (!isFinite(v)) return false;
      const tol = Object.assign({ rel: 0.02, abs: 0 }, it.tol || {});
      return Math.abs(v - it.v) <= Math.max(Math.abs(it.v) * tol.rel, tol.abs);
    };
    const ej = {
      titulo: cfg.titulo, nuevo: true, tipo: 'num',
      generar(r) {
        const d = cfg.datos(r);
        d._per = {};
        its(d).forEach((it) => { if (it.o) d._per[it.id] = II.mezclar(r, it.o.map((_, i) => i)); });
        return d;
      },
      enunciado: (d) => cfg.enunciado(d),
      montar(cont, d) {
        const caja = document.createElement('div');
        let dg = null;
        const oyentes = [];
        const lista = its(d);
        caja.innerHTML = (cfg.fig ? '<div class="rp-fig">' + cfg.fig(d) + '</div>' : '') +
          (cfg.dg ? '<p class="rp-explora">' + (cfg.dg(d).nota || 'Explora el diagrama antes de resolver.') + '</p><div class="rp-dg"></div>' : '') +
          '<div class="rp-items">' + lista.map((it, i) => '<div class="rp-item"><p class="rp-t"><b>' + (i + 1) + ')</b> ' + it.t + (it.u ? ' <span class="rp-u">(' + it.u + ')</span>' : '') + '</p>' +
            (it.o
              ? '<div class="opciones-est">' + d._per[it.id].map((k, j) => '<button type="button" class="opcion-est" data-i="' + it.id + '" data-k="' + k + '"><span class="letra">' + LET[j] + '</span><span class="rp-op">' + it.o[k] + '</span></button>').join('') + '</div>'
              : '<input class="rp-in" data-i="' + it.id + '" inputmode="decimal" autocomplete="off" placeholder="Escribe el número' + (it.u ? ' en ' + it.u : '') + '">') + '</div>').join('') + '</div>';
        cont.appendChild(caja);
        if (cfg.dg) {
          const g = cfg.dg(d);
          dg = FP.diagramas[g.nombre](caja.querySelector('.rp-dg'), g.opc || {});
        }
        const sel = {};
        const pintar = () => caja.querySelectorAll('.opcion-est').forEach((b) => b.classList.toggle('elegida', String(sel[b.dataset.i]) === b.dataset.k));
        const avisar = () => oyentes.forEach((fn) => fn());
        caja.addEventListener('click', (e) => { const b = e.target.closest('.opcion-est'); if (!b) return; sel[b.dataset.i] = +b.dataset.k; pintar(); avisar(); });
        caja.addEventListener('input', (e) => { if (e.target.matches('.rp-in')) avisar(); });
        return {
          estado() { const v = Object.assign({}, sel); caja.querySelectorAll('.rp-in').forEach((x) => { v[x.dataset.i] = x.value.trim(); }); return { v }; },
          fijar(x) {
            if (!x || !x.v) return;
            caja.querySelectorAll('.rp-in').forEach((inp) => { if (x.v[inp.dataset.i] != null) inp.value = x.v[inp.dataset.i]; });
            lista.forEach((it) => { if (it.o && x.v[it.id] != null && x.v[it.id] !== '') sel[it.id] = +x.v[it.id]; });
            pintar();
          },
          alCambiar: (fn) => oyentes.push(fn),
          destruir: () => { if (dg) dg.destruir(); caja.remove(); }
        };
      },
      evaluar(est, d) {
        const v = (est && est.v) || {};
        const lista = its(d);
        const res = lista.map((it) => okItem(it, v[it.id]));
        const puntos = res.filter((x) => x === true).length, nv = res.filter((x) => x === null).length;
        return {
          puntos, ok: puntos === lista.length,
          texto: (() => {
            const bien = [], malas = [];
            res.forEach((x, i) => (x ? bien : malas).push(i + 1));
            return [bien.length ? 'Bien: ' + bien.join('; ') : '', malas.length ? 'Mal: ' + malas.join('; ') : ''].filter(Boolean).join('. ') + (nv ? '. ' + nv + ' sin responder: cuentan como incorrectas' : '') + '.';
          })()
        };
      },
      vista(est, d) {
        const v = (est && est.v) || {};
        const lista = its(d);
        const nv = lista.filter((it) => vacio(v[it.id])).length;
        return '<div class="rp-vista">' + lista.map((it, i) => {
          const x = v[it.id], ok = okItem(it, x);
          const val = vacio(x) ? Q : it.o ? it.o[+x] : II.esc(x) + (it.u ? ' ' + it.u : '');
          return '<p><b>' + (i + 1) + ')</b> ' + (ok == null ? '' : marca(ok) + ' ') + val + '</p>';
        }).join('') + '</div>' + (nv ? '<p class="rp-faltan">Dejaste ' + nv + (nv === 1 ? ' respuesta' : ' respuestas') + ' sin completar («?»): cuentan como incorrectas. Hay que llenar todo.</p>' : '');
      },
      solucion(d) {
        const lista = its(d);
        return {
          html: '<div class="rp-sol">' + cfg.sol(d) + '</div><p class="etq">Respuestas</p><div class="rp-vista">' +
            lista.map((it, i) => '<p><b>' + (i + 1) + ')</b> ' + (it.o ? it.o[0] : T(tx(it.v, it.dec == null ? 2 : it.dec)) + (it.u ? ' ' + it.u : '')) + '</p>').join('') + '</div>'
        };
      }
    };
    ej.puntosDe = (d) => its(d).length;
    ej._items = its; // para las pruebas
    ej.soloOpciones = !!cfg.soloOpciones;
    ej.opcionesSueltas = (d) => its(d).map((it) => ({ t: (cfg.contexto || '') + it.t, o: it.o, por: it.por || '' }));
    ej.puntos = ej.puntosDe(ej.generar(II.rng('puntos|' + cfg.titulo)));
    return ej;
  }
  RP.ejNum = ejNum;

  // =================================================================
  // Ejercicios de clase (e1…e5) con su diagrama y su misma calificación
  // =================================================================
  function ejClase(id, cfg) {
    const base = E[id];
    const num = base.tipo === 'numerico';
    return {
      titulo: base.titulo, nuevo: false, tipo: 'clase', clase: id, diagrama: base.diagrama,
      generar: (r) => base.generar(r),
      puntosDe: () => base.puntos, puntos: base.puntos,
      enunciado: (d) => cfg.enunciado(d),
      formulas: cfg.formulas,
      montar(cont, d) {
        const caja = document.createElement('div');
        caja.innerHTML = '<div class="rp-dg"></div>' + (num ? '<div class="rp-items">' + base.campos.map((c) => '<div class="rp-item"><p class="rp-t">' + c.etiqueta + (c.unidad ? ' <span class="rp-u">(' + c.unidad + ')</span>' : '') + '</p><input class="rp-in" data-c="' + c.id + '" inputmode="decimal" autocomplete="off" placeholder="' + c.ph + '"></div>').join('') + '</div>' : '');
        cont.appendChild(caja);
        const o = base.opciones(d);
        const dg = FP.diagramas[base.diagrama](caja.querySelector('.rp-dg'), Object.assign({}, o, { animar: true }));
        const oyentes = [];
        let movPrevio = 0;
        dg.alCambiar(() => oyentes.forEach((fn) => fn()));
        caja.addEventListener('input', () => oyentes.forEach((fn) => fn()));
        return {
          estado() {
            if (num) { const v = {}; caja.querySelectorAll('.rp-in').forEach((x) => { v[x.dataset.c] = x.value.trim(); }); return v; }
            return Object.assign({}, dg.estado(), { _mov: (dg.movimientos ? dg.movimientos() : 1) + movPrevio });
          },
          fijar(x) {
            if (!x) return;
            if (num) caja.querySelectorAll('.rp-in').forEach((inp) => { if (x[inp.dataset.c] != null) inp.value = x[inp.dataset.c]; });
            else if (dg.fijar) { movPrevio = x._mov || 0; const y = Object.assign({}, x); delete y._mov; dg.fijar(y); }
          },
          alCambiar: (fn) => oyentes.push(fn),
          destruir: () => { dg.destruir(); caja.remove(); }
        };
      },
      evaluar(est, d) {
        if (num) {
          const faltan = base.campos.filter((c) => vacio(est && est[c.id])).length;
          const ev = base.evaluar(est || {}, d);
          return { puntos: ev.puntos, ok: ev.ok, texto: ev.texto.replace(/ · /g, '; ') + (faltan ? '. ' + faltan + ' sin responder: cuentan como incorrectas' : '') };
        }
        if (!est || !est._mov) return { puntos: 0, ok: false, vacio: true, texto: 'No moviste el diagrama: cuenta como incorrecto («?»).' };
        const ev = base.evaluar(est, d);
        return { puntos: ev.puntos, ok: ev.ok, texto: ev.texto.replace(/ · /g, '; ') };
      },
      vista(est, d) {
        if (num) {
          const nv = base.campos.filter((c) => vacio(est && est[c.id])).length;
          return '<div class="rp-vista">' + base.campos.map((c) => '<p>' + c.etiqueta + ': ' + (vacio(est && est[c.id]) ? Q : II.esc(est[c.id]) + (c.unidad ? ' ' + c.unidad : '')) + '</p>').join('') + '</div>' +
            (nv ? '<p class="rp-faltan">Dejaste ' + nv + ' sin completar («?»): cuentan como incorrectas. Hay que llenar todo.</p>' : '');
        }
        if (!est || !est._mov) return '<div class="rp-vista"><p>' + Q + ' No moviste el diagrama.</p></div><p class="rp-faltan">Lo que no completas cuenta como incorrecto.</p>';
        return '<div class="rp-vista"><p>' + cfg.vista(est, d) + '</p></div>';
      },
      solucion(d) {
        const sol = base.solucion(d);
        return { html: '<div class="rp-sol">' + cfg.sol(d) + '</div>', dg: { nombre: base.diagrama, opc: Object.assign({}, base.opciones(d), { inicial: Object.assign({}, base.opciones(d).inicial || {}, sol.estado), revelado: true }) } };
      }
    };
  }

  EJ.c1 = ejClase('e1', {
    formulas: [X('P = S\\cdot FP'), X('Q = S\\cdot \\operatorname{sen}\\varphi = \\sqrt{S^2 - P^2}'), X('\\varphi = \\arccos(FP)')],
    enunciado: (d) => '<p>Una carga consume una potencia aparente <b>' + T('S = ' + tx(d.S, 0) + '\\ \\text{kVA}') + '</b> con un factor de potencia <b>' + T('FP = ' + tx(d.fp, 2)) + ' inductivo</b>. Calcula su potencia activa ' + T('P') + ' (kW) y su potencia reactiva ' + T('Q') + ' (kVAR), y construye su triángulo moviendo P y Q.</p>',
    vista: (est) => 'Tu triángulo: ' + T('P = ' + tx(est.P, 1) + '\\ \\text{kW}') + ' y ' + T('Q = ' + tx(est.Q, 1) + '\\ \\text{kVAR}'),
    sol: (d) => D('P = S\\cdot FP = ' + tx(d.S, 0) + '\\cdot ' + tx(d.fp, 2) + ' = ' + tx(d.P, 1) + '\\ \\text{kW}') +
      D('\\varphi = \\arccos(' + tx(d.fp, 2) + ') = ' + tx(Math.acos(d.fp) / RAD, 1) + '^\\circ') +
      D('Q = S\\cdot \\operatorname{sen}\\varphi = ' + tx(d.S, 0) + '\\cdot ' + tx(Math.sin(Math.acos(d.fp)), 3) + ' = ' + tx(d.Q, 1) + '\\ \\text{kVAR}') +
      '<p>Se calificaba con el error del triángulo: hasta 3 % vale 10 puntos y hasta 8 %, 5.</p>'
  });
  EJ.c2 = ejClase('e2', {
    formulas: [X('I = \\dfrac{P}{\\sqrt{3}\\cdot V_L\\cdot FP}'), X('FP_{min} = \\dfrac{P}{\\sqrt{3}\\cdot V_L\\cdot I_{max}}'), X('V_L = 380\\ \\text{V}')],
    enunciado: (d) => '<p>Un taller trifásico consume una potencia activa <b>' + T('P = ' + tx(d.P, 1) + '\\ \\text{kW}') + '</b> con una tensión de línea <b>' + T('V_L = 380\\ \\text{V}') + '</b>. Su cable soporta como máximo una corriente de <b>' + T(d.Imax + '\\ \\text{A}') + '</b>. ¿Cuál es el factor de potencia mínimo para no pasar ese límite? Ajusta el FP del diagrama a ese valor.</p>',
    vista: (est, d) => 'Elegiste ' + T('FP = ' + tx(est.fp, 2)) + ': la corriente sería ' + T(tx((d.P * 1000) / (R3 * 380 * est.fp), 0) + '\\ \\text{A}'),
    sol: (d) => D('I = \\dfrac{P}{\\sqrt{3}\\cdot V_L\\cdot FP}\\;\\Rightarrow\\; FP = \\dfrac{P}{\\sqrt{3}\\cdot V_L\\cdot I_{max}}') +
      D('FP_{min} = \\dfrac{' + txm(d.P * 1000) + '}{1{,}732\\cdot 380\\cdot ' + d.Imax + '} = ' + tx(d.fpMin, 3)) +
      '<p>Con un FP menor, la corriente pasa de ' + T(d.Imax + '\\ \\text{A}') + ' y el cable se sobrecarga. Se calificaba con 10 puntos entre ' + T('-0{,}005') + ' y ' + T('+0{,}02') + ' del mínimo.</p>'
  });
  EJ.c3 = ejClase('e3', {
    formulas: [X('\\tan\\varphi = \\dfrac{\\sqrt{3}\\,(W_2 - W_1)}{W_1 + W_2}'), X('FP = \\cos\\varphi')],
    enunciado: (d) => '<p>En el tablero de una carga trifásica equilibrada (380 V) hay dos vatímetros en conexión Aron. La lectura del vatímetro W1 es <b>' + T(tx(d.W1, 2) + '\\ \\text{kW}') + '</b> y la del vatímetro W2 es <b>' + T(tx(d.W2, 2) + '\\ \\text{kW}') + '</b>. Calcula el factor de potencia de la carga y ajústalo en el diagrama (sus lecturas están tapadas).</p>',
    vista: (est) => 'Elegiste ' + T('FP = ' + tx(est.fp, 2)),
    sol: (d) => {
      const t = (R3 * (d.W2 - d.W1)) / (d.W1 + d.W2);
      return D('\\tan\\varphi = \\dfrac{1{,}732\\cdot(' + tx(d.W2, 2) + ' - ' + tx(d.W1, 2) + ')}{' + tx(d.W1, 2) + ' + ' + tx(d.W2, 2) + '} = ' + tx(t, 3)) +
        D('\\varphi = ' + tx(Math.atan(t) / RAD, 1) + '^\\circ \\;\\Rightarrow\\; FP = \\cos\\varphi = ' + tx(d.fp, 2)) +
        '<p>Se calificaba con 10 puntos si el FP elegido difería en 0,015 o menos.</p>';
    }
  });
  EJ.c4 = ejClase('e4', {
    formulas: [X('Q_c = P\\,(\\tan\\varphi_1 - \\tan\\varphi_2)'), X('\\tan\\varphi = \\dfrac{\\sqrt{1 - FP^2}}{FP}'), X('FP = 0{,}95 \\Rightarrow \\tan\\varphi_2 = 0{,}329'), X('\\text{pasos} = \\dfrac{Q_c}{q}\\ \\text{(hacia arriba)}')],
    enunciado: (d) => '<p>Una planta consume una potencia activa <b>' + T('P = ' + tx(d.P, 0) + '\\ \\text{kW}') + '</b> con un factor de potencia <b>' + T('FP_1 = ' + tx(d.fp1, 2)) + ' inductivo</b>. El banco de capacitores tiene 12 pasos de <b>' + T('q = ' + tx(d.q, 1) + '\\ \\text{kVAR}') + '</b> cada uno. Conecta los pasos justos para llegar a <b>' + T('FP \\geq 0{,}95') + '</b> usando la menor cantidad posible.</p>',
    vista: (est, d) => 'Conectaste ' + est.pasos + ' pasos (' + T(tx(est.pasos * d.q, 1) + '\\ \\text{kVAR}') + ')',
    sol: (d) => {
      const t1 = tanFP(d.fp1), t2 = tanFP(0.95);
      const r = FP.calcCorrector(d.P, d.fp1, d.n * d.q);
      return D('\\tan\\varphi_1 = \\dfrac{\\sqrt{1 - ' + tx(d.fp1, 2) + '^2}}{' + tx(d.fp1, 2) + '} = ' + tx(t1, 3)) +
        D('Q_c = ' + tx(d.P, 0) + '\\cdot(' + tx(t1, 3) + ' - ' + tx(t2, 3) + ') = ' + tx(d.necesita, 1) + '\\ \\text{kVAR}') +
        D('\\dfrac{' + tx(d.necesita, 1) + '}{' + tx(d.q, 1) + '} = ' + tx(d.necesita / d.q, 2) + '\\;\\Rightarrow\\; ' + d.n + '\\ \\text{pasos}') +
        '<p>Con ' + d.n + ' pasos el FP queda en ' + FP.fmt.fpTexto(r.fp2, r.Q2) + '. Se calificaba: pasos justos 10; FP de 0,95 o más con pasos de más, sin pasar a capacitivo, 6.</p>';
    }
  });
  EJ.c5 = ejClase('e5', {
    formulas: [X('FP = \\dfrac{\\text{kWh}}{\\sqrt{\\text{kWh}^2 + \\text{kVARh}^2}}'), X('\\text{Recargo} = \\text{cargo}\\cdot\\left(\\dfrac{0{,}85}{FP} - 1\\right)'), X('FP \\geq 0{,}85 \\Rightarrow \\text{sin recargo}')],
    enunciado: (d) => '<p>La factura de un taller dice: energía activa del mes <b>' + T(txm(d.kwh) + '\\ \\text{kWh}') + '</b>; energía reactiva del mes <b>' + T(txm(d.kvarh) + '\\ \\text{kVARh}') + '</b>; cargo base <b>Bs ' + miles(d.cargo) + '</b>. Con la regla de ELFEC (FP mínimo 0,85), calcula el FP del mes y el recargo en bolivianos (escribe 0 si no hay recargo).</p>',
    vista: () => '',
    sol: (d) => D('FP = \\dfrac{' + txm(d.kwh) + '}{\\sqrt{' + txm(d.kwh) + '^2 + ' + txm(d.kvarh) + '^2}} = ' + tx(d.fp, 3)) +
      (d.bs > 0 ? D('\\text{Recargo} = ' + txm(d.cargo) + '\\cdot\\left(\\dfrac{0{,}85}{' + tx(d.fp, 3) + '} - 1\\right)') + D('\\text{Recargo} = \\text{Bs}\\ ' + txm(d.bs)) : '<p>Como ' + T('FP \\geq 0{,}85') + ', no hay recargo: Bs 0.</p>') +
      '<p>Se calificaba: FP con ' + T('\\pm 0{,}005') + ', 5 puntos; recargo con ' + T('\\pm 3\\ \\%') + ' (mínimo Bs 5), 5 puntos.</p>'
  });
  function X(s) { return '\\(' + s + '\\)'; }

  // =================================================================
  // Ejercicios nuevos
  // =================================================================
  // ---- 1 · Corriente alterna y potencia ----
  const APARATOS = ['la bomba de agua de un edificio', 'la compresora de aire de un taller mecánico', 'el motor de la amasadora de una panadería', 'el motor del ventilador de una granja avícola'];
  EJ.n1 = ejNum({
    titulo: 'Las potencias de una carga monofásica',
    datos: (r) => ({ ap: elegir(r, APARATOS), I: elegir(r, [4.5, 6, 7.5, 8, 9.5, 12]), phi: elegir(r, [25, 30, 32, 37, 41, 45]) }),
    enunciado: (d) => '<p>Se mide ' + d.ap + ' con un voltímetro, un amperímetro y un analizador. La tensión eficaz es <b>' + T('V = 220\\ \\text{V}') + '</b>, la corriente eficaz es <b>' + T('I = ' + tx(d.I, 1) + '\\ \\text{A}') + '</b> y la corriente está <b>atrasada ' + T(d.phi + '^\\circ') + '</b> respecto de la tensión (carga inductiva).</p>',
    dg: (d) => ({ nombre: 'potencia', opc: { inicial: { phi: d.phi } }, nota: 'Primero explora: el diagrama ya tiene tu desfase. Muévelo y mira cómo cambia el área positiva de ' + T('p(t)') + '; después vuelve a ' + T(d.phi + '^\\circ') + ' y calcula.' }),
    items: (d) => {
      const S = 220 * d.I, fp = Math.cos(d.phi * RAD);
      return [
        { id: 's', t: 'Potencia aparente ' + T('S'), u: 'VA', v: S, dec: 0 },
        { id: 'fp', t: 'Factor de potencia ' + T('FP'), v: fp, tol: { rel: 0, abs: 0.006 }, dec: 3 },
        { id: 'p', t: 'Potencia activa ' + T('P'), u: 'W', v: S * fp, dec: 0 },
        { id: 'q', t: 'Potencia reactiva ' + T('Q'), u: 'VAR', v: S * Math.sin(d.phi * RAD), dec: 0 }
      ];
    },
    sol: (d) => {
      const S = 220 * d.I, c = Math.cos(d.phi * RAD), s = Math.sin(d.phi * RAD);
      return D('S = V\\cdot I = 220\\cdot ' + tx(d.I, 1) + ' = ' + txm(S) + '\\ \\text{VA}') + D('FP = \\cos ' + d.phi + '^\\circ = ' + tx(c, 3)) +
        D('P = S\\cdot\\cos\\varphi = ' + txm(S) + '\\cdot ' + tx(c, 3) + ' = ' + txm(S * c) + '\\ \\text{W}') + D('Q = S\\cdot\\operatorname{sen}\\varphi = ' + txm(S) + '\\cdot ' + tx(s, 3) + ' = ' + txm(S * s) + '\\ \\text{VAR}');
    }
  });
  EJ.n2 = ejNum({
    titulo: 'Del triángulo a S, FP y φ',
    datos: (r) => {
      const P = entre(r, 15, 60, 2.5), fp = entre(r, 0.6, 0.92, 0.02);
      return { P, Q: Math.round(P * tanFP(fp) * 2) / 2, lugar: elegir(r, ['un aserradero', 'una carpintería', 'una lavandería industrial', 'una planta de alimento balanceado']) };
    },
    enunciado: (d) => '<p>El analizador de redes de ' + d.lugar + ' muestra una potencia activa <b>' + T('P = ' + tx(d.P, 1) + '\\ \\text{kW}') + '</b> y una potencia reactiva <b>' + T('Q = ' + tx(d.Q, 1) + '\\ \\text{kVAR}') + '</b> (inductiva).</p>',
    dg: (d) => ({ nombre: 'triangulo', opc: { inicial: { P: d.P, Q: d.Q }, ocultar: ['S', 'fp'] }, nota: 'Primero explora: este es tu triángulo (S y el FP están tapados). Si subes Q, ¿el FP sube o baja?' }),
    items: (d) => {
      const S = Math.hypot(d.P, d.Q);
      return [
        { id: 's', t: 'Potencia aparente ' + T('S'), u: 'kVA', v: S, dec: 2 },
        { id: 'fp', t: 'Factor de potencia ' + T('FP'), v: d.P / S, tol: { rel: 0, abs: 0.006 }, dec: 3 },
        { id: 'phi', t: 'Desfase ' + T('\\varphi'), u: 'grados', v: Math.atan2(d.Q, d.P) / RAD, tol: { rel: 0, abs: 0.6 }, dec: 1 }
      ];
    },
    sol: (d) => {
      const S = Math.hypot(d.P, d.Q);
      return D('S = \\sqrt{P^2 + Q^2} = \\sqrt{' + tx(d.P, 1) + '^2 + ' + tx(d.Q, 1) + '^2} = ' + tx(S, 2) + '\\ \\text{kVA}') +
        D('FP = \\dfrac{P}{S} = \\dfrac{' + tx(d.P, 1) + '}{' + tx(S, 2) + '} = ' + tx(d.P / S, 3)) + D('\\varphi = \\arctan\\dfrac{Q}{P} = ' + tx(Math.atan2(d.Q, d.P) / RAD, 1) + '^\\circ');
    }
  });

  // ---- 2 · Por qué importa un FP bajo ----
  EJ.n3 = ejNum({
    titulo: 'Corriente y pérdidas en el cable de una bomba',
    datos: (r) => ({ P: entre(r, 20, 60, 2.5), fp1: entre(r, 0.65, 0.78, 0.01) }),
    enunciado: (d) => '<p>La bomba sumergible del pozo de una comunidad es trifásica: consume una potencia activa <b>' + T('P = ' + tx(d.P, 1) + '\\ \\text{kW}') + '</b> a una tensión de línea <b>' + T('V_L = 380\\ \\text{V}') + '</b> con un factor de potencia <b>' + T('FP_1 = ' + tx(d.fp1, 2)) + '</b>. El cable tiene una resistencia de <b>' + T('R = 0{,}05\\ \\Omega') + ' por fase</b>. Después de compensar, el factor de potencia sube a <b>' + T('FP_2 = 0{,}95') + '</b> (la potencia activa no cambia).</p>',
    dg: (d) => ({ nombre: 'linea', opc: { inicial: { P: d.P, fp: d.fp1 }, fijos: { P: true }, ocultar: ['I', 'perd'] }, nota: 'Primero explora: la bomba ya está en el diagrama. Sube el FP hasta 0,95 y mira qué pasa con el grosor del cable y la carga del transformador.' }),
    items: (d) => {
      const I1 = (d.P * 1000) / (R3 * 380 * d.fp1), I2 = (d.P * 1000) / (R3 * 380 * 0.95);
      return [
        { id: 'i1', t: 'Corriente de línea con ' + T('FP_1'), u: 'A', v: I1, dec: 1 },
        { id: 'i2', t: 'Corriente de línea con ' + T('FP_2'), u: 'A', v: I2, dec: 1 },
        { id: 'p1', t: 'Pérdidas en el cable con ' + T('FP_1'), u: 'W', v: 3 * I1 * I1 * 0.05, dec: 0 },
        { id: 'p2', t: 'Pérdidas en el cable con ' + T('FP_2'), u: 'W', v: 3 * I2 * I2 * 0.05, dec: 0 }
      ];
    },
    sol: (d) => {
      const I1 = (d.P * 1000) / (R3 * 380 * d.fp1), I2 = (d.P * 1000) / (R3 * 380 * 0.95);
      return D('I_1 = \\dfrac{P}{\\sqrt{3}\\cdot V_L\\cdot FP_1} = \\dfrac{' + txm(d.P * 1000) + '}{1{,}732\\cdot 380\\cdot ' + tx(d.fp1, 2) + '} = ' + tx(I1, 1) + '\\ \\text{A}') +
        D('I_2 = \\dfrac{' + txm(d.P * 1000) + '}{1{,}732\\cdot 380\\cdot 0{,}95} = ' + tx(I2, 1) + '\\ \\text{A}') +
        D('P_{p1} = 3\\cdot I_1^2\\cdot R = 3\\cdot ' + tx(I1, 1) + '^2\\cdot 0{,}05 = ' + txm(3 * I1 * I1 * 0.05) + '\\ \\text{W}') +
        D('P_{p2} = 3\\cdot ' + tx(I2, 1) + '^2\\cdot 0{,}05 = ' + txm(3 * I2 * I2 * 0.05) + '\\ \\text{W}') +
        '<p>Las pérdidas bajan con el cuadrado: ' + T('(FP_1/FP_2)^2 = ' + tx((d.fp1 / 0.95) ** 2, 2)) + '.</p>';
    }
  });
  EJ.n4 = ejNum({
    titulo: '¿Alcanza el transformador de 75 kVA?',
    datos: (r) => { let P, fp; do { P = entre(r, 45, 68, 1); fp = entre(r, 0.66, 0.84, 0.01); } while (Math.abs(P / fp - 75) < 2); return { P, fp, lugar: elegir(r, ['un hotel en Sucre', 'un taller de carpintería', 'una planta de lácteos pequeña', 'un supermercado']) }; },
    enunciado: (d) => '<p>' + d.lugar.charAt(0).toUpperCase() + d.lugar.slice(1) + ' se alimenta de un transformador de potencia nominal <b>' + T('S_n = 75\\ \\text{kVA}') + '</b>. Su carga consume una potencia activa <b>' + T('P = ' + tx(d.P, 0) + '\\ \\text{kW}') + '</b> con un factor de potencia <b>' + T('FP = ' + tx(d.fp, 2)) + '</b>.</p>',
    dg: (d) => ({ nombre: 'linea', opc: { inicial: { P: d.P, fp: d.fp }, fijos: { P: true }, ocultar: ['S', 'trafo'] }, nota: 'Primero explora: mueve el FP y mira el color del cable y la carga del transformador.' }),
    items: (d) => {
      const S = d.P / d.fp;
      return [
        { id: 's', t: 'Potencia aparente de la carga ' + T('S'), u: 'kVA', v: S, dec: 1 },
        { id: 'pc', t: 'Carga del transformador', u: '%', v: (S / 75) * 100, dec: 0 },
        { id: 'fm', t: 'FP mínimo para no pasar de 75 kVA con la misma ' + T('P'), v: d.P / 75, tol: { rel: 0, abs: 0.006 }, dec: 3 },
        { id: 'so', t: '¿Está sobrecargado ahora?', o: S > 75 ? ['Sí: pasa de 75 kVA', 'No: está dentro de 75 kVA'] : ['No: está dentro de 75 kVA', 'Sí: pasa de 75 kVA'] }
      ];
    },
    sol: (d) => {
      const S = d.P / d.fp;
      return D('S = \\dfrac{P}{FP} = \\dfrac{' + tx(d.P, 0) + '}{' + tx(d.fp, 2) + '} = ' + tx(S, 1) + '\\ \\text{kVA}') + D('\\text{Carga} = \\dfrac{' + tx(S, 1) + '}{75}\\cdot 100 = ' + tx((S / 75) * 100, 0) + '\\ \\%') +
        D('FP_{min} = \\dfrac{P}{S_n} = \\dfrac{' + tx(d.P, 0) + '}{75} = ' + tx(d.P / 75, 3)) + '<p>El transformador se elige por kVA (corriente), no por kW: con FP bajo la misma potencia activa pide más corriente.</p>';
    }
  });

  // ---- 3 · Dos vatímetros ----
  EJ.n5 = ejNum({
    titulo: 'Dos vatímetros: P, Q y FP de un molino',
    datos: (r) => {
      const IL = elegir(r, [10, 12, 15, 18, 20, 25]), fpT = entre(r, 0.55, 0.95, 0.01);
      const w = FP.dosVatimetros(380, IL, fpT);
      return { IL, W1: Math.round(w.W1 * 100) / 100, W2: Math.round(w.W2 * 100) / 100 };
    },
    enunciado: (d) => '<p>El molino de bolas de una planta minera tiene un motor trifásico equilibrado a <b>' + T('V_L = 380\\ \\text{V}') + '</b> con una corriente de línea <b>' + T('I_L = ' + d.IL + '\\ \\text{A}') + '</b>. Con dos vatímetros en conexión Aron, la lectura del vatímetro W1 es <b>' + T(tx(d.W1, 2) + '\\ \\text{kW}') + '</b> y la del vatímetro W2 es <b>' + T(tx(d.W2, 2) + '\\ \\text{kW}') + '</b>.</p>',
    dg: (d) => ({ nombre: 'vatimetros', opc: { params: { IL: d.IL }, inicial: { fp: 1 }, ocultar: ['fp'] }, nota: 'Primero explora: mueve el FP hasta que W1 y W2 marquen tus lecturas. Así encuentras el FP en el diagrama; después compruébalo con la fórmula.' }),
    items: (d) => {
      const P = d.W1 + d.W2, Qv = R3 * (d.W2 - d.W1);
      return [
        { id: 'p', t: 'Potencia activa total ' + T('P'), u: 'kW', v: P, dec: 2 },
        { id: 'q', t: 'Potencia reactiva ' + T('Q'), u: 'kVAR', v: Qv, dec: 2 },
        { id: 'fp', t: 'Factor de potencia ' + T('FP'), v: P / Math.hypot(P, Qv), tol: { rel: 0, abs: 0.006 }, dec: 3 }
      ];
    },
    sol: (d) => {
      const P = d.W1 + d.W2, Qv = R3 * (d.W2 - d.W1), t = Qv / P;
      return D('P = W_1 + W_2 = ' + tx(d.W1, 2) + ' + ' + tx(d.W2, 2) + ' = ' + tx(P, 2) + '\\ \\text{kW}') + D('Q = \\sqrt{3}\\,(W_2 - W_1) = 1{,}732\\cdot ' + tx(d.W2 - d.W1, 2) + ' = ' + tx(Qv, 2) + '\\ \\text{kVAR}') +
        D('\\tan\\varphi = \\dfrac{Q}{P} = ' + tx(t, 3) + '\\;\\Rightarrow\\; \\varphi = ' + tx(Math.atan(t) / RAD, 1) + '^\\circ') + D('FP = \\cos\\varphi = ' + tx(P / Math.hypot(P, Qv), 3));
    }
  });
  EJ.n6 = ejNum({
    titulo: '¿Qué dicen las dos lecturas?', soloOpciones: true, contexto: 'Dos vatímetros en conexión Aron, carga equilibrada. ',
    datos: (r) => {
      const k = entre(r, 2, 9, 0.1), j = entre(r, 1, 4, 0.1), m = entre(r, 1.2, 2.6, 0.1);
      return { k, j, m, orden: II.mezclar(r, [0, 1, 2, 3, 4]).slice(0, 3) };
    },
    enunciado: () => '<p>Una carga trifásica equilibrada se mide con dos vatímetros en conexión Aron. Para cada caso, elige lo que se concluye de las lecturas.</p>',
    items: (d) => {
      const banco = [
        { id: 'a', t: 'La lectura del vatímetro W1 es ' + T('0\\ \\text{kW}') + ' y la del vatímetro W2 es ' + T(tx(d.k, 1) + '\\ \\text{kW}') + '. El FP de la carga es…', o: [T('0{,}5'), T('0'), T('1'), 'no se puede saber'], por: X('W_1 = V_L I_L\\cos(30^\\circ + \\varphi) = 0 \\Rightarrow \\varphi = 60^\\circ;\\; FP = 0{,}5') },
        { id: 'b', t: 'Los dos vatímetros marcan lo mismo: ' + T(tx(d.k, 1) + '\\ \\text{kW}') + ' cada uno. La carga es…', o: ['resistiva pura (FP = 1)', 'inductiva pura (FP = 0)', 'de FP 0,5', 'desequilibrada'], por: X('W_1 = W_2 \\Rightarrow \\varphi = 0;\\; FP = 1') },
        { id: 'c', t: 'La aguja del vatímetro W1 va al revés. Se invierte su bobina de tensión y marca ' + T(tx(d.j, 1) + '\\ \\text{kW}') + '; el W2 marca ' + T(tx(d.k + d.j, 1) + '\\ \\text{kW}') + '. ¿Cuánto vale P?', o: [T(tx(d.k, 1) + '\\ \\text{kW}'), T(tx(d.k + 2 * d.j, 1) + '\\ \\text{kW}'), T(tx(d.j, 1) + '\\ \\text{kW}'), T('0\\ \\text{kW}')], por: 'La lectura invertida se resta: ' + X('P = W_2 - |W_1| = ' + tx(d.k + d.j, 1) + ' - ' + tx(d.j, 1) + ' = ' + tx(d.k, 1) + '\\ \\text{kW}') },
        { id: 'd', t: 'Una carga de FP 0,4 inductivo. ¿Qué pasa con la lectura del vatímetro W1?', o: ['es negativa: hay que invertir su bobina de tensión y restarla', 'es cero', 'es igual a la de W2', 'es el doble de la de W2'], por: 'Con FP menor que 0,5, ' + X('30^\\circ + \\varphi > 90^\\circ') + ' y el coseno es negativo.' },
        { id: 'e', t: 'La lectura del vatímetro W1 es ' + T(tx(d.m, 1) + '\\ \\text{kW}') + ' y la del W2 es ' + T(tx(2 * d.m, 1) + '\\ \\text{kW}') + '. ¿Qué potencia reactiva tiene la carga?', o: [T(tx(R3 * d.m, 2) + '\\ \\text{kVAR}'), T(tx(d.m, 1) + '\\ \\text{kVAR}'), T(tx(3 * d.m, 1) + '\\ \\text{kVAR}'), T('0\\ \\text{kVAR}')], por: X('Q = \\sqrt{3}\\,(W_2 - W_1) = 1{,}732\\cdot ' + tx(d.m, 1) + ' = ' + tx(R3 * d.m, 2) + '\\ \\text{kVAR}') }
      ];
      return d.orden.map((i) => banco[i]);
    },
    sol: (d) => '<p>Con carga equilibrada: ' + T('W_1 = V_L I_L\\cos(30^\\circ + \\varphi)') + ' y ' + T('W_2 = V_L I_L\\cos(30^\\circ - \\varphi)') + '.</p>' +
      '<ul class="rp-lista"><li>FP = 1 (' + T('\\varphi = 0') + '): las dos lecturas son iguales.</li><li>FP = 0,5 (' + T('\\varphi = 60^\\circ') + '): ' + T('\\cos 90^\\circ = 0') + ', W1 marca cero.</li><li>FP menor que 0,5: W1 es negativo; se invierte su bobina de tensión y la lectura se <b>resta</b>: ' + T('P = W_2 - |W_1|') + '.</li><li>' + T('Q = \\sqrt{3}\\,(W_2 - W_1)') + '.</li></ul>' +
      (d.orden.includes(2) ? D('P = W_2 - |W_1| = ' + tx(d.k + d.j, 1) + ' - ' + tx(d.j, 1) + ' = ' + tx(d.k, 1) + '\\ \\text{kW}') : '') +
      (d.orden.includes(4) ? D('Q = \\sqrt{3}\\,(' + tx(2 * d.m, 1) + ' - ' + tx(d.m, 1) + ') = ' + tx(R3 * d.m, 2) + '\\ \\text{kVAR}') : '')
  });

  // ---- 4 · Corrección del FP ----
  EJ.n7 = ejNum({
    titulo: 'Calcula el banco de capacitores',
    datos: (r) => ({ P: entre(r, 40, 150, 5), fp1: entre(r, 0.68, 0.84, 0.01), lugar: elegir(r, ['una embotelladora de refrescos', 'un hotel', 'una fábrica de ladrillos', 'una planta de lácteos']) }),
    enunciado: (d) => '<p>' + d.lugar.charAt(0).toUpperCase() + d.lugar.slice(1) + ' consume una potencia activa <b>' + T('P = ' + tx(d.P, 0) + '\\ \\text{kW}') + '</b> con un factor de potencia <b>' + T('FP_1 = ' + tx(d.fp1, 2)) + ' inductivo</b>, a <b>' + T('V_L = 380\\ \\text{V}') + '</b> y <b>' + T('50\\ \\text{Hz}') + '</b>. Se quiere llegar a <b>' + T('FP_2 = 0{,}95') + '</b> con un banco conectado en triángulo.</p>',
    dg: (d) => ({ nombre: 'corrector', opc: { params: { P: d.P, q: d.P > 80 ? 10 : 5, N: 12, fp1: d.fp1 }, inicial: { pasos: 0, fp1: d.fp1 }, fijos: { fp1: true } }, nota: 'Primero explora: agrega pasos y mira cómo sube el FP y baja la corriente. ¿Qué pasa si te pasas?' }),
    items: (d) => {
      const Qc = d.P * (tanFP(d.fp1) - tanFP(0.95));
      return [
        { id: 'qc', t: 'Potencia del banco ' + T('Q_c'), u: 'kVAR', v: Qc, dec: 1 },
        { id: 'c', t: 'Capacidad por fase en triángulo ' + T('C_\\Delta'), u: 'µF', v: ((Qc * 1000) / (3 * W * 380 * 380)) * 1e6, dec: 0 },
        { id: 'i', t: 'Corriente de línea del banco ' + T('I_c'), u: 'A', v: (Qc * 1000) / (R3 * 380), dec: 1 }
      ];
    },
    sol: (d) => {
      const t1 = tanFP(d.fp1), t2 = tanFP(0.95), Qc = d.P * (t1 - t2), C = ((Qc * 1000) / (3 * W * 380 * 380)) * 1e6;
      return D('Q_c = P\\,(\\tan\\varphi_1 - \\tan\\varphi_2) = ' + tx(d.P, 0) + '\\cdot(' + tx(t1, 3) + ' - ' + tx(t2, 3) + ') = ' + tx(Qc, 1) + '\\ \\text{kVAR}') +
        D('C_\\Delta = \\dfrac{Q_c}{3\\cdot\\omega\\cdot V_L^2} = \\dfrac{' + txm(Qc * 1000) + '}{3\\cdot 314{,}16\\cdot 380^2}') + D('C_\\Delta = ' + tx(C, 0) + '\\ \\mu\\text{F}') +
        D('I_c = \\dfrac{Q_c}{\\sqrt{3}\\cdot V_L} = \\dfrac{' + txm(Qc * 1000) + '}{1{,}732\\cdot 380} = ' + tx((Qc * 1000) / (R3 * 380), 1) + '\\ \\text{A}') +
        '<p>En estrella cada capacitor ve ' + T('V_L/\\sqrt{3}') + ': harían falta 3 veces más µF. El contactor se elige con ' + T('\\approx 1{,}43\\cdot I_c') + '.</p>';
    }
  });
  EJ.n8 = ejNum({
    titulo: 'Varias cargas, un solo FP',
    datos: (r) => ({ P1: entre(r, 10, 30, 1), f1: entre(r, 0.7, 0.85, 0.01), P2: entre(r, 5, 20, 1), f2: entre(r, 0.6, 0.75, 0.01), P3: entre(r, 5, 20, 1) }),
    enunciado: (d) => '<p>Un taller metalmecánico tiene tres cargas funcionando a la vez: un torno con <b>' + T('P_1 = ' + d.P1 + '\\ \\text{kW}') + '</b> y <b>' + T('FP_1 = ' + tx(d.f1, 2)) + '</b>; una soldadora con <b>' + T('P_2 = ' + d.P2 + '\\ \\text{kW}') + '</b> y <b>' + T('FP_2 = ' + tx(d.f2, 2)) + '</b>; y hornos de resistencia con <b>' + T('P_3 = ' + d.P3 + '\\ \\text{kW}') + '</b> y <b>' + T('FP_3 = 1') + '</b>.</p>',
    dg: (d) => ({ nombre: 'triangulo', opc: { inicial: { P: d.P1, Q: Math.round(d.P1 * tanFP(d.f1) * 2) / 2 } }, nota: 'Primero explora: este es el triángulo del torno. Súmale con los controles la P y la Q de las otras cargas y mira el FP total.' }),
    items: (d) => {
      const P = d.P1 + d.P2 + d.P3, Qt = d.P1 * tanFP(d.f1) + d.P2 * tanFP(d.f2);
      return [
        { id: 'p', t: 'Potencia activa total ' + T('P'), u: 'kW', v: P, dec: 0 },
        { id: 'q', t: 'Potencia reactiva total ' + T('Q'), u: 'kVAR', v: Qt, dec: 1 },
        { id: 'fp', t: 'Factor de potencia del taller', v: P / Math.hypot(P, Qt), tol: { rel: 0, abs: 0.006 }, dec: 3 }
      ];
    },
    sol: (d) => {
      const q1 = d.P1 * tanFP(d.f1), q2 = d.P2 * tanFP(d.f2), P = d.P1 + d.P2 + d.P3, Qt = q1 + q2;
      return '<p>Se suman las P y las Q de cada carga, <b>nunca los FP</b>.</p>' + D('Q_1 = P_1\\tan\\varphi_1 = ' + d.P1 + '\\cdot ' + tx(tanFP(d.f1), 3) + ' = ' + tx(q1, 1) + '\\ \\text{kVAR}') + D('Q_2 = ' + d.P2 + '\\cdot ' + tx(tanFP(d.f2), 3) + ' = ' + tx(q2, 1) + '\\ \\text{kVAR};\\;\\; Q_3 = 0') +
        D('P = ' + d.P1 + ' + ' + d.P2 + ' + ' + d.P3 + ' = ' + P + '\\ \\text{kW};\\;\\; Q = ' + tx(Qt, 1) + '\\ \\text{kVAR}') + D('FP = \\dfrac{P}{\\sqrt{P^2 + Q^2}} = ' + tx(P / Math.hypot(P, Qt), 3));
    }
  });

  // ---- 5 · Factura y armónicos ----
  EJ.n9 = ejNum({
    titulo: 'FP verdadero con armónicos',
    datos: (r) => ({ phi: entre(r, 5, 25, 1), thd: elegir(r, [40, 60, 80, 100, 120]), P: entre(r, 2, 12, 0.5), lugar: elegir(r, ['una oficina con 60 computadoras', 'el variador de un ascensor', 'una sala de iluminación LED', 'un centro de datos pequeño']) }),
    enunciado: (d) => '<p>En ' + d.lugar + ' se mide la corriente con un analizador: el desfase entre la tensión y la <b>fundamental</b> de la corriente es <b>' + T('\\varphi_1 = ' + d.phi + '^\\circ') + '</b>, la distorsión armónica de la corriente es <b>' + T('THD_I = ' + d.thd + '\\ \\%') + '</b> y la potencia activa es <b>' + T('P = ' + tx(d.P, 1) + '\\ \\text{kW}') + '</b>.</p>',
    dg: (d) => ({ nombre: 'armonicos', opc: { inicial: { phi: d.phi, thd: d.thd }, ocultar: ['tpf'] }, nota: 'Primero explora: el diagrama tiene tus datos con el FP real tapado. Baja el THD a 0 y mira qué pasa con la forma de la corriente.' }),
    items: (d) => {
      const c = Math.cos(d.phi * RAD), k = 1 / Math.sqrt(1 + (d.thd / 100) ** 2);
      return [
        { id: 'c', t: '¿Qué marca el cosfímetro? (' + T('\\cos\\varphi_1') + ')', v: c, tol: { rel: 0, abs: 0.006 }, dec: 3 },
        { id: 'fp', t: 'Factor de potencia verdadero ' + T('FP'), v: c * k, tol: { rel: 0, abs: 0.006 }, dec: 3 },
        { id: 's', t: 'Potencia aparente que ve la red ' + T('S'), u: 'kVA', v: d.P / (c * k), dec: 2 }
      ];
    },
    sol: (d) => {
      const c = Math.cos(d.phi * RAD), k = 1 / Math.sqrt(1 + (d.thd / 100) ** 2);
      return D('\\cos\\varphi_1 = \\cos ' + d.phi + '^\\circ = ' + tx(c, 3)) + D('\\dfrac{1}{\\sqrt{1 + THD^2}} = \\dfrac{1}{\\sqrt{1 + ' + tx(d.thd / 100, 2) + '^2}} = ' + tx(k, 3)) +
        D('FP = \\cos\\varphi_1\\cdot\\dfrac{1}{\\sqrt{1 + THD^2}} = ' + tx(c, 3) + '\\cdot ' + tx(k, 3) + ' = ' + tx(c * k, 3)) + D('S = \\dfrac{P}{FP} = \\dfrac{' + tx(d.P, 1) + '}{' + tx(c * k, 3) + '} = ' + tx(d.P / (c * k), 2) + '\\ \\text{kVA}') +
        '<p>El cosfímetro solo ve el desfase de la fundamental: con armónicos marca casi 1 aunque el FP real sea mucho menor. Los capacitores no corrigen la distorsión.</p>';
    }
  });
  EJ.n10 = ejNum({
    titulo: 'La factura: FP, recargo y meta',
    datos: (r) => {
      const kwh = entre(r, 4000, 18000, 10), fpT = r() < 0.2 ? entre(r, 0.86, 0.95, 0.01) : entre(r, 0.62, 0.82, 0.01);
      const kvarh = Math.round((kwh * tanFP(fpT)) / 10) * 10, cargo = Math.round((kwh * elegir(r, [0.72, 0.78, 0.85, 0.92])) / 10) * 10;
      return { kwh, kvarh, cargo, lugar: elegir(r, ['una carpintería', 'una panadería industrial', 'un taller de soldadura', 'una imprenta']) };
    },
    enunciado: (d) => '<p>La factura mensual de ' + d.lugar + ' dice: energía activa <b>' + T(txm(d.kwh) + '\\ \\text{kWh}') + '</b>; energía reactiva <b>' + T(txm(d.kvarh) + '\\ \\text{kVARh}') + '</b>; cargo base <b>Bs ' + miles(d.cargo) + '</b>. Usa la regla de ELFEC: si el FP es menor que 0,85, el recargo es ' + T('\\text{cargo}\\cdot(0{,}85/FP - 1)') + '.</p>',
    items: (d) => {
      const c = FP.calcFactura(d.kwh, d.kvarh, d.cargo);
      return [
        { id: 'fp', t: 'FP del mes', v: c.fp, tol: { rel: 0, abs: 0.005 }, dec: 3 },
        { id: 'bs', t: 'Recargo (escribe 0 si no hay)', u: 'Bs', v: c.bs, tol: { rel: 0.03, abs: 5 }, dec: 0 },
        { id: 'kv', t: 'Energía reactiva máxima para no pagar recargo', u: 'kVARh', v: d.kwh * tanFP(0.85), tol: { rel: 0.02, abs: 10 }, dec: 0 }
      ];
    },
    sol: (d) => {
      const c = FP.calcFactura(d.kwh, d.kvarh, d.cargo);
      return D('FP = \\dfrac{' + txm(d.kwh) + '}{\\sqrt{' + txm(d.kwh) + '^2 + ' + txm(d.kvarh) + '^2}} = ' + tx(c.fp, 3)) +
        (c.bs > 0 ? D('\\text{Recargo} = ' + txm(d.cargo) + '\\cdot\\left(\\dfrac{0{,}85}{' + tx(c.fp, 3) + '} - 1\\right) = \\text{Bs}\\ ' + txm(c.bs)) : '<p>Como ' + T('FP \\geq 0{,}85') + ': no hay recargo (Bs 0).</p>') +
        D('\\text{kVARh}_{max} = \\text{kWh}\\cdot\\tan(\\arccos 0{,}85) = ' + txm(d.kwh) + '\\cdot 0{,}620 = ' + txm(d.kwh * tanFP(0.85)) + '\\ \\text{kVARh}');
    }
  });

  // ---- 6 · El vatímetro ----
  const dial = (a, amax) => {
    const ang = (t) => Math.PI * (1.15 - 1.3 * t);
    const p = (t, r) => [150 + r * Math.cos(ang(t)), 150 - r * Math.sin(ang(t))];
    let s = '<svg viewBox="0 0 300 180" role="img" aria-label="Escala del vatímetro"><path d="M' + p(0, 120).join(',') + ' A120,120 0 0 1 ' + p(1, 120).join(',') + '" fill="none" stroke="#465366" stroke-width="3"/>';
    const paso = amax / 10;
    for (let k = 0; k <= 10; k++) { const t = k / 10, a1 = p(t, 120), a2 = p(t, 106), a3 = p(t, 90); s += '<line x1="' + a1[0].toFixed(1) + '" y1="' + a1[1].toFixed(1) + '" x2="' + a2[0].toFixed(1) + '" y2="' + a2[1].toFixed(1) + '" stroke="#465366" stroke-width="2"/>' + (k % 2 === 0 ? '<text x="' + a3[0].toFixed(1) + '" y="' + (a3[1] + 5).toFixed(1) + '" font-size="13" text-anchor="middle" fill="#465366">' + Math.round(k * paso) + '</text>' : ''); }
    const n = p(a / amax, 112);
    s += '<line x1="150" y1="150" x2="' + n[0].toFixed(1) + '" y2="' + n[1].toFixed(1) + '" stroke="#c0392b" stroke-width="4" stroke-linecap="round"/><circle cx="150" cy="150" r="7" fill="#16202c"/><text x="150" y="176" font-size="14" text-anchor="middle" fill="#16202c" font-weight="700">' + a + ' div</text></svg>';
    return s;
  };
  EJ.n11 = ejNum({
    titulo: 'Lee el vatímetro analógico',
    datos: (r) => { const amax = elegir(r, [100, 120, 150]); return { Vn: elegir(r, [120, 240, 480]), In: elegir(r, [1, 2.5, 5, 10]), amax, a: entre(r, 20, amax - 5, 1) }; },
    enunciado: (d) => '<p>Un vatímetro electrodinámico de laboratorio está conectado en el rango de tensión <b>' + T('V_n = ' + d.Vn + '\\ \\text{V}') + '</b> y en el rango de corriente <b>' + T('I_n = ' + tx(d.In, 1) + '\\ \\text{A}') + '</b>. Su escala tiene <b>' + T('\\alpha_{max} = ' + d.amax + '\\ \\text{divisiones}') + '</b> y en el cuadrante dice <b>' + T('\\cos\\varphi_n = 1') + '</b>. La aguja marca <b>' + T('\\alpha = ' + d.a + '\\ \\text{div}') + '</b>.</p>',
    fig: (d) => dial(d.a, d.amax),
    items: (d) => {
      const k = (d.Vn * d.In) / d.amax;
      return [
        { id: 'k', t: 'Constante de lectura ' + T('k'), u: 'W/div', v: k, dec: 2 },
        { id: 'p', t: 'Potencia medida ' + T('P'), u: 'W', v: k * d.a, tol: { rel: 0.02, abs: 0.5 }, dec: 0 }
      ];
    },
    sol: (d) => { const k = (d.Vn * d.In) / d.amax; return D('k = \\dfrac{V_n\\cdot I_n\\cdot\\cos\\varphi_n}{\\alpha_{max}} = \\dfrac{' + d.Vn + '\\cdot ' + tx(d.In, 1) + '\\cdot 1}{' + d.amax + '} = ' + tx(k, 2) + '\\ \\text{W/div}') + D('P = k\\cdot\\alpha = ' + tx(k, 2) + '\\cdot ' + d.a + ' = ' + txm(k * d.a) + '\\ \\text{W}') + '<p>Si cambias de rango cambia ' + T('k') + ': la misma aguja vale otra potencia.</p>'; }
  });
  EJ.n12 = ejNum({
    titulo: '¿Conexión A o B? El error de inserción',
    datos: (r) => ({ Rc: elegir(r, [0.03, 0.05, 0.08]), Rp: elegir(r, [5, 8, 10, 20]), carga: elegir(r, [['una lámpara', 40], ['una lámpara', 60], ['un ventilador', 100], ['una estufa', 1500], ['una ducha eléctrica', 4500], ['un horno', 3000], ['un calefactor', 2000]]) }),
    enunciado: (d) => '<p>Se mide ' + d.carga[0] + ' de <b>' + T('P = ' + txm(d.carga[1]) + '\\ \\text{W}') + '</b> (FP = 1) a <b>' + T('V = 220\\ \\text{V}') + '</b>. El vatímetro tiene una bobina de corriente de resistencia <b>' + T('R_c = ' + tx(d.Rc, 2) + '\\ \\Omega') + '</b> y una bobina de tensión de resistencia <b>' + T('R_p = ' + d.Rp + '\\ \\text{k}\\Omega') + '</b>.</p>',
    items: (d) => {
      const I = d.carga[1] / 220, eA = I * I * d.Rc, eB = (220 * 220) / (d.Rp * 1000);
      return [
        { id: 'i', t: 'Corriente de la carga ' + T('I'), u: 'A', v: I, dec: 2 },
        { id: 'a', t: 'Error con la conexión A (' + T('I^2 R_c') + ')', u: 'W', v: eA, tol: { rel: 0.02, abs: 0.0005 }, dec: 3 },
        { id: 'b', t: 'Error con la conexión B (' + T('V^2/R_p') + ')', u: 'W', v: eB, dec: 2 },
        { id: 'e', t: '¿Qué conexión conviene?', o: eA < eB ? ['A: bobina de tensión del lado de la fuente', 'B: bobina de tensión del lado de la carga'] : ['B: bobina de tensión del lado de la carga', 'A: bobina de tensión del lado de la fuente'] }
      ];
    },
    sol: (d) => {
      const I = d.carga[1] / 220, eA = I * I * d.Rc, eB = (220 * 220) / (d.Rp * 1000);
      return D('I = \\dfrac{P}{V} = \\dfrac{' + txm(d.carga[1]) + '}{220} = ' + tx(I, 2) + '\\ \\text{A}') + D('\\text{A: } I^2 R_c = ' + tx(I, 2) + '^2\\cdot ' + tx(d.Rc, 2) + ' = ' + tx(eA, 3) + '\\ \\text{W}') +
        D('\\text{B: } \\dfrac{V^2}{R_p} = \\dfrac{220^2}{' + txm(d.Rp * 1000) + '} = ' + tx(eB, 2) + '\\ \\text{W}') + '<p>Conviene la de menor error: <b>' + (eA < eB ? 'A' : 'B') + '</b>. Regla: corriente pequeña → A; corriente grande → B.</p>';
    }
  });
  EJ.n13 = ejNum({
    titulo: '¿Se quema el vatímetro?',
    datos: (r) => ({ P: entre(r, 300, 1100, 50), fp: elegir(r, [0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.8, 0.9, 1]), ap: elegir(r, ['un motor en vacío', 'un transformador en vacío', 'un motor con poca carga', 'una soldadora']) }),
    enunciado: (d) => '<p>Un vatímetro tiene rangos de <b>' + T('240\\ \\text{V}') + '</b> y <b>' + T('5\\ \\text{A}') + '</b>; su escala completa es ' + T('1\\,200\\ \\text{W}') + '. Se quiere medir ' + d.ap + ' que consume <b>' + T('P = ' + txm(d.P) + '\\ \\text{W}') + '</b> a <b>' + T('V = 220\\ \\text{V}') + '</b> con un factor de potencia <b>' + T('FP = ' + tx(d.fp, 2)) + '</b>.</p>',
    dg: (d) => ({ nombre: 'potencia', opc: { inicial: { phi: Math.round(Math.acos(d.fp) / RAD / 5) * 5 } }, nota: 'Primero explora: con FP bajo, ' + T('p(t)') + ' tiene mucha área negativa. El vatímetro marca poco, pero la corriente es la misma.' }),
    items: (d) => {
      const I = d.P / (220 * d.fp);
      return [
        { id: 'i', t: 'Corriente de la carga ' + T('I'), u: 'A', v: I, dec: 2 },
        { id: 'pc', t: 'Parte de la escala que marca la aguja', u: '%', v: (d.P / 1200) * 100, tol: { rel: 0.02, abs: 0.5 }, dec: 0 },
        { id: 'q', t: '¿Corre peligro el vatímetro?', o: I > 5 ? ['Sí: la corriente pasa de 5 A', 'No: marca menos que la escala completa'] : ['No: la corriente no pasa de 5 A', 'Sí: el FP es bajo'] }
      ];
    },
    sol: (d) => { const I = d.P / (220 * d.fp); return D('I = \\dfrac{P}{V\\cdot FP} = \\dfrac{' + txm(d.P) + '}{220\\cdot ' + tx(d.fp, 2) + '} = ' + tx(I, 2) + '\\ \\text{A}') + D('\\dfrac{' + txm(d.P) + '}{1\\,200}\\cdot 100 = ' + tx((d.P / 1200) * 100, 0) + '\\ \\%') + '<p>' + (I > 5 ? 'La bobina de corriente se calienta con ' + T('I^2 R_c') + ' aunque la aguja marque poco: <b>se quema</b>.' : 'La corriente no pasa de 5 A: no corre peligro.') + ' El vatímetro se elige por corriente y tensión, nunca por vatios.</p>'; }
  });

  // ---- 7 · Puesta a tierra (solo lo visto en clase) ----
  EJ.n15 = ejNum({
    titulo: 'Tensión de contacto en una falla',
    datos: (r) => ({ RA: entre(r, 20, 80, 5), RB: elegir(r, [2, 4, 5, 10]), Idn: elegir(r, [10, 30, 100, 300]), ap: elegir(r, ['una lavadora', 'una heladera', 'una ducha eléctrica', 'un calefón']) }),
    enunciado: (d) => '<p>Red de <b>' + T('U_0 = 220\\ \\text{V}') + '</b> (esquema TT). La tierra de la casa mide <b>' + T('R_A = ' + d.RA + '\\ \\Omega') + '</b> y la del transformador <b>' + T('R_B = ' + d.RB + '\\ \\Omega') + '</b>. La fase toca la carcasa metálica de ' + d.ap + '. La casa tiene un disyuntor de 16 A y un diferencial de <b>' + T('I_{\\Delta n} = ' + d.Idn + '\\ \\text{mA}') + '</b>; la tensión límite de contacto es <b>' + T('U_L = 24\\ \\text{V}') + '</b>.</p>',
    items: (d) => {
      const If = 220 / (d.RA + d.RB);
      return [
        { id: 'if', t: 'Corriente de falla ' + T('I_f'), u: 'A', v: If, dec: 2 },
        { id: 'uc', t: 'Tensión de la carcasa respecto del suelo ' + T('U_c'), u: 'V', v: If * d.RA, dec: 0 },
        { id: 'rm', t: 'Resistencia de tierra máxima con ese diferencial ' + T('R_A'), u: 'Ω', v: 24 / (d.Idn / 1000), dec: 0 },
        { id: 'dz', t: '¿Salta el disyuntor de 16 A por esa corriente?', o: ['No: la corriente de falla es muy pequeña para él', 'Sí: toda falla a tierra lo hace saltar', 'Sí: la tierra se lleva toda la corriente'] }
      ];
    },
    sol: (d) => { const If = 220 / (d.RA + d.RB); return '<p>Las dos tierras quedan en serie con la fuente.</p>' + D('I_f = \\dfrac{U_0}{R_A + R_B} = \\dfrac{220}{' + d.RA + ' + ' + d.RB + '} = ' + tx(If, 2) + '\\ \\text{A}') + D('U_c = I_f\\cdot R_A = ' + tx(If, 2) + '\\cdot ' + d.RA + ' = ' + tx(If * d.RA, 0) + '\\ \\text{V}') + D('R_A \\leq \\dfrac{U_L}{I_{\\Delta n}} = \\dfrac{24}{' + tx(d.Idn / 1000, 3) + '} = ' + txm(24 / (d.Idn / 1000)) + '\\ \\Omega') + '<p>Un disyuntor de 16 A necesita varias veces su corriente para disparar rápido: con ' + tx(If, 1) + ' A no se entera. Protege el diferencial.</p>'; }
  });
  const dwight = (rho, L) => (rho / (2 * Math.PI * L)) * (Math.log((8 * L) / 0.016) - 1);
  EJ.n16 = ejNum({
    titulo: 'La resistencia de una jabalina',
    datos: (r) => { let rho, L; do { rho = elegir(r, [40, 50, 80, 100, 150, 200, 300]); L = elegir(r, [1.5, 2.4, 3]); } while (Math.abs(dwight(rho, L) - 25) < 2); return { rho, L }; },
    enunciado: (d) => '<p>Se clava una jabalina de cobre de <b>' + T('L = ' + tx(d.L, 1) + '\\ \\text{m}') + '</b> de largo y <b>' + T('d = 16\\ \\text{mm}') + '</b> de diámetro en un suelo de resistividad <b>' + T('\\rho = ' + d.rho + '\\ \\Omega\\cdot\\text{m}') + '</b>.</p>',
    dg: () => ({ nombre: 'capas', opc: { inicial: { r: 2 } }, nota: 'Primero explora: mueve r y mira cuánta resistencia queda cerca del electrodo.' }),
    items: (d) => {
      const R1 = dwight(d.rho, d.L);
      return [
        { id: 'r', t: 'Resistencia de la jabalina ' + T('R'), u: 'Ω', v: R1, dec: 1 },
        { id: 'r2', t: 'Resistencia con una jabalina del doble de largo', u: 'Ω', v: dwight(d.rho, 2 * d.L), dec: 1 },
        { id: 'c', t: '¿La jabalina de ' + f(d.L, 1) + ' m cumple 25 Ω?', o: R1 <= 25 ? ['Sí cumple', 'No cumple'] : ['No cumple', 'Sí cumple'] }
      ];
    },
    sol: (d) => { const R1 = dwight(d.rho, d.L), R2 = dwight(d.rho, 2 * d.L); return D('R = \\dfrac{\\rho}{2\\pi L}\\left(\\ln\\dfrac{8L}{d} - 1\\right)') + D('R = \\dfrac{' + d.rho + '}{2\\pi\\cdot ' + tx(d.L, 1) + '}\\left(\\ln\\dfrac{8\\cdot ' + tx(d.L, 1) + '}{0{,}016} - 1\\right) = ' + tx(R1, 1) + '\\ \\Omega') + D('R_{2L} = ' + tx(R2, 1) + '\\ \\Omega\\;\\;(' + tx(R2 / R1, 2) + '\\ \\text{veces})') + '<p>Doblar el largo baja R un poco menos que a la mitad: el logaritmo lo frena.</p>'; }
  });
  EJ.n17 = ejNum({
    titulo: 'Ubica la pica S y mide',
    datos: (r) => ({ D: elegir(r, [20, 25, 30, 35, 40]), rho: elegir(r, [60, 80, 100, 120, 150]), L: elegir(r, [1.5, 2.4, 3]), sem: Math.floor(r() * 1000) }),
    enunciado: (d) => '<p>Se mide la resistencia de una jabalina de <b>' + T(tx(d.L, 1) + '\\ \\text{m}') + '</b> con el método de caída de potencial. La pica de corriente H está a <b>' + T('D = ' + d.D + '\\ \\text{m}') + '</b> del electrodo E, en línea recta y en suelo parejo.</p>',
    dg: (d) => ({ nombre: 'telurometro', opc: { params: { rho: d.rho, L: d.L, sem: d.sem }, inicial: { D: d.D, x: 3, puntos: [] }, fijos: { D: true } }, nota: 'Primero mide: mueve la pica S, toca «Medir» en varios lugares y busca la zona plana. Deja S donde corresponde y lee la resistencia.' }),
    items: (d) => [
      { id: 'x', t: 'Distancia de E a la pica S según la regla del 62 %', u: 'm', v: 0.618 * d.D, tol: { rel: 0, abs: 0.35 }, dec: 1 },
      { id: 'r', t: 'Resistencia que leíste en el telurómetro con S en ese lugar', u: 'Ω', v: FP.tierra.re(d.rho, d.L), tol: { rel: 0.03, abs: 0 }, dec: 1 }
    ],
    sol: (d) => D('x = 0{,}618\\cdot D = 0{,}618\\cdot ' + d.D + ' = ' + tx(0.618 * d.D, 1) + '\\ \\text{m}') + '<p>Con S ahí el telurómetro lee unos <b>' + f(FP.tierra.re(d.rho, d.L), 1) + ' Ω</b>. Para confiar en la lectura, se mide también 1 m antes y 1 m después: deben variar poco (zona plana).</p>'
  });
})();
