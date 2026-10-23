/* Prototipo · Menú de la cuenta (popover que se abre desde el avatar del header)
   Variantes (Figma: Popover · Cuenta, node 678:4, trae tres): "propia", "sin-asociadas" (sin la opción "Usuarios y permisos")
   e "invitada". La cuarta, "con-cuentas", NO está en Figma: es la propia más "Cambiar cuenta", que lleva al hub para
   poder entrar a otra cuenta (el diseñador la pidió: sin ella, quien tiene cuentas ajenas no podría volver al hub).
   Regla automática (app.js calcula body[data-asociada] y body[data-ajenas], y se actualiza solo):
     sin integrantes ni invitaciones enviadas, y sin cuentas ajenas aceptadas  → "sin-asociadas"   (definida por el diseñador)
     alguna cuenta ajena aceptada (estado "activo")                            → "con-cuentas"
     el resto (tiene integrantes o invitaciones, pero ninguna cuenta ajena)    → "propia"
   "invitada" (estar dentro de la cuenta de otra persona) se usa recién cuando se hagan esas pantallas: por ahora solo se
   ve forzándola con ?cuenta=invitada o desde "Probar estados".

   Parámetros de URL, para comparar contra Figma:
     ?cuenta=propia|con-cuentas|sin-asociadas|invitada   variante del menú
     ?avatar=abierto                          arranca con el popover abierto */
(function () {
  "use strict";

  var body = document.body;
  var avatar = document.querySelector(".header__avatar");
  var pop = document.getElementById("account-pop");
  var estado = document.getElementById("estado");
  var params = new URLSearchParams(window.location.search);
  var TIPOS = ["propia", "con-cuentas", "sin-asociadas", "invitada"];

  function abierto() { return !pop.hidden; }
  function visibles() {
    return Array.prototype.slice.call(pop.querySelectorAll("a.menu-item, button.pop-copy")).filter(function (n) { return n.offsetParent !== null; });
  }
  function abrir(enfocarPrimero) {
    pop.hidden = false;
    avatar.setAttribute("aria-expanded", "true");
    if (enfocarPrimero) { var f = visibles(); if (f[0]) f[0].focus(); }
  }
  function cerrar(devolverFoco) {
    if (!abierto()) return;
    pop.hidden = true;
    avatar.setAttribute("aria-expanded", "false");
    if (devolverFoco) avatar.focus({ preventScroll: true });
  }
  var forzado = null;                       /* ?cuenta= o "Probar estados": pisa la regla automática */
  var fijo = body.getAttribute("data-tipo-fijo");   /* el dashboard de una cuenta invitada fija "invitada": ahí no corre la regla automática */
  function aplicarTipo() {
    var auto = body.getAttribute("data-asociada") === "no" ? "sin-asociadas"
      : body.getAttribute("data-ajenas") === "si" ? "con-cuentas" : "propia";
    body.setAttribute("data-tipo-cuenta", forzado || fijo || auto);
  }
  function setTipo(t) {
    if (t === "auto") forzado = null;
    else if (TIPOS.indexOf(t) >= 0) forzado = t;
    else return;
    aplicarTipo();
  }
  new MutationObserver(aplicarTipo).observe(body, { attributes: true, attributeFilter: ["data-asociada", "data-ajenas"] });

  avatar.addEventListener("click", function () { if (abierto()) cerrar(false); else abrir(false); });
  avatar.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); abrir(true); }
  });
  pop.addEventListener("keydown", function (e) {
    var f = visibles(), i = f.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); f[Math.min(f.length - 1, i + 1)].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (i <= 0) avatar.focus(); else f[i - 1].focus(); }
    else if (e.key === "Home") { e.preventDefault(); f[0].focus(); }
    else if (e.key === "End") { e.preventDefault(); f[f.length - 1].focus(); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && abierto()) { e.stopPropagation(); cerrar(true); }
  }, true);
  /* Clic afuera, o foco que sale del popover y del avatar */
  function afuera(n) { return !pop.contains(n) && !avatar.contains(n) && !n.closest("#probar"); }
  document.addEventListener("click", function (e) { if (abierto() && afuera(e.target)) cerrar(false); });
  document.addEventListener("focusin", function (e) { if (abierto() && afuera(e.target)) cerrar(false); });

  /* Elegir una opción cierra el popover. "Cambiar cuenta" navega al hub; "Usuarios y permisos" es esta misma pantalla;
     el resto todavía no navega y avisa con el toast de "pendiente" */
  pop.addEventListener("click", function (e) {
    var copiar = e.target.closest("[data-copiar]");
    if (copiar) { copiarNumero(copiar); return; }
    var item = e.target.closest("a.menu-item");
    if (!item) return;
    if (item.hasAttribute("data-pop-usuarios") && item.getAttribute("href") === "#") {   /* con href real (desde el dashboard) navega */
      e.preventDefault();
      /* Ya estamos en "Usuarios y permisos": solo se vuelve a la lista si estábamos en "Agregar" o "Editar" */
      if (body.getAttribute("data-vista") && body.getAttribute("data-vista") !== "lista") window.location.hash = "";
    }
    cerrar(true);
  });

  /* Copiar el Nº de cliente: el ícono pasa a "check" 1,5 s y se anuncia por lector de pantalla */
  var timerCopia;
  function copiarNumero(btn) {
    var n = btn.getAttribute("data-copiar");
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(n); } catch (err) { /* sin portapapeles: igual se da el aviso */ }
    var use = btn.querySelector("use");
    use.setAttribute("href", "#i-check");
    estado.textContent = "";
    window.setTimeout(function () { estado.textContent = "Número de cliente copiado."; }, 30);
    window.clearTimeout(timerCopia);
    timerCopia = window.setTimeout(function () { use.setAttribute("href", "#i-content-copy"); }, 1500);
  }

  /* ---------- "Probar estados" ---------- */
  var panelProbar = document.getElementById("probar-panel");
  panelProbar.addEventListener("click", function (e) {
    var b = e.target.closest("[data-tipo-demo]");
    if (!b) return;
    setTipo(b.getAttribute("data-tipo-demo"));
    var t = document.getElementById("probar-toggle");
    if (!panelProbar.hidden) t.click();               /* se cierra el panel para ver el popover */
    abrir(false);
  });

  /* ---------- Arranque ---------- */
  aplicarTipo();
  setTipo(params.get("cuenta"));
  if (params.get("avatar") === "abierto") abrir(false);
})();
