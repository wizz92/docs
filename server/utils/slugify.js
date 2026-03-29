/**
 * Turn a label into a URL-safe, kebab-case slug.
 * Used for dictionary term slugs and process reference fields.
 * @param {string} label
 * @returns {string}
 */
export function slugify(label) {
  if (typeof label !== 'string') return '';
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining marks
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || '';
}

/**
 * Ensure slug is unique among existing terms by appending -2, -3, ... if needed.
 * @param {string} slug
 * @param {Array<{ slug: string }>} existingTerms
 * @returns {string}
 */
export function uniqueSlug(slug, existingTerms) {
  const slugs = new Set((existingTerms || []).map((t) => t.slug));
  if (!slugs.has(slug)) return slug;
  let n = 2;
  while (slugs.has(`${slug}-${n}`)) n++;
  return `${slug}-${n}`;
}
