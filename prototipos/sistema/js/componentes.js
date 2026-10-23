/* Prototipo · Sistema de diseño Nubix
   Interacciones de los componentes de la etapa 2 del catálogo (solo se carga en las páginas del catálogo).
   Todo en memoria, datos inventados.
     · [data-pw]              mostrar / ocultar contraseña
     · [data-num]             stepper numérico (− / +)
     · [data-otp]             código de verificación (avanza solo, acepta pegar)
     · [data-fi]              carga de archivos (nombre elegido, zona de arrastre)
     · .sf                    búsqueda con botón para borrar
     · [data-sel2]            select doble con ✕
     · [data-dd]              dropdown de acciones (flechas, Inicio, Fin, Esc)
     · [data-dp]              datepicker (mes y año, teclado, mínimo / máximo)
     · [data-sl]              slider de uno o dos valores
     · [data-stp]             stepper de pasos
     · [data-tbl]             tabla: orden y selección
     · [data-modal]           modales (<dialog> nativo)
     · ?solo=<id>             muestra una sola sección (lo usan las capturas del handoff y las pruebas)
*/
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var toastEl = document.getElementById("toast"), toastT;
  function decir(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    window.clearTimeout(toastT);
    toastT = window.setTimeout(function () { toastEl.classList.remove("is-visible"); }, 2600);
  }
  function usar(svg, id) { var u = svg && svg.querySelector("use"); if (u) u.setAttribute("href", "#i-" + id); }

  /* ---------- ?solo=<id> ---------- */
  var solo = new URLSearchParams(window.location.search).get("solo");
  if (solo) {
    document.body.classList.add("ds-solo");
    var s = document.getElementById(solo);
    if (s) s.classList.add("is-solo");
  }

  /* ---------- Contraseña ---------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-pw]");
    if (!b) return;
    var inp = b.closest(".field__box").querySelector("input");
    var ver = inp.type === "password";
    inp.type = ver ? "text" : "password";
    b.setAttribute("aria-pressed", ver ? "true" : "false");
    b.setAttribute("aria-label", ver ? "Ocultar contraseña" : "Mostrar contraseña");
    usar(b.querySelector("svg"), ver ? "visibility-off" : "visibility");
  });

  /* ---------- Stepper numérico ---------- */
  $$("[data-num]").forEach(function (n) {
    var inp = n.querySelector(".num__in"), dec = n.querySelector("[data-num-dec]"), inc = n.querySelector("[data-num-inc]");
    var mn = +n.getAttribute("data-min"), mx = +n.getAttribute("data-max");
    function poner(v) {
      v = isNaN(v) ? mn : Math.max(mn, Math.min(mx, v));
      inp.value = v;
      if (!inp.disabled) { dec.disabled = v <= mn; inc.disabled = v >= mx; }
    }
    dec.addEventListener("click", function () { poner((+inp.value || mn) - 1); });
    inc.addEventListener("click", function () { poner((+inp.value || mn) + 1); });
    inp.addEventListener("change", function () { poner(parseInt(inp.value, 10)); });
    poner(+inp.value);
  });

  /* ---------- OTP ---------- */
  $$("[data-otp]").forEach(function (o) {
    var ins = $$(".otp__in", o);
    ins.forEach(function (i, k) {
      i.addEventListener("input", function () {
        i.value = i.value.replace(/\D/g, "").slice(-1);
        if (i.value && ins[k + 1]) ins[k + 1].focus();
      });
      i.addEventListener("keydown", function (e) {
        if (e.key === "Backspace" && !i.value && ins[k - 1]) { ins[k - 1].focus(); ins[k - 1].value = ""; e.preventDefault(); }
        else if (e.key === "ArrowLeft" && ins[k - 1]) { ins[k - 1].focus(); e.preventDefault(); }
        else if (e.key === "ArrowRight" && ins[k + 1]) { ins[k + 1].focus(); e.preventDefault(); }
      });
      i.addEventListener("focus", function () { i.select(); });
      i.addEventListener("paste", function (e) {
        var t = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "");
        if (!t) return;
        e.preventDefault();
        ins.forEach(function (x, j) { if (j >= k && t[j - k]) x.value = t[j - k]; });
        ins[Math.min(ins.length - 1, k + t.length)].focus();
      });
    });
  });

  /* ---------- Carga de archivos ---------- */
  $$("[data-fi]").forEach(function (f) {
    var inp = f.querySelector('input[type="file"]'), nom = f.querySelector("[data-fi-name]");
    var vacio = nom ? nom.textContent : "";
    function pintar() {
      var n = inp.files ? inp.files.length : 0;
      nom.textContent = n === 0 ? vacio : n === 1 ? inp.files[0].name : n + " archivos";
      f.classList.toggle("has-file", n > 0);
    }
    inp.addEventListener("change", pintar);
    if (f.hasAttribute("data-drop")) {
      var z = f.querySelector(".fi__drop");
      ["dragenter", "dragover"].forEach(function (ev) { z.addEventListener(ev, function (e) { e.preventDefault(); z.classList.add("is-over"); }); });
      ["dragleave", "drop"].forEach(function (ev) { z.addEventListener(ev, function (e) { e.preventDefault(); z.classList.remove("is-over"); }); });
      z.addEventListener("drop", function (e) {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) { try { inp.files = e.dataTransfer.files; } catch (x) { /* navegadores viejos */ } pintar(); }
      });
    }
  });

  /* ---------- Búsqueda ---------- */
  $$(".sf").forEach(function (s) {
    var inp = s.querySelector(".sf__in"), x = s.querySelector(".sf__clear");
    if (!x) return;
    inp.addEventListener("input", function () { x.hidden = !inp.value; });
    x.addEventListener("click", function () { inp.value = ""; x.hidden = true; inp.focus(); });
  });

  /* ---------- Select doble ---------- */
  $$("[data-sel2]").forEach(function (d) {
    var x = d.querySelector(".sel2__clear");
    if (!x) return;
    var b = d.querySelector(".sel2__box--b select");
    b.addEventListener("change", function () { x.hidden = !b.value; });
    x.addEventListener("click", function () {
      b.value = ""; b.dispatchEvent(new Event("change", { bubbles: true })); x.hidden = true; b.focus();
    });
  });

  /* ---------- Dropdown de acciones ---------- */
  $$("[data-dd]").forEach(function (d) {
    var btn = d.querySelector("button[aria-haspopup]"), panel = d.querySelector('[role="menu"]');
    var items = function () { return $$('[role="menuitem"]', panel); };
    function abrir(si, foco) {
      panel.hidden = !si;
      btn.setAttribute("aria-expanded", si ? "true" : "false");
      if (si && foco) items()[0].focus();
      if (!si && foco === "volver") btn.focus();
    }
    btn.addEventListener("click", function () { abrir(panel.hidden, true); });
    btn.addEventListener("keydown", function (e) { if (e.key === "ArrowDown" && panel.hidden) { e.preventDefault(); abrir(true, true); } });
    panel.addEventListener("keydown", function (e) {
      var l = items(), i = l.indexOf(document.activeElement), n = null;
      if (e.key === "ArrowDown") n = l[(i + 1) % l.length];
      else if (e.key === "ArrowUp") n = l[(i - 1 + l.length) % l.length];
      else if (e.key === "Home") n = l[0];
      else if (e.key === "End") n = l[l.length - 1];
      else if (e.key === "Escape") { e.preventDefault(); abrir(false, "volver"); return; }
      else if (e.key === "Tab") { abrir(false); return; }
      if (n) { e.preventDefault(); n.focus(); }
    });
    panel.addEventListener("click", function (e) {
      var it = e.target.closest('[role="menuitem"]');
      if (!it) return;
      decir("Elegiste «" + it.textContent.trim() + "» (ejemplo)");
      abrir(false, "volver");
    });
    document.addEventListener("click", function (e) { if (!panel.hidden && !d.contains(e.target)) abrir(false); });
  });

  /* ---------- Segmented control (una opción activa a la vez) ---------- */
  $$("[data-seg]").forEach(function (g) {
    g.addEventListener("click", function (e) {
      var it = e.target.closest(".seg__item");
      if (!it || it.disabled || !g.contains(it)) return;
      $$(".seg__item", g).forEach(function (o) { o.setAttribute("aria-pressed", o === it ? "true" : "false"); });
    });
  });

  /* ---------- Datepicker ---------- */
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function deIso(s) { if (!s) return null; var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function corto(d) { return ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear(); }
  function sumar(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function mismoDia(a, b) { return a && b && iso(a) === iso(b); }

  function datepicker(root, onPick) {
    var hoy = new Date(); hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    var valor = deIso(root.getAttribute("data-value"));
    var mn = deIso(root.getAttribute("data-min")), mx = deIso(root.getAttribute("data-max"));
    var vista = new Date((valor || hoy).getFullYear(), (valor || hoy).getMonth(), 1);
    var foco = valor || hoy;
    function fuera(d) { return (mn && d < mn) || (mx && d > mx); }
    function render(enfocar) {
      var y = vista.getFullYear(), m = vista.getMonth();
      var anios = ""; var a0 = Math.min(2020, y), a1 = Math.max(2035, y);
      for (var a = a0; a <= a1; a++) anios += '<option value="' + a + '"' + (a === y ? " selected" : "") + ">" + a + "</option>";
      var meses = MESES.map(function (n, i) { return '<option value="' + i + '"' + (i === m ? " selected" : "") + ">" + n.charAt(0).toUpperCase() + n.slice(1) + "</option>"; }).join("");
      var primero = new Date(y, m, 1), off = (primero.getDay() + 6) % 7, ini = sumar(primero, -off);
      if (foco.getFullYear() !== y || foco.getMonth() !== m) foco = (valor && valor.getFullYear() === y && valor.getMonth() === m) ? valor : primero;
      var celdas = "";
      for (var i = 0; i < 42; i++) {
        var d = sumar(ini, i), otro = d.getMonth() !== m;
        var cls = "dpd" + (otro ? " is-outside" : "") + (mismoDia(d, hoy) ? " is-today" : "") + (mismoDia(d, valor) ? " is-selected" : "");
        celdas += '<button class="' + cls + '" type="button" data-d="' + iso(d) + '" tabindex="' + (mismoDia(d, foco) ? 0 : -1) + '" aria-label="' + d.getDate() + " de " + MESES[d.getMonth()] + " de " + d.getFullYear() + '"' +
          (mismoDia(d, valor) ? ' aria-pressed="true"' : "") + (mismoDia(d, hoy) ? ' aria-current="date"' : "") + ((fuera(d) || otro) ? " disabled" : "") + ">" + d.getDate() + "</button>";
      }
      root.innerHTML =
        '<div class="dp__head"><button class="dp__nav" type="button" data-nav="-1" aria-label="Mes anterior"><svg class="icon" aria-hidden="true"><use href="#i-chevron-left"/></svg></button>' +
        '<div class="dp__my"><select class="dp__sel" data-m aria-label="Mes">' + meses + '</select><select class="dp__sel" data-y aria-label="Año">' + anios + "</select></div>" +
        '<button class="dp__nav" type="button" data-nav="1" aria-label="Mes siguiente"><svg class="icon" aria-hidden="true"><use href="#i-chevron-right"/></svg></button></div>' +
        '<div class="dp__wd" aria-hidden="true">' + DIAS.map(function (x) { return "<span>" + x + "</span>"; }).join("") + "</div>" +
        '<div class="dp__grid" role="group" aria-label="' + MESES[m].charAt(0).toUpperCase() + MESES[m].slice(1) + " de " + y + '">' + celdas + "</div>";
      if (enfocar) { var f = root.querySelector('.dpd[tabindex="0"]'); if (f) f.focus(); }
    }
    function ir(d, enfocar) { foco = d; if (d.getMonth() !== vista.getMonth() || d.getFullYear() !== vista.getFullYear()) vista = new Date(d.getFullYear(), d.getMonth(), 1); render(enfocar); }
    root.addEventListener("click", function (e) {
      var n = e.target.closest("[data-nav]");
      if (n) { vista = new Date(vista.getFullYear(), vista.getMonth() + (+n.getAttribute("data-nav")), 1); render(false); var b = root.querySelector('[data-nav="' + n.getAttribute("data-nav") + '"]'); if (b) b.focus(); return; }
      var d = e.target.closest("[data-d]");
      if (d && !d.disabled) { valor = deIso(d.getAttribute("data-d")); foco = valor; vista = new Date(valor.getFullYear(), valor.getMonth(), 1); render(false); if (onPick) onPick(valor); else { var s = root.querySelector('[aria-pressed="true"]'); if (s) s.focus(); } }
    });
    root.addEventListener("change", function (e) {
      if (e.target.matches("[data-m]")) { vista = new Date(vista.getFullYear(), +e.target.value, 1); render(false); root.querySelector("[data-m]").focus(); }
      else if (e.target.matches("[data-y]")) { vista = new Date(+e.target.value, vista.getMonth(), 1); render(false); root.querySelector("[data-y]").focus(); }
    });
    root.addEventListener("keydown", function (e) {
      var d = e.target.closest("[data-d]");
      if (!d) return;
      var f = deIso(d.getAttribute("data-d")), n = null;
      if (e.key === "ArrowLeft") n = sumar(f, -1);
      else if (e.key === "ArrowRight") n = sumar(f, 1);
      else if (e.key === "ArrowUp") n = sumar(f, -7);
      else if (e.key === "ArrowDown") n = sumar(f, 7);
      else if (e.key === "Home") n = sumar(f, -((f.getDay() + 6) % 7));
      else if (e.key === "End") n = sumar(f, 6 - ((f.getDay() + 6) % 7));
      else if (e.key === "PageUp") n = new Date(f.getFullYear(), f.getMonth() - 1, Math.min(f.getDate(), 28));
      else if (e.key === "PageDown") n = new Date(f.getFullYear(), f.getMonth() + 1, Math.min(f.getDate(), 28));
      if (n) { e.preventDefault(); ir(n, true); }
    });
    render(false);
    return {
      poner: function (d) { valor = d; foco = d; vista = new Date(d.getFullYear(), d.getMonth(), 1); render(false); },
      enfocar: function () { if (!valor || valor.getMonth() !== vista.getMonth()) { render(false); } var f = root.querySelector('.dpd[aria-pressed="true"]') || root.querySelector('.dpd[tabindex="0"]'); if (f) f.focus(); },
      limites: function () { return { mn: mn, mx: mx }; }
    };
  }
  $$("[data-dp-field]").forEach(function (campo) {
    var panel = campo.querySelector("[data-dp]"), tag = campo.querySelector(".ig__tag"), inp = campo.querySelector("input"), fld = campo.querySelector(".field");
    var help = fld.querySelector(".field__help"), ayuda = help.textContent;
    var api = datepicker(panel, function (d) { inp.value = corto(d); error(false); cerrar(true); });
    function abrir() { panel.hidden = false; tag.setAttribute("aria-expanded", "true"); api.enfocar(); }
    function cerrar(volver) { panel.hidden = true; tag.setAttribute("aria-expanded", "false"); if (volver) tag.focus(); }
    function error(si) { fld.classList.toggle("is-error", si); help.textContent = si ? "Escribe una fecha válida entre el 05/08/2026 y después, con el formato dd/mm/aaaa" : ayuda; }
    tag.addEventListener("click", function () { if (panel.hidden) abrir(); else cerrar(true); });
    inp.addEventListener("change", function () {
      var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(inp.value.trim());
      var d = m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
      var lim = api.limites();
      if (d && d.getMonth() === +m[2] - 1 && !(lim.mn && d < lim.mn) && !(lim.mx && d > lim.mx)) { api.poner(d); inp.value = corto(d); error(false); }
      else error(true);
    });
    campo.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { e.preventDefault(); cerrar(true); } });
    document.addEventListener("click", function (e) { if (!panel.hidden && e.target.isConnected && !campo.contains(e.target)) cerrar(false); });   /* isConnected: al pasar de mes el panel se vuelve a dibujar y el botón clicado ya no está en el DOM */
  });
  $$("[data-dp][data-static]").forEach(function (p) { datepicker(p); });

  /* ---------- Slider ---------- */
  $$("[data-sl]").forEach(function (sl) {
    var ins = $$(".sl__in", sl), rango = sl.hasAttribute("data-range"), uni = sl.getAttribute("data-uni") || "";
    var mx = +ins[0].max, marcas = $$(".sl__mark", sl), out = sl.parentNode.querySelector("[data-out]");
    function act(quien) {
      if (rango) {
        if (quien === ins[0] && +ins[0].value > +ins[1].value) ins[0].value = ins[1].value;
        if (quien === ins[1] && +ins[1].value < +ins[0].value) ins[1].value = ins[0].value;
      }
      var a = rango ? +ins[0].value : 0, b = rango ? +ins[1].value : +ins[0].value;
      sl.style.setProperty("--a", (a / mx * 100) + "%");
      sl.style.setProperty("--b", (b / mx * 100) + "%");
      marcas.forEach(function (m) { var v = +m.getAttribute("data-v"); m.classList.toggle("is-on", v >= a && v <= b); });
      if (out) out.textContent = rango ? a + uni + " – " + b + uni : b + uni;
    }
    ins.forEach(function (i) { i.addEventListener("input", function () { act(i); }); });
    act(null);
  });

  /* ---------- Stepper de pasos ---------- */
  function pasos(w, n) {
    var total = +w.getAttribute("data-total");
    n = Math.max(1, Math.min(total, n));
    w.setAttribute("data-n", n);
    $$(".stp__step", w).forEach(function (s, k) {
      var cur = k === n - 1, done = k < n - 1;
      s.classList.toggle("is-current", cur); s.classList.toggle("is-done", done); s.classList.toggle("is-reached", k > 0 && k <= n - 1);
      if (cur) s.setAttribute("aria-current", "step"); else s.removeAttribute("aria-current");
      $(".stp__box", s).innerHTML = done ? '<svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>' : String(k + 1);
    });
    $(".stp__over", w).textContent = "Paso " + n + " de " + total;
    $(".stp__cur", w).textContent = "Paso " + n;
    var bar = $(".stp__bar", w); bar.setAttribute("aria-valuenow", Math.round(n / total * 100));
    $("span", bar).style.setProperty("--w", (n / total * 100) + "%");
    return n;
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-stp-prev],[data-stp-next]");
    if (!b) return;
    var sig = b.hasAttribute("data-stp-next");
    var id = b.getAttribute(sig ? "data-stp-next" : "data-stp-prev"), w = document.getElementById(id);
    var n = pasos(w, (+w.getAttribute("data-n")) + (sig ? 1 : -1)), total = +w.getAttribute("data-total");
    var par = b.parentNode;
    $("[data-stp-prev]", par).disabled = n <= 1;
    $("[data-stp-next]", par).disabled = n >= total;
  });

  /* ---------- Tabla ---------- */
  $$("[data-tbl]").forEach(function (t) {
    var tbody = $("tbody", t), all = $("[data-all]", t), cont = $("[data-tbl-count]", t);
    var filas = function () { return $$("tr", tbody); };
    function contar() {
      var f = filas(), sel = f.filter(function (r) { return $("[data-row]", r).checked; });
      f.forEach(function (r) { r.classList.toggle("is-selected", $("[data-row]", r).checked); });
      all.checked = sel.length === f.length; all.indeterminate = sel.length > 0 && sel.length < f.length;
      cont.innerHTML = "<b>" + sel.length + "</b> " + (sel.length === 1 ? "seleccionado" : "seleccionados");
    }
    t.addEventListener("change", function (e) {
      if (e.target === all) { filas().forEach(function (r) { $("[data-row]", r).checked = all.checked; }); contar(); }
      else if (e.target.matches("[data-row]")) contar();
    });
    $$("[data-sort]", t).forEach(function (b) {
      b.addEventListener("click", function () {
        var th = b.closest("th"), clave = b.getAttribute("data-sort");
        var dir = th.getAttribute("aria-sort") === "ascending" ? "descending" : "ascending";
        $$("th[aria-sort]", t).forEach(function (x) { x.setAttribute("aria-sort", "none"); usar($(".icon", x), "import-export"); });
        th.setAttribute("aria-sort", dir);
        usar($(".icon", b), dir === "ascending" ? "arrow-upward" : "arrow-downward");
        var k = { nombre: "data-nombre", venc: "data-venc", precio: "data-precio" }[clave];
        var f = filas().sort(function (a, c) {
          var x = a.getAttribute(k), y = c.getAttribute(k), r;
          if (clave === "precio") r = (+x) - (+y); else r = x.localeCompare(y, "es");
          return dir === "ascending" ? r : -r;
        });
        f.forEach(function (r) { tbody.appendChild(r); });
      });
    });
    contar();
  });

  /* ---------- Modales ---------- */
  document.addEventListener("click", function (e) {
    var o = e.target.closest("[data-modal]");
    if (o) { var d = document.getElementById(o.getAttribute("data-modal")); if (d && d.showModal) d.showModal(); return; }
    var c = e.target.closest("[data-modal-close]");
    if (c) { var dd = c.closest("dialog"); if (dd) dd.close(); return; }
    if (e.target.tagName === "DIALOG" && e.target.classList.contains("modal")) e.target.close();   /* clic en el fondo */
  });
  $$("dialog.modal").forEach(function (d) {
    var ack = $("[data-modal-ack]", d), need = $("[data-modal-need]", d);
    if (ack && need) {
      ack.addEventListener("change", function () { need.disabled = !ack.checked; });
      d.addEventListener("close", function () { ack.checked = false; need.disabled = true; });
    }
  });

  /* ---------- Tarjeta de servicio cloud: detalles técnicos ---------- */
  $$("[data-cs-toggle]").forEach(function (b) {
    b.addEventListener("click", function () {
      var card = b.closest("[data-cs]"), more = $(".cs__more", card);
      var abrir = more.hasAttribute("hidden");
      if (abrir) more.removeAttribute("hidden"); else more.setAttribute("hidden", "");
      b.setAttribute("aria-expanded", abrir ? "true" : "false");
      var u = $("use", b); if (u) u.setAttribute("href", abrir ? "#i-expand-less" : "#i-expand-more");
    });
  });

  /* ---------- Vista previa de pantallas completas (escala el iframe de 1280) ---------- */
  function escalar() {
    $$(".pv__d").forEach(function (w) {
      var s = w.clientWidth / 1280;
      var f = $("iframe", w);
      f.style.transform = "scale(" + s + ")";
      w.style.height = (800 * s) + "px";
    });
  }
  function ajustar() {
    $$("[data-fit]").forEach(function (w) {
      var d = w.getAttribute("data-fit").split("x"), bw = +d[0], bh = +d[1];
      var raw = Math.min(1, w.clientWidth / bw), s = Math.max(.7, raw), f = $("iframe", w);
      w.style.overflowX = raw < s ? "auto" : "hidden";
      f.style.width = bw + "px"; f.style.height = bh + "px";
      f.style.transform = "scale(" + s + ")";
      w.style.height = (bh * s) + "px";
    });
  }
  if ($(".pv__d")) { escalar(); window.addEventListener("resize", escalar); }
  if ($("[data-fit]")) { ajustar(); window.addEventListener("resize", ajustar); }
})();
