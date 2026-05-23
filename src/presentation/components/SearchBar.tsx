import React, { useRef } from "react";
import {
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { colorPalette, glass } from "../../config/themes";
import { GlassSurface } from "./glass/GlassSurface";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Rechercher...",
  autoFocus = false,
  style,
}) => {
  const inputRef = useRef<TextInput>(null);
  const focused = useSharedValue(0);
  const clearOpacity = useSharedValue(0);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: focused.value === 1
      ? colorPalette.primary.main
      : "rgba(255,255,255,0.35)",
    borderWidth: focused.value === 1 ? 1.5 : 1,
  }));

  const clearStyle = useAnimatedStyle(() => ({
    opacity: clearOpacity.value,
  }));

  const handleFocus = () => {
    focused.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    focused.value = withTiming(0, { duration: 200 });
  };

  const handleChangeText = (text: string) => {
    clearOpacity.value = withTiming(text.length > 0 ? 1 : 0, { duration: 150 });
    onChangeText(text);
  };

  const handleClear = () => {
    clearOpacity.value = withTiming(0, { duration: 150 });
    onChangeText("");
    inputRef.current?.focus();
  };

  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View style={[styles.container, borderStyle]}>
        <GlassSurface
          intensity={glass.blur.thin}
          tint="light"
          radius={glass.radii.pill}
          overlayColor={glass.overlay.solid}
          style={styles.surface}
        >
          <Ionicons
            name="search"
            size={18}
            color={colorPalette.neutral.light}
            style={styles.icon}
          />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colorPalette.neutral.light}
            value={value}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            returnKeyType="search"
            autoFocus={autoFocus}
            autoCorrect={false}
          />
          <Animated.View style={clearStyle}>
            <TouchableOpacity onPress={handleClear} hitSlop={8}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colorPalette.neutral.light}
              />
            </TouchableOpacity>
          </Animated.View>
        </GlassSurface>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  container: {
    borderRadius: glass.radii.pill,
    shadowColor: glass.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  surface: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 0,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colorPalette.neutral.main,
  },
});
