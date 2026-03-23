import { getEditApiPath } from '../../hooks/useProcessEditor';

/** Short Russian labels for process levels in the editor chrome. */
export const TYPE_LABEL = {
  process_l1: 'L1 Процесс',
  process_l2: 'L2 Процесс',
  process_l3: 'L3 Подпроцесс',
  sop: 'SOP Инструкция',
};

/**
 * Derive editor mode, process type, and path segments from React Router params and pathname.
 * @param {import('react-router-dom').Params<string>} params
 * @param {string} pathname
 */
export function resolveContext(params, pathname) {
  /** Create without `:domainId` in URL — domain (L1) is chosen in the same «Уровень и родитель» block. */
  if (pathname === '/create') {
    return {
      mode: 'create',
      processType: 'process_l2',
      domainId: undefined,
      l2Folder: undefined,
      l3Folder: undefined,
      sopFile: undefined,
      createFlow: 'unified',
    };
  }

  const { domainId, l2Folder, l3Folder, sopFile } = params;

  const isUnifiedCreate = /^\/domain\/[^/]+\/create$/.test(pathname);

  if (isUnifiedCreate) {
    return {
      mode: 'create',
      processType: 'process_l2',
      domainId,
      l2Folder: undefined,
      l3Folder: undefined,
      sopFile,
      createFlow: 'unified',
    };
  }

  if (pathname.endsWith('/create/l2')) {
    return {
      mode: 'create',
      processType: 'process_l2',
      domainId,
      l2Folder: undefined,
      l3Folder: undefined,
      sopFile,
      createFlow: 'legacy-l2',
    };
  }
  if (pathname.endsWith('/create/l3')) {
    return {
      mode: 'create',
      processType: 'process_l3',
      domainId,
      l2Folder,
      l3Folder,
      sopFile,
      createFlow: 'legacy-l3',
    };
  }
  if (pathname.endsWith('/create/sop')) {
    return {
      mode: 'create',
      processType: 'sop',
      domainId,
      l2Folder,
      l3Folder,
      sopFile,
      createFlow: 'legacy-sop',
    };
  }
  if (pathname.endsWith('/l1/edit')) {
    const processType = 'process_l1';
    return {
      mode: 'edit',
      processType,
      domainId,
      l2Folder,
      l3Folder,
      sopFile,
      existingPath: `processes/${domainId}/process.json`,
      createFlow: null,
    };
  }
  if (sopFile) {
    const processType = 'sop';
    return {
      mode: 'edit', processType, domainId, l2Folder, l3Folder, sopFile,
      existingPath: `processes/${domainId}/${getEditApiPath(processType, { l2Folder, l3Folder, sopFile })}`,
      createFlow: null,
    };
  }
  if (l3Folder) {
    const processType = 'process_l3';
    return {
      mode: 'edit', processType, domainId, l2Folder, l3Folder, sopFile,
      existingPath: `processes/${domainId}/${getEditApiPath(processType, { l2Folder, l3Folder, sopFile })}`,
      createFlow: null,
    };
  }
  const processType = 'process_l2';
  return {
    mode: 'edit', processType, domainId, l2Folder, l3Folder, sopFile,
    existingPath: `processes/${domainId}/${getEditApiPath(processType, { l2Folder, l3Folder, sopFile })}`,
    createFlow: null,
  };
}
