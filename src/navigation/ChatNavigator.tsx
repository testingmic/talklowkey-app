import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChatScreen from "../screens/chat/ChatScreen";
import { useTheme } from "../contexts/ThemeContext";

// Enhanced conversation type with group chat support
export type EnhancedConversation = {
  id: string;
  username: string;
  full_name?: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  distance: string;
  isPinned?: boolean;
  isArchived?: boolean;
  isMuted?: boolean;
  isGroup?: boolean;
  members?: string[];
  groupName?: string;
  createdBy?: string;
};

export type ChatStackParamList = {
  ChatScreen: undefined;
};

const Stack = createNativeStackNavigator<ChatStackParamList>();

const ChatNavigator = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
    </Stack.Navigator>
  );
};

export default ChatNavigator;
