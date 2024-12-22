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


| Title    | Domain               | Class name  | Note |
| -------- | -------------------- | ----------- | ---- |
| 统一身份认证 | zjuam.zju.edu.cn | `ZJUAM` | - |
| 智云课堂 | classroom.zju.edu.cn | `CLASSROOM` | -    |
| 本科教学管理信息服务平台     |    zdbk.zju.edu.cn    |   `ZDBK`  |   -   |
| 表单填报助手 | form.zju.edu.cn | `FORM` | -  |
| 学在浙大（wangxin） | course.zju.edu.cn | `COURSE` |  请注意两个学在浙大的区别  |
| 学在浙大（zju_web） | courses.zju.edu.cn | `COURSES` |  请注意两个学在浙大的区别  |
| 校园卡二维码页面（存疑） | yqfkgl.zju.edu.cn | `YQFKGL` |  用于`https://yqfkgl.zju.edu.cn/_web/_customizes/ykt/index3.jsp`，不排除其它path下会有其它登录流程  |
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
