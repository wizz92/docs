import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';

export default function AutocompleteArrayInput({
  label, value = [], onChange, options = [], required, error, helpText, readOnly,
}) {
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
      <Autocomplete
        multiple
        freeSolo
        disabled={readOnly}
        options={options.filter((o) => !value.includes(o))}
        value={value}
        onChange={(_e, newValue) => onChange(newValue)}
        renderTags={(tags, getTagProps) =>
          tags.map((tag, idx) => (
            <Chip size="small" label={tag} {...getTagProps({ index: idx })} key={idx} />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            placeholder={readOnly ? '' : `Add ${label.toLowerCase()}...`}
            error={!!error}
            helperText={error}
            slotProps={readOnly ? { input: { readOnly: true } } : undefined}
          />
        )}
      />
    </Box>
  );
}
