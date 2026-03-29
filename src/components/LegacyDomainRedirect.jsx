import { Navigate, useParams, useLocation } from 'react-router-dom';
import { DEFAULT_COMPANY_SLUG } from '../../shared/companies.js';

/** Old bookmarks `/domain/...` redirect into the default company namespace. */
export default function LegacyDomainRedirect() {
  const { domainId } = useParams();
  const location = useLocation();
  const tail = location.pathname.replace(/^\/domain\/[^/]+/, '') || '';
  const to = `/company/${DEFAULT_COMPANY_SLUG}/domain/${domainId}${tail}${location.search}${location.hash}`;
  return <Navigate to={to} replace />;
}
