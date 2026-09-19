import { useEffect, useState } from "react";

import "./App.css";
import AddMediaForm from "./components/AddMediaForm";
import MediaWindow from "./components/MediaWindow";
import { useSyncPlayback } from "./hooks/useSyncPlayback";
import {
  addPlaylistItem,
  getMedia,
  getWindows,
} from "./services/api";

import type {
  DisplayWindow,
  MediaItem,
} from "./types/media";

function App() {
  const [displayWindows, setDisplayWindows] =
    useState<DisplayWindow[]>([]);

  const [mediaLibrary, setMediaLibrary] =
    useState<MediaItem[]>([]);

  const [selectedMediaId, setSelectedMediaId] =
    useState("");

  const [syncDuration, setSyncDuration] =
    useState(10);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSyncStarting, setIsSyncStarting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [syncErrorMessage, setSyncErrorMessage] =
    useState("");

  const {
    activeSync,
    isSocketConnected,
    triggerSync,
  } = useSyncPlayback();

  useEffect(() => {
    let isCancelled = false;

    async function loadApplicationData() {
      try {
        const [windows, media] = await Promise.all([
          getWindows(),
          getMedia(),
        ]);

        if (!isCancelled) {
          setDisplayWindows(windows);
          setMediaLibrary(media);
          setErrorMessage("");
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Failed to load application data",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadApplicationData();

    return () => {
      isCancelled = true;
    };
  }, []);

  const totalPlaylistItems = displayWindows.reduce(
    (total, windowData) =>
      total + windowData.playlist.length,
    0,
  );

  const effectiveSelectedMediaId =
    selectedMediaId || mediaLibrary[0]?.id || "";

  async function handleStartSync() {
    if (!effectiveSelectedMediaId) {
      return;
    }

    const validDuration = Math.max(
      syncDuration,
      1,
    );

    setIsSyncStarting(true);
    setSyncErrorMessage("");

    try {
      await triggerSync(
        effectiveSelectedMediaId,
        validDuration,
      );
    } catch (error) {
      setSyncErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to start synchronized playback",
      );
    } finally {
      setIsSyncStarting(false);
    }
  }

  async function handleAddMedia(
    windowID: string,
    mediaID: string,
    duration: number,
  ) {
    await addPlaylistItem(
      windowID,
      mediaID,
      duration,
    );

    const updatedWindows = await getWindows();
    setDisplayWindows(updatedWindows);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">
            Playback dashboard
          </p>

          <h1>Multi-Window Media Sequencer</h1>

          <p className="header-description">
            Independent playlists with continuous
            playback and a five-hour cycle.
          </p>
        </div>

        <div className="system-status">
          <span
            className={
              isSocketConnected
                ? "status-dot"
                : "status-dot status-dot--offline"
            }
          />

          {activeSync
            ? "Sync playback active"
            : isSocketConnected
              ? "Real-time connected"
              : "Real-time reconnecting"}
        </div>
      </header>

      {isLoading && (
        <section className="summary-card">
          Loading playlists from the Go backend...
        </section>
      )}

      {!isLoading && errorMessage && (
        <section className="summary-card">
          <span>Backend connection failed</span>
          <strong>{errorMessage}</strong>
        </section>
      )}

      {!isLoading && !errorMessage && (
        <>
          <section className="summary-grid">
            <div className="summary-card">
              <span>Display windows</span>
              <strong>
                {displayWindows.length}
              </strong>
            </div>

            <div className="summary-card">
              <span>Playlist items</span>
              <strong>
                {totalPlaylistItems}
              </strong>
            </div>

            <div className="summary-card">
              <span>Cycle duration</span>
              <strong>5 hours</strong>
            </div>
          </section>

          <AddMediaForm
            windows={displayWindows}
            mediaItems={mediaLibrary}
            onAdd={handleAddMedia}
          />

          <section className="sync-panel">
            <div className="sync-panel-heading">
              <div>
                <p className="eyebrow">
                  Global override
                </p>

                <h2>Sync Playback</h2>
              </div>

              {activeSync && (
                <span className="active-sync-label">
                  Playing {activeSync.media.name}
                </span>
              )}
            </div>

            <div className="sync-controls">
              <label>
                <span>Media</span>

                <select
                  value={effectiveSelectedMediaId}
                  disabled={
                    activeSync !== null ||
                    isSyncStarting
                  }
                  onChange={(event) =>
                    setSelectedMediaId(
                      event.target.value,
                    )
                  }
                >
                  {mediaLibrary.map((media) => (
                    <option
                      key={media.id}
                      value={media.id}
                    >
                      {media.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Duration in seconds</span>

                <input
                  type="number"
                  min="1"
                  max="300"
                  value={syncDuration}
                  disabled={
                    activeSync !== null ||
                    isSyncStarting
                  }
                  onChange={(event) =>
                    setSyncDuration(
                      Number(event.target.value),
                    )
                  }
                />
              </label>

              <button
                className="start-sync-button"
                type="button"
                disabled={
                  !effectiveSelectedMediaId ||
                  activeSync !== null ||
                  isSyncStarting
                }
                onClick={() =>
                  void handleStartSync()
                }
              >
                {activeSync
                  ? "Sync in progress"
                  : isSyncStarting
                    ? "Starting..."
                    : "Sync All Windows"}
              </button>
            </div>

            {syncErrorMessage && (
              <p role="alert">
                {syncErrorMessage}
              </p>
            )}
          </section>

          <section className="windows-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  Live preview
                </p>

                <h2>Display Windows</h2>
              </div>

              <span>
                {displayWindows.length} windows online
              </span>
            </div>

            <div className="windows-grid">
              {displayWindows.map(
                (windowData) => (
                  <MediaWindow
                    key={windowData.id}
                    windowData={windowData}
                    syncMedia={
                      activeSync?.media ?? null
                    }
                  />
                ),
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default App;