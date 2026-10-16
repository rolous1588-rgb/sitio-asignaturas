# Contexto para Claude — sitio-asignaturas

Sitio estático de material de asignaturas del Ing. Rolando Santillán (UMRPSFXCH, Sucre, Bolivia), publicado en GitHub Pages:
https://rolous1588-rgb.github.io/sitio-asignaturas/

- Idioma: todo en **español** (textos, comentarios, commits).
- Diseño: **colores claros siempre** (el docente no quiere fondos oscuros). Paleta en `instrumentacion/css/ii.css` (`:root`).
- Sin paso de compilación: HTML + CSS + JS puro. Librerías solo por CDN (jsDelivr).
- **Separadores** (pedido del docente, 16/10, para todo el material desde ahora): nunca usar el punto medio «·» para separar términos, funciones o elementos de una lista, porque se confunde con la multiplicación. Usar **punto y coma con espacios** («; »). El punto medio queda solo para multiplicar (2·sen(x), f(Xa)·f(Xr)).
- **Escritura matemática en LaTeX** (pedido del docente, 16/10, para todo el material desde ahora): fórmulas, funciones y expresiones se muestran con KaTeX (jsDelivr), como en `transformadas/fourier/js/fs-tex.js` (`\( … \)` en línea, `\[ … \]` aparte; macro `\sen`). Decimales con coma escritos `0{,}7358` (sin `{}` LaTeX agrega un espacio después de la coma). Multiplicar con `\cdot`; separar elementos con `;\;`. Lo que escribe el estudiante (respuestas numéricas) sigue siendo texto simple.
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
| `js/diagramas5.js` | `II.diagramas.pid`: P&ID del TK-100 con ISA 5.1 (LT/LIC/LY/LV-101, FT/FI-102, TE/TT/TIC-103, PT/PI-104); tocar un instrumento muestra letras, ubicación (campo / tablero / DCS) y señal, y resalta su lazo. Pestañas Instrumento / Letras / Símbolos; atajos `pidLetras`, `pidSimbolos` |
| `js/sesion5.js` | "Sesión 5, día 6" (P&ID y fallas del lazo, ~55 min): 13 pasos, 4 rápidas, reto "Detective del lazo" (10 pts: valor esperado, causa de la falla, TAG, símbolo); el cierre lleva al examen |
| `examen.html` + `js/examen-banco.js` | **Examen final** (`ii-s6`, 40 %): 55 preguntas en 10 temas, 2 por tema y carnet = 20; usa `estudio.js` con `<body data-eval="ii-s6">`. Sin reloj fijo: el docente abre (`extra.asincrona/abre`) y cierra con una cuenta regresiva escrita por teclado (`extra.cierra`); al enviar se ven nota y soluciones |
| `foro.html` + `js/foro.js` + `js/foro-datos.js` | **Foro con coevaluación** (`ii-foro`, 25 %, reemplaza al foro de Moodle que falló con «Class finfo not found»). Fase 1: aporte en 4 cuadros (200–300 palabras, enlace o «todo es mío», no editable). Fase 2: el servidor asigna 3 aportes anónimos (`foro_asignados_de`); rúbrica 4 × 0–2 + comentario ≥ 40 palabras; el autor marca 👍/👎. Nota automática en `II.FORO.notas`: cumplimiento 20 + mediana de pares 50 + evaluaciones hechas 15 + evaluar con criterio 15 (cercanía a la mediana de los otros + 👍). Sin reclamos. Panel: `docente.html?s=ii-foro` |
| `supabase/foro.sql` | RPC `foro_estado`, `foro_asignados_de`, regla `foro_permite` en la política de inserción y fila `ii-foro` (fase1 = vie 09/10 23:59, fase2 = sáb 10/10 23:59) |
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
| `js/d1-diagramas.js` | `D1.seg` (display de 7 segmentos), `D1.circ` (circuito AND–OR: `svg`, `funcion`, `deCubos`, `expr`, `cuenta`; puertas = listas de literales 2·i + negada) y `D1.diag.bomba` (**control de dos niveles** pedido por el docente el 08/10: la bomba arranca cuando el agua baja de Lb y para al llegar a La, con memoria M⁺ = C·L̄a·(L̄b + M); F = L̄b·La; **llave de salida** cerrada / media / abierta = consumo; empieza al 30 % con la bomba apagada; fallas visibles o ocultas `fb` (arranca y para seguido + F), `fa` (rebalsa), `fc` (nunca arranca)). En `proyectar.js` la tabla de la bomba muestra «M» en la fila 110 y el mapa de M⁺ es de 4 variables |
| `js/d1-sesion.js` | `D1.SESIONES['d1-c3']` (28 pasos, 8 rápidas de 1 pt) y `D1.EJERCICIOS`: `e1` tabla → mapa de 3 variables (4 pts), `e2` diseño completo con 8 problemas (4), `e3` encontrar la falla de la bomba (2), `e4` un segmento del display con X (4), `e5` **problema común para todos** (agregado el 08/10, después de «Para pensar: la bomba»): alarma de incendio «2 de 3» + pulsador, 4 entradas P A B T, en tres pestañas 1 · Tabla → 2 · Mapa (se llena con su tabla, ellos agrupan) → 3 · Circuito (tocan qué entradas van a cada AND; 6 pts = tabla 2 + correcta 1 + mínima 1 + circuito 2, o 1 si el circuito coincide con su mapa equivocado). `comun: true` cambia los textos de la TV. Cada uno: `generar`, `enunciado`, `montar`, `evaluar`, `solucion`, `vista`, `resumen` |
| `css/d1.css` | Estilos (`body.tv` proyección, `body.est` celular) |

