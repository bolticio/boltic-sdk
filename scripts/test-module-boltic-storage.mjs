#!/usr/bin/env node
/**
 * Smoke-test storage against a local API using the **built** SDK (`dist/sdk.mjs`).
 *
 * Scenarios:
 *   - Upload private (omit `public` or `public: false`)
 *   - Upload temporary signed URL (`public: true` + `expire_in` minutes)
 *   - Upload permanent public CDN (`public: true` without `expire_in`)
 *   - makePrivate / makePublic
 *   - createFolder, deleteFile, list
 *   - downloadFile (POST /file-export — actual file bytes)
 *
 * Prerequisites:
 *   1. `npm run build` (produces dist/)
 *   2. API reachable at REGION_BASE_HOSTS + `SERVICE_PATHS.STORAGE`
 *   3. `.env` or env: BOLTIC_API_KEY
 *
 * Run **everything** in one go (full matrix):
 *   npm run test:module:storage -- full
 *   npm run test:module:storage -- all
 *   node scripts/test-module-boltic-storage.mjs full
 *
 * Usage (single commands):
 *   node scripts/test-module-boltic-storage.mjs help
 *   node scripts/test-module-boltic-storage.mjs list [basePath]
 *   node scripts/test-module-boltic-storage.mjs createFolder [folder_path]
 *   node scripts/test-module-boltic-storage.mjs uploadPrivate [prefix]
 *   node scripts/test-module-boltic-storage.mjs uploadTemporary [prefix]
 *   node scripts/test-module-boltic-storage.mjs uploadPublicCdn [prefix]
 *   node scripts/test-module-boltic-storage.mjs upload [prefix]   (alias: uploadPrivate)
 *   node scripts/test-module-boltic-storage.mjs deleteFile <filename>
 *   node scripts/test-module-boltic-storage.mjs makePublic <file_path>
 *   node scripts/test-module-boltic-storage.mjs makePrivate <file_path>
 *   node scripts/test-module-boltic-storage.mjs downloadFile <file_name> [out_path]
 *
 *   Prerequisite: `npm run build` so dist/sdk.mjs exists.
 *
 * Env:
 *   BOLTIC_ENVIRONMENT=local (default)
 *   BOLTIC_REGION=asia-south1 | us-central1
 */

import { config } from 'dotenv';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

/** Default folder for saved downloads (gitignored). Override with `downloadFile` 2nd arg. */
const DEFAULT_DOWNLOAD_DIR = join(root, 'scripts', '.storage-downloads');

config({ path: join(root, '.env') });

const distMjs = join(root, 'dist', 'sdk.mjs');
if (!existsSync(distMjs)) {
  console.error('Missing dist/sdk.mjs — run: npm run build');
  process.exit(1);
}

const { createClient } = await import(new URL('../dist/sdk.mjs', import.meta.url));

const API_KEY = process.env.BOLTIC_API_KEY || '';
const REGION = process.env.BOLTIC_REGION || 'asia-south1';
const ENVIRONMENT = process.env.BOLTIC_ENVIRONMENT || 'local';

/** Signed URL TTL for uploadTemporary (minutes); SDK clamps to 7 days max. */
const TEMP_UPLOAD_EXPIRE_MINUTES = 120;

function getClient() {
  return createClient(API_KEY, {
    region: REGION,
    environment: ENVIRONMENT,
    debug: true,
  });
}

function isErr(x) {
  return (
    typeof x === 'object' &&
    x !== null &&
    'error' in x &&
    typeof x.error === 'object'
  );
}

