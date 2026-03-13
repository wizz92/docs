## Data layer and future DB migration

This folder contains storage-agnostic repositories and their JSON-backed implementations:

- `repositories.js` – JSDoc typedefs for `ProcessRepository`, `TemplateRepository`, and `DictionaryRepository`.
- `jsonProcessRepository.js` – implements `ProcessRepository` using the existing `public/processes/**` JSON tree, `folderManager`, and `indexUpdater`.
- `jsonTemplateRepository.js` – implements `TemplateRepository` over the `templates/template-*.json` files.
- `jsonDictionaryRepository.js` – implements `DictionaryRepository` over `public/dictionaries/dictionaries.json` and the dictionary scanner.
- `index.js` – exports singleton instances: `processRepository`, `templateRepository`, `dictionaryRepository`, currently always JSON-backed, with a `DATA_BACKEND` switch point for future databases.

### Follow-up: align frontend reads to the data layer

Currently the frontend hooks:

- `src/hooks/useProcessData.js`
- `src/hooks/useProcessEditor.js`

still read JSON directly from `/processes/**` (served from `public/processes/**`) for most view operations, and only use the `/api/processes/**` endpoints for writes.

To fully decouple the app from JSON files and prepare for a Mongo-like backend:

1. **Add read endpoints backed by `ProcessRepository`**  
   - e.g. `GET /api/processes/:domainId/index` → `processRepository.getDomainIndex(domainId)`  
   - e.g. `GET /api/processes/:domainId/path/*rest` → `processRepository.getProcessByPath(domainId, rest)`

2. **Switch `useProcessData` to use the API instead of static JSON**  
   - Replace `fetch('/processes/index.json')` with `fetch('/api/processes')`.  
   - Replace per-domain index fetches like `/processes/<domainId>/index.json` with `/api/processes/<domainId>` or the new `index` endpoint.  
   - For detailed JSON loads, route them through the new `path/*` API endpoint.

3. **Keep URLs and response shapes stable**  
   - Ensure the API responses match the current JSON structures so pages do not need to change their expectations.

Once these steps are done, turning on a DB-backed implementation (by adding e.g. a `MongoProcessRepository` and wiring it into `DATA_BACKEND=db`) will transparently move all reads and writes off the filesystem while keeping the rest of the app unchanged.

