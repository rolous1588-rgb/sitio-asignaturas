// ============================================================
// Motor de preguntas (control de estudio y evaluaciones)
// Tipos:
//   opcion  { o: [...], c }                         · opciones mezcladas por carnet
//   num     { gen(r) → { t, valor, unidad, tolRel?, tolAbs?, sol } }
//   zona    { escena, params, correcta | correctas } · tocar el lugar correcto de una escena
//   errores { escena, params, errores: [...] }      · marcar todos los errores (puntaje parcial)
//   orden   { pasos: [...] en el orden correcto }   · tocar los pasos en orden (puntaje parcial)
// Todas pueden traer `por` (explicación) y `fuente`.
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  const P = (II.preguntas = II.preguntas || {});

  // ---------- instancia: fija el orden y los números según la semilla (carnet) ----------
  P.instancia = (q, semilla) => {
    const r = II.rng(String(semilla) + '|' + q.id);
    const inst = q.gen ? { ...q, ...q.gen(r) } : { ...q };
    if (inst.tipo === 'opcion') inst.orden = II.mezclar(r, inst.o.map((_, i) => i));
    if (inst.tipo === 'orden') {
      let m = II.mezclar(r, inst.pasos.map((_, i) => i));
      if (m.every((v, i) => v === i)) m = m.slice(1).concat(m[0]); // nunca ya ordenado
      inst.mezcla = m;
    }
    return inst;
  };

  const zonasCorrectas = (inst) => inst.correctas || [inst.correcta];

  // ---------- calificación: devuelve una fracción entre 0 y 1 ----------
  P.calificar = (inst, resp) => {
    if (resp == null || resp === '') return 0;
    switch (inst.tipo) {
      case 'opcion': return resp === inst.c ? 1 : 0;
      case 'num': return II.cerca(II.num(resp), inst.valor, inst.tolRel != null ? inst.tolRel : 0.02, inst.tolAbs || 0) ? 1 : 0;
      case 'zona': return zonasCorrectas(inst).includes(resp) ? 1 : 0;
      case 'errores': {
        const E = new Set(inst.errores), M = Array.isArray(resp) ? resp : [];
        const ac = M.filter((z) => E.has(z)).length, fa = M.filter((z) => !E.has(z)).length;
        return Math.max(0, (ac - fa) / E.size);
      }
      case 'orden': {
        const s = Array.isArray(resp) ? resp : [];
        return inst.pasos.reduce((a, _, i) => a + (s[i] === i ? 1 : 0), 0) / inst.pasos.length;
      }
    }
    return 0;
  };
  P.respondida = (inst, resp) => {
    if (resp == null || resp === '') return false;
    if (inst.tipo === 'errores') return Array.isArray(resp) && resp.length > 0;
    if (inst.tipo === 'orden') return Array.isArray(resp) && resp.length === inst.pasos.length;
    return true;
  };

  // ---------- texto de la respuesta correcta ----------
  P.correctaHTML = (inst) => {
    const esc = (inst.escena && II.escenas[inst.escena]) ? II.escenas[inst.escena](inst.params || {}) : null;
    switch (inst.tipo) {
      case 'opcion': return `<b>${inst.o[inst.c]}</b>`;
      case 'num': return `<b>${II.fmt(inst.valor, 3)} ${inst.unidad || ''}</b>${inst.sol ? ' · ' + inst.sol : ''}`;
      case 'zona': return zonasCorrectas(inst).map((z) => `<b>${z}</b>${esc && esc.zonas[z] ? ' (' + esc.zonas[z].t + ')' : ''}`).join(' o ');
      case 'errores': return 'Errores: ' + inst.errores.map((z) => `<b>${z}</b>${esc && esc.zonas[z] ? ' — ' + esc.zonas[z].t : ''}`).join('; ');
      case 'orden': return '<ol style="margin:4px 0 0;padding-left:20px">' + inst.pasos.map((p) => `<li>${p}</li>`).join('') + '</ol>';
    }
    return '';
  };

  // ---------- dibujo de una pregunta ----------
  // opts: { mostrar (bool: corrección), bloqueado (bool), alCambiar(resp), numero, tituloCorreccion, claseCorreccion }
  P.render = (cont, inst, resp, opts = {}) => {
    const mostrar = !!opts.mostrar, bloq = mostrar || !!opts.bloqueado;
    let valor = resp == null ? null : JSON.parse(JSON.stringify(resp));
    const avisar = () => { if (opts.alCambiar) opts.alCambiar(valor); };
    const cab = `<div class="pregunta-rapida">${opts.numero ? `<span class="chip" style="margin-right:6px">${opts.numero}</span>` : ''}${inst.t}</div>`;
    let cuerpo = '';
    if (inst.tipo === 'opcion') {
      cuerpo = `<div class="opciones">${inst.orden.map((i) => `<label class="opcion"><input type="radio" name="q-${inst.id}" value="${i}" ${valor === i ? 'checked' : ''} ${bloq ? 'disabled' : ''}>${inst.o[i]}</label>`).join('')}</div>`;
    } else if (inst.tipo === 'num') {
      cuerpo = `<div class="con-unidad"><input class="entrada" inputmode="decimal" autocomplete="off" placeholder="Tu respuesta" value="${valor != null ? II.esc(valor) : ''}" ${bloq ? 'disabled' : ''}><span class="unidad">${II.esc(inst.unidad || '')}</span></div>
        <p class="nota" style="margin:6px 0 0">Usa coma o punto decimal. Se acepta un margen de ±2 %.</p>`;
    } else if (inst.tipo === 'zona' || inst.tipo === 'errores') {
      const esc = II.escenas[inst.escena](inst.params || {});
      cuerpo = `<div class="lienzo escena ${inst.tipo === 'errores' ? 'modo-errores' : ''}">${esc.svg}</div>
        <p class="nota solo-cel" style="margin:6px 0 0">↔ Desliza el dibujo hacia los lados para verlo completo.</p>
        <p class="nota" style="margin:6px 0 0">${inst.tipo === 'zona' ? 'Toca la letra del lugar que elijas.' : 'Toca todas las letras donde haya un <b>error</b>. Cada error bien marcado suma; cada acierto falso resta.'}</p>
        <div class="nota" data-rol="marcadas" style="margin-top:4px"></div>`;
    } else if (inst.tipo === 'orden') {
      cuerpo = `<p class="nota" style="margin:0 0 8px">Toca los pasos en el orden en que se hacen.</p>
        <div class="orden-lista">${inst.mezcla.map((i) => `<button type="button" class="orden-paso" data-i="${i}" ${bloq ? 'disabled' : ''}><span class="num"></span><span>${inst.pasos[i]}</span></button>`).join('')}</div>
        ${bloq ? '' : '<button type="button" class="boton chico" data-rol="reiniciar" style="margin-top:8px">Reiniciar el orden</button>'}`;
    }
    cont.innerHTML = cab + cuerpo + '<div data-rol="correccion"></div>';

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
      const i = cont.querySelector('input');
      i.addEventListener('input', () => { valor = i.value; avisar(); });
    }
    const pintarZonas = () => {
      const sel = inst.tipo === 'zona' ? (valor ? [valor] : []) : (valor || []);
      cont.querySelectorAll('.zona').forEach((g) => g.classList.toggle('sel', sel.includes(g.dataset.z)));
      const m = cont.querySelector('[data-rol=marcadas]');
      if (m) m.textContent = sel.length ? (inst.tipo === 'zona' ? 'Elegiste: ' : 'Marcaste como error: ') + sel.slice().sort().join(', ') : '';
    };
    if (inst.tipo === 'zona' || inst.tipo === 'errores') {
      if (!bloq) cont.querySelectorAll('.zona').forEach((g) => g.addEventListener('click', () => {
        const z = g.dataset.z;
        if (inst.tipo === 'zona') valor = z;
        else { const s = new Set(valor || []); if (s.has(z)) s.delete(z); else s.add(z); valor = Array.from(s); }
        pintarZonas(); avisar();
      }));
      pintarZonas();
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
          if (k >= 0) s.splice(k); else s.push(i); // tocar uno ya elegido deshace desde ahí
          valor = s.length ? s : null; pintarOrden(); avisar();
        }));
        cont.querySelector('[data-rol=reiniciar]').addEventListener('click', () => { valor = null; pintarOrden(); avisar(); });
      }
      pintarOrden();
    }

    // ---------- corrección ----------
    if (mostrar) {
      const f = P.calificar(inst, valor);
      if (inst.tipo === 'opcion') cont.querySelectorAll('.opcion').forEach((o) => {
        const v = +o.querySelector('input').value;
        o.classList.toggle('correcta', v === inst.c);
        o.classList.toggle('errada', v === valor && v !== inst.c);
      });
      if (inst.tipo === 'zona') cont.querySelectorAll('.zona').forEach((g) => {
        const z = g.dataset.z;
        g.classList.toggle('bien', zonasCorrectas(inst).includes(z));
        g.classList.toggle('mal', z === valor && !zonasCorrectas(inst).includes(z));
      });
      if (inst.tipo === 'errores') cont.querySelectorAll('.zona').forEach((g) => {
        const z = g.dataset.z, esErr = inst.errores.includes(z), marc = (valor || []).includes(z);
        g.classList.toggle('bien', esErr && marc);
        g.classList.toggle('falto', esErr && !marc);
        g.classList.toggle('mal', !esErr && marc);
      });
      if (inst.tipo === 'orden') cont.querySelectorAll('.orden-paso').forEach((b) => {
        const i = +b.dataset.i, k = (valor || []).indexOf(i);
        b.classList.toggle('correcta', k === i);
        b.classList.toggle('errada', k >= 0 && k !== i);
      });
      const clase = opts.claseCorreccion || (f >= 0.999 ? 'ok' : f > 0 ? 'duda' : 'mal');
      const titulo = opts.tituloCorreccion || (f >= 0.999 ? '¡Correcto!' : f > 0 ? `Parcialmente correcto (${II.fmt(f * 100, 0)} %).` : P.respondida(inst, valor) ? 'Incorrecto.' : 'Sin responder.');
      let detalle = '';
      if (inst.tipo === 'errores' || inst.tipo === 'zona') {
        const esc = II.escenas[inst.escena](inst.params || {});
        const lista = inst.tipo === 'errores' ? Object.keys(esc.zonas) : Array.from(new Set(zonasCorrectas(inst).concat(valor ? [valor] : [])));
        detalle = '<ul style="margin:6px 0 0;padding-left:18px">' + lista.sort().map((z) => `<li><b>${z} · ${esc.zonas[z].ok ? '✓' : '✗'}</b> ${esc.zonas[z].t}: ${esc.zonas[z].por}</li>`).join('') + '</ul>';
      }
      cont.querySelector('[data-rol=correccion]').innerHTML = `<div class="aviso ${clase}" style="margin-top:10px"><b>${titulo}</b> ${f >= 0.999 && inst.tipo !== 'orden' ? '' : 'Respuesta correcta: ' + P.correctaHTML(inst)}${inst.por ? `<div style="margin-top:6px">${inst.por}</div>` : ''}${detalle}${inst.fuente ? `<div class="nota" style="margin-top:6px">Fuente: ${inst.fuente}</div>` : ''}</div>`;
    }
    return { valor: () => valor };
  };

  // ---------- escena en modo explicación (en los módulos): tocar una zona muestra por qué ----------
  P.explicarEscena = (cont, nombre, params = {}, consigna = '') => {
    const esc = II.escenas[nombre](params);
    cont.innerHTML = `<div class="diagrama"><div class="diag-2col rango-grid"><div><div class="lienzo escena">${esc.svg}</div><p class="nota solo-cel" style="margin:6px 0 0">↔ Desliza el dibujo hacia los lados para verlo completo.</p></div>
      <div class="panel-info"><span class="etiqueta">${esc.titulo || 'Toca cada letra'}</span><h4 data-rol="t">${consigna || 'Toca cada letra para ver si está bien o mal instalado y por qué.'}</h4><div data-rol="por"></div></div></div></div>`;
    const vistos = new Set();
    cont.querySelectorAll('.zona').forEach((g) => g.addEventListener('click', () => {
      const z = g.dataset.z, d = esc.zonas[z];
      vistos.add(z);
      cont.querySelectorAll('.zona').forEach((x) => { x.classList.toggle('sel', x === g); x.classList.toggle('visto', vistos.has(x.dataset.z)); });
      cont.querySelector('[data-rol=t]').innerHTML = `${z} · ${d.t}`;
      cont.querySelector('[data-rol=por]').innerHTML = `<div class="aviso ${d.ok ? 'ok' : 'mal'}" style="margin:6px 0 0"><b>${d.ok ? '✓ Bien' : '✗ Mal'}</b>: ${d.por}</div>
        <p class="nota" style="margin:8px 0 0">${vistos.size} de ${Object.keys(esc.zonas).length} vistas</p>`;
    }));
  };
})();
