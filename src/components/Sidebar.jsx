import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import ListAltIcon from '@mui/icons-material/ListAlt';
import TuneIcon from '@mui/icons-material/Tune';
import BusinessIcon from '@mui/icons-material/Business';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import DescriptionIcon from '@mui/icons-material/Description';
import { sortDomains } from '../utils/domainOrder';
import {
  companyLabelFromSlug,
  companyClientPath,
  DEFAULT_COMPANY_SLUG,
  COMPANY_SLUG_ORDER,
} from '../../shared/companies.js';

function buildDomainsByCompany(masterIndex) {
  const all = masterIndex?.domains || [];
  const grouped = {};
  COMPANY_SLUG_ORDER.forEach((slug) => {
    grouped[slug] = [];
  });
  all.forEach((d) => {
    const key = d.companyId || DEFAULT_COMPANY_SLUG;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(d);
  });
  for (const key of Object.keys(grouped)) {
    grouped[key] = sortDomains(grouped[key], masterIndex);
  }
  return grouped;
}

/** Stable company section order: known slugs first, then any extra keys alphabetically. */
function companySectionSlugs(domainsByCompany) {
  const extra = Object.keys(domainsByCompany)
    .filter((k) => !COMPANY_SLUG_ORDER.includes(k))
    .sort();
  return [...COMPANY_SLUG_ORDER, ...extra];
}

