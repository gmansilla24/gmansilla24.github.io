/* Prototipo · Referidos · pestañas "Recomendar y ganar" / "Actividad y pagos"
     Entrar a "Actividad y pagos" muestra el estado "Cargando" 0,8 s (velo + spinner sobre cada bloque) y después los datos de la etapa.
     Con las etapas 1 a 3 muestra "Sin datos"; con la 4 ("referidos") muestra los datos (js/actividad-datos.js: tablas, búsqueda, tope y animación de entrada).
     Con la etapa 5 ("cobrado") muestra el saldo en USD 0 y el primer cobro acreditado.
     Eventos para actividad-datos.js: ap:cargando (arranca el velo), ap:cargado (el velo se levantó: arranca la animación) y ap:error.
     "Error al cargar": las dos tablas muestran "No pudimos cargar…" con el botón Reintentar; Reintentar vuelve a cargar (velo 0,8 s) y deja la vista de la etapa.
     Ese error no sale solo (no hay servidor que falle): se llega desde "Probar estados" · Pestaña o con ?tab=actividad&error=1.
   Parámetros de URL, para comparar contra Figma: ?tab=actividad (abre la pestaña) · ?tab=actividad&cargando=1 (la deja en "Cargando") · ?tab=actividad&error=1 (la deja en "Error al cargar")
   · ?tab=actividad&etapa=referidos (con datos) · …&buscar=Roberto%20Gómez (búsqueda sin resultados) · …&tope=1 (tope de comisión). */
