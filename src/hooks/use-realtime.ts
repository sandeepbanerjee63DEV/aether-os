"use client";

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

const CHANNEL_KEYS: Record<string, string[][]> = {
  leads: [["leads"], ["lead-detail"], ["timeline"]],
  deals: [["deals"], ["deal-analytics"], ["deal-activity"]],
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
