"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  className?: string;
  id?: string;
  size?: "sm" | "md";
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
  description,
  className,
  id,
  size = "md",
}: SwitchProps) {
  const dims = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const thumb = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const translate = size === "sm" ? "translate-x-4" : "translate-x-5";

  const toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      id={id}
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50",
        dims,
        checked ? "bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]" : "bg-slate-200"
      )}
    >
      <span
        className={cn(
          "inline-block transform rounded-full bg-white shadow-sm ring-0 transition-transform",
          thumb,
          checked ? translate : "translate-x-0.5"
        )}
      />
    </button>
  );

  if (!label && !description) {
    return <div className={cn("inline-block", className)}>{toggle}</div>;
  }

  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0 flex-1">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-slate-800">
            {label}
          </label>
        )}
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      <div className="pt-0.5">{toggle}</div>
    </div>
  );
}
