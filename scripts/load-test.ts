import { createClient } from '@boltic/sdk';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';

dotenv.config();

interface CliArgs {
  apiKey: string;
  environment: 'local' | 'sit' | 'uat' | 'prod';
  region: 'asia-south1' | 'us-central1';
  tableName: string;
  rowCount: number;
  batchSize: number;
  noValidation: boolean;
  debug: boolean;
  createTable: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const argMap: Record<string, string | boolean> = {};
  for (const arg of args) {
    const [key, value] = arg.includes('=') ? arg.split('=') : [arg, 'true'];
    argMap[key.replace(/^--/, '')] = value;
  }

  const apiKey = (argMap.apiKey as string) || process.env.BOLTIC_API_KEY || '';
  if (!apiKey) {
    throw new Error('Missing API key. Pass --apiKey= or set BOLTIC_API_KEY');
  }

  const tableName = (argMap.table as string) || process.env.BOLTIC_TABLE;
  ('');
  const rowCount = Number(argMap.rows || process.env.ROWS);
  const batchSize = Number(argMap.batch || process.env.BATCH);
  const noValidation =
    String(argMap.noValidation || process.env.NO_VALIDATION || 'false') ===
    'true';
  const region = ((argMap.region as string) ||
    process.env.BOLTIC_REGION ||
    'asia-south1') as 'asia-south1' | 'us-central1';
  const debug = String(argMap.debug || process.env.DEBUG || 'false') === 'true';
  const environment = ((argMap.environment as string) ||
    process.env.BOLTIC_ENVIRONMENT ||
    'prod') as 'local' | 'sit' | 'uat' | 'prod';
  const createTable =
    String(argMap.createTable || process.env.CREATE_TABLE || 'false') ===
    'true';

  return {
    apiKey,
    environment,
    region,
    tableName,
    rowCount,
    batchSize,
    noValidation,
    debug,
    createTable,
  };
}

type LoadTestRecord = Record<string, unknown>;

function generateSparseVector(dim: number): string {
  // Create a few random index:value pairs within dimension
  const numNonZero = Math.max(1, Math.floor(dim * 0.005)); // 0.5% density
  const used = new Set<number>();
  const parts: string[] = [];
  while (parts.length < numNonZero) {
    const idx = faker.number.int({ min: 1, max: dim });
    if (used.has(idx)) continue;
    used.add(idx);
    const val = faker.number.float({ min: 0, max: 3, fractionDigits: 3 });
    parts.push(`${idx}:${val}`);
  }
  return `{${parts.join(',')}}/${dim}`;
}

function generateRecord(): LoadTestRecord {
  const randomVecLen = faker.number.int({ min: 64, max: 64 });
  return {
    // Required columns per user request
    'text-column-1': faker.lorem.words({ min: 2, max: 6 }),
    'long-text-column-1': faker.lorem.paragraphs({ min: 1, max: 3 }),
    'date-time-column-1': new Date().toISOString(),
    'number-column-1': faker.number.float({
      min: 0,
      max: 100000,
      fractionDigits: 2,
    }),
    'currency-column-1': faker.number.float({
      min: 0,
      max: 100000,
      fractionDigits: 2,
    }),
    'checkbox-column-1': faker.datatype.boolean(),
    'dropdown-column-1': faker.helpers.arrayElement([
      'Pending',
      'In Progress',
      'Completed',
    ]),
    'email-column-1': faker.internet.email(),
    'phone-number-column-1': `+91 ${faker.string.numeric(10)}`,
    'link-column-1': faker.internet.url(),
    'json-column-1': {
      trace_id: faker.string.uuid(),
      meta: { source: 'load-test', ts: Date.now() },
    },
    'vector-column-1': Array.from({ length: randomVecLen }, () =>
      faker.number.float({ min: -1, max: 1, fractionDigits: 4 })
    ),
    'half-vector-column-1': Array.from({ length: 1536 }, () =>
      Number(
        faker.number.float({ min: -1, max: 1, fractionDigits: 3 }).toFixed(3)
      )
    ),
    'sparse-vector-column-1': generateSparseVector(512),
  };
}

