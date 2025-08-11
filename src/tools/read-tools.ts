import { Tool } from "@modelcontextprotocol/sdk";
import { z } from "zod";
import {
  okta,
  nextCursorFromLink,
  handleRateLimit,
} from "../utils/okta-client.js";
import { ensureAllowed } from "../utils/rbac.js";
import { audit } from "../utils/audit.js";
import {
  UserResult,
  GroupResult,
  AppResult,
  LogEventResult,
  EmailInput,
  SearchUsersInput,
  GroupQueryInput,
  AppsQueryInput,
  LogQueryInput,
} from "../types/okta.js";

// Schema definitions
const EmailSchema = z.object({ email: z.string().email() });
const SearchUsersSchema = z.object({
  query: z.string().min(1),
  status: z
    .enum([
      "ACTIVE",
      "DEPROVISIONED",
      "LOCKED_OUT",
      "PASSWORD_EXPIRED",
      "PROVISIONED",
      "RECOVERY",
      "STAGED",
      "SUSPENDED",
    ])
    .optional(),
  limit: z.number().int().min(1).max(200).optional(),
  after: z.string().optional(),
});
const GroupQuerySchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().min(1).max(200).optional(),
  after: z.string().optional(),
});
const AppsQuerySchema = GroupQuerySchema;
const LogQuerySchema = z.object({
  query: z.string().optional(),
  since: z.string().optional(),
  until: z.string().optional(),
  limit: z.number().int().min(1).max(1000).optional(),
  after: z.string().optional(),
});

// Helper function to wrap tool handlers with RBAC and audit
function wrapTool<T>(
  toolName: string,
  schema: z.ZodType<T>,
  handler: (input: T, ctx: any) => Promise<any>
): Tool {
  return {
    name: toolName,
    description: getToolDescription(toolName),
    inputSchema: schema,
    handler: async (input, ctx) => {
      const startTime = Date.now();
      try {
        ensureAllowed(toolName, ctx);
        const result = await handler(input, ctx);
        const duration = Date.now() - startTime;
        await audit(
          toolName,
          input,
          result,
          ctx,
          undefined,
          undefined,
          duration
        );
        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        await audit(toolName, input, null, ctx, error, undefined, duration);
        throw error;
      }
    },
  };
}

function getToolDescription(toolName: string): string {
  const descriptions: Record<string, string> = {
    get_user_by_email: "Return a single user by primary email address.",
    search_users:
      "Search users with Okta search syntax. Supports pagination via 'after' cursor.",
    list_groups:
      "List groups with optional query filter. Supports pagination via 'after' cursor.",
    list_apps:
      "List Okta applications with optional query filter. Supports pagination via 'after' cursor.",
    system_log:
      "Query Okta System Log by expression with optional since/until ISO timestamps.",
  };
  return descriptions[toolName] || "No description available.";
}

// Tool implementations
export const getUserByEmail = wrapTool(
  "get_user_by_email",
  EmailSchema,
  async (input: EmailInput) => {
    const res = await okta.get(`/users`, {
      params: { search: `profile.email eq "${input.email}"` },
    });

    const users = res.data as any[];
    const user = users[0];

    if (!user) {
      return { found: false };
    }

    return {
      found: true,
      user: {
        id: user.id,
        status: user.status,
        email: user.profile.email,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        login: user.profile.login,
      } as UserResult,
    };
  }
);

export const searchUsers = wrapTool(
  "search_users",
  SearchUsersSchema,
  async (input: SearchUsersInput) => {
    const params: any = {
      search: input.query,
      limit: input.limit ?? 100,
      after: input.after,
    };

    if (input.status) {
      params.filter = `status eq "${input.status}"`;
    }

    const res = await okta.get(`/users`, { params });
    handleRateLimit(res.headers);

    const users = (res.data as any[]).map((u) => ({
      id: u.id,
      status: u.status,
      email: u.profile.email,
      firstName: u.profile.firstName,
      lastName: u.profile.lastName,
    })) as UserResult[];

    const nextCursor = nextCursorFromLink(
      res.headers["link"] as string | undefined
    );

    return { users, nextCursor };
  }
);

export const listGroups = wrapTool(
  "list_groups",
  GroupQuerySchema,
  async (input: GroupQueryInput) => {
    const params: any = {
      limit: input.limit ?? 100,
      after: input.after,
    };

    if (input.query) {
      params.q = input.query;
    }

    const res = await okta.get(`/groups`, { params });
    handleRateLimit(res.headers);

    const groups = (res.data as any[]).map((g) => ({
      id: g.id,
      name: g.profile?.name,
      type: g.type,
    })) as GroupResult[];

    const nextCursor = nextCursorFromLink(
      res.headers["link"] as string | undefined
    );

    return { groups, nextCursor };
  }
);

export const listApps = wrapTool(
  "list_apps",
  AppsQuerySchema,
  async (input: AppsQueryInput) => {
    const params: any = {
      limit: input.limit ?? 100,
      after: input.after,
    };

    if (input.query) {
      params.q = input.query;
    }

    const res = await okta.get(`/apps`, { params });
    handleRateLimit(res.headers);

    const apps = (res.data as any[]).map((a) => ({
      id: a.id,
      label: a.label,
      status: a.status,
      name: a.name,
    })) as AppResult[];

    const nextCursor = nextCursorFromLink(
      res.headers["link"] as string | undefined
    );

    return { apps, nextCursor };
  }
);

export const systemLog = wrapTool(
  "system_log",
  LogQuerySchema,
  async (input: LogQueryInput) => {
    const params: any = {
      limit: input.limit ?? 100,
      after: input.after,
    };

    if (input.query) {
      params.query = input.query;
    }
    if (input.since) {
      params.since = input.since;
    }
    if (input.until) {
      params.until = input.until;
    }

    const res = await okta.get(`/logs`, { params });
    handleRateLimit(res.headers);

    const events = (res.data as any[]).map((e) => ({
      uuid: e.uuid,
      published: e.published,
      eventType: e.eventType,
      outcome: e.outcome?.result,
      actor: e.actor?.displayName,
      target: e.target?.[0]?.displayName,
    })) as LogEventResult[];

    const nextCursor = nextCursorFromLink(
      res.headers["link"] as string | undefined
    );

    return { events, nextCursor };
  }
);
