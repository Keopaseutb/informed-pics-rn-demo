import { memo } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing } from "../theme";

type FavoriteToggleProps = {
  isFavorite: boolean;
  onToggle: () => void;
  /** Accessible label for the favorite star context (e.g. player name) */
  marketLabel: string;
};

export const FavoriteToggle = memo(
  ({ isFavorite, onToggle, marketLabel }: FavoriteToggleProps) => {
    const label = isFavorite
      ? `Remove ${marketLabel} from favorites`
      : `Add ${marketLabel} to favorites`;

    return (
      <Pressable
        onPress={onToggle}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={({ pressed }) => [styles.hitArea, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={
          isFavorite
            ? "Removes this market from your favorites"
            : "Saves this market to your favorites"
        }
        accessibilityState={{ selected: isFavorite }}
      >
        <Ionicons
          name={isFavorite ? "star" : "star-outline"}
          size={26}
          color={isFavorite ? colors.yesGreen : colors.textSecondary}
        />
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  hitArea: {
    padding: spacing.xs,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 44,
    minHeight: 44,
  },
  pressed: {
    opacity: 0.7,
  },
});
