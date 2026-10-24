/* Prototipo · Referidos · "Actividad y pagos" con datos
   Figma (ALC): "… · Tab Actividad y pagos · Con datos" (499:27924 desktop / 499:28680 mobile), "· Con datos · Búsqueda sin resultados" (499:30356 / 499:29379)
   y "· Tope de comisión alcanzado" (969:27911 / 969:27948).

   Cómo se llega a cada caso:
     Con datos                  etapa 4 "Referidos registrados y con compras" (Probar estados → Etapa del flujo) y la pestaña "Actividad y pagos".
     Búsqueda sin resultados    en "Actividad de referidos", escribir un cliente que no está (por ejemplo "Roberto Gómez") y tocar la lupa o Enter.
     Tope de comisión           no se puede alcanzar solo (no hay compras reales): Probar estados → Pestaña → "tope de comisión", o ?tab=actividad&tope=1.
   Las etapas 1 a 3 muestran "Sin datos" (todo en cero y tablas vacías).
   Etapa 5 "Después de cobrar" (Figma 499:36623 / 499:37118): saldo en USD 0, barra vacía, botones de cobro deshabilitados y el primer movimiento (USD 45,00)
   ya acreditado el 19/06/2026 y la primera fila de referidos en "Pagado". Se llega desde el modal "Retiro de comisiones" (js/cobro.js: Confirmar solicitud → "¡Tu cobro va en camino!" → Entendido), que
   actualiza la pantalla en el lugar (sin volver a cargar: la barra y el número bajan a 0), o desde Probar estados.

   Datos: todos inventados. Las cinco primeras filas de cada tabla son las de Figma; el resto las sumé para que haya 12 referidos y 9 cobros
   y para que las cuentas cierren (comisiones sin cancelar = USD 500; disponible = USD 45 = 18 % del máximo de USD 250).
   Animación de entrada: cuando se levanta el velo de "Cargando", la barra se llena desde 0 y los números cuentan hasta su valor final (0,9 s).
   Con "reducir movimiento" activado en el sistema, los valores aparecen directo. Los números animados son decorativos (aria-hidden): los lectores de pantalla leen el valor final. */
