import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import * as Location from "expo-location";
import { profileService } from "../services/profileService";
import { postService, TrendingPost, PopularTag } from "../services/postService";
import { getCityFromCoordinates } from "../utils/locationUtils";

// Define types for preloaded data
interface ProfileData {
  user_id?: string;
  username?: string;
  email?: string;
  full_name?: string;
  bio?: string;
  gender?: string;
  statistics?: {
    comments?: number;
    votes?: number;
    posts?: number;
  };
  two_factor_setup?: number;
  profile_image?: string;
  is_verified?: string;
  is_active?: number;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
  location?: string;
}

interface UserSettings {
  push_notifications?: boolean;
  email_notifications?: boolean;
  profile_visibility?: boolean;
  search_visibility?: boolean;
  dark_mode?: boolean;
}

interface SavedPost {
  id: string;
  title: string;
  content: string;
  // Add other post properties as needed
}

// Formatted trending post for DataContext
interface FormattedTrendingPost {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  distance: string;
  score: number;
  latitude?: number;
  longitude?: number;
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

interface DataContextType {
  // Data
  profileData: ProfileData | null;
  userSettings: UserSettings | null;
  savedPosts: SavedPost[];
  savedPostsCount: number;
  trendingPosts: FormattedTrendingPost[];
  popularTags: PopularTag[];

  // Loading states
  isLoadingProfile: boolean;
  isLoadingSettings: boolean;
  isLoadingSavedPosts: boolean;
  isLoadingTrendingPosts: boolean;
  isLoadingPopularTags: boolean;

  // Actions
  loadAllData: () => Promise<void>;
  refreshProfileData: () => Promise<void>;
  refreshUserSettings: () => Promise<void>;
  refreshSavedPosts: () => Promise<void>;
  refreshTrendingPosts: () => Promise<void>;
  refreshPopularTags: () => Promise<void>;
  updateLocalSetting: (setting: string, value: boolean) => void;
  clearAllData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Data states
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [savedPostsCount, setSavedPostsCount] = useState(0);
  const [trendingPosts, setTrendingPosts] = useState<FormattedTrendingPost[]>(
    []
  );
  const [popularTags, setPopularTags] = useState<PopularTag[]>([]);

  // Loading states
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isLoadingSavedPosts, setIsLoadingSavedPosts] = useState(false);
  const [isLoadingTrendingPosts, setIsLoadingTrendingPosts] = useState(false);
  const [isLoadingPopularTags, setIsLoadingPopularTags] = useState(false);

