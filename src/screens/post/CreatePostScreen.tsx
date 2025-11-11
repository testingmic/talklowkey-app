import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { postService, MediaFile } from "../../services/postService";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getCityFromCoordinates,
  getLocationFromCoordinates,
} from "../../utils/locationUtils";

// Define media type
type MediaType = "image" | "video";

// Media item interface
interface MediaItem {
  uri: string;
  type: MediaType;
  thumbnailUri?: string; // For videos
}

// Location detection interface
interface DetectedLocation {
  city: string;
  country?: string;
}

const MAX_CHARS = 300;
const MAX_MEDIA_ITEMS = 4;

const CreatePostScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [postText, setPostText] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<DetectedLocation>({
    city: "Detecting location...",
    country: "",
  });

  // Request permissions and detect location when component mounts
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== "granted" || libraryStatus !== "granted") {
        Alert.alert(
          "Permissions Required",
          "Please grant camera and media library permissions to attach photos and videos.",
          [{ text: "OK" }]
        );
      }

      // Detect current location
      detectCurrentLocation();
    })();
  }, []);

  // Function to detect current location
  const detectCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = location.coords;

        // Use reverse geocoding to get city and country
        const result = await getLocationFromCoordinates(latitude, longitude);

        setDetectedLocation({
          city: result.city,
          country: result.country,
        });
      } else {
        // If location permission not granted, try to get location from server using default coordinates
        try {
          const response = await postService.getNearbyPosts(
            "0",
            "0",
            1,
            1,
            100
          );
          if (response.location) {
            setDetectedLocation({
              city: response.location.city,
              country: response.location.country,
            });
          } else {
            setDetectedLocation({
              city: "Location not available",
              country: "",
            });
          }
        } catch (error) {
          setDetectedLocation({
            city: "Location not available",
            country: "",
          });
        }
      }
    } catch (error) {
      // If all else fails, try to get location from server using default coordinates
      try {
        const response = await postService.getNearbyPosts("0", "0", 1, 1, 100);
        if (response.location) {
          setDetectedLocation({
            city: response.location.city,
            country: response.location.country,
          });
        } else {
          setDetectedLocation({
            city: "Location not available",
            country: "",
          });
        }
      } catch (serverError) {
        setDetectedLocation({
          city: "Location not available",
          country: "",
        });
      }
    }
  };

  // Generate thumbnail for video
  const generateThumbnail = async (videoUri: string): Promise<string> => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 1000,
      });
      return uri;
    } catch (e) {
      return "";
    }
  };

  // Handle image picking from camera
  const handleTakePhoto = async () => {
    if (mediaItems.length >= MAX_MEDIA_ITEMS) {
      Alert.alert(
        "Limit Reached",
        `You can only attach up to ${MAX_MEDIA_ITEMS} media items.`
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newMediaItem: MediaItem = {
          uri: result.assets[0].uri,
          type: "image",
        };
        setMediaItems([...mediaItems, newMediaItem]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  // Handle video recording
  const handleRecordVideo = async () => {
    if (mediaItems.length >= MAX_MEDIA_ITEMS) {
      Alert.alert(
        "Limit Reached",
        `You can only attach up to ${MAX_MEDIA_ITEMS} media items.`
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const thumbnailUri = await generateThumbnail(result.assets[0].uri);

        const newMediaItem: MediaItem = {
          uri: result.assets[0].uri,
          type: "video",
          thumbnailUri,
        };
        setMediaItems([...mediaItems, newMediaItem]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to record video. Please try again.");
    }
  };

  // Handle picking from gallery
  const handlePickFromGallery = async () => {
    if (mediaItems.length >= MAX_MEDIA_ITEMS) {
      Alert.alert(
        "Limit Reached",
        `You can only attach up to ${MAX_MEDIA_ITEMS} media items.`
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: MAX_MEDIA_ITEMS - mediaItems.length,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newItems: MediaItem[] = await Promise.all(
          result.assets.map(async (asset) => {
            const isVideo =
              asset.uri.endsWith(".mp4") || asset.uri.endsWith(".mov");
            let thumbnailUri;

            if (isVideo) {
              thumbnailUri = await generateThumbnail(asset.uri);
            }

            return {
              uri: asset.uri,
              type: isVideo ? "video" : "image",
              thumbnailUri,
            };
          })
        );

        // Check if adding these would exceed the limit
        if (mediaItems.length + newItems.length > MAX_MEDIA_ITEMS) {
          Alert.alert(
            "Limit Exceeded",
            `You can only attach up to ${MAX_MEDIA_ITEMS} media items.`
          );
          // Only add up to the limit
          const itemsToAdd = newItems.slice(
            0,
            MAX_MEDIA_ITEMS - mediaItems.length
          );
          setMediaItems([...mediaItems, ...itemsToAdd]);
        } else {
          setMediaItems([...mediaItems, ...newItems]);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick from gallery. Please try again.");
    }
  };

  // Remove media item
  const handleRemoveMedia = (index: number) => {
    const updatedMediaItems = [...mediaItems];
    updatedMediaItems.splice(index, 1);
    setMediaItems(updatedMediaItems);
  };

  // Handle post submission
  const handleSubmitPost = async () => {
    if (!postText.trim() && mediaItems.length === 0) {
      Alert.alert("Empty Post", "Please add text or media to your post.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current location
      let latitude = 0;
      let longitude = 0;

      try {
        // Request location permission
        let { status } = await Location.requestForegroundPermissionsAsync();

        if (status === "granted") {
          // Get current position
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
        }
      } catch (locationError) {
        // console.log("📍 Failed to get location, using default coordinates:", locationError);
      }

      // Prepare media files for upload
      const mediaFiles: MediaFile[] = mediaItems.map((item, index) => ({
        uri: item.uri,
        type: item.type === "image" ? "image/jpeg" : "video/mp4",
        name: `media_${index}.${item.type === "image" ? "jpg" : "mp4"}`,
      }));

      // Create post data
      const postData = {
        content: postText.trim(),
        latitude,
        longitude,
        isAnonymous: false,
        mediaFiles: mediaFiles.length > 0 ? mediaFiles : undefined,
      };

      // Call the API
      const response = await postService.createPost(postData);

      if (response.status === "success") {
        // Create a formatted post object for immediate UI update
        let displayLocation =
          response.record.city || response.location?.city || "Current Location";

        // If city is "Unknown" and we have coordinates, try reverse geocoding
        if (
          displayLocation === "Unknown" ||
          displayLocation === "Current Location"
        ) {
          try {
            const reverseGeocodedCity = await getCityFromCoordinates(
              latitude,
              longitude
            );
            displayLocation = reverseGeocodedCity;
          } catch (error) {
            // Keep the original location if reverse geocoding fails
          }
        }

        const newPost = {
          id: response.record.post_id,
          text: response.record.content,
          username: response.record.username,
          timestamp: response.record.ago,
          upvotes: parseInt(response.record.upvotes) || 0,
          downvotes: parseInt(response.record.downvotes) || 0,
          commentCount: parseInt(response.record.comments_count) || 0,
          distance: displayLocation,
          latitude: latitude,
          longitude: longitude,
          isUserPost: response.record.manage?.delete === true,
          profile_image: response.record.profile_image
            ? `https://talklowkey.com/${response.record.profile_image}`
            : null,
          has_media: response.record.has_media || false,
          post_media: response.record.post_media,
          media_types: response.record.media_types || [],
          manage: response.record.manage || {
            delete: false,
            report: true,
            save: true,
            bookmarked: false,
          },
        };

        Alert.alert("Post Successful", "Your post has been published!", [
          {
            text: "OK",
            onPress: async () => {
              // Store the new post temporarily for HomeScreen to pick up
              await AsyncStorage.setItem(
                "tempNewPost",
                JSON.stringify(newPost)
              );

              // Reset form and navigate back
              setPostText("");
              setMediaItems([]);
              navigation.goBack();
            },
          },
        ]);
      } else {
        throw new Error("Post creation failed");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to create post. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render media item
  const renderMediaItem = ({
    item,
    index,
  }: {
    item: MediaItem;
    index: number;
  }) => (
    <View style={styles.mediaItemContainer}>
      <Image
        source={{ uri: item.type === "video" ? item.thumbnailUri : item.uri }}
        style={styles.mediaThumbnail}
      />
      {item.type === "video" && (
        <View style={styles.videoIndicator}>
          <Ionicons name="play" size={16} color="#fff" />
        </View>
      )}
      <TouchableOpacity
        style={styles.removeMediaButton}
        onPress={() => handleRemoveMedia(index)}
      >
        <Ionicons name="close-circle" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              if (postText.trim() || mediaItems.length > 0) {
                Alert.alert(
                  "Discard Post",
                  "Are you sure you want to discard this post?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Discard",
                      onPress: () => navigation.goBack(),
                      style: "destructive",
                    },
                  ]
                );
              } else {
                navigation.goBack();
              }
            }}
          >
            <Text style={[styles.cancelButtonText, { color: theme.textMuted }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Create Post
          </Text>
          <TouchableOpacity
            style={[
              styles.postButton,
              !postText.trim() &&
                mediaItems.length === 0 &&
                styles.disabledButton,
              {
                backgroundColor:
                  !postText.trim() && mediaItems.length === 0
                    ? theme.border
                    : theme.primary,
              },
            ]}
            onPress={handleSubmitPost}
            disabled={
              (!postText.trim() && mediaItems.length === 0) || isSubmitting
            }
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.userInfoContainer}>
            <View style={[styles.userIcon, { backgroundColor: theme.primary }]}>
              <Text style={styles.userIconText}>
                {user?.username ? user.username[0].toUpperCase() : "A"}
              </Text>
            </View>
            <View style={styles.locationContainer}>
              <Text style={[styles.username, { color: theme.text }]}>
                {user?.username || "Anonymous User"}
              </Text>
              <View style={styles.locationDisplay}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={theme.primary}
                />
                <Text style={[styles.locationText, { color: theme.primary }]}>
                  {detectedLocation.city}
                  {detectedLocation.country && `, ${detectedLocation.country}`}
                </Text>
              </View>
            </View>
          </View>

          <TextInput
            style={[styles.postInput, { color: theme.text }]}
            placeholder="What's happening in your neighborhood?"
            placeholderTextColor={theme.textMuted}
            multiline
            value={postText}
            onChangeText={(text) => {
              if (text.length <= MAX_CHARS) {
                setPostText(text);
              }
            }}
            autoFocus
          />

          <View style={styles.charCountContainer}>
            <Text
              style={[
                styles.charCount,
                { color: theme.textMuted },
                postText.length > MAX_CHARS * 0.8 && styles.charCountWarning,
                postText.length === MAX_CHARS && styles.charCountLimit,
              ]}
            >
              {postText.length}/{MAX_CHARS}
            </Text>
          </View>

          {mediaItems.length > 0 && (
            <FlatList
              data={mediaItems}
              renderItem={renderMediaItem}
              keyExtractor={(_, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mediaList}
            />
          )}
        </ScrollView>

        <View
          style={[
            styles.mediaButtonsContainer,
            {
              borderTopColor: theme.border,
              backgroundColor: theme.background,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.mediaButton}
            onPress={handleTakePhoto}
          >
            <Ionicons name="camera-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mediaButton}
            onPress={handleRecordVideo}
          >
            <Ionicons name="videocam-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mediaButton}
            onPress={handlePickFromGallery}
          >
            <Ionicons name="images-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
          <View style={styles.mediaCountContainer}>
            <Text style={[styles.mediaCount, { color: theme.textMuted }]}>
              {mediaItems.length}/{MAX_MEDIA_ITEMS}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  disabledButton: {},
  postButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userIconText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  locationContainer: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  locationDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 14,
    marginHorizontal: 4,
  },
  postInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCountContainer: {
    alignItems: "flex-end",
    marginVertical: 8,
  },
  charCount: {
    fontSize: 12,
  },
  charCountWarning: {
    color: "#ffc107",
  },
  charCountLimit: {
    color: "#dc3545",
  },
  mediaButtonsContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  mediaButton: {
    marginRight: 20,
    padding: 4,
  },
  mediaCountContainer: {
    marginLeft: "auto",
  },
  mediaCount: {
    fontSize: 14,
  },
  mediaList: {
    paddingVertical: 12,
  },
  mediaItemContainer: {
    marginRight: 12,
    position: "relative",
  },
  mediaThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#2D2D2D",
  },
  videoIndicator: {
    position: "absolute",
    right: 8,
    bottom: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  removeMediaButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
  },
});

export default CreatePostScreen;
