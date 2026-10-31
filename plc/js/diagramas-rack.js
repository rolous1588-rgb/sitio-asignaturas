// ============================================================
// Diagrama del rack y direccionamiento de E/S — Sesión 1, Bloque C
//   II.diagramas.rack → asignar señales a canales, direcciones genéricas,
//                       equivalencias con otras marcas, casos especiales y exportar la tabla
// Notación genérica del módulo:  TIPO + ranura + "." + canal    (ED1.05 = entrada digital, ranura 1, canal 5)
//   ED entrada digital; SD salida digital; EA entrada analógica; SA salida analógica
// Las equivalencias con otras marcas son ILUSTRATIVAS: la numeración real depende del modelo
// y de la configuración de hardware. Siempre se confirma en el manual.
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  II.diagramas = II.diagramas || {};
  const PL = (II.pl = II.pl || {});
  const esc = (s) => II.esc(s);

  // Módulos del rack de ejemplo (ranura 0 = CPU)
  PL.RACK = [
    { slot: 0, tipo: 'CPU', n: 0, nombre: 'CPU' },
    { slot: 1, tipo: 'ED', n: 16, nombre: 'Entradas digitales' },
    { slot: 2, tipo: 'SD', n: 16, nombre: 'Salidas digitales' },
    { slot: 3, tipo: 'EA', n: 4, nombre: 'Entradas analógicas' },
    { slot: 4, tipo: 'SA', n: 2, nombre: 'Salidas analógicas' }
  ];
  PL.TIPO_NOMBRE = { ED: 'Entrada digital', SD: 'Salida digital', EA: 'Entrada analógica', SA: 'Salida analógica' };
  PL.COLOR_TIPO = { ED: '#1b8a5a', SD: '#e0782b', EA: '#1d5fb4', SA: '#7a4bb0' };

  // Señales de la estación de bombeo (tipo correcto de cada una)
  PL.SENALES = [
    { id: 'S1', n: 'Pulsador de marcha (verde, NA)', t: 'ED' },
    { id: 'S2', n: 'Pulsador de paro (rojo, NC)', t: 'ED' },
    { id: 'S3', n: 'Paro de emergencia (NC)', t: 'ED' },
    { id: 'LSH', n: 'Flotador de nivel alto', t: 'ED' },
    { id: 'LSL', n: 'Flotador de nivel bajo', t: 'ED' },
    { id: 'FR1', n: 'Relé térmico de la bomba (NC)', t: 'ED' },
    { id: 'SEL', n: 'Selector Manual / Automático', t: 'ED' },
    { id: 'KM1', n: 'Bobina del contactor de la bomba', t: 'SD' },
    { id: 'H1', n: 'Lámpara verde: bomba en marcha', t: 'SD' },
    { id: 'H2', n: 'Lámpara roja: falla', t: 'SD' },
    { id: 'HS', n: 'Sirena de alarma', t: 'SD' },
    { id: 'YV1', n: 'Electroválvula de entrada (todo/nada)', t: 'SD' },
    { id: 'LT101', n: 'Transmisor de nivel (4–20 mA)', t: 'EA' },
    { id: 'PT101', n: 'Transmisor de presión (4–20 mA)', t: 'EA' },
    { id: 'TT101', n: 'Transmisor de temperatura (4–20 mA)', t: 'EA' },
    { id: 'FT101', n: 'Transmisor de caudal (4–20 mA)', t: 'EA' },
    { id: 'FV101', n: 'Válvula de control de salida (4–20 mA)', t: 'SA' },
    { id: 'SC1', n: 'Referencia de velocidad al variador (0–10 V)', t: 'SA' }
  ];

  const p2 = (n) => String(n).padStart(2, '0');
  // dirección genérica: ED1.05
  PL.direccion = (tipo, slot, ch) => tipo + slot + '.' + (tipo === 'ED' || tipo === 'SD' ? p2(ch) : String(ch));
  // módulo que corresponde a un tipo en el rack dado (por defecto, el del ejemplo)
  PL.moduloDe = (tipo, rack) => (rack || PL.RACK).find((m) => m.tipo === tipo);

  // Equivalencias ILUSTRATIVAS con otras marcas
  PL.MARCAS = {
    iec: { n: 'IEC 61131-3 (estándar)', f: (t, s, c) => {
      const byte = (s - 1) * 2 + Math.floor(c / 8), bit = c % 8;
      return t === 'ED' ? `%IX${byte}.${bit}` : t === 'SD' ? `%QX${byte}.${bit}` : t === 'EA' ? `%IW${(s - 3) * 4 + c}` : `%QW${c}`;
    } },
    sie: { n: 'Siemens (S7)', f: (t, s, c) => {
      const byte = (s - 1) * 2 + Math.floor(c / 8), bit = c % 8;
      return t === 'ED' ? `I${byte}.${bit}  (E${byte}.${bit})` : t === 'SD' ? `Q${byte}.${bit}  (A${byte}.${bit})` : t === 'EA' ? `IW${64 + 2 * c}` : `QW${64 + 2 * c}`;
    } },
    ab: { n: 'Allen-Bradley (Logix)', f: (t, s, c) =>
      t === 'ED' ? `Local:${s}:I.Data[${c}]` : t === 'SD' ? `Local:${s}:O.Data[${c}]` : t === 'EA' ? `Local:${s}:I.Ch${c}Data` : `Local:${s}:O.Ch${c}Data` },
    mit: { n: 'Mitsubishi', f: (t, s, c) => {
      const h = ((s - 1) * 16 + c).toString(16).toUpperCase();
      return t === 'ED' ? `X${h}` : t === 'SD' ? `Y${h}` : t === 'EA' ? `D${100 + c}  (registro asignado)` : `D${200 + c}  (registro asignado)`;
    } },
    omr: { n: 'Omron', f: (t, s, c) =>
      t === 'ED' ? `${s - 1}.${p2(c)}` : t === 'SD' ? `${99 + s}.${p2(c)}` : t === 'EA' ? `D${c}  (área de datos)` : `D${100 + c}  (área de datos)` },
    sch: { n: 'Schneider (Modicon)', f: (t, s, c) =>
      t === 'ED' ? `%I${s}.${c}` : t === 'SD' ? `%Q${s}.${c}` : t === 'EA' ? `%IW${s}.${c}` : `%QW${s}.${c}` }
  };

  II.diagramas.rack = function (cont, opts = {}) {
    opts = opts || {};
    const T = PL.pestanas(cont, [
      { id: 'asig', t: 'Asignar canales' },
      { id: 'eq', t: 'Otras marcas' },
      { id: 'casos', t: 'Casos especiales' }
    ], opts.pestana && opts.pestana !== 'a' ? opts.pestana : 'asig');
    const asig = {};          // id de señal -> { slot, ch }
    let sel = null, msg = '';
    const ocupado = (slot, ch) => Object.keys(asig).find((k) => asig[k].slot === slot && asig[k].ch === ch);

    // ---------- Asignar ----------
    const A = T.raiz('asig');
    A.innerHTML = `
      <p class="sub" style="margin:0">1) Toca una señal de la lista. 2) Toca un canal libre del módulo que corresponde. La dirección aparece sola. Si te equivocas de tipo, el rack te avisa.</p>
      <div class="lienzo"><svg viewBox="0 0 780 150" id="rk-svg" role="img" aria-label="Rack con la CPU y cuatro módulos"></svg></div>
      <div id="rk-msg"></div>
      <div class="diag-2col rack-grid">
        <div><h4 style="margin:0 0 8px">Señales de la estación de bombeo</h4><div id="rk-sen" class="pl-senales"></div>
          <div class="controles" style="margin-top:10px"><button type="button" class="boton chico" id="rk-auto">Asignar automáticamente lo que falta</button><button type="button" class="boton chico" id="rk-lim">Limpiar</button></div></div>
        <div><h4 style="margin:0 0 8px">Módulos y canales</h4><div id="rk-mod"></div></div>
      </div>
      <div><h4 style="margin:6px 0 8px">Tabla de asignación</h4><div style="overflow:auto"><table class="pl-tabla" id="rk-tab"></table></div>
        <div class="controles" style="margin-top:8px"><button type="button" class="boton primario chico" id="rk-csv">Descargar la tabla (Excel / CSV)</button></div></div>`;
    const svg = () => {
      const colores = PL.COLOR_TIPO;
      let s = '<rect x="6" y="14" width="768" height="128" rx="12" fill="#f4f6f9" stroke="#cbd3dd" stroke-width="2"/>';
      PL.RACK.forEach((m, i) => {
        const x = 18 + i * 150, usados = m.n ? Object.values(asig).filter((a) => a.slot === m.slot).length : 0;
        const col = colores[m.tipo] || '#2f3b4a';
        s += `<rect x="${x}" y="24" width="138" height="108" rx="8" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/>`;
        s += `<rect x="${x}" y="24" width="138" height="22" rx="8" fill="${col}"/><text x="${x + 69}" y="40" text-anchor="middle" style="font:700 12px Inter,sans-serif;fill:#fff">${m.tipo === 'CPU' ? 'CPU' : 'Ranura ' + m.slot + '  ' + m.tipo}</text>`;
        if (m.n) {
          s += `<text x="${x + 69}" y="64" text-anchor="middle" class="svg-texto" style="font-size:11px">${m.n} canales</text>`;
          const cols = m.n > 8 ? 8 : m.n;
          for (let c = 0; c < m.n; c++) {
            const cx = x + 14 + (c % cols) * (m.n > 8 ? 15 : 28), cy = 82 + Math.floor(c / cols) * 16;
            const ocup = ocupado(m.slot, c);
            s += `<circle cx="${cx}" cy="${cy}" r="5" fill="${ocup ? col : '#e1e6ed'}" stroke="${ocup ? col : '#cbd3dd'}"/>`;
          }
          s += `<text x="${x + 69}" y="124" text-anchor="middle" class="svg-texto mono" style="font-size:11px">${usados} de ${m.n} en uso</text>`;
        } else {
          s += `<circle cx="${x + 24}" cy="70" r="5" fill="#1b8a5a"/><text x="${x + 34}" y="74" class="svg-texto" style="font-size:10px">RUN</text><rect x="${x + 22}" y="92" width="94" height="14" rx="3" fill="#fff" stroke="#8e99a6"/><text x="${x + 69}" y="103" text-anchor="middle" class="svg-texto mono" style="font-size:9px">ETHERNET</text>`;
        }
      });
      return s;
    };
    const pintar = () => {
      A.querySelector('#rk-svg').innerHTML = svg();
      A.querySelector('#rk-msg').innerHTML = msg;
      A.querySelector('#rk-sen').innerHTML = PL.SENALES.map((s) => {
        const a = asig[s.id];
        return `<button type="button" class="pl-sen ${sel === s.id ? 'sel' : ''} ${a ? 'hecha' : ''}" data-id="${s.id}" style="border-left-color:${PL.COLOR_TIPO[s.t]}"><b>${s.id}</b> ${esc(s.n)}<span class="chip ${a ? 'ok' : ''}">${a ? PL.direccion(s.t, a.slot, a.ch) : s.t}</span></button>`;
      }).join('');
      A.querySelector('#rk-mod').innerHTML = PL.RACK.filter((m) => m.n).map((m) => `
        <div class="pl-modulo" style="border-top-color:${PL.COLOR_TIPO[m.tipo]}">
          <div class="pl-mod-cab"><b>Ranura ${m.slot}; ${m.tipo}</b><span class="nota">${m.nombre}; ${m.n} canales</span></div>
          <div class="pl-canales">${Array.from({ length: m.n }, (_, c) => {
            const o = ocupado(m.slot, c);
            return `<button type="button" class="pl-canal ${o ? 'ocup' : ''}" data-slot="${m.slot}" data-ch="${c}" title="${PL.direccion(m.tipo, m.slot, c)}${o ? ' ← ' + o : ''}">${o ? `<small>${o}</small>` : c}</button>`;
          }).join('')}</div>
        </div>`).join('');
      A.querySelector('#rk-tab').innerHTML = `<thead><tr><th>Señal</th><th>Descripción</th><th>Tipo</th><th>Dirección genérica</th></tr></thead><tbody>${
        PL.SENALES.filter((s) => asig[s.id]).map((s) => `<tr><td><b>${s.id}</b></td><td>${esc(s.n)}</td><td>${s.t}</td><td class="mono">${PL.direccion(s.t, asig[s.id].slot, asig[s.id].ch)}</td></tr>`).join('') ||
        '<tr><td colspan="4" class="nota">Todavía no asignaste ninguna señal.</td></tr>'}</tbody>`;
    };
    const aviso = (t, tipo) => { msg = `<div class="aviso ${tipo}">${t}</div>`; };
    A.addEventListener('click', (e) => {
      const bs = e.target.closest('.pl-sen'), bc = e.target.closest('.pl-canal');
      if (bs) { sel = sel === bs.dataset.id ? null : bs.dataset.id; msg = ''; return pintar(); }
      if (bc) {
        const slot = +bc.dataset.slot, ch = +bc.dataset.ch, m = PL.RACK.find((x) => x.slot === slot);
        const o = ocupado(slot, ch);
        if (!sel) { aviso(o ? `El canal ${PL.direccion(m.tipo, slot, ch)} ya está ocupado por <b>${o}</b>. Toca una señal para moverla.` : 'Primero toca una señal de la lista.', 'duda'); return pintar(); }
        const s = PL.SENALES.find((x) => x.id === sel);
        if (s.t !== m.tipo) { aviso(`<b>${s.id}</b> es una <b>${PL.TIPO_NOMBRE[s.t].toLowerCase()}</b> (${s.t}); este módulo es de <b>${PL.TIPO_NOMBRE[m.tipo].toLowerCase()}</b> (${m.tipo}). No se puede conectar ahí.`, 'mal'); return pintar(); }
        if (o && o !== sel) { aviso(`El canal ya está ocupado por <b>${o}</b>. Cada canal sirve a una sola señal.`, 'mal'); return pintar(); }
        asig[sel] = { slot, ch };
        aviso(`<b>${sel}</b> quedó en <b>${PL.direccion(m.tipo, slot, ch)}</b>. En el programa se escribe con esa dirección.`, 'ok'); sel = null; return pintar();
      }
    });
    A.querySelector('#rk-lim').onclick = () => { Object.keys(asig).forEach((k) => delete asig[k]); sel = null; msg = ''; pintar(); };
    A.querySelector('#rk-auto').onclick = () => {
      PL.SENALES.forEach((s) => {
        if (asig[s.id]) return;
        const m = PL.moduloDe(s.t);
        for (let c = 0; c < m.n; c++) if (!ocupado(m.slot, c)) { asig[s.id] = { slot: m.slot, ch: c }; break; }
      });
      aviso('Asignación automática hecha: los canales se ocupan en orden. En un proyecto real conviene <b>agrupar</b> por función y <b>dejar canales de reserva</b>.', 'info'); pintar();
    };
    A.querySelector('#rk-csv').onclick = () => {
      const filas = [['Señal', 'Descripción', 'Tipo', 'Dirección genérica']].concat(PL.SENALES.filter((s) => asig[s.id]).map((s) => [s.id, s.n, s.t, PL.direccion(s.t, asig[s.id].slot, asig[s.id].ch)]));
      const csv = '﻿' + filas.map((f) => f.map((x) => '"' + String(x).replace(/"/g, '""') + '"').join(';')).join('\r\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      a.download = 'tabla-de-asignacion-es.csv'; document.body.appendChild(a); a.click(); a.remove();
    };
    pintar();

    // ---------- Otras marcas ----------
    const Q = T.raiz('eq');
    Q.innerHTML = `
      <p class="sub" style="margin:0">La misma señal se escribe distinto en cada fabricante. Elige una señal y mira cómo se llama en cada marca.</p>
      <div class="controles"><label class="campo" style="margin:0;flex:1 1 280px"><span>Señal</span><select class="entrada" id="eq-s">${PL.SENALES.map((s) => `<option value="${s.id}">${s.id}; ${esc(s.n)}</option>`).join('')}</select></label>
        <label class="campo" style="margin:0"><span>Canal</span><select class="entrada" id="eq-c"></select></label></div>
      <div style="overflow:auto"><table class="pl-tabla" id="eq-t"></table></div>
      <div class="aviso duda">Estas equivalencias son <b>ilustrativas</b>: la numeración exacta depende de la serie del equipo, de la posición del módulo y de la configuración de hardware. Siempre se confirma en el manual del fabricante.</div>`;
    const eq = () => {
      const s = PL.SENALES.find((x) => x.id === Q.querySelector('#eq-s').value), m = PL.moduloDe(s.t);
      const selC = Q.querySelector('#eq-c');
      if (selC.dataset.t !== s.t) { selC.innerHTML = Array.from({ length: m.n }, (_, c) => `<option>${c}</option>`).join(''); selC.dataset.t = s.t; }
      const c = +selC.value || 0;
      Q.querySelector('#eq-t').innerHTML = `<thead><tr><th>Sistema</th><th>Dirección</th></tr></thead><tbody>
        <tr><td><b>Genérica (este curso)</b></td><td class="mono"><b>${PL.direccion(s.t, m.slot, c)}</b></td></tr>
        ${Object.keys(PL.MARCAS).map((k) => `<tr><td>${PL.MARCAS[k].n}</td><td class="mono">${esc(PL.MARCAS[k].f(s.t, m.slot, c))}</td></tr>`).join('')}</tbody>`;
    };
    Q.querySelector('#eq-s').onchange = eq; Q.querySelector('#eq-c').onchange = eq;
    eq();

    // ---------- Casos especiales ----------
    const K = T.raiz('casos');
    const CS = [
      { id: 'res', t: 'Canales de reserva' }, { id: 'off', t: 'Cambio de ranura' }, { id: 'red', t: 'Redundancia' },
      { id: 'rem', t: 'E/S remotas' }, { id: 'dia', t: 'Canal de diagnóstico' }
    ];
    K.innerHTML = `<div class="segmentado pl-casos" data-rol="casos">${CS.map((c) => `<button type="button" data-c="${c.id}">${c.t}</button>`).join('')}</div><div class="panel-info" id="rk-caso"></div>`;
    const caso = K.querySelector('#rk-caso');
    const casos = {
      res() {
        caso.innerHTML = `<h4>Canales de reserva</h4>
          <p>Al diseñar, se deja entre un <b>10 y 20 %</b> de los canales sin usar. Sirven para agregar un sensor o un indicador sin comprar otro módulo ni mover el cableado.</p>
          <div class="pl-canales">${Array.from({ length: 16 }, (_, c) => `<span class="pl-canal ${c < 13 ? 'ocup' : 'reserva'}" style="cursor:default">${c < 13 ? '<small>en uso</small>' : 'reserva'}</span>`).join('')}</div>
          <p class="nota">13 canales usados y 3 de reserva: 18,75 % libre.</p>
          ${PL.pregunta('Un módulo de 16 entradas tiene 15 en uso. ¿Qué problema habrá en la primera ampliación?', 'Solo queda un canal libre. Cualquier ampliación obliga a agregar un módulo, lo que puede cambiar el rack, la fuente y las direcciones siguientes. Con reserva se evita.')}`;
      },
      off() {
        let inv = false;
        caso.innerHTML = `<h4>La dirección depende de la ranura</h4>
          <p>En la notación del curso, la ranura forma parte de la dirección. Si cambias un módulo de lugar, <b>sus direcciones cambian</b> y el programa deja de apuntar a lo correcto.</p>
          <div class="controles"><button type="button" class="boton" id="off-b">Intercambiar los módulos ED y SD</button></div>
          <div style="overflow:auto"><table class="pl-tabla" id="off-t"></table></div>
          ${PL.pregunta('El programa lee ED1.05 como «paro». Se cambian de ranura los módulos. ¿Qué pasa?', 'ED1.05 pasa a ser una <b>salida</b> o un canal de otro módulo: el programa leerá un dato equivocado. Por eso al cambiar el hardware se revisa y actualiza la tabla de direcciones antes de arrancar.')}`;
        const f = () => {
          const eds = inv ? 2 : 1, sds = inv ? 1 : 2;
          caso.querySelector('#off-t').innerHTML = `<thead><tr><th>Señal</th><th>Módulo</th><th>Dirección</th></tr></thead><tbody>
            <tr><td>S2 Paro</td><td>Entradas digitales en la ranura ${eds}</td><td class="mono"><b>${PL.direccion('ED', eds, 5)}</b></td></tr>
            <tr><td>KM1 Contactor</td><td>Salidas digitales en la ranura ${sds}</td><td class="mono"><b>${PL.direccion('SD', sds, 0)}</b></td></tr></tbody>`;
        };
        caso.querySelector('#off-b').onclick = () => { inv = !inv; f(); }; f();
      },
      red() {
        caso.innerHTML = `<h4>Redundancia de señales</h4>
          <p>En funciones críticas, una misma magnitud se mide con <b>dos sensores</b> conectados a <b>dos canales</b> distintos (a veces en módulos distintos). El programa compara los dos.</p>
          <ul><li><b>Dos de dos (2oo2):</b> actúa solo si ambos coinciden; evita disparos falsos, pero una falla de uno impide actuar.</li>
          <li><b>Uno de dos (1oo2):</b> actúa si cualquiera lo pide; es más seguro, pero produce más disparos falsos.</li></ul>
          <p class="nota">Dos canales en lugar de uno: la tabla de direcciones debe mostrar los dos (por ejemplo, LT101A en EA3.0 y LT101B en EA3.1).</p>
          ${PL.pregunta('Un sensor de presión de un recipiente es crítico: si falla en silencio, hay riesgo. ¿Qué te conviene: 1oo2 o 2oo2 para el disparo de seguridad?', '<b>1oo2</b> para el disparo de seguridad: basta que uno detecte la presión alta para disparar. A cambio, se aceptan más paradas falsas; si molestan, se agrega un tercer sensor (2oo3).')}`;
      },
      rem() {
        caso.innerHTML = `<h4>E/S remotas</h4>
          <p>Cuando los sensores están lejos del tablero, se instala una <b>estación remota</b> cerca de ellos, conectada con un solo cable de red industrial a la CPU. Ahorra cobre y tiempo de cableado.</p>
          <p>Sus canales tienen <b>direcciones propias</b>, definidas al configurar la estación (por ejemplo, un número de estación). Como viajan por una red, tienen un retardo: <b>no sirven para funciones muy rápidas</b>.</p>
          <div class="lienzo"><svg viewBox="0 0 700 120"><rect x="20" y="30" width="150" height="60" rx="8" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/><text x="95" y="66" class="svg-texto fuerte" text-anchor="middle">Tablero: CPU + rack</text>
            <path d="M170 60 H300 M400 60 H530" class="svg-conexion" fill="none" stroke="#1d5fb4" stroke-width="3"/><rect x="300" y="42" width="100" height="36" rx="6" fill="#e7f0fb" stroke="#9db8dc"/><text x="350" y="65" class="svg-texto mono" text-anchor="middle" style="font-size:11px">cable de red</text>
            <rect x="530" y="30" width="150" height="60" rx="8" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/><text x="605" y="56" class="svg-texto fuerte" text-anchor="middle">E/S remotas</text><text x="605" y="76" class="svg-texto" text-anchor="middle" style="font-size:11px">cerca de los sensores</text></svg></div>
          ${PL.pregunta('Una estación de llenado está a 150 m del tablero con 24 señales. ¿Qué conviene: cable por señal o E/S remotas?', 'Con 24 señales y 150 m, las <b>E/S remotas</b> ahorran mucho cable y mano de obra, y se prueban mejor. Si hubiera una señal que requiere reaccionar en microsegundos, esa se cablea directo.')}`;
      },
      dia() {
        caso.innerHTML = `<h4>Canal de diagnóstico</h4>
          <p>Muchos módulos informan <b>por canal</b> si hay un cable cortado, un cortocircuito o una señal fuera de rango. Ese estado se lee como otro dato (un bit o una palabra de diagnóstico) y se usa para alarmar.</p>
          <ul><li>Entradas analógicas 4–20 mA: por debajo de 3,6 mA = cable cortado.</li><li>Salidas digitales: «sobrecorriente» o «sin carga».</li></ul>
          <p class="nota">El programa debe tratar el diagnóstico como una señal más: si no se lee, la falla se descubre cuando el proceso ya se descontroló.</p>
          ${PL.pregunta('El módulo informa «cable cortado» en el canal EA3.0, que mide el nivel de un tanque. ¿Qué hace el programa?', 'No debe seguir controlando con un dato falso: pasa a un <b>estado seguro</b> (por ejemplo, cerrar la entrada y detener la bomba), genera una <b>alarma</b> y exige atención del operador.')}`;
      }
    };
    const verCaso = (id) => {
      K.querySelectorAll('[data-rol=casos] button').forEach((b) => b.classList.toggle('activo', b.dataset.c === id));
      casos[id](); PL.activarPreguntas(caso);
    };
    K.querySelectorAll('[data-rol=casos] button').forEach((b) => b.addEventListener('click', () => verCaso(b.dataset.c)));
    verCaso('res');

    return { destruir() {}, pestana: T.pestana };
  };
})();
