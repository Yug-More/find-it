import { useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { LoadingState } from "../components/ui/LoadingState";
import { colors, typography } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { ClaimsScreen } from "../screens/ClaimsScreen";
import { EditReportScreen } from "../screens/EditReportScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { MatchesScreen } from "../screens/MatchesScreen";
import { MyReportsScreen } from "../screens/MyReportsScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ReportDetailsScreen } from "../screens/ReportDetailsScreen";
import { ReportsListScreen } from "../screens/ReportsListScreen";
import { SignInScreen } from "../screens/SignInScreen";
import { SignUpScreen } from "../screens/SignUpScreen";
import { SubmitClaimScreen } from "../screens/SubmitClaimScreen";
import { SubmitReportScreen } from "../screens/SubmitReportScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import type { ItemType } from "../types/report";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: "minimal" as const,
  headerTintColor: colors.text,
  headerTitleStyle: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
    color: colors.text,
  },
  contentStyle: { backgroundColor: colors.background },
};

export function RootNavigator() {
  const { session, loading, pendingReportType } = useAuth();

  if (loading) {
    return <LoadingState message="Restoring your session" />;
  }

  if (!session) {
    return <SignedOutStack />;
  }

  return <SignedInStack reportType={pendingReportType} />;
}

function SignedOutStack() {
  return (
    <Stack.Navigator initialRouteName="Welcome" screenOptions={screenOptions}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: "Sign in" }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: "Create account" }} />
      <Stack.Screen name="Reports" component={ReportsListScreen} options={{ title: "Reports" }} />
      <Stack.Screen
        name="ReportDetails"
        component={ReportDetailsScreen}
        options={{ title: "Report" }}
      />
    </Stack.Navigator>
  );
}

function SignedInStack({ reportType }: { reportType: ItemType | null }) {
  const [startingType] = useState(reportType);

  return (
    <Stack.Navigator
      initialRouteName={startingType ? "SubmitReport" : "Home"}
      screenOptions={screenOptions}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="SubmitReport"
        component={SubmitReportScreen}
        initialParams={{ type: startingType ?? "lost" }}
        options={{ title: "Submit report" }}
      />
      <Stack.Screen name="Reports" component={ReportsListScreen} options={{ title: "Reports" }} />
      <Stack.Screen
        name="ReportDetails"
        component={ReportDetailsScreen}
        options={{ title: "Report" }}
      />
      <Stack.Screen name="MyReports" component={MyReportsScreen} options={{ title: "My reports" }} />
      <Stack.Screen name="EditReport" component={EditReportScreen} options={{ title: "Edit report" }} />
      <Stack.Screen name="Matches" component={MatchesScreen} options={{ title: "Matches" }} />
      <Stack.Screen name="Claims" component={ClaimsScreen} options={{ title: "Claims" }} />
      <Stack.Screen
        name="SubmitClaim"
        component={SubmitClaimScreen}
        options={{ title: "Submit claim" }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: "Notifications" }}
      />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Stack.Navigator>
  );
}
