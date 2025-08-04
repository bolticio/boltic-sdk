# Boltic Tables SDK Demonstrations

This directory contains comprehensive demonstrations of the Boltic Tables SDK, including both the **Stage 2: Core API Infrastructure** and the **Stage 3: Table Operations Implementation**.

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

## 🎯 What Stage 3 Accomplished

### ✅ **Table Operations Implementation Completed**

- **Complete Field Type Support** - All 13 field types: text, long-text, number, currency, checkbox, dropdown, email, phone-number, link, json, date-time, vector, halfvec, sparsevec
- **Dual API Design** - Both Method 1 (Direct API) and Method 2 (Fluent Interface) fully implemented
- **Schema Validation System** - Comprehensive validation with 20+ field-specific rules
- **Schema Helper Utilities** - 14+ helper methods for easy field creation
- **Error Handling** - Custom ValidationError and ApiError classes
- **Database Context Management** - Automatic database context handling with defaults
- **Comprehensive Testing** - 40+ test cases covering all scenarios
- **Schema Validation** - Comprehensive field validation with error reporting
- **Performance Optimization** - Efficient query building and validation
- **Complete Documentation** - Comprehensive guides with examples and best practices

## 🚀 How to Run the Demos

### Option 1: Using NPM Scripts (Recommended)

```bash
# From the databases directory
cd examples
npm install           # Install tsx if needed

# Run Stage 2 Core Infrastructure Demo
npm run demo:stage2

# Run Comprehensive Table Operations Demo (NEW!)
npm run demo:table-ops

# Run demos with auto-restart on changes
npm run demo:stage2:watch     # Stage 2 with watch mode
npm run demo:table-ops:watch  # Table operations with watch mode
```

### Option 2: Direct TypeScript Execution

```bash
# From the databases directory
npm install -g tsx    # If not already installed globally

# Run the demos directly
cd examples/basic

# Stage 2 Core Infrastructure Demo
tsx stage2-demo.ts

# Comprehensive Table Operations Demo
tsx table-operations-demo.ts
```

### Option 3: Built Version Test

```bash
# From the databases directory
npm run build         # Build the project first

# Run Stage 2 demo with built version
npm run demo:stage2:built

# Run Table Operations demo with built version
npm run demo:table-ops:built

# Quick client test with built version
node -e "
const { createClient } = require('./dist/cjs/index.js');
const client = createClient('test-api-key-123', { environment: 'local', debug: true });
console.log('✅ Client created:', client.isAuthenticated());
console.log('✅ Config:', JSON.stringify(client.getConfig(), null, 2));
"
```

## 📋 Demo Features

### 🏗️ Stage 2 Core Infrastructure Demo (`stage2-demo.ts`)

The Stage 2 demo showcases these core infrastructure capabilities:

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

### 🗄️ Table Operations Demo (`table-operations-demo.ts`)

The comprehensive table operations demo showcases the complete Stage 3 implementation with 5 specialized demonstration modules:

#### 1. **Comprehensive Table Operations Demo**

- **All 13 Field Types** - Complete schema with text, long-text, number, currency, checkbox, dropdown, email, phone-number, link, json, date-time, vector, halfvec, sparsevec
- **Dual API Methods** - Demonstrates both Method 1 (Direct API) and Method 2 (Fluent Interface)
- **Complex Operations** - Create, read, update, delete with advanced filtering and sorting
- **Mixed Workflows** - Realistic patterns combining both API methods
- **Database Context** - Automatic database management with fallback to 'Default'

#### 2. **Advanced Schema Validation Demo**

- **Positive Validation** - All field types with valid configurations
- **Negative Testing** - 8 different validation failure scenarios
- **Error Reporting** - Detailed validation error messages with specific field failures
- **Edge Cases** - Dimension limits, format validation, dropdown limits

#### 3. **Performance Testing Demo**

- **Large Schema Validation** - Tests with 50+ fields for performance characteristics
- **Timing Measurements** - Validation performance metrics
- **Stress Testing** - Large-scale operations and bulk processing
- **Optimization Insights** - Performance data for tuning

#### 4. **Error Handling Demo**

- **Comprehensive Error Scenarios** - Tests 5 different error conditions
- **ValidationError Handling** - Proper error catching and reporting
- **Edge Case Testing** - Invalid names, reserved words, size limits
- **Graceful Degradation** - Robust error recovery patterns

#### Key Demo Features:

- ✅ **Both API Methods Tested** - Complete coverage of direct and fluent interfaces
- ✅ **All Field Types Validated** - Every field type with specific validation rules
- ✅ **Real-world Scenarios** - E-commerce, analytics, and user management examples
- ✅ **Error Handling** - Comprehensive error scenarios and recovery
- ✅ **Performance Metrics** - Timing and optimization insights
- ✅ **Migration Tools** - Schema evolution and comparison utilities

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

