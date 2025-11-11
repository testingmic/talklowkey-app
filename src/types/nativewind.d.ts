/// <reference types="nativewind/types" />

declare module "nativewind" {
  import { StyleSheet } from "react-native";

  export const NativeWindStyleSheet: {
    create: typeof StyleSheet.create;
    setColorScheme: (colorScheme: "light" | "dark" | "system" | null) => void;
  };
}
