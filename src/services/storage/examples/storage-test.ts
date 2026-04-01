/**
 * Panel storage examples (TypeScript, uses source SDK via `npx tsx`).
 *
 *   npx tsx src/services/storage/examples/storage-test.ts list [basePath]
 *   npx tsx src/services/storage/examples/storage-test.ts upload
 *   npx tsx src/services/storage/examples/storage-test.ts uploadTemp
 *   npx tsx src/services/storage/examples/storage-test.ts uploadCdn
 *   npx tsx src/services/storage/examples/storage-test.ts makePublic <fullPath>
 *   npx tsx src/services/storage/examples/storage-test.ts makePrivate <fullPath>
 *   npx tsx src/services/storage/examples/storage-test.ts download <fullPath> [outPath]
 *   npx tsx src/services/storage/examples/storage-test.ts delete <fullPath>
 *
 * List rows are normalized to: name, path, folderName, parentPath, isDirectory,
 * isPublic, cdnUrl, fullPath, size, updatedAt.
 *
 * Requires: BOLTIC_API_KEY
 * Optional: BOLTIC_REGION, BOLTIC_ENVIRONMENT (default asia-south1 / local)
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
  createClient,
  type Environment,
  type Region,
} from '../../../index';
import * as dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SDK_ROOT = resolve(__dirname, '../../..', '..');

dotenv.config({ path: resolve(SDK_ROOT, '.env') });

const API_KEY = process.env.BOLTIC_API_KEY || '';
const REGION = (process.env.BOLTIC_REGION || 'asia-south1') as Region;
const ENVIRONMENT = (process.env.BOLTIC_ENVIRONMENT || 'local') as Environment;

const PREFIX = `sdk-example-${Date.now()}`;

function getClient(debug = true) {
  return createClient(API_KEY, {
    region: REGION,
    environment: ENVIRONMENT,
    debug,
  });
}

function isErr(x: unknown): x is { error: { message?: string } } {
  return (
    typeof x === 'object' &&
    x !== null &&
    'error' in x &&
    typeof (x as { error?: unknown }).error === 'object'
  );
}

function requireArg(name: string, idx = 3): string {
  const v = process.argv[idx];
  if (!v) {
    console.error(`Missing argument: ${name}`);
    process.exit(1);
  }
  return v;
}

async function testList() {
  const client = getClient();
  const basePath = process.argv[3] ?? '';
  const result = await client.storage.list(
    basePath ? { basePath } : { basePath: '' }
  );
  if (isErr(result)) {
    console.error('list error:', JSON.stringify(result, null, 2));
    return;
  }
  console.log('list ok:', JSON.stringify(result, null, 2));
}

async function testUpload() {
  const client = getClient();
  const body = Buffer.from('hello from boltic-sdk direct upload');
  const blob = new Blob([body], { type: 'text/plain' });
  const result = await client.storage.upload({
    file: blob,
    filename: `sdk-smoke-${Date.now()}.txt`,
    filepath: PREFIX,
  });
  if (isErr(result)) {
    console.error('upload error:', JSON.stringify(result, null, 2));
    return;
  }
  console.log('upload ok:', JSON.stringify(result, null, 2));
}

/** Temp signed URL on upload — `temporary_sharable_link` (wire `shareable_link` mapped by SDK). */
async function testUploadTemp() {
  const client = getClient();
  const body = Buffer.from('temporary public');
  const blob = new Blob([body], { type: 'text/plain' });
  const result = await client.storage.upload({
    file: blob,
    filename: `temp-${Date.now()}.txt`,
    filepath: PREFIX,
    public: true,
    expire_in: 120,
  });
  if (isErr(result)) {
    console.error('upload (temp) error:', JSON.stringify(result, null, 2));
    return;
  }
  console.log('upload (temp) ok:', JSON.stringify(result, null, 2));
}

async function testUploadCdn() {
  const client = getClient();
  const body = Buffer.from('permanent public cdn');
  const blob = new Blob([body], { type: 'text/plain' });
  const result = await client.storage.upload({
    file: blob,
    filename: `cdn-${Date.now()}.txt`,
    filepath: PREFIX,
    public: true,
  });
  if (isErr(result)) {
    console.error('upload (cdn) error:', JSON.stringify(result, null, 2));
    return;
  }
  console.log('upload (cdn) ok:', JSON.stringify(result, null, 2));
}

async function testMakePublic() {
  const client = getClient();
  const path = requireArg('fullPath');
  const result = await client.storage.makePublic(path);
  if (isErr(result)) {
    console.error('makePublic error:', JSON.stringify(result, null, 2));
    return;
  }
  console.log(
    'makePublic ok (name, size, updated, public):',
    JSON.stringify(result, null, 2)
  );
}

async function testMakePrivate() {
  const client = getClient();
  const path = requireArg('fullPath');
  const result = await client.storage.makePrivate(path);
  if (isErr(result)) {
    console.error('makePrivate error:', JSON.stringify(result, null, 2));
    return;
  }
  console.log(
    'makePrivate ok (name, size, updated, public):',
    JSON.stringify(result, null, 2)
  );
}

async function testDownload() {
  const client = getClient();
  const fileName = requireArg('fullPath');
  const outPath = process.argv[4];
  const result = await client.storage.downloadFile({ file_name: fileName });
  if (isErr(result)) {
    console.error('downloadFile error:', JSON.stringify(result, null, 2));
    return;
  }
  const n = result.bytes.byteLength;
  const defaultDir = join(SDK_ROOT, 'scripts', '.storage-downloads');
  const target =
    outPath ||
    join(
      defaultDir,
      `${Date.now()}-${fileName.split('/').pop() || 'download.bin'}`
    );
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, Buffer.from(result.bytes));
  console.log('downloadFile ok:', {
    status: result.status,
    contentType: result.contentType,
    byteLength: n,
    savedTo: target,
  });
}

async function testDelete() {
  const client = getClient();
  const filename = requireArg('fullPath');
  const result = await client.storage.deleteFile({ filename });
  if (isErr(result)) {
    console.error('deleteFile error:', JSON.stringify(result, null, 2));
    return;
  }
  console.log('deleteFile ok:', JSON.stringify(result, null, 2));
}

async function main() {
  const cmd = process.argv[2] || 'list';
  if (!API_KEY) {
    console.error('Set BOLTIC_API_KEY');
    process.exit(1);
  }
  switch (cmd) {
    case 'list':
      await testList();
      break;
    case 'upload':
      await testUpload();
      break;
    case 'uploadTemp':
      await testUploadTemp();
      break;
    case 'uploadCdn':
      await testUploadCdn();
      break;
    case 'makePublic':
      await testMakePublic();
      break;
    case 'makePrivate':
      await testMakePrivate();
      break;
    case 'download':
      await testDownload();
      break;
    case 'delete':
      await testDelete();
      break;
    default:
      console.error('Unknown command:', cmd);
      process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
