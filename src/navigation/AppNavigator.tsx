import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import AuthNavigator from "./AuthNavigator";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useAuthDataSync } from "../hooks/useAuthDataSync";
import AppConfig from "../constants/AppConfig";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getFocusedRouteNameFromRoute,
  useNavigation,
} from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

// Import actual screens
import HomeScreen from "../screens/home/HomeScreen";
import ExploreScreen from "../screens/explore/ExploreScreen";
import PostDetailScreen from "../screens/home/PostDetailScreen";
import { Post } from "../screens/home/PostDetailScreen";
import ChatNavigator from "./ChatNavigator";
import ChatDetailScreen from "../screens/chat/ChatDetailScreen";
import { EnhancedConversation } from "./ChatNavigator";
import ProfileScreen from "../screens/profile/ProfileScreen";
import EditProfileScreen from "../screens/profile/EditProfileScreen";
import AccountSettingsScreen from "../screens/profile/AccountSettingsScreen";
import PrivacyScreen from "../screens/profile/PrivacyScreen";
import TermsScreen from "../screens/profile/TermsScreen";
import HelpSupportScreen from "../screens/profile/HelpSupportScreen";
import SavedPostsScreen from "../screens/profile/SavedPostsScreen";
import CreatePostScreen from "../screens/post/CreatePostScreen";

// Define types for navigation
export type RootStackParamList = {
  MainTabs: undefined;
  PostDetail: { post: Post };
  ChatDetail: { conversation: EnhancedConversation };
  CreatePost: undefined;
};

type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  AccountSettings: undefined;
  Privacy: undefined;
  Terms: undefined;
  HelpSupport: undefined;
  SavedPosts: undefined;
};

type HomeStackParamList = {
  HomeScreen: {
    hashtag?: string;
    hashtagCount?: number;
  };
};

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  "ProfileScreen"
>;

type ProfileScreenProps = {
  navigation: ProfileScreenNavigationProp;
};

const PostScreen = () => {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.placeholderContainer,
        { backgroundColor: theme.background },
      ]}
      edges={["top"]}
    >
      <View style={styles.placeholderContent}>
        <Ionicons name="add-circle-outline" size={60} color={theme.primary} />
        <Text style={[styles.placeholderText, { color: theme.text }]}>
          Create Post
        </Text>
        <Text
          style={[styles.placeholderSubtext, { color: theme.textSecondary }]}
        >
          This screen will allow users to create new posts.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const NotificationsScreen = () => {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.placeholderContainer,
        { backgroundColor: theme.background },
      ]}
      edges={["top"]}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Notifications
        </Text>
      </View>
      <View style={styles.placeholderContent}>
        <Ionicons
          name="notifications-outline"
          size={60}
          color={theme.primary}
        />
        <Text style={[styles.placeholderText, { color: theme.text }]}>
          Notifications
        </Text>
        <Text
          style={[styles.placeholderSubtext, { color: theme.textSecondary }]}
        >
          This screen will display user notifications.
        </Text>
      </View>
    </SafeAreaView>
  );
};

// Stack navigators
const RootStack = createNativeStackNavigator<RootStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ExploreStack = createNativeStackNavigator();
const PostStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// Main tab navigator
const Tab = createBottomTabNavigator();

const HomeStackNavigator = () => {
  const { theme } = useTheme();

  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
    </HomeStack.Navigator>
  );
};

const ExploreStackNavigator = () => {
  const { theme } = useTheme();

  return (
    <ExploreStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <ExploreStack.Screen name="ExploreScreen" component={ExploreScreen} />
    </ExploreStack.Navigator>
  );
};

const PostStackNavigator = () => {
  const { theme } = useTheme();

  return (
    <PostStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <PostStack.Screen name="CreatePost" component={CreatePostScreen} />
    </PostStack.Navigator>
  );
};

const ProfileStackNavigator = () => {
  const { theme } = useTheme();

  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen
        name="AccountSettings"
        component={AccountSettingsScreen}
      />
      <ProfileStack.Screen name="Privacy" component={PrivacyScreen} />
      <ProfileStack.Screen name="Terms" component={TermsScreen} />
      <ProfileStack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <ProfileStack.Screen name="SavedPosts" component={SavedPostsScreen} />
    </ProfileStack.Navigator>
  );
};

// Badge component for showing unread counts
const TabBarBadge = ({ count }: { count: number }) => {
  if (count === 0) return null;

  return (
    <View style={styles.badgeContainer}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
};

// Helper function to get tab bar visibility
const getTabBarVisibility = (route: any, theme: any) => {
  const routeName = getFocusedRouteNameFromRoute(route) ?? "";

  return {
    backgroundColor: theme.card,
    borderTopColor: theme.border,
    position: "relative" as const,
  };
};

const MainTabNavigator = () => {
  const { theme } = useTheme();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Load unread message count
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        // In a real app, this would come from a server or local database
        // For now, we'll use the mock data to count unread messages
        const storedCount = await AsyncStorage.getItem("unread_message_count");
        if (storedCount !== null) {
          setUnreadMessageCount(parseInt(storedCount, 10));
        } else {
          // Default mock count if none is stored
          setUnreadMessageCount(3);
        }
      } catch (error) {
      }
    };

    loadUnreadCount();

    // Set up a listener to update the badge when unread count changes
    const intervalId = setInterval(loadUnreadCount, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Explore") {
            iconName = focused ? "compass" : "compass-outline";
          } else if (route.name === "Post") {
            iconName = "add-circle";
            size = 32;
          } else if (route.name === "Chat") {
            iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        headerShown: false,
        tabBarStyle: getTabBarVisibility(route, theme),
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Explore" component={ExploreStackNavigator} />
      <Tab.Screen name="Post" component={PostStackNavigator} />
      <Tab.Screen
        name="Chat"
        component={ChatNavigator}
        options={{
          tabBarBadge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.error,
          },
        }}
      />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};

// Loading screen
const LoadingScreen = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[styles.loadingContainer, { backgroundColor: theme.background }]}
    >
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loadingText, { color: theme.text }]}>
        Loading...
      </Text>
    </View>
  );
};

const AppNavigator = () => {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();

  // This hook will automatically load data when user logs in and clear it on logout
  useAuthDataSync();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {user ? (
        <RootStack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
          }}
        >
          <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
          <RootStack.Screen name="PostDetail" component={PostDetailScreen} />
          <RootStack.Screen name="ChatDetail" component={ChatDetailScreen} />
          <RootStack.Screen name="CreatePost" component={CreatePostScreen} />
        </RootStack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 20,
  },
  profileHeader: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#2D2D2D",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#F8F9FA",
    marginBottom: 8,
  },
  userInfo: {
    fontSize: 16,
    color: "#ADB5BD",
  },
  optionsContainer: {
    marginTop: 30,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2D2D2D",
  },
  optionText: {
    fontSize: 16,
    color: "#F8F9FA",
    marginLeft: 16,
  },
  logoutButton: {
    marginTop: 20,
    borderBottomWidth: 0,
  },
  logoutText: {
    color: "#dc3545",
  },
  placeholderContainer: {
    flex: 1,
  },
  placeholderContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
  },
  placeholderSubtext: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
    maxWidth: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  badgeContainer: {
    position: "absolute",
    top: -4,
    right: -8,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
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
});

export default AppNavigator;
