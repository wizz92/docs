import { useEffect, useState, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Field from '../components/Field';
import ChipList from '../components/ChipList';
import useProcessData from '../hooks/useProcessData';
import { companyClientPath, DEFAULT_COMPANY_SLUG } from '../../shared/companies.js';

function L2AccordionContent({ companyId, domainId, l2Entry, loadJson }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    loadJson(l2Entry.path).then(setData).catch(() => {});
  }, [l2Entry.path, loadJson]);

  if (!data) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary">Загрузка...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Field label="Назначение" value={data.purpose} />
          <Field label="Владелец" value={data.owner} />
          <ChipList label="Метрики / сигналы" items={data.metrics_signals} color="primary" />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChipList label="Связанные системы" items={data.linked_systems} />
          <ChipList label="Связанные артефакты" items={data.linked_artifacts} />
        </Grid>
      </Grid>

      {l2Entry.l3_processes?.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            L3 подпроцессы
          </Typography>
          <List dense disablePadding>
            {l2Entry.l3_processes.map((l3) => (
              <ListItemButton
                key={l3.folder}
                component={RouterLink}
                to={companyClientPath(companyId, `domain/${domainId}/l3/${l2Entry.folder}/${l3.folder}`)}
                sx={{ borderRadius: 1, mb: 0.5, bgcolor: 'action.hover' }}
              >
                <ListItemText
                  primary={l3.name}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
                <Chip
                  label={`${l3.sops?.length || 0} SOP`}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      )}

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          component={RouterLink}
          to={companyClientPath(companyId, `domain/${domainId}/l2/${l2Entry.folder}`)}
          size="small"
          endIcon={<OpenInNewIcon />}
        >
          Полная карточка L2
        </Button>
      </Box>
    </Box>
  );
}

function DomainSection({ domainMeta, loadDomainIndex, loadJson }) {
  const [domainIndex, setDomainIndex] = useState(null);
  const [l1Data, setL1Data] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    loadDomainIndex(domainMeta.id)
      .then((idx) => {
        setDomainIndex(idx);
        if (idx?.l1?.path) loadJson(idx.l1.path).then(setL1Data).catch(() => {});
      })
      .catch(() => {});
  }, [open, domainMeta.id, loadDomainIndex, loadJson]);

  const handleDomainToggle = (_e, isExpanded) => setOpen(isExpanded);
  const handleL2Toggle = useCallback(
    (folder) => (_e, isExpanded) => setExpanded(isExpanded ? folder : false),
    [],
  );

  const totalL3 = domainIndex?.l2_processes?.reduce((n, l2) => n + (l2.l3_processes?.length || 0), 0) || 0;
  const totalSop = domainIndex?.l2_processes?.reduce(
    (n, l2) => n + (l2.l3_processes?.reduce((m, l3) => m + (l3.sops?.length || 0), 0) || 0), 0,
  ) || 0;

  return (
    <Accordion
      expanded={open}
      onChange={handleDomainToggle}
      variant="outlined"
      disableGutters
      sx={{ mb: 1.5, '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: domainMeta.color || '#1976d2', flexShrink: 0 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography fontWeight={700}>
              {domainMeta.name_ru || domainMeta.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {domainMeta.description_ru}
            </Typography>
          </Box>
          <Chip label={domainMeta.category} size="small" variant="outlined" />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {!domainIndex ? (
          <Typography variant="body2" color="text.secondary">Загрузка...</Typography>
        ) : (
          <Box>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Field label="Назначение" value={l1Data?.purpose} />
                  <Field label="Владелец" value={l1Data?.owner} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Paper variant="outlined" sx={{ px: 2, py: 1, textAlign: 'center', flex: 1, minWidth: 70 }}>
                      <Typography variant="h6" fontWeight={700}>{domainIndex.l2_processes?.length || 0}</Typography>
                      <Typography variant="caption" color="text.secondary">L2</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ px: 2, py: 1, textAlign: 'center', flex: 1, minWidth: 70 }}>
                      <Typography variant="h6" fontWeight={700}>{totalL3}</Typography>
                      <Typography variant="caption" color="text.secondary">L3</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ px: 2, py: 1, textAlign: 'center', flex: 1, minWidth: 70 }}>
                      <Typography variant="h6" fontWeight={700}>{totalSop}</Typography>
                      <Typography variant="caption" color="text.secondary">SOP</Typography>
                    </Paper>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {domainIndex.l2_processes?.map((l2) => (
              <Accordion
                key={l2.folder}
                expanded={expanded === l2.folder}
                onChange={handleL2Toggle(l2.folder)}
                variant="outlined"
                disableGutters
                sx={{ mb: 0.5, '&:before': { display: 'none' } }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Typography fontWeight={600} sx={{ flexGrow: 1 }}>
                      {l2.name}
                    </Typography>
                    <Chip label={`${l2.l3_processes?.length || 0} L3`} size="small" variant="outlined" />
                    <Chip label={`${l2.l3_processes?.reduce((n, l3) => n + (l3.sops?.length || 0), 0)} SOP`} size="small" variant="outlined" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {expanded === l2.folder && (
                    <L2AccordionContent
                      companyId={domainMeta.companyId || DEFAULT_COMPANY_SLUG}
                      domainId={domainMeta.id}
                      l2Entry={l2}
                      loadJson={loadJson}
                    />
                  )}
                </AccordionDetails>
              </Accordion>
            ))}

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                component={RouterLink}
                to={companyClientPath(domainMeta.companyId || DEFAULT_COMPANY_SLUG, `domain/${domainMeta.id}`)}
                size="small"
                endIcon={<OpenInNewIcon />}
              >
                Открыть домен
              </Button>
            </Box>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export default function ArchitecturePage() {
  const { masterIndex, loading, error, loadJson, loadDomainIndex } = useProcessData();

  if (loading) return <LoadingSkeleton />;
  if (error) return <Alert severity="error">Ошибка загрузки: {error.message}</Alert>;

  const domains = masterIndex?.domains || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Архитектура процессов компании
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 800 }}>
        Верхнеуровневый process wiki: каждый L1-домен раскрывается в L2-процессы,
        а каждый L2-процесс имеет отдельную process card со связями, KPI, системами и набором SOP.
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {domains.length} доменов
      </Typography>

      {domains.map((d) => (
        <DomainSection
          key={d.id}
          domainMeta={d}
          loadDomainIndex={loadDomainIndex}
          loadJson={loadJson}
        />
      ))}
    </Box>
  );
}
