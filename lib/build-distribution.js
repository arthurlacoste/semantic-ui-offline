const { cp, mkdir, mkdtemp, readFile, rm, writeFile } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const REMOTE_FONT_IMPORT = /@import url\([^)]+\);/;
const DISTRIBUTION_DIRECTORIES = ['components', 'themes'];
const DISTRIBUTION_FILES = [
  '.versions',
  'package.js',
  'semantic.css',
  'semantic.js',
  'semantic.min.css',
  'semantic.min.js'
];
const FONT_STYLESHEETS = [
  ['semantic.css', 'expanded'],
  ['semantic.min.css', 'minified'],
  ['components/site.css', 'expanded'],
  ['components/site.min.css', 'minified']
];

function injectOfflineFonts(css, fontFaces) {
  if (!REMOTE_FONT_IMPORT.test(css)) {
    throw new Error('remote font import not found');
  }

  return css.replace(REMOTE_FONT_IMPORT, fontFaces);
}

async function copyDistribution(sourceDirectory, targetDirectory) {
  for (const directory of DISTRIBUTION_DIRECTORIES) {
    const target = path.join(targetDirectory, directory);
    await rm(target, { force: true, recursive: true });
    await cp(path.join(sourceDirectory, directory), target, { recursive: true });
  }

  await Promise.all(DISTRIBUTION_FILES.map(file => (
    cp(path.join(sourceDirectory, file), path.join(targetDirectory, file))
  )));
}

async function buildDistribution({ sourceDirectory, targetDirectory, fontFaces }) {
  const stagingRoot = await mkdtemp(path.join(os.tmpdir(), 'semantic-ui-offline-build-'));
  const stagingDirectory = path.join(stagingRoot, 'distribution');

  try {
    await mkdir(stagingDirectory);
    await copyDistribution(sourceDirectory, stagingDirectory);

    for (const [file, format] of FONT_STYLESHEETS) {
      const filename = path.join(stagingDirectory, file);
      const css = await readFile(filename, 'utf8');
      await writeFile(filename, injectOfflineFonts(css, fontFaces[format]), 'utf8');
    }

    await copyDistribution(stagingDirectory, targetDirectory);
  } finally {
    await rm(stagingRoot, { force: true, recursive: true });
  }
}

module.exports = { buildDistribution, injectOfflineFonts };
