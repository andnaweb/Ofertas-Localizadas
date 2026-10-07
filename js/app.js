/* ============================================================
   OFERTAS LOCALIZADAS — Lógica do site
   ============================================================ */

(function () {
  "use strict";

  var CFG = window.LO_CONFIG || {};
  var API_URL = (CFG.apiUrl || "").trim();
  var IS_DEMO = API_URL === "";
  var INSTA = "https://www.instagram.com/" + (CFG.instagram || "sua_conta");

  var PAGE_SIZE = 18;
  var shown = PAGE_SIZE;

  var state = {
    products: [],
    filtered: [],
    category: "todos",
    search: "",
    sort: "destaque"
  };

  function $(id) { return document.getElementById(id); }

  var els = {
    demoNotice: $("demoNotice"),
    instaHero: $("instaHero"),
    instaFooter: $("instaFooter"),
    statProducts: $("statProducts"),
    statCategories: $("statCategories"),
    statOff: $("statOff"),
    searchInput: $("searchInput"),
    sortSelect: $("sortSelect"),
    categoryNav: $("categoryNav"),
    resultCount: $("resultCount"),
    productGrid: $("productGrid"),
    emptyState: $("emptyState"),
    showMore: $("showMore"),
    toast: $("toast"),
    header: $("header"),
    year: $("year")
  };

  init();

  function init() {
    if (els.year) els.year.textContent = String(new Date().getFullYear());

    if (els.instaHero) {
      els.instaHero.href = INSTA;
      els.instaHero.textContent = "Seguir no Instagram";
    }
    if (els.instaFooter) {
      els.instaFooter.href = INSTA;
      els.instaFooter.innerHTML = svgInsta() + "@" + (CFG.instagram || "sua_conta");
    }

    buildCategories(["todos"]);

    if (IS_DEMO) {
      if (els.demoNotice) els.demoNotice.classList.remove("hidden");
      state.products = (CFG.demoProducts || []).slice();
      statsAndRender();
    } else {
      loadFromApi();
    }

    attachEvents();
  }

  /* ---------------- Conexão com a planilha ---------------- */

  function loadFromApi() {
    showLoading();
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (controller) controller.abort();
      onLoadError();
    }, 20000);

    fetch(API_URL, { signal: controller ? controller.signal : undefined })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (json) {
        clearTimeout(timer);
        var list = (json && json.products) || [];
        if (!list.length) throw new Error("empty");
        state.products = list;
        statsAndRender();
      })
      .catch(function () {
        clearTimeout(timer);
        onLoadError();
      });
  }

  function onLoadError() {
    if (els.productGrid) {
      els.productGrid.innerHTML =
        '<div class="empty-state"><p class="empty-title">Não foi possível carregar as ofertas</p>' +
        "<p>Verifique sua conexão ou confira o link da planilha na configuração.</p></div>";
    }
    if (els.resultCount) els.resultCount.textContent = "";
  }

  function showLoading() {
    if (!els.productGrid) return;
    var cards = "";
    for (var i = 0; i < 8; i++) {
      cards += '<div class="card skeleton visible" aria-hidden="true"><div class="media"></div>' +
        '<div class="card-body"><div class="sk sk-t"></div><div class="sk sk-p"></div></div></div>';
    }
    els.productGrid.innerHTML = cards;
  }

  /* ---------------- Normalização dos dados ---------------- */

  function normalize(p) {
    p.nome = clean(p.nome) || "Produto da loja";
    p.link = clean(p.link) || "#";
    p.categoria = clean(p.categoria) || "Geral";
    p.badge = clean(p.badge);
    p.imagem = clean(p.imagem);

    p.preco = parsePrice(p.preco);
    p.preco_original = parsePrice(p.preco_original);

    if (p.preco == null && p.preco_original != null) p.preco = p.preco_original;

    p.avaliacao = parseFloat(p.avaliacao);
    if (isNaN(p.avaliacao)) p.avaliacao = null;

    p.vendas = parseSales(p.vendas);

    p.desconto = null;
    if (p.preco != null && p.preco_original != null && p.preco_original > p.preco && p.preco_original > 0) {
      p.desconto = Math.min(97, Math.round((1 - p.preco / p.preco_original) * 100));
    }
    return p;
  }

  function clean(v) {
    if (v === null || v === undefined) return "";
    return String(v).replace(/^"|"$/g, "").trim();
  }

  function parsePrice(v) {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number") return isFinite(v) ? v : null;
    var s = String(v).replace(/[^0-9,.-]/g, "");
    if (!s) return null;
    if (s.indexOf(",") !== -1) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      var parts = s.split(".");
      if (parts.length === 2 && parts[1].length === 3 && parts[0].length > 1) {
        s = parts.join("");
      }
    }
    var n = parseFloat(s);
    return isFinite(n) && n > 0 ? n : null;
  }

  function parseSales(v) {
    if (v === null || v === undefined || v === "") return 0;
    if (typeof v === "number") return isFinite(v) ? v : 0;
    var s = String(v).replace(/[^0-9.,]/g, "").replace(/\./g, "").replace(",", ".");
    var n = parseFloat(s);
    return isFinite(n) ? n : 0;
  }

  /* ---------------- Formatação ---------------- */

  function fmtBRL(n) {
    if (n == null || isNaN(n)) return "—";
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function fmtVendas(v) {
    if (!v || v <= 0) return "";
    var txt = v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
    return txt + " mil vendas";
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ---------------- Categorias ---------------- */

  function buildCategories(list) {
    list.forEach(function (name) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + (name === "todos" ? " active" : "");
      btn.setAttribute("role", "tab");
      btn.dataset.category = name;
      btn.textContent = name === "todos" ? "Todos" : esc(name);
      btn.addEventListener("click", function () {
        state.category = name;
        renderChips();
        applyFilters();
      });
      els.categoryNav.appendChild(btn);
    });
  }

  function renderChips() {
    var chips = els.categoryNav.querySelectorAll(".chip");
    chips.forEach(function (chip) {
      var active = chip.dataset.category === state.category;
      chip.classList.toggle("active", active);
      chip.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function collectCategories() {
    var map = {};
    state.products.forEach(function (p) {
      var c = p.categoria || "Geral";
      map[c] = (map[c] || 0) + 1;
    });
    var list = Object.keys(map).sort(function (a, b) {
      return map[b] - map[a];
    });
    return list.map(function (name) {
      return { name: name, count: map[name] };
    });
  }

  /* ---------------- Filtros, busca e ordenação ---------------- */

  function applyFilters(resetShown) {
  var term = state.search.toLowerCase().trim();

  state.filtered = state.products.filter(function (p) {
    var okCat = state.category === "todos" || (p.categoria || "Geral") === state.category;
    if (!okCat) return false;
    if (!term) return true;
    var hay = ((p.nome || "") + " " + (p.categoria || "") + " " + (p.badge || "")).toLowerCase();
    return hay.indexOf(term) !== -1;
  });

  sortProducts();

  if (resetShown !== false) {
    shown = PAGE_SIZE;
  }

  renderResults();
}

  function sortProducts() {
    var mode = state.sort;
    var list = state.filtered.slice();

    if (mode === "desconto") {
      list.sort(function (a, b) { return (b.desconto != null ? b.desconto : -1) - (a.desconto != null ? a.desconto : -1); });
    } else if (mode === "menor") {
      list.sort(function (a, b) { return (a.preco || 0) - (b.preco || 0); });
    } else if (mode === "maior") {
      list.sort(function (a, b) { return (b.preco || 0) - (a.preco || 0); });
    } else if (mode === "vendas") {
      list.sort(function (a, b) { return b.vendas - a.vendas; });
    }

    state.filtered = list;
  }

  /* ---------------- Renderização ---------------- */

  function renderResults() {
    var total = state.filtered.length;
    var visible = state.filtered.slice(0, shown);

    if (els.resultCount) {
      els.resultCount.textContent = "";
      var strong = document.createElement("strong");
      strong.textContent = total;
      els.resultCount.appendChild(strong);
      els.resultCount.appendChild(document.createTextNode(" produto" + (total === 1 ? "" : "s") + " encontrado" + (total === 1 ? "" : "s")));
    }

    if (!total) {
      els.productGrid.innerHTML = "";
      els.emptyState.classList.remove("hidden");
    } else {
      els.emptyState.classList.add("hidden");
      els.productGrid.innerHTML = visible.map(cardHTML).join("");
      bindImageFallbacks();
      observeCards();
    }

    var hasMore = visible.length < total;
    els.showMore.classList.toggle("hidden", !hasMore);
    els.showMore.dataset.total = total;
  }

  function cardHTML(p) {
    var img = p.imagem
      ? '<img src="' + esc(p.imagem) + '" data-fallback alt="' + esc(p.nome) + '" loading="lazy" decoding="async">'
      : placeholderHTML();

    var badge = p.badge ? '<span class="badge">' + esc(p.badge) + "</span>" : "";
    var off = p.desconto != null ? '<span class="off">-' + p.desconto + '%</span>' : "";

    var rating = "";
    if (p.avaliacao != null || p.vendas > 0) {
      rating = '<div class="rating-row">';
      if (p.avaliacao != null) {
        rating += '<span class="star">&#9733;</span><strong>' + p.avaliacao.toLocaleString("pt-BR") + "</strong>";
      }
      var vendas = fmtVendas(p.vendas);
      if (vendas) {
        rating += '<span class="sep">&middot;</span><span>' + esc(vendas) + "</span>";
      }
      rating += "</div>";
    }

    var price = '<div class="price-block">';
    if (p.preco_original != null) price += '<span class="price-old">' + esc(fmtBRL(p.preco_original)) + "</span>";
    price += '<div class="price-now"><strong>' + esc(fmtBRL(p.preco)) + "</strong>";
    if (p.desconto != null) price += '<span class="saving">Economia ' + p.desconto + "%</span>";
    price += "</div></div>";

    return (
      '<article class="card">' +
      '<div class="media">' + img + badge + off + "</div>" +
      '<div class="card-body">' +
      '<h3 class="card-title">' + esc(p.nome) + "</h3>" +
      rating +
      price +
      '<button type="button" class="btn-offer" data-link="' + esc(p.link) + '" aria-label="Ver ' + esc(p.nome) + ' na loja oficial">' +
      "Ver produto" + svgArrow() +
      "</button>" +
      '<p class="card-note">Compra realizada na loja oficial</p>' +
      "</div></article>"
    );
  }

  function placeholderHTML() {
    return '<div class="media-placeholder">OL</div>';
  }

  function svgArrow() {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>';
  }

  function svgInsta() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>';
  }

  /* ---------------- Estatísticas do hero ---------------- */

  function renderStats() {
    var list = state.products;
    var cats = collectCategories();
    var maxOff = list.reduce(function (acc, p) {
      return p.desconto != null && p.desconto > acc ? p.desconto : acc;
    }, 0);

    if (els.statProducts) els.statProducts.textContent = list.length.toLocaleString("pt-BR");
    if (els.statCategories) els.statCategories.textContent = String(cats.length);
    if (els.statOff) els.statOff.textContent = maxOff > 0 ? "até " + maxOff + "%" : "—";
  }

  function statsAndRender() {
    state.products = state.products.map(normalize).filter(function (p) {
      return p.preco != null && p.link && p.link !== "#";
    });
    if (!state.products.length && IS_DEMO) {
      state.products = (CFG.demoProducts || []).map(normalize);
    }

    if (els.categoryNav) els.categoryNav.innerHTML = "";
    buildCategories(["todos"].concat(collectCategories().map(function (c) { return c.name; })));

    renderStats();
    applyFilters();
  }

  /* ---------------- Animação de entrada ---------------- */

  var io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          if (io) io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -40px 0px", threshold: 0.05 });
  }

  function observeCards() {
    var cards = els.productGrid.querySelectorAll(".card:not(.visible)");
    cards.forEach(function (card) {
      if (io) io.observe(card);
      else card.classList.add("visible");
    });
  }

  function bindImageFallbacks() {
    var imgs = els.productGrid.querySelectorAll("img[data-fallback]");
    imgs.forEach(function (img) {
      img.addEventListener("error", function handler() {
        img.removeEventListener("error", handler);
        var ph = document.createElement("div");
        ph.className = "media-placeholder";
        ph.textContent = "OL";
        if (img.parentNode) img.parentNode.replaceChild(ph, img);
      });
    });
  }

  /* ---------------- Eventos ---------------- */

  function attachEvents() {
    if (els.searchInput) {
      var debounce;
      els.searchInput.addEventListener("input", function () {
        clearTimeout(debounce);
        debounce = setTimeout(function () {
          state.search = els.searchInput.value;
          shown = PAGE_SIZE;
          applyFilters();
        }, 200);
      });
    }

    if (els.sortSelect) {
      els.sortSelect.addEventListener("change", function () {
        state.sort = els.sortSelect.value;
        applyFilters();
      });
    }

    if (els.showMore) {
      els.showMore.addEventListener("click", function () {
  shown += PAGE_SIZE;
  applyFilters(false);
});

    if (els.productGrid) {
      els.productGrid.addEventListener("click", function (e) {
        var btn = e.target.closest ? e.target.closest("[data-link]") : null;
        if (!btn) return;
        var link = btn.getAttribute("data-link");
        if (!link || link === "#") {
          showToast("Configure o link de afiliado na planilha para ativar esta oferta.");
          return;
        }
        showToast("Abrindo a loja oficial…");
        setTimeout(function () {
          window.open(link, "_blank", "noopener");
        }, 350);
      });
    }

    if (window.scrollY > 8) els.header.classList.add("scrolled");
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        els.header.classList.toggle("scrolled", window.scrollY > 8);
        ticking = false;
      });
    });

    document.querySelectorAll("[data-scroll-target]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        var el = document.querySelector(link.getAttribute("href"));
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  /* ---------------- Toast ---------------- */

  var toastTimer = null;
  function showToast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      els.toast.classList.remove("show");
    }, 2600);
  }
})();
