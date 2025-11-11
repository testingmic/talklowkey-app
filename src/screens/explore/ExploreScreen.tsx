import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { useData } from "../../contexts/DataContext";
import { useNavigation } from "@react-navigation/native";
import { PopularTag } from "../../services/postService";
import PostContent from "../../components/ui/PostContent";
import SwipableImageGallery from "../../components/ui/SwipableImageGallery";

type TabType = "trending" | "hashtags";

const ExploreScreen = () => {
  const [activeTab, setActiveTab] = useState<TabType>("trending");
  const [refreshing, setRefreshing] = useState(false);
  // Search states for both tabs
  const [hashtagSearchQuery, setHashtagSearchQuery] = useState("");
  const [trendingSearchQuery, setTrendingSearchQuery] = useState("");
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation();

  // Use preloaded data from DataContext
  const {
    trendingPosts,
    popularTags,
    isLoadingTrendingPosts,
    isLoadingPopularTags,
    refreshTrendingPosts,
    refreshPopularTags,
  } = useData();

  // Load data on component mount since it's no longer preloaded
  useEffect(() => {
    const loadInitialData = async () => {
      // Load both trending posts and popular tags if not already loaded
      if (trendingPosts.length === 0 && !isLoadingTrendingPosts) {
        refreshTrendingPosts();
      }
      if (popularTags.length === 0 && !isLoadingPopularTags) {
        refreshPopularTags();
      }
    };

    loadInitialData();
  }, []); // Empty dependency array to run only on mount

  // Filter hashtags based on search query
  const filteredHashtags = hashtagSearchQuery
    ? popularTags.filter((tag) =>
        tag.name.toLowerCase().includes(hashtagSearchQuery.toLowerCase())
      )
    : popularTags;

  // Filter trending posts based on search query (username, content, location)
  const filteredTrendingPosts = trendingSearchQuery
    ? trendingPosts.filter((post) => {
        const searchLower = trendingSearchQuery.toLowerCase();
        return (
          post.username.toLowerCase().includes(searchLower) ||
          post.text.toLowerCase().includes(searchLower) ||
          post.distance.toLowerCase().includes(searchLower)
        );
      })
    : trendingPosts;

  // Handle pull to refresh - use preloaded data refresh functions
  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === "trending") {
      await refreshTrendingPosts();
    } else {
      await refreshPopularTags();
    }
    setRefreshing(false);
  };

  // Handle post press - navigate to post detail
  const handlePostPress = (post: any) => {
    const postForDetail = {
      ...post,
      isUserPost: post.manage?.delete === true,
    };
    (navigation as any).navigate("PostDetail", { post: postForDetail });
  };

  // Handle hashtag press - navigate to HomeScreen with hashtag filter
  const handleHashtagPress = (tag: PopularTag) => {
    (navigation as any).navigate("Home", {
      screen: "HomeScreen",
      params: {
        hashtag: tag.name,
        hashtagCount: tag.usage_count,
      },
    });
  };

  // Render trending post item
  const renderTrendingPost = ({ item }: { item: any }) => (
    <TouchableOpacity
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
      onPress={() => handlePostPress(item)}
    >
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          {item.profile_image ? (
            <Image
              source={{ uri: item.profile_image }}
              style={styles.userIcon}
            />
          ) : (
            <View style={[styles.userIcon, { backgroundColor: theme.primary }]}>
              <Text style={styles.userIconText}>
                {item.username[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={[styles.username, { color: theme.text }]}>
              {item.username}
            </Text>
            <View style={styles.timeLocationRow}>
              <Text style={[styles.timestamp, { color: theme.textMuted }]}>
                {item.timestamp}
              </Text>
              <Text style={[styles.dot, { color: theme.textMuted }]}>•</Text>
              <Text style={[styles.distance, { color: theme.textMuted }]}>
                {item.distance}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.scoreContainer}>
          <Ionicons name="trending-up" size={16} color={theme.primary} />
          <Text style={[styles.scoreText, { color: theme.primary }]}>
            Score: {item.score}
          </Text>
        </View>
      </View>

      <PostContent
        htmlContent={item.text}
        theme={theme}
        style={[styles.postText, { color: theme.text }]}
        onHashtagPress={(hashtag) => {
          // Navigate to hashtags tab when hashtag is clicked
          setActiveTab("hashtags");
          setHashtagSearchQuery(hashtag.replace("#", ""));
        }}
      />

      {/* Display post media */}
      {item.has_media &&
        item.post_media?.images?.files &&
        item.post_media.images.files.length > 0 && (
          <SwipableImageGallery
            images={item.post_media.images.files.map(
              (file: string, index: number) => {
                const thumbnailUrl =
                  item.post_media!.images!.thumbnails?.[index]?.[0] || file;
                return `https://talklowkey.com/assets/uploads/${thumbnailUrl}`;
              }
            )}
            fullSizeImages={item.post_media.images.files.map(
              (file: string) => `https://talklowkey.com/assets/uploads/${file}`
            )}
            imageHeight={200}
            showCounter={true}
          />
        )}

      <View style={styles.postStats}>
        <View style={styles.statItem}>
          <Ionicons name="arrow-up" size={16} color={theme.textSecondary} />
          <Text style={[styles.statText, { color: theme.textSecondary }]}>
            {item.upvotes}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="arrow-down" size={16} color={theme.textSecondary} />
          <Text style={[styles.statText, { color: theme.textSecondary }]}>
            {item.downvotes}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons
            name="chatbubble-outline"
            size={16}
            color={theme.textSecondary}
          />
          <Text style={[styles.statText, { color: theme.textSecondary }]}>
            {item.commentCount}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render hashtag item
  const renderHashtag = ({ item }: { item: PopularTag }) => (
    <TouchableOpacity
      style={[styles.hashtagCard, { backgroundColor: theme.card }]}
      onPress={() => handleHashtagPress(item)}
    >
      <View style={styles.hashtagContent}>
        <View
          style={[
            styles.hashtagIcon,
            { backgroundColor: `${theme.primary}20` },
          ]}
        >
          <Text style={[styles.hashtagSymbol, { color: theme.primary }]}>
            #
          </Text>
        </View>
        <View style={styles.hashtagInfo}>
          <Text style={[styles.hashtagName, { color: theme.text }]}>
            #{item.name}
          </Text>
          <Text style={[styles.hashtagCount, { color: theme.textMuted }]}>
            {item.usage_count} posts
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
    </TouchableOpacity>
  );

  // Render tab buttons
  const renderTabButtons = () => (
    <View style={[styles.tabContainer, { backgroundColor: theme.card }]}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "trending" && { backgroundColor: `${theme.primary}20` },
        ]}
        onPress={() => setActiveTab("trending")}
      >
        <Ionicons
          name="trending-up"
          size={20}
          color={activeTab === "trending" ? theme.primary : theme.textMuted}
        />
        <Text
          style={[
            styles.tabButtonText,
            {
              color: activeTab === "trending" ? theme.primary : theme.textMuted,
            },
          ]}
        >
          Trending Nearby
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "hashtags" && { backgroundColor: `${theme.primary}20` },
        ]}
        onPress={() => setActiveTab("hashtags")}
      >
        <Ionicons
          name="pricetag"
          size={20}
          color={activeTab === "hashtags" ? theme.primary : theme.textMuted}
        />
        <Text
          style={[
            styles.tabButtonText,
            {
              color: activeTab === "hashtags" ? theme.primary : theme.textMuted,
            },
          ]}
        >
          Hashtags
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render hashtag search bar (only shown in hashtags tab)
  const renderHashtagSearch = () => (
    <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
      <Ionicons
        name="search"
        size={20}
        color={theme.textMuted}
        style={styles.searchIcon}
      />
      <TextInput
        style={[styles.searchInput, { color: theme.text }]}
        placeholder="Search hashtags..."
        placeholderTextColor={theme.textMuted}
        value={hashtagSearchQuery}
        onChangeText={setHashtagSearchQuery}
      />
      {hashtagSearchQuery.length > 0 && (
        <TouchableOpacity
          onPress={() => setHashtagSearchQuery("")}
          style={styles.clearButton}
        >
          <Ionicons name="close-circle" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );

  // Render trending search bar (only shown in trending tab)
  const renderTrendingSearch = () => (
    <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
      <Ionicons
        name="search"
        size={20}
        color={theme.textMuted}
        style={styles.searchIcon}
      />
      <TextInput
        style={[styles.searchInput, { color: theme.text }]}
        placeholder="Search by username, content, or location..."
        placeholderTextColor={theme.textMuted}
        value={trendingSearchQuery}
        onChangeText={setTrendingSearchQuery}
      />
      {trendingSearchQuery.length > 0 && (
        <TouchableOpacity
          onPress={() => setTrendingSearchQuery("")}
          style={styles.clearButton}
        >
          <Ionicons name="close-circle" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );

  // Render empty state
  const renderEmptyState = (type: "trending" | "hashtags") => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={type === "trending" ? "trending-up-outline" : "pricetag-outline"}
        size={60}
        color={theme.textMuted}
      />
      <Text style={[styles.emptyText, { color: theme.text }]}>
        {type === "trending"
          ? trendingSearchQuery
            ? `No posts found for "${trendingSearchQuery}"`
            : "No trending posts found"
          : hashtagSearchQuery
          ? `No hashtags found for "${hashtagSearchQuery}"`
          : "No hashtags found"}
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>
        {type === "trending"
          ? trendingSearchQuery
            ? "Try searching for different keywords"
            : "Check back later for trending content"
          : hashtagSearchQuery
          ? "Try a different search term"
          : "Hashtags will appear as they become popular"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Explore</Text>
      </View>

      {renderTabButtons()}

      {/* Show search bars based on active tab */}
      {activeTab === "trending" && renderTrendingSearch()}
      {activeTab === "hashtags" && renderHashtagSearch()}

      {activeTab === "trending" ? (
        isLoadingTrendingPosts && trendingPosts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>
              Loading trending posts...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTrendingPosts}
            keyExtractor={(item) => item.id}
            renderItem={renderTrendingPost}
            contentContainerStyle={styles.contentContainer}
            ListEmptyComponent={() => renderEmptyState("trending")}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )
      ) : isLoadingPopularTags && popularTags.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>
            Loading hashtags...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredHashtags}
          keyExtractor={(item) => item.tag_id.toString()}
          renderItem={renderHashtag}
          contentContainerStyle={styles.contentContainer}
          ListEmptyComponent={() => renderEmptyState("hashtags")}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  searchContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: 40,
  },
  clearButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  // Trending post styles
  postCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
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
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
    fontWeight: "600",
    fontSize: 14,
  },
  timeLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
  },
  dot: {
    marginHorizontal: 4,
    fontSize: 12,
  },
  distance: {
    fontSize: 12,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  postText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
  },
  // Hashtag styles
  hashtagCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  hashtagContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  hashtagIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  hashtagSymbol: {
    fontSize: 18,
    fontWeight: "bold",
  },
  hashtagInfo: {
    flex: 1,
  },
  hashtagName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  hashtagCount: {
    fontSize: 13,
  },
});

export default ExploreScreen;
