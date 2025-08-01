# Core Infrastructure Agent Instructions

## Agent Role and Responsibility

You are the **Core Infrastructure Agent** responsible for building the foundational infrastructure that all other SDK components will depend on. Your mission is to create a robust, secure, and extensible core that handles authentication, HTTP communication, configuration management, caching, and provides base classes for all resource operations.

## Prerequisites

Before starting, you MUST:

1. **Verify Foundation**: Ensure Project Foundation Agent has completed ALL tasks
2. **Consult Documentation**: Read `/Docs/Implementation.md` for Stage 1-2 requirements
3. **Follow Project Structure**: Maintain adherence to `/Docs/project_structure.md`
4. **Check Bug Tracking**: Review `/Docs/Bug_tracking.md` for any known infrastructure issues

## Dependencies

This agent depends on the **Project Foundation Agent** completion. Verify these exist:

- Complete project structure
- Working build system (vite, typescript)
- Package.json with all dependencies
- Basic error classes

## Primary Tasks

### Task 1: HTTP Client Infrastructure

**Duration**: 2-3 days
**Priority**: Critical

#### 1.1 Create HTTP Adapter Interface

Create `src/utils/http/adapter.ts`:

```typescript
export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface HttpRequestConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  signal?: AbortSignal;
}

export interface HttpAdapter {
  request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>>;
}
```

#### 1.2 Create Fetch Adapter

Create `src/utils/http/fetch-adapter.ts`:

```typescript
import { HttpAdapter, HttpRequestConfig, HttpResponse } from "./adapter";

export class FetchAdapter implements HttpAdapter {
  async request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    const url = new URL(config.url);

    // Add query parameters
    if (config.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const init: RequestInit = {
      method: config.method,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      signal: config.signal,
    };

    if (config.data && ["POST", "PUT", "PATCH"].includes(config.method)) {
      init.body = JSON.stringify(config.data);
    }

    try {
      const response = await fetch(url.toString(), init);

      const data = response.headers
        .get("content-type")
        ?.includes("application/json")
        ? await response.json()
        : await response.text();

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers,
      };
    } catch (error) {
      throw new Error(
        `HTTP request failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
```

#### 1.3 Create Axios Adapter (Fallback)

Create `src/utils/http/axios-adapter.ts`:

```typescript
import { HttpAdapter, HttpRequestConfig, HttpResponse } from "./adapter";

export class AxiosAdapter implements HttpAdapter {
  private axios: any;

  constructor() {
    try {
      // Dynamic import for optional axios dependency
      this.axios = require("axios");
    } catch (error) {
      throw new Error(
        "Axios is required for Node.js < 18. Please install axios: npm install axios"
      );
    }
  }

  async request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    try {
      const response = await this.axios({
        url: config.url,
        method: config.method.toLowerCase(),
        headers: config.headers,
        params: config.params,
        data: config.data,
        timeout: config.timeout,
        signal: config.signal,
      });

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error: any) {
      if (error.response) {
        return {
          data: error.response.data,
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
        };
      }
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }
}
```

#### 1.4 Create HTTP Client Factory

Create `src/utils/http/client-factory.ts`:

```typescript
import { HttpAdapter } from "./adapter";
import { FetchAdapter } from "./fetch-adapter";
import { AxiosAdapter } from "./axios-adapter";

export function createHttpAdapter(): HttpAdapter {
  // Check if fetch is available (browser or Node.js >= 18)
  if (typeof fetch !== "undefined") {
    return new FetchAdapter();
  }

  // Fallback to axios for older Node.js versions
  try {
    return new AxiosAdapter();
  } catch (error) {
    throw new Error(
      "No suitable HTTP adapter found. Please use Node.js >= 18 or install axios: npm install axios"
    );
  }
}
```

### Task 2: Authentication System

**Duration**: 1-2 days
**Priority**: Critical

#### 2.1 Create Authentication Types

Create `src/types/config/auth.ts`:

```typescript
export interface AuthConfig {
  apiKey: string;
  tokenRefreshThreshold?: number; // seconds before expiry to refresh
  maxRetries?: number;
}

