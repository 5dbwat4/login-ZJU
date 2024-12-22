import type { ZJUAM } from "./zjuam";
import fetchWithCookie from "./utils/fetch-with-cookie";

class YQFKGL {
  //我也不知道是什么，反正校园卡二维码用的就是这个
  zjuamInstance: ZJUAM;
  constructor(am: ZJUAM) {
    this.zjuamInstance = am;
  }

  async login() {
    console.log("[YQFKGL] login begins");

    return fetchWithCookie(
      "https://yqfkgl.zju.edu.cn/_web/_customizes/ykt/index3.jsp",
      {
        redirect: "manual",
      }
    )
      .then((response) => {
        if (response.status === 302) {
          // return response.headers.get("location");

          return this.zjuamInstance.loginSvc(
            "https://yqfkgl.zju.edu.cn/_web/_customizes/ykt/index3.jsp"
          );
        }
      })
      .then((callbackURL) => {
        return fetchWithCookie(callbackURL!, {
          redirect: "manual",
        });
      })
      .then((response) => {
        if (response.status === 302) {
          if (
            response.headers.get("location") ===
            "https://yqfkgl.zju.edu.cn/_web/_customizes/ykt/index3.jsp"
          ) {
            console.log("[YQFKGL] login success");
            return true;
          }
        }
      });
  }
}

export { YQFKGL };
