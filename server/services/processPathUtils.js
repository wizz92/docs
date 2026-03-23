import { schemas } from '../validation/schemas.js';

export const DEFAULT_VIDEO_GUIDE = 'https://www.youtube.com/embed/eVTXPUF4Oz4?si=SdkBLM1XYIEPR03N';

export function wildcardPath(param) {
  return Array.isArray(param) ? param.join('/') : String(param);
}

/**
 * Derive process type key from relative path (e.g. "01-l2/process.json" -> process_l2).
 * @param {string} relativePath
 * @returns {string|null} 'process_l1' | 'process_l2' | 'process_l3' | 'sop' | null
 */
export function getTypeKeyFromRelativePath(relativePath) {
  const segments = String(relativePath).split('/').filter(Boolean);
  if (segments.length === 1 && segments[0] === 'process.json') return 'process_l1';
  if (segments.length === 2 && segments[1] === 'process.json') return 'process_l2';
  if (segments.length === 3 && segments[2] === 'process.json') return 'process_l3';
  if (segments.length === 3 && segments[2] !== 'process.json') return 'sop';
  return null;
}

/** Set missing required array fields to [] so frontend always receives a full shape. */
export function applySchemaDefaults(data, typeKey) {
  const schema = schemas[typeKey];
  if (!schema || !schema.fields) return;
  for (const [field, rule] of Object.entries(schema.fields)) {
    if (!rule.required || (rule.type !== 'object[]' && rule.type !== 'string[]')) continue;
    if (data[field] === undefined || data[field] === null) {
      data[field] = [];
    }
  }
  if (data.video_guides === undefined || data.video_guides === null) {
    data.video_guides = [DEFAULT_VIDEO_GUIDE];
  }
}
