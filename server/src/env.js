import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const srcDir = path.dirname(fileURLToPath(import.meta.url));

export const serverRoot = path.resolve(srcDir, '..');
export const envPath = path.join(serverRoot, '.env');

const result = dotenv.config({ path: envPath });

if (result.error && result.error.code !== 'ENOENT') {
  console.warn(`Failed to load environment file at ${envPath}:`, result.error.message);
}
