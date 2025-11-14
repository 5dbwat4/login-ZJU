import type { ZJUAM } from "./zjuam";
import crypto from "crypto";

const service = "https://form.zju.edu.cn/";

const toBase64 = (str: string) => {
  return Buffer.from(str).toString("base64");
}

const toMD5 = (str: string) => {
  return crypto.createHash("md5").update(str);
}

const HardcodedKey = "74102f635c6d4b22b270239bc1e84f50"; // md5("zntb666666666666")

const form_encode = (data: string) => {
  const cipher = crypto.createCipheriv("aes-128-ecb", Buffer.from(HardcodedKey, "hex"), null);
  let encrypted = cipher.update(data, "utf8", "base64");
  encrypted += cipher.final("base64");
  
  return toBase64(encrypted);
}

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
          `https://form.zju.edu.cn/dfi/validateLogin?ticket=${form_encode(ticket)}&service=${encodeURIComponent(
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
        }else{
          throw new Error("[FORM] login failed",r);
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
