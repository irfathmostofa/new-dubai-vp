import React from 'react';
import {
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Search,
  Sparkles,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { FEATURED_BRANDS, MEGA_MENU_CONFIG, MOCK_PRODUCTS } from '../data/products';
import { filterProducts, serializeStructuredDataJsonLd } from '../utils/storeLogic';
import { ProductCategory } from '../types/store';
import { ProductCard } from './ProductCard';

const CATEGORY_LIST: ('All' | ProductCategory)[] = [
  'All',
  'Disposable Vape',
  'Pods System',
  'E-Liquid',
  'Vape Kit',
  'Brands',
  'Offers',
];

const NICOTINE_OPTIONS = ['50mg', '20mg', '18mg', '0.4Ω'];

export function CategoryPage() {
  const catalog = useCartStore((state) => state.catalog);
  const activeCategory = useCartStore((state) => state.activeCategory);
  const selectedBrand = useCartStore((state) => state.selectedBrand);
  const nicotineFilter = useCartStore((state) => state.nicotineFilter);
  const onlyOffers = useCartStore((state) => state.onlyOffers);
  const searchQuery = useCartStore((state) => state.searchQuery);
  const sortBy = useCartStore((state) => state.sortBy);

  const navigateToHome = useCartStore((state) => state.navigateToHome);
  const setActiveCategory = useCartStore((state) => state.setActiveCategory);
  const setSelectedBrand = useCartStore((state) => state.setSelectedBrand);
  const setNicotineFilter = useCartStore((state) => state.setNicotineFilter);
  const setOnlyOffers = useCartStore((state) => state.setOnlyOffers);
  const setSearchQuery = useCartStore((state) => state.setSearchQuery);
  const setSortBy = useCartStore((state) => state.setSortBy);
  const resetAllFilters = useCartStore((state) => state.resetAllFilters);

  const filteredProducts = filterProducts(catalog, {
    activeCategory,
    selectedBrand,
    nicotineFilter,
    onlyOffers,
    searchQuery,
    sortBy,
  });

  const categoryMeta =
    activeCategory !== 'All'
      ? MEGA_MENU_CONFIG[activeCategory]
      : {
          tagline: 'Full UAE Vape Catalog · ESMA Verified',
          description:
            'Explore our complete Dubai inventory of high-puff digital disposable vapes, closed pod kits, sub-ohm box mods, and UK/USA salt nicotine e-liquids.',
        };

  const hasActiveFilters =
    activeCategory !== 'All' ||
    Boolean(selectedBrand) ||
    Boolean(nicotineFilter) ||
    onlyOffers ||
    Boolean(searchQuery.trim());

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://vapedubaiking.ae';
  const categoryJsonLd = serializeStructuredDataJsonLd({
    currentView: 'category',
    activeCategory,
    selectedBrand,
    product: filteredProducts[0] || catalog[0] || null,
    categoryProducts: filteredProducts,
    baseUrl: origin,
  });

  return (
    <div data-testid="category-page-view" className="bg-white">
      <script
        data-testid="category-jsonld-script"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: categoryJsonLd }}
      />
      {/* Breadcrumb Bar + Category Header Banner */}
      <div className="border-b border-zinc-200 bg-zinc-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-400">
            <button
              type="button"
              onClick={navigateToHome}
              className="font-medium text-zinc-300 transition-colors hover:text-white"
            >
              Home
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
            <span className="font-semibold text-white">
              {activeCategory === 'All' ? 'All Categories' : activeCategory}
            </span>
            {selectedBrand && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
                <span className="font-semibold text-emerald-400">{selectedBrand}</span>
              </>
            )}
          </nav>

          <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                {categoryMeta.tagline}
              </p>
              <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {activeCategory === 'All' ? 'All Vape Categories' : activeCategory}
                {selectedBrand ? ` · ${selectedBrand}` : ''}
              </h1>
              <p className="mt-2.5 text-sm leading-relaxed text-zinc-300">
                {categoryMeta.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-zinc-800 pt-4 text-xs text-zinc-300 lg:border-t-0 lg:pt-0">
              <div className="flex items-center gap-2 border border-zinc-800 bg-zinc-900 px-3.5 py-2">
                <Truck className="h-4 w-4 text-emerald-400" />
                <span>Same-Day Dubai Courier</span>
              </div>
              <div className="flex items-center gap-2 border border-zinc-800 bg-zinc-900 px-3.5 py-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>100% Authentic ESMA Stock</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Category Layout: Left Faceted Filter Sidebar + Right Product Grid */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left Faceted Sidebar (3 cols on Desktop, compact grid on Mobile/Tablet) */}
          <aside
            aria-label="Category Filters"
            className="lg:col-span-3 space-y-4 lg:space-y-6 border border-zinc-200 bg-zinc-50/70 p-4 sm:p-5 self-start"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-zinc-950 uppercase">
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filter Hardware</span>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-950"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Keyword Filter inside Category */}
            <div>
              <label
                htmlFor="category-search-input"
                className="block text-xs font-bold tracking-wider text-zinc-900 uppercase"
              >
                Keyword or Puff Count
              </label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
                <input
                  id="category-search-input"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. 35000, Lush Ice, Mesh..."
                  className="w-full border border-zinc-300 bg-white py-2 pr-3 pl-9 text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                />
              </div>
            </div>

            {/* 1. Category Department Filter */}
            <div className="border-t border-zinc-200 pt-4 lg:pt-5">
              <h2 className="text-xs font-bold tracking-wider text-zinc-900 uppercase">
                Department
              </h2>
              <div className="mt-2.5 flex gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
                {CATEGORY_LIST.map((cat) => {
                  const active = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`flex shrink-0 lg:w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-zinc-950 text-white'
                          : 'border border-zinc-200 bg-white lg:border-0 lg:bg-transparent text-zinc-700 hover:bg-zinc-200/70 hover:text-zinc-950'
                      }`}
                    >
                      <span>{cat === 'All' ? 'All Departments' : cat}</span>
                      {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Brand Filter */}
            <div className="border-t border-zinc-200 pt-4 lg:pt-5">
              <h2 className="text-xs font-bold tracking-wider text-zinc-900 uppercase">
                Brand
              </h2>
              <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-1.5">
                {FEATURED_BRANDS.map((brand) => {
                  const active = selectedBrand === brand.name;
                  return (
                    <button
                      key={brand.name}
                      type="button"
                      data-testid={`sidebar-brand-${brand.name.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => setSelectedBrand(active ? null : brand.name)}
                      className={`border px-2.5 py-2 text-left text-xs font-semibold transition-colors truncate ${
                        active
                          ? 'border-zinc-950 bg-zinc-950 text-white'
                          : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-950'
                      }`}
                    >
                      {brand.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Nicotine / Resistance Strength Filter */}
            <div className="border-t border-zinc-200 pt-4 lg:pt-5">
              <h2 className="text-xs font-bold tracking-wider text-zinc-900 uppercase">
                Nicotine / Coil Spec
              </h2>
              <div className="mt-2.5 grid grid-cols-4 lg:grid-cols-2 gap-1.5">
                {NICOTINE_OPTIONS.map((nic) => {
                  const active = nicotineFilter === nic;
                  return (
                    <button
                      key={nic}
                      type="button"
                      data-testid={`sidebar-nicotine-${nic}`}
                      onClick={() => setNicotineFilter(active ? null : nic)}
                      className={`font-mono-num border px-2 py-2 text-center text-xs font-bold transition-colors ${
                        active
                          ? 'border-zinc-950 bg-zinc-950 text-white'
                          : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-950'
                      }`}
                    >
                      {nic}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Discounted / Bundle Offers Toggle */}
            <div className="border-t border-zinc-200 pt-4 lg:pt-5">
              <button
                type="button"
                onClick={() => setOnlyOffers(!onlyOffers)}
                className={`flex w-full items-center justify-between border p-3 text-left text-xs font-bold transition-colors ${
                  onlyOffers
                    ? 'border-zinc-950 bg-zinc-950 text-white'
                    : 'border-zinc-200 bg-white text-zinc-900 hover:border-zinc-950'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Special Offers Only</span>
                </span>
                <span className="font-mono-num text-[11px] uppercase">
                  {onlyOffers ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </aside>

          {/* Right Product Listing Column (9 cols on Desktop) */}
          <div className="lg:col-span-9">
            {/* Top Toolbar: Result Count, Active Filter Chips, and Sort Dropdown */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  data-testid="category-product-count"
                  className="font-mono-num text-xs font-bold text-zinc-950"
                >
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
                </span>
                {selectedBrand && (
                  <button
                    type="button"
                    onClick={() => setSelectedBrand(null)}
                    className="inline-flex items-center gap-1.5 border border-zinc-950 bg-zinc-950 px-2.5 py-1 text-xs font-semibold text-white"
                  >
                    <span>Brand: {selectedBrand}</span>
                    <span aria-hidden="true">×</span>
                  </button>
                )}
                {nicotineFilter && (
                  <button
                    type="button"
                    onClick={() => setNicotineFilter(null)}
                    className="inline-flex items-center gap-1.5 border border-zinc-950 bg-zinc-950 px-2.5 py-1 text-xs font-semibold text-white"
                  >
                    <span>Spec: {nicotineFilter}</span>
                    <span aria-hidden="true">×</span>
                  </button>
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="inline-flex items-center gap-1.5 border border-zinc-300 bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-900"
                  >
                    <span>Search: "{searchQuery}"</span>
                    <span aria-hidden="true">×</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="category-sort-select" className="text-xs font-medium text-zinc-600">
                  Sort by:
                </label>
                <select
                  id="category-sort-select"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')
                  }
                  className="border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 focus:border-zinc-950 focus:outline-none"
                >
                  <option value="featured">Featured Bestsellers</option>
                  <option value="price-asc">Price: Low to High (AED)</option>
                  <option value="price-desc">Price: High to Low (AED)</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="mt-8 border border-zinc-200 bg-zinc-50 p-12 text-center">
                <h3 className="font-display text-lg font-bold text-zinc-950">
                  No products match your selected filters
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Try clearing one of your brand or nicotine filters to view available UAE stock.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-5 bg-zinc-950 px-6 py-2.5 text-xs font-bold text-white hover:bg-zinc-800"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
