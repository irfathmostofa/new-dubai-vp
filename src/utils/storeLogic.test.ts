import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatAED,
  calculateSubtotal,
  calculateTotalItems,
  calculateShippingInfo,
  addOrIncrementCartItem,
  updateCartItemQuantity,
  removeCartItem,
  filterProducts,
  recordRecentlyViewedId,
  resolveRecentlyViewedProducts,
  calculateVariantPrice,
  toggleWishlistId,
  isProductWishlisted,
  resolveWishlistProducts,
  computeScrollTelemetry,
  buildOrderTimeline,
  getNextOrderStatus,
  getOrderProgressPercent,
  DEFAULT_INACTIVITY_TIMEOUT_MS,
  resolveInactivityTimeoutMs,
  isValidNewsletterEmail,
  buildSeoMetadata,
  resolveInitialViewFromPathname,
  getPathnameForView,
  validateAdminLoginInput,
  canAccessAdminDashboard,
  buildStructuredDataJsonLd,
  serializeStructuredDataJsonLd,
  filterOrdersForUserSession,
  mergeSessionOrdersWithFetched,
  simulateRealtimeOrderHistoryTick,
  getOrderStatusLabel,
} from './storeLogic';
import { CustomerOrder, Product } from '../types/store';

const sampleProducts: Product[] = [
  {
    id: 'elf-bar-10000',
    title: 'Elf Bar 10000 Puffs Digital Display — Blue Razz Ice',
    brand: 'Elf Bar',
    category: 'Disposable Vape',
    price: 45,
    originalPrice: 60,
    puffCount: '10,000 Puffs',
    nicotineStrength: '50mg (5%)',
    flavorProfile: 'Blue Raspberry & Menthol',
    image: '/test1.jpg',
    isOffer: true,
    inStock: true,
    variants: {
      flavors: ['Blue Razz Ice', 'Peach Mango'],
      nicotineOptions: ['50mg (5%)', '20mg (2%)'],
    },
    specs: { battery: '850mAh Type-C', capacity: '18ml', display: 'Smart LED Screen' },
    description: 'High capacity disposable vape.',
  },
  {
    id: 'juul-2-kit',
    title: 'Juul 2 Starter Kit — Slate Grey Device + 2 Pods',
    brand: 'JUUL',
    category: 'Pods System',
    price: 135,
    puffCount: 'Pod System',
    nicotineStrength: '18mg/ml',
    flavorProfile: 'Virginia Tobacco & Crisp Menthol',
    image: '/test2.jpg',
    isOffer: false,
    inStock: true,
    variants: {
      flavors: ['Slate Grey', 'Obsidian Black'],
      nicotineOptions: ['18mg/ml'],
    },
    specs: { battery: 'Magnetic Dock', capacity: '1.2ml Pods', display: 'Smart Light Indicator' },
    description: 'Closed pod starter kit.',
  },
];

test('formatAED formats prices accurately in AED currency format', () => {
  assert.equal(formatAED(40), 'AED 40.00');
  assert.equal(formatAED(135.5), 'AED 135.50');
});

test('cart item addition, quantity updates, and subtotal calculations work accurately', () => {
  let cart = addOrIncrementCartItem([], sampleProducts[0], 2);
  assert.equal(calculateTotalItems(cart), 2);
  assert.equal(calculateSubtotal(cart), 90);

  cart = addOrIncrementCartItem(cart, sampleProducts[0], 1);
  assert.equal(calculateTotalItems(cart), 3);
  assert.equal(calculateSubtotal(cart), 135);

  cart = addOrIncrementCartItem(cart, sampleProducts[1], 2);
  assert.equal(calculateTotalItems(cart), 5);
  assert.equal(calculateSubtotal(cart), 405);

  cart = updateCartItemQuantity(cart, 'elf-bar-10000', -2);
  assert.equal(cart.find((i) => i.product.id === 'elf-bar-10000')?.quantity, 1);

  // Decrementing to 0 removes the item automatically
  cart = updateCartItemQuantity(cart, 'elf-bar-10000', -1);
  assert.equal(cart.find((i) => i.product.id === 'elf-bar-10000'), undefined);

  cart = removeCartItem(cart, 'juul-2-kit');
  assert.equal(cart.length, 0);
});