function ok(label, result) {
  if (isErr(result)) {
    console.error(`${label} error:`, JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log(`${label} ok:`, JSON.stringify(result, null, 2));
}

function requireArg(name, idx = 3) {
  const v = process.argv[idx];
  if (!v) {
    console.error(`Missing argument: ${name} (argv[${idx}])`);
    process.exit(1);
  }
  return v;
}

function normalizeFolderPrefix(p) {
  if (!p) return '';
  return p.endsWith('/') ? p : `${p}/`;
}

function makeBlob(label) {
  const body = Buffer.from(`${label} ${new Date().toISOString()}`);
  return new Blob([body], { type: 'text/plain' });
}

async function testList(basePath = '') {
  const client = getClient();
  const result = await client.storage.list(
    basePath ? { basePath } : { basePath: '' }
  );
  ok('list', result);
}

async function testCreateFolder(folderPath) {
  const client = getClient();
  const result = await client.storage.createFolder({ folder_path: folderPath });
  ok('createFolder', result);
}

/**
 * @param {string} filepathPrefix
 * @returns {Promise<string>} object path (`path`)
 */
async function testUploadPrivate(filepathPrefix) {
  const client = getClient();
  const blob = makeBlob('private');
  const result = await client.storage.upload({
    file: blob,
    filename: `private-${Date.now()}.txt`,
    filepath: filepathPrefix,
  });
  if (isErr(result)) {
    console.error('upload (private) error:', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('upload (private) ok:', JSON.stringify(result, null, 2));
  const path = result.path;
  if (!path) {
    console.error('upload response missing `path`');
    process.exit(1);
  }
  return path;
}

/**
 * Temporary signed read URL on upload (`temporary_sharable_link` in response when supported).
 */
async function testUploadTemporary(filepathPrefix) {
  const client = getClient();
  const blob = makeBlob('temporary');
  const result = await client.storage.upload({
    file: blob,
    filename: `temp-${Date.now()}.txt`,
    filepath: filepathPrefix,
    public: true,
    expire_in: TEMP_UPLOAD_EXPIRE_MINUTES,
  });
  if (isErr(result)) {
    console.error('upload (temporary link) error:', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('upload (temporary link) ok:', JSON.stringify(result, null, 2));
  const path = result.path;
  if (!path) {
    console.error('upload response missing `path`');
    process.exit(1);
  }
  return path;
}

/**
 * Permanent public object + CDN-style URL when API supports `public_url`.
 */
async function testUploadPublicCdn(filepathPrefix) {
  const client = getClient();
  const blob = makeBlob('public-cdn');
  const result = await client.storage.upload({
    file: blob,
    filename: `cdn-${Date.now()}.txt`,
    filepath: filepathPrefix,
    public: true,
  });
  if (isErr(result)) {
    console.error('upload (public CDN) error:', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('upload (public CDN) ok:', JSON.stringify(result, null, 2));
  const path = result.path;
  if (!path) {
    console.error('upload response missing `path`');
    process.exit(1);
  }
  return path;
}

async function testDeleteFile(filename) {
  const client = getClient();
  const result = await client.storage.deleteFile({ filename });
  ok('deleteFile', result);
}

async function testMakePublic(filePath) {
  const client = getClient();
  const result = await client.storage.makePublic(filePath);
  ok('makePublic', result);
}

async function testMakePrivate(filePath) {
  const client = getClient();
  const result = await client.storage.makePrivate(filePath);
  ok('makePrivate', result);
}

/**
 * @param {ArrayBuffer} bytes
 * @param {string} remoteFileName
 * @param {string} [explicitOutPath] — absolute or cwd-relative file path
 * @returns {string} path written
 */
function saveDownloadedFile(bytes, remoteFileName, explicitOutPath) {
  const buf = Buffer.from(bytes);
  if (explicitOutPath) {
    const dir = dirname(explicitOutPath);
    mkdirSync(dir, { recursive: true });
    writeFileSync(explicitOutPath, buf);
    return explicitOutPath;
  }
  mkdirSync(DEFAULT_DOWNLOAD_DIR, { recursive: true });
  const base =
    remoteFileName.split('/').filter(Boolean).pop() || 'download.bin';
  const outPath = join(DEFAULT_DOWNLOAD_DIR, `${Date.now()}-${base}`);
  writeFileSync(outPath, buf);
  return outPath;
}

/**
 * @param {string} fileName — remote object path
 * @param {string} [outPath] — optional local file path (default: scripts/.storage-downloads/{timestamp}-{basename})
 */
async function testDownloadFile(fileName, outPath) {
  const client = getClient();
  const result = await client.storage.downloadFile({ file_name: fileName });
  if (isErr(result)) {
    console.error('downloadFile error:', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  const n = result.bytes.byteLength;
  const previewLen = Math.min(200, n);
  const preview = new TextDecoder().decode(result.bytes.slice(0, previewLen));
  const savedTo = saveDownloadedFile(result.bytes, fileName, outPath);
  console.log('downloadFile ok:', {
    status: result.status,
    contentType: result.contentType,
    byteLength: n,
    savedTo,
    previewUtf8: preview,
  });
}

/**
 * Full matrix: folder → uploads (private / temp / CDN) → list → downloadFile →
 * makePrivate(CDN) → makePublic(private) → downloadFile → delete → list.
 */
async function testFull() {
  const folder = `rashmi/sdk-smoke-${Date.now()}`;
  const listBase = normalizeFolderPrefix(folder);

  console.log('\n--- 1. createFolder ---\n');
  await testCreateFolder(folder);

  console.log('\n--- 2. list (after folder create) ---\n');
  await testList(listBase);

  console.log('\n--- 3. upload private ---\n');
  const pathPrivate = await testUploadPrivate(folder);

  console.log('\n--- 4. upload temporary signed link (public: true + expire_in) ---\n');
  const pathTemp = await testUploadTemporary(folder);

  console.log('\n--- 5. upload permanent public CDN (public: true, no expire_in) ---\n');
  const pathCdn = await testUploadPublicCdn(folder);

  console.log('\n--- 6. list files in folder ---\n');
  await testList(listBase);

  console.log('\n--- 7. downloadFile — private object ---\n');
  await testDownloadFile(pathPrivate);

  console.log('\n--- 8. downloadFile — temp-link object ---\n');
  await testDownloadFile(pathTemp);

  console.log('\n--- 9. downloadFile — CDN public object ---\n');
  await testDownloadFile(pathCdn);

  console.log('\n--- 10. makePrivate — object that was public CDN ---\n');
  await testMakePrivate(pathCdn);

  console.log('\n--- 11. makePublic — object that was private ---\n');
  await testMakePublic(pathPrivate);

  console.log('\n--- 12. downloadFile — after ACL changes ---\n');
  await testDownloadFile(pathPrivate);

  console.log('\n--- 13. delete files ---\n');
  await testDeleteFile(pathPrivate);
  await testDeleteFile(pathTemp);
  await testDeleteFile(pathCdn);

  console.log('\n--- 14. list after delete ---\n');
  await testList(listBase);

  console.log('\nfull: finished.\n');
}

function printHelp() {
  console.log(`
Usage: node scripts/test-module-boltic-storage.mjs <command> [args]

Commands:
  help                 Show this help
  full | all           Full scenario (folder, 3 upload modes, list, downloadFile,
                       makePrivate, makePublic, delete, list)
  list [basePath]      storage.list
  createFolder [path]  storage.createFolder — default: sdk-smoke-<ts>
  uploadPrivate [pfx]  Upload private object (default prefix: sdk-local-smoke)
  uploadTemporary [pfx] public: true + expire_in (temporary signed link)
  uploadPublicCdn [pfx] public: true without expire_in (permanent CDN URL)
  upload [pfx]          Alias for uploadPrivate
  deleteFile <path>     storage.deleteFile — full object path
  makePublic <path>     storage.makePublic
  makePrivate <path>    storage.makePrivate
  downloadFile <path> [out_path]
                        POST file-export — download bytes; saves under
                        scripts/.storage-downloads/ unless out_path is set

Requires BOLTIC_API_KEY (e.g. in .env).
`);
}

async function main() {
  const cmd = process.argv[2] || 'help';

  if (cmd === 'help' || cmd === '-h' || cmd === '--help') {
    printHelp();
    process.exit(0);
  }

  if (!API_KEY) {
    console.error('Set BOLTIC_API_KEY (e.g. in .env)');
    process.exit(1);
  }

  console.log(
    `Using built SDK from dist/ · env=${ENVIRONMENT} region=${REGION}\n`
  );

  const defaultPrefix = 'sdk-local-smoke';

  switch (cmd) {
    case 'list':
      await testList(process.argv[3] ?? '');
      break;
    case 'createFolder':
      await testCreateFolder(
        process.argv[3] ?? `sdk-local-smoke-${Date.now()}`
      );
      break;
    case 'upload':
    case 'uploadPrivate':
      await testUploadPrivate(process.argv[3] ?? defaultPrefix);
      break;
    case 'uploadTemporary':
      await testUploadTemporary(process.argv[3] ?? defaultPrefix);
      break;
    case 'uploadPublicCdn':
      await testUploadPublicCdn(process.argv[3] ?? defaultPrefix);
      break;
    case 'deleteFile':
      await testDeleteFile(requireArg('filename'));
      break;
    case 'makePublic':
      await testMakePublic(requireArg('file_path'));
      break;
    case 'makePrivate':
      await testMakePrivate(requireArg('file_path'));
      break;
    case 'downloadFile':
      await testDownloadFile(requireArg('file_name'), process.argv[4]);
      break;
    case 'all':
    case 'full':
      await testFull();
      break;
    default:
      console.error('Unknown command:', cmd);
      printHelp();
      process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
