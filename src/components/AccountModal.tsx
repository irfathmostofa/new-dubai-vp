import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  X,
  UserCheck,
  Shield,
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
  SkipForward,
  Radio,
  MapPin,
  Receipt,
  CreditCard,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  User,
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

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
}

export function AccountModal({ open, onClose }: AccountModalProps) {
  const currentUser = useCartStore((state) => state.currentUser);
  const recentOrders = useCartStore((state) => state.recentOrders);
  const sessionOrderIds = useCartStore((state) => state.sessionOrderIds);
  const userSessionId = useCartStore((state) => state.userSessionId);
  const isFetchingOrderHistory = useCartStore((state) => state.isFetchingOrderHistory);
  const lastOrderHistorySyncAt = useCartStore((state) => state.lastOrderHistorySyncAt);

  const signInWithGoogle = useCartStore((state) => state.signInWithGoogle);
  const signInWithEmail = useCartStore((state) => state.signInWithEmail);
  const signUpWithEmail = useCartStore((state) => state.signUpWithEmail);
  const signInDemoCustomer = useCartStore((state) => state.signInDemoCustomer);
  const signOutUser = useCartStore((state) => state.signOutUser);
  const navigateToAdmin = useCartStore((state) => state.navigateToAdmin);
  const fetchSessionOrderHistory = useCartStore((state) => state.fetchSessionOrderHistory);
  const tickSessionOrderHistoryStatus = useCartStore(
    (state) => state.tickSessionOrderHistoryStatus
  );
  const reorderHistoricalOrder = useCartStore((state) => state.reorderHistoricalOrder);

  const [activeTab, setActiveTab] = useState<'orders' | 'tracking' | 'profile'>('orders');
  const [selectedHistoryOrderId, setSelectedHistoryOrderId] = useState<string>(
    recentOrders[0]?.orderId || 'VDK-892410'
  );
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({
    'VDK-892410': true,
  });
  const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(false);

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const sessionOrders = useMemo(
    () => filterOrdersForUserSession(recentOrders, currentUser, sessionOrderIds),
    [recentOrders, currentUser, sessionOrderIds]
  );

  // Fetch real-time order statuses linked to the user session when modal or Order History tab opens
  useEffect(() => {
    if (open && activeTab === 'orders') {
      fetchSessionOrderHistory();
    }
  }, [open, activeTab, fetchSessionOrderHistory]);

  // Keep selectedHistoryOrderId valid when sessionOrders updates
  useEffect(() => {
    if (
      sessionOrders.length > 0 &&
      !sessionOrders.some((o) => o.orderId === selectedHistoryOrderId)
    ) {
      setSelectedHistoryOrderId(sessionOrders[0].orderId);
    }
  }, [sessionOrders, selectedHistoryOrderId]);

  // Optional live status stream interval for real-time mock updates across the selected session order
  useEffect(() => {
    if (!open || !isLiveStreamActive) return;
    const timer = setInterval(() => {
      tickSessionOrderHistoryStatus(selectedHistoryOrderId);
    }, 2200);
    return () => clearInterval(timer);
  }, [open, isLiveStreamActive, selectedHistoryOrderId, tickSessionOrderHistoryStatus]);

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

  const handleQuickDemoCustomerLogin = () => {
    setAuthError(null);
    setAuthNotice(null);
    signInDemoCustomer({
      email: 'tariq.almaktoum@dubai.ae',
      name: 'Tariq Al Maktoum',
      phone: '+971 50 842 9910',
      emirate: 'Dubai',
    });
    setSelectedHistoryOrderId('VDK-892410');
    setExpandedOrderIds((prev) => ({ ...prev, 'VDK-892410': true }));
    setActiveTab('orders');
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

  const handleSignOut = () => {
    signOutUser();
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
                  <span>UAE Customer Account</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {currentUser
                      ? `Verified Member (${currentUser.email})`
                      : 'Guest Session Active'}
                  </span>
                </div>
                <h2
                  id="account-modal-title"
                  className="font-display text-base sm:text-xl font-bold text-zinc-950 leading-snug"
                >
                  Account, Order Details & Real-Time Dispatch Tracking
                </h2>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
                  <span className="hidden sm:inline">Admin Portal (/admin)</span>
                  <span className="sm:hidden">/admin</span>
                </a>
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
                <span>Order History & Details</span>
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
                <span>Real-Time Order Tracking</span>
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
                  {currentUser ? `Account (${currentUser.displayName})` : 'Customer Sign In'}
                </span>
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* TAB 1: Order History + Full Order Details Breakdown + Real-Time Tracking */}
              {activeTab === 'orders' && (
                <div data-testid="order-history-panel" className="space-y-5">
                  {/* Customer Account Status & Quick Demo Login Banner */}
                  <div className="flex flex-col gap-3 border border-zinc-200 bg-zinc-950 p-4 text-white sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 px-2 py-0.5 font-mono-num text-[10px] font-bold text-emerald-300 uppercase">
                          <Radio className="h-2.5 w-2.5" />
                          <span>{currentUser ? 'Customer Authenticated' : 'Session Linked'}</span>
                        </span>
                        <span
                          data-testid="order-history-session-id"
                          className="font-mono-num text-xs font-bold text-zinc-200 truncate"
                        >
                          {currentUser
                            ? `${currentUser.displayName} (${currentUser.email})`
                            : `Browser Session #${userSessionId}`}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-400">
                        {currentUser
                          ? `${sessionOrders.length} UAE orders linked (${activeInTransitCount} active in-transit · Total ${formatAED(totalAccountSpend)})`
                          : 'Sign in to sync your UAE Cash on Delivery orders, itemized invoices, and live courier telemetry'}
                        {lastOrderHistorySyncAt ? ` · Synced ${lastOrderHistorySyncAt}` : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {!currentUser && (
                        <button
                          type="button"
                          data-testid="orders-tab-demo-login-btn"
                          onClick={handleQuickDemoCustomerLogin}
                          className="inline-flex items-center gap-1.5 border border-emerald-400 bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-zinc-950 transition-colors hover:bg-emerald-400 whitespace-nowrap"
                        >
                          <User className="h-3 w-3" />
                          <span>Demo Customer Sign In</span>
                        </button>
                      )}

                      <button
                        type="button"
                        data-testid="order-history-live-stream-btn"
                        onClick={() => setIsLiveStreamActive((prev) => !prev)}
                        className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-[11px] font-bold transition-colors whitespace-nowrap ${
                          isLiveStreamActive
                            ? 'border-emerald-400 bg-emerald-500 text-zinc-950'
                            : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        <Activity className="h-3 w-3" />
                        <span>
                          {isLiveStreamActive ? 'Streaming Live Updates...' : 'Stream Live Updates'}
                        </span>
                      </button>

                      <button
                        type="button"
                        data-testid="refresh-order-history-btn"
                        disabled={isFetchingOrderHistory}
                        onClick={() => fetchSessionOrderHistory()}
                        className="inline-flex items-center gap-1.5 border border-white bg-white px-3 py-1.5 text-[11px] font-bold text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-60 whitespace-nowrap"
                      >
                        <RefreshCw
                          className={`h-3 w-3 ${isFetchingOrderHistory ? 'animate-spin' : ''}`}
                        />
                        <span>
                          {isFetchingOrderHistory ? 'Fetching...' : 'Refresh Status'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Session Order History Cards List with Expandable Order Details */}
                  <div data-testid="order-history-list" className="space-y-4">
                    {sessionOrders.map((order) => {
                      const isSelected = order.orderId === selectedHistoryOrderId;
                      const isExpanded = Boolean(expandedOrderIds[order.orderId] || isSelected);
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
                                  data-testid={`history-toggle-details-${order.orderId}`}
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
                                  {isSelected ? 'Tracking Active' : 'Track Live'}
                                </button>

                                <button
                                  type="button"
                                  data-testid={`history-advance-order-${order.orderId}`}
                                  onClick={() => {
                                    setSelectedHistoryOrderId(order.orderId);
                                    tickSessionOrderHistoryStatus(order.orderId);
                                  }}
                                  title="Advance mock real-time status step"
                                  className="inline-flex items-center gap-1 border border-zinc-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-zinc-900 transition-colors hover:border-zinc-950 whitespace-nowrap"
                                >
                                  <SkipForward className="h-3 w-3" />
                                  <span>Next Step</span>
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
                                  <span className="hidden sm:inline">Reorder</span>
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
                                    <span>Open Full Live GPS Tracker</span>
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

                  {/* Embedded Real-Time Mock Timeline Linked to Selected Session Order */}
                  <div
                    data-testid="order-history-timeline-wrapper"
                    className="space-y-2 pt-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-display text-sm font-bold text-zinc-950">
                          Real-Time Dispatch Status Timeline — Order #{selectedHistoryOrderId}
                        </h3>
                        <p className="text-xs text-zinc-500">
                          Interactive 5-stage courier timeline linked to your active customer order history.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('tracking')}
                        className="text-xs font-bold text-zinc-950 underline underline-offset-4 hover:text-zinc-700"
                      >
                        Open Dedicated Full-Screen Tracker
                      </button>
                    </div>

                    <OrderTrackingTimeline selectedOrderId={selectedHistoryOrderId} />
                  </div>
                </div>
              )}

              {/* TAB 2: Real-Time Order Status Tracking Component */}
              {activeTab === 'tracking' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-sm font-bold text-zinc-950">
                        Live Courier Status Timeline
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Track your Dubai / UAE Cash on Delivery order across all 5 fulfillment stages in real time.
                      </p>
                    </div>
                    {!currentUser && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        className="text-xs font-bold text-zinc-950 underline underline-offset-4 hover:text-zinc-700"
                      >
                        Sign in to sync across devices
                      </button>
                    )}
                  </div>

                  <OrderTrackingTimeline selectedOrderId={selectedHistoryOrderId} />
                </div>
              )}

              {/* TAB 3: Authentication & Profile (Customer Login + Instant Demo Customer Access) */}
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
                            Live Al Quoz hub & bike telemetry
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

                      {/* Signed-In Customer Direct Order & Tracking Preview */}
                      <div className="border border-zinc-200 bg-white p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3">
                          <div>
                            <h3 className="font-display text-sm font-bold text-zinc-950">
                              Your Linked Orders & Live Tracking
                            </h3>
                            <p className="text-xs text-zinc-500">
                              Select any order below to inspect full line-item invoices or live courier GPS stages.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('tracking')}
                            className="text-xs font-bold text-zinc-950 underline underline-offset-4 hover:text-zinc-700"
                          >
                            Open Live Courier Tracker
                          </button>
                        </div>

                        <div className="divide-y divide-zinc-200">
                          {sessionOrders.map((ord) => (
                            <div
                              key={`profile-ord-${ord.orderId}`}
                              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono-num text-xs font-bold text-zinc-950">
                                    #{ord.orderId}
                                  </span>
                                  <span className="bg-zinc-950 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                                    {getOrderStatusLabel(ord.status)}
                                  </span>
                                  <span className="font-mono-num text-xs font-bold text-zinc-900">
                                    {formatAED(ord.total)}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-xs text-zinc-500">
                                  {ord.createdAt} · {ord.address}, {ord.emirate} ·{' '}
                                  {ord.items.map((i) => `${i.quantity}× ${i.product.title}`).join(', ')}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  data-testid={`profile-order-details-btn-${ord.orderId}`}
                                  onClick={() => {
                                    setSelectedHistoryOrderId(ord.orderId);
                                    setExpandedOrderIds((prev) => ({
                                      ...prev,
                                      [ord.orderId]: true,
                                    }));
                                    setActiveTab('orders');
                                  }}
                                  className="border border-zinc-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-zinc-900 hover:border-zinc-950 whitespace-nowrap"
                                >
                                  Order Details
                                </button>
                                <button
                                  type="button"
                                  data-testid={`profile-track-order-btn-${ord.orderId}`}
                                  onClick={() => {
                                    setSelectedHistoryOrderId(ord.orderId);
                                    setActiveTab('tracking');
                                  }}
                                  className="bg-zinc-950 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-zinc-800 whitespace-nowrap"
                                >
                                  Track Order
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {/* Left: Instant Demo Customer Access + Google OAuth */}
                      <div className="flex flex-col justify-between border border-zinc-200 bg-zinc-50 p-5 space-y-5">
                        <div className="space-y-4">
                          <div>
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                              <Shield className="h-3.5 w-3.5 text-zinc-950" />
                              <span>Instant UAE Customer Access</span>
                            </div>
                            <h3 className="mt-1.5 font-display text-base font-bold text-zinc-950">
                              Demo Customer Account (Tariq Al Maktoum)
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                              Sign in with one click to inspect seeded UAE Cash on Delivery orders (
                              <span className="font-mono-num font-semibold text-zinc-900">
                                #VDK-892410
                              </span>
                              ,{' '}
                              <span className="font-mono-num font-semibold text-zinc-900">
                                #VDK-891855
                              </span>
                              ,{' '}
                              <span className="font-mono-num font-semibold text-zinc-900">
                                #VDK-889302
                              </span>
                              ), itemized tax invoices, and live Dubai courier tracking.
                            </p>
                          </div>

                          <button
                            type="button"
                            data-testid="demo-customer-login-btn"
                            onClick={handleQuickDemoCustomerLogin}
                            className="flex w-full items-center justify-center gap-2 bg-zinc-950 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-zinc-800"
                          >
                            <UserCheck className="h-4 w-4 text-emerald-400" />
                            <span>Sign In as Demo Customer (Tariq Al Maktoum)</span>
                          </button>

                          <div className="border-t border-zinc-200 pt-4">
                            <p className="text-xs font-bold text-zinc-900">
                              Or Continue with Google OAuth
                            </p>
                            <p className="mt-1 text-xs text-zinc-600">
                              Sync your verified Google identity with Supabase Auth.
                            </p>
                            {authError && (
                              <p className="mt-3 border border-amber-300 bg-amber-50 p-2.5 text-[11px] text-amber-900">
                                {authError}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          data-testid="google-signin-btn"
                          disabled={isSigningIn}
                          onClick={handleGoogleSignIn}
                          className="flex w-full items-center justify-center gap-2 border border-zinc-950 bg-white px-4 py-2.5 text-xs font-bold text-zinc-950 transition-colors hover:bg-zinc-950 hover:text-white disabled:opacity-50"
                        >
                          <span>
                            {isSigningIn ? 'Authenticating...' : 'Continue with Google OAuth'}
                          </span>
                        </button>
                      </div>

                      {/* Right: Email + password (Supabase Auth + Local Session Support) */}
                      <form
                        onSubmit={handleEmailAuthSubmit}
                        className="border border-zinc-200 bg-white p-5 space-y-3.5"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-display text-base font-bold text-zinc-950">
                            {authMode === 'signin' ? 'Sign In with Email' : 'Create Your Account'}
                          </h3>
                          <button
                            type="button"
                            data-testid="auth-mode-toggle-btn"
                            onClick={() => {
                              setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                              setAuthError(null);
                              setAuthNotice(null);
                            }}
                            className="text-xs font-bold text-zinc-950 underline underline-offset-4 hover:text-zinc-700"
                          >
                            {authMode === 'signin' ? 'New here? Sign up' : 'Have an account? Sign in'}
                          </button>
                        </div>

                        {authNotice && (
                          <p className="border border-emerald-300 bg-emerald-50 p-2.5 text-[11px] text-emerald-900">
                            {authNotice}
                          </p>
                        )}
                        {authError && (
                          <p
                            role="alert"
                            className="border border-amber-300 bg-amber-50 p-2.5 text-[11px] text-amber-900"
                          >
                            {authError}
                          </p>
                        )}

                        {authMode === 'signup' && (
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
                              placeholder="e.g. Tariq Al Maktoum"
                              className="mt-1 w-full border border-zinc-300 px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                            />
                          </div>
                        )}
                        <div>
                          <label
                            htmlFor="account-email"
                            className="block text-xs font-semibold text-zinc-900"
                          >
                            Email
                          </label>
                          <div className="relative mt-1">
                            <Mail className="pointer-events-none absolute top-2.5 left-3 h-3.5 w-3.5 text-zinc-400" />
                            <input
                              id="account-email"
                              type="email"
                              required
                              autoComplete="email"
                              value={emailInput}
                              onChange={(e) => setEmailInput(e.target.value)}
                              placeholder="tariq.almaktoum@dubai.ae"
                              className="w-full border border-zinc-300 py-2 pr-3 pl-8 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
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
                                placeholder="+971 50 842 9910"
                                className="w-full border border-zinc-300 py-2 pr-3 pl-8 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
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
                          <input
                            id="account-password"
                            type="password"
                            required
                            minLength={6}
                            autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Minimum 6 characters"
                            className="mt-1 w-full border border-zinc-300 px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          data-testid="express-signin-submit-btn"
                          disabled={isSigningIn}
                          className="w-full border border-zinc-950 bg-zinc-950 py-2.5 text-xs font-bold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                        >
                          {isSigningIn
                            ? 'Please wait...'
                            : authMode === 'signin'
                              ? 'Sign In & View My Orders'
                              : 'Create Account'}
                        </button>
                      </form>
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
