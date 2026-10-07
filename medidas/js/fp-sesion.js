// ============================================================
// Medidas Eléctricas · Sesión "Factor de potencia y su corrección"
// Pasos: inicio · explica · teoria · rapida (predicción) · ejercicio · cierre
// Ejercicios con datos propios por carnet: II.rng(carnet + '|' + id)
// ============================================================
(function () {
  const FP = (window.FP = window.FP || {});
  const { f, miles } = FP.fmt;
  const RAD = Math.PI / 180;
  const R3 = Math.sqrt(3);
  const rango = (a, b, paso) => { const v = []; for (let x = a; x <= b + 1e-9; x += paso) v.push(Math.round(x * 1000) / 1000); return v; };
  const elegir = (r, arr) => arr[Math.floor(r() * arr.length)];
  const signo = (v, d = 2) => (v > 0 ? '+' : v < 0 ? '−' : '') + f(Math.abs(v), d);
  const fpEje = (v) => (v <= 1 ? f(v, 2) : f(2 - v, 2) + 'c');

  // ---------------- ejercicios ----------------
  const E = (FP.EJERCICIOS = {});

  // E1 · Construir el triángulo de potencias
  E.e1 = {
    diagrama: 'triangulo', puntos: 10,
    titulo: 'Construye el triángulo de tu carga',
    tv: 'Cada uno tiene su carga (S y FP). <b>Calcula P y Q y construye el triángulo.</b>',
    formulas: ['P = S · FP', 'Q = S · sen φ = √(S² − P²)', 'φ = arccos(FP)'],
    generar: (r) => {
      const S = elegir(r, [20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80]);
      const fp = elegir(r, [0.6, 0.65, 0.7, 0.75, 0.8, 0.85]);
      return { S, fp, P: S * fp, Q: S * Math.sin(Math.acos(fp)) };
    },
    resumen: (d) => `S = ${f(d.S, 0)} kVA · FP ${f(d.fp, 2)}`,
    enunciado: (d) => `Tu carga consume <b>S = ${f(d.S, 0)} kVA</b> con <b>FP = ${f(d.fp, 2)} inductivo</b>. Mueve P y Q hasta construir su triángulo de potencias.`,
    opciones: (d) => ({ inicial: { P: 10, Q: 10 }, ocultar: ['S', 'fp'] }),
    evaluar: (est, d) => {
      const err = (Math.hypot(est.P - d.P, est.Q - d.Q) / d.S) * 100;
      const ok = err <= 3;
      return { ok, puntos: ok ? 10 : err <= 8 ? 5 : 0, valor: err, texto: `Tu triángulo: P = ${f(est.P, 1)} kW, Q = ${f(est.Q, 1)} kVAR (error ${f(err, 1)} %).` };
    },
    eje: { min: 0, max: 40, zona: [0, 3], titulo: 'Error del triángulo (%)', fmt: (v) => f(v, 0) + ' %', marcas: [0, 10, 20, 30, 40] },
    solucion: (d) => ({
      estado: { P: Math.round(d.P * 2) / 2, Q: Math.round(d.Q * 2) / 2 },
      pasos: [`P = S · FP = ${f(d.S, 0)} × ${f(d.fp, 2)} = <b>${f(d.P, 1)} kW</b>`, `Q = S · sen φ = ${f(d.S, 0)} × ${f(Math.sin(Math.acos(d.fp)), 3)} = <b>${f(d.Q, 1)} kVAR</b>`]
    })
  };

  // E2 · FP mínimo para no sobrecargar el cable
  E.e2 = {
    diagrama: 'linea', puntos: 10,
    titulo: 'FP mínimo para tu cable',
    tv: 'Cada taller tiene su P y su cable. <b>Calcula el FP mínimo para no pasar la corriente del cable.</b>',
    formulas: ['I = P / (√3 · VL · FP)', 'FP = P / (√3 · VL · Imáx)', 'VL = 380 V'],
    generar: (r) => {
      const P = elegir(r, rango(30, 60, 2.5));
      const fpObj = 0.72 + 0.01 * Math.floor(r() * 19);
      const Imax = Math.round((P * 1000) / (R3 * 380 * fpObj));
      return { P, Imax, fpMin: (P * 1000) / (R3 * 380 * Imax) };
    },
    resumen: (d) => `P = ${f(d.P, 1)} kW · cable ${d.Imax} A`,
    enunciado: (d) => `Tu taller consume <b>P = ${f(d.P, 1)} kW</b> a 380 V (trifásico). El cable soporta como máximo <b>${d.Imax} A</b>. ¿Cuál es el <b>FP mínimo</b> para no pasar ese límite? Ajusta el FP a ese valor.`,
    opciones: (d) => ({ inicial: { P: d.P, fp: 1 }, fijos: { P: true }, ocultar: ['I', 'S', 'perd', 'trafo'] }),
    evaluar: (est, d) => {
      const dif = est.fp - d.fpMin;
      const ok = dif >= -0.005 && dif <= 0.02;
      const I = (d.P * 1000) / (R3 * 380 * est.fp);
      return {
        ok, puntos: ok ? 10 : dif > 0.02 && dif <= 0.06 ? 5 : 0, valor: dif,
        texto: dif < -0.005 ? `Con FP ${f(est.fp, 2)} la corriente sería ${f(I, 0)} A: el cable se sobrecarga.` : `Con FP ${f(est.fp, 2)} la corriente es ${f(I, 0)} A (límite ${d.Imax} A).`
      };
    },
    eje: { min: -0.12, max: 0.12, zona: [-0.005, 0.02], titulo: 'FP elegido − FP mínimo', fmt: (v) => signo(v), marcas: [-0.1, -0.05, 0, 0.05, 0.1] },
    solucion: (d) => ({
      estado: { P: d.P, fp: Math.ceil(d.fpMin * 100 - 1e-9) / 100 },
      pasos: ['I = P / (√3 · V · FP)  →  FP = P / (√3 · V · I)', `FP = ${miles(d.P * 1000)} / (1,732 × 380 × ${d.Imax}) = <b>${f(d.fpMin, 3)}</b>`]
    })
  };

  // E3 · FP con dos vatímetros
  E.e3 = {
    diagrama: 'vatimetros', puntos: 10,
    titulo: 'FP con dos vatímetros',
    tv: 'Cada uno tiene sus lecturas W1 y W2. <b>Calcula el FP de la carga y ajústalo.</b>',
    formulas: ['tan φ = √3·(W2 − W1)/(W1 + W2)', 'φ = arctan(…)', 'FP = cos φ'],
    generar: (r) => {
      const IL = elegir(r, [10, 12, 15, 18, 20, 25]);
      const fpT = 0.55 + 0.01 * Math.floor(r() * 41);
      const w = FP.dosVatimetros(380, IL, fpT);
      const W1 = Math.round(w.W1 * 100) / 100, W2 = Math.round(w.W2 * 100) / 100;
      const fp = Math.cos(Math.atan((R3 * (W2 - W1)) / (W1 + W2)));
      return { IL, W1, W2, fp };
    },
    resumen: (d) => `W1 = ${f(d.W1, 2)} · W2 = ${f(d.W2, 2)} kW`,
    enunciado: (d) => `En el tablero de una carga trifásica lees <b>W1 = ${f(d.W1, 2)} kW</b> y <b>W2 = ${f(d.W2, 2)} kW</b>. Calcula el factor de potencia y ajústalo en el diagrama (los medidores están tapados).`,
    opciones: (d) => ({ params: { IL: d.IL }, inicial: { fp: 1 }, ocultar: ['W1', 'W2', 'P'] }),
    evaluar: (est, d) => {
      const dif = est.fp - d.fp;
      const ok = Math.abs(dif) <= 0.015;
      return { ok, puntos: ok ? 10 : Math.abs(dif) <= 0.04 ? 5 : 0, valor: dif, texto: `Elegiste FP ${f(est.fp, 2)}; el correcto es ${f(d.fp, 2)}.` };
    },
    eje: { min: -0.2, max: 0.2, zona: [-0.015, 0.015], titulo: 'FP elegido − FP correcto', fmt: (v) => signo(v), marcas: [-0.2, -0.1, 0, 0.1, 0.2] },
    solucion: (d) => {
      const t = (R3 * (d.W2 - d.W1)) / (d.W1 + d.W2);
      return {
        estado: { fp: Math.round(d.fp * 100) / 100 },
        pasos: [`tan φ = 1,732 × (${f(d.W2, 2)} − ${f(d.W1, 2)}) / (${f(d.W1, 2)} + ${f(d.W2, 2)}) = ${f(t, 3)}`, `φ = ${f(Math.atan(t) / RAD, 1)}°  →  FP = cos φ = <b>${f(d.fp, 2)}</b>`]
      };
    }
  };

  // E4 · Corregir con el banco de capacitores
  E.e4 = {
    diagrama: 'corrector', puntos: 10,
    titulo: 'Corrige tu planta a 0,95',
    tv: 'Cada planta es distinta. <b>Conecta los pasos justos para llegar a FP ≥ 0,95</b> (los menos posibles).',
    formulas: ['Qc = P · (tan φ₁ − tan φ₂)', 'tan φ = √(1 − FP²) / FP', 'tan φ₂ (FP 0,95) = 0,329', 'pasos = Qc / q → redondear hacia arriba'],
    generar: (r) => {
      const P = elegir(r, rango(40, 120, 5));
      const fp1 = 0.68 + 0.01 * Math.floor(r() * 15);
      const necesita = P * (Math.tan(Math.acos(fp1)) - Math.tan(Math.acos(0.95)));
      const q = [5, 7.5, 10, 12.5, 15, 20, 25].find((x) => 12 * x >= necesita * 1.25) || 25;
      const n = Math.ceil(necesita / q - 1e-9);
      return { P, fp1, q, N: 12, necesita, n };
    },
    resumen: (d) => `P = ${f(d.P, 0)} kW · FP ${f(d.fp1, 2)} · pasos de ${f(d.q, 1)} kVAR`,
    enunciado: (d) => `Tu planta: <b>P = ${f(d.P, 0)} kW</b> con <b>FP = ${f(d.fp1, 2)} inductivo</b>. El banco tiene 12 pasos de <b>${f(d.q, 1)} kVAR</b>. Conecta los pasos justos para llegar a <b>FP ≥ 0,95</b> usando la menor cantidad posible.`,
    opciones: (d) => ({ params: { P: d.P, q: d.q, N: d.N, fp1: d.fp1 }, inicial: { pasos: 0, fp1: d.fp1 }, fijos: { fp1: true }, ocultar: ['fp2'] }),
    evaluar: (est, d) => {
      const r = FP.calcCorrector(d.P, d.fp1, est.pasos * d.q);
      const valor = FP.ejeFP(r.fp2, r.Q2);
      const ok = est.pasos === d.n;
      const aceptable = r.Q2 >= 0 && r.fp2 >= 0.95;
      return {
        ok, puntos: ok ? 10 : aceptable ? 6 : 0, valor,
        texto: `Con ${est.pasos} pasos (${f(est.pasos * d.q, 1)} kVAR) el FP queda en ${FP.fmt.fpTexto(r.fp2, r.Q2)}. Lo justo eran ${d.n} pasos.`
      };
    },
    eje: { min: 0.8, max: 1.1, zona: [0.95, 1.0], titulo: 'FP final logrado (c = capacitivo)', fmt: fpEje, marcas: [0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1] },
    solucion: (d) => {
      const t1 = Math.tan(Math.acos(d.fp1)), t2 = Math.tan(Math.acos(0.95));
      const r = FP.calcCorrector(d.P, d.fp1, d.n * d.q);
      return {
        estado: { pasos: d.n, fp1: d.fp1 },
        pasos: [`Qc = ${f(d.P, 0)} × (${f(t1, 3)} − ${f(t2, 3)}) = ${f(d.necesita, 1)} kVAR`, `${f(d.necesita, 1)} / ${f(d.q, 1)} = ${f(d.necesita / d.q, 2)}  →  <b>${d.n} pasos</b> · FP = ${FP.fmt.fpTexto(r.fp2, r.Q2)}`]
      };
    }
  };

  // E5 · La factura (numérico)
  E.e5 = {
    diagrama: 'factura', puntos: 10, tipo: 'numerico',
    titulo: 'Lee tu factura',
    tv: 'Cada uno recibió la factura de un taller. <b>Calcula el FP del mes y el recargo en Bs.</b>',
    formulas: ['FP = kWh / √(kWh² + kVARh²)', 'Recargo = cargo × (0,85/FP − 1)', 'Si FP ≥ 0,85 → recargo = 0'],
    generar: (r) => {
      const kwh = Math.round((6000 + r() * 12000) / 10) * 10;
      const fpT = 0.62 + 0.01 * Math.floor(r() * 21);
      const kvarh = Math.round((kwh * Math.tan(Math.acos(fpT))) / 10) * 10;
      const cargo = Math.round((kwh * elegir(r, [0.72, 0.78, 0.85, 0.92])) / 10) * 10;
      const c = FP.calcFactura(kwh, kvarh, cargo);
      return { kwh, kvarh, cargo, fp: c.fp, bs: c.bs };
    },
    resumen: (d) => `${miles(d.kwh)} kWh · ${miles(d.kvarh)} kVARh`,
    enunciado: (d) => `Tu taller consumió <b>${miles(d.kwh)} kWh</b> y <b>${miles(d.kvarh)} kVARh</b> en el mes; el cargo base es <b>Bs ${miles(d.cargo)}</b>. Calcula el FP del mes y el recargo (si el FP es menor a 0,85).`,
    campos: [{ id: 'fp', etiqueta: 'FP del mes', unidad: '', ph: 'ej. 0,812' }, { id: 'bs', etiqueta: 'Recargo', unidad: 'Bs', ph: 'ej. 1250' }],
    opciones: (d) => ({ params: { cargo: d.cargo, cliente: 'Tu taller' }, inicial: { kwh: d.kwh, kvarh: d.kvarh }, fijos: { kwh: true, kvarh: true }, ocultar: ['fp', 'rec', 'pct'], sinControles: true }),
    evaluar: (est, d) => {
      let bsTxt = String(est.bs || '').replace(/[\sBbs]/g, '');
      if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(bsTxt)) bsTxt = bsTxt.replace(/\./g, ''); // 1.290 = mil doscientos noventa
      const fp = II.num(est.fp), bs = II.num(bsTxt);
      const okFP = isFinite(fp) && Math.abs(fp - d.fp) <= 0.005;
      const okBs = isFinite(bs) && (Math.abs(bs - d.bs) <= Math.max(d.bs * 0.03, 5));
      const err = isFinite(bs) ? (Math.abs(bs - d.bs) / Math.max(d.bs, 1)) * 100 : 100;
      return {
        ok: okFP && okBs, puntos: (okFP ? 5 : 0) + (okBs ? 5 : 0), valor: err,
        texto: `FP ${okFP ? '✓' : '✗'} (correcto ${f(d.fp, 3)}) · Recargo ${okBs ? '✓' : '✗'} (correcto Bs ${miles(d.bs)})`
      };
    },
    eje: { min: 0, max: 50, zona: [0, 3], titulo: 'Error del recargo (%)', fmt: (v) => f(v, 0) + ' %', marcas: [0, 10, 20, 30, 40, 50] },
    solucion: (d) => ({
      estado: { kwh: d.kwh, kvarh: d.kvarh },
      pasos: [`FP = ${miles(d.kwh)} / √(${miles(d.kwh)}² + ${miles(d.kvarh)}²) = <b>${f(d.fp, 3)}</b>`, `Recargo = ${miles(d.cargo)} × (0,85 / ${f(d.fp, 3)} − 1) = <b>Bs ${miles(d.bs)}</b>`]
    })
  };

  // ---------------- pasos de la clase ----------------
  FP.SESIONES = FP.SESIONES || {};
  FP.SESIONES['me-fp1'] = {
    id: 'me-fp1',
    materia: 'Medidas Eléctricas',
    titulo: 'Factor de potencia y su corrección',
    pasos: [
      { id: 'inicio', tipo: 'inicio', titulo: 'Factor de potencia y su corrección', idea: 'Escanea el QR, entra con tu nombre y carnet.' },

      { id: 'fasores', tipo: 'explica', titulo: 'Repaso: adelanto y retraso', diagrama: 'fasores',
        idea: 'Bobina: la corriente se atrasa. Capacitor: se adelanta.',
        guia: ['Botones R, L y C: que digan qué pasa antes de tocar.', 'Con R-L (37°): FP = cos 37° = 0,8.'] },
      { id: 'r1', tipo: 'rapida', titulo: 'Predicción', t: 'Un motor es una carga inductiva. Su corriente, respecto a la tensión…', o: ['se atrasa', 'se adelanta', 'está en fase', 'depende de la frecuencia'], c: 0 },

      { id: 'potencia', tipo: 'explica', titulo: '¿Qué potencia aprovecha la carga?', diagrama: 'potencia',
        idea: 'La parte naranja va y vuelve a la red: eso es la potencia reactiva Q.',
        guia: ['Con R: p(t) nunca es negativa.', 'Con L (90°): el promedio es cero, todo va y vuelve.'] },
      { id: 'r2', tipo: 'rapida', titulo: 'Predicción', t: 'Si la corriente se atrasa 90° (bobina ideal), la potencia promedio P es…', o: ['máxima', 'cero', 'la mitad de V·I', 'negativa'], c: 1 },

      { id: 'triangulo', tipo: 'explica', titulo: 'Triángulo de potencias', diagrama: 'triangulo', inicial: { P: 40, Q: 30 },
        idea: 'FP = P / S = cos φ. La red entrega S, pero el trabajo útil es P.',
        guia: ['P = 40, Q = 30 → S = 50 y FP = 0,8.', 'Admitancia: G da P; B inductiva da Q.'] },
      { id: 'e1', tipo: 'ejercicio', ejercicio: 'e1' },

      { id: 'linea', tipo: 'explica', titulo: '¿Por qué importa un FP bajo?', diagrama: 'linea', inicial: { P: 50, fp: 1 },
        idea: 'Misma P con menor FP: más corriente, más pérdidas, trafo más cargado.',
        guia: ['Baja el FP de 1 a 0,7: la corriente sube 43 % y las pérdidas se duplican (I²).'] },
      { id: 'r3', tipo: 'rapida', titulo: 'Predicción', t: 'Una carga de 50 kW pasa de FP 1 a FP 0,7. La corriente…', o: ['no cambia', 'sube cerca de 43 %', 'baja 30 %', 'sube 70 %'], c: 1 },
      { id: 'caso-trafo', tipo: 'explica', titulo: 'Caso: transformador al límite', diagrama: 'linea', inicial: { P: 60, fp: 0.7 },
        idea: 'Corregir el FP libera kVA: el mismo trafo alcanza sin cambiarlo.',
        guia: ['60 kW con FP 0,7 → 114 %. Sube a 0,95 → 84 %.', 'Antes de comprar un trafo más grande, corregir.'] },
      { id: 'e2', tipo: 'ejercicio', ejercicio: 'e2' },

      // ---------- desde aquí: clase del miércoles 07/10 ----------
      { id: 'repaso2', tipo: 'teoria', titulo: 'Repaso: lo que ya sabemos', idea: 'El FP dice qué parte de la corriente hace trabajo útil.',
        puntos: ['FP = P / S: qué fracción de la potencia aparente se convierte en trabajo.', 'Con la misma P, un FP bajo exige <b>más corriente</b>.', 'Más corriente → más pérdidas (I²R), más caída de tensión y trafo más cargado.'],
        formulas: ['S² = P² + Q²', 'FP = P / S = cos φ', 'Q = P · tan φ', 'I = P / (√3 · VL · FP)'] },

      { id: 't-blondel', tipo: 'teoria', titulo: '¿Cómo se mide la potencia trifásica?', idea: 'Teorema de Blondel: con n conductores bastan n − 1 vatímetros.',
        puntos: ['3 hilos → <b>2 vatímetros</b> (conexión Aron).', 'Bobina de corriente en serie con su línea; bobina de tensión entre su línea y la <b>línea común</b> (L2).', 'La suma da la potencia total, con carga equilibrada o no. Cada lectura sola no significa nada.', 'Con neutro (4 hilos) se necesitan 3.'],
        formulas: ['P = W1 + W2', 'Carga equilibrada:', 'W1 = VL·IL·cos(30° + φ)', 'W2 = VL·IL·cos(30° − φ)'] },
      { id: 'r4', tipo: 'rapida', titulo: 'Predicción', t: 'Con FP = 0,5, uno de los dos vatímetros marca…', o: ['cero', 'el doble del otro', 'lo mismo que el otro', 'la potencia total'], c: 0 },
      { id: 'vatimetros', tipo: 'explica', titulo: 'Medir el FP: dos vatímetros', diagrama: 'vatimetros', inicial: { fp: 0.8 },
        idea: 'Mueve el FP y mira cómo se separan las dos lecturas.',
        guia: ['FP 1: ambos iguales. FP 0,5: W1 = 0. Menor a 0,5: W1 negativo (invertir la bobina de tensión).'] },
      { id: 't-vat-fp', tipo: 'teoria', titulo: 'Del par de lecturas al FP', idea: 'Restando y sumando las lecturas sale el ángulo.',
        puntos: ['Suma: W1 + W2 = √3·VL·IL·cos φ = <b>P</b>.', 'Resta: W2 − W1 = VL·IL·sen φ.', 'Si una aguja va al revés: invertir su bobina de tensión y tomar la lectura como <b>negativa</b>.', 'Válido con carga equilibrada y ondas senoidales.'],
        formulas: ['tan φ = √3·(W2 − W1)/(W1 + W2)', 'Q = √3 · (W2 − W1)', 'FP 1 → W1 = W2', 'FP 0,5 → W1 = 0', 'FP < 0,5 → W1 < 0'] },
      { id: 'ej-vat', tipo: 'teoria', titulo: 'Ejemplo resuelto: dos vatímetros', idea: 'Motor trifásico a 380 V.', derecha: 'Solución',
        puntos: ['Lecturas: <b>W1 = 2,24 kW</b> y <b>W2 = 5,66 kW</b>.', 'Calcular P, el FP, Q y la corriente de línea.'],
        formulas: ['P = 2,24 + 5,66 = 7,90 kW', 'tan φ = 1,732·3,42/7,90 = 0,750', 'φ = 36,9° → FP = 0,80 ind', 'Q = 1,732 · 3,42 = 5,92 kVAR', 'I = 7 900/(1,732·380·0,8) = 15 A'] },
      { id: 'e3', tipo: 'ejercicio', ejercicio: 'e3' },

      { id: 't-qc', tipo: 'teoria', titulo: '¿Cuántos kVAR hay que instalar?', idea: 'El capacitor entrega en el sitio la Q que pedía la bobina.',
        puntos: ['P no cambia: solo baja Q. Por eso bajan S y la corriente.', 'Los capacitores van <b>en paralelo</b> con la carga.', 'Meta usual: FP ≈ 0,95, sin pasar a capacitivo.'],
        formulas: ['Qc = P · (tan φ₁ − tan φ₂)', 'tan φ = √(1 − FP²) / FP', 'tan φ (FP 0,95) = 0,329', 'pasos = Qc / q (hacia arriba)'] },
      { id: 'corrector', tipo: 'explica', titulo: 'Corregir: capacitores en paralelo', diagrama: 'corrector', params: { P: 80, q: 10, N: 12, fp1: 0.72 },
        idea: 'Agrega pasos: el triángulo se cierra y la corriente baja.',
        guia: ['Paso a paso: mira cómo se cierra el triángulo y baja la corriente.', 'Pásate a propósito: el FP se vuelve capacitivo.'] },
      { id: 'ej-qc', tipo: 'teoria', titulo: 'Ejemplo resuelto: banco de capacitores', idea: 'P = 80 kW, FP 0,72 → 0,95, pasos de 10 kVAR.', derecha: 'Solución',
        puntos: ['Planta de <b>80 kW</b> con FP <b>0,72</b> inductivo, 380 V.', 'Banco automático de 12 pasos de <b>10 kVAR</b>.', '¿Cuántos pasos para FP ≥ 0,95?'],
        formulas: ['tan φ₁ = 0,964 · tan φ₂ = 0,329', 'Qc = 80 · 0,635 = 50,8 kVAR', '50,8 / 10 = 5,08 → 6 pasos', 'FP final = 0,98 ind', 'I: 169 A → 124 A'] },
      { id: 't-cap', tipo: 'teoria', titulo: 'De kVAR a microfaradios', idea: 'En baja tensión el banco se conecta en triángulo.',
        puntos: ['En <b>triángulo</b> cada capacitor recibe VL: necesita 3 veces menos µF que en estrella.', 'Ej.: 50 kVAR a 380 V en Δ → <b>367 µF</b> por fase (en Y serían 1 102 µF).', 'Corriente del banco de 50 kVAR: 76 A. Contactor y cables con margen (≈ 1,43·Ic).'],
        formulas: ['ω = 2π · 50 = 314,2 rad/s', 'Δ: C = Qc / (3 · ω · VL²)', 'Y: C = Qc / (ω · VL²)', '1φ: C = Qc / (ω · V²)', 'Ic = Qc / (√3 · VL)'] },
      { id: 'r5', tipo: 'rapida', titulo: 'Predicción', t: 'Si conectas más capacitores de los necesarios…', o: ['el FP llega a 1 y se queda ahí', 'el FP se vuelve capacitivo y la tensión sube', 'baja la potencia activa', 'no pasa nada'], c: 1 },
      { id: 'caso-noche', tipo: 'explica', titulo: 'Caso: banco fijo de noche', diagrama: 'corrector', params: { P: 15, q: 5, N: 12, fp1: 0.8 }, inicial: { pasos: 8 },
        idea: 'De noche baja la carga y un banco fijo sobrecompensa. Solución: banco automático.',
        guia: ['Quita pasos hasta volver a la zona verde: eso hace el regulador automático.'] },
      { id: 't-donde', tipo: 'teoria', titulo: '¿Dónde y cómo compensar?', idea: 'Individual, por grupos o central automática.', derecha: 'Seguridad', derechaTexto: true,
        puntos: ['<b>Individual</b> (junto al motor): alivia todo el cable. Qc ≤ 90 % de la Q en vacío del motor (evita autoexcitación).', '<b>Por grupos</b>: en el tablero de un sector.', '<b>Central automática</b>: regulador + escalones. Si Qc > 15 % del trafo, mejor automática que fija.'],
        formulas: ['Resistencias de descarga: ≤ 75 V en 3 min (IEC 60831-1)', 'Esperar y medir antes de tocar', 'Contactores para capacitores: limitan el pico al conectar'] },
      { id: 'e4', tipo: 'ejercicio', ejercicio: 'e4' },

      { id: 't-factura', tipo: 'teoria', titulo: '¿Cómo cobra la distribuidora?', idea: 'El medidor registra kWh y kVARh durante el mes.',
        puntos: ['Con la energía activa y reactiva del mes se calcula el <b>FP medio</b>.', 'Si queda bajo el mínimo se cobra un <b>recargo</b> sobre el cargo base (energía + potencia).', 'Regla de ELFEC (Cochabamba): mínimo 0,85. La de CESSA (Sucre) puede variar.'],
        formulas: ['FP = kWh / √(kWh² + kVARh²)', 'Recargo = cargo × (0,85/FP − 1)', 'Ej.: FP 0,752 → recargo 13,1 %'] },
      { id: 'factura', tipo: 'explica', titulo: 'Caso real: la factura', diagrama: 'factura',
        idea: 'Baja los kVARh y mira cómo desaparece el recargo.',
        guia: ['El medidor registra kWh y kVARh del mes; de ahí sale el FP.', 'Verificar la regla de CESSA para Sucre.'] },
      { id: 'e5', tipo: 'ejercicio', ejercicio: 'e5' },

      { id: 'armonicos', tipo: 'explica', titulo: 'Caso: armónicos (variadores, LED, equipos médicos)', diagrama: 'armonicos',
        idea: 'El cosfímetro solo ve el desfase. El FP real incluye la distorsión.',
        guia: ['Fuente sin PFC: cos φ₁ ≈ 1 pero FP real ≈ 0,67.', 'Con armónicos, un capacitor puede entrar en resonancia: se usan reactores de desintonía.'] },
      { id: 't-arm', tipo: 'teoria', titulo: 'FP verdadero y resonancia', idea: 'Capacitores + armónicos: cuidado.',
        puntos: ['Variadores, LED y fuentes toman corriente a pulsos: aparecen armónicos (3.º, 5.º, 7.º…).', 'El capacitor y la inductancia del trafo resuenan: si coincide con un armónico, la corriente se amplifica y el capacitor se daña.', 'Solución: reactor de desintonía (7 %) o filtro activo.'],
        formulas: ['FP = cos φ₁ / √(1 + THD²)', 'h_res = √(Scc / Qc)', 'Trafo 75 kVA, uk 4 %:', 'Scc ≈ 1 875 kVA', 'Con 50 kVAR → h ≈ 6,1 ⚠'] },
      { id: 'r6', tipo: 'rapida', titulo: 'Predicción', t: 'Fuente de computadora sin PFC: el cosfímetro marca 0,99 y el THD es 110 %. El FP real es cerca de…', o: ['0,99', '0,67', '1', '0,30'], c: 1 },

      { id: 'cierre', tipo: 'cierre', titulo: 'Cierre', idea: 'Medir P, Q y FP → decidir cuánto, dónde y cómo compensar.' }
    ]
  };

  // ejercicio resuelto de ejemplo (para la pantalla)
  FP.datosDe = (ejId, carnet) => FP.EJERCICIOS[ejId].generar(II.rng(String(carnet) + '|' + ejId));
  FP.CARNET_EJEMPLO = 'ejemplo';
})();
