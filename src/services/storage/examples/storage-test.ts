/**
 * Panel storage examples (TypeScript, uses source SDK via `npx tsx`).
 *
 * Individual commands:
 *   npx tsx src/services/storage/examples/storage-test.ts help
 *   npx tsx src/services/storage/examples/storage-test.ts list [basePath]
 *   npx tsx src/services/storage/examples/storage-test.ts createFolder [folderPath]
 *   npx tsx src/services/storage/examples/storage-test.ts upload
 *   npx tsx src/services/storage/examples/storage-test.ts uploadTemp
 *   npx tsx src/services/storage/examples/storage-test.ts uploadCdn
 *   npx tsx src/services/storage/examples/storage-test.ts makePublic <fullPath>
 *   npx tsx src/services/storage/examples/storage-test.ts makePrivate <fullPath>
 *   npx tsx src/services/storage/examples/storage-test.ts download <fullPath> [outPath]
 *   npx tsx src/services/storage/examples/storage-test.ts delete <fullPath>
 *
 * Run everything (folder → 3 upload modes → list → downloads → ACL → delete → list):
 *   npx tsx src/services/storage/examples/storage-test.ts all
 *   npx tsx src/services/storage/examples/storage-test.ts full
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
import { createClient, type Environment, type Region } from '../../../index';
import * as dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SDK_ROOT = resolve(__dirname, '../../..', '..');

dotenv.config({ path: resolve(SDK_ROOT, '.env') });

const API_KEY = process.env.BOLTIC_API_KEY || '';
const REGION = (process.env.BOLTIC_REGION || 'asia-south1') as Region;
const ENVIRONMENT = (process.env.BOLTIC_ENVIRONMENT || 'local') as Environment;

/** Signed URL TTL for uploadTemp / full scenario (minutes); SDK clamps to 7 days max. */
const TEMP_UPLOAD_EXPIRE_MINUTES = 120;

function getClient(debug = true) {
  return createClient(API_KEY, {
    region: REGION,
    environment: ENVIRONMENT,
    debug,
  });
}

