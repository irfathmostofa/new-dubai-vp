import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import {
  AuthenticatedUser,
  CartItem,
  CustomerOrder,
  EmailLogRecord,
  OrderStatusStage,
  Product,
  ProductCategory,
  SelectedVariant,
} from '../types/store';
import { MOCK_PRODUCTS } from '../data/products';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  deleteProduct as deleteProductRemote,
  fetchAllOrders,
  fetchCatalog,
  fetchEmailLogs,
  fetchMyOrders,
  fetchProfile,
  placeOrder as placeOrderRemote,
  sendEmail,
  trackOrders,
  updateOrderStatus as updateOrderStatusRemote,
  upsertProduct as upsertProductRemote,
} from '../services/backend';
import { reconcileCartWithCatalog } from '../utils/backendMappers';
import {
  addOrIncrementCartItem,
  removeCartItem,
  updateCartItemQuantity,
  RECENTLY_VIEWED_SESSION_KEY,
  recordRecentlyViewedId,
  WISHLIST_STORAGE_KEY,
  toggleWishlistId,
  buildOrderTimeline,
  resolveInitialViewFromPathname,
  getPathnameForView,
  validateAdminLoginInput,
  NEWSLETTER_DISCOUNT_CODE,
  USER_ORDER_SESSION_KEY,
  USER_SESSION_ID_KEY,
  mergeSessionOrdersWithFetched,
  simulateRealtimeOrderHistoryTick,
} from '../utils/storeLogic';

function syncBrowserUrlForView(view: 'home' | 'category' | 'product' | 'admin'): void {
  if (typeof window === 'undefined') return;
  try {
    const targetPath = getPathnameForView(view);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ view }, '', `${targetPath}${window.location.search || ''}`);
    }
  } catch {
    // ignore history API errors in restricted environments
  }
}

function loadInitialRecentlyViewed(): string[] {
  if (typeof window === 'undefined') {
    return [MOCK_PRODUCTS[0].id, MOCK_PRODUCTS[1].id, MOCK_PRODUCTS[2].id];
  }
  try {
    const raw = window.sessionStorage.getItem(RECENTLY_VIEWED_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((id): id is string => typeof id === 'string');
      }
    }
  } catch {
    // fallback if sessionStorage is restricted
  }
  const initialSeed = [MOCK_PRODUCTS[0].id, MOCK_PRODUCTS[1].id, MOCK_PRODUCTS[2].id];
  try {
    window.sessionStorage.setItem(RECENTLY_VIEWED_SESSION_KEY, JSON.stringify(initialSeed));
  } catch {
    // ignore storage errors
  }
  return initialSeed;
}

function saveRecentlyViewedToSession(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(RECENTLY_VIEWED_SESSION_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage quota errors
  }
}

function loadInitialWishlist(): string[] {
  if (typeof window === 'undefined') {
    return [MOCK_PRODUCTS[1].id];
  }
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((id): id is string => typeof id === 'string');
      }
    }
  } catch {
    // fallback if localStorage is restricted
  }
  const initialSeed = [MOCK_PRODUCTS[1].id];
  try {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(initialSeed));
  } catch {
    // ignore storage errors
  }
  return initialSeed;
}

function saveWishlistToStorage(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage quota errors
  }
}

