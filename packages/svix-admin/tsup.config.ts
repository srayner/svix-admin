import { defineConfig } from 'tsup'

export default defineConfig([
  {
    // Client bundle — bundle: false so 'use client' directives survive in each file
    entry: [
      'src/**/*.{ts,tsx}',
      '!src/server.ts',
      '!src/server/**',
      '!src/styles.css',
    ],
    format: ['esm', 'cjs'],
    dts: true,
    bundle: false,
    sourcemap: true,
    clean: true,
    outDir: 'dist',
  },
  {
    // Server route handler — bundled so Next.js can tree-shake it
    entry: { server: 'src/server.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false,
    outDir: 'dist',
  },
])
