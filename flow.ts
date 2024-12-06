import "dotenv/config";

const username = process.env.ZJU_USERNAME!;
const password = process.env.ZJU_PASSWORD!;

let cookies = {};

const pubkey_url = "https://zjuam.zju.edu.cn/cas/v2/getPubKey";
const login_url = "https://zjuam.zju.edu.cn/cas/login";

import { rsaEncrypt } from "./src/utils/RSA";

(async () => {
  const login_html = (await fetch(login_url).then((res) => {
    res.headers.getSetCookie().forEach((cookieStr) => {
      const [key, value] = cookieStr.split(";")[0].split("=");
      cookies[key] = value;
    });
    return res.text();
  })) as string;
  const execution =
    login_html.match(/name="execution" value="([^"]+)"/)?.[1] ?? "";
  const pubkey = await fetch(pubkey_url, {
    headers: {
      Cookie: Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join("; "),
    },
  }).then((res) => {
    res.headers.getSetCookie().forEach((cookieStr) => {
      const [key, value] = cookieStr.split(";")[0].split("=");
      cookies[key] = value;
    });
    return res.json();
  });

//   console.log(password,pubkey.modulus);
  

  const key = rsaEncrypt(password, pubkey.exponent, pubkey.modulus);

//   console.log(key);
//   console.log(cookies);
  
  
//   console.log([
//       "username=" + username,
//       "password=" + key,
//       "execution=" + execution,
//       "_eventId=" + "submit",
//       "authcode=",
//     ].join("&"));
    
    
    // throw new Error("stop");

  

  const login_res = await fetch(login_url, {
    method: "POST",
    body: [
      "username=" + username,
      "password=" + key,
      "execution=" + execution,
      "_eventId=" + "submit",
      "authcode=",
    ].join("&"),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
      Cookie: Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join("; "),
    },
    redirect: "manual",
  }).then(async (res) => {
    // console.log(await res.text());
    // console.log(res.headers.getSetCookie());
    res.headers.getSetCookie().forEach((cookieStr) => {
      const [key, value] = cookieStr.split(";")[0].split("=");
      cookies[key] = value;
    });
    if (res.status === 302) {
    //   console.log(res.headers.get("Location"));
      if (res.headers.get("Location")?.includes("service.zju.edu.cn")) {
        console.log("Login success");

        return;
      }
    } else if (res.status === 200) {
      const text = (await res.text()) as string;
      const message = text.match(/\<span id=\"msg\"\>([^<]+)<\/span>/)?.[1];
      console.log("Failed to login: " + message);
    } else {
      console.log("Failed to login with status code " + res.status);
    }
  });

  const getSERVICE = await fetch(login_url+"?service=https%3A%2F%2Fservice.zju.edu.cn%2F", {
    method: "GET",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
      Cookie: Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join("; "),
    },
    redirect: "manual",
  }).then(async(res)=>{
    res.headers.getSetCookie().forEach((cookieStr) => {
        const [key, value] = cookieStr.split(";")[0].split("=");
        cookies[key] = value;
      });
      if (res.status === 302) {
        console.log(res.headers.get("Location"));
        if (res.headers.get("Location")?.includes("service.zju.edu.cn")) {
          console.log("Login success");
  
          return;
        }
      } else if (res.status === 200) {
        const text = (await res.text()) as string;
        const message = text.match(/\<span id=\"msg\"\>([^<]+)<\/span>/)?.[1];
        console.log("Failed to login: " + message);
      } else {
        console.log("Failed to login with status code " + res.status);
      }
  })
})();
