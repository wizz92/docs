## Data layer

This folder contains storage-agnostic repositories and their implementations:

- `repositories.js` – JSDoc typedefs for `ProcessRepository`, `TemplateRepository`, and `DictionaryRepository`.
- `index.js` – exports singleton instances. Requires `MONGODB_URI` (process + dictionary data in MongoDB).

### MongoDB (runtime)

- `mongoProcessRepository.js` – implements `ProcessRepository` using Mongoose (`ProcessDocument`, `MasterIndex`).
- `mongoDictionaryRepository.js` – implements `DictionaryRepository` using Mongoose (`Dictionary`).

### Templates (files)

- `jsonTemplateRepository.js` – loads authoring templates from repo-root `templates/template-*.json` (not application data).

### Helpers

- `processRepositoryHelpers.js` – shared utilities: `buildDomainTree`, `nextNumberedFolder`, `nextSopFileName`, `toKebab`.
- `rebuildDictionariesFromDb.js` – aggregates strings from process documents in MongoDB and rebuilds the dictionary.

### Initial data / seeding

JSON snapshots for one-time import live under `seed-data/` (see `seed-data/README.md`). Import with:

```bash
npm run db:seed-mongo
# incremental: npm run db:seed-mongo -- --upsert
```

The frontend uses `/api/processes` and `/api/dictionaries` only. The app bar shows MongoDB connection status from `GET /api/backend`.

### Rebuilding dictionaries

- `npm run db:rebuild-dict` – rebuilds dictionaries from process documents in MongoDB.

### Schema

See `schema.md` for the full MongoDB collection and field documentation.
