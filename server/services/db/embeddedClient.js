import Datastore from 'nedb-promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../../data');

let processStore;
let dictionaryStore;

function createStore(filename) {
  return Datastore.create({
    filename: path.join(DATA_DIR, filename),
    autoload: true,
  });
}

export function getProcessStore() {
  if (!processStore) {
    processStore = createStore('processes.db');
    processStore.ensureIndex({ fieldName: 'domainId' }).catch(() => {});
    processStore.ensureIndex({ fieldName: 'type' }).catch(() => {});
    processStore.ensureIndex({ fieldName: 'domainPath', unique: true }).catch(() => {});
  }
  return processStore;
}

export function getDictionaryStore() {
  if (!dictionaryStore) {
    dictionaryStore = createStore('dictionaries.db');
    dictionaryStore.ensureIndex({ fieldName: 'key' }).catch(() => {});
  }
  return dictionaryStore;
}

