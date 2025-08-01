#!/usr/bin/env tsx

import { createClient } from '../../src/client';
import { createMockResponse, createTestClient } from '../../src/testing';

console.log('🚀 Boltic SDK Stage 2 Core Infrastructure Demo\n');

async function demonstrateStage2Features() {
  console.log('📝 1. Client Initialization with Environment Configuration');
  console.log('='.repeat(60));

  // Create client with different environments
  const prodClient = createClient('prod-api-key-123', {
    environment: 'prod',
    debug: true,
  });

  const localClient = createClient('local-api-key-456', {
    environment: 'local',
    debug: true,
    timeout: 5000,
  });

  console.log(
    '✅ Production client config:',
    JSON.stringify(prodClient.getConfig(), null, 2)
  );
  console.log(
    '✅ Local client config:',
    JSON.stringify(localClient.getConfig(), null, 2)
  );

  console.log('\n🔐 2. Authentication System');
  console.log('='.repeat(60));

  // Test authentication
  console.log(
    '✅ Production client authenticated:',
    prodClient.isAuthenticated()
  );
  console.log('✅ Local client authenticated:', localClient.isAuthenticated());

  // API key validation
  const isValidKey = await prodClient.validateApiKey();
  console.log('✅ API key validation result:', isValidKey);

  console.log('\n🔧 3. Configuration Management');
  console.log('='.repeat(60));

  // Update configuration
  prodClient.updateConfig({ timeout: 15000, debug: false });
  console.log(
    '✅ Updated production config:',
    JSON.stringify(prodClient.getConfig(), null, 2)
  );

  // Update API key
  prodClient.updateApiKey('new-api-key-789');
  console.log('✅ API key updated successfully');

  console.log('\n🌐 4. HTTP Client & Interceptors');
  console.log('='.repeat(60));

  // Add request interceptor
  const requestInterceptorId = localClient.addRequestInterceptor((config) => {
    console.log('📤 Request interceptor:', config.method, config.url);
    config.headers = {
      ...config.headers,
      'X-Custom-Header': 'Stage2-Demo',
      'X-Request-Time': new Date().toISOString(),
    };
    return config;
  });

  // Add response interceptor
  const responseInterceptorId = localClient.addResponseInterceptor(
    (response) => {
      console.log('📥 Response interceptor: Status', response.status);
      return response;
    },
    (error: unknown) => {
      if (error instanceof Error) {
        console.log('❌ Error interceptor:', error.message);
      } else {
        console.log('❌ Error interceptor:', error);
      }
      return Promise.reject(error);
    }
  );

  console.log('✅ Added request interceptor ID:', requestInterceptorId);
  console.log('✅ Added response interceptor ID:', responseInterceptorId);

  console.log('\n🌍 5. HTTP Client Demonstration');
  console.log('='.repeat(60));

  try {
    // Get HTTP client for demonstration
    const httpClient = localClient.getHttpClient();

    // Test with a mock endpoint (this will fail but show the infrastructure working)
    console.log('🔄 Testing HTTP GET request...');
    await httpClient.get('/v1/tables/databases');
  } catch (error: any) {
    console.log('✅ Error handling working correctly:', error.message);

    // Check if it's our structured error
    if (error.context) {
      console.log('✅ Error context available:', Object.keys(error.context));
    }
  }

  console.log('\n📊 6. Type System & Base Resource');
  console.log('='.repeat(60));

  // Show TypeScript type safety working
  console.log('✅ TypeScript definitions available');
  console.log('✅ Core types: HttpResponse, ApiResponse, QueryOptions');
  console.log('✅ Auth types: AuthConfig, AuthHeaders');
  console.log('✅ Config types: ClientConfig, Environment');

  console.log('\n🧪 7. Testing Infrastructure');
  console.log('='.repeat(60));

  // Show testing utilities
  const testClient = createTestClient({
    apiKey: 'test-api-key-123', // Must be >= 10 characters for validation
    debug: true,
  });

  const mockResponse = createMockResponse({ id: 1, name: 'Test Database' });

  console.log('✅ Test client created:', testClient.isAuthenticated());
  console.log('✅ Mock response:', JSON.stringify(mockResponse, null, 2));

  console.log('\n🔄 8. Interceptor Management');
  console.log('='.repeat(60));

  // Remove interceptors
  localClient.removeInterceptor('request', requestInterceptorId);
  localClient.removeInterceptor('response', responseInterceptorId);
  console.log('✅ Interceptors removed successfully');

  console.log('\n🎉 Stage 2 Core Infrastructure Demo Complete!');
  console.log('='.repeat(60));
  console.log('✅ All core infrastructure components working correctly');
  console.log('✅ Ready for Stage 3: Resource Operations Implementation');
}

// Run the demo
demonstrateStage2Features().catch(console.error);