- Base: fila `d1-c3` en `estado_sesion` (creada el 05/10). Fases en `extra` iguales a Medidas.
- **Pestaña 9 · Práctica** (agregada el 12/10, antes del cierre; pasos `prac`, `r9`–`r12`, `e6`–`e9`, `pq9`): `e6` del circuito a la tabla + elegir la expresión (circuito propio AND→OR, OR→AND o NAND→NAND, 3 pts), `e7` de la expresión al mapa (cada término es un grupo, 3), `e8` mapa de 4 variables cuya mínima obliga a solapar grupos (4), `e9` solo con NAND + contar NAND de 2 entradas (3). Rápidas con figura: `fig: 'html'` + `figura()`. `D1.circ.svg` acepta `{ t1, t2, mono }` y `D1.circ.funcion2/texto`. Motivo: en `e5` 6 de 9 no solaparon grupos (datos del 08/10).
- Puntaje de los mapas: mapa bien llenado 1 + expresión correcta 2 + mínima 1. Diseño completo: tabla (hasta 2, proporcional) + correcta 1 + mínima 1.
- Pruebas: como el contenedor de Claude no llega a Supabase ni a jsDelivr, se probó con un simulador local de supabase-js (servidor de consultas compartido) y Playwright: docente + 3 estudiantes, todas las actividades, reporte CSV.
- **Sesión `d1-c4` «XOR, paridad y comparador»** (16/10, fila creada el 16/10): `js/d1-c4.js` (cargado en `proyectar.html` y `clase.html`). Pestañas 10 Repaso XOR · 11 Paridad · 12 Comparador (`pestana0: 10`). 13 rápidas y 4 ejercicios por carnet: `x1` diagrama de tiempos (3 pts, medios puntos), `x2` dato con paridad (4), `x3` encontrar el bit dañado en un bloque 4 × 4 con paridad por fila y columna (3), `x4` comparador de 2 bits (3, medios). Diagramas `D1.W.tiempos`, `.paridad` (cadena/árbol), `.bloque`, `.comparador`, `.motor`, que sirven en la TV y en el celular (`D1.EXPLORAR`). Las diapositivas `explica` están en `proyectar.html` (`p-xres` … `p-cmotor`); los pasos `explica` pueden llevar `formulas` (se ven en el celular).
- **Regla del «?»** (decisión del docente, 15/10): lo que el estudiante deja sin completar cuenta como incorrecto y en «Tu respuesta» se ve «?» en rojo con el aviso «hay que llenar todo»; sin aviso antes de enviar. Aplicada en `x1`–`x4`; falta llevarla a `e2`, `e5` y `e6` de `d1-c3`.
- Desde el 16/10: **confirmación antes de enviar** los ejercicios (doble toque), **sin botón de borrar datos** (las sesiones tienen notas oficiales), el reporte CSV y el cierre cuentan solo las actividades realizadas, y escritura matemática con KaTeX (`../transformadas/fourier/js/fs-tex.js`).