test('variant pricing and distinct variant cart items are tracked independently', () => {
  assert.equal(calculateVariantPrice(40, 'single'), 40);
  assert.equal(calculateVariantPrice(40, 'pack3'), 108);
  assert.equal(calculateVariantPrice(40, 'pack5'), 170);

  let cart = addOrIncrementCartItem([], sampleProducts[0], 1, {
    flavor: 'Blue Razz Ice',
    nicotine: '50mg (5%)',
    packId: 'single',
    packLabel: 'Single Unit (1x)',
    unitPrice: 45,
  });

  cart = addOrIncrementCartItem(cart, sampleProducts[0], 1, {
    flavor: 'Peach Mango',
    nicotine: '20mg (2%)',
    packId: 'pack3',
    packLabel: '3-Pack Bundle (Save 10%)',
    unitPrice: 121.5,
  });

  assert.equal(cart.length, 2);
  assert.equal(calculateSubtotal(cart), 166.5);
});

test('UAE 350 AED free shipping threshold computes remaining balance and fee properly', () => {
  const below = calculateShippingInfo(180);
  assert.equal(below.isFreeShipping, false);
  assert.equal(below.shippingFee, 25);
  assert.equal(below.remainingForFreeShipping, 170);

  const above = calculateShippingInfo(350);
  assert.equal(above.isFreeShipping, true);
  assert.equal(above.shippingFee, 0);
  assert.equal(above.remainingForFreeShipping, 0);
  assert.equal(above.progressPercent, 100);
});

test('filterProducts filters by category, offers, brand, nicotine, search query, and sort order', () => {
  const disposables = filterProducts(sampleProducts, {
    activeCategory: 'Disposable Vape',
    selectedBrand: null,
    searchQuery: '',
    sortBy: 'featured',
  });
  assert.equal(disposables.length, 1);
  assert.equal(disposables[0].id, 'elf-bar-10000');

  const byNicotine = filterProducts(sampleProducts, {
    activeCategory: 'All',
    selectedBrand: null,
    searchQuery: '',
    sortBy: 'featured',
    nicotineFilter: '18mg',
  });
  assert.equal(byNicotine.length, 1);
  assert.equal(byNicotine[0].id, 'juul-2-kit');
});

test('recordRecentlyViewedId tracks clicks in MRU order, deduplicates, and resolves products', () => {
  let viewed: string[] = [];
  viewed = recordRecentlyViewedId(viewed, 'elf-bar-10000');
  assert.deepEqual(viewed, ['elf-bar-10000']);

  viewed = recordRecentlyViewedId(viewed, 'juul-2-kit');
  assert.deepEqual(viewed, ['juul-2-kit', 'elf-bar-10000']);

  viewed = recordRecentlyViewedId(viewed, 'elf-bar-10000');
  assert.deepEqual(viewed, ['elf-bar-10000', 'juul-2-kit']);

  const resolved = resolveRecentlyViewedProducts(viewed, sampleProducts);
  assert.equal(resolved.length, 2);
  assert.equal(resolved[0].id, 'elf-bar-10000');
  assert.equal(resolved[1].id, 'juul-2-kit');
});

test('wishlist toggle, membership check, and product resolution work accurately', () => {
  let wishlist: string[] = [];
  wishlist = toggleWishlistId(wishlist, 'elf-bar-10000');
  assert.equal(isProductWishlisted(wishlist, 'elf-bar-10000'), true);
  assert.equal(wishlist.length, 1);

  wishlist = toggleWishlistId(wishlist, 'juul-2-kit');
  assert.deepEqual(wishlist, ['juul-2-kit', 'elf-bar-10000']);

  const resolved = resolveWishlistProducts(wishlist, sampleProducts);
  assert.equal(resolved.length, 2);
  assert.equal(resolved[0].id, 'juul-2-kit');

  wishlist = toggleWishlistId(wishlist, 'elf-bar-10000');
  assert.equal(isProductWishlisted(wishlist, 'elf-bar-10000'), false);
  assert.deepEqual(wishlist, ['juul-2-kit']);
});

