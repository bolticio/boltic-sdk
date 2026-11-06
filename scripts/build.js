const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const packageJson = require(path.join(root, 'package.json'));
const distPath = path.join(root, 'dist');

// Never report a successful build when an advertised entry point is missing.
for (const file of ['sdk.js', 'sdk.mjs', 'types/index.d.ts']) {
  assert.ok(fs.statSync(path.join(distPath, file)).isFile(), `Missing ${file}`);
}

const distPackageJson = {
  name: packageJson.name,
  version: packageJson.version,
  license: packageJson.license,
  engines: packageJson.engines,
  main: './sdk.js',
  module: './sdk.mjs',
  types: './types/index.d.ts',
  exports: {
    '.': {
      types: './types/index.d.ts',
      import: './sdk.mjs',
      require: './sdk.js',
    },
  },
  sideEffects: false,
};
fs.writeFileSync(
  path.join(distPath, 'package.json'),
  JSON.stringify(distPackageJson, null, 2) + '\n'
);

// Rebuild on every run: a previous ignored dist directory must not enter a release.
const databasesPath = path.join(root, 'src', 'services', 'databases');
const databasesDistPath = path.join(databasesPath, 'dist');
fs.rmSync(databasesDistPath, { recursive: true, force: true });
execFileSync(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['run', 'build'],
  {
    cwd: databasesPath,
    stdio: 'inherit',
  }
);
for (const file of ['index.js', 'index.mjs', 'index.d.ts']) {
  assert.ok(
    fs.statSync(path.join(databasesDistPath, file)).isFile(),
    `Missing database build output ${file}`
  );
}
const bundledDatabasesPath = path.join(distPath, 'databases');
fs.rmSync(bundledDatabasesPath, { recursive: true, force: true });
fs.cpSync(databasesDistPath, bundledDatabasesPath, { recursive: true });
console.log(
  `Built ${packageJson.name}@${packageJson.version} with current database artifacts`
);