const INITIAL_SAMPLE_ORDERS: CustomerOrder[] = [
  {
    orderId: 'VDK-892410',
    fullName: 'Tariq Al Maktoum',
    email: 'tariq.almaktoum@dubai.ae',
    phone: '+971 50 842 9910',
    emirate: 'Dubai',
    address: 'Boulevard Point Tower, Apt 3402, Downtown Dubai',
    paymentMethod: 'Cash on Delivery',
    items: [
      {
        product: MOCK_PRODUCTS[0],
        quantity: 2,
        selectedVariant: {
          flavor: MOCK_PRODUCTS[0].variants.flavors[0],
          nicotine: MOCK_PRODUCTS[0].variants.nicotineOptions[0],
          packId: 'single',
          packLabel: 'Single Unit (1x)',
          unitPrice: MOCK_PRODUCTS[0].price,
        },
      },
      {
        product: MOCK_PRODUCTS[1],
        quantity: 1,
        selectedVariant: {
          flavor: MOCK_PRODUCTS[1].variants.flavors[0],
          nicotine: MOCK_PRODUCTS[1].variants.nicotineOptions[0],
          packId: 'single',
          packLabel: 'Single Unit (1x)',
          unitPrice: MOCK_PRODUCTS[1].price,
        },
      },
    ],
    subtotal: 145,
    shippingFee: 25,
    total: 170,
    createdAt: 'Today · 14:10 GST',
    status: 'packed_al_quoz',
    courierName: 'Rashid Al-Mansoor · Dubai Express Bike #14',
    estimatedArrival: '35 mins (Sheikh Zayed Rd Route)',
    timeline: buildOrderTimeline('packed_al_quoz'),
  },
  {
    orderId: 'VDK-891855',
    fullName: 'Tariq Al Maktoum',
    email: 'tariq.almaktoum@dubai.ae',
    phone: '+971 50 842 9910',
    emirate: 'Dubai',
    address: 'Marina Gate Tower 1, Apt 1904, Dubai Marina',
    paymentMethod: 'Card Link on Delivery',
    items: [
      {
        product: MOCK_PRODUCTS[2],
        quantity: 1,
        selectedVariant: {
          flavor: MOCK_PRODUCTS[2].variants.flavors[0],
          nicotine: MOCK_PRODUCTS[2].variants.nicotineOptions[0],
          packId: 'single',
          packLabel: 'Single Unit (1x)',
          unitPrice: MOCK_PRODUCTS[2].price,
        },
      },
      {
        product: MOCK_PRODUCTS[5],
        quantity: 1,
        selectedVariant: {
          flavor: MOCK_PRODUCTS[5].variants.flavors[0],
          nicotine: MOCK_PRODUCTS[5].variants.nicotineOptions[0],
          packId: 'single',
          packLabel: 'Single Unit (1x)',
          unitPrice: MOCK_PRODUCTS[5].price,
        },
      },
    ],
    subtotal: 280,
    shippingFee: 25,
    total: 305,
    createdAt: 'Today · 11:45 GST',
    status: 'out_for_delivery',
    courierName: 'Zayed Al-Nuaimi · Marina Dispatch Van #07',
    estimatedArrival: '15 mins (Jumeirah Beach Rd)',
    timeline: buildOrderTimeline('out_for_delivery'),
  },
  {
    orderId: 'VDK-889302',
    fullName: 'Tariq Al Maktoum',
    email: 'tariq.almaktoum@dubai.ae',
    phone: '+971 50 842 9910',
    emirate: 'Dubai',
    address: 'Executive Towers East, Business Bay, Dubai',
    paymentMethod: 'Cash on Delivery',
    items: [
      {
        product: MOCK_PRODUCTS[6],
        quantity: 1,
        selectedVariant: {
          flavor: MOCK_PRODUCTS[6].variants.flavors[0],
          nicotine: MOCK_PRODUCTS[6].variants.nicotineOptions[0],
          packId: 'pack3',
          packLabel: '3-Pack Bundle (Save 10%)',
          unitPrice: 102.6,
        },
      },
    ],
    subtotal: 102.6,
    shippingFee: 25,
    total: 127.6,
    createdAt: 'Yesterday · 19:20 GST',
    status: 'delivered',
    courierName: 'Hamdan Courier · Business Bay Bike #03',
    estimatedArrival: 'Delivered & COD Verified',
    timeline: buildOrderTimeline('delivered'),
  },
];

function loadOrCreateUserSessionId(): string {
  if (typeof window === 'undefined') return 'uae-sess-server';
  try {
    const existing = window.sessionStorage.getItem(USER_SESSION_ID_KEY);
    if (existing) return existing;
    const created = `uae-sess-${Math.random().toString(36).slice(2, 9)}`;
    window.sessionStorage.setItem(USER_SESSION_ID_KEY, created);
    return created;
  } catch {
    return 'uae-sess-local';
  }
}

