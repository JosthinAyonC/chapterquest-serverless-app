import * as esbuild from 'esbuild';
import { readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'dist');
const HANDLER_DIRS = [
  'auth',
  'users',
  'books',
  'reviews',
  'comments',
  'roleplay',
];

function findHandlers() {
  const handlers = [];
  for (const dir of HANDLER_DIRS) {
    const handlersDir = join(ROOT, dir, 'handlers');
    try {
      for (const file of readdirSync(handlersDir)) {
        if (file.endsWith('.handler.ts')) {
          handlers.push(join(handlersDir, file));
        }
      }
    } catch {
      // directory may not exist yet
    }
  }
  return handlers;
}

async function build() {
  const handlers = findHandlers();
  if (handlers.length === 0) {
    console.warn('No handlers found to build.');
    return;
  }

  await esbuild.build({
    entryPoints: handlers,
    bundle: true,
    platform: 'node',
    target: 'node24',
    format: 'cjs',
    outdir: OUT_DIR,
    outbase: ROOT,
    sourcemap: true,
    minify: false,
    external: ['@aws-sdk/*'],
    logLevel: 'info',
    entryNames: '[dir]/[name]',
  });

  for (const handler of handlers) {
    const rel = relative(ROOT, handler).replace(/\.ts$/, '.js');
    console.log(`  ✓ ${rel}`);
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
