/* Prototipo · Usuarios y permisos
   Vista 1 (lista): cargando → cuenta sin integrantes → lista de integrantes (de 1 a 10).
   Vista 2 (#agregar): formulario "Agregar integrante" con sus estados de error.
   Vista 3 (#editar/<email>): "Editar integrante" (rol y acceso a soporte; el email no se edita).
   Modales de confirmación: reenviar invitación, eliminar integrante, eliminar invitación.
   Pestaña 2 (#otras-cuentas): "Asignado a otras cuentas": cargando → sin cuentas → lista de cuentas ajenas, con
   aceptar / rechazar una invitación, abandonar una cuenta y eliminar una invitación expirada.

   Modelo: la cuenta tiene un titular (fijo, no cuenta) y hasta LIMITE integrantes invitados.
   Los integrantes viven en memoria: al recargar la página se vuelve a empezar.

   Parámetros de URL, para comparar contra Figma o enlazar un estado:
     ?paso=0|1                         congela la carga de la lista
     ?integrantes=0..10                arranca con esa cantidad (1, 5 y 10 reproducen las pantallas de Figma)
     ?modal=reenviar|eliminar|eliminar-invitacion   abre ese modal en "Mi cuenta"
     ?modal=aceptar|rechazar|abandonar|eliminar-recibida   abre ese modal en "Asignado a otras cuentas"
     ?cuentas=0|3                      cuentas ajenas al arrancar (3 = los ejemplos de Figma, por defecto)
     #otras-cuentas                    abre la pestaña "Asignado a otras cuentas"
     #agregar                          abre el formulario
     #editar/<email>                   abre la edición de un integrante ACTIVO
     ?estado=vacio|ok|requerido|formato|noexiste|generico|duplicado   (junto con #agregar)
*/
(function () {
  "use strict";

  var LIMITE = 10;
  var TITULAR_EMAIL = "matias.roldan@ejemplo.com";

  var body = document.body;
  var panel = document.getElementById("panel-mi-cuenta");
  var panelOtras = document.getElementById("panel-otras");
  var tabMi = document.getElementById("tab-mi-cuenta");
  var tabOtras = document.getElementById("tab-asignado");
  var estado = document.getElementById("estado");
  var toast = document.getElementById("toast");
  var params = new URLSearchParams(window.location.search);

  var vistas = {
    lista: document.getElementById("vista-lista"),
    agregar: document.getElementById("vista-agregar"),
    editar: document.getElementById("vista-editar")
  };
  var btnAgregar = document.getElementById("btn-agregar");
  var btnVolver = document.getElementById("btn-volver");
  var btnVolverEd = document.getElementById("btn-volver-editar");
  var titulos = {
    lista: "Usuarios y permisos · Prototipo en código",
    agregar: "Agregar integrante · Usuarios y permisos · Prototipo en código",
    editar: "Editar integrante · Usuarios y permisos · Prototipo en código",
    otras: "Asignado a otras cuentas · Usuarios y permisos · Prototipo en código"
  };

  /* ---------- Datos: integrantes en memoria ---------- */
  var ROLES = { administrador: "Administrador", facturacion: "Factura y pagos", tecnica: "Gestión técnica" };
  var ESTADOS = {
    activo: { texto: "Activo", clase: "badge--success-solid" },
    pendiente: { texto: "Pendiente", clase: "badge--warning-solid" },
    expirado: { texto: "Expirado", clase: "badge--danger-solid" }
  };

  function m(nombre, rol, soporte, est) {
    var slug = nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, ".");
    return { nombre: nombre, email: slug + "@example.com", rol: rol, soporte: soporte, estado: est };
  }
  /* Los integrantes de las pantallas de Figma. Juan Medina (el del flujo "Agregar integrante") queda
     aparte para poder repetir ese recorrido; Nicolás Aguirre figura PENDIENTE en la cuenta completa
     (10 / 10) y EXPIRADO en la parcial (5 / 10). */
  var JUAN = m("Juan Medina", "administrador", true, "pendiente");
  var NICOLAS_EXPIRADO = m("Nicolás Aguirre", "administrador", false, "expirado");
  var MUESTRA = [
    m("Martina Suárez", "administrador", true, "activo"),
    m("Lucía Ferreyra", "tecnica", true, "pendiente"),
    m("Federico Ibarra", "facturacion", false, "activo"),
    m("Nicolás Aguirre", "administrador", false, "pendiente"),
    JUAN,
    m("Sofía Paredes", "facturacion", true, "pendiente"),
    m("Gonzalo Acosta", "administrador", false, "activo"),
    m("Julieta Navarro", "tecnica", true, "pendiente"),
    m("Ramiro Vega", "facturacion", false, "expirado"),
    m("Milagros Cabrera", "administrador", false, "pendiente")
  ];
  var SIN_JUAN = MUESTRA.filter(function (x) { return x !== JUAN; });

  function copia(lista) { return lista.map(function (x) { return Object.assign({}, x); }); }
  function preset(n) {
    if (n <= 0) return [];
    if (n === 1) return copia([JUAN]);
    if (n === 5) return copia([MUESTRA[0], MUESTRA[1], MUESTRA[2], NICOLAS_EXPIRADO, JUAN]);
    if (n >= LIMITE) return copia(MUESTRA);
    return copia(SIN_JUAN.slice(0, n));
  }
  function buscar(mail) {
    for (var i = 0; i < miembros.length; i++) if (miembros[i].email === mail) return miembros[i];
    return null;
  }

  /* Cuentas ajenas en las que participa el usuario (pestaña "Asignado a otras cuentas") */
  function nuevaCuenta(cliente, titular, rol, soporte, est) {
    var slug = titular.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, ".");
    return { cliente: cliente, titular: titular, email: slug + "@example.com", rol: rol, soporte: soporte, estado: est };
  }
  var CUENTAS = [
    nuevaCuenta("847213", "Valeria Cardozo", "tecnica", false, "activo"),
    nuevaCuenta("562908", "Emiliano Duarte", "facturacion", true, "pendiente"),
    nuevaCuenta("390417", "Bárbara Núñez", "administrador", false, "expirado")
  ];
  var cuentas = copia(CUENTAS);
  var fijoC = params.get("cuentas");
  if (fijoC === "0") cuentas = [];
  function buscarCuenta(cliente) {
    for (var i = 0; i < cuentas.length; i++) if (cuentas[i].cliente === cliente) return cuentas[i];
    return null;
  }
  var tabActiva = "mi";           /* "mi" | "otras" */

  var miembros = [];
  var fijoN = params.get("integrantes");
  if (fijoN !== null && /^\d+$/.test(fijoN) && Number(fijoN) <= LIMITE) miembros = preset(Number(fijoN));

  var orden = { col: null, dir: null };   /* col: "nombre" | "rol"; dir: "asc" | "desc" */
  var ordenOtras = { col: null, dir: null };   /* col: "titular" | "rol" */

  /* ---------- Vista 1: carga de la lista ---------- */
  var cargaTimer;
  function textoCarga() {
    return miembros.length === 0
      ? "Integrantes cargados. Tu cuenta no tiene integrantes todavía."
      : "Integrantes cargados. Tu cuenta tiene " + miembros.length + " de " + LIMITE + " integrantes.";
  }
  function setPaso(n) {
    body.setAttribute("data-paso", String(n));
    panel.setAttribute("aria-busy", n === 0 ? "true" : "false");
    estado.textContent = n === 0 ? "Cargando integrantes…" : textoCarga();
    marcarIntegrantes();
  }

  /* ---------- Lista: tabla (desktop) y tarjetas (mobile) ---------- */
  var contador = document.getElementById("contador");
  var tbody = document.getElementById("tbody");
  var cards = document.getElementById("cards");
  var cabeceras = document.querySelectorAll("#tabla th[aria-sort]");

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  }
  function ordenados() {
    var l = miembros.map(function (x, i) { return { x: x, i: i }; });
    if (orden.col) {
      var k = function (o) { return orden.col === "rol" ? ROLES[o.x.rol] : o.x.nombre; };
      l.sort(function (a, b) {
        var c = k(a).localeCompare(k(b), "es", { sensitivity: "base" });
        if (orden.dir === "desc") c = -c;
        return c || a.i - b.i;
      });
    }
    return l.map(function (o) { return o.x; });
  }

  /* Botón de ícono de una fila. attrs: atributos ya escapados (data-accion, data-menu…) */
  function botonIcono(icono, etiqueta, attrs) {
    return '<button class="btn btn--ghost btn--primary btn--sm btn--icon" type="button" aria-label="' + esc(etiqueta) + '" ' + attrs +
      '><svg class="icon icon--16" aria-hidden="true"><use href="#i-' + icono + '"/></svg></button>';
  }
  function accionesDe(x) {
    var d = 'data-email="' + esc(x.email) + '"';
    var a = "";
    if (x.estado === "activo") a += botonIcono("edit", "Editar a " + x.nombre, 'data-accion="editar" ' + d);
    if (x.estado === "pendiente") a += botonIcono("forward-to-inbox", "Reenviar la invitación a " + x.nombre, 'data-accion="reenviar" ' + d);
    a += botonIcono("delete", (x.estado === "activo" ? "Eliminar a " : "Eliminar la invitación de ") + x.nombre, 'data-accion="eliminar" ' + d);
    return a;
  }
  function badgeDe(x) {
    var e = ESTADOS[x.estado];
    return '<span class="badge ' + e.clase + '">' + e.texto + "</span>";
  }
  function siNo(v) { return v ? "Sí" : "No"; }

  /* "Cuentas asociadas" (define qué variante del menú del avatar se muestra, ver cuenta.js): la cuenta tiene algún
     integrante o invitación enviada, o el usuario aceptó participar en una cuenta ajena. Una invitación recibida
     todavía pendiente o expirada no cuenta: todavía no la aceptó. */
  function actualizarAsociacion() {
    var ajenas = cuentas.some(function (c) { return c.estado === "activo"; });
    body.setAttribute("data-asociada", miembros.length > 0 || ajenas ? "si" : "no");
    body.setAttribute("data-ajenas", ajenas ? "si" : "no");   /* hay cuentas ajenas a las que entrar: el menú de la cuenta suma "Cambiar cuenta" */
  }

  function renderMiembros() {
    actualizarAsociacion();
    var l = ordenados();
    var n = miembros.length;
    var lleno = n >= LIMITE;

    body.setAttribute("data-n", String(n));
    contador.textContent = n + " / " + LIMITE;
    contador.className = "badge " + (lleno ? "badge--warning-solid" : "badge--info-solid");

    /* Con 10 / 10 el botón queda deshabilitado (opacidad .6, como en Figma) pero sigue siendo enfocable
       para que un lector de pantalla pueda explicar por qué. */
    if (lleno) {
      btnAgregar.setAttribute("aria-disabled", "true");
      btnAgregar.setAttribute("aria-describedby", "contador contador-sr");
    } else {
      btnAgregar.removeAttribute("aria-disabled");
      btnAgregar.removeAttribute("aria-describedby");
    }

    tbody.innerHTML = l.map(function (x) {
      return "<tr>" +
        '<td><div class="celda-nombre"><strong>' + esc(x.nombre) + "</strong><span>" + esc(x.email) + "</span></div></td>" +
        "<td>" + esc(ROLES[x.rol]) + "</td>" +
        "<td>" + siNo(x.soporte) + "</td>" +
        "<td>" + badgeDe(x) + "</td>" +
        '<td><div class="acciones">' + accionesDe(x) + "</div></td>" +
        "</tr>";
    }).join("");

    cards.innerHTML = l.map(function (x) {
      return '<li class="member-card">' +
        '<div class="member-card__head"><span class="member-card__name">' + esc(x.nombre) + "</span>" +
        '<div class="member-card__status">' + badgeDe(x) +
        botonIcono("more-vert", "Acciones de " + x.nombre, 'data-menu="' + esc(x.email) + '" aria-haspopup="menu" aria-expanded="false"') + "</div></div>" +
        '<dl class="member-card__rows">' +
        '<div class="member-card__row"><dt>Email</dt><dd>' + esc(x.email) + "</dd></div>" +
        '<div class="member-card__row"><dt>Rol</dt><dd>' + esc(ROLES[x.rol]) + "</dd></div>" +
        '<div class="member-card__row"><dt>Acceso a soporte</dt><dd>' + siNo(x.soporte) + "</dd></div>" +
        "</dl></li>";
    }).join("");

    Array.prototype.forEach.call(cabeceras, function (th) {
      var col = th.querySelector("[data-orden]").getAttribute("data-orden");
      var dir = orden.col === col ? orden.dir : null;
      th.setAttribute("aria-sort", dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none");
      th.querySelector("use").setAttribute("href", "#i-" + (dir === "asc" ? "arrow-upward" : dir === "desc" ? "arrow-downward" : "import-export"));
    });
    marcarIntegrantes();
  }

  /* Ordenar: sin orden → ascendente → descendente → sin orden */
  document.getElementById("tabla").addEventListener("click", function (e) {
    var b = e.target.closest("[data-orden]");
    if (!b) return;
    var col = b.getAttribute("data-orden");
    if (orden.col !== col) { orden = { col: col, dir: "asc" }; }
    else if (orden.dir === "asc") { orden.dir = "desc"; }
    else { orden = { col: null, dir: null }; }
    renderMiembros();
    var nuevo = document.querySelector('[data-orden="' + col + '"]');
    if (nuevo) nuevo.focus();
    var th = nuevo && nuevo.closest("th");
    var d = th && th.getAttribute("aria-sort");
    estado.textContent = d === "ascending" ? "Ordenado de la A a la Z." : d === "descending" ? "Ordenado de la Z a la A." : "Orden original.";
  });

  /* ---------- Pestaña 2: cuentas ajenas ---------- */
  var tbodyOtras = document.getElementById("tbody-otras");
  var cardsOtras = document.getElementById("cards-otras");
  var cabecerasOtras = document.querySelectorAll("#tabla-otras th[aria-sort]");
  var otrasTimer;
  var otrasListas = false;        /* la carga simulada ocurre una sola vez por visita */

  function setPasoOtras(n) {
    panelOtras.setAttribute("data-paso", String(n));
    panelOtras.setAttribute("aria-busy", n === 0 ? "true" : "false");
    estado.textContent = n === 0
      ? "Cargando cuentas…"
      : cuentas.length === 0 ? "Cuentas cargadas. Todavía no participas en ninguna cuenta." : "Cuentas cargadas. Participas en " + cuentas.length + (cuentas.length === 1 ? " cuenta." : " cuentas.");
    marcarOtras();
  }
  function iniciarCargaOtras() {
    if (otrasListas) return;
    otrasListas = true;
    setPasoOtras(0);
    window.clearTimeout(otrasTimer);
    otrasTimer = window.setTimeout(function () { setPasoOtras(1); }, 1400);
  }
  function accionesDeCuenta(x) {
    var d = 'data-cuenta="' + esc(x.cliente) + '"';
    if (x.estado === "activo") return botonIcono("logout", "Abandonar la cuenta de " + x.titular, 'data-accion="abandonar" ' + d);
    if (x.estado === "pendiente") {
      return botonIcono("check", "Aceptar la invitación de " + x.titular, 'data-accion="aceptar" ' + d) +
        botonIcono("close", "Rechazar la invitación de " + x.titular, 'data-accion="rechazar" ' + d);
    }
    return botonIcono("delete", "Eliminar la invitación de " + x.titular, 'data-accion="eliminar" ' + d);
  }
  function ordenadasOtras() {
    var l = cuentas.map(function (x, i) { return { x: x, i: i }; });
    if (ordenOtras.col) {
      var k = function (o) { return ordenOtras.col === "rol" ? ROLES[o.x.rol] : o.x.titular; };
      l.sort(function (a, b) {
        var r = k(a).localeCompare(k(b), "es", { sensitivity: "base" });
        if (ordenOtras.dir === "desc") r = -r;
        return r || a.i - b.i;
      });
    }
    return l.map(function (o) { return o.x; });
  }
  function renderCuentas() {
    actualizarAsociacion();
    var l = ordenadasOtras();
    panelOtras.setAttribute("data-n", String(cuentas.length));

    tbodyOtras.innerHTML = l.map(function (x) {
      return "<tr>" +
        "<td>" + esc(x.cliente) + "</td>" +
        '<td><div class="celda-nombre"><strong>' + esc(x.titular) + "</strong><span>" + esc(x.email) + "</span></div></td>" +
        "<td>" + esc(ROLES[x.rol]) + "</td>" +
        "<td>" + siNo(x.soporte) + "</td>" +
        "<td>" + badgeDe(x) + "</td>" +
        '<td><div class="acciones">' + accionesDeCuenta(x) + "</div></td>" +
        "</tr>";
    }).join("");

    cardsOtras.innerHTML = l.map(function (x) {
      return '<li class="member-card">' +
        '<div class="member-card__head"><span class="member-card__name">' + esc(x.titular) + "</span>" +
        '<div class="member-card__status">' + badgeDe(x) +
        botonIcono("more-vert", "Acciones de la cuenta de " + x.titular, 'data-menu-cuenta="' + esc(x.cliente) + '" aria-haspopup="menu" aria-expanded="false"') + "</div></div>" +
        '<dl class="member-card__rows">' +
        '<div class="member-card__row"><dt># Cliente</dt><dd>' + esc(x.cliente) + "</dd></div>" +
        '<div class="member-card__row"><dt>Email</dt><dd>' + esc(x.email) + "</dd></div>" +
        '<div class="member-card__row"><dt>Rol</dt><dd>' + esc(ROLES[x.rol]) + "</dd></div>" +
        '<div class="member-card__row"><dt>Acceso a soporte</dt><dd>' + siNo(x.soporte) + "</dd></div>" +
        "</dl></li>";
    }).join("");

    Array.prototype.forEach.call(cabecerasOtras, function (th) {
      var col = th.querySelector("[data-orden-otras]").getAttribute("data-orden-otras");
      var dir = ordenOtras.col === col ? ordenOtras.dir : null;
      th.setAttribute("aria-sort", dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none");
      th.querySelector("use").setAttribute("href", "#i-" + (dir === "asc" ? "arrow-upward" : dir === "desc" ? "arrow-downward" : "import-export"));
    });
    marcarOtras();
  }
  document.getElementById("tabla-otras").addEventListener("click", function (e) {
    var b = e.target.closest("[data-orden-otras]");
    if (!b) return;
    var col = b.getAttribute("data-orden-otras");
    if (ordenOtras.col !== col) { ordenOtras = { col: col, dir: "asc" }; }
    else if (ordenOtras.dir === "asc") { ordenOtras.dir = "desc"; }
    else { ordenOtras = { col: null, dir: null }; }
    renderCuentas();
    var nuevo = document.querySelector('[data-orden-otras="' + col + '"]');
    if (nuevo) nuevo.focus();
    var th = nuevo && nuevo.closest("th");
    var d = th && th.getAttribute("aria-sort");
    estado.textContent = d === "ascending" ? "Ordenado de la A a la Z." : d === "descending" ? "Ordenado de la Z a la A." : "Orden original.";
  });

  /* ---------- Pestañas ---------- */
  function aplicarTab(t) {
    tabActiva = t === "otras" ? "otras" : "mi";
    var otras = tabActiva === "otras";
    tabMi.setAttribute("aria-selected", otras ? "false" : "true");
    tabMi.tabIndex = otras ? -1 : 0;
    tabOtras.setAttribute("aria-selected", otras ? "true" : "false");
    tabOtras.tabIndex = otras ? 0 : -1;
    panel.hidden = otras;
    panelOtras.hidden = !otras;
    if (otras) iniciarCargaOtras();
    if (body.getAttribute("data-vista") === "lista" || !body.getAttribute("data-vista")) document.title = titulos[otras ? "otras" : "lista"];
    if (typeof actualizarGrupos === "function") actualizarGrupos(body.getAttribute("data-vista") || "lista");
  }
  /* El cambio de pestaña no suma entradas al historial; la URL queda compartible (#otras-cuentas) */
  function elegirTab(t, enfocar) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search + (t === "otras" ? "#otras-cuentas" : ""));
    aplicarTab(t);
    if (enfocar) (t === "otras" ? tabOtras : tabMi).focus();
  }
  tabMi.addEventListener("click", function () { elegirTab("mi", false); });
  tabOtras.addEventListener("click", function () { elegirTab("otras", false); });
  document.querySelector(".tabs").addEventListener("keydown", function (e) {
    var k = e.key;
    if (k !== "ArrowLeft" && k !== "ArrowRight" && k !== "Home" && k !== "End") return;
    e.preventDefault();
    var haciaOtras = k === "End" || (k === "ArrowRight" && tabActiva === "mi") || (k === "ArrowLeft" && tabActiva === "mi");
    if (k === "Home") haciaOtras = false;
    elegirTab(haciaOtras ? "otras" : "mi", true);
  });

  /* ---------- Aviso de lo que todavía no está armado (se elimina al completar el prototipo) ---------- */
  var timer;
  function avisar(msg) {
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

  /* ---------- Toast de éxito ---------- */
  var toastOk = document.getElementById("toast-ok");
  var toastOkMsg = document.getElementById("toast-ok-msg");
  var timerOk;
  function exito(msg) {
    window.clearTimeout(timerOk);
    toastOk.classList.remove("is-visible");
    toastOkMsg.textContent = "";                 /* se vacía primero para que el lector lo anuncie otra vez */
    window.setTimeout(function () {
      toastOkMsg.textContent = msg;
      toastOk.classList.add("is-visible");
      timerOk = window.setTimeout(function () { toastOk.classList.remove("is-visible"); }, 6000);
    }, 30);
  }

  /* ---------- Navegación entre vistas (hash) ---------- */
  var probar = document.getElementById("probar");
  var grupos = {
    agregar: document.getElementById("probar-agregar"),
    editar: document.getElementById("probar-editar"),
    lista: document.getElementById("probar-lista"),
    otras: document.getElementById("probar-otras")
  };
  var entroDesdeLista = false;

  function rutaActual() {
    var h = window.location.hash;
    if (h === "#agregar") return { vista: "agregar" };
    if (h === "#otras-cuentas") return { vista: "lista", tab: "otras" };
    if (h.indexOf("#editar/") === 0) {
      var mail = "";
      try { mail = decodeURIComponent(h.slice(8)); } catch (err) { mail = ""; }
      return { vista: "editar", email: mail };
    }
    return { vista: "lista" };
  }
  function vistaActual() { return rutaActual().vista; }

  function volverALaListaSinHistorial(aviso) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    if (aviso) estado.textContent = aviso;
  }

  function render(nombre, conFoco) {
    var ruta = rutaActual();
    /* Con la autenticación de dos factores desactivada (?2fa=off) no se puede invitar ni editar: solo existe la pantalla bloqueada */
    if (body.getAttribute("data-2fa") === "off" && nombre !== "lista") {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      nombre = "lista";
    }
    /* Con la cuenta completa no se puede invitar a nadie más: si llegan por URL, vuelven a la lista */
    if (nombre === "agregar" && miembros.length >= LIMITE) {
      volverALaListaSinHistorial("Alcanzaste el límite de " + LIMITE + " integrantes.");
      nombre = "lista";
    }
    /* Solo se edita a integrantes activos que existan */
    if (nombre === "editar") {
      var x = buscar(ruta.email);
      if (!x || x.estado !== "activo") {
        volverALaListaSinHistorial("No encontramos a ese integrante.");
        nombre = "lista";
      } else {
        llenarEditar(x);
      }
    }
    vistas.lista.hidden = nombre !== "lista";
    vistas.agregar.hidden = nombre !== "agregar";
    vistas.editar.hidden = nombre !== "editar";
    body.setAttribute("data-vista", nombre);
    document.title = titulos[nombre];
    if (nombre === "lista") aplicarTab(ruta.vista === "lista" ? ruta.tab : "mi");
    document.title = nombre === "lista" && tabActiva === "otras" ? titulos.otras : titulos[nombre];
    actualizarGrupos(nombre);
    cerrarPanel();
    cerrarMenu(false);
    if (!conFoco) return;
    if (nombre === "agregar") {
      document.getElementById("agregar-title").focus({ preventScroll: true });
    } else if (nombre === "editar") {
      document.getElementById("editar-title").focus({ preventScroll: true });
    } else if (tabActiva === "otras") {
      tabOtras.focus({ preventScroll: true });
    } else {
      btnAgregar.focus({ preventScroll: true });
    }
    window.scrollTo(0, 0);
  }
  /* "Probar estados": cada vista (y cada pestaña) muestra su propio grupo */
  function actualizarGrupos(nombre) {
    grupos.agregar.hidden = nombre !== "agregar";
    grupos.editar.hidden = nombre !== "editar";
    grupos.lista.hidden = nombre !== "lista" || tabActiva === "otras";
    grupos.otras.hidden = nombre !== "lista" || tabActiva !== "otras";
  }

  function irALista() {
    if (entroDesdeLista) {
      window.history.back();
    } else {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      render("lista", true);
    }
  }

  btnAgregar.addEventListener("click", function (e) {
    if (miembros.length >= LIMITE) {
      e.preventDefault();
      estado.textContent = "Alcanzaste el límite de " + LIMITE + " integrantes.";
      return;
    }
    entroDesdeLista = true;
    window.location.hash = "agregar";
  });
  btnVolver.addEventListener("click", irALista);
  btnVolverEd.addEventListener("click", irALista);
  window.addEventListener("hashchange", function () { render(vistaActual(), true); });

  /* ---------- Vista 2: formulario "Agregar" ---------- */
  var form = document.getElementById("form-agregar");
  var campo = document.getElementById("field-email");
  var email = document.getElementById("email");
  var ayuda = document.getElementById("email-ayuda");

  var FORMATO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var MENSAJES = {
    requerido: "Campo requerido.",
    formato: "Email inválido.",
    noexiste: "Este email no existe.",
    generico: "No pudimos validar el email. Prueba de nuevo o contáctanos en la Mesa de ayuda.",
    /* Estado no diseñado en Figma: copy provisorio */
    duplicado: "Este email ya está en tu cuenta."
  };
  /* Direcciones de muestra: las mismas que usa el diseño en Figma */
  var MUESTRAS = {
    vacio: "",
    ok: "juan.medina@example.com",
    requerido: "",
    formato: "valentina.gimenez@dominio",
    noexiste: "usuario@dominio-inexistente.com",
    generico: "valentina.gimenez@example.com",
    duplicado: TITULAR_EMAIL
  };

  function yaExiste(v) {
    return v === TITULAR_EMAIL || miembros.some(function (x) { return x.email === v; });
  }

  /* Reglas del prototipo (no hay backend): decide qué estado de error corresponde */
  function validar(valor) {
    var v = valor.trim().toLowerCase();
    if (!v) return "requerido";
    if (!FORMATO.test(v)) return "formato";
    if (yaExiste(v)) return "duplicado";
    var partes = v.split("@");
    if (partes[1].indexOf("inexistente") !== -1) return "noexiste";
    if (v === MUESTRAS.generico || partes[0] === "error") return "generico";
    return null;
  }

  /* El diseño muestra al invitado con nombre y apellido: se arma a partir de la parte local del email
     ("juan.medina@…" → "Juan Medina"). */
  function nombreDesde(mail) {
    var local = mail.split("@")[0].split("+")[0];
    var palabras = local.split(/[._-]+/).map(function (p) { return p.replace(/\d+/g, ""); }).filter(Boolean);
    if (!palabras.length) palabras = [local];
    return palabras.map(function (p) { return p.charAt(0).toUpperCase() + p.slice(1); }).join(" ");
  }

  function mostrarError(tipo) {
    campo.classList.add("is-error");
    email.setAttribute("aria-invalid", "true");
    ayuda.textContent = MENSAJES[tipo];
  }
  function limpiarError() {
    campo.classList.remove("is-error");
    email.removeAttribute("aria-invalid");
    ayuda.textContent = "";
  }

  email.addEventListener("input", function () {
    if (campo.classList.contains("is-error")) limpiarError();
    marcarEstado(null);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var tipo = validar(email.value);
    if (tipo) {
      mostrarError(tipo);
      email.focus();
      return;
    }
    limpiarError();
    var mail = email.value.trim().toLowerCase();
    miembros.push({
      nombre: nombreDesde(mail),
      email: mail,
      rol: form.elements.rol.value,
      soporte: form.elements.soporte.checked,
      estado: "pendiente"
    });
    form.reset();                       /* el próximo "Agregar integrante" arranca limpio */
    marcarEstado(null);
    renderMiembros();
    irALista();
    exito("Enviaste la invitación.");
  });

  /* ---------- Vista 3: "Editar integrante" ---------- */
  var formEd = document.getElementById("form-editar");
  var btnGuardar = document.getElementById("btn-guardar");
  var edEmail = document.getElementById("editar-email");
  var edBadges = formEd.querySelectorAll("[data-rol-actual]");
  var botonesEdicion = null;      /* se asigna junto con el panel "Probar estados" */
  var editando = null;            /* integrante que se está editando (el mismo objeto de la lista) */

  function llenarEditar(x) {
    editando = x;
    edEmail.textContent = x.email;
    formEd.elements["rol-ed"].value = x.rol;
    formEd.elements["soporte-ed"].checked = x.soporte;
    Array.prototype.forEach.call(edBadges, function (b) { b.hidden = b.getAttribute("data-rol-actual") !== x.rol; });
    actualizarEdicion();
  }
  function hayCambios() {
    return !!editando && (formEd.elements["rol-ed"].value !== editando.rol || formEd.elements["soporte-ed"].checked !== editando.soporte);
  }
  function actualizarEdicion() {
    var c = hayCambios();
    if (c) btnGuardar.removeAttribute("aria-disabled"); else btnGuardar.setAttribute("aria-disabled", "true");
    if (botonesEdicion) {
      Array.prototype.forEach.call(botonesEdicion, function (b) {
        var on = (b.getAttribute("data-edicion") === "con") === c;
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
  }
  formEd.addEventListener("change", actualizarEdicion);
  formEd.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!hayCambios()) {
      estado.textContent = "No hay cambios para guardar.";
      return;
    }
    editando.rol = formEd.elements["rol-ed"].value;
    editando.soporte = formEd.elements["soporte-ed"].checked;
    renderMiembros();
    irALista();
    exito("Guardaste los cambios.");
  });

  /* ---------- Menú de acciones de las tarjetas (mobile) ---------- */
  var menu = document.getElementById("menu");
  var menuDesde = null;           /* botón ⋮ que lo abrió */
  var menuScrollY = 0;            /* posición del scroll al abrirlo: solo se cierra si la página se mueve de verdad */

  function itemsDe(x) {
    if (x.estado === "activo") return [["editar", "edit", "Editar integrante"], ["eliminar", "delete", "Eliminar integrante"]];
    if (x.estado === "pendiente") return [["reenviar", "forward-to-inbox", "Reenviar invitación"], ["eliminar", "delete", "Eliminar invitación"]];
    return [["eliminar", "delete", "Eliminar invitación"]];
  }
  function itemsDeCuenta(x) {
    if (x.estado === "activo") return [["abandonar", "logout", "Abandonar cuenta"]];
    if (x.estado === "pendiente") return [["aceptar", "check", "Aceptar invitación"], ["rechazar", "close", "Rechazar invitación"]];
    return [["eliminar", "delete", "Eliminar invitación"]];   /* Figma dibuja "logout" en este ítem; la tabla usa el tacho */
  }
  function abrirMenu(btn, x) {
    cerrarMenu(false);
    var deCuenta = x.cliente !== undefined;
    var id = deCuenta ? 'data-cuenta="' + esc(x.cliente) + '"' : 'data-email="' + esc(x.email) + '"';
    menu.setAttribute("aria-label", deCuenta ? "Acciones de la cuenta" : "Acciones del integrante");
    menu.innerHTML = (deCuenta ? itemsDeCuenta(x) : itemsDe(x)).map(function (it) {
      return '<button class="menu__item" type="button" role="menuitem" data-accion="' + it[0] + '" ' + id + '>' +
        '<svg class="icon" aria-hidden="true"><use href="#i-' + it[1] + '"/></svg>' + it[2] + "</button>";
    }).join("");
    menu.hidden = false;
    var r = btn.getBoundingClientRect();
    var h = menu.offsetHeight;
    /* Posición medida en Figma (134:5061): el borde derecho del menú pasa 4 px del botón y su borde superior lo pisa 5 px */
    var left = Math.max(8, Math.min(r.right + 4 - menu.offsetWidth, window.innerWidth - menu.offsetWidth - 8));
    var top = r.bottom - 5;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top + 5 - h);   /* si no entra abajo, se abre hacia arriba */
    menu.style.left = left + "px";
    menu.style.top = top + "px";
    menuDesde = btn;
    menuScrollY = window.pageYOffset;
    btn.setAttribute("aria-expanded", "true");
    menu.querySelector(".menu__item").focus();
  }
  function cerrarMenu(devolverFoco) {
    if (menu.hidden) return;
    menu.hidden = true;
    if (menuDesde) {
      menuDesde.setAttribute("aria-expanded", "false");
      if (devolverFoco && document.contains(menuDesde)) menuDesde.focus();
    }
  }
  menu.addEventListener("keydown", function (e) {
    var items = Array.prototype.slice.call(menu.querySelectorAll(".menu__item"));
    var i = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    else if (e.key === "Home") { e.preventDefault(); items[0].focus(); }
    else if (e.key === "End") { e.preventDefault(); items[items.length - 1].focus(); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cerrarMenu(true); }
    else if (e.key === "Tab") { cerrarMenu(false); }
  });
  window.addEventListener("scroll", function () {
    if (Math.abs(window.pageYOffset - menuScrollY) > 2) cerrarMenu(false);
  }, true);
  window.addEventListener("resize", function () { cerrarMenu(false); });

  /* ---------- Modal de confirmación ---------- */
  var modal = document.getElementById("modal");
  var mTitulo = document.getElementById("modal-title");
  var mTexto = document.getElementById("modal-text");
  var mInfo = document.getElementById("modal-info");
  var mCancelar = document.getElementById("modal-cancelar");
  var mConfirmar = document.getElementById("modal-confirmar");
  var ctx = null;                 /* { accion, x, desde } */

  /* Qué dice y qué hace cada modal. x es un integrante (Mi cuenta) o una cuenta ajena (otra pestaña). */
  function especModal(accion, x) {
    if (x.cliente !== undefined) {                                   /* ----- cuenta ajena ----- */
      var quitar = function () { cuentas.splice(cuentas.indexOf(x), 1); };
      if (accion === "aceptar") {
        return { titulo: "Aceptar invitación", texto: "¿Aceptas la invitación a esta cuenta? Tendrás acceso con el rol asignado.",
          label: "Datos de la cuenta", filas: [["Titular", x.titular], ["Email del titular", x.email], ["Tu rol", ROLES[x.rol]], ["Acceso a soporte", siNo(x.soporte)]],
          boton: "Aceptar", color: "primary", ok: "Aceptaste la invitación.", aplicar: function () { x.estado = "activo"; }, dibujar: renderCuentas };
      }
      if (accion === "rechazar") {
        return { titulo: "Rechazar invitación", texto: "¿Rechazas la invitación a esta cuenta? Si cambias de opinión, pídele al Titular que te invite de nuevo.",
          label: "Datos de la cuenta", filas: [["Titular", x.titular], ["Email del titular", x.email]],
          boton: "Rechazar", color: "danger", ok: "Rechazaste la invitación.", aplicar: quitar, dibujar: renderCuentas };
      }
      if (accion === "abandonar") {
        return { titulo: "Abandonar cuenta", texto: "¿Seguro que quieres abandonar esta cuenta? Vas a perder el acceso. Si cambias de opinión, pídele al Titular que te invite de nuevo.",
          label: "Datos de la cuenta", filas: [["Titular", x.titular], ["Email del titular", x.email], ["Tu rol", ROLES[x.rol]]],
          boton: "Abandonar", color: "danger", ok: "Abandonaste la cuenta.", aplicar: quitar, dibujar: renderCuentas };
      }
      /* eliminar una invitación expirada: mismo modal que en Mi cuenta (Figma 496:23548); los datos son los de la tabla */
      return { titulo: "Eliminar invitación", texto: "¿Quieres eliminar esta invitación? Revisa los datos antes de continuar.",
        label: "Datos del integrante", filas: [["Email", x.email], ["Rol asignado", ROLES[x.rol]], ["Acceso a soporte", siNo(x.soporte)]],
        boton: "Eliminar", color: "danger", ok: "Eliminaste la invitación.", aplicar: quitar, dibujar: renderCuentas };
    }
    var datos = [["Email", x.email], ["Rol asignado", ROLES[x.rol]], ["Acceso a soporte", siNo(x.soporte)]];
    var sacar = function () { var i = miembros.indexOf(x); if (i !== -1) miembros.splice(i, 1); };
    if (accion === "reenviar") {
      return { titulo: "Reenviar invitación", texto: "¿Reenviamos la invitación a este integrante?", label: null, filas: [],
        boton: "Reenviar", color: "primary", ok: "Reenviaste la invitación.", aplicar: function () {}, dibujar: function () {} };
    }
    if (x.estado === "activo") {
      return { titulo: "Eliminar integrante", texto: "¿Quieres eliminar a este integrante? Va a perder el acceso a la cuenta. Si cambias de opinión, tendrás que invitarlo de nuevo.",
        label: "Datos del integrante", filas: datos, boton: "Eliminar", color: "danger", ok: "Eliminaste al integrante.", aplicar: sacar, dibujar: renderMiembros };
    }
    /* pendiente o expirado: Figma 496:21059 / 496:22880 */
    return { titulo: "Eliminar invitación", texto: "¿Quieres eliminar esta invitación? Revisa los datos antes de continuar.",
      label: "Datos del integrante", filas: datos, boton: "Eliminar", color: "danger", ok: "Eliminaste la invitación.", aplicar: sacar, dibujar: renderMiembros };
  }

  function abrirModal(accion, x, desde) {
    var spec = especModal(accion, x);
    ctx = { accion: accion, x: x, desde: desde, spec: spec };
    mTitulo.textContent = spec.titulo;
    mTexto.textContent = spec.texto;
    mInfo.hidden = !spec.label;
    document.getElementById("modal-info-label").textContent = spec.label || "";
    document.getElementById("modal-rows").innerHTML = spec.filas.map(function (f) {
      return '<div class="infobox__row"><dt>' + esc(f[0]) + "</dt><dd>" + esc(f[1]) + "</dd></div>";
    }).join("");
    mConfirmar.textContent = spec.boton;
    mConfirmar.className = "btn btn--solid btn--" + spec.color;
    modal.showModal();
    mCancelar.focus();              /* el foco arranca en la opción segura */
  }
  mConfirmar.addEventListener("click", function () {
    var c = ctx;
    if (!c) return;
    c.spec.aplicar();
    c.spec.dibujar();
    modal.close("confirmado");
    exito(c.spec.ok);
  });
  mCancelar.addEventListener("click", function () { modal.close("cancelado"); });
  document.getElementById("modal-cerrar").addEventListener("click", function () { modal.close("cancelado"); });
  modal.addEventListener("click", function (e) { if (e.target === modal) modal.close("cancelado"); });   /* clic en el fondo */
  modal.addEventListener("close", function () {
    var d = ctx && ctx.desde;
    ctx = null;
    if (d && document.contains(d)) d.focus();
    else (tabActiva === "otras" ? tabOtras : btnAgregar).focus({ preventScroll: true });
  });

  /* ---------- Acciones de la lista (íconos de la tabla y ítems del menú) ---------- */
  document.addEventListener("click", function (e) {
    var k = e.target.closest("[data-menu]");
    if (k) {
      if (!menu.hidden && menuDesde === k) { cerrarMenu(true); return; }
      var xm = buscar(k.getAttribute("data-menu"));
      if (xm) abrirMenu(k, xm);
      return;
    }
    var kc = e.target.closest("[data-menu-cuenta]");
    if (kc) {
      if (!menu.hidden && menuDesde === kc) { cerrarMenu(true); return; }
      var xc = buscarCuenta(kc.getAttribute("data-menu-cuenta"));
      if (xc) abrirMenu(kc, xc);
      return;
    }
    var a = e.target.closest("[data-accion]");
    if (a) {
      var x = a.hasAttribute("data-cuenta") ? buscarCuenta(a.getAttribute("data-cuenta")) : buscar(a.getAttribute("data-email"));
      if (!x) return;
      var desde = a.closest(".menu") ? menuDesde : a;
      var accion = a.getAttribute("data-accion");
      cerrarMenu(false);
      if (accion === "editar") {
        entroDesdeLista = true;
        window.location.hash = "editar/" + encodeURIComponent(x.email);
      } else {
        abrirModal(accion, x, desde);
      }
      return;
    }
    if (!menu.hidden && !menu.contains(e.target)) cerrarMenu(false);   /* clic afuera */
  });

  /* ---------- Herramienta "Probar estados" ---------- */
  var toggle = document.getElementById("probar-toggle");
  var panelProbar = document.getElementById("probar-panel");
  var botonesEstado = panelProbar.querySelectorAll("[data-estado]");
  var botonesIntegrantes = panelProbar.querySelectorAll("[data-integrantes]");
  botonesEdicion = panelProbar.querySelectorAll("[data-edicion]");
  var botonesOtras = panelProbar.querySelectorAll("[data-otras]");

  function abrirPanel() {
    panelProbar.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
  }
  function cerrarPanel() {
    panelProbar.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  }
  function marcarEstado(nombre) {
    Array.prototype.forEach.call(botonesEstado, function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-estado") === nombre ? "true" : "false");
    });
  }
  function marcarIntegrantes() {
    var cargando = body.getAttribute("data-paso") === "0";
    Array.prototype.forEach.call(botonesIntegrantes, function (b) {
      var v = b.getAttribute("data-integrantes");
      var on = v === "cargando" ? cargando : (!cargando && v === String(miembros.length));
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function marcarOtras() {
    if (!botonesOtras) return;
    var cargando = panelOtras.getAttribute("data-paso") === "0";
    Array.prototype.forEach.call(botonesOtras, function (b) {
      var v = b.getAttribute("data-otras");
      var on = v === "cargando" ? cargando : (!cargando && v === String(cuentas.length));
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  function aplicarOtras(v) {
    window.clearTimeout(otrasTimer);
    otrasListas = true;               /* lo elegido en el panel manda sobre la carga simulada */
    if (v === "cargando") { setPasoOtras(0); return; }
    cuentas = v === "0" ? [] : copia(CUENTAS);
    ordenOtras = { col: null, dir: null };
    renderCuentas();
    setPasoOtras(1);
  }

  function aplicarEstado(nombre) {
    if (!(nombre in MUESTRAS)) return;
    limpiarError();
    form.reset();                       /* vuelve a Administrador + soporte activado */
    var valor = MUESTRAS[nombre];
    if (nombre === "ok" && yaExiste(valor)) valor = "nuevo.integrante@example.com";   /* si "Juan Medina" ya está, otra dirección válida */
    email.value = valor;
    if (nombre !== "vacio" && nombre !== "ok") mostrarError(nombre === "requerido" ? "requerido" : validar(email.value));
    marcarEstado(nombre);
  }

  function aplicarIntegrantes(v) {
    window.clearTimeout(cargaTimer);
    if (v === "cargando") {
      setPaso(0);
      return;
    }
    miembros = preset(Number(v));
    orden = { col: null, dir: null };
    renderMiembros();
    setPaso(1);
  }

  function aplicarEdicion(v) {
    if (!editando) return;
    llenarEditar(editando);             /* vuelve a los valores guardados */
    if (v === "con") {
      var otro = editando.rol === "facturacion" ? "tecnica" : "facturacion";
      formEd.elements["rol-ed"].value = otro;
      actualizarEdicion();
    }
  }

  /* Abre un modal sobre el integrante o la cuenta adecuados; si no hay ninguno, parte de los datos de Figma */
  var DEMO = {
    reenviar: { cuenta: false, estados: ["pendiente"], accion: "reenviar" },
    eliminar: { cuenta: false, estados: ["activo"], accion: "eliminar" },
    "eliminar-invitacion": { cuenta: false, estados: ["expirado", "pendiente"], accion: "eliminar" },
    aceptar: { cuenta: true, estados: ["pendiente"], accion: "aceptar" },
    rechazar: { cuenta: true, estados: ["pendiente"], accion: "rechazar" },
    abandonar: { cuenta: true, estados: ["activo"], accion: "abandonar" },
    "eliminar-recibida": { cuenta: true, estados: ["expirado"], accion: "eliminar" }
  };
  function abrirModalDemo(tipo) {
    var d = DEMO[tipo];
    if (!d) return;
    var lista = d.cuenta ? cuentas : miembros;
    var x = null;
    for (var p = 0; p < d.estados.length && !x; p++) {
      x = lista.filter(function (y) { return y.estado === d.estados[p]; })[0] || null;
    }
    window.clearTimeout(cargaTimer);
    window.clearTimeout(otrasTimer);
    if (d.cuenta) {
      if (!x) { cuentas = copia(CUENTAS); renderCuentas(); x = cuentas.filter(function (y) { return y.estado === d.estados[0]; })[0]; }
      otrasListas = true;
      if (tabActiva !== "otras") elegirTab("otras", false);
      setPasoOtras(1);
    } else {
      if (!x) {
        miembros = preset(5);
        renderMiembros();
        setPaso(1);
        x = miembros.filter(function (y) { return y.estado === d.estados[0]; })[0];
      }
      if (tabActiva !== "mi") elegirTab("mi", false);
      if (body.getAttribute("data-paso") === "0") setPaso(1);
    }
    abrirModal(d.accion, x, toggle);
  }

  toggle.addEventListener("click", function () {
    if (panelProbar.hidden) abrirPanel(); else cerrarPanel();
  });
  panelProbar.addEventListener("click", function (e) {
    var b = e.target.closest("[data-estado]");
    if (b) { aplicarEstado(b.getAttribute("data-estado")); return; }
    b = e.target.closest("[data-integrantes]");
    if (b) { aplicarIntegrantes(b.getAttribute("data-integrantes")); return; }
    b = e.target.closest("[data-edicion]");
    if (b) { aplicarEdicion(b.getAttribute("data-edicion")); return; }
    b = e.target.closest("[data-otras]");
    if (b) { aplicarOtras(b.getAttribute("data-otras")); return; }
    b = e.target.closest("[data-modal]");
    if (b) { cerrarPanel(); abrirModalDemo(b.getAttribute("data-modal")); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panelProbar.hidden) { cerrarPanel(); toggle.focus(); }
  });
  document.addEventListener("click", function (e) {
    if (!panelProbar.hidden && !probar.contains(e.target)) cerrarPanel();
  });

  /* ---------- Arranque ---------- */
  renderMiembros();
  renderCuentas();
  setPasoOtras(1);
  var fijo = params.get("paso");
  if (fijo === "0" || fijo === "1") {
    setPaso(Number(fijo));
    setPasoOtras(Number(fijo));       /* congela también la carga de la otra pestaña */
    otrasListas = true;
  } else {
    setPaso(0);
    cargaTimer = window.setTimeout(function () { setPaso(1); }, 1400);
  }

  if (params.get("vista") === "agregar" && window.location.hash !== "#agregar") {
    /* enlace corto ?vista=agregar → se normaliza a #agregar */
    params.delete("vista");
    var q = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (q ? "?" + q : "") + "#agregar");
  }
  render(vistaActual(), false);
  var inicial = params.get("estado");
  if (inicial && vistaActual() === "agregar") aplicarEstado(inicial);
  var abierto = params.get("modal");
  if (abierto && vistaActual() === "lista" && DEMO[abierto]) {
    window.clearTimeout(cargaTimer);
    setPaso(1);
    abrirModalDemo(abierto);
  }
})();
