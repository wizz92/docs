import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VerifiedIcon from '@mui/icons-material/Verified';
import LockIcon from '@mui/icons-material/Lock';
import UpdateIcon from '@mui/icons-material/Update';
import ProcessIdentitySection from '../components/ProcessIdentitySection';
import ProcessDiagram from '../components/ProcessDiagram';
import ProcessSteps from '../components/ProcessSteps';
import RhythmTable from '../components/RhythmTable';
import SubprocessTable from '../components/SubprocessTable';
import ProcessConnectionsSection from '../components/ProcessConnectionsSection';
import FailuresTable from '../components/FailuresTable';
import SectionHeading from '../components/SectionHeading';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useDomainData } from '../hooks/useProcessData';

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
      <Chip label="L2 Процесс" size="small" color="primary" sx={{ mb: 1 }} />
      <Typography variant="h4" gutterBottom>{l2Entry.name}</Typography>

      {l2Data ? (
        <>
          {/* 1. О процессе */}
          <ProcessIdentitySection data={l2Data} />

          {/* 2. Схема процесса */}
          <SectionHeading caption="Визуальная схема основных этапов процесса">
            Схема процесса
          </SectionHeading>
          <ProcessDiagram data={l2Data} />

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
          <SectionHeading caption="Дочерние процессы следующего уровня">
            Подпроцессы
          </SectionHeading>
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

          {/* 6. Риски и реагирование */}
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
