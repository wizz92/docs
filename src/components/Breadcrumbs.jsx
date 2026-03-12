import { useParams, useLocation, Link as RouterLink } from 'react-router-dom';
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export default function BreadcrumbsNav({ domainId, domainIndex, domainMeta }) {
  const { l2Folder, l3Folder, sopFile } = useParams();
  const location = useLocation();

  if (location.pathname === '/') return null;

  const crumbs = [{ label: 'Домены', to: '/' }];

  if (domainId) {
    crumbs.push({
      label: domainMeta?.name_ru || domainIndex?.l1?.name || domainId,
      to: `/domain/${domainId}`,
    });
  }

  const l2 = l2Folder && domainIndex
    ? domainIndex.l2_processes?.find((p) => p.folder === l2Folder)
    : null;
  if (l2) {
    crumbs.push({ label: l2.name, to: `/domain/${domainId}/l2/${l2.folder}` });
  }

  const l3 = l3Folder && l2
    ? l2.l3_processes?.find((p) => p.folder === l3Folder)
    : null;
  if (l3) {
    crumbs.push({
      label: l3.name,
      to: `/domain/${domainId}/l3/${l2Folder}/${l3.folder}`,
    });
  }

  const sop = sopFile && l3
    ? l3.sops?.find((s) => s.file === sopFile)
    : null;
  if (sop) {
    crumbs.push({ label: sop.name });
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