## Módulo Transformadas y Funciones Especiales (examen desde el celular, desde 08/10/2026)

Carpeta `transformadas/`. Examen presencial en el aula con TV: el docente proyecta `proyectar.html` (celular horizontal) y cada estudiante responde en `clase.html` por QR. Reutiliza `../instrumentacion/js/config.js`, `nucleo.js` y los estilos `../medidas/css/me.css` (+ `css/tf.css`). **No necesita cambios en la base**: usa el mecanismo de evaluación de un intento (`asincrona`, `eval-inicio`, `eval-avance`, `eval`).

| Archivo | Rol |
|---|---|
| `proyectar.html` + `js/proyectar.js` | Proyección + control. Espera (QR, reglas, −5/+5 min, Iniciar) → En curso (reloj gigante, registrados/empezaron/enviaron, +5 min, Cortar = 30 s) → Cerrado (acierto por pregunta y promedio, anónimos). ⋮: Descargar notas (CSV), vista del estudiante, **Reiniciar y borrar datos** (pide escribir BORRAR; solo pruebas). Si la fila de la sesión no existe, la crea al entrar el docente |
| `clase.html` + `js/examen.js` | Estudiante: registro (nombre, C.U., carrera) → espera → examen (chips 1–10, reloj con hora del servidor, guardado local + copia automática) → enviado → al cerrar: nota y solución con sus números. **Registro de salidas** en `respuesta.sal`: veces y segundos con la página oculta (otra app, bloqueo, llamada), salida abierta al final, pérdidas de foco sin ocultar, respuestas cambiadas ≤ 30 s tras volver, recargas, pantalla encendida (`wakeLock`), dispositivo. Aviso al volver: «Saliste de la página (n.ª vez)» |
| `js/tf-banco.js` | `TF.PREGUNTAS` (10 preguntas, 7·4 + 12·4 + 6 + 18 = 100 pts) con `gen(r)` por carnet; tipos `opcion` (correcta en la posición 0, se mezcla), `campos` (enteros, botón ±, acepta fracción a/b) y `orden`. `TF.nota(carnet, resp)` recalcula la nota (la usa el reporte). Escritura matemática con fracciones de barra horizontal (`TF.mat`) |

- Sesiones: `tf-ex1` (oficial) y `tf-prueba` (ensayo). `extra = { asincrona, abre, fin, cierra, minutos, duracion, cortado? }`: `fin` es lo que muestran los relojes; `cierra = fin + 20 s` (margen para el envío final); `minutos = duración + 1` (entero, lo usa `evaluacion_permite`). `abre` se fija 10 s antes de la hora del servidor.
- Reporte: nota del `eval`; si no hay, la última `eval-avance` («Última copia automática»). Las copias se piden aparte y de la más nueva a la más antigua (límite de 1000 filas de Supabase).
- Pruebas: simulador de supabase-js con un servidor compartido entre contextos (docente + 3 estudiantes en Playwright), incluido el reporte con copia automática.

## Transformadas · Series de Fourier (clase presencial, desde 12/10/2026)

Carpeta `transformadas/fourier/` (sesión `tf-fourier`, fila creada en `estado_sesion` el 12/10). Mismo esquema que Medidas (proyecta el celular del docente en horizontal; aula de 5–7 m) y reutiliza `../../instrumentacion/js/config.js`, `nucleo.js` y `../../medidas/css/me.css` (+ `css/fs.css`). No cambia la base: el «habilitar de nuevo» y la nota por fecha se resuelven con `estado_sesion.extra` y las respuestas.

