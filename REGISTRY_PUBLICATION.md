# Publishing to MCP Registry

This guide explains how to publish your Okta MCP server to the MCP registry and how end users will configure it.

## Publishing to MCP Registry

### 1. Prepare Your Package

First, ensure your package is ready for registry publication:

```bash
# Build the package
npm run build

# Test the package
npm test

# Create a release tag
git tag v0.2.0
git push origin v0.2.0
```

### 2. Registry Publication Process

The MCP registry typically requires:

1. **Package Metadata**: Update `package.json` with registry-specific fields
2. **Documentation**: Ensure README and configuration docs are complete
3. **Security Review**: Registry may review security practices
4. **Testing**: Registry may test the package functionality

### 3. Registry-Specific Configuration

Add registry metadata to your `package.json`:

```json
{
  "name": "@mcp/okta",
  "version": "0.2.0",
  "description": "Model Context Protocol server for Okta administration",
  "keywords": ["mcp", "okta", "admin", "automation", "identity"],
  "author": "Your Name <your.email@company.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/nivikamal/mcp-okta.git"
  },
  "bugs": {
    "url": "https://github.com/nivikamal/mcp-okta/issues"
  },
  "homepage": "https://github.com/nivikamal/mcp-okta#readme",
  "mcp": {
    "type": "server",
    "protocol": "stdio",
    "capabilities": {
      "tools": true,
      "resources": true,
      "prompts": true
    },
    "entrypoint": "dist/server.js",
    "configSchema": {
      "type": "object",
      "properties": {
        "oktaDomain": {
          "type": "string",
          "description": "Your Okta domain (e.g., dev-123456.okta.com)"
        },
        "oktaOAuthTokenUrl": {
          "type": "string",
          "description": "OAuth token endpoint URL"
        },
        "oktaClientId": {
          "type": "string",
          "description": "OAuth client ID from Okta"
        },
        "oktaClientSecret": {
          "type": "string",
          "description": "OAuth client secret from Okta",
          "secret": true
        },
        "allowedRoles": {
          "type": "string",
          "description": "Comma-separated list of allowed roles",
          "default": "analyst,helpdesk,admin"
        },
        "logLevel": {
          "type": "string",
          "enum": ["debug", "info", "warn", "error"],
          "description": "Logging verbosity",
          "default": "info"
        }
      },
      "required": [
        "oktaDomain",
        "oktaOAuthTokenUrl",
        "oktaClientId",
        "oktaClientSecret"
      ]
    }
  }
}
```

## How End Users Will Configure It

Once published to the registry, end users will configure your MCP server through their MCP client's configuration file.

### 1. MCP Client Configuration

End users will add your server to their MCP client config (e.g., `~/.config/mcp/servers.json`):

```json
{
  "mcpServers": {
    "okta": {
      "command": "npx",
      "args": ["@mcp/okta"],
      "env": {
        "OKTA_DOMAIN": "dev-123456.okta.com",
        "OKTA_OAUTH_TOKEN_URL": "https://dev-123456.okta.com/oauth2/default/v1/token",
        "OKTA_CLIENT_ID": "0oa1b2c3d4e5f6g7h8i9",
        "OKTA_CLIENT_SECRET": "your-secret-here",
        "ALLOWED_ROLES": "analyst,helpdesk,admin",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 2. Alternative: Registry-Aware Configuration

If the registry supports configuration schemas, users might configure it like this:

```json
{
  "mcpServers": {
    "okta": {
      "command": "npx",
      "args": ["@mcp/okta"],
      "config": {
        "oktaDomain": "dev-123456.okta.com",
        "oktaOAuthTokenUrl": "https://dev-123456.okta.com/oauth2/default/v1/token",
        "oktaClientId": "0oa1b2c3d4e5f6g7h8i9",
        "oktaClientSecret": "your-secret-here",
        "allowedRoles": "analyst,helpdesk,admin",
        "logLevel": "info"
      }
    }
  }
}
```

### 3. Environment Variable Override

Users can also override config with environment variables:

```bash
export OKTA_DOMAIN="dev-123456.okta.com"
export OKTA_OAUTH_TOKEN_URL="https://dev-123456.okta.com/oauth2/default/v1/token"
export OKTA_CLIENT_ID="0oa1b2c3d4e5f6g7h8i9"
export OKTA_CLIENT_SECRET="your-secret-here"
export ALLOWED_ROLES="analyst,helpdesk"
export LOG_LEVEL="info"

