import api from "./api";
import { authService, uuidManager } from "./authService";

// Helper function to get authentication parameters
const getAuthParams = async () => {
  const token = await authService.getCurrentToken();
  const userUUID = await uuidManager.getUUID();
  return { token, userUUID };
};

// Types
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  bio?: string;
  karma: number;
  joinedDate: string;
  postCount: number;
  commentCount: number;
}

export interface UpdateProfileRequest {
  user_id?: string;
  record_id?: string;
  username?: string;
  full_name?: string;
  email?: string;
  gender?: string;
  location?: string;
  bio?: string;
  profile_image?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Profile service functions
export const profileService = {
  // Get current user profile
  getCurrentProfile: async () => {
    try {
      const { token, userUUID } = await getAuthParams();

      const response = await api.get("/users/profile", {
        params: { token, uuid: userUUID },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData: UpdateProfileRequest) => {
    try {
      const { token, userUUID } = await getAuthParams();

      // Extract user_id from profileData or use userUUID as fallback
      const userId = profileData.user_id || userUUID;

      const requestPayload = {
        ...profileData,
        token,
        uuid: userUUID,
      };

      // Append user_id to the URL path as requested
      const response = await api.put(`/users/update/${userId}`, requestPayload);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Update profile image (separate endpoint with FormData)
  updateProfileImage: async (imageData: string) => {
    try {
      const { token, userUUID } = await getAuthParams();

      // Create FormData for binary upload
      const formData = new FormData();

      // Handle different image data types
      if (imageData.startsWith("data:")) {
        // Extract MIME type from data URL
        const mimeMatch = imageData.match(/data:([^;]+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

        const response = await fetch(imageData);
        const blob = await response.blob();

        // Create a new blob with the correct MIME type if needed
        const properBlob = new Blob([blob], { type: mimeType });

        // Determine file extension based on MIME type
        let filename = "profile.jpg";
        if (mimeType.includes("png")) filename = "profile.png";
        else if (mimeType.includes("gif")) filename = "profile.gif";
        else if (mimeType.includes("webp")) filename = "profile.webp";
        formData.append("profile_image", properBlob, filename);
      } else if (imageData.startsWith("file://")) {
        // Create file object from URI for React Native
        const fileExtension =
          imageData.split(".").pop()?.toLowerCase() || "jpg";

        // Validate supported formats
        const supportedFormats = ["jpg", "jpeg", "png", "gif", "webp"];
        if (!supportedFormats.includes(fileExtension)) {
          throw new Error(
            `Unsupported image format: ${fileExtension}. Please use JPG, PNG, GIF, or WebP.`
          );
        }

        const mimeType = `image/${
          fileExtension === "jpg" ? "jpeg" : fileExtension
        }`;
        const filename = `profile.${fileExtension}`;

        // For React Native, we need to use the file URI directly
        formData.append("profile_image", {
          uri: imageData,
          type: mimeType,
          name: filename,
        } as any);
      } else {
        formData.append("profile_image", imageData);
      }

      // Add token and uuid to FormData
      formData.append("token", token || "");
      formData.append("uuid", userUUID || "");

      const response = await api.post("/users/update", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData: ChangePasswordRequest) => {
    try {
      const { token, userUUID } = await getAuthParams();
      const response = await api.put("/profile/password", {
        ...passwordData,
        token,
        userUUID,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user's posts
  getUserPosts: async () => {
    try {
      const { token, userUUID } = await getAuthParams();
      const response = await api.get("/profile/posts", {
        params: { token, userUUID },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user's comments
  getUserComments: async () => {
    try {
      const { token, userUUID } = await getAuthParams();
      const response = await api.get("/profile/comments", {
        params: { token, userUUID },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete account
  deleteAccount: async () => {
    try {
      const { token, userUUID } = await getAuthParams();
      const response = await api.delete("/profile", {
        params: { token, userUUID },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user account settings
  getUserSettings: async () => {
    try {
      const { token, userUUID } = await getAuthParams();

      const response = await api.get("/users/settings", {
        params: { token, uuid: userUUID },
      });

      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Update user setting
  updateUserSetting: async (setting: string, value: string) => {
    try {
      const { token, userUUID } = await getAuthParams();

      const requestPayload = {
        setting,
        value,
        token,
        uuid: userUUID,
      };
      const response = await api.post("/users/update", requestPayload);

      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};
