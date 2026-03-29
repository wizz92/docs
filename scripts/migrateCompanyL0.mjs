/**
 * One-time MongoDB migration: add `company` dictionary terms and `companyId` on master index domains.
 * Run: node -r dotenv/config scripts/migrateCompanyL0.mjs
 */
import mongoose from 'mongoose';
import { MasterIndex, Dictionary } from '../server/services/db/mongoClient.js';
import { normalizeDictionaryToTerms } from '../server/services/dictionaryTerms.js';
import { DEFAULT_COMPANY_SLUG } from '../shared/companies.js';
import { getCategorySlugForDomain } from '../shared/domainCatalog.js';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI required');
    process.exit(1);
  }
  await mongoose.connect(uri);

  const dictDoc = await Dictionary.findOne({ key: 'main' }).exec();
  if (dictDoc?.values) {
    const raw = { ...dictDoc.values };
    if (!Array.isArray(raw.company) || raw.company.length === 0) {
      const normalized = normalizeDictionaryToTerms(raw);
      dictDoc.values = normalized;
      await dictDoc.save();
      console.log('Dictionary: seeded company terms');
    } else {
      console.log('Dictionary: company already present, skipping');
    }
  }

  const master = await MasterIndex.findOne({ key: 'master' }).exec();
  if (master?.data?.domains?.length) {
    let nCompany = 0;
    let nCat = 0;
    for (const d of master.data.domains) {
      if (d.companyId == null || d.companyId === '') {
        d.companyId = DEFAULT_COMPANY_SLUG;
        nCompany++;
      }
      if (d.categorySlug == null || d.categorySlug === '') {
        d.categorySlug = getCategorySlugForDomain({ id: d.id, companyId: d.companyId });
        nCat++;
      }
    }
    if (nCompany > 0 || nCat > 0) {
      master.markModified('data');
      await master.save();
      console.log(
        `MasterIndex: set companyId on ${nCompany} domains, categorySlug on ${nCat} domains`,
      );
    } else {
      console.log('MasterIndex: companyId and categorySlug already set on all domains');
    }
  }

  await mongoose.disconnect();
  console.log('Done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
