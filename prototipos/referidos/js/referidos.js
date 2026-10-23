/* Prototipo · Referidos y recompensas · pestaña "Recomendar y ganar"
   Lo que cambia de pantalla lo decide body[data-etapa] (ref-estado.js) con CSS; acá queda lo que se hace con las manos:
     Generar cupón    → "Generando cupón" (velo + spinner, 0,8 s como en Figma) → etapa "cupon"
     Copiar cupón     → aviso "Link copiado."
     Editar cupón     → modal (js/cupon.js)
   Las etapas siguientes (referidos, cobro) no se disparan desde la pantalla: se eligen en "Probar estados".
   Lo externo (WhatsApp, email) y lo que todavía no está armado avisan con el toast de "pendiente" (casos.js). */
(function () {
  "use strict";
  var R = window.NubixRef;
  var hero = document.getElementById("hero");
  var generar = document.getElementById("generar-cupon");
  var copiar = document.getElementById("copiar-cupon");
  var estado = document.getElementById("estado");
  var aviso = document.getElementById("aviso");
  var avisoTexto = document.getElementById("aviso-texto");

  function anunciar(msg) {
    estado.textContent = "";
    window.setTimeout(function () { estado.textContent = msg; }, 30);
  }
  /* El link se ve en la tarjeta de "Recomendar y ganar" y, con el cupón generado, en "Actividad y pagos" */
  function pintarLink() {
    var els = document.querySelectorAll(".js-cupon-url");
    for (var i = 0; i < els.length; i++) { els[i].textContent = R.link(); els[i].setAttribute("title", R.link()); }
  }
  pintarLink();
  document.addEventListener("ref:cupon", pintarLink);

  /* ---------- Generar cupón ---------- */
  generar.addEventListener("click", function () {
    if (hero.classList.contains("is-loading")) return;
    hero.classList.add("is-loading");
    hero.setAttribute("aria-busy", "true");
    generar.disabled = true;
    anunciar("Generando tu cupón…");
    window.setTimeout(function () {
      hero.classList.remove("is-loading");
      hero.removeAttribute("aria-busy");
      generar.disabled = false;
      if (R.etapa() === "con-compras") R.setEtapa("cupon");
      copiar.focus({ preventScroll: true });
      anunciar("Tu cupón ya está listo.");
    }, 800);
  });

  /* ---------- Aviso de éxito ---------- */
  var timer;
  /* variante "cupon": el toast de "El link de referencia se actualizó…" mide 300 y va a 20 del borde (Figma 482:29159) */
  function mostrarAviso(texto, variante) {
    avisoTexto.textContent = texto;
    aviso.classList.toggle("toast-stack--cupon", variante === "cupon");
    aviso.classList.add("is-visible");
    window.clearTimeout(timer);
    timer = window.setTimeout(ocultarAviso, 4000);
  }
  function ocultarAviso() { aviso.classList.remove("is-visible"); }
  R.aviso = mostrarAviso;
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && aviso.classList.contains("is-visible")) ocultarAviso(); });

  /* ---------- Copiar cupón ---------- */
  document.addEventListener("click", function (e) {
    if (!e.target.closest("[data-copiar-cupon]")) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        var pr = navigator.clipboard.writeText(R.link());
        if (pr && pr.catch) pr.catch(function () { /* sin permiso para el portapapeles: igual se da el aviso */ });
      }
    } catch (err) { /* sin portapapeles: igual se da el aviso */ }
    mostrarAviso("Link copiado.");
  });
})();
