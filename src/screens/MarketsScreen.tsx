import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  PixelRatio,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/nav";
import { MarketCard } from "../components/MarketCard";
import { colors, spacing, typography } from "../theme";
import {
  getCategories,
  getGroupedByCategory,
  getMarkets,
} from "../services/marketRepository";
import { selectMarketHeader } from "../services/selectors";
import {
  buildMarketListViewModel,
  MarketListItem,
} from "../services/marketListViewModel";

const DEMO_LATENCY_MS = 250;
const SEARCH_DEBOUNCE_MS = 200;
const HEADER_HEIGHT = 36;
const CARD_HEIGHT = 210;
const CARD_ROW_HEIGHT = CARD_HEIGHT + spacing.sm * 2;

type Navigation = NativeStackNavigationProp<RootStackParamList, "Markets">;

export const MarketsScreen = () => {
  const navigation = useNavigation<Navigation>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fontScale = PixelRatio.getFontScale();
  const allowItemLayout = fontScale <= 1.1;

  const markets = useMemo(() => getMarkets(), []);
  const grouped = useMemo(() => getGroupedByCategory(), []);
  const categories = useMemo(() => getCategories(), []);

  const marketMeta = useMemo(() => {
    const meta = new Map<
      number,
      ReturnType<typeof selectMarketHeader>
    >();
    markets.forEach((market) => {
      meta.set(market.propid, selectMarketHeader(market));
    });
    return meta;
  }, [markets]);

  const { flatData, stickyHeaderIndices } = useMemo(
    () =>
      buildMarketListViewModel({
        categories,
        grouped,
        query: debouncedSearchQuery,
      }),
    [categories, debouncedSearchQuery, grouped]
  );

  const layoutCache = useMemo(() => {
    let offset = 0;
    return flatData.map((item) => {
      const length = item.type === "header" ? HEADER_HEIGHT : CARD_ROW_HEIGHT;
      const layout = { length, offset };
      offset += length;
      return layout;
    });
  }, [flatData]);

  const getItemLayout = useCallback(
    (_: ArrayLike<MarketListItem> | null | undefined, index: number) => {
      const layout = layoutCache[index];
      return { ...layout, index };
    },
    [layoutCache]
  );

  const handlePress = useCallback(
    (propId: number) => {
      navigation.navigate("MarketDetail", { propId });
    },
    [navigation]
  );

  const renderItem: ListRenderItem<MarketListItem> = useCallback(
    ({ item }) => {
      if (item.type === "header") {
        return (
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>{item.title}</Text>
          </View>
        );
      }
      const market = item.market;
      const meta = marketMeta.get(market.propid);
      if (!meta) return null;
      return (
        <MarketCard
          propId={market.propid}
          playerName={market.playername}
          category={market.category}
          question={market.question}
          line={market.line}
          unit={market.unit}
          yesOddsAmerican={market.yesamericanodds}
          noOddsAmerican={market.noamericanodds}
          yesProbNorm={meta.yesProbNorm}
          noProbNorm={meta.noProbNorm}
          fixedHeight={allowItemLayout}
          onPress={handlePress}
        />
      );
    },
    [allowItemLayout, handlePress, marketMeta]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), DEMO_LATENCY_MS);
  }, []);

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      searchDebounceRef.current = null;
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), DEMO_LATENCY_MS);
    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={colors.textPrimary} />
        <Text style={styles.loadingText}>Loading markets...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search markets"
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          autoComplete="off"
          clearButtonMode="while-editing"
          returnKeyType="search"
          accessibilityLabel="Search markets"
          accessibilityHint="Enter a search query"
        />
      </View>
      <FlatList
        data={flatData}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        stickyHeaderIndices={stickyHeaderIndices}
        getItemLayout={allowItemLayout ? getItemLayout : undefined}
        initialNumToRender={10}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews={Platform.OS === "android"}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textPrimary}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background,
  },
  searchInput: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  headerRow: {
    height: HEADER_HEIGHT,
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  headerText: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
});
