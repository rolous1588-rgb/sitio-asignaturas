// ============================================================
// Del campo al bit: cómo se conectan sensores y actuadores al PLC
// Mando y potencia; entrada con común y contacto NA/NC; sensores PNP y NPN;
// salidas a relé y a transistor; «Conecta tú» la estación de bombeo.
// Pestañas: mundos, entrada, sensor, salida, estacion
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  II.diagramas = II.diagramas || {};
  const PL = (II.pl = II.pl || {});

  const AZUL = '#1d5fb4', VERDE = '#1b8a5a', ROJO = '#c0392b', GRIS = '#b7c0cc', OSC = '#2f3b4a', AMBAR = '#b7791f';
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" class="svg-texto${o.mono ? ' mono' : ''}${o.fuerte ? ' fuerte' : ''}" text-anchor="${o.a || 'start'}" style="font-size:${o.z || 12}px;${o.c ? 'fill:' + o.c + ';' : ''}">${s}</text>`;
  const L = (x1, y1, x2, y2, c = OSC, w = 2.4, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
  const P = (d, c = OSC, w = 2.4) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const R = (x, y, w, h, f = '#fff', s = OSC, sw = 2, rx = 6) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" stroke="${s}" stroke-width="${sw}"/>`;
  const aviso = (cls, html) => `<div class="aviso ${cls}" style="margin:10px 0 0">${html}</div>`;
  const seg = (cont, opciones, actual, rol) => `<div class="segmentado" data-rol="${rol}">${opciones.map((o) => `<button type="button" data-v="${o[0]}" class="${o[0] === actual ? 'activo' : ''}">${o[1]}</button>`).join('')}</div>`;
  const marcar = (cont, rol, valor) => cont.querySelectorAll(`[data-rol=${rol}] button`).forEach((b) => b.classList.toggle('activo', b.dataset.v === valor));

  II.diagramas.campo = (cont, opts = {}) => {
    cont.classList.add('diagrama');
    const lista = [{ id: 'mundos', t: '1 · Mando y potencia' }, { id: 'entrada', t: '2 · Una entrada' }, { id: 'sensor', t: '3 · Sensor de 3 hilos' }, { id: 'salida', t: '4 · Una salida' }, { id: 'estacion', t: '5 · Conecta tú' }];
    const ini = lista.some((x) => x.id === opts.pestana) ? opts.pestana : 'mundos';
    const Tb = PL.pestanas(cont, lista, ini);
    const raiz = (id) => Tb.raiz(id);
    const limpiezas = [];

    // =======================================================
    // 1 · Mando y potencia
    // =======================================================
    (() => {
      const s = { modo: 'contactor', q: false };
      raiz('mundos').innerHTML = `<div class="controles">
          ${seg(null, [['directo', 'Motor directo a la salida'], ['contactor', 'Con contactor']], s.modo, 'modo')}
          <button type="button" class="boton primario" id="m-q">Poner Q = 1</button></div>
        <div class="diag-2col planta-grid"><div class="lienzo"><svg viewBox="0 0 640 360" id="m-svg"></svg></div><div class="panel-info" id="m-info"></div></div>`;
      const d = () => {
        const dir = s.modo === 'directo', on = s.q;
        const quema = dir && on, mueve = !dir && on;
        const svg = `
          <rect x="10" y="10" width="620" height="150" rx="10" fill="#eef4fc" stroke="#c9dbf3"/>${T(24, 32, 'MANDO: 24 V cc, poca corriente', { fuerte: 1, c: AZUL })}
          <rect x="10" y="190" width="620" height="160" rx="10" fill="#fdf3f1" stroke="#f2c2bb"/>${T(24, 212, 'POTENCIA: 380 V ca trifásica, decenas de amperios', { fuerte: 1, c: ROJO })}
          ${R(36, 56, 130, 84, '#fff', AZUL)}${T(101, 80, 'PLC', { a: 'middle', fuerte: 1 })}${T(101, 98, 'Salida Q (SD2.00)', { a: 'middle', z: 11 })}${T(101, 116, 'máx. 0,5 a 2 A', { a: 'middle', z: 11, c: AMBAR })}
          ${dir
            ? `${P('M166 98 H470 V230', quema ? ROJO : GRIS, 4)}${T(318, 90, 'cable de 24 V directo al motor', { a: 'middle', z: 11 })}`
            : `${P('M166 98 H266', on ? AZUL : GRIS, 4)}${R(266, 66, 110, 64, on ? '#d9f0e3' : '#fff', on ? VERDE : OSC)}${T(321, 90, 'Contactor KM1', { a: 'middle', fuerte: 1, z: 12 })}${T(321, 108, 'bobina 24 V cc', { a: 'middle', z: 11 })}${T(321, 124, on ? 'energizada' : 'sin energía', { a: 'middle', z: 11, c: on ? VERDE : '#7a8596' })}`}
          ${R(36, 260, 110, 56, '#fff', ROJO)}${T(91, 283, 'Red 380 V', { a: 'middle', fuerte: 1 })}${T(91, 301, '3 fases', { a: 'middle', z: 11 })}
          ${dir
            ? `${P('M146 288 H420', GRIS, 4)}`
            : `${P('M146 288 H266', mueve ? ROJO : GRIS, 4)}${R(266, 262, 110, 52, mueve ? '#fff6e6' : '#fff', OSC)}${T(321, 284, 'Contactos', { a: 'middle', fuerte: 1, z: 12 })}${T(321, 302, mueve ? 'cerrados' : 'abiertos', { a: 'middle', z: 11 })}${L(321, 130, 321, 262, on ? AZUL : GRIS, 2, 'stroke-dasharray="5 5"')}${T(331, 200, 'acciona', { z: 11, c: '#7a8596' })}${P('M376 288 H470', mueve ? ROJO : GRIS, 4)}`}
          ${R(470, 236, 140, 100, quema ? '#fdecea' : mueve ? '#d9f0e3' : '#fff', quema ? ROJO : mueve ? VERDE : OSC, 2.4, 10)}${T(540, 262, 'Motor', { a: 'middle', fuerte: 1 })}${T(540, 280, '7,5 kW', { a: 'middle', z: 11 })}${T(540, 297, 'unos 15 A', { a: 'middle', z: 11, c: AMBAR })}${T(540, 322, quema ? 'no arranca' : mueve ? 'en marcha' : 'detenido', { a: 'middle', z: 12, c: quema ? ROJO : mueve ? VERDE : '#7a8596' })}
          ${quema ? `${T(318, 140, '✕', { a: 'middle', z: 38, c: ROJO })}` : ''}`;
        raiz('mundos').querySelector('#m-svg').innerHTML = svg;
        raiz('mundos').querySelector('#m-q').textContent = on ? 'Poner Q = 0' : 'Poner Q = 1';
        raiz('mundos').querySelector('#m-info').innerHTML = `<h4>Dos mundos que no se mezclan</h4>
          <p>El PLC trabaja en <b>mando</b>: 24 V cc y corrientes de miliamperios a 2 A. El motor trabaja en <b>potencia</b>: 380 V y decenas de amperios.</p>
          <p>El <b>contactor</b> es el puente: su bobina (mando) cierra unos contactos fuertes (potencia). El PLC solo energiza la bobina.</p>
          ${quema ? aviso('mal', '<b>Así no.</b> La salida entrega unos 0,5 a 2 A a 24 V; el motor pide unos 15 A a 380 V. La salida se daña y el motor ni siquiera recibe su tensión.')
            : dir ? aviso('info', 'Con el motor directo no hay forma de que funcione. Pon Q = 1 para ver qué pasa.')
            : mueve ? aviso('ok', '<b>Correcto.</b> Q = 1 energiza la bobina de KM1, los contactos cierran y el motor recibe sus 380 V.')
            : aviso('info', 'Pon Q = 1 y mira cómo el mando de 24 V cierra el circuito de potencia.')}
          <p class="nota" style="margin-top:8px">Valores típicos; en cada equipo manda su hoja de datos.</p>`;
      };
      const r = raiz('mundos');
      r.querySelector('[data-rol=modo]').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; s.modo = b.dataset.v; marcar(r, 'modo', s.modo); d(); };
      r.querySelector('#m-q').onclick = () => { s.q = !s.q; d(); };
      d();
    })();

    // =======================================================
    // 2 · Una entrada: circuito cerrado, común, NA y NC
    // =======================================================
    (() => {
      const s = { tipo: 'NA', pulsado: false, cutCom: false, cutSig: false };
      const r = raiz('entrada');
      r.innerHTML = `<div class="controles">
          ${seg(null, [['NA', 'Pulsador NA (marcha)'], ['NC', 'Pulsador NC (paro)']], s.tipo, 'tipo')}
          <button type="button" class="boton" id="e-p">Pulsar</button>
          <button type="button" class="boton" id="e-sig">Cortar cable de señal</button>
          <button type="button" class="boton" id="e-com">Cortar cable del común</button></div>
        <div class="diag-2col planta-grid"><div class="lienzo"><svg viewBox="0 0 640 340" id="e-svg"></svg></div><div class="panel-info" id="e-info"></div></div>`;
      const d = () => {
        const cerrado = s.tipo === 'NA' ? s.pulsado : !s.pulsado;   // estado del contacto físico
        const flujo = cerrado && !s.cutCom && !s.cutSig;
        const bit = flujo ? 1 : 0;
        const c = (v) => (v ? VERDE : GRIS);
        const xs = 150;
        const svg = `
          ${L(30, 40, 610, 40, ROJO, 3)}${T(34, 30, '+24 V', { fuerte: 1, c: ROJO })}
          ${L(30, 310, 610, 310, AZUL, 3)}${T(34, 328, '0 V (común)', { fuerte: 1, c: AZUL })}
          ${/* pulsador */ ''}${L(xs, 40, xs, 100, c(flujo), flujo ? 4 : 2.4)}
          ${s.tipo === 'NA'
            ? `${L(xs, 100, xs, 125, OSC)}${s.pulsado ? L(xs, 125, xs, 165, OSC, 3) : L(xs, 125, xs + 20, 155, OSC, 3)}${L(xs, 165, xs, 190, OSC)}`
            : `${L(xs, 100, xs, 125, OSC)}${s.pulsado ? L(xs, 125, xs + 20, 155, OSC, 3) : L(xs, 125, xs, 165, OSC, 3)}${L(xs, 165, xs, 190, OSC)}${L(xs - 14, 140, xs + 14, 140, OSC, 1.6)}`}
          ${T(xs - 16, 150, s.tipo === 'NA' ? 'NA' : 'NC', { a: 'end', fuerte: 1 })}${T(xs + 30, 120, s.pulsado ? 'pulsado' : 'en reposo', { z: 11 })}${T(xs + 30, 136, cerrado ? 'contacto cerrado' : 'contacto abierto', { z: 11, c: cerrado ? VERDE : '#7a8596' })}
          ${P(`M${xs} 190 V240 H330`, s.cutSig ? 'none' : c(flujo), flujo ? 4 : 2.4)}
          ${s.cutSig ? `${P(`M${xs} 190 V240 H230`, GRIS, 2.4)}${P('M262 240 H330', GRIS, 2.4)}${T(246, 232, '✕', { a: 'middle', z: 20, c: ROJO })}` : ''}
          ${R(330, 120, 210, 190, '#fff', OSC, 2.4, 10)}${T(435, 142, 'Módulo de entradas', { a: 'middle', fuerte: 1, z: 12 })}
          ${T(342, 232, 'ED1.00', { mono: 1, fuerte: 1, z: 12 })}${L(330, 240, 380, 240, c(flujo), flujo ? 4 : 2.4)}
          ${R(380, 226, 60, 28, '#fff', OSC, 1.6, 4)}${T(410, 244, 'LED', { a: 'middle', z: 11 })}${L(440, 240, 480, 240, c(flujo), flujo ? 4 : 2.4)}${P('M480 240 V310', s.cutCom ? 'none' : c(flujo), flujo ? 4 : 2.4)}
          ${s.cutCom ? `${P('M480 240 V268', GRIS, 2.4)}${P('M480 290 V310', GRIS, 2.4)}${T(496, 282, '✕', { z: 20, c: ROJO })}` : ''}
          ${T(488, 214, 'COM', { mono: 1, z: 11 })}
          ${T(435, 172, 'bit ED1.00', { a: 'middle', z: 11 })}${R(395, 180, 80, 36, bit ? '#e7f0fb' : '#f0f3f7', bit ? AZUL : GRIS, 2, 6)}${T(435, 206, String(bit), { a: 'middle', z: 24, fuerte: 1, c: bit ? AZUL : '#7a8596' })}
          ${T(30, 190 + 0, '', {})}`;
        r.querySelector('#e-svg').innerHTML = svg;
        r.querySelector('#e-p').textContent = s.pulsado ? 'Soltar' : 'Pulsar';
        const filas = s.tipo === 'NA' ? [['En reposo', 'abierto', 0], ['Pulsado', 'cerrado', 1]] : [['En reposo', 'cerrado', 1], ['Pulsado', 'abierto', 0]];
        let msg;
        if (s.cutCom) msg = aviso('mal', '<b>Cable del común cortado:</b> el circuito no se cierra nunca. El bit se queda en <b>0</b> aunque pulses.');
        else if (s.cutSig) msg = s.tipo === 'NC' ? aviso('ok', '<b>Cable de señal cortado:</b> el PLC lee <b>0</b>, igual que si alguien pulsara el paro. Es una falla que <b>detiene</b> la máquina: por eso el paro se cablea NC.') : aviso('mal', '<b>Cable de señal cortado:</b> el bit queda en 0. Con un pulsador de marcha NA nadie se entera de que el cable está roto.');
        else msg = aviso(bit ? 'ok' : 'info', bit ? '<b>Hay corriente</b> por el LED del módulo: el bit vale <b>1</b>.' : 'No pasa corriente: el bit vale <b>0</b>.');
        r.querySelector('#e-info').innerHTML = `<h4>El bit es «hay corriente»</h4>
          <p>Para que una entrada valga 1 debe cerrarse un camino completo: <b>+24 V, contacto, borne, LED del módulo, común y 0 V</b>. No vale «se pulsó»: vale «pasa corriente».</p>
          <table class="tabla-mini"><thead><tr><th>${s.tipo}</th><th>Contacto</th><th>Bit</th></tr></thead><tbody>${filas.map((f) => `<tr><td>${f[0]}</td><td>${f[1]}</td><td><b>${f[2]}</b></td></tr>`).join('')}</tbody></table>
          ${msg}`;
      };
      r.querySelector('[data-rol=tipo]').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; s.tipo = b.dataset.v; s.pulsado = false; marcar(r, 'tipo', s.tipo); d(); };
      r.querySelector('#e-p').onclick = () => { s.pulsado = !s.pulsado; d(); };
      r.querySelector('#e-sig').onclick = (e) => { s.cutSig = !s.cutSig; e.target.textContent = s.cutSig ? 'Reparar cable de señal' : 'Cortar cable de señal'; d(); };
      r.querySelector('#e-com').onclick = (e) => { s.cutCom = !s.cutCom; e.target.textContent = s.cutCom ? 'Reparar cable del común' : 'Cortar cable del común'; d(); };
      d();
    })();

    // =======================================================
    // 3 · Sensor de 3 hilos: PNP / NPN y módulo
    // =======================================================
    (() => {
      const s = { tipo: 'PNP', sal: 'NA', mod: '0V', obj: false };
      const r = raiz('sensor');
      r.innerHTML = `<div class="controles">
          ${seg(null, [['PNP', 'Sensor PNP'], ['NPN', 'Sensor NPN']], s.tipo, 'tipo')}
          ${seg(null, [['NA', 'Salida NA'], ['NC', 'Salida NC']], s.sal, 'sal')}
          ${seg(null, [['0V', 'Módulo: común a 0 V'], ['24V', 'Módulo: común a +24 V']], s.mod, 'mod')}
          <button type="button" class="boton" id="s-o">Acercar el objeto</button></div>
        <div class="diag-2col planta-grid"><div class="lienzo"><svg viewBox="0 0 640 340" id="s-svg"></svg></div><div class="panel-info" id="s-info"></div></div>`;
      const d = () => {
        const pnp = s.tipo === 'PNP';
        const compat = (pnp && s.mod === '0V') || (!pnp && s.mod === '24V');
        const activo = s.sal === 'NA' ? s.obj : !s.obj;      // la salida del sensor conduce
        const flujo = compat && activo;
        const c = (v) => (v ? VERDE : GRIS), w = (v) => (v ? 4 : 2.4);
        const comRail = s.mod === '0V' ? 310 : 40;
        const svg = `
          ${L(30, 40, 610, 40, ROJO, 3)}${T(34, 30, '+24 V', { fuerte: 1, c: ROJO })}
          ${L(30, 310, 610, 310, AZUL, 3)}${T(34, 328, '0 V', { fuerte: 1, c: AZUL })}
          ${R(60, 90, 170, 170, '#fff', OSC, 2.4, 10)}${T(145, 112, `Sensor ${s.tipo}`, { a: 'middle', fuerte: 1 })}${T(145, 128, `salida ${s.sal}`, { a: 'middle', z: 11 })}
          ${/* hilos */ ''}${P('M230 150 H262 V40', flujo && pnp ? VERDE : GRIS, w(flujo && pnp))}${T(238, 144, 'marrón +', { z: 10, c: '#8a5a2b' })}
          ${P('M230 230 H262 V310', flujo && !pnp ? VERDE : GRIS, w(flujo && !pnp))}${T(238, 248, 'azul 0 V', { z: 10, c: AZUL })}
          ${L(230, 190, 420, 190, c(flujo), w(flujo))}${T(300, 182, 'negro: señal', { z: 10 })}
          ${/* interruptor interno */ ''}${pnp
            ? `${L(150, 150, 150, 168, OSC)}${activo ? L(150, 168, 150, 190, OSC, 3) : L(150, 168, 168, 186, OSC, 3)}${L(150, 190, 150, 190, OSC)}${L(60 + 90, 190, 230, 190, OSC)}${L(150, 150, 230, 150, OSC)}`
            : `${L(150, 190, 150, 205, OSC)}${activo ? L(150, 205, 150, 228, OSC, 3) : L(150, 205, 168, 224, OSC, 3)}${L(150, 190, 230, 190, OSC)}${L(150, 230, 230, 230, OSC)}`}
          ${T(100, 172, pnp ? 'une + con señal' : '', { z: 10, a: 'middle', c: '#7a8596' })}${T(100, 226, !pnp ? 'une señal con 0 V' : '', { z: 10, a: 'middle', c: '#7a8596' })}
          ${R(420, 100, 170, 160, '#fff', compat ? OSC : ROJO, 2.4, 10)}${T(505, 122, 'Módulo de entradas', { a: 'middle', fuerte: 1, z: 12 })}
          ${T(428, 214, 'ED1.00', { mono: 1, z: 11 })}${R(455, 168, 50, 24, '#fff', OSC, 1.6, 4)}${T(480, 185, 'LED', { a: 'middle', z: 10 })}
          ${L(420, 190, 455, 190, c(flujo), w(flujo))}${L(505, 190, 540, 190, c(flujo), w(flujo))}${L(540, 190, 540, 220, c(flujo), w(flujo))}${L(540, 220, 590, 220, c(flujo), w(flujo))}
          ${T(548, 238, 'COM', { mono: 1, z: 11 })}${P(`M590 220 H606 V${comRail}`, flujo ? VERDE : GRIS, w(flujo))}
          ${s.mod === '24V' ? T(540, 62, 'común a +24 V', { a: 'end', z: 11, c: ROJO }) : T(540, 296, 'común a 0 V', { a: 'end', z: 11, c: AZUL })}
          ${R(455, 138, 80, 26, flujo ? '#e7f0fb' : '#f0f3f7', flujo ? AZUL : GRIS, 1.8, 6)}${T(495, 156, `bit = ${flujo ? 1 : 0}`, { a: 'middle', z: 13, fuerte: 1, c: flujo ? AZUL : '#7a8596' })}
          ${!compat ? T(505, 280, '✕ no se entienden', { a: 'middle', z: 13, fuerte: 1, c: ROJO }) : ''}`;
        r.querySelector('#s-svg').innerHTML = svg;
        r.querySelector('#s-o').textContent = s.obj ? 'Alejar el objeto' : 'Acercar el objeto';
        const regla = pnp ? 'Un sensor <b>PNP</b> entrega <b>+24 V</b> por el hilo de señal cuando conduce; necesita un módulo con el <b>común a 0 V</b>.' : 'Un sensor <b>NPN</b> lleva la señal a <b>0 V</b> cuando conduce; necesita un módulo con el <b>común a +24 V</b>.';
        r.querySelector('#s-info').innerHTML = `<h4>PNP, NPN y el común del módulo</h4>
          <p>${regla}</p>
          <p><b>NA</b>: la salida conduce al detectar el objeto. <b>NC</b>: conduce mientras <i>no</i> hay objeto y se corta al detectarlo.</p>
          ${compat
            ? aviso(flujo ? 'ok' : 'info', flujo ? '<b>Hay corriente:</b> el bit vale <b>1</b>.' : `Sensor y módulo son compatibles; ahora la salida no conduce (${s.sal === 'NA' ? 'no hay objeto' : 'hay objeto'}) y el bit vale <b>0</b>.`)
            : aviso('mal', '<b>Incompatibles.</b> El camino de corriente nunca se completa: el bit vale <b>0</b> siempre, aunque el sensor funcione bien. Es un error frecuente al cambiar de marca.')}
          <p class="nota" style="margin-top:8px">Los nombres «sink» y «source» se usan distinto según el fabricante: revisa el manual del módulo.</p>`;
      };
      ['tipo', 'sal', 'mod'].forEach((rol) => { r.querySelector(`[data-rol=${rol}]`).onclick = (e) => { const b = e.target.closest('button'); if (!b) return; s[rol] = b.dataset.v; marcar(r, rol, s[rol]); d(); }; });
      r.querySelector('#s-o').onclick = () => { s.obj = !s.obj; d(); };
      d();
    })();

    // =======================================================
    // 4 · Una salida: relé o transistor, y la carga
    // =======================================================
    (() => {
      const TIPOS = {
        rele: { n: 'Relé', max: 2, ca: true, cc: true, rapida: false, txt: ['Sirve con corriente alterna y continua (hasta unos 250 V)', 'Aguanta unos 2 A por canal', 'Contacto aislado: separa el PLC de la carga', 'Lento (unos 10 ms) y se desgasta con las maniobras'] },
        trans: { n: 'Transistor', max: 0.5, ca: false, cc: true, rapida: true, txt: ['Solo corriente continua (24 V cc)', 'Aguanta unos 0,5 A por canal', 'Muy rápido y sin desgaste', 'Con cargas inductivas necesita un diodo en paralelo'] }
      };
      const CARGAS = [
        { n: 'Bobina de contactor, 24 V cc', v: 'cc', i: 0.1, ind: true },
        { n: 'Bobina de contactor, 220 V ca', v: 'ca', i: 0.05, ind: true },
        { n: 'Lámpara piloto, 24 V cc', v: 'cc', i: 0.05 },
        { n: 'Electroválvula, 24 V cc', v: 'cc', i: 0.45, ind: true },
        { n: 'Válvula dosificadora pulsada a 50 veces por segundo, 24 V cc', v: 'cc', i: 0.2, ind: true, rapida: true },
        { n: 'Resistencia calefactora, 220 V ca, 8 A', v: 'ca', i: 8 },
        { n: 'Motor de 7,5 kW, 380 V ca, 15 A', v: 'ca', i: 15, ind: true }
      ];
      const s = { tipo: 'rele', carga: 0 };
      const r = raiz('salida');
      r.innerHTML = `<div class="controles">${seg(null, [['rele', 'Salida a relé'], ['trans', 'Salida a transistor']], s.tipo, 'tipo')}</div>
        <label class="campo" style="margin:0"><span>Carga que quieres conectar</span><select class="entrada" id="o-car">${CARGAS.map((c, i) => `<option value="${i}">${c.n}</option>`).join('')}</select></label>
        <div class="diag-2col planta-grid"><div class="lienzo"><svg viewBox="0 0 640 250" id="o-svg"></svg></div><div class="panel-info" id="o-info"></div></div>`;
      const d = () => {
        const tp = TIPOS[s.tipo], ca = CARGAS[s.carga];
        const motivos = [], avisos = [];
        if (ca.v === 'ca' && !tp.ca) motivos.push('La carga es de corriente alterna y esta salida solo maneja corriente continua.');
        if (ca.i > tp.max) motivos.push(`La carga toma ${II.fmt(ca.i)} A y la salida aguanta unos ${II.fmt(tp.max)} A.`);
        if (ca.rapida && !tp.rapida) motivos.push('Se acciona muy seguido: un relé es lento y se desgastaría en poco tiempo.');
        const ok = motivos.length === 0;
        if (ok && ca.i > tp.max * 0.8) avisos.push('Funciona, pero al límite de la corriente: conviene un relé auxiliar.');
        if (ok && s.tipo === 'trans' && ca.ind) avisos.push('Es una carga inductiva: pon un <b>diodo en paralelo</b> con la bobina para proteger el transistor.');
        if (ok && s.tipo === 'rele' && ca.ind && ca.v === 'ca' && ca.i > 1) avisos.push('Carga inductiva grande: usa un contactor.');
        const k = Math.min(1.6, ca.i / tp.max);
        const barra = `<rect x="40" y="170" width="420" height="22" rx="11" fill="#f0f3f7" stroke="#cbd3dd"/><rect x="40" y="170" width="${Math.max(6, Math.round(420 * Math.min(1, k)))}" height="22" rx="11" fill="${k > 1 ? ROJO : k > 0.8 ? AMBAR : VERDE}"/>
          ${T(40, 212, `Corriente de la carga: ${II.fmt(ca.i)} A`, { z: 12 })}${T(460, 212, `límite de la salida: ${II.fmt(tp.max)} A`, { a: 'end', z: 12 })}${k > 1 ? T(470, 186, '¡pasa el límite!', { c: ROJO, fuerte: 1, z: 12 }) : ''}`;
        r.querySelector('#o-svg').innerHTML = `
          ${R(30, 30, 160, 100, '#fff', OSC, 2.4, 10)}${T(110, 56, 'Módulo de salidas', { a: 'middle', fuerte: 1, z: 12 })}${T(110, 76, tp.n, { a: 'middle', z: 12, c: AZUL })}${T(110, 100, 'SD2.00', { a: 'middle', mono: 1, z: 12 })}
          ${P('M190 80 H330', ok ? VERDE : ROJO, 4)}${R(330, 40, 230, 80, ok ? '#e3f4eb' : '#fdecea', ok ? VERDE : ROJO, 2.4, 10)}${T(445, 70, ca.n.length > 34 ? ca.n.slice(0, 32) + '…' : ca.n, { a: 'middle', z: 11 })}${T(445, 94, ok ? '✓ la salida puede manejarla' : '✕ no la puede manejar', { a: 'middle', fuerte: 1, z: 12, c: ok ? VERDE : ROJO })}
          ${barra}`;
        r.querySelector('#o-info').innerHTML = `<h4>${tp.n}: qué puede manejar</h4>
          <ul style="padding-left:18px;margin:0 0 8px">${tp.txt.map((t) => `<li>${t}</li>`).join('')}</ul>
          ${ok ? aviso('ok', '<b>Sí se puede.</b>') : aviso('mal', '<b>No se puede.</b><ul style="margin:6px 0 0;padding-left:18px">' + motivos.map((m) => `<li>${m}</li>`).join('') + '</ul>')}
          ${avisos.map((a) => aviso('duda', a)).join('')}
          ${!ok ? '<p class="nota" style="margin-top:8px">Salida: la salida del PLC comanda un <b>contactor o un relé auxiliar</b>, y ese maneja la carga.</p>' : ''}
          <p class="nota" style="margin-top:8px">Valores típicos; en cada módulo manda su hoja de datos.</p>`;
      };
      r.querySelector('[data-rol=tipo]').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; s.tipo = b.dataset.v; marcar(r, 'tipo', s.tipo); d(); };
      r.querySelector('#o-car').onchange = (e) => { s.carga = Number(e.target.value); d(); };
      d();
    })();

    // =======================================================
    // 5 · Conecta tú: la estación de bombeo
    // =======================================================
    (() => {
      const ENT = [
        { id: 'S1', n: 'Pulsador de marcha (verde)', nc: false }, { id: 'S2', n: 'Pulsador de paro (rojo)', nc: true }, { id: 'S3', n: 'Paro de emergencia (hongo)', nc: true },
        { id: 'LSH', n: 'Flotador de nivel alto', nc: false }, { id: 'LSL', n: 'Flotador de nivel bajo', nc: false }, { id: 'FR1', n: 'Relé térmico de la bomba', nc: true }
      ];
      const SAL = [{ id: 'KM1', n: 'Contactor de la bomba' }, { id: 'H1', n: 'Lámpara verde: bomba en marcha' }, { id: 'H2', n: 'Lámpara roja: falla' }];
      const TED = ['ED1.00', 'ED1.01', 'ED1.02', 'ED1.03', 'ED1.04', 'ED1.05', 'ED1.06', 'ED1.07'], TSD = ['SD2.00', 'SD2.01', 'SD2.02', 'SD2.03'];
      const s = { sel: null, cab: {}, acc: {}, ord: {}, msg: '' };
      const r = raiz('estacion');
      r.innerHTML = `<div class="diag-2col planta-grid"><div>
          <p class="sub" style="margin:0 0 8px">Toca un dispositivo y luego el terminal del módulo donde lo conectas. Después acciona los dispositivos y mira el bit; en las salidas, ordena un 1 y mira quién responde.</p>
          <div class="controles" style="margin-bottom:8px"><button type="button" class="boton chico" id="c-ej">Poner un ejemplo</button><button type="button" class="boton chico" id="c-lim">Borrar conexiones</button></div>
          <div id="c-msg"></div>
          <div class="etiqueta" style="margin:8px 0 4px">Entradas del campo</div><div id="c-ent" style="display:grid;gap:6px"></div>
          <div class="etiqueta" style="margin:12px 0 4px">Salidas hacia el campo</div><div id="c-sal" style="display:grid;gap:6px"></div></div>
        <div><div class="etiqueta" style="margin:0 0 4px">Terminales del módulo de entradas (ranura 1)</div><div id="c-ted" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px"></div>
          <div class="etiqueta" style="margin:12px 0 4px">Terminales del módulo de salidas (ranura 2)</div><div id="c-tsd" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px"></div>
          <div class="etiqueta" style="margin:12px 0 4px">Tabla de asignación que resulta</div><div id="c-tabla"></div></div></div>`;
      const termDe = (id) => s.cab[id] || null;
      const dispDe = (t) => Object.keys(s.cab).find((k) => s.cab[k] === t) || null;
      const esEnt = (id) => ENT.some((e) => e.id === id);
      const bit = (e) => { const t = termDe(e.id); if (!t) return null; const cerrado = e.nc ? !s.acc[e.id] : !!s.acc[e.id]; return cerrado ? 1 : 0; };
      const d = () => {
        r.querySelector('#c-msg').innerHTML = s.msg ? aviso('duda', s.msg) : '';
        const fila = (x, sal) => {
          const t = termDe(x.id), sel = s.sel === x.id;
          const info = sal ? '' : ` <span class="chip ${x.nc ? 'duda' : ''}" style="font-size:.72rem">${x.nc ? 'NC' : 'NA'}</span>`;
          let acc = '';
          if (t && !sal) acc = `<button type="button" class="boton chico" data-acc="${x.id}">${s.acc[x.id] ? 'Soltar' : 'Accionar'}</button><span class="valor" title="bit en ${t}">${t} = ${bit(x)}</span>`;
          if (t && sal) acc = `<button type="button" class="boton chico" data-ord="${t}">${s.ord[t] ? `Poner ${t} = 0` : `Poner ${t} = 1`}</button>`;
          return `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;border:1px solid ${sel ? AZUL : 'var(--borde)'};background:${sel ? '#e7f0fb' : '#fff'};border-radius:10px;padding:7px 9px">
            <button type="button" class="boton chico ${sel ? 'primario' : ''}" data-d="${x.id}" style="flex:1 1 170px;text-align:left"><b>${x.id}</b> ${x.n}${info}</button>${t ? `<span class="chip ok">${t}</span>` : '<span class="nota">sin conectar</span>'}${acc}</div>`;
        };
        r.querySelector('#c-ent').innerHTML = ENT.map((x) => fila(x, false)).join('');
        r.querySelector('#c-sal').innerHTML = SAL.map((x) => fila(x, true)).join('');
        const term = (t) => { const dd = dispDe(t); return `<button type="button" class="boton chico ${dd ? '' : ''}" data-t="${t}" style="font-family:var(--mono);${dd ? 'background:#e3f4eb;border-color:#bfe3cf' : ''}">${t}<br><span style="font-size:.7rem;font-family:inherit">${dd || 'libre'}</span></button>`; };
        r.querySelector('#c-ted').innerHTML = TED.map(term).join('');
        r.querySelector('#c-tsd').innerHTML = TSD.map(term).join('');
        const filas = [...ENT, ...SAL].filter((x) => termDe(x.id)).sort((a, b) => termDe(a.id).localeCompare(termDe(b.id)));
        let respuestas = '';
        SAL.forEach((x) => { const t = termDe(x.id); if (t && s.ord[t]) respuestas += `<li>Con <b>${t} = 1</b> responde: <b>${x.id}</b> (${x.n.toLowerCase()}).</li>`; });
        Object.keys(s.ord).filter((t) => s.ord[t] && !dispDe(t)).forEach((t) => { respuestas += `<li>Con ${t} = 1 no responde nada: no hay nada cableado ahí.</li>`; });
        r.querySelector('#c-tabla').innerHTML = filas.length
          ? `<table class="tabla-mini"><thead><tr><th>Dirección</th><th>Dispositivo</th><th>En reposo</th></tr></thead><tbody>${filas.map((x) => `<tr><td class="mono"><b>${termDe(x.id)}</b></td><td>${x.id} ${x.n}</td><td>${esEnt(x.id) ? (x.nc ? '1 (NC)' : '0 (NA)') : 'orden del programa'}</td></tr>`).join('')}</tbody></table>
            ${respuestas ? `<p class="nota" style="margin:8px 0 0"><b>Quién responde:</b></p><ul style="margin:4px 0 0;padding-left:18px;font-size:.92rem">${respuestas}</ul>` : ''}`
          : '<p class="nota" style="margin:0">Todavía no conectaste nada.</p>';
      };
      const conectar = (id, t) => {
        s.msg = '';
        const sal = !esEnt(id);
        if (sal !== t.startsWith('SD')) { s.msg = sal ? 'Una salida va a un terminal del módulo de salidas (SD).' : 'Una entrada va a un terminal del módulo de entradas (ED).'; return; }
        const ocupado = dispDe(t);
        if (ocupado && ocupado !== id) { s.msg = `El terminal ${t} ya tiene conectado a ${ocupado}. Un terminal, un dispositivo.`; return; }
        s.cab[id] = t; s.sel = null;
      };
      r.addEventListener('click', (e) => {
        const bd = e.target.closest('[data-d]'), bt = e.target.closest('[data-t]'), ba = e.target.closest('[data-acc]'), bo = e.target.closest('[data-ord]');
        if (ba) { s.acc[ba.dataset.acc] = !s.acc[ba.dataset.acc]; return d(); }
        if (bo) { s.ord[bo.dataset.ord] = !s.ord[bo.dataset.ord]; return d(); }
        if (bd) { const id = bd.dataset.d; if (s.cab[id] && s.sel !== id) { delete s.cab[id]; s.sel = id; } else s.sel = s.sel === id ? null : id; s.msg = ''; return d(); }
        if (bt) {
          const t = bt.dataset.t;
          if (s.sel) conectar(s.sel, t);
          else if (dispDe(t)) { s.sel = dispDe(t); delete s.cab[s.sel]; s.msg = ''; }
          else s.msg = 'Primero toca el dispositivo que quieres conectar.';
          return d();
        }
      });
      r.querySelector('#c-ej').onclick = () => { s.cab = { S1: 'ED1.00', S2: 'ED1.01', S3: 'ED1.02', LSH: 'ED1.03', LSL: 'ED1.04', FR1: 'ED1.05', KM1: 'SD2.00', H1: 'SD2.01', H2: 'SD2.02' }; s.sel = null; s.msg = ''; d(); };
      r.querySelector('#c-lim').onclick = () => { s.cab = {}; s.acc = {}; s.ord = {}; s.sel = null; s.msg = ''; d(); };
      d();
    })();

    return { destruir() { limpiezas.forEach((f) => f()); }, pestana: Tb.pestana };
  };

  // atajos con pestaña fija
  ['mundos', 'entrada', 'sensor', 'salida', 'estacion'].forEach((id) => { II.diagramas['campo_' + id] = (cont, o = {}) => II.diagramas.campo(cont, { ...o, pestana: id }); });
})();
