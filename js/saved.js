const SAVED_KEY = 'savedProducts';

function getSaved() {
    try {
        return JSON.parse(localStorage.getItem(SAVED_KEY)) || [];
    } catch (e) {
        return [];                      // corrupted or blocked storage: start empty
    }
}

function setSaved(ids) {
    localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
}

// a random id that identifies this browser, not a person
function getVisitorId() {
    let id = localStorage.getItem('visitorId');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('visitorId', id);
    }
    return id;
}

// repaint the navbar badge and every heart on the page
function refreshSavedUI() {
    const saved = getSaved();

    document.querySelectorAll('.nav-saved-count').forEach(function (badge) {
        badge.textContent = saved.length;
    });

    document.querySelectorAll('.product-card-save').forEach(function (btn) {
        btn.setAttribute('aria-pressed', saved.includes(Number(btn.dataset.id)));
    });
}

// ONE listener on the whole page handles every heart, now and in the future
document.addEventListener('click', function (event) {
    const btn = event.target.closest('.product-card-save');
    if (!btn) return;

    const id = Number(btn.dataset.id);
    const nowSaved = !getSaved().includes(id);

    setSaved(nowSaved ? [...getSaved(), id] : getSaved().filter(function (x) { return x !== id; }));
    refreshSavedUI();

    // tell the server so the "most saved" ranking can count it; the page works even if this fails
    fetch('/api/products/' + id + '/save', {
        method: nowSaved ? 'POST' : 'DELETE',
        headers: { 'X-Visitor-Id': getVisitorId() }
    }).catch(function () {});
});

refreshSavedUI();