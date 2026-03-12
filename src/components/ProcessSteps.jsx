import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

export default function ProcessSteps({ items }) {
  if (!items?.length) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Логика процесса
      </Typography>
      <List dense disablePadding>
        {items.map((item, i) => (
          <ListItem key={i} alignItems="flex-start" sx={{ px: 0 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Avatar
                sx={{
                  width: 26,
                  height: 26,
                  fontSize: 13,
                  bgcolor: 'primary.main',
                }}
              >
                {i + 1}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={item.step}
              secondary={item.description}
              primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
              secondaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
