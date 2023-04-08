// 引入必要的库
import * as crypto from 'crypto';
import cloud from '@lafjs/cloud';

// 创建数据库连接
const db = cloud.database();
// 校验微信服务器发送的消息是否合法
function verifySignature(signature, timestamp, nonce, token) {
  const arr = [token, timestamp, nonce].sort();
  const str = arr.join('');
  const sha1 = crypto.createHash('sha1');
  sha1.update(str);
  return sha1.digest('hex') === signature;
}

// 处理接收到的消息
export async function main(event, context) {
  const { signature, timestamp, nonce, echostr } = event.query;
  const token = '你的token';
  const { ChatGPTAPI } = await import('chatgpt')
  const api = new ChatGPTAPI({ apiKey: "你的APIkey" })
  
  // 验证消息是否合法，若不合法则返回错误信息
  if (!verifySignature(signature, timestamp, nonce, token)) {
    return 'Invalid signature';
  }

  // 如果是首次验证，则返回 echostr 给微信服务器
  if (echostr) {
    return echostr;
  }

  // 处理接收到的消息
  const { fromusername, tousername, content } = event.body.xml;
  
  // 查询数据库中是否有上一次的聊天记录
  //根据用户名建立数据库，分开用户的请求。
  console.log(fromusername[0]);
  const db = cloud.database();
  const collectionName = fromusername[0];
  const collection = db.collection(collectionName);
  const chatData = await db.collection(collectionName).get();
  const lastMessage = chatData.data[chatData.data.length - 1];

 // 如果用户发送的是“1”，则判断回答是否以及生成。
 if (content[0] === '1'&&chatData.data.length==0) {
    
    return `
      <xml>
        <ToUserName><![CDATA[${fromusername}]]></ToUserName>
        <FromUserName><![CDATA[${tousername}]]></FromUserName>
        <CreateTime>${Date.now()}</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[${"回答还没有生成，请稍后再回复1，确定回答是否已经生成。"}]]></Content>
      </xml>
    `;
  }
  if (content[0] === '1'&&chatData.data.length!=0) {
    
    return `
      <xml>
        <ToUserName><![CDATA[${fromusername}]]></ToUserName>
        <FromUserName><![CDATA[${tousername}]]></FromUserName>
        <CreateTime>${Date.now()}</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[${"回答已经生成，请回复继续，以获得回答。"}]]></Content>
      </xml>
    `;
  }
  // 如果用户发送的是“继续”，则返回上一次的聊天记录
  if (content[0] === '继续' && lastMessage) {
    //清空数据库w
    await db.collection(collectionName).where({}).remove();
    return `
      <xml>
        <ToUserName><![CDATA[${fromusername}]]></ToUserName>
        <FromUserName><![CDATA[${tousername}]]></FromUserName>
        <CreateTime>${Date.now()}</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[${lastMessage.data.message}]]></Content>
      </xml>
    `;
  }

  // 调用 ChatGPT API 进行聊天
  const startTime = Date.now();
  // 如果响应时间大于等于 5s，则返回提示信息给用户
  if(startTime - (timestamp+"000") > 5000) {
    return `
      <xml>
        <ToUserName><![CDATA[${fromusername}]]></ToUserName>
        <FromUserName><![CDATA[${tousername}]]></FromUserName>
        <CreateTime>${Date.now()}</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[${"返回内容过长，请回复1来确定回答是否已经生成"}]]></Content>
      </xml>
    `;
  }
  const response = await api.sendMessage(content[0]);
  const endTime = Date.now();

  // 如果响应时间小于 5s，则直接返回结果给用户
  if (endTime - startTime < 5000) {
    return `
      <xml>
        <ToUserName><![CDATA[${fromusername}]]></ToUserName>
        <FromUserName><![CDATA[${tousername}]]></FromUserName>
        <CreateTime>${Date.now()}</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[${response.text}]]></Content>
      </xml>
    `;
  }else {
    // 如果响应时间大于等于 5s，则将结果存入数据库
    await db.collection(collectionName).add({ data: { message: response.text } });
    return `
      <xml>
        <ToUserName><![CDATA[${fromusername}]]></ToUserName>
        <FromUserName><![CDATA[${tousername}]]></FromUserName>
        <CreateTime>${Date.now()}</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[${"返回内容已生成，可以回复继续以获取最新结果。"}]]></Content>
      </xml>
    `;
  }

 

  
}

