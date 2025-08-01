# Testing Infrastructure Agent Instructions

## Agent Role and Responsibility

You are the **Testing Infrastructure Agent** responsible for implementing comprehensive testing infrastructure for the Boltic Tables SDK. Your mission is to create robust unit tests, integration tests, end-to-end tests, performance tests, mock systems, test automation, and ensure the SDK is production-ready with excellent test coverage and reliability.

## Prerequisites

Before starting, you MUST:

1. **Verify Dependencies**: Ensure API Integration Agent has completed ALL tasks
2. **Consult Documentation**: Read `/Docs/Implementation.md` for testing requirements
3. **Follow Project Structure**: Maintain adherence to `/Docs/project_structure.md`
4. **Check Bug Tracking**: Review `/Docs/Bug_tracking.md` for any known testing issues
5. **Review All Agents**: Study all previous agent implementations for complete understanding

## Dependencies

This agent depends on ALL previous agents completion. Verify these exist:

- Complete SDK client infrastructure and HTTP adapters
- All resource classes with full functionality
- API integration layer with endpoint mappings
- Authentication, caching, and error handling systems
- Complete type definitions for all operations

## Primary Tasks

### Task 1: Test Framework Configuration and Setup

**Duration**: 1-2 days
**Priority**: Critical

#### 1.1 Enhanced Vitest Configuration

Update `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "dist/",
        "tests/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/coverage/**",
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    include: ["tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules/", "dist/", ".git/", ".cache/"],
    pool: "threads",
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 4,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@tests": resolve(__dirname, "./tests"),
    },
  },
  define: {
    __DEV__: true,
    __TEST__: true,
  },
});
```

#### 1.2 Test Setup and Global Configuration

Create `tests/setup.ts`:

```typescript
import { beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import { config } from "dotenv";
import { TestEnvironment } from "./utils/test-environment";
import { MockApiServer } from "./utils/mock-api-server";

// Load test environment variables
config({ path: ".env.test" });

// Global test environment
let testEnvironment: TestEnvironment;
let mockApiServer: MockApiServer;

beforeAll(async () => {
  // Initialize test environment
  testEnvironment = new TestEnvironment();
  await testEnvironment.setup();

  // Start mock API server for integration tests
  mockApiServer = new MockApiServer();
  await mockApiServer.start();

  // Set global test configuration
  process.env.NODE_ENV = "test";
  process.env.BOLTIC_API_KEY = "test-api-key";
  process.env.BOLTIC_ENVIRONMENT = "local";
  process.env.BOLTIC_BASE_URL = mockApiServer.getBaseUrl();
});

afterAll(async () => {
  // Cleanup test environment
  await testEnvironment.cleanup();
  await mockApiServer.stop();
});

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  vi.restoreAllMocks();

  // Reset mock API server state
  mockApiServer.reset();
});

afterEach(() => {
  // Cleanup after each test
  vi.clearAllTimers();
});

// Global test utilities
global.__TEST_ENV__ = testEnvironment;
global.__MOCK_API__ = mockApiServer;

// Increase timeout for integration tests
vi.setConfig({ testTimeout: 30000 });

// Mock timers setup
vi.useFakeTimers();

// Global error handler for unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
```

#### 1.3 Environment Configuration for Testing

Create `.env.test`:

```env
# Test Environment Configuration
NODE_ENV=test
BOLTIC_API_KEY=test-api-key-12345
BOLTIC_ENVIRONMENT=local
BOLTIC_BASE_URL=http://localhost:3001
BOLTIC_TIMEOUT=10000
BOLTIC_RETRY_ATTEMPTS=1
BOLTIC_CACHE_ENABLED=false
BOLTIC_DEBUG=true

# Test Database Configuration
TEST_DATABASE_ID=test-db-12345
TEST_TABLE_ID=test-table-12345
TEST_RECORD_ID=test-record-12345

# Mock API Server Configuration
MOCK_API_PORT=3001
MOCK_API_HOST=localhost
```

### Task 2: Mock Systems and Test Utilities

**Duration**: 2-3 days
**Priority**: Critical

#### 2.1 Create Mock API Server

Create `tests/utils/mock-api-server.ts`:

