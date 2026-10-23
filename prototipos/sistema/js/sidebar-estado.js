/* Prototipo · Estado del menú lateral entre pantallas
   Si la persona expande o contrae el menú, así queda en todas las pantallas por las que navegue, hasta que lo cambie de nuevo
   (menu.js guarda el estado cuando alguien lo cambia; este archivo lo restaura antes de pintar, para que el menú no "salte").
   Se guarda en sessionStorage: vale para esta pestaña; una pestaña nueva arranca con el estado por defecto de cada pantalla (Dashboard: colapsado; Servicio y Lista de servicios: expandido).
   Un ?sidebar=expandido|colapsado en la URL manda sobre lo guardado (sirve para comparar contra Figma). */
(function () {
  "use strict";
  try {
    var v = new URLSearchParams(window.location.search).get("vista");   /* ?vista=header|sidebar: recortes para incrustar en el catálogo */
    if (v === "header" || v === "sidebar") document.body.setAttribute("data-vista", v);
  } catch (err0) { /* sin URLSearchParams */ }
  try {
    var p = new URLSearchParams(window.location.search).get("sidebar");
    var e = (p === "expandido" || p === "colapsado") ? p : window.sessionStorage.getItem("nubix-proto-sidebar");
    if (e === "expandido" || e === "colapsado") document.body.setAttribute("data-sidebar", e);
  } catch (err) { /* sin almacenamiento (ventana privada, etc.): arranca con el estado por defecto */ }
})();
