import { Router } from 'express';
import mongoose from 'mongoose';
import { validate, resolveTypeKey } from '../validation/validator.js';
import {
  processRepository,
  templateRepository,
  dictionaryRepository,
} from '../services/dataLayer/index.js';
import { resolveProcessDictionaryRefs } from '../services/processDictionaryRefs.js';
import { PROCESS_TYPE_LABELS } from '../services/dictionaryTerms.js';
import { prepareValidatedProcessForSave, appendDictionaryValidation } from '../services/processWritePipeline.js';
import {
  wildcardPath,
  applySchemaDefaults,
  getTypeKeyFromRelativePath,
} from '../services/processPathUtils.js';
import { asyncRoute, HttpError } from './routeUtils.js';
import { sendError } from './apiErrors.js';
import { parseTextToProcess } from '../services/textToProcessParser.js';
import { requestIdMiddleware } from '../middleware/requestId.js';
import { COMPANY_SLUGS, DEFAULT_COMPANY_SLUG } from '../../shared/companies.js';
import { REQUIRED_CATEGORY_SLUGS } from '../../shared/domainCatalog.js';
import { scaffoldCompanyDomains } from '../services/scaffoldCompanyDomains.js';

const router = Router();

router.use(requestIdMiddleware);

// ─── Backend status ───────────────────────────────────────────

router.get('/backend', (_req, res) => {
  const backend = process.env.DATA_BACKEND || 'json';
  const payload = { backend };
  if (backend === 'mongodb') {
    payload.mongodbConnected = mongoose.connection.readyState === 1;
  }
  res.json(payload);
});

/**
 * Shared pipeline for create (L2, L3, SOP): validate + dict pipeline, runCreate, rebuild index.
 */
async function createProcessPipeline(req, res, typeKey, runCreate) {
  const { data } = req.body;
  if (!data) {
    sendError(res, 400, '"data" is required', 'bad_request');
    return;
  }

  const prep = await prepareValidatedProcessForSave(data, typeKey, { dictionaryRepository });
  if (!prep.ok) {
    res.status(422).json(prep.validationResult);
    return;
  }

  try {
    const createResult = await runCreate(data);
    await processRepository.rebuildDomainIndex(req.params.domainId);
    res.status(201).json({ ...createResult, warnings: prep.validationResult.warnings });
  } catch (err) {
    const msg = err.message || '';
    if (/parent not found|parent is archived/i.test(msg)) {
      sendError(res, 422, msg, 'unprocessable');
      return;
    }
    throw err;
  }
}

// ─── Companies (L0 dictionary) ───────────────────────────────

router.get('/companies', asyncRoute(async (_req, res) => {
  const dict = await dictionaryRepository.getDictionaries();
  const terms = Array.isArray(dict.company) ? dict.company : [];
  const labelToSlug = new Map(Object.entries(COMPANY_SLUGS).map(([slug, label]) => [label, slug]));
  const out = terms.map((t) => {
    const label = typeof t === 'string' ? t : (t && t.label) || '';
    const id = typeof t === 'string' ? '' : String(t?.id ?? '');
    const slug = labelToSlug.get(label) || DEFAULT_COMPANY_SLUG;
    return { id, label, slug };
  });
  res.json(out);
}));

/**
 * Scaffold missing L1 domains for a company from the domain catalog (9 categories).
 * Body (optional): `{ "categorySlugs": ["operational-management", ...] }` — limit which categories to create.
 */
router.post('/companies/:companySlug/scaffold', asyncRoute(async (req, res) => {
  const { companySlug } = req.params;
  if (!COMPANY_SLUGS[companySlug]) {
    throw new HttpError(404, 'Unknown company', 'not_found');
  }
  const raw = req.body?.categorySlugs;
  if (raw !== undefined && !Array.isArray(raw)) {
    sendError(res, 400, 'categorySlugs must be an array', 'bad_request');
    return;
  }
  if (Array.isArray(raw)) {
    for (const s of raw) {
      if (typeof s !== 'string' || !REQUIRED_CATEGORY_SLUGS.includes(s)) {
        sendError(res, 400, `Unknown category slug: ${String(s)}`, 'bad_request');
        return;
      }
    }
  }
  const result = await scaffoldCompanyDomains(
    processRepository,
    companySlug,
    raw,
  );
  const status = result.created.length > 0 ? 201 : 200;
  res.status(status).json(result);
}));

// ─── Dictionaries ────────────────────────────────────────────

router.get('/dictionaries', asyncRoute(async (_req, res) => {
  const data = await dictionaryRepository.getDictionaries();
  res.json(data);
}));

router.get('/dictionaries/editable', asyncRoute(async (_req, res) => {
  const data = await dictionaryRepository.getEditableDictionaries();
  res.json(data);
}));

router.put('/dictionaries', asyncRoute(async (req, res) => {
  const body = req.body || {};
  try {
    const updated = await dictionaryRepository.saveDictionaries(body);
    res.json(updated);
  } catch (err) {
    sendError(res, 400, err.message, 'bad_request');
  }
}));

// ─── Templates ───────────────────────────────────────────────

router.get('/templates/:type', asyncRoute(async (req, res) => {
  try {
    const data = await templateRepository.getTemplate(req.params.type);
    res.json(data);
  } catch (err) {
    if (err.message && err.message.includes('Type must be one of')) {
      sendError(res, 400, err.message, 'bad_request');
      return;
    }
    throw err;
  }
}));

// ─── Parse free-form text to process JSON (LLM) ─────────────

