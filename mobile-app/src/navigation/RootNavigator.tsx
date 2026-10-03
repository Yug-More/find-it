import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { colors, typography } from "../constants/theme";
import { ReportDetailsScreen } from "../screens/ReportDetailsScreen";
import { ReportsListScreen } from "../screens/ReportsListScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { SubmitReportScreen } from "../screens/SubmitReportScreen";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontSize: typography.heading.fontSize,
          fontWeight: typography.heading.fontWeight,
          color: colors.text,
        },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="SubmitReport"
        component={SubmitReportScreen}
        options={{ title: "Submit report" }}
      />
      <Stack.Screen name="Reports" component={ReportsListScreen} options={{ title: "Reports" }} />
      <Stack.Screen
        name="ReportDetails"
        component={ReportDetailsScreen}
        options={{ title: "Report" }}
      />
    </Stack.Navigator>
  );
}
