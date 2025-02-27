const csi = /^(?:\x1b\[([\x3c-\x3f]?)([\d;]*)([\x20-\x2f]?[\x40-\x7e]))|(?:\x1b\[[\x20-\x7e]*([\x00-\x1f:]))/
const esc = "\x1b"
const escapeHTML = str => str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
}[tag] || tag))
const lineRender = (style, txt, line, span) =>
    txt.indexOf('\n') >= 0
        ? txt.split('\n')
            .map(v => span(style, v))
            .reduce((o, v) => {
                o.push(line(), v)
                return o
            }, [])
        : [span(style, txt)]

class ANSI {

    colors = []
    palette = []

    constructor() {
        this.palette = []
        this.colors = [['#000000', '#BB0000', '#00BB00', '#BBBB00',
            '#0000BB', '#BB00BB', '#00BBBB', '#FFFFFF'],
            ['#555555', '#FF5555', '#00FF00', '#FFFF55',
                '#5555FF', '#FF55FF', '#55FFFF', '#FFFFFF']]
    }

    parseCSI(cmd, text, span, line) {
        if (!cmd)   return lineRender(undefined,text,line,span)
        let s = []
        let c = cmd.split(';')
        let bold, faint, italic, underline, fg, bg
        while (c.length) {
            let x = c.shift()
            let n = parseInt(x, 10)
            switch (true) {
                case isNaN(n) || n === 0:
                    break
                case n === 1:
                    bold = true;
                    break
                case n === 2:
                    faint = true;
                    break
                case n === 3:
                    italic = true;
                    break
                case n === 4:
                    underline = true;
                    break
                case n === 21:
                    bold = false;
                    break
                case n === 22:
                    faint = false;
                    break
                case n === 23:
                    italic = false;
                    break
                case n === 24:
                    underline = false;
                    break
                case n === 39:
                    fg = undefined;
                    break
                case n === 49:
                    bg = undefined;
                    break
                case n >= 30 && n < 38:
                    fg = this.colors[0][n - 30];
                    break
                case n >= 40 && n < 48:
                    bg = this.colors[0][n - 40];
                    break
                case n >= 90 && n < 98:
                    fg = this.colors[1][n - 90];
                    break
                case n >= 100 && n < 108:
                    bg = this.colors[1][n - 100];
                    break
                case n === 38 || n === 48:
                    if (c.length > 0) {
                        let fore = n === 38
                        let m = c.shift()
                        if (m === '5' && c.length > 0) {
                            if (!this.palette.length) this.computePalette()
                            let p = parseInt(c.shift(), 10)
                            if (p >= 0 && p <= 255) {
                                if (fore) fg = this.palette[p]
                                else bg = this.palette[p]
                            }
                        }
                        if (m === '2' && c.length > 2) {
                            let r = parseInt(c.shift(), 10)
                            let g = parseInt(c.shift(), 10)
                            let b = parseInt(c.shift(), 10)
                            if ((r >= 0 && r <= 255) && (g >= 0 && g <= 255) && (b >= 0 && b <= 255)) {
                                // @ts-ignore
                                let c = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
                                if (fore)
                                    fg = c;
                                else
                                    bg = c;
                            }
                        }
                    }
            }
        }
        if (fg) s.push({color: fg})
        if (bg) s.push({'background-color': bg})
        if (bold) s.push({'font-weight': 'bold'})
        if (faint) s.push({opacity: '0.7'})
        if (italic) s.push({'font-style': 'italic'})
        if (underline) s.push({'text-decoration': 'underline'})

        let style = s.map((v) => Object.keys(v).map(x => `${x}:${v[x]}`)).flat().join(';')
        return lineRender(style,text,line,span)
    }

    computePalette() {
        let l = ['00', '5F', '87', 'AF', 'D7', 'FF'] // [0, 95, 135, 175, 215, 255];
        this.palette = []
        this.colors.forEach(v => this.palette.push(...v))
        for (let r = 0; r < 6; ++r)
            for (let g = 0; g < 6; ++g)
                for (let b = 0; b < 6; ++b)
                    this.palette.push(`#${l[r]}${l[g]}${l[b]}`)
        let g = 8;
        for (let i = 0; i < 24; ++i, g += 10)
            this.palette.push('#' + g.toString(16).padStart(2, '0').repeat(3))
    }

    useColors(color) {
        if (!color || color.filter(v => v.length === 8).length != 2)
            throw new Error('bad color palette')
        this.colors = color
        this.computePalette()
    }

    toHtml(escape,txt, tag, span, line) {
        if (!txt) return tag([])
        if(escape) txt = escapeHTML(txt)
        let s, i = txt.indexOf(esc)
        if (i < 0) return tag(lineRender(undefined,txt,line,span))
        let ch = []
        let cmd = ''
        let x = txt
        let m
        while (i >= 0) {
            esc:
                switch (true) {
                    case i > 0:
                        ch.push(...this.parseCSI(cmd, x.substring(0, i), span, line))
                        cmd = ''
                        x = x.substring(i)
                        break
                    case i === 0:
                        let nc = x.charAt(1)
                        switch (nc) {
                            case '[':
                                m = csi.exec(x)
                                if (!m || !!m[4]) {
                                    x = x.slice(1)
                                } else {
                                    if (!((m[1] !== '') || (m[3] !== 'm'))) { //BGR
                                        cmd = m[2]
                                    }
                                    x = x.substring(m[0].length)
                                }
                                break esc
                            case '(':
                                x = x.substring(3)
                                break
                        }
                }
            s = i
            i = x.indexOf(esc)
        }
        if (x) {
            ch.push(...this.parseCSI('', x, span, line))
        }
        return tag(ch)
    }
}

export default new ANSI()