(function () {
  "use strict";
  var R = window.NubixRef;
  var panel = document.getElementById("panel-actividad");
  if (!R || !panel) return;

  var SVG = "http://www.w3.org/2000/svg";
  var DURACION = 900;
  var estado = document.getElementById("estado");

  /* ---------- datos (ficticios) ---------- */
  var MAIL = "ejemplo@email.com";
  var REF = [
    { id: 1, nombre: "Martín Suárez", uso: "2026-03-15", disp: "2026-04-29", estado: "disponible", monto: 45 },
    { id: 2, nombre: "Florencia Ramírez", uso: "2026-03-22", disp: "2026-05-06", estado: "pendiente", monto: 90 },
    { id: 3, nombre: "Diego Fernández", uso: "2026-03-28", disp: "2026-05-12", estado: "solicitado", monto: 15 },
    { id: 4, nombre: "Valentina Pereyra", uso: "2026-04-02", disp: "2026-05-17", estado: "pagado", monto: 60 },
    { id: 5, nombre: "Nicolás Bianchi", uso: "2026-04-09", disp: "2026-05-24", estado: "cancelado", monto: 22, nota: "Compra reembolsada" },
    { id: 6, nombre: "Lucía Gómez", uso: "2026-04-14", disp: "2026-05-29", estado: "pagado", monto: 30 },
    { id: 7, nombre: "Tomás Herrera", uso: "2026-04-20", disp: "2026-06-04", estado: "pagado", monto: 80 },
    { id: 8, nombre: "Camila Torres", uso: "2026-04-27", disp: "2026-06-11", estado: "pagado", monto: 55 },
    { id: 9, nombre: "Julián Acosta", uso: "2026-05-03", disp: "2026-06-17", estado: "pagado", monto: 40 },
    { id: 10, nombre: "Agustina Ruiz", uso: "2026-05-11", disp: "2026-06-25", estado: "pendiente", monto: 35 },
    { id: 11, nombre: "Facundo Molina", uso: "2026-05-18", disp: "2026-07-02", estado: "pendiente", monto: 50 },
    { id: 12, nombre: "Paula Giménez", uso: "2026-05-26", disp: "2026-07-10", estado: "cancelado", monto: 18, nota: "Compra reembolsada" }
  ];
  REF.forEach(function (r) { r.codigo = "mansi2026"; r.email = MAIL; });
  var MOV = [
    { id: 1, sol: "2026-06-18", metodo: "Saldo", acred: null, estado: "pendiente", monto: 45 },
    { id: 2, sol: "2026-06-05", metodo: "Transferencia bancaria", acred: null, estado: "aprobado", monto: 90 },
    { id: 3, sol: "2026-05-15", metodo: "Saldo", acred: "2026-05-22", estado: "acreditado", monto: 210 },
    { id: 4, sol: "2026-04-15", metodo: "Transferencia bancaria", acred: null, estado: "rechazado", monto: 60, nota: "Titular no coincide" },
    { id: 5, sol: "2026-03-15", metodo: "Saldo", acred: "2026-03-22", estado: "acreditado", monto: 150 },
    { id: 6, sol: "2026-02-10", metodo: "Saldo", acred: "2026-02-17", estado: "acreditado", monto: 70 },
    { id: 7, sol: "2026-01-20", metodo: "Transferencia bancaria", acred: "2026-01-28", estado: "acreditado", monto: 40 },
    { id: 8, sol: "2026-01-05", metodo: "Saldo", acred: "2026-01-12", estado: "acreditado", monto: 55 },
    { id: 9, sol: "2025-12-15", metodo: "Saldo", acred: "2025-12-22", estado: "acreditado", monto: 30 }
  ];
  var ESTADOS = {
    disponible: ["Disponible", "primary"], pendiente: ["Pendiente", "secondary"], solicitado: ["Solicitado", "info"],
    pagado: ["Pagado", "success"], cancelado: ["Cancelado", "danger"], retenido: ["Retenido", "warning"],
    aprobado: ["Aprobado", "info"], acreditado: ["Acreditado", "success"], rechazado: ["Rechazado", "danger"]
  };

  /* ---------- estado ---------- */
  var tope = false;       /* "Tope de comisión alcanzado": solo desde Probar estados o ?tope=1 */
  var enError = false;    /* con "Error al cargar" el panel vuelve a la vista sin datos */
  var raf = 0;

  var MINIMO = 30;        /* cobro mínimo: con menos saldo los botones de cobro quedan deshabilitados */
  var enPlace = false;    /* cambio de etapa hecho desde el modal de cobro: se actualiza sin volver a cargar */
  function modo() {
    if (enError || (R.etapa() !== "referidos" && R.etapa() !== "cobrado")) return "sin";
    if (R.etapa() === "cobrado") return "cobrado";
    return tope ? "tope" : "con";
  }
  function metas() {
    var m = modo();
    if (m === "cobrado") return { monto: 0, acum: 500, total: 12, p: 0 };
    if (m === "tope") return { monto: 250, acum: 500, total: 12, p: 100 };
    if (m === "con") return { monto: 45, acum: 500, total: 12, p: 18 };
    return { monto: 0, acum: 0, total: 0, p: 0 };
  }

  /* ---------- helpers ---------- */
  function $(sel, ctx) { return (ctx || panel).querySelector(sel); }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function fecha(iso) { if (!iso) return "-"; var p = iso.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }
  function usd(n) { return "USD " + n.toFixed(2).replace(".", ","); }
  function norm(s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); }
  function anunciar(msg) {
    if (!estado) return;
    estado.textContent = "";
    window.setTimeout(function () { estado.textContent = msg; }, 30);
  }
  function badge(clave) {
    var e = ESTADOS[clave];
    return el("span", "badge badge--" + e[1] + "-solid", e[0]);
  }
  /* Copia de la fila con los cambios que trae el modo: en "tope" el primer referido queda retenido; en "cobrado" el primer cobro ya está acreditado */
  function adaptar(t, r) {
    var c = {}, k;
    for (k in r) c[k] = r[k];
    if (t.clave === "ref" && modo() === "tope" && r.id === 1) { c.estado = "retenido"; c.nota = "Se libera al cobrar"; }
    if (t.clave === "mov" && modo() === "cobrado" && r.id === 1) { c.estado = "acreditado"; c.acred = "2026-06-19"; }
    if (t.clave === "ref" && modo() === "cobrado" && r.id === 1) c.estado = "pagado";      /* los USD 45 ya se cobraron */
    return c;
  }
  function vista(r) { return { estado: r.estado, nota: r.nota || "" }; }

  /* ---------- filas (desktop) y tarjetas (mobile) ---------- */
  function estadoCelda(v) {
    var d = el("div", "ap-est");
    d.appendChild(badge(v.estado));
    if (v.nota) d.appendChild(el("span", "ap-est__nota", v.nota));
    return d;
  }
  function filaRef(r, v) {
    var tr = el("tr", v.nota ? "has-nota" : "");
    tr.appendChild(el("td", "", r.codigo));
    var c = el("td"); var n = el("div", "ap-cli"); n.appendChild(el("strong", "", r.nombre)); n.appendChild(el("span", "ap-cli__mail", r.email)); c.appendChild(n); tr.appendChild(c);
    tr.appendChild(el("td", "", fecha(r.uso)));
    tr.appendChild(el("td", "", fecha(r.disp)));
    var e = el("td"); e.appendChild(estadoCelda(v)); tr.appendChild(e);
    tr.appendChild(el("td", "ap-t__monto", usd(r.monto)));
    return tr;
  }
  function filaMov(r, v) {
    var tr = el("tr", v.nota ? "has-nota" : "");
    tr.appendChild(el("td", "", fecha(r.sol)));
    tr.appendChild(el("td", "", r.metodo));
    tr.appendChild(el("td", "", fecha(r.acred)));
    var e = el("td"); e.appendChild(estadoCelda(v)); tr.appendChild(e);
    tr.appendChild(el("td", "ap-t__monto", usd(r.monto)));
    return tr;
  }
  function campo(dl, etiqueta, valor, fuerte) {
    var d = el("div");
    d.appendChild(el("dt", "", etiqueta));
    d.appendChild(el("dd", fuerte ? "is-strong" : "", valor));
    dl.appendChild(d);
  }
  function tarjeta(titulo, v, campos) {
    var li = el("li", "ap-c");
    var h = el("div", "ap-c__head" + (v.nota ? " has-nota" : ""));
    h.appendChild(el("strong", "", titulo));
    h.appendChild(estadoCelda(v));
    li.appendChild(h);
    li.appendChild(el("hr", "ap-c__sep"));
    var dl = el("dl", "ap-c__dl");
    campos(dl);
    li.appendChild(dl);
    return li;
  }
  function tarjetaRef(r, v) {
    return tarjeta(r.nombre, v, function (dl) {
      campo(dl, "Código cupón", r.codigo); campo(dl, "Email", r.email); campo(dl, "Fecha de uso", fecha(r.uso));
      campo(dl, "Disponible desde", fecha(r.disp)); campo(dl, "Comisión", usd(r.monto), true);
    });
  }
  function tarjetaMov(r, v) {
    return tarjeta(usd(r.monto), v, function (dl) {
      campo(dl, "Fecha de solicitud", fecha(r.sol)); campo(dl, "Método", r.metodo); campo(dl, "Fecha de acreditación", fecha(r.acred));
    });
  }

  /* ---------- tablas ---------- */
  var tablas = {
    ref: { clave: "ref", datos: REF, orden: { col: "uso", dir: 1 }, tam: 5, pag: 1, q: "", fila: filaRef, tarjeta: tarjetaRef },
    mov: { clave: "mov", datos: MOV, orden: { col: "sol", dir: -1 }, tam: 5, pag: 1, q: "", fila: filaMov, tarjeta: tarjetaMov }
  };
  tablas.ref.body = document.getElementById("ap-ref");
  tablas.mov.body = document.getElementById("ap-mov");

  function ordenar(lista, col, dir) {
    return lista.slice().sort(function (a, b) {
      var x = a[col], y = b[col];
      if (!x && !y) return 0;
      if (!x) return 1;           /* las fechas vacías ("-") quedan siempre al final */
      if (!y) return -1;
      return x < y ? -dir : x > y ? dir : 0;
    });
  }
  function render(t) {
    var body = t.body;
    if (modo() === "sin") { body.setAttribute("data-v", "vacio"); return; }
    var lista = t.datos.map(function (r) { return adaptar(t, r); });
    if (t.q) lista = lista.filter(function (r) { return norm(r.nombre + " " + r.email).indexOf(t.q) >= 0; });
    if (!lista.length) { body.setAttribute("data-v", "sin-resultados"); return; }
    body.setAttribute("data-v", "datos");
    lista = ordenar(lista, t.orden.col, t.orden.dir);
    var total = lista.length, paginas = Math.max(1, Math.ceil(total / t.tam));
    if (t.pag > paginas) t.pag = paginas;
    var ini = (t.pag - 1) * t.tam, fin = Math.min(total, ini + t.tam);
    var tbody = $("tbody", body), cards = $(".ap-cards", body);
    tbody.textContent = ""; cards.textContent = "";
    lista.slice(ini, fin).forEach(function (r) {
      var v = vista(r);
      tbody.appendChild(t.fila(r, v));
      cards.appendChild(t.tarjeta(r, v));
    });
    $("[data-rango]", body).textContent = "Mostrando " + (ini + 1) + " a " + fin + " de " + total;
    var pg = $("[data-pagina]", body);
    pg.textContent = "";
    pg.appendChild(document.createTextNode("Página "));
    pg.appendChild(el("b", "", String(t.pag)));
    pg.appendChild(document.createTextNode(" de "));
    pg.appendChild(el("b", "", String(paginas)));
    var uno = t.pag <= 1, ultimo = t.pag >= paginas;
    var estados = { primera: uno, anterior: uno, siguiente: ultimo, ultima: ultimo };
    var botones = body.querySelectorAll("[data-pag]");
    var activo = document.activeElement;
    for (var i = 0; i < botones.length; i++) botones[i].disabled = estados[botones[i].getAttribute("data-pag")];
    if (activo && activo.disabled && body.contains(activo)) {          /* el botón apretado quedó deshabilitado: el foco pasa a su par */
      var ka = activo.getAttribute("data-pag");
      var par = body.querySelector('[data-pag="' + (ka === "primera" || ka === "anterior" ? "siguiente" : "anterior") + '"]');
      if (par && !par.disabled) par.focus();
    }
    var ths = body.querySelectorAll("th[data-col]");
    for (var j = 0; j < ths.length; j++) {
      var c = ths[j].getAttribute("data-col");
      ths[j].setAttribute("aria-sort", c === t.orden.col ? (t.orden.dir > 0 ? "ascending" : "descending") : "none");
    }
    $("[data-tam]", body).value = String(t.tam);
    $("[data-val]", body).textContent = String(t.tam);
  }

  /* ---------- números y barra ---------- */
  var monto = document.getElementById("ap-monto");
  var barra = document.getElementById("ap-barra");
  var relleno = barra.querySelector(".ap-bar__fill");
  var cuentas = { acum: $('[data-cuenta="acum"]'), total: $('[data-cuenta="total"]') };
  var lectores = { acum: $('[data-cuenta-sr="acum"]'), total: $('[data-cuenta-sr="total"]') };
  var transf = document.getElementById("ap-cobrar-transf");
  var saldo = document.getElementById("ap-cobrar-saldo");
  var reducir = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

  function pintar(v) {
    monto.textContent = "USD " + v.monto;
    cuentas.acum.textContent = "USD " + v.acum;
    cuentas.total.textContent = String(v.total);
  }
  function barraA(p, animada) {
    relleno.classList.toggle("is-reset", !animada);
    if (animada) void relleno.offsetWidth;              /* arranca la transición desde donde está */
    relleno.style.setProperty("--p", String(p));
  }
  function ceros() {
    window.cancelAnimationFrame(raf);
    barraA(0, false);
    pintar({ monto: 0, acum: 0, total: 0 });
  }
  function final() {
    window.cancelAnimationFrame(raf);
    var m = metas();
    barraA(m.p, false);
    pintar(m);
  }
  function animar() {
    var m = metas();
    if (reducir.matches || !(m.monto || m.acum || m.total)) { final(); return; }
    window.cancelAnimationFrame(raf);
    barraA(0, false);
    void relleno.offsetWidth;
    barraA(m.p, true);
    var t0 = null;
    function paso(ahora) {
      if (t0 === null) t0 = ahora;
      var k = Math.min(1, (ahora - t0) / DURACION);
      var e = 1 - Math.pow(1 - k, 3);                   /* easeOutCubic, igual que la curva de la barra */
      pintar({ monto: Math.round(m.monto * e), acum: Math.round(m.acum * e), total: Math.round(m.total * e) });
      if (k < 1) raf = window.requestAnimationFrame(paso);
    }
    raf = window.requestAnimationFrame(paso);
  }

  /* De los valores que se ven a los de la etapa nueva, sin pasar por el velo (la barra baja con su transición y los números cuentan hacia abajo) */
  function pasarA(desde) {
    var m = metas();
    window.cancelAnimationFrame(raf);
    if (reducir.matches) { final(); return; }
    barraA(m.p, true);
    var t0 = null;
    function paso(ahora) {
      if (t0 === null) t0 = ahora;
      var k = Math.min(1, (ahora - t0) / DURACION), e = 1 - Math.pow(1 - k, 3);
      pintar({ monto: Math.round(desde.monto + (m.monto - desde.monto) * e), acum: Math.round(desde.acum + (m.acum - desde.acum) * e), total: Math.round(desde.total + (m.total - desde.total) * e) });
      if (k < 1) raf = window.requestAnimationFrame(paso);
    }
    raf = window.requestAnimationFrame(paso);
  }

  /* ---------- aplicar el modo actual ---------- */
  function aplicar() {
    var m = metas(), md = modo();
    panel.setAttribute("data-datos", md);
    barra.setAttribute("aria-valuenow", String(m.monto));
    barra.setAttribute("aria-valuetext", "USD " + m.monto + " de USD 250");
    lectores.acum.textContent = "USD " + m.acum;
    lectores.total.textContent = String(m.total);
    transf.disabled = saldo.disabled = m.monto < MINIMO;
    render(tablas.ref); render(tablas.mov);
  }

  /* ---------- eventos de las tablas ---------- */
  panel.addEventListener("click", function (e) {
    var body = e.target.closest(".ap-tabla__body");
    if (!body) return;
    var t = body === tablas.ref.body ? tablas.ref : tablas.mov;
    var s = e.target.closest("[data-sort]");
    if (s) {
      var col = s.getAttribute("data-sort");
      t.orden = t.orden.col === col ? { col: col, dir: -t.orden.dir } : { col: col, dir: 1 };
      t.pag = 1; render(t);
      return;
    }
    var g = e.target.closest("[data-pag]");
    if (!g || g.disabled) return;
    var k = g.getAttribute("data-pag");
    var n = Math.max(1, Math.ceil(filtrados(t) / t.tam));
    t.pag = k === "primera" ? 1 : k === "ultima" ? n : k === "anterior" ? t.pag - 1 : t.pag + 1;
    render(t);
  });
  function filtrados(t) {
    return t.q ? t.datos.filter(function (r) { return norm(r.nombre + " " + r.email).indexOf(t.q) >= 0; }).length : t.datos.length;
  }
  panel.addEventListener("change", function (e) {
    var sel = e.target.closest("[data-tam]");
    if (!sel) return;
    var t = sel.closest("#ap-ref") ? tablas.ref : tablas.mov;
    t.tam = parseInt(sel.value, 10) || 5; t.pag = 1; render(t);
  });

  var form = document.getElementById("ap-buscar");
  var campoQ = document.getElementById("ap-buscar-q");
  function buscar(texto, avisar) {
    var t = tablas.ref;
    t.q = norm(texto); t.pag = 1;
    render(t);
    if (avisar && modo() !== "sin") anunciar(t.body.getAttribute("data-v") === "sin-resultados" ? "No encontramos resultados." : "Actividad de referidos actualizada.");
  }
  form.addEventListener("submit", function (e) { e.preventDefault(); buscar(campoQ.value, true); });
  campoQ.addEventListener("input", function () { if (!campoQ.value && tablas.ref.q) buscar("", true); });   /* al vaciar el campo vuelve la lista completa */

  /* ---------- con el panel de "Actividad y pagos" ---------- */
  document.addEventListener("ap:cargando", function () { enError = false; aplicar(); ceros(); });
  document.addEventListener("ap:cargado", animar);
  document.addEventListener("ap:error", function () { enError = true; aplicar(); ceros(); });
  document.addEventListener("ref:etapa", function () {
    if (enPlace) return;
    tope = false; enError = false;
    campoQ.value = ""; tablas.ref.q = ""; tablas.ref.pag = 1; tablas.mov.pag = 1;
    aplicar(); final();
  });

  window.NubixAct = {
    modo: modo,
    sinResultados: function () { return modo() !== "sin" && tablas.ref.body.getAttribute("data-v") === "sin-resultados"; },
    setTope: function (on) { tope = !!on; aplicar(); final(); },
    buscar: function (texto) { campoQ.value = texto || ""; buscar(campoQ.value, false); },
    limpiar: function () { campoQ.value = ""; buscar("", false); },
    saldo: function () { return metas().monto; },
    enPlace: function () { return enPlace; },
    /* Después de "Entendido" en el modal de cobro: pasa a la etapa 5 y actualiza la pantalla en el lugar */
    cobrar: function () {
      var antes = metas();
      enPlace = true; tope = false;
      R.setEtapa("cobrado");
      enPlace = false;
      aplicar(); pintar(antes); pasarA(antes);
    }
  };

  aplicar(); final();
})();
