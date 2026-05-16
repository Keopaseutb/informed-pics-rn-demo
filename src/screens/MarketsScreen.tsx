import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
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
import {
  MarketCard,
  MARKET_CARD_FIXED_HEIGHT,
} from "../components/MarketCard";
import { colors, spacing, typography } from "../theme";
import {
  getMarketListData,
  getValidationResults,
} from "../services/marketRepository";
import {
  buildMarketListViewModel,
  deriveMarketListState,
  MarketListItem,
} from "../services/marketListViewModel";
import { useFavorites } from "../hooks/useFavorites";
import { selectIsFavorite } from "../services/favoritesStore";
import { getMarketDataFreshnessStore } from "../services/marketDataFreshnessStore";
import {
  deriveIsMarketsStale,
  formatMarketsLastUpdatedLabel,
} from "../services/marketsFreshness";

const DEMO_LATENCY_MS = 250;
const SEARCH_DEBOUNCE_MS = 200;
const ALL_CATEGORIES = "All";
const HEADER_HEIGHT = 36;
const CARD_HEIGHT = MARKET_CARD_FIXED_HEIGHT;
const CARD_ROW_HEIGHT = CARD_HEIGHT + spacing.sm * 2;

type Navigation = NativeStackNavigationProp<RootStackParamList, "Markets">;

