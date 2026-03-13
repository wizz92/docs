import { JsonProcessRepository } from './jsonProcessRepository.js';
import { JsonTemplateRepository } from './jsonTemplateRepository.js';
import { JsonDictionaryRepository } from './jsonDictionaryRepository.js';
import { DbProcessRepository } from './dbProcessRepository.js';
import { DbDictionaryRepository } from './dbDictionaryRepository.js';

// Select backend: 'embedded-db' (default) or 'json'
const backend = process.env.DATA_BACKEND || 'embedded-db';

let processRepository;
let templateRepository;
let dictionaryRepository;

if (backend === 'embedded-db') {
  processRepository = new DbProcessRepository();
  templateRepository = new JsonTemplateRepository();
  dictionaryRepository = new DbDictionaryRepository();
} else {
  processRepository = new JsonProcessRepository();
  templateRepository = new JsonTemplateRepository();
  dictionaryRepository = new JsonDictionaryRepository();
}

export { processRepository, templateRepository, dictionaryRepository };

