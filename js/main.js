/* Portfolio · Gastón M. Mansilla
   JavaScript mínimo y sin dependencias: menú móvil, sección activa en el menú
   y botón "Copiar correo" con aviso (toast). */
(function () {
  "use strict";

  var EMAIL = "gmansilla24@gmail.com";
  var TOAST_MS = 3500;
  var TOAST_ERROR_MS = 7000;
  var BUTTON_RESET_MS = 2200;

  /* ---------- Menú móvil ---------- */
  var toggle = document.querySelector("[data-menu-toggle]");
  var menu = document.getElementById("menu");
  var desktopQuery = window.matchMedia("(min-width: 768px)");

  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });
    document.addEventListener("click", function (event) {
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      if (!event.target.closest(".site-header__inner")) setMenu(false);
    });
    var onBreakpoint = function (event) { if (event.matches) setMenu(false); };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener("change", onBreakpoint);
    else if (desktopQuery.addListener) desktopQuery.addListener(onBreakpoint);
  }

  /* ---------- Sección activa en el menú ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll("main > section[id]"));
  // Solo los enlaces internos de la misma página (#...). En las páginas de caso el menú
  // apunta a index.html y su estado "actual" queda fijo en el HTML.
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav__link")).filter(function (link) {
    return (link.getAttribute("href") || "").charAt(0) === "#";
  });
  var ticking = false;

  function updateActive() {
    ticking = false;
    var probe = window.scrollY + window.innerHeight * 0.35;
    var current = sections.length ? sections[0].id : null;
    sections.forEach(function (section) {
      if (section.offsetTop <= probe) current = section.id;
    });
    links.forEach(function (link) {
      if (link.getAttribute("href") === "#" + current) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateActive);
    }
  }

  if (sections.length && links.length) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateActive();
  }

  /* ---------- Toast ---------- */
  var region = document.getElementById("toast-region");
  var toastTimer = null;
  var leaveTimer = null;

  function clearToast() {
    window.clearTimeout(toastTimer);
    window.clearTimeout(leaveTimer);
    if (region) region.textContent = "";
  }

  function showToast(message, type, duration) {
    if (!region) return;
    clearToast();
    var toast = document.createElement("p");
    toast.className = "toast t-body" + (type === "error" ? " toast--error" : "");
    toast.textContent = message;
    region.appendChild(toast);
    toastTimer = window.setTimeout(function () {
      toast.classList.add("is-leaving");
      leaveTimer = window.setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 220);
    }, duration);
  }

  /* ---------- Copiar correo ---------- */
  var copyButton = document.querySelector("[data-copy-email]");
  var resetTimer = null;

  function legacyCopy(text) {
    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "0";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (error) { ok = false; }
    document.body.removeChild(field);
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  if (copyButton) {
    var label = copyButton.querySelector("[data-copy-label]");
    var icon = copyButton.querySelector("[data-copy-icon]");
    var idleLabel = label ? label.textContent : "Copiar correo";
    var idleIcon = icon ? icon.getAttribute("src") : "";

    var resetButton = function () {
      if (label) label.textContent = idleLabel;
      if (icon && idleIcon) icon.setAttribute("src", idleIcon);
    };

    copyButton.addEventListener("click", function () {
      copyText(EMAIL).then(function (ok) {
        window.clearTimeout(resetTimer);
        if (ok) {
          if (label) label.textContent = "¡Copiado!";
          if (icon) icon.setAttribute("src", "assets/icons/check-dark.svg");
          showToast("Correo copiado: " + EMAIL, "success", TOAST_MS);
          resetTimer = window.setTimeout(resetButton, BUTTON_RESET_MS);
        } else {
          showToast("No pude copiarlo. Escribime a " + EMAIL, "error", TOAST_ERROR_MS);
        }
      });
    });
  }
})();
