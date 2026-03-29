import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

const defaultPrimaryTypographyProps = { variant: 'body2', fontWeight: 600 };
const defaultSecondaryTypographyProps = { variant: 'body2' };

/**
 * @param {{
 *   items: Array<{ step: string, description?: string }>,
 *   hideTitle?: boolean,
 *   primaryTypographyProps?: object,
 *   secondaryTypographyProps?: object,
 * }} props
 */
export default function ProcessSteps({
  items,
  hideTitle = false,
  primaryTypographyProps,
  secondaryTypographyProps,
}) {
  if (!items?.length) return null;

  const primaryTp = { ...defaultPrimaryTypographyProps, ...primaryTypographyProps };
  const secondaryTp = { ...defaultSecondaryTypographyProps, ...secondaryTypographyProps };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      {!hideTitle && (
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Логика процесса
        </Typography>
      )}
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
              secondary={item.description || undefined}
              primaryTypographyProps={primaryTp}
              secondaryTypographyProps={secondaryTp}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
