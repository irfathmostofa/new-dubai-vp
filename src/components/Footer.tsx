import React from 'react';
import {
  MessageSquare,
  Mail,
  MapPin,
  Banknote,
  CreditCard,
  ShieldCheck,
  Instagram,
  Send,
  MessageCircle,
  Share2,
  LayoutDashboard,
} from 'lucide-react';
import { ProductCategory } from '../types/store';
import { useCartStore } from '../store/useCartStore';

interface FooterProps {
  onSelectCategory: (category: 'All' | ProductCategory) => void;
}

const FOOTER_SOCIAL_CHANNELS = [
  {
    name: 'Instagram',
    handle: '@vapedubaiking',
    href: 'https://instagram.com/vapedubaiking',
  },
  {
    name: 'TikTok',
    handle: '@vapedubaiking.ae',
    href: 'https://tiktok.com/@vapedubaiking',
  },
  {
    name: 'WhatsApp',
    handle: '+971 50 842 9910',
    href: 'https://wa.me/971508429910',
  },
  {
    name: 'Telegram',
    handle: 't.me/vapedubaiking',
    href: 'https://t.me/vapedubaiking',
  },
  {
    name: 'X (Twitter)',
    handle: '@vapedubaiking',
    href: 'https://x.com/vapedubaiking',
  },
];

export function Footer({ onSelectCategory }: FooterProps) {
  const navigateToAdmin = useCartStore((state) => state.navigateToAdmin);

  return (
    <footer className="bg-zinc-950 text-zinc-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: About Text & Official Social Media Hub */}
          <div>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              Vape Dubai King
            </span>
            <p className="mt-4 text-xs leading-relaxed text-zinc-400">
              Dubai&apos;s Most Trusted Online Vape Shop offering 100% ESMA-compliant disposable vapes, closed pod systems, UK nicotine salts, and sub-ohm hardware with rapid same-day delivery across all 7 UAE Emirates.
            </p>

            {/* Social Media Links in Footer */}
            <div className="mt-5">
              <p className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">
                Connect on Social Media
              </p>
              <div
                data-testid="footer-social-links"
                className="mt-2.5 flex flex-wrap items-center gap-2"
              >
                {FOOTER_SOCIAL_CHANNELS.map((soc) => (
                  <a
                    key={soc.name}
                    href={soc.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${soc.name} (${soc.handle})`}
                    data-testid={`footer-social-${soc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    className="inline-flex items-center gap-1.5 border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-white hover:bg-white hover:text-zinc-950"
                  >
                    {soc.name === 'Instagram' && <Instagram className="h-3.5 w-3.5" />}
                    {soc.name === 'WhatsApp' && <MessageCircle className="h-3.5 w-3.5" />}
                    {soc.name === 'Telegram' && <Send className="h-3.5 w-3.5" />}
                    {(soc.name === 'TikTok' || soc.name.startsWith('X')) && (
                      <Share2 className="h-3.5 w-3.5" />
                    )}
                    <span>{soc.name}</span>
                  </a>
                ))}
              </div>
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              Strictly for adults aged 21+ in the United Arab Emirates.
            </p>
          </div>

          {/* Column 2: Quick Links & Admin Portal */}
          <div>
            <h2 className="font-display text-sm font-bold tracking-wide text-white">
              Quick Links
            </h2>
            <ul className="mt-4 space-y-2.5 text-xs">
              {(
                [
                  'Disposable Vape',
                  'Pods System',
                  'E-Liquid',
                  'Vape Kit',
                  'Brands',
                  'Offers',
                ] as ProductCategory[]
              ).map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => onSelectCategory(cat)}
                    className="text-zinc-400 transition-colors hover:text-white"
                  >
                    {cat}
                  </button>
                </li>
              ))}
              <li className="pt-2 border-t border-zinc-800/80">
                <a
                  href="/admin"
                  data-testid="footer-admin-link"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateToAdmin();
                  }}
                  className="inline-flex items-center gap-1.5 font-semibold text-emerald-400 transition-colors hover:text-white"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Admin Portal (/admin)</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h2 className="font-display text-sm font-bold tracking-wide text-white">
              Contact Info
            </h2>
            <ul className="mt-4 space-y-3 text-xs text-zinc-400">
              <li className="flex items-start gap-2.5">
                <MessageSquare className="mt-0.5 h-4 w-4 text-white shrink-0" />
                <div>
                  <span className="block font-semibold text-white">WhatsApp Dispatch Desk</span>
                  <a
                    href="https://wa.me/971508429910"
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono-num hover:text-white"
                  >
                    +971 50 842 9910
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 text-white shrink-0" />
                <div>
                  <span className="block font-semibold text-white">Customer Support Email</span>
                  <a href="mailto:support@vapedubaiking.ae" className="hover:text-white">
                    support@vapedubaiking.ae
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 text-white shrink-0" />
                <div>
                  <span className="block font-semibold text-white">Fulfillment Hub</span>
                  <span>Al Quoz Industrial Area 3, Dubai, UAE</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 4: Payment Methods Accepted */}
          <div>
            <h2 className="font-display text-sm font-bold tracking-wide text-white">
              Payment Methods Accepted
            </h2>
            <p className="mt-4 text-xs leading-relaxed text-zinc-400">
              Zero upfront risk. Settle your order directly with our courier upon doorstep inspection:
            </p>
            <div className="mt-4 space-y-2.5">
              <div className="flex items-center gap-3 border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs">
                <Banknote className="h-4 w-4 text-white shrink-0" />
                <div>
                  <span className="block font-semibold text-white">Cash on Delivery (AED)</span>
                  <span className="text-[11px] text-zinc-400">Available across all 7 Emirates</span>
                </div>
              </div>
              <div className="flex items-center gap-3 border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs">
                <CreditCard className="h-4 w-4 text-white shrink-0" />
                <div>
                  <span className="block font-semibold text-white">Link Payment on Delivery</span>
                  <span className="text-[11px] text-zinc-400">Apple Pay, Visa & Mastercard Tap/Link</span>
                </div>
              </div>
              <div className="flex items-center gap-3 border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs">
                <ShieldCheck className="h-4 w-4 text-white shrink-0" />
                <div>
                  <span className="block font-semibold text-white">Free Delivery Above 350 AED</span>
                  <span className="text-[11px] text-zinc-400">Standard UAE fee: AED 25.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-800 pt-8 text-xs text-zinc-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Vape Dubai King UAE. All rights reserved.</p>
          <p>ESMA UAE Standard Regulated Retailer · Adult 21+ Verification Mandatory</p>
        </div>
      </div>
    </footer>
  );
}
