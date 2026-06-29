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
    clean: false,
    outDir: 'dist',
  },
  {
    // Server route handler JS — bundled so Next.js can tree-shake it
    entry: { server: 'src/server.ts' },
    format: ['esm', 'cjs'],
    dts: false,
    sourcemap: true,
    clean: false,
    outDir: 'dist',
  },
  {
    // Server DTS only — separate pass so the client config's clean: true can't race and delete it
    entry: { server: 'src/server.ts' },
    dts: { only: true },
    clean: false,
    outDir: 'dist',
  },
])
