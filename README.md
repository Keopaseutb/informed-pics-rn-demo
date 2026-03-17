# Informed Picks RN Demo

## Overview

Mini prediction-market UI demo built with Expo (React Native). The app uses static JSON exports for deterministic data and focuses on correctness, cross-platform parity, and performance hygiene.

## Branch note

The demo is intended to run in **Expo Go**. The `expo55-devbuild` path requires a custom dev build (Xcode/EAS).

## SDK/runtime note

**Working setup:** Expo SDK 54 for Expo Go compatibility.

If you need to downgrade to SDK 54, the terminal sequence is:

```
npx expo install expo@~54
npx expo install --fix
npx expo start -c --tunnel
```

## Quick start

```
npm i
npm start
```

Open Expo Go → Scan QR.

## Demo video

[iOS demo](https://drive.google.com/file/d/1v1twY8M87pcGgIHmnK4od6YjbCRfrCkk/view?usp=sharing) — walkthrough of the app running in Expo Go.

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

## Testing checklist

- Markets list renders
- Market detail opens
- Vig tooltip appears
- Order ticket validation works
- Debug parity screen loads

## Screenshots

- [Markets list](docs/screenshots/IMG_1701-2fa663fc-1472-4a8f-87dc-9178bab88ae2.jpg)
- [Market detail](docs/screenshots/IMG_1707-4e14100b-4454-4c25-a8bc-248c334541ba.jpg)
- [Order ticket](docs/screenshots/IMG_1706-83df22d0-6609-4ba7-bd78-fbc1f119d423.jpg)
- [Debug parity](docs/screenshots/IMG_1710-e155fe7a-cc91-4cf0-a6be-6cb9de6dd5c6.jpg)
- [Price history](docs/screenshots/IMG_1703-f72566c0-d53d-4d5a-bd3a-3ad4137dd890.jpg)

## Troubleshooting

- **Project incompatible with this version of Expo Go** → SDK mismatch (align SDK or downgrade via `expo install`).
- **Worklets mismatch** → Reanimated mismatch (fix with `npx expo install react-native-reanimated`).
- If you ever hit a Metro/Babel issue around Reanimated, try removing the explicit `react-native-reanimated/plugin` entry and rely on Expo's preset.
