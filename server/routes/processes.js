import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { validate, autoFill, resolveTypeKey } from '../validation/validator.js';
import { schemas } from '../validation/schemas.js';
import {
  processRepository,
  templateRepository,
  dictionaryRepository,
} from '../services/dataLayer/index.js';
import { resolveProcessDictionaryRefs, labelsToIds, refsToObjectIds } from '../services/processDictionaryRefs.js';
import { PROCESS_TYPE_LABELS } from '../services/dictionaryTerms.js';

const router = Router();

const DEFAULT_VIDEO_GUIDE = 'https://www.youtube.com/embed/eVTXPUF4Oz4?si=SdkBLM1XYIEPR03N';

function wildcardPath(param) {
  return Array.isArray(param) ? param.join('/') : String(param);
}

/**
 * Derive process type key from relative path (e.g. "01-l2/process.json" -> process_l2).
 * @param {string} relativePath
 * @returns {string|null} 'process_l1' | 'process_l2' | 'process_l3' | 'sop' | null
 */
function getTypeKeyFromRelativePath(relativePath) {
  const segments = String(relativePath).split('/').filter(Boolean);
  if (segments.length === 1 && segments[0] === 'process.json') return 'process_l1';
  if (segments.length === 2 && segments[1] === 'process.json') return 'process_l2';
  if (segments.length === 3 && segments[2] === 'process.json') return 'process_l3';
  if (segments.length === 3 && segments[2] !== 'process.json') return 'sop';
  return null;
}

/** Set missing required array fields to [] so frontend always receives a full shape. */
function applySchemaDefaults(data, typeKey) {
  const schema = schemas[typeKey];
  if (!schema || !schema.fields) return;
  for (const [field, rule] of Object.entries(schema.fields)) {
    if (!rule.required || (rule.type !== 'object[]' && rule.type !== 'string[]')) continue;
    if (data[field] === undefined || data[field] === null) {
      data[field] = [];
    }
  }
  // Default video guide for all processes if not explicitly set
  if (data.video_guides === undefined || data.video_guides === null) {
    data.video_guides = [DEFAULT_VIDEO_GUIDE];
  }
}

// ─── Backend status ───────────────────────────────────────────

router.get('/backend', (_req, res) => {
  const backend = process.env.DATA_BACKEND || 'json';
  const payload = { backend };
  if (backend === 'mongodb') {
    payload.mongodbConnected = mongoose.connection.readyState === 1;
  }
  res.json(payload);
});

async function convertRefsIfMongo(data) {
  if (typeof dictionaryRepository.getDictionaryRawValues === 'function') {
    const rawValues = await dictionaryRepository.getDictionaryRawValues();
    refsToObjectIds(data, rawValues);
  }
}

/**
 * Shared pipeline for create (L2, L3, SOP): validate, dict conversion, autoFill, runCreate, rebuild index.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {string} typeKey - process_l2, process_l3, sop
 * @param {(data: any) => Promise<{ message: string, folder?: string, file?: string, path: string }>} runCreate
 */
