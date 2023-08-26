import { mergeConfig, defineConfig } from 'vitest/config';
import baseConfig from './vite.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'node',
      include: ['src/**/!(*.query).test.ts'],
    },
  }),
);
