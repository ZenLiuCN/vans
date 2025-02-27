#! d:/dev/tools/engine -x
import {Reader,Writer} from "./index"

const w=Writer.create()
w.int64(12321321321)
const r=Reader.create(w.finish())
console.log(r.int64(false))
r.pos=0
console.log(r.int64(true))
