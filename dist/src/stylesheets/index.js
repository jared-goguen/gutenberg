import { generateMonoStylesheet } from "./mono.js";
/**
 * Stylesheet router — mono theme only.
 *
 * gutenberg-jg ships a single theme: mono (disciplined brutalism,
 * red/vermillion accent, Helvetica Neue, strict 8px grid).
 * All other themes (classic, ink, wire, cloudflare) are stripped.
 */
export function getThemeStylesheet(t) {
    return generateMonoStylesheet(t);
}
//# sourceMappingURL=index.js.map