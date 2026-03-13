import { useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';

export default function StringArrayInput({ label, value = [], onChange, required, error }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...value, trimmed]);
    setDraft('');
  };

  const remove = (idx) => onChange(value.filter((_, i) => i !== idx));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color={error ? 'error' : 'text.secondary'} sx={{ mb: 0.5 }}>
        {label}{required ? ' *' : ''}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1, minHeight: 32 }}>
        {value.map((item, i) => (
          <Chip key={i} label={item} size="small" onDelete={() => remove(i)} />
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <TextField
          size="small"
          fullWidth
          placeholder={`Add ${label.toLowerCase()}...`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          error={!!error}
          helperText={error}
        />
        <IconButton size="small" onClick={add} color="primary" disabled={!draft.trim()}>
          <AddIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
