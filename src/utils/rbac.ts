import { ToolHandlerContext } from "@modelcontextprotocol/sdk";
import {
  Role,
  roleToolAllowList,
  getDefaultRole,
  isRoleValid,
} from "../config/rbac.js";

export function ensureAllowed(toolName: string, ctx: ToolHandlerContext): void {
  const role = getRoleFromContext(ctx);
  const allowed = roleToolAllowList[role] || [];

  if (!allowed.includes(toolName)) {
    throw new Error(
      `Role '${role}' is not allowed to use tool '${toolName}'. ` +
        `Allowed tools for this role: ${allowed.join(", ")}`
    );
  }
}

export function getRoleFromContext(ctx: ToolHandlerContext): Role {
  const role = (ctx?.metadata?.callerRole as string) || getDefaultRole();

  if (!isRoleValid(role)) {
    return getDefaultRole();
  }

  return role;
}

export function getCallerFromContext(ctx: ToolHandlerContext): string {
  return (ctx?.metadata?.caller as string) || "unknown";
}

export function getCorrelationIdFromContext(ctx: ToolHandlerContext): string {
  return (ctx?.metadata?.correlationId as string) || "unknown";
}

export function validateRole(role: string): role is Role {
  return isRoleValid(role);
}
