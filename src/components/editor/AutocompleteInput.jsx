import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

export default function AutocompleteInput({
  label, value = '', onChange, options = [], required, error, multiline, helpText, readOnly,
}) {
  return (
    <Autocomplete
      freeSolo
      disabled={readOnly}
      options={options}
      value={value}
      onChange={(_e, newValue) => onChange(newValue ?? '')}
      onInputChange={(_e, newInput, reason) => {
        if (readOnly) return;
        if (reason === 'input') onChange(newInput);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          size="small"
          fullWidth
          multiline={multiline}
          minRows={multiline ? 2 : undefined}
          error={!!error}
          helperText={error || helpText || ''}
          FormHelperTextProps={helpText && !error ? { sx: { whiteSpace: 'pre-wrap' } } : undefined}
          slotProps={readOnly ? { input: { readOnly: true } } : undefined}
          sx={{ mb: 2, mt: 1 }}
        />
      )}
    />
  );
}
