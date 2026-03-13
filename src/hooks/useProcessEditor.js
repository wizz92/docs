import { useState, useCallback } from 'react';

const cache = new Map();

async function fetchJson(path) {
  if (cache.has(path)) return cache.get(path);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  const data = await res.json();
  cache.set(path, data);
  return data;
}

/**
 * @param {object} opts
 * @param {'create'|'edit'} opts.mode
 * @param {string} opts.processType - process_l2, process_l3, sop
 * @param {string} opts.domainId
 * @param {string} [opts.l2Folder]
 * @param {string} [opts.l3Folder]
 * @param {string} [opts.sopFile]
 * @param {string} [opts.existingPath] - relative path for edit mode (e.g. "processes/dom/01-x/process.json")
 */
export default function useProcessEditor({ mode, processType, domainId, l2Folder, l3Folder, sopFile }) {
  const [formData, setFormData] = useState({ type: processType });
  const [slug, setSlug] = useState('');
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(mode === 'create');

  const setField = useCallback((key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const loadExisting = useCallback(async (jsonPath) => {
    try {
      const normalized = jsonPath.startsWith('/') ? jsonPath : `/${jsonPath}`;
      const apiPath = normalized.startsWith('/processes/')
        ? `/api${normalized}`
        : normalized;
      const data = await fetchJson(apiPath);
      setFormData(data);
      setLoaded(true);
    } catch (err) {
      setErrors([err.message]);
      setLoaded(true);
    }
  }, []);

  const validate = useCallback(async () => {
    setErrors([]);
    setWarnings([]);
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: processType, data: formData }),
      });
      const result = await res.json();
      setErrors(result.errors || []);
      setWarnings(result.warnings || []);
      return result.valid;
    } catch (err) {
      setErrors([err.message]);
      return false;
    }
  }, [formData, processType]);

  const save = useCallback(async () => {
    setSaving(true);
    setErrors([]);
    setWarnings([]);

    try {
      let url, method, body;

      if (mode === 'create') {
        if (processType === 'process_l2') {
          url = `/api/processes/${domainId}/l2`;
          body = { slug, data: formData };
        } else if (processType === 'process_l3') {
          url = `/api/processes/${domainId}/${l2Folder}/l3`;
          body = { slug, data: formData };
        } else {
          url = `/api/processes/${domainId}/${l2Folder}/${l3Folder}/sop`;
          body = { data: formData };
        }
        method = 'POST';
      } else {
        let filePath;
        if (processType === 'sop') {
          filePath = `${l2Folder}/${l3Folder}/${sopFile}`;
        } else if (processType === 'process_l3') {
          filePath = `${l2Folder}/${l3Folder}/process.json`;
        } else {
          filePath = `${l2Folder}/process.json`;
        }
        url = `/api/processes/${domainId}/${filePath}`;
        method = 'PUT';
        body = { data: formData };
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (!res.ok) {
        setErrors(result.errors || [result.error || 'Save failed']);
        setWarnings(result.warnings || []);
        setSaving(false);
        return null;
      }

      setWarnings(result.warnings || []);
      setSaving(false);

      // Return navigation path after successful save
      if (mode === 'create') {
        if (processType === 'process_l2') {
          return `/domain/${domainId}/l2/${result.folder}`;
        } else if (processType === 'process_l3') {
          return `/domain/${domainId}/l3/${l2Folder}/${result.folder}`;
        } else {
          return `/domain/${domainId}/sop/${l2Folder}/${l3Folder}/${result.file}`;
        }
      }
      // Edit mode: return current view path
      if (processType === 'sop') {
        return `/domain/${domainId}/sop/${l2Folder}/${l3Folder}/${sopFile}`;
      } else if (processType === 'process_l3') {
        return `/domain/${domainId}/l3/${l2Folder}/${l3Folder}`;
      }
      return `/domain/${domainId}/l2/${l2Folder}`;
    } catch (err) {
      setErrors([err.message]);
      setSaving(false);
      return null;
    }
  }, [mode, processType, domainId, l2Folder, l3Folder, sopFile, slug, formData]);

  return {
    formData, setFormData, setField,
    slug, setSlug,
    errors, warnings,
    saving, loaded,
    loadExisting, validate, save,
  };
}
