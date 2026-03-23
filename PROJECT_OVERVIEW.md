## Project overview

This repository implements a **process documentation and operations management system** for a ~200‑person company. It is designed as a practical management tool rather than a static document library:

- Maps processes across four levels: **L1 (domains)**, **L2 (key processes)**, **L3 (recurring subprocesses)**, and **SOPs (step‑by‑step instructions)**.
- Ties each process to concrete management attributes: **owner, cadence, triggers, inputs/outputs, participants, metrics, systems, artifacts, done criteria, and failure modes**.
- Provides a **React/MUI front‑end** for browsing, viewing, and editing processes, and a **Node.js/Express + MongoDB** backend for validation, persistence, and index building.

Use this file as the first stop for any new AI agent or developer learning the project. For deeper conceptual background, see `context.md`.

---

## Main user‑facing features

### Process navigation & views

- **Domain index (L1)**: Each domain (e.g. Operational Management, Product Delivery) has:
  - An L1 process card with high‑level fields (`name`, `purpose`, `description`, `main_goal`, `scope`, `owner`, `when_used`, etc.).
  - Aggregated stats for the number of L2/L3/SOP items in that domain.
  - A hero section with quick access to **Edit L1**, **Create L2**, and archive actions.
- **L2 / L3 pages**:
  - Show identity, triggers, inputs/outputs, participants, systems, artifacts, metrics, and links to children.
  - Visual “process diagram” sections built from `process_steps`.
  - L3 pages list their child SOPs with navigation into each SOP.
  - Soft‑delete (archive) buttons that hide items from navigation without hard‑deleting them.
- **SOP pages**:
  - Detailed instruction view: purpose, description, main goal, owner, SLA, triggers, preconditions, inputs, outputs, result location.
  - Ordered list of steps (`process_steps`) rendered as a numbered sequence.
  - “Done criteria” displayed as a **bulleted list** for readability (not chips).
  - Linked templates/forms/links section.

### Editor & validation

- **Process editor** (`EditorPage` + `ProcessForm` + `useProcessEditor`):
  - Supports create/edit flows for **L1, L2, L3, and SOP**.
  - Uses `FIELD_ORDER` and `FIELD_DEFS` per process type to dynamically render fields with the right widgets:
    - `TextField` for simple strings (with optional `multiline`).
    - `StringArrayInput` for arrays of free‑form strings.
    - `AutocompleteInput` / `AutocompleteArrayInput` for dictionary‑backed fields (owners, participants, systems, meetings, artifacts, metrics).
    - `ObjectArrayInput` for structured arrays like `process_steps`, `typical_failures`, `process_rhythm`, `additional_materials`.
  - Sticky **Validate** / **Save** action bar in edit mode (fixed to bottom of viewport); inline in create mode.
  - Per‑field validation highlighting using `errorsByField`, including per‑cell errors inside `ObjectArrayInput` rows.
- **Backend validation**:
  - `server/validation/schemas.js` defines schemas for `process_l1`, `process_l2`, `process_l3`, and `sop`.
  - `server/validation/validator.js` enforces:
    - Required fields and types (`string`, `string[]`, `object[]`).
    - Shape validation for object arrays (`stepShape`, `failureShape`, `rhythmShape`, `materialsShape`).
    - Type consistency via `type`/`expectedType` mapping (accepts labels, type keys, and legacy ObjectId values).
  - `autoFill` populates `updated_at` and default `version` on save.
  - `/api/validate` endpoint enables “Validate” in the editor without saving.

### Dictionary‑backed references

- **Dictionary data** stored in Mongo (`Dictionary` model) and exposed as:
  - `owner`, `participants`, `linked_systems`, `linked_meetings`, `linked_artifacts`, `metrics_signals`, `process_type`.
- **Conversion utilities** (`server/services/processDictionaryRefs.js` and `dictionaryTerms.js`):
  - On **read**: convert stored ObjectIds into human‑readable labels for all dictionary fields, including `type`.
  - On **write**: convert labels back into IDs/ObjectIds (`labelsToIds`, `refsToObjectIds`) before persistence.
- Front‑end editor uses these labels as suggestion lists in Autocomplete inputs.

### Media & materials

