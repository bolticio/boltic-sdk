import { HttpRequestConfig, HttpResponse } from '../../utils/http/adapter';

export type RequestInterceptor = (
  config: HttpRequestConfig
) => HttpRequestConfig | Promise<HttpRequestConfig>;

export type ResponseInterceptor = (
  response: HttpResponse
) => HttpResponse | Promise<HttpResponse>;

export type ErrorInterceptor = (error: unknown) => unknown | Promise<unknown>;

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
    for (const interceptor of Array.from(this.requestInterceptors.values())) {
      result = await interceptor(result);
    }
    return result;
  }

  async executeResponseInterceptors(
    response: HttpResponse
  ): Promise<HttpResponse> {
    let result = response;
    for (const { fulfilled } of Array.from(
      this.responseInterceptors.values()
    )) {
      if (fulfilled) {
        result = await fulfilled(result);
      }
    }
    return result;
  }

  async executeErrorInterceptors(error: unknown): Promise<unknown> {
    let result = error;
    for (const { rejected } of Array.from(this.responseInterceptors.values())) {
      if (rejected) {
        result = await rejected(result);
      }
    }
    return result;
  }
}
