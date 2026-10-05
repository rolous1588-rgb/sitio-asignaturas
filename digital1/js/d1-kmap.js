// ============================================================
// Electrónica Digital 1 — núcleo de mapas de Karnaugh
//   D1.k.resolver(nv, vals)        → solución mínima (suma de productos)
//   D1.k.svg / dibujar / estatico  → dibuja un mapa (con grupos)
//   D1.k.cubo(nv, celdas)          → ¿las celdas tocadas forman un grupo válido?
//   D1.k.editor(contenedor, opc)   → mapa para el celular: llenar → agrupar
// vals[m]: 0, 1 o 2 (= X, «no importa»). Mintérmino m: A es el bit más alto.
// ============================================================
(function () {
  const D1 = (window.D1 = window.D1 || {});
  const K = (D1.k = {});
  const GC = (K.GC = ['#1c7ed6', '#e8590c', '#2b8a3e', '#ae3ec9', '#0c8599', '#c92a2a', '#f08c00', '#5f3dc4']);
  const pc = (K.pc = (x) => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; });
  const bin = (K.bin = (x, n) => x.toString(2).padStart(n, '0'));
  K.N3 = ['A', 'B', 'C'];
  K.N4 = ['A', 'B', 'C', 'D'];
  const OV = (K.OV = (s) => '<span class="ov">' + s + '</span>');
  const nombres = (nv, n) => n || (nv === 4 ? K.N4 : K.N3);

  // ---------- solución mínima: primos + cobertura exacta ----------
  K.resolver = function (nv, vals) {
    const N = 1 << nv, unos = [];
    for (let m = 0; m < N; m++) if (vals[m] === 1) unos.push(m);
    if (!unos.length) return { cubos: [], lits: 0 };
    const ok = (mask, val) => { for (let m = 0; m < N; m++) if ((m & mask) === val && vals[m] === 0) return false; return true; };
    const pr = [];
    for (let mask = 0; mask < N; mask++) for (let val = 0; val < N; val++) {
      if (val & ~mask) continue;
      if (!ok(mask, val)) continue;
      let primo = true;
      for (let b = 1; b < N; b <<= 1) if ((mask & b) && ok(mask & ~b, val & ~b)) { primo = false; break; }
      if (!primo || !unos.some((m) => (m & mask) === val)) continue;
      pr.push({ mask, val, lits: pc(mask) });
    }
    pr.sort((a, b) => a.lits - b.lits || b.mask - a.mask || b.val - a.val);
    const cub = (p, m) => (m & p.mask) === p.val;
    let mejor = null, mejorL = 1e9;
    const ch = [];
    (function rec(pend, L) {
      if (mejor && (ch.length > mejor.length || (ch.length === mejor.length && L >= mejorL))) return;
      if (!pend.length) { mejor = ch.slice(); mejorL = L; return; }
      if (mejor && ch.length + 1 > mejor.length) return;
      let elegido = pend[0], cnt = 1e9;
      for (const m of pend) { let c = 0; for (const p of pr) if (cub(p, m)) c++; if (c < cnt) { cnt = c; elegido = m; } }
      for (const p of pr) if (cub(p, elegido)) { ch.push(p); rec(pend.filter((m) => !cub(p, m)), L + p.lits); ch.pop(); }
    })(unos, 0);
    mejor.sort((a, b) => a.lits - b.lits || b.mask - a.mask || b.val - a.val);
    return { cubos: mejor.map((c) => ({ mask: c.mask, val: c.val })), lits: mejorL };
  };

  K.lits = (cubos) => cubos.reduce((a, c) => a + pc(c.mask), 0);
  K.termino = function (cb, nv, n) {
    n = nombres(nv, n);
    if (!cb.mask) return '1';
    const out = [];
    for (let i = 0; i < nv; i++) { const b = 1 << (nv - 1 - i); if (cb.mask & b) out.push(cb.val & b ? n[i] : OV(n[i])); }
    return out.join('·');
  };
  K.expr = function (cubos, nv, n, color) {
    if (!cubos || !cubos.length) return '0';
    return cubos.map((c, i) => (color ? '<span style="color:' + GC[i % GC.length] + '">' + K.termino(c, nv, n) + '</span>' : K.termino(c, nv, n))).join(' + ');
  };
  // valor de la suma de productos en cada celda
  K.evaluar = (nv, cubos) => Array.from({ length: 1 << nv }, (_, m) => (cubos.some((c) => (m & c.mask) === c.val) ? 1 : 0));
  // ¿los grupos dan la misma función (ignorando las X)?
  K.equivale = (nv, cubos, f) => { const v = K.evaluar(nv, cubos); return f.every((x, m) => x === 2 || v[m] === x); };
  K.minterminos = (f) => f.map((v, m) => (v === 1 ? m : -1)).filter((m) => m >= 0);
  K.noImporta = (f) => f.map((v, m) => (v === 2 ? m : -1)).filter((m) => m >= 0);

  // ---------- ¿las celdas elegidas forman un grupo? ----------
  K.cubo = function (nv, celdas, vals) {
    if (!celdas.length) return { ok: false, motivo: 'Toca las celdas que quieres agrupar.' };
    const N = (1 << nv) - 1;
    let y = N, o = 0;
    celdas.forEach((m) => { y &= m; o |= m; });
    const mask = N & ~(y ^ o), val = y & mask;
    const n = celdas.length;
    if (n & (n - 1)) return { ok: false, motivo: 'Un grupo tiene 1, 2, 4 u 8 celdas, no ' + n + '.' };
    if (1 << (nv - pc(mask)) !== n) return { ok: false, motivo: 'Esas celdas no son vecinas en rectángulo (recuerda que los bordes se tocan).' };
    if (vals && celdas.some((m) => vals[m] === 0)) return { ok: false, motivo: 'El grupo incluye un 0: solo se agrupan unos (y X).' };
    if (vals && !celdas.some((m) => vals[m] === 1)) return { ok: false, motivo: 'Un grupo solo de X no sirve: debe tener al menos un 1.' };
    return { ok: true, cubo: { mask, val } };
  };

  // ---------- dibujo ----------
  function lay(nv) { return { filas: nv === 4 ? [0, 1, 3, 2] : [0, 1], cols: [0, 1, 3, 2] }; }
  function tramos(lista, n) {
    if (lista.length === n) return [{ a: 0, b: n - 1 }];
    const r = [];
    let s = null, p = null;
    lista.forEach((i) => { if (s === null) { s = i; p = i; } else if (i === p + 1) p = i; else { r.push({ a: s, b: p }); s = i; p = i; } });
    r.push({ a: s, b: p });
    if (r.length > 1 && r[0].a === 0 && r[r.length - 1].b === n - 1) { r[0].lo = true; r[r.length - 1].hi = true; }
    return r;
  }
  // opciones: nombres, grupos (cubos), cls(m) → clase extra, etiqueta(m) → texto en vez del valor, blanco0, mt (número de celda)
  K.svg = function (nv, vals, o) {
    o = o || {};
    const n = nombres(nv, o.nombres);
    const L = lay(nv), cs = 40, X0 = 52, Y0 = 42, nf = L.filas.length, nc = 4, W = X0 + nc * cs, H = Y0 + nf * cs;
    const sp = n.some((x) => x.length > 1) ? ' ' : '';
    const rl = (nv === 4 ? n.slice(0, 2) : n.slice(0, 1)).join(sp), cl = (nv === 4 ? n.slice(2) : n.slice(1)).join(sp);
    let h = '<text class="kh kvar" text-anchor="middle" x="' + (X0 + nc * cs / 2) + '" y="13">' + cl + '</text>' +
      '<text class="kh kvar" text-anchor="end" x="' + (X0 - 8) + '" y="' + (Y0 - 10) + '">' + rl + '</text>';
    for (let c = 0; c < nc; c++) h += '<text class="kh" text-anchor="middle" x="' + (X0 + c * cs + cs / 2) + '" y="' + (Y0 - 10) + '">' + bin(L.cols[c], 2) + '</text>';
    for (let r = 0; r < nf; r++) h += '<text class="kh" text-anchor="end" x="' + (X0 - 8) + '" y="' + (Y0 + r * cs + cs / 2 + 5) + '">' + bin(L.filas[r], nv === 4 ? 2 : 1) + '</text>';
    let tx = '';
    for (let r = 0; r < nf; r++) for (let c = 0; c < nc; c++) {
      const m = (L.filas[r] << 2) | L.cols[c], x = X0 + c * cs, y = Y0 + r * cs, v = vals ? vals[m] : 0;
      h += '<rect class="kc ' + (o.cls ? o.cls(m) : '') + '" data-m="' + m + '" x="' + x + '" y="' + y + '" width="' + cs + '" height="' + cs + '"/>';
      if (o.etiqueta) tx += '<text class="kcode" x="' + (x + cs / 2) + '" y="' + (y + cs / 2 + 4) + '">' + o.etiqueta(m) + '</text>';
      else {
        const t = v === 1 ? '1' : v === 2 ? 'X' : o.blanco0 ? '' : '0';
        if (t) tx += '<text class="kv ' + (v === 1 ? 'v1' : v === 2 ? 'vx' : 'v0') + '" x="' + (x + cs / 2) + '" y="' + (y + cs / 2 + 7) + '">' + t + '</text>';
      }
      if (o.mt !== false && !o.etiqueta) tx += '<text class="km" x="' + (x + 3) + '" y="' + (y + 11) + '">' + m + '</text>';
    }
    const rmask = ((1 << nv) - 1) ^ 3;
    (o.grupos || []).forEach((cb, gi) => {
      const col = GC[gi % GC.length], ins = 4 + 3 * (gi % 3), rs = [], cz = [];
      for (let r = 0; r < nf; r++) if (((L.filas[r] << 2) & cb.mask & rmask) === (cb.val & rmask)) rs.push(r);
      for (let c = 0; c < nc; c++) if ((L.cols[c] & cb.mask & 3) === (cb.val & 3)) cz.push(c);
      tramos(rs, nf).forEach((R) => tramos(cz, nc).forEach((C) => {
        let x0 = X0 + C.a * cs + ins, x1 = X0 + (C.b + 1) * cs - ins, y0 = Y0 + R.a * cs + ins, y1 = Y0 + (R.b + 1) * cs - ins;
        const abierto = C.lo || C.hi || R.lo || R.hi;
        if (C.lo) x0 = X0 - 8; if (C.hi) x1 = W + 8; if (R.lo) y0 = Y0 - 8; if (R.hi) y1 = H + 8;
        h += '<rect class="kg" x="' + x0 + '" y="' + y0 + '" width="' + (x1 - x0) + '" height="' + (y1 - y0) + '" rx="' + (abierto ? 0 : 8) + '" style="fill:' + col + ';stroke:' + (abierto ? 'none' : col) + '"/>';
        if (abierto) {
          let d = '';
          if (!R.lo) d += 'M' + x0 + ',' + y0 + 'H' + x1;
          if (!C.hi) d += 'M' + x1 + ',' + y0 + 'V' + y1;
          if (!R.hi) d += 'M' + x0 + ',' + y1 + 'H' + x1;
          if (!C.lo) d += 'M' + x0 + ',' + y0 + 'V' + y1;
          h += '<path d="' + d + '" style="fill:none;stroke:' + col + ';stroke-width:3;stroke-linecap:round;pointer-events:none"/>';
        }
      }));
    });
    return { html: h + tx, vb: '0 0 ' + (W + 12) + ' ' + (H + 12) };
  };
  K.dibujar = (svg, nv, vals, o) => { const r = K.svg(nv, vals, o); svg.setAttribute('viewBox', r.vb); svg.innerHTML = r.html; };
  K.estatico = (nv, vals, o) => { const r = K.svg(nv, vals, o); return '<svg class="kmapa" viewBox="' + r.vb + '">' + r.html + '</svg>'; };
  K.alTocar = (svg, fn) => { svg.addEventListener('click', (e) => { const c = e.target.closest('[data-m]'); if (c) fn(+c.dataset.m); }); };

  // tabla de verdad compacta (HTML)
  K.tablaHTML = function (nv, f, o) {
    o = o || {};
    const n = nombres(nv, o.nombres);
    let h = '<table class="tt tight"><tr>' + n.map((x) => '<th>' + x + '</th>').join('') + '<th>' + (o.salida || 'Y') + '</th></tr>';
    for (let m = 0; m < 1 << nv; m++) {
      const v = f[m];
      h += '<tr>' + n.map((_, i) => '<td>' + ((m >> (nv - 1 - i)) & 1) + '</td>').join('') +
        '<td class="' + (v === 1 ? 'v1' : v === 2 ? 'vx' : '') + '">' + (v === 2 ? 'X' : v) + '</td></tr>';
    }
    return h + '</table>';
  };

  // ============================================================
  // Editor para el celular: 1) llenar el mapa  2) agrupar tocando celdas
  //   opc: { nv, nombres, conX, vals (inicial), fijo (no se puede llenar), salida }
  //   API: estado(), fijar(est), movimientos(), segundos(), alCambiar(fn), destruir()
  // ============================================================
  K.editor = function (cont, opc) {
    const nv = opc.nv, n = nombres(nv, opc.nombres), N = 1 << nv;
    const st = {
      vals: (opc.vals || Array(N).fill(0)).slice(),
      grupos: [],
      modo: opc.fijo ? 'agrupar' : 'llenar',
      sel: []
    };
    let mov = 0, vivo = true;
    const t0 = Date.now(), oyentes = [];
    const raiz = document.createElement('div');
    raiz.className = 'ked';
    cont.appendChild(raiz);
    raiz.innerHTML =
      (opc.fijo ? '' : '<div class="ked-modos"><button data-modo="llenar">1 · Llenar</button><button data-modo="agrupar">2 · Agrupar</button></div>') +
      '<p class="ked-ayuda"></p><svg class="ked-mapa"></svg>' +
      '<div class="ked-sel"><span class="ked-msg"></span><div class="ked-bts"><button class="boton prim" data-x="formar">Formar grupo</button><button class="boton" data-x="limpiar">Soltar</button></div></div>' +
      '<div class="ked-grupos"></div><p class="ked-expr"></p>';
    const $ = (s) => raiz.querySelector(s);
    const svg = $('.ked-mapa');
    const avisar = () => { mov++; oyentes.forEach((fn) => fn(estado())); };
    const estado = () => ({ vals: st.vals.slice(), grupos: st.grupos.map((g) => ({ mask: g.mask, val: g.val })) });

    function pintar() {
      if (!vivo) return;
      raiz.querySelectorAll('[data-modo]').forEach((b) => b.classList.toggle('sel', b.dataset.modo === st.modo));
      $('.ked-ayuda').innerHTML = st.modo === 'llenar'
        ? 'Toca cada celda para cambiarla: 0 → 1' + (opc.conX ? ' → X' : '') + ' → 0.'
        : 'Toca las celdas de un grupo y presiona <b>Formar grupo</b>.';
      const selS = new Set(st.sel);
      K.dibujar(svg, nv, st.vals, { nombres: n, grupos: st.grupos, cls: (m) => (selS.has(m) ? 'sel' : '') });
      const enGrupo = st.modo === 'agrupar';
      $('.ked-sel').classList.toggle('oculto', !enGrupo);
      if (enGrupo) {
        const c = K.cubo(nv, st.sel, st.vals);
        $('.ked-msg').innerHTML = !st.sel.length ? 'Ninguna celda elegida.' : c.ok ? 'Grupo: <b>' + K.termino(c.cubo, nv, n) + '</b>' : '<span class="mal-t">' + c.motivo + '</span>';
        $('[data-x="formar"]').disabled = !c.ok;
        $('[data-x="limpiar"]').disabled = !st.sel.length;
      }
      $('.ked-grupos').innerHTML = st.grupos.map((g, i) =>
        '<button class="ked-chip" data-g="' + i + '" style="border-color:' + GC[i % GC.length] + ';color:' + GC[i % GC.length] + '">' + K.termino(g, nv, n) + ' <span>✕</span></button>').join('');
      $('.ked-expr').innerHTML = (opc.salida || 'Y') + ' = ' + (st.grupos.length ? K.expr(st.grupos, nv, n, true) : '<span class="lbl">sin grupos todavía</span>');
    }

    K.alTocar(svg, (m) => {
      if (st.modo === 'llenar') {
        const v = st.vals[m];
        st.vals[m] = v === 0 ? 1 : v === 1 ? (opc.conX ? 2 : 0) : 0;
        // los grupos que ahora incluyen un 0 dejan de valer
        const antes = st.grupos.length;
        st.grupos = st.grupos.filter((g) => !st.vals.some((x, k) => x === 0 && (k & g.mask) === g.val));
        if (st.grupos.length !== antes) flash('Se quitó un grupo que ahora incluía un 0.');
      } else {
        const i = st.sel.indexOf(m);
        if (i >= 0) st.sel.splice(i, 1); else st.sel.push(m);
      }
      pintar();
      avisar();
    });
    raiz.addEventListener('click', (e) => {
      const md = e.target.closest('[data-modo]');
      if (md) { st.modo = md.dataset.modo; st.sel = []; pintar(); return; }
      const x = e.target.closest('[data-x]');
      if (x && x.dataset.x === 'formar') {
        const c = K.cubo(nv, st.sel, st.vals);
        if (!c.ok) return;
        if (st.grupos.some((g) => g.mask === c.cubo.mask && g.val === c.cubo.val)) flash('Ese grupo ya existe.');
        else st.grupos.push(c.cubo);
        st.sel = [];
        pintar(); avisar(); return;
      }
      if (x && x.dataset.x === 'limpiar') { st.sel = []; pintar(); return; }
      const g = e.target.closest('[data-g]');
      if (g) { st.grupos.splice(+g.dataset.g, 1); pintar(); avisar(); }
    });
    let flashT = null;
    function flash(t) {
      const a = $('.ked-ayuda');
      a.innerHTML = '<span class="mal-t">' + t + '</span>';
      clearTimeout(flashT);
      flashT = setTimeout(pintar, 2200);
    }
    pintar();
    return {
      estado,
      fijar(e) {
        if (!e) return;
        if (e.vals && !opc.fijo) st.vals = e.vals.slice();
        if (e.grupos) st.grupos = e.grupos.map((g) => ({ mask: g.mask, val: g.val }));
        pintar();
      },
      fijarValores(v) { st.vals = v.slice(); st.grupos = st.grupos.filter((g) => !st.vals.some((x, k) => x === 0 && (k & g.mask) === g.val)); pintar(); },
      movimientos: () => mov,
      segundos: () => Math.round((Date.now() - t0) / 1000),
      alCambiar: (fn) => oyentes.push(fn),
      destruir: () => { vivo = false; raiz.remove(); }
    };
  };
})();
