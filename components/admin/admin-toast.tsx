"use client";

import React from "react";
import { CheckCircle, WarningCircle, Info, X } from "@phosphor-icons/react";
import { AdminToast as ToastType } from "@/hooks/use-admin-dashboard";

interface AdminToastProps {
  toast: ToastType | null;
  onDismiss: () => void;
}

export function AdminToast({ toast, onDismiss }: AdminToastProps) {
  if (!toast) return null;

  const styles = {
    success: "bg-emerald-950/90 border-emerald-500/80 text-emerald-300 shadow-emerald-950/50",
    error: "bg-red-950/90 border-red-500/80 text-red-300 shadow-red-950/50",
    warning: "bg-amber-950/90 border-amber-500/80 text-amber-300 shadow-amber-950/50",
    info: "bg-neutral-900/95 border-[#ff5500]/60 text-neutral-200 shadow-black/50",
  }[toast.type];

  const Icon = {
    success: CheckCircle,
    error: WarningCircle,
    warning: WarningCircle,
    info: Info,
  }[toast.type];

  const iconColors = {
    success: "text-emerald-400",
    error: "text-red-400",
    warning: "text-amber-400",
    info: "text-[#ff5500]",
  }[toast.type];

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in fade-in slide-in-from-top-3 duration-200">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-lg text-xs font-mono ${styles}`}
      >
        <Icon weight="fill" className={`size-4.5 shrink-0 ${iconColors}`} />
        <span className="flex-1 font-medium leading-tight">{toast.message}</span>
        <button
          type="button"
          onClick={onDismiss}
          className="text-neutral-400 hover:text-white transition-colors p-0.5 rounded cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X weight="bold" className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

