import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { validate, autoFill } from '../validation/validator.js';
import {
  processRepository,
  templateRepository,
  dictionaryRepository,
} from '../services/dataLayer/index.js';

const router = Router();

function wildcardPath(param) {
  return Array.isArray(param) ? param.join('/') : String(param);
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
    const data = await processRepository.getProcessByPath(req.params.domainId, wildcard);
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

  const result = validate(data, 'process_l2');
  if (!result.valid) return res.status(422).json(result);

  try {
    autoFill(data);
    const { folderName, path: createdPath } = await processRepository.createL2(domainId, slug, data);
    await processRepository.rebuildDomainIndex(domainId);
    res.status(201).json({
      message: 'L2 process created',
      folder: folderName,
      path: createdPath,
      warnings: result.warnings,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Create L3 ──────────────────────────────────────────────

router.post('/processes/:domainId/:l2Folder/l3', async (req, res) => {
  const { domainId, l2Folder } = req.params;
  const { slug, data } = req.body;

  if (!slug || !data) {
    return res.status(400).json({ error: '"slug" and "data" are required' });
  }

  const result = validate(data, 'process_l3');
  if (!result.valid) return res.status(422).json(result);

  try {
    autoFill(data);
    const { folderName, path: createdPath } = await processRepository.createL3(domainId, l2Folder, slug, data);
    await processRepository.rebuildDomainIndex(domainId);
    res.status(201).json({
      message: 'L3 process created',
      folder: folderName,
      path: createdPath,
      warnings: result.warnings,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Create SOP ─────────────────────────────────────────────

router.post('/processes/:domainId/:l2Folder/:l3Folder/sop', async (req, res) => {
  const { domainId, l2Folder, l3Folder } = req.params;
  const { data } = req.body;

  if (!data) return res.status(400).json({ error: '"data" (SOP JSON) is required' });

  const result = validate(data, 'sop');
  if (!result.valid) return res.status(422).json(result);

  try {
    autoFill(data);
    const { fileName, path: createdPath } = await processRepository.createSop(domainId, l2Folder, l3Folder, data);
    await processRepository.rebuildDomainIndex(domainId);
    res.status(201).json({
      message: 'SOP created',
      file: fileName,
      path: createdPath,
      warnings: result.warnings,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Update existing process/SOP ────────────────────────────

router.put('/processes/:domainId/*rest', async (req, res) => {
  const wildcard = wildcardPath(req.params.rest);
  const { domainId } = req.params;
  const { data } = req.body;

  if (!data) return res.status(400).json({ error: '"data" is required' });

  // Infer type from data.type or from the filename
  const inferredType = data.type;
  if (!inferredType) {
    return res.status(400).json({ error: 'data.type is required to determine validation schema' });
  }

  const result = validate(data, inferredType);
  if (!result.valid) return res.status(422).json(result);

  const relPath = `${domainId}/${wildcard}`;
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
