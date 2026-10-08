// ============================================================
// Transformadas y Funciones Especiales · Examen: transformada y antitransformada de Laplace
// 10 preguntas, valores propios por carnet (II.rng(carnet + '|' + id)), total 100 puntos.
// Tipos: opcion { o: [html], c } · campos { campos: [{ id, et, valor }] } · orden { pasos }
// Las respuestas numéricas son siempre enteras (el estudiante tiene un botón ± para el signo).
// ============================================================
(function () {
  const TF = (window.TF = window.TF || {});
  const M = '−';

  // ---------- escritura matemática ----------
  const n = (x) => (x < 0 ? M + Math.abs(x) : String(x));                       // número con signo tipográfico
  const fr = (a, b) => `<span class="fr"><span>${a}</span><span>${b}</span></span>`; // fracción con barra horizontal
  const sMas = (a, v = 's') => (a === 0 ? v : a > 0 ? `${v} + ${a}` : `${v} ${M} ${Math.abs(a)}`);
  const ex = (x) => `e<sup>${x}</sup>`;
  const k1 = (k, cuerpo) => (k === 1 ? cuerpo : k === -1 ? M + cuerpo : n(k) + cuerpo);   // coeficiente (oculta el 1)
  const expS = (a) => ex(a === 1 ? `${M}s` : `${M}${a}s`);                       // e^(−as)
  const expT = (a) => ex(a === 1 ? `${M}t` : `${M}${a}t`);                       // e^(−at)
  // suma de términos con signo: [[signo, html], …] → "A + B − C"
  const suma = (ts) => ts.filter((t) => t).map(([s, h], i) => (i === 0 ? (s < 0 ? M + ' ' : '') + h : (s < 0 ? ` ${M} ` : ' + ') + h)).join('');
  // polinomio en s: [c2, c1, c0]
  const poli = (cs) => {
    const g = cs.length - 1;
    const ts = cs.map((c, i) => {
      if (c === 0) return null;
      const p = g - i, a = Math.abs(c);
      const v = p === 0 ? String(a) : (a === 1 ? '' : a) + (p === 1 ? 's' : 's²');
      return [c < 0 ? -1 : 1, v];
    });
    const r = suma(ts);
    return r || '0';
  };
  const tramos = (filas) => `<span class="tramos"><span class="llave">{</span><span class="filas">${filas.map(([e, c]) => `<span><b>${e}</b><i>${c}</i></span>`).join('')}</span></span>`;
  const formula = (h) => `<div class="formula-tf">${h}</div>`;
  const rango = (r, a, b, sin = []) => { let x; do { x = a + Math.floor(r() * (b - a + 1)); } while (sin.includes(x)); return x; };

  TF.mat = { n, fr, sMas, ex, k1, expS, expT, suma, poli, tramos, formula };

  // ---------- banco ----------
  TF.PREGUNTAS = [
    {
      id: 'p1', puntos: 7, tema: 'Transformada de funciones básicas', tipo: 'opcion',
      gen(r) {
        const a = rango(r, 2, 6), b = rango(r, 2, 6), c = rango(r, 1, 5);
        const f = `f(t) = ${a} + ${b}t ${M} ${expT(c)}`;
        return {
          t: `Elige la transformada de Laplace de:${formula(f)}`,
          o: [
            `F(s) = ${fr(a, 's')} + ${fr(b, 's²')} ${M} ${fr(1, sMas(c))}`,
            `F(s) = ${fr(a, 's')} + ${fr(b, 's')} ${M} ${fr(1, sMas(c))}`,
            `F(s) = ${fr(a, 's')} + ${fr(b, 's²')} ${M} ${fr(1, sMas(-c))}`,
            `F(s) = ${a} + ${fr(b, 's²')} ${M} ${fr(1, sMas(c))}`
          ],
          sol: [`Por linealidad, término a término: ℒ{${a}} = ${fr(a, 's')}, ℒ{t} = ${fr(1, 's²')} y ℒ{${expT(c)}} = ${fr(1, sMas(c))}.`,
            `Errores típicos: ℒ{t} no es 1/s; la exponencial e<sup>${M}ct</sup> da (s + c), no (s ${M} c); y una constante no se queda igual: ℒ{${a}} = ${a}/s.`]
        };
      }
    },
    {
      id: 'p2', puntos: 7, tema: 'Primer teorema de traslación', tipo: 'opcion',
      gen(r) {
        const a = rango(r, 1, 4), b = rango(r, 2, 5), b2 = b * b;
        const den = (x) => `(${sMas(x)})² + ${b2}`;
        return {
          t: `Elige la transformada de Laplace de:${formula(`f(t) = ${expT(a)} · sen(${b}t)`)}`,
          o: [
            `F(s) = ${fr(b, den(a))}`,
            `F(s) = ${fr(sMas(a), den(a))}`,
            `F(s) = ${fr(b, den(-a))}`,
            `F(s) = ${fr(b, `(${sMas(a)})(s² + ${b2})`)}`
          ],
          sol: [`ℒ{sen(${b}t)} = ${fr(b, `s² + ${b2}`)}. Multiplicar por ${expT(a)} traslada en s: se cambia s por s + ${a}.`,
            `Resultado: ${fr(b, den(a))}. No es el producto de las dos transformadas, y el numerador del seno es ${b} (s + ${a} sería el del coseno).`]
        };
      }
    },
    {
      id: 'p3', puntos: 7, tema: 'Función a tramos con escalón unitario', tipo: 'opcion',
      gen(r) {
        const a = rango(r, 1, 4);
        const e = expS(a), ka = a === 1 ? e : a + e;
        return {
          t: `Elige la transformada de Laplace de la rampa que se apaga:${formula(`f(t) = ${tramos([['t', `si 0 ≤ t &lt; ${a}`], ['0', `si t ≥ ${a}`]])}`)}`,
          o: [
            `F(s) = ${fr(1, 's²')} ${M} ${fr(e, 's²')} ${M} ${fr(ka, 's')}`,
            `F(s) = ${fr(1, 's²')} ${M} ${fr(e, 's²')}`,
            `F(s) = ${fr(1, 's²')} ${M} ${fr(ka, 's')}`,
            `F(s) = ${fr(1, 's²')} ${M} ${fr(e, 's²')} + ${fr(ka, 's')}`
          ],
          sol: [`Método de ventanas: f(t) = t·[u(t) ${M} u(t ${M} ${a})] = t·u(t) ${M} t·u(t ${M} ${a}).`,
            `Para trasladar se escribe t = (t ${M} ${a}) + ${a}: f(t) = t·u(t) ${M} (t ${M} ${a})·u(t ${M} ${a}) ${M} ${a}·u(t ${M} ${a}).`,
            `Con el segundo teorema: F(s) = ${fr(1, 's²')} ${M} ${fr(e, 's²')} ${M} ${fr(ka, 's')}. El error clásico es olvidar el término ${M}${a === 1 ? '' : a}u(t ${M} ${a}).`]
        };
      }
    },
    {
      id: 'p4', puntos: 7, tema: 'Teorema del valor final', tipo: 'campos',
      gen(r) {
        const a = rango(r, 1, 5), b = rango(r, a + 1, 6), m = rango(r, 2, 9), p = rango(r, 1, 5), K = m * a * b;
        return {
          t: `Sin calcular f(t), halla el valor final de la función cuya transformada es:${formula(`F(s) = ${fr(sMas(K, p === 1 ? 's' : p + 's'), `s(${sMas(a)})(${sMas(b)})`)}`)}`,
          campos: [{ id: 'v', et: 'lím f(t) cuando t → ∞ =', valor: m }],
          sol: [`Los polos de s·F(s) son ${M}${a} y ${M}${b} (semiplano izquierdo), así que el teorema se puede aplicar.`,
            `lím f(t) = lím<sub>s→0</sub> s·F(s) = ${fr(K, `${a}·${b}`)} = <b>${m}</b>.`]
        };
      }
    },
    {
      id: 'p5', puntos: 12, tema: 'Antitransformada: raíces reales distintas', tipo: 'campos',
      gen(r) {
        const a = rango(r, 1, 3), b = rango(r, a + 1, 5);
        let A, B;
        do { A = rango(r, -4, 5, [0]); B = rango(r, -4, 5, [0]); } while (A + B === 0);
        const p = A + B, q = A * b + B * a;
        return {
          t: `Halla la antitransformada de:${formula(`F(s) = ${fr(poli([p, q]), `(${sMas(a)})(${sMas(b)})`)}`)}Escríbela en la forma:${formula(`f(t) = A·${expT(a)} + B·${expT(b)}`)}`,
          campos: [{ id: 'A', et: 'A =', valor: A }, { id: 'B', et: 'B =', valor: B }],
          sol: [`Fracciones parciales: F(s) = ${fr('A', sMas(a))} + ${fr('B', sMas(b))}.`,
            `A = [(${sMas(a)})·F(s)] en s = ${M}${a}: ${fr(poli([p, q]).replace(/s/g, `(${M}${a})`), `${M}${a} + ${b}`)} = <b>${n(A)}</b>.`,
            `B = [(${sMas(b)})·F(s)] en s = ${M}${b}: <b>${n(B)}</b>.`,
            `f(t) = ${suma([[1, k1(A, expT(a))], [B < 0 ? -1 : 1, k1(Math.abs(B), expT(b))]])}.`]
        };
      }
    },
    {
      id: 'p6', puntos: 12, tema: 'Antitransformada: raíz repetida', tipo: 'campos',
      gen(r) {
        const a = rango(r, 1, 3), b = rango(r, 1, 4, [a]);
        const A = rango(r, -3, 4, [0]), B = rango(r, -3, 4, [0]), C = rango(r, -3, 4, [0]);
        const c2 = A + C, c1 = A * (a + b) + B + 2 * a * C, c0 = A * a * b + B * b + C * a * a;
        return {
          t: `Halla la antitransformada de:${formula(`F(s) = ${fr(poli([c2, c1, c0]), `(${sMas(a)})²(${sMas(b)})`)}`)}Escríbela en la forma:${formula(`f(t) = A·${expT(a)} + B·t·${expT(a)} + C·${expT(b)}`)}`,
          campos: [{ id: 'A', et: 'A =', valor: A }, { id: 'B', et: 'B =', valor: B }, { id: 'C', et: 'C =', valor: C }],
          sol: [`F(s) = ${fr('A', sMas(a))} + ${fr('B', `(${sMas(a)})²`)} + ${fr('C', sMas(b))}.`,
            `C: tapando (${sMas(b)}) y evaluando en s = ${M}${b} → C = <b>${n(C)}</b>.`,
            `B: tapando (${sMas(a)})² y evaluando en s = ${M}${a} → B = <b>${n(B)}</b>.`,
            `A: comparando el coeficiente de s²: A + C = ${n(c2)} → A = <b>${n(A)}</b>.`,
            `f(t) = ${suma([[1, k1(A, expT(a))], [B < 0 ? -1 : 1, k1(Math.abs(B), 't·' + expT(a))], [C < 0 ? -1 : 1, k1(Math.abs(C), expT(b))]])}.`]
        };
      }
    },
    {
      id: 'p7', puntos: 12, tema: 'Antitransformada: raíces complejas', tipo: 'campos',
      gen(r) {
        const al = rango(r, 1, 3), be = rango(r, 2, 4), k = II.elegir(r, [-2, -1, 1, 2, 3]);
        const c = al + k * be;
        return {
          t: `Halla la antitransformada de:${formula(`F(s) = ${fr(sMas(c), `s² + ${2 * al}s + ${al * al + be * be}`)}`)}Escríbela en la forma (con b &gt; 0):${formula(`f(t) = e<sup>a·t</sup>·[cos(b·t) + k·sen(b·t)]`)}<p class="nota-tf">«a» es el número que multiplica a t en el exponente, con su signo.</p>`,
          campos: [{ id: 'a', et: 'a =', valor: -al }, { id: 'b', et: 'b =', valor: be }, { id: 'k', et: 'k =', valor: k }],
          sol: [`Completando el cuadrado: s² + ${2 * al}s + ${al * al + be * be} = (${sMas(al)})² + ${be * be}.`,
            `Numerador: ${sMas(c)} = (${sMas(al)}) ${k * be < 0 ? M : '+'} ${Math.abs(k * be)} = (${sMas(al)}) ${k < 0 ? M : '+'} ${Math.abs(k)}·${be}.`,
            `F(s) = ${fr(sMas(al), `(${sMas(al)})² + ${be * be}`)} ${k < 0 ? M : '+'} ${Math.abs(k) === 1 ? '' : Math.abs(k) + '·'}${fr(be, `(${sMas(al)})² + ${be * be}`)} → f(t) = ${expT(al)}·[cos(${be}t) ${k < 0 ? M : '+'} ${Math.abs(k) === 1 ? '' : Math.abs(k)}sen(${be}t)].`,
            `a = <b>${n(-al)}</b>, b = <b>${be}</b>, k = <b>${n(k)}</b>.`]
        };
      }
    },
    {
      id: 'p8', puntos: 12, tema: 'Segundo teorema de traslación', tipo: 'opcion',
      gen(r) {
        const c = rango(r, 1, 4), a = rango(r, 1, 5);
        const ea = (arg) => ex(`${M}${a === 1 ? '' : a}(${arg})`);
        return {
          t: `Elige la antitransformada de:${formula(`F(s) = ${fr(expS(c), sMas(a))}`)}`,
          o: [
            `f(t) = ${ea(`t ${M} ${c}`)} · u(t ${M} ${c})`,
            `f(t) = ${expT(a)} · u(t ${M} ${c})`,
            `f(t) = ${ea(`t ${M} ${c}`)}`,
            `f(t) = ${ea(`t + ${c}`)} · u(t + ${c})`
          ],
          sol: [`ℒ⁻¹{${fr(1, sMas(a))}} = ${expT(a)}.`,
            `El factor ${expS(c)} retrasa toda la función ${c} unidades: ℒ⁻¹{e<sup>${M}cs</sup>F(s)} = f(t ${M} c)·u(t ${M} c).`,
            `Resultado: ${ea(`t ${M} ${c}`)}·u(t ${M} ${c}). Hay que trasladar la función y además «encenderla» con el escalón.`]
        };
      }
    },
    {
      id: 'p9', puntos: 6, tema: 'Método para resolver una EDO', tipo: 'orden',
      gen() {
        return {
          t: 'Ordena los pasos para resolver una ecuación diferencial con la transformada de Laplace.',
          pasos: [
            'Aplicar la transformada de Laplace a toda la ecuación',
            'Reemplazar las condiciones iniciales y(0) y y′(0)',
            'Despejar Y(s)',
            'Descomponer Y(s) en fracciones parciales',
            'Aplicar la antitransformada para obtener y(t)'
          ],
          sol: ['Se transforma, se usan las condiciones iniciales, se despeja Y(s), se descompone y se antitransforma.']
        };
      }
    },
    {
      id: 'p10', puntos: 18, tema: 'EDO de 2.º orden con entrada escalón', tipo: 'campos',
      gen(r) {
        const [a, b] = II.elegir(r, [[1, 2], [1, 3], [2, 3]]);
        const K = rango(r, 1, 4), C1 = rango(r, -4, 4, [0]), C2 = rango(r, -4, 4, [0]);
        const y0 = K + C1 + C2, v0 = -a * C1 - b * C2;
        const ed = `y″ + ${a + b}y′ + ${a * b === 1 ? '' : a * b}y = ${a * b * K}`;
        return {
          t: `Resuelve con la transformada de Laplace:${formula(ed)}${formula(`y(0) = ${n(y0)}, &nbsp; y′(0) = ${n(v0)}`)}La solución tiene la forma:${formula(`y(t) = ${K} + C<sub>1</sub>·${expT(a)} + C<sub>2</sub>·${expT(b)}`)}`,
          campos: [{ id: 'C1', et: 'C<sub>1</sub> =', valor: C1 }, { id: 'C2', et: 'C<sub>2</sub> =', valor: C2 }],
          sol: [`Transformando: [s²Y ${M} s·y(0) ${M} y′(0)] + ${a + b}[sY ${M} y(0)] + ${a * b}Y = ${fr(a * b * K, 's')}.`,
            `Despejando: Y(s) = ${fr(poli([y0, v0 + (a + b) * y0, a * b * K]), `s(${sMas(a)})(${sMas(b)})`)}.`,
            `Fracciones parciales: Y(s) = ${fr(K, 's')} + ${fr('C₁', sMas(a))} + ${fr('C₂', sMas(b))} con C₁ = <b>${n(C1)}</b> y C₂ = <b>${n(C2)}</b>.`,
            `Comprobación: y(0) = ${K} ${C1 < 0 ? M : '+'} ${Math.abs(C1)} ${C2 < 0 ? M : '+'} ${Math.abs(C2)} = ${n(y0)} ✓ · y′(0) = ${n(-a * C1)} ${-b * C2 < 0 ? M : '+'} ${Math.abs(b * C2)} = ${n(v0)} ✓`]
        };
      }
    }
  ];
  TF.TOTAL = TF.PREGUNTAS.reduce((s, q) => s + q.puntos, 0); // 100

  // ---------- instancias por carnet ----------
  TF.instancia = (q, carnet, i) => {
    const r = II.rng(String(carnet) + '|' + q.id);
    const inst = { id: q.id, n: i + 1, puntos: q.puntos, tema: q.tema, tipo: q.tipo, ...q.gen(r) };
    if (inst.tipo === 'opcion') { inst.c = 0; inst.orden = II.mezclar(r, inst.o.map((_, k) => k)); }
    if (inst.tipo === 'orden') {
      let m = II.mezclar(r, inst.pasos.map((_, k) => k));
      if (m.every((v, k) => v === k)) m = m.slice(1).concat(m[0]);
      inst.mezcla = m;
    }
    return inst;
  };
  TF.instancias = (carnet) => TF.PREGUNTAS.map((q, i) => TF.instancia(q, carnet, i));

  // ---------- lectura de números: acepta coma, punto, «−», y fracciones a/b ----------
  TF.num = (v) => {
    if (v == null) return NaN;
    const s = String(v).replace(/[−–]/g, '-').replace(/\s/g, '').replace(',', '.');
    if (s === '' || s === '-' || s === '.') return NaN;
    if (s.includes('/')) { const [x, y] = s.split('/'); const a = Number(x), b = Number(y); return b ? a / b : NaN; }
    return Number(s);
  };
  const igual = (v, esperado) => isFinite(v) && Math.abs(v - esperado) <= Math.max(Math.abs(esperado) * 0.02, 0.01) + 1e-9;

  // ---------- calificación: fracción entre 0 y 1 ----------
  TF.calificar = (inst, resp) => {
    if (resp == null) return 0;
    if (inst.tipo === 'opcion') return resp === inst.c ? 1 : 0;
    if (inst.tipo === 'campos') {
      const ok = inst.campos.filter((c) => igual(TF.num(resp[c.id]), c.valor)).length;
      return ok / inst.campos.length;
    }
    if (inst.tipo === 'orden') {
      const s = Array.isArray(resp) ? resp : [];
      return inst.pasos.reduce((a, _, i) => a + (s[i] === i ? 1 : 0), 0) / inst.pasos.length;
    }
    return 0;
  };
  TF.respondida = (inst, resp) => {
    if (resp == null) return false;
    if (inst.tipo === 'opcion') return typeof resp === 'number';
    if (inst.tipo === 'campos') return inst.campos.every((c) => String(resp[c.id] == null ? '' : resp[c.id]).trim() !== '');
    if (inst.tipo === 'orden') return Array.isArray(resp) && resp.length === inst.pasos.length;
    return false;
  };
  TF.tocada = (inst, resp) => {
    if (resp == null) return false;
    if (inst.tipo === 'campos') return inst.campos.some((c) => String(resp[c.id] == null ? '' : resp[c.id]).trim() !== '');
    return TF.respondida(inst, resp) || (Array.isArray(resp) && resp.length > 0);
  };

  // nota del examen a partir de las respuestas guardadas (la usa también el reporte docente)
  TF.nota = (carnet, respuestas) => {
    const insts = TF.instancias(carnet);
    const puntos = {};
    let total = 0;
    insts.forEach((q) => {
      const p = Math.round(TF.calificar(q, (respuestas || {})[q.id]) * q.puntos * 10) / 10;
      puntos[q.id] = p;
      total += p;
    });
    return { puntos, nota: Math.round(total * 10) / 10 };
  };

  // ---------- respuesta correcta en texto ----------
  TF.correctaHTML = (inst) => {
    if (inst.tipo === 'opcion') return inst.o[inst.c];
    if (inst.tipo === 'campos') return inst.campos.map((c) => `${c.et} <b>${n(c.valor)}</b>`).join(' · ');
    if (inst.tipo === 'orden') return '<ol class="orden-ok">' + inst.pasos.map((p) => `<li>${p}</li>`).join('') + '</ol>';
    return '';
  };

  TF.EXAMEN = {
    materia: 'Transformadas y Funciones Especiales',
    titulo: 'Examen: transformada y antitransformada de Laplace',
    corto: 'Examen de Laplace',
    minutos: 60,
    seccion: { 'tf-ex1': 'Examen oficial', 'tf-prueba': 'Prueba (no cuenta)' }
  };
})();
