/* Índice fijo de los casos: marca la sección que se está leyendo.
   Sin JS el índice funciona igual como lista de enlaces. */
(function () {
  var nav = document.querySelector(".case-nav");
  if (!nav) return;
  var list = nav.querySelector(".case-nav__list");
  var items = [].slice.call(nav.querySelectorAll('a[href^="#"]')).map(function (a) {
    return { link: a, section: document.getElementById(a.getAttribute("href").slice(1)) };
  }).filter(function (i) { return i.section; });
  var current = null;
  var queued = false;

  function update() {
    queued = false;
    var line = (parseFloat(window.getComputedStyle(nav).top) || 0) + nav.offsetHeight + 48;
    var active = null;
    items.forEach(function (i) {
      if (i.section.getBoundingClientRect().top <= line) active = i;
    });
    var atEnd = window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 4;
    if (atEnd && items.length) active = items[items.length - 1];
    if (active === current) return;
    if (current) current.link.removeAttribute("aria-current");
    current = active;
    if (!current) return;
    current.link.setAttribute("aria-current", "location");
    if (list.scrollWidth > list.clientWidth) {
      list.scrollLeft = Math.max(0, current.link.offsetLeft - 16);
    }
  }
  function onScroll() {
    if (!queued) { queued = true; window.requestAnimationFrame(update); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
