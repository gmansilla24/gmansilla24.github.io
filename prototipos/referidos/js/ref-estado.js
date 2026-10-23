/* Prototipo · Referidos · Estado del flujo (compartido por el dashboard y "Referidos y recompensas")
   Figma resuelve el flujo con pantallas duplicadas ("Home con compras" ×3, "Cupón generado" ×4…) porque no guarda estado.
   En código es un único estado, guardado en sessionStorage (vale para esta pestaña), con cinco etapas:
     sin-compras   Dashboard "Sin compras" · "Recomendar y ganar · Sin servicio activo" · "Actividad · Vacío"
     con-compras   Dashboard "Con compras" · "Servicio activo, cupón sin generar"
     cupon         Cupón generado (todavía sin referidos) · "Actividad · Vacío (con cupón)"
     referidos     Los referidos se registraron y compraron · "Actividad · Con datos"
     cobrado       Después de cobrar (saldo en USD 0)
   Qué hace avanzar de etapa: "Elegir servicio" (compra simulada, js/compra.js: lleva al dashboard con servicios) o "Probar estados",
   "Generar cupón"; de ahí en adelante (referidos, cobro) las etapas se eligen en "Probar estados".
   ?etapa=… en la URL manda sobre lo guardado (sirve para comparar contra Figma). Se aplica antes de pintar, igual que sidebar-estado.js. */
(function () {
  "use strict";
  var KEY = "nubix-proto-referidos";
  var ETAPAS = ["sin-compras", "con-compras", "cupon", "referidos", "cobrado"];
  var DEFECTO = { etapa: "sin-compras", cupon: "mansi2026" };
  var estado = { etapa: DEFECTO.etapa, cupon: DEFECTO.cupon };

  try {
    var g = JSON.parse(window.sessionStorage.getItem(KEY) || "null");
    if (g && ETAPAS.indexOf(g.etapa) >= 0) { estado.etapa = g.etapa; if (typeof g.cupon === "string" && g.cupon) estado.cupon = g.cupon; }
  } catch (e) { /* sin almacenamiento: arranca de cero */ }
  var p = new URLSearchParams(window.location.search).get("etapa");
  if (ETAPAS.indexOf(p) >= 0) estado.etapa = p;

  function guardar() { try { window.sessionStorage.setItem(KEY, JSON.stringify(estado)); } catch (e) { /* idem */ } }
  function pintar() { document.body.setAttribute("data-etapa", estado.etapa); }
  pintar();

  window.NubixRef = {
    ETAPAS: ETAPAS,
    etapa: function () { return estado.etapa; },
    /* El cupón es la parte editable del link: https://tudominio.com/regalo-<cupón> */
    cupon: function () { return estado.cupon; },
    link: function () { return "https://tudominio.com/regalo-" + estado.cupon; },
    setCupon: function (c) { estado.cupon = c; guardar(); document.dispatchEvent(new CustomEvent("ref:cupon")); },
    setEtapa: function (e) {
      if (ETAPAS.indexOf(e) < 0 || e === estado.etapa) return;
      estado.etapa = e; guardar(); pintar();
      document.dispatchEvent(new CustomEvent("ref:etapa", { detail: e }));
    }
  };
})();
