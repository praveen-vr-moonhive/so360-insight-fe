/**
 * ESM shim for use-sync-external-store/shim.
 *
 * The CJS shim package provides React < 18 compatibility for useSyncExternalStore.
 * Since we're on React 19, we use the native implementation directly.
 * Exporting via ESM allows vite-plugin-federation to properly externalize
 * the react import through the singleton shared scope.
 */
export { useSyncExternalStore } from 'react';
