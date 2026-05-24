import React, { useRef, useEffect } from "react";
import { Animated, ViewStyle } from "react-native";

type ZoomInWrapperProps = {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
  initialScale?: number;
  finalScale?: number;
};

export const ZoomInWrapper: React.FC<ZoomInWrapperProps> = ({
  children,
  duration = 800,
  delay = 0,
  style,
  initialScale = 0.98,
  finalScale = 1,
}) => {
  const scaleAnim = useRef(new Animated.Value(initialScale)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: finalScale,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: duration * 0.3,
        delay,
        useNativeDriver: true,
      }),
    ]);

    animation.start();
  }, [scaleAnim, opacityAnim, duration, delay, finalScale]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};