- **Video guides**:
  - New `video_guides: string[]` field on all process types.
  - Editor lets users paste raw **iframe HTML** or direct URLs; the value is normalized:
    - On input, the editor extracts the `src="..."` URL from any iframe snippet.
    - The backend stores only the URL.
  - `VideoEmbed` component:
    - Normalizes common YouTube URLs (`watch?v=...`, `youtu.be/...`) to embed URLs.
    - If an iframe HTML string somehow reaches the view, it again extracts `src`.
    - Renders a responsive 16:9 iframe.
  - A default YouTube embed URL is applied via `applySchemaDefaults` when a process doesn’t have explicit `video_guides`.
- **Additional materials**:
  - `additional_materials: { label: string, url: string }[]` field on all process types.
  - Editor uses `ObjectArrayInput` with a `materialsShape` (`label`, `url`).
  - `AdditionalMaterialsList` renders them as a list of links with optional URL subtitles.
  - `ProcessMediaSection` groups video guides and additional materials into a reusable “Материалы” section, used on L1/L2/L3/SOP pages.

### Soft delete (archive)

- All levels (L1, L2, L3, SOP) support **soft delete**:
  - `archived` flag added to common schema fields and data models.
  - Archive actions on pages (`DomainPage`, `L2Page`, `L3Page`, `SopPage`) call `archiveProcess(...)`:
    - Fetch process JSON.
    - Set `archived: true`.
    - Save via PUT and rebuild the domain index.
  - Index builder (`indexUpdater`) excludes archived items from navigation trees.
  - UI shows an “Архивный” chip where appropriate.

### Caching & freshness

- Frontend data hook `useProcessData` uses a small in‑memory cache for GETs but **skips caching per‑process JSON** (`/api/processes/:domain/...`) so views always reflect the latest saved state after an edit.

---

## High‑level architecture

### Frontend (React + MUI)

- **Routing**: `HashRouter` in `[src/App.jsx]` with routes:
  - `/` – domain list (`DomainsPage`).
  - `/registry` – global registry of all processes (`RegistryPage`).
  - `/dictionaries` – dictionary editor.
  - `/domain/:domainId` – L1 domain page (`DomainPage`).
  - `/domain/:domainId/l2/:l2Folder` – L2 page (`L2Page`).
  - `/domain/:domainId/l3/:l2Folder/:l3Folder` – L3 page (`L3Page`).
  - `/domain/:domainId/sop/:l2Folder/:l3Folder/:sopFile` – SOP page (`SopPage`).
  - `/create` and `/domain/:domainId/create` – unified create (`EditorPage`): **«Уровень и родитель»** includes **домен (L1)**, уровень (L2/L3/SOP) и родители; на `/create` домен без `:domainId` в URL хранится в состоянии формы. Legacy paths `/domain/.../create/l2`, `/create/l3`, `/create/sop` still work.
  - `/domain/.../edit` and `/domain/.../create/...` – process editor (`EditorPage`).
- **Layout**:
  - `Layout` defines main shell, app bar, and left sidebar (`Sidebar`) for domain/L2/L3/SOP navigation.
  - `DRAWER_WIDTH` is exported and reused (e.g. by `ProcessForm` for sticky button bar offset).
- **Key components**:
  - `ProcessIdentitySection`, `ProcessDiagram`, `ProcessSteps`, `ProcessConnectionsSection`, `FailuresTable`, `ProcessMediaSection`.
  - `ChipList`, `Field`, `SectionHeading`, `SubprocessTable`, `SopCard` (used in registry/architecture views).
  - Editor components under `src/components/editor/`: `ProcessForm`, `StringArrayInput`, `ObjectArrayInput`, `AutocompleteInput`, `AutocompleteArrayInput`.
- **State & hooks**:
  - `useProcessData` – domain/master index data and low‑level JSON fetchers with caching rules.
  - `useProcessEditor` – editor state, load/save, validation, and redirect logic.
  - `useDomainData` – convenience wrapper for domain‑scoped data.

### Backend (Node.js + Express + Mongo)

- **Entrypoint**: `server/routes/processes.js` exposes:
  - `GET /api/processes` – master index.
  - `GET /api/processes/:domainId` – domain index (built from `ProcessDocument`s via `indexUpdater`).
  - `GET /api/processes/:domainId/*rest` – raw process/SOP JSON (with dictionary labels resolved, schema defaults applied).
  - `POST /api/processes/:domainId/l2` – create L2 process.
  - `POST /api/processes/:domainId/:l2Folder/l3` – create L3.
  - `POST /api/processes/:domainId/:l2Folder/:l3Folder/sop` – create SOP.
  - `PUT /api/processes/:domainId/*rest` – update existing process/SOP.
  - `POST /api/validate` – dry‑run validation.
