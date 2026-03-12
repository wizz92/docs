import { useEffect, useState, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LoadingSkeleton from '../components/LoadingSkeleton';
import useProcessData from '../hooks/useProcessData';

const CATEGORY_ORDER = ['Strategy', 'Operations', 'Core', 'Growth', 'Revenue', 'Support', 'Development'];
const CATEGORY_LABEL = {
  Strategy: 'Стратегия', Operations: 'Операции', Core: 'Продукт',
  Growth: 'Рост', Revenue: 'Выручка', Support: 'Поддержка', Development: 'Развитие',
};

function StatPill({ value, label }) {
  return (
    <Box sx={{ textAlign: 'center', flex: 1, minWidth: 80 }}>
      <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
        {label}
      </Typography>
    </Box>
  );
}

function DomainCard({ domain, stats }) {
  const l2 = stats?.total_l2 ?? '–';
  const l3 = stats?.total_l3 ?? '–';
  const sop = stats?.total_sop ?? '–';

  return (
    <Card
      sx={{
        height: '100%',
        borderLeft: `4px solid ${domain.color || '#1976d2'}`,
        transition: 'box-shadow .15s, transform .15s',
        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
      }}
    >
      <CardActionArea
        component={RouterLink}
        to={`/domain/${domain.id}`}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}
      >
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5, lineHeight: 1.3 }}>
            {domain.name_ru}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 'auto', pb: 1.5, fontSize: 13, lineHeight: 1.5 }}
          >
            {domain.description_ru}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Chip label={`${l2} L2`} size="small" variant="outlined" sx={{ fontSize: 11 }} />
            <Chip label={`${l3} L3`} size="small" variant="outlined" sx={{ fontSize: 11 }} />
            <Chip label={`${sop} SOP`} size="small" variant="outlined" sx={{ fontSize: 11 }} />
            <Box sx={{ flexGrow: 1 }} />
            <ArrowForwardIcon fontSize="small" color="action" />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function DomainsPage() {
  const { masterIndex, loading, error, loadDomainIndex } = useProcessData();
  const [domainStats, setDomainStats] = useState({});

  useEffect(() => {
    if (!masterIndex?.domains) return;
    masterIndex.domains.forEach((d) => {
      loadDomainIndex(d.id)
        .then((idx) => {
          if (idx?.summary) setDomainStats((prev) => ({ ...prev, [d.id]: idx.summary }));
        })
        .catch(() => {});
    });
  }, [masterIndex, loadDomainIndex]);

  const domains = masterIndex?.domains || [];

  const grouped = useMemo(() => {
    const map = {};
    domains.forEach((d) => {
      const cat = d.category || 'Other';
      if (!map[cat]) map[cat] = [];
      map[cat].push(d);
    });
    return CATEGORY_ORDER.filter((c) => map[c]).map((c) => ({ category: c, items: map[c] }));
  }, [domains]);

  const totalL2 = Object.values(domainStats).reduce((n, s) => n + (s.total_l2 || 0), 0);
  const totalL3 = Object.values(domainStats).reduce((n, s) => n + (s.total_l3 || 0), 0);
  const totalSop = Object.values(domainStats).reduce((n, s) => n + (s.total_sop || 0), 0);
  const totalFiles = Object.values(domainStats).reduce((n, s) => n + (s.total_files || 0), 0);

  if (loading) return <LoadingSkeleton />;
  if (error) return <Alert severity="error">Ошибка загрузки: {error.message}</Alert>;

  return (
    <Box>
      {/* Hero */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e8edf5 100%)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
        }}
      >
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1.5, mb: 1, display: 'block' }}
            >
              Operating System Documentation
            </Typography>
            <Typography variant="h4" fontWeight={800} gutterBottom sx={{ lineHeight: 1.2 }}>
              Портал процессов компании
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520, mb: 3 }}>
              Единая архитектура от стратегии до операций.
              Каждый домен — это набор L2-процессов, L3-подпроцессов и пошаговых SOP-инструкций.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                component={RouterLink}
                to="/architecture"
                variant="contained"
                disableElevation
                startIcon={<AccountTreeIcon />}
                size="medium"
              >
                Архитектура
              </Button>
              <Button
                component={RouterLink}
                to="/registry"
                variant="outlined"
                startIcon={<ListAltIcon />}
                size="medium"
              >
                Реестр процессов
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper
              variant="outlined"
              sx={{ p: 2.5, borderRadius: 2.5, bgcolor: 'background.paper' }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                <StatPill value={domains.length} label="Доменов" />
                <Divider orientation="vertical" flexItem />
                <StatPill value={totalL2} label="L2" />
                <Divider orientation="vertical" flexItem />
                <StatPill value={totalL3} label="L3" />
                <Divider orientation="vertical" flexItem />
                <StatPill value={totalSop} label="SOP" />
              </Box>
              {totalFiles > 0 && (
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{ display: 'block', textAlign: 'center', mt: 1.5 }}
                >
                  {totalFiles} документов в базе
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Grouped domain cards */}
      {grouped.map(({ category, items }) => (
        <Box key={category} sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {CATEGORY_LABEL[category] || category}
            </Typography>
            <Chip
              label={`${items.length} ${items.length === 1 ? 'домен' : items.length < 5 ? 'домена' : 'доменов'}`}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          </Box>
          <Grid container spacing={2}>
            {items.map((d) => (
              <Grid item xs={12} sm={6} md={4} key={d.id}>
                <DomainCard domain={d} stats={domainStats[d.id]} />
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  );
}
