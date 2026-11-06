import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { satisfies } from 'semver';
import { describe, expect, it } from 'vitest';
import packageJson from '../package.json';
import databasePackageJson from '../src/services/databases/package.json';
import { VERSION } from '../src';

describe('supported Node security floors', () => {
  it.each([
    '22.23.4',
    '22.23.5',
    '22.24.0',
    '24.22.1',
    '24.22.2',
    '26.12.1',
    '26.12.2',
  ])('supports patched Node %s', (version) => {
    expect(satisfies(version, packageJson.engines.node)).toBe(true);
  });

  it.each([
    '18.20.8',
    '20.20.2',
    '21.7.3',
    '22.23.3',
    '23.11.0',
    '24.22.0',
    '25.9.0',
    '26.12.0',
    '27.0.0',
    '26.13.0-rc.0',
  ])('does not advertise unpatched or unsupported Node %s', (version) => {
    expect(satisfies(version, packageJson.engines.node)).toBe(false);
  });

  it('keeps root, database and lockfile runtime policies aligned', () => {
    expect(databasePackageJson.engines.node).toBe(packageJson.engines.node);
    for (const file of [
      'package-lock.json',
      'src/services/databases/package-lock.json',
    ]) {
      const lockfile = JSON.parse(
        readFileSync(resolve(__dirname, '..', file), 'utf8')
      );
      expect(lockfile.packages[''].engines.node).toBe(packageJson.engines.node);
    }
  });

  it('exports the actual npm package version', () => {
    expect(VERSION).toBe(packageJson.version);
  });
});
