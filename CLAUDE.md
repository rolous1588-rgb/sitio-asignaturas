# Contexto para Claude — sitio-asignaturas

Sitio estático de material de asignaturas del Ing. Rolando Santillán (UMRPSFXCH, Sucre, Bolivia), publicado en GitHub Pages:
https://rolous1588-rgb.github.io/sitio-asignaturas/

- Idioma: todo en **español** (textos, comentarios, commits).
- Diseño: **colores claros siempre** (el docente no quiere fondos oscuros). Paleta en `instrumentacion/css/ii.css` (`:root`).
- Sin paso de compilación: HTML + CSS + JS puro. Librerías solo por CDN (jsDelivr).
- El docente está aprendiendo VS Code: explica los pasos de Git (Commit, Sync) con claridad cuando publiques.

## Módulo Instrumentación Industrial (diplomado, 27/09 – 07/10/2026)

Carpeta `instrumentacion/`. Clase virtual síncrona por Zoom: el docente comparte `presentar.html`, controla el avance desde el celular con `docente.html`, y cada estudiante trabaja en `clase.html` con su nombre + carnet.

| Archivo | Rol |
|---|---|
| `index.html` | Portada del módulo (lista de sesiones) |
| `clase.html` + `js/estudiante.js` | Vista del estudiante. `?s=ii-s1` elige la sesión; `&modo=libre` = repaso sin registro |
| `docente.html` + `js/docente.js` | Panel docente (celular): Control / Pizarra / Reporte (CSV para Excel), borrar datos de prueba. El guion acepta formato simple (`puntos`) o extenso (`objetivo`, `pasos`, `preguntas`, `dudas`, `transicion`) |
| `presentar.html` + `js/presentar.js` | Pantalla compartida en Zoom. Sigue el paso marcado desde el celular. Tecla **A** amplía el diagrama. Sin Supabase funciona en "modo ensayo" con flechas |
| `js/config.js` | URL y *publishable key* de Supabase (públicas por diseño; nunca poner la secret key) |
| `js/nucleo.js` | Utilidades, azar reproducible por carnet, sincronización del paso (Realtime + consulta cada 4 s), cola de envíos con reintento |
| `js/diagramas.js` | `II.diagramas.planta`, `.lazo` (simulación de nivel PI con fallas), `.medicion` (diana + rango/span). Cada uno devuelve `{ destruir() }` |
| `js/sesion1.js` | Contenido de la Sesión 1: 18 pasos, diagnóstico, 3 retos + integrador con generadores por carnet. Define también `II.OPCIONES_INGRESO` (cargarlo siempre) |
| `js/diagramas2.js` | `II.diagramas.temperatura` (Pt100 con 2/3/4 hilos, termopar K con unión fría, NTC) y `.presion` (absoluta/manométrica por ciudad de Bolivia + tanque con PT y DP) |
| `js/diagramas2b.js` | Utilidades `II.s2` + `II.diagramas.principioT` (RTD Pt/Ni/Cu con átomos, termopares J K T E N R S B con tablas NIST ITS-90, termistor NTC/PTC), `.hilos` (circuito 2/3/4 hilos con borne corroído + cable de compensación vs cobre) y `.plantaT` (punto de medición clicable + asistente de selección) |
| `js/diagramas2c.js` | `II.diagramas.principioP` (Bourdon, galgas + puente, capacitivo diferencial, piezoeléctrico) y `.plantaP` (punto de medición según el fluido: sifón, sello, amortiguador + cómo elegir y normas). Requiere `diagramas2b.js` |
| `js/sesion2.js` | Sesión 2 (sensores de T y P, 2 h sin pausa): 17 pasos — principio físico → conexión → planta/selección → explora → reto → revisión, por ciclo; retos con diagnóstico de fallas; guion extenso (objetivo, pasos, preguntas, dudas, transición) |
| `js/diagramas3.js` | `II.diagramas.nivel` (hidrostático abierto/cerrado con PT o DP y densidad; tiempo de vuelo ultrasonido/radar con temperatura, vapor y zona muerta), `.flujo` (placa orificio con perfil de presión y raíz cuadrada; turbina con pulsos y factor K; electromagnético con E = B·D·v) y `.lazo420` (lazo con fuente, cable, carga, fallas NAMUR y ruido; escalado LRV/URV). Atajos con pestaña fija: `nivelTOF`, `flujoOtros`, `lazoEscala`. Requiere `diagramas2b.js` |
| `js/sesion3.js` | Sesión 3 (nivel, flujo y 4–20 mA, 3 h): 30 pasos en 3 ciclos con 9 preguntas rápidas (1 pt c/u), 3 retos de 10 pts + integrador de 20; guion extenso |
| `js/diagramas4.js` | `II.diagramas.errores` (curva de error con cero, span, no linealidad e histéresis + tolerancia; repetibilidad con 10 lecturas y deriva con intervalo de calibración) y `.calibracion` (banco: bomba, patrón, PT-104 y multímetro con 9 puntos "como se encontró/como se dejó" y ajustes de cero/span; HART con onda FSK, trim de sensor, trim de salida y re-rango; pirámide de trazabilidad SI → IBMETRO → laboratorio 17025 → patrón de trabajo → planta + regla 4:1). Atajos: `erroresRepet`, `calibracionHart`, `calibracionTraza` |
| `js/sesion4.js` | "Sesión 4, día 5" (calibración, errores y trazabilidad, 2 h sin pausa): 22 pasos, 6 preguntas rápidas, 2 retos de 10 pts + integrador de 20 (certificado del PT-104); guion extenso |
| `css/ii.css` | Estilos (usa container queries para que los diagramas se adapten) |
| `estudio.html` + `js/estudio.js` | **Control de estudio** (sesión asíncrona `ii-ce`): portada con 7 módulos → módulo (vistas, reglas con fuente, errores típicos, caso, 2 de práctica, «Marcar como estudiado») → evaluación. Rutas por `#`: `#m1`…`#m7`, `#eval`, `#banco` (solo revisión). `?modo=revision` = vista docente sin registro (exige sesión docente en ese navegador) |
| `js/evaluacion.js` | `II.preguntas`: motor de preguntas `opcion`, `num`, `zona` (tocar el lugar en una escena), `errores` (marcar todos, puntaje parcial), `orden` (puntaje parcial). `instancia(q, carnet)`, `calificar`, `render(cont, inst, resp, opts)`, `explicarEscena`. Se reutilizará en el examen final |
| `js/escenas5.js` | `II.escenas`: `techo`, `toma`, `posicion`, `trazado`, `termopozo` (recto/codo), `vapor`, `magnetico`, `cableado`. Cada una devuelve `{ titulo, svg, zonas: { A: { t, ok, por } } }` |
| `js/control-estudio.js` | `II.CONTROL`: fuentes (manuales de fabricantes), 7 módulos, banco de 43 preguntas (2 por módulo + 1 extra = 15 por carnet), `seleccion(carnet)`, `calificar(ids, resp, carnet)`. Registra `II.SESIONES['ii-ce']` con `asincrona: true` y `etiqueta` |
| `supabase/estructura.sql` | Esquema de la base de datos (ya ejecutado en Supabase) |
| `supabase/control-estudio.sql` | (Ya ejecutado el 07/10) Cambios para sesiones asíncronas y evaluaciones de un intento (ventana abre/cierra, un `eval-inicio` y un `eval` por carnet, tiempo límite +2 min, `creado` del servidor, RPC `estado_evaluacion`, fila `ii-ce`) |

