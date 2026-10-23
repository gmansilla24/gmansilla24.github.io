/* Prototipo · Popover y tooltip en uso (Figma "Feedback/Popover" y "Feedback/Tooltip", 4 posiciones).
   Popover (clic):   <button data-popover="id-del-popover" data-placement="arriba|abajo|izquierda|derecha" aria-expanded="false" aria-controls="id-del-popover">
                     <div class="popover popover--live" id="id-del-popover" hidden>…</div>  (justo después del botón, para que el orden de lectura sea natural)
   Tooltip (hover):  <button data-tip="Texto de ayuda." data-placement="arriba|abajo|izquierda|derecha">
   La posición es el lado del disparador donde aparece; la flecha apunta al disparador. Si del lado elegido no hay lugar, pasa al opuesto
   (y la clase de la flecha cambia con él). Si hay que correrlo para que no se salga de la ventana, la flecha sigue apuntando al centro del disparador.
   Teclado: Enter / Espacio abren y cierran el popover; Esc cierra (y devuelve el foco al disparador); Tab hacia afuera lo cierra.
   Tooltip: aparece al pasar el mouse y al enfocar con teclado; Esc lo oculta. Un solo popover abierto a la vez. */
(function () {
  "use strict";

  var OPUESTO = { arriba: "abajo", abajo: "arriba", izquierda: "derecha", derecha: "izquierda" };
  var LADOS = ["arriba", "abajo", "izquierda", "derecha"];
  var MARGEN = 8;           /* mínimo hasta el borde de la ventana */
  var abierto = null;       /* { btn, pop, lado } */
  var tipVivo = null;       /* { el, pop } */
  var uid = 0;

  function lado(v) { return LADOS.indexOf(v) >= 0 ? v : "abajo"; }

  /* Coloca el elemento (position: fixed) junto al disparador y devuelve el lado final.
     Orden de prueba: el lado pedido, el opuesto y, si tampoco hay lugar, los dos perpendiculares (ej.: en una pantalla angosta, "derecha" pasa a abajo o arriba).
     El tamaño se mide con la clase de cada lado ya puesta, porque la flecha del tooltip cambia el alto o el ancho según el lado. */
  function colocar(trg, el, pref, aire, claseBase, flechaMin) {
    el.hidden = false;
    var t = trg.getBoundingClientRect();
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var pw = 0, ph = 0;
    function poner(l) {
      LADOS.forEach(function (n) { el.classList.remove(claseBase + "--" + n); });
      el.classList.add(claseBase + "--" + l);
      pw = el.offsetWidth; ph = el.offsetHeight;
    }
    function cabe(l) {
      if (l === "arriba") return t.top - aire - ph >= MARGEN;
      if (l === "abajo") return t.bottom + aire + ph <= vh - MARGEN;
      if (l === "izquierda") return t.left - aire - pw >= MARGEN;
      return t.right + aire + pw <= vw - MARGEN;
    }
    var vertical = pref === "arriba" || pref === "abajo";
    var orden = [pref, OPUESTO[pref]].concat(vertical ? ["derecha", "izquierda"] : ["abajo", "arriba"]);
    var l = null;
    for (var i = 0; i < orden.length && !l; i++) { poner(orden[i]); if (cabe(orden[i])) l = orden[i]; }
    if (!l) { l = pref; poner(l); }
    var x, y, corrimiento = 0;
    if (l === "arriba" || l === "abajo") {
      var ideal = t.left + t.width / 2 - pw / 2;
      x = Math.max(MARGEN, Math.min(ideal, vw - pw - MARGEN));
      corrimiento = ideal - x;
      y = l === "arriba" ? t.top - aire - ph : t.bottom + aire;
    } else {
      var idealY = t.top + t.height / 2 - ph / 2;
      y = Math.max(MARGEN, Math.min(idealY, vh - ph - MARGEN));
      corrimiento = idealY - y;
      x = l === "izquierda" ? t.left - aire - pw : t.right + aire;
    }
    /* la flecha no se sale de la tarjeta */
    var tope = Math.max(0, ((l === "arriba" || l === "abajo") ? pw : ph) / 2 - flechaMin);
    corrimiento = Math.max(-tope, Math.min(tope, corrimiento));
    el.style.left = Math.round(x * 10) / 10 + "px";
    el.style.top = Math.round(y * 10) / 10 + "px";
    el.style.setProperty("--pop-shift", Math.round(corrimiento * 10) / 10 + "px");
    return l;
  }

  /* ---------------- Popover ---------------- */
  function abrirPop(btn) {
    cerrarPop(false);
    var pop = document.getElementById(btn.getAttribute("data-popover"));
    if (!pop) return;
    var l = colocar(btn, pop, lado(btn.getAttribute("data-placement")), 9, "popover", 16);
    btn.setAttribute("aria-expanded", "true");
    abierto = { btn: btn, pop: pop, lado: l };
  }
  function cerrarPop(devolverFoco) {
    if (!abierto) return;
    var a = abierto; abierto = null;
    a.pop.hidden = true;
    a.btn.setAttribute("aria-expanded", "false");
    if (devolverFoco) a.btn.focus({ preventScroll: true });
  }
  function reubicar() {
    if (abierto) colocar(abierto.btn, abierto.pop, lado(abierto.btn.getAttribute("data-placement")), 9, "popover", 16);
    if (tipVivo) colocar(tipVivo.btn, tipVivo.el, lado(tipVivo.btn.getAttribute("data-placement")), 8, "tip", 12);
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-popover]");
    if (btn) {
      if (abierto && abierto.btn === btn) cerrarPop(false); else abrirPop(btn);
      return;
    }
    if (abierto && !abierto.pop.contains(e.target)) cerrarPop(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (abierto) { e.preventDefault(); cerrarPop(true); }
    ocultarTip();
  });
  document.addEventListener("focusin", function (e) {
    if (abierto && e.target !== abierto.btn && !abierto.pop.contains(e.target)) cerrarPop(false);
  });

  /* ---------------- Tooltip ---------------- */
  function mostrarTip(trg) {
    var texto = trg.getAttribute("data-tip");
    if (!texto) return;
    ocultarTip();
    var el = document.createElement("div");
    el.className = "tip tip--live";
    el.id = "tip-" + (++uid);
    el.setAttribute("role", "tooltip");
    el.innerHTML = '<span class="tip__text"></span><span class="tip__arrow" aria-hidden="true"></span>';
    el.firstChild.textContent = texto;
    el.hidden = true;
    /* dentro del modal abierto (si el disparador está en uno) o del <main>: así queda dentro de un landmark y no detrás del modal */
    (trg.closest("dialog[open]") || trg.closest("main, [role=main]") || document.body).appendChild(el);
    colocar(trg, el, lado(trg.getAttribute("data-placement")), 8, "tip", 12);
    var d = trg.getAttribute("aria-describedby");
    trg.setAttribute("aria-describedby", (d ? d + " " : "") + el.id);
    tipVivo = { el: el, btn: trg, desc: d };
  }
  function ocultarTip() {
    if (!tipVivo) return;
    var t = tipVivo; tipVivo = null;
    if (t.desc) t.btn.setAttribute("aria-describedby", t.desc); else t.btn.removeAttribute("aria-describedby");
    if (t.el.parentNode) t.el.parentNode.removeChild(t.el);
  }
  function conTip(e) { return e.target.closest && e.target.closest("[data-tip]"); }
  document.addEventListener("mouseover", function (e) { var t = conTip(e); if (t && !(tipVivo && tipVivo.btn === t)) mostrarTip(t); });
  document.addEventListener("mouseout", function (e) { var t = conTip(e); if (t && !t.contains(e.relatedTarget)) ocultarTip(); });
  document.addEventListener("focusin", function (e) { var t = conTip(e); if (t) mostrarTip(t); });
  document.addEventListener("focusout", function (e) { if (conTip(e)) ocultarTip(); });

  var raf = 0;
  function pedirReubicar() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; reubicar(); }); }
  window.addEventListener("resize", pedirReubicar);
  window.addEventListener("scroll", pedirReubicar, true);
})();
