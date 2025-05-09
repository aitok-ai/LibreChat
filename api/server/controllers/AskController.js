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
const {
  handleAbortError,
  createAbortController,
  cleanupAbortController,
} = require('~/server/middleware');
const {
  disposeClient,
  processReqData,
  clientRegistry,
  requestDataMap,
} = require('~/server/cleanup');
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

  let client = null;
  let abortKey = null;
  let cleanupHandlers = [];
  let clientRef = null;

  logger.debug('[AskController]', {
    text,
    conversationId,
    ...endpointOption,
    modelsConfig: endpointOption?.modelsConfig ? 'exists' : '',
  });

  let userMessage = null;
  let userMessagePromise = null;
  let promptTokens = null;
  let userMessageId = null;
  let responseMessageId = null;
  let getAbortData = null;

  const sender = getResponseSender({
    ...endpointOption,
    model: endpointOption.modelOptions.model,
    modelDisplayLabel,
  });
  const initialConversationId = conversationId;
  const newConvo = !initialConversationId;
  const userId = req.user.id;

  let reqDataContext = {
    userMessage,
    userMessagePromise,
    responseMessageId,
    promptTokens,
    conversationId,
    userMessageId,
  };

  const updateReqData = (data = {}) => {
    reqDataContext = processReqData(data, reqDataContext);
    abortKey = reqDataContext.abortKey;
    userMessage = reqDataContext.userMessage;
    userMessagePromise = reqDataContext.userMessagePromise;
    responseMessageId = reqDataContext.responseMessageId;
    promptTokens = reqDataContext.promptTokens;
    conversationId = reqDataContext.conversationId;
    userMessageId = reqDataContext.userMessageId;
  };

  let { onProgress: progressCallback, getPartialText } = createOnProgress();

  const performCleanup = () => {
    logger.debug('[AskController] Performing cleanup');
    if (Array.isArray(cleanupHandlers)) {
      for (const handler of cleanupHandlers) {
        try {
          if (typeof handler === 'function') {
            handler();
          }
        } catch (e) {
          // Ignore
        }
      }
    }

    if (abortKey) {
      logger.debug('[AskController] Cleaning up abort controller');
      cleanupAbortController(abortKey);
      abortKey = null;
    }

    if (client) {
      disposeClient(client);
      client = null;
    }

    reqDataContext = null;
    userMessage = null;
    userMessagePromise = null;
    promptTokens = null;
    getAbortData = null;
    progressCallback = null;
    endpointOption = null;
    cleanupHandlers = null;
    addTitle = null;

    if (requestDataMap.has(req)) {
      requestDataMap.delete(req);
    }
    logger.debug('[AskController] Cleanup completed');
  };

  try {
    ({ client } = await initializeClient({ req, res, endpointOption }));
    if (clientRegistry && client) {
      clientRegistry.register(client, { userId }, client);
    }

    if (client) {
      requestDataMap.set(req, { client });
    }

    clientRef = new WeakRef(client);

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
    getAbortData = () => {
      const currentClient = clientRef?.deref();
      const currentText =
        currentClient?.getStreamText != null ? currentClient.getStreamText() : getPartialText();

      return {
        sender,
        conversationId,
        messageId: reqDataContext.responseMessageId,
        parentMessageId: overrideParentMessageId ?? userMessageId,
        text: currentText,
        userMessage: userMessage,
        userMessagePromise: userMessagePromise,
        promptTokens: reqDataContext.promptTokens,
      };
    };

    const { onStart, abortController } = createAbortController(
      req,
      res,
      getAbortData,
      updateReqData,
    );

    const closeHandler = () => {
      logger.debug('[AskController] Request closed');
      if (!abortController || abortController.signal.aborted || abortController.requestCompleted) {
        return;
      }
      abortController.abort();
      logger.debug('[AskController] Request aborted on close');
    };

    res.on('close', closeHandler);
    cleanupHandlers.push(() => {
      try {
        res.removeListener('close', closeHandler);
      } catch (e) {
        // Ignore
      }
    });

    const messageOptions = {
      user: userId,
      parentMessageId,
      conversationId: reqDataContext.conversationId,
      overrideParentMessageId,
      getReqData: updateReqData,
      onStart,
      abortController,
      progressCallback,
      progressOptions: {
        res,
      },
    };

    /** @type {TMessage} */
    let response = await client.sendMessage(text, messageOptions);
    response.endpoint = endpointOption.endpoint;

    const databasePromise = response.databasePromise;
    delete response.databasePromise;

    const { conversation: convoData = {} } = await databasePromise;
    const conversation = { ...convoData };
    conversation.title =
      conversation && !conversation.title ? null : conversation?.title || 'New Chat';

    const latestUserMessage = reqDataContext.userMessage;

    if (client?.options?.attachments && latestUserMessage) {
      latestUserMessage.files = client.options.attachments;
      if (endpointOption?.modelOptions?.model) {
        conversation.model = endpointOption.modelOptions.model;
      }
      delete latestUserMessage.image_urls;
    }

    if (!abortController.signal.aborted) {
      const finalResponseMessage = { ...response };

      sendMessage(res, {
        final: true,
        conversation,
        title: conversation.title,
        requestMessage: latestUserMessage,
        responseMessage: finalResponseMessage,
      });
      res.end();

      if (client?.savedMessageIds && !client.savedMessageIds.has(response.messageId)) {
        await saveMessage(
          req,
          { ...finalResponseMessage, user: userId },
          { context: 'api/server/controllers/AskController.js - response end' },
        );
      }
    }

    if (!client?.skipSaveUserMessage && latestUserMessage) {
      await saveMessage(req, latestUserMessage, {
        context: 'api/server/controllers/AskController.js - don\'t skip saving user message',
      });
    }

    if (typeof addTitle === 'function' && parentMessageId === Constants.NO_PARENT && newConvo) {
      addTitle(req, {
        text,
        response: { ...response },
        client,
      })
        .then(() => {
          logger.debug('[AskController] Title generation started');
        })
        .catch((err) => {
          logger.error('[AskController] Error in title generation', err);
        })
        .finally(() => {
          logger.debug('[AskController] Title generation completed');
          performCleanup();
        });
    } else {
      performCleanup();
    }
  } catch (error) {
    logger.error('[AskController] Error handling request', error);
    let partialText = '';
    try {
      const currentClient = clientRef?.deref();
      partialText =
        currentClient?.getStreamText != null ? currentClient.getStreamText() : getPartialText();
    } catch (getTextError) {
      logger.error('[AskController] Error calling getText() during error handling', getTextError);
    }

    handleAbortError(res, req, error, {
      sender,
      partialText,
      conversationId: reqDataContext.conversationId,
      messageId: reqDataContext.responseMessageId,
      parentMessageId: overrideParentMessageId ?? reqDataContext.userMessageId ?? parentMessageId,
      userMessageId: reqDataContext.userMessageId,
    })
      .catch((err) => {
        logger.error('[AskController] Error in `handleAbortError` during catch block', err);
      })
      .finally(() => {
        performCleanup();
      });
  }
};

module.exports = AskController;
