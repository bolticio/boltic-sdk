import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'BolticSDK',
      formats: ['es', 'cjs'],
      fileName: (format) => `sdk.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: ['axios'],
      output: {
        exports: 'named',
        globals: {
          axios: 'axios',
        },
        // Ensure we get a single bundle
        manualChunks: undefined,
      },
    },
    sourcemap: true,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      outDir: 'dist/types',
      // Ensure we generate a single types file
      compilerOptions: {
        declaration: true,
        declarationMap: true,
      },
    }),
  ],
});
