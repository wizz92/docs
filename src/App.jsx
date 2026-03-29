import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Layout from './components/Layout';
import CompaniesPage from './pages/CompaniesPage';
import DomainsPage from './pages/DomainsPage';
import DomainPage from './pages/DomainPage';
import L2Page from './pages/L2Page';
import L3Page from './pages/L3Page';
import SopPage from './pages/SopPage';
import RegistryPage from './pages/RegistryPage';
import DictionariesPage from './pages/DictionariesPage';
import EditorPage from './pages/EditorPage';
import LegacyDomainRedirect from './components/LegacyDomainRedirect';
import { DEFAULT_COMPANY_SLUG } from '../shared/companies.js';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<CompaniesPage />} />
            <Route path="registry" element={<RegistryPage />} />
            <Route path="dictionaries" element={<DictionariesPage />} />
            <Route path="create" element={<Navigate to={`/company/${DEFAULT_COMPANY_SLUG}/create`} replace />} />
            <Route path="company/:companyId" element={<DomainsPage />} />
            <Route path="company/:companyId/create" element={<EditorPage />} />
            <Route path="company/:companyId/domain/:domainId" element={<DomainPage />} />
            <Route path="company/:companyId/domain/:domainId/l1/edit" element={<EditorPage />} />
            <Route path="company/:companyId/domain/:domainId/create/l2" element={<EditorPage />} />
            <Route path="company/:companyId/domain/:domainId/create" element={<EditorPage />} />
            <Route path="company/:companyId/domain/:domainId/l2/:l2Folder" element={<L2Page />} />
            <Route path="company/:companyId/domain/:domainId/l2/:l2Folder/edit" element={<EditorPage />} />
            <Route path="company/:companyId/domain/:domainId/l2/:l2Folder/create/l3" element={<EditorPage />} />
            <Route path="company/:companyId/domain/:domainId/l3/:l2Folder/:l3Folder" element={<L3Page />} />
            <Route path="company/:companyId/domain/:domainId/l3/:l2Folder/:l3Folder/edit" element={<EditorPage />} />
            <Route path="company/:companyId/domain/:domainId/l3/:l2Folder/:l3Folder/create/sop" element={<EditorPage />} />
            <Route path="company/:companyId/domain/:domainId/sop/:l2Folder/:l3Folder/:sopFile" element={<SopPage />} />
            <Route path="company/:companyId/domain/:domainId/sop/:l2Folder/:l3Folder/:sopFile/edit" element={<EditorPage />} />
            <Route path="domain/:domainId/*" element={<LegacyDomainRedirect />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
