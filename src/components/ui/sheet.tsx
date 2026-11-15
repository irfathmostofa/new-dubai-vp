import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping Cart Drawer">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs"
            aria-hidden="true"
          />
          {children}
        </div>
      )}
    </AnimatePresence>
  );
}

interface SheetContentProps {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}

export function SheetContent({ children, onClose, className = '' }: SheetContentProps) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`relative z-50 flex h-full w-full max-w-md flex-col bg-white text-zinc-950 shadow-2xl border-l border-zinc-200 ${className}`}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close cart panel"
        className="absolute right-4 top-4 sm:right-5 sm:top-5 z-10 inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-none border border-zinc-200 bg-white text-zinc-700 transition-colors hover:bg-zinc-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
      >
        <X className="h-4 w-4" />
      </button>
      {children}
    </motion.div>
  );
}

export function SheetHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`border-b border-zinc-200 px-4 py-4 pr-14 sm:px-6 sm:py-5 sm:pr-16 ${className}`}>{children}</div>;
}

export function SheetTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`font-display text-base sm:text-lg font-bold tracking-tight text-zinc-950 ${className}`}>{children}</h2>;
}

export function SheetDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`mt-1 text-xs text-zinc-500 ${className}`}>{children}</p>;
}

export function SheetFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mt-auto border-t border-zinc-200 bg-zinc-50 px-4 py-4 sm:px-6 sm:py-5 ${className}`}>{children}</div>;
}
