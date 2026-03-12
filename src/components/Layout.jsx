import { useState, useEffect } from 'react';
import { Outlet, useMatch } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import Sidebar from './Sidebar';
import BreadcrumbsNav from './Breadcrumbs';
import useProcessData from '../hooks/useProcessData';

const DRAWER_WIDTH = 280;

export default function Layout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { masterIndex, loading, loadDomainIndex } = useProcessData();

  const domainMatch = useMatch('/domain/:domainId/*');
  const domainId = domainMatch?.params?.domainId || null;
  const [domainIndex, setDomainIndex] = useState(null);
  const domainMeta = masterIndex?.domains?.find((d) => d.id === domainId) || null;

  useEffect(() => {
    if (!domainId || !masterIndex) {
      setDomainIndex(null);
      return;
    }
    loadDomainIndex(domainId)
      .then(setDomainIndex)
      .catch(() => setDomainIndex(null));
  }, [domainId, masterIndex, loadDomainIndex]);

  const domainName = domainMeta?.name_ru || domainIndex?.l1?.name || 'Process Portal';

  const drawer = (
    <Sidebar
      masterIndex={masterIndex}
      domainId={domainId}
      domainIndex={domainIndex}
      domainMeta={domainMeta}
      loading={loading}
      onClose={() => setMobileOpen(false)}
    />
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}
        elevation={1}
      >
        <Toolbar>
          {!isDesktop && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 1 }}
              aria-label="Открыть меню"
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap>
              Портал документации процессов 1
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }} noWrap>
              {domainMeta ? domainMeta.description_ru : 'Все домены компании'}
            </Typography>
          </Box>
          {domainMeta && (
            <Chip
              label={domainName}
              size="small"
              color="secondary"
              icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: domainMeta.color || '#4caf50', ml: 1 }} />}
            />
          )}
        </Toolbar>
      </AppBar>

      {isDesktop ? (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawer}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        <BreadcrumbsNav
          domainId={domainId}
          domainIndex={domainIndex}
          domainMeta={domainMeta}
        />
        <Outlet />
      </Box>
    </Box>
  );
}
