import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * @param {{ label: string, sectionHelp?: string, value: object[], onChange: function, fields: {key:string, label:string, multiline?:boolean, helpText?:string}[], required?: boolean, error?: string, rowErrors?: Record<number, Record<string, string>> }} props
 * rowErrors: row index -> subfield key -> error message (key '_' = row-level error)
 */
export default function ObjectArrayInput({ label, sectionHelp, value = [], onChange, fields, required, error, rowErrors, readOnly }) {
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
      {sectionHelp && !error && (
        <FormHelperText sx={{ mx: 0, mt: 0, mb: 1, whiteSpace: 'pre-wrap' }}>{sectionHelp}</FormHelperText>
      )}
      {error && (
        <Typography variant="caption" color="error" sx={{ mb: 0.5, display: 'block' }}>
          {error}
        </Typography>
      )}
      {value.map((row, idx) => {
        const rowErr = rowErrors && rowErrors[idx];
        const rowLevelMsg = rowErr && rowErr._;
        return (
          <Paper key={idx} variant="outlined" sx={{ p: 1.5, mb: 1, position: 'relative' }}>
            {rowLevelMsg && (
              <Typography variant="caption" color="error" sx={{ mb: 0.5, display: 'block' }}>
                {rowLevelMsg}
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {fields.map((f) => {
                const cellError = rowErr && rowErr[f.key];
                return (
                  <TextField
                    key={f.key}
                    label={f.label}
                    size="small"
                    value={row[f.key] || ''}
                    onChange={(e) => updateField(idx, f.key, e.target.value)}
                    multiline={f.multiline}
                    minRows={f.multiline ? 2 : undefined}
                    error={!!cellError}
                    helperText={cellError || f.helpText || ''}
                    FormHelperTextProps={f.helpText && !cellError ? { sx: { whiteSpace: 'pre-wrap' } } : undefined}
                    slotProps={readOnly ? { input: { readOnly: true } } : undefined}
                    sx={{ flex: f.multiline ? '1 1 100%' : '1 1 200px' }}
                  />
                );
              })}
            </Box>
            {!readOnly && (
            <IconButton
            size="small"
            onClick={() => removeRow(idx)}
            sx={{ position: 'absolute', top: 4, right: 4 }}
            color="error"
          >
            <DeleteIcon fontSize="small" />
            </IconButton>
            )}
          </Paper>
        );
      })}
      {!readOnly && (
      <Button size="small" startIcon={<AddIcon />} onClick={addRow}>
        Add
      </Button>
      )}
    </Box>
  );
}
