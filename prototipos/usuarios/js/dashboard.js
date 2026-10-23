/* Prototipo · Dashboard (inicio)
   Dos modos, según la URL:
     (sin parámetros)             cuenta propia: productos, pendientes (carrito y vencimientos) y tarjeta de talleres
     ?cuenta=invitada&de=valeria  cuenta de otra persona (valeria | tomas | camila): aviso "Estás en una cuenta invitada",
                                  menú lateral colapsado (como la propia) y sin lo de facturación; el menú del avatar pasa a la variante invitada;
                                  el logo y "Inicio" llevan al dashboard de ESA cuenta, no al de la propia
   Otros parámetros (para comparar contra Figma):
     ?cuenta=propia|con-cuentas|sin-asociadas   variante del menú del avatar en la cuenta propia (lo resuelve cuenta.js)
     ?avatar=abierto · ?sidebar=expandido|colapsado · ?popover=productos|catalogo · ?menu=abierto (mobile)
   El modo se decide al cargar: cambiar de cuenta es volver al hub y entrar a otra, así que recarga la página (igual que en el producto). */
(function () {
  "use strict";

  var body = document.body;
  var params = new URLSearchParams(window.location.search);
  var invitada = body.getAttribute("data-modo") === "invitada";

  /* ---------- Cuentas ajenas (mismos datos que el hub). Los Nº de cliente de Tomás y Camila son inventados. ---------- */
  var CUENTAS = {
    valeria: { nombre: "Valeria Cardozo", numero: "847213", rol: "Gestión técnica" },
    tomas: { nombre: "Tomás Herrera", numero: "531902", rol: "Administrador" },
    camila: { nombre: "Camila Torres", numero: "662458", rol: "Factura y pagos" }
  };
  var de = CUENTAS[params.get("de")] ? params.get("de") : "valeria";

  if (invitada) {
    var c = CUENTAS[de];
    var guest = document.querySelector(".pop-guest");
    if (guest) {
      guest.querySelector(".pop-name").textContent = c.nombre;
      var cli = guest.querySelector(".pop-client");
      cli.firstChild.nodeValue = "Nº cliente: " + c.numero;
      cli.querySelector("[data-copiar]").setAttribute("data-copiar", c.numero);
      guest.querySelector(".pop-role").textContent = "Tu rol: " + c.rol;
    }
    if (!body.hasAttribute("data-titulo-fijo")) document.title = "Dashboard · cuenta de " + c.nombre + " · Prototipo en código";

    /* Estando en la cuenta de otra persona, "inicio" es el dashboard de esa cuenta: el logo del header, el del menú (drawer mobile)
       y "Inicio" del sidebar no pueden llevar al dashboard propio. Se vuelve a cargar el de esta misma cuenta (sidebar por defecto). */
    var inicio = "dashboard.html?cuenta=invitada&de=" + de;
    var links = document.querySelectorAll(".header__logo, .sidebar__logo, .sidebar [data-nav=\"inicio\"], [data-ir-inicio]");
    for (var k = 0; k < links.length; k++) links[k].setAttribute("href", inicio);

    /* Con ?sidebar=expandido (Figma dibuja la invitada así), "Mis productos" llega desplegado. El clic programático no tiene que
       cerrar el menú del avatar si está abierto (?avatar=abierto): se frena antes de que llegue al document. */
    var desktop = window.matchMedia("(min-width: 1024px)");
    if (desktop.matches && params.get("sidebar") === "expandido" && !params.get("popover")) {
      var sec = document.querySelector('.sidebar [aria-controls="sub-productos"]');
      if (sec && sec.getAttribute("aria-expanded") !== "true") {
        sec.addEventListener("click", function (e) { e.stopPropagation(); }, { once: true });
        sec.click();
      }
    }
  }

  /* ---------- "Probar estados" ---------- */
  var actual = invitada ? de : "propia";
  var enlaces = document.querySelectorAll("[data-cuenta-demo]");
  for (var i = 0; i < enlaces.length; i++) {
    enlaces[i].setAttribute("aria-current", enlaces[i].getAttribute("data-cuenta-demo") === actual ? "true" : "false");
  }
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

  /* ---------- Aviso de lo que todavía no está armado (se elimina al completar el prototipo) ---------- */
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