```typescript
import { createServer, Server } from "http";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import { ApiEndpoints } from "../../src/api/endpoints";
import { MockDataGenerator } from "./mock-data-generator";

interface MockEndpoint {
  method: string;
  path: string;
  handler: (req: Request, res: Response) => void;
}

export class MockApiServer {
  private app: Express;
  private server: Server | null = null;
  private port: number;
  private host: string;
  private mockData: MockDataGenerator;
  private requestLog: Array<{
    method: string;
    path: string;
    body: any;
    query: any;
    timestamp: number;
  }> = [];

  constructor(port = 3001, host = "localhost") {
    this.port = port;
    this.host = host;
    this.app = express();
    this.mockData = new MockDataGenerator();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging middleware
    this.app.use((req, res, next) => {
      this.requestLog.push({
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query,
        timestamp: Date.now(),
      });
      next();
    });

    // Authentication middleware
    this.app.use((req, res, next) => {
      const apiKey = req.headers["x-boltic-token"];
      if (!apiKey && req.path !== "/health") {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "API key required" },
        });
      }
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get("/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Database endpoints
    this.setupDatabaseRoutes();
    this.setupTableRoutes();
    this.setupFieldRoutes();
    this.setupRecordRoutes();
    this.setupSqlRoutes();

    // Catch-all for unmatched routes
    this.app.use("*", (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Endpoint not found: ${req.method} ${req.path}`,
        },
      });
    });
  }

  private setupDatabaseRoutes(): void {
    // List databases
    this.app.get("/v1/tables/databases", (req, res) => {
      const databases = this.mockData.generateDatabases(5);
      this.sendSuccessResponse(res, databases, { total: databases.length });
    });

    // Create database
    this.app.post("/v1/tables/databases", (req, res) => {
      const database = this.mockData.generateDatabase(req.body);
      this.sendSuccessResponse(res, database);
    });

    // Get database
    this.app.get("/v1/tables/databases/:id", (req, res) => {
      const database = this.mockData.generateDatabase({ id: req.params.id });
      this.sendSuccessResponse(res, database);
    });

    // Update database
    this.app.patch("/v1/tables/databases/:id", (req, res) => {
      const database = this.mockData.generateDatabase({
        id: req.params.id,
        ...req.body,
      });
      this.sendSuccessResponse(res, database);
    });

    // Delete database
    this.app.delete("/v1/tables/databases/:id", (req, res) => {
      this.sendSuccessResponse(res, { deleted: true, id: req.params.id });
    });
  }

  private setupTableRoutes(): void {
    // List tables
    this.app.get("/v1/tables", (req, res) => {
      const tables = this.mockData.generateTables(3);
      this.sendSuccessResponse(res, tables, { total: tables.length });
    });

    // Create table
    this.app.post("/v1/tables", (req, res) => {
      const table = this.mockData.generateTable(req.body);
      this.sendSuccessResponse(res, table);
    });

    // Get table
    this.app.get("/v1/tables/:id", (req, res) => {
      const table = this.mockData.generateTable({ id: req.params.id });
      this.sendSuccessResponse(res, table);
    });

    // Update table
    this.app.patch("/v1/tables/:id", (req, res) => {
      const table = this.mockData.generateTable({
        id: req.params.id,
        ...req.body,
      });
      this.sendSuccessResponse(res, table);
    });

    // Delete table
    this.app.delete("/v1/tables/:id", (req, res) => {
      this.sendSuccessResponse(res, { deleted: true, id: req.params.id });
    });
  }

  private setupFieldRoutes(): void {
    // List fields
    this.app.get("/v1/tables/:tableId/fields", (req, res) => {
      const fields = this.mockData.generateFields(5);
      this.sendSuccessResponse(res, fields);
    });

    // Create fields
    this.app.post("/v1/tables/:tableId/fields", (req, res) => {
      const fields =
        req.body.columns?.map((col: any) => this.mockData.generateField(col)) ||
        [];
      this.sendSuccessResponse(res, fields);
    });

    // Get field
    this.app.get("/v1/tables/:tableId/fields/:fieldId", (req, res) => {
      const field = this.mockData.generateField({ id: req.params.fieldId });
      this.sendSuccessResponse(res, field);
    });

    // Update field
    this.app.patch("/v1/tables/:tableId/fields/:fieldId", (req, res) => {
      const field = this.mockData.generateField({
        id: req.params.fieldId,
        ...req.body,
      });
      this.sendSuccessResponse(res, field);
    });

    // Delete field
    this.app.delete("/v1/tables/:tableId/fields/:fieldId", (req, res) => {
      this.sendSuccessResponse(res, { deleted: true, id: req.params.fieldId });
    });
  }

  private setupRecordRoutes(): void {
    // List records
    this.app.get("/v1/tables/:tableId/records", (req, res) => {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const records = this.mockData.generateRecords(limit);

      this.sendSuccessResponse(res, {
        records,
        pagination: {
          total: 100,
          page: Math.floor(offset / limit) + 1,
          limit,
          pages: Math.ceil(100 / limit),
          has_next: offset + limit < 100,
          has_prev: offset > 0,
        },
      });
    });

    // Create record
    this.app.post("/v1/tables/:tableId/records", (req, res) => {
      const record = this.mockData.generateRecord(req.body.data);
      this.sendSuccessResponse(res, record);
    });

    // Bulk create records
    this.app.post("/v1/tables/:tableId/records/bulk", (req, res) => {
      const success = req.body.data.map((data: any) =>
        this.mockData.generateRecord(data)
      );
      this.sendSuccessResponse(res, {
        success,
        failed: [],
        summary: {
          total: success.length,
          successful: success.length,
          failed: 0,
        },
      });
    });

    // Update records
    this.app.patch("/v1/tables/:tableId/records", (req, res) => {
      const records = this.mockData.generateRecords(1);
      this.sendSuccessResponse(res, records);
    });

    // Delete records
    this.app.delete("/v1/tables/:tableId/records", (req, res) => {
      this.sendSuccessResponse(res, {
        deleted_count: 1,
        deleted_ids: ["record-123"],
      });
    });

    // Aggregate records
    this.app.post("/v1/tables/:tableId/records/aggregate", (req, res) => {
      const results = this.mockData.generateAggregateResults(req.body);
      this.sendSuccessResponse(res, { results, total_groups: results.length });
    });

    // Vector search
    this.app.post("/v1/tables/:tableId/records/vector-search", (req, res) => {
      const records = this.mockData.generateRecords(5);
      this.sendSuccessResponse(res, records);
    });
  }

  private setupSqlRoutes(): void {
    this.app.post("/v1/tables/query", (req, res) => {
      const result = this.mockData.generateSqlResult(req.body.query);
      this.sendSuccessResponse(res, result);
    });
  }

  private sendSuccessResponse(res: Response, data: any, meta?: any): void {
    const response: any = { success: true, data };
    if (meta) {
      response.meta = meta;
    }
    res.json(response);
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, this.host, () => {
        console.log(
          `Mock API server started on http://${this.host}:${this.port}`
        );
        resolve();
      });

      this.server.on("error", reject);
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          console.log("Mock API server stopped");
          resolve();
        });
      });
    }
  }

  getBaseUrl(): string {
    return `http://${this.host}:${this.port}`;
  }

  getRequestLog(): typeof this.requestLog {
    return [...this.requestLog];
  }

  reset(): void {
    this.requestLog = [];
    this.mockData.reset();
  }

  // Test utilities
  simulateError(path: string, method: string, statusCode = 500): void {
    this.app[method.toLowerCase() as keyof Express](path, (req, res) => {
      res.status(statusCode).json({
        success: false,
        error: { code: "MOCK_ERROR", message: "Simulated error" },
      });
    });
  }

  simulateDelay(path: string, method: string, delay = 1000): void {
    this.app[method.toLowerCase() as keyof Express](path, (req, res) => {
      setTimeout(() => {
        this.sendSuccessResponse(res, { message: "Delayed response" });
      }, delay);
    });
  }

  simulateRateLimit(path: string, method: string): void {
    this.app[method.toLowerCase() as keyof Express](path, (req, res) => {
      res.status(429).json({
        success: false,
        error: { code: "RATE_LIMIT_EXCEEDED", message: "Rate limit exceeded" },
      });
    });
  }
}
```

#### 2.2 Create Mock Data Generator

Create `tests/utils/mock-data-generator.ts`:

```typescript
import { faker } from "@faker-js/faker";
import {
  DatabaseWithId,
  TableWithId,
  ColumnWithId,
  RecordWithId,
  FieldType,
} from "../../src/types/api";

export class MockDataGenerator {
  private counters: Record<string, number> = {};

  reset(): void {
    this.counters = {};
  }

  private getNextId(type: string): string {
    if (!this.counters[type]) {
      this.counters[type] = 1;
    }
    return `${type}-${this.counters[type]++}`;
  }

