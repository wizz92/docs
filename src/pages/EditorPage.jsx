import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ProcessForm from '../components/editor/ProcessForm';
import useProcessEditor from '../hooks/useProcessEditor';

const TYPE_LABEL = {
  process_l2: 'L2 Процесс',
  process_l3: 'L3 Подпроцесс',
  sop: 'SOP Инструкция',
};

function resolveContext(params, pathname) {
  const { domainId, l2Folder, l3Folder, sopFile } = params;

  if (pathname.endsWith('/create/l2')) {
    return { mode: 'create', processType: 'process_l2', domainId, l2Folder, l3Folder, sopFile };
  }
  if (pathname.endsWith('/create/l3')) {
    return { mode: 'create', processType: 'process_l3', domainId, l2Folder, l3Folder, sopFile };
  }
  if (pathname.endsWith('/create/sop')) {
    return { mode: 'create', processType: 'sop', domainId, l2Folder, l3Folder, sopFile };
  }
  if (sopFile) {
    return {
      mode: 'edit', processType: 'sop', domainId, l2Folder, l3Folder, sopFile,
      existingPath: `processes/${domainId}/${l2Folder}/${l3Folder}/${sopFile}`,
    };
  }
  if (l3Folder) {
    return {
      mode: 'edit', processType: 'process_l3', domainId, l2Folder, l3Folder, sopFile,
      existingPath: `processes/${domainId}/${l2Folder}/${l3Folder}/process.json`,
    };
  }
  return {
    mode: 'edit', processType: 'process_l2', domainId, l2Folder, l3Folder, sopFile,
    existingPath: `processes/${domainId}/${l2Folder}/process.json`,
  };
}

export default function EditorPage() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const ctx = resolveContext(params, location.pathname);
  const [createType, setCreateType] = useState(ctx.processType);
  const {
    formData, setField, slug, setSlug,
    errors, warnings, saving, loaded,
    loadExisting, validate, save,
  } = useProcessEditor({ ...ctx, processType: ctx.mode === 'create' ? createType : ctx.processType });

  const [dictionary, setDictionary] = useState({});
  const [selectionHint, setSelectionHint] = useState('');

  useEffect(() => {
    fetch('/api/dictionaries')
      .then((r) => r.ok ? r.json() : {})
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
      navigate(redirectPath);
    }
  };

  const modeLabel = ctx.mode === 'create' ? 'Создать' : 'Редактировать';
  const effectiveType = ctx.mode === 'create' ? createType : ctx.processType;
  const typeLabel = TYPE_LABEL[effectiveType] || effectiveType;

  if (ctx.mode === 'edit' && !loaded) return <LoadingSkeleton />;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip
          label={modeLabel}
          size="small"
          color={ctx.mode === 'create' ? 'success' : 'primary'}
        />
        <Chip label={typeLabel} size="small" variant="outlined" />
        {ctx.mode === 'create' && location.pathname.endsWith('/create/l2') && (
          <ToggleButtonGroup
            size="small"
            exclusive
            value={createType}
            onChange={(_e, val) => {
              if (!val) return;
              if (val === 'process_l2') {
                setCreateType('process_l2');
                setSelectionHint('');
                return;
              }
              if (val === 'process_l3') {
                setSelectionHint('Откройте L2 процесс и используйте кнопку \"Создать L3\".');
                return;
              }
              if (val === 'sop') {
                setSelectionHint('Откройте L3 подпроцесс и используйте кнопку \"Создать SOP\".');
              }
            }}
          >
            <ToggleButton value="process_l2">L2</ToggleButton>
            <ToggleButton value="process_l3">L3</ToggleButton>
            <ToggleButton value="sop">SOP</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>
      {ctx.mode === 'create' && selectionHint && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {selectionHint}
        </Alert>
      )}
      <Typography variant="h4" gutterBottom>
        {ctx.mode === 'create'
          ? `${modeLabel} ${typeLabel}`
          : formData.name || `${modeLabel} ${typeLabel}`}
      </Typography>

      <ProcessForm
        processType={effectiveType}
        formData={formData}
        setField={setField}
        slug={slug}
        setSlug={setSlug}
        errors={errors}
        warnings={warnings}
        saving={saving}
        mode={ctx.mode}
        onValidate={validate}
        onSave={handleSave}
        dictionary={dictionary}
      />
    </Box>
  );
}
