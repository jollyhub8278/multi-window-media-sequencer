import { useState } from "react";
import type { MediaItem } from "../types/media";

interface MediaRendererProps {
  media: MediaItem;
}

function MediaRenderer({ media }: MediaRendererProps) {
  const [hasError, setHasError] = useState(false);

  if (media.type === "blank") {
    return (
      <div className="media-fallback media-blank">
        <span>Blank Screen</span>
      </div>
    );
  }

  if (!media.url || hasError) {
    return (
      <div className="media-fallback">
        <span>Media unavailable</span>
      </div>
    );
  }

  if (media.type === "image") {
    return (
      <img
        className="media-content"
        src={media.url}
        alt={media.name}
        onError={() => setHasError(true)}
      />
    );
  }

  if (media.type === "video") {
    return (
      <video
        className="media-content"
        src={media.url}
        autoPlay
        muted
        playsInline
        loop
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className="media-fallback">
      <span>Unsupported media</span>
    </div>
  );
}

export default MediaRenderer;