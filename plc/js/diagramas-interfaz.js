// ============================================================
// Interfaces industriales (06/11/2026): pantalla HMI, tabla de tags y comunicación Modbus RTU maestro-esclavo.
// Pestañas: hmi, tags, modbus. Atajos: interfaz_hmi, interfaz_tags, interfaz_modbus.
// Usa el modelo de PL.motores (GRAFCET de los dos motores). Dirección de esclavo 1; bobinas 00001 PA, 00002 PP, 00011 KA, 00012 KB; registro 40001 = T1 en décimas de s.
// ============================================================
(function () {
  const II = (window.II = window.II || {});
  II.diagramas = II.diagramas || {};
  const PL = (II.pl = II.pl || {});
  const G = '#2BD65B', GD = '#04260F', INK = 'var(--texto)', SEC = 'var(--texto-2)', S1 = 'var(--superficie-2)', S2 = 'var(--superficie)', BRD = 'var(--borde-2)';

  if (!document.getElementById('ifz-css')) {
    const st = document.createElement('style');
    st.id = 'ifz-css';
    st.textContent = `
.ifz-hmi{border:2px solid ${BRD};border-radius:12px;overflow:hidden;background:${S2};max-width:560px}
.ifz-bar{background:#E6F1FB;color:#0C447C;padding:6px 12px;font-weight:600;font-size:.9rem;display:flex;justify-content:space-between}
.ifz-body{padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ifz-m{border:1px solid var(--borde);border-radius:10px;padding:8px;text-align:center;background:${S1};font-size:.85rem}
.ifz-lamp{display:inline-block;width:14px;height:14px;border-radius:50%;background:var(--borde-2);vertical-align:middle;margin-right:6px}.ifz-lamp.on{background:${G}}
.ifz-btn{padding:12px;border-radius:10px;border:2px solid ${BRD};font-weight:600;cursor:pointer;touch-action:none;user-select:none;font-size:1rem;color:${INK};background:${S2}}
.ifz-btn.go{background:#EAF3DE;border-color:#639922;color:#27500A}.ifz-btn.st{background:#FCEBEB;border-color:#E24B4A;color:#791F1F}.ifz-btn.on{transform:scale(.97);border-width:4px}
.ifz-alm{grid-column:1/3;padding:8px;border-radius:8px;text-align:center;font-weight:600;font-size:.9rem;background:${S1};color:var(--texto-2)}.ifz-alm.on{background:#FCEBEB;color:#791F1F}
table.ifz-t{border-collapse:collapse;width:100%;font-size:.85rem}.ifz-t th,.ifz-t td{border-bottom:1px solid var(--borde);padding:6px 8px;text-align:left}.ifz-t th{color:var(--texto-2);font-weight:500;font-size:.78rem}
.ifz-v{display:inline-block;min-width:34px;text-align:center;padding:1px 8px;border-radius:6px;background:${S1};border:1px solid var(--borde);font-family:ui-monospace,Menlo,Consolas,monospace}.ifz-v.on{background:${G};border-color:${G};color:${GD}}
.ifz-fr{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}
.ifz-f{padding:4px 8px;border-radius:6px;text-align:center;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.9rem}
.ifz-f small{display:block;font-family:inherit;font-size:.65rem;opacity:.8}
.ifz-c0{background:#E6F1FB;color:#0C447C}.ifz-c1{background:#EEEDFE;color:#3C3489}.ifz-c2{background:#FAEEDA;color:#633806}.ifz-c3{background:#EAF3DE;color:#27500A}.ifz-c4{background:#F1EFE8;color:#444441}
@keyframes ifzgo{from{transform:translateX(0);opacity:1}to{transform:translateX(150px);opacity:.2}}@keyframes ifzback{from{transform:translateX(150px);opacity:1}to{transform:translateX(0);opacity:.2}}
.ifz-pk{display:inline-block;padding:2px 10px;border-radius:6px;font-size:.78rem;font-weight:600}
@media (prefers-reduced-motion:no-preference){.ifz-go{animation:ifzgo .9s ease-in-out forwards}.ifz-back{animation:ifzback .9s ease-in-out forwards}}`;
    document.head.appendChild(st);
  }
  const hex = (n, d = 2) => n.toString(16).toUpperCase().padStart(d, '0');
  const crc16 = (bytes) => {
    let c = 0xFFFF;
    bytes.forEach((b) => { c ^= b; for (let i = 0; i < 8; i++) c = c & 1 ? (c >> 1) ^ 0xA001 : c >> 1; });
    return [c & 0xFF, c >> 8];
  };

  II.diagramas.interfaz = (cont, opts = {}) => {
    cont.classList.add('diagrama');
    const M = PL.motores.crear();
    const defs = [{ id: 'hmi', t: '1 · Pantalla HMI' }, { id: 'tags', t: '2 · Tags y direcciones' }, { id: 'modbus', t: '3 · Comunicación Modbus' }];
    const ini = defs.some((d) => d.id === opts.pestana) ? opts.pestana : 'hmi';
    const T = PL.pestanas(cont, defs, ini);
    let vivo = true, raf = 0, last = performance.now(), ciclos = 0, antesE6 = 0, tKA = 0;
    const R = (id) => T.raiz(id);

    // ---- 1) pantalla HMI ----
    R('hmi').innerHTML = `<p style="margin:0 0 10px;line-height:1.6">Una <b>HMI</b> (interfaz hombre-máquina) es la pantalla del operador. No calcula la lógica: <b>lee y escribe variables del PLC</b>. Los botones de la pantalla son virtuales.</p>
      <div class="ifz-hmi"><div class="ifz-bar"><span>Estación de motores</span><span data-r="hora"></span></div><div class="ifz-body">
        <div class="ifz-m"><span class="ifz-lamp" data-r="la"></span><b>Motor A</b><div data-r="ta">Detenido</div></div>
        <div class="ifz-m"><span class="ifz-lamp" data-r="lb"></span><b>Motor B</b><div data-r="tb">Detenido</div></div>
        <div class="ifz-m" style="grid-column:1/3;text-align:left">Etapas activas: <b data-r="et">E0</b><br>Temporizador T1: <b data-r="t1">0,0</b> s &nbsp; Ciclos completados: <b data-r="ci">0</b><br>Motor A encendido: <b data-r="tk">0</b> s</div>
        <button type="button" class="ifz-btn go" data-r="go">MARCHA</button><button type="button" class="ifz-btn st" data-r="sp">PARO</button>
        <div class="ifz-alm" data-r="al">Sin alarmas</div></div></div>
      <p style="margin:10px 0 0;color:var(--texto-2);font-size:.85rem;line-height:1.55">MARCHA escribe un 1 en la variable PA del PLC; PARO pone en 0 la variable PP. Los motores, las etapas y los números son valores que la HMI <b>lee</b> del PLC.</p>`;
    const rh = (s) => R('hmi').querySelector(s);
    const bt = (el, n, v, rest) => {
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); M.I[n] = v; el.classList.add('on'); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((k) => el.addEventListener(k, () => { M.I[n] = rest; el.classList.remove('on'); }));
    };
    bt(rh('[data-r=go]'), 'PA', 1, 0); bt(rh('[data-r=sp]'), 'PP', 0, 1);

    // ---- 2) tags ----
    const TAGS = [
      ['MARCHA', 'Bobina 00001', 'Bit', 'HMI escribe', () => M.I.PA], ['PARO', 'Bobina 00002', 'Bit', 'HMI escribe', () => (M.I.PP ? 0 : 1)],
      ['MOTOR_A', 'Bobina 00011', 'Bit', 'HMI lee', () => M.S.KA], ['MOTOR_B', 'Bobina 00012', 'Bit', 'HMI lee', () => M.S.KB],
      ['ETAPA_1', 'Bobina 00021', 'Bit', 'HMI lee', () => M.S.E1], ['ETAPA_5', 'Bobina 00025', 'Bit', 'HMI lee', () => M.S.E5],
      ['T1_ACUM', 'Registro 40001', 'Entero (décimas de s)', 'HMI lee', () => Math.round(M.S.t1 * 10)]
    ];
    R('tags').innerHTML = `<p style="margin:0 0 10px;line-height:1.6">Cada variable que muestra la HMI se llama <b>tag</b> y está ligada a una <b>dirección</b> del PLC. Si la dirección es incorrecta, la pantalla muestra otro dato.</p>
      <table class="ifz-t"><thead><tr><th>Tag en la HMI</th><th>Dirección en el PLC</th><th>Tipo</th><th>Quién</th><th>Valor</th></tr></thead><tbody>${TAGS.map((t, i) => `<tr><td><b>${t[0]}</b></td><td>${t[1]}</td><td>${t[2]}</td><td>${t[3]}</td><td><span class="ifz-v" data-v="${i}">0</span></td></tr>`).join('')}</tbody></table>
      <p style="margin:10px 0 0;color:var(--texto-2);font-size:.85rem;line-height:1.55">Prueba en la pestaña 1: mantén MARCHA y mira cómo cambian los valores de esta tabla.</p>`;

    // ---- 3) Modbus ----
    const FUN = {
      leer: { t: 'Leer bobina (01)', f: 1 }, escribir: { t: 'Escribir bobina (05)', f: 5 }, reg: { t: 'Leer registro (03)', f: 3 }
    };
    let fun = 'leer';
    R('modbus').innerHTML = `<p style="margin:0 0 10px;line-height:1.6">La HMI (<b>maestro</b>) pregunta; el PLC (<b>esclavo</b>) responde. Elige una función y pulsa <b>Enviar</b>. Aquí se ve la trama de <b>Modbus RTU</b> en hexadecimal.</p>
      <div class="controles" data-r="fs" style="margin:0 0 10px"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:8px 0"><span class="ifz-pk ifz-c0">HMI (maestro)</span><div style="flex:1;height:2px;background:var(--borde-2);position:relative;overflow:hidden;min-width:60px"><span data-r="pk" style="position:absolute;left:0;top:-7px" class="ifz-pk ifz-c2"></span></div><span class="ifz-pk ifz-c3">PLC (esclavo 1)</span></div>
      <div data-r="req"></div><div data-r="res"></div><button type="button" class="boton" data-r="env">Enviar</button>
      <p data-r="nota" style="margin:10px 0 0;color:var(--texto-2);font-size:.85rem;line-height:1.55"></p>`;
    const rm = (s) => R('modbus').querySelector(s);
    const campos = (arr) => `<div class="ifz-fr">${arr.map((f) => `<div class="ifz-f ${f[2]}"><small>${f[0]}</small>${f[1]}</div>`).join('')}</div>`;
    const trama = (b) => { const c = crc16(b); return b.concat(c); };
    const construye = () => {
      let req, res, nota;
      if (fun === 'leer') {
        const b = [1, 1, 0, 10, 0, 1], r = [1, 1, 1, M.S.KA];
        req = campos([['Esclavo', '01', 'ifz-c0'], ['Función', '01', 'ifz-c1'], ['Dirección', '00 0A', 'ifz-c2'], ['Cantidad', '00 01', 'ifz-c2'], ['CRC', trama(b).slice(6).map((x) => hex(x)).join(' '), 'ifz-c4']]);
        res = campos([['Esclavo', '01', 'ifz-c0'], ['Función', '01', 'ifz-c1'], ['Bytes', '01', 'ifz-c2'], ['Dato', '0' + M.S.KA, 'ifz-c3'], ['CRC', trama(r).slice(4).map((x) => hex(x)).join(' '), 'ifz-c4']]);
        nota = 'Lee la bobina 00011 (MOTOR_A): la dirección en la trama es 10 (0A) porque Modbus empieza a contar desde 0. El dato es 1 si el motor A está encendido.';
      } else if (fun === 'escribir') {
        const b = [1, 5, 0, 0, 0xFF, 0];
        req = campos([['Esclavo', '01', 'ifz-c0'], ['Función', '05', 'ifz-c1'], ['Dirección', '00 00', 'ifz-c2'], ['Valor', 'FF 00', 'ifz-c3'], ['CRC', trama(b).slice(6).map((x) => hex(x)).join(' '), 'ifz-c4']]);
        res = campos([['Esclavo', '01', 'ifz-c0'], ['Función', '05', 'ifz-c1'], ['Dirección', '00 00', 'ifz-c2'], ['Valor', 'FF 00', 'ifz-c3'], ['CRC', trama(b).slice(6).map((x) => hex(x)).join(' '), 'ifz-c4']]);
        nota = 'Escribe 1 en la bobina 00001 (MARCHA): FF00 significa 1 y 0000 significa 0. El PLC responde repitiendo la trama. Al enviar, la maniobra arranca los motores.';
      } else {
        const v = Math.round(M.S.t1 * 10), b = [1, 3, 0, 0, 0, 1], r = [1, 3, 2, v >> 8, v & 255];
        req = campos([['Esclavo', '01', 'ifz-c0'], ['Función', '03', 'ifz-c1'], ['Dirección', '00 00', 'ifz-c2'], ['Cantidad', '00 01', 'ifz-c2'], ['CRC', trama(b).slice(6).map((x) => hex(x)).join(' '), 'ifz-c4']]);
        res = campos([['Esclavo', '01', 'ifz-c0'], ['Función', '03', 'ifz-c1'], ['Bytes', '02', 'ifz-c2'], ['Dato', hex(v >> 8) + ' ' + hex(v & 255), 'ifz-c3'], ['CRC', trama(r).slice(5).map((x) => hex(x)).join(' '), 'ifz-c4']]);
        nota = `Lee el registro 40001 (T1_ACUM), que ahora vale ${v} décimas de segundo (${(v / 10).toFixed(1).replace('.', ',')} s). El dato va en dos bytes.`;
      }
      rm('[data-r=req]').innerHTML = '<b style="font-size:.82rem;color:var(--texto-2)">Petición del maestro</b>' + req;
      rm('[data-r=res]').innerHTML = '<b style="font-size:.82rem;color:var(--texto-2)">Respuesta del esclavo</b>' + res;
      rm('[data-r=nota]').textContent = nota;
    };
    rm('[data-r=fs]').innerHTML = Object.keys(FUN).map((k) => `<button type="button" class="boton chico eqz-btn" data-k="${k}">${FUN[k].t}</button>`).join('');
    const marca = () => rm('[data-r=fs]').querySelectorAll('button').forEach((b) => b.classList.toggle('sel', b.dataset.k === fun));
    rm('[data-r=fs]').querySelectorAll('button').forEach((b) => (b.onclick = () => { fun = b.dataset.k; marca(); construye(); }));
    rm('[data-r=env]').onclick = () => {
      construye();
      const pk = rm('[data-r=pk]'); pk.textContent = 'petición'; pk.className = 'ifz-pk ifz-c2 ifz-go';
      setTimeout(() => { pk.textContent = 'respuesta'; pk.className = 'ifz-pk ifz-c3 ifz-back'; }, 950);
      if (fun === 'escribir') { M.I.PA = 1; setTimeout(() => (M.I.PA = 0), 400); }
    };
    marca(); construye();

    // ---- bucle ----
    const lazo = (now) => {
      if (!vivo) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      M.scan(dt);
      if (M.S.E6 && !antesE6) ciclos += 1; antesE6 = M.S.E6;
      if (M.S.KA) tKA += dt;
      if (PL.ver(R('hmi'))) {
        rh('[data-r=la]').classList.toggle('on', !!M.S.KA); rh('[data-r=lb]').classList.toggle('on', !!M.S.KB);
        rh('[data-r=ta]').textContent = M.S.KA ? 'En marcha' : 'Detenido'; rh('[data-r=tb]').textContent = M.S.KB ? 'En marcha' : 'Detenido';
        const ac = ['E0', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6'].filter((n) => M.S[n]); rh('[data-r=et]').textContent = ac.join(' ') || '-';
        rh('[data-r=t1]').textContent = M.S.t1.toFixed(1).replace('.', ','); rh('[data-r=ci]').textContent = ciclos; rh('[data-r=tk]').textContent = Math.round(tKA);
        rh('[data-r=hora]').textContent = new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const alm = rh('[data-r=al]'); alm.classList.toggle('on', !M.I.PP); alm.textContent = M.I.PP ? 'Sin alarmas' : 'ALARMA: paro de emergencia activo';
      }
      if (PL.ver(R('tags'))) R('tags').querySelectorAll('[data-v]').forEach((s) => { const v = TAGS[+s.dataset.v][4](); s.textContent = v; s.classList.toggle('on', !!v); });
      raf = requestAnimationFrame(lazo);
    };
    raf = requestAnimationFrame(lazo);
    return { destruir() { vivo = false; cancelAnimationFrame(raf); }, pestana: T.pestana };
  };
  ['hmi', 'tags', 'modbus'].forEach((id) => { II.diagramas['interfaz_' + id] = (cont, o = {}) => II.diagramas.interfaz(cont, { ...o, pestana: id }); });
})();
