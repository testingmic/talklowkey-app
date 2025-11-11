import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
// import { AppConfig } from "../constants/AppConfig";

// Using the provided base endpoint
const API_URL = "https://talklowkey.com/api";

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  async (config) => {
    // Get token from storage
    const token = await AsyncStorage.getItem("auth_token");

    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      // Clear auth token and redirect to login
      await AsyncStorage.removeItem("auth_token");
      // You might want to navigate to login screen here
    }

    return Promise.reject(error);
  }
);

// Location service function
export const locationService = {
  // Get location from coordinates using the API endpoint
  getLocationFromCoordinates: async (
    latitude: number | string,
    longitude: number | string
  ) => {
    try {
      const response = await api.get("/users/location", {
        params: {
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api;
