// ============================================================
// Medidas Eléctricas · Examen de laboratorio por celular (19/11/2026) — preguntas y calificación
// Banco aprobado por el docente el 19/11 (documento «Examen de laboratorio de Medidas Eléctricas: banco de preguntas»).
// Mismo espacio RC que el 2.º parcial (medidas/parcial2/js/pm-motor.js); aquí cada «problema» es una parte (A–E)
// y cada paso es una pregunta con su diagrama (RC.FIG, en lm-figuras.js).
// Tipos de casilla:
//   num  → número con coma o punto; ±2 % (FP ±0,01; ángulos ±0,5°; pasos exacto); con los números del propio estudiante
//   op   → una opción (la correcta va primero en ops() y se mezcla por carnet)
//   ord  → ordenar pasos (se mezclan por carnet); puntaje parcial por pasos en su lugar (vale el mejor de los órdenes aceptados)
//   raz  → razonamiento escrito; lo califica el docente con criterios de 1 punto (rev[clave] = { c: [true, false…], com })
// Con formulario propio en papel: los enunciados no traen fórmulas.
// ============================================================
(function () {
  const RC = (window.RC = window.RC || {});
  const PI = Math.PI, R3 = Math.sqrt(3), GRAD = 180 / PI;

  // ---------- azar reproducible por carnet ----------
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  RC.rng = (semilla) => {
    let a = hash(String(semilla));
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  const elegir = (r, arr) => arr[Math.floor(r() * arr.length)];
  const entre = (r, a, b, paso) => Math.round((a + paso * Math.floor(r() * (Math.round((b - a) / paso) + 1))) * 1e6) / 1e6;
  RC.mezclar = (r, arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------- lo que escribe el estudiante ----------
  RC.leer = (s) => {
    if (s == null) return { vacio: true };
    const t = String(s).trim().replace(/\s+/g, '').replace(/[−–—‒]/g, '-').replace(/^\+/, '').replace(/,/g, '.');
    if (t === '') return { vacio: true };
    if (/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return { v: Number(t) || 0 };
    return { invalido: true };
  };
  RC.cerca = (v, e, tol) => {
    const rel = tol && tol.rel != null ? tol.rel : 0.02, abs = tol && tol.abs != null ? tol.abs : 0.01;
    return isFinite(v) && isFinite(e) && Math.abs(v - e) <= Math.max(rel * Math.abs(e), abs) + 1e-9;
  };
  const TOL_FP = { rel: 0, abs: 0.01 };
  const TOL_ENT = { rel: 0, abs: 0.01 };

  // ---------- números para mostrar ----------
  const decs = (x) => { const a = Math.abs(x); if (!isFinite(a) || a === 0) return 0; return Math.max(0, Math.min(4, 3 - Math.floor(Math.log10(a)))); };
  const redo = (x, d) => { const v = Math.round(x * 10 ** d) / 10 ** d; return Object.is(v, -0) ? 0 : v; };
  RC.txt = (x, d) => String(redo(x, d == null ? decs(x) : d)).replace('.', ',').replace('-', '−');
  RC.tex = (x, d) => String(redo(x, d == null ? decs(x) : d)).replace('.', '{,}');
  const tx = RC.tex, ht = RC.txt;
  const nh = (x) => String(x).replace('.', '{,}');
  const hh = (x) => String(x).replace('.', ',');
  RC.opTxt = (o) => (o.h != null ? o.h : '\\(' + o.t + '\\)');
  RC.etTxt = (it) => (it.h != null ? it.h : '\\(' + it.et + '\\)');
  const M = (s) => '\\(' + s + '\\)';
  const UNI = { 'Ω': '\\Omega', 'Ω·m': '\\Omega\\cdot\\text{m}', 'µF': '\\mu\\text{F}', 'kΩ': '\\text{k}\\Omega', 'mΩ': '\\text{m}\\Omega', 'kΩ/V': '\\text{k}\\Omega/\\text{V}' };
  const u_ = (s) => '\\ ' + (UNI[s] || '\\text{' + s + '}');
  const datos = (lista) => '<ul class="pm-datos">' + lista.map((x) => '<li>' + x + '</li>').join('') + '</ul>';
  const dos = (propio, exacto) => (isFinite(propio) ? [propio, exacto] : [exacto]);
  const usar = (u, id, exacto) => { const v = u(id); return v == null || !isFinite(v) ? exacto : v; };
  const acosS = (x) => Math.acos(Math.max(-1, Math.min(1, x)));
  const ops = (lista) => lista.map((h) => ({ h }));
  const fig = (k, d) => (RC.FIG && RC.FIG[k] ? RC.FIG[k](d) : '');

  const P = {};

  // ======================= Parte A: multímetro y amperímetro (22) =======================
  P.A = {
    titulo: 'Multímetro y amperímetro', max: 22,
    gen(r) {
      const d = {};
      d.a1 = { P: entre(r, 3500, 5500, 100), V: 220 };
      d.a2 = { R1: entre(r, 20, 60, 2), R2: entre(r, 30, 100, 5) };
      d.a3 = { Im: elegir(r, [0.5, 1, 2, 5]), Rm: entre(r, 20, 200, 5), I: elegir(r, [1, 2, 5, 10]) };
      const E = elegir(r, [10, 12, 15, 18, 20, 24]);
      d.a4 = { E, R: elegir(r, [47, 68, 100, 150, 220]), S: 20, esc: E / 2 <= 10 ? 10 : 30 };
      d.a5 = { I: entre(r, 5, 15, 0.5) };
      return d;
    },
    enunciado: () => '<p>Cinco situaciones de taller. En cada una, mira primero el diagrama y después responde debajo.</p>',
    pasos: (d) => {
      d = d && d.a1 ? d : null;
      return [
        { q: 'a1', t: 'A1. La ducha y el amperímetro', fig: d ? () => fig('a1', d) : '',
          nota: d ? `Un técnico quiere saber cuánta corriente consume una ducha eléctrica de ${M(hh(d.a1.P) + u_('W'))} a ${M('220' + u_('V'))}. Pone la perilla del multímetro en «10 A», la punta roja en el borne «10 A» y toca con las dos puntas los agujeros del tomacorriente donde está enchufada la ducha.` : '',
          items: [
            { id: 'a1op', h: '¿Qué pasa al tocar los agujeros del tomacorriente?', pts: 2, tipo: 'op' },
            { id: 'a1I', h: 'Corriente que consume tu ducha (A)', pts: 2 },
            { id: 'a1raz', h: 'Explica cómo medirías bien la corriente de <b>tu</b> ducha, paso a paso.', pts: 3, tipo: 'raz',
              crit: ['Conectar en serie con la ducha (abrir el circuito) o usar una pinza amperimétrica', 'Desenergizar antes de conectar y energizar después', 'Su ducha consume más de 10 A: la entrada de 10 A no alcanza, hay que usar pinza'] }
          ],
          sol: d ? [`I = \\dfrac{P}{V} = \\dfrac{${hh(d.a1.P)}}{220} = ${tx(d.a1.P / 220)}${u_('A')}`, 'Las puntas en la entrada de corriente tienen casi 0 Ω: tocar el tomacorriente es un cortocircuito y se funde el fusible.', `Con ${ht(d.a1.P / 220)} A, ni en serie alcanza la entrada de 10 A: se mide con pinza amperimétrica.`] : [] },
        { q: 'a2', t: 'A2. El óhmetro en la placa', fig: d ? () => fig('a2', d) : '',
          nota: d ? `Hay que comprobar la resistencia calefactora ${M('R_1 = ' + d.a2.R1 + u_('Ω'))} de una placa. Está soldada en paralelo con otra resistencia ${M('R_2 = ' + d.a2.R2 + u_('Ω'))}. El técnico pone el multímetro en Ω y toca los extremos de ${M('R_1')}.` : '',
          items: [
            { id: 'a2op', h: 'El técnico mide con la placa enchufada a la red. ¿Qué pasa?', pts: 2, tipo: 'op' },
            { id: 'a2R', h: 'Ya desenchufada, ¿qué marca el multímetro? (Ω)', pts: 2 }
          ],
          sol: d ? [`R = \\dfrac{R_1\\cdot R_2}{R_1 + R_2} = ${tx((d.a2.R1 * d.a2.R2) / (d.a2.R1 + d.a2.R2))}${u_('Ω')}`, 'El óhmetro mide con su propia corriente: con la placa enchufada la lectura no sirve y el instrumento puede dañarse. Desenchufada, mide también la resistencia que está en paralelo.'] : [] },
        { q: 'a3', t: 'A3. Agrandar el rango del amperímetro', fig: d ? () => fig('a3', d) : '',
          nota: d ? `Un miliamperímetro de cuadro móvil marca su fondo de escala con ${M('I_m = ' + nh(d.a3.Im) + u_('mA'))} y su bobina tiene ${M('R_m = ' + d.a3.Rm + u_('Ω'))}. Se quiere usar en un tablero para medir hasta ${M('I = ' + d.a3.I + u_('A'))} con un shunt.` : '',
          items: [
            { id: 'a3R', h: 'Resistencia del shunt (mΩ)', pts: 3 },
            { id: 'a3op', h: 'Con la corriente pasando, se suelta un tornillo del shunt y queda abierto. ¿Qué pasa?', pts: 2, tipo: 'op' }
          ],
          sol: d ? [`R_{sh} = \\dfrac{I_m\\cdot R_m}{I - I_m} = ${tx(((d.a3.Im / 1000) * d.a3.Rm) / (d.a3.I - d.a3.Im / 1000) * 1000)}${u_('mΩ')}`, 'Sin el shunt, toda la corriente pasa por la bobina del instrumento y se quema.'] : [] },
        { q: 'a4', t: 'A4. El voltímetro que cambia lo que mide', fig: d ? () => fig('a4', d) : '',
          nota: d ? `Una fuente de ${M(d.a4.E + u_('V'))} alimenta dos resistencias iguales en serie de ${M(d.a4.R + u_('kΩ'))}. Se mide la tensión en ${M('R_2')} con un voltímetro analógico de ${M('20' + u_('kΩ/V'))} en la escala de ${M(d.a4.esc + u_('V'))}.` : '',
          items: [
            { id: 'a4V', h: '¿Qué marca el voltímetro? (V)', pts: 2 },
            { id: 'a4op', h: '¿Con qué instrumento la lectura se acerca más a la tensión real?', pts: 1, tipo: 'op' }
          ],
          sol: d ? (() => { const Rv = d.a4.S * d.a4.esc, Rp = (d.a4.R * Rv) / (d.a4.R + Rv); return [`R_V = 20\\cdot ${d.a4.esc} = ${Rv}${u_('kΩ')};\\; R_2 \\parallel R_V = ${tx(Rp)}${u_('kΩ')}`, `V = ${d.a4.E}\\cdot\\dfrac{${tx(Rp)}}{${d.a4.R} + ${tx(Rp)}} = ${tx((d.a4.E * Rp) / (d.a4.R + Rp))}${u_('V')}`, `La tensión real es ${ht(d.a4.E / 2)} V: el voltímetro, al conectarse, baja la resistencia y cambia lo que mide. Un digital de 10 MΩ casi no carga el circuito.`]; })() : [] },
        { q: 'a5', t: 'A5. La pinza que marca cero', fig: d ? () => fig('a5', d) : '',
          nota: 'Para medir la corriente de un motor monofásico, un estudiante abraza con la pinza amperimétrica el cable entero, con la fase y el neutro juntos dentro de la misma vaina.',
          items: [
            { id: 'a5op', h: '¿Qué marca la pinza?', pts: 1, tipo: 'op' },
            { id: 'a5raz', h: '¿Por qué marca eso y cómo se mide bien?', pts: 2, tipo: 'raz',
              crit: ['Por los dos conductores van corrientes iguales y opuestas: sus campos se cancelan', 'Hay que abrazar un solo conductor (la fase), separado del cable'] }
          ],
          sol: ['La corriente que va por la fase vuelve por el neutro: sus campos magnéticos se cancelan y la pinza marca casi 0 A. Se abraza un solo conductor.'] }
      ];
    },
    ops: (d, id) => ({
      a1op: ops(['Cortocircuito por el multímetro: se funde su fusible y puede saltar el disyuntor', 'Marca la corriente que consume la ducha', 'Marca 220, la tensión del tomacorriente', 'Marca cero y no pasa nada']),
      a2op: ops(['La lectura no sirve y el multímetro puede dañarse: el óhmetro mide con su propia corriente', 'Marca bien, porque el óhmetro se protege solo', 'Marca el doble del valor real', 'Marca la tensión de la red']),
      a3op: ops(['Toda la corriente pasa por la bobina del instrumento y se quema', 'Marca cero y no se daña', 'Marca la mitad de la corriente', 'No pasa nada: el shunt solo protege']),
      a4op: ops(['Un multímetro digital de 10 MΩ', 'El mismo voltímetro en una escala menor', 'Un amperímetro en serie', 'Ninguno: todos marcan lo mismo']),
      a5op: ops(['Casi 0 A', 'La corriente del motor', 'El doble de la corriente del motor', 'La tensión de la red'])
    })[id],
    esperado(d) {
      const Rv = d.a4.S * d.a4.esc, Rp = (d.a4.R * Rv) / (d.a4.R + Rv);
      return {
        a1I: [d.a1.P / 220],
        a2R: [(d.a2.R1 * d.a2.R2) / (d.a2.R1 + d.a2.R2)],
        a3R: [(((d.a3.Im / 1000) * d.a3.Rm) / (d.a3.I - d.a3.Im / 1000)) * 1000],
        a4V: [(d.a4.E * Rp) / (d.a4.R + Rp)]
      };
    },
    ref: (d, id) => ({
      a1raz: `Su ducha: ${hh(d.a1.P)} W → ${ht(d.a1.P / 220)} A (más de 10 A).`,
      a5raz: 'Corrientes iguales y opuestas; abrazar solo la fase.'
    })[id]
  };

  // ======================= Parte B: vatímetro (18) =======================
  P.B = {
    titulo: 'Vatímetro', max: 18,
    gen(r) {
      const d = {};
      for (;;) {
        const In = elegir(r, [1, 2.5, 5]), fp = elegir(r, [0.2, 0.25, 0.3, 0.35, 0.4]), ratio = elegir(r, [0.7, 1.25, 1.4, 1.6]);
        const Pw = Math.round((220 * In * ratio * fp) / 10) * 10, I = Pw / (220 * fp);
        if (Pw <= 0 || Math.abs(I / In - 1) < 0.1) continue;
        d.b2 = { In, Vn: 240, V: 220, fp, P: Pw, quema: I > In };
        break;
      }
      const amax = elegir(r, [100, 120, 150]);
      d.b3 = { Vn: elegir(r, [120, 240, 300]), In: elegir(r, [1, 2.5, 5, 10]), cosn: r() < 0.34 ? 0.2 : 1, amax, alfa: Math.round(amax * entre(r, 0.3, 0.9, 0.01)) };
      const chica = r() < 0.5;
      d.b4 = { Rp: elegir(r, [5, 6, 8, 10]), Rc: 0.05, V: 220, chica, carga: chica ? entre(r, 40, 100, 10) : entre(r, 3, 10, 0.5) };
      return d;
    },
    enunciado: () => '<p>Cuatro situaciones sobre cómo se conecta, se lee y se protege un vatímetro.</p>',
    pasos: (d) => {
      d = d && d.b2 ? d : null;
      return [
        { q: 'b1', t: 'B1. El vatímetro conectado al revés', fig: d ? () => fig('b1', d) : '',
          nota: 'Un practicante conecta un vatímetro a una carga monofásica de 220 V, pero intercambia las bobinas: la de corriente queda en paralelo con la carga y la de tensión en serie (mira el diagrama).',
          items: [
            { id: 'b1op', h: '¿Qué pasa al energizar?', pts: 2, tipo: 'op' },
            { id: 'b1ord', h: 'Ordena los pasos para conectarlo bien (toca en orden)', pts: 3, tipo: 'ord',
              pasos: ['Desenergizar el circuito y comprobar que no hay tensión', 'Conectar la bobina de corriente en serie con la carga', 'Conectar la bobina de tensión en paralelo con la carga', 'Revisar que los bornes marcados (±) de las dos bobinas estén del lado de la fuente', 'Energizar y leer'],
              alt: [[0, 2, 1, 3, 4]] }
          ],
          sol: ['La bobina de corriente tiene muy poca resistencia: en paralelo con la red es un cortocircuito y se quema.', 'Orden: desenergizar; bobina de corriente en serie; bobina de tensión en paralelo; bornes ± del lado de la fuente; energizar y leer.'] },
        { q: 'b2', t: 'B2. Marca poco y se quema', fig: d ? () => fig('b2', d) : '',
          nota: d ? `Un vatímetro electrodinámico de ${M(d.b2.Vn + u_('V'))} y ${M(nh(d.b2.In) + u_('A'))} mide un motor que trabaja en vacío: ${M('P = ' + d.b2.P + u_('W'))} con ${M('\\text{FP} = ' + nh(d.b2.fp))}, a ${M('220' + u_('V'))}. La aguja marca menos de la mitad de la escala y el técnico confía en que todo está bien.` : '',
          items: [
            { id: 'b2I', h: 'Corriente del motor (A)', pts: 2 },
            { id: 'b2op', h: '¿Corre peligro la bobina de corriente del vatímetro?', pts: 1, tipo: 'op' },
            { id: 'b2raz', h: '¿Qué harías para medir esta potencia sin dañar el vatímetro?', pts: 3, tipo: 'raz',
              crit: ['Vigilar la corriente con un amperímetro o una pinza, no con la aguja del vatímetro', 'Usar un rango de corriente mayor o un transformador de corriente', 'Usar un vatímetro de bajo FP para que la lectura no quede pequeña'] }
          ],
          sol: d ? [`I = \\dfrac{P}{V\\cdot\\text{FP}} = \\dfrac{${d.b2.P}}{220\\cdot ${nh(d.b2.fp)}} = ${tx(d.b2.P / (220 * d.b2.fp))}${u_('A')}\\ ${d.b2.quema ? '>' : '<'}\\ ${nh(d.b2.In)}${u_('A')}`, 'El vatímetro mide P; la bobina de corriente se calienta con la corriente. Con FP bajo puede pasar la nominal aunque la aguja marque poco.'] : [] },
        { q: 'b3', t: 'B3. Leer el vatímetro analógico', fig: d ? () => fig('b3', d) : '',
          nota: d ? `La placa del vatímetro dice ${M(d.b3.Vn + u_('V'))}; ${M(nh(d.b3.In) + u_('A'))}; ${M('\\cos\\varphi_n = ' + nh(d.b3.cosn))}; escala de ${M(d.b3.amax)} divisiones. La aguja marca ${M(d.b3.alfa)} divisiones.${d.b3.cosn < 1 ? ' Es un vatímetro de bajo FP.' : ''}` : '',
          items: [
            { id: 'b3k', h: 'Constante \\(k\\) (W por división)', pts: 2 },
            { id: 'b3P', h: 'Potencia medida (W)', pts: 2 }
          ],
          sol: d ? [`k = \\dfrac{V_n\\cdot I_n\\cdot\\cos\\varphi_n}{\\alpha_{\\text{máx}}} = ${tx((d.b3.Vn * d.b3.In * d.b3.cosn) / d.b3.amax)}${u_('W/div')}`, `P = k\\cdot\\alpha = ${tx(((d.b3.Vn * d.b3.In * d.b3.cosn) / d.b3.amax) * d.b3.alfa)}${u_('W')}`] : [] },
        { q: 'b4', t: 'B4. ¿Conexión A o conexión B?', fig: d ? () => fig('b4', d) : '',
          nota: d ? `Se va a medir ${d.b4.chica ? `una lámpara de ${M(d.b4.carga + u_('W'))}` : `un motor de ${M(hh(d.b4.carga) + u_('kW'))} con FP 0,8`} a ${M('220' + u_('V'))}. El vatímetro tiene ${M('R_c = 0{,}05' + u_('Ω'))} en la bobina de corriente y ${M('R_p = ' + d.b4.Rp + u_('kΩ'))} en la de tensión. En la conexión A la bobina de tensión va del lado de la fuente; en la B, del lado de la carga.` : '',
          items: [
            { id: 'b4op', h: '¿Qué conexión conviene para esta carga?', pts: 2, tipo: 'op' },
            { id: 'b4E', h: 'Error que agrega la conexión B (W)', pts: 1 }
          ],
          sol: d ? [`\\text{Conexión B: } \\dfrac{V^2}{R_p} = \\dfrac{220^2}{${d.b4.Rp * 1000}} = ${tx((220 * 220) / (d.b4.Rp * 1000))}${u_('W')}`, d.b4.chica ? 'Con una carga pequeña la corriente es baja: el error de la conexión A (I²·Rc) es despreciable. Conviene A.' : 'Con una carga grande el error de la conexión B es pequeño frente a la potencia medida. Conviene B.'] : [] }
      ];
    },
    ops: (d, id) => ({
      b1op: ops(['La bobina de corriente queda en cortocircuito con la red y se quema (o salta la protección)', 'Marca negativo, pero no se daña', 'Marca bien, solo que al revés', 'Marca cero y no se daña']),
      b2op: d.b2.quema ? ops(['Sí: la corriente pasa la nominal aunque la aguja marque poco', 'No: la aguja no llega a la mitad de la escala']) : ops(['No: la corriente es menor que la nominal', 'Sí: con FP bajo el vatímetro siempre se quema']),
      b4op: d.b4.chica ? ops(['Conexión A: la bobina de tensión del lado de la fuente', 'Conexión B: la bobina de tensión del lado de la carga', 'Cualquiera: el error es el mismo']) : ops(['Conexión B: la bobina de tensión del lado de la carga', 'Conexión A: la bobina de tensión del lado de la fuente', 'Cualquiera: el error es el mismo'])
    })[id],
    esperado(d, u) {
      const k = (d.b3.Vn * d.b3.In * d.b3.cosn) / d.b3.amax;
      return { b2I: [d.b2.P / (220 * d.b2.fp)], b3k: [k], b3P: dos(usar(u, 'b3k', k) * d.b3.alfa, k * d.b3.alfa), b4E: [(220 * 220) / (d.b4.Rp * 1000)] };
    },
    ref: (d, id) => ({ b2raz: `Corriente ${ht(d.b2.P / (220 * d.b2.fp))} A frente a In = ${hh(d.b2.In)} A.` })[id]
  };

  // ======================= Parte C: FP, dos vatímetros y corrección (27) =======================
  P.C = {
    titulo: 'FP, dos vatímetros y corrección', max: 27,
    gen(r) {
      const d = {};
      const Pt = entre(r, 3, 12, 0.5), fp = entre(r, 0.3, 0.48, 0.01), Q = Pt * Math.tan(acosS(fp));
      d.c1 = { W1: Math.round(((Pt - Q / R3) / 2) * 100) / 100, W2: Math.round(((Pt + Q / R3) / 2) * 100) / 100 };
      for (;;) {
        const Pkw = entre(r, 50, 150, 5), fp1 = entre(r, 0.65, 0.82, 0.01), Qp = elegir(r, [5, 10, 15]);
        const Qc = Pkw * (Math.tan(acosS(fp1)) - Math.tan(acosS(0.95)));
        const x = Qc / Qp, fr = x - Math.floor(x), n = Math.ceil(x);
        if (fr < 0.12 || fr > 0.88 || n < 2 || n > 15) continue;
        d.c2 = { P: Pkw, fp1, Qp };
        break;
      }
      const Pn = entre(r, 10, 20, 1);
      d.c3 = { P: Pn, Qn: 0.75 * Pn, Qb: elegir(r, [40, 50, 60, 70]) };
      d.c4 = { Pm: elegir(r, [30, 45, 55, 75, 90]), Q0: entre(r, 10, 30, 1) };
      return d;
    },
    enunciado: () => '<p>Lo que más se practicó en el semestre: dos vatímetros, el banco de capacitores y sus errores en la práctica. Cuida las unidades (kVAR, µF, A).</p>',
    pasos: (d) => {
      d = d && d.c1 ? d : null;
      const c3 = d && P.C.c3(d);
      return [
        { q: 'c1', t: 'C1. La aguja hacia atrás', fig: d ? () => fig('c1', d) : '',
          nota: d ? `Con dos vatímetros (conexión Aron) se mide un compresor trifásico equilibrado que trabaja con poca carga. Al energizar, la aguja de ${M('W_1')} se va hacia atrás. El técnico invierte la bobina de tensión de ${M('W_1')} y lee ${M('W_1 = ' + nh(Math.abs(d.c1.W1)) + u_('kW'))} y ${M('W_2 = ' + nh(d.c1.W2) + u_('kW'))}.` : '',
          items: [
            { id: 'c1op', h: '¿Qué indica que la aguja de \\(W_1\\) vaya hacia atrás?', pts: 2, tipo: 'op' },
            { id: 'c1P', h: 'Potencia activa total (kW)', pts: 2 },
            { id: 'c1raz', h: '¿Por qué se resta \\(W_1\\) y cómo obtienes el FP con <b>tus</b> lecturas?', pts: 3, tipo: 'raz',
              crit: ['W1 es negativo: P = W2 + (−W1), por eso se resta', 'Q = √3 · (W2 − W1) con W1 negativo, es decir √3 · (W2 + W1 leído)', 'FP = cos(arctan(Q / P))'] }
          ],
          sol: d ? (() => { const Pt = d.c1.W2 + d.c1.W1, Q = R3 * (d.c1.W2 - d.c1.W1); return [`P = W_2 + W_1 = ${nh(d.c1.W2)} + (${tx(d.c1.W1)}) = ${tx(Pt)}${u_('kW')}`, `Q = \\sqrt3\\cdot(W_2 - W_1) = ${tx(Q)}${u_('kVAR')}`, `\\text{FP} = \\cos\\left(\\arctan\\dfrac{Q}{P}\\right) = ${tx(Math.cos(Math.atan(Q / Pt)), 3)}`, 'Una aguja hacia atrás en dos vatímetros indica FP menor que 0,5.']; })() : [] },
        { q: 'c2', t: 'C2. El banco de capacitores de la planta', fig: d ? () => fig('c2', d) : '',
          nota: d ? `Una planta de ${M(d.c2.P + u_('kW'))} con ${M('\\text{FP} = ' + nh(d.c2.fp1))} quiere llegar a ${M('0{,}95')} con un banco automático en triángulo de pasos de ${M(d.c2.Qp + u_('kVAR'))}, a ${M('380' + u_('V') + ';\\;50' + u_('Hz'))}. Instala el menor número de pasos que alcance 0,95. Los µF y la corriente se piden para el <b>banco instalado</b>.` : '',
          items: [
            { id: 'c2Qc', h: '\\(Q_c\\) necesaria (kVAR)', pts: 2 },
            { id: 'c2n', h: 'Número de pasos que instalas', pts: 2, tol: TOL_ENT },
            { id: 'c2C', h: 'Capacidad por fase en triángulo (µF)', pts: 2 },
            { id: 'c2Ic', h: 'Corriente de línea del banco (A)', pts: 2 },
            { id: 'c2raz', h: 'Escribe el procedimiento para pasar de kVAR a µF por fase <b>con tus datos</b>.', pts: 3, tipo: 'raz',
              crit: ['Divide los kVAR del banco entre las 3 fases', 'En triángulo cada capacitor ve la tensión de línea: Xc = V² / Q por fase', 'C = 1 / (2π · f · Xc) y lo pasa a µF'] }
          ],
          sol: d ? (() => { const e = P.C.c2(d); return [`Q_c = P\\cdot(\\tan\\varphi_1 - \\tan\\varphi_2) = ${tx(e.Qc)}${u_('kVAR')}`, `n = ${tx(e.Qc / d.c2.Qp, 2)} \\to ${e.n}\\text{ pasos} = ${e.n * d.c2.Qp}${u_('kVAR')}`, `C_\\Delta = \\dfrac{Q}{3\\cdot 2\\pi f\\cdot V^2} = ${tx(e.C)}${u_('µF')}`, `I_c = \\dfrac{Q}{\\sqrt3\\cdot V} = ${tx(e.Ic)}${u_('A')}`]; })() : [] },
        { q: 'c3', t: 'C3. El banco fijo de noche', fig: d ? () => fig('c3', d) : '',
          nota: d ? `En una planta, un electricista dejó conectados ${M(d.c3.Qb + u_('kVAR'))} fijos, sin regulador. De noche solo funcionan las cámaras de frío: ${M(d.c3.P + u_('kW'))} con FP 0,80 (${M(nh(d.c3.Qn) + u_('kVAR'))}). El cosfímetro del tablero marca «${ht(c3.fp, 2)} cap».` : '',
          items: [
            { id: 'c3op', h: '¿Qué está pasando de noche?', pts: 2, tipo: 'op' },
            { id: 'c3raz', h: '¿Qué le recomiendas al gerente y por qué? Usa <b>tus</b> números.', pts: 3, tipo: 'raz',
              crit: ['Banco automático por pasos, o desconectar pasos de noche', 'Usa sus números: Q neta = Q del banco − Q de la carga, y la corriente sube', 'Nombra un riesgo concreto: sobretensión, recargo o daño de equipos'] }
          ],
          sol: d ? [`Q_{\\text{neta}} = ${d.c3.Qb} - ${nh(d.c3.Qn)} = ${tx(d.c3.Qb - d.c3.Qn)}${u_('kVAR')}\\text{ capacitivos}`, `I = ${tx(c3.I0)}${u_('A')}\\text{ sin banco} \\to ${tx(c3.I1)}${u_('A')}\\text{ con el banco fijo}`, 'Sobrecompensación: conviene un banco automático que conecte solo los pasos necesarios.'] : [] },
        { q: 'c4', t: 'C4. El motor poco cargado', fig: d ? () => fig('c4', d) : '',
          nota: d ? `El homogeneizador tiene un motor de ${M(d.c4.Pm + u_('kW'))} que casi siempre trabaja a un tercio de su potencia. Su potencia reactiva en vacío es ${M('Q_0 = ' + d.c4.Q0 + u_('kVAR'))}. Se piensa compensarlo con un capacitor junto al motor.` : '',
          items: [
            { id: 'c4op', h: 'Si el motor trabaja muy por debajo de su potencia, ¿qué le pasa a su FP?', pts: 2, tipo: 'op' },
            { id: 'c4Q', h: 'kVAR máximos del capacitor junto al motor', pts: 2 }
          ],
          sol: d ? [`Q_{\\text{máx}} = 0{,}9\\cdot Q_0 = ${tx(0.9 * d.c4.Q0)}${u_('kVAR')}`, 'Más que eso lo sobrecompensa cuando trabaja en vacío.'] : [] }
      ];
    },
    c2(d, n) {
      const Qc = d.c2.P * (Math.tan(acosS(d.c2.fp1)) - Math.tan(acosS(0.95)));
      n = n == null ? Math.ceil(Qc / d.c2.Qp) : n;
      const Qb = n * d.c2.Qp * 1000;
      return { Qc, n, C: (Qb / (3 * 2 * PI * 50 * 380 * 380)) * 1e6, Ic: Qb / (R3 * 380) };
    },
    c3(d) {
      const S0 = Math.hypot(d.c3.P, d.c3.Qn), S1 = Math.hypot(d.c3.P, d.c3.Qb - d.c3.Qn);
      return { fp: d.c3.P / S1, I0: (S0 * 1000) / (R3 * 380), I1: (S1 * 1000) / (R3 * 380) };
    },
    ops: (d, id) => ({
      c1op: ops(['El FP de la carga es menor que 0,5', 'El vatímetro W1 está dañado', 'Falta una fase', 'La carga es capacitiva']),
      c3op: ops(['Sobrecompensación: el FP es capacitivo, la corriente sube y la tensión puede subir', 'El FP mejoró a 1', 'La corriente de la red baja', 'Nada: los capacitores no consumen']),
      c4op: ops(['Empeora: la Q para magnetizar casi no cambia y la P baja', 'Mejora', 'Queda igual', 'Llega a 1'])
    })[id],
    esperado(d, u) {
      const e = P.C.c2(d);
      const Qcu = usar(u, 'c2Qc', e.Qc), nPropio = Math.ceil(Qcu / d.c2.Qp - 1e-9);
      const nu = usar(u, 'c2n', e.n), b = nu > 0 && nu < 100 ? P.C.c2(d, nu) : { C: NaN, Ic: NaN };
      return { c1P: [d.c1.W2 + d.c1.W1], c2Qc: [e.Qc], c2n: dos(nPropio, e.n), c2C: dos(b.C, e.C), c2Ic: dos(b.Ic, e.Ic), c4Q: [0.9 * d.c4.Q0] };
    },
    ref: (d, id) => {
      if (id === 'c1raz') { const Pt = d.c1.W2 + d.c1.W1, Q = R3 * (d.c1.W2 - d.c1.W1); return `P = ${ht(Pt)} kW; Q = ${ht(Q)} kVAR; FP = ${ht(Math.cos(Math.atan(Q / Pt)), 3)}.`; }
      if (id === 'c2raz') { const e = P.C.c2(d); return `${e.n} pasos = ${e.n * d.c2.Qp} kVAR → ${ht(e.C)} µF por fase.`; }
      if (id === 'c3raz') { const c = P.C.c3(d); return `Q neta ${ht(d.c3.Qb - d.c3.Qn)} kVAR cap; corriente ${ht(c.I0)} A → ${ht(c.I1)} A.`; }
      return '';
    }
  };

  // ======================= Parte D: energía, factura y armónicos (13) =======================
  P.D = {
    titulo: 'Energía, factura y armónicos', max: 13,
    gen(r) {
      const kWh = entre(r, 6000, 30000, 500), fpf = entre(r, 0.7, 0.83, 0.01);
      const kVARh = Math.round((kWh * Math.tan(acosS(fpf))) / 10) * 10;
      const cargo = Math.round((kWh * elegir(r, [0.55, 0.6, 0.65, 0.7])) / 10) * 10;
      return { d1: { kWh, kVARh, cargo }, d2: { cosf: entre(r, 0.95, 0.99, 0.01), thd: elegir(r, [60, 80, 100, 120]) } };
    },
    enunciado: () => '<p>Lo que paga una industria por su factor de potencia y el caso en que el cosfímetro no dice la verdad.</p>',
    pasos: (d) => {
      d = d && d.d1 ? d : null;
      return [
        { q: 'd1', t: 'D1. La factura de la industria', fig: d ? () => fig('d1', d) : '',
          nota: d ? `La factura del mes de una industria trae ${M(d.d1.kWh + u_('kWh'))}, ${M(d.d1.kVARh + u_('kVARh'))} y un cargo por energía de ${M(d.d1.cargo + u_('Bs'))}. Se usa la regla vista en clase: FP mínimo de 0,85; si es menor, se cobra recargo.` : '',
          items: [
            { id: 'd1fp', h: 'FP de la factura', pts: 2, tol: TOL_FP },
            { id: 'd1rec', h: 'Recargo (Bs)', pts: 2 },
            { id: 'd1red', h: 'kVARh al mes que debe dejar de consumir para no pagar recargo', pts: 2 }
          ],
          sol: d ? (() => { const fp = d.d1.kWh / Math.hypot(d.d1.kWh, d.d1.kVARh), qm = d.d1.kWh * Math.tan(acosS(0.85)); return [`\\text{FP} = \\dfrac{\\text{kWh}}{\\sqrt{\\text{kWh}^2 + \\text{kVARh}^2}} = ${tx(fp, 3)}`, `\\text{Recargo} = ${d.d1.cargo}\\cdot\\left(\\dfrac{0{,}85}{${tx(fp, 3)}} - 1\\right) = ${tx(d.d1.cargo * (0.85 / fp - 1), 1)}${u_('Bs')}`, `\\text{kVARh}_{\\text{máx}} = ${d.d1.kWh}\\cdot\\tan(\\arccos 0{,}85) = ${tx(qm)};\\; ${d.d1.kVARh} - ${tx(qm)} = ${tx(d.d1.kVARh - qm)}`]; })() : [] },
        { q: 'd2', t: 'D2. El cosfímetro que miente', fig: d ? () => fig('d2', d) : '',
          nota: d ? `En un laboratorio de computadoras, el cosfímetro marca ${M('\\cos\\varphi = ' + nh(d.d2.cosf))}, pero el analizador de redes muestra la corriente muy deformada, con ${M('\\text{THD}_I = ' + d.d2.thd + '\\ \\%')}. El encargado quiere instalar capacitores para «mejorar el FP».` : '',
          items: [
            { id: 'd2fp', h: 'FP verdadero', pts: 2, tol: TOL_FP },
            { id: 'd2op', h: '¿Qué conviene instalar?', pts: 2, tipo: 'op' },
            { id: 'd2raz', h: '¿Por qué no basta con instalar capacitores comunes en este laboratorio?', pts: 3, tipo: 'raz',
              crit: ['El cos φ ya es casi 1: el FP bajo viene de la deformación (armónicos), no del desfase', 'Los capacitores no quitan los armónicos', 'Riesgo de resonancia con la red: amplifica armónicos y calienta o revienta los capacitores'] }
          ],
          sol: d ? [`\\text{FP} = \\dfrac{\\cos\\varphi}{\\sqrt{1 + \\text{THD}^2}} = \\dfrac{${nh(d.d2.cosf)}}{\\sqrt{1 + ${nh(d.d2.thd / 100)}^2}} = ${tx(d.d2.cosf / Math.sqrt(1 + (d.d2.thd / 100) ** 2), 3)}`, 'Con armónicos hacen falta filtros (activo o pasivo) o capacitores con reactor de desintonía.'] : [] }
      ];
    },
    ops: (d, id) => ({ d2op: ops(['Un filtro activo o capacitores con reactor de desintonía', 'Más capacitores comunes', 'Otro cosfímetro', 'Un transformador más pequeño']) })[id],
    esperado(d, u) {
      const fp = d.d1.kWh / Math.hypot(d.d1.kWh, d.d1.kVARh), fpu = usar(u, 'd1fp', fp);
      const rec = (x) => (x > 0 && x < 0.85 ? d.d1.cargo * (0.85 / x - 1) : 0);
      return { d1fp: [fp], d1rec: dos(rec(fpu), rec(fp)), d1red: [d.d1.kVARh - d.d1.kWh * Math.tan(acosS(0.85))], d2fp: [d.d2.cosf / Math.sqrt(1 + (d.d2.thd / 100) ** 2)] };
    },
    ref: (d, id) => ({ d2raz: `cos φ ${hh(d.d2.cosf)}; THD ${d.d2.thd} %; FP verdadero ${ht(d.d2.cosf / Math.sqrt(1 + (d.d2.thd / 100) ** 2), 3)}.` })[id]
  };

  // ======================= Parte E: puesta a tierra (20) =======================
  const A_JAB = 0.008, L_H = 0.4;
  const reJ = (rho, L) => (rho / (2 * PI * L)) * (Math.log((4 * L) / A_JAB) - 1);
  const uE = (rho, L, x) => (rho / (2 * PI * L)) * Math.asinh(L / Math.max(x, 0.05));
  const uH = (rho, dd) => (rho / (2 * PI * L_H)) * Math.asinh(L_H / Math.max(dd, 0.05));
  RC.lectTierra = (rho, L, D, x) => reJ(rho, L) - uH(rho, D) - uE(rho, L, x) + uH(rho, D - x);
  P.E = {
    titulo: 'Puesta a tierra', max: 20,
    gen(r) {
      const d = {};
      d.e1 = { RA: elegir(r, [20, 25, 30, 40, 50, 60, 80]), RB: elegir(r, [5, 8, 10, 15]) };
      for (;;) {
        const L = elegir(r, [1.5, 2.4, 3]), rho = entre(r, 60, 220, 10), lejos = r() < 0.25;
        const D = lejos ? entre(r, 25, 35, 1) : entre(r, 6, 10, 1);
        const x = Math.round(0.62 * D * 10) / 10;
        const lec = [x - 1, x, x + 1].map((xx) => Math.round(RC.lectTierra(rho, L, D, xx) * 100) / 100);
        const prom = (lec[0] + lec[1] + lec[2]) / 3, varp = ((Math.max(...lec) - Math.min(...lec)) / prom) * 100;
        if (lejos ? varp > 4 : varp < 6.5) continue;
        d.e2 = { L, rho, D, x, lec, varp, acepta: varp <= 5 };
        break;
      }
      for (;;) {
        const rho = r() < 0.4 ? entre(r, 20, 70, 5) : entre(r, 80, 300, 10), L = elegir(r, [1.5, 2.4, 3]), R = reJ(rho, L);
        if (Math.abs(R - 25) < 2.5) continue;
        d.e3 = { rho, L, R };
        break;
      }
      return d;
    },
    enunciado: () => '<p>Falla a la carcasa, el telurómetro en el terreno, la fórmula de la jabalina y el instrumento por dentro.</p>',
    pasos: (d) => {
      d = d && d.e1 ? d : null;
      return [
        { q: 'e1', t: 'E1. La lavadora con falla', fig: d ? () => fig('e1', d) : '',
          nota: d ? `En una lavadora de ${M('220' + u_('V'))}, la fase toca la carcasa metálica. La carcasa está conectada a su propia puesta a tierra, ${M('R_A = ' + d.e1.RA + u_('Ω'))}, y el neutro está puesto a tierra en el transformador, ${M('R_B = ' + d.e1.RB + u_('Ω'))}. El circuito tiene un disyuntor termomagnético de 16 A.` : '',
          items: [
            { id: 'e1I', h: 'Corriente de falla (A)', pts: 2 },
            { id: 'e1V', h: 'Tensión de la carcasa respecto de la tierra lejana (V)', pts: 2 },
            { id: 'e1raz', h: '¿Por qué no salta el disyuntor y qué protegería a la persona? Usa <b>tus</b> números.', pts: 3, tipo: 'raz',
              crit: ['La corriente de falla es menor que 16 A (y para disparar rápido necesita varias veces más)', 'La carcasa queda a una tensión peligrosa (dice su valor)', 'Un interruptor diferencial de 30 mA detecta la fuga y corta'] }
          ],
          sol: d ? [`I_f = \\dfrac{220}{R_A + R_B} = \\dfrac{220}{${d.e1.RA} + ${d.e1.RB}} = ${tx(220 / (d.e1.RA + d.e1.RB))}${u_('A')}`, `V_c = I_f\\cdot R_A = ${tx((220 * d.e1.RA) / (d.e1.RA + d.e1.RB))}${u_('V')}`, 'El disyuntor de 16 A no ve esa corriente como falla; el diferencial de 30 mA sí la detecta.'] : [] },
        { q: 'e2', t: 'E2. El telurómetro en el terreno', fig: d ? () => fig('e2', d) : '',
          nota: d ? `Un técnico mide una jabalina de ${M(hh(d.e2.L) + u_('m'))} con el método de caída de potencial. Clavó la pica H a ${M(d.e2.D + u_('m'))} y la pica S al 62 % (${M(hh(d.e2.x) + u_('m'))}). Para comprobar, midió también con S 1 m antes y 1 m después. Las tres lecturas están en el diagrama.` : '',
          items: [
            { id: 'e2var', h: 'Variación de las tres lecturas (%), como en clase: (máxima − mínima) / promedio · 100', pts: 2, tol: { rel: 0.05, abs: 0.3 } },
            { id: 'e2op', h: '¿Aceptas la medición?', pts: 2, tipo: 'op' },
            { id: 'e2ord', h: 'Ordena el procedimiento correcto de la medición (toca en orden)', pts: 3, tipo: 'ord',
              pasos: ['Desconectar la jabalina de la instalación', 'Clavar la pica H lejos: al menos 10 veces el largo de la jabalina', 'Clavar la pica S al 62 % de esa distancia, en línea', 'Conectar E, S y H al telurómetro y medir', 'Mover S 1 m hacia adelante y hacia atrás y comparar', 'Si la lectura varía más del 5 %, alejar H y repetir'],
              alt: [[1, 0, 2, 3, 4, 5], [1, 2, 0, 3, 4, 5]] }
          ],
          sol: d ? [`\\text{Variación} = \\dfrac{${tx(Math.max(...d.e2.lec))} - ${tx(Math.min(...d.e2.lec))}}{${tx((d.e2.lec[0] + d.e2.lec[1] + d.e2.lec[2]) / 3)}}\\cdot 100 = ${tx(d.e2.varp, 1)}\\ \\%`, d.e2.acepta ? 'Varía menos del 5 %: H está lejos y la lectura del 62 % se acepta.' : 'Varía más del 5 %: las zonas de E y H se tocan. Hay que alejar H y repetir.'] : [] },
        { q: 'e3', t: 'E3. La jabalina y el pararrayos', fig: d ? () => fig('e3', d) : '',
          nota: d ? `Se va a instalar una jabalina de cobre de ${M(hh(d.e3.L) + u_('m'))} de largo y 8 mm de radio en un terreno de ${M('\\rho = ' + d.e3.rho + u_('Ω·m'))}. Para la instalación se piden 25 Ω como máximo.` : '',
          items: [
            { id: 'e3R', h: 'Resistencia de la jabalina (Ω)', pts: 2 },
            { id: 'e3op', h: '¿Cumple los 25 Ω?', pts: 1, tipo: 'op' },
            { id: 'e3op2', h: 'Un vecino con el mismo suelo necesita 5 Ω para un pararrayos. ¿Qué le conviene?', pts: 2, tipo: 'op' }
          ],
          sol: d ? [`R = \\dfrac{\\rho}{2\\pi L}\\left(\\ln\\dfrac{4L}{a} - 1\\right) = \\dfrac{${d.e3.rho}}{2\\pi\\cdot ${nh(d.e3.L)}}\\left(\\ln\\dfrac{4\\cdot ${nh(d.e3.L)}}{0{,}008} - 1\\right) = ${tx(d.e3.R)}${u_('Ω')}`, 'Para bajar mucho la resistencia: varias jabalinas separadas al menos su largo, o una malla. El grosor casi no cambia nada y la sal se lava.'] : [] },
        { q: 'e4', t: 'E4. ¿Por qué no a 50 Hz?', fig: '',
          nota: 'El telurómetro inyecta su corriente al suelo con una frecuencia distinta de la de la red, por ejemplo 128 Hz.',
          items: [{ id: 'e4op', h: '¿Por qué no usa 50 Hz?', pts: 1, tipo: 'op' }],
          sol: ['En el suelo ya circulan corrientes de la red a 50 Hz. Con otra frecuencia el instrumento separa su propia señal con un filtro.'] }
      ];
    },
    ops: (d, id) => ({
      e2op: (() => { const no = 'No: varía más del 5 %; hay que alejar H y repetir', si = 'Sí: varía menos del 5 %; se acepta la lectura del 62 %'; return ops(d.e2.acepta ? [si, no, 'No: hay que acercar S a la jabalina', 'Sí: se toma el promedio de las tres'] : [no, si, 'No: hay que acercar S a la jabalina', 'Sí: se toma el promedio de las tres']); })(),
      e3op: ops(d.e3.R <= 25 ? ['Sí: es de 25 Ω o menos', 'No: pasa de 25 Ω'] : ['No: pasa de 25 Ω', 'Sí: es de 25 Ω o menos']),
      e3op2: ops(['Varias jabalinas en paralelo, separadas al menos su largo, o una malla', 'Dos jabalinas juntas, a 30 cm una de otra', 'Una jabalina del doble de grosor', 'Echar sal alrededor cada mes']),
      e4op: ops(['Para separar su señal de las corrientes de la red que ya circulan por el suelo', 'Porque a 128 Hz el suelo conduce mejor', 'Porque su batería solo da esa frecuencia', 'Para que nadie sienta la corriente'])
    })[id],
    esperado(d, u) {
      const If = 220 / (d.e1.RA + d.e1.RB);
      return { e1I: [If], e1V: dos(usar(u, 'e1I', If) * d.e1.RA, If * d.e1.RA), e2var: [d.e2.varp], e3R: [d.e3.R] };
    },
    ref: (d, id) => ({ e1raz: `If = ${ht(220 / (d.e1.RA + d.e1.RB))} A (menor que 16 A); carcasa a ${ht((220 * d.e1.RA) / (d.e1.RA + d.e1.RB))} V.` })[id]
  };

  RC.P = P;
  RC.PROB = ['A', 'B', 'C', 'D', 'E'];
  RC.MAX = Object.fromEntries(RC.PROB.map((k) => [k, P[k].max]));
  RC.TITULO = Object.fromEntries(RC.PROB.map((k) => [k, 'Parte ' + k]));
  RC.NOMBRE = Object.fromEntries(RC.PROB.map((k) => [k, P[k].titulo]));

  // ---------- datos por carnet (opciones y pasos mezclados) ----------
  const cache = {};
  RC.datos = (k, carnet) => {
    const clave = k + '|' + carnet;
    if (cache[clave]) return cache[clave];
    const d = P[k].gen(RC.rng(String(carnet) + '|me-lab|' + k));
    d.parte = k;
    d.op = {};
    d.ord = {};
    P[k].pasos(d).forEach((ps) => ps.items.forEach((it) => {
      const r2 = RC.rng(String(carnet) + '|me-lab|' + k + '|' + it.id);
      if (it.tipo === 'op') d.op[it.id] = RC.mezclar(r2, P[k].ops(d, it.id).map((o, i) => ({ ...o, ok: i === 0 })));
      if (it.tipo === 'ord') {
        let m;
        do { m = RC.mezclar(r2, it.pasos.map((_, i) => i)); } while (m.every((x, i) => x === i));
        d.ord[it.id] = m;
      }
    }));
    cache[clave] = d;
    return d;
  };
  RC.preguntas = (k, d) => P[k].pasos(d);
  RC.items = (k, d) => P[k].pasos(d).reduce((a, ps) => a.concat(ps.items), []);
  RC.casillas = (k) => RC.items(k, {}).length;
  RC.TOTAL_CASILLAS = RC.PROB.reduce((s, k) => s + RC.casillas(k), 0);
  RC.RAZ = RC.PROB.reduce((a, k) => a.concat(RC.items(k, {}).filter((it) => it.tipo === 'raz').map((it) => ({ k, id: it.id, clave: k + '.' + it.id, it }))), []);
  RC.ref = (k, d, id) => (P[k].ref ? P[k].ref(d, id) || '' : '');

  // ---------- ordenar pasos ----------
  RC.leerOrden = (v) => (v == null || v === '' ? [] : String(v).split(',').filter((x) => x !== '').map(Number));
  RC.puntosOrden = (it, v) => {
    const sel = RC.leerOrden(v);
    if (!sel.length) return { pts: 0, bien: 0, r: 'vacio' };
    const correctos = [it.pasos.map((_, i) => i)].concat(it.alt || []);
    let mejor = 0;
    correctos.forEach((c) => { let b = 0; c.forEach((x, i) => { if (sel[i] === x) b++; }); mejor = Math.max(mejor, b); });
    const pts = Math.round(((it.pts * mejor) / it.pasos.length) * 2) / 2;
    return { pts, bien: mejor, r: mejor === it.pasos.length ? 'ok' : pts > 0 ? 'parcial' : 'mal' };
  };

  // ---------- calificar una parte ----------
  // rev = revisión del docente de este registro: { 'C.c1raz': { c: [true, false, true], com } }
  RC.calificar = (k, d, vals, rev) => {
    vals = vals || {};
    rev = rev || {};
    const items = RC.items(k, d);
    const u = (id) => { const it = items.find((x) => x.id === id); if (!it || it.tipo) return undefined; const q = RC.leer(vals[id]); return q.vacio || q.invalido ? undefined : q.v; };
    const esp = P[k].esperado(d, u);
    const cel = {};
    let pts = 0, pend = 0;
    items.forEach((it) => {
      const v = vals[it.id];
      let c;
      if (it.tipo === 'op') {
        const ok = d.op[it.id].findIndex((o) => o.ok);
        const r = v == null || v === '' ? 'vacio' : Number(v) === ok ? 'ok' : 'mal';
        c = { r, exp: ok, pts: r === 'ok' ? it.pts : 0 };
      } else if (it.tipo === 'ord') {
        c = { ...RC.puntosOrden(it, v), exp: null };
      } else if (it.tipo === 'raz') {
        const t = String(v || '').trim();
        const rv = rev[k + '.' + it.id];
        if (!t) c = { r: 'vacio', pts: 0 };
        else if (!rv) { c = { r: 'rev', pts: 0 }; pend++; }
        else { const n = (rv.c || []).filter(Boolean).length; const p2 = Math.min(it.pts, n); c = { r: p2 === it.pts ? 'ok' : p2 > 0 ? 'parcial' : 'mal', pts: p2, rv }; }
      } else {
        const lista = [].concat(esp[it.id]);
        const q = RC.leer(v);
        const r = q.vacio ? 'vacio' : q.invalido ? 'mal' : lista.some((e) => RC.cerca(q.v, e, it.tol)) ? 'ok' : 'mal';
        c = { r, exp: lista[0], pts: r === 'ok' ? it.pts : 0 };
      }
      c.max = it.pts;
      cel[it.id] = c;
      pts += c.pts;
    });
    return { pts: Math.round(pts * 100) / 100, max: RC.MAX[k], cel, pend };
  };

  RC.nota = (carnet, est, car, rev) => {
    const res = {};
    let total = 0, pend = 0, auto = 0, raz = 0;
    RC.PROB.forEach((k) => {
      const d = RC.datos(k, carnet);
      res[k] = RC.calificar(k, d, (est && est[k] && est[k].vals) || {}, rev);
      total += res[k].pts;
      pend += res[k].pend;
      RC.items(k, d).forEach((it) => { if (it.tipo === 'raz') raz += res[k].cel[it.id].pts; else auto += res[k].cel[it.id].pts; });
    });
    const r2 = (x) => Math.round(x * 100) / 100;
    return { total: r2(total), auto: r2(auto), raz: r2(raz), pend, res };
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

  // penalización automática por texto pegado o metido de golpe (aviso que ve el estudiante)
  RC.IA_PTS = 40;
  RC.IA_MSG = 'Texto copiado desde inteligencia artificial: penalización de 40 puntos al examen.';
  RC.IA_LIMITE = 25;
})();
