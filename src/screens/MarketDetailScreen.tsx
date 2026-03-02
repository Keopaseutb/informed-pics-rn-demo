import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../types/nav";
import { colors, spacing, typography } from "../theme";
import { getMarketById } from "../services/marketRepository";
import {
  getLatestPoint,
  getTimeSeriesForProp,
} from "../services/timeSeriesRepository";
import { selectSeriesBySide } from "../services/selectors";
import { OddsPill } from "../components/OddsPill";
import { VigInfoTooltip } from "../components/VigInfoTooltip";
import { formatGameTime, formatRelativeTime } from "../utils/format";
import { PriceChart } from "../components/PriceChart";
import { OrderTicketSheet } from "../components/OrderTicketSheet";
import {
  decimalToImpliedProb,
  formatPct,
  normalizeYesNo,
} from "../utils/odds";

type DetailRoute = RouteProp<RootStackParamList, "MarketDetail">;

export const MarketDetailScreen = () => {
  const { params } = useRoute<DetailRoute>();
  const [ticketOpen, setTicketOpen] = useState(false);

  const market = getMarketById(params.propId);
  const series = getTimeSeriesForProp(params.propId);

  const latestOver = getLatestPoint(params.propId, "over");
  const latestUnder = getLatestPoint(params.propId, "under");
  const yesDecimal = latestOver?.oddsDecimal ?? market?.yesdecimalodds ?? 0;
  const noDecimal = latestUnder?.oddsDecimal ?? market?.nodecimalodds ?? 0;
  const yesProbRaw = decimalToImpliedProb(yesDecimal);
  const noProbRaw = decimalToImpliedProb(noDecimal);
  const normalized = normalizeYesNo(yesProbRaw, noProbRaw);
  const split = useMemo(() => selectSeriesBySide(series), [series]);

  if (!market) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Market not found</Text>
        <Text style={styles.subtitle}>
          This market could not be loaded.
        </Text>
      </View>
    );
  }

  const lastUpdatedIso =
    latestOver && latestUnder
      ? latestOver.epochMs >= latestUnder.epochMs
        ? latestOver.recordedAt
        : latestUnder.recordedAt
      : latestOver?.recordedAt ?? latestUnder?.recordedAt ?? null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.event}>{market.eventlabel}</Text>
      <Text style={styles.time}>{formatGameTime(market.startsat)}</Text>
      <Text style={styles.player}>{market.playername}</Text>
      <Text style={styles.category}>{market.category}</Text>

      <Text style={styles.caption}>
        Demo uses O/U markets mapped to YES (Over) / NO (Under).
      </Text>

      <View style={styles.probSection}>
        <Text style={styles.sectionTitle}>Probabilities</Text>
        <VigInfoTooltip />
      </View>

      <View style={styles.pills}>
        <View style={styles.pillBlock}>
          <OddsPill
            side="yes"
            oddsAmerican={latestOver?.oddsAmerican ?? market.yesamericanodds}
            probability={normalized.yes}
            tintColor={colors.yesGreen}
            accessibilityLabel={`Yes over, ${
              latestOver?.oddsAmerican ?? market.yesamericanodds
            } odds, ${Math.round(normalized.yes * 1000
            ) / 10} percent`}
          />
          <Text style={styles.rawText}>
            Raw: {formatPct(yesProbRaw)}
          </Text>
        </View>
        <View style={styles.pillBlock}>
          <OddsPill
            side="no"
            oddsAmerican={latestUnder?.oddsAmerican ?? market.noamericanodds}
            probability={normalized.no}
            tintColor={colors.noRed}
            accessibilityLabel={`No under, ${
              latestUnder?.oddsAmerican ?? market.noamericanodds
            } odds, ${Math.round(normalized.no * 1000
            ) / 10} percent`}
          />
          <Text style={styles.rawText}>
            Raw: {formatPct(noProbRaw)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price history</Text>
        {lastUpdatedIso ? (
          <Text style={styles.updatedText}>
            Last updated: {formatRelativeTime(lastUpdatedIso)}
          </Text>
        ) : null}
        <PriceChart
          overPoints={split.overPoints}
          underPoints={split.underPoints}
        />
      </View>

      <Pressable
        style={styles.tradeButton}
        onPress={() => setTicketOpen(true)}
        accessibilityRole="button"
      >
        <Text style={styles.tradeText}>Trade</Text>
      </Pressable>

      <OrderTicketSheet
        visible={ticketOpen}
        onClose={() => setTicketOpen(false)}
        yesDecimalOdds={yesDecimal}
        noDecimalOdds={noDecimal}
      />
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
  },
  event: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  time: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  player: {
    ...typography.title,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  category: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  probSection: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  pills: {
    marginTop: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
  },
  pillBlock: {
    flex: 1,
  },
  rawText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  section: {
    marginTop: spacing.lg,
  },
  updatedText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  tradeButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.yesGreen,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
  tradeText: {
    ...typography.subtitle,
    color: colors.background,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
