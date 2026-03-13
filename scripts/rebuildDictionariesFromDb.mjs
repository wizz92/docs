import { rebuildDictionariesFromDb } from '../server/services/dataLayer/rebuildDictionariesFromDb.js';

async function main() {
  try {
    const result = await rebuildDictionariesFromDb();
    // eslint-disable-next-line no-console
    console.log('Dictionaries rebuilt from DB for key:', result.key);
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to rebuild dictionaries from DB:', err);
    process.exit(1);
  }
}

main();

