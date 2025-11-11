import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from "@react-navigation/native";
import PostMenu from "../../components/posts/PostMenu";
import { Post } from "./PostDetailScreen";
import * as Location from "expo-location";
import { postService, NotificationData } from "../../services/postService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCityFromCoordinates } from "../../utils/locationUtils";
import SwipableImageGallery from "../../components/ui/SwipableImageGallery";
import PostContent from "../../components/ui/PostContent";
import { cacheUtils, CachedPostsData } from "../../utils/cacheUtils";

type HomeStackParamList = {
  HomeScreen: {
    hashtag?: string;
    hashtagCount?: number;
  };
};

type HomeScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  "HomeScreen"
>;

type HomeScreenProps = {
  navigation: HomeScreenNavigationProp;
};

// Enum for vote types
enum VoteType {
  NONE = "none",
  UPVOTE = "upvote",
  DOWNVOTE = "downvote",
}

// Define notification type
type Notification = {
  id: string;
  type: "like" | "comment" | "mention" | "system";
  message: string;
  timestamp: string;
  isRead: boolean;
  relatedPostId?: string;
  relatedUsername?: string;
};

// Helper function to extract username from notification content
const extractUsernameFromContent = (content: string): string | undefined => {
  const match = content.match(/@(\w+)/);
  return match ? match[1] : undefined;
};

// Helper function to convert API notification to display format
const formatNotification = (
  apiNotification: NotificationData
): Notification => {
  // Map notification types
  let displayType: "like" | "comment" | "mention" | "system";
  switch (apiNotification.type) {
    case "vote":
      displayType = "like";
      break;
    case "comment":
      displayType = "comment";
      break;
    case "mention":
      displayType = "mention";
      break;
    default:
      displayType = "system";
  }

  return {
    id: apiNotification.notification_id,
    type: displayType,
    message: apiNotification.content,
    timestamp: apiNotification.time_ago, // Use the provided time_ago from API
    isRead: apiNotification.is_read === "1", // Convert string to boolean
    relatedPostId: apiNotification.reference_id,
    relatedUsername: extractUsernameFromContent(apiNotification.content),
  };
};

