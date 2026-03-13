## Data layer schema

### processDocuments collection

- **_id**: string (NeDB-generated)
- **domainId**: string – domain key, e.g. `operational-management`.
- **level**: `'l1' | 'l2' | 'l3' | 'sop'` – hierarchy level.
- **folderPath**: string – relative folder path inside the domain:
  - L1: `''` (empty string).
  - L2: e.g. `'01-operational-planning'`.
  - L3: e.g. `'01-operational-planning/01-roadmap-planning'`.
  - SOP: same as its parent L3, e.g. `'01-operational-planning/01-roadmap-planning'`.
- **fileName**: string – `'process.json'` for L1/L2/L3 or `'sop-NN.json'` for SOPs.
- **type**: string – validator type, one of:
  - `'process_l1'`, `'process_l2'`, `'process_l3'`, `'sop'`.
- **data**: object – original JSON contents of the process or SOP, including:
  - `name`
  - `type`
  - dictionary-related fields: `owner`, `participants`, `linked_systems`, `linked_meetings`, `linked_artifacts`, `metrics_signals`
  - relationship helpers: `linked_l3_subprocesses`, `linked_sop` (recomputed, see below).
- **domainPath**: string – `<domainId>/<relativePath>`, where `relativePath = path.join(folderPath, fileName)`; used as a unique key for lookups.

### dictionaries collection

- Single document with:
  - **key**: `'main'`
  - **values**: object mapping dictionary field → sorted unique string array:
    - `owner: string[]`
    - `participants: string[]`
    - `linked_systems: string[]`
    - `linked_meetings: string[]`
    - `linked_artifacts: string[]`
    - `metrics_signals: string[]`

### Relationships and derived fields

- **linked_l3_subprocesses** (on L2 `data`):
  - Derived from all L3 processes whose `folderPath` starts with the L2 `folderPath` plus `/`.
  - Contains the list of L3 `data.name` values.
- **linked_sop** (on L2 and L3 `data`):
  - On L3: names of all SOPs under that L3 folder.
  - On L2: names of all SOPs under all L3 folders belonging to that L2.
- **summary** (per-domain, not stored in documents):
  - `total_l2`, `total_l3`, `total_sop`, `total_files`.
  - Computed by `buildDomainTree(domainId, docs)` inside `DbProcessRepository.rebuildDomainIndex` / `getDomainIndex`.

