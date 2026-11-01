// ORIGEN: instrumentacion/js/nucleo.js (copia del 31/10/2026 para el módulo Programación de PLCs).
// CAMBIOS: prefijo pl-, cola de envíos corregida (relee la cola en cada vuelta), latido y conectados,
// pausa a mando, ruleta, terminar clase, traslado de pendientes y participación con penalización.
// ============================================================
// Núcleo común: utilidades, conexión con Supabase, sincronización
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  II.SESIONES = II.SESIONES || {};

  // ---------- DOM ----------
  II.$ = (sel, raiz = document) => raiz.querySelector(sel);
  II.$$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));
  II.esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  II.html = (cadena) => {
    const t = document.createElement('template');
    t.innerHTML = cadena.trim();
    return t.content.firstElementChild;
  };
  II.params = new URLSearchParams(location.search);

  // ---------- números ----------
  II.num = (v) => {
    if (v == null) return NaN;
    const s = String(v).trim().replace(/\s/g, '').replace(',', '.');
    if (s === '' || s === '-' || s === '.') return NaN;
    return Number(s);
  };
  II.cerca = (valor, esperado, tolRel = 0.02, tolAbs = 0) => {
    if (!isFinite(valor)) return false;
    const tol = Math.max(Math.abs(esperado) * tolRel, tolAbs);
    return Math.abs(valor - esperado) <= tol + 1e-9;
  };
  II.fmt = (x, d = 2) => {
    if (!isFinite(x)) return '—';
    const r = Math.round(x * Math.pow(10, d)) / Math.pow(10, d);
    let s = r.toFixed(d);
    if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return s.replace('.', ',');
  };

  // ---------- azar reproducible (mismo carnet → mismos valores) ----------
  II.hash = (str) => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  II.rng = (semilla) => {
    let a = II.hash(String(semilla));
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  II.elegir = (r, arr) => arr[Math.floor(r() * arr.length)];
  II.mezclar = (r, arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // ---------- almacenamiento local (tolerante a fallos) ----------
  II.guardar = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ }
  };
  II.leer = (k, def = null) => {
    try {
      const v = localStorage.getItem(k);
      return v == null ? def : JSON.parse(v);
    } catch (e) { return def; }
  };

  // ---------- Supabase ----------
  const cfg = window.II_CONFIG || {};
  II.configurado =
    !!cfg.SUPABASE_URL && !String(cfg.SUPABASE_URL).includes('PEGA_AQUI') &&
    !!cfg.SUPABASE_KEY && !String(cfg.SUPABASE_KEY).includes('PEGA_AQUI') &&
    !!(window.supabase && window.supabase.createClient);

  II.sb = II.configurado
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, storageKey: 'pl-docente' },
        realtime: { params: { eventsPerSecond: 10 } }
      })
    : null;

  // indicador de conexión
  const oyentesConexion = [];
  II.alCambiarConexion = (fn) => oyentesConexion.push(fn);
  II.conectado = null;
  II.marcarConexion = (ok) => {
    if (II.conectado === ok) return;
    II.conectado = ok;
    oyentesConexion.forEach((fn) => fn(ok));
  };

  // estado de la clase (paso actual) — tiempo real + consulta periódica de respaldo
  II.seguirEstado = (sesion, alCambiar) => {
    if (!II.sb) return;
    let ultimo = null;
    const aplicar = (fila) => {
      if (!fila || fila.sesion !== sesion) return;
      // también avisa cuando el docente inicia o cancela el cierre de un reto
      // v2: cualquier cambio de extra (cierre, pausa, ruleta, terminar clase, traslados) se avisa
      const clave = fila.paso + '|' + fila.actualizado + '|' + JSON.stringify(fila.extra || null);
      if (clave === ultimo) return;
      ultimo = clave;
      alCambiar(fila);
    };
    const leer = async () => {
      try {
        const { data, error } = await II.sb.from('estado_sesion').select('*').eq('sesion', sesion).maybeSingle();
        if (error) throw error;
        II.marcarConexion(true);
        aplicar(data);
      } catch (e) {
        II.marcarConexion(false);
      }
    };
    leer();
    II.sb
      .channel('estado-' + sesion)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estado_sesion', filter: 'sesion=eq.' + sesion }, (p) => aplicar(p.new))
      .subscribe();
    setInterval(leer, 4000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) leer(); });
  };

  // modo repaso controlado por el docente (estado_sesion.extra):
  //   repaso_hasta   → id del último paso que se puede repasar (null = toda la sesión)
  //   repaso_cerrado → true = el repaso de la sesión está cerrado
  II.leerRepaso = async (sesion) => {
    const k = 'pl-repaso-' + sesion;
    if (!II.sb) return II.leer(k, { hasta: null, cerrado: false });
    try {
      const { data, error } = await II.sb.from('estado_sesion').select('*').eq('sesion', sesion).maybeSingle();
      if (error) throw error;
      const ex = (data && data.extra) || {};
      const v = { hasta: ex.repaso_hasta || null, cerrado: !!ex.repaso_cerrado };
      II.guardar(k, v);
      return v;
    } catch (e) { return II.leer(k, { hasta: null, cerrado: false }); }
  };

  II.fijarExtra = async (sesion, cambios, extraActual = {}) => {
    const extra = { ...(extraActual || {}), ...cambios };
    const { data, error } = await II.sb.from('estado_sesion').update({ extra }).eq('sesion', sesion).select();
    if (error) return { ok: false, error: error.message };
    if (!data || !data.length) return { ok: false, error: 'Tu cuenta no tiene permiso de docente.' };
    return { ok: true, extra };
  };

  // extra (opcional): reemplaza estado_sesion.extra en la misma operación (p. ej. para limpiar un cierre)
  II.fijarPaso = async (sesion, paso, extra) => {
    const cambios = { paso, actualizado: new Date().toISOString() };
    if (extra) cambios.extra = extra;
    const { data, error } = await II.sb
      .from('estado_sesion')
      .update(cambios)
      .eq('sesion', sesion)
      .select();
    if (error) return { ok: false, error: error.message };
    if (!data || !data.length) return { ok: false, error: 'Tu cuenta no tiene permiso de docente.' };
    return { ok: true };
  };

  // cola de envíos: si falla la red, reintenta sin perder respuestas
  const CLAVE_COLA = 'pl-cola-envios';
  II.enviar = async (registro) => {
    if (!II.sb) return { ok: false, local: true };
    const cola = II.leer(CLAVE_COLA, []);
    cola.push(registro);
    II.guardar(CLAVE_COLA, cola);
    return II.vaciarCola();
  };
  let vaciando = false;
  II.vaciarCola = async () => {
    if (!II.sb || vaciando) return { ok: false };
    vaciando = true;
    let cola = II.leer(CLAVE_COLA, []);
    let ok = true, rechazadas = 0, duplicadas = 0;
    // CORREGIDO (módulo PLC): se relee la cola en cada vuelta para no perder envíos que llegan mientras se envía
    while ((cola = II.leer(CLAVE_COLA, [])).length) {
      const { error } = await II.sb.from('respuestas').insert(cola[0]);
      if (error && error.code === '23505') {
        // ya existía (evaluación de un solo intento enviada antes): se descarta sin bloquear la cola
        cola.shift(); II.guardar(CLAVE_COLA, cola); duplicadas++; II.marcarConexion(true);
        continue;
      }
      if (error) {
        // la base de datos rechazó la respuesta porque la actividad ya está cerrada:
        // se descarta para no bloquear las siguientes (queda una copia local)
        if (error.code === '42501' || /row-level security/i.test(error.message || '')) {
          const rech = II.leer('pl-cola-rechazadas', []);
          rech.push(cola[0]);
          II.guardar('pl-cola-rechazadas', rech.slice(-50));
          cola.shift();
          II.guardar(CLAVE_COLA, cola);
          rechazadas++;
          II.marcarConexion(true);
          continue;
        }
        ok = false; II.marcarConexion(false); break;
      }
      cola.shift();
      II.guardar(CLAVE_COLA, cola);
      II.marcarConexion(true);
    }
    vaciando = false;
    return { ok: ok && rechazadas === 0, pendientes: cola.length, rechazadas, duplicadas };
  };
  setInterval(() => { if (II.leer(CLAVE_COLA, []).length) II.vaciarCola(); }, 5000);

  II.registrarIngreso = async (sesion, alumno) => {
    if (!II.sb) return { ok: false, local: true };
    const { error } = await II.sb.from('ingresos').insert({ sesion, carnet: alumno.carnet, nombre: alumno.nombre, info: alumno.info || {} });
    await II.enviar({
      sesion, actividad: 'ingreso', carnet: alumno.carnet, nombre: alumno.nombre,
      respuesta: alumno.info || {}, correcta: true, intento: 1, puntaje: 0
    });
    return { ok: !error, error: error && error.message };
  };

  // conteo anónimo por opción de una pregunta rápida → { 0: n, 1: n, … }
  II.resumenOpciones = async (sesion, actividad) => {
    if (!II.sb) return null;
    try {
      const { data, error } = await II.sb.rpc('resumen_opciones', { p_sesion: sesion, p_actividad: actividad });
      if (error) throw error;
      const m = {};
      (data || []).forEach((f) => { if (f.opcion != null) m[f.opcion] = Number(f.n); });
      return m;
    } catch (e) { return null; }
  };

  II.resumen = async (sesion, actividad) => {
    if (!II.sb) return null;
    try {
      const { data, error } = await II.sb.rpc('resumen_actividad', { p_sesion: sesion, p_actividad: actividad });
      if (error) throw error;
      return data && data[0] ? data[0] : { total: 0, correctas: 0, seguros_errados: 0, dudosos: 0 };
    } catch (e) { return null; }
  };

  // ---------- sesiones ----------
  II.sesionActual = () => {
    const id = II.params.get('s') || 'pl-s1';
    return II.SESIONES[id] ? id : 'pl-s1';
  };
  II.indicePaso = (sesion, pasoId) => II.SESIONES[sesion].pasos.findIndex((p) => p.id === pasoId);
  II.TIPOS = {
    espera: 'Bienvenida', cuestionario: 'Diagnóstico', explica: 'Explicación', explora: 'Exploración',
    rapida: 'Pregunta rápida', reto: 'Reto', revisa: 'Revisión', pausa: 'Pausa', cierre: 'Cierre', rubrica: 'Rúbrica del módulo'
  };

  // actividad que registra respuestas en un paso (null si el paso no tiene respuestas)
  II.actividadDe = (paso) => {
    if (!paso) return null;
    if (paso.tipo === 'reto') return paso.reto;
    if (paso.tipo === 'rapida') return paso.id;
    if (paso.tipo === 'cuestionario') return 'diagnostico';
    return null;
  };
  II.puntosRapida = (paso) => paso.puntos || 1;
  II.rapidasDe = (S) => S.pasos.filter((p) => p.tipo === 'rapida');

  // cierre de un reto o pregunta rápida (botón del docente): segundos de aviso
  II.SEG_CIERRE = { reto: 30, rapida: 15 };
  // cierre vigente en la fila de estado para esa actividad → { act, seg, fin, id } o null
  II.cierreDe = (fila, act) => {
    const c = fila && fila.extra && fila.extra.cierre;
    return c && act && c.act === act ? c : null;
  };
  // segundos que faltan para que termine el cierre (según este reloj), entre 0 y seg
  II.restaCierre = (c) => {
    if (!c) return null;
    const r = (new Date(c.fin).getTime() - Date.now()) / 1000;
    return Math.max(0, Math.min(c.seg || 30, isFinite(r) ? r : 0));
  };

  // puntaje de un reto: aciertos proporcionales; segundo intento vale la mitad
  II.puntaje = (aciertos, total, intento, puntos) =>
    Math.round(((puntos * aciertos) / total) * (intento === 1 ? 1 : 0.5) * 10) / 10;

  // verificación genérica de un reto generado
  II.verificarReto = (gen, valores) => {
    const detalle = {};
    let aciertos = 0;
    gen.campos.forEach((c) => {
      const esperado = gen.esperado[c.id];
      let ok;
      if (c.tipo === 'num') ok = II.cerca(II.num(valores[c.id]), esperado, c.tolRel != null ? c.tolRel : 0.02, c.tolAbs || 0);
      else if (c.tipo === 'slots') ok = !!c.verificar(String(valores[c.id] || '').split('|')); // validado por tabla de verdad
      else ok = String(valores[c.id] || '') === String(esperado);
      detalle[c.id] = ok;
      if (ok) aciertos++;
    });
    return { detalle, aciertos, total: gen.campos.length, todo: aciertos === gen.campos.length };
  };

  // contador regresivo simple
  II.formatoReloj = (seg) => {
    seg = Math.max(0, Math.round(seg));
    return String(Math.floor(seg / 60)).padStart(2, '0') + ':' + String(seg % 60).padStart(2, '0');
  };

  // QR (usa qrcode-generator si está cargado)
  II.qrSVG = (texto, tam = 220) => {
    if (!window.qrcode) return '';
    const q = window.qrcode(0, 'M');
    q.addData(texto);
    q.make();
    const n = q.getModuleCount();
    const c = tam / (n + 8);
    let rects = '';
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++)
        if (q.isDark(y, x)) rects += `<rect x="${((x + 4) * c).toFixed(2)}" y="${((y + 4) * c).toFixed(2)}" width="${(c + 0.3).toFixed(2)}" height="${(c + 0.3).toFixed(2)}"/>`;
    return `<svg viewBox="0 0 ${tam} ${tam}" width="${tam}" height="${tam}" role="img" aria-label="Código QR"><rect width="${tam}" height="${tam}" fill="#fff"/><g fill="#16202C">${rects}</g></svg>`;
  };


  // ============================================================
  // v2 — presencia, pausa, ruleta, terminar clase, traslado, participación
  // ============================================================

  // Penalización por no responder a la ruleta: puntos porcentuales que se restan a la participación del día
  II.PENALIZACION = 30;

  // Latido: el estudiante avisa cada 20 s que está en la clase (conectado = visto en los últimos 60 s)
  II.latido = (sesion, carnet) => {
    if (!II.sb || !carnet) return () => {};
    const f = () => { if (!document.hidden) II.sb.rpc('latido', { p_sesion: sesion, p_carnet: carnet }).then(() => {}, () => {}); };
    f();
    const t = setInterval(f, 20000);
    document.addEventListener('visibilitychange', f);
    return () => clearInterval(t);
  };
  // conectados ahora: [{ carnet, nombre }]
  II.conectados = async (sesion) => {
    if (!II.sb) return [];
    try {
      const { data, error } = await II.sb.rpc('conectados', { p_sesion: sesion });
      if (error) throw error;
      return data || [];
    } catch (e) { return []; }
  };

  // Pausa a mando del docente: extra.pausa = { hasta, minutos, paso_previo }
  II.pausaDe = (fila) => {
    const p = fila && fila.extra && fila.extra.pausa;
    if (!p || !p.hasta) return null;
    return p;
  };
  II.restaPausa = (p) => (p ? Math.max(0, (new Date(p.hasta).getTime() - Date.now()) / 1000) : 0);

  // Ruleta: extra.ruleta = { carnet, nombre, hora, vistos }  (sin puntos; "No responde" resta II.PENALIZACION)
  II.ruletaDe = (fila) => (fila && fila.extra && fila.extra.ruleta) || null;
  II.sortearRuleta = async (sesion) => {
    if (!II.sb) return { ok: false };
    const { data, error } = await II.sb.rpc('sortear_ruleta', { p_sesion: sesion });
    if (error) return { ok: false, error: error.message };
    const f = data && data[0];
    return f ? { ok: true, carnet: f.carnet, nombre: f.nombre } : { ok: false, error: 'Todavía no ingresó ningún estudiante a esta sesión.' };
  };
  // resultado: 'responde' | 'no_responde' | 'omitir'
  II.registrarRuleta = async (sesion, carnet, nombre, resultado, paso) => {
    const { error } = await II.sb.from('ruleta').insert({ sesion, carnet, nombre, resultado, paso: paso || null });
    return { ok: !error, error: error && error.message };
  };

  // Participación del día en % (regla acordada con el docente):
  //   bruta = puntos obtenidos / puntos posibles de lo realizado × 100
  //   final = bruta − PENALIZACION (puntos porcentuales) una sola vez por día si hubo "no responde"; mínimo 0
  II.participacionDia = (obtenidos, posibles, noResponde) => {
    const bruta = posibles > 0 ? Math.min(100, (obtenidos / posibles) * 100) : 0;
    const pen = noResponde > 0 ? II.PENALIZACION : 0;
    return { bruta, penalizacion: pen, final: Math.max(0, bruta - pen) };
  };

  // Rúbrica del módulo (pesos acordados)
  II.RUBRICA = [
    { id: 'part', nombre: 'Participación en clase', peso: 25, detalle: 'Retos y preguntas rápidas de cada sesión (cada día vale 100 % de lo que se hizo ese día)' },
    { id: 'ce', nombre: 'Control de estudio', peso: 10, detalle: 'Tarea asincrónica con evaluación de un solo intento' },
    { id: 'foro', nombre: 'Foro con coevaluación', peso: 25, detalle: 'Tu aporte y la evaluación de tres compañeros' },
    { id: 'ex', nombre: 'Examen final', peso: 40, detalle: 'Un solo intento, con valores propios' }
  ];


  // Texto de la rúbrica del módulo y de la penalización (lo usan el estudiante y la presentación)
  II.COLORES_RUBRICA = ['#1d5fb4', '#7a4bb0', '#1b8a5a', '#e0782b'];
  II.rubricaHTML = (grande) => {
    const R = II.RUBRICA, col = II.COLORES_RUBRICA, pen = II.PENALIZACION;
    const f = grande ? 'font-size:1.15rem' : '';
    return `<div class="rub-grid"><div>
      <div class="rub-barra">${R.map((r, i) => `<div style="width:${r.peso}%;background:${col[i]}">${r.peso} %</div>`).join('')}</div>
      <div style="${f}">${R.map((r, i) => `<div class="rub-fila"><div class="pct" style="background:${col[i]}">${r.peso} %</div><div><b>${r.nombre}</b><br><span class="nota" style="${f}">${r.detalle}</span></div></div>`).join('')}</div></div><div>
      <div class="aviso info" style="${f}"><b>Participación diaria.</b> Cada día de clase vale <b>100 %</b> de lo que se hizo realmente ese día, sin importar cuántos puntos sean (15, 17, 38…). Si la clase termina antes, se evalúa solo lo que se llegó a hacer. Lo que quedó pendiente puede trasladarse a la siguiente sesión; esos puntos cuentan <b>solo en la nueva sesión</b>.</div>
      <div class="aviso mal" style="${f}"><b>Penalización por no responder.</b> Durante la clase el docente puede llamar, con una ruleta, a cualquiera de los estudiantes que <b>ingresaron a la sesión</b> (estén conectados en ese momento o no) para que responda una pregunta en voz alta. <b>Responder no suma ni resta puntos</b>: es una forma de comprobar que estás atento.<br>
        Si te llaman y <b>no respondes</b> (porque abandonaste la clase o no estás atento), a tu participación <b>de ese día</b> se le restan <b>${pen} puntos porcentuales</b>, una sola vez por día.</div>
      <div class="rub-ejemplo" style="${f}">
        <div>Tu participación del día<b class="g" style="color:#1d5fb4">80 %</b></div>
        <div>Te llaman y no respondes<b class="g" style="color:#c0392b">− ${pen} %</b></div>
        <div>Participación final del día<b class="g" style="color:#c0392b">${80 - pen} %</b></div>
      </div>
      <p class="nota" style="${f}">Cada sesión pide <b>ingresar de nuevo</b> con tu carnet y tu fecha de nacimiento. En «Mi panel» ves tus puntajes y tu avance. El modo repaso sirve para estudiar y <b>no registra</b> puntos.</p></div></div>`;
  };

  // Clave local del ingreso: una por sesión (el ingreso es independiente en cada sesión)
  II.claveAlumno = (sesion) => 'pl-alumno-' + sesion;


  // ============================================================
  // v3 — acceso por lista, nota del día, panel del estudiante
  // ============================================================
  II.ASIGNATURA = 'Programación de Controladores e Interfaces Industriales';

  // El carnet se compara sin espacios, guiones ni puntos y en mayúsculas
  II.normCarnet = (s) => String(s || '').toUpperCase().replace(/[\s\-.]/g, '');

  // Entrar con carnet + fecha de nacimiento (AAAA-MM-DD); el estudiante fantasma además pide PIN.
  // → { ok, nombre, carnet, fantasma, motivo }  (motivo: no_lista | fecha | pin | pin_mal | bloqueado | red)
  II.entrar = async (carnet, fecha, pin) => {
    if (!II.sb) return { ok: false, motivo: 'red' };
    try {
      const { data, error } = await II.sb.rpc('entrar', { p_carnet: carnet, p_fecha: fecha, p_pin: pin || null });
      if (error) throw error;
      const f = data && data[0];
      return f ? { ok: !!f.ok, nombre: f.nombre, carnet: f.carnet, fantasma: !!f.fantasma, motivo: f.motivo } : { ok: false, motivo: 'red' };
    } catch (e) { return { ok: false, motivo: 'red' }; }
  };
  II.MOTIVOS_ENTRADA = {
    no_lista: 'Tu carnet no está en la lista del módulo. Avisa al docente.',
    fecha: 'El carnet y la fecha de nacimiento no coinciden. Revísalos.',
    pin: 'Escribe tu PIN.',
    pin_mal: 'PIN incorrecto.',
    bloqueado: 'Demasiados intentos fallidos. Espera 10 minutos e inténtalo de nuevo.',
    red: 'No se pudo comprobar tus datos. Revisa tu conexión e inténtalo otra vez.'
  };
  // credenciales de la pestaña (para abrir «Mi panel» sin escribir todo otra vez; se borran al cerrar la pestaña)
  II.guardarCred = (c) => { try { sessionStorage.setItem('pl-cred', JSON.stringify(c)); } catch (e) { /* sin almacenamiento */ } };
  II.leerCred = () => { try { return JSON.parse(sessionStorage.getItem('pl-cred') || 'null'); } catch (e) { return null; } };
  II.borrarCred = () => { try { sessionStorage.removeItem('pl-cred'); } catch (e) { /* nada */ } };

  // Actividades con puntos de una sesión: retos, preguntas rápidas y pendientes trasladados
  II.actividadesDe = (S, trasladados) => {
    const L = [];
    Object.entries(S.retos || {}).forEach(([k, r]) => L.push({ id: k, nombre: r.titulo.split('·')[0].trim(), puntos: r.puntos }));
    II.rapidasDe(S).forEach((p, j) => L.push({ id: p.id, nombre: 'Rápida ' + (j + 1), puntos: II.puntosRapida(p) }));
    (trasladados || []).forEach((id) => {
      const [, orig, pid] = String(id).split(':'); const O = II.SESIONES[orig]; const po = O && O.pasos.find((q) => q.id === pid);
      if (!po) return;
      L.push({ id, nombre: 'Pendiente de S' + O.numero + ': ' + po.titulo.split('·')[0].trim(), puntos: po.tipo === 'reto' ? O.retos[po.reto].puntos : II.puntosRapida(po) });
    });
    return L;
  };
  // Nota del día de un estudiante: solo cuenta lo realizado (al menos un estudiante respondió algo)
  //   realizadas: ids de actividades realizadas; puntosDe(id) → puntos del estudiante (o null)
  II.notaDia = (S, trasladados, realizadas, puntosDe, noResponde) => {
    const hechas = II.actividadesDe(S, trasladados).filter((a) => (realizadas || []).indexOf(a.id) >= 0);
    const posibles = hechas.reduce((t, a) => t + a.puntos, 0);
    const obtenidos = hechas.reduce((t, a) => t + (puntosDe(a.id) || 0), 0);
    return { hechas, posibles, obtenidos, noResponde: noResponde || 0, ...II.participacionDia(obtenidos, posibles, noResponde) };
  };
  // Qué se hizo realmente hoy en la sesión y cuántas veces no respondió a la ruleta
  II.resumenDia = async (sesion, carnet) => {
    if (!II.sb) return null;
    try {
      const { data, error } = await II.sb.rpc('resumen_dia', { p_sesion: sesion, p_carnet: carnet });
      if (error) throw error;
      return data;
    } catch (e) { return null; }
  };
  // Mis puntos de la sesión en el servidor: { actividad: puntos } (null si no se pudo)
  II.misPuntos = async (sesion, cred) => {
    if (!II.sb || !cred || !cred.fecha) return null;
    try {
      const { data, error } = await II.sb.rpc('mis_puntos', { p_sesion: sesion, p_carnet: cred.carnet, p_fecha: cred.fecha, p_pin: cred.pin || null });
      if (error) throw error;
      return data || null;
    } catch (e) { return null; }
  };
  // Candidatos de la ruleta: todos los que ingresaron a la sesión → [{ carnet, nombre, conectado, salio }]
  II.candidatosRuleta = async (sesion) => {
    if (!II.sb) return [];
    try {
      const { data, error } = await II.sb.rpc('candidatos_ruleta', { p_sesion: sesion });
      if (error) throw error;
      return data || [];
    } catch (e) { return []; }
  };
  // Panel del estudiante: sus sesiones, respuestas y llamados
  II.panelEstudiante = async (carnet, fecha, pin) => {
    if (!II.sb) return { ok: false, motivo: 'red' };
    try {
      const { data, error } = await II.sb.rpc('panel_estudiante', { p_carnet: carnet, p_fecha: fecha, p_pin: pin || null });
      if (error) throw error;
      return data || { ok: false, motivo: 'red' };
    } catch (e) { return { ok: false, motivo: 'red' }; }
  };
  // Tarjeta con la nota del día (la usan el cierre y el aviso de «Clase terminada»)
  II.tarjetaNotaDia = (n) => {
    const f = (x) => II.fmt(Math.round(x * 10) / 10, 1);
    return `<div class="nota-dia">
      <div class="nd-fila"><span>Puntos de lo realizado</span><b>${f(n.obtenidos)} / ${f(n.posibles)}</b></div>
      <div class="nd-fila"><span>Equivale a (sobre 100)</span><b>${f(n.bruta)} %</b></div>
      <div class="nd-fila ${n.penalizacion ? 'mal' : ''}"><span>${n.penalizacion ? 'Penalización: te llamó la ruleta y no respondiste' : 'Penalización por no responder a la ruleta'}</span><b>${n.penalizacion ? '− ' + n.penalizacion + ' %' : 'ninguna'}</b></div>
      <div class="nd-final"><span>Tu nota de participación de hoy</span><b>${f(n.final)} <small>/ 100</small></b></div>
    </div>`;
  };

  II.urlClase = (sesion) => {
    const base = location.href.replace(/[^/]*$/, '');
    return base + 'clase.html?s=' + sesion;
  };
})();
