import {
  AuthenticatedUser,
  CartItem,
  CustomerOrder,
  OrderStatusStage,
  OrderTimelineStep,
  PackTierId,
  Product,
  ProductCategory,
  SelectedVariant,
} from '../types/store';
import { PACK_OPTIONS } from '../data/products';

export const FREE_SHIPPING_THRESHOLD_AED = 350;
export const STANDARD_UAE_SHIPPING_AED = 25;

export function formatAED(amount: number): string {
  return `AED ${amount.toFixed(2)}`;
}

export function getCartItemUnitPrice(item: CartItem): number {
  return item.selectedVariant ? item.selectedVariant.unitPrice : item.product.price;
}

export function getCartItemKey(product: Product, variant?: SelectedVariant): string {
  if (!variant) return product.id;
  return `${product.id}__${variant.flavor}__${variant.nicotine}__${variant.packId}`;
}

export function calculateVariantPrice(basePrice: number, packId: PackTierId): number {
  const pack = PACK_OPTIONS.find((p) => p.id === packId) || PACK_OPTIONS[0];
  const rawTotal = basePrice * pack.units;
  const discounted = rawTotal * (1 - pack.discountPercent / 100);
  return Math.round(discounted * 100) / 100;
}

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + getCartItemUnitPrice(item) * item.quantity, 0);
}

export function calculateTotalItems(items: CartItem[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}

export function calculateShippingInfo(subtotal: number): {
  isFreeShipping: boolean;
  shippingFee: number;
  remainingForFreeShipping: number;
  progressPercent: number;
} {
  if (subtotal <= 0) {
    return {
      isFreeShipping: false,
      shippingFee: 0,
      remainingForFreeShipping: FREE_SHIPPING_THRESHOLD_AED,
      progressPercent: 0,
    };
  }
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD_AED;
  const shippingFee = isFreeShipping ? 0 : STANDARD_UAE_SHIPPING_AED;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD_AED - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD_AED) * 100));

  return {
    isFreeShipping,
    shippingFee,
    remainingForFreeShipping,
    progressPercent,
  };
}

export function addOrIncrementCartItem(
  items: CartItem[],
  product: Product,
  quantityToAdd = 1,
  selectedVariant?: SelectedVariant
): CartItem[] {
  const targetKey = getCartItemKey(product, selectedVariant);
  const existingIndex = items.findIndex(
    (i) => (i.cartItemId || getCartItemKey(i.product, i.selectedVariant)) === targetKey
  );
  if (existingIndex > -1) {
    return items.map((item, idx) =>
      idx === existingIndex ? { ...item, quantity: item.quantity + quantityToAdd } : item
    );
  }
  return [
    ...items,
    {
      cartItemId: targetKey,
      product,
      quantity: quantityToAdd,
      selectedVariant,
    },
  ];
}

export function updateCartItemQuantity(items: CartItem[], itemKeyOrProductId: string, delta: number): CartItem[] {
  return items
    .map((item) => {
      const itemKey = item.cartItemId || item.product.id;
      if (itemKey !== itemKeyOrProductId && item.product.id !== itemKeyOrProductId) return item;
      const nextQty = item.quantity + delta;
      return nextQty > 0 ? { ...item, quantity: nextQty } : null;
    })
    .filter((item): item is CartItem => item !== null);
}

export function removeCartItem(items: CartItem[], itemKeyOrProductId: string): CartItem[] {
  return items.filter((item) => {
    const itemKey = item.cartItemId || item.product.id;
    return itemKey !== itemKeyOrProductId && item.product.id !== itemKeyOrProductId;
  });
}

