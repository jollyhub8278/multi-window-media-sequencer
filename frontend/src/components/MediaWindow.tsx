import MediaRenderer from "./MediaRenderer";
import { usePlaylistPlayer } from "../hooks/usePlaylistPlayer";
import type { DisplayWindow, MediaItem } from "../types/media";

interface MediaWindowProps {
  windowData: DisplayWindow;
  syncMedia: MediaItem | null;
}

function MediaWindow({
  windowData,
  syncMedia,
}: MediaWindowProps) {
  const isSyncing = syncMedia !== null;

  const { currentItem, currentIndex } = usePlaylistPlayer(
    windowData.playlist,
    isSyncing,
  );

  const displayedItem = syncMedia ?? currentItem;

  if (!displayedItem) {
    return (
      <article className="display-window">
        <header className="window-header">
          <div>
            <span className="window-label">Display window</span>
            <h2>{windowData.name}</h2>
          </div>

          <span className="status-badge status-empty">Empty</span>
        </header>

        <div className="media-stage">
          <div className="media-fallback">
            <span>No media configured</span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`display-window ${
        isSyncing ? "window-syncing" : ""
      }`}
    >
      <header className="window-header">
        <div>
          <span className="window-label">Display window</span>
          <h2>{windowData.name}</h2>
        </div>

        <span
          className={`status-badge ${
            isSyncing ? "status-syncing" : ""
          }`}
        >
          {isSyncing ? "Synchronized" : "Playing"}
        </span>
      </header>

      <div className="media-stage">
        <MediaRenderer
          key={`${windowData.id}-${displayedItem.id}-${isSyncing}`}
          media={displayedItem}
        />

        <div className="media-overlay">
          <strong>{displayedItem.name}</strong>
          <span>{displayedItem.type}</span>
        </div>
      </div>

      <footer className="window-footer">
        {isSyncing ? (
          <>
            <span>Sync override active</span>
            <span>Playlist paused</span>
          </>
        ) : (
          <>
            <span>
              Item {currentIndex + 1} of{" "}
              {windowData.playlist.length}
            </span>

            <span>{displayedItem.duration} seconds</span>
          </>
        )}
      </footer>
    </article>
  );
}

export default MediaWindow;