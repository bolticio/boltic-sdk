/**
 * Serverless API Client
 * Extends BaseApiClient — shares auth, headers, error handling, and HTTP
 * infrastructure with the rest of the SDK via the common module.
 */

import {
  BaseApiClient,
  SERVICE_PATHS,
  type BaseApiClientConfig,
  type BolticErrorResponse,
  type BolticSuccessResponse,
} from '../../../../common';
import type {
  CreateServerlessParams,
  CreateServerlessData,
  GetServerlessData,
  GetBuildsData,
  GetBuildLogsData,
  GetLogsData,
  ListServerlessData,
  ListServerlessParams,
  GetBuildsParams,
  GetLogsParams,
  GetBuildLogsParams,
  UpdateServerlessParams,
  UpdateServerlessData,
} from '../../types/serverless';
import {
  SERVERLESS_ENDPOINTS,
  buildServerlessEndpointPath,
} from '../endpoints/serverless';

type ServerlessResponse<T> = BolticSuccessResponse<T> | BolticErrorResponse;

export class ServerlessApiClient extends BaseApiClient {
  constructor(
    apiKey: string,
    config: Omit<BaseApiClientConfig, 'apiKey'> = {}
  ) {
    super(apiKey, config, SERVICE_PATHS.SERVERLESS);
  }

  /**
   * List all serverless functions with optional pagination and search.
   */
  async list(
    params: ListServerlessParams = {}
  ): Promise<ServerlessResponse<ListServerlessData>> {
    try {
      const endpoint = SERVERLESS_ENDPOINTS.list;
      const query = new URLSearchParams({
        page: String(params.page ?? 1),
        limit: String(params.limit ?? 20),
        sortBy: params.sortBy ?? 'CreatedAt',
        sortOrder: params.sortOrder ?? 'desc',
      });
      if (params.query) {
        query.set('q', params.query);
      }
      const url = `${this.baseURL}${endpoint.path}?${query.toString()}`;

      const response = await this.httpAdapter.request<
        ServerlessResponse<ListServerlessData>
      >({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        timeout: this.config.timeout,
      });

      return response.data;
    } catch (error: unknown) {
      return this.formatErrorResponse(error, 'SERVERLESS');
    }
  }

  /**
   * Get a serverless function by its ID.
   */
  async get(appId: string): Promise<ServerlessResponse<GetServerlessData>> {
    try {
      const endpoint = SERVERLESS_ENDPOINTS.get;
      const path = buildServerlessEndpointPath(endpoint, { app_id: appId });
      const url = `${this.baseURL}${path}`;
      console.log('url', url);

      const response = await this.httpAdapter.request<
        ServerlessResponse<GetServerlessData>
      >({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        timeout: this.config.timeout,
      });
      console.log('response', response.data);

      return response.data;
    } catch (error: unknown) {
      return this.formatErrorResponse(error, 'SERVERLESS');
    }
  }

  /**
   * Create a new serverless function.
   */
  async create(
    payload: CreateServerlessParams
  ): Promise<ServerlessResponse<CreateServerlessData>> {
    try {
      const endpoint = SERVERLESS_ENDPOINTS.create;
      const url = `${this.baseURL}${endpoint.path}`;

      const response = await this.httpAdapter.request<
        ServerlessResponse<CreateServerlessData>
      >({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: payload,
        timeout: this.config.timeout,
      });

      return response.data;
    } catch (error: unknown) {
      return this.formatErrorResponse(error, 'SERVERLESS');
    }
  }

  /**
   * Update an existing serverless function.
   */
  async update(
    params: UpdateServerlessParams
  ): Promise<ServerlessResponse<UpdateServerlessData>> {
    try {
      const endpoint = SERVERLESS_ENDPOINTS.update;
      const path = buildServerlessEndpointPath(endpoint, {
        app_id: params.appId,
      });
      const url = `${this.baseURL}${path}`;

      const response = await this.httpAdapter.request<
        ServerlessResponse<UpdateServerlessData>
      >({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: params.payload,
        timeout: this.config.timeout,
      });

      return response.data;
    } catch (error: unknown) {
      return this.formatErrorResponse(error, 'SERVERLESS');
    }
  }

  /**
   * List builds for a serverless function.
   */
  async getBuilds(
    params: GetBuildsParams
  ): Promise<ServerlessResponse<GetBuildsData>> {
    try {
      const endpoint = SERVERLESS_ENDPOINTS.getBuilds;
      const path = buildServerlessEndpointPath(endpoint, {
        app_id: params.appId,
      });
      const query = new URLSearchParams({
        page: String(params.page ?? 1),
        limit: String(params.limit ?? 20),
        sortBy: 'CreatedAt',
        sortOrder: 'desc',
      });
      const url = `${this.baseURL}${path}?${query.toString()}`;

      const response = await this.httpAdapter.request<
        ServerlessResponse<GetBuildsData>
      >({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        timeout: this.config.timeout,
      });

      return response.data;
    } catch (error: unknown) {
      return this.formatErrorResponse(error, 'SERVERLESS');
    }
  }

  /**
   * Get runtime logs for a serverless function.
   */
  async getLogs(
    params: GetLogsParams
  ): Promise<ServerlessResponse<GetLogsData>> {
    try {
      const endpoint = SERVERLESS_ENDPOINTS.getLogs;
      const path = buildServerlessEndpointPath(endpoint, {
        app_id: params.appId,
      });

      const now = Math.floor(Date.now() / 1000);
      const defaultStart = now - 24 * 60 * 60;

      const query = new URLSearchParams({
        page: String(params.page ?? 1),
        limit: String(params.limit ?? 50),
        sortBy: 'Timestamp',
        sortOrder: params.sortOrder ?? 'DESC',
        timestampStart: String(params.timestampStart ?? defaultStart),
        timestampEnd: String(params.timestampEnd ?? now),
        metric_interval: '60',
      });
      const url = `${this.baseURL}${path}?${query.toString()}`;

      const response = await this.httpAdapter.request<
        ServerlessResponse<GetLogsData>
      >({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        timeout: this.config.timeout,
      });

      return response.data;
    } catch (error: unknown) {
      return this.formatErrorResponse(error, 'SERVERLESS');
    }
  }

  /**
   * Get build logs for a specific build of a serverless function.
   */
  async getBuildLogs(
    params: GetBuildLogsParams
  ): Promise<ServerlessResponse<GetBuildLogsData>> {
    try {
      const endpoint = SERVERLESS_ENDPOINTS.getBuildLogs;
      const path = buildServerlessEndpointPath(endpoint, {
        app_id: params.appId,
        build_id: params.buildId,
      });
      const query = new URLSearchParams({
        limit: '-1',
        tail: 'false',
        sortOrder: 'asc',
        sortBy: 'Timestamp',
      });
      const url = `${this.baseURL}${path}?${query.toString()}`;

      const response = await this.httpAdapter.request<
        ServerlessResponse<GetBuildLogsData>
      >({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        timeout: this.config.timeout,
      });

      return response.data;
    } catch (error: unknown) {
      return this.formatErrorResponse(error, 'SERVERLESS');
    }
  }
}
