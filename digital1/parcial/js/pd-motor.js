// ============================================================
// Electrónica Digital 1 · parcial por celular (09/11/2026) — problemas y calificación
// Mismo espacio RC que el 2.º parcial de Medidas (medidas/parcial2/js/pm-motor.js), con otros problemas.
// 6 problemas con datos propios por carnet (100 pts):
//   P1 conversiones (15) · P2 Boole y De Morgan (15) · P3 circuito, tabla y NAND (20)
//   P4 diseño de una aplicación (15) · P5 mapa de Karnaugh con X (20) · P6 XOR y paridad (15)
// Regla del docente: toda cantidad en ceros y unos va junta (sin separar de 4 en 4) y el enunciado
// dice en qué código está. Las casillas aceptan solo el valor exacto (0 y 1 se escriben tal cual).
// Opciones: la correcta va primero en ops(d, id) y se mezcla por carnet. o.h = texto HTML; o.t = LaTeX.
// Usa D1.k (mapas y tablas) y D1.circ (dibujo del circuito) de ../js/.
// ============================================================
(function () {
  const RC = (window.RC = window.RC || {});
  const K = window.D1.k, CI = window.D1.circ;

  // ---------- azar reproducible por carnet ----------
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  RC.rng = (semilla) => {
    let a = hash(String(semilla));
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  const elegir = (r, arr) => arr[Math.floor(r() * arr.length)];
  const ent = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  RC.mezclar = (r, arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------- lo que escribe el estudiante ----------
  RC.leer = (s) => {
    if (s == null) return { vacio: true };
    const t = String(s).trim().replace(/\s+/g, '').replace(/[−–—‒]/g, '-').replace(/^\+/, '').replace(/,/g, '.');
    if (t === '') return { vacio: true };
    const num = /^-?(\d+\.?\d*|\.\d+)$/;
    if (num.test(t)) return { v: Number(t) || 0 };
    return { invalido: true };
  };
  RC.TOL_REL = 0.02;
  RC.TOL_ABS = 0.01;
  RC.cerca = (v, e, tol) => {
    const rel = tol && tol.rel != null ? tol.rel : RC.TOL_REL, abs = tol && tol.abs != null ? tol.abs : RC.TOL_ABS;
    return isFinite(v) && isFinite(e) && Math.abs(v - e) <= Math.max(rel * Math.abs(e), abs) + 1e-9;
  };
  const EX = { rel: 0, abs: 0.01 }; // exacto

  // ---------- números para mostrar ----------
  const decs = (x) => { const a = Math.abs(x); if (!isFinite(a) || a === 0) return 0; return Math.max(0, Math.min(4, 3 - Math.floor(Math.log10(a)))); };
  const redo = (x, d) => { const v = Math.round(x * 10 ** d) / 10 ** d; return Object.is(v, -0) ? 0 : v; };
  RC.txt = (x, d) => String(redo(x, d == null ? decs(x) : d)).replace('.', ',').replace('-', '−');
  RC.tex = (x, d) => String(redo(x, d == null ? decs(x) : d)).replace('.', '{,}');
  RC.opTxt = (o) => (o.h != null ? o.h : '\\(' + o.t + '\\)');
  RC.etTxt = (it) => (it.h != null ? it.h : '\\(' + it.et + '\\)');
  const M = (s) => '\\(' + s + '\\)';
  const bits = (s) => '<b class="mono pd-bits">' + s + '</b>';
  const bin = (n, k) => { const s = n.toString(2); return k ? s.padStart(k, '0') : s; };
  const bcd = (n) => String(n).split('').map((c) => bin(+c, 4)).join('');
  const pesos = (n) => { const o = []; for (let p = 128; p >= 1; p /= 2) if (n & p) o.push(p); return o; };
  const unos = (s) => s.split('').filter((c) => c === '1').length;

  // ---------- funciones lógicas: suma de productos (literal = 2·variable + negada) ----------
  const evalSOP = (pu, nv) => Array.from({ length: 1 << nv }, (_, m) => (pu.some((g) => g.every((c) => (((m >> (nv - 1 - (c >> 1))) & 1) ^ (c & 1)) === 1)) ? 1 : 0));
  const ordenar = (g) => g.slice().sort((a, b) => a - b);
  const litT = (c, n) => (c & 1 ? '\\overline{' + n[c >> 1] + '}' : n[c >> 1]);
  const sopT = (pu, n) => (pu.length ? pu.map((g) => ordenar(g).map((c) => litT(c, n)).join('\\cdot ')).join(' + ') : '0');
  const deCubos = (nv, cubos) => cubos.map((cb) => { const g = []; for (let i = 0; i < nv; i++) { const b = 1 << (nv - 1 - i); if (cb.mask & b) g.push(2 * i + (cb.val & b ? 0 : 1)); } return g; });
  const distintaEnCuidado = (g, f) => f.some((v, m) => v !== 2 && v !== g[m]);
  // variantes equivocadas de una suma de productos: funciones distintas entre sí y de la correcta (en las celdas que importan)
  function distractores(r, pu, f, nv, k) {
    const cand = [];
    pu.forEach((g, j) => {
      g.forEach((c, i) => { const h = g.slice(); h[i] = c ^ 1; cand.push(pu.map((x, z) => (z === j ? h : x))); });
      if (pu.length > 1) cand.push(pu.filter((_, z) => z !== j));
      g.forEach((c, i) => {
        for (let v = 0; v < nv; v++) {
          if (g.some((cc) => cc >> 1 === v)) continue;
          const h = g.slice(); h[i] = 2 * v + (c & 1); cand.push(pu.map((x, z) => (z === j ? h : x)));
          if (g.length < nv) cand.push(pu.map((x, z) => (z === j ? g.concat([2 * v + (r() < 0.5 ? 1 : 0)]) : x)));
        }
      });
    });
    const vistos = [], out = [];
    RC.mezclar(r, cand).forEach((p) => {
      if (out.length >= k || !p.length || p.some((g) => !g.length)) return;
      const gg = evalSOP(p, nv);
      if (!distintaEnCuidado(gg, f) || gg.every((x) => x === 0) || gg.every((x) => x === 1)) return;
      const kk = gg.join('');
      if (vistos.includes(kk)) return;
      vistos.push(kk); out.push(p);
    });
    return out;
  }
  const N3 = ['A', 'B', 'C'], N4 = ['A', 'B', 'C', 'D'];

  const P = {};

  // ===== P1: conversiones =====
  P.p1 = {
    titulo: 'Conversiones', max: 15,
    gen(r) {
      let a; do { a = ent(r, 37, 250); } while (unos(bin(a)) < 3);
      let b; do { b = ent(r, 41, 250); } while (b === a || unos(bin(b)) < 3);
      let c; do { c = ent(r, 13, 98); } while (c % 11 === 0);
      let dd; do { dd = ent(r, 12, 98); } while (dd % 11 === 0 || dd === c);
      let e; do { e = ent(r, 12, 98); } while (e % 10 === 0 || e === dd);
      return { a, b, c, dd, e };
    },
    enunciado: (d) => `<p>Escribe solo ceros y unos (o el número decimal), <b>sin espacios</b>.</p><ol class="pd-lista" type="a">
      <li>La siguiente cantidad está en <b>decimal</b>: <b>${d.a}</b>. Conviértela a <b>binario</b>.</li>
      <li>La siguiente cantidad está en <b>binario</b>: ${bits(bin(d.b, 8))}. Conviértela a <b>decimal</b>.</li>
      <li>La siguiente cantidad está en <b>decimal</b>: <b>${d.c}</b>. Conviértela a <b>BCD</b>.</li>
      <li>La siguiente cantidad está en <b>BCD</b>: ${bits(bcd(d.dd))}. Conviértela a <b>decimal</b>.</li>
      <li>La siguiente cantidad está en <b>BCD</b>: ${bits(bcd(d.e))}. Conviértela a <b>binario</b>.</li></ol>`,
    pasos: (d) => [{ t: 'Respuestas', tex: null, items: [
      { id: 'a', h: 'a) En binario', pts: 3, tol: EX, txt: d && d.a ? bin(d.a) : null },
      { id: 'b', h: 'b) En decimal', pts: 3, tol: EX },
      { id: 'c', h: 'c) En BCD', pts: 3, tol: EX, txt: d && d.c ? bcd(d.c) : null },
      { id: 'd', h: 'd) En decimal', pts: 3, tol: EX },
      { id: 'e', h: 'e) En binario', pts: 3, tol: EX, txt: d && d.e ? bin(d.e) : null }] }],
    ops: () => [],
    esperado: (d) => ({ a: [Number(bin(d.a))], b: [d.b], c: [Number(bcd(d.c))], d: [d.dd], e: [Number(bin(d.e))] }),
    final(d) {
      const dig = (n) => String(n).split('').map((c) => c + ' → ' + bin(+c, 4)).join('; ');
      const g = (s) => s.match(/.{4}/g).join(' | ');
      return [
        `<p><b>a)</b> Se restan los pesos que caben: ${d.a} = ${pesos(d.a).join(' + ')} → ${bits(bin(d.a))}</p>`,
        `<p><b>b)</b> Se suman los pesos de los unos: ${bits(bin(d.b, 8))} = ${pesos(d.b).join(' + ')} = <b>${d.b}</b></p>`,
        `<p><b>c)</b> Cada dígito con sus 4 bits: ${dig(d.c)} → ${bits(bcd(d.c))}</p>`,
        `<p><b>d)</b> Grupos de 4 bits desde la derecha: ${g(bcd(d.dd))} → <b>${d.dd}</b></p>`,
        `<p><b>e)</b> Primero a decimal: ${g(bcd(d.e))} → ${d.e}; después a binario: ${d.e} = ${pesos(d.e).join(' + ')} → ${bits(bin(d.e))}</p>`];
    }
  };

  // ===== P2: álgebra de Boole y De Morgan =====
  const BOOLE = [
    ['A\\cdot B + A\\cdot\\overline{B}', ['A', 'B', '1', 'A\\cdot B'], 'Factor común: A·(B + B̄) = A·1 = A.'],
    ['A + \\overline{A}\\cdot B', ['A + B', 'A', 'B', 'A\\cdot B'], '(A + Ā)·(A + B) = 1·(A + B) = A + B.'],
    ['(A + B)\\cdot(A + \\overline{B})', ['A', 'B', 'A + B', '0'], 'Distributiva: A + B·B̄ = A + 0 = A.'],
    ['A\\cdot(\\overline{A} + B)', ['A\\cdot B', 'A', 'B', '0'], 'A·Ā + A·B = 0 + A·B = A·B.'],
    ['\\overline{\\overline{A}\\cdot\\overline{B}}', ['A + B', 'A\\cdot B', '\\overline{A} + \\overline{B}', '\\overline{A}\\cdot\\overline{B}'], 'De Morgan: se rompe la barra y se cambia · por +; las dobles barras se cancelan.'],
    ['\\overline{\\overline{A} + B}', ['A\\cdot\\overline{B}', '\\overline{A}\\cdot B', 'A + \\overline{B}', '\\overline{A}\\cdot\\overline{B}'], 'De Morgan: Ā negada da A y + pasa a ·: A·B̄.'],
    ['A + A\\cdot B', ['A', 'B', 'A\\cdot B', '1'], 'Absorción: A·(1 + B) = A.'],
    ['A\\cdot(A + B)', ['A', 'A\\cdot B', 'A + B', 'B'], 'Absorción: A + A·B = A.'],
    ['\\overline{A\\cdot B\\cdot C}', ['\\overline{A} + \\overline{B} + \\overline{C}', '\\overline{A}\\cdot\\overline{B}\\cdot\\overline{C}', 'A + B + C', '\\overline{A + B + C}'], 'De Morgan: negar un producto es sumar las negaciones.'],
    ['\\overline{A + B + C}', ['\\overline{A}\\cdot\\overline{B}\\cdot\\overline{C}', '\\overline{A} + \\overline{B} + \\overline{C}', 'A\\cdot B\\cdot C', '\\overline{A\\cdot B\\cdot C}'], 'De Morgan: negar una suma es multiplicar las negaciones.'],
    ['\\overline{A + B}', ['\\overline{A}\\cdot\\overline{B}', '\\overline{A} + \\overline{B}', 'A\\cdot B', '\\overline{A}\\cdot B'], 'De Morgan: se rompe la barra y + pasa a ·.'],
    ['\\overline{A\\cdot B}', ['\\overline{A} + \\overline{B}', '\\overline{A}\\cdot\\overline{B}', 'A + B', 'A\\cdot B'], 'De Morgan: se rompe la barra y · pasa a +.'],
    ['A\\cdot B + \\overline{A}\\cdot B', ['B', 'A', '1', 'A\\cdot B'], 'Factor común: B·(A + Ā) = B.'],
    ['A\\cdot B\\cdot C + A\\cdot B\\cdot\\overline{C}', ['A\\cdot B', 'A\\cdot B\\cdot C', 'C', 'A + B'], 'Factor común: A·B·(C + C̄) = A·B.'],
    ['\\overline{A}\\cdot\\overline{B} + \\overline{A}\\cdot B', ['\\overline{A}', '\\overline{B}', '1', '\\overline{A}\\cdot B'], 'Factor común: Ā·(B̄ + B) = Ā.'],
    ['A\\cdot B + A\\cdot B\\cdot C', ['A\\cdot B', 'A\\cdot B\\cdot C', 'C', 'A + C'], 'Absorción: A·B·(1 + C) = A·B.']
  ];
  const DM = [4, 5, 8, 9, 10, 11]; // las de De Morgan
  P.p2 = {
    titulo: 'Álgebra de Boole y De Morgan', max: 15,
    gen(r) {
      const dm = RC.mezclar(r, DM)[0];
      const resto = RC.mezclar(r, BOOLE.map((_, i) => i).filter((i) => !DM.includes(i))).slice(0, 2);
      return { q: RC.mezclar(r, [dm].concat(resto)) };
    },
    enunciado: () => '<p>Simplifica cada expresión y elige la forma más simple que es igual a ella. Hazlo en tu hoja auxiliar.</p>',
    pasos: (d) => [{ t: 'Simplifica', tex: null, items: [0, 1, 2].map((i) => ({ id: 's' + (i + 1), et: (d && d.q ? BOOLE[d.q[i]][0] : 'X') + ' =', pts: 5, tipo: 'op' })) }],
    ops: (d, id) => BOOLE[d.q[+id.slice(1) - 1]][1].map((t) => ({ t })),
    esperado: () => ({}),
    final: (d) => d.q.map((i, j) => `<p><b>${j + 1})</b> ${M(BOOLE[i][0] + ' = ' + BOOLE[i][1][0])}. ${BOOLE[i][2]}</p>`)
  };

  // ===== P3: circuito → tabla → función → NAND =====
  P.p3 = {
    titulo: 'Circuito, tabla y NAND', max: 20,
    gen(r) {
      for (let t = 0; t < 500; t++) {
        const pu = [], ids = [];
        while (pu.length < 2) {
          const vars = RC.mezclar(r, [0, 1, 2]).slice(0, 2).sort();
          const g = vars.map((v) => 2 * v);
          if (!ids.includes(g.join())) { ids.push(g.join()); pu.push(g); }
        }
        // una sola variable negada (en uno o en los dos términos)
        const vn = elegir(r, [0, 1, 2]);
        let neg = 0;
        pu.forEach((g) => g.forEach((c, i) => { if (c >> 1 === vn && r() < 0.75) { g[i] = c | 1; neg++; } }));
        if (!neg) continue;
        const f = evalSOP(pu, 3), u = f.filter(Boolean).length;
        if (u < 2 || u > 6) continue;
        const sol = K.resolver(3, f);
        if (sol.cubos.length !== 2 || K.lits(sol.cubos) !== 4) continue; // la suma dada ya es mínima
        const dis = distractores(r, pu, f, 3, 3);
        if (dis.length < 3) continue;
        return { pu, f, dis, nneg: 1 };
      }
      return null;
    },
    enunciado: (d) => `<p>Analiza este circuito:</p><div class="pd-circ">${CI.svg(3, d.pu, N3, { mono: true, salida: 'Y' })}</div>`,
    pasos: (d) => [
      { t: 'a) Tabla de verdad (escribe 0 o 1)', tex: null, items: Array.from({ length: 8 }, (_, m) => ({ id: 'y' + m, h: 'A B C = ' + bin(m, 3) + ' → Y', pts: 1, tol: EX })) },
      { t: 'b) Función', nota: '¿Qué función implementa el circuito?', tex: null, items: [{ id: 'fn', et: 'Y =', pts: 6, tipo: 'op' }] },
      { t: 'c) Solo con NAND', nota: 'Si armas este mismo circuito solo con NAND de 2 entradas (método NAND → NAND; cada inversor es una NAND con sus entradas unidas), ¿cuántas compuertas NAND hacen falta?', tex: null,
        items: [{ id: 'nn', h: 'Cantidad de NAND', pts: 6, tol: EX }] }
    ],
    ops: (d) => [d.pu].concat(d.dis).map((p) => ({ t: sopT(p, N3) })),
    esperado: (d) => { const e = { nn: [3 + d.nneg] }; d.f.forEach((v, m) => { e['y' + m] = [v]; }); return e; },
    final: (d) => [
      `<div class="pd-fig">${K.tablaHTML(3, d.f, { salida: 'Y' })}</div>`,
      `Y = ${sopT(d.pu, N3)}`,
      `<p>Solo con NAND: una NAND por cada producto (2), una NAND como inversor para la variable negada (1) y la NAND de salida (1): <b>${3 + d.nneg} compuertas</b>.</p>`]
  };

  // ===== P4: diseño de una aplicación =====
  const APL = [
    { t: 'Ascensor', v: [['P', 'puerta cerrada'], ['S', 'sobrepeso'], ['B', 'botón de piso presionado']], y: 'el motor arranca',
      regla: 'El motor arranca si la puerta está cerrada, no hay sobrepeso y alguien presionó un piso.', f: (a, b, c) => a && !b && c },
    { t: 'Riego automático', v: [['H', 'suelo húmedo'], ['L', 'está lloviendo'], ['T', 'tanque con agua']], y: 'la bomba riega',
      regla: 'La bomba riega si el suelo no está húmedo, no llueve y el tanque tiene agua.', f: (a, b, c) => !a && !b && c },
    { t: 'Ventilador de invernadero', v: [['T', 'temperatura alta'], ['H', 'humedad alta'], ['N', 'es de noche']], y: 'el ventilador se enciende',
      regla: 'El ventilador se enciende si la temperatura es alta, o si hay humedad alta y no es de noche.', f: (a, b, c) => a || (b && !c) },
    { t: 'Control de calidad', v: [['A', 'tamaño correcto'], ['B', 'color correcto'], ['P', 'hay pieza en el sensor']], y: 'el pistón expulsa la pieza',
      regla: 'El pistón expulsa la pieza si hay una pieza en el sensor y su tamaño no es correcto o su color no es correcto.', f: (a, b, c) => c && (!a || !b) },
    { t: 'Portón eléctrico', v: [['R', 'control remoto presionado'], ['O', 'obstáculo detectado'], ['F', 'portón ya abierto']], y: 'el motor abre el portón',
      regla: 'El motor abre si se presiona el control remoto, no hay obstáculo y el portón no está ya abierto.', f: (a, b, c) => a && !b && !c },
    { t: 'Luz del pasillo', v: [['I', 'interruptor manual activado'], ['M', 'movimiento detectado'], ['O', 'está oscuro']], y: 'la luz se enciende',
      regla: 'La luz se enciende si el interruptor manual está activado, o si hay movimiento y está oscuro.', f: (a, b, c) => a || (b && c) },
    { t: 'Votación de detectores de gas', v: [['A', 'detector A activado'], ['B', 'detector B activado'], ['C', 'detector C activado']], y: 'la válvula se cierra',
      regla: 'La válvula se cierra si al menos dos de los tres detectores están activados.', f: (a, b, c) => (a && b) || (a && c) || (b && c) },
    { t: 'Horno de microondas', v: [['P', 'puerta cerrada'], ['T', 'temporizador corriendo'], ['C', 'botón cancelar presionado']], y: 'el magnetrón calienta',
      regla: 'El magnetrón calienta si la puerta está cerrada, el temporizador corre y no se presiona cancelar.', f: (a, b, c) => a && b && !c },
    { t: 'Alarma de puerta', v: [['A', 'alarma activada'], ['P', 'puerta abierta'], ['V', 'ventana abierta']], y: 'suena la sirena',
      regla: 'La sirena suena si la alarma está activada y la puerta o la ventana están abiertas.', f: (a, b, c) => a && (b || c) },
    { t: 'Bomba de pozo', v: [['N', 'nivel del tanque bajo'], ['P', 'agua en el pozo'], ['M', 'modo manual activado']], y: 'la bomba arranca',
      regla: 'La bomba arranca si hay agua en el pozo y el nivel del tanque está bajo o el modo manual está activado.', f: (a, b, c) => b && (a || c) }
  ];
  P.p4 = {
    titulo: 'Diseño de una aplicación', max: 15,
    gen(r) {
      for (let t = 0; t < 50; t++) {
        const k = Math.floor(r() * APL.length), A = APL[k];
        const f = Array.from({ length: 8 }, (_, m) => (A.f(!!(m & 4), !!(m & 2), !!(m & 1)) ? 1 : 0));
        const n = A.v.map((x) => x[0]);
        const mi = deCubos(3, K.resolver(3, f).cubos), dis = distractores(r, mi, f, 3, 3);
        if (dis.length === 3) return { k, f, n, mi, dis };
      }
      return null;
    },
    enunciado: (d) => { const A = APL[d.k]; return `<p><b>${A.t}.</b> ${A.regla}</p><ul class="pm-datos">${A.v.map((x) => `<li><b>${x[0]}</b> = 1 si ${x[1]}</li>`).join('')}<li><b>Y</b> = 1 si ${A.y}</li></ul><p>Arma la tabla de verdad (en orden ${d.n.join(' ')}) y después, con el mapa de Karnaugh en tu hoja, elige la expresión mínima.</p>`; },
    pasos: (d) => [
      { t: 'a) Tabla de verdad (escribe 0 o 1)', tex: null, items: Array.from({ length: 8 }, (_, m) => ({ id: 'y' + m, h: (d && d.n ? d.n.join(' ') : 'A B C') + ' = ' + bin(m, 3) + ' → Y', pts: 1, tol: EX })) },
      { t: 'b) Expresión mínima', tex: null, items: [{ id: 'mi', et: 'Y =', pts: 7, tipo: 'op' }] }
    ],
    ops: (d) => [d.mi].concat(d.dis).map((p) => ({ t: sopT(p, d.n) })),
    esperado: (d) => { const e = {}; d.f.forEach((v, m) => { e['y' + m] = [v]; }); return e; },
    final: (d) => [`<div class="pd-fig">${K.tablaHTML(3, d.f, { nombres: d.n, salida: 'Y' })}</div>`, `<div class="pd-fig">${K.estatico(3, d.f, { nombres: d.n, grupos: K.resolver(3, d.f).cubos })}</div>`, `Y = ${sopT(d.mi, d.n)}`]
  };

  // ===== P5: mapa de Karnaugh de 4 variables con X =====
  P.p5 = {
    titulo: 'Mapa de Karnaugh con X', max: 20,
    gen(r) {
      for (let t = 0; t < 3000; t++) {
        const f = Array(16).fill(0);
        const nc = 2 + (r() < 0.45 ? 1 : 0);
        for (let j = 0; j < nc; j++) {
          const fijas = r() < 0.6 ? 2 : 3, vars = RC.mezclar(r, [0, 1, 2, 3]).slice(0, fijas);
          let mask = 0, val = 0;
          vars.forEach((v) => { const b = 1 << (3 - v); mask |= b; if (r() < 0.5) val |= b; });
          for (let m = 0; m < 16; m++) if ((m & mask) === val) f[m] = 1;
        }
        const unosM = f.map((v, m) => (v ? m : -1)).filter((m) => m >= 0);
        if (unosM.length < 5 || unosM.length > 10) continue;
        // 2 o 3 celdas de los unos pasan a X (no importa)
        RC.mezclar(r, unosM).slice(0, 2 + (r() < 0.5 ? 1 : 0)).forEach((m) => { f[m] = 2; });
        const conX = K.resolver(4, f), sinX = K.resolver(4, f.map((v) => (v === 2 ? 0 : v)));
        if (!f.includes(1)) continue;
        if (conX.cubos.length < 2 || conX.cubos.length > 3) continue;
        if (K.lits(conX.cubos) >= K.lits(sinX.cubos)) continue; // las X tienen que servir
        const mi = deCubos(4, conX.cubos), dis = distractores(r, mi, f, 4, 3);
        if (dis.length < 3) continue;
        return { f, mi, dis, nt: conX.cubos.length, nl: K.lits(conX.cubos) };
      }
      return null;
    },
    enunciado: (d) => `<p>Simplifica este mapa de Karnaugh. Las <b>X</b> son condiciones que no importan.</p><div class="pd-fig">${K.estatico(4, d.f, {})}</div>`,
    pasos: () => [
      { t: 'a) Expresión mínima', tex: null, items: [{ id: 'mi', et: 'F =', pts: 12, tipo: 'op' }] },
      { t: 'b) Cuenta', tex: null, items: [{ id: 'nt', h: 'Cantidad de términos (grupos)', pts: 4, tol: EX }, { id: 'nl', h: 'Cantidad total de literales', pts: 4, tol: EX }] }
    ],
    ops: (d) => [d.mi].concat(d.dis).map((p) => ({ t: sopT(p, N4) })),
    esperado: (d) => ({ nt: [d.nt], nl: [d.nl] }),
    final: (d) => [`<div class="pd-fig">${K.estatico(4, d.f, { grupos: K.resolver(4, d.f).cubos })}</div>`, `F = ${sopT(d.mi, N4)}`,
      `<p>${d.nt} grupos y ${d.nl} literales. Las X se toman como 1 solo donde agrandan un grupo.</p>`]
  };

  // ===== P6: XOR y paridad =====
  const xorDe = (s) => s.split('').reduce((a, c) => a ^ +c, 0);
  P.p6 = {
    titulo: 'XOR y paridad', max: 15,
    gen(r) {
      const dato = (n) => Array.from({ length: n }, () => (r() < 0.5 ? '1' : '0')).join('');
      const x5 = dato(5), d7 = dato(7);
      const s3 = dato(7), envio = s3 + xorDe(s3), nErr = elegir(r, [0, 1, 1, 2]);
      const ll = envio.split('');
      RC.mezclar(r, [0, 1, 2, 3, 4, 5, 6, 7]).slice(0, nErr).forEach((i) => { ll[i] = ll[i] === '1' ? '0' : '1'; });
      return { x5, d7, llega: ll.join(''), nErr };
    },
    enunciado: (d) => `<ol class="pd-lista" type="a">
      <li>Calcula ${M(d.x5.split('').join(' \\oplus '))}.</li>
      <li>Paridad <b>par</b>. ¿Qué bit de paridad P se agrega al dato ${bits(d.d7)}?</li>
      <li>Paridad <b>par</b>. Llegó el dato ${bits(d.llega.slice(0, 7))} con el bit de paridad P = ${d.llega[7]}. ¿Cuánto vale la salida E del comprobador?</li>
      <li>Con un solo bit de paridad, ¿qué errores detecta siempre el receptor?</li></ol>`,
    pasos: () => [
      { t: 'Respuestas (escribe 0 o 1)', tex: null, items: [{ id: 'x', h: 'a) Resultado de la XOR', pts: 4, tol: EX }, { id: 'p', h: 'b) Bit de paridad P', pts: 4, tol: EX }, { id: 'e', h: 'c) Salida E del comprobador', pts: 4, tol: EX }] },
      { t: 'd) Elige', tex: null, items: [{ id: 'op', h: 'Detecta siempre', pts: 3, tipo: 'op' }] }
    ],
    ops: () => [{ h: 'Una cantidad impar de bits dañados (1, 3, 5…)' }, { h: 'Cualquier cantidad de bits dañados' }, { h: 'Solo cuando fallan 2 bits' }, { h: 'Ninguno: solo los corrige' }],
    esperado: (d) => ({ x: [xorDe(d.x5)], p: [xorDe(d.d7)], e: [xorDe(d.llega)] }),
    final: (d) => [
      `<p><b>a)</b> La XOR vale 1 si la cantidad de unos es impar: hay ${unos(d.x5)} unos → <b>${xorDe(d.x5)}</b>.</p>`,
      `<p><b>b)</b> El dato tiene ${unos(d.d7)} unos; con paridad par el total debe quedar par: P = <b>${xorDe(d.d7)}</b>.</p>`,
      `<p><b>c)</b> E es la XOR de todo lo recibido (datos y P): llegaron ${unos(d.llega)} unos → E = <b>${xorDe(d.llega)}</b>.${d.nErr === 2 ? ' En realidad fallaron 2 bits: se tapan y la paridad no lo detecta.' : d.nErr === 1 ? ' En realidad falló 1 bit.' : ' Llegó bien.'}</p>`,
      `<p><b>d)</b> Cada bit dañado cambia la paridad: detecta 1, 3, 5… errores; con 2 o 4 los cambios se tapan.</p>`]
  };

  RC.P = P;
  RC.PROB = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
  RC.MAX = Object.fromEntries(RC.PROB.map((k) => [k, P[k].max]));
  RC.TITULO = Object.fromEntries(RC.PROB.map((k, i) => [k, 'P' + (i + 1)]));
  RC.NOMBRE = Object.fromEntries(RC.PROB.map((k) => [k, P[k].titulo]));

  // datos de un problema para un carnet
  const cache = {};
  RC.datos = (k, carnet) => {
    const clave = k + '|' + carnet;
    if (cache[clave]) return cache[clave];
    let d = null;
    for (let i = 0; !d && i < 20; i++) d = P[k].gen(RC.rng(String(carnet) + '|d1-ex1|' + k + (i ? '|' + i : '')));
    d.prob = k;
    d.op = {};
    P[k].pasos(d).forEach((ps) => ps.items.forEach((it) => {
      if (it.tipo !== 'op') return;
      const lista = P[k].ops(d, it.id).map((o, i) => ({ ...o, ok: i === 0 }));
      d.op[it.id] = RC.mezclar(RC.rng(String(carnet) + '|d1-ex1|' + k + '|' + it.id), lista);
    }));
    cache[clave] = d;
    return d;
  };
  RC.items = (k, d) => P[k].pasos(d).reduce((a, ps) => a.concat(ps.items), []);
  RC.casillas = (k) => P[k].pasos({}).reduce((s, ps) => s + ps.items.length, 0);
  RC.TOTAL_CASILLAS = RC.PROB.reduce((s, k) => s + RC.casillas(k), 0);

  RC.calificar = (k, d, vals) => {
    vals = vals || {};
    const items = RC.items(k, d);
    const esp = P[k].esperado(d);
    const cel = {};
    let pts = 0;
    items.forEach((it) => {
      const v = vals[it.id];
      let r;
      if (it.tipo === 'op') {
        const ok = d.op[it.id].findIndex((o) => o.ok);
        r = v == null || v === '' ? 'vacio' : Number(v) === ok ? 'ok' : 'mal';
        cel[it.id] = { r, exp: ok, pts: r === 'ok' ? it.pts : 0, max: it.pts };
      } else {
        const lista = [].concat(esp[it.id]);
        const q = RC.leer(v);
        r = q.vacio ? 'vacio' : q.invalido ? 'mal' : lista.some((e) => RC.cerca(q.v, e, it.tol)) ? 'ok' : 'mal';
        cel[it.id] = { r, exp: lista[0], pts: r === 'ok' ? it.pts : 0, max: it.pts };
      }
      pts += cel[it.id].pts;
    });
    return { pts: Math.round(pts * 100) / 100, max: RC.MAX[k], cel };
  };

  RC.nota = (carnet, est) => {
    const res = {};
    let total = 0;
    RC.PROB.forEach((k) => { res[k] = RC.calificar(k, RC.datos(k, carnet), (est && est[k] && est[k].vals) || {}); total += res[k].pts; });
    return { total: Math.round(total * 100) / 100, res };
  };

  RC.avance = (est) => {
    let n = 0;
    RC.PROB.forEach((k) => { const v = (est && est[k] && est[k].vals) || {}; n += Object.keys(v).filter((id) => v[id] !== '' && v[id] != null).length; });
    return Math.round((100 * n) / RC.TOTAL_CASILLAS);
  };

  RC.firma = (est) => {
    const s = JSON.stringify(RC.PROB.map((k) => (est && est[k] && est[k].vals) || {}));
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  };
})();
