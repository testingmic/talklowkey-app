import api from "./api";
import { authService, uuidManager } from "./authService";

// Helper function to get authentication parameters
const getAuthParams = async () => {
  const token = await authService.getCurrentToken();
  const userUUID = await uuidManager.getUUID();
  return { token, userUUID };
};

// Types
export interface Notification {
  id: string;
  type: "like" | "comment" | "mention" | "system";
  message: string;
  timestamp: string;
  isRead: boolean;
  relatedPostId?: string;
  relatedCommentId?: string;
}

// Notification service functions
export const notificationService = {
  // Get all notifications
  getNotifications: async () => {
    try {
      const { token, userUUID } = await getAuthParams();
      const response = await api.get("/notifications", {
        params: { token, userUUID },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    try {
      const { token, userUUID } = await getAuthParams();
      const response = await api.put(`/notifications/${notificationId}/read`, {
        token,
        userUUID,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const { token, userUUID } = await getAuthParams();
      const response = await api.put("/notifications/read-all", {
        token,
        userUUID,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a notification
  deleteNotification: async (notificationId: string) => {
    try {
      const { token, userUUID } = await getAuthParams();
      const response = await api.delete(`/notifications/${notificationId}`, {
        params: { token, userUUID },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get unread notification count
  getUnreadCount: async () => {
    try {
      const { token, userUUID } = await getAuthParams();
      const response = await api.get("/notifications/unread-count", {
        params: { token, userUUID },
      });
      return response.data.count;
    } catch (error) {
      return 0; // Default to 0 on error
    }
  },
};
