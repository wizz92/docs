import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Field from './Field';
import ChipList from './ChipList';
import DoneCriteriaList from './DoneCriteriaList';

/**
 * @param {{ data: object, variant?: 'standard' | 'sop' }} props
 */
export default function ProcessIdentitySection({ data, variant = 'standard' }) {
  if (!data) return null;

  const triggers = data.triggers;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
      <Typography variant="overline" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        О процессе
      </Typography>

      <Field label="Назначение" value={data.purpose} />
      <Field label="Описание" value={data.description} />
      <Field label="Основная цель" value={data.main_goal} />

      <Divider sx={{ my: 2.5 }} />

      {variant === 'sop' ? (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Field label="Владелец" value={data.owner} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Field label="SLA" value={data.sla} />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <ChipList label="Триггеры" items={triggers} color="primary" />
            </Grid>
          </Grid>

          <ChipList label="Preconditions" items={data.preconditions} />
        </>
      ) : (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Field label="Владелец" value={data.owner} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Field label="Когда используется" value={data.when_used} />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <ChipList label="Триггеры" items={triggers} color="primary" />
            </Grid>
          </Grid>

          <ChipList label="Участники / роли" items={data.participants} />
        </>
      )}

      {data.done_criteria?.length > 0 && (
        <>
          <Divider sx={{ my: 2.5 }} />
          <DoneCriteriaList label="Done criteria" items={data.done_criteria} />
        </>
      )}
    </Paper>
  );
}
