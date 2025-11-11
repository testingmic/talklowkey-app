import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  TouchableWithoutFeedback,
  Animated,
  Modal,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { EnhancedConversation } from "../../navigation/ChatNavigator";
import { RootStackParamList } from "../../navigation/AppNavigator";
import {
  togglePinChat,
  toggleArchiveChat,
  toggleMuteChat,
} from "../../utils/chatUtils";
import { useTheme } from "../../contexts/ThemeContext";
import { chatService, websocketService, audioService } from "../../services";
import { getUserUUID } from "../../services/postService";
import { authService } from "../../services/authService";
import * as ImagePicker from "expo-image-picker";

type ChatDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ChatDetail"
>;

type ChatDetailScreenRouteProp = RouteProp<RootStackParamList, "ChatDetail">;

type ChatDetailScreenProps = {
  navigation: ChatDetailScreenNavigationProp;
  route: ChatDetailScreenRouteProp;
};

// Storage keys
const PINNED_CHATS_KEY = "whispernet_pinned_chats";
const ARCHIVED_CHATS_KEY = "whispernet_archived_chats";

// Enhanced conversation type with group info
type GroupConversation = EnhancedConversation & {
  isGroup?: boolean;
  members?: string[];
  groupName?: string;
  createdBy?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  isMuted?: boolean;
  receiverId?: string | number; // For new chats from user search
  isNewChat?: boolean; // Flag to indicate this is a new chat
};

// Message type
type Message = {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  isCurrentUser: boolean;
  uuid?: string;
  created_at?: string;
  has_media?: boolean;
  media?: any;
};

// Selected image type for chat
type SelectedImage = {
  uri: string;
  fileName?: string;
  type?: string;
};

// Mock data for messages
const generateMockMessages = (conversation: GroupConversation): Message[] => {
  const isGroup = conversation.isGroup || false;

  // Base messages that work for both direct and group chats
  const baseMessages = [
    {
      id: "1",
      text: "Hey, have you heard about the new coffee shop that opened nearby?",
      sender: conversation.username,
      timestamp: "10:30 AM",
      isCurrentUser: false,
    },
    {
      id: "2",
      text: "No, I haven't. Where is it located?",
      sender: "You",
      timestamp: "10:32 AM",
      isCurrentUser: true,
    },
    {
      id: "3",
      text: "It's on Oak Street, next to the bookstore. They have amazing pastries!",
      sender: conversation.username,
      timestamp: "10:33 AM",
      isCurrentUser: false,
    },
    {
      id: "4",
      text: "That sounds great! I'll check it out this weekend.",
      sender: "You",
      timestamp: "10:35 AM",
      isCurrentUser: true,
    },
  ];

  // If it's a group chat, add some messages from other members
  if (isGroup && conversation.members) {
    const groupMessages: Message[] = [
      ...baseMessages,
      {
        id: "5",
        text: "I've been there! Their cold brew is amazing.",
        sender: conversation.members[0],
        timestamp: "10:36 AM",
        isCurrentUser: false,
      },
      {
        id: "6",
        text: "Do they have wifi? I need a place to work remotely tomorrow.",
        sender: conversation.members[1],
        timestamp: "10:38 AM",
        isCurrentUser: false,
      },
      {
        id: "7",
        text: "Yes, they do! The password is posted on the wall.",
        sender: conversation.username,
        timestamp: "10:39 AM",
        isCurrentUser: false,
      },
      {
        id: "8",
        text: "Great! Maybe we can all meet there sometime?",
        sender: "You",
        timestamp: "10:40 AM",
        isCurrentUser: true,
      },
    ];
    return groupMessages;
  }

  return baseMessages;
};

