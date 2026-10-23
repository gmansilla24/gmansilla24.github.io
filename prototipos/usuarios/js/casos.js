/* Prototipo · Casos particulares (páginas de invitación)
   Solo lo mínimo: "Probar estados" (abrir/cerrar) y el aviso de lo que todavía no está armado (se elimina al completar el prototipo). */
(function () {
  "use strict";

  var probar = document.getElementById("probar");
  var toggle = document.getElementById("probar-toggle");
  var panel = document.getElementById("probar-panel");
  function abrirPanel() { panel.hidden = false; toggle.setAttribute("aria-expanded", "true"); }
  function cerrarPanel() { panel.hidden = true; toggle.setAttribute("aria-expanded", "false"); }
  toggle.addEventListener("click", function () { if (panel.hidden) abrirPanel(); else cerrarPanel(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panel.hidden) { cerrarPanel(); toggle.focus(); }
  });
  document.addEventListener("click", function (e) {
    if (!panel.hidden && !probar.contains(e.target)) cerrarPanel();
  });

  var toast = document.getElementById("toast");
  var timer;
  function avisar(msg) {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    window.clearTimeout(timer);
    timer = window.setTimeout(function () { toast.classList.remove("is-visible"); }, 3200);
  }
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-pending]");
    if (!el) return;
    e.preventDefault();
    avisar(el.getAttribute("data-pending"));
  });
})();
