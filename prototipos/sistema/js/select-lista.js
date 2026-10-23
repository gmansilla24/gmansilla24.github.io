/* Prototipo · Lista desplegable de los selects.
   El <select> nativo sigue siendo la fuente de verdad (valor, evento "change", etiqueta, formulario): este archivo solo reemplaza la lista
   que dibuja el navegador por un panel con el aspecto de los menús del sistema (mismo panel que el dropdown de acciones).
   Selects que cubre: .select__control (campos y barra de filtros), .dp__sel (mes y año del datepicker) y cualquier <select data-lista> (para los que dibujan su propio valor,
   como el "Mostrar" de las tablas de Referidos), incluidos los que se crean después.
   En pantallas táctiles (pointer: coarse) se deja la lista nativa: el selector del sistema operativo es mejor ahí.
   Teclado (el foco queda siempre en el select): ↓ ↑ Enter o Espacio abren; ↓ ↑ Inicio Fin se mueven; Enter o Espacio eligen; Esc cierra;
   una letra salta a la opción que empieza con ella; Tab cierra. */
(function () {
  "use strict";

  var tactil = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  if (tactil) return;

  var SEL = "select.select__control, select.dp__sel, select[data-lista]";
  var actual = null;     /* { sel, panel, items, i } */
  var n = 0;

  function esSelect(el) { return el && el.matches && el.matches(SEL) && !el.disabled && !el.multiple; }
  function etiqueta(sel) {
    var l = sel.labels && sel.labels[0];
    return sel.getAttribute("aria-label") || (l ? l.textContent.trim() : "");
  }

  function abrir(sel) {
    cerrar(false);
    var panel = document.createElement("div");
    panel.className = "sel-list"; panel.id = "sel-list-" + (++n); panel.setAttribute("role", "listbox");
    var nombre = etiqueta(sel); if (nombre) panel.setAttribute("aria-label", nombre);
    var items = [];
    Array.prototype.forEach.call(sel.options, function (o, i) {
      if (o.hidden) return;
      var d = document.createElement("div");
      d.className = "sel-list__opt"; d.id = panel.id + "-" + i; d.setAttribute("role", "option");
      d.setAttribute("aria-selected", o.selected ? "true" : "false");
      if (o.disabled) d.setAttribute("aria-disabled", "true");
      d.textContent = o.textContent; d._i = i;
      panel.appendChild(d); items.push(d);
    });
    /* dentro del campo de fecha o del modal abierto, para que el clic en la lista no cuente como "clic afuera" (el datepicker se cerraría) ni quede detrás del modal; si no, dentro del <main> (un landmark) */
    var cont = sel.closest("[data-dp-field]") || sel.closest("dialog[open]") || sel.closest("main, [role=main]") || document.body;
    cont.appendChild(panel);

    var r = sel.getBoundingClientRect(), pw = panel.offsetWidth, ph = panel.offsetHeight;
    var abajo = window.innerHeight - r.bottom - 12, arriba = r.top - 12;
    var sube = ph > abajo && arriba > abajo;
    var alto = Math.min(280, sube ? arriba : abajo);
    panel.style.maxHeight = Math.max(alto, 96) + "px";
    ph = panel.offsetHeight;
    panel.style.minWidth = Math.max(r.width, 120) + "px";
    pw = panel.offsetWidth;
    panel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - pw - 8)) + "px";
    panel.style.top = (sube ? r.top - ph - 4 : r.bottom + 4) + "px";

    actual = { sel: sel, panel: panel, items: items, i: Math.max(0, items.findIndex(function (d) { return d._i === sel.selectedIndex; })) };
    sel.setAttribute("aria-expanded", "true"); sel.setAttribute("aria-controls", panel.id); sel.setAttribute("aria-haspopup", "listbox");
    marcar(actual.i, false);
  }

  function marcar(i, porTeclado) {
    if (!actual || !actual.items.length) return;
    actual.items.forEach(function (d) { d.classList.remove("is-active"); });
    i = Math.max(0, Math.min(actual.items.length - 1, i));
    actual.i = i;
    var d = actual.items[i];
    d.classList.add("is-active");
    actual.panel.classList.toggle("is-kbd", !!porTeclado);
    actual.sel.setAttribute("aria-activedescendant", d.id);
    if (d.scrollIntoView) d.scrollIntoView({ block: "nearest" });
  }

  function cerrar(devolverFoco) {
    if (!actual) return;
    var a = actual; actual = null;
    a.sel.setAttribute("aria-expanded", "false");
    a.sel.removeAttribute("aria-activedescendant"); a.sel.removeAttribute("aria-controls");
    if (a.panel.parentNode) a.panel.parentNode.removeChild(a.panel);
    if (devolverFoco && document.body.contains(a.sel)) a.sel.focus({ preventScroll: true });
  }

  function elegir(i) {
    if (!actual) return;
    var d = actual.items[i], sel = actual.sel;
    if (!d || d.getAttribute("aria-disabled") === "true") return;
    var cambio = sel.selectedIndex !== d._i;
    cerrar(true);
    if (cambio) {
      sel.selectedIndex = d._i;
      sel.dispatchEvent(new Event("input", { bubbles: true }));
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  /* clic: abre o cierra; el botón del mouse no deja que el navegador abra su lista */
  document.addEventListener("mousedown", function (e) {
    var t = e.target;
    if (esSelect(t)) {
      if (e.button !== 0) return;
      e.preventDefault();
      t.focus({ preventScroll: true });
      if (actual && actual.sel === t) cerrar(false); else abrir(t);
      return;
    }
    var o = t.closest && t.closest(".sel-list__opt");
    if (o && actual && actual.panel.contains(o)) { e.preventDefault(); return; }   /* el foco se queda en el select */
    if (actual && !(t.closest && t.closest(".sel-list"))) cerrar(false);
  }, true);
  document.addEventListener("click", function (e) {
    var o = e.target.closest && e.target.closest(".sel-list__opt");
    if (o && actual && actual.panel.contains(o)) elegir(actual.items.indexOf(o));
  });
  document.addEventListener("mouseover", function (e) {
    var o = e.target.closest && e.target.closest(".sel-list__opt");
    if (o && actual && actual.panel.contains(o)) marcar(actual.items.indexOf(o), false);
  });

  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (actual && t === actual.sel) {
      var k = e.key;
      if (k === "ArrowDown") { e.preventDefault(); marcar(actual.i + 1, true); }
      else if (k === "ArrowUp") { e.preventDefault(); marcar(actual.i - 1, true); }
      else if (k === "Home") { e.preventDefault(); marcar(0, true); }
      else if (k === "End") { e.preventDefault(); marcar(actual.items.length - 1, true); }
      else if (k === "Enter" || k === " ") { e.preventDefault(); elegir(actual.i); }
      else if (k === "Escape") { e.preventDefault(); e.stopPropagation(); cerrar(true); }
      else if (k === "Tab") { cerrar(false); }
      else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        var c = k.toLowerCase(), n2 = actual.items.length, j;
        for (var s = 1; s <= n2; s++) {
          j = (actual.i + s) % n2;
          if (actual.items[j].textContent.trim().toLowerCase().indexOf(c) === 0) { marcar(j, true); break; }
        }
      }
      return;
    }
    if (esSelect(t) && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault(); abrir(t); marcar(actual.i, true);
    }
  }, true);

  document.addEventListener("focusout", function (e) { if (actual && e.target === actual.sel) cerrar(false); });
  window.addEventListener("resize", function () { cerrar(false); });
  window.addEventListener("scroll", function (e) { if (actual && !(e.target.closest && e.target.closest(".sel-list"))) cerrar(false); }, true);
})();
