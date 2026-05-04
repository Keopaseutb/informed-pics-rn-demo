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
import { MarketCard } from "../components/MarketCard";
import { colors, spacing, typography } from "../theme";
import { getMarketListData } from "../services/marketRepository";
import {
  buildMarketListViewModel,
  MarketListItem,
} from "../services/marketListViewModel";

const DEMO_LATENCY_MS = 250;
const SEARCH_DEBOUNCE_MS = 200;
const ALL_CATEGORIES = "All";
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
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fontScale = PixelRatio.getFontScale();
  const allowItemLayout = fontScale <= 1.1;

  const marketListData = useMemo(() => getMarketListData(), []);

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
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    setRefreshing(true);
    refreshTimerRef.current = setTimeout(() => {
      setRefreshing(false);
      refreshTimerRef.current = null;
    }, DEMO_LATENCY_MS);
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
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
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
        ListEmptyComponent={
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsTitle}>No markets found</Text>
            <Text style={styles.noResultsText}>
              Try a different search or category.
            </Text>
          </View>
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
