import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, ViewProps } from "react-native";

interface AnimatedFadeInProps extends ViewProps {
  delay?: number;
  duration?: number;
  slideUp?: boolean;
  children: React.ReactNode;
}

export function AnimatedFadeIn({
  delay = 0,
  duration = 300,
  slideUp = true,
  children,
  style,
  ...rest
}: AnimatedFadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(slideUp ? 16 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[{ opacity, transform: [{ translateY }] }, style]}
      {...rest}
    >
      {children}
    </Animated.View>
  );
}
