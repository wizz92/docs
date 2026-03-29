import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SaveIcon from '@mui/icons-material/Save';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ProcessForm from './ProcessForm';
import { getSlugTooltip } from './fieldHelp';
import { sanitizeImportedJson } from '../../../shared/sanitizeImportedJson.js';

const LEVEL_TYPES = new Set(['process_l2', 'process_l3', 'sop']);

/**
 * @param {object} props — same contract as JsonImportPanel
 */
export default function TextImportPanel({
  processType,
  setProcessType,
  slug,
  setSlug,
  formData,
  setFormData,
  errors,
  warnings,
  saving,
  validate,
  clearValidation = () => {},
  onSave,
  createGateErrors,
  dictionary,
  onSwitchToManual,
}) {
  const [rawText, setRawText] = useState('');
  const [parseError, setParseError] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [previewActive, setPreviewActive] = useState(false);
  const [importValidateAttempted, setImportValidateAttempted] = useState(false);
  const [parsing, setParsing] = useState(false);

  const noop = () => {};
  const createBlocked = createGateErrors.length > 0;

  const handleParseAndPreview = async () => {
    setParseError(null);
    setApiError(null);
    setPreviewActive(false);
    setImportValidateAttempted(true);
    setParsing(true);

    try {
      const res = await fetch('/api/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText, type: processType }),
      });
      const body = await res.json().catch(() => ({}));

      if (res.status === 501) {
        setApiError({
          kind: 'config',
          message: body.error || 'Импорт текста не настроен (нет OPENAI_API_KEY на сервере).',
        });
        return;
      }
      if (res.status === 422) {
        setApiError({
          kind: 'parse',
          message: body.error || 'Не удалось разобрать ответ модели',
          raw: body.raw,
        });
        return;
      }
      if (!res.ok) {
        setApiError({
          kind: 'other',
          message: body.error || `Ошибка ${res.status}`,
        });
        return;
      }

      if (body.insufficient) {
        setPreviewActive(false);
        clearValidation();
        setApiError({
          kind: 'incomplete',
          message: body.summary || 'Недостаточно информации для заполнения обязательных полей.',
          missing: Array.isArray(body.missing_fields) ? body.missing_fields : [],
        });
        return;
      }

      const parsed = body.data;
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setParseError('Ответ должен быть JSON-объектом.');
        return;
      }

      const sanitized = sanitizeImportedJson(parsed);
      const t = typeof sanitized.type === 'string' ? sanitized.type.trim() : '';
      let typeForValidate = processType;
      if (t && LEVEL_TYPES.has(t)) {
        typeForValidate = t;
        setProcessType(t);
      }

      setFormData(sanitized);
      const ok = await validate({ data: sanitized, type: typeForValidate });
      setPreviewActive(!!ok);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : String(e));
    } finally {
      setParsing(false);
    }
  };

  const handleEditInForm = () => {
    onSwitchToManual();
  };

  return (
    <Box>
      {processType !== 'sop' && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <TextField
            label="Slug (kebab-case, english)"
            size="small"
            fullWidth
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            helperText={`${getSlugTooltip()}\n\nUsed as folder name, e.g. 'review-management'`}
            FormHelperTextProps={{ sx: { whiteSpace: 'pre-wrap' } }}
          />
        </Paper>
      )}

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Вставьте свободный текст (заметки, описание процесса)
      </Typography>

      <TextField
        value={rawText}
        onChange={(e) => {
          setRawText(e.target.value);
          setPreviewActive(false);
        }}
        multiline
        minRows={16}
        maxRows={32}
        fullWidth
        disabled={parsing}
        placeholder="Вставьте текст здесь…"
        sx={{
          mb: 2,
          '& textarea': { fontFamily: 'inherit', fontSize: 14 },
        }}
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={parsing ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
          onClick={() => void handleParseAndPreview()}
          disabled={!rawText.trim() || parsing}
        >
          Распознать и предпросмотр
        </Button>
        <Button
          variant="outlined"
          startIcon={<EditNoteIcon />}
          onClick={handleEditInForm}
        >
          Edit in form
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={onSave}
          disabled={saving || createBlocked || !previewActive}
        >
          Create
        </Button>
        {createBlocked && (
          <Typography variant="caption" color="text.secondary">
            {createGateErrors.join(' ')}
          </Typography>
        )}
      </Box>

      {parseError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Ошибка</Typography>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', m: 0 }}>
            {parseError}
          </Typography>
        </Alert>
      )}

      {apiError && (
        <Alert
          severity={
            apiError.kind === 'config' ? 'warning' : apiError.kind === 'incomplete' ? 'warning' : 'error'
          }
          sx={{ mb: 2 }}
          onClose={() => setApiError(null)}
        >
          <Typography variant="subtitle2" gutterBottom>
            {apiError.kind === 'config'
              ? 'Импорт текста недоступен'
              : apiError.kind === 'incomplete'
                ? 'Недостаточно данных'
                : 'Ошибка распознавания'}
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {apiError.message}
          </Typography>
          {apiError.kind === 'incomplete' && apiError.missing?.length > 0 && (
            <Typography variant="body2" component="div" sx={{ mt: 1 }}>
              Поля: {apiError.missing.join(', ')}
            </Typography>
          )}
          {apiError.raw && (
            <Typography
              variant="caption"
              component="pre"
              sx={{ display: 'block', mt: 1, whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}
            >
              {typeof apiError.raw === 'string' ? apiError.raw : JSON.stringify(apiError.raw, null, 2)}
            </Typography>
          )}
        </Alert>
      )}

      {importValidateAttempted && errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Validation errors ({errors.length})
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {errors.map((e, i) => (
              <li key={i}>
                <Typography variant="body2">{e}</Typography>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {importValidateAttempted && warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Warnings ({warnings.length})
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {warnings.map((w, i) => (
              <li key={i}>
                <Typography variant="body2">{w}</Typography>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {importValidateAttempted && errors.length === 0 && previewActive && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Validation passed — preview below
        </Alert>
      )}

      {previewActive && errors.length === 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Preview
          </Typography>
          <ProcessForm
            processType={processType}
            formData={formData}
            setField={noop}
            slug={slug}
            setSlug={noop}
            errors={[]}
            errorsByField={{}}
            warnings={[]}
            saving={false}
            mode="preview"
            onValidate={noop}
            onSave={noop}
            dictionary={dictionary}
            createGateErrors={[]}
          />
        </Box>
      )}
    </Box>
  );
}
