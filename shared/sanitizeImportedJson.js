/** Same prefix pattern as scripts/extractFieldHelp.mjs */
const PREFIX = /^___(REQUIRED|OPTIONAL|AUTO)___\s*/;

function stripString(s) {
  if (typeof s !== 'string') return s;
  return s.replace(PREFIX, '').trim();
}

/**
 * Recursively strip template instruction prefixes from strings.
 * Removes top-level `version` and `updated_at` (auto-managed).
 * @param {unknown} val
 * @param {boolean} isRoot
 * @returns {unknown}
 */
function sanitizeNode(val, isRoot) {
  if (typeof val === 'string') return stripString(val);
  if (Array.isArray(val)) return val.map((x) => sanitizeNode(x, false));
  if (val && typeof val === 'object') {
    const o = { ...val };
    if (isRoot) {
      delete o.version;
      delete o.updated_at;
    }
    for (const k of Object.keys(o)) {
      o[k] = sanitizeNode(o[k], false);
    }
    return o;
  }
  return val;
}

/**
 * @param {object} root
 * @returns {object}
 */
export function sanitizeImportedJson(root) {
  if (!root || typeof root !== 'object' || Array.isArray(root)) {
    return root;
  }
  return sanitizeNode(root, true);
}
