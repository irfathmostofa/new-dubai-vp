import React from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight, SlidersHorizontal } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from './ui/sheet';
import { useCartStore } from '../store/useCartStore';
import { MOCK_PRODUCTS } from '../data/products';
import { formatAED, resolveWishlistProducts } from '../utils/storeLogic';

export function WishlistSheet() {
  const wishlistIds = useCartStore((state) => state.wishlistIds);
  const isWishlistOpen = useCartStore((state) => state.isWishlistOpen);
  const setWishlistOpen = useCartStore((state) => state.setWishlistOpen);
  const removeWishlistItem = useCartStore((state) => state.removeWishlistItem);
  const clearWishlist = useCartStore((state) => state.clearWishlist);
  const moveWishlistItemToCart = useCartStore((state) => state.moveWishlistItemToCart);
  const setCartOpen = useCartStore((state) => state.setCartOpen);
  const navigateToProduct = useCartStore((state) => state.navigateToProduct);

  const wishlistProducts = resolveWishlistProducts(wishlistIds, MOCK_PRODUCTS);

  const handleClose = () => {
    setWishlistOpen(false);
  };

  const handleMoveAllToCart = () => {
    wishlistProducts.forEach((product) => {
      moveWishlistItemToCart(product);
    });
    setWishlistOpen(false);
    setCartOpen(true);
  };

  return (
    <Sheet open={isWishlistOpen} onOpenChange={handleClose}>
      <SheetContent onClose={handleClose}>
        <SheetHeader>
          <SheetTitle>Saved Wishlist ({wishlistProducts.length})</SheetTitle>
          <SheetDescription>
            Save your favorite disposable vapes, pod kits, and nicotine salts for instant UAE checkout.
          </SheetDescription>
        </SheetHeader>

        {/* Subheader Actions */}
        {wishlistProducts.length > 0 && (
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-6 py-2.5 text-xs">
            <span className="font-medium text-zinc-600">
              {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'} saved in browser
            </span>
            <button
              type="button"
              onClick={clearWishlist}
              className="font-semibold text-zinc-600 underline underline-offset-4 hover:text-zinc-950"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Wishlist Items List */}
        <div
          data-testid="wishlist-sheet-body"
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          {wishlistProducts.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center border border-zinc-200 bg-zinc-50 text-zinc-400">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-zinc-950">
                Your wishlist is empty
              </h3>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-500">
                Tap the heart icon on any vape device or e-liquid to save it here for quick access.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-6 bg-zinc-950 px-6 py-3 text-xs font-bold text-white transition-colors hover:bg-zinc-800"
              >
                Explore Products
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200">
              {wishlistProducts.map((product) => (
                <li
                  key={product.id}
                  data-testid={`wishlist-item-${product.id}`}
                  className="flex gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setWishlistOpen(false);
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
                              setWishlistOpen(false);
                              navigateToProduct(product.id);
                            }}
                            className="text-left hover:underline"
                          >
                            {product.title}
                          </button>
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeWishlistItem(product.id)}
                          aria-label={`Remove ${product.title} from wishlist`}
                          className="text-zinc-400 transition-colors hover:text-red-600 p-1 -mr-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        {product.brand} · {product.puffCount} · {product.nicotineStrength}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="font-mono-num text-xs font-bold text-zinc-950">
                        {formatAED(product.price)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setWishlistOpen(false);
                            navigateToProduct(product.id);
                          }}
                          className="inline-flex items-center gap-1 border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-800 hover:border-zinc-950"
                        >
                          <SlidersHorizontal className="h-3 w-3" />
                          <span>Variants</span>
                        </button>

                        <button
                          type="button"
                          data-testid={`wishlist-move-to-cart-${product.id}`}
                          onClick={() => moveWishlistItemToCart(product)}
                          className="inline-flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-zinc-800"
                        >
                          <ShoppingBag className="h-3 w-3" />
                          <span>Move to Cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sticky Footer */}
        {wishlistProducts.length > 0 && (
          <SheetFooter>
            <button
              type="button"
              data-testid="wishlist-move-all-btn"
              onClick={handleMoveAllToCart}
              className="flex w-full items-center justify-center gap-2 bg-zinc-950 px-6 py-4 text-xs font-bold tracking-wide text-white transition-colors hover:bg-zinc-800 whitespace-nowrap"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Move All Saved Items to Cart ({wishlistProducts.length})</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
