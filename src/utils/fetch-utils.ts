import { CookieJar, CookieAccessInfo } from './cookie-jar.js';

/**
 * Simple fetch wrapper that injects cookies from a CookieJar and stores Set-Cookie headers back.
 * Usage:
 *   const jar = createCookieJar();
 *   const res = await fetchWithCookie('https://example.com/path', { method: 'GET' }, jar);
 */
export function createCookieJar(): CookieJar {
    return new CookieJar();
}

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0';

function headersToObject(headers: HeadersInit | undefined): Record<string, string> {
    const out: Record<string, string> = {};
    if (!headers) return out;
    if (headers instanceof Headers) {
        for (const [k, v] of headers.entries()) out[k.toLowerCase()] = v;
        return out;
    }
    if (Array.isArray(headers)) {
        for (const [k, v] of headers) out[k.toLowerCase()] = v as string;
        return out;
    }
    for (const k of Object.keys(headers)) {
        const val = (headers as any)[k];
        out[k.toLowerCase()] = String(val);
    }
    return out;
}

export async function fetchWithCookie(input: RequestInfo, init?: RequestInit, jar?: CookieJar): Promise<Response> {
    const cookieJar = jar || createCookieJar();

    // Resolve URL and access info
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
    const parsed = new URL(url, 'http://localhost');
    const domain = parsed.hostname;
    const path = parsed.pathname || '/';

    // Prepare headers
    const providedHeaders = headersToObject(init && init.headers ? init.headers : undefined);

    // Get cookies matching this access info
    const access = new CookieAccessInfo(domain, path, parsed.protocol === 'https:', false);
    const cookies = cookieJar.getCookies(access);
    const cookieHeader = (cookies && (cookies as any).toValueString) ? (cookies as any).toValueString() : (cookies.length ? cookies.map(c => c.toValueString()).join('; ') : '');

    if (cookieHeader) {
        // merge with existing cookie header if present
        const existing = providedHeaders['cookie'];
        providedHeaders['cookie'] = existing ? (existing + '; ' + cookieHeader) : cookieHeader;
    }


    // Rebuild Headers for fetch
    const headers = new Headers();
    headers.set('User-Agent', userAgent);
    for (const k of Object.keys(providedHeaders)) {
        headers.set(k, providedHeaders[k]);
    }

    const finalInit: RequestInit = Object.assign({}, init, { headers });

    const res = await fetch(input, finalInit);

    // Collect Set-Cookie headers (there may be multiple)
    const setCookies: string[] = [];
    // Headers implements iterable of [name, value]
    for (const [name, value] of res.headers) {
        if (name.toLowerCase() === 'set-cookie') {
            // value should be a single Set-Cookie string; if multiple Set-Cookie headers present they appear as separate iterations
            setCookies.push(value);
        }
    }

    if (setCookies.length > 0) {
        // Add cookies back to jar
        for (const sc of setCookies) {
            try {
                cookieJar.setCookies(sc, domain, path);
            } catch (e) {
                // swallow errors from cookie parsing
                // keep best-effort behavior
                // eslint-disable-next-line no-console
                console.warn('Failed to set cookie from header', sc, e);
            }
        }
    }

    return res;
}

export default fetchWithCookie;
