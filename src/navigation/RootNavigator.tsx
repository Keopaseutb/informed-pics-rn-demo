import { Pressable, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/nav";
import { MarketsScreen } from "../screens/MarketsScreen";
import { MarketDetailScreen } from "../screens/MarketDetailScreen";
import { DebugParityScreen } from "../screens/DebugParityScreen";
import { colors, typography } from "../theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: typography.subtitle,
      }}
    >
      <Stack.Screen
        name="Markets"
        component={MarketsScreen}
        options={({ navigation }) => ({
          title: "Markets",
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate("DebugParity")}
              accessibilityRole="button"
              accessibilityLabel="Open debug parity"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                Debug
              </Text>
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="MarketDetail"
        component={MarketDetailScreen}
        options={{ title: "Market detail" }}
      />
      <Stack.Screen
        name="DebugParity"
        component={DebugParityScreen}
        options={{ title: "Debug parity" }}
      />
    </Stack.Navigator>
  );
};
