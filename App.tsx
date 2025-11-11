import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/contexts/AuthContext";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";
import { DataProvider } from "./src/contexts/DataContext";
import AppNavigator from "./src/navigation/AppNavigator";

// StatusBar component that adapts to the current theme
const ThemedApp = () => {
  const { theme } = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar as any} />
      <AppNavigator />
    </>
  );
};

// Main app component
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DataProvider>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
        </DataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
