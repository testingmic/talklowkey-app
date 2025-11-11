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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Reset Password
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Enter your email address and we'll send you a link to reset your
            password
          </Text>
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
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMessage("");
                }}
                placeholder="Enter your email"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[
                  styles.input,
                  { backgroundColor: theme.card, color: theme.text },
                ]}
              />
            </View>

            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={isLoading || !email}
              style={[
                styles.resetButton,
                { backgroundColor: theme.primary },
                (isLoading || !email) && styles.disabledButton,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.resetButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBackToLogin}
              style={styles.backButton2}
            >
              <Text style={[styles.backButtonText, { color: theme.primary }]}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  header: {
    marginTop: 16,
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
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
  inputLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  resetButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  resetButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  backButton2: {
    alignItems: "center",
    marginTop: 24,
  },
  backButtonText: {
    fontWeight: "bold",
    fontSize: 16,
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
