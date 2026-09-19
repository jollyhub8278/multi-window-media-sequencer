import { useEffect, useState } from "react";
import "./App.css";
import MediaWindow from "./components/MediaWindow";
import {
  initialWindows,
  mediaLibrary,
} from "./data/seedData";
import type { MediaItem } from "./types/media";

interface ActiveSync {
  media: MediaItem;
  endsAt: number;
}

function App() {
  const [selectedMediaId, setSelectedMediaId] = useState(
    mediaLibrary[0].id,
  );
  const [syncDuration, setSyncDuration] = useState(10);
  const [activeSync, setActiveSync] =
    useState<ActiveSync | null>(null);

  const totalPlaylistItems = initialWindows.reduce(
    (total, windowData) => total + windowData.playlist.length,
    0,
  );

  useEffect(() => {
    if (!activeSync) {
      return;
    }

    const remainingTime = Math.max(
      activeSync.endsAt - Date.now(),
      0,
    );

    const timer = window.setTimeout(() => {
      setActiveSync(null);
    }, remainingTime);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeSync]);

  function handleStartSync() {
    const selectedMedia = mediaLibrary.find(
      (media) => media.id === selectedMediaId,
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

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Playback dashboard</p>
          <h1>Multi-Window Media Sequencer</h1>
          <p className="header-description">
            Independent playlists with continuous playback and a
            five-hour cycle.
          </p>
        </div>

        <div className="system-status">
          <span className="status-dot" />
          {activeSync ? "Sync playback active" : "Local playback active"}
        </div>
      </header>

      <section className="summary-grid">
        <div className="summary-card">
          <span>Display windows</span>
          <strong>{initialWindows.length}</strong>
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
              value={selectedMediaId}
              disabled={activeSync !== null}
              onChange={(event) =>
                setSelectedMediaId(event.target.value)
              }
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

          <span>{initialWindows.length} windows online</span>
        </div>

        <div className="windows-grid">
          {initialWindows.map((windowData) => (
            <MediaWindow
              key={windowData.id}
              windowData={windowData}
              syncMedia={activeSync?.media ?? null}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;