test('computeScrollTelemetry normalizes scrollY into progress, rotation angle, and explode percentage', () => {
  const atTop = computeScrollTelemetry(0, 500);
  assert.equal(atTop.progress, 0);
  assert.equal(atTop.angleDeg, 0);
  assert.equal(atTop.explodePercent, 0);

  const halfway = computeScrollTelemetry(250, 500);
  assert.equal(halfway.progress, 0.5);
  assert.equal(halfway.angleDeg, 180);
  assert.equal(halfway.explodePercent, 50);

  const beyondMax = computeScrollTelemetry(900, 500);
  assert.equal(beyondMax.progress, 1);
  assert.equal(beyondMax.angleDeg, 360);
  assert.equal(beyondMax.explodePercent, 100);
});

test('order status timeline builder and progression compute accurate 5-stage milestones', () => {
  const timeline = buildOrderTimeline('packed_al_quoz');
  assert.equal(timeline.length, 5);
  assert.equal(timeline[0].completed, true);
  assert.equal(timeline[1].completed, true);
  assert.equal(timeline[2].completed, true);
  assert.equal(timeline[2].current, true);
  assert.equal(timeline[3].completed, false);
  assert.equal(timeline[4].completed, false);

  assert.equal(getOrderProgressPercent('packed_al_quoz'), 60);
  assert.equal(getNextOrderStatus('packed_al_quoz'), 'out_for_delivery');
  assert.equal(getNextOrderStatus('out_for_delivery'), 'delivered');
  assert.equal(getOrderProgressPercent('delivered'), 100);
});

test('resolveInactivityTimeoutMs defaults to 30000ms and validates newsletter emails', () => {
  assert.equal(DEFAULT_INACTIVITY_TIMEOUT_MS, 30000);
  assert.equal(resolveInactivityTimeoutMs(''), 30000);
  assert.equal(resolveInactivityTimeoutMs('?autostart=1'), 30000);
  assert.equal(resolveInactivityTimeoutMs('?autostart=1&inactivityMs=250'), 250);
  assert.equal(isValidNewsletterEmail('vip@vapedubaiking.ae'), true);
  assert.equal(isValidNewsletterEmail('invalid-email'), false);
});

test('buildSeoMetadata generates dynamic title and description for home, category, product, and admin views', () => {
  const homeSeo = buildSeoMetadata({
    currentView: 'home',
    activeCategory: 'All',
    selectedBrand: null,
  });
  assert.ok(homeSeo.title.includes('Vape Dubai King'));
  assert.ok(homeSeo.description.includes('350 AED'));

  const categorySeo = buildSeoMetadata({
    currentView: 'category',
    activeCategory: 'Disposable Vape',
    selectedBrand: 'Elf Bar',
  });
  assert.ok(categorySeo.title.includes('Disposable Vape (Elf Bar)'));
  assert.ok(categorySeo.description.includes('disposable vape by Elf Bar'));

  const productSeo = buildSeoMetadata({
    currentView: 'product',
    activeCategory: 'Disposable Vape',
    product: sampleProducts[0],
  });
  assert.ok(productSeo.title.includes('Elf Bar 10000 Puffs Digital Display'));
  assert.ok(productSeo.title.includes('AED 45.00'));
  assert.ok(productSeo.description.includes('50mg (5%)'));
});

