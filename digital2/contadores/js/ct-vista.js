// ============================================================
// Electrónica Digital 2 · Práctica de contadores — dibujos compartidos
//   CT.svgContador(n, ents, o)  → esquema del contador: n flip-flops JK con el mismo reloj
//                                  y la red de compuertas de cada J y K (etiquetas Qi / Q̄i en las entradas)
//   CT.htmlTrans / htmlJK / htmlMapas / htmlSim → vistas de solo lectura (estudiante y panel docente)
// Requiere ct-motor.js y base/kmap.js.
// ============================================================
(function () {
  const CT = window.CT;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------------- esquema del contador ----------------
  const XL = 46;          // borde derecho de las etiquetas de entrada
  const XA = 70;          // izquierda de las AND
  const XO = 136;         // izquierda de la OR
  const XF = 204;         // izquierda del flip-flop
  const WF = 58;          // ancho del flip-flop

  // etiqueta Qi o Q̄i con la barra dibujada (ancho fijo para que la barra calce)
  function etiqueta(x, y, i, n, neg, cls) {
    const b = n - 1 - i;
    let s = '<text class="ct-lit ' + (cls || '') + '" x="' + (x - 18) + '" y="' + (y + 4.5) + '" textLength="17" lengthAdjust="spacingAndGlyphs">Q' + CT.sub(b) + '</text>';
    if (neg) s += '<line class="ct-ovl" x1="' + (x - 18) + '" y1="' + (y - 7.5) + '" x2="' + (x - 1) + '" y2="' + (y - 7.5) + '"/>';
    return s;
  }
  function puertaAND(x, yc, h) {
    const y0 = yc - h / 2;
    return '<path class="ct-g" d="M' + x + ',' + y0 + ' H' + (x + 12) + ' A' + h / 2 + ',' + h / 2 + ' 0 0 1 ' + (x + 12) + ',' + (y0 + h) + ' H' + x + ' Z"/>';
  }
  const anchoAND = (h) => 12 + h / 2;
  function puertaOR(x, yc, h) {
    const y0 = yc - h / 2;
    return '<path class="ct-g" d="M' + x + ',' + y0 + ' Q' + (x + 9) + ',' + yc + ' ' + x + ',' + (y0 + h) + ' Q' + (x + 26) + ',' + (y0 + h) + ' ' + (x + 38) + ',' + yc + ' Q' + (x + 26) + ',' + y0 + ' ' + x + ',' + y0 + ' Z"/>';
  }
  const altoPuerta = (m) => Math.max(26, m * 13 + 6);
  function altoRed(ent) {
    if (CT.entVacia(ent) || ent.c === 0 || ent.c === 1) return 30;
    const g = ent.p.filter((x) => x.length);
    return Math.max(30, g.reduce((a, x) => a + altoPuerta(x.length) + 6, 0));
  }
  // dibuja la red de una entrada (cables primero, compuertas encima); yPin = altura del pin J o K
  function red(n, ent, y0, h, yPin, activo) {
    let s = '';
    if (activo) s += '<rect class="ct-act" x="2" y="' + (y0 - 2) + '" width="' + (XF - 4) + '" height="' + (h + 4) + '" rx="8"/>';
    if (CT.entVacia(ent)) {
      return s + '<line class="ct-w ct-falta" x1="' + (XF - 60) + '" y1="' + yPin + '" x2="' + XF + '" y2="' + yPin + '"/>' +
        '<text class="ct-q" x="' + (XF - 66) + '" y="' + (yPin + 5) + '" text-anchor="end">?</text>';
    }
    if (ent.c === 1 || ent.c === 0) {
      return s + '<line class="ct-w" x1="' + (XF - 40) + '" y1="' + yPin + '" x2="' + XF + '" y2="' + yPin + '"/>' +
        '<text class="ct-k" x="' + (XF - 46) + '" y="' + (yPin + 5) + '" text-anchor="end">' + ent.c + '</text>';
    }
    const g = ent.p.filter((x) => x.length).map((x) => x.slice().sort((a, b) => a - b));
    const multi = g.length > 1;
    const total = g.reduce((a, x) => a + altoPuerta(x.length) + 6, 0) - 6;
    let y = y0 + (h - total) / 2;
    const cs = g.map((lits) => { const hp = altoPuerta(lits.length), yc = y + hp / 2; y += hp + 6; return { lits, hp, yc }; });
    let orYc = yPin, ho = 0;
    if (multi) {
      const top = cs[0].yc, bot = cs[cs.length - 1].yc;
      ho = Math.max(30, bot - top + 14);
      orYc = (top + bot) / 2;
    }
    let cables = '', puertas = '';
    cs.forEach(({ lits, hp, yc }) => {
      let xs;
      if (lits.length === 1) {
        cables += etiqueta(XL, yc, lits[0] >> 1, n, lits[0] & 1);
        xs = XL + 3;
      } else {
        lits.forEach((c, k) => {
          const yi = yc - ((lits.length - 1) * 13) / 2 + k * 13;
          cables += etiqueta(XL, yi, c >> 1, n, c & 1) + '<line class="ct-w" x1="' + (XL + 3) + '" y1="' + yi + '" x2="' + (XA + 2) + '" y2="' + yi + '"/>';
        });
        puertas += puertaAND(XA, yc, hp);
        xs = XA + anchoAND(hp);
      }
      if (multi) {
        const ty = Math.min(Math.max(yc, orYc - ho / 2 + 5), orYc + ho / 2 - 5);
        cables += Math.abs(ty - yc) < 0.5
          ? '<line class="ct-w" x1="' + xs + '" y1="' + yc + '" x2="' + (XO + 6) + '" y2="' + yc + '"/>'
          : '<polyline class="ct-w" points="' + xs + ',' + yc + ' ' + (XO - 6) + ',' + yc + ' ' + (XO - 6) + ',' + ty + ' ' + (XO + 6) + ',' + ty + '"/>';
      } else {
        cables += Math.abs(yPin - yc) < 0.5
          ? '<line class="ct-w" x1="' + xs + '" y1="' + yc + '" x2="' + XF + '" y2="' + yc + '"/>'
          : '<polyline class="ct-w" points="' + xs + ',' + yc + ' ' + (XF - 10) + ',' + yc + ' ' + (XF - 10) + ',' + yPin + ' ' + XF + ',' + yPin + '"/>';
      }
    });
    if (multi) {
      cables += '<polyline class="ct-w" points="' + (XO + 38) + ',' + orYc + ' ' + (XF - 10) + ',' + orYc + ' ' + (XF - 10) + ',' + yPin + ' ' + XF + ',' + yPin + '"/>';
      puertas += puertaOR(XO, orYc, ho);
    }
    return s + cables + puertas;
  }

  // o: { activo: índice de entrada resaltada }
  CT.svgContador = function (n, ents, o) {
    o = o || {};
    const W = XF + WF + 66;
    let s = '', y = 26;
    s += '<text class="ct-tit" x="4" y="14">Contador síncrono de ' + n + ' bits con flip-flops JK</text>';
    for (let j = 0; j < n; j++) {
      const b = n - 1 - j, eJ = ents[2 * j], eK = ents[2 * j + 1];
      const hJ = altoRed(eJ), hK = altoRed(eK), gap = 26;
      const yJ = y + hJ / 2, yK = y + hJ + gap + hK / 2, yC = (yJ + yK) / 2;
      s += red(n, eJ, y, hJ, yJ, o.activo === 2 * j) + red(n, eK, y + hJ + gap, hK, yK, o.activo === 2 * j + 1);
      // flip-flop
      const fy0 = yJ - 16, fy1 = yK + 16;
      s += '<rect class="ct-ff" x="' + XF + '" y="' + fy0 + '" width="' + WF + '" height="' + (fy1 - fy0) + '" rx="4"/>' +
        '<text class="ct-pin" x="' + (XF + 6) + '" y="' + (yJ + 5) + '">J</text>' +
        '<text class="ct-pin" x="' + (XF + 6) + '" y="' + (yK + 5) + '">K</text>' +
        '<path class="ct-ckt" d="M' + XF + ',' + (yC - 6) + ' L' + (XF + 9) + ',' + yC + ' L' + XF + ',' + (yC + 6) + '"/>' +
        '<text class="ct-ffn" x="' + (XF + WF / 2 + 4) + '" y="' + (yC + 5) + '" text-anchor="middle">FF' + CT.sub(b) + '</text>' +
        '<text class="ct-pin" x="' + (XF + WF - 6) + '" y="' + (yJ + 5) + '" text-anchor="end">Q</text>' +
        '<text class="ct-pin" x="' + (XF + WF - 6) + '" y="' + (yK + 5) + '" text-anchor="end">Q</text>' +
        '<line class="ct-ovl2" x1="' + (XF + WF - 16) + '" y1="' + (yK - 9) + '" x2="' + (XF + WF - 6) + '" y2="' + (yK - 9) + '"/>' +
        // reloj
        '<line class="ct-w ct-clk" x1="' + (XF - 34) + '" y1="' + yC + '" x2="' + XF + '" y2="' + yC + '"/>' +
        '<text class="ct-clkt" x="' + (XF - 37) + '" y="' + (yC + 4) + '" text-anchor="end">CLK</text>' +
        // salidas
        '<line class="ct-w" x1="' + (XF + WF) + '" y1="' + yJ + '" x2="' + (XF + WF + 26) + '" y2="' + yJ + '"/>' +
        '<line class="ct-w" x1="' + (XF + WF) + '" y1="' + yK + '" x2="' + (XF + WF + 26) + '" y2="' + yK + '"/>' +
        etiqueta(XF + WF + 50, yJ, j, n, false, 'ct-sal') + etiqueta(XF + WF + 50, yK, j, n, true, 'ct-sal');
      y += hJ + gap + hK + 26;
    }
    s += '<text class="ct-nota" x="4" y="' + (y - 6) + '">Todos los CLK van al mismo reloj (contador síncrono).</text>' +
      '<text class="ct-nota" x="4" y="' + (y + 8) + '">Las entradas Q y Q̄ de la izquierda salen de los flip-flops.</text>';
    return '<svg class="ct-esq" viewBox="0 0 ' + W + ' ' + (y + 14) + '" role="img" aria-label="Esquema del contador">' + s + '</svg>';
  };

  // ---------------- tablas de solo lectura ----------------
  const clsIt = (it) => (!it ? '' : it.est === 'ok' ? (it.int <= 1 ? 'ok' : 'ok2') : it.est === 'mos' ? 'mos' : it.est === 'mal' ? 'mal' : '');
  CT.clsIt = clsIt;
  CT.htmlTrans = function (E) {
    const d = CT.datos(E), n = E.n;
    let h = '<table class="ct-tab"><tr><th>Estado</th><th>Presente</th><th>Siguiente</th></tr>';
    for (let s = 0; s < d.N; s++) {
      const f = (E.p2 && E.p2.f[s]) || {};
      h += '<tr class="' + clsIt(f) + (d.usado(s) ? '' : ' nu') + '"><td>' + s + (d.usado(s) ? '' : ' <small>no usado</small>') + '</td><td class="mono">' + CT.bin(s, n) + '</td><td class="mono">' +
        (f.r ? f.r.map(CT.txtBit).join('') : '?'.repeat(n)) + '</td></tr>';
    }
    return h + '</table>';
  };
  CT.htmlJK = function (E) {
    const n = E.n, N = 1 << n, en = CT.entradas(n);
    let h = '<table class="ct-tab"><tr><th>Q</th>' + en.map((x) => '<th>' + x.nom + '</th>').join('') + '</tr>';
    for (let s = 0; s < N; s++) {
      const f = (E.p3 && E.p3.f[s]) || {};
      h += '<tr class="' + clsIt(f) + '"><td class="mono">' + CT.bin(s, n) + '</td>' +
        en.map((x) => '<td class="mono">' + (f.r ? CT.txtBit(f.r[x.e]) : '?') + '</td>').join('') + '</tr>';
    }
    return h + '</table>';
  };
  CT.htmlMapas = function (E) {
    const n = E.n, K = window.D2.k, nom = CT.nombres(n);
    return '<div class="ct-mapas-ro">' + CT.entradas(n).map((x) => {
      const m = (E.p4 && E.p4.m[x.e]) || {};
      const vals = m.vals || Array(1 << n).fill(0);
      const ok = m.ex && m.ex.est, cerrado = ok === 'ok' || ok === 'mos';
      const llena = m.fill && (m.fill.est === 'ok' || m.fill.est === 'mos');
      const empezado = vals.some((v) => v !== 0) || (m.fill && m.fill.int) || (m.grupos && m.grupos.length);
      const titulo = cerrado ? x.nom + ' = ' + (m.grupos.length ? K.expr(m.grupos, n, nom, true) : '0')
        : !empezado ? x.nom + ': <span class="lbl">sin empezar</span>'
          : !llena ? x.nom + ': <span class="lbl">llenando el mapa</span>'
            : x.nom + ': <span class="lbl">agrupando' + (m.grupos.length ? ' (' + K.expr(m.grupos, n, nom, false) + ')' : '') + '</span>';
      return '<div class="ct-mro ' + (ok === 'ok' ? 'ok' : ok === 'mos' ? 'mos' : '') + '"><b>' + titulo + '</b>' +
        K.estatico(n, vals, { nombres: nom, grupos: m.grupos || [], mt: false }) + '</div>';
    }).join('') + '</div>';
  };
  CT.htmlSim = function (n, sim, seq) {
    const b = (s) => '<span class="ct-st">' + s + '<small>' + CT.bin(s, n) + '</small></span>';
    let h = '<div class="ct-sim"><p class="ct-sim-t">Ciclo desde el ' + seq[0] + ' ' + (sim.cicloOK ? '<span class="ct-pill ok">coincide con tu secuencia</span>' : '<span class="ct-pill mal">no coincide</span>') + '</p>' +
      '<div class="ct-cam">' + sim.recorrido.map(b).join('<i>→</i>') + '</div>' +
      '<p class="ct-sim-t">Si enciende en un estado no usado</p>';
    sim.noUsados.forEach((u) => {
      h += '<div class="ct-cam ' + (u.entra === null ? 'mal' : '') + '">' + u.camino.map(b).join('<i>→</i>') +
        (u.entra === null ? '<em class="mal">se queda atrapado</em>' : '<em>entra en ' + u.pulsos + ' pulso' + (u.pulsos > 1 ? 's' : '') + '</em>') + '</div>';
    });
    return h + '</div>';
  };
  CT.esc = esc;
})();