function separator(title: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(60)}\n`);
}

function normalizeFolderPrefix(p: string): string {
  if (!p) return '';
  return p.endsWith('/') ? p : `${p}/`;
}

function makeBlob(label: string): Blob {
  const body = Buffer.from(`${label} ${new Date().toISOString()}`);
  return new Blob([body], { type: 'text/plain' });
}

/** Storage responses use `{ error }` — not the same as DB `ApiResponse` guard. */
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

// ---------------------------------------------------------------------------
// Step runners (used by CLI and by `all`)
// ---------------------------------------------------------------------------

async function runList(basePath = ''): Promise<void> {
  const client = getClient();
  const result = await client.storage.list(
    basePath ? { basePath } : { basePath: '' }
  );
  if (isErr(result)) {
    console.error('list error:', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('list ok:', JSON.stringify(result, null, 2));
}

async function runCreateFolder(folderPath: string): Promise<void> {
  const client = getClient();
  const result = await client.storage.createFolder({ folder_path: folderPath });
  if (isErr(result)) {
    console.error('createFolder error:', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('createFolder ok:', JSON.stringify(result, null, 2));
}

async function runUploadPrivate(filepathPrefix: string): Promise<string> {
  const client = getClient();
  const result = await client.storage.upload({
    file: makeBlob('private'),
    filename: `private-${Date.now()}.txt`,
    filepath: filepathPrefix,
  });
  if (isErr(result)) {
    console.error('upload error:', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('upload ok:', JSON.stringify(result, null, 2));
  const path = result.path;
  if (!path) {
    console.error('upload response missing `path`');
    process.exit(1);
  }
  return path;
}

async function runUploadTemp(filepathPrefix: string): Promise<string> {
  const client = getClient();
  const result = await client.storage.upload({
    file: makeBlob('temporary'),
    filename: `temp-${Date.now()}.txt`,
    filepath: filepathPrefix,
    public: true,
    expire_in: TEMP_UPLOAD_EXPIRE_MINUTES,
  });
  if (isErr(result)) {
    console.error('upload (temp) error:', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('upload (temp) ok:', JSON.stringify(result, null, 2));
  const path = result.path;
  if (!path) {
    console.error('upload response missing `path`');
    process.exit(1);
  }
  return path;
}

async function runUploadCdn(filepathPrefix: string): Promise<string> {
  const client = getClient();
  const result = await client.storage.upload({
    file: makeBlob('public-cdn'),
    filename: `cdn-${Date.now()}.txt`,
    filepath: filepathPrefix,
    public: true,
  });
  if (isErr(result)) {
    console.error('upload (cdn) error:', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('upload (cdn) ok:', JSON.stringify(result, null, 2));
  const path = result.path;
  if (!path) {
    console.error('upload response missing `path`');
    process.exit(1);
  }
  return path;
}

async function runMakePublic(filePath: string): Promise<void> {
  const client = getClient();
  const result = await client.storage.makePublic(filePath);
  if (isErr(result)) {
    console.error('makePublic error:', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log(
    'makePublic ok:',
    JSON.stringify(result, null, 2)
  );
}

async function runMakePrivate(filePath: string): Promise<void> {
  const client = getClient();
  const result = await client.storage.makePrivate(filePath);
  if (isErr(result)) {
    console.error('makePrivate error:', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log(
    'makePrivate ok:',
    JSON.stringify(result, null, 2)
  );
}

async function runDownload(fileName: string, outPath?: string): Promise<void> {
  const client = getClient();
  const result = await client.storage.downloadFile({ file_name: fileName });
  if (isErr(result)) {
    console.error('downloadFile error:', JSON.stringify(result, null, 2));
    process.exit(1);
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

async function runDelete(filename: string): Promise<void> {
  const client = getClient();
  const result = await client.storage.deleteFile({ filename });
  if (isErr(result)) {
    console.error('deleteFile error:', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('deleteFile ok:', JSON.stringify(result, null, 2));
}

// ---------------------------------------------------------------------------
// Full scenario (same idea as scripts/test-module-boltic-storage.mjs full)
// ---------------------------------------------------------------------------

async function runAll(): Promise<void> {
  const folder = `sdk-smoke-${Date.now()}`;
  const listBase = normalizeFolderPrefix(folder);

  separator('1. createFolder');
  await runCreateFolder(folder);

  separator('2. list (after folder create)');
  await runList(listBase);

  separator('3. upload private');
  const pathPrivate = await runUploadPrivate(folder);

  separator('4. upload temporary (public + expire_in)');
  const pathTemp = await runUploadTemp(folder);

  separator('5. upload public CDN (public, no expire_in)');
  const pathCdn = await runUploadCdn(folder);

  separator('6. list files in folder');
  await runList(listBase);

  separator('7. download — private object');
  await runDownload(pathPrivate);

  separator('8. download — temp-link object');
  await runDownload(pathTemp);

  separator('9. download — CDN public object');
  await runDownload(pathCdn);

  separator('10. makePrivate — CDN object');
  await runMakePrivate(pathCdn);

  separator('11. makePublic — private object');
  await runMakePublic(pathPrivate);

  separator('12. download — after ACL changes');
  await runDownload(pathPrivate);

  separator('13. delete files');
  await runDelete(pathPrivate);
  await runDelete(pathTemp);
  await runDelete(pathCdn);

  separator('14. list after delete');
  await runList(listBase);

  console.log('\nall / full: finished.\n');
}

// ---------------------------------------------------------------------------
// CLI — individual commands use argv; default prefix for one-off uploads
// ---------------------------------------------------------------------------

const CLI_PREFIX = `sdk-example-${Date.now()}`;

function printHelp(): void {
  console.log(`
Usage: npx tsx src/services/storage/examples/storage-test.ts <command> [args]

Commands:
  help              Show this help
  all | full        Run full scenario (createFolder, uploads, list, download, ACL, delete)
  list [basePath]   storage.list
  createFolder [path]   storage.createFolder (default: sdk-example-<timestamp>)
  upload            Private upload under sdk-example-<timestamp>/
  uploadTemp        Temporary public link upload
  uploadCdn         Permanent public CDN upload
  makePublic <path>     storage.makePublic
  makePrivate <path>    storage.makePrivate
  download <path> [out] storage.downloadFile (default save: scripts/.storage-downloads/)
  delete <path>         storage.deleteFile

Requires BOLTIC_API_KEY (e.g. in .env at boltic-sdk root).
`);
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);

  if (!API_KEY) {
    console.error('Set BOLTIC_API_KEY');
    process.exit(1);
  }

  if (!command || command === 'help' || command === '-h' || command === '--help') {
    printHelp();
    return;
  }

  if (command === 'all' || command === 'full') {
    await runAll();
    return;
  }

  switch (command) {
    case 'list':
      await runList(args[0] ?? '');
      break;
    case 'createFolder':
      await runCreateFolder(args[0] ?? `sdk-example-${Date.now()}`);
      break;
    case 'upload':
      await runUploadPrivate(CLI_PREFIX);
      break;
    case 'uploadTemp':
      await runUploadTemp(CLI_PREFIX);
      break;
    case 'uploadCdn':
      await runUploadCdn(CLI_PREFIX);
      break;
    case 'makePublic':
      await runMakePublic(requireArg('fullPath'));
      break;
    case 'makePrivate':
      await runMakePrivate(requireArg('fullPath'));
      break;
    case 'download': {
      const path = requireArg('fullPath');
      await runDownload(path, args[1]);
      break;
    }
    case 'delete':
      await runDelete(requireArg('fullPath'));
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
