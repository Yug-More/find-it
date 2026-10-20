import type { NavigatorScreenParams } from "@react-navigation/native";

import type { ItemType } from "../types/report";

export type MainTabParamList = {
  HomeTab: undefined;
  ReportsTab: undefined;
  ReportTab: undefined;
  ActivityTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  SignIn: { notice?: string } | undefined;
  SignUp: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Home: undefined;
  SubmitReport: { type: ItemType };
  Reports: undefined;
  ReportDetails: { reportId: string; origin?: "browse" | "mine" };
  MyReports: undefined;
  EditReport: { reportId: string };
  Matches: undefined;
  Claims: undefined;
  SubmitClaim: { reportId: string };
  Notifications: undefined;
  Profile: undefined;
  Activity: undefined;
};
