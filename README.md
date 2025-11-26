# login-ZJU

Server-side library helping your application login to ZJU services

## Install

!!!NOTE: This library is not yet published to npm!

```sh
npm install login-zju
```

Before publish, you can clone the repo and run

```sh
node build.mjs
```

You can find the `login-ZJU.js` in the folder `./build`.

## Usage

!!!NOTE: When conpleted, it can be used through the way below.

Before publish, you may `import {Lib} from './path/to/login-ZJU'` instead of `from 'login-zju'`

This is mainly used for server-side applications.

### Current Implemented Services


| Title    | Domain               | Class name  | 上次成功时间 | Note |
| -------- | -------------------- | ----------- | ----------- | ---- |
| 统一身份认证 | zjuam.zju.edu.cn | `ZJUAM` | 2025/11/14 | - |
| 智云课堂 | classroom.zju.edu.cn | `CLASSROOM` | 2025/11/14 | -    |
| 本科教学管理信息服务平台     |    zdbk.zju.edu.cn   |   `ZDBK`  | 2025/11/14  |   -   |
| 表单填报助手 | form.zju.edu.cn | `FORM` | 2025/11/14 | -  |
| 学在浙大（zju_web） | courses.zju.edu.cn | `COURSES` | 2025/11/14 |    |
| 校园卡二维码页面 | yqfkgl.zju.edu.cn | `YQFKGL` | 2024/12/22 |  用于`https://yqfkgl.zju.edu.cn/_web/_customizes/ykt/index3.jsp`，不排除其它path下会有其它登录流程  |
| 浙大先生开放平台 | open.zju.edu.cn | `OPEN` | 2025/11/26 | 其实就是HiAgent  |

鉴于部分服务可能会变更登录流程，如果你发现你的登录流程炸了，请您务必提交一个issue来让我知道，万分感谢！

### Login to ZJU

```typescript
import { ZJUAM } from 'login-zju';

const me = new ZJUAM("username", "password");

me.fetch("https://zjuam.zju.edu.cn/path")

```

### Login to other services

If the service is implemented:

```typescript
import { ZJUAM, ZDBK } from 'login-zju';

const am = new ZJUAM("username", "password");
const ZDBK = new ZDBK(am);

ZDBK.fetch("/some/api")

```

If not implemented:

```typescript
import { ZJUAM } from 'login-zju';

const am = new ZJUAM("username", "password");

const callbackURL = await am.service("service_url")

// fetch(callbackURL) and you can get logged in. You may need to implement further cookie handler yourself.
```
