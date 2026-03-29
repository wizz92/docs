import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

function ItemList({ items, numbered }) {
  if (!items?.length) return <Typography variant="body2" color="text.disabled">—</Typography>;
  return (
    <Box component="ul" sx={{ m: 0, pl: numbered ? 0 : 2.5, listStyle: numbered ? 'none' : 'disc' }}>
      {items.map((item, i) => {
        const text = typeof item === 'object' && item !== null ? item.step || item.name || '' : item;
        return (
          <Typography key={i} component="li" variant="body2" sx={{ mb: 0.5 }}>
            {numbered ? `${i + 1}. ${text}` : text}
          </Typography>
        );
      })}
    </Box>
  );
}

const headerSx = (color) => ({
  fontWeight: 700,
  color,
  borderBottom: 2,
  borderColor: color,
  whiteSpace: 'nowrap',
});

export default function SipocDiagram({ data }) {
  if (!data) return null;
  const { inputs, process_steps, outputs } = data;
  if (!inputs?.length && !process_steps?.length && !outputs?.length) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3, overflowX: 'auto' }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        SIPOC
      </Typography>
      <Table size="small" sx={{ tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={headerSx('info.main')}>Входы (Inputs)</TableCell>
            <TableCell sx={headerSx('primary.main')}>Процесс (Process)</TableCell>
            <TableCell sx={headerSx('success.main')}>Выходы (Outputs)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell sx={{ verticalAlign: 'top', borderBottom: 'none' }}>
              <ItemList items={inputs} />
            </TableCell>
            <TableCell sx={{ verticalAlign: 'top', borderBottom: 'none' }}>
              <ItemList items={process_steps} numbered />
            </TableCell>
            <TableCell sx={{ verticalAlign: 'top', borderBottom: 'none' }}>
              <ItemList items={outputs} />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Paper>
  );
}
