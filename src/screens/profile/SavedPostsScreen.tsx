import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useTheme } from "../../contexts/ThemeContext";
import { useData } from "../../contexts/DataContext";
import { postService, Post } from "../../services/postService";

const SavedPostsScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDarkMode } = useTheme();
  const {
    savedPosts: preloadedSavedPosts,
    isLoadingSavedPosts,
    refreshSavedPosts,
  } = useData();

  // Use preloaded data with local state for unsave operations
  const [localSavedPosts, setLocalSavedPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Update local state when preloaded data changes
  useEffect(() => {
    if (preloadedSavedPosts) {
      setLocalSavedPosts(preloadedSavedPosts as unknown as Post[]);
    }
  }, [preloadedSavedPosts]);

  // Load saved posts on component mount since they're no longer preloaded
  useEffect(() => {
    const loadInitialData = async () => {
      // Load saved posts if not already loaded
      if (localSavedPosts.length === 0 && !isLoadingSavedPosts) {
        await refreshSavedPosts();
      }
    };

    loadInitialData();
  }, []); // Empty dependency array to run only on mount

  // Calculate loading state - only show loading if no data is available
  const loading = isLoadingSavedPosts && localSavedPosts.length === 0;

  const loadSavedPosts = async () => {
    setError(null);
    await refreshSavedPosts();
  };

  const handlePostPress = (post: Post) => {
    // Convert Post to match PostDetailScreen expectations
    const postForDetail = {
      ...post,
      text: post.content, // Map content to text for PostDetailScreen
    };
    navigation.navigate("PostDetail", { post: postForDetail });
  };

  const handleUnsavePost = async (postId: string) => {
    try {
      await postService.unsavePost(postId);

      // Remove post from local state immediately for better UX
      setLocalSavedPosts(
        localSavedPosts.filter((post) => (post as any).post_id !== postId)
      );

      // Refresh saved posts in DataContext to keep count in sync
      await refreshSavedPosts();
    } catch (error) {
      Alert.alert("Error", "Failed to unsave post. Please try again.");
    }
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={[
        styles.postItem,
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
      onPress={() => handlePostPress(item)}
    >
      <View style={styles.postHeader}>
        <Text
          style={[styles.postTitle, { color: theme.text }]}
          numberOfLines={2}
        >
          {item.content}
        </Text>
        <TouchableOpacity
          style={styles.unsaveButton}
          onPress={() => handleUnsavePost((item as any).post_id)}
        >
          <Ionicons name="bookmark" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.postFooter}>
        <Text style={[styles.postAuthor, { color: theme.primary }]}>
          {item.username}
        </Text>
        <Text style={[styles.postMeta, { color: theme.textMuted }]}>
          {item.ago}
        </Text>
        <View style={styles.postStats}>
          <Ionicons name="arrow-up" size={16} color={theme.textSecondary} />
          <Text style={[styles.postStatText, { color: theme.textSecondary }]}>
            {item.upvotes || 0}
          </Text>
          <Ionicons name="arrow-down" size={16} color={theme.textSecondary} />
          <Text style={[styles.postStatText, { color: theme.textSecondary }]}>
            {item.downvotes || 0}
          </Text>
          <Ionicons
            name="chatbubble-outline"
            size={16}
            color={theme.textSecondary}
          />
          <Text style={[styles.postStatText, { color: theme.textSecondary }]}>
            {item.commentCount || 0}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="bookmark-outline" size={64} color={theme.textMuted} />
      <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
        No Saved Posts
      </Text>
      <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
        Posts you save will appear here
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="alert-circle-outline" size={64} color={theme.error} />
      <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
        Error Loading Posts
      </Text>
      <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
        {error}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: theme.primary }]}
        onPress={loadSavedPosts}
      >
        <Text style={[styles.retryButtonText, { color: "#FFFFFF" }]}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
        edges={["top"]}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Saved Posts
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading saved posts...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Saved Posts
        </Text>
      </View>

      {error ? (
        renderErrorState()
      ) : (
        <FlatList
          data={localSavedPosts}
          keyExtractor={(item, index) =>
            item.id?.toString() || `saved-post-${index}`
          }
          renderItem={renderPostItem}
          contentContainerStyle={
            localSavedPosts.length === 0
              ? styles.emptyContainer
              : styles.listContainer
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  postItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  postTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
    marginRight: 12,
  },
  unsaveButton: {
    padding: 4,
  },
  postFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: "500",
  },
  postMeta: {
    fontSize: 12,
    flex: 1,
    marginLeft: 8,
  },
  postStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  postStatText: {
    fontSize: 12,
    marginLeft: 4,
    marginRight: 12,
  },
});

export default SavedPostsScreen;
