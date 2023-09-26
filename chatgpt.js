const { db } = require('aircode');
const axios = require('axios');
const sha1 = require('sha1');
const xml2js = require('xml2js');

const TOKEN = process.env.TOKEN || '*********' // ΢�ŷ��������� Token ע�����token����������õ��Ǳ���Ҫ��΢�Ź��ںź�̨����һ��
const OPENAI_KEY = process.env.OPENAI_KEY || '****************'; // OpenAI �� Key

const OPENAI_MODEL = process.env.MODEL || "gpt-3.5-turbo"; // ʹ�õ� AI ģ��
const OPENAI_MAX_TOKEN = process.env.MAX_TOKEN || 1024; // ��� token ��ֵ

const LIMIT_HISTORY_MESSAGES = 50 // ������ʷ�Ự�������
const CONVERSATION_MAX_AGE = 60 * 60 * 1000 // ͬһ�Ự����������ڣ�Ĭ�ϣ�1 Сʱ
const ADJACENT_MESSAGE_MAX_INTERVAL = 10 * 60 * 1000 //ͬһ�Ự����������Ϣ�����������ʱ�䣬Ĭ�ϣ�10 ����

const UNSUPPORTED_MESSAGE_TYPES = {
  image: '�ݲ�֧��ͼƬ��Ϣ',
  voice: '�ݲ�֧��������Ϣ',
  video: '�ݲ�֧����Ƶ��Ϣ',
  music: '�ݲ�֧��������Ϣ',
  news: '�ݲ�֧��ͼ����Ϣ',
}

const WAIT_MESSAGE = `������ ... \n\n���Եȼ�����͡�1���鿴�ظ�\n����ظ���ʱ��δ���£��볢���������ʡ�`
const NO_MESSAGE = `�������ݣ����Ժ�ظ���1������`
const CLEAR_MESSAGE = `? ���������`
const HELP_MESSAGE =  `ChatGPT ָ��ʹ��ָ��
   |    �ؼ���  |   ����         |
   |      1    | ��һ������Ļظ� |
   |   /clear  |    ���������   |
   |   /help   |   ��ȡ�������  |
`

const Message = db.table('messages')
const Event = db.table('events')


const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function toXML(payload, content) {
  const timestamp = Date.now();
  const { ToUserName: fromUserName, FromUserName: toUserName } = payload;
  return `
  <xml>
    <ToUserName><![CDATA[${toUserName}]]></ToUserName>
    <FromUserName><![CDATA[${fromUserName}]]></FromUserName>
    <CreateTime>${timestamp}</CreateTime>
    <MsgType><![CDATA[text]]></MsgType>
    <Content><![CDATA[${content}]]></Content>
  </xml>
  `
}


async function processCommandText({ sessionId, question }) {
  // ������ʷ�Ự
  if (question === '/clear') {
    const now = new Date();
    await Message.where({ sessionId }).set({ deletedAt: now }).save()
    return CLEAR_MESSAGE;
  }
  else {
    return HELP_MESSAGE;
  }
}


// ���� prompt
async function buildOpenAIPrompt(sessionId, question) {
  let prompt = [];

  // ��ȡ�������ʷ�Ự
  const now = new Date();
  // const earliestAt = new Date(now.getTime() - CONVERSATION_MAX_AGE)
  const historyMessages = await Message.where({
    sessionId,
    deletedAt: db.exists(false),
  //  createdAt: db.gt(earliestAt),
  }).sort({ createdAt: -1 }).limit(LIMIT_HISTORY_MESSAGES).find();

  let lastMessageTime = now;
  let tokenSize = 0;
  for (const message of historyMessages) {
    // �����ʷ�Ự��¼���� OPENAI_MAX_TOKEN �� ���λỰ������� 10 ���ӣ���ֹͣ�����ʷ�Ự
    const timeSinceLastMessage = lastMessageTime ? lastMessageTime - message.createdAt : 0;
    if (tokenSize > OPENAI_MAX_TOKEN || timeSinceLastMessage > ADJACENT_MESSAGE_MAX_INTERVAL) {
      break
    }

    prompt.unshift({ role: 'assistant', content: message.answer, });
    prompt.unshift({ role: 'user', content: message.question, });
    tokenSize += message.token;
    lastMessageTime = message.createdAt;
  }

  prompt.push({ role: 'user', content: question });
  return prompt;
}