export default function Sidebar({
  masterIndex,
  companyId,
  domainId,
  domainIndex,
  domainMeta,
  loading,
  onClose,
}) {
  const { l2Folder, l3Folder, sopFile } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [expandedCompany, setExpandedCompany] = useState(companyId || null);

  useEffect(() => {
    if (companyId) setExpandedCompany(companyId);
  }, [companyId]);

  const domainsByCompany = useMemo(
    () => buildDomainsByCompany(masterIndex),
    [masterIndex],
  );

  const sectionSlugs = useMemo(
    () => companySectionSlugs(domainsByCompany),
    [domainsByCompany],
  );

  if (loading || !masterIndex) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  const go = (path) => {
    navigate(path);
    onClose?.();
  };

  const goCompanyPath = (slug, pathUnderCompany) => {
    go(companyClientPath(slug, pathUnderCompany));
  };

  const handleCompanyRowClick = (slug) => {
    const underSlug =
      location.pathname === `/company/${slug}`
      || location.pathname.startsWith(`/company/${slug}/`);
    if (expandedCompany === slug && underSlug) {
      setExpandedCompany(null);
      return;
    }
    go(`/company/${slug}`);
    setExpandedCompany(slug);
  };

  const activeDomainCompany =
    domainMeta?.companyId || DEFAULT_COMPANY_SLUG;

  return (
    <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%' }}>

      <List dense disablePadding sx={{ py: 0.5 }}>
        <ListItemButton
          selected={location.pathname === '/'}
          onClick={() => go('/')}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <HomeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Все компании"
            primaryTypographyProps={{ variant: 'body2', fontWeight: location.pathname === '/' ? 700 : 500 }}
          />
        </ListItemButton>
        <ListItemButton
          selected={location.pathname === '/registry'}
          onClick={() => go('/registry')}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <ListAltIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Реестр процессов"
            primaryTypographyProps={{ variant: 'body2', fontWeight: location.pathname === '/registry' ? 700 : 500 }}
          />
        </ListItemButton>
        <ListItemButton
          selected={location.pathname === '/dictionaries'}
          onClick={() => go('/dictionaries')}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <TuneIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Справочники"
            primaryTypographyProps={{ variant: 'body2', fontWeight: location.pathname === '/dictionaries' ? 700 : 500 }}
          />
        </ListItemButton>
      </List>

      <Divider />

      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'block', letterSpacing: 0.6 }}
      >
        Компании
      </Typography>

      <List dense disablePadding sx={{ pb: 1 }}>
        {sectionSlugs.map((slug) => {
          const domains = domainsByCompany[slug] || [];
          const count = domains.length;
          const isExpanded = expandedCompany === slug;
          const underThisCompany =
            location.pathname === `/company/${slug}`
            || location.pathname.startsWith(`/company/${slug}/`);

          return (
            <Box key={slug}>
              <ListItemButton
                onClick={() => handleCompanyRowClick(slug)}
                selected={underThisCompany}
                sx={{
                  pl: 1.5,
                  py: 0.65,
                  borderLeft: 3,
                  borderColor: isExpanded ? 'primary.main' : 'transparent',
                  bgcolor: isExpanded ? 'action.hover' : 'transparent',
                }}
              >
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <BusinessIcon
                    fontSize="small"
                    color={isExpanded ? 'primary' : 'action'}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={companyLabelFromSlug(slug)}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: underThisCompany ? 700 : 500,
                    noWrap: true,
                    sx: { fontSize: 13 },
                  }}
                />
                <Chip
                  label={count}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: 11, mr: 0.5, flexShrink: 0 }}
                />
                {isExpanded ? (
                  <ExpandLess fontSize="small" sx={{ color: 'text.secondary' }} />
                ) : (
                  <ExpandMore fontSize="small" sx={{ color: 'text.disabled' }} />
                )}
              </ListItemButton>

              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <List dense disablePadding>
                  {domains.map((d) => {
                    const isActive = d.id === domainId && activeDomainCompany === slug;
                    const showTree =
                      isActive
                      && domainIndex
                      && companyId === slug
                      && domainId === d.id;

                    return (
                      <Box key={d.id}>
                        <ListItemButton
                          selected={isActive && !l2Folder}
                          onClick={() => goCompanyPath(slug, `domain/${d.id}`)}
                          sx={{ pl: 3, py: 0.45 }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: d.color || '#1976d2',
                              mr: 1.25,
                              flexShrink: 0,
                              outline: isActive ? `2px solid ${d.color || '#1976d2'}` : 'none',
                              outlineOffset: 2,
                            }}
                          />
                          <ListItemText
                            primary={d.name_ru}
                            primaryTypographyProps={{
                              variant: 'body2',
                              fontWeight: isActive ? 700 : 400,
                              noWrap: true,
                              sx: { fontSize: 13 },
                            }}
                          />
                          {isActive && !showTree && (
                            <ExpandLess fontSize="small" sx={{ color: 'text.secondary', ml: 0.5 }} />
                          )}
                        </ListItemButton>

                        {showTree && (
                          <Box
                            sx={{
                              borderLeft: 3,
                              borderColor: domainMeta?.color || 'primary.main',
                              ml: 2,
                              pl: 0.5,
                              mt: 0.25,
                              mb: 0.5,
                            }}
                          >
                            <Typography
                              variant="overline"
                              color="text.secondary"
                              sx={{
                                pl: 1.25,
                                pb: 0.35,
                                display: 'block',
                                lineHeight: 1.6,
                                fontSize: 10,
                              }}
                            >
                              {domainMeta?.name_ru || domainIndex.l1?.name}
                            </Typography>

                            <List dense disablePadding>
                              <ListItemButton
                                selected={
                                  location.pathname
                                  === companyClientPath(slug, `domain/${domainId}`)
                                  && !l2Folder
                                }
                                onClick={() => goCompanyPath(slug, `domain/${domainId}`)}
                                sx={{ pl: 2.25, py: 0.25 }}
                              >
                                <ListItemIcon sx={{ minWidth: 26 }}>
                                  <FolderOpenIcon fontSize="small" color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={`L1 · ${domainIndex.l1?.name || domainId}`}
                                  primaryTypographyProps={{
                                    variant: 'body2',
                                    fontWeight: 600,
                                    fontSize: 12,
                                  }}
                                />
                              </ListItemButton>

                              {domainIndex.l2_processes?.map((l2) => {
                                const l2Active = l2.folder === l2Folder;
                                const l3Count = l2.l3_processes?.length || 0;
                                return (
                                  <Box key={l2.folder}>
                                    <ListItemButton
                                      selected={l2Active && !l3Folder}
                                      onClick={() =>
                                        goCompanyPath(
                                          slug,
                                          `domain/${domainId}/l2/${l2.folder}`,
                                        )
                                      }
                                      sx={{ pl: 3.25, py: 0.2 }}
                                    >
                                      <ListItemText
                                        primary={l2.name}
                                        primaryTypographyProps={{
                                          variant: 'body2',
                                          noWrap: true,
                                          fontSize: 12,
                                        }}
                                      />
                                      {l3Count > 0 && (
                                        l2Active
                                          ? (
                                            <ExpandLess
                                              fontSize="small"
                                              sx={{ color: 'text.secondary' }}
                                            />
                                          )
                                          : (
                                            <ExpandMore
                                              fontSize="small"
                                              sx={{ color: 'text.disabled' }}
                                            />
                                          )
                                      )}
                                    </ListItemButton>

                                    <Collapse in={l2Active} timeout="auto" unmountOnExit>
                                      <List dense disablePadding>
                                        {l2.l3_processes?.map((l3) => {
                                          const l3Active = l3.folder === l3Folder;
                                          const sopCount = l3.sops?.length || 0;
                                          return (
                                            <Box key={l3.folder}>
                                              <ListItemButton
                                                selected={l3Active && !sopFile}
                                                onClick={() =>
                                                  goCompanyPath(
                                                    slug,
                                                    `domain/${domainId}/l3/${l2.folder}/${l3.folder}`,
                                                  )
                                                }
                                                sx={{ pl: 5, py: 0.15 }}
                                              >
                                                <ListItemText
                                                  primary={l3.name}
                                                  primaryTypographyProps={{
                                                    variant: 'body2',
                                                    noWrap: true,
                                                    fontSize: 11,
                                                  }}
                                                />
                                                {sopCount > 0 && l3Active && (
                                                  <Chip
                                                    label={sopCount}
                                                    size="small"
                                                    sx={{ height: 17, fontSize: 10, ml: 0.5 }}
                                                  />
                                                )}
                                              </ListItemButton>

                                              <Collapse in={l3Active} timeout="auto" unmountOnExit>
                                                <List dense disablePadding>
                                                  {l3.sops?.map((sop) => {
                                                    const sopPath = companyClientPath(
                                                      slug,
                                                      `domain/${domainId}/sop/${l2.folder}/${l3.folder}/${sop.file}`,
                                                    );
                                                    return (
                                                      <ListItemButton
                                                        key={sop.file}
                                                        onClick={() => go(sopPath)}
                                                        sx={{ pl: 6.5, py: 0.1 }}
                                                        selected={location.pathname === sopPath}
                                                      >
                                                        <ListItemIcon sx={{ minWidth: 20 }}>
                                                          <DescriptionIcon
                                                            sx={{ fontSize: 13, color: 'text.disabled' }}
                                                          />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                          primary={sop.name}
                                                          primaryTypographyProps={{
                                                            variant: 'caption',
                                                            noWrap: true,
                                                            sx: { fontSize: 10 },
                                                          }}
                                                        />
                                                      </ListItemButton>
                                                    );
                                                  })}
                                                </List>
                                              </Collapse>
                                            </Box>
                                          );
                                        })}
                                      </List>
                                    </Collapse>
                                  </Box>
                                );
                              })}
                            </List>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </List>

      {!domainId && <Box sx={{ flexGrow: 1 }} />}
    </Box>
  );
}