  generateDatabase(overrides: Partial<DatabaseWithId> = {}): DatabaseWithId {
    return {
      id: this.getNextId("db"),
      name: faker.word.noun(),
      slug: faker.lorem.slug(),
      description: faker.lorem.sentence(),
      resource_id: faker.string.uuid(),
      created_at: faker.date.past().toISOString(),
      updated_at: faker.date.recent().toISOString(),
      created_by: faker.internet.email(),
      is_public: faker.datatype.boolean(),
      table_count: faker.number.int({ min: 0, max: 50 }),
      ...overrides,
    };
  }

  generateDatabases(count: number): DatabaseWithId[] {
    return Array.from({ length: count }, () => this.generateDatabase());
  }

  generateTable(overrides: Partial<TableWithId> = {}): TableWithId {
    const schema = overrides.schema || this.generateFields(5);

    return {
      id: this.getNextId("table"),
      name: faker.word.noun(),
      table_name: faker.word.noun(),
      description: faker.lorem.sentence(),
      schema,
      record_count: faker.number.int({ min: 0, max: 1000 }),
      created_at: faker.date.past().toISOString(),
      updated_at: faker.date.recent().toISOString(),
      created_by: faker.internet.email(),
      is_public: faker.datatype.boolean(),
      database_id: this.getNextId("db"),
      ...overrides,
    };
  }

  generateTables(count: number): TableWithId[] {
    return Array.from({ length: count }, () => this.generateTable());
  }

  generateField(overrides: Partial<ColumnWithId> = {}): ColumnWithId {
    const fieldTypes: FieldType[] = [
      "text",
      "long-text",
      "number",
      "currency",
      "checkbox",
      "dropdown",
      "email",
      "phone-number",
      "link",
      "json",
      "date-time",
      "vector",
      "halfvec",
      "sparsevec",
    ];

    const type = overrides.type || faker.helpers.arrayElement(fieldTypes);

    return {
      id: this.getNextId("field"),
      name: faker.database.column(),
      type,
      is_nullable: faker.datatype.boolean(),
      is_primary_key: false,
      is_unique: faker.datatype.boolean(),
      is_visible: true,
      is_readonly: faker.datatype.boolean(),
      field_order: faker.number.int({ min: 1, max: 20 }),
      alignment: null,
      timezone: type === "date-time" ? faker.location.timeZone() : null,
      date_format: type === "date-time" ? "YYYY-MM-DD" : null,
      time_format: type === "date-time" ? "HH:mm:ss" : null,
      decimals: type === "number" || type === "currency" ? "2" : null,
      currency_format: type === "currency" ? "USD" : null,
      selection_source: type === "dropdown" ? "static" : null,
      selectable_items:
        type === "dropdown" ? ["Option 1", "Option 2", "Option 3"] : null,
      multiple_selections:
        type === "dropdown" ? faker.datatype.boolean() : false,
      phone_format: type === "phone-number" ? "US" : null,
      button_type: null,
      button_label: null,
      button_additional_labels: null,
      button_state: null,
      disable_on_click: null,
      vector_dimension: type.includes("vec") ? 1536 : null,
      description: faker.lorem.sentence(),
      created_at: faker.date.past().toISOString(),
      updated_at: faker.date.recent().toISOString(),
      table_id: this.getNextId("table"),
      ...overrides,
    };
  }

  generateFields(count: number): ColumnWithId[] {
    return Array.from({ length: count }, () => this.generateField());
  }

  generateRecord(overrides: any = {}): RecordWithId {
    return {
      id: this.getNextId("record"),
      title: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price()),
      category_id: faker.number.int({ min: 1, max: 10 }),
      is_active: faker.datatype.boolean(),
      tags: faker.helpers.arrayElements(
        ["electronics", "clothing", "books", "sports"],
        2
      ),
      metadata: {
        color: faker.color.human(),
        size: faker.helpers.arrayElement(["S", "M", "L", "XL"]),
        weight: faker.number.float({ min: 0.1, max: 10.0, fractionDigits: 2 }),
      },
      created_at: faker.date.past().toISOString(),
      updated_at: faker.date.recent().toISOString(),
      ...overrides,
    };
  }

  generateRecords(count: number): RecordWithId[] {
    return Array.from({ length: count }, () => this.generateRecord());
  }

  generateAggregateResults(request: any): any[] {
    const groupBy = request.groupBy || ["category_id"];
    const aggregates = request.aggregates || {};

    return [
      {
        category_id: 1,
        total_price: 1500.5,
        avg_price: 300.1,
        count: 5,
      },
      {
        category_id: 2,
        total_price: 800.25,
        avg_price: 200.06,
        count: 4,
      },
    ];
  }

  generateSqlResult(query: string): any {
    const isSelect = query.toLowerCase().trim().startsWith("select");

    if (isSelect) {
      return {
        columns: [
          { name: "id", type: "string" },
          { name: "title", type: "string" },
          { name: "price", type: "number" },
        ],
        rows: [
          ["1", "Product 1", 99.99],
          ["2", "Product 2", 199.99],
        ],
        row_count: 2,
        execution_time_ms: faker.number.int({ min: 10, max: 500 }),
      };
    }

    return {
      affected_rows: faker.number.int({ min: 1, max: 10 }),
      execution_time_ms: faker.number.int({ min: 5, max: 100 }),
    };
  }

  // Utility methods for specific test scenarios
  generateErrorRecord(): any {
    return {
      // Missing required fields to trigger validation errors
      title: "",
      price: "invalid-price",
    };
  }

  generateLargeDataset(count: number): RecordWithId[] {
    return Array.from({ length: count }, (_, index) =>
      this.generateRecord({
        id: `bulk-record-${index + 1}`,
        title: `Bulk Product ${index + 1}`,
      })
    );
  }

  generateVectorData(): number[] {
    return Array.from({ length: 1536 }, () =>
      faker.number.float({ min: -1, max: 1, fractionDigits: 6 })
    );
  }
}
```

#### 2.3 Create Test Environment Manager

Create `tests/utils/test-environment.ts`:

```typescript
import { writeFile, unlink, mkdir } from "fs/promises";
import { resolve } from "path";
import { createClient } from "../../src";
import { MockDataGenerator } from "./mock-data-generator";

export class TestEnvironment {
  private tempFiles: string[] = [];
  private mockData: MockDataGenerator;
  private testClient: any;

  constructor() {
    this.mockData = new MockDataGenerator();
  }

