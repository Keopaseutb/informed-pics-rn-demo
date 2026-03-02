import { useEffect, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  PixelRatio,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { colors, spacing, typography } from "../theme";
import {
  getCategories,
  getMarkets,
  getValidationResults as getMarketValidation,
} from "../services/marketRepository";
import {
  getAllTimeSeries,
  getTimeSeriesForProp,
  getValidationResults as getSeriesValidation,
} from "../services/timeSeriesRepository";
import { selectMarketHeader } from "../services/selectors";

export const DebugParityScreen = () => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  const markets = getMarkets();
  const series = getAllTimeSeries();
  const marketValidation = getMarketValidation();
  const seriesValidation = getSeriesValidation();

  const parityRows = useMemo(() => {
    return markets.map((market) => {
      const points = getTimeSeriesForProp(market.propid);
      const header = selectMarketHeader(market);
      const rawSum = header.yesProbRaw + header.noProbRaw;
      const normSum = header.yesProbNorm + header.noProbNorm;
      return {
        propId: market.propid,
        label: market.question,
        count: points.length,
        rawSum,
        normSum,
      };
    });
  }, [markets]);

  const orphanMarkets = parityRows.filter((row) => row.count === 0);

  const orphanSeries = useMemo(() => {
    const marketIds = new Set(markets.map((m) => m.propid));
    const seriesIds = new Set(series.map((s) => s.propId));
    return Array.from(seriesIds).filter((id) => !marketIds.has(id));
  }, [markets, series]);

  const platformRows = [
    { label: "Platform", value: `${Platform.OS} ${Platform.Version}` },
    {
      label: "Safe area (top/bottom)",
      value: `${Math.round(insets.top)} / ${Math.round(insets.bottom)}`,
    },
    {
      label: "Safe area (left/right)",
      value: `${Math.round(insets.left)} / ${Math.round(insets.right)}`,
    },
    { label: "Font scale", value: `${PixelRatio.getFontScale().toFixed(2)}` },
    {
      label: "Reduce motion",
      value: reduceMotion === null ? "..." : reduceMotion ? "true" : "false",
    },
    { label: "Color scheme", value: colorScheme ?? "unknown" },
    {
      label: "Shadow method",
      value: Platform.OS === "android" ? "elevation" : "shadow props",
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Debug parity</Text>

      <Text style={styles.sectionTitle}>Data parity checks</Text>
      <View style={styles.card}>
        <Text style={styles.rowText}>
          Markets: {marketValidation.valid} / {marketValidation.total}
        </Text>
        <Text style={styles.rowText}>
          Market validation errors: {marketValidation.errors.length}
        </Text>
        <Text style={styles.rowText}>
          Timeseries: {seriesValidation.valid} / {seriesValidation.total}
        </Text>
        <Text style={styles.rowText}>
          Timeseries validation errors: {seriesValidation.errors.length}
        </Text>
        <Text style={styles.rowText}>
          Categories: {getCategories().length}
        </Text>
        <Text style={styles.rowText}>
          Orphan markets: {orphanMarkets.length}
        </Text>
        <Text style={styles.rowText}>
          Orphan series: {orphanSeries.length}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Parity detail (sample)</Text>
      <View style={styles.card}>
        {parityRows.slice(0, 12).map((row) => (
          <View key={row.propId} style={styles.parityRow}>
            <Text style={styles.rowLabel} numberOfLines={1}>
              {row.label}
            </Text>
            <Text
              style={[
                styles.rowValue,
                row.count === 0 ? { color: colors.noRed } : { color: colors.yesGreen },
              ]}
            >
              {row.count} pts
            </Text>
            <Text style={styles.rowValue}>
              raw {row.rawSum.toFixed(2)}
            </Text>
            <Text style={styles.rowValue}>
              norm {row.normSum.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Platform parity checks</Text>
      <View style={styles.card}>
        {platformRows.map((row) => (
          <View key={row.label} style={styles.parityRow}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue}>{row.value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  parityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  rowValue: {
    ...typography.caption,
    color: colors.textPrimary,
  },
});
