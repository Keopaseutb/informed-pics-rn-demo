import { Platform } from "react-native";

export const colors = {
  background: "#0D0D0D",
  surface: "#1A1A1A",
  surfaceElevated: "#262626",
  yesGreen: "#00C781",
  noRed: "#FF4D4D",
  textPrimary: "#FFFFFF",
  textSecondary: "#999999",
  border: "#333333",
  shadow: "#000000",
};

export const cardShadow = Platform.select({
  ios: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  android: {
    elevation: 4,
  },
  default: {},
});
