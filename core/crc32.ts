const [T0, T1, T2, T3, T4, T5, T6, T7, T8, T9, Ta, Tb, Tc, Td, Te, Tf] = ((tab: Int32Array): Int32Array[] => {
    let c = 0, v = 0, n = 0, table = new Int32Array(4096)
    for (n = 0; n != 256; ++n) table[n] = tab[n];
    for (n = 0; n != 256; ++n) {
        v = tab[n];
        for (c = 256 + n; c < 4096; c += 256) v = table[c] = (v >>> 8) ^ tab[v & 0xFF];
    }
    const out = [tab]
    for (n = 1; n != 16; ++n) out[n] = table.subarray(n * 256, n * 256 + 256)
    return out
})(((): Int32Array => {
    let c = 0, table = new Array(256);
    for (let n = 0; n != 256; ++n) {
        c = n;
        c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1))
        c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1))
        c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1))
        c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1))
        c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1))
        c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1))
        c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1))
        c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1))
        table[n] = c;
    }
    return new Int32Array(table)
})())
export const table = T0
export const text = (str: string, seed: number): number => {
    let C = seed ^ -1;
    for (let i = 0, L = str.length, c = 0, d = 0; i < L;) {
        c = str.charCodeAt(i++);
        if (c < 0x80) {
            C = (C >>> 8) ^ T0[(C ^ c) & 0xFF];
        } else if (c < 0x800) {
            C = (C >>> 8) ^ T0[(C ^ (192 | ((c >> 6) & 31))) & 0xFF];
            C = (C >>> 8) ^ T0[(C ^ (128 | (c & 63))) & 0xFF];
        } else if (c >= 0xD800 && c < 0xE000) {
            c = (c & 1023) + 64;
            d = str.charCodeAt(i++) & 1023;
            C = (C >>> 8) ^ T0[(C ^ (240 | ((c >> 8) & 7))) & 0xFF];
            C = (C >>> 8) ^ T0[(C ^ (128 | ((c >> 2) & 63))) & 0xFF];
            C = (C >>> 8) ^ T0[(C ^ (128 | ((d >> 6) & 15) | ((c & 3) << 4))) & 0xFF];
            C = (C >>> 8) ^ T0[(C ^ (128 | (d & 63))) & 0xFF];
        } else {
            C = (C >>> 8) ^ T0[(C ^ (224 | ((c >> 12) & 15))) & 0xFF];
            C = (C >>> 8) ^ T0[(C ^ (128 | ((c >> 6) & 63))) & 0xFF];
            C = (C >>> 8) ^ T0[(C ^ (128 | (c & 63))) & 0xFF];
        }
    }
    return ~C;
}
export const buffer = (B: Array<number>, seed: number): number => {
    let C = seed ^ -1, L = B.length - 15, i = 0;
    for (; i < L;) C =
        Tf[B[i++] ^ (C & 255)] ^
        Te[B[i++] ^ ((C >> 8) & 255)] ^
        Td[B[i++] ^ ((C >> 16) & 255)] ^
        Tc[B[i++] ^ (C >>> 24)] ^
        Tb[B[i++]] ^ Ta[B[i++]] ^ T9[B[i++]] ^ T8[B[i++]] ^
        T7[B[i++]] ^ T6[B[i++]] ^ T5[B[i++]] ^ T4[B[i++]] ^
        T3[B[i++]] ^ T2[B[i++]] ^ T1[B[i++]] ^ T0[B[i++]];
    L += 15;
    while (i < L) C = (C >>> 8) ^ T0[(C ^ B[i++]) & 0xFF];
    return ~C;
}
export const ascii = (str: string, seed: number): number => {
    let C = seed ^ -1;
    for (let i = 0, L = str.length; i < L;) C = (C >>> 8) ^ T0[(C ^ str.charCodeAt(i++)) & 0xFF];
    return ~C;
}
export default {table, text, buffer, ascii}
