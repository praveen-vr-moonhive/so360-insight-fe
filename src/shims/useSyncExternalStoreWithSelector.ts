/**
 * ESM shim for use-sync-external-store/with-selector.
 *
 * Reason: The npm package `use-sync-external-store` is CJS-only. When Rollup
 * bundles the CJS `require("react")` inside it, the commonjs plugin resolves
 * React as a static local chunk (index-*.js) BEFORE the vite-plugin-federation
 * singleton mechanism can externalize it. The result is two React instances in
 * memory, causing `ReactSharedInternals.H is null` in React 19.
 *
 * This ESM shim imports React hooks via ESM `import` statements, which ARE
 * properly intercepted by vite-plugin-federation and replaced with dynamic
 * imports from the federation shared scope (shell's singleton React).
 *
 * Faithfully ported from:
 * use-sync-external-store/cjs/use-sync-external-store-with-selector.production.js
 */

import {
  useSyncExternalStore,
  useRef,
  useEffect,
  useMemo,
  useDebugValue,
} from 'react';

function is(x: unknown, y: unknown): boolean {
  return (
    (x === y && (x !== 0 || 1 / (x as number) === 1 / (y as number))) ||
    (x !== x && y !== y)
  );
}

const objectIs: (a: unknown, b: unknown) => boolean =
  typeof Object.is === 'function' ? Object.is : is;

export function useSyncExternalStoreWithSelector<Snapshot, Selection>(
  subscribe: (callback: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot: (() => Snapshot) | undefined | null,
  selector: (snapshot: Snapshot) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean
): Selection {
  const instRef = useRef<{ hasValue: boolean; value: Selection } | null>(null);

  let inst: { hasValue: boolean; value: Selection };
  if (instRef.current === null) {
    inst = { hasValue: false, value: null as unknown as Selection };
    instRef.current = inst;
  } else {
    inst = instRef.current;
  }

  const [getSelection, getServerSelection] = useMemo(
    function () {
      let hasMemo = false;
      let memoizedSnapshot: Snapshot;
      let memoizedSelection: Selection;

      function memoizedSelector(nextSnapshot: Snapshot): Selection {
        if (!hasMemo) {
          hasMemo = true;
          memoizedSnapshot = nextSnapshot;
          const nextSelection = selector(nextSnapshot);
          if (isEqual !== undefined && inst.hasValue) {
            const currentSelection = inst.value;
            if (isEqual(currentSelection, nextSelection)) {
              memoizedSelection = currentSelection;
              return currentSelection;
            }
          }
          memoizedSelection = nextSelection;
          return nextSelection;
        }
        const currentSelection = memoizedSelection;
        if (objectIs(memoizedSnapshot, nextSnapshot)) {
          return currentSelection;
        }
        const nextSelection = selector(nextSnapshot);
        if (isEqual !== undefined && isEqual(currentSelection, nextSelection)) {
          memoizedSnapshot = nextSnapshot;
          return currentSelection;
        }
        memoizedSnapshot = nextSnapshot;
        memoizedSelection = nextSelection;
        return nextSelection;
      }

      const maybeGetServerSnapshot =
        getServerSnapshot === undefined ? null : getServerSnapshot;

      return [
        function getSnapshotWithSelector() {
          return memoizedSelector(getSnapshot());
        },
        maybeGetServerSnapshot === null
          ? undefined
          : function getServerSnapshotWithSelector() {
              return memoizedSelector(maybeGetServerSnapshot!());
            },
      ] as const;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getSnapshot, getServerSnapshot, selector, isEqual]
  );

  const value = useSyncExternalStore(subscribe, getSelection, getServerSelection);

  useEffect(
    function () {
      inst.hasValue = true;
      inst.value = value;
    },
    [inst, value]
  );

  useDebugValue(value);
  return value;
}
