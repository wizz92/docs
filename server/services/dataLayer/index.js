import { JsonProcessRepository } from './jsonProcessRepository.js';
import { JsonTemplateRepository } from './jsonTemplateRepository.js';
import { JsonDictionaryRepository } from './jsonDictionaryRepository.js';
import { MongoProcessRepository } from './mongoProcessRepository.js';
import { MongoDictionaryRepository } from './mongoDictionaryRepository.js';

const backend = process.env.DATA_BACKEND || 'json';

if (backend === 'mongodb' && !process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is required when DATA_BACKEND=mongodb');
}

let processRepository;
let templateRepository;
let dictionaryRepository;

if (backend === 'mongodb') {
  processRepository = new MongoProcessRepository();
  templateRepository = new JsonTemplateRepository();
  dictionaryRepository = new MongoDictionaryRepository();
} else {
  processRepository = new JsonProcessRepository();
  templateRepository = new JsonTemplateRepository();
  dictionaryRepository = new JsonDictionaryRepository();
}

export { processRepository, templateRepository, dictionaryRepository };
