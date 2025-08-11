# Okta MCP Server Configuration Guide

This guide explains how to configure the Okta MCP server for your specific environment and use cases.

## Quick Configuration

1. Copy `.env.example` to `.env`
2. Fill in your Okta API credentials
3. Set your desired RBAC roles
4. Start the server

```bash
cp .env.example .env
# Edit .env with your settings
npm start
```

## Environment Variables

### Required Okta Configuration

| Variable               | Description                         | Example                                               |
| ---------------------- | ----------------------------------- | ----------------------------------------------------- |
| `OKTA_DOMAIN`          | Your Okta domain (without https://) | `dev-123456.okta.com`                                 |
| `OKTA_OAUTH_TOKEN_URL` | OAuth token endpoint URL            | `https://dev-123456.okta.com/oauth2/default/v1/token` |
| `OKTA_CLIENT_ID`       | OAuth client ID from Okta           | `0oa1b2c3d4e5f6g7h8i9`                                |
| `OKTA_CLIENT_SECRET`   | OAuth client secret from Okta       | `your-secret-here`                                    |

### Optional RBAC Configuration

| Variable        | Description                           | Default                  | Example            |
| --------------- | ------------------------------------- | ------------------------ | ------------------ |
| `ALLOWED_ROLES` | Comma-separated list of allowed roles | `analyst,helpdesk,admin` | `analyst,helpdesk` |

### Logging Configuration

| Variable    | Description       | Default | Options                          |
| ----------- | ----------------- | ------- | -------------------------------- |
| `LOG_LEVEL` | Logging verbosity | `info`  | `debug`, `info`, `warn`, `error` |

### Azure Key Vault Integration (Production)

| Variable               | Description              | Example                                |
| ---------------------- | ------------------------ | -------------------------------------- |
| `AZURE_KEY_VAULT_NAME` | Key Vault name           | `kv-mcp-okta`                          |
| `AZURE_TENANT_ID`      | Azure tenant ID          | `12345678-1234-1234-1234-123456789012` |
| `AZURE_CLIENT_ID`      | Service principal ID     | `87654321-4321-4321-4321-210987654321` |
| `AZURE_CLIENT_SECRET`  | Service principal secret | `your-service-principal-secret`        |

## Okta Setup Instructions

### 1. Create OAuth Application in Okta

1. Log into your Okta Admin Console
2. Navigate to **Applications** → **Applications**
3. Click **Create App Integration**
4. Choose **API Services** → **OIDC - OpenID Connect**
5. Configure the application:
   - **Application name**: `MCP Okta Server`
   - **Grant type**: `Client Credentials`
   - **Token endpoint authentication method**: `Client Secret Basic`

### 2. Configure API Scopes

1. In your OAuth application, go to **Okta API Scopes**
2. Add the following scopes:
   - `okta.users.read` - For user read operations
   - `okta.users.manage` - For user management operations
   - `okta.groups.read` - For group read operations
   - `okta.groups.manage` - For group management operations
   - `okta.apps.read` - For application read operations
   - `okta.logs.read` - For system log access

### 3. Get Credentials

1. Note your **Client ID** and **Client Secret**
2. Your **Okta Domain** is visible in the admin console URL
3. The **Token URL** follows the pattern: `https://{domain}/oauth2/default/v1/token`

## Role-Based Access Control (RBAC)

The server supports three predefined roles with different permission levels:

### Analyst Role (Read-Only)

- `get_user_by_email` - Find users by email
- `search_users` - Search users with filters
- `list_groups` - List all groups
- `list_apps` - List all applications
- `system_log` - Query system logs

### Helpdesk Role (Limited Admin)

All Analyst permissions plus:

- `suspend_user` / `unsuspend_user` - Suspend/unsuspend users
- `clear_user_sessions` - Clear user sessions
- `add_user_to_group` / `remove_user_from_group` - Manage group memberships
- `reset_password` - Reset user passwords

### Admin Role (Full Access)

All Helpdesk permissions plus:

- `deactivate_user` / `reactivate_user` - Deactivate/reactivate users

### Customizing Roles

To customize role permissions, edit `src/config/rbac.ts`:

```typescript
export const roleToolAllowList: Record<Role, string[]> = {
  analyst: [
    "get_user_by_email",
    "search_users",
    // Add or remove tools as needed
  ],
  // ... other roles
};
```

## Security Best Practices

### 1. Environment Variables

- Never commit `.env` files to version control
- Use Azure Key Vault or similar for production secrets
- Rotate OAuth client secrets regularly

### 2. Network Security

- Deploy behind a reverse proxy (nginx, Azure Application Gateway)
- Use HTTPS in production
- Implement IP allowlisting if possible

### 3. Monitoring

- Enable structured logging with `LOG_LEVEL=info`
- Monitor audit logs for suspicious activity
- Set up alerts for failed authentication attempts

### 4. Access Control

- Limit `ALLOWED_ROLES` to only what you need
- Regularly review and update role permissions
- Use the principle of least privilege

## Production Deployment

### Azure Container Apps

1. **Build and push your Docker image**:

```bash
docker build -t your-registry/mcp-okta:latest .
docker push your-registry/mcp-okta:latest
```

2. **Deploy using the provided script**:

```bash
./deploy-aca.sh
```

3. **Set secrets in Azure Key Vault**:

```bash
az keyvault secret set --vault-name kv-mcp-okta --name OKTA-CLIENT-ID --value "your-client-id"
az keyvault secret set --vault-name kv-mcp-okta --name OKTA-CLIENT-SECRET --value "your-client-secret"
az keyvault secret set --vault-name kv-mcp-okta --name OKTA-DOMAIN --value "your-domain.okta.com"
az keyvault secret set --vault-name kv-mcp-okta --name OKTA-OAUTH-TOKEN-URL --value "https://your-domain.okta.com/oauth2/default/v1/token"
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: "3.8"
services:
  mcp-okta:
    build: .
    ports:
      - "8080:8080"
    environment:
      - LOG_LEVEL=info
    env_file:
      - .env
    restart: unless-stopped
```

## Testing Your Configuration

1. **Test basic connectivity**:

```bash
node scripts/test-server.js
```

2. **Test with your MCP client**:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_users",
    "arguments": {
      "query": "status eq \"ACTIVE\"",
      "limit": 5
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**

   - Verify OAuth client credentials
   - Check API scopes are properly configured
   - Ensure token URL is correct

2. **Permission Errors**

   - Verify the caller's role is in `ALLOWED_ROLES`
   - Check if the tool is allowed for the role
   - Review RBAC configuration

3. **Rate Limiting**

   - The server automatically handles Okta rate limits
   - Check logs for rate limit warnings
   - Consider implementing request queuing for high-volume usage

4. **Network Issues**
   - Verify Okta domain is accessible
   - Check firewall/proxy settings
   - Test with `curl` or Postman

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm start
```

This will show detailed request/response logs and help diagnose issues.

## Configuration Examples

### Development Environment

```ini
OKTA_DOMAIN=dev-123456.okta.com
OKTA_OAUTH_TOKEN_URL=https://dev-123456.okta.com/oauth2/default/v1/token
OKTA_CLIENT_ID=0oa1b2c3d4e5f6g7h8i9
OKTA_CLIENT_SECRET=dev-secret-here
ALLOWED_ROLES=analyst,helpdesk,admin
LOG_LEVEL=debug
```

### Production Environment

```ini
OKTA_DOMAIN=company.okta.com
OKTA_OAUTH_TOKEN_URL=https://company.okta.com/oauth2/default/v1/token
OKTA_CLIENT_ID=0oa1b2c3d4e5f6g7h8i9
OKTA_CLIENT_SECRET=prod-secret-here
ALLOWED_ROLES=analyst,helpdesk
LOG_LEVEL=info
AZURE_KEY_VAULT_NAME=kv-mcp-okta
AZURE_TENANT_ID=12345678-1234-1234-1234-123456789012
AZURE_CLIENT_ID=87654321-4321-4321-4321-210987654321
AZURE_CLIENT_SECRET=azure-service-principal-secret
```

## Next Steps

1. **Set up monitoring and alerting**
2. **Configure backup and disaster recovery**
3. **Implement user training and documentation**
4. **Set up regular security reviews**
5. **Plan for scaling and performance optimization**

For additional help, refer to the main [README.md](README.md) or create an issue in the project repository.