| Archivo | Rol |
|---|---|
| `proyectar.html` + `js/proyectar.js` | Proyección + control. Pestañas de etapas (1 La idea · 2 Calcular · 3 Reconocer · 4 Usar) en la cabecera. Habilitar → **Enviaron** (lista con «Habilitar» por estudiante, solo con la actividad abierta: `extra.rehab = { act, c: { carnet: n } }`) → Cerrar (cuenta regresiva que activa el docente) → Resultados / Solución / Intento. ⋮: Ir a un paso, **Terminar la clase de hoy** (`extra.dia = { fecha, acts, max }`: TV y celulares muestran la nota de hoy /100), Descargar notas |
| `clase.html` + `js/estudiante.js` | Registro: apellidos, nombres, C.I., **C.U. (carnet de referencia)** y carrera (lista con solo Ing. Electromecánica / Ing. Biomédica). **Confirmación antes de enviar** (Cancelar vuelve al ejercicio; avisa cuántas partes faltan). Al cerrar o avanzar se envía lo que tenga. Si el docente lo habilita, borra su envío local y reenvía con `respuesta.rehab = n` (vale el último) |
| `js/fs-onda.js` | `FS.BASE` (cuadrada, triangular, diente, rectificadas, pulsos, ECG, cargador), `FS.coef` (numérico), `FS.plot`, `FS.barras`, `FS.simetrias` y `FS.diagrama(cont, { modo, params })` con modos `periodica`, `seno`, `suma`, `sintesis`, `ortogonal`, `simetria`, `potencia`, `filtro`, `complejo` |
| `js/fs-sesion.js` | 56 pasos en 4 etapas desde el 15/10 (25 rápidas de 1 pt) y `FS.EJERCICIOS` e1–e7 (genérico: `generar(r, carrera)`, `enunciado`, `figura`, `items` num/op, `solucion`; un punto parcial por ítem, ±2 %). `porCarrera: true` en e1 (vibración de motor / oxímetro) y e6 (Parseval: corriente con armónicos y THD / oxímetro). La carrera viaja en `respuesta.car` |

- Notación acordada: período T, ω₀ = 2π/T; sin libro de referencia. Coeficientes con π se piden como valor numérico.
- **Nota por fecha**: cada actividad pertenece a la fecha de su primera respuesta; el CSV trae, por fecha, puntos por actividad, asistencia, puntos, máximo y nota /100, más la columna «Habilitado de nuevo en».
- Pruebas: simulador local de supabase-js + servidor compartido y Playwright (docente + 3 estudiantes, todas las actividades probadas, habilitar de nuevo, cierre del día y CSV).
- **15/10 · Etapa 2 rehecha para resolver con los estudiantes** (pedido del docente: nada en pizarra, que participen): `rep2` (repaso del lunes), `t-form` y **«Resolvamos juntos: la cuadrada ±A»**: `j0` + 11 rápidas encadenadas `rj1`–`rj11` (cada una pide el paso siguiente; los distractores son los errores típicos) + `t-cuad` (resultado y uso por carrera) → `e2`. Las simetrías (`r6`…`e3`) quedan para el lunes.
- **Peer Instruction**: rápida con `pi: true` = primer voto; al cerrar muestra las barras pero no la correcta ni la explicación. El paso siguiente (`rj3b`, `rj9b`) es el segundo voto, que sí revela. Si no se abre, no cuenta en la nota del día.
- `una: true` en una rápida = opciones en una sola columna (para opciones largas). En la TV, la explicación de una rápida cerrada va en el panel derecho.
- **Fórmulas en LaTeX** con KaTeX 0.16.11 (jsDelivr) + `js/fs-tex.js`: todo texto con `\( … \)` o `\[ … \]` se dibuja solo (MutationObserver). Macro `\sen`. En `fs-sesion.js` se escribe con `` X`…` `` (= `String.raw`). En `puntos` (HTML sin escapar) usar `\lt` en vez de `<`. Las explicaciones (`por`) se escapan: no llevan HTML.
- Pendiente: cuando se pruebe en el aula, llevar la confirmación y el «habilitar de nuevo» a Medidas y Digital 1 (pedido del docente).

