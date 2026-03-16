import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Field from './Field';
import ChipList from './ChipList';
import DoneCriteriaList from './DoneCriteriaList';

export default function SopCard({ data }) {
  if (!data) return null;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Field label="Назначение" value={data.purpose} />
            <Field label="Основная цель" value={data.main_goal} />
            <Field label="Триггер" value={data.triggers?.join(', ')} />
            <Field label="SLA" value={data.sla} />
            <Field label="Владелец" value={data.owner} />
            <Field label="Где хранится результат" value={data.result_location} />
            <ChipList label="Preconditions" items={data.preconditions} />
            <ChipList label="Входы (inputs)" items={data.inputs} />
            <ChipList label="Выходы (outputs)" items={data.outputs} color="secondary" />
            <DoneCriteriaList label="Done criteria" items={data.done_criteria} />
          </Grid>

          <Grid item xs={12} md={7}>
            {data.process_steps?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Шаги
                </Typography>
                <List dense disablePadding>
                  {data.process_steps.map((item, i) => (
                    <ListItem key={i} alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            fontSize: 12,
                            bgcolor: 'primary.main',
                          }}
                        >
                          {i + 1}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={item.step}
                        secondary={item.description || undefined}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {data.typical_failures?.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Типичные ошибки</Typography>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {data.typical_failures.map((f, i) => (
                    <li key={i}>
                      <Typography variant="body2">
                        {f.failure}{f.action ? ` — ${f.action}` : ''}
                      </Typography>
                    </li>
                  ))}
                </ul>
              </Alert>
            )}

            <ChipList label="Шаблоны / ссылки" items={data.linked_templates_forms_links} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