export function filterProducts(
  products: Product[],
  options: {
    activeCategory: 'All' | ProductCategory;
    selectedBrand: string | null;
    searchQuery: string;
    sortBy: 'featured' | 'price-asc' | 'price-desc';
    nicotineFilter?: string | null;
    onlyOffers?: boolean;
  }
): Product[] {
  const {
    activeCategory,
    selectedBrand,
    searchQuery,
    sortBy,
    nicotineFilter = null,
    onlyOffers = false,
  } = options;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (activeCategory === 'Offers' || onlyOffers) {
      if (!product.isOffer) return false;
    } else if (activeCategory !== 'All' && activeCategory !== 'Brands') {
      if (product.category !== activeCategory) return false;
    }

    if (selectedBrand && product.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
      return false;
    }

    if (nicotineFilter) {
      const matchesNicotine =
        product.nicotineStrength.toLowerCase().includes(nicotineFilter.toLowerCase()) ||
        product.variants.nicotineOptions.some((n) =>
          n.toLowerCase().includes(nicotineFilter.toLowerCase())
        );
      if (!matchesNicotine) return false;
    }

    if (normalizedQuery) {
      const hay = `${product.title} ${product.brand} ${product.category} ${product.flavorProfile} ${product.puffCount || ''}`.toLowerCase();
      if (!hay.includes(normalizedQuery)) return false;
    }

    return true;
  });

  if (sortBy === 'price-asc') {
    return [...filtered].sort((a, b) => a.price - b.price);
  }
  if (sortBy === 'price-desc') {
    return [...filtered].sort((a, b) => b.price - a.price);
  }
  return filtered;
}

export const RECENTLY_VIEWED_SESSION_KEY = 'vdk_recently_viewed_v1';
export const MAX_RECENTLY_VIEWED = 8;

export function recordRecentlyViewedId(
  currentIds: string[],
  productId: string,
  maxItems = MAX_RECENTLY_VIEWED
): string[] {
  if (!productId) return currentIds;
  const deduplicated = currentIds.filter((id) => id !== productId);
  return [productId, ...deduplicated].slice(0, maxItems);
}

export function resolveRecentlyViewedProducts(
  viewedIds: string[],
  catalog: Product[]
): Product[] {
  const byId = new Map(catalog.map((p) => [p.id, p]));
  return viewedIds
    .map((id) => byId.get(id))
    .filter((item): item is Product => item !== undefined);
}

export const WISHLIST_STORAGE_KEY = 'vdk_wishlist_v1';

export function toggleWishlistId(currentIds: string[], productId: string): string[] {
  if (!productId) return currentIds;
  if (currentIds.includes(productId)) {
    return currentIds.filter((id) => id !== productId);
  }
  return [productId, ...currentIds];
}

export function isProductWishlisted(wishlistIds: string[], productId: string): boolean {
  return wishlistIds.includes(productId);
}

export function resolveWishlistProducts(wishlistIds: string[], catalog: Product[]): Product[] {
  const byId = new Map(catalog.map((p) => [p.id, p]));
  return wishlistIds
    .map((id) => byId.get(id))
    .filter((item): item is Product => item !== undefined);
}

export function computeScrollTelemetry(
  scrollY: number,
  maxScrollRange = 720
): {
  progress: number;
  angleDeg: number;
  explodePercent: number;
} {
  const safeRange = Math.max(1, maxScrollRange);
  const clamped = Math.max(0, Math.min(1, scrollY / safeRange));
  const progress = Math.round(clamped * 1000) / 1000;
  const angleDeg = Math.round(progress * 360);
  const explodePercent = Math.round(progress * 100);
  return { progress, angleDeg, explodePercent };
}

export const ORDER_STATUS_SEQUENCE: OrderStatusStage[] = [
  'order_placed',
  'age_verified',
  'packed_al_quoz',
  'out_for_delivery',
  'delivered',
];

const ORDER_STAGE_METADATA: Record<
  OrderStatusStage,
  { label: string; location: string; description: string }
> = {
  order_placed: {
    label: 'Order Confirmed & Logged',
    location: 'Vape Dubai King Online Dispatch Desk',
    description: 'Order received and assigned to same-day UAE fulfillment queue.',
  },
  age_verified: {
    label: '21+ Adult ID & ESMA Excise Verified',
    location: 'Dubai Compliance & Tax Stamp Unit',
    description: 'All hardware QR codes and UAE Federal Tax Authority stamps verified.',
  },
  packed_al_quoz: {
    label: 'Thermal-Sealed & Dispatched',
    location: 'Al Quoz Industrial Area 3 Hub, Dubai',
    description: 'Insulated climate-protected pouch handed over to express bike courier.',
  },
  out_for_delivery: {
    label: 'Courier En Route (Live GPS Telemetry)',
    location: 'Sheikh Zayed Rd → Customer Emirate',
    description: 'Rider is approaching your building with Cash & Card Link terminal.',
  },
  delivered: {
    label: 'Delivered & Settled at Doorstep',
    location: 'Customer Destination',
    description: 'Handover complete with 21+ verification and doorstep payment.',
  },
};

