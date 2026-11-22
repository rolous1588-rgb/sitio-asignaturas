// ============================================================
// Cápsulas: canal en vivo SIN base de datos (22/11/2026).
// Usa «broadcast» de Supabase Realtime: los mensajes viajan entre celulares y no se escriben en ninguna tabla.
// Dos canales por cápsula:
//   <nombre>-estado : el presentador emite la pantalla actual, la votación y los resultados (los estudiantes escuchan).
//   <nombre>-buzon  : los estudiantes mandan votos y «sigo aquí» (solo el presentador escucha). Así un voto
//                     no se reparte a todos los celulares, solo llega al presentador.
// Los estudiantes envían al buzón sin suscribirse (envío por HTTP de supabase-js).
// ============================================================
(function () {
  'use strict';
  const CP = window.CP = window.CP || {};

  CP.uid = function () {
    if (CP._uid) return CP._uid;
    let u = null;
    try { u = localStorage.getItem('cp-uid'); } catch (e) { /* sin almacenamiento */ }
    if (!u) {
      u = Math.random().toString(36).slice(2, 8);
      try { localStorage.setItem('cp-uid', u); } catch (e) { /* sin almacenamiento */ }
    }
    CP._uid = u;
    return u;
  };

  function cliente() {
    const c = window.II_CONFIG;
    if (!window.supabase || !window.supabase.createClient || !c) return null;
    return window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      realtime: { params: { eventsPerSecond: 20 } }
    });
  }

  // Presentador: escucha el buzón y emite el estado.
  CP.presentador = function (nombre, alRecibir, alConectar) {
    const sb = cliente();
    if (!sb) return null;
    const est = sb.channel(nombre + '-estado', { config: { broadcast: { self: false } } });
    const buz = sb.channel(nombre + '-buzon', { config: { broadcast: { self: false } } });
    const ok = { est: false, buz: false };
    const aviso = () => { alConectar && alConectar(ok.est && ok.buz); };
    buz.on('broadcast', { event: 'm' }, (m) => { try { alRecibir(m.payload || {}); } catch (e) { console.error(e); } });
    est.subscribe((s) => { ok.est = s === 'SUBSCRIBED'; aviso(); });
    buz.subscribe((s) => { ok.buz = s === 'SUBSCRIBED'; aviso(); });
    return {
      emitir(p) { if (ok.est) est.send({ type: 'broadcast', event: 'e', payload: p }).catch(() => {}); },
      conectado() { return ok.est && ok.buz; }
    };
  };

  // Estudiante: escucha el estado y manda al buzón.
  CP.estudiante = function (nombre, alEstado, alConectar) {
    const sb = cliente();
    if (!sb) return null;
    const est = sb.channel(nombre + '-estado');
    est.on('broadcast', { event: 'e' }, (m) => { try { alEstado(m.payload || {}); } catch (e) { console.error(e); } });
    est.subscribe((s) => { alConectar && alConectar(s === 'SUBSCRIBED'); });
    const buz = sb.channel(nombre + '-buzon', { config: { broadcast: { self: false } } });
    // Tres formas de enviar, de la más liviana a la más segura:
    // 1) httpSend (HTTP, versión nueva de Realtime); 2) send sin suscripción (HTTP, versión anterior);
    // 3) si las dos fallan seguido, el celular se suscribe al buzón y envía por la conexión en vivo.
    let fallos = 0, ws = false, wsListo = false;
    const okDe = (r) => r === 'ok' || (r && r.success === true);
    function porHttp(p) {
      const a = typeof buz.httpSend === 'function'
        ? Promise.resolve().then(() => buz.httpSend('m', p)).then(okDe).catch(() => false)
        : Promise.resolve(false);
      return a.then((ok) => ok || Promise.resolve().then(() => buz.send({ type: 'broadcast', event: 'm', payload: p })).then(okDe).catch(() => false));
    }
    function pasarAWs() {
      if (ws) return; ws = true;
      buz.subscribe((s) => { wsListo = s === 'SUBSCRIBED'; });
    }
    return {
      // Devuelve una promesa con true si el envío salió bien.
      enviar(p) {
        if (ws && wsListo) return buz.send({ type: 'broadcast', event: 'm', payload: p }).then(okDe).catch(() => false);
        return porHttp(p).then((ok) => {
          if (ok) { fallos = 0; return true; }
          if (++fallos >= 2) pasarAWs();
          return false;
        });
      }
    };
  };
})();