export interface AuthHeaders {
  "x-boltic-token": string;
  [key: string]: string;
}

export interface TokenInfo {
  token: string;
  expiresAt?: Date;
  isValid: boolean;
}
```

#### 2.2 Create Authentication Manager

Create `src/client/core/auth-manager.ts`:

```typescript
import { AuthConfig, AuthHeaders, TokenInfo } from "../../types/config/auth";
import { BolticError } from "../../errors/base";

export class AuthenticationError extends BolticError {
  readonly code = "AUTHENTICATION_ERROR";
}

export class AuthManager {
  private config: AuthConfig;
  private tokenInfo: TokenInfo | null = null;

  constructor(config: AuthConfig) {
    this.config = config;
    this.validateApiKey(config.apiKey);
  }

  private validateApiKey(apiKey: string): void {
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
      throw new AuthenticationError(
        "API key is required and must be a non-empty string"
      );
    }

    // Basic format validation (adjust based on actual key format)
    if (apiKey.length < 10) {
      throw new AuthenticationError(
        "API key appears to be invalid (too short)"
      );
    }
  }

  getAuthHeaders(): AuthHeaders {
    return {
      "x-boltic-token": this.config.apiKey,
    };
  }

  updateApiKey(newApiKey: string): void {
    this.validateApiKey(newApiKey);
    this.config.apiKey = newApiKey;
    this.tokenInfo = null; // Reset token info
  }

  isAuthenticated(): boolean {
    return !!this.config.apiKey;
  }

  async validateApiKey(): Promise<boolean> {
    // TODO: Implement actual API key validation endpoint call
    // For now, return basic validation
    try {
      this.validateApiKey(this.config.apiKey);
      return true;
    } catch {
      return false;
    }
  }

  getTokenInfo(): TokenInfo | null {
    return this.tokenInfo ? { ...this.tokenInfo } : null;
  }
}
```

### Task 3: Request/Response Interceptor System

**Duration**: 1-2 days
**Priority**: High

#### 3.1 Create Interceptor Types

Create `src/client/core/interceptors.ts`:

```typescript
import { HttpRequestConfig, HttpResponse } from "../../utils/http/adapter";

export type RequestInterceptor = (
  config: HttpRequestConfig
) => HttpRequestConfig | Promise<HttpRequestConfig>;
export type ResponseInterceptor = (
  response: HttpResponse
) => HttpResponse | Promise<HttpResponse>;
export type ErrorInterceptor = (error: any) => any | Promise<any>;

export interface InterceptorManager {
  request: {
    use(interceptor: RequestInterceptor): number;
    eject(id: number): void;
  };
  response: {
    use(
      onFulfilled?: ResponseInterceptor,
      onRejected?: ErrorInterceptor
    ): number;
    eject(id: number): void;
  };
}

export class InterceptorManagerImpl implements InterceptorManager {
  private requestInterceptors: Map<number, RequestInterceptor> = new Map();
  private responseInterceptors: Map<
    number,
    { fulfilled?: ResponseInterceptor; rejected?: ErrorInterceptor }
  > = new Map();
  private nextId = 0;

  request = {
    use: (interceptor: RequestInterceptor): number => {
      const id = this.nextId++;
      this.requestInterceptors.set(id, interceptor);
      return id;
    },
    eject: (id: number): void => {
      this.requestInterceptors.delete(id);
    },
  };

  response = {
    use: (
      onFulfilled?: ResponseInterceptor,
      onRejected?: ErrorInterceptor
    ): number => {
      const id = this.nextId++;
      this.responseInterceptors.set(id, {
        fulfilled: onFulfilled,
        rejected: onRejected,
      });
      return id;
    },
    eject: (id: number): void => {
      this.responseInterceptors.delete(id);
    },
  };

  async executeRequestInterceptors(
    config: HttpRequestConfig
  ): Promise<HttpRequestConfig> {
    let result = config;
    for (const interceptor of this.requestInterceptors.values()) {
      result = await interceptor(result);
    }
    return result;
  }

