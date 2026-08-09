export const useShellBridge = () => null;
export const useShell = () => ({});
export const eventBus = { publish: () => {}, subscribe: () => () => {} };
export default {};
// ===== Universal toast (Phase 3 toast standardization) =====
export const toast = {
  success: () => 'toast-id',
  error: () => 'toast-id',
  warning: () => 'toast-id',
  info: () => 'toast-id',
  promise: (p) => (typeof p === 'function' ? p() : p),
  dismiss: () => {},
};
export const useToast = () => toast;
export const getErrorMessage = (_e, fallback) => fallback ?? 'error';
export const attachToastErrorHandler = () => 0;
export const toastBus = { subscribe: () => () => {}, getToasts: () => [], dismiss: () => {} };
export const ToastViewport = () => null;
export const ToastProvider = ({ children }) => children;
