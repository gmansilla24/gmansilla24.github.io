/* Prototipo · Referidos · "Elegir servicio" y tarjeta "Nuevos servicios" del dashboard sin compras (compra simulada)
   Las dos entran al mismo flujo de compra, así que las dos usan [data-elegir-servicio].
   El flujo de compra no está prototipado. "Elegir servicio" simula que el usuario ya compró: pasa a la etapa "con-compras" y lleva al dashboard
   con servicios; ahí un aviso lo dice, igual que el resto de lo que queda fuera del alcance. No hay pantalla intermedia (la de Figma, "Conector de flujo ·
   Usuario compra", existe solo porque Figma no guarda estado). Desde "Probar estados" se llega a la misma etapa sin pasar por acá.
   Se vuelve a Referidos por el chip "Recomiéndanos y gana hasta USD 250" del header. */
(function () {
  "use strict";
  var KEY = "nubix-proto-referidos-aviso";
  var MENSAJE = "Simulamos la compra: el flujo de compra no forma parte de este prototipo.";
  var R = window.NubixRef;

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-elegir-servicio]");
    if (!b) return;
    e.preventDefault();
    try { window.sessionStorage.setItem(KEY, "compra"); } catch (err) { /* sin almacenamiento: igual se navega, solo falta el aviso */ }
    R.setEtapa("con-compras");
    window.location.href = "dashboard.html";
  });

  /* Llegada al dashboard después de "Elegir servicio": el aviso se muestra una sola vez */
  if (!document.querySelector(".dash")) return;
  var vino = null;
  try { vino = window.sessionStorage.getItem(KEY); window.sessionStorage.removeItem(KEY); } catch (err) { /* idem */ }
  if (vino !== "compra") return;
  var toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = MENSAJE;
  toast.classList.add("is-visible");
  window.setTimeout(function () { toast.classList.remove("is-visible"); }, 5000);
})();
