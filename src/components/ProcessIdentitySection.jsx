import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Field from './Field';
import ChipList from './ChipList';

export default function ProcessIdentitySection({ data }) {
  if (!data) return null;

  const triggers = data.triggers
    || (data.trigger && (Array.isArray(data.trigger) ? data.trigger : [data.trigger]));

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
      <Typography variant="overline" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        О процессе
      </Typography>

      <Field label="Назначение" value={data.purpose} />
      <Field label="Описание" value={data.description} />
      <Field label="Основная цель" value={data.main_goal} />

      <Divider sx={{ my: 2.5 }} />

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

      {(data.inputs?.length > 0 || data.outputs?.length > 0) && (
        <>
          <Divider sx={{ my: 2.5 }} />
          <Typography variant="overline" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
            Входы и выходы
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ChipList label="Входы (inputs)" items={data.inputs} />
            </Grid>
            <Grid item xs={12} md={6}>
              <ChipList label="Выходы (outputs)" items={data.outputs} color="secondary" />
            </Grid>
          </Grid>
        </>
      )}

      {data.done_criteria?.length > 0 && (
        <>
          <Divider sx={{ my: 2.5 }} />
          <ChipList label="Done criteria" items={data.done_criteria} color="success" />
        </>
      )}
    </Paper>
  );
}
