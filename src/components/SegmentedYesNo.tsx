import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { colors, spacing, typography } from "../theme";

type Side = "yes" | "no";

type SegmentedYesNoProps = {
  value: Side;
  onChange: (value: Side) => void;
};

export const SegmentedYesNo = ({ value, onChange }: SegmentedYesNoProps) => {
  const [width, setWidth] = useState(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    const segmentWidth = width / 2;
    translateX.value = withTiming(value === "yes" ? 0 : segmentWidth, {
      duration: 180,
    });
  }, [value, width, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={styles.container}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <Animated.View
        style={[
          styles.indicator,
          { width: width / 2 || 0 },
          indicatorStyle,
        ]}
      />
      <Pressable style={styles.segment} onPress={() => onChange("yes")}>
        <Text
          style={[
            styles.segmentText,
            value === "yes" && styles.segmentTextActive,
          ]}
        >
          YES (Over)
        </Text>
      </Pressable>
      <Pressable style={styles.segment} onPress={() => onChange("no")}>
        <Text
          style={[
            styles.segmentText,
            value === "no" && styles.segmentTextActive,
          ]}
        >
          NO (Under)
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
    overflow: "hidden",
  },
  indicator: {
    position: "absolute",
    left: 0,
    top: spacing.xs,
    bottom: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.surfaceElevated,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  segmentText: {
    ...typography.pill,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.textPrimary,
  },
});
