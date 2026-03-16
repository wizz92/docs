## Data layer

This folder contains storage-agnostic repositories and their implementations:

- `repositories.js` – JSDoc typedefs for `ProcessRepository`, `TemplateRepository`, and `DictionaryRepository`.
- `index.js` – exports singleton instances based on `DATA_BACKEND` env var (`json` or `mongodb`).

### JSON backend (default)

- `jsonProcessRepository.js` – implements `ProcessRepository` using the `public/processes/**` JSON tree.
- `jsonDictionaryRepository.js` – implements `DictionaryRepository` over `public/dictionaries/dictionaries.json`.
- `jsonTemplateRepository.js` – implements `TemplateRepository` over `templates/template-*.json` files.

### MongoDB backend

- `mongoProcessRepository.js` – implements `ProcessRepository` using Mongoose (`ProcessDocument`, `MasterIndex`).
- `mongoDictionaryRepository.js` – implements `DictionaryRepository` using Mongoose (`Dictionary`).
- Templates stay file-based (`jsonTemplateRepository.js`) for all backends.

### Helpers

- `processRepositoryHelpers.js` – shared utilities: `buildDomainTree`, `nextNumberedFolder`, `nextSopFileName`, `toKebab`.
- `rebuildDictionariesFromDb.js` – aggregates strings from process data and rebuilds the dictionary.

### Switching to MongoDB

1. Install and start MongoDB (local: `brew services start mongodb-community`, or use Atlas).
2. Set env vars in `.env`:
   ```
   DATA_BACKEND=mongodb
   MONGODB_URI=mongodb://localhost:27017/processportal
   ```
3. Run the migration to import JSON data: `npm run db:seed-mongo`
   - For incremental re-runs without wiping: `npm run db:seed-mongo -- --upsert`
4. Start the server: `npm run dev:server`

The frontend requires no code changes when switching: it uses only the `/api/processes` and `/api/dictionaries` endpoints, which have the same response shape for both backends. The app bar shows a "Data: JSON" or "Data: MongoDB" indicator (from `GET /api/backend`) so you can confirm which backend is active.

### Rebuilding dictionaries

- `npm run db:rebuild-dict` – rebuilds dictionaries from process data (works for both JSON and MongoDB backends).

### Schema

See `schema.md` for the full MongoDB collection and field documentation.
