import {cpSync, mkdirSync, rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

// Keep the standalone app authoritative; Docusaurus publishes this generated copy.
const source = fileURLToPath(new URL('../lab/airport-time-space/dist/', import.meta.url));
const target = fileURLToPath(new URL('../static/lab/airport-time-space/', import.meta.url));
rmSync(target, {recursive: true, force: true});
mkdirSync(target, {recursive: true});
cpSync(source, target, {recursive: true});
console.log('Prepared /lab/airport-time-space/ for static hosting.');