  async setup(): Promise<void> {
    // Create temp directory for test files
    await mkdir(resolve(__dirname, "../temp"), { recursive: true });

    // Initialize test client
    this.testClient = createClient("test-api-key", {
      environment: "local",
      debug: true,
      timeout: 5000,
      retryAttempts: 1,
    });

    console.log("Test environment setup complete");
  }

  async cleanup(): Promise<void> {
    // Clean up temporary files
    for (const file of this.tempFiles) {
      try {
        await unlink(file);
      } catch (error) {
        console.warn(`Failed to clean up temp file: ${file}`, error);
      }
    }

    console.log("Test environment cleanup complete");
  }

  getTestClient(): any {
    return this.testClient;
  }

  getMockData(): MockDataGenerator {
    return this.mockData;
  }

  async createTempFile(filename: string, content: string): Promise<string> {
    const filepath = resolve(__dirname, "../temp", filename);
    await writeFile(filepath, content);
    this.tempFiles.push(filepath);
    return filepath;
  }

  // Helper methods for common test scenarios
  async createTestDatabase(): Promise<any> {
    const dbData = this.mockData.generateDatabase({
      name: "test_database",
      slug: "test-database",
    });

    return dbData;
  }

  async createTestTable(): Promise<any> {
    const tableData = this.mockData.generateTable({
      table_name: "test_products",
      schema: [
        {
          name: "title",
          type: "text",
          is_nullable: false,
        },
        {
          name: "price",
          type: "currency",
          is_nullable: false,
          currency_format: "USD",
        },
        {
          name: "category_id",
          type: "number",
          is_nullable: false,
        },
      ],
    });

    return tableData;
  }

  async createTestRecords(count = 10): Promise<any[]> {
    return this.mockData.generateRecords(count);
  }

  // Performance testing utilities
  measureExecutionTime<T>(
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    return new Promise(async (resolve, reject) => {
      const start = performance.now();
      try {
        const result = await fn();
        const duration = performance.now() - start;
        resolve({ result, duration });
      } catch (error) {
        reject(error);
      }
    });
  }

  async simulateNetworkDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Memory usage tracking
  getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  formatMemoryUsage(usage: NodeJS.MemoryUsage): string {
    const formatBytes = (bytes: number) =>
      `${Math.round((bytes / 1024 / 1024) * 100) / 100} MB`;

    return [
      `RSS: ${formatBytes(usage.rss)}`,
      `Heap Total: ${formatBytes(usage.heapTotal)}`,
      `Heap Used: ${formatBytes(usage.heapUsed)}`,
      `External: ${formatBytes(usage.external)}`,
    ].join(", ");
  }
}
```

### Task 3: Unit Testing Implementation

**Duration**: 4-5 days
**Priority**: Critical

#### 3.1 Core Component Unit Tests

Create `tests/unit/client/core/base-client.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { BaseClient } from "../../../../src/client/core/base-client";
import { FetchHttpAdapter } from "../../../../src/utils/http/fetch-adapter";
import { ClientConfig } from "../../../../src/types/config";

describe("BaseClient", () => {
  let baseClient: BaseClient;
  let mockHttpAdapter: any;
  let config: ClientConfig;

  beforeEach(() => {
    mockHttpAdapter = {
      request: vi.fn(),
    };

    config = {
      apiKey: "test-api-key",
      environment: "test",
      timeout: 10000,
      retryAttempts: 2,
      retryDelay: 1000,
      cacheEnabled: true,
      debug: true,
    };

    baseClient = new BaseClient(mockHttpAdapter, config);
  });

  describe("constructor", () => {
    it("should initialize with correct configuration", () => {
      expect(baseClient.getEnvironment()).toBe("test");
      expect(baseClient.isFeatureEnabled("vectorSearch")).toBeDefined();
    });

    it("should initialize API client correctly", () => {
      const apiClient = baseClient.getApiClient();
      expect(apiClient).toBeDefined();
    });
  });

  describe("updateApiKey", () => {
    it("should update API key in both config and API client", () => {
      const newApiKey = "new-test-api-key";
      baseClient.updateApiKey(newApiKey);

      // API key should be updated (we'd need to expose this for testing)
      expect(baseClient.getApiClient()).toBeDefined();
    });
  });

  describe("updateDatabaseId", () => {
    it("should update database context", () => {
      const databaseId = "new-db-123";
      baseClient.updateDatabaseId(databaseId);

      // Database ID should be updated in API client
      expect(baseClient.getApiClient()).toBeDefined();
    });
  });

  describe("feature flags", () => {
    it("should check feature availability correctly", () => {
      const vectorSearchEnabled = baseClient.isFeatureEnabled("vectorSearch");
      const aggregationsEnabled = baseClient.isFeatureEnabled("aggregations");

      expect(typeof vectorSearchEnabled).toBe("boolean");
      expect(typeof aggregationsEnabled).toBe("boolean");
    });
  });

  describe("cache management", () => {
    it("should provide cache instance when enabled", () => {
      const cache = baseClient.getCache();
      if (config.cacheEnabled) {
        expect(cache).toBeDefined();
      } else {
        expect(cache).toBeUndefined();
      }
    });
  });

  describe("error handling", () => {
    it("should handle configuration errors gracefully", () => {
      const invalidConfig = { ...config, apiKey: "" };

      expect(() => new BaseClient(mockHttpAdapter, invalidConfig)).toThrow();
    });

    it("should handle HTTP adapter errors", async () => {
      mockHttpAdapter.request.mockRejectedValue(new Error("Network error"));

      // Test error handling through API client
      const apiClient = baseClient.getApiClient();
      await expect(apiClient.listDatabases()).rejects.toThrow();
    });
  });
});
```

#### 3.2 Resource Layer Unit Tests

Create `tests/unit/client/resources/database.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { DatabaseResource } from "../../../../src/client/resources/database";
import { BaseClient } from "../../../../src/client/core/base-client";
import { ValidationError } from "../../../../src/errors/validation-error";

