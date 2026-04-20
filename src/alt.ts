import type { ZJUAM } from "./zjuam.js";
import crypto from "node:crypto";
import fetchWithCookie, { createCookieJar } from "./utils/fetch-utils.js";
import { nanoid } from "nanoid";


const service = "https://alt.zju.edu.cn/ua/login?platform=WEB";

const APPCODE = "11"
const SALT = "$4holys**t"

const getHashSignHeader = (url: string, bodyString: string) => {
  let timestamp = Date.now();
  let rand = nanoid(16);
  let sign =  crypto.createHash("sha512").update(SALT + APPCODE + crypto.createHash("sha256").update(bodyString).digest("hex") + rand.substring(3, 11) + timestamp + url).digest("hex");
  return {
    "App-Code": APPCODE,
    "X-BD":rand,
    "X-XW":String(timestamp),
    "X-QW":sign,
    "platform": "WEB",
  };
}
class ALT {
  #token: string = "";
  #zjuamInstance: ZJUAM;
  #jar = createCookieJar();
  constructor(am: ZJUAM) {
    this.#zjuamInstance = am;
  }

  async login() {
    console.log("[ALT] login begins");
    const cb = await this.#zjuamInstance
      .loginSvc(service);
    let currentURL = cb;
    while(1){
        console.log("[ALT] Redirect:", currentURL);
        const res = await fetchWithCookie(currentURL, { redirect: "manual" }, this.#jar);
        if(res.status >= 300 && res.status < 400){
            currentURL = res.headers.get("Location")!;
        }else{
            break;
        }
    }
    // Now we assume the currentURL is the final URL with ticket, with a token param.
    const token = new URL(currentURL).searchParams.get("token");
    if(token){
        this.#token = token;
    }else{
        throw new Error("[ALT] login failed: no token found in URL");
    }
    console.log("[ALT] login success, token obtained.");
  }

  /**
   * fetch wrapper for form.zju.edu.cn, it will automatically login if not logged in.
   * @param url This defines the resource that you wish to fetch.
   * @param init A RequestInit object containing any custom settings that you want to apply to the request.
   * @returns A Promise that resolves to a Response object.
   */
  async fetch(url: string, init: RequestInit): Promise<Response> {
    if (this.#token === "") {
      await this.login();
    }
    console.log("[ALT] Fetching url:", url);
    try {
      const res = await fetch(url!, {
        ...init,
        headers: {
          ...init.headers,
        //   ...getHashSignHeader(url, init.body ? init.body.toString() : ""),
          "Content-Type": "application/json",
          "Accept": "application/json, text/plain, */*",
          "Authorization": "Bearer "+this.#token
        },
      });
      if (res.status === 200) {
        return res;
      } else {
        throw new Error(`Request failed with status ${res.status}`);
      }
    } catch (error) {
      console.error("Fetch error:", error);

      throw error;
    }
  }
}

export { ALT };



/*



直接抓XHR断点：
        d7f3e5db: function(e, t, n) {
            "use strict";
            var r = n("5ca8c120")
              , a = n("dffd22c8")
              , o = n("26d327cd")
              , i = n("60291e6f")
              , c = n("b2be4158")
              , u = n("16d6ab4a")
              , s = n("5ebf1dba")
              , l = n("a483cffb")
              , f = n("8e927443")
              , d = n("9209d084")
              , p = n("f5eb9894");
            e.exports = function(e) {
                return new Promise(function(t, n) {
                    var h, m = e.data, v = e.headers, b = e.responseType;
                    function g() {
                        e.cancelToken && e.cancelToken.unsubscribe(h),
                        e.signal && e.signal.removeEventListener("abort", h);
                    }
                    r.isFormData(m) && r.isStandardBrowserEnv() && delete v["Content-Type"];
                    var y = new XMLHttpRequest;
                    if (e.auth) {
                        var _ = e.auth.username || ""
                          , w = e.auth.password ? unescape(encodeURIComponent(e.auth.password)) : "";
                        v.Authorization = "Basic " + btoa(_ + ":" + w);
                    }
                    var S = c(e.baseURL, e.url);
                    function x() {
                        if (y) {
                            var r = "getAllResponseHeaders"in y ? u(y.getAllResponseHeaders()) : null
                              , o = b && "text" !== b && "json" !== b ? y.response : y.responseText
                              , i = {
                                data: o,
                                status: y.status,
                                statusText: y.statusText,
                                headers: r,
                                config: e,
                                request: y
                            };
                            a(function(e) {
                                t(e),
                                g();
                            }, function(e) {
                                n(e),
                                g();
                            }, i),
                            y = null;
                        }
                    }
                    if (y.open(e.method.toUpperCase(), i(S, e.params, e.paramsSerializer), !0),
                    y.timeout = e.timeout,
                    "onloadend"in y ? y.onloadend = x : y.onreadystatechange = function() {
                        y && 4 === y.readyState && (0 !== y.status || y.responseURL && 0 === y.responseURL.indexOf("file:")) && setTimeout(x);
                    }
                    ,
                    y.onabort = function() {
                        y && (n(new f("Request aborted",f.ECONNABORTED,e,y)),
                        y = null);
                    }
                    ,
                    y.onerror = function() {
                        n(new f("Network Error",f.ERR_NETWORK,e,y,y)),
                        y = null;
                    }
                    ,
                    y.ontimeout = function() {
                        var t = e.timeout ? "timeout of " + e.timeout + "ms exceeded" : "timeout exceeded"
                          , r = e.transitional || l;
                        e.timeoutErrorMessage && (t = e.timeoutErrorMessage),
                        n(new f(t,r.clarifyTimeoutError ? f.ETIMEDOUT : f.ECONNABORTED,e,y)),
                        y = null;
                    }
                    ,
                    r.isStandardBrowserEnv()) {
                        var E = (e.withCredentials || s(S)) && e.xsrfCookieName ? o.read(e.xsrfCookieName) : void 0;
                        E && (v[e.xsrfHeaderName] = E);
                    }
                    "setRequestHeader"in y && r.forEach(v, function(e, t) {
                        void 0 === m && "content-type" === t.toLowerCase() ? delete v[t] : y.setRequestHeader(t, e);
                    }),
                    r.isUndefined(e.withCredentials) || (y.withCredentials = !!e.withCredentials),
                    b && "json" !== b && (y.responseType = e.responseType),
                    "function" == typeof e.onDownloadProgress && y.addEventListener("progress", e.onDownloadProgress),
                    "function" == typeof e.onUploadProgress && y.upload && y.upload.addEventListener("progress", e.onUploadProgress),
                    (e.cancelToken || e.signal) && (h = function(e) {
                        y && (n(!e || e && e.type ? new d : e),
                        y.abort(),
                        y = null);
                    }
                    ,
                    e.cancelToken && e.cancelToken.subscribe(h),
                    e.signal && (e.signal.aborted ? h() : e.signal.addEventListener("abort", h))),
                    m || (m = null);
                    var C = p(S);
                    if (C && -1 === ["http", "https", "file"].indexOf(C)) {
                        n(new f("Unsupported protocol " + C + ":",f.ERR_BAD_REQUEST,e));
                        return;
                    }
                    y.send(m);
                }
                );
            }
            ;
        },


        发现两件事：
        1. v已经包含了鉴权头：{
    "Accept": "...",
    "Content-Type": "application/json",
    "platform": "WEB",
    "Authorization": "Bearer ...",
    "App-Code": "11",
    "X-BD": "V8f0unr8yuq9CvBO",
    "X-XW": "1776693782841",
    "X-QW": "..."
}

2. 
                        var E = (e.withCredentials || s(S)) && e.xsrfCookieName ? o.read(e.xsrfCookieName) : void 0;
                        E && (v[e.xsrfHeaderName] = E);

这一段实际无效。说实话我怀疑这一段是一个现成的库。

然后去看堆栈，找到一个函数v

            function v(e, t={}, n={}) {
                let r = (0,
                s.getHashSignHeaderInfo)(e, JSON.stringify(t), l());
                return (0,
                a.request)(e, {
                    data: {
                        ...t
                    },
                    getResponse: !0,
                    ...d,
                    ...n,
                    headers: {
                        platform: "WEB",
                        ...f(),
                        ...null == n ? void 0 : n.headers,
                        "X-BD": r.rand,
                        "X-XW": String(r.timestamp),
                        "X-QW": r.sign
                    }
                }).then(e => m(e, r)).then(e => e.data).then(e => e instanceof Error ? Promise.reject(e.message) : e ? 401 === e.code ? (h(e),
                Promise.reject(Error("token\u8D85\u65F6"))) : Promise.resolve(e) : Promise.reject(Error("\u670D\u52A1\u5668\u8BF7\u6C42\u8D85\u65F6"))).catch(e => {
                    var t;
                    return (null === (t = e.response) || void 0 === t ? void 0 : t.status) !== 401 && o.default.error(e.message),
                    Promise.reject(e.message);
                }
                );
            }

其中：r={
    "rand": "V8f0unr8yuq9CvBO",
    "timestamp": 1776693782841,
    "sign": "..."
}

所以核心逆向：

                let r = (0,
                s.getHashSignHeaderInfo)(e, JSON.stringify(t), l());

                要找到：1. s.getHashSignHeaderInfo这个函数；2. l这个函数；此外e和t分别是URL和请求体，都是调用v函数时传入的。

                l = () => sessionStorage.getItem("school") || window.__ENV_APPCODE__ || "64"

                , $ = (e, t, n) => {
                let r = Date.now()
                  , a = (0,
                v.nanoid)(16)
                  , o = I({
                    appCode: n,
                    bodyString: t,
                    rand: a,
                    timestamp: r,
                    url: e
                });
                return {
                    rand: a,
                    timestamp: r,
                    sign: o
                };
            }


                          , I = e => {
                let {appCode: t, bodyString: n, rand: r, timestamp: a, url: o} = e
                  , i = "$4holys**t"
                  , c = (0,
                h.default)(n).toString();
                return (0,
                m.default)(i + t + c + r.substring(3, 11) + a + o).toString();
            }


            h和m是啥呢？我们直接打断点。

            h和m都指向：

                    "74881fee": function(e, t, n) {
            let r = n("9d1520ca");
            !function(n, r) {
                "object" == typeof t ? e.exports = t = r() : n.CryptoJS = r();
            }(this, function() {
                var e = e || function(e, t) {
                    if ("undefined" != typeof window && window.crypto && (a = window.crypto),
                    "undefined" != typeof self && self.crypto && (a = self.crypto),
                    "undefined" != typeof globalThis && globalThis.crypto && (a = globalThis.crypto),
                    !a && "undefined" != typeof window && window.msCrypto && (a = window.msCrypto),
                    !a && void 0 !== r && r.crypto && (a = r.crypto),
                    !a && "function" == typeof n)
                        try {
                            a = n("a93a5549");
                        } catch (e) {}
                    var a, o = function() {
                        if (a) {
                            if ("function" == typeof a.getRandomValues)
                                try {
                                    return a.getRandomValues(new Uint32Array(1))[0];
                                } catch (e) {}
                            if ("function" == typeof a.randomBytes)
                                try {
                                    return a.randomBytes(4).readInt32LE();
                                } catch (e) {}
                        }
                        throw Error("Native crypto module could not be used to get secure random number.");
                    }, i = Object.create || function() {
                        function e() {}
                        return function(t) {
                            var n;
                            return e.prototype = t,
                            n = new e,
                            e.prototype = null,
                            n;
                        }
                        ;
                    }(), c = {}, u = c.lib = {}, s = u.Base = function() {
                        return {
                            extend: function(e) {
                                var t = i(this);
                                return e && t.mixIn(e),
                                t.hasOwnProperty("init") && this.init !== t.init || (t.init = function() {
                                    t.$super.init.apply(this, arguments);
                                }
                                ),
                                t.init.prototype = t,
                                t.$super = this,
                                t;
                            },
                            create: function() {
                                var e = this.extend();
                                return e.init.apply(e, arguments),
                                e;
                            },
                            init: function() {},
                            mixIn: function(e) {
                                for (var t in e)
                                    e.hasOwnProperty(t) && (this[t] = e[t]);
                                e.hasOwnProperty("toString") && (this.toString = e.toString);
                            },
                            clone: function() {
                                return this.init.prototype.extend(this);
                            }
                        };
                    }(), l = u.WordArray = s.extend({
                        init: function(e, n) {
                            e = this.words = e || [],
                            t != n ? this.sigBytes = n : this.sigBytes = 4 * e.length;
                        },
                        toString: function(e) {
                            return (e || d).stringify(this);
                        },
                        concat: function(e) {
                            var t = this.words
                              , n = e.words
                              , r = this.sigBytes
                              , a = e.sigBytes;
                            if (this.clamp(),
                            r % 4)
                                for (var o = 0; o < a; o++) {
                                    var i = n[o >>> 2] >>> 24 - o % 4 * 8 & 255;
                                    t[r + o >>> 2] |= i << 24 - (r + o) % 4 * 8;
                                }
                            else
                                for (var c = 0; c < a; c += 4)
                                    t[r + c >>> 2] = n[c >>> 2];
                            return this.sigBytes += a,
                            this;
                        },
                        clamp: function() {
                            var t = this.words
                              , n = this.sigBytes;
                            t[n >>> 2] &= 4294967295 << 32 - n % 4 * 8,
                            t.length = e.ceil(n / 4);
                        },
                        clone: function() {
                            var e = s.clone.call(this);
                            return e.words = this.words.slice(0),
                            e;
                        },
                        random: function(e) {
                            for (var t = [], n = 0; n < e; n += 4)
                                t.push(o());
                            return new l.init(t,e);
                        }
                    }), f = c.enc = {}, d = f.Hex = {
                        stringify: function(e) {
                            for (var t = e.words, n = e.sigBytes, r = [], a = 0; a < n; a++) {
                                var o = t[a >>> 2] >>> 24 - a % 4 * 8 & 255;
                                r.push((o >>> 4).toString(16)),
                                r.push((15 & o).toString(16));
                            }
                            return r.join("");
                        },
                        parse: function(e) {
                            for (var t = e.length, n = [], r = 0; r < t; r += 2)
                                n[r >>> 3] |= parseInt(e.substr(r, 2), 16) << 24 - r % 8 * 4;
                            return new l.init(n,t / 2);
                        }
                    }, p = f.Latin1 = {
                        stringify: function(e) {
                            for (var t = e.words, n = e.sigBytes, r = [], a = 0; a < n; a++) {
                                var o = t[a >>> 2] >>> 24 - a % 4 * 8 & 255;
                                r.push(String.fromCharCode(o));
                            }
                            return r.join("");
                        },
                        parse: function(e) {
                            for (var t = e.length, n = [], r = 0; r < t; r++)
                                n[r >>> 2] |= (255 & e.charCodeAt(r)) << 24 - r % 4 * 8;
                            return new l.init(n,t);
                        }
                    }, h = f.Utf8 = {
                        stringify: function(e) {
                            try {
                                return decodeURIComponent(escape(p.stringify(e)));
                            } catch (e) {
                                throw Error("Malformed UTF-8 data");
                            }
                        },
                        parse: function(e) {
                            return p.parse(unescape(encodeURIComponent(e)));
                        }
                    }, m = u.BufferedBlockAlgorithm = s.extend({
                        reset: function() {
                            this._data = new l.init,
                            this._nDataBytes = 0;
                        },
                        _append: function(e) {
                            "string" == typeof e && (e = h.parse(e)),
                            this._data.concat(e),
                            this._nDataBytes += e.sigBytes;
                        },
                        _process: function(t) {
                            var n, r = this._data, a = r.words, o = r.sigBytes, i = this.blockSize, c = o / (4 * i), u = (c = t ? e.ceil(c) : e.max((0 | c) - this._minBufferSize, 0)) * i, s = e.min(4 * u, o);
                            if (u) {
                                for (var f = 0; f < u; f += i)
                                    this._doProcessBlock(a, f);
                                n = a.splice(0, u),
                                r.sigBytes -= s;
                            }
                            return new l.init(n,s);
                        },
                        clone: function() {
                            var e = s.clone.call(this);
                            return e._data = this._data.clone(),
                            e;
                        },
                        _minBufferSize: 0
                    });
                    u.Hasher = m.extend({
                        cfg: s.extend(),
                        init: function(e) {
                            this.cfg = this.cfg.extend(e),
                            this.reset();
                        },
                        reset: function() {
                            m.reset.call(this),
                            this._doReset();
                        },
                        update: function(e) {
                            return this._append(e),
                            this._process(),
                            this;
                        },
                        finalize: function(e) {
                            return e && this._append(e),
                            this._doFinalize();
                        },
                        blockSize: 16,
                        _createHelper: function(e) {
                            return function(t, n) {
                                return new e.init(n).finalize(t);
                            }
                            ;
                        },
                        _createHmacHelper: function(e) {
                            return function(t, n) {
                                return new v.HMAC.init(e,n).finalize(t);
                            }
                            ;
                        }
                    });
                    var v = c.algo = {};
                    return c;
                }(Math);
                return e;
            });
        },

        中的_createHelper的返回。

        不过往前翻一点可以找到h和m的实例化位置：

         h = a._(n("7fb534d2")), m = a._(n("ebabf855"))

                 "7fb534d2": function(e, t, n) {
            !function(r, a) {
                "object" == typeof t ? e.exports = t = a(n("74881fee")) : a(r.CryptoJS);
            }(this, function(e) {
                return !function(t) {
                    var n = e
                      , r = n.lib
                      , a = r.WordArray
                      , o = r.Hasher
                      , i = n.algo
                      , c = []
                      , u = [];
                    !function() {
                        function e(e) {
                            for (var n = t.sqrt(e), r = 2; r <= n; r++)
                                if (!(e % r))
                                    return !1;
                            return !0;
                        }
                        function n(e) {
                            return (e - (0 | e)) * 4294967296 | 0;
                        }
                        for (var r = 2, a = 0; a < 64; )
                            e(r) && (a < 8 && (c[a] = n(t.pow(r, .5))),
                            u[a] = n(t.pow(r, 1 / 3)),
                            a++),
                            r++;
                    }();
                    var s = []
                      , l = i.SHA256 = o.extend({
                        _doReset: function() {
                            this._hash = new a.init(c.slice(0));
                        },
                        _doProcessBlock: function(e, t) {
                            for (var n = this._hash.words, r = n[0], a = n[1], o = n[2], i = n[3], c = n[4], l = n[5], f = n[6], d = n[7], p = 0; p < 64; p++) {
                                if (p < 16)
                                    s[p] = 0 | e[t + p];
                                else {
                                    var h = s[p - 15]
                                      , m = (h << 25 | h >>> 7) ^ (h << 14 | h >>> 18) ^ h >>> 3
                                      , v = s[p - 2]
                                      , b = (v << 15 | v >>> 17) ^ (v << 13 | v >>> 19) ^ v >>> 10;
                                    s[p] = m + s[p - 7] + b + s[p - 16];
                                }
                                var g = c & l ^ ~c & f
                                  , y = r & a ^ r & o ^ a & o
                                  , _ = (r << 30 | r >>> 2) ^ (r << 19 | r >>> 13) ^ (r << 10 | r >>> 22)
                                  , w = d + ((c << 26 | c >>> 6) ^ (c << 21 | c >>> 11) ^ (c << 7 | c >>> 25)) + g + u[p] + s[p]
                                  , S = _ + y;
                                d = f,
                                f = l,
                                l = c,
                                c = i + w | 0,
                                i = o,
                                o = a,
                                a = r,
                                r = w + S | 0;
                            }
                            n[0] = n[0] + r | 0,
                            n[1] = n[1] + a | 0,
                            n[2] = n[2] + o | 0,
                            n[3] = n[3] + i | 0,
                            n[4] = n[4] + c | 0,
                            n[5] = n[5] + l | 0,
                            n[6] = n[6] + f | 0,
                            n[7] = n[7] + d | 0;
                        },
                        _doFinalize: function() {
                            var e = this._data
                              , n = e.words
                              , r = 8 * this._nDataBytes
                              , a = 8 * e.sigBytes;
                            return n[a >>> 5] |= 128 << 24 - a % 32,
                            n[(a + 64 >>> 9 << 4) + 14] = t.floor(r / 4294967296),
                            n[(a + 64 >>> 9 << 4) + 15] = r,
                            e.sigBytes = 4 * n.length,
                            this._process(),
                            this._hash;
                        },
                        clone: function() {
                            var e = o.clone.call(this);
                            return e._hash = this._hash.clone(),
                            e;
                        }
                    });
                    n.SHA256 = o._createHelper(l),
                    n.HmacSHA256 = o._createHmacHelper(l);
                }(Math),
                e.SHA256;
            });
        },




        然后

               ebabf855: function(e, t, n) {
            !function(r, a, o) {
                "object" == typeof t ? e.exports = t = a(n("74881fee"), n("cdb1a314")) : a(r.CryptoJS);
            }(this, function(e) {
                return !function() {
                    var t = e
                      , n = t.lib.Hasher
                      , r = t.x64
                      , a = r.Word
                      , o = r.WordArray
                      , i = t.algo;
                    function c() {
                        return a.create.apply(a, arguments);
                    }
                    var u = [c(1116352408, 3609767458), c(1899447441, 602891725), c(3049323471, 3964484399), c(3921009573, 2173295548), c(961987163, 4081628472), c(1508970993, 3053834265), c(2453635748, 2937671579), c(2870763221, 3664609560), c(3624381080, 2734883394), c(310598401, 1164996542), c(607225278, 1323610764), c(1426881987, 3590304994), c(1925078388, 4068182383), c(2162078206, 991336113), c(2614888103, 633803317), c(3248222580, 3479774868), c(3835390401, 2666613458), c(4022224774, 944711139), c(264347078, 2341262773), c(604807628, 2007800933), c(770255983, 1495990901), c(1249150122, 1856431235), c(1555081692, 3175218132), c(1996064986, 2198950837), c(2554220882, 3999719339), c(2821834349, 766784016), c(2952996808, 2566594879), c(3210313671, 3203337956), c(3336571891, 1034457026), c(3584528711, 2466948901), c(113926993, 3758326383), c(338241895, 168717936), c(666307205, 1188179964), c(773529912, 1546045734), c(1294757372, 1522805485), c(1396182291, 2643833823), c(1695183700, 2343527390), c(1986661051, 1014477480), c(2177026350, 1206759142), c(2456956037, 344077627), c(2730485921, 1290863460), c(2820302411, 3158454273), c(3259730800, 3505952657), c(3345764771, 106217008), c(3516065817, 3606008344), c(3600352804, 1432725776), c(4094571909, 1467031594), c(275423344, 851169720), c(430227734, 3100823752), c(506948616, 1363258195), c(659060556, 3750685593), c(883997877, 3785050280), c(958139571, 3318307427), c(1322822218, 3812723403), c(1537002063, 2003034995), c(1747873779, 3602036899), c(1955562222, 1575990012), c(2024104815, 1125592928), c(2227730452, 2716904306), c(2361852424, 442776044), c(2428436474, 593698344), c(2756734187, 3733110249), c(3204031479, 2999351573), c(3329325298, 3815920427), c(3391569614, 3928383900), c(3515267271, 566280711), c(3940187606, 3454069534), c(4118630271, 4000239992), c(116418474, 1914138554), c(174292421, 2731055270), c(289380356, 3203993006), c(460393269, 320620315), c(685471733, 587496836), c(852142971, 1086792851), c(1017036298, 365543100), c(1126000580, 2618297676), c(1288033470, 3409855158), c(1501505948, 4234509866), c(1607167915, 987167468), c(1816402316, 1246189591)]
                      , s = [];
                    !function() {
                        for (var e = 0; e < 80; e++)
                            s[e] = c();
                    }();
                    var l = i.SHA512 = n.extend({
                        _doReset: function() {
                            this._hash = new o.init([new a.init(1779033703,4089235720), new a.init(3144134277,2227873595), new a.init(1013904242,4271175723), new a.init(2773480762,1595750129), new a.init(1359893119,2917565137), new a.init(2600822924,725511199), new a.init(528734635,4215389547), new a.init(1541459225,327033209)]);
                        },
                        _doProcessBlock: function(e, t) {
                            for (var n = this._hash.words, r = n[0], a = n[1], o = n[2], i = n[3], c = n[4], l = n[5], f = n[6], d = n[7], p = r.high, h = r.low, m = a.high, v = a.low, b = o.high, g = o.low, y = i.high, _ = i.low, w = c.high, S = c.low, x = l.high, E = l.low, C = f.high, M = f.low, k = d.high, O = d.low, P = p, T = h, j = m, A = v, I = b, $ = g, R = y, N = _, L = w, B = S, F = x, D = E, z = C, H = M, U = k, W = O, q = 0; q < 80; q++) {
                                var V, G, K = s[q];
                                if (q < 16)
                                    G = K.high = 0 | e[t + 2 * q],
                                    V = K.low = 0 | e[t + 2 * q + 1];
                                else {
                                    var Y = s[q - 15]
                                      , X = Y.high
                                      , Z = Y.low
                                      , J = (X >>> 1 | Z << 31) ^ (X >>> 8 | Z << 24) ^ X >>> 7
                                      , Q = (Z >>> 1 | X << 31) ^ (Z >>> 8 | X << 24) ^ (Z >>> 7 | X << 25)
                                      , ee = s[q - 2]
                                      , et = ee.high
                                      , en = ee.low
                                      , er = (et >>> 19 | en << 13) ^ (et << 3 | en >>> 29) ^ et >>> 6
                                      , ea = (en >>> 19 | et << 13) ^ (en << 3 | et >>> 29) ^ (en >>> 6 | et << 26)
                                      , eo = s[q - 7]
                                      , ei = eo.high
                                      , ec = eo.low
                                      , eu = s[q - 16]
                                      , es = eu.high
                                      , el = eu.low;
                                    G = J + ei + ((V = Q + ec) >>> 0 < Q >>> 0 ? 1 : 0),
                                    V += ea,
                                    G = G + er + (V >>> 0 < ea >>> 0 ? 1 : 0),
                                    V += el,
                                    G = G + es + (V >>> 0 < el >>> 0 ? 1 : 0),
                                    K.high = G,
                                    K.low = V;
                                }
                                var ef = L & F ^ ~L & z
                                  , ed = B & D ^ ~B & H
                                  , ep = P & j ^ P & I ^ j & I
                                  , eh = T & A ^ T & $ ^ A & $
                                  , em = (P >>> 28 | T << 4) ^ (P << 30 | T >>> 2) ^ (P << 25 | T >>> 7)
                                  , ev = (T >>> 28 | P << 4) ^ (T << 30 | P >>> 2) ^ (T << 25 | P >>> 7)
                                  , eb = (L >>> 14 | B << 18) ^ (L >>> 18 | B << 14) ^ (L << 23 | B >>> 9)
                                  , eg = (B >>> 14 | L << 18) ^ (B >>> 18 | L << 14) ^ (B << 23 | L >>> 9)
                                  , ey = u[q]
                                  , e_ = ey.high
                                  , ew = ey.low
                                  , eS = W + eg
                                  , ex = U + eb + (eS >>> 0 < W >>> 0 ? 1 : 0)
                                  , eS = eS + ed
                                  , ex = ex + ef + (eS >>> 0 < ed >>> 0 ? 1 : 0)
                                  , eS = eS + ew
                                  , ex = ex + e_ + (eS >>> 0 < ew >>> 0 ? 1 : 0)
                                  , eS = eS + V
                                  , ex = ex + G + (eS >>> 0 < V >>> 0 ? 1 : 0)
                                  , eE = ev + eh
                                  , eC = em + ep + (eE >>> 0 < ev >>> 0 ? 1 : 0);
                                U = z,
                                W = H,
                                z = F,
                                H = D,
                                F = L,
                                D = B,
                                L = R + ex + ((B = N + eS | 0) >>> 0 < N >>> 0 ? 1 : 0) | 0,
                                R = I,
                                N = $,
                                I = j,
                                $ = A,
                                j = P,
                                A = T,
                                P = ex + eC + ((T = eS + eE | 0) >>> 0 < eS >>> 0 ? 1 : 0) | 0;
                            }
                            h = r.low = h + T,
                            r.high = p + P + (h >>> 0 < T >>> 0 ? 1 : 0),
                            v = a.low = v + A,
                            a.high = m + j + (v >>> 0 < A >>> 0 ? 1 : 0),
                            g = o.low = g + $,
                            o.high = b + I + (g >>> 0 < $ >>> 0 ? 1 : 0),
                            _ = i.low = _ + N,
                            i.high = y + R + (_ >>> 0 < N >>> 0 ? 1 : 0),
                            S = c.low = S + B,
                            c.high = w + L + (S >>> 0 < B >>> 0 ? 1 : 0),
                            E = l.low = E + D,
                            l.high = x + F + (E >>> 0 < D >>> 0 ? 1 : 0),
                            M = f.low = M + H,
                            f.high = C + z + (M >>> 0 < H >>> 0 ? 1 : 0),
                            O = d.low = O + W,
                            d.high = k + U + (O >>> 0 < W >>> 0 ? 1 : 0);
                        },
                        _doFinalize: function() {
                            var e = this._data
                              , t = e.words
                              , n = 8 * this._nDataBytes
                              , r = 8 * e.sigBytes;
                            return t[r >>> 5] |= 128 << 24 - r % 32,
                            t[(r + 128 >>> 10 << 5) + 30] = Math.floor(n / 4294967296),
                            t[(r + 128 >>> 10 << 5) + 31] = n,
                            e.sigBytes = 4 * t.length,
                            this._process(),
                            this._hash.toX32();
                        },
                        clone: function() {
                            var e = n.clone.call(this);
                            return e._hash = this._hash.clone(),
                            e;
                        },
                        blockSize: 32
                    });
                    t.SHA512 = n._createHelper(l),
                    t.HmacSHA512 = n._createHmacHelper(l);
                }(),
                e.SHA512;
            });
        },

所以：

              , I = e => {
                let {appCode: t, bodyString: n, rand: r, timestamp: a, url: o} = e
                  , i = "$4holys**t"
                  , c = (SHA256)(n).toString();
                return (SHA512)(i + t + c + r.substring(3, 11) + a + o).toString();
            }




            ===========

Update：孩子们，实测下来，alt.zju.edu.cn根本没有做CSRF防护，根本不检测这几个参数。
            */