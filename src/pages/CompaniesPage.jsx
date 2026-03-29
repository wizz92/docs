import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LoadingSkeleton from '../components/LoadingSkeleton';
import useProcessData from '../hooks/useProcessData';
import {
  COMPANY_SLUG_ORDER,
  companyLabelFromSlug,
  DEFAULT_COMPANY_SLUG,
} from '../../shared/companies.js';
import { getCategorySlugForDomain, REQUIRED_CATEGORY_SLUGS } from '../../shared/domainCatalog.js';

/**
 * L0 landing: pick a company, then browse domains (L1) inside it.
 */
export default function CompaniesPage() {
  const { masterIndex, loading, error, loadDomainIndex, refreshMasterIndex } = useProcessData();
  const [statsByCompany, setStatsByCompany] = useState({});
  const [scaffolding, setScaffolding] = useState(null);
  const [scaffoldError, setScaffoldError] = useState(null);

  const coverageByCompany = useMemo(() => {
    const out = {};
    COMPANY_SLUG_ORDER.forEach((slug) => {
      const cats = new Set(
        (masterIndex?.domains || [])
          .filter((d) => (d.companyId || DEFAULT_COMPANY_SLUG) === slug)
          .map((d) => getCategorySlugForDomain(d)),
      );
      const present = REQUIRED_CATEGORY_SLUGS.filter((s) => cats.has(s)).length;
      out[slug] = { present, total: REQUIRED_CATEGORY_SLUGS.length };
    });
    return out;
  }, [masterIndex]);

  async function scaffoldMissing(slug) {
    setScaffoldError(null);
    setScaffolding(slug);
    try {
      const res = await fetch(`/api/companies/${slug}/scaffold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      await refreshMasterIndex();
    } catch (e) {
      setScaffoldError(e.message || String(e));
    } finally {
      setScaffolding(null);
    }
  }

  useEffect(() => {
    if (!masterIndex?.domains) return;
    COMPANY_SLUG_ORDER.forEach((slug) => {
      const ds = masterIndex.domains.filter(
        (d) => (d.companyId || DEFAULT_COMPANY_SLUG) === slug,
      );
      if (ds.length === 0) {
        setStatsByCompany((prev) => ({
          ...prev,
          [slug]: { domains: 0, totalL2: 0, totalL3: 0, totalSop: 0 },
        }));
        return;
      }
      const acc = { domains: ds.length, totalL2: 0, totalL3: 0, totalSop: 0 };
      let done = 0;
      ds.forEach((d) => {
        loadDomainIndex(d.id)
          .then((idx) => {
            if (idx?.summary) {
              acc.totalL2 += idx.summary.total_l2 || 0;
              acc.totalL3 += idx.summary.total_l3 || 0;
              acc.totalSop += idx.summary.total_sop || 0;
            }
          })
          .catch(() => {})
          .finally(() => {
            done += 1;
            if (done === ds.length) {
              setStatsByCompany((prev) => ({ ...prev, [slug]: { ...acc } }));
            }
          });
      });
    });
  }, [masterIndex, loadDomainIndex]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <Alert severity="error">Ошибка загрузки: {error.message}</Alert>;

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Компании (L0)
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Выберите компанию, чтобы открыть домены (L1) и дерево процессов L2–L3–SOP.
      </Typography>

      {scaffoldError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setScaffoldError(null)}>
          {scaffoldError}
        </Alert>
      )}

      <Grid container spacing={2}>
        {COMPANY_SLUG_ORDER.map((slug) => {
          const s = statsByCompany[slug];
          const label = companyLabelFromSlug(slug);
          const cov = coverageByCompany[slug] || { present: 0, total: REQUIRED_CATEGORY_SLUGS.length };
          const complete = cov.present >= cov.total;
          return (
            <Grid item xs={12} sm={6} md={4} key={slug}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  transition: 'box-shadow 0.15s ease, transform 0.15s ease',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box
                  component={RouterLink}
                  to={`/company/${slug}`}
                  sx={{
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'block',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" fontWeight={700}>
                      {label}
                    </Typography>
                    <ChevronRightIcon color="action" />
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    L0 · {slug}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      mb: 0.5,
                      color: complete ? 'success.main' : 'text.secondary',
                    }}
                  >
                    {cov.present} / {cov.total} категорий
                  </Typography>
                  {s ? (
                    <Typography variant="body2" color="text.secondary">
                      Доменов: {s.domains}
                      {' · '}
                      L2: {s.totalL2}
                      {' · '}
                      L3: {s.totalL3}
                      {' · '}
                      SOP: {s.totalSop}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      …
                    </Typography>
                  )}
                </Box>
                {!complete && (
                  <Button
                    size="small"
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 1.5 }}
                    disabled={scaffolding === slug}
                    onClick={() => scaffoldMissing(slug)}
                  >
                    {scaffolding === slug ? 'Создание…' : 'Создать недостающие'}
                  </Button>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
