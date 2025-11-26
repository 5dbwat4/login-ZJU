// open.zju.edu.cn 浙大先生开放平台

import { CookieAccessInfo } from "./utils/cookie-jar";
import fetchWithCookie, { createCookieJar } from "./utils/fetch-utils";
import type { ZJUAM } from "./zjuam";

const saferHeaders = {
  accept: "application/json, text/plain, */*",
  "accept-language": "en",
  "cache-control": "no-cache",
  "content-type": "application/json",
  pragma: "no-cache",
  "sec-ch-ua":
    '"Chromium";v="142", "Microsoft Edge";v="142", "Not_A Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "x-top-region": "cn-north-1",
  Referer: "https://open.zju.edu.cn/",
};
/* Otherwise it fail with
{
  ResponseMetadata: {
    Error: { Message: 'captcha verification failed', Code: 'BadCaptcha' }
  }
}
*/

/** */
class OPEN {
  zjuamInstance: ZJUAM;
  // cookies: { [key: string]: string };
  #xcsrfToken: string = "";
  #firstTime: boolean = true;
  #jar = createCookieJar();
  constructor(am: ZJUAM) {
    this.zjuamInstance = am;
    // this.cookies = {};
  }
  async login() {
    console.log("[OPEN] login begins");
    const prepareURL = "https://open.zju.edu.cn/api/auth/login";
    const RedirectUrl: string | false = await fetchWithCookie(
      prepareURL,
      {
        method: "POST",
        body: JSON.stringify({ SSO: "Oauth", IdpID: "2", RedirectUrl: "/" }),
        redirect: "manual",
        headers: saferHeaders,
      },
      this.#jar
    )
      .then((res) => res.json())
      .then((data) => {
        if (data && data.redirect_uri) {
          return data.redirect_uri;
        }
        console.log(data);
        return false;
      })
      .catch(() => false);
    if (!RedirectUrl) {
      throw new Error("[OPEN] Failed to get RedirectUrl from open.zju.edu.cn");
    }
    console.log("[OPEN] Redirecting to ZJUAM for authentication:", RedirectUrl);
    const rl = await this.zjuamInstance.loginSvc_oauth2(RedirectUrl);
    console.log("[OPEN] Returned from ZJUAM, finalizing login at:", rl);
    const res = await fetchWithCookie(rl, { redirect: "manual" }, this.#jar);
    const finalURL = res.headers.get("Location")!;
    console.log("[OPEN] Finalizing login at:", finalURL);
    await fetchWithCookie(
      new URL(finalURL, "https://open.zju.edu.cn").toString(),
      { redirect: "manual" },
      this.#jar
    );
    // Get x-csrf-token from cookies
    const access = new CookieAccessInfo(
      "open.zju.edu.cn",
        "/",
        true,
        false
    );
    const cookie = this.#jar.getCookie("x-csrf-token", access);
    this.#xcsrfToken = cookie?.value || "";
    console.log("[OPEN] Login finalized.");
    return true;
  }

  async fetch(url: string, options: any = {}): Promise<Response> {
    if (this.#firstTime) {
      await this.login();
      this.#firstTime = false;
    }
    return fetchWithCookie(
      url,
      { headers: { ...saferHeaders, "x-csrf-token": this.#xcsrfToken, ...options?.headers }, ...options },
      this.#jar
    );
  }
}

export { OPEN };


/*
可以确定：x-csrf-token 的来源就是cookie里的 x-csrf-token

        , w = c.Z.create({
            baseURL: "/api",
            method: "POST",
            headers: {
                "x-top-region": "cn-north-1",
                "x-csrf-token": p.Z.get("x-csrf-token") || "",
                "accept-language": d.ZP.language
            }
        });

而这一段代码中的p.Z.get就是下面的工具

    51401: function(t, e, n) {
        "use strict";
        function r(t) {
            for (var e = 1; e < arguments.length; e++) {
                var n = arguments[e];
                for (var r in n)
                    t[r] = n[r]
            }
            return t
        }
        n.d(e, {
            Z: () => i
        });
        var i = function t(e, n) {
            function i(t, i, o) {
                if ("undefined" != typeof document) {
                    "number" == typeof (o = r({}, n, o)).expires && (o.expires = new Date(Date.now() + 864e5 * o.expires)),
                    o.expires && (o.expires = o.expires.toUTCString()),
                    t = encodeURIComponent(t).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
                    var s = "";
                    for (var a in o) {
                        if (o[a])
                            s += "; " + a,
                            !0 !== o[a] && (s += "=" + o[a].split(";")[0])
                    }
                    return document.cookie = t + "=" + e.write(i, t) + s
                }
            }
            return Object.create({
                set: i,
                get: function(t) {
                    if ("undefined" != typeof document && (!arguments.length || t)) {
                        for (var n = document.cookie ? document.cookie.split("; ") : [], r = {}, i = 0; i < n.length; i++) {
                            var o = n[i].split("=")
                              , s = o.slice(1).join("=");
                            try {
                                var a = decodeURIComponent(o[0]);
                                if (r[a] = e.read(s, a),
                                t === a)
                                    break
                            } catch (t) {}
                        }
                        return t ? r[t] : r
                    }
                },
                remove: function(t, e) {
                    i(t, "", r({}, e, {
                        expires: -1
                    }))
                },
                withAttributes: function(e) {
                    return t(this.converter, r({}, this.attributes, e))
                },
                withConverter: function(e) {
                    return t(r({}, this.converter, e), this.attributes)
                }
            }, {
                attributes: {
                    value: Object.freeze(n)
                },
                converter: {
                    value: Object.freeze(e)
                }
            })
        }({
            read: function(t) {
                return '"' === t[0] && (t = t.slice(1, -1)),
                t.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent)
            },
            write: function(t) {
                return encodeURIComponent(t).replace(/%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g, decodeURIComponent)
            }
        }, {
            path: "/"
        })
    },

    */