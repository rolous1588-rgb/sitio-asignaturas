// ============================================================
// Transformadas · Práctica para el examen final (25/11/2026) — los 9 temas
// Cada tema: repaso (conceptos y fórmulas en LaTeX), errores típicos (sacados del recuperatorio del 22/10
// y del 2.º parcial del 09/11), pistas por paso para el modo «Paso a paso» y el problema que usa de los motores
// LP (Laplace, pr-laplace.js) y FR (Fourier, pr-fourier.js).
// PR.ej(tema, semilla, carrera) arma un ejercicio; PR.SIM describe los simulacros.
// ============================================================
(function () {
  const PR = (window.PR = window.PR || {});
  const X = String.raw;
  const LP = window.LP, FR = window.FR;

  PR.TEMAS = [
    // ---------------------------------------------------------------- LAPLACE
    {
      id: 'L1', num: 1, bloque: 'L', titulo: 'Inversa con polo repetido', M: LP, k: 'p1', examen: 64,
      repaso: [
        X`<p><b>La idea.</b> Si en el denominador un factor se repite, \((s+a)^3\), hace falta una fracción por cada potencia:</p>
          \[F(s)=\frac{A}{s+a}+\frac{B}{(s+a)^{2}}+\frac{C}{(s+a)^{3}}\]`,
        X`<p><b>Regla de la tabla</b> (de cada fracción a su término):</p>
          \[\mathcal{L}^{-1}\left\{\frac{1}{(s+a)^{n}}\right\}=\frac{t^{\,n-1}}{(n-1)!}\,e^{-at}\]
          <p>Por eso: \(\dfrac{A}{s+a}\to A\,e^{-at}\);\; \(\dfrac{B}{(s+a)^{2}}\to B\,t\,e^{-at}\);\; \(\dfrac{C}{(s+a)^{3}}\to \dfrac{C}{2}\,t^{2}e^{-at}\) (el 2 es \(2!\)).</p>`,
        X`<p><b>Atajo: cambio de variable.</b> Con \(p=s+a\) (o sea \(s=p-a\)), el numerador se escribe en \(p\) y se divide entre \(p^{3}\):</p>
          \[\frac{s^{2}+c}{(s+a)^{3}}=\frac{(p-a)^{2}+c}{p^{3}}=\frac{1}{p}-\frac{2a}{p^{2}}+\frac{a^{2}+c}{p^{3}}\]
          <p>Así se leen directo: \(A=1\);\; \(B=-2a\);\; \(C=a^{2}+c\).</p>`,
        X`<p><b>Resultado:</b></p>\[f(t)=e^{-at}\left(A+B\,t+\frac{C}{2}\,t^{2}\right)\]`
      ],
      errores: [
        X`En el recuperatorio, <b>7 de 24</b> pusieron el exponente con signo menos dentro de \(e^{-\boxed{1}\,t}\) (por ejemplo \(-3\) en vez de \(3\)). El signo ya está escrito: en la casilla va \(a\), positivo.`,
        X`Al menos <b>4 de 24</b> olvidaron dividir \(C\) entre 2: el coeficiente de \(t^{2}\) es \(C/2\), por el \(2!\) de la regla.`,
        X`Cambiar el orden: \(A\) es el término solo, \(B\) multiplica a \(t\) y \(C/2\) multiplica a \(t^{2}\).`
      ],
      pistas: [
        X`Haz \(p=s+a\): reemplaza \(s=p-a\) en el numerador, desarrolla el cuadrado y divide cada término entre \(p^{3}\). \(A\), \(B\) y \(C\) son los números que acompañan a \(1/p\), \(1/p^{2}\) y \(1/p^{3}\).`,
        X`El signo de \(e^{-\boxed{1}\,t}\) ya está escrito: va \(a\) positivo. Después: \(A\) queda solo, \(B\) multiplica a \(t\) y \(C\) se divide entre \(2!=2\).`
      ]
    },
    {
      id: 'L2', num: 2, bloque: 'L', titulo: 'Inversa con raíces complejas', M: LP, k: 'p2', examen: 69,
      repaso: [
        X`<p><b>Completar el cuadrado.</b> Si \(s^{2}+bs+K\) no tiene raíces reales (\(b^{2}-4K\lt 0\)):</p>
          \[s^{2}+2\alpha s+K=(s+\alpha)^{2}+\beta^{2},\qquad \alpha=\frac{b}{2},\quad \beta=\sqrt{K-\alpha^{2}}\]`,
        X`<p><b>Dos reglas de la tabla</b> (desplazamiento en \(s\)):</p>
          \[\mathcal{L}^{-1}\left\{\frac{s+\alpha}{(s+\alpha)^{2}+\beta^{2}}\right\}=e^{-\alpha t}\cos(\beta t)\qquad \mathcal{L}^{-1}\left\{\frac{\beta}{(s+\alpha)^{2}+\beta^{2}}\right\}=e^{-\alpha t}\sen(\beta t)\]`,
        X`<p><b>El numerador se arma con \((s+\alpha)\):</b></p>\[p\,s+q=p\,(s+\alpha)+(q-p\alpha)\]`,
        X`<p><b>Resultado:</b></p>\[f(t)=e^{-\alpha t}\left[p\cos(\beta t)+\frac{q-p\alpha}{\beta}\,\sen(\beta t)\right]\]`
      ],
      errores: [
        X`Escribir \(\beta^{2}\) donde va \(\beta\): en la casilla va la raíz.`,
        X`Olvidar restar \(p\alpha\) en el numerador del seno, o no dividirlo entre \(\beta\) (a la regla del seno le falta \(\beta\) arriba).`,
        X`Promedio del curso en este problema del recuperatorio: <b>69 %</b>.`
      ],
      pistas: [
        X`\(\alpha\) es la mitad del número que acompaña a \(s\). Después \(\beta^{2}=K-\alpha^{2}\): en la casilla va \(\beta\), la raíz, positiva.`,
        X`Escribe el numerador como \(p\,(s+\alpha)+(q-p\alpha)\). El coseno lleva \(p\); el seno lleva \((q-p\alpha)/\beta\).`
      ]
    },
    {
      id: 'L3', num: 3, bloque: 'L', titulo: 'Convolución', M: LP, k: 'p3', examen: 66,
      repaso: [
        X`<p><b>Definición:</b></p>\[(f*g)(t)=\int_{0}^{t} f(\tau)\,g(t-\tau)\,d\tau\]`,
        X`<p><b>Teorema:</b> la transformada de una convolución es el <b>producto</b> de las transformadas.</p>\[\mathcal{L}\{f*g\}=F(s)\cdot G(s)\]`,
        X`<p>Para \(e^{-at}*\sen(bt)\):</p>\[Y(s)=\frac{1}{s+a}\cdot\frac{b}{s^{2}+b^{2}}=\frac{b}{(s+a)(s^{2}+b^{2})}\]`,
        X`<p><b>Fracciones parciales con un factor cuadrático:</b></p>
          \[\frac{b}{(s+a)(s^{2}+b^{2})}=\frac{A}{s+a}+\frac{Bs+C}{s^{2}+b^{2}}\]
          <p>Con \(s=-a\): \(A=\dfrac{b}{a^{2}+b^{2}}\). Igualando los coeficientes de \(s^{2}\): \(B=-A\). Igualando los de \(s\): \(C=-aB=aA\).</p>`,
        X`<p><b>De vuelta al tiempo:</b></p>\[y(t)=A\,e^{-at}+B\cos(bt)+\frac{C}{b}\,\sen(bt)\]`
      ],
      errores: [
        X`Sumar las transformadas en vez de multiplicarlas (la opción con «+»).`,
        X`Poner \(C\) como coeficiente del seno: hay que dividir entre \(b\), porque \(\dfrac{C}{s^{2}+b^{2}}=\dfrac{C}{b}\cdot\dfrac{b}{s^{2}+b^{2}}\).`,
        X`Usar \(s-a\): la transformada de \(e^{-at}\) es \(\dfrac{1}{s+a}\).`
      ],
      pistas: [
        X`Transforma cada función por separado y <b>multiplica</b>: \(\mathcal{L}\{e^{-at}\}=\frac{1}{s+a}\) y \(\mathcal{L}\{\sen(bt)\}=\frac{b}{s^{2}+b^{2}}\).`,
        X`Multiplica todo por el denominador: \(b=A(s^{2}+b^{2})+(Bs+C)(s+a)\). Con \(s=-a\) sale \(A\). Después, coeficientes de \(s^{2}\): \(A+B=0\); de \(s\): \(aB+C=0\).`,
        X`Cada término vuelve con su regla: \(\frac{A}{s+a}\to A\,e^{-at}\); \(\frac{Bs}{s^{2}+b^{2}}\to B\cos(bt)\); \(\frac{C}{s^{2}+b^{2}}\to\frac{C}{b}\sen(bt)\).`
      ]
    },
    {
      id: 'L4', num: 4, bloque: 'L', titulo: 'Sistema de dos EDO', M: LP, k: 'p4', examen: 23,
      repaso: [
        X`<p><b>La clave:</b> cada derivada se transforma con su condición inicial.</p>\[\mathcal{L}\{x'(t)\}=s\,X(s)-x(0)\qquad \mathcal{L}\{y'(t)\}=s\,Y(s)-y(0)\]`,
        X`<p>El sistema \(x'=px+qy\);\; \(y'=rx+py\) se vuelve <b>algebraico</b>:</p>
          \[\begin{cases}(s-p)\,X-q\,Y=x(0)\\ -r\,X+(s-p)\,Y=y(0)\end{cases}\]`,
        X`<p><b>Cramer.</b> Las dos tienen el mismo denominador:</p>
          \[\Delta=(s-p)^{2}-qr=(s-\lambda_1)(s-\lambda_2),\qquad \lambda_{1,2}=p\pm\sqrt{qr}\]
          \[X(s)=\frac{x(0)\,(s-p)+q\,y(0)}{\Delta}\qquad Y(s)=\frac{y(0)\,(s-p)+r\,x(0)}{\Delta}\]`,
        X`<p><b>Fracciones parciales con dos raíces distintas:</b></p>
          \[\frac{m\,s+n}{(s-\lambda_1)(s-\lambda_2)}=\frac{c_1}{s-\lambda_1}+\frac{c_2}{s-\lambda_2},\qquad c_1=\frac{m\lambda_1+n}{\lambda_1-\lambda_2},\quad c_2=\frac{m\lambda_2+n}{\lambda_2-\lambda_1}\]
          \[x(t)=c_1\,e^{\lambda_1 t}+c_2\,e^{\lambda_2 t}\]`,
        X`<p><b>Comprobación rápida:</b> en \(t=0\), \(c_1+c_2\) tiene que dar \(x(0)\) (y en \(y(t)\), dar \(y(0)\)).</p>`
      ],
      errores: [
        X`Es el problema más bajo del curso: promedio <b>23 %</b> en el recuperatorio, y <b>8 de 24</b> casi no lo empezaron. Con el modo «Paso a paso» se hace por partes.`,
        X`Olvidar las condiciones iniciales al transformar: \(\mathcal{L}\{x'\}=sX-x(0)\), no \(sX\).`,
        X`Equivocar signos al ordenar el numerador: \(x(0)\,(s-p)+q\,y(0)=x(0)\,s+\big(q\,y(0)-p\,x(0)\big)\).`
      ],
      pistas: [
        X`Transforma: \(sX-x(0)=pX+qY\) y \(sY-y(0)=rX+pY\). El determinante es \((s-p)^{2}-qr\) y sus raíces son \(p\pm\sqrt{qr}\). En la primera casilla va la mayor.`,
        X`Cramer: el numerador de \(X\) se obtiene cambiando la columna de \(X\) por \((x(0),\,y(0))\): \(x(0)(s-p)+q\,y(0)\). Ordénalo como \(x(0)\,s+\big(q\,y(0)-p\,x(0)\big)\).`,
        X`Para \(c_1\): tapa \((s-\lambda_1)\) y reemplaza \(s=\lambda_1\) en lo que queda; para \(c_2\), igual con \(\lambda_2\). Revisa que \(c_1+c_2=x(0)\).`,
        X`Igual que en \(X\), cambiando ahora la columna de \(Y\): \(y(0)(s-p)+r\,x(0)\), o sea \(y(0)\,s+\big(r\,x(0)-p\,y(0)\big)\).`,
        X`Mismo método que en \(x(t)\). Revisa que la suma de los dos coeficientes dé \(y(0)\).`
      ]
    },
    {
      id: 'L5', num: 5, bloque: 'L', titulo: 'EDO con entrada por tramos', M: LP, k: 'p5', examen: 33,
      repaso: [
        X`<p><b>Ventanas con escalones.</b> \(u(t-T)\) vale 0 antes de \(T\) y 1 desde \(T\). Una ventana que prende en 0 y apaga en \(T\) es \(u(t)-u(t-T)\). Un pulso de altura \(K\):</p>
          \[f(t)=K\,\big[u(t)-u(t-T)\big]\qquad\Longrightarrow\qquad F(s)=\frac{K\left(1-e^{-Ts}\right)}{s}\]`,
        X`<p><b>Derivadas con condiciones iniciales:</b></p>\[\mathcal{L}\{y'\}=sY-y(0)\qquad \mathcal{L}\{y''\}=s^{2}Y-s\,y(0)-y'(0)\]`,
        X`<p>Para \(y''+b\,y'+c\,y=f(t)\) con \(y'(0)=0\) y \(s^{2}+bs+c=(s+l_1)(s+l_2)\):</p>
          \[Y(s)=\underbrace{\frac{y(0)\,s+b\,y(0)}{(s+l_1)(s+l_2)}}_{\text{respuesta libre}}+\underbrace{\frac{K\left(1-e^{-Ts}\right)}{s\,(s+l_1)(s+l_2)}}_{\text{respuesta a la entrada}}\]`,
        X`<p><b>Segundo desplazamiento:</b> si \(\mathcal{L}^{-1}\{G(s)\}=g(t)\), entonces \(\mathcal{L}^{-1}\{e^{-Ts}G(s)\}=g(t-T)\,u(t-T)\).</p>
          \[y(t)=y_{\text{libre}}(t)+g(t)-g(t-T)\,u(t-T),\qquad g(t)=\mathcal{L}^{-1}\left\{\frac{K}{s\,(s+l_1)(s+l_2)}\right\}\]`
      ],
      errores: [
        X`Promedio <b>33 %</b> en el recuperatorio. Unos <b>10 de 24</b> eligieron \(f(t)\) y \(F(s)\) y dejaron vacías las fracciones parciales: practica los pasos 3 y 4.`,
        X`Elegir \(K\,u(t-T)\): eso es solo el escalón que apaga. El pulso es \(K\,[u(t)-u(t-T)]\).`,
        X`Olvidar el término \(b\,y(0)\) del numerador de la respuesta libre: sale de \(\mathcal{L}\{b\,y'\}=b\,sY-b\,y(0)\).`
      ],
      pistas: [
        X`Una ventana prende en 0 y apaga en \(T\): \(u(t)\) menos \(u(t-T)\), todo por la altura \(K\).`,
        X`Transforma cada escalón: \(\mathcal{L}\{u(t)\}=\frac{1}{s}\) y \(\mathcal{L}\{u(t-T)\}=\frac{e^{-Ts}}{s}\).`,
        X`De \(s^{2}Y\) sale \(-s\,y(0)\) y de \(b\,sY\) sale \(-b\,y(0)\); pásalos al otro lado: el numerador es \(y(0)\,s+b\,y(0)\). Después, fracciones parciales: tapa cada factor y evalúa en su raíz.`,
        X`Tapa cada factor y evalúa lo que queda: con \(s=0\) sale el primero; con \(s=-l_1\), el segundo; con \(s=-l_2\), el tercero.`
      ]
    },
    // ---------------------------------------------------------------- FOURIER
    {
      id: 'F1', num: 6, bloque: 'F', titulo: 'Lee tu señal', M: FR, k: 'p1', examen: 78,
      repaso: [
        X`<p><b>Período \(T\):</b> lo que tarda la señal en repetirse, <b>en segundos</b>. Si te dan milisegundos, divide entre 1000. Si te dan latidos por minuto: \(T=60/\text{lpm}\).</p>`,
        X`\[f=\frac{1}{T}\ \ (\text{Hz})\qquad\qquad \omega_0=2\pi f=\frac{2\pi}{T}\ \ (\text{rad/s})\]`,
        X`<p><b>Valor medio</b> de una senoidal con nivel que va de \(V_{\min}\) a \(V_{\max}\):</p>\[a_0=\frac{V_{\max}+V_{\min}}{2}\qquad\text{(la amplitud es } \tfrac{V_{\max}-V_{\min}}{2}\text{)}\]`,
        X`<p><b>Armónico \(n\):</b> su frecuencia es \(f_n=n\,f\). El 3.<sup>er</sup> armónico está en \(3f\).</p>`
      ],
      errores: [
        X`En el 2.º parcial, <b>3 de 14</b> de Electromecánica dejaron \(T\) en milisegundos (por ejemplo 12,5 en vez de 0,0125); así \(\omega_0\) sale 1000 veces más chica.`,
        X`Varios dejaron vacía la frecuencia del 3.<sup>er</sup> armónico o pusieron \(f/3\): es \(3f\).`,
        X`Redondear antes de tiempo: guarda decimales hasta el final (se acepta ±2 %).`
      ],
      pistas: [
        X`\(T\) en segundos (ms ÷ 1000, o 60 ÷ lpm). Luego \(f=1/T\), \(\omega_0=2\pi f\), \(a_0=(V_{\max}+V_{\min})/2\) y \(f_3=3f\).`
      ]
    },
    {
      id: 'F2', num: 7, bloque: 'F', titulo: 'Coeficientes: triangular y cuadrada', M: FR, k: (r) => (r() < 0.5 ? 'p2' : 'p2c'), examen: 53,
      repaso: [
        X`<p><b>Fórmulas</b> (aquí \(a_0\) es el valor medio):</p>
          \[a_0=\frac{1}{T}\int_{0}^{T} f(t)\,dt\qquad a_n=\frac{2}{T}\int_{0}^{T} f(t)\cos(n\omega_0 t)\,dt\qquad b_n=\frac{2}{T}\int_{0}^{T} f(t)\sen(n\omega_0 t)\,dt\]`,
        X`<p><b>Nivel y amplitud.</b> Si la onda va de \(V_{\text{bajo}}\) a \(V_{\text{alto}}\): \(a_0=\dfrac{V_{\text{alto}}+V_{\text{bajo}}}{2}\) y \(A=\dfrac{V_{\text{alto}}-V_{\text{bajo}}}{2}\), la <b>mitad</b> de la altura total.</p>`,
        X`<p><b>Triangular par</b> con pico en \(t=0\) (si en \(t=0\) hay un valle, cambia el signo):</p>
          \[f(t)=a_0+\frac{8A}{\pi^{2}}\sum_{n\ \text{impar}}\frac{\cos(n\omega_0 t)}{n^{2}}\qquad\Rightarrow\qquad b_n=0;\ \ a_2=0;\ \ a_3=\frac{a_1}{9}\]`,
        X`<p><b>Cuadrada impar</b> (el salto está en \(t=0\); vale \(v_1\) en \(0\lt t\lt T/2\) y \(v_2\) en el resto), con \(A=\frac{v_1-v_2}{2}\):</p>
          \[f(t)=a_0+\frac{4A}{\pi}\sum_{n\ \text{impar}}\frac{\sen(n\omega_0 t)}{n}\qquad\Rightarrow\qquad a_n=0;\ \ b_3=\frac{b_1}{3}\]`,
        X`<p><b>Cuadrada par</b> (vale \(v_1\) en \(|t|\lt T/4\)):</p>
          \[f(t)=a_0+\frac{4A}{\pi}\left[\cos(\omega_0 t)-\frac{\cos(3\omega_0 t)}{3}+\frac{\cos(5\omega_0 t)}{5}-\cdots\right]\qquad\Rightarrow\qquad b_n=0;\ \ a_3=-\frac{a_1}{3}\]`
      ],
      errores: [
        X`En el 2.º parcial (triangular, promedio <b>53 %</b>), <b>8 de 33</b> pusieron \(a_2\) o \(b_1\) distinto de 0 en una triangular par.`,
        X`Unos <b>10 de 33</b> no respetaron \(a_3=a_1/9\): por ejemplo \(a_3=a_1/2\) o \(a_3=a_1\). En la triangular los coeficientes caen como \(1/n^{2}\); en la cuadrada, como \(1/n\).`,
        X`Usar la altura total en vez de \(A\), u olvidar el signo menos cuando en \(t=0\) hay un valle.`
      ],
      pistas: {
        p2: [X`Primero \(a_0=\frac{\text{alto}+\text{bajo}}{2}\) y \(A=\frac{\text{alto}-\text{bajo}}{2}\). Es par: todos los \(b_n\) son 0. Solo hay \(n\) impares: \(a_2=0\). \(a_1=\pm\frac{8A}{\pi^{2}}\) (+ si en \(t=0\) hay pico, − si hay valle) y \(a_3=a_1/9\).`],
        p2c: [X`\(a_0=\frac{v_1+v_2}{2}\) y \(A=\frac{v_1-v_2}{2}\). Si el salto está en \(t=0\) (impar al quitar el nivel), solo hay senos: \(b_1=\frac{4A}{\pi}\), \(b_3=b_1/3\) y los \(a_n\) son 0. Si está centrada en \(t=0\) (par), solo cosenos: \(a_1=\frac{4A}{\pi}\), \(a_3=-a_1/3\) y los \(b_n\) son 0.`]
      }
    },
    {
      id: 'F3', num: 8, bloque: 'F', titulo: 'Reconocer sin integrar', M: FR, k: 'p3', examen: 61,
      repaso: [
        X`<p><b>Par:</b> \(f(-t)=f(t)\) (espejo en el eje vertical) \(\Rightarrow\) \(b_n=0\): solo cosenos (y \(a_0\)).</p>
          <p><b>Impar:</b> \(f(-t)=-f(t)\) (simétrica respecto del origen) \(\Rightarrow\) \(a_0=0\) y \(a_n=0\): solo senos.</p>
          <p><b>Media onda:</b> \(f(t+T/2)=-f(t)\), después de quitar el nivel \(\Rightarrow\) solo armónicos impares.</p>`,
        X`<p><b>Lo que cambia y lo que no:</b></p>
          <ul><li>Sumar un nivel cambia solo \(a_0\). Con nivel distinto de 0, la señal ya no es impar.</li>
          <li>Invertir la señal (por \(-1\)) no cambia la simetría ni los armónicos; cambia el signo de \(a_0\).</li>
          <li>Correrla un cuarto de período puede pasar de par a impar (cuadrada, triangular), pero no cambia qué armónicos tiene.</li></ul>`,
        X`<p><b>Valor medio</b> = área de un período ÷ \(T\). Con amplitud \(A\): rectificada de media onda \(A/\pi\); de onda completa \(2A/\pi\); pulso de un cuarto del período \(A/4\); cuadrada, triangular y diente de sierra: \(0\). Luego se suma el nivel.</p>`
      ],
      errores: [
        X`Promedio <b>61 %</b> en el 2.º parcial.`,
        X`Decir que una señal con nivel es impar: con \(a_0\ne 0\) no puede ser impar.`,
        X`Creer que el nivel o la inversión cambian los armónicos, o confundir «par» con «solo armónicos pares».`
      ],
      pistas: [
        X`Pon un espejo en \(t=0\): si el lado izquierdo es igual al derecho, es par. Si es igual pero dado vuelta (y sin nivel), es impar.`,
        X`Quita el nivel y mira lo que queda: si es impar, no hay cosenos (\(a_n=0\) para \(n\ge 1\)). En cualquier otro caso, sí hay.`,
        X`Los senos (\(b_n\)) desaparecen solo si la señal es par. El nivel no importa.`,
        X`Quita el nivel y corre la señal medio período: si queda dada vuelta, solo hay impares. Las rectificadas, el diente de sierra y el pulso tienen pares e impares.`,
        X`\(a_0\) es el valor medio: el nivel más el valor medio de la onda base (con su signo si está invertida).`
      ]
    },
    {
      id: 'F4', num: 9, bloque: 'F', titulo: '¿De quién es este espectro?', M: FR, k: 'p4', examen: 40,
      repaso: [
        X`<p><b>Espectro de amplitud:</b> una barra por armónico, \(c_0=|a_0|\) y \(c_n=\sqrt{a_n^{2}+b_n^{2}}\).</p>`,
        X`<p><b>Tres preguntas para leerlo:</b></p>
          <ol><li>¿Hay barra en 0? Entonces la onda tiene valor medio (rectificadas, pulso).</li>
          <li>¿Faltan los pares? Simetría de media onda (cuadrada, triangular).</li>
          <li>¿Caen lento o rápido? Con saltos (cuadrada, diente, pulso) caen como \(1/n\): \(c_3=c_1/3\). Sin saltos (triangular, rectificadas) caen como \(1/n^{2}\): casi solo se ve la primera barra.</li></ol>`,
        X`<p><b>Huellas de cada onda:</b></p>
          <ul><li><b>Cuadrada:</b> sin \(c_0\); solo impares; caen como \(1/n\).</li>
          <li><b>Triangular:</b> sin \(c_0\); solo impares; caen como \(1/n^{2}\) (\(c_3\) casi no se ve).</li>
          <li><b>Diente de sierra:</b> sin \(c_0\); todos los armónicos; \(c_2=c_1/2\).</li>
          <li><b>Rectificada de media onda:</b> con \(c_0\); \(c_1\) grande; después solo pares, pequeños.</li>
          <li><b>Rectificada de onda completa:</b> \(c_0\) es la barra más alta; las demás caen rápido.</li>
          <li><b>Pulso de un cuarto del período:</b> con \(c_0\); faltan \(c_4\) y \(c_8\).</li></ul>`
      ],
      errores: [
        X`Promedio <b>40 %</b> en el 2.º parcial: es el más bajo de Fourier.`,
        X`Mirar solo la barra más alta y no fijarse en \(c_0\) ni en cuáles faltan.`,
        X`Confundir cuadrada y triangular: las dos tienen solo impares, pero en la triangular \(c_3\) es 9 veces menor que \(c_1\); en la cuadrada, solo 3 veces.`
      ],
      pistas: [
        X`Para cada onda: ¿tiene valor medio (barra en 0)? ¿Tiene saltos (las barras caen lento) o no (caen rápido)? ¿Es simétrica de media onda (faltan los pares)?`
      ]
    }
  ];
  PR.porId = Object.fromEntries(PR.TEMAS.map((t) => [t.id, t]));
  PR.BLOQUES = [{ id: 'L', titulo: 'Transformada de Laplace', sub: 'Lo del 1.er parcial' }, { id: 'F', titulo: 'Series de Fourier', sub: 'Lo del 2.º parcial' }];

  // ---------- un ejercicio ----------
  // semilla = C.U. + tema + número; en F2 la misma semilla decide si es triangular o cuadrada
  const cacheEj = {};
  PR.ej = (tid, semilla, car) => {
    const clave = tid + '|' + semilla + '|' + (/biom/i.test(car || '') ? 'b' : 'e');
    if (cacheEj[clave]) return cacheEj[clave];
    const T = PR.porId[tid], M = T.M;
    const k = typeof T.k === 'function' ? T.k(M.rng(String(semilla) + '|cual')) : T.k;
    const d = M.datos(k, semilla, car);
    const P = M.P[k], pasos = P.pasos(d), items = M.items(k, d);
    const ej = { T, M, k, d, P, pasos, items, max: M.MAX[k] };
    cacheEj[clave] = ej;
    return ej;
  };
  PR.pista = (ej, i) => { const p = ej.T.pistas; const l = Array.isArray(p) ? p : p[ej.k] || []; return l[i] || l[l.length - 1] || ''; };
  PR.calificar = (ej, vals) => ej.M.calificar(ej.k, ej.d, vals || {});
  // texto del valor esperado para mostrarlo o para dejarlo escrito en la casilla
  PR.txt = (ej, x) => ej.M.txt(x);
  PR.tex = (ej, x) => ej.M.tex(x);

  // ---------- simulacros ----------
  PR.SIM = {
    lap: { titulo: 'Simulacro de Laplace', sub: '5 problemas, como el recuperatorio', temas: ['L1', 'L2', 'L3', 'L4', 'L5'] },
    fou: { titulo: 'Simulacro de Fourier', sub: '4 problemas, como el 2.º parcial', temas: ['F1', 'F2', 'F3', 'F4'] },
    todo: { titulo: 'Simulacro completo', sub: 'Laplace y Fourier: 9 problemas', temas: ['L1', 'L2', 'L3', 'L4', 'L5', 'F1', 'F2', 'F3', 'F4'] }
  };
  // nota sobre 100: en «todo», la mitad para cada bloque (los dos suman 100 por separado)
  PR.notaSim = (tipo, pts) => {
    const S = PR.SIM[tipo];
    const suma = (ids) => ids.reduce((s, t) => s + (pts[t] || 0), 0);
    if (tipo === 'todo') return Math.round(((suma(S.temas.filter((t) => t[0] === 'L')) + suma(S.temas.filter((t) => t[0] === 'F'))) / 2) * 10) / 10;
    return Math.round(suma(S.temas) * 10) / 10;
  };
})();
