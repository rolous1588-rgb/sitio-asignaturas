// ============================================================
// Diagramas interactivos — Sesión 1 del módulo «Programación de PLCs e Interfaces Industriales»
//   II.diagramas.plc      → arquitectura del PLC, ciclo de escaneo y casos especiales
//   II.diagramas.repasoES → tipos de señal, lazo 4–20 mA (cero vivo) y paro de emergencia NC
//   II.diagramas.gemelo   → cápsula: gemelo digital (la planta real y su modelo)
// Cada uno devuelve { destruir(), pestana(id) }. Todo en SVG propio, colores claros.
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  II.diagramas = II.diagramas || {};
  const PL = (II.pl = II.pl || {});

  // ---------- utilidades comunes del módulo ----------
  // Barra de pestañas + contenedores; devuelve { pestana(id), raiz(id) }
  PL.pestanas = (cont, defs, inicial, alCambiar) => {
    cont.classList.add('diagrama');
    cont.innerHTML =
      `<div class="segmentado pl-tabs" data-rol="tab">${defs.map((d) => `<button type="button" data-t="${d.id}">${d.t}</button>`).join('')}</div>` +
      defs.map((d) => `<div data-tab="${d.id}" class="pl-tab oculto"></div>`).join('');
    const pestana = (id) => {
      cont.querySelectorAll('[data-rol=tab] button').forEach((b) => b.classList.toggle('activo', b.dataset.t === id));
      cont.querySelectorAll('[data-tab]').forEach((d) => d.classList.toggle('oculto', d.dataset.tab !== id));
      if (alCambiar) alCambiar(id);
    };
    cont.querySelectorAll('[data-rol=tab] button').forEach((b) => b.addEventListener('click', () => pestana(b.dataset.t)));
    pestana(inicial || defs[0].id);
    return { pestana, raiz: (id) => cont.querySelector(`[data-tab="${id}"]`) };
  };
  PL.ver = (el) => !!el && el.offsetParent !== null;
  const esc = (s) => II.esc(s);

  // Panel de información (título + filas) como en los otros módulos
  const panelInfo = (i) =>
    `<h4>${esc(i.t)}</h4><dl>${[['Qué es', i.v], ['Para qué sirve', i.r], ['Cómo se ve en la realidad', i.e], ['Por qué importa', i.p], ['Error común', i.err]]
      .filter((x) => x[1]).map((x) => `<dt>${x[0]}</dt><dd>${x[1]}</dd>`).join('')}</dl>`;

  // Bloque «pregunta + ver respuesta» (para las soluciones de los casos especiales)
  PL.pregunta = (q, r) =>
    `<div class="pl-pregunta"><div><b>Para pensar:</b> ${q}</div><button type="button" class="boton chico" data-rol="ver-r">Ver respuesta</button><div class="aviso ok oculto" data-rol="resp" style="margin:8px 0 0">${r}</div></div>`;
  PL.activarPreguntas = (raiz) => raiz.querySelectorAll('[data-rol=ver-r]').forEach((b) => {
    b.onclick = () => { const r = b.parentNode.querySelector('[data-rol=resp]'); r.classList.toggle('oculto'); b.textContent = r.classList.contains('oculto') ? 'Ver respuesta' : 'Ocultar respuesta'; };
  });

  // ============================================================
  // 1) PLC: arquitectura, ciclo de escaneo, casos especiales
  // ============================================================
  const INFO_PLC = {
    fuente: {
      t: 'Fuente de alimentación',
      v: 'Convierte la red (110/220 V ca) en 24 V cc para el bus interno y, muchas veces, para los sensores.',
      r: 'Energiza la CPU y los módulos. Una fuente sobredimensionada deja margen para ampliar el sistema.',
      e: 'Un módulo o caja a la izquierda del rack, con borne de entrada de red, borne de 24 V cc y un LED verde de «energía OK».',
      p: 'Si la fuente cae, todo el PLC se apaga: por eso se la protege con un interruptor termomagnético y se la dimensiona con reserva.',
      err: 'Alimentar sensores y actuadores de potencia desde la misma fuente que la CPU sin revisar la corriente total.'
    },
    cpu: {
      t: 'CPU (unidad central de proceso)',
      v: 'El «cerebro»: ejecuta el programa de usuario de forma cíclica.',
      r: 'Lee las entradas, resuelve la lógica, escribe las salidas y atiende las comunicaciones.',
      e: 'Módulo con LED de RUN / STOP / ERROR, una llave o interruptor de modo, una ranura de tarjeta de memoria y uno o más puertos Ethernet.',
      p: 'El tiempo que tarda en dar una vuelta (tiempo de escaneo) decide qué tan rápido puede reaccionar el sistema.',
      err: 'Creer que la CPU «ve» las entradas en tiempo real: solo mira el mundo una vez por ciclo.'
    },
    memoria: {
      t: 'Memoria de la CPU',
      v: 'Tres zonas: el <b>programa</b> de usuario, los <b>datos</b> (marcas, temporizadores, contadores) y la <b>imagen de proceso</b> de entradas y salidas.',
      r: 'La imagen de proceso es una copia, tomada al inicio del ciclo, del estado de las entradas; el programa trabaja con esa copia.',
      e: 'No se ve: está dentro de la CPU. Parte puede ser <b>retentiva</b> (conserva el valor al perder energía) y parte no.',
      p: 'Que el programa use una copia estable evita que una entrada cambie a mitad de la lógica y dé resultados incoherentes.',
      err: 'Suponer que un contador o una marca conserva su valor tras un corte de energía sin haberlo declarado retentivo.'
    },
    ed: {
      t: 'Módulo de entradas digitales (ED)',
      v: 'Recibe señales de dos estados: 0 o 1 (contacto abierto o cerrado, 0 V o 24 V).',
      r: 'Aísla eléctricamente (optoacopladores) y convierte cada señal de campo en un bit para la CPU.',
      e: 'Módulo con 8, 16 o 32 bornes numerados, un LED por canal y un borne común. Se conectan pulsadores, finales de carrera y sensores de proximidad.',
      p: 'Cada canal es un punto físico con su propia dirección: lo que se cablea aquí es lo que el programa puede leer.',
      err: 'Conectar a una entrada digital una señal analógica o una tensión que no es la del módulo.'
    },
    sd: {
      t: 'Módulo de salidas digitales (SD)',
      v: 'Entrega señales de dos estados para comandar actuadores: relé, contactor, lámpara, electroválvula.',
      r: 'Convierte el bit que decidió el programa en un contacto de relé o un transistor que conmuta.',
      e: 'Igual a uno de entradas, pero con bornes de salida y, según el modelo, relés (con su clic) o transistores. Un LED indica cada salida activa.',
      p: 'La salida del PLC es de baja potencia: se comanda un contactor o un relé auxiliar, no el motor directamente.',
      err: 'Conectar un motor directo a la salida, o superar la corriente máxima por canal o por módulo.'
    },
    bus: {
      t: 'Bus de fondo (backplane)',
      v: 'Camino de comunicación y alimentación interno entre la CPU y los módulos.',
      r: 'Transporta los datos de entradas y salidas y la energía lógica de cada módulo.',
      e: 'Una regleta con conectores en el fondo del rack, o un peine que une los módulos lado a lado.',
      p: 'El orden de los módulos en el bus determina las direcciones: cambiar un módulo de posición cambia sus direcciones.',
      err: 'Intercalar un módulo nuevo en medio del rack sin revisar que se corren las direcciones del programa.'
    },
    eth: {
      t: 'Comunicaciones (Ethernet)',
      v: 'Conexión de la CPU con la red industrial: programación, HMI/SCADA y otros equipos.',
      r: 'Permite programar y diagnosticar el PLC desde la PC, y mostrar datos en una pantalla táctil (HMI).',
      e: 'Puerto RJ-45 con dos LED (enlace y actividad), un switch industrial y una pantalla HMI en el tablero.',
      p: 'Las comunicaciones se atienden en una parte del ciclo: una red lenta o saturada puede alargar el tiempo de escaneo.',
      err: 'Dejar la red del PLC abierta a la red de oficina sin separación ni contraseña.'
    },
    campo_e: {
      t: 'Dispositivos de campo (entradas)',
      v: 'Los sensores y pulsadores que «le cuentan» al PLC lo que pasa en el proceso.',
      r: 'Cada uno se cablea a un borne de un módulo de entradas.',
      e: 'Pulsador de marcha (verde, NA), pulsador de paro (rojo, NC), final de carrera, sensor inductivo, transmisor 4–20 mA.',
      p: 'La forma de cablear (NA o NC) cambia lo que pasa cuando un cable se corta.',
      err: 'Usar contactos NA para funciones de seguridad: un cable cortado pasa inadvertido.'
    },
    campo_s: {
      t: 'Dispositivos de campo (salidas)',
      v: 'Los actuadores que ejecutan lo que el PLC decide.',
      r: 'Cada uno se cablea a un borne de un módulo de salidas.',
      e: 'Bobina de contactor que arranca un motor, lámpara piloto, electroválvula, alarma sonora.',
      p: 'Lo que ves moverse en la planta es el efecto de una salida del PLC.',
      err: 'Olvidar el elemento de protección (fusible, diodo en bobinas de cc) en la salida.'
    }
  };

  const FASES = [
    { n: 'Leer entradas', d: 'La CPU copia el estado de todos los canales de entrada a la <b>imagen de entradas</b>. Desde ahora, el programa usa esa copia, aunque el mundo cambie.' },
    { n: 'Ejecutar el programa', d: 'La CPU resuelve el programa de arriba hacia abajo (de izquierda a derecha en cada escalón), usando la imagen de entradas y escribiendo en la <b>imagen de salidas</b>.' },
    { n: 'Actualizar salidas', d: 'Recién ahora la imagen de salidas se copia a las salidas físicas. Si el programa cambió una salida varias veces, solo cuenta el <b>valor final</b>.' },
    { n: 'Comunicaciones y diagnóstico', d: 'Se atienden la red, el HMI y la programación, y se revisa el estado interno (batería, módulos, vigilancia del tiempo de ciclo).' }
  ];

  II.diagramas.plc = function (cont, opts = {}) {
    opts = opts || {};
    const T = PL.pestanas(cont, [
      { id: 'arq', t: 'Arquitectura' },
      { id: 'ciclo', t: 'Ciclo de escaneo' },
      { id: 'casos', t: 'Casos especiales' }
    ], opts.pestana === 'a' || !opts.pestana ? 'arq' : opts.pestana);
    const timers = [];

    // ---------- Arquitectura ----------
    const A = T.raiz('arq');
    const zona = (id, svg) => `<g class="clic pl-zona" data-id="${id}">${svg}</g>`;
    const led = (x, y, c) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${c}"/>`;
    const bornes = (x, y, n, w) => {
      let s = '';
      for (let i = 0; i < n; i++) s += `<rect x="${x + i * w}" y="${y}" width="${w - 3}" height="10" rx="2" fill="#dfe5ec" stroke="#8e99a6"/>`;
      return s;
    };
    A.innerHTML = `
      <div class="diag-2col planta-grid">
        <div class="lienzo"><svg viewBox="0 0 780 470" role="img" aria-label="Arquitectura de un PLC modular">
          <text x="14" y="22" class="svg-texto fuerte">PLC modular (vista de frente)</text>
          <!-- red Ethernet -->
          ${zona('eth', `<rect class="aro" x="468" y="28" width="300" height="86" rx="12" fill="none" stroke="#1d5fb4" stroke-width="3" opacity="0"/>
            <rect x="480" y="40" width="64" height="40" rx="6" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/><text x="512" y="64" class="svg-texto mono" text-anchor="middle">SWITCH</text>
            <rect x="578" y="36" width="76" height="52" rx="6" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/><rect x="584" y="42" width="64" height="34" rx="3" fill="#e7f0fb" stroke="#8e99a6"/><text x="616" y="63" class="svg-texto mono" text-anchor="middle">HMI</text>
            <rect x="676" y="36" width="76" height="52" rx="6" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/><rect x="684" y="42" width="60" height="32" rx="3" fill="#f0f3f7" stroke="#8e99a6"/><rect x="690" y="80" width="48" height="4" rx="2" fill="#8e99a6"/><text x="714" y="62" class="svg-texto mono" text-anchor="middle">PC</text>
            <line x1="544" y1="60" x2="578" y2="60" class="svg-conexion"/><line x1="654" y1="62" x2="676" y2="62" class="svg-conexion"/>
            <text x="600" y="106" class="svg-texto" text-anchor="middle">Red Ethernet</text>`)}
          <path d="M330 150 V118 H512 V80" class="svg-conexion" fill="none" stroke-dasharray="5 4"/>
          <!-- rack -->
          <rect x="14" y="132" width="752" height="238" rx="12" fill="#f4f6f9" stroke="#cbd3dd" stroke-width="2"/>
          <text x="26" y="150" class="svg-texto" style="font-size:11px">Rack con módulos</text>
          ${zona('fuente', `<rect class="aro" x="22" y="154" width="98" height="196" rx="10" fill="none" stroke="#1d5fb4" stroke-width="3" opacity="0"/>
            <rect x="28" y="160" width="86" height="184" rx="8" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/>
            <text x="71" y="186" class="svg-texto fuerte" text-anchor="middle">FUENTE</text><text x="71" y="203" class="svg-texto mono" text-anchor="middle" style="font-size:11px">24 V cc</text>
            ${led(44, 222, '#1b8a5a')}<text x="56" y="226" class="svg-texto" style="font-size:10px">OK</text>
            ${bornes(38, 318, 4, 17)}<text x="71" y="338" class="svg-texto" style="font-size:10px" text-anchor="middle">L  N  +  −</text>`)}
          ${zona('cpu', `<rect class="aro" x="126" y="154" width="214" height="196" rx="10" fill="none" stroke="#1d5fb4" stroke-width="3" opacity="0"/>
            <rect x="132" y="160" width="202" height="184" rx="8" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/>
            <text x="233" y="182" class="svg-texto fuerte" text-anchor="middle">CPU</text>
            ${led(150, 196, '#1b8a5a')}<text x="160" y="200" class="svg-texto" style="font-size:10px">RUN</text>${led(200, 196, '#cbd3dd')}<text x="210" y="200" class="svg-texto" style="font-size:10px">STOP</text>${led(260, 196, '#cbd3dd')}<text x="270" y="200" class="svg-texto" style="font-size:10px">ERR</text>
            <rect x="272" y="318" width="44" height="18" rx="3" fill="#fff" stroke="#8e99a6"/><text x="294" y="331" class="svg-texto mono" style="font-size:9px" text-anchor="middle">RJ-45</text>`)}
          ${zona('memoria', `<rect class="aro" x="140" y="208" width="186" height="100" rx="8" fill="none" stroke="#1d5fb4" stroke-width="3" opacity="0"/>
            <rect x="146" y="214" width="174" height="88" rx="6" fill="#e7f0fb" stroke="#9db8dc"/>
            <text x="233" y="230" class="svg-texto fuerte" text-anchor="middle" style="font-size:11px">MEMORIA</text>
            <rect x="154" y="238" width="52" height="22" rx="3" fill="#fff" stroke="#9db8dc"/><text x="180" y="253" class="svg-texto" text-anchor="middle" style="font-size:10px">Programa</text>
            <rect x="212" y="238" width="46" height="22" rx="3" fill="#fff" stroke="#9db8dc"/><text x="235" y="253" class="svg-texto" text-anchor="middle" style="font-size:10px">Datos</text>
            <rect x="264" y="238" width="48" height="22" rx="3" fill="#fff" stroke="#9db8dc"/><text x="288" y="253" class="svg-texto" text-anchor="middle" style="font-size:10px">Imagen</text>
            <text x="233" y="283" class="svg-texto" text-anchor="middle" style="font-size:10px">retentiva / no retentiva</text>`)}
          ${zona('ed', `<rect class="aro" x="346" y="154" width="196" height="196" rx="10" fill="none" stroke="#1d5fb4" stroke-width="3" opacity="0"/>
            <rect x="352" y="160" width="184" height="184" rx="8" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/>
            <text x="444" y="182" class="svg-texto fuerte" text-anchor="middle">ENTRADAS DIGITALES</text><text x="444" y="198" class="svg-texto mono" text-anchor="middle" style="font-size:11px">16 canales; 24 V cc</text>
            ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => led(368 + i * 20, 220, i === 1 ? '#1b8a5a' : '#cbd3dd')).join('')}
            ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<text x="${368 + i * 20}" y="238" class="svg-texto" style="font-size:9px" text-anchor="middle">${i}</text>`).join('')}
            ${bornes(364, 316, 8, 20)}`)}
          ${zona('sd', `<rect class="aro" x="548" y="154" width="212" height="196" rx="10" fill="none" stroke="#1d5fb4" stroke-width="3" opacity="0"/>
            <rect x="554" y="160" width="200" height="184" rx="8" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/>
            <text x="654" y="182" class="svg-texto fuerte" text-anchor="middle">SALIDAS DIGITALES</text><text x="654" y="198" class="svg-texto mono" text-anchor="middle" style="font-size:11px">16 canales; relé</text>
            ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => led(572 + i * 21, 220, i === 0 ? '#e0782b' : '#cbd3dd')).join('')}
            ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<text x="${572 + i * 21}" y="238" class="svg-texto" style="font-size:9px" text-anchor="middle">${i}</text>`).join('')}
            ${bornes(566, 316, 8, 22)}`)}
          ${zona('bus', `<rect class="aro" x="22" y="356" width="738" height="22" rx="8" fill="none" stroke="#1d5fb4" stroke-width="3" opacity="0"/>
            <rect x="28" y="360" width="726" height="12" rx="5" fill="#dfe5ec" stroke="#8e99a6"/><text x="391" y="370" class="svg-texto" text-anchor="middle" style="font-size:10px">BUS DE FONDO (alimentación y datos entre módulos)</text>`)}
          <!-- campo -->
          ${zona('campo_e', `<rect class="aro" x="340" y="388" width="210" height="78" rx="10" fill="none" stroke="#1d5fb4" stroke-width="3" opacity="0"/>
            <line x1="380" y1="326" x2="380" y2="400" class="svg-conexion"/><line x1="400" y1="326" x2="400" y2="400" class="svg-conexion"/><line x1="440" y1="326" x2="440" y2="400" class="svg-conexion"/>
            <circle cx="380" cy="420" r="13" fill="#d9f0e3" stroke="#1b8a5a" stroke-width="2"/><text x="380" y="454" class="svg-texto" text-anchor="middle" style="font-size:10px">Marcha</text>
            <circle cx="420" cy="420" r="13" fill="#fbe8e5" stroke="#c0392b" stroke-width="2"/><text x="420" y="454" class="svg-texto" text-anchor="middle" style="font-size:10px">Paro NC</text>
            <rect x="454" y="408" width="34" height="24" rx="4" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/><circle cx="500" cy="420" r="5" fill="#8e99a6"/><text x="480" y="454" class="svg-texto" text-anchor="middle" style="font-size:10px">Sensor</text>`)}
          ${zona('campo_s', `<rect class="aro" x="564" y="388" width="200" height="78" rx="10" fill="none" stroke="#1d5fb4" stroke-width="3" opacity="0"/>
            <line x1="578" y1="326" x2="578" y2="400" class="svg-conexion"/><line x1="600" y1="326" x2="600" y2="400" class="svg-conexion"/>
            <rect x="570" y="400" width="36" height="28" rx="4" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/><text x="588" y="418" class="svg-texto mono" text-anchor="middle" style="font-size:10px">KM1</text>
            <circle cx="660" cy="420" r="15" fill="#fff" stroke="#2f3b4a" stroke-width="2"/><text x="660" y="424" class="svg-texto mono" text-anchor="middle" style="font-size:12px">M</text><line x1="606" y1="414" x2="645" y2="414" class="svg-conexion"/>
            <circle cx="720" cy="420" r="11" fill="#fbf1de" stroke="#b7791f" stroke-width="2"/><text x="588" y="454" class="svg-texto" text-anchor="middle" style="font-size:10px">Contactor</text><text x="660" y="454" class="svg-texto" text-anchor="middle" style="font-size:10px">Motor</text><text x="720" y="454" class="svg-texto" text-anchor="middle" style="font-size:10px">Lámpara</text>`)}
        </svg></div>
        <div class="panel-info" id="arq-info"><h4>Toca una parte del PLC</h4><p class="nota">Cada bloque del dibujo tiene su explicación: qué es, para qué sirve, cómo se ve en la realidad, por qué importa y el error más común. Recorre las nueve.</p><p class="nota" id="arq-prog"></p></div>
      </div>`;
    const vistos = new Set();
    A.querySelectorAll('.pl-zona').forEach((g) => g.addEventListener('click', () => {
      A.querySelectorAll('.pl-zona').forEach((x) => x.classList.toggle('sel', x === g));
      vistos.add(g.dataset.id); g.classList.add('visto');
      A.querySelector('#arq-info').innerHTML = panelInfo(INFO_PLC[g.dataset.id]) + `<p class="nota" style="margin-top:10px">Partes vistas: ${vistos.size} de 9</p>`;
    }));

    // ---------- Ciclo de escaneo ----------
    const C = T.raiz('ciclo');
    const S = { T: 20, w: 12, off: 5, fase: 0, auto: true };
    C.innerHTML = `
      <div class="pl-fases" id="fases">${FASES.map((f, i) => `<div class="pl-fase" data-i="${i}"><b>${i + 1}</b><span>${f.n}</span></div>`).join('<span class="pl-flecha">&#10140;</span>')}<span class="pl-flecha vuelta">&#8634;</span></div>
      <div class="panel-info" id="fase-d"></div>
      <div class="controles"><button type="button" class="boton chico" id="f-auto">Pausar animación</button><button type="button" class="boton chico" id="f-sig">Siguiente fase</button></div>
      <h4 style="margin:6px 0 0">¿Qué ve el PLC de un pulso corto?</h4>
      <p class="nota" style="margin:0">Un pulsador se presiona un instante. El PLC solo mira las entradas al inicio de cada ciclo. Cambia el tiempo de ciclo y el ancho del pulso.</p>
      <div class="lienzo"><svg viewBox="0 0 780 230" id="cron" role="img" aria-label="Cronograma de escaneo"></svg></div>
      <div class="diag-2col rango-grid">
        <div>
          <div class="deslizador"><label for="s-T">Tiempo de ciclo del PLC</label><output id="o-T"></output><input type="range" id="s-T" min="5" max="50" step="1"></div>
          <div class="deslizador"><label for="s-w">Ancho del pulso del pulsador</label><output id="o-w"></output><input type="range" id="s-w" min="1" max="60" step="1"></div>
          <div class="deslizador"><label for="s-off">Momento en que ocurre (dentro del ciclo)</label><output id="o-off"></output><input type="range" id="s-off" min="0" max="49" step="1"></div>
        </div>
        <div id="cron-res"></div>
      </div>`;
    const pintarFase = () => {
      C.querySelectorAll('.pl-fase').forEach((f) => f.classList.toggle('activa', +f.dataset.i === S.fase));
      C.querySelector('#fase-d').innerHTML = `<h4>${S.fase + 1}. ${FASES[S.fase].n}</h4><p style="margin:0">${FASES[S.fase].d}</p>`;
    };
    const cron = () => {
      const L = 200, X0 = 70, W = 690, px = (t) => X0 + (t / L) * W;
      const t0 = 20 + S.off % S.T, w = S.w;
      const lecturas = [];
      for (let k = 0; k * S.T <= L; k++) lecturas.push(k * S.T);
      const visto = lecturas.filter((t) => t >= t0 && t < t0 + w);
      const imagenes = lecturas.map((t) => ({ t, v: t >= t0 && t < t0 + w ? 1 : 0 }));
      // trazo escalonado de una señal definida por tramos
      const traza = (y, tramos) => {
        let d = '';
        tramos.forEach((tr, i) => { d += (i ? ` L${px(tr.t).toFixed(1)},${(tr.v ? y - 26 : y).toFixed(1)}` : `M${px(tr.t).toFixed(1)},${(tr.v ? y - 26 : y).toFixed(1)}`); });
        return d;
      };
      const real = [{ t: 0, v: 0 }, { t: t0, v: 0 }, { t: t0, v: 1 }, { t: Math.min(L, t0 + w), v: 1 }, { t: Math.min(L, t0 + w), v: 0 }, { t: L, v: 0 }];
      const escal = (arr, retardo) => {
        const out = [{ t: 0, v: 0 }];
        arr.forEach((a, i) => {
          const t = a.t + retardo, prev = out[out.length - 1].v;
          if (a.v !== prev) { out.push({ t, v: prev }); out.push({ t, v: a.v }); }
        });
        out.push({ t: L, v: out[out.length - 1].v });
        return out;
      };
      const img = escal(imagenes, 0), sal = escal(imagenes, S.T * 0.8);
      let g = `<line x1="${X0}" y1="196" x2="${X0 + W}" y2="196" class="tend-eje"/>`;
      lecturas.forEach((t) => { g += `<line x1="${px(t)}" y1="22" x2="${px(t)}" y2="196" class="tend-rejilla" stroke-dasharray="3 4"/><circle cx="${px(t)}" cy="30" r="3.5" fill="#1d5fb4"/>`; });
      g += `<text x="${X0 - 6}" y="46" text-anchor="end" class="svg-texto" style="font-size:11px">lectura</text>`;
      g += `<text x="${X0 - 6}" y="86" text-anchor="end" class="svg-texto fuerte" style="font-size:11px">Entrada real</text><path d="${traza(98, real)}" fill="none" stroke="#e0782b" stroke-width="2.6"/>`;
      g += `<text x="${X0 - 6}" y="136" text-anchor="end" class="svg-texto fuerte" style="font-size:11px">Imagen</text><path d="${traza(148, img)}" fill="none" stroke="#1d5fb4" stroke-width="2.6"/>`;
      g += `<text x="${X0 - 6}" y="184" text-anchor="end" class="svg-texto fuerte" style="font-size:11px">Salida física</text><path d="${traza(194, sal)}" fill="none" stroke="#1b8a5a" stroke-width="2.6"/>`;
      g += `<text x="${px(0)}" y="216" class="svg-texto" style="font-size:10px">0 ms</text><text x="${px(L)}" y="216" text-anchor="end" class="svg-texto" style="font-size:10px">200 ms</text>`;
      C.querySelector('#cron').innerHTML = g;
      C.querySelector('#o-T').textContent = S.T + ' ms';
      C.querySelector('#o-w').textContent = S.w + ' ms';
      C.querySelector('#o-off').textContent = (S.off % S.T) + ' ms';
      C.querySelector('#cron-res').innerHTML = visto.length
        ? `<div class="aviso ok"><b>El PLC vio el pulso</b> (${visto.length} lectura${visto.length > 1 ? 's' : ''} dentro de él). Pasó a la imagen y la salida respondió al final de ese ciclo.</div>`
        : `<div class="aviso mal"><b>El PLC no vio el pulso.</b> Empezó y terminó entre dos lecturas. Para no perderlo, el pulso debe durar <b>más que el tiempo de ciclo</b> (aquí, más de ${S.T} ms) o hay que usar una entrada con interrupción o contador rápido.</div>`;
    };
    const sync = () => {
      C.querySelector('#s-T').value = S.T; C.querySelector('#s-w').value = S.w; C.querySelector('#s-off').value = S.off; cron();
    };
    [['s-T', 'T'], ['s-w', 'w'], ['s-off', 'off']].forEach(([id, k]) => C.querySelector('#' + id).addEventListener('input', (e) => { S[k] = +e.target.value; cron(); }));
    C.querySelector('#f-auto').onclick = (e) => { S.auto = !S.auto; e.target.textContent = S.auto ? 'Pausar animación' : 'Reanudar animación'; };
    C.querySelector('#f-sig').onclick = () => { S.fase = (S.fase + 1) % 4; pintarFase(); };
    timers.push(setInterval(() => { if (S.auto && PL.ver(C)) { S.fase = (S.fase + 1) % 4; pintarFase(); } }, 2600));
    pintarFase(); sync();

    // ---------- Casos especiales ----------
    const K = T.raiz('casos');
    const CASOS = [
      { id: 'pulso', t: 'Pulso más corto que el ciclo' },
      { id: 'sal', t: 'Salidas al final del ciclo' },
      { id: 'wd', t: 'Watchdog' },
      { id: 'luz', t: 'Corte de energía' },
      { id: 'cmp', t: 'PLC, relé o microcontrolador' }
    ];
    K.innerHTML = `<div class="segmentado pl-casos" data-rol="casos">${CASOS.map((c) => `<button type="button" data-c="${c.id}">${c.t}</button>`).join('')}</div><div class="panel-info" id="caso"></div>`;
    const caso = K.querySelector('#caso');
    const casos = {
      pulso() {
        caso.innerHTML = `<h4>Pulso más corto que el ciclo de escaneo</h4>
          <p>El PLC mira las entradas <b>una vez por ciclo</b>. Un pulso que empieza y termina entre dos lecturas es invisible para él, aunque el pulsador sí se haya presionado.</p>
          <p>Además, casi todas las entradas digitales tienen un <b>filtro</b> de 1 a 10 ms que descarta pulsos muy cortos para ignorar el ruido eléctrico.</p>
          <p><b>Soluciones reales:</b> alargar el pulso con un relé temporizado; usar entradas de <b>interrupción</b> o <b>contadores rápidos</b> para sensores veloces; reducir el tiempo de ciclo.</p>
          <div class="controles"><button type="button" class="boton" id="ir-cron">Probarlo en el cronograma (ciclo 20 ms; pulso 6 ms)</button></div>
          ${PL.pregunta('Un sensor de pulsos genera una señal que dura 3 ms, y el ciclo del PLC es de 15 ms. ¿Se garantiza que el PLC lo cuente?', 'No. Para garantizarlo, el pulso debería durar más que el ciclo (más de 15 ms). Con 3 ms puede perder varios; conviene un contador rápido por hardware.')}`;
        K.querySelector('#ir-cron').onclick = () => { S.T = 20; S.w = 6; S.off = 8; sync(); T.pestana('ciclo'); };
      },
      sal() {
        const lineas = [
          { t: '1  Q1 := 1', q: 1 }, { t: '2  (se hace un cálculo largo)', q: 1 }, { t: '3  si M5 entonces Q1 := 0', q: 0 }, { t: '4  fin del programa', q: 0 }
        ];
        let i = -1;
        caso.innerHTML = `<h4>Las salidas se actualizan al final del ciclo</h4>
          <p>Mientras el programa corre, escribe en la <b>imagen de salidas</b> (una copia en memoria). Las salidas físicas cambian recién en la fase 3. Si una salida cambia varias veces en un ciclo, el mundo real solo ve el <b>último valor</b>.</p>
          <div class="grid-sal"><div class="pl-codigo" id="cod"></div><div id="est" class="pl-estados"></div></div>
          <div class="controles"><button type="button" class="boton chico" id="s-sig">Ejecutar siguiente línea</button><button type="button" class="boton chico" id="s-rei">Reiniciar</button></div>
          ${PL.pregunta('Q1 se enciende en la línea 1 y se apaga en la línea 3 del mismo ciclo. ¿La lámpara conectada a Q1 parpadea?', 'No. La imagen vale 1 un momento, pero la salida física recibe solo el valor final (0). Por eso un «parpadeo» dentro de un ciclo no existe en el mundo real: para parpadear hay que cambiar el valor en ciclos distintos.')}`;
        const pintar = () => {
          caso.querySelector('#cod').innerHTML = lineas.map((l, k) => `<div class="${k === i ? 'act' : ''}">${l.t}</div>`).join('');
          const q = i >= 0 ? lineas[i].q : 0;
          const fin = i === lineas.length - 1;
          caso.querySelector('#est').innerHTML = `<div class="chip ${q ? 'acento' : ''}">Imagen de Q1: <b>${q}</b></div><div class="chip ${fin ? 'ok' : ''}">Salida física Q1: <b>${fin ? q : 0}</b>${fin ? '' : ' (aún no cambia)'}</div>${fin ? '<div class="nota">Fase 3: se copia la imagen a la salida.</div>' : ''}`;
        };
        caso.querySelector('#s-sig').onclick = () => { i = Math.min(lineas.length - 1, i + 1); pintar(); };
        caso.querySelector('#s-rei').onclick = () => { i = -1; pintar(); };
        pintar();
      },
      wd() {
        caso.innerHTML = `<h4>Watchdog: el perro guardián del tiempo de ciclo</h4>
          <p>La CPU vigila que cada ciclo termine antes de un tiempo máximo. Si un ciclo tarda más (un bucle infinito, un error), el <b>watchdog</b> detiene la CPU, enciende el LED de error y deja las salidas en un estado seguro.</p>
          <div class="deslizador"><label for="w-e">Tiempo que tarda el programa</label><output id="o-e"></output><input type="range" id="w-e" min="10" max="300" step="5" value="60"></div>
          <div class="deslizador"><label for="w-l">Límite del watchdog</label><output id="o-l"></output><input type="range" id="w-l" min="50" max="200" step="10" value="100"></div>
          <div id="wd-r"></div>
          ${PL.pregunta('¿Por qué conviene que las salidas pasen a un estado seguro cuando salta el watchdog, en vez de quedarse como estaban?', 'Porque si la CPU se detiene con el motor encendido y las salidas congeladas, nadie lo puede apagar desde el programa. El estado seguro (normalmente todo apagado) evita que el proceso siga sin control.')}`;
        const f = () => {
          const e = +caso.querySelector('#w-e').value, l = +caso.querySelector('#w-l').value;
          caso.querySelector('#o-e').textContent = e + ' ms'; caso.querySelector('#o-l').textContent = l + ' ms';
          caso.querySelector('#wd-r').innerHTML = e > l
            ? `<div class="aviso mal"><b>Watchdog disparado:</b> ${e} ms &gt; ${l} ms. CPU en FALLA (LED ERR encendido); salidas en estado seguro (apagadas). Hay que corregir el programa y reiniciar.</div>`
            : `<div class="aviso ok">Ciclo normal: ${e} ms &le; ${l} ms. Margen de ${l - e} ms.</div>`;
        };
        caso.querySelectorAll('input[type=range]').forEach((r) => r.addEventListener('input', f));
        f();
      },
      luz() {
        let corte = false, ret = true;
        caso.innerHTML = `<h4>Corte de energía y memoria retentiva</h4>
          <p>Al perder la energía, la <b>memoria no retentiva</b> se borra. La <b>retentiva</b> conserva su valor (con batería, condensador o memoria flash). Al volver la energía, las salidas arrancan en 0 y el programa decide qué pasa.</p>
          <div class="controles"><button type="button" class="boton primario" id="l-corte">Cortar energía</button><label class="opcion" style="padding:8px 12px"><input type="checkbox" id="l-ret" checked>Contador declarado retentivo</label></div>
          <div id="luz-r"></div>
          ${PL.pregunta('Una cinta transportadora se arranca con un selector que queda en la posición «ON». Falla la luz y vuelve. ¿Qué riesgo hay si el programa arranca la cinta apenas ve el selector en ON?', 'La cinta arrancará sola al volver la energía, quizá con alguien trabajando en ella. Por eso se diseña un arranque que exija una acción nueva (volver a pulsar marcha) o se usa un bit de «primer ciclo» para dejar todo en reposo.')}`;
        const f = () => {
          ret = caso.querySelector('#l-ret').checked;
          caso.querySelector('#l-corte').textContent = corte ? 'Restablecer energía' : 'Cortar energía';
          caso.querySelector('#luz-r').innerHTML = `
            <div class="pl-estados">
              <div class="chip ${corte ? 'mal' : 'ok'}">Energía: <b>${corte ? 'cortada' : 'presente'}</b></div>
              <div class="chip">Motor (salida): <b>${corte ? 'apagado' : 'encendido'}</b></div>
              <div class="chip ${corte && !ret ? 'mal' : ''}">Contador de piezas: <b>${corte ? (ret ? '37 (conservado)' : '0 (perdido)') : '37'}</b></div>
            </div>`;
        };
        caso.querySelector('#l-corte').onclick = () => { corte = !corte; f(); };
        caso.querySelector('#l-ret').onchange = f;
        f();
      },
      cmp() {
        caso.innerHTML = `<h4>PLC frente a relé y a microcontrolador</h4>
          <div style="overflow:auto"><table class="pl-tabla"><thead><tr><th></th><th>Relés</th><th>PLC</th><th>Microcontrolador</th></tr></thead><tbody>
            <tr><th>Cambiar la lógica</th><td>Recablear</td><td>Cambiar el programa</td><td>Reprogramar (y a veces rediseñar la tarjeta)</td></tr>
            <tr><th>Entradas y salidas</th><td>Contactos y bobinas</td><td>Módulos aislados, a 24 V u otros, listos para planta</td><td>Pines de 3,3 o 5 V; hay que agregar protección y aislamiento</td></tr>
            <tr><th>Ambiente industrial</th><td>Robusto</td><td>Diseñado para ruido, vibración y temperatura</td><td>Depende de la tarjeta que se diseñe</td></tr>
            <tr><th>Diagnóstico</th><td>Medir con multímetro</td><td>LED, alarmas, herramientas de software</td><td>Hay que programarlo</td></tr>
            <tr><th>Costo por unidad</th><td>Bajo para lógicas pequeñas</td><td>Medio a alto</td><td>Muy bajo (producto en serie)</td></tr>
            <tr><th>Uso típico</th><td>Lógicas muy sencillas o de seguridad cableada</td><td>Máquinas y procesos con cambios frecuentes</td><td>Productos fabricados en grandes cantidades</td></tr>
          </tbody></table></div>
          ${PL.pregunta('Una pequeña máquina de envasado que se fabricará 2000 veces, con un solo fabricante que controla todo el diseño de la tarjeta. ¿PLC o microcontrolador?', 'Probablemente un microcontrolador: el costo por unidad pesa en una serie grande y el fabricante controla el diseño. Si fuera una sola máquina en una planta, con mantenimiento por técnicos de la planta, convendría un PLC.')}`;
      }
    };
    const verCaso = (id) => {
      K.querySelectorAll('[data-rol=casos] button').forEach((b) => b.classList.toggle('activo', b.dataset.c === id));
      casos[id](); PL.activarPreguntas(caso);
    };
    K.querySelectorAll('[data-rol=casos] button').forEach((b) => b.addEventListener('click', () => verCaso(b.dataset.c)));
    verCaso('pulso');

    return { destruir() { timers.forEach(clearInterval); }, pestana: T.pestana };
  };

  // ============================================================
  // 2) REPASO DE E/S: tipos de señal, 4–20 mA y paro NC
  // ============================================================
  II.diagramas.repasoES = function (cont, opts = {}) {
    opts = opts || {};
    const T = PL.pestanas(cont, [
      { id: 'tipos', t: 'Tipos de señal' },
      { id: 'ma', t: 'Lazo 4–20 mA' },
      { id: 'nc', t: 'Paro de emergencia NC' }
    ], opts.pestana && opts.pestana !== 'a' ? opts.pestana : 'tipos');

    // ---- tipos ----
    const TP = T.raiz('tipos');
    const TIPOS = [
      { k: 'ED', n: 'Entrada digital', d: 'Dos estados: 0 o 1.', ej: 'Pulsador, final de carrera, sensor de proximidad, flotador, contacto auxiliar.', col: '#1b8a5a' },
      { k: 'SD', n: 'Salida digital', d: 'Dos estados: apagado o encendido.', ej: 'Bobina de contactor, lámpara piloto, electroválvula todo/nada, sirena.', col: '#e0782b' },
      { k: 'EA', n: 'Entrada analógica', d: 'Un valor continuo (por ejemplo 4–20 mA o 0–10 V) que el módulo convierte en un número.', ej: 'Transmisor de nivel, presión o temperatura; potenciómetro; celda de carga amplificada.', col: '#1d5fb4' },
      { k: 'SA', n: 'Salida analógica', d: 'El PLC entrega un valor continuo (4–20 mA o 0–10 V).', ej: 'Referencia de velocidad a un variador; posición de una válvula de control.', col: '#7a4bb0' }
    ];
    TP.innerHTML = `<div class="pl-tipos">${TIPOS.map((t) => `<div class="pl-tipo" style="border-top-color:${t.col}"><div class="pl-tipo-k" style="background:${t.col}">${t.k}</div><h4>${t.n}</h4><p>${t.d}</p><p class="nota"><b>Ejemplos:</b> ${t.ej}</p></div>`).join('')}</div>
      <div class="aviso info">Regla para clasificar: primero pregunta <b>quién manda</b>. Si la señal va <b>hacia</b> el PLC es una entrada; si sale <b>del</b> PLC es una salida. Luego pregunta si solo toma <b>dos estados</b> (digital) o <b>muchos valores</b> (analógica).</div>
      ${PL.pregunta('Un interruptor de nivel tipo flotador avisa «tanque lleno». ¿Qué tipo de señal es? ¿Y un transmisor de nivel de 4–20 mA?', 'El flotador es una <b>entrada digital</b> (lleno / no lleno). El transmisor 4–20 mA es una <b>entrada analógica</b> (informa cuánto nivel hay, no solo si está lleno).')}`;
    PL.activarPreguntas(TP);

    // ---- 4–20 mA ----
    const M = T.raiz('ma');
    const E = { pv: 50, cable: false };
    M.innerHTML = `
      <p class="sub" style="margin:0">Un transmisor de presión de 0 a 10 bar envía su medición como corriente. Mueve la presión y observa la corriente y el valor que recibe el PLC.</p>
      <div class="lienzo"><svg viewBox="0 0 780 190" id="ma-svg"></svg></div>
      <div class="deslizador"><label for="m-pv">Presión del proceso</label><output id="m-o"></output><input type="range" id="m-pv" min="0" max="100" step="1" value="50"></div>
      <div class="controles"><button type="button" class="boton" id="m-cable">Cortar el cable del transmisor</button></div>
      <div id="m-res"></div>
      ${PL.pregunta('¿Por qué la escala empieza en 4 mA y no en 0 mA?', 'Para tener un <b>cero vivo</b>: 4 mA significa «0 bar, todo bien» y 0 mA significa «hay una falla» (cable cortado o transmisor sin energía). Con una señal de 0 a 10 V no se distingue una medición de 0 de un cable roto.')}`;
    const mA = () => {
      const I = E.cable ? 0 : 4 + 16 * E.pv / 100;
      const bar = (E.pv / 100) * 10;
      const pct = E.cable ? 0 : E.pv;
      M.querySelector('#m-o').textContent = II.fmt(bar, 2) + ' bar';
      const x = 70 + (E.pv / 100) * 340;
      M.querySelector('#ma-svg').innerHTML = `
        <rect x="20" y="60" width="150" height="70" rx="10" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/><text x="95" y="90" class="svg-texto fuerte" text-anchor="middle">Transmisor</text><text x="95" y="110" class="svg-texto mono" text-anchor="middle">${II.fmt(bar, 2)} bar</text>
        <path d="M170 82 H300 ${E.cable ? '' : 'H 400'}" class="svg-conexion" fill="none" stroke="${E.cable ? '#c0392b' : '#1d5fb4'}" stroke-width="3" ${E.cable ? 'stroke-dasharray="6 5"' : ''}/>
        ${E.cable ? '<text x="300" y="70" class="svg-texto" fill="#c0392b" style="fill:#c0392b" text-anchor="middle">cable cortado</text><path d="M296 72 L316 96 M316 72 L296 96" stroke="#c0392b" stroke-width="3"/>' : ''}
        <path d="M170 108 H400" class="svg-conexion" fill="none" stroke="#1d5fb4" stroke-width="3" ${E.cable ? 'stroke-dasharray="6 5" opacity=".4"' : ''}/>
        <rect x="400" y="50" width="170" height="90" rx="10" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/><text x="485" y="76" class="svg-texto fuerte" text-anchor="middle">Entrada analógica</text><text x="485" y="104" class="svg-texto mono" text-anchor="middle" style="font-size:20px">${II.fmt(I, 2)} mA</text><text x="485" y="126" class="svg-texto" text-anchor="middle" style="font-size:11px">${E.cable ? 'por debajo de 3,6 mA' : 'dentro de rango'}</text>
        <path d="M570 95 H610" class="svg-conexion" fill="none" stroke="#2f3b4a" stroke-width="2"/>
        <rect x="610" y="55" width="150" height="80" rx="10" fill="#e7f0fb" stroke="#9db8dc"/><text x="685" y="82" class="svg-texto fuerte" text-anchor="middle">Valor en el PLC</text><text x="685" y="110" class="svg-texto mono" text-anchor="middle" style="font-size:18px">${E.cable ? 'FALLA' : II.fmt(pct, 1) + ' %'}</text>
        <rect x="70" y="160" width="340" height="8" rx="4" fill="#dfe5ec"/><circle cx="${x}" cy="164" r="7" fill="#1d5fb4"/><text x="70" y="184" class="svg-texto" style="font-size:10px">4 mA = 0 %</text><text x="410" y="184" text-anchor="end" class="svg-texto" style="font-size:10px">20 mA = 100 %</text>`;
      M.querySelector('#m-res').innerHTML = E.cable
        ? '<div class="aviso mal"><b>0 mA:</b> el módulo detecta la falla (la corriente está bajo 3,6 mA). Un valor de «0 bar» sería 4 mA, no 0 mA; por eso se sabe que el cable está roto.</div>'
        : `<div class="aviso info">I = 4 + 16 · (${II.fmt(bar, 2)} / 10) = <b>${II.fmt(I, 2)} mA</b>. En porcentaje de la escala: <b>${II.fmt(pct, 1)} %</b>.</div>`;
      M.querySelector('#m-cable').textContent = E.cable ? 'Reparar el cable' : 'Cortar el cable del transmisor';
    };
    M.querySelector('#m-pv').addEventListener('input', (e) => { E.pv = +e.target.value; mA(); });
    M.querySelector('#m-cable').onclick = () => { E.cable = !E.cable; mA(); };
    PL.activarPreguntas(M); mA();

    // ---- paro NC ----
    const N = T.raiz('nc');
    const P = { tipo: 'NC', accion: 'ok', marcha: false, motor: false };
    N.innerHTML = `
      <p class="sub" style="margin:0">El mismo paro cableado de dos formas. Prueba las tres situaciones y observa cuándo se detiene el motor.</p>
      <div class="controles"><div class="segmentado" data-rol="tipo"><button type="button" data-v="NC" class="activo">Paro NC (normalmente cerrado)</button><button type="button" data-v="NA">Paro NA (normalmente abierto)</button></div></div>
      <div class="lienzo"><svg viewBox="0 0 780 200" id="nc-svg"></svg></div>
      <div class="controles"><button type="button" class="boton" data-a="marcha">Pulsar marcha</button><button type="button" class="boton" data-a="paro">Pulsar paro</button><button type="button" class="boton" data-a="corte">Cortar el cable del paro</button><button type="button" class="boton" data-a="rest">Restablecer</button></div>
      <div id="nc-res"></div>
      ${PL.pregunta('¿Por qué el pulsador de paro y el de emergencia se cablean casi siempre con contacto NC?', 'Porque con NC, si el cable se corta, un borne se suelta o el contacto se daña, el PLC ve «paro» y detiene el motor: <b>la falla lleva a un estado seguro</b>. Con NA, el cable cortado pasa inadvertido y el paro deja de funcionar justo cuando se necesita.')}
      <div class="aviso duda">Un PLC <b>no sustituye</b> la cadena de seguridad cableada: la parada de emergencia real también corta la potencia con un relé de seguridad. Aquí se estudia la lógica de control.</div>`;
    const nc = () => {
      // señal que llega a la entrada de paro: 1 = «no hay paro»
      let entrada;
      if (P.tipo === 'NC') entrada = P.accion === 'ok' ? 1 : 0;   // pulsado o cable cortado → 0
      else entrada = P.accion === 'paro' ? 1 : 0;                  // NA: pulsado → 1; cable cortado → 0 (no detecta)
      const hayParo = P.tipo === 'NC' ? entrada === 0 : entrada === 1;
      if (P.marcha && !hayParo) P.motor = true;
      if (hayParo) P.motor = false;
      P.marcha = false;
      const svgs = `
        <rect x="20" y="30" width="150" height="130" rx="10" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/><text x="95" y="56" class="svg-texto fuerte" text-anchor="middle">24 V</text>
        <path d="M170 70 H250" class="svg-conexion" fill="none" stroke="${P.accion === 'corte' ? '#c0392b' : '#1d5fb4'}" stroke-width="3" ${P.accion === 'corte' ? 'stroke-dasharray="6 5"' : ''}/>
        <rect x="250" y="48" width="130" height="44" rx="8" fill="#fff" stroke="#2f3b4a" stroke-width="1.8"/><text x="315" y="66" class="svg-texto fuerte" text-anchor="middle" style="font-size:12px">Paro ${P.tipo}</text><text x="315" y="82" class="svg-texto mono" text-anchor="middle" style="font-size:10px">${P.tipo === 'NC' ? (P.accion === 'paro' ? 'abierto (pulsado)' : 'cerrado') : (P.accion === 'paro' ? 'cerrado (pulsado)' : 'abierto')}</text>
        ${P.accion === 'corte' ? '<path d="M200 56 L220 84 M220 56 L200 84" stroke="#c0392b" stroke-width="3"/>' : ''}
        <path d="M380 70 H470" class="svg-conexion" fill="none" stroke="#1d5fb4" stroke-width="3"/>
        <rect x="470" y="40" width="130" height="64" rx="10" fill="#e7f0fb" stroke="#9db8dc"/><text x="535" y="66" class="svg-texto fuerte" text-anchor="middle">Entrada I1</text><text x="535" y="90" class="svg-texto mono" text-anchor="middle" style="font-size:18px">${entrada}</text>
        <path d="M600 72 H650" class="svg-conexion" fill="none" stroke="#2f3b4a" stroke-width="2"/>
        <circle cx="700" cy="100" r="42" fill="${P.motor ? '#d9f0e3' : '#fff'}" stroke="${P.motor ? '#1b8a5a' : '#2f3b4a'}" stroke-width="3"/><text x="700" y="96" class="svg-texto mono" text-anchor="middle" style="font-size:20px">M</text><text x="700" y="118" class="svg-texto" text-anchor="middle" style="font-size:11px">${P.motor ? 'MARCHA' : 'PARADO'}</text>`;
      N.querySelector('#nc-svg').innerHTML = svgs;
      let msg = '';
      if (P.accion === 'corte') msg = P.tipo === 'NC'
        ? '<div class="aviso ok"><b>Con paro NC:</b> el cable cortado deja la entrada en 0, igual que un paro pulsado. El PLC detiene el motor. <b>La falla es segura.</b></div>'
        : '<div class="aviso mal"><b>Con paro NA:</b> el cable cortado deja la entrada en 0, igual que «nadie pulsa». El PLC no se entera y <b>el paro ya no funcionaría</b> cuando se necesite.</div>';
      N.querySelector('#nc-res').innerHTML = msg;
    };
    N.querySelectorAll('[data-rol=tipo] button').forEach((b) => b.onclick = () => {
      P.tipo = b.dataset.v; P.accion = 'ok'; P.motor = false;
      N.querySelectorAll('[data-rol=tipo] button').forEach((x) => x.classList.toggle('activo', x === b)); nc();
    });
    N.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => {
      const a = b.dataset.a;
      if (a === 'marcha') { P.marcha = true; if (P.accion === 'paro') P.accion = 'ok'; }
      else if (a === 'rest') { P.accion = 'ok'; P.motor = false; }
      else P.accion = a;
      nc();
    });
    PL.activarPreguntas(N); nc();
    return { destruir() {}, pestana: T.pestana };
  };

  // ============================================================
  // 3) GEMELO DIGITAL (cápsula)
  // ============================================================
  II.diagramas.gemelo = function (cont) {
    const T = PL.pestanas(cont, [{ id: 'g', t: 'Planta y gemelo' }], 'g');
    const R = T.raiz('g');
    const G = { nivel: 40, falla: false };
    R.innerHTML = `
      <p class="sub" style="margin:0">El <b>gemelo digital</b> es un modelo que copia el comportamiento de la planta real y se compara con ella. Mueve la válvula y activa la falla.</p>
      <div class="lienzo"><svg viewBox="0 0 780 250" id="g-svg"></svg></div>
      <div class="deslizador"><label for="g-v">Apertura de la válvula de entrada</label><output id="g-o"></output><input type="range" id="g-v" min="0" max="100" step="5" value="40"></div>
      <div class="controles"><button type="button" class="boton" id="g-f">Simular falla en la planta real (válvula atascada)</button></div>
      <div id="g-r"></div>
      ${PL.pregunta('Si el gemelo dice que el nivel debería subir y la planta real no sube, ¿qué te indica?', 'Que hay una <b>diferencia entre el modelo y la realidad</b>: puede haber una falla (válvula atascada, fuga, sensor descalibrado) o que el modelo esté mal ajustado. Esa comparación es el valor del gemelo para el mantenimiento.')}`;
    const f = () => {
      const a = +R.querySelector('#g-v').value;
      const real = G.falla ? 20 : a;
      const nivelM = 10 + a * 0.7, nivelR = 10 + real * 0.7;
      const tk = (x, niv, tit, col) => `<text x="${x + 60}" y="30" class="svg-texto fuerte" text-anchor="middle">${tit}</text>
        <rect x="${x}" y="46" width="120" height="150" rx="8" fill="#fff" stroke="#5d6a7a" stroke-width="3"/>
        <rect x="${x + 2}" y="${196 - niv * 1.4}" width="116" height="${niv * 1.4 - 2}" fill="${col}" opacity=".55"/>
        <text x="${x + 60}" y="222" class="svg-texto mono" text-anchor="middle">${II.fmt(niv, 0)} %</text>`;
      R.querySelector('#g-svg').innerHTML = tk(80, nivelR, 'Planta real', '#4a9be0') + tk(580, nivelM, 'Gemelo digital', '#7a4bb0') +
        `<rect x="290" y="70" width="200" height="110" rx="10" fill="#f0f3f7" stroke="#cbd3dd"/><text x="390" y="100" class="svg-texto fuerte" text-anchor="middle">Mismas órdenes del PLC</text><text x="390" y="124" class="svg-texto" text-anchor="middle" style="font-size:11px">válvula ${a} %</text>
         <text x="390" y="152" class="svg-texto mono" text-anchor="middle" style="font-size:13px;fill:${Math.abs(nivelR - nivelM) > 3 ? '#c0392b' : '#1b8a5a'}">diferencia: ${II.fmt(Math.abs(nivelR - nivelM), 1)} %</text>
         <path d="M290 125 H200 M490 125 H580" class="svg-senal"/>`;
      R.querySelector('#g-o').textContent = a + ' %';
      R.querySelector('#g-r').innerHTML = Math.abs(nivelR - nivelM) > 3
        ? '<div class="aviso mal">La planta real <b>no se comporta como el modelo</b>: hay que investigar (válvula, sensor, fuga).</div>'
        : '<div class="aviso ok">Planta y modelo coinciden: el sistema se comporta como se espera.</div>';
      R.querySelector('#g-f').textContent = G.falla ? 'Reparar la válvula' : 'Simular falla en la planta real (válvula atascada)';
    };
    R.querySelector('#g-v').addEventListener('input', f);
    R.querySelector('#g-f').onclick = () => { G.falla = !G.falla; f(); };
    PL.activarPreguntas(R); f();
    return { destruir() {}, pestana: T.pestana };
  };
})();
