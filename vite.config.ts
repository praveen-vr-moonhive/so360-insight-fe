import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import path from 'path';

export default defineConfig({
    base: 'http://localhost:3024/',
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
            '@so360/formatters': path.resolve(__dirname, '../../so360-shell-fe/packages/formatters/src'),
        },
    },
    build: {
        target: 'esnext',
        minify: false,
        cssCodeSplit: false,
    },
    server: {
        port: 3024,
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
