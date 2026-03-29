/**
 * L0 company slugs (URL segments) and display labels.
 * Master index `domain.companyId` stores the slug (e.g. "qwerty").
 */

export const DEFAULT_COMPANY_SLUG = 'qwerty';

/** @type {Record<string, string>} slug -> display label */
export const COMPANY_SLUGS = {
  qwerty: 'Qwerty',
  speedy: 'Speedy',
  mono: 'MONO',
  k2: 'K2',
  lorn: 'LORN',
};

export const COMPANY_SLUG_ORDER = Object.keys(COMPANY_SLUGS);

export function companyLabelFromSlug(slug) {
  if (!slug) return '';
  return COMPANY_SLUGS[slug] || slug;
}

/**
 * @param {string} companyId
 * @param {string} pathWithoutLeadingSlash - e.g. "domain/foo/l2/bar"
 */
export function companyClientPath(companyId, pathWithoutLeadingSlash) {
  const p = pathWithoutLeadingSlash.replace(/^\/+/, '');
  if (!companyId) return `/${p}`;
  return `/company/${companyId}/${p}`;
}
