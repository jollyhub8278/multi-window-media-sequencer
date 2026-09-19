import type {
  DisplayWindow,
  MediaItem,
} from "../types/media";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:8080/api";

interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
  });

  const responseData =
    (await response.json()) as APIResponse<T>;

  if (!response.ok || !responseData.success) {
    throw new Error(
      responseData.message ?? "API request failed",
    );
  }

  return responseData.data;
}

export function getMedia(): Promise<MediaItem[]> {
  return request<MediaItem[]>("/media");
}

export function getWindows(): Promise<DisplayWindow[]> {
  return request<DisplayWindow[]>("/windows");
}

export function addPlaylistItem(
  windowID: string,
  mediaID: string,
  displayDuration: number,
): Promise<unknown> {
  return request(
    `/windows/${windowID}/playlist-items`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mediaId: mediaID,
        displayDuration,
      }),
    },
  );
}