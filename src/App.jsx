import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Layout from './components/Layout';
import DomainsPage from './pages/DomainsPage';
import DomainPage from './pages/DomainPage';
import L2Page from './pages/L2Page';
import L3Page from './pages/L3Page';
import SopPage from './pages/SopPage';
import ArchitecturePage from './pages/ArchitecturePage';
import RegistryPage from './pages/RegistryPage';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DomainsPage />} />
            <Route path="architecture" element={<ArchitecturePage />} />
            <Route path="registry" element={<RegistryPage />} />
            <Route path="domain/:domainId" element={<DomainPage />} />
            <Route path="domain/:domainId/l2/:l2Folder" element={<L2Page />} />
            <Route path="domain/:domainId/l3/:l2Folder/:l3Folder" element={<L3Page />} />
            <Route path="domain/:domainId/sop/:l2Folder/:l3Folder/:sopFile" element={<SopPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
