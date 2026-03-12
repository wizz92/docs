import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

function normalizeRows(items, failures, deviations) {
  if (items?.length) return items;
  if (failures?.length) {
    return failures.map((f, i) => ({
      failure: f,
      action: deviations?.[i] || '—',
    }));
  }
  return [];
}

export default function FailuresTable({ items, failures, deviations }) {
  const rows = normalizeRows(items, failures, deviations);
  if (!rows.length) return null;

  return (
    <Paper variant="outlined" sx={{ mb: 3 }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 700 }}>Сбой</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Как проявляется</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Что делать</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                <TableCell>
                  <Chip label={row.failure} size="small" color="error" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {row.symptom || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{row.action}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
