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

const leadSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  company: z.string().min(1, "Company is required"),
  website: z.string().optional(),
  source: z.string().min(1),
  leadType: z.string().min(1),
  value: z.enum(["High", "Medium", "Low"]),
  location: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

const DEFAULT_VALUES: LeadFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  website: "",
  source: "Website",
  leadType: "Product Demo",
  value: "Medium",
  location: "",
};

interface AiResult {
  classification: string;
  score: number;
  nextBestAction: string;
  convertProbability: number;
}

export function AddLeadDialog() {
  const { addLeadDialogOpen, setAddLeadDialogOpen, setSelectedLeadId } = useUiStore();
  const queryClient = useQueryClient();
  const [aiResult, setAiResult] = useState<AiResult | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const mutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create lead");
      }
      return res.json();
    },
    onSuccess: (data) => {
      const lead = data.lead;
      setAiResult({
        classification: lead.aiClassification || (lead.aiScore >= 80 ? "High Intent" : "Qualified"),
        score: lead.aiScore,
        nextBestAction: lead.nextBestAction || "Send follow-up email",
        convertProbability: Math.round(lead.convertProbability || lead.aiScore * 0.95),
      });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-detail"] });
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
      setSelectedLeadId(lead.id);
    },
  });

  const onSubmit = (data: LeadFormData) => {
    setAiResult(null);
    mutation.mutate(data);
  };

  const handleClose = (open: boolean) => {
    if (!mutation.isPending) {
      setAddLeadDialogOpen(open);
      if (!open) {
        reset(DEFAULT_VALUES);
        setAiResult(null);
        mutation.reset();
      }
    }
  };

  const selectClass =
    "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300";

  return (
    <Dialog open={addLeadDialogOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-indigo-600" />
            Add New Lead
          </DialogTitle>
          <DialogDescription>
            Capture a lead and let AETHER AI classify, score, and recommend next actions instantly.
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
                <p className="mt-3 text-lg font-semibold text-slate-900">Lead created successfully</p>
                <p className="mt-1 text-sm text-slate-500">AI classification complete</p>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
                <div>
                  <p className="text-[10px] uppercase text-slate-400">AI Score</p>
                  <p className="text-2xl font-bold text-emerald-600">{aiResult.score}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-400">Convert probability</p>
                  <p className="text-2xl font-bold text-indigo-600">{aiResult.convertProbability}%</p>
                </div>
                <div className="col-span-2">
                  <Badge variant="purple" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    {aiResult.classification}
                  </Badge>
                  <p className="mt-2 text-sm font-medium text-slate-800">Next: {aiResult.nextBestAction}</p>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  handleClose(false);
                }}
              >
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">First name *</Label>
                  <Input id="firstName" className="mt-1" {...register("firstName")} />
                  {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
                </div>
                <div>
                  <Label htmlFor="lastName">Last name *</Label>
                  <Input id="lastName" className="mt-1" {...register("lastName")} />
                  {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" className="mt-1" {...register("email")} />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" className="mt-1" {...register("phone")} />
                </div>
                <div>
                  <Label htmlFor="company">Company *</Label>
                  <Input id="company" className="mt-1" {...register("company")} />
                  {errors.company && <p className="mt-1 text-xs text-red-500">{errors.company.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" placeholder="company.com" className="mt-1" {...register("website")} />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" className="mt-1" {...register("location")} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="source">Source</Label>
                  <select id="source" className={cn(selectClass, "mt-1")} {...register("source")}>
                    <option>Website</option>
                    <option>Referral</option>
                    <option>LinkedIn</option>
                    <option>Campaign</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="leadType">Lead type</Label>
                  <select id="leadType" className={cn(selectClass, "mt-1")} {...register("leadType")}>
                    <option>Product Demo</option>
                    <option>Enterprise Inquiry</option>
                    <option>Trial Signup</option>
                    <option>Partnership</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="value">Value</Label>
                  <select id="value" className={cn(selectClass, "mt-1")} {...register("value")}>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>

              {mutation.isError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {mutation.error instanceof Error ? mutation.error.message : "Something went wrong"}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => handleClose(false)} disabled={mutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 gap-2" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI classifying...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Add Lead
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
