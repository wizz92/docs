import { useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

export default function DictionaryEditor({ label, values = [], onChange }) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const v = input.trim();
    if (!v) return;
    const next = Array.from(new Set([...values, v])).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    onChange(next);
    setInput('');
  };

  const handleDelete = (val) => {
    onChange(values.filter((v) => v !== val));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <TextField
          size="small"
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Добавить значение..."
        />
        <IconButton color="primary" onClick={handleAdd} aria-label="Добавить">
          <AddIcon />
        </IconButton>
      </Box>
      <Paper
        variant="outlined"
        sx={{
          mt: 0.5,
          borderRadius: 1.5,
          overflow: 'hidden',
        }}
      >
        {values.length === 0 ? (
          <Box sx={{ px: 1.5, py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Пока нет значений.
            </Typography>
          </Box>
        ) : (
          values.map((v, index) => (
            <Box
              key={v}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1.5,
                py: 0.75,
                borderTop: index === 0 ? 'none' : '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  mr: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={v}
              >
                {v}
              </Typography>
              <IconButton
                size="small"
                edge="end"
                aria-label="Удалить"
                onClick={() => handleDelete(v)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))
        )}
      </Paper>
    </Box>
  );
}

