import "dotenv/config";
import { createServer } from "@modelcontextprotocol/sdk";
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
const server = createServer({
  name: "okta-mcp",
  version: "0.2.0",

  // Read tools
  tools: [
    getUserByEmail,
    searchUsers,
    listGroups,
    listApps,
    systemLog,

    // Admin tools (with confirmations)
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
  ],

  // Optional: Resources (read-only content)
  resources: [
    {
      uri: "okta://docs/user-management",
      name: "Okta User Management Guide",
      description: "Comprehensive guide for managing users in Okta",
      mimeType: "text/markdown",
      content: `
# Okta User Management Guide

## User Lifecycle States
- **ACTIVE**: User can sign in and access applications
- **SUSPENDED**: User cannot sign in but account is preserved
- **DEPROVISIONED**: User account is permanently disabled
- **LOCKED_OUT**: User is temporarily locked due to failed attempts
- **PASSWORD_EXPIRED**: User must change password before signing in

## Common Admin Actions
1. **Suspend User**: Temporarily disable access
2. **Unsuspend User**: Restore access after suspension
3. **Deactivate User**: Permanently disable account
4. **Reset Password**: Force password change
5. **Clear Sessions**: Sign out user from all devices

## Best Practices
- Always verify user identity before taking action
- Use suspension for temporary issues, deactivation for permanent
- Document reasons for administrative actions
- Monitor system logs for audit trail
      `,
    },
    {
      uri: "okta://docs/group-management",
      name: "Okta Group Management",
      description: "Guide for managing groups and memberships",
      mimeType: "text/markdown",
      content: `
# Okta Group Management

## Group Types
- **BUILT_IN**: System-created groups (cannot be deleted)
- **OKTA_GROUP**: Standard Okta groups
- **APP_GROUP**: Application-specific groups

## Group Operations
- Add users to groups for access control
- Remove users from groups to revoke access
- Use groups for application assignments
- Leverage groups for MFA policies

## Best Practices
- Use descriptive group names
- Document group purposes
- Regular access reviews
- Principle of least privilege
      `,
    },
  ],

  // Optional: Pre-built prompts for common tasks
  prompts: [
    {
      name: "access-review",
      description: "Perform a comprehensive access review for a user",
      prompt: `
You are an Okta administrator performing an access review. 

For the given user, please:
1. Get their current profile and status
2. List all groups they belong to
3. List all applications they have access to
4. Check recent system log events for their account
5. Provide a summary of their current access level

This helps ensure proper access control and security compliance.
      `,
    },
    {
      name: "leaver-process",
      description: "Standard process for handling departing employees",
      prompt: `
You are handling the offboarding process for a departing employee.

Please follow this standard process:
1. Suspend the user account immediately
2. Clear all active sessions
3. Remove user from all groups
4. Document the action in system logs
5. Provide confirmation of completed steps

This ensures secure and compliant offboarding.
      `,
    },
    {
      name: "joiner-process",
      description: "Standard process for onboarding new employees",
      prompt: `
You are handling the onboarding process for a new employee.

Please follow this standard process:
1. Verify the user account exists and is active
2. Add user to appropriate groups based on role
3. Verify application access is properly assigned
4. Check that MFA is properly configured
5. Provide summary of access granted

This ensures proper access provisioning for new hires.
      `,
    },
  ],
});

// Start the server
server.start();

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