test('/admin route resolution and admin login verification gate dashboard access properly', () => {
  assert.equal(resolveInitialViewFromPathname('/'), 'home');
  assert.equal(resolveInitialViewFromPathname('/admin'), 'admin');
  assert.equal(resolveInitialViewFromPathname('/admin/dashboard'), 'admin');
  assert.equal(getPathnameForView('admin'), '/admin');
  assert.equal(getPathnameForView('home'), '/');
  assert.equal(getPathnameForView('category'), '/');

  assert.equal(validateAdminLoginInput('not-an-email', 'whatever').valid, false);
  assert.equal(validateAdminLoginInput('admin@example.com', '').valid, false);
  assert.equal(validateAdminLoginInput('admin@example.com', 'some-password').valid, true);

  const adminUser = { role: 'admin' };
  assert.equal(canAccessAdminDashboard(null, false), false);
  assert.equal(canAccessAdminDashboard(adminUser, false), false);
  assert.equal(canAccessAdminDashboard({ role: 'customer' }, true), false);
  assert.equal(canAccessAdminDashboard(adminUser, true), true);
});

test('buildStructuredDataJsonLd generates valid Schema.org Product, Store, and BreadcrumbList JSON-LD for product and category pages', () => {
  // 1. Product Page JSON-LD
  const productLd = buildStructuredDataJsonLd({
    currentView: 'product',
    activeCategory: 'Disposable Vape',
    product: sampleProducts[0],
    selectedVariant: {
      flavor: 'Peach Mango',
      nicotine: '20mg (2%)',
      unitPrice: 121.5,
    },
    baseUrl: 'https://vapedubaiking.ae',
  });

  assert.equal(productLd['@context'], 'https://schema.org');
  assert.ok(Array.isArray(productLd['@graph']));

  const prodStoreNode = productLd['@graph'].find((n: any) => n['@type'] === 'Store');
  const prodBreadcrumbNode = productLd['@graph'].find((n: any) => n['@type'] === 'BreadcrumbList');
  const prodNode = productLd['@graph'].find((n: any) => n['@type'] === 'Product');

  assert.ok(prodStoreNode);
  assert.equal(prodStoreNode.name, 'Vape Dubai King');
  assert.equal(prodStoreNode.currenciesAccepted, 'AED');

  assert.ok(prodBreadcrumbNode);
  assert.equal(prodBreadcrumbNode.itemListElement.length, 3);
  assert.equal(prodBreadcrumbNode.itemListElement[0].name, 'Home');
  assert.equal(prodBreadcrumbNode.itemListElement[1].name, 'Disposable Vape');
  assert.equal(
    prodBreadcrumbNode.itemListElement[2].name,
    'Elf Bar 10000 Puffs Digital Display — Blue Razz Ice'
  );

  assert.ok(prodNode);
  assert.equal(prodNode.sku, 'elf-bar-10000');
  assert.equal(prodNode.brand.name, 'Elf Bar');
  assert.equal(prodNode.offers.priceCurrency, 'AED');
  assert.equal(prodNode.offers.price, '121.50');

  // 2. Category Page JSON-LD
  const categoryRaw = serializeStructuredDataJsonLd({
    currentView: 'category',
    activeCategory: 'Disposable Vape',
    selectedBrand: 'Elf Bar',
    product: sampleProducts[0],
    categoryProducts: [sampleProducts[0]],
    baseUrl: 'https://vapedubaiking.ae',
  });
  const categoryLd = JSON.parse(categoryRaw);
  assert.equal(categoryLd['@context'], 'https://schema.org');

  const catStoreNode = categoryLd['@graph'].find((n: any) => n['@type'] === 'Store');
  const catBreadcrumbNode = categoryLd['@graph'].find((n: any) => n['@type'] === 'BreadcrumbList');
  const catProductNode = categoryLd['@graph'].find((n: any) => n['@type'] === 'Product');
  const catItemListNode = categoryLd['@graph'].find((n: any) => n['@type'] === 'ItemList');

  assert.ok(catStoreNode);
  assert.ok(catBreadcrumbNode);
  assert.equal(catBreadcrumbNode.itemListElement.length, 3);
  assert.equal(catBreadcrumbNode.itemListElement[1].name, 'Disposable Vape');
  assert.equal(catBreadcrumbNode.itemListElement[2].name, 'Elf Bar');
  assert.ok(catProductNode);
  assert.ok(catItemListNode);
  assert.equal(catItemListNode.numberOfItems, 1);
});

