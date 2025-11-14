// TypeScript refactor of the original cookie-jar implementation.
// The file exposes three exported classes: CookieAccessInfo, Cookie, CookieJar

export class CookieAccessInfo {
    domain?: string;
    path: string;
    secure: boolean;
    script: boolean;

    static All: any = Object.freeze(Object.create(null));

    constructor(domain?: string, path?: string, secure?: boolean, script?: boolean) {
        this.domain = domain || undefined;
        this.path = path || "/";
        this.secure = !!secure;
        this.script = !!script;
    }
}

const cookie_str_splitter = /[:](?=\s*[a-zA-Z0-9_\-]+\s*[=])/g;

export class Cookie {
    name: string | null = null;
    value: string | null = null;
    expiration_date: number = Infinity;
    path: string = "/";
    explicit_path: boolean = false;
    domain: string | null = null;
    explicit_domain: boolean = false;
    secure: boolean = false;
    noscript: boolean = false; // httponly

    constructor(cookiestr?: string | Cookie, request_domain?: string | null, request_path?: string) {
        if (cookiestr instanceof Cookie) {
            // clone
            Object.assign(this, cookiestr);
            return;
        }
        this.path = String(request_path || "/");
        this.domain = request_domain || null;
        if (cookiestr) {
            this.parse(cookiestr as string, request_domain, request_path);
        }
    }

    toString(): string {
        const str: string[] = [this.name + "=" + this.value];
        if (this.expiration_date !== Infinity) {
            str.push("expires=" + new Date(this.expiration_date).toUTCString());
        }
        if (this.domain) {
            str.push("domain=" + this.domain);
        }
        if (this.path) {
            str.push("path=" + this.path);
        }
        if (this.secure) {
            str.push("secure");
        }
        if (this.noscript) {
            str.push("httponly");
        }
        return str.join("; ");
    }

    toValueString(): string {
        return this.name + "=" + this.value;
    }

    parse(str: string, request_domain?: string | null, request_path?: string): this | undefined {
        if (typeof str !== 'string') return undefined;
        if (str.length > 32768) {
            console.warn("Cookie too long for parsing (>32768 characters)");
            return undefined;
        }

        const parts = str.split(";").filter(Boolean);
        const firstPair = parts[0].match(/([^=]+)=([\s\S]*)/);
        if (!firstPair) {
            console.warn("Invalid cookie header encountered. Header: '" + str + "'");
            return undefined;
        }

        let key = firstPair[1];
        let value = firstPair[2];
        if (typeof key !== 'string' || key.length === 0 || typeof value !== 'string') {
            console.warn("Unable to extract values from cookie header. Cookie: '" + str + "'");
            return undefined;
        }

        this.name = key;
        this.value = value;

        for (let i = 1; i < parts.length; i += 1) {
            const pair = parts[i].match(/([^=]+)(?:=([\s\S]*))?/);
            if (!pair) continue;
            key = pair[1].trim().toLowerCase();
            value = pair[2];
            switch (key) {
                case "httponly":
                    this.noscript = true;
                    break;
                case "expires":
                    this.expiration_date = value ? Number(Date.parse(value)) : Infinity;
                    break;
                case "path":
                    this.path = value ? value.trim() : "";
                    this.explicit_path = true;
                    break;
                case "domain":
                    this.domain = value ? value.trim() : "";
                    this.explicit_domain = !!this.domain;
                    break;
                case "secure":
                    this.secure = true;
                    break;
            }
        }

        if (!this.explicit_path) {
            this.path = request_path || "/";
        }
        if (!this.explicit_domain) {
            this.domain = request_domain || this.domain;
        }

        return this;
    }

    matches(access_info: CookieAccessInfo | any): boolean {
        if (access_info === CookieAccessInfo.All) {
            return true;
        }
        if ((this.noscript && access_info.script) || (this.secure && !access_info.secure) || !this.collidesWith(access_info)) {
            return false;
        }
        return true;
    }

