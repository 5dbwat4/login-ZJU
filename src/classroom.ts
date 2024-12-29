import { createFetchSession } from "./utils/fetch-utils";
import type { ZJUAM } from "./zjuam";

class CLASSROOM {
  zjuamInstance: ZJUAM;
  token: string;
  constructor(am: ZJUAM) {
    this.zjuamInstance = am;
    this.token = "";
  }

  async login() {
    console.log(
      "[CLASSROOM] Attempting to login to classroom.zju.edu.cn"
    );

    return createFetchSession().then(async (session) => {
      await session
        .fetch(
          "https://tgmedia.cmc.zju.edu.cn/index.php?r=auth%2Flogin&forward=https%3A%2F%2Fclassroom.zju.edu.cn%2F",
          {
            redirect: "manual",
          }
        )
        .then(async (response) => {
          if (response.status === 302) {
            return response.headers.get("Location") as string;
          } else {
            throw new Error("Failed to login");
          }
        })
        .then(async (redirectUrl) => {
          // things like                 https://zjuam.zju.edu.cn/cas/oauth2.0/authorize?response_type=code&client_id=Oaaaaaaaaaaaaaaa&redirect_uri=http://tgmedia.cmc.zju.edu.cn/index.php?r=auth/get-info&url=https://classroom.zju.edu.cn/
          return this.zjuamInstance.loginSvc_oauth2(redirectUrl);
        })
        .then(async (callbackURL) => {
          /*
           *    Here there is a redirect
           *
           *     -> http://tgmedia.cmc.zju.edu.cn/index.php?r=auth/get-info&code=ST-2848273-yrnApl2GCwUZrd6ErCXt-zju.edu.cn
           *     -> https://tgmedia.cmc.zju.edu.cn/index.php?r=auth/get-info&code=ST-2848273-yrnApl2GCwUZrd6ErCXt-zju.edu.cn
           *     -> https://classroom.zju.edu.cn
           *
           *     That is stupid. I'm not sure will we follow it or the behavior will change.
           */

          if (callbackURL.startsWith("http://")) {
            callbackURL = callbackURL.replace("http://", "https://");
          }

          return session
            .fetch(callbackURL, {
              redirect: "manual",
            })
            .then(async (response) => {
              if (response.status === 302) {
                return response.headers.get("Location") as string;
              } else {
                throw new Error("Failed to login");
              }
            });
        });

      const token = decodeURIComponent(
        session.extractCookie(
          new URL("https://tgmedia.cmc.zju.edu.cn/").origin,
          "_token"
        )
      );
      // console.log(token);
      // 784834b3512089de67d5438a50f8cf416a32e42e93f9cad734cb06f11e2cbb81a:2:{i:0;s:6:"_token";i:1;s:677:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2N*********************************************************oxMTJ9.BPC15h1zPU3*************************FWUCehA";}

      // I'm using pattern match to parse the token. We need the JWT part.
      // We must assure the format of the token is consistent.

      // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      // This part is down once the format of token is changed!
      // Once the code failed to run. Inspect it!!!!!!
      this.token = token
        .split(":")
        .filter((c) => c.startsWith('"ey'))[0]
        .split('"')[1];
      // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

      return;
    });
  }

  async fetch(url: string, options: RequestInit = {}) {
    if (!this.token || this.token.length === 0) {
      await this.login();
    }

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${this.token}`,
    };

    return fetch(url, {
      headers,
    });
  }
}

export { CLASSROOM };
