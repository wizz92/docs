import { useCallback, useEffect, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PreviewIcon from '@mui/icons-material/Preview';
import SaveIcon from '@mui/icons-material/Save';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DescriptionIcon from '@mui/icons-material/Description';
import ProcessForm from './ProcessForm';
import { getSlugTooltip } from './fieldHelp';
import { sanitizeImportedJson } from '../../../shared/sanitizeImportedJson.js';

const LEVEL_TYPES = new Set(['process_l2', 'process_l3', 'sop']);

/**
 * @param {object} props
 * @param {string} props.processType
 * @param {function} props.setProcessType
 * @param {string} props.slug
 * @param {function} props.setSlug
 * @param {object} props.formData
 * @param {function} props.setFormData
 * @param {string[]} props.errors
 * @param {string[]} props.warnings
 * @param {boolean} props.saving
 * @param {function} props.validate
 * @param {function} props.onSave
 * @param {string[]} props.createGateErrors
 * @param {object} props.dictionary
 * @param {function} props.onSwitchToManual
 */
export default function JsonImportPanel({
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
  onSave,
  createGateErrors,
  dictionary,
  onSwitchToManual,
}) {
  const [rawJson, setRawJson] = useState('');
  const [parseError, setParseError] = useState(null);
  const [previewActive, setPreviewActive] = useState(false);
  const [importValidateAttempted, setImportValidateAttempted] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateLoadError, setTemplateLoadError] = useState(null);

  /** Last string applied by auto-load or "Загрузить шаблон" — used to detect pristine textarea. */
  const lastLoadedTemplateRef = useRef(null);
  const rawJsonRef = useRef('');
  rawJsonRef.current = rawJson;

  /** Avoid stale `setTemplateLoading(false)` when effect + manual load overlap. */
  const templateLoadOpIdRef = useRef(0);
  const beginTemplateLoad = useCallback(() => {
    templateLoadOpIdRef.current += 1;
    const id = templateLoadOpIdRef.current;
    setTemplateLoading(true);
    return id;
  }, []);
  const endTemplateLoad = useCallback((id) => {
    if (id === templateLoadOpIdRef.current) setTemplateLoading(false);
  }, []);

  const noop = () => {};
  const createBlocked = createGateErrors.length > 0;

  const applyTemplateText = useCallback((text) => {
    setRawJson(text);
    lastLoadedTemplateRef.current = text;
    setPreviewActive(false);
  }, []);

  const fetchTemplate = useCallback(async (type, signal) => {
    const res = await fetch(`/api/templates/${encodeURIComponent(type)}`, { signal });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(errText || res.statusText || `HTTP ${res.status}`);
    }
    return res.json();
  }, []);

  /** Force-load template for current level (overwrites textarea). */
  const handleLoadTemplate = useCallback(async () => {
    const opId = beginTemplateLoad();
    setTemplateLoadError(null);
    try {
      const data = await fetchTemplate(processType);
      applyTemplateText(JSON.stringify(data, null, 2));
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setTemplateLoadError(e instanceof Error ? e.message : String(e));
    } finally {
      endTemplateLoad(opId);
    }
  }, [
    applyTemplateText,
    beginTemplateLoad,
    endTemplateLoad,
    fetchTemplate,
    processType,
  ]);

  useEffect(() => {
    const current = rawJsonRef.current;
    const pristine =
      !current.trim() || current === lastLoadedTemplateRef.current;

    if (!pristine) return undefined;

    const ac = new AbortController();
    const opId = beginTemplateLoad();
    setTemplateLoadError(null);
    (async () => {
      try {
        const data = await fetchTemplate(processType, ac.signal);
        if (ac.signal.aborted) return;
        applyTemplateText(JSON.stringify(data, null, 2));
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        if (!ac.signal.aborted) {
          setTemplateLoadError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        endTemplateLoad(opId);
      }
    })();

    return () => {
      ac.abort();
    };
  }, [
    applyTemplateText,
    beginTemplateLoad,
    endTemplateLoad,
    fetchTemplate,
    processType,
  ]);

  const handleValidatePreview = async () => {
    setParseError(null);
    setPreviewActive(false);
    setImportValidateAttempted(true);

    let parsed;
    try {
      parsed = JSON.parse(rawJson.trim() || '{}');
    } catch (e) {
      setParseError(e instanceof Error ? e.message : String(e));
      return;
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      setParseError('JSON must be an object at the root.');
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

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1,
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="subtitle2" color="text.secondary">
          Paste process JSON
        </Typography>
        <Button
          variant="text"
          size="small"
          startIcon={
            templateLoading ? (
              <CircularProgress size={14} thickness={5} />
            ) : (
              <DescriptionIcon fontSize="small" />
            )
          }
          onClick={() => void handleLoadTemplate()}
          disabled={templateLoading}
        >
          Загрузить шаблон
        </Button>
      </Box>

      {templateLoadError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setTemplateLoadError(null)}>
          <Typography variant="subtitle2" gutterBottom>
            Не удалось загрузить шаблон
          </Typography>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', m: 0 }}>
            {templateLoadError}
          </Typography>
        </Alert>
      )}

      <TextField
        value={rawJson}
        onChange={(e) => {
          setRawJson(e.target.value);
          setPreviewActive(false);
        }}
        multiline
        minRows={16}
        maxRows={32}
        fullWidth
        disabled={templateLoading}
        sx={{
          mb: 2,
          '& textarea': { fontFamily: 'ui-monospace, monospace', fontSize: 13 },
        }}
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PreviewIcon />}
          onClick={handleValidatePreview}
          disabled={!rawJson.trim()}
        >
          Validate &amp; Preview
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
          <Typography variant="subtitle2" gutterBottom>JSON parse error</Typography>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', m: 0 }}>
            {parseError}
          </Typography>
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
