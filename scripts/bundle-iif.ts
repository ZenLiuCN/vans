// @ts-ignore
import * as es from "go/esbuild"


const r = es.build({
    logLevel: 5,
    sourcemap: 0,//o none 1 inline 2 ext
    sourceRoot: ".",
    sourcesContent: 0,
    target: 9,
    charset: 2,
    format: 1,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    treeShaking: 2,
    bundle: true,
    outdir: './dist/js',
    platform: 1,
    tsconfigRaw:`{
  "compilerOptions": {
    "allowJs": true,
    "target": "ES2022",
    "declaration": true
  }
}`,
    // @ts-ignore
    entryPoints: args,
    write: true
})
if (r.errors && r.errors.length > 0) {
    console.log(...es.formatMessages(r.errors, {
        terminalWidth: 320,
        kind: 0,
        color: false
    }))
} else {
    console.log("done")
}
