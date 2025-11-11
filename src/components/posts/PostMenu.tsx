import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Post } from "../../screens/home/PostDetailScreen";
import { useTheme } from "../../contexts/ThemeContext";

type PostMenuProps = {
  post: Post;
  onViewPost: () => void;
  onSavePost: () => void;
  onDeletePost: () => void;
  onReportPost: (reason: string) => void;
  onHidePost: () => void;
  isVisible: boolean;
  onClose: () => void;
  menuPosition?: { x: number; y: number }; // Position for better placement
};

// Report categories
const REPORT_CATEGORIES = {
  inappropriate: "Inappropriate Content",
  spam: "Unwanted commercial content",
  harassment: "Bullying or abusive behavior",
  misinformation: "False or misleading information",
  violence: "Threats or violent content",
};

const PostMenu = ({
  post,
  onViewPost,
  onSavePost,
  onDeletePost,
  onReportPost,
  onHidePost,
  isVisible,
  onClose,
  menuPosition,
}: PostMenuProps) => {
  const { theme } = useTheme();
  const [showReportModal, setShowReportModal] = useState(false);
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  const handleDeletePress = () => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: onDeletePost,
          style: "destructive",
        },
      ]
    );
    onClose();
  };

  const handleReportPress = () => {
    setShowReportModal(true);
  };

  const handleReportSubmit = (reason: string) => {
    setShowReportModal(false);
    onClose();
    onReportPost(reason);
    Alert.alert(
      "Report Submitted",
      "Thank you for reporting this post. We'll review it shortly."
    );
  };

  const handleHidePress = () => {
    onHidePost();
    onClose();
  };

  // Calculate menu position - place it closer to the clicked element
  const getMenuStyle = () => {
    if (!menuPosition) {
      return styles.menuContainer;
    }

    const menuWidth = screenWidth * 0.7; // 70% of screen width
    const menuHeight = 300; // Approximate height

    // Calculate position to keep menu on screen
    let left = menuPosition.x - menuWidth / 2;
    let top = menuPosition.y + 20; // Slightly below the clicked element

    // Adjust if menu would go off screen
    if (left < 20) left = 20;
    if (left + menuWidth > screenWidth - 20)
      left = screenWidth - menuWidth - 20;
    if (top + menuHeight > screenHeight - 100)
      top = menuPosition.y - menuHeight - 20;

    return {
      ...styles.menuContainer,
      position: "absolute" as const,
      left,
      top,
      width: menuWidth,
    };
  };

  return (
    <>
      <Modal
        transparent
        visible={isVisible && !showReportModal}
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[getMenuStyle(), { backgroundColor: theme.card }]}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onViewPost();
                    onClose();
                  }}
                >
                  <Ionicons name="eye-outline" size={22} color={theme.text} />
                  <Text style={[styles.menuItemText, { color: theme.text }]}>
                    View Post
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onSavePost();
                    onClose();
                  }}
                >
                  <Ionicons
                    name="bookmark-outline"
                    size={22}
                    color={theme.text}
                  />
                  <Text style={[styles.menuItemText, { color: theme.text }]}>
                    Save Post
                  </Text>
                </TouchableOpacity>

                {/* Hide Post - always available */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleHidePress}
                >
                  <Ionicons
                    name="eye-off-outline"
                    size={22}
                    color={theme.text}
                  />
                  <Text style={[styles.menuItemText, { color: theme.text }]}>
                    Hide Post
                  </Text>
                </TouchableOpacity>

                {/* Report Post - only show if report is available */}
                {post.manage?.report && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleReportPress}
                  >
                    <Ionicons
                      name="flag-outline"
                      size={22}
                      color={theme.error}
                    />
                    <Text style={[styles.menuItemText, { color: theme.error }]}>
                      Report Post
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Delete Post - only show if user can delete */}
                {post.manage?.delete && (
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
                      Delete Post
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Report Modal */}
      <Modal
        transparent
        visible={showReportModal}
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowReportModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[styles.reportModal, { backgroundColor: theme.card }]}
              >
                <View
                  style={[
                    styles.reportHeader,
                    { borderBottomColor: theme.border },
                  ]}
                >
                  <Text style={[styles.reportTitle, { color: theme.text }]}>
                    Report Post
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowReportModal(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.reportContent}>
                  <Text
                    style={[styles.reportSubtitle, { color: theme.textMuted }]}
                  >
                    Why are you reporting this post?
                  </Text>

                  {Object.entries(REPORT_CATEGORIES).map(([key, label]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.reportOption,
                        { borderBottomColor: theme.border },
                      ]}
                      onPress={() => handleReportSubmit(key)}
                    >
                      <View style={styles.reportOptionContent}>
                        <Text
                          style={[
                            styles.reportOptionText,
                            { color: theme.text },
                          ]}
                        >
                          {label}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={theme.textMuted}
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
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
    width: "70%",
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
  reportModal: {
    borderRadius: 12,
    width: "90%",
    maxHeight: "70%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  reportContent: {
    padding: 16,
  },
  reportSubtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  reportOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  reportOptionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reportOptionText: {
    fontSize: 16,
    flex: 1,
  },
});

export default PostMenu;
