import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme";

export const VigInfoTooltip = () => {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setOpen((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel="Probability info"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.icon}
      >
        <Text style={styles.iconText}>i</Text>
      </Pressable>
      {open && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>
            Probabilities shown are normalized from DK odds (vig removed).
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
  },
  icon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  tooltip: {
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 220,
  },
  tooltipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
