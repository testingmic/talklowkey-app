import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import * as Location from "expo-location";
import { postService } from "../../services/postService";
import CommentMenu from "../../components/posts/CommentMenu";
import SwipableImageGallery from "../../components/ui/SwipableImageGallery";
import PostContent from "../../components/ui/PostContent";

// Define the route param list
type RootStackParamList = {
  PostDetail: { post: Post };
};

// Enum for vote types
enum VoteType {
  NONE = "none",
  UPVOTE = "upvote",
  DOWNVOTE = "downvote",
}

// Types
export type Comment = {
  comment_id: number;
  post_id: string;
  user_id: string;
  content: string;
  username: string;
  upvotes: string;
  downvotes: string;
  is_hidden: string;
  city: string;
  country: string;
  views: string;
  created_at: string;
  updated_at: string;
  profile_image: string;
  manage?: {
    delete: boolean;
  };
  ago: string;
};

export type Post = {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  distance: string;
  latitude?: number;
  longitude?: number;
  isUserPost?: boolean;
  profile_image?: string | null;
  has_media?: boolean;
  post_media?: {
    images?: {
      files?: string[];
      thumbnails?: string[][];
    };
    videos?: {
      files?: string[];
      thumbnails?: string[];
    };
  };
  media_types?: string[];
  manage?: {
    delete: boolean;
    report: boolean;
    save: boolean;
    bookmarked: boolean;
    voted: "up" | "down" | false;
  };
};

type HomeStackParamList = {
  HomeScreen: undefined;
  PostDetail: { post: Post };
};

type PostDetailScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  "PostDetail"
>;

type PostDetailScreenRouteProp = RouteProp<HomeStackParamList, "PostDetail">;

type PostDetailScreenProps = {
  navigation: PostDetailScreenNavigationProp;
  route: PostDetailScreenRouteProp;
};

// Comment component
const CommentItem = ({
  comment,
  onDelete,
}: {
  comment: Comment;
  onDelete?: (commentId: number) => void;
}) => {
  const { theme, isDarkMode } = useTheme();
  const [userVote, setUserVote] = useState<VoteType>(VoteType.NONE);
  const [upvotes, setUpvotes] = useState<number>(
    parseInt(comment.upvotes) || 0
  );
  const [downvotes, setDownvotes] = useState<number>(
    parseInt(comment.downvotes) || 0
  );
  const [menuVisible, setMenuVisible] = useState<boolean>(false);

  // Animation values
  const upvoteScale = useRef(new Animated.Value(1)).current;
  const downvoteScale = useRef(new Animated.Value(1)).current;

  // Animation function for button press
  const animatePress = (animatedValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.2,
        duration: 100,
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

  const handleUpvote = async () => {
    // Play animation
    animatePress(upvoteScale);

    // Store the previous state to restore on error
    const previousUpvotes = upvotes;
    const previousDownvotes = downvotes;
    const previousUserVote = userVote;

    // Update UI immediately for better user experience
    let apiVoteType: "up" | "down" | null = null;

    if (userVote === VoteType.UPVOTE) {
      setUpvotes(upvotes - 1);
      setUserVote(VoteType.NONE);
      apiVoteType = null; // Remove vote
    } else if (userVote === VoteType.DOWNVOTE) {
      setUpvotes(upvotes + 1);
      setDownvotes(downvotes - 1);
      setUserVote(VoteType.UPVOTE);
      apiVoteType = "up";
    } else {
      setUpvotes(upvotes + 1);
      setUserVote(VoteType.UPVOTE);
      apiVoteType = "up";
    }

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

      // Call the appropriate API based on whether we're removing or adding a vote
      if (apiVoteType === null) {
        // Remove vote
        const response = await postService.removeVote(
          comment.comment_id.toString(),
          "comments"
        );
      } else {
        // Add/change vote
        const response = await postService.votePost(
          comment.comment_id.toString(),
          apiVoteType,
          latitude,
          longitude,
          "comments"
        );
      }
    } catch (error) {
      // Revert to previous state
      setUpvotes(previousUpvotes);
      setDownvotes(previousDownvotes);
      setUserVote(previousUserVote);
    }
  };

  const handleDownvote = async () => {
    // Play animation
    animatePress(downvoteScale);

    // Store the previous state to restore on error
    const previousUpvotes = upvotes;
    const previousDownvotes = downvotes;
    const previousUserVote = userVote;

    // Update UI immediately for better user experience
    let apiVoteType: "up" | "down" | null = null;

    if (userVote === VoteType.DOWNVOTE) {
      setDownvotes(downvotes - 1);
      setUserVote(VoteType.NONE);
      apiVoteType = null; // Remove vote
    } else if (userVote === VoteType.UPVOTE) {
      setDownvotes(downvotes + 1);
      setUpvotes(upvotes - 1);
      setUserVote(VoteType.DOWNVOTE);
      apiVoteType = "down";
    } else {
      setDownvotes(downvotes + 1);
      setUserVote(VoteType.DOWNVOTE);
      apiVoteType = "down";
    }

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

      // Call the appropriate API based on whether we're removing or adding a vote
      if (apiVoteType === null) {
        // Remove vote
        const response = await postService.removeVote(
          comment.comment_id.toString(),
          "comments"
        );
      } else {
        // Add/change vote
        const response = await postService.votePost(
          comment.comment_id.toString(),
          apiVoteType,
          latitude,
          longitude,
          "comments"
        );
      }
    } catch (error) {
      // Revert to previous state
      setUpvotes(previousUpvotes);
      setDownvotes(previousDownvotes);
      setUserVote(previousUserVote);
    }
  };

  return (
    <View
      style={[
        styles.commentContainer,
        { backgroundColor: theme.card },
        // Add shadow and border for light mode
        !isDarkMode && {
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
          borderWidth: 1,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.commentHeader}>
        <View style={styles.userInfo}>
          <View
            style={[
              styles.userIcon,
              { width: 32, height: 32, backgroundColor: theme.primary },
            ]}
          >
            <Text style={[styles.userIconText, { fontSize: 14 }]}>
              {comment.username[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ marginLeft: 8 }}>
            <Text style={[styles.username, { color: theme.text }]}>
              {comment.username}
            </Text>
            <Text style={[styles.timestamp, { color: theme.textMuted }]}>
              {comment.ago}
            </Text>
          </View>
        </View>

        {/* Show menu button if user can delete this comment */}
        {comment.manage?.delete && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuVisible(true)}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={16}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.commentText, { color: theme.text }]}>
        {comment.content}
      </Text>

      <View style={styles.commentActions}>
        <Animated.View style={{ transform: [{ scale: upvoteScale }] }}>
          <TouchableOpacity style={styles.actionButton} onPress={handleUpvote}>
            <Ionicons
              name={
                userVote === VoteType.UPVOTE ? "arrow-up" : "arrow-up-outline"
              }
              size={16}
              color={
                userVote === VoteType.UPVOTE ? theme.primary : theme.textMuted
              }
            />
          </TouchableOpacity>
        </Animated.View>
        <Text style={[styles.voteCount, { color: theme.text }]}>{upvotes}</Text>

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
              size={16}
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

      <CommentMenu
        comment={comment}
        onDeleteComment={() => onDelete?.(comment.comment_id)}
        isVisible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </View>
  );
};