## Métodos Numéricos · Repaso de raíces (clase presencial, 14/10/2026)

Carpeta `numericos/raices/` (sesión `mn-raices`, fila creada en `estado_sesion` el 14/10). Copia adaptada de `transformadas/fourier/` (mismo esquema: el docente proyecta su celular en horizontal; los estudiantes entran por QR con datos móviles). Reutiliza `../../instrumentacion/js/config.js`, `nucleo.js` y `../../medidas/css/me.css`; trae su propia copia de `fs-onda.js`, `estudiante.js` y `proyectar.js`. Entrenamiento para el examen del viernes 16/10.

| Archivo | Rol |
|---|---|
| `proyectar.html` + `js/proyectar.js` | Proyección + control (igual que Fourier). En ejercicios con `filas`, «Resultados» muestra el acierto por columna |
| `clase.html` + `js/estudiante.js` | Estudiante. Agrega **«Comprobar fila»** en ejercicios con `filas`: 2 intentos por fila, en orden; si falla los dos, se muestra el valor. Guarda `estado._chk`, `_int` (intento en que quedó bien) y `_rev` (mostrado) |
| `js/mn-sesion.js` | `FS.SESIONES['mn-raices']` (14 pasos, 3 etapas: calentamiento · falsa posición guiada · Newton individual), `MN.grafica` (SVG liviano con secante o tangente), `MN.tablaFP`, `MN.tablaNR` (4 decimales en cada paso) |

- Falsa posición guiada `fp1`–`fp4`: f(x) = x·eˣ − 2 en [0, 1], misma para todos; 2 pts por fila = 1 por participar + 1 según aciertos (±0,0006; error ±0,01).
- Newton individual `nr`: f(x) = x³ + a·sen(x) − b, x₀ = 1, (a, b) por carnet de `NR.variantes`; 16 celdas, 8 pts. Los valores esperados se calculan con los números del propio estudiante (`items(d, est)`), así un error no se arrastra. Puntaje por celda: 1.er intento o sin comprobar = completo, 2.º = mitad, mostrado = 0.
- Pruebas: cálculos con Node (300 carnets, todo correcto = 8 pts) y la vista del estudiante en modo libre con Playwright. La proyección no se pudo probar contra la base desde el contenedor.

## Métodos Numéricos · Práctica autónoma de raíces (ensayo del examen, 16/10/2026)

Carpeta `numericos/practica/` (sesión asíncrona `mn-practica`, fila creada el 16/10). El estudiante la hace por su cuenta en el celular; **no tiene nota**. El docente la abre y la cierra desde `panel.html` (`estado_sesion.extra = { asincrona: true, abre, cierra }`: la política de inserción de `respuestas` ya acepta envíos solo entre `abre` y `cierra`). Reutiliza `../../instrumentacion/js/config.js`, `nucleo.js` y `../../medidas/css/me.css`. El formato acordado vale también para el examen.

