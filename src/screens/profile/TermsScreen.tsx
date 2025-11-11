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

const TermsScreen = () => {
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
          Terms of Service
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.termsHeader}>
          <Text
            style={[styles.termsDescription, { color: theme.textSecondary }]}
          >
            Please read these terms carefully before using our service. By using
            TalkLowKey, you agree to be bound by these terms.
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
              name="checkmark-circle-outline"
              size={20}
              color={theme.primary}
            />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              1. Acceptance of Terms
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            By accessing and using TalkLowKey, you accept and agree to be bound
            by the terms and provision of this agreement. If you do not agree to
            abide by the above, please do not use this service.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="apps-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              2. Description of Service
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            TalkLowKey is a local community platform that allows users to:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Share posts and content with users in their local area
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Connect with community members within a 45km radius
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Engage in discussions and interactions
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Access community information and updates
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              3. User Accounts
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            When you create an account with us, you must provide accurate and
            complete information. You are responsible for:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Maintaining the security of your account and password
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                All activities that occur under your account
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Notifying us immediately of any unauthorized use
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Ensuring your account information remains accurate and
                up-to-date
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              4. Acceptable Use Policy
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            You agree not to use the service to:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Post content that is illegal, harmful, threatening, abusive, or
                defamatory
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Harass, bully, or intimidate other users
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Share personal information of others without consent
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Post spam, advertisements, or commercial content without
                permission
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Impersonate another person or entity
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                Violate any applicable laws or regulations
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              5. Content Ownership
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            You retain ownership of content you post, but grant us a license to
            use, display, and distribute your content on our platform. You
            represent that you have the right to grant this license.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            We reserve the right to remove content that violates our terms or
            policies.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              6. Privacy
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Your privacy is important to us. Please review our Privacy Policy,
            which also governs your use of the service.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="close-circle-outline"
              size={20}
              color={theme.primary}
            />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              7. Termination
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            We may terminate or suspend your account immediately, without prior
            notice, for conduct that we believe violates these Terms of Service
            or is harmful to other users, us, or third parties.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              8. Contact Information
            </Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            If you have any questions about these Terms of Service, please
            contact us through the app or at our support email.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            By using TalkLowKey, you acknowledge that you have read, understood,
            and agree to be bound by these Terms of Service.
          </Text>
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
  termsHeader: {
    padding: 20,
  },
  termsDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
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
  bullet: {
    fontSize: 16,
    marginRight: 8,
    width: 12,
    textAlign: "center",
  },
  bulletText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default TermsScreen;
