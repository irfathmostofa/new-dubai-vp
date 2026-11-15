import React, { useEffect, useState } from 'react';
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Check,
  Truck,
  ShieldCheck,
  Banknote,
  ArrowLeft,
  Layers,
  Heart,
  FileText,
  Sparkles,
  PackageCheck,
  Cpu,
  Link2,
  Share2,
  MessageCircle,
  Send,
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { PACK_OPTIONS } from '../data/products';
import {
  calculateVariantPrice,
  formatAED,
  isProductWishlisted,
  serializeStructuredDataJsonLd,
} from '../utils/storeLogic';
import { PackTierId, SelectedVariant } from '../types/store';
import { ProductCard } from './ProductCard';

export function ProductPage() {
  const catalog = useCartStore((state) => state.catalog);
  const selectedProductId = useCartStore((state) => state.selectedProductId);
  const addItem = useCartStore((state) => state.addItem);
  const wishlistIds = useCartStore((state) => state.wishlistIds);
  const toggleWishlist = useCartStore((state) => state.toggleWishlist);
  const setCartOpen = useCartStore((state) => state.setCartOpen);
  const navigateToHome = useCartStore((state) => state.navigateToHome);
  const navigateToCategory = useCartStore((state) => state.navigateToCategory);

  const product =
    catalog.find((p) => p.id === selectedProductId) || catalog[0];

  const isWishlisted = isProductWishlisted(wishlistIds, product.id);

  const [selectedFlavor, setSelectedFlavor] = useState<string>(
    product.variants.flavors[0] || product.flavorProfile
  );
  const [selectedNicotine, setSelectedNicotine] = useState<string>(
    product.variants.nicotineOptions[0] || product.nicotineStrength
  );
  const [selectedPackId, setSelectedPackId] = useState<PackTierId>('single');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [justAdded, setJustAdded] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);

  // Sync default variant state whenever user switches to a different product on the PDP
  useEffect(() => {
    setSelectedFlavor(product.variants.flavors[0] || product.flavorProfile);
    setSelectedNicotine(product.variants.nicotineOptions[0] || product.nicotineStrength);
    setSelectedPackId('single');
    setQuantity(1);
    setActiveImageIndex(0);
    setJustAdded(false);
    setLinkCopied(false);
  }, [product.id, product.flavorProfile, product.nicotineStrength, product.variants]);

  const activePackOption =
    PACK_OPTIONS.find((p) => p.id === selectedPackId) || PACK_OPTIONS[0];
  const variantUnitPrice = calculateVariantPrice(product.price, selectedPackId);
  const totalSelectionPrice = variantUnitPrice * quantity;
  const singleEquivalentTotal =
    product.price * activePackOption.units * quantity;
  const totalSavings = Math.max(0, singleEquivalentTotal - totalSelectionPrice);

  const shareableProductUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?product=${encodeURIComponent(product.id)}&flavor=${encodeURIComponent(selectedFlavor)}`
      : `https://vapedubaiking.ae/?product=${product.id}`;

  const shareText = `Check out ${product.title} (${selectedFlavor} · ${selectedNicotine}) for ${formatAED(variantUnitPrice)} at Vape Dubai King UAE!`;

  const handleCopyProductLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareableProductUrl);
      }
    } catch {
      // Clipboard fallback inside iframe environments
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const buildSelectedVariant = (): SelectedVariant => ({
    flavor: selectedFlavor,
    nicotine: selectedNicotine,
    packId: selectedPackId,
    packLabel: activePackOption.label,
    unitPrice: variantUnitPrice,
  });

  const handleAddVariantToCart = () => {
    addItem(product, quantity, buildSelectedVariant());
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const handleBuyNowCOD = () => {
    addItem(product, quantity, buildSelectedVariant());
    setCartOpen(true);
  };

  const relatedProducts = catalog
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const galleryImages =
    product.gallery && product.gallery.length > 0 ? product.gallery : [product.image];

  const GALLERY_ANGLE_LABELS = [
    'Studio Front View',
    'Digital Telemetry & Mesh Detail',
    'UAE Packaging & Kit View',
  ];

  const longParagraphs =
    product.longDescription && product.longDescription.length > 0
      ? product.longDescription
      : [product.description];

  const highlightsList =
    product.highlights && product.highlights.length > 0
      ? product.highlights
      : [
          'Official ESMA UAE verified stock with hologram security seal',
          'Engineered for consistent flavor output and zero leakage',
          'Same-day Dubai courier dispatch with Cash on Delivery option',
        ];

  const boxContentsList =
    product.boxContents && product.boxContents.length > 0
      ? product.boxContents
      : [
          `1× ${product.title}`,
          '1× Official UAE Excise Tax Stamp & Authenticity QR Code',
          '1× User Safety & Compliance Manual',
        ];

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://vapedubaiking.ae';
  const productJsonLd = serializeStructuredDataJsonLd({
    currentView: 'product',
    activeCategory: product.category,
    product,
    selectedVariant: {
      flavor: selectedFlavor,
      nicotine: selectedNicotine,
      packLabel: activePackOption.label,
      unitPrice: variantUnitPrice,
    },
    baseUrl: origin,
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const headScript = document.head.querySelector<HTMLScriptElement>(
      '#vdk-jsonld-structured-data'
    );
    if (headScript) {
      headScript.textContent = productJsonLd;
    }
  }, [productJsonLd]);

  return (
    <div data-testid="product-page-view" className="bg-white">
      <script
        data-testid="product-jsonld-script"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: productJsonLd }}
      />
      {/* Top Breadcrumb Bar */}
      <div className="border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={navigateToHome}
              className="font-medium text-zinc-500 transition-colors hover:text-zinc-950"
            >
              Home
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            <button
              type="button"
              onClick={() => navigateToCategory(product.category)}
              className="font-medium text-zinc-500 transition-colors hover:text-zinc-950"
            >
              {product.category}
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            <span className="font-semibold text-zinc-950">{product.title}</span>
          </nav>

          <button
            type="button"
            onClick={() => navigateToCategory(product.category)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to {product.category}</span>
          </button>
        </div>
      </div>

      {/* Main PDP Split Layout: Left Sticky Gallery + Right Contiguous Purchase Module */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Column (6 cols): Sticky Studio Gallery & Quick Telemetry */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <div className="border border-zinc-200 bg-zinc-100 overflow-hidden">
              <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
                <img
                  src={galleryImages[activeImageIndex] || product.image}
                  alt={`${product.title} - ${selectedFlavor}`}
                  className="h-full w-full object-cover object-center transition-all duration-300"
                />
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-zinc-950 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-bold text-white max-w-[55%] truncate">
                  {product.brand} · {product.puffCount}
                </div>
                <button
                  type="button"
                  data-testid="pdp-wishlist-toggle-btn"
                  onClick={() => toggleWishlist(product.id)}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  className={`absolute top-3 right-3 sm:top-4 sm:right-4 inline-flex items-center gap-1.5 border px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-bold transition-colors ${
                    isWishlisted
                      ? 'border-zinc-950 bg-zinc-950 text-white'
                      : 'border-zinc-200 bg-white/95 text-zinc-900 hover:border-zinc-950'
                  }`}
                >
                  <Heart className={`h-3.5 w-3.5 shrink-0 ${isWishlisted ? 'fill-white' : ''}`} />
                  <span className="hidden xs:inline sm:inline">
                    {isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
                  </span>
                </button>
                <div className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 border border-zinc-200 bg-white/95 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-zinc-900">
                  {GALLERY_ANGLE_LABELS[activeImageIndex] || 'Studio View'}
                </div>
              </div>
            </div>

            {/* Interactive Gallery Angle Thumbnails */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {galleryImages.map((imgUrl, idx) => {
                const isSelected = activeImageIndex === idx;
                return (
                  <button
                    key={`${product.id}-thumb-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`group flex flex-col overflow-hidden border text-left transition-all ${
                      isSelected
                        ? 'border-zinc-950 ring-1 ring-zinc-950'
                        : 'border-zinc-200 opacity-75 hover:opacity-100 hover:border-zinc-400'
                    }`}
                  >
                    <div className="aspect-4/3 w-full overflow-hidden bg-zinc-100">
                      <img
                        src={imgUrl}
                        alt={`${product.title} view ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="bg-white px-2 py-1.5 text-[10px] sm:text-[11px] font-semibold text-zinc-800 truncate w-full">
                      {GALLERY_ANGLE_LABELS[idx] || `Angle ${idx + 1}`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Hardware Specs Summary Box */}
            <div className="border border-zinc-200 bg-zinc-50 p-4 sm:p-6">
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-zinc-950 uppercase">
                <Cpu className="h-4 w-4" />
                <span>Hardware Telemetry Summary</span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-zinc-200 pt-4 text-xs sm:grid-cols-4">
                <div>
                  <dt className="text-zinc-500">Output / Puffs</dt>
                  <dd className="mt-0.5 font-mono-num font-bold text-zinc-950">
                    {product.puffCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Battery</dt>
                  <dd className="mt-0.5 font-mono-num font-bold text-zinc-950">
                    {product.specs.battery}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">E-Liquid / Pod</dt>
                  <dd className="mt-0.5 font-mono-num font-bold text-zinc-950">
                    {product.specs.capacity}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Display / Coil</dt>
                  <dd className="mt-0.5 font-semibold text-zinc-950">
                    {product.specs.display}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Right Column (6 cols): Contiguous Purchase Module with Variant Pickers & Share Bar */}
          <div className="lg:col-span-6">
            <div className="border border-zinc-200 bg-white p-4 sm:p-6 lg:p-8">
              {/* Brand & Stock Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                  {product.brand} Official UAE Stock
                </span>
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  <span>In Stock · Ready for Dubai Dispatch</span>
                </span>
              </div>

              {/* Product Title */}
              <h1 className="mt-2 font-display text-xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                {product.title}
              </h1>

              {/* Executive Summary */}
              <p className="mt-2.5 text-xs leading-relaxed text-zinc-600">
                {product.description}
              </p>

              {/* Dynamic Variant Price Display */}
              <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3 border-y border-zinc-200 py-4">
                <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3">
                  <span
                    data-testid="pdp-variant-price"
                    className="font-mono-num text-2xl font-bold text-zinc-950 sm:text-3xl"
                  >
                    {formatAED(variantUnitPrice)}
                  </span>
                  {selectedPackId === 'single' && product.originalPrice && (
                    <span className="font-mono-num text-sm text-zinc-400 line-through">
                      {formatAED(product.originalPrice)}
                    </span>
                  )}
                  {selectedPackId !== 'single' && (
                    <span className="font-mono-num text-xs font-semibold text-emerald-700">
                      Save {formatAED(totalSavings)} ({activePackOption.badge})
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-zinc-500">
                  VAT Included · Cash on Delivery Eligible
                </span>
              </div>

              {/* Selected Variant Live Summary Bar */}
              <div
                data-testid="pdp-selected-variant-summary"
                className="mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2 bg-zinc-100 px-3 py-2.5 text-xs text-zinc-800"
              >
                <Layers className="h-3.5 w-3.5 text-zinc-950 shrink-0" />
                <span className="font-semibold text-zinc-950">Selected Variant:</span>
                <span>{selectedFlavor}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num font-semibold">{selectedNicotine}</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold">{activePackOption.label}</span>
              </div>

              {/* VARIANT SELECTOR 1: Choose Flavour / Finish */}
              <div className="mt-6">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold tracking-wider text-zinc-950 uppercase">
                    1. Choose Flavour / Finish
                  </label>
                  <span className="text-xs font-semibold text-zinc-600 truncate">{selectedFlavor}</span>
                </div>
                <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {product.variants.flavors.map((flavor) => {
                    const active = selectedFlavor === flavor;
                    return (
                      <button
                        key={flavor}
                        type="button"
                        data-testid={`variant-flavor-${flavor.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                        onClick={() => setSelectedFlavor(flavor)}
                        className={`flex items-center justify-between border px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                          active
                            ? 'border-zinc-950 bg-zinc-950 text-white'
                            : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-950'
                        }`}
                      >
                        <span className="truncate">{flavor}</span>
                        {active && <Check className="h-3.5 w-3.5 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* VARIANT SELECTOR 2: Choose Nicotine Strength / Resistance */}
              <div className="mt-6">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold tracking-wider text-zinc-950 uppercase">
                    2. Choose Nicotine / Spec
                  </label>
                  <span className="font-mono-num text-xs font-semibold text-zinc-600">
                    {selectedNicotine}
                  </span>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {product.variants.nicotineOptions.map((nic) => {
                    const active = selectedNicotine === nic;
                    return (
                      <button
                        key={nic}
                        type="button"
                        data-testid={`variant-nicotine-${nic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                        onClick={() => setSelectedNicotine(nic)}
                        className={`font-mono-num flex items-center justify-between border px-3 py-2.5 text-xs font-bold transition-colors ${
                          active
                            ? 'border-zinc-950 bg-zinc-950 text-white'
                            : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-950'
                        }`}
                      >
                        <span className="truncate">{nic}</span>
                        {active && <Check className="h-3.5 w-3.5 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* VARIANT SELECTOR 3: Choose Pack Size / Bundle Tier */}
              <div className="mt-6">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold tracking-wider text-zinc-950 uppercase">
                    3. Choose Pack Bundle Tier
                  </label>
                  <span className="text-xs font-semibold text-zinc-600">
                    Multi-pack UAE savings
                  </span>
                </div>
                <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {PACK_OPTIONS.map((pack) => {
                    const active = selectedPackId === pack.id;
                    const tierPrice = calculateVariantPrice(product.price, pack.id);
                    return (
                      <button
                        key={pack.id}
                        type="button"
                        data-testid={`variant-pack-${pack.id}`}
                        onClick={() => setSelectedPackId(pack.id)}
                        className={`flex flex-col justify-between border p-3.5 text-left transition-colors ${
                          active
                            ? 'border-zinc-950 bg-zinc-950 text-white'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-900 hover:border-zinc-950'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold">{pack.label}</span>
                          {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                        </div>
                        <div className="mt-2 flex items-baseline justify-between gap-2">
                          <span className="font-mono-num text-sm font-bold">
                            {formatAED(tierPrice)}
                          </span>
                          <span
                            className={`text-[11px] font-semibold ${
                              active ? 'text-emerald-300' : 'text-zinc-500'
                            }`}
                          >
                            {pack.badge}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Stepper + Primary Add to Cart & Buy Now CTAs */}
              <div className="mt-8 border-t border-zinc-200 pt-6">
                <div className="flex flex-col gap-3 sm:flex-row">
                  {/* Quantity Stepper */}
                  <div className="inline-flex h-12 w-full items-center justify-between border border-zinc-300 bg-white sm:w-36">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                      className="inline-flex h-full w-12 items-center justify-center text-zinc-700 hover:bg-zinc-100"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span
                      data-testid="pdp-quantity-value"
                      className="font-mono-num text-sm font-bold text-zinc-950"
                    >
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      aria-label="Increase quantity"
                      className="inline-flex h-full w-12 items-center justify-center text-zinc-700 hover:bg-zinc-100"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Primary Add Selected Variant to Cart CTA */}
                  <button
                    type="button"
                    data-testid="pdp-add-to-cart-btn"
                    onClick={handleAddVariantToCart}
                    className={`flex h-12 flex-1 items-center justify-center gap-2 px-4 sm:px-6 text-xs font-bold tracking-wide transition-colors whitespace-nowrap ${
                      justAdded
                        ? 'bg-emerald-700 text-white'
                        : 'bg-zinc-950 text-white hover:bg-zinc-800'
                    }`}
                  >
                    {justAdded ? (
                      <>
                        <Check className="h-4 w-4 shrink-0" />
                        <span>Variant Added · {formatAED(totalSelectionPrice)}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-4 w-4 shrink-0" />
                        <span>
                          Add Selected Variant · {formatAED(totalSelectionPrice)}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Secondary Direct Cash-on-Delivery Express Checkout & Wishlist Row */}
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={handleBuyNowCOD}
                    className="flex h-12 items-center justify-center gap-2 border border-zinc-950 bg-white px-4 text-xs font-bold text-zinc-950 transition-colors hover:bg-zinc-100 sm:col-span-2"
                  >
                    <Banknote className="h-4 w-4" />
                    <span>Buy Now (Cash on Delivery)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id)}
                    className={`flex h-12 items-center justify-center gap-2 border px-4 text-xs font-bold transition-colors ${
                      isWishlisted
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-300 bg-zinc-50 text-zinc-900 hover:border-zinc-950'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-white' : ''}`} />
                    <span>{isWishlisted ? 'Wishlisted' : 'Wishlist'}</span>
                  </button>
                </div>

                {/* Product Share & Link Copy Toolbar */}
                <div
                  data-testid="pdp-share-toolbar"
                  className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-zinc-200 bg-zinc-50 p-3.5"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                    <Share2 className="h-3.5 w-3.5 text-zinc-950" />
                    <span>Share Product or Copy Direct Link:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      data-testid="pdp-copy-link-btn"
                      onClick={handleCopyProductLink}
                      className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-bold transition-colors ${
                        linkCopied
                          ? 'border-emerald-700 bg-emerald-700 text-white'
                          : 'border-zinc-950 bg-zinc-950 text-white hover:bg-zinc-800'
                      }`}
                    >
                      {linkCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span data-testid="pdp-copy-link-feedback">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Link2 className="h-3.5 w-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareableProductUrl}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      data-testid="pdp-share-whatsapp-btn"
                      className="inline-flex items-center gap-1 border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 transition-colors hover:border-zinc-950 hover:text-zinc-950"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(shareableProductUrl)}&text=${encodeURIComponent(shareText)}`}
                      target="_blank"
                      rel="noreferrer"
                      data-testid="pdp-share-telegram-btn"
                      className="inline-flex items-center gap-1 border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 transition-colors hover:border-zinc-950 hover:text-zinc-950"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Telegram</span>
                    </a>

                    <a
                      href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareableProductUrl)}`}
                      target="_blank"
                      rel="noreferrer"
                      data-testid="pdp-share-x-btn"
                      className="inline-flex items-center gap-1 border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 transition-colors hover:border-zinc-950 hover:text-zinc-950"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Share on X</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Trust & Fulfillment Guarantees */}
              <div className="mt-6 grid grid-cols-1 gap-3 border-t border-zinc-200 pt-5 text-xs text-zinc-600 sm:grid-cols-2">
                <div className="flex items-center gap-2.5">
                  <Truck className="h-4 w-4 text-zinc-950 shrink-0" />
                  <span>Free UAE shipping on orders over 350 AED</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-zinc-950 shrink-0" />
                  <span>Authentic QR scratch-code verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comprehensive Product Description, Tasting Notes & Package Dossier */}
        <section
          aria-labelledby="pdp-detailed-description-heading"
          data-testid="pdp-detailed-description-section"
          className="mt-14 border border-zinc-200 bg-white"
        >
          {/* Section Header Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 bg-zinc-950 px-6 py-4 text-white sm:px-8">
            <div className="flex items-center gap-2.5">
              <FileText className="h-4 w-4 text-emerald-400" />
              <h2
                id="pdp-detailed-description-heading"
                className="font-display text-base font-bold tracking-tight sm:text-lg"
              >
                Comprehensive Product Description & Technical Dossier
              </h2>
            </div>
            <span className="font-mono-num text-xs text-zinc-400">
              SKU: {product.id.toUpperCase()} · ESMA UAE CERTIFIED
            </span>
          </div>

          <div className="grid grid-cols-1 divide-y divide-zinc-200 lg:grid-cols-12 lg:divide-x lg:divide-y-0">
            {/* Left 7 Cols: Deep-Dive Editorial Narrative & Engineering Highlights */}
            <div className="p-6 sm:p-8 lg:col-span-7 space-y-6">
              <div>
                <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                  Editorial Overview & Hardware Architecture
                </p>
                <h3 className="mt-1 font-display text-xl font-bold text-zinc-950">
                  About {product.title}
                </h3>
                <div className="mt-3 space-y-3.5 text-sm leading-relaxed text-zinc-700">
                  {longParagraphs.map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </div>

              {/* Key Engineering & Performance Highlights */}
              <div className="border-t border-zinc-200 pt-6">
                <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider text-zinc-950 uppercase">
                  <Sparkles className="h-4 w-4" />
                  <span>Key Engineering & Performance Highlights</span>
                </h4>
                <ul className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {highlightsList.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 border border-zinc-200 bg-zinc-50 p-3.5 text-xs leading-relaxed text-zinc-800"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-zinc-950" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right 5 Cols: Flavour Tasting Notes & What's in the Sealed UAE Box */}
            <div className="p-6 sm:p-8 lg:col-span-5 space-y-6 bg-zinc-50/50">
              {/* Flavour & Vapor Tasting Profile */}
              {product.tastingNotes && (
                <div>
                  <h4 className="text-xs font-bold tracking-wider text-zinc-950 uppercase">
                    Flavour & Vapor Tasting Notes ({selectedFlavor})
                  </h4>
                  <dl className="mt-3 space-y-2.5 border border-zinc-200 bg-white p-4 text-xs">
                    <div className="flex flex-col justify-between gap-1 border-b border-zinc-100 pb-2.5 sm:flex-row">
                      <dt className="font-semibold text-zinc-500">Top Note (Inhale)</dt>
                      <dd className="font-semibold text-zinc-950 sm:text-right">
                        {product.tastingNotes.inhale}
                      </dd>
                    </div>
                    <div className="flex flex-col justify-between gap-1 border-b border-zinc-100 pb-2.5 sm:flex-row">
                      <dt className="font-semibold text-zinc-500">Mid-Palate (Body)</dt>
                      <dd className="font-semibold text-zinc-950 sm:text-right">
                        {product.tastingNotes.body}
                      </dd>
                    </div>
                    <div className="flex flex-col justify-between gap-1 border-b border-zinc-100 pb-2.5 sm:flex-row">
                      <dt className="font-semibold text-zinc-500">Exhale (Finish)</dt>
                      <dd className="font-semibold text-zinc-950 sm:text-right">
                        {product.tastingNotes.finish}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                      <dt className="font-semibold text-zinc-500">Cooling / Ice Index</dt>
                      <dd className="font-mono-num font-bold text-zinc-950">
                        {product.tastingNotes.iceLevel}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="font-semibold text-zinc-500">Sweetness Profile</dt>
                      <dd className="font-mono-num font-bold text-zinc-950">
                        {product.tastingNotes.sweetnessLevel}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}

              {/* What's Included in the Sealed UAE Box */}
              <div className="border-t border-zinc-200 pt-5">
                <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider text-zinc-950 uppercase">
                  <PackageCheck className="h-4 w-4" />
                  <span>What’s Included in the Sealed UAE Box</span>
                </h4>
                <ul className="mt-3 space-y-2 border border-zinc-200 bg-white p-4 text-xs text-zinc-800">
                  {boxContentsList.map((boxItem, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 bg-zinc-950 shrink-0" />
                      <span>{boxItem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Related Products in Category */}
        {relatedProducts.length > 0 && (
          <section
            aria-labelledby="related-products-heading"
            className="mt-16 border-t border-zinc-200 pt-12"
          >
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                  More in {product.category}
                </p>
                <h2
                  id="related-products-heading"
                  className="mt-1 font-display text-2xl font-bold tracking-tight text-zinc-950"
                >
                  Customers Also Viewed
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigateToCategory(product.category)}
                className="text-xs font-bold text-zinc-950 underline underline-offset-4 hover:text-zinc-700"
              >
                View All {product.category}
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
