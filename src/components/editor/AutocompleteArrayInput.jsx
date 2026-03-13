import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

export default function AutocompleteArrayInput({
  label, value = [], onChange, options = [], required, error,
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color={error ? 'error' : 'text.secondary'} sx={{ mb: 0.5 }}>
        {label}{required ? ' *' : ''}
      </Typography>
      <Autocomplete
        multiple
        freeSolo
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
            placeholder={`Add ${label.toLowerCase()}...`}
            error={!!error}
            helperText={error}
          />
        )}
      />
    </Box>
  );
}