  async executeResponseInterceptors(
    response: HttpResponse
  ): Promise<HttpResponse> {
    let result = response;
    for (const { fulfilled } of this.responseInterceptors.values()) {
      if (fulfilled) {
        result = await fulfilled(result);
      }
    }
    return result;
  }

  async executeErrorInterceptors(error: any): Promise<any> {
    let result = error;
    for (const { rejected } of this.responseInterceptors.values()) {
      if (rejected) {
        result = await rejected(result);
      }
    }
    return result;
  }
}
```

### Task 4: Base HTTP Client

**Duration**: 2-3 days
**Priority**: Critical

#### 4.1 Create Base Client

Create `src/client/core/base-client.ts`:

```typescript
import {
  HttpAdapter,
  HttpRequestConfig,
  HttpResponse,
} from "../../utils/http/adapter";
import { createHttpAdapter } from "../../utils/http/client-factory";
import { AuthManager } from "./auth-manager";
import { InterceptorManagerImpl } from "./interceptors";
import { ClientConfig } from "./config";
import { ApiError } from "../../errors/api-error";
import { NetworkError } from "../../errors/network-error";

export class BaseClient {
  private httpAdapter: HttpAdapter;
  private authManager: AuthManager;
  private interceptors: InterceptorManagerImpl;
  private config: ClientConfig;

  constructor(config: ClientConfig, authManager: AuthManager) {
    this.config = config;
    this.authManager = authManager;
    this.httpAdapter = createHttpAdapter();
    this.interceptors = new InterceptorManagerImpl();

    this.setupDefaultInterceptors();
  }

  private setupDefaultInterceptors(): void {
    // Default request interceptor - add auth headers
    this.interceptors.request.use((config) => {
      const authHeaders = this.authManager.getAuthHeaders();
      config.headers = {
        ...config.headers,
        ...authHeaders,
        ...this.config.headers,
      };
      return config;
    });

    // Default response interceptor - handle common errors
    this.interceptors.response.use(
      (response) => {
        if (this.config.debug) {
          console.log("HTTP Response:", response);
        }
        return response;
      },
      (error) => {
        return this.handleError(error);
      }
    );
  }

  private handleError(error: any): never {
    if (this.config.debug) {
      console.error("HTTP Error:", error);
    }

    // Network errors
    if (!error.response) {
      throw new NetworkError("Network request failed", {
        originalError: error,
      });
    }

    // API errors
    const { status, data } = error.response;
    throw new ApiError(data?.message || `HTTP ${status} error`, status, data);
  }

  async request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    try {
      // Add base URL if not absolute
      if (!config.url.startsWith("http")) {
        config.url = `${this.config.baseURL}${config.url}`;
      }

      // Set default timeout
      if (!config.timeout) {
        config.timeout = this.config.timeout;
      }

      // Execute request interceptors
      const requestConfig = await this.interceptors.executeRequestInterceptors(
        config
      );

      // Make the request
      const response = await this.httpAdapter.request<T>(requestConfig);

      // Execute response interceptors
      return await this.interceptors.executeResponseInterceptors(response);
    } catch (error) {
      // Execute error interceptors
      throw await this.interceptors.executeErrorInterceptors(error);
    }
  }

  get<T = any>(
    url: string,
    config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: "GET", url });
  }

  post<T = any>(
    url: string,
    data?: any,
    config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: "POST", url, data });
  }

  put<T = any>(
    url: string,
    data?: any,
    config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: "PUT", url, data });
  }

  patch<T = any>(
    url: string,
    data?: any,
    config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: "PATCH", url, data });
  }

  delete<T = any>(
    url: string,
    config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: "DELETE", url });
  }

  getInterceptors(): InterceptorManagerImpl {
    return this.interceptors;
  }

  updateConfig(updates: Partial<ClientConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getConfig(): ClientConfig {
    return { ...this.config };
  }
}
```

### Task 5: Enhanced Error Classes

**Duration**: 1 day
**Priority**: High

#### 5.1 Create API Error Class

Create `src/errors/api-error.ts`:

```typescript
import { BolticError } from "./base";

