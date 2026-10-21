// ============================================================
// Copia propia de Medidas (corte de dependencias, 20/10/2026).
// Origen: transformadas/fourier/js/fs-tex.js. Pieza: fórmulas LaTeX con KaTeX (ver 02_plataforma.md del proyecto).
// Esta copia no cambia sola: si se corrige el original, se avisa a cada materia.
// ============================================================
// ============================================================
// Fórmulas en LaTeX con KaTeX (15/10/2026)
// Cualquier texto que llegue a la página con \( … \) (en línea) o \[ … \] (centrado)
// se dibuja como fórmula. Vigila los cambios de la página, así que funciona con
// todo lo que pintan proyectar.js y estudiante.js sin tocar cada función.
// \sen = seno en castellano. Si KaTeX no carga (sin datos), se ve el texto LaTeX.
// ============================================================
(function () {
  const OPC = {
    delimiters: [
      { left: '\\[', right: '\\]', display: true },
      { left: '\\(', right: '\\)', display: false }
    ],
    macros: { '\\sen': '\\operatorname{sen}' },
    strict: 'ignore',
    throwOnError: false
  };
  const MIRAR = { childList: true, subtree: true, characterData: true };
  let pendiente = false;
  let obs = null;

  function pasar() {
    pendiente = false;
    if (!window.renderMathInElement || !document.body) return;
    obs.disconnect();
    try { window.renderMathInElement(document.body, OPC); } catch (e) { /* se ve el texto */ }
    obs.observe(document.body, MIRAR);
  }

  obs = new MutationObserver(() => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(pasar);
  });

  function iniciar() { obs.observe(document.body, MIRAR); pasar(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
