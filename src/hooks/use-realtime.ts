"use client";

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

/** WebSocket realtime hook — connects when WS_URL is configured */
export function useRealtime(channel = "leads") {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey: ["lead-detail"] });
    queryClient.invalidateQueries({ queryKey: ["timeline"] });
  }, [queryClient]);

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
