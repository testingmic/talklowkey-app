import AsyncStorage from "@react-native-async-storage/async-storage";
import { EnhancedConversation } from "../navigation/ChatNavigator";

// Storage keys
export const PINNED_CHATS_KEY = "whispernet_pinned_chats";
export const ARCHIVED_CHATS_KEY = "whispernet_archived_chats";
export const MUTED_CHATS_KEY = "whispernet_muted_chats";
export const UNREAD_COUNT_KEY = "unread_message_count";

/**
 * Updates the unread message count badge
 * @param conversations - All conversations (both direct and group)
 */
export const updateUnreadMessageCount = async (
  conversations: EnhancedConversation[]
): Promise<number> => {
  try {
    const unreadCount = conversations.filter((conv) => conv.unread).length;
    await AsyncStorage.setItem(UNREAD_COUNT_KEY, unreadCount.toString());
    return unreadCount;
  } catch (error) {
    return 0;
  }
};

/**
 * Marks a conversation as read and updates the unread count
 * @param conversation - The conversation to mark as read
 * @param allConversations - All conversations to recalculate the unread count
 */
export const markConversationAsRead = async (
  conversation: EnhancedConversation,
  allConversations: EnhancedConversation[]
): Promise<EnhancedConversation[]> => {
  // Create a new array with the conversation marked as read
  const updatedConversations = allConversations.map((conv) => {
    if (conv.id === conversation.id) {
      return { ...conv, unread: false };
    }
    return conv;
  });

  // Update the unread count
  await updateUnreadMessageCount(updatedConversations);

  return updatedConversations;
};

/**
 * Gets all pinned chat IDs from storage
 */
export const getPinnedChats = async (): Promise<string[]> => {
  try {
    const pinnedChatsJSON = await AsyncStorage.getItem(PINNED_CHATS_KEY);
    return pinnedChatsJSON ? JSON.parse(pinnedChatsJSON) : [];
  } catch (error) {
    return [];
  }
};

/**
 * Gets all archived chat IDs from storage
 */
export const getArchivedChats = async (): Promise<string[]> => {
  try {
    const archivedChatsJSON = await AsyncStorage.getItem(ARCHIVED_CHATS_KEY);
    return archivedChatsJSON ? JSON.parse(archivedChatsJSON) : [];
  } catch (error) {
    return [];
  }
};

/**
 * Toggles the pinned status of a conversation
 * @param chatId - The ID of the chat to toggle
 * @param isPinned - Whether the chat is currently pinned
 */
export const togglePinChat = async (
  chatId: string,
  isPinned: boolean
): Promise<void> => {
  try {
    const pinnedChats = await getPinnedChats();

    let updatedPinnedChats: string[];
    if (isPinned) {
      updatedPinnedChats = pinnedChats.filter((id) => id !== chatId);
    } else {
      updatedPinnedChats = [...pinnedChats, chatId];
    }

    await AsyncStorage.setItem(
      PINNED_CHATS_KEY,
      JSON.stringify(updatedPinnedChats)
    );
  } catch (error) {
    //  error toggling pin status
  }
};

/**
 * Toggles the archived status of a conversation
 * @param chatId - The ID of the chat to toggle
 * @param isArchived - Whether the chat is currently archived
 */
export const toggleArchiveChat = async (
  chatId: string,
  isArchived: boolean
): Promise<void> => {
  try {
    const archivedChats = await getArchivedChats();

    let updatedArchivedChats: string[];
    if (isArchived) {
      updatedArchivedChats = archivedChats.filter((id) => id !== chatId);
    } else {
      updatedArchivedChats = [...archivedChats, chatId];
    }

    await AsyncStorage.setItem(
      ARCHIVED_CHATS_KEY,
      JSON.stringify(updatedArchivedChats)
    );
  } catch (error) {
    //  error toggling archive status
  }
};

/**
 * Gets all muted chat IDs from storage
 */
export const getMutedChats = async (): Promise<string[]> => {
  try {
    const mutedChatsJSON = await AsyncStorage.getItem(MUTED_CHATS_KEY);
    return mutedChatsJSON ? JSON.parse(mutedChatsJSON) : [];
  } catch (error) {
    //  error getting muted chats
    return [];
  }
};

/**
 * Toggles the muted status of a conversation
 * @param chatId - The ID of the chat to toggle
 * @param isMuted - Whether the chat is currently muted
 */
export const toggleMuteChat = async (
  chatId: string,
  isMuted: boolean
): Promise<void> => {
  try {
    const mutedChats = await getMutedChats();

    let updatedMutedChats: string[];
    if (isMuted) {
      updatedMutedChats = mutedChats.filter((id) => id !== chatId);
    } else {
      updatedMutedChats = [...mutedChats, chatId];
    }

    await AsyncStorage.setItem(
      MUTED_CHATS_KEY,
      JSON.stringify(updatedMutedChats)
    );
  } catch (error) {
    //  error toggling mute status
  }
};
 