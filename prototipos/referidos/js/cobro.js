/* Prototipo · Referidos · modal "Retiro de comisiones" (Figma: Overlay/Modal - Solicitud de cobro)
   Lo abre "Cobrar como saldo en Nubix" (habilitado cuando el saldo llega al mínimo de USD 30).
   Estados de Figma: Revisión (antes de confirmar) · Confirmando (velo con spinner) · Cobro solicitado · Error "No pudimos procesar tu pedido".
   Camino real: Revisión → Confirmar solicitud → Confirmando 0,8 s → "¡Tu cobro va en camino!" → Entendido (o la X, o Esc) → etapa 5 "Después de cobrar":
   NubixAct.cobrar() deja el saldo en USD 0 y acredita el primer movimiento, sin volver a cargar la pantalla.
   El error no sale solo (no hay servidor que falle): se ve desde Probar estados · Modal · Retiro de comisiones o con ?modal=cobro&estado=error.
   "Cobrar por transferencia bancaria" no abre este modal: lo gestiona la mesa de ayuda (aviso de "fuera del alcance", casos.js).
   Para comparar contra Figma: ?modal=cobro&estado=revision|confirmando|exito|error (pasa solo a la etapa 4 y a la pestaña Actividad y pagos). */
(function () {
  "use strict";
  var R = window.NubixRef, A = window.NubixAct;
  var dlg = document.getElementById("modal-cobro");
  if (!R || !A || !dlg || typeof dlg.showModal !== "function") return;
  var panel = document.getElementById("panel-actividad");
  var boton = document.getElementById("ap-cobrar-saldo");
  var monto = document.getElementById("cobro-monto");
  var confirmar = document.getElementById("cobro-confirmar");
  var cancelar = document.getElementById("cobro-cancelar");
  var cerrar = document.getElementById("cobro-cerrar");
  var estado = document.getElementById("estado");
  var vistas = dlg.querySelectorAll(".cobro__vista");
  var GUARDADO = 800;      /* ms de "Confirmando", igual que "Guardando" del cupón */
  var guardando = false;
  var real = false;        /* llegó al "cobro solicitado" por el camino real (no desde Probar estados): al cerrar pasa a la etapa 5 */
  var timer;

  function anunciar(msg) {
    estado.textContent = "";
    window.setTimeout(function () { estado.textContent = msg; }, 30);
  }

  /* Un <dialog> modal deja inerte todo lo que no está adentro, incluido "Probar estados": mientras está abierto, el panel se muda al <dialog> (igual que en el modal de cupón) */
  var probar = document.getElementById("probar");
  var origen = probar ? probar.parentNode : null;
  var siguiente = probar ? probar.nextSibling : null;
  function traerProbar() { if (probar) dlg.appendChild(probar); }
  function devolverProbar() {
    if (!probar || probar.parentNode !== dlg) return;
    if (siguiente && siguiente.parentNode === origen) origen.insertBefore(probar, siguiente); else origen.appendChild(probar);
  }

  function vista(v) {
    dlg.setAttribute("data-vista", v);
    for (var i = 0; i < vistas.length; i++) vistas[i].inert = vistas[i].getAttribute("data-v") !== v;
  }
  function enGuardado(on) {
    guardando = on;
    dlg.classList.toggle("is-saving", on);
    document.getElementById("cobro-cargando").setAttribute("aria-hidden", on ? "false" : "true");
    if (on) dlg.setAttribute("aria-busy", "true"); else dlg.removeAttribute("aria-busy");
    dlg.querySelector('.cobro__vista[data-v="revision"]').inert = on || dlg.getAttribute("data-vista") !== "revision";   /* se ve igual, pero no se puede tocar */
  }
  function abrir(v) {
    window.clearTimeout(timer);
    enGuardado(false);
    monto.textContent = "USD " + A.saldo();
    vista(v || "revision");
    if (!dlg.open) { dlg.showModal(); traerProbar(); }
  }
  function cerrarModal() { if (!guardando) dlg.close(); }

  /* ---------- abrir ---------- */
  boton.addEventListener("click", function () { real = false; abrir("revision"); });

  /* ---------- cerrar ---------- */
  cancelar.addEventListener("click", cerrarModal);
  cerrar.addEventListener("click", cerrarModal);
  dlg.addEventListener("click", function (e) { if (e.target.closest("[data-cobro-cerrar]")) cerrarModal(); });
  /* Un clic en el fondo NO cierra el modal. Esc con "Probar estados" abierto cierra solo el panel (casos.js); mientras confirma, no cierra nada */
  var escPanel = false;
  document.addEventListener("keydown", function (e) {
    var p = document.getElementById("probar-panel");
    escPanel = e.key === "Escape" && !!p && !p.hidden;
  }, true);
  dlg.addEventListener("cancel", function (e) { if (guardando || escPanel) e.preventDefault(); });
  dlg.addEventListener("close", function () {
    window.clearTimeout(timer);
    enGuardado(false);
    devolverProbar();
    if (real) {                       /* cobro solicitado por el camino real: la pantalla pasa a "Después de cobrar" */
      real = false;
      A.cobrar();
      panel.focus({ preventScroll: true });
      anunciar("Cobro solicitado. Tu saldo quedó en USD 0.");
    }
  });

  /* ---------- confirmar ---------- */
  confirmar.addEventListener("click", function () {
    if (guardando) return;
    enGuardado(true);
    anunciar("Confirmando tu solicitud de cobro…");
    timer = window.setTimeout(function () {
      enGuardado(false);
      real = true;
      vista("exito");
      dlg.querySelector('.cobro__vista[data-v="exito"] [data-cobro-cerrar]').focus();
      anunciar("¡Tu cobro va en camino! Estamos revisando tu pedido. Puede tomar unos minutos.");
    }, GUARDADO);
  });

  /* ---------- comparar contra Figma: estados fijos (con la pantalla de fondo ya cargada) ---------- */
  function enActividad(fn) {
    if (dlg.open) { fn(); return; }
    if (R.etapa() !== "referidos") R.setEtapa("referidos");     /* la etapa 4 es la que tiene saldo para cobrar */
    var tab = document.getElementById("tab-actividad");
    if (tab.getAttribute("aria-selected") !== "true") tab.click();
    if (panel.classList.contains("is-loading")) {
      document.addEventListener("ap:cargado", function una() { document.removeEventListener("ap:cargado", una); window.setTimeout(fn, 0); });
    } else fn();
  }
  function demo(k) {
    if (["revision", "confirmando", "exito", "error"].indexOf(k) < 0) return;
    enActividad(function () {
      real = false;
      abrir(k === "confirmando" ? "revision" : k);
      if (k === "confirmando") enGuardado(true);                 /* se queda así para poder compararlo */
      if (document.activeElement && dlg.contains(document.activeElement) && !(probar && probar.contains(document.activeElement))) document.activeElement.blur();   /* sin aro de foco, como el frame de Figma */
    });
  }
  var grp = document.getElementById("probar-cobro");
  if (grp) grp.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cobro-demo]");
    if (b) demo(b.getAttribute("data-cobro-demo"));
  });
  var q = new URLSearchParams(window.location.search);
  if (q.get("modal") === "cobro") demo(q.get("estado") || "revision");
  vista("revision");
})();
