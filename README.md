# login-ZJU

Server-side library helping your application login to ZJU services

## Install

!!!NOTE: This library is not yet published to npm!

```
npm install login-zju
```

## Usage

!!!NOTE: When conpleted, it can be used through the way below.

This is mainly used for server-side applications.

### Login to ZJU

```typescript
import { ZJUAM } from 'login-zju';

const me = new ZJUAM("username", "password");

```

### Login to other services

If the service is implemented:


```typescript
import { ZJUAM, ZDBK } from 'login-zju';

const am = new ZJUAM("username", "password");
const ZDBK = new ZDBK(am);

ZDBK.check() // whether you are connected to ZDBK

ZDBK.fetch("/some/api")

```

If not implemented:

```typescript
import { ZJUAM } from 'login-zju';

const am = new ZJUAM("username", "password");

const ticket = await am.service("service_url")

// use the ticket to login to the service
```

