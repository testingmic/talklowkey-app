import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { parsePostContent } from "../../utils/styleUtils";

interface PostContentProps {
  htmlContent: string;
  theme: any;
  onHashtagPress?: (hashtag: string) => void;
  style?: any;
}

const PostContent: React.FC<PostContentProps> = ({
  htmlContent,
  theme,
  onHashtagPress,
  style,
}) => {
  const cleanContent = parsePostContent(htmlContent);
  const parts = cleanContent.split(/(#[\w]+)/g);

  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (part.match(/^#[\w]+$/)) {
          // This is a hashtag - make it clickable and styled
          return (
            <Text
              key={index}
              style={{ color: theme.primary, fontWeight: "600" }}
              onPress={() => onHashtagPress?.(part)}
            >
              {part}
            </Text>
          );
        } else {
          // Regular text
          return (
            <Text key={index} style={{ color: theme.text }}>
              {part}
            </Text>
          );
        }
      })}
    </Text>
  );
};

export default PostContent;
 