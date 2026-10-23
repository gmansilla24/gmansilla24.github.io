/* Portfolio · Gastón M. Mansilla
   Estadísticas de visitas con GoatCounter (gratis, de código abierto, sin cookies ni banner de consentimiento).
   CODE es el código de tu sitio en goatcounter.com: tu panel es https://gmansilla24.goatcounter.com.
   Si CODE queda vacío este archivo no hace nada. Tampoco cuenta nada abriendo el sitio en tu computadora
   (localhost o un archivo local), para que tus pruebas no ensucien los números. */
(function () {
  "use strict";

  var CODE = "gmansilla24";

  if (!CODE) return;
  var host = window.location.hostname;
  if (window.location.protocol === "file:" || host === "localhost" || host === "127.0.0.1" || host === "[::1]") return;

  /* Las pantallas del prototipo que se muestran dentro del caso de estudio (?embed) no cuentan como visita aparte. */
  if (/[?&]embed(=|&|$)/.test(window.location.search)) return;

  var script = document.createElement("script");
  script.async = true;
  script.setAttribute("data-goatcounter", "https://" + CODE + ".goatcounter.com/count");
  script.src = "https://gc.zgo.at/count.js";
  document.head.appendChild(script);
})();
