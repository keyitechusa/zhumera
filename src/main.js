import { products, money, findProducts, normalizeCart, cartTotals } from './shop.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const icon = (name, className = '') => `<svg class="icon ${className}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const imageUrl = (filename) => `${import.meta.env.BASE_URL}images/${filename}`;
const storageKey = 'zhumera-demo-v1';
let toastTimer;
let cart = [];
let favorites = [];
let giftWrap = false;
let category = 'all';
let newOnly = false;
let favoritesOnly = false;
let showAll = false;
const dialogReturnFocus = new WeakMap();

function toast(message) {
  clearTimeout(toastTimer);
  ($('dialog[open]') || document.body).append($('#toast'));
  $('#toast span').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3800);
}

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
  if (saved) {
    cart = normalizeCart(saved.cart);
    favorites = Array.isArray(saved.favorites) ? [...new Set(saved.favorites.filter((id) => products.some((product) => product.id === id)))] : [];
    giftWrap = saved.giftWrap === true && cart.length > 0;
  }
} catch (error) {
  console.warn('ZHUMERA could not restore the local demo bag.', error);
  toast('Your saved bag could not be restored. Let’s start fresh.');
}

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ cart, favorites, giftWrap }));
  } catch (error) {
    console.warn('ZHUMERA could not save the demo bag locally.', error);
    toast('Your browser cannot save this bag. It will last for this visit only.');
  }
}

function productCard(product) {
  const saved = favorites.includes(product.id);
  return `<article class="product-card">
    <div class="product-image-container">
      <button class="product-image-button" data-product="${product.id}" aria-label="View ${product.name}"><img src="${imageUrl(product.image)}" alt="${product.alt}" width="600" height="680" loading="lazy" /></button>
      ${product.badge ? `<span class="product-badge ${product.isNew ? 'badge-new' : ''}">${product.badge}</span>` : ''}
      <button class="favorite-button ${saved ? 'is-saved' : ''}" data-favorite="${product.id}" aria-label="${saved ? 'Unsave' : 'Save'} ${product.name}" aria-pressed="${saved}">${icon('heart')}</button>
      <button class="quick-view" data-product="${product.id}">A closer look ${icon('arrow')}</button>
    </div>
    <div class="product-info"><div><button class="product-name" data-product="${product.id}">${product.name}</button><p>${product.subtitle}</p><div class="product-color"><span></span>${product.color}</div></div><div class="product-purchase"><span class="product-price">${money(product.price)}</span><button class="add-button" data-add="${product.id}" aria-label="Add ${product.name} to bag">${icon('bag')}<span>+</span></button></div></div>
  </article>`;
}

function renderProducts() {
  let matches = findProducts({ category, newOnly, favorites: favoritesOnly ? favorites : null });
  if (!showAll && category === 'all' && !newOnly && !favoritesOnly) matches = matches.slice(0, 4);
  $('#product-grid').innerHTML = matches.map(productCard).join('');
  $('#collection-empty').hidden = matches.length > 0;
  $('.results-announcement').textContent = `${matches.length} ${favoritesOnly ? 'saved ' : ''}little things to explore.`;
  $('#collection-title').innerHTML = favoritesOnly ? 'Your saved <em>little things.</em>' : newOnly ? 'Hello, new <em>little things.</em>' : 'Meet your new <em>favorite things.</em>';
  $$('.filter-tab').forEach((tab) => {
    const active = tab.dataset.filter === category && !newOnly && !favoritesOnly;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', String(active));
  });
  $('#view-all').innerHTML = showAll && !favoritesOnly && !newOnly && category === 'all' ? `Back to the favorites ${icon('arrow')}` : `Explore the collection ${icon('arrow')}`;
}

function setFilter(nextCategory = 'all', options = {}) {
  category = nextCategory;
  newOnly = options.newOnly || false;
  favoritesOnly = options.favoritesOnly || false;
  showAll = options.showAll || nextCategory !== 'all';
  renderProducts();
}

function openDialog(dialog) {
  closeMobileMenu();
  const previousDialog = $('dialog[open]');
  const returnFocus = previousDialog ? dialogReturnFocus.get(previousDialog) : document.activeElement;
  $$('dialog[open]').forEach((open) => open.close());
  dialogReturnFocus.set(dialog, returnFocus);
  dialog.showModal();
  document.body.classList.add('dialog-open');
}

