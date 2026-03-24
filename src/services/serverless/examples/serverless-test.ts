/**
 * Serverless Integration Test Script
 *
 * Run a specific test by passing it as a CLI argument:
 *
 *   npx tsx src/services/serverless/examples/serverless-test.ts list
 *   npx tsx src/services/serverless/examples/serverless-test.ts get <app_id>
 *   npx tsx src/services/serverless/examples/serverless-test.ts create-code
 *   npx tsx src/services/serverless/examples/serverless-test.ts create-container
 *   npx tsx src/services/serverless/examples/serverless-test.ts update <app_id>
 *   npx tsx src/services/serverless/examples/serverless-test.ts get-builds <app_id>
 *   npx tsx src/services/serverless/examples/serverless-test.ts get-logs <app_id>
 *   npx tsx src/services/serverless/examples/serverless-test.ts get-build-logs <app_id> <build_id>
 *   npx tsx src/services/serverless/examples/serverless-test.ts poll-status <app_id>
 *   npx tsx src/services/serverless/examples/serverless-test.ts all
 *
 * Prerequisites:
 *   - Set BOLTIC_API_KEY environment variable (or edit the constant below)
 */

import * as dotenv from 'dotenv';
import { createClient } from '../../../index';
import { isErrorResponse } from '../../common';
import type { Environment } from '../src/types/serverless';

dotenv.config({ path: '.env' });

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const API_KEY = process.env.BOLTIC_API_KEY || '<YOUR_API_KEY>';
const REGION: 'asia-south1' | 'us-central1' = 'asia-south1';
const ENVIRONMENT = (process.env.BOLTIC_ENVIRONMENT || 'prod') as Environment;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function separator(title: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

function createBolticClient() {
  return createClient(API_KEY, {
    environment: ENVIRONMENT,
    region: REGION,
    debug: true,
  });
}

// ---------------------------------------------------------------------------
// Test functions
// ---------------------------------------------------------------------------

async function testList() {
  separator('LIST SERVERLESS FUNCTIONS');
  const client = createBolticClient();

  const result = await client.serverless.list({ limit: 10 });
  if (isErrorResponse(result)) {
    console.error('Error:', result.error);
    return;
  }
  console.log('Functions:', JSON.stringify(result, null, 2));
}

async function testGet(appId: string) {
  separator('GET SERVERLESS BY ID');
  const client = createBolticClient();

  const result = await client.serverless.get(appId);
  if (isErrorResponse(result)) {
    console.error('Error:', result.error);
    return;
  }
  console.log('Function:', JSON.stringify(result, null, 2));
}

async function testCreateCode() {
  separator('CREATE CODE SERVERLESS');
  const client = createBolticClient();

  const sampleCode = `
module.exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello from Boltic SDK!' }),
  };
};
`.trim();

  const result = await client.serverless.create({
    Name: 'sdk-test-code',
    Runtime: 'code',
    Env: {},
    PortMap: [],
    Scaling: {
      AutoStop: false,
      Min: 1,
      Max: 1,
      MaxIdleTime: 0,
    },
    Resources: {
      CPU: 0.1,
      MemoryMB: 128,
      MemoryMaxMB: 128,
    },
    CodeOpts: {
      Language: 'nodejs/20',
      Packages: [],
      Code: sampleCode,
    },
  });

  if (isErrorResponse(result)) {
    console.error('Error:', result.error);
    return;
  }
  console.log('Created:', JSON.stringify(result, null, 2));
}

async function testCreateContainer() {
  separator('CREATE CONTAINER SERVERLESS');
  const client = createBolticClient();

  const result = await client.serverless.create({
    Name: 'sdk-test-container',
    Runtime: 'container',
    Env: {},
    PortMap: [],
    Scaling: {
      AutoStop: false,
      Min: 1,
      Max: 1,
      MaxIdleTime: 300,
    },
    Resources: {
      CPU: 0.1,
      MemoryMB: 128,
      MemoryMaxMB: 128,
    },
    Timeout: 60,
    ContainerOpts: {
      Image: 'docker.io/library/nginx:latest',
      Args: [],
      Command: '',
    },
  });

  if (isErrorResponse(result)) {
    console.error('Error:', result.error);
    return;
  }
  console.log('Created:', JSON.stringify(result, null, 2));
}

async function testUpdate(appId: string) {
  separator('UPDATE SERVERLESS');
  const client = createBolticClient();

  const result = await client.serverless.update({
    appId,
    payload: {
      Scaling: {
        AutoStop: true,
        Min: 0,
        Max: 2,
        MaxIdleTime: 300,
      },
    },
  });

  if (isErrorResponse(result)) {
    console.error('Error:', result.error);
    return;
  }
  console.log('Updated:', JSON.stringify(result, null, 2));
}

async function testGetBuilds(appId: string) {
  separator('GET BUILDS');
  const client = createBolticClient();

  const result = await client.serverless.getBuilds({ appId, limit: 5 });
  if (isErrorResponse(result)) {
    console.error('Error:', result.error);
    return;
  }
  console.log('Builds:', JSON.stringify(result, null, 2));
}

async function testGetLogs(appId: string) {
  separator('GET LOGS');
  const client = createBolticClient();

  const result = await client.serverless.getLogs({
    appId,
    limit: 20,
    sortOrder: 'DESC',
  });
  if (isErrorResponse(result)) {
    console.error('Error:', result.error);
    return;
  }
  console.log('Logs:', JSON.stringify(result, null, 2));
}

async function testGetBuildLogs(appId: string, buildId: string) {
  separator('GET BUILD LOGS');
  const client = createBolticClient();

  const result = await client.serverless.getBuildLogs({ appId, buildId });
  if (isErrorResponse(result)) {
    console.error('Error:', result.error);
    return;
  }
  console.log('Build Logs:', JSON.stringify(result, null, 2));
}

async function testPollStatus(appId: string) {
  separator('POLL STATUS');
  const client = createBolticClient();

  const result = await client.serverless.pollStatus(appId, {
    intervalMs: 3000,
    maxAttempts: 20,
  });
  if (isErrorResponse(result)) {
    console.error('Error:', result.error);
    return;
  }
  console.log(
    'Final status:',
    result.data?.Status,
    JSON.stringify(result, null, 2)
  );
}

// ---------------------------------------------------------------------------
// CLI router
// ---------------------------------------------------------------------------

const COMMANDS: Record<string, (...args: string[]) => Promise<void>> = {
  list: testList,
  get: (appId: string) => testGet(appId),
  'create-code': testCreateCode,
  'create-container': testCreateContainer,
  update: (appId: string) => testUpdate(appId),
  'get-builds': (appId: string) => testGetBuilds(appId),
  'get-logs': (appId: string) => testGetLogs(appId),
  'get-build-logs': (appId: string, buildId: string) =>
    testGetBuildLogs(appId, buildId),
  'poll-status': (appId: string) => testPollStatus(appId),
};

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === 'help') {
    console.log('Available commands:');
    console.log(
      Object.keys(COMMANDS)
        .map((c) => `  ${c}`)
        .join('\n')
    );
    console.log('  all  (runs list + create-code)');
    return;
  }

  if (command === 'all') {
    await testList();
    await testCreateCode();
    return;
  }

  const handler = COMMANDS[command];
  if (!handler) {
    console.error(`Unknown command: ${command}`);
    console.log(
      'Available commands:',
      Object.keys(COMMANDS).join(', '),
      ', all'
    );
    process.exit(1);
  }

  await handler(...args);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