export function buildOrderTimeline(activeStatus: OrderStatusStage): OrderTimelineStep[] {
  const activeIdx = ORDER_STATUS_SEQUENCE.indexOf(activeStatus);
  const safeIdx = activeIdx === -1 ? 0 : activeIdx;
  const times = ['14:10 GST', '14:18 GST', '14:35 GST', '14:52 GST', '15:20 GST'];

  return ORDER_STATUS_SEQUENCE.map((stage, idx) => {
    const meta = ORDER_STAGE_METADATA[stage];
    return {
      status: stage,
      label: meta.label,
      location: meta.location,
      description: meta.description,
      timestamp: idx <= safeIdx ? times[idx] : `Est. ${times[idx]}`,
      completed: idx <= safeIdx,
      current: idx === safeIdx,
    };
  });
}

export function getNextOrderStatus(current: OrderStatusStage): OrderStatusStage {
  const idx = ORDER_STATUS_SEQUENCE.indexOf(current);
  if (idx === -1 || idx >= ORDER_STATUS_SEQUENCE.length - 1) {
    return 'order_placed';
  }
  return ORDER_STATUS_SEQUENCE[idx + 1];
}

export function getOrderProgressPercent(status: OrderStatusStage): number {
  const idx = ORDER_STATUS_SEQUENCE.indexOf(status);
  if (idx === -1) return 20;
  return Math.round(((idx + 1) / ORDER_STATUS_SEQUENCE.length) * 100);
}

export const DEFAULT_INACTIVITY_TIMEOUT_MS = 30000;
export const NEWSLETTER_DISCOUNT_CODE = 'DUBAIKING15';
export const NEWSLETTER_DISMISSED_SESSION_KEY = 'vape-dubai-king-newsletter-dismissed';

/**
 * Resolves the inactivity timeout in milliseconds.
 * Defaults strictly to 30,000ms (30 seconds) and supports an optional ?inactivityMs= query override for testing.
 */
export function resolveInactivityTimeoutMs(
  searchString: string,
  defaultMs: number = DEFAULT_INACTIVITY_TIMEOUT_MS
): number {
  if (!searchString) return defaultMs;
  try {
    const params = new URLSearchParams(
      searchString.startsWith('?') ? searchString : `?${searchString}`
    );
    const raw = params.get('inactivityMs');
    if (!raw) return defaultMs;
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 100 && parsed <= 300000) {
      return Math.round(parsed);
    }
  } catch {
    // ignore malformed query strings
  }
  return defaultMs;
}

