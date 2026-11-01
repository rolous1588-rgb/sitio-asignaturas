// ============================================================
// Sesión 1 — Fundamentos, E/S y primera lógica
// Módulo «Programación de PLCs e Interfaces Industriales» (diplomado en Control Automático Industrial)
// Sábado 31/10/2026 · 09:00–12:00 (3 h) · clase virtual por Google Meet
// Prefijo de sesiones: pl-   (esta es pl-s1)
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  const PL = (II.pl = II.pl || {});
  const V = (x, u = '') => `<span class="valor">${II.fmt(x, 3)}${u ? ' ' + u : ''}</span>`;
  const esc = (s) => II.esc(s);

  // ---------- datos de ingreso (cada sesión se vuelve a pedir) ----------
  II.OPCIONES_INGRESO = {
    area: ['Minería', 'Petróleo y gas', 'Alimentos y bebidas', 'Energía eléctrica', 'Manufactura / industria', 'Agua y saneamiento', 'Construcción', 'Docencia / investigación', 'Estudiante', 'Otro'],
    experiencia: ['Nunca he usado un PLC', 'Lo he visto o usado un poco', 'Trabajo con PLCs con frecuencia']
  };

  // ============================================================
  // RETOS
  // ============================================================
  const FASE_OP = ['Leer las entradas', 'Ejecutar el programa', 'Actualizar las salidas físicas', 'Atender comunicaciones'];

  // ---------- Reto A: tiempo de ciclo ----------
  // ---------- Ejercicio 1: clasificación de señales ----------
  const OP_ES = ['Entrada digital (ED)', 'Salida digital (SD)', 'Entrada analógica (EA)', 'Salida analógica (SA)'];
  const CODIGO_ES = { ED: OP_ES[0], SD: OP_ES[1], EA: OP_ES[2], SA: OP_ES[3] };
  const POOL_ES = {
    ED: [
      ['Pulsador de marcha (verde)', 'Solo tiene dos estados: pulsado o no. Va hacia el PLC.'],
      ['Pulsador de paro de emergencia tipo hongo (contacto NC)', 'Dos estados; el contacto NC sigue siendo una entrada digital.'],
      ['Final de carrera de una compuerta', 'Contacto de dos estados: la compuerta llegó o no.'],
      ['Sensor inductivo de proximidad con salida de 24 V', 'Detecta presencia: todo o nada.'],
      ['Interruptor de nivel tipo flotador', 'Aunque «habla de nivel», solo informa lleno / no lleno: dos estados.'],
      ['Contacto auxiliar de un contactor, para saber si quedó cerrado', 'Dos estados; informa al PLC lo que hizo el contactor.'],
      ['Presostato que cierra un contacto cuando la presión llega a 6 bar', 'Trampa: mide presión, pero entrega un contacto de dos estados.'],
      ['Termostato bimetálico que abre su contacto al pasar de 80 °C', 'Trampa: mide temperatura, pero entrega un contacto de dos estados.'],
      ['Sensor de velocidad que da un pulso por vuelta (contado por una entrada rápida)', 'Trampa: aunque se cuente, cada pulso es una señal de dos estados.']
    ],
    SD: [
      ['Bobina del contactor que arranca el motor de una bomba', 'Sale del PLC y es todo o nada.'],
      ['Lámpara piloto roja de falla', 'Sale del PLC; encendida o apagada.'],
      ['Sirena de alarma', 'Sale del PLC; suena o no suena.'],
      ['Electroválvula todo/nada de 24 V cc', 'Sale del PLC; abierta o cerrada.'],
      ['Relé auxiliar que habilita un ventilador', 'Sale del PLC; dos estados.'],
      ['Freno electromagnético de un motor', 'Sale del PLC; frena o suelta.']
    ],
    EA: [
      ['Transmisor de presión de 4–20 mA', 'Entra al PLC y varía en forma continua.'],
      ['Transmisor de nivel ultrasónico con salida de 4–20 mA', 'Entrega un valor continuo de nivel.'],
      ['Sensor de temperatura PT100 con transmisor de 4–20 mA', 'Entrega un valor continuo de temperatura.'],
      ['Potenciómetro de consigna con salida de 0 a 10 V', 'Valor continuo que entra al PLC.'],
      ['Medidor de caudal electromagnético con salida de 4–20 mA', 'Valor continuo de caudal.'],
      ['Celda de carga con acondicionador de 0 a 10 V', 'Valor continuo de peso.']
    ],
    SA: [
      ['Referencia de velocidad de un variador de frecuencia (0 a 10 V)', 'Sale del PLC y toma muchos valores.'],
      ['Posicionador de una válvula de control (4–20 mA)', 'Sale del PLC y fija un porcentaje de apertura.'],
      ['Indicador de aguja en el tablero (4–20 mA)', 'Sale del PLC y muestra un valor continuo.'],
      ['Referencia de potencia a un control de fase de una resistencia (4–20 mA)', 'Sale del PLC y regula en forma continua.']
    ]
  };

  const retos = {
    // -------------------------------------------------------
    'a-reto': {
      titulo: 'Reto A · Tiempo de ciclo y pulsos',
      puntos: 10,
      general: 'Cada estudiante recibe un PLC distinto: calcula su tiempo de ciclo y decide si puede ver un pulso corto.',
      pista: 'Tiempo de ciclo = lectura y escritura + (instrucciones × tiempo por instrucción) + comunicaciones. Pasa los microsegundos a milisegundos dividiendo entre 1000.',
      errorComun: 'Olvidar convertir de microsegundos a milisegundos, o creer que un pulso más corto que el ciclo «seguramente» se detecta.',
      metodo: 'T = tiempo de E/S + N × t ÷ 1000 + comunicaciones (en ms) · ciclos por segundo = 1000 ÷ T · un pulso se garantiza si dura al menos T',
      generar(r) {
        const N = II.elegir(r, [2000, 3000, 4000, 5000, 8000, 10000]);
        const t = II.elegir(r, [1, 2, 3, 5]);
        const es = II.elegir(r, [1, 2, 3]);
        const com = II.elegir(r, [1, 2, 3, 4]);
        const T = es + (N * t) / 1000 + com;
        const w = Math.max(1, Math.round(T * II.elegir(r, [0.4, 0.6, 1.5, 2.2])));
        const garantiza = w >= T ? 'Sí' : 'No';
        const T2 = es + (2 * N * t) / 1000 + com;
        return {
          enunciado: `<p>Un PLC tiene un programa de ${V(N, 'instrucciones')}; cada una tarda ${V(t, 'µs')}. Leer todas las entradas y escribir todas las salidas tarda ${V(es, 'ms')} en total, y atender las comunicaciones y el diagnóstico tarda ${V(com, 'ms')}.</p>
            <p>Un sensor entrega un pulso que dura ${V(w, 'ms')}.</p>`,
          campos: [
            { id: 'T', tipo: 'num', pregunta: 'a) ¿Cuál es el tiempo de ciclo?', unidad: 'ms', tolRel: 0.02 },
            { id: 'f', tipo: 'num', pregunta: 'b) ¿Cuántos ciclos completa por segundo?', unidad: 'ciclos/s', tolRel: 0.03 },
            { id: 'g', tipo: 'select', pregunta: 'c) ¿Se garantiza que el PLC detecte ese pulso?', opciones: ['Sí', 'No'] },
            { id: 'T2', tipo: 'num', pregunta: 'd) Si el programa se duplica (el doble de instrucciones), ¿cuál es el nuevo tiempo de ciclo?', unidad: 'ms', tolRel: 0.02 },
            { id: 'ph', tipo: 'select', pregunta: 'e) ¿En qué parte del ciclo cambian las salidas físicas?', opciones: FASE_OP }
          ],
          esperado: { T, f: 1000 / T, g: garantiza, T2, ph: FASE_OP[2] },
          solucion: `
            <p><b>a)</b> T = ${II.fmt(es)} + ${II.fmt(N)} × ${II.fmt(t)} ÷ 1000 + ${II.fmt(com)} = ${II.fmt(es)} + ${II.fmt((N * t) / 1000)} + ${II.fmt(com)} = <b>${II.fmt(T, 3)} ms</b></p>
            <p><b>b)</b> 1000 ÷ ${II.fmt(T, 3)} = <b>${II.fmt(1000 / T, 3)} ciclos por segundo</b></p>
            <p><b>c) ${garantiza}</b>: el pulso dura ${II.fmt(w)} ms y el ciclo ${II.fmt(T, 3)} ms. ${w >= T ? 'Dura al menos un ciclo: siempre queda una lectura dentro del pulso.' : 'Dura menos que un ciclo: puede empezar y terminar entre dos lecturas.'}</p>
            <p><b>d)</b> T = ${II.fmt(es)} + ${II.fmt((2 * N * t) / 1000)} + ${II.fmt(com)} = <b>${II.fmt(T2, 3)} ms</b></p>
            <p><b>e) Actualizar las salidas físicas</b>: durante el programa solo cambia la imagen de salidas.</p>`
        };
      }
    },

    // -------------------------------------------------------
    'e1-reto': {
      titulo: 'Ejercicio 1 · Clasifica las señales',
      puntos: 10,
      general: 'Cada estudiante recibe ocho señales distintas (con algunas trampas) y las clasifica como ED, SD, EA o SA.',
      pista: 'Pregunta primero si la señal va hacia el PLC (entrada) o sale de él (salida); luego si toma solo dos estados (digital) o muchos valores (analógica).',
      errorComun: 'Clasificar por lo que mide el sensor y no por el tipo de señal que entrega: un presostato o un flotador miden presión o nivel, pero entregan un contacto (digital).',
      metodo: 'Dirección: entrada o salida. Tipo: ¿dos estados (digital) o valor continuo (analógica)?',
      generar(r) {
        const elegidas = [];
        ['ED', 'SD', 'EA', 'SA'].forEach((k) => {
          const pool = POOL_ES[k].slice();
          for (let i = 0; i < 2; i++) { const x = II.elegir(r, pool); pool.splice(pool.indexOf(x), 1); elegidas.push({ k, n: x[0], por: x[1] }); }
        });
        const orden = II.mezclar(r, elegidas);
        const campos = orden.map((e, i) => ({ id: 's' + (i + 1), tipo: 'select', pregunta: `${i + 1}) ${esc(e.n)}`, opciones: OP_ES }));
        const esperado = {};
        orden.forEach((e, i) => (esperado['s' + (i + 1)] = CODIGO_ES[e.k]));
        return {
          enunciado: '<p>Un tablero de control recibe y entrega las señales siguientes. Para cada una, elige a qué tipo de canal del PLC corresponde.</p>',
          campos, esperado,
          solucion: '<ol style="margin:0;padding-left:20px">' + orden.map((e) => `<li style="margin-bottom:6px">${esc(e.n)}<br><b>${CODIGO_ES[e.k]}</b>: ${esc(e.por)}</li>`).join('') + '</ol>'
        };
      }
    },

    // -------------------------------------------------------
    'c-reto': {
      titulo: 'Reto C · Direcciones y tabla de asignación',
      puntos: 10,
      general: 'Cada estudiante recibe señales y canales distintos: escribe sus direcciones, encuentra el error en una tabla y predice qué cambia al mover un módulo.',
      pista: 'La dirección genérica es TIPO + ranura + punto + canal: ED1.05 = entrada digital, ranura 1, canal 5. El tipo de la señal debe coincidir con el del módulo.',
      errorComun: 'Asignar una señal al módulo equivocado (una analógica a un canal digital), repetir un canal o pasarse del número de canales del módulo.',
      metodo: 'Módulos del rack: ranura 1 ED (16 canales, 0 a 15); ranura 2 SD (16); ranura 3 EA (4, canales 0 a 3); ranura 4 SA (2, canales 0 y 1)',
      generar(r) {
        const por = (t) => PL.SENALES.filter((s) => s.t === t);
        const rack = { ED: 1, SD: 2, EA: 3, SA: 4 }, nCan = { ED: 16, SD: 16, EA: 4, SA: 2 };
        const dir = (t, s, c) => PL.direccion(t, s, c);
        // tres señales con su canal
        const tipos = II.mezclar(r, ['ED', 'SD', 'EA']);
        const items = tipos.map((t) => {
          const s = II.elegir(r, por(t));
          const c = Math.floor(r() * nCan[t]);
          const ok = dir(t, rack[t], c);
          const otroT = II.elegir(r, ['ED', 'SD', 'EA', 'SA'].filter((x) => x !== t));
          const opciones = II.mezclar(r, [ok, dir(t, rack[t] === 4 ? 3 : rack[t] + 1, c), dir(t, rack[t], (c + 1) % nCan[t]), dir(otroT, rack[t], Math.min(c, nCan[otroT] - 1))]
            .filter((x, i, a) => a.indexOf(x) === i));
          return { s, t, c, ok, opciones: opciones.length < 3 ? opciones.concat(['ED0.00', 'SD0.00']).slice(0, 4) : opciones };
        });
        // tabla con un error
        const filas = [];
        const usadas = new Set();
        const posError = Math.floor(r() * 5), causa = II.elegir(r, ['Tipo', 'Repetido', 'Fuera de rango']);
        const base = II.mezclar(r, PL.SENALES).slice(0, 5);
        base.forEach((s, i) => {
          let t = s.t, c;
          do { c = Math.floor(r() * nCan[t]); } while (usadas.has(t + c));
          usadas.add(t + c);
          filas.push({ id: s.id, n: s.n, t: s.t, slot: rack[t], c, dirTexto: dir(t, rack[t], c) });
        });
        const fe = filas[posError];
        if (causa === 'Tipo') { const tt = II.elegir(r, ['ED', 'SD', 'EA', 'SA'].filter((x) => x !== fe.t)); fe.dirTexto = dir(tt, rack[tt], Math.min(fe.c, nCan[tt] - 1)); }
        else if (causa === 'Repetido') {
          const otra = filas[(posError + 1) % 5];
          if (otra.t === fe.t) fe.dirTexto = otra.dirTexto;
          else { // buscar otra del mismo tipo; si no hay, cambia a fuera de rango
            const m = filas.find((f, i) => i !== posError && f.t === fe.t);
            if (m) fe.dirTexto = m.dirTexto; else { fe.dirTexto = dir(fe.t, rack[fe.t], nCan[fe.t] + 1); }
          }
        } else fe.dirTexto = dir(fe.t, rack[fe.t], nCan[fe.t] + II.elegir(r, [1, 2, 3]));
        const dup = filas.filter((f, i) => i !== posError && f.dirTexto === fe.dirTexto).length > 0;
        const causaReal = fe.dirTexto.slice(0, 2) !== fe.t ? 'Tipo' : dup ? 'Repetido' : 'Fuera de rango';
        const lineas = filas.map((f, i) => `L${i + 1}`);
        // cambio de ranura
        const sw = II.elegir(r, por('ED'));
        const cw = Math.floor(r() * 16);
        const antes = dir('ED', 1, cw), ahora = dir('ED', 2, cw);
        const opSw = II.mezclar(r, [ahora, antes, dir('SD', 2, cw), dir('ED', 2, (cw + 1) % 16)]);
        const CAUSAS = ['Tipo: la señal no corresponde al módulo', 'Repetido: dos señales en el mismo canal', 'Fuera de rango: el canal no existe en el módulo'];
        const causaTxt = { Tipo: CAUSAS[0], Repetido: CAUSAS[1], 'Fuera de rango': CAUSAS[2] }[causaReal];
        return {
          enunciado: `<p>El rack tiene: ranura 1 con 16 entradas digitales (ED); ranura 2 con 16 salidas digitales (SD); ranura 3 con 4 entradas analógicas (EA); ranura 4 con 2 salidas analógicas (SA). Los canales se numeran desde 0.</p>
            <p><b>Parte 1.</b> ${items.map((it, i) => `La señal <b>${it.s.id}</b> (${esc(it.s.n)}) está cableada al canal ${V(it.c)} del módulo correspondiente${i < 2 ? ';' : '.'}`).join(' ')}</p>
            <p><b>Parte 2.</b> Un técnico llenó esta tabla y tiene <b>un solo error</b>:</p>
            <div style="overflow:auto"><table class="pl-tabla"><thead><tr><th>Línea</th><th>Señal</th><th>Descripción</th><th>Dirección anotada</th></tr></thead><tbody>${filas.map((f, i) => `<tr><td>L${i + 1}</td><td>${f.id}</td><td>${esc(f.n)}</td><td class="mono">${f.dirTexto}</td></tr>`).join('')}</tbody></table></div>
            <p><b>Parte 3.</b> Después se intercambian de lugar el módulo de entradas digitales (ranura 1) y el de salidas digitales (ranura 2).</p>`,
          campos: [
            ...items.map((it, i) => ({ id: 'd' + (i + 1), tipo: 'select', pregunta: `${i + 1}) ¿Cuál es la dirección de ${it.s.id}?`, opciones: it.opciones })),
            { id: 'lin', tipo: 'select', pregunta: '4) ¿Qué línea de la tabla tiene el error?', opciones: lineas },
            { id: 'cau', tipo: 'select', pregunta: '5) ¿Cuál es el tipo de error?', opciones: CAUSAS },
            { id: 'sw', tipo: 'select', pregunta: `6) La señal ${sw.id} estaba en ${antes}. ¿Cuál es su dirección después del intercambio?`, opciones: opSw }
          ],
          esperado: { d1: items[0].ok, d2: items[1].ok, d3: items[2].ok, lin: lineas[posError], cau: causaTxt, sw: ahora },
          solucion: `
            <p><b>Parte 1.</b> ${items.map((it) => `${it.s.id} = <b>${it.ok}</b>`).join('; ')}.</p>
            <p><b>Parte 2.</b> El error está en <b>${lineas[posError]}</b> (${fe.id}: ${fe.dirTexto}). Causa: <b>${causaTxt}</b>.</p>
            <p><b>Parte 3.</b> La ranura es parte de la dirección: al mover el módulo de entradas a la ranura 2, ${sw.id} pasa de ${antes} a <b>${ahora}</b>. El programa debe actualizarse.</p>`
        };
      }
    },

    // -------------------------------------------------------
    'd-reto': {
      titulo: 'Reto D · Tu enclavamiento',
      puntos: 15,
      general: 'Cada estudiante recibe una de las cuatro variantes (A a D): arma la ecuación con casilleros, que se valida con la tabla de verdad, y predice qué hace el motor ante una secuencia de eventos.',
      pista: 'Primero identifica quién puede arrancar (ramas en paralelo, suma) y qué debe estar en reposo para seguir (condiciones en serie, producto). El paro y la emergencia valen 1 en reposo.',
      errorComun: 'Olvidar la rama de enclavamiento (Q en paralelo con la marcha) y creer que el motor se detiene al soltar la marcha; o usar el paro con la polaridad al revés.',
      metodo: 'Q = (quienes arrancan + Q) · condiciones de seguridad en reposo. Se comprueba con la tabla de verdad probando todas las combinaciones.',
      generar(r) {
        const vr = II.elegir(r, ['A', 'B', 'C', 'D']);
        const VR = PL.ENCLAV[vr];
        const EV = {
          'M+': ['Se pulsa la marcha (M)', { M: 1 }], 'M-': ['Se suelta la marcha (M)', { M: 0 }],
          'M1+': ['Se pulsa la marcha local (M1)', { M1: 1 }], 'M1-': ['Se suelta la marcha local (M1)', { M1: 0 }],
          'M2+': ['Se pulsa la marcha remota (M2)', { M2: 1 }], 'M2-': ['Se suelta la marcha remota (M2)', { M2: 0 }],
          'P+': ['Se pulsa el paro (P)', { P: 0 }], 'P-': ['Se suelta el paro (P)', { P: 1 }],
          'E+': ['Se pulsa la emergencia (E)', { E: 0 }], 'E-': ['Se rearma la emergencia (E)', { E: 1 }],
          'T+': ['Pasan 3 s sin confirmación de flujo (T = 1)', { T: 1 }], 'T-': ['Se corrige la falla y el temporizador vuelve a 0', { T: 0 }]
        };
        const SEQ = {
          A: [['M+', 'M-', 'P+', 'P-'], ['M+', 'P+', 'M-', 'P-'], ['P+', 'M+', 'M-', 'E+']],
          B: [['M1+', 'M1-', 'M2+', 'P+'], ['M2+', 'M2-', 'E+', 'E-'], ['M1+', 'P+', 'M1-', 'M2+']],
          C: [['M+', 'T+', 'M-', 'T-'], ['M+', 'M-', 'T+', 'T-'], ['M+', 'M-', 'P+', 'M+']],
          D: [['M+', 'M-', 'P+', 'P-'], ['M+', 'P+', 'M-', 'P-'], ['M+', 'M-', 'E+', 'M+']]
        };
        const sec = II.elegir(r, SEQ[vr]);
        const v = { M: 0, M1: 0, M2: 0, P: 1, E: 1, T: 0, Q: 0 };
        const q = [];
        sec.forEach((k) => { Object.assign(v, EV[k][1]); for (let i = 0; i < 3; i++) v.Q = VR.meta(v) ? 1 : 0; q.push(v.Q); });
        const cuando = q.findIndex((x, i) => i > 0 && x === 0 && q[i - 1] === 1);
        const OPC_CU = ['En el evento 1', 'En el evento 2', 'En el evento 3', 'En el evento 4', 'Nunca se apaga'];
        const OPC_FIN = ['Encendido (Q = 1)', 'Apagado (Q = 0)'];
        const unos = PL.cuentaUnos(vr);
        const nCas = PL.nCasilleros(vr);
        return {
          variante: vr,
          enunciado: `<p><b>${VR.nombre}</b></p><p>${VR.desc}</p>`,
          campos: [
            { id: 'ec', tipo: 'slots', variante: vr, plantilla: VR.plantilla, lits: VR.lits, n: nCas, pregunta: '1) Arma la ecuación. Se valida con la tabla de verdad, así que vale cualquier forma equivalente.',
              verificar: (sl) => PL.verificarEc(vr, sl).ok },
            { id: 'unos', tipo: 'num', pregunta: `2) De las ${1 << VR.vars.length} combinaciones posibles de ${VR.vars.join(', ')}, ¿en cuántas debe valer Q = 1?`, unidad: 'combinaciones', tolRel: 0 },
            { id: 'fin', tipo: 'select', pregunta: `3) Con el motor detenido y todo en reposo, ocurre esta secuencia: ${sec.map((k, i) => `(${i + 1}) ${EV[k][0]}`).join('; ')}. ¿Cómo queda el motor al final?`, opciones: OPC_FIN },
            { id: 'cua', tipo: 'select', pregunta: '4) En la misma secuencia, ¿en qué evento se apaga el motor por primera vez?', opciones: OPC_CU }
          ],
          esperado: { ec: '(validado por tabla de verdad)', unos, fin: OPC_FIN[q[3] ? 0 : 1], cua: cuando < 0 ? OPC_CU[4] : OPC_CU[cuando] },
          solucion: `
            <p><b>1)</b> Una forma correcta es <b class="mono">${PL.ecuacionTexto(vr)}</b>. Se puede escribir de otras maneras equivalentes.</p>
            <p><b>2)</b> Probando las ${1 << VR.vars.length} combinaciones de la tabla de verdad, Q vale 1 en <b>${unos}</b>.</p>
            <p><b>3) y 4)</b> Evento por evento (el estado de Q después de cada uno): ${sec.map((k, i) => `(${i + 1}) ${EV[k][0]} → <b>Q = ${q[i]}</b>`).join('; ')}.</p>
            <p>Al final queda <b>${OPC_FIN[q[3] ? 0 : 1]}</b>; ${cuando < 0 ? 'nunca se apaga.' : `se apaga por primera vez en el <b>evento ${cuando + 1}</b>.`}</p>`
        };
      }
    }
  };

  // ============================================================
  // DIAGNÓSTICO
  // ============================================================
  const diagnostico = [
    { t: '¿Qué componente de un PLC ejecuta el programa del usuario?', o: ['La fuente de alimentación', 'La CPU', 'El módulo de salidas', 'El switch de red'], c: 1 },
    { t: 'Un transmisor de presión de 4–20 mA se conecta al PLC. Es una señal de tipo:', o: ['Entrada digital', 'Salida digital', 'Entrada analógica', 'Salida analógica'], c: 2 },
    { t: 'Un PLC trabaja de forma cíclica. ¿Cuál es el orden normal de cada ciclo?', o: ['Escribir salidas, leer entradas, ejecutar', 'Leer entradas, ejecutar el programa, actualizar salidas', 'Ejecutar el programa, leer entradas, apagar', 'Solo reacciona cuando cambia una entrada'], c: 1 },
    { t: 'Para arrancar un motor grande, la salida del PLC debe comandar:', o: ['El motor directamente', 'La bobina de un contactor', 'Un sensor de proximidad', 'Un transmisor 4–20 mA'], c: 1 },
    { t: 'Un pulsador de paro cableado como NC (normalmente cerrado). Si se corta el cable, el PLC interpreta:', o: ['Que nadie pulsó el paro', 'Que se pulsó el paro', 'Que el motor está en marcha', 'Nada: no se detecta'], c: 1 }
  ];

  // ============================================================
  // PASOS
  // ============================================================
  const pasos = [
    { id: 'inicio', tipo: 'espera', titulo: 'Bienvenidos al módulo de Programación de PLCs e Interfaces Industriales' },
    { id: 'rubrica', tipo: 'rubrica', titulo: 'Cómo se evalúa este módulo' },
    { id: 'diagnostico', tipo: 'cuestionario', titulo: 'Diagnóstico rápido: 5 preguntas' },

    // ----- Bloque A -----
    { id: 'a-explica', tipo: 'explica', ciclo: 1, titulo: 'Bloque A · Arquitectura del PLC', diagrama: 'plc', pestana: 'arq',
      ideas: [
        'Un PLC es un computador industrial: <b>fuente</b>, <b>CPU con memoria</b>, <b>módulos de entradas y salidas</b>, <b>bus de fondo</b> y <b>comunicaciones</b> (Ethernet).',
        'Las entradas traen la información del campo (pulsadores, sensores); las salidas comandan los actuadores (contactores, lámparas, válvulas).',
        'La salida del PLC es de baja potencia: <b>comanda</b> un contactor o un relé; no mueve el motor directamente.',
        'Cada punto de conexión es un <b>canal</b> con su propia dirección. El programa solo ve lo que está cableado.'
      ] },
    { id: 'ra1', tipo: 'rapida', ciclo: 1, titulo: 'Pregunta rápida 1', t: '¿Qué componente guarda el programa del usuario y ejecuta la lógica?',
      o: ['El módulo de salidas', 'La CPU con su memoria', 'La fuente de alimentación', 'El switch de Ethernet'], c: 1,
      por: 'La CPU, con su memoria, guarda y ejecuta el programa. Los módulos de E/S solo conectan el campo con la CPU.' },
    { id: 'a-explica2', tipo: 'explica', ciclo: 1, titulo: 'Bloque A · El ciclo de escaneo', diagrama: 'plc', pestana: 'ciclo',
      ideas: [
        'El PLC repite sin parar cuatro fases: <b>leer entradas</b>, <b>ejecutar el programa</b>, <b>actualizar salidas</b>, <b>comunicaciones y diagnóstico</b>.',
        'El programa trabaja con una <b>imagen</b> de las entradas tomada al inicio del ciclo; las salidas físicas cambian recién al final.',
        'El <b>tiempo de ciclo</b> (de pocos a decenas de ms) fija qué tan rápido reacciona: un pulso más corto que el ciclo puede pasar inadvertido.',
        'Si el ciclo se pasa del límite, el <b>watchdog</b> detiene la CPU y las salidas van a un estado seguro.'
      ] },
    { id: 'ra2', tipo: 'rapida', ciclo: 1, titulo: 'Pregunta rápida 2', t: 'Un programa cambia la salida Q1 a 1 al comienzo y a 0 al final del mismo ciclo. ¿Qué recibe la lámpara conectada a Q1?',
      o: ['Un parpadeo muy rápido', 'Solo el valor final: 0', 'Solo el valor inicial: 1', 'Depende de la marca del PLC'], c: 1,
      por: 'Las salidas físicas se actualizan una sola vez, al final del ciclo, con el último valor de la imagen: 0.' },
    { id: 'ra3', tipo: 'rapida', ciclo: 1, titulo: 'Pregunta rápida 3', t: 'El ciclo del PLC es de 15 ms y un sensor da un pulso de 3 ms. ¿Se garantiza que el PLC lo cuente?',
      o: ['Sí, siempre', 'No: puede empezar y terminar entre dos lecturas', 'Sí, porque el pulso es muy limpio', 'Solo si hay watchdog'], c: 1,
      por: 'Para garantizarlo, el pulso debería durar más que el ciclo. Con 3 ms contra 15 ms se puede perder; se usa una entrada rápida o una interrupción.' },
    { id: 'a-explora', tipo: 'explora', ciclo: 1, titulo: 'Explora la arquitectura y el ciclo', diagrama: 'plc', pestana: 'arq',
      guia: [
        'Toca las <b>nueve partes</b> del PLC y lee «Cómo se ve en la realidad» de cada una.',
        'En <b>Ciclo de escaneo</b>: con ciclo de 20 ms, ¿cuál es el pulso más corto que el PLC todavía detecta siempre?',
        'En <b>Casos especiales → Watchdog</b>: ¿qué pasa si el programa tarda más que el límite?',
        'En <b>Corte de energía</b>: ¿qué conserva la memoria retentiva?'
      ] },
    { id: 'a-reto', tipo: 'reto', ciclo: 1, titulo: 'Reto A · Tiempo de ciclo y pulsos', reto: 'a-reto' },
    { id: 'a-revisa', tipo: 'revisa', ciclo: 1, titulo: 'Revisión del Reto A', reto: 'a-reto' },

    // ----- Bloque B -----
    { id: 'b-explica', tipo: 'explica', ciclo: 2, titulo: 'Bloque B · Repaso: tipos de señal de E/S', diagrama: 'repasoES', pestana: 'tipos',
      ideas: [
        'Cuatro tipos de canal: <b>ED</b> (entrada digital), <b>SD</b> (salida digital), <b>EA</b> (entrada analógica) y <b>SA</b> (salida analógica).',
        'Primero se pregunta <b>quién manda</b> (entra al PLC o sale de él) y luego si la señal tiene <b>dos estados</b> o <b>muchos valores</b>.',
        'Lo que importa es la señal que se entrega, no lo que se mide: un flotador mide nivel pero entrega un contacto (digital).',
        'El paro y la emergencia se cablean con contacto <b>NC</b>: si el cable se corta, la falla es segura.'
      ] },
    { id: 'rb1', tipo: 'rapida', ciclo: 2, titulo: 'Pregunta rápida 4', t: 'Un presostato cierra un contacto cuando la presión llega a 6 bar. Conectado al PLC es una:',
      o: ['Entrada analógica', 'Entrada digital', 'Salida digital', 'Salida analógica'], c: 1,
      por: 'Aunque «habla» de presión, entrega un contacto de dos estados: entrada digital.' },
    { id: 'b-explora', tipo: 'explora', ciclo: 2, titulo: 'Explora el 4–20 mA y el paro NC', diagrama: 'repasoES', pestana: 'ma',
      guia: [
        'En <b>Lazo 4–20 mA</b>: pon la presión en 0 bar. ¿Cuántos mA llegan? ¿Por qué no son 0 mA?',
        'Corta el cable del transmisor. ¿Qué valor ve el módulo y cómo distingue la falla?',
        'En <b>Paro de emergencia NC</b>: corta el cable con el paro NC y luego con el paro NA. ¿En cuál se detiene el motor?',
        'Explica con tus palabras por qué se prefiere NC para paro y emergencia.'
      ] },
    { id: 'rb2', tipo: 'rapida', ciclo: 2, titulo: 'Pregunta rápida 5', t: 'Un transmisor 4–20 mA entrega 0 mA al módulo analógico. ¿Qué indica?',
      o: ['Que la variable vale 0 %', 'Una falla (cable cortado o transmisor sin energía)', 'Que el valor está al 50 %', 'Que el módulo está perfecto'], c: 1,
      por: 'El mínimo normal es 4 mA (0 %). 0 mA es el «cero vivo»: significa falla.' },
    { id: 'e1-reto', tipo: 'reto', ciclo: 2, titulo: 'Ejercicio 1 · Clasifica las señales', reto: 'e1-reto' },
    { id: 'e1-revisa', tipo: 'revisa', ciclo: 2, titulo: 'Revisión del Ejercicio 1', reto: 'e1-reto' },

    // ----- Bloque C -----
    { id: 'c-explica', tipo: 'explica', ciclo: 3, titulo: 'Bloque C · Racks, módulos y direcciones', diagrama: 'rack', pestana: 'asig',
      ideas: [
        'Cada canal físico tiene una <b>dirección</b> con la que el programa lo nombra. En este curso: <b>TIPO + ranura + punto + canal</b>, por ejemplo <b>ED1.05</b>.',
        'Cada fabricante tiene su propia notación (IEC 61131-3, Siemens, Allen-Bradley, Mitsubishi, Omron, Schneider): cambia el nombre, no la idea.',
        'La <b>tabla de asignación</b> es el documento que une cada señal de campo con su dirección. Se hace <b>antes</b> de programar.',
        'Buenas prácticas: agrupar por función, dejar <b>canales de reserva</b> y no mover módulos sin actualizar la tabla.'
      ] },
    { id: 'rc1', tipo: 'rapida', ciclo: 3, titulo: 'Pregunta rápida 6', t: 'En la notación del curso, ¿qué significa SD2.03?',
      o: ['Salida digital, ranura 2, canal 3', 'Sensor digital, ranura 3, canal 2', 'Entrada digital, ranura 2, canal 3', 'Salida analógica, ranura 2, canal 3'], c: 0,
      por: 'SD = salida digital; 2 = ranura; 03 = canal.' },
    { id: 'c-explora', tipo: 'explora', ciclo: 3, titulo: 'Arma tu tabla de asignación', diagrama: 'rack', pestana: 'asig',
      guia: [
        'Toca una señal y luego un canal libre del módulo correcto. Prueba poner una analógica en un módulo digital: ¿qué responde el rack?',
        'Usa <b>Asignar automáticamente</b> y revisa la tabla. ¿Qué mejorarías (agrupar, dejar reserva)?',
        'En <b>Otras marcas</b>: elige LT101 y compara su dirección en cada sistema.',
        'Descarga la tabla (Excel / CSV): es la base de la tarea del <b>Control de estudio 1</b>.'
      ] },
    { id: 'rc2', tipo: 'rapida', ciclo: 3, titulo: 'Pregunta rápida 7', t: 'Se cambia de lugar un módulo de entradas dentro del rack. ¿Qué debe hacerse antes de arrancar?',
      o: ['Nada: el PLC corrige las direcciones solo', 'Actualizar la tabla de direcciones y el programa', 'Cambiar la fuente de alimentación', 'Reiniciar el switch de red'], c: 1,
      por: 'Las direcciones dependen de la ranura: si el módulo se mueve, cambian y el programa ya no apunta a lo correcto.' },
    { id: 'c-reto', tipo: 'reto', ciclo: 3, titulo: 'Reto C · Direcciones y tabla de asignación', reto: 'c-reto' },
    { id: 'c-revisa', tipo: 'revisa', ciclo: 3, titulo: 'Revisión del Reto C', reto: 'c-reto' },

    // ----- Bloque D -----
    { id: 'd-explica', tipo: 'explica', ciclo: 4, titulo: 'Bloque D · El enclavamiento marcha-paro', diagrama: 'enclav', pestana: 'gr',
      ideas: [
        'Un pulsador de marcha es momentáneo: al soltarlo, el motor debe <b>seguir funcionando</b>. Eso exige memoria: el <b>enclavamiento</b>.',
        'El mismo programa se escribe de cuatro maneras: <b>GRAFCET</b> (comportamiento), <b>logigrama</b> (compuertas), <b>ecuación lógica</b> y <b>escalera</b> (contactos y bobina).',
        'La ecuación base es <b>Q = (M + Q) · P · E</b>: quien arranca (M o la propia Q) y, en serie, las condiciones de seguridad en reposo.',
        'El paro (P) y la emergencia (E) están cableados <b>NC</b>: valen 1 en reposo. Pulsarlos pone la condición en 0 y apaga la salida.'
      ] },
    { id: 'rd1', tipo: 'rapida', ciclo: 4, titulo: 'Pregunta rápida 8', t: 'En el enclavamiento, ¿qué mantiene encendido el motor después de soltar la marcha?',
      o: ['El propio pulsador de marcha', 'La salida Q realimentada en paralelo con la marcha', 'El pulsador de paro', 'La fuente de alimentación'], c: 1,
      por: 'La rama en paralelo con Q (la memoria) mantiene la condición mientras no haya paro ni emergencia.' },
    { id: 'd-explora', tipo: 'explora', ciclo: 4, titulo: 'Explora el enclavamiento', diagrama: 'enclav', pestana: 'gr',
      guia: [
        'Pulsa <b>Marcha</b> y observa cómo cambian las cuatro pestañas a la vez. ¿Qué pasa al soltarla?',
        'Activa <b>Emergencia</b> con el motor en marcha y luego intenta arrancar. ¿Qué lo impide?',
        'En <b>Ecuaciones</b>, localiza en la tabla la fila que corresponde a «motor en marcha, marcha suelta». ¿Cuánto vale Q?',
        'En <b>Practicar</b>, resuelve las variantes B, C y D con los casilleros.'
      ] },
    { id: 'rd2', tipo: 'rapida', ciclo: 4, titulo: 'Pregunta rápida 9', t: 'En la ecuación Q = (M + Q) · P · E, ¿qué pasa si P vale 0 (paro pulsado)?',
      o: ['Q puede seguir en 1 si hay enclavamiento', 'Q vale 0 aunque M o Q valgan 1', 'Q vale 1 siempre', 'La ecuación no se puede evaluar'], c: 1,
      por: 'P está en serie (producto): si vale 0, todo el producto vale 0 y el motor se detiene.' },
    { id: 'd-reto', tipo: 'reto', ciclo: 4, titulo: 'Reto D · Tu enclavamiento', reto: 'd-reto' },
    { id: 'd-revisa', tipo: 'revisa', ciclo: 4, titulo: 'Revisión del Reto D', reto: 'd-reto' },

    // ----- cápsula y cierre -----
    { id: 'gemelo', tipo: 'explica', titulo: 'Cápsula · Gemelo digital', diagrama: 'gemelo',
      ideas: [
        'Un <b>gemelo digital</b> es un modelo del proceso que se compara con la planta real mientras funciona.',
        'Con él se puede <b>probar un programa</b> antes de conectarlo y <b>detectar desviaciones</b> (una válvula atascada, una fuga).',
        'En este módulo vamos a usar modelos simples del proceso para probar la lógica antes de llevarla a un equipo real.'
      ] },
    { id: 'cierre', tipo: 'cierre', titulo: 'Cierre de la Sesión 1',
      ideas: [
        'El PLC repite un <b>ciclo de escaneo</b>: leer entradas, ejecutar, actualizar salidas, comunicaciones.',
        'Cada señal de campo tiene un <b>tipo</b> (ED, SD, EA, SA) y una <b>dirección</b> en la tabla de asignación.',
        'El <b>enclavamiento</b> da memoria al arranque; el paro y la emergencia, en NC, hacen la falla segura.',
        'Tarea: <b>Control de estudio 1</b> (asíncrona): tabla de E/S con direcciones, «detecta el error» en 3 casos y un razonamiento escrito.'
      ] }
  ];

  II.SESIONES['pl-s1'] = {
    id: 'pl-s1', numero: 1,
    titulo: 'Fundamentos, E/S y primera lógica',
    fecha: 'Sábado 31/10; 09:00–12:00',
    siguiente: 'Sesión 2: el docente la indicará en clase',
    retos, diagnostico, pasos
  };

  // ============================================================
  // GUION DOCENTE (solo se ve en el panel del celular)
  // ============================================================
  const GUION = {
    inicio: { min: 8,
      objetivo: 'Que todos entren con nombre y carnet y sepan cómo va a funcionar la clase.',
      pasos: [
        '<b>Haz:</b> comparte en Meet la pestaña con la <b>presentación</b> (tiene el QR y el enlace). Abre este panel en tu celular.',
        '<b>Haz:</b> toca <b>«Copiar enlace de estudiantes»</b> y pégalo en el chat de Meet.',
        '<b>Di:</b> "Buenos días. Entren con el QR o el enlace del chat con <b>su nombre y su carnet</b>. <b>En cada sesión hay que volver a entrar</b>: así sé quién está conectado hoy."',
        '<b>Di:</b> "Hoy es la primera sesión del módulo de <b>Programación de PLCs e Interfaces Industriales</b>. Veremos cómo trabaja un PLC, sus entradas y salidas, las direcciones y el primer programa: el enclavamiento."',
        '<b>Di:</b> "No hay diapositivas: cada uno trabaja en su dispositivo. La pantalla compartida es para explicar; el trabajo está en sus celulares."',
        '<b>Haz:</b> mira el contador de <b>Conectados</b> en el panel.'
      ],
      dudas: [
        '"No me carga" → que recarguen o prueben con datos móviles.',
        '"Me equivoqué de carnet" → botón «Salir» arriba y vuelven a entrar.',
        '"¿Tengo que entrar en cada sesión?" → Sí. El ingreso es independiente por sesión.'
      ],
      transicion: 'Cuando la mayoría esté conectada, toca <b>Siguiente</b>.' },

    rubrica: { min: 12,
      objetivo: 'Que entiendan cómo se evalúa todo el módulo y la regla de la penalización por no responder cuando se les llama.',
      pasos: [
        '<b>Di:</b> "Antes de empezar, la rúbrica. Es para <b>todo el módulo</b>: participación 25 %, control de estudio 10 %, foro 25 % y examen final 40 %."',
        '<b>Haz:</b> señala en la pantalla la barra de colores y recorre las cuatro filas.',
        '<b>Di:</b> "La <b>participación</b> sale de lo que hacemos en clase: retos y preguntas rápidas. <b>Cada día vale 100 %</b> de lo que realmente se hizo ese día. Si la clase termina antes, se evalúa solo lo que llegamos a hacer."',
        '<b>Di:</b> "Ahora lo importante: <b>la penalización</b>. Durante la clase puedo llamar a un compañero conectado con una ruleta, para que me responda una pregunta en voz alta. <b>Responder no da puntos, pero tampoco quita.</b> Es solo una forma de que estemos atentos."',
        '<b>Di:</b> "Si lo llamo y <b>no responde</b>, porque abandonó la clase o no está atento, a su participación <b>de ese día</b> se le restan <b>30 puntos porcentuales</b>. Se aplica una sola vez por día, aunque lo llame dos veces."',
        '<b>Haz:</b> muestra el ejemplo de la pantalla: 80 % de participación bruta, con penalización queda 50 %.',
        '<b>Di:</b> "Se sortea solo entre los que están <b>conectados</b>. Si se acabó el tiempo y no hicimos algo, lo traslado a la siguiente sesión y sus puntos cuentan solo en esa nueva sesión."'
      ],
      preguntas: [
        '<b>"¿Cuánto vale responder cuando me llaman?"</b> → Nada: ni suma ni resta.',
        '<b>"Hice el 80 % de la participación de hoy y no respondí cuando me llamaron. ¿Cuánto me queda?"</b> → 80 − 30 = 50 %.'
      ],
      dudas: [
        '"¿Y si se me cayó el internet?" → Avísame por el chat apenas vuelvas; puedo anular esa llamada desde mi panel.',
        '"¿La penalización pasa a otros días?" → No, es solo del día en que no respondiste.'
      ],
      transicion: 'Pregunta si hay dudas y toca <b>Siguiente</b>.' },

    diagnostico: { min: 6,
      objetivo: 'Saber desde dónde empezar. No tiene nota.',
      pasos: [
        '<b>Di:</b> "Cinco preguntas, <b>sin nota</b>. Tienen 4 minutos."',
        '<b>Haz:</b> toca <b>Pizarra → Diagnóstico</b> para ver los porcentajes por pregunta.',
        '<b>Di:</b> no des las respuestas: "las vamos a descubrir durante la clase".'
      ],
      transicion: 'Cuando casi todos hayan respondido, toca <b>Siguiente</b>.' },

    'a-explica': { min: 10,
      objetivo: 'Que ubiquen cada parte de un PLC y para qué sirve.',
      pasos: [
        '<b>Di:</b> "¿Qué creen que es un PLC por dentro?" Deja 2 o 3 respuestas en el chat.',
        '<b>Haz:</b> en la pantalla compartida toca <b>FUENTE</b>: "convierte la red en 24 V cc para el bus interno".',
        '<b>Haz:</b> toca <b>CPU</b> y <b>MEMORIA</b>: "el cerebro; la memoria guarda el programa, los datos y una imagen de las entradas y salidas".',
        '<b>Haz:</b> toca <b>ENTRADAS DIGITALES</b> y <b>SALIDAS DIGITALES</b>: "los LED indican qué canal está activo; los bornes se numeran".',
        '<b>Haz:</b> toca <b>BUS DE FONDO</b> y <b>Ethernet</b>. Menciona la HMI y la PC de programación.',
        '<b>Haz:</b> toca los dispositivos de campo: pulsadores, sensor, contactor, motor y lámpara.',
        '<b>Di:</b> "La salida del PLC <b>comanda</b> un contactor; no mueve el motor. Es de baja potencia."'
      ],
      preguntas: ['<b>"¿Por qué el motor no se conecta directo al módulo de salidas?"</b> → Porque la salida es de baja potencia: se comanda un contactor que maneja la potencia.'],
      dudas: ['"¿Todos los PLC son modulares?" → No: existen compactos, con todo en un solo cuerpo; la idea es la misma.'],
      transicion: 'Toca <b>Siguiente</b> para la pregunta rápida.' },

    ra1: { min: 2, puntos: ['Toca <b>Cerrar pregunta</b> cuando ~80 % haya respondido. Comenta la barra de resultados y la explicación.'] },

    'a-explica2': { min: 10,
      objetivo: 'Que entiendan el ciclo de escaneo y sus consecuencias: imagen de proceso, pulsos cortos, salidas al final y watchdog.',
      pasos: [
        '<b>Haz:</b> en la pestaña <b>Ciclo de escaneo</b> deja la animación avanzar y explica cada fase.',
        '<b>Di:</b> "El PLC no mira el mundo todo el tiempo: lo mira <b>una vez por ciclo</b>."',
        '<b>Haz:</b> en el cronograma deja ciclo 20 ms, pulso 12 ms y mueve el momento: siempre lo ve. Luego baja el pulso a 4 ms: a veces lo pierde.',
        '<b>Haz:</b> pasa a <b>Casos especiales</b> y recorre: pulso corto, salidas al final, watchdog, corte de energía, PLC contra relé y microcontrolador.',
        '<b>Di:</b> en cada caso, lee la «pregunta para pensar», espera una respuesta del chat y recién entonces toca <b>Ver respuesta</b>.'
      ],
      preguntas: [
        '<b>"Un sensor da un pulso de 3 ms y el ciclo es de 15 ms: ¿lo cuenta?"</b> → No siempre; se usa una entrada rápida o una interrupción.',
        '<b>"Q1 se enciende y se apaga en el mismo ciclo: ¿parpadea la lámpara?"</b> → No: la salida recibe solo el valor final.'
      ],
      dudas: ['"¿Y si necesito reacción más rápida?" → Entradas con interrupción, contadores rápidos o módulos de control de movimiento.'],
      transicion: 'Toca <b>Siguiente</b> hasta las preguntas rápidas 2 y 3, luego la exploración.' },

    ra2: { min: 2, puntos: ['Cierra la pregunta, comenta la barra y refuerza: <b>solo el valor final</b> llega a la salida física.'] },
    ra3: { min: 2, puntos: ['Cierra la pregunta. Refuerza: para garantizar un pulso, debe durar <b>más que el ciclo</b>.'] },

    'a-explora': { min: 7,
      objetivo: 'Que exploren arquitectura, ciclo y casos especiales por su cuenta.',
      pasos: [
        '<b>Di:</b> "Abran el diagrama en su dispositivo y respondan la guía. No tiene nota."',
        '<b>Haz:</b> lee el chat y pregunta a 1 o 2 qué encontraron.',
        'Respuestas: pulso mínimo con ciclo de 20 ms = <b>más de 20 ms</b>; watchdog: la CPU pasa a falla y las salidas a estado seguro; retentiva: conserva el valor al perder energía.'
      ],
      transicion: 'Avisa "1 minuto" y toca <b>Siguiente</b>.' },

    'a-reto': { min: 8,
      objetivo: 'Calcular el tiempo de ciclo y decidir si un pulso se detecta.',
      pasos: [
        '<b>Di:</b> "Cada uno tiene un PLC distinto. Convertir microsegundos a milisegundos es el error típico."',
        '<b>Haz:</b> mira la <b>Pizarra</b>: rojo = se equivocó estando seguro. Toca un nombre para ver qué falló.',
        '<b>Haz:</b> cuando ~80 % haya enviado, toca <b>Cerrar reto</b> (30 s).'
      ],
      transicion: 'Toca <b>Siguiente</b> para la revisión.' },
    'a-revisa': { min: 5, puntos: ['Comenta los resultados de la pantalla.', 'Resuelve uno genérico: 2000 instrucciones × 2 µs = 4 ms; con 1 ms de E/S y 2 ms de comunicaciones, T = <b>7 ms</b>.', 'Error frecuente: no convertir µs a ms.'] },

    'b-explica': { min: 8,
      objetivo: 'Repasar los cuatro tipos de señal y por qué el paro es NC.',
      pasos: [
        '<b>Haz:</b> en <b>Tipos de señal</b> toca cada tarjeta (ED, SD, EA, SA) y da un ejemplo de su planta.',
        '<b>Di:</b> "Se clasifica por la señal que se entrega, no por lo que se mide."',
        '<b>Haz:</b> pasa a <b>Paro de emergencia NC</b>: con paro NC corta el cable (el motor se detiene); con paro NA corta el cable (el motor sigue: <b>falla insegura</b>).',
        '<b>Di:</b> "Un PLC <b>no sustituye</b> la cadena de seguridad cableada: la parada de emergencia real corta la potencia con un relé de seguridad."'
      ],
      preguntas: ['<b>"¿Por qué el paro es NC?"</b> → Para que un cable cortado se interprete como paro: la falla es segura.'],
      transicion: 'Toca <b>Siguiente</b>.' },
    rb1: { min: 2, puntos: ['Cierra la pregunta. Refuerza: presostato y flotador miden, pero <b>entregan un contacto</b>: digitales.'] },
    'b-explora': { min: 5,
      pasos: [
        '<b>Di:</b> "Abran el lazo 4–20 mA y pongan la presión en 0 bar: ¿cuántos mA?" → 4 mA.',
        '<b>Di:</b> "Corten el cable: 0 mA. Eso es una <b>falla</b>, no una medición."',
        '<b>Haz:</b> pide que prueben el paro NC y el NA con el cable cortado.'
      ],
      transicion: 'Avisa "1 minuto" y toca <b>Siguiente</b>.' },
    rb2: { min: 2, puntos: ['Cierra la pregunta. Refuerza el <b>cero vivo</b>: 4 mA = 0 %; 0 mA = falla.'] },
    'e1-reto': { min: 7,
      objetivo: 'Clasificar ocho señales, con algunas trampas.',
      pasos: [
        '<b>Di:</b> "Cada uno tiene ocho señales distintas. Hay trampas: no clasifiquen por lo que mide el sensor, sino por lo que entrega."',
        '<b>Haz:</b> cuando ~80 % haya enviado, toca <b>Cerrar reto</b>.'
      ],
      transicion: 'Toca <b>Siguiente</b>.' },
    'e1-revisa': { min: 5, puntos: ['Comenta los resultados.', 'Repasa las trampas: presostato, termostato, flotador y sensor de pulsos son <b>digitales</b>.', 'Pide a un estudiante que explique una de sus respuestas con el criterio «entra o sale; dos estados o continuo».'] },

    'c-explica': { min: 10,
      objetivo: 'Entender cómo se nombra cada canal y para qué sirve la tabla de asignación.',
      pasos: [
        '<b>Haz:</b> en <b>Asignar canales</b> toca la señal S1 y luego un canal ED: aparece <b>ED1.00</b>.',
        '<b>Haz:</b> intenta poner LT101 (analógica) en un módulo digital: el rack avisa. "Eso lo evita el diseño."',
        '<b>Haz:</b> pulsa <b>Asignar automáticamente</b> y muestra la tabla; comenta qué se puede mejorar.',
        '<b>Haz:</b> pasa a <b>Otras marcas</b>: "la misma señal se escribe distinto según el fabricante (IEC, Siemens, Allen-Bradley, Mitsubishi, Omron, Schneider)".',
        '<b>Di:</b> "Aquí usamos una notación genérica. La numeración real depende del modelo: se confirma en el manual."',
        '<b>Haz:</b> en <b>Casos especiales</b> recorre: canales de reserva, cambio de ranura, redundancia, E/S remotas y diagnóstico.'
      ],
      preguntas: ['<b>"Si muevo un módulo de ranura, ¿qué pasa con las direcciones?"</b> → Cambian: hay que actualizar la tabla y el programa.'],
      transicion: 'Toca <b>Siguiente</b>.' },
    rc1: { min: 2, puntos: ['Cierra la pregunta. Lee en voz alta SD2.03 como «salida digital, ranura 2, canal 3».'] },
    'c-explora': { min: 8,
      pasos: [
        '<b>Di:</b> "Armen su tabla en el rack y descárguenla: la usaremos en el control de estudio."',
        '<b>Haz:</b> recorre el chat y pregunta a 1 o 2 qué agruparon y qué dejaron de reserva.'
      ],
      transicion: 'Avisa "1 minuto" y toca <b>Siguiente</b>.' },
    rc2: { min: 2, puntos: ['Cierra la pregunta. Refuerza: la ranura forma parte de la dirección.'] },
    'c-reto': { min: 10, pasos: ['<b>Di:</b> "Seis preguntas con sus propios canales: direcciones, un error en una tabla y el efecto de intercambiar módulos."', '<b>Haz:</b> mira la pizarra y cierra cuando ~80 % haya enviado.'], transicion: 'Toca <b>Siguiente</b>.' },
    'c-revisa': { min: 5, puntos: ['Comenta los resultados.', 'Repasa los tres tipos de error de una tabla: tipo, repetido y fuera de rango.'] },

    'd-explica': { min: 15,
      objetivo: 'Entender el enclavamiento y ver el mismo programa en cuatro representaciones.',
      pasos: [
        '<b>Di:</b> "El pulsador de marcha se suelta; el motor debe seguir. ¿Cómo lo logra el PLC?" Deja 2 respuestas.',
        '<b>Haz:</b> en <b>1 · GRAFCET</b> pulsa <b>Marcha</b>: la etapa 0 pasa a 1. Pulsa <b>Paro</b>: vuelve. "Este es el GRAFCET básico del que salen todos los demás."',
        '<b>Haz:</b> pasa a <b>2 · Logigrama</b> y pulsa Marcha: sigue la línea azul. Señala la realimentación de Q: "la memoria".',
        '<b>Haz:</b> en <b>3 · Ecuaciones</b> lee Q = (M + Q) · P · E y señala en la tabla la fila activa.',
        '<b>Haz:</b> en <b>4 · Escalera</b> pulsa Marcha: la corriente fluye por la rama de arriba; al soltar, por la de abajo (Q).',
        '<b>Di:</b> "Las cuatro son el mismo programa. Nos sirven para pensar, dibujar, calcular y programar."',
        '<b>Haz:</b> activa <b>Emergencia</b> con el motor en marcha: se apaga, y arrancar no funciona hasta rearmar.'
      ],
      preguntas: ['<b>"¿Qué parte de la escalera es el enclavamiento?"</b> → La rama de abajo, con el contacto de Q.', '<b>"¿Qué pasa si P vale 0?"</b> → El producto vale 0: el motor se detiene.'],
      dudas: ['"¿Por qué el contacto de paro está cerrado en el dibujo si es NC?" → Porque en reposo la entrada vale 1; el contacto del programa deja pasar cuando la entrada vale 1.'],
      transicion: 'Toca <b>Siguiente</b>.' },
    rd1: { min: 2, puntos: ['Cierra la pregunta. Refuerza: la memoria es la <b>realimentación de Q</b>.'] },
    'd-explora': { min: 10,
      pasos: [
        '<b>Di:</b> "Exploren las cuatro pestañas y la de Practicar."',
        '<b>Haz:</b> pídeles resolver en <b>Practicar</b> las variantes B (dos puestos), C (temporizador) y D (set/reset) con los casilleros.',
        'Si alguien se equivoca, el sistema le muestra una combinación donde su ecuación falla: úsala como pista.'
      ],
      transicion: 'Avisa "2 minutos" y toca <b>Siguiente</b>.' },
    rd2: { min: 2, puntos: ['Cierra la pregunta. Refuerza: en serie, un 0 apaga todo el producto.'] },
    'd-reto': { min: 12, pasos: ['<b>Di:</b> "Cada uno tiene una variante: A, B, C o D. Armen la ecuación con casilleros, cuenten combinaciones y sigan la secuencia."', '<b>Haz:</b> mira la pizarra y cierra cuando ~80 % haya enviado.'], transicion: 'Toca <b>Siguiente</b>.' },
    'd-revisa': { min: 8, puntos: ['Comenta los resultados.', 'Resuelve en voz alta la variante A con la tabla de verdad: 3 de las 16 combinaciones dan Q = 1.', 'Muestra por qué en la variante D la marcha tiene prioridad sobre el paro.'] },

    gemelo: { min: 5,
      puntos: ['Explica el gemelo digital en dos ideas: probar antes de conectar y detectar desviaciones.', 'Mueve la válvula y luego simula la falla: la diferencia se marca en rojo.', 'Pregunta: <b>"Si el gemelo dice que el nivel sube y la planta no, ¿qué indica?"</b> → una desviación: falla o modelo desajustado.'] },

    cierre: { min: 10,
      objetivo: 'Cerrar la sesión y explicar la tarea asíncrona.',
      pasos: [
        '<b>Di:</b> repasa las cuatro ideas de la pantalla.',
        '<b>Di:</b> "Tarea: <b>Control de estudio 1</b>. Entrega: una <b>tabla de E/S con direcciones</b> de un proceso que se les dará, la actividad «<b>detecta el error</b>» en tres casos y un <b>razonamiento escrito</b>."',
        '<b>Di:</b> "Cada uno ve en su dispositivo cuánto sumó hoy. Recuerden: en cada sesión se vuelve a ingresar."',
        '<b>Haz:</b> deja el paso en <b>Cierre</b> (no en un reto) y, desde el panel, toca <b>«Abrir toda la sesión»</b> para el repaso.',
        '<b>Haz:</b> al terminar, toca <b>Reporte → Descargar para Excel</b>.'
      ],
      transicion: 'Despide la clase.' }
  };
  II.SESIONES['pl-s1'].pasos.forEach((p) => { p.guion = GUION[p.id]; });

  // pasos fijos de las pausas y la ruleta ya no existen: se manejan desde el panel del docente
})();
