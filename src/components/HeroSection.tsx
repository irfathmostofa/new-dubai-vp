import React from 'react';
import { ArrowRight, Truck, ShieldCheck, Zap, Banknote } from 'lucide-react';
import { ProductCategory } from '../types/store';
import { ThreeVapeShowcase } from './ThreeVapeShowcase';

interface HeroSectionProps {
  onSelectCategory: (category: 'All' | ProductCategory) => void;
}

export function HeroSection({ onSelectCategory }: HeroSectionProps) {
  return (
    <section
      data-testid="hero-section"
      className="border-b border-zinc-200 bg-white pt-4 pb-10 sm:pt-6 sm:pb-12"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Clean Minimalist Split-Screen Stage */}
        <div className="relative overflow-hidden bg-zinc-950 text-white">
          {/* Subtle Ambient Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 78% 45%, rgba(56, 189, 248, 0.14), transparent 55%)',
            }}
          />

          <div className="relative grid grid-cols-1 items-center gap-10 px-6 py-12 sm:px-12 sm:py-16 lg:grid-cols-12 lg:gap-12 lg:px-16 lg:py-20">
            {/* Left Column: Clean Editorial Typography & Actions */}
            <div className="z-10 flex flex-col justify-center lg:col-span-7">
              <p className="text-xs font-semibold tracking-[0.18em] text-sky-400 uppercase">
                100% ESMA Verified · Same-Day UAE Dispatch
              </p>

              <h1
                className="mt-4 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.4rem] lg:leading-[1.06]"
                style={{ textWrap: 'balance' }}
              >
                Precision Vaping Hardware, Delivered Across Dubai.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
                Authentic 10K–35K smart OLED disposables, closed pod systems, and
                UK nicotine salts. Express 2-hour courier delivery with Cash or
                Card Link on arrival.
              </p>

              {/* Primary CTA Row */}
              <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
                <button
                  type="button"
                  data-testid="hero-buy-now-btn"
                  onClick={() => onSelectCategory('Disposable Vape')}
                  className="inline-flex items-center justify-center gap-2.5 bg-white px-7 py-4 text-sm font-bold text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span>Shop Disposable Vapes</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  data-testid="hero-explore-offers-btn"
                  onClick={() => onSelectCategory('Offers')}
                  className="inline-flex items-center justify-center border border-zinc-700 bg-transparent px-7 py-4 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-zinc-900"
                >
                  <span>Explore Multi-Buy Offers</span>
                </button>
              </div>

              {/* Unboxed Minimalist Key Metrics */}
              <div className="mt-10 grid grid-cols-3 gap-3 border-t border-zinc-800/90 pt-7 sm:mt-12 sm:max-w-lg sm:gap-6 sm:pt-8">
                <div>
                  <p
                    data-testid="hero-active-puffs"
                    className="font-mono-num text-lg font-bold whitespace-nowrap text-white sm:text-2xl"
                  >
                    35,000
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">Max Puff Capacity</p>
                </div>
                <div className="border-l border-zinc-800/90 pl-3 sm:pl-6">
                  <p className="font-mono-num text-lg font-bold whitespace-nowrap text-white sm:text-2xl">
                    2 Hours
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">Dubai Express ETA</p>
                </div>
                <div className="border-l border-zinc-800/90 pl-3 sm:pl-6">
                  <p className="font-mono-num text-lg font-bold whitespace-nowrap text-white sm:text-2xl">
                    AED 38
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">Starting Price</p>
                </div>
              </div>
            </div>

            {/* Right Column: Uncluttered 3D Hardware Stage */}
            <div className="relative flex flex-col items-center justify-center lg:col-span-5">
              <div className="relative h-[320px] w-full sm:h-[380px] lg:h-[420px]">
                <ThreeVapeShowcase />
              </div>
              <p className="mt-2 text-center font-mono-num text-[11px] tracking-wider text-zinc-500 uppercase">
                Interactive 3D Hardware · Drag to Rotate
              </p>
            </div>
          </div>
        </div>

        {/* Clean 4-Column Fulfilment Strip */}
        <div className="grid grid-cols-1 gap-6 border-x border-b border-zinc-200 bg-zinc-50/60 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3">
            <Truck className="h-4 w-4 shrink-0 text-zinc-900" />
            <p className="text-xs text-zinc-600">
              <strong className="font-semibold text-zinc-950">2-Hour Dubai Express</strong> · Same-day UAE dispatch
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Banknote className="h-4 w-4 shrink-0 text-zinc-900" />
            <p className="text-xs text-zinc-600">
              <strong className="font-semibold text-zinc-950">Cash on Delivery</strong> · Cash or Card Link at door
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 shrink-0 text-zinc-900" />
            <p className="text-xs text-zinc-600">
              <strong className="font-semibold text-zinc-950">100% ESMA Authentic</strong> · Official UAE excise stamp
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Zap className="h-4 w-4 shrink-0 text-zinc-900" />
            <p className="text-xs text-zinc-600">
              <strong className="font-semibold text-zinc-950">Free Shipping Over AED 350</strong> · All 7 Emirates
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
