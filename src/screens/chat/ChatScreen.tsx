import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  TouchableHighlight,
  Modal,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import {
  ChatStackParamList,
  EnhancedConversation,
} from "../../navigation/ChatNavigator";
import { RootStackParamList } from "../../navigation/AppNavigator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  PINNED_CHATS_KEY,
  ARCHIVED_CHATS_KEY,
  MUTED_CHATS_KEY,
  updateUnreadMessageCount,
  markConversationAsRead,
  getPinnedChats,
  getArchivedChats,
  getMutedChats,
  togglePinChat,
  toggleArchiveChat,
  toggleMuteChat,
} from "../../utils/chatUtils";
import { useTheme } from "../../contexts/ThemeContext";
import { chatService } from "../../services";

// Import AlertButton type from react-native
import type { AlertButton } from "react-native";

type ChatScreenNavigationProp = NativeStackNavigationProp<
  ChatStackParamList,
  "ChatScreen"
>;

type ChatScreenProps = {
  navigation: ChatScreenNavigationProp;
};

// Enhanced conversation type with group info
type GroupConversation = EnhancedConversation & {
  isPinned?: boolean;
  isArchived?: boolean;
  isMuted?: boolean;
  receiverId?: string | number; // For new chats from user search
  isNewChat?: boolean; // Flag to indicate this is a new chat
};

// Mock data for searchable users and groups
const SEARCHABLE_USERS = [
  {
    id: "u1",
    username: "local_artist",
    distance: "1.3km",
    isGroup: false,
  },
  {
    id: "u2",
    username: "dog_walker",
    distance: "0.5km",
    isGroup: false,
  },
  {
    id: "u3",
    username: "plant_enthusiast",
    distance: "2.1km",
    isGroup: false,
  },
  {
    id: "u4",
    username: "night_runner",
    distance: "1.7km",
    isGroup: false,
  },
  {
    id: "u5",
    username: "book_club_organizer",
    distance: "3.2km",
    isGroup: false,
  },
];

const SEARCHABLE_GROUPS = [
  {
    id: "sg1",
    groupName: "Local Parents",
    memberCount: 24,
    distance: "1.0km",
    isGroup: true,
  },
  {
    id: "sg2",
    groupName: "Fitness Buddies",
    memberCount: 12,
    distance: "1.5km",
    isGroup: true,
  },
  {
    id: "sg3",
    groupName: "Community Garden",
    memberCount: 18,
    distance: "2.2km",
    isGroup: true,
  },
];

