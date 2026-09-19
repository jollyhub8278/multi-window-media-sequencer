import { useEffect, useRef, useState } from "react";
import type { MediaItem } from "../types/media";

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

interface PlayerState {
  currentIndex: number;
  itemStartedAt: number;
  cycleStartedAt: number;
}

export function usePlaylistPlayer(
  playlist: MediaItem[],
  isPaused = false,
) {
  const [playerState, setPlayerState] = useState<PlayerState>(() => {
    const currentTime = Date.now();

    return {
      currentIndex: 0,
      itemStartedAt: currentTime,
      cycleStartedAt: currentTime,
    };
  });

  const pauseStartedAt = useRef<number | null>(null);
  const itemPausedDuration = useRef(0);
  const cyclePausedDuration = useRef(0);

  const currentItem =
    playlist.length > 0
      ? playlist[playerState.currentIndex % playlist.length]
      : null;

  // Record how long normal playback remains paused during sync.
  useEffect(() => {
    if (isPaused) {
      if (pauseStartedAt.current === null) {
        pauseStartedAt.current = Date.now();
      }

      return;
    }

    if (pauseStartedAt.current !== null) {
      const pausedFor = Date.now() - pauseStartedAt.current;

      itemPausedDuration.current += pausedFor;
      cyclePausedDuration.current += pausedFor;
      pauseStartedAt.current = null;
    }
  }, [isPaused]);

  useEffect(() => {
    if (!currentItem || playlist.length === 0 || isPaused) {
      return;
    }

    const currentTime = Date.now();
    const itemDurationMs = Math.max(currentItem.duration, 1) * 1000;

    const itemEndsAt =
      playerState.itemStartedAt +
      itemPausedDuration.current +
      itemDurationMs;

    const cycleEndsAt =
      playerState.cycleStartedAt +
      cyclePausedDuration.current +
      FIVE_HOURS_MS;

    const nextChangeAt = Math.min(itemEndsAt, cycleEndsAt);
    const remainingTime = Math.max(nextChangeAt - currentTime, 0);

    const timer = window.setTimeout(() => {
      const changeTime = Date.now();

      setPlayerState((previousState) => {
        const cycleElapsed =
          changeTime -
          previousState.cycleStartedAt -
          cyclePausedDuration.current;

        if (cycleElapsed >= FIVE_HOURS_MS) {
          itemPausedDuration.current = 0;
          cyclePausedDuration.current = 0;

          return {
            currentIndex: 0,
            itemStartedAt: changeTime,
            cycleStartedAt: changeTime,
          };
        }

        itemPausedDuration.current = 0;

        return {
          ...previousState,
          currentIndex:
            (previousState.currentIndex + 1) % playlist.length,
          itemStartedAt: changeTime,
        };
      });
    }, remainingTime);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    currentItem,
    isPaused,
    playlist.length,
    playerState.itemStartedAt,
    playerState.cycleStartedAt,
  ]);

  return {
    currentItem,
    currentIndex:
      playlist.length > 0
        ? playerState.currentIndex % playlist.length
        : 0,
    cycleStartedAt: playerState.cycleStartedAt,
  };
}