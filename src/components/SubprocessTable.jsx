import { Link as RouterLink } from 'react-router-dom';
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
import Typography from '@mui/material/Typography';

export default function SubprocessTable({ rows, showL3 = false }) {
  if (!rows?.length) return null;

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell sx={{ fontWeight: 700, width: 40 }}>#</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Процесс</TableCell>
            {showL3 && (
              <TableCell align="center" sx={{ fontWeight: 700, width: 80 }}>L3</TableCell>
            )}
            <TableCell align="center" sx={{ fontWeight: 700, width: 80 }}>SOP</TableCell>
            {showL3 && (
              <TableCell align="center" sx={{ fontWeight: 700, width: 100 }}>Всего</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={row.key || idx} hover>
              <TableCell>
                <Box
                  sx={{
                    width: 26, height: 26, borderRadius: '50%',
                    bgcolor: 'primary.main', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                  }}
                >
                  {idx + 1}
                </Box>
              </TableCell>
              <TableCell>
                <Link
                  component={RouterLink}
                  to={row.to}
                  underline="hover"
                  sx={{ fontWeight: 600 }}
                >
                  {row.name}
                </Link>
              </TableCell>
              {showL3 && (
                <TableCell align="center">
                  <Chip label={row.l3Count ?? 0} size="small" variant="outlined" />
                </TableCell>
              )}
              <TableCell align="center">
                <Chip
                  label={row.sopCount ?? 0}
                  size="small"
                  variant="outlined"
                  color={showL3 ? 'warning' : 'default'}
                />
              </TableCell>
              {showL3 && (
                <TableCell align="center">
                  <Typography variant="body2" color="text.secondary">
                    {1 + (row.l3Count || 0) + (row.sopCount || 0)}
                  </Typography>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
