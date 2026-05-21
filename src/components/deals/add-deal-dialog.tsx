"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const dealSchema = z.object({
  title: z.string().min(1, "Title is required"),
  company: z.string().optional(),
  contactName: z.string().optional(),
  value: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .refine((v) => !Number.isNaN(v) && v >= 0, "Value must be a non-negative number"),
  stage: z.enum(["QUALIFICATION", "PROPOSAL", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"]),
  probability: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .refine(
      (v) => !Number.isNaN(v) && v >= 0 && v <= 100,
      "Probability must be between 0 and 100"
    ),
  expectedClose: z.string().optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

const DEFAULT_VALUES: Partial<DealFormData> = {
  title: "",
  company: "",
  contactName: "",
  value: 10000,
  stage: "QUALIFICATION",
  probability: 30,
  expectedClose: "",
};

interface AiResult {
  aiProbability: number;
  riskLevel: string;
  nextBestAction: string;
}

export function AddDealDialog() {
  const { addDealDialogOpen, setAddDealDialogOpen, setSelectedDealId } = useUiStore();
  const queryClient = useQueryClient();
  const [aiResult, setAiResult] = useState<AiResult | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: DEFAULT_VALUES as DealFormData,
  });

  const mutation = useMutation({
    mutationFn: async (data: DealFormData) => {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          expectedClose: data.expectedClose || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create deal");
      }
      return res.json();
    },
    onSuccess: (data) => {
      const deal = data.deal;
      setAiResult({
        aiProbability: Math.round(deal.aiProbability ?? deal.probability),
        riskLevel: deal.riskLevel || "medium",
        nextBestAction: deal.nextBestAction || "Run discovery call",
      });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["deal-detail"] });
      queryClient.invalidateQueries({ queryKey: ["deal-activity"] });
      queryClient.invalidateQueries({ queryKey: ["deal-analytics"] });
      setSelectedDealId(deal.id);
    },
  });

  const onSubmit = (data: DealFormData) => {
    setAiResult(null);
    mutation.mutate(data);
  };

  const handleClose = (open: boolean) => {
    if (!mutation.isPending) {
      setAddDealDialogOpen(open);
      if (!open) {
        reset(DEFAULT_VALUES as DealFormData);
        setAiResult(null);
        mutation.reset();
      }
    }
  };

  const selectClass =
    "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300";

  return (
    <Dialog open={addDealDialogOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-indigo-600" />
            Create New Deal
          </DialogTitle>
          <DialogDescription>
            Add a deal and let AETHER AI score win probability, risk level, and the next best action.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {aiResult && mutation.isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center rounded-2xl border border-emerald-100 bg-emerald-50/50 py-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <p className="mt-3 text-lg font-semibold text-slate-900">Deal created</p>
                <p className="mt-1 text-sm text-slate-500">AI scoring complete</p>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
                <div>
                  <p className="text-[10px] uppercase text-slate-400">AI win probability</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {aiResult.aiProbability}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-400">Risk</p>
                  <p
                    className={cn(
                      "text-2xl font-bold capitalize",
                      aiResult.riskLevel === "low"
                        ? "text-emerald-600"
                        : aiResult.riskLevel === "high"
                          ? "text-red-600"
                          : "text-amber-600"
                    )}
                  >
                    {aiResult.riskLevel}
                  </p>
                </div>
                <div className="col-span-2">
                  <Badge variant="purple" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI recommendation
                  </Badge>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    Next: {aiResult.nextBestAction}
                  </p>
                </div>
              </div>
              <Button className="w-full" onClick={() => handleClose(false)}>
                Done
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="title">Deal title *</Label>
                <Input
                  id="title"
                  className="mt-1"
                  placeholder="e.g. Acme Corp — Enterprise Plan"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" className="mt-1" {...register("company")} />
                </div>
                <div>
                  <Label htmlFor="contactName">Primary contact</Label>
                  <Input id="contactName" className="mt-1" {...register("contactName")} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="value">Value ($) *</Label>
                  <Input
                    id="value"
                    type="number"
                    min={0}
                    step={500}
                    className="mt-1"
                    {...register("value")}
                  />
                  {errors.value && (
                    <p className="mt-1 text-xs text-red-500">{errors.value.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="probability">Probability (%)</Label>
                  <Input
                    id="probability"
                    type="number"
                    min={0}
                    max={100}
                    step={5}
                    className="mt-1"
                    {...register("probability")}
                  />
                  {errors.probability && (
                    <p className="mt-1 text-xs text-red-500">{errors.probability.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="expectedClose">Expected close</Label>
                  <Input
                    id="expectedClose"
                    type="date"
                    className="mt-1"
                    {...register("expectedClose")}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="stage">Stage</Label>
                <select id="stage" className={cn(selectClass, "mt-1")} {...register("stage")}>
                  <option value="QUALIFICATION">Qualification</option>
                  <option value="PROPOSAL">Proposal</option>
                  <option value="NEGOTIATION">Negotiation</option>
                  <option value="CLOSED_WON">Closed-Won</option>
                  <option value="CLOSED_LOST">Closed-Lost</option>
                </select>
              </div>

              {mutation.isError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : "Something went wrong"}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => handleClose(false)}
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 gap-2" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI scoring...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Create Deal
                    </>
                  )}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
