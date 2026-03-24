import {
  RecordBulkInsertOptions,
  RecordBulkInsertResponse,
  RecordData,
  RecordDeleteOptions,
  RecordQueryOptions,
  RecordUpdateByIdOptions,
  RecordUpdateOptions,
  RecordWithId,
} from '../../types/api/record';
import {
  BaseApiClient,
  type BaseApiClientConfig,
  type BolticSuccessResponse,
  type BolticListResponse,
  type BolticErrorResponse,
} from '../../../../common';
import { filterArrayFields, filterObjectFields } from '../../utils/common';
import { addDbIdToUrl } from '../../utils/database/db-context';
import {
  buildRecordEndpointPath,
  RECORD_ENDPOINTS,
} from '../endpoints/records';
import { transformDeleteRequest } from '../transformers/records';

export type RecordsApiClientConfig = BaseApiClientConfig;

export class RecordsApiClient extends BaseApiClient {
  constructor(
    apiKey: string,
    config: Omit<BaseApiClientConfig, 'apiKey'> = {}
  ) {
    super(apiKey, config);
  }

  /**
   * Insert a single record
   */
  async insertRecord(
    request: RecordData & { table_id?: string },
    dbId?: string
  ): Promise<BolticSuccessResponse<RecordWithId> | BolticErrorResponse> {
    try {
      const { table_id, fields, ...recordData } = request;

      if (!table_id) {
        return this.formatErrorResponse(
          new Error('table_id is required for insert operation')
        );
      }

      const endpoint = RECORD_ENDPOINTS.insert;
      let url = `${this.baseURL}${buildRecordEndpointPath(endpoint, { table_id })}`;
      url = addDbIdToUrl(url, dbId);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: recordData,
        timeout: this.config.timeout,
      });

      // Apply field filtering if fields are specified
      const responseData = response.data as BolticSuccessResponse<RecordWithId>;
      if (fields && responseData.data) {
        responseData.data = filterObjectFields(
          responseData.data,
          fields
        ) as RecordWithId;
      }

      return responseData;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Insert multiple records in bulk
   */
  async insertManyRecords(
    records: RecordData[],
    tableId: string,
    options: RecordBulkInsertOptions = { validation: true },
    dbId?: string
  ): Promise<RecordBulkInsertResponse | BolticErrorResponse> {
    try {
      if (!tableId) {
        return this.formatErrorResponse(
          new Error('table_id is required for bulk insert operation')
        );
      }

      if (!records || !Array.isArray(records) || records.length === 0) {
        return this.formatErrorResponse(
          new Error('records array is required and cannot be empty')
        );
      }

      const endpoint = RECORD_ENDPOINTS.insertMany;
      let url = `${this.baseURL}${buildRecordEndpointPath(endpoint, { table_id: tableId })}`;

      // Add validation query parameter
      const queryParams = new URLSearchParams();
      if (options.validation !== undefined) {
        queryParams.append('validation', options.validation.toString());
      }

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      url = addDbIdToUrl(url, dbId);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: records,
        timeout: this.config.timeout,
      });

      return response.data as RecordBulkInsertResponse;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Get a single record by ID
   */
  async getRecord(
    recordId: string,
    tableId: string,
    options: { fields?: string[]; show_decrypted?: boolean } = {},
    dbId?: string
  ): Promise<BolticSuccessResponse<RecordWithId> | BolticErrorResponse> {
    try {
      if (!tableId) {
        return this.formatErrorResponse(
          new Error('table_id is required for get operation')
        );
      }

      const endpoint = RECORD_ENDPOINTS.get;
      let url = `${this.baseURL}${buildRecordEndpointPath(endpoint, {
        table_id: tableId,
        record_id: recordId,
      })}`;

      const queryParams = new URLSearchParams();
      if (options.show_decrypted) {
        queryParams.append('show_decrypted', 'true');
      }

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      url = addDbIdToUrl(url, dbId);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        timeout: this.config.timeout,
      });

      // Apply field filtering if fields are specified
      const responseData = response.data as BolticSuccessResponse<RecordWithId>;
      if (options.fields && responseData.data) {
        responseData.data = filterObjectFields(
          responseData.data,
          options.fields
        ) as RecordWithId;
      }

