// ============================================================
// Foro con coevaluación «Un instrumento en la vida real» (sesión ii-foro, 25 % del módulo)
// Consigna, rúbrica y cálculo automático de la nota (lo usan foro.js y el panel docente).
// Envíos en 'respuestas':
//   foro-aporte { titulo, c1..c4, enlace, propio, palabras, porCuadro:[4] }
//   foro-eval   { aporte: '<id>', rubrica:[4 × 0..2], total, comentario, palabras }
//   foro-util   { eval: '<id>', util: true|false }   (lo marca el autor; vale la última)
// ============================================================
(function () {
  const II = (window.II = window.II || {});

  const PREGUNTAS = [
    '¿Qué variable mide y con qué tipo de sensor? ¿En qué principio físico se basa?',
    '¿Cómo está instalado y por qué así?',
    '¿Qué errores o fallas podría tener y cómo se notarían?',
    '¿Cómo lo calibrarías o verificarías?'
  ];
  const RUBRICA = [
    { t: 'Contenido técnico', d: 'Variable, tipo de sensor y principio físico correctos.',
      n: ['Incorrecto o no lo dice', 'Correcto en parte o muy general', 'Correcto y preciso'] },
    { t: 'Instalación, fallas y calibración', d: 'Bien explicadas y realistas.',
      n: ['No lo explica o no es realista', 'Lo explica, pero poco concreto', 'Bien explicado y realista'] },
    { t: 'Relación con el módulo', d: 'Usa lo visto en clase: rango, 4–20 mA, errores, calibración, instalación…',
      n: ['No usa nada del módulo', 'Menciona algún concepto', 'Aplica bien conceptos del módulo'] },
    { t: 'Claridad y fuentes', d: 'Se entiende y cita la fuente si usó internet.',
      n: ['Confuso o copia sin fuente', 'Se entiende con dificultad o fuente incompleta', 'Claro, ordenado y con fuente si hacía falta'] }
  ];
  const MIN_PAL = 200, MAX_PAL = 300, MIN_CUADRO = 20, MIN_PUBLICAR = 10, MIN_COMENTARIO = 40, N_EVAL = 3;

  const palabras = (t) => String(t || '').trim().split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  const mediana = (a) => {
    if (!a.length) return null;
    const s = a.slice().sort((x, y) => x - y), m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  // parecido entre textos: Jaccard de tríos de palabras (0 a 1)
  const trios = (t) => {
    const w = String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9ñ]+/).filter(Boolean);
    const s = new Set();
    for (let i = 0; i + 2 < w.length; i++) s.add(w[i] + ' ' + w[i + 1] + ' ' + w[i + 2]);
    return s;
  };
  const parecido = (a, b) => {
    if (!a.size || !b.size) return 0;
    let c = 0; a.forEach((x) => { if (b.has(x)) c++; });
    return c / (a.size + b.size - c);
  };
  const textoAporte = (r) => ['c1', 'c2', 'c3', 'c4'].map((k) => (r.respuesta || {})[k] || '').join(' ');

  // ---------- puntos de cumplimiento del aporte (máx. 20) ----------
  const cumplimiento = (resp) => {
    const pc = (resp && resp.porCuadro) || ['c1', 'c2', 'c3', 'c4'].map((k) => palabras(resp && resp[k]));
    const cuadros = pc.filter((n) => n >= MIN_CUADRO).length * 2.5;                // 4 × 2,5 = 10
    const p = (resp && resp.palabras) != null ? resp.palabras : pc.reduce((a, b) => a + b, 0);
    const rango = p >= MIN_PAL && p <= MAX_PAL ? 10 : p >= 150 && p <= 350 ? 5 : 0; // 10
    return { pts: cuadros + rango, cuadros, rango, palabras: p };
  };

  // ---------- nota de todos: respuestas = filas de la sesión ii-foro; alumnos = [{carnet, nombre, info}] ----------
  const notas = (respuestas, alumnos = []) => {
    const porCreado = (a, b) => String(a.creado).localeCompare(String(b.creado));
    const rs = respuestas.slice().sort(porCreado);
    const aportes = new Map();               // carnet → fila del aporte (el primero)
    rs.filter((r) => r.actividad === 'foro-aporte').forEach((r) => { if (!aportes.has(r.carnet)) aportes.set(r.carnet, r); });
    const autorDe = new Map();               // id del aporte → carnet del autor
    aportes.forEach((r, c) => autorDe.set(String(r.id), c));
    const evalPorId = new Map(), porAporte = new Map(), deEvaluador = new Map(), vistos = new Set();
    rs.filter((r) => r.actividad === 'foro-eval' && r.respuesta && autorDe.has(String(r.respuesta.aporte))).forEach((e) => {
      const k = e.carnet + '|' + e.respuesta.aporte;
      if (vistos.has(k) || autorDe.get(String(e.respuesta.aporte)) === e.carnet) return;
      vistos.add(k);
      evalPorId.set(String(e.id), e);
      const a = String(e.respuesta.aporte);
      (porAporte.get(a) || porAporte.set(a, []).get(a)).push(e);
      (deEvaluador.get(e.carnet) || deEvaluador.set(e.carnet, []).get(e.carnet)).push(e);
    });
    const util = new Map();                  // id de la evaluación → última valoración del autor
    rs.filter((r) => r.actividad === 'foro-util' && r.respuesta).forEach((u) => {
      const ev = evalPorId.get(String(u.respuesta.eval));
      if (ev && autorDe.get(String(ev.respuesta.aporte)) === u.carnet) util.set(String(ev.id), !!u.respuesta.util);
    });
    const total = (e) => +e.respuesta.total || 0;
    const calidad = new Map();
    aportes.forEach((r, c) => { const t = (porAporte.get(String(r.id)) || []).map(total); calidad.set(c, t.length ? mediana(t) / 8 : null); });
    const medCurso = mediana(Array.from(calidad.values()).filter((v) => v != null));
    const n = aportes.size;
    const textos = new Map(); aportes.forEach((r, c) => textos.set(c, trios(textoAporte(r))));

    const gente = new Map();
    alumnos.forEach((a) => gente.set(a.carnet, a));
    rs.forEach((r) => { if (!gente.has(r.carnet)) gente.set(r.carnet, { carnet: r.carnet, nombre: r.nombre, info: {} }); });

    return Array.from(gente.values()).map((a) => {
      const ap = aportes.get(a.carnet);
      const cu = ap ? cumplimiento(ap.respuesta) : { pts: 0, cuadros: 0, rango: 0, palabras: 0 };
      const recibidas = ap ? porAporte.get(String(ap.id)) || [] : [];
      const cal = ap ? calidad.get(a.carnet) : null;
      const ptsCal = ap ? 50 * (cal != null ? cal : medCurso != null ? medCurso : 0.5) : 0;
      const asignadas = ap ? Math.min(N_EVAL, n - 1) : Math.min(N_EVAL, n);
      const mias = deEvaluador.get(a.carnet) || [];
      const hechas = Math.min(mias.length, Math.max(asignadas, 0));
      const frac = asignadas > 0 ? hechas / asignadas : 1;
      const ptsEval = 15 * frac;
      // buen evaluador: cercanía a la mediana de los otros evaluadores (10) + comentarios útiles (5)
      const dist = mias.map((e) => {
        const otros = (porAporte.get(String(e.respuesta.aporte)) || []).filter((x) => x !== e).map(total);
        return otros.length ? Math.max(0, 1 - Math.abs(total(e) - mediana(otros)) / 4) : null;
      }).filter((x) => x != null);
      const conc = dist.length ? dist.reduce((s, x) => s + x, 0) / dist.length : 1;
      const val = mias.filter((e) => util.has(String(e.id)));
      const ut = val.length ? val.filter((e) => util.get(String(e.id))).length / val.length : 1;
      const ptsBuen = hechas > 0 ? (10 * conc + 5 * ut) * frac : 0;
      const nota = Math.round((cu.pts + ptsCal + ptsEval + ptsBuen) * 10) / 10;
      // alertas para el docente (solo informativas)
      const alertas = [];
      if (ap) {
        let max = 0, con = null;
        textos.forEach((t, c) => { if (c === a.carnet) return; const p = parecido(textos.get(a.carnet), t); if (p > max) { max = p; con = c; } });
        if (max >= 0.35) alertas.push(`Texto parecido al de ${(gente.get(con) || { nombre: con }).nombre} (${Math.round(max * 100)} %)`);
        const tt = recibidas.map(total);
        if (tt.length >= 2 && Math.max(...tt) - Math.min(...tt) >= 5) alertas.push('Sus evaluadores no coinciden');
        if (ap && cal == null) alertas.push('Nadie evaluó su aporte: se usó la mediana del curso');
      }
      return {
        a, aporte: ap || null, palabras: cu.palabras, ptsCumpl: cu.pts, ptsCal, cal, nRecibidas: recibidas.length, recibidas,
        asignadas, hechas, ptsEval, conc, ut, ptsBuen, nota, pond: Math.round(nota * 25) / 100, alertas,
        comentarios: mias
      };
    }).sort((x, y) => String(x.a.nombre).localeCompare(String(y.a.nombre), 'es'));
  };

  II.FORO = {
    id: 'ii-foro', titulo: 'Un instrumento en la vida real', peso: 25,
    preguntas: PREGUNTAS, rubrica: RUBRICA, nEval: N_EVAL,
    minPal: MIN_PAL, maxPal: MAX_PAL, minCuadro: MIN_CUADRO, minPublicar: MIN_PUBLICAR, minComentario: MIN_COMENTARIO,
    palabras, cumplimiento, notas, mediana
  };
  II.SESIONES = II.SESIONES || {};
  II.SESIONES['ii-foro'] = { id: 'ii-foro', etiqueta: 'Foro', numero: '', titulo: 'Un instrumento en la vida real (coevaluación)', fecha: 'Viernes 09/10 y sábado 10/10', asincrona: true, foro: true, retos: {}, pasos: [], diagnostico: [] };
})();
