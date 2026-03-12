import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';

export default function LoadingSkeleton({ variant = 'page' }) {
  if (variant === 'card') {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              {[...Array(5)].map((_, i) => (
                <Box key={i} sx={{ mb: 1.5 }}>
                  <Skeleton width={100} height={16} />
                  <Skeleton width="80%" height={20} />
                </Box>
              ))}
            </Grid>
            <Grid item xs={12} md={6}>
              {[...Array(4)].map((_, i) => (
                <Box key={i} sx={{ mb: 2 }}>
                  <Skeleton width={120} height={16} />
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    {[...Array(3)].map((_, j) => (
                      <Skeleton key={j} variant="rounded" width={80} height={24} />
                    ))}
                  </Box>
                </Box>
              ))}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Skeleton variant="rounded" width={80} height={24} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="60%" height={40} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="90%" height={20} sx={{ mb: 3 }} />
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              {[...Array(5)].map((_, i) => (
                <Box key={i} sx={{ mb: 1.5 }}>
                  <Skeleton width={100} height={16} />
                  <Skeleton width="80%" height={20} />
                </Box>
              ))}
            </Grid>
            <Grid item xs={12} md={6}>
              {[...Array(4)].map((_, i) => (
                <Box key={i} sx={{ mb: 2 }}>
                  <Skeleton width={120} height={16} />
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    {[...Array(3)].map((_, j) => (
                      <Skeleton key={j} variant="rounded" width={80} height={24} />
                    ))}
                  </Box>
                </Box>
              ))}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