function loadSessionOrdersFromStorage(): CustomerOrder[] {
  if (typeof window === 'undefined') return INITIAL_SAMPLE_ORDERS;
  try {
    const raw = window.sessionStorage.getItem(USER_ORDER_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((o: CustomerOrder) => ({
          ...o,
          timeline:
            o.timeline && o.timeline.length > 0
              ? o.timeline
              : buildOrderTimeline(o.status || 'order_placed'),
        }));
      }
    }
    window.sessionStorage.setItem(
      USER_ORDER_SESSION_KEY,
      JSON.stringify(INITIAL_SAMPLE_ORDERS)
    );
  } catch {
    // ignore storage errors
  }
  return INITIAL_SAMPLE_ORDERS;
}

function saveSessionOrdersToStorage(orders: CustomerOrder[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(USER_ORDER_SESSION_KEY, JSON.stringify(orders));
  } catch {
    // ignore storage quota errors
  }
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export type StoreView = 'home' | 'category' | 'product' | 'admin';

interface CartStoreState {
  catalog: Product[];
  items: CartItem[];
  isCartOpen: boolean;
  wishlistIds: string[];
  isWishlistOpen: boolean;
  currentView: StoreView;
  selectedProductId: string;
  activeCategory: 'All' | ProductCategory;
  selectedBrand: string | null;
  nicotineFilter: string | null;
  onlyOffers: boolean;
  searchQuery: string;
  sortBy: 'featured' | 'price-asc' | 'price-desc';
  quickViewProduct: Product | null;
  lastOrder: CustomerOrder | null;
  recentOrders: CustomerOrder[];
  sessionOrderIds: string[];
  userSessionId: string;
  isFetchingOrderHistory: boolean;
  lastOrderHistorySyncAt: string | null;
  emailLogs: EmailLogRecord[];
  currentUser: AuthenticatedUser | null;
  adminOrders: CustomerOrder[];
  isAdminAuthenticated: boolean;
  isCheckingAdminSession: boolean;
  recentlyAddedId: string | null;
  recentlyViewedIds: string[];

  // Cart Actions
  addItem: (product: Product, quantity?: number, selectedVariant?: SelectedVariant) => void;
  updateQuantity: (itemKeyOrProductId: string, delta: number) => void;
  removeItem: (itemKeyOrProductId: string) => void;
  clearCart: () => void;
  setCartOpen: (open: boolean) => void;

  // Wishlist Actions
  toggleWishlist: (productId: string) => void;
  removeWishlistItem: (productId: string) => void;
  clearWishlist: () => void;
  setWishlistOpen: (open: boolean) => void;
  moveWishlistItemToCart: (product: Product) => void;

  // View Routing Actions
  navigateToHome: () => void;
  navigateToCategory: (
    category: 'All' | ProductCategory,
    options?: { brand?: string | null; search?: string; nicotine?: string | null; onlyOffers?: boolean }
  ) => void;
  navigateToProduct: (productId: string) => void;
  navigateToAdmin: () => void;
  syncViewFromLocation: () => void;

  // Filter Actions
  setActiveCategory: (category: 'All' | ProductCategory) => void;
  setSelectedBrand: (brand: string | null) => void;
  setNicotineFilter: (nicotine: string | null) => void;
  setOnlyOffers: (onlyOffers: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'featured' | 'price-asc' | 'price-desc') => void;
  resetAllFilters: () => void;
  setQuickViewProduct: (product: Product | null) => void;

  // Auth Actions (Supabase Auth; admin = profiles.role 'admin', enforced by RLS)
  initAuth: () => () => void;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (input: {
    email: string;
    password: string;
    name: string;
    phone: string;
  }) => Promise<AuthResult & { needsEmailConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOutUser: () => void;
  loginAdmin: (email: string, password: string) => Promise<AuthResult>;
  loginAdminWithGoogle: () => Promise<AuthResult>;
  logoutAdmin: () => void;

  // Recently Viewed Actions (session-storage backed)
  trackProductClick: (productId: string) => void;
  clearRecentlyViewed: () => void;

  // Checkout & Session Order History Actions
  placeOrder: (
    orderData: Omit<
      CustomerOrder,
      'orderId' | 'createdAt' | 'status' | 'courierName' | 'estimatedArrival' | 'timeline'
    >
  ) => Promise<{ success: true; order: CustomerOrder } | { success: false; error: string }>;
  adminUpdateOrderStatus: (
    orderId: string,
    nextStatus: OrderStatusStage,
    courierName?: string,
    estimatedArrival?: string
  ) => Promise<void>;
  loadAdminData: () => Promise<void>;
  updateOrderStatus: (
    orderId: string,
    nextStatus: OrderStatusStage,
    courierName?: string,
    estimatedArrival?: string
  ) => void;
  fetchSessionOrderHistory: () => Promise<void>;
  tickSessionOrderHistoryStatus: (targetOrderId?: string) => void;
  reorderHistoricalOrder: (orderId: string) => void;
  clearLastOrder: () => void;

  // Admin & Backend Sync Actions
  bootstrapFromBackend: () => Promise<void>;
  adminUpsertProduct: (product: Product) => Promise<void>;
  adminDeleteProduct: (productId: string) => Promise<void>;
  adminSendResendEmail: (payload: {
    orderNumber: string;
    recipientEmail: string;
    customerName: string;
    statusLabel: string;
    totalAed: string;
    emirate: string;
  }) => Promise<void>;
  subscribeNewsletterLead: (payload: {
    email: string;
    name?: string;
    discountCode?: string;
  }) => Promise<{ discountCode: string }>;
}

const initialSessionOrders = loadSessionOrdersFromStorage();
const initialSessionId = loadOrCreateUserSessionId();

export const useCartStore = create<CartStoreState>((set, get) => ({
  catalog: [...MOCK_PRODUCTS],
  items: [
    {
      product: MOCK_PRODUCTS[0],
      quantity: 1,
      selectedVariant: {
        flavor: MOCK_PRODUCTS[0].variants.flavors[0],
        nicotine: MOCK_PRODUCTS[0].variants.nicotineOptions[0],
        packId: 'single',
        packLabel: 'Single Unit (1x)',
        unitPrice: MOCK_PRODUCTS[0].price,
      },
      cartItemId: `${MOCK_PRODUCTS[0].id}__${MOCK_PRODUCTS[0].variants.flavors[0]}__${MOCK_PRODUCTS[0].variants.nicotineOptions[0]}__single`,
    },
  ],
  isCartOpen: false,
  wishlistIds: loadInitialWishlist(),
  isWishlistOpen: false,
  currentView:
    typeof window !== 'undefined'
      ? resolveInitialViewFromPathname(window.location.pathname)
      : 'home',
  selectedProductId: MOCK_PRODUCTS[0].id,
  activeCategory: 'All',
  selectedBrand: null,
  nicotineFilter: null,
  onlyOffers: false,
  searchQuery: '',
  sortBy: 'featured',
  quickViewProduct: null,
  lastOrder: null,
  recentOrders: initialSessionOrders,
  sessionOrderIds: initialSessionOrders.map((o) => o.orderId),
  userSessionId: initialSessionId,
  isFetchingOrderHistory: false,
  lastOrderHistorySyncAt: '14:35 GST',
  emailLogs: [],
  adminOrders: [],
  currentUser: null,
  isAdminAuthenticated: false,
  isCheckingAdminSession: isSupabaseConfigured,
  recentlyAddedId: null,
  recentlyViewedIds: loadInitialRecentlyViewed(),

  addItem: (product, quantity = 1, selectedVariant) =>
    set((state) => {
      const nextViewed = recordRecentlyViewedId(state.recentlyViewedIds, product.id);
      saveRecentlyViewedToSession(nextViewed);
      const variantToUse: SelectedVariant = selectedVariant || {
        flavor: product.variants.flavors[0] || product.flavorProfile,
        nicotine: product.variants.nicotineOptions[0] || product.nicotineStrength,
        packId: 'single',
        packLabel: 'Single Unit (1x)',
        unitPrice: product.price,
      };
      return {
        items: addOrIncrementCartItem(state.items, product, quantity, variantToUse),
        recentlyAddedId: product.id,
        recentlyViewedIds: nextViewed,
      };
    }),

  updateQuantity: (itemKeyOrProductId, delta) =>
    set((state) => ({
      items: updateCartItemQuantity(state.items, itemKeyOrProductId, delta),
    })),

  removeItem: (itemKeyOrProductId) =>
    set((state) => ({
      items: removeCartItem(state.items, itemKeyOrProductId),
    })),

  clearCart: () => set({ items: [] }),

  setCartOpen: (open) => set({ isCartOpen: open }),

  toggleWishlist: (productId) =>
    set((state) => {
      const nextWishlist = toggleWishlistId(state.wishlistIds, productId);
      saveWishlistToStorage(nextWishlist);
      return { wishlistIds: nextWishlist };
    }),

  removeWishlistItem: (productId) =>
    set((state) => {
      const nextWishlist = state.wishlistIds.filter((id) => id !== productId);
      saveWishlistToStorage(nextWishlist);
      return { wishlistIds: nextWishlist };
    }),

  clearWishlist: () => {
    saveWishlistToStorage([]);
    set({ wishlistIds: [] });
  },

  setWishlistOpen: (open) => set({ isWishlistOpen: open }),

  moveWishlistItemToCart: (product) =>
    set((state) => {
      const variantToUse: SelectedVariant = {
        flavor: product.variants.flavors[0] || product.flavorProfile,
        nicotine: product.variants.nicotineOptions[0] || product.nicotineStrength,
        packId: 'single',
        packLabel: 'Single Unit (1x)',
        unitPrice: product.price,
      };
      const nextWishlist = state.wishlistIds.filter((id) => id !== product.id);
      saveWishlistToStorage(nextWishlist);
      return {
        items: addOrIncrementCartItem(state.items, product, 1, variantToUse),
        wishlistIds: nextWishlist,
      };
    }),

  navigateToHome: () => {
    syncBrowserUrlForView('home');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    set({
      currentView: 'home',
    });
  },

  navigateToCategory: (category, options) => {
    syncBrowserUrlForView('category');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    set({
      currentView: 'category',
      activeCategory: category,
      selectedBrand: options?.brand !== undefined ? options.brand : null,
      searchQuery: options?.search !== undefined ? options.search : '',
      nicotineFilter: options?.nicotine !== undefined ? options.nicotine : null,
      onlyOffers: options?.onlyOffers !== undefined ? options.onlyOffers : category === 'Offers',
    });
  },

  navigateToProduct: (productId) =>
    set((state) => {
      syncBrowserUrlForView('product');
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      const nextViewed = recordRecentlyViewedId(state.recentlyViewedIds, productId);
      saveRecentlyViewedToSession(nextViewed);
      return {
        currentView: 'product',
        selectedProductId: productId,
        recentlyViewedIds: nextViewed,
        quickViewProduct: null,
      };
    }),

  navigateToAdmin: () => {
    syncBrowserUrlForView('admin');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    set({ currentView: 'admin' });
  },

  syncViewFromLocation: () => {
    if (typeof window === 'undefined') return;
    const resolved = resolveInitialViewFromPathname(window.location.pathname);
    set((state) => {
      if (resolved === 'admin' && state.currentView !== 'admin') {
        return { currentView: 'admin' };
      }
      if (resolved === 'home' && state.currentView === 'admin') {
        return { currentView: 'home' };
      }
      return state;
    });
  },

  setActiveCategory: (category) =>
    set({
      activeCategory: category,
      selectedBrand: null,
      onlyOffers: category === 'Offers',
    }),

  setSelectedBrand: (brand) => set({ selectedBrand: brand }),

  setNicotineFilter: (nicotine) => set({ nicotineFilter: nicotine }),

  setOnlyOffers: (onlyOffers) => set({ onlyOffers }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSortBy: (sort) => set({ sortBy: sort }),

  resetAllFilters: () =>
    set({
      activeCategory: 'All',
      selectedBrand: null,
      nicotineFilter: null,
      onlyOffers: false,
      searchQuery: '',
      sortBy: 'featured',
    }),

  setQuickViewProduct: (product) =>
    set((state) => {
      if (!product) {
        return { quickViewProduct: null };
      }
      const nextViewed = recordRecentlyViewedId(state.recentlyViewedIds, product.id);
      saveRecentlyViewedToSession(nextViewed);
      return {
        quickViewProduct: product,
        recentlyViewedIds: nextViewed,
      };
    }),

  initAuth: () => {
    if (!isSupabaseConfigured) {
      set({ isCheckingAdminSession: false });
      return () => {};
    }

    const applySession = async (session: Session | null) => {
      if (!session?.user) {
        set({
          currentUser: null,
          isAdminAuthenticated: false,
          isCheckingAdminSession: false,
          adminOrders: [],
          emailLogs: [],
        });
        return;
      }
      const user = await fetchProfile(session.user);
      const isAdmin = user.role === 'admin';
      set({ currentUser: user, isAdminAuthenticated: isAdmin, isCheckingAdminSession: false });
      if (isAdmin) void get().loadAdminData();
    };

    // Fires immediately with the stored session (INITIAL_SESSION), then on every
    // sign-in / sign-out / token refresh. Deferred so we never call Supabase
    // from inside its own callback.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => void applySession(session), 0);
    });
    return () => data.subscription.unsubscribe();
  },

  signInWithEmail: async (email, password) => {
    if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED_MESSAGE };
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { success: false, error: friendlyAuthError(error.message) };
    return { success: true };
  },

  signUpWithEmail: async ({ email, password, name, phone }) => {
    if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED_MESSAGE };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: name.trim(), phone: phone.trim() },
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    if (error) return { success: false, error: friendlyAuthError(error.message) };
    // Supabase hides "already registered" by returning a user with no identities.
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      return { success: false, error: 'An account with this email already exists. Please sign in.' };
    }
    return { success: true, needsEmailConfirmation: !data.session };
  },

  signInWithGoogle: async () => {
    if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED_MESSAGE };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
    });
    return error ? { success: false, error: friendlyAuthError(error.message) } : { success: true };
  },

  signOutUser: () => {
    set((state) => ({
      currentUser: null,
      isAdminAuthenticated: false,
      isCheckingAdminSession: false,
      adminOrders: [],
      emailLogs: [],
      lastOrder: state.lastOrder,
    }));
    void supabase.auth.signOut();
  },

  // Admin sign-in: a normal Supabase sign-in, then the profile must have role 'admin'.
  // (Even if this client check were bypassed, Row Level Security blocks every admin query.)
  loginAdmin: async (email, password) => {
    const check = validateAdminLoginInput(email, password);
    if (!check.valid) return { success: false, error: check.error || 'Invalid admin credentials.' };
    if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED_MESSAGE };

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !data.user) {
      return { success: false, error: friendlyAuthError(error?.message || '') };
    }
    const user = await fetchProfile(data.user);
    if (user.role !== 'admin') {
      await supabase.auth.signOut();
      set({ currentUser: null, isAdminAuthenticated: false });
      return { success: false, error: 'This account does not have admin access.' };
    }
    syncBrowserUrlForView('admin');
    set({
      currentUser: user,
      isAdminAuthenticated: true,
      isCheckingAdminSession: false,
      currentView: 'admin',
    });
    void get().loadAdminData();
    return { success: true };
  },

  // Redirects to Google; on return, initAuth() checks the profile role.
  loginAdminWithGoogle: async () => {
    if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED_MESSAGE };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/admin` : undefined,
      },
    });
    return error ? { success: false, error: friendlyAuthError(error.message) } : { success: true };
  },

  logoutAdmin: () => get().signOutUser(),

  trackProductClick: (productId) =>
    set((state) => {
      const nextViewed = recordRecentlyViewedId(state.recentlyViewedIds, productId);
      saveRecentlyViewedToSession(nextViewed);
      return { recentlyViewedIds: nextViewed };
    }),

  clearRecentlyViewed: () => {
    saveRecentlyViewedToSession([]);
    set({ recentlyViewedIds: [] });
  },

  placeOrder: async (orderData) => {
    const email = (orderData.email || get().currentUser?.email || '').trim();
    try {
      // The database recomputes every price from the products table; totals below
      // are what the server actually charged, not what the browser sent.
      const result = await placeOrderRemote({
        fullName: orderData.fullName,
        email,
        phone: orderData.phone,
        emirate: orderData.emirate,
        address: orderData.address,
        paymentMethod: orderData.paymentMethod,
        items: orderData.items,
      });

      const newOrder: CustomerOrder = {
        ...orderData,
        email,
        items: orderData.items.map((line, idx) => {
          const confirmed = result.items[idx];
          return line.selectedVariant && confirmed
            ? { ...line, selectedVariant: { ...line.selectedVariant, unitPrice: confirmed.unitPrice } }
            : line;
        }),
        orderId: result.orderNumber,
        subtotal: result.subtotal,
        shippingFee: result.shippingFee,
        total: result.total,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'order_placed',
        courierName: result.courierName,
        estimatedArrival: result.estimatedArrival,
        timeline: buildOrderTimeline('order_placed'),
      };

      set((state) => {
        const nextOrders = [newOrder, ...state.recentOrders];
        const nextIds = Array.from(new Set([newOrder.orderId, ...state.sessionOrderIds]));
        saveSessionOrdersToStorage(nextOrders);
        return {
          items: [],
          lastOrder: newOrder,
          recentOrders: nextOrders,
          sessionOrderIds: nextIds,
        };
      });

      // Confirmation email is best-effort; the order is already saved.
      void sendEmail({ type: 'order_confirmation', orderNumber: result.orderNumber, email }).catch(
        (err) => console.warn('Order confirmation email failed:', err)
      );

      return { success: true, order: newOrder };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'We could not place your order. Please try again.',
      };
    }
  },

  // Local-only: drives the customer-side delivery tracking simulation in this browser.
  updateOrderStatus: (orderId, nextStatus, courierName, estimatedArrival) => {
    const nextTimeline = buildOrderTimeline(nextStatus);

    set((state) => {
      const nextOrders = state.recentOrders.map((ord) =>
        ord.orderId === orderId
          ? {
              ...ord,
              status: nextStatus,
              timeline: nextTimeline,
              ...(courierName ? { courierName } : {}),
              ...(estimatedArrival ? { estimatedArrival } : {}),
            }
          : ord
      );
      saveSessionOrdersToStorage(nextOrders);
      return {
        recentOrders: nextOrders,
        lastOrderHistorySyncAt: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };
    });
  },

  // Admin-only: persists the new status (RLS rejects anyone else) and emails the customer.
  adminUpdateOrderStatus: async (orderId, nextStatus, courierName, estimatedArrival) => {
    await updateOrderStatusRemote(orderId, nextStatus, courierName, estimatedArrival);
    const timeline = buildOrderTimeline(nextStatus);
    const apply = (list: CustomerOrder[]) =>
      list.map((ord) =>
        ord.orderId === orderId
          ? {
              ...ord,
              status: nextStatus,
              timeline,
              ...(courierName ? { courierName } : {}),
              ...(estimatedArrival ? { estimatedArrival } : {}),
            }
          : ord
      );
    set((state) => ({
      adminOrders: apply(state.adminOrders),
      recentOrders: apply(state.recentOrders),
    }));
    try {
      const sent = await sendEmail({ type: 'status_update', orderNumber: orderId });
      if (sent.emailLog) {
        const log = sent.emailLog;
        set((state) => ({ emailLogs: [log, ...state.emailLogs] }));
      }
    } catch (err) {
      // The status change is already saved; a failed email must not undo it.
      console.warn('Status email failed:', err);
    }
  },

  loadAdminData: async () => {
    if (!get().isAdminAuthenticated) return;
    try {
      const [orders, logs] = await Promise.all([
        fetchAllOrders(get().catalog),
        fetchEmailLogs(),
      ]);
      set({ adminOrders: orders, emailLogs: logs });
    } catch (err) {
      console.warn('Could not load admin data:', err);
    }
  },

  fetchSessionOrderHistory: async () => {
    set({ isFetchingOrderHistory: true });
    try {
      const state = get();
      let fetched: CustomerOrder[] = [];

      // Signed-in customers: their own orders (Row Level Security limits the rows).
      if (state.currentUser) {
        fetched = await fetchMyOrders(state.catalog, state.currentUser.uid);
      }
      // Guests (and orders placed before signing in): refresh by order number + email.
      const lookups = state.recentOrders
        .filter((o) => o.email && !fetched.some((f) => f.orderId === o.orderId))
        .map((o) => ({ order_number: o.orderId, email: o.email as string }));
      if (lookups.length > 0) {
        fetched = [...fetched, ...(await trackOrders(lookups, state.catalog))];
      }

      set((s) => {
        const merged = mergeSessionOrdersWithFetched(s.recentOrders, fetched);
        saveSessionOrdersToStorage(merged);
        return {
          recentOrders: merged,
          sessionOrderIds: Array.from(
            new Set([...s.sessionOrderIds, ...merged.map((o) => o.orderId)])
          ),
        };
      });
    } catch (err) {
      console.warn('Order history refresh failed (showing local orders):', err);
    } finally {
      set({
        isFetchingOrderHistory: false,
        lastOrderHistorySyncAt: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      });
    }
  },

  tickSessionOrderHistoryStatus: (targetOrderId) => {
    set((state) => {
      const nextOrders = simulateRealtimeOrderHistoryTick(state.recentOrders, targetOrderId);
      saveSessionOrdersToStorage(nextOrders);
      return {
        recentOrders: nextOrders,
        lastOrderHistorySyncAt: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };
    });
  },

  reorderHistoricalOrder: (orderId) => {
    set((state) => {
      const targetOrder = state.recentOrders.find((o) => o.orderId === orderId);
      if (!targetOrder) return state;
      let nextItems = [...state.items];
      for (const line of targetOrder.items) {
        nextItems = addOrIncrementCartItem(
          nextItems,
          line.product,
          line.quantity,
          line.selectedVariant
        );
      }
      return {
        items: nextItems,
        isCartOpen: true,
      };
    });
  },

  clearLastOrder: () => set({ lastOrder: null }),

  bootstrapFromBackend: async () => {
    const remote = await fetchCatalog();
    // Keep the built-in demo catalog if Supabase is unconfigured, unreachable or not seeded yet.
    if (!remote || remote.length === 0) return;
    set((state) => ({
      catalog: remote,
      items: reconcileCartWithCatalog(state.items, remote),
    }));
    if (get().isAdminAuthenticated) void get().loadAdminData();
  },

  // Admin catalog writes go to Supabase first; Row Level Security rejects non-admins.
  adminUpsertProduct: async (product) => {
    await upsertProductRemote(product);
    set((state) => {
      const exists = state.catalog.some((p) => p.id === product.id);
      return {
        catalog: exists
          ? state.catalog.map((p) => (p.id === product.id ? product : p))
          : [product, ...state.catalog],
      };
    });
  },

  adminDeleteProduct: async (productId) => {
    await deleteProductRemote(productId);
    set((state) => ({
      catalog: state.catalog.filter((p) => p.id !== productId),
      items: state.items.filter((i) => i.product.id !== productId),
    }));
  },

  adminSendResendEmail: async (payload) => {
    const sent = await sendEmail({ type: 'admin_dispatch', ...payload });
    if (sent.emailLog) {
      const log = sent.emailLog;
      set((state) => ({ emailLogs: [log, ...state.emailLogs] }));
    }
  },

  subscribeNewsletterLead: async (payload) => {
    const sent = await sendEmail({ type: 'newsletter', email: payload.email, name: payload.name });
    return { discountCode: sent.discountCode || NEWSLETTER_DISCOUNT_CODE };
  },
}));

const NOT_CONFIGURED_MESSAGE = 'The store backend is not configured yet. Please try again later.';

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Invalid email or password.';
  if (m.includes('email not confirmed')) return 'Please confirm your email address first (check your inbox).';
  if (m.includes('already registered')) return 'An account with this email already exists. Please sign in.';
  if (m.includes('password should be')) return 'Password must be at least 6 characters.';
  if (m.includes('rate limit')) return 'Too many attempts. Please wait a moment and try again.';
  return message || 'Sign-in failed. Please try again.';
}
