import api from "./api";
import { getStoredToken, getUserUUID } from "./postService";

// Types for chat rooms
export interface ChatRoom {
  id: string;
  name?: string; // For group chats
  username?: string; // For direct messages
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  distance: string;
  isGroup: boolean;
  groupName?: string;
  members?: string[];
  createdBy?: string;
  memberCount?: number;
  unreadCount?: number;
  lastMessageId?: string;
  lastMessageUserId?: string;
  isActive?: boolean;
  avatar?: string;
  description?: string;
}

export interface ChatRoomsApiResponse {
  group: any[];
  individual: any[];
}

export interface ChatRoomsResponse {
  data: ChatRoomsApiResponse;
}

// Types for chat messages
export interface ChatMessage {
  roomId: string;
  msgid: string;
  message: string;
  sender: string;
  media: any[];
  has_media: boolean;
  time: string;
  uuid: string;
  created_at: string;
  self_destruct_at: string;
  type: "sent" | "received";
}

export interface ChatMessagesResponse {
  status: string;
  data: ChatMessage[];
  requestId: string;
  location: {
    mode: string;
    city: string;
    district: string;
    country: string;
    latitude: string;
    longitude: string;
  };
}

export interface SendMessageResponse {
  status: string;
  data: string;
  record: {
    roomId: number;
    userId: number;
    messageId: number;
    uuid: string;
    media: any[];
  };
  requestId: string;
  location: {
    mode: string;
    city: string;
    district: string;
    country: string;
    latitude: string;
    longitude: string;
  };
}

// Chat service functions
export const chatService = {
  // Get chat rooms (both single and group chats)
  getChatRooms: async (): Promise<ChatRoomsResponse> => {
    try {
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      const response = await api.get("/chats/rooms", {
        params: {
          token: token,
          user_uuid: userUUID,
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get messages for a specific chat room
  getChatMessages: async (
    roomId: string,
    receiverId: string,
    roomType: "individual" | "group"
  ): Promise<ChatMessagesResponse> => {
    try {
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      const requestData = {
        roomId: roomId,
        receiverId: receiverId,
        room: roomType,
        token: token,
        userUUID: userUUID,
      };

      const response = await api.post("/chats/messages", requestData);

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Send a message to a chat room
  sendMessage: async (
    message: string,
    sender: string,
    receiver: string,
    type: "individual" | "group",
    roomId: string,
    images?: any[]
  ): Promise<SendMessageResponse> => {
    try {
      const token = await getStoredToken();
      const userUUID = await getUserUUID();
      const timestamp = Date.now().toString();
      const uuid =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      // If images are provided, use FormData
      if (images && images.length > 0) {
        const formData = new FormData();

        // Add text fields
        formData.append("message", message);
        formData.append("sender", sender);
        formData.append("receiver", receiver);
        formData.append("type", type);
        formData.append("roomId", roomId);
        formData.append("timestamp", timestamp);
        formData.append("token", token);
        formData.append("uuid", uuid);
        formData.append("userUUID", userUUID);

        // Add images
        images.forEach((image, index) => {
          const imageData = {
            uri: image.uri,
            type: "image/jpeg", // Default to jpeg
            name: image.fileName || `image_${index}.jpg`,
          } as any;

          formData.append("media[]", imageData);
        });

        const response = await api.post("/chats/send", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        return response.data;
      } else {
        // Text only message
        const requestData = {
          message: message,
          sender: sender,
          receiver: receiver,
          type: type,
          roomId: roomId,
          timestamp: timestamp,
          token: token,
          uuid: uuid,
          userUUID: userUUID,
        };

        const response = await api.post("/chats/send", requestData);

        return response.data;
      }
    } catch (error: any) {
      throw error;
    }
  },

  // Clear chat messages (keeps the chat in the list)
  clearChat: async (
    roomId: string,
    type: "individual" | "group"
  ): Promise<{ status: string; message: string }> => {
    try {
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      const response = await api.delete(`/chats/${roomId}`, {
        params: {
          token: token,
          user_uuid: userUUID,
          type: type,
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Remove user from chat (deletes the chat from user's list)
  removeFromChat: async (
    chatId: string
  ): Promise<{ status: string; message: string }> => {
    try {
      const token = await getStoredToken();
      const userUUID = await getUserUUID();

      const response = await api.delete(`/chats/remove/${chatId}`, {
        params: {
          token: token,
          uuid: userUUID,
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Search for users
  searchUsers: async (query: string): Promise<any[]> => {
    try {
      if (query.length < 2) {
        return []; // Return empty array if query is too short
      }

      const response = await api.get(`/users/search`, {
        params: {
          query: query,
        },
      });

      // The API response has the structure: { success: true, users: [...] }
      if (response.data.success && response.data.users) {
        return response.data.users;
      }

      return [];
    } catch (error) {
      return [];
    }
  },

  // Create a new group
  createGroup: async (groupName: string, description: string): Promise<any> => {
    try {
      const token = await getStoredToken();
      const userUUID = await getUserUUID();
      const newGroupId = Date.now().toString();

      // Create form data in the exact format the server expects
      const formData = new FormData();
      formData.append("newGroupInfo[name]", groupName);
      formData.append("newGroupInfo[description]", description);
      formData.append("newGroupInfo[members]", "0");
      formData.append("newGroupInfo[newGroupId]", newGroupId);
      formData.append("roomId", "0");
      formData.append("receiverId", "0");
      formData.append("room", "group");
      formData.append("token", token);
      formData.append("userUUID", userUUID);

      const response = await api.post("/chats/messages", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
