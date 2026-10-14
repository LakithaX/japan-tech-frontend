/* ===================================================================
   BLOG PAGE
   -------------------------------------------------------------------
   The full articles live on Medium. This page only shows a card for
   each one, and every card links out to its Medium URL.

   To add an article: copy one object in POSTS, paste it at the TOP
   of the list, and change the values. That's all.

   Later, if you want Spring Boot to supply the list, return the same
   fields from GET /api/posts and set USE_API = true.
   =================================================================== */

(function () {
    'use strict';

    var USE_API   = false;
    var API_URL   = '/api/posts';
    var PAGE_SIZE = 9;

    var PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><rect width="320" height="200" fill="#f0f0f0"/>' +
        '<rect x="125" y="50" width="70" height="100" rx="10" fill="none" stroke="#bbb" stroke-width="4"/></svg>');

    /* newest first. date is YYYY-MM-DD. url is the article's Medium link. */
    var POSTS = [
        {
            title: 'Free Up Storage Space on Your iPhone',
            excerpt: 'Running out of storage? Here are a few quick settings that give you space back without deleting your favourite photos.',
            tag: 'iPhone', author: 'admin', date: '2026-10-01', readMinutes: 4,
            image: 'images/blog-1.jpg',
            url: 'https://medium.com/@your-medium-handle/free-up-storage-space-on-your-iphone'
        },
        {
            title: 'Do This Before You Sell Your iPhone',
            excerpt: 'Planning to sell your phone? Read on to find out what to do before it leaves your hands, so your data stays yours.',
            tag: 'iPhone', author: 'admin', date: '2026-10-01', readMinutes: 5,
            image: 'images/blog-2.jpg',
            url: 'https://medium.com/@your-medium-handle/do-this-before-you-sell-your-iphone'
        }
        /* add more posts here, separated by commas */
    ];

    var $ = function (id) { return document.getElementById(id); };
    var grid    = $('blogGrid');
    var chipsEl = $('blogChips');
    var searchEl = $('blogSearch');
    var countEl = $('blogCount');
    var emptyEl = $('blogEmpty');
    var moreBtn = $('blogMore');

    var posts = POSTS.slice();
    var state = { tag: 'All', q: '', shown: PAGE_SIZE };

    function esc(s) {
        var d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    function formatDate(iso) {
        var d = new Date(iso + 'T00:00:00');
        if (isNaN(d)) return '';
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function cardHtml(p) {
        var url = esc(p.url);
        return '' +
        '<article class="blog-card">' +
            '<a href="' + url + '" class="blog-card-media" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true">' +
                '<img src="' + esc(p.image || PLACEHOLDER_IMG) + '" alt="" loading="lazy" onerror="this.onerror=null;this.src=\'' + PLACEHOLDER_IMG.replace(/'/g, "\\'") + '\'">' +
                '<span class="blog-card-tag">' + esc(p.tag) + '</span>' +
            '</a>' +
            '<div class="blog-card-body">' +
                '<ul class="blog-card-meta">' +
                    '<li><time datetime="' + esc(p.date) + '">' + formatDate(p.date) + '</time></li>' +
                    (p.readMinutes ? '<li>' + esc(p.readMinutes) + ' min read</li>' : '') +
                    (p.author ? '<li>by ' + esc(p.author) + '</li>' : '') +
                '</ul>' +
                '<h3 class="blog-card-title"><a href="' + url + '" target="_blank" rel="noopener noreferrer">' + esc(p.title) + '</a></h3>' +
                '<p class="blog-card-text">' + esc(p.excerpt) + '</p>' +
                '<a href="' + url + '" class="btn blog-card-btn" target="_blank" rel="noopener noreferrer" aria-label="Read &quot;' + esc(p.title) + '&quot; on Medium (opens in a new tab)">Read on Medium</a>' +
            '</div>' +
        '</article>';
    }

    function buildChips() {
        var tags = ['All'];
        posts.forEach(function (p) { if (p.tag && tags.indexOf(p.tag) === -1) tags.push(p.tag); });

        chipsEl.innerHTML = tags.map(function (t) {
            return '<button type="button" class="blog-chip" data-tag="' + esc(t) + '" aria-pressed="' + (t === state.tag) + '">' + esc(t) + '</button>';
        }).join('');
    }

    function filtered() {
        var q = state.q.toLowerCase();
        return posts.filter(function (p) {
            if (state.tag !== 'All' && p.tag !== state.tag) return false;
            if (q && (p.title + ' ' + p.excerpt + ' ' + p.tag).toLowerCase().indexOf(q) === -1) return false;
            return true;
        });
    }

    function render() {
        var list = filtered();
        var visible = list.slice(0, state.shown);

        grid.innerHTML = visible.map(cardHtml).join('');
        grid.hidden = list.length === 0;
        emptyEl.hidden = list.length > 0;
        moreBtn.hidden = list.length <= state.shown;
        countEl.textContent = list.length + (list.length === 1 ? ' article' : ' articles');

        Array.prototype.forEach.call(chipsEl.children, function (c) {
            c.setAttribute('aria-pressed', c.getAttribute('data-tag') === state.tag ? 'true' : 'false');
        });
    }

    function reset() {
        state.tag = 'All';
        state.q = '';
        state.shown = PAGE_SIZE;
        searchEl.value = '';
        render();
    }

    function sortNewest() {
        posts.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    }

    function start() {
        sortNewest();
        buildChips();
        render();
    }

    chipsEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.blog-chip');
        if (!btn) return;
        state.tag = btn.getAttribute('data-tag');
        state.shown = PAGE_SIZE;
        render();
    });

    var timer;
    searchEl.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
            state.q = searchEl.value.trim();
            state.shown = PAGE_SIZE;
            render();
        }, 250);
    });

    moreBtn.addEventListener('click', function () { state.shown += PAGE_SIZE; render(); });
    $('blogReset').addEventListener('click', reset);

    if (USE_API) {
        fetch(API_URL, { headers: { 'Accept': 'application/json' } })
            .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
            .then(function (data) { posts = Array.isArray(data) ? data : (data.content || []); })
            .catch(function () { /* keep the built-in POSTS */ })
            .then(start);
    } else {
        start();
    }
})();