- **Process repository abstraction** (`server/services/dataLayer`):
  - `JsonProcessRepository` – filesystem‑backed (original implementation).
  - `MongoProcessRepository` – MongoDB‑backed (current main path).
  - Both implement `getMasterIndex`, `getDomainIndex`, `getProcessByPath`, `createL2/L3/Sop`, `updateProcess`, `rebuildDomainIndex`.
- **Database models** (`server/services/db/models`):
  - `ProcessDocument` – stores:
    - `domainId`, `level` (`l1|l2|l3|sop`), `folderPath`, `fileName`, `type` (process_type ref), `data` (validated sub‑document), `domainPath` (unique key).
    - Level‑specific sub‑schemas for `data` enforce structure close to the validation schemas (but more permissive in some optional fields).
  - `Dictionary` – single `key='main'` document holding all dictionary term arrays (`values`).
  - `MasterIndex` – single `key='master'` document holding the global domains index used by the frontend.

---

## Coding principles & conventions

### General principles

- **Pragmatic, not academic**:
  - Processes are treated as real management tools: every process document must meaningfully answer:
    - When do we use this? Who owns it? Who participates? What are the inputs/outputs? Where is it tracked? What is “done”? What happens if it fails?
- **Levels are strictly separated**:
  - L1/L2 – architectural/management view (short, high‑level).
  - L3 – practical recurring routines (mid‑detail).
  - SOP – concrete, step‑by‑step instructions (most detailed).
- **Single source of truth for schemas**:
  - Validation schemas and Mongoose schemas are kept in sync conceptually and extended carefully (e.g. when adding `video_guides` and `additional_materials`).

### Frontend style

- **Components**:
  - Prefer small, composable components (`ProcessIdentitySection`, `ProcessMediaSection`, `DoneCriteriaList`, etc.).
  - Use Material‑UI components for layout and UX; keep custom CSS minimal and inline via `sx`.
- **Forms**:
  - `ProcessForm` builds the UI from `FIELD_ORDER` and `FIELD_DEFS`:
    - Easy to add new fields or change ordering by editing a single configuration map.
  - Validation messages:
    - Global errors shown in an `Alert`.
    - Field‑level errors from `errorsByField` or message scanning.
    - Object array fields show per‑row/per‑cell errors via `buildRowErrors`.
- **Routing**:
  - Use `HashRouter` to avoid server‑side route configuration.
  - Keep URLs semantic and stable, even if underlying JSON file names end with `.json` (e.g. `sop-01.json` as `:sopFile`).

### Backend style

- **Validation before persistence**:
  - All create/update operations go through `validate(...)` and dictionary conversion before touching Mongo.
- **Pure helpers where possible**:
  - `getEditApiPath`, `getSaveRequest`, `getRedirectAfterSave` in `useProcessEditor` keep editor logic clean and testable.
  - `getTypeKeyFromRelativePath` infers process types from URL paths to robustly handle legacy/missing `data.type`.
- **Soft delete over hard delete**:
  - Use `archived` flags and index filtering to hide processes instead of removing them from storage.

---

## Suggested reading order for new AI agents / developers

1. **Conceptual background**: `context.md` – why the system exists, levels, and required fields.
2. **High‑level behavior**: this file (`PROJECT_OVERVIEW.md`) for features and architecture.
3. **Frontend structure**:
   - `src/App.jsx` – routes.
   - `src/components/Layout.jsx`, `src/components/Sidebar.jsx`.
   - `src/pages/DomainPage.jsx`, `L2Page.jsx`, `L3Page.jsx`, `SopPage.jsx`.
   - `src/components/editor/ProcessForm.jsx` and supporting editor inputs.
4. **Backend structure**:
   - `server/routes/processes.js`.
   - `server/validation/schemas.js`, `server/validation/validator.js`.
   - `server/services/dataLayer/mongoProcessRepository.js`, `server/services/indexUpdater.js`.
   - `server/services/processDictionaryRefs.js`, `server/services/dictionaryTerms.js`.

Understanding these pieces will give a new agent enough context to safely extend the system (e.g. adding new fields, new views, or new validation rules) without breaking the existing behavior.   