export class ApiError extends BolticError {
  readonly code = "API_ERROR";

  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly response?: any,
    context?: Record<string, any>
  ) {
    super(message, { statusCode, response, ...context });
  }

  get isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  get isServerError(): boolean {
    return this.statusCode >= 500;
  }

  get isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  get isNotFoundError(): boolean {
    return this.statusCode === 404;
  }

  get isRateLimitError(): boolean {
    return this.statusCode === 429;
  }
}
```

#### 5.2 Create Network Error Class

Create `src/errors/network-error.ts`:

```typescript
import { BolticError } from "./base";

export class NetworkError extends BolticError {
  readonly code = "NETWORK_ERROR";

  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
  }
}
```

#### 5.3 Create Validation Error Class

Create `src/errors/validation-error.ts`:

```typescript
import { BolticError } from "./base";

export interface ValidationFailure {
  field: string;
  message: string;
  value?: any;
}

export class ValidationError extends BolticError {
  readonly code = "VALIDATION_ERROR";

  constructor(
    message: string,
    public readonly failures: ValidationFailure[],
    context?: Record<string, any>
  ) {
    super(message, { failures, ...context });
  }

  getFieldErrors(field: string): ValidationFailure[] {
    return this.failures.filter((f) => f.field === field);
  }

  hasFieldError(field: string): boolean {
    return this.failures.some((f) => f.field === field);
  }
}
```

### Task 6: Resource Base Classes

**Duration**: 2-3 days
**Priority**: Critical

#### 6.1 Create Base Resource Class

Create `src/client/core/base-resource.ts`:

```typescript
import { BaseClient } from "./base-client";
import { HttpResponse } from "../../utils/http/adapter";

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  pagination?: PaginationInfo;
}

export interface QueryOptions {
  fields?: string[];
  sort?: Array<{ field: string; order: "asc" | "desc" }>;
  limit?: number;
  offset?: number;
  where?: Record<string, any>;
}

export abstract class BaseResource {
  protected client: BaseClient;
  protected basePath: string;

  constructor(client: BaseClient, basePath: string) {
    this.client = client;
    this.basePath = basePath;
  }

  protected async makeRequest<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    data?: any,
    options?: { params?: Record<string, any> }
  ): Promise<ApiResponse<T>> {
    const url = `${this.basePath}${path}`;

    try {
      let response: HttpResponse<ApiResponse<T>>;

      switch (method) {
        case "GET":
          response = await this.client.get<ApiResponse<T>>(url, {
            params: options?.params,
          });
          break;
        case "POST":
          response = await this.client.post<ApiResponse<T>>(url, data, {
            params: options?.params,
          });
          break;
        case "PUT":
          response = await this.client.put<ApiResponse<T>>(url, data, {
            params: options?.params,
          });
          break;
        case "PATCH":
          response = await this.client.patch<ApiResponse<T>>(url, data, {
            params: options?.params,
          });
          break;
        case "DELETE":
          response = await this.client.delete<ApiResponse<T>>(url, {
            params: options?.params,
          });
          break;
      }

      return response.data;
    } catch (error) {
      // Re-throw with additional context
      throw error;
    }
  }

  protected buildQueryParams(options: QueryOptions = {}): Record<string, any> {
    const params: Record<string, any> = {};

    if (options.fields?.length) {
      params.fields = options.fields.join(",");
    }

    if (options.sort?.length) {
      params.sort = options.sort.map((s) => `${s.field}:${s.order}`).join(",");
    }

    if (options.limit !== undefined) {
      params.limit = options.limit;
    }

    if (options.offset !== undefined) {
      params.offset = options.offset;
    }

    if (options.where) {
      // Convert where conditions to query parameters
      Object.entries(options.where).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[`where[${key}]`] =
            typeof value === "object" ? JSON.stringify(value) : value;
        }
      });
    }

    return params;
  }
}
```

#### 6.2 Create Resource Operation Interfaces

Create `src/types/common/operations.ts`:

```typescript
export interface CreateOperation<TCreate, TResult> {
  create(data: TCreate): Promise<{ data: TResult; error?: string }>;
}

export interface ReadOperation<TQuery, TResult> {
  findOne(options: TQuery): Promise<{ data: TResult | null; error?: string }>;
  findAll(options?: TQuery): Promise<{
    data: TResult[];
    pagination?: PaginationInfo;
    error?: string;
  }>;
}

