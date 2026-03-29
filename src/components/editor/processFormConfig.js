import { PROCESS_FIELD_MANIFEST } from '../../../shared/processFieldManifest.js';

export const STEP_FIELDS = [
  { key: 'step', label: 'Step (3-5 words)' },
  { key: 'description', label: 'Description', multiline: true },
];

export const FAILURE_FIELDS = [
  { key: 'failure', label: 'Failure' },
  { key: 'symptom', label: 'Symptom' },
  { key: 'action', label: 'Action', multiline: true },
];

export const RHYTHM_FIELDS = [
  { key: 'horizon', label: 'Horizon' },
  { key: 'ritual', label: 'Ritual' },
  { key: 'key_question', label: 'Key Question' },
  { key: 'result', label: 'Result' },
];

export const MATERIALS_FIELDS = [
  { key: 'label', label: 'Название материала' },
  { key: 'url', label: 'URL' },
];

export const LABELS = {
  name: 'Название', purpose: 'Назначение', description: 'Описание',
  main_goal: 'Основная цель', when_used: 'Когда используется',
  owner: 'Владелец', cadence: 'Периодичность', access_level: 'Уровень доступа',
  review_cadence: 'Периодичность пересмотра', scope: 'Границы',
  result_location: 'Где хранится результат', sla: 'SLA',
  triggers: 'Триггеры', inputs: 'Входы', outputs: 'Выходы',
  participants: 'Участники / роли', preconditions: 'Preconditions',
  linked_meetings: 'Связанные встречи', linked_artifacts: 'Связанные артефакты',
  linked_systems: 'Связанные системы', metrics_signals: 'Метрики / сигналы',
  done_criteria: 'Done criteria', linked_sop: 'Связанные SOP',
  linked_l3_subprocesses: 'Связанные L3 подпроцессы',
  linked_templates_forms_links: 'Шаблоны / ссылки',
  process_steps: 'Этапы процесса', typical_failures: 'Типовые сбои',
  process_rhythm: 'Ритм процесса',
  video_guides: 'Видео-инструкции',
  additional_materials: 'Дополнительные материалы',
};

export const AUTO_MANAGED = new Set(['linked_sop', 'linked_l3_subprocesses', 'type', 'version', 'updated_at', 'archived']);

const MULTILINE_STRING_FIELDS = new Set(['purpose', 'description', 'main_goal', 'scope']);

const SHAPE_KEY_TO_FORM_SHAPE = {
  step: 'step',
  failure: 'failure',
  failureOptional: 'failure',
  rhythm: 'rhythm',
  materials: 'materials',
};

function buildFieldDefs() {
  /** @type {Record<string, Record<string, object>>} */
  const out = {};
  for (const [typeKey, spec] of Object.entries(PROCESS_FIELD_MANIFEST)) {
    /** @type {Record<string, object>} */
    const defs = {};
    for (const [name, rule] of Object.entries(spec.fields)) {
      if (rule.editorExclude) continue;
      const def = { type: rule.type, required: rule.required };
      if (rule.type === 'string' && MULTILINE_STRING_FIELDS.has(name)) {
        def.multiline = true;
      }
      if (rule.dictionary) {
        def.suggestions = rule.dictionary;
      }
      if (rule.readOnly) {
        def.readOnly = true;
      }
      if (rule.type === 'object[]' && rule.shapeKey) {
        def.shape = SHAPE_KEY_TO_FORM_SHAPE[rule.shapeKey];
      }
      defs[name] = def;
    }
    out[typeKey] = defs;
  }
  return out;
}

/** Dictionary values may be string[] (legacy) or { id, label }[]; return labels for options. */
export function getDictionaryLabels(dictionary, key) {
  const arr = dictionary[key];
  if (!Array.isArray(arr)) return [];
  return arr.map((t) => (typeof t === 'string' ? t : (t && t.label) || ''));
}

export const FIELD_ORDER = {
  process_l1: [...PROCESS_FIELD_MANIFEST.process_l1.fieldOrder],
  process_l2: [...PROCESS_FIELD_MANIFEST.process_l2.fieldOrder],
  process_l3: [...PROCESS_FIELD_MANIFEST.process_l3.fieldOrder],
  sop: [...PROCESS_FIELD_MANIFEST.sop.fieldOrder],
};

export const FIELD_DEFS = buildFieldDefs();

export const SHAPES = {
  step: STEP_FIELDS,
  failure: FAILURE_FIELDS,
  rhythm: RHYTHM_FIELDS,
  materials: MATERIALS_FIELDS,
};

export function fieldError(errors, fieldName) {
  return errors.filter((e) => e.includes(`"${fieldName}"`)).join('; ') || undefined;
}

/** Build per-row, per-subfield errors for ObjectArrayInput from errorsByField keys like "process_steps.0.step". */
export function buildRowErrors(errorsByField, fieldName) {
  if (!errorsByField || typeof errorsByField !== 'object') return undefined;
  const prefix = `${fieldName}.`;
  const rowErrors = {};
  for (const key of Object.keys(errorsByField)) {
    if (!key.startsWith(prefix)) continue;
    const rest = key.slice(prefix.length);
    const parts = rest.split('.');
    if (parts.length === 1) {
      const idx = parseInt(parts[0], 10);
      if (!Number.isNaN(idx)) {
        rowErrors[idx] = rowErrors[idx] || {};
        rowErrors[idx]._ = (errorsByField[key] || []).join('; ');
      }
    } else if (parts.length === 2) {
      const [idxStr, subKey] = parts;
      const idx = parseInt(idxStr, 10);
      if (!Number.isNaN(idx) && subKey) {
        rowErrors[idx] = rowErrors[idx] || {};
        rowErrors[idx][subKey] = (errorsByField[key] || []).join('; ');
      }
    }
  }
  return Object.keys(rowErrors).length ? rowErrors : undefined;
}
