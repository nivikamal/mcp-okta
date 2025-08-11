// Okta API Response Types
export interface OktaUser {
  id: string;
  status: string;
  profile: {
    email: string;
    firstName: string;
    lastName: string;
    login: string;
  };
  created: string;
  lastUpdated: string;
}

export interface OktaGroup {
  id: string;
  type: string;
  profile?: {
    name: string;
    description?: string;
  };
  created: string;
  lastUpdated: string;
}

export interface OktaApp {
  id: string;
  name: string;
  label: string;
  status: string;
  created: string;
  lastUpdated: string;
}

export interface OktaLogEvent {
  uuid: string;
  published: string;
  eventType: string;
  outcome?: {
    result: string;
  };
  actor?: {
    displayName: string;
    id: string;
  };
  target?: Array<{
    displayName: string;
    id: string;
  }>;
  debugContext?: {
    debugData?: Record<string, unknown>;
  };
}

// Internal Response Types
export interface UserResult {
  id: string;
  status: string;
  email: string;
  firstName: string;
  lastName: string;
  login?: string;
}

export interface GroupResult {
  id: string;
  name?: string;
  type: string;
}

export interface AppResult {
  id: string;
  label: string;
  status: string;
  name: string;
}

export interface LogEventResult {
  uuid: string;
  published: string;
  eventType: string;
  outcome?: string;
  actor?: string;
  target?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor?: string | null;
}

// Tool Input Schemas
export interface EmailInput {
  email: string;
}

export interface SearchUsersInput {
  query: string;
  status?: string;
  limit?: number;
  after?: string;
}

export interface GroupQueryInput {
  query?: string;
  limit?: number;
  after?: string;
}

export interface AppsQueryInput {
  query?: string;
  limit?: number;
  after?: string;
}

export interface LogQueryInput {
  query?: string;
  since?: string;
  until?: string;
  limit?: number;
  after?: string;
}

export interface UserIdInput {
  userId: string;
}

export interface GroupIdInput {
  groupId: string;
}

export interface UserGroupInput extends UserIdInput, GroupIdInput {}

export interface ConfirmInput {
  confirm: true;
}

export interface SuspendUserInput extends UserIdInput {
  reason?: string;
}
