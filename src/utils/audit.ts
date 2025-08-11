import pino from "pino";
import { v4 as uuidv4 } from "uuid";
// Simple context interface for compatibility
interface ToolHandlerContext {
  metadata?: {
    correlationId?: string;
    caller?: string;
    callerRole?: string;
  };
}
import { Role } from "../config/rbac.js";

const log = pino({ level: process.env.LOG_LEVEL || "info" });

export interface AuditRecord {
  timestamp: string;
  correlationId: string;
  tool: string;
  caller: string;
  role: Role;
  inputs: unknown;
  result?: unknown;
  error?: {
    message: string;
    code?: string;
  };
  ok: boolean;
  oktaRequestId?: string;
  duration?: number;
}

export async function audit(
  tool: string,
  inputs: unknown,
  result: unknown,
  ctx: ToolHandlerContext,
  error?: Error,
  oktaRequestId?: string,
  duration?: number
): Promise<void> {
  const correlationId = (ctx?.metadata?.correlationId as string) || uuidv4();
  const caller = (ctx?.metadata?.caller as string) || "unknown";
  const role = (ctx?.metadata?.callerRole as Role) || "analyst";

  const record: AuditRecord = {
    timestamp: new Date().toISOString(),
    correlationId,
    tool,
    caller,
    role,
    inputs: sanitizeInputs(inputs),
    ok: !error,
    oktaRequestId,
    duration,
  };

  if (result) {
    record.result = sanitizeResult(result);
  }

  if (error) {
    record.error = {
      message: error.message,
      code: (error as any).code,
    };
  }

  // Log to structured logger
  log.info(record, "audit");

  // In production, you might also want to:
  // - Send to Azure Application Insights
  // - Store in a database
  // - Send to a SIEM system
}

function sanitizeInputs(inputs: unknown): unknown {
  if (!inputs || typeof inputs !== "object") {
    return inputs;
  }

  const sanitized = { ...(inputs as Record<string, unknown>) };

  // Remove sensitive fields
  const sensitiveFields = ["password", "secret", "token", "key"];
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }

  return sanitized;
}

function sanitizeResult(result: unknown): unknown {
  if (!result || typeof result !== "object") {
    return result;
  }

  const sanitized = { ...(result as Record<string, unknown>) };

  // Remove sensitive fields from results
  const sensitiveFields = ["tempPassword", "secret", "token"];
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }

  return sanitized;
}

export function generateCorrelationId(): string {
  return uuidv4();
}