# Then run their MCP client
```

## End User Setup Guide

### Quick Start for End Users

1. **Install the MCP server**:

   ```bash
   npm install -g @mcp/okta
   ```

2. **Set up Okta OAuth application** (one-time setup):

   - Create OAuth app in Okta Admin Console
   - Configure API scopes
   - Get client ID and secret

3. **Configure MCP client**:

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
           "ALLOWED_ROLES": "analyst,helpdesk,admin"
         }
       }
     }
   }
   ```

4. **Start using**:
   ```bash
   # With Claude Desktop or other MCP client
   claude-desktop
   ```

### Security Considerations for End Users

1. **Secrets Management**:

   - Use environment variables or secure secret stores
   - Never commit secrets to version control
   - Consider using tools like `pass`, `1password`, or cloud secret managers

2. **Role Configuration**:

   - Start with minimal roles (`analyst` only)
   - Add admin roles only when needed
   - Regularly review role assignments

3. **Network Security**:
   - Ensure HTTPS is used for all Okta communications
   - Consider IP allowlisting if possible
   - Monitor for unusual activity

## Registry-Specific Features

### 1. Automatic Updates

Once published, users can update easily:

```bash
npm update -g @mcp/okta
```

### 2. Version Management

Users can specify versions:

```json
{
  "mcpServers": {
    "okta": {
      "command": "npx",
      "args": ["@mcp/okta@0.2.0"],
      "env": { ... }
    }
  }
}
```

### 3. Registry Discovery

Users can discover your server through registry search:

```bash
npm search @mcp/okta
```

## Troubleshooting for End Users

### Common Issues

1. **"Command not found"**:

   ```bash
   npm install -g @mcp/okta
   ```

2. **Authentication errors**:

   - Verify Okta OAuth app configuration
   - Check API scopes are properly set
   - Ensure client credentials are correct

3. **Permission errors**:

   - Verify the user's role is in `ALLOWED_ROLES`
   - Check if the tool is allowed for their role

4. **Network issues**:
   - Verify Okta domain is accessible
   - Check firewall/proxy settings

### Getting Help

- **Documentation**: `npm docs @mcp/okta`
- **Issues**: GitHub repository issues
- **Registry Support**: Contact registry maintainers

## Example End User Workflows

### 1. Helpdesk User Setup

```json
{
  "mcpServers": {
    "okta-helpdesk": {
      "command": "npx",
      "args": ["@mcp/okta"],
      "env": {
        "OKTA_DOMAIN": "company.okta.com",
        "OKTA_OAUTH_TOKEN_URL": "https://company.okta.com/oauth2/default/v1/token",
        "OKTA_CLIENT_ID": "helpdesk-client-id",
        "OKTA_CLIENT_SECRET": "helpdesk-secret",
        "ALLOWED_ROLES": "helpdesk",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 2. Analyst User Setup

```json
{
  "mcpServers": {
    "okta-analyst": {
      "command": "npx",
      "args": ["@mcp/okta"],
      "env": {
        "OKTA_DOMAIN": "company.okta.com",
        "OKTA_OAUTH_TOKEN_URL": "https://company.okta.com/oauth2/default/v1/token",
        "OKTA_CLIENT_ID": "analyst-client-id",
        "OKTA_CLIENT_SECRET": "analyst-secret",
        "ALLOWED_ROLES": "analyst",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 3. Development Setup

```json
{
  "mcpServers": {
    "okta-dev": {
      "command": "npx",
      "args": ["@mcp/okta"],
      "env": {
        "OKTA_DOMAIN": "dev-123456.okta.com",
        "OKTA_OAUTH_TOKEN_URL": "https://dev-123456.okta.com/oauth2/default/v1/token",
        "OKTA_CLIENT_ID": "dev-client-id",
        "OKTA_CLIENT_SECRET": "dev-secret",
        "ALLOWED_ROLES": "analyst,helpdesk,admin",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

## Next Steps for Publication

1. **Complete the registry submission process**
2. **Set up automated testing and CI/CD**
3. **Create user documentation and examples**
4. **Establish support channels**
5. **Plan for version updates and maintenance**

For more information about the MCP registry process, refer to the official MCP documentation and registry guidelines.
