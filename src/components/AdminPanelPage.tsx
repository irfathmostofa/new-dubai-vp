import React, { useState } from 'react';
import {
  Package,
  Truck,
  Mail,
  Database,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Send,
  ShieldCheck,
  Edit3,
  Layers,
  Lock,
  KeyRound,
  LogOut,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { IMG_ELFBAR } from '../data/products';
import { useCartStore } from '../store/useCartStore';
import { OrderStatusStage, Product, ProductCategory } from '../types/store';
import {
  formatAED,
  ORDER_STATUS_SEQUENCE,
  buildOrderTimeline,
  canAccessAdminDashboard,
} from '../utils/storeLogic';

const CATEGORIES: ProductCategory[] = [
  'Disposable Vape',
  'Pods System',
  'E-Liquid',
  'Vape Kit',
  'Brands',
  'Offers',
];

const SCHEMA_TABLES = [
  {
    tableName: 'profiles',
    engine: 'Supabase Postgres + RLS (linked to auth.users)',
    columns: [
      'id (uuid PK -> auth.users)',
      'email (text)',
      'display_name (text)',
      'phone (text)',
      'emirate (text)',
      'role (customer | admin, admin-only to change)',
      'created_at / updated_at (timestamptz)',
    ],
    description: 'One row per Supabase Auth user. role = admin unlocks this dashboard (enforced by RLS).',
  },
  {
    tableName: 'categories',
    engine: 'Supabase Postgres + RLS (public read, admin write)',
    columns: [
      'slug (text PK)',
      'name (text)',
      'tagline (text)',
      'description (text)',
      'starting_price_aed (numeric)',
    ],
    description: 'Master taxonomy for Disposable Vapes, Pods, E-Liquids, Kits & Offers.',
  },
  {
    tableName: 'products',
    engine: 'Supabase Postgres + RLS (public read, admin write)',
    columns: [
      'slug (text PK)',
      'title, brand, category (text)',
      'price_aed / original_price_aed (numeric)',
      'puff_count, nicotine_strength, flavor_profile (text)',
      'image (text)',
      'stock_count (integer) / in_stock, is_offer (boolean)',
      'flavors, nicotine_options, specs, details (jsonb)',
    ],
    description: 'Complete UAE inventory catalog with JSONB variant options and telemetry specs.',
  },
  {
    tableName: 'orders',
    engine: 'Supabase Postgres + RLS (created only via place_order())',
    columns: [
      'id (identity PK)',
      'order_number (text unique, VDK-######)',
      'user_id (uuid -> auth.users, null for guests)',
      'customer_name / email / phone (text)',
      'emirate, delivery_address, payment_method (text)',
      'subtotal_aed, shipping_fee_aed, total_aed (numeric, server-computed)',
      'status, courier_name, estimated_arrival (text)',
      'items, timeline (jsonb)',
    ],
    description: 'Cash on Delivery & Link Payment orders with a 5-stage courier timeline. Prices are recomputed in the database.',
  },
  {
    tableName: 'order_items',
    engine: 'Supabase Postgres + RLS',
    columns: [
      'id (identity PK)',
      'order_id (bigint FK -> orders.id)',
      'product_slug, product_title (text)',
      'selected_flavor, selected_nicotine, pack_label (text)',
      'quantity (integer)',
      'unit_price_aed (numeric)',
    ],
    description: 'Normalized line items linked to orders with selected flavor, nicotine, and pack tier.',
  },
  {
    tableName: 'email_logs',
    engine: 'Supabase Postgres + Edge Function (Resend)',
    columns: [
      'id (identity PK)',
      'order_number, recipient_email, subject (text)',
      'email_type (order_confirmation | status_update | admin_dispatch | newsletter_welcome)',
      'provider (text, default resend)',
      'resend_message_id (text)',
      'delivery_status (sent | simulated_no_api_key | failed)',
    ],
    description: 'Audit log of every transactional email. Written only by the send-email Edge Function.',
  },
  {
    tableName: 'newsletter_leads',
    engine: 'Supabase Postgres + Edge Function (Resend)',
    columns: ['email (text PK, lowercase)', 'name (text)', 'discount_code (text)', 'created_at (timestamptz)'],
    description: 'VIP newsletter sign-ups. One welcome email per address.',
  },
];

export function AdminPanelPage() {
  const catalog = useCartStore((state) => state.catalog);
  const adminOrders = useCartStore((state) => state.adminOrders);
  const emailLogs = useCartStore((state) => state.emailLogs);
  const currentUser = useCartStore((state) => state.currentUser);
  const isAdminAuthenticated = useCartStore((state) => state.isAdminAuthenticated);
  const loginAdmin = useCartStore((state) => state.loginAdmin);
  const logoutAdmin = useCartStore((state) => state.logoutAdmin);
  const loginAdminWithGoogle = useCartStore((state) => state.loginAdminWithGoogle);
  const isCheckingAdminSession = useCartStore((state) => state.isCheckingAdminSession);
  const navigateToHome = useCartStore((state) => state.navigateToHome);
  const navigateToProduct = useCartStore((state) => state.navigateToProduct);
  const adminUpdateOrderStatus = useCartStore((state) => state.adminUpdateOrderStatus);
  const adminUpsertProduct = useCartStore((state) => state.adminUpsertProduct);
  const adminDeleteProduct = useCartStore((state) => state.adminDeleteProduct);
  const adminSendResendEmail = useCartStore((state) => state.adminSendResendEmail);

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'emails' | 'schema'>('products');

  // Admin Portal Login Gate State (/admin)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Product Form State
  const [newTitle, setNewTitle] = useState('');
  const [newBrand, setNewBrand] = useState('Elf Bar');
  const [newCategory, setNewCategory] = useState<ProductCategory>('Disposable Vape');
  const [newPrice, setNewPrice] = useState('55');
  const [newPuffs, setNewPuffs] = useState('15,000 Puffs');
  const [newNicotine, setNewNicotine] = useState('50mg (5%)');
  const [newFlavor, setNewFlavor] = useState('Blueberry Raspberry Ice');
  const [productSavedBanner, setProductSavedBanner] = useState<string | null>(null);

  // Resend Email Form State
  const [emailOrderNum, setEmailOrderNum] = useState('');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailCustomerName, setEmailCustomerName] = useState('');
  const [emailStatusLabel, setEmailStatusLabel] = useState('Courier En Route (Live GPS Telemetry)');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  const reportAdminError = (err: unknown) => {
    setAdminError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    setTimeout(() => setAdminError(null), 6000);
  };
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);

  const hasDashboardAccess = canAccessAdminDashboard(currentUser, isAdminAuthenticated);

  const handleAdminFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsAuthenticating(true);
    const result = await loginAdmin(adminEmail, adminPassword);
    setIsAuthenticating(false);
    if (!result.success) {
      setLoginError(result.error || 'Invalid admin credentials.');
    }
  };

  const handleGoogleAdminSignIn = async () => {
    setLoginError(null);
    setIsAuthenticating(true);
    // On success the browser redirects to Google and back to /admin; the profile
    // role is then checked by the auth listener.
    const outcome = await loginAdminWithGoogle();
    if (!outcome.success) {
      setLoginError(outcome.error || 'Admin sign-in failed.');
      setIsAuthenticating(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const slug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const createdProduct: Product = {
      id: `${slug}-${Date.now().toString().slice(-3)}`,
      title: newTitle.trim(),
      brand: newBrand.trim() || 'Vape Dubai King',
      category: newCategory,
      price: Math.max(10, Number(newPrice) || 55),
      puffCount: newPuffs.trim() || '15,000 Puffs',
      nicotineStrength: newNicotine.trim() || '50mg (5%)',
      flavorProfile: newFlavor.trim() || 'Mixed Berries Ice',
      image: catalog[0]?.image || IMG_ELFBAR,
      inStock: true,
      stockCount: 60,
      isOffer: newCategory === 'Offers',
      description: `${newTitle.trim()} — Official ESMA UAE compliant hardware stocked in our Al Quoz Dubai fulfillment hub with same-day Cash on Delivery.`,
      variants: {
        flavors: [newFlavor.trim() || 'Blueberry Ice', 'Watermelon Lush Ice', 'Dubai Mango Mint'],
        nicotineOptions: [newNicotine.trim() || '50mg (5%)', '20mg (2%)'],
      },
      specs: {
        battery: '850mAh USB-C Fast Charge',
        capacity: '20ml Pre-Filled E-Liquid',
        coil: 'Dual Mesh 1.0Ω Core',
        display: 'Smart Digital OLED Telemetry',
      },
    };

    try {
      await adminUpsertProduct(createdProduct);
      setProductSavedBanner(`Added "${createdProduct.title}" to the catalog (Supabase)`);
      setNewTitle('');
      setTimeout(() => setProductSavedBanner(null), 3500);
    } catch (err) {
      reportAdminError(err);
    }
  };

  const handleToggleProductStock = async (prod: Product) => {
    try {
      await adminUpsertProduct({
        ...prod,
        inStock: !prod.inStock,
      });
    } catch (err) {
      reportAdminError(err);
    }
  };

  const handleTriggerResendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRecipient.trim() || !emailOrderNum.trim()) return;
    const order = adminOrders.find((o) => o.orderId === emailOrderNum.trim());
    setIsSendingEmail(true);
    setEmailFeedback(null);
    try {
      await adminSendResendEmail({
        orderNumber: emailOrderNum.trim(),
        recipientEmail: emailRecipient.trim(),
        customerName: emailCustomerName.trim() || order?.fullName || 'UAE Customer',
        statusLabel: emailStatusLabel,
        totalAed: order ? formatAED(order.total) : 'AED 0.00',
        emirate: order?.emirate || 'Dubai',
      });
      setEmailFeedback(`Email dispatched to ${emailRecipient}`);
      setTimeout(() => setEmailFeedback(null), 3500);
    } catch (err) {
      reportAdminError(err);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const totalInventoryValue = catalog.reduce(
    (sum, p) => sum + p.price * (p.stockCount ?? 40),
    0
  );

  // Stored session is being re-validated with the server: show nothing sensitive yet.
  if (!hasDashboardAccess && isCheckingAdminSession) {
    return (
      <div
        data-testid="admin-session-check"
        className="flex min-h-screen items-center justify-center bg-zinc-950 text-xs font-semibold tracking-wider text-zinc-400 uppercase"
      >
        Verifying admin session...
      </div>
    );
  }

  // Dedicated /admin Login Gate before unlocking the Admin Dashboard
  if (!hasDashboardAccess) {
    return (
      <div
        data-testid="admin-login-gate"
        className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between px-4 py-8 sm:px-6 lg:px-8"
      >
        {/* Top Bar for /admin route */}
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between border-b border-zinc-800 pb-5 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-emerald-500/40 bg-emerald-950/60 text-emerald-400">
              <Lock className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold tracking-widest text-emerald-400 uppercase truncate">
                Protected Route · /admin
              </p>
              <p className="font-display text-sm sm:text-base font-bold text-white truncate">
                Vape Dubai King · Admin Authentication Gate
              </p>
            </div>
          </div>

          <a
            href="/"
            data-testid="btn-admin-login-back"
            onClick={(e) => {
              e.preventDefault();
              navigateToHome();
            }}
            className="inline-flex shrink-0 items-center gap-1.5 border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-200 transition-colors hover:border-white hover:bg-white hover:text-zinc-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Storefront</span>
          </a>
        </div>

        {/* Center Login Card */}
        <div className="mx-auto my-8 w-full max-w-md border border-zinc-800 bg-zinc-900/90 p-5 sm:p-8 shadow-2xl">
          <div className="inline-flex items-center gap-1.5 border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-[11px] font-bold tracking-widest text-emerald-400 uppercase">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Authorized Personnel Only</span>
          </div>

          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Admin Portal Sign In
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
            Sign in with your Vape Dubai King administrator credentials to unlock the{' '}
            <code className="font-mono-num text-emerald-400">/admin</code> operations dashboard,
            Supabase inventory manager, and Resend email console.
          </p>

          {loginError && (
            <div
              data-testid="admin-login-error"
              role="alert"
              className="mt-4 flex items-start gap-2.5 border border-red-500/40 bg-red-950/50 p-3 text-xs font-medium text-red-200"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form
            data-testid="admin-login-form"
            onSubmit={handleAdminFormSubmit}
            className="mt-5 space-y-4"
          >
            <div>
              <label
                htmlFor="admin-login-email"
                className="block text-[11px] font-bold tracking-wider text-zinc-300 uppercase"
              >
                Admin Email Address
              </label>
              <input
                id="admin-login-email"
                data-testid="input-admin-email"
                type="email"
                required
                autoComplete="username"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Admin email"
                className="mt-1.5 w-full border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="admin-login-password"
                className="block text-[11px] font-bold tracking-wider text-zinc-300 uppercase"
              >
                Admin Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="admin-login-password"
                  data-testid="input-admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full border border-zinc-700 bg-zinc-950 py-2.5 pr-10 pl-3.5 text-sm text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              data-testid="btn-admin-login-submit"
              disabled={isAuthenticating}
              className="flex w-full items-center justify-center gap-2 bg-white px-5 py-3 text-xs font-bold tracking-wider text-zinc-950 uppercase transition-colors hover:bg-zinc-200 disabled:opacity-50"
            >
              <KeyRound className="h-4 w-4" />
              <span>{isAuthenticating ? 'Verifying Credentials...' : 'Sign In to Admin Dashboard'}</span>
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-zinc-800">
            <button
              type="button"
              data-testid="btn-admin-google-login"
              onClick={handleGoogleAdminSignIn}
              disabled={isAuthenticating}
              className="flex w-full items-center justify-center gap-2 border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-white hover:text-white"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Sign In with Google Workspace Admin</span>
            </button>
          </div>
        </div>

        {/* Bottom Security Footer */}
        <div className="mx-auto w-full max-w-5xl border-t border-zinc-900 pt-4 text-center text-[11px] text-zinc-500">
          Vape Dubai King Enterprise Console · Route <code className="font-mono-num">/admin</code> · Protected by Session & Role Verification
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="admin-panel-view"
      className="min-h-screen bg-zinc-50 pb-16"
    >
      {/* Top Admin Command Bar */}
      <div
        data-testid="admin-dashboard-unlocked"
        className="border-b border-zinc-800 bg-zinc-950 text-white"
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-emerald-400 uppercase">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Vape Dubai King · /admin Dashboard & Supabase Console</span>
              </div>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Storefront Operations & Full Schema Manager
              </h1>
              <p className="mt-1 text-xs text-zinc-400">
                Powered by Supabase (Postgres + Auth + Edge Functions) and Resend Transactional Email.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {currentUser && (
                <span
                  data-testid="admin-authenticated-badge"
                  className="border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300"
                >
                  Admin: <strong className="text-white">{currentUser.email}</strong>
                </span>
              )}
              <button
                type="button"
                data-testid="btn-admin-logout"
                onClick={logoutAdmin}
                className="inline-flex items-center gap-1.5 border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs font-bold text-zinc-200 transition-colors hover:border-red-500 hover:bg-red-950/60 hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out Admin</span>
              </button>
              <button
                type="button"
                data-testid="admin-back-to-store-btn"
                onClick={navigateToHome}
                className="inline-flex items-center gap-2 bg-white px-4 py-2.5 text-xs font-bold text-zinc-950 transition-colors hover:bg-zinc-200"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Storefront</span>
              </button>
            </div>
          </div>

          {/* KPI Metric Strip */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="border border-zinc-800 bg-zinc-900/90 p-3.5 sm:p-4 min-w-0">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase truncate">Active SKUs</p>
              <p
                data-testid="admin-kpi-sku-count"
                className="mt-1 font-mono-num text-xl sm:text-2xl font-bold text-white"
              >
                {catalog.length}
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-400 truncate">Synced with products table</p>
            </div>

            <div className="border border-zinc-800 bg-zinc-900/90 p-3.5 sm:p-4 min-w-0">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase truncate">Live UAE Orders</p>
              <p
                data-testid="admin-kpi-orders-count"
                className="mt-1 font-mono-num text-xl sm:text-2xl font-bold text-white"
              >
                {adminOrders.length}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-400 truncate">5-Stage Courier Telemetry</p>
            </div>

            <div className="border border-zinc-800 bg-zinc-900/90 p-3.5 sm:p-4 min-w-0">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase truncate">Resend Emails</p>
              <p
                data-testid="admin-kpi-email-count"
                className="mt-1 font-mono-num text-xl sm:text-2xl font-bold text-white"
              >
                {emailLogs.length}
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-400 truncate">Logged in email_logs</p>
            </div>

            <div className="border border-zinc-800 bg-zinc-900/90 p-3.5 sm:p-4 min-w-0">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase truncate">
                Warehouse Stock Value
              </p>
              <p className="mt-1 font-mono-num text-lg sm:text-2xl font-bold text-white truncate">
                {formatAED(totalInventoryValue)}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-400 truncate">Al Quoz Hub · Dubai</p>
            </div>
          </div>

          {/* Admin Section Navigation Tabs */}
          <div className="mt-6 grid grid-cols-1 gap-2 border-t border-zinc-800 pt-4 sm:grid-cols-2 lg:flex lg:flex-wrap">
            {adminError && (
              <div
                role="alert"
                data-testid="admin-error-toast"
                className="fixed right-4 bottom-4 z-50 max-w-sm border border-red-600 bg-red-50 p-3 text-xs font-bold text-red-900 shadow-lg"
              >
                {adminError}
              </div>
            )}
            <button
              type="button"
              data-testid="admin-tab-products"
              onClick={() => setActiveTab('products')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors ${
                activeTab === 'products'
                  ? 'bg-white text-zinc-950'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Package className="h-4 w-4 shrink-0" />
              <span className="truncate">1. Inventory & Products ({catalog.length})</span>
            </button>

            <button
              type="button"
              data-testid="admin-tab-orders"
              onClick={() => setActiveTab('orders')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors ${
                activeTab === 'orders'
                  ? 'bg-white text-zinc-950'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Truck className="h-4 w-4 shrink-0" />
              <span className="truncate">2. Orders & Live Courier Dispatch ({adminOrders.length})</span>
            </button>

            <button
              type="button"
              data-testid="admin-tab-emails"
              onClick={() => setActiveTab('emails')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors ${
                activeTab === 'emails'
                  ? 'bg-white text-zinc-950'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">3. Resend Email Dispatch ({emailLogs.length})</span>
            </button>

            <button
              type="button"
              data-testid="admin-tab-schema"
              onClick={() => setActiveTab('schema')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors ${
                activeTab === 'schema'
                  ? 'bg-white text-zinc-950'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Database className="h-4 w-4 shrink-0" />
              <span className="truncate">4. Full Database Schema (6 Tables)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Admin Workspace Content */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:pt-8 sm:px-6 lg:px-8">
        {/* TAB 1: PRODUCTS & INVENTORY CRUD */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left 4 Cols: Add New Product Form */}
            <div className="lg:col-span-4">
              <form
                onSubmit={handleCreateProduct}
                data-testid="admin-add-product-form"
                className="border border-zinc-200 bg-white p-5 sm:p-6 space-y-4"
              >
                <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
                  <Plus className="h-4 w-4 text-zinc-950" />
                  <h2 className="font-display text-base font-bold text-zinc-950">
                    Add New Vape Product
                  </h2>
                </div>

                {productSavedBanner && (
                  <div
                    data-testid="admin-product-saved-banner"
                    className="flex items-center gap-2 border border-emerald-600 bg-emerald-50 p-3 text-xs font-bold text-emerald-900"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{productSavedBanner}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="admin-prod-title"
                    className="block text-xs font-bold text-zinc-900"
                  >
                    Product Title
                  </label>
                  <input
                    id="admin-prod-title"
                    data-testid="admin-input-product-title"
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Geek Bar Pulse X 25000 Dubai Edition"
                    className="mt-1 w-full border border-zinc-300 px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="admin-prod-brand"
                      className="block text-xs font-bold text-zinc-900"
                    >
                      Brand
                    </label>
                    <input
                      id="admin-prod-brand"
                      type="text"
                      value={newBrand}
                      onChange={(e) => setNewBrand(e.target.value)}
                      className="mt-1 w-full border border-zinc-300 px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="admin-prod-price"
                      className="block text-xs font-bold text-zinc-900"
                    >
                      Price (AED)
                    </label>
                    <input
                      id="admin-prod-price"
                      data-testid="admin-input-product-price"
                      type="number"
                      min="10"
                      required
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="mt-1 w-full border border-zinc-300 px-3 py-2 font-mono-num text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-prod-category"
                    className="block text-xs font-bold text-zinc-900"
                  >
                    Department Category
                  </label>
                  <select
                    id="admin-prod-category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                    className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-950 focus:border-zinc-950 focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="admin-prod-puffs"
                      className="block text-xs font-bold text-zinc-900"
                    >
                      Puff / Output Spec
                    </label>
                    <input
                      id="admin-prod-puffs"
                      type="text"
                      value={newPuffs}
                      onChange={(e) => setNewPuffs(e.target.value)}
                      className="mt-1 w-full border border-zinc-300 px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="admin-prod-nic"
                      className="block text-xs font-bold text-zinc-900"
                    >
                      Nicotine Strength
                    </label>
                    <input
                      id="admin-prod-nic"
                      type="text"
                      value={newNicotine}
                      onChange={(e) => setNewNicotine(e.target.value)}
                      className="mt-1 w-full border border-zinc-300 px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-prod-flavor"
                    className="block text-xs font-bold text-zinc-900"
                  >
                    Primary Flavour Profile
                  </label>
                  <input
                    id="admin-prod-flavor"
                    type="text"
                    value={newFlavor}
                    onChange={(e) => setNewFlavor(e.target.value)}
                    className="mt-1 w-full border border-zinc-300 px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  data-testid="admin-submit-product-btn"
                  className="flex w-full items-center justify-center gap-2 bg-zinc-950 py-3 text-xs font-bold text-white transition-colors hover:bg-zinc-800"
                >
                  <Plus className="h-4 w-4" />
                  <span>Save Product to Storefront & DB</span>
                </button>
              </form>
            </div>

            {/* Right 8 Cols: Live Catalog Management Table */}
            <div className="lg:col-span-8">
              <div className="border border-zinc-200 bg-white">
                <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 sm:px-6">
                  <div>
                    <h2 className="font-display text-base font-bold text-zinc-950">
                      Storefront Product Catalog ({catalog.length} SKUs)
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Changes immediately update the live storefront, category filters, and PostgreSQL database.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-zinc-200">
                  {catalog.map((prod) => (
                    <div
                      key={prod.id}
                      data-testid={`admin-product-row-${prod.id}`}
                      className="flex flex-col gap-3 p-4 hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <img
                          src={prod.image}
                          alt={prod.title}
                          className="h-14 w-14 shrink-0 border border-zinc-200 bg-zinc-100 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-zinc-500 uppercase truncate">
                              {prod.brand}
                            </span>
                            <span className="text-zinc-300">·</span>
                            <span className="text-[11px] font-semibold text-zinc-600 truncate">
                              {prod.category}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigateToProduct(prod.id)}
                            className="mt-0.5 w-full max-w-full truncate font-display text-sm font-bold text-zinc-950 hover:underline text-left block"
                          >
                            {prod.title}
                          </button>
                          <p className="mt-0.5 text-xs text-zinc-500 truncate">
                            {prod.puffCount} · {prod.nicotineStrength} · {prod.flavorProfile}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5 sm:border-t-0 sm:pt-0 sm:justify-end gap-2.5 shrink-0">
                        <span className="font-mono-num text-sm font-bold text-zinc-950">
                          {formatAED(prod.price)}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleProductStock(prod)}
                            className={`border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                              prod.inStock
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                                : 'border-zinc-300 bg-zinc-100 text-zinc-500'
                            }`}
                          >
                            {prod.inStock ? 'In Stock' : 'Paused'}
                          </button>

                          <button
                            type="button"
                            onClick={() => navigateToProduct(prod.id)}
                            aria-label={`Inspect ${prod.title}`}
                            className="inline-flex h-8 w-8 items-center justify-center border border-zinc-200 text-zinc-700 hover:border-zinc-950 hover:text-zinc-950"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            data-testid={`admin-delete-product-${prod.id}`}
                            onClick={() => adminDeleteProduct(prod.id).catch(reportAdminError)}
                            aria-label={`Delete ${prod.title}`}
                            className="inline-flex h-8 w-8 items-center justify-center border border-zinc-200 text-zinc-600 hover:border-red-600 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS & LIVE COURIER DISPATCH */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="border border-zinc-200 bg-white p-6">
              <h2 className="font-display text-lg font-bold text-zinc-950">
                Live UAE Order Fulfillment & Status Dispatch
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Updating an order stage below immediately updates the customer&apos;s Real-Time Order Tracking timeline and dispatches a Resend status email.
              </p>

              <div className="mt-6 space-y-4">
                {adminOrders.map((ord) => {
                  const steps = buildOrderTimeline(ord.status);
                  return (
                    <div
                      key={ord.orderId}
                      data-testid={`admin-order-card-${ord.orderId}`}
                      className="border border-zinc-200 bg-zinc-50 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono-num text-sm font-bold text-zinc-950">
                              #{ord.orderId}
                            </span>
                            <span className="bg-zinc-950 px-2 py-0.5 text-[11px] font-bold text-white uppercase">
                              {ord.emirate}
                            </span>
                            <span className="border border-zinc-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-zinc-800">
                              {ord.paymentMethod}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-600">
                            Customer: <strong>{ord.fullName}</strong> ({ord.phone}) ·{' '}
                            {ord.address}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-mono-num text-base font-bold text-zinc-950">
                            {formatAED(ord.total)}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            Courier: {ord.courierName}
                          </p>
                        </div>
                      </div>

                      {/* 5 Stage Selector Buttons */}
                      <div className="mt-4">
                        <p className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                          Set Real-Time Courier Stage (Triggers Resend Notification):
                        </p>
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-5">
                          {ORDER_STATUS_SEQUENCE.map((stage, idx) => {
                            const stepInfo = steps.find((s) => s.status === stage);
                            const isActive = ord.status === stage;
                            return (
                              <button
                                key={stage}
                                type="button"
                                data-testid={`admin-set-status-${ord.orderId}-${stage}`}
                                onClick={() => adminUpdateOrderStatus(ord.orderId, stage as OrderStatusStage).catch(reportAdminError)}
                                className={`flex flex-col justify-between border p-2.5 text-left text-xs transition-colors ${
                                  isActive
                                    ? 'border-zinc-950 bg-zinc-950 text-white'
                                    : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-950'
                                }`}
                              >
                                <span className="font-mono-num text-[10px] opacity-75">
                                  Stage {idx + 1}
                                </span>
                                <span className="mt-1 font-bold leading-snug">
                                  {stepInfo?.label || stage}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RESEND TRANSACTIONAL EMAIL CONSOLE */}
        {activeTab === 'emails' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left 5 Cols: Send Manual Resend Dispatch Email */}
            <div className="lg:col-span-5">
              <form
                onSubmit={handleTriggerResendEmail}
                data-testid="admin-resend-email-form"
                className="border border-zinc-200 bg-white p-6 space-y-4"
              >
                <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
                  <Mail className="h-4 w-4 text-zinc-950" />
                  <h2 className="font-display text-base font-bold text-zinc-950">
                    Send Transactional Email via Resend
                  </h2>
                </div>

                <p className="text-xs text-zinc-500">
                  Dispatches formatted HTML order & courier notifications using the server-side Resend SDK and records the delivery in the PostgreSQL <code>email_logs</code> table.
                </p>

                {emailFeedback && (
                  <div
                    data-testid="admin-email-feedback-banner"
                    className="flex items-center gap-2 border border-emerald-600 bg-emerald-50 p-3 text-xs font-bold text-emerald-900"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{emailFeedback}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="resend-order-num"
                    className="block text-xs font-bold text-zinc-900"
                  >
                    Order Number
                  </label>
                  <input
                    id="resend-order-num"
                    type="text"
                    required
                    value={emailOrderNum}
                    onChange={(e) => setEmailOrderNum(e.target.value)}
                    className="mt-1 w-full border border-zinc-300 px-3 py-2 font-mono-num text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="resend-recipient"
                    className="block text-xs font-bold text-zinc-900"
                  >
                    Recipient Email Address
                  </label>
                  <input
                    id="resend-recipient"
                    data-testid="admin-input-resend-email"
                    type="email"
                    required
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    className="mt-1 w-full border border-zinc-300 px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="resend-customer-name"
                    className="block text-xs font-bold text-zinc-900"
                  >
                    Customer Name
                  </label>
                  <input
                    id="resend-customer-name"
                    type="text"
                    value={emailCustomerName}
                    onChange={(e) => setEmailCustomerName(e.target.value)}
                    className="mt-1 w-full border border-zinc-300 px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="resend-status-label"
                    className="block text-xs font-bold text-zinc-900"
                  >
                    Status Milestone Headline
                  </label>
                  <input
                    id="resend-status-label"
                    type="text"
                    value={emailStatusLabel}
                    onChange={(e) => setEmailStatusLabel(e.target.value)}
                    className="mt-1 w-full border border-zinc-300 px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  data-testid="admin-send-resend-btn"
                  disabled={isSendingEmail}
                  className="flex w-full items-center justify-center gap-2 bg-zinc-950 py-3 text-xs font-bold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>
                    {isSendingEmail
                      ? 'Dispatching via Resend...'
                      : 'Dispatch Email via Resend API'}
                  </span>
                </button>
              </form>
            </div>

            {/* Right 7 Cols: Resend Email Logs Table */}
            <div className="lg:col-span-7">
              <div className="border border-zinc-200 bg-white">
                <div className="border-b border-zinc-200 px-6 py-4">
                  <h2 className="font-display text-base font-bold text-zinc-950">
                    Resend Transactional Email Audit Log ({emailLogs.length})
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Every order confirmation and status update is logged with its Resend message ID.
                  </p>
                </div>

                <div className="divide-y divide-zinc-200">
                  {emailLogs.map((log) => (
                    <div
                      key={log.id}
                      data-testid={`admin-email-log-${log.orderNumber}`}
                      className="p-4 text-xs hover:bg-zinc-50"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono-num font-bold text-zinc-950">
                          Order #{log.orderNumber} → {log.recipientEmail}
                        </span>
                        <span className="border border-zinc-300 bg-zinc-100 px-2 py-0.5 font-mono-num text-[10px] font-bold text-zinc-800 uppercase">
                          {log.provider} · {log.deliveryStatus}
                        </span>
                      </div>
                      <p className="mt-1 font-semibold text-zinc-800">{log.subject}</p>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
                        <span className="font-mono-num">ID: {log.resendMessageId}</span>
                        <span>{log.createdAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FULL POSTGRESQL SCHEMA INSPECTOR */}
        {activeTab === 'schema' && (
          <div className="space-y-6">
            <div className="border border-zinc-200 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4">
                <div>
                  <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                    Supabase Postgres + Row Level Security + Supabase Auth
                  </span>
                  <h2 className="mt-1 font-display text-xl font-bold text-zinc-950">
                    Provisioned Relational Schema (7 Production Tables)
                  </h2>
                </div>
                <span className="bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                  Region: asia-southeast1 · Schema Active
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {SCHEMA_TABLES.map((tbl) => (
                  <div
                    key={tbl.tableName}
                    data-testid={`schema-table-${tbl.tableName}`}
                    className="flex flex-col justify-between border border-zinc-200 bg-zinc-50 p-5"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
                        <span className="inline-flex items-center gap-1.5 font-mono-num text-sm font-bold text-zinc-950">
                          <Layers className="h-4 w-4 text-zinc-950" />
                          <span>public.{tbl.tableName}</span>
                        </span>
                        <span className="bg-zinc-950 px-2 py-0.5 font-mono-num text-[10px] font-bold text-white">
                          {tbl.columns.length} cols
                        </span>
                      </div>
                      <p className="mt-2.5 text-xs text-zinc-600">{tbl.description}</p>
                      <ul className="mt-3 space-y-1 border-t border-zinc-200 pt-2.5 font-mono-num text-[11px] text-zinc-800">
                        {tbl.columns.map((c) => (
                          <li key={c} className="truncate">
                            • {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* Production Migration & Catalog Seed SQL Manifest */}
              <div
                data-testid="schema-demo-seed-manifest"
                className="mt-6 border border-zinc-200 bg-zinc-950 p-5 text-white"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                  <div>
                    <p className="text-[11px] font-bold tracking-widest text-emerald-400 uppercase">
                      Supabase Migration &amp; Catalog Pipeline
                    </p>
                    <h3 className="mt-0.5 font-display text-sm font-bold text-white">
                      Provisioned SQL Migrations &amp; Initial Catalog Seed
                    </h3>
                  </div>
                  <span className="font-mono-num text-xs text-zinc-400">
                    npm run seed:generate
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                  <div className="border border-zinc-800 bg-zinc-900 p-3">
                    <p className="font-mono-num font-bold text-emerald-400">
                      supabase/migrations/20261115000000_init.sql
                    </p>
                    <p className="mt-1 text-zinc-400">
                      DDL for profiles, categories, products, orders, order_items, email_logs, newsletter_leads + RLS &amp; place_order() RPC.
                    </p>
                  </div>
                  <div className="border border-zinc-800 bg-zinc-900 p-3">
                    <p className="font-mono-num font-bold text-emerald-400">
                      supabase/migrations/20261115000001_demo_seed.sql
                    </p>
                    <p className="mt-1 text-zinc-400">
                      Initializes UAE orders, normalized order_items, Resend email logs, and customer email RLS policy.
                    </p>
                  </div>
                  <div className="border border-zinc-800 bg-zinc-900 p-3">
                    <p className="font-mono-num font-bold text-emerald-400">
                      supabase/seed.sql
                    </p>
                    <p className="mt-1 text-zinc-400">
                      Idempotent catalog &amp; order seed generated by scripts/generate-seed.ts (4 categories, 8 ESMA products, 3 initial orders).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
