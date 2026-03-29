import { useParams, useLocation, Link as RouterLink } from 'react-router-dom';
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { companyLabelFromSlug, companyClientPath } from '../../shared/companies.js';

export default function BreadcrumbsNav({ companyId, domainId, domainIndex, domainMeta }) {
  const { l2Folder, l3Folder, sopFile } = useParams();
  const location = useLocation();

  if (
    location.pathname === '/'
    || location.pathname === '/registry'
    || location.pathname === '/dictionaries'
  ) {
    return null;
  }

  const crumbs = [];
  if (companyId) {
    crumbs.push({ label: 'Компании', to: '/' });
    crumbs.push({
      label: companyLabelFromSlug(companyId),
      to: `/company/${companyId}`,
    });
  }

  if (domainId) {
    crumbs.push({
      label: domainMeta?.name_ru || domainIndex?.l1?.name || domainId,
      to: companyClientPath(companyId, `domain/${domainId}`),
    });
  }

  const l2 = l2Folder && domainIndex
    ? domainIndex.l2_processes?.find((p) => p.folder === l2Folder)
    : null;
  if (l2 && companyId) {
    crumbs.push({
      label: l2.name,
      to: companyClientPath(companyId, `domain/${domainId}/l2/${l2.folder}`),
    });
  }

  const l3 = l3Folder && l2
    ? l2.l3_processes?.find((p) => p.folder === l3Folder)
    : null;
  if (l3 && companyId) {
    crumbs.push({
      label: l3.name,
      to: companyClientPath(companyId, `domain/${domainId}/l3/${l2Folder}/${l3.folder}`),
    });
  }

  const sop = sopFile && l3
    ? l3.sops?.find((s) => s.file === sopFile)
    : null;
  if (sop) {
    crumbs.push({ label: sop.name });
  }

  if (!crumbs.length) {
    return null;
  }

  return (
    <MuiBreadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      sx={{ mb: 3 }}
    >
      {crumbs.map((c, i) =>
        i < crumbs.length - 1 ? (
          <Link
            key={i}
            component={RouterLink}
            to={c.to}
            underline="hover"
            color="inherit"
          >
            {c.label}
          </Link>
        ) : (
          <Typography key={i} color="text.primary" variant="body2">
            {c.label}
          </Typography>
        ),
      )}
    </MuiBreadcrumbs>
  );
}
