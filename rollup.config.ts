import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'

export default {
  input: 'src/index.ts',
  external: ['fs', 'path', 'util'],
  output: {
    file: 'lib/index.js',
    format: 'cjs',
  },
  plugins: [
    resolve({
      browser: false,
      preferBuiltins: true,
    }),
    typescript({
      useTsconfigDeclarationDir: true,
    }),
    commonjs(),
  ],
}
