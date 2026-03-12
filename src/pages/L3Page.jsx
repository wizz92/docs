import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import ProcessIdentitySection from '../components/ProcessIdentitySection';
import ProcessDiagram from '../components/ProcessDiagram';
import ProcessSteps from '../components/ProcessSteps';
import SubprocessTable from '../components/SubprocessTable';
import ProcessConnectionsSection from '../components/ProcessConnectionsSection';
import FailuresTable from '../components/FailuresTable';
import SectionHeading from '../components/SectionHeading';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useDomainData } from '../hooks/useProcessData';

export default function L3Page() {
  const { domainId, l2Folder, l3Folder } = useParams();
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
      <Chip label="L3 Подпроцесс" size="small" color="secondary" sx={{ mb: 1 }} />
      <Typography variant="h4" gutterBottom>{l3Entry.name}</Typography>

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

          {/* 4. Подпроцессы */}
          {l3Entry.sops?.length > 0 && (
            <>
              <SectionHeading caption="Дочерние процессы следующего уровня">
                Подпроцессы
              </SectionHeading>
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

          {/* 6. Риски и реагирование */}
          {(l3Data.failure_modes?.length > 0 || l3Data.typical_failures?.length > 0) && (
            <>
              <SectionHeading caption="Типовые отклонения и алгоритмы реагирования">
                Риски и реагирование
              </SectionHeading>
              <FailuresTable
                items={l3Data.typical_failures}
                failures={l3Data.failure_modes}
                deviations={l3Data.deviation_response}
              />
            </>
          )}
        </>
      ) : (
        <LoadingSkeleton variant="card" />
      )}
    </Box>
  );
}
