import type { DisplayWindow, MediaItem } from "../types/media";

export const mediaLibrary: MediaItem[] = [
  {
    id: "media-1",
    name: "Mountain Image",
    type: "image",
    url: "https://picsum.photos/seed/mountain/1200/700",
    duration: 6,
  },
  {
    id: "media-2",
    name: "Flower Video",
    type: "video",
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    duration: 10,
  },
  {
    id: "media-3",
    name: "City Image",
    type: "image",
    url: "https://picsum.photos/seed/city/1200/700",
    duration: 7,
  },
  {
    id: "media-4",
    name: "Forest Image",
    type: "image",
    url: "https://picsum.photos/seed/forest/1200/700",
    duration: 6,
  },
  {
    id: "media-blank",
    name: "Blank Screen",
    type: "blank",
    duration: 4,
  },
];

export const initialWindows: DisplayWindow[] = [
  {
    id: "window-1",
    name: "Lobby Display",
    playlist: [mediaLibrary[0], mediaLibrary[1]],
  },
  {
    id: "window-2",
    name: "Reception Display",
    playlist: [mediaLibrary[2], mediaLibrary[4], mediaLibrary[0]],
  },
  {
    id: "window-3",
    name: "Cafeteria Display",
    playlist: [mediaLibrary[1], mediaLibrary[3]],
  },
];