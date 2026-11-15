/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { AgeVerificationModal } from './components/AgeVerificationModal';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { PopularCategoriesSection } from './components/PopularCategoriesSection';
import { ProductCard } from './components/ProductCard';
import { CategoryPage } from './components/CategoryPage';
import { ProductPage } from './components/ProductPage';
import { AdminPanelPage } from './components/AdminPanelPage';
import { CartSheet } from './components/CartSheet';
import { WishlistSheet } from './components/WishlistSheet';
import { ProductQuickViewModal } from './components/ProductQuickViewModal';
import { AccountModal } from './components/AccountModal';
import { MarketingInactivityPopup } from './components/MarketingInactivityPopup';
import { HealthWarningBanner } from './components/HealthWarningBanner';
import { RecentlyViewedSection } from './components/RecentlyViewedSection';
import { Footer } from './components/Footer';
import { FEATURED_BRANDS } from './data/products';
import { useCartStore } from './store/useCartStore';
import {
  buildSeoMetadata,
  filterProducts,
  serializeStructuredDataJsonLd,
} from './utils/storeLogic';
import { ProductCategory } from './types/store';

const FILTER_TABS: ('All' | ProductCategory)[] = [
  'All',
  'Disposable Vape',
  'Pods System',
  'E-Liquid',
  'Vape Kit',
  'Brands',
  'Offers',
];

