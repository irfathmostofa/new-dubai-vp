import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function HealthWarningBanner() {
  return (
    <section
      aria-label="Nicotine Health Warning"
      className="border-y border-zinc-300 bg-zinc-200 px-4 py-8 text-zinc-950 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-5xl border-2 border-zinc-950 bg-zinc-100 p-6 text-center sm:p-8">
        <div className="mx-auto mb-3 inline-flex items-center justify-center gap-2 text-xs font-bold tracking-widest text-zinc-950 uppercase">
          <AlertTriangle className="h-4 w-4 text-zinc-950 shrink-0" />
          <span>Mandatory Regulatory Notice</span>
        </div>
        <p className="font-display text-base font-bold leading-relaxed text-zinc-950 sm:text-lg">
          WARNING: Products sold on this site may contain nicotine which is a highly addictive substance. Intended for adult smokers only.
        </p>
      </div>
    </section>
  );
}
