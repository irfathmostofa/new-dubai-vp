import React, { useEffect, useState } from 'react';
import {
  Search,
  User,
  ShoppingBag,
  Heart,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Layers,
  LayoutDashboard,
  Instagram,
  Send,
  MessageCircle,
  Share2,
  Pin,
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { calculateTotalItems, formatAED } from '../utils/storeLogic';
import { ProductCategory } from '../types/store';
import { MEGA_MENU_CONFIG } from '../data/products';

const NAV_LINKS: ProductCategory[] = [
  'Disposable Vape',
  'Pods System',
  'E-Liquid',
  'Vape Kit',
  'Brands',
  'Offers',
];

const HEADER_SOCIAL_LINKS = [
  {
    name: 'Instagram',
    href: 'https://instagram.com/vapedubaiking',
    label: '@vapedubaiking on Instagram',
  },
  {
    name: 'TikTok',
    href: 'https://tiktok.com/@vapedubaiking',
    label: '@vapedubaiking on TikTok',
  },
  {
    name: 'WhatsApp',
    href: 'https://wa.me/971508429910',
    label: 'WhatsApp UAE Dispatch',
  },
  {
    name: 'Telegram',
    href: 'https://t.me/vapedubaiking',
    label: 'Telegram VIP Channel',
  },
  {
    name: 'X',
    href: 'https://x.com/vapedubaiking',
    label: 'Follow on X',
  },
];

interface HeaderProps {
  onOpenAccount: () => void;
  onNavigateToCatalog: () => void;
}

export function Header({ onOpenAccount, onNavigateToCatalog }: HeaderProps) {
  const catalog = useCartStore((state) => state.catalog);
  const items = useCartStore((state) => state.items);
  const wishlistIds = useCartStore((state) => state.wishlistIds);
  const currentView = useCartStore((state) => state.currentView);
  const activeCategory = useCartStore((state) => state.activeCategory);
  const searchQuery = useCartStore((state) => state.searchQuery);
  const navigateToHome = useCartStore((state) => state.navigateToHome);
  const navigateToCategory = useCartStore((state) => state.navigateToCategory);
  const navigateToProduct = useCartStore((state) => state.navigateToProduct);
  const navigateToAdmin = useCartStore((state) => state.navigateToAdmin);
  const setSearchQuery = useCartStore((state) => state.setSearchQuery);
  const setCartOpen = useCartStore((state) => state.setCartOpen);
  const setWishlistOpen = useCartStore((state) => state.setWishlistOpen);
  const isAdminAuthenticated = useCartStore((state) => state.isAdminAuthenticated);

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMegaMenu, setOpenMegaMenu] = useState<ProductCategory | null>(null);
  const [isMegaMenuPinned, setIsMegaMenuPinned] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const totalItems = calculateTotalItems(items);
  const totalWishlist = wishlistIds.length;

  const handleCategoryPageNavigation = (
    category: 'All' | ProductCategory,
    options?: { brand?: string | null; search?: string }
  ) => {
    setOpenMegaMenu(null);
    setIsMegaMenuPinned(false);
    setIsMobileMenuOpen(false);
    navigateToCategory(category, options);
  };

  const activeMegaData = openMegaMenu ? MEGA_MENU_CONFIG[openMegaMenu] : null;
  const spotlightProduct = activeMegaData
    ? catalog.find((p) => p.id === activeMegaData.spotlightProductId) || catalog[0]
    : null;

  return (
    <div
      data-testid="sticky-header-wrapper"
      className={`sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md transition-shadow duration-200 ${
        isScrolled || openMegaMenu ? 'shadow-lg' : ''
      }`}
      onMouseLeave={() => {
        if (!isMegaMenuPinned) {
          setOpenMegaMenu(null);
        }
      }}
    >
      {/* Top Announcement Bar (Dark) with Social Media Channels */}
      <div className="bg-zinc-950 px-3 py-1.5 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 text-[11px] sm:text-xs font-medium">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <p className="truncate tracking-wide">
              Free shipping on all orders above 350 AED
            </p>
            <span className="hidden md:inline text-zinc-600 shrink-0" aria-hidden="true">
              |
            </span>
            <span className="hidden md:inline text-zinc-300 truncate">
              Cash on delivery available all over UAE
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 sm:gap-4 text-zinc-300">
            {/* Official Header Social Media Bar */}
            <div
              data-testid="header-social-links"
              aria-label="Header social media links"
              className="flex items-center gap-2 sm:gap-2.5"
            >
              <span className="hidden xl:inline text-[11px] text-zinc-400 uppercase tracking-wider">
                Follow UAE Hub:
              </span>
              {HEADER_SOCIAL_LINKS.map((soc) => (
                <a
                  key={soc.name}
                  href={soc.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={soc.label}
                  data-testid={`header-social-${soc.name.toLowerCase()}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-300 transition-colors hover:text-white"
                >
                  {soc.name === 'Instagram' && <Instagram className="h-3 w-3 shrink-0" />}
                  {soc.name === 'WhatsApp' && <MessageCircle className="h-3 w-3 shrink-0" />}
                  {soc.name === 'Telegram' && <Send className="h-3 w-3 shrink-0" />}
                  {(soc.name === 'TikTok' || soc.name === 'X') && (
                    <Share2 className="h-3 w-3 shrink-0" />
                  )}
                  <span className="hidden lg:inline">{soc.name}</span>
                </a>
              ))}
            </div>

            <span className="hidden sm:inline text-zinc-700" aria-hidden="true">
              ·
            </span>
            <button
              type="button"
              onClick={() => handleCategoryPageNavigation('All')}
              className="hidden sm:inline font-semibold text-white underline underline-offset-4 hover:text-zinc-200 whitespace-nowrap"
            >
              Browse Catalog
            </button>
          </div>
        </div>
      </div>

      {/* Main Sticky Header & Sticky Mega Menu Bar */}
      <header className="relative border-b border-zinc-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3.5 lg:gap-4 lg:px-8">
          {/* Left: Mobile Menu Trigger + Text Logo */}
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center border border-zinc-200 text-zinc-900 transition-colors hover:bg-zinc-100 lg:hidden shrink-0"
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>

            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                setOpenMegaMenu(null);
                setIsMegaMenuPinned(false);
                setSearchQuery('');
                navigateToHome();
              }}
              className="font-display text-sm font-bold tracking-tight text-zinc-950 whitespace-nowrap shrink-0 sm:text-lg xl:text-xl"
            >
              Vape Dubai King
            </a>
          </div>

          {/* Center: Desktop Sticky Mega Menu Navigation Links */}
          <nav
            data-testid="sticky-mega-menu-nav"
            aria-label="Main Categories"
            className="hidden lg:flex items-center gap-2.5 xl:gap-4 text-xs xl:text-sm font-medium text-zinc-600 min-w-0"
          >
            {NAV_LINKS.map((link) => {
              const isActive = currentView === 'category' && activeCategory === link;
              const isMenuOpen = openMegaMenu === link;
              return (
                <div
                  key={link}
                  className="relative flex items-center"
                  onMouseEnter={() => {
                    if (!isMegaMenuPinned) {
                      setOpenMegaMenu(link);
                    }
                  }}
                >
                  <button
                    type="button"
                    data-testid={`nav-link-${link.toLowerCase().replace(/\s+/g, '-')}`}
                    aria-expanded={isMenuOpen}
                    onClick={() => {
                      if (openMegaMenu === link && isMegaMenuPinned) {
                        handleCategoryPageNavigation(link);
                      } else {
                        setOpenMegaMenu(link);
                        setIsMegaMenuPinned(true);
                      }
                    }}
                    onDoubleClick={() => handleCategoryPageNavigation(link)}
                    className={`group inline-flex items-center gap-0.5 xl:gap-1 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                      isActive || isMenuOpen
                        ? 'font-semibold text-zinc-950 after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:bg-zinc-950'
                        : 'hover:text-zinc-950'
                    }`}
                  >
                    <span>{link}</span>
                    <ChevronDown
                      className={`h-3 w-3 xl:h-3.5 xl:w-3.5 text-zinc-400 transition-transform duration-150 group-hover:text-zinc-950 ${
                        isMenuOpen ? 'rotate-180 text-zinc-950' : ''
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </nav>

          {/* Right: Search, Admin Panel, Wishlist, Account/Track Order, and Cart Icon */}
          <div className="flex items-center gap-1 sm:gap-1.5 xl:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsSearchExpanded((prev) => !prev);
                if (!isSearchExpanded && currentView === 'home') {
                  onNavigateToCatalog();
                }
              }}
              aria-label="Toggle product search"
              aria-expanded={isSearchExpanded}
              className={`inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center border transition-colors shrink-0 ${
                isSearchExpanded || searchQuery
                  ? 'border-zinc-950 bg-zinc-950 text-white'
                  : 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            {isAdminAuthenticated && (
              <a
                href="/admin"
                data-testid="header-admin-btn"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenMegaMenu(null);
                  setIsMegaMenuPinned(false);
                  navigateToAdmin();
                }}
                aria-label="Return to Admin Dashboard (/admin)"
                className="inline-flex h-8 w-8 sm:h-9 sm:w-auto items-center justify-center gap-1.5 border border-emerald-600 bg-emerald-950 text-emerald-300 sm:px-2.5 text-xs font-semibold transition-colors hover:bg-emerald-900 whitespace-nowrap shrink-0"
              >
                <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden xl:inline">Dashboard</span>
              </a>
            )}

            <button
              type="button"
              data-testid="header-wishlist-btn"
              onClick={() => setWishlistOpen(true)}
              aria-label={`Open saved wishlist (${totalWishlist} items)`}
              className="relative inline-flex h-8 sm:h-9 items-center gap-1 border border-zinc-200 bg-white px-1.5 sm:px-2.5 text-xs font-semibold text-zinc-900 transition-colors hover:border-zinc-950 hover:bg-zinc-50 whitespace-nowrap shrink-0"
            >
              <Heart
                className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${
                  totalWishlist > 0 ? 'fill-zinc-950 text-zinc-950' : 'text-zinc-900'
                }`}
              />
              <span className="hidden 2xl:inline">Wishlist</span>
              <span
                data-testid="wishlist-count-badge"
                className="font-mono-num inline-flex h-4 min-w-4 sm:h-5 sm:min-w-5 items-center justify-center bg-zinc-100 px-1 text-[10px] sm:text-xs font-bold text-zinc-950"
              >
                {totalWishlist}
              </span>
            </button>

            <button
              type="button"
              data-testid="header-account-btn"
              onClick={onOpenAccount}
              aria-label="Account and Order Tracking"
              className="inline-flex h-8 w-8 sm:h-9 sm:w-auto items-center justify-center gap-1.5 border border-zinc-200 bg-white sm:px-2.5 text-xs font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 whitespace-nowrap shrink-0"
            >
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden xl:inline">Account</span>
            </button>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Open shopping cart (${totalItems} items)`}
              className="relative inline-flex h-8 sm:h-9 items-center gap-1.5 bg-zinc-950 px-2 sm:px-3 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden sm:inline">Cart</span>
              <span
                data-testid="cart-count-badge"
                className="font-mono-num inline-flex h-4 min-w-4 sm:h-5 sm:min-w-5 items-center justify-center bg-white px-1 text-[10px] sm:text-xs font-bold text-zinc-950"
              >
                {totalItems}
              </span>
            </button>
          </div>
        </div>

        {/* Full-Width Sticky Mega Menu Panel (Sticks directly to the sticky header across scroll depths) */}
        {openMegaMenu && activeMegaData && spotlightProduct && (
          <div
            data-testid="mega-menu-panel"
            role="region"
            aria-label={`${openMegaMenu} Sticky Mega Menu`}
            className="absolute top-full right-0 left-0 z-50 max-h-[calc(100vh-5rem)] overflow-y-auto border-b-2 border-zinc-950 bg-white/98 backdrop-blur-md shadow-2xl"
          >
            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
              <div className="mb-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  data-testid="pin-mega-menu-btn"
                  onClick={() => setIsMegaMenuPinned((prev) => !prev)}
                  className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-bold uppercase transition-colors ${
                    isMegaMenuPinned
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                      : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-950'
                  }`}
                >
                  <Pin className="h-2.5 w-2.5" />
                  <span>{isMegaMenuPinned ? 'Sticky Pinned' : 'Pin Menu'}</span>
                </button>
                <button
                  type="button"
                  data-testid="close-mega-menu-btn"
                  onClick={() => {
                    setOpenMegaMenu(null);
                    setIsMegaMenuPinned(false);
                  }}
                  aria-label="Close mega menu"
                  className="inline-flex items-center gap-1 bg-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-900 hover:bg-zinc-950 hover:text-white"
                >
                  <X className="h-2.5 w-2.5" />
                  <span>Close</span>
                </button>
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
                {/* Column 1 (3 cols): Category Overview & Direct Category Page CTA */}
                <div className="lg:col-span-3 flex flex-col justify-between border-b border-zinc-200 pb-5 lg:border-r lg:border-b-0 lg:pb-0 lg:pr-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                      <Layers className="h-3.5 w-3.5 text-zinc-950" />
                      <span>{activeMegaData.tagline}</span>
                    </div>
                    <h3 className="mt-2 font-display text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
                      {openMegaMenu}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                      {activeMegaData.description}
                    </p>
                  </div>

                  <div className="mt-5 space-y-2 pt-4 border-t border-zinc-100">
                    <button
                      type="button"
                      data-testid="mega-menu-view-category-btn"
                      onClick={() => handleCategoryPageNavigation(openMegaMenu)}
                      className="flex w-full items-center justify-between bg-zinc-950 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-zinc-800"
                    >
                      <span>Open {openMegaMenu} Page</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCategoryPageNavigation('All')}
                      className="flex w-full items-center justify-between border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-800 transition-colors hover:border-zinc-950 hover:text-zinc-950"
                    >
                      <span>View All Categories</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Columns 2 & 3 (5 cols): Subcategory & Brand Columns */}
                <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {activeMegaData.columns.map((col) => (
                    <div key={col.heading}>
                      <h4 className="border-b border-zinc-200 pb-2 text-xs font-bold tracking-wider text-zinc-950 uppercase">
                        {col.heading}
                      </h4>
                      <ul className="mt-3 space-y-2.5">
                        {col.links.map((item) => (
                          <li key={item.label}>
                            <button
                              type="button"
                              onClick={() =>
                                handleCategoryPageNavigation(openMegaMenu, {
                                  brand: item.brand ?? null,
                                  search: item.search ?? '',
                                })
                              }
                              className="group flex w-full flex-col items-start py-1 text-left transition-colors"
                            >
                              <span className="text-xs font-semibold text-zinc-900 group-hover:underline underline-offset-4">
                                {item.label}
                              </span>
                              <span className="text-[11px] text-zinc-500 group-hover:text-zinc-800">
                                {item.subtext}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Column 4 (4 cols): Spotlight Product Card inside Mega Menu */}
                <div className="lg:col-span-4 border-t border-zinc-200 pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                      <Sparkles className="h-3.5 w-3.5 text-zinc-950" />
                      <span>Featured Spotlight</span>
                    </span>
                    <span className="font-mono-num text-xs font-bold text-zinc-950">
                      {formatAED(spotlightProduct.price)}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-4 border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:border-zinc-950">
                    <img
                      src={spotlightProduct.image}
                      alt={spotlightProduct.title}
                      className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 border border-zinc-200 bg-white object-cover"
                    />
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div>
                        <p className="text-[11px] font-semibold text-zinc-500 truncate">
                          {spotlightProduct.brand} · {spotlightProduct.puffCount}
                        </p>
                        <h5 className="mt-0.5 line-clamp-2 font-display text-sm font-bold text-zinc-950">
                          {spotlightProduct.title}
                        </h5>
                        <p className="mt-1 text-xs text-zinc-600 truncate">
                          {spotlightProduct.variants.flavors.length} Flavours ·{' '}
                          {spotlightProduct.variants.nicotineOptions.join(' / ')}
                        </p>
                      </div>

                      <button
                        type="button"
                        data-testid="mega-menu-spotlight-product-btn"
                        onClick={() => {
                          setOpenMegaMenu(null);
                          setIsMegaMenuPinned(false);
                          navigateToProduct(spotlightProduct.id);
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-zinc-950 underline underline-offset-4 hover:text-zinc-700"
                      >
                        <span>Choose Variant & Inspect</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expandable Search Bar */}
        {isSearchExpanded && (
          <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-3 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl items-center gap-3">
              <Search className="h-4 w-4 text-zinc-500 shrink-0" />
              <label htmlFor="global-product-search" className="sr-only">
                Search vapes, pods, e-liquids, or brands
              </label>
              <input
                id="global-product-search"
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (currentView !== 'category') {
                    navigateToCategory('All', { search: e.target.value });
                  }
                }}
                placeholder="Search Elf Bar 10000, Juul 2, Pod Salt 35K, flavours..."
                className="w-full bg-transparent text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 whitespace-nowrap"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile Hamburger Drawer with Subcategories & Social Links */}
        {isMobileMenuOpen && (
          <nav
            aria-label="Mobile Navigation"
            className="border-t border-zinc-200 bg-white px-4 py-4 lg:hidden"
          >
            <div className="mb-3 border-b border-zinc-100 pb-3 text-xs font-medium text-zinc-500">
              Cash on delivery available all over UAE · Same-day Dubai dispatch
            </div>
            <div className="flex flex-col space-y-1">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateToHome();
                }}
                className={`flex items-center justify-between px-3 py-2.5 text-left text-sm font-semibold ${
                  currentView === 'home'
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <span>Storefront Home</span>
              </button>
              <a
                href="/admin"
                onClick={(e) => {
                  e.preventDefault();
                  setIsMobileMenuOpen(false);
                  navigateToAdmin();
                }}
                className={`flex items-center justify-between px-3 py-2.5 text-left text-sm font-semibold ${
                  currentView === 'admin'
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <span>Admin Portal (/admin)</span>
                <LayoutDashboard className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => handleCategoryPageNavigation('All')}
                className={`flex items-center justify-between px-3 py-2.5 text-left text-sm font-semibold ${
                  currentView === 'category' && activeCategory === 'All'
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <span>All Categories Catalog</span>
              </button>
              {NAV_LINKS.map((link) => (
                <button
                  key={link}
                  type="button"
                  onClick={() => handleCategoryPageNavigation(link)}
                  className={`flex items-center justify-between px-3 py-2.5 text-left text-sm font-semibold ${
                    currentView === 'category' && activeCategory === link
                      ? 'bg-zinc-950 text-white'
                      : 'text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <span>{link}</span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-60" />
                </button>
              ))}
            </div>
          </nav>
        )}
      </header>
    </div>
  );
}
