
import type { ZJUAM } from "./zjuam";

class ZDBK {
  // the only used Cookie is "JSESSIONPREJSDM" and "route".

  zjuamInstance: ZJUAM;
  cookies: { [key: string]: string };
  constructor(am: ZJUAM) {
    this.zjuamInstance = am;
    this.cookies = {};
  }
  async login() {
    const callbackURL = await this.zjuamInstance.loginSvc(
      "http://zdbk.zju.edu.cn/jwglxt/xtgl/login_ssologin.html"
    );

    // console.log("callback:",callbackURL);

    // It is OK to call it directly.
    fetch(callbackURL, {
      redirect: "manual",
    }).then((res) => {
    //   console.log(res.status);
    //   console.log(res.headers.getSetCookie());
      res.headers.getSetCookie().forEach((cookieStr) => {
        if(cookieStr.includes("Path=/javajw;"))return;
        const [key, value] = cookieStr.split(";")[0].split("=");
        this.cookies[key] = value;
      });
    //   console.log(this.cookies);
      

      if (
        res.status == 302 &&
        res.headers
          .get("Location")
          ?.includes("http://zdbk.zju.edu.cn/jwglxt/xtgl/index_initMenu.html")
      ) {
        fetch(res.headers.get("Location")!, {
          redirect: "manual",
          headers: {
            Cookie: Object.entries(this.cookies)
              .map(([key, value]) => `${key}=${value}`)
              .join("; "),
          },
        }).then((res) => {
            res.headers.getSetCookie().forEach((cookieStr) => {
                const [key, value] = cookieStr.split(";")[0].split("=");
                this.cookies[key] = value;
              });
        //   console.log(res.status);
        //   console.log(res.headers);
        });
      }
    });
  }
}

export { ZDBK };
