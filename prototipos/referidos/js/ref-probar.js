/* Prototipo · Referidos · "Probar estados": etapa del flujo
   Cambiar de etapa NO navega: actualiza el estado compartido (ref-estado.js) y la página se redibuja sola (todo cuelga de body[data-etapa]).
   El panel se queda abierto para poder pasar de una etapa a otra; se cierra con Esc, con un clic afuera o con el botón. */
(function () {
  "use strict";
  var R = window.NubixRef;
  var botones = document.querySelectorAll("[data-etapa-demo]");
  var estado = document.getElementById("estado");
  var NOMBRES = {
    "sin-compras": "Sin compras", "con-compras": "Compró un servicio, sin cupón", "cupon": "Cupón generado",
    "referidos": "Referidos registrados y con compras", "cobrado": "Después de cobrar"
  };
  function marcar() {
    for (var i = 0; i < botones.length; i++) {
      botones[i].setAttribute("aria-pressed", botones[i].getAttribute("data-etapa-demo") === R.etapa() ? "true" : "false");
    }
  }
  document.getElementById("probar-etapa").addEventListener("click", function (e) {
    var b = e.target.closest("[data-etapa-demo]");
    if (!b) return;
    var et = b.getAttribute("data-etapa-demo");
    R.setEtapa(et);
    estado.textContent = "";
    window.setTimeout(function () { estado.textContent = "Etapa: " + NOMBRES[et] + "."; }, 30);
  });
  document.addEventListener("ref:etapa", marcar);
  marcar();
})();