$$('dialog').forEach((dialog) => {
  dialog.addEventListener('close', () => {
    if (dialog.contains($('#toast'))) document.body.append($('#toast'));
    if (!$('dialog[open]')) {
      document.body.classList.remove('dialog-open');
      const returnFocus = dialogReturnFocus.get(dialog);
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    }
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
});

document.addEventListener('click', (event) => {
  const close = event.target.closest('[data-close]');
  if (close) close.closest('dialog').close();
  const product = event.target.closest('[data-product]');
  if (product) openProduct(product.dataset.product);
  const add = event.target.closest('[data-add]');
  if (add) addToCart(add.dataset.add);
  const favorite = event.target.closest('[data-favorite]');
  if (favorite) toggleFavorite(favorite.dataset.favorite);
  const nav = event.target.closest('[data-nav-filter], [data-new-arrivals]');
  if (nav) {
    setFilter(nav.dataset.navFilter || 'all', { newOnly: nav.hasAttribute('data-new-arrivals'), showAll: true });
    closeMobileMenu();
  }
  const infoButton = event.target.closest('[data-info]');
  if (infoButton) showInfo(infoButton.dataset.info);
});

$$('.filter-tab').forEach((tab) => tab.addEventListener('click', () => setFilter(tab.dataset.filter)));
$('#view-all').addEventListener('click', () => setFilter('all', { showAll: !(showAll && category === 'all' && !favoritesOnly && !newOnly) }));
$('#browse-favorites').addEventListener('click', () => setFilter());

function toggleFavorite(id) {
  const product = products.find((item) => item.id === id);
  const restoreGridFocus = $('#product-grid').contains(document.activeElement);
  if (favorites.includes(id)) {
    favorites = favorites.filter((saved) => saved !== id);
    toast('Little thing removed from your favorites.');
  } else {
    favorites.push(id);
    toast(`${product.name} saved with a little love.`);
  }
  persist();
  renderProducts();
  updateFavoriteCount();
  $$(`[data-favorite="${id}"]`).forEach((button) => {
    const saved = favorites.includes(id);
    button.classList.toggle('is-saved', saved);
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute('aria-label', `${saved ? 'Unsave' : 'Save'} ${product.name}`);
  });
  if (restoreGridFocus) {
    ($(`[data-favorite="${id}"]`, $('#product-grid')) || $('[data-favorite]', $('#product-grid')) || $('#browse-favorites')).focus();
  }
}

function updateFavoriteCount() {
  $('.favorite-count').textContent = favorites.length;
  $('.favorite-count').hidden = !favorites.length;
  $('#wishlist-open').setAttribute('aria-label', `View saved favorites, ${favorites.length} items`);
}

function showFavorites() {
  closeMobileMenu();
  setFilter('all', { favoritesOnly: true, showAll: true });
  $('#collection').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}
$('#wishlist-open').addEventListener('click', showFavorites);
$('#mobile-favorites').addEventListener('click', showFavorites);

function openProduct(id) {
  const product = products.find((item) => item.id === id);
  const saved = favorites.includes(id);
  $('#product-detail').innerHTML = `<div class="detail-image"><img src="${imageUrl(product.image)}" alt="${product.alt}" width="600" height="680" /></div>
    <div class="detail-copy"><p class="eyebrow">A LITTLE THING TO LOVE</p><h2 id="product-title">${product.name}</h2><p class="detail-subtitle">${product.subtitle}</p><strong class="detail-price">${money(product.price)}</strong><p>${product.description}</p><span class="detail-color"><span></span>${product.color}</span><ul>${product.details.map((detail) => `<li>${detail}</li>`).join('')}</ul><div class="detail-actions"><button class="button button-primary" data-add="${product.id}">Add to your little bag ${icon('bag')}</button><button class="favorite-button detail-favorite ${saved ? 'is-saved' : ''}" data-favorite="${id}" aria-label="${saved ? 'Unsave' : 'Save'} ${product.name}" aria-pressed="${saved}">${icon('heart')}</button></div><p class="detail-note">${icon('gift')} A thoughtful little find, ready to make someone smile.</p></div>`;
  $('#product-dialog').setAttribute('aria-labelledby', 'product-title');
  openDialog($('#product-dialog'));
}

function addToCart(id) {
  const existing = cart.find((item) => item.id === id);
  if (existing?.quantity === 20) {
    toast('A maximum of 20 of each little thing fits in this demo bag.');
    return;
  }
  if (existing) existing.quantity += 1;
  else cart.push({ id, quantity: 1 });
  persist();
  renderCart();
  toast(`${products.find((item) => item.id === id).name} added to your bag.`);
}

function renderCart() {
  const totals = cartTotals(cart, giftWrap);
  $('.cart-count').textContent = totals.quantity;
  $('#cart-open').setAttribute('aria-label', `Open shopping bag, ${totals.quantity} items`);
  $('#cart-title-count').textContent = `(${totals.quantity})`;
  $('#shipping-message').textContent = totals.shippingRemaining ? `A little closer! ${money(totals.shippingRemaining)} away from free shipping.` : 'A little extra happy: your shipping is on us!';
  $('#shipping-progress').style.width = `${Math.min(100, totals.merchandise / 6000 * 100)}%`;
  $('#cart-summary').hidden = !cart.length;
  $('.cart-shipping').hidden = !cart.length;
  $('#gift-wrap').checked = giftWrap;
  $('#cart-subtotal').textContent = money(totals.subtotal);
  $('#cart-items').innerHTML = cart.length ? cart.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    return `<article class="cart-item"><button class="cart-image-button" data-product="${product.id}" aria-label="View ${product.name}"><img src="${imageUrl(product.image)}" alt="${product.alt}" width="100" height="120" /></button><div class="cart-item-copy"><h3>${product.name}</h3><p>${product.color}</p><strong>${money(product.price * item.quantity)}</strong><div class="cart-item-controls"><div class="quantity-control"><button data-quantity="${product.id}" data-change="-1" aria-label="Decrease quantity of ${product.name}">&minus;</button><span aria-label="Quantity">${item.quantity}</span><button data-quantity="${product.id}" data-change="1" aria-label="Increase quantity of ${product.name}" ${item.quantity >= 20 ? 'disabled' : ''}>+</button></div><button class="remove-item" data-remove="${product.id}">Remove<span class="visually-hidden"> ${product.name}</span></button></div></div></article>`;
  }).join('') : `<div class="cart-empty">${icon('bag')}<h3>A little room for happy.</h3><p>Your bag is waiting for its first little thing.</p><button class="button button-primary" id="empty-browse">Explore the collection ${icon('arrow')}</button></div>`;
}

