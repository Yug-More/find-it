import type { Report, ReportInput } from "../types/report";

export function reportToInput(report: Report): ReportInput {
  return {
    type: report.type,
    title: report.title,
    category: report.category ?? "",
    description: report.description,
    color: report.color ?? "",
    brand: report.brand ?? "",
    location: report.location ?? "",
    eventDate: report.eventDate?.slice(0, 10) ?? "",
    image: null,
    imageUrl: report.imageUrl,
  };
}