## 📊 Expected Table Operations Demo Output

When you run `npm run demo:table-ops`, you'll see comprehensive output covering all aspects:

```
🚀 Starting Comprehensive Table Operations Demo Suite
==================================================

=== Comprehensive Table Operations Demo ===

1. Creating comprehensive schema with all field types...
✓ Database context set

2. Creating table using Method 1 (Direct API)...
✓ Table created successfully: comprehensive_products
  - ID: table-123
  - Created at: 2024-01-01T00:00:00Z

3. Testing Method 2 (Fluent Interface) - Query Operations...
✓ Found 1 tables using fluent interface
  - Total: 1, Page: 1

4. Testing Method 1 (Direct API) - Metadata and Updates...
✓ Table metadata retrieved: { id: "table-123", name: "comprehensive_products", ... }

5. Testing Method 2 (Fluent Interface) - Access Control...
✓ Table access updated using fluent interface (set to shared)

6. Testing Method 1 (Direct API) - Rename Operation...
✓ Table renamed using direct API: comprehensive_products → advanced_product_catalog

7. Creating additional tables for comprehensive testing...
✓ User table created using fluent interface
✓ Analytics table created using direct API

8. Testing comprehensive listing and filtering...
✓ Method 1 - Found 3 total tables
✓ Method 2 - Found 2 public tables
✓ Method 2 - Found 3 most recent tables

9. Testing various update operations...
✓ Method 2 - Updated user table properties
✓ Method 1 - Updated analytics table access

10. Final comprehensive table listing...
✓ Final table inventory:
  1. advanced_product_catalog
     - Description: Comprehensive product catalog with all field types
     - Public: true
     - Created: 2024-01-01T00:00:00Z

11. Cleaning up created tables...
✓ Method 1 - Deleted advanced_product_catalog
✓ Method 2 - Deleted user_profiles
✓ Method 1 - Deleted analytics_events

🎉 Comprehensive demo completed successfully!

=== Advanced Schema Validation Demo ===

1. Testing all field types with valid configurations...
✓ Comprehensive valid schema check: true

2. Testing various validation failures...
  1. Testing: Duplicate field names
     ❌ Valid: false
     📋 Errors: 1
        - Duplicate field name at index 1: name

  2. Testing: Vector without dimension
     ❌ Valid: false
     📋 Errors: 1
        - Vector field at index 0 requires positive vector_dimension

=== Schema Migration Demo ===

📊 Schema Migration Analysis:
✅ Added fields (3):
   + vendor_email (email)
   + search_embedding (vector)
   + created_at (date-time)

❌ Removed fields (1):
   - contact_email (email)

🔄 Modified fields (2):
   ~ price:
     Type: number → currency
     Nullable: true → false

=== Performance Testing Demo ===

📏 Created schema with 50 fields
⏱️ Validation time: 15ms
✅ Validation result: true
📋 Errors found: 0

=== Error Handling Demo ===

🧪 Testing error scenarios:
  1. Empty schema:
     ✅ Caught ValidationError as expected
     📋 Failures: 1
        - schema: Table schema is required and must contain at least one field

🎉 All demos completed successfully!
✅ Method 1 (Direct API) tested thoroughly
✅ Method 2 (Fluent Interface) tested thoroughly
✅ All field types validated
✅ Error handling verified
✅ Performance characteristics measured
✅ Schema migration patterns demonstrated
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

### Table Operations Examples

#### Basic Table Creation with Schema Helpers

```typescript
import { BolticClient } from '@boltic/database-js';
import { SchemaHelpers } from '@boltic/database-js/utils';

const client = new BolticClient('your-api-key');

// Set database context
client.useDatabase('my-database-id', 'Production Database');

// Create comprehensive schema using helpers
const productSchema = [
  SchemaHelpers.textField('title', { is_unique: true, is_nullable: false }),
  SchemaHelpers.longTextField('description'),
  SchemaHelpers.currencyField('price', 'USD', { is_nullable: false }),
  SchemaHelpers.checkboxField('is_featured', { default_value: false }),
  SchemaHelpers.dropdownField('category', ['electronics', 'clothing', 'books']),
  SchemaHelpers.emailField('vendor_email'),
  SchemaHelpers.phoneNumberField('vendor_phone', 'international'),
  SchemaHelpers.linkField('product_url'),
  SchemaHelpers.vectorField('search_embedding', 1536, { is_visible: false }),
  SchemaHelpers.halfVectorField('compact_embedding', 512),
  SchemaHelpers.sparseVectorField('feature_vector', 2048),
  SchemaHelpers.jsonField('specifications'),
  SchemaHelpers.dateTimeField('created_at', { is_nullable: false }),
];

