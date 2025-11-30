import fetchWithCookie, { createCookieJar } from "./utils/fetch-utils.js"
import type { ZJUAM } from "./zjuam.js";

class CLASSROOM {
  #zjuamInstance: ZJUAM;
  #token = "";
  #jar = createCookieJar();
  #firsttime = true;
  constructor(am: ZJUAM) {
    this.#zjuamInstance = am;
  }

  async login() {
    console.log(
      "[CLASSROOM] Attempting to login to classroom.zju.edu.cn"
    );

    let currentURL = "https://tgmedia.cmc.zju.edu.cn/index.php?r=auth%2Flogin&forward=https%3A%2F%2Fclassroom.zju.edu.cn%2F";

    while(new URL(currentURL).hostname !== "zjuam.zju.edu.cn"){
      console.log("[CLASSROOM] Redirect:", currentURL);
      const res = await fetchWithCookie(currentURL, { redirect: "manual" }, this.#jar);
      currentURL = res.headers.get("Location")!;
    }

    console.log("[CLASSROOM] Redirected to ZJUAM for authentication:", currentURL);

    currentURL = await this.#zjuamInstance.loginSvc_oauth2(currentURL);

    console.log("[CLASSROOM] Returned from ZJUAM, finalizing login at:", currentURL);

    while(true){
      console.log("[CLASSROOM] Redirect:", currentURL);
      const res = await fetchWithCookie(currentURL, { redirect: "manual" }, this.#jar);
      const content = await res.text();
      if(res.status == 200 && content.includes("meta http-equiv=\"refresh\"")){
        currentURL =  content.match(/meta http-equiv="refresh" content="0;URL=([^"]+)"/)![1];
        continue;
      }
      if(!(res.status >= 300 && res.status < 400)) break;
      currentURL = res.headers.get("Location")!;
    }

    this.#firsttime = false;


      return;
  }

  async fetch(url: string, options: RequestInit = {}) {
    if (this.#firsttime) {
      await this.login();
    }
    console.log("[CLASSROOM] Fetching:", url);
    // console.log("[CLASSROOM] Cookies:", this.session.allCookies);

    const headers = {
      ...options.headers,
      // Authorization: `Bearer ${this.#token}`,
    };

    return fetchWithCookie(url, { ...options, headers }, this.#jar);
  }
}

export { CLASSROOM };
