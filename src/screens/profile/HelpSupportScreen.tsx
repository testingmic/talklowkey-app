import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../contexts/ThemeContext";

interface FAQ {
  question: string;
  answer: string;
  isExpanded: boolean;
}

const HelpSupportScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [supportMessage, setSupportMessage] = useState("");
  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      question: "How do I create an account?",
      answer: "To create an account, go to the Profile tab and tap on 'Create Account'. Follow the on-screen instructions to set up your username, email, and password.",
      isExpanded: false,
    },
    {
      question: "How does TalkLowKey protect my privacy?",
      answer: "TalkLowKey uses end-to-end encryption for all messages and only shares your location data with nearby users when you choose to do so. You can control your privacy settings in the Account Settings menu.",
      isExpanded: false,
    },
    {
      question: "Can I use TalkLowKey anonymously?",
      answer: "Yes! TalkLowKey allows anonymous browsing. Just select 'Continue as Guest' on the login screen. You can create a full account later if you wish.",
      isExpanded: false,
    },
    {
      question: "How do I report inappropriate content?",
      answer: "To report inappropriate content, tap the three dots menu on any post or message and select 'Report'. Choose the reason for reporting and submit your report for review.",
      isExpanded: false,
    },
    {
      question: "How do I delete my account?",
      answer: "To delete your account, go to Account Settings, scroll to the bottom, and tap 'Delete Account'. Confirm your choice, and your account and all associated data will be permanently removed.",
      isExpanded: false,
    },
    {
      question: "Why can't I see posts from certain areas?",
      answer: "Posts are location-based, so you'll only see posts from your current vicinity. Make sure your location services are enabled and that you've granted TalkLowKey permission to access your location.",
      isExpanded: false,
    },
  ]);

  const toggleFAQ = (index: number) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index].isExpanded = !updatedFaqs[index].isExpanded;
    setFaqs(updatedFaqs);
  };

  const handleSendMessage = () => {
    if (!supportMessage.trim()) {
      Alert.alert("Error", "Please enter a message before sending.");
      return;
    }

    // In a real app, this would send the message to a support system
    Alert.alert(
      "Message Sent",
      "Thank you for contacting support. We'll get back to you within 24 hours.",
      [{ text: "OK", onPress: () => setSupportMessage("") }]
    );
  };

  const openEmail = () => {
    Linking.openURL("mailto:support@TalkLowKey.com");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { borderBottomColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Frequently Asked Questions</Text>
          {faqs.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.faqItem, { backgroundColor: theme.card }]}
              onPress={() => toggleFAQ(index)}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: theme.text }]}>{faq.question}</Text>
                <Ionicons
                  name={faq.isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.primary}
                />
              </View>
              {faq.isExpanded && (
                <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.section, { borderBottomColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Troubleshooting</Text>
          <View style={styles.troubleshootingItem}>
            <Text style={[styles.troubleshootingTitle, { color: theme.text }]}>App Crashes</Text>
            <Text style={[styles.troubleshootingText, { color: theme.textSecondary }]}>
              If the app crashes frequently, try these steps:
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Text style={[styles.bullet, { color: theme.primary }]}>1.</Text>
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                  Update to the latest version of TalkLowKey
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={[styles.bullet, { color: theme.primary }]}>2.</Text>
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                  Restart your device
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={[styles.bullet, { color: theme.primary }]}>3.</Text>
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                  Clear the app cache (Settings {'>'} Apps {'>'} TalkLowKey {'>'} Storage {'>'} Clear Cache)
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={[styles.bullet, { color: theme.primary }]}>4.</Text>
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                  Reinstall the app
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.troubleshootingItem}>
            <Text style={[styles.troubleshootingTitle, { color: theme.text }]}>Connection Issues</Text>
            <Text style={[styles.troubleshootingText, { color: theme.textSecondary }]}>
              If you're having trouble connecting:
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Text style={[styles.bullet, { color: theme.primary }]}>1.</Text>
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                  Check your internet connection
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={[styles.bullet, { color: theme.primary }]}>2.</Text>
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                  Toggle WiFi off and on
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={[styles.bullet, { color: theme.primary }]}>3.</Text>
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                  Enable and disable Airplane mode
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={[styles.bullet, { color: theme.primary }]}>4.</Text>
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                  Check if TalkLowKey servers are down via our status page
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.section, { borderBottomColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Support</Text>
          <Text style={[styles.contactText, { color: theme.textSecondary }]}>
            Need more help? Our support team is available 24/7.
          </Text>
          
          <TouchableOpacity 
            style={[styles.contactButton, { backgroundColor: theme.primary }]} 
            onPress={openEmail}
          >
            <Ionicons name="mail-outline" size={20} color="white" />
            <Text style={styles.contactButtonText}>
              Email Support
            </Text>
          </TouchableOpacity>

          <Text style={[styles.orText, { color: theme.textMuted }]}>OR</Text>

          <Text style={[styles.messageLabel, { color: theme.textSecondary }]}>Send us a message:</Text>
          <TextInput
            style={[styles.messageInput, { backgroundColor: theme.card, color: theme.text }]}
            placeholder="Describe your issue..."
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={4}
            value={supportMessage}
            onChangeText={setSupportMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: theme.primary }]}
            onPress={handleSendMessage}
          >
            <Text style={styles.sendButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.text }]}>
          TalkLowKey Support Team
          </Text>
          <Text style={[styles.footerSubtext, { color: theme.textMuted }]}>
            Version 1.0.0
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
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  faqItem: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: 14,
    marginTop: 12,
    lineHeight: 22,
  },
  troubleshootingItem: {
    marginBottom: 20,
  },
  troubleshootingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  troubleshootingText: {
    fontSize: 14,
    marginBottom: 8,
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
    fontSize: 14,
    marginRight: 8,
    width: 16,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  contactText: {
    fontSize: 16,
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  contactButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  orText: {
    textAlign: "center",
    marginVertical: 16,
  },
  messageLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  messageInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 100,
    textAlignVertical: "top",
  },
  sendButton: {
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  sendButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    fontWeight: "600",
  },
  footerSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default HelpSupportScreen; 