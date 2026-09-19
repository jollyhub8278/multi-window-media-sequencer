export type MediaType = "image" | "video" | "blank";

export interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  url?: string;
  duration: number;
}

export interface DisplayWindow {
  id: string;
  name: string;
  playlist: MediaItem[];
}