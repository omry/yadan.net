import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

// The app lives in its own repository; only its pinned release is published here.
const {url, sha256} = JSON.parse(readFileSync(new URL('../lab/airport-time-space.release.json', import.meta.url), 'utf8'));
if (!/^[a-f0-9]{64}$/.test(sha256)) {
  throw new Error('The airport app release requires a SHA-256 checksum.');
}
const cache = fileURLToPath(new URL('../.cache/airport-time-space/', import.meta.url));
const archive = join(cache, `${sha256}.tar.gz`);
const target = fileURLToPath(new URL('../static/lab/airport-time-space/', import.meta.url));

const contents = existsSync(archive)
  ? readFileSync(archive)
  : await download(url);
if (createHash('sha256').update(contents).digest('hex') !== sha256) {
  throw new Error('Airport app release checksum mismatch; static files were not replaced.');
}
if (!existsSync(archive)) {
  mkdirSync(cache, {recursive: true});
  writeFileSync(`${archive}.tmp`, contents);
  renameSync(`${archive}.tmp`, archive);
}

mkdirSync(dirname(target), {recursive: true});
const staging = mkdtempSync(join(dirname(target), '.airport-time-space-'));
try {
  execFileSync('tar', ['-xzf', archive, '-C', staging]);
  for (const file of ['index.html', 'app.js', 'flights.json']) {
    if (!existsSync(join(staging, file))) {
      throw new Error(`Airport app release is missing ${file}.`);
    }
  }
  rmSync(target, {recursive: true, force: true});
  renameSync(staging, target);
} finally {
  rmSync(staging, {recursive: true, force: true});
}
console.log('Prepared pinned airport app release for /lab/airport-time-space/.');

async function download(releaseUrl) {
  console.log(`Downloading airport app release: ${releaseUrl}`);
  const response = await fetch(releaseUrl, {signal: AbortSignal.timeout(120_000)});
  if (!response.ok) {
    throw new Error(`Airport app download failed: HTTP ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}