export interface UpdateOperation<TUpdate, TResult> {
  update(id: string, data: TUpdate): Promise<{ data: TResult; error?: string }>;
  update(options: { where: Record<string, any>; set: TUpdate }): Promise<{
    data: TResult[];
    error?: string;
  }>;
}

export interface DeleteOperation {
  delete(id: string): Promise<{ success: boolean; error?: string }>;
  delete(options: { where: Record<string, any> }): Promise<{
    deletedCount: number;
    error?: string;
  }>;
}

export interface CrudOperations<TCreate, TUpdate, TResult, TQuery = any>
  extends CreateOperation<TCreate, TResult>,
    ReadOperation<TQuery, TResult>,
    UpdateOperation<TUpdate, TResult>,
    DeleteOperation {}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

### Task 7: Cache Infrastructure

**Duration**: 2-3 days
**Priority**: Medium

#### 7.1 Create Cache Interface

Create `src/cache/cache-interface.ts`:

```typescript
export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  size(): Promise<number>;
}

export interface CacheConfig {
  adapter: CacheAdapter;
  defaultTtl: number; // milliseconds
  maxSize?: number;
  keyPrefix?: string;
}
```

#### 7.2 Create Memory Cache Adapter

Create `src/cache/adapters/memory.ts`:

```typescript
import { CacheAdapter, CacheEntry } from "../cache-interface";

export class MemoryCacheAdapter implements CacheAdapter {
  private store = new Map<string, CacheEntry<any>>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async set<T>(key: string, value: T, ttl = 300000): Promise<void> {
    // Remove oldest entries if at max size
    if (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
    };

    this.store.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  async size(): Promise<number> {
    // Clean expired entries first
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }

    return this.store.size;
  }
}
```

#### 7.3 Create Cache Manager

Create `src/cache/manager.ts`:

```typescript
import { CacheAdapter, CacheConfig } from "./cache-interface";
import { MemoryCacheAdapter } from "./adapters/memory";

export class CacheManager {
  private adapter: CacheAdapter;
  private config: CacheConfig;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      adapter: new MemoryCacheAdapter(),
      defaultTtl: 300000, // 5 minutes
      keyPrefix: "boltic:",
      ...config,
    };
    this.adapter = this.config.adapter;
  }

  private buildKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    return this.adapter.get<T>(this.buildKey(key));
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    return this.adapter.set(
      this.buildKey(key),
      value,
      ttl ?? this.config.defaultTtl
    );
  }

  async delete(key: string): Promise<void> {
    return this.adapter.delete(this.buildKey(key));
  }

  async clear(): Promise<void> {
    return this.adapter.clear();
  }

  async has(key: string): Promise<boolean> {
    return this.adapter.has(this.buildKey(key));
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  generateKey(...parts: (string | number)[]): string {
    return parts.join(":");
  }
}
```

### Task 8: Main Client Implementation

**Duration**: 2-3 days
**Priority**: Critical

#### 8.1 Update Client Configuration

Update `src/client/core/config.ts`:

```typescript
import {
  Environment,
  EnvironmentConfig,
  ENV_CONFIGS,
} from "../../types/config/environment";
import { CacheConfig } from "../../cache/cache-interface";

export interface ClientConfig extends EnvironmentConfig {
  apiKey: string;
  environment: Environment;
  headers?: Record<string, string>;
  cacheEnabled?: boolean;
  cacheConfig?: Partial<CacheConfig>;
  debug?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export class ConfigManager {
  private config: ClientConfig;

  constructor(
    apiKey: string,
    environment: Environment = "prod",
    overrides?: Partial<
      EnvironmentConfig & {
        cacheEnabled?: boolean;
        debug?: boolean;
        retryAttempts?: number;
        retryDelay?: number;
      }
    >
  ) {
    const envConfig = ENV_CONFIGS[environment];
    this.config = {
      apiKey,
      environment,
      cacheEnabled: true,
      debug: environment === "local",
      retryAttempts: 3,
      retryDelay: 1000,
      ...envConfig,
      ...overrides,
    };
  }

  getConfig(): ClientConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ClientConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  updateApiKey(newApiKey: string): void {
    this.config.apiKey = newApiKey;
  }
}
```