export function isValidNewsletterEmail(email: string): boolean {
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export interface SeoMetadataInput {
  currentView: 'home' | 'category' | 'product' | 'admin';
  activeCategory: 'All' | ProductCategory;
  selectedBrand?: string | null;
  product?: Product | null;
}

export interface SeoMetadataResult {
  title: string;
  description: string;
}

export function buildSeoMetadata(input: SeoMetadataInput): SeoMetadataResult {
  const { currentView, activeCategory, selectedBrand, product } = input;

  if (currentView === 'product' && product) {
    return {
      title: `${product.title} — ${formatAED(product.price)} | Vape Dubai King UAE`,
      description: `Buy ${product.title} (${product.brand} · ${product.puffCount || 'Authentic Hardware'} · ${product.nicotineStrength}) for ${formatAED(product.price)}. Same-day Dubai dispatch & UAE Cash on Delivery.`,
    };
  }

  if (currentView === 'category') {
    const categoryLabel = activeCategory === 'All' ? 'All Vape Categories' : activeCategory;
    const brandSuffix = selectedBrand ? ` (${selectedBrand})` : '';
    return {
      title: `${categoryLabel}${brandSuffix} — Buy Online | Vape Dubai King UAE`,
      description: `Shop 100% ESMA-compliant ${categoryLabel.toLowerCase()}${selectedBrand ? ` by ${selectedBrand}` : ''} at Vape Dubai King. Free UAE shipping above AED 350 and Cash on Delivery across all 7 Emirates.`,
    };
  }

  if (currentView === 'admin') {
    return {
      title: 'Storefront Operations & Schema Admin (/admin) | Vape Dubai King UAE',
      description:
        'Manage Vape Dubai King product inventory, real-time UAE courier order tracking, Resend transactional emails, and Supabase database schema.',
    };
  }

  // Home view (with optional active filter reflected in title/description)
  if (activeCategory !== 'All' || selectedBrand) {
    const catPart = activeCategory === 'All' ? 'Featured Collection' : activeCategory;
    const brandPart = selectedBrand ? ` — ${selectedBrand}` : '';
    return {
      title: `${catPart}${brandPart} | Vape Dubai King — Premier UAE Online Vape Store`,
      description: `Explore ${catPart.toLowerCase()}${selectedBrand ? ` from ${selectedBrand}` : ''} with digital telemetry displays, same-day Dubai delivery, and Cash on Delivery across the UAE.`,
    };
  }

  return {
    title: 'Vape Dubai King — Premier UAE Online Vape Store | Disposable Vapes, Pods & E-Liquids',
    description:
      'Shop authentic disposable vapes, pod systems, e-liquids, and vape kits at Vape Dubai King. Free UAE shipping on orders above 350 AED and Cash on Delivery across all Emirates.',
  };
}


export function resolveInitialViewFromPathname(pathname: string): 'home' | 'admin' {
  const normalized = (pathname || '/').trim().toLowerCase();
  if (normalized === '/admin' || normalized.startsWith('/admin/')) {
    return 'admin';
  }
  return 'home';
}

export function getPathnameForView(view: 'home' | 'category' | 'product' | 'admin'): string {
  return view === 'admin' ? '/admin' : '/';
}

/**
 * Client-side input sanity check only. Credentials are verified exclusively by
 * Supabase Auth plus the database role check; nothing secret lives in the browser bundle.
 */
export function validateAdminLoginInput(
  email: string,
  password: string
): { valid: boolean; error?: string } {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !isValidNewsletterEmail(normalizedEmail)) {
    return { valid: false, error: 'Please enter a valid admin email address.' };
  }
  if (!password) {
    return { valid: false, error: 'Please enter your admin password.' };
  }
  return { valid: true };
}

export function canAccessAdminDashboard(
  user: { role?: string } | null | undefined,
  isAdminAuthenticated: boolean
): boolean {
  return Boolean(isAdminAuthenticated && user && user.role === 'admin');
}

export interface StructuredDataInput {
  currentView: 'home' | 'category' | 'product' | 'admin';
  activeCategory: 'All' | ProductCategory;
  selectedBrand?: string | null;
  product?: Product | null;
  categoryProducts?: Product[];
  selectedVariant?: {
    flavor: string;
    nicotine: string;
    packLabel?: string;
    unitPrice: number;
  } | null;
  baseUrl?: string;
}

export function buildProductJsonLdNode(
  product: Product,
  origin: string,
  selectedVariant?: {
    flavor: string;
    nicotine: string;
    packLabel?: string;
    unitPrice: number;
  } | null
): Record<string, any> {
  const effectivePrice = selectedVariant?.unitPrice ?? product.price;
  const effectiveFlavor = selectedVariant?.flavor || product.flavorProfile;
  const effectiveNicotine = selectedVariant?.nicotine || product.nicotineStrength;
  const rawImages =
    product.gallery && product.gallery.length > 0 ? product.gallery : [product.image];
  const resolvedImages = rawImages.map((img) =>
    img.startsWith('http') ? img : `${origin}${img.startsWith('/') ? '' : '/'}${img}`
  );
  const productUrl = `${origin}/?product=${encodeURIComponent(product.id)}`;

  return {
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: product.title,
    sku: product.id,
    mpn: product.id.toUpperCase(),
    description: product.description,
    category: product.category,
    image: resolvedImages,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Flavour Profile',
        value: effectiveFlavor,
      },
      {
        '@type': 'PropertyValue',
        name: 'Nicotine Strength',
        value: effectiveNicotine,
      },
      {
        '@type': 'PropertyValue',
        name: 'Output Specification',
        value: product.puffCount || product.specs.capacity,
      },
    ],
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'AED',
      price: effectivePrice.toFixed(2),
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Store',
        '@id': `${origin}/#store`,
        name: 'Vape Dubai King',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '128',
      bestRating: '5',
      worstRating: '1',
    },
  };
}

