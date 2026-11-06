export const products = [
  {
    id: 'everyday-mug',
    name: 'The everyday mug',
    subtitle: 'A warm hug for your hands',
    price: 1800,
    category: 'comforts',
    image: 'mug.jpg',
    alt: 'A simple white ceramic mug with a rounded handle',
    badge: 'A little favorite',
    color: 'Warm cream',
    description: 'For slow mornings, afternoon pauses, and one more cup with a friend. A simple ceramic companion that turns an everyday ritual into a little moment of joy.',
    details: ['Glazed ceramic, 350 ml', 'Comfortable, rounded handle', 'Demo product; specifications are illustrative'],
    isNew: false,
  },
  {
    id: 'calm-candle',
    name: 'A moment of calm',
    subtitle: 'Light a little happy',
    price: 2400,
    category: 'comforts',
    image: 'candle.jpg',
    alt: 'Warm candlelight in a cozy, softly styled setting',
    badge: '',
    color: 'Soft amber',
    description: 'A gentle invitation to put the day on pause. Cozy, softly scented candlelight for a quiet evening, a good book, or a little time just for you.',
    details: ['Amber & vanilla-inspired scent', 'Soy wax blend, 180 g', 'Demo product; specifications are illustrative'],
    isNew: false,
  },
  {
    id: 'little-thoughts',
    name: 'Little thoughts notebook',
    subtitle: 'For big dreams & tiny doodles',
    price: 1400,
    category: 'paper',
    image: 'notebook.jpg',
    alt: 'An open notebook and writing essentials on a thoughtfully arranged desk',
    badge: 'New little thing',
    color: 'Natural paper',
    description: 'A home for the ideas, lists, and little thoughts worth keeping. Fill the pages with plans, doodles, or a note to your future self. There’s no wrong place to begin.',
    details: ['A5 notebook, 160 lined pages', 'Soft-touch cover, lay-flat binding', 'Demo product; specifications are illustrative'],
    isNew: true,
  },
  {
    id: 'just-because-box',
    name: 'The just-because gift box',
    subtitle: 'A little box. A lot of love.',
    price: 3800,
    category: 'gifts',
    image: 'gift-box.jpg',
    alt: 'A ZHUMERA cream gift box wrapped with a caramel ribbon',
    badge: 'Ready to make their day',
    color: 'Caramel & cream',
    description: 'No big occasion required. A thoughtfully presented little surprise, finished with our signature caramel bow. A lovely way to say thank you, thinking of you, or simply, you’re wonderful.',
    details: ['Curated mug & notebook gift set', 'Signature box and ribbon included', 'Demo product; contents are illustrative'],
    isNew: false,
  },
  {
    id: 'blooming-little-day',
    name: 'A blooming little day',
    subtitle: 'A handful of sunshine',
    price: 2800,
    category: 'gifts',
    image: 'flowers.jpg',
    alt: 'A colorful arrangement of seasonal flowers and greenery',
    badge: 'New little thing',
    color: 'Seasonal blooms',
    description: 'For the days that could use a little color. A joyful, seasonal bunch to brighten a favorite corner or bring a smile to someone’s doorstep.',
    details: ['Petite seasonal floral arrangement', 'Colors and stems may vary', 'Demo product; no flowers will be delivered'],
    isNew: true,
  },
  {
    id: 'heartfelt-tags',
    name: 'The heartfelt gift tags',
    subtitle: 'The sweetest finishing touch',
    price: 800,
    category: 'paper',
    image: 'gift-tag.jpg',
    alt: 'A round ZHUMERA gift tag made from cream paper with natural twine',
    badge: '',
    color: 'Coffee & cream',
    description: 'Because the little details make it personal. Our signature smiling gift tags leave just enough room for a few words from the heart.',
    details: ['Set of 6 round paper gift tags', 'Natural twine included', 'Demo product; specifications are illustrative'],
    isNew: false,
  },
];

export const money = (cents) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export function findProducts({ category = 'all', query = '', favorites = null, newOnly = false } = {}) {
  const search = query.trim().toLowerCase();
  return products.filter((product) =>
    (category === 'all' || product.category === category) &&
    (!newOnly || product.isNew) &&
    (!favorites || favorites.includes(product.id)) &&
    (!search || `${product.name} ${product.subtitle} ${product.category} ${product.description} ${product.details.join(' ')}`.toLowerCase().includes(search)),
  );
}

export function normalizeCart(value) {
  if (!Array.isArray(value)) return [];
  const cart = new Map();
  for (const item of value) {
    if (!item || !products.some((product) => product.id === item.id) || !Number.isInteger(item.quantity) || item.quantity < 1) continue;
    cart.set(item.id, { id: item.id, quantity: Math.min(20, (cart.get(item.id)?.quantity ?? 0) + item.quantity) });
  }
  return [...cart.values()];
}

export function cartTotals(cart, giftWrap = false) {
  const cleanCart = normalizeCart(cart);
  const quantity = cleanCart.reduce((total, item) => total + item.quantity, 0);
  const merchandise = cleanCart.reduce((total, item) => total + products.find((product) => product.id === item.id).price * item.quantity, 0);
  return { quantity, merchandise, subtotal: merchandise + (giftWrap && quantity ? 400 : 0), shippingRemaining: Math.max(0, 6000 - merchandise) };
}
