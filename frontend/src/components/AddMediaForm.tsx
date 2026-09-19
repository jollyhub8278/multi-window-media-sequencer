import { useState } from "react";
import type { FormEvent } from "react";
import type {
  DisplayWindow,
  MediaItem,
} from "../types/media";

interface AddMediaFormProps {
  windows: DisplayWindow[];
  mediaItems: MediaItem[];

  onAdd: (
    windowID: string,
    mediaID: string,
    duration: number,
  ) => Promise<void>;
}

function AddMediaForm({
  windows,
  mediaItems,
  onAdd,
}: AddMediaFormProps) {
  const [selectedWindowID, setSelectedWindowID] =
    useState("");

  const [selectedMediaID, setSelectedMediaID] =
    useState("");

  const [duration, setDuration] = useState(6);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [message, setMessage] = useState("");

  const effectiveWindowID =
    selectedWindowID || windows[0]?.id || "";

  const effectiveMediaID =
    selectedMediaID || mediaItems[0]?.id || "";

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!effectiveWindowID || !effectiveMediaID) {
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");

      await onAdd(
        effectiveWindowID,
        effectiveMediaID,
        Math.max(duration, 1),
      );

      setMessage("Media added successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to add media",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="playlist-manager">
      <div>
        <p className="eyebrow">Dynamic playlist</p>
        <h2>Add Media to Window</h2>
      </div>

      <form
        className="add-media-form"
        onSubmit={handleSubmit}
      >
        <label>
          <span>Display window</span>

          <select
            value={effectiveWindowID}
            onChange={(event) =>
              setSelectedWindowID(event.target.value)
            }
          >
            {windows.map((windowData) => (
              <option
                key={windowData.id}
                value={windowData.id}
              >
                {windowData.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Media</span>

          <select
            value={effectiveMediaID}
            onChange={(event) => {
              const mediaID = event.target.value;
              const media = mediaItems.find(
                (item) => item.id === mediaID,
              );

              setSelectedMediaID(mediaID);

              if (media) {
                setDuration(media.duration);
              }
            }}
          >
            {mediaItems.map((media) => (
              <option key={media.id} value={media.id}>
                {media.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Duration</span>

          <input
            type="number"
            min="1"
            max="86400"
            value={duration}
            onChange={(event) =>
              setDuration(Number(event.target.value))
            }
          />
        </label>

        <button
          className="start-sync-button"
          type="submit"
          disabled={
            isSubmitting ||
            !effectiveWindowID ||
            !effectiveMediaID
          }
        >
          {isSubmitting ? "Adding..." : "Add to Playlist"}
        </button>
      </form>

      {message && (
        <p className="form-message">{message}</p>
      )}
    </section>
  );
}

export default AddMediaForm;