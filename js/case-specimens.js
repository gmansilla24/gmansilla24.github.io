/* Configurador de botones del caso Nubix: arma una combinación y lee sus valores reales del DOM. */
(function () {
  'use strict';
  var root = document.querySelector('[data-nxk]');
  if (!root) return;
  var btn = root.querySelector('[data-nxk-btn]');
  var read = root.querySelector('[data-nxk-read]');
  var surface = root.querySelector('.nxk__surface');
  var PLUS = '<svg class="nxk-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>';
  var fams = ['primary', 'secondary', 'brand', 'danger', 'success', 'warning', 'info'];
  var steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  var tokenByHex = null;

  function val(name) {
    var el = root.querySelector('input[name="nxk-' + name + '"]:checked');
    return el ? el.value : '';
  }
  function toHex(r, g, b) {
    return '#' + [r, g, b].map(function (n) { return ('0' + Math.round(n).toString(16)).slice(-2); }).join('');
  }
  function parse(c) {
    var m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    var p = m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function buildTokens() {
    tokenByHex = {};
    var cs = getComputedStyle(root);
    fams.forEach(function (f) {
      steps.forEach(function (s) {
        var v = cs.getPropertyValue('--' + f + '-' + s).trim();
        if (/^#[0-9a-f]{6}$/i.test(v)) tokenByHex[v.toLowerCase()] = f + '-' + s;
      });
    });
  }
  function tokenOf(hex) {
    if (hex === '#ffffff') return 'blanco';
    return tokenByHex[hex] || '';
  }
  function lum(c) {
    function ch(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
  }
  function ratio(a, b) {
    var x = lum(a), y = lum(b);
    var hi = Math.max(x, y), lo = Math.min(x, y);
    return (hi + 0.05) / (lo + 0.05);
  }
  function over(c, bg) {
    if (c.a >= 1) return c;
    return { r: c.r * c.a + bg.r * (1 - c.a), g: c.g * c.a + bg.g * (1 - c.a), b: c.b * c.a + bg.b * (1 - c.a), a: 1 };
  }
  function level(r) { return r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA solo en texto grande' : 'no cumple'; }
  function num(n) { return (Math.round(n * 10) / 10).toFixed(1).replace('.', ','); }
  function swatch(hex) { return '<span class="nxk__sw" style="background:' + hex + '"></span>'; }
  function colorCell(hex) {
    var t = tokenOf(hex);
    return swatch(hex) + '<code>' + hex + '</code>' + (t ? ' · ' + t : '');
  }
  function row(k, v) { return '<dt>' + k + '</dt><dd>' + v + '</dd>'; }

  function render() {
    if (!tokenByHex) buildTokens();
    var type = val('type'), color = val('color'), size = val('size'), content = val('content'), state = val('state');

    var brandInput = root.querySelector('input[name="nxk-color"][value="brand"]');
    if (content === 'icon') {
      if (color === 'brand') {
        root.querySelector('input[name="nxk-color"][value="primary"]').checked = true;
        color = 'primary';
      }
      brandInput.disabled = true;
    } else {
      brandInput.disabled = false;
    }

    var cls = 'nxk-btn nxk-btn--' + type + ' nxk-btn--' + color + (size !== 'md' ? ' nxk-btn--' + size : '') + (content === 'icon' ? ' nxk-btn--icon' : '');
    if (state === 'hover') cls += ' is-hover';
    if (state === 'active') cls += ' is-active';
    if (state === 'focus') cls += ' is-focus';
    if (state === 'disabled') cls += ' is-disabled';
    btn.className = cls;
    btn.innerHTML = content === 'icon' ? PLUS : (content === 'both' ? PLUS + 'Botón' : 'Botón');
    if (content === 'icon') btn.setAttribute('aria-label', 'Agregar'); else btn.removeAttribute('aria-label');

    var cs = getComputedStyle(btn);
    var rect = btn.getBoundingClientRect();
    var surf = parse(getComputedStyle(surface).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
    var bgRaw = parse(cs.backgroundColor) || { r: 0, g: 0, b: 0, a: 0 };
    var bg = over(bgRaw, surf);
    var fg = over(parse(cs.color), bg);
    var bgHex = toHex(bg.r, bg.g, bg.b), fgHex = toHex(fg.r, fg.g, fg.b);
    var bw = parseFloat(cs.borderTopWidth) || 0;
    var bcol = parse(cs.borderTopColor);
    var html = '';
    html += row('Medidas', content === 'icon' ? Math.round(rect.width) + ' × ' + Math.round(rect.height) + ' px' : Math.round(rect.height) + ' px de alto · ' + parseFloat(cs.paddingLeft) + ' px de padding');
    html += row('Radio', cs.borderTopLeftRadius.replace('px', ' px'));
    html += row('Texto', content === 'icon' ? 'Sin texto visible: lleva aria-label' : cs.fontSize.replace('px', ' px') + ' · peso ' + cs.fontWeight);
    var ic = btn.querySelector('svg');
    if (ic) { var iw = Math.round(ic.getBoundingClientRect().width); html += row('Tamaño del ícono', iw + ' px'); }
    html += row('Fondo', bgRaw.a === 0 ? 'Transparente (sobre blanco)' : colorCell(bgHex));
    html += row(content === 'icon' ? 'Ícono' : 'Texto', colorCell(fgHex));
    if (bw > 0 && bcol && bcol.a > 0) {
      var bh = toHex(bcol.r, bcol.g, bcol.b);
      html += row('Borde', bw + ' px · ' + colorCell(bh));
    }
    if (state === 'focus') html += row('Foco', 'Anillo de 3 px al 40% del color del botón');
    if (state === 'disabled') html += row('Deshabilitado', 'Opacidad 60%');
    var r = ratio(fg, bg);
    var lv = state === 'disabled' ? 'Exento por estar deshabilitado (WCAG 1.4.3)' : level(r);
    html += row('Contraste', '<b>' + num(r) + ':1</b> · ' + lv);
    read.innerHTML = html;
  }

  root.querySelector('.nxk__controls').addEventListener('change', render);
  render();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
})();

/* Hallazgo 2 · tablas: orden, selección y ajuste del marco de celular. */
(function () {
  'use strict';

  /* El marco de celular mide 360 px de verdad; si no entra, se achica en lugar de desbordar. */
  var fits = [].slice.call(document.querySelectorAll('.nxt-ph__fit'));
  function fit() {
    fits.forEach(function (box) {
      var phone = box.querySelector('[data-nxt-phone]');
      if (!phone) return;
      phone.style.zoom = '';
      var w = box.clientWidth;
      var base = Number(phone.getAttribute('data-w')) || 360;
      if (w && w < base) phone.style.zoom = String(w / base);
    });
  }
  if (fits.length) {
    fit();
    window.addEventListener('resize', fit);
    if (window.ResizeObserver) fits.forEach(function (b) { new ResizeObserver(fit).observe(b); });
  }

  /* Pantallas del prototipo en un iframe de 1280 px: se escalan al ancho de la tarjeta. */
  var shots = [].slice.call(document.querySelectorAll('[data-shot]'));
  function scaleShots() {
    shots.forEach(function (b) {
      var w = b.clientWidth;
      if (w) b.style.setProperty('--s', String(Math.min(1, w / 1280)));
    });
  }
  if (shots.length) {
    scaleShots();
    window.addEventListener('resize', scaleShots);
    if (window.ResizeObserver) shots.forEach(function (b) { new ResizeObserver(scaleShots).observe(b); });
  }

  /* iframes de réplicas con alto automático (mismo origen). */
  var autos = [].slice.call(document.querySelectorAll('iframe[data-autofit]'));
  function fitAuto(f) {
    try {
      var d = f.contentDocument;
      if (!d || !d.documentElement) return;
      var prev = f.style.height;
      f.style.height = '0px';
      var h = Math.ceil(d.documentElement.scrollHeight);
      f.style.height = (h > 40 ? h : parseInt(prev, 10) || 480) + 'px';
    } catch (err) { /* sin acceso: queda el alto por defecto */ }
  }
  autos.forEach(function (f) {
    f.addEventListener('load', function () { fitAuto(f); setTimeout(function () { fitAuto(f); }, 400); });
    try { if (f.contentDocument && f.contentDocument.readyState === 'complete') fitAuto(f); } catch (err) { /* sin acceso */ }
  });
  /* Respaldo: el iframe avisa su alto con postMessage (sirve cuando el padre no puede leerlo, p. ej. abierto en local) */
  window.addEventListener('message', function (e) {
    var h = e.data && e.data.nxFit;
    if (!h || h < 40) return;
    autos.forEach(function (f) { if (f.contentWindow === e.source) f.style.height = h + 'px'; });
  });
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    autos.forEach(fitAuto);
  });

  var LABEL = { tipo: 'tipo', nombre: 'nombre', ttl: 'TTL' };
  var ICON = { none: '#nxt-i-sort', ascending: '#nxt-i-up', descending: '#nxt-i-down' };

  [].slice.call(document.querySelectorAll('[data-nxt]')).forEach(function (root) {
    var tbody = root.querySelector('tbody');
    var rows = [].slice.call(tbody.rows);
    var heads = [].slice.call(root.querySelectorAll('th[aria-sort]'));
    var sel = root.querySelector('[data-sel]');
    var all = root.querySelector('[data-all]');
    var count = root.querySelector('[data-count]');
    var msg = root.querySelector('[data-msg]');
    var state = { k: '', dir: 'asc' };

    function cmp(a, b) {
      var k = state.k;
      var x = a.getAttribute('data-' + k), y = b.getAttribute('data-' + k);
      var r = k === 'ttl' ? (+x) - (+y) : x.localeCompare(y, 'es', { sensitivity: 'base' });
      if (r === 0) r = (+a.getAttribute('data-i')) - (+b.getAttribute('data-i'));
      return state.dir === 'asc' ? r : -r;
    }

    function paint() {
      var list = rows.slice();
      if (state.k) list.sort(cmp);
      else list.sort(function (a, b) { return (+a.getAttribute('data-i')) - (+b.getAttribute('data-i')); });
      list.forEach(function (tr) { tbody.appendChild(tr); });
      heads.forEach(function (th) {
        var b = th.querySelector('[data-k]');
        var on = b && b.getAttribute('data-k') === state.k;
        var v = on ? (state.dir === 'asc' ? 'ascending' : 'descending') : 'none';
        th.setAttribute('aria-sort', v);
        var use = th.querySelector('use');
        if (use) use.setAttribute('href', ICON[v]);
      });
      if (sel) sel.value = state.k ? state.k + ':' + state.dir : '';
      if (msg) {
        msg.textContent = state.k
          ? 'Ordenado por ' + LABEL[state.k] + (state.k === 'ttl' ? (state.dir === 'asc' ? ', de menor a mayor' : ', de mayor a menor') : ', de la A a la Z')
          : 'Orden original';
      }
    }

    root.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-k]');
      if (!b || !root.contains(b)) return;
      var k = b.getAttribute('data-k');
      if (state.k === k) state.dir = state.dir === 'asc' ? 'desc' : 'asc';
      else { state.k = k; state.dir = 'asc'; }
      paint();
    });

    if (sel) sel.addEventListener('change', function () {
      var p = sel.value.split(':');
      state.k = p[0] || '';
      state.dir = p[1] || 'asc';
      paint();
    });

    function sync() {
      var boxes = [].slice.call(root.querySelectorAll('[data-row]'));
      var n = 0;
      boxes.forEach(function (c) {
        var tr = c.closest('tr');
        tr.classList.toggle('is-selected', c.checked);
        if (c.checked) n++;
      });
      if (all) {
        all.checked = n === boxes.length;
        all.indeterminate = n > 0 && n < boxes.length;
      }
      if (count) count.innerHTML = '<b>' + n + '</b> ' + (n === 1 ? 'seleccionado' : 'seleccionados');
    }

    root.addEventListener('change', function (ev) {
      var t = ev.target;
      if (t.hasAttribute('data-all')) {
        [].slice.call(root.querySelectorAll('[data-row]')).forEach(function (c) { c.checked = t.checked; });
        sync();
      } else if (t.hasAttribute('data-row')) sync();
    });
    sync();
  });
})();
