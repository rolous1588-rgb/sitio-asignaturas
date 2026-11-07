// ============================================================
// Foro con coevaluación «Automatiza una máquina de punta a punta» (sesión pl-foro, 25 % de la rúbrica)
// Consigna, máquinas asignadas por carnet, rúbrica y cálculo automático de la nota
// (lo usan foro.js y el panel docente).
// Envíos en 'respuestas':
//   foro-aporte { titulo, maquina:{id,nombre,datos}, c1..c4, enlace (Google Drive/Docs), palabras, porCuadro:[4] }
//   foro-eval   { aporte: '<id>', abre: true|false, rubrica:[4 × 0..2], total, comentario, palabras }  (abre:false = «no pude abrir el documento»: { aporte, abre:false, motivo, comentario, palabras })
//   foro-util   { eval: '<id>', util: true|false }   (lo marca el autor; vale la última)
// ============================================================
(function () {
  const II = (window.II = window.II || {});

  const PREGUNTAS = [
    'Campo y E/S: ¿qué sensores y actuadores usa tu máquina (tipo; NA o NC; PNP o NPN; salida a relé o a transistor; qué va en el mando y qué en la potencia) y qué dirección del rack lleva cada señal?',
    'GRAFCET: describe tu GRAFCET de nivel 1 (en palabras) y de nivel 2 (con las señales, los temporizadores y los contadores con TUS datos). ¿Qué etapas y qué transiciones tiene?',
    'Ecuaciones y escalera: escribe las ecuaciones SET y RESET de tus etapas, cómo aplicas el enclavamiento y De Morgan, y describe un escalón de tu escalera.',
    'Escaneo, seguridad y pruebas: ¿qué ocurre en un ciclo de escaneo de tu programa, cómo atiendes el paro de emergencia y cómo probarías la máquina (tres pruebas concretas)?'
  ];
  const RUBRICA = [
    { t: 'Señales, campo y direcciones', d: 'Entradas y salidas bien elegidas (NA o NC; PNP o NPN; relé o transistor; mando y potencia) y tabla de direcciones coherente con la máquina asignada.',
      n: ['Incorrecto o casi no lo dice', 'Correcto en parte o con direcciones dudosas', 'Correcto y coherente con la máquina'] },
    { t: 'GRAFCET con los datos propios', d: 'Niveles 1 y 2 bien armados (etapas, transiciones, acciones) y usa los datos de la máquina (tiempos, cantidades).',
      n: ['No lo explica o no usa sus datos', 'Lo explica, pero incompleto o con errores', 'Completo, correcto y con sus datos'] },
    { t: 'Del GRAFCET a las ecuaciones y la escalera', d: 'SET y RESET, enclavamiento, De Morgan y un escalón, coherentes con el GRAFCET.',
      n: ['No lo hace o no es coherente', 'Hay ecuaciones, pero con errores o incompletas', 'Ecuaciones y escalón correctos y coherentes'] },
    { t: 'Escaneo, seguridad, pruebas y documento', d: 'Explica el escaneo, el paro de emergencia y tres pruebas; el enlace abre y el documento muestra los diagramas.',
      n: ['Falta casi todo o el enlace no abre', 'Parcial, o el documento está incompleto', 'Claro, con pruebas concretas y documento revisable'] }
  ];
  const MIN_PAL = 200, MAX_PAL = 300, MIN_CUADRO = 20, MIN_PUBLICAR = 10, MIN_COMENTARIO = 40, N_EVAL = 3;
  const RE_DRIVE = /^https:\/\/(drive|docs)\.google\.com\/[^\s]+$/i;

  // ---------- máquinas asignadas por carnet (cada una con 2 o 3 datos propios) ----------
  const elegirDe = (r, a) => a[Math.floor(r() * a.length)];
  const MAQUINAS = [
    { id: 'cinta', nombre: 'Cinta transportadora con conteo de cajas',
      que: 'Una cinta lleva cajas hasta un desvío. Con marcha arranca; un sensor óptico cuenta cada caja que pasa; al completar el lote se detiene la cinta y se acciona el desvío un tiempo antes de reiniciar el conteo.',
      datos: (r) => ({ lote: elegirDe(r, [6, 8, 10, 12, 15]), desvio: elegirDe(r, [3, 4, 5, 6]) }),
      lista: (d) => [`Lote: <b>${d.lote}</b> cajas`, `Tiempo del desvío: <b>${d.desvio} s</b>`] },
    { id: 'porton', nombre: 'Portón corredizo de garaje',
      que: 'Un pulsador abre el portón hasta su final de carrera; cierra solo después de una espera y se detiene o reabre si una fotocelda detecta un obstáculo.',
      datos: (r) => ({ espera: elegirDe(r, [10, 15, 20, 30]), recorrido: elegirDe(r, [8, 10, 12, 14]) }),
      lista: (d) => [`Espera antes de cerrar: <b>${d.espera} s</b>`, `Tiempo máximo de recorrido: <b>${d.recorrido} s</b> (si lo supera, falla)`] },
    { id: 'cisterna', nombre: 'Cisterna y tanque elevado con dos bombas',
      que: 'Una bomba llena el tanque elevado desde la cisterna y otra bomba de reserva entra si el nivel sigue bajando; se protege contra marcha en seco si la cisterna está vacía.',
      datos: (r) => ({ arranque: elegirDe(r, [20, 25, 30, 35]), reserva: elegirDe(r, [10, 15, 20]) }),
      lista: (d) => [`La bomba 1 arranca por debajo del <b>${d.arranque} %</b> de nivel`, `Si pasan <b>${d.reserva} s</b> sin subir el nivel, entra la bomba 2`] },
    { id: 'mezcla', nombre: 'Mezcladora de dos ingredientes',
      que: 'Se llena el recipiente con el ingrediente A hasta su nivel, luego con B, se mezcla un tiempo con el agitador y se vacía; el ciclo se repite mientras haya orden de marcha.',
      datos: (r) => ({ mezclado: elegirDe(r, [20, 30, 40, 45]), vaciado: elegirDe(r, [8, 10, 12]), ciclos: elegirDe(r, [3, 4, 5]) }),
      lista: (d) => [`Mezclado: <b>${d.mezclado} s</b>`, `Vaciado: <b>${d.vaciado} s</b>`, `Se detiene tras <b>${d.ciclos}</b> ciclos`] },
    { id: 'prensa', nombre: 'Prensa de seguridad a dos manos',
      que: 'El cilindro de la prensa solo baja si el operador pulsa los dos botones casi a la vez; baja hasta el final de carrera inferior, mantiene la presión y sube. Si suelta un botón en el descenso, la prensa se detiene.',
      datos: (r) => ({ ventana: elegirDe(r, [0.3, 0.5, 0.7]), presion: elegirDe(r, [2, 3, 4, 5]) }),
      lista: (d) => [`Los dos botones deben pulsarse con menos de <b>${II.fmt(d.ventana, 1)} s</b> de diferencia`, `Mantiene la presión <b>${d.presion} s</b> abajo`] },
    { id: 'lavado', nombre: 'Túnel de lavado de autos',
      que: 'Cuando entra un auto, el túnel hace jabón, enjuague y secado en secuencia, cada etapa con su tiempo; si entra otro auto antes de terminar, espera.',
      datos: (r) => ({ jabon: elegirDe(r, [20, 25, 30]), enjuague: elegirDe(r, [15, 20]), secado: elegirDe(r, [25, 30, 40]) }),
      lista: (d) => [`Jabón: <b>${d.jabon} s</b>`, `Enjuague: <b>${d.enjuague} s</b>`, `Secado: <b>${d.secado} s</b>`] },
    { id: 'compresor', nombre: 'Compresor con dos presiones y alarma',
      que: 'El compresor arranca cuando la presión baja del mínimo y para al llegar al máximo (histéresis); una alarma se enciende si la temperatura del motor se pasa, y bloquea el arranque hasta rearmar.',
      datos: (r) => ({ minima: elegirDe(r, [4, 5, 6]), maxima: elegirDe(r, [7, 8, 9]), enfria: elegirDe(r, [30, 45, 60]) }),
      lista: (d) => [`Presión de arranque: <b>${d.minima} bar</b>`, `Presión de paro: <b>${d.maxima} bar</b>`, `Tiempo mínimo de enfriamiento: <b>${d.enfria} s</b>`] },
    { id: 'estacion', nombre: 'Estacionamiento con barrera y contador de plazas',
      que: 'Una barrera sube cuando un auto pide entrar y hay plazas libres; el contador suma al entrar y resta al salir; con el estacionamiento lleno se enciende un letrero y la barrera no sube.',
      datos: (r) => ({ plazas: elegirDe(r, [6, 8, 10, 12, 16]), barrera: elegirDe(r, [4, 5, 6]) }),
      lista: (d) => [`Plazas: <b>${d.plazas}</b>`, `La barrera permanece arriba <b>${d.barrera} s</b>`] },
    { id: 'cilindro', nombre: 'Estación de ensamble con cilindro neumático',
      que: 'Cuando hay pieza presente y se pulsa marcha, el cilindro avanza hasta su final de carrera, remacha un tiempo y retrocede; no admite otra pieza hasta terminar el ciclo.',
      datos: (r) => ({ remache: elegirDe(r, [2, 3, 4]), piezas: elegirDe(r, [5, 10, 20]) }),
      lista: (d) => [`Tiempo de remache: <b>${d.remache} s</b>`, `Cada <b>${d.piezas}</b> piezas se enciende un aviso de mantenimiento`] },
    { id: 'extractores', nombre: 'Extractores de aire que se alternan',
      que: 'Dos ventiladores extraen aire de un ambiente cerrado; trabajan alternados en cada ciclo para repartir el desgaste y entran los dos si un sensor de gas pasa el umbral.',
      datos: (r) => ({ turno: elegirDe(r, [30, 45, 60]), retardo: elegirDe(r, [5, 8, 10]) }),
      lista: (d) => [`Cada ventilador trabaja <b>${d.turno} s</b> por turno`, `Con gas, el segundo entra tras <b>${d.retardo} s</b> de retardo`] },
    { id: 'dosificadora', nombre: 'Dosificadora de envases',
      que: 'Un sensor detecta el envase bajo la boquilla; se abre la válvula un tiempo, se cierra, el envase sigue y se cuenta; al completar el lote suena un aviso y espera confirmación.',
      datos: (r) => ({ llenado: elegirDe(r, [4, 5, 6, 8]), lote: elegirDe(r, [12, 24, 36, 48]) }),
      lista: (d) => [`Llenado: <b>${d.llenado} s</b>`, `Lote: <b>${d.lote}</b> envases`] },
    { id: 'riego', nombre: 'Riego de invernadero por sectores',
      que: 'Tres válvulas riegan un sector a la vez, en orden, cada una un tiempo; el ciclo solo arranca si el tanque tiene agua y se detiene con la lluvia.',
      datos: (r) => ({ sector: elegirDe(r, [20, 30, 40]), pausa: elegirDe(r, [5, 10]), vueltas: elegirDe(r, [2, 3]) }),
      lista: (d) => [`Cada sector: <b>${d.sector} s</b>`, `Pausa entre sectores: <b>${d.pausa} s</b>`, `Vueltas por orden de marcha: <b>${d.vueltas}</b>`] },
    { id: 'montacargas', nombre: 'Montacargas de dos pisos',
      que: 'La cabina sube y baja entre dos pisos con llamadas desde cada piso; las puertas solo se abren con la cabina detenida en un final de carrera y la cabina no se mueve con la puerta abierta.',
      datos: (r) => ({ puerta: elegirDe(r, [5, 8, 10]), viaje: elegirDe(r, [12, 15, 18]) }),
      lista: (d) => [`Puerta abierta: <b>${d.puerta} s</b>`, `Tiempo máximo de viaje: <b>${d.viaje} s</b> (si lo supera, falla)`] }
  ];
  // la máquina de un carnet: la misma siempre, y distinta entre carnets cercanos
  const maquina = (carnet) => {
    const r = II.rng(`${carnet}|foro|maq`);
    const m = MAQUINAS[Math.floor(r() * MAQUINAS.length)];
    const d = m.datos(II.rng(`${carnet}|foro|datos`));
    return { id: m.id, nombre: m.nombre, que: m.que, datos: d, lista: m.lista(d), textoDatos: m.lista(d).map((x) => x.replace(/<[^>]+>/g, '')).join('; ') };
  };

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

  // ---------- nota de todos: respuestas = filas de la sesión pl-foro; alumnos = [{carnet, nombre}] ----------
  // fantasmas: carnets que no entran a ningún conteo (la cuenta de ensayo del docente)
  // restituidos: carnets a los que el docente les devolvió la calidad aunque 2 o más evaluadores marcaron «no abre»
  const notas = (respuestas, alumnos = [], fantasmas = [], restituidos = []) => {
    const fan = new Set(fantasmas.map(String));
    const rest = new Set((restituidos || []).map(String));
    const noAbre = (e) => !!e.respuesta && e.respuesta.abre === false;
    const porCreado = (a, b) => String(a.creado).localeCompare(String(b.creado));
    const rs = respuestas.filter((r) => !fan.has(String(r.carnet))).sort(porCreado);
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
    // calidad: las evaluaciones «no pude abrir» no puntúan; si 2 o más evaluadores no pudieron abrir el documento, la calidad es 0
    const calidad = new Map(), acceso = new Map();
    aportes.forEach((r, c) => {
      const ev = porAporte.get(String(r.id)) || [];
      const nos = ev.filter(noAbre).length, t = ev.filter((e) => !noAbre(e)).map(total);
      const sin = nos >= 2 && !rest.has(c);
      acceso.set(c, { nos, sin });
      calidad.set(c, sin ? 0 : t.length ? mediana(t) / 8 : null);
    });
    const medCurso = mediana(Array.from(calidad.entries()).filter(([c, v]) => v != null && !acceso.get(c).sin).map(([, v]) => v));
    const n = aportes.size;
    const textos = new Map(); aportes.forEach((r, c) => textos.set(c, trios(textoAporte(r))));

    const gente = new Map();
    alumnos.filter((a) => !fan.has(String(a.carnet))).forEach((a) => gente.set(a.carnet, a));
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
      const dist = mias.filter((e) => !noAbre(e)).map((e) => {
        const otros = (porAporte.get(String(e.respuesta.aporte)) || []).filter((x) => x !== e && !noAbre(x)).map(total);
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
        const tt = recibidas.filter((e) => !noAbre(e)).map(total);
        const ac = acceso.get(a.carnet) || { nos: 0, sin: false };
        if (ac.sin) alertas.push('Enlace sin acceso: 2 o más evaluadores no pudieron abrirlo; calidad 0 automática');
        else if (ac.nos >= 2) alertas.push('Calidad restituida por el docente (2 o más evaluadores no pudieron abrir el enlace)');
        else if (ac.nos === 1) alertas.push('Un evaluador marcó que no pudo abrir el enlace; su evaluación no cuenta');
        if (tt.length >= 2 && Math.max(...tt) - Math.min(...tt) >= 5) alertas.push('Sus evaluadores no coinciden');
        if (cal == null) alertas.push('Nadie evaluó su aporte: se usó la mediana del curso');
        const m = (ap.respuesta || {}).maquina;
        if (m && m.id !== maquina(a.carnet).id) alertas.push('La máquina del aporte no es la asignada');
      }
      return {
        a, aporte: ap || null, palabras: cu.palabras, ptsCumpl: cu.pts, ptsCal, cal, nRecibidas: recibidas.length, recibidas,
        asignadas, hechas, ptsEval, conc, ut, ptsBuen, nota, noAbrieron: ap ? (acceso.get(a.carnet) || {}).nos || 0 : 0, sinAcceso: !!(ap && (acceso.get(a.carnet) || {}).sin), restituido: !!(ap && rest.has(a.carnet) && ((acceso.get(a.carnet) || {}).nos || 0) >= 2), pond: Math.round(nota * 25) / 100, alertas,
        comentarios: mias
      };
    }).sort((x, y) => String(x.a.nombre).localeCompare(String(y.a.nombre), 'es'));
  };

  II.FORO = {
    id: 'pl-foro', titulo: 'Automatiza una máquina de punta a punta', peso: 25,
    preguntas: PREGUNTAS, rubrica: RUBRICA, nEval: N_EVAL,
    minPal: MIN_PAL, maxPal: MAX_PAL, minCuadro: MIN_CUADRO, minPublicar: MIN_PUBLICAR, minComentario: MIN_COMENTARIO,
    reDrive: RE_DRIVE, esDrive: (s) => RE_DRIVE.test(String(s || '').trim()),
    maquinas: MAQUINAS, maquina,
    palabras, cumplimiento, notas, mediana
  };
  II.SESIONES = II.SESIONES || {};
  II.SESIONES['pl-foro'] = { id: 'pl-foro', etiqueta: 'Foro', numero: '', titulo: 'Automatiza una máquina de punta a punta (coevaluación)', fecha: 'Sábado 07/11 y domingo 08/11', asincrona: true, foro: true, retos: {}, pasos: [], diagnostico: [] };
})();
