# chatgpt-wechat
为你的微信公众号接入chatgpt，免服务器，只需APIkey。

修改的一位前端大佬的代码，附上大佬原文地址。

https://blog.csdn.net/weixin_42560424/article/details/129873490

# **更新日期：2023-09-26**

- 一：更换了代码平台：使用aircode，原本的Laf平台要收费或者免费的会时不时暂停容器服务。
- 二：优化了代码，响应速度提升。

**优化后实现效果**：![img](https://img.misdazzling.cn/i/2023/09/26/vvx1gm-2.webp)



**之前的实现效果：**

![aaa54ee232729665602bd330f865064](https://cdn.jsdelivr.net/gh/misdazzling/photobed@main/img/aaa54ee232729665602bd330f865064.jpg)



# 

# 1、前置工作

## 1.1   拥有自己的微信公众号

详细请参考下面的链接：

https://kf.qq.com/faq/120911VrYVrA151009eIrYvy.html

## 1.2  拥有openai的APIkey

提供一个购买APIkey的自动发卡网，注意不是我卖的哦。

购买链接：

https://eylink.cn/

## **2.1使用aircode平台**

网址：https://aircode.io/dashboard

![img](https://img.misdazzling.cn/i/2023/09/26/vxfb9x-2.webp)

![img](https://img.misdazzling.cn/i/2023/09/26/w0ojpd-2.webp)

按照图片，新建js文件,然后复制我的代码，修改代码的第六行和第七行。

第七行token是微信公众号后台你自己填的令牌（token）。

记住上面的这个链接，后面要用，是微信公众号的服务器地址（URL）。

然后Deploy部署。![image-20230926194811727](https://img.misdazzling.cn/i/2023/09/26/w7ukpl-2.webp)

## 2.2 在微信公众平台操作

登录微信公众平台，点开左侧的设置与开发，点击基本设置，服务器配置那里点击修改配置。

![image-20230926194622092](https://img.misdazzling.cn/i/2023/09/26/w6pzar-2.webp)

服务器地址（URL）填Aircode里面的接口。看下图，就是中间上面的这个链接。

![img](https://img.misdazzling.cn/i/2023/09/26/w0ojpd-2.webp)



令牌(Token)：自己填写，然后写在云函数的6行 token里面。

然后aircode的云函数重新点Deploy。

下边的EncodingAESKey点击右侧随机生成就行，然后点击提交。



![image-20230926194648840](https://img.misdazzling.cn/i/2023/09/26/w6vogq-2.webp)

返回token校验成功的话，我们就点击启用

![image-20230926194655582](https://img.misdazzling.cn/i/2023/09/26/w6x7d5-2.webp)

启用成功之后就可以在公众号对话框与ChatGPT对话啦，快去试试吧！











------



