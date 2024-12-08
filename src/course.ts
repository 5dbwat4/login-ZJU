// 学在浙大 course.zju.edu.cn

import type { ZJUAM } from "./zjuam";

class COURSE {
  zjuamInstance: ZJUAM;
  cookies: { [key: string]: string };
  constructor(am: ZJUAM, mode: "WEB" | "APP") {
    this.zjuamInstance = am;
    this.cookies = {};
  }
  token: string = "";
  session: string;

  async login() {
    const callbackURL = await this.zjuamInstance.loginSvc(
      "https://course.zju.edu.cn/ua/login?platform=WEB"
    );

    console.log(callbackURL);

    await fetch(callbackURL, {
      redirect: "manual",
    })
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
