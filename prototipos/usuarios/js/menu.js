/* Prototipo · Menú lateral (sidebar)
   Desktop (≥1024): columna fija, colapsada (56) o expandida (248) con el botón del borde.
     · Colapsado: solo íconos. Al pasar el mouse (o enfocar con teclado) aparece un tooltip con el nombre de la sección.
       Al hacer clic en una sección con subítems se abre un popover para elegir sin expandir el sidebar.
     · Expandido: lista completa; las secciones con subítems se despliegan como acordeón (una a la vez).
   Mobile (<1024): el botón de hamburguesa del header abre un drawer con la lista completa, y el ⋮ del título abre el drawer
   "Secciones" con el menú contextual de Mi cuenta (Datos personales, Seguridad y accesos, …).

   Parámetros de URL, para comparar contra Figma:
     ?sidebar=expandido        arranca expandido (desktop)
     ?popover=productos|catalogo   arranca con el popover de esa sección abierto (desktop colapsado)
     ?menu=abierto             arranca con el drawer del menú principal abierto (mobile)
     ?menu=secciones           arranca con el drawer "Secciones" abierto (mobile)
     ?nav=inicio|web-hosting|flowmail   marca ese ítem como seleccionado (las pantallas de Figma lo muestran así)

   El estado vive en memoria: al recargar vuelve a colapsado, como en las pantallas de Figma. */
