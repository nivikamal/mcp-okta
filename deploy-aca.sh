#!/usr/bin/env bash
set -euo pipefail

# Configuration
RG=${RG:-"rg-mcp-okta"}
LOC=${LOC:-"eastus"}
ENV=${ENV:-"acaenv-mcp-okta"}
APP=${APP:-"okta-mcp"}
IMAGE=${IMAGE:-"ghcr.io/you/mcp-okta:latest"}
KV=${KV:-"kv-mcp-okta"}

echo "Deploying Okta MCP Server to Azure Container Apps..."
echo "Resource Group: $RG"
echo "Location: $LOC"
echo "Container App: $APP"
echo "Image: $IMAGE"

# Create resource group
echo "Creating resource group..."
az group create -n $RG -l $LOC --output none

# Create Key Vault
echo "Creating Key Vault..."
az keyvault create -n $KV -g $RG -l $LOC --sku standard --output none

# Set Key Vault access policies (for demo - in production use managed identity)
echo "Setting Key Vault access policies..."
az keyvault update -n $KV --enabled-for-deployment true --enabled-for-template-deployment true --output none

# Add secrets to Key Vault (you'll need to set these manually)
echo "Please add your Okta secrets to Key Vault:"
echo "az keyvault secret set --vault-name $KV --name OKTA-CLIENT-ID --value \"your-client-id\""
echo "az keyvault secret set --vault-name $KV --name OKTA-CLIENT-SECRET --value \"your-client-secret\""
echo "az keyvault secret set --vault-name $KV --name OKTA-DOMAIN --value \"dev-123456.okta.com\""
echo "az keyvault secret set --vault-name $KV --name OKTA-OAUTH-TOKEN-URL --value \"https://dev-123456.okta.com/oauth2/default/v1/token\""

# Create Container Apps environment
echo "Creating Container Apps environment..."
az containerapp env create -n $ENV -g $RG -l $LOC --output none

# Create Container App
echo "Creating Container App..."
FQDN=$(az containerapp create -n $APP -g $RG --environment $ENV \
  --image $IMAGE \
  --ingress external --target-port 8080 \
  --env-vars \
    LOG_LEVEL=info \
  --secrets \
    okta-client-id=secretref:OKTA-CLIENT-ID \
    okta-client-secret=secretref:OKTA-CLIENT-SECRET \
    okta-domain=secretref:OKTA-DOMAIN \
    okta-oauth-token-url=secretref:OKTA-OAUTH-TOKEN-URL \
  --registry-identity system \
  --query properties.configuration.ingress.fqdn -o tsv)

echo "Deployment complete!"
echo "Container App URL: https://$FQDN"
echo ""
echo "To connect from your MCP client:"
echo "1. For stdio transport: Use the container app as a sidecar"
echo "2. For HTTP transport: Point to https://$FQDN"
echo ""
echo "Next steps:"
echo "1. Add your Okta secrets to Key Vault"
echo "2. Test the connection"
echo "3. Configure your MCP client to use this server"
