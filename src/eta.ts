// eta.zju.edu.cn平台

import { CookieAccessInfo } from "./utils/cookie-jar.js";
import fetchWithCookie, { createCookieJar } from "./utils/fetch-utils.js";
import type { ZJUAM } from "./zjuam.js";
import crypto from "crypto";

const codec = {
    encode: (s: string) => {
        const keyStr = "0123456789ABCDEF";
        const key = Buffer.from(keyStr, "utf8");
        const iv = key;
        const block = 16;
        const buf = Buffer.from(s, "utf8");
        const padLen = block - (buf.length % block);
        const padded = Buffer.concat([buf, Buffer.alloc(padLen, 0)]);
        const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
        cipher.setAutoPadding(false);
        const encrypted = Buffer.concat([cipher.update(padded), cipher.final()]);
        return encrypted.toString("base64");
    },
    decode: (s: string) => {
        const keyStr = "0123456789ABCDEF";
        const key = Buffer.from(keyStr, "utf8");
        const iv = key;
        const encrypted = Buffer.from(s, "base64");
        const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
        decipher.setAutoPadding(false);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        // remove padding zeros
        let end = decrypted.length;
        while (end > 0 && decrypted[end - 1] === 0) {
            end--;
        }
        return decrypted.slice(0, end).toString("utf8");
    }
}

class ETA {
  #zjuamInstance: ZJUAM;
  #xcsrfToken: string = "";
  #firstTime: boolean = true;
  #jar = createCookieJar();
  encode = codec.encode;
  decode = codec.decode;
  constructor(am: ZJUAM) {
    this.#zjuamInstance = am;
    // this.cookies = {};
  }

  async login() {
    console.log("[ETA] login begins");
    const rl = await this.#zjuamInstance.loginSvc(
      "http://eta.zju.edu.cn/zftal-xgxt-web/teacher/xtgl/index/check.zf"
    );
    console.log("[ETA] Returned from ZJUAM, finalizing login at:", rl);
    let currentURL = rl;
    while (true) {
      console.log("[COURSES] Redirect:", currentURL);
      const res = await fetchWithCookie(
        currentURL,
        { redirect: "manual" },
        this.#jar
      );
      if (!(res.status >= 300 && res.status < 400)) break;
      currentURL = res.headers.get("Location")!;
    }
    console.log("[ETA] Login finalized.");
  }

  async fetch(url: string, options: any = {}): Promise<Response> {
    if (this.#firstTime) {
      await this.login();
      this.#firstTime = false;
    }
    return fetchWithCookie(url, options, this.#jar);
  }
}


export { ETA };