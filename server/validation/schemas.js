import { buildValidationSchemas, DEPRECATED_FIELDS } from '../../shared/processFieldManifest.js';

const schemas = buildValidationSchemas();

export { schemas, DEPRECATED_FIELDS };
