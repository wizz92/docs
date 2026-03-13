import { useState, useEffect, useCallback, useRef } from 'react';

const cache = new Map();

async function fetchJson(path) {
  if (cache.has(path)) return cache.get(path);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  const data = await res.json();
  cache.set(path, data);
  return data;
}

export default function useProcessData() {
  const [masterIndex, setMasterIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    fetchJson('/api/processes')
      .then((data) => {
        if (mounted.current) {
          setMasterIndex(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted.current) {
          setError(err);
          setLoading(false);
        }
      });
    return () => { mounted.current = false; };
  }, []);

  const loadJson = useCallback((path) => {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    if (normalized.startsWith('/processes/')) {
      return fetchJson(`/api${normalized}`);
    }
    return fetchJson(normalized);
  }, []);

  const loadDomainIndex = useCallback(
    (domainId) => fetchJson(`/api/processes/${domainId}`),
    [],
  );

  return { masterIndex, loading, error, loadJson, loadDomainIndex };
}

export function useDomainData(domainId) {
  const { masterIndex, loading: masterLoading, error: masterError, loadJson, loadDomainIndex } = useProcessData();
  const [domainIndex, setDomainIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const prevDomainId = useRef(null);

  useEffect(() => {
    if (!domainId) {
      setDomainIndex(null);
      setLoading(false);
      return;
    }
    if (masterLoading) return;
    if (prevDomainId.current === domainId && domainIndex) {
      setLoading(false);
      return;
    }
    prevDomainId.current = domainId;
    setDomainIndex(null);
    setLoading(true);
    setError(null);
    loadDomainIndex(domainId)
      .then((data) => { setDomainIndex(data); setLoading(false); })
      .catch((err) => { setError(err); setLoading(false); });
  }, [domainId, masterLoading, loadDomainIndex]);

  const domainMeta = masterIndex?.domains?.find((d) => d.id === domainId) || null;

  return {
    masterIndex,
    domainIndex,
    domainMeta,
    loading: masterLoading || loading,
    error: masterError || error,
    loadJson,
    loadDomainIndex,
  };
}
