/* Prototipo · Menú de la cuenta (popover que se abre desde el avatar del header).
   Misma lógica que en los prototipos de Usuarios y Referidos, solo con la variante de cuenta propia
   (Figma: Header · Popover=Open). Teclado: ↓ en el avatar abre el menú y enfoca la primera opción;
   ↑ ↓ Inicio Fin recorren las opciones; Esc cierra y devuelve el foco al avatar.
   Parámetro de URL para comparar con Figma: ?avatar=abierto  arranca con el popover abierto. */
(function () {
  "use strict";

  var avatar = document.querySelector(".header__avatar");
  var pop = document.getElementById("account-pop");
  var estado = document.getElementById("estado");
  if (!avatar || !pop) return;

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

  /* Elegir una opción cierra el popover (todas avisan "fuera del alcance de este prototipo") */
  pop.addEventListener("click", function (e) {
    var copiar = e.target.closest("[data-copiar]");
    if (copiar) { copiarNumero(copiar); return; }
    if (e.target.closest("a.menu-item")) cerrar(true);
  });

  /* Copiar el Nº de cliente: el ícono pasa a "check" 1,5 s y se anuncia por lector de pantalla */
  var timerCopia;
  function copiarNumero(btn) {
    var n = btn.getAttribute("data-copiar");
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(n); } catch (err) { /* sin portapapeles: igual se da el aviso */ }
    var use = btn.querySelector("use");
    use.setAttribute("href", "#i-check");
    if (estado) {
      estado.textContent = "";
      window.setTimeout(function () { estado.textContent = "Número de cliente copiado."; }, 30);
    }
    window.clearTimeout(timerCopia);
    timerCopia = window.setTimeout(function () { use.setAttribute("href", "#i-content-copy"); }, 1500);
  }

  if (new URLSearchParams(window.location.search).get("avatar") === "abierto") abrir(false);
})();
