import { useMemo, useState, useCallback, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import LoadingSkeleton from '../components/LoadingSkeleton';
import useProcessData from '../hooks/useProcessData';
import { companyClientPath, DEFAULT_COMPANY_SLUG } from '../../shared/companies.js';

const TYPE_COLORS = { process_l1: 'primary', process_l2: 'info', process_l3: 'secondary', sop: 'warning' };
const TYPE_LABELS = { process_l1: 'L1', process_l2: 'L2', process_l3: 'L3', sop: 'SOP' };

function buildRows(domainId, index, companyId) {
  const rows = [];
  if (!index) return rows;
  const p = (suffix) => companyClientPath(companyId, suffix);

  rows.push({
    name: index.l1.name,
    type: 'process_l1',
    path: index.l1.path,
    link: p(`domain/${domainId}`),
    parent: '—',
    domain: domainId,
    sopCount: '—',
  });

  for (const l2 of index.l2_processes || []) {
    const l2SopCount = l2.l3_processes?.reduce((n, l3) => n + (l3.sops?.length || 0), 0) || 0;
    rows.push({
      name: l2.name,
      type: 'process_l2',
      path: l2.path,
      link: p(`domain/${domainId}/l2/${l2.folder}`),
      parent: index.l1.name,
      domain: domainId,
      sopCount: l2SopCount,
    });

    for (const l3 of l2.l3_processes || []) {
      rows.push({
        name: l3.name,
        type: 'process_l3',
        path: l3.path,
        link: p(`domain/${domainId}/l3/${l2.folder}/${l3.folder}`),
        parent: l2.name,
        domain: domainId,
        sopCount: l3.sops?.length || 0,
      });

      for (const sop of l3.sops || []) {
        rows.push({
          name: sop.name,
          type: 'sop',
          path: sop.path,
          link: p(`domain/${domainId}/sop/${l2.folder}/${l3.folder}/${sop.file}`),
          parent: l3.name,
          domain: domainId,
          sopCount: '—',
        });
      }
    }
  }
  return rows;
}

export default function RegistryPage() {
  const { masterIndex, loading, error, loadJson, loadDomainIndex } = useProcessData();
  const [typeFilter, setTypeFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [details, setDetails] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [allDomainIndexes, setAllDomainIndexes] = useState({});

  useEffect(() => {
    if (!masterIndex?.domains) return;
    masterIndex.domains.forEach((d) => {
      loadDomainIndex(d.id)
        .then((idx) => setAllDomainIndexes((prev) => ({ ...prev, [d.id]: idx })))
        .catch(() => {});
    });
  }, [masterIndex, loadDomainIndex]);

  const allRows = useMemo(() => {
    const rows = [];
    const domainCompany = Object.fromEntries(
      (masterIndex?.domains || []).map((d) => [
        d.id,
        d.companyId || DEFAULT_COMPANY_SLUG,
      ]),
    );
    for (const [domainId, idx] of Object.entries(allDomainIndexes)) {
      const companyId = domainCompany[domainId] || DEFAULT_COMPANY_SLUG;
      rows.push(...buildRows(domainId, idx, companyId));
    }
    return rows;
  }, [allDomainIndexes, masterIndex]);

  const filteredRows = useMemo(() => {
    let rows = allRows;
    if (typeFilter !== 'all') rows = rows.filter((r) => r.type === typeFilter);
    if (domainFilter !== 'all') rows = rows.filter((r) => r.domain === domainFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) => r.name.toLowerCase().includes(q) || r.parent.toLowerCase().includes(q),
      );
    }
    rows = [...rows].sort((a, b) => {
      let va = a[sortField] ?? '';
      let vb = b[sortField] ?? '';
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      va = String(va).toLowerCase();
      vb = String(vb).toLowerCase();
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return rows;
  }, [allRows, typeFilter, domainFilter, search, sortField, sortDir]);

  const handleSort = useCallback(
    (field) => () => {
      setSortDir((prev) => (sortField === field && prev === 'asc' ? 'desc' : 'asc'));
      setSortField(field);
    },
    [sortField],
  );

  const loadDetails = useCallback(async () => {
    if (detailsLoading) return;
    setDetailsLoading(true);
    const processRows = allRows.filter((r) => r.type !== 'sop' && r.type !== 'process_l1');
    const results = {};
    await Promise.all(
      processRows.map(async (row) => {
        try {
          const data = await loadJson(row.path);
          results[row.path] = { owner: data.owner, access_level: data.access_level, review_cadence: data.review_cadence };
        } catch { /* ignore */ }
      }),
    );
    setDetails((prev) => ({ ...prev, ...results }));
    setDetailsLoading(false);
  }, [allRows, loadJson, detailsLoading]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <Alert severity="error">Ошибка загрузки: {error.message}</Alert>;

  const hasDetails = Object.keys(details).length > 0;
  const domains = masterIndex?.domains || [];
  const domainNameMap = Object.fromEntries(domains.map((d) => [d.id, d.name_ru || d.name]));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Реестр процессов
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 800 }}>
        Единый индекс всех процессов компании. Фильтруйте по домену, типу, ищите по названию.
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
        <ToggleButtonGroup
          value={typeFilter}
          exclusive
          onChange={(_e, val) => val && setTypeFilter(val)}
          size="small"
        >
          <ToggleButton value="all">Все ({allRows.length})</ToggleButton>
          <ToggleButton value="process_l1">L1</ToggleButton>
          <ToggleButton value="process_l2">L2</ToggleButton>
          <ToggleButton value="process_l3">L3</ToggleButton>
          <ToggleButton value="sop">SOP</ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup
          value={domainFilter}
          exclusive
          onChange={(_e, val) => val && setDomainFilter(val)}
          size="small"
        >
          <ToggleButton value="all">Все домены</ToggleButton>
          {domains.map((d) => (
            <ToggleButton key={d.id} value={d.id}>
              {d.name_ru?.substring(0, 12) || d.name?.substring(0, 12)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <TextField
          size="small"
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 240 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {!hasDetails && (
          <Button
            variant="outlined"
            size="small"
            startIcon={detailsLoading ? <CircularProgress size={16} /> : <DownloadIcon />}
            onClick={loadDetails}
            disabled={detailsLoading}
          >
            {detailsLoading ? 'Загрузка...' : 'Загрузить детали'}
          </Button>
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Показано {filteredRows.length} из {allRows.length}
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel active={sortField === 'type'} direction={sortField === 'type' ? sortDir : 'asc'} onClick={handleSort('type')}>
                  Тип
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={sortField === 'name'} direction={sortField === 'name' ? sortDir : 'asc'} onClick={handleSort('name')}>
                  Название
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={sortField === 'domain'} direction={sortField === 'domain' ? sortDir : 'asc'} onClick={handleSort('domain')}>
                  Домен
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={sortField === 'parent'} direction={sortField === 'parent' ? sortDir : 'asc'} onClick={handleSort('parent')}>
                  Родитель
                </TableSortLabel>
              </TableCell>
              {hasDetails && <TableCell>Владелец</TableCell>}
              {hasDetails && <TableCell>Доступ</TableCell>}
              {hasDetails && <TableCell>Ревью</TableCell>}
              <TableCell align="right">
                <TableSortLabel active={sortField === 'sopCount'} direction={sortField === 'sopCount' ? sortDir : 'asc'} onClick={handleSort('sopCount')}>
                  SOP
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((row, i) => {
              const d = details[row.path];
              return (
                <TableRow key={i} hover>
                  <TableCell>
                    <Chip label={TYPE_LABELS[row.type]} size="small" color={TYPE_COLORS[row.type]} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Link component={RouterLink} to={row.link} underline="hover">
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 140 }}>
                      {domainNameMap[row.domain] || row.domain}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                      {row.parent}
                    </Typography>
                  </TableCell>
                  {hasDetails && <TableCell><Typography variant="body2" noWrap>{d?.owner || '—'}</Typography></TableCell>}
                  {hasDetails && <TableCell><Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>{d?.access_level || '—'}</Typography></TableCell>}
                  {hasDetails && <TableCell><Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>{d?.review_cadence || '—'}</Typography></TableCell>}
                  <TableCell align="right">
                    {row.sopCount === '—' ? '—' : row.sopCount}
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={hasDetails ? 8 : 5} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    Ничего не найдено
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
