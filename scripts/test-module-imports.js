const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function main() {
  const root = path.resolve(__dirname, '..');
  const packageJson = require(path.join(root, 'package.json'));
  const distPackageJson = require(path.join(root, 'dist', 'package.json'));
  assert.equal(distPackageJson.name, packageJson.name);
  assert.equal(distPackageJson.version, packageJson.version);
  assert.deepEqual(distPackageJson.engines, packageJson.engines);
  assert.ok(fs.statSync(path.resolve(root, packageJson.types)).isFile());

  const originalFetch = globalThis.fetch;
  let networkCalls = 0;
  globalThis.fetch = async () => {
    networkCalls++;
    throw new Error('Module initialization must not perform network requests');
  };
  try {
    // Resolve the same root entry points consumers get through package exports.
    const entryPoints = packageJson.exports['.'];
    const formats = [
      ['CommonJS', require(path.resolve(root, entryPoints.require))],
      [
        'ESM',
        await import(
          pathToFileURL(path.resolve(root, entryPoints.import)).href
        ),
      ],
    ];
    for (const [format, sdk] of formats) {
      assert.equal(sdk.VERSION, packageJson.version);
      assert.equal(typeof sdk.createClient, 'function');
      assert.equal(typeof sdk.AuthManager, 'function');
      const client = sdk.createClient('offline-sdk-smoke-test-key', {
        environment: 'uat',
        region: 'asia-south1',
        debug: false,
      });
      assert.ok(client instanceof sdk.BolticClient);
      assert.equal(client.getVersion(), packageJson.version);
      assert.equal(client.getCurrentDatabase(), null);
      for (const resource of [
        'databases',
        'tables',
        'columns',
        'indexes',
        'records',
        'sql',
        'workflow',
        'serverless',
        'storage',
      ]) {
        assert.ok(client[resource], `Missing ${format} resource: ${resource}`);
      }
      assert.throws(() => sdk.createClient(''), /API key/);
      console.log(
        `${format}: imports, version metadata and client initialization passed`
      );
    }
    assert.equal(networkCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