(function () {
  "use strict";

  var body = document.body;
  var sidebar = document.getElementById("sidebar");
  var toggle = document.getElementById("sidebar-toggle");
  var burger = document.querySelector(".header__menu");
  var cerrar = document.getElementById("sidebar-close");
  var scrim = document.getElementById("scrim");
  var tip = document.getElementById("tooltip");
  var tipTexto = tip.querySelector(".tooltip__text");
  var secciones = Array.prototype.slice.call(sidebar.querySelectorAll(".menu-item--section"));
  var desktop = window.matchMedia("(min-width: 1024px)");
  var params = new URLSearchParams(window.location.search);

  function colapsado() { return desktop.matches && body.getAttribute("data-sidebar") !== "expandido"; }
  function subDe(btn) { return document.getElementById(btn.getAttribute("aria-controls")); }
  function seccionDe(el) { return el.closest(".has-sub"); }
  function btnDe(li) { return li.querySelector(".menu-item--section"); }
  function enlaces(sub) { return Array.prototype.slice.call(sub.querySelectorAll(".sub-item")); }

  /* ---------- Tooltip (solo con el sidebar colapsado) ---------- */
  function ocultarTip() { tip.classList.remove("is-visible"); }
  function mostrarTip(el) {
    if (!colapsado()) return;
    if (el.getAttribute("aria-expanded") === "true") return;      /* con el popover abierto, el título ya dice qué sección es */
    var label = el.querySelector(".menu-item__label");
    if (!label) return;
    tipTexto.textContent = label.textContent;
    var r = el.getBoundingClientRect();
    var sb = sidebar.getBoundingClientRect();
    tip.style.left = (sb.right + 4) + "px";
    tip.style.top = Math.round(r.top + r.height / 2 - tip.offsetHeight / 2) + "px";
    tip.classList.add("is-visible");
  }
  var lista = document.getElementById("sidebar-list");
  lista.addEventListener("mouseover", function (e) {
    var el = e.target.closest(".menu-item");
    if (el && lista.contains(el)) mostrarTip(el);
  });
  lista.addEventListener("mouseout", function (e) {
    var el = e.target.closest(".menu-item");
    if (el && !el.contains(e.relatedTarget)) ocultarTip();
  });
  lista.addEventListener("focusin", function (e) {
    var el = e.target.closest(".menu-item");
    if (el && el.matches(":focus-visible")) mostrarTip(el); else ocultarTip();
  });
  lista.addEventListener("focusout", ocultarTip);
  lista.addEventListener("scroll", ocultarTip);

  /* ---------- Subítems: popover (colapsado) o acordeón (expandido / drawer) ---------- */
  function posicionar(btn, sub) {
    var r = btn.getBoundingClientRect();
    var sb = sidebar.getBoundingClientRect();
    var alto = sub.offsetHeight;
    sub.style.left = (sb.right + 8) + "px";
    sub.style.top = Math.max(8, Math.min(r.top, window.innerHeight - alto - 8)) + "px";
  }
  function abrirSub(btn, enfocarPrimero) {
    cerrarSubs(btn);
    var sub = subDe(btn);
    btn.setAttribute("aria-expanded", "true");
    sub.hidden = false;
    if (colapsado()) { ocultarTip(); posicionar(btn, sub); } else { sub.style.left = sub.style.top = ""; }
    if (enfocarPrimero) { var l = enlaces(sub)[0]; if (l) l.focus(); }
  }
  function cerrarSub(btn) {
    btn.setAttribute("aria-expanded", "false");
    subDe(btn).hidden = true;
  }
  function cerrarSubs(salvo) {
    secciones.forEach(function (b) { if (b !== salvo) cerrarSub(b); });
  }
  /* Con un ítem seleccionado dentro de una sección, el acordeón arranca abierto en esa sección */
  function abrirActual() {
    secciones.some(function (b) {
      if (b.classList.contains("is-current")) { abrirSub(b, false); return true; }
      return false;
    });
  }

  secciones.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (btn.getAttribute("aria-expanded") === "true") cerrarSub(btn); else abrirSub(btn, false);
    });
    btn.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || (e.key === "ArrowRight" && colapsado())) {
        e.preventDefault();
        abrirSub(btn, true);
      }
    });
  });
  secciones.forEach(function (btn) {
    var sub = subDe(btn);
    sub.addEventListener("keydown", function (e) {
      var ls = enlaces(sub);
      var i = ls.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); ls[Math.min(ls.length - 1, i + 1)].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (i <= 0) btn.focus(); else ls[i - 1].focus(); }
      else if (e.key === "Home") { e.preventDefault(); ls[0].focus(); }
      else if (e.key === "End") { e.preventDefault(); ls[ls.length - 1].focus(); }
      else if (e.key === "Escape" && colapsado()) { e.preventDefault(); e.stopPropagation(); cerrarSub(btn); btn.focus(); }
    });
    /* Elegir un subítem en el popover lo cierra (en el acordeón queda abierto) */
    sub.addEventListener("click", function (e) {
      if (colapsado() && e.target.closest(".sub-item")) { cerrarSub(btn); ocultarTip(); }
    });
  });
  /* Popover: se cierra con un clic afuera, o si el foco sale de la sección */
  document.addEventListener("click", function (e) {
    if (colapsado() && !e.target.closest(".has-sub")) cerrarSubs(null);
  });
  sidebar.addEventListener("focusout", function (e) {
    if (!colapsado() || !e.relatedTarget) return;
    var li = e.target.closest(".has-sub");
    if (li && !li.contains(e.relatedTarget)) cerrarSub(btnDe(li));
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (tipoDrawer()) { cerrarDrawer(true); return; }
    if (colapsado()) {
      var abierta = secciones.filter(function (b) { return b.getAttribute("aria-expanded") === "true"; })[0];
      if (abierta) { cerrarSub(abierta); abierta.focus(); }
    }
  });

  /* ---------- Selección (demo: la página actual no está en este menú) ---------- */
  function marcar(clave) {
    Array.prototype.forEach.call(sidebar.querySelectorAll("[aria-current]"), function (el) { el.removeAttribute("aria-current"); });
    secciones.forEach(function (b) { b.classList.remove("is-current"); });
    if (!clave) return;
    var el = sidebar.querySelector('[data-nav="' + clave + '"]');
    if (!el) return;
    el.setAttribute("aria-current", "page");
    var li = seccionDe(el);
    if (li) btnDe(li).classList.add("is-current");
  }

  /* ---------- Desktop: expandir / contraer ---------- */
  function setSidebar(estado) {
    cerrarSubs(null);
    ocultarTip();
    body.setAttribute("data-sidebar", estado);
    var exp = estado === "expandido";
    toggle.setAttribute("aria-expanded", String(exp));
    toggle.setAttribute("aria-label", exp ? "Contraer menú lateral" : "Expandir menú lateral");
    if (exp) abrirActual();
  }
  /* Lo que la persona elige (botón del menú o "Probar estados") se recuerda para las demás pantallas: ver sidebar-estado.js */
  function recordar(estado) {
    try { window.sessionStorage.setItem("nubix-proto-sidebar", estado); } catch (err) { /* sin almacenamiento: no se recuerda */ }
  }
  toggle.addEventListener("click", function () {
    var nuevo = body.getAttribute("data-sidebar") === "expandido" ? "colapsado" : "expandido";
    setSidebar(nuevo);
    recordar(nuevo);
  });

  /* ---------- Mobile: drawers ("abierto" = menú principal desde la hamburguesa · "secciones" = menú contextual desde el ⋮ del título) ---------- */
  /* El resto de la página queda inerte mientras un drawer está abierto: el foco no se escapa y el lector de pantalla no lo lee */
  var fondo = [document.querySelector(".app-header"), document.querySelector(".app-body"), document.querySelector(".dash")];
  var drawerCtx = document.getElementById("drawer-secciones");
  var cerrarCtx = document.getElementById("drawer-secciones-close");
  var disparadores = Array.prototype.slice.call(document.querySelectorAll("[data-secciones]"));
  var disparador = null;                       /* el ⋮ que abrió "Secciones", para devolverle el foco */
  var menuCtx = document.querySelector(".contextual ul");
  if (menuCtx && drawerCtx) drawerCtx.querySelector(".drawer-ctx__body").appendChild(menuCtx.cloneNode(true));   /* el dashboard no tiene menú contextual ni drawer "Secciones" */

  function tipoDrawer() { return body.getAttribute("data-drawer"); }
  function abrirDrawer() {
    body.setAttribute("data-drawer", "abierto");
    burger.setAttribute("aria-expanded", "true");
    fondo.forEach(function (n) { if (n) n.inert = true; });
    abrirActual();
    cerrar.focus({ preventScroll: true });
  }
  function abrirSecciones(origen) {
    disparador = origen || null;
    body.setAttribute("data-drawer", "secciones");
    if (disparador) disparador.setAttribute("aria-expanded", "true");
    fondo.forEach(function (n) { if (n) n.inert = true; });
    cerrarCtx.focus({ preventScroll: true });
  }
  function cerrarDrawer(devolverFoco) {
    var tipo = tipoDrawer();
    if (!tipo) return;
    body.removeAttribute("data-drawer");
    fondo.forEach(function (n) { if (n) n.inert = false; });
    burger.setAttribute("aria-expanded", "false");
    disparadores.forEach(function (d) { d.removeAttribute("aria-expanded"); });
    if (devolverFoco) {
      var vuelta = tipo === "secciones" ? disparador : burger;
      if (vuelta) vuelta.focus({ preventScroll: true });
    }
  }
  /* Tab y Shift+Tab dan la vuelta dentro del drawer en vez de salir al navegador */
  function atraparTab(caja, tipo) {
    if (!caja) return;
    caja.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || tipoDrawer() !== tipo) return;
      var f = Array.prototype.slice.call(caja.querySelectorAll("button, a[href]")).filter(function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var primero = f[0], ultimo = f[f.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    });
  }
  atraparTab(sidebar, "abierto");
  atraparTab(drawerCtx, "secciones");
  burger.addEventListener("click", abrirDrawer);
  disparadores.forEach(function (d) { d.addEventListener("click", function () { abrirSecciones(d); }); });
  cerrar.addEventListener("click", function () { cerrarDrawer(true); });
  if (cerrarCtx) cerrarCtx.addEventListener("click", function () { cerrarDrawer(true); });
  scrim.addEventListener("click", function () { cerrarDrawer(true); });
  /* Elegir un ítem en el drawer también lo cierra (los enlaces todavía no navegan: solo avisan) */
  sidebar.addEventListener("click", function (e) {
    if (!desktop.matches && e.target.closest("a.menu-item, a.sub-item")) cerrarDrawer(false);
  });
  if (drawerCtx) drawerCtx.addEventListener("click", function (e) {
    var a = e.target.closest("a.menu-item");
    if (!a) return;
    e.preventDefault();                          /* href="#" no debe tocar el hash de la página */
    cerrarDrawer(true);
  });
  /* Al cruzar el breakpoint se limpia lo que sobra del otro layout */
  function alCambiarLayout() {
    cerrarDrawer(false);
    cerrarSubs(null);
    ocultarTip();
    if (!desktop.matches) abrirActual();
  }
  if (desktop.addEventListener) desktop.addEventListener("change", alCambiarLayout);
  else if (desktop.addListener) desktop.addListener(alCambiarLayout);
  window.addEventListener("resize", function () { if (colapsado()) cerrarSubs(null); });

  /* ---------- "Probar estados" ---------- */
  var panelProbar = document.getElementById("probar-panel");
  function cerrarPanelProbar() {
    if (panelProbar && !panelProbar.hidden) document.getElementById("probar-toggle").click();
  }
  if (panelProbar) panelProbar.addEventListener("click", function (e) {
    var b = e.target.closest("[data-menu]");
    if (b) {
      var m = b.getAttribute("data-menu");
      cerrarDrawer(false);
      if (m === "colapsado" || m === "expandido") { setSidebar(m); recordar(m); }
      if (m === "popover") { setSidebar("colapsado"); if (desktop.matches) { cerrarPanelProbar(); abrirSub(secciones[0], false); } }
      if (m === "drawer") { cerrarPanelProbar(); if (!desktop.matches) abrirDrawer(); }
      if (m === "secciones") {
        cerrarPanelProbar();
        var visible = disparadores.filter(function (d) { return d.offsetParent !== null; })[0];
        if (!desktop.matches && visible) abrirSecciones(visible);
      }
      return;
    }
    b = e.target.closest("[data-nav-demo]");
    if (b) {
      marcar(b.getAttribute("data-nav-demo"));
      cerrarSubs(null);
      if (!colapsado()) abrirActual();
    }
  });

  /* ---------- Arranque ---------- */
  marcar(params.get("nav") || body.getAttribute("data-nav-actual"));   /* data-nav-actual: la página que está abierta (el dashboard es "inicio") */
  /* Expandido por la URL, o porque así lo dejó la persona en otra pantalla (sidebar-estado.js ya puso el atributo): se abre la sección actual, como al expandir */
  if (params.get("sidebar") === "expandido" || (!params.get("sidebar") && body.getAttribute("data-sidebar") === "expandido")) setSidebar("expandido");
  var pop = params.get("popover");
  if (pop && desktop.matches) {
    var destino = document.getElementById(pop === "catalogo" ? "sub-catalogo" : "sub-productos");
    if (destino) abrirSub(sidebar.querySelector('[aria-controls="' + destino.id + '"]'), false);
  }
  if (params.get("menu") === "abierto" && !desktop.matches) abrirDrawer();
  if (params.get("menu") === "secciones" && !desktop.matches) {
    var primero = disparadores.filter(function (d) { return d.offsetParent !== null; })[0];
    if (primero) abrirSecciones(primero);
  }
  if (!desktop.matches) abrirActual();
})();
