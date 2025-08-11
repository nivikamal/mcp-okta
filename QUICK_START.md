# Quick Start Guide for End Users

This guide helps you quickly set up and use the Okta MCP server from the registry.

## Prerequisites

- Node.js 18+ installed
- Okta Admin Console access
- MCP client (like Claude Desktop)

## Step 1: Install the MCP Server

```bash
npm install -g @mcp/okta
```

## Step 2: Set Up Okta OAuth Application

1. **Log into Okta Admin Console**
2. **Go to Applications → Applications**
3. **Click "Create App Integration"**
4. **Choose "API Services" → "OIDC - OpenID Connect"**
5. **Configure:**
   - Name: `MCP Okta Server`
   - Grant type: `Client Credentials`
   - Token auth: `Client Secret Basic`
6. **Add API Scopes:**
   - `okta.users.read`
   - `okta.users.manage`
   - `okta.groups.read`
   - `okta.groups.manage`
   - `okta.apps.read`
   - `okta.logs.read`
7. **Note your Client ID and Secret**

## Step 3: Configure Your MCP Client

Create or edit your MCP client config file (e.g., `~/.config/mcp/servers.json`):

```json
{
  "mcpServers": {
    "okta": {
      "command": "npx",
      "args": ["@mcp/okta"],
      "env": {
        "OKTA_DOMAIN": "your-domain.okta.com",
        "OKTA_OAUTH_TOKEN_URL": "https://your-domain.okta.com/oauth2/default/v1/token",
        "OKTA_CLIENT_ID": "your-client-id",
        "OKTA_CLIENT_SECRET": "your-client-secret",
        "ALLOWED_ROLES": "analyst,helpdesk,admin",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## Step 4: Start Using

1. **Start your MCP client:**

   ```bash
   claude-desktop
   ```

2. **Test with natural language:**
   ```
   "Find all active users in Okta"
   "Show me the groups in our organization"
   "Search for users with email containing @company.com"
   ```

## Available Roles

### Analyst (Read-Only)

- Search and view users
- List groups and applications
- Query system logs

### Helpdesk (Limited Admin)

- All Analyst permissions
- Suspend/unsuspend users
- Reset passwords
- Manage group memberships
- Clear user sessions

### Admin (Full Access)

- All Helpdesk permissions
- Deactivate/reactivate users

## Example Commands

### User Management

```
"Find user john.doe@company.com"
"Search for all active users"
"Show me users created in the last 30 days"
```

### Group Management

```
"List all groups"
"Show members of the 'Developers' group"
"Add user john.doe@company.com to the 'Managers' group"
```

### Administrative Actions

```
"Suspend user jane.smith@company.com"
"Reset password for user bob.wilson@company.com"
"Clear all sessions for user alice.jones@company.com"
```

## Security Notes

- **Start with minimal roles**: Use `analyst` only initially
- **Secure your secrets**: Don't commit config files to version control
- **Monitor usage**: Check logs for unusual activity
- **Regular reviews**: Update role assignments as needed

## Troubleshooting

### "Command not found"

```bash
npm install -g @mcp/okta
```

### Authentication errors

- Verify Okta OAuth app configuration
- Check API scopes are set correctly
- Ensure client credentials are correct

### Permission errors

- Verify your role is in `ALLOWED_ROLES`
- Check if the tool is allowed for your role

## Getting Help

- **Documentation**: `npm docs @mcp/okta`
- **Issues**: [GitHub Issues](https://github.com/nivikamal/mcp-okta/issues)
- **Registry**: [MCP Registry](https://registry.modelcontextprotocol.io)

## Next Steps

1. **Explore available tools** in your MCP client
2. **Set up monitoring** for your Okta environment
3. **Train your team** on using natural language for Okta administration
4. **Customize roles** based on your organization's needs

Happy automating! 🚀