router.post('/parse-text', asyncRoute(async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    sendError(res, 501, 'Text import is not configured (OPENAI_API_KEY missing)', 'not_configured');
    return;
  }
  const { text, type } = req.body || {};
  if (typeof text !== 'string' || !text.trim()) {
    sendError(res, 400, '"text" (non-empty string) is required', 'bad_request');
    return;
  }
  if (!type || !['process_l2', 'process_l3', 'sop'].includes(type)) {
    sendError(res, 400, '"type" must be process_l2, process_l3, or sop', 'bad_request');
    return;
  }
  try {
    const result = await parseTextToProcess(text.trim(), type);
    if (!result.ok) {
      return res.json({
        insufficient: true,
        missing_fields: result.missing_fields,
        summary: result.summary,
      });
    }
    return res.json({ data: result.data });
  } catch (err) {
    if (err.statusCode === 422) {
      return res.status(422).json({ error: err.message, code: 'validation_failed', raw: err.raw });
    }
    throw err;
  }
}));

// ─── Validate (dry-run) ─────────────────────────────────────

router.post('/validate', asyncRoute(async (req, res) => {
  const { type, data } = req.body;
  if (!type || !data) {
    sendError(res, 400, '"type" and "data" fields are required', 'bad_request');
    return;
  }
  const schemaResult = validate(data, type);
  if (!schemaResult.valid) return res.json(schemaResult);
  const dict = await dictionaryRepository.getDictionaries();
  const result = appendDictionaryValidation(schemaResult, data, dict);
  return res.json(result);
}));

// ─── Read ────────────────────────────────────────────────────

router.get('/processes', asyncRoute(async (_req, res) => {
  const data = await processRepository.getMasterIndex();
  res.json(data);
}));

router.get('/processes/:domainId', asyncRoute(async (req, res) => {
  try {
    const data = await processRepository.getDomainIndex(req.params.domainId);
    res.json(data);
  } catch (err) {
    throw new HttpError(404, err.message, 'not_found');
  }
}));

router.get('/processes/:domainId/*rest', asyncRoute(async (req, res) => {
  const wildcard = wildcardPath(req.params.rest);
  try {
    let data = await processRepository.getProcessByPath(req.params.domainId, wildcard);
    const dict = await dictionaryRepository.getDictionaries();
    resolveProcessDictionaryRefs(data, dict);
    const typeKey = resolveTypeKey(data.type);
    if (typeKey) applySchemaDefaults(data, typeKey);
    res.json(data);
  } catch (err) {
    throw new HttpError(404, err.message, 'not_found');
  }
}));

// ─── Create L2 ──────────────────────────────────────────────

router.post('/processes/:domainId/l2', asyncRoute(async (req, res) => {
  const { domainId } = req.params;
  const { slug, data } = req.body;
  if (!slug || !data) {
    sendError(res, 400, '"slug" (kebab-case name) and "data" (process JSON) are required', 'bad_request');
    return;
  }
  return createProcessPipeline(req, res, 'process_l2', async (data) => {
    const { folderName, path: createdPath } = await processRepository.createL2(domainId, slug, data);
    return { message: 'L2 process created', folder: folderName, path: createdPath };
  });
}));

// ─── Create L3 ──────────────────────────────────────────────

router.post('/processes/:domainId/:l2Folder/l3', asyncRoute(async (req, res) => {
  const { domainId, l2Folder } = req.params;
  const { slug, data } = req.body;
  if (!slug || !data) {
    sendError(res, 400, '"slug" and "data" are required', 'bad_request');
    return;
  }
  return createProcessPipeline(req, res, 'process_l3', async (data) => {
    const { folderName, path: createdPath } = await processRepository.createL3(domainId, l2Folder, slug, data);
    return { message: 'L3 process created', folder: folderName, path: createdPath };
  });
}));

// ─── Create SOP ─────────────────────────────────────────────

router.post('/processes/:domainId/:l2Folder/:l3Folder/sop', asyncRoute(async (req, res) => {
  const { domainId, l2Folder, l3Folder } = req.params;
  const { data } = req.body;
  if (!data) {
    sendError(res, 400, '"data" (SOP JSON) is required', 'bad_request');
    return;
  }
  return createProcessPipeline(req, res, 'sop', async (data) => {
    const { fileName, path: createdPath } = await processRepository.createSop(domainId, l2Folder, l3Folder, data);
    return { message: 'SOP created', file: fileName, path: createdPath };
  });
}));

// ─── Update existing process/SOP ────────────────────────────

router.put('/processes/:domainId/*rest', asyncRoute(async (req, res) => {
  const wildcard = wildcardPath(req.params.rest);
  const { domainId } = req.params;
  const { data } = req.body;

  if (!data) {
    sendError(res, 400, '"data" is required', 'bad_request');
    return;
  }

  let typeKey = resolveTypeKey(data.type);
  if (!typeKey) typeKey = getTypeKeyFromRelativePath(wildcard);
  if (!typeKey) {
    sendError(res, 400, 'data.type is required to determine validation schema', 'bad_request');
    return;
  }
  if (!resolveTypeKey(data.type)) {
    data.type = PROCESS_TYPE_LABELS[typeKey];
  }

  const prep = await prepareValidatedProcessForSave(data, typeKey, { dictionaryRepository });
  if (!prep.ok) {
    res.status(422).json(prep.validationResult);
    return;
  }

  try {
    const resultPath = await processRepository.updateProcess(domainId, wildcard, data);
    await processRepository.rebuildDomainIndex(domainId);
    res.json({
      message: 'Updated',
      path: resultPath.path,
      warnings: prep.validationResult.warnings,
    });
  } catch (err) {
    const notFound = err.message.includes('not found');
    if (notFound) {
      throw new HttpError(404, err.message, 'not_found');
    }
    throw err;
  }
}));

export default router;
