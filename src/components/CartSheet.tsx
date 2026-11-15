import React, { useState } from 'react';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  Truck,
  Banknote,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from './ui/sheet';
import { useCartStore } from '../store/useCartStore';
import {
  calculateSubtotal,
  calculateTotalItems,
  calculateShippingInfo,
  formatAED,
  getCartItemUnitPrice,
} from '../utils/storeLogic';

const UAE_EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain',
];

export function CartSheet() {
  const items = useCartStore((state) => state.items);
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const setCartOpen = useCartStore((state) => state.setCartOpen);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const navigateToProduct = useCartStore((state) => state.navigateToProduct);
  const placeOrder = useCartStore((state) => state.placeOrder);
  const lastOrder = useCartStore((state) => state.lastOrder);
  const clearLastOrder = useCartStore((state) => state.clearLastOrder);
  const currentUser = useCartStore((state) => state.currentUser);

  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmed'>('cart');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [emirate, setEmirate] = useState('Dubai');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'Card Link on Delivery'>(
    'Cash on Delivery'
  );
  const [formError, setFormError] = useState<string | null>(null);

  const subtotal = calculateSubtotal(items);
  const totalItems = calculateTotalItems(items);
  const shippingInfo = calculateShippingInfo(subtotal);
  const finalTotal = subtotal + shippingInfo.shippingFee;

  const handleClose = () => {
    setCartOpen(false);
    setTimeout(() => {
      if (step === 'confirmed') {
        setStep('cart');
        clearLastOrder();
      }
    }, 200);
  };

  const handleStartCheckout = () => {
    setFormError(null);
    setStep('checkout');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPlacingOrder) return;
    const contactEmail = (email || currentUser?.email || '').trim();
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      setFormError('Please provide your full name, UAE phone number, and delivery address.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) {
      setFormError('Please enter a valid email address so we can send your order confirmation.');
      return;
    }

    setFormError(null);
    setIsPlacingOrder(true);
    // The server recomputes all prices; the order only appears once it is saved.
    const result = await placeOrder({
      fullName: fullName.trim(),
      email: contactEmail,
      phone: phone.trim(),
      emirate,
      address: address.trim(),
      paymentMethod,
      items: [...items],
      subtotal,
      shippingFee: shippingInfo.shippingFee,
      total: finalTotal,
    });
    setIsPlacingOrder(false);

    if (result.success) {
      setStep('confirmed');
    } else {
      setFormError(result.error);
    }
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={handleClose}>
      <SheetContent onClose={handleClose}>
        <SheetHeader>
          <SheetTitle>
            {step === 'cart' && `Your Cart (${totalItems})`}
            {step === 'checkout' && 'Cash on Delivery Checkout'}
            {step === 'confirmed' && 'Order Confirmed'}
          </SheetTitle>
          <SheetDescription>
            {step === 'cart' && 'Dispatched same-day from our Dubai fulfillment center.'}
            {step === 'checkout' && 'Pay cash or card link upon doorstep delivery anywhere in UAE.'}
            {step === 'confirmed' && 'Your UAE dispatch courier is being assigned.'}
          </SheetDescription>
        </SheetHeader>

        {/* Free Shipping Progress Bar (350 AED threshold) */}
        {step !== 'confirmed' && items.length > 0 && (
          <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-700">
                {shippingInfo.isFreeShipping ? (
                  <span className="font-semibold text-zinc-950">
                    Unlocked: Free Express UAE Shipping
                  </span>
                ) : (
                  <>
                    Add{' '}
                    <span className="font-mono-num font-bold text-zinc-950">
                      {formatAED(shippingInfo.remainingForFreeShipping)}
                    </span>{' '}
                    more for Free UAE Shipping
                  </>
                )}
              </span>
              <span className="font-mono-num text-xs font-semibold text-zinc-500">
                {shippingInfo.progressPercent}%
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden bg-zinc-200">
              <div
                className="h-full bg-zinc-950 transition-all duration-300"
                style={{ width: `${shippingInfo.progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'cart' && (
            <>
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center border border-zinc-200 bg-zinc-50 text-zinc-400">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold text-zinc-950">
                    Your cart is empty
                  </h3>
                  <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-500">
                    Add disposable vapes, pod systems, or nicotine salts to qualify for same-day UAE delivery.
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-6 bg-zinc-950 px-6 py-3 text-xs font-bold text-white transition-colors hover:bg-zinc-800"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-zinc-200">
                  {items.map((item) => {
                    const { product, quantity, selectedVariant } = item;
                    const itemKey = item.cartItemId || product.id;
                    const unitPrice = getCartItemUnitPrice(item);

                    return (
                      <li key={itemKey} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                        <button
                          type="button"
                          onClick={() => {
                            setCartOpen(false);
                            navigateToProduct(product.id);
                          }}
                          className="h-20 w-20 shrink-0 overflow-hidden border border-zinc-200 bg-zinc-100"
                        >
                          <img
                            src={product.image}
                            alt={product.title}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        </button>

                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="line-clamp-2 text-xs font-semibold text-zinc-950">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCartOpen(false);
                                    navigateToProduct(product.id);
                                  }}
                                  className="text-left hover:underline"
                                >
                                  {product.title}
                                </button>
                              </h3>
                              <button
                                type="button"
                                onClick={() => removeItem(itemKey)}
                                aria-label={`Remove ${product.title} from cart`}
                                className="text-zinc-400 transition-colors hover:text-red-600 p-1 -mr-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            {selectedVariant ? (
                              <p
                                data-testid={`cart-item-variant-${product.id}`}
                                className="mt-1 text-[11px] font-medium text-zinc-600"
                              >
                                {selectedVariant.flavor} · {selectedVariant.nicotine} ·{' '}
                                <span className="font-semibold text-zinc-900">
                                  {selectedVariant.packLabel}
                                </span>
                              </p>
                            ) : (
                              <p className="mt-0.5 text-xs text-zinc-500">
                                {product.brand} · {product.nicotineStrength}
                              </p>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            {/* Quantity Adjustment Buttons (+ / -) */}
                            <div className="inline-flex items-center border border-zinc-300 bg-white">
                              <button
                                type="button"
                                onClick={() => updateQuantity(itemKey, -1)}
                                aria-label={`Decrease quantity of ${product.title}`}
                                className="inline-flex h-8 w-8 items-center justify-center text-zinc-700 transition-colors hover:bg-zinc-100"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span
                                data-testid={`cart-qty-${product.id}`}
                                className="font-mono-num inline-flex h-8 min-w-8 items-center justify-center px-2 text-xs font-bold text-zinc-950"
                              >
                                {quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(itemKey, 1)}
                                aria-label={`Increase quantity of ${product.title}`}
                                className="inline-flex h-8 w-8 items-center justify-center text-zinc-700 transition-colors hover:bg-zinc-100"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <span className="font-mono-num text-xs font-bold text-zinc-950">
                              {formatAED(unitPrice * quantity)}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {step === 'checkout' && (
            <form id="cod-checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Cart Items</span>
              </button>

              {formError && (
                <div className="border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800">
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="cod-fullname" className="block text-xs font-semibold text-zinc-900">
                  Full Name *
                </label>
                <input
                  id="cod-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Tariq Al Maktoum"
                  className="mt-1.5 w-full border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="cod-email" className="block text-xs font-semibold text-zinc-900">
                  Email (for your order confirmation) *
                </label>
                <input
                  id="cod-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email || currentUser?.email || ''}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="cod-phone" className="block text-xs font-semibold text-zinc-900">
                  UAE Mobile Number (WhatsApp for Courier) *
                </label>
                <input
                  id="cod-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+971 50 XXX XXXX"
                  className="mt-1.5 w-full border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="cod-emirate" className="block text-xs font-semibold text-zinc-900">
                  Emirate *
                </label>
                <select
                  id="cod-emirate"
                  value={emirate}
                  onChange={(e) => setEmirate(e.target.value)}
                  className="mt-1.5 w-full border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
                >
                  {UAE_EMIRATES.map((em) => (
                    <option key={em} value={em}>
                      {em}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="cod-address" className="block text-xs font-semibold text-zinc-900">
                  Building, Villa / Apartment & Area *
                </label>
                <textarea
                  id="cod-address"
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Tower name, apartment number, street, Dubai Marina / Downtown..."
                  className="mt-1.5 w-full border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-zinc-900">
                  Doorstep Settlement Method
                </span>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash on Delivery')}
                    className={`border px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                      paymentMethod === 'Cash on Delivery'
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    Cash on Delivery (AED)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Card Link on Delivery')}
                    className={`border px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                      paymentMethod === 'Card Link on Delivery'
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    Link Payment on Delivery
                  </button>
                </div>
              </div>
            </form>
          )}

          {step === 'confirmed' && lastOrder && (
            <div className="space-y-5 py-2">
              <div className="border border-zinc-950 bg-zinc-50 p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-zinc-950 shrink-0" />
                  <div>
                    <p className="font-mono-num text-xs font-bold text-zinc-500">
                      ORDER #{lastOrder.orderId}
                    </p>
                    <h3 className="font-display text-lg font-bold text-zinc-950">
                      Confirmed — Preparing Dispatch
                    </h3>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 border-t border-zinc-200 pt-4 text-xs text-zinc-700">
                  <p>
                    <span className="font-semibold text-zinc-950">Recipient:</span>{' '}
                    {lastOrder.fullName} ({lastOrder.phone})
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-950">Destination:</span>{' '}
                    {lastOrder.address}, {lastOrder.emirate}
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-950">Payment:</span>{' '}
                    {lastOrder.paymentMethod}
                  </p>
                </div>

                <div className="mt-4 border-t border-zinc-200 pt-3">
                  <div className="flex items-center justify-between text-sm font-bold text-zinc-950">
                    <span>Amount Due on Delivery</span>
                    <span className="font-mono-num">{formatAED(lastOrder.total)}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep('cart');
                  clearLastOrder();
                  setCartOpen(false);
                }}
                className="w-full bg-zinc-950 py-3.5 text-xs font-bold text-white transition-colors hover:bg-zinc-800"
              >
                Return to Storefront
              </button>
            </div>
          )}
        </div>

        {/* Sticky Bottom Section with Subtotal and Massive Checkout (Cash on Delivery) Button */}
        {step !== 'confirmed' && items.length > 0 && (
          <SheetFooter>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-600">
                <span>UAE Courier Shipping</span>
                <span className="font-mono-num font-semibold text-zinc-900">
                  {shippingInfo.isFreeShipping ? 'FREE' : formatAED(shippingInfo.shippingFee)}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-200 pt-2.5 text-base font-bold text-zinc-950">
                <span>Subtotal</span>
                <span data-testid="cart-subtotal" className="font-mono-num text-lg">
                  {formatAED(subtotal)}
                </span>
              </div>
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={handleStartCheckout}
                className="mt-4 flex w-full items-center justify-center gap-2 bg-zinc-950 px-6 py-4 text-sm font-bold tracking-wide text-white transition-colors hover:bg-zinc-800 whitespace-nowrap"
              >
                <Banknote className="h-4 w-4" />
                <span>Checkout (Cash on Delivery)</span>
              </button>
            ) : (
              <button
                type="submit"
                form="cod-checkout-form"
                disabled={isPlacingOrder}
                className="mt-4 flex w-full items-center justify-center gap-2 bg-zinc-950 px-6 py-4 text-sm font-bold tracking-wide text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 whitespace-nowrap"
              >
                <Truck className="h-4 w-4" />
                <span>
                  {isPlacingOrder ? 'Placing your order...' : `Confirm Order · ${formatAED(finalTotal)}`}
                </span>
              </button>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
