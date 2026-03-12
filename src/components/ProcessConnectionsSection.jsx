import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import ChipList from './ChipList';

export default function ProcessConnectionsSection({ data }) {
  if (!data) return null;

  const has = data.linked_meetings?.length
    || data.linked_artifacts?.length
    || data.linked_systems?.length
    || data.metrics_signals?.length;

  if (!has) return null;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ChipList label="Связанные встречи" items={data.linked_meetings} />
          <ChipList label="Связанные артефакты" items={data.linked_artifacts} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChipList label="Связанные системы" items={data.linked_systems} />
          <ChipList label="Метрики / сигналы" items={data.metrics_signals} />
        </Grid>
      </Grid>
    </Paper>
  );
}
