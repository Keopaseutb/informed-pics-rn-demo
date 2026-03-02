import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, cardShadow, spacing, typography } from "../theme";
import { OddsPill } from "./OddsPill";

type MarketCardProps = {
  propId: number;
  playerName: string;
  category: string;
  question: string;
  line: number;
  unit: string | null;
  yesOddsAmerican: number;
  noOddsAmerican: number;
  yesProbNorm: number;
  noProbNorm: number;
  fixedHeight: boolean;
  onPress: (propId: number) => void;
};

export const MarketCard = memo(
  ({
    propId,
    playerName,
    category,
    question,
    line,
    unit,
    yesOddsAmerican,
    noOddsAmerican,
    yesProbNorm,
    noProbNorm,
    fixedHeight,
    onPress,
  }: MarketCardProps) => {
    const lineLabel = unit ? `${line} ${unit}` : `${line}`;
    const handlePress = () => onPress(propId);
    const accessibilityLabel = `${playerName}. ${category}. Line ${lineLabel}. Yes ${yesOddsAmerican}. No ${noOddsAmerican}.`;

    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.container,
          fixedHeight && styles.fixedHeight,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Opens market detail"
      >
        <View>
          <Text style={styles.player}>{playerName}</Text>
          <Text style={styles.category}>{category}</Text>
          <Text style={styles.question} numberOfLines={2}>
            {question}
          </Text>
          <Text style={styles.lineLabel}>Line: {lineLabel}</Text>
        </View>

        <View style={styles.pills}>
          <OddsPill
            side="yes"
            oddsAmerican={yesOddsAmerican}
            probability={yesProbNorm}
            tintColor={colors.yesGreen}
            accessibilityLabel={`Yes over, ${yesOddsAmerican} odds, ${Math.round(
              yesProbNorm * 1000
            ) / 10} percent`}
          />
          <OddsPill
            side="no"
            oddsAmerican={noOddsAmerican}
            probability={noProbNorm}
            tintColor={colors.noRed}
            accessibilityLabel={`No under, ${noOddsAmerican} odds, ${Math.round(
              noProbNorm * 1000
            ) / 10} percent`}
          />
        </View>
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  fixedHeight: {
    height: 210,
    justifyContent: "space-between",
  },
  pressed: {
    opacity: 0.9,
  },
  player: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  category: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  question: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  lineLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  pills: {
    marginTop: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
});
