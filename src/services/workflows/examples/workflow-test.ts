/**
 * Workflow Integration Test Script
 *
 * Run a specific test by passing it as a CLI argument:
 *
 *   npx tsx src/services/workflows/examples/workflow-test.ts execute-only
 *   npx tsx src/services/workflows/examples/workflow-test.ts get-by-id <execution_id>
 *   npx tsx src/services/workflows/examples/workflow-test.ts execute-poll
 *   npx tsx src/services/workflows/examples/workflow-test.ts get-integrations
 *   npx tsx src/services/workflows/examples/workflow-test.ts get-credentials <entity>
 *   npx tsx src/services/workflows/examples/workflow-test.ts get-integration-resource <slug>
 *   npx tsx src/services/workflows/examples/workflow-test.ts get-integration-form <slug> <resource> <operation> <secret>
 *   npx tsx src/services/workflows/examples/workflow-test.ts all
 *
 * Prerequisites:
 *   - Set BOLTIC_API_KEY environment variable (or edit the constant below)
 */

import * as dotenv from 'dotenv';
import { createClient } from '../../../index';
import type { ActivityNode, Environment } from '../src/types/workflow';
import { DEFAULT_RETRY_CONFIG, CONTINUE_ON_FAILURE } from '../src/constants';

dotenv.config({ path: '.env' });

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const API_KEY = process.env.BOLTIC_API_KEY || '<YOUR_API_KEY>';
const REGION: 'asia-south1' | 'us-central1' = 'asia-south1';
const ENVIRONMENT = (process.env.BOLTIC_ENVIRONMENT || 'prod') as Environment;

