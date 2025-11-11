import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";

export const useAuthDataSync = () => {
  const { user, isAuthenticated } = useAuth();
  const { loadAllData, clearAllData } = useData();

  useEffect(() => {
    const handleAuthChange = async () => {
      if (isAuthenticated && user && !user.isAnonymous) {
        // User logged in (not anonymous) - load all data
        await loadAllData();
      } else if (!isAuthenticated) {
        // User logged out - clear all data
        clearAllData();
      }
      // For anonymous users, we don't load personal data
    };

    handleAuthChange();
  }, [isAuthenticated, user, loadAllData, clearAllData]);

  return { user, isAuthenticated };
};
