import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';

function fixture(t, {incomplete = false} = {}) {
  const root = mkdtempSync(join(tmpdir(), 'airport-release-test-'));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  for (const directory of ['scripts', 'lab', 'payload', '.cache/airport-time-space', 'static/lab/airport-time-space']) {
    mkdirSync(join(root, directory), {recursive: true});
  }
  cpSync(new URL('./prepare-lab.mjs', import.meta.url), join(root, 'scripts/prepare-lab.mjs'));
  writeFileSync(join(root, 'payload/index.html'), 'released app');
  if (!incomplete) {
    writeFileSync(join(root, 'payload/app.js'), '// app');
    writeFileSync(join(root, 'payload/flights.json'), '{}');
  }
  const packed = join(root, 'release.tar.gz');
  execFileSync('tar', ['-czf', packed, '-C', join(root, 'payload'), '.']);
  const sha256 = createHash('sha256').update(readFileSync(packed)).digest('hex');
  const archive = join(root, '.cache/airport-time-space', `${sha256}.tar.gz`);
  cpSync(packed, archive);
  writeFileSync(join(root, 'lab/airport-time-space.release.json'), JSON.stringify({
    url: 'https://invalid.example/release.tar.gz', sha256,
  }));
  const target = join(root, 'static/lab/airport-time-space');
  writeFileSync(join(target, 'index.html'), 'previous app');
  writeFileSync(join(target, 'old-file'), 'remove on successful update');
  return {root, archive, target, run: () => execFileSync(process.execPath, [join(root, 'scripts/prepare-lab.mjs')], {encoding: 'utf8', stdio: 'pipe'})};
}

test('a verified cached release replaces the app without a download', t => {
  const {run, target} = fixture(t);
  run();
  assert.equal(readFileSync(join(target, 'index.html'), 'utf8'), 'released app');
  assert(existsSync(join(target, 'app.js')));
  assert(!existsSync(join(target, 'old-file')));
});

test('a checksum mismatch preserves the previous app', t => {
  const {run, archive, target} = fixture(t);
  writeFileSync(archive, 'corrupted archive');
  assert.throws(run, /checksum mismatch/);
  assert.equal(readFileSync(join(target, 'index.html'), 'utf8'), 'previous app');
  assert(existsSync(join(target, 'old-file')));
});

test('an incomplete release preserves the previous app', t => {
  const {run, target} = fixture(t, {incomplete: true});
  assert.throws(run, /missing app.js/);
  assert.equal(readFileSync(join(target, 'index.html'), 'utf8'), 'previous app');
  assert(existsSync(join(target, 'old-file')));
});
