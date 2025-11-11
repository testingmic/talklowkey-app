import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const ForgotPasswordScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [isResetSent, setIsResetSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { theme } = useTheme();

  const { resetPassword, isLoading } = useAuth();

  const handleResetPassword = async () => {
    if (!email) {
      const msg = "Please enter your email address";
      setErrorMessage(msg);
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const msg = "Please enter a valid email address";
      setErrorMessage(msg);
      return;
    }

    // Clear any previous errors
    setErrorMessage("");

    try {
      await resetPassword(email);
      setIsResetSent(true);
    } catch (error: any) {

      // Handle different error scenarios
      if (error.response) {

        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.data && error.response.data.message) {
          const msg = error.response.data.message;
          setErrorMessage(msg);
        } else if (error.response.data && error.response.data.data) {
          // Handle both string and object data formats
          const msg =
            typeof error.response.data.data === "string"
              ? error.response.data.data
              : Object.values(error.response.data.data).join(", ");
          setErrorMessage(msg);
        } else {
          const msg = "Failed to send reset link. Please try again.";
          setErrorMessage(msg);
        }
      } else if (error.request) {
        // The request was made but no response was received
        const msg = "Network error. Please check your connection.";
        setErrorMessage(msg);
      } else {
        // Something happened in setting up the request
        const msg = error.message || "An error occurred. Please try again.";
        setErrorMessage(msg);
      }

      // Fields are intentionally not cleared on error so the user doesn't have to retype everything
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.content}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          {/* Promotional Section */}
          <View style={styles.promotionalSection}>
            <View style={[styles.promoIconContainer, { backgroundColor: '#FF6B35' }]}>
              <Ionicons name="lock-closed-outline" size={32} color="#fff" />
            </View>
            <Text style={[styles.promoTitle, { color: theme.text }]}>
              Forgot Password?
            </Text>
            <Text style={[styles.promoDescription, { color: theme.textSecondary }]}>
              Don't worry! It happens to the best of us. Enter your email address and we'll send you a secure link to reset your password and get back to connecting with your community.
            </Text>
            
            {/* Feature Cards */}
            {/* <View style={styles.featureCardsContainer}> */}
              {/* <View style={[styles.featureCard, { backgroundColor: theme.card, marginRight: 6 }]}>
                <View style={[styles.featureIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#FF6B35" />
                </View>
                <Text style={[styles.featureTitle, { color: theme.text }]}>
                  Secure Reset
                </Text>
                <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                  One-time secure link sent to your email
                </Text>
              </View> */}
              
              {/* <View style={[styles.featureCard, { backgroundColor: theme.card, marginLeft: 6 }]}>
                <View style={[styles.featureIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#90BE6D" />
                </View>
                <Text style={[styles.featureTitle, { color: theme.text }]}>
                  Easy Recovery
                </Text>
                <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                  Get back to your account immediately
                </Text>
              </View> */}
            {/* </View> */}
          </View>

          {isResetSent ? (
            // Success message
            <View style={styles.successContainer}>
            <View
              style={[
                styles.successIcon,
                { backgroundColor: theme.success || "#90BE6D" },
              ]}
            >
              <Ionicons name="checkmark" size={40} color="#fff" />
            </View>
            <Text style={[styles.successTitle, { color: theme.text }]}>
              Email Sent!
            </Text>
            <Text style={[styles.successText, { color: theme.textSecondary }]}>
              Check your inbox for instructions on how to reset your password
            </Text>
            <TouchableOpacity
              onPress={handleBackToLogin}
              style={[
                styles.backToLoginButton,
                { backgroundColor: theme.primary },
              ]}
            >
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
          ) : (
            // Reset password form
            <View style={styles.form}>
            {errorMessage ? (
              <View
                style={[
                  styles.errorContainer,
                  {
                    backgroundColor: `${theme.error}20`,
                    borderWidth: 1,
                    borderColor: theme.error,
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={24} color={theme.error} />
                <Text
                  style={[
                    styles.errorText,
                    {
                      color: theme.error,
                      fontWeight: "500",
                      fontSize: 15,
                    },
                  ]}
                >
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <View style={[styles.labelDot, { backgroundColor: '#FF6B35' }]} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Email Address
                </Text>
              </View>
              <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
                <Ionicons name="mail-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrorMessage("");
                  }}
                  placeholder="Enter your email address"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[
                    styles.input,
                    { color: theme.text },
                  ]}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={isLoading || !email}
              style={[
                styles.resetButton,
                (isLoading || !email) && styles.disabledButton,
              ]}
            >
              <LinearGradient
                colors={['#FF6B35', '#E63946']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.resetButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="mail-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.resetButtonText}>Send Reset Link</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.rememberPasswordContainer}>
              <Text style={[styles.rememberPasswordText, { color: theme.textSecondary }]}>
                Remember your password?
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleBackToLogin}
              style={[styles.backButton2, { borderColor: theme.border }]}
            >
              <Ionicons name="arrow-back-outline" size={18} color={theme.text} style={{ marginRight: 8 }} />
              <Text style={[styles.backButtonText, { color: theme.text }]}>
                Back to Sign In
              </Text>
            </TouchableOpacity>

            {/* Didn't receive email section */}
            <View style={[styles.emailHelpContainer, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="information-circle-outline" size={20} color="#4361EE" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.emailHelpText, { color: theme.text }]}>
                  Didn't receive the email? Check your spam folder or try these solutions:
                </Text>
                <View style={styles.emailHelpList}>
                  <Text style={[styles.emailHelpItem, { color: theme.textSecondary }]}>
                    • Verify your email address is correct
                  </Text>
                  <Text style={[styles.emailHelpItem, { color: theme.textSecondary }]}>
                    • Check your spam/junk folder
                  </Text>
                  <Text style={[styles.emailHelpItem, { color: theme.textSecondary }]}>
                    • Wait a few minutes and try again
                  </Text>
                </View>
              </View>
            </View>
          </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  promotionalSection: {
    marginTop: 16,
    marginBottom: 32,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  promoIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  promoTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
  },
  promoDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 5,
  },
  featureCardsContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  featureCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  helpSection: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  contactSupportButton: {
    borderRadius: 8,
    overflow: "hidden",
  },
  contactSupportGradient: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  contactSupportText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  header: {
    marginTop: 8,
    marginBottom: 32,
    alignItems: "center",
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    marginTop: 8,
  },
  errorText: {
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  labelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  resetButton: {
    borderRadius: 8,
    marginTop: 8,
    overflow: "hidden",
  },
  resetButtonGradient: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  resetButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  rememberPasswordContainer: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  rememberPasswordText: {
    fontSize: 14,
  },
  backButton2: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "#fff",
    marginBottom: 24,
  },
  backButtonText: {
    fontWeight: "500",
    fontSize: 16,
  },
  emailHelpContainer: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  emailHelpText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  emailHelpList: {
    marginTop: 4,
  },
  emailHelpItem: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  backToLoginButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backToLoginText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ForgotPasswordScreen;
