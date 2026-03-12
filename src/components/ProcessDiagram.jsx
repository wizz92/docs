import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

function StepBox({ label, subtitle, color = 'primary.main' }) {
  return (
    <Paper
      elevation={0}
      sx={{
        px: 2,
        py: 1.5,
        minWidth: 120,
        textAlign: 'center',
        border: 2,
        borderColor: color,
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="caption" color="text.secondary" display="block">
        {subtitle}
      </Typography>
      <Typography variant="body2" fontWeight={600} noWrap>
        {label}
      </Typography>
    </Paper>
  );
}

function Arrow() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', px: 0.5, color: 'text.disabled' }}>
      <ArrowForwardIcon fontSize="small" />
    </Box>
  );
}

export default function ProcessDiagram({ data }) {
  if (!data) return null;

  const trigger = data.triggers?.[0] || 'Триггер';
  const output = data.outputs?.[0] || 'Результат';

  if (!data.process_steps?.length) return null;

  const stages = data.process_steps.map((s) => s.step);

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, mb: 3, overflowX: 'auto' }}
    >
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Схема процесса
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          py: 1,
          minWidth: 'max-content',
        }}
      >
        <StepBox label={trigger} subtitle="Триггер" color="warning.main" />
        <Arrow />
        {stages.map((s, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center' }}>
            <StepBox label={s} subtitle={`Этап ${i + 1}`} color="primary.main" />
            <Arrow />
          </Box>
        ))}
        <StepBox label={output} subtitle="Результат" color="success.main" />
      </Box>
    </Paper>
  );
}
