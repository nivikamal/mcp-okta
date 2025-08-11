export type Role = "analyst" | "helpdesk" | "admin";

export const roleToolAllowList: Record<Role, string[]> = {
  analyst: [
    "get_user_by_email",
    "search_users",
    "list_groups",
    "list_apps",
    "system_log",
  ],
  helpdesk: [
    "get_user_by_email",
    "search_users",
    "list_groups",
    "list_apps",
    "system_log",
    "suspend_user",
    "unsuspend_user",
    "clear_user_sessions",
    "add_user_to_group",
    "remove_user_from_group",
    "reset_password",
  ],
  admin: [
    "get_user_by_email",
    "search_users",
    "list_groups",
    "list_apps",
    "system_log",
    "suspend_user",
    "unsuspend_user",
    "deactivate_user",
    "reactivate_user",
    "clear_user_sessions",
    "add_user_to_group",
    "remove_user_from_group",
    "reset_password",
  ],
};

export function getDefaultRole(): Role {
  return "analyst";
}

export function isRoleValid(role: string): role is Role {
  return role in roleToolAllowList;
}
