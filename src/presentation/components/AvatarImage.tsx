import React from "react";
import { Image, ImageStyle, View, Text, StyleSheet } from "react-native";

interface AvatarImageProps {
  profileImage?: string;
  firstName?: string;
  lastName?: string;
  style?: ImageStyle;
}

const AvatarImage: React.FC<AvatarImageProps> = ({
  profileImage,
  firstName = "",
  lastName = "",
  style,
}) => {
  if (profileImage) {
    return (
      <Image
        source={{ uri: profileImage }}
        style={[styles.imageContainer, style]}
      />
    );
  } else {
    const initials = `${firstName.charAt(0)}${lastName.charAt(
      0
    )}`.toUpperCase();
    return (
      <View style={[styles.imageContainer, styles.initialsContainer, style]}>
        <Text style={styles.initialsText}>{initials}</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  imageContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  initialsContainer: {
    backgroundColor: "#2c7be5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#f1f4f8",
  },
  initialsText: {
    color: "white",
    fontSize: 24, // Adjusted for smaller avatar
    fontWeight: "bold",
  },
});

export default AvatarImage;
