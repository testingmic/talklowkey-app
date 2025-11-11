import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Generate a UUID
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// UUID management functions
export const uuidManager = {
  // Generate and save a new UUID (only called during account creation)
  generateAndSaveUUID: async (): Promise<string> => {
    try {
      const newUUID = generateUUID();
      await AsyncStorage.setItem("user_uuid", newUUID);
      return newUUID;
    } catch (error) {
      throw error;
    }
  },

  // Get existing UUID from storage
  getUUID: async (): Promise<string | null> => {
    try {
      const uuid = await AsyncStorage.getItem("user_uuid");
      return uuid;
    } catch (error) {
      return null;
    }
  },

  // Check if UUID exists
  hasUUID: async (): Promise<boolean> => {
    try {
      const uuid = await AsyncStorage.getItem("user_uuid");
      return !!uuid;
    } catch (error) {
      return false;
    }
  },
};

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  full_name: string;
  email: string;
  password: string;
  password_confirm: string;
}

export interface AuthResponse {
  token: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    username?: string;
  };
  data?: {
    user_id: string;
    email: string;
    full_name?: string;
    username?: string;
    token: string;
  };
  success?: boolean;
  message?: string;
}

// Auth service functions
export const authService = {
  // Login user
  login: async (credentials: LoginCredentials) => {
    try {

      const response = await api.post("/auth/login", credentials);

      // Extract user data and token from the response
      const responseData = response.data;
      const userData = responseData.data || responseData.user || {};
      const token = responseData.data?.token || responseData.token;

      if (token) {
        // Save the token (this will persist until logout)
        await AsyncStorage.setItem("auth_token", token);

        // Save user data
        await AsyncStorage.setItem(
          "user_data",
          JSON.stringify(userData || { email: credentials.email })
        );

        // Check if user already has a UUID, if not generate one
        // (This handles users who had accounts before UUID implementation)
        const hasUUID = await uuidManager.hasUUID();
        if (!hasUUID) {
          await uuidManager.generateAndSaveUUID();
        }
      } else {
      }

      return responseData;
    } catch (error) {
      throw error;
    }
  },

  // Register new user
  signup: async (credentials: SignupCredentials) => {
    try {

      const response = await api.post("/auth/register", credentials);

      // Extract user data and token from the response
      const responseData = response.data;
      const userData = responseData.data || responseData.user || {};
      const token = responseData.data?.token || responseData.token;

      // Store auth token and user data if registration also logs in the user
      if (token) {
        // Save the token (this will persist until logout)
        await AsyncStorage.setItem("auth_token", token);

        // Save user data
        await AsyncStorage.setItem(
          "user_data",
          JSON.stringify(
            userData || {
              email: credentials.email,
              full_name: credentials.full_name,
            }
          )
        );

        // Generate and save UUID for new account
        const newUUID = await uuidManager.generateAndSaveUUID();
      } 

      return responseData;
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {

      // Only remove auth token and user data, but keep the UUID
      await AsyncStorage.multiRemove(["auth_token", "user_data"]);

      return true;
    } catch (error) {
      throw error;
    }
  },

  // Check if user is logged in
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      return !!token;
    } catch (error) {
      return false;
    }
  },

  // Get current user data
  getCurrentUser: async () => {
    try {
      const userData = await AsyncStorage.getItem("user_data");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  },

  // Get current token
  getCurrentToken: async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      return token;
    } catch (error) {
      return null;
    }
  },

  // Check if user has valid session (token + user data)
  hasValidSession: async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      const userData = await AsyncStorage.getItem("user_data");
      const hasSession = !!(token && userData);
      return hasSession;
    } catch (error) {
      return false;
    }
  },

  // Request password reset
  forgotPassword: async (email: string) => {
    try {
      const response = await api.post("/auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
