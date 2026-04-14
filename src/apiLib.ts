// 请注意：http://m.lib.zju.edu.cn/ 浙大移动图书馆的API全是发到api.lib.zju.edu.cn的，如果测移动图书馆的API，用apiLib。

// api.lib.zju.edu.cn和booking.lib.zju.edu.cn的API鉴权方式是不一样的。




import type { ZJUAM } from "./zjuam.js";

const OAuthURL = "https://zjuam.zju.edu.cn/cas/oauth2.0/authorize?response_type=code&client_id=EcZUPTTg7zcD6FpFPn&redirect_uri=http://m.lib.zju.edu.cn/pages/wechat/auth"

class APILIB {
  #zjuamInstance: ZJUAM;
  #token: string="";
  #firstTime: boolean = true;
  bor_id: string="";
  constructor(am: ZJUAM) {
    this.#zjuamInstance = am;
  }

  async login() {
    console.log("[booking.lib] login begins");

    let redirectURL = await this.#zjuamInstance.loginSvc_oauth2(OAuthURL)

    console.log("[booking.lib] Returned from ZJUAM, finalizing login at:", redirectURL);

    const code = redirectURL.match(/code=([^&]+)/)?.[1];

    if(!code) {
      console.error("[booking.lib] Failed to get code from redirect URL:", redirectURL);
      throw new Error("Login failed");
    }
    
    const token = await fetch("http://api.lib.zju.edu.cn/moblib/binduni",{
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code, openid:"" }),
    }).then(v=>v.json()).then(data=>{
        this.bor_id = data?.data?.tlv_bor_id || "";
      return data?.data?.token;
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
      ...options?.headers,
      "Authorization": this.#token,
    };
    return fetch(url, options);

  }
}

export { APILIB };


/**

部分信息需要用到bor_id这个信息，可以通过apilib.bor_id来获取。

测试了一下，{ statuscode: 500, message: '请勿操作他人数据！', data: [] }

然后一些接口bor_id是必携带的，不携带的话不会自动从jwt中获取。

 */