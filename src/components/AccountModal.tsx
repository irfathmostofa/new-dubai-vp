import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  X,
  UserCheck,
  ShieldCheck,
  LogOut,
  Phone,
  Mail,
  Activity,
  LayoutDashboard,
  Clock,
  RefreshCw,
  Package,
  Truck,
  CheckCircle2,
  RotateCcw,
  Radio,
  MapPin,
  Receipt,
  CreditCard,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Search,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import {
  filterOrdersForUserSession,
  formatAED,
  getOrderProgressPercent,
  getOrderStatusLabel,
  getCartItemUnitPrice,
} from '../utils/storeLogic';
import { OrderTrackingTimeline } from './OrderTrackingTimeline';

const UAE_EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain',
] as const;

type Emirate = (typeof UAE_EMIRATES)[number];

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
}

export function AccountModal({ open, onClose }: AccountModalProps) {
  const currentUser = useCartStore((state) => state.currentUser);
  const recentOrders = useCartStore((state) => state.recentOrders);
  const sessionOrderIds = useCartStore((state) => state.sessionOrderIds);
  const isFetchingOrderHistory = useCartStore((state) => state.isFetchingOrderHistory);
  const lastOrderHistorySyncAt = useCartStore((state) => state.lastOrderHistorySyncAt);

  const signInWithGoogle = useCartStore((state) => state.signInWithGoogle);
  const signInWithEmail = useCartStore((state) => state.signInWithEmail);
  const signUpWithEmail = useCartStore((state) => state.signUpWithEmail);
  const updateCustomerProfile = useCartStore((state) => state.updateCustomerProfile);
  const signOutUser = useCartStore((state) => state.signOutUser);
  const navigateToAdmin = useCartStore((state) => state.navigateToAdmin);
  const fetchSessionOrderHistory = useCartStore((state) => state.fetchSessionOrderHistory);
  const lookupOrderByNumberAndEmail = useCartStore((state) => state.lookupOrderByNumberAndEmail);
  const reorderHistoricalOrder = useCartStore((state) => state.reorderHistoricalOrder);

  const sessionOrders = useMemo(
    () => filterOrdersForUserSession(recentOrders, currentUser, sessionOrderIds),
    [recentOrders, currentUser, sessionOrderIds]
  );

  const [activeTab, setActiveTab] = useState<'orders' | 'tracking' | 'profile'>(
    currentUser || sessionOrders.length > 0 ? 'orders' : 'profile'
  );
  const [selectedHistoryOrderId, setSelectedHistoryOrderId] = useState<string>(
    sessionOrders[0]?.orderId || ''
  );
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});

  // Order Lookup State (Tracking tab)
  const [lookupNumber, setLookupNumber] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupSuccess, setLookupSuccess] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Auth Form State
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [emirateInput, setEmirateInput] = useState<Emirate>('Dubai');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Profile Settings Form State (when signed in)
  const [profileName, setProfileName] = useState(currentUser?.displayName || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileEmirate, setProfileEmirate] = useState<Emirate>(
    (currentUser?.emirate as Emirate) || 'Dubai'
  );
  const [profileSaveBanner, setProfileSaveBanner] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Set default tab when modal opens
  useEffect(() => {
    if (open) {
      if (currentUser || sessionOrders.length > 0) {
        setActiveTab('orders');
      } else {
        setActiveTab('profile');
      }
    }
  }, [open, Boolean(currentUser)]);

  // Keep profile edit fields synced with currentUser
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.displayName || '');
      setProfilePhone(currentUser.phone || '');
      setProfileEmirate((currentUser.emirate as Emirate) || 'Dubai');
    }
  }, [currentUser]);

  // Sync order statuses when modal or Order History tab opens
  useEffect(() => {
    if (open && activeTab === 'orders' && (currentUser || sessionOrders.length > 0)) {
      void fetchSessionOrderHistory();
    }
  }, [open, activeTab, currentUser, sessionOrders.length, fetchSessionOrderHistory]);

  // Keep selectedHistoryOrderId valid and auto-expand the primary order when sessionOrders updates
  useEffect(() => {
    if (sessionOrders.length > 0) {
      if (!sessionOrders.some((o) => o.orderId === selectedHistoryOrderId)) {
        const firstId = sessionOrders[0].orderId;
        setSelectedHistoryOrderId(firstId);
        setExpandedOrderIds((prev) => ({ ...prev, [firstId]: true }));
      }
    } else {
      setSelectedHistoryOrderId('');
    }
  }, [sessionOrders, selectedHistoryOrderId]);

  const toggleOrderDetailsExpanded = (orderId: string) => {
    setExpandedOrderIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleInspectOrderTracking = (orderId: string) => {
    setSelectedHistoryOrderId(orderId);
    setExpandedOrderIds((prev) => ({ ...prev, [orderId]: true }));
  };

  const handleOrderLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupSuccess(null);
    setIsLookingUp(true);
    try {
      const res = await lookupOrderByNumberAndEmail(
        lookupNumber,
        lookupEmail || currentUser?.email || ''
      );
      if (res.found && res.order) {
        setSelectedHistoryOrderId(res.order.orderId);
        setExpandedOrderIds((prev) => ({ ...prev, [res.order!.orderId]: true }));
        setLookupSuccess(`Loaded live tracking for Order #${res.order.orderId}`);
      } else {
        setLookupError(res.error || 'Could not find a matching order.');
      }
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthNotice(null);
    setIsSigningIn(true);
    const result = await signInWithGoogle();
    setIsSigningIn(false);
    if (!result.success) {
      setAuthError(result.error || 'Google sign-in failed. Please try again.');
    } else {
      setActiveTab('orders');
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthNotice(null);
    setIsSigningIn(true);
    try {
      if (authMode === 'signup') {
        const result = await signUpWithEmail({
          email: emailInput,
          password: passwordInput,
          name: nameInput,
          phone: phoneInput,
          emirate: emirateInput,
        });
        if (!result.success) {
          setAuthError(result.error || 'Could not create your account.');
        } else if (result.needsEmailConfirmation) {
          setAuthNotice('Account created. Check your inbox and confirm your email, then sign in.');
          setAuthMode('signin');
          setPasswordInput('');
        } else {
          setPasswordInput('');
          setActiveTab('orders');
        }
      } else {
        const result = await signInWithEmail(emailInput, passwordInput);
        if (!result.success) {
          setAuthError(result.error || 'Sign-in failed.');
        } else {
          setPasswordInput('');
          setActiveTab('orders');
        }
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSaveProfileSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSaveBanner(null);
    try {
      const res = await updateCustomerProfile({
        displayName: profileName,
        phone: profilePhone,
        emirate: profileEmirate,
      });
      if (res.success) {
        setProfileSaveBanner('Delivery profile and contact details updated.');
        setTimeout(() => setProfileSaveBanner(null), 4000);
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSignOut = () => {
    signOutUser();
    setActiveTab('profile');
  };

  const totalAccountSpend = useMemo(
    () => sessionOrders.reduce((acc, ord) => acc + ord.total, 0),
    [sessionOrders]
  );

  const activeInTransitCount = useMemo(
    () => sessionOrders.filter((ord) => ord.status !== 'delivered').length,
    [sessionOrders]
  );

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-modal-title"
          data-testid="account-modal"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-950/65 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 max-h-[92vh] w-full max-w-5xl overflow-y-auto border border-zinc-200 bg-white shadow-2xl"
          >
            {/* Modal Top Header */}
            <div className="sticky top-0 z-20 flex items-start sm:items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3.5 sm:px-6 sm:py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                  <span>Vape Dubai King · Customer Account</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {currentUser
                      ? `Signed in as ${currentUser.email}`
                      : 'Sign In & Live UAE Order Tracking'}
                  </span>
                </div>
                <h2
                  id="account-modal-title"
                  className="font-display text-base sm:text-xl font-bold text-zinc-950 leading-snug"
                >
                  {currentUser
                    ? `Welcome back, ${currentUser.displayName}`
                    : 'Customer Account, Invoices & Live UAE Courier Tracking'}
                </h2>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {currentUser?.role === 'admin' && (
                  <a
                    href="/admin"
                    data-testid="account-open-admin-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      onClose();
                      navigateToAdmin();
                    }}
                    className="inline-flex items-center gap-1.5 border border-zinc-950 bg-zinc-950 px-2.5 py-2 sm:px-3 text-xs font-bold text-white transition-colors hover:bg-zinc-800 whitespace-nowrap"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
                    <span>Admin Console</span>
                  </a>
                )}
                {currentUser && (
                  <button
                    type="button"
                    data-testid="header-signout-btn"
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-1.5 border border-zinc-200 bg-white px-2.5 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-950 hover:text-zinc-950 whitespace-nowrap"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close account modal"
                  className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-950 hover:text-white shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs inside Account Modal */}
            <div
              role="tablist"
              aria-label="Account modal tabs"
              className="flex overflow-x-auto no-scrollbar border-b border-zinc-200 bg-zinc-50 px-4 sm:px-6"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'orders'}
                data-testid="account-tab-orders"
                onClick={() => setActiveTab('orders')}
                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 sm:px-4 py-3 text-xs font-bold transition-colors whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'border-zinc-950 text-zinc-950'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Package className="h-3.5 w-3.5 shrink-0" />
                <span>My Orders & Invoices</span>
                <span
                  data-testid="order-history-count-badge"
                  className="font-mono-num bg-zinc-950 px-1.5 py-0.5 text-[10px] font-bold text-white"
                >
                  {sessionOrders.length}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'tracking'}
                data-testid="account-tab-tracking"
                onClick={() => setActiveTab('tracking')}
                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 sm:px-4 py-3 text-xs font-bold transition-colors whitespace-nowrap ${
                  activeTab === 'tracking'
                    ? 'border-zinc-950 text-zinc-950'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Activity className="h-3.5 w-3.5 shrink-0" />
                <span>Track an Order</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'profile'}
                data-testid="account-tab-profile"
                onClick={() => setActiveTab('profile')}
                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 sm:px-4 py-3 text-xs font-bold transition-colors whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'border-zinc-950 text-zinc-950'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {currentUser
                    ? `Account Settings (${currentUser.displayName})`
                    : 'Sign In / Register'}
                </span>
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* TAB 1: Order History + Full Order Details Breakdown + Real-Time Tracking */}
              {activeTab === 'orders' && (
                <div data-testid="order-history-panel" className="space-y-5">
                  {sessionOrders.length === 0 ? (
                    <div
                      data-testid="order-history-empty-state"
                      className="border border-zinc-200 bg-zinc-50 p-6 sm:p-8 text-center space-y-4"
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center border border-zinc-950 bg-zinc-950 text-white">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="space-y-1.5 max-w-md mx-auto">
                        <h3 className="font-display text-base font-bold text-zinc-950">
                          {currentUser
                            ? 'No UAE Orders Placed Yet'
                            : 'Sign In to View Your Order History & Tax Invoices'}
                        </h3>
                        <p className="text-xs leading-relaxed text-zinc-600">
                          {currentUser
                            ? 'Once you place a Cash on Delivery or Card Link order, your itemized ESMA invoice and live 5-stage Dubai courier tracking will appear here.'
                            : 'Sign in with your account email to access your saved UAE orders, itemized tax invoices, and live courier dispatch tracking — or look up an individual order by number.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                        {!currentUser && (
                          <button
                            type="button"
                            data-testid="empty-orders-signin-btn"
                            onClick={() => setActiveTab('profile')}
                            className="inline-flex items-center gap-2 bg-zinc-950 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-zinc-800"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Sign In / Create Account</span>
                          </button>
                        )}
                        <button
                          type="button"
                          data-testid="empty-orders-track-btn"
                          onClick={() => setActiveTab('tracking')}
                          className="inline-flex items-center gap-2 border border-zinc-950 bg-white px-5 py-2.5 text-xs font-bold text-zinc-950 transition-colors hover:bg-zinc-950 hover:text-white"
                        >
                          <Search className="h-3.5 w-3.5" />
                          <span>Track Order by Number</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Customer Account Status & Sync Bar */}
                      <div className="flex flex-col gap-3 border border-zinc-200 bg-zinc-950 p-4 text-white sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 px-2 py-0.5 font-mono-num text-[10px] font-bold text-emerald-300 uppercase">
                              <Radio className="h-2.5 w-2.5" />
                              <span>{currentUser ? 'Verified Account' : 'Active Session Orders'}</span>
                            </span>
                            <span
                              data-testid="order-history-session-id"
                              className="font-mono-num text-xs font-bold text-zinc-200 truncate"
                            >
                              {currentUser
                                ? `${currentUser.displayName} (${currentUser.email})`
                                : 'Guest Order Tracking'}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-zinc-400">
                            {`${sessionOrders.length} UAE ${sessionOrders.length === 1 ? 'order' : 'orders'} (${activeInTransitCount} in transit · Total ${formatAED(totalAccountSpend)})`}
                            {lastOrderHistorySyncAt ? ` · Updated ${lastOrderHistorySyncAt}` : ''}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {!currentUser && (
                            <button
                              type="button"
                              onClick={() => setActiveTab('profile')}
                              className="inline-flex items-center gap-1.5 border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[11px] font-bold text-zinc-200 transition-colors hover:border-white hover:text-white whitespace-nowrap"
                            >
                              <span>Sign In / Register</span>
                            </button>
                          )}

                          <button
                            type="button"
                            data-testid="refresh-order-history-btn"
                            disabled={isFetchingOrderHistory}
                            onClick={() => void fetchSessionOrderHistory()}
                            className="inline-flex items-center gap-1.5 border border-white bg-white px-3 py-1.5 text-[11px] font-bold text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-60 whitespace-nowrap"
                          >
                            <RefreshCw
                              className={`h-3 w-3 ${isFetchingOrderHistory ? 'animate-spin' : ''}`}
                            />
                            <span>
                              {isFetchingOrderHistory ? 'Syncing...' : 'Refresh Status'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Order History Cards List with Expandable Order Details */}
                      <div data-testid="order-history-list" className="space-y-4">
                        {sessionOrders.map((order) => {
                          const isSelected = order.orderId === selectedHistoryOrderId;
                          const isExpanded = Boolean(expandedOrderIds[order.orderId]);
                          const progress = getOrderProgressPercent(order.status);
                          const statusLabel = getOrderStatusLabel(order.status);
                          const isDelivered = order.status === 'delivered';
                          const activeMilestone =
                            order.timeline?.find((t) => t.current) ||
                            order.timeline?.[order.timeline.length - 1];

                          return (
                            <div
                              key={order.orderId}
                              data-testid={`order-history-card-${order.orderId}`}
                              className={`border transition-colors ${
                                isSelected
                                  ? 'border-zinc-950 bg-white shadow-sm'
                                  : 'border-zinc-200 bg-zinc-50/70 hover:border-zinc-400'
                              }`}
                            >
                              {/* Card Top Summary Bar */}
                              <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono-num text-sm font-bold text-zinc-950">
                                      Order #{order.orderId}
                                    </span>
                                    <span
                                      data-testid={`order-history-status-${order.orderId}`}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase ${
                                        isDelivered
                                          ? 'bg-emerald-100 text-emerald-900'
                                          : 'bg-zinc-950 text-white'
                                      }`}
                                    >
                                      {isDelivered ? (
                                        <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                                      ) : (
                                        <Truck className="h-3 w-3 text-emerald-400" />
                                      )}
                                      <span>{statusLabel}</span>
                                    </span>
                                    <span className="font-mono-num text-[11px] font-semibold text-zinc-500">
                                      ({progress}% Complete)
                                    </span>
                                  </div>

                                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600">
                                    <span className="inline-flex items-center gap-1">
                                      <Clock className="h-3 w-3 text-zinc-400" />
                                      <span>{order.createdAt}</span>
                                    </span>
                                    <span className="text-zinc-300" aria-hidden="true">·</span>
                                    <span className="inline-flex items-center gap-1">
                                      <MapPin className="h-3 w-3 text-zinc-400" />
                                      <span className="truncate max-w-xs">
                                        {order.emirate} — {order.address}
                                      </span>
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end shrink-0">
                                  <div className="text-left sm:text-right">
                                    <p className="font-mono-num text-sm font-bold text-zinc-950">
                                      {formatAED(order.total)}
                                    </p>
                                    <p className="text-[11px] text-zinc-500">
                                      {order.paymentMethod}
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <button
                                      type="button"
                                      data-testid={`account-order-details-toggle-${order.orderId}`}
                                      onClick={() => toggleOrderDetailsExpanded(order.orderId)}
                                      className="inline-flex items-center gap-1 border border-zinc-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-zinc-900 transition-colors hover:border-zinc-950 whitespace-nowrap"
                                    >
                                      <Receipt className="h-3 w-3" />
                                      <span>{isExpanded ? 'Hide Details' : 'Order Details'}</span>
                                      {isExpanded ? (
                                        <ChevronUp className="h-3 w-3" />
                                      ) : (
                                        <ChevronDown className="h-3 w-3" />
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      data-testid={`history-select-order-${order.orderId}`}
                                      onClick={() => handleInspectOrderTracking(order.orderId)}
                                      className={`px-2.5 py-1.5 text-[11px] font-bold transition-colors whitespace-nowrap ${
                                        isSelected
                                          ? 'bg-zinc-950 text-white'
                                          : 'border border-zinc-300 bg-white text-zinc-900 hover:border-zinc-950'
                                      }`}
                                    >
                                      {isSelected ? 'Tracking Below' : 'Track Order'}
                                    </button>

                                    <button
                                      type="button"
                                      data-testid={`history-reorder-${order.orderId}`}
                                      onClick={() => {
                                        reorderHistoricalOrder(order.orderId);
                                        onClose();
                                      }}
                                      title="Add items from this order to cart"
                                      className="inline-flex items-center gap-1 border border-zinc-200 bg-zinc-100 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-800 transition-colors hover:bg-zinc-950 hover:text-white whitespace-nowrap"
                                    >
                                      <RotateCcw className="h-3 w-3" />
                                      <span>Reorder</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Ordered Line Items Strip */}
                              <div className="px-4 py-3 bg-white">
                                <div className="flex flex-wrap items-center gap-2.5">
                                  {order.items.map((item, idx) => {
                                    const unitPrice = getCartItemUnitPrice(item);
                                    return (
                                      <div
                                        key={`${order.orderId}-item-${idx}`}
                                        className="flex items-center gap-2.5 border border-zinc-200 bg-zinc-50/60 px-2.5 py-1.5 text-xs"
                                      >
                                        <img
                                          src={item.product.image}
                                          alt={item.product.title}
                                          referrerPolicy="no-referrer"
                                          className="h-9 w-9 shrink-0 border border-zinc-200 bg-white object-cover"
                                        />
                                        <div className="min-w-0">
                                          <p className="font-semibold text-zinc-900 truncate max-w-[210px]">
                                            {item.quantity}× {item.product.title}
                                          </p>
                                          <p className="text-[10px] text-zinc-500">
                                            {item.selectedVariant?.flavor || item.product.flavorProfile}{' '}
                                            ·{' '}
                                            {item.selectedVariant?.nicotine ||
                                              item.product.nicotineStrength}{' '}
                                            ·{' '}
                                            <span className="font-mono-num font-semibold text-zinc-800">
                                              {formatAED(unitPrice * item.quantity)}
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Expandable Comprehensive Order Details & Courier Dispatch Breakdown */}
                              {isExpanded && (
                                <div
                                  data-testid={`order-details-expanded-${order.orderId}`}
                                  className="border-t border-zinc-200 bg-zinc-50 p-4 space-y-4 text-xs"
                                >
                                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    {/* 1. Recipient & Delivery Destination */}
                                    <div className="border border-zinc-200 bg-white p-3.5 space-y-1.5">
                                      <p className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                                        Recipient & Delivery Address
                                      </p>
                                      <p className="font-bold text-zinc-950">{order.fullName}</p>
                                      <p className="text-zinc-600">{order.address}</p>
                                      <p className="text-zinc-600">
                                        {order.emirate}, United Arab Emirates
                                      </p>
                                      <p className="font-mono-num text-[11px] text-zinc-500 pt-1">
                                        {order.phone} {order.email ? `· ${order.email}` : ''}
                                      </p>
                                    </div>

                                    {/* 2. Assigned Courier & Live Dispatch Telemetry */}
                                    <div className="border border-zinc-200 bg-white p-3.5 space-y-1.5">
                                      <p className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                                        Assigned UAE Express Courier
                                      </p>
                                      <p className="font-bold text-zinc-950">{order.courierName}</p>
                                      <p className="text-zinc-600">
                                        ETA:{' '}
                                        <span className="font-semibold text-zinc-900">
                                          {order.estimatedArrival}
                                        </span>
                                      </p>
                                      {activeMilestone && (
                                        <p className="text-[11px] text-zinc-500 pt-1">
                                          Current Hub: {activeMilestone.location} (
                                          {activeMilestone.timestamp})
                                        </p>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedHistoryOrderId(order.orderId);
                                          setActiveTab('tracking');
                                        }}
                                        className="inline-flex items-center gap-1 pt-1 text-[11px] font-bold text-zinc-950 underline underline-offset-4 hover:text-zinc-700"
                                      >
                                        <span>Open Dedicated Tracking View</span>
                                        <ArrowRight className="h-3 w-3" />
                                      </button>
                                    </div>

                                    {/* 3. Financial Summary & COD Invoice Breakdown */}
                                    <div className="border border-zinc-200 bg-white p-3.5 space-y-1.5">
                                      <p className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                                        Payment & Invoice Breakdown
                                      </p>
                                      <div className="flex items-center justify-between text-zinc-600">
                                        <span>Items Subtotal ({order.items.length} lines)</span>
                                        <span className="font-mono-num font-semibold text-zinc-900">
                                          {formatAED(order.subtotal)}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between text-zinc-600">
                                        <span>UAE Same-Day Courier</span>
                                        <span className="font-mono-num font-semibold text-zinc-900">
                                          {order.shippingFee === 0
                                            ? 'FREE'
                                            : formatAED(order.shippingFee)}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between border-t border-zinc-200 pt-1.5 font-bold text-zinc-950">
                                        <span>Total ({order.paymentMethod})</span>
                                        <span className="font-mono-num text-sm">
                                          {formatAED(order.total)}
                                        </span>
                                      </div>
                                      <p className="flex items-center gap-1 text-[10px] text-zinc-500 pt-0.5">
                                        <CreditCard className="h-3 w-3 shrink-0" />
                                        <span>ESMA 100% Excise Tax Included</span>
                                      </p>
                                    </div>
                                  </div>

                                  {/* Itemized Line-Item Table */}
                                  <div className="border border-zinc-200 bg-white overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                      <thead>
                                        <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                                          <th className="py-2 px-3">Hardware / E-Liquid SKU</th>
                                          <th className="py-2 px-3">Selected Flavour & Nicotine</th>
                                          <th className="py-2 px-3">Pack Tier</th>
                                          <th className="py-2 px-3 text-right">Qty</th>
                                          <th className="py-2 px-3 text-right">Unit Price</th>
                                          <th className="py-2 px-3 text-right">Line Total</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-zinc-200 text-xs">
                                        {order.items.map((line, lineIdx) => {
                                          const unitPrice = getCartItemUnitPrice(line);
                                          return (
                                            <tr key={`${order.orderId}-row-${lineIdx}`}>
                                              <td className="py-2.5 px-3 font-semibold text-zinc-950">
                                                {line.product.title}
                                              </td>
                                              <td className="py-2.5 px-3 text-zinc-600">
                                                {line.selectedVariant?.flavor ||
                                                  line.product.flavorProfile}{' '}
                                                ·{' '}
                                                {line.selectedVariant?.nicotine ||
                                                  line.product.nicotineStrength}
                                              </td>
                                              <td className="py-2.5 px-3 text-zinc-600">
                                                {line.selectedVariant?.packLabel || 'Single Unit (1x)'}
                                              </td>
                                              <td className="py-2.5 px-3 text-right font-mono-num font-semibold text-zinc-900">
                                                {line.quantity}
                                              </td>
                                              <td className="py-2.5 px-3 text-right font-mono-num text-zinc-600">
                                                {formatAED(unitPrice)}
                                              </td>
                                              <td className="py-2.5 px-3 text-right font-mono-num font-bold text-zinc-950">
                                                {formatAED(unitPrice * line.quantity)}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Embedded Real-Time Timeline Linked to Selected Order */}
                      <div
                        data-testid="order-history-timeline-wrapper"
                        className="space-y-2 pt-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h3 className="font-display text-sm font-bold text-zinc-950">
                              Live Dispatch Status Timeline — Order #{selectedHistoryOrderId}
                            </h3>
                            <p className="text-xs text-zinc-500">
                              5-stage Dubai fulfillment and courier progression for your selected order.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('tracking')}
                            className="text-xs font-bold text-zinc-950 underline underline-offset-4 hover:text-zinc-700"
                          >
                            Look Up Another Order by Number
                          </button>
                        </div>

                        <OrderTrackingTimeline
                          selectedOrderId={selectedHistoryOrderId}
                          orders={sessionOrders}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 2: Live Order Status Tracking + Direct Order # Lookup */}
              {activeTab === 'tracking' && (
                <div className="space-y-5">
                  {/* Direct Order Number + Email Lookup Bar */}
                  <form
                    onSubmit={handleOrderLookupSubmit}
                    data-testid="order-lookup-form"
                    className="border border-zinc-200 bg-zinc-50 p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-display text-sm font-bold text-zinc-950">
                          Track Any UAE Order by Number & Email
                        </h3>
                        <p className="text-xs text-zinc-500">
                          Enter your Order ID from your confirmation receipt and checkout email address to view live courier stages.
                        </p>
                      </div>
                    </div>

                    {lookupError && (
                      <p
                        role="alert"
                        className="border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-900"
                      >
                        {lookupError}
                      </p>
                    )}
                    {lookupSuccess && (
                      <p className="border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">
                        {lookupSuccess}
                      </p>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                      <div className="sm:col-span-4">
                        <label htmlFor="track-order-number" className="sr-only">
                          Order Number
                        </label>
                        <input
                          id="track-order-number"
                          data-testid="input-lookup-order-number"
                          type="text"
                          required
                          value={lookupNumber}
                          onChange={(e) => setLookupNumber(e.target.value)}
                          placeholder="Order # (e.g. VDK-892410)"
                          className="w-full border border-zinc-300 bg-white px-3 py-2 font-mono-num text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <label htmlFor="track-order-email" className="sr-only">
                          Checkout Email Address
                        </label>
                        <input
                          id="track-order-email"
                          data-testid="input-lookup-order-email"
                          type="email"
                          required
                          value={lookupEmail || currentUser?.email || ''}
                          onChange={(e) => setLookupEmail(e.target.value)}
                          placeholder="Checkout email address"
                          className="w-full border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <button
                          type="submit"
                          data-testid="btn-lookup-order-submit"
                          disabled={isLookingUp}
                          className="flex w-full items-center justify-center gap-1.5 bg-zinc-950 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                        >
                          <Search className="h-3.5 w-3.5" />
                          <span>{isLookingUp ? 'Searching...' : 'Track Order'}</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  <OrderTrackingTimeline
                    selectedOrderId={selectedHistoryOrderId}
                    orders={sessionOrders}
                  />
                </div>
              )}

              {/* TAB 3: Customer Authentication & Account Settings */}
              {activeTab === 'profile' && (
                <div className="space-y-5">
                  {currentUser ? (
                    <div
                      data-testid="authenticated-customer-dashboard"
                      className="space-y-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 border border-zinc-200 bg-zinc-950 p-5 text-white">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-12 w-12 items-center justify-center border border-zinc-700 bg-zinc-900 text-white font-display font-bold text-base">
                            {currentUser.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-display text-base font-bold text-white">
                                {currentUser.displayName}
                              </p>
                              <span className="bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 uppercase">
                                Verified {currentUser.role}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-zinc-300">
                              {currentUser.email}
                              {currentUser.phone ? ` · ${currentUser.phone}` : ''}
                              {currentUser.emirate ? ` · ${currentUser.emirate}, UAE` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            data-testid="profile-view-orders-btn"
                            onClick={() => setActiveTab('orders')}
                            className="inline-flex items-center gap-1.5 bg-white px-3.5 py-2 text-xs font-bold text-zinc-950 transition-colors hover:bg-zinc-200"
                          >
                            <Package className="h-3.5 w-3.5" />
                            <span>View Orders ({sessionOrders.length})</span>
                          </button>

                          <button
                            type="button"
                            data-testid="signout-user-btn"
                            onClick={handleSignOut}
                            className="inline-flex items-center gap-1.5 border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:border-white hover:text-white"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>

                      {/* Customer Account KPI Summary Cards */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="border border-zinc-200 bg-zinc-50 p-4">
                          <p className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                            Total UAE Orders
                          </p>
                          <p className="mt-1 font-mono-num text-xl font-bold text-zinc-950">
                            {sessionOrders.length} Orders
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            Synced with {currentUser.email}
                          </p>
                        </div>

                        <div className="border border-zinc-200 bg-zinc-50 p-4">
                          <p className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                            Active Dispatch
                          </p>
                          <p className="mt-1 font-mono-num text-xl font-bold text-zinc-950">
                            {activeInTransitCount} In Transit
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            Al Quoz hub & bike courier dispatch
                          </p>
                        </div>

                        <div className="border border-zinc-200 bg-zinc-50 p-4">
                          <p className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                            Lifetime Spend
                          </p>
                          <p className="mt-1 font-mono-num text-xl font-bold text-zinc-950">
                            {formatAED(totalAccountSpend)}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            Cash & Card Link on Delivery
                          </p>
                        </div>
                      </div>

                      {/* Delivery & Contact Preferences Form */}
                      <form
                        onSubmit={handleSaveProfileSettings}
                        data-testid="profile-settings-form"
                        className="border border-zinc-200 bg-white p-5 space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3">
                          <div>
                            <h3 className="font-display text-sm font-bold text-zinc-950">
                              Delivery & Contact Preferences
                            </h3>
                            <p className="text-xs text-zinc-500">
                              Saved details are automatically pre-filled during UAE Cash on Delivery checkout.
                            </p>
                          </div>
                          {profileSaveBanner && (
                            <span
                              data-testid="profile-saved-banner"
                              className="inline-flex items-center gap-1.5 border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                              <span>{profileSaveBanner}</span>
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div>
                            <label
                              htmlFor="profile-edit-name"
                              className="block text-xs font-semibold text-zinc-900"
                            >
                              Full Name
                            </label>
                            <input
                              id="profile-edit-name"
                              data-testid="input-profile-name"
                              type="text"
                              required
                              value={profileName}
                              onChange={(e) => setProfileName(e.target.value)}
                              className="mt-1 w-full border border-zinc-300 px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="profile-edit-phone"
                              className="block text-xs font-semibold text-zinc-900"
                            >
                              UAE Mobile Number
                            </label>
                            <input
                              id="profile-edit-phone"
                              data-testid="input-profile-phone"
                              type="tel"
                              required
                              value={profilePhone}
                              onChange={(e) => setProfilePhone(e.target.value)}
                              placeholder="+971 50 000 0000"
                              className="mt-1 w-full border border-zinc-300 px-3 py-2 font-mono-num text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="profile-edit-emirate"
                              className="block text-xs font-semibold text-zinc-900"
                            >
                              Default Delivery Emirate
                            </label>
                            <select
                              id="profile-edit-emirate"
                              data-testid="select-profile-emirate"
                              value={profileEmirate}
                              onChange={(e) => setProfileEmirate(e.target.value as Emirate)}
                              className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-950 focus:border-zinc-950 focus:outline-none"
                            >
                              {UAE_EMIRATES.map((em) => (
                                <option key={em} value={em}>
                                  {em}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="submit"
                            data-testid="btn-save-profile"
                            disabled={isSavingProfile}
                            className="inline-flex items-center gap-2 bg-zinc-950 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                          >
                            <span>{isSavingProfile ? 'Saving...' : 'Save Preferences'}</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                      {/* Left 7 Cols: Production Email & Password Sign In / Create Account + Google OAuth */}
                      <div className="md:col-span-7 border border-zinc-200 bg-white p-5 sm:p-6 space-y-5">
                        {/* Segmented Auth Mode Switcher */}
                        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                          <div>
                            <p className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">
                              Customer Authentication
                            </p>
                            <h3 className="mt-0.5 font-display text-lg font-bold text-zinc-950">
                              {authMode === 'signin'
                                ? 'Sign In to Your Account'
                                : 'Create Your UAE Customer Account'}
                            </h3>
                          </div>
                          <button
                            type="button"
                            data-testid="auth-mode-toggle-btn"
                            onClick={() => {
                              setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                              setAuthError(null);
                              setAuthNotice(null);
                            }}
                            className="border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-950 transition-colors hover:border-zinc-950"
                          >
                            {authMode === 'signin' ? 'Create Account' : 'Sign In Instead'}
                          </button>
                        </div>

                        {authNotice && (
                          <p className="border border-emerald-300 bg-emerald-50 p-3 text-xs font-medium text-emerald-900">
                            {authNotice}
                          </p>
                        )}
                        {authError && (
                          <p
                            role="alert"
                            className="border border-red-300 bg-red-50 p-3 text-xs font-medium text-red-900"
                          >
                            {authError}
                          </p>
                        )}

                        <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
                          {authMode === 'signup' && (
                            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                              <div>
                                <label
                                  htmlFor="account-name"
                                  className="block text-xs font-semibold text-zinc-900"
                                >
                                  Full Name
                                </label>
                                <input
                                  id="account-name"
                                  type="text"
                                  required
                                  autoComplete="name"
                                  value={nameInput}
                                  onChange={(e) => setNameInput(e.target.value)}
                                  placeholder="Full name for delivery"
                                  className="mt-1 w-full border border-zinc-300 px-3 py-2.5 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor="account-emirate"
                                  className="block text-xs font-semibold text-zinc-900"
                                >
                                  UAE Emirate
                                </label>
                                <select
                                  id="account-emirate"
                                  value={emirateInput}
                                  onChange={(e) => setEmirateInput(e.target.value as Emirate)}
                                  className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-950 focus:border-zinc-950 focus:outline-none"
                                >
                                  {UAE_EMIRATES.map((em) => (
                                    <option key={em} value={em}>
                                      {em}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}

                          <div>
                            <label
                              htmlFor="account-email"
                              className="block text-xs font-semibold text-zinc-900"
                            >
                              Email Address
                            </label>
                            <div className="relative mt-1">
                              <Mail className="pointer-events-none absolute top-2.5 left-3 h-3.5 w-3.5 text-zinc-400" />
                              <input
                                id="account-email"
                                data-testid="input-account-email"
                                type="email"
                                required
                                autoComplete="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full border border-zinc-300 py-2.5 pr-3 pl-9 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                              />
                            </div>
                          </div>

                          {authMode === 'signup' && (
                            <div>
                              <label
                                htmlFor="account-phone"
                                className="block text-xs font-semibold text-zinc-900"
                              >
                                UAE Mobile Number
                              </label>
                              <div className="relative mt-1">
                                <Phone className="pointer-events-none absolute top-2.5 left-3 h-3.5 w-3.5 text-zinc-400" />
                                <input
                                  id="account-phone"
                                  type="tel"
                                  required
                                  autoComplete="tel"
                                  value={phoneInput}
                                  onChange={(e) => setPhoneInput(e.target.value)}
                                  placeholder="+971 50 000 0000"
                                  className="w-full border border-zinc-300 py-2.5 pr-3 pl-9 font-mono-num text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                                />
                              </div>
                            </div>
                          )}

                          <div>
                            <label
                              htmlFor="account-password"
                              className="block text-xs font-semibold text-zinc-900"
                            >
                              Password
                            </label>
                            <div className="relative mt-1">
                              <Lock className="pointer-events-none absolute top-2.5 left-3 h-3.5 w-3.5 text-zinc-400" />
                              <input
                                id="account-password"
                                data-testid="input-account-password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                autoComplete={
                                  authMode === 'signin' ? 'current-password' : 'new-password'
                                }
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                placeholder="Minimum 6 characters"
                                className="w-full border border-zinc-300 py-2.5 pr-9 pl-9 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400 hover:text-zinc-900"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            data-testid="express-signin-submit-btn"
                            disabled={isSigningIn}
                            className="w-full border border-zinc-950 bg-zinc-950 py-3 text-xs font-bold tracking-wider text-white uppercase transition-colors hover:bg-zinc-800 disabled:opacity-50"
                          >
                            {isSigningIn
                              ? 'Authenticating...'
                              : authMode === 'signin'
                                ? 'Sign In & View My Orders'
                                : 'Create Account & Continue'}
                          </button>
                        </form>

                        <div className="relative py-1">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-200" />
                          </div>
                          <div className="relative flex justify-center">
                            <span className="bg-white px-3 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                              Or Continue With
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          data-testid="google-signin-btn"
                          disabled={isSigningIn}
                          onClick={handleGoogleSignIn}
                          className="flex w-full items-center justify-center gap-2 border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold text-zinc-950 transition-colors hover:border-zinc-950 hover:bg-zinc-50 disabled:opacity-50"
                        >
                          <ShieldCheck className="h-4 w-4 text-zinc-950" />
                          <span>
                            {isSigningIn ? 'Connecting...' : 'Continue with Google'}
                          </span>
                        </button>
                      </div>

                      {/* Right 5 Cols: Member Benefits & Guest Order Lookup */}
                      <div className="md:col-span-5 flex flex-col justify-between border border-zinc-200 bg-zinc-50 p-5 sm:p-6 space-y-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                              Vape Dubai King Membership
                            </p>
                            <h4 className="mt-1 font-display text-base font-bold text-zinc-950">
                              Everything Included With Your UAE Account
                            </h4>
                          </div>

                          <ul className="space-y-3.5 text-xs text-zinc-600">
                            <li className="flex items-start gap-2.5">
                              <Truck className="h-4 w-4 shrink-0 text-zinc-950 mt-0.5" />
                              <div>
                                <p className="font-bold text-zinc-950">
                                  5-Stage Live UAE Courier Tracking
                                </p>
                                <p className="mt-0.5 leading-relaxed">
                                  Follow your order from ESMA excise verification at our Al Quoz hub to your doorstep bike courier.
                                </p>
                              </div>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <Receipt className="h-4 w-4 shrink-0 text-zinc-950 mt-0.5" />
                              <div>
                                <p className="font-bold text-zinc-950">
                                  Itemized Invoices & Order Details
                                </p>
                                <p className="mt-0.5 leading-relaxed">
                                  Inspect full SKU breakdowns, selected flavours, nicotine strengths, and Cash or Card Link receipts.
                                </p>
                              </div>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <RotateCcw className="h-4 w-4 shrink-0 text-zinc-950 mt-0.5" />
                              <div>
                                <p className="font-bold text-zinc-950">
                                  One-Click Reorder & Express Checkout
                                </p>
                                <p className="mt-0.5 leading-relaxed">
                                  Save your UAE mobile number and default Emirate for faster same-day Cash on Delivery checkout.
                                </p>
                              </div>
                            </li>
                          </ul>
                        </div>

                        <div className="border-t border-zinc-200 pt-4 space-y-2.5">
                          <p className="text-xs font-bold text-zinc-950">
                            Placed an Order as a Guest?
                          </p>
                          <p className="text-xs text-zinc-600 leading-relaxed">
                            You can track any UAE dispatch without signing in using your Order Number and checkout email address.
                          </p>
                          <button
                            type="button"
                            data-testid="guest-switch-to-tracking-btn"
                            onClick={() => setActiveTab('tracking')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-950 underline underline-offset-4 hover:text-zinc-700"
                          >
                            <span>Track a Guest Order by Number</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
