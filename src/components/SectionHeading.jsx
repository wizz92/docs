import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function SectionHeading({ children, caption }) {
  return (
    <Box sx={{ mt: 5, mb: 2 }}>
      <Typography variant="h5">{children}</Typography>
      {caption && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {caption}
        </Typography>
      )}
    </Box>
  );
}
