// 请注意：https://booking.lib.zju.edu.cn/ 浙江大学图书馆预约平台

// api.lib.zju.edu.cn和booking.lib.zju.edu.cn的API鉴权方式是不一样的。

import type { ZJUAM } from "./zjuam.js";
import fetchWithCookie, { createCookieJar } from "./utils/fetch-utils.js";

const service = "https://booking.lib.zju.edu.cn/api/cas/cas";
const finalPattern =
  /https\:\/\/booking\.lib\.zju\.edu\.cn\/h5\/index\.html#\/cas\/\?cas=([^&]+)/;


class BOOKINGLIB {
  #zjuamInstance: ZJUAM;
  #token: string="";
  #firstTime: boolean = true;
  #jar = createCookieJar();
  constructor(am: ZJUAM) {
    this.#zjuamInstance = am;
  }

  async login() {
    console.log("[booking.lib] login begins");

    let currentURL = await this.#zjuamInstance.loginSvc(service)

    console.log("[booking.lib] Returned from ZJUAM, finalizing login at:", currentURL);

    const cas_n:string = await (async()=>{
      while(true){
        console.log("[booking.lib] Redirect:", currentURL);
        const res = await fetchWithCookie(currentURL, { redirect: "manual" }, this.#jar);
        if(!(res.status >= 300 && res.status < 400)) throw new Error("[booking.lib] Unexpected response during login, status code: " + res.status);
        currentURL = res.headers.get("Location")!;
        if(finalPattern.test(currentURL)){
          return currentURL.match(finalPattern)![1];
        }
      }
    })().catch(console.error) as string;

    const token = await fetch("https://booking.lib.zju.edu.cn/api/cas/user",{
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cas: cas_n }),
    }).then(v=>v.json()).then(data=>{
      return data?.member?.token;
    }).catch(err=>{
      console.error("[booking.lib] Failed to get token at cas verification step:", err);
      throw new Error("Login failed");
    });

    if(!token) {
      console.error("[booking.lib] Failed to get token at cas verification step, response does not contain token.");
      throw new Error("Login failed");
    }
    this.#token = token;



    console.log("[booking.lib] Login finalized.");

    return true;

  }

  async fetch(url: string, options: any = {}): Promise<Response> {
    if (this.#firstTime) {
      await this.login();
      this.#firstTime = false;
    }

    console.log("[booking.lib] Fetching url:", url);
    
    
    options.headers = {
      "Content-Type": "application/json",
      ...options?.headers,
      "Authorization": `bearer${this.#token}`,
      /*
        This is not typo. it is 'bearer' without space.
      */
    };
    return fetch(url, options);

  }
}

export { BOOKINGLIB };



/*

关于参数。


页面上所有请求都是POST，都在body中携带了authorization: "bearereyJ0..."字段。

目前实验出来：

1. 用GET请求，携带Authorization头是可行的。
2. 有参数的话，将POST参数放在query中是可行的，例如https://booking.lib.zju.edu.cn/api/Space/often?type=1 是可行的。
3. 把authorization参数删掉也是行的

如果删掉Authorization header，上述3中方案均是不行的（显然），{ code: 10001, msg: '您尚未登录' }

4. 如果把Header中的Authorization删掉，所有方案都是不行的。

然后我们默认添加了{Content-Type: application/json}这个Header，如果不添加POST body识别会出问题。但是你可以通过options.headers覆盖掉它。

*/