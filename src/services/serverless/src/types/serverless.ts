/**
 * Serverless module types
 *
 * Domain-specific request/response shapes for Boltic serverless APIs.
 * Common infrastructure types (Region, Environment, response wrappers,
 * client config) are imported from the shared common module.
 */

import type {
  Region,
  Environment,
  BolticSuccessResponse,
  BolticErrorResponse,
  BaseApiClientConfig,
} from '../../../common';

export type {
  Region,
  Environment,
  BolticSuccessResponse,
  BolticErrorResponse,
  BaseApiClientConfig,
};

// ---------------------------------------------------------------------------
// Endpoint
// ---------------------------------------------------------------------------

export interface ServerlessApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  authenticated: boolean;
}

// ---------------------------------------------------------------------------
// Shared domain types
// ---------------------------------------------------------------------------

export type ServerlessRuntime = 'code' | 'git' | 'container';

export type ServerlessStatus =
  | 'running'
  | 'draft'
  | 'building'
  | 'pending'
  | 'stopped'
  | 'failed'
  | 'degraded'
  | 'suspended';

export interface ServerlessScaling {
  AutoStop: boolean;
  Min: number;
  Max: number;
  MaxIdleTime: number;
}

export interface ServerlessResources {
  CPU: number;
  MemoryMB: number;
  MemoryMaxMB: number;
}

export interface ServerlessCodeOpts {
  Language: string;
  Packages?: string[];
  Code?: string;
}

export interface ServerlessContainerOpts {
  Image: string;
  Args?: string[];
  Command?: string;
}

export interface ServerlessPortMap {
  ContainerPort?: number;
  HostPort?: number;
  Protocol?: string;
}

export interface ServerlessGitRepository {
  SshURL?: string;
  HtmlURL?: string;
  CloneURL?: string;
}

export interface ServerlessAppDomain {
  DomainName: string;
  BaseUrl?: string;
}

export interface ServerlessConfig {
  Name: string;
  Description?: string;
  Runtime: ServerlessRuntime;
  Env?: Record<string, string>;
  PortMap?: ServerlessPortMap[];
  Scaling?: ServerlessScaling;
  Resources?: ServerlessResources;
  Timeout?: number;
  Validations?: unknown;
  CodeOpts?: ServerlessCodeOpts;
  ContainerOpts?: ServerlessContainerOpts;
}

export interface ServerlessData {
  ID: string;
  ParentID?: string;
  Status: ServerlessStatus;
  Config: ServerlessConfig;
  Links?: {
    Git?: {
      Repository?: ServerlessGitRepository;
    };
  };
  AppDomain?: ServerlessAppDomain[];
  RegionID?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// List serverless
// ---------------------------------------------------------------------------

export interface ListServerlessParams {
  /** Page number (1-based). @defaultValue 1 */
  page?: number;
  /** Items per page. @defaultValue 20 */
  limit?: number;
  /** Field to sort by. @defaultValue 'CreatedAt' */
  sortBy?: string;
  /** Sort direction. @defaultValue 'desc' */
  sortOrder?: 'asc' | 'desc';
  /** Search query string to filter by name. */
  query?: string;
}

export type ListServerlessData = ServerlessData[];

// ---------------------------------------------------------------------------
// Get serverless by ID
// ---------------------------------------------------------------------------

export interface GetServerlessParams {
  /** The serverless function ID. */
  appId: string;
}

export type GetServerlessData = ServerlessData;

// ---------------------------------------------------------------------------
// Create serverless
// ---------------------------------------------------------------------------

export interface CreateServerlessParams {
  Name: string;
  Description?: string;
  Runtime: ServerlessRuntime;
  Env?: Record<string, string>;
  PortMap?: ServerlessPortMap[];
  Scaling?: ServerlessScaling;
  Resources?: ServerlessResources;
  Timeout?: number;
  Validations?: unknown;
  CodeOpts?: ServerlessCodeOpts;
  ContainerOpts?: ServerlessContainerOpts;
}

export type CreateServerlessData = ServerlessData;

// ---------------------------------------------------------------------------
// Update serverless
// ---------------------------------------------------------------------------

export interface UpdateServerlessParams {
  /** The serverless function ID to update. */
  appId: string;
  /** The update payload — partial config fields to update. */
  payload: Partial<CreateServerlessParams>;
}

export type UpdateServerlessData = ServerlessData;

// ---------------------------------------------------------------------------
// Builds
// ---------------------------------------------------------------------------

export interface ServerlessBuildStatusEntry {
  Status: string;
  Timestamp?: string;
}

export interface ServerlessBuild {
  ID: string;
  Version?: number;
  Status?: string;
  StatusHistory?: ServerlessBuildStatusEntry[];
  CreatedAt?: string;
  [key: string]: unknown;
}

export interface GetBuildsParams {
  /** The serverless function ID. */
  appId: string;
  /** Page number (1-based). @defaultValue 1 */
  page?: number;
  /** Items per page. @defaultValue 20 */
  limit?: number;
}

export type GetBuildsData = ServerlessBuild[];

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------

export interface ServerlessLogEntry {
  Timestamp?: number;
  Severity?: string;
  Log?: string;
  [key: string]: unknown;
}

export interface GetLogsParams {
  /** The serverless function ID. */
  appId: string;
  /** Page number (1-based). @defaultValue 1 */
  page?: number;
  /** Items per page. @defaultValue 50 */
  limit?: number;
  /** Sort direction. @defaultValue 'DESC' */
  sortOrder?: 'ASC' | 'DESC';
  /** Unix epoch start (seconds). Defaults to 24h ago. */
  timestampStart?: number;
  /** Unix epoch end (seconds). Defaults to now. */
  timestampEnd?: number;
}

export type GetLogsData = ServerlessLogEntry[];

// ---------------------------------------------------------------------------
// Build Logs
// ---------------------------------------------------------------------------

export interface ServerlessBuildLogEntry {
  Log?: string;
  Timestamp?: number;
  Message?: string;
  [key: string]: unknown;
}

export interface GetBuildLogsParams {
  /** The serverless function ID. */
  appId: string;
  /** The build ID. */
  buildId: string;
}

export type GetBuildLogsData = ServerlessBuildLogEntry[];
