import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme";
import { formatAmericanOdds, formatPct } from "../utils/odds";

type OddsPillProps = {
  side: "yes" | "no";
  oddsAmerican: number;
  probability: number;
  tintColor: string;
  accessibilityLabel: string;
};

export const OddsPill = ({
  side,
  oddsAmerican,
  probability,
  tintColor,
  accessibilityLabel,
}: OddsPillProps) => {
  const label = side === "yes" ? "YES (Over)" : "NO (Under)";
  return (
    <View
      style={[styles.container, { borderColor: tintColor }]}
      accessible
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={[styles.label, { color: tintColor }]}>{label}</Text>
      <Text style={styles.odds}>{formatAmericanOdds(oddsAmerican)}</Text>
      <Text style={styles.prob}>{formatPct(probability)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...typography.pill,
    letterSpacing: 0.5,
  },
  odds: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  prob: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