function upsertMetaTag(attrName: 'name' | 'property', attrValue: string, content: string) {
  if (typeof document === 'undefined') return;
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrValue}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertJsonLdScript(jsonContent: string) {
  if (typeof document === 'undefined') return;
  let script = document.head.querySelector<HTMLScriptElement>('#vdk-jsonld-structured-data');
  if (!script) {
    script = document.createElement('script');
    script.id = 'vdk-jsonld-structured-data';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.setAttribute('data-testid', 'head-jsonld-structured-data');
  script.textContent = jsonContent;
}

export default function App() {
  const catalogRef = useRef<HTMLElement | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const catalog = useCartStore((state) => state.catalog);
  const currentView = useCartStore((state) => state.currentView);
  const selectedProductId = useCartStore((state) => state.selectedProductId);
  const activeCategory = useCartStore((state) => state.activeCategory);
  const selectedBrand = useCartStore((state) => state.selectedBrand);
  const nicotineFilter = useCartStore((state) => state.nicotineFilter);
  const onlyOffers = useCartStore((state) => state.onlyOffers);
  const searchQuery = useCartStore((state) => state.searchQuery);
  const sortBy = useCartStore((state) => state.sortBy);

  const setActiveCategory = useCartStore((state) => state.setActiveCategory);
  const setSelectedBrand = useCartStore((state) => state.setSelectedBrand);
  const setSearchQuery = useCartStore((state) => state.setSearchQuery);
  const setSortBy = useCartStore((state) => state.setSortBy);
  const navigateToCategory = useCartStore((state) => state.navigateToCategory);
  const syncViewFromLocation = useCartStore((state) => state.syncViewFromLocation);
  const bootstrapFromBackend = useCartStore((state) => state.bootstrapFromBackend);
  const initAuth = useCartStore((state) => state.initAuth);

  useEffect(() => {
    bootstrapFromBackend();
    // Subscribes to Supabase Auth (restores any saved session, handles Google redirects).
    return initAuth();
  }, [bootstrapFromBackend, initAuth]);

  useEffect(() => {
    syncViewFromLocation();
    const handlePopState = () => syncViewFromLocation();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncViewFromLocation]);

  const filteredProducts = useMemo(
    () =>
      filterProducts(catalog, {
        activeCategory,
        selectedBrand,
        nicotineFilter,
        onlyOffers,
        searchQuery,
        sortBy,
      }),
    [catalog, activeCategory, selectedBrand, nicotineFilter, onlyOffers, searchQuery, sortBy]
  );

  // Dynamically update document.title, SEO / OpenGraph / Twitter meta descriptions, and Schema.org JSON-LD
  useEffect(() => {
    const activeProduct =
      catalog.find((p) => p.id === selectedProductId) || catalog[0] || null;
    const seo = buildSeoMetadata({
      currentView,
      activeCategory,
      selectedBrand,
      product: activeProduct,
    });

    document.title = seo.title;
    upsertMetaTag('name', 'description', seo.description);
    upsertMetaTag('property', 'og:title', seo.title);
    upsertMetaTag('property', 'og:description', seo.description);
    upsertMetaTag('property', 'og:site_name', 'Vape Dubai King');
    upsertMetaTag('name', 'twitter:title', seo.title);
    upsertMetaTag('name', 'twitter:description', seo.description);

    if (currentView !== 'product') {
      const origin =
        typeof window !== 'undefined' ? window.location.origin : 'https://vapedubaiking.ae';
      const jsonLdString = serializeStructuredDataJsonLd({
        currentView,
        activeCategory,
        selectedBrand,
        product: activeProduct,
        categoryProducts: filteredProducts,
        baseUrl: origin,
      });
      upsertJsonLdScript(jsonLdString);
    }
  }, [
    currentView,
    activeCategory,
    selectedBrand,
    selectedProductId,
    catalog,
    filteredProducts,
  ]);

  const scrollToCatalog = () => {
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectCategory = (category: 'All' | ProductCategory) => {
    navigateToCategory(category);
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-white text-zinc-950">
      {/* 1. Strict Age Verification Modal (Storefront Views) */}
      {currentView !== 'admin' && <AgeVerificationModal />}

      {/* 2. 30-Second Inactivity Marketing Popup (Storefront Views) */}
      {currentView !== 'admin' && <MarketingInactivityPopup />}

      {/* 3. Global Header, Announcement Bar, Social Links & Mega Menus (Storefront Views) */}
      {currentView !== 'admin' && (
        <Header
          onOpenAccount={() => setIsAccountOpen(true)}
          onNavigateToCatalog={scrollToCatalog}
        />
      )}

      {/* Main Content Area with Framer Motion AnimatePresence Fade-and-Slide View Transition Wrapper */}
      <main className="flex-1 overflow-x-clip">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentView}
            data-testid={`view-transition-wrapper-${currentView}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            {currentView === 'home' && (
              <>
                {/* Split / Grid Hero Section with Scroll-Reactive Three.js 3D Hardware Showcase */}
                <HeroSection onSelectCategory={handleSelectCategory} />

                {/* Popular Category Cards Section on Home Page */}
                <PopularCategoriesSection />

                {/* Featured Catalog Section & Product Grid */}
                <section
                  ref={catalogRef}
                  aria-labelledby="catalog-heading"
                  className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
                >
                  {/* Section Header & Controls */}
                  <div className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:gap-6 sm:pb-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[11px] sm:text-xs font-semibold tracking-widest text-zinc-500 uppercase">
                        UAE Express Storefront · Genuine Hardware
                      </p>
                      <h2
                        id="catalog-heading"
                        className="mt-1 font-display text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl"
                      >
                        {activeCategory === 'All' ? 'Featured Vape Collection' : activeCategory}
                        {selectedBrand ? ` — ${selectedBrand}` : ''}
                      </h2>
                    </div>

                    {/* Sort, Active Count & Full Category Page Button */}
                    <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-start sm:gap-4">
                      <span className="font-mono-num text-xs text-zinc-500">
                        Showing {filteredProducts.length} of {catalog.length} products
                      </span>

                      <div className="flex items-center gap-2">
                        <label htmlFor="sort-select" className="text-xs font-medium text-zinc-600 whitespace-nowrap">
                          Sort by:
                        </label>
                        <select
                          id="sort-select"
                          value={sortBy}
                          onChange={(e) =>
                            setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')
                          }
                          className="border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-900 focus:border-zinc-950 focus:outline-none"
                        >
                          <option value="featured">Featured Bestsellers</option>
                          <option value="price-asc">Price: Low to High (AED)</option>
                          <option value="price-desc">Price: High to Low (AED)</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        data-testid="open-full-category-page-btn"
                        onClick={() => navigateToCategory(activeCategory)}
                        className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 border border-zinc-950 bg-zinc-950 px-3.5 py-2 sm:py-1.5 text-xs font-bold text-white transition-colors hover:bg-zinc-800 whitespace-nowrap"
                      >
                        <span>Open Category Page</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Interactive Category Segmented Filter Bar */}
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
                    <div
                      role="tablist"
                      aria-label="Product category filter"
                      className="flex w-full overflow-x-auto no-scrollbar sm:w-auto sm:flex-wrap items-center gap-1.5 bg-zinc-100 p-1"
                    >
                      {FILTER_TABS.map((tab) => {
                        const active = activeCategory === tab;
                        return (
                          <button
                            key={tab}
                            role="tab"
                            aria-selected={active}
                            type="button"
                            onClick={() => setActiveCategory(tab)}
                            className={`px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                              active
                                ? 'bg-zinc-950 text-white shadow-xs'
                                : 'text-zinc-600 hover:text-zinc-950'
                            }`}
                          >
                            {tab}
                          </button>
                        );
                      })}
                    </div>

                    {(selectedBrand || searchQuery || activeCategory !== 'All') && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCategory('All');
                          setSelectedBrand(null);
                          setSearchQuery('');
                        }}
                        className="self-start sm:self-auto text-xs font-semibold text-zinc-600 underline underline-offset-4 hover:text-zinc-950 whitespace-nowrap"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>

                  {/* Interactive Brand Selector Strip */}
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5 lg:grid-cols-8">
                    {FEATURED_BRANDS.map((b) => {
                      const isSelected = selectedBrand === b.name;
                      return (
                        <button
                          key={b.name}
                          type="button"
                          onClick={() => setSelectedBrand(isSelected ? null : b.name)}
                          className={`flex flex-col items-start justify-between border p-2.5 text-left transition-colors min-w-0 ${
                            isSelected
                              ? 'border-zinc-950 bg-zinc-950 text-white'
                              : 'border-zinc-200 bg-zinc-50 text-zinc-900 hover:border-zinc-950'
                          }`}
                        >
                          <span className="font-display text-xs font-bold truncate w-full">{b.name}</span>
                          <span
                            className={`mt-0.5 text-[11px] truncate w-full ${
                              isSelected ? 'text-zinc-300' : 'text-zinc-500'
                            }`}
                          >
                            {b.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Product Grid (3 Columns Desktop, 2 Tablet, 1 Mobile) */}
                  {filteredProducts.length === 0 ? (
                    <div className="mt-8 border border-zinc-200 bg-zinc-50 p-12 text-center">
                      <h3 className="font-display text-lg font-bold text-zinc-950">
                        No matching vape products found
                      </h3>
                      <p className="mt-1 text-xs text-zinc-500">
                        Try clearing your search filter or switching to All Products.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCategory('All');
                          setSelectedBrand(null);
                          setSearchQuery('');
                        }}
                        className="mt-5 bg-zinc-950 px-6 py-2.5 text-xs font-bold text-white hover:bg-zinc-800"
                      >
                        Show All Products
                      </button>
                    </div>
                  ) : (
                    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
                      {filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}

            {currentView === 'category' && <CategoryPage />}

            {currentView === 'product' && <ProductPage />}

            {currentView === 'admin' && <AdminPanelPage />}
          </motion.div>
        </AnimatePresence>

        {/* Recently Viewed Products Section at Bottom of Main Content Area on Storefront Views */}
        {currentView !== 'admin' && <RecentlyViewedSection />}
      </main>

      {/* Slide-Out Cart Drawer & Slide-Out Wishlist Drawer */}
      <CartSheet />
      <WishlistSheet />

      {/* Product Quick View Modal & Customer Account / Real-Time Order Tracking Modal */}
      <ProductQuickViewModal />
      <AccountModal open={isAccountOpen} onClose={() => setIsAccountOpen(false)} />

      {/* Prominent Health Warning Banner & 4-Column Footer on Storefront Views */}
      {currentView !== 'admin' && <HealthWarningBanner />}
      {currentView !== 'admin' && <Footer onSelectCategory={handleSelectCategory} />}
    </div>
  );
}
