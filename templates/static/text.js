//import { TextDecoder, TextEncoder } from 'util';
export function decode(bytes, encoding = 'utf8') {
    const decoder = new TextDecoder(encoding);
    return decoder.decode(bytes);
}
const encoder = new TextEncoder();
export function encode(str) {
    return encoder.encode(str);
}
//# sourceMappingURL=text.js.map