// Method 1: Direct API
const { data: table, error } = await client.tables.create({
  table_name: 'products',
  schema: productSchema,
  description: 'E-commerce product catalog',
  is_public: false,
});
```

#### Dual API Methods - Direct vs Fluent

```typescript
// Method 1: Direct API approach
const { data: tables } = await client.tables.findAll({
  where: { is_public: true },
  sort: [{ field: 'created_at', order: 'desc' }],
  limit: 20,
});

// Method 2: Fluent Interface approach (same result)
const { data: tables2 } = await client
  .table()
  .where({ is_public: true })
  .sort([{ field: 'created_at', order: 'desc' }])
  .limit(20)
  .findAll();

// Mixed approach: Create with Method 1, Update with Method 2
await client.tables.create({ table_name: 'users', schema: userSchema });

await client
  .table()
  .where({ name: 'users' })
  .set({ is_shared: true, name: 'user_profiles' })
  .update();
```

#### Advanced Operations

```typescript
// Complex filtering and sorting
const { data: recentTables } = await client
  .table()
  .where({
    is_public: false,
    created_at: {
      $gte: '2024-01-01T00:00:00Z',
      $lte: '2024-12-31T23:59:59Z',
    },
  })
  .sort([
    { field: 'created_at', order: 'desc' },
    { field: 'name', order: 'asc' },
  ])
  .limit(50)
  .offset(0)
  .findAll();

// Rename table using direct API
await client.tables.rename('old_table_name', 'new_table_name');

// Set access permissions using fluent interface
await client
  .table()
  .where({ name: 'sensitive_data' })
  .set({ is_shared: false })
  .setAccess();

// Get table metadata
const { data: metadata } = await client.tables.getMetadata('products');
console.log('Table info:', {
  id: metadata.id,
  name: metadata.name,
  fields: metadata.schema?.length,
  created_at: metadata.created_at,
});
```

#### Error Handling with Custom Errors

```typescript
import { ValidationError, ApiError } from '@boltic/database-js/errors';

try {
  await client.tables.create({
    table_name: 'invalid_table',
    schema: [
      // Invalid: vector without dimension
      { name: 'embedding', type: 'vector' },
      // Invalid: dropdown without items
      { name: 'category', type: 'dropdown' },
    ],
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Schema validation failed:', error.message);
    error.failures.forEach((failure) => {
      console.log(`- ${failure.field}: ${failure.message}`);
    });
  } else if (error instanceof ApiError) {
    console.log('API error:', error.statusCode, error.message);
  }
}
```

#### Schema Validation and Planning

```typescript
import { SchemaHelpers } from '@boltic/database-js/utils';

// Create and validate schema before using
const productSchema = [
  SchemaHelpers.textField('title', { is_unique: true }),
  SchemaHelpers.currencyField('price', 'USD'),
  SchemaHelpers.vectorField('search_embedding', 1536),
  SchemaHelpers.dropdownField('category', ['electronics', 'books']),
];

// Validate schema before creating table
const validation = SchemaHelpers.validateSchema(productSchema);
if (!validation.isValid) {
  console.log('Schema errors:', validation.errors);
  validation.errors.forEach((error) => {
    console.log(`- ${error}`);
  });
} else {
  console.log('✅ Schema is valid');

  // Create table with validated schema
  await client.tables.create({
    table_name: 'products',
    schema: productSchema,
    description: 'Product catalog',
  });
}
```

## 🚦 What's Next

**Stage 2 & Stage 3 Complete!** The SDK now provides the **complete foundation** with table operations:

### ✅ **Completed (Stages 2 & 3)**

- **Core Infrastructure** - HTTP communication, authentication, error handling, type safety
- **Table Operations** - Complete CRUD with dual API design (Direct + Fluent)
- **Schema Management** - All 13 field types with comprehensive validation
- **Testing Infrastructure** - Test utilities, mock helpers, comprehensive test suites
- **Documentation** - Complete guides, examples, and best practices

### 🔮 **Upcoming Stages**

- **Stage 4**: Advanced querying, SQL interface, complex joins and aggregations
- **Stage 5**: Performance optimization, caching, developer experience enhancements
- **Stage 6**: Real-time subscriptions, webhooks, and event streaming

The SDK is **production-ready** for table operations and provides:

- ✅ **13 Field Types** - Complete support for all data types including vectors
- ✅ **Dual API Design** - Both direct and fluent interfaces for flexibility
- ✅ **Schema Validation** - 20+ validation rules with detailed error reporting
- ✅ **Database Context** - Automatic database management with fallbacks
- ✅ **Error Handling** - Custom ValidationError and ApiError classes
- ✅ **Type Safety** - Complete TypeScript definitions throughout
- ✅ **Testing Ready** - Comprehensive test utilities and examples
- ✅ **Schema Validation** - Comprehensive field validation with detailed error reporting

**Ready for advanced querying and optimization!** 🚀
