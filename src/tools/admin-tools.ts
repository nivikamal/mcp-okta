import { z } from "zod";

// Simple Tool interface for compatibility
interface Tool {
  name: string;
  description?: string;
  inputSchema: any;
  handler: (input: any, ctx: any) => Promise<any>;
}
import { okta } from "../utils/okta-client.js";
import { ensureAllowed } from "../utils/rbac.js";
import { audit } from "../utils/audit.js";
import {
  UserIdInput,
  GroupIdInput,
  UserGroupInput,
  SuspendUserInput,
} from "../types/okta.js";

// Schema definitions
const UserIdSchema = z.object({ userId: z.string().min(1) });
const GroupIdSchema = z.object({ groupId: z.string().min(1) });
const UserGroupSchema = UserIdSchema.extend(GroupIdSchema.shape);
const SuspendUserSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().optional(),
});
const ConfirmSchema = z.object({ confirm: z.literal(true) });

// Helper function to create confirmation tools
function createConfirmationTools<T>(
  baseName: string,
  schema: z.ZodType<T>,
  action: (input: T) => Promise<any>,
  description: string
): [Tool, Tool] {
  const confirmTool: Tool = {
    name: baseName,
    description: `Destructive action. First call '${baseName}' to get confirmation message; then call '${baseName}_confirm' with {confirm:true}.`,
    inputSchema: z.object({ preview: z.boolean().default(true) }),
    handler: async () => ({
      confirmationRequired: true,
      message: `Call ${baseName}_confirm with { ...args, confirm: true } to execute.`,
    }),
  };

  const executeTool: Tool = {
    name: `${baseName}_confirm`,
    description: `CONFIRMED execution of ${description}`,
    inputSchema: z.intersection(schema, z.object({ confirm: z.literal(true) })),
    handler: async (input, ctx) => {
      const startTime = Date.now();
      try {
        ensureAllowed(baseName, ctx);
        const result = await action(input);
        const duration = Date.now() - startTime;
        await audit(
          baseName,
          { ...input, confirm: true },
          result,
          ctx,
          undefined,
          undefined,
          duration
        );
        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        await audit(baseName, input, null, ctx, error, undefined, duration);
        throw error;
      }
    },
  };

  return [confirmTool, executeTool];
}

// User lifecycle management tools
export const [suspend_user, suspend_user_confirm] = createConfirmationTools(
  "suspend_user",
  SuspendUserSchema,
  async ({ userId }: SuspendUserInput) => {
    await okta.post(`/users/${userId}/lifecycle/suspend`);
    return { ok: true, message: `User ${userId} suspended successfully` };
  },
  "suspend user"
);

export const [unsuspend_user, unsuspend_user_confirm] = createConfirmationTools(
  "unsuspend_user",
  UserIdSchema,
  async ({ userId }: UserIdInput) => {
    await okta.post(`/users/${userId}/lifecycle/unsuspend`);
    return { ok: true, message: `User ${userId} unsuspended successfully` };
  },
  "unsuspend user"
);

export const [deactivate_user, deactivate_user_confirm] =
  createConfirmationTools(
    "deactivate_user",
    UserIdSchema,
    async ({ userId }: UserIdInput) => {
      await okta.post(`/users/${userId}/lifecycle/deactivate`);
      return { ok: true, message: `User ${userId} deactivated successfully` };
    },
    "deactivate user"
  );

export const [reactivate_user, reactivate_user_confirm] =
  createConfirmationTools(
    "reactivate_user",
    UserIdSchema,
    async ({ userId }: UserIdInput) => {
      await okta.post(`/users/${userId}/lifecycle/reactivate`);
      return { ok: true, message: `User ${userId} reactivated successfully` };
    },
    "reactivate user"
  );

// Session management tools
export const [clear_user_sessions, clear_user_sessions_confirm] =
  createConfirmationTools(
    "clear_user_sessions",
    UserIdSchema,
    async ({ userId }: UserIdInput) => {
      await okta.delete(`/users/${userId}/sessions`);
      return { ok: true, message: `All sessions cleared for user ${userId}` };
    },
    "clear user sessions"
  );

// Group management tools
export const [add_user_to_group, add_user_to_group_confirm] =
  createConfirmationTools(
    "add_user_to_group",
    UserGroupSchema,
    async ({ userId, groupId }: UserGroupInput) => {
      await okta.put(`/groups/${groupId}/users/${userId}`);
      return { ok: true, message: `User ${userId} added to group ${groupId}` };
    },
    "add user to group"
  );

export const [remove_user_from_group, remove_user_from_group_confirm] =
  createConfirmationTools(
    "remove_user_from_group",
    UserGroupSchema,
    async ({ userId, groupId }: UserGroupInput) => {
      await okta.delete(`/groups/${groupId}/users/${userId}`);
      return {
        ok: true,
        message: `User ${userId} removed from group ${groupId}`,
      };
    },
    "remove user from group"
  );

// Password management tools
export const [reset_password, reset_password_confirm] = createConfirmationTools(
  "reset_password",
  UserIdSchema,
  async ({ userId }: UserIdInput) => {
    const res = await okta.post(
      `/users/${userId}/lifecycle/expiring_password?tempPassword=true`
    );
    return {
      ok: true,
      message: `Password reset for user ${userId}`,
      tempPassword: res.data?.tempPassword,
    };
  },
  "reset user password"
);
