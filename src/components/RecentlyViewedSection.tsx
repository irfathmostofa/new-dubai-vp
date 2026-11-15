import React from 'react';
import { Clock, ShoppingBag, Eye, Trash2 } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { MOCK_PRODUCTS } from '../data/products';
import { formatAED, resolveRecentlyViewedProducts } from '../utils/storeLogic';

export function RecentlyViewedSection() {
  const catalog = useCartStore((state) => state.catalog);
  const recentlyViewedIds = useCartStore((state) => state.recentlyViewedIds);
  const addItem = useCartStore((state) => state.addItem);
  const navigateToProduct = useCartStore((state) => state.navigateToProduct);
  const setQuickViewProduct = useCartStore((state) => state.setQuickViewProduct);
  const clearRecentlyViewed = useCartStore((state) => state.clearRecentlyViewed);

  const viewedProducts = resolveRecentlyViewedProducts(recentlyViewedIds, catalog);

  return (
    <section
      aria-labelledby="recently-viewed-heading"
      data-testid="recently-viewed-section"
      className="border-t border-zinc-200 bg-zinc-50/70 py-12 sm:py-14"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-zinc-500 uppercase">
              <Clock className="h-3.5 w-3.5 text-zinc-900" />
              <span>Session Activity · Instant Recall</span>
            </div>
            <h2
              id="recently-viewed-heading"
              className="mt-1 font-display text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl"
            >
              Recently Viewed Products
            </h2>
          </div>

          {viewedProducts.length > 0 && (
            <button
              type="button"
              onClick={clearRecentlyViewed}
              aria-label="Clear recently viewed history"
              className="inline-flex items-center gap-1.5 border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-950 hover:text-zinc-950 whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {viewedProducts.length === 0 ? (
          <div className="mt-6 border border-zinc-200 bg-white p-8 text-center">
            <p className="text-xs font-medium text-zinc-600">
              No recently viewed items in your current session. Click any product above to track it here.
            </p>
          </div>
        ) : (
          <div
            role="list"
            aria-label="Recently viewed products horizontal list"
            className="mt-6 flex gap-5 overflow-x-auto pb-3 snap-x snap-mandatory"
          >
            {viewedProducts.map((product, index) => (
              <div
                key={product.id}
                role="listitem"
                data-testid={`recently-viewed-item-${product.id}`}
                className="group flex w-64 shrink-0 snap-start flex-col justify-between border border-zinc-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-950 sm:w-72"
              >
                <div>
                  <div className="flex items-center gap-3.5">
                    <button
                      type="button"
                      onClick={() => navigateToProduct(product.id)}
                      className="relative h-20 w-20 shrink-0 overflow-hidden border border-zinc-200 bg-zinc-100"
                    >
                      <img
                        src={product.image}
                        alt={product.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                        <span className="font-mono-num font-semibold text-zinc-900">
                          #{index + 1}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{product.brand}</span>
                      </div>

                      <h3 className="mt-1 line-clamp-2 font-display text-xs font-bold leading-snug text-zinc-950">
                        <button
                          type="button"
                          onClick={() => navigateToProduct(product.id)}
                          className="text-left hover:underline"
                        >
                          {product.title}
                        </button>
                      </h3>

                      <p className="mt-1.5 font-mono-num text-xs font-bold text-zinc-950">
                        {formatAED(product.price)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-3">
                  <button
                    type="button"
                    onClick={() => addItem(product, 1)}
                    aria-label={`Add recently viewed ${product.title} to cart`}
                    className="flex flex-1 items-center justify-center gap-1.5 bg-zinc-950 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-zinc-800 whitespace-nowrap"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickViewProduct(product)}
                    aria-label={`Inspect recently viewed ${product.title}`}
                    className="inline-flex h-8 w-8 items-center justify-center border border-zinc-200 bg-white text-zinc-700 transition-colors hover:border-zinc-950 hover:text-zinc-950 shrink-0"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
