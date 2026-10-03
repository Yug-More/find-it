export type ReportErrorKind =
  | "configuration"
  | "authentication"
  | "network"
  | "not_found"
  | "validation";

export class ReportServiceError extends Error {
  readonly kind: ReportErrorKind;

  constructor(message: string, kind: ReportErrorKind) {
    super(message);
    this.name = "ReportServiceError";
    this.kind = kind;
  }
}