export const MarketsScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { favorites, toggleFavorite } = useFavorites();
  const marketFreshnessStore = useMemo(() => getMarketDataFreshnessStore(), []);
  const [lastUpdatedAtIso, setLastUpdatedAtIso] = useState<string | null>(null);
  const [hasRefreshedThisSession, setHasRefreshedThisSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Demo-delay timer for pull-to-refresh (cleared when a new refresh supersedes). */
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Blocks setState after unmount (e.g. while `saveLastUpdatedAt` is in flight). */
  const isMountedRef = useRef(true);
  /** Last-wins refresh token; incremented on each pull and on unmount to drop superseded async work. */
  const refreshSeqRef = useRef(0);

  const fontScale = PixelRatio.getFontScale();
  const allowItemLayout = fontScale <= 1.1;

  const marketListData = useMemo(() => getMarketListData(), []);
  const validationResults = useMemo(() => getValidationResults(), []);

  const { flatData, stickyHeaderIndices, marketMeta } = useMemo(
    () =>
      buildMarketListViewModel({
        ...marketListData,
        query: debouncedSearchQuery,
        selectedCategory:
          selectedCategory === ALL_CATEGORIES ? null : selectedCategory,
      }),
    [debouncedSearchQuery, marketListData, selectedCategory]
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

  const renderCategoryChip = useCallback(
    (category: string) => {
      const selected = selectedCategory === category;

      return (
        <Pressable
          key={category}
          onPress={() => setSelectedCategory(category)}
          style={[styles.filterChip, selected && styles.filterChipSelected]}
          accessibilityRole="radio"
          accessibilityState={{ checked: selected }}
          accessibilityLabel={
            category === ALL_CATEGORIES ? "All markets" : `${category} markets`
          }
          accessibilityHint="Selects this category filter"
        >
          <Text
            style={[
              styles.filterChipText,
              selected && styles.filterChipTextSelected,
            ]}
          >
            {category}
          </Text>
        </Pressable>
      );
    },
    [selectedCategory]
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
      if (!meta) {
        if (__DEV__) {
          console.warn(`Missing market metadata for propId ${market.propid}`);
        }
        return null;
      }
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
          isFavorite={selectIsFavorite(favorites, market.propid)}
          onFavoriteToggle={() => toggleFavorite(market.propid)}
          onPress={handlePress}
        />
      );
    },
    [allowItemLayout, favorites, handlePress, marketMeta, toggleFavorite]
  );

  const onRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    const seq = ++refreshSeqRef.current;
    setRefreshing(true);

    const isCurrentRefreshAttempt = () =>
      isMountedRef.current && seq === refreshSeqRef.current;

    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      void (async () => {
        try {
          const iso = new Date().toISOString();
          await marketFreshnessStore.saveLastUpdatedAt(iso);
          if (!isCurrentRefreshAttempt()) return;
          setLastUpdatedAtIso(iso);
          setHasRefreshedThisSession(true);
        } catch (err) {
          if (__DEV__ && isCurrentRefreshAttempt()) {
            console.warn("[markets] Failed to persist last refresh time.", err);
          }
        } finally {
          if (isCurrentRefreshAttempt()) {
            setRefreshing(false);
          }
        }
      })();
    }, DEMO_LATENCY_MS);
  }, [marketFreshnessStore]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const iso = await marketFreshnessStore.loadLastUpdatedAt();
        if (!cancelled && isMountedRef.current) setLastUpdatedAtIso(iso);
      } catch (err) {
        if (__DEV__) {
          console.warn("[markets] Failed to load last refresh time.", err);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [marketFreshnessStore]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      // Invalidate any in-flight refresh work (timer cleared before callback, or async after unmount).
      refreshSeqRef.current += 1;
    };
  }, []);

  const hasBlockingError =
    validationResults.valid === 0 && validationResults.errors.length > 0;
  const listState = deriveMarketListState({
    loading,
    hasError: hasBlockingError,
    marketCount: marketListData.markets.length,
    flatDataCount: flatData.length,
  });

  if (listState === "loading") {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={colors.textPrimary} />
        <Text style={styles.loadingText}>Loading markets...</Text>
      </SafeAreaView>
    );
  }

  if (listState === "error") {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <Text style={styles.stateTitle}>Unable to load markets</Text>
        <Text style={styles.stateSubtitle}>
          Please try again or check the data source.
        </Text>
      </SafeAreaView>
    );
  }

  if (listState === "empty") {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <Text style={styles.stateTitle}>No markets available</Text>
        <Text style={styles.stateSubtitle}>
          There is no data to display right now.
        </Text>
      </SafeAreaView>
    );
  }

  const isMarketsStale = deriveIsMarketsStale(hasRefreshedThisSession);
  const freshnessLabel = formatMarketsLastUpdatedLabel({
    lastUpdatedAtIso,
    nowMs: Date.now(),
  });

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
      <View
        style={styles.filterRow}
        accessibilityLabel="Market category filters"
        accessibilityRole="radiogroup"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {[ALL_CATEGORIES, ...marketListData.categories].map(renderCategoryChip)}
        </ScrollView>
      </View>
      <View
        style={styles.freshnessBanner}
        accessibilityRole="text"
        accessibilityLabel={
          isMarketsStale
            ? `Cached data. ${freshnessLabel}`
            : freshnessLabel
        }
      >
        {isMarketsStale ? (
          <View style={styles.cachedPill}>
            <Text style={styles.cachedPillText}>Cached data</Text>
          </View>
        ) : null}
        <Text style={styles.freshnessMeta}>{freshnessLabel}</Text>
      </View>
      <FlatList
        style={styles.list}
        data={flatData}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        stickyHeaderIndices={stickyHeaderIndices}
        getItemLayout={allowItemLayout ? getItemLayout : undefined}
        initialNumToRender={10}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews={Platform.OS === "android"}
        ListEmptyComponent={
          listState === "noResults" ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsTitle}>No markets found</Text>
              <Text style={styles.noResultsText}>
                Try a different search or category.
              </Text>
            </View>
          ) : null
        }
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
  list: {
    flex: 1,
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
  filterRow: {
    backgroundColor: colors.background,
    paddingBottom: spacing.sm,
  },
  filterContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  filterChip: {
    minHeight: 36,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  filterChipSelected: {
    borderColor: colors.yesGreen,
    backgroundColor: colors.surfaceElevated,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  filterChipTextSelected: {
    color: colors.textPrimary,
  },
  noResultsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  noResultsTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  noResultsText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  stateContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  stateTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    textAlign: "center",
  },
  stateSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
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
  freshnessBanner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  cachedPill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.surfaceElevated,
  },
  cachedPillText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  freshnessMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