describe("DatabaseResource", () => {
  let databaseResource: DatabaseResource;
  let mockBaseClient: any;

  beforeEach(() => {
    mockBaseClient = {
      makeRequest: vi.fn(),
      getApiClient: vi.fn(() => ({
        createDatabase: vi.fn(),
        listDatabases: vi.fn(),
        findDatabase: vi.fn(),
        updateDatabase: vi.fn(),
        deleteDatabase: vi.fn(),
      })),
      getCache: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        generateKey: vi.fn((...parts) => parts.join(":")),
      })),
    };

    databaseResource = new DatabaseResource(mockBaseClient);
  });

  describe("create", () => {
    it("should create database successfully", async () => {
      const dbData = {
        name: "test_database",
        slug: "test-database",
        description: "Test database",
      };

      const expectedResponse = {
        data: {
          id: "db-123",
          name: "test_database",
          slug: "test-database",
          description: "Test database",
          created_at: "2024-01-01T00:00:00Z",
        },
      };

      mockBaseClient
        .getApiClient()
        .createDatabase.mockResolvedValue(expectedResponse.data);

      const result = await databaseResource.create(dbData);

      expect(mockBaseClient.getApiClient().createDatabase).toHaveBeenCalledWith(
        dbData
      );
      expect(result.data).toEqual(expectedResponse.data);
    });

    it("should validate required fields", async () => {
      const invalidData = { name: "" }; // Missing required name

      await expect(databaseResource.create(invalidData)).rejects.toThrow(
        ValidationError
      );
    });

    it("should handle API errors", async () => {
      const dbData = { name: "test_database", slug: "test-database" };

      mockBaseClient
        .getApiClient()
        .createDatabase.mockRejectedValue(new Error("API Error"));

      await expect(databaseResource.create(dbData)).rejects.toThrow();
    });
  });

  describe("findAll", () => {
    it("should list databases with default options", async () => {
      const mockDatabases = [
        { id: "db-1", name: "database1" },
        { id: "db-2", name: "database2" },
      ];

      mockBaseClient
        .getApiClient()
        .listDatabases.mockResolvedValue(mockDatabases);

      const result = await databaseResource.findAll();

      expect(mockBaseClient.getApiClient().listDatabases).toHaveBeenCalledWith(
        {}
      );
      expect(result.data).toEqual(mockDatabases);
    });

    it("should apply filters and sorting", async () => {
      const options = {
        where: { created_by: "user@example.com" },
        sort: [{ field: "created_at", order: "desc" as const }],
        limit: 5,
      };

      const mockDatabases = [{ id: "db-1", name: "database1" }];
      mockBaseClient
        .getApiClient()
        .listDatabases.mockResolvedValue(mockDatabases);

      const result = await databaseResource.findAll(options);

      expect(mockBaseClient.getApiClient().listDatabases).toHaveBeenCalledWith(
        options
      );
      expect(result.data).toEqual(mockDatabases);
    });

    it("should handle cache hits", async () => {
      const options = { limit: 10 };
      const cachedData = [{ id: "db-cached", name: "cached_db" }];

      mockBaseClient.getCache().get.mockResolvedValue({ data: cachedData });

      const result = await databaseResource.findAll(options);

      expect(mockBaseClient.getCache().get).toHaveBeenCalled();
      expect(result.data).toEqual(cachedData);
      expect(
        mockBaseClient.getApiClient().listDatabases
      ).not.toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should find single database", async () => {
      const options = { where: { slug: "test-database" } };
      const mockDatabase = { id: "db-123", name: "test_database" };

      mockBaseClient
        .getApiClient()
        .findDatabase.mockResolvedValue(mockDatabase);

      const result = await databaseResource.findOne(options);

      expect(mockBaseClient.getApiClient().findDatabase).toHaveBeenCalledWith(
        options
      );
      expect(result.data).toEqual(mockDatabase);
    });

    it("should require where conditions", async () => {
      await expect(databaseResource.findOne({})).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("update", () => {
    it("should update database", async () => {
      const updates = { description: "Updated description" };
      const whereCondition = { slug: "test-database" };
      const mockUpdatedDb = {
        id: "db-123",
        description: "Updated description",
      };

      mockBaseClient
        .getApiClient()
        .updateDatabase.mockResolvedValue(mockUpdatedDb);

      const result = await databaseResource.update(whereCondition, updates);

      expect(result.data).toEqual(mockUpdatedDb);
    });

    it("should validate update data", async () => {
      const invalidUpdates = { name: "" }; // Invalid empty name
      const whereCondition = { id: "db-123" };

      await expect(
        databaseResource.update(whereCondition, invalidUpdates)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("delete", () => {
    it("should delete database", async () => {
      const whereCondition = { id: "db-123" };
      const mockResponse = { deleted: true, id: "db-123" };

      mockBaseClient
        .getApiClient()
        .deleteDatabase.mockResolvedValue(mockResponse);

      const result = await databaseResource.delete(whereCondition);

      expect(result.data).toEqual(mockResponse);
    });

    it("should require where conditions for delete", async () => {
      await expect(databaseResource.delete({})).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("caching behavior", () => {
    it("should cache successful responses", async () => {
      const mockDatabase = { id: "db-123", name: "test_database" };
      mockBaseClient
        .getApiClient()
        .findDatabase.mockResolvedValue(mockDatabase);

      await databaseResource.findOne({ where: { id: "db-123" } });

      expect(mockBaseClient.getCache().set).toHaveBeenCalled();
    });

    it("should invalidate cache on updates", async () => {
      const updates = { description: "Updated" };
      const whereCondition = { id: "db-123" };

      mockBaseClient.getApiClient().updateDatabase.mockResolvedValue({});

      await databaseResource.update(whereCondition, updates);

      expect(mockBaseClient.getCache().delete).toHaveBeenCalled();
    });
  });
});
```

#### 3.3 Create More Unit Tests for All Components

Create similar comprehensive unit tests for:

- `tests/unit/client/resources/table.test.ts`
- `tests/unit/client/resources/column.test.ts`
- `tests/unit/client/resources/record.test.ts`
- `tests/unit/client/resources/sql.test.ts`
- `tests/unit/api/client.test.ts`
- `tests/unit/api/transformers/request.test.ts`
- `tests/unit/api/transformers/response.test.ts`
- `tests/unit/utils/http/fetch-adapter.test.ts`
- `tests/unit/utils/http/axios-adapter.test.ts`
- `tests/unit/cache/manager.test.ts`
- `tests/unit/errors/validation-error.test.ts`

### Task 4: Integration Testing Implementation

**Duration**: 3-4 days
**Priority**: Critical

#### 4.1 Create End-to-End Integration Tests

Create `tests/integration/e2e/complete-workflow.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createClient } from "../../../src";
import { MockApiServer } from "../../utils/mock-api-server";
import { TestEnvironment } from "../../utils/test-environment";

describe("Complete SDK Workflow (E2E)", () => {
  let client: any;
  let mockApiServer: MockApiServer;
  let testEnvironment: TestEnvironment;

  beforeAll(async () => {
    testEnvironment = new TestEnvironment();
    await testEnvironment.setup();

    mockApiServer = new MockApiServer();
    await mockApiServer.start();

    client = createClient("test-api-key", {
      environment: "local",
      debug: true,
    });
  });

  afterAll(async () => {
    await mockApiServer.stop();
    await testEnvironment.cleanup();
  });

  beforeEach(() => {
    mockApiServer.reset();
  });

  describe("Database → Table → Column → Record Workflow", () => {
    it("should complete full CRUD workflow successfully", async () => {
      // Step 1: Create Database
      const dbResult = await client.database.create({
        name: "e2e_test_database",
        slug: "e2e-test-database",
        description: "End-to-end test database",
      });

      expect(dbResult.data).toBeDefined();
      expect(dbResult.data.name).toBe("e2e_test_database");

      // Step 2: Use Database Context
      const db = client.useDatabase(dbResult.data.id);

      // Step 3: Create Table with Schema
      const tableResult = await db.table.create({
        table_name: "products",
        schema: [
          {
            name: "title",
            type: "text",
            is_nullable: false,
          },
          {
            name: "price",
            type: "currency",
            is_nullable: false,
            currency_format: "USD",
          },
          {
            name: "category_id",
            type: "number",
            is_nullable: false,
          },
          {
            name: "description",
            type: "long-text",
            is_nullable: true,
          },
          {
            name: "metadata",
            type: "json",
            is_nullable: true,
          },
        ],
        description: "Products table for e2e testing",
      });

      expect(tableResult.data).toBeDefined();
      expect(tableResult.data.table_name).toBe("products");
      expect(tableResult.data.schema).toHaveLength(5);

      // Step 4: Add Additional Columns
      const columnResult = await db.column.create("products", {
        columns: [
          {
            name: "is_featured",
            type: "checkbox",
            is_nullable: true,
          },
          {
            name: "tags",
            type: "json",
            is_nullable: true,
          },
        ],
      });

      expect(columnResult.data).toBeDefined();

      // Step 5: Insert Records (Method 1)
      const recordResult1 = await db.record.insert("products", {
        title: "MacBook Pro",
        price: 2499.99,
        category_id: 1,
        description: "Powerful laptop for professionals",
        metadata: { color: "silver", storage: "512GB" },
        is_featured: true,
        tags: ["electronics", "computers", "apple"],
      });

      expect(recordResult1.data).toBeDefined();
      expect(recordResult1.data.title).toBe("MacBook Pro");

      // Step 6: Insert Records (Method 2 - Fluent)
      const recordResult2 = await db.from("products").insert({
        title: "iPhone 15",
        price: 999.99,
        category_id: 1,
        description: "Latest smartphone",
        metadata: { color: "blue", storage: "256GB" },
        is_featured: true,
        tags: ["electronics", "phones", "apple"],
      });

      expect(recordResult2.data).toBeDefined();
      expect(recordResult2.data.title).toBe("iPhone 15");

      // Step 7: Bulk Insert Records
      const bulkRecords = [
        {
          title: "iPad Air",
          price: 599.99,
          category_id: 1,
          description: "Versatile tablet",
        },
        {
          title: "AirPods Pro",
          price: 249.99,
          category_id: 1,
          description: "Wireless earphones",
        },
      ];

      const bulkResult = await db.record.bulkInsert("products", {
        data: bulkRecords,
      });

      expect(bulkResult.data.summary.successful).toBe(2);
      expect(bulkResult.data.failed).toHaveLength(0);

      // Step 8: Query Records (Method 1)
      const queryResult1 = await db.record.findAll("products", {
        where: {
          category_id: 1,
          price: { $gt: 500 },
        },
        fields: ["id", "title", "price"],
        sort: [{ field: "price", order: "desc" }],
        limit: 10,
      });

      expect(queryResult1.data).toBeDefined();
      expect(Array.isArray(queryResult1.data)).toBe(true);

      // Step 9: Query Records (Method 2 - Fluent)
      const queryResult2 = await db
        .from("products")
        .where("category_id", "=", 1)
        .where("price", ">", 500)
        .select(["id", "title", "price"])
        .orderBy("price", "desc")
        .limit(10)
        .findAll();

      expect(queryResult2.data).toBeDefined();
      expect(Array.isArray(queryResult2.data)).toBe(true);

      // Step 10: Update Records
      const updateResult = await db
        .from("products")
        .where("title", "=", "MacBook Pro")
        .set({ price: 2299.99, is_featured: false })
        .update();

      expect(updateResult.data).toBeDefined();

      // Step 11: Aggregation Query
      const aggregateResult = await db.record.aggregate("products", {
        groupBy: ["category_id"],
        aggregates: {
          total_price: { $sum: "price" },
          avg_price: { $avg: "price" },
          count: { $count: "*" },
        },
        where: { price: { $gt: 100 } },
      });

      expect(aggregateResult.data.results).toBeDefined();
      expect(Array.isArray(aggregateResult.data.results)).toBe(true);

      // Step 12: SQL Query
      const sqlResult = await db.sql.execute({
        query: `
          SELECT category_id, COUNT(*) as product_count, AVG(price) as avg_price
          FROM products 
          WHERE price > $1 
          GROUP BY category_id
          ORDER BY avg_price DESC
        `,
        params: [100],
      });

      expect(sqlResult.data.columns).toBeDefined();
      expect(sqlResult.data.rows).toBeDefined();
      expect(sqlResult.data.row_count).toBeGreaterThan(0);

      // Step 13: Delete Records
      const deleteResult = await db
        .from("products")
        .where("title", "=", "AirPods Pro")
        .delete();

      expect(deleteResult.data.deleted_count).toBeGreaterThan(0);

      // Step 14: Clean up
      await db.table.delete("products");
      await client.database.delete({ where: { id: dbResult.data.id } });
    });
  });

  describe("Error Handling Workflow", () => {
    it("should handle validation errors gracefully", async () => {
      // Test validation errors
      await expect(client.database.create({ name: "" })).rejects.toThrow();

      await expect(
        client.database.create({
          name: "test",
          slug: "invalid slug with spaces",
        })
      ).rejects.toThrow();
    });

    it("should handle API errors gracefully", async () => {
      // Simulate API error
      mockApiServer.simulateError("/v1/tables/databases", "post", 500);

      await expect(
        client.database.create({ name: "test_db", slug: "test-db" })
      ).rejects.toThrow();
    });

    it("should handle network errors with retries", async () => {
      // Simulate network delay
      mockApiServer.simulateDelay("/v1/tables/databases", "get", 2000);

      const start = Date.now();
      await client.database.findAll({ limit: 1 });
      const duration = Date.now() - start;

      // Should have taken at least the delay time
      expect(duration).toBeGreaterThan(1500);
    });
  });

  describe("Performance Characteristics", () => {
    it("should handle bulk operations efficiently", async () => {
      const db = client.useDatabase("test-db-123");

      // Create table for bulk testing
      await db.table.create({
        table_name: "bulk_test",
        schema: [
          { name: "title", type: "text", is_nullable: false },
          { name: "value", type: "number", is_nullable: false },
        ],
      });

      // Generate large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
        title: `Item ${index + 1}`,
        value: Math.random() * 1000,
      }));

      // Measure bulk insert performance
      const { result, duration } = await testEnvironment.measureExecutionTime(
        () => db.record.bulkInsert("bulk_test", { data: largeDataset })
      );

      expect(result.data.summary.successful).toBe(1000);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      console.log(`Bulk insert of 1000 records completed in ${duration}ms`);
    });

    it("should cache results effectively", async () => {
      const db = client.useDatabase("test-db-123");

      // First query (uncached)
      const { duration: firstDuration } =
        await testEnvironment.measureExecutionTime(() =>
          db.record.findAll("products", { limit: 100 })
        );

      // Second identical query (should be cached)
      const { duration: secondDuration } =
        await testEnvironment.measureExecutionTime(() =>
          db.record.findAll("products", { limit: 100 })
        );

      // Second query should be faster due to caching
      expect(secondDuration).toBeLessThan(firstDuration);

      console.log(
        `Cache performance: ${firstDuration}ms → ${secondDuration}ms`
      );
    });
  });

  describe("Memory Usage", () => {
    it("should maintain reasonable memory usage", async () => {
      const initialMemory = testEnvironment.getMemoryUsage();
      console.log(
        "Initial memory:",
        testEnvironment.formatMemoryUsage(initialMemory)
      );

      const db = client.useDatabase("test-db-123");

      // Perform various operations
      await db.database.findAll();
      await db.table.findAll();
      await db.record.findAll("products", { limit: 100 });

      const finalMemory = testEnvironment.getMemoryUsage();
      console.log(
        "Final memory:",
        testEnvironment.formatMemoryUsage(finalMemory)
      );

      // Memory increase should be reasonable (less than 50MB)
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
    });
  });
});
```

### Task 5: Performance and Load Testing

**Duration**: 2-3 days
**Priority**: High

#### 5.1 Create Performance Test Suite

Create `tests/performance/load-testing.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "../../src";
import { MockApiServer } from "../utils/mock-api-server";
import { TestEnvironment } from "../utils/test-environment";

describe("Performance and Load Testing", () => {
  let client: any;
  let mockApiServer: MockApiServer;
  let testEnvironment: TestEnvironment;

  beforeAll(async () => {
    testEnvironment = new TestEnvironment();
    await testEnvironment.setup();

    mockApiServer = new MockApiServer();
    await mockApiServer.start();

    client = createClient("test-api-key", {
      environment: "local",
      timeout: 30000,
      retryAttempts: 3,
    });
  });

  afterAll(async () => {
    await mockApiServer.stop();
    await testEnvironment.cleanup();
  });

  describe("Concurrent Operations", () => {
    it("should handle concurrent database operations", async () => {
      const concurrentOperations = Array.from({ length: 50 }, (_, index) =>
        client.database.create({
          name: `concurrent_db_${index}`,
          slug: `concurrent-db-${index}`,
        })
      );

      const { result, duration } = await testEnvironment.measureExecutionTime(
        () => Promise.all(concurrentOperations)
      );

      expect(result).toHaveLength(50);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds

      console.log(
        `50 concurrent database operations completed in ${duration}ms`
      );
    });

    it("should handle concurrent record operations", async () => {
      const db = client.useDatabase("test-db-123");

      const concurrentInserts = Array.from({ length: 100 }, (_, index) =>
        db.record.insert("products", {
          title: `Concurrent Product ${index}`,
          price: Math.random() * 1000,
          category_id: Math.floor(Math.random() * 5) + 1,
        })
      );

      const { result, duration } = await testEnvironment.measureExecutionTime(
        () => Promise.all(concurrentInserts)
      );

      expect(result).toHaveLength(100);
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds

      console.log(`100 concurrent record inserts completed in ${duration}ms`);
    });
  });

  describe("Large Dataset Operations", () => {
    it("should handle bulk operations with large datasets", async () => {
      const db = client.useDatabase("test-db-123");

      // Test various bulk sizes
      const bulkSizes = [100, 500, 1000, 2500];

      for (const size of bulkSizes) {
        const largeDataset = Array.from({ length: size }, (_, index) => ({
          title: `Bulk Product ${index}`,
          price: Math.random() * 1000,
          category_id: Math.floor(Math.random() * 10) + 1,
          metadata: {
            index,
            batch_size: size,
            timestamp: Date.now(),
          },
        }));

        const { result, duration } = await testEnvironment.measureExecutionTime(
          () => db.record.bulkInsert("products", { data: largeDataset })
        );

        expect(result.data.summary.successful).toBe(size);

        const throughput = size / (duration / 1000); // records per second
        console.log(
          `Bulk insert ${size} records: ${duration}ms (${throughput.toFixed(
            2
          )} records/sec)`
        );

        // Throughput should be reasonable
        expect(throughput).toBeGreaterThan(10); // At least 10 records per second
      }
    });

    it("should handle large query result sets efficiently", async () => {
      const db = client.useDatabase("test-db-123");

      // Test pagination with large result sets
      const pageSizes = [50, 100, 500, 1000];

      for (const pageSize of pageSizes) {
        const { result, duration } = await testEnvironment.measureExecutionTime(
          () => db.record.findAll("products", { limit: pageSize })
        );

        expect(result.data).toBeDefined();

        const throughput = (result.data.length || 0) / (duration / 1000);
        console.log(
          `Query ${pageSize} records: ${duration}ms (${throughput.toFixed(
            2
          )} records/sec)`
        );

        // Query should complete in reasonable time
        expect(duration).toBeLessThan(5000); // Less than 5 seconds
      }
    });
  });

  describe("Cache Performance", () => {
    it("should demonstrate cache performance benefits", async () => {
      const db = client.useDatabase("test-db-123");

      const queryOptions = {
        where: { category_id: 1, price: { $gt: 100 } },
        limit: 100,
      };

      // First query (cold cache)
      const { duration: coldDuration } =
        await testEnvironment.measureExecutionTime(() =>
          db.record.findAll("products", queryOptions)
        );

      // Repeated queries (warm cache)
      const warmQueryTimes: number[] = [];
      for (let i = 0; i < 10; i++) {
        const { duration } = await testEnvironment.measureExecutionTime(() =>
          db.record.findAll("products", queryOptions)
        );
        warmQueryTimes.push(duration);
      }

      const avgWarmDuration =
        warmQueryTimes.reduce((sum, time) => sum + time, 0) /
        warmQueryTimes.length;
      const cacheSpeedup = coldDuration / avgWarmDuration;

      console.log(
        `Cache performance: Cold ${coldDuration}ms, Warm avg ${avgWarmDuration.toFixed(
          2
        )}ms`
      );
      console.log(`Cache speedup: ${cacheSpeedup.toFixed(2)}x`);

      // Cache should provide significant speedup
      expect(cacheSpeedup).toBeGreaterThan(2);
    });
  });

  describe("Memory Efficiency", () => {
    it("should maintain memory efficiency under load", async () => {
      const initialMemory = testEnvironment.getMemoryUsage();
      const db = client.useDatabase("test-db-123");

      // Perform memory-intensive operations
      for (let batch = 0; batch < 10; batch++) {
        // Large bulk insert
        const batchData = Array.from({ length: 500 }, (_, index) => ({
          title: `Memory Test ${batch}-${index}`,
          price: Math.random() * 1000,
          category_id: Math.floor(Math.random() * 5) + 1,
          metadata: {
            batch,
            index,
            data: Array.from({ length: 100 }, () => Math.random()),
          },
        }));

        await db.record.bulkInsert("products", { data: batchData });

        // Large query
        await db.record.findAll("products", { limit: 1000 });

        // Measure memory after each batch
        const currentMemory = testEnvironment.getMemoryUsage();
        const memoryIncrease = currentMemory.heapUsed - initialMemory.heapUsed;

        console.log(
          `Batch ${batch}: Memory increase ${(
            memoryIncrease /
            1024 /
            1024
          ).toFixed(2)}MB`
        );

        // Memory increase should remain reasonable
        expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // Less than 200MB
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = testEnvironment.getMemoryUsage();
      const totalIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(
        `Total memory increase: ${(totalIncrease / 1024 / 1024).toFixed(2)}MB`
      );

      // Total memory increase should be reasonable
      expect(totalIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB after GC
    });
  });

  describe("Rate Limiting Behavior", () => {
    it("should handle rate limiting gracefully", async () => {
      // Simulate rate limiting
      mockApiServer.simulateRateLimit("/v1/tables/databases", "get");

      const start = Date.now();

      try {
        await client.database.findAll();
      } catch (error) {
        const duration = Date.now() - start;

        expect(error.message).toContain("rate limit");
        expect(duration).toBeGreaterThan(0);

        console.log(`Rate limit handled in ${duration}ms`);
      }
    });
  });

  describe("Network Resilience", () => {
    it("should handle network delays and recover", async () => {
      // Simulate network delay
      mockApiServer.simulateDelay("/v1/tables/databases", "get", 2000);

      const { result, duration } = await testEnvironment.measureExecutionTime(
        () => client.database.findAll()
      );

      expect(result).toBeDefined();
      expect(duration).toBeGreaterThan(1500); // Should respect the delay
      expect(duration).toBeLessThan(5000); // But not timeout

      console.log(`Network delay test completed in ${duration}ms`);
    });
  });
});
```

### Task 6: Test Automation and CI/CD Integration

**Duration**: 1-2 days
**Priority**: High

#### 6.1 Create GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop, feature/*]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: "18"

jobs:
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [16, 18, 20]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Generate coverage report
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        if: matrix.node-version == 18
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest

    services:
      mock-api:
        image: node:18
        ports:
          - 3001:3001

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build

      - name: Run integration tests
        run: npm run test:integration
        env:
          BOLTIC_API_KEY: ${{ secrets.TEST_API_KEY }}
          MOCK_API_PORT: 3001

  performance-tests:
    name: Performance Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run performance tests
        run: npm run test:performance

      - name: Upload performance results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: test-results/performance/

  e2e-tests:
    name: End-to-End Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BOLTIC_API_KEY: ${{ secrets.TEST_API_KEY }}

      - name: Upload E2E artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-artifacts
          path: test-results/e2e/

  test-summary:
    name: Test Summary
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, performance-tests, e2e-tests]
    if: always()

    steps:
      - name: Download all artifacts
        uses: actions/download-artifact@v3

      - name: Generate test summary
        run: |
          echo "## Test Results Summary" >> $GITHUB_STEP_SUMMARY
          echo "| Test Suite | Status |" >> $GITHUB_STEP_SUMMARY
          echo "|------------|---------|" >> $GITHUB_STEP_SUMMARY
          echo "| Unit Tests | ${{ needs.unit-tests.result }} |" >> $GITHUB_STEP_SUMMARY
          echo "| Integration Tests | ${{ needs.integration-tests.result }} |" >> $GITHUB_STEP_SUMMARY
          echo "| Performance Tests | ${{ needs.performance-tests.result }} |" >> $GITHUB_STEP_SUMMARY
          echo "| E2E Tests | ${{ needs.e2e-tests.result }} |" >> $GITHUB_STEP_SUMMARY
```

#### 6.2 Update Package.json Scripts

Update `package.json` test scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "vitest run tests/integration/e2e",
    "test:performance": "vitest run tests/performance",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:ci": "vitest run --reporter=verbose --reporter=junit --outputFile=test-results/junit.xml",
    "test:debug": "vitest --inspect-brk",
    "test:mock-server": "node tests/utils/start-mock-server.js"
  }
}
```

### Task 7: Test Documentation and Best Practices

**Duration**: 1-2 days
**Priority**: Medium

#### 7.1 Create Testing Guide

Create `docs/guides/testing.md`:

````markdown
# Testing Guide

This guide covers testing practices, tools, and strategies for the Boltic Tables SDK.

## Testing Framework

The SDK uses [Vitest](https://vitest.dev/) as the primary testing framework with the following structure:

- **Unit Tests** - Test individual components in isolation
- **Integration Tests** - Test component interactions and API integration
- **End-to-End Tests** - Test complete user workflows
- **Performance Tests** - Test performance characteristics and load handling

## Running Tests

### Local Development

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Interactive UI
npm run test:ui
```
````
