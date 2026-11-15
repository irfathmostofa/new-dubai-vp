import React, { useState } from "react";
import { ArrowRight, Truck, ShieldCheck, Zap, Banknote } from "lucide-react";
import { IMG_JUUL2, IMG_PODSALT } from "../data/products";
import { ProductCategory } from "../types/store";
import { ThreeVapeShowcase } from "./ThreeVapeShowcase";

interface HeroSectionProps {
  onSelectCategory: (category: "All" | ProductCategory) => void;
}

export function HeroSection({ onSelectCategory }: HeroSectionProps) {
  const [promo1ImgError, setPromo1ImgError] = useState(false);
  const [promo2ImgError, setPromo2ImgError] = useState(false);

  return (
    <section className="border-b border-zinc-200 bg-white pt-4 pb-10 sm:pt-8 sm:pb-16">
      <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
        {/* Split / Grid Banner Layout */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-zinc-950 text-white lg:col-span-8">
          <div className="relative grid grid-cols-1 items-center gap-6 p-5 sm:gap-8 sm:p-8 lg:grid-cols-12 lg:p-10 xl:p-12">
            <div className="z-10 flex flex-col items-start lg:col-span-6">
              <p className="text-[11px] sm:text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                2026 Smart Telemetry Series · ESMA Approved
              </p>

              <h1
                className="mt-2.5 sm:mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.4rem] xl:text-[2.65rem] lg:leading-[1.12]"
                style={{ textWrap: "balance" }}
              >
                High Puff Disposable Vapes with Digital Displays
              </h1>

              <p className="mt-3 sm:mt-4 max-w-xl text-xs sm:text-sm lg:text-base leading-relaxed text-zinc-300">
                Experience real-time battery and e-liquid level monitoring
                across our 10,000 to 35,000 puff hardware lineup. Dispatched in
                2 hours across Dubai.
              </p>

              <div className="mt-6 sm:mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <button
                  type="button"
                  onClick={() => onSelectCategory("Disposable Vape")}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 bg-white px-6 py-3.5 text-xs sm:text-sm font-bold text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white whitespace-nowrap shrink-0"
                >
                  <span>Buy Now</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onSelectCategory("Offers")}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 border border-zinc-700 bg-transparent px-6 py-3.5 text-xs sm:text-sm font-semibold text-white transition-colors hover:border-white hover:bg-zinc-900 whitespace-nowrap shrink-0"
                >
                  <span>Explore Bundle Offers</span>
                </button>
              </div>

              <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-zinc-800 pt-4 sm:pt-5 text-[11px] sm:text-xs text-zinc-400 w-full">
                <span>100% Authentic UAE Tax Stamp</span>
                <span aria-hidden="true">·</span>
                <span>From AED 38.00</span>
                <span aria-hidden="true">·</span>
                <span>Same-Day COD</span>
              </div>
            </div>

            {/* Interactive Three.js 3D Hardware & Vapor Animation Showcase */}
            <div className="relative h-[280px] sm:h-[340px] w-full lg:col-span-6 lg:h-[390px]">
              <ThreeVapeShowcase />
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column UAE Trust & Fulfilment Strip Below Hero */}
        <div className="mt-6 grid grid-cols-1 gap-4 border border-zinc-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3.5">
            <Truck className="mt-0.5 h-5 w-5 text-zinc-950 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-zinc-950">
                2-Hour Dubai Express
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500">
                Same-day dispatch across Dubai, Sharjah & Abu Dhabi
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <Banknote className="mt-0.5 h-5 w-5 text-zinc-950 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-zinc-950">
                UAE Cash on Delivery
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500">
                Pay via Cash or Card Link at your doorstep upon arrival
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-zinc-950 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-zinc-950">
                100% ESMA Authentic
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500">
                Verifiable hologram codes & official UAE excise stamps
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <Zap className="mt-0.5 h-5 w-5 text-zinc-950 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-zinc-950">
                Free Shipping Over AED 350
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500">
                Complimentary courier delivery across all 7 Emirates
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
