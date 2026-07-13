const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '../..');

async function readPackage(relativePath = 'package.json') {
  const content = await readFile(path.join(root, relativePath), 'utf8');
  return JSON.parse(content);
}

test('runtime dependencies exclude jQuery 4', async () => {
  const packageJson = await readPackage();

  assert.equal(packageJson.dependencies.jquery, '^3.7.1');
});

test('build uses an exact Semantic UI CSS version', async () => {
  const packageJson = await readPackage();

  assert.equal(packageJson.devDependencies['semantic-ui-css'], '2.5.0');
});

test('package manifest has a single source of truth', async () => {
  await assert.rejects(readPackage('src/package.json'), { code: 'ENOENT' });
});

test('package exposes repeatable build and test commands', async () => {
  const packageJson = await readPackage();

  assert.deepEqual(packageJson.scripts, {
    build: 'node bin/recreate.js',
    start: 'npm run build',
    test: 'npm run test:unit && npm run test:browser',
    'test:unit': 'node --test test/unit/*.test.js',
    'test:browser': 'playwright test'
  });
  assert.equal(packageJson.devDependencies['@playwright/test'], '1.61.1');
  assert.equal(packageJson.devDependencies['fs-extra'], undefined);
  assert.equal(packageJson.dependencies['fs-extra'], undefined);
});
