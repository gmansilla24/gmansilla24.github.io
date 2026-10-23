/* Prototipo · Panel de notificaciones (Figma: Overlay/Offcanvas, desktop 400 / mobile 268).
   Se abre desde la campanita del header (o desde [data-notif-open] en "Probar estados" y en el catálogo).
   Entra desde la derecha sobre un fondo oscuro; mientras está abierto el resto de la página queda inerte.
   Teclado: Tab y Shift+Tab dan la vuelta dentro del panel; Esc, la ✕ o un clic en el fondo lo cierran y devuelven el foco a quien lo abrió.
   Parámetros de URL para comparar con Figma:  ?notificaciones=abierto  ·  ?notificaciones=vacio  */
(function () {
  "use strict";

  var body = document.body;
  var ITEMS = ["Tienes 2 servicios por vencer.", "Tu pago del 12/10 fue acreditado.", "Hay una nueva versión de PHP disponible."];
  var panel, scrim, titulo, cuerpo, cerrarBtn, origen = null, contador = null;

  function icono(id, cls) { return '<svg class="icon' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }

  function construir() {
    scrim = document.createElement("div");
    scrim.className = "nt-scrim"; scrim.setAttribute("aria-hidden", "true");
    panel = document.createElement("div");
    panel.className = "nt nt-drawer"; panel.id = "drawer-notif";
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.setAttribute("aria-labelledby", "drawer-notif-title");
    panel.innerHTML = '<div class="nt__head"><h2 class="nt__title" id="drawer-notif-title">Notificaciones</h2>' +
      '<button class="nt__x" type="button" aria-label="Cerrar">' + icono("close", "icon--16") + '</button></div><div class="nt__body"></div>';
    body.appendChild(scrim); body.appendChild(panel);
    cuerpo = panel.querySelector(".nt__body");
    cerrarBtn = panel.querySelector(".nt__x");
    cerrarBtn.addEventListener("click", function () { cerrar(true); });
    scrim.addEventListener("click", function () { cerrar(true); });
    panel.addEventListener("click", function (e) {
      var it = e.target.closest(".notif");
      if (!it) return;
      cerrar(false);                                 /* el aviso "fuera del alcance" lo muestra sistema.js por el data-pending del ítem */
    });
    panel.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = Array.prototype.slice.call(panel.querySelectorAll("button, a[href]")).filter(function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && abierto()) { e.stopPropagation(); e.preventDefault(); cerrar(true); }
    }, true);
  }

  function abierto() { return body.hasAttribute("data-panel"); }
  function fondo() {
    return [".app-header", ".sidebar", ".app-body", ".dash", ".ds-top", ".ds-wrap"].map(function (s) { return document.querySelector(s); }).filter(Boolean);
  }
  function pintar(vacio) {
    if (vacio) {
      cuerpo.innerHTML = '<div class="nt-empty"><span class="nt-empty__ico">' + icono("notifications") + '</span><div><h3>Todavía no tienes notificaciones</h3><p>Cuando recibas novedades, podrás verlas desde aquí</p></div></div>';
    } else {
      cuerpo.innerHTML = '<ul class="nt-list">' + ITEMS.map(function (t) {
        return '<li><button class="notif" type="button" data-pending="Notificación: fuera del alcance de este prototipo"><span class="notif__text">' + t + "</span>" + icono("chevron-right") + "</button></li>";
      }).join("") + "</ul>";
    }
    if (contador) contador.style.display = vacio ? "none" : "";
  }
  function abrir(disparador, vacio, sinAnimacion) {
    if (!panel) construir();
    if (abierto()) return;
    origen = disparador || null;
    pintar(vacio);
    var pb = document.getElementById("probar-panel");
    if (pb && !pb.hidden) { pb.hidden = true; var t = document.getElementById("probar-toggle"); if (t) t.setAttribute("aria-expanded", "false"); }
    fondo().forEach(function (n) { n.inert = true; });
    /* La primera vez el panel recién se acaba de insertar: sin calcular antes su estado cerrado, el navegador no tiene desde dónde animar y aparece de golpe. */
    if (!sinAnimacion) void panel.offsetWidth;
    body.setAttribute("data-panel", "notificaciones");
    if (origen) origen.setAttribute("aria-expanded", "true");
    window.setTimeout(function () { cerrarBtn.focus({ preventScroll: true }); }, 0);
  }
  function cerrar(devolverFoco) {
    if (!panel || !abierto()) return;
    body.removeAttribute("data-panel");
    fondo().forEach(function (n) { n.inert = false; });
    if (origen) origen.setAttribute("aria-expanded", "false");
    if (devolverFoco && origen && origen.offsetParent !== null) origen.focus({ preventScroll: true });
  }

  var campana = document.querySelector("[data-notif-bell]");
  if (campana) {
    contador = campana.parentNode.querySelector(".counter");
    campana.addEventListener("click", function () { abrir(campana, false); });
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-notif-open]"), function (b) {
    b.addEventListener("click", function () {
      var vacio = b.getAttribute("data-notif-open") === "vacio";
      if (campana) contador = campana.parentNode.querySelector(".counter");
      abrir(b, vacio);
    });
  });

  var q = new URLSearchParams(window.location.search).get("notificaciones");
  if (q === "abierto" || q === "vacio") abrir(campana, q === "vacio", true);   /* por URL aparece ya abierto, sin animación */
})();
