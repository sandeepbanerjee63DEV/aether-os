"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Mic, Send, Sparkles, X, ChevronUp, ChevronDown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
const AETHER_AI_SUGGESTIONS = [
  "Show high-risk leads",
  "Generate weekly sales summary",
  "Predict churn probability",
  "Which employee is overloaded?",
  "Optimize workflow bottlenecks",
];

export function AetherAiCommand() {
  const { aetherAiOpen, aetherAiExpanded, toggleAetherAi, setAetherAiExpanded } = useUiStore();
  const [input, setInput] = useState("");
  const { data: ops } = useQuery({
    queryKey: ["operations-feed"],
    queryFn: () => fetch("/api/operations/feed").then((r) => r.json()),
  });

  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    {
      role: "ai",
      text: "AETHER AI online. Ask me about leads, pipeline health, team workload, or operational risks.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, context: "operational intelligence" }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "ai", text: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", text: "Operational analysis in progress. Try: 'Show high-risk leads'" }]);
    } finally {
      setLoading(false);
    }
  };

  if (!aetherAiOpen) {
    return (
      <motion.button
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={toggleAetherAi}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-lg ai-glow ai-glow-pulse"
      >
        <Bot className="h-6 w-6" />
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[8px] font-bold text-white live-pulse">
          AI
        </span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-indigo-100/80 bg-white/95 shadow-2xl backdrop-blur-xl ai-glow",
        aetherAiExpanded ? "bottom-4 right-4 left-4 top-20 md:left-auto md:w-[420px]" : "bottom-6 right-6 w-[380px] max-w-[calc(100vw-2rem)]"
      )}
    >
      <div className="flex items-center justify-between border-b border-indigo-50 bg-gradient-to-r from-indigo-50/80 to-purple-50/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary ai-glow-pulse">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">AETHER AI</p>
            <p className="text-[10px] text-indigo-600">Operational Command Center</p>
          </div>
          <Badge variant="success" className="ml-1 gap-1 text-[9px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 live-pulse" />
            Active
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAetherAiExpanded(!aetherAiExpanded)}>
            {aetherAiExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleAetherAi}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className={cn("flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin", aetherAiExpanded ? "min-h-[200px]" : "max-h-[220px]")}>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" /> Operational Summary
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {ops?.signalsMonitored ?? 0} signals monitored
            {(ops?.riskAlerts ?? 0) > 0 ? ` · ${ops.riskAlerts} risk alert(s)` : ""}
            {ops?.feed?.[0]?.summary ? ` · ${ops.feed[0].summary}` : ""}
          </p>
        </div>
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("text-xs rounded-xl px-3 py-2", m.role === "user" ? "ml-8 bg-indigo-600 text-white" : "mr-4 bg-slate-100 text-slate-700")}
            >
              {m.text}
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="h-3 w-3 animate-pulse" /> Analyzing operations...
          </p>
        )}
      </div>

      <div className="border-t border-slate-100 p-3">
        <div className="mb-2 flex flex-wrap gap-1">
          {AETHER_AI_SUGGESTIONS.slice(0, 3).map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-[10px] text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Command AETHER AI..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            className="h-9 rounded-xl text-sm"
          />
          <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9">
            <Mic className="h-4 w-4 text-slate-400" />
          </Button>
          <Button size="icon" className="shrink-0 h-9 w-9" onClick={() => send()} disabled={loading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 flex gap-2">
          {["High-risk leads", "Weekly summary", "Bottlenecks"].map((action) => (
            <button
              key={action}
              onClick={() => send(action)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-indigo-600 hover:bg-indigo-50"
            >
              <Zap className="h-3 w-3" />
              {action}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
