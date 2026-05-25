"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LeadsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[leads page error]", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <Card className="max-w-xl border-rose-100">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-slate-900">
                Couldn&apos;t load the Leads workspace
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Something failed while rendering this page.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-rose-100 bg-rose-50/40 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">
              Error details
            </p>
            <p className="mt-1 break-words font-mono text-[11px] leading-relaxed text-slate-700">
              {error.message || "Unknown render error."}
            </p>
            {error.digest && (
              <p className="mt-1 text-[10px] text-slate-500">
                Digest: <span className="font-mono">{error.digest}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={reset} size="sm" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (typeof window !== "undefined") window.location.reload();
              }}
            >
              Hard refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
