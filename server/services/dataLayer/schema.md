## Data layer schema

### processDocuments collection

- **domainId**: string, indexed -- domain key, e.g. `operational-management`.
- **level**: `'l1' | 'l2' | 'l3' | 'sop'` -- hierarchy level.
- **folderPath**: string -- relative folder path inside the domain:
  - L1: `''` (empty string).
  - L2: e.g. `'01-operational-planning'`.
  - L3: e.g. `'01-operational-planning/01-roadmap-planning'`.
  - SOP: same as its parent L3, e.g. `'01-operational-planning/01-roadmap-planning'`.
- **fileName**: string -- `'process.json'` for L1/L2/L3 or `'sop-NN.json'` for SOPs.
- **type**: ObjectId, indexed -- references a `process_type` dictionary term. Resolved to/from label strings (`Process L1`, `Process L2`, `Process L3`, `SOP`) at the API boundary.
- **data**: object -- validated against a level-specific Mongoose sub-schema (see below). Contains:
  - `name`: string, required
  - `type`: ObjectId, required -- same process_type reference as the document-level `type` field
  - `purpose`, `description`, `main_goal`, `when_used`: string, required
  - `triggers`, `inputs`, `outputs`: string[], required
  - `owner`: ObjectId, required -- references a dictionary term in the `owner` field
  - `participants`: ObjectId[] -- references dictionary terms in `participants`
  - `metrics_signals`: ObjectId[], required -- references dictionary terms in `metrics_signals`
  - `version`, `updated_at`: string, optional
  - **ObjectId reference fields** (stored as ObjectId, converted to/from string at the API boundary):
    - `linked_systems` -- ObjectId[] referencing dictionary terms in `linked_systems`
    - `linked_meetings` -- ObjectId[] referencing dictionary terms in `linked_meetings`
    - `linked_artifacts` -- ObjectId[] referencing dictionary terms in `linked_artifacts`
  - relationship helpers: `linked_l3_subprocesses`, `linked_sop` (recomputed on rebuild).
- **domainPath**: string, unique index -- `<domainId>/<relativePath>`, where `relativePath = path.join(folderPath, fileName)`; used as a unique key for lookups.

#### Data sub-schemas by level

A `pre('validate')` hook on `ProcessDocument` selects the appropriate sub-schema based on `level` and validates `data` against it.

**L1 data** (`l1DataSchema`): common fields plus:
- `scope`: string
- `linked_meetings`, `linked_artifacts`, `linked_systems`: Mixed[]
- `process_steps`: `[{ step: string required, description: string }]`
- `review_cadence`: string, required
- `access_level`: string, required

**L2 data** (`l2DataSchema`): common fields plus:
- `linked_l3_subprocesses`: string[], required
- `linked_sop`: string[], required
- `linked_meetings`: Mixed[]
- `process_steps`: `[{ step, description }]`, required
- `process_rhythm`: `[{ horizon, ritual, key_question, result }]`
- `typical_failures`: `[{ failure, symptom, action }]`
- `linked_artifacts`, `linked_systems`: Mixed[]
- `review_cadence`: string, required
- `access_level`: string, required

**L3 data** (`l3DataSchema`): common fields plus:
- `cadence`: string, required
- `process_steps`: `[{ step, description }]`, required
- `linked_meetings`, `linked_artifacts`, `linked_systems`: Mixed[]
- `linked_sop`: string[], required
- `done_criteria`: string[], required
- `typical_failures`: `[{ failure, symptom, action }]`, required

**SOP data** (`sopDataSchema`): common fields plus:
- `preconditions`: string[], required
- `process_steps`: `[{ step, description }]`, required
- `result_location`: string, required
- `done_criteria`: string[], required
- `sla`: string
- `typical_failures`: `[{ failure, symptom, action }]`
- `linked_templates_forms_links`: string[]

Indexes:
- `{ domainId: 1 }` -- getDomainIndex, createL2/L3/SOP, rebuildDomainIndex
- `{ domainPath: 1 }` unique -- getProcessByPath, updateProcess, migration upsert
- `{ type: 1 }` -- type-filtered queries

### dictionaries collection

- Single document with:
  - **key**: `'main'`, unique index
  - **values**: object mapping dictionary field -> array of terms:
    - For all fields (`owner`, `participants`, `linked_systems`, `linked_meetings`, `linked_artifacts`, `metrics_signals`, `process_type`):
      - `{ id: ObjectId, label: string }` -- term.id is stored as a MongoDB ObjectId.

  Conversion helpers in `dictionaryTerms.js`:
  - `rawValuesToTerms(values)` -- converts ObjectId ids to strings on read from DB.
  - `termsToRawForDb(values)` -- converts string ids back to ObjectId on write to DB (all fields including `process_type`).
  - A `pre('save')` hook on the Dictionary model enforces ObjectId conversion as a safety net.

### masterIndexes collection

- Single document with:
  - **key**: `'master'`, unique index
  - **data**: object -- full master `index.json` content including `domains` array with id, name, color, etc.

### Relationships and derived fields

- **linked_l3_subprocesses** (on L2 `data`):
  - Derived from all L3 processes whose `folderPath` starts with the L2 `folderPath` plus `/`.
  - Contains the list of L3 `data.name` values.
- **linked_sop** (on L2 and L3 `data`):
  - On L3: names of all SOPs under that L3 folder.
  - On L2: names of all SOPs under all L3 folders belonging to that L2.
- **summary** (per-domain, not stored in documents):
  - `total_l2`, `total_l3`, `total_sop`, `total_files`.
  - Computed by `buildDomainTree(domainId, docs)` in `processRepositoryHelpers.js`.

### API boundary conversion

- **Write path**: `labelsToIds()` converts labels to string IDs, then `refsToObjectIds()` converts string IDs to ObjectIds (including `type` → `process_type` ObjectId) using the raw dictionary values from MongoDB.
- **Read path**: `resolveProcessDictionaryRefs()` converts ObjectId/string IDs back to human-readable labels using `idToString()` which calls `.toString()` on any value.
- **Validation**: Runs before ID/ObjectId conversion so the validator sees human-readable labels. The `resolveTypeKey()` helper maps labels and legacy type strings to schema keys.