### Dinámica de clase (acordada con el docente)
Ciclo por concepto (~35 min): **explica → explora → reto → revisa**.
- Tipos de paso: `espera`, `cuestionario`, `explica`, `explora`, `rapida`, `reto`, `revisa`, `pausa`, `cierre`.
- **Pregunta rápida** (`tipo: 'rapida'`, desde la Sesión 3): `{ id, ciclo, titulo, t, o: [opciones], c: índice correcto, por, puntos? (1) }`. La actividad es el id del paso. Un intento; las opciones se mezclan por carnet; el estudiante ve si acertó recién al cerrarse. En Zoom: cuenta regresiva y barras por opción (`resumen_opciones`). Ritmo por ciclo: explica → rápida → explica → rápida → explora → reto → revisa.
- **Cerrar reto / pregunta** (botón del panel): escribe `estado_sesion.extra.cierre = { act, seg, fin, id }` (30 s reto, 15 s rápida). Cada estudiante cuenta con su reloj (mín. 3 s) y al llegar a cero envía lo que tenga escrito como intento final (vacío → registro "no respondió" con `respuesta.vacio = true`, 0 pts). "Cancelar" pone `cierre: null`. **Red de seguridad**: si el paso cambia sin cerrar, la página del estudiante envía igual lo que había (`respuesta.auto = 'avance'`). Cambiar de paso limpia `cierre`. Lo escrito sin enviar se guarda como borrador (`ii-borr-…`) y sobrevive a una recarga.
- **Puntaje acumulado** del estudiante en la barra superior (retos + rápidas ya cerradas). El reporte suma las rápidas (columna total; en el CSV, una columna por rápida).
- Retos: valores personalizados con `II.rng(carnet + '|' + retoId)`; 2 intentos; en el 2º, lo ya correcto conserva su valor y lo corregido vale la mitad; tolerancia numérica ±2 %; el estudiante marca "seguro / tengo dudas".
- Hilo conductor: la misma planta (tanque con entrada, salida y calentador; variables T, P, L, F) se profundiza en las 6 sesiones y culmina en el P&ID de la sesión 6.
- Plantilla 2 h: ingreso 5 · repaso 10 · ciclo 35 · ciclo 35 · pausa 5 · integrador 20 · cierre 10. Plantilla 3 h: tres ciclos y pausa de 10.

