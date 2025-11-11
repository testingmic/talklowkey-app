import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppConfig from "../constants/AppConfig";
import {
  authService,
  LoginCredentials,
  SignupCredentials,
} from "../services/authService";

// Define types for the authentication context
type User = {
  id?: string;
  username?: string;
  email?: string;
  isAnonymous: boolean;
  karma?: number;
} | null;

type AuthContextType = {
  user: User;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (
    username: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean }>;
  logout: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean }>;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session when app loads
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (!AppConfig.auth.persistAuth) {
          // Clear any existing authentication data if persistence is disabled
          await AsyncStorage.multiRemove(["auth_token", "user_data"]);
          setUser(null);
          setIsAuthenticated(false);
        } else {
          // Check for existing authentication data if persistence is enabled
          const isAuth = await authService.isAuthenticated();
          if (isAuth) {
            const userData = await authService.getCurrentUser();
            if (userData) {
              setUser({
                id: userData.id || userData.user_id,
                username: userData.username || userData.full_name,
                email: userData.email,
                isAnonymous: false,
                karma: userData.karma || 0,
              });
              setIsAuthenticated(true);
            }
          }
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function using auth service
  const login = async (email: string, password: string) => {
    try {
      // Validate email format before proceeding
      if (!email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }

      const credentials: LoginCredentials = { email, password };
      const response = await authService.login(credentials);

      // Extract the user data from the response
      // The API response has data property that contains user info
      const userData = response.data || response.user || {};

      // Handle the response format from the API
      const loggedInUser = {
        id: userData.user_id || userData.id || "user_id",
        username:
          userData.username ||
          userData.full_name ||
          (email.includes("@") ? email.split("@")[0] : email),
        email: userData.email || email,
        isAnonymous: false,
        karma: userData.karma || 0,
      };

      setUser(loggedInUser);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  // Update the signUp function:
  const signUp = async (username: string, email: string, password: string) => {
    try {
      // Validate email format before proceeding
      if (!email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }

      const credentials: SignupCredentials = {
        full_name: username,
        email,
        password,
        password_confirm: password,
      };

      const response = await authService.signup(credentials);

      // Extract the user data from the response
      const userData = response.data || response.user || {};

      // Handle the response format from the API
      const newUser = {
        id: userData.user_id || userData.id || "user_id",
        username: userData.username || userData.full_name || username,
        email: userData.email || email,
        isAnonymous: false,
        karma: userData.karma || 0,
      };

      setUser(newUser);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  // Continue as anonymous guest
  const continueAsGuest = async () => {
    setIsLoading(true);

    try {
      // Generate a unique anonymous ID
      const anonymousId = `anon_${Math.random().toString(36).substring(2, 15)}`;

      const anonymousUser = {
        id: anonymousId,
        isAnonymous: true,
        karma: 0,
      };

      setUser(anonymousUser);
      setIsAuthenticated(true);

      // Store anonymous user data in AsyncStorage if persistence is enabled
      if (AppConfig.auth.persistAuth) {
        await AsyncStorage.setItem("user_data", JSON.stringify(anonymousUser));
      }
    } catch (error) {
      throw new Error("Anonymous login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function using auth service
  const logout = async () => {
    setIsLoading(true);

    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password function using auth service
  const resetPassword = async (email: string) => {
    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      return { success: true };
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        signUp,
        logout,
        continueAsGuest,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
