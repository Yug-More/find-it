import { CATEGORIES } from "../constants/categories";
import type { ReportFieldErrors, ReportInput } from "../types/report";
import { isCalendarDate, todayIsoDate } from "./dates";

const TITLE_LIMIT = 120;
const DESCRIPTION_LIMIT = 2000;
const COLOR_LIMIT = 40;
const LOCATION_LIMIT = 200;

export function validateReportInput(input: ReportInput, now = new Date()): ReportFieldErrors {
  const errors: ReportFieldErrors = {};
  const title = input.title.trim();
  const description = input.description.trim();
  const color = input.color.trim();
  const location = input.location.trim();
  const eventDate = input.eventDate.trim();

  if (input.type !== "lost" && input.type !== "found") {
    errors.type = "Choose lost or found.";
  }

  if (!title) {
    errors.title = "Enter the item name.";
  } else if (title.length > TITLE_LIMIT) {
    errors.title = `Item name must be ${TITLE_LIMIT} characters or fewer.`;
  }

  if (!CATEGORIES.includes(input.category as (typeof CATEGORIES)[number])) {
    errors.category = "Select a category.";
  }

  if (!description) {
    errors.description = "Enter a description.";
  } else if (description.length > DESCRIPTION_LIMIT) {
    errors.description = `Description must be ${DESCRIPTION_LIMIT.toLocaleString("en-US")} characters or fewer.`;
  }

  if (color.length > COLOR_LIMIT) {
    errors.color = `Color must be ${COLOR_LIMIT} characters or fewer.`;
  }

  if (!location) {
    errors.location = "Enter where the item was lost or found.";
  } else if (location.length > LOCATION_LIMIT) {
    errors.location = `Location must be ${LOCATION_LIMIT} characters or fewer.`;
  }

  if (!eventDate) {
    errors.eventDate = "Enter the date as YYYY-MM-DD.";
  } else if (!isCalendarDate(eventDate)) {
    errors.eventDate = "Enter a real date as YYYY-MM-DD.";
  } else if (eventDate > todayIsoDate(now)) {
    errors.eventDate = "Enter a date that is today or earlier.";
  }

  return errors;
}

export function hasFieldErrors(errors: ReportFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function normalizeReportInput(input: ReportInput): ReportInput {
  return {
    type: input.type,
    title: input.title.trim(),
    category: input.category,
    description: input.description.trim(),
    color: input.color.trim(),
    location: input.location.trim(),
    eventDate: input.eventDate.trim(),
  };
}