### Base de datos (Supabase)
Tablas `docentes`, `estado_sesion` (paso actual; filas `ii-s1` … `ii-s6`), `ingresos`, `respuestas`. RLS: estudiantes (anon) solo insertan; solo el docente (email en `docentes`) lee respuestas y cambia el paso. `resumen_actividad(sesion, actividad)` devuelve conteos anónimos para proyectar (sin contar los "no respondió"); `resumen_opciones(sesion, actividad)` cuenta por opción las preguntas rápidas.
- **Respuestas solo con la actividad abierta**: la política de inserción usa `actividad_abierta(sesion, actividad)`: se acepta si `estado_sesion.paso` es esa actividad, o si el paso cambió hace menos de 15 min (envíos atrasados), o si es `ingreso`. Un rechazo llega como error 42501: `nucleo.js` lo descarta de la cola (copia en `ii-cola-rechazadas`) y el estudiante ve "Este reto ya está cerrado". **Al terminar una clase, dejar el paso fuera de un reto.**
- **Control del modo repaso** en `estado_sesion.extra`: `repaso_hasta` (id del último paso repasable; null = todo) y `repaso_cerrado` (true = repaso cerrado). Se manejan desde el panel: "Liberar repaso hasta este paso", "Abrir toda la sesión", "Cerrar el repaso".

### Control de estudio (sesión asíncrona `ii-ce`, vale 10 % del módulo)
- Ventana en `estado_sesion.extra = { asincrona: true, abre, cierra, minutos: 20 }`. `abre = null` = no abierto. El panel docente (`docente.html?s=ii-ce`) tiene Abrir ahora / Cerrar ahora / Volver a «No abierto» / Cambiar cierre (hora de Bolivia, UTC−4) y el Reporte.
- Envíos: `ingreso`, `mod-N` (`{ practica, seg }`), `eval-inicio` (insertado directo, su `creado` arranca el reloj), `eval-avance` (copia automática al cambiar de pregunta, cada 45 s y al ocultar la página), `eval` (`{ ids, resp, puntos, nota, motivo }`, `puntaje` = nota /100).
- Reloj con la hora del servidor (RPC `estado_evaluacion`); termina en `inicio + minutos` o 15 s antes del cierre. Al llegar a cero se envía solo. El estudiante ve su nota al enviar y **las soluciones recién después del cierre** (en el mismo dispositivo).
- Reporte docente: la nota se **recalcula** con `C.seleccion(carnet)` + respuestas guardadas. Si alguien empezó y no envió, se califica su último `eval-avance` llegado dentro de `minutos + 2`. Ponderada = nota × 0,10. CSV con P1…P15 y tabla de dificultad por pregunta.
- El avance de los módulos se guarda en el dispositivo (`ii-ce-mods-<carnet>`); la evaluación se habilita con los 7 módulos marcados (o si el servidor dice que ya empezó).

### Cómo agregar una sesión nueva
1. Crear `js/sesion2.js` registrando `II.SESIONES['ii-s2'] = { id, numero, titulo, fecha, siguiente, retos, diagnostico, pasos }` (copiar la forma de `sesion1.js`).
2. Agregar sus diagramas en `js/diagramas.js` (o un archivo nuevo) y cargar el script en `clase.html`, `docente.html` y `presentar.html`.
3. Activar la tarjeta de la sesión en `instrumentacion/index.html`.

