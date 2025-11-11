import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const SignUpScreen = ({ navigation }: any) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { theme } = useTheme();

  const { signUp, continueAsGuest, isLoading } = useAuth();

  const handleSignUp = async () => {
    // Validate inputs
    if (!fullName || !email || !password || !confirmPassword) {
      const msg = "Please fill in all fields";
      setErrorMessage(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = "Passwords do not match";
      setErrorMessage(msg);
      return;
    }

    // Add password length validation
    if (password.length < 6) {
      const msg = "Password must be at least 6 characters long";
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
      const result = await signUp(fullName, email, password);

      // Show success message
      if (result && result.success) {
        Alert.alert(
          "Registration Successful",
          "Your account has been created successfully!",
          [{ text: "OK" }]
        );
      }
      // Only clear fields on successful signup (the code won't reach here if signup fails)
    } catch (error: any) {
      // Handle different error scenarios
      if (error.response) {
        // Check for "User already exists" error
        if (
          error.response.data &&
          (error.response.data.message === "User already exists." ||
            error.response.data.data === "User already exists.")
        ) {
          const msg =
            "This email is already registered. Please try logging in instead.";
          setErrorMessage(msg);
        } else if (error.response.status === 409) {
          const msg = "Email already exists";
          setErrorMessage(msg);
        } else if (error.response.data && error.response.data.message) {
          const msg = error.response.data.message;
          setErrorMessage(msg);
        } else if (error.response.data && error.response.data.data) {
          // Handle both string and object data formats
          const msg =
            typeof error.response.data.data === "string"
              ? error.response.data.data
              : Object.values(error.response.data.data).join(", ");
          setErrorMessage(msg);
        } else if (
          error.response.data &&
          typeof error.response.data === "string"
        ) {
          const msg = error.response.data;
          setErrorMessage(msg);
        } else {
          const msg = `Sign up failed (${error.response.status}). Please try again.`;
          setErrorMessage(msg);
        }
      } else if (error.request) {
        const msg = "Network error. Please check your connection.";
        setErrorMessage(msg);
      } else {
        const msg = error.message || "An error occurred. Please try again.";
        setErrorMessage(msg);
      }
    }
  };

  const handleLogin = () => {
    navigation.navigate("Login");
  };

  const handleSkip = async () => {
    try {
      await continueAsGuest();
    } catch (error) {
      setErrorMessage("Failed to continue as guest. Please try again.");
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
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          {/* Promotional Section */}
          <View style={styles.promotionalSection}>
            <View style={[styles.promoIconContainer, { backgroundColor: theme.primary }]}>
              <Ionicons name="person-add-outline" size={32} color="#fff" />
            </View>
            <Text style={[styles.promoTitle, { color: theme.text }]}>
              Join <Text style={{ color: '#90BE6D' }}>TalkLowKey</Text>
            </Text>
            <Text style={[styles.promoDescription, { color: theme.textSecondary }]}>
              Connect with your community, share your thoughts, and build meaningful conversations in a safe environment. Start your journey with secure, private messaging.
            </Text>
            
            {/* Feature Cards */}
            {/* <View style={styles.featureCardsContainer}>
              <View style={[styles.featureCard, { backgroundColor: theme.card, marginRight: 6 }]}>
                <View style={[styles.featureIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#4361EE" />
                </View>
                <Text style={[styles.featureTitle, { color: theme.text }]}>
                  Tags
                </Text>
                <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                  Add tags to your posts to make them more discoverable.
                </Text>
              </View>
              
              <View style={[styles.featureCard, { backgroundColor: theme.card, marginLeft: 6 }]}>
                <View style={[styles.featureIcon, { backgroundColor: '#F3E5F5' }]}>
                  <Ionicons name="flash-outline" size={20} color="#9C27B0" />
                </View>
                <Text style={[styles.featureTitle, { color: theme.text }]}>
                  Instant Setup
                </Text>
                <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                  No need to wait for approval, your account is ready to use immediately.
                </Text>
              </View>
            </View> */}
          </View>

          {/* Header */}
          {/* <View style={styles.header}>
            <View style={[styles.headerIconContainer, { backgroundColor: theme.primary }]}>
              <Ionicons name="person-add-outline" size={24} color="#fff" />
            </View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Create Account
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: theme.textSecondary }]}
            >
              Join our community today
            </Text>
          </View> */}

          {/* Form */}
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
                {errorMessage.includes("already registered") && (
                  <TouchableOpacity
                    onPress={handleLogin}
                    style={[
                      styles.errorActionButton,
                      { borderColor: theme.primary, borderWidth: 1 },
                    ]}
                  >
                    <Text
                      style={[styles.errorActionText, { color: theme.primary }]}
                    >
                      Log In
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <View style={[styles.labelDot, { backgroundColor: '#90BE6D' }]} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Name
                </Text>
              </View>
              <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
                <Ionicons name="person-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.input,
                    { color: theme.text },
                  ]}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <View style={[styles.labelDot, { backgroundColor: '#4361EE' }]} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Email Address
                </Text>
              </View>
              <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
                <Ionicons name="mail-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
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
                  placeholder="Create a strong password"
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

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <View style={[styles.labelDot, { backgroundColor: '#FF6B35' }]} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Confirm Password
                </Text>
              </View>
              <View
                style={[
                  styles.passwordContainer,
                  { backgroundColor: theme.card },
                ]}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showConfirmPassword}
                  style={[styles.passwordInput, { color: theme.text }]}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye" : "eye-off"}
                    size={24}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSignUp}
              disabled={isLoading}
              style={[
                styles.signupButton,
                isLoading && styles.disabledButton,
              ]}
            >
              <LinearGradient
                colors={['#90BE6D', '#4361EE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signupButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="person-add-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.signupButtonText}>Create Your Account</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Terms and Conditions */}
          {/* <Text style={[styles.termsText, { color: theme.textSecondary }]}>
            By signing up, you agree to our{" "}
            <Text style={[styles.linkText, { color: theme.primary }]}>
              Terms of Service
            </Text>{" "}
            and{" "}
            <Text style={[styles.linkText, { color: theme.primary }]}>
              Privacy Policy
            </Text>
          </Text> */}

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text
              style={[styles.haveAccountText, { color: theme.textSecondary }]}
            >
              Already have an account?{" "}
            </Text>
            <TouchableOpacity 
              onPress={handleLogin}
              style={[styles.loginButton, { borderColor: theme.border }]}
            >
              <Ionicons name="key-outline" size={18} color={theme.text} style={{ marginRight: 8 }} />
              <Text style={[styles.loginText, { color: theme.text }]}>
                Sign In to Your Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Skip Button */}
          {/* <TouchableOpacity
            onPress={handleSkip}
            disabled={isLoading}
            style={[
              styles.skipButton,
              { borderColor: theme.border },
              isLoading && styles.disabledButton,
            ]}
          >
            <Text style={[styles.skipButtonText, { color: theme.text }]}>
              Skip & Use Anonymously
            </Text>
          </TouchableOpacity> */}
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
    marginBottom: 2,
  },
  featureCardsContainer: {
    flexDirection: "row",
  },
  featureCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
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
    marginTop: 8,
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
  signupButton: {
    borderRadius: 8,
    marginTop: 8,
    overflow: "hidden",
  },
  signupButtonGradient: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  signupButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  termsText: {
    textAlign: "center",
    fontSize: 14,
    marginBottom: 24,
  },
  linkText: {
    fontWeight: "500",
  },
  loginContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  haveAccountText: {
    marginBottom: 12,
    fontSize: 14,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  loginText: {
    fontWeight: "500",
    fontSize: 14,
  },
  skipButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 24,
  },
  skipButtonText: {
    fontWeight: "500",
  },
  errorActionButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  errorActionText: {
    fontWeight: "bold",
  },
});

export default SignUpScreen;
