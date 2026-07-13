const { readFile } = require('node:fs/promises');
const path = require('node:path');

const { buildDistribution } = require('../lib/build-distribution');

const root = path.resolve(__dirname, '..');

async function main() {
  const sourceDirectory = process.env.SEMANTIC_UI_SOURCE
    || path.join(root, 'node_modules/semantic-ui-css');
  const targetDirectory = process.env.OUTPUT_DIRECTORY || root;
  const [expanded, minified] = await Promise.all([
    readFile(path.join(root, 'src/lato.css'), 'utf8'),
    readFile(path.join(root, 'src/lato.min.css'), 'utf8')
  ]);

  await buildDistribution({
    sourceDirectory,
    targetDirectory,
    fontFaces: { expanded: expanded.trim(), minified: minified.trim() }
  });

  console.log('Semantic UI offline distribution updated.');
}

main().catch(error => {
  console.error(`Build failed: ${error.message}`);
  process.exitCode = 1;
});
