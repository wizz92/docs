import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

export default function AdditionalMaterialsList({ items }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <List dense>
      {items.map((item, idx) => {
        if (!item) return null;
        const label = item.label || item.url;
        const href = item.url || '#';
        return (
          <ListItem key={idx} disableGutters>
            <ListItemText
              primary={(
                <Link href={href} target="_blank" rel="noopener noreferrer">
                  {label}
                </Link>
              )}
              secondary={item.label && item.url ? item.url : undefined}
            />
          </ListItem>
        );
      })}
    </List>
  );
}

