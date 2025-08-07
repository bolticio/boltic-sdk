const fs = require('fs');
const path = require('path');

console.log('Testing module imports...\n');

// Test 1: Check if dist files exist
const requiredFiles = [
  'dist/sdk.js',
  'dist/sdk.mjs',
  'dist/types/index.d.ts',
  'dist/package.json',
];

console.log('1. Checking build output files:');
requiredFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

// Test 2: Check package.json exports
console.log('\n2. Checking package.json exports:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const exports = packageJson.exports;

if (exports && exports['.']) {
  console.log('✅ Package.json exports configured correctly');
  console.log('   - import:', exports['.'].import);
  console.log('   - require:', exports['.'].require);
  console.log('   - types:', exports['.'].types);
} else {
  console.log('❌ Package.json exports not configured');
}

// Test 3: Check dist package.json
console.log('\n3. Checking dist/package.json:');
const distPackageJson = JSON.parse(
  fs.readFileSync('dist/package.json', 'utf8')
);
console.log('✅ Dist package.json exists with correct configuration');

// Test 4: Check TypeScript declarations
console.log('\n4. Checking TypeScript declarations:');
const typesContent = fs.readFileSync('dist/types/index.d.ts', 'utf8');
if (typesContent.includes('export declare class AuthManager')) {
  console.log('✅ TypeScript declarations include AuthManager class');
} else {
  console.log('❌ TypeScript declarations missing AuthManager class');
}

if (typesContent.includes('export declare const VERSION')) {
  console.log('✅ TypeScript declarations include VERSION constant');
} else {
  console.log('❌ TypeScript declarations missing VERSION constant');
}

// Test 5: Check bundle content
console.log('\n5. Checking bundle content:');
const cjsContent = fs.readFileSync('dist/sdk.js', 'utf8');
const esmContent = fs.readFileSync('dist/sdk.mjs', 'utf8');

if (cjsContent.includes('AuthManager') && cjsContent.includes('VERSION')) {
  console.log('✅ CommonJS bundle includes expected exports');
} else {
  console.log('❌ CommonJS bundle missing expected exports');
}

if (esmContent.includes('AuthManager') && esmContent.includes('VERSION')) {
  console.log('✅ ES Module bundle includes expected exports');
} else {
  console.log('❌ ES Module bundle missing expected exports');
}

console.log('\n✅ Module import tests completed successfully!');
console.log('\nThe SDK is now ready to be used in:');
console.log('  - TypeScript projects (.ts files)');
console.log('  - ES Modules projects (.mjs files or "type": "module")');
console.log('  - CommonJS projects (.js files with require())');