### Calendario (reorganizado el 04/10 con el docente)
S1 Dom 27/09 09–12 · S2 Mar 29/09 + Mié 30/09 (sensores T y P; presión se terminó el 30/09) · **S3 Dom 04/10 09–12 (nivel, flujo y 4–20 mA)** · **S4 Mar 06/10 20–22 (calibración, errores y trazabilidad + HART), nombrada "Sesión 4, día 5"** · **S5 Mié 07/10 20–22 (P&ID/ISA 5.1, caso integrado con fallas del lazo + evaluación final)**. La fila `ii-s6` de la base queda sin uso.
El docente cuenta **6 días de clase**: S1 = día 1, S2 = días 2 y 3, S3 = día 4, S4 = día 5, S5 = día 6. Las sesiones nuevas se nombran "Sesión N, día D" (campo `numero: '4, día 5'`, que solo se usa en textos).
Simbología ISA: se reparte (etiquetas LT-101, FT-102, TT-103 desde S3) y se completa en S5. Ruido: idea básica en S3; casos prácticos (blindaje, tierra) como fallas en S5.

## Módulo Medidas Eléctricas (clases presenciales, desde oct 2026)

Carpeta `medidas/`. El docente proyecta **su celular en horizontal** al televisor del aula (Skyworth 75", espejo por Chromecast; última fila a 9 m). La misma página proyecta y controla. Los estudiantes entran por QR con datos móviles (el Wi-Fi de la facultad casi no funciona). Reutiliza `../instrumentacion/js/config.js` y `nucleo.js` (misma base Supabase, misma cuenta docente).

| Archivo | Rol |
|---|---|
| `proyectar.html` + `js/proyectar.js` | Proyección + control: carrusel ◀ ▶, QR, Habilitar → Cerrar (cuenta regresiva) → Resultados / Solución / Intento anónimo. **Sin modo ensayo** (pedido del docente 07/10): al abrir exige la cuenta docente y retoma el paso guardado en la base (no lo reinicia). Tocar el número de paso o ⋮ → «Ir a un paso…», «Descargar notas (Excel)» (CSV `;` con carnet, nombre, carrera, asistencia por fecha, puntaje por actividad realizada, total, máximo y nota /100) y salir. **No hay botón de borrar datos**: la sesión `me-fp1` ya tiene notas oficiales |
| `clase.html` + `js/estudiante.js` | Estudiante (vertical). Sigue el paso; predicciones con un toque; ejercicios en su propio diagrama con datos por carnet y recuadro «Fórmulas útiles»; envía estado + movimientos + segundos. Registra un `ingreso` por día (asistencia). `&modo=libre` = repaso sin registro |
| `js/fp-diagramas.js` | `FP.diagramas`: `fasores`, `potencia`, `triangulo`, `linea`, `vatimetros`, `corrector`, `factura`, `armonicos`. Opciones: `inicial`, `params`, `ocultar` (lecturas tapadas → "?"), `fijos`, `revelado`, `sinControles` |
| `js/fp-sesion.js` | `FP.SESIONES['me-fp1']` (33 pasos: inicio, explica, **teoria**, rapida, ejercicio, cierre) y `FP.EJERCICIOS` e1–e5 (`generar`, `enunciado`, `resumen`, `formulas`, `opciones`, `evaluar`, `eje`, `solucion`). Paso `teoria`: `{ puntos: [html], formulas: [texto; si termina en ':' es subtítulo], derecha?: 'Solución'/'Seguridad', derechaTexto? }` |
| `css/me.css` | Paleta clara del sitio. En `body.tv` todo se mide en `--u` = 1 % del alto (dvh) |

- Tamaños para 9 m (regla DISCAS: alto de letra ≥ distancia/200): números clave ≈ 6,5 % del alto, textos ≥ 4,5 %, trazos gruesos, una idea por pantalla.
- Fases en `estado_sesion.extra`: `{ abierto: id }` → `{ abierto: id, fin, seg }` (cierre) → `{ cerrado: id }`. Cambiar de paso limpia `extra`; el estudiante envía solo lo que tenga si el paso cambia o se cierra.
- Las respuestas se leen directamente desde la página del docente (RLS: solo docente). La TV muestra todo anónimo.
- Regla de factura usada: ELFEC (FP ≥ 0,85; recargo = cargo × (0,85/FP − 1)). Pendiente confirmar la de CESSA (Sucre): no se encontró publicada.
- Avance: el lunes 05/10 se llegó hasta e2 (11 estudiantes). El miércoles 07/10 se continúa desde `repaso2` (teoría de dos vatímetros en adelante).

## Módulo Electrónica Digital 1 (clases presenciales, desde oct 2026)

Carpeta `digital1/`. Mismo esquema que Medidas: el docente proyecta **su celular en horizontal** (Chromecast a la TV de 75", aula de ~6 m) y la misma página controla la clase; los estudiantes entran por QR con datos móviles. Reutiliza `../instrumentacion/js/config.js` y `nucleo.js` (misma base y cuenta docente). Mantiene el diseño de los HTML de clase de Digital 1 (pestañas + carrusel, letra base ≈ 20 px que se ajusta sola, botones A− / A+, respuestas de las preguntas en ventana grande).

| Archivo | Rol |
|---|---|
| `index.html` | Portada: clase en vivo, repaso libre y proyectar |
| `proyectar.html` + `js/proyectar.js` | Proyección + control. Barra: pestañas 7 Karnaugh / 8 Aplicaciones, Habilitar → Cerrar (cuenta regresiva) → Resultados / Solución / Intento anónimo, 👥 conectados, QR, ⋮ (entrar como docente, **reporte CSV** para la nota de prácticas, **borrar datos de esta clase**). Las diapositivas `explica` están escritas en el HTML (`id="p-<paso>"`); las de actividad se generan. Sin sesión = modo ensayo |
| `clase.html` + `js/estudiante.js` | Estudiante (vertical). Sigue el paso; rápidas con un toque; ejercicios con datos por carnet; «Explorar en mi celular» en los pasos con `explorar` (`mapa`, `bomba`). `&modo=libre` = repaso sin registro |
| `js/d1-kmap.js` | `D1.k`: `resolver` (mínima exacta: primos + cobertura), `svg/dibujar/estatico` (grupos con bordes que se tocan), `cubo` (¿las celdas tocadas forman un grupo?), `editor` (mapa para el celular: 1 · Llenar → 2 · Agrupar; la expresión se arma sola) |
| `js/d1-diagramas.js` | `D1.seg` (display de 7 segmentos) y `D1.diag.bomba` (tanque con **llave de salida**: cerrada / media / abierta; sensores de electrodo con banda de 2 %; fallas visibles o ocultas `fb` `fa` `fc`) |
| `js/d1-sesion.js` | `D1.SESIONES['d1-c3']` (28 pasos, 8 rápidas de 1 pt) y `D1.EJERCICIOS`: `e1` tabla → mapa de 3 variables (4 pts), `e2` diseño completo con 8 problemas (4), `e3` encontrar la falla de la bomba (2), `e4` un segmento del display con X (4). Cada uno: `generar`, `enunciado`, `montar`, `evaluar`, `solucion`, `vista`, `resumen` |
| `css/d1.css` | Estilos (`body.tv` proyección, `body.est` celular) |

- Base: fila `d1-c3` en `estado_sesion` (creada el 05/10). Fases en `extra` iguales a Medidas.
- Puntaje de los mapas: mapa bien llenado 1 + expresión correcta 2 + mínima 1. Diseño completo: tabla (hasta 2, proporcional) + correcta 1 + mínima 1.
- Pruebas: como el contenedor de Claude no llega a Supabase ni a jsDelivr, se probó con un simulador local de supabase-js (servidor de consultas compartido) y Playwright: docente + 3 estudiantes, todas las actividades, reporte CSV.

## Pendiente
- Sesión 4, día 5: repaso limitado a "inicio" hasta la clase; al terminar, dejar el paso en "Cierre" (no en un reto) y "Abrir toda la sesión".
- "Sesión 5, día 6" (miércoles 07/10): P&ID con ISA 5.1 + caso integrado con fallas del lazo + evaluación final. Falta que el docente defina el formato de la evaluación.
- Control de estudio: `supabase/control-estudio.sql` ya aplicado (07/10, pegado por el docente en el SQL Editor; la herramienta de migraciones queda cancelada desde aquí). Falta que el docente lo revise con «Revisar como estudiante», borra datos de prueba, toca «Abrir ahora» y se agrega la tarjeta en `instrumentacion/index.html`. Cierra el jueves 08/10 a las 23:59.
- Examen final (40 %): 20 preguntas, un intento, botón del docente para cerrar con cuenta regresiva escrita por teclado; al enviar, nota y soluciones. Reutilizar `evaluacion.js`.
- Viernes: tabla completa de participación (por sesión, por persona, cada reto y rápida, total /100, promedio y ponderado a 25).
- Antes de cada clase: probar con el panel docente y luego **Reporte → Borrar datos de esta sesión**.
- Digital 1: antes de la clase, entrar como docente en `digital1/proyectar.html`, probar con un celular y luego **⋮ → Borrar datos de esta clase**. Al terminar, dejar el paso en `cierre`.
