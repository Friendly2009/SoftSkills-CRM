import {copyFile} from 'node:fs/promises';
// Cross-platform equivalent of the previous `cp` build step, including Windows.
await copyFile(new URL('../dist/index.html',import.meta.url),new URL('../dist/404.html',import.meta.url));
