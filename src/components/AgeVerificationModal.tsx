import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ShieldAlert, Lock } from 'lucide-react';

const AGE_VERIFIED_STORAGE_KEY = 'vdk_age_verified_v1';

export function AgeVerificationModal() {
  const [isVerified, setIsVerified] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return true;
    return window.sessionStorage.getItem(AGE_VERIFIED_STORAGE_KEY) === 'true';
  });

  const [isUnderage, setIsUnderage] = useState(false);

  useEffect(() => {
    if (!isVerified) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isVerified]);

  const handleConfirmAge = () => {
    window.sessionStorage.setItem(AGE_VERIFIED_STORAGE_KEY, 'true');
    setIsUnderage(false);
    setIsVerified(true);
  };

  const handleUnderage = () => {
    setIsUnderage(true);
  };

  return (
    <AnimatePresence>
      {!isVerified && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="age-verification-title"
          aria-describedby="age-verification-desc"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg border border-zinc-800 bg-white p-8 text-center text-zinc-950 shadow-2xl sm:p-10"
          >
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center bg-zinc-950 text-white">
              {isUnderage ? <Lock className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            </div>

            <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
              Vape Dubai King · UAE Compliance
            </p>

            <h1
              id="age-verification-title"
              className="mt-2 font-display text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl"
            >
              AGE VERIFICATION
            </h1>

            {!isUnderage ? (
              <>
                <p
                  id="age-verification-desc"
                  className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-600 sm:text-base"
                >
                  You must be 21 years or older to enter this site. Please verify your age.
                </p>

                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleConfirmAge}
                    className="w-full bg-zinc-950 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 whitespace-nowrap"
                  >
                    I am 21+
                  </button>
                  <button
                    type="button"
                    onClick={handleUnderage}
                    className="w-full border border-zinc-300 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 whitespace-nowrap"
                  >
                    I am under 21
                  </button>
                </div>

                <p className="mt-6 border-t border-zinc-200 pt-4 text-xs leading-relaxed text-zinc-500">
                  By entering this website, you confirm compliance with UAE Federal Law regarding adult nicotine products.
                </p>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16 }}
                className="mt-5"
              >
                <div className="border border-red-200 bg-red-50 p-4 text-left">
                  <p className="text-sm font-semibold text-red-900">
                    Access Denied — Restricted to Adults 21+
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-red-800">
                    We strictly prohibit the sale or viewing of vaping and nicotine products to individuals under the legal age of 21 in the United Arab Emirates.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsUnderage(false)}
                  className="mt-6 text-xs font-medium text-zinc-500 underline underline-offset-4 transition-colors hover:text-zinc-950"
                >
                  Selected by mistake? Return to age verification
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
