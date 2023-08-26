import { mergeConfig, defineConfig } from 'vitest/config';
import baseConfig from './vite.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'postgres',
      include: ['src/**/*.query.test.ts'],
      setupFiles: ['./test-utils/setup/postgres/index.ts'],
      sequence: {
        hooks: 'stack',
      },
    },
  }),
);
