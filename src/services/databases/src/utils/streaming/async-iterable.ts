/**
 * Utility functions for handling streaming responses
 */
export class StreamingUtils {
  /**
   * Convert Server-Sent Events to AsyncIterable
   * TODO: Implement when backend supports SSE streaming
   */
  static async *fromSSE(response: Response): AsyncIterable<string> {
    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data !== '[DONE]') {
              yield data;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Convert chunked response to AsyncIterable
   * TODO: Implement when backend supports chunked streaming
   */
  static async *fromChunked(response: Response): AsyncIterable<string> {
    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        yield chunk;
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Collect all chunks from AsyncIterable into a single string
   */
  static async collectAll(iterable: AsyncIterable<string>): Promise<string> {
    let result = '';
    for await (const chunk of iterable) {
      result += chunk;
    }
    return result;
  }

  /**
   * Convert a string to AsyncIterable (for simulating streaming)
   * Useful for testing or when backend doesn't support streaming yet
   */
  static async *fromString(
    data: string,
    chunkSize = 10
  ): AsyncIterable<string> {
    for (let i = 0; i < data.length; i += chunkSize) {
      yield data.slice(i, i + chunkSize);
      // Add small delay to simulate streaming
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  /**
   * Transform AsyncIterable with a mapping function
   */
  static async *map<T, U>(
    iterable: AsyncIterable<T>,
    mapper: (value: T) => U | Promise<U>
  ): AsyncIterable<U> {
    for await (const value of iterable) {
      yield await mapper(value);
    }
  }

  /**
   * Filter AsyncIterable with a predicate function
   */
  static async *filter<T>(
    iterable: AsyncIterable<T>,
    predicate: (value: T) => boolean | Promise<boolean>
  ): AsyncIterable<T> {
    for await (const value of iterable) {
      if (await predicate(value)) {
        yield value;
      }
    }
  }

  /**
   * Take only the first n items from AsyncIterable
   */
  static async *take<T>(
    iterable: AsyncIterable<T>,
    count: number
  ): AsyncIterable<T> {
    let taken = 0;
    for await (const value of iterable) {
      if (taken >= count) break;
      yield value;
      taken++;
    }
  }
}
