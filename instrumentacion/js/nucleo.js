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
        auth: { persistSession: true, autoRefreshToken: true, storageKey: 'ii-docente' },
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
      const clave = fila.paso + '|' + fila.actualizado + '|' + JSON.stringify((fila.extra && fila.extra.cierre) || null);
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
    const k = 'ii-repaso-' + sesion;
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
  const CLAVE_COLA = 'ii-cola-envios';
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
    while (cola.length) {
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
          const rech = II.leer('ii-cola-rechazadas', []);
          rech.push(cola[0]);
          II.guardar('ii-cola-rechazadas', rech.slice(-50));
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
    const id = II.params.get('s') || 'ii-s1';
    return II.SESIONES[id] ? id : 'ii-s1';
  };
  II.indicePaso = (sesion, pasoId) => II.SESIONES[sesion].pasos.findIndex((p) => p.id === pasoId);
  II.TIPOS = {
    espera: 'Bienvenida', cuestionario: 'Diagnóstico', explica: 'Explicación', explora: 'Exploración',
    rapida: 'Pregunta rápida', reto: 'Reto', revisa: 'Revisión', pausa: 'Pausa', cierre: 'Cierre'
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

  II.urlClase = (sesion) => {
    const base = location.href.replace(/[^/]*$/, '');
    return base + 'clase.html?s=' + sesion;
  };
})();
