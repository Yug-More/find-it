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

export type ReportInput = {
  type: ItemType;
  title: string;
  category: string;
  description: string;
  color: string;
  location: string;
  eventDate: string;
};

export type ReportField = keyof ReportInput;

export type ReportFieldErrors = Partial<Record<ReportField, string>>;
