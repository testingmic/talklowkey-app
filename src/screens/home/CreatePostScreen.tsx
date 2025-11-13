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
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

// Define media type
type MediaType = "image" | "video";

// Media item interface
interface MediaItem {
  uri: string;
  type: MediaType;
  thumbnailUri?: string; // For videos
}

// Location interface
interface Location {
  id: string;
  name: string;
  distance: string;
}

// Mock locations
const MOCK_LOCATIONS: Location[] = [
  { id: "1", name: "Current Location", distance: "0km" },
  { id: "2", name: "Downtown Park", distance: "0.5km" },
  { id: "3", name: "Main Street", distance: "1.2km" },
  { id: "4", name: "Central Library", distance: "1.8km" },
  { id: "5", name: "Community Center", distance: "2.3km" },
  { id: "6", name: "Local Cafe", distance: "0.7km" },
  { id: "7", name: "Shopping Mall", distance: "3.1km" },
  { id: "8", name: "Train Station", distance: "2.5km" },
];

const MAX_CHARS = 300;
const MAX_MEDIA_ITEMS = 4;

const CreatePostScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [postText, setPostText] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location>(
    MOCK_LOCATIONS[0]
  );
  const [locationSearchQuery, setLocationSearchQuery] = useState("");

  // Request permissions when component mounts
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
    })();
  }, []);

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

  // Toggle location picker
  const toggleLocationPicker = () => {
    setShowLocationPicker(!showLocationPicker);
  };

  // Select location
  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location);
    setShowLocationPicker(false);
  };

  // Filter locations based on search query
  const filteredLocations = MOCK_LOCATIONS.filter((location) =>
    location.name.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );

  // Handle post submission
  const handleSubmitPost = () => {
    if (!postText.trim() && mediaItems.length === 0) {
      Alert.alert("Empty Post", "Please add text or media to your post.");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert("Post Successful", "Your post has been published!", [
        {
          text: "OK",
          onPress: () => {
            // Reset form and navigate back
            setPostText("");
            setMediaItems([]);
            navigation.goBack();
          },
        },
      ]);
    }, 1500);
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.headerContainer}>
          <BlurView
            intensity={30}
            tint={isDarkMode ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={
              isDarkMode
                ? ["rgba(18, 18, 18, 0.8)", "rgba(18, 18, 18, 0.6)"]
                : ["rgba(248, 249, 250, 0.8)", "rgba(248, 249, 250, 0.6)"]
            }
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.header,
              {
                borderBottomWidth: 1,
                borderBottomColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.1)",
              },
            ]}
          >
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
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity
            style={[
              styles.postButton,
              !postText.trim() &&
                mediaItems.length === 0 &&
                styles.disabledButton,
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
        </View>

        <ScrollView style={styles.content}>
          <View style={[styles.userInfoContainer, { overflow: "hidden" }]}>
            <BlurView
              intensity={20}
              tint={isDarkMode ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={
                isDarkMode
                  ? ["rgba(30, 30, 30, 0.6)", "rgba(30, 30, 30, 0.4)"]
                  : ["rgba(255, 255, 255, 0.6)", "rgba(255, 255, 255, 0.4)"]
              }
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                styles.userInfoContent,
                {
                  borderWidth: 1,
                  borderColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                },
              ]}
            >
              <View style={styles.userIcon}>
                <Text style={styles.userIconText}>
                  {user?.username ? user.username[0].toUpperCase() : "A"}
                </Text>
              </View>
            <View style={styles.locationContainer}>
              <Text style={styles.username}>
                {user?.username || "Anonymous User"}
              </Text>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={toggleLocationPicker}
              >
                <Ionicons name="location-outline" size={14} color="#4361EE" />
                <Text style={styles.locationText}>{selectedLocation.name}</Text>
                <Ionicons
                  name={showLocationPicker ? "chevron-up" : "chevron-down"}
                  size={14}
                  color="#4361EE"
                />
              </TouchableOpacity>
            </View>
            </View>
          </View>

          <View style={[styles.inputContainer, { overflow: "hidden" }]}>
            <BlurView
              intensity={15}
              tint={isDarkMode ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
            <TextInput
              style={[
                styles.postInput,
                {
                  color: theme.text,
                  borderWidth: 1,
                  borderColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                },
              ]}
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
          </View>

          <View style={styles.charCountContainer}>
            <Text
              style={[
                styles.charCount,
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

          {showLocationPicker && (
            <View style={[styles.locationPickerContainer, { overflow: "hidden" }]}>
              <BlurView
                intensity={25}
                tint={isDarkMode ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={
                  isDarkMode
                    ? ["rgba(30, 30, 30, 0.8)", "rgba(30, 30, 30, 0.6)"]
                    : ["rgba(255, 255, 255, 0.8)", "rgba(255, 255, 255, 0.6)"]
                }
                style={StyleSheet.absoluteFill}
              />
              <View
                style={{
                  borderWidth: 1,
                  borderColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                  borderRadius: 16,
                }}
              >
                <View style={styles.locationSearchContainer}>
                <Ionicons name="search" size={16} color="#6c757d" />
                <TextInput
                  style={styles.locationSearchInput}
                  placeholder="Search locations"
                  placeholderTextColor="#6c757d"
                  value={locationSearchQuery}
                  onChangeText={setLocationSearchQuery}
                />
              </View>
              <FlatList
                data={filteredLocations}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.locationItem,
                      selectedLocation.id === item.id &&
                        styles.selectedLocationItem,
                    ]}
                    onPress={() => handleSelectLocation(item)}
                  >
                    <View style={styles.locationItemContent}>
                      <Ionicons
                        name={item.id === "1" ? "navigate" : "location"}
                        size={16}
                        color={
                          selectedLocation.id === item.id
                            ? "#4361EE"
                            : "#ADB5BD"
                        }
                      />
                      <View style={styles.locationItemTextContainer}>
                        <Text
                          style={[
                            styles.locationItemName,
                            selectedLocation.id === item.id &&
                              styles.selectedLocationText,
                          ]}
                        >
                          {item.name}
                        </Text>
                        <Text style={styles.locationItemDistance}>
                          {item.distance}
                        </Text>
                      </View>
                    </View>
                    {selectedLocation.id === item.id && (
                      <Ionicons name="checkmark" size={18} color="#4361EE" />
                    )}
                  </TouchableOpacity>
                )}
                style={styles.locationsList}
              />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.mediaButtonsContainer, { overflow: "hidden" }]}>
          <BlurView
            intensity={30}
            tint={isDarkMode ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={
              isDarkMode
                ? ["rgba(18, 18, 18, 0.8)", "rgba(18, 18, 18, 0.6)"]
                : ["rgba(248, 249, 250, 0.8)", "rgba(248, 249, 250, 0.6)"]
            }
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.mediaButtonsContent,
              {
                borderTopWidth: 1,
                borderTopColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.1)",
              },
            ]}
          >
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handleTakePhoto}
            >
            <Ionicons name="camera-outline" size={24} color="#4361EE" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mediaButton}
            onPress={handleRecordVideo}
          >
            <Ionicons name="videocam-outline" size={24} color="#4361EE" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mediaButton}
            onPress={handlePickFromGallery}
          >
            <Ionicons name="images-outline" size={24} color="#4361EE" />
          </TouchableOpacity>
          <View style={styles.mediaCountContainer}>
            <Text style={styles.mediaCount}>
              {mediaItems.length}/{MAX_MEDIA_ITEMS}
            </Text>
          </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  headerContainer: {
    overflow: "hidden",
    position: "relative",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F8F9FA",
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: "#6c757d",
    fontSize: 16,
  },
  postButton: {
    backgroundColor: "rgba(67, 97, 238, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#4361EE",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: "#2D2D2D",
  },
  postButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  userInfoContainer: {
    borderRadius: 16,
    marginBottom: 16,
    position: "relative",
  },
  userInfoContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4361EE",
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
    color: "#F8F9FA",
    marginBottom: 4,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    color: "#4361EE",
    fontSize: 14,
    marginHorizontal: 4,
  },
  inputContainer: {
    borderRadius: 16,
    marginBottom: 12,
    position: "relative",
    overflow: "hidden",
  },
  postInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 100,
    textAlignVertical: "top",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  charCountContainer: {
    alignItems: "flex-end",
    marginVertical: 8,
  },
  charCount: {
    color: "#6c757d",
    fontSize: 12,
  },
  charCountWarning: {
    color: "#ffc107",
  },
  charCountLimit: {
    color: "#dc3545",
  },
  mediaButtonsContainer: {
    position: "relative",
  },
  mediaButtonsContent: {
    flexDirection: "row",
    paddingVertical: 12,
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
    color: "#6c757d",
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
  locationPickerContainer: {
    marginTop: 12,
    borderRadius: 16,
    position: "relative",
  },
  locationSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2D2D2D",
  },
  locationSearchInput: {
    flex: 1,
    color: "#F8F9FA",
    marginLeft: 8,
    fontSize: 14,
  },
  locationsList: {
    maxHeight: 200,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2D2D2D",
  },
  selectedLocationItem: {
    backgroundColor: "rgba(67, 97, 238, 0.1)",
  },
  locationItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationItemTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  locationItemName: {
    color: "#F8F9FA",
    fontSize: 14,
  },
  selectedLocationText: {
    color: "#4361EE",
    fontWeight: "600",
  },
  locationItemDistance: {
    color: "#6c757d",
    fontSize: 12,
    marginTop: 2,
  },
});

export default CreatePostScreen;