const ConversationItem = ({
  conversation,
  onPress,
  onLongPress,
}: {
  conversation: GroupConversation;
  onPress: () => void;
  onLongPress: () => void;
}) => {
  const { theme } = useTheme();

  return (
    <TouchableHighlight
      onPress={onPress}
      onLongPress={onLongPress}
      underlayColor={theme.card}
      style={[
        styles.conversationItem,
        { borderColor: theme.border },
        conversation.isPinned && [
          styles.pinnedConversation,
          { backgroundColor: `${theme.primary}10` },
        ],
      ]}
    >
      <View style={styles.conversationInner}>
        <View
          style={[
            styles.avatarContainer,
            {
              backgroundColor: conversation.isGroup ? "#6C63FF" : theme.primary,
            },
            conversation.isGroup && styles.groupAvatarContainer,
          ]}
        >
          {conversation.isGroup ? (
            <Ionicons name="people" size={24} color="white" />
          ) : (
            <Text style={styles.avatarText}>
              {(conversation.full_name ||
                conversation.username)[0].toUpperCase()}
            </Text>
          )}
          {conversation.unread && (
            <View
              style={[
                styles.unreadBadge,
                { backgroundColor: theme.error, borderColor: theme.background },
              ]}
            />
          )}
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <View style={styles.usernameContainer}>
              {conversation.isPinned && (
                <Ionicons
                  name="pin"
                  size={12}
                  color={theme.primary}
                  style={styles.pinIcon}
                />
              )}
              <Text style={[styles.username, { color: theme.text }]}>
                {conversation.isGroup
                  ? conversation.groupName
                  : conversation.full_name || conversation.username}
              </Text>
              {conversation.isGroup && conversation.createdBy === "User" && (
                <Text
                  style={[
                    styles.adminBadge,
                    {
                      color: theme.primary,
                      backgroundColor: `${theme.primary}20`,
                    },
                  ]}
                >
                  Admin
                </Text>
              )}
            </View>
            <View style={styles.timestampContainer}>
              {conversation.isMuted && (
                <Ionicons
                  name="volume-mute"
                  size={14}
                  color={theme.textMuted}
                  style={styles.mutedIcon}
                />
              )}
              <Text style={[styles.timestamp, { color: theme.textMuted }]}>
                {conversation.timestamp}
              </Text>
            </View>
          </View>
          <View style={styles.messagePreviewContainer}>
            <Text
              style={[
                styles.messagePreview,
                { color: theme.textSecondary },
                conversation.unread && [
                  styles.unreadMessage,
                  { color: theme.text, fontWeight: "500" },
                ],
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {conversation.isGroup && !conversation.lastMessage.includes(":")
                ? `Anonymous: ${conversation.lastMessage}`
                : conversation.lastMessage}
            </Text>
            <Text style={[styles.distance, { color: theme.textMuted }]}>
              {conversation.distance}
            </Text>
          </View>
        </View>
      </View>
    </TouchableHighlight>
  );
};

type TabType = "chats" | "groups";

const ChatScreen = ({ navigation }: ChatScreenProps) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<GroupConversation[]>([]);
  const [groupConversations, setGroupConversations] = useState<
    GroupConversation[]
  >([]);
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("chats");
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [modalActiveTab, setModalActiveTab] = useState<"users" | "groups">(
    "users"
  );
  const [loading, setLoading] = useState(true);

  // State for user search functionality
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // State for group creation
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Ref for description input
  const descriptionInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Format date to MM/DD/YY format without time
  const formatDate = (dateString: string): string => {
    if (!dateString || dateString === "Now") return "Now";

    try {
      // Parse the date string (e.g., "2025-06-25 17:01:13")
      const date = new Date(dateString);

      if (isNaN(date.getTime())) return "Now";

      // Get month, day, year
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const year = date.getFullYear().toString().slice(-2); // Last 2 digits

      return `${month}/${day}/${year}`;
    } catch (error) {
      return "Now";
    }
  };

  // Load chat rooms from API and apply stored states
  const loadChatRooms = async () => {
    try {
      setLoading(true);

      // Fetch chat rooms from API
      const response = await chatService.getChatRooms();

      // Get stored states from AsyncStorage
      const pinnedChats = await getPinnedChats();
      const archivedChats = await getArchivedChats();
      const mutedChats = await getMutedChats();

      // Transform API data to GroupConversation format and apply stored states
      const groupChatsData = (response.data.group || []).map(
        (groupChat: any) => ({
          id:
            groupChat.room_id?.toString() ||
            groupChat.room_uuid ||
            Math.random().toString(),
          username: groupChat.full_name || groupChat.username || "Group Chat",
          lastMessage: groupChat.room?.last_message || "Tap to view chat",
          timestamp: formatDate(
            groupChat.room?.last_message_time || groupChat.last_login || "Now"
          ),
          unread: groupChat.room?.unread_count > 0 || false,
          distance: "0km", // Groups don't have distance
          isGroup: true,
          groupName: groupChat.full_name || groupChat.username,
          members: groupChat.particiants ? [groupChat.particiants] : [],
          createdBy: groupChat.creator,
          isPinned: pinnedChats.includes(
            groupChat.room_id?.toString() || groupChat.room_uuid || ""
          ),
          isArchived: archivedChats.includes(
            groupChat.room_id?.toString() || groupChat.room_uuid || ""
          ),
          isMuted: mutedChats.includes(
            groupChat.room_id?.toString() || groupChat.room_uuid || ""
          ),
        })
      ) as GroupConversation[];

      const individualChatsData = (response.data.individual || []).map(
        (individualChat: any) => ({
          id: individualChat.room_id?.toString() || Math.random().toString(),
          username: individualChat.username || "user",
          full_name:
            individualChat.full_name ||
            individualChat.username ||
            "Unknown User",
          lastMessage:
            individualChat.room?.last_message ||
            "@" + (individualChat.username || "user"),
          timestamp: formatDate(
            individualChat.room?.last_message_time ||
              individualChat.last_login ||
              "Now"
          ),
          unread: individualChat.room?.unread_count > 0 || false,
          distance: "0km", // Could be calculated based on user location
          isGroup: false,
          groupName: undefined,
          members: undefined,
          createdBy: undefined,
          receiverId: individualChat.user_id || individualChat.id, // Store the receiver's user ID
          isPinned: pinnedChats.includes(
            individualChat.room_id?.toString() || ""
          ),
          isArchived: archivedChats.includes(
            individualChat.room_id?.toString() || ""
          ),
          isMuted: mutedChats.includes(
            individualChat.room_id?.toString() || ""
          ),
        })
      ) as GroupConversation[];

      const apiChats = [...groupChatsData, ...individualChatsData];

      // Separate direct messages and group chats
      const directMessages = apiChats.filter((chat) => !chat.isGroup);
      const groupChats = apiChats.filter((chat) => chat.isGroup);

      setConversations(directMessages);
      setGroupConversations(groupChats);

      // Update unread count for badge
      await updateUnreadMessageCount(apiChats);
    } catch (error) {
      // Don't show mock data - just empty state
      setConversations([]);
      setGroupConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChatRooms();
  }, []);

  const handleConversationPress = async (conversation: GroupConversation) => {
    // Mark as read when opening the conversation
    if (conversation.unread) {
      const allConversations = [...conversations, ...groupConversations];

      const updatedConversations = await markConversationAsRead(
        conversation,
        allConversations
      );

      // Update the appropriate conversation list
      if (activeTab === "chats") {
        setConversations(updatedConversations.filter((conv) => !conv.isGroup));
        setGroupConversations(
          updatedConversations.filter((conv) => conv.isGroup)
        );
      } else {
        setConversations(updatedConversations.filter((conv) => !conv.isGroup));
        setGroupConversations(
          updatedConversations.filter((conv) => conv.isGroup)
        );
      }
    }

    // Navigate to chat detail screen using the root navigator
    rootNavigation.navigate("ChatDetail", { conversation });
  };

  const handleConversationLongPress = (conversation: GroupConversation) => {
    const options: AlertButton[] = [
      {
        text: conversation.isPinned ? "Unpin Chat" : "Pin Chat",
        onPress: () => handleTogglePinChat(conversation),
      },
      {
        text: conversation.isArchived ? "Unarchive Chat" : "Archive Chat",
        onPress: () => handleToggleArchiveChat(conversation),
      },
      {
        text: conversation.isMuted ? "Unmute Chat" : "Mute Chat",
        onPress: () => handleToggleMuteChat(conversation),
      },
      {
        text: "Clear Chat",
        onPress: () => handleClearChat(conversation),
        style: "destructive",
      },
      {
        text: "Remove Chat",
        onPress: () => handleRemoveChat(conversation),
        style: "destructive",
      },
    ];

    // Add group-specific options
    if (conversation.isGroup) {
      if (conversation.createdBy === "User") {
        options.splice(2, 0, {
          text: "Manage Group",
          onPress: async () => handleManageGroup(conversation),
        });
      } else {
        options.splice(2, 0, {
          text: "Leave Group",
          onPress: async () => handleLeaveGroup(conversation),
        });
      }
    }

    options.push({
      text: "Cancel",
      style: "cancel",
      onPress: () => {},
    });

    Alert.alert(
      conversation.isGroup
        ? conversation.groupName || ""
        : conversation.username,
      "",
      options
    );
  };

  const handleManageGroup = (group: GroupConversation) => {
    Alert.alert("Manage Group", "", [
      {
        text: "Rename Group",
        onPress: () => renameGroup(group),
      },
      {
        text: "Manage Members",
        onPress: () => manageGroupMembers(group),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const renameGroup = (group: GroupConversation) => {
    // In a real app, this would open a dialog to rename the group
    Alert.alert("Rename Group", "This feature will be implemented soon!", [
      { text: "OK" },
    ]);
  };

  const manageGroupMembers = (group: GroupConversation) => {
    // In a real app, this would navigate to a screen to manage members
    Alert.alert("Manage Members", "This feature will be implemented soon!", [
      { text: "OK" },
    ]);
  };

  const handleLeaveGroup = (group: GroupConversation) => {
    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this group? You'll no longer receive messages from this group.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {},
        },
        {
          text: "Leave",
          onPress: () => {
            // In a real app, this would call an API to leave the group
            handleRemoveChat(group);
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleTogglePinChat = async (conversation: GroupConversation) => {
    const isPinned = conversation.isPinned || false;

    // Update the pin status in AsyncStorage
    await togglePinChat(conversation.id, isPinned);

    // Update the local state
    const currentList =
      activeTab === "chats" ? conversations : groupConversations;
    const updatedList = currentList.map((conv) => {
      if (conv.id === conversation.id) {
        return { ...conv, isPinned: !isPinned };
      }
      return conv;
    });

    if (activeTab === "chats") {
      setConversations(updatedList);
    } else {
      setGroupConversations(updatedList);
    }
  };

  const handleToggleArchiveChat = async (conversation: GroupConversation) => {
    const isArchived = conversation.isArchived || false;

    // Update the archive status in AsyncStorage
    await toggleArchiveChat(conversation.id, isArchived);

    // Update the local state
    const currentList =
      activeTab === "chats" ? conversations : groupConversations;
    const updatedList = currentList.map((conv) => {
      if (conv.id === conversation.id) {
        return { ...conv, isArchived: !isArchived };
      }
      return conv;
    });

    if (activeTab === "chats") {
      setConversations(updatedList);
    } else {
      setGroupConversations(updatedList);
    }

    // If we're currently showing archived chats and there are none left,
    // switch back to the normal list
    const currentArchivedCount = updatedList.filter(
      (conv) => conv.isArchived
    ).length;
    if (showArchived && currentArchivedCount === 0) {
      setShowArchived(false);
    }
  };

  const handleToggleMuteChat = async (conversation: GroupConversation) => {
    const isMuted = conversation.isMuted || false;

    // Update the mute status in AsyncStorage
    await toggleMuteChat(conversation.id, isMuted);

    // Update the local state
    const currentList =
      activeTab === "chats" ? conversations : groupConversations;
    const updatedList = currentList.map((conv) => {
      if (conv.id === conversation.id) {
        return { ...conv, isMuted: !isMuted };
      }
      return conv;
    });

    if (activeTab === "chats") {
      setConversations(updatedList);
    } else {
      setGroupConversations(updatedList);
    }
  };

  const handleClearChat = async (conversation: GroupConversation) => {
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
  };

  const handleRemoveChat = async (conversation: GroupConversation) => {
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

              const currentList =
                activeTab === "chats" ? conversations : groupConversations;
              const updatedList = currentList.filter(
                (conv) => conv.id !== conversation.id
              );

              if (activeTab === "chats") {
                setConversations(updatedList);
              } else {
                setGroupConversations(updatedList);
              }

              // Also remove from pinned or archived if present
              if (conversation.isPinned) {
                await togglePinChat(conversation.id, true);
              }

              if (conversation.isArchived) {
                await toggleArchiveChat(conversation.id, true);
              }

              // Update unread count if needed
              if (conversation.unread) {
                const allConversations = [
                  ...(activeTab === "chats" ? updatedList : conversations),
                  ...(activeTab === "groups"
                    ? updatedList
                    : groupConversations),
                ];
                await updateUnreadMessageCount(allConversations);
              }

              // If we're currently showing archived chats and there are none left,
              // switch back to the normal list
              const currentArchivedCount = updatedList.filter(
                (conv) => conv.isArchived
              ).length;
              if (showArchived && currentArchivedCount === 0) {
                setShowArchived(false);
              }
            } catch (error) {
              Alert.alert("Error", "Failed to remove chat. Please try again.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const toggleShowArchived = () => {
    setShowArchived(!showArchived);
  };

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    setShowArchived(false); // Reset archived view when switching tabs
  };

  const currentList =
    activeTab === "chats" ? conversations : groupConversations;

  const filteredConversations = currentList
    .filter((conversation) => {
      // Filter by search query
      const nameToSearch = conversation.isGroup
        ? conversation.groupName || conversation.username
        : conversation.username;

      const matchesSearch = nameToSearch
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Filter by archived status
      return (
        matchesSearch &&
        (showArchived ? conversation.isArchived : !conversation.isArchived)
      );
    })
    .sort((a, b) => {
      // Sort pinned conversations first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // Then sort by timestamp (this is simplified since our timestamps are strings)
      return 0; // In a real app, you'd parse and compare actual timestamps
    });

  const archivedCount = currentList.filter((conv) => conv.isArchived).length;

  // If there are no archived chats but showArchived is true, reset it
  useEffect(() => {
    if (showArchived && archivedCount === 0) {
      setShowArchived(false);
    }
  }, [archivedCount, showArchived]);

  const toggleSearchModal = () => {
    setSearchModalVisible(!searchModalVisible);
    setModalSearchQuery("");
    setModalActiveTab("users");
    setSearchResults([]);
    setGroupName("");
    setGroupDescription("");
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length >= 2) {
        setIsSearching(true);
        try {
          const results = await chatService.searchUsers(query);
          setSearchResults(results);
        } catch (error) {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 500),
    []
  );

  // Handle search query changes
  useEffect(() => {
    if (modalActiveTab === "users") {
      debouncedSearch(modalSearchQuery);
    }
  }, [modalSearchQuery, modalActiveTab, debouncedSearch]);

  // Simple debounce function
  function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const handleAddUser = (user: any) => {
    // Check if the user is already in the conversations list
    const existingUser = conversations.find(
      (conv) => conv.id === user.user_id || conv.id === user.id
    );

    if (existingUser) {
      Alert.alert("Already Added", "This user is already in your chats.");
      return;
    }

    // Create a new conversation with this user
    const newConversation: GroupConversation = {
      id: "0", // Use 0 for new chats (no room created yet)
      username: user.username || user.full_name || "Unknown User",
      lastMessage: "Start a conversation...",
      timestamp: "Just now",
      unread: false,
      distance: user.distance || "0km",
      isGroup: false,
      receiverId: user.user_id || user.id, // Store the actual user ID
      isNewChat: true, // Flag to indicate this is a new chat
    };

    setConversations([newConversation, ...conversations]);

    // Close the modal and navigate to the chat detail
    setSearchModalVisible(false);
    rootNavigation.navigate("ChatDetail", { conversation: newConversation });
  };

  const handleAddGroup = (group: any) => {
    // Check if the group is already in the group conversations list
    const existingGroup = groupConversations.find(
      (conv) => conv.id === group.id
    );

    if (existingGroup) {
      Alert.alert("Already Added", "This group is already in your chats.");
      return;
    }

    // Create a new group conversation
    const newGroupConversation: GroupConversation = {
      id: group.id,
      username: group.groupName,
      groupName: group.groupName,
      lastMessage: "You joined the group",
      timestamp: "Just now",
      unread: false,
      distance: group.distance,
      isGroup: true,
      members: [`${group.memberCount} members`],
      createdBy: "admin",
    };

    setGroupConversations([newGroupConversation, ...groupConversations]);

    // Close the modal and navigate to the chat detail
    setSearchModalVisible(false);
    rootNavigation.navigate("ChatDetail", {
      conversation: newGroupConversation,
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    setIsCreatingGroup(true);
    try {
      const response = await chatService.createGroup(
        groupName.trim(),
        groupDescription.trim()
      );

      if (response.status === "success" && response.record?.roomData) {
        const roomData = response.record.roomData;

        // Create a new group conversation from the response
        const newGroupConversation: GroupConversation = {
          id: response.record.roomId?.toString() || response.record.roomUUID,
          username: roomData.name || roomData.full_name,
          groupName: roomData.name || roomData.full_name,
          lastMessage: "Group created",
          timestamp: "Just now",
          unread: false,
          distance: "0km",
          isGroup: true,
          members: [roomData.participants || "1 participant"],
          createdBy: roomData.creator,
        };

        setGroupConversations([newGroupConversation, ...groupConversations]);

        // Close the modal and navigate to the chat detail
        setSearchModalVisible(false);
        rootNavigation.navigate("ChatDetail", {
          conversation: newGroupConversation,
        });

        Alert.alert("Success", "Group created successfully!");
      } else {
        throw new Error("Failed to create group");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create group. Please try again.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // Use search results instead of mock data
  const displayedUsers = modalSearchQuery.length >= 2 ? searchResults : [];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Messages
        </Text>
        <TouchableOpacity
          style={styles.newMessageButton}
          onPress={toggleSearchModal}
        >
          <Ionicons name="create-outline" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
        <Ionicons
          name="search"
          size={18}
          color={theme.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search conversations"
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery("")}
          >
            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.tabsContainer, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "chats" && [
              styles.activeTab,
              { backgroundColor: theme.primary },
            ],
          ]}
          onPress={() => switchTab("chats")}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme.textMuted },
              activeTab === "chats" && [
                styles.activeTabText,
                { color: "#FFFFFF" },
              ],
            ]}
          >
            Chats
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "groups" && [
              styles.activeTab,
              { backgroundColor: theme.primary },
            ],
          ]}
          onPress={() => switchTab("groups")}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme.textMuted },
              activeTab === "groups" && [
                styles.activeTabText,
                { color: "#FFFFFF" },
              ],
            ]}
          >
            Groups
          </Text>
        </TouchableOpacity>
      </View>

      {archivedCount > 0 && (
        <TouchableOpacity
          style={[styles.archivedBanner, { backgroundColor: theme.card }]}
          onPress={toggleShowArchived}
        >
          <Ionicons
            name={showArchived ? "chevron-down" : "chevron-forward"}
            size={18}
            color={theme.primary}
          />
          <Text style={[styles.archivedText, { color: theme.primary }]}>
            {showArchived ? "Hide" : "Show"} archived {activeTab} (
            {archivedCount})
          </Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text
            style={[
              styles.emptyStateText,
              { color: theme.text, marginTop: 16 },
            ]}
          >
            Loading chats...
          </Text>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name={
              activeTab === "chats" ? "chatbubbles-outline" : "people-outline"
            }
            size={50}
            color={theme.textMuted}
          />
          <Text style={[styles.emptyStateText, { color: theme.text }]}>
            {showArchived
              ? `No archived ${activeTab}`
              : searchQuery.length > 0
              ? "No conversations found"
              : activeTab === "chats"
              ? "No direct messages yet"
              : "No group chats yet"}
          </Text>
          {searchQuery.length > 0 ? (
            <Text
              style={[styles.emptyStateSubtext, { color: theme.textMuted }]}
            >
              Try a different search term
            </Text>
          ) : !showArchived ? (
            <Text
              style={[styles.emptyStateSubtext, { color: theme.textMuted }]}
            >
              {activeTab === "chats"
                ? "Start a new conversation with people nearby"
                : "Create or join a group chat"}
            </Text>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              onPress={() => handleConversationPress(item)}
              onLongPress={() => handleConversationLongPress(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.conversationsList}
          refreshing={loading}
          onRefresh={() => {
            // Refresh chat rooms
            setLoading(true);
            loadChatRooms();
          }}
        />
      )}

      {/* Search Modal */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        onRequestClose={toggleSearchModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            style={[
              styles.modalContainer,
              { paddingTop: insets.top, backgroundColor: theme.background },
            ]}
          >
            <StatusBar
              barStyle={
                theme.statusBar === "light" ? "light-content" : "dark-content"
              }
            />
            <View
              style={[styles.modalHeader, { borderBottomColor: theme.border }]}
            >
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={toggleSearchModal}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                New Message
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <View
              style={[
                styles.modalSearchContainer,
                { backgroundColor: theme.card },
              ]}
            >
              <Ionicons
                name="search"
                size={18}
                color={theme.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.modalSearchInput, { color: theme.text }]}
                placeholder={
                  modalActiveTab === "users"
                    ? "Search users (minimum 2 characters)"
                    : "Group creation"
                }
                placeholderTextColor={theme.textMuted}
                value={modalSearchQuery}
                onChangeText={setModalSearchQuery}
                autoFocus
                editable={modalActiveTab === "users"}
              />
              {modalSearchQuery.length > 0 && modalActiveTab === "users" && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setModalSearchQuery("")}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={theme.textMuted}
                  />
                </TouchableOpacity>
              )}
            </View>

            <View
              style={[styles.tabsContainer, { backgroundColor: theme.card }]}
            >
              <TouchableOpacity
                style={[
                  styles.tab,
                  modalActiveTab === "users" && [
                    styles.activeTab,
                    { backgroundColor: theme.primary },
                  ],
                ]}
                onPress={() => {
                  setModalActiveTab("users");
                  setModalSearchQuery("");
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: theme.textMuted },
                    modalActiveTab === "users" && [
                      styles.activeTabText,
                      { color: "#FFFFFF" },
                    ],
                  ]}
                >
                  Users
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  modalActiveTab === "groups" && [
                    styles.activeTab,
                    { backgroundColor: theme.primary },
                  ],
                ]}
                onPress={() => {
                  setModalActiveTab("groups");
                  setModalSearchQuery("");
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: theme.textMuted },
                    modalActiveTab === "groups" && [
                      styles.activeTabText,
                      { color: "#FFFFFF" },
                    ],
                  ]}
                >
                  Groups
                </Text>
              </TouchableOpacity>
            </View>

            {modalActiveTab === "users" ? (
              <View style={styles.usersTabContainer}>
                {isSearching ? (
                  <View style={styles.centeredMessageContainer}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text
                      style={[
                        styles.centeredMessageText,
                        { color: theme.textMuted },
                      ]}
                    >
                      Searching users...
                    </Text>
                  </View>
                ) : displayedUsers.length === 0 ? (
                  <View style={styles.centeredMessageContainer}>
                    <Ionicons name="search" size={40} color={theme.textMuted} />
                    <Text
                      style={[
                        styles.centeredMessageText,
                        { color: theme.text },
                      ]}
                    >
                      {modalSearchQuery.length >= 2
                        ? "No users found"
                        : modalSearchQuery.length > 0
                        ? "Type at least 2 characters to search"
                        : "Search for users nearby"}
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={displayedUsers}
                    keyExtractor={(item, index) =>
                      item.user_id || item.id || index.toString()
                    }
                    renderItem={({ item }) => (
                      <TouchableHighlight
                        underlayColor={theme.card}
                        style={[
                          styles.searchResultItem,
                          { backgroundColor: theme.background },
                        ]}
                        onPress={() => handleAddUser(item)}
                      >
                        <View style={styles.searchResultContent}>
                          <View
                            style={[
                              styles.avatarContainer,
                              { backgroundColor: theme.primary },
                            ]}
                          >
                            <Text style={styles.avatarText}>
                              {(item.username ||
                                item.full_name ||
                                "U")[0].toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.searchResultInfo}>
                            <Text
                              style={[
                                styles.searchResultName,
                                { color: theme.text },
                              ]}
                            >
                              {item.full_name ||
                                item.username ||
                                "Unknown User"}
                            </Text>
                            <Text
                              style={[
                                styles.searchResultDistance,
                                { color: theme.textMuted },
                              ]}
                            >
                              @{item.username || "unknown"}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => handleAddUser(item)}
                          >
                            <Ionicons
                              name="add-circle"
                              size={24}
                              color={theme.primary}
                            />
                          </TouchableOpacity>
                        </View>
                      </TouchableHighlight>
                    )}
                  />
                )}
              </View>
            ) : (
              <KeyboardAvoidingView
                style={styles.groupCreationContainer}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={0}
              >
                <ScrollView
                  ref={scrollViewRef}
                  style={styles.groupCreationScrollView}
                  contentContainerStyle={styles.groupCreationContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text
                    style={[styles.groupCreationTitle, { color: theme.text }]}
                  >
                    Create New Group
                  </Text>
                  <Text
                    style={[
                      styles.groupCreationSubtitle,
                      { color: theme.textMuted },
                    ]}
                  >
                    Start a new group conversation
                  </Text>

                  <View
                    style={[styles.formGroup, { backgroundColor: theme.card }]}
                  >
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Group Name *
                    </Text>
                    <TextInput
                      style={[
                        styles.formInput,
                        { color: theme.text, borderColor: theme.border },
                      ]}
                      placeholder="Enter group name"
                      placeholderTextColor={theme.textMuted}
                      value={groupName}
                      onChangeText={setGroupName}
                      maxLength={50}
                      returnKeyType="next"
                      onSubmitEditing={() => {
                        descriptionInputRef.current?.focus();
                        // Scroll to show the description field fully
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({
                            animated: true,
                          });
                        }, 100);
                      }}
                    />
                  </View>

                  <View
                    style={[styles.formGroup, { backgroundColor: theme.card }]}
                  >
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Description (Optional)
                    </Text>
                    <TextInput
                      ref={descriptionInputRef}
                      style={[
                        styles.formTextArea,
                        { color: theme.text, borderColor: theme.border },
                      ]}
                      placeholder="Enter group description"
                      placeholderTextColor={theme.textMuted}
                      value={groupDescription}
                      onChangeText={setGroupDescription}
                      multiline
                      numberOfLines={3}
                      maxLength={200}
                      returnKeyType="done"
                      textAlignVertical="top"
                      blurOnSubmit={true}
                      onSubmitEditing={() => {
                        Keyboard.dismiss();
                      }}
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.createGroupButton,
                      { backgroundColor: theme.primary },
                      (!groupName.trim() || isCreatingGroup) &&
                        styles.createGroupButtonDisabled,
                    ]}
                    onPress={handleCreateGroup}
                    disabled={!groupName.trim() || isCreatingGroup}
                  >
                    {isCreatingGroup ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.createGroupButtonText}>
                        Create Group
                      </Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </KeyboardAvoidingView>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  newMessageButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTab: {},
  tabText: {
    fontWeight: "500",
  },
  activeTabText: {
    fontWeight: "600",
  },
  archivedBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  archivedText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  conversationsList: {
    paddingHorizontal: 16,
  },
  conversationItem: {
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "transparent", // Will be overridden by theme
  },
  conversationInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  pinnedConversation: {},
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    position: "relative",
  },
  groupAvatarContainer: {},
  avatarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  unreadBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  usernameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pinIcon: {
    marginRight: 4,
  },
  username: {
    fontWeight: "600",
    fontSize: 16,
    flex: 1,
  },
  adminBadge: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
    overflow: "hidden",
  },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timestamp: {
    fontSize: 12,
  },
  mutedIcon: {
    marginRight: 4,
  },
  messagePreviewContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  messagePreview: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {},
  distance: {
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    height: 56,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 10,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  searchResultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchResultContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultName: {
    fontWeight: "600",
    fontSize: 16,
  },
  searchResultDistance: {
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    padding: 4,
  },
  emptySearchResults: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptySearchText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  groupCreationContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  groupCreationScrollView: {
    flex: 1,
  },
  groupCreationContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  groupCreationTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  groupCreationSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
  },
  formGroup: {
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  formInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  formTextArea: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "transparent",
    textAlignVertical: "top",
    minHeight: 80,
  },
  createGroupButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  createGroupButtonDisabled: {
    opacity: 0.6,
  },
  createGroupButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  usersTabContainer: {
    flex: 1,
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  centeredMessageText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
  },
});

export default ChatScreen;
