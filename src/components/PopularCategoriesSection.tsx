import React from 'react';
import { ArrowUpRight, Layers, Sparkles, ShieldCheck } from 'lucide-react';
import { POPULAR_CATEGORY_CARDS } from '../data/products';
import { useCartStore } from '../store/useCartStore';
import { formatAED } from '../utils/storeLogic';

export function PopularCategoriesSection() {
  const navigateToCategory = useCartStore((state) => state.navigateToCategory);

  return (
    <section
      aria-labelledby="popular-categories-heading"
      data-testid="popular-categories-section"
      className="border-b border-zinc-200 bg-zinc-50/60 py-12 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-500 uppercase">
              <Layers className="h-3.5 w-3.5 text-zinc-950" />
              <span>Shop by Department · Curated UAE Hardware</span>
            </div>
            <h2
              id="popular-categories-heading"
              className="mt-1.5 font-display text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl"
            >
              Popular Vape Categories
            </h2>
          </div>

          <button
            type="button"
            onClick={() => navigateToCategory('All')}
            className="inline-flex items-center gap-1.5 self-start border border-zinc-950 bg-white px-4 py-2.5 text-xs font-bold text-zinc-950 transition-colors hover:bg-zinc-950 hover:text-white sm:self-auto"
          >
            <span>Explore Full UAE Catalog</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        {/* 4-Card Architectural Popular Category Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {POPULAR_CATEGORY_CARDS.map((card, index) => {
            const isDark = card.accentTheme === 'dark';
            return (
              <article
                key={card.id}
                data-testid={`popular-category-card-${card.id}`}
                onClick={() => navigateToCategory(card.category)}
                className="group relative flex cursor-pointer flex-col justify-between overflow-hidden border border-zinc-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-zinc-950 hover:shadow-xl"
              >
                {/* Top Department Header Strip */}
                <div>
                  <div
                    className={`flex items-center justify-between gap-2 px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase whitespace-nowrap ${
                      isDark ? 'bg-zinc-950 text-white' : 'border-b border-zinc-200 bg-zinc-100 text-zinc-900'
                    }`}
                  >
                    <span className="truncate">
                      0{index + 1} · {card.badge}
                    </span>
                    <span className="font-mono-num shrink-0 opacity-80">{card.itemCountLabel}</span>
                  </div>

                  {/* Studio Hardware Image Viewport */}
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-zinc-100">
                    <img
                      src={card.image}
                      alt={card.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute right-3 bottom-3 border border-zinc-200 bg-white/95 px-2.5 py-1 font-mono-num text-xs font-bold text-zinc-950 shadow-xs">
                      From {formatAED(card.startingPrice)}
                    </div>
                  </div>

                  {/* Card Copy & Quick Brand Shortcuts */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-lg font-bold tracking-tight text-zinc-950 group-hover:underline underline-offset-4">
                        {card.title}
                      </h3>
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center border border-zinc-200 bg-zinc-50 text-zinc-900 transition-colors group-hover:border-zinc-950 group-hover:bg-zinc-950 group-hover:text-white">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>

                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-600">
                      {card.subtitle}
                    </p>

                    {/* Clickable Brand Filter Shortcuts inside Category Card */}
                    <div className="mt-4 border-t border-zinc-100 pt-3">
                      <span className="block text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                        Top Brands in Category
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {card.featuredBrands.map((brandName) => (
                          <button
                            key={brandName}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToCategory(card.category, { brand: brandName });
                            }}
                            className="border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-800 transition-colors hover:border-zinc-950 hover:bg-zinc-950 hover:text-white"
                          >
                            {brandName}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Full-Width Category Action */}
                <div className="px-5 pb-5">
                  <span className="flex w-full items-center justify-between border border-zinc-950 bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white transition-colors group-hover:bg-zinc-800">
                    <span>Shop {card.title}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom Multi-Buy Bundle & Offers Banner Card */}
        <div className="mt-6 flex flex-col items-start justify-between gap-4 border border-zinc-950 bg-zinc-950 p-6 text-white sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
            <span className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 text-xs font-bold text-zinc-950 w-fit">
              <Sparkles className="h-3.5 w-3.5" />
              <span>MULTI-PACK BUNDLE DEALS</span>
            </span>
            <p className="text-xs sm:text-sm text-zinc-200">
              Save <span className="font-mono-num font-bold text-white">10% on 3-Packs</span> and{' '}
              <span className="font-mono-num font-bold text-white">15% on 5-Pack Boxes</span> across all categories.
            </p>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-zinc-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>ESMA Verified</span>
            </span>
            <button
              type="button"
              onClick={() => navigateToCategory('Offers')}
              className="inline-flex items-center gap-1.5 bg-white px-4 py-2.5 text-xs font-bold text-zinc-950 transition-colors hover:bg-zinc-200 whitespace-nowrap"
            >
              <span>Shop All Special Offers</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
