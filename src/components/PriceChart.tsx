import { StyleSheet, Text, View } from "react-native";
import { ParsedTimePoint } from "../types/timeseries";
import { colors, spacing, typography } from "../theme";
import { formatAmericanOdds } from "../utils/odds";
import { formatRelativeTime } from "../utils/format";

type PriceChartProps = {
  overPoints: ParsedTimePoint[];
  underPoints: ParsedTimePoint[];
};

export const PriceChart = ({ overPoints, underPoints }: PriceChartProps) => {
  const latestOver = overPoints[overPoints.length - 1];
  const latestUnder = underPoints[underPoints.length - 1];

  const combined = [...overPoints, ...underPoints].sort(
    (a, b) => b.epochMs - a.epochMs
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Latest price</Text>
      <View style={styles.latestRow}>
        <View style={styles.latestBlock}>
          <Text style={styles.latestLabel}>YES (Over)</Text>
          <Text style={[styles.latestValue, { color: colors.yesGreen }]}>
            {latestOver ? formatAmericanOdds(latestOver.oddsAmerican) : "--"}
          </Text>
        </View>
        <View style={styles.latestBlock}>
          <Text style={styles.latestLabel}>NO (Under)</Text>
          <Text style={[styles.latestValue, { color: colors.noRed }]}>
            {latestUnder ? formatAmericanOdds(latestUnder.oddsAmerican) : "--"}
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
        History
      </Text>
      <View style={styles.table}>
        {combined.slice(0, 12).map((point) => (
          <View key={`${point.propId}-${point.side}-${point.epochMs}`}>
            <View style={styles.row}>
              <View
                style={[
                  styles.spark,
                  { backgroundColor: point.side === "over" ? colors.yesGreen : colors.noRed },
                ]}
              />
              <Text style={styles.rowLabel} numberOfLines={1}>
                {point.side === "over" ? "YES (Over)" : "NO (Under)"}
              </Text>
              <Text style={styles.rowValue}>
                {formatAmericanOdds(point.oddsAmerican)}
              </Text>
              <Text style={styles.rowTime}>
                {formatRelativeTime(point.recordedAt)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  latestRow: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  latestBlock: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  latestLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  latestValue: {
    ...typography.title,
    marginTop: spacing.xs,
  },
  table: {
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  spark: {
    width: 18,
    height: 4,
    borderRadius: 2,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    width: 88,
  },
  rowValue: {
    ...typography.body,
    color: colors.textPrimary,
    width: 72,
  },
  rowTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
