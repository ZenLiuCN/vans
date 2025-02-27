

type SpanRender<T> = (style:string|undefined,text:string)=>T
type LineRender<T> = ()=>T
type Render<T> = ( c:T[])=>T

interface ANSI{
    readonly colors:[[string,string,string,string,string,string,string,string],[string,string,string,string,string,string,string,string]]
    readonly palette:Array<[string,string,string,string,string,string,string,string]>
    // computePalette()
    // parseCSI<T>(cmd:string|undefined, text: string,span:SpanRender<T>,line:LineRender<T>)
    useColors(color:string[][])
    toHtml<T>(escape:boolean,txt: string, tag: Render<T>,span:SpanRender<T>,line:LineRender<T>)
}
declare const a:ANSI
export default  a
