import type { ItemType } from "../types/report";

export type RootStackParamList = {
  Welcome: undefined;
  SignIn: { notice?: string } | undefined;
  SignUp: undefined;
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
};
