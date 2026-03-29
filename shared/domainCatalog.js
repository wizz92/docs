import { DEFAULT_COMPANY_SLUG } from './companies.js';

/**
 * Canonical L1 domain categories (9). Every company should have one domain per category.
 * Master index entries use `categorySlug` as the join key; `id` may be `categorySlug` (Qwerty)
 * or `<companySlug>-<categorySlug>` for other companies.
 */

export const DOMAIN_CATALOG = [
  {
    categorySlug: 'operational-management',
    name: 'Operational Management',
    name_ru: 'Операционное управление',
    category: 'Operations',
    description_ru:
      'Процессы ежедневного и еженедельного управления выполнением целей, проектами, эскалациями и зависимостями.',
    color: '#1976d2',
  },
  {
    categorySlug: 'strategy-governance',
    name: 'Strategy & Governance',
    name_ru: 'Стратегия и управление',
    category: 'Strategy',
    description_ru:
      'Процессы, через которые компания определяет направление, распределяет ресурсы и задаёт управленческие правила.',
    color: '#7b1fa2',
  },
  {
    categorySlug: 'business-development',
    name: 'Business Development & Growth',
    name_ru: 'Развитие бизнеса и рост',
    category: 'Growth',
    description_ru:
      'Процессы поиска новых направлений, тестирования гипотез роста и запуска новых бизнес-инициатив.',
    color: '#e65100',
  },
  {
    categorySlug: 'product-delivery',
    name: 'Product / Delivery / Production',
    name_ru: 'Продукт и доставка',
    category: 'Core',
    description_ru:
      'Процессы создания продукта, delivery результатов, выполнения спринтов, релизов и производственного цикла.',
    color: '#2e7d32',
  },
  {
    categorySlug: 'revenue-operations',
    name: 'Revenue & Commercial Operations',
    name_ru: 'Выручка и коммерция',
    category: 'Revenue',
    description_ru:
      'Процессы монетизации, коммерческих операций, работы с партнёрами и оптимизации unit economics.',
    color: '#c62828',
  },
  {
    categorySlug: 'hr-organization',
    name: 'HR & Organization',
    name_ru: 'HR и организация',
    category: 'Support',
    description_ru:
      'Процессы, которые обеспечивают компанию людьми, ролями, адаптацией, развитием и организационной устойчивостью.',
    color: '#00695c',
  },
  {
    categorySlug: 'finance-control',
    name: 'Finance & Control',
    name_ru: 'Финансы и контроль',
    category: 'Support',
    description_ru:
      'Процессы управления бюджетом, расходами, платежами и финансовой дисциплиной компании.',
    color: '#37474f',
  },
  {
    categorySlug: 'it-systems-security',
    name: 'IT / Systems / Security',
    name_ru: 'ИТ, системы и безопасность',
    category: 'Support',
    description_ru:
      'Процессы обеспечения сотрудников системами, доступами, поддержкой, инфраструктурой и базовой безопасностью.',
    color: '#0d47a1',
  },
  {
    categorySlug: 'transformation-automation',
    name: 'Transformation & Automation',
    name_ru: 'Трансформация и автоматизация',
    category: 'Development',
    description_ru:
      'Процессы развития компании: улучшение процессов, автоматизация, внедрение ИИ и организационные изменения.',
    color: '#4a148c',
  },
];

export const REQUIRED_CATEGORY_SLUGS = DOMAIN_CATALOG.map((c) => c.categorySlug);

const CATALOG_BY_SLUG = Object.fromEntries(
  DOMAIN_CATALOG.map((c) => [c.categorySlug, c]),
);

export function getCatalogEntry(categorySlug) {
  return CATALOG_BY_SLUG[categorySlug] || null;
}

/**
 * @param {string} companySlug
 * @param {string} categorySlug
 */
export function domainIdForCompanyCategory(companySlug, categorySlug) {
  if (companySlug === DEFAULT_COMPANY_SLUG) {
    return categorySlug;
  }
  return `${companySlug}-${categorySlug}`;
}

/**
 * Resolve category slug for a master-index domain row (supports legacy rows without categorySlug).
 * @param {{ id: string, companyId?: string, categorySlug?: string }} domain
 */
export function getCategorySlugForDomain(domain) {
  if (domain.categorySlug) return domain.categorySlug;
  const cid = domain.companyId || DEFAULT_COMPANY_SLUG;
  const prefix = `${cid}-`;
  if (domain.id.startsWith(prefix)) return domain.id.slice(prefix.length);
  return domain.id;
}
