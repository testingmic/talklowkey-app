import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService, uuidManager } from "./authService";

// Default token - only used if no token is found in storage
const DEFAULT_TOKEN = "22e174344c2f49ded272945a4d460425";
// Default UUID - only used if no user UUID is found
const DEFAULT_UUID = "6711ad32-07b2-40ba-a8ae-a271dfa05039";

// Types
export interface Post {
  id: string;
  content: string;
  username: string;
  timestamp: string;
  ago: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  distance: string;
  latitude?: number;
  longitude?: number;
  userVote?: "up" | "down" | null;
  isAnonymous: boolean;
  manage?: {
    delete: boolean;
    report: boolean;
    save: boolean;
    bookmarked: boolean;
    voted: "up" | "down" | false;
  };
}

// Interface for the API response
export interface NearbyPostsResponse {
  status: string;
  data: any[];
  requestId: string;
  location: {
    mode: string;
    city: string;
    district: string;
    country: string;
    latitude: string;
    longitude: string;
  };
}

export interface Comment {
  id: string;
  content: string;
  username: string;
  timestamp: string;
  upvotes: number;
  downvotes: number;
  isAnonymous: boolean;
}

export interface MediaFile {
  uri: string;
  type: string;
  name?: string;
}

export interface CreatePostRequest {
  content: string;
  latitude: number;
  longitude: number;
  isAnonymous: boolean;
  mediaFiles?: MediaFile[];
  audioFile?: MediaFile;
}

export interface CreateCommentRequest {
  content: string;
  postId: string;
  isAnonymous: boolean;
  latitude?: number;
  longitude?: number;
}

// Get the stored auth token
export const getStoredToken = async (): Promise<string> => {
  try {
    // Use authService to get the current token
    const token = await authService.getCurrentToken();
    if (token) {
      return token;
    } else {
      return DEFAULT_TOKEN;
    }
  } catch (error) {
    return DEFAULT_TOKEN;
  }
};

// UUID generation is now handled by authService

// Get user-specific UUID
export const getUserUUID = async (): Promise<string> => {
  try {
    // Use uuidManager to get the UUID
    const uuid = await uuidManager.getUUID();
    if (uuid) {
      return uuid;
    } else {
      return DEFAULT_UUID;
    }
  } catch (error) {
    return DEFAULT_UUID;
  }
};

// UUID management is now handled by authService

// Helper functions for managing user-specific saved posts locally
export const addSavedPostLocally = async (postId: string): Promise<void> => {
  try {
    const userUUID = await getUserUUID();
    const savedPostsKey = `saved_posts_${userUUID}`;

    const existingSavedPosts = await AsyncStorage.getItem(savedPostsKey);
    let savedPosts: string[] = existingSavedPosts
      ? JSON.parse(existingSavedPosts)
      : [];

    if (!savedPosts.includes(postId)) {
      savedPosts.push(postId);
      await AsyncStorage.setItem(savedPostsKey, JSON.stringify(savedPosts));
    }
  } catch (error) {}
};

export const removeSavedPostLocally = async (postId: string): Promise<void> => {
  try {
    const userUUID = await getUserUUID();
    const savedPostsKey = `saved_posts_${userUUID}`;

    const existingSavedPosts = await AsyncStorage.getItem(savedPostsKey);
    let savedPosts: string[] = existingSavedPosts
      ? JSON.parse(existingSavedPosts)
      : [];

    savedPosts = savedPosts.filter((id) => id !== postId);
    await AsyncStorage.setItem(savedPostsKey, JSON.stringify(savedPosts));
  } catch (error) {}
};

export const getSavedPostIdsLocally = async (): Promise<string[]> => {
  try {
    const userUUID = await getUserUUID();
    const savedPostsKey = `saved_posts_${userUUID}`;

    const savedPosts = await AsyncStorage.getItem(savedPostsKey);
    return savedPosts ? JSON.parse(savedPosts) : [];
  } catch (error) {
    return [];
  }
};

// Additional interfaces for explore functionality
export interface TrendingPost {
  post_id: string;
  content: string;
  username: string;
  ago: string;
  upvotes: number;
  downvotes: number;
  comments_count: number;
  score: number;
  city?: string;
  latitude?: string;
  longitude?: string;
  profile_image?: string;
  has_media?: boolean;
  post_media?: any;
  media_types?: string[];
  manage?: {
    delete: boolean;
    report: boolean;
    save: boolean;
    bookmarked: boolean;
    voted: "up" | "down" | false;
  };
}

export interface PopularTag {
  tag_id: number;
  name: string;
  usage_count: number;
}

export interface TrendingPostsResponse {
  status: string;
  data: TrendingPost[];
  requestId: string;
}

export interface PopularTagsResponse {
  status: string;
  data: PopularTag[];
}

export interface TagPostsResponse {
  status: string;
  data: any[];
  requestId: string;
}

