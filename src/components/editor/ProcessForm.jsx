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
import { getFieldTooltip, getShapeFieldTooltip, getSlugTooltip } from './fieldHelp';
import {
  STEP_FIELDS,
  FIELD_ORDER,
  FIELD_DEFS,
  LABELS,
  SHAPES,
  getDictionaryLabels,
  fieldError,
  buildRowErrors,
} from './processFormConfig';
import { DRAWER_WIDTH } from '../Layout';

export default function ProcessForm({
  processType, formData, setField, slug, setSlug,
  errors, errorsByField, warnings, saving, mode, onValidate, onSave,
  dictionary = {},
  /** When set in create mode, Validate/Create stay disabled (e.g. missing parent). */
  createGateErrors = [],
}) {
  const [validationRun, setValidationRun] = useState(false);
  const order = FIELD_ORDER[processType] || [];
  const defs = FIELD_DEFS[processType] || {};
  const readOnly = mode === 'preview';
  const showFieldHelp = mode === 'create' && !readOnly;

  const fieldTip = (fieldKey) =>
    showFieldHelp ? getFieldTooltip(processType, fieldKey) : '';
  const shapeTip = (shapeFieldKey, subKey) =>
    showFieldHelp ? getShapeFieldTooltip(processType, shapeFieldKey, subKey) : '';

  const createBlocked = mode === 'create' && createGateErrors.length > 0;

  const handleValidate = async () => {
    if (readOnly) return;
    setValidationRun(true);
    await onValidate();
  };

  const handleSave = async () => {
    if (readOnly) return;
    setValidationRun(true);
    await onSave();
  };

  const actionButtons = (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
      <Button
        variant="outlined"
        onClick={handleValidate}
        disabled={saving || createBlocked}
        startIcon={<CheckCircleIcon />}
      >
        Validate
      </Button>
      <Button
        variant="contained"
        onClick={handleSave}
        disabled={saving || createBlocked}
        startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
      >
        {mode === 'create' ? 'Create' : 'Save'}
      </Button>
      {createBlocked && (
        <Typography variant="caption" color="text.secondary">
          {createGateErrors.join(' ')}
        </Typography>
      )}
    </Box>
  );

  return (
    <Box sx={mode === 'edit' ? { pb: 10 } : undefined}>
      {/* Slug for create mode (hidden in import preview — slug lives in JsonImportPanel) */}
      {mode === 'create' && !readOnly && processType !== 'sop' && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <TextField
            label="Slug (kebab-case, english)"
            size="small"
            fullWidth
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            helperText={
              showFieldHelp
                ? `${getSlugTooltip()}\n\nUsed as folder name, e.g. 'review-management'`
                : "Used as folder name, e.g. 'review-management'"
            }
            FormHelperTextProps={showFieldHelp ? { sx: { whiteSpace: 'pre-wrap' } } : undefined}
          />
        </Paper>
      )}

      {/* Errors / Warnings (hidden in preview — parent shows validation state) */}
      {!readOnly && validationRun && errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Validation errors ({errors.length})</Typography>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {errors.map((e, i) => <li key={i}><Typography variant="body2">{e}</Typography></li>)}
          </ul>
        </Alert>
      )}
      {!readOnly && validationRun && warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Warnings ({warnings.length})</Typography>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {warnings.map((w, i) => <li key={i}><Typography variant="body2">{w}</Typography></li>)}
          </ul>
        </Alert>
      )}
      {!readOnly && validationRun && errors.length === 0 && warnings.length === 0 && (
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
        const tip = fieldTip(item);
        const err = (errorsByField && errorsByField[item] && errorsByField[item].length)
          ? errorsByField[item].join('; ')
          : fieldError(errors, item);

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
                options={getDictionaryLabels(dictionary, def.suggestions)}
                error={err}
                multiline={def.multiline}
                helpText={showFieldHelp ? tip : undefined}
                readOnly={readOnly}
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
              helperText={err || (showFieldHelp ? tip : '')}
              FormHelperTextProps={tip && !err ? { sx: { whiteSpace: 'pre-wrap' } } : undefined}
              slotProps={readOnly ? { input: { readOnly: true } } : undefined}
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
                options={getDictionaryLabels(dictionary, def.suggestions)}
                error={err}
                helpText={showFieldHelp ? tip : undefined}
                readOnly={readOnly}
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
              helpText={showFieldHelp ? tip : undefined}
              readOnly={readOnly}
            />
          );
        }

        if (def.type === 'object[]') {
          const baseShape = SHAPES[def.shape] || STEP_FIELDS;
          const shapeFields = baseShape.map((f) => ({
            ...f,
            helpText: shapeTip(item, f.key) || undefined,
          }));
          const rowErrors = buildRowErrors(errorsByField, item);
          return (
            <ObjectArrayInput
              key={item}
              label={label}
              sectionHelp={showFieldHelp ? tip : undefined}
              required={def.required}
              value={formData[item] || []}
              onChange={(v) => setField(item, v)}
              fields={shapeFields}
              error={err}
              rowErrors={rowErrors}
              readOnly={readOnly}
            />
          );
        }

        return null;
      })}

      {/* Action buttons: in-flow for create, fixed bar for edit; hidden in import preview */}
      {mode === 'create' && !readOnly && (
        <>
          <Divider sx={{ my: 3 }} />
          {actionButtons}
        </>
      )}
      {mode === 'edit' && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: { xs: 0, md: DRAWER_WIDTH },
            right: 0,
            zIndex: 1100,
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            p: 2,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          {actionButtons}
        </Box>
      )}
    </Box>
  );
}
