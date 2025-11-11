import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../contexts/ThemeContext";
import { useData } from "../../contexts/DataContext";
import { profileService } from "../../services/profileService";

type ProfileStackParamList = {
  ProfileScreen: undefined;
  AccountSettings: undefined;
};

type AccountSettingsScreenNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  "AccountSettings"
>;

type AccountSettingsScreenProps = {
  navigation: AccountSettingsScreenNavigationProp;
};

const AccountSettingsScreen = ({ navigation }: AccountSettingsScreenProps) => {
  // Get theme from context
  const { theme, isDarkMode, toggleTheme } = useTheme();

  // Get preloaded settings from DataContext
  const { userSettings, isLoadingSettings, updateLocalSetting } = useData();

  // Use preloaded settings with fallback to defaults
  const pushNotifications = userSettings?.push_notifications ?? true;
  const emailNotifications = userSettings?.email_notifications ?? true;
  const profileVisibility = userSettings?.profile_visibility ?? true;
  const searchVisibility = userSettings?.search_visibility ?? true;

  // Calculate loading state - only show loading if no data is available
  const isLoading = isLoadingSettings && !userSettings;

  // Toggle push notifications
  const togglePushNotifications = async (value: boolean) => {
    try {
      // Update local state immediately for responsive UI
      updateLocalSetting("push_notifications", value);
      await profileService.updateUserSetting(
        "push_notifications",
        value ? "1" : "false"
      );
    } catch (error) {
      // Revert on error
      updateLocalSetting("push_notifications", !value);
      Alert.alert("Error", "Failed to save setting. Please try again.");
    }
  };

  // Toggle email notifications
  const toggleEmailNotifications = async (value: boolean) => {
    try {
      // Update local state immediately for responsive UI
      updateLocalSetting("email_notifications", value);
      await profileService.updateUserSetting(
        "email_notifications",
        value ? "1" : "false"
      );
    } catch (error) {
      // Revert on error
      updateLocalSetting("email_notifications", !value);
      Alert.alert("Error", "Failed to save setting. Please try again.");
    }
  };

  // Toggle profile visibility
  const toggleProfileVisibility = async (value: boolean) => {
    try {
      // Update local state immediately for responsive UI
      updateLocalSetting("profile_visibility", value);
      await profileService.updateUserSetting(
        "profile_visibility",
        value ? "1" : "false"
      );
    } catch (error) {
      // Revert on error
      updateLocalSetting("profile_visibility", !value);
      Alert.alert("Error", "Failed to save setting. Please try again.");
    }
  };

  // Toggle search visibility
  const toggleSearchVisibility = async (value: boolean) => {
    try {
      // Update local state immediately for responsive UI
      updateLocalSetting("search_visibility", value);
      await profileService.updateUserSetting(
        "search_visibility",
        value ? "1" : "false"
      );
    } catch (error) {
      // Revert on error
      updateLocalSetting("search_visibility", !value);
      Alert.alert("Error", "Failed to save setting. Please try again.");
    }
  };

  if (isLoading) {
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
            Account Settings
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading settings...
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
          Account Settings
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { borderBottomColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Notifications
          </Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Push Notifications
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: theme.textSecondary },
                ]}
              >
                Receive push notifications on your device
              </Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={togglePushNotifications}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={theme.card}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Email Notifications
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: theme.textSecondary },
                ]}
              >
                Receive email notifications about activity
              </Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={toggleEmailNotifications}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={theme.card}
            />
          </View>
        </View>

        <View style={[styles.section, { borderBottomColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Privacy
          </Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Profile Visibility
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: theme.textSecondary },
                ]}
              >
                Allow others to view your profile
              </Text>
            </View>
            <Switch
              value={profileVisibility}
              onValueChange={toggleProfileVisibility}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={theme.card}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Search Visibility
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: theme.textSecondary },
                ]}
              >
                Allow others to find you in search
              </Text>
            </View>
            <Switch
              value={searchVisibility}
              onValueChange={toggleSearchVisibility}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={theme.card}
            />
          </View>
        </View>

        <View style={[styles.section, { borderBottomColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Appearance
          </Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Dark Mode
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: theme.textSecondary },
                ]}
              >
                Use dark theme for the app
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={theme.card}
            />
          </View>
        </View>

        <View style={[styles.section, { borderBottomColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Account
          </Text>

          <TouchableOpacity style={styles.dangerButton}>
            <Text style={styles.dangerButtonText}>Delete Account</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  dangerButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  dangerButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default AccountSettingsScreen;
