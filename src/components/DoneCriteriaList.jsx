import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function DoneCriteriaList({ label = 'Done criteria', items }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {items.map((item, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={i}>
            <Typography variant="body2">
              {item}
            </Typography>
          </li>
        ))}
      </ul>
    </Box>
  );
}