$('#cart-open').addEventListener('click', () => { renderCart(); openDialog($('#cart-dialog')); });
$('#cart-items').addEventListener('click', (event) => {
  const quantityButton = event.target.closest('[data-quantity]');
  const removeButton = event.target.closest('[data-remove]');
  if (event.target.closest('#empty-browse')) {
    $('#cart-dialog').close();
    setFilter('all', { showAll: true });
    $('#collection').scrollIntoView({ behavior: 'smooth' });
  }
  if (!quantityButton && !removeButton) return;
  const id = quantityButton?.dataset.quantity || removeButton.dataset.remove;
  const item = cart.find((entry) => entry.id === id);
  if (removeButton) cart = cart.filter((entry) => entry.id !== id);
  else {
    item.quantity = Math.min(20, item.quantity + Number(quantityButton.dataset.change));
    if (item.quantity <= 0) cart = cart.filter((entry) => entry.id !== id);
  }
  if (!cart.length) giftWrap = false;
  persist();
  renderCart();
  if (removeButton || !cart.some((entry) => entry.id === id)) {
    toast('Little thing removed from your bag.');
    ($('#cart-items button') || $('#cart-open')).focus();
  } else {
    const nextButton = $(`[data-quantity="${id}"][data-change="${quantityButton.dataset.change}"]`);
    (nextButton.disabled ? $(`[data-quantity="${id}"][data-change="-1"]`) : nextButton).focus();
  }
});
$('#gift-wrap').addEventListener('change', (event) => {
  giftWrap = event.target.checked;
  persist();
  $('#cart-subtotal').textContent = money(cartTotals(cart, giftWrap).subtotal);
});
$('#checkout-button').addEventListener('click', () => {
  const totals = cartTotals(cart, giftWrap);
  showInfo('checkout', `<p>Your little bag has <strong>${totals.quantity} ${totals.quantity === 1 ? 'item' : 'items'}</strong>, with a demo subtotal of <strong>${money(totals.subtotal)}</strong>${giftWrap ? ', including gift wrap' : ''}.</p><p>This is a visual storefront demo. No order has been placed, no payment will be taken, and your bag stays right here for you to explore.</p><p>A real checkout can be connected when ZHUMERA moves to Shopify.</p>`);
});

