import { Response } from "express";

export function parsePositiveIntQuery(value: unknown): number | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? NaN : parsed;
}

export function parsePositiveIntParam(value: unknown): number {
  if (typeof value !== "string") {
    return NaN;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? NaN : parsed;
}

export function validatePagingParameters(
  limit?: number,
  page?: number,
): string | null {
  if ((limit != null && Number.isNaN(limit)) || (page != null && Number.isNaN(page))) {
    return "limit and page must be integers";
  }

  if (limit != null && limit <= 0) {
    return "limit must be a positive number";
  }

  if (page != null && page <= 0) {
    return "page must be a positive number";
  }

  if (page != null && limit == null) {
    return "limit is required when paging by page";
  }

  return null;
}

export function invalidIdResponse(res: Response, subject: string) {
  return res.status(400).json({ error: `Invalid ${subject} ID` });
}
