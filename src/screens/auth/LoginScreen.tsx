import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const { theme } = useTheme();

  const { login, continueAsGuest } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      const msg = "Please enter both email and password";
      setErrorMessage(msg);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const msg = "Please enter a valid email address";
      setErrorMessage(msg);
      return;
    }

    // Clear any previous errors
    setErrorMessage("");
    setIsButtonLoading(true);

    try {
      await login(email, password);
      // Only clear fields on successful login (the code won't reach here if login fails)
    } catch (error: any) {
      // Handle different error scenarios

      if (error.response) {

        // Check for specific error messages
        if (error.response.status === 401) {
          const msg = "Invalid email or password";
          setErrorMessage(msg);
        } else if (error.response.data && error.response.data.message) {
          // Use the server's error message
          const msg = error.response.data.message;
          setErrorMessage(msg);
        } else if (error.response.data && error.response.data.data) {
          // Some APIs put the message in a data field
          const msg =
            typeof error.response.data.data === "string"
              ? error.response.data.data
              : Object.values(error.response.data.data).join(", ");
          setErrorMessage(msg);
        } else if (
          error.response.data &&
          typeof error.response.data === "string"
        ) {
          // Sometimes the error is just a string
          const msg = error.response.data;
          setErrorMessage(msg);
        } else {
          const msg = `Login failed (${error.response.status}). Please try again.`;
          setErrorMessage(msg);
        }
      } else if (error.request) {
        const msg = "Network error. Please check your connection.";
        setErrorMessage(msg);
      } else {
        const msg = error.message || "An error occurred. Please try again.";
        setErrorMessage(msg);
      }

      // Fields are intentionally not cleared on error so the user doesn't have to retype everything

      // Force a re-render
      setTimeout(() => {
        // console.log("Current error message state:", errorMessage);
      }, 100);
    } finally {
      setIsButtonLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate("SignUp");
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  const handleSkip = async () => {
    try {
      await continueAsGuest();
    } catch (error) {
      Alert.alert("Error", "Failed to continue as guest. Please try again.");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <View style={[styles.logoIcon, { backgroundColor: theme.primary }]}>
              <Ionicons name="chatbubble-outline" size={40} color="#fff" />
            </View>
            <Text style={[styles.appName, { color: theme.text }]}>
              Welcome to TalkLowKey
            </Text>
            <Text style={[styles.appTagline, { color: theme.textSecondary }]}>
              Share thoughts, ideas, and experiences in a safe environment where your privacy is our priority. Connect with your community through secure, private messaging.
            </Text>
            
            {/* Feature Cards */}
            <View style={styles.featureCardsContainer}>
              <View style={[styles.featureCard, { backgroundColor: theme.card, borderColor: theme.border, marginRight: 6 }]}>
                <View style={[styles.featureIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="people-outline" size={24} color="#90BE6D" />
                </View>
                <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                  Chat one-on-one or create group conversations.
                </Text>
              </View>
              
              <View style={[styles.featureCard, { backgroundColor: theme.card, borderColor: theme.border, marginLeft: 6 }]}>
                <View style={[styles.featureIcon, { backgroundColor: '#F3E5F5' }]}>
                  <Ionicons name="images-outline" size={24} color="#9C27B0" />
                </View>
                <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                  Share images and media with your conversations.
                </Text>
              </View>
            </View>
          </View>

          {/* Login Form */}
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
              <View style={[styles.labelDot, { backgroundColor: '#4361EE' }]} />
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Username or Email
              </Text>
            </View>
            <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
              <Ionicons name="person-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="abenajaunty20@gmail.com"
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

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <View style={[styles.labelDot, { backgroundColor: '#9C27B0' }]} />
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Password
              </Text>
            </View>
            <View
              style={[
                styles.passwordContainer,
                { backgroundColor: theme.card },
              ]}
            >
              <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showPassword}
                style={[styles.passwordInput, { color: theme.text }]}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotPassword}
          >
            <Text
              style={[styles.forgotPasswordText, { color: theme.primary }]}
            >
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isButtonLoading}
            style={[
              styles.loginButton,
              isButtonLoading && styles.disabledButton,
            ]}
          >
            <LinearGradient
              colors={['#4361EE', '#9C27B0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButtonGradient}
            >
              {isButtonLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.loginButtonText}>Sign In to Your Account</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={[styles.noAccountText, { color: theme.textSecondary }]}>
              New to TalkLowKey?{" "}
            </Text>
            <View style={styles.signupButtonsContainer}>
              <TouchableOpacity 
                onPress={handleSignUp}
                style={[styles.signupButton, { borderColor: theme.border }]}
              >
                <Ionicons name="person-add-outline" size={18} color={theme.text} style={{ marginRight: 8 }} />
                <Text style={[styles.signupText, { color: theme.text }]}>
                  Create Your Account
                </Text>
              </TouchableOpacity>
              
              {/* <TouchableOpacity 
                style={[styles.installButton, { borderColor: theme.border }]}
              >
                <Ionicons name="download-outline" size={18} color="#90BE6D" style={{ marginRight: 8 }} />
                <Text style={[styles.installText, { color: theme.text }]}>
                  Install App
                </Text>
              </TouchableOpacity> */}
            </View>
          </View>
        </ScrollView>

        {/* Skip Button */}
        {/* <TouchableOpacity
          onPress={handleSkip}
          style={[styles.skipButton, { borderColor: theme.border }]}
        >
          <Text style={[styles.skipButtonText, { color: theme.text }]}>
            Skip & Use Anonymously
          </Text>
        </TouchableOpacity> */}
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
  welcomeSection: {
    alignItems: "center",
    marginBottom: 32,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  appTagline: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  featureCardsContainer: {
    flexDirection: "row",
    width: "100%",
  },
  featureCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
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
  form: {
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  eyeIcon: {
    paddingRight: 12,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  loginButton: {
    borderRadius: 8,
    overflow: "hidden",
  },
  loginButtonGradient: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  signupContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  noAccountText: {
    marginBottom: 12,
    fontSize: 14,
  },
  signupButtonsContainer: {
    width: "100%",
  },
  signupButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  signupText: {
    fontWeight: "500",
    fontSize: 14,
  },
  installButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  installText: {
    fontWeight: "500",
    fontSize: 14,
  },
  skipButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  skipButtonText: {
    fontWeight: "500",
  },
});

export default LoginScreen;