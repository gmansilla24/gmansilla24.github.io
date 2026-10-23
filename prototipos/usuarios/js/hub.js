/* Prototipo · Hub de selección de cuentas (Figma ALC: "Selección de cuentas · Página · Desktop / Mobile")
   Aparece cuando el usuario puede entrar como invitado a otras cuentas; va antes del dashboard.
   Dos contenidos (así se llaman en Figma):
     completo → 3 invitaciones pendientes + 3 cuentas con acceso
     mínimo   → 1 invitación pendiente  + 1 cuenta con acceso
   Parámetro de URL para comparar contra Figma:  ?contenido=completo|minimo   (por defecto: completo) */
(function () {
  "use strict";

  var body = document.body;
  var lista = document.getElementById("hub-list");
  var bannerTexto = document.getElementById("hub-banner-text");
  var bannerBtn = document.getElementById("hub-banner-btn");
  var toast = document.getElementById("toast");
  var params = new URLSearchParams(window.location.search);

  /* Cuentas ajenas a las que el usuario puede entrar. Los datos de Valeria Cardozo son los mismos que en
     "Asignado a otras cuentas" (Gestión técnica, sin soporte); Tomás y Camila salen de las pantallas del hub. */
  var CUENTAS = [
    { slug: "valeria", nombre: "Valeria Cardozo", email: "valeria.cardozo@example.com", foto: "assets/avatar-valeria.jpg", rol: "Gestión técnica", soporte: false },
    { slug: "tomas", nombre: "Tomás Herrera", email: "tomas.herrera@example.com", foto: "assets/avatar-tomas.jpg", rol: "Administrador", soporte: true },
    { slug: "camila", nombre: "Camila Torres", email: "camila.torres@example.com", foto: "assets/avatar-camila.jpg", rol: "Factura y pagos", soporte: false }
  ];
  var CONTENIDOS = {
    completo: { invitaciones: 3, cuentas: 3 },
    minimo: { invitaciones: 1, cuentas: 1 }
  };

  function icono(id, cls) { return '<svg class="icon ' + cls + '" aria-hidden="true"><use href="#' + id + '"/></svg>'; }

  function filaCuenta(c) {
    return '<li class="hub-row">' +
      '<div class="hub-who">' +
        '<img class="avatar" src="' + c.foto + '" alt="" width="32" height="32">' +
        '<div class="hub-info"><p class="hub-name">' + c.nombre + '</p><p class="hub-email">' + c.email + '</p></div>' +
      '</div>' +
      '<div class="hub-row__divider" aria-hidden="true"></div>' +
      /* Mobile: dos filas "etiqueta · valor" */
      '<dl class="hub-row__data">' +
        '<div><dt>Tu rol</dt><dd>' + c.rol + '</dd></div>' +
        '<div><dt>Acceso a soporte</dt><dd>' + (c.soporte ? "Sí" : "No") + '</dd></div>' +
      '</dl>' +
      /* Desktop: rol y estado del soporte a la izquierda del botón */
      '<div class="hub-row__side">' +
        '<div class="hub-row__status">' +
          '<p class="hub-row__role">Tu rol: <b>' + c.rol + '</b></p>' +
          '<p class="hub-row__support' + (c.soporte ? " is-on" : "") + '"><span class="hub-row__dot" aria-hidden="true"></span>' + (c.soporte ? "Soporte habilitado" : "Sin acceso a soporte") + '</p>' +
        '</div>' +
        '<a class="btn btn--sm btn--outline hub-row__btn" href="dashboard.html?cuenta=invitada&de=' + c.slug + '" aria-label="Ingresar a la cuenta de ' + c.nombre + '">' +
          'Ingresar' + icono("i-chevron-right-16", "icon--16") +
        '</a>' +
      '</div>' +
    '</li>';
  }

  function dibujar(nombre) {
    var c = CONTENIDOS[nombre] || CONTENIDOS.completo;
    body.setAttribute("data-contenido", CONTENIDOS[nombre] ? nombre : "completo");

    var n = c.invitaciones;
    bannerTexto.innerHTML = "Tienes <b>" + n + (n === 1 ? " invitación pendiente" : " invitaciones pendientes") + "</b>.";
    bannerBtn.innerHTML = (n === 1 ? "Responder invitación" : "Responder invitaciones") + icono("i-chevron-right-16", "icon--16");

    lista.innerHTML = CUENTAS.slice(0, c.cuentas).map(filaCuenta).join("");

    var botones = document.querySelectorAll("#probar-panel button[data-contenido]");
    for (var i = 0; i < botones.length; i++) {
      botones[i].setAttribute("aria-pressed", botones[i].getAttribute("data-contenido") === body.getAttribute("data-contenido") ? "true" : "false");
    }
  }

  /* ---------- Aviso de lo que todavía no está armado (se elimina al completar el prototipo) ---------- */
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

  /* ---------- "Probar estados" ---------- */
  var probar = document.getElementById("probar");
  var toggle = document.getElementById("probar-toggle");
  var panel = document.getElementById("probar-panel");
  function abrirPanel() { panel.hidden = false; toggle.setAttribute("aria-expanded", "true"); }
  function cerrarPanel() { panel.hidden = true; toggle.setAttribute("aria-expanded", "false"); }
  toggle.addEventListener("click", function () { if (panel.hidden) abrirPanel(); else cerrarPanel(); });
  panel.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-contenido]");
    if (!b) return;
    dibujar(b.getAttribute("data-contenido"));
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panel.hidden) { cerrarPanel(); toggle.focus(); }
  });
  document.addEventListener("click", function (e) {
    if (!panel.hidden && !probar.contains(e.target)) cerrarPanel();
  });

  dibujar(params.get("contenido"));
})();
