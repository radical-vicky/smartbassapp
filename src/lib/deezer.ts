// src/lib/deezer.ts

// Using a more reliable CORS proxy for development.
// For production, you MUST deploy your own proxy server.
const PROXY_URL = "https://proxy.cors.dev/";
const DEEZER_API = "https://api.deezer.com";

export type DeezerTrack = {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  previewUrl: string | null;
  duration: number;
};

export async function searchDeezerTracks(query: string): Promise<DeezerTrack[]> {
  if (!query.trim()) return [];

  try {
    const targetUrl = `${DEEZER_API}/search?q=${encodeURIComponent(query)}`;
    const url = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Deezer HTTP error:", response.status);
      return [];
    }

    const data = await response.json();
    
    // CRITICAL: Deezer returns 200 OK even for errors (like rate limits)
    if (data.error) {
      console.error("Deezer API error:", data.error.message || data.error);
      return [];
    }
    
    if (!data.data) return [];

    return data.data.map((track: any) => ({
      id: String(track.id),
      name: track.title,
      artist: track.artist.name,
      albumArt: track.album.cover_medium,
      previewUrl: track.preview, // This will always be a 30-second clip
      duration: track.duration,
    }));
  } catch (error) {
    console.error("Deezer search error:", error);
    return [];
  }
}