// rollup.config.js
import { readFileSync } from 'fs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

/**
 * Check if we're in development mode
 */
const isDevelopment = process.env.NODE_ENV === 'development';

const plugins = [
  peerDepsExternal(),
  resolve({
    preferBuiltins: true,
    skipSelf: true,
  }),
  replace({
    __IS_DEV__: isDevelopment,
    preventAssignment: true,
  }),
  commonjs({
    transformMixedEsModules: true,
    requireReturnsDefault: 'auto',
  }),
  typescript({
    tsconfig: './tsconfig.build.json',
    outDir: './dist',
    sourceMap: true,
    /**
     * Remove inline sourcemaps - they conflict with external sourcemaps
     */
    inlineSourceMap: false,
    /**
     * Always include source content in sourcemaps for better debugging
     */
    inlineSources: true,
  }),
  json(),
];

// helper that marks everything coming from node_modules as external.
// Rollup by default only externalizes packages listed in `dependencies`, but
// transient deps like @redis/client were pulled into the bundle and triggered
// a circular‑dependency warning.  By checking the path we avoid bundling any
// dependency at all – the package will be required at runtime instead.
function isExternal(id) {
  if (id == null) return false;

  // if the module is one of our direct dependencies or devDependencies,
  // mark it external (handles bare imports like 'xlsx' or scoped names
  // like '@redis/client'). We match both the package itself and nested
  // imports under it (e.g. '@redis/client/dist/…').
  const deps = Object.keys(pkg.dependencies || {});
  const devDeps = Object.keys(pkg.devDependencies || {});
  for (const dep of deps.concat(devDeps)) {
    if (id === dep || id.startsWith(`${dep}/`)) {
      return true;
    }
  }

  // anything clearly coming from node_modules (e.g. a deep import) is external
  if (/node_modules/.test(id)) {
    return true;
  }

  // default: not external (so rollup will include it). This covers local
  // source files such as 'src/index.ts' or alias'd imports starting with '/'.
  return false;
}

// suppress known circular‑dependency noise from third‑party libs such as
// `@redis/client`.  These cycles live entirely in node_modules and are safe to
// ignore, especially in a server bundle where dependencies remain external.
function onwarn(warning, warn) {
  if (warning.code === 'CIRCULAR_DEPENDENCY') {
    if (warning.importer && /node_modules\/.+@redis\/client/.test(warning.importer)) {
      return; // drop the message
    }
  }
  // fall back to default handling for everything else
  warn(warning);
}

const cjsBuild = {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'cjs',
    sourcemap: true,
    exports: 'named',
    entryFileNames: '[name].js',
    /**
     * Always include sources in sourcemap for better debugging
     */
    sourcemapExcludeSources: false,
  },
  external: isExternal,
  preserveSymlinks: true,
  plugins,
  onwarn,
};

export default cjsBuild;
