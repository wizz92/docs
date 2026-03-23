import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import VerifiedIcon from '@mui/icons-material/Verified';
import LockIcon from '@mui/icons-material/Lock';
import UpdateIcon from '@mui/icons-material/Update';
import ProcessIdentitySection from '../components/ProcessIdentitySection';
import ProcessDiagram from '../components/ProcessDiagram';
import SipocDiagram from '../components/SipocDiagram';
import ProcessSteps from '../components/ProcessSteps';
import RhythmTable from '../components/RhythmTable';
import SubprocessTable from '../components/SubprocessTable';
import ProcessConnectionsSection from '../components/ProcessConnectionsSection';
import ProcessMediaSection from '../components/ProcessMediaSection';
import FailuresTable from '../components/FailuresTable';
import SectionHeading from '../components/SectionHeading';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { archiveProcess } from '../hooks/useProcessEditor';
import { useDomainData } from '../hooks/useProcessData';
import { alertArchiveFailure, confirmArchive } from '../utils/confirmArchive';

function MetaItem({ icon: Icon, children }) {
  if (!children) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Icon sx={{ fontSize: 16, color: 'text.disabled' }} />
      <Typography variant="caption" color="text.disabled">{children}</Typography>
    </Box>
  );
}

export default function L2Page() {
  const { domainId, l2Folder } = useParams();
  const navigate = useNavigate();
  const { domainIndex, loading, error, loadJson } = useDomainData(domainId);
  const [l2Data, setL2Data] = useState(null);

  const l2Entry = domainIndex?.l2_processes?.find((p) => p.folder === l2Folder);

  useEffect(() => {
    if (!l2Entry) return;
    setL2Data(null);
    loadJson(l2Entry.path).then(setL2Data).catch(() => {});
  }, [l2Entry, loadJson]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <Alert severity="error">Ошибка загрузки: {error.message}</Alert>;
  if (!l2Entry) return <Alert severity="warning">L2 процесс не найден.</Alert>;

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
          {l2Entry.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label="L2 Процесс" size="small" color="primary" />
          <IconButton
            component={RouterLink}
            to={`/domain/${domainId}/l2/${l2Folder}/edit`}
            size="small"
            color="primary"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          {!l2Data?.archived && (
            <Button
              size="small"
              color="error"
              onClick={async () => {
                const confirmed = confirmArchive(
                  'Вы уверены, что хотите скрыть этот L2 процесс (мягкое удаление)? Он будет удалён из навигации.',
                );
                if (!confirmed) return;
                try {
                  const redirect = await archiveProcess('process_l2', { domainId, l2Folder });
                  if (redirect) navigate(redirect);
                } catch (e) {
                  alertArchiveFailure(e, 'Не удалось заархивировать процесс');
                }
              }}
            >
              Archive
            </Button>
          )}
        </Box>
      </Box>

      {l2Data ? (
        <>
          {/* 1. О процессе */}
          <ProcessIdentitySection data={l2Data} />

          {/* 2. Схема процесса */}
          <SectionHeading caption="Визуальная схема основных этапов процесса">
            Схема процесса
          </SectionHeading>
          <ProcessDiagram data={l2Data} />
          <SipocDiagram data={l2Data} />

          {/* 3. Логика процесса */}
          {(l2Data.process_steps?.length > 0 || l2Data.process_rhythm?.length > 0) && (
            <>
              <SectionHeading caption="Этапы, шаги и ритм выполнения процесса">
                Логика процесса
              </SectionHeading>
              <ProcessSteps items={l2Data.process_steps} />
              <RhythmTable items={l2Data.process_rhythm} />
            </>
          )}

          {/* 4. Подпроцессы */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 5, mb: 2 }}>
            <SectionHeading caption="Дочерние процессы следующего уровня">
              Подпроцессы
            </SectionHeading>
            <Button
              component={RouterLink}
              to={`/domain/${domainId}/create?level=process_l3&l2=${encodeURIComponent(l2Folder)}`}
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
            >
              Create L3
            </Button>
          </Box>
          <SubprocessTable
            rows={l2Entry.l3_processes?.map((l3) => ({
              key: l3.folder,
              name: l3.name,
              to: `/domain/${domainId}/l3/${l2Folder}/${l3.folder}`,
              sopCount: l3.sops?.length || 0,
            }))}
          />

          {/* 5. Связи */}
          <SectionHeading caption="Связанные встречи, артефакты, системы и метрики">
            Связи
          </SectionHeading>
          <ProcessConnectionsSection data={l2Data} />

          {/* 6. Материалы */}
          <ProcessMediaSection data={l2Data} />

          {/* 7. Риски и реагирование */}
          {l2Data.typical_failures?.length > 0 && (
            <>
              <SectionHeading caption="Типовые отклонения и алгоритмы реагирования">
                Риски и реагирование
              </SectionHeading>
              <FailuresTable items={l2Data.typical_failures} />
            </>
          )}

          {/* Metadata */}
          <Divider sx={{ my: 4 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, mb: 2 }}>
            <MetaItem icon={VerifiedIcon}>{l2Data.version && `v${l2Data.version}`}</MetaItem>
            <MetaItem icon={AccessTimeIcon}>{l2Data.updated_at}</MetaItem>
            <MetaItem icon={LockIcon}>{l2Data.access_level}</MetaItem>
            <MetaItem icon={UpdateIcon}>{l2Data.review_cadence}</MetaItem>
          </Box>
        </>
      ) : (
        <LoadingSkeleton variant="card" />
      )}
    </Box>
  );
}
