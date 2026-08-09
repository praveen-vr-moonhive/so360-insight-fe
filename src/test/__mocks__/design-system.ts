import React from 'react';
export const Button = ({ children, ...props }: any) => React.createElement('button', props, children);
export const Input = ({ ...props }: any) => React.createElement('input', props);
export const Select = ({ children, ...props }: any) => React.createElement('select', props, children);
export const Modal = ({ children, ...props }: any) => React.createElement('div', props, children);
export const Card = ({ children, ...props }: any) => React.createElement('div', props, children);
export const Badge = ({ children, ...props }: any) => React.createElement('span', props, children);
export const Spinner = (props: any) => React.createElement('div', props);
export const Tooltip = ({ children, ...props }: any) => React.createElement('div', props, children);
export const PeopleSelector = ({ children, ...props }: any) => React.createElement('div', props, children);
export const UserSelector = ({ children, ...props }: any) => React.createElement('div', props, children);
export const DepartmentSelector = ({ children, ...props }: any) => React.createElement('div', props, children);
export const LeaveCalendar = (props: any) => React.createElement('div', props);
export const ReviewForm = ({ children, ...props }: any) => React.createElement('div', props, children);
export const QuotaBar = (props: any) => React.createElement('div', props);
export const QuotaGate = ({ children }: any) => React.createElement(React.Fragment, null, children);

/**
 * FeatureGate — inline widget gating. Mirrors the real component's 5-state model.
 */
export const FeatureGate = ({ state, loading, children, fallback = null }: any): any => {
  if (loading) return null;
  if (state === 'hidden') return React.createElement(React.Fragment, null, fallback);
  if (state === 'enabled') return React.createElement(React.Fragment, null, children);
  // read_only / disabled / locked — render children (inert wrapper not needed in tests)
  return React.createElement(React.Fragment, null, children);
};

/**
 * FeatureRoute — route-level gating. Mirrors the real component's 5-state model exactly
 * so App.spec.tsx SegmentRoute tests pass without mocking @so360/design-system.
 */
export const FeatureRoute = ({ state, loading, children, hiddenFallback = null, lockedFallback, disabledFallback }: any): any => {
  if (loading) return null;
  if (state === 'hidden') return React.createElement(React.Fragment, null, hiddenFallback ?? null);
  if (state === 'locked') return React.createElement(React.Fragment, null, lockedFallback ?? children);
  if (state === 'disabled') {
    return React.createElement(React.Fragment, null, disabledFallback !== undefined ? disabledFallback : children);
  }
  // enabled / read_only
  return React.createElement(React.Fragment, null, children);
};

// ===== Universal toast (Phase 3 toast standardization) =====
export const toast = {
  success: (_message: any, _opts?: any) => 'toast-id',
  error: (_message: any, _opts?: any) => 'toast-id',
  warning: (_message: any, _opts?: any) => 'toast-id',
  info: (_message: any, _opts?: any) => 'toast-id',
  promise: <T,>(p: Promise<T> | (() => Promise<T>), _msgs?: any) => (typeof p === 'function' ? (p as () => Promise<T>)() : p),
  dismiss: (_id?: string) => {},
};
export const useToast = () => toast;
export const getErrorMessage = (_e: any, fallback?: string) => fallback ?? 'error';
export const attachToastErrorHandler = (_client?: any, _opts?: any) => 0;
export const toastBus = { subscribe: () => () => {}, getToasts: () => [], dismiss: (_id?: string) => {} };
export const ToastViewport = () => null;
export const ToastProvider = ({ children }: any) => React.createElement(React.Fragment, null, children);
