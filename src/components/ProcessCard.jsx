import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Field from './Field';
import ChipList from './ChipList';

export default function ProcessCard({ data }) {
  if (!data) return null;

  const triggers = data.triggers;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Field label="Назначение" value={data.purpose} />
            <Field label="Основная цель" value={data.main_goal} />
            <Field label="Когда используется" value={data.when_used} />
            <Field label="Владелец" value={data.owner} />
            <Field label="Уровень доступа" value={data.access_level} />
            <Field label="Периодичность пересмотра" value={data.review_cadence} />
            <Field label="Версия" value={data.version} />
            <Field label="Периодичность" value={data.cadence} />
          </Grid>

          <Grid item xs={12} md={6}>
            <ChipList label="Триггеры" items={triggers} color="primary" />
            <ChipList label="Входы (inputs)" items={data.inputs} />
            <ChipList label="Выходы (outputs)" items={data.outputs} color="secondary" />
            <ChipList label="Участники / роли" items={data.participants} />
            <ChipList label="Связанные встречи" items={data.linked_meetings} />
            <ChipList label="Связанные артефакты" items={data.linked_artifacts} />
            <ChipList label="Связанные системы" items={data.linked_systems} />
            <ChipList label="Метрики / сигналы" items={data.metrics_signals} />
          </Grid>
        </Grid>

        {data.done_criteria?.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <ChipList label="Done criteria" items={data.done_criteria} color="success" />
          </>
        )}
      </CardContent>
    </Card>
  );
}
