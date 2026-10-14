const topGrid = document.getElementById('topProducts');

const money = new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',                    // change this if your prices are in another currency
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
});

const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

function makeEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function buildCard(p) {
    const url = 'shop.html?product=' + encodeURIComponent(p.slug);
    const onSale = p.salePrice != null && p.salePrice < p.price;

    const card = makeEl('article', 'product-card');

    const media = makeEl('a', 'product-card-media');
    media.href = url;
    const img = makeEl('img');
    img.src = p.imageUrl;
    img.alt = p.name;
    img.loading = 'lazy';
    media.append(img);
    if (onSale) media.append(makeEl('span', 'product-card-badge', 'Sale'));

    const save = makeEl('button', 'product-card-save');
    save.type = 'button';
    save.dataset.id = p.id;
    save.setAttribute('aria-label', 'Save ' + p.name);
    save.setAttribute('aria-pressed', 'false');
    save.innerHTML = HEART;             // a fixed string we wrote ourselves, never server data

    const body = makeEl('div', 'product-card-body');
    const title = makeEl('h3', 'product-card-title');
    const link = makeEl('a', null, p.name);
    link.href = url;
    title.append(link);

    const text = makeEl('p', 'product-card-text', p.description || '');

    const price = makeEl('p', 'product-card-price');
    price.append(makeEl('span', onSale ? 'price-now price-sale' : 'price-now',
                        money.format(onSale ? p.salePrice : p.price)));
    if (onSale) price.append(makeEl('s', 'price-old', money.format(p.price)));

    body.append(title, text, price);
    card.append(media, save, body);
    return card;
}

async function loadTopProducts() {
    try {
        const response = await fetch(topGrid.dataset.endpoint);
        if (!response.ok) throw new Error('HTTP ' + response.status);

        const products = await response.json();
        if (products.length === 0) return;            // nothing to show: keep the fallback cards

        topGrid.replaceChildren(...products.map(buildCard));
        refreshSavedUI();                             // from saved.js: fills in hearts that are already saved
    } catch (error) {
        console.warn('Showing the built-in cards:', error.message);
    }
}

if (topGrid) loadTopProducts();