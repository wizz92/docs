import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ProcessIdentitySection from '../components/ProcessIdentitySection';
import ProcessDiagram from '../components/ProcessDiagram';
import SubprocessTable from '../components/SubprocessTable';
import ProcessConnectionsSection from '../components/ProcessConnectionsSection';
import FailuresTable from '../components/FailuresTable';
import SectionHeading from '../components/SectionHeading';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useDomainData } from '../hooks/useProcessData';

function StatCard({ label, value }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={700}>
        {value}
      </Typography>
    </Paper>
  );
}

function computeStats(index) {
  const l2Count = index.l2_processes?.length || 0;
  let l3Count = 0;
  let sopCount = 0;
  index.l2_processes?.forEach((l2) => {
    l3Count += l2.l3_processes?.length || 0;
    l2.l3_processes?.forEach((l3) => {
      sopCount += l3.sops?.length || 0;
    });
  });
  return { l2Count, l3Count, sopCount };
}

export default function DomainPage() {
  const { domainId } = useParams();
  const { domainIndex, domainMeta, loading, error, loadJson } = useDomainData(domainId);
  const [l1Data, setL1Data] = useState(null);

  useEffect(() => {
    if (!domainIndex) return;
    setL1Data(null);
    loadJson(domainIndex.l1.path).then(setL1Data).catch(() => {});
  }, [domainIndex, loadJson]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <Alert severity="error">Не удалось загрузить данные: {error.message}</Alert>;
  if (!domainIndex) return <Alert severity="warning">Домен не найден.</Alert>;

  const stats = computeStats(domainIndex);

  return (
    <Box>
      {/* Hero section (L1-specific) */}
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 }, mb: 4, bgcolor: 'grey.50' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={7}>
            <Chip
              size="small"
              label={`${domainMeta?.category || 'Domain'} · ${domainIndex.l1?.name}`}
              color="primary"
              variant="outlined"
              icon={
                <Box
                  sx={{
                    width: 6, height: 6, borderRadius: '50%',
                    bgcolor: domainMeta?.color || '#4caf50', ml: 1,
                  }}
                />
              }
              sx={{ mb: 2 }}
            />
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {domainMeta?.name_ru || domainIndex.l1?.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2, maxWidth: 560 }}>
              {domainMeta?.description_ru || l1Data?.description}
            </Typography>
            {l1Data?.purpose && (
              <Chip label={l1Data.purpose} size="small" variant="outlined" sx={{ maxWidth: '100%' }} />
            )}
          </Grid>
          <Grid item xs={12} md={5}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <StatCard label="L2 · Ключевых процессов" value={stats.l2Count} />
              </Grid>
              <Grid item xs={6}>
                <StatCard label="L3 · Подпроцессов" value={stats.l3Count} />
              </Grid>
              <Grid item xs={6}>
                <StatCard label="SOP · Инструкций" value={stats.sopCount} />
              </Grid>
              <Grid item xs={6}>
                <StatCard label="Всего файлов" value={1 + stats.l2Count + stats.l3Count + stats.sopCount} />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {l1Data ? (
        <>
          {/* 1. О процессе */}
          <ProcessIdentitySection data={l1Data} />

          {/* 2. Схема процесса */}
          {l1Data.process_steps?.length > 0 && (
            <>
              <SectionHeading caption="Визуальная схема основных этапов процесса">
                Схема процесса
              </SectionHeading>
              <ProcessDiagram data={l1Data} />
            </>
          )}

          {/* 3. Логика процесса — skipped at L1 if no steps */}

          {/* 4. Подпроцессы */}
          <SectionHeading caption="Дочерние процессы следующего уровня">
            Подпроцессы
          </SectionHeading>
          <SubprocessTable
            showL3
            rows={domainIndex.l2_processes?.map((l2) => ({
              key: l2.folder,
              name: l2.name,
              to: `/domain/${domainId}/l2/${l2.folder}`,
              l3Count: l2.l3_processes?.length || 0,
              sopCount: l2.l3_processes?.reduce((n, l3) => n + (l3.sops?.length || 0), 0) || 0,
            }))}
          />

          {/* 5. Связи */}
          {(l1Data.linked_meetings?.length || l1Data.linked_artifacts?.length ||
            l1Data.linked_systems?.length || l1Data.metrics_signals?.length) && (
            <>
              <SectionHeading caption="Связанные встречи, артефакты, системы и метрики">
                Связи
              </SectionHeading>
              <ProcessConnectionsSection data={l1Data} />
            </>
          )}

          {/* 6. Риски и реагирование */}
          {l1Data.typical_failures?.length > 0 && (
            <>
              <SectionHeading caption="Типовые отклонения и алгоритмы реагирования">
                Риски и реагирование
              </SectionHeading>
              <FailuresTable items={l1Data.typical_failures} />
            </>
          )}
        </>
      ) : (
        <LoadingSkeleton variant="card" />
      )}
    </Box>
  );
}
