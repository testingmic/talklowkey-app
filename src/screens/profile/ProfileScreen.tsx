import React, { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useData } from "../../contexts/DataContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { profileService } from "../../services/profileService";
import { postService } from "../../services/postService";

type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  AccountSettings: undefined;
  Privacy: undefined;
  Terms: undefined;
  HelpSupport: undefined;
  SavedPosts: undefined;
};

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  "ProfileScreen"
>;

type ProfileScreenProps = {
  navigation: ProfileScreenNavigationProp;
};

// Profile data interface (based on API response)
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

// Optimized Profile Image Component
interface OptimizedProfileImageProps {
  imageUri: string;
  username?: string;
  style: any;
  theme: any;
}

const OptimizedProfileImage: React.FC<OptimizedProfileImageProps> = ({
  imageUri,
  username,
  style,
  theme,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Optimize image URL for smaller size and better compression
  const getOptimizedImageUrl = (uri: string) => {
    const baseUrl = uri.startsWith("http")
      ? uri
      : `https://talklowkey.com/${uri}`;

    // Add query parameters for optimization
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}w=200&h=200&fit=crop&format=webp&quality=80`;
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    // Show fallback with user initial
    return (
      <View
        style={[
          style,
          {
            backgroundColor: theme.primary,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={[{ color: "white", fontSize: 32, fontWeight: "bold" }]}>
          {username ? username[0].toUpperCase() : "U"}
        </Text>
      </View>
    );
  }

  return (
    <View style={style}>
      {isLoading && (
        <View
          style={[
            style,
            {
              position: "absolute",
              backgroundColor: theme.card,
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1,
            },
          ]}
        >
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      )}
      <Image
        source={{
          uri: getOptimizedImageUrl(imageUri),
          cache: "force-cache", // Enable caching
        }}
        style={style}
        resizeMode="cover"
        onLoad={handleImageLoad}
        onError={handleImageError}
        // Add loading strategy for better performance
        loadingIndicatorSource={{
          uri: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        }}
      />
    </View>
  );
};

const ProfileScreen = ({ navigation }: ProfileScreenProps) => {
  const { user, logout } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const {
    profileData,
    savedPostsCount,
    isLoadingProfile,
    refreshProfileData,
    refreshSavedPosts,
  } = useData();

  // Calculate loading state
  const loading = isLoadingProfile && !profileData;

  // Refresh data when screen comes into focus (for real-time updates)
  useFocusEffect(
    React.useCallback(() => {
      if (!user?.isAnonymous) {
        // Refresh profile data and saved posts count for real-time updates
        // (This will be faster since data is already preloaded)
        refreshProfileData();
        refreshSavedPosts();
      }
    }, [user, refreshProfileData, refreshSavedPosts])
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  const handleCreateAccount = async () => {
    // Log out first, which will take the user to the auth screens
    try {
      await logout();
    } catch (error) {
      Alert.alert("Error", "Failed to proceed. Please try again.");
    }
  };

  const navigateToEditProfile = () => {
    if (user?.isAnonymous) {
      Alert.alert(
        "Create Account Required",
        "You need to create an account to edit your profile.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Create Account", onPress: handleCreateAccount },
        ]
      );
    } else {
      navigation.navigate("EditProfile");
    }
  };

  const navigateToAccountSettings = () => {
    if (user?.isAnonymous) {
      Alert.alert(
        "Create Account Required",
        "You need to create an account to access account settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Create Account", onPress: handleCreateAccount },
        ]
      );
    } else {
      navigation.navigate("AccountSettings");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <ScrollView>
        <View style={styles.profileHeader}>
          <View
            style={[
              styles.avatarContainer,
              {
                backgroundColor:
                  profileData?.profile_image && !user?.isAnonymous
                    ? "transparent"
                    : theme.primary,
              },
            ]}
          >
            {user?.isAnonymous ? (
              <Ionicons name="person" size={50} color="white" />
            ) : profileData?.profile_image ? (
              <OptimizedProfileImage
                imageUri={profileData.profile_image}
                username={profileData?.username}
                style={styles.avatarImage}
                theme={theme}
              />
            ) : (
              <Text style={styles.avatarText}>
                {profileData?.username
                  ? profileData.username[0].toUpperCase()
                  : "U"}
              </Text>
            )}
          </View>
          <View style={styles.usernameContainer}>
            <Text style={[styles.username, { color: theme.text }]}>
              {user?.isAnonymous
                ? "Anonymous User"
                : profileData?.username || user?.username || "User"}
            </Text>
            {profileData?.is_verified === "1" && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.primary}
                style={styles.verifiedIcon}
              />
            )}
          </View>
          <Text style={[styles.userInfo, { color: theme.textSecondary }]}>
            {user?.isAnonymous
              ? "You're browsing anonymously"
              : profileData?.email || user?.email || ""}
          </Text>
          {profileData?.location && (
            <Text style={[styles.userInfo, { color: theme.textSecondary }]}>
              📍 {profileData.location}
            </Text>
          )}
        </View>

        {!user?.isAnonymous && (
          <>
            {loading ? (
              <View style={[styles.statsContainer, { overflow: "hidden" }]}>
                <BlurView
                  intensity={20}
                  tint={isDarkMode ? "dark" : "light"}
                  style={StyleSheet.absoluteFill}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                    paddingVertical: 20,
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text
                    style={[styles.loadingText, { color: theme.textSecondary }]}
                  >
                    Loading profile...
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.statsContainer, { overflow: "hidden" }]}>
                <BlurView
                  intensity={20}
                  tint={isDarkMode ? "dark" : "light"}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={
                    isDarkMode
                      ? ["rgba(30, 30, 30, 0.6)", "rgba(30, 30, 30, 0.4)"]
                      : ["rgba(255, 255, 255, 0.6)", "rgba(255, 255, 255, 0.4)"]
                  }
                  style={StyleSheet.absoluteFill}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                    paddingVertical: 20,
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                  }}
                >
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {profileData?.statistics?.posts || 0}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: theme.textSecondary }]}
                  >
                    Posts
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {profileData?.statistics?.comments || 0}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: theme.textSecondary }]}
                  >
                    Comments
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {profileData?.statistics?.votes || 0}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: theme.textSecondary }]}
                  >
                    Votes
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => navigation.navigate("SavedPosts")}
                >
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {savedPostsCount}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.primary }]}>
                    Saved
                  </Text>
                </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        <View style={styles.optionsContainer}>
          {!user?.isAnonymous && (
            <TouchableOpacity
              style={[styles.optionButton, { overflow: "hidden" }]}
              onPress={navigateToEditProfile}
            >
              <BlurView
                intensity={15}
                tint={isDarkMode ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  styles.optionButtonContent,
                  {
                    borderBottomWidth: 1,
                    borderBottomColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                  },
                ]}
              >
              <Ionicons name="person-outline" size={24} color={theme.text} />
              <Text style={[styles.optionText, { color: theme.text }]}>
                Edit Profile
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.textMuted}
                style={styles.optionIcon}
              />
              </View>
            </TouchableOpacity>
          )}

          {!user?.isAnonymous && (
            <TouchableOpacity
              style={[styles.optionButton, { overflow: "hidden" }]}
              onPress={navigateToAccountSettings}
            >
              <BlurView
                intensity={15}
                tint={isDarkMode ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  styles.optionButtonContent,
                  {
                    borderBottomWidth: 1,
                    borderBottomColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                  },
                ]}
              >
              <Ionicons name="settings-outline" size={24} color={theme.text} />
              <Text style={[styles.optionText, { color: theme.text }]}>
                Account Settings
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.textMuted}
                style={styles.optionIcon}
              />
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.optionButton, { overflow: "hidden" }]}
            onPress={() => navigation.navigate("Privacy")}
          >
            <BlurView
              intensity={15}
              tint={isDarkMode ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                styles.optionButtonContent,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                },
              ]}
            >
            <Ionicons name="shield-outline" size={24} color={theme.text} />
            <Text style={[styles.optionText, { color: theme.text }]}>
              Privacy Policy
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.textMuted}
              style={styles.optionIcon}
            />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionButton, { overflow: "hidden" }]}
            onPress={() => navigation.navigate("Terms")}
          >
            <BlurView
              intensity={15}
              tint={isDarkMode ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                styles.optionButtonContent,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={24}
                color={theme.text}
              />
              <Text style={[styles.optionText, { color: theme.text }]}>
                Terms of Service
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.textMuted}
                style={styles.optionIcon}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionButton, { overflow: "hidden" }]}
            onPress={() => navigation.navigate("SavedPosts")}
          >
            <BlurView
              intensity={15}
              tint={isDarkMode ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                styles.optionButtonContent,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                },
              ]}
            >
              <Ionicons name="bookmark-outline" size={24} color={theme.text} />
              <Text style={[styles.optionText, { color: theme.text }]}>
                Saved Posts
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.textMuted}
                style={styles.optionIcon}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionButton, { overflow: "hidden" }]}
            onPress={() => navigation.navigate("HelpSupport")}
          >
            <BlurView
              intensity={15}
              tint={isDarkMode ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                styles.optionButtonContent,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                },
              ]}
            >
              <Ionicons name="help-circle-outline" size={24} color={theme.text} />
              <Text style={[styles.optionText, { color: theme.text }]}>
                Help & Support
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.textMuted}
                style={styles.optionIcon}
              />
            </View>
          </TouchableOpacity>

          {user?.isAnonymous && (
            <TouchableOpacity
              style={[styles.optionButton, { overflow: "hidden" }]}
              onPress={handleCreateAccount}
            >
              <BlurView
                intensity={15}
                tint={isDarkMode ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  styles.optionButtonContent,
                  {
                    borderBottomWidth: 1,
                    borderBottomColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                  },
                ]}
              >
                <Ionicons
                  name="person-add-outline"
                  size={24}
                  color={theme.primary}
                />
                <Text style={[styles.optionText, { color: theme.primary }]}>
                  Create Account
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.optionButton, styles.logoutButton, { overflow: "hidden" }]}
            onPress={handleLogout}
          >
            <BlurView
              intensity={15}
              tint={isDarkMode ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={
                isDarkMode
                  ? ["rgba(220, 53, 69, 0.3)", "rgba(220, 53, 69, 0.2)"]
                  : ["rgba(220, 53, 69, 0.2)", "rgba(220, 53, 69, 0.1)"]
              }
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.optionButtonContent}>
              <Ionicons name="log-out-outline" size={24} color={theme.error} />
              <Text style={[styles.optionText, { color: theme.error }]}>
                {user?.isAnonymous ? "Exit Anonymous Mode" : "Log Out"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 40,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  userInfo: {
    fontSize: 16,
    marginBottom: 8,
  },
  statsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    position: "relative",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  optionButton: {
    borderRadius: 12,
    marginBottom: 8,
    position: "relative",
    overflow: "hidden",
  },
  optionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 16,
  },
  optionIcon: {
    marginLeft: 8,
  },
  logoutButton: {
    marginTop: 16,
    marginBottom: 40,
  },
  usernameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedIcon: {
    marginLeft: 6,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
});

export default ProfileScreen;