function renderSearch() {
  const query = $('#search-input').value;
  const matches = findProducts({ query });
  $('#search-status').textContent = query.trim() ? `${matches.length} little ${matches.length === 1 ? 'find' : 'finds'} for you` : 'A few little things you might love';
  $('#search-results').innerHTML = matches.length ? matches.map((product) => `<button class="search-result" data-product="${product.id}"><img src="${imageUrl(product.image)}" alt="" width="68" height="76" /><span><strong>${product.name}</strong><small>${product.subtitle}</small></span><span>${money(product.price)}</span>${icon('arrow')}</button>`).join('') : `<div class="search-empty">${icon('search')}<h3>No little finds just yet.</h3><p>Try “mug”, “gift”, “notebook”, or “calm”.</p></div>`;
}
$('#search-open').addEventListener('click', () => {
  $('#search-input').value = '';
  renderSearch();
  openDialog($('#search-dialog'));
  $('#search-input').focus();
});
$('#search-input').addEventListener('input', renderSearch);

function closeMobileMenu() {
  $('#mobile-menu').hidden = true;
  $('.mobile-menu-button').setAttribute('aria-expanded', 'false');
  $('.mobile-menu-button').setAttribute('aria-label', 'Open menu');
}
$('.mobile-menu-button').addEventListener('click', () => {
  const isOpen = !$('#mobile-menu').hidden;
  $('#mobile-menu').hidden = isOpen;
  $('.mobile-menu-button').setAttribute('aria-expanded', String(!isOpen));
  $('.mobile-menu-button').setAttribute('aria-label', isOpen ? 'Open menu' : 'Close menu');
});
$$('#mobile-menu a').forEach((link) => link.addEventListener('click', closeMobileMenu));
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const dialog = $('dialog[open]');
  if (dialog) {
    event.preventDefault();
    dialog.close();
  } else if (!$('#mobile-menu').hidden) {
    closeMobileMenu();
    $('.mobile-menu-button').focus();
  }
});
matchMedia('(min-width: 961px)').addEventListener('change', (event) => { if (event.matches) closeMobileMenu(); });

const info = {
  story: {
    title: 'Little things. A lot of heart.',
    content: '<p>ZHUMERA is built around a simple idea: thoughtful gestures don’t need a special occasion. We love soft colors, everyday comforts, and gifts that feel personal.</p><p>Our collection brings that feeling to life through cozy home finds, paper goods, and ready-to-give little surprises. Every detail is inspired by the warmth of coffee brown, caramel, and cream.</p><p>This is the first little look at our world. We’re so happy you’re here.</p>',
  },
  shipping: {
    title: 'A happy mail day awaits.',
    content: '<p>Our planned offer is complimentary standard shipping on merchandise orders of $60 or more. Final delivery regions, rates, and return policies will be announced when the shop launches.</p><p>This is a demo store. No orders are processed and nothing will be shipped.</p>',
  },
  gifting: {
    title: 'A little extra love.',
    content: '<p>Preview our signature gift presentation with caramel ribbon, thoughtful finishing touches, and a handwritten-style note. You can try the $4 gift-wrap option in your demo bag.</p><p>The just-because gift box already includes its signature box and ribbon. Optional gift wrap is an extra decorative layer for your whole bag.</p><p>All products, prices, and gifting services are illustrative until launch.</p>',
  },
  contact: {
    title: 'So lovely to meet you.',
    content: '<p>Our little shop is still coming together. Contact details and customer support will be shared here when we launch.</p><p>For now, take a look around, find your favorites, and make yourself at home. No messages or personal details are collected by this demo.</p>',
  },
  privacy: {
    title: 'Your little privacy note.',
    content: '<p>This demo saves your bag and favorites in your browser’s local storage so they’re here when you return. No account, payment, analytics, or marketing backend is connected.</p><p>The newsletter preview does not save or send your email. Product images are served locally. Google Fonts requests fonts from Google; your browser may share connection information with that service.</p><p>You can clear your bag and favorites by clearing this site’s data in your browser settings.</p>',
  },
  social: {
    title: 'Something lovely is growing.',
    content: '<p>Our little corner of Instagram is not connected yet. When ZHUMERA launches, you’ll find gifting ideas, behind-the-scenes moments, and plenty of everyday inspiration here.</p><p>For now, enjoy a little look around our demo shop.</p>',
  },
  checkout: { title: 'A little peek at checkout.' },
};

function showInfo(key, content) {
  const item = info[key];
  $('#info-title').textContent = item.title;
  $('#info-content').innerHTML = content || item.content;
  openDialog($('#info-dialog'));
}
$('#story-more').addEventListener('click', () => showInfo('story'));
$('#social-button').addEventListener('click', () => showInfo('social'));
$('#newsletter-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  $('#newsletter-status').textContent = 'A lovely preview! No email was saved or sent. Sign-ups open at launch.';
  $('#newsletter-status').classList.add('newsletter-success');
  $('#newsletter-email').value = '';
});
$('#year').textContent = new Date().getFullYear();
renderProducts();
renderCart();
updateFavoriteCount();
