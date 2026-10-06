// ============================================================
// Sesión 4, día 5 — Calibración, errores y trazabilidad (con HART)
// Martes 06/10 · 20:00–22:00 (2 h, sin pausa)
// Ciclo: explica → pregunta rápida → explica → pregunta rápida → explora → reto → revisión
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  const V = (x, u = '') => `<span class="valor">${II.fmt(x, 3)}${u ? ' ' + u : ''}</span>`;
  const fs = (x, d = 2) => (x > 0.00001 ? '+' : '') + II.fmt(x, d);
  const signo = (r) => (r() < 0.5 ? -1 : 1);
  const r3 = (x) => Math.round(x * 1000) / 1000;

  // ---------- Reto 2: qué acción corresponde ----------
  const ACCIONES = ['Calibración (comparar y registrar)', 'Ajuste de cero', 'Ajuste de span', 'Re-rango con HART', 'Trim de salida (lazo)'];
  const CASOS = [
    ['Con la toma abierta a la atmósfera el transmisor marca 0,1 bar en vez de 0, y el error es el mismo en todo el rango.', 1, 'Un error igual en todo el rango es un error de cero: se corrige con el ajuste de cero.'],
    ['El error es cero a 0 %, pero crece hasta +0,8 % a 100 %.', 2, 'Un error que crece con la señal es de pendiente: se corrige con el ajuste de span.'],
    ['El proceso ahora trabajará entre 0 y 6 bar en vez de 0 y 10 bar, y se quiere aprovechar toda la señal.', 3, 'Cambiar qué valor corresponde a 4 y 20 mA es un re-rango (y hay que cambiar también la escala del PLC).'],
    ['El comunicador HART muestra bien la presión, pero el multímetro patrón en serie mide una corriente distinta a la que el transmisor dice enviar.', 4, 'Si la lectura digital está bien pero los mA no, lo que está corrido es la salida: trim de salida.'],
    ['Llegó la fecha anual: hay que verificar si el transmisor sigue dentro de su tolerancia y dejarlo registrado.', 0, 'Comparar con un patrón y registrar es calibrar; solo se ajusta si no pasa.']
  ];
  const CONCEPTOS = [
    ['e) ¿Cómo viaja la señal HART sin alterar los 4–20 mA?',
      ['Es una señal alterna de 1200/2200 Hz que en promedio vale cero', 'Por un tercer cable separado', 'Reemplaza a la corriente mientras comunica'], 0,
      'El tono sube y baja ±0,5 mA por igual: el promedio, que es lo que lee el PLC, no cambia.'],
    ['e) ¿Qué asegura la trazabilidad de una calibración?',
      ['Una cadena sin cortes de calibraciones hasta los patrones nacionales (IBMETRO) y el SI', 'Que el instrumento sea de una marca reconocida', 'Que el instrumento sea nuevo'], 0,
      'Cada patrón se calibró con otro más exacto, con certificado, hasta llegar a la definición de la unidad.'],
    ['e) Para comunicarse por HART, ¿qué necesita el lazo?',
      ['Una resistencia de al menos ≈ 250 Ω', 'Cortar el lazo y conectar el comunicador en serie', 'Apagar la fuente de 24 V'], 0,
      'El comunicador se conecta en paralelo y necesita esa resistencia en el lazo para "ver" la señal; no se corta nada.']
  ];

  const retos = {
    'c1-reto': {
      titulo: 'Reto 1 · Errores del instrumento',
      puntos: 10,
      general: 'Cada estudiante tiene su propio transmisor con sus propias lecturas: calcula errores en % del span, identifica el tipo de error, decide si pasa y calcula cada cuánto recalibrar.',
      pista: 'Error en % del span = (indicado − patrón) ÷ span × 100, con su signo. Si el error es igual en 0 % y en 100 %, es de cero; si crece hacia 100 %, es de span. Histéresis = diferencia entre bajando y subiendo en el mismo punto. Intervalo máximo = tolerancia ÷ deriva × 12 meses.',
      errorComun: 'Dividir el error entre la lectura en vez de entre el span, o perder el signo (marcar de más es error positivo).',
      metodo: 'e% = (indicado − patrón) ÷ span × 100 · cero: igual en todo el rango; span: crece con la señal · histéresis = (bajando − subiendo) ÷ span × 100 · pasa si |error máx| ≤ tolerancia · meses = tolerancia ÷ deriva × 12',
      generar(r) {
        const R = II.elegir(r, [6, 10, 16, 25]);
        const p50 = R / 2;
        const ea = II.elegir(r, [0.3, 0.4, 0.6, 0.8, 1.2, 1.5]) * signo(r);
        const pInd = r3(p50 + (ea * R) / 100);
        const eA = ((pInd - p50) / R) * 100;
        const tipo = II.elegir(r, ['Error de cero', 'Error de span']);
        const off = r3((R * II.elegir(r, [0.4, 0.6, 0.8])) / 100) * signo(r);
        const l0 = tipo === 'Error de cero' ? off : 0, l100 = R + off;
        const hh = II.elegir(r, [0.4, 0.6, 0.8, 1]);
        const subA = r3(p50 - (hh * R) / 200), bajB = r3(p50 + (hh * R) / 200);
        const eH = ((bajB - subA) / R) * 100;
        const T = II.elegir(r, [0.25, 0.5, 1]);
        const pasaQ = r() < 0.5;
        const errs = [0.25, 0.5, 0.75].map((k, i) => {
          const m = pasaQ ? T * (0.3 + 0.6 * r()) : i === 1 ? T * (1.2 + 0.6 * r()) : T * (0.2 + 0.6 * r());
          return m * signo(r);
        });
        const filas = [0.25, 0.5, 0.75].map((k, i) => { const pp = R * k; return [pp, r3(pp + (errs[i] * R) / 100)]; });
        const maxE = Math.max(...filas.map(([pp, ind]) => (Math.abs(ind - pp) / R) * 100));
        const pasa = maxE <= T;
        const D = II.elegir(r, [0.1, 0.2, 0.25]);
        const T2 = II.elegir(r, [0.25, 0.5]);
        const meses = (T2 / D) * 12;
        return {
          enunciado: `
            <p>Un transmisor de presión tiene un rango de <b>0 a ${V(R, 'bar')}</b>.</p>
            <p><b>a)</b> El patrón aplica ${V(p50, 'bar')} y el transmisor indica ${V(pInd, 'bar')}.</p>
            <p><b>b)</b> Con 0 bar indica ${V(l0, 'bar')}; con ${V(R, 'bar')} indica ${V(l100, 'bar')}.</p>
            <p><b>c)</b> En ${V(p50, 'bar')}, subiendo indica ${V(subA, 'bar')} y bajando indica ${V(bajB, 'bar')}.</p>
            <p><b>d)</b> Su tolerancia es ±${V(T, '%')} del span. En la prueba: ${filas.map(([pp, ind]) => `patrón ${V(pp, 'bar')} → indica ${V(ind, 'bar')}`).join('; ')}.</p>
            <p><b>e)</b> Otro transmisor, con tolerancia ±${V(T2, '%')}, deriva ${V(D, '%')} del span por año y quedó con error cero tras calibrarlo.</p>`,
          campos: [
            { id: 'a', tipo: 'num', pregunta: 'a) ¿Cuál es el error en % del span? (con su signo: + si marca de más)', unidad: '%', tolRel: 0.02, tolAbs: 0.01 },
            { id: 'b', tipo: 'select', pregunta: 'b) ¿Qué tipo de error tiene?', opciones: ['Error de cero', 'Error de span', 'Histéresis', 'No linealidad'] },
            { id: 'c', tipo: 'num', pregunta: 'c) ¿Cuánta histéresis tiene, en % del span?', unidad: '%', tolRel: 0.02, tolAbs: 0.01 },
            { id: 'd', tipo: 'select', pregunta: 'd) ¿Pasa la calibración?', opciones: ['Pasa', 'No pasa'] },
            { id: 'e', tipo: 'num', pregunta: 'e) ¿Cada cuántos meses, como máximo, hay que recalibrarlo?', unidad: 'meses', tolRel: 0.02 }
          ],
          esperado: { a: eA, b: tipo, c: eH, d: pasa ? 'Pasa' : 'No pasa', e: meses },
          solucion: `
            <p><b>a)</b> e = (${II.fmt(pInd, 3)} − ${II.fmt(p50, 3)}) ÷ ${R} × 100 = <b>${fs(eA)} %</b> del span</p>
            <p><b>b) ${tipo}</b>: ${tipo === 'Error de cero' ? `el error es el mismo (${fs(off, 3)} bar) en 0 % y en 100 %: toda la curva está corrida.` : `en 0 % no hay error y en 100 % hay ${fs(off, 3)} bar: el error crece con la señal (pendiente).`}</p>
            <p><b>c)</b> Histéresis = (${II.fmt(bajB, 3)} − ${II.fmt(subA, 3)}) ÷ ${R} × 100 = <b>${II.fmt(eH, 2)} %</b></p>
            <p><b>d)</b> Errores: ${filas.map(([pp, ind]) => fs(((ind - pp) / R) * 100) + ' %').join(', ')}. El mayor es ${II.fmt(maxE, 2)} % frente a ±${II.fmt(T)} % → <b>${pasa ? 'Pasa' : 'No pasa'}</b></p>
            <p><b>e)</b> ${II.fmt(T2)} ÷ ${II.fmt(D)} × 12 = <b>${II.fmt(meses, 1)} meses</b> (en la práctica se deja un margen)</p>`
        };
      }
    },

    'c2-reto': {
      titulo: 'Reto 2 · Calibración y HART',
      puntos: 10,
      general: 'Cada estudiante calibra su propio transmisor: corriente ideal, error medido, exactitud del patrón y qué acción corresponde en cada caso.',
      pista: 'Corriente ideal: I = 4 + 16 × (% ÷ 100). Error en % del span = (medido − ideal) ÷ 16 × 100. Patrón (regla 4 a 1) = tolerancia del instrumento ÷ 4. Igual en todo el rango → cero; crece con la señal → span; cambiar 4 y 20 mA → re-rango; mA distintos a lo que dice el transmisor → trim de salida.',
      errorComun: 'Dividir el error en mA entre 20 (o entre la lectura) en vez de entre 16, que es el span de la señal (20 − 4).',
      metodo: 'I = 4 + 16 · p · e% = (I medido − I ideal) ÷ 16 × 100 · patrón = tolerancia ÷ 4 · cero / span / re-rango / trim de salida / calibración',
      generar(r) {
        const R = II.elegir(r, [4, 6, 10, 16]);
        const p = II.elegir(r, [25, 50, 75]);
        const P = (R * p) / 100;
        const iI = 4 + (16 * p) / 100;
        const d = II.elegir(r, [0.04, 0.06, 0.08, 0.12, 0.16]) * signo(r);
        const iM = r3(iI + d);
        const eB = ((iM - iI) / 16) * 100;
        const A = II.elegir(r, [0.075, 0.1, 0.2, 0.25, 0.5]);
        const caso = II.elegir(r, CASOS);
        const con = II.elegir(r, CONCEPTOS);
        return {
          enunciado: `
            <p>Calibras un transmisor de <b>0 a ${V(R, 'bar')}</b> con salida 4–20 mA, aplicando ${V(P, 'bar')} con el patrón.</p>
            <p><b>b)</b> El multímetro en serie mide ${V(iM, 'mA')}.</p>
            <p><b>c)</b> La tolerancia del transmisor es ±${V(A, '%')} del span.</p>`,
          campos: [
            { id: 'a', tipo: 'num', pregunta: `a) ¿Qué corriente debería enviar con ${II.fmt(P, 3)} bar?`, unidad: 'mA', tolRel: 0.005 },
            { id: 'b', tipo: 'num', pregunta: 'b) ¿Cuál es el error en % del span? (con su signo)', unidad: '%', tolRel: 0.02, tolAbs: 0.01 },
            { id: 'c', tipo: 'num', pregunta: 'c) Con la regla 4 a 1, ¿qué exactitud mínima (en ± % del span) debe tener el patrón?', unidad: '%', tolRel: 0.02, tolAbs: 0.005 },
            { id: 'd', tipo: 'select', pregunta: 'd) ' + II.esc(caso[0]) + '<br><span class="nota">¿Qué corresponde hacer?</span>', opciones: ACCIONES },
            { id: 'e', tipo: 'select', pregunta: con[0], opciones: con[1] }
          ],
          esperado: { a: iI, b: eB, c: A / 4, d: ACCIONES[caso[1]], e: con[1][con[2]] },
          solucion: `
            <p><b>a)</b> ${II.fmt(P, 3)} bar es el ${p} % del rango → I = 4 + 16 × ${II.fmt(p / 100, 2)} = <b>${II.fmt(iI, 2)} mA</b></p>
            <p><b>b)</b> e = (${II.fmt(iM, 3)} − ${II.fmt(iI, 2)}) ÷ 16 × 100 = <b>${fs(eB)} %</b> del span</p>
            <p><b>c)</b> ${II.fmt(A, 3)} ÷ 4 = <b>±${II.fmt(A / 4, 4)} %</b> o mejor</p>
            <p><b>d) ${ACCIONES[caso[1]]}</b>: ${caso[2]}</p>
            <p><b>e) ${con[1][con[2]]}</b>: ${con[3]}</p>`
        };
      }
    },

    integrador: {
      titulo: 'Reto integrador · El certificado del PT-104',
      puntos: 20,
      general: 'El PT-104 del TK-100 llega al taller: con sus lecturas "como se encontró", calcula los errores, decide si pasa, predice qué pasa tras ajustar el cero y evalúa el patrón.',
      pista: 'Ideal: 0 % → 4 mA, 50 % → 12 mA, 100 % → 20 mA. Error % = (medido − ideal) ÷ 16 × 100. El ajuste de cero quita el error de 0 % en todo el rango; lo que queda a 100 % es el error de span. TUR = tolerancia del instrumento ÷ exactitud del patrón.',
      errorComun: 'En la pregunta 4, creer que ajustar el cero deja todo bien: el error de span sigue ahí y solo se corrige con el ajuste de span.',
      metodo: 'e0 = (I0 − 4) ÷ 16 × 100 · e100 = (I100 − 20) ÷ 16 × 100 · pasa si el mayor |e| ≤ tolerancia · tras ajustar el cero: I100 − (I0 − 4) · TUR = tolerancia ÷ patrón (≥ 4 : 1)',
      generar(r) {
        let z, s, T, e0, e50, e100, maxE;
        for (let k = 0; k < 20; k++) { // evita casos justo en el borde de la tolerancia
          z = II.elegir(r, [0.04, 0.06, 0.08]) * signo(r);
          s = II.elegir(r, [0.04, 0.08, 0.12]) * signo(r);
          T = II.elegir(r, [0.25, 0.5]);
          e0 = (z / 16) * 100; e50 = ((z + s / 2) / 16) * 100; e100 = ((z + s) / 16) * 100;
          maxE = Math.max(Math.abs(e0), Math.abs(e50), Math.abs(e100));
          if (Math.abs(maxE - T) > 0.03) break;
        }
        const i0 = r3(4 + z), i50 = r3(12 + z + s / 2), i100 = r3(20 + z + s);
        const iTras = r3(i100 - (i0 - 4));
        const U = II.elegir(r, [0.025, 0.05, 0.1]);
        const tur = T / U;
        return {
          enunciado: `
            <p>El <b>PT-104</b> (0 a 10 bar, 4–20 mA, tolerancia ±${V(T, '%')} del span) llega al taller. Lecturas <b>como se encontró</b>:</p>
            <p>• 0 bar → ${V(i0, 'mA')}<br>• 5 bar → ${V(i50, 'mA')}<br>• 10 bar → ${V(i100, 'mA')}</p>
            <p>El patrón de presión del taller tiene una exactitud de ±${V(U, '%')}.</p>`,
          campos: [
            { id: 'q1', tipo: 'num', pregunta: '1) ¿Cuál es el error a 0 % en % del span? (con su signo)', unidad: '%', tolRel: 0.02, tolAbs: 0.01 },
            { id: 'q2', tipo: 'num', pregunta: '2) ¿Cuál es el error a 100 % en % del span? (con su signo)', unidad: '%', tolRel: 0.02, tolAbs: 0.01 },
            { id: 'q3', tipo: 'select', pregunta: '3) Con los tres puntos, ¿pasa la calibración?', opciones: ['Pasa', 'No pasa'] },
            { id: 'q4', tipo: 'num', pregunta: '4) Si solo se ajusta el cero, ¿cuánto marcará con 10 bar?', unidad: 'mA', tolRel: 0.001 },
            { id: 'q5', tipo: 'num', pregunta: '5) ¿Qué relación de exactitud (TUR) hay entre el transmisor y el patrón? (escribe solo el número: TUR : 1)', unidad: ': 1', tolRel: 0.02 }
          ],
          esperado: { q1: e0, q2: e100, q3: maxE <= T ? 'Pasa' : 'No pasa', q4: iTras, q5: tur },
          solucion: `
            <p><b>1)</b> (${II.fmt(i0, 3)} − 4) ÷ 16 × 100 = <b>${fs(e0)} %</b></p>
            <p><b>2)</b> (${II.fmt(i100, 3)} − 20) ÷ 16 × 100 = <b>${fs(e100)} %</b></p>
            <p><b>3)</b> Errores: ${fs(e0)} %, ${fs(e50)} % y ${fs(e100)} %. El mayor, ${II.fmt(maxE, 2)} %, frente a ±${II.fmt(T)} % → <b>${maxE <= T ? 'Pasa' : 'No pasa'}</b></p>
            <p><b>4)</b> El ajuste de cero quita ${fs(i0 - 4, 3)} mA en todo el rango: ${II.fmt(i100, 3)} − (${fs(i0 - 4, 3)}) = <b>${II.fmt(iTras, 3)} mA</b>. Queda el error de span: hay que ajustarlo después.</p>
            <p><b>5)</b> TUR = ${II.fmt(T)} ÷ ${II.fmt(U, 3)} = <b>${II.fmt(tur, 1)} : 1</b> → ${tur >= 4 ? 'cumple la regla 4 a 1: el patrón sirve.' : 'no llega a 4 a 1: hace falta un patrón mejor.'}</p>`
        };
      }
    }
  };

  const R = (id, ciclo, titulo, t, o, c, por) => ({ id, tipo: 'rapida', ciclo, titulo, t, o, c, por });

  II.SESIONES['ii-s4'] = {
    id: 'ii-s4',
    numero: '4, día 5',
    titulo: 'Calibración, errores y trazabilidad',
    fecha: 'Martes 06/10 · 20:00–22:00',
    siguiente: 'Sesión 5, día 6 · Miércoles 07/10, 20:00 — P&ID de la planta, fallas y evaluación final',
    retos,
    diagnostico: [
      { t: '(Repaso) Un transmisor de 0 a 100 °C envía 16 mA. ¿Qué temperatura mide?', o: ['75 °C', '80 °C', '60 °C'], c: 0 },
      { t: '(Repaso) El PLC lee 0 mA en un lazo 4–20 mA. Lo más probable es:', o: ['Lazo abierto o sin alimentación', 'La variable está en el mínimo de su rango', 'El transmisor está bien calibrado'], c: 0 },
      { t: '(Repaso, Sesión 1) Un instrumento da 50,4 · 50,5 · 50,4 · 50,5 cuando el valor real es 48. Es:', o: ['Preciso, pero no exacto', 'Exacto, pero no preciso', 'Exacto y preciso'], c: 0 },
      { t: '¿Calibrar un instrumento es lo mismo que ajustarlo?', o: ['Sí, son sinónimos', 'No: calibrar es comparar con un patrón; ajustar es corregir', 'No: ajustar es comparar con un patrón; calibrar es corregir'], c: 1 },
      { t: 'Para calibrar un manómetro, el instrumento de referencia (patrón) debe ser:', o: ['Más exacto que el manómetro', 'Igual de exacto', 'De la misma marca'], c: 0 }
    ],
    pasos: [
      { id: 'inicio', tipo: 'espera', titulo: 'Sesión 4, día 5: Calibración, errores y trazabilidad' },
      { id: 'diagnostico', tipo: 'cuestionario', titulo: 'Repaso y diagnóstico: 5 preguntas' },

      // ---------------- Ciclo 1 · Errores ----------------
      { id: 'c1-errores', tipo: 'explica', ciclo: 1, titulo: 'Los errores de un instrumento: cero, span, no linealidad e histéresis', diagrama: 'errores',
        ideas: [
          'El <b>error</b> es lo que indica el instrumento menos el valor verdadero (el que da el patrón). Se expresa en <b>% del span</b>: error ÷ span × 100.',
          '<b>Error de cero:</b> toda la curva corrida por igual. <b>Error de span:</b> el error crece con la señal (la pendiente está mal). Los dos se corrigen con ajustes.',
          '<b>No linealidad:</b> la curva se comba, con el error mayor a mitad de rango. <b>Histéresis:</b> marca distinto subiendo que bajando. Estos <b>no</b> se corrigen con cero y span.',
          'La <b>tolerancia</b> del instrumento (por ejemplo ±0,25 % del span) decide si pasa o no pasa la calibración.'
        ] },
      R('q-e1', 1, 'Pregunta rápida · error en % del span',
        'Un transmisor de <b>0 a 10 bar</b> marca <b>5,08 bar</b> cuando el patrón aplica <b>5,00 bar</b>. ¿Cuál es su error en % del span?',
        ['+0,8 %', '+1,6 %', '+0,08 %', '+8 %'], 0,
        '(5,08 − 5,00) ÷ 10 × 100 = +0,8 % del span. Se divide entre el span, no entre la lectura.'),
      R('q-e2', 1, 'Pregunta rápida · tipo de error',
        'Subiendo a 50 %, el transmisor marca <b>50,3 %</b>; bajando al mismo 50 %, marca <b>49,7 %</b>. ¿Qué error es?',
        ['Histéresis', 'Error de cero', 'Error de span', 'Deriva'], 0,
        'Marca distinto según de dónde venga: es histéresis (0,6 % aquí). No se corrige con ajuste de cero ni de span.'),
      { id: 'c1-repet', tipo: 'explica', ciclo: 1, titulo: 'Repetibilidad y deriva: cada cuánto calibrar', diagrama: 'erroresRepet',
        ideas: [
          '<b>Repetibilidad:</b> qué tanto coinciden varias lecturas del mismo valor, en las mismas condiciones. Es la <b>precisión</b> de la Sesión 1.',
          'La repetibilidad <b>no se puede ajustar</b>: si un instrumento no repite, ninguna calibración lo salva.',
          '<b>Deriva:</b> el error que aparece poco a poco con el tiempo (envejecimiento, temperatura, vibración). Los fabricantes la dan en % por año.',
          'La deriva define el <b>intervalo de calibración</b>: recalibrar antes de que el error salga de la tolerancia. Máximo ≈ tolerancia ÷ deriva.'
        ] },
      R('q-e3', 1, 'Pregunta rápida · intervalo de calibración',
        'Un transmisor con tolerancia <b>±0,5 %</b> deriva <b>0,25 % por año</b>. Si queda perfecto tras calibrarlo, ¿cada cuánto conviene recalibrarlo como máximo?',
        ['Cada 2 años', 'Cada 6 meses', 'Cada 4 años', 'Nunca, si está bien instalado'], 0,
        '0,5 ÷ 0,25 = 2 años: después el error saldría de la tolerancia. En la práctica se deja margen (por ejemplo, cada 12 a 18 meses).'),
      { id: 'c1-explora', tipo: 'explora', ciclo: 1, titulo: 'Explora los errores', diagrama: 'errores',
        guia: [
          'Elige <b>"Solo cero"</b> y luego <b>"Solo span"</b>: ¿en qué se diferencian las dos curvas?',
          'Pon la histéresis en <b>0,8 %</b>: ¿pasa con tolerancia ±0,25 %? ¿Se arreglaría ajustando el cero?',
          'Combina cero <b>+0,3 %</b> y span <b>−0,6 %</b>: ¿dónde queda el error máximo?',
          'Pestaña de deriva: con <b>0,3 % por año</b> y tolerancia ±0,5 %, ¿cada cuántos meses hay que recalibrar?'
        ] },
      { id: 'c1-reto', tipo: 'reto', ciclo: 1, titulo: 'Reto 1 · Errores del instrumento', reto: 'c1-reto' },
      { id: 'c1-revisa', tipo: 'revisa', ciclo: 1, titulo: 'Revisión del Reto 1', reto: 'c1-reto' },

      // ---------------- Ciclo 2 · Calibración, HART y trazabilidad ----------------
      { id: 'c2-banco', tipo: 'explica', ciclo: 2, titulo: 'Cómo se calibra un transmisor: 5 puntos, como se encontró y como se dejó', diagrama: 'calibracion',
        ideas: [
          '<b>Calibrar</b> = comparar el instrumento con un <b>patrón</b> más exacto y registrar el error. <b>Ajustar</b> = corregirlo. Una calibración puede terminar sin ajuste.',
          'Prueba de <b>5 puntos</b> (0, 25, 50, 75 y 100 %) <b>subiendo y bajando</b>: así aparecen el cero, el span, la no linealidad y la histéresis.',
          'Se registra <b>"como se encontró"</b> antes de tocar nada. Si no pasa, se ajusta <b>primero el cero y después el span</b>, y se repite, porque se influyen.',
          'Al final se registra <b>"como se dejó"</b>. Con la salida en mA: error = (medido − ideal) ÷ 16 × 100, en % del span.'
        ] },
      R('q-c1', 2, 'Pregunta rápida · calibrar o ajustar',
        '¿Cuál es la diferencia entre <b>calibrar</b> y <b>ajustar</b>?',
        ['Calibrar es comparar con un patrón y registrar el error; ajustar es corregir el instrumento', 'Son lo mismo', 'Ajustar es comparar con un patrón; calibrar es corregir', 'Calibrar solo se hace con instrumentos nuevos'], 0,
        'Una calibración puede terminar sin ajuste si el instrumento pasa. Si se ajusta, se registra antes ("como se encontró") y después ("como se dejó").'),
      { id: 'c2-hart', tipo: 'explica', ciclo: 2, titulo: 'HART: configurar y ajustar sin cortar el lazo', diagrama: 'calibracionHart',
        ideas: [
          '<b>HART</b> monta una señal digital sobre el mismo par de cables del 4–20 mA: un tono de 1200 Hz ("1") o 2200 Hz ("0") de ±0,5 mA que en promedio vale cero.',
          'Con un <b>comunicador</b> conectado en paralelo (el lazo necesita ≈ 250 Ω) se leen el TAG, la variable, el rango y los diagnósticos, sin desconectar nada.',
          '<b>Trim de sensor:</b> corrige la lectura digital aplicando presión conocida con el patrón. <b>Trim de salida:</b> corrige los mA que salen, comparando con un multímetro patrón.',
          '<b>Re-rango</b> cambia qué valor corresponde a 4 y a 20 mA. <b>No es calibrar</b>, y obliga a cambiar también la escala del PLC.'
        ] },
      R('q-c2', 2, 'Pregunta rápida · re-rango',
        'Con HART se cambia el rango de un transmisor de 0–10 bar a 0–6 bar (re-rango). ¿Eso es calibrarlo?',
        ['No: solo cambia la escala; no verifica la exactitud del sensor', 'Sí: el transmisor queda calibrado para 0–6 bar', 'Sí, siempre que después se ajuste el cero'], 0,
        'El re-rango solo define qué presión corresponde a 4 y a 20 mA. Para saber si mide bien hay que compararlo con un patrón. Y hay que cambiar también la escala del PLC.'),
      { id: 'c2-traza', tipo: 'explica', ciclo: 2, titulo: 'Trazabilidad: ¿quién calibra al patrón?', diagrama: 'calibracionTraza',
        ideas: [
          '<b>Trazabilidad:</b> cada patrón se calibró con otro más exacto, en una cadena sin cortes hasta el <b>SI</b>.',
          'En Bolivia, los patrones nacionales los mantiene <b>IBMETRO</b>. Los laboratorios acreditados (ISO/IEC 17025) calibran los patrones de trabajo de las empresas.',
          'Regla práctica <b>4 a 1</b>: el patrón debe ser al menos 4 veces más exacto que el instrumento que calibra.',
          'Un <b>certificado</b> válido trae la fecha, los resultados como se encontró y como se dejó, la incertidumbre y los patrones usados con su trazabilidad.'
        ] },
      R('q-c3', 2, 'Pregunta rápida · regla 4 a 1',
        'El transmisor que vas a calibrar tiene una tolerancia de <b>±0,1 %</b>. Con la regla 4 a 1, ¿qué exactitud mínima debe tener el patrón?',
        ['±0,025 %', '±0,4 %', '±0,1 %', '±0,25 %'], 0,
        '0,1 ÷ 4 = 0,025 %: el patrón debe ser al menos 4 veces mejor que lo que calibras.'),
      { id: 'c2-explora', tipo: 'explora', ciclo: 2, titulo: 'Calibra tú mismo', diagrama: 'calibracion',
        guia: [
          'Banco, con <b>"Cero y span corridos"</b>: aplica los 9 puntos. ¿Pasa como se encontró?',
          'Ajusta <b>primero el cero</b> (en 0 %) y <b>después el span</b> (en 100 %), y repite los 9 puntos. ¿Pasa como se dejó?',
          'Empieza de nuevo y ajusta al revés: primero el span y después el cero. ¿Qué pasa? ¿Por qué importa el orden?',
          'Elige <b>"Histéresis"</b>: ¿se corrige ajustando? En la pestaña HART, haz un re-rango sin cambiar el PLC: ¿qué muestra el PLC?'
        ] },
      { id: 'c2-reto', tipo: 'reto', ciclo: 2, titulo: 'Reto 2 · Calibración y HART', reto: 'c2-reto' },
      { id: 'c2-revisa', tipo: 'revisa', ciclo: 2, titulo: 'Revisión del Reto 2', reto: 'c2-reto' },

      // ---------------- Cierre ----------------
      { id: 'integrador', tipo: 'reto', titulo: 'Reto integrador · El certificado del PT-104', reto: 'integrador' },
      { id: 'integrador-revisa', tipo: 'revisa', titulo: 'Revisión del reto integrador', reto: 'integrador' },
      { id: 'cierre', tipo: 'cierre', titulo: 'Cierre de la Sesión 4, día 5',
        ideas: [
          'Error en % del span = (indicado − patrón) ÷ span × 100. El cero y el span se ajustan; la no linealidad, la histéresis y la repetibilidad no.',
          'Calibrar = comparar y registrar; ajustar = corregir. Siempre: como se encontró → ajuste (primero cero, luego span) → como se dejó.',
          'HART: trim de sensor, trim de salida y re-rango (que no es calibrar). Trazabilidad: cadena sin cortes hasta IBMETRO y el SI, con un patrón 4 veces mejor.',
          'Mañana, día 6 (miércoles 20:00): el <b>P&amp;ID completo de la planta</b>, diagnóstico de fallas y la <b>evaluación final</b> del módulo.'
        ] }
    ]
  };

  // ---------- Guion docente extenso (solo se ve en el panel del celular) ----------
  const rapida = (min, lectura, comenta) => ({ min,
    objetivo: 'Activar la atención y verificar en el momento si la idea anterior quedó clara (1 punto).',
    pasos: [
      '<b>Di:</b> "Pregunta rápida, vale un punto. Tienen un minuto." Lee la pregunta en voz alta: ' + lectura,
      '<b>Haz:</b> mira "Enviaron" arriba en este panel. Con ~80 % de respuestas (o al minuto), toca <b>⏱ Cerrar pregunta</b>: tienen 15 s más.',
      '<b>Haz:</b> al cerrar, en Zoom aparecen las barras por opción con la correcta en verde.',
      '<b>Di:</b> ' + comenta
    ],
    transicion: 'Comentada la respuesta (1 minuto como máximo), toca <b>Siguiente</b>.' });

  const GUION = {
    inicio: { min: 4,
      objetivo: 'Que todos entren con su carnet y sepan qué van a aprender hoy.',
      pasos: [
        '<b>Haz:</b> comparte en Zoom la pantalla de la presentación (QR y enlace).',
        '<b>Haz:</b> pega en el chat el enlace de estudiantes (botón "Copiar enlace de estudiantes").',
        '<b>Di:</b> "Buenas noches. Entren con el mismo carnet de siempre. Hoy es el día 5 de 6."',
        '<b>Di:</b> "Ya sabemos medir temperatura, presión, nivel y flujo, y cómo viaja la señal. Hoy respondemos la pregunta más importante: <b>¿cómo sé que el instrumento dice la verdad?</b> Eso es calibrar."',
        '<b>Di:</b> "Como el domingo: preguntas rápidas de un punto y los retos se cierran con una cuenta regresiva de 30 segundos. Hoy no hay pausa."'
      ],
      dudas: ['"No me carga" → que recarguen; si sigue, desde el celular con datos móviles.', '"Me equivoqué de carnet" → botón "Salir" y vuelven a entrar.'],
      transicion: 'Con la mayoría conectada → <b>Siguiente</b>.' },

    diagnostico: { min: 5,
      objetivo: 'Refrescar 4–20 mA y exactitud/precisión, y descubrir qué saben de calibración.',
      pasos: [
        '<b>Di:</b> "Cinco preguntas, sin nota. Tres minutos."',
        '<b>Haz:</b> mira <b>Pizarra → Diagnóstico</b>.',
        '<b>Di</b> (pregunta 1): "16 mA: (16 − 4) ÷ 16 = 75 %."',
        '<b>Di</b> (pregunta 3): "Repite muy bien, pero lejos del valor real: preciso pero no exacto. Hoy vamos a ver que la <b>exactitud se corrige calibrando</b>, pero la precisión no."',
        '<b>Di</b> (pregunta 4): "Calibrar y ajustar NO son lo mismo. Es la idea central de hoy."'
      ],
      transicion: 'Con ~80 % de respuestas → <b>Siguiente</b>.' },

    'c1-errores': { min: 9,
      objetivo: 'Que distingan los cuatro tipos de error mirando la curva de error y sepan cuáles se corrigen con ajuste.',
      pasos: [
        '<b>Pregunta al grupo:</b> "Si su balanza de cocina marca 200 g sin nada encima, ¿qué hacen?" → la ponen en cero (tara). Eso es un ajuste de cero.',
        '<b>Di:</b> "Para saber qué error tiene un instrumento, se le aplican valores conocidos con un <b>patrón</b> y se anota la diferencia. Se expresa en % del span."',
        '<b>Haz:</b> diagrama en <b>"Ideal"</b>: la línea azul en cero. <b>Di:</b> "Este gráfico es el error en cada punto del rango. La franja verde es la tolerancia."',
        '<b>Haz:</b> toca <b>"Solo cero"</b>. <b>Di:</b> "Toda la curva subió igual: marca 0,6 % de más en todo el rango. Error de cero. Se corrige con el ajuste de cero."',
        '<b>Haz:</b> toca <b>"Solo span"</b>. <b>Di:</b> "Ahora en 0 % está bien, pero el error crece hasta 100 %: la pendiente está mal. Error de span; se corrige con el ajuste de span."',
        '<b>Haz:</b> toca <b>"No linealidad"</b>. <b>Di:</b> "La curva se comba: bien en los extremos, mal a mitad. Con cero y span solo se reparte."',
        '<b>Haz:</b> toca <b>"Histéresis"</b>. <b>Di:</b> "Subiendo (azul) marca de menos, bajando (naranja) marca de más. Es como un resorte con roce. Eso no se corrige con ajustes: se repara o se cambia."',
        '<b>Haz:</b> cambia la tolerancia entre ±0,25, ±0,5 y ±1 %. <b>Di:</b> "El mismo instrumento puede pasar o no pasar según su tolerancia."'
      ],
      preguntas: ['"Un transmisor marca 0,1 bar de más en todo su rango de 0 a 10 bar: ¿qué error y de cuánto?" → Cero, +1 % del span.'],
      dudas: ['"¿Exactitud es lo mismo que tolerancia?" → En la práctica, la exactitud declarada por el fabricante es la tolerancia que se usa para decidir si pasa.', '"¿Por qué en % del span y no de la lectura?" → Porque así lo especifican los fabricantes de transmisores: un error fijo en todo el rango.'],
      transicion: '<b>Di:</b> "Dos rápidas." → <b>Siguiente</b>.' },

    'q-e1': rapida(2, '"0 a 10 bar, marca 5,08 con 5,00 aplicados: ¿error en % del span?"',
      '"(5,08 − 5) ÷ 10 × 100 = +0,8 %. Quien puso 1,6 % dividió entre 5 (la lectura) en vez de entre 10 (el span)."'),
    'q-e2': rapida(2, '"Subiendo marca 50,3; bajando, 49,7: ¿qué error es?"',
      '"Histéresis: depende de si viene subiendo o bajando. Por eso la prueba se hace en los dos sentidos."'),

    'c1-repet': { min: 7,
      objetivo: 'Que entiendan repetibilidad (no ajustable) y deriva (define cada cuánto calibrar).',
      pasos: [
        '<b>Haz:</b> pestaña <b>Repetibilidad y deriva</b>. Toca "Medir otra vez" un par de veces.',
        '<b>Di:</b> "Diez lecturas del mismo 50 %: no salen idénticas. Esa dispersión es la repetibilidad, la precisión de la Sesión 1, la diana."',
        '<b>Haz:</b> sube la dispersión. <b>Di:</b> "Si un instrumento no repite, ninguna calibración lo arregla: no hay un error fijo que corregir."',
        '<b>Haz:</b> a la derecha, mueve los meses de 0 a 36. <b>Di:</b> "Con el tiempo el error crece: deriva. El fabricante la da en % por año."',
        '<b>Haz:</b> señala la línea roja. <b>Di:</b> "Aquí sale de la tolerancia. Hay que recalibrar antes: tolerancia ÷ deriva. Así se decide el intervalo de calibración."'
      ],
      preguntas: ['"Tolerancia ±0,5 %, deriva 0,5 % por año: ¿cada cuánto?" → Cada 12 meses como máximo.'],
      dudas: ['"¿Quién decide el intervalo?" → La planta, según la deriva, lo crítico de la medición y el historial de calibraciones (si siempre llega bien, se puede alargar).'],
      transicion: '<b>Di:</b> "Una rápida." → <b>Siguiente</b>.' },

    'q-e3': rapida(2, '"Tolerancia ±0,5 %, deriva 0,25 % por año: ¿cada cuánto recalibrar como máximo?"',
      '"0,5 ÷ 0,25 = 2 años. En la práctica se deja margen, por ejemplo cada año."'),

    'c1-explora': { min: 5,
      objetivo: 'Que cada uno reconozca los tipos de error moviendo los controles.',
      pasos: ['<b>Di:</b> "Cinco minutos con el diagrama en su dispositivo. Respondan las 4 preguntas."', '<b>Di</b> (a los 4 min): "La histéresis de 0,8 % no pasa con ±0,25 % y no se arregla ajustando el cero."'],
      transicion: 'A los 5 minutos → <b>Siguiente</b> (Reto 1). Si vas atrasado, sáltalo.' },

    'c1-reto': { min: 8,
      objetivo: 'Calcular errores en % del span, identificar el tipo, decidir si pasa y calcular el intervalo.',
      pasos: [
        '<b>Di:</b> "Reto 1, vale 10 puntos y tienen 2 intentos. Siete minutos. Ojo con el <b>signo</b> del error: + si marca de más."',
        '<b>Haz:</b> a los 5 minutos avisa "2 minutos"; a los 7, toca <b>⏱ Cerrar reto (30 s)</b>.'
      ],
      dudas: ['"¿El error va con signo?" → Sí, en a): + si marca de más, − si marca de menos.', '"¿La histéresis lleva signo?" → No: es la diferencia entre bajando y subiendo.'],
      transicion: 'Con el reto cerrado → <b>Siguiente</b>.' },

    'c1-revisa': { min: 4,
      objetivo: 'Corregir los errores frecuentes del Reto 1.',
      pasos: [
        '<b>Haz:</b> mira las barras en Zoom y la Pizarra.',
        '<b>Di</b> (a): "Se divide entre el span, con signo."',
        '<b>Di</b> (b): "Mismo error en 0 % y 100 % → cero. Cero en 0 % y crece → span."',
        '<b>Di</b> (d): "Pasa solo si el error más grande, en valor absoluto, está dentro de la tolerancia."'
      ],
      transicion: '<b>Di:</b> "Ahora: cómo se calibra de verdad." → <b>Siguiente</b>.' },

    'c2-banco': { min: 10,
      objetivo: 'Que entiendan el procedimiento de calibración con registro antes y después, y el orden cero → span.',
      pasos: [
        '<b>Di:</b> "Así se calibra un transmisor de presión en el taller." Señala la bomba manual, el patrón digital, el PT-104 y el multímetro.',
        '<b>Di:</b> "La bomba genera la presión; el patrón dice cuánta hay de verdad; el multímetro mide lo que el transmisor contesta en mA."',
        '<b>Haz:</b> transmisor "Cero y span corridos". Toca los puntos <b>0 %↑, 25 %↑, 50 %↑, 75 %↑, 100 %, 75 %↓, 50 %↓, 25 %↓, 0 %↓</b>, uno por uno.',
        '<b>Di</b> (en cada punto): "A 50 % debería dar 12 mA. Da tanto. Error = (medido − ideal) ÷ 16 × 100."',
        '<b>Di:</b> "Esta tabla es el <b>como se encontró</b>: se registra ANTES de tocar nada. No pasa."',
        '<b>Haz:</b> toca 0 %↑ y <b>Ajustar cero</b>; luego 100 % y <b>Ajustar span</b>. Repite los 9 puntos. <b>Di:</b> "Ahora el <b>como se dejó</b>: pasa."',
        '<b>Di:</b> "Primero el cero y después el span, y se repite, porque se influyen. En la exploración van a probar al revés."',
        '<b>Haz:</b> elige "Histéresis" y repite. <b>Di:</b> "Esto no se arregla ajustando: el transmisor se repara o se reemplaza, y queda registrado."'
      ],
      preguntas: ['"¿Por qué se registra antes de ajustar?" → Para saber cuánto tiempo midió mal el proceso y si hay que revisar la producción hecha con esa medida.'],
      dudas: ['"¿Siempre 5 puntos?" → Es lo típico en transmisores; para manómetros, según su norma (por ejemplo EN 837), igual en varios puntos subiendo y bajando.', '"¿Se calibra en el taller o en campo?" → Las dos: en campo con calibradores portátiles y el manifold del transmisor.'],
      transicion: '<b>Di:</b> "Una rápida." → <b>Siguiente</b>.' },

    'q-c1': rapida(2, '"¿Diferencia entre calibrar y ajustar?"',
      '"Calibrar es comparar con un patrón y registrar; ajustar es corregir. Puede haber calibración sin ajuste, si pasa."'),

    'c2-hart': { min: 7,
      objetivo: 'Que entiendan qué es HART y la diferencia entre trim de sensor, trim de salida y re-rango.',
      pasos: [
        '<b>Haz:</b> pestaña <b>HART</b>. Señala la onda naranja sobre la línea verde.',
        '<b>Di:</b> "El domingo dijimos que por estos dos cables viaja una corriente de 4 a 20 mA. HART le agrega un tono: 1200 Hz es un 1 y 2200 Hz es un 0. Sube y baja por igual, así que el promedio (lo que lee el PLC) no cambia."',
        '<b>Di:</b> "Con un comunicador en paralelo leo el TAG, la presión, el rango y diagnósticos, sin desconectar nada. Necesita unos 250 Ω en el lazo."',
        '<b>Haz:</b> problema "Salida de mA corrida". <b>Di:</b> "El transmisor dice que envía 13,6 mA, pero el multímetro mide otra cosa: está corrida la salida. Se corrige con el <b>trim de salida</b>." Toca el botón.',
        '<b>Haz:</b> problema "Sensor corrido". <b>Di:</b> "Ahora es el sensor el que lee mal. Se aplica presión conocida con el patrón y se hace el <b>trim de sensor</b>." Toca el botón.',
        '<b>Haz:</b> toca <b>Re-rango</b>. <b>Di:</b> "Cambié el rango a 0–6 bar: la misma presión da otra corriente. ¡El PLC muestra mal! Hay que cambiar también su escala." Toca "Cambiar escala del PLC".',
        '<b>Di:</b> "Ojo: re-rango NO es calibrar. No compara con un patrón."'
      ],
      dudas: ['"¿Todos los transmisores tienen HART?" → La mayoría de los modernos sí; hay que verlo en la placa o en el código del modelo.', '"¿Se puede hacer con el celular?" → Hay módems HART por USB o Bluetooth y apps de los fabricantes.'],
      transicion: '<b>Di:</b> "Una rápida." → <b>Siguiente</b>.' },

    'q-c2': rapida(2, '"Re-rango de 0–10 a 0–6 bar: ¿es calibrar?"',
      '"No: solo cambia la escala. Para calibrar hay que comparar con un patrón."'),

    'c2-traza': { min: 5,
      objetivo: 'Que entiendan de dónde viene la confianza en el patrón y la regla 4 a 1.',
      pasos: [
        '<b>Pregunta al grupo:</b> "Si calibramos con un patrón, ¿quién calibra al patrón?"',
        '<b>Haz:</b> pestaña <b>Trazabilidad</b>. Toca los niveles de abajo hacia arriba: PT-104 → patrón de trabajo → laboratorio acreditado → IBMETRO → SI.',
        '<b>Di:</b> "Cada nivel se calibra con el de arriba, con certificado. Esa cadena sin cortes es la trazabilidad. En Bolivia, la cabeza nacional es IBMETRO."',
        '<b>Haz:</b> mueve la tolerancia del instrumento. <b>Di:</b> "El patrón debe ser al menos 4 veces mejor. Para ±0,25 %, un patrón de ±0,0625 % o mejor."',
        '<b>Di:</b> "Un certificado sirve si trae resultados antes y después, la incertidumbre y los patrones usados con su trazabilidad."'
      ],
      transicion: '<b>Di:</b> "Una rápida." → <b>Siguiente</b>.' },

    'q-c3': rapida(2, '"Instrumento de ±0,1 %, regla 4 a 1: ¿qué exactitud mínima debe tener el patrón?"',
      '"0,1 ÷ 4 = ±0,025 %."'),

    'c2-explora': { min: 5,
      objetivo: 'Que cada uno haga la calibración completa y vea el efecto del orden de los ajustes.',
      pasos: ['<b>Di:</b> "Cinco minutos: calibren ustedes. Sigan las 4 preguntas."', '<b>Di</b> (a los 4 min): "Si ajustan el span antes que el cero, al corregir el cero se corre el span: por eso el orden es cero y luego span."'],
      transicion: 'A los 5 minutos → <b>Siguiente</b> (Reto 2). Si vas atrasado, sáltalo.' },

    'c2-reto': { min: 8,
      objetivo: 'Aplicar la corriente ideal, el error en mA, la regla 4 a 1 y elegir la acción correcta.',
      pasos: [
        '<b>Di:</b> "Reto 2, vale 10 puntos, 2 intentos y 7 minutos. En b), el span de la señal es 16 mA."',
        '<b>Haz:</b> a los 5 minutos avisa "2 minutos"; a los 7, toca <b>⏱ Cerrar reto (30 s)</b>.'
      ],
      transicion: 'Con el reto cerrado → <b>Siguiente</b>.' },

    'c2-revisa': { min: 4,
      objetivo: 'Corregir el error en mA y las acciones.',
      pasos: [
        '<b>Haz:</b> mira las barras y la Pizarra.',
        '<b>Di</b> (b): "Error = (medido − ideal) ÷ 16 × 100. No entre 20."',
        '<b>Di</b> (d): "Igual en todo el rango → cero; crece → span; cambiar 4 y 20 mA → re-rango; mA distintos a lo que dice el transmisor → trim de salida; verificar y registrar → calibración."'
      ],
      transicion: '<b>Di:</b> "Último reto, vale 20 puntos." → <b>Siguiente</b>.' },

    integrador: { min: 10,
      objetivo: 'Integrar errores, decisión de pasa/no pasa, efecto del ajuste de cero y regla 4 a 1 en el PT-104 del TK-100.',
      pasos: [
        '<b>Di:</b> "El PT-104 de nuestro tanque llega al taller. Son 5 preguntas y vale <b>20 puntos</b>. Ocho minutos."',
        '<b>Di:</b> "Orden sugerido: 1 y 2 (errores), 3 (¿pasa?), 4 (qué queda tras ajustar el cero) y 5 (¿sirve el patrón?)."',
        '<b>Haz:</b> avisa a los 6 minutos; a los 8, toca <b>⏱ Cerrar reto (30 s)</b>.'
      ],
      transicion: 'Con el reto cerrado → <b>Siguiente</b>.' },

    'integrador-revisa': { min: 3,
      objetivo: 'Cerrar el integrador con la pregunta 4.',
      pasos: ['<b>Di</b> (pregunta 4): "El ajuste de cero quita el error de 0 % en todo el rango, pero el error de span sigue: hay que ajustar el span después."', '<b>Di</b> (pregunta 5): "TUR = tolerancia ÷ exactitud del patrón; debe ser 4 o más."'],
      transicion: '→ <b>Siguiente</b>.' },

    cierre: { min: 3,
      objetivo: 'Dejar las 4 ideas clave y preparar el último día.',
      pasos: [
        '<b>Haz:</b> lee las 4 ideas en pantalla. Cada estudiante ve su puntaje de hoy.',
        '<b>Di:</b> "Mañana, día 6, a las 20:00: el P&amp;ID completo de la planta, diagnóstico de fallas y la <b>evaluación final</b>. Repasen las sesiones con el botón Repasar."',
        '<b>Haz:</b> deja la clase en este paso (fuera de un reto) y toca <b>"Abrir toda la sesión"</b> para el repaso.',
        '<b>Después de clase:</b> Reporte → <b>Descargar para Excel</b>.'
      ] }
  };
  II.SESIONES['ii-s4'].pasos.forEach((p) => { p.guion = GUION[p.id]; });
})();
