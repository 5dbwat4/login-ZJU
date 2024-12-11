import type { ZJUAM } from "./zjuam";

const service = "https://form.zju.edu.cn/";

class FORM {
  token: string = "";
  zjuamInstance: ZJUAM;
  constructor(am: ZJUAM) {
    this.zjuamInstance = am;
  }
  async login() {
    console.log("[FORM] login begins");
    return this.zjuamInstance
      .loginSvc(service)
      .then((callbackURL) => {
        const ticket = callbackURL.split("ticket=")[1].split("&")[0];
        return fetch(
          `https://form.zju.edu.cn/dfi/validateLogin?ticket=${ticket}&service=${encodeURIComponent(
            service
          )}`
        );
      })
      .then((r) => r.json())
      .then((r) => {
        // console.log(r);
        if (r.code === 2000) {
          console.log("[FORM] login success");
          this.token = r.data.token;
          return true;
        }
      })
      .catch((e) => {
        throw e;
      });
  }

  async fetch(url: string): Promise<Response> {
    if (this.token === "") {
      await this.login();
    }
    try {
      const res = await fetch(url!, {
        headers: {
            authentication: this.token,
        },
      });
      if (res.status === 200) {
        return res;
      } else {
        if (res.status === 401 || res.status === 403) {
          this.token = "";
          return this.fetch(url);
        }
        throw new Error(`Request failed with status ${res.status}`);
      }
    } catch (error) {
      console.error("Fetch error:", error);

      throw error;
    }
  }
}

export { FORM };
