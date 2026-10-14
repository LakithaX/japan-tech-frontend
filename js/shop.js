/* ===================================================================
   SHOP PAGE
   -------------------------------------------------------------------
   Works in two modes:
   1. Backend mode  - asks the Spring Boot API for products.
   2. Demo mode     - if the API doesn't answer, uses DEMO_PRODUCTS below
                      and filters them in the browser, so the page works now.

   Expected API (Spring Boot):
     GET /api/products?q=&category=&condition=&brand=&minPrice=&maxPrice=
                      &inStock=&sort=&page=&size=

     category  : phone | accessory
     condition : new | used          (can repeat: condition=new&condition=used)
     brand     : e.g. Apple          (can repeat)
     sort      : newest | price_asc | price_desc | name_asc
     page      : starts at 0 (Spring's default)

   Response (this is what Spring's Page<ProductDto> gives you as JSON):
     {
       "content": [
         { "id": 1, "name": "...", "description": "...", "category": "phone",
           "brand": "Apple", "condition": "used", "price": 95000,
           "oldPrice": null, "imageUrl": "images/x.png", "inStock": true }
       ],
       "totalElements": 42,
       "totalPages": 4,
       "number": 0
     }
   =================================================================== */

(function () {
    'use strict';

    /* ---------- settings ---------- */
    var API_URL   = '/api/products';
    var PAGE_SIZE = 12;
    var BRANDS    = ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Oppo', 'Anker', 'Other'];
    var PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/>' +
        '<rect x="70" y="40" width="60" height="120" rx="10" fill="none" stroke="#bbb" stroke-width="4"/></svg>');

    /* ---------- demo data (delete once the backend is connected) ---------- */
    var DEMO_PRODUCTS = [
        { id: 1,  name: 'iPhone 13 128GB',          description: 'Used, 91% battery health, no scratches.',   category: 'phone',     brand: 'Apple',   condition: 'used', price: 148000, oldPrice: null,  imageUrl: 'images/Apple-iPhone-12-PNG-HD.png', inStock: true  },
        { id: 2,  name: 'iPhone 15 Pro 256GB',      description: 'Brand new, sealed box, 1 year warranty.',   category: 'phone',     brand: 'Apple',   condition: 'new',  price: 395000, oldPrice: null,  imageUrl: 'images/Apple-iPhone-12-PNG-HD.png', inStock: true  },
        { id: 3,  name: 'Galaxy S22 128GB',         description: 'Used, 88% battery health, minor wear.',     category: 'phone',     brand: 'Samsung', condition: 'used', price: 112000, oldPrice: 125000, imageUrl: '', inStock: true  },
        { id: 4,  name: 'Galaxy A55 256GB',         description: 'Brand new, sealed, 1 year warranty.',       category: 'phone',     brand: 'Samsung', condition: 'new',  price: 138000, oldPrice: null,  imageUrl: '', inStock: false },
        { id: 5,  name: 'Redmi Note 13 128GB',      description: 'Brand new, sealed, 1 year warranty.',       category: 'phone',     brand: 'Xiaomi',  condition: 'new',  price: 69000,  oldPrice: 75000,  imageUrl: '', inStock: true  },
        { id: 6,  name: 'Huawei P30 Pro',           description: 'Used, screen replaced, works perfectly.',   category: 'phone',     brand: 'Huawei',  condition: 'used', price: 54000,  oldPrice: null,  imageUrl: '', inStock: true  },
        { id: 7,  name: 'Fast phone charger',       description: '20W USB-C charger with cable.',             category: 'accessory', brand: 'Anker',   condition: 'new',  price: 2500,   oldPrice: 3200,  imageUrl: 'images/Charger-Transparent-PNG.png', inStock: true  },
        { id: 8,  name: 'Shockproof phone case',    description: 'Slim case with raised edges.',              category: 'accessory', brand: 'Other',   condition: 'new',  price: 1800,   oldPrice: null,  imageUrl: '', inStock: true  },
        { id: 9,  name: 'Tempered glass protector', description: '9H glass, easy-fit frame included.',        category: 'accessory', brand: 'Other',   condition: 'new',  price: 900,    oldPrice: null,  imageUrl: '', inStock: true  },
        { id: 10, name: 'Power bank 10000mAh',      description: 'Dual USB output, fast charging.',           category: 'accessory', brand: 'Anker',   condition: 'new',  price: 6900,   oldPrice: null,  imageUrl: '', inStock: true  },
        { id: 11, name: 'Wireless earbuds',         description: 'Bluetooth 5.3, charging case.',             category: 'accessory', brand: 'Xiaomi',  condition: 'new',  price: 8500,   oldPrice: 9900,  imageUrl: '', inStock: false },
        { id: 12, name: 'OPPO A57 64GB',            description: 'Used, good condition, charger included.',   category: 'phone',     brand: 'Oppo',    condition: 'used', price: 32000,  oldPrice: null,  imageUrl: '', inStock: true  },
        { id: 13, name: 'USB-C cable 1m',           description: 'Braided, supports fast charging.',          category: 'accessory', brand: 'Anker',   condition: 'new',  price: 1200,   oldPrice: null,  imageUrl: '', inStock: true  },
        { id: 14, name: 'iPhone 11 64GB',           description: 'Used, 84% battery health.',                 category: 'phone',     brand: 'Apple',   condition: 'used', price: 89000,  oldPrice: null,  imageUrl: 'images/Apple-iPhone-12-PNG-HD.png', inStock: true  }
    ];

    /* ---------- page elements ---------- */
    var $ = function (id) { return document.getElementById(id); };
    var grid        = $('shopGrid');
    var countEl     = $('shopCount');
    var emptyEl     = $('shopEmpty');
    var pagerEl     = $('shopPagination');
    var searchEl    = $('shopSearch');
    var sortEl      = $('shopSort');
    var minEl       = $('minPrice');
    var maxEl       = $('maxPrice');
    var stockEl     = $('inStock');
    var brandBox    = $('brandOptions');
    var filtersEl   = $('shopFilters');
    var filterBtn   = $('filterToggle');
    var filterCount = $('filterCount');

    var state = { page: 0 };
    var requestId = 0;   // ignore answers from older requests

    /* ---------- helpers ---------- */
    function money(n) {
        return 'Rs ' + Number(n).toLocaleString('en-US');
    }

    function esc(s) {
        var d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    function checked(name) {
        return Array.prototype.map.call(
            document.querySelectorAll('input[name="' + name + '"]:checked'),
            function (el) { return el.value; }
        );
    }

    /* ---------- read the filter controls into one object ---------- */
    function readFilters() {
        var cat = document.querySelector('input[name="category"]:checked');
        return {
            q:         searchEl.value.trim(),
            category:  cat ? cat.value : '',
            condition: checked('condition'),
            brand:     checked('brand'),
            minPrice:  minEl.value,
            maxPrice:  maxEl.value,
            inStock:   stockEl.checked,
            sort:      sortEl.value,
            page:      state.page
        };
    }

    /* ---------- keep filters in the URL so results can be shared / bookmarked ---------- */
    function toQuery(f) {
        var p = new URLSearchParams();
        if (f.q)        p.set('q', f.q);
        if (f.category) p.set('category', f.category);
        f.condition.forEach(function (v) { p.append('condition', v); });
        f.brand.forEach(function (v) { p.append('brand', v); });
        if (f.minPrice) p.set('minPrice', f.minPrice);
        if (f.maxPrice) p.set('maxPrice', f.maxPrice);
        if (f.inStock)  p.set('inStock', 'true');
        if (f.sort && f.sort !== 'newest') p.set('sort', f.sort);
        if (f.page)     p.set('page', f.page);
        return p;
    }

    function writeUrl(f) {
        var qs = toQuery(f).toString();
        history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    }

    function restoreFromUrl() {
        var p = new URLSearchParams(location.search);
        searchEl.value = p.get('q') || '';
        sortEl.value   = p.get('sort') || 'newest';
        minEl.value    = p.get('minPrice') || '';
        maxEl.value    = p.get('maxPrice') || '';
        stockEl.checked = p.get('inStock') === 'true';

        var cat = p.get('category') || '';
        var catEl = document.querySelector('input[name="category"][value="' + cat + '"]');
        if (catEl) catEl.checked = true;

        p.getAll('condition').forEach(function (v) {
            var el = document.querySelector('input[name="condition"][value="' + v + '"]');
            if (el) el.checked = true;
        });
        p.getAll('brand').forEach(function (v) {
            var el = document.querySelector('input[name="brand"][value="' + v + '"]');
            if (el) el.checked = true;
        });

        state.page = parseInt(p.get('page'), 10) || 0;
    }

    /* ---------- get products: API first, demo data as fallback ---------- */
    function fetchProducts(f) {
        var params = toQuery(f);
        params.set('size', PAGE_SIZE);
        params.set('page', f.page);
        if (!params.has('sort')) params.set('sort', 'newest');

        return fetch(API_URL + '?' + params.toString(), { headers: { 'Accept': 'application/json' } })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .catch(function () {
                return demoSearch(f);
            });
    }

    function demoSearch(f) {
        var q = f.q.toLowerCase();
        var min = f.minPrice === '' ? 0 : Number(f.minPrice);
        var max = f.maxPrice === '' ? Infinity : Number(f.maxPrice);

        var list = DEMO_PRODUCTS.filter(function (p) {
            if (q && (p.name + ' ' + p.brand + ' ' + p.description).toLowerCase().indexOf(q) === -1) return false;
            if (f.category && p.category !== f.category) return false;
            if (f.condition.length && f.condition.indexOf(p.condition) === -1) return false;
            if (f.brand.length && f.brand.indexOf(p.brand) === -1) return false;
            if (p.price < min || p.price > max) return false;
            if (f.inStock && !p.inStock) return false;
            return true;
        });

        var sorters = {
            newest:     function (a, b) { return b.id - a.id; },
            price_asc:  function (a, b) { return a.price - b.price; },
            price_desc: function (a, b) { return b.price - a.price; },
            name_asc:   function (a, b) { return a.name.localeCompare(b.name); }
        };
        list.sort(sorters[f.sort] || sorters.newest);

        var total = list.length;
        var start = f.page * PAGE_SIZE;
        return {
            content: list.slice(start, start + PAGE_SIZE),
            totalElements: total,
            totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
            number: f.page
        };
    }

    /* ---------- drawing ---------- */
    function cardHtml(p) {
        var onSale  = p.oldPrice && p.oldPrice > p.price;
        var img     = p.imageUrl || PLACEHOLDER_IMG;
        var soldOut = p.inStock === false;
        var condLabel = p.condition === 'used' ? 'Used' : 'New';

        return '' +
        '<article class="product-card' + (soldOut ? ' is-sold-out' : '') + '">' +
            '<a href="shop.html?id=' + encodeURIComponent(p.id) + '" class="product-card-media">' +
                '<img src="' + esc(img) + '" alt="' + esc(p.name) + '" loading="lazy" onerror="this.onerror=null;this.src=\'' + PLACEHOLDER_IMG.replace(/'/g, "\\'") + '\'">' +
                (onSale ? '<span class="product-card-badge">Sale</span>' : '') +
            '</a>' +
            '<button class="product-card-save" type="button" data-id="' + esc(p.id) + '" aria-label="Save ' + esc(p.name) + '" aria-pressed="false">' +
                '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
            '</button>' +
            '<div class="product-card-body">' +
                '<div class="product-card-tags">' +
                    '<span class="product-card-tag' + (p.condition === 'used' ? ' is-used' : '') + '">' + condLabel + '</span>' +
                    '<span class="product-card-tag">' + esc(p.brand) + '</span>' +
                '</div>' +
                '<h3 class="product-card-title"><a href="shop.html?id=' + encodeURIComponent(p.id) + '">' + esc(p.name) + '</a></h3>' +
                '<p class="product-card-text">' + esc(p.description) + '</p>' +
                '<p class="product-card-price">' +
                    '<span class="price-now' + (onSale ? ' price-sale' : '') + '">' + money(p.price) + '</span>' +
                    (onSale ? ' <s class="price-old">' + money(p.oldPrice) + '</s>' : '') +
                '</p>' +
                (soldOut ? '<p class="product-card-stock">Out of stock</p>' : '') +
            '</div>' +
        '</article>';
    }

    function showLoading() {
        var html = '';
        for (var i = 0; i < 6; i++) html += '<article class="product-card is-loading" aria-hidden="true"></article>';
        grid.innerHTML = html;
        emptyEl.hidden = true;
        countEl.textContent = 'Loading products...';
    }

    function render(data) {
        var items = data.content || [];
        var total = data.totalElements != null ? data.totalElements : items.length;

        grid.innerHTML = items.map(cardHtml).join('');
        emptyEl.hidden = items.length > 0;
        grid.hidden = items.length === 0;
        countEl.textContent = total + (total === 1 ? ' product' : ' products');

        renderPager(data.number || 0, data.totalPages || 1);

        // If saved.js exposes a refresh function, let it re-mark saved hearts on the new cards
        if (window.JapanTechSaved && typeof window.JapanTechSaved.refresh === 'function') {
            window.JapanTechSaved.refresh();
        }
    }

    function renderPager(current, totalPages) {
        if (totalPages <= 1) { pagerEl.hidden = true; pagerEl.innerHTML = ''; return; }

        var html = '<button type="button" data-page="' + (current - 1) + '"' + (current === 0 ? ' disabled' : '') + '>Previous</button>';
        for (var i = 0; i < totalPages; i++) {
            html += '<button type="button" data-page="' + i + '"' + (i === current ? ' aria-current="page"' : '') + '>' + (i + 1) + '</button>';
        }
        html += '<button type="button" data-page="' + (current + 1) + '"' + (current >= totalPages - 1 ? ' disabled' : '') + '>Next</button>';

        pagerEl.innerHTML = html;
        pagerEl.hidden = false;
    }

    function updateFilterBadge(f) {
        var n = (f.category ? 1 : 0) + f.condition.length + f.brand.length +
                (f.minPrice || f.maxPrice ? 1 : 0) + (f.inStock ? 1 : 0);
        filterCount.textContent = n;
        filterCount.hidden = n === 0;
    }

    /* ---------- main refresh ---------- */
    function refresh() {
        var f = readFilters();
        var myId = ++requestId;

        writeUrl(f);
        updateFilterBadge(f);
        showLoading();
        grid.hidden = false;

        fetchProducts(f).then(function (data) {
            if (myId !== requestId) return;   // a newer search already started
            render(data);
        });
    }

    function resetAndRefresh() {
        state.page = 0;
        refresh();
    }

    function clearFilters() {
        searchEl.value = '';
        sortEl.value = 'newest';
        minEl.value = '';
        maxEl.value = '';
        stockEl.checked = false;
        document.querySelector('input[name="category"][value=""]').checked = true;
        document.querySelectorAll('input[name="condition"], input[name="brand"]').forEach(function (el) { el.checked = false; });
        resetAndRefresh();
    }

    /* ---------- mobile filter panel ---------- */
    function openFilters(open) {
        filtersEl.classList.toggle('is-open', open);
        filterBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    /* ---------- wire everything up ---------- */
    function init() {
        // brand checkboxes
        brandBox.innerHTML = BRANDS.map(function (b) {
            return '<label class="filter-option"><input type="checkbox" name="brand" value="' + esc(b) + '"> ' + esc(b) + '</label>';
        }).join('');

        restoreFromUrl();

        // search waits until the person stops typing
        var timer;
        searchEl.addEventListener('input', function () {
            clearTimeout(timer);
            timer = setTimeout(resetAndRefresh, 300);
        });

        sortEl.addEventListener('change', resetAndRefresh);

        // filters apply straight away on desktop; on phones they apply when the panel closes
        filtersEl.addEventListener('change', function () {
            if (window.matchMedia('(min-width: 900px)').matches) resetAndRefresh();
        });
        var priceTimer;
        [minEl, maxEl].forEach(function (el) {
            el.addEventListener('input', function () {
                clearTimeout(priceTimer);
                if (window.matchMedia('(min-width: 900px)').matches) priceTimer = setTimeout(resetAndRefresh, 500);
            });
        });

        $('clearFilters').addEventListener('click', clearFilters);
        $('emptyClear').addEventListener('click', clearFilters);

        filterBtn.addEventListener('click', function () { openFilters(true); });
        $('filterClose').addEventListener('click', function () { openFilters(false); });
        $('filterApply').addEventListener('click', function () { openFilters(false); resetAndRefresh(); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') openFilters(false); });

        pagerEl.addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-page]');
            if (!btn || btn.disabled) return;
            state.page = parseInt(btn.getAttribute('data-page'), 10);
            refresh();
            window.scrollTo({ top: document.querySelector('.shop').offsetTop - 80, behavior: 'smooth' });
        });

        refresh();
    }

    init();
})();