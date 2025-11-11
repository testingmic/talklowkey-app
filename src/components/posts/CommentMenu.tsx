import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Comment } from "../../screens/home/PostDetailScreen";
import { useTheme } from "../../contexts/ThemeContext";

type CommentMenuProps = {
  comment: Comment;
  onDeleteComment: () => void;
  isVisible: boolean;
  onClose: () => void;
};

const CommentMenu = ({
  comment,
  onDeleteComment,
  isVisible,
  onClose,
}: CommentMenuProps) => {
  const { theme } = useTheme();

  const handleDeletePress = () => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: onDeleteComment,
          style: "destructive",
        },
      ]
    );
    onClose();
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View
              style={[styles.menuContainer, { backgroundColor: theme.card }]}
            >
              {comment.manage?.delete && (
                <TouchableOpacity
                  style={[styles.menuItem, styles.deleteItem]}
                  onPress={handleDeletePress}
                >
                  <Ionicons
                    name="trash-outline"
                    size={22}
                    color={theme.error}
                  />
                  <Text style={[styles.menuItemText, { color: theme.error }]}>
                    Delete Comment
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    borderRadius: 12,
    width: "80%",
    padding: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
  deleteItem: {
    marginTop: 4,
  },
});

export default CommentMenu;
