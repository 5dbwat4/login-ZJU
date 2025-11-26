import { rsaEncrypt } from "./utils/RSA";
import fetchWithCookie, { createCookieJar } from "./utils/fetch-utils";

const pubkey_url = "https://zjuam.zju.edu.cn/cas/v2/getPubKey";

class ZJUAM {
  #username: string;
  #password: string;
  #jar = createCookieJar();
  #firstinLogin: boolean = false;

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

  login() {
    return this.#_login("https://zjuam.zju.edu.cn/cas/login");
  }

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