  // Load profile data
  const refreshProfileData = useCallback(async () => {
    try {
      setIsLoadingProfile(true);
      const response = await profileService.getCurrentProfile();
      const data = response.data || response;
      setProfileData(data);
    } catch (error) {
      setProfileData(null);
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  // Load user settings
  const refreshUserSettings = useCallback(async () => {
    try {
      setIsLoadingSettings(true);
      const response = await profileService.getUserSettings();
      const settingsArray = response.data || response;

      if (settingsArray && Array.isArray(settingsArray)) {
        // Convert array of settings to object
        const settingsMap: Record<string, any> = {};
        settingsArray.forEach((item: any) => {
          if (item.setting && item.value !== undefined) {
            settingsMap[item.setting] = item.value;
          }
        });

        // Convert to boolean values
        const settings: UserSettings = {
          push_notifications:
            settingsMap.push_notifications === 1 ||
            settingsMap.push_notifications === "1",
          email_notifications:
            settingsMap.email_notifications === 1 ||
            settingsMap.email_notifications === "1",
          profile_visibility:
            settingsMap.profile_visibility === 1 ||
            settingsMap.profile_visibility === "1",
          search_visibility:
            settingsMap.search_visibility === 1 ||
            settingsMap.search_visibility === "1",
          dark_mode:
            settingsMap.dark_mode === 1 || settingsMap.dark_mode === "1",
        };

        setUserSettings(settings);
      }
    } catch (error) {
      setUserSettings(null);
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  // Load saved posts
  const refreshSavedPosts = useCallback(async () => {
    try {
      setIsLoadingSavedPosts(true);
      const response = await postService.getSavedPosts();

      if (response.status === "success" && response.data) {
        setSavedPosts(response.data);
        setSavedPostsCount(response.data.length);
      } else {
        setSavedPosts([]);
        setSavedPostsCount(0);
      }
    } catch (error) {
      setSavedPosts([]);
      setSavedPostsCount(0);
    } finally {
      setIsLoadingSavedPosts(false);
    }
  }, []);

  // Load trending posts
  const refreshTrendingPosts = useCallback(async () => {
    try {
      setIsLoadingTrendingPosts(true);
      
      // Get current location
      let latitude = 0;
      let longitude = 0;

      try {
        // Try to get location permission
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status === "granted") {
          // Get current position
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
        }
      } catch (error) {
        // Continue with default coordinates if location fails
      }

      const response = await postService.getTrendingPosts(latitude, longitude);

      if (response.status === "success" && response.data) {
        // Format posts for display
        const formattedPosts: FormattedTrendingPost[] = await Promise.all(
          response.data.map(async (apiPost) => {
            // Use city from API, but if it's "Unknown" and we have coordinates, use reverse geocoding
            let displayLocation = apiPost.city || "Unknown";

            if (
              displayLocation === "Unknown" &&
              apiPost.latitude &&
              apiPost.longitude
            ) {
              try {
                const reverseGeocodedCity = await getCityFromCoordinates(
                  parseFloat(apiPost.latitude),
                  parseFloat(apiPost.longitude)
                );
                displayLocation = reverseGeocodedCity;
              } catch (error) {
                // Keep "Unknown" if reverse geocoding fails
              }
            }

            return {
              id: apiPost.post_id,
              text: apiPost.content,
              username: apiPost.username,
              timestamp: apiPost.ago,
              upvotes: parseInt(apiPost.upvotes.toString()) || 0,
              downvotes: parseInt(apiPost.downvotes.toString()) || 0,
              commentCount: parseInt(apiPost.comments_count.toString()) || 0,
              distance: displayLocation,
              score: apiPost.score || 0,
              latitude: apiPost.latitude
                ? parseFloat(apiPost.latitude)
                : undefined,
              longitude: apiPost.longitude
                ? parseFloat(apiPost.longitude)
                : undefined,
              profile_image: apiPost.profile_image
                ? `https://talklowkey.com/${apiPost.profile_image}`
                : undefined,
              has_media: apiPost.has_media || false,
              post_media: apiPost.post_media,
              media_types: apiPost.media_types || [],
              manage: apiPost.manage || {
                delete: false,
                report: true,
                save: true,
                bookmarked: false,
                voted: false,
              },
            };
          })
        );

        setTrendingPosts(formattedPosts);
      } else {
        setTrendingPosts([]);
      }
    } catch (error) {
      setTrendingPosts([]);
    } finally {
      setIsLoadingTrendingPosts(false);
    }
  }, []);

  // Load popular tags
  const refreshPopularTags = useCallback(async () => {
    try {
      setIsLoadingPopularTags(true);
      const response = await postService.getPopularTags();

      if (response.status === "success" && response.data) {
        setPopularTags(response.data);
      } else {
        setPopularTags([]);
      }
    } catch (error) {
      setPopularTags([]);
    } finally {
      setIsLoadingPopularTags(false);
    }
  }, []);

  // Load all data at once - now only essential data for performance
  const loadAllData = useCallback(async () => {
    // Only load profile and settings data on login for better performance
    // Other data will be loaded on-demand when their respective pages are accessed
    await Promise.allSettled([
      refreshProfileData(),
      refreshUserSettings(),
      // Removed: refreshSavedPosts(), refreshTrendingPosts(), refreshPopularTags()
      // These will be loaded when user navigates to respective pages
    ]);
  }, [
    refreshProfileData,
    refreshUserSettings,
    // Removed dependencies: refreshSavedPosts, refreshTrendingPosts, refreshPopularTags
  ]);

  // Update local setting without API call (for immediate UI updates)
  const updateLocalSetting = useCallback((setting: string, value: boolean) => {
    setUserSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  }, []);

  // Clear all data (on logout)
  const clearAllData = useCallback(() => {
    setProfileData(null);
    setUserSettings(null);
    setSavedPosts([]);
    setSavedPostsCount(0);
    setTrendingPosts([]);
    setPopularTags([]);
  }, []);

  const value: DataContextType = {
    // Data
    profileData,
    userSettings,
    savedPosts,
    savedPostsCount,
    trendingPosts,
    popularTags,

    // Loading states
    isLoadingProfile,
    isLoadingSettings,
    isLoadingSavedPosts,
    isLoadingTrendingPosts,
    isLoadingPopularTags,

    // Actions
    loadAllData,
    refreshProfileData,
    refreshUserSettings,
    refreshSavedPosts,
    refreshTrendingPosts,
    refreshPopularTags,
    updateLocalSetting,
    clearAllData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// Custom hook to use the data context
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
