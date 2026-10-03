import type { ItemStatus, ItemType, Report, ReportInput } from "../types/report";
import { toEventTimestamp } from "../utils/dates";
import { ReportServiceError } from "./errors";

const ITEM_TYPES: readonly ItemType[] = ["lost", "found"];
const ITEM_STATUSES: readonly ItemStatus[] = ["open", "resolved"];

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mapItem(value: unknown): Report {
  if (!isRecord(value)) {
    throw new ReportServiceError("The server returned an unreadable report.", "network");
  }

  const type = value.type;
  const status = value.status;
  if (!isItemType(type) || !isItemStatus(status)) {
    throw new ReportServiceError("The server returned an unreadable report.", "network");
  }

  return {
    id: requiredString(value, "id"),
    userId: requiredString(value, "user_id"),
    type,
    title: requiredString(value, "title"),
    description: requiredString(value, "description"),
    category: optionalString(value, "category"),
    color: optionalString(value, "color"),
    brand: optionalString(value, "brand"),
    imageUrl: optionalString(value, "image_url"),
    location: optionalString(value, "location"),
    latitude: optionalNumber(value, "latitude"),
    longitude: optionalNumber(value, "longitude"),
    eventDate: optionalString(value, "event_date"),
    status,
    createdAt: requiredString(value, "created_at"),
  };
}

export function mapItemList(value: unknown): Report[] {
  if (!Array.isArray(value)) {
    throw new ReportServiceError("The server returned an unreadable report list.", "network");
  }

  return value.map((item) => mapItem(item));
}

export function toItemCreate(input: ReportInput): Record<string, unknown> {
  return {
    type: input.type,
    title: input.title,
    description: input.description,
    category: input.category,
    color: input.color || null,
    location: input.location,
    event_date: toEventTimestamp(input.eventDate),
  };
}

function isItemType(value: unknown): value is ItemType {
  return typeof value === "string" && ITEM_TYPES.includes(value as ItemType);
}

function isItemStatus(value: unknown): value is ItemStatus {
  return typeof value === "string" && ITEM_STATUSES.includes(value as ItemStatus);
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new ReportServiceError(`The server response is missing ${key}.`, "network");
  }
  return value;
}

function optionalString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (value == null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new ReportServiceError(`The server response has an invalid ${key}.`, "network");
  }
  return value;
}

function optionalNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  if (value == null) {
    return null;
  }
  if (typeof value !== "number") {
    throw new ReportServiceError(`The server response has an invalid ${key}.`, "network");
  }
  return value;
}
