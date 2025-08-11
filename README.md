# MCP Okta Server

> Model Context Protocol (MCP) server for Okta administration - enabling natural language interaction with Okta APIs for user management, group administration, and system monitoring

[![npm version](https://badge.fury.io/js/%40mcp%2Fokta.svg)](https://badge.fury.io/js/%40mcp%2Fokta)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready Model Context Protocol (MCP) server for Okta administration that enables business users to perform safe admin actions through natural language queries.

## Features

### 🔍 Read Tools

- **get_user_by_email**: Find users by email address
- **search_users**: Search users with Okta filter syntax
- **list_groups**: List groups with optional filtering
- **list_apps**: List Okta applications
- **system_log**: Query System Log events with time ranges

### 🛡️ Admin Tools (with Guardrails)

- **suspend_user** / **unsuspend_user**: Temporarily disable/enable user access
- **deactivate_user** / **reactivate_user**: Permanently disable/enable user accounts
- **clear_user_sessions**: Sign out user from all devices
- **add_user_to_group** / **remove_user_from_group**: Manage group memberships
- **reset_password**: Force password reset with temporary password

### 🔐 Security Features

- **OAuth 2.0 Client Credentials**: Secure API access (no SSWS tokens)
- **Role-Based Access Control (RBAC)**: analyst, helpdesk, admin roles
- **Two-Step Confirmation**: Destructive actions require explicit confirmation
- **Comprehensive Audit Logging**: All actions logged with correlation IDs
- **Rate Limiting**: Respects Okta API limits with automatic backoff

## Quick Start

### 1. Prerequisites

- Node.js 18+
- Okta Developer Account
- OAuth 2.0 application configured in Okta

### 2. Installation

```bash
# Clone the repository
git clone <your-repo>
cd mcp-okta

# Install dependencies
npm install

# Copy environment template
cp env.example .env
```

### 3. Configuration

Edit `.env` with your Okta settings:

```bash
OKTA_DOMAIN=dev-123456.okta.com
OKTA_OAUTH_TOKEN_URL=https://dev-123456.okta.com/oauth2/default/v1/token
OKTA_CLIENT_ID=your-client-id
OKTA_CLIENT_SECRET=your-client-secret
ALLOWED_ROLES=analyst,helpdesk,admin
LOG_LEVEL=info
```

### 4. Run Locally

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm run serve
```

## Okta Setup

### 1. Create OAuth 2.0 Application

1. Go to **Applications** → **Applications** in Okta Admin Console
2. Click **Create App Integration**
3. Choose **API Services** → **OAuth 2.0**
4. Configure scopes:
   ```
   okta.users.read
   okta.groups.read
   okta.apps.read
   okta.logs.read
   okta.users.manage
   okta.groups.manage
   okta.sessions.manage
   ```

### 2. Get Credentials

- Copy the **Client ID** and **Client Secret**
- Note your **Okta Domain** (e.g., `dev-123456.okta.com`)
- Set the **Token URL** to `https://{domain}/oauth2/default/v1/token`

## Usage Examples

### Basic User Queries

```json
// Find user by email
{
  "tool": "get_user_by_email",
  "input": { "email": "user@example.com" }
}

// Search users with filter
{
  "tool": "search_users",
  "input": {
    "query": "profile.lastName sw \"Smith\"",
    "status": "ACTIVE",
    "limit": 50
  }
}
```

### Group Management

```json
// List groups
{
  "tool": "list_groups",
  "input": { "query": "Sales", "limit": 20 }
}

// Add user to group (requires confirmation)
{
  "tool": "add_user_to_group",
  "input": { "userId": "00u123", "groupId": "00g456" }
}

// Confirm the action
{
  "tool": "add_user_to_group_confirm",
  "input": {
    "userId": "00u123",
    "groupId": "00g456",
    "confirm": true
  }
}
```

### System Log Queries

```json
// Recent login events
{
  "tool": "system_log",
  "input": {
    "query": "eventType eq \"user.session.start\"",
    "since": "2024-01-01T00:00:00Z",
    "limit": 100
  }
}

// Failed authentication attempts
{
  "tool": "system_log",
  "input": {
    "query": "eventType eq \"user.authentication.auth_via_mfa\" and outcome.result eq \"FAILURE\"",
    "since": "2024-01-01T00:00:00Z"
  }
}
```

## Role-Based Access Control

### Analyst Role (Read-Only)

- `get_user_by_email`
- `search_users`
- `list_groups`
- `list_apps`
- `system_log`

### Helpdesk Role (Limited Admin)

- All analyst tools
- `suspend_user` / `unsuspend_user`
- `clear_user_sessions`
- `add_user_to_group` / `remove_user_from_group`
- `reset_password`

### Admin Role (Full Access)

- All helpdesk tools
- `deactivate_user` / `reactivate_user`

## Deployment

### Docker

```bash
# Build image
docker build -t mcp-okta .

# Run container
docker run -d \
  --name mcp-okta \
  -e OKTA_DOMAIN=dev-123456.okta.com \
  -e OKTA_CLIENT_ID=your-client-id \
  -e OKTA_CLIENT_SECRET=your-client-secret \
  mcp-okta
```

### Azure Container Apps

```bash
# Make script executable
chmod +x deploy-aca.sh

# Deploy (requires Azure CLI)
./deploy-aca.sh

# Add secrets to Key Vault
az keyvault secret set --vault-name kv-mcp-okta --name OKTA-CLIENT-ID --value "your-client-id"
az keyvault secret set --vault-name kv-mcp-okta --name OKTA-CLIENT-SECRET --value "your-client-secret"
```

## MCP Client Integration

### ChatGPT (Remote MCP)

1. Go to **Settings** → **Advanced** → **Model Context Protocol**
2. Add new provider:
   - **Name**: Okta Admin
   - **Command**: `npm start` (or path to your executable)
   - **Arguments**: Leave empty
3. Pass metadata for RBAC:
   ```json
   {
     "callerRole": "helpdesk",
     "caller": "user@company.com",
     "correlationId": "uuid-here"
   }
   ```

### Cursor/Other Clients

Configure your MCP client to use the server executable or HTTP endpoint. Most clients will forward tool metadata for RBAC and auditing.

## Security Best Practices

### 1. OAuth Configuration

- Use OAuth 2.0 Client Credentials (not SSWS tokens)
- Grant minimal required scopes
- Rotate client secrets every 90 days
- Use Azure Key Vault for secret storage

### 2. Network Security

- Deploy in private VNet when possible
- Use mTLS for HTTP transport
- Restrict access to trusted IP ranges
- Enable Azure Application Gateway for WAF

### 3. Monitoring & Auditing

- All actions are logged with correlation IDs
- Monitor for failed authentication attempts
- Set up alerts for unusual activity patterns
- Regular access reviews and RBAC audits

### 4. Operational Security

- Use managed identities in Azure
- Implement proper error handling
- Regular security updates
- Backup and disaster recovery planning

## Troubleshooting

### Common Issues

**OAuth Token Errors**

```bash
# Check environment variables
echo $OKTA_DOMAIN
echo $OKTA_CLIENT_ID

# Verify OAuth app configuration in Okta
# Ensure scopes are properly configured
```

**Rate Limiting**

```bash
# Check logs for rate limit warnings
# Implement exponential backoff
# Consider caching frequently accessed data
```

**Permission Denied**

```bash
# Verify RBAC role assignment
# Check Okta API scopes
# Ensure user has required permissions
```

### Logs

```bash
# View structured logs
npm start | jq

# Filter by correlation ID
npm start | jq 'select(.correlationId == "your-id")'
```

## Development

### Project Structure

```
src/
├── config/
│   └── rbac.ts          # Role-based access control
├── tools/
│   ├── read-tools.ts    # Read-only operations
│   └── admin-tools.ts   # Administrative operations
├── types/
│   └── okta.ts          # TypeScript type definitions
├── utils/
│   ├── audit.ts         # Audit logging
│   ├── okta-client.ts   # Okta API client
│   └── rbac.ts          # RBAC utilities
└── server.ts            # Main MCP server
```

### Adding New Tools

1. Define input schema in `src/types/okta.ts`
2. Implement tool in appropriate tools file
3. Add to RBAC configuration in `src/config/rbac.ts`
4. Register in `src/server.ts`

### Testing

```bash
# Run with test data
OKTA_DOMAIN=test.okta.com npm start

# Use dry-run mode for admin tools
# (implement in admin-tools.ts)
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit pull request

## License

MIT License - see LICENSE file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/nivikamal/mcp-okta/issues)
- **Documentation**: [Okta Developer Docs](https://developer.okta.com/)
- **MCP Spec**: [Model Context Protocol](https://modelcontextprotocol.io/)

## Topics

![mcp](https://img.shields.io/badge/MCP-Protocol-blue)
![okta](https://img.shields.io/badge/Okta-Identity-orange)
![typescript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![nodejs](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![oauth](https://img.shields.io/badge/OAuth-2.0-green)
![rbac](https://img.shields.io/badge/RBAC-Access%20Control-red)

## Roadmap

- [ ] CSV export tools
- [ ] Bulk operations
- [ ] Advanced filtering
- [ ] Webhook integration
- [ ] Multi-tenant support
- [ ] Performance optimizations
