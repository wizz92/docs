import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import EditIcon from '@mui/icons-material/Edit';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Field from '../components/Field';
import ChipList from '../components/ChipList';
import DoneCriteriaList from '../components/DoneCriteriaList';
import FailuresTable from '../components/FailuresTable';
import ProcessMediaSection from '../components/ProcessMediaSection';
import SectionHeading from '../components/SectionHeading';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { archiveProcess } from '../hooks/useProcessEditor';
import { useDomainData } from '../hooks/useProcessData';

export default function SopPage() {
  const { domainId, l2Folder, l3Folder, sopFile } = useParams();
  const navigate = useNavigate();
  const { domainIndex, loading, error, loadJson } = useDomainData(domainId);
  const [sopData, setSopData] = useState(null);

  const l2Entry = domainIndex?.l2_processes?.find((p) => p.folder === l2Folder);
  const l3Entry = l2Entry?.l3_processes?.find((p) => p.folder === l3Folder);
  const sopEntry = l3Entry?.sops?.find((s) => s.file === sopFile);

  useEffect(() => {
    if (!sopEntry) return;
    setSopData(null);
    loadJson(sopEntry.path).then(setSopData).catch(() => {});
  }, [sopEntry, loadJson]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <Alert severity="error">Ошибка загрузки: {error.message}</Alert>;
  if (!sopEntry) return <Alert severity="warning">SOP не найден.</Alert>;

  const triggers = sopData?.triggers;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          mb: 1,
        }}
      >
        <Typography variant="h4" sx={{ mr: 1 }}>
          {sopEntry.name}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75 }}>
          <Chip label="SOP Инструкция" size="small" color="warning" />
          <IconButton
            component={RouterLink}
            to={`/domain/${domainId}/sop/${l2Folder}/${l3Folder}/${sopFile}/edit`}
            size="small"
            color="primary"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          {!sopData?.archived && (
            <Button
              size="small"
              color="error"
              onClick={async () => {
                // eslint-disable-next-line no-alert
                const confirmed = window.confirm('Вы уверены, что хотите скрыть эту SOP инструкцию (мягкое удаление)? Она будет удалена из навигации.');
                if (!confirmed) return;
                try {
                  const redirect = await archiveProcess('sop', { domainId, l2Folder, l3Folder, sopFile });
                  if (redirect) navigate(redirect);
                } catch (e) {
                  // eslint-disable-next-line no-alert
                  window.alert(e.message || 'Не удалось заархивировать SOP');
                }
              }}
            >
              Archive
            </Button>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
        {l2Entry && <Chip label={l2Entry.name} size="small" variant="outlined" />}
        {l3Entry && <Chip label={l3Entry.name} size="small" variant="outlined" />}
      </Box>

      {sopData ? (
        <>
          {/* 1. О процессе */}
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              О процессе
            </Typography>
            <Field label="Назначение" value={sopData.purpose} />
            <Field label="Описание" value={sopData.description} />
            <Field label="Основная цель" value={sopData.main_goal} />

            <Divider sx={{ my: 2.5 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Field label="Владелец" value={sopData.owner} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Field label="SLA" value={sopData.sla} />
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <ChipList label="Триггеры" items={triggers} color="primary" />
              </Grid>
            </Grid>

            <ChipList label="Preconditions" items={sopData.preconditions} />

            {(sopData.inputs?.length > 0 || sopData.outputs?.length > 0) && (
              <>
                <Divider sx={{ my: 2.5 }} />
                <Typography variant="overline" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                  Входы и выходы
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <ChipList label="Входы (inputs)" items={sopData.inputs} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <ChipList label="Выходы (outputs)" items={sopData.outputs} color="secondary" />
                  </Grid>
                </Grid>
              </>
            )}

            {sopData.done_criteria?.length > 0 && (
              <>
                <Divider sx={{ my: 2.5 }} />
                <DoneCriteriaList label="Done criteria" items={sopData.done_criteria} />
              </>
            )}
          </Paper>

          {/* 2. Схема процесса — not applicable for SOP */}

          {/* 3. Логика процесса */}
          {sopData.process_steps?.length > 0 && (
            <>
              <SectionHeading caption="Последовательность шагов выполнения инструкции">
                Логика процесса
              </SectionHeading>
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <List dense disablePadding>
                  {sopData.process_steps.map((item, i) => (
                    <ListItem key={i} alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Avatar sx={{ width: 26, height: 26, fontSize: 13, bgcolor: 'primary.main' }}>
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
              </Paper>
            </>
          )}

          {/* 4. Подпроцессы — not applicable for SOP */}

          {/* 5. Связи */}
          {(sopData.result_location || sopData.linked_templates_forms_links?.length > 0) && (
            <>
              <SectionHeading caption="Результат, шаблоны и связанные ссылки">
                Связи
              </SectionHeading>
              <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
                <Field label="Где хранится результат" value={sopData.result_location} />
                <ChipList label="Шаблоны / ссылки" items={sopData.linked_templates_forms_links} />
              </Paper>
            </>
          )}

          {/* 6. Материалы */}
          <ProcessMediaSection data={sopData} />

          {/* 7. Риски и реагирование */}
          {sopData.typical_failures?.length > 0 && (
            <>
              <SectionHeading caption="Типовые отклонения и алгоритмы реагирования">
                Риски и реагирование
              </SectionHeading>
              <FailuresTable items={sopData.typical_failures} />
            </>
          )}
        </>
      ) : (
        <LoadingSkeleton variant="card" />
      )}
    </Box>
  );
}
