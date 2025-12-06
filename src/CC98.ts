const body = {
    client_id: "9a1fd200-8687-44b1-4c20-08d50a96e5cd",
    client_secret: "8b53f727-08e2-4509-8857-e34bf92b27f2",
}// can be found in main.js t.prototype.handleLogin

class CC98 {
    #accessToken = "";
    #refreshToken = "";
    #tokenType = "";
    #expiresIn = 0;
    #username: string;
    #password: string;
    constructor(username: string, password: string) {
        this.#username = username;
        this.#password = password;
    }
    async login() {
        console.log("[CC98] login begins")
        const response = await fetch("https://openid.cc98.org/connect/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({...body, username: this.#username, password: this.#password, grant_type: "password"}),
        });
        // const text = await response.text();
        // console.log(response.status,text);
        // throw 0;
        const data = await response.json();
        if (response.ok) {
            this.#accessToken = data.access_token;
            this.#refreshToken = data.refresh_token;
            this.#tokenType = data.token_type;
            this.#expiresIn = data.expires_in;
        }
        else {
            console.log("[CC98] login failed", data.error, data.error_description);
            throw new Error(`Login failed: ${data.error} - ${data.error_description}`);
        }
        console.log("[CC98] login successful");
        return true
    }

    async #refresh() {
        console.log("[CC98] token refresh begins");
        const response = await fetch("https://openid.cc98.org/connect/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                ...body,
                refresh_token: this.#refreshToken,
                grant_type: "refresh_token",
            }),
        });
        const data = await response.json();
        if (response.ok) {
            this.#accessToken = data.access_token;
            this.#refreshToken = data.refresh_token;
            this.#tokenType = data.token_type;
            this.#expiresIn = data.expires_in;
        }
        else {
            console.log("[CC98] token refresh failed", data.error, data.error_description);
            throw new Error(`Login failed: ${data.error} - ${data.error_description}`);
        }
        console.log("[CC98] token refresh successful");
        return true
    }

    async fetch(url: string, options: RequestInit = {}) {
        console.log("[CC98] fetch:", url);
        if (!this.#accessToken) {
            await this.login();
        }
        if (this.#expiresIn <= 60) { // Refresh token if it expires in less than 60 seconds
            await this.#refresh();
        }
        options.headers = {
            ...options.headers,
            Authorization: `${this.#tokenType} ${this.#accessToken}`,
        };
        
        return fetch(url, options);
    }
}

export { CC98 };