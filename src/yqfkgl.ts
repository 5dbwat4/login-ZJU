import type { ZJUAM } from "./zjuam.js";
import fetchWithCookie,{createCookieJar} from "./utils/fetch-utils.js";

// https://yqfkgl.zju.edu.cn/_web/_customizes/ykt/index3.jsp 校园卡二维码服务

class YQFKGL {
  #zjuamInstance: ZJUAM;
  #cookieJar = createCookieJar();
  #firstTime: boolean = true;
  constructor(am: ZJUAM) {
    this.#zjuamInstance = am;
  }

  async login() {
    const serviceURL = "https://yqfkgl.zju.edu.cn/_web/_customizes/ykt/index3.jsp";
    console.log("[YQFKGL] login begins");
    await fetchWithCookie(serviceURL,{redirect: "manual"},this.#cookieJar);
    const redirect = await this.#zjuamInstance.loginSvc(serviceURL).catch(console.log);
    if(!redirect) throw new Error("[YQFKGL] loginSvc failed");
    console.log("[YQFKGL] Redirecting to ZJUAM for authentication:", redirect);
    await fetchWithCookie(redirect,{redirect: "manual"},this.#cookieJar);
    this.#firstTime = false;
    console.log("[YQFKGL] login finished");
  }
  async fetch(url: string, options: any = {}): Promise<Response> {
    if (this.#firstTime) {
      await this.login();
    }
    return fetchWithCookie(url, options, this.#cookieJar);
  }
}

export { YQFKGL };
