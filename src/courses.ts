import fetchWithCookie from "./utils/fetch-with-cookie";
import type { ZJUAM } from "./zjuam";

class COURSES {
  zjuamInstance: ZJUAM;
  // cookies: { [key: string]: string };
  session: string="";
  firstTime: boolean = true;
  constructor(am: ZJUAM) {
    this.zjuamInstance = am;
    // this.cookies = {};
  }

  async login() {
    console.log("[COURSES] login begins");
    
    return fetchWithCookie("https://courses.zju.edu.cn/user/index", {
        redirect: "manual",
      })
      .then((res) => {
        // console.log(res.status);
        // console.log(res.headers.getSetCookie());
        // console.log(res.headers.get("Location"));
        if (res.status == 302) {
          return fetchWithCookie(res.headers.get("Location")!, {//something like https://identity.zju.edu.cn/auth/realms/zju/protocol/cas/login?ui_locales=zh-CN&service=https%3A//courses.zju.edu.cn/user/index&locale=zh_CN&ts=1733590703.188173
            redirect: "manual",
          });
        } else {
          throw new Error("Fail at first load.");
        }
      })
      .then((res) => {
        // console.log(res.status);
        // console.log(res.headers.getSetCookie());
        // console.log(res.headers.get("Location"));
        if (res.status == 303) {
          return fetchWithCookie(res.headers.get("Location")!, {// something like https://identity.zju.edu.cn/auth/realms/zju/broker/cas-client/login?session_code=wWtmnw71c1-D_TPo_MSPJrAKgVqEjlqjs9mmChLt4Bs&client_id=TronClass&tab_id=qpB9in-Du-c
             
            redirect: "manual",
          });
        } else {
          throw new Error("Fail at first load.");
        }
      })
      .then(async (res) => {
        // console.log(res.status);
        // console.log(res.headers.getSetCookie());
        // console.log(res.headers.get("Location"));
        if(res.status == 303){
          const callbackUrl = await this.zjuamInstance.loginSvc(decodeURIComponent(res.headers.get("Location")!.replace("https://zjuam.zju.edu.cn/cas/login?service=","")));
          return fetchWithCookie(callbackUrl, {
            redirect: "manual",
          });
        }else{
          throw new Error("Fail at first load.");
        }
      })
      .then((res) => {
        // console.log(res.status);
        // console.log(res.headers.getSetCookie());
        // console.log(res.headers.get("Location"));
        if (res.status == 302) {
          return fetchWithCookie(res.headers.get("Location")!, { // something like https://courses.zju.edu.cn/user/index?ticket=
            redirect: "manual",
          });
        } else {
          throw new Error("Fail at first load.");
        }
      })
      .then((res) => {
        // console.log(res.status);
        // console.log(res.headers.getSetCookie());
        // console.log(res.headers.get("Location"));
        if (res.status == 302) { // Here we are to : https://courses.zju.edu.cn/user/index
          console.log("[COURSES] Login success!");
          // this.cookies = res.headers.getSetCookie();
          this.session = res.headers.get("Set-Cookie")!.split(";")[0].split("=")[1];
          // console.log(this.session);
          
          return true;
        } else {
          throw new Error("Fail at login.");
        }
      })

  }

  async fetch(url: string, options: any = {}): Promise<any> {
    if (this.firstTime) {
      await this.login();
      this.firstTime = false;
    }
    // console.log("Login finished.",this.firstTime,this.session);

    console.log("[COURSES] Fetching url:", url);
    
    
    options.headers = {
      ...options?.headers,
      "Cookie": "session=" + this.session+";",
      "x-session-id": this.session,
    };
    return fetch(url, options).then(res=>{
      // console.log(res.status);
      // console.log(res.headers);
      // console.log(res.headers.get("Location"));
      //Update session
      if(res.headers.get("Set-Cookie")){
        const session = res.headers.get("Set-Cookie")!.split(";")[0].split("=")[1];
        if(session!== this.session){
          this.session = session;
          // console.log("Session updated:",this.session);
        }
      }
      return res;
    });

  }
}

export { COURSES };
