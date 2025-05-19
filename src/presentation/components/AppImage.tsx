import React from "react";
import { Image, ImageProps, ImageSourcePropType } from "react-native";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const adaptiveIcon = require("../../../assets/adaptive-icon.png");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const loadingIcon = require("../../../assets/loading-icon.png");

type AppImageProps = Omit<ImageProps, "source"> & {
  imagePath: "adaptive-icon" | "loading-icon";
};

const imageSources: Record<string, ImageSourcePropType> = {
  "adaptive-icon": adaptiveIcon,
  "loading-icon": loadingIcon,
};

export const AppImage: React.FC<AppImageProps> = ({ imagePath, ...props }) => {
  return <Image source={imageSources[imagePath]} {...props} />;
};
