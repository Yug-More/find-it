import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { colors, iconSize, typography } from "../constants/theme";
import { ActivityScreen } from "../screens/ActivityScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ReportHubScreen } from "../screens/ReportHubScreen";
import { ReportsListScreen } from "../screens/ReportsListScreen";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: typography.label.fontWeight,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 58,
          paddingBottom: 6,
          paddingTop: 4,
        },
        tabBarIcon: ({ color, focused }) => {
          const name = iconForRoute(route.name, focused);
          return <Ionicons name={name} size={iconSize.lg} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: "Home" }} />
      <Tab.Screen name="ReportsTab" component={ReportsListScreen} options={{ title: "Reports" }} />
      <Tab.Screen
        name="ReportTab"
        component={ReportHubScreen}
        options={{
          title: "Report",
          tabBarAccessibilityLabel: "Report",
        }}
      />
      <Tab.Screen name="ActivityTab" component={ActivityScreen} options={{ title: "Activity" }} />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: "Profile", tabBarAccessibilityLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
}

function iconForRoute(
  route: keyof MainTabParamList,
  focused: boolean,
): keyof typeof Ionicons.glyphMap {
  switch (route) {
    case "HomeTab":
      return focused ? "home" : "home-outline";
    case "ReportsTab":
      return focused ? "search" : "search-outline";
    case "ReportTab":
      return focused ? "add-circle" : "add-circle-outline";
    case "ActivityTab":
      return focused ? "pulse" : "pulse-outline";
    case "ProfileTab":
      return focused ? "person" : "person-outline";
    default:
      return "ellipse-outline";
  }
}
