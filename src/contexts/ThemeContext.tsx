import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define the theme colors
export const DarkTheme = {
  background: "#121212",
  card: "#1E1E1E",
  text: "#F8F9FA",
  textSecondary: "#ADB5BD",
  textMuted: "#6c757d",
  primary: "#4361EE",
  border: "#2D2D2D",
  error: "#dc3545",
  warning: "#ffc107",
  success: "#28a745",
  icon: "#ADB5BD",
  headerBackground: "#121212",
  inputBackground: "#2D2D2D",
  statusBar: "light",
};

export const LightTheme = {
  background: "#F8F9FA",
  card: "#FFFFFF",
  text: "#212529",
  textSecondary: "#495057",
  textMuted: "#6c757d",
  primary: "#4361EE",
  border: "#DEE2E6",
  error: "#dc3545",
  warning: "#ffc107",
  success: "#28a745",
  icon: "#495057",
  headerBackground: "#FFFFFF",
  inputBackground: "#F1F3F5",
  statusBar: "dark",
};

// Theme context type
type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: typeof DarkTheme;
};

// Create the context with a default value
export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: true,
  toggleTheme: () => {},
  theme: DarkTheme,
});

// Theme provider props
type ThemeProviderProps = {
  children: React.ReactNode;
};

// Theme storage key
const THEME_STORAGE_KEY = "whispernet_theme_mode";

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from storage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme !== null) {
          setIsDarkMode(storedTheme === "dark");
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  // Toggle theme function
  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode ? "dark" : "light");
    } catch (error) {
    }
  };

  // Get current theme
  const theme = isDarkMode ? DarkTheme : LightTheme;

  // If still loading, return null or a loading indicator
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);
