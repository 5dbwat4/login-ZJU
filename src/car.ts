import type { ZJUAM } from "./zjuam.js";


class CAR {
  token: string = "";
  zjuamInstance: ZJUAM;
  constructor(am: ZJUAM) {
    this.zjuamInstance = am;
  }
  async login() {
    console.log("[CAR] login begins");
    return this.zjuamInstance
      .loginSvc_oauth2("https://zjuam.zju.edu.cn/cas/oauth2.0/authorize?response_type=code&client_id=NgRUUG0GFEOUjsV3Vc&redirect_uri=http://car.zju.edu.cn/pages/index/login ")
      .then((callbackURL) => {
        
        const ticket = callbackURL.split("code=")[1];
        
        return fetch(
          `http://car.zju.edu.cn/platform/weChat/zdLoginCode`,
          {
            method:"POST",
            body:"code="+ticket,
            headers:{
                "Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"
            }
          }
        );
      })
      .then((r) => r.json())
      .then((r) => {
        // console.log(r);
        if (r.success === 0) {
          console.log("[CAR] login success");
          this.token = r.data.accessToken;
          return true;
        }
      })
      .catch((e) => {
        throw e;
      });
  }

  async fetch(url: string,options: Object): Promise<Response> {
    if (this.token === "") {
      await this.login();
    }
    try {
        console.log("[CAR] Fetching "+url);
        
      const res = await fetch(url!, {
        headers: {
            Authorization: "bearer "+this.token,
        },
        ...options
      });
      if (res.status === 200) {
        return res;
      } else {
        if (res.status === 401 || res.status === 403) {
          this.token = "";
          return this.fetch(url,options);
        }
        throw new Error(`Request failed with status ${res.status}`);
      }
    } catch (error) {
      console.error("Fetch error:", error);

      throw error;
    }
  }
}

export { CAR };
