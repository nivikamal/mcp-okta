import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import pino from "pino";

const log = pino({ level: process.env.LOG_LEVEL || "info" });

// Configuration
const OKTA_DOMAIN = process.env.OKTA_DOMAIN!;
const TOKEN_URL = process.env.OKTA_OAUTH_TOKEN_URL!;
const OKTA_CLIENT_ID = process.env.OKTA_CLIENT_ID!;
const OKTA_CLIENT_SECRET = process.env.OKTA_CLIENT_SECRET!;
const OKTA_BASE = `https://${OKTA_DOMAIN}/api/v1`;

// Token cache
interface TokenCache {
  access_token: string;
  exp: number;
}

let tokenCache: TokenCache | null = null;

async function getToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // Return cached token if still valid (with 30s buffer)
  if (tokenCache && now < tokenCache.exp - 30) {
    return tokenCache.access_token;
  }

  log.info("Fetching new Okta OAuth token");

  const form = new URLSearchParams({
    grant_type: "client_credentials",
    scope: [
      "okta.users.read",
      "okta.groups.read",
      "okta.apps.read",
      "okta.logs.read",
      "okta.users.manage",
      "okta.groups.manage",
      "okta.sessions.manage",
    ].join(" "),
  });

  try {
    const resp = await axios.post(TOKEN_URL, form.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      auth: {
        username: OKTA_CLIENT_ID,
        password: OKTA_CLIENT_SECRET,
      },
      timeout: 10000,
    });

    tokenCache = {
      access_token: resp.data.access_token,
      exp: Math.floor(Date.now() / 1000) + resp.data.expires_in,
    };

    log.info("Successfully obtained Okta OAuth token");
    return tokenCache.access_token;
  } catch (error: any) {
    log.error({ error: error.message }, "Failed to obtain Okta OAuth token");
    throw new Error(`OAuth token request failed: ${error.message}`);
  }
}

// Create Okta API client
const okta: AxiosInstance = axios.create({
  baseURL: OKTA_BASE,
  timeout: 20000,
});

// Request interceptor to add auth token
okta.interceptors.request.use(async (config: any) => {
  config.headers = config.headers || {};
  config.headers.Authorization = `Bearer ${await getToken()}`;
  return config;
});

// Response interceptor for logging and error handling
okta.interceptors.response.use(
  (response) => {
    log.debug(
      {
        method: response.config.method,
        url: response.config.url,
        status: response.status,
      },
      "Okta API request successful"
    );
    return response;
  },
  (error) => {
    log.error(
      {
        method: error.config?.method,
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.errorSummary || error.message,
      },
      "Okta API request failed"
    );
    return Promise.reject(error);
  }
);

// Helper function to extract next cursor from Link header
export function nextCursorFromLink(link?: string): string | null {
  if (!link) return null;

  const next = /<([^>]+)>;\s*rel="next"/.exec(link)?.[1];
  if (!next) return null;

  try {
    const url = new URL(next);
    return url.searchParams.get("after");
  } catch {
    return null;
  }
}

// Helper function to handle rate limiting
export function handleRateLimit(headers: any): void {
  const remaining = headers["x-rate-limit-remaining"];
  const reset = headers["x-rate-limit-reset"];

  if (remaining && parseInt(remaining) < 10) {
    log.warn({ remaining, reset }, "Approaching Okta rate limit");
  }
}

export { okta, getToken };
