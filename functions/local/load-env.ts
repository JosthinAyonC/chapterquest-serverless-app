import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';

const envFile = resolve(import.meta.dirname, '../.env');
if (existsSync(envFile)) {
  loadEnvFile(envFile);
}
