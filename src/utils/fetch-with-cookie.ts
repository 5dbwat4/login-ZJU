let Cookie_pool : Record<string, Record<string, string>> = {};
function fetchWithCookie(url: string, options: RequestInit): Promise<Response> {
  const host = new URL(url).host;
  Cookie_pool[host] = Cookie_pool[host] || {};
  if (Cookie_pool[host]) {
    options.headers = {
      Cookie: Object.entries(Cookie_pool[host])
        .map(([key, value]) => `${key}=${value}`)
        .join("; "),
    };
  }
  options.redirect = "manual";
  return fetch(url, options).then((response) => {
    if (response.headers.get("set-cookie")) {
      response.headers.getSetCookie().forEach((cookie) => {
        const [key, value] = cookie.split("=");
        Cookie_pool[host][key] = value;
      });
    }
    return response;
  });
}

function extractCookie(host: string): Record<string, string> {
    return Cookie_pool[host] || {};
}

export default fetchWithCookie;