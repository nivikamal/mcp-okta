import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import pino from "pino";

// Import tools
import {
  getUserByEmail,
  searchUsers,
  listGroups,
  listApps,
  systemLog,
} from "./tools/read-tools.js";

import {
  suspend_user,
  suspend_user_confirm,
  unsuspend_user,
  unsuspend_user_confirm,
  deactivate_user,
  deactivate_user_confirm,
  reactivate_user,
  reactivate_user_confirm,
  clear_user_sessions,
  clear_user_sessions_confirm,
  add_user_to_group,
  add_user_to_group_confirm,
  remove_user_from_group,
  remove_user_from_group_confirm,
  reset_password,
  reset_password_confirm,
} from "./tools/admin-tools.js";

// Import utilities
import { generateCorrelationId } from "./utils/audit.js";

const log = pino({ level: process.env.LOG_LEVEL || "info" });

// Validate required environment variables
const requiredEnvVars = [
  "OKTA_DOMAIN",
  "OKTA_OAUTH_TOKEN_URL",
  "OKTA_CLIENT_ID",
  "OKTA_CLIENT_SECRET",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    log.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

log.info("Starting Okta MCP Server...");

// Create MCP server
const server = new McpServer({
  name: "okta-mcp",
  version: "0.2.0",
});

// Register read tools
server.tool(
  "get_user_by_email",
  getUserByEmail.description || "Get user by email",
  getUserByEmail.inputSchema,
  getUserByEmail.handler
);
server.tool(
  "search_users",
  searchUsers.description || "Search users",
  searchUsers.inputSchema,
  searchUsers.handler
);
server.tool(
  "list_groups",
  listGroups.description || "List groups",
  listGroups.inputSchema,
  listGroups.handler
);
server.tool(
  "list_apps",
  listApps.description || "List applications",
  listApps.inputSchema,
  listApps.handler
);
server.tool(
  "system_log",
  systemLog.description || "Get system log events",
  systemLog.inputSchema,
  systemLog.handler
);

// Register admin tools
server.tool(
  "suspend_user",
  suspend_user.description || "Suspend user",
  suspend_user.inputSchema,
  suspend_user.handler
);
server.tool(
  "suspend_user_confirm",
  suspend_user_confirm.description || "Confirm suspend user",
  suspend_user_confirm.inputSchema,
  suspend_user_confirm.handler
);
server.tool(
  "unsuspend_user",
  unsuspend_user.description || "Unsuspend user",
  unsuspend_user.inputSchema,
  unsuspend_user.handler
);
server.tool(
  "unsuspend_user_confirm",
  unsuspend_user_confirm.description || "Confirm unsuspend user",
  unsuspend_user_confirm.inputSchema,
  unsuspend_user_confirm.handler
);
server.tool(
  "deactivate_user",
  deactivate_user.description || "Deactivate user",
  deactivate_user.inputSchema,
  deactivate_user.handler
);
server.tool(
  "deactivate_user_confirm",
  deactivate_user_confirm.description || "Confirm deactivate user",
  deactivate_user_confirm.inputSchema,
  deactivate_user_confirm.handler
);
server.tool(
  "reactivate_user",
  reactivate_user.description || "Reactivate user",
  reactivate_user.inputSchema,
  reactivate_user.handler
);
server.tool(
  "reactivate_user_confirm",
  reactivate_user_confirm.description || "Confirm reactivate user",
  reactivate_user_confirm.inputSchema,
  reactivate_user_confirm.handler
);
server.tool(
  "clear_user_sessions",
  clear_user_sessions.description || "Clear user sessions",
  clear_user_sessions.inputSchema,
  clear_user_sessions.handler
);
server.tool(
  "clear_user_sessions_confirm",
  clear_user_sessions_confirm.description || "Confirm clear user sessions",
  clear_user_sessions_confirm.inputSchema,
  clear_user_sessions_confirm.handler
);
server.tool(
  "add_user_to_group",
  add_user_to_group.description || "Add user to group",
  add_user_to_group.inputSchema,
  add_user_to_group.handler
);
server.tool(
  "add_user_to_group_confirm",
  add_user_to_group_confirm.description || "Confirm add user to group",
  add_user_to_group_confirm.inputSchema,
  add_user_to_group_confirm.handler
);
server.tool(
  "remove_user_from_group",
  remove_user_from_group.description || "Remove user from group",
  remove_user_from_group.inputSchema,
  remove_user_from_group.handler
);
server.tool(
  "remove_user_from_group_confirm",
  remove_user_from_group_confirm.description ||
    "Confirm remove user from group",
  remove_user_from_group_confirm.inputSchema,
  remove_user_from_group_confirm.handler
);
server.tool(
  "reset_password",
  reset_password.description || "Reset user password",
  reset_password.inputSchema,
  reset_password.handler
);
server.tool(
  "reset_password_confirm",
  reset_password_confirm.description || "Confirm reset password",
  reset_password_confirm.inputSchema,
  reset_password_confirm.handler
);

// Set up transport and connect
const transport = new StdioServerTransport();
await server.connect(transport);

log.info("Okta MCP Server started successfully");

// Graceful shutdown
process.on("SIGINT", () => {
  log.info("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  log.info("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  log.error({ error: error.message, stack: error.stack }, "Uncaught exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  log.error({ reason, promise }, "Unhandled promise rejection");
  process.exit(1);
});
