import { useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';

export default function StringArrayInput({ label, value = [], onChange, required, error, helpText, readOnly }) {
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
      <Box
        sx={{
          mb: 0.5,
          typography: 'subtitle2',
          color: error ? 'error' : 'text.secondary',
        }}
      >
        {label}
        {required ? ' *' : ''}
      </Box>
      {helpText && !error && (
        <FormHelperText sx={{ mx: 0, mt: 0, mb: 1, whiteSpace: 'pre-wrap' }}>{helpText}</FormHelperText>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: readOnly ? 0 : 1, minHeight: 32 }}>
        {value.map((item, i) => (
          <Chip
            key={i}
            label={item}
            size="small"
            onDelete={readOnly ? undefined : () => remove(i)}
          />
        ))}
      </Box>
      {!readOnly && (
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
      )}
    </Box>
  );
}
