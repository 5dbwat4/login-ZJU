/**
 * A node module that automatically handles cookies
 * @returns {Object} fetch: a fetch function that automatically handles cookies, extractCookie: a function that extracts a cookie from the cookie pool
 */
function createFetchSession(): Promise<{
  fetch: (url: string, options?: RequestInit) => Promise<Response>;
  extractCookie: (origin: string, cookieName: string) => string;
  injectCookie: (origin: string, cookieName: string, cookie: string) => void;
}> {
  // It handles cookies automatically
  let cookiePool: Record<string, Record<string, string>> = {};
  return new Promise((resolve) => {
    resolve({
      fetch: async (url: string, options?: RequestInit) => {
        const origin = new URL(url).origin;
        return fetch(url, {
          ...options,
          headers: {
            "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
            ...options?.headers,
            
            cookie: Object.entries(cookiePool[origin] || {})
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
          },
        }).then(async (res) => {
            console.log(`[session-fetch] Fetch ${url} with cookies`,cookiePool[origin],` and status ${res.status} and received cookies`,res.headers.getSetCookie());
            // console.log("[Sessioned fetch] Fetch ",url);
            
            
          res.headers.getSetCookie().forEach((cookie: string) => {
            let [cookieName,cookieValue] = cookie.split(";")[0].split("=");
            cookiePool[origin] = cookiePool[origin] || {};
            cookiePool[origin][cookieName] = cookieValue;
          });
        
            
          return res;
        });
      },
      extractCookie: (origin: string, cookieName: string) => {
        return cookiePool[origin][cookieName] || "";
      },
      injectCookie: (origin: string, cookieName: string, cookie: string) => {
        cookiePool[origin] = cookiePool[origin] || {};
        cookiePool[origin][cookieName] = cookie;
        return;
      },
    });
  });
}

export { createFetchSession };
