"use client";

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

const CHANNEL_KEYS: Record<string, string[][]> = {
  // LEAD ↔ TEAM + LEAD → DEAL — lead changes can shift owner workload, can
  // be the source of a new deal (continuity routing), and update assignment
  // trails. Fan out to deals + team views so they stay live.
  leads: [
    ["leads"],
    ["lead-detail"],
    ["lead-owner-suggestions"],
    ["timeline"],
    ["team-assignments"],
    ["team-assignment-history"],
    ["team-member"],
    ["team-overview"],
    ["team-recommendations"],
    ["deals"],
    ["deal-detail"],
  ],
  // DEAL ↔ TEAM — deal mutations move owner revenue responsibility,
  // assignment trails, capacity and AI recommendations. Fan out.
  deals: [
    ["deals"],
    ["deal-detail"],
    ["deal-analytics"],
    ["deal-activity"],
    ["deal-owner-suggestions"],
    ["team-assignments"],
    ["team-assignment-history"],
    ["team-member"],
    ["team-overview"],
    ["team-recommendations"],
  ],
  team: [
    ["team-overview"],
    ["team-members"],
    ["team-member"],
    ["team-activity"],
    ["team-departments"],
    ["team-departments-mini"],
    ["team-assignments"],
    ["team-assignments-ai"],
    ["team-assignment-history"],
    ["team-sessions"],
    ["team-access-logs"],
    ["team-recommendations"],
    ["team-roles"],
    ["team-permissions"],
    ["team-settings"],
    // Conversely, team changes (workload, status, departments) reshuffle
    // the assignment engine's verdict — keep leads + deals in sync.
    ["leads"],
    ["lead-detail"],
    ["lead-owner-suggestions"],
    ["deals"],
    ["deal-detail"],
    ["deal-owner-suggestions"],
  ],
};

/**
 * Realtime data hook. Connects to a WebSocket server when
 * NEXT_PUBLIC_WS_URL is configured, otherwise falls back to a 60s
 * polling interval. The `channel` argument controls which query keys
 * are invalidated.
 */
export function useRealtime(channel: "leads" | "deals" | "team" = "leads") {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    const keys = CHANNEL_KEYS[channel] ?? [[channel]];
    for (const key of keys) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  }, [channel, queryClient]);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) {
      const interval = setInterval(invalidate, 60000);
      return () => clearInterval(interval);
    }

    let ws: WebSocket;
    try {
      ws = new WebSocket(`${wsUrl}?channel=${channel}`);
      ws.onmessage = () => invalidate();
    } catch {
      /* WS optional */
    }
    return () => ws?.close();
  }, [channel, invalidate]);
}
