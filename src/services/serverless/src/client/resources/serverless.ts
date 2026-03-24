/**
 * Serverless Resource
 * Provides serverless function management: CRUD, builds, logs, and status polling.
 * Extends BaseResource for consistency with other SDK modules.
 */

import {
  STATUS_POLLING_INTERVAL_MS,
  MAX_STATUS_POLLING_ATTEMPTS,
  TERMINAL_STATUSES,
} from '../../constants';
import { ServerlessApiClient } from '../../api/clients/serverless-api-client';
import {
  BaseResource,
  BaseClient,
  isErrorResponse,
  type BolticErrorResponse,
  type BolticSuccessResponse,
} from '../../../../common';
import type {
  CreateServerlessParams,
  CreateServerlessData,
  GetServerlessData,
  GetBuildsParams,
  GetBuildsData,
  GetLogsParams,
  GetLogsData,
  GetBuildLogsParams,
  GetBuildLogsData,
  ListServerlessParams,
  ListServerlessData,
  UpdateServerlessParams,
  UpdateServerlessData,
  ServerlessData,
} from '../../types/serverless';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ServerlessResource extends BaseResource {
  private apiClient: ServerlessApiClient;

  constructor(client: BaseClient) {
    super(client, '/serverless');

    const config = client.getConfig();
    this.apiClient = new ServerlessApiClient(config.apiKey, {
      environment: config.environment,
      region: config.region,
      timeout: config.timeout,
      debug: config.debug,
    });
  }

  /**
   * List all serverless functions with optional pagination and search.
   *
   * @param params - Optional pagination and filter parameters
   * @returns Paginated list of serverless functions
   *
   * @example
   * ```typescript
   * const list = await client.serverless.list();
   * const filtered = await client.serverless.list({ query: 'my-func', limit: 10 });
   * ```
   */
  async list(
    params: ListServerlessParams = {}
  ): Promise<BolticSuccessResponse<ListServerlessData> | BolticErrorResponse> {
    return this.apiClient.list(params);
  }

  /**
   * Get a serverless function by its ID.
   *
   * @param appId - The serverless function ID
   * @returns The serverless function details
   *
   * @example
   * ```typescript
   * const fn = await client.serverless.get('serverless-id');
   * ```
   */
  async get(
    appId: string
  ): Promise<BolticSuccessResponse<GetServerlessData> | BolticErrorResponse> {
    return this.apiClient.get(appId);
  }

  /**
   * Create a new serverless function.
   *
   * Supports three runtime types:
   * - `code` — deploy code directly (blueprint)
   * - `git` — deploy from a Git repository
   * - `container` — deploy a Docker container
   *
   * @param params - The serverless creation payload
   * @returns The created serverless function
   *
   * @example
   * ```typescript
   * const fn = await client.serverless.create({
   *   Name: 'my-api',
   *   Runtime: 'code',
   *   Resources: { CPU: 0.1, MemoryMB: 128, MemoryMaxMB: 128 },
   *   Scaling: { AutoStop: false, Min: 1, Max: 1, MaxIdleTime: 0 },
   *   CodeOpts: { Language: 'nodejs/20', Code: 'module.exports.handler = ...' },
   * });
   * ```
   */
  async create(
    params: CreateServerlessParams
  ): Promise<
    BolticSuccessResponse<CreateServerlessData> | BolticErrorResponse
  > {
    return this.apiClient.create(params);
  }

  /**
   * Create a serverless function and poll until it reaches a terminal state.
   *
   * Combines `create()` + `pollStatus()` for a simpler workflow.
   *
   * @param params - The serverless creation payload
   * @returns The final serverless state after reaching a terminal status
   *
   * @example
   * ```typescript
   * const fn = await client.serverless.createAndWait({
   *   Name: 'my-api',
   *   Runtime: 'code',
   *   CodeOpts: { Language: 'nodejs/20', Code: '...' },
   *   Resources: { CPU: 0.1, MemoryMB: 128, MemoryMaxMB: 128 },
   *   Scaling: { AutoStop: false, Min: 1, Max: 1, MaxIdleTime: 0 },
   * });
   * ```
   */
  async createAndWait(
    params: CreateServerlessParams
  ): Promise<BolticSuccessResponse<ServerlessData> | BolticErrorResponse> {
    const createResult = await this.apiClient.create(params);

    if (isErrorResponse(createResult)) {
      return createResult;
    }

    const appId = createResult.data?.ID;
    if (!appId) {
      return {
        error: {
          code: 'SERVERLESS_MISSING_ID',
          message: 'Create API response did not contain an ID',
          meta: [],
        },
      };
    }

    return this.pollStatus(appId);
  }

  /**
   * Update an existing serverless function.
   *
   * @param params - The update parameters (appId + partial payload)
   * @returns The updated serverless function
   *
   * @example
   * ```typescript
   * const updated = await client.serverless.update({
   *   appId: 'serverless-id',
   *   payload: { Scaling: { AutoStop: true, Min: 0, Max: 3, MaxIdleTime: 300 } },
   * });
   * ```
   */
  async update(
    params: UpdateServerlessParams
  ): Promise<
    BolticSuccessResponse<UpdateServerlessData> | BolticErrorResponse
  > {
    return this.apiClient.update(params);
  }

  /**
   * Update a serverless function and poll until it reaches a terminal state.
   *
   * @param params - The update parameters (appId + partial payload)
   * @returns The final serverless state after reaching a terminal status
   */
  async updateAndWait(
    params: UpdateServerlessParams
  ): Promise<BolticSuccessResponse<ServerlessData> | BolticErrorResponse> {
    const updateResult = await this.apiClient.update(params);

    if (isErrorResponse(updateResult)) {
      return updateResult;
    }

    return this.pollStatus(params.appId);
  }

  /**
   * List builds for a serverless function.
   *
   * @param params - The app ID and optional pagination
   * @returns List of builds
   *
   * @example
   * ```typescript
   * const builds = await client.serverless.getBuilds({ appId: 'serverless-id' });
   * ```
   */
  async getBuilds(
    params: GetBuildsParams
  ): Promise<BolticSuccessResponse<GetBuildsData> | BolticErrorResponse> {
    return this.apiClient.getBuilds(params);
  }

  /**
   * Get runtime logs for a serverless function.
   *
   * @param params - The app ID and optional time range / pagination
   * @returns Log entries
   *
   * @example
   * ```typescript
   * const logs = await client.serverless.getLogs({ appId: 'serverless-id' });
   * const recentLogs = await client.serverless.getLogs({
   *   appId: 'serverless-id',
   *   limit: 100,
   *   sortOrder: 'DESC',
   * });
   * ```
   */
  async getLogs(
    params: GetLogsParams
  ): Promise<BolticSuccessResponse<GetLogsData> | BolticErrorResponse> {
    return this.apiClient.getLogs(params);
  }

  /**
   * Get build logs for a specific build.
   *
   * @param params - The app ID and build ID
   * @returns Build log entries
   *
   * @example
   * ```typescript
   * const logs = await client.serverless.getBuildLogs({
   *   appId: 'serverless-id',
   *   buildId: 'build-id',
   * });
   * ```
   */
  async getBuildLogs(
    params: GetBuildLogsParams
  ): Promise<BolticSuccessResponse<GetBuildLogsData> | BolticErrorResponse> {
    return this.apiClient.getBuildLogs(params);
  }

  /**
   * Poll a serverless function until it reaches a terminal status
   * (running, failed, degraded, or suspended).
   *
   * @param appId - The serverless function ID to poll
   * @param options - Optional polling configuration overrides
   * @returns The final serverless state or a timeout error
   *
   * @example
   * ```typescript
   * const result = await client.serverless.pollStatus('serverless-id');
   * ```
   */
  async pollStatus(
    appId: string,
    options: {
      intervalMs?: number;
      maxAttempts?: number;
    } = {}
  ): Promise<BolticSuccessResponse<ServerlessData> | BolticErrorResponse> {
    const interval = options.intervalMs ?? STATUS_POLLING_INTERVAL_MS;
    const maxAttempts = options.maxAttempts ?? MAX_STATUS_POLLING_ATTEMPTS;
    const debug = this.client.getConfig().debug;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.apiClient.get(appId);

      if (isErrorResponse(result)) {
        return result;
      }

      const status = result.data?.Status;

      if (debug) {
        // eslint-disable-next-line no-console
        console.log(
          `[ServerlessResource] Poll #${attempt + 1}: status=${status}`
        );
      }

      if (
        status &&
        TERMINAL_STATUSES.includes(status as (typeof TERMINAL_STATUSES)[number])
      ) {
        if (debug) {
          // eslint-disable-next-line no-console
          console.log(
            `[ServerlessResource] Reached terminal state: ${status} after ${attempt + 1} poll(s)`
          );
        }
        return result;
      }

      await sleep(interval);
    }

    return {
      error: {
        code: 'SERVERLESS_STATUS_TIMEOUT',
        message: `Serverless ${appId} did not reach a terminal state within ${maxAttempts} polling attempts`,
        meta: [
          `app_id: ${appId}`,
          `max_attempts: ${maxAttempts}`,
          `interval_ms: ${interval}`,
        ],
      },
    };
  }
}
