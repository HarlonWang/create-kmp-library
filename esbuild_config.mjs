import * as esbuild from 'esbuild'

await esbuild.build({
    entryPoints: ['index.ts'],
    bundle: true,
    outfile: 'out.js',
    platform: 'node',
    sourcemap: 'inline',
}).catch(() => process.exit(1))
