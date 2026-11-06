// ============================================================
// Motor del Control de estudio (pl-ce) · Programación de Controladores e Interfaces Industriales
// 36 casillas (CE.SLOTS, ver ce-banco.js); a cada carnet le toca UNA plantilla por casilla, con datos y opciones propios.
// Tipos de pregunta:
//   opcion   { t, o: [opciones ya mezcladas], c, por }
//   num      { t, valor, unidad, tolRel, tolAbs, sol, por }
//   campos   { enunciado (HTML), campos: [{ id, tipo: 'num'|'select', pregunta, opciones, unidad, tolRel }], esperado, solucion }
//   orden    { t, pasos: [en el orden correcto] }            · se tocan los pasos en orden; puntaje parcial
// Todo es determinista: la misma semilla (carnet) da siempre la misma prueba.
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  const CE = (II.CE = II.CE || {});

  const esc = (s) => II.esc(s);
  const semilla = (carnet, slot, idx) => `${carnet}|ce|${slot}${idx == null ? '' : '|' + idx}`;

  // ---------- selección: una plantilla por casilla, en orden mezclado por carnet ----------
  // devuelve ids del tipo 'a1:2' (casilla : plantilla)
  CE.seleccion = (carnet) => {
    const r = II.rng(`${carnet}|ce|orden`);
    const ids = CE.SLOTS.map((s) => {
      const q = II.rng(semilla(carnet, s.id));
      return `${s.id}:${Math.floor(q() * s.plantillas.length)}`;
    });
    return II.mezclar(r, ids);
  };
  CE.slot = (id) => CE.SLOTS.find((s) => s.id === id);

  // ---------- instancia de una plantilla para un carnet ----------
  CE.instancia = (idCompuesto, carnet) => {
    const [sid, ix] = String(idCompuesto).split(':');
    const s = CE.slot(sid), i = +ix;
    const tpl = s.plantillas[i];
    const r = II.rng(semilla(carnet, sid, i));
    const base = { id: sid, ix: i, idc: idCompuesto, tema: s.tema, peso: s.peso, tipo: s.tipo };
    switch (tpl.k) {
      case 'op': {
        const malas = II.mezclar(r, tpl.mal).slice(0, 3);
        const todas = II.mezclar(r, [tpl.ok, ...malas]);
        return { ...base, t: tpl.t, o: todas, c: todas.indexOf(tpl.ok), por: tpl.por || '' };
      }
      case 'rap': {
        const p = II.SESIONES['pl-s1'].pasos.find((x) => x.id === tpl.id);
        const ok = p.o[p.c];
        const todas = II.mezclar(r, p.o.slice());
        return { ...base, t: p.t, o: todas, c: todas.indexOf(ok), por: p.por || '' };
      }
      case 'num': {
        const g = tpl.gen(r);
        return { ...base, tolRel: 0.02, tolAbs: 0, ...g, por: g.por || '' };
      }
      case 'orden': {
        const g = tpl.gen(r);
        let m = II.mezclar(r, g.pasos.map((_, k) => k));
        if (m.every((v, k) => v === k)) m = m.slice(1).concat(m[0]);
        return { ...base, t: g.t, pasos: g.pasos, mezcla: m, por: g.por || '' };
      }
      case 'reto': {
        const R = II.SESIONES['pl-s1'].retos[tpl.reto];
        const g = R.generar(r);
        const campos = tpl.campos.map((id) => g.campos.find((c) => c.id === id)).filter(Boolean);
        const esperado = {};
        campos.forEach((c) => { esperado[c.id] = g.esperado[c.id]; });
        return { ...base, enunciado: g.enunciado, intro: tpl.t || '', campos, esperado, solucion: g.solucion || '', pista: tpl.pista || '' };
      }
    }
    throw new Error('plantilla desconocida: ' + tpl.k);
  };

  // ---------- calificación: fracción 0..1 ----------
  const campoBien = (c, v, esperado) => {
    if (v == null || String(v).trim() === '') return false;
    if (c.tipo === 'num') return II.cerca(II.num(v), esperado, c.tolRel != null ? c.tolRel : 0.02, c.tolAbs || 0);
    return String(v) === String(esperado);
  };
  CE.calificar = (inst, resp) => {
    if (resp == null || resp === '') return 0;
    switch (inst.tipo) {
      case 'opcion': return resp === inst.c ? 1 : 0;
      case 'num': return II.cerca(II.num(resp), inst.valor, inst.tolRel != null ? inst.tolRel : 0.02, inst.tolAbs || 0) ? 1 : 0;
      case 'campos': {
        const R = typeof resp === 'object' ? resp : {};
        return inst.campos.filter((c) => campoBien(c, R[c.id], inst.esperado[c.id])).length / inst.campos.length;
      }
      case 'orden': {
        const s = Array.isArray(resp) ? resp : [];
        return inst.pasos.reduce((a, _, i) => a + (s[i] === i ? 1 : 0), 0) / inst.pasos.length;
      }
    }
    return 0;
  };
  CE.respondida = (inst, resp) => {
    if (resp == null || resp === '') return false;
    if (inst.tipo === 'campos') return typeof resp === 'object' && inst.campos.some((c) => resp[c.id] != null && String(resp[c.id]).trim() !== '');
    if (inst.tipo === 'orden') return Array.isArray(resp) && resp.length === inst.pasos.length;
    return true;
  };
  // nota sobre 100 con los pesos de las casillas (todas las pruebas suman 100 puntos)
  CE.calificarTodo = (ids, resp, carnet) => {
    let pts = 0, max = 0;
    const det = ids.map((idc) => {
      const q = CE.instancia(idc, carnet);
      const f = CE.calificar(q, resp[q.id]);
      pts += q.peso * f; max += q.peso;
      return { id: q.id, f, peso: q.peso };
    });
    return { nota: max ? Math.round((pts / max) * 1000) / 10 : 0, puntos: Math.round(pts * 100) / 100, max, det };
  };

  // ---------- texto de la respuesta correcta ----------
  CE.correctaHTML = (inst) => {
    switch (inst.tipo) {
      case 'opcion': return `<b>${inst.o[inst.c]}</b>`;
      case 'num': return `<b>${II.fmt(inst.valor, 3)} ${esc(inst.unidad || '')}</b>${inst.sol ? '; ' + inst.sol : ''}`;
      case 'orden': return '<ol style="margin:4px 0 0;padding-left:20px">' + inst.pasos.map((p) => `<li>${p}</li>`).join('') + '</ol>';
      case 'campos': return '';
    }
    return '';
  };

  // ---------- dibujo de una pregunta ----------
  // opts: { mostrar (corrección), bloqueado, alCambiar(resp), numero }
  CE.render = (cont, inst, resp, opts = {}) => {
    const mostrar = !!opts.mostrar, bloq = mostrar || !!opts.bloqueado;
    let valor = resp == null ? null : JSON.parse(JSON.stringify(resp));
    const avisar = () => { if (opts.alCambiar) opts.alCambiar(valor); };
    const num = opts.numero ? `<span class="chip" style="margin-right:6px">${opts.numero}</span>` : '';
    const peso = `<span class="chip acento" style="margin-left:6px" title="Puntos que vale esta pregunta">${II.fmt(inst.peso, 0)} pts</span>`;
    let cuerpo = '';

    if (inst.tipo === 'opcion') {
      cuerpo = `<div class="pregunta-rapida">${num}${inst.t}${peso}</div>
        <div class="opciones">${inst.o.map((o, i) => `<label class="opcion"><input type="radio" name="q-${inst.id}" value="${i}" ${valor === i ? 'checked' : ''} ${bloq ? 'disabled' : ''}>${o}</label>`).join('')}</div>`;
    } else if (inst.tipo === 'num') {
      cuerpo = `<div class="pregunta-rapida">${num}${inst.t}${peso}</div>
        <div class="con-unidad"><input class="entrada" inputmode="decimal" autocomplete="off" placeholder="Tu respuesta" value="${valor != null ? esc(valor) : ''}" ${bloq ? 'disabled' : ''}><span class="unidad">${esc(inst.unidad || '')}</span></div>
        <p class="nota" style="margin:6px 0 0">Usa coma o punto decimal. Se acepta un margen de ±2 %.</p>`;
    } else if (inst.tipo === 'campos') {
      const V = valor && typeof valor === 'object' ? valor : {};
      cuerpo = `<div class="pregunta-rapida">${num}${inst.intro ? inst.intro : 'Resuelve las partes de este ejercicio.'}${peso}</div>
        <div class="enunciado">${inst.enunciado}</div>
        ${inst.campos.map((c) => `<div class="grupo-campo" data-c="${c.id}"><div class="pregunta">${c.pregunta}</div>
          ${c.tipo === 'select'
            ? `<select class="entrada" data-id="${c.id}" ${bloq ? 'disabled' : ''}><option value="">Elige…</option>${c.opciones.map((o) => `<option ${V[c.id] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`
            : `<div class="con-unidad"><input class="entrada" data-id="${c.id}" inputmode="decimal" autocomplete="off" placeholder="Tu respuesta" value="${V[c.id] != null ? esc(V[c.id]) : ''}" ${bloq ? 'disabled' : ''}><span class="unidad">${esc(c.unidad || '')}</span></div>`}
          <div data-rol="corr-${c.id}"></div></div>`).join('')}
        ${inst.campos.some((c) => c.tipo === 'num') ? '<p class="nota" style="margin:6px 0 0">Usa coma o punto decimal. Se acepta un margen de ±2 %.</p>' : ''}`;
    } else if (inst.tipo === 'orden') {
      cuerpo = `<div class="pregunta-rapida">${num}${inst.t}${peso}</div>
        <p class="nota" style="margin:0 0 8px">Toca los pasos en el orden en que ocurren. Tocar uno ya elegido deshace desde ahí.</p>
        <div class="orden-lista">${inst.mezcla.map((i) => `<button type="button" class="orden-paso" data-i="${i}" ${bloq ? 'disabled' : ''}><span class="num"></span><span>${inst.pasos[i]}</span></button>`).join('')}</div>
        ${bloq ? '' : '<button type="button" class="boton chico" data-rol="reiniciar" style="margin-top:8px">Reiniciar el orden</button>'}`;
    }
    cont.innerHTML = cuerpo + '<div data-rol="correccion"></div>';

    // ---------- interacción ----------
    if (inst.tipo === 'opcion') {
      cont.querySelectorAll('input').forEach((x) => x.addEventListener('change', () => {
        valor = +x.value;
        cont.querySelectorAll('.opcion').forEach((o) => o.classList.toggle('elegida', o.querySelector('input').checked));
        avisar();
      }));
      cont.querySelectorAll('.opcion').forEach((o) => o.classList.toggle('elegida', o.querySelector('input').checked && !mostrar));
    }
    if (inst.tipo === 'num') {
      const i = cont.querySelector('input.entrada');
      i.addEventListener('input', () => { valor = i.value; avisar(); });
    }
    if (inst.tipo === 'campos') {
      const leer = () => {
        const R = {};
        cont.querySelectorAll('[data-id]').forEach((e) => { if (String(e.value).trim() !== '') R[e.dataset.id] = e.value; });
        valor = Object.keys(R).length ? R : null;
        avisar();
      };
      cont.querySelectorAll('[data-id]').forEach((e) => e.addEventListener(e.tagName === 'SELECT' ? 'change' : 'input', leer));
    }
    const pintarOrden = () => {
      const s = valor || [];
      cont.querySelectorAll('.orden-paso').forEach((b) => {
        const k = s.indexOf(+b.dataset.i);
        b.classList.toggle('elegido', k >= 0);
        b.querySelector('.num').textContent = k >= 0 ? k + 1 : '';
      });
    };
    if (inst.tipo === 'orden') {
      if (!bloq) {
        cont.querySelectorAll('.orden-paso').forEach((b) => b.addEventListener('click', () => {
          const i = +b.dataset.i, s = valor ? valor.slice() : [];
          const k = s.indexOf(i);
          if (k >= 0) s.splice(k); else s.push(i);
          valor = s.length ? s : null; pintarOrden(); avisar();
        }));
        cont.querySelector('[data-rol=reiniciar]').addEventListener('click', () => { valor = null; pintarOrden(); avisar(); });
      }
      pintarOrden();
    }

    // ---------- corrección (solo después del cierre) ----------
    if (mostrar) {
      const f = CE.calificar(inst, valor);
      if (inst.tipo === 'opcion') cont.querySelectorAll('.opcion').forEach((o) => {
        const v = +o.querySelector('input').value;
        o.classList.toggle('correcta', v === inst.c);
        o.classList.toggle('errada', v === valor && v !== inst.c);
      });
      if (inst.tipo === 'orden') cont.querySelectorAll('.orden-paso').forEach((b) => {
        const i = +b.dataset.i, k = (valor || []).indexOf(i);
        b.classList.toggle('correcta', k === i);
        b.classList.toggle('errada', k >= 0 && k !== i);
      });
      if (inst.tipo === 'campos') inst.campos.forEach((c) => {
        const v = valor && valor[c.id], bien = campoBien(c, v, inst.esperado[c.id]);
        const el = cont.querySelector(`[data-id="${c.id}"]`);
        if (el) el.classList.add(bien ? 'ok' : 'mal');
        const esp = c.tipo === 'num' ? `${II.fmt(inst.esperado[c.id], 3)} ${esc(c.unidad || '')}` : esc(inst.esperado[c.id]);
        cont.querySelector(`[data-rol="corr-${c.id}"]`).innerHTML = bien
          ? '<div class="nota" style="color:var(--ok);margin-top:4px">✓ Correcto</div>'
          : `<div class="nota" style="color:var(--mal);margin-top:4px">✗ ${v == null || String(v).trim() === '' ? 'Sin responder' : 'Incorrecto'}. Correcta: <b>${esp}</b></div>`;
      });
      const clase = f >= 0.999 ? 'ok' : f > 0 ? 'duda' : 'mal';
      const titulo = f >= 0.999 ? '¡Correcto!' : f > 0 ? `Parcialmente correcto (${II.fmt(f * 100, 0)} %).` : CE.respondida(inst, valor) ? 'Incorrecto.' : 'Sin responder.';
      const corr = (inst.tipo === 'campos' || f >= 0.999) && inst.tipo !== 'orden' ? '' : 'Respuesta correcta: ' + CE.correctaHTML(inst);
      const expl = inst.tipo === 'campos' ? (inst.solucion || '') : (inst.por ? `<div style="margin-top:6px">${inst.por}</div>` : '');
      cont.querySelector('[data-rol=correccion]').innerHTML = `<div class="aviso ${clase}" style="margin-top:10px"><b>${titulo}</b> ${corr}${expl}</div>`;
    }
    return { valor: () => valor };
  };
})();
