#!/usr/bin/env node

/**
 * Simple test script for the Okta MCP Server
 * This script tests basic connectivity and tool availability
 */

import { spawn } from "child_process";
import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🧪 Okta MCP Server Test Script");
console.log("================================\n");

// Test configuration
const testConfig = {
  serverCommand: "npm start",
  timeout: 10000, // 10 seconds
  testQueries: [
    {
      name: "List available tools",
      method: "tools/list",
      params: {},
    },
    {
      name: "Get server info",
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        clientInfo: {
          name: "test-client",
          version: "1.0.0",
        },
      },
    },
  ],
};

function runTest() {
  console.log("🚀 Starting MCP server...");

  const server = spawn("npm", ["start"], {
    stdio: ["pipe", "pipe", "pipe"],
    shell: true,
  });

  let serverOutput = "";
  let serverError = "";

  server.stdout.on("data", (data) => {
    const output = data.toString();
    serverOutput += output;
    console.log("📤 Server output:", output.trim());
  });

  server.stderr.on("data", (data) => {
    const error = data.toString();
    serverError += error;
    console.log("❌ Server error:", error.trim());
  });

  server.on("error", (error) => {
    console.error("💥 Failed to start server:", error.message);
    process.exit(1);
  });

  // Wait for server to start
  setTimeout(() => {
    console.log("\n✅ Server appears to be running");
    console.log("\n📋 Available test commands:");
    console.log("1. Test basic connectivity");
    console.log("2. Test tool listing");
    console.log("3. Test user search (requires Okta config)");
    console.log("4. Exit");

    rl.question("\nSelect test (1-4): ", (answer) => {
      switch (answer.trim()) {
        case "1":
          testBasicConnectivity(server);
          break;
        case "2":
          testToolListing(server);
          break;
        case "3":
          testUserSearch(server);
          break;
        case "4":
          cleanup(server);
          break;
        default:
          console.log("❌ Invalid selection");
          cleanup(server);
      }
    });
  }, 2000);
}

function testBasicConnectivity(server) {
  console.log("\n🔍 Testing basic connectivity...");

  const initMessage = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
      },
      clientInfo: {
        name: "test-client",
        version: "1.0.0",
      },
    },
  };

  sendMessage(server, initMessage, (response) => {
    if (response.result) {
      console.log("✅ Server initialized successfully");
      console.log("📊 Server info:", response.result);
    } else {
      console.log("❌ Server initialization failed:", response.error);
    }
    cleanup(server);
  });
}

function testToolListing(server) {
  console.log("\n🔧 Testing tool listing...");

  const toolsMessage = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {},
  };

  sendMessage(server, toolsMessage, (response) => {
    if (response.result && response.result.tools) {
      console.log("✅ Tools listed successfully");
      console.log("📋 Available tools:");
      response.result.tools.forEach((tool, index) => {
        console.log(`  ${index + 1}. ${tool.name} - ${tool.description}`);
      });
    } else {
      console.log("❌ Tool listing failed:", response.error);
    }
    cleanup(server);
  });
}

function testUserSearch(server) {
  console.log("\n👤 Testing user search...");
  console.log("⚠️  This requires valid Okta configuration");

  const searchMessage = {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "search_users",
      arguments: {
        query: 'status eq "ACTIVE"',
        limit: 5,
      },
    },
  };

  sendMessage(server, searchMessage, (response) => {
    if (response.result) {
      console.log("✅ User search successful");
      console.log("📊 Results:", response.result);
    } else {
      console.log("❌ User search failed:", response.error);
      console.log("💡 This is expected if Okta is not configured");
    }
    cleanup(server);
  });
}

function sendMessage(server, message, callback) {
  const messageStr = JSON.stringify(message) + "\n";
  server.stdin.write(messageStr);

  // Simple response handling
  const timeout = setTimeout(() => {
    console.log("⏰ Request timed out");
    callback({ error: "Timeout" });
  }, 5000);

  const originalWrite = server.stdout.write;
  server.stdout.write = function (data) {
    originalWrite.call(this, data);

    try {
      const response = JSON.parse(data.toString().trim());
      clearTimeout(timeout);
      callback(response);
    } catch (e) {
      // Ignore non-JSON output
    }
  };
}

function cleanup(server) {
  console.log("\n🧹 Cleaning up...");
  server.kill("SIGTERM");
  rl.close();
  process.exit(0);
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n👋 Test interrupted");
  process.exit(0);
});

// Start the test
runTest();
