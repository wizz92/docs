import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../data/dictionaries.db');

async function main() {
  try {
    await fs.unlink(dbPath);
    // eslint-disable-next-line no-console
    console.log('Removed dictionaries.db so it can be rebuilt without unique constraint issues.');
  } catch (err) {
    if (err.code === 'ENOENT') {
      // eslint-disable-next-line no-console
      console.log('dictionaries.db does not exist, nothing to remove.');
    } else {
      // eslint-disable-next-line no-console
      console.error('Failed to remove dictionaries.db:', err);
      process.exit(1);
    }
  }
}

main();

