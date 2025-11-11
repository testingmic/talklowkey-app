import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useData } from "../../contexts/DataContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { profileService } from "../../services/profileService";
import * as ImagePicker from "expo-image-picker";

type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
};

type EditProfileScreenNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  "EditProfile"
>;

type EditProfileScreenProps = {
  navigation: EditProfileScreenNavigationProp;
};

const EditProfileScreen = ({ navigation }: EditProfileScreenProps) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { profileData, isLoadingProfile, refreshProfileData } = useData();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [originalProfileImage, setOriginalProfileImage] = useState<
    string | null
  >(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use preloaded data loading state - only show loading if no data is available
  const isLoading = isLoadingProfile && !profileData;

  // Validate image format based on file extension or MIME type
  const validateImageFormat = (uri: string, fileName?: string | null) => {
    const supportedFormats = ["jpg", "jpeg", "png", "gif", "webp"];

    // Get file extension from fileName or URI
    let extension = "";
    if (fileName) {
      extension = fileName.split(".").pop()?.toLowerCase() || "";
    } else {
      extension = uri.split(".").pop()?.toLowerCase() || "";
    }

    return supportedFormats.includes(extension);
  };

  // Use preloaded profile data
  useEffect(() => {
    if (profileData && !user?.isAnonymous) {
      setFullName(profileData.full_name || "");
      setUsername(profileData.username || "");
      setEmail(profileData.email || "");
      setGender(profileData.gender || "");
      setLocation(profileData.location || "");
      setProfileImage(profileData.profile_image || null);
      setOriginalProfileImage(profileData.profile_image || null);
      setUserId(profileData.user_id || null);
    }
  }, [profileData, user]);

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Username cannot be empty");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Error", "Email cannot be empty");
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if we have the required user ID
      if (!userId) {
        Alert.alert(
          "Error",
          "User ID not found. Please try reloading the profile."
        );
        return;
      }

      // Build update data, filtering out empty/undefined values (NO profile_image)
      const updateData: any = {
        user_id: userId,
        record_id: userId, // Same as user_id
        name: fullName.trim(), // Changed from "full_name" to "name"
        username: username.trim(),
        email: email.trim(),
      };

      // Only include optional fields if they have values
      if (gender && gender.trim()) {
        updateData.gender = gender.trim();
      }
      if (location && location.trim()) {
        updateData.location = location.trim();
      }

      // Step 1: Update profile data (without image)
      const response = await profileService.updateProfile(updateData);

      // Step 2: Upload profile image separately if it has changed
      const imageHasChanged = profileImage !== originalProfileImage;
      if (
        imageHasChanged &&
        profileImage &&
        (profileImage.startsWith("data:") || profileImage.startsWith("file://"))
      ) {
        try {
          const imageResponse = await profileService.updateProfileImage(
            profileImage
          );
        } catch (imageError: any) {
          const errorMessage = imageError.message || "Unknown error occurred";
          Alert.alert(
            "Image Upload Failed",
            errorMessage.includes("Unsupported image format")
              ? errorMessage
              : "Profile updated but image upload failed. Please try uploading a JPG, PNG, GIF, or WebP image."
          );
          return;
        }
      }

      // Refresh preloaded data after successful update
      await refreshProfileData();

      Alert.alert("Success", "Profile updated successfully", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadPhoto = () => {
    Alert.alert(
      "Upload Photo",
      "Choose a photo source",
      [
        {
          text: "Camera",
          onPress: () => pickImageFromCamera(),
        },
        {
          text: "Gallery",
          onPress: () => pickImageFromGallery(),
        },
        {
          text: "Remove Photo",
          onPress: () => setProfileImage(null),
          style: "destructive",
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const pickImageFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Camera permission is required to take photos"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const isValidFormat = validateImageFormat(asset.uri, asset.fileName);

        if (isValidFormat) {
          setProfileImage(asset.uri);
        } else {
          Alert.alert(
            "Unsupported Format",
            "Please use JPG, PNG, GIF, or WebP images only.",
            [{ text: "OK" }]
          );
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Photo library permission is required to select photos"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const isValidFormat = validateImageFormat(asset.uri, asset.fileName);

        if (isValidFormat) {
          setProfileImage(asset.uri);
        } else {
          Alert.alert(
            "Unsupported Format",
            "Please use JPG, PNG, GIF, or WebP images only. Some formats like HEIC are not supported.",
            [{ text: "OK" }]
          );
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select photo");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoidingView}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Edit Profile
          </Text>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: theme.primary },
              isSubmitting && [
                styles.disabledButton,
                { backgroundColor: theme.border },
              ],
            ]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text
                style={[styles.loadingText, { color: theme.textSecondary }]}
              >
                Loading profile...
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.photoSection}>
                <View
                  style={[
                    styles.avatarContainer,
                    {
                      backgroundColor: profileImage
                        ? "transparent"
                        : theme.primary,
                    },
                  ]}
                >
                  {profileImage ? (
                    <Image
                      source={{
                        uri: (() => {
                          const imageUrl =
                            profileImage.startsWith("http") ||
                            profileImage.startsWith("data:") ||
                            profileImage.startsWith("file://")
                              ? profileImage
                              : `https://talklowkey.com/${profileImage}`;
                          return imageUrl;
                        })(),
                      }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {fullName || username
                        ? (fullName || username)[0].toUpperCase()
                        : "U"}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.uploadButton, { backgroundColor: theme.card }]}
                  onPress={handleUploadPhoto}
                >
                  <Text
                    style={[styles.uploadButtonText, { color: theme.text }]}
                  >
                    Change Photo
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Full Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.card, color: theme.text },
                  ]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Username
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.card, color: theme.text },
                  ]}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Email
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.card, color: theme.text },
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter email"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Gender (Optional)
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownInput,
                    { backgroundColor: theme.card },
                  ]}
                  onPress={() => {
                    Alert.alert(
                      "Select Gender",
                      "",
                      [
                        {
                          text: "Male",
                          onPress: () => setGender("Male"),
                        },
                        {
                          text: "Female",
                          onPress: () => setGender("Female"),
                        },
                        {
                          text: "Non-binary",
                          onPress: () => setGender("Non-binary"),
                        },
                        {
                          text: "Prefer not to say",
                          onPress: () => setGender("Prefer not to say"),
                        },
                        {
                          text: "Cancel",
                          style: "cancel",
                        },
                      ],
                      { cancelable: true }
                    );
                  }}
                >
                  <Text
                    style={
                      gender
                        ? [styles.dropdownText, { color: theme.text }]
                        : [
                            styles.dropdownPlaceholder,
                            { color: theme.textMuted },
                          ]
                    }
                  >
                    {gender || "Select gender"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={theme.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Location (Optional)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.card, color: theme.text },
                  ]}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Enter location"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  disabledButton: {},
  saveButtonText: {
    color: "white",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  photoSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 40,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  uploadButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  uploadButtonText: {
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  dropdownInput: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 16,
  },
  dropdownPlaceholder: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
});

export default EditProfileScreen;
