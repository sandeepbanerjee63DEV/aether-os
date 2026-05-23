"use client";

import { useState } from "react";
import { Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Module {
  key: string;
  label: string;
  icon: string;
}
interface ActionDef {
  key: string;
  label: string;
  tone: string;
}
interface RoleMeta {
  label: string;
  description: string;
  color: string;
  icon: string;
}
interface MatrixRow {
  role: string;
  meta: RoleMeta;
  rank: number;
  grid: Record<string, Record<string, boolean>>;
}

interface PermissionMatrixProps {
  modules: Module[];
  actions: ActionDef[];
  matrix: MatrixRow[];
}

const ROLE_COLOR: Record<string, string> = {
  purple: "from-purple-500 to-purple-600 text-white",
  indigo: "from-indigo-500 to-indigo-600 text-white",
  blue: "from-blue-500 to-blue-600 text-white",
  emerald: "from-emerald-500 to-emerald-600 text-white",
  amber: "from-amber-500 to-amber-600 text-white",
  slate: "from-slate-500 to-slate-600 text-white",
};

export function PermissionMatrix({ modules, actions, matrix }: PermissionMatrixProps) {
  const [selectedRole, setSelectedRole] = useState<string>(matrix[0]?.role ?? "ADMIN");
  const activeRow = matrix.find((m) => m.role === selectedRole);

  return (
    <div className="space-y-4">
      {/* Role chips */}
      <div className="flex flex-wrap gap-2">
        {matrix.map((row) => {
          const isActive = row.role === selectedRole;
          const c = ROLE_COLOR[row.meta.color] ?? ROLE_COLOR.indigo;
          return (
            <button
              key={row.role}
              type="button"
              onClick={() => setSelectedRole(row.role)}
              className={cn(
                "group flex items-center gap-2 rounded-2xl border px-3 py-2 transition-all",
                isActive
                  ? "border-transparent bg-gradient-to-r shadow-md " + c
                  : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/40"
              )}
            >
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                )}
              >
                R{row.rank}
              </span>
              <span className="text-sm font-semibold">{row.meta.label}</span>
            </button>
          );
        })}
      </div>

      {activeRow && (
        <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/20 p-4">
          <p className="text-xs text-slate-600">{activeRow.meta.description}</p>
        </div>
      )}

      {/* Matrix table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-card">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Module</th>
                {actions.map((a) => (
                  <th key={a.key} className="px-3 py-3 text-center">
                    {a.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {modules.map((m) => (
                <tr key={m.key} className="hover:bg-slate-50/40">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">{m.label}</p>
                  </td>
                  {actions.map((a) => {
                    const allowed = activeRow?.grid[m.key]?.[a.key] ?? false;
                    return (
                      <td key={a.key} className="px-3 py-3 text-center">
                        <span
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-lg transition-all",
                            allowed
                              ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                              : "bg-slate-50 text-slate-300"
                          )}
                        >
                          {allowed ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// silence unused
void ChevronDown;
