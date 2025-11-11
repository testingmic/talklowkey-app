import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

// This file is kept for compatibility with imports,
// but with NativeWind v2 we'll just use the className prop directly on React Native components.
export {};

// No need to export styled components for NativeWind v2

// Utility function to parse HTML content and extract hashtags
export const parsePostContent = (htmlContent: string): string => {
  if (!htmlContent) return "";

  // Replace hashtag anchor tags with just the hashtag text
  let cleanContent = htmlContent.replace(
    /<a[^>]*href="\/posts\/tags\/[^"]*"[^>]*>(#[^<]+)<\/a>/gi,
    "$1"
  );

  // Remove any other HTML tags that might be present
  cleanContent = cleanContent.replace(/<[^>]*>/g, "");

  // Decode HTML entities
  cleanContent = cleanContent
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  return cleanContent.trim();
};

// Function to extract hashtags from content for highlighting
export const extractHashtags = (content: string): string[] => {
  const hashtagRegex = /#[\w]+/g;
  const matches = content.match(hashtagRegex) || [];
  return matches.map((tag) => tag.toLowerCase());
};

// Simple function to return clean text (use PostContent component for styled rendering)
export const renderPostContent = (htmlContent: string): string => {
  return parsePostContent(htmlContent);
};
