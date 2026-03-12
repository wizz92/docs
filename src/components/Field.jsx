import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function Field({ label, value }) {
  if (!value) return null;
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}
