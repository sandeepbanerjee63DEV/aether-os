"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  size?: "sm" | "md";
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, size = "md", children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "w-full appearance-none rounded-xl border border-slate-200 bg-white pr-9 text-slate-700 shadow-sm transition-colors focus:border-indigo-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30",
          size === "sm" ? "h-8 pl-3 text-xs" : "h-10 pl-3.5 text-sm",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  )
);
Select.displayName = "Select";

export { Select };
