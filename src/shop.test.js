import test from 'node:test';
import assert from 'node:assert/strict';
import { products, findProducts, normalizeCart, cartTotals, money } from './shop.js';

test('category, arrivals, favorites and text filters work together', () => {
  assert.equal(findProducts().length, products.length);
  assert.equal(findProducts({ category: 'comforts' }).length, 2);
  assert.equal(findProducts({ newOnly: true }).length, 2);
  assert.deepEqual(findProducts({ query: '  MUG ' }).map((product) => product.id), ['everyday-mug', 'just-because-box']);
  assert.equal(findProducts({ favorites: [] }).length, 0);
  assert.equal(findProducts({ favorites: ['calm-candle'], category: 'comforts', query: 'calm' })[0].id, 'calm-candle');
  assert.equal(findProducts({ query: '<script>not a product</script>' }).length, 0);
});

test('restored carts exclude stale or invalid data, merge duplicates, and cap quantities', () => {
  assert.deepEqual(normalizeCart(null), []);
  assert.deepEqual(normalizeCart([
    null,
    { id: 'missing', quantity: 2 },
    { id: 'calm-candle', quantity: -1 },
    { id: 'calm-candle', quantity: '2' },
    { id: 'calm-candle', quantity: 1.5 },
    { id: 'everyday-mug', quantity: 2 },
    { id: 'everyday-mug', quantity: 3 },
    { id: 'little-thoughts', quantity: 80 },
  ]), [{ id: 'everyday-mug', quantity: 5 }, { id: 'little-thoughts', quantity: 20 }]);
});

test('cart totals use integer cents and shipping excludes gift wrap', () => {
  assert.deepEqual(cartTotals([{ id: 'everyday-mug', quantity: 2 }], true), {
    quantity: 2, merchandise: 3600, subtotal: 4000, shippingRemaining: 2400,
  });
  assert.equal(cartTotals([{ id: 'calm-candle', quantity: 3 }]).shippingRemaining, 0);
  assert.deepEqual(cartTotals([], true), { quantity: 0, merchandise: 0, subtotal: 0, shippingRemaining: 6000 });
  assert.equal(cartTotals([{ id: 'just-because-box', quantity: 1 }, { id: 'little-thoughts', quantity: 1 }, { id: 'heartfelt-tags', quantity: 1 }]).shippingRemaining, 0);
});

test('prices display as USD', () => {
  assert.equal(money(1800), '$18.00');
  assert.equal(money(0), '$0.00');
});
