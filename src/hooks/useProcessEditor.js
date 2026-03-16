import { useState, useCallback, useEffect } from 'react';

/** Type key to label, matching API response shape (process_type labels). */
const PROCESS_TYPE_LABELS = {
  process_l1: 'Process L1',
  process_l2: 'Process L2',
  process_l3: 'Process L3',
  sop: 'SOP',
};

const cache = new Map();

/**
 * Relative API path for edit mode (used for GET load and PUT save).
 * @param {string} processType - process_l1, process_l2, process_l3, sop
 * @param {{ l2Folder?: string, l3Folder?: string, sopFile?: string }} params
 * @returns {string}
 */
export function getEditApiPath(processType, { l2Folder, l3Folder, sopFile }) {
  if (processType === 'process_l1') return 'process.json';
  if (processType === 'sop') return `${l2Folder}/${l3Folder}/${sopFile}`;
  if (processType === 'process_l3') return `${l2Folder}/${l3Folder}/process.json`;
  return `${l2Folder}/process.json`;
}

/**
 * Build fetch request for save (create or update).
 * @param {'create'|'edit'} mode
 * @param {string} processType - process_l2, process_l3, sop
 * @param {{ domainId: string, l2Folder?: string, l3Folder?: string, sopFile?: string, slug?: string }} params
 * @param {object} formData
 * @returns {{ url: string, method: string, body: object }}
 */
export function getSaveRequest(mode, processType, params, formData) {
  const { domainId, l2Folder, l3Folder, sopFile, slug } = params;
  if (mode === 'create') {
    if (processType === 'process_l2') {
      return { url: `/api/processes/${domainId}/l2`, method: 'POST', body: { slug, data: formData } };
    }
    if (processType === 'process_l3') {
      return { url: `/api/processes/${domainId}/${l2Folder}/l3`, method: 'POST', body: { slug, data: formData } };
    }
    return { url: `/api/processes/${domainId}/${l2Folder}/${l3Folder}/sop`, method: 'POST', body: { data: formData } };
  }
  const editPath = getEditApiPath(processType, { l2Folder, l3Folder, sopFile });
  return {
    url: `/api/processes/${domainId}/${editPath}`,
    method: 'PUT',
    body: { data: formData },
  };
}

/**
 * Soft-archive an existing process by fetching it, setting archived=true, and saving via PUT.
 * Returns a redirect path for the caller to navigate to on success.
 * @param {string} processType - process_l1, process_l2, process_l3, sop
 * @param {{ domainId: string, l2Folder?: string, l3Folder?: string, sopFile?: string }} params
 * @returns {Promise<string|null>}
 */
export async function archiveProcess(processType, params) {
  const { domainId, l2Folder, l3Folder, sopFile } = params;
  const editPath = getEditApiPath(processType, { l2Folder, l3Folder, sopFile });
  const url = `/api/processes/${domainId}/${editPath}`;

  const getRes = await fetch(url);
  if (!getRes.ok) {
    const errText = await getRes.text().catch(() => '');
    throw new Error(`Не удалось загрузить процесс для архивации: ${getRes.status} ${errText}`);
  }
  const data = await getRes.json();
  const updated = { ...data, archived: true };

  const putRes = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: updated }),
  });

  const result = await putRes.json().catch(() => ({}));
  if (!putRes.ok) {
    const message = result.error || (result.errors && result.errors.join('; ')) || 'Не удалось заархивировать процесс';
    throw new Error(message);
  }

  if (processType === 'process_l1') {
    return `/domain/${domainId}`;
  }
  if (processType === 'process_l2') {
    return `/domain/${domainId}`;
  }
  if (processType === 'process_l3') {
    return `/domain/${domainId}/l2/${l2Folder}`;
  }
  if (processType === 'sop') {
    return `/domain/${domainId}/l3/${l2Folder}/${l3Folder}`;
  }
  return null;
}

/**
 * Return pathname to navigate to after successful save.
 * @param {'create'|'edit'} mode
 * @param {string} processType - process_l2, process_l3, sop
 * @param {{ domainId: string, l2Folder?: string, l3Folder?: string, sopFile?: string }} params
 * @param {object} result - API response (folder, file, path)
 * @returns {string}
 */
export function getRedirectAfterSave(mode, processType, params, result) {
  const { domainId, l2Folder, l3Folder, sopFile } = params;
  if (mode === 'create') {
    if (processType === 'process_l2') return `/domain/${domainId}/l2/${result.folder}`;
    if (processType === 'process_l3') return `/domain/${domainId}/l3/${l2Folder}/${result.folder}`;
    return `/domain/${domainId}/sop/${l2Folder}/${l3Folder}/${result.file}`;
  }
  if (processType === 'process_l1') return `/domain/${domainId}`;
  if (processType === 'sop') return `/domain/${domainId}/sop/${l2Folder}/${l3Folder}/${sopFile}`;
  if (processType === 'process_l3') return `/domain/${domainId}/l3/${l2Folder}/${l3Folder}`;
  return `/domain/${domainId}/l2/${l2Folder}`;
}

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
  const [formData, setFormData] = useState({
    type: PROCESS_TYPE_LABELS[processType] ?? processType,
  });
  const [slug, setSlug] = useState('');
  const [errors, setErrors] = useState([]);
  const [errorsByField, setErrorsByField] = useState({});
  const [warnings, setWarnings] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(mode === 'create');

  useEffect(() => {
    if (mode === 'create') {
      setFormData((prev) => ({
        ...prev,
        type: PROCESS_TYPE_LABELS[processType] ?? processType,
      }));
    }
  }, [mode, processType]);

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
    setErrorsByField({});
    setWarnings([]);
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: processType, data: formData }),
      });
      const result = await res.json();
      setErrors(result.errors || []);
      setErrorsByField(result.errorsByField || {});
      setWarnings(result.warnings || []);
      return result.valid;
    } catch (err) {
      setErrors([err.message]);
      setErrorsByField({});
      return false;
    }
  }, [formData, processType]);

  const save = useCallback(async () => {
    setSaving(true);
    setErrors([]);
    setErrorsByField({});
    setWarnings([]);

    const params = { domainId, l2Folder, l3Folder, sopFile, slug };

    try {
      const { url, method, body } = getSaveRequest(mode, processType, params, formData);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (!res.ok) {
        setErrors(result.errors || [result.error || 'Save failed']);
        setErrorsByField(result.errorsByField || {});
        setWarnings(result.warnings || []);
        setSaving(false);
        return null;
      }

      setWarnings(result.warnings || []);
      setSaving(false);
      return getRedirectAfterSave(mode, processType, params, result);
    } catch (err) {
      setErrors([err.message]);
      setErrorsByField({});
      setSaving(false);
      return null;
    }
  }, [mode, processType, domainId, l2Folder, l3Folder, sopFile, slug, formData]);

  return {
    formData, setFormData, setField,
    slug, setSlug,
    errors, errorsByField, warnings,
    saving, loaded,
    loadExisting, validate, save,
  };
}
