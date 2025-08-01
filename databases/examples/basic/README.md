# Stage 2 Core Infrastructure Demo

This directory contains demonstrations of the **Stage 2: Core API Implementation** that has been completed for the Boltic Tables SDK.

## 🎯 What Stage 2 Accomplished

### ✅ **Core Infrastructure Completed**

- **HTTP Client Infrastructure** - Fetch/Axios adapters with automatic environment detection
- **Authentication System** - API key management and validation
- **Request/Response Interceptors** - Extensible middleware system
- **Base HTTP Client** - Unified HTTP methods with error handling
- **Base Resource Classes** - Foundation for CRUD operations
- **Main BolticClient** - Environment-aware configuration management
- **Enhanced Type System** - Complete TypeScript definitions
- **Testing Infrastructure** - Test utilities and mock helpers

## 🚀 How to Run the Demo

### Option 1: Using NPM Scripts (Recommended)

```bash
# From the databases directory
cd examples
npm install           # Install tsx if needed
npm run demo:stage2   # Run the TypeScript demo
```

### Option 2: Direct TypeScript Execution

```bash
# From the databases directory
npm install -g tsx    # If not already installed globally

# Run the TypeScript demo
cd examples/basic
tsx stage2-demo.ts
```

### Option 3: Built Version Test

```bash
# From the databases directory
npm run build         # Build the project first

# Quick test with built version
node -e "
const { createClient } = require('./dist/cjs/index.js');
const client = createClient('test-api-key-123', { environment: 'local', debug: true });
console.log('✅ Client created:', client.isAuthenticated());
console.log('✅ Config:', JSON.stringify(client.getConfig(), null, 2));
"
```

## 📋 Demo Features

The demo showcases these Stage 2 capabilities:

### 1. **Client Initialization**

- Multiple environment configurations (prod, local, sit, uat)
- Custom configuration options
- Environment-specific base URLs and timeouts

### 2. **Authentication System**

- API key validation
- Authentication status checking
- Dynamic API key updates

### 3. **Configuration Management**

- Runtime configuration updates
- Environment-aware settings
- Debug mode and timeout management

### 4. **HTTP Client & Interceptors**

- Request interceptors for custom headers
- Response interceptors for logging
- Error interceptors for centralized error handling
- Dynamic interceptor management (add/remove)

### 5. **Error Handling**

- Structured error responses
- Network error detection
- Error context preservation
- Graceful error handling

### 6. **Type System**

- Complete TypeScript definitions
- Generic type support
- Interface consistency
- Type safety across all components

### 7. **Testing Infrastructure**

- Test client creation
- Mock response helpers
- Testing utilities

## 🔧 Core Components Available

```typescript
import {
  createClient, // Main client factory
  BolticClient, // Core client class
  BaseClient, // HTTP client
  AuthManager, // Authentication
  ConfigManager, // Configuration
} from '@boltic/database-js';

// Testing utilities
import {
  createTestClient, // Test client factory
  createMockResponse, // Mock helpers
} from '@boltic/database-js/testing';

// Type definitions
import type {
  ClientOptions, // Client configuration
  Environment, // Environment types
  QueryOptions, // Query parameters
  ApiResponse, // API response format
} from '@boltic/database-js';
```

## 📊 Expected Demo Output

When you run the demo, you'll see:

```
🚀 Boltic SDK Stage 2 Core Infrastructure Demo

📝 1. Client Initialization with Environment Configuration
============================================================
✅ Production client config: { "apiKey": "...", "environment": "prod", ... }
✅ Local client config: { "apiKey": "...", "environment": "local", ... }

🔐 2. Authentication System
============================================================
✅ Production client authenticated: true
✅ Local client authenticated: true
✅ API key validation result: true

🔧 3. Configuration Management
============================================================
✅ Updated production config: { "timeout": 15000, "debug": false, ... }
✅ API key updated successfully

🌐 4. HTTP Client & Interceptors
============================================================
✅ Added request interceptor ID: 0
✅ Added response interceptor ID: 1

🌍 5. HTTP Client Demonstration
============================================================
🔄 Testing HTTP GET request...
📤 Request interceptor: GET http://localhost:8000/v1/tables/databases
✅ Error handling working correctly: Network request failed
✅ Error context available: ["name", "originalError"]

📊 6. Type System & Base Resource
============================================================
✅ TypeScript definitions available
✅ Core types: HttpResponse, ApiResponse, QueryOptions
✅ Auth types: AuthConfig, AuthHeaders
✅ Config types: ClientConfig, Environment

🧪 7. Testing Infrastructure
============================================================
✅ Test client created: true
✅ Mock response: { "data": { "id": 1, "name": "Test Database" } }

🔄 8. Interceptor Management
============================================================
✅ Interceptors removed successfully

🎉 Stage 2 Core Infrastructure Demo Complete!
============================================================
✅ All core infrastructure components working correctly
✅ Ready for Stage 3: Resource Operations Implementation
```

## 🔍 Code Examples

### Basic Client Usage

```typescript
import { createClient } from '@boltic/database-js';

// Initialize client
const boltic = createClient('your-api-key', {
  environment: 'prod',
  debug: false,
  timeout: 10000,
});

// Check authentication
console.log('Authenticated:', boltic.isAuthenticated());

// Update configuration
boltic.updateConfig({ timeout: 15000 });

// Add custom interceptor
boltic.addRequestInterceptor((config) => {
  config.headers['X-Custom-Header'] = 'my-value';
  return config;
});
```

### Environment Configurations

```typescript
// Different environments have different base URLs and settings
const environments = {
  local: 'http://localhost:8000',
  sit: 'https://asia-south1.api.fcz0.de/service/panel/boltic-tables',
  uat: 'https://asia-south1.api.uat.fcz0.de/service/panel/boltic-tables',
  prod: 'https://asia-south1.api.boltic.io/service/panel/boltic-tables',
};
```

### Testing Setup

```typescript
import {
  createTestClient,
  createMockResponse,
} from '@boltic/database-js/testing';

// Create test client
const testClient = createTestClient({
  apiKey: 'test-api-key-123', // Must be >= 10 characters for validation
  environment: 'local',
  debug: true,
});

// Create mock responses
const mockDatabase = createMockResponse({
  id: 'db-123',
  name: 'Test Database',
});
```

## 🚦 What's Next

Stage 2 provides the **complete foundation** for:

- **Stage 3**: Database, Table, Column, and Record operations
- **Stage 4**: Advanced querying and SQL interface
- **Stage 5**: Caching, performance optimization, and developer experience features

The core infrastructure is **production-ready** and provides:

- ✅ Robust HTTP communication
- ✅ Authentication management
- ✅ Error handling
- ✅ Type safety
- ✅ Testing utilities
- ✅ Extensible architecture

**Ready for resource-specific operations!** 🎯