    collidesWith(access_info: CookieAccessInfo | any): boolean {
        if ((this.path && !access_info.path) || (this.domain && !access_info.domain)) {
            return false;
        }
        if (this.path && access_info.path.indexOf(this.path) !== 0) {
            return false;
        }
        if (this.explicit_path && access_info.path.indexOf(this.path) !== 0) {
            return false;
        }

        const access_domain = access_info.domain && access_info.domain.replace(/^[\.]/, '');
        const cookie_domain = this.domain && this.domain.replace(/^[\.]/, '');
        if (cookie_domain === access_domain) {
            return true;
        }
        if (cookie_domain) {
            if (!this.explicit_domain) {
                return false; // already checked exact match above
            }
            const wildcard = access_domain.indexOf(cookie_domain);
            if (wildcard === -1 || wildcard !== access_domain.length - cookie_domain.length) {
                return false;
            }
            return true;
        }
        return true;
    }
}

export class CookieJar {
    private cookies: Record<string, Cookie[]>;

    constructor() {
        this.cookies = Object.create(null);
    }

    setCookie(cookie: string | Cookie, request_domain?: string | null, request_path?: string): Cookie | Cookie[] | false {
        const c = cookie instanceof Cookie ? cookie : new Cookie(cookie as string, request_domain, request_path);
        const remove = c.expiration_date <= Date.now();
        const name = c.name as string;

        const existing = this.cookies[name];
        if (existing !== undefined) {
            for (let i = 0; i < existing.length; i += 1) {
                const collidable_cookie = existing[i];
                if (collidable_cookie.collidesWith(c)) {
                    if (remove) {
                        existing.splice(i, 1);
                        if (existing.length === 0) {
                            delete this.cookies[name];
                        }
                        return false;
                    }
                    existing[i] = c;
                    return c;
                }
            }
            if (remove) {
                return false;
            }
            existing.push(c);
            return c;
        }

        if (remove) {
            return false;
        }
        this.cookies[name] = [c];
        return this.cookies[name];
    }

    // returns a cookie
    getCookie(cookie_name: string, access_info: CookieAccessInfo | any): Cookie | undefined {
        const list = this.cookies[cookie_name];
        if (!list) return undefined;
        for (let i = 0; i < list.length; i += 1) {
            const cookie = list[i];
            if (cookie.expiration_date <= Date.now()) {
                // removal behavior: if expired, skip (and allow eventual cleanup)
                if (list.length === 0) {
                    delete this.cookies[cookie.name as string];
                }
                continue;
            }
            if (cookie.matches(access_info)) {
                return cookie;
            }
        }
        return undefined;
    }

    // returns a list of cookies
    getCookies(access_info: CookieAccessInfo | any): Cookie[] & { toString?: () => string; toValueString?: () => string } {
        const matches: Cookie[] & any = [];
        for (const cookie_name in this.cookies) {
            const cookie = this.getCookie(cookie_name, access_info);
            if (cookie) matches.push(cookie);
        }
        matches.toString = function toString() {
            return matches.join(":");
        };
        matches.toValueString = function toValueString() {
            return matches.map(function (c: Cookie) {
                return c.toValueString();
            }).join('; ');
        };
        return matches;
    }

    // returns list of cookies that were set correctly. Cookies that are expired and removed are not returned.
    setCookies(cookies: string | string[] | Cookie[], request_domain?: string | null, request_path?: string): Cookie[] {
        const items = Array.isArray(cookies) ? cookies : (cookies as string).split(cookie_str_splitter);
        const successful: Cookie[] = [];
        const prepared = items.map((item: any) => (item instanceof Cookie ? item : new Cookie(item, request_domain, request_path)));
        for (let i = 0; i < prepared.length; i += 1) {
            const cookie = prepared[i];
            if (this.setCookie(cookie, request_domain, request_path)) {
                successful.push(cookie);
            }
        }
        return successful;
    }
}
