const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
const dirs = ['dist/types'];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Copy and rename files to match package.json exports
const files = [
  { src: 'dist/sdk.js', dest: 'dist/sdk.js' },
  { src: 'dist/sdk.mjs', dest: 'dist/sdk.mjs' },
  { src: 'dist/types/index.d.ts', dest: 'dist/types/index.d.ts' },
];

files.forEach((file) => {
  if (fs.existsSync(file.src)) {
    // Ensure destination directory exists
    const destDir = path.dirname(file.dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.copyFileSync(file.src, file.dest);
    console.log(`Ensured ${file.dest} exists`);
  } else {
    console.warn(`Warning: Source file ${file.src} not found`);
  }
});

// Create package.json for dist directory to ensure proper module resolution
const distPackageJson = {
  name: '@boltic/sdk',
  version: '1.0.0',
  type: 'module',
  main: './sdk.js',
  module: './sdk.mjs',
  types: './types/index.d.ts',
  exports: {
    '.': {
      import: './sdk.mjs',
      require: './sdk.js',
      types: './types/index.d.ts',
    },
  },
  sideEffects: false,
};

fs.writeFileSync('dist/package.json', JSON.stringify(distPackageJson, null, 2));
console.log('Created dist/package.json for proper module resolution');

console.log('Build organization complete!');
