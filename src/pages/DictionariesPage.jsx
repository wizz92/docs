import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import DictionaryEditor from '../components/dictionary/DictionaryEditor';

const LABELS = {
  owner: 'Владельцы (owner)',
  participants: 'Участники / роли (participants)',
  linked_systems: 'Системы (linked_systems)',
  linked_meetings: 'Встречи (linked_meetings)',
  linked_artifacts: 'Артефакты (linked_artifacts)',
  metrics_signals: 'Метрики / сигналы (metrics_signals)',
};

const KEYS = Object.keys(LABELS);

export default function DictionariesPage() {
  const [data, setData] = useState(null);
  const [original, setOriginal] = useState(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dictionaries/editable');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const normalized = {};
      KEYS.forEach((k) => {
        const arr = Array.isArray(json[k]) ? json[k] : [];
        normalized[k] = arr.map((t) => (typeof t === 'string' ? t : (t && t.label) || '')).filter(Boolean);
      });
      setData(normalized);
      setOriginal(normalized);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const dirty = JSON.stringify(data) !== JSON.stringify(original);

  const handleChangeKey = (key, values) => {
    setData((prev) => ({ ...(prev || {}), [key]: values }));
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/dictionaries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setOriginal(json);
      setSaved(true);
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <CircularProgress size={24} />
        <Typography>Загрузка справочников...</Typography>
      </Box>
    );
  }

  if (error && !data) {
    return <Alert severity="error">Не удалось загрузить справочники: {error.message}</Alert>;
  }

  if (!data) return null;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Справочники процессов
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2, maxWidth: 800 }}>
        Здесь можно редактировать значения для владельцев, участников, систем, встреч, артефактов и метрик.
        Эти справочники используются в автодополнении при редактировании процессов.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Ошибка сохранения: {error.message}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_e, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {KEYS.map((k) => (
            <Tab key={k} label={LABELS[k]} />
          ))}
        </Tabs>
        <Box sx={{ p: 2 }}>
          {KEYS.map((k, idx) => (
            idx === tab && (
              <DictionaryEditor
                key={k}
                label={LABELS[k]}
                values={data[k]}
                onChange={(vals) => handleChangeKey(k, vals)}
              />
            )
          ))}
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </Button>
        <Button
          variant="text"
          onClick={load}
          disabled={saving || !dirty}
        >
          Сбросить изменения
        </Button>
      </Box>

      <Snackbar
        open={saved}
        autoHideDuration={3000}
        onClose={() => setSaved(false)}
        message="Справочники сохранены"
      />
    </Box>
  );
}