async function createProcessPipeline(req, res, typeKey, runCreate) {
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ error: '"data" is required' });
  }

  const result = validate(data, typeKey);

  if (!result.valid) return res.status(422).json(result);

  const dict = await dictionaryRepository.getDictionaries();
  labelsToIds(data, dict);
  await convertRefsIfMongo(data);

  try {
    autoFill(data);
    const createResult = await runCreate(data);
    await processRepository.rebuildDomainIndex(req.params.domainId);
    res.status(201).json({ ...createResult, warnings: result.warnings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ─── Dictionaries ────────────────────────────────────────────

// Main endpoint used by the editor to get suggestions
router.get('/dictionaries', async (_req, res) => {
  try {
    const data = await dictionaryRepository.getDictionaries();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for the dictionary editor page (same data, explicit name)
router.get('/dictionaries/editable', async (_req, res) => {
  try {
    const data = await dictionaryRepository.getEditableDictionaries();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/dictionaries', async (req, res) => {
  const body = req.body || {};
  try {
    const updated = await dictionaryRepository.saveDictionaries(body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Templates ───────────────────────────────────────────────

router.get('/templates/:type', async (req, res) => {
  try {
    const data = await templateRepository.getTemplate(req.params.type);
    res.json(data);
  } catch (err) {
    const status = err.message && err.message.includes('Type must be one of')
      ? 400
      : 500;
    res.status(status).json({ error: err.message });
  }
});

// ─── Validate (dry-run) ─────────────────────────────────────

router.post('/validate', (req, res) => {
  const { type, data } = req.body;
  if (!type || !data) return res.status(400).json({ error: '"type" and "data" fields are required' });
  const result = validate(data, type);
  res.json(result);
});

// ─── Read ────────────────────────────────────────────────────

router.get('/processes', async (_req, res) => {
  try {
    const data = await processRepository.getMasterIndex();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/processes/:domainId', async (req, res) => {
  try {
    const data = await processRepository.getDomainIndex(req.params.domainId);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.get('/processes/:domainId/*rest', async (req, res) => {
  const wildcard = wildcardPath(req.params.rest);
  try {
    let data = await processRepository.getProcessByPath(req.params.domainId, wildcard);
    const dict = await dictionaryRepository.getDictionaries();
    resolveProcessDictionaryRefs(data, dict);
    const typeKey = resolveTypeKey(data.type);
    if (typeKey) applySchemaDefaults(data, typeKey);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// ─── Create L2 ──────────────────────────────────────────────

router.post('/processes/:domainId/l2', async (req, res) => {
  const { domainId } = req.params;
  const { slug, data } = req.body;
  if (!slug || !data) {
    return res.status(400).json({ error: '"slug" (kebab-case name) and "data" (process JSON) are required' });
  }
  return createProcessPipeline(req, res, 'process_l2', async (data) => {
    const { folderName, path: createdPath } = await processRepository.createL2(domainId, slug, data);
    return { message: 'L2 process created', folder: folderName, path: createdPath };
  });
});

// ─── Create L3 ──────────────────────────────────────────────

router.post('/processes/:domainId/:l2Folder/l3', async (req, res) => {
  const { domainId, l2Folder } = req.params;
  const { slug, data } = req.body;
  if (!slug || !data) {
    return res.status(400).json({ error: '"slug" and "data" are required' });
  }
  return createProcessPipeline(req, res, 'process_l3', async (data) => {
    const { folderName, path: createdPath } = await processRepository.createL3(domainId, l2Folder, slug, data);
    return { message: 'L3 process created', folder: folderName, path: createdPath };
  });
});

// ─── Create SOP ─────────────────────────────────────────────

router.post('/processes/:domainId/:l2Folder/:l3Folder/sop', async (req, res) => {
  const { domainId, l2Folder, l3Folder } = req.params;
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: '"data" (SOP JSON) is required' });
  return createProcessPipeline(req, res, 'sop', async (data) => {
    const { fileName, path: createdPath } = await processRepository.createSop(domainId, l2Folder, l3Folder, data);
    return { message: 'SOP created', file: fileName, path: createdPath };
  });
});

// ─── Update existing process/SOP ────────────────────────────

router.put('/processes/:domainId/*rest', async (req, res) => {
  const wildcard = wildcardPath(req.params.rest);
  const { domainId } = req.params;
  const { data } = req.body;

  if (!data) return res.status(400).json({ error: '"data" is required' });

  let typeKey = resolveTypeKey(data.type);
  if (!typeKey) typeKey = getTypeKeyFromRelativePath(wildcard);
  if (!typeKey) {
    return res.status(400).json({ error: 'data.type is required to determine validation schema' });
  }
  if (!resolveTypeKey(data.type)) {
    data.type = PROCESS_TYPE_LABELS[typeKey];
  }

  const result = validate(data, typeKey);
  if (!result.valid) return res.status(422).json(result);

  const dict = await dictionaryRepository.getDictionaries();
  labelsToIds(data, dict);
  await convertRefsIfMongo(data);

  try {
    autoFill(data);
    const resultPath = await processRepository.updateProcess(domainId, wildcard, data);
    await processRepository.rebuildDomainIndex(domainId);
    res.json({
      message: 'Updated',
      path: resultPath.path,
      warnings: result.warnings,
    });
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message });
  }
});

export default router;
