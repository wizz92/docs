import { JsonTemplateRepository } from './jsonTemplateRepository.js';
import { MongoProcessRepository } from './mongoProcessRepository.js';
import { MongoDictionaryRepository } from './mongoDictionaryRepository.js';

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is required');
}

export const processRepository = new MongoProcessRepository();
export const templateRepository = new JsonTemplateRepository();
export const dictionaryRepository = new MongoDictionaryRepository();