export interface NotificationData {
  notification_id: string;
  user_id: string;
  type: string;
  section: string;
  reference_id: string;
  content: string;
  is_read: string; // "0" or "1"
  created_at: string;
  time_ago: string;
}

export interface NotificationsResponse {
  status: string;
  data: NotificationData[];
  requestId: string;
}

// Post service functions
export const postService = {
  // Get nearby posts
  getNearbyPosts: async (
    latitude?: number | string,
    longitude?: number | string,
    last_record_id: number | string = 1,
    limit: number = 100,
    radius: number = 35
  ) => {
    try {
      // Get token and userUUID from storage
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      // Ensure coordinates are valid
      if (!latitude || !longitude) {
        throw new Error("Invalid coordinates provided");
      }

      // Convert coordinates to strings if they aren't already
      const latStr =
        typeof latitude === "number" ? latitude.toString() : latitude;
      const lngStr =
        typeof longitude === "number" ? longitude.toString() : longitude;

      const response = await api.get<NearbyPostsResponse>("/posts/nearby", {
        params: {
          last_record_id,
          longitude: lngStr,
          latitude: latStr,
          token,
          limit,
          userUUID,
          radius,
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all posts
  getPosts: async (
    latitude: number,
    longitude: number,
    radius: number = 10
  ) => {
    try {
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      const response = await api.get("/posts", {
        params: { latitude, longitude, radius, token, userUUID },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get a single post by ID
  getPostById: async (
    postId: string,
    latitude?: number,
    longitude?: number
  ) => {
    try {
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      const response = await api.get(`/posts/${postId}`, {
        params: {
          token,
          userUUID,
          latitude: latitude?.toString() || "0",
          longitude: longitude?.toString() || "0",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a new post
  createPost: async (postData: CreatePostRequest) => {
    try {
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      // Create FormData for file upload
      const formData = new FormData();

      // Add basic fields
      formData.append("content", postData.content);
      formData.append("latitude", postData.latitude.toString());
      formData.append("longitude", postData.longitude.toString());
      formData.append("token", token);
      formData.append("userUUID", userUUID);

      // Add media files if any
      if (postData.mediaFiles && postData.mediaFiles.length > 0) {
        postData.mediaFiles.forEach((media, index) => {
          formData.append(`media[${index}]`, {
            uri: media.uri,
            type: media.type,
            name: media.name || `media_${index}.jpg`,
          } as any);
        });
      }

      // Add audio if provided
      if (postData.audioFile) {
        formData.append("audio", {
          uri: postData.audioFile.uri,
          type: "audio/m4a",
          name: "audio.m4a",
        } as any);
      }

      const response = await api.post("/posts/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Vote on a post or comment
  votePost: async (
    recordId: string,
    voteType: "up" | "down" | null,
    latitude?: number | string,
    longitude?: number | string,
    section: "posts" | "comments" = "posts" // Default to posts
  ) => {
    try {
      // Get token and UUID from storage
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      // Create payload according to API requirements
      const payload = {
        recordId: recordId,
        direction: voteType, // "up" or "down"
        section: section,
        token: token,
        userUUID: userUUID,
        ownerId: recordId, // Using recordId as ownerId as per requirement
        latitude: latitude?.toString() || "0",
        longitude: longitude?.toString() || "0",
      };

      // Make API call to vote endpoint
      const response = await api.post("/posts/vote", payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get comments for a post
  getComments: async (
    postId: string,
    latitude?: number,
    longitude?: number
  ) => {
    try {
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      const response = await api.get("/posts/comments", {
        params: {
          token,
          postId,
          userUUID,
          latitude: latitude?.toString() || "0",
          longitude: longitude?.toString() || "0",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a comment on a post
  createComment: async (commentData: CreateCommentRequest) => {
    try {
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      const response = await api.post("/posts/comment", {
        content: commentData.content,
        postId: commentData.postId,
        token,
        uuid: userUUID, // API expects 'uuid' not 'userUUID'
        latitude: commentData.latitude?.toString() || "0",
        longitude: commentData.longitude?.toString() || "0",
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Save a post (bookmark)
  savePost: async (postId: string) => {
    try {
      // Get token and UUID from storage
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      const response = await api.post(
        `/posts/bookmark/${postId}?token=${token}&userUUID=${userUUID}`
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Unsave a post (remove bookmark)
  unsavePost: async (postId: string) => {
    try {
      // Get token and UUID from storage
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      // Try different approaches to unsave
      const attempts = [
        // Method 1: POST to same endpoint with action=remove in body
        () =>
          api.post(
            `/posts/bookmark/${postId}?token=${token}&userUUID=${userUUID}`,
            { action: "remove" }
          ),
        // Method 2: POST to same endpoint with remove=true in query
        () =>
          api.post(
            `/posts/bookmark/${postId}?token=${token}&userUUID=${userUUID}&action=remove`
          ),
        // Method 3: POST to same endpoint with unsave=true in query
        () =>
          api.post(
            `/posts/bookmark/${postId}?token=${token}&userUUID=${userUUID}&unsave=true`
          ),
        // Method 4: Different endpoint pattern
        () =>
          api.post(
            `/posts/${postId}/bookmark/remove?token=${token}&userUUID=${userUUID}`
          ),
        // Method 5: Original DELETE method
        () =>
          api.delete(
            `/posts/bookmark/${postId}?token=${token}&userUUID=${userUUID}`
          ),
      ];

      let lastError;
      for (let i = 0; i < attempts.length; i++) {
        try {
          const response = await attempts[i]();
          return response.data;
        } catch (error: any) {
          lastError = error;
        }
      }

      // If all methods fail, throw the last error
      throw lastError;
    } catch (error) {
      throw error;
    }
  },

  // Get saved posts (bookmarked posts)
  getSavedPosts: async () => {
    try {
      // Get token and UUID from storage
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      const response = await api.get("/posts/bookmarked", {
        params: {
          token,
          userUUID,
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a comment
  deleteComment: async (commentId: string) => {
    try {
      // Get token and UUID from storage
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      const response = await api.delete(
        `/posts/deletecomment/${commentId}?userUUID=${userUUID}&token=${token}`
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a post
  deletePost: async (postId: string) => {
    try {
      // Get token and UUID from storage
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      try {
        // Try DELETE method first
        const response = await api.delete(
          `/posts/${postId}?userUUID=${userUUID}`,
          {
            data: { token }, // Send token in request body for DELETE
          }
        );
        return response.data;
      } catch (deleteError) {
        // If DELETE doesn't work, try POST as fallback
        const response = await api.post(
          `/posts/${postId}?userUUID=${userUUID}`,
          { token }
        );
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  },

  // Remove vote from a post or comment
  removeVote: async (
    recordId: string,
    section: "posts" | "comments" = "posts"
  ) => {
    // Get token and UUID from storage
    const token = await getStoredToken();
    const userUUID = await getUserUUID();

    try {
      // Try DELETE with section as query parameter (avoiding request body issues)
      const response = await api.delete(
        `/posts/removevote/${recordId}?token=${token}&userUUID=${userUUID}&section=${section}`
      );

      return response.data;
    } catch (error) {
      // If DELETE doesn't work, try POST as fallback
      try {
        const postResponse = await api.post(
          `/posts/removevote/${recordId}?token=${token}&userUUID=${userUUID}`,
          {
            section: section,
          }
        );
        return postResponse.data;
      } catch (postError) {
        throw postError;
      }
    }
  },

  // Get trending posts
  getTrendingPosts: async (
    latitude?: number,
    longitude?: number
  ): Promise<TrendingPostsResponse> => {
    try {
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      const response = await api.get<TrendingPostsResponse>("/posts/trending", {
        params: {
          token,
          userUUID,
          latitude: latitude?.toString() || "0",
          longitude: longitude?.toString() || "0",
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get popular tags
  getPopularTags: async (): Promise<PopularTagsResponse> => {
    try {
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      const response = await api.get<PopularTagsResponse>("/tags/popular", {
        params: {
          token,
          userUUID,
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get posts by hashtag name
  getPostsByHashtag: async (
    hashtagName: string,
    latitude?: number,
    longitude?: number
  ): Promise<TagPostsResponse> => {
    try {
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      const response = await api.get<TagPostsResponse>(
        `/tags/posts/${hashtagName}`,
        {
          params: {
            token,
            userUUID,
            latitude: latitude?.toString() || "0",
            longitude: longitude?.toString() || "0",
          },
        }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user notifications
  getNotifications: async (): Promise<NotificationsResponse> => {
    try {
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      const response = await api.get<NotificationsResponse>("/notifications", {
        params: {
          token,
          userUUID,
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId: string) => {
    try {
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      const response = await api.post(`/notifications/read/${notificationId}`, {
        token,
        userUUID,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: async () => {
    try {
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      const response = await api.post("/notifications/allread", {
        token,
        userUUID,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Report a post
  reportPost: async (postId: string, reason: string) => {
    try {
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      const response = await api.post(`/posts/report/${postId}`, {
        reason,
        type: "post",
        token,
        userUUID,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Hide a post
  hidePost: async (postId: string) => {
    try {
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      const response = await api.post(`/posts/hide/${postId}`, {
        token,
        userUUID,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Mark posts as seen
  markPostsAsSeen: async (postIds: string[]) => {
    try {
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      // Convert array of post IDs to comma-separated string
      const postsString = postIds.join(",");

      const response = await api.post("/posts/mark_as_seen", {
        posts: postsString,
        token,
        userUUID,
      });

      return response.data;
    } catch (error) {
      // Don't throw error for mark as seen - it's a background operation
      // Just log it silently and continue
      console.log("Failed to mark posts as seen:", error);
    }
  },
};
