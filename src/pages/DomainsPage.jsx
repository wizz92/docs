import { useEffect, useState, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LoadingSkeleton from '../components/LoadingSkeleton';
import useProcessData from '../hooks/useProcessData';
import { sortDomains } from '../utils/domainOrder';

const SECTION_SPACING = 4;
const SECTION_GAP = 3;

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

  const domains = useMemo(
    () => sortDomains(masterIndex?.domains || [], masterIndex),
    [masterIndex],
  );

  const totalL2 = Object.values(domainStats).reduce((n, s) => n + (s.total_l2 || 0), 0);
  const totalL3 = Object.values(domainStats).reduce((n, s) => n + (s.total_l3 || 0), 0);
  const totalSop = Object.values(domainStats).reduce((n, s) => n + (s.total_sop || 0), 0);
  const totalFiles = Object.values(domainStats).reduce((n, s) => n + (s.total_files || 0), 0);

  if (loading) return <LoadingSkeleton />;
  if (error) return <Alert severity="error">Ошибка загрузки: {error.message}</Alert>;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: SECTION_SPACING,
      }}
    >
      {/* Hero */}
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          p: { xs: 3, md: 4 },
          py: { xs: 3, md: 5 },
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e3ecff 40%, #e8edf5 100%)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: '-40%',
            background:
              'radial-gradient(circle at 0% 0%, rgba(129, 140, 248, 0.16), transparent 60%), radial-gradient(circle at 100% 100%, rgba(59, 130, 246, 0.16), transparent 55%)',
            opacity: 0.9,
          },
          '& > *': {
            position: 'relative',
            zIndex: 1,
          },
        }}
      >
        <Grid container spacing={{ xs: 3, md: 5 }} alignItems="center">
          <Grid item xs={12} md={7}>
            <Typography
              variant="overline"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                letterSpacing: 1.5,
                mb: 1,
                display: 'block',
                textTransform: 'uppercase',
              }}
            >
              Operating System Documentation
            </Typography>
            <Typography
              variant="h3"
              fontWeight={800}
              gutterBottom
              sx={{
                lineHeight: 1.1,
                mb: 1.5,
                fontSize: { xs: 26, sm: 30, md: 34 },
              }}
            >
              Портал процессов компании
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 560, mb: 2.5, fontSize: { xs: 14, md: 15 } }}
            >
              Единая архитектура от стратегии до операций. Каждый домен — это набор L2-процессов,
              L3-подпроцессов и пошаговых SOP-инструкций для операционной дисциплины.
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1.5,
                alignItems: { xs: 'stretch', sm: 'center' },
              }}
            >
              <Button
                component={RouterLink}
                to="/registry"
                variant="contained"
                disableElevation
                startIcon={<ListAltIcon />}
                size="medium"
                sx={{
                  px: 2.75,
                  py: 1.1,
                  borderRadius: 2,
                  fontWeight: 600,
                }}
              >
                Реестр процессов
              </Button>
              <Button
                component={RouterLink}
                to="/dictionaries"
                variant="outlined"
                startIcon={<AccountTreeIcon />}
                size="medium"
                sx={{
                  px: 2.5,
                  py: 1.05,
                  borderRadius: 2,
                  borderStyle: 'dashed',
                }}
              >
                Справочники
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: 'background.paper',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}>
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

      {/* Domains in architecture order */}
      <Box
        sx={{
          pt: SECTION_GAP,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.25,
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Домены
          </Typography>
          <Chip
            label={`${domains.length} ${domains.length === 1 ? 'домен' : domains.length < 5 ? 'домена' : 'доменов'}`}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
        </Box>
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2.5,
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '2fr 1fr 1fr',
                md: '2.5fr 3fr 0.8fr 0.8fr 0.8fr',
              },
              gap: 1,
              px: { xs: 1.5, md: 2 },
              py: 1,
              bgcolor: 'background.paper',
              borderBottom: '1px solid',
              borderColor: 'divider',
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Домен
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: { xs: 'none', md: 'block' },
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.4,
              }}
            >
              Описание
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              L2
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                display: { xs: 'none', md: 'block' },
              }}
            >
              L3
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                display: { xs: 'none', md: 'block' },
              }}
            >
              SOP
            </Typography>
          </Box>

          {domains.map((d, index) => {
            const stats = domainStats[d.id] || {};
            const l2 = stats.total_l2 ?? '–';
            const l3 = stats.total_l3 ?? '–';
            const sop = stats.total_sop ?? '–';

            return (
              <Box
                key={d.id}
                component={RouterLink}
                to={`/domain/${d.id}`}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '2fr 1fr 1fr',
                    md: '2.5fr 3fr 0.8fr 0.8fr 0.8fr',
                  },
                  gap: 1,
                  px: { xs: 1.5, md: 2 },
                  py: 1,
                  textDecoration: 'none',
                  color: 'inherit',
                  bgcolor: index % 2 === 0 ? 'background.paper' : 'rgba(15, 23, 42, 0.02)',
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    transform: 'translateY(-1px)',
                    transition: 'background-color 120ms ease, transform 120ms ease',
                  },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: d.color || 'primary.main',
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {d.name_ru}
                    </Typography>
                    <ChevronRightIcon
                      fontSize="small"
                      sx={{
                        ml: 'auto',
                        color: 'text.disabled',
                        display: { xs: 'inline-flex', md: 'none' },
                      }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: { xs: 'block', md: 'none' },
                      mt: 0.25,
                      maxHeight: 32,
                      overflow: 'hidden',
                    }}
                  >
                    {d.description_ru}
                  </Typography>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: { xs: 'none', md: 'block' },
                    maxHeight: 40,
                    overflow: 'hidden',
                  }}
                >
                  {d.description_ru}
                </Typography>

                <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                  {l2}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'right',
                    display: { xs: 'none', md: 'block' },
                  }}
                >
                  {l3}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'right',
                    display: { xs: 'none', md: 'block' },
                  }}
                >
                  {sop}
                </Typography>
              </Box>
            );
          })}
        </Paper>
      </Box>
    </Box>
  );
}
