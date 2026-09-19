import { useEffect, useState } from "react";
import "./App.css";
import MediaWindow from "./components/MediaWindow";
// import { getMedia, getWindows } from "./services/api";
import type { DisplayWindow, MediaItem } from "./types/media";
import AddMediaForm from "./components/AddMediaForm";
import { addPlaylistItem, getMedia, getWindows } from "./services/api";
interface ActiveSync {
  media: MediaItem;
  endsAt: number;
}

function App() {
  const [displayWindows, setDisplayWindows] = useState<DisplayWindow[]>([]);

  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);

  const [selectedMediaId, setSelectedMediaId] = useState("");

  const [syncDuration, setSyncDuration] = useState(10);
  const [activeSync, setActiveSync] = useState<ActiveSync | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadApplicationData() {
      try {
        const [windows, media] = await Promise.all([getWindows(), getMedia()]);

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

  useEffect(() => {
    if (!activeSync) {
      return;
    }

    const remainingTime = Math.max(activeSync.endsAt - Date.now(), 0);

    const timer = window.setTimeout(() => {
      setActiveSync(null);
    }, remainingTime);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeSync]);

  const totalPlaylistItems = displayWindows.reduce(
    (total, windowData) => total + windowData.playlist.length,
    0,
  );

  const effectiveSelectedMediaId = selectedMediaId || mediaLibrary[0]?.id || "";

  function handleStartSync() {
    const selectedMedia = mediaLibrary.find(
      (media) => media.id === effectiveSelectedMediaId,
    );

    if (!selectedMedia) {
      return;
    }

    const validDuration = Math.max(syncDuration, 1);

    setActiveSync({
      media: selectedMedia,
      endsAt: Date.now() + validDuration * 1000,
    });
  }

  function handleStopSync() {
    setActiveSync(null);
  }

  async function handleAddMedia(
    windowID: string,
    mediaID: string,
    duration: number,
  ) {
    await addPlaylistItem(windowID, mediaID, duration);

    const updatedWindows = await getWindows();
    setDisplayWindows(updatedWindows);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Playback dashboard</p>

          <h1>Multi-Window Media Sequencer</h1>

          <p className="header-description">
            Independent playlists with continuous playback and a five-hour
            cycle.
          </p>
        </div>

        <div className="system-status">
          <span className="status-dot" />

          {activeSync ? "Sync playback active" : "Backend connected"}
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
              <strong>{displayWindows.length}</strong>
            </div>

            <div className="summary-card">
              <span>Playlist items</span>
              <strong>{totalPlaylistItems}</strong>
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
                <p className="eyebrow">Global override</p>
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
                  disabled={activeSync !== null}
                  onChange={(event) => setSelectedMediaId(event.target.value)}
                >
                  {mediaLibrary.map((media) => (
                    <option key={media.id} value={media.id}>
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
                  disabled={activeSync !== null}
                  onChange={(event) =>
                    setSyncDuration(Number(event.target.value))
                  }
                />
              </label>

              {activeSync ? (
                <button
                  className="stop-sync-button"
                  type="button"
                  onClick={handleStopSync}
                >
                  Stop Sync
                </button>
              ) : (
                <button
                  className="start-sync-button"
                  type="button"
                  disabled={!effectiveSelectedMediaId}
                  onClick={handleStartSync}
                >
                  Sync All Windows
                </button>
              )}
            </div>
          </section>

          <section className="windows-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Live preview</p>
                <h2>Display Windows</h2>
              </div>

              <span>{displayWindows.length} windows online</span>
            </div>

            <div className="windows-grid">
              {displayWindows.map((windowData) => (
                <MediaWindow
                  key={windowData.id}
                  windowData={windowData}
                  syncMedia={activeSync?.media ?? null}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default App;
