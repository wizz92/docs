import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ProcessIdentitySection from '../components/ProcessIdentitySection';
import ProcessDiagram from '../components/ProcessDiagram';
import SipocDiagram from '../components/SipocDiagram';
import ProcessSteps from '../components/ProcessSteps';
import SubprocessTable from '../components/SubprocessTable';
import ProcessConnectionsSection from '../components/ProcessConnectionsSection';
import ProcessMediaSection from '../components/ProcessMediaSection';
import FailuresTable from '../components/FailuresTable';
import SectionHeading from '../components/SectionHeading';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { archiveProcess } from '../hooks/useProcessEditor';
import { useDomainData } from '../hooks/useProcessData';
import { alertArchiveFailure, confirmArchive } from '../utils/confirmArchive';

export default function L3Page() {
  const { domainId, l2Folder, l3Folder } = useParams();
  const navigate = useNavigate();
  const { domainIndex, loading, error, loadJson } = useDomainData(domainId);
  const [l3Data, setL3Data] = useState(null);

  const l2Entry = domainIndex?.l2_processes?.find((p) => p.folder === l2Folder);
  const l3Entry = l2Entry?.l3_processes?.find((p) => p.folder === l3Folder);

  useEffect(() => {
    if (!l3Entry) return;
    setL3Data(null);
    loadJson(l3Entry.path).then(setL3Data).catch(() => {});
  }, [l3Entry, loadJson]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <Alert severity="error">Ошибка загрузки: {error.message}</Alert>;
  if (!l3Entry) return <Alert severity="warning">L3 подпроцесс не найден.</Alert>;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h4" sx={{ mr: 1 }}>
          {l3Entry.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label="L3 Подпроцесс" size="small" color="secondary" />
          <IconButton
            component={RouterLink}
            to={`/domain/${domainId}/l3/${l2Folder}/${l3Folder}/edit`}
            size="small"
            color="primary"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          {!l3Data?.archived && (
            <Button
              size="small"
              color="error"
              onClick={async () => {
                const confirmed = confirmArchive(
                  'Вы уверены, что хотите скрыть этот L3 подпроцесс (мягкое удаление)? Он будет удалён из навигации.',
                );
                if (!confirmed) return;
                try {
                  const redirect = await archiveProcess('process_l3', { domainId, l2Folder, l3Folder });
                  if (redirect) navigate(redirect);
                } catch (e) {
                  alertArchiveFailure(e, 'Не удалось заархивировать подпроцесс');
                }
              }}
            >
              Archive
            </Button>
          )}
        </Box>
      </Box>

      {l3Data ? (
        <>
          {/* 1. О процессе */}
          <ProcessIdentitySection data={l3Data} />

          {/* 2. Схема процесса */}
          {l3Data.process_steps?.length > 0 && (
            <>
              <SectionHeading caption="Визуальная схема основных этапов процесса">
                Схема процесса
              </SectionHeading>
              <ProcessDiagram data={l3Data} />
              <SipocDiagram data={l3Data} />
            </>
          )}

          {/* 3. Логика процесса */}
          {l3Data.process_steps?.length > 0 && (
            <>
              <SectionHeading caption="Этапы, шаги и ритм выполнения процесса">
                Логика процесса
              </SectionHeading>
              <ProcessSteps items={l3Data.process_steps} />
            </>
          )}

          {/* 4. SOPs */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 5, mb: 2 }}>
            <SectionHeading caption="Дочерние процессы следующего уровня">
              Подпроцессы
            </SectionHeading>
            <Button
              component={RouterLink}
              to={`/domain/${domainId}/create?level=sop&l2=${encodeURIComponent(l2Folder)}&l3=${encodeURIComponent(l3Folder)}`}
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
            >
              Create SOP
            </Button>
          </Box>
          {l3Entry.sops?.length > 0 && (
            <>
              <SubprocessTable
                rows={l3Entry.sops.map((sop) => ({
                  key: sop.file,
                  name: sop.name,
                  to: `/domain/${domainId}/sop/${l2Folder}/${l3Folder}/${sop.file}`,
                  sopCount: 1,
                }))}
              />
            </>
          )}

          {/* 5. Связи */}
          {(l3Data.linked_meetings?.length || l3Data.linked_artifacts?.length ||
            l3Data.linked_systems?.length || l3Data.metrics_signals?.length) && (
            <>
              <SectionHeading caption="Связанные встречи, артефакты, системы и метрики">
                Связи
              </SectionHeading>
              <ProcessConnectionsSection data={l3Data} />
            </>
          )}
          {/* 6. Материалы */}
          <ProcessMediaSection data={l3Data} />

          {/* 7. Риски и реагирование */}
          {l3Data.typical_failures?.length > 0 && (
            <>
              <SectionHeading caption="Типовые отклонения и алгоритмы реагирования">
                Риски и реагирование
              </SectionHeading>
              <FailuresTable items={l3Data.typical_failures} />
            </>
          )}
        </>
      ) : (
        <LoadingSkeleton variant="card" />
      )}
    </Box>
  );
}
