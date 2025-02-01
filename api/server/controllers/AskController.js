// const throttle = require('lodash/throttle');
const { saveMessage, getMessagesCount } = require('~/models');
// const { getResponseSender, Constants, EModelEndpoint } = require('librechat-data-provider');
// const { createAbortController, handleAbortError } = require('~/server/middleware');
// const { sendMessage, createOnProgress } = require('~/server/utils');
// const { saveMessage } = require('~/models');
// const { getResponseSender, Constants, CacheKeys, Time } = require('librechat-data-provider');
// const { createAbortController, handleAbortError } = require('~/server/middleware');
// const { sendMessage, createOnProgress } = require('~/server/utils');
// const { getLogStores } = require('~/cache');
// const { saveMessage } = require('~/models');
const { getResponseSender, Constants } = require('librechat-data-provider');
const { createAbortController, handleAbortError } = require('~/server/middleware');
const { sendMessage, createOnProgress } = require('~/server/utils');
// const { saveMessage } = require('~/models');
const { logger } = require('~/config');
const trieSensitive = require('../../utils/trieSensitive');
const User = require('../../models/User');

const AskController = async (req, res, next, initializeClient, addTitle) => {
  let {
    text,
    endpointOption,
    conversationId,
    modelDisplayLabel,
    parentMessageId = null,
    overrideParentMessageId = null,
  } = req.body;

  logger.debug('[AskController]', {
    text,
    conversationId,
    ...endpointOption,
    modelsConfig: endpointOption.modelsConfig ? 'exists' : '',
  });

  let userMessage;
  let userMessagePromise;
  let promptTokens;
  let userMessageId;
  let responseMessageId;
  const sender = getResponseSender({
    ...endpointOption,
    model: endpointOption.modelOptions.model,
    modelDisplayLabel,
  });
  const newConvo = !conversationId;
  const user = req.user.id;

  const getReqData = (data = {}) => {
    for (let key in data) {
      if (key === 'userMessage') {
        userMessage = data[key];
        userMessageId = data[key].messageId;
      } else if (key === 'userMessagePromise') {
        userMessagePromise = data[key];
      } else if (key === 'responseMessageId') {
        responseMessageId = data[key];
      } else if (key === 'promptTokens') {
        promptTokens = data[key];
      } else if (!conversationId && key === 'conversationId') {
        conversationId = data[key];
      }
    }
  };

  let getText;

  try {
    // const { client } = await initializeClient({ req, res, endpointOption });

    const { client } = await initializeClient({ req, res, endpointOption });
    /*const messageCache = getLogStores(CacheKeys.MESSAGES);
    const { onProgress: progressCallback, getPartialText } = createOnProgress({
      onProgress: throttle(
        ({ text: partialText }) => {
          //
              const unfinished = endpointOption.endpoint === EModelEndpoint.google ? false : true;
          messageCache.set(responseMessageId, {
            messageId: responseMessageId,
            sender,
            conversationId,
            parentMessageId: overrideParentMessageId ?? userMessageId,
            text: partialText,
            model: client.modelOptions.model,
            unfinished,
            error: false,
            user,
            senderId: req.user.id,
          }, Time.FIVE_MINUTES);
          //

          messageCache.set(responseMessageId, partialText, Time.FIVE_MINUTES);
        },
        3000,
        { trailing: false },
      ),
    });*/
    const { onProgress: progressCallback, getPartialText } = createOnProgress();

    getText = client.getStreamText != null ? client.getStreamText.bind(client) : getPartialText;

    const getAbortData = () => ({
      sender,
      conversationId,
      userMessagePromise,
      messageId: responseMessageId,
      parentMessageId: overrideParentMessageId ?? userMessageId,
      text: getText(),
      userMessage,
      promptTokens,
    });

    // const { abortController, onStart } = createAbortController(req, res, getAbortData);
    const { abortController, onStart } = createAbortController(req, res, getAbortData, getReqData);
    // try {
    // const { client } = await initializeClient({ req, res, endpointOption });

    const isSensitive = await trieSensitive.checkSensitiveWords(text);
    if (isSensitive) {
      //return handleError(res, { text: '请回避敏感词汇，谢谢！' });
      throw new Error('请回避敏感词汇，谢谢！');
    }

    let currentTime = new Date();
    const cur_user = await User.findById(req.user.id).exec();
    let quota = 0;
    if (cur_user && 'proMemberExpiredAt' in cur_user && cur_user.proMemberExpiredAt > currentTime) {
      // If not proMember, check quota
      quota = JSON.parse(process.env['CHAT_QUOTA_PER_MONTH_PRO_MEMBER']);
    } else {
      quota = JSON.parse(process.env['CHAT_QUOTA_PER_MONTH']);
    }

    let someTimeAgo = currentTime;
    someTimeAgo.setSeconds(currentTime.getSeconds() - 60 * 60 * 24 * 30); // 24 hours
    if (endpointOption.modelOptions.model in quota) {
      let messagesCount = await getMessagesCount({
        $and: [
          { senderId: req.user.id },
          { model: endpointOption.modelOptions.model },
          { updatedAt: { $gte: someTimeAgo } },
        ],
      });
      let dailyQuota = quota[endpointOption.modelOptions.model].toFixed(0);
      if (messagesCount >= dailyQuota) {
        throw new Error(
          `超出了您的使用额度(${endpointOption.modelOptions.model}模型每30天${dailyQuota}条消息)。由于需要支付越来越多、每月上万元的API费用，如果您经常使用我们的服务，请打开“我的主页”进行购买，支持我们持续提供GPT服务。`,
        );
      }
    }

    res.on('close', () => {
      logger.debug('[AskController] Request closed');
      if (!abortController) {
        return;
      } else if (abortController.signal.aborted) {
        return;
      } else if (abortController.requestCompleted) {
        return;
      }

      abortController.abort();
      logger.debug('[AskController] Request aborted on close');
    });

    const messageOptions = {
      user,
      parentMessageId,
      conversationId,
      overrideParentMessageId,
      getReqData,
      onStart,
      abortController,
      progressCallback,
      progressOptions: {
        res,
        // parentMessageId: overrideParentMessageId || userMessageId,
      },
    };

    /** @type {TMessage} */
    let response = await client.sendMessage(text, messageOptions);
    response.endpoint = endpointOption.endpoint;

    const { conversation = {} } = await client.responsePromise;
    conversation.title =
      conversation && !conversation.title ? null : conversation?.title || 'New Chat';

    if (client.options.attachments) {
      userMessage.files = client.options.attachments;
      conversation.model = endpointOption.modelOptions.model;
      delete userMessage.image_urls;
    }

    if (!abortController.signal.aborted) {
      sendMessage(res, {
        final: true,
        conversation,
        title: conversation.title,
        requestMessage: userMessage,
        responseMessage: response,
      });
      res.end();

      if (!client.savedMessageIds.has(response.messageId)) {
        await saveMessage(
          req,
          { ...response, user },
          { context: 'api/server/controllers/AskController.js - response end' },
        );
      }
    }

    if (!client.skipSaveUserMessage) {
      await saveMessage(req, userMessage, {
        context: 'api/server/controllers/AskController.js - don\'t skip saving user message',
      });
    }

    if (addTitle && parentMessageId === Constants.NO_PARENT && newConvo) {
      addTitle(req, {
        text,
        response,
        client,
      });
    }
  } catch (error) {
    var partialText = getText && getText();
    if (partialText == '') {
      partialText = error.message;
    }
    handleAbortError(res, req, error, {
      partialText,
      conversationId,
      sender,
      messageId: responseMessageId,
      parentMessageId: userMessageId ?? parentMessageId,
    });
  }
};

module.exports = AskController;
