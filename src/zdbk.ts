import fetchWithCookie, { createCookieJar } from "./utils/fetch-utils";
import type { ZJUAM } from "./zjuam";
import { CookieJar } from "./utils/cookie-jar";

class ZDBK {
  // the only used Cookie is "JSESSIONPREJSDM" and "route".

  zjuamInstance: ZJUAM;
  cookiesJar: CookieJar;
  logedIn: boolean = false;
  constructor(am: ZJUAM) {
    this.zjuamInstance = am;
    this.cookiesJar = createCookieJar();
  }
  async login() {
    await fetchWithCookie(
      "https://zdbk.zju.edu.cn/jwglxt/xtgl/login_cxSsoLoginUrl.html",
      { method: "POST" },
      this.cookiesJar
    );

    const loginCB = await this.zjuamInstance.loginSvc(
      "https://zdbk.zju.edu.cn/jwglxt/xtgl/login_ssologin.html"
    );

    const res = await fetchWithCookie(loginCB, { redirect: "manual" }, this.cookiesJar);

    if (res.status !== 302)
      throw new Error("Login failed, status code is " + res.status);
    if (
      !res.headers
        .get("Location")
        ?.includes("https://zdbk.zju.edu.cn/jwglxt/xtgl/index_initMenu.html")
    ) {
      throw new Error(
        "Login failed, redirect to unexpected url " +
          res.headers.get("Location")
      );
    }
    return true;
  }

  async fetch(url: string, init?: RequestInit) {
    if (!this.logedIn) await this.login().then((v) => (this.logedIn = v));
    return fetchWithCookie(
      url,
      {
        ...init,
        headers: {
          ...init?.headers,
        },
      },
      this.cookiesJar
    );
  }
}

export { ZDBK };
