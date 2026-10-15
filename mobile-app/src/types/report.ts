export type ItemType = "lost" | "found";

export type ItemStatus = "open" | "resolved";

export type Report = {
  id: string;
  userId: string;
  type: ItemType;
  title: string;
  description: string;
  category: string | null;
  color: string | null;
  brand: string | null;
  imageUrl: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  eventDate: string | null;
  status: ItemStatus;
  createdAt: string;
};

export type SelectedImage = {
  uri: string;
  mimeType: string;
  fileName: string;
  fileSize: number | null;
};

export type ReportInput = {
  type: ItemType;
  title: string;
  category: string;
  description: string;
  color: string;
  brand: string;
  location: string;
  eventDate: string;
  image: SelectedImage | null;
  imageUrl: string | null;
};

export type ReportTypeFilter = ItemType | "all";
export type ReportStatusFilter = ItemStatus | "all";

export type ReportFilters = {
  query: string;
  type: ReportTypeFilter;
  category: string;
  location: string;
  dateFrom: string;
  dateTo: string;
  status: ReportStatusFilter;
};

export type ReportField = keyof ReportInput;

export type ReportFieldErrors = Partial<Record<ReportField, string>>;
