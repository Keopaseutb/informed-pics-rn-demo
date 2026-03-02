# Informed Picks RN Demo

## Overview

Mini prediction-market UI demo built with Expo (React Native). The app uses static JSON exports for deterministic data and focuses on correctness, cross-platform parity, and performance hygiene.

## Feature → Why → JD Mapping

| Feature | Why it matters | JD mapping |
| --- | --- | --- |
| Vig removal tooltip | Pricing transparency | Trust |
| DebugParity data checks | Data diagnosis and confidence | Troubleshoot |
| DebugParity platform checks | Runtime environment diagnosis | Compatibility |
| FlatList hygiene (memo, useCallback, getItemLayout, windowSize) | Perf and scalability | Performance |
| Platform.select shadows | iOS vs Android styling | Cross-platform parity |
| Order validation (disable CTA + inline error) | Product/UX maturity | User experience |
| odds.test.ts | Baseline correctness | Quality |
| Validate-once guards | Efficient data loading | Architecture |
| fontScale-aware getItemLayout | Accessible Large Text behavior | Accessibility |
| removeClippedSubviews Android-only | Avoid iOS shadow clipping | Cross-platform parity |
| Primitive props to MarketCard | Correct memoization | Performance |

## Accessibility note

`getItemLayout` is enabled only when `fontScale <= 1.1`. With Large Text enabled, the list disables `getItemLayout` to avoid scroll-position issues from variable heights. This is intentional and ensures accurate list behavior under accessibility settings.

## Troubleshooting note

If you ever hit a Metro/Babel issue around Reanimated, the first simplification to try is removing the explicit `react-native-reanimated/plugin` entry and relying on Expo's default preset.
