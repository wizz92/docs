/**
 * Top-level field keys implied by validator error messages (for user-facing "missing" lists).
 * @param {string[]} errors
 * @returns {string[]}
 */
export function topLevelFieldsFromValidationErrors(errors) {
  const keys = new Set();
  for (const msg of errors) {
    const m =
      msg.match(/^Required field "([^"]+)"/) ||
      msg.match(/^Field "([^"]+)"/) ||
      msg.match(/^Deprecated field "([^"]+)"/);
    if (m) {
      const top = m[1].split(/[.[]/)[0];
      if (top) keys.add(top);
    }
  }
  return [...keys];
}
