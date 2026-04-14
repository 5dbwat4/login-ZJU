import { rsaEncrypt } from "./utils/RSA.js";
import fetchWithCookie, { createCookieJar } from "./utils/fetch-utils.js";

const pubkey_url = "https://zjuam.zju.edu.cn/cas/v2/getPubKey";

class ZJUAM {
  #username: string;
  #password: string;
  #jar = createCookieJar();
  #firstinLogin: boolean = false;

  /**
   * The constructor for ZJUAM class.
   * @param username ZJU Username
   * @param password ZJU Password
   */
  constructor(username: string, password: string) {
    this.#username = username;
    this.#password = password;
  }

  async #_login(login_url: string): Promise<string> {
    console.log("[ZJUAM] Attempting to login to ZJUAM.");

    // get login page and let fetchWithCookie populate the jar
    let login_html: string;
    try {
      login_html = await fetchWithCookie(login_url, undefined, this.#jar).then((res) => res.text());
    } catch (e) {
      return Promise.reject({ message: "Failed when fetch login page at first time." });
    }

    const execution = login_html.match(/name="execution" value="([^"]+)"/)?.[1] ?? "";
    if (!execution) {
      return Promise.reject({ message: "First-time login page doesn't contain execution string." });
    }

    // fetch pubkey (jar cookies will be sent automatically)
    let pubkey: { modulus: string; exponent: string };
    try {
      pubkey = await fetchWithCookie(pubkey_url, undefined, this.#jar).then((res) => res.json());
    } catch (e) {
      return Promise.reject({ message: "Failed when fetch pubkey." });
    }

    const key = rsaEncrypt(this.#password, pubkey.exponent, pubkey.modulus);

    // perform login POST
    const body = [
      "username=" + this.#username,
      "password=" + key,
      "execution=" + execution,
      "_eventId=" + "submit",
      "authcode=",
    ].join("&");

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
    };

    try {
      const res = await fetchWithCookie(login_url, { method: "POST", body, headers, redirect: "manual" }, this.#jar);
      if (res.status === 302) {
        this.#firstinLogin = true;
        console.log("[ZJUAM] Login success.");
        return res.headers.get("Location") as string;
      } else if (res.status === 200) {
        const text = await res.text();
        const message = text.match(/<span id="msg">([^<]+)<\/span>/)?.[1];
        return Promise.reject({ message: "Failed to login: " + message });
      } else {
        return Promise.reject({ message: "Failed to login with status code " + res.status });
      }
    } catch (e) {
      return Promise.reject({ message: "Failed when posting login." });
    }
  }

  /**
   * Login to ZJUAM.
   * @returns Promise that may resolve or reject
   */
  login() {
    return this.#_login("https://zjuam.zju.edu.cn/cas/login");
  }

  /**
   * fetch wrapper for ZJUAM, it will automatically login if not logged in.
   * @param url This defines the resource that you wish to fetch.
   * @param init A RequestInit object containing any custom settings that you want to apply to the request.
   * @returns A Promise that resolves to a Response object.
   */
  async fetch(url: string, options: RequestInit = {}) {
    if (!this.#firstinLogin) {
      await this.login().catch((e) => {
        console.error(e);
      });
    }

    const headers = {
      ...(options.headers || {}),
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
    };

    return fetchWithCookie(url, { ...options, headers }, this.#jar);
  }

  /**
   * Login to a service using ZJUAM.
   * @param service The URL of the service, e.g. "https://zdbk.zju.edu.cn/jwglxt/xtgl/login_ssologin.html" for ZDBK. Do not include the "https://zjuam.zju.edu.cn/cas/login?service=" part, just the URL.
   * @returns Promise that may resolve or reject
   */
  async loginSvc(service: string): Promise<string> {
    console.log("[ZJUAM] Attempting to login to service: " + service);

    const fullLoginStr = "https://zjuam.zju.edu.cn/cas/login?service=" + encodeURIComponent(service);
    if (this.#firstinLogin) {
      const res = await this.fetch(fullLoginStr, { redirect: "manual", method: "GET" });
      console.log("loginSvc,", res.status, res.headers.get("Location"));
      if (res.status === 302) {
        return res.headers.get("Location") as string;
      } else if (res.status === 200) {
        return this.#_login(fullLoginStr);
      }
      return Promise.reject({ message: "Login failed with status " + res.status });
    } else {
      return this.#_login(fullLoginStr);
    }
  }

  /**
   * Login to an OAuth2 service using ZJUAM.
   * @param redirectUrl The URL of FULL PATH. e.g. "https://zjuam.zju.edu.cn/cas/oauth2.0/authorize?response_type=code&client_id=EcZUPTTg7zcD6FpFPn&redirect_uri=http://m.lib.zju.edu.cn/pages/wechat/auth". For now we only support the full URL, and further we will suport client_id+redirect_uri style parameters.
   * @returns Promise that may resolve or reject
   */
  async loginSvc_oauth2(redirectUrl: string): Promise<string> {
    console.log("[ZJUAM] Attempting to login to oauth2 service: " + redirectUrl);
    // const res = await this.fetch(redirectUrl, { redirect: "manual", method: "GET" });
    // console.log("loginSvc_oauth2,", res.status, res.headers.get("Location"));
    let currentURL = redirectUrl;

    while(new URL(currentURL).hostname === "zjuam.zju.edu.cn"){
      console.log("[ZJUAM] Redirect:", currentURL);
      const res = await this.fetch(currentURL, { redirect: "manual", method: "GET" });
      currentURL = res.headers.get("Location")!;
    }
    return currentURL;
  }
}
export { ZJUAM };
