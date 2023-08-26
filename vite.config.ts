/// <reference types="vitest" />

import tsConfigPaths from 'vite-tsconfig-paths';

/** @type {import('vite').UserConfig} */
export default {
  plugins: [tsConfigPaths()],
  test: {
    include: [],
  },
};