(function () {
  "use strict";
  var R = window.NubixRef;
  var A = window.NubixAct || { setTope: function () {}, buscar: function () {}, limpiar: function () {}, modo: function () { return "sin"; }, sinResultados: function () { return false; }, enPlace: function () { return false; } };
  var content = document.getElementById("ref-content");
  var tabs = { recomendar: document.getElementById("tab-recomendar"), actividad: document.getElementById("tab-actividad") };
  var paneles = { recomendar: document.getElementById("panel-recomendar"), actividad: document.getElementById("panel-actividad") };
  var estado = document.getElementById("estado");
  var botones = document.querySelectorAll("[data-tab-demo]");
  var actual = "recomendar";
  var cargando = false;      /* true mientras dura el velo; con ?cargando=1 se queda hasta cambiar de pestaña */
  var fija = false;          /* el velo no se saca solo (estado "Cargando" para comparar) */
  var error = false;         /* las tablas muestran "No pudimos cargar…" (panel con data-error) */
  var timer;

  function anunciar(msg) {
    estado.textContent = "";
    window.setTimeout(function () { estado.textContent = msg; }, 30);
  }
  function emitir(nombre) { document.dispatchEvent(new CustomEvent(nombre)); }
  function marcarBotones() {
    for (var i = 0; i < botones.length; i++) {
      var k = botones[i].getAttribute("data-tab-demo");
      var vista = actual === "actividad" && !error && !(cargando && fija);
      var on = k === "cargando" ? (actual === "actividad" && cargando)
             : k === "error" ? (actual === "actividad" && error)
             : k === "datos" ? (vista && A.modo() === "con" && !A.sinResultados())
             : k === "sinres" ? (vista && A.sinResultados())
             : k === "tope" ? (vista && A.modo() === "tope")
             : (k === actual && !(k === "actividad" && !vista));
      botones[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }
  function marcarError(on) {
    error = on;
    if (on) paneles.actividad.setAttribute("data-error", ""); else paneles.actividad.removeAttribute("data-error");
  }
  function velo(on) {
    cargando = on;
    paneles.actividad.classList.toggle("is-loading", on);
    if (on) paneles.actividad.setAttribute("aria-busy", "true"); else paneles.actividad.removeAttribute("aria-busy");
    if (on) emitir("ap:cargando");
    marcarBotones();
  }

  function terminarCarga() { velo(false); emitir("ap:cargado"); anunciar("Actividad y pagos lista."); }

  /* opciones: { foco: mueve el foco a la pestaña, fija: deja el estado "Cargando", error: deja el estado "Error al cargar" } */
  function seleccionar(cual, opciones) {
    opciones = opciones || {};
    window.clearTimeout(timer);
    actual = cual;
    for (var k in tabs) {
      var on = k === cual;
      tabs[k].setAttribute("aria-selected", on ? "true" : "false");
      tabs[k].setAttribute("tabindex", on ? "0" : "-1");
      paneles[k].hidden = !on;
    }
    content.setAttribute("data-tab", cual);
    if (opciones.foco) tabs[cual].focus();
    if (cual === "actividad") {
      fija = !!opciones.fija;
      marcarError(!!opciones.error);
      if (error) { velo(false); emitir("ap:error"); anunciar("No pudimos cargar tu actividad de referidos ni tus movimientos de cobros."); }
      else {
        velo(true);
        anunciar("Cargando actividad y pagos…");
        if (!fija) timer = window.setTimeout(terminarCarga, 800);
      }
    } else {
      fija = false;
      marcarError(false);
      velo(false);
    }
    marcarBotones();
  }

  tabs.recomendar.addEventListener("click", function () { if (actual !== "recomendar") seleccionar("recomendar"); });
  tabs.actividad.addEventListener("click", function () { if (actual !== "actividad") seleccionar("actividad"); });
  /* Flechas, Inicio y Fin entre pestañas (patrón de tablist) */
  document.querySelector(".rtabs").addEventListener("keydown", function (e) {
    var orden = ["recomendar", "actividad"];
    var i = orden.indexOf(actual), j = -1;
    if (e.key === "ArrowRight") j = (i + 1) % orden.length;
    else if (e.key === "ArrowLeft") j = (i + orden.length - 1) % orden.length;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = orden.length - 1;
    if (j < 0) return;
    e.preventDefault();
    seleccionar(orden[j], { foco: true });
  });

  /* "Probar estados" · Pestaña */
  var grupo = document.getElementById("probar-tab");
  if (grupo) grupo.addEventListener("click", function (e) {
    var b = e.target.closest("[data-tab-demo]");
    if (!b) return;
    var k = b.getAttribute("data-tab-demo");
    if (k === "cargando") seleccionar("actividad", { fija: true });
    else if (k === "error") seleccionar("actividad", { error: true });
    else if (k === "datos" || k === "sinres" || k === "tope") {
      /* Los tres casos con actividad son de la etapa 4: si hace falta, se pasa a esa etapa (eso limpia búsqueda y tope) y recién después se arma el caso */
      R.setEtapa("referidos");
      A.limpiar(); A.setTope(k === "tope");
      if (k === "sinres") A.buscar("Roberto Gómez");
      seleccionar("actividad");
    }
    else seleccionar(k);
  });

  /* Reintentar (en cualquiera de las dos tablas): vuelve a cargar y deja la vista de la etapa */
  paneles.actividad.addEventListener("click", function (e) {
    if (!e.target.closest("[data-reintentar]") || !error) return;
    window.clearTimeout(timer);
    marcarError(false);
    velo(true);
    anunciar("Cargando actividad y pagos…");
    timer = window.setTimeout(terminarCarga, 800);
  });

  /* Si la etapa cambia mientras se mira "Actividad y pagos", los datos son otros: vuelve a cargar (salvo el cambio que hace el modal de cobro, que actualiza en el lugar) */
  document.addEventListener("ref:etapa", function () {
    if (actual === "actividad" && !A.enPlace()) seleccionar("actividad");
  });

  var q = new URLSearchParams(window.location.search);
  if (q.get("tab") === "actividad") {
    if (q.get("tope") === "1") { R.setEtapa("referidos"); A.setTope(true); }
    if (q.get("buscar")) A.buscar(q.get("buscar"));
    seleccionar("actividad", { fija: q.get("cargando") === "1", error: q.get("error") === "1" });
  }
  marcarBotones();
})();
