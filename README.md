# chatgpt-wechat
为你的微信公众号接入chatgpt，免服务器，只需APIkey。

修改的一位前端大佬的代码，附上大佬原文地址。

https://blog.csdn.net/weixin_42560424/article/details/129873490

**实现效果：**

![aaa54ee232729665602bd330f865064](https://cdn.jsdelivr.net/gh/misdazzling/photobed@main/img/aaa54ee232729665602bd330f865064.jpg)

# 1、前置工作

## 1.1   拥有自己的微信公众号

详细请参考下面的链接：

https://kf.qq.com/faq/120911VrYVrA151009eIrYvy.html

## 1.2  拥有openai的APIkey

提供一个购买APIkey的自动发卡网，注意不是我卖的哦。

购买链接：

https://eylink.cn/

# 2.将chatgpt接入微信公众号

## 2.1 注册Laf平台账号

laf官网：https://laf.dev

注册登录之后，点击新建，建立一个应用。

![image-20230408035635487](https://cdn.jsdelivr.net/gh/misdazzling/photobed@main/img/image-20230408035635487.png)

输入应用名称，点击立即创建。



![image-20230408035816457](https://cdn.jsdelivr.net/gh/misdazzling/photobed@main/img/image-20230408035816457.png)



点击开发，进入应用开发界面。

![image-20230408035845977](https://cdn.jsdelivr.net/gh/misdazzling/photobed@main/img/image-20230408035845977.png)



然后先把chatgpt的依赖安装一下

![image-20230408035935778](https://cdn.jsdelivr.net/gh/misdazzling/photobed@main/img/image-20230408035935778.png)



点击加号，搜索chatgpt，选中第一个，点击安装并重启



![image-20230408040007862](https://cdn.jsdelivr.net/gh/misdazzling/photobed@main/img/image-20230408040007862.png)



然后我们点击函数，函数列表右侧的加号，新增一个可以介入微信公众号的chatgpt云函数。

![image-20230408040130475](https://cdn.jsdelivr.net/gh/misdazzling/photobed@main/img/image-20230408040130475.png)

点击确定。



云函数里面的代码是我放在chatgpt.js里面的代码。

20行ChatGPTAPI填自己的。

![image-20230408041210720](https://cdn.jsdelivr.net/gh/misdazzling/photobed@main/img/image-20230408041210720.png)

然后点击右上角的发布。



## 2.2 在微信公众平台操作

登录微信公众平台，点开左侧的设置与开发，点击基本设置，服务器配置那里点击修改配置。

![image-20230408040856004](https://cdn.jsdelivr.net/gh/misdazzling/photobed@main/img/image-20230408040856004.png)

服务器地址（URL）填Laf里面的接口。

![image-20230408041106032](https://cdn.jsdelivr.net/gh/misdazzling/photobed@main/img/image-20230408041106032.png)



令牌(Token)：自己填写，然后写在云函数的19行 token里面。

然后Laf的云函数重新点发布。

下边的EncodingAESKey点击右侧随机生成就行，然后点击提交。



![image-20230408041634573](https://cdn.jsdelivr.net/gh/misdazzling/photobed@main/img/image-20230408041634573.png)

返回token校验成功的话，我们就点击启用

![image-20230408041713094](https://cdn.jsdelivr.net/gh/misdazzling/photobed@main/img/image-20230408041713094.png)

启用成功之后就可以在公众号对话框与ChatGPT对话啦，快去试试吧！
