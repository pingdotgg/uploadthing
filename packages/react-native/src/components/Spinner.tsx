import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  type StyleProp,
  View,
  type ViewProps,
} from "react-native";

export const Spinner = (
  { style }: { style?: ViewProps["style"] } = { style: {} }
) => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start(() => {
      spinAnim.setValue(0);
    });

    return () => {
      loop.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={{
        transform: [
          {
            rotate: spin,
          },
        ],
      }}
    >
      <View
        style={[
          {
            width: 20,
            height: 20,
            borderWidth: 2,
            borderColor: "white",
            borderRadius: 10,
            borderStyle: "solid",
            borderTopColor: "transparent",
          },
          style,
        ]}
      />
    </Animated.View>
  );
};

Spinner.displayName = "Spinner";
