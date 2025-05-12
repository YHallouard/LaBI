import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, Easing } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { AppImage } from "./AppImage";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface LoadingOverlayProps {
  onFinish?: () => void;
  progressDuration?: number;
  fadeDuration?: number;
}

export const LoadingOverlay = ({
  onFinish,
  progressDuration = 1000,
  fadeDuration = 300,
}: LoadingOverlayProps) => {
  const progress = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const circumference = 2 * Math.PI * 88;

  useEffect(() => {
    const progressConfig = {
      toValue: 1,
      duration: progressDuration,
      easing: Easing.inOut(Easing.exp),
      useNativeDriver: true, // Platform.OS === 'ios',
      isInteraction: false,
    };

    const fadeConfig = {
      toValue: 0,
      duration: fadeDuration,
      easing: Easing.linear,
      useNativeDriver: true,
      isInteraction: false,
    };

    Animated.sequence([
      Animated.timing(progress, progressConfig),
      Animated.timing(opacity, fadeConfig),
    ]).start(({ finished }) => {
      if (finished && onFinish) onFinish();
    });

    // if (Platform.OS === 'android') {
    //   // const progressAnim = Animated.timing(progress, progressConfig);
    //   //
    //   // // Start progress animation
    //   // progressAnim.start();
    //   //
    //   // // Start fade animation after progress is mostly done
    //   // const fadeDelay = setTimeout(() => {
    //   //   Animated.timing(opacity, fadeConfig).start(({ finished }) => {
    //   //     if (finished && onFinish) onFinish();
    //   //   });
    //   // }, progressDuration - 100);
    //   //
    //   // return () => clearTimeout(fadeDelay);
    //   Animated.sequence([
    //     Animated.timing(progress, progressConfig),
    //     Animated.timing(opacity, fadeConfig),
    //   ]).start(({ finished }) => {
    //     if (finished && onFinish) onFinish();
    //   });
    // } else {
    //   // iOS sequence animation
    //   Animated.sequence([
    //     Animated.timing(progress, progressConfig),
    //     Animated.timing(opacity, fadeConfig),
    //   ]).start(({ finished }) => {
    //     if (finished && onFinish) onFinish();
    //   });
    // }
  }, [progress, opacity, onFinish, progressDuration, fadeDuration]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.container, { opacity }]}
    >
      <View style={styles.logoContainer}>
        <Svg width={180} height={180} style={styles.progressCircle}>
          <Circle
            cx={90}
            cy={90}
            r={88}
            stroke="#f0f0f0"
            strokeWidth={4}
            fill="none"
          />
          <AnimatedCircle
            cx={90}
            cy={90}
            r={88}
            stroke="#e63757"
            strokeWidth={4}
            fill="none"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90, 90, 90)"
          />
        </Svg>
        <AppImage
          imagePath="adaptive-icon"
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fb",
    zIndex: 100,
  },
  logoContainer: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  progressCircle: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 10,
  },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 100,
    zIndex: 5,
  },
});
