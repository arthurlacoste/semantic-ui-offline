const assert = require('node:assert/strict');
const { mkdtemp, mkdir, readFile, writeFile } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  buildDistribution,
  injectOfflineFonts
} = require('../../lib/build-distribution');

test('injectOfflineFonts replaces the remote font import', () => {
  const css = "@import url(https://fonts.googleapis.com/css?family=Lato);\n.ui.button {}";

  const result = injectOfflineFonts(css, '@font-face { font-family: Lato; }');

  assert.equal(result, '@font-face { font-family: Lato; }\n.ui.button {}');
});

test('injectOfflineFonts rejects CSS without a remote font import', () => {
  assert.throws(
    () => injectOfflineFonts('.ui.button {}', '@font-face {}'),
    /remote font import not found/
  );
});

test('buildDistribution copies assets without replacing project metadata', async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'semantic-ui-offline-'));
  const sourceDirectory = path.join(temporaryDirectory, 'source');
  const targetDirectory = path.join(temporaryDirectory, 'target');
  const css = '@import url(https://fonts.example/lato);\n.ui.button {}';

  await mkdir(path.join(sourceDirectory, 'components'), { recursive: true });
  await mkdir(path.join(sourceDirectory, 'themes/default'), { recursive: true });
  await mkdir(targetDirectory, { recursive: true });
  await Promise.all([
    writeFile(path.join(sourceDirectory, '.versions'), 'semantic:ui-css@2.5.0'),
    writeFile(path.join(sourceDirectory, 'package.js'), 'Package.describe({});'),
    writeFile(path.join(sourceDirectory, 'package.json'), '{"version":"upstream"}'),
    writeFile(path.join(targetDirectory, 'package.json'), '{"version":"project"}'),
    writeFile(path.join(sourceDirectory, 'semantic.css'), css),
    writeFile(path.join(sourceDirectory, 'semantic.min.css'), css),
    writeFile(path.join(sourceDirectory, 'semantic.js'), 'window.semantic = true;'),
    writeFile(path.join(sourceDirectory, 'semantic.min.js'), 'window.semantic=true;'),
    writeFile(path.join(sourceDirectory, 'components/site.css'), css),
    writeFile(path.join(sourceDirectory, 'components/site.min.css'), css),
    writeFile(path.join(sourceDirectory, 'components/button.css'), '.ui.button {}'),
    writeFile(path.join(sourceDirectory, 'themes/default/icon.txt'), 'icon')
  ]);

  await buildDistribution({
    sourceDirectory,
    targetDirectory,
    fontFaces: { expanded: 'EXPANDED_FONTS', minified: 'MINIFIED_FONTS' }
  });

  assert.equal(
    await readFile(path.join(targetDirectory, 'package.json'), 'utf8'),
    '{"version":"project"}'
  );
  assert.match(await readFile(path.join(targetDirectory, 'semantic.css'), 'utf8'), /^EXPANDED_FONTS/);
  assert.match(await readFile(path.join(targetDirectory, 'semantic.min.css'), 'utf8'), /^MINIFIED_FONTS/);
  assert.equal(await readFile(path.join(targetDirectory, 'themes/default/icon.txt'), 'utf8'), 'icon');
});

test('buildDistribution leaves the target untouched when preparation fails', async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'semantic-ui-offline-'));
  const sourceDirectory = path.join(temporaryDirectory, 'source');
  const targetDirectory = path.join(temporaryDirectory, 'target');

  await mkdir(path.join(sourceDirectory, 'components'), { recursive: true });
  await mkdir(path.join(targetDirectory, 'components'), { recursive: true });
  await writeFile(path.join(targetDirectory, 'components/existing.css'), 'keep me');

  await assert.rejects(buildDistribution({
    sourceDirectory,
    targetDirectory,
    fontFaces: { expanded: 'fonts', minified: 'fonts' }
  }));

  assert.equal(
    await readFile(path.join(targetDirectory, 'components/existing.css'), 'utf8'),
    'keep me'
  );
});