export function buildStructuredDataJsonLd(input: StructuredDataInput): Record<string, any> {
  const origin = (input.baseUrl || 'https://vapedubaiking.ae').replace(/\/+$/, '');
  const {
    currentView,
    activeCategory,
    selectedBrand = null,
    product = null,
    categoryProducts = [],
    selectedVariant = null,
  } = input;

  // 1. Schema.org Store node
  const storeNode: Record<string, any> = {
    '@type': 'Store',
    '@id': `${origin}/#store`,
    name: 'Vape Dubai King',
    description:
      "Dubai's Most Trusted Online Vape Shop offering 100% ESMA-compliant disposable vapes, closed pod systems, UK nicotine salts, and sub-ohm hardware with rapid same-day delivery across all 7 UAE Emirates.",
    url: `${origin}/`,
    telephone: '+971 50 842 9910',
    email: 'support@vapedubaiking.ae',
    currenciesAccepted: 'AED',
    paymentAccepted: 'Cash on Delivery, Card Link on Delivery',
    priceRange: 'AED 38.00 - AED 250.00',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Al Quoz Industrial Area 3',
      addressLocality: 'Dubai',
      addressRegion: 'Dubai',
      addressCountry: 'AE',
    },
    sameAs: [
      'https://instagram.com/vapedubaiking',
      'https://tiktok.com/@vapedubaiking',
      'https://wa.me/971508429910',
      'https://t.me/vapedubaiking',
      'https://x.com/vapedubaiking',
    ],
  };

  // 2. Schema.org BreadcrumbList node
  const breadcrumbItems: Array<Record<string, any>> = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: `${origin}/`,
    },
  ];

  if (currentView === 'product' && product) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: product.category,
      item: `${origin}/?category=${encodeURIComponent(product.category)}`,
    });
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: product.title,
      item: `${origin}/?product=${encodeURIComponent(product.id)}`,
    });
  } else if (currentView === 'category') {
    const categoryName = activeCategory === 'All' ? 'All Vape Categories' : activeCategory;
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: categoryName,
      item: `${origin}/?category=${encodeURIComponent(activeCategory)}`,
    });
    if (selectedBrand) {
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 3,
        name: selectedBrand,
        item: `${origin}/?category=${encodeURIComponent(activeCategory)}&brand=${encodeURIComponent(selectedBrand)}`,
      });
    }
  } else if (activeCategory !== 'All') {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: activeCategory,
      item: `${origin}/?category=${encodeURIComponent(activeCategory)}`,
    });
  }

  const breadcrumbNode: Record<string, any> = {
    '@type': 'BreadcrumbList',
    '@id': `${origin}/#breadcrumb`,
    itemListElement: breadcrumbItems,
  };

  const graph: Array<Record<string, any>> = [storeNode, breadcrumbNode];

  // 3. Schema.org Product & ItemList nodes
  if (currentView === 'product' && product) {
    graph.push(buildProductJsonLdNode(product, origin, selectedVariant));
  } else if (currentView === 'category') {
    const listToSerialize =
      categoryProducts.length > 0 ? categoryProducts : product ? [product] : [];
    const primaryProduct = listToSerialize[0] || product;
    if (primaryProduct) {
      graph.push(buildProductJsonLdNode(primaryProduct, origin, null));
    }
    if (listToSerialize.length > 0) {
      graph.push({
        '@type': 'ItemList',
        '@id': `${origin}/?category=${encodeURIComponent(activeCategory)}#catalog`,
        name:
          activeCategory === 'All'
            ? 'Vape Dubai King UAE Full Catalog'
            : `${activeCategory}${selectedBrand ? ` — ${selectedBrand}` : ''} Collection`,
        numberOfItems: listToSerialize.length,
        itemListElement: listToSerialize.map((itemProd, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          item: buildProductJsonLdNode(itemProd, origin, null),
        })),
      });
    }
  } else if (product) {
    graph.push(buildProductJsonLdNode(product, origin, null));
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

export function serializeStructuredDataJsonLd(input: StructuredDataInput): string {
  return JSON.stringify(buildStructuredDataJsonLd(input));
}

export const USER_ORDER_SESSION_KEY = 'vdk-session-order-history-v1';
export const USER_SESSION_ID_KEY = 'vdk-user-session-id-v1';

export function getOrderStatusLabel(status: OrderStatusStage): string {
  const step = buildOrderTimeline(status).find((s) => s.status === status);
  return step ? step.label : 'Order Placed';
}

/**
 * Filters and links orders to the active user session (authenticated user or browser session IDs).
 */
export function filterOrdersForUserSession(
  orders: CustomerOrder[],
  currentUser: AuthenticatedUser | null,
  sessionOrderIds: string[] = []
): CustomerOrder[] {
  if (!Array.isArray(orders) || orders.length === 0) return [];

  const sessionSet = new Set(sessionOrderIds);

  if (currentUser) {
    const normalizedEmail = (currentUser.email || '').trim().toLowerCase();
    const normalizedPhone = (currentUser.phone || '').replace(/\s+/g, '');
    const matched = orders.filter((order) => {
      const orderEmail = (order.email || '').trim().toLowerCase();
      const orderPhone = (order.phone || '').replace(/\s+/g, '');
      return (
        (normalizedEmail && orderEmail === normalizedEmail) ||
        (normalizedPhone && orderPhone === normalizedPhone) ||
        sessionSet.has(order.orderId)
      );
    });
    return matched.length > 0 ? matched : orders;
  }

  if (sessionSet.size > 0) {
    const matchedSession = orders.filter((o) => sessionSet.has(o.orderId));
    return matchedSession.length > 0 ? matchedSession : orders;
  }

  return orders;
}

/**
 * Merges orders fetched from the backend session endpoint with local session orders,
 * ensuring each order has a complete 5-stage mock timeline and deduplicating by orderId.
 */
export function mergeSessionOrdersWithFetched(
  localOrders: CustomerOrder[],
  fetchedOrders: CustomerOrder[]
): CustomerOrder[] {
  const mergedMap = new Map<string, CustomerOrder>();

  for (const ord of localOrders) {
    mergedMap.set(ord.orderId, {
      ...ord,
      timeline:
        ord.timeline && ord.timeline.length > 0
          ? ord.timeline
          : buildOrderTimeline(ord.status),
    });
  }

  for (const fetched of fetchedOrders) {
    if (!fetched || !fetched.orderId) continue;
    const existing = mergedMap.get(fetched.orderId);
    if (existing) {
      mergedMap.set(fetched.orderId, {
        ...existing,
        ...fetched,
        items: fetched.items && fetched.items.length > 0 ? fetched.items : existing.items,
        timeline: buildOrderTimeline(fetched.status || existing.status),
      });
    } else {
      mergedMap.set(fetched.orderId, {
        ...fetched,
        timeline:
          fetched.timeline && fetched.timeline.length > 0
            ? fetched.timeline
            : buildOrderTimeline(fetched.status || 'order_placed'),
      });
    }
  }

  return Array.from(mergedMap.values());
}

/**
 * Advances the real-time mock status timeline for a specific order (or the first active order) in the user's session.
 */
export function simulateRealtimeOrderHistoryTick(
  orders: CustomerOrder[],
  targetOrderId?: string
): CustomerOrder[] {
  if (!Array.isArray(orders) || orders.length === 0) return [];

  const idToAdvance =
    targetOrderId ||
    orders.find((o) => o.status !== 'delivered')?.orderId ||
    orders[0].orderId;

  return orders.map((ord) => {
    if (ord.orderId !== idToAdvance) return ord;
    const nextStatus = getNextOrderStatus(ord.status);
    return {
      ...ord,
      status: nextStatus,
      timeline: buildOrderTimeline(nextStatus),
    };
  });
}
