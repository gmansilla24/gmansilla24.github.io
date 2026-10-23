/* Prototipo · Referidos · modal "Cambiar cupón" (Figma: Overlay/Modal - Editar cupón)
   Lo abre el lápiz del cupón (tarjeta principal y fila de "Actividad y pagos"): [data-editar-cupon].
   Estados de Figma: Inicial (vacío) · Foco · Escribiendo · Error (campo requerido / formato inválido / cupón en uso) · Guardando · toast de confirmación.
   Se valida al tocar "Guardar" (Figma muestra los errores recién ahí); al volver a escribir, el error se limpia.
   Reglas: 6 a 15 caracteres, solo letras y números. "En uso": el cupón actual y unos pocos inventados (no hay servidor).
   Al guardar: pantalla "Guardando" 0,8 s → NubixRef.setCupon() (el link se repinta en todas las pantallas) → toast.
   Para comparar contra Figma: ?modal=cupon&estado=inicial|valido|requerido|formato|uso|guardando (y los mismos botones en "Probar estados"). */
(function () {
  "use strict";
  var R = window.NubixRef;
  var dlg = document.getElementById("modal-cupon");
  if (!R || !dlg || typeof dlg.showModal !== "function") return;
  var form = document.getElementById("form-cupon");
  var input = document.getElementById("cupon-nuevo");
  var grupo = document.getElementById("cgroup");
  var ayuda = document.getElementById("cupon-ayuda");
  var actual = document.getElementById("cmodal-actual");
  var guardar = document.getElementById("cmodal-guardar");
  var cancelar = document.getElementById("cmodal-cancelar");
  var cerrar = document.getElementById("cmodal-cerrar");
  var cargando = document.getElementById("cmodal-cargando");
  var estado = document.getElementById("estado");

  var AYUDA = "Debe tener entre 6 y 15 caracteres, solo letras y números.";
  var MSG = { requerido: "Campo requerido.", formato: AYUDA, uso: "Ese código ya está en uso. Prueba con otro." };
  var TOMADOS = ["nubix2026", "promo2026", "regalo2026"];
  var GUARDADO = 800;      /* ms de "Guardando", igual que "Generando cupón" */
  var guardando = false;
  var timer;

  function anunciar(msg) {
    estado.textContent = "";
    window.setTimeout(function () { estado.textContent = msg; }, 30);
  }

  /* Devuelve la clave del error ("requerido" | "formato" | "uso") o "" si el valor sirve */
  function validar(v) {
    if (!v) return "requerido";
    if (!/^[A-Za-z0-9]{6,15}$/.test(v)) return "formato";
    var m = v.toLowerCase();
    if (m === R.cupon().toLowerCase() || TOMADOS.indexOf(m) >= 0) return "uso";
    return "";
  }
  function mostrarError(clave) {
    grupo.classList.add("is-error");
    input.setAttribute("aria-invalid", "true");
    ayuda.textContent = MSG[clave];
  }
  function limpiarError() {
    grupo.classList.remove("is-error");
    input.removeAttribute("aria-invalid");
    ayuda.textContent = AYUDA;
  }
  function pintarActual() {
    actual.textContent = "https://tudominio.com/regalo-";
    var b = document.createElement("b");
    b.textContent = R.cupon();
    actual.appendChild(b);
  }

  /* Un <dialog> modal deja inerte todo lo que no está adentro, incluido "Probar estados". Mientras el modal está abierto,
     ese panel se muda al <dialog> (queda en la capa superior y se puede tocar) y al cerrar vuelve a su lugar. */
  var probar = document.getElementById("probar");
  var origen = probar ? probar.parentNode : null;
  var siguiente = probar ? probar.nextSibling : null;
  function traerProbar() { if (probar) dlg.appendChild(probar); }
  function devolverProbar() {
    if (!probar || probar.parentNode !== dlg) return;
    if (siguiente && siguiente.parentNode === origen) origen.insertBefore(probar, siguiente); else origen.appendChild(probar);
  }

  function abrir(valor) {
    if (dlg.open) return;
    limpiarError();
    input.value = valor || "";
    pintarActual();
    dlg.showModal();
    traerProbar();
  }
  function enGuardado(on) {
    guardando = on;
    dlg.classList.toggle("is-saving", on);
    cargando.setAttribute("aria-hidden", on ? "false" : "true");
    if (on) dlg.setAttribute("aria-busy", "true"); else dlg.removeAttribute("aria-busy");
    form.inert = on;     /* sin deshabilitar los controles: así se ven como en Figma, solo bajo el velo */
  }
  function cerrarModal() { if (!guardando) dlg.close(); }

  /* ---------- abrir ---------- */
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-editar-cupon]")) abrir("");
  });

  /* ---------- cerrar ---------- */
  cancelar.addEventListener("click", cerrarModal);
  cerrar.addEventListener("click", cerrarModal);
  /* Un clic en el fondo NO cierra el modal: se sale solo con Cancelar, la X o Esc */
  /* Esc con el panel "Probar estados" abierto cierra solo el panel (lo hace casos.js); con el modal quieto o mientras guarda, no cierra el modal */
  var escPanel = false;
  document.addEventListener("keydown", function (e) {
    var panel = document.getElementById("probar-panel");
    escPanel = e.key === "Escape" && !!panel && !panel.hidden;
  }, true);
  dlg.addEventListener("cancel", function (e) { if (guardando || escPanel) e.preventDefault(); });
  dlg.addEventListener("close", function () { window.clearTimeout(timer); enGuardado(false); limpiarError(); devolverProbar(); });

  /* ---------- escribir ---------- */
  input.addEventListener("input", function () { if (grupo.classList.contains("is-error")) limpiarError(); });

  /* ---------- guardar ---------- */
  function confirmar(valor) {
    enGuardado(true);
    anunciar("Guardando el cupón…");
    timer = window.setTimeout(function () {
      R.setCupon(valor);
      enGuardado(false);
      dlg.close();
      if (R.aviso) R.aviso("El link de referencia se actualizó correctamente.", "cupon");
      anunciar("El link de referencia se actualizó correctamente.");
    }, GUARDADO);
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (guardando) return;
    var v = input.value.trim();
    var err = validar(v);
    if (err) { mostrarError(err); input.focus(); return; }
    confirmar(v);
  });

  /* ---------- comparar contra Figma: estados fijos ---------- */
  function demo(k) {
    var v = { inicial: "", valido: "mansi24", requerido: "", formato: "123", uso: R.cupon(), guardando: "mansi24" }[k];
    if (v === undefined) return;
    if (dlg.open) {                       /* ya abierto: se cambia el estado en el lugar */
      window.clearTimeout(timer);
      enGuardado(false); limpiarError();
      input.value = v; pintarActual();
    } else abrir(v);
    if (k === "requerido" || k === "formato" || k === "uso") mostrarError(k);
    if (k === "valido") { input.focus(); input.setSelectionRange(v.length, v.length); }
    else if (document.activeElement && document.activeElement !== document.body && dlg.contains(document.activeElement) && !(probar && probar.contains(document.activeElement))) document.activeElement.blur();   /* sin aro de foco en el botón de cerrar, como el frame de Figma */
    if (k === "guardando") { enGuardado(true); }   /* se queda así para poder compararlo */
  }
  var grp = document.getElementById("probar-cupon");
  if (grp) grp.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cupon-demo]");
    if (b) demo(b.getAttribute("data-cupon-demo"));
  });
  var q = new URLSearchParams(window.location.search);
  if (q.get("modal") === "cupon") demo(q.get("estado") || "inicial");
})();
