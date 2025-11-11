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

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Create Account
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: theme.textSecondary }]}
            >
              Join the community anonymously
            </Text>
          </View>

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
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Full Name
              </Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.input,
                  { backgroundColor: theme.card, color: theme.text },
                ]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
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

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Password
              </Text>
              <View
                style={[
                  styles.passwordContainer,
                  { backgroundColor: theme.card },
                ]}
              >
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
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
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Confirm Password
              </Text>
              <View
                style={[
                  styles.passwordContainer,
                  { backgroundColor: theme.card },
                ]}
              >
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
                { backgroundColor: theme.primary },
                isLoading && styles.disabledButton,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Terms and Conditions */}
          <Text style={[styles.termsText, { color: theme.textSecondary }]}>
            By signing up, you agree to our{" "}
            <Text style={[styles.linkText, { color: theme.primary }]}>
              Terms of Service
            </Text>{" "}
            and{" "}
            <Text style={[styles.linkText, { color: theme.primary }]}>
              Privacy Policy
            </Text>
          </Text>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text
              style={[styles.haveAccountText, { color: theme.textSecondary }]}
            >
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={[styles.loginText, { color: theme.primary }]}>
                Log In
              </Text>
            </TouchableOpacity>
          </View>

          {/* Skip Button */}
          <TouchableOpacity
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
          </TouchableOpacity>
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
    marginBottom: 16,
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
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
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
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
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  haveAccountText: {},
  loginText: {
    fontWeight: "bold",
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
