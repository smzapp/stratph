"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  wide?: boolean;
  /** Optional sticky footer (e.g. action buttons) that stays visible while `children` scrolls. */
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, wide = false, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/40" onClick={onClose} />
      <div
        className={`relative z-10 flex max-h-[90vh] w-full flex-col rounded-xl bg-white shadow-xl ${
          wide ? "max-w-2xl" : "max-w-md"
        }`}
      >
        <div className="flex shrink-0 items-start justify-between px-6 pb-4 pt-6">
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className={`overflow-y-auto px-6 ${footer ? "pb-4" : "pb-6"}`}>{children}</div>
        {footer ? <div className="shrink-0 border-t border-zinc-100 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
