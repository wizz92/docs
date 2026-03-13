import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * @param {{ label: string, value: object[], onChange: function, fields: {key:string, label:string, multiline?:boolean}[], required?: boolean, error?: string }} props
 */
export default function ObjectArrayInput({ label, value = [], onChange, fields, required, error }) {
  const addRow = () => {
    const empty = {};
    fields.forEach(f => { empty[f.key] = ''; });
    onChange([...value, empty]);
  };

  const removeRow = (idx) => onChange(value.filter((_, i) => i !== idx));

  const updateField = (idx, key, val) => {
    const updated = value.map((row, i) => (i === idx ? { ...row, [key]: val } : row));
    onChange(updated);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color={error ? 'error' : 'text.secondary'} sx={{ mb: 0.5 }}>
        {label}{required ? ' *' : ''}
      </Typography>
      {error && (
        <Typography variant="caption" color="error" sx={{ mb: 0.5, display: 'block' }}>
          {error}
        </Typography>
      )}
      {value.map((row, idx) => (
        <Paper key={idx} variant="outlined" sx={{ p: 1.5, mb: 1, position: 'relative' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {fields.map((f) => (
              <TextField
                key={f.key}
                label={f.label}
                size="small"
                value={row[f.key] || ''}
                onChange={(e) => updateField(idx, f.key, e.target.value)}
                multiline={f.multiline}
                minRows={f.multiline ? 2 : undefined}
                sx={{ flex: f.multiline ? '1 1 100%' : '1 1 200px' }}
              />
            ))}
          </Box>
          <IconButton
            size="small"
            onClick={() => removeRow(idx)}
            sx={{ position: 'absolute', top: 4, right: 4 }}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Paper>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={addRow}>
        Add
      </Button>
    </Box>
  );
}