const PostDetailScreen = ({
  route,
  navigation,
}: {
  route: RouteProp<RootStackParamList, "PostDetail">;
  navigation: any;
}) => {
  const { post } = route.params;
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Initialize vote state from manage.voted field
  const getVoteTypeFromManage = (voted: any): VoteType => {
    if (voted === "up") return VoteType.UPVOTE;
    if (voted === "down") return VoteType.DOWNVOTE;
    return VoteType.NONE;
  };

  const [userVote, setUserVote] = useState<VoteType>(
    getVoteTypeFromManage(post.manage?.voted)
  );
  const [upvotes, setUpvotes] = useState<number>(post.upvotes || 0);
  const [downvotes, setDownvotes] = useState<number>(post.downvotes || 0);
  const [isSaved, setIsSaved] = useState<boolean>(
    post.manage?.bookmarked || false
  );
  const inputRef = useRef<TextInput>(null);

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

  // Fetch comments when component mounts
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await postService.getComments(post.id);
        if (response.status === "success" && response.data) {
          setComments(response.data);
        }
      } catch (error) {}
    };

    fetchComments();
  }, [post.id]);

  // Animation function for button press
  const animatePress = (animatedValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(animatedValue, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleUpvote = async () => {
    // Play animation
    animatePress(upvoteScale);

    // Store the previous state to restore on error
    const previousUpvotes = upvotes;
    const previousDownvotes = downvotes;
    const previousUserVote = userVote;

    // Update UI immediately for better user experience
    let apiVoteType: "up" | "down" | null = null;

    if (userVote === VoteType.UPVOTE) {
      setUpvotes(upvotes - 1);
      setUserVote(VoteType.NONE);
      apiVoteType = null; // Remove vote
    } else if (userVote === VoteType.DOWNVOTE) {
      setUpvotes(upvotes + 1);
      setDownvotes(downvotes - 1);
      setUserVote(VoteType.UPVOTE);
      apiVoteType = "up";
    } else {
      setUpvotes(upvotes + 1);
      setUserVote(VoteType.UPVOTE);
      apiVoteType = "up";
    }

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

      // Call the appropriate API based on whether we're removing or adding a vote
      if (apiVoteType === null) {
        // Remove vote
        const response = await postService.removeVote(post.id, "posts");
      } else {
        // Add/change vote
        const response = await postService.votePost(
          post.id,
          apiVoteType,
          latitude,
          longitude
        );
      }
    } catch (error) {
      // Revert to previous state
      setUpvotes(previousUpvotes);
      setDownvotes(previousDownvotes);
      setUserVote(previousUserVote);
    }
  };

  const handleDownvote = async () => {
    // Play animation
    animatePress(downvoteScale);

    // Store the previous state to restore on error
    const previousUpvotes = upvotes;
    const previousDownvotes = downvotes;
    const previousUserVote = userVote;

    // Update UI immediately for better user experience
    let apiVoteType: "up" | "down" | null = null;

    if (userVote === VoteType.DOWNVOTE) {
      setDownvotes(downvotes - 1);
      setUserVote(VoteType.NONE);
      apiVoteType = null; // Remove vote
    } else if (userVote === VoteType.UPVOTE) {
      setDownvotes(downvotes + 1);
      setUpvotes(upvotes - 1);
      setUserVote(VoteType.DOWNVOTE);
      apiVoteType = "down";
    } else {
      setDownvotes(downvotes + 1);
      setUserVote(VoteType.DOWNVOTE);
      apiVoteType = "down";
    }

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

      // Call the appropriate API based on whether we're removing or adding a vote
      if (apiVoteType === null) {
        // Remove vote
        const response = await postService.removeVote(post.id, "posts");
      } else {
        // Add/change vote
        const response = await postService.votePost(
          post.id,
          apiVoteType,
          latitude,
          longitude
        );
      }
    } catch (error) {
      // Revert to previous state
      setUpvotes(previousUpvotes);
      setDownvotes(previousDownvotes);
      setUserVote(previousUserVote);
    }
  };

  const handleSavePost = async () => {
    // Play animation
    animatePress(saveScale);

    const newSavedState = !isSaved;

    try {
      if (newSavedState) {
        // Add to saved posts
        await postService.savePost(post.id);
      } else {
        // Remove from saved posts
        await postService.unsavePost(post.id);
      }
      setIsSaved(newSavedState);
    } catch (error) {
      Alert.alert("Error", "Failed to save post. Please try again.");
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;

    setIsSubmitting(true);

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

      const commentData = {
        content: commentText.trim(),
        postId: post.id,
        isAnonymous: false,
        latitude,
        longitude,
      };

      const response = await postService.createComment(commentData);

      if (response.status === "success" && response.record) {
        // Add the new comment to the list
        setComments([response.record, ...comments]);
        setCommentText("");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to submit comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      // Call the API to delete the comment
      await postService.deleteComment(commentId.toString());

      // Remove the comment from the local state
      setComments(
        comments.filter((comment) => comment.comment_id !== commentId)
      );
    } catch (error) {
      Alert.alert("Error", "Failed to delete comment. Please try again.");
    }
  };

  // Post card component that will be sticky at the top
  const PostCard = () => (
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
          <View style={[styles.userIcon, { backgroundColor: theme.primary }]}>
            <Text style={styles.userIconText}>
              {post.username[0].toUpperCase()}
            </Text>
          </View>
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
      </View>

      <PostContent
        htmlContent={post.text}
        theme={theme}
        style={[styles.postText, { color: theme.text }]}
        onHashtagPress={(hashtag) => {
          // Navigate to explore page when hashtag is clicked
          navigation.navigate("Explore" as any);
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
            imageHeight={250}
            showCounter={true}
          />
        )}

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
          <TouchableOpacity style={styles.commentButton}>
            <Ionicons
              name="chatbubble-outline"
              size={18}
              color={theme.textMuted}
            />
            <Text style={[styles.commentCount, { color: theme.textMuted }]}>
              {comments.length}
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

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
        edges={["top", "left", "right"]}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Post</Text>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <View style={{ flex: 1 }}>
            {/* Fixed Post at the top */}
            <PostCard />

            {/* Scrollable comments section */}
            <FlatList
              data={comments}
              keyExtractor={(item) => item.comment_id.toString()}
              renderItem={({ item }) => (
                <CommentItem comment={item} onDelete={handleDeleteComment} />
              )}
              contentContainerStyle={styles.commentsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyCommentsContainer}>
                  <Text
                    style={[
                      styles.emptyCommentsText,
                      { color: theme.textMuted },
                    ]}
                  >
                    No comments yet. Be the first to comment!
                  </Text>
                </View>
              }
            />
          </View>

          <View
            style={[
              styles.commentInputContainer,
              { backgroundColor: theme.card, borderTopColor: theme.border },
            ]}
          >
            <TextInput
              ref={inputRef}
              style={[
                styles.commentInput,
                { color: theme.text, backgroundColor: theme.inputBackground },
              ]}
              placeholder="Add a comment..."
              placeholderTextColor={theme.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!commentText.trim() || isSubmitting) && { opacity: 0.5 },
              ]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  commentsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  postCardContainer: {
    marginBottom: 16,
  },
  postCard: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
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
  commentContainer: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  commentText: {
    color: "#F8F9FA",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  menuButton: {
    padding: 4,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderTopWidth: 1,
    borderTopColor: "#2D2D2D",
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#2D2D2D",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    color: "#F8F9FA",
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: "#4361EE",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "#2D2D2D",
  },
  commentsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyCommentsContainer: {
    padding: 16,
    alignItems: "center",
  },
  emptyCommentsText: {
    fontSize: 14,
  },
});

export default PostDetailScreen;
