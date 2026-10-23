/* Prototipo · Sistema de diseño Nubix
   Interacciones de los componentes (para verlos funcionar desde el navegador) y del listado de servicios.
   Todo en memoria, datos inventados.
     · [data-pending]            aviso "fuera del alcance de este prototipo" (se elimina al completar el prototipo)
     · [data-acc]                acordeón / tarjeta colapsable (aria-expanded + hidden)
     · [role="tablist"]          pestañas y pill tabs (flechas, Home, End)
     · .select__control          el color de "placeholder" sigue al valor elegido
     · #svc-list                 listado de servicios: búsqueda, orden, cantidad por página y paginación
     · [data-toast]              dispara un toast de ejemplo en el catálogo
     · .fb__close                cierra el alert / toast de ejemplo
*/
(function () {
  "use strict";

  /* ---------- Aviso de lo que todavía no está armado ---------- */
  var toast = document.getElementById("toast");
  var timer;
  function avisar(msg) {
    if (!toast) return;
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
  var ptoggle = document.getElementById("probar-toggle");
  var ppanel = document.getElementById("probar-panel");
  if (probar && ptoggle && ppanel) {
    var abrirP = function () { ppanel.hidden = false; ptoggle.setAttribute("aria-expanded", "true"); };
    var cerrarP = function () { ppanel.hidden = true; ptoggle.setAttribute("aria-expanded", "false"); };
    ptoggle.addEventListener("click", function () { if (ppanel.hidden) abrirP(); else cerrarP(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !ppanel.hidden) { cerrarP(); ptoggle.focus(); } });
    document.addEventListener("click", function (e) { if (!ppanel.hidden && !probar.contains(e.target)) cerrarP(); });
  }

  /* ---------- Acordeón / tarjeta colapsable ---------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-acc]");
    if (!b) return;
    var abierto = b.getAttribute("aria-expanded") === "true";
    var cuerpo = document.getElementById(b.getAttribute("aria-controls"));
    if (!cuerpo) return;
    b.setAttribute("aria-expanded", abierto ? "false" : "true");
    cuerpo.hidden = abierto;
  });

  /* ---------- Pestañas (tabs y pills) ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[role="tablist"]'), function (lista) {
    var tabs = function () { return Array.prototype.filter.call(lista.querySelectorAll('[role="tab"]'), function (t) { return !t.disabled; }); };
    function elegir(t, enfocar) {
      var demo = lista.hasAttribute("data-solo-visual");
      if (t.hasAttribute("data-pending") && !demo) {                /* las pestañas que todavía no existen solo avisan: con flechas se mueve el foco, con Enter/clic sale el aviso */
        if (enfocar) { tabs().forEach(function (x) { x.tabIndex = x === t ? 0 : -1; }); t.focus(); }
        return;
      }
      tabs().forEach(function (x) {
        var on = x === t;
        x.setAttribute("aria-selected", on ? "true" : "false");
        x.tabIndex = on ? 0 : -1;
        var p = x.getAttribute("aria-controls") && document.getElementById(x.getAttribute("aria-controls"));
        if (p && !demo) p.hidden = !on;
      });
      if (enfocar) t.focus();
    }
    lista.addEventListener("click", function (e) {
      var t = e.target.closest('[role="tab"]');
      if (t && !t.disabled && lista.contains(t)) elegir(t, false);
    });
    lista.addEventListener("keydown", function (e) {
      var t = e.target.closest('[role="tab"]');
      if (!t) return;
      var f = tabs(), i = f.indexOf(t), n = null;
      if (e.key === "ArrowRight") n = f[(i + 1) % f.length];
      else if (e.key === "ArrowLeft") n = f[(i - 1 + f.length) % f.length];
      else if (e.key === "Home") n = f[0];
      else if (e.key === "End") n = f[f.length - 1];
      if (n) { e.preventDefault(); elegir(n, true); }
    });
  });

  /* ---------- Catálogo: menú del encabezado (menos de 1100 px) ---------- */
  (function () {
    var btn = document.getElementById("ds-menu-btn"), menu = document.getElementById("ds-menu");
    if (!btn || !menu) return;
    function abrir(si, devolverFoco) {
      btn.setAttribute("aria-expanded", si ? "true" : "false");
      menu.hidden = !si;
      if (!si && devolverFoco) btn.focus();
    }
    btn.addEventListener("click", function () { abrir(menu.hidden, false); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) abrir(false, false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) abrir(false, true); });
    document.addEventListener("click", function (e) { if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) abrir(false, false); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1100 && !menu.hidden) abrir(false, false); });
  })();

  /* ---------- Selects: placeholder ---------- */
  function marcarSelect(s) { s.classList.toggle("is-placeholder", s.value === ""); }
  Array.prototype.forEach.call(document.querySelectorAll(".select__control"), function (s) {
    marcarSelect(s);
    s.addEventListener("change", function () { marcarSelect(s); });
  });

  /* ---------- Catálogo: toast de ejemplo y cierre de alerts ---------- */
  document.addEventListener("click", function (e) {
    var d = e.target.closest("[data-toast]");
    if (d) {
      var t = document.getElementById(d.getAttribute("data-toast"));
      if (t) {
        t.hidden = false;
        window.clearTimeout(t._t);
        t._t = window.setTimeout(function () { t.hidden = true; }, 4000);
      }
      return;
    }
    var c = e.target.closest(".fb__close");
    if (c) { var fb = c.closest(".fb"); if (fb) fb.hidden = true; }
  });
  document.addEventListener("click", function (e) {
    var r = e.target.closest("[data-restaurar]");
    if (!r) return;
    var dest = document.getElementById(r.getAttribute("data-restaurar"));
    if (dest) Array.prototype.forEach.call(dest.querySelectorAll(".fb"), function (f) { f.hidden = false; });
  });


  /* ---------- Catálogo: checkbox indeterminado y tabla de contenidos ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-indet]"), function (c) { c.indeterminate = true; });
  var toc = document.querySelector(".ds-toc");
  if (toc && "IntersectionObserver" in window) {
    var enlacesToc = Array.prototype.slice.call(toc.querySelectorAll("a"));
    var porId = {};
    enlacesToc.forEach(function (a) { porId[a.getAttribute("href").slice(1)] = a; });
    var visibles = {};
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { visibles[e.target.id] = e.isIntersecting; });
      var primero = Object.keys(porId).filter(function (id) { return visibles[id]; })[0];
      enlacesToc.forEach(function (a) { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
      if (primero) { porId[primero].classList.add("is-active"); porId[primero].setAttribute("aria-current", "true"); }
    }, { rootMargin: "-72px 0px -60% 0px" });
    Object.keys(porId).forEach(function (id) { var s = document.getElementById(id); if (s) obs.observe(s); });
  }

  /* ---------- Listado de servicios ---------- */
  var cont = document.getElementById("svc-list");
  if (!cont) return;

  var SERVICIOS = [
    { id: "482917", nombre: "Servidor de base de datos", plan: "Corporativo", so: "WINDOWS", vence: "15/07/2026", venceTxt: "Venció el", critico: true, estado: "suspendido", correos: false, addons: [["Cloudflare", "disponible"]] },
    { id: "507316", nombre: "Sitio institucional", plan: "Corporativo", so: "LINUX", vence: "14/11/2026", venceTxt: "Vence el", estado: "activo", correos: true, addons: [["Backup diario", "disponible"], ["WordPress Stage", "suspendido"], ["Cloudflare", "disponible"], ["Reportes de correo", "disponible"]] },
    { id: "519204", nombre: "Correo empresarial", plan: "Esencial", so: "LINUX", vence: "09/12/2026", venceTxt: "Vence el", estado: "activo", correos: false, addons: [["Backup diario", "disponible"], ["WordPress Stage", "disponible"], ["Cloudflare", "disponible"]] },
    { id: "530781", nombre: "Tienda online", plan: "Inicial + Correos", so: "LINUX", vence: "18/10/2026", venceTxt: "Vence el", critico: true, estado: "activo", correos: true, addons: [["Backup diario", "activo"], ["WordPress Stage", "disponible"], ["Cloudflare", "disponible"], ["Reportes de correo", "disponible"]] },
    { id: "544630", nombre: "Landing de campaña", plan: "Impulso", so: "LINUX", vence: "05/01/2027", venceTxt: "Vence el", estado: "activo", correos: true, addons: [["Backup diario", "activo"], ["WordPress Stage", "disponible"], ["Cloudflare", "activo"], ["Reportes de correo", "disponible"]] },
    { id: "551092", nombre: "Blog de recetas", plan: "Inicial", so: "LINUX", vence: "22/02/2027", venceTxt: "Vence el", estado: "activo", correos: false, addons: [["Backup diario", "disponible"], ["WordPress Stage", "disponible"], ["Cloudflare", "activo"]] },
    { id: "563318", nombre: "Estudio contable", plan: "Esencial + Correos", so: "WINDOWS", vence: "30/03/2027", venceTxt: "Vence el", estado: "activo", correos: true, addons: [["Backup diario", "activo"], ["Cloudflare", "disponible"], ["Reportes de correo", "activo"]] },
    { id: "572845", nombre: "Portfolio fotográfico", plan: "Impulso", so: "LINUX", vence: "11/04/2027", venceTxt: "Vence el", estado: "activo", correos: false, addons: [["Backup diario", "disponible"], ["WordPress Stage", "activo"], ["Cloudflare", "disponible"]] },
    { id: "586109", nombre: "Club de lectura", plan: "Inicial", so: "LINUX", vence: "02/06/2027", venceTxt: "Vence el", estado: "activo", correos: false, addons: [["Backup diario", "disponible"], ["Cloudflare", "disponible"]] },
    { id: "598467", nombre: "Academia de idiomas", plan: "Corporativo + Correos", so: "LINUX", vence: "19/08/2027", venceTxt: "Vence el", estado: "activo", correos: true, addons: [["Backup diario", "activo"], ["WordPress Stage", "disponible"], ["Cloudflare", "activo"], ["Reportes de correo", "disponible"]] },
    { id: "603921", nombre: "Tienda de bicicletas", plan: "Esencial", so: "LINUX", vence: "07/09/2027", venceTxt: "Vence el", estado: "activo", correos: false, addons: [["Backup diario", "disponible"], ["WordPress Stage", "disponible"], ["Cloudflare", "disponible"]] },
    { id: "617203", nombre: "Revista digital", plan: "Impulso + Correos", so: "WINDOWS", vence: "28/11/2027", venceTxt: "Vence el", estado: "activo", correos: true, addons: [["Backup diario", "disponible"], ["WordPress Stage", "disponible"], ["Cloudflare", "disponible"], ["Reportes de correo", "disponible"]] }
  ];
  var ADDON_ETIQUETA = { disponible: ["Disponible", "info", "Contratar"], activo: ["Activo", "success", "Gestionar"], suspendido: ["Suspendido", "warning", "Gestionar"] };

  var foot = document.getElementById("svc-foot");
  var rango = document.getElementById("svc-rango");
  var info = document.getElementById("svc-pagina");
  var vacio = document.getElementById("svc-vacio");
  var buscar = document.getElementById("buscar");
  var orden = document.getElementById("orden");
  var cant = document.getElementById("cantidad");
  var estado = document.getElementById("estado");
  var nav = document.getElementById("svc-nav");
  var pagina = 1;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fecha(s) { var p = s.split("/"); return new Date(+p[2], +p[1] - 1, +p[0]).getTime(); }
  function sinTildes(s) { return s.normalize ? s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase() : s.toLowerCase(); }

  function tarjeta(s) {
    var addons = s.addons.map(function (a) {
      var e = ADDON_ETIQUETA[a[1]];
      return '<div class="addon"><p class="addon__label">' + esc(a[0]) + ':</p><p class="addon__value"><span class="badge badge--light badge--' + e[1] + '">' + e[0] + '</span><a href="#" data-pending="' + esc(e[2] + " " + a[0]) + ': fuera del alcance de este prototipo">' + e[2] + "</a></p></div>";
    }).join("");
    var acciones = (s.correos ? '<a class="btn btn--outline btn--secondary btn--sm" href="#" data-pending="Correos: fuera del alcance de este prototipo">Correos</a>' : "") +
      (s.estado === "suspendido" ? "" : '<a class="btn btn--outline btn--secondary btn--sm" href="#" data-pending="Panel hosting: fuera del alcance de este prototipo">Panel hosting</a>') +
      '<a class="btn btn--solid btn--secondary btn--sm" href="servicio.html" aria-label="Gestionar ' + esc(s.nombre) + '">Gestionar</a>';
    return '<li class="svc-row" data-id="' + s.id + '">' +
      '<div class="svc-row__body"><div class="svc-row__head">' +
      '<span class="badge badge--' + (s.estado === "suspendido" ? "warning" : "success") + ' svc-row__state">' + (s.estado === "suspendido" ? "Suspendido" : "Activo") + "</span>" +
      '<div class="svc-row__name"><h2 class="svc-row__title">' + esc(s.nombre) + '</h2><button class="svc-row__edit" type="button" aria-label="Editar el nombre de ' + esc(s.nombre) + '" data-pending="Editar nombre: fuera del alcance de este prototipo"><svg class="icon icon--16" aria-hidden="true"><use href="#i-edit"/></svg></button></div>' +
      '<p class="svc-row__id"><b>ID:</b> <span>' + s.id + '</span> <b>· Plan:</b> <span>Web Hosting Plan ' + esc(s.plan) + " " + s.so + "</span></p>" +
      '<p class="svc-row__exp"><b' + (s.critico ? "" : ' class="is-normal"') + ">" + s.venceTxt + " " + s.vence + ' ·</b> <a href="#" data-pending="Renovar: fuera del alcance de este prototipo">Renovar</a></p>' +
      '</div><div class="svc-row__hr" aria-hidden="true"></div>' +
      '<div class="addons">' + addons + "</div></div>" +
      '<div class="svc-row__actions">' + acciones + "</div></li>";
  }

  function filtrados() {
    var q = sinTildes(buscar.value.trim());
    var lista = SERVICIOS.filter(function (s) { return !q || sinTildes(s.nombre).indexOf(q) >= 0 || s.id.indexOf(q) >= 0; });
    var o = orden.value;
    lista = lista.slice();
    if (o === "nombre-az") lista.sort(function (a, b) { return a.nombre.localeCompare(b.nombre, "es"); });
    else if (o === "nombre-za") lista.sort(function (a, b) { return b.nombre.localeCompare(a.nombre, "es"); });
    else if (o === "vence-prox") lista.sort(function (a, b) { return fecha(a.vence) - fecha(b.vence); });
    else if (o === "vence-lej") lista.sort(function (a, b) { return fecha(b.vence) - fecha(a.vence); });
    return lista;
  }

  function pintar(anunciar) {
    var lista = filtrados();
    var por = parseInt(cant.value, 10) || 5;
    var total = lista.length;
    var paginas = Math.max(1, Math.ceil(total / por));
    if (pagina > paginas) pagina = paginas;
    if (pagina < 1) pagina = 1;
    var desde = total ? (pagina - 1) * por : 0;
    var hasta = Math.min(total, desde + por);
    cont.innerHTML = lista.slice(desde, hasta).map(tarjeta).join("");
    vacio.hidden = total > 0;
    foot.hidden = total === 0;
    rango.textContent = "Mostrando " + (total ? desde + 1 : 0) + " a " + hasta + " de " + total;
    info.innerHTML = "Página <b>" + pagina + "</b> de <b>" + paginas + "</b>";
    var b = nav.querySelectorAll("button");
    b[0].disabled = b[1].disabled = pagina <= 1;
    b[2].disabled = b[3].disabled = pagina >= paginas;
    if (anunciar) {
      estado.textContent = "";
      window.setTimeout(function () { estado.textContent = total ? "Mostrando " + (desde + 1) + " a " + hasta + " de " + total + " servicios." : "No hay servicios que coincidan con la búsqueda."; }, 30);
    }
  }

  document.getElementById("form-buscar").addEventListener("submit", function (e) { e.preventDefault(); pagina = 1; pintar(true); });
  buscar.addEventListener("input", function () { pagina = 1; pintar(false); });
  orden.addEventListener("change", function () { pagina = 1; pintar(true); });
  cant.addEventListener("change", function () { pagina = 1; pintar(true); });
  nav.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-ir]");
    if (!b || b.disabled) return;
    var por = parseInt(cant.value, 10) || 5;
    var paginas = Math.max(1, Math.ceil(filtrados().length / por));
    var ir = b.getAttribute("data-ir");
    pagina = ir === "primera" ? 1 : ir === "ultima" ? paginas : pagina + (ir === "sig" ? 1 : -1);
    pintar(true);
    var h = document.getElementById("main");
    if (h) h.scrollIntoView({ block: "start" });
  });
  document.getElementById("limpiar").addEventListener("click", function () { buscar.value = ""; pagina = 1; pintar(true); buscar.focus(); });

  /* ?vacio=1 → "sin resultados" · ?q=texto → búsqueda inicial (para comparar estados) */
  var qs = new URLSearchParams(window.location.search);
  if (qs.get("q")) buscar.value = qs.get("q");
  if (qs.get("vacio") === "1") buscar.value = "zzz";
  if (qs.get("cantidad") && cant.querySelector('option[value="' + qs.get("cantidad") + '"]')) cant.value = qs.get("cantidad");
  pintar(false);
})();
