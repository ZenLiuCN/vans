// @ts-ignore
import * as es from "go/esbuild"
// @ts-ignore
import {Watcher} from "go/fsNotify"


let pass = false;
const w = new Watcher(10)
w.addTree(".")
w.onEvent(ev => {
    // console.log("file", ev.path())
    if (pass) return
    if (ev.isFile()
        && ev.path().indexOf("bundle") == -1
        && (ev.isModified() || ev.isModified())
        && ev.path().endsWith(".ts")) {
        const r = es.build({
            logLevel: 5,
            sourcemap: 0,
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
            // @ts-ignore
            entryPoints: [args[0]],
            write: true
        })
        if (r.errors && r.errors.length > 0) {
            console.log(...es.formatMessages(r.errors, {
                terminalWidth: 320,
                kind: 0,
                color: false
            }))
        } else {
            // @ts-ignore
            console.log("bundled ", args[0], ev.path(), {
                isFile: ev.isFile(),
                isCreated: ev.isCreated(),
                isModified: ev.isModified(),
                isRenamed: ev.isRenamed(),
                isRemoved: ev.isRemoved(),
                isAttributeChanged: ev.isAttributeChanged(),
            })
        }
        pass = true
        setTimeout(() => {
            // console.log("throttle out")
            pass = false
        }, 500);
    }
})
w.await()
