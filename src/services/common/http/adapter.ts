export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface HttpRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  data?: unknown;
  timeout?: number;
  signal?: AbortSignal;
  /**
   * Opt-in only. When unset (default), JSON/text parsing is unchanged for all services.
   * Storage `downloadFile` sets `arraybuffer` for binary bodies.
   */
  responseType?: 'arraybuffer';
}

export interface HttpAdapter {
  request<T = unknown>(config: HttpRequestConfig): Promise<HttpResponse<T>>;
}
