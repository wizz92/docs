import { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { getEditorCreateTooltip } from '../components/editor/fieldHelp';
import JsonImportPanel from '../components/editor/JsonImportPanel';
import TextImportPanel from '../components/editor/TextImportPanel';
import ProcessForm from '../components/editor/ProcessForm';
import useProcessEditor, { getCreateBlockingErrors } from '../hooks/useProcessEditor';
import { clearProcessApiCache } from '../hooks/useProcessData';
import { sortDomains } from '../utils/domainOrder';
import { TYPE_LABEL, resolveContext } from './editor/editorContext';
import { DEFAULT_COMPANY_SLUG, companyClientPath } from '../../shared/companies.js';

export default function EditorPage() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { domainId: domainIdParam } = params;

  const ctx = resolveContext(params, location.pathname);

  /** When URL is `/create` there is no `domainId` param — keep chosen L1 in state until URL gains `/domain/:id/create`. */
  const [createDomainId, setCreateDomainId] = useState(() => (domainIdParam || ''));

  useEffect(() => {
    if (domainIdParam) setCreateDomainId(domainIdParam);
  }, [domainIdParam]);

  const effectiveDomainId = useMemo(() => {
    if (ctx.mode !== 'create') return ctx.domainId;
    return domainIdParam || createDomainId || undefined;
  }, [ctx.mode, ctx.domainId, domainIdParam, createDomainId]);

  const [createType, setCreateType] = useState(() => (ctx.mode === 'create' ? ctx.processType : 'process_l2'));
  const [selectedL2, setSelectedL2] = useState(() => (ctx.mode === 'create' ? (ctx.l2Folder || '') : ''));
  const [selectedL3, setSelectedL3] = useState(() => (ctx.mode === 'create' ? (ctx.l3Folder || '') : ''));
  /** Manual form vs JSON import on create page only */
  const [createUiMode, setCreateUiMode] = useState('manual');

  const [domainIndex, setDomainIndex] = useState(null);
  const [domainIndexError, setDomainIndexError] = useState(null);
  const [domainIndexLoading, setDomainIndexLoading] = useState(false);
  const [masterIndex, setMasterIndex] = useState(null);

  useEffect(() => {
    if (ctx.mode !== 'create') return;
    fetch('/api/processes')
      .then((r) => (r.ok ? r.json() : null))
      .then(setMasterIndex)
      .catch(() => setMasterIndex(null));
  }, [ctx.mode]);

  const companyId = params.companyId;

  const masterDomains = useMemo(() => {
    const all = masterIndex?.domains || [];
    const filtered = companyId
      ? all.filter((d) => (d.companyId || DEFAULT_COMPANY_SLUG) === companyId)
      : all;
    return sortDomains(filtered, masterIndex);
  }, [masterIndex, companyId]);

  useEffect(() => {
    if (ctx.mode !== 'create') return;
    const base = {
      createType: ctx.processType,
      selectedL2: ctx.l2Folder || '',
      selectedL3: ctx.l3Folder || '',
    };
    if (ctx.createFlow === 'unified') {
      const lev = searchParams.get('level');
      if (lev === 'l2' || lev === 'process_l2') base.createType = 'process_l2';
      else if (lev === 'l3' || lev === 'process_l3') base.createType = 'process_l3';
      else if (lev === 'sop') base.createType = 'sop';
      const l2q = searchParams.get('l2');
      const l3q = searchParams.get('l3');
      if (l2q) base.selectedL2 = l2q;
      if (l3q) base.selectedL3 = l3q;
    }
    setCreateType(base.createType);
    setSelectedL2(base.selectedL2);
    setSelectedL3(base.selectedL3);
  }, [
    ctx.mode,
    ctx.createFlow,
    ctx.domainId,
    ctx.processType,
    ctx.l2Folder,
    ctx.l3Folder,
    location.pathname,
    location.search,
  ]);

  useEffect(() => {
    if (ctx.mode !== 'create' || !effectiveDomainId) return;
    setDomainIndexLoading(true);
    setDomainIndexError(null);
    fetch(`/api/processes/${effectiveDomainId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setDomainIndex(data);
        setDomainIndexLoading(false);
      })
      .catch((e) => {
        setDomainIndexError(e.message || 'Ошибка загрузки');
        setDomainIndexLoading(false);
      });
  }, [ctx.mode, effectiveDomainId]);

  const effectiveL2 = useMemo(() => {
    if (ctx.mode !== 'create') return ctx.l2Folder;
    if (createType === 'process_l3' || createType === 'sop') {
      return selectedL2 ? selectedL2 : undefined;
    }
    return undefined;
  }, [ctx.mode, ctx.l2Folder, createType, selectedL2]);

  const effectiveL3 = useMemo(() => {
    if (ctx.mode !== 'create') return ctx.l3Folder;
    if (createType === 'sop') {
      return selectedL3 ? selectedL3 : undefined;
    }
    return undefined;
  }, [ctx.mode, ctx.l3Folder, createType, selectedL3]);

  const {
    formData, setFormData, setField, slug, setSlug,
    errors, errorsByField, warnings, saving, loaded,
    loadExisting, validate, clearValidation, save,
  } = useProcessEditor({
    ...ctx,
    companyId: ctx.companyId ?? companyId,
    domainId: ctx.mode === 'create' ? effectiveDomainId : ctx.domainId,
    processType: ctx.mode === 'create' ? createType : ctx.processType,
    l2Folder: effectiveL2,
    l3Folder: effectiveL3,
  });

  const [dictionary, setDictionary] = useState({});

  useEffect(() => {
    fetch('/api/dictionaries')
      .then((r) => (r.ok ? r.json() : {}))
      .then(setDictionary)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (ctx.mode === 'edit' && ctx.existingPath) {
      loadExisting(ctx.existingPath);
    }
  }, [ctx.mode, ctx.existingPath, loadExisting]);

  const handleSave = async () => {
    const redirectPath = await save();
    if (redirectPath) {
      clearProcessApiCache();
      navigate(redirectPath);
    }
  };

  const modeLabel = ctx.mode === 'create' ? 'Создать' : 'Редактировать';
  const effectiveType = ctx.mode === 'create' ? createType : ctx.processType;
  const typeLabel = TYPE_LABEL[effectiveType] || effectiveType;

  const createGateErrors = useMemo(() => {
    if (ctx.mode !== 'create') return [];
    return getCreateBlockingErrors(createType, {
      domainId: effectiveDomainId,
      l2Folder: effectiveL2,
      l3Folder: effectiveL3,
      slug,
    });
  }, [ctx.mode, effectiveDomainId, createType, effectiveL2, effectiveL3, slug]);

  const l2List = domainIndex?.l2_processes || [];
  const l3List = useMemo(() => {
    if (!selectedL2) return [];
    const l2 = l2List.find((l) => l.folder === selectedL2);
    return l2?.l3_processes || [];
  }, [l2List, selectedL2]);

  const handleLevelChange = (e) => {
    const v = e.target.value;
    setCreateType(v);
    if (v === 'process_l2') {
      setSelectedL2('');
      setSelectedL3('');
    } else if (v === 'process_l3') {
      setSelectedL3('');
    }
  };

  const handleL2Select = (e) => {
    const v = e.target.value;
    setSelectedL2(v);
    setSelectedL3('');
  };

  const handleCreateDomainChange = (e) => {
    const id = e.target.value;
    if (!id) {
      setCreateDomainId('');
      return;
    }
    if (location.pathname === '/create' || /^\/company\/[^/]+\/create$/.test(location.pathname)) {
      setCreateDomainId(id);
      return;
    }
    if (id === domainIdParam) return;
    const cid = companyId || DEFAULT_COMPANY_SLUG;
    navigate(`${companyClientPath(cid, `domain/${id}/create`)}${location.search}`, { replace: true });
  };

  if (ctx.mode === 'edit' && !loaded) return <LoadingSkeleton />;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip
          label={modeLabel}
          size="small"
          color={ctx.mode === 'create' ? 'success' : 'primary'}
        />
        <Chip label={formData.type || typeLabel} size="small" variant="outlined" />
      </Box>

      {ctx.mode === 'create' && (
        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={createUiMode}
            exclusive
            onChange={(_e, v) => {
              if (v != null) setCreateUiMode(v);
            }}
            size="small"
            color="primary"
          >
            <ToggleButton value="manual">Вручную</ToggleButton>
            <ToggleButton value="import">Импорт JSON</ToggleButton>
            <ToggleButton value="text">Импорт текста</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {ctx.mode === 'create' && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Уровень и родитель
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <FormControl
              size="small"
              sx={{ minWidth: 320, maxWidth: 420 }}
              disabled={!masterDomains.length}
            >
              <InputLabel id="create-domain-l1-label">Домен (L1)</InputLabel>
              <Select
                labelId="create-domain-l1-label"
                label="Домен (L1)"
                value={effectiveDomainId || ''}
                displayEmpty={
                  location.pathname === '/create'
                  || /^\/company\/[^/]+\/create$/.test(location.pathname)
                }
                onChange={handleCreateDomainChange}
              >
                {(location.pathname === '/create'
                  || /^\/company\/[^/]+\/create$/.test(location.pathname)) && (
                  <MenuItem value="">
                    <em>Выберите домен…</em>
                  </MenuItem>
                )}
                {masterDomains.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name_ru || d.name || d.id}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText sx={{ maxWidth: 420, whiteSpace: 'pre-wrap' }}>
                {getEditorCreateTooltip('domain')}
              </FormHelperText>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="create-level-label">Уровень</InputLabel>
              <Select
                labelId="create-level-label"
                label="Уровень"
                value={createType}
                onChange={handleLevelChange}
              >
                <MenuItem value="process_l2">L2 · Ключевой процесс</MenuItem>
                <MenuItem value="process_l3">L3 · Подпроцесс</MenuItem>
                <MenuItem value="sop">SOP · Инструкция</MenuItem>
              </Select>
              <FormHelperText sx={{ maxWidth: 420, whiteSpace: 'pre-wrap' }}>
                {getEditorCreateTooltip('level')}
              </FormHelperText>
            </FormControl>

            {(createType === 'process_l3' || createType === 'sop') && (
              <FormControl size="small" sx={{ minWidth: 260 }} disabled={domainIndexLoading || !!domainIndexError}>
                <InputLabel id="create-l2-parent-label">Родитель L2</InputLabel>
                <Select
                  labelId="create-l2-parent-label"
                  label="Родитель L2"
                  value={selectedL2}
                  onChange={handleL2Select}
                >
                  <MenuItem value="">
                    <em>Выберите L2</em>
                  </MenuItem>
                  {l2List.map((l2) => (
                    <MenuItem key={l2.folder} value={l2.folder}>
                      {l2.name || l2.folder}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText sx={{ maxWidth: 420, whiteSpace: 'pre-wrap' }}>
                  {getEditorCreateTooltip('parentL2')}
                </FormHelperText>
              </FormControl>
            )}

            {createType === 'sop' && (
              <FormControl
                size="small"
                sx={{ minWidth: 260 }}
                disabled={domainIndexLoading || !!domainIndexError || !selectedL2}
              >
                <InputLabel id="create-l3-parent-label">Родитель L3</InputLabel>
                <Select
                  labelId="create-l3-parent-label"
                  label="Родитель L3"
                  value={selectedL3}
                  onChange={(e) => setSelectedL3(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Выберите L3</em>
                  </MenuItem>
                  {l3List.map((l3) => (
                    <MenuItem key={l3.folder} value={l3.folder}>
                      {l3.name || l3.folder}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText sx={{ maxWidth: 420, whiteSpace: 'pre-wrap' }}>
                  {getEditorCreateTooltip('parentL3')}
                </FormHelperText>
              </FormControl>
            )}
          </Box>
          {domainIndexLoading && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Загрузка дерева домена…
            </Typography>
          )}
          {domainIndexError && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Не удалось загрузить индекс домена (нужен для выбора родителя L3/SOP): {domainIndexError}
            </Alert>
          )}
        </Paper>
      )}

      <Typography variant="h4" gutterBottom>
        {ctx.mode === 'create'
          ? `${modeLabel} ${typeLabel}`
          : formData.name || `${modeLabel} ${typeLabel}`}
      </Typography>

      {ctx.mode === 'create' && createUiMode === 'import' ? (
        <JsonImportPanel
          processType={createType}
          setProcessType={setCreateType}
          slug={slug}
          setSlug={setSlug}
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          warnings={warnings}
          saving={saving}
          validate={validate}
          onSave={handleSave}
          createGateErrors={createGateErrors}
          dictionary={dictionary}
          onSwitchToManual={() => setCreateUiMode('manual')}
        />
      ) : ctx.mode === 'create' && createUiMode === 'text' ? (
        <TextImportPanel
          processType={createType}
          setProcessType={setCreateType}
          slug={slug}
          setSlug={setSlug}
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          warnings={warnings}
          saving={saving}
          validate={validate}
          clearValidation={clearValidation}
          onSave={handleSave}
          createGateErrors={createGateErrors}
          dictionary={dictionary}
          onSwitchToManual={() => setCreateUiMode('manual')}
        />
      ) : (
        <ProcessForm
          processType={effectiveType}
          formData={formData}
          setField={setField}
          slug={slug}
          setSlug={setSlug}
          errors={errors}
          errorsByField={errorsByField}
          warnings={warnings}
          saving={saving}
          mode={ctx.mode}
          onValidate={validate}
          onSave={handleSave}
          dictionary={dictionary}
          createGateErrors={createGateErrors}
        />
      )}
    </Box>
  );
}