#### 8.2 Create Main Client Class

Create `src/client/boltic-client.ts`:

```typescript
import { BaseClient } from "./core/base-client";
import { AuthManager } from "./core/auth-manager";
import { ConfigManager, ClientConfig } from "./core/config";
import { CacheManager } from "../cache/manager";
import { Environment, EnvironmentConfig } from "../types/config/environment";

export interface ClientOptions extends Partial<EnvironmentConfig> {
  environment?: Environment;
  cacheEnabled?: boolean;
  debug?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export class BolticClient {
  private configManager: ConfigManager;
  private authManager: AuthManager;
  private baseClient: BaseClient;
  private cacheManager: CacheManager | null = null;

  constructor(apiKey: string, options: ClientOptions = {}) {
    // Initialize configuration
    this.configManager = new ConfigManager(
      apiKey,
      options.environment,
      options
    );
    const config = this.configManager.getConfig();

    // Initialize authentication
    this.authManager = new AuthManager({
      apiKey: config.apiKey,
      maxRetries: config.retryAttempts,
    });

    // Initialize HTTP client
    this.baseClient = new BaseClient(config, this.authManager);

    // Initialize cache if enabled
    if (config.cacheEnabled) {
      this.cacheManager = new CacheManager(config.cacheConfig);
    }
  }

  // Configuration management
  updateApiKey(newApiKey: string): void {
    this.configManager.updateApiKey(newApiKey);
    this.authManager.updateApiKey(newApiKey);
  }

  updateConfig(updates: Partial<ClientConfig>): void {
    this.configManager.updateConfig(updates);
    this.baseClient.updateConfig(this.configManager.getConfig());
  }

  getConfig(): ClientConfig {
    return this.configManager.getConfig();
  }

  // Authentication management
  async validateApiKey(): Promise<boolean> {
    return this.authManager.validateApiKey();
  }

  isAuthenticated(): boolean {
    return this.authManager.isAuthenticated();
  }

  // HTTP client access
  getHttpClient(): BaseClient {
    return this.baseClient;
  }

  // Cache management
  getCache(): CacheManager | null {
    return this.cacheManager;
  }

  // Interceptor management
  addRequestInterceptor(interceptor: (config: any) => any): number {
    return this.baseClient.getInterceptors().request.use(interceptor);
  }

  addResponseInterceptor(
    onFulfilled?: (response: any) => any,
    onRejected?: (error: any) => any
  ): number {
    return this.baseClient
      .getInterceptors()
      .response.use(onFulfilled, onRejected);
  }

  removeInterceptor(type: "request" | "response", id: number): void {
    this.baseClient.getInterceptors()[type].eject(id);
  }
}
```

#### 8.3 Update Main Client Factory

Update `src/client/index.ts`:

```typescript
import { BolticClient, ClientOptions } from "./boltic-client";
import { Environment } from "../types/config/environment";

export function createClient(
  apiKey: string,
  options: ClientOptions = {}
): BolticClient {
  return new BolticClient(apiKey, options);
}

export { BolticClient, ClientOptions };
export * from "./core/base-client";
export * from "./core/auth-manager";
export * from "./core/config";
export * from "./core/base-resource";
```

### Task 9: Type System Enhancement

**Duration**: 1-2 days
**Priority**: High

#### 9.1 Create Common Types

Update `src/types/index.ts`:

```typescript
// Core exports
export * from "./config/environment";
export * from "./config/auth";
export * from "./common/operations";
export * from "./common/pagination";
export * from "./common/sorting";
export * from "./common/filtering";
export * from "./common/responses";
```

#### 9.2 Create Response Types

Create `src/types/common/responses.ts`:

```typescript
import { PaginationInfo } from "./operations";

export interface SuccessResponse<T> {
  data: T;
  error?: never;
  pagination?: PaginationInfo;
}

export interface ErrorResponse {
  data?: never;
  error: string;
  details?: any;
  code?: string;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export interface BulkResponse<T> {
  success: T[];
  failed: Array<{
    item: any;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}
```