const SAMPLE_NODES: ActivityNode[] = [
  {
    id: 'api1',
    data: {
      type: 'apiActivity',
      name: 'api1',
      properties: {
        method: 'get',
        endpoint: 'https://dummyjson.com/products',
        query_params: {},
        state_params: {},
        headers: {},
        body: null,
        body_type: 'none',
        api_timeout: 30000,
        branches: [{ ref: 'success' }, { ref: 'failure' }],
        maximum_timeout: 60000,
        retry_config: DEFAULT_RETRY_CONFIG,
        continue_on_failure: CONTINUE_ON_FAILURE,
        integration_slug: 'blt-int.api',
      },
    },
    // activity_data: {
    //   id: '6cc1d090-334c-4377-a638-8777c48a1d07',
    //   properties: {},
    //   status: 'published',
    // },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function separator(title: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

function isError(result: { error?: unknown; data?: unknown }): boolean {
  return 'error' in result && !!result.error && !result.data;
}

function getClient(debug = false) {
  return createClient(API_KEY, { region: REGION, environment: ENVIRONMENT, debug });
}

// ---------------------------------------------------------------------------
// Individual tests
// ---------------------------------------------------------------------------

async function testExecuteOnly(): Promise<string | null> {
  separator('executeIntegration (executeOnly = true)');

  const client = getClient();
  console.log('Calling workflow.executeIntegration with executeOnly = true ...');

  const result = await client.workflow.executeIntegration({
    nodes: SAMPLE_NODES,
    executeOnly: true,
  });

  if (isError(result)) {
    console.error('ERROR:', JSON.stringify(result, null, 2));
    return null;
  }

  console.log('SUCCESS – immediate response:');
  console.log(JSON.stringify(result, null, 2));

  const executionId = (result.data as { execution_id?: string })?.execution_id;
  console.log('Execution ID:', executionId ?? '(not present)');
  return executionId ?? null;
}

async function testGetExecutionById(executionId: string): Promise<void> {
  separator('getIntegrationExecuteById');

  const client = getClient();
  console.log(`Calling workflow.getIntegrationExecuteById("${executionId}") ...`);

  const result = await client.workflow.getIntegrationExecuteById(executionId);

  if (isError(result)) {
    console.error('ERROR:', JSON.stringify(result, null, 2));
    return;
  }

  console.log('SUCCESS – execution data:');
  console.log(JSON.stringify(result, null, 2));
}

async function testExecuteWithPolling(): Promise<void> {
  separator('executeIntegration (with polling)');

  const client = getClient(true);
  console.log('Calling workflow.executeIntegration with polling ...');
  console.log('(will poll up to 30 times at 1 s intervals)\n');

  const startTime = Date.now();
  const result = await client.workflow.executeIntegration({
    nodes: SAMPLE_NODES,
  });
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  if (isError(result)) {
    console.error(`ERROR after ${elapsed}s:`, JSON.stringify(result, null, 2));
    return;
  }

  console.log(`SUCCESS after ${elapsed}s – final result:`);
  console.log(JSON.stringify(result, null, 2));
}

async function testGetIntegrations(): Promise<void> {
  separator('getIntegrations');

  const client = getClient();
  console.log('Calling workflow.getIntegrations() ...');

  const result = await client.workflow.getIntegrations();

  if (isError(result)) {
    console.error('ERROR:', JSON.stringify(result, null, 2));
    return;
  }

  console.log('SUCCESS – integrations list:');
  console.log(JSON.stringify(result, null, 2));
}

async function testGetCredentials(entity: string): Promise<void> {
  separator(`getCredentials (entity: ${entity})`);

  const client = getClient();
  console.log(`Calling workflow.getCredentials({ entity: "${entity}" }) ...`);

  const result = await client.workflow.getCredentials({ entity });

  if (isError(result)) {
    console.error('ERROR:', JSON.stringify(result, null, 2));
    return;
  }

  console.log('SUCCESS – credentials list:');
  console.log(JSON.stringify(result, null, 2));
}

async function testGetIntegrationResource(integrationSlug: string): Promise<void> {
  separator(`getIntegrationResource (slug: ${integrationSlug})`);

  const client = getClient();
  console.log(`Calling workflow.getIntegrationResource({ integration_slug: "${integrationSlug}" }) ...`);

  const result = await client.workflow.getIntegrationResource({
    integration_slug: integrationSlug,
  });

  if (isError(result)) {
    console.error('ERROR:', JSON.stringify(result, null, 2));
    return;
  }

  console.log('SUCCESS – integration resource schema:');
  console.log(JSON.stringify(result, null, 2));
}

async function testGetIntegrationForm(
  integrationSlug: string,
  resource: string,
  operation: string,
  secret: string
): Promise<void> {
  separator(`getIntegrationForm (slug: ${integrationSlug}, resource: ${resource}, op: ${operation})`);

  const client = getClient();
  console.log(`Calling workflow.getIntegrationForm(...) ...`);

  const result = await client.workflow.getIntegrationForm({
    integration_slug: integrationSlug,
    resource,
    operation,
    secret,
    asJsonSchema: true,
  });

  if (isError(result)) {
    console.error('ERROR:', JSON.stringify(result, null, 2));
    return;
  }

  console.log('SUCCESS – integration form schema:');
  console.log(JSON.stringify(result, null, 2));
}

async function testAll(): Promise<void> {
  const executionId = await testExecuteOnly();

  if (executionId) {
    await new Promise((r) => setTimeout(r, 2000));
    await testGetExecutionById(executionId);
  } else {
    console.log('\nSkipping get-by-id – no execution_id from execute-only');
  }

  await testExecuteWithPolling();
  await testGetIntegrations();
  await testGetCredentials('asana');
  await testGetIntegrationResource('blt-int.asana');
}

// ---------------------------------------------------------------------------
// CLI router
// ---------------------------------------------------------------------------

const TESTS: Record<string, (...args: string[]) => Promise<void>> = {
  'execute-only': async () => { await testExecuteOnly(); },
  'get-by-id': async (id: string) => {
    if (!id) {
      console.error('Usage: get-by-id <execution_id>');
      process.exit(1);
    }
    await testGetExecutionById(id);
  },
  'execute-poll': async () => { await testExecuteWithPolling(); },
  'get-integrations': async () => { await testGetIntegrations(); },
  'get-credentials': async (entity: string) => {
    if (!entity) {
      console.error('Usage: get-credentials <entity>');
      process.exit(1);
    }
    await testGetCredentials(entity);
  },
  'get-integration-resource': async (slug: string) => {
    if (!slug) {
      console.error('Usage: get-integration-resource <integration_slug>');
      process.exit(1);
    }
    await testGetIntegrationResource(slug);
  },
  'get-integration-form': async (slug: string, resource: string, operation: string, secret: string) => {
    if (!slug || !resource || !operation || !secret) {
      console.error('Usage: get-integration-form <integration_slug> <resource> <operation> <secret>');
      process.exit(1);
    }
    await testGetIntegrationForm(slug, resource, operation, secret);
  },
  'all': async () => { await testAll(); },
};

async function main() {
  const [testName, ...rest] = process.argv.slice(2);

  console.log('Boltic SDK – Workflow Integration Tests');
  console.log(`Region: ${REGION} | Environment: ${ENVIRONMENT}`);
  console.log(`API Key: ${API_KEY.slice(0, 10)}...`);

  if (!testName || !TESTS[testName]) {
    console.log('\nAvailable tests:');
    console.log('  execute-only                                              Execute activity, return immediately');
    console.log('  get-by-id <execution_id>                                  Fetch execution result by ID');
    console.log('  execute-poll                                              Execute activity and poll for result');
    console.log('  get-integrations                                          Fetch integrations list');
    console.log('  get-credentials <entity>                                  Fetch credentials for an integration');
    console.log('  get-integration-resource <slug>                           Fetch resource/operation schema');
    console.log('  get-integration-form <slug> <resource> <operation> <secret> Fetch form fields schema');
    console.log('  all                                                       Run all tests sequentially');
    if (testName) {
      console.error(`\nUnknown test: "${testName}"`);
    }
    process.exit(testName ? 1 : 0);
  }

  await TESTS[testName](...rest);
  separator('Done');
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
