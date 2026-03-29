import { useState, useEffect } from 'react';
import { Outlet, useMatch, useNavigate, useParams } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Slide from '@mui/material/Slide';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import MenuIcon from '@mui/icons-material/Menu';
import Sidebar from './Sidebar';
import BreadcrumbsNav from './Breadcrumbs';
import useProcessData from '../hooks/useProcessData';
import { companyLabelFromSlug, DEFAULT_COMPANY_SLUG } from '../../shared/companies.js';

export const DRAWER_WIDTH = 280;

export default function Layout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hideAppBar, setHideAppBar] = useState(false);
  const { masterIndex, loading, loadDomainIndex } = useProcessData();

  const routeParams = useParams();
  const domainMatch = useMatch('/company/:companyId/domain/:domainId/*');
  /** Prefer leaf route `useParams().domainId` so nested routes always resolve (useMatch can be null in some nested cases). */
  const domainId = routeParams.domainId ?? domainMatch?.params?.domainId ?? null;
  const companyId = routeParams.companyId ?? null;
  const [domainIndex, setDomainIndex] = useState(null);
  const domainMeta = masterIndex?.domains?.find((d) => d.id === domainId) || null;

  const [backendInfo, setBackendInfo] = useState(null);

  useEffect(() => {
    fetch('/api/backend')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data && setBackendInfo({ mongodbConnected: data.mongodbConnected }))
      .catch(() => setBackendInfo(null));
  }, []);

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

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      setHideAppBar(scrollingDown && currentScrollY > 64);
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const drawer = (
    <Sidebar
      masterIndex={masterIndex}
      companyId={companyId}
      domainId={domainId}
      domainIndex={domainIndex}
      domainMeta={domainMeta}
      loading={loading}
      onClose={() => setMobileOpen(false)}
    />
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Slide appear={false} direction="down" in={!hideAppBar}>
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
                Портал документации процессов
              </Typography>
            </Box>
            <Button
              color="inherit"
              variant="outlined"
              size="small"
              sx={{ mr: 1 }}
              onClick={() => {
                const cid = companyId || DEFAULT_COMPANY_SLUG;
                navigate(`/company/${cid}/create`);
              }}
            >
              Создать процесс
            </Button>
            {backendInfo && (
              <Chip
                label={backendInfo.mongodbConnected ? 'Data: MongoDB' : 'Data: MongoDB (offline)'}
                size="small"
                variant="outlined"
                sx={{ mr: 1, opacity: 0.9 }}
              />
            )}
            {companyId && (
              <Chip
                label={companyLabelFromSlug(companyId)}
                size="small"
                variant="outlined"
                sx={{ mr: 1 }}
              />
            )}
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
      </Slide>

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
          companyId={companyId}
          domainId={domainId}
          domainIndex={domainIndex}
          domainMeta={domainMeta}
        />
        <Outlet />
      </Box>
    </Box>
  );
}
