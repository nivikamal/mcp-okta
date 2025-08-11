import { z } from "zod";

// Common validation schemas
export const EmailSchema = z.string().email("Invalid email format");
export const UserIdSchema = z.string().min(1, "User ID is required");
export const GroupIdSchema = z.string().min(1, "Group ID is required");
export const LimitSchema = z.number().int().min(1).max(200).default(100);
export const LogLimitSchema = z.number().int().min(1).max(1000).default(100);

// Okta-specific validations
export const OktaStatusSchema = z.enum([
  "ACTIVE",
  "DEPROVISIONED",
  "LOCKED_OUT",
  "PASSWORD_EXPIRED",
  "PROVISIONED",
  "RECOVERY",
  "STAGED",
  "SUSPENDED",
]);

export const OktaEventTypeSchema = z.enum([
  "user.session.start",
  "user.session.end",
  "user.authentication.auth_via_mfa",
  "user.authentication.auth_via_password",
  "user.lifecycle.create",
  "user.lifecycle.delete",
  "user.lifecycle.suspend",
  "user.lifecycle.unsuspend",
  "user.lifecycle.deactivate",
  "user.lifecycle.reactivate",
]);

// Input sanitization
export function sanitizeSearchQuery(query: string): string {
  // Remove potentially dangerous characters
  return query.replace(/[<>\"'&]/g, "");
}

export function validateOktaFilter(filter: string): boolean {
  // Basic validation for Okta filter syntax
  const validOperators = [
    "eq",
    "ne",
    "gt",
    "lt",
    "ge",
    "le",
    "sw",
    "ew",
    "co",
    "pr",
  ];
  const validFields = [
    "profile.email",
    "profile.firstName",
    "profile.lastName",
    "status",
    "id",
  ];

  // Simple regex to check for basic filter structure
  const filterRegex =
    /^([a-zA-Z.]+)\s+(eq|ne|gt|lt|ge|le|sw|ew|co|pr)\s+["']([^"']*)["']$/;
  return filterRegex.test(filter);
}

// Error handling
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class OktaApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = "OktaApiError";
  }
}

// Rate limiting helpers
export function calculateBackoffDelay(
  attempt: number,
  baseDelay = 1000
): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
}

export function shouldRetry(statusCode: number): boolean {
  return statusCode >= 500 || statusCode === 429;
}

// Pagination helpers
export function validateCursor(cursor?: string): boolean {
  if (!cursor) return true;
  // Okta cursors are typically base64 encoded strings
  return /^[A-Za-z0-9+/=]+$/.test(cursor);
}

export function parseLinkHeader(linkHeader?: string): {
  next?: string;
  prev?: string;
} {
  if (!linkHeader) return {};

  const links: Record<string, string> = {};
  const linkRegex = /<([^>]+)>;\s*rel="([^"]+)"/g;
  let match;

  while ((match = linkRegex.exec(linkHeader)) !== null) {
    links[match[2]] = match[1];
  }

  return links;
}
