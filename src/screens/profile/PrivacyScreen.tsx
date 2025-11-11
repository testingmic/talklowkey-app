import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../contexts/ThemeContext";

const PrivacyScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

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
          Privacy Policy
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.policyHeader}>
          <Text style={[styles.policyTitle, { color: theme.text }]}>
            Privacy Policy
          </Text>
          <Text
            style={[styles.policyDescription, { color: theme.textSecondary }]}
          >
            We respect your privacy and are committed to protecting your
            personal data. This policy explains how we collect, use, and
            safeguard your information.
          </Text>
          <View style={styles.versionInfo}>
            <Text style={[styles.versionText, { color: theme.textMuted }]}>
              Last updated: June 20, 2025 • Version 1.0
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color={theme.primary}
            />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              1. Information We Collect
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            We collect information you provide directly to us, including:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.labelBulletItem}>
              <Text style={[styles.bulletLabel, { color: theme.text }]}>
                Account Information:
              </Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Name, email address, and profile information
              </Text>
            </View>
            <View style={styles.labelBulletItem}>
              <Text style={[styles.bulletLabel, { color: theme.text }]}>
                Location Data:
              </Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Your approximate location to connect you with local community
                members
              </Text>
            </View>
            <View style={styles.labelBulletItem}>
              <Text style={[styles.bulletLabel, { color: theme.text }]}>
                Content:
              </Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Posts, comments, and media you share on the platform
              </Text>
            </View>
            <View style={styles.labelBulletItem}>
              <Text style={[styles.bulletLabel, { color: theme.text }]}>
                Usage Data:
              </Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                How you interact with our service and features
              </Text>
            </View>
            <View style={styles.labelBulletItem}>
              <Text style={[styles.bulletLabel, { color: theme.text }]}>
                Device Information:
              </Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Device type, operating system, and browser information
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              2. How We Use Your Information
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            We use the information we collect to:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Provide, maintain, and improve our services
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Connect you with other users in your local area
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Personalize your experience and content
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Send you important updates and notifications
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Comply with legal obligations
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              3. Location Services
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Our service uses location data to:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Show you content from users within a 45km radius
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Connect you with your local community
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Provide location-based features and services
              </Text>
            </View>
          </View>
          <Text style={[styles.locationNote, { color: theme.textSecondary }]}>
            You can control location permissions through your device settings.
            We only access your location when you grant permission.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="share-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              4. Information Sharing
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            We do not sell, trade, or rent your personal information. We may
            share your information in the following circumstances:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.labelBulletItem}>
              <Text style={[styles.bulletLabel, { color: theme.text }]}>
                With Your Consent:
              </Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                When you explicitly agree to share information
              </Text>
            </View>
            <View style={styles.labelBulletItem}>
              <Text style={[styles.bulletLabel, { color: theme.text }]}>
                Service Providers:
              </Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                With trusted third-party services that help us operate our
                platform
              </Text>
            </View>
            <View style={styles.labelBulletItem}>
              <Text style={[styles.bulletLabel, { color: theme.text }]}>
                Legal Requirements:
              </Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                When required by law or to protect rights and safety
              </Text>
            </View>
            <View style={styles.labelBulletItem}>
              <Text style={[styles.bulletLabel, { color: theme.text }]}>
                Community Content:
              </Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Your posts and public content are visible to other users in your
                area
              </Text>
            </View>
          </View>
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
  policyHeader: {
    padding: 20,
  },
  policyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  policyDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  versionInfo: {
    marginTop: 12,
    alignItems: "center",
  },
  versionText: {
    fontSize: 14,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletList: {
    marginTop: 8,
    marginLeft: 8,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  labelBulletItem: {
    marginBottom: 12,
  },
  bullet: {
    fontSize: 16,
    marginRight: 8,
    width: 12,
    textAlign: "center",
  },
  bulletLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  bulletText: {
    fontSize: 16,
    lineHeight: 24,
    marginLeft: 0,
  },
  locationNote: {
    marginTop: 8,
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
  },
});

export default PrivacyScreen;