| Archivo | Rol |
|---|---|
| `index.html` + `js/mp-estudiante.js` | Estudiante: registro (apellidos, nombres, C.I., C.U., carrera: Mecatrónica / Electrónica / Eléctrica) → inicio con 5 bloques (#red, #bis, #fp, #nr, #res). Avance en el celular (`mp-prog-<carnet>`). Cola de envíos propia (`mp-cola`) que relee la cola en cada paso. `?modo=prueba` = funciona cerrada y no guarda nada |
| `panel.html` + `js/mp-panel.js` | Docente: Abrir ahora / Cerrar ahora / cerrar sola a una hora; enlace para compartir; resumen; «Dónde fallan más» (1.er intento por columna); lista con detalle por estudiante (cada función, cada fila, 1.er intento y cómo quedó); CSV `;`; borrar datos de un estudiante o de toda la práctica |
| `js/mp-motor.js` | `MP`: funciones por carnet (`MP.datos(met, carnet, semilla)`, «Otra función» = semilla + 1), casillas por fila (`MP.celdas`), revisión con los números del propio estudiante (`MP.evaluar`, `MP.comprobar`, 2 intentos), puntaje «como examen» (`MP.puntaje`, solo 1.er intento), ejercicios de redondeo (`MP.redondeo`) |

- Redondeo: 4 decimales al más cercano; solo se redondea lo que se anota; se sigue con el valor anotado. Acepta coma o punto decimal y el signo − del teclado.
- Revisión de cada casilla: **ok** = igual en 4 decimales; **red** = difiere hasta 0,0005 o le faltan/sobran decimales (vale la mitad en el examen); **mal** = 0. Una casilla bien que depende de otra con error queda abierta («bien con tus números»).
- Bisección y falsa posición, 3 filas: fila 1 da Xa y Xb y piden f(Xa), f(Xb), Xr, f(Xr) (error ---); filas 2–3 piden también copiar Xa, Xb, f(Xa), f(Xb); filas 1–2 preguntan «¿Xr reemplazará a Xa o a Xb?». Newton: elegir f'(x) entre 4 (se corrige al momento), luego f(Xₙ), f'(Xₙ), Xₙ₊₁, error (Xₙ copiado en filas 2–3).
- Puntaje sobre 100: bisección 30, falsa posición 35, Newton 35 (detalle en `MP.PTS` y `MP.PTS_DER`).
- Familias: bisección x² + ln(x) − a y eˣ − x − a (Xr reemplaza a extremos distintos en las filas 1 y 2); falsa posición eˣ + x − a y 2·sen(x) + x − a; Newton x² − a·cos(x) y eˣ + a·x − b. Variantes revisadas sin empates en el 5.º decimal.
- Pruebas: Node (todas las variantes, 200 carnets por método, casos de redondeo, copia cruzada, derivada mal) y Playwright con un supabase-js falso (panel + estudiante: abrir, registrar, filas, cierre del método, detalle, CSV, cerrar).
- Hallazgo (sin corregir, consultar con el docente): en `instrumentacion/js/nucleo.js`, `II.vaciarCola` guarda su copia vieja de la cola después de cada envío; si llega un envío nuevo mientras está enviando, ese envío se pierde. Por eso esta práctica usa su propia cola.

## Métodos Numéricos · Examen de raíces por celular (16/10/2026)

Carpeta `numericos/examen/` (sesiones `mn-ex1` oficial y `mn-ex-prueba` ensayo; filas creadas el 16/10). Mismo formato que la práctica (`numericos/practica/`), con un solo envío por fila **sin bloquearla** y sin mostrar si está bien. Reutiliza `config.js`, `nucleo.js`, `me.css` y `../practica/css/mp.css`; trae una copia congelada de `mp-motor.js`.

| Archivo | Rol |
|---|---|
| `index.html` + `js/ex-estudiante.js` | Estudiante: canje del QR (`?s=…&t=código`, RPC `mn_canjear_qr`) → registro → espera (con código de 3 cifras) → examen en 3 pestañas (filas editables, «Guardar fila», derivada de Newton una sola vez y corregida al momento) → terminado → nota publicada con detalle y solución. Envía el estado completo como `avance` (al guardar, cada 30 s si cambió, al salir y al final). Registro de salidas, pérdidas de foco, recargas y pantalla encendida (Wake Lock). Marca de agua con nombre y C.U. LaTeX con KaTeX (`js/ex-tex.js`) |
| `panel.html` + `js/ex-panel.js` | Docente (celular vertical; `?s=prueba` = ensayo): QR en pantalla completa que cambia solo al escanearse + «Nuevo QR»; «Iniciar examen» (habilita a todos los registrados); «Llegaron tarde» con Habilitar; cuenta regresiva «Últimos N minutos» con Detener / Reanudar / +5 min; «Terminar examen» (20 s); «Reabrir 5 minutos»; «Publicar notas» (fila `<sesión>-notas`) / Ocultar; lista con salidas, foco, recargas, celulares y nota; detalle por estudiante; Excel; en el ensayo, «Reiniciar y borrar» |
| `js/ex-motor.js` | `EX`: familias nuevas (bisección x·ln(x) − a; falsa posición eˣ − a·x²; Newton a·e^(−x) − x), `EX.datos(met, carnet)`, `EX.calificar` (cada casilla con los números del propio estudiante: ok completo, redondeo mitad, mal o vacía 0; derivada 6), `EX.nota`, `EX.firma`, `EX.codigo` |

- `estado_sesion.extra = { asincrona, token, qr_n, abre, hab: { carnet: true }, fin, cierra, pausa: { rest }, publicado }`. `cierra = fin + 60 s` (margen de red); sin cuenta regresiva, `cierra = null`.
- RPC `mn_canjear_qr(p_sesion, p_token)` (creada el 16/10, `security definer`, solo sesiones `mn-ex%`): si el código coincide, lo cambia por uno nuevo y devuelve `true`.
- La nota publicada se guarda en `estado_sesion` fila `<sesión>-notas` (`extra.notas[carnet] = { n, h, p }`); `h` = `EX.firma` de lo calificado (el celular avisa si su copia no coincide).
- Pruebas: Node (todas las variantes sin empates; 300 carnets con todo bien = 100) y Playwright con un supabase-js falso y base compartida entre contextos (docente + 3 estudiantes: QR de un solo uso, registro, iniciar, tardío habilitado, salidas, cuenta regresiva, detener, +5, terminar, publicar, detalle).

## Pendiente
- Sesión 4, día 5: repaso limitado a "inicio" hasta la clase; al terminar, dejar el paso en "Cierre" (no en un reto) y "Abrir toda la sesión".
- "Sesión 5, día 6" (miércoles 07/10, 20:00): publicada. Antes de la clase, limitar el repaso a "inicio"; al terminar, dejar el paso en "cierre" y abrir el examen desde `docente.html?s=ii-s6`.
- Control de estudio: `supabase/control-estudio.sql` ya aplicado (07/10, pegado por el docente en el SQL Editor; la herramienta de migraciones queda cancelada desde aquí). Falta que el docente lo revise con «Revisar como estudiante», borra datos de prueba, toca «Abrir ahora» y se agrega la tarjeta en `instrumentacion/index.html`. Cierra el jueves 08/10 a las 23:59.
- Examen final (40 %): publicado en `examen.html` (sesión `ii-s6`). Después del examen: Reporte → Descargar para Excel.
- Foro (`ii-foro`): el docente debe pegar `supabase/foro.sql` en el SQL Editor; después, mandar el enlace `foro.html` con la consigna. El sábado 23:59 cierra: Reporte → Descargar para Excel.
- Viernes: tabla completa de participación (por sesión, por persona, cada reto y rápida, total /100, promedio y ponderado a 25).
- Antes de cada clase: probar con el panel docente y luego **Reporte → Borrar datos de esta sesión**.
- Digital 1: antes de la clase, entrar como docente en `digital1/proyectar.html?s=<sesión>` y probar con el **repaso libre** (`clase.html?s=<sesión>&modo=libre`), que no registra nada. Ya no hay «Borrar datos». Al terminar, dejar el paso en `cierre`.
- Métodos Numéricos: antes de la clase, entrar como docente en `numericos/raices/proyectar.html` y probar con un celular. Al terminar, dejar el paso en `cierre`.
- Práctica de raíces (`mn-practica`): el docente la prueba, borra sus datos desde el panel, la abre y comparte el enlace. Cerrarla antes del examen.
- Examen de raíces (`mn-ex1`): el docente lo prueba en el ensayo (`panel.html?s=prueba`), reinicia el ensayo y a las 16:00 usa el oficial (`panel.html`). Después: Publicar notas y Descargar notas.