const ChatDetailScreen = ({ navigation, route }: ChatDetailScreenProps) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { conversation } = route.params;
  const typedConversation = conversation as GroupConversation;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [groupInfoVisible, setGroupInfoVisible] = useState(false);
  const [isPinned, setIsPinned] = useState(conversation.isPinned || false);
  const [isArchived, setIsArchived] = useState(
    conversation.isArchived || false
  );
  const [isMuted, setIsMuted] = useState(conversation.isMuted || false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const bannerHeight = useRef(new Animated.Value(40)).current;

  const MAX_IMAGES = 5;

  // Load messages from API
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);

        // Get current user data
        const userUUID = await getUserUUID();
        const currentUser = await authService.getCurrentUser();
        const currentUserId =
          currentUser?.user_id || currentUser?.id || userUUID;
        setCurrentUserId(currentUserId);

        // Determine room type and receiver ID
        const roomType = conversation.isGroup ? "group" : "individual";

        // For new chats from user search, use roomId=0 and the stored receiverId
        let roomId, receiverId;
        if (typedConversation.isNewChat) {
          roomId = "0";
          receiverId = String(typedConversation.receiverId);
        } else {
          roomId = conversation.id;
          receiverId = conversation.isGroup
            ? conversation.id
            : String(typedConversation.receiverId || conversation.id);
        }

        const response = await chatService.getChatMessages(
          roomId,
          receiverId,
          roomType
        );

        // Transform API messages to UI format
        const transformedMessages = response.data.map((apiMessage) => {
          // Convert both to strings for proper comparison
          const apiSender = String(apiMessage.sender);
          const currentUserIdStr = String(currentUserId);
          const userUUIDStr = String(userUUID);

          const isSentByCurrentUser =
            apiSender === currentUserIdStr || apiSender === userUUIDStr;

          return {
            id: apiMessage.msgid,
            text: apiMessage.message,
            sender: apiMessage.sender,
            timestamp: apiMessage.time,
            isCurrentUser: isSentByCurrentUser,
            uuid: apiMessage.uuid,
            created_at: apiMessage.created_at,
            has_media: apiMessage.has_media,
            media: apiMessage.media,
          };
        });

        setMessages(transformedMessages);

        // Mark conversation as read if it was unread
        if (conversation.unread) {
          const updatedConversation = { ...conversation, unread: false };
          navigation.setParams({ conversation: updatedConversation });
        }
      } catch (error) {
        // For new conversations (like those created from search), start with empty messages
        // Check if this is a new conversation by looking at the lastMessage
        const isNewConversation =
          conversation.lastMessage === "Start a conversation..." ||
          conversation.lastMessage === "You joined the group" ||
          conversation.lastMessage === "Group created";

        if (isNewConversation) {
          setMessages([]); // Start with empty messages for new chats
        } else {
          // For existing chats that failed to load, fallback to mock messages
          setMessages(generateMockMessages(conversation));
        }
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [conversation, navigation]);

  // Initialize WebSocket connection and listeners
  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
        // Initialize audio service
        await audioService.initialize();

        // Connect to WebSocket
        await websocketService.connect();

        // Set up connection listener
        const connectionListener = (connected: boolean) => {
          setIsWebSocketConnected(connected);
        };
        websocketService.addConnectionListener(connectionListener);

        // Set up message listener for incoming messages
        const messageListener = (wsMessage: any) => {
          // Filter out beacon messages from logs
          if (wsMessage.type === "beacon") {
            return; // Don't log beacon messages
          }

          // Handle incoming chat messages - they come WITHOUT data wrapper
          if (wsMessage.type === "chat" && wsMessage.direction === "received") {
            // Check if this message is for the current conversation
            const isCurrentConversation =
              String(wsMessage.roomId) === String(conversation.id);
            const isFromCurrentUser =
              String(wsMessage.sender) === String(currentUserId);

            // Only process messages that are not from the current user
            if (!isFromCurrentUser) {
              // Play notification sound if:
              // 1. Message is from a different chat room, OR
              // 2. Message is from current chat but screen is not focused (user is elsewhere)
              const shouldPlaySound =
                !isCurrentConversation || !isScreenFocused;

              if (shouldPlaySound) {
                try {
                  audioService.playNotificationSound();
                } catch (error) {
                  // Silently fail if sound can't be played
                }
              }

              // Only add message to UI if it's for the current conversation
              if (isCurrentConversation) {
                // Handle media structure based on the incoming message format
                let mediaData = undefined;
                if (wsMessage.media && wsMessage.images) {
                  // New structure: wsMessage.images contains files and thumbnails arrays
                  mediaData = {
                    images: {
                      files: wsMessage.images.files || [],
                      thumbnails: wsMessage.images.thumbnails || [],
                      isLocal: false, // Server images
                    },
                  };
                } else if (wsMessage.media && wsMessage.files) {
                  // Fallback structure: files array directly in wsMessage
                  mediaData = {
                    images: {
                      files: wsMessage.files,
                      thumbnails: [],
                      isLocal: false, // Server images
                    },
                  };
                }

                const newMessage: Message = {
                  id:
                    String(wsMessage.msgid) ||
                    `ws-${Date.now()}-${Math.random()}`,
                  text: wsMessage.message,
                  sender: String(wsMessage.sender),
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  isCurrentUser: false,
                  uuid: wsMessage.uuid,
                  has_media: wsMessage.media || false,
                  media: mediaData,
                };

                // Use callback to access current state and prevent duplicates
                setMessages((prevMessages) => {
                  // Check if message already exists (prevent duplicates)
                  const messageExists = prevMessages.some(
                    (msg) =>
                      msg.uuid === wsMessage.uuid ||
                      msg.id === String(wsMessage.msgid)
                  );

                  if (messageExists) {
                    return prevMessages; // Return unchanged if duplicate
                  }
                  return [...prevMessages, newMessage];
                });

                // Scroll to bottom when new message arrives
                setTimeout(() => scrollToBottom(), 100);
              }
            }
          }
        };
        websocketService.addMessageListener(messageListener);

        // Cleanup function
        return () => {
          websocketService.removeConnectionListener(connectionListener);
          websocketService.removeMessageListener(messageListener);
        };
      } catch (error) {}
    };

    initializeWebSocket();
  }, [conversation.id, currentUserId, isScreenFocused]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setIsKeyboardVisible(true);
        scrollToBottom();
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false);
      }
    );

    // Add focus/blur listeners to track screen state
    const focusListener = navigation.addListener("focus", () => {
      setIsScreenFocused(true);
    });

    const blurListener = navigation.addListener("blur", () => {
      setIsScreenFocused(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      focusListener();
      blurListener();
    };
  }, [navigation]);

  // Cleanup WebSocket connection on unmount
  useEffect(() => {
    return () => {
      // Cleanup audio service
      audioService.cleanup();
      // Don't disconnect completely as other screens might use it
    };
  }, []);

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  };

  // Update message with media paths from API response
  const updateMessageWithMedia = (
    messageUuid: string,
    mediaPaths: string[]
  ) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.uuid === messageUuid && msg.has_media) {
          return {
            ...msg,
            media: {
              images: {
                files: mediaPaths,
                thumbnails: [],
                isLocal: false, // Now using server paths
              },
            },
          };
        }
        return msg;
      })
    );
  };

  const handleSend = async () => {
    if ((message.trim() === "" && selectedImages.length === 0) || sending)
      return;

    const messageText = message.trim();
    const imagesToSend = [...selectedImages];

    setMessage(""); // Clear input immediately for better UX
    setSelectedImages([]); // Clear selected images
    setSending(true);

    try {
      // Determine message type and receiver
      const messageType = conversation.isGroup ? "group" : "individual";

      // For new chats from user search, use roomId=0 and the stored receiverId
      let roomId, receiverId;
      if (typedConversation.isNewChat) {
        roomId = "0";
        receiverId = String(typedConversation.receiverId);
      } else {
        roomId = conversation.id;
        receiverId = conversation.isGroup
          ? conversation.id
          : String(typedConversation.receiverId || conversation.id);
      }

      // Send message via API (with images if any)
      const response = await chatService.sendMessage(
        messageText,
        currentUserId,
        receiverId,
        messageType,
        roomId,
        imagesToSend
      );

      // Add message to local state for immediate UI update
      const newMessage: Message = {
        id: response.record.messageId.toString(),
        text: messageText,
        sender: currentUserId,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isCurrentUser: true,
        uuid: response.record.uuid,
        has_media: imagesToSend.length > 0,
        media:
          imagesToSend.length > 0
            ? {
                images: {
                  files: imagesToSend.map((img) => img.uri), // Always use local URIs first for immediate display
                  thumbnails: [],
                  isLocal: true, // Flag to indicate these are local URIs initially
                },
              }
            : undefined,
      };

      setMessages((prevMessages) => [...prevMessages, newMessage]);

      // If we have media and got server paths, update the message with server paths
      if (
        imagesToSend.length > 0 &&
        response.record.media &&
        typeof response.record.media === "object" &&
        "images" in response.record.media
      ) {
        const serverMedia = response.record.media as any;
        if (serverMedia.images?.files && serverMedia.images.files.length > 0) {
          updateMessageWithMedia(
            response.record.uuid,
            serverMedia.images.files
          );
        }
      }

      // Send message via WebSocket for real-time delivery
      // For messages with files, only send after API response (as per specification)
      try {
        await websocketService.sendChatMessage({
          message: messageText,
          sender: currentUserId,
          receiver:
            messageType === "group" ? receiverId : [currentUserId, receiverId],
          roomId: roomId,
          messageId: response.record.messageId.toString(),
          uuid: response.record.uuid,
          selectedChatType: messageType,
          media:
            response.record.media &&
            typeof response.record.media === "object" &&
            "images" in response.record.media
              ? (response.record.media as any).images?.files || []
              : [], // Use media files array from API response
        });
      } catch (wsError) {
        // Continue execution even if WebSocket fails
      }

      // Scroll to bottom after sending
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      // Restore message and images in input on error
      setMessage(messageText);
      setSelectedImages(imagesToSend);
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const hideBanner = () => {
    Animated.timing(bannerHeight, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setIsBannerVisible(false);
    });
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const toggleGroupInfo = () => {
    setGroupInfoVisible(!groupInfoVisible);
  };

  const handlePinChat = async () => {
    try {
      const isPinned = conversation.isPinned || false;

      // Update pin status in storage
      await togglePinChat(conversation.id, isPinned);

      // Update the conversation in the route params
      navigation.setParams({
        conversation: {
          ...conversation,
          isPinned: !isPinned,
        },
      });

      setMenuVisible(false);
    } catch (error) {}
  };

  const handleArchiveChat = async () => {
    try {
      const isArchived = conversation.isArchived || false;

      // Update archive status in storage
      await toggleArchiveChat(conversation.id, isArchived);

      // Update the conversation in the route params
      navigation.setParams({
        conversation: {
          ...conversation,
          isArchived: !isArchived,
        },
      });

      setMenuVisible(false);

      // If archiving, navigate back to the chat list
      if (!isArchived) {
        navigation.goBack();
      }
    } catch (error) {}
  };

  const handleClearChat = () => {
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to clear all messages in this chat? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          onPress: async () => {
            try {
              // Call the clear API
              const chatType = conversation.isGroup ? "group" : "individual";
              await chatService.clearChat(conversation.id, chatType);
            } catch (error) {
              Alert.alert("Error", "Failed to clear chat. Please try again.");
            }
          },
          style: "destructive",
        },
      ]
    );
    setMenuVisible(false);
  };

  const handleRemoveChat = () => {
    Alert.alert(
      "Remove Chat",
      "Are you sure you want to remove this chat from your list? You will no longer see this chat.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          onPress: async () => {
            try {
              // Call the remove API
              await chatService.removeFromChat(conversation.id);

              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Failed to remove chat. Please try again.");
            }
          },
          style: "destructive",
        },
      ]
    );
    setMenuVisible(false);
  };

  const handleLeaveGroup = () => {
    if (!conversation.isGroup) return;

    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this group? You'll no longer receive messages from this group.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Leave",
          onPress: () => {
            // In a real app, you would call an API to leave the group
            navigation.goBack();
          },
          style: "destructive",
        },
      ]
    );
    setMenuVisible(false);
  };

  const handleManageGroup = () => {
    if (!conversation.isGroup || conversation.createdBy !== "User") return;

    setMenuVisible(false);
    toggleGroupInfo();
  };

  const handleRemoveMember = (member: string) => {
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${member} from this group?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          onPress: () => {
            // In a real app, you would call an API to remove the member
            Alert.alert(
              "Success",
              `${member} has been removed from the group.`
            );
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleRenameGroup = () => {
    Alert.alert("Rename Group", "This feature will be implemented soon!", [
      { text: "OK" },
    ]);
  };

  const handleToggleMute = async () => {
    try {
      // Update the mute status in AsyncStorage
      await toggleMuteChat(conversation.id, isMuted);

      // Update local state
      setIsMuted(!isMuted);
      setMenuVisible(false);

      // Show feedback to the user
      Alert.alert("Success", isMuted ? "Chat unmuted" : "Chat muted");
    } catch (error) {}
  };

  // Image picker functions
  const handleImagePicker = () => {
    if (selectedImages.length >= MAX_IMAGES) {
      Alert.alert(
        "Limit Reached",
        `You can only send up to ${MAX_IMAGES} images at once.`
      );
      return;
    }

    Alert.alert(
      "Select Images",
      "Choose how you want to add images",
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
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newImage: SelectedImage = {
          uri: asset.uri,
          fileName: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type || "image",
        };
        setSelectedImages((prev) => [...prev, newImage]);
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

      const remainingSlots = MAX_IMAGES - selectedImages.length;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages: SelectedImage[] = result.assets.map((asset) => ({
          uri: asset.uri,
          fileName: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type || "image",
        }));

        setSelectedImages((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select photos");
    }
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Render media attachments in messages
  const renderMediaAttachments = (media: any) => {
    if (
      !media ||
      !media.images ||
      !media.images.files ||
      media.images.files.length === 0
    ) {
      return null;
    }

    const files = media.images.files;
    const thumbnails = media.images.thumbnails || [];
    const imageCount = files.length;
    const isLocal = media.images.isLocal; // Check if these are local URIs

    // Determine image size based on count
    const getImageSize = () => {
      if (imageCount === 1) return { width: 150, height: 150 };
      if (imageCount === 2) return { width: 120, height: 120 };
      return { width: 100, height: 100 }; // 3 or more images
    };

    const imageSize = getImageSize();

    return (
      <View style={styles.messageMediaContainer}>
        {files.map((file: string, index: number) => {
          let imageUri: string;
          let fullScreenUri: string;

          if (isLocal) {
            // For local images (just sent), use the URI directly
            imageUri = file;
            fullScreenUri = file;
          } else {
            // For server images, construct the URL properly
            // Check if thumbnails exist and use them for display
            let displayFile = file;
            if (thumbnails && thumbnails.length > index) {
              // thumbnails[index] might be an array or a string
              if (Array.isArray(thumbnails[index])) {
                displayFile = thumbnails[index][0] || file;
              } else {
                displayFile = thumbnails[index] || file;
              }
            }

            // Construct URLs - use the correct base path
            const baseUrl = "https://talklowkey.com/assets/uploads/";

            // Clean the file path - remove leading slash if present
            const cleanDisplayFile = displayFile.startsWith("/")
              ? displayFile.slice(1)
              : displayFile;
            const cleanFile = file.startsWith("/") ? file.slice(1) : file;

            // Construct the final URLs
            imageUri = `${baseUrl}${cleanDisplayFile}`;
            fullScreenUri = `${baseUrl}${cleanFile}`;
          }

          return (
            <TouchableOpacity
              key={`media-${file}-${index}`}
              style={[
                styles.messageMediaItem,
                { marginRight: imageCount > 1 ? 4 : 8 },
              ]}
              onPress={() => setFullScreenImage(fullScreenUri)}
            >
              <Image
                source={{ uri: imageUri }}
                style={[styles.messageMediaImage, imageSize]}
                resizeMode="cover"
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.isCurrentUser;
    const isGroup = conversation.isGroup;

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        ]}
      >
        {isGroup && !isCurrentUser && (
          <Text style={[styles.messageSender, { color: theme.textSecondary }]}>
            {item.sender}
          </Text>
        )}

        {/* Images in separate container - no background */}
        {item.has_media && (
          <View style={styles.messageImagesContainer}>
            {renderMediaAttachments(item.media)}
          </View>
        )}

        {/* Text bubble - only if there's text */}
        {item.text && (
          <View
            style={[
              styles.messageBubble,
              isCurrentUser
                ? [styles.currentUserBubble, { backgroundColor: theme.primary }]
                : [styles.otherUserBubble, { backgroundColor: theme.card }],
            ]}
          >
            <Text
              style={[
                styles.messageText,
                { color: isCurrentUser ? "#FFFFFF" : theme.text },
              ]}
            >
              {item.text}
            </Text>
          </View>
        )}

        {/* Timestamp always appears below bubble/images */}
        <Text
          style={[
            styles.messageTimestampExternal,
            {
              color: theme.textMuted,
              textAlign: isCurrentUser ? "right" : "left",
            },
          ]}
        >
          {item.timestamp}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerInfo}
            onPress={conversation.isGroup ? toggleGroupInfo : undefined}
          >
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: theme.primary },
                conversation.isGroup && styles.groupAvatarContainer,
              ]}
            >
              {conversation.isGroup ? (
                <Ionicons name="people" size={20} color="white" />
              ) : (
                <Text style={styles.avatarText}>
                  {conversation.username[0].toUpperCase()}
                </Text>
              )}
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {conversation.isGroup
                  ? conversation.groupName
                  : conversation.username}
              </Text>
              <View style={styles.headerSubtitleContainer}>
                {isMuted && (
                  <Ionicons
                    name="volume-mute"
                    size={12}
                    color={theme.textMuted}
                    style={styles.mutedIcon}
                  />
                )}
                <Text
                  style={[styles.headerSubtitle, { color: theme.textMuted }]}
                >
                  {conversation.isGroup
                    ? `${conversation.members?.length || 0} members • ${
                        conversation.distance
                      }`
                    : conversation.distance}
                </Text>
                {/* WebSocket connection indicator */}
                <View style={styles.connectionIndicator}>
                  <View
                    style={[
                      styles.connectionDot,
                      {
                        backgroundColor: isWebSocketConnected
                          ? "#4CAF50"
                          : "#FF5722",
                      },
                    ]}
                  />
                  <Text
                    style={[styles.connectionText, { color: theme.textMuted }]}
                  >
                    {isWebSocketConnected ? "Online" : "Offline"}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
            <Ionicons name="ellipsis-vertical" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        {isBannerVisible && (
          <Animated.View
            style={[
              styles.banner,
              { height: bannerHeight, backgroundColor: `${theme.primary}15` },
            ]}
          >
            <View style={styles.bannerContent}>
              <Ionicons name="time-outline" size={16} color={theme.primary} />
              <Text style={[styles.bannerText, { color: theme.text }]}>
                Messages in this chat will self-destruct after 24 hours
              </Text>
            </View>
            <TouchableOpacity
              style={styles.bannerCloseButton}
              onPress={hideBanner}
            >
              <Ionicons name="close" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>
              Loading messages...
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) =>
              item.uuid ? `${item.id}-${item.uuid}` : item.id
            }
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  No messages yet. Start the conversation!
                </Text>
              </View>
            }
          />
        )}

        {/* Selected Images Preview */}
        {selectedImages.length > 0 && (
          <View
            style={[
              styles.selectedImagesContainer,
              { backgroundColor: theme.card },
            ]}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedImages.map((image, index) => (
                <View
                  key={`selected-${image.uri}-${index}`}
                  style={styles.selectedImageWrapper}
                >
                  <Image
                    source={{ uri: image.uri }}
                    style={styles.selectedImagePreview}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeSelectedImage(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <Text style={[styles.imageCount, { color: theme.textMuted }]}>
              {selectedImages.length}/{MAX_IMAGES}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.card, borderTopColor: theme.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.imagePickerButton,
              { backgroundColor: theme.inputBackground },
            ]}
            onPress={handleImagePicker}
            disabled={selectedImages.length >= MAX_IMAGES}
          >
            <Ionicons
              name="image-outline"
              size={20}
              color={
                selectedImages.length >= MAX_IMAGES
                  ? theme.textMuted
                  : theme.primary
              }
            />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { color: theme.text, backgroundColor: theme.inputBackground },
            ]}
            placeholder="Type a message..."
            placeholderTextColor={theme.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              ((!message.trim() && selectedImages.length === 0) || sending) && [
                styles.disabledButton,
                { backgroundColor: theme.border },
              ],
              (message.trim() || selectedImages.length > 0) &&
                !sending && { backgroundColor: theme.primary },
            ]}
            onPress={handleSend}
            disabled={
              (!message.trim() && selectedImages.length === 0) || sending
            }
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>

        {/* Chat Menu Modal */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View
                  style={[
                    styles.menuContainer,
                    { backgroundColor: theme.card },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={handleToggleMute}
                  >
                    <Ionicons
                      name={isMuted ? "volume-high" : "volume-mute"}
                      size={20}
                      color={theme.text}
                    />
                    <Text style={[styles.menuItemText, { color: theme.text }]}>
                      {isMuted ? "Unmute" : "Mute"} Chat
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={handlePinChat}
                  >
                    <Ionicons
                      name={isPinned ? "pin-outline" : "pin"}
                      size={20}
                      color={theme.text}
                    />
                    <Text style={[styles.menuItemText, { color: theme.text }]}>
                      {isPinned ? "Unpin" : "Pin"} Chat
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={handleArchiveChat}
                  >
                    <Ionicons name="archive" size={20} color={theme.text} />
                    <Text style={[styles.menuItemText, { color: theme.text }]}>
                      {isArchived ? "Unarchive" : "Archive"} Chat
                    </Text>
                  </TouchableOpacity>

                  {conversation.isGroup &&
                    conversation.createdBy === "User" && (
                      <TouchableOpacity
                        style={[
                          styles.menuItem,
                          { borderBottomColor: theme.border },
                        ]}
                        onPress={handleManageGroup}
                      >
                        <Ionicons name="people" size={20} color={theme.text} />
                        <Text
                          style={[styles.menuItemText, { color: theme.text }]}
                        >
                          Manage Group
                        </Text>
                      </TouchableOpacity>
                    )}

                  {conversation.isGroup &&
                    conversation.createdBy !== "User" && (
                      <TouchableOpacity
                        style={[
                          styles.menuItem,
                          { borderBottomColor: theme.border },
                        ]}
                        onPress={handleLeaveGroup}
                      >
                        <Ionicons
                          name="exit-outline"
                          size={20}
                          color={theme.error}
                        />
                        <Text
                          style={[styles.menuItemText, { color: theme.error }]}
                        >
                          Leave Group
                        </Text>
                      </TouchableOpacity>
                    )}

                  <TouchableOpacity
                    style={[styles.menuItem, styles.deleteMenuItem]}
                    onPress={handleClearChat}
                  >
                    <Ionicons name="trash" size={20} color={theme.error} />
                    <Text style={[styles.menuItemText, { color: theme.error }]}>
                      Clear Chat
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.menuItem, styles.deleteMenuItem]}
                    onPress={handleRemoveChat}
                  >
                    <Ionicons name="trash" size={20} color={theme.error} />
                    <Text style={[styles.menuItemText, { color: theme.error }]}>
                      Remove Chat
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Group Info Modal */}
        <Modal
          visible={groupInfoVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setGroupInfoVisible(false)}
        >
          <View
            style={[
              styles.groupInfoModal,
              { paddingTop: insets.top, backgroundColor: theme.background },
            ]}
          >
            <StatusBar
              barStyle={
                theme.statusBar === "light" ? "light-content" : "dark-content"
              }
            />
            <View
              style={[
                styles.groupInfoHeader,
                { borderBottomColor: theme.border },
              ]}
            >
              <TouchableOpacity
                style={styles.groupInfoButton}
                onPress={toggleGroupInfo}
              >
                <Ionicons name="chevron-back" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Group Info
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.groupInfoContent}>
              <View
                style={[
                  styles.groupInfoSection,
                  { borderBottomColor: theme.border },
                ]}
              >
                <View
                  style={[
                    styles.groupAvatarLarge,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Ionicons name="people" size={40} color="white" />
                </View>
                <Text style={[styles.groupName, { color: theme.text }]}>
                  {conversation.groupName}
                </Text>
                <Text
                  style={[styles.groupMemberCount, { color: theme.textMuted }]}
                >
                  {conversation.members?.length || 0} members •{" "}
                  {conversation.distance}
                </Text>

                {conversation.createdBy === "User" && (
                  <TouchableOpacity
                    style={styles.renameButton}
                    onPress={handleRenameGroup}
                  >
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color={theme.primary}
                    />
                    <Text
                      style={[
                        styles.renameButtonText,
                        { color: theme.primary },
                      ]}
                    >
                      Rename Group
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.membersSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Members
                </Text>
                <ScrollView style={styles.membersList}>
                  {conversation.members?.map((member, index) => (
                    <View
                      key={`member-${member}-${index}`}
                      style={[
                        styles.memberItem,
                        { borderBottomColor: theme.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.memberAvatar,
                          { backgroundColor: theme.primary },
                        ]}
                      >
                        <Text style={styles.memberAvatarText}>
                          {member[0].toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.memberName, { color: theme.text }]}>
                        {member}
                      </Text>
                      {member === "User" && (
                        <Text
                          style={[
                            styles.youBadge,
                            {
                              backgroundColor: `${theme.primary}20`,
                              color: theme.primary,
                            },
                          ]}
                        >
                          You
                        </Text>
                      )}
                      {conversation.createdBy === member && (
                        <Text
                          style={[
                            styles.adminBadge,
                            {
                              backgroundColor: `${theme.primary}20`,
                              color: theme.primary,
                            },
                          ]}
                        >
                          Admin
                        </Text>
                      )}
                      {conversation.createdBy === "User" &&
                        member !== "User" && (
                          <TouchableOpacity
                            style={styles.removeMemberButton}
                            onPress={() => handleRemoveMember(member)}
                          >
                            <Ionicons
                              name="remove-circle-outline"
                              size={20}
                              color={theme.error}
                            />
                          </TouchableOpacity>
                        )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </Modal>

        {/* Full Screen Image Modal */}
        <Modal
          visible={fullScreenImage !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setFullScreenImage(null)}
        >
          <View style={styles.fullScreenImageModal}>
            <TouchableOpacity
              style={styles.fullScreenImageOverlay}
              activeOpacity={1}
              onPress={() => setFullScreenImage(null)}
            >
              <View style={styles.fullScreenImageHeader}>
                <TouchableOpacity
                  style={styles.fullScreenImageCloseButton}
                  onPress={() => setFullScreenImage(null)}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
              {fullScreenImage && (
                <Image
                  source={{ uri: fullScreenImage }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>
          </View>
        </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  groupAvatarContainer: {
    backgroundColor: "#6C63FF",
  },
  avatarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  headerTitle: {
    fontWeight: "600",
    fontSize: 16,
  },
  headerSubtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerSubtitle: {
    fontSize: 12,
  },
  mutedIcon: {
    marginRight: 4,
  },
  connectionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  connectionText: {
    fontSize: 10,
    fontWeight: "500",
  },
  menuButton: {
    padding: 8,
  },
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerText: {
    fontSize: 12,
    marginLeft: 8,
  },
  bannerCloseButton: {
    padding: 4,
  },
  messagesList: {
    paddingHorizontal: 0,
    paddingVertical: 12,
    paddingBottom: 200,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: "80%",
    marginHorizontal: 16,
  },
  currentUserMessage: {
    alignSelf: "flex-end",
  },
  otherUserMessage: {
    alignSelf: "flex-start",
  },
  messageSender: {
    fontSize: 12,
    marginBottom: 2,
    marginLeft: 12,
  },
  messageBubble: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 12,
    position: "relative",
    maxWidth: "80%",
    alignSelf: "flex-start",
  },
  currentUserBubble: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    marginLeft: 12,
    transform: [{ skewY: "1deg" }],
    alignSelf: "flex-end",
  },
  otherUserBubble: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 18,
    marginRight: 12,
    transform: [{ skewY: "-1deg" }],
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
  },
  messageTimestamp: {
    fontSize: 10,
    textAlign: "right",
    marginTop: 4,
  },
  messageImagesContainer: {
    marginBottom: 4,
  },
  messageTimestampOnly: {
    fontSize: 10,
    marginTop: 4,
    marginHorizontal: 8,
  },
  messageTimestampExternal: {
    fontSize: 10,
    marginTop: 4,
    marginHorizontal: 8,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
    marginRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  disabledButton: {
    // backgroundColor set via theme
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  menuContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 16,
  },
  deleteMenuItem: {
    borderBottomWidth: 0,
  },
  groupInfoModal: {
    flex: 1,
  },
  groupInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56,
    borderBottomWidth: 1,
  },
  groupInfoButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  groupInfoContent: {
    flex: 1,
  },
  groupInfoSection: {
    alignItems: "center",
    paddingVertical: 24,
    borderBottomWidth: 1,
  },
  groupAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  groupName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  groupMemberCount: {
    fontSize: 14,
  },
  renameButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  renameButtonText: {
    marginLeft: 8,
  },
  membersSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  membersList: {
    maxHeight: 300,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberAvatarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  memberName: {
    flex: 1,
    fontSize: 16,
  },
  youBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
    marginRight: 8,
  },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
  },
  removeMemberButton: {
    padding: 4,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  // Media styles for chat messages
  messageMediaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  messageMediaItem: {
    marginRight: 4,
    marginBottom: 4,
  },
  messageMediaImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  // Full screen image modal styles
  fullScreenImageModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  fullScreenImageOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImageHeader: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
  },
  fullScreenImageCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },
  // Selected images preview styles
  selectedImagesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  selectedImageWrapper: {
    position: "relative",
    marginRight: 8,
  },
  selectedImagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  removeImageButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 10,
  },
  imageCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  // Image picker button styles
  imagePickerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
});

export default ChatDetailScreen;
