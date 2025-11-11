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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
        {/* Logo and App Name */}
        <View style={[styles.logoContainer, { backgroundColor: '#e6e3fe', padding: 16, borderRadius: 16 }]}>
          <View style={[styles.logoIcon, { backgroundColor: theme.primary }]}>
            <Ionicons name="chatbubble-outline" size={40} color="#fff" />
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>
            TalkLowKey
          </Text>
          <Text style={[styles.appTagline, { color: '#000000' }]}>
          Share thoughts, ideas, and experiences in a safe environment where your privacy is our priority. 
          Connect with your community through secure, private messaging.
          </Text>
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
              { backgroundColor: theme.primary },
              isButtonLoading && styles.disabledButton,
            ]}
          >
            {isButtonLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Sign Up Link */}
        <View style={styles.signupContainer}>
          <Text style={[styles.noAccountText, { color: theme.textSecondary }]}>
            Don't have an account?{" "}
          </Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={[styles.signupText, { color: theme.primary }]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[{ 
            backgroundColor: '#fff', padding: 16, 
            borderRadius: 16, alignItems: 'center', 
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#cccccc',
          }]}>
          <Text style={[{ color: '#000000', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }]}>
            Group & Individual
          </Text>
          <Text style={[{ color: '#000000', alignSelf: 'center', alignItems: 'center', textAlign: 'center' }]}>
            Chat one-on-one or create group conversations with your friends, family, and community.
          </Text>
        </View>

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
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  appTagline: {
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  loginButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
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
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  noAccountText: {},
  signupText: {
    fontWeight: "bold",
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