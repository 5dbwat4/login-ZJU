import fetchWithCookie, { createCookieJar } from "./utils/fetch-utils";
import type { ZJUAM } from "./zjuam";

class COURSES {
  #zjuamInstance: ZJUAM;
  // cookies: { [key: string]: string };
  #session: string="";
  #firstTime: boolean = true;
  #jar = createCookieJar();
  constructor(am: ZJUAM) {
    this.#zjuamInstance = am;
    // this.cookies = {};
  }

  async login() {
    console.log("[COURSES] login begins");

    let currentURL = "https://courses.zju.edu.cn/user/index";

    while(new URL(currentURL).hostname !== "zjuam.zju.edu.cn"){
      console.log("[COURSES] Redirect:", currentURL);
      const res = await fetchWithCookie(currentURL, { redirect: "manual" }, this.#jar);
      currentURL = res.headers.get("Location")!;
    }
    console.log("[COURSES] Redirected to ZJUAM for authentication:", currentURL);

    currentURL = await this.#zjuamInstance.loginSvc(new URL(currentURL).searchParams.get("service") || "")

    console.log("[COURSES] Returned from ZJUAM, finalizing login at:", currentURL);

    const res =  await fetchWithCookie(currentURL, { redirect: "manual" }, this.#jar);

    while(true){
      console.log("[COURSES] Redirect:", currentURL);
      const res = await fetchWithCookie(currentURL, { redirect: "manual" }, this.#jar);
      // console.log(res.status);
      // console.log(res.headers);
      // console.log(await res.text());
      const content = await res.text();
      if(res.status == 200 && content.includes("meta http-equiv=\"refresh\"")){
        currentURL =  content.match(/meta http-equiv="refresh" content="0;URL=([^"]+)"/)![1];
        continue;
      }
      if(!(res.status >= 300 && res.status < 400)) break;
      currentURL = res.headers.get("Location")!;
    }

    console.log("[COURSES] Login finalized.");

    return true;

  }

  async fetch(url: string, options: any = {}): Promise<Response> {
    if (this.#firstTime) {
      await this.login();
      this.#firstTime = false;
    }

    console.log("[COURSES] Fetching url:", url);
    
    
    options.headers = {
      ...options?.headers,
    };
    return fetchWithCookie(url, options, this.#jar);

  }
}

export { COURSES };
