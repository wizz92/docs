import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

export default function ChipList({ label, items, color = 'default', variant = 'outlined' }) {
  if (!items?.length) return null;
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {items.map((item, i) => {
          const isObject = typeof item === 'object' && item !== null;
          const chipLabel = isObject ? item.name : item;
          const description = isObject ? item.description : null;

          const chip = (
            <Chip key={i} label={chipLabel} size="small" color={color} variant={variant} />
          );

          return description ? (
            <Tooltip key={i} title={description} arrow placement="top">
              {chip}
            </Tooltip>
          ) : chip;
        })}
      </Box>
    </Box>
  );
}
