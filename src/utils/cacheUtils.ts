import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CachedPostsData {
  posts: any[];
  location: string;
  timestamp: number;
  lastPostId?: string; // ID of the most recent post for comparison
}

const CACHE_KEYS = {
  HOME_POSTS: "whispernet_home_posts_cache",
};

const BACKGROUND_FETCH_INTERVAL = 90 * 1000; // 90 seconds in milliseconds

export const cacheUtils = {
  // Save posts to cache
  savePosts: async (posts: any[], location: string): Promise<void> => {
    try {
      const cacheData: CachedPostsData = {
        posts,
        location,
        timestamp: Date.now(),
        lastPostId: posts.length > 0 ? posts[0].id : undefined,
      };

      await AsyncStorage.setItem(
        CACHE_KEYS.HOME_POSTS,
        JSON.stringify(cacheData)
      );
    } catch (error) {
    }
  },

  // Get cached posts
  getCachedPosts: async (): Promise<CachedPostsData | null> => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEYS.HOME_POSTS);
      if (!cachedData) return null;

      const parsedData: CachedPostsData = JSON.parse(cachedData);
      return parsedData;
    } catch (error) {
      return null;
    }
  },

  // Check if it's time for background fetch (90 seconds since last fetch)
  shouldBackgroundFetch: (lastFetchTime: number): boolean => {
    return Date.now() - lastFetchTime > BACKGROUND_FETCH_INTERVAL;
  },

  // Check if there are newer posts by comparing the latest post ID
  hasNewerPosts: (cachedData: CachedPostsData, newPosts: any[]): boolean => {
    if (!cachedData.lastPostId || newPosts.length === 0) return false;

    // Check if the first post in new data has a different ID than cached
    // AND if there are posts in new data that don't exist in cached data
    const newFirstPostId = newPosts[0].id;
    const cachedPostIds = new Set(cachedData.posts.map((post) => post.id));

    // If the first post is different, check if it's actually new (not in cache)
    if (newFirstPostId !== cachedData.lastPostId) {
      return !cachedPostIds.has(newFirstPostId);
    }

    // Also check if there are any new posts that aren't in cache
    return newPosts.some((post) => !cachedPostIds.has(post.id));
  },

  // Add new post to existing cache
  addPostToCache: async (newPost: any): Promise<void> => {
    try {
      const cached = await cacheUtils.getCachedPosts();
      if (cached) {
        const updatedPosts = [newPost, ...cached.posts];
        await cacheUtils.savePosts(updatedPosts, cached.location);
      }
    } catch (error) {
    }
  },

  // Clear cache
  clearCache: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(CACHE_KEYS.HOME_POSTS);
    } catch (error) {
    }
  },

  // Get cache age in seconds
  getCacheAge: (cacheData: CachedPostsData): number => {
    return Math.floor((Date.now() - cacheData.timestamp) / 1000);
  },
};