async function createTableWithColumns(
  client: ReturnType<typeof createClient>,
  tableName: string
): Promise<void> {
  console.log(`Creating table "${tableName}" with columns...`);

  const tableResult = await client.tables.create({
    name: tableName,
    description: 'Load testing table with all column types',
    fields: [
      {
        name: 'text-column-1',
        type: 'text',
        description: 'Text column for load testing',
      },
      {
        name: 'long-text-column-1',
        type: 'long-text',
        description: 'Long text column for load testing',
      },
      {
        name: 'date-time-column-1',
        type: 'date-time',
        description: 'Date time column for load testing',
      },
      {
        name: 'number-column-1',
        type: 'number',
        decimals: '0.00',
        description: 'Number column for load testing',
      },
      {
        name: 'currency-column-1',
        type: 'currency',
        currency_format: 'USD',
        decimals: '0.00',
        description: 'Currency column for load testing',
      },
      {
        name: 'checkbox-column-1',
        type: 'checkbox',
        description: 'Checkbox column for load testing',
      },
      {
        name: 'dropdown-column-1',
        type: 'dropdown',
        selectable_items: ['Pending', 'In Progress', 'Completed'],
        multiple_selections: false,
        description: 'Dropdown column for load testing',
      },
      {
        name: 'email-column-1',
        type: 'email',
        description: 'Email column for load testing',
      },
      {
        name: 'phone-number-column-1',
        type: 'phone-number',
        phone_format: '+91 123 456 7890',
        description: 'Phone number column for load testing',
      },
      {
        name: 'link-column-1',
        type: 'link',
        description: 'Link column for load testing',
      },
      {
        name: 'json-column-1',
        type: 'json',
        description: 'JSON column for load testing',
      },
      {
        name: 'vector-column-1',
        type: 'vector',
        vector_dimension: 64, // Max dimension to accommodate variable length vectors (8-64)
        description: 'Vector column for load testing',
      },
      {
        name: 'half-vector-column-1',
        type: 'halfvec',
        vector_dimension: 1536,
        description: 'Half vector column for load testing',
      },
      {
        name: 'sparse-vector-column-1',
        type: 'sparsevec',
        vector_dimension: 512,
        description: 'Sparse vector column for load testing',
      },
    ],
  });

  if (tableResult.error) {
    throw new Error(
      `Failed to create table: ${tableResult.error.message || 'Unknown error'}`
    );
  }

  console.log(`✅ Table "${tableName}" created successfully`);
}

async function run(): Promise<void> {
  const args = parseArgs();
  const client = createClient(args.apiKey, {
    region: args.region,
    debug: args.debug,
    // Allow overriding environment for non-prod testing if desired
    environment: args.environment,
  });

  if (args.createTable) {
    await createTableWithColumns(client, args.tableName);
  }

  console.log(
    `Starting load test: table=${args.tableName}, rows=${args.rowCount}, batch=${args.batchSize}, validation=${!args.noValidation}`
  );

  let inserted = 0;
  let batchNo = 0;
  const totalBatches = Math.ceil(args.rowCount / args.batchSize);
  const startedAt = Date.now();
  while (inserted < args.rowCount) {
    const remaining = args.rowCount - inserted;
    const size = Math.min(args.batchSize, remaining);
    const batch = Array.from({ length: size }, () => generateRecord());

    const res = await client.records.insertMany(args.tableName, batch, {
      validation: !args.noValidation,
    });

    if (res.error) {
      console.error('Batch insert failed:', res.error);
      break;
    }

    inserted += res.data?.insert_count || size;
    batchNo += 1;
    console.log(
      `Batch ${batchNo}/${totalBatches}: inserted ${size} (total ${inserted}/${args.rowCount}).`
    );
  }

  const durationSec = (Date.now() - startedAt) / 1000;
  const rps = inserted / Math.max(1, durationSec);
  console.log(
    `Done. Inserted=${inserted}, duration=${durationSec.toFixed(
      2
    )}s, avgRPS=${rps.toFixed(2)}`
  );
}

run().catch((err) => {
  console.error('Load test failed with error:', err);
  process.exit(1);
});
