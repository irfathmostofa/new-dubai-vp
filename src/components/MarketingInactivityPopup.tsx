import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  X,
  Sparkles,
  Mail,
  Check,
  Copy,
  Send,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import {
  DEFAULT_INACTIVITY_TIMEOUT_MS,
  NEWSLETTER_DISCOUNT_CODE,
  NEWSLETTER_DISMISSED_SESSION_KEY,
  resolveInactivityTimeoutMs,
  isValidNewsletterEmail,
} from '../utils/storeLogic';

export function MarketingInactivityPopup() {
  const subscribeNewsletterLead = useCartStore((state) => state.subscribeNewsletterLead);

  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggeredInSession, setHasTriggeredInSession] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.sessionStorage.getItem(NEWSLETTER_DISMISSED_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unlockedCode, setUnlockedCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // 30-second user inactivity listener (resets timer on user interaction)
  useEffect(() => {
    if (typeof window === 'undefined' || hasTriggeredInSession) return;

    const timeoutMs = resolveInactivityTimeoutMs(
      window.location.search,
      DEFAULT_INACTIVITY_TIMEOUT_MS
    );

    let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

    const startOrResetTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      inactivityTimer = setTimeout(() => {
        setIsOpen(true);
        setHasTriggeredInSession(true);
        try {
          window.sessionStorage.setItem(NEWSLETTER_DISMISSED_SESSION_KEY, 'true');
        } catch {
          // ignore storage errors
        }
      }, timeoutMs);
    };

    const activityEvents: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
    ];

    startOrResetTimer();

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, startOrResetTimer, { passive: true });
    });

    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, startOrResetTimer);
      });
    };
  }, [hasTriggeredInSession]);

  const handleClose = () => {
    setIsOpen(false);
    setHasTriggeredInSession(true);
    try {
      window.sessionStorage.setItem(NEWSLETTER_DISMISSED_SESSION_KEY, 'true');
    } catch {
      // ignore storage errors
    }
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isValidNewsletterEmail(emailInput)) {
      setErrorMsg('Please enter a valid email address to receive your 15% OFF code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await subscribeNewsletterLead({
        email: emailInput.trim(),
        name: nameInput.trim() || 'UAE VIP Subscriber',
        discountCode: NEWSLETTER_DISCOUNT_CODE,
      });
      setUnlockedCode(result.discountCode || NEWSLETTER_DISCOUNT_CODE);
    } catch {
      setUnlockedCode(NEWSLETTER_DISCOUNT_CODE);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyDiscountCode = async () => {
    const code = unlockedCode || NEWSLETTER_DISCOUNT_CODE;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      }
    } catch {
      // fallback inside iframe
    }
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="marketing-popup-title"
          data-testid="marketing-inactivity-popup"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-zinc-950/75 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-lg overflow-hidden border-2 border-zinc-950 bg-white shadow-2xl"
          >
            {/* Top Dark Promo Header */}
            <div className="bg-zinc-950 px-6 py-5 text-white sm:px-8">
              <button
                type="button"
                data-testid="marketing-popup-close-btn"
                onClick={handleClose}
                aria-label="Close VIP discount offer"
                className="absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center border border-zinc-700 bg-zinc-900 text-zinc-300 transition-colors hover:border-white hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold tracking-widest text-emerald-300 uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                <span>UAE VIP Dispatch Club · Exclusive Offer</span>
              </div>

              <h2
                id="marketing-popup-title"
                className="mt-2.5 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl"
              >
                Unlock 15% OFF Your First UAE Order
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">
                Still browsing our 10,000–35,000 puff smart hardware? Join the Vape Dubai King newsletter for an instant <strong className="text-white">15% discount code</strong> delivered via Resend.
              </p>
            </div>

            {/* Body: Lead Capture Form OR Unlocked Discount Code */}
            <div className="p-6 sm:p-8">
              {!unlockedCode ? (
                <form
                  onSubmit={handleSubmitLead}
                  data-testid="marketing-popup-form"
                  className="space-y-4"
                >
                  {errorMsg && (
                    <p
                      role="alert"
                      className="border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-900"
                    >
                      {errorMsg}
                    </p>
                  )}

                  <div>
                    <label
                      htmlFor="marketing-lead-name"
                      className="block text-xs font-bold tracking-wider text-zinc-900 uppercase"
                    >
                      Your Name (Optional)
                    </label>
                    <input
                      id="marketing-lead-name"
                      data-testid="marketing-lead-name-input"
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. Rashid Al Maktoum"
                      className="mt-1.5 w-full border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="marketing-lead-email"
                      className="block text-xs font-bold tracking-wider text-zinc-900 uppercase"
                    >
                      Email Address (For Instant Voucher Delivery)
                    </label>
                    <div className="relative mt-1.5">
                      <Mail className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-zinc-400" />
                      <input
                        id="marketing-lead-email"
                        data-testid="marketing-lead-email-input"
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="you@dubai.ae"
                        className="w-full border border-zinc-300 bg-white py-2.5 pr-3.5 pl-10 text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    data-testid="marketing-lead-submit-btn"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 bg-zinc-950 px-5 py-3.5 text-xs font-bold tracking-wide text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span>
                      {isSubmitting
                        ? 'Sending Voucher via Resend...'
                        : 'Claim My 15% OFF Discount Code'}
                    </span>
                  </button>

                  <div className="flex items-center justify-between pt-2 text-[11px] text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-zinc-950" />
                      <span>Valid on Cash on Delivery across all 7 Emirates</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="font-semibold text-zinc-500 underline hover:text-zinc-950"
                    >
                      No thanks
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  data-testid="marketing-discount-unlocked"
                  className="space-y-5 text-center"
                >
                  <div className="mx-auto inline-flex h-11 w-11 items-center justify-center bg-emerald-600 text-white">
                    <Check className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-xs font-bold tracking-widest text-emerald-700 uppercase">
                      Lead Captured & Sent via Resend
                    </p>
                    <h3 className="mt-1 font-display text-xl font-bold text-zinc-950">
                      Your 15% VIP Voucher Code is Active!
                    </h3>
                    <p className="mt-1 text-xs text-zinc-600">
                      We also dispatched a copy of this voucher to{' '}
                      <strong className="text-zinc-950">{emailInput}</strong>.
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-2 border-dashed border-zinc-950 bg-zinc-50 px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-zinc-950" />
                      <span
                        data-testid="marketing-discount-code-value"
                        className="font-mono-num text-lg font-bold tracking-widest text-zinc-950"
                      >
                        {unlockedCode}
                      </span>
                    </div>

                    <button
                      type="button"
                      data-testid="marketing-copy-code-btn"
                      onClick={handleCopyDiscountCode}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition-colors ${
                        codeCopied
                          ? 'bg-emerald-700 text-white'
                          : 'bg-zinc-950 text-white hover:bg-zinc-800'
                      }`}
                    >
                      {codeCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full border border-zinc-950 bg-white py-3 text-xs font-bold text-zinc-950 transition-colors hover:bg-zinc-100"
                  >
                    Continue Shopping with 15% OFF
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
