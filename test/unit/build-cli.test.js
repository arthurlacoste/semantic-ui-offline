const assert = require('node:assert/strict');
const { mkdtemp, mkdir, writeFile } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const cli = path.resolve(__dirname, '../../bin/recreate.js');

test('build CLI exits non-zero when its source is invalid', async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'semantic-ui-offline-cli-'));
  const dependency = path.join(cwd, 'node_modules/semantic-ui-css');
  const css = '@import url(https://fonts.example/lato);';

  await mkdir(path.join(dependency, 'components'), { recursive: true });
  await mkdir(path.join(cwd, 'src'), { recursive: true });
  await Promise.all([
    writeFile(path.join(dependency, 'semantic.css'), css),
    writeFile(path.join(dependency, 'semantic.min.css'), css),
    writeFile(path.join(dependency, 'components/site.css'), css),
    writeFile(path.join(dependency, 'components/site.min.css'), css)
  ]);

  const result = spawnSync(process.execPath, [cli], {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      SEMANTIC_UI_SOURCE: path.join(cwd, 'missing-source'),
      OUTPUT_DIRECTORY: path.join(cwd, 'output')
    }
  });

  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /Build failed/);
});
