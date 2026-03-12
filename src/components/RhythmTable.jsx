import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

export default function RhythmTable({ items }) {
  if (!items?.length) return null;

  return (
    <Paper variant="outlined" sx={{ mb: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ px: 2, pt: 2, pb: 1 }}>
        Ритм процесса
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Горизонт</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ритуал</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Главный вопрос</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Результат</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((row, i) => (
              <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{row.horizon}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{row.ritual}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">{row.key_question}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{row.result}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
