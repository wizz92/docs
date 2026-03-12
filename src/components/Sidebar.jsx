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
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ListAltIcon from '@mui/icons-material/ListAlt';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import DescriptionIcon from '@mui/icons-material/Description';

export default function Sidebar({ masterIndex, domainId, domainIndex, domainMeta, loading, onClose }) {
  const { l2Folder, l3Folder, sopFile } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

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

  const domains = masterIndex.domains || [];

  return (
    <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Portal header */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Process Portal
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Документация процессов компании
        </Typography>
      </Box>

      <Divider />

      {/* Global navigation */}
      <List dense disablePadding sx={{ py: 0.5 }}>
        <ListItemButton
          selected={location.pathname === '/'}
          onClick={() => go('/')}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <HomeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Все домены"
            primaryTypographyProps={{ variant: 'body2', fontWeight: location.pathname === '/' ? 700 : 500 }}
          />
        </ListItemButton>
        <ListItemButton
          selected={location.pathname === '/architecture'}
          onClick={() => go('/architecture')}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <AccountTreeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Архитектура процессов"
            primaryTypographyProps={{ variant: 'body2', fontWeight: location.pathname === '/architecture' ? 700 : 500 }}
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
      </List>

      <Divider />

      {/* Domain list */}
      <Typography variant="overline" color="text.secondary" sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
        Домены ({domains.length})
      </Typography>
      <List dense disablePadding>
        {domains.map((d) => {
          const isActive = d.id === domainId;
          return (
            <ListItemButton
              key={d.id}
              selected={isActive && !l2Folder}
              onClick={() => go(`/domain/${d.id}`)}
              sx={{ pl: 2, py: 0.5 }}
            >
              <Box
                sx={{
                  width: 8, height: 8, borderRadius: '50%',
                  bgcolor: d.color || '#1976d2',
                  mr: 1.5, flexShrink: 0,
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
              {isActive && <ExpandLess fontSize="small" sx={{ color: 'text.secondary', ml: 0.5 }} />}
            </ListItemButton>
          );
        })}
      </List>

      {/* Active domain L2/L3/SOP tree */}
      {domainId && domainIndex && (
        <>
          <Divider sx={{ mt: 0.5 }} />
          <Box
            sx={{
              borderLeft: 3,
              borderColor: domainMeta?.color || 'primary.main',
              ml: 1.5,
              mt: 1,
            }}
          >
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ pl: 1.5, pb: 0.5, display: 'block', lineHeight: 1.6, fontSize: 10 }}
            >
              {domainMeta?.name_ru || domainIndex.l1?.name}
            </Typography>

          <List dense disablePadding sx={{ flexGrow: 1 }}>
            {/* L1 domain root */}
            <ListItemButton
              selected={location.pathname === `/domain/${domainId}` && !l2Folder}
              onClick={() => go(`/domain/${domainId}`)}
              sx={{ pl: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <FolderOpenIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={`L1 · ${domainIndex.l1?.name || domainId}`}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 600, fontSize: 13 }}
              />
            </ListItemButton>

            {/* L2 processes with L3/SOP subtrees */}
            {domainIndex.l2_processes?.map((l2) => {
              const l2Active = l2.folder === l2Folder;
              const l3Count = l2.l3_processes?.length || 0;
              return (
                <Box key={l2.folder}>
                  <ListItemButton
                    selected={l2Active && !l3Folder}
                    onClick={() => go(`/domain/${domainId}/l2/${l2.folder}`)}
                    sx={{ pl: 3, py: 0.3 }}
                  >
                    <ListItemText
                      primary={l2.name}
                      primaryTypographyProps={{ variant: 'body2', noWrap: true, fontSize: 13 }}
                    />
                    {l3Count > 0 && (
                      l2Active
                        ? <ExpandLess fontSize="small" sx={{ color: 'text.secondary' }} />
                        : <ExpandMore fontSize="small" sx={{ color: 'text.disabled' }} />
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
                              onClick={() => go(`/domain/${domainId}/l3/${l2.folder}/${l3.folder}`)}
                              sx={{ pl: 5, py: 0.2 }}
                            >
                              <ListItemText
                                primary={l3.name}
                                primaryTypographyProps={{ variant: 'body2', noWrap: true, fontSize: 12 }}
                              />
                              {sopCount > 0 && l3Active && (
                                <Chip label={sopCount} size="small" sx={{ height: 18, fontSize: 10, ml: 0.5 }} />
                              )}
                            </ListItemButton>

                            <Collapse in={l3Active} timeout="auto" unmountOnExit>
                              <List dense disablePadding>
                                {l3.sops?.map((sop) => {
                                  const sopPath = `/domain/${domainId}/sop/${l2.folder}/${l3.folder}/${sop.file}`;
                                  return (
                                    <ListItemButton
                                      key={sop.file}
                                      onClick={() => go(sopPath)}
                                      sx={{ pl: 6, py: 0.1 }}
                                      selected={location.pathname === sopPath}
                                    >
                                      <ListItemIcon sx={{ minWidth: 22 }}>
                                        <DescriptionIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                      </ListItemIcon>
                                      <ListItemText
                                        primary={sop.name}
                                        primaryTypographyProps={{
                                          variant: 'caption',
                                          noWrap: true,
                                          sx: { fontSize: 11 },
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
        </>
      )}

      {!domainId && <Box sx={{ flexGrow: 1 }} />}
    </Box>
  );
}
