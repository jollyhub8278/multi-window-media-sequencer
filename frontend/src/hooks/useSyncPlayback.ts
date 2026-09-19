import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getActiveSync,
  startSync,
} from "../services/api";

import type { SyncPlayback } from "../types/media";

interface WebSocketMessage {
  type: string;
  data: SyncPlayback;
}

export function useSyncPlayback() {
  const [activeSync, setActiveSync] =
    useState<SyncPlayback | null>(null);

  const [isSocketConnected, setIsSocketConnected] =
    useState(false);

  const startTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const endTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }

    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
  }, []);

  const applySync = useCallback(
    (syncPlayback: SyncPlayback) => {
      clearTimers();

      const now = Date.now();
      const startsAt = new Date(
        syncPlayback.startsAt,
      ).getTime();

      const endsAt = new Date(
        syncPlayback.endsAt,
      ).getTime();

      if (endsAt <= now) {
        setActiveSync(null);
        return;
      }

      if (startsAt <= now) {
        setActiveSync(syncPlayback);
      } else {
        setActiveSync(null);

        startTimerRef.current = setTimeout(() => {
          setActiveSync(syncPlayback);
        }, startsAt - now);
      }

      endTimerRef.current = setTimeout(() => {
        setActiveSync(null);
      }, endsAt - now);
    },
    [clearTimers],
  );

  useEffect(() => {
    let disposed = false;
    let socket: WebSocket | null = null;
    let reconnectTimer:
      | ReturnType<typeof setTimeout>
      | null = null;

    async function loadActiveSync() {
      try {
        const syncPlayback = await getActiveSync();

        if (!disposed && syncPlayback) {
          applySync(syncPlayback);
        }
      } catch (error) {
        console.error(
          "Failed to load active sync:",
          error,
        );
      }
    }

    function connectWebSocket() {
      const websocketURL =
        import.meta.env.VITE_WS_URL ??
        "ws://localhost:8080/ws";

      socket = new WebSocket(websocketURL);

      socket.onopen = () => {
        if (!disposed) {
          setIsSocketConnected(true);
        }
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(
            event.data,
          ) as WebSocketMessage;

          if (message.type === "sync.started") {
            applySync(message.data);
          }
        } catch (error) {
          console.error(
            "Invalid WebSocket message:",
            error,
          );
        }
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
        if (disposed) {
          return;
        }

        setIsSocketConnected(false);

        reconnectTimer = setTimeout(
          connectWebSocket,
          2000,
        );
      };
    }

    void loadActiveSync();
    connectWebSocket();

    return () => {
      disposed = true;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      socket?.close();
      clearTimers();
    };
  }, [applySync, clearTimers]);

  async function triggerSync(
    mediaId: string,
    durationSeconds: number,
  ) {
    const syncPlayback = await startSync(
      mediaId,
      durationSeconds,
    );

    // Ensures the initiating tab works even if its socket disconnects.
    applySync(syncPlayback);
  }

  return {
    activeSync,
    isSocketConnected,
    triggerSync,
  };
}