// ��ȡ OpenAI API �Ļظ�
async function getOpenAIReply(prompt) {
  const data = JSON.stringify({
    model: OPENAI_MODEL,
    messages: prompt
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.openai.com/v1/chat/completions',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    data: data,
    timeout: 50000
  };


  try {
      const response = await axios(config);
      console.debug(`[OpenAI response] ${response.data}`);
      if (response.status === 429) {
        return {
          error: '����̫���ˣ����е�ѣ�Σ����Ժ�����'
        }
      }
      // ȥ������Ļ���
      return {
        answer: response.data.choices[0].message.content.replace("\n\n", ""),
      }
  } catch(e){
     console.error(e.response.data);
     return {
      error: "����̫���� ������. (u��u��).",
    }
  }

}

// �����ı��ظ���Ϣ
async function replyText(message) {
  const { question, sessionId, msgid } = message;

  // ����Ƿ������Բ���
  if (question === '1') {
    const now = new Date();
    // const earliestAt = new Date(now.getTime() - CONVERSATION_MAX_AGE)
    const lastMessage = await Message.where({
      sessionId,
      deletedAt: db.exists(false),
    //  createdAt: db.gt(earliestAt),
    }).sort({ createdAt: -1 }).findOne();
    if (lastMessage) {
      return `${lastMessage.question}\n------------\n${lastMessage.answer}`;
    }

    return NO_MESSAGE;
  }

  // ����ָ��
  if (question.startsWith('/')) {
    return await processCommandText(message);
  }

  // OpenAI �ظ�����
  const prompt = await buildOpenAIPrompt(sessionId, question);
  const { error, answer } = await getOpenAIReply(prompt);
  console.debug(`[OpenAI reply] sessionId: ${sessionId}; prompt: ${prompt}; question: ${question}; answer: ${answer}`);
  if (error) {
    console.error(`sessionId: ${sessionId}; question: ${question}; error: ${error}`);
    return error;
  }

  // ������Ϣ
  const token = question.length + answer.length;
  const result = await Message.save({ token, answer, ...message });
  console.debug(`[save message] result: ${result}`);

  return `${question}\n------------\n${answer}`;
}



// ����΢���¼���Ϣ
module.exports = async function(params, context) {
  const requestId = context.headers['x-aircode-request-id'];

  // ǩ����֤
  if (context.method === 'GET') {
    const _sign = sha1(new Array(TOKEN, params.timestamp, params.nonce).sort().join(''))
    if (_sign !== params.signature) {
      context.status(403)
      return 'Forbidden'
    }

    return params.echostr
  }

  // ���� XML ����
  let payload;
  xml2js.parseString(params, { explicitArray: false }, function(err, result) {
    if (err) {
      console.error(`[${requestId}] parse xml error: `, err);
      return
    }
    payload = result.xml;
  })
  console.debug(`[${requestId}] payload: `, payload);

  // �ı�
  if (payload.MsgType === 'text') {
    const newMessage = {
      msgid: payload.MsgId,
      question: payload.Content.trim(),
      username: payload.FromUserName,
      sessionId: payload.FromUserName,
    }

    // �޸�������Ӧ��ʱ���⣺��� 5 ���� AI û�лظ����򷵻صȴ���Ϣ
    const responseText = await Promise.race([
      replyText(newMessage),
      sleep(4000.0).then(() => `${newMessage.question}\n------------\n${WAIT_MESSAGE}`),
    ]);
    return toXML(payload, responseText);
  }

  // �¼�
  if (payload.MsgType === 'event') {
    // ���ںŶ���
    if (payload.Event === 'subscribe') {
      return toXML(payload, HELP_MESSAGE);
    }
  }

  // �ݲ�֧�ֵ���Ϣ����
  if (payload.MsgType in UNSUPPORTED_MESSAGE_TYPES) {
    const responseText = UNSUPPORTED_MESSAGE_TYPES[payload.MsgType];
    return toXML(payload, responseText);
  }

  return 'success'
}