const PostCard = ({
  post,
  onMenuPress,
  onVote,
  onSavePost,
}: {
  post: Post;
  onMenuPress: (post: Post, event?: any) => void;
  onVote: (postId: string, voteType: VoteType, currentVote: VoteType) => void;
  onSavePost: (postId: string, isSaved: boolean) => void;
}) => {
  const { theme, isDarkMode } = useTheme();
  // Initialize vote state from manage.voted field
  const getVoteTypeFromManage = (voted: any): VoteType => {
    if (voted === "up") return VoteType.UPVOTE;
    if (voted === "down") return VoteType.DOWNVOTE;
    return VoteType.NONE;
  };

  const [userVote, setUserVote] = useState<VoteType>(
    getVoteTypeFromManage(post.manage?.voted)
  );
  const [upvotes, setUpvotes] = useState<number>(post.upvotes);
  const [downvotes, setDownvotes] = useState<number>(post.downvotes);
  const [isSaved, setIsSaved] = useState<boolean>(
    post.manage?.bookmarked || false
  );
  const navigation = useNavigation();

  // Update vote and saved state when post data changes
  useEffect(() => {
    setUserVote(getVoteTypeFromManage(post.manage?.voted));
  }, [post.manage?.voted]);

  useEffect(() => {
    setIsSaved(post.manage?.bookmarked || false);
  }, [post.manage?.bookmarked]);

  // Animation values
  const upvoteScale = useRef(new Animated.Value(1)).current;
  const downvoteScale = useRef(new Animated.Value(1)).current;
  const saveScale = useRef(new Animated.Value(1)).current;

  const handleViewPost = () => {
    // Update the post with current vote counts before navigating
    const updatedPost = {
      ...post,
      upvotes: upvotes,
      downvotes: downvotes,
    };

    // Use any to bypass TypeScript checking for the navigation
    (navigation as any).navigate("PostDetail", { post: updatedPost });
  };

  // Animation function for button press
  const animatePress = (animatedValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(animatedValue, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleUpvote = () => {
    // Play animation
    animatePress(upvoteScale);

    let newVote = VoteType.UPVOTE;

    // If already upvoted, remove the upvote
    if (userVote === VoteType.UPVOTE) {
      setUpvotes(upvotes - 1);
      newVote = VoteType.NONE;
    }
    // If downvoted, remove downvote and add upvote
    else if (userVote === VoteType.DOWNVOTE) {
      setUpvotes(upvotes + 1);
      setDownvotes(downvotes - 1);
    }
    // If no vote, add upvote
    else {
      setUpvotes(upvotes + 1);
    }

    setUserVote(newVote);
    onVote(post.id, newVote, userVote);
  };

  const handleDownvote = () => {
    // Play animation
    animatePress(downvoteScale);

    let newVote = VoteType.DOWNVOTE;

    // If already downvoted, remove the downvote
    if (userVote === VoteType.DOWNVOTE) {
      setDownvotes(downvotes - 1);
      newVote = VoteType.NONE;
    }
    // If upvoted, remove upvote and add downvote
    else if (userVote === VoteType.UPVOTE) {
      setDownvotes(downvotes + 1);
      setUpvotes(upvotes - 1);
    }
    // If no vote, add downvote
    else {
      setDownvotes(downvotes + 1);
    }

    setUserVote(newVote);
    onVote(post.id, newVote, userVote);
  };

  const handleSavePost = () => {
    // Play animation
    animatePress(saveScale);

    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    onSavePost(post.id, newSavedState);
  };

  return (
    <View
      style={[
        styles.postCard,
        { backgroundColor: theme.card },
        // Add shadow and border for light mode
        !isDarkMode && {
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
          elevation: 5,
          borderWidth: 1,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          {post.profile_image ? (
            <Image
              source={{ uri: post.profile_image }}
              style={styles.userIcon}
            />
          ) : (
            <View style={[styles.userIcon, { backgroundColor: theme.primary }]}>
              <Text style={styles.userIconText}>
                {post.username[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={[styles.username, { color: theme.text }]}>
              {post.username}
            </Text>
            <View style={styles.timeLocationRow}>
              <Text style={[styles.timestamp, { color: theme.textMuted }]}>
                {post.timestamp}
              </Text>
              <Text style={[styles.dot, { color: theme.textMuted }]}>•</Text>
              <Text style={[styles.distance, { color: theme.textMuted }]}>
                {post.distance}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={(event) => onMenuPress(post, event)}>
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={theme.textMuted}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleViewPost}>
        <PostContent
          htmlContent={post.text}
          theme={theme}
          style={[styles.postText, { color: theme.text }]}
          onHashtagPress={(hashtag) => {
            // Navigate to explore page when hashtag is clicked
            (navigation as any).navigate("Explore");
          }}
        />

        {/* Display post media using SwipableImageGallery */}
        {post.has_media &&
          post.post_media?.images?.files &&
          post.post_media.images.files.length > 0 && (
            <SwipableImageGallery
              images={post.post_media.images.files.map((file, index) => {
                const thumbnailUrl =
                  post.post_media!.images!.thumbnails?.[index]?.[0] || file;
                return `https://talklowkey.com/assets/uploads/${thumbnailUrl}`;
              })}
              fullSizeImages={post.post_media.images.files.map(
                (file) => `https://talklowkey.com/assets/uploads/${file}`
              )}
              imageHeight={200}
              showCounter={true}
            />
          )}
      </TouchableOpacity>

      <View style={styles.postActions}>
        <View
          style={[
            styles.voteContainer,
            { backgroundColor: `${theme.textMuted}10` },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: upvoteScale }] }}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleUpvote}
            >
              <Ionicons
                name={
                  userVote === VoteType.UPVOTE ? "arrow-up" : "arrow-up-outline"
                }
                size={20}
                color={
                  userVote === VoteType.UPVOTE ? theme.primary : theme.textMuted
                }
              />
            </TouchableOpacity>
          </Animated.View>

          <Text style={[styles.voteCount, { color: theme.text }]}>
            {upvotes}
          </Text>

          <Animated.View style={{ transform: [{ scale: downvoteScale }] }}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDownvote}
            >
              <Ionicons
                name={
                  userVote === VoteType.DOWNVOTE
                    ? "arrow-down"
                    : "arrow-down-outline"
                }
                size={20}
                color={
                  userVote === VoteType.DOWNVOTE ? theme.error : theme.textMuted
                }
              />
            </TouchableOpacity>
          </Animated.View>

          <Text style={[styles.voteCount, { color: theme.text }]}>
            {downvotes}
          </Text>
        </View>

        <View style={styles.actionGroup}>
          <TouchableOpacity
            style={styles.commentButton}
            onPress={handleViewPost}
          >
            <Ionicons
              name="chatbubble-outline"
              size={18}
              color={theme.textMuted}
            />
            <Text style={[styles.commentCount, { color: theme.textMuted }]}>
              {post.commentCount}
            </Text>
          </TouchableOpacity>

          <Animated.View style={{ transform: [{ scale: saveScale }] }}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSavePost}
            >
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={18}
                color={isSaved ? theme.primary : theme.textMuted}
              />
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity style={styles.shareButton}>
            <Ionicons
              name="share-social-outline"
              size={18}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const route = useRoute();
  const routeParams = route.params as
    | { hashtag?: string; hashtagCount?: number }
    | undefined;

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState<
    { x: number; y: number } | undefined
  >();
  const [posts, setPosts] = useState<Post[]>([]); // No mock data, start with empty array
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [hasNotifications, setHasNotifications] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [notificationsModalVisible, setNotificationsModalVisible] =
    useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [allPosts, setAllPosts] = useState<Post[]>([]); // Store all fetched posts
  const [isLoadingAllPosts, setIsLoadingAllPosts] = useState(false);

  // Hashtag filtering state
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);
  const [hashtagPostCount, setHashtagPostCount] = useState<number>(0);
  const [isLoadingHashtagPosts, setIsLoadingHashtagPosts] = useState(false);

  // Current location state from API response
  const [currentLocation, setCurrentLocation] = useState<string>("Loading...");

  // Controlled fetching state
  const [cachedData, setCachedData] = useState<CachedPostsData | null>(null);
  const [lastBackgroundFetch, setLastBackgroundFetch] = useState<number>(0);
  const [backgroundFetchData, setBackgroundFetchData] = useState<Post[] | null>(
    null
  );
  const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);
  const [isBackgroundFetching, setIsBackgroundFetching] = useState(false);

  // Timer ref for background fetch
  const backgroundFetchTimer = useRef<NodeJS.Timeout | null>(null);

  // FlatList ref for scrolling to top
  const flatListRef = useRef<FlatList>(null);

  // Debug: Log activeHashtag state changes
  useEffect(() => {}, [activeHashtag]);

  // Debug: Log filteredPosts state changes and mark posts as seen
  useEffect(() => {
    if (filteredPosts.length > 0) {
      // Mark posts as seen in the background after they are rendered
      const markPostsAsSeen = async () => {
        try {
          const postIds = filteredPosts.map((post) => post.id);
          await postService.markPostsAsSeen(postIds);
        } catch (error) {
          // Silently handle errors for background operation
        }
      };

      // Call after a short delay to ensure posts are rendered
      setTimeout(markPostsAsSeen, 1000);
    }
  }, [filteredPosts]);

  // Debug: Log loading states
  useEffect(() => {}, [isLoadingAllPosts]);

  useEffect(() => {}, [isLoadingHashtagPosts]);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const response = await postService.getNotifications();

      if (response.status === "success" && response.data) {
        const formattedNotifications = response.data.map(formatNotification);
        setNotifications(formattedNotifications);

        // Check if there are unread notifications
        const hasUnread = formattedNotifications.some(
          (notification) => !notification.isRead
        );
        setHasNotifications(hasUnread);
      } else {
        setNotifications([]);
        setHasNotifications(false);
      }
    } catch (error) {
      setNotifications([]);
      setHasNotifications(false);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Fetch posts by hashtag
  const fetchPostsByHashtag = async (hashtagName: string) => {
    setIsLoadingHashtagPosts(true);
    try {
      // Get current location
      let latitude = 0;
      let longitude = 0;

      try {
        // Try to get location permission
        let { status } = await Location.requestForegroundPermissionsAsync();

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

      const response = await postService.getPostsByHashtag(
        hashtagName,
        latitude,
        longitude
      );

      if (
        response.status === "success" &&
        response.data &&
        response.data.length > 0
      ) {
        // Convert API posts to the format our app expects
        const formattedPosts: Post[] = await Promise.all(
          response.data.map(async (apiPost: any) => {
            // Use city from API, but if it's "Unknown" and we have coordinates, use reverse geocoding
            let displayLocation = apiPost.city || "Unknown";

            if (
              displayLocation === "Unknown" &&
              apiPost.latitude &&
              apiPost.longitude
            ) {
              try {
                const reverseGeocodedCity = await getCityFromCoordinates(
                  apiPost.latitude,
                  apiPost.longitude
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
              upvotes: parseInt(apiPost.upvotes) || 0,
              downvotes: parseInt(apiPost.downvotes) || 0,
              commentCount: parseInt(apiPost.comments_count) || 0,
              distance: displayLocation,
              latitude: apiPost.latitude
                ? parseFloat(apiPost.latitude)
                : undefined,
              longitude: apiPost.longitude
                ? parseFloat(apiPost.longitude)
                : undefined,
              isUserPost: apiPost.manage?.delete === true,
              // Add profile image if available
              profile_image: apiPost.profile_image
                ? `https://talklowkey.com/${apiPost.profile_image}`
                : null,
              // Add post media if available
              has_media: apiPost.has_media || false,
              post_media: apiPost.post_media,
              media_types: apiPost.media_types || [],
              // Add manage field for delete/save/vote functionality
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

        setAllPosts(formattedPosts);
        setPosts(formattedPosts);
        setFilteredPosts(formattedPosts);

        return true;
      } else {
        // If no posts, set empty arrays
        setAllPosts([]);
        setPosts([]);
        setFilteredPosts([]);
        return false;
      }
    } catch (error) {
      setAllPosts([]);
      setPosts([]);
      setFilteredPosts([]);
      return false;
    } finally {
      setIsLoadingHashtagPosts(false);
    }
  };

  // Fetch all posts from API with maximum radius (only when necessary)
  const fetchAllPosts = async (forceRefresh = false) => {
    if (activeHashtag && !forceRefresh) {
      return false;
    }

    // If not forcing refresh, try to load from cache first
    if (!forceRefresh) {
      const cacheLoaded = await loadCachedPosts();
      if (cacheLoaded) {
        // Start the background fetch timer
        startBackgroundFetchTimer();
        return true;
      }
    }

    // Set loading state only if we don't have posts yet (initial load) or if it's a forced refresh
    if (allPosts.length === 0 || forceRefresh) {
      setIsLoadingAllPosts(true);
    }

    try {
      // Try to get location permission
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        // If permission granted, get current position with high accuracy
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
          mayShowUserSettingsDialog: true,
          // Wait up to 10 seconds for a more accurate position
          timeInterval: 10000,
        });

        const { latitude, longitude } = location.coords;

        // Token and user UUID are now fetched automatically from storage
        const response = await postService.getNearbyPosts(
          latitude.toString(),
          longitude.toString(),
          1,
          100,
          100
        );

        // Extract location data from API response
        if (response.location) {
          const locationString = `${response.location.city}, ${response.location.country}`;
          setCurrentLocation(locationString);
        }

        if (
          response.status === "success" &&
          response.data &&
          response.data.length > 0
        ) {
          // Convert API posts to the format our app expects
          const formattedPosts: Post[] = await Promise.all(
            response.data.map(async (apiPost: any) => {
              // Use city from API, but if it's "Unknown" and we have coordinates, use reverse geocoding
              let displayLocation = apiPost.city || "Unknown";

              if (
                displayLocation === "Unknown" &&
                apiPost.latitude &&
                apiPost.longitude
              ) {
                try {
                  const reverseGeocodedCity = await getCityFromCoordinates(
                    apiPost.latitude,
                    apiPost.longitude
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
                upvotes: parseInt(apiPost.upvotes) || 0,
                downvotes: parseInt(apiPost.downvotes) || 0,
                commentCount: parseInt(apiPost.comments_count) || 0,
                distance: displayLocation,
                latitude: apiPost.latitude
                  ? parseFloat(apiPost.latitude)
                  : undefined,
                longitude: apiPost.longitude
                  ? parseFloat(apiPost.longitude)
                  : undefined,
                isUserPost: apiPost.manage?.delete === true,
                // Add profile image if available
                profile_image: apiPost.profile_image
                  ? `https://talklowkey.com/${apiPost.profile_image}`
                  : null,
                // Add post media if available
                has_media: apiPost.has_media || false,
                post_media: apiPost.post_media,
                media_types: apiPost.media_types || [],
                // Add manage field for delete/save/vote functionality
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

          setAllPosts(formattedPosts);
          setPosts(formattedPosts);

          // Show all posts without filtering since we're not using location dropdown anymore
          setFilteredPosts(formattedPosts);

          // Save to cache for future loads
          const locationString = response.location
            ? `${response.location.city}, ${response.location.country}`
            : currentLocation;
          await cacheUtils.savePosts(formattedPosts, locationString);

          // Update cached data state
          setCachedData({
            posts: formattedPosts,
            location: locationString,
            timestamp: Date.now(),
            lastPostId:
              formattedPosts.length > 0 ? formattedPosts[0].id : undefined,
          });

          // Start background fetch timer
          startBackgroundFetchTimer();

          return true;
        } else {
          // If no posts, set empty arrays
          setAllPosts([]);
          setPosts([]);
          setFilteredPosts([]);
          return false;
        }
      } else {
        // If location permission not granted, use default coordinates (0, 0)
        const response = await postService.getNearbyPosts(
          "0", // Default latitude
          "0", // Default longitude
          1,
          100,
          100
        );

        // Extract location data from API response
        if (response.location) {
          const locationString = `${response.location.city}, ${response.location.country}`;
          setCurrentLocation(locationString);
        } else {
          setCurrentLocation("Location unavailable");
        }

        if (
          response.status === "success" &&
          response.data &&
          response.data.length > 0
        ) {
          // Convert API posts to the format our app expects
          const formattedPosts: Post[] = await Promise.all(
            response.data.map(async (apiPost: any) => {
              // Use city from API, but if it's "Unknown" and we have coordinates, use reverse geocoding
              let displayLocation = apiPost.city || "Unknown";

              if (
                displayLocation === "Unknown" &&
                apiPost.latitude &&
                apiPost.longitude
              ) {
                try {
                  const reverseGeocodedCity = await getCityFromCoordinates(
                    apiPost.latitude,
                    apiPost.longitude
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
                upvotes: parseInt(apiPost.upvotes) || 0,
                downvotes: parseInt(apiPost.downvotes) || 0,
                commentCount: parseInt(apiPost.comments_count) || 0,
                distance: displayLocation,
                latitude: apiPost.latitude
                  ? parseFloat(apiPost.latitude)
                  : undefined,
                longitude: apiPost.longitude
                  ? parseFloat(apiPost.longitude)
                  : undefined,
                isUserPost: apiPost.manage?.delete === true,
                // Add profile image if available
                profile_image: apiPost.profile_image
                  ? `https://talklowkey.com/${apiPost.profile_image}`
                  : null,
                // Add post media if available
                has_media: apiPost.has_media || false,
                post_media: apiPost.post_media,
                media_types: apiPost.media_types || [],
                // Add manage field for delete/save/vote functionality
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

          setAllPosts(formattedPosts);
          setPosts(formattedPosts);
          setFilteredPosts(formattedPosts);

          // Save to cache for future loads
          const locationString = response.location
            ? `${response.location.city}, ${response.location.country}`
            : currentLocation;
          await cacheUtils.savePosts(formattedPosts, locationString);

          // Update cached data state
          setCachedData({
            posts: formattedPosts,
            location: locationString,
            timestamp: Date.now(),
            lastPostId:
              formattedPosts.length > 0 ? formattedPosts[0].id : undefined,
          });

          // Start background fetch timer
          startBackgroundFetchTimer();

          return true;
        } else {
          // If no posts, set empty arrays
          setAllPosts([]);
          setPosts([]);
          setFilteredPosts([]);
          return false;
        }
      }
    } catch (error) {
      setAllPosts([]);
      setPosts([]);
      setFilteredPosts([]);
      setCurrentLocation("Location unavailable");
      return false;
    } finally {
      setIsLoadingAllPosts(false);
    }
  };

  // Initialize on component mount - fetch posts based on hashtag or location
  useEffect(() => {
    // Fetch notifications on component mount
    fetchNotifications();

    // Check if there's a hashtag parameter
    if (routeParams?.hashtag) {
      setPosts([]);
      setFilteredPosts([]);
      setAllPosts([]);

      setActiveHashtag(routeParams.hashtag);
      setHashtagPostCount(routeParams.hashtagCount || 0);
      fetchPostsByHashtag(routeParams.hashtag);
    } else {
      // Clear hashtag state and fetch normal posts
      setActiveHashtag(null);
      setHashtagPostCount(0);
      fetchAllPosts();
    }

    // Cleanup any orphaned temporary posts on app start
    const cleanupTempData = async () => {
      try {
        const tempPost = await AsyncStorage.getItem("tempNewPost");
        if (tempPost) {
          await AsyncStorage.removeItem("tempNewPost");
        }
      } catch (error) {}
    };

    cleanupTempData();
  }, [routeParams?.hashtag]);

  // Refresh posts when screen comes into focus and close location menu when navigating
  useFocusEffect(
    React.useCallback(() => {
      // This runs when the screen is focused
      const handleFocus = async () => {
        // Check for new post from CreatePostScreen
        try {
          const tempNewPost = await AsyncStorage.getItem("tempNewPost");
          if (tempNewPost) {
            const newPost = JSON.parse(tempNewPost);

            // Add the new post to the beginning of the list immediately
            const updatedPosts = [newPost, ...allPosts];
            setAllPosts(updatedPosts);
            setPosts(updatedPosts);
            setFilteredPosts(updatedPosts);

            // Add to cache
            await cacheUtils.addPostToCache(newPost);

            // Update cached data state
            if (cachedData) {
              setCachedData({
                ...cachedData,
                posts: updatedPosts,
                timestamp: Date.now(),
                lastPostId: newPost.id,
              });
            }

            // Hide any existing new posts banner
            setShowNewPostsBanner(false);
            setBackgroundFetchData(null);

            // Clear the temporary storage
            await AsyncStorage.removeItem("tempNewPost");

            // Still refresh in the background to sync with server
            setTimeout(() => {
              if (activeHashtag) {
                fetchPostsByHashtag(activeHashtag);
              } else {
                fetchAllPosts();
              }
            }, 100);
          } else {
            // Normal refresh when no new post - but only if we're not in the middle of a hashtag navigation
            // Skip the refresh if we just received hashtag params to avoid race condition
            const shouldSkipRefresh =
              routeParams?.hashtag && activeHashtag !== routeParams.hashtag;

            if (!shouldSkipRefresh) {
              if (activeHashtag) {
                fetchPostsByHashtag(activeHashtag);
              } else {
                // Only fetch if we don't have cached data, otherwise just start the timer
                const cached = await cacheUtils.getCachedPosts();
                if (!cached) {
                  fetchAllPosts();
                } else {
                  // Load from cache and start background timer
                  await loadCachedPosts();
                  startBackgroundFetchTimer();
                }
              }
            }
          }
        } catch (error) {
          if (activeHashtag) {
            fetchPostsByHashtag(activeHashtag);
          } else {
            fetchAllPosts();
          }
        }
      };

      handleFocus();

      const unsubscribe = navigation.addListener("beforeRemove", () => {
        // No cleanup needed for location menu since it's removed
      });

      return () => {
        // This runs when the screen is unfocused
        unsubscribe();
      };
    }, [navigation, activeHashtag, routeParams?.hashtag])
  );

  const handleMenuPress = (post: Post, event?: any) => {
    setSelectedPost(post);
    setMenuVisible(true);

    // Try to get the position from the event for better menu placement
    if (event?.nativeEvent) {
      setMenuPosition({
        x: event.nativeEvent.pageX || event.nativeEvent.locationX || 0,
        y: event.nativeEvent.pageY || event.nativeEvent.locationY || 0,
      });
    }
  };

  const handleViewPost = () => {
    if (selectedPost) {
      navigation.navigate("PostDetail" as any, { post: selectedPost });
    }
    setMenuVisible(false);
  };

  const handleSavePost = async () => {
    if (selectedPost) {
      const postId = selectedPost.id;
      const isAlreadySaved = savedPosts.includes(postId);

      try {
        if (isAlreadySaved) {
          // Remove from saved posts
          await postService.unsavePost(postId);
          setSavedPosts(savedPosts.filter((id) => id !== postId));
        } else {
          // Add to saved posts
          await postService.savePost(postId);
          setSavedPosts([...savedPosts, postId]);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to save post. Please try again.");
      }
    }
    setMenuVisible(false);
  };

  const handleSavePostFromCard = async (postId: string, isSaved: boolean) => {
    try {
      if (isSaved) {
        // Add to saved posts
        await postService.savePost(postId);
        setSavedPosts([...savedPosts, postId]);
      } else {
        // Remove from saved posts
        await postService.unsavePost(postId);
        setSavedPosts(savedPosts.filter((id) => id !== postId));
      }

      // Update the manage.bookmarked property in both posts arrays
      const updatePostBookmark = (post: Post): Post => {
        if (post.id === postId) {
          return {
            ...post,
            manage: {
              delete: post.manage?.delete || false,
              report: post.manage?.report || false,
              save: post.manage?.save || false,
              bookmarked: isSaved,
              voted: (post.manage?.voted as "up" | "down" | false) || false,
            },
          };
        }
        return post;
      };

      setPosts((currentPosts) => currentPosts.map(updatePostBookmark));
      setFilteredPosts((currentFilteredPosts) =>
        currentFilteredPosts.map(updatePostBookmark)
      );
      setAllPosts((currentAllPosts) => currentAllPosts.map(updatePostBookmark));
    } catch (error) {
      Alert.alert("Error", "Failed to save post. Please try again.");
    }
  };

  const handleDeletePost = async () => {
    if (selectedPost) {
      try {
        await postService.deletePost(selectedPost.id);

        // Remove the post from both states using functional update for immediate UI sync
        setPosts((currentPosts) =>
          currentPosts.filter((post) => post.id !== selectedPost.id)
        );
        setFilteredPosts((currentFilteredPosts) =>
          currentFilteredPosts.filter((post) => post.id !== selectedPost.id)
        );

        Alert.alert("Success", "Post deleted successfully!");
      } catch (error) {
        Alert.alert("Error", "Failed to delete post. Please try again.");
      }
    }
    setMenuVisible(false);
  };

  const handleReportPost = async (reason: string) => {
    if (selectedPost) {
      try {
        await postService.reportPost(selectedPost.id, reason);

        // Optionally hide the post from the user's feed after reporting
        setPosts((currentPosts) =>
          currentPosts.filter((post) => post.id !== selectedPost.id)
        );
        setFilteredPosts((currentFilteredPosts) =>
          currentFilteredPosts.filter((post) => post.id !== selectedPost.id)
        );
        setAllPosts((currentAllPosts) =>
          currentAllPosts.filter((post) => post.id !== selectedPost.id)
        );
      } catch (error) {
        Alert.alert("Error", "Failed to report post. Please try again.");
      }
    }
  };

  const handleHidePost = async () => {
    if (selectedPost) {
      try {
        await postService.hidePost(selectedPost.id);

        // Remove the post from all states
        setPosts((currentPosts) =>
          currentPosts.filter((post) => post.id !== selectedPost.id)
        );
        setFilteredPosts((currentFilteredPosts) =>
          currentFilteredPosts.filter((post) => post.id !== selectedPost.id)
        );
        setAllPosts((currentAllPosts) =>
          currentAllPosts.filter((post) => post.id !== selectedPost.id)
        );
      } catch (error) {
        Alert.alert("Error", "Failed to hide post. Please try again.");
      }
    }
  };

  const handleVote = async (
    postId: string,
    voteType: VoteType,
    previousVote: VoteType
  ) => {
    try {
      // Get current location
      let latitude = "0";
      let longitude = "0";

      try {
        // Try to get location permission
        let { status } = await Location.requestForegroundPermissionsAsync();

        if (status === "granted") {
          // Get current position
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          latitude = location.coords.latitude.toString();
          longitude = location.coords.longitude.toString();
        }
      } catch (error) {
        // Continue with default coordinates if location fails
      }

      // Convert VoteType enum to API direction
      let apiVoteType: "up" | "down" | null = null;
      if (voteType === VoteType.UPVOTE) {
        apiVoteType = "up";
      } else if (voteType === VoteType.DOWNVOTE) {
        apiVoteType = "down";
      }

      // Call the appropriate API based on whether we're removing or adding a vote
      if (voteType === VoteType.NONE) {
        // Remove vote
        const response = await postService.removeVote(postId, "posts");
      } else {
        // Add/change vote
        const response = await postService.votePost(
          postId,
          apiVoteType,
          latitude,
          longitude
        );
      }

      // Convert VoteType back to manage.voted format
      let manageVoted: "up" | "down" | false = false;
      if (voteType === VoteType.UPVOTE) {
        manageVoted = "up";
      } else if (voteType === VoteType.DOWNVOTE) {
        manageVoted = "down";
      }

      // Update the post's manage.voted field in all post arrays
      const updatePostVote = (post: Post): Post => {
        if (post.id === postId) {
          return {
            ...post,
            manage: {
              ...post.manage,
              delete: post.manage?.delete || false,
              report: post.manage?.report || true,
              save: post.manage?.save || true,
              bookmarked: post.manage?.bookmarked || false,
              voted: manageVoted as "up" | "down" | false,
            },
          };
        }
        return post;
      };

      // Update all post state arrays
      setPosts((currentPosts) => currentPosts.map(updatePostVote));
      setFilteredPosts((currentFilteredPosts) =>
        currentFilteredPosts.map(updatePostVote)
      );
      setAllPosts((currentAllPosts) => currentAllPosts.map(updatePostVote));
    } catch (error) {
      // You might want to show an error message to the user
    }
  };

  const handleNotificationsPress = () => {
    setNotificationsModalVisible(true);
  };

  const handleCloseNotifications = () => {
    setNotificationsModalVisible(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await postService.markAllNotificationsAsRead();

      // Update local state
      const updatedNotifications = notifications.map((notification) => ({
        ...notification,
        isRead: true,
      }));
      setNotifications(updatedNotifications);
      setHasNotifications(false);
    } catch (error) {
      // Still update local state to provide immediate feedback
      const updatedNotifications = notifications.map((notification) => ({
        ...notification,
        isRead: true,
      }));
      setNotifications(updatedNotifications);
      setHasNotifications(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Mark notification as read in API if it's not already read
      if (!notification.isRead) {
        await postService.markNotificationAsRead(notification.id);
      }

      // Update local state
      const updatedNotifications = notifications.map((n) =>
        n.id === notification.id ? { ...n, isRead: true } : n
      );
      setNotifications(updatedNotifications);

      // Check if there are any unread notifications left
      const hasUnread = updatedNotifications.some((n) => !n.isRead);
      setHasNotifications(hasUnread);
    } catch (error) {
      // Still update local state for immediate feedback
      const updatedNotifications = notifications.map((n) =>
        n.id === notification.id ? { ...n, isRead: true } : n
      );
      setNotifications(updatedNotifications);

      const hasUnread = updatedNotifications.some((n) => !n.isRead);
      setHasNotifications(hasUnread);
    }

    // Close the modal
    setNotificationsModalVisible(false);

    // Navigate to related post if available
    if (notification.relatedPostId) {
      const relatedPost = posts.find(
        (post) => post.id === notification.relatedPostId
      );
      if (relatedPost) {
        navigation.navigate("PostDetail" as any, { post: relatedPost });
      }
    }
  };

  // Function to render notification icon based on type
  const renderNotificationIcon = (type: string) => {
    const iconBackgroundColor = getIconBackgroundColor(type, theme);

    switch (type) {
      case "like":
        return (
          <View
            style={[
              styles.notificationIconContainer,
              { backgroundColor: iconBackgroundColor },
            ]}
          >
            <Ionicons name="heart" size={20} color="#FFFFFF" />
          </View>
        );
      case "comment":
        return (
          <View
            style={[
              styles.notificationIconContainer,
              { backgroundColor: iconBackgroundColor },
            ]}
          >
            <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
          </View>
        );
      case "mention":
        return (
          <View
            style={[
              styles.notificationIconContainer,
              { backgroundColor: iconBackgroundColor },
            ]}
          >
            <Ionicons name="at" size={20} color="#FFFFFF" />
          </View>
        );
      case "system":
        return (
          <View
            style={[
              styles.notificationIconContainer,
              { backgroundColor: iconBackgroundColor },
            ]}
          >
            <Ionicons name="information-circle" size={20} color="#FFFFFF" />
          </View>
        );
      default:
        return (
          <View
            style={[
              styles.notificationIconContainer,
              { backgroundColor: iconBackgroundColor },
            ]}
          >
            <Ionicons name="notifications" size={20} color="#FFFFFF" />
          </View>
        );
    }
  };

  // Get background color for notification icon
  const getIconBackgroundColor = (type: string, theme: any) => {
    switch (type) {
      case "like":
        return "#FF6B6B";
      case "comment":
        return "#4361EE";
      case "mention":
        return "#4CC9F0";
      case "system":
        return "#A78BFA";
      default:
        return theme.primary;
    }
  };

  // Handle pull-to-refresh - fetch based on active filter
  const onRefresh = async () => {
    setRefreshing(true);

    // Hide new posts banner when manually refreshing
    setShowNewPostsBanner(false);
    setBackgroundFetchData(null);

    if (activeHashtag) {
      await fetchPostsByHashtag(activeHashtag);
    } else {
      await fetchAllPosts(true); // Force refresh to bypass cache
    }
    setRefreshing(false);
  };

  // Clear hashtag filter and return to location-based posts
  const clearHashtagFilter = () => {
    setActiveHashtag(null);
    setHashtagPostCount(0);
    setIsLoadingHashtagPosts(false);
    fetchAllPosts(true); // Force refresh even though activeHashtag is still set
  };

  // Load cached posts if available
  const loadCachedPosts = async () => {
    try {
      const cached = await cacheUtils.getCachedPosts();
      if (cached && cached.posts.length > 0) {
        setCachedData(cached);
        setAllPosts(cached.posts);
        setPosts(cached.posts);
        setFilteredPosts(cached.posts);
        setCurrentLocation(cached.location);
        setLastBackgroundFetch(cached.timestamp);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Start 60-second background fetch timer
  const startBackgroundFetchTimer = () => {
    if (backgroundFetchTimer.current) {
      clearInterval(backgroundFetchTimer.current);
    }

    backgroundFetchTimer.current = setInterval(() => {
      if (!activeHashtag && !isBackgroundFetching) {
        backgroundFetchPosts();
      }
    }, 60000); // 60 seconds
  };

  // Stop background fetch timer
  const stopBackgroundFetchTimer = () => {
    if (backgroundFetchTimer.current) {
      clearInterval(backgroundFetchTimer.current);
      backgroundFetchTimer.current = null;
    }
  };

  // Background fetch to check for new posts (only every 60 seconds)
  const backgroundFetchPosts = async () => {
    if (activeHashtag || isBackgroundFetching || !cachedData) return;

    setIsBackgroundFetching(true);

    try {
      // Try to get location permission
      let { status } = await Location.requestForegroundPermissionsAsync();

      let latitude = "0";
      let longitude = "0";

      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        latitude = location.coords.latitude.toString();
        longitude = location.coords.longitude.toString();
      }

      // Make API call with either real coordinates or default (0, 0)
      const response = await postService.getNearbyPosts(
        latitude,
        longitude,
        1,
        100,
        100
      );

      if (
        response.status === "success" &&
        response.data &&
        response.data.length > 0
      ) {
        // Format new posts
        const formattedPosts: Post[] = await Promise.all(
          response.data.map(async (apiPost: any) => {
            let displayLocation = apiPost.city || "Unknown";

            if (
              displayLocation === "Unknown" &&
              apiPost.latitude &&
              apiPost.longitude
            ) {
              try {
                const reverseGeocodedCity = await getCityFromCoordinates(
                  apiPost.latitude,
                  apiPost.longitude
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
              upvotes: parseInt(apiPost.upvotes) || 0,
              downvotes: parseInt(apiPost.downvotes) || 0,
              commentCount: parseInt(apiPost.comments_count) || 0,
              distance: displayLocation,
              latitude: apiPost.latitude
                ? parseFloat(apiPost.latitude)
                : undefined,
              longitude: apiPost.longitude
                ? parseFloat(apiPost.longitude)
                : undefined,
              isUserPost: apiPost.manage?.delete === true,
              profile_image: apiPost.profile_image
                ? `https://talklowkey.com/${apiPost.profile_image}`
                : null,
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

        // Check if there are newer posts that aren't in cache
        if (cacheUtils.hasNewerPosts(cachedData, formattedPosts)) {
          setBackgroundFetchData(formattedPosts);
          setShowNewPostsBanner(true);
        }

        setLastBackgroundFetch(Date.now());
      }
    } catch (error) {
      // console.error("Background fetch failed:", error);
    } finally {
      setIsBackgroundFetching(false);
    }
  };

  // Handle refresh with new posts from banner
  const handleRefreshWithNewPosts = async () => {
    if (backgroundFetchData) {
      // Update UI with new posts
      setAllPosts(backgroundFetchData);
      setPosts(backgroundFetchData);
      setFilteredPosts(backgroundFetchData);

      // Save to cache
      await cacheUtils.savePosts(backgroundFetchData, currentLocation);

      // Update cached data state
      setCachedData({
        posts: backgroundFetchData,
        location: currentLocation,
        timestamp: Date.now(),
        lastPostId:
          backgroundFetchData.length > 0
            ? backgroundFetchData[0].id
            : undefined,
      });

      // Scroll to top to show new posts
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }

      // Hide banner and clear background data
      setShowNewPostsBanner(false);
      setBackgroundFetchData(null);
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      stopBackgroundFetchTimer();
    };
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          TalkLowKey
        </Text>
        <View style={styles.headerRightContainer}>
          {activeHashtag ? (
            // Show hashtag pill when filtering by hashtag
            <TouchableOpacity
              style={styles.hashtagPill}
              onPress={clearHashtagFilter}
            >
              <Ionicons name="pricetag" size={16} color="#FFFFFF" />
              <Text style={styles.hashtagPillText}>#{activeHashtag}</Text>
              <Text style={styles.hashtagPillCount}>{hashtagPostCount}</Text>
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            // Show current location when not filtering by hashtag
            <View style={styles.locationDisplay}>
              <Ionicons
                name="location-outline"
                size={18}
                color={theme.primary}
              />
              <Text style={[styles.locationText, { color: theme.primary }]}>
                {currentLocation}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={handleNotificationsPress}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={theme.text}
            />
            {hasNotifications && (
              <View
                style={[
                  styles.notificationBadge,
                  { backgroundColor: theme.error },
                ]}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* New Posts Available Banner */}
      {showNewPostsBanner && !activeHashtag && (
        <TouchableOpacity
          style={[styles.newPostsBanner, { backgroundColor: theme.primary }]}
          onPress={handleRefreshWithNewPosts}
        >
          <View style={styles.newPostsBannerContent}>
            <Ionicons name="arrow-up-circle" size={20} color="#FFFFFF" />
            <Text style={styles.newPostsBannerText}>
              New posts available • Tap to refresh
            </Text>
          </View>
          {isBackgroundFetching && (
            <ActivityIndicator size="small" color="#FFFFFF" />
          )}
        </TouchableOpacity>
      )}

      {isLoadingHashtagPosts ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading posts for #{activeHashtag}...
          </Text>
        </View>
      ) : isLoadingAllPosts ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading nearby posts...
          </Text>
        </View>
      ) : filteredPosts.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onMenuPress={handleMenuPress}
              onVote={handleVote}
              onSavePost={handleSavePostFromCard}
            />
          )}
          contentContainerStyle={styles.postsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.emptyScrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
          <View style={styles.emptyContainer}>
            <Ionicons
              name={
                activeHashtag
                  ? "pricetag-outline"
                  : "chatbubble-ellipses-outline"
              }
              size={60}
              color={theme.textMuted}
            />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              {activeHashtag
                ? `No posts found for #${activeHashtag}`
                : "No posts found in this area"}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>
              {activeHashtag
                ? "Try searching for a different hashtag"
                : "Try expanding your search radius"}
            </Text>
          </View>
        </ScrollView>
      )}

      {selectedPost && (
        <PostMenu
          post={selectedPost}
          isVisible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onViewPost={handleViewPost}
          onSavePost={handleSavePost}
          onDeletePost={handleDeletePost}
          onReportPost={handleReportPost}
          onHidePost={handleHidePost}
          menuPosition={menuPosition}
        />
      )}

      {/* Notifications Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notificationsModalVisible}
        onRequestClose={handleCloseNotifications}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={handleCloseNotifications}
        >
          <Pressable
            style={[styles.notificationModal, { backgroundColor: theme.card }]}
            // This prevents the modal from closing when clicking inside it
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[
                styles.notificationHeader,
                { borderBottomColor: theme.border },
              ]}
            >
              <Text style={[styles.notificationTitle, { color: theme.text }]}>
                Notifications
              </Text>
              <View style={styles.notificationHeaderActions}>
                <TouchableOpacity
                  onPress={fetchNotifications}
                  style={styles.refreshButton}
                  disabled={isLoadingNotifications}
                >
                  <Ionicons
                    name="refresh"
                    size={20}
                    color={
                      isLoadingNotifications ? theme.textMuted : theme.text
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCloseNotifications}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>

            {isLoadingNotifications ? (
              <View style={styles.loadingNotifications}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textMuted }]}>
                  Loading notifications...
                </Text>
              </View>
            ) : notifications.length > 0 ? (
              <>
                <ScrollView style={styles.notificationList}>
                  {notifications.map((notification) => (
                    <TouchableOpacity
                      key={notification.id}
                      style={[
                        styles.notificationItem,
                        !notification.isRead && {
                          backgroundColor: `${theme.primary}10`,
                        },
                        { borderBottomColor: theme.border },
                      ]}
                      onPress={() => handleNotificationPress(notification)}
                    >
                      {renderNotificationIcon(notification.type)}
                      <View style={styles.notificationContent}>
                        {notification.relatedUsername && (
                          <Text
                            style={[
                              styles.notificationUsername,
                              { color: theme.text },
                            ]}
                          >
                            {notification.relatedUsername}
                          </Text>
                        )}
                        <Text
                          style={[
                            styles.notificationMessage,
                            { color: theme.text },
                          ]}
                        >
                          {notification.message}
                        </Text>
                        <Text
                          style={[
                            styles.notificationTime,
                            { color: theme.textMuted },
                          ]}
                        >
                          {notification.timestamp}
                        </Text>
                      </View>
                      {!notification.isRead && (
                        <View
                          style={[
                            styles.unreadIndicator,
                            { backgroundColor: theme.primary },
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={[
                    styles.markAllButton,
                    { borderTopColor: theme.border },
                  ]}
                  onPress={handleMarkAllAsRead}
                >
                  <Text style={[styles.markAllText, { color: theme.primary }]}>
                    Mark all as read
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyNotifications}>
                <Ionicons
                  name="notifications-off-outline"
                  size={48}
                  color={theme.textMuted}
                />
                <Text
                  style={[styles.emptyNotificationsText, { color: theme.text }]}
                >
                  No notifications yet
                </Text>
                <Text
                  style={[
                    styles.emptyNotificationsSubtext,
                    { color: theme.textMuted },
                  ]}
                >
                  When you receive notifications, they'll appear here
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2D2D2D",
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F8F9FA",
  },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(67, 97, 238, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  locationDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(67, 97, 238, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  newPostsBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 10,
    marginTop: 8,
    borderRadius: 8,
  },
  newPostsBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  newPostsBannerText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 14,
  },
  locationText: {
    color: "#4361EE",
    marginHorizontal: 4,
    fontSize: 14,
  },
  hashtagPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4361EE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 12,
  },
  hashtagPillText: {
    color: "#FFFFFF",
    marginLeft: 4,
    marginRight: 6,
    fontSize: 14,
    fontWeight: "600",
  },
  hashtagPillCount: {
    color: "#FFFFFF",
    fontSize: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
    minWidth: 20,
    textAlign: "center",
  },
  notificationButton: {
    padding: 4,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#dc3545",
  },
  postsList: {
    paddingHorizontal: 10,
    paddingTop: 0,
    paddingBottom: 10,
  },
  postCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    marginBottom: 0,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4361EE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  userIconText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  username: {
    color: "#F8F9FA",
    fontWeight: "600",
    fontSize: 14,
  },
  timeLocationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timestamp: {
    color: "#ADB5BD",
    fontSize: 12,
  },
  dot: {
    color: "#ADB5BD",
    marginHorizontal: 4,
    fontSize: 12,
  },
  distance: {
    color: "#ADB5BD",
    fontSize: 12,
  },
  postText: {
    color: "#F8F9FA",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  voteContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(173, 181, 189, 0.1)",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 12,
  },
  actionButton: {
    padding: 4,
    marginHorizontal: 1,
  },
  voteCount: {
    color: "#F8F9FA",
    fontWeight: "bold",
    marginHorizontal: 6,
    minWidth: 16,
    textAlign: "center",
  },
  commentButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  commentCount: {
    color: "#ADB5BD",
    marginLeft: 4,
    fontSize: 14,
  },
  shareButton: {
    padding: 4,
    marginLeft: 8,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  notificationModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  notificationHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  refreshButton: {
    padding: 4,
    marginRight: 12,
  },
  notificationList: {
    maxHeight: "70%",
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationUsername: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    marginTop: 4,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  markAllButton: {
    padding: 16,
    alignItems: "center",
    borderTopWidth: 1,
  },
  markAllText: {
    fontWeight: "600",
  },
  emptyNotifications: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyNotificationsText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptyNotificationsSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    maxWidth: "80%",
  },
  emptyScrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  loadingNotifications: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
});

export default HomeScreen;
