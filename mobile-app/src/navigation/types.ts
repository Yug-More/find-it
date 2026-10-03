import type { ItemType } from "../types/report";

export type RootStackParamList = {
  Home: undefined;
  SubmitReport: { type: ItemType };
  Reports: undefined;
  ReportDetails: { reportId: string };
};
