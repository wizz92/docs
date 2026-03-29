/**
 * Sync confirm before soft-archive. Centralizes `no-alert` eslint exception.
 * @param {string} message
 * @returns {boolean}
 */
export function confirmArchive(message) {
  // eslint-disable-next-line no-alert -- intentional sync confirm before destructive archive
  return window.confirm(message);
}

/**
 * @param {unknown} error
 * @param {string} fallbackMessage
 */
export function alertArchiveFailure(error, fallbackMessage) {
  // eslint-disable-next-line no-alert
  window.alert((error && error.message) || fallbackMessage);
}
