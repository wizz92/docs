import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StringArrayInput from './StringArrayInput';
import ObjectArrayInput from './ObjectArrayInput';
import AutocompleteArrayInput from './AutocompleteArrayInput';
import AutocompleteInput from './AutocompleteInput';

const STEP_FIELDS = [
  { key: 'step', label: 'Step (3-5 words)' },
  { key: 'description', label: 'Description', multiline: true },
];

const FAILURE_FIELDS = [
  { key: 'failure', label: 'Failure' },
  { key: 'symptom', label: 'Symptom' },
  { key: 'action', label: 'Action', multiline: true },
];

const RHYTHM_FIELDS = [
  { key: 'horizon', label: 'Horizon' },
  { key: 'ritual', label: 'Ritual' },
  { key: 'key_question', label: 'Key Question' },
  { key: 'result', label: 'Result' },
];

const LABELS = {
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
};

const AUTO_MANAGED = new Set(['linked_sop', 'linked_l3_subprocesses', 'type', 'version', 'updated_at']);

const FIELD_ORDER = {
  process_l2: [
    '_section:Идентификация', 'name', 'purpose', 'description', 'main_goal',
    '_section:Контекст', 'when_used', 'owner', 'access_level', 'review_cadence',
    '_section:Триггеры и I/O', 'triggers', 'inputs', 'outputs',
    '_section:Участники', 'participants',
    '_section:Этапы процесса', 'process_steps',
    '_section:Ритм процесса', 'process_rhythm',
    '_section:Типовые сбои', 'typical_failures',
    '_section:Связи', 'linked_meetings', 'linked_artifacts', 'linked_systems', 'metrics_signals',
    '_section:Автоуправляемые (read-only)', 'linked_l3_subprocesses', 'linked_sop',
  ],
  process_l3: [
    '_section:Идентификация', 'name', 'purpose', 'description', 'main_goal',
    '_section:Контекст', 'when_used', 'cadence', 'owner',
    '_section:Триггеры и I/O', 'triggers', 'inputs', 'outputs',
    '_section:Участники', 'participants',
    '_section:Этапы процесса', 'process_steps',
    '_section:Типовые сбои', 'typical_failures',
    '_section:Done criteria', 'done_criteria',
    '_section:Связи', 'linked_meetings', 'linked_artifacts', 'linked_systems', 'metrics_signals',
    '_section:Автоуправляемые (read-only)', 'linked_sop',
  ],
  sop: [
    '_section:Идентификация', 'name', 'purpose', 'description', 'main_goal',
    '_section:Контекст', 'when_used', 'owner', 'sla', 'result_location',
    '_section:Триггеры и I/O', 'triggers', 'preconditions', 'inputs', 'outputs',
    '_section:Шаги', 'process_steps',
    '_section:Типовые сбои', 'typical_failures',
    '_section:Done criteria', 'done_criteria',
    '_section:Связи', 'linked_templates_forms_links',
  ],
};

const FIELD_DEFS = {
  process_l2: {
    name: { type: 'string', required: true }, purpose: { type: 'string', required: true, multiline: true },
    description: { type: 'string', required: true, multiline: true }, main_goal: { type: 'string', required: true, multiline: true },
    when_used: { type: 'string', required: true }, owner: { type: 'string', required: true, suggestions: 'owner' },
    access_level: { type: 'string', required: true }, review_cadence: { type: 'string', required: true },
    triggers: { type: 'string[]', required: true }, inputs: { type: 'string[]', required: true },
    outputs: { type: 'string[]', required: true }, participants: { type: 'string[]', required: true, suggestions: 'participants' },
    linked_meetings: { type: 'string[]', suggestions: 'linked_meetings' }, linked_artifacts: { type: 'string[]', suggestions: 'linked_artifacts' },
    linked_systems: { type: 'string[]', suggestions: 'linked_systems' }, metrics_signals: { type: 'string[]', required: true, suggestions: 'metrics_signals' },
    process_steps: { type: 'object[]', required: true, shape: 'step' },
    process_rhythm: { type: 'object[]', shape: 'rhythm' },
    typical_failures: { type: 'object[]', shape: 'failure' },
    linked_l3_subprocesses: { type: 'string[]', readOnly: true },
    linked_sop: { type: 'string[]', readOnly: true },
  },
  process_l3: {
    name: { type: 'string', required: true }, purpose: { type: 'string', required: true, multiline: true },
    description: { type: 'string', required: true, multiline: true }, main_goal: { type: 'string', required: true, multiline: true },
    when_used: { type: 'string', required: true }, cadence: { type: 'string', required: true },
    owner: { type: 'string', required: true, suggestions: 'owner' },
    triggers: { type: 'string[]', required: true }, inputs: { type: 'string[]', required: true },
    outputs: { type: 'string[]', required: true }, participants: { type: 'string[]', required: true, suggestions: 'participants' },
    linked_meetings: { type: 'string[]', suggestions: 'linked_meetings' }, linked_artifacts: { type: 'string[]', suggestions: 'linked_artifacts' },
    linked_systems: { type: 'string[]', suggestions: 'linked_systems' }, metrics_signals: { type: 'string[]', required: true, suggestions: 'metrics_signals' },
    process_steps: { type: 'object[]', required: true, shape: 'step' },
    typical_failures: { type: 'object[]', required: true, shape: 'failure' },
    done_criteria: { type: 'string[]', required: true },
    linked_sop: { type: 'string[]', readOnly: true },
  },
  sop: {
    name: { type: 'string', required: true }, purpose: { type: 'string', required: true, multiline: true },
    description: { type: 'string', required: true, multiline: true }, main_goal: { type: 'string', required: true, multiline: true },
    when_used: { type: 'string', required: true }, owner: { type: 'string', required: true, suggestions: 'owner' },
    sla: { type: 'string' }, result_location: { type: 'string', required: true },
    triggers: { type: 'string[]', required: true }, preconditions: { type: 'string[]', required: true },
    inputs: { type: 'string[]', required: true }, outputs: { type: 'string[]', required: true },
    process_steps: { type: 'object[]', required: true, shape: 'step' },
    typical_failures: { type: 'object[]', shape: 'failure' },
    done_criteria: { type: 'string[]', required: true },
    linked_templates_forms_links: { type: 'string[]' },
  },
};

