// src/lib/podcasts.ts
import { parseFeed } from 'rn-rss-parser';

export type PodcastEpisode = {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  duration: string;
  pubDate: string;
};

export type PodcastShow = {
  id: string;
  title: string;
  author: string;
  artwork: string;
  feedUrl: string;
};

// 1. Search for a podcast using the free iTunes API
export async function searchPodcasts(query: string): Promise<PodcastShow[]> {
  try {
    const response = await fetch(
      `https://itunes.apple.com/search?media=podcast&term=${encodeURIComponent(query)}&limit=10`
    );
    const data = await response.json();
    
    return data.results.map((item: any) => ({
      id: String(item.collectionId),
      title: item.collectionName,
      author: item.artistName,
      artwork: item.artworkUrl600,
      feedUrl: item.feedUrl,
    })).filter((podcast: PodcastShow) => podcast.feedUrl); // Only return ones with a feed
  } catch (error) {
    console.error("Podcast search failed:", error);
    return [];
  }
}

// 2. Fetch and parse the RSS feed to get real episodes
export async function getPodcastEpisodes(feedUrl: string): Promise<PodcastEpisode[]> {
  try {
    const response = await fetch(feedUrl);
    const xml = await response.text();
    const feed = parseFeed(xml);
    
    // Parse the items from the feed
    return feed.items.map((item: any, index: number) => {
      // Find the audio enclosure
      const enclosure = item.enclosures?.find((e: any) => e.url);
      
      return {
        id: item.guid || String(index),
        title: item.title || "Untitled Episode",
        description: item.description || "",
        audioUrl: enclosure?.url || "",
        duration: item.itunes?.duration || "Unknown",
        pubDate: item.pubDate || "",
      };
    }).filter((ep: PodcastEpisode) => ep.audioUrl); // Only keep episodes with audio
  } catch (error) {
    console.error("Failed to parse podcast feed:", error);
    return [];
  }
}