# 2026/4/20 v1.0.9

- 新增了 alt.zju.edu.cn (教在浙大) 的支持

# 2026/4/14 v1.0.8

- 新增了对图书馆两套系统的支持
- eta目前不稳定，虽然写了支持但感觉登录流程经常变，暂时不推荐使用

# 2025/12/06 v1.0.7

- 新增了 cc98.org 的支持

# 2025/12/01 v1.0.6

- Add type:module to ensure module import works fine with older node.



# 2025/11/25 v1.0.4

- 新增了 open.zju.edu.cn (浙大先生开放平台) 的支持
- 重构了 yqfkgl.zju.edu.cn (校园卡二维码页面) 的登录流程，支持新的cookieJar模式

# 2025/11/20 v1.0.3

- 添加了一些更多的log输出

# 2025/11/14 v1.0.2

把所有的fetchWithCookie统一了起来

所有目前已实现的功能全部复查了一遍。

form.zju.edu.cn：`https://form.zju.edu.cn/dfi/validateLogin?ticket=[Redacted]&service=https%3A%2F%2Fform.zju.edu.cn%2F%23%2Fv2%2FhomePage`，ticket之前是直接传的，现在改了
```js
            var r = Object(u["a"])("encode", e, "zntb666666666666")
              , i = "/dfi/validateLogin?ticket=" + r + "&service=" + t
```

在watch处加一个`u["a"]`看到这个函数来自

```js
    "Oh/x": function(e, t, a) {
        "use strict";
        a.d(t, "a", (function() {
            return c
        }
        ));
        var n = a("aqBw")
          , r = a.n(n)
          , i = a("NFKh")
          , o = a.n(i);
        function s(e, t) {
            var a = o.a.AES.decrypt(e, o.a.MD5(t), {
                iv: [],
                mode: o.a.mode.ECB,
                padding: o.a.pad.Pkcs7
            })
              , n = a.toString(o.a.enc.Utf8);
            return n.toString()
        }
        function l(e, t) {
            var a = o.a.enc.Utf8.parse(e)
              , n = o.a.AES.encrypt(a, o.a.MD5(t), {
                iv: [],
                mode: o.a.mode.ECB,
                padding: o.a.pad.Pkcs7
            });
            return n.toString()
        }
        function c(e, t, a) {
            return t = "encode" == e ? r.a.encode(l(t, a)) : s(r.a.decode(t), a),
            t
        } // <---- HERE
    },
```

也就是`Base64(AES_enc(ticket, MD5("zntb666666666666")))`

经验证正确

courses.zju.edu.cn：登录过程中加了一个STATUS 200的

```html
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>The Tudors</title>
                <meta http-equiv="refresh" content="0;URL=https://courses.zju.edu.cn" />
</head>
<body>
</body>
</html>
```

鉴定为纯恶心人