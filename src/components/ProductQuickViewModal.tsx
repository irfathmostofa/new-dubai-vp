import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, ShoppingBag, ShieldCheck, Truck } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { formatAED } from '../utils/storeLogic';

export function ProductQuickViewModal() {
  const product = useCartStore((state) => state.quickViewProduct);
  const setQuickViewProduct = useCartStore((state) => state.setQuickViewProduct);
  const navigateToProduct = useCartStore((state) => state.navigateToProduct);
  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useCartStore((state) => state.setCartOpen);

  if (!product) return null;

  const handleBuyNow = () => {
    addItem(product, 1);
    setQuickViewProduct(null);
    setCartOpen(true);
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quickview-title"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setQuickViewProduct(null)}
          className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.18 }}
          className="relative z-10 grid max-h-[90vh] w-full max-w-3xl grid-cols-1 overflow-y-auto border border-zinc-200 bg-white shadow-2xl md:grid-cols-2"
        >
          <button
            type="button"
            onClick={() => setQuickViewProduct(null)}
            aria-label="Close product details"
            className="absolute right-3 top-3 sm:right-4 sm:top-4 z-10 inline-flex h-9 w-9 items-center justify-center border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-950 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Left Image */}
          <div className="aspect-4/3 md:aspect-square w-full bg-zinc-100 max-h-64 md:max-h-none overflow-hidden">
            <img
              src={product.image}
              alt={product.title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Right Contiguous Purchase Module */}
          <div className="flex flex-col justify-between p-5 sm:p-8">
            <div>
              <p className="text-xs font-semibold text-zinc-500">
                {product.brand} · {product.category}
              </p>

              <h2
                id="quickview-title"
                className="mt-1.5 font-display text-xl font-bold text-zinc-950"
              >
                {product.title}
              </h2>

              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-mono-num text-xl font-bold text-zinc-950">
                  {formatAED(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="font-mono-num text-sm text-zinc-400 line-through">
                    {formatAED(product.originalPrice)}
                  </span>
                )}
              </div>

              <p className="mt-4 text-xs leading-relaxed text-zinc-600">
                {product.description}
              </p>

              <dl className="mt-5 space-y-2 border-y border-zinc-200 py-3.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Flavour Profile</dt>
                  <dd className="font-semibold text-zinc-900">{product.flavorProfile}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Nicotine Strength</dt>
                  <dd className="font-semibold text-zinc-900">{product.nicotineStrength}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Hardware Display</dt>
                  <dd className="font-semibold text-zinc-900">{product.specs.display}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Battery & Coil</dt>
                  <dd className="font-semibold text-zinc-900">{product.specs.battery}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={handleBuyNow}
                className="flex w-full items-center justify-center gap-2 bg-zinc-950 px-6 py-3.5 text-xs font-bold text-white transition-colors hover:bg-zinc-800"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Add to Cart & Open Checkout</span>
              </button>

              <button
                type="button"
                onClick={() => navigateToProduct(product.id)}
                className="flex w-full items-center justify-center border border-zinc-950 bg-white px-6 py-3 text-xs font-bold text-zinc-950 transition-colors hover:bg-zinc-100"
              >
                Choose Variant & View Full Specs
              </button>

              <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-zinc-900" /> ESMA Verified
                </span>
                <span className="inline-flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-zinc-900" /> Same-Day UAE COD
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
