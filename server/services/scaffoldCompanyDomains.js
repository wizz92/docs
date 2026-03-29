import {
  DOMAIN_CATALOG,
  domainIdForCompanyCategory,
  getCategorySlugForDomain,
  REQUIRED_CATEGORY_SLUGS,
} from '../../shared/domainCatalog.js';
import { DEFAULT_COMPANY_SLUG } from '../../shared/companies.js';
import { buildScaffoldL1Json } from './scaffoldL1Data.js';

/**
 * Create missing L1 domains for a company from the domain catalog.
 * @param {import('./dataLayer/repositories.js').ProcessRepository} processRepository
 * @param {string} companySlug
 * @param {string[]|undefined} categorySlugsFilter - `undefined` = all missing categories; empty array = none; otherwise only listed slugs (if still missing)
 * @returns {Promise<{ created: string[], alreadyPresent: string[] }>}
 */
export async function scaffoldCompanyDomains(processRepository, companySlug, categorySlugsFilter) {
  const master = await processRepository.getMasterIndex();
  const domains = master.domains || [];

  const byCategory = new Map();
  for (const d of domains) {
    if ((d.companyId || DEFAULT_COMPANY_SLUG) !== companySlug) continue;
    const slug = getCategorySlugForDomain(d);
    byCategory.set(slug, d.id);
  }

  const alreadyPresent = REQUIRED_CATEGORY_SLUGS.filter((s) => byCategory.has(s)).map(
    (s) => byCategory.get(s),
  );

  const want =
    categorySlugsFilter === undefined
      ? DOMAIN_CATALOG
      : DOMAIN_CATALOG.filter((c) => categorySlugsFilter.includes(c.categorySlug));

  const created = [];
  for (const cat of want) {
    if (byCategory.has(cat.categorySlug)) continue;

    const domainId = domainIdForCompanyCategory(companySlug, cat.categorySlug);
    const domainEntry = {
      id: domainId,
      name: cat.name,
      name_ru: cat.name_ru,
      category: cat.category,
      description_ru: cat.description_ru,
      index_path: `processes/${domainId}/index.json`,
      color: cat.color,
      companyId: companySlug,
      categorySlug: cat.categorySlug,
    };
    const l1Data = buildScaffoldL1Json(cat);
    await processRepository.createDomain(domainEntry, l1Data);
    await processRepository.rebuildDomainIndex(domainId);
    created.push(domainId);
    byCategory.set(cat.categorySlug, domainId);
  }

  return { created, alreadyPresent };
}
