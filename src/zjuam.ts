import { rsaEncrypt } from "./utils/RSA";

const pubkey_url = "https://zjuam.zju.edu.cn/cas/v2/getPubKey";

// const login_url = "https://zjuam.zju.edu.cn/cas/login";

async function login_to_zjuam(username: string, password: string) {
  const pubkey = (await fetch(pubkey_url).then((res) => res.json())) as {
    modulus: string; // hex
    exponent: string;
  };
  // Encrypt password using node crypto
  // var key = new RSAUtils.getKeyPair(pubkey.exponent, "", pubkey.modulus);
  const key = rsaEncrypt(password, pubkey.exponent, pubkey.modulus);
}

class ZJUAM {
  username: string;
  password: string;
  cookies: { [key: string]: string };
  firstinLogin: boolean;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
    this.cookies = {};
    // this.login();
  }
  #_login(login_url: string): Promise<string> {
    console.log("[ZJUAM] Attempting to login to ZJUAM.");
    
    return new Promise(async (resolve, reject) => {
      //get execution
      const login_html = (await fetch(login_url)
        .then((res) => {
          res.headers.getSetCookie().forEach((cookieStr) => {
            const [key, value] = cookieStr.split(";")[0].split("=");
            this.cookies[key] = value;
          });
          return res.text();
        })
        .catch((e) => {
          reject({
            message: "Failed when fetch login page at first time.",
          });
          return;
        })) as string;
      // console.log(login_html);

      const execution =
        login_html.match(/name="execution" value="([^"]+)"/)?.[1] ?? "";

      if (!execution) {
        reject({
          message: "First-time login page doesn't contain execution string.",
        });
      }

      // console.log(execution);

      const pubkey = (await fetch(pubkey_url, {
        headers: {
          Cookie: Object.entries(this.cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
        },
      })
        .then((res) => {
          res.headers.getSetCookie().forEach((cookieStr) => {
            const [key, value] = cookieStr.split(";")[0].split("=");
            this.cookies[key] = value;
          });
          return res.json();
        })
        .catch((e) => {
          reject({
            message: "Failed when fetch pubkey.",
          });
        })) as {
        modulus: string; // hex
        exponent: string;
      };

      // Encrypt password using node crypto
      // var key = new RSAUtils.getKeyPair(pubkey.exponent, "", pubkey.modulus);
      // const reversedPwd = this.password.split("").reverse().join("");
      const key = rsaEncrypt(this.password, pubkey.exponent, pubkey.modulus);

      // console.log(key);

      // if (!key) {
      //   reject({
      //     message: "Fail to encrypt password.",
      //   });
      // }

      // throw new Error('Not implemented')
      const login_res = await fetch(login_url, {
        method: "POST",
        body: [
          "username=" + this.username,
          "password=" + key,
          "execution=" + execution,
          "_eventId=" + "submit",
          "authcode=",
        ].join("&"),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
          Cookie: Object.entries(this.cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
        },
        redirect: "manual",
      }).then(async (res) => {
        // console.log(await res.text())
        // console.log(res.headers.getSetCookie());
        res.headers.getSetCookie().forEach((cookieStr) => {
          const [key, value] = cookieStr.split(";")[0].split("=");
          this.cookies[key] = value;
        });
        if (res.status === 302) {
            this.firstinLogin=true;
            console.log("[ZJUAM] Login success.");
            
            resolve(res.headers.get("Location") as string);
        } else if (res.status === 200) {
          const text = (await res.text()) as string;
          const message = text.match(/\<span id=\"msg\"\>([^<]+)<\/span>/)?.[1];
          reject({
            message: "Failed to login: " + message,
          });
        } else {
          reject({
            message: "Failed to login with status code " + res.status,
          });
        }
      });
      // console.log(login_res);
    });
  }

  login(){
    return this.#_login("https://zjuam.zju.edu.cn/cas/login")
  }

  async fetch(url: string, options: RequestInit = {}) {
    if(!this.firstinLogin){
      await this.login().catch((e) => {
        console.error(e);
      });
    }
    // console.log(this.cookies);
    
    options.headers = {
      ...options.headers,
      Cookie: Object.entries(this.cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join("; "),
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",

    };
    // console.log(options);
    
    return fetch(url, options);
  }

  async loginSvc(service : string): Promise<string>{
    console.log("[ZJUAM] Attempting to login to service: "+service);
    
    const fullLoginStr = "https://zjuam.zju.edu.cn/cas/login?service="+encodeURIComponent(service)
    if(this.firstinLogin){
      return await this.fetch(fullLoginStr,{
        redirect:"manual",
        method:"GET"
      }).then(res=>{
        console.log("loginSvc,",res.status,res.headers.get("Location"));
        
        if(res.status==302){
          return res.headers.get("Location") as string
        }else if(res.status==200){
          return this.#_login(fullLoginStr)
        }
          return Promise.reject({
            "message":"Login failed with status "+res.status
          })  
      })
    }else{
      return this.#_login(fullLoginStr)
    }
  }
}

export { ZJUAM };