      return responseData;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * List records with filtering and pagination
   */
  async listRecords(
    options: RecordQueryOptions & { table_id?: string } = {},
    dbId?: string
  ): Promise<BolticListResponse<RecordWithId> | BolticErrorResponse> {
    try {
      const { table_id, ...queryOptions } = options;

      if (!table_id) {
        return this.formatErrorResponse(
          new Error('table_id is required for list operation')
        );
      }

      const endpoint = RECORD_ENDPOINTS.list;
      let url = `${this.baseURL}${buildRecordEndpointPath(endpoint, { table_id })}`;
      url = addDbIdToUrl(url, dbId);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: queryOptions,
        timeout: this.config.timeout,
      });

      // Apply field filtering if fields are specified
      const responseData = response.data as BolticListResponse<RecordWithId>;
      if (queryOptions.fields && responseData.data) {
        responseData.data = filterArrayFields(
          responseData.data,
          queryOptions.fields
        ) as RecordWithId[];
      }

      return responseData;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Update records by filters
   */
  async updateRecords(
    request: RecordUpdateOptions & { table_id?: string },
    dbId?: string
  ): Promise<BolticListResponse<RecordWithId> | BolticErrorResponse> {
    try {
      const { table_id, set, filters, fields, show_decrypted, ...rest } =
        request;

      if (!table_id) {
        return this.formatErrorResponse(
          new Error('table_id is required for update operation')
        );
      }

      // Transform payload to use 'updates' instead of 'set' for API
      const apiPayload: Record<string, unknown> = {
        updates: set,
        filters,
        ...rest,
      };

      // Only include fields if specified
      if (fields) {
        apiPayload.fields = fields;
      }

      const endpoint = RECORD_ENDPOINTS.update;
      let url = `${this.baseURL}${buildRecordEndpointPath(endpoint, { table_id })}`;

      const queryParams = new URLSearchParams();
      if (show_decrypted) {
        queryParams.append('show_decrypted', 'true');
      }

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      url = addDbIdToUrl(url, dbId);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: apiPayload,
        timeout: this.config.timeout,
      });

      // Apply field filtering if fields are specified in the request
      const responseData = response.data as BolticListResponse<RecordWithId>;
      if (fields && responseData.data) {
        responseData.data = filterArrayFields(
          responseData.data,
          fields
        ) as RecordWithId[];
      }

      return responseData;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Update a single record by ID
   */
  async updateRecordById(
    recordId: string,
    request: RecordUpdateByIdOptions & { table_id?: string },
    dbId?: string
  ): Promise<BolticSuccessResponse<RecordWithId> | BolticErrorResponse> {
    try {
      const { table_id, show_decrypted, ...updateOptions } = request;

      if (!table_id) {
        return this.formatErrorResponse(
          new Error('table_id is required for updateById operation')
        );
      }

      const endpoint = RECORD_ENDPOINTS.updateById;
      let url = `${this.baseURL}${buildRecordEndpointPath(endpoint, {
        record_id: recordId,
        table_id,
      })}`;

      const queryParams = new URLSearchParams();
      if (show_decrypted) {
        queryParams.append('show_decrypted', 'true');
      }

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      url = addDbIdToUrl(url, dbId);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: updateOptions.set,
        timeout: this.config.timeout,
      });

      // Apply field filtering if fields are specified
      const responseData = response.data as BolticSuccessResponse<RecordWithId>;
      if (updateOptions.fields && responseData.data) {
        responseData.data = filterObjectFields(
          responseData.data,
          updateOptions.fields
        ) as RecordWithId;
      }

      return responseData;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Unified delete records method that supports both record_ids and filters
   */
  async deleteRecords(
    request: RecordDeleteOptions & { table_id?: string },
    dbId?: string
  ): Promise<BolticSuccessResponse<{ message: string }> | BolticErrorResponse> {
    try {
      const { table_id } = request;

      if (!table_id) {
        return this.formatErrorResponse(
          new Error('table_id is required for delete operation')
        );
      }

      // Transform the request to API format
      const transformedRequest = transformDeleteRequest(request);

      const endpoint = RECORD_ENDPOINTS.delete;
      let url = `${this.baseURL}${buildRecordEndpointPath(endpoint, { table_id })}`;
      url = addDbIdToUrl(url, dbId);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: transformedRequest,
        timeout: this.config.timeout,
      });

      // Return raw response without transformation
      return response.data as BolticSuccessResponse<{ message: string }>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Delete a single record by ID
   */
  async deleteRecordById(
    recordId: string,
    request: { table_id?: string },
    dbId?: string
  ): Promise<BolticSuccessResponse<{ message: string }> | BolticErrorResponse> {
    // Use deleteRecords with a single ID
    return this.deleteRecords(
      {
        record_ids: [recordId],
        table_id: request.table_id,
      },
      dbId
    );
  }
}
