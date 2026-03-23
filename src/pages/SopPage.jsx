import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import EditIcon from '@mui/icons-material/Edit';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Field from '../components/Field';
import ChipList from '../components/ChipList';
import FailuresTable from '../components/FailuresTable';
import ProcessIdentitySection from '../components/ProcessIdentitySection';
import ProcessMediaSection from '../components/ProcessMediaSection';
import ProcessSteps from '../components/ProcessSteps';
import SectionHeading from '../components/SectionHeading';
import SipocDiagram from '../components/SipocDiagram';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { archiveProcess } from '../hooks/useProcessEditor';
import { useDomainData } from '../hooks/useProcessData';
import { alertArchiveFailure, confirmArchive } from '../utils/confirmArchive';

export default function SopPage() {
  const { domainId, l2Folder, l3Folder, sopFile } = useParams();
  const navigate = useNavigate();
  const { domainIndex, loading, error, loadJson } = useDomainData(domainId);
  const [sopData, setSopData] = useState(null);

  const l2Entry = domainIndex?.l2_processes?.find((p) => p.folder === l2Folder);
  const l3Entry = l2Entry?.l3_processes?.find((p) => p.folder === l3Folder);
  const sopEntry = l3Entry?.sops?.find((s) => s.file === sopFile);

  useEffect(() => {
    if (!sopEntry) return;
    setSopData(null);
    loadJson(sopEntry.path).then(setSopData).catch(() => {});
  }, [sopEntry, loadJson]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <Alert severity="error">Ошибка загрузки: {error.message}</Alert>;
  if (!sopEntry) return <Alert severity="warning">SOP не найден.</Alert>;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          mb: 1,
        }}
      >
        <Typography variant="h4" sx={{ mr: 1 }}>
          {sopEntry.name}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75 }}>
          <Chip label="SOP Инструкция" size="small" color="warning" />
          <IconButton
            component={RouterLink}
            to={`/domain/${domainId}/sop/${l2Folder}/${l3Folder}/${sopFile}/edit`}
            size="small"
            color="primary"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          {!sopData?.archived && (
            <Button
              size="small"
              color="error"
              onClick={async () => {
                const confirmed = confirmArchive(
                  'Вы уверены, что хотите скрыть эту SOP инструкцию (мягкое удаление)? Она будет удалена из навигации.',
                );
                if (!confirmed) return;
                try {
                  const redirect = await archiveProcess('sop', { domainId, l2Folder, l3Folder, sopFile });
                  if (redirect) navigate(redirect);
                } catch (e) {
                  alertArchiveFailure(e, 'Не удалось заархивировать SOP');
                }
              }}
            >
              Archive
            </Button>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
        {l2Entry && <Chip label={l2Entry.name} size="small" variant="outlined" />}
        {l3Entry && <Chip label={l3Entry.name} size="small" variant="outlined" />}
      </Box>

      {sopData ? (
        <>
          {/* 1. О процессе */}
          <ProcessIdentitySection variant="sop" data={sopData} />

          {/* 2. SIPOC */}
          <SipocDiagram data={sopData} />

          {/* 3. Логика процесса */}
          {sopData.process_steps?.length > 0 && (
            <>
              <SectionHeading caption="Последовательность шагов выполнения инструкции">
                Логика процесса
              </SectionHeading>
              <ProcessSteps
                hideTitle
                items={sopData.process_steps}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 400 }}
                secondaryTypographyProps={{ variant: 'body2' }}
              />
            </>
          )}

          {/* 4. Подпроцессы — not applicable for SOP */}

          {/* 5. Связи */}
          {(sopData.result_location || sopData.linked_templates_forms_links?.length > 0) && (
            <>
              <SectionHeading caption="Результат, шаблоны и связанные ссылки">
                Связи
              </SectionHeading>
              <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
                <Field label="Где хранится результат" value={sopData.result_location} />
                <ChipList label="Шаблоны / ссылки" items={sopData.linked_templates_forms_links} />
              </Paper>
            </>
          )}

          {/* 6. Материалы */}
          <ProcessMediaSection data={sopData} />

          {/* 7. Риски и реагирование */}
          {sopData.typical_failures?.length > 0 && (
            <>
              <SectionHeading caption="Типовые отклонения и алгоритмы реагирования">
                Риски и реагирование
              </SectionHeading>
              <FailuresTable items={sopData.typical_failures} />
            </>
          )}
        </>
      ) : (
        <LoadingSkeleton variant="card" />
      )}
    </Box>
  );
}
