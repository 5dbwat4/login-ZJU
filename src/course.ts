// 学在浙大 course.zju.edu.cn

import type { ZJUAM } from "./zjuam";
import fetchWithCookie, { createCookieJar } from "./utils/fetch-utils";

class COURSE {
  zjuamInstance: ZJUAM;
  cookieJar = createCookieJar();
  token = "";
  constructor(am: ZJUAM, mode: "WEB" | "APP") {
    this.zjuamInstance = am;
  }

  async login() {
    console.log("[COURSE] login begins");
    const callbackURL = await this.zjuamInstance.loginSvc(
      "https://course.zju.edu.cn/ua/login?platform=WEB"
    );



    await fetch(callbackURL, {
      redirect: "manual",
    }, this.cookieJar)
      .then((res) => {
        console.log(res.status);
        console.log(res.headers.getSetCookie());
        res.headers.getSetCookie().forEach((cookieStr) => {
          const [key, value] = cookieStr.split(";")[0].split("=");
          this.cookies[key] = value;
        });
        return res.headers.get("Location");
      })
      .then((location) => {
        return fetch(location!, {
          redirect: "manual",
          headers: {
            Cookie: Object.entries(this.cookies)
              .map(([key, value]) => `${key}=${value}`)
              .join("; "),
          },
        });
      })
      .then((res) => {
        console.log(res.status);
        console.log(res.headers.getSetCookie());
        // res.headers.getSetCookie().forEach((cookieStr) => {
        //     const [key, value] = cookieStr.split(";")[0].split("=");
        //     this.cookies[key] = value;
        // });
        console.log(res.headers.get("Location"));
        this.token = new URL(res.headers.get("Location")!).searchParams.get(
          "token"
        ) as string;
        // console.log(this.token);
        return fetch(res.headers.get("Location")!, {});
      })
      .then((res) => {
        console.log(res.status);
        console.log(res.headers.getSetCookie());
        // res.headers.getSetCookie().forEach((cookieStr) => {
        //     const [key, value] = cookieStr.split(";")[0].split("=");
        //     this.cookies[key] = value;
        // });
        console.log(res.headers.get("Location"));
      });
  }
}

export { COURSE };