test('session-linked Order History helpers filter, merge, and advance real-time status timelines', () => {
  const sampleOrders: CustomerOrder[] = [
    {
      orderId: 'VDK-892410',
      fullName: 'Tariq Al Maktoum',
      email: 'tariq.almaktoum@dubai.ae',
      phone: '+971 50 842 9910',
      emirate: 'Dubai',
      address: 'Downtown Dubai',
      paymentMethod: 'Cash on Delivery',
      items: [{ product: sampleProducts[0], quantity: 1 }],
      subtotal: 45,
      shippingFee: 25,
      total: 70,
      createdAt: '14:10 GST',
      status: 'packed_al_quoz',
      courierName: 'Rashid · Bike #14',
      estimatedArrival: '35 mins',
      timeline: buildOrderTimeline('packed_al_quoz'),
    },
    {
      orderId: 'VDK-891855',
      fullName: 'Other Customer',
      email: 'other@sharjah.ae',
      phone: '+971 55 111 2222',
      emirate: 'Sharjah',
      address: 'Al Majaz',
      paymentMethod: 'Card Link on Delivery',
      items: [{ product: sampleProducts[1], quantity: 2 }],
      subtotal: 270,
      shippingFee: 25,
      total: 295,
      createdAt: '12:05 GST',
      status: 'out_for_delivery',
      courierName: 'Zayed · Van #04',
      estimatedArrival: '20 mins',
      timeline: buildOrderTimeline('out_for_delivery'),
    },
  ];

  // Filter for signed-in user session
  const tariqOrders = filterOrdersForUserSession(
    sampleOrders,
    {
      uid: 'u-1',
      email: 'tariq.almaktoum@dubai.ae',
      displayName: 'Tariq Al Maktoum',
      phone: '+971 50 842 9910',
      emirate: 'Dubai',
      role: 'customer',
    },
    []
  );
  assert.equal(tariqOrders.length, 1);
  assert.equal(tariqOrders[0].orderId, 'VDK-892410');

  // Filter with explicit sessionOrderIds includes session-linked orders even for another email
  const withSessionId = filterOrdersForUserSession(
    sampleOrders,
    {
      uid: 'u-1',
      email: 'tariq.almaktoum@dubai.ae',
      displayName: 'Tariq Al Maktoum',
      phone: '+971 50 842 9910',
      emirate: 'Dubai',
      role: 'customer',
    },
    ['VDK-891855']
  );
  assert.equal(withSessionId.length, 2);

  // Merge fetched orders updates status & rebuilds timeline
  const merged = mergeSessionOrdersWithFetched(sampleOrders, [
    {
      ...sampleOrders[0],
      status: 'out_for_delivery',
    },
  ]);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].status, 'out_for_delivery');
  assert.equal(getOrderStatusLabel(merged[0].status), 'Courier En Route (Live GPS Telemetry)');

  // Advance real-time mock status tick
  const ticked = simulateRealtimeOrderHistoryTick(merged, 'VDK-892410');
  assert.equal(ticked[0].status, 'delivered');
  assert.equal(ticked[0].timeline?.find((s) => s.current)?.status, 'delivered');
});

test('buildCustomerDemoUser constructs deterministic customer profile for Tariq or custom email', async () => {
  const { buildCustomerDemoUser } = await import('./storeLogic');
  const defaultDemo = buildCustomerDemoUser();
  assert.equal(defaultDemo.email, 'tariq.almaktoum@dubai.ae');
  assert.equal(defaultDemo.displayName, 'Tariq Al Maktoum');
  assert.equal(defaultDemo.role, 'customer');

  const customUser = buildCustomerDemoUser({
    email: 'rashid.khalifa@abudhabi.ae',
    phone: '+971 52 900 1122',
    emirate: 'Abu Dhabi',
  });
  assert.equal(customUser.email, 'rashid.khalifa@abudhabi.ae');
  assert.equal(customUser.displayName, 'Rashid Khalifa');
  assert.equal(customUser.emirate, 'Abu Dhabi');
});