### Task 10: Testing Infrastructure

**Duration**: 1-2 days
**Priority**: High

#### 10.1 Create Test Utilities

Create `src/testing/test-client.ts`:

```typescript
import { BolticClient } from "../client/boltic-client";
import { MemoryCacheAdapter } from "../cache/adapters/memory";

export interface MockClientOptions {
  apiKey?: string;
  environment?: "local" | "test";
  mockResponses?: Record<string, any>;
}

export function createTestClient(
  options: MockClientOptions = {}
): BolticClient {
  return new BolticClient(options.apiKey || "test-api-key", {
    environment: "local",
    baseURL: "http://localhost:8000",
    cacheEnabled: true,
    debug: true,
    ...options,
  });
}

export function createMockCacheAdapter(): MemoryCacheAdapter {
  return new MemoryCacheAdapter(50);
}
```

#### 10.2 Create Basic Unit Tests

Create `tests/unit/client/core/base-client.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { BaseClient } from "../../../../src/client/core/base-client";
import { AuthManager } from "../../../../src/client/core/auth-manager";
import { ConfigManager } from "../../../../src/client/core/config";

describe("BaseClient", () => {
  let client: BaseClient;
  let authManager: AuthManager;
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager("test-api-key", "local");
    authManager = new AuthManager({ apiKey: "test-api-key" });
    client = new BaseClient(configManager.getConfig(), authManager);
  });

  it("should create instance successfully", () => {
    expect(client).toBeDefined();
  });

  it("should add auth headers to requests", () => {
    const authHeaders = authManager.getAuthHeaders();
    expect(authHeaders).toHaveProperty("x-boltic-token");
    expect(authHeaders["x-boltic-token"]).toBe("test-api-key");
  });
});
```

## Completion Criteria

Mark this task as complete when ALL of the following are achieved:

### ✅ Core Infrastructure

- [ ] HTTP client with Fetch/Axios adapters working
- [ ] Authentication system with API key validation
- [ ] Request/response interceptor system functional
- [ ] Base client class handling all HTTP methods
- [ ] Error handling with custom error classes

### ✅ Resource Foundation

- [ ] Base resource class for CRUD operations
- [ ] Operation interfaces defined
- [ ] Query building utilities implemented
- [ ] Response parsing and error handling

### ✅ Caching System

- [ ] Cache interface and memory adapter
- [ ] Cache manager with TTL support
- [ ] Integration with main client
- [ ] Cache key generation utilities

### ✅ Main Client

- [ ] BolticClient class fully implemented
- [ ] Configuration management working
- [ ] Client factory function operational
- [ ] All integration points tested

### ✅ Type System

- [ ] Complete TypeScript definitions
- [ ] Response type interfaces
- [ ] Operation type interfaces
- [ ] Export structure organized

### ✅ Testing

- [ ] Unit tests for core components
- [ ] Test utilities and helpers
- [ ] Mock client creation
- [ ] Coverage for critical paths

## Error Handling Protocol

If you encounter any issues:

1. **FIRST**: Check `/Docs/Bug_tracking.md` for similar issues
2. **Log the issue** using the template in Bug_tracking.md
3. **Include**: Full error messages, environment details, and reproduction steps
4. **Document the solution** once resolved

## Dependencies for Next Agents

After completion, the following agents can begin work:

- **Database Operations Agent** (depends on base resource classes)
- **Table Operations Agent** (depends on base resource classes)
- **Column Operations Agent** (depends on base resource classes)
- **Record Operations Agent** (depends on base resource classes)
- **API Integration Agent** (can start HTTP endpoint mapping)

## Critical Notes

- **DO NOT** break the foundation created by Project Foundation Agent
- **ENSURE** all HTTP adapters work in both browser and Node.js
- **TEST** authentication flow thoroughly
- **MAINTAIN** TypeScript strict mode compliance
- **DOCUMENT** all public APIs with JSDoc comments

Remember: You are building the core infrastructure that all resource agents will use. Stability, performance, and extensibility are paramount.
