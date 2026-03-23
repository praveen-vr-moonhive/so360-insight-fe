import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import path from 'path';

export default defineConfig({
    base: process.env.VITE_BASE_URL || 'http://localhost:3024/',
    plugins: [
        react({
            jsxRuntime: 'automatic',
        }),
        federation({
            name: 'insight_app',
            filename: 'remoteEntry.js',
            exposes: {
                './App': './src/App.tsx',
            },
            shared: {
                react: { singleton: true, requiredVersion: '^19.2.0' },
                'react-dom': { singleton: true, requiredVersion: '^19.2.0' },
                'react-router-dom': { singleton: true, requiredVersion: '^7.12.0' },
                // scheduler must match the Shell host singleton to prevent React fiber
                // scheduling conflicts that surface as "ReactSharedInternals.H is null"
                scheduler: { singleton: true },
                // use-sync-external-store is recharts v3's react-redux dependency.
                // Both Shell and Insight MFE expose it as singleton so the federation
                // runtime serves one instance — preventing recharts' dispatcher mismatch.
                'use-sync-external-store': { singleton: true },
                'framer-motion': { singleton: true },
                'lucide-react': { singleton: true },
                '@so360/shell-context': { singleton: true },
                '@so360/design-system': { singleton: true },
                '@so360/event-bus': { singleton: true },
                '@so360/formatters': { singleton: true },
            },
        }),
    ],
    resolve: {
        alias: {
            '@so360/formatters': path.resolve(__dirname, '../../so360-shell-fe/packages/formatters/dist/index.js'),
            // Redirect ALL CJS use-sync-external-store sub-paths to ESM shims.
            //
            // Root cause: The CJS `use-sync-external-store` package's `require('react')`
            // is transformed by Rollup's commonjs plugin into a STATIC import of a
            // locally-bundled React chunk (index-*.js), bypassing vite-plugin-federation's
            // singleton mechanism. This creates two React instances in the browser —
            // the shell's React (which runs the fiber scheduler) and the MFE's bundled
            // React (where ReactSharedInternals.H is always null) — causing:
            //   TypeError: can't access property "useRef", ReactSharedInternals.H is null
            //
            // The ESM shims import React via ESM `import`, which IS intercepted by the
            // federation plugin and replaced with the shell's singleton React at runtime.
            //
            // Consumers:
            //   react-redux@9      → use-sync-external-store/with-selector.js
            //   recharts@3 hooks   → use-sync-external-store/shim/with-selector
            'use-sync-external-store/with-selector': path.resolve(
                __dirname,
                './src/shims/useSyncExternalStoreWithSelector.ts'
            ),
            'use-sync-external-store/with-selector.js': path.resolve(
                __dirname,
                './src/shims/useSyncExternalStoreWithSelector.ts'
            ),
            'use-sync-external-store/shim/with-selector': path.resolve(
                __dirname,
                './src/shims/useSyncExternalStoreWithSelector.ts'
            ),
            'use-sync-external-store/shim/with-selector.js': path.resolve(
                __dirname,
                './src/shims/useSyncExternalStoreWithSelector.ts'
            ),
            // Also alias the root shim (imported by shim/with-selector CJS chain
            // and potentially other packages) to prevent its CJS React bundling.
            'use-sync-external-store/shim': path.resolve(
                __dirname,
                './src/shims/useSyncExternalStore.ts'
            ),
        },
    },
    build: {
        target: 'esnext',
        minify: false,
        cssCodeSplit: false,
    },
    server: {
        port: 3024,
        strictPort: true,
        cors: true,
        proxy: {
            '/v1/insight': {
                target: 'http://localhost:3023',
                changeOrigin: true,
            },
            '/neura-api': {
                target: 'http://localhost:3018',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/neura-api/, ''),
            },
            '/v1': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
    preview: {
        port: 3024,
        strictPort: true,
        cors: true,
        proxy: {
            '/v1/insight': {
                target: 'http://localhost:3023',
                changeOrigin: true,
            },
            '/neura-api': {
                target: 'http://localhost:3018',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/neura-api/, ''),
            },
            '/v1': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
});