const SHAPES = { step: STEP_FIELDS, failure: FAILURE_FIELDS, rhythm: RHYTHM_FIELDS };

function fieldError(errors, fieldName) {
  return errors.filter(e => e.includes(`"${fieldName}"`)).join('; ') || undefined;
}

export default function ProcessForm({
  processType, formData, setField, slug, setSlug,
  errors, warnings, saving, mode, onValidate, onSave,
  dictionary = {},
}) {
  const [validationRun, setValidationRun] = useState(false);
  const order = FIELD_ORDER[processType] || [];
  const defs = FIELD_DEFS[processType] || {};

  const handleValidate = async () => {
    setValidationRun(true);
    await onValidate();
  };

  const handleSave = async () => {
    setValidationRun(true);
    await onSave();
  };

  return (
    <Box>
      {/* Slug for create mode */}
      {mode === 'create' && processType !== 'sop' && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <TextField
            label="Slug (kebab-case, english)"
            size="small"
            fullWidth
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            helperText="Used as folder name, e.g. 'review-management'"
          />
        </Paper>
      )}

      {/* Errors / Warnings */}
      {validationRun && errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Validation errors ({errors.length})</Typography>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {errors.map((e, i) => <li key={i}><Typography variant="body2">{e}</Typography></li>)}
          </ul>
        </Alert>
      )}
      {validationRun && warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Warnings ({warnings.length})</Typography>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {warnings.map((w, i) => <li key={i}><Typography variant="body2">{w}</Typography></li>)}
          </ul>
        </Alert>
      )}
      {validationRun && errors.length === 0 && warnings.length === 0 && (
        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
          Validation passed
        </Alert>
      )}

      {/* Form fields */}
      {order.map((item) => {
        if (item.startsWith('_section:')) {
          const title = item.replace('_section:', '');
          return (
            <Box key={item}>
              <Divider sx={{ mt: 3, mb: 1 }} />
              <Typography variant="overline" color="text.secondary">{title}</Typography>
            </Box>
          );
        }

        const def = defs[item];
        if (!def) return null;
        const label = LABELS[item] || item;
        const err = fieldError(errors, item);

        if (def.readOnly) {
          const val = formData[item];
          if (!val || (Array.isArray(val) && val.length === 0)) return null;
          return (
            <Box key={item} sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2" color="text.disabled">{label} (auto)</Typography>
              <Typography variant="body2" color="text.disabled">
                {Array.isArray(val) ? val.join(', ') : val}
              </Typography>
            </Box>
          );
        }

        if (def.type === 'string') {
          if (def.suggestions) {
            return (
              <AutocompleteInput
                key={item}
                label={label}
                required={def.required}
                value={formData[item] || ''}
                onChange={(v) => setField(item, v)}
                options={dictionary[def.suggestions] || []}
                error={err}
                multiline={def.multiline}
              />
            );
          }
          return (
            <TextField
              key={item}
              label={label}
              required={def.required}
              size="small"
              fullWidth
              multiline={def.multiline}
              minRows={def.multiline ? 2 : undefined}
              value={formData[item] || ''}
              onChange={(e) => setField(item, e.target.value)}
              error={!!err}
              helperText={err}
              sx={{ mb: 2, mt: 1 }}
            />
          );
        }

        if (def.type === 'string[]') {
          if (def.suggestions) {
            return (
              <AutocompleteArrayInput
                key={item}
                label={label}
                required={def.required}
                value={formData[item] || []}
                onChange={(v) => setField(item, v)}
                options={dictionary[def.suggestions] || []}
                error={err}
              />
            );
          }
          return (
            <StringArrayInput
              key={item}
              label={label}
              required={def.required}
              value={formData[item] || []}
              onChange={(v) => setField(item, v)}
              error={err}
            />
          );
        }

        if (def.type === 'object[]') {
          const shapeFields = SHAPES[def.shape] || STEP_FIELDS;
          return (
            <ObjectArrayInput
              key={item}
              label={label}
              required={def.required}
              value={formData[item] || []}
              onChange={(v) => setField(item, v)}
              fields={shapeFields}
              error={err}
            />
          );
        }

        return null;
      })}

      {/* Action buttons */}
      <Divider sx={{ my: 3 }} />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={handleValidate}
          disabled={saving}
          startIcon={<CheckCircleIcon />}
        >
          Validate
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
        >
          {mode === 'create' ? 'Create' : 'Save'}
        </Button>
      </Box>
    </Box>
  );
}
