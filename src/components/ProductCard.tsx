import React, { useState } from 'react';
import { ShoppingBag, Check, Eye, SlidersHorizontal, Heart } from 'lucide-react';
import { Product } from '../types/store';
import { formatAED, isProductWishlisted } from '../utils/storeLogic';
import { useCartStore } from '../store/useCartStore';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const wishlistIds = useCartStore((state) => state.wishlistIds);
  const toggleWishlist = useCartStore((state) => state.toggleWishlist);
  const navigateToProduct = useCartStore((state) => state.navigateToProduct);
  const setQuickViewProduct = useCartStore((state) => state.setQuickViewProduct);
  const trackProductClick = useCartStore((state) => state.trackProductClick);
  const [justAdded, setJustAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isWishlisted = isProductWishlisted(wishlistIds, product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product, 1);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 1100);
  };

  const handleOpenProductPage = () => {
    navigateToProduct(product.id);
  };

  return (
    <article
      onClick={() => trackProductClick(product.id)}
      className="group flex flex-col justify-between border border-zinc-200 bg-white transition-transform duration-200 hover:-translate-y-1 hover:border-zinc-950"
    >
      <div>
        {/* Product Image Container (4:3 e-commerce card aspect ratio) */}
        <div
          onClick={handleOpenProductPage}
          className="relative aspect-4/3 w-full cursor-pointer overflow-hidden bg-zinc-100"
        >
          {!imgError ? (
            <img
              src={product.image}
              alt={product.title}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-100 p-6 text-center">
              <span className="font-display text-sm font-bold text-zinc-900">{product.brand}</span>
              <span className="mt-1 text-xs text-zinc-500">{product.puffCount}</span>
            </div>
          )}

          {/* Top-Right Wishlist Toggle Button */}
          <button
            type="button"
            data-testid={`wishlist-toggle-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            aria-label={
              isWishlisted
                ? `Remove ${product.title} from wishlist`
                : `Save ${product.title} to wishlist`
            }
            aria-pressed={isWishlisted}
            className={`absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center border transition-colors ${
              isWishlisted
                ? 'border-zinc-950 bg-zinc-950 text-white'
                : 'border-zinc-200 bg-white/95 text-zinc-800 hover:border-zinc-950 hover:text-zinc-950'
            }`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-white' : ''}`} />
          </button>

          {/* Quick View Button on Hover */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setQuickViewProduct(product);
            }}
            aria-label={`Quick view ${product.title}`}
            className="absolute right-3 bottom-3 inline-flex h-9 w-9 items-center justify-center border border-zinc-200 bg-white/95 text-zinc-900 opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-zinc-950 hover:text-white focus:opacity-100"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>

        {/* Clean Unboxed Metadata & 2-Line Truncated Product Title */}
        <div className="p-5">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="font-medium text-zinc-700">{product.brand}</span>
            <span aria-hidden="true">·</span>
            <span>{product.puffCount}</span>
            <span aria-hidden="true">·</span>
            <span>{product.nicotineStrength}</span>
          </div>

          <h3 className="mt-2 line-clamp-2 min-h-[2.75rem] font-display text-base font-semibold leading-snug text-zinc-950">
            <button
              type="button"
              data-testid={`product-card-title-${product.id}`}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenProductPage();
              }}
              className="text-left transition-colors hover:text-zinc-700 focus-visible:underline focus-visible:outline-none"
            >
              {product.title}
            </button>
          </h3>

          <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-zinc-500">
            <span className="truncate">Flavour: {product.flavorProfile}</span>
            <button
              type="button"
              data-testid={`choose-variant-btn-${product.id}`}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenProductPage();
              }}
              className="inline-flex items-center gap-1 font-semibold text-zinc-900 underline underline-offset-4 hover:text-zinc-600 shrink-0"
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span>{product.variants.flavors.length} Variants</span>
            </button>
          </div>

          {/* Price formatted in AED */}
          <div className="mt-4 flex items-baseline gap-2.5 border-t border-zinc-100 pt-3">
            <span className="font-mono-num text-base font-bold text-zinc-950">
              {formatAED(product.price)}
            </span>
            {product.originalPrice && (
              <span className="font-mono-num text-xs text-zinc-400 line-through">
                {formatAED(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Full-Width "Add to Cart" Button at Bottom */}
      <div className="px-5 pb-5">
        <button
          type="button"
          onClick={handleAddToCart}
          className={`flex w-full items-center justify-center gap-2 px-4 py-3 text-xs font-bold tracking-wide transition-colors whitespace-nowrap ${
            justAdded
              ? 'bg-emerald-700 text-white'
              : 'bg-zinc-950 text-white hover:bg-zinc-800'
          }`}
        >
          {justAdded ? (
            <>
              <Check className="h-4 w-4" />
              <span>Added to Cart</span